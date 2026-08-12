# H6 · Complete the URL state and wire up drill-through

- **Scope:** activityHistory views
- **Backend:** none
- **Model / effort:** Sonnet 5, medium — the pattern to copy already exists in HistorySummaryView; the work is applying it consistently and not creating a watch loop.
- **Depends on:** H3 (the composable owns most of the state being serialized)
- **Unblocks:** nothing

---

```
Two related gaps in src/core/activityHistory/view/.

--- 1. HistoryDetailView loses everything but the date on reload ---

HistorySummaryView already does this properly: init helpers at lines 111-147 read seven params off
the route, and a watch at line 301 replaces the query whenever any of them changes.

HistoryDetailView does neither. It reads only `route.query.date` (line 182) and writes back only
`date` (line 286). Reload the page and you lose: the stackedBars/timeline toggle, timeFrom, timeTo,
groupBy, the window size, the baseline and topN. CLAUDE.md requires filterable and bookmarkable
state to live in the URL query.

Give HistoryDetailView the same treatment for: date, view (stackedBars|timeline), timeFrom, timeTo,
groupBy, windowSize, baseline, topN. Reuse HistorySummaryView's helpers rather than copying them —
after H3 the natural home is the composable or a small sibling module next to it. Its
`serializeWindowSize` / `parseWindowSize` pair (minutes ↔ "2h30m") and `initTime` are directly
reusable.

While you are there, add `baseline` and `topN` to HistorySummaryView's URL sync too — it writes seven
params but not those two, so a shared link loses the comparison the sender was looking at.

Watch out for: `router.replace` inside a watch that also feeds the state it watches. HistorySummaryView
gets away with it because it writes a fresh query object; keep that shape. Use `replace`, never
`push` — these are continuous controls and each keystroke must not add a history entry.

--- 2. There is no way into the detail view except the calendar ---

Today: /activity-history/calendar → click a day → /activity-history/detail?date=... (see
HistoryCalendarView.vue:118). And the detail view has a calendar button back
(HistoryDetailView.vue:5-10). The summary view — the module's landing route — is a dead end. A user
looking at a week and spotting an odd day cannot get to that day.

Add:
- From HistorySummaryView: clicking a stacked-bar column navigates to
  `{ name: 'activityHistoryDetail', query: { date: <that window's day> } }`. StackedBarsChart is in
  src/core/activityTracking/component/stackedBars/ (see H4 about where it will live) — check what it
  already emits before adding an event; the activityTracking dashboards bind handlers to it, so a
  suitable emit may already exist. If a column spans more than one day (the summary view's windows
  can be 24h+), navigate to the day the window starts.
- Carry `groupBy` through that navigation so the detail view opens grouped the same way.
- A link from HistorySummaryView to the calendar, matching the icon button the detail view already has.
- From HistoryDetailView, a way back to the summary for the containing week.

Do NOT: build a breadcrumb component (the framework has AppBreadcrumbs — use it if it fits, don't
reinvent it), add a router-level state store, or change any request payload.

Verify: set every control on both views, copy the URL, open it in a new tab, and confirm the view
comes back identical — including that it fires the same requests. Confirm the browser back button
steps through navigations, not through individual slider drags.
```
