# Unit 04 — history-capture

Module: `activityHistory`

Run as **Sonnet 5, high effort, clean context**. One unit per session. Move this file to `_done/` when the
unit's docs have landed and you have read them.

For the mutation pass, paste the same block with `Pass:` changed to `mutation`. — all four write history

---

```
Read prompts/view-docs/PROMPT-TEMPLATE.md in full and follow it exactly. It is the
specification for this task: the procedure, the hard constraints, the deliverables and
their exact section headings, the severity and ID rules, and the closing report format.

Fill its Unit block with:

- Unit name: `history-capture`
- Module: `activityHistory`
- Pass: `inventory`
- Views & routes:
    `StopWatchView`   `/activity-history/stopwatch`
    `TimerView`   `/activity-history/timer`
    `PomodoroTimerView`   `/activity-history/pomodoro`
    `AddActivityManuallyView`   `/activity-history/manual`
- Intent sources: prompts/_done/activity-history/README.md, H9-durable-timers.md,
  H11-timer-end-notifications.md, H2-delete-dead-code.md

Environment, already verified — do not re-check:
- Dev server https://localhost:3000 (this exact origin — the session cookie is bound to
  it), backend https://localhost:8080, both running and seeded. You are signed in and the
  account locale is English. If the UI renders Slovak, stop and report.

This is a Windows machine — use the PowerShell tool for shell commands, never Bash.

Invoke the claude-in-chrome skill, then load the Chrome MCP tools in ONE ToolSearch call.
Call tabs_context_mcp first, then create your own tab. Never reuse a tab from another
session. Never trigger a browser-native alert/confirm/prompt.

Known for this unit — verify each, do not assume:
- These four views are the four ways to record an activity, which is why they are one
  unit. All four write history records, so the mutation pass must clean up after itself.
- PomodoroTimerView is routed out of component/, not view/ — every other routed component
  lives in a view/ directory (docs/views/_routes.md). Structural oddity, note it.
- H9 is "durable timers": the running-timer store is created at BOOT in App.vue, not by
  whichever timer view mounts, precisely so a reload on any other route keeps the
  countdown alive and still fires the alarm. Test that directly — start a timer, navigate
  away, reload on a different route, and confirm it is still counting.
- H11 covers timer-end notifications. Notification delivery is the notifications module's
  (unit 18); what belongs here is whether ending a timer *triggers* one.
- Recent commit c8682d46 split PomodoroTimerView into panels and touched TrackTimeDialog,
  post-dating the intent sources.

Do only this unit. Do not continue to another one.
```
