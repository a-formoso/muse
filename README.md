# Muse

**Muse** is the AI production engine — a product of [Infinite Studio](https://infinitestudioai.com).

It guides you through a six-phase pipeline that turns a single premise into a complete
pre-production package: story architecture → characters → screenplay → visuals →
storyboard shots → final assembly. Text and image generation run on Google Gemini,
storyboard/shot jobs on Higgsfield, optional voice synthesis on ElevenLabs, with
Supabase for auth and project persistence.

Deployed as a subdomain of Infinite Studio (`muse.infinitestudioai.com`).

## Tech stack

- **Frontend:** React 19 + TypeScript, Vite, TailwindCSS 4
- **Backend:** Express (`server.ts`), bundled with esbuild
- **Services:** Google Gemini (`@google/genai`), Higgsfield, ElevenLabs, Supabase

## Run locally

**Prerequisites:** Node.js 20+

1. Install dependencies:
   ```
   npm install
   ```
2. Create a `.env` (or `.env.local`) from [.env.example](.env.example) and fill in your keys.
   At minimum you need `GEMINI_API_KEY`; the app degrades gracefully without the others.
3. Start the dev server (Vite + Express on port 5000):
   ```
   npm run dev
   ```

## Build & run for production

```
npm run build   # Vite frontend → dist/, esbuild server → dist/server.cjs
npm run start   # node dist/server.cjs
```

## Deploy (Replit)

The repo includes a `.replit` config targeting Replit's autoscale deployment:
build runs `npm run build`, the service runs `node dist/server.cjs` on port 5000.
Set the environment variables from [.env.example](.env.example) in the Replit Secrets
panel rather than committing a `.env` file.
