# Phase 5 — 13 leisure-projects

Run as **Sonnet 5, high effort, clean context.** One Phase 5 session at a time, because they share the seeded
database. **Run after 11 and 12.** Move this file to `_done/` once its report is in and you've skimmed the diff.

```
Read prompts/view-docs/phase5/TEMPLATE.md in full and follow it exactly. This message fills in
its unit parameters.

- Unit: `leisure-projects` → docs/views/leisure-projects/
- Draft spec: e2e/tests/leisure-projects.draft.spec.ts
- Related specs: e2e/tests/leisure-profiles.spec.ts
- Final file: e2e/tests/leisure-projects.spec.ts (and leisure-profiles.spec.ts removed)

Unit notes:
- leisure-profiles.spec.ts holds four fixmes that span all three leisure units: backlog,
  bucket-list, project and memory anchor. Resolve each one:
    * if leisure-backlog-picker.spec.ts, leisure-bucket-anchors.spec.ts or your own spec already
      asserts the behaviour, delete the stub;
    * otherwise, write it into the spec of the unit that owns the view. Editing 11's or 12's
      promoted spec is allowed for exactly this.
  Then remove leisure-profiles.spec.ts with git. At step 6, run all three leisure specs together.
- Board mode requests up to 200 rows in one page and never pages. Don't write a test that
  depends on paging.
- The project card's activity name was the "—" bug (B6, since shipped as a nested
  ActivityResponse). Assert the real name.

This is a Windows machine. Use the PowerShell tool for shell commands, never Bash.
Do only this unit.
```
