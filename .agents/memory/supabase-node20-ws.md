---
name: Supabase Node 20 WebSocket fix
description: supabase-js RealtimeClient crashes on import in Node 20 (no native WebSocket); must stub globalThis.WebSocket before calling createClient on the server
---

**Rule:** In server/supabaseAdmin.ts (or any server-side Supabase client), stub `globalThis.WebSocket` before importing/calling `createClient`.

**Why:** Node 20 lacks native WebSocket. `@supabase/realtime-js` checks for it at module init time and throws `Error: Node.js 20 detected without native WebSocket support` — crashing the entire server process before any routes register.

**How to apply:**
```ts
if (!(globalThis as any).WebSocket) {
  (globalThis as any).WebSocket = class FakeWS {
    constructor() {}
    addEventListener() {}
    removeEventListener() {}
    close() {}
  };
}
```
Place this before the `createClient(...)` call. The stub is enough for auth + database operations — realtime subscriptions are not used server-side.
