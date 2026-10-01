# Phase 5 — 01 home

Run as **Sonnet 5, high effort, clean context.** One Phase 5 session at a time, because they share the seeded
database. Move this file to `_done/` once its report is in and you've skimmed the diff.

```
Read prompts/view-docs/phase5/TEMPLATE.md in full and follow it exactly. This message fills in
its unit parameters.

- Unit: `home` → docs/views/home/
- Draft spec: e2e/tests/home.draft.spec.ts
- Related specs: none
- Final file: e2e/tests/home.spec.ts

Unit notes:
- On 2026-09-13 this draft had two failures, both locator or behaviour issues rather than app
  defects. Check whether they still fail before assuming anything.
- HomeView mounts HistoryPieChart (echarts on <canvas>). Assert the chart from the response that
  populates it, or from an eval of its series, never from the accessibility tree.
- Home mounts todoList's item rows. Ticking an item on home is a real write, so a test that ticks
  one needs its own row, or freshSeed + serial.
- "Today" comes only from seed.seedDateUtc. Home is the view where it's most tempting to use the
  local clock.

This is a Windows machine. Use the PowerShell tool for shell commands, never Bash.
Do only this unit.
```
