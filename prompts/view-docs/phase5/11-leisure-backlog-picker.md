# Phase 5 — 11 leisure-backlog-picker

Run as **Sonnet 5, high effort, clean context.** One Phase 5 session at a time, because they share the seeded
database. Run it before 13. Move this file to `_done/` once its report is in and you've skimmed the diff.

```
Read prompts/view-docs/phase5/TEMPLATE.md in full and follow it exactly. This message fills in
its unit parameters.

- Unit: `leisure-backlog-picker` → docs/views/leisure-backlog-picker/
- Draft spec: e2e/tests/leisure-backlog-picker.draft.spec.ts
- Related specs: none
- Final file: e2e/tests/leisure-backlog-picker.spec.ts

Unit notes:
- Committing a suggestion on /leisure/pick writes. A test that commits one needs freshSeed +
  serial, or a backlog row created through the API.
- The picker's suggestion may not be deterministic. Assert on what the fixture guarantees (a
  suggestion from the eligible set, and its controls), not on which item comes up, unless the
  inventory shows the order is deterministic.
- Leave leisure-profiles.spec.ts alone. Unit 13's session resolves it once this unit's spec
  exists.

This is a Windows machine. Use the PowerShell tool for shell commands, never Bash.
Do only this unit.
```
