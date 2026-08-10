# Migration revisions — items deferred pending upstream framework changes

Things the alignment migration could not adopt because `src/_common` (the `vue_framework` submodule)
lacks a capability this app actively uses. Per the brief's §6 rule these are **not forked locally** — they stay as app-local files until the framework gains the
missing piece, then get repointed.

**Never fix these by editing `src/_common`.** Add them in the framework repo, bump the submodule pointer, then delete the local file and repoint its importers.

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

### 5. `CalendarGrid` — framework exposes only `dateRange`

- **Local file kept:** `src/components/general/calendar/CalendarGrid.vue`
- **Framework file:** `_common/component/calendar/CalendarGrid.vue`
- **Gap:** local does `defineExpose({ calendarData, dateRange, loading, refresh })`; the framework does `defineExpose({ dateRange })`.
- **Used by:** `src/views/dayPlanner/PlannerCalendarView.vue` calls `refresh()` at 5 sites and reads
  `calendarData` at 2, through a template ref. `src/views/history/HistoryCalendarView.vue` also imports it.
- **Upstream ask:** widen the expose to `{ calendarData, dateRange, loading, refresh }`.
- The local file's internal imports have already been repointed at `_common`
  (`DateRangePicker`), so only the component itself and the two importers need switching once the expose lands.

### 6. The `dataTable` family — `BasicTable` / `DataTable` / `MyTableFooter` — **resolved, see R7**

---

## Found at step 13 (scheduler + reminders) — a framework bug, nothing kept local

### 7. `FilterPanel` mistypes its `#fields` slot prop

- **Framework file:** `_common/component/FilterPanel.vue`
- **Nothing is forked for this** — it is listed here only so the type-error count is explainable and the fix has somewhere to be recorded.

`FilterPanel` declares its draft as:

```ts
const draft = ref<T>(cloneFilter(filter.value)) as { value: T }
```

The `as { value: T }` cast suppresses a `UnwrapRef` complaint at the definition, but it also becomes the type handed to the `#fields` slot. So every consumer writing
the natural

```vue
<template #fields="{ draft }">
    <VSelect v-model="draft.someField" />
</template>
```

gets `Property 'someField' does not exist on type '{ value: { … } }'`, once per field.

- **Affects:** ~20 errors across the framework's own `reminders` views (already inside the 162-error baseline) and 5 in `_common/modules/scheduler`
  (`JobRunHistory.vue`, `SchedulerJobsView.vue`).
- **Runtime is fine.** Vue unwraps the ref when it passes the slot prop, so `draft.someField` is the correct thing to write — only the *type* is wrong. Rewriting
  call sites to `draft.value.someField`
  would type-check and then break at runtime, which is why nothing here was "fixed".
- **Upstream ask:** drop the cast and let the slot expose `T`. Either type the binding as
  `Ref<UnwrapRef<T>>` and expose `draft.value`, or keep `ref` and cast to `{ value: UnwrapRef<T> }`
  while declaring the slot as `{ draft: T }` via `defineSlots`.

Until it lands, `vue-tsc --build --force` reports 166 rather than 162, and the delta is entirely this.

---

## Found while rebuilding the home dashboard — a cross-module import to unwind

### 8. `TrackTimeDialog` is shared between `dayPlanner` and `home`

- **Local file kept:** `src/core/dayPlanner/component/normal/TrackTimeDialog.vue` (unchanged, still owned by `dayPlanner`)
- **New importer:** `src/core/home/component/NowBar.vue`

The now-bar's one-tap "track this block" needs exactly the dialog the planner already has: a stopwatch/timer/pomodoro switch bound to an activity, which patches the
planner task to `InProgress` on start. Importing it from `core/home` breaks the rule that cross-module imports go through `api/` or `dto/` only.

The alternatives were worse. Duplicating the dialog into `core/home` would fork the status-patch logic (`PatchPlannerTaskStatusRequest` with `actualStartTime`) into
two places that must stay in step. Reaching for the timer views directly is no cleaner — `TrackTimeDialog` itself already imports
`@/core/activityHistory/view/{StopWatchView,TimerView,PomodoroTimerView}.vue`, so that pattern is pre-existing in the codebase.

- **Also note:** `core/home/component/DayPlannerWidget.vue` and `NowBar.vue` share `core/home/composable/useTodayPlan.ts`, which is module-local and fine. It is the
  dialog alone that crosses.
- **Upstream ask:** none for the framework. Either move `TrackTimeDialog` to a shared location both modules may import, or give `activityHistory` an exported
  "track time for an activity" dialog that `dayPlanner` and `home` both consume — the timer views it wraps already live there.

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

**Not part of this fix:** `vue-tsc --build --force` reports 190 errors post-conversion, not the pre-migration 163. The extra ~27 are pre-existing — every one of the
ten converted files errors identically with the dead `formattedColumn` slot restored (verified by temporarily reverting one file's template while keeping its
`_common` import), so the cause is the uncommitted `src/_common` submodule bump, not this slot conversion: the framework `BasicTable`'s generic `TItem` now fails to
infer from `v-model="items"` + `@onEdit`/`@onDelete` on these ten call sites, widening to the `IIdResponse` constraint and breaking every prop that depends on the
concrete item type. Worth a fresh submodule-pointer investigation, but out of scope here since it predates and is independent of the slot work.

- **Upstream ask:** none for the slot mechanism itself — `#item.<key>` is working as designed. Separately, whatever changed in the `_common` bump that broke generic
  `TItem` inference for `BasicTable` needs its own look.

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

### R4 addendum

`AppearanceSection`'s `onFirstDayChange` was deleted rather than moved: it was already dead code (the lint baseline's fourth warning) and `firstDayOfWeek` is now
app-owned. Lint is therefore 0 errors / **3** warnings from here on, not 4.

- **Upstream ask:** none — this landed in the framework.
