#!/usr/bin/env bash
# Pull, build, restart, and verify. Fails loudly if the result is not healthy.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/academiaclaw}"
HEALTH_URL="http://127.0.0.1:8000/api/health"
HEALTH_RETRIES=15

cd "$APP_DIR"

if [ ! -f "$APP_DIR/.env" ]; then
  echo "error: $APP_DIR/.env is missing." >&2
  echo "       Run scripts/bootstrap_vps.sh first, or copy .env.example and fill it in." >&2
  exit 1
fi

echo "=== Pulling latest code ==="
git fetch --all
git reset --hard origin/main

echo "=== Building frontend ==="
cd "$APP_DIR/frontend"
npm ci --no-audit --no-fund 2>/dev/null || npm install --no-audit --no-fund
npm run build

echo "=== Updating backend dependencies ==="
cd "$APP_DIR"
"$APP_DIR/.venv/bin/pip" install --quiet -r "$APP_DIR/backend/requirements.txt"

echo "=== Syncing OpenClaw workspace config ==="
mkdir -p /root/.openclaw/workspace
cp "$APP_DIR/openclaw_config/"*.md /root/.openclaw/workspace/ 2>/dev/null || true

echo "=== Restarting service ==="
systemctl restart academiaclaw.service

echo "=== Waiting for health ==="
# The old script swallowed a failed check with `|| echo`, so a broken deploy
# still reported success. Poll, then fail with the journal if it never comes up.
for i in $(seq 1 "$HEALTH_RETRIES"); do
  if curl -fsS --max-time 3 "$HEALTH_URL" >/dev/null 2>&1; then
    echo "  healthy after ${i}s"
    break
  fi
  if [ "$i" -eq "$HEALTH_RETRIES" ]; then
    echo "error: service did not become healthy in ${HEALTH_RETRIES}s" >&2
    journalctl -u academiaclaw.service -n 40 --no-pager >&2
    exit 1
  fi
  sleep 1
done

echo "=== Verifying the API is not publicly readable ==="
CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 http://127.0.0.1:8000/api/tasks)
if [ "$CODE" != "401" ]; then
  echo "error: /api/tasks answered $CODE without a token, expected 401." >&2
  echo "       Deployment left the API open. Investigate before exposing this host." >&2
  exit 1
fi
echo "  anonymous request correctly refused (401)"

echo "=== Deployment successful ==="
