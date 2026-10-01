# Phase 4 extract — group `tracking`

Run as **Sonnet 5, high effort, clean context, no browser.** Can run in parallel with any other session.

```
Read prompts/view-docs/phase4/TEMPLATE-extract.md in full and follow it exactly. This message
fills in its group parameters.

- Group: `tracking` → write docs/data-map/tracking.md
- Units: 05 `tracking-dashboards`, 06 `tracking-settings`
- Modules (DTO source): src/core/activityTracking/dto/ (77 files, the largest in the app)

Group-specific notes:
- 77 DTO files is too many to map one by one. Work by ledger: desktop, android, web-extension
  (with unified on top), each under dto/request/<ledger>/ and dto/response/<ledger>/. Chart
  payloads live in dto/response/{focusMetrics,pieChart,stackedBars,timeline,topDomains}/. Give
  each ledger one "Entities" subsection for its raw entries and settings, and one subsection per
  chart payload family. Where a DTO is the same shape across ledgers, map it once and list the
  ledgers.
- The ledgers are written by external clients (desktop agent, Android app, browser extension),
  not by this web app. For those fields "captured in" is "external client (<ledger>)". This app
  only captures the mapping rules and ignore rules on the settings screens.
- Chart payloads are `derived`. As in the history group, ask whether each is read in full: are
  there breakdown fields no series or tooltip uses?
- B23 (android per-app detail endpoint) and B24 (distinct entries say which rule covers them) in
  prompts/view-docs/backend/_done/ added fields recently. Check whether the client reads what
  they added.
- Unit 05 is read-only. The dashboards capture nothing, so its only captured data is the filter
  and range state in the URL. Record that briefly and don't hunt for write paths.

This is a Windows machine. Use the PowerShell tool for shell commands, never Bash.
Do only this group.
```
