# Phase 5 — 08 planner-templates

Run as **Sonnet 5, high effort, clean context.** One Phase 5 session at a time, because they share the seeded
database. Move this file to `_done/` once its report is in and you've skimmed the diff.

```
Read prompts/view-docs/phase5/TEMPLATE.md in full and follow it exactly. This message fills in
its unit parameters.

- Unit: `planner-templates` → docs/views/planner-templates/
- Draft spec: e2e/tests/planner-templates.draft.spec.ts
- Related specs: e2e/tests/templateDayPlanner.spec.ts
- Final file: e2e/tests/planner-templates.spec.ts

Unit notes:
- MERGE: templateDayPlanner.spec.ts (16 tests, none skipped) already covers
  TemplateDayPlannerView well. Fold it and the draft into one planner-templates.spec.ts, with one
  describe per view. Where the two overlap, keep templateDayPlanner's tests, because they're the
  more mature ones. Then remove both originals with git.
- e2e/fixtures/dayPlannerTemplates.ts holds the template endpoint shapes and enum traps. Use it
  for any template you create through the API.
- Three templates are seeded (seed.dayPlannerTemplates: homeOffice with 5 tasks, officeDay with 4,
  pinned with 3). Assert against those, not literals.

This is a Windows machine. Use the PowerShell tool for shell commands, never Bash.
Do only this unit.
```
