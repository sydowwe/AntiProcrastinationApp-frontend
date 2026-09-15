# Unit 13 — leisure-projects

Module: `leisure`

Run as **Sonnet 5, high effort, clean context**. One unit per session. Move this file to `_done/` when the
unit's docs have landed and you have read them.

For the mutation pass, paste the same block with `Pass:` changed to `mutation`.

---

```
Read prompts/view-docs/PROMPT-TEMPLATE.md in full and follow it exactly. It is the
specification for this task: the procedure, the hard constraints, the deliverables and
their exact section headings, the severity and ID rules, and the closing report format.

Fill its Unit block with:

- Unit name: `leisure-projects`
- Module: `leisure`
- Pass: `inventory`
- Views & routes:
    `ProjectsView`   `/leisure/projects`
- Intent sources: prompts/_done/leisure/README.md, P1-readiness-board.md,
  L1-server-table-adoption.md, L2-correctness-pass.md, L3-shared-inputs.md

Environment, already verified — do not re-check:
- Dev server https://localhost:3000 (this exact origin — the session cookie is bound to
  it), backend https://localhost:8080, both running and seeded. You are signed in and the
  account locale is English. If the UI renders Slovak, stop and report.

This is a Windows machine — use the PowerShell tool for shell commands, never Bash.

Drive the browser with playwright-cli, per CLAUDE.md's "Browser verification" section —
including its sign-in and state-load sequence. Use your own session and run
`playwright-cli close` when you finish. Prefer `find` over `snapshot`. Charts are echarts
on <canvas> and are invisible to the snapshot: read them from the populating response,
an eval, or a screenshot — never report one as empty on snapshot evidence alone.

Known for this unit — verify each, do not assume:
- L2 lists a CONFIRMED cross-module import violation in NewProjectProfileForm.vue:67 —
  it imports @/core/activity/composable/UseActivitySelectOptions.ts, which CLAUDE.md
  forbids (cross-module only via api/ or dto/). L2 claims to fix it; check whether it did.
- P1 ("surface the blocker") wants the view to show what is stopping each project rather
  than being a plain CRUD table. Record what it actually is now — if the blocker is still
  not surfaced, that is an `opportunity`, not a bug.
- L1 applies here too: check whether this table uses _common's useServerTable and whether
  its filters and paging are reflected in the URL, which CLAUDE.md requires.
- L3 collapsed duplicated filter inputs across the four leisure tables — compare this
  view's filter row against the backlog's (unit 11) and flag unexplained divergence.
- Single-view unit. Read the sibling leisure units' docs if they exist before filing
  anything that might be shared across all four tables.

Do only this unit. Do not continue to another one.
```
