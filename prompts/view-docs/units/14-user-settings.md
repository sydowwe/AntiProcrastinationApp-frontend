# Unit 14 — user-settings

Module: `user + googleCalendar`

Run as **Sonnet 5, high effort, clean context**. One unit per session. Move this file to `_done/` when the
unit's docs have landed and you have read them.

For the mutation pass, paste the same block with `Pass:` changed to `mutation`.

---

```
Read prompts/view-docs/PROMPT-TEMPLATE.md in full and follow it exactly. It is the
specification for this task: the procedure, the hard constraints, the deliverables and
their exact section headings, the severity and ID rules, and the closing report format.

Fill its Unit block with:

- Unit name: `user-settings`
- Module: `user + googleCalendar`
- Pass: `inventory`
- Views & routes:
    `UserSettingsView` (app wrapper) `/user/settings` incl. the framework view it wraps
    `TermsView`  `/legal/terms`
    `PrivacyPolicyView`  `/legal/privacy`
    `GoogleCalendarCallbackView`  `/google-calendar/callback`
- Intent sources: prompts/_done/user/README.md, P1-two-settings-systems.md,
  U3-export-and-snackbars.md, U4-about-honesty.md, U5-legal-pages.md,
  A2-deletion-cliff.md, P4-device-local-state.md

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
- DANGER: this view contains "delete account" (A2 is literally "the deletion cliff"). Do
  NOT trigger it, in either pass. Document the control, its confirmation copy and what it
  claims will be destroyed, then stop. Same for "log out" — it ends your session.
- THE HIGH-VALUE CHECK: CLAUDE.md requires every module settings page to be reachable
  from here, and says ModuleSettingsSection links to each by route NAME. Cross-check the
  links rendered here against docs/views/_routes.md. `/routine-settings` in particular has
  no nav entry anywhere else, so if it is missing here it is unreachable by any route
  except typing the URL. Also check /day-planner/settings and both tracking settings.
- The app's UserSettingsView is a thin wrapper around the framework's, filling
  #integrations, #preferences and #append. Findings in the framework's part of the screen
  are [framework]; findings in the app's three settings cards are app-side. Say which.
- P1 ("two settings systems") and CLAUDE.md's preference-ownership table matter here:
  there are THREE preference systems (user preferences, reminder preferences, module
  settings). Flag any preference that looks like it lives in the wrong one — but note
  that moving one is a backend change, not a frontend refactor.
- The locale switcher on this page is what the whole sweep depends on. Do not leave the
  account in Slovak.
- GoogleCalendarCallbackView is only reachable as a Google OAuth redirect. If you cannot
  complete a real OAuth round trip, record it as unverified with what would be needed —
  do not fake a visit to the route and document the error page as if it were the view.

Do only this unit. Do not continue to another one.
```
