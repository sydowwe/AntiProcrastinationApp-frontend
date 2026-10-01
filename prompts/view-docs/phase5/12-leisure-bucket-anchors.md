# Phase 5 — 12 leisure-bucket-anchors

Run as **Sonnet 5, high effort, clean context.** One Phase 5 session at a time, because they share the seeded
database. Run it before 13. Move this file to `_done/` once its report is in and you've skimmed the diff.

```
Read prompts/view-docs/phase5/TEMPLATE.md in full and follow it exactly. This message fills in
its unit parameters.

- Unit: `leisure-bucket-anchors` → docs/views/leisure-bucket-anchors/
- Draft spec: e2e/tests/leisure-bucket-anchors.draft.spec.ts
- Related specs: e2e/tests/leisure-anchor-sort.spec.ts
- Final file: e2e/tests/leisure-bucket-anchors.spec.ts

Unit notes:
- MERGE: leisure-anchor-sort.spec.ts covers MemoryAnchorsView's sorting (the B7 activity.name
  sort key). Fold it into leisure-bucket-anchors.spec.ts under the MemoryAnchorsView describe,
  then remove it with git.
- Leave leisure-profiles.spec.ts alone. Unit 13's session resolves it once this unit's spec
  exists.

This is a Windows machine. Use the PowerShell tool for shell commands, never Bash.
Do only this unit.
```
