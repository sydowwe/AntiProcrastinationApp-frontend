# history-review — use cases

## What this unit is for

Lets a user look back at time they have already logged (`ActivityHistory` rows, captured by unit 4's four
capture views) and understand it at three levels of granularity: a multi-day trend with comparisons
(Summary), a month-at-a-glance grid (Calendar), and a single day's raw record list (Detail). It answers
"what have I actually been doing" rather than "what should I do" — the planning half of the app lives in
`dayPlanner` and `todoList`.

## Where it sits

Reached from the sidebar's **History** group (Summary, Calendar) or from the user's own exploration once
inside the module — Calendar and Summary both drill down into Detail for a specific day, and Detail links
back to both. It touches `activityTracking` only by sharing the `StackedBarsChart` and `BaselineOption`
component/enum (see `historyDashboard`, the component library this unit's views consume), and touches
`activity` for role/category names via the nested `activity` payload on every history record.

## Views

### HistorySummaryView (`/activity-history`)
**Purpose:** The module's landing page — a multi-day trend (default: this week) with a stacked-bar chart,
grouped totals, a pie chart, and stated insights.
**Who opens it and why:** Someone who wants a shape-of-the-week/month view rather than a single day —
"where did my time actually go this week."

**What the user can do**
- Change the range length (3 days / week / two weeks / month / three months / year / custom range) and the
  anchor date, stepping a day at a time or picking one directly
- Switch the grouping axis between Activity, Role and Category
- Narrow the stacked-bar chart's window size (from 15 minutes up to a full day, options depend on range
  length) and the day's start/end clock bounds
- Compare the "Top Activities" cards against a baseline (last 7 days / last 30 days / same weekday / all
  time) and choose how many groups to show (3–10)
- Click a top-activity card to cross-highlight that group in the pie chart
- Click a stacked-bar column to drill into `HistoryDetailView` for the day that window starts on, carrying
  the current groupBy along
- Export the current period's grouped totals as CSV (or Excel, via the shared `ExportMenu`)
- Jump to `HistoryCalendarView` via a calendar icon button

**What the user can see, and the question it answers**
- Stacked-bar chart — answers "how is my time distributed across the days/windows in this range"
- Insights block (H10) — up to a few stated sentences ("You logged 19h 7m across 20 entries — about 57m
  each", "Between 11:00 and 13:00 you logged 10h 20m — 54% of the period") answering "what would I not have
  noticed by reading the charts myself"
- Top Activities cards + period-total banner — answers "which groups grew or shrank vs a baseline, and by
  how much"
- Pie chart — answers "what's the share of each group in this period"

**Depends on:** `firstDayOfWeek` user preference is not read directly by this view (no week-grid), but is
used by `HistoryDetailView`'s "back to summary for the week" link. First-run detection
(`getHasAnyHistoryEver`) decides whether to show the normal dashboard or a single onboarding block.

### HistoryCalendarView (`/activity-history/calendar`)
**Purpose:** A month grid, one summarised cell per day, for spotting a specific day worth opening.
**Who opens it and why:** Someone scanning a longer stretch by eye rather than by chart — "which day last
month was unusually long/short."

**What the user can do**
- Change month/year and the visible day range ("All week" / narrower) via the calendar's own controls
- Click a day cell to open `HistoryDetailView` for that date
- Navigate to `HistorySummaryView` via the sidebar (no calendar→summary icon button — the reverse direction
  Summary→Calendar exists, this direction does not)

**What the user can see, and the question it answers**
- Per-day cell (wake/bed time row, total duration + session count, up to two role/category breakdown rows) —
  answers "how much did I log this day, and in what mix"
- A bottom strip of named public holidays for the visible range — answers "were any of these light days a
  holiday" (see Findings — this strip currently renders Slovak holiday names regardless of the account's
  language)

**Depends on:** `firstDayOfWeek` user preference (grid start-of-week). First-run detection is a local
existence check (`getHasAnyHistoryEver`), fired only when the visible range comes back all-empty — so it
never runs on a populated month.

### HistoryDetailView (`/activity-history/detail`)
**Purpose:** A single day's history, either as an hour-by-hour stacked-bar chart or a chronological
timeline of raw records, plus the same grouped-comparison panel as Summary.
**Who opens it and why:** Always arrived at by drilling in from Summary or Calendar (see Entity lifecycle) —
nobody opens this cold to pick a date; the date field exists to adjust the day once here, via the ‹/› arrows
or the date picker.

**What the user can do**
- Toggle between "Stacked bars" and "Timeline" visualization for the same day
- Step the date a day at a time, or pick one directly (capped at today)
- Narrow the day's start/end clock bounds
- Switch the grouping axis between Activity, Role and Category
- Compare against a baseline (default: same weekday) and choose how many groups to show
- Export the day's raw records as CSV (or Excel)
- Jump back to `HistoryCalendarView` (calendar icon) or to `HistorySummaryView` for the week containing this
  day (chart-line icon) — the latter carries the date and groupBy along

**What the user can see, and the question it answers**
- Timeline (`HistoryTimeline`) — a chronological list of the day's raw `ActivityHistory` records, each with
  start/end, duration, activity, role chip and any notes — answers "what did I actually do, in order"
- Stacked-bar chart (same component as Summary, single-day scale) — answers "which hours of this day were
  busy, and with what"
- Insights column (summary cards + pie chart, same components as Summary) — answers "how does today compare
  to the baseline, and what's the mix"

**Depends on:** `firstDayOfWeek` (only for the "back to summary for the week" link's week-start
calculation). Not reachable from any sidebar entry or nav link — see Entity lifecycle.

## Entity lifecycle

This unit is entirely **read-only** — it does not create, edit or delete `ActivityHistory` rows (that is
unit 4's `history-capture`). What it does own is drill-down navigation between its own three views:

- **Summary → Detail:** click a stacked-bar column. Carries `date` (the day the clicked window starts on, in
  the user's timezone) and `groupBy`.
- **Calendar → Detail:** click a day cell. Carries `date` only (Calendar has no groupBy concept of its own).
- **Detail → Calendar:** icon button, no state carried (Calendar owns its own month/year).
- **Detail → Summary:** icon button, opens the week containing the current day with the current `groupBy`.
- **Summary → Calendar:** icon button, no state carried.
- **Calendar → Summary:** only via the sidebar, not a dedicated control.

`/activity-history/detail` carries no sidebar or nav-menu entry (confirmed both in
`docs/views/_routes.md` and by inspecting `src/app/nav/navItems.ts`) — this is deliberate, not an
oversight: verified live that it is reachable through both drill-down paths above, and links back out of
both. `docs/views/_routes.md`'s "orphan candidate ⚠️" flag on this route can be resolved as "not an orphan —
confirmed drill-down target," which is the main open question this unit's intent sources (H6) asked to
settle.

## Data this unit captures but does not spend

None found. Every response field this unit fetches is rendered somewhere on screen (raw record fields on
the timeline, per-window totals on the stacked bars, per-group totals/counts/percent-change on the cards and
pie chart, per-day totals/session-counts/role-breakdown on the calendar). The insights sentences (H10) are
themselves a case of *spending* otherwise-unstated data (the pie chart's own response, plus one dedicated
`summary/time-of-day` fetch) rather than leaving it uncaptured.
