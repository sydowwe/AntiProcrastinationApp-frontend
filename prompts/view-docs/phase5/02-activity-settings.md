# Phase 5 — 02 activity-settings

Run as **Sonnet 5, high effort, clean context.** One Phase 5 session at a time, because they share the seeded
database. Move this file to `_done/` once its report is in and you've skimmed the diff.

```
Read prompts/view-docs/phase5/TEMPLATE.md in full and follow it exactly. This message fills in
its unit parameters.

- Unit: `activity-settings` → docs/views/activity-settings/
- Draft spec: e2e/tests/activity-settings.draft.spec.ts
- Related specs: e2e/tests/activity-lifecycle.spec.ts
- Final file: e2e/tests/activity-settings.spec.ts

Unit notes:
- activity-lifecycle.spec.ts has one fixme about the Activities settings table's per-row delete
  affordance. That's this unit's surface, so resolve it here and move it into
  activity-settings.spec.ts. Leave activity-lifecycle.spec.ts's picker test where it is, because
  it spans modules.
- POST /api/activity/grid fires twice on mount (first ERR_ABORTED, then 200). That's known and
  not a failure. Wait on the rendered rows, not on the request.
- The draft has 14 fixmes, the most of any unit. Expect several to be the colour-picker 400 (X1),
  which has since been fixed.

This is a Windows machine. Use the PowerShell tool for shell commands, never Bash.
Do only this unit.
```
