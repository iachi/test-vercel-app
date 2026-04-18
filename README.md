# Contacts Dashboard — Next.js + FastAPI on Vercel

A one-screen dashboard that saves a name and phone number to a Postgres database.

## Submission

- **Live URL:** https://test-vercel-app-zeta.vercel.app
- **Repository:** https://github.com/iachi/test-vercel-app (public read access)

---

- **Frontend:** Next.js 15 (App Router, React 19, Tailwind CSS) — organized around **MVVM** (`lib/models/`, `lib/viewmodels/`, `app/contact-form.tsx` as View).
- **Backend:** FastAPI, deployed as a Vercel Python Function — organized around **Layered Architecture** (`controllers/` → `services/` → `repositories/` → `models/`, with shared infra in `core/`).
- **Database:** Supabase Postgres (pooler, port 6543).
- **Auth between layers:** shared `INTERNAL_API_KEY` header (`X-Internal-Key`). The browser never sees it — the Next.js Server Action injects it server-side.

## How it works

```
browser ──▶ Next.js Server Action ──X-Internal-Key──▶ FastAPI ──▶ Postgres
```

Every FastAPI route requires `X-Internal-Key` and rejects anything else with 401.

## Local run

Prereqs: Node 18+, Python 3.10+ (the backend uses PEP 604 `str | None` syntax), and a Postgres database (Supabase is easiest — use the pooler URL).

```bash
./setup.sh   # once per clone — venv, pip, npm install, .env.local, optional schema apply
# edit .env.local → set DATABASE_URL (setup.sh prompts for it and generates INTERNAL_API_KEY)
./run.sh     # pre-flight checks, then starts Next on :3000 and FastAPI on :8000
```

Open http://localhost:3000 and submit the form.

<details>
<summary>Or, do it manually</summary>

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
npm install
cp .env.local.example .env.local   # then edit it
psql "$DATABASE_URL" -f sql/schema.sql   # one time
npm run dev                              # starts Next + uvicorn via `concurrently`
```

`next.config.mjs` rewrites `/api/py/*` to `http://127.0.0.1:8000` in dev, so the Server Action hits uvicorn through the same origin as the browser.

</details>

## Environment variables

| Name | Purpose | Example |
|---|---|---|
| `DATABASE_URL` | Postgres connection string. For Supabase, use the **pooled** URL (port 6543) with `sslmode=require`. | `postgresql://postgres.xxx:pw@aws-0-eu-west-1.pooler.supabase.com:6543/postgres?sslmode=require` |
| `INTERNAL_API_KEY` | Shared secret between Next.js and FastAPI. Generate with `openssl rand -hex 32`. | `a1b2c3...` |
| `INTERNAL_API_URL` | **Local only.** Where the Server Action reaches FastAPI. On Vercel, leave unset — the helper falls back to `https://$VERCEL_URL`. | `http://127.0.0.1:3000` |
| `VERCEL_AUTOMATION_BYPASS_SECRET` | Generated and injected by Vercel **only after** you turn on Settings → Deployment Protection → Protection Bypass for Automation. Required so Server Actions on protected Preview deployments can loop back through the Vercel edge. Leave unset locally. | *(Vercel-managed once enabled)* |

`.env.local` is gitignored. **Never commit real values.**

## Schema

Applied automatically on every Vercel build by the `prebuild` npm script (`scripts/apply-schema.mjs`), and applied locally by `setup.sh` if `psql` is available. Safe to re-run — uses `create table if not exists`.

```sql
create extension if not exists "pgcrypto";

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  created_at timestamptz not null default now()
);
```

## API endpoints (all require `X-Internal-Key`)

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/py/contacts` | Insert `{name, phone}`, returns the saved row |
| `GET`  | `/api/py/health`   | Liveness probe |

Quick checks:

```bash
# Without the key → 401
curl -i -X POST http://localhost:3000/api/py/contacts \
  -H 'content-type: application/json' \
  -d '{"name":"x","phone":"15551234567"}'

# Direct against uvicorn with the key → 201
curl -i -X POST http://localhost:8000/api/py/contacts \
  -H 'content-type: application/json' \
  -H "X-Internal-Key: $INTERNAL_API_KEY" \
  -d '{"name":"Ada","phone":"+1 555 123 4567"}'
```

## Validation

Enforced both in the client (`lib/models/contact.ts`) and in FastAPI (`api/services/contact_service.py`) — defense in depth, FastAPI is the source of truth.

- **name:** required, trimmed, 1–100 chars.
- **phone:** required, strip `[\s\-()]`, then match `^\+?\d{7,15}$` (7–15 digits, optional leading `+`).

## Deploy to Vercel

1. Push this repo to GitHub.
2. In Vercel, **New Project** → import the repo. Framework preset is detected as Next.js; no changes needed. `api/index.py` is auto-detected as a Python serverless function.
3. Under **Settings → Environment Variables**, set:
   - `DATABASE_URL` — Supabase pooled URL.
   - `INTERNAL_API_KEY` — new secret (`openssl rand -hex 32`).
4. **If Deployment Protection is enabled** (default on Preview deployments for Hobby/Pro): go to **Settings → Deployment Protection → Protection Bypass for Automation** and click **Add Bypass Secret**. Vercel generates the value and injects it as `VERCEL_AUTOMATION_BYPASS_SECRET` on every deploy — you don't set it by hand, but it won't exist until you flip this toggle. Without it, Server Actions on protected Preview deployments will 401 at the Vercel edge before ever reaching FastAPI. If your Production deployment is public (no protection), you can skip this step.
5. Deploy. `scripts/apply-schema.mjs` runs as the `prebuild` step and applies `sql/schema.sql` against `DATABASE_URL`. `vercel.json` rewrites `/api/py/*` to the Python function so URLs match local dev.

## Assumptions

- Single unauthenticated public dashboard — no user accounts, no rate limiting, no duplicate detection. The `X-Internal-Key` protects the FastAPI surface, not the form itself.
- Phone validation is intentionally permissive (plausible, not E.164-strict).
- Supabase pooler (port 6543, transaction mode) is the correct URL for serverless; the direct connection (port 5432) works but isn't recommended at scale.
- Schema is applied by the `prebuild` hook on Vercel (or `setup.sh` locally); no migration tool bundled. Re-applies are safe.
- Single-screen scope per the brief: form + inline confirmation only; no list view.

## How AI tooling was used (Claude Code, not Cursor)

- Used Claude Code in plan mode to survey the existing Next.js + FastAPI scaffold and confirm reuse points (`lib/backend.ts`, the `X-Internal-Key` pattern, Vercel rewrites) before writing any code.
- Asked it to propose the MVVM / Layered split as concrete file lists, then reviewed the plan before approving execution — the diffs were scoped to new files plus small edits to `api/index.py` and `app/page.tsx`.
- Verified each layer independently: `tsc --noEmit` for the frontend, `python -c "import api.index"` for the backend, and a live `psql` against Supabase to apply the schema.
- Patched React Server Components CVEs in the Next.js dependency chain with Claude Code, keeping the deploy on a supported security patch rather than a loose range.
- Worked through Vercel-specific production concerns with Claude Code: propagating `VERCEL_AUTOMATION_BYPASS_SECRET` on server-to-server fetches so protected Preview deployments don't 401 at the edge, and wiring `scripts/apply-schema.mjs` as a `prebuild` so every deploy lands the schema without a separate migration step.
- Hardened `setup.sh` and `run.sh` for cross-platform use with Claude Code: auto-detect Python ≥ 3.10 across common install locations, rebuild a stale `.venv` when its interpreter is too old, and poll for child exit since the default macOS bash lacks `wait -n`.
