# Unit 10 — todo-routine

Module: `todoList`

Run as **Sonnet 5, high effort, clean context**. One unit per session. Move this file to `_done/` when the unit's docs have landed and you have read them.

For the mutation pass, paste the same block with `Pass:` changed to `mutation`.

---

```
Read prompts/view-docs/PROMPT-TEMPLATE.md in full and follow it exactly. It is the
specification for this task: the procedure, the hard constraints, the deliverables and
their exact section headings, the severity and ID rules, and the closing report format.

Fill its Unit block with:

- Unit name: `todo-routine`
- Module: `todoList`
- Pass: `inventory`
- Views & routes:
    `RoutineToDoListView`   `/routine-todo-list`
    `RoutineSettingsView`   `/routine-settings`
- Intent sources: prompts/_done/todo-motivation/README.md, R1-streak-freeze.md,
  R2-fresh-start-review.md, N2-defuse-overdue.md, S1-progress-bars.md

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
- `/routine-settings` is an ORPHAN CANDIDATE — no sidebar entry, nothing found linking to
  it (docs/views/_routes.md). CLAUDE.md requires EVERY settings page to be reachable from
  /user/settings, via ModuleSettingsSection which links by route NAME. Check whether it is
  listed there. If not, that is a finding.
- CLAUDE.md records that routineReviewStore has the reset half of its sign-in watcher but
  NOT the reload half — so after a second sign-in in the same tab its data may be empty or
  stale where activityOptionsStore's would refresh. Worth probing if you can sign out and
  back in without losing your session for the rest of the pass; if you cannot, record it
  as unverified rather than risking the pass.
- The sibling unit todo-lists (unit 9) is already documented: docs/views/todo-lists/.
  Read its inventory — these views share components and composables, and a defect already
  filed there should be cross-referenced, not re-filed.
- Recent commits post-date the intent sources: aef2b653 split RoutineToDoListView into
  four composables, 00bcc3fe extracted useUndoableListCrud shared with TodoListView.

Do only this unit. Do not continue to another one.
```
