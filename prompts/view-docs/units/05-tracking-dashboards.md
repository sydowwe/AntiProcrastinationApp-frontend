# Unit 05 — tracking-dashboards

Module: `activityTracking`

Run as **Sonnet 5, high effort, clean context**. One unit per session. Move this file to `_done/` when the
unit's docs have landed and you have read them.

This unit is read-only — no mutation pass.

---

```
Read prompts/view-docs/PROMPT-TEMPLATE.md in full and follow it exactly. It is the
specification for this task: the procedure, the hard constraints, the deliverables and
their exact section headings, the severity and ID rules, and the closing report format.

Fill its Unit block with:

- Unit name: `tracking-dashboards`
- Module: `activityTracking`
- Pass: `inventory`
- Views & routes:
    `ActivityDashboard` `/activity-tracking`
    `UnifiedActivityDashboard` `/activity-tracking/unified`
    `DesktopActivityDashboard` `/activity-tracking/desktop`
    `AndroidActivityDashboard` `/activity-tracking/android`
- Intent sources: prompts/_done/activity-tracking/README.md, U4-unified-source.md,
  U5-fragmentation-metrics.md, U5b-adopt-focus-metrics-endpoint.md,
  U6-empty-and-first-run.md, U1-url-state.md

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
- Four dashboards, and the unified one is a FOURTH view, not a replacement — the route
  table says the three per-source dashboards stay and the unified one answers what none of
  them can. Do not report the overlap as duplication.
- The three per-source views share machinery (R2/U4). Where they diverge in behaviour for
  no apparent reason, that is worth a finding.
- U6 covers empty and first-run states. These dashboards depend on external trackers
  (desktop agent, Android app) that may have no data at all in your environment — if a
  dashboard is empty because nothing ever fed it, that is an empty-state observation, not
  a defect. Say which it is.
- U1 covers URL state: check the date range and any source filter survive a reload.
- Read-only unit — no mutation pass. Settings for these dashboards are unit 6.

Do only this unit. Do not continue to another one.
```
