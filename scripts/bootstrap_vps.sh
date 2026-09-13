#!/usr/bin/env bash
#
# One-shot VPS setup for AcademiaClaw. Safe to re-run.
#
#   ssh -p <PORT> root@<HOST>
#   cd /opt/academiaclaw && git pull
#   OPENCLAW_GATEWAY_TOKEN=... NINE_ROUTER_API_KEY=... WHATSAPP_TO=628... \
#     ./scripts/bootstrap_vps.sh
#
# Generates JWT_SECRET itself. Refuses to continue on a credential that is still
# one of the values published in this repository's git history.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/academiaclaw}"
ENV_FILE="$APP_DIR/.env"
API="http://127.0.0.1:8000"
GATEWAY="${OPENCLAW_GATEWAY_URL:-http://127.0.0.1:18789}"

# SHA-256 of the credentials leaked in the public repo on 2026-09-01. Stored as
# hashes, not plaintext: this file is itself committed, and reprinting a secret to
# guard against it would republish the very thing being retired.
LEAKED_GATEWAY_TOKEN_SHA="6a3cafd135c20f816a4dbe4aa6ebe52b0e12274d0ea81086bb3958897fc73146"
LEAKED_ROUTER_KEY_SHA="4997f86a55bca8d747cdcd46c4757e9d81aa1cec32c8432ab2770cd12734ef11"

sha256() { printf '%s' "$1" | sha256sum | cut -d' ' -f1; }

ok()   { printf '  \033[32mok\033[0m   %s\n' "$1"; }
warn() { printf '  \033[33mwarn\033[0m %s\n' "$1"; }
die()  { printf '  \033[31mfail\033[0m %s\n' "$1" >&2; exit 1; }

[ "$(id -u)" -eq 0 ] || die "run as root"

echo "=== [1/7] Checking required secrets ==="
: "${OPENCLAW_GATEWAY_TOKEN:?set OPENCLAW_GATEWAY_TOKEN to the ROTATED gateway token}"
: "${NINE_ROUTER_API_KEY:?set NINE_ROUTER_API_KEY to the ROTATED model provider key}"
: "${WHATSAPP_TO:?set WHATSAPP_TO to the student number, E.164 without +, or a group JID}"

[ "$OPENCLAW_GATEWAY_TOKEN" != "$LEAKED_GATEWAY_TOKEN" ] \
  || die "OPENCLAW_GATEWAY_TOKEN is the value leaked in the public repo. Rotate it first."
[ "$NINE_ROUTER_API_KEY" != "$LEAKED_ROUTER_KEY" ] \
  || die "NINE_ROUTER_API_KEY is the value leaked in the public repo. Rotate it first."
ok "secrets supplied and none match a leaked value"

echo "=== [2/7] Writing $ENV_FILE ==="
if [ -n "${JWT_SECRET:-}" ]; then
  ok "using the JWT_SECRET supplied in the environment"
elif [ -f "$ENV_FILE" ] && grep -q '^JWT_SECRET=.\+' "$ENV_FILE"; then
  JWT_SECRET=$(grep '^JWT_SECRET=' "$ENV_FILE" | cut -d= -f2-)
  ok "keeping the existing JWT_SECRET (rewriting it would sign out every session)"
else
  JWT_SECRET=$(python3 -c 'import secrets; print(secrets.token_urlsafe(48))')
  ok "generated a new JWT_SECRET"
fi

[ "${#JWT_SECRET}" -ge 32 ] || die "JWT_SECRET is shorter than 32 characters; generate a real one"

umask 077
cat > "$ENV_FILE" <<ENV
JWT_SECRET=$JWT_SECRET
OPENCLAW_GATEWAY_URL=$GATEWAY
OPENCLAW_GATEWAY_TOKEN=$OPENCLAW_GATEWAY_TOKEN
OPENCLAW_AGENT_ID=${OPENCLAW_AGENT_ID:-main}
NOTIFY_WHATSAPP_TO=$WHATSAPP_TO
NINE_ROUTER_BASE_URL=${NINE_ROUTER_BASE_URL:-https://9router.jcamp.io/v1}
NINE_ROUTER_API_KEY=$NINE_ROUTER_API_KEY
DEBUG=false
ENV
chmod 600 "$ENV_FILE"
ok "$ENV_FILE written, mode 600, DEBUG=false"

echo "=== [3/7] Provisioning host and service ==="
bash "$APP_DIR/scripts/setup_vps.sh"
ok "service installed"

echo "=== [4/7] Deploying current code ==="
bash "$APP_DIR/scripts/deploy.sh"
ok "deployed and health-gated"

echo "=== [5/7] Checking the OpenClaw gateway ==="
GW_CODE=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 \
  -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" "$GATEWAY/v1/models" || echo 000)
case "$GW_CODE" in
  200) ok "gateway answered 200" ;;
  401|403) warn "gateway reachable but rejected the token (HTTP $GW_CODE) — check the rotated value" ;;
  000) warn "gateway unreachable at $GATEWAY — start it with: openclaw gateway" ;;
  *)   warn "gateway answered HTTP $GW_CODE" ;;
esac

echo "=== [6/7] Checking the WhatsApp channel ==="
if command -v openclaw >/dev/null 2>&1; then
  if openclaw channels list 2>/dev/null | grep -qi whatsapp; then
    ok "WhatsApp channel registered"
    bash "$APP_DIR/scripts/register_automation.sh"
    ok "briefing automation registered"
  else
    warn "no WhatsApp channel yet. Outbound sends fail without an active listener."
    warn "run this, scan the QR with the phone, then re-run this script:"
    warn "    openclaw channels login --channel whatsapp"
  fi
else
  warn "openclaw CLI not on PATH; skipping channel and automation setup"
fi

echo "=== [7/7] Verifying the agent loop ==="
TOKEN=$(curl -s --max-time 10 -X POST "$API/api/auth/login" \
  -H 'Content-Type: application/json' \
  -d '{"nim":"2200000001","password":"demo1234"}' \
  | python3 -c 'import json,sys; print(json.load(sys.stdin).get("access_token",""))' 2>/dev/null || true)

if [ -z "$TOKEN" ]; then
  warn "demo login failed; the seed account may not exist yet"
else
  ok "demo login works"
  curl -s --max-time 10 -H "Authorization: Bearer $TOKEN" "$API/api/agent/briefing" \
    | python3 -m json.tool || true
fi

echo
echo "=== Done. What to check next ==="
echo "  Decision without sending:  curl -s -H 'Authorization: Bearer \$TOKEN' $API/api/agent/briefing"
echo "  Scheduled jobs:            openclaw automations list"
echo "  Job run history:           openclaw automations runs academiaclaw-briefing"
echo "  What the agent has sent:   curl -s -H 'Authorization: Bearer \$TOKEN' $API/api/agent/notifications"
echo "  Service log:               journalctl -u academiaclaw.service -f"
