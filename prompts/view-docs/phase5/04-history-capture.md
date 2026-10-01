# Phase 5 — 04 history-capture

Run as **Sonnet 5, high effort, clean context.** One Phase 5 session at a time, because they share the seeded
database. Move this file to `_done/` once its report is in and you've skimmed the diff.

```
Read prompts/view-docs/phase5/TEMPLATE.md in full and follow it exactly. This message fills in
its unit parameters.

- Unit: `history-capture` → docs/views/history-capture/
- Draft spec: e2e/tests/history-capture.draft.spec.ts
- Related specs: none
- Final file: e2e/tests/history-capture.spec.ts

Unit notes:
- The running timer persists across reloads (runningTimerStore). A test that starts a stopwatch,
  timer or pomodoro must stop or discard it in the same test. Otherwise the next test inherits a
  running session.
- Stopping within the first minute behaves differently per mode: Timer discards silently, while
  Pomodoro still opens the dialog (see inventory.md). Assert the documented behaviour, or the
  fixed one if a finding changed it.
- Recording to history writes a row. Record against a row you created, or use freshSeed + serial.

This is a Windows machine. Use the PowerShell tool for shell commands, never Bash.
Do only this unit.
```
