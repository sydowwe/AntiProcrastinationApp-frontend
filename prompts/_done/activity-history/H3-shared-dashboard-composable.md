# H3 · Extract the shared machinery behind the two history dashboards

- **Scope:** activityHistory views + historyDashboard
- **Backend:** none
- **Model / effort:** Opus 5, high effort — the whole task is choosing where the seam goes. The two views must stay two views; a wrong abstraction here gets torn out.
- **Depends on:** H1, H2 (cleaner starting point; H1's fetch-error fixes should land in the composable, not be duplicated then merged)
- **Unblocks:** H5, H6, H7

---

```
HistorySummaryView.vue (305 lines) and HistoryDetailView.vue (285 lines) in
src/core/activityHistory/view/ are ~70% the same code. Extract the shared part WITHOUT merging the
views — they answer different questions (a multi-day range vs one day's timeline) and will keep
diverging. The goal is deleting duplication, not building a generic dashboard.

FIRST: check whether src/core/activityTracking/composable/useActivityDashboard.ts exists (it is the
deliverable of prompts/activity-tracking/R2-share-dashboard-machinery.md). If it does, read it and
mirror its shape and naming — the two live side by side and gratuitous divergence is worse than
either choice alone. Do NOT try to make one composable serve both; activityTracking's dashboards
have a different request/response tree.

What is duplicated verbatim across the two views:
- `parseDate(dateStr)` — the `new Date(str)` / fall back to `str.replace(' ', 'T')` helper
- the `stackedBarsWindows` computed mapping HistoryWindow[] → StackedBarsInputWindow[], including
  `backgroundSeconds: 0` and `item.color ?? getDomainColor(item.name)`
- the three data refs (stackedBarsData / pieChartData / summaryCardsData) and the three matching
  `*Loading` refs
- the three `fetch*` bodies, which differ only in which api function and which request class they name
- `fetchAll()`, including its `selectedGroup.value = null` reset and the `if (!date.value) return` guard
- `selectedGroup`, `topN` (4), `selectedWindowSize`, `selectedBaseline`
- `handleBaselineChange`, `handleTopNChange`, `handleGroupSelect` (the toggle-off-on-re-click one),
  `handleWindowSizeChange`
- `watch(selectedBaseline, fetchSummaryCards)`

What genuinely differs and must stay in the views:
- the request DTOs: HistorySummary{StackedBars,PieChart,SummaryCards}Request (date + rangeType +
  endDate + a UTC-converted time window) vs Detail{StackedBars,PieChart,SummaryCards}Request
  (a single date + Time from/to)
- the api functions: getSummary* vs getDetail*
- the default baseline: Last7Days (summary) vs SameWeekday (detail)
- window-size options: summary computes them from the range type (the switch at
  HistorySummaryView.vue:164-190, in hours, converted to minutes); detail is a fixed [15,20,30,60] in minutes
- summary derives chartTimeFrom/chartTimeTo from the first and last window of the response; detail
  binds the user's TimeRangePicker directly
- detail has the stackedBars/timeline VBtnToggle and the HistoryTimeline pane; summary has neither

Do this:

1. Create src/core/activityHistory/composable/useHistoryDashboard.ts. It owns the three data refs,
   the three loading refs, the selection/topN/baseline/window-size state, `stackedBarsWindows`,
   `parseDate`, `fetchAll` and the four handlers. It takes a fetcher object — three async functions
   the caller supplies, each already closing over its own api function and request class and
   returning the shared response type — plus the default baseline and a `canFetch` predicate
   replacing the inline `if (!date.value) return`. The composable must not import a Summary* or
   Detail* request class or a request-shaped date model. Plain `function` declarations, `ref` over
   `reactive`, returned as a flat object, per CLAUDE.md.

2. Fetch failures null the corresponding data ref (H1 item 2) — implement that once, here.

3. `parseDate` is a date-parsing helper, not dashboard state. If `@/_common/utils/DateTimeHelper.ts`
   already has an equivalent, use it and drop the local copy; if not, keep it private to the
   composable and add a one-line note to migration-revision.md that it is a framework candidate.

4. Rewrite both views against it. Each should keep: its own imports, its own fetcher object, its own
   date/range model and watches, and its template. Expect each to land near 150-180 lines.
   Behaviour must be identical — same requests fired on the same triggers, same selection semantics.

5. Move `HistoryGroupBy` from src/core/historyDashboard/component/types/HistoryGroupBy.ts to
   src/core/historyDashboard/dto/enum/HistoryGroupBy.ts and repoint its importers. It is an enum
   crossing a module boundary; `component/types/` is not a legal cross-module import path under
   CLAUDE.md, `dto/` is. Delete the now-empty component/types/ directory.

Do NOT: merge the two views, introduce a `mode: 'summary' | 'detail'` discriminator, add a Pinia
store, change any request payload, or touch the rendering. Do NOT localize anything — H5 does that.

Verify: with the network tab open, confirm each view fires exactly the same three requests with the
same bodies as before on load, on range change, on baseline change and on window-size change.
Run `npm run type-check` and `npm run lint`.
```
