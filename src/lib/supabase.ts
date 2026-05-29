import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;

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
