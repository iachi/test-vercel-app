# test-vercel-app

Next.js (App Router) + FastAPI on Vercel, with all backend calls gated by a shared internal key so the browser can never hit FastAPI directly.

## Architecture

```
Browser ─► Next.js server component
             │  adds X-Internal-Key header
             ▼
         /api/py/*  (FastAPI, Vercel Python Function)
             │  validates X-Internal-Key
             ▼
         JSON response
```

- `app/` — Next.js frontend (TypeScript, Tailwind).
- `lib/backend.ts` — server-only helper; attaches `X-Internal-Key` on every call.
- `api/index.py` — FastAPI app mounted at `/api/py/*`.
- `vercel.json` — rewrites `/api/py/:path*` to the `api/index` Python function in production.
- `next.config.mjs` — in dev only, rewrites `/api/py/:path*` to local uvicorn on `:8000`.

## Setup

```bash
npm install
pip install -r requirements.txt
cp .env.local.example .env.local
# then edit .env.local and set INTERNAL_API_KEY (e.g. `openssl rand -hex 32`)
```

## Local development

```bash
npm run dev
```

This starts Next.js on `:3000` and uvicorn on `:8000` concurrently. Open http://localhost:3000 — the page server-fetches `/api/py/health` and renders the response.

Sanity checks:

```bash
# Through Next.js rewrite (no key) -> 401
curl -i http://localhost:3000/api/py/health

# Directly against uvicorn with the key -> 200 {"status":"ok"}
curl -i -H "X-Internal-Key: $INTERNAL_API_KEY" http://localhost:8000/api/py/health
```

## Deploying to Vercel

1. `vercel link`
2. Add `INTERNAL_API_KEY` for Production/Preview/Development:

   ```bash
   vercel env add INTERNAL_API_KEY
   ```

3. `vercel deploy`. Vercel auto-detects `api/index.py` as a Python serverless function and builds the Next.js app.
4. Verify the gate is live:

   ```bash
   curl -i https://<your-deployment>/api/py/health   # -> 401
   ```

## How the internal key works

- `INTERNAL_API_KEY` is a server-only env var — never prefixed with `NEXT_PUBLIC_`, so it is not shipped to the browser.
- `lib/backend.ts` imports `server-only`, guaranteeing it can only be used from server components and server code paths.
- FastAPI uses `hmac.compare_digest` to validate the header in constant time.
