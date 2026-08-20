# U1 · Make dashboard state shareable (URL query params)

- **Scope:** all three dashboards
- **Backend:** none
- **Model / effort:** Sonnet 5, medium effort — well-bounded once R2 has centralized the state
- **Depends on:** R2 (hard — without it you write this three times)

---

```
None of the three activity-tracking dashboards put any state in the URL. Date, time range,
visualization mode, baseline and the selected domain/process/app all live in local refs, so a
refresh drops the user back to today 07:00-00:00 on the timeline view, and a dashboard showing
something interesting cannot be linked to. CLAUDE.md requires filterable/bookmarkable state to live
in `vue-router` query params, and this module is the main violator.

After R2 the state is centralized in `src/core/activityTracking/composable/useActivityDashboard.ts`,
so this is one change serving all three views.

Sync these to the query string:
  date            ISO yyyy-MM-dd  (formatDateForApi in @/_common/utils/DateTimeHelper.ts)
  from, to        HH:mm           (the Time class, @/_common/dto/dto/Time.ts)
  view            'stackedBars' | 'timeline'
  baseline        the BaselineType value ('last7days' | 'last30days' | 'sameWeekday' | 'allTime')
  window          the stacked-bars window size, one of 15/20/30/60/90/120
  selected        the selected domain / productName / appLabel, omitted when null

Requirements:
- Omit params sitting at their default so a plain /activity-tracking URL stays clean. Current
  defaults: today, 07:00, 00:00, timeline, last7days, 30, none.
- Parse defensively on load. Every one of these is user-editable text: an unparseable date, a
  malformed time, an unknown view/baseline or an out-of-range window must fall back to the default
  rather than firing a request with garbage or rendering a blank chart.
- Use `router.replace` for state changes, not `push` — otherwise dragging the time picker fills the
  history stack. Genuine navigations (if any) still push.
- Restoring from the URL must fire exactly one round of fetches on mount, not one per param. The
  existing `watch([date, timeFrom, timeTo], ..., { immediate: true })` will otherwise re-fire as each
  param lands.
- `selected` is cleared by that same watch whenever the date/time changes. Keep that behaviour —
  but a URL that arrives *with* a `selected` param must not have it wiped by the immediate run.
- All three views share the param names. `selected` is deliberately generic rather than
  domain/process/app, so the three URLs stay symmetric.

`src/_common/composable/table/useTableUrlState.ts` is the closest existing pattern in the repo for
encode/parse-with-fallback structure — read it for shape, but do not try to reuse it; it is built
around page/perPage/sortBy and does not fit.

Verify: set a non-default state on each dashboard, copy the URL, open it in a new tab, confirm the
view restores exactly and that only one round of requests fires (check the network tab). Confirm
browser back/forward does not thrash. Run `npm run type-check` and `npm run lint`.
```
