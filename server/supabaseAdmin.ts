import { createClient } from "@supabase/supabase-js";

// Node 20 lacks native WebSocket — stub it so Supabase Realtime doesn't crash on import
if (!(globalThis as any).WebSocket) {
  (globalThis as any).WebSocket = class FakeWS {
    constructor() {}
    addEventListener() {}
    removeEventListener() {}
    close() {}
  };
}

const supabaseUrl = process.env.SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

function createAdminClient() {
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: fetch },
  });
}

export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(_target, prop) {
    const client = createAdminClient();
    if (!client) {
      if (prop === "auth") return { getUser: async () => ({ data: { user: null }, error: new Error("Supabase not configured") }) };
      return () => Promise.resolve({ data: null, error: new Error("Supabase not configured") });
    }
    return (client as any)[prop];
  },
});

export type TierName = "none" | "trial" | "playwright" | "director" | "studio";

export interface AccessTier {
  tier: TierName;
  phases_allowed: number;
  studio_productions_limit: number | null;
  character_grids_limit: number | null;
  shot_generations_limit: number | null;
  video_promotions_limit: number | null;
}

export const TIERS: Record<TierName, AccessTier> = {
  none:       { tier: "none",       phases_allowed: 0, studio_productions_limit: 0,    character_grids_limit: 0,    shot_generations_limit: 0,   video_promotions_limit: 0  },
  trial:      { tier: "trial",      phases_allowed: 3, studio_productions_limit: 1,    character_grids_limit: 0,    shot_generations_limit: 0,   video_promotions_limit: 0  },
  playwright: { tier: "playwright", phases_allowed: 3, studio_productions_limit: 3,    character_grids_limit: 0,    shot_generations_limit: 0,   video_promotions_limit: 0  },
  director:   { tier: "director",   phases_allowed: 6, studio_productions_limit: 3,    character_grids_limit: 15,   shot_generations_limit: 30,  video_promotions_limit: 10 },
  studio:     { tier: "studio",     phases_allowed: 6, studio_productions_limit: null, character_grids_limit: 50,   shot_generations_limit: 150, video_promotions_limit: 50 },
};

// Map an infinitestudioai.com app_subscriptions.tier to a Muse access tier.
// studio_lot → director (all phases, capped quota); executive_producer → studio (max quota).
function membershipTierToMuse(tier: string | null | undefined): TierName {
  const v = (tier || "").toLowerCase().trim();
  if (v === "executive_producer") return "studio";
  if (v === "studio_lot") return "director";
  return "director"; // unknown active/trialing paid tier → grant director-level access
}

/**
 * Verify a Supabase JWT and return the user id.
 */
export async function verifyToken(authHeader: string | undefined): Promise<string | null> {
  if (!authHeader?.startsWith("Bearer ")) return null;
  const token = authHeader.slice(7);
  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) return null;
  return data.user.id;
}

/**
 * Resolve a user's Muse access tier from the SHARED infinitestudioai.com Supabase.
 * Mirrors the website's access rule:
 *   1. users.is_admin = true            → top access (studio)
 *   2. app_subscriptions (active/trialing) → mapped by `tier`
 *      (studio_lot → director, executive_producer → studio)
 *   3. user_profiles.studio_trial_used = false → one-time Muse trial (phases 1-3)
 *   4. otherwise → none
 * NOTE: app_subscriptions.user_id is the internal users.id, NOT the Supabase auth id,
 * so we resolve users.id from supabase_id first.
 */
export async function resolveAccessTier(userId: string): Promise<AccessTier> {
  // The website user row, keyed by the Supabase auth id.
  const { data: userRow } = await supabaseAdmin
    .from("users")
    .select("id, is_admin")
    .eq("supabase_id", userId)
    .maybeSingle();

  // Admins bypass all paywalls.
  if (userRow?.is_admin === true) return TIERS.studio;

  // Active or trialing membership → map the subscription tier.
  if (userRow?.id) {
    const { data: sub } = await supabaseAdmin
      .from("app_subscriptions")
      .select("tier, status, created_at")
      .eq("user_id", userRow.id)
      .in("status", ["active", "trialing"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (sub?.tier) return TIERS[membershipTierToMuse(sub.tier)];
  }

  // Non-member: optional one-time Muse trial (Phases 1-3) via the user_profiles flag.
  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("studio_trial_used")
    .eq("id", userId)
    .maybeSingle();
  if (profile && profile.studio_trial_used === false) return TIERS.trial;

  return TIERS.none;
}

export interface UsageState {
  productions_used: number;
  character_grids_used: number;
  shot_generations_used: number;
  video_promotions_used: number;
}

/** Read the current month's usage counters for a user (0s if no row yet). */
export async function getMonthlyUsage(userId: string): Promise<UsageState> {
  const month = new Date().toISOString().slice(0, 7);
  const { data } = await supabaseAdmin
    .from("studio_usage")
    .select("productions_used, character_grids_used, shot_generations_used, video_promotions_used")
    .eq("user_id", userId)
    .eq("month", month)
    .maybeSingle();
  return {
    productions_used: (data as any)?.productions_used ?? 0,
    character_grids_used: (data as any)?.character_grids_used ?? 0,
    shot_generations_used: (data as any)?.shot_generations_used ?? 0,
    video_promotions_used: (data as any)?.video_promotions_used ?? 0,
  };
}

/** Whether the user still has a Muse trial available (default: no). */
export async function getTrialUsed(userId: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("user_profiles")
    .select("studio_trial_used")
    .eq("id", userId)
    .maybeSingle();
  return data?.studio_trial_used ?? true;
}

export type UsageField = "character_grids_used" | "shot_generations_used" | "video_promotions_used";

/**
 * Check generation limit and increment counter if allowed.
 * Returns { allowed, used, limit }.
 */
export async function checkAndIncrementUsage(
  userId: string,
  field: UsageField,
  tier: AccessTier
): Promise<{ allowed: boolean; used: number; limit: number | null }> {
  const month = new Date().toISOString().slice(0, 7);
  const limitKey = field.replace("_used", "_limit") as keyof AccessTier;
  const limit = tier[limitKey] as number | null;

  // Ensure row exists for this month
  await supabaseAdmin
    .from("studio_usage")
    .upsert(
      { user_id: userId, month, [field]: 0 },
      { onConflict: "user_id,month", ignoreDuplicates: true }
    );

  const { data } = await supabaseAdmin
    .from("studio_usage")
    .select(field)
    .eq("user_id", userId)
    .eq("month", month)
    .single();

  const current: number = (data as any)?.[field] ?? 0;

  if (limit !== null && current >= limit) {
    return { allowed: false, used: current, limit };
  }

  await supabaseAdmin
    .from("studio_usage")
    .update({ [field]: current + 1 })
    .eq("user_id", userId)
    .eq("month", month);

  return { allowed: true, used: current + 1, limit };
}
