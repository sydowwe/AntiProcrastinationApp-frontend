# Unit 06 — tracking-settings

Module: `activityTracking`

Run as **Sonnet 5, high effort, clean context**. One unit per session. Move this file to `_done/` when the unit's docs have landed and you have read them.

For the mutation pass, paste the same block with `Pass:` changed to `mutation`.

---

```
Read prompts/view-docs/PROMPT-TEMPLATE.md in full and follow it exactly. It is the
specification for this task: the procedure, the hard constraints, the deliverables and
their exact section headings, the severity and ID rules, and the closing report format.

Fill its Unit block with:

- Unit name: `tracking-settings`
- Module: `activityTracking`
- Pass: `mutation`
- Views & routes:
    `DesktopSettingsView` `/activity-tracking/desktop/settings/:tableView`
    `AndroidSettingsView` `/activity-tracking/android/settings/:tableView`
- Intent sources: prompts/_done/activity-tracking/README.md, R4-settings-views.md,
  R5-baseline-boundary.md, R1-correctness-sweep.md

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
- Both routes take a `:tableView` param. The sidebar links only `distinctEntries` — find
  what other values the views accept and document each as a distinct screen, plus what an
  unrecognised value does.
- CLAUDE.md requires EVERY settings page to be reachable from /user/settings, and says
  ModuleSettingsSection links out to them by route NAME. Check both of these are listed
  there. If they are not, that is a finding.
- These are module-owned settings, so per CLAUDE.md's preference-ownership rules they
  belong to this module and not to /user/preferences — unless one of them is really about
  notification delivery or describes the person rather than the screen. Flag any that
  looks misplaced; moving one is a backend change, not a frontend refactor, so report
  rather than propose a shim.
- Desktop and Android settings are near-identical views. Divergence between them without
  reason is worth a finding.

Do only this unit. Do not continue to another one.
```
