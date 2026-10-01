# Phase 5 — 10 todo-routine

Run as **Sonnet 5, high effort, clean context.** One Phase 5 session at a time, because they share the seeded
database. Move this file to `_done/` once its report is in and you've skimmed the diff.

```
Read prompts/view-docs/phase5/TEMPLATE.md in full and follow it exactly. This message fills in
its unit parameters.

- Unit: `todo-routine` → docs/views/todo-routine/
- Draft spec: e2e/tests/todo-routine.draft.spec.ts
- Related specs: none
- Final file: e2e/tests/todo-routine.spec.ts

Unit notes:
- The draft's fixmes name real bugs (B3–B6): a raw toDoList.timePeriod key, a hardcoded English
  streak tooltip, and a delete confirmation that shows a raw id. Check each one's status, since
  several have been fixed.
- Streak history is seeded (B8), and the untick-streak rule was decided in B9
  (prompts/view-docs/backend/_done/). Assert streaks against that decision, not against a guess.
- Ticking a routine item changes its streak for every later test. Use a row you created, or
  freshSeed + serial.

This is a Windows machine. Use the PowerShell tool for shell commands, never Bash.
Do only this unit.
```
