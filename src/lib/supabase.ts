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
  _client = createClient(url, key, {
    auth: {
      // Bypass the Web Locks API (navigator.locks). Inside iframed/preview
      // environments — notably Replit's editor webview — the lock can stall and
      // make auth calls (signInWithPassword, getSession) hang forever. The lock
      // only coordinates token refresh across tabs; running the critical section
      // directly is safe for this single-session app.
      lock: async (_name: string, _acquireTimeout: number, fn: () => Promise<any>) => fn(),
    },
  });
  return _client;
}

export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseClient() as any)[prop];
  },
});
