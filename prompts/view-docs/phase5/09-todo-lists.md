# Phase 5 — 09 todo-lists

Run as **Sonnet 5, high effort, clean context.** One Phase 5 session at a time, because they share the seeded
database. Move this file to `_done/` once its report is in and you've skimmed the diff.

```
Read prompts/view-docs/phase5/TEMPLATE.md in full and follow it exactly. This message fills in
its unit parameters.

- Unit: `todo-lists` → docs/views/todo-lists/
- Draft spec: none (this unit was promoted early)
- Related specs: e2e/tests/todo-lists.spec.ts, e2e/tests/todo-motivation.spec.ts
- Final files: the same two, names unchanged

Unit notes:
- NO DRAFT, so skip step 5 (merge or rename). The job is steps 1–4 and 6 on the two existing
  files: walk todo-lists.spec.ts's 4 fixmes, and bring both files up to convention.
- Several specs still navigate to a literal /todo-list/13002, which CLAUDE.md calls the older
  style. Replace it with the id from seed.
- todo-motivation.spec.ts is the file CLAUDE.md points to as the model for fixme-with-finding-id.
  Its fixmes reference findings B3/B4; check whether those are fixed now.
- The counter on todoListItems.multiCountPartial is the case that forced freshSeed into
  existence. Keep that block serial + freshSeed.

This is a Windows machine. Use the PowerShell tool for shell commands, never Bash.
Do only this unit.
```
