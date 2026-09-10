# Unit 19 — scheduler

Module: `_common`

Run as **Sonnet 5, high effort, clean context**. One unit per session. Move this file to `_done/` when the
unit's docs have landed and you have read them.

This unit is read-only — no mutation pass.

---

```
Read prompts/view-docs/PROMPT-TEMPLATE.md in full and follow it exactly. It is the
specification for this task: the procedure, the hard constraints, the deliverables and
their exact section headings, the severity and ID rules, and the closing report format.

Fill its Unit block with:

- Unit name: `scheduler`
- Module: `_common`
- Pass: `inventory`
- Views & routes:
    `SchedulerJobsView`   `/planovac/ulohy`
    `SchedulerJobDetailView`   `/ulohy/:id`
    `SchedulerRunDetailView`   `/behy/:id`
    `SchedulerNeedsAttentionView`   `/planovac/pozornost`
- Intent sources: prompts/_common/scheduler/README.md, S1-correctness-sweep.md,
  S5-freshness.md, S6-operator-affordances.md, S8-contract-realignment.md,
  S3-table-plumbing.md

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
- READ THIS FIRST: this unit's intent sources live in prompts/_common/scheduler/, NOT in
  prompts/_done/. That set is still OPEN. Its claims describe what is PLANNED, not what
  shipped. Treat every one as a proposal to check against reality, and expect the code to
  be behind them — a gap here is usually "not built yet", not a regression. Say which.
- Partial exception: commit 6ac08b6b ("realign the response DTOs with the real server,
  then wire the B3 signals") means S8 and parts of backend B3 HAVE landed. Those two are
  the ones most likely to be real.
- FRAMEWORK unit (src/_common/modules/scheduler/). Tag every finding [framework].
- This app overrides the module's default paths with Slovak ones, declared only in
  src/router.ts (APP_SCHEDULER_PATHS). The route NAMES are the module's contract and never
  change; navItems.ts and the breadcrumb fixes resolve by name. So a path that looks
  inconsistent with the module's docs is expected — do not report it.
- All four routes carry `requiredRole: 'admin'`, which this app waves through (no role
  model). "Is this correctly gated?" is unanswerable from here — do not file it.
- Cron is QUARTZ: 6-7 fields, seconds first, 1 = Sunday, UTC. A 5-field expression is
  invalid. Do not report Quartz syntax as a bug.
- Read-only unit: no mutation pass. Do NOT trigger, replay, pause or resume a job — these
  are real scheduled jobs. Document the controls and stop.

Do only this unit. Do not continue to another one.
```
