# Unit 16 — reminders-user

Module: `_common`

Run as **Sonnet 5, high effort, clean context**. One unit per session. Move this file to `_done/` when the
unit's docs have landed and you have read them.

For the mutation pass, paste the same block with `Pass:` changed to `mutation`.

---

```
Read prompts/view-docs/PROMPT-TEMPLATE.md in full and follow it exactly. It is the
specification for this task: the procedure, the hard constraints, the deliverables and
their exact section headings, the severity and ID rules, and the closing report format.

Fill its Unit block with:

- Unit name: `reminders-user`
- Module: `_common`
- Pass: `inventory`
- Views & routes:
    `MyRemindersView`   `/pripomienky/moje`
- Intent sources: prompts/_done/_common/reminders/README.md, R10-snooze-dismiss.md,
  R11-bulk-actions.md, R2-error-states.md, R8-a11y.md, R3-slovak-plurals.md

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
- FRAMEWORK unit (src/_common/modules/reminders/). Every finding is a submodule issue —
  tag them [framework]. Fixes are a commit in vue_framework plus a pointer bump.
- `/pripomienky/moje` is DELIBERATELY absent from the sidebar — it is reached only from
  the user menu, and navItems.ts:74 has a comment saying so. Do not report it as an
  orphan; the shell pass already confirmed this is intentional.
- Cron expressions in this module are QUARTZ, not Unix: 6-7 fields with seconds first,
  1 = Sunday, evaluated in UTC. A 5-field expression is invalid here. Do not report
  Quartz syntax as a bug, and do not "correct" a 6-field expression to 5.
- This is the only non-admin reminders route — the other five are unit 17.
- R3 covers Slovak plurals (one/few/many). You are running in English, so plural bugs in
  SK will be invisible; leave them to the X3 Slovak sweep rather than guessing.

Do only this unit. Do not continue to another one.
```
