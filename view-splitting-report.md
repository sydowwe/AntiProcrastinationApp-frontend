# Views that would benefit from splitting

Scope: every `*.vue` under `src/core/<module>/view/` (35 files). Measured 2026-08-31 on a clean `dev` tree.

The threshold used here is not line count on its own — several 400-line views are fine because the length is one irreducible thing. What flags a view is one of three
shapes:

- **repeated template blocks** — the same markup pasted 2–3× with one binding different;
- **script mass that names no template symbol** — URL parsing, CRUD+undo bookkeeping, bulk-operation error handling;
- **a self-contained panel** that has its own state and could be lifted whole.

## Size table

| Lines | View                                                 | Template | Script | Verdict                                |
|-------|------------------------------------------------------|----------|--------|----------------------------------------|
| 689   | `todoList/view/TodoListView.vue`                     | 280      | 450    | **Split — both halves**                |
| 617   | `todoList/view/RoutineToDoListView.vue`              | 121      | 546    | **Split — script only** — DONE          |
| 565   | `dayPlanner/view/TemplateListView.vue`               | 263      | 310    | **Split — highest value/effort ratio** |
| 558   | `dayPlanner/view/DayPlannerView.vue`                 | 113      | 485    | **Split — script only**                |
| 486   | `activityHistory/view/PomodoroTimerView.vue`         | 241      | 261    | **Split — template; also misplaced**   |
| 474   | `dayPlanner/view/PlannerCalendarView.vue`            | 80       | 424    | **Split — script only**                |
| 425   | `activityHistory/view/HistoryDetailView.vue`         | 185      | 258    | Split (shared with the next row)       |
| 403   | `activityHistory/view/HistorySummaryView.vue`        | 115      | 305    | Split (shared with the previous row)   |
| 379   | `dayPlanner/view/DayPlannerSettingsView.vue`         | 271      | 129    | Split — one component per tab          |
| 366   | `activity/view/ActivitySettingsView.vue`             | 108      | 289    | Split — script only                    |
| 356   | `todoList/view/TodoListsView.vue`                    | 213      | 144    | Split — duplicated panel + dialogs     |
| 313   | `activityTracking/view/UnifiedActivityDashboard.vue` | 105      | 223    | Leave                                  |
| 260   | `activityHistory/view/HistoryCalendarView.vue`       | 108      | 77     | Optional — cheap consistency win       |
| 258   | `activityTracking/view/DesktopActivityDashboard.vue` | 100      | 165    | Leave                                  |
| 247   | `activityTracking/view/AndroidActivityDashboard.vue` | 96       | 158    | Leave                                  |
| 234   | `activityHistory/view/TimerView.vue`                 | 61       | 192    | Leave                                  |
| 227   | `activityTracking/view/ActivityDashboard.vue`        | 94       | 138    | Leave                                  |
| ≤214  | 18 remaining views                                   |          |        | Leave                                  |

---

## Tier 1 — split these

### 1. `TodoListView.vue` — 689 lines — DONE

The only view where both halves are oversized independently.

**Template (280).** ~~Four blocks come out cleanly, and the module already has the precedent (`TodoListFilters.vue`, `TodoListUndoBtn.vue`, `DailyRecapCard.vue` are
all extracted siblings):~~

| Extract                                            | Lines | Props / emits                                                                        |
|----------------------------------------------------|-------|--------------------------------------------------------------------------------------|
| `component/OverdueRenegotiateBanner.vue` (L55–110) | ~55   | `overdueCount`, `isRenegotiating`, `disabled` → `reschedule(days)`, `reviewOneByOne` |
| `component/UnscheduledNudgeBanner.vue` (L111–144)  | ~35   | `count` → `scheduleNow`, `dismiss`                                                   |
| `component/TodoListToolbar.vue` (L13–52)           | ~40   | the five-button row; already partly delegated to `TodoListUndoBtn`                   |
| `component/TodoListTitleBar.vue` (L145–222)        | ~80   | hide-done switch + icon/name + calibration line + progress bar + sort toggle         |

Done — all four landed as described. `TodoListTitleBar` takes `v-model:hideDone` plus `listEntity`/`calibration`/`totalProgress`/`sortMode` and emits
`toggleSortMode`; the other three match the table exactly.

**Script (450).** Two of the three planned extractions landed as composables; the third (`useTodoListItemActions.ts`) turned out to already exist under a
different name — see below.

- ~~`composable/useOverdueRenegotiation.ts` — `RENEGOTIATE_THRESHOLD`, `overdueItems`, `isRenegotiating`,
  `rescheduleOverdue`, `reviewOverdueOneByOne` (L534–587, ~55 lines). Self-contained: takes `items` and the
  `update`/`fetchAll` pair, returns the banner's whole contract.~~ Done, plus `filterDueState` as a third param — `reviewOverdueOneByOne` needs it to switch the
  due-state filter, which isn't part of the `update`/`fetchAll` pair.
- ~~`composable/useUnscheduledNudge.ts` — `unscheduledNudgeDismissed`, `pendingItems`, `unscheduledItems`,
  `showUnscheduledNudge`, `openFirstUnscheduled` (L589–612, ~25 lines).~~ Done — takes `displayedItems`, `isInChangeOrderMode`, an `overdueCount` computed (fed
  from the composable above) and `openAddToPlanner`. `pendingItems` stayed internal; nothing outside the composable read it.
- `composable/useTodoListItemActions.ts` — **not written as a separate file.** `add`/`edit`/`deleteItem`/`handleOrderChange`/`handleUncheckAll` were already
  routed through `composable/useUndoableListCrud.ts` by the time this item was picked up — that generic helper is cross-cutting theme **A**, landed ahead of this
  item and shared with `RoutineToDoListView` (item **#2**). `updateAfterEdit` and `moveItemToList` stayed in the view: both are called from more than one place
  (`itemsChanged`, `openMoveToList`) and neither is CRUD-wrapped-in-undo in the shape the other five are, so folding them into a same-named composable would have
  been organizational only, not a duplication removal.

The view is down from 689 to 448 lines. Typecheck (`vue-tsc --build --force`), lint and `npx vite build` are all clean afterwards.

### 2. `RoutineToDoListView.vue` — 617 lines — DONE

Template is fine at 121 (`RoutineGroupCard` already carries the weight). The 546-line script was the problem, and it held four unrelated subjects:

- ~~`composable/useRoutineGroups.ts` — `groupedItems`, `visibleGroups`/`visibleGroupIds`/`singleVisibleGroupId`,
  `groupSelectItems`, `onGroupSelectUpdate`, `hideDoneGroupIds` (a URL-backed computed) and `updateHideDone`
  (L243–310, ~70 lines).~~ Done — also owns `handleReviewPause`/`handleReviewReduceFrequency` (they mutate
  `groupedItems[].timePeriod`) and takes `isNewWeek` as a param so `showWeeklyReview`/`reviewEligibleGroups` can live
  next to the groups they filter.
- ~~`composable/useRoutineCelebration.ts` — `RUN_MILESTONES`, `showConfetti`/`confettiKey`, `triggerConfetti`,
  `celebrateIfRare` (L202–241, ~40 lines). Pure, trivially testable, currently mixed into CRUD.~~ Done, unchanged from
  the plan.
- ~~`composable/useRoutineItemActions.ts` — `add`/`edit`/`onDelete`/`handleOrderChange`/`handleUncheckAll`/
  `handleCrossListDrop`/`onItemsChanged` (~250 lines). `handleCrossListDrop` alone is 62 lines and takes
  `dropTarget: any` — worth typing while it moves.~~ Done. `dropTarget` is now a local `CrossListDropTarget`
  interface (`{ data: { type, index, position? } }`, the one shape this call site reads) rather than `any` — the
  emit itself (`RoutineGroupCard`, `UseDragAndDropMonitor.ts`) stays `any`, since retyping the whole drag-and-drop
  chain is well outside this item's scope.

  **`handleCrossListDrop` did not fit theme A's composable, and that is an acceptable outcome.** The other six
  operations are single-call; this one moves an item *between* groups, so it is two calls (`update` with a new
  `timePeriodId`, then `changeDisplayOrder`) with a compound inverse that has to undo both and splice the item back
  into its original group at its original index. It stayed deliberately bespoke, in the same file as the rest of the
  CRUD it sits next to.
- ~~`composable/useRoutineDialogs.ts` — `openCreateDialog`, `openEditDialog`, `openHistoryDialog` (L350–395, ~45 lines). Note these three build dialog titles from raw
  English strings (`' to routine to-do list'`,
  `'-day periods'`, `'Close'`) rather than `t()`; the move is a good moment to fix that.~~ Done — three new keys
  (`routineTodoList.addDialogTitle`, `.history`, `.historyDialogTitle`) replace the raw strings, mirrored in both
  `todoList.sk.ts` and `todoList.en.ts`; `closeBtnText` now resolves `general.close`.

The view is down from 617 to 305 lines. `onLogTimeCreated`'s undo callback (`toggleIsDone` + `onItemsChanged`) turned
out to be exactly `useUndoableListCrud`'s `handleIsDoneChange(itemId, false)` — one fewer bespoke undo path than the
plan assumed. Typecheck (`vue-tsc --build --force`), lint and `npx vite build` are all clean afterwards.

### 3. `TemplateListView.vue` — 565 lines — DONE (partial)

**The single highest-value change in this report.** The template renders the same 30-line block three times — pinned (L102–135), active-unpinned (L144–181),
inactive-unpinned (L194–234). The three differ only in the source list, the `section` key passed to `registerCard`, and the `isPinned` literal. Every one of the
eight
`@edit/@delete/@togglePin/@toggleActive/@applyToday/@duplicate/@toggleCompare/@click` bindings is repeated three times, so any new card action is a three-place edit
today.

- ~~`component/template/TemplateCardGrid.vue` — props `templates`, `section: 'pinned' | 'active' | 'inactive'`,
  `isPinned`, `templateTasksMap`, `compareMode`, `compareSelection`; forwards the eight events; owns the
  `template-drag-wrapper` div, the `drag-over-*` classes and the `<style scoped>` block that goes with them. Template drops from 263 → ~110.~~ Done. `registerCard`
  and `dragOverState` are passed down as props rather than re-instantiating `useTemplateCardDragAndDrop()` inside the grid component — a second instance would hold
  its own disconnected `sectionOrder` state, split from the one the view uses for `applyOrder`.

Script side:

- ~~`composable/useTemplateCompare.ts` — `compareMode`, `compareSelection`, `compareDialog`, `toggleCompareSelection`,
  `openComparison`, `exitCompareMode` (~30 lines, no dependencies on anything else in the view).~~ Done.
- `migrateLegacyPins()` (L548–568) is a one-shot data migration living in a view. It belongs in
  `composable/useTemplatePinMigration.ts` or, better, the API layer — it will be deleted outright one day and that should be a one-file change. **Not done** — left
  in place, out of scope for this pass.
- The delete dialog (L239–255) was theme **C** below — done; it is now a `confirm({ detail })` call.

Typecheck and lint are both clean afterwards.

### 4. `DayPlannerView.vue` — 558 lines — DONE

Template is already well decomposed (113 lines, everything is a named child component) apart from the
`#selection-actions` slot (L48–96, ~50 lines of menu + four conditional buttons) → `PlannerSelectionActions.vue`.

The 485-line script is dominated by three bulk handlers with an **identical** tail:

- `handleChangeStatusOnSelected` (L416–462)
- `handleSkip` (L491–529)
- `handleReschedule` (L531–565)

Each is `Promise.allSettled` over selected ids, `clearSelection()`, count rejected, then a two-branch partial/success snackbar. The tails are byte-for-byte the same
except the message key. See theme **B** — one
`useBulkTaskAction()` helper removes ~70 lines here and ~60 more in `PlannerCalendarView`. (Already landed — this item found it done.)

Also extractable:

- ~~`composable/useTemplatePreview.ts` — `templatePreview()` + `applyTemplate()` (L348–393, ~50 lines), the only two functions that touch `store.templateInPreview` /
  `tasksFromTemplate`.~~ Done — takes `store`, the `calendar` ref and `fetchTemplateTasks` as params.
- ~~`composable/useDayNavigation.ts` — `navigateDate`, `navigateToDate`, `handleArrowKey`, `handleUndo` with its
  `loadCompleteResolve` handshake, plus the `watch(() => store.viewedDate)` reload (L291–322 + L583–599, ~55 lines). The `loadCompleteResolve` latch is the subtlest
  thing in the file and is currently a bare module-scope `let`.~~ Done — the latch is now a closure variable inside the composable (same shape as
  `useCalendarUrlState`'s `isApplyingUrlState`), and the composable registers its own `keydown` listener via `onMounted`/`onUnmounted` rather than exposing
  `handleArrowKey` for the view to wire up.

The view is down from 558 to 429 lines. Typecheck, lint and build are all clean afterwards.

### 5. `PomodoroTimerView.vue` — 486 lines

Two separate observations.

**It is not a view.** It takes `activityId` / `activityName` / `compact` props and emits `started` / `done`; it is mounted as a child, not routed to. It belongs in
`activityHistory/component/`, and moving it makes the naming of everything else in `view/` honest.

**Template (241) has a 3× repeat.** The focus / short-rest / long-rest cards (L39–107) are the same 23-line
`SubtleCard` + `VSheet` + label + `TimePicker` block with a different colour, label key and model →
`component/PomodoroDurationCard.vue` (`color`, `label`, `v-model`). 70 lines → 15.

Then two panels lift out whole:

- `component/PomodoroSetupPanel.vue` — the entire `v-if="timeInputVisible"` block (L20–136) including the cycles/periods selects: five v-models in, two button events
  out.
- `component/PomodoroActivityPanel.vue` — the two `ActivitySelectionForm` columns and the two result chips (L158–233, ~75 lines), which are the same two activities
  shown in two states.

Script is closer to acceptable; `timeDisplayObject` (L326–349) is presentation-only and could go with the display.

### 6. `PlannerCalendarView.vue` — 474 lines

Template is exemplary at 80 lines. The script carries two lumps that name nothing in it:

- ~~`composable/useCalendarUrlState.ts` — `monthKeyFromDate`, `parseMonthKey`, `syncMonthToUrl`, `syncModeToUrl`, the
  `isApplyingUrlState` guard flag, and the URL-hydration half of `onMounted` (L156–224 + L271–288, ~90 lines).~~
  Done — theme **D**. The view is down from 474 to 406 lines; `onMounted`'s URL half is one `hydrateFromUrl` call.
- The three bulk executors — `executeBulkApply`, `executeCopyDay`, `executeBulkDayTypeChange` (L409–504, ~95 lines)
  — end in the same partial/success snackbar pair as `DayPlannerView`'s three. Same shared helper (theme **B**).

`refresh()` with its `refreshRequestId` race guard and `refreshPlanVsActualTrend` should stay: they are the view's actual job and the guard is load-bearing.

---

## Tier 2 — split when next touched

### 7. `HistoryDetailView.vue` (425) + `HistorySummaryView.vue` (403) — DONE

Treat these as one job — they already share `useHistoryDashboard`, and what remains duplicated is the shell around it.

- ~~**Export.** `exportDetail` (L359–415) and `exportSummary` (L267–330) are ~55 lines each; everything except the column array and the file-name parts is identical
  (xlsx guard, `exporting` latch, try/catch, error snackbar,
  `downloadCsv`). Fold the wrapper into `composable/useHistoryExport.ts` as `useCsvExport(buildRows)` — the file already owns `buildCsv` / `buildExportFileName` /
  `downloadCsv`, so this is finishing an existing abstraction.~~
  Done — `useCsvExport()` owns the xlsx guard, the `exporting` latch and the try/catch/error-snackbar; each view's `export*` now just builds `{ csv, fileName }` (or
  returns `undefined` to skip, which is how `exportSummary`'s empty-date guard survived the move).
- ~~**URL sync.** Both files end with the same `watch([...], () => router.replace({ query: {...} }))` (theme **D**).~~
  Done — `useHistoryUrlSync(sources, buildQuery)` owns the watch, and the six params the two views share are serialized once by `sharedHistoryQueryParams()` in
  `historyUrlParams.ts`.
- ~~**Template, detail view only.** `HistorySummaryCards` + `HistoryPieChartSection` are mounted twice with the same props in two different layouts (L102–138 for
  stacked-bars, L158–182 for timeline, ~75 lines) → one
  `HistoryInsightsColumn.vue` with a `direction` prop.~~
  Done — `historyDashboard/component/HistoryInsightsColumn.vue` takes `direction: 'row' | 'column'`, forwards both panels' props/events and models `selectedGroup`
  itself so both the pie chart's `v-model` and the summary cards' plain prop stay in sync. `HistorySummaryView.vue` was left untouched — it only ever mounted the
  pair once, so there was nothing to fold there.

`clampWindowsToRequestedRange` should stay in the detail view — the comment explains exactly why it can't be shared.

Typecheck and lint are both clean afterwards.

### 8. `DayPlannerSettingsView.vue` — 379 lines, 271 of them template

Five `VTabsWindowItem`s, four of which are a single self-contained `VCard`. One component per tab:
`RepeatingTasksTab.vue` (the `BasicTable` + its five cell slots, ~50), `PlannerRemindersTab.vue` (~50),
`ViewDefaultsTab.vue` (~35), `SkipReasonsTab.vue` (~40, plus `newSkipReason` and `addSkipReason` which only it uses), `CalendarViewDefaultsTab.vue` (~30). The view
keeps `VTabs`, the store, and the debounced save watcher — about 60 lines.

Precedent: `core/user/component/settings/` already does exactly this for the user settings page.

### 9. `ActivitySettingsView.vue` — 366 lines, 289 of them script — DONE

~~Roughly 110 lines (L134–222) are pure query-string (de)serialization — `firstQueryString`, `parseIdList`,
`parseArchivedView`, `archivedViewOf`, `paramsToActivityFilter`, `activityFilterToParams`, `paramsToNameTextFilter`,
`nameTextFilterToParams`, `buildCombobox` — none of which reference component state. Move to
`activity/composable/activitySettingsUrlParams.ts`; `activityHistory/composable/historyUrlParams.ts` is the established pattern (theme **D**).~~ Done — the view is
down from 366 to 297 lines.

~~The remaining ~90 lines are eight `watch` / `watchDebounced` blocks maintaining draft↔filter↔URL. Those are
`composable/useActivityFilterDrafts.ts`. Before writing it, check `_common/composable/table/useTableUrlState.ts` — this may be reinventing it.~~ Checked during
theme **D**: it is a server-table composable, not a general URL-state one, and does not apply here. Done —
`useActivityFilterDrafts.ts` now owns `activeTab`, all three filters, both comboboxes, every draft ref and the whole
watcher graph; the view is down from 297 to 145 lines and its `<script setup>` is a single destructured call.

**The watcher graph was the hazard, and it was not a type error.** `currentSharedFilter()` resolves against
`activeTab`, so the two shared-draft watchers write to the roles filter or the categories filter depending on when
they fire. The route→state watcher (on `tab`, now a getter) and the state→URL watcher (on `activeTab`) guard each
other with mirrored `if (newTab === activeTab.value) return` / `if (newTab === tab()) return` early exits, which is
what stops a tab click and a browser Back from fighting over the query string. Both guards moved into the composable
unchanged. Typecheck and lint are both clean afterwards.

### 10. `TodoListsView.vue` — 356 lines, 213 of them template — DONE

- ~~`TodoListCategoryPanel` is mounted twice (L17–29 mobile dialog, L49–60 desktop column) with a 9-binding prop/event set that differs in exactly one handler
  (`onMobileSelectCategory` vs `selectCategory`) and one extra
  `@closeDialog`. Wrap both in `component/normal/TodoListCategoryPane.vue` so the binding list exists once.~~ Done — `TodoListCategoryPane.vue` owns the `VCard` +
  `TodoListCategoryPanel` pair and a `mobile` prop for the fullscreen-dialog styling (`rounded="0"`, no `py-0`); both mount sites now differ only in the
  `@selectCategory` handler and the mobile one's `@closeDialog`.
- ~~Two `MyDialog` delete confirmations (L176–211) with the same name-plus-cascade body — theme **C**.~~ Done; both are `confirm({ detail })` calls now, which is
  where the view's other 36 template lines went.

Typecheck and lint are both clean afterwards.

### 11. `HistoryCalendarView.vue` — 260 lines (optional) — DONE

Not oversized, but its `#day-cell-content` slot (L22–106, ~85 lines) plus the 100 lines of scoped CSS that style it is precisely what `dayPlanner` extracted into
`CalendarDayCellContent.vue`. Extracted into `historyDashboard/component/HistoryDayCellContent.vue` (`day` prop only — no `selected`/`tasks`, this cell has neither
selection nor a task list), making the two `CalendarGrid` consumers symmetrical. The view is down to 104 lines. Typecheck and lint are both clean afterwards.

---

## Leave alone

- **The four `activityTracking` dashboards** (313 / 258 / 247 / 227). All four already delegate to
  `useActivityDashboard` + components; what remains is the fetcher object and response→view-model mapping, which is the one thing that must stay per-view.
  `UnifiedActivityDashboard`'s extra 60 lines are the source-filter wiring, which is genuinely unique to it.
- **`TimerView.vue`** (234) — 192 script lines, but it is one timer's lifecycle end to end.
- Everything at 214 lines and below.

---

## Cross-cutting themes

These are the reason several of the items above are cheaper done together than separately.

**A. Undo-wrapped CRUD, written twice.** `TodoListView` and `RoutineToDoListView` each carry ~200–250 lines of
"call the API, splice the local array, push the inverse onto the undo stack". The seven operations are the same seven; only the container shape differs (flat list vs
grouped). One generic
`useUndoableListCrud(items, api, { push* })` would collapse ~450 lines to ~150 plus two thin adapters. This is the largest single duplication in the view layer.

**B. Partial-failure reporting, written six times.** `DayPlannerView` ×3 and `PlannerCalendarView` ×3 all end with:

```
const failed = results.filter(r => r.status === 'rejected').length
if (failed > 0) showErrorSnackbar(t('…Partial', { succeeded, total, failed }))
else showSuccessSnackbar(t('…', { count }, count))
```

A `runBulk(ids, op, { partialKey, successKey })` helper in `dayPlanner/composable/` removes ~130 lines and makes the six sites impossible to drift apart. (They have
already drifted once: three read `response.succeededCount` from a batch endpoint, three compute it locally.)

**C. Cascade-delete confirmation, written three times. — DONE.** `TodoListsView` ×2 and `TemplateListView` ×1 each rendered `MyDialog` with a slot body of "name" +
an optional bold "…and N children go with it" line, because
`useDialog().confirm()`'s single `text` prop could not express two lines.

Resolved upstream, as the framework test asks: `MyDialog` gained a `detail` prop (second body line, emphasised, rendered only when the default slot is unused) and
`confirm()` gained a matching `detail` option. Both default to the previous rendering, so no other call site changed. The three sites now
`await confirm({ title, text, detail })`
instead of holding a `deleteDialog` ref, a `*ToDelete` ref and a cascade `computed` each — the delete work moved into a plain `deleteList` / `deleteCategory` /
`deleteTemplate(entity)` taking its argument, so the "stash it in a ref, read it back in the handler" pattern is gone from all three. This also fixed an inline-
`MyDialog` bug the two
`TodoListsView` dialogs had: `@confirmed` never set `v-model` back to `false`, so the dialog stayed open after a successful delete.

**D. Hand-rolled URL param handling in four views. — DONE.** `ActivitySettingsView` (~110 lines),
`PlannerCalendarView` (~90), `HistoryDetailView` + `HistorySummaryView` (~20 each, plus the shared
`historyUrlParams.ts` they *did* factor out). `historyUrlParams.ts` was the model and the other two now follow it.

`_common/composable/table/useTableUrlState.ts` was checked first, as the entry asked, and does **not** cover any of these: it is built around `page` / `perPage` /
`sortBy` plus one flat `Record<string, string>` filter, and it always writes those three keys. None of the four views is a server table — a month key, a
mode/template/preview trio and two
`Time` wall clocks are not filter params — so adopting it would have meant three spurious query keys per view. It is still the right thing for a paginated table; it
is not a general URL-state composable, and nothing here was worth upstreaming as one.

What landed, one file per shape rather than one abstraction over all three, because the three views' URL state has nothing in common beyond the direction of travel:

- `activity/composable/activitySettingsUrlParams.ts` — the pure half, exactly as the entry describes: the nine parse/serialize functions plus `ArchivedView` /
  `ARCHIVED_VIEW_FILTER`, none of which reference component state. The view's eight draft↔filter↔URL watchers stay put; they are item **#9**'s
  `useActivityFilterDrafts.ts`, not this.
- `dayPlanner/composable/useCalendarUrlState.ts` — the impure half, because the month/mode sync is inseparable from the `isApplyingUrlState` guard it needs.
  `monthKeyFromDate` / `parseMonthKey` are exported pure; the composable takes the three mode refs, registers the write-back watcher itself, and exposes
  `syncMonthToUrl(range)` plus
  `hydrateFromUrl(applyMonth)`. The guard is now a closure variable instead of a bare module-scope `let`, and the hydration returns `{ templateId, previewMode }` as
  explicit `null`-means-"URL said nothing" values — that ordering (URL beats the store's default, and the values are captured *before* the settings `await`) is the
  subtle part and is preserved, with the reset moved into a `finally`.
- `activityHistory/composable/useHistoryUrlSync.ts` + `sharedHistoryQueryParams()` in `historyUrlParams.ts` — the watch itself, and the six keys (`groupBy`,
  `windowSize`, `timeFrom`, `timeTo`, `baseline`, `topN`) both dashboard views serialize identically. Each view keeps its own range params (`range`/`date`/`endDate`
  vs `date`/`view`)
  around the spread. Summary's query key order is unchanged; detail's shifts by two keys, which is cosmetic.

Typecheck and lint are both clean afterwards.

## Suggested order

Themes **A**–**D** are done, and with them the design-heavy work. Everything below is extraction against an
abstraction that already exists, in three bands:

1. ~~**Mechanical** — #3, #5, #8, #11.~~ Pure template moves, landed independently.
2. ~~**Medium** — #4, #7, #9, #10.~~ Each was a move that had to preserve one behaviour rather than invent anything:
   #4's `loadCompleteResolve` handshake, #9's watcher ordering. Both held.
3. ~~**The two theme-A consumers** — #1, then #2.~~ Both done.

**Do #1 before #2, and inside #1 do the four template components before the script.** The flat list is the gentler
validation of the adapter shape; the grouped container is the stress test, and `handleCrossListDrop` is the point
where the shape may not hold (see #2). Keep the two in one sitting rather than a week apart — they are the same
abstraction consumed twice, and the second one drifting from the first is how the duplication theme **A** removed
gets rebuilt by hand.

#1 confirmed the adapter shape holds: `useUndoableListCrud` was already in place (theme **A**) and needed no changes to
support the four template extractions or the two new composables. #2 was the stress test — `handleCrossListDrop`'s
compound undo is where that confirmation could still have failed, and it held: the function moved into
`useRoutineItemActions.ts` unchanged, sitting next to the `useUndoableListCrud` call it deliberately doesn't join.

Undo and error paths still have no test coverage, so #1 and #2 were the two items where a wrong result would have
compiled, type-checked and looked right regardless.
