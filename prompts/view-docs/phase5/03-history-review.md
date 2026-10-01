# Phase 5 — 03 history-review

Run as **Sonnet 5, high effort, clean context.** One Phase 5 session at a time, because they share the seeded
database. Move this file to `_done/` once its report is in and you've skimmed the diff.

```
Read prompts/view-docs/phase5/TEMPLATE.md in full and follow it exactly. This message fills in
its unit parameters.

- Unit: `history-review` → docs/views/history-review/
- Draft spec: e2e/tests/history-review.draft.spec.ts
- Related specs: none
- Final file: e2e/tests/history-review.spec.ts

Unit notes:
- Charts are echarts on <canvas>. Assert them from the response that populates them, or from an
  eval, never from the accessibility tree.
- /activity-history/detail legitimately shows "No data for this period" for the seed date.
  Navigate to a populated period before asserting content.
- Read-only unit: no test here should need freshSeed.

This is a Windows machine. Use the PowerShell tool for shell commands, never Bash.
Do only this unit.
```
