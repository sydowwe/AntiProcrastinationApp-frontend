# U2 · Request lifecycle — debounce, cancel, and actually handle errors

- **Scope:** all three dashboards
- **Backend:** none
- **Model / effort:** Sonnet 5, medium effort
- **Depends on:** R2 (hard)

---

```
Every activity-tracking dashboard fires four parallel POSTs (summary-cards, pie-chart,
stacked-bars, timeline) from one watcher:

    watch([date, timeFrom, timeTo], () => { ...four fetches... }, { immediate: true })

Three problems, all of which the shared composable from R2 lets you fix once.

1. NO DEBOUNCE. `timeFrom`/`timeTo` come from `<TimeRangePicker>`, so scrubbing the range emits a
   burst of updates and each one costs four requests. Debounce the watcher (~300ms is right for a
   picker; `date` changes are discrete and could fire immediately, but one uniform debounce is
   simpler and fine here).

2. NO CANCELLATION. Nothing aborts in-flight requests, so responses can land out of order and paint
   a chart for a range the user has already moved off. Thread an `AbortController` through: create
   one per fetch round, abort the previous round's controller when a new one starts, and pass its
   signal on the axios config. Axios cancellations reject — make sure an aborted request is
   swallowed rather than surfacing as an error state (item 3) or clearing the loading flag for the
   round that superseded it.

3. NO ERROR HANDLING. All twelve fetch functions across the three views are shaped

       loading.value = true
       try { data.value = await getX(...) } finally { loading.value = false }

   with no `catch`. A failed request leaves the previous data on screen with no indication anything
   is wrong — the panel just silently shows stale numbers for the wrong range. Add a per-panel error
   ref, and render a compact error state with a retry button in each of the four panels
   (StackedBarsChart, ActivityTimeline, ActivitySummaryCards, and the three pie-chart sections)
   alongside the loading and empty states they already have. Retry should re-run only that panel's
   fetch, not all four.
   The axios interceptor already raises an error snackbar globally — so the in-panel state should be
   quiet and local (an icon, a line of text, a retry button), not a second shouty alert. If a panel's
   error is better served by suppressing the global snackbar, pass `_silent: true` on that request
   config (see `_common/api/` in CLAUDE.md).

Also worth fixing while you are here: the four fetches are independent, so one failing should not
block the other three. Confirm they are launched in parallel and awaited independently — not
sequentially awaited in the watcher.

New user-facing strings go in _locales/activityTracking.{sk,en}.ts, SK primary. If R3 has already
run, follow the key structure it established; if not, add yours under the same top-level namespace
and R3 will absorb them.

Verify: throttle the network to slow-3G, scrub the time range hard, and confirm only the final range
paints and the request count is bounded. Then block one endpoint (devtools request blocking) and
confirm its panel shows a retry that works while the other three render normally.
Run `npm run type-check` and `npm run lint`.
```
