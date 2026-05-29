import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { TIERS, type AccessTier, type TierName, type UsageState } from "../lib/accessTier";

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  accessTier: AccessTier;
  usage: UsageState;
  trialUsed: boolean;
  refreshAccess: () => Promise<void>;
  signOut: () => Promise<void>;
}

const defaultUsage: UsageState = {
  productions_used: 0,
  character_grids_used: 0,
  shot_generations_used: 0,
  video_promotions_used: 0,
};

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
  accessTier: TIERS.none,
  usage: defaultUsage,
  trialUsed: false,
  refreshAccess: async () => {},
  signOut: async () => {},
});

/**
 * Map a studio_plan string to a TierName.
 */
function studioPlantToTier(val: string | null | undefined): TierName | null {
  if (!val) return null;
  const v = val.toLowerCase().trim();
  if (v === "playwright") return "playwright";
  if (v === "director") return "director";
  if (v === "studio") return "studio";
  return null;
}

/**
 * Map an IS membership active_subscription_tier to a Studio TierName.
 * IS members get Director-equivalent access at minimum.
 */
function membershipTierToStudio(val: string | null | undefined): TierName | null {
  if (!val) return null;
  const v = val.toLowerCase().replace(/[_\s-]/g, "");
  if (v.includes("innercircle") || v.includes("inner")) return "studio";
  if (v.length > 0) return "director";
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessTier, setAccessTier] = useState<AccessTier>(TIERS.none);
  const [usage, setUsage] = useState<UsageState>(defaultUsage);
  const [trialUsed, setTrialUsed] = useState(false);
  const resolvedRef = useRef(false);

  const resolveAccess = useCallback(async (uid: string) => {
    try {
      let tier: TierName = "none";
      let profileTrialUsed = true; // default safe: no trial

      // ── Step 1: user_profiles — studio_plan + trial flag ──
      // studio_plan is the canonical source for Studio standalone subscriptions.
      const { data: profile } = await supabase
        .from("user_profiles")
        .select("studio_plan, studio_trial_used")
        .eq("id", uid)
        .maybeSingle();

      if (profile !== null && profile !== undefined) {
        profileTrialUsed = profile.studio_trial_used ?? true;
        const planTier = studioPlantToTier(profile.studio_plan);
        if (planTier) tier = planTier;
      }

      // ── Step 2: IS membership — users.active_subscription_tier ──
      // IS members get director-equivalent or better if they have no explicit studio_plan.
      if (tier === "none") {
        const { data: userRow } = await supabase
          .from("users")
          .select("active_subscription_tier")
          .eq("supabase_id", uid)
          .maybeSingle();

        const memberTier = membershipTierToStudio(userRow?.active_subscription_tier);
        if (memberTier) tier = memberTier;
      }

      // ── Step 3: app_subscriptions fallback ──
      if (tier === "none") {
        const { data: appSub } = await supabase
          .from("app_subscriptions")
          .select("plan_name, status, amount")
          .eq("user_id", uid)
          .eq("status", "active")
          .limit(1)
          .maybeSingle();

        if (appSub) {
          const planTier = studioPlantToTier(appSub.plan_name);
          if (planTier) {
            tier = planTier;
          } else {
            const memberTier = membershipTierToStudio(appSub.plan_name);
            tier = memberTier ?? "director";
          }
        }
      }

      // ── Step 4: trial — only if profile row exists and studio_trial_used = false ──
      if (tier === "none") {
        setTrialUsed(profileTrialUsed);
        if (profile !== null && profile !== undefined && !profileTrialUsed) {
          tier = "trial";
        }
      }

      console.log(`[AuthContext] uid=${uid.slice(0, 8)}… → tier=${tier}`);
      setAccessTier(TIERS[tier]);

      // ── Step 5: load current month usage ──
      const month = new Date().toISOString().slice(0, 7);
      const { data: usageRow } = await supabase
        .from("studio_usage")
        .select("*")
        .eq("user_id", uid)
        .eq("month", month)
        .maybeSingle();

      setUsage({
        productions_used: usageRow?.productions_used ?? 0,
        character_grids_used: usageRow?.character_grids_used ?? 0,
        shot_generations_used: usageRow?.shot_generations_used ?? 0,
        video_promotions_used: usageRow?.video_promotions_used ?? 0,
      });
    } catch (e) {
      console.error("resolveAccess error:", e);
      setAccessTier(TIERS.none);
    }
  }, []);

  const refreshAccess = useCallback(async () => {
    if (user) {
      resolvedRef.current = false;
      await resolveAccess(user.id);
    }
  }, [user, resolveAccess]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setAccessTier(TIERS.none);
    setUsage(defaultUsage);
    setTrialUsed(false);
    resolvedRef.current = false;
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setUser(data.session?.user ?? null);
      setLoading(false);
      if (data.session?.user && !resolvedRef.current) {
        resolvedRef.current = true;
        resolveAccess(data.session.user.id);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user && !resolvedRef.current) {
        resolvedRef.current = true;
        resolveAccess(sess.user.id);
      }
      if (!sess) {
        resolvedRef.current = false;
        setAccessTier(TIERS.none);
        setUsage(defaultUsage);
        setTrialUsed(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [resolveAccess]);

  return (
    <AuthContext.Provider value={{ session, user, loading, accessTier, usage, trialUsed, refreshAccess, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
