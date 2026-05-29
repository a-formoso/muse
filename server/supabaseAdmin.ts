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

function studioPlantToTier(val: string | null | undefined): TierName | null {
  if (!val) return null;
  const v = val.toLowerCase().trim();
  if (v === "playwright") return "playwright";
  if (v === "director") return "director";
  if (v === "studio") return "studio";
  return null;
}

function membershipTierToStudio(val: string | null | undefined): TierName | null {
  if (!val) return null;
  const v = val.toLowerCase().replace(/[_\s-]/g, "");
  if (v.includes("innercircle") || v.includes("inner")) return "studio";
  if (v.length > 0) return "director";
  return null;
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
 * Resolve access tier using the real schema:
 *  1. user_profiles.studio_plan  (standalone Studio subscription)
 *  2. users.active_subscription_tier  (IS membership)
 *  3. app_subscriptions  (active rows)
 *  4. user_profiles.studio_trial_used  (trial gate)
 *  5. none
 */
export async function resolveAccessTier(userId: string): Promise<AccessTier> {
  // Step 1: studio_plan in user_profiles
  const { data: profile } = await supabaseAdmin
    .from("user_profiles")
    .select("studio_plan, studio_trial_used")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.studio_plan) {
    const t = studioPlantToTier(profile.studio_plan);
    if (t) return TIERS[t];
  }

  // Step 2: IS membership
  const { data: userRow } = await supabaseAdmin
    .from("users")
    .select("active_subscription_tier")
    .eq("supabase_id", userId)
    .maybeSingle();

  if (userRow?.active_subscription_tier) {
    const t = membershipTierToStudio(userRow.active_subscription_tier);
    if (t) return TIERS[t];
  }

  // Step 3: app_subscriptions
  const { data: appSub } = await supabaseAdmin
    .from("app_subscriptions")
    .select("plan_name, status, amount")
    .eq("user_id", userId)
    .eq("status", "active")
    .limit(1)
    .maybeSingle();

  if (appSub) {
    const t = studioPlantToTier(appSub.plan_name) ?? membershipTierToStudio(appSub.plan_name);
    if (t) return TIERS[t];
    return TIERS.director;
  }

  // Step 4: trial
  if (profile !== null && profile !== undefined && profile.studio_trial_used === false) {
    return TIERS.trial;
  }

  return TIERS.none;
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
