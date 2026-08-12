# L1 · Put the four leisure tables on `useServerTable`

- **Scope:** module-wide refactor — all four tables + all four views
- **Backend:** no
- **Model / effort:** Sonnet 5, high effort — mechanical in shape but it moves filter ownership across the view/table boundary in four places at once, and this is the app's first adopter of the composable
- **Why first:** every other prompt in this set edits one of these files. Doing this after them means doing it four times.

---

```
The four leisure tables each hand-roll paginated server table state. The framework already has a
composable that does all of it — src/_common/composable/table/useServerTable.ts — and NOTHING in
src/ uses it yet. Leisure is the first adopter. Read that file before writing anything.

WHAT IT GIVES YOU
useServerTable({ fetch, defaultFilter, filterToParams, paramsToFilter, onError }) returns
{ items, itemsLength, loading, page, itemsPerPage, sortBy, filter, load, reload }. It already
handles: URL state for page/perPage/sortBy (via useTableUrlState.ts) and for the filter through
your filterToParams/paramsToFilter pair; resetting to page 1 on any filter change; and coalescing
the resulting burst into ONE fetch. Wire `load` to BasicTable's @onLoadItems and call `reload()`
after create/update/delete.

THE FOUR PAIRS
- view/BacklogView.vue        + component/backlog/BacklogTable.vue
- view/BucketListView.vue     + component/bucketList/BucketListTable.vue
- view/ProjectsView.vue       + component/project/ProjectTable.vue
- view/MemoryAnchorsView.vue  + component/memoryAnchor/MemoryAnchorTable.vue

Each table today declares items/itemsLength/itemsPerPage/page/sortBy/loading refs, builds a
FilteredTableRequest by hand in loadItems(), and watches the `filter` prop to reset the page. All
of that is deleted. Each view owns `const filter = ref(new XFilter())` and passes it down; after
this the filter ref comes from useServerTable instead, so decide the ownership explicitly:

Put useServerTable in the VIEW, not the table. The view already owns FilterPanel, and FilterPanel
needs a writable filter ref — that is the same ref useServerTable returns. Pass the table what it
now needs as props (items, loading, itemsLength, and the page/perPage/sortBy models) and let it
keep emitting @onLoadItems upward, OR keep the request plumbing in the table and pass the filter
down as a model. Pick one shape and apply it to all four identically. State which you picked and
why in your summary. Consistency across the four matters more than which shape wins.

URL STATE IS THE POINT, NOT A SIDE EFFECT
CLAUDE.md requires filterable/bookmarkable state in URL query params, and this module has none
today — reload the backlog page and every filter is gone. So filterToParams/paramsToFilter must
actually round-trip every filter field, not just the scalar ones. The hard cases:
- ActivityBacklogProfileFilter has FIVE array fields (locationTypeIds, weatherDependencyIds,
  energyLevels, effortTypes, expectedCostTierIds) plus maxDurationMinutes and a tri-state
  isOneTime (true | false | null — null must NOT round-trip as false).
- ActivityBucketListProfileFilter has min/maxComfortZoneStep and tri-state requiresTravel.
- ActivityProjectProfileFilter has two enum arrays plus tri-state isMessy.
Write ONE shared pair of helpers for the repeated encodings (number array, string/enum array,
tri-state boolean) in src/core/leisure/composable/ rather than four bespoke encoders. Empty and
null values must be absent from the query string, not present as empty params.

VERIFY, don't assume: after the change each of the four pages must survive a hard reload with
filters, page and sort intact, and changing a filter must still fire exactly one request (check
the network tab or the request state) — the single-fetch guarantee is the whole reason the
composable exists.

Run `npm run type-check` (baseline is 72 errors, all app-side in src/core — do not add to it and
do not introduce any error in src/_common) and `npm run lint` (must stay at 0 errors).
```
