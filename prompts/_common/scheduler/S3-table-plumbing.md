# S3 · Two grids onto `useServerTable` — delete ~150 lines the framework already owns

- **Scope:** `view/SchedulerJobsView.vue`, `component/JobRunHistory.vue`, delete `composable/listQueryState.ts`
- **Backend:** —
- **Model / effort:** Opus 5, high
- **Depends on:** S1 (it touches the same `loadItems`/filter code; running S3 first means redoing it)
- **Unblocks:** S4, S7 (both edit what is left of these two files)

---

```
Both scheduler grids hand-roll server-table plumbing that the SAME SUBMODULE already ships as a
composable. You are deleting the copies.

SUBMODULE RULES — read before editing:
src/_common is the vue_framework repo mounted as a git submodule, and CLAUDE.md says never to write
to it. This task is an explicit, user-approved exception: the scheduler module lives there and
nowhere else. So:
  - Edit the files in src/_common in this working tree. Do NOT fork a file into src/, and do NOT add
    a migration-revision.md entry.
  - Leave the work in the submodule's working tree and say so in your final message; the parent repo
    will show a dirty submodule pointer. Commit inside the submodule only if the user asks.
  - ESLint and Prettier ignore src/_common, so `npm run lint` will not check your work. Match the
    surrounding style by hand: tabs, single quotes, no semicolons, tab-indented <script setup>.
  - `npm run type-check` DOES cover src/_common. Baseline is 72 errors, all app-side in src/core;
    _common is clean. Any new error under src/_common is a regression you introduced.

WHAT EXISTS TODAY

  src/_common/modules/scheduler/composable/listQueryState.ts        39 lines
      queryString / queryNumber / queryBool / queryDate / queryEnum — parse a raw router query value
      into typed list state.
  view/SchedulerJobsView.vue:204-317                                ~115 lines
  component/JobRunHistory.vue:190-296                               ~105 lines
      Each: items / itemsLength / itemsPerPage / page / sortBy / filter refs hydrated from
      route.query, plus buildRequest(unpaged), syncQuery(), loadItems(), reload().

WHAT THE FRAMEWORK ALREADY SHIPS, two directories away

  src/_common/composable/table/useTableUrlState.ts
      page / itemsPerPage / sortBy / filter refs, hydrated from and mirrored back to the URL, with
      filterToParams / paramsToFilter hooks for the filter half.
  src/_common/composable/table/useServerTable.ts
      Wraps useTableUrlState and adds items / itemsLength / loading / load() / reload(), builds the
      FilteredTableRequest itself, and — read the comment at its `load()` — COALESCES the mount burst
      so a filter-driven page reset plus Vuetify's echoed options change produce one fetch, not two.
      It also takes an onError callback.

READ BOTH COMPOSABLES END TO END BEFORE WRITING ANYTHING. They are the contract; this prompt is a
summary of them and the code wins where they disagree.

THE TASK

1. Migrate SchedulerJobsView to useServerTable. Its `fetch` is the existing fetchFilteredTable from
   useScheduledJobQuery(). Supply defaultFilter, filterToParams and paramsToFilter so the seven
   filter fields still round-trip through the URL.
2. Migrate JobRunHistory the same way.
3. Delete composable/listQueryState.ts and its two import blocks. Confirm with a repo-wide grep that
   nothing else imports it before deleting — it is a module-private helper, but check.
4. Delete both buildRequest / syncQuery / loadItems / reload implementations. `load` and `reload`
   come from the composable; wire BasicTable's @onLoadItems to `load`.

THE FIVE THINGS THAT WILL BITE YOU

a) THE EXPORT PATH STILL NEEDS buildRequest(unpaged: true).
   Both views call buildRequest(true) to build an UNPAGED request for export
   (SchedulerJobsView.vue:323, JobRunHistory.vue:302) — rowsPerPage -1, page 1, same filter and sort.
   useServerTable builds its request internally and does not expose that. So keep a small local
   helper that builds the unpaged FilteredTableRequest from the composable's exposed page/sortBy/
   filter refs. Do not reach into the composable's internals and do not fetch a page just to export
   it. Preserve the existing comment explaining WHY export is unpaged — it is the only record of
   that convention.

b) THE RUN FILTER'S jobId MUST STAY RE-PINNED.
   JobRunHistory.vue:243-250 rebuilds ScheduledJobRunFilter with `jobId` forced back in on every
   request, under a comment saying so. That is a correct guard — the FilterPanel draft could
   otherwise drop it and the run log would go global — and it is NOT duplication to be cleaned up.
   Keep the guarantee through the migration: whichever hook you build the request in, jobId must be
   this component's jobId, not whatever is in the filter ref. Also make sure jobId does NOT get
   written into the URL query by filterToParams: it already lives in the route path, and duplicating
   it invites the two to disagree.

c) THE URL SORT FORMAT CHANGES, DELIBERATELY.
   Today: two params, `?sort=nextRunAt&dir=desc`. useTableUrlState encodes as one:
   `?sortBy=nextRunAt:desc` (see encodeSortBy / parseSortBy). Adopt the framework format — a
   framework module should not carry a private URL dialect. Consequences to handle:
     - Old bookmarks with ?sort=&dir= will fall back to the default sort rather than erroring. That
       is acceptable; do not write a back-compat shim for it.
     - Check the whole repo for anything that CONSTRUCTS a link into these routes with sort/dir query
       params and update it. (S6 plans to add such links; it will use the new format.)
   The default sorts must not change: jobs default to nextRunAt ASC (SchedulerJobsView.vue:214),
   runs default to startedAt DESC (JobRunHistory.vue:201). Note the two differ in direction — this is
   deliberate (soonest-first vs newest-first) and easy to flatten by accident.

d) `router.replace({ query })` CURRENTLY WIPES UNRELATED PARAMS.
   Both syncQuery functions (SchedulerJobsView.vue:293, JobRunHistory.vue:276) build a brand-new
   query object from list state alone, silently dropping anything else on the route. Check how
   useTableUrlState writes back — if it merges, this bug is fixed for free and you should say so in
   your report; if it also replaces, do not fix it here, just note it. Do NOT edit useTableUrlState
   in this prompt: it is shared by every table in the framework and its blast radius is far outside
   this module.

e) THE UNHANDLED REJECTION MOVES INTO onError.
   SchedulerJobsView.vue:305-307 and JobRunHistory.vue:288-290 currently do
   `catch (e) { if (!isCancel(e)) throw e }` from an unawaited async handler. If S1 already ran, that
   is now a snackbar; either way, the destination is useServerTable's onError callback. Keep
   ignoring cancellations there (isCancel from 'axios') and surface everything else — same behaviour,
   one place. Drop the now-unused `isCancel` import if nothing else needs it.

ONE MORE THING, only if it comes out clean: SchedulerJobsView.vue:240 keeps an `itemsById` computed
Map purely so the #additionalActions slot can look a row up by id. If the slot exposes the item
itself rather than just its id, the Map is unnecessary. Check BasicTable's slot signature and delete
it if so; if the slot really only gives you the id, leave the Map and do not fight it.

DO NOT, in this prompt:
  - change BasicTable, useServerTable or useTableUrlState — you are a CONSUMER of all three,
  - change any column, filter field, chip formatter or visible behaviour,
  - restructure the templates (that is S4/S7),
  - "improve" the export while you are in there.

THE POINT is that the diff is almost entirely deletions and the rendered pages are indistinguishable
from before. If you find yourself adding features, stop.

--- Verification ---

npm run type-check — must stay at 72 errors, all in src/core. Zero under src/_common.
Then, as an admin, on the jobs list AND on a job detail's run history:
  - Sort by three different columns, page forward, change rows-per-page: the URL must update and a
    full browser reload must restore exactly what is on screen.
  - Apply a filter: the page must reset to 1 (a filter matching 4 rows must not leave you on page 3
    looking at nothing).
  - Watch the network tab on first load: ONE request, not two. This is the mount-burst coalescing
    and it is the easiest thing to regress.
  - Type fast in a filter field and apply repeatedly: no unhandled rejections in the console, and the
    grid must end on the newest result, not a stale one.
  - Export both grids with a filter applied and more than one page of results: the file must contain
    the whole filtered set, not 25 rows.
  - On the run history, edit the filter and apply: the request payload must still carry the correct
    jobId, and the URL must not contain a jobId param.
  - Confirm the git diff is net-negative by a wide margin. If it is not, you have added something.

--- No backend ask is expected from this prompt ---

This is a pure refactor. If you hit a wall that needs the server, read
prompts/_common/scheduler/backend/README.md and follow it — but do not go looking for one.
```
