# HEARTBEAT.md - Proactive Sentinel Check

## Trigger Frequency: Every 30 Minutes

## Execution Routine:
1. Fetch heartbeat summary from `http://127.0.0.1:8000/api/tasks/heartbeat/summary`.
2. Inspect `urgent_tasks_count` and `due_flashcards_count`.
3. If `proactive_notification_recommended` is true and an active session exists inside the 24-hour service window:
   - Format a concise briefing:
     - Impending tasks due within 3 days.
     - Number of FSRS-6 review cards due today.
     - A single suggested active recall review question.
4. If no tasks or due cards are pending, exit silently without generating unnecessary output.
