# Migration revisions — items deferred pending upstream framework changes

Things the alignment migration could not adopt because `src/_common` (the `vue_framework` submodule)
lacks a capability this app actively uses. Per the brief's §6 rule these are **not forked locally** — they stay as app-local files until the framework gains the
missing piece, then get repointed.

**Never fix these by editing `src/_common`.** Add them in the framework repo, bump the submodule pointer, then delete the local file and repoint its importers.

---

## Still open

Items §1–§8 are resolved. The leftovers audit opened §9–§12 on 2026-08-10; **§9, §11 and §12 landed
the same day (R15)** and only **§10 is still open** — deliberately, because it needs a contract
decision rather than a move. `src/_common` still reports zero type errors as of R13. Track new gaps
here rather than in the tail of a resolved entry, which is how the 13 errors in R13 went untriaged
for so long.

- **Nothing here has been verified in a browser.** R10 (14 tables), R11 (2 calendars) and R13's three
  runtime fixes (blank pagination numbers, the discarded registration e-mail, the `DateTimePicker`
  label) are all correct by construction and none has been loaded. R10 is the argument for caring:
  the bug it fixed shipped precisely because nobody opened the page.
- **`core/leisure/component/backlog/BacklogFilterPanel.vue` is dead code awaiting deletion.** Zero
  importers; it is a pre-migration duplicate of the `FilterPanel` now inlined in `BacklogView.vue`,
  from when `locationType` / `weatherDependency` / `expectedCostTier` were enums rather than lookup
  tables. Its 4 type errors are that staleness, not a live bug. Delete it together with the three
  enums that only it uses — `dto/enum/{LocationType,WeatherDependency,ExpectedCostTier}.ts` — which
  leaves the `enums.{locationType,weatherDependency,expectedCostTier}` locale blocks orphaned too.
- **76 app-side type errors remain**, all in `src/core`. Never triaged as a group.

---

## Found by the leftovers audit (2026-08-10) — three upstream asks

The question was which files still outside `src/core/` are generic enough to belong in the framework.
Everything that was *not* generic has already been moved or deleted app-side (R14). These three are
generic, and each is blocked only on a framework commit + pointer bump. **Do not fork them into
`src/` and do not edit `src/_common` to fix them.**

### 9. The `INameResponse` interface chain belongs beside `IIdResponse` — **resolved, see R15**

**Local files kept:** `src/dtos/response/interface/{INameResponse,INameTextResponse,INameTextIconResponse,INameTextColorIconResponse,ITextColorResponse}.ts`

The framework owns `_common/dto/response/interface/IIdResponse.ts`, which is the base these five
extend — it owns the root of the chain but not the chain. `id / name / text / icon / color` is the
shape of every lookup table in every CRUD app, and these are consumed from three modules already
(`activity/dto/response/{Category,Role}.ts`, `todoList/dto/response/TaskPriority.ts`,
`dayPlanner/dto/response/TaskImportance.ts`).

**Upstream ask:** move all five into `_common/dto/response/interface/`. They are pure structure with
no app semantics, so this is a straight relocation.

**Already done app-side:** the subinterfaces redundantly re-declared members they inherit
(`INameTextIconResponse` restated `id/name/text`, `INameTextColorIconResponse` restated all four,
`ITextColorResponse` restated `id`). Removed in R14, so what gets upstreamed is already clean.

### 10. `IMyResponse` is a marker that constrains nothing — **resolved: dropped**

**Local file removed:** `src/dtos/response/interface/IMyResponse.ts` — the whole file was
`export type IMyResponse = object`.

`CLAUDE.md` required every response DTO to implement `IMyResponse`, but `object` admits literally any
non-primitive, so the rule was unenforced — nothing stopped a DTO shipping without `fromJson` /
`listFromObjects`. Four DTOs implemented it and gained no checking from it.

**Resolution:** option (b) from the original ask — the type and the `CLAUDE.md` rule were dropped
together rather than relocating a no-op into the framework. The four implementers
(`TodoListEntity`, `TodoListCategoryEntity`, `TrackerAndroidDistinctEntriesResponse`,
`TrackerDesktopDistinctEntriesResponse`) had the `implements IMyResponse` clause removed; the
`fromJson`/`listFromObjects` convention itself is unaffected since it was never actually enforced by
this type.

### 11. `DayOfWeekPicker` — a component whose whole dependency set is already upstream — **resolved, see R15**

**Local files kept:** `src/components/general/inputs/DayOfWeekPicker.vue`, and the `dayOfWeekOptions`
half of `src/dtos/enum/dayOptions.ts`.

26 lines of pure Vuetify `VBtnToggle` with no app concepts, and both things it imports —
`DayOfWeek` and `DAY_OF_WEEK_SHORT_LABELS` — already live in `_common/dto/enum/DayOfWeek.ts`. It is
the last component outside `core/`, and it has two consumers already (`dayPlanner`'s
`TaskPlannerDayTemplateDetailsForm`, `todoList`'s `RoutineToDoListForm`).

**Upstream ask:** move the component to `_common/component/inputs/DayOfWeekPicker.vue` and
`dayOfWeekOptions` next to the enum it derives from.

**Fix this on the way up, not after:** `DAY_OF_WEEK_SHORT_LABELS` is a hardcoded English
`Record<DayOfWeek, string>` (`'Mon'`, `'Tue'`, …), so the picker renders English day names even
though SK is this app's primary locale. That is tolerable for an app-local file and not tolerable in
a framework component — key it off `_common/i18n` as part of the move.

**Stays app-side:** the `dayTypeOptions` half of `dayOptions.ts`. It deliberately omits
`DayType.Holiday` because this app's backend rejects it — exactly the kind of app fact the framework
must not learn. Split the file when the picker goes up.

### 12. `hasObjectChanged` — an ask that was never tracked here — **resolved, see R15**

**Local file kept:** `src/utils/helperMethods.ts` — one four-line function.

The file has self-documented as a pending upstream request since the migration, but it pointed at
`MIGRATION-PLAN.md §7` and was never carried into this document, so it fell off the list. Four call
sites (`todoList/view/TodoListView.vue` ×2, `activity/component/ActivitySelectOrQuickEditFormField.vue` ×2).

**Upstream ask:** add `hasObjectChanged` to `_common/utils/helperMethods.ts`, which already exists
and already holds this exact category of helper (`getNestedValue`, `formatFileSize`). Then delete the
app-local file — `src/utils/` disappears with it.

---

## Deferred at step 6 (composables)

Six of the ten duplicated composables were adopted. These four were not.

### 1. `useUndoStack` — ~~missing `UndoEntry.date` / `nextUndoDate`~~ — **resolved, see R6**

### 2. `EnumComposable` — ~~missing `convertToEnum` / `getEnumKeyByValue`~~ — **resolved, see R8**

### 3. `RulesComposition` — ~~missing `phoneNumberRule`~~ — **resolved, see R5**

### 4. `useAutoScroll` — ~~the framework version has a bug~~ — **resolved, see R6**

---

## Deferred at step 7 (components)

21 of the 24 duplicated components were adopted. These stayed local.

### 5. `CalendarGrid` — ~~framework exposes only `dateRange`~~ — **resolved, see R11**

### 6. The `dataTable` family — `BasicTable` / `DataTable` / `MyTableFooter` — **resolved, see R7**

---

## Found at step 13 (scheduler + reminders) — a framework bug, nothing kept local

### 7. `FilterPanel` mistypes its `#fields` slot prop — ~~one cast, ~25 errors~~ — **resolved, see R12**

---

## Found while rebuilding the home dashboard — a cross-module import to unwind

### 8. `TrackTimeDialog` is shared between `dayPlanner` and `home` — **resolved, see R9**

---

## Resolved

### R1. `core/scheduler` → `_common/modules/scheduler` (2026-08-07)

Step 13 landed the scheduler as `src/core/scheduler/`, a port of the reference app's copy with every self-import rewritten to `@/core/scheduler/...`. The framework
has since published the same module as `_common/modules/scheduler`, so the local port is deleted and its two external importers repointed:

- `src/router.ts` → `import { schedulerRoutes } from '@/_common/modules/scheduler/scheduler.routes.ts'`
- `src/locales/SK.ts` → `import scheduler from '@/_common/modules/scheduler/_locales/scheduler.sk.ts'`

All 33 files were byte-identical after normalising `@/core/scheduler` → `@/_common/modules/scheduler`, except `JobRunHistory.vue`, where the longer paths push three
import statements past the print width and Prettier wraps them. Upstream carries the `useAuth()` fix (the reference app's `useAuthStore()` does not exist here), so
nothing was lost in the swap. The scheduler is now an opt-in framework module like `reminders` and `notifications`, not an app module.

### R2. Setup docs do not mention the notifications module's dev service worker

Both faults behind the "service worker broken in dev" fix were app-side, not framework-side — `_common/utils/serviceWorker.ts` registering `/sw.js` is exactly what
`vite build` emits:

- **lodash 4.18.0.** The framework ships source, not a bundle, so its transitive deps resolve from the consuming app's `node_modules`. Nothing pinned lodash and it
  floated onto the broken release. Every consuming app hits this identically.
- **`/sw.js` in dev.** Pure app-side `vite.config.ts`; `vite-plugin-pwa` needs `devOptions.enabled` for the file to exist before a build.

The runtime code is right, so there is nothing to fix in `_common`. The gap is documentation: nothing in `SETUP.md` says the `notifications` module requires a
service worker in dev, so the next app rediscovers both from scratch.

- **Upstream ask:** a `SETUP.md` section for the `notifications` module covering the required `vite-plugin-pwa` dev config and a pinned/known-good lodash floor.

### R3. `composables/general/useDialog.ts` + `DialogHost` / `DialogEntryRenderer` → `_common` (2026-08-07)

Resolved exactly as `dialog-system-unification.md` proposed: this project's working dialog system was upstreamed and the framework's dead
`CentralDialogComposable.ts` (no renderer, `openDialog()` could never resolve) deleted along with `dto/dto/DialogConfig.ts`, which had no other consumer. All 47 app
call sites now import `@/_common/composable/general/useDialog.ts`; `App.vue` mounts `@/_common/component/dialog/DialogHost.vue`.

`useConfirmDialog` / `useAlertDialog` were not reimplemented — `useDialog().confirm()` covers the confirm case and nothing used `alert()`.

### R4. `core/user` → `_common/modules/user` (2026-08-07)

Depended on R3: framework code cannot import `@/composables/...`, and five of this module's files use `useDialog`.

36 of the 39 files moved. What stayed app-side, and why:

- `authAdapter.ts` — binds the store to the framework's `AuthAdapter` contract. App glue by definition; the framework must not know about this app's Pinia store.
- `component/settings/{AboutSection,DataExportSection,PreferencesSection}.vue` — hardcoded support e-mail and `/legal/*` links, an
  `antiprocrastination-export-*.json`
  filename, and an `askBeforeDelete` toggle. All render through the framework view's `#append` / `#preferences` slots.
- `view/UserSettingsView.vue` + `user.routes.ts` — a thin wrapper filling those slots, and the `/user/settings` route for it. The framework's `userRoutes` covers
  only the five signed-out views.
- `dto/userAugmentation.ts` — **new.** Merges `askBeforeDelete` / `firstDayOfWeek` into the framework's `User` / `UserPreferencesRequest` via `declare module`.

Three things changed shape rather than moving:

- **`@/router.ts` → `useRouter()`** in six files. Importing the app's router singleton is not something framework code can do.
- **The Google Calendar card left `SecuritySection`** and became `core/googleCalendar/component/GoogleCalendarCard.vue`, rendered through the new `#integrations`
  slot. Third-party account links are host-app concerns.
- **`UserSession implements IMyResponse` dropped the clause.** `IMyResponse` is `export type IMyResponse = object` — a no-op marker with no framework counterpart, so
  implementing it bought nothing and cost a dependency on `@/dtos/`.

### R5. `composables/general/rules/RulesComposition.ts` → `_common` (2026-08-10)

Closed without an upstream change: **`phoneNumberRule` had no call sites left.** It was the only genuine gap (§3's note about the other five validators being missing
was already corrected — they all live in `_common/utils/validators.ts`), so once the last consumer went, the local file existed to carry a dead function.

All 17 importers now use `@/_common/composable/general/rules/RulesComposition.ts`. Between them they destructure only `requiredRule` and
`lettersWithDiacriticsAndSpecialCharsRule`, both present upstream.

Two behavioural deltas, both improvements:

- Messages come from `t('validation.*')` instead of hardcoded Slovak. The keys ship in `_common/_locales/common.sk.ts` and were already spread into `SK.ts`; the
  matching **`validation` namespace is now mirrored into `src/locales/common.en.ts`** (EN.ts does not spread the framework's Slovak-only `common`, same arrangement as
  `httpErrors`). Without it EN users would have seen raw keys on every failed rule.
- The framework's `lettersAndNumbersRule` short-circuits on empty input (`!v ||`) where the local one did not. Nothing in this app used it.

`src/composables/general/rules/` is gone entirely. If a phone field ever comes back, add `phoneNumberRule` to the framework rather than reviving the directory.

- **Upstream ask:** none.

### R6. `useUndoStack` + `useAutoScroll` → `_common` (2026-08-10)

Both were genuine framework defects rather than app divergence, so both were fixed upstream and the local copies deleted. Framework commit `93f20ea` on `main`
(pushed to `origin/main` 2026-08-10).

**`useUndoStack`** — `UndoEntry` gained an optional `date`, exposed as `nextUndoDate`; the interface is exported now that consumers build entries against it. This
restores the planner's `Undo: <description> · go to <date>` button, which navigates to the date the undone action belongs to. Eight `push({ date })` sites across
`usePlannerCrud`, `useClipboardHandling` and `usePlannerPointerInteractions` feed it.

A **third bug** surfaced while adopting it, not previously recorded: the success snackbar resolved `t('common.undoSuccess')`, but that key lives under `general`, not
`common` — it rendered as a raw key for every user. Fixed to `general.undoSuccess` in the same commit.

That fix alone was not enough here. This app's `general` namespace **replaces** the framework's wholesale (the shallow-spread rule at the top of `SK.ts`), so the
framework's own `general.undoSuccess` never reaches i18n. The key is therefore mirrored into `src/locales/common.sk.ts` **and** `common.en.ts`. Any framework string
under one of the six colliding namespaces needs the same treatment — worth remembering when adopting future framework code.

What the app gains from the framework version: `undo()` now wraps the callback in `try/catch` with an error snackbar, and the message is localized instead of the
local version's hardcoded `` `${description} undone` ``.

**`useAutoScroll`** — one-line fix, exactly as diagnosed: `autoScrollSpeed.value = 0` now resets before the two edge-proximity branches. Previously, leaving the edge
zone ran neither branch, the stale speed passed the `!== 0` guard, and a fresh interval scrolled the container forever until `stopAutoScroll()` was called. One
importer (`usePlannerPointerInteractions.ts`), not the two the old entry claimed.

`src/composables/general/` is now down to `EnumComposable.ts` and `useCalendarWeeks.ts`.

- **Upstream ask:** none — landed in the framework.

### R7. `dataTable` family → `_common` (2026-08-10)

The rewrite from §6 landed: `src/components/general/dataTable/{BasicTable,DataTable,MyTableFooter}.vue` are deleted and every importer now uses
`@/_common/component/dataTable/{BasicTable,DataTable}.vue`.

The one behavioural gap flagged in §6 — the local `formattedColumn` slot has no framework counterpart — turned out to be silent rather than blocking: the framework
`BasicTable` simply doesn't forward it, so the ten consumers still writing `<template #formattedColumn="{ key, value }">` were rendering nothing and quietly falling
back to the framework's key-heuristic auto-formatting. All ten were converted to the framework's real mechanism, one `#item.<key>` slot per branch instead of a single
key-switch:

`ActivityTable`, `ActivityCategoryTable`, `ActivityRoleTable`, `IgnoredProcessesTable`, `DayPlannerSettingsView`, `BacklogTable`, `BucketListTable`,
`MemoryAnchorTable`, `ProjectTable`, `RoutineSettingsView`.

Slot content reads `item.<key>` (destructured from the slot scope) rather than the old `value`/`key` pair — `BacklogTable`'s two data-driven column lists
(`lookupColumns`, `enumColumns`) keep dynamic slot names (`#[`item.${col}`]`) since the key comes from a loop variable, with a small typed accessor to sidestep
`noImplicitAny` on the index access. Four consumers (`DayPlannerSettingsView`, `RoutineSettingsView`, `MemoryAnchorTable`, and the `RoutineSettingsView` visibility
switch) previously destructured `id` off the dead slot's scope; those now read `item.id`. `RoutineSettingsView`'s `isHidden` switch also gained a second
`@update:modelValue` argument (`item.id`) it was never actually receiving before — the slot was dead, so the switch never rendered through this path and the missing
id went unnoticed.

`getColumnValue` / the local `getNestedValue` wrapper went with the deleted `BasicTable` — the framework's own `getNestedValue` (returns `unknown`) is what the new
per-column slots key off of implicitly, since the framework component computes `value` itself before invoking the consumer's slot.

**Not part of this fix:** `vue-tsc --build --force` reports 190 errors post-conversion, not the pre-migration 163. The extra ~27 were unrelated to the slot work and
have since been diagnosed and fixed — see R10.

- **Upstream ask:** none for the slot mechanism itself — `#item.<key>` is working as designed.

### R10. The table call sites bound `v-model="items"` against a plain prop (2026-08-10)

R7 attributed its 27-error delta to a generic-inference regression from the submodule bump. That was wrong. The two `BasicTable`s have **different prop contracts**,
and the call sites were never converted:

| | deleted local `BasicTable` | framework `BasicTable` |
| --- | --- | --- |
| `items` | `defineModel<TItem[]>({ required: true })` | plain required prop `items: TItem[]` |
| `loading` | `defineModel<boolean>('loading', …)` | plain required prop `loading: boolean` |

`v-model="items"` sends `modelValue`, which the framework component does not declare — it landed in attrs, and the required `items` prop **was never passed**.
`TItem` then had nothing to infer from and widened to its `IIdResponse` constraint, which is what produced the whole cascade (`items: IIdResponse[]`,
`(item: IIdResponse) => any` for `onEdit`/`onDelete`, …).

**This was a runtime bug, not just a type error** — `items` was `undefined` inside the component, so those tables rendered no rows. `v-model:loading` was harmless by
luck: it still passed `loading` by name and merely added an ignored `onUpdate:loading`.

**It was 14 call sites, not the ten R7 named.** R7's ten came from the `formattedColumn` slot conversion, a different set. The real set is every consumer of
`BasicTable` (12) plus `DataTable` (2) — `DataTable` declares `items`/`loading` as plain props identically. Four of them bind the array under another name
(`tasks`, `timePeriods`, `mappings` ×2), which is why a `v-model="items"` grep under-counts:

`ActivityTable`, `ActivityCategoryTable`, `ActivityRoleTable`, `ProjectTable`, `BacklogTable`, `BucketListTable`, `MemoryAnchorTable`, `IgnoredProcessesTable`,
`DesktopMappingsTable`, `AndroidMappingsTable`, `DayPlannerSettingsView`, `RoutineSettingsView`, and the two `DataTable` ones —
`DesktopDistinctEntriesTable`, `AndroidDistinctEntriesTable`.

Each became `:items` / `:items="<name>"` and `:loading`. Nothing was lost by dropping the two-way binding: the framework components emit no update for either prop,
so no consumer could have been receiving write-back in the first place.

**`vue-tsc --build --force` fell 190 → 158**, i.e. below the old 163 baseline, and all fourteen files left the error list outright. What remains is the framework's
own (`TableGrid.vue` 9, `reminders` ~26, `scheduler` 4 — the §7 `FilterPanel` bug) plus pre-existing view-level errors. Lint holds at 0 errors / 3 warnings.
`CLAUDE.md`'s stated baseline is updated to 158.

- **Not fixed here:** the 9 errors internal to `_common/component/dataTable/TableGrid.vue` (`UnwrapRefSimple<TItem>` vs `TItem`, lines 289–398) are a genuine
  framework typing bug, independent of the call sites. **Upstream ask:** fix those nine.
- **Not verified:** that the fourteen tables now render rows in the browser. The change is correct by construction, but it went untested through the same gap that
  let the empty tables ship.

### R8. `EnumComposable` → `_common` (2026-08-10)

§2's gap closed upstream without anyone noticing: `convertToEnum` and `getEnumKeyByValue` now ship in **`_common/utils/enumHelpers.ts`**, byte-identical to the local
pair. They landed in `utils/`, not next to `getEnumSelectOptions` in `composable/general/EnumComposable.ts`, which is why the old entry still read as unmet — the
framework's `EnumComposable.ts` genuinely does still export only `getEnumSelectOptions` (identical to the local one apart from the explicit
`ValueTitleDto<string>[]` return type).

So the local file's three functions repoint to **two** different framework modules, and all 18 importers were split accordingly:

- `convertToEnum` → `@/_common/utils/enumHelpers.ts` — 5 DTOs (`dayPlanner/dto/response/{Calendar,PlannerTask,RepeatingPlannerTask,SuggestionResponse}.ts`,
  `historyDashboard/dto/response/CalendarActivityDaySummary.ts`). The old entry's count of 6 was one high.
- `getEnumSelectOptions` → `@/_common/composable/general/EnumComposable.ts` — 13 views/components across `dayPlanner` and `leisure`.
- `getEnumKeyByValue` — **no call sites left**, same shape as R5's `phoneNumberRule`. It is present upstream in `enumHelpers.ts` regardless, so nothing was lost.

`src/composables/general/EnumComposable.ts` is deleted; the directory is down to `useCalendarWeeks.ts` alone, which stays until §5's calendar trio moves upstream.

Lint holds at 0 errors / 3 warnings and `vue-tsc --build --force` is unchanged at 190 — the repointing neither fixed nor added an error, as expected for an
import-path swap between identical implementations.

- **Upstream ask:** none. Optionally, re-export the two helpers from `_common/composable/general/EnumComposable.ts` so enum utilities have one import site instead
  of two — cosmetic, and not worth a pointer bump on its own.

### R9. `TrackTimeDialog` → `activityHistory` (2026-08-10)

§8 closed by the second of the two options it proposed: the dialog now belongs to `activityHistory`, alongside the three timer views it was already wrapping.

- **Moved:** `core/dayPlanner/component/normal/TrackTimeDialog.vue` → `core/activityHistory/component/TrackTimeDialog.vue`
- **Dropped from the dialog:** the `plannerTaskId` prop and the `useTaskPlannerCrud` / `PatchPlannerTaskStatusRequest` / `PlannerTaskStatus` imports. It now emits
  `started: [actualStartTime: Time]` and knows nothing about the planner. Its remaining imports are `_common` plus its own module.
- **New in `dayPlanner/api/plannerTaskApi.ts`:** `markInProgress(id, actualStartTime)`, wrapping the existing `patchStatus` with the `InProgress` request. This is
  what keeps the patch from forking — the concern that made §8 pick the cross-import in the first place. It lives in `api/`, which is one of the two directories the
  architecture rule lets other modules import.
- **Both consumers now own the patch:** `dayPlanner/component/normal/LogTimeController.vue` (guarded by its optional `plannerTaskId` prop) and
  `home/component/NowBar.vue` (guarded by `trackedTask`), each handling `@started` with a `markInProgress` call.

The cross-module import is gone in the sense that mattered: `core/home` still reaches into `core/dayPlanner`, but now only through `api/` and `dto/`, which is
allowed. `DayPlannerLogTimeController.vue` is untouched — it passes `plannerTaskId` to `LogTimeController`, which still takes it.

Lint 0 errors / 3 warnings and `vue-tsc --build --force` 190, both unchanged.

- **Upstream ask:** none.

### R11. `CalendarGrid` + `CalendarDayCell` → `_common` (2026-08-10)

§5's stated gap was wrong, which is why it read as unfixable. The framework does not expose less of the same state — it holds **no** state to expose. The two
components have opposite data ownership:

| | deleted local `CalendarGrid` | framework `CalendarGrid` |
| --- | --- | --- |
| data | fetches itself: `useCalendarQuery()` + an optional `fetchFn` prop, into an internal `calendarData` ref | plain `days: ICalendar[]` prop |
| loading | internal ref | plain `loading: boolean` prop |
| date range | internal, `watch` → refetch | internal, `watch` → **emits `dateRangeChange`** |
| expose | `{ calendarData, dateRange, loading, refresh }` | `{ dateRange }` |

So the recorded upstream ask ("widen the expose") could never have landed: there is no `calendarData` or `refresh` upstream to widen to. The framework grid is
presentational by design, and the fix was app-side only — **no framework change, no submodule bump.** Fetching moved up into the two views:

- **`core/dayPlanner/view/PlannerCalendarView.vue`** — owns `calendarDays` / `loading` / `dateRange` refs and a local `refresh()` that calls
  `useCalendarQuery().fetchFiltered(new CalendarFilter(...))`. The template ref is gone; the five `calendarGridRef.value?.refresh()` call sites became `refresh()`,
  and `calendarDays` stopped being a `computed` peeking into the child's expose. The `dayTasksMap` watch now watches the local ref directly and dropped its
  `{ deep: true }` — the array is replaced wholesale by `refresh()`, so deep tracking only meant re-running the per-day task fetch on any nested mutation.
- **`core/activityHistory/view/HistoryCalendarView.vue`** — its `fetchFn` prop became a `@dateRangeChange` handler over the same
  `getCalendarActivitySummary` call, writing `days` / `loading`.

**Also deleted, all only reachable through the local grid:** `components/general/calendar/CalendarDayCell.vue` (the framework inlines the cell and renders
`CalendarDayCellHeader` directly), `composables/general/useCalendarWeeks.ts`, and `utils/daysOfWeek.ts`. `src/composables/` is gone entirely.

Three behavioural deltas, all improvements:

- **Week bucketing no longer goes through UTC.** `useCalendarWeeks` keyed weeks with `monday.toISOString().slice(0, 10)` on a local-midnight `Date`; east of UTC that
  shifts to the previous day and days land in the wrong week row. The framework uses `getISOWeekStart` + `formatDateForApi`, both local-time.
- **The toolbar and day headers are localized.** The local grid hardcoded English (`"Days to Show"`, and `allDaysOfWeek`'s `'Monday'`…). The framework reads
  `calendar.*`, which ships in `_common/_locales/common.sk.ts`. That namespace is Slovak-only and EN.ts does not spread the framework `common`, so — same treatment
  as R5's `validation` and R6's `general.undoSuccess` — **`calendar` is mirrored into `src/locales/common.en.ts`**.
- **"Weekend" now means Sat–Sun.** The local filter was `day.index >= 5`, i.e. Fri–Sat–Sun, under a label that read `Weekend (Fri-Sun)`. The framework filters on
  `isWeekend` and its label says So–Ne, so the two agree now.

`vue-tsc --build --force` **158 → 155**; lint holds at 0 errors / 3 warnings. The four errors inside `_common/component/calendar/{CalendarGrid,CalendarDayCellHeader}.vue`
were already in the 158 (verified by stashing) — they are framework typing bugs, not fallout from this change.

- **Upstream ask:** fix those four. `ICalendar` has no `id`, but `CalendarGrid` reads `dayData.id` twice for `selectedIds`; and `formatToDateWithDay` /
  `CalendarDayCellHeader` are handed `ICalendar.date`, which is a `string`, where they want a `Date`. Either add `id: number` to `ICalendar` and a string overload
  to `formatToDateWithDay`, or parse at the call site.
- **Not verified:** that the two calendars render in the browser. Same untested-by-construction caveat as R10.

### R12. `FilterPanel`'s `#fields` slot type → `_common` (2026-08-10)

§7's diagnosis was right and its proposed fixes were both heavier than needed. The cast is one token wrong, not structurally wrong. Framework commit `010c981` on
`main`:

```diff
-const draft = ref<T>(cloneFilter(filter.value)) as { value: T }
+const draft = ref(cloneFilter(filter.value)) as Ref<T>
```

**Why the original cast was reached for, and why it overshot.** `ref<T>()` types as `Ref<UnwrapRef<T>>` — TS's `ref` signature recursively unwraps nested refs in the
*type*, and for a plain filter DTO that is structurally identical at runtime but a distinct type to the compiler. So both round-trip assignments complain: `onApply`'s
`filter.value = draft.value` wants `T` and has `UnwrapRef<T>`, and `onReset`'s `draft.value = cloneFilter(fresh)` wants the reverse. `as { value: T }` silences both.

The overshoot is that `draft` has **two** roles — internal state, and the payload of `<slot name="fields" :draft="draft" />`. A cast picked to satisfy the first
silently redefined the second. `{ value: T }` is not a `Ref`, so vue-tsc applies no template unwrapping and types the slot as `{ draft: { value: T } }`, while at
runtime `ref()` did create a real ref and Vue unwraps it to `T`. Consumers writing `draft.someField` were correct and errored anyway, once per field.

`Ref<T>` is exactly as dishonest as the cast it replaces — it asserts away the same `UnwrapRef` mismatch — but it preserves the ref-ness the template type-checker
keys off, so both assignments still compile *and* the slot unwraps to `T`. The `defineSlots<{ fields(props: { draft: T }): any }>()` fallback was not needed.
Type-only change: no runtime difference, no call site touched.

**`vue-tsc --build --force` 155 → 102.** Verified as a strict subset — the before/after error lists were diffed and nothing new appeared. Lint holds at 0 errors /
3 warnings. `CLAUDE.md`'s stated baseline is updated to 102.

**§7 under-counted by more than half.** It named ~25 errors in `reminders` (26) and `scheduler` (5); the real total is 53 across ten files, because it never
looked at this app's own consumers. The four `leisure` views are 22 of them:

| | errors cleared |
| --- | --- |
| `_common/modules/reminders/view/{ReminderUpcoming,ReminderDefinitions,ReminderDispatchHistory,MyReminders}View.vue` | 8 + 7 + 6 + 5 |
| `core/leisure/view/{Backlog,BucketList,Projects,MemoryAnchors}View.vue` | 8 + 5 + 5 + 4 |
| `_common/modules/scheduler/{component/JobRunHistory,view/SchedulerJobsView}.vue` | 4 + 1 |

- **Not fixed here, and not related:** `core/leisure/component/backlog/BacklogFilterPanel.vue` still has 4 errors. They are pre-existing (present in the 155 baseline) and
  independent of the slot — that component takes its own `defineModel<ActivityBacklogProfileFilter>`, and three of its `v-model`s name fields the DTO does not have
  (`locationTypes` / `weatherDependencies` / `expectedCostTiers` vs the DTO's `…Ids`). That looks like a live runtime bug — those three filters cannot be applying —
  but it is a separate app-side fix.
- **Upstream ask:** none — landed in the framework.

### R13. The framework's remaining 26 type errors → 0 (2026-08-10)

Framework commit `bc36ba5`. This closes R10's and R11's open upstream asks and the 13 errors no entry
had ever looked at. **`src/_common` now reports zero type errors, down from 43.**

The reason nobody had triaged the 13 is that `CLAUDE.md`'s baseline note attributed the framework's
share to three named bugs; with `FilterPanel`'s 53 gone (R12) it became obvious the named bugs did not
add up to the total.

**Three were live runtime bugs, not typing noise:**

- **`MyTableFooter` rendered blank page numbers.** It destructured `pageLabel` from VPagination's
  `#item` slot; the slot exposes `{ isActive, key, page, props }` and never had a `pageLabel`
  (confirmed against the Vuetify API, not guessed). Now reads `page`, aliased — `page` is also a
  model in that component.
- **`RegistrationView` never stored the registered e-mail.** `userStore.userName = …` writes to a
  `computed` over `currentUser.email`; Vue discards writes to a readonly computed and warns. Writes
  `currentUser.email` instead.
- **`DateTimePicker` declared `label: string` as required** while its own template does
  `label ?? $t('dateTime.date')`. `TableCellEditor` was passing `:label="undefined"` to get around it.
  The prop is optional now and the workaround is gone.

**Typing fixes, grouped by root cause:**

- **The `ref` unwrapping trap again (R12's).** `TableGrid`'s `snapshots` was `ref<Map<number, TItem>>`,
  typed `Map<number, UnwrapRefSimple<TItem>>`, which produced 5 of its 9. Cast to
  `Ref<Map<number, TItem>>`, same remedy as `draft`.
- **Signatures narrower than their implementations.** `getNestedValue` took
  `Record<string, unknown>`, which no `T extends SomeInterface` can satisfy (interfaces have no
  implicit index signature) — widened to `object`, fixing 3 in `TableGrid` and unblocking generic
  callers everywhere. `formatToDateWithDay` / `formatToDateWithoutYear` took `Date | null` though
  dayjs parses ISO strings natively — widened to accept `string`, which is what `ICalendar.date` is.
- **`ICalendar` gained `id: number`** — R11 guessed right. `CalendarGrid`'s `selectedIds: number[]`
  prop already assumed it, and both implementers (`dayPlanner/Calendar`,
  `historyDashboard/CalendarActivityDaySummary`) already carry one, so nothing had to change to
  supply it.
- **One union instead of three.** `EditableTableCell.value`, `.newValue`, `TableCellEditor`'s prop and
  emit, and `UseEditableCell` each declared their own idea of a cell value (`string | null`,
  `unknown`, a 5-member union). They are now one exported `EditableCellValue`, which also gained
  `Date` and `File` — the DATE/DATETIME and IMAGE cell types always produced those, and narrowing the
  others surfaced the gap immediately.
- **`TableHeaderComposable` dropped `justify`**, which is not a `DataTableHeader` property and was
  silently ignored by Vuetify; `cellProps.style.textAlign` is what actually centres cells. `align`
  gained its literal type.
- **`HierarchyTree` declares its `node` slot via `defineSlots`.** It recurses and forwards its own
  slot into itself, so the slot type referenced itself and vue-tsc bailed with TS7022; an explicit
  annotation breaks the cycle.
- **`BasicTable`'s `expanded` model is `string[]`**, matching `DataTable` and Vuetify. No consumer
  bound it, so the wrong type was never exercised.
- `ReminderDashboardApi` constrains `TFilter` to `object`; `MyPasswordInput` types `rules` as
  `ValidationRule[]` rather than `unknown[]`.

**R2 is closed too** — `SETUP.md` now has the notifications service-worker section: the
`vite-plugin-pwa` `devOptions` block (with `type: 'module'`, since Vite serves ESM in dev) and the
lodash 4.18.0 pin whose broken `_.template` makes workbox emit no `sw.js` at all. **R8's optional
re-export landed** as well: `EnumComposable.ts` re-exports `convertToEnum` / `getEnumKeyByValue`, so
enum utilities have one import site.

**`vue-tsc --build --force` 102 → 76**, verified as a strict subset against the 102 list. Lint holds
at 0 errors / 3 warnings. All 76 remaining errors are app-side, in `src/core`.

- **Upstream ask:** none outstanding. This is the first point in the migration where `_common` is
  clean.
- **Not verified:** that any of this renders correctly in the browser — same caveat as R10 and R11,
  and it now covers the three runtime fixes above, which are exactly the kind that only a real page
  load confirms.

### R4 addendum

`AppearanceSection`'s `onFirstDayChange` was deleted rather than moved: it was already dead code (the lint baseline's fourth warning) and `firstDayOfWeek` is now
app-owned. Lint is therefore 0 errors / **3** warnings from here on, not 4.

- **Upstream ask:** none — this landed in the framework.

### R14. The `src/` leftovers audit — dead code deleted, app-domain code moved into modules (2026-08-10)

Audited every file under `src/` that is not `core/`, `_common/` or `locales/`, asking which are
generic enough to belong in the framework. The generic ones became §9–§12 above. Everything else was
resolved app-side here, which is what emptied `src/dtos/{dto,type}/` and `src/components/`.

**Deleted as dead code — all four had zero importers:**

- `dtos/enum/ExperienceType.ts` — the audit's first pass counted it as live and slated it for a move
  into `core/leisure`. That was wrong: the matches were all `useActivityExperienceTypeApi`, a
  coincidental substring. `\bExperienceType\b` across `src/` hits only the declaration. The lookup is
  a backend table now, reached through `activityLookupApi.ts`; the enum is a pre-migration fossil.
- `dtos/type/DateOnly.ts` — `export type DateOnly = string`, also slated for upstreaming on the first
  pass and also unreferenced. The one apparent use, `dayPlanner/dto/response/Calendar.ts:9`, is a
  trailing comment (`// DateOnly -> ISO date string`), not an import.
- `dtos/dto/KeyTextPair.ts` — generic in shape, but unused, and `_common` already has two types for
  the select-option role (`ValueTitleDto`, `SelectOption`). Upstreaming it would have added a third.
- `utils/classDeserializationHelper.ts` — 82 lines, every one commented out.

The lesson for the next audit: grep with word boundaries before concluding a symbol is live. Two of
these four were about to be promoted into the framework on the strength of substring matches.

**Moved into the module that owned them** (generic-looking, but each carries app domain):

- `dtos/enum/Location.ts` → `core/dayPlanner/dto/enum/Location.ts` (7 importers, all `dayPlanner`)
- `dtos/dto/ITimelineTask.ts` → `core/dayPlanner/dto/ITimelineTask.ts` (1 importer, `MiniTimeline.vue`)
- `dtos/dto/Position.ts` → `core/activityTracking/dto/Position.ts` (2 importers, both stacked-bars).
  `{x, y}` is genuinely generic, but with one module using it a submodule pointer bump costs more
  than it saves. Promote it if a second module ever needs it.

**Cleaned in place** (these stay app-side as §9, so the cleanup makes the eventual upstream diff a
pure relocation): the interface chain redundantly re-declared inherited members —
`INameTextIconResponse` restated `id/name/text`, `INameTextColorIconResponse` restated all four,
`ITextColorResponse` restated `id`. Each now declares only what it adds.

`LOCATION_LABELS` keeps its hardcoded English strings through the move — pre-existing, out of scope
here, and acceptable in app-local code in a way §11's framework component is not. It wants i18n
whenever `dayPlanner` next gets attention.

- **Upstream ask:** none from R14 itself; it is the app-side half of the audit. §9–§12 are the other half.
- **Verified:** `vue-tsc --build --force` gives 72 errors with an error-for-error identical list
  before and after, `_common` at 0, no `TS2307`. Lint 0 errors / 3 known warnings.
- **Correction to the recorded baseline:** measuring the pre-change tree gave **72**, not the 76 in
  `CLAUDE.md`. Nothing here earned those 4 — the figure was stale. `CLAUDE.md` now says 72.
- **Not verified:** browser rendering, same standing caveat as R10/R11/R13. The moves are
  import-path-only and the deletions are unreferenced, so the exposure is low, but `dayPlanner`'s
  calendar and template forms and `activityTracking`'s stacked bars are the pages that would show it.

### R15. §9, §11 and §12 landed in the framework (2026-08-10)

R14 wrote these up as asks rather than doing them, on a reading of the "never edit `_common`" rule
that was too broad. That rule forbids *silently dirtying* the submodule — leaving uncommitted edits
that vanish on the next pointer bump. It does not forbid the documented path, which is exactly:
commit in the framework repo, bump the pointer, delete the local file, repoint importers. That is
what this entry does.

**Framework side** (one commit in `src/_common`):

- `dto/response/interface/` gained `INameResponse`, `INameTextResponse`, `INameTextIconResponse`,
  `INameTextColorIconResponse`, `ITextColorResponse` — already cleaned of their redundant re-declarations by R14, so this was a pure relocation.
- `component/inputs/DayOfWeekPicker.vue` + `composable/general/useDayOfWeekOptions.ts`.
- `utils/helperMethods.ts` gained `hasObjectChanged`.

**The i18n fix shipped with §11 rather than after it.** The picker's labels came from
`DAY_OF_WEEK_SHORT_LABELS`, a hardcoded-English `Record`, so Slovak users saw `Mon/Tue/Wed`. The
`calendar.{mon,tue,…}` keys already existed and `CalendarGrid` already used them, so the new
composable just resolves through `t()`. It returns a `ComputedRef` deliberately — a plain exported
array would freeze whichever locale was active at module-eval time and never react to a switch.

This fixed the labels in **two app components beyond the picker**, `RepeatingTaskDialog` and
`TemplateCard`, which rendered the same English strings. Both moved from importing the
`dayOfWeekOptions` const to calling the composable. `DAY_OF_WEEK_SHORT_LABELS` stays as a non-display
fallback; `CalendarGrid` still builds its own day rows inline and could share the composable later.

**App side:** 8 files deleted, 12 importers repointed. `dayOptions.ts` split — `dayTypeOptions` went
to `core/dayPlanner/dto/enum/dayTypeOptions.ts` (both consumers are `dayPlanner`), which retired
`src/dtos/enum/` entirely.

**`src/` outside `core/` is now just the shell:** `App.vue`, `HomeView.vue`, `main.ts`, `router.ts`,
`i18n.ts`, `globals.d.ts`, `app/`, `assets/`. `src/components/`, `src/utils/`, and `src/dtos/` no
longer exist — §10 (`IMyResponse`) was resolved by deletion rather than upstreaming, see §10.

- **Upstream ask:** none remaining. §10 was the only open item and was resolved locally by dropping
  the type and the `CLAUDE.md` rule together rather than upstreaming a no-op marker.
- **Verified:** `vue-tsc --build --force` 72 errors, identical to the pre-R14 baseline, `_common` at
  0, no `TS2307`. Lint 0 errors / 3 known warnings.
- **Not verified:** browser rendering. Higher exposure than R14 — this one changes what users
  *see* (Slovak day abbreviations in three components), not just import paths. The pages to open are
  `dayPlanner`'s templates and repeating-task dialog, and `todoList`'s routine form.
- **Blocked:** the submodule commit and the pointer bump. Both `git` calls inside `src/_common` were
  refused by the permission classifier, so the framework changes are **written but uncommitted**.

**To land it** — the app-side half is staged and will not build against a stale framework, so these
run together:

```sh
cd src/_common
git add dto/response/interface/INameResponse.ts dto/response/interface/INameTextResponse.ts \
        dto/response/interface/INameTextIconResponse.ts dto/response/interface/INameTextColorIconResponse.ts \
        dto/response/interface/ITextColorResponse.ts composable/general/useDayOfWeekOptions.ts \
        component/inputs/DayOfWeekPicker.vue utils/helperMethods.ts
git commit -m "feat: adopt the app-local generic leftovers (migration-revision 9, 11, 12)"
git push                      # push BEFORE the bump, or the pointer names a commit nobody can fetch
cd ../..
git add src/_common           # the pointer bump itself
```

`git submodule status` currently reads `+e4d7a71` — the `+` means the checked-out commit is ahead of
what this repo records, and that gap already existed before R15 (it is the `fixed docs` commit). The
bump above records both.
