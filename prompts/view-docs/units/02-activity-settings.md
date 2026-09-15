# Unit 02 — activity-settings

Module: `activity`

Run as **Sonnet 5, high effort, clean context**. One unit per session. Move this file to `_done/` when the
unit's docs have landed and you have read them.

For the mutation pass, paste the same block with `Pass:` changed to `mutation`.

---

```
Read prompts/view-docs/PROMPT-TEMPLATE.md in full and follow it exactly. It is the
specification for this task: the procedure, the hard constraints, the deliverables and
their exact section headings, the severity and ID rules, and the closing report format.

Fill its Unit block with:

- Unit name: `activity-settings`
- Module: `activity`
- Pass: `inventory`
- Views & routes:
    `ActivitySettingsView`   `/activity-settings/:tab(activities\|roles\|categories)` — **all three tabs**
- Intent sources: prompts/_done/activity/README.md, A1-correctness-sweep.md,
  A4-i18n-pass.md, A5-url-state-and-filtering.md, A9-archive-and-merge.md,
  A10-picker-ux.md

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
- One view, three tabs (`activities|roles|categories`), each a route param. The sidebar
  links only `activities`; the other two are reachable solely via in-page tab controls.
  Document all three — they are three distinct screens sharing a route.
- `/activity-settings` with no tab is the app's only redirect. Confirm it lands on
  `/activity-settings/activities`.
- A5 is about URL state: check the tab, filters and sort survive a reload and a
  back-navigation, per CLAUDE.md's URL-state rule.
- This module's options store (activityOptionsStore) is created at boot and is the worked
  example of the sign-in watcher in CLAUDE.md. Its lists feed pickers in five modules.
- Recent commits post-date the intent sources: 607f9184 extracted useActivityFilterDrafts,
  64ad48c8 replaced hand-rolled query handling, f6af3c35 touched the icon buttons and
  ActivityTable. Expect drift between the prompts and the code.

Do only this unit. Do not continue to another one.
```
