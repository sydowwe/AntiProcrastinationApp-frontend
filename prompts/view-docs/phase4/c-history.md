# Phase 4 extract — group `history`

Run as **Sonnet 5, high effort, clean context, no browser.** Can run in parallel with any other session.

```
Read prompts/view-docs/phase4/TEMPLATE-extract.md in full and follow it exactly. This message
fills in its group parameters.

- Group: `history` → write docs/data-map/history.md
- Units: 04 `history-capture`, 03 `history-review`
- Modules (DTO source): src/core/activityHistory/dto/, src/core/historyDashboard/dto/

Group-specific notes:
- historyDashboard is not a feature module. It is a component library for activityHistory
  (CLAUDE.md, "historyDashboard"). Treat the two as one boundary unit: a read from
  historyDashboard/component/ of an activityHistory field is NOT a cross-module read.
- Most historyDashboard DTOs are chart and aggregate payloads, so they are almost all `derived`.
  For those, the interesting question is not "is it read" but "is it read in full". A chart
  payload whose breakdown fields no series uses is `derived · unread` for those fields. Charts
  are echarts, so read the series and option builders, not the template.
- The four capture modes (stopwatch, timer, pomodoro, manual) all end in the same history record.
  Record which mode can set which field. A field only one mode can set is worth a line in the
  Summary.
- Record the running-timer store's persisted state as a data source too
  (store/runningTimerStore.ts). It is captured client-side, and what survives a reload is part of
  the answer.

This is a Windows machine. Use the PowerShell tool for shell commands, never Bash.
Do only this group.
```
