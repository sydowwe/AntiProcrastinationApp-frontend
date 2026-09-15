# Unit 01 — home

Module: `home`

Run as **Sonnet 5, high effort, clean context**. One unit per session. Move this file to `_done/` when the unit's docs have landed and you have read them.

---

```
Read prompts/view-docs/PROMPT-TEMPLATE.md in full and follow it exactly. It is the
specification for this task: the procedure, the hard constraints, the deliverables and
their exact section headings, the severity and ID rules, and the closing report format.

Fill its Unit block with:

- Unit name: `home`
- Module: `home`
- Pass: `mutation`
- Views & routes:
    `HomeView`   `/`
- Intent sources: prompts/_done/home/README.md, H1-correctness-sweep.md,
  H2-shared-state-lifecycle.md, H7-freshness.md, H8-todo-widgets-signal.md,
  H9-nowbar-vs-planner.md

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
- HomeView deliberately imports components from other modules (RoutineTodoListItem,
  NormalTodoListItem, HistoryPieChart, TrackTimeDialog). The comment in home.routes.ts
  says home is the app's composition layer and this is an accepted exception. Do NOT
  report it as a module-boundary violation.
- The shell pass exercised dialogs and snackbars *from* Home but deliberately documented
  none of Home's widgets — they are entirely yours. See docs/views/_shell/inventory.md.
- Several of Home's widget fetches fire at boot alongside the shell's, listed in that
  file's "Console & network at boot" section. Check whether any are duplicated or fire
  before they are needed.
- H2 and H7 are about shared state lifecycle and freshness: check whether widgets go
  stale after you change the underlying data in another tab or route.

Do only this unit. Do not continue to another one.
```
