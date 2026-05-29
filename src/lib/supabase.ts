import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

/**
 * True only once the server has injected real Supabase credentials onto `window`.
 * Callers guard with this before touching `supabase.*` so a missing/unconfigured
 * backend degrades gracefully (e.g. landing page still renders) instead of throwing.
 */
export function isSupabaseConfigured(): boolean {
  const url = (window as any).__SUPABASE_URL__ as string;
  const key = (window as any).__SUPABASE_ANON_KEY__ as string;
  return !!url && !!key;
}

export function getSupabaseClient(): SupabaseClient {
  if (_client) return _client;
  const url = (window as any).__SUPABASE_URL__ as string;
  const key = (window as any).__SUPABASE_ANON_KEY__ as string;
  if (!url || !key) throw new Error("Supabase config not injected");
  _client = createClient(url, key);
  return _client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseClient() as any)[prop];
  },
});
