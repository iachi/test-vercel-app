# Contacts Dashboard

One-screen dashboard: submit a name + phone number, persist it to Supabase Postgres, see inline confirmation.

- **Frontend**: Next.js 15 (App Router, React 19, Tailwind) organized around **MVVM** — `lib/models/`, `lib/viewmodels/`, `app/contact-form.tsx` (View).
- **Backend**: FastAPI on Vercel's Python runtime organized around **Layered Architecture** — `api/controllers/` → `api/services/` → `api/repositories/` → `api/models/`, with shared infra in `api/core/`.
- **Database**: Supabase Postgres (pooler, port 6543).
- **Gate**: the browser never talks to FastAPI directly — Next.js server code adds an `X-Internal-Key` header via `lib/backend.ts`.

## Architecture

```
Browser ─► <ContactForm> (View)
             │
             ▼
         useContactForm (ViewModel) ── validateContact (Model)
             │
             ▼  server action
         app/actions.ts ── backendFetch (adds X-Internal-Key)
             │
             ▼
         /api/py/contacts  (FastAPI)
             │   router → service → repository
             ▼
         Supabase Postgres
```

## Layout

```
app/
  page.tsx              # server component shell
  contact-form.tsx      # View (client component)
  actions.ts            # "use server" bridge to FastAPI
lib/
  backend.ts            # server-only fetch helper (adds internal key)
  models/contact.ts     # types + validateContact()
  viewmodels/use-contact-form.ts  # stateful hook (name, phone, errors, status, submit)
api/
  index.py              # FastAPI app; mounts router + health check
  core/                 # config, db connection, security
  models/contact.py     # Pydantic ContactIn / ContactOut
  repositories/         # raw SQL
  services/             # business rules / validation
  controllers/          # APIRouter
sql/schema.sql          # run once in Supabase SQL editor
```

## Setup

```bash
npm install
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.local.example .env.local
# fill in .env.local (see below)
```

Apply the schema (one time, either in the Supabase SQL editor or via psql):

```bash
psql "$DATABASE_URL" -f sql/schema.sql
```

## Environment variables

| Var | Where | Notes |
| --- | --- | --- |
| `INTERNAL_API_KEY` | local + Vercel | Shared secret between Next.js server and FastAPI. `openssl rand -hex 32`. Server-only. |
| `INTERNAL_API_URL` | local only | `http://127.0.0.1:3000` so the server hits the Next.js dev rewrite to uvicorn. Leave unset on Vercel — the helper falls back to `$VERCEL_URL`. |
| `DATABASE_URL` | local + Vercel | Supabase pooler connection string, port 6543, `sslmode=require`. |

## Local development

```bash
npm run dev
```

Starts Next.js on `:3000` and uvicorn on `:8000` concurrently. Open http://localhost:3000, submit a name + phone, confirm the success panel, and verify the row in Supabase.

Sanity checks:

```bash
# Unauthenticated (no key) -> 401
curl -i -X POST http://localhost:3000/api/py/contacts \
  -H "Content-Type: application/json" \
  -d '{"name":"x","phone":"15551234567"}'

# Direct against uvicorn with the key -> 201
curl -i -X POST http://localhost:8000/api/py/contacts \
  -H "Content-Type: application/json" \
  -H "X-Internal-Key: $INTERNAL_API_KEY" \
  -d '{"name":"Ada","phone":"15551234567"}'
```

## Deploying to Vercel

1. `vercel link`
2. Set env vars for Production/Preview/Development:

   ```bash
   vercel env add INTERNAL_API_KEY
   vercel env add DATABASE_URL
   ```

3. `vercel deploy`. Vercel builds the Next.js app and auto-detects `api/index.py` as a Python serverless function. `vercel.json` rewrites `/api/py/*` to it.
4. Make sure the schema has been applied to the target Supabase project (`psql "$DATABASE_URL" -f sql/schema.sql`).

## Assumptions

- Schema is applied manually once per Supabase project; no migration tool bundled.
- Phone validation is region-agnostic: 7–15 digits with an optional leading `+`, stripping spaces/dashes/parentheses.
- No auth on the public form — anyone with the URL can submit. The internal key protects the FastAPI surface, not the form itself.
- Single-screen scope per the brief: form + inline confirmation only; no list view.

## AI usage

- Used Claude Code in plan mode to survey the existing Next.js + FastAPI scaffold and confirm reuse points (`lib/backend.ts`, the `X-Internal-Key` pattern, Vercel rewrites) before writing any code.
- Asked it to propose the MVVM / Layered split as concrete file lists, then reviewed the plan before approving execution — the diffs were scoped to new files plus small edits to `api/index.py` and `app/page.tsx`.
- Verified each layer independently: `tsc --noEmit` for the frontend, `python -c "import api.index"` for the backend, and a live `psql` against Supabase to apply the schema.
