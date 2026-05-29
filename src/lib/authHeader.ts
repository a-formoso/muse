import { supabase, isSupabaseConfigured } from "./supabase";

/**
 * Returns a Bearer Authorization header for the current Supabase session,
 * or an empty object if there's no session / Supabase isn't configured.
 * Attach to fetch() calls so the server can resolve the caller's subscription
 * tier (e.g. to pick the Claude model). Safe to call when unauthenticated.
 */
export async function getAuthHeader(): Promise<Record<string, string>> {
  if (!isSupabaseConfigured()) return {};
  try {
    const { data } = await (supabase as any).auth.getSession();
    const token = data?.session?.access_token;
    if (token) return { Authorization: `Bearer ${token}` };
  } catch {}
  return {};
}
