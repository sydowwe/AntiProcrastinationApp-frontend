# R2 · Share the dashboard machinery (keep three views)

- **Scope:** all three dashboards
- **Backend:** none
- **Model / effort:** Opus 5, high effort — the whole task is choosing *where the seam goes*. A model that guesses wrong here produces an abstraction that has to be torn out.
- **Depends on:** R1 (cleaner starting point, not a hard blocker)
- **Unblocks:** U1, U2, U6

---

```
Extract the shared machinery behind the three activity-tracking dashboards WITHOUT merging
them into one component. Three separate views is a deliberate decision — they will diverge —
so the goal is to delete duplication, not to build a generic dashboard.

The three files:
  src/core/activityTracking/view/ActivityDashboard.vue        (298 lines, web extension)
  src/core/activityTracking/view/DesktopActivityDashboard.vue (364 lines)
  src/core/activityTracking/view/AndroidActivityDashboard.vue (310 lines)

They are ~85% identical. What is byte-for-byte the same in all three:
- the sticky header block (h1 + MyDateInput + TimeRangePicker + a stackedBars/timeline
  VBtnToggle carrying the same inline border-color style)
- `today`, `date`, `timeFrom = new Time(7,0)`, `timeTo = new Time(0,0)`
- `selectedVisualization`, `selectedWindowSize = 30`,
  `activityWindowSizeOptions = [15, 20, 30, 60, 90, 120]`
- the four `baselineOptions` (BaselineType.Last7Days / Last30Days / SameWeekday / AllTime)
  with hardcoded English titles
- `timelineFrom` / `timelineTo` computeds, including the "if `to` <= `from`, add a day"
  midnight-rollover rule
- four `*Loading` refs, four `fetch*()` bodies differing only in which API function and
  request class they name
- `watch([date, timeFrom, timeTo], ..., { immediate: true })` clearing the selection and
  firing all four fetches, plus `watch(selectedBaseline, fetchSummaryCards)`
- `handleBaselineChange`, `handleWindowSizeChange`, `handleActivityClick`,
  `handleSessionClick`, and a `handle*Select` that toggles selection off on re-click

What genuinely differs per view: the API module, the request DTO classes, the response DTO
shapes, and the mapping of those responses into the three shared view models
(`SummaryCardsData`, `StackedBarsInputWindow`, `TimelineSessionDto`) — plus which field feeds
`getDomainColor()` (domain / processName / packageName) and which pie-chart section component
renders. Android additionally has no detail or background timeline lanes and passes `[]` for both.

Do this:

1. Create `src/core/activityTracking/composable/useActivityDashboard.ts`. It owns the date/time
   state, the visualization + window-size + baseline + selection state, the timelineFrom/To
   computeds, the loading refs, the watches and the handlers. It takes a per-source *fetcher*
   object — four async functions the caller supplies, each already closing over its own API
   module and request class, each returning the shared view-model type. The composable never
   imports a desktop/android/web DTO or API module; that stays in the view.
   Model the shape on the existing composables under `src/_common/composable/general/` —
   plain `function` declarations, `ref` over `reactive`, returned as a flat object.

2. Create `src/core/activityTracking/component/ActivityDashboardHeader.vue` for the sticky
   header. `date` / `timeFrom` / `timeTo` / `selectedVisualization` as `defineModel()`s, the
   title as a prop. Move that repeated inline `border-color: rgba(var(--v-theme-on-surface),
   0.3) !important; height: 40px` into a scoped class in this one file rather than copying the
   style string a fourth time.

3. Move `activityWindowSizeOptions` and the `baselineOptions` array into the composable as the
   single definition. Leave their titles as they are for now — R3 localizes them, and doing it
   here would collide.

4. Rewrite all three views against the composable. Each should end up as: its own imports, its
   own fetcher object, its own response→view-model computeds, and a template. Expect each to
   land near 120-160 lines. Behaviour must be identical afterwards, including Android's empty
   detail/background lanes and Desktop's `DesktopPieChartSection` receiving `:from`/`:to`.

Do NOT: merge the views, introduce a `source: 'web' | 'desktop' | 'android'` discriminator, add
a Pinia store, or touch the DTO tree (U4's backend work may collapse it, and pre-empting that
here would be wasted). Do NOT change any rendering.

Verify by loading all three dashboards and confirming the charts, selection-toggle behaviour
and baseline switching are unchanged. Run `npm run type-check` and `npm run lint`.
```
