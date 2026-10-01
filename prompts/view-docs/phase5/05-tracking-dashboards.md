# Phase 5 — 05 tracking-dashboards

Run as **Sonnet 5, high effort, clean context.** One Phase 5 session at a time, because they share the seeded
database. Move this file to `_done/` once its report is in and you've skimmed the diff.

```
Read prompts/view-docs/phase5/TEMPLATE.md in full and follow it exactly. This message fills in
its unit parameters.

- Unit: `tracking-dashboards` → docs/views/tracking-dashboards/
- Draft spec: e2e/tests/tracking-dashboards.draft.spec.ts
- Related specs: none
- Final file: e2e/tests/tracking-dashboards.spec.ts

Unit notes:
- Read-only unit.
- Charts are echarts on <canvas>. Assert against the response that populates them (for example,
  the web-extension pie-chart returns 5 domains in the seed) or an eval of the chart instance.
- Seven days of all three ledgers are seeded relative to seedDateUtc. Build every date range
  from it.

This is a Windows machine. Use the PowerShell tool for shell commands, never Bash.
Do only this unit.
```
