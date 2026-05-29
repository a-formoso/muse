---
name: Supabase config injection pattern
description: How SUPABASE_URL and ANON_KEY reach the browser without VITE_ prefix env vars
---

**Rule:** Expose a GET /api/config endpoint on the Express server that returns `{ supabaseUrl, supabaseAnonKey }`. In main.tsx, fetch this before mounting React and attach values to `window.__SUPABASE_URL__` / `window.__SUPABASE_ANON_KEY__`. The Supabase browser client reads from those globals.

**Why:** Replit secrets are not automatically available as VITE_ prefixed env vars. Setting VITE_ vars via setEnvVars in code_execution fails because the sandbox can't read secret values. The /api/config approach is safe — anon keys are public-safe credentials.

**How to apply:**
- server.ts: `app.get("/api/config", (req, res) => res.json({ supabaseUrl: process.env.SUPABASE_URL, supabaseAnonKey: process.env.SUPABASE_ANON_KEY }))`
- main.tsx: fetch /api/config before createRoot, write to window globals
- src/lib/supabase.ts: createClient reads from `(window as any).__SUPABASE_URL__` etc. via a lazy Proxy
