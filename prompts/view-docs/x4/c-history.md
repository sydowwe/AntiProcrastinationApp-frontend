# X4 — group `history`

Run as **Sonnet 5, high effort, clean context.** Run after `00-shell`.

```
Read prompts/view-docs/x4/TEMPLATE.md in full and follow it exactly. This message fills in its
group parameters.

- Group: `history` → playwright-cli session `-s=x4-history`
- Account: primaryUser
- Views, in this order:
    history-capture   StopWatchView            /activity-history/stopwatch
    history-capture   TimerView                /activity-history/timer
    history-capture   PomodoroTimerView        /activity-history/pomodoro
    history-capture   AddActivityManuallyView  /activity-history/manual
    history-review    HistorySummaryView       /activity-history
    history-review    HistoryCalendarView      /activity-history/calendar
    history-review    HistoryDetailView        /activity-history/detail
- Component ownership:
    the four capture views share a shell and the "Record activity to history" dialog
    → history-capture; file a shared defect once there
    historyDashboard/component/* (HistoryPieChart, HistoryInsights, HistoryTimeline…)
    → history-review (historyDashboard is its component library, not a unit)
    Home also mounts HistoryPieChart. If it misbehaves, add `/` to the finding's Where.

Group-specific traps:
- Charts are echarts on <canvas>. They're invisible to the snapshot, and a canvas that doesn't
  resize is exactly the mobile defect to look for. Judge them from the read-back screenshot, and
  eval the canvas's width against its container's. A chart legend that overflows is the usual
  failure.
- Don't start the stopwatch, timer or pomodoro. Starting one is a mutation (the running-timer
  store persists across reloads). Judge the idle layout, and open the record dialog only if it
  can be opened without a running session. If it can't, mark it U.
- /activity-history/detail legitimately shows "No data for this period" for the seed date.
  Navigate to a populated period (the week view is populated) before judging the layout.

Do only this group.
```
