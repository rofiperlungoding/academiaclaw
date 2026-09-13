# HEARTBEAT.md — Proactive Sentinel Automation

This is the agent loop. It runs on the OpenClaw **Automations** scheduler, not on a
user opening the app. Register it with `scripts/register_automation.sh`.

## Schedule

Cron rule `0 7,13,19 * * *` (Asia/Jakarta) — morning, midday, evening. Three wakes a
day, not 48. The briefing endpoint owns the decision to stay quiet, so a tighter
cadence would only add API calls, not messages.

## Routine

On each wake:

1. `GET http://127.0.0.1:8000/api/agent/briefing`
2. Read `send`:
   - `false` — exit silently. Do not announce that there is nothing to say.
     `reason` will be one of `nothing_due`, `unchanged_since_last_briefing`,
     `rate_limited`.
   - `true` — deliver `body` verbatim to the student's WhatsApp chat.
3. After delivery succeeds, call `GET /api/agent/briefing?commit=true` to record the
   push. This starts the quiet period; skipping it causes a repeat on the next wake.

## Rules

- **Send `body` as written.** It is composed deterministically from the database. Do
  not rewrite, summarise, or embellish it — a reminder that hallucinates a deadline is
  worse than no reminder.
- Replies arrive inside WhatsApp's 24-hour customer-initiated window, so the
  conversation that follows a briefing costs nothing.
- If the student replies, hand off to the `academiaclaw-main` session with the
  briefing as context, and answer with `ask_knowledge_graph` grounded in their own
  uploaded material.
