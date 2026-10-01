# Phase 5 — 06 tracking-settings

Run as **Sonnet 5, high effort, clean context.** One Phase 5 session at a time, because they share the seeded
database. Move this file to `_done/` once its report is in and you've skimmed the diff.

```
Read prompts/view-docs/phase5/TEMPLATE.md in full and follow it exactly. This message fills in
its unit parameters.

- Unit: `tracking-settings` → docs/views/tracking-settings/
- Draft spec: e2e/tests/tracking-settings.draft.spec.ts
- Related specs: none
- Final file: e2e/tests/tracking-settings.spec.ts

Unit notes:
- Each Mappings tab opens with its Type filter on `Activity` and shows ONE row, even though two
  mappings per platform are seeded. The other is under `Ignored`. Assert both, and don't read the
  single row as a bug.
- Distinct-entry counts: assert against seed.counts.distinctDesktopEntries /
  distinctAndroidEntries.
- Creating or editing a mapping changes which distinct entries show as covered (B24). A test that
  does either needs its own row, or freshSeed + serial.

This is a Windows machine. Use the PowerShell tool for shell commands, never Bash.
Do only this unit.
```
