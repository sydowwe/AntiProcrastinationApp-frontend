# Unit 09 — todo-lists

Module: `todoList`

Run as **Sonnet 5, high effort, clean context**. One unit per session. Move this file to `_done/` when the unit's docs have landed and you have read them.

For the mutation pass, paste the same block with `Pass:` changed to `mutation`.

---

```
Read prompts/view-docs/PROMPT-TEMPLATE.md in full and follow it exactly. It is the
specification for this task: the procedure, the hard constraints, the deliverables and
their exact section headings, the severity and ID rules, and the closing report format.

Fill its Unit block with:

- Unit name: `todo-lists`
- Module: `todoList`
- Pass: `mutation`
- Views & routes:
    `TodoListsView`   `/todo-list`
    `TodoListView`    `/todo-list/:id`
- Intent sources: prompts/_done/todo-motivation/README.md, N1-schedule-first.md,
  N3-focus-mode.md, S1-progress-bars.md, S2-quick-start-timer.md,
  S3-estimate-vs-actual.md

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
- THE INVENTORY PASS IS DONE. See docs/views/todo-lists/ — usecase, inventory, findings
  (9 findings) and 10 screenshots. Read them before re-running anything here; do not
  redo the inventory. The mutation pass has NOT been run.
- Open questions the mutation pass must settle: U2 (a click on a multi-count item's "0/2"
  counter produced no change and no request — dead click, or a hit-target artifact?) and
  U1 (the overdue-renegotiation banner never rendered, because no seed item is overdue).
- Do not re-report B1 (unhandled 404 on an invalid list id), B2 (raw `iconPicker.*` keys),
  A1/A2 (seven unnamed icon buttons) or P1 ("Clear filters" scope) — all already filed
  with Verify blocks.
- The draft spec e2e/tests/todo-lists.draft.spec.ts exists but has never been executed.

Do only this unit. Do not continue to another one.
```
