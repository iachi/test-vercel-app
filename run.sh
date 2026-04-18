#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

say()  { printf '\033[1;36m==>\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31mxx \033[0m %s\n' "$*" >&2; exit 1; }

[[ -f .env.local         ]] || die ".env.local missing — run ./setup.sh first"
[[ -d node_modules       ]] || die "node_modules missing — run ./setup.sh first"
[[ -x .venv/bin/uvicorn  ]] || die ".venv missing or incomplete — run ./setup.sh first"

# shellcheck disable=SC1091
set -a; source .env.local; set +a

[[ -n "${INTERNAL_API_KEY:-}" ]] || die "INTERNAL_API_KEY is empty in .env.local"
[[ -n "${INTERNAL_API_URL:-}" ]] || die "INTERNAL_API_URL is empty in .env.local"
[[ -n "${DATABASE_URL:-}"     ]] || die "DATABASE_URL is empty in .env.local"
if [[ "$DATABASE_URL" == *"USER:PASSWORD@HOST"* ]]; then
  die "DATABASE_URL still contains the placeholder — edit .env.local with your real Supabase URL"
fi

check_port() {
  local port=$1
  if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then
    local who
    who=$(lsof -nP -iTCP:"$port" -sTCP:LISTEN | awk 'NR==2 {print $1" (pid "$2")"}')
    die "port $port already in use by $who — stop it and retry"
  fi
}
check_port 3000
check_port 8000

NEXT_PID=""
API_PID=""

cleanup() {
  trap - INT TERM EXIT
  printf '\n'
  say "Shutting down"
  [[ -n "$API_PID"  ]] && kill "$API_PID"  2>/dev/null || true
  [[ -n "$NEXT_PID" ]] && kill "$NEXT_PID" 2>/dev/null || true
  wait 2>/dev/null || true
}
trap cleanup INT TERM EXIT

say "Starting FastAPI (uvicorn) on :8000"
.venv/bin/uvicorn api.index:app --reload --port 8000 &
API_PID=$!

say "Starting Next.js on :3000"
npx next dev &
NEXT_PID=$!

printf '\n'
say "Next.js  -> http://localhost:3000  (pid $NEXT_PID)"
say "FastAPI  -> http://localhost:8000  (pid $API_PID)"
say "Ctrl-C to stop both."
printf '\n'

# Wait until either child exits, then let the trap tear the other down.
# (Using a poll loop instead of `wait -n` because macOS ships Bash 3.2.)
while :; do
  if ! kill -0 "$API_PID" 2>/dev/null; then
    say "FastAPI exited"
    break
  fi
  if ! kill -0 "$NEXT_PID" 2>/dev/null; then
    say "Next.js exited"
    break
  fi
  sleep 1
done
