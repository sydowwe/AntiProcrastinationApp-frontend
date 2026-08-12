# H8 · Export the visible history

- **Scope:** activityHistory + historyDashboard
- **Backend:** none (deliberately — see below)
- **Model / effort:** Sonnet 5, medium
- **Depends on:** H3, H5
- **Unblocks:** nothing

---

```
There is no way to get data out of the history module. Add export, using the framework's existing
machinery — do not write a CSV serializer or a download helper by hand.

Read these first, they almost certainly cover the whole job:
  @/_common/component/ExportMenu.vue
  @/_common/utils/fileDownload.ts
  @/_common/docs/components.md and utils.md (in the submodule) for their documented API

Add an export control to:
- HistorySummaryView — exports the current period's grouped totals (what the summary cards and pie
  chart are showing): group name, total seconds, entry count, percent change vs baseline.
- HistoryDetailView — exports the day's raw records (what HistoryTimeline shows): start timestamp,
  end timestamp, duration, activity name, category, role.

Scope it to what is on screen. The export must reflect the current date range, groupBy and filters
exactly — an export that silently returns something other than what the user is looking at is worse
than no export. Put the range and groupBy in the filename.

Formats: CSV at minimum. Add whatever else ExportMenu already supports for free; do not add a PDF
dependency.

Data source: the responses already in memory from the three dashboard calls (and, for the detail
view, HistoryTimeline's record list). Do NOT add an export endpoint — the client already has
everything, and a server-side export would need its own auth-scoped range logic for no gain at this
size. If you find the visible data is genuinely insufficient (e.g. the pie chart is capped at 20
items server-side via the `20` argument in the pie-chart requests, so an export built from it would
be silently truncated), say so explicitly in your report and either raise that cap for the export
request or state the limitation in the UI — do not ship a truncated file that looks complete.

Formatting rules:
- Durations as both raw seconds and a human string; a spreadsheet user wants the number.
- Timestamps in ISO 8601, local time, with the offset. Do not export the display-formatted time.
- Localize the column headers via H5's locale files.
- Escape properly — activity names and role names are free text and will contain commas, quotes and
  newlines (HistoryRecordItem renders `record.activity.text` with `white-space: pre-line`, so
  newlines are real).

A note on how this is delivered: the framework's download path is a normal browser download and
works fine in the app. Nothing here needs to run inside a sandboxed page.

Do NOT: add a new npm dependency, build a column-picker dialog, or add an export button to the
calendar view (its per-day summaries are a rendering of the same data — one export surface per
question is enough).

Verify: export from both views with an activity name containing a comma and a multi-line note, open
the file in a spreadsheet, and confirm the row count and totals match what the UI shows.
```
