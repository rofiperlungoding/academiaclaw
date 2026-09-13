#!/usr/bin/env bash
# Registers the proactive briefing job on the OpenClaw Automations scheduler.
# Run once on the VPS, after `openclaw channels login --channel whatsapp`.
#
#   WHATSAPP_TO=628123456789 ./scripts/register_automation.sh
#
# Idempotent: an existing job with the same name is replaced.
set -euo pipefail

JOB_NAME="academiaclaw-briefing"
CRON_RULE="${CRON_RULE:-0 7,13,19 * * *}"
TIMEZONE="${TIMEZONE:-Asia/Jakarta}"
API="${API:-http://127.0.0.1:8000}"
WHATSAPP_TO="${WHATSAPP_TO:-}"

if [ -z "$WHATSAPP_TO" ]; then
  echo "error: set WHATSAPP_TO to the student's number (E.164, no +) or a group JID" >&2
  exit 1
fi

if ! command -v openclaw >/dev/null 2>&1; then
  echo "error: openclaw CLI not found on PATH" >&2
  exit 1
fi

# The agent needs an active WhatsApp listener or outbound sends fail fast.
if ! openclaw channels list 2>/dev/null | grep -qi whatsapp; then
  echo "warning: no WhatsApp channel registered." >&2
  echo "         run: openclaw channels login --channel whatsapp" >&2
fi

echo "=== Removing any previous '$JOB_NAME' ==="
EXISTING=$(openclaw automations list 2>/dev/null | awk -v n="$JOB_NAME" '$0 ~ n {print $1}' || true)
for id in $EXISTING; do
  openclaw automations delete "$id" 2>/dev/null || true
  echo "  removed $id"
done

PROMPT=$(cat <<PROMPT_EOF
Run the AcademiaClaw proactive check.

1. GET ${API}/api/agent/briefing
2. If "send" is false, stop. Output nothing at all. Do not explain the silence.
3. If "send" is true, send the "body" field VERBATIM to WhatsApp ${WHATSAPP_TO}.
   Do not rewrite, summarise, translate, or add to it. It is composed from the
   student's real database rows; changing it risks stating a wrong deadline.
4. After the message is delivered, GET ${API}/api/agent/briefing?commit=true to
   record the push and open the quiet period.
PROMPT_EOF
)

echo "=== Creating '$JOB_NAME' ($CRON_RULE $TIMEZONE) ==="
openclaw automations create \
  --name "$JOB_NAME" \
  --cron "$CRON_RULE" \
  --timezone "$TIMEZONE" \
  --session "academiaclaw-sentinel" \
  --system-event "$PROMPT" \
  --deliver whatsapp:"$WHATSAPP_TO"

echo
echo "=== Registered. Verify with: ==="
echo "  openclaw automations list"
echo "  openclaw automations runs $JOB_NAME"
echo
echo "Dry-run the decision without sending:"
echo "  curl -s $API/api/agent/briefing | python3 -m json.tool"
echo
echo "See what the agent has already pushed:"
echo "  curl -s $API/api/agent/notifications | python3 -m json.tool"
