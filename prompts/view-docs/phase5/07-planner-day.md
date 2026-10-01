# Phase 5 — 07 planner-day

Run as **Sonnet 5, high effort, clean context.** One Phase 5 session at a time, because they share the seeded
database. Run it **after the X4 `planner` group**, whose mobile locators unblock two fixmes here. Move this file
to `_done/` once its report is in and you've skimmed the diff.

```
Read prompts/view-docs/phase5/TEMPLATE.md in full and follow it exactly. This message fills in
its unit parameters.

- Unit: `planner-day` → docs/views/planner-day/
- Draft spec: e2e/tests/planner-day.draft.spec.ts
- Related specs: e2e/tests/dayPlanner.spec.ts, e2e/tests/planner-skip-insights.spec.ts
- Final files: e2e/tests/planner-day.spec.ts, e2e/tests/planner-skip-insights.spec.ts

Unit notes:
- MERGE: dayPlanner.spec.ts is the older hand-written spec for DayPlannerView. Fold it and the
  draft into one planner-day.spec.ts (one describe per view), then remove both originals with
  git. Keep planner-skip-insights.spec.ts as its own file, because it covers a separate surface
  (C1) that was written recently. Only walk its fixmes (it has none today).
- The :date param is dd-MM-yyyy, NOT ISO. An ISO date 400s and silently shows a neighbouring
  day, so a test can pass while looking at the wrong day. Build it from seed.seedDateUtc.
- dayPlanner.spec.ts has two fixmes waiting on a mobile viewport: the Day Details toggle,
  `v-show="panelOpen || mdAndUp"`. If docs/views/planner-day/inventory.md has an X4 "Narrow
  viewport" block, it names the locator, so enable them in a 390x844 describe. If it has none, the
  X4 pass hasn't run: keep them as fixme and say so.
- dayPlanner.spec.ts's third fixme ("Edit button opens the calendar details dialog") has its own
  comment explaining the defect. Check its finding's status.

This is a Windows machine. Use the PowerShell tool for shell commands, never Bash.
Do only this unit.
```
