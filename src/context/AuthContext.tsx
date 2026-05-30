import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase, isSupabaseConfigured } from "../lib/supabase";
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
// Tier resolution now lives server-side (see /api/access-tier); the client just
// reflects what the server returns.

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessTier, setAccessTier] = useState<AccessTier>(TIERS.none);
  const [usage, setUsage] = useState<UsageState>(defaultUsage);
  const [trialUsed, setTrialUsed] = useState(false);
  const resolvedRef = useRef(false);

  // Access tier + usage are resolved AUTHORITATIVELY on the server (service-role key,
  // against the shared infinitestudioai.com Supabase) via /api/access-tier — the single
  // source of truth so the UI matches what the server actually enforces.
  const resolveAccess = useCallback(async (_uid: string) => {
    try {
      const { data } = await (supabase as any).auth.getSession();
      const token = data?.session?.access_token;
      const resp = await fetch("/api/access-tier", {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await resp.json();
      if (json.accessTier) setAccessTier(json.accessTier as AccessTier);
      if (json.usage) setUsage(json.usage as UsageState);
      if (typeof json.trialUsed === "boolean") setTrialUsed(json.trialUsed);
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
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setSession(null);
    setUser(null);
    setAccessTier(TIERS.none);
    setUsage(defaultUsage);
    setTrialUsed(false);
    resolvedRef.current = false;
  }, []);

  useEffect(() => {
    // If the backend hasn't injected Supabase credentials, skip all auth
    // initialization and render unauthenticated — never throw and blank the app.
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

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
