# R5 · Five views hand-roll `useServerTable`, which the framework already ships

- **Scope:** all five list views under `src/_common/modules/reminders/view/`
- **Backend:** —
- **Model / effort:** **Opus 5**, high
- **Depends on:** R1 (fixes bugs this refactor would otherwise carry forward), R4 (BOMs in four of these files)
- **Unblocks:** R6, R7, R8, R11 — all of which edit these same files and get much smaller after this

---

```
The five reminders list views each hand-roll the same server-driven-table block. The framework already
ships a composable that does exactly this, better. Nobody uses it.

--- Submodule note, read this first ---

These files live in src/_common, the vue_framework git submodule. CLAUDE.md says never to write to it;
this task is the approved exception. Edit them in place — do not fork anything into src/, and do not add
a migration-revision.md entry. Leave the work in the submodule's working tree and say so at the end; the
parent repo will show a dirty submodule pointer. Commit and bump the pointer only if asked.

ESLint and Prettier IGNORE src/_common, so `npm run lint` will not check or reformat what you write.
Match the surrounding style by hand: tabs, single quotes, no semicolons, `<script setup>` body indented
one level, props via destructure defaults (never withDefaults).

--- The duplication ---

Every one of these five files contains the same ~60 lines:

    view/ReminderDefinitionsView.vue      (~212 lines total)
    view/ReminderUpcomingView.vue         (~283)
    view/MyRemindersView.vue              (~316)
    view/ReminderDispatchHistoryView.vue  (~274)

    const items = ref<T[]>([])
    const itemsLength = ref(0)
    const itemsPerPage = ref(25)
    const page = ref(1)
    const sortBy = ref<VSortItem[]>([new VSortItem(...)])
    const filter = ref(new SomeFilter())
    function buildRequest() { return new FilteredTableRequest(itemsPerPage.value, page.value, sortBy.value, true, filter.value) }
    async function loadItems() { const r = await fetchFilteredTable(buildRequest()); items.value = r.items; itemsLength.value = r.itemsCount }
    function reload() { page.value = 1; loadItems() }

It has already drifted: ReminderDefinitionsView has no `reload()` at all and wires `@apply="loadItems"`,
so filtering does not reset the page (R1 fixes that symptom; this prompt removes the shape that produced
it).

--- What already exists ---

_common/composable/table/useServerTable.ts returns exactly this set — items, itemsLength, loading, page,
itemsPerPage, sortBy, filter, load, reload — and adds three things the hand-rolled version does not have:

  * URL state, via _common/composable/table/useTableUrlState.ts. page / perPage / sortBy / filter all
    live in the query string. CLAUDE.md requires this ("Store filterable/bookmarkable state in URL query
    params"); not one of the five views does it today.
  * A page reset on any filter change, centralised (useServerTable.ts:110-119, `deep: true` so chip
    removal and clear both count). This is the register's bug, structurally prevented.
  * Burst coalescing (lines 86-98). A filter change resets page, Vuetify echoes an options change, both
    funnel into `load()`, and only one fetch goes out on the next tick.

  It also try/catches the fetch and routes failures to an optional `onError` — which is how the unhandled
  aborted-request rejections from R1 stop being possible.

**Read it before you plan.** Two things about it matter to you:

  1. It has ZERO consumers in this repo — grep and confirm. It is well-built but unexercised, so treat
     bugs you hit in it as plausible rather than assuming you are holding it wrong. If you find a real
     defect in it, that is a framework fix in the same submodule and is in scope — fix it, and say so
     prominently in your final message, because it affects a file outside this module.
  2. `onError` is optional, and if it is not supplied, errors are swallowed silently. Supply it in every
     view.

--- Do this ---

1. **Pilot one view first.** Convert ReminderUpcomingView (it has the fullest filter — eight fields
   across text, number, select and two dates — so it exercises every part of useTableUrlState). Get it
   working end to end, including the URL round-trip, BEFORE touching the other four. If the composable
   turns out not to fit, you want to have learned that once, not five times.

2. For each view, write the two URL codecs `useTableUrlState` requires: `filterToParams(filter) =>
   Record<string, string>` and `paramsToFilter(params) => TFilter`. These are the real work of this
   prompt — the rest is deletion. Requirements:
     - Round-trip cleanly: paramsToFilter(filterToParams(f)) must equal f for every field.
     - Omit empty/null fields from the query string entirely; a URL with eight `=` params for an empty
       filter is worse than no URL state.
     - Dates: the filters carry Date objects (nextOccurrenceFrom/To, dispatchedFrom/To). Pick one
       encoding, keep it identical across all five views, and make it survive a reload in the user's
       timezone. _common/utils/DateTimeHelper.ts has the formatters; do not hand-roll a date parse.
     - Enums: status / scheduleType / outcome must reject junk. An unknown value from a hand-edited URL
       should fall back to null, not be passed to the server. `convertToEnum` in
       _common/utils/enumHelpers.ts exists for this.
     - Keep short param names, but keep them recognisable. Do not compress the filter into one opaque
       base64 blob — a shareable URL that a human can read and edit is the point.

3. Preserve the existing deep link. ReminderDispatchHistoryView accepts `?reminderId=` today (produced by
   ReminderUpcomingView.vue:163 and OverviewFailureList.vue:45). After the conversion that param must be
   the SAME param the filter serializes to, not a second bespoke one parsed in onMounted — that is the
   whole point. Both entry points must still work unchanged.

4. Wire `onError` on all five. For now, the honest minimum is: ignore cancellations (`axios.isCancel`),
   let everything else reach the interceptor's snackbar. Do not build error UI here — that is a separate
   concern, and R2 has already settled the pattern for the two non-table views; matching it later for the
   tables is a follow-up, not this prompt. Leave the tables rendering empty on error but stop the
   unhandled rejections.

5. Delete every now-dead local: buildRequest, loadItems, reload, the six refs, and any now-unused imports
   (FilteredTableRequest and VSortItem will still be needed for defaults — check each file rather than
   assuming). `@onLoadItems` binds to the composable's `load`.

6. Keep `sortBy` defaults exactly as they are per view — nextOccurrence asc on three, nextOccurrenceAt asc
   on the register, dispatchedAt desc on the history. These differ deliberately.

--- Explicitly out of scope ---

- The api layer underneath (useFilteredTableQuery vs useFetchFilteredTable, and the export path's missing
  request state). R6 owns that. useServerTable takes any `fetch` matching its TableFetch signature, so
  both current paths plug in as they are — adapt, do not redesign.
- The `v-if="isAdmin"` wrapper and its forbidden card (R7), the a11y pass (R8), the columns definitions,
  and every `#item.*` template slot. Template changes in this prompt should be limited to the
  FilterPanel/BasicTable bindings that actually moved.
- MyRemindersView's snooze/dismiss handlers and its optimistic `dropActiveRow()` (R10). Note that
  dropActiveRow mutates `items` directly (line 254-257) — confirm that still works against the
  composable's `items` ref, and if it does not, fix it minimally here rather than redesigning it.

--- Verification ---

npm run type-check — baseline is 72 errors, all app-side in src/core; src/_common is clean, so any
_common error is yours. This refactor is the most likely prompt in this set to produce generic-inference
errors, so read the output carefully rather than counting it. npm run lint stays at 0 errors.

Then, per view, in the browser:
  - Load, sort a column, page forward, apply a filter. The URL updates at each step.
  - Copy the URL, open it in a new tab: same page, same sort, same filter, same rows.
  - Reload with F5: state survives.
  - Back/forward through those steps behaves sanely and does not fire duplicate requests.
  - Applying a filter from page 3 lands you on page 1 with results.
  - Network tab: exactly ONE request on mount, and one per user action — not two. This is the specific
    thing the coalescing exists for, so check it deliberately.
  - Type quickly into a text filter: no unhandled rejections in the console.
  - /pripomienky/historia?reminderId=<id> still pre-filters, and the "view history" buttons on the
    upcoming list and the overview failure card both still land pre-filtered.

Report the before/after line count per file, and say plainly whether useServerTable fit all five or
whether you had to work around it — and if you did, where.
```
