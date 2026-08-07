# Migration revisions — items deferred pending upstream framework changes

Things the alignment migration could not adopt because `src/_common` (the `vue_framework` submodule)
lacks a capability this app actively uses. Per the brief's §6 rule these are **not forked locally** — they stay as app-local files until the framework gains the
missing piece, then get repointed.

**Never fix these by editing `src/_common`.** Add them in the framework repo, bump the submodule pointer, then delete the local file and repoint its importers.

---

## Deferred at step 6 (composables)

Six of the ten duplicated composables were adopted. These four were not.

### 1. `useUndoStack` — missing `UndoEntry.date` / `nextUndoDate`

- **Local file kept:** `src/composables/general/useUndoStack.ts`
- **Framework file:** `_common/composable/general/useUndoStack.ts`
- **Gap:** the framework's `UndoEntry` has no `date` field and the composable does not expose
  `nextUndoDate`.
- **Used by:** `src/components/dayPlanner/normal/DayPlannerHeader.vue` (5 references),
  `src/views/dayPlanner/DayPlannerView.vue`
- **Why it matters:** the day planner's undo button shows `Undo: <description> · go to <date>` and navigates the planner to the date the undone action belongs to.
  Adopting the framework version deletes that navigation.
- **Also in the framework version, and wanted:** `undo()` wraps the callback in `try/catch` and shows an error snackbar on failure; the success message goes through
  `t('common.undoSuccess')` instead of a hardcoded English string. Both are improvements — take them when `date` lands.
- **Upstream ask:** add an optional `date?: Date` to `UndoEntry` and return
  `nextUndoDate = computed(() => stack.value[0]?.date ?? null)`.

### 2. `EnumComposable` — missing `convertToEnum` / `getEnumKeyByValue`

- **Local file kept:** `src/composables/general/EnumComposable.ts`
- **Framework file:** `_common/composable/general/EnumComposable.ts` (has only `getEnumSelectOptions`, which is identical apart from an explicit return type)
- **Used by:** `convertToEnum` — 6 files; `getEnumKeyByValue` — 1 file
- **Upstream ask:** add both functions verbatim from the local file.

### 3. `RulesComposition` — missing `phoneNumberRule`

- **Local file kept:** `src/composables/general/rules/RulesComposition.ts`
- **Framework file:** `_common/composable/general/rules/RulesComposition.ts`
- **Gap:** only `phoneNumberRule` (`/^09\d{8}$/`, Slovak mobile format). Used by 1 file.
- **Note — MIGRATION-PLAN.md §7 is wrong on this row.** It lists `isOnlyNumbers`,
  `isLettersAndNumbers`, `isOnlyLettersWithDiacritics`, `isLettersWithDiacriticsAndSpecialChars` and
  `isLettersWithDiacriticsAndNumbersAndSpecialChars` as missing. They all exist upstream in
  `_common/utils/validators.ts` and are re-exported from the framework's `RulesComposition`. Only
  `phoneNumberRule` is genuinely absent.
- **Extra work when adopting:** the framework's rules take their messages from `t('validation.*')`. Those keys exist in `_common/_locales/common.sk.ts` (already
  spread into `src/locales/SK.ts`) but **not in `src/locales/EN.ts`**, which has no `validation` namespace. Mirror them before switching, or EN users see raw keys.
- **Upstream ask:** add `phoneNumberRule` to `useGeneralRules`.

### 4. `useAutoScroll` — the framework version has a bug

- **Local file kept:** `src/composables/general/useAutoScroll.ts`
- **Framework file:** `_common/composable/general/useAutoScroll.ts`
- **This one is not a missing capability — the framework version is broken.** It hoists the
  `setInterval` out of the two edge-proximity branches and guards it with
  `if (autoScrollSpeed.value !== 0)`. When the pointer moves out of the edge zone neither branch runs, so `autoScrollSpeed` keeps its previous non-zero value, the
  guard passes, and a fresh interval starts — the container scrolls forever until `stopAutoScroll()` is called explicitly. The local version starts the interval only
  inside a branch, so leaving the edge zone stops it.
- **Used by:** 2 files.
- **Upstream ask:** reset `autoScrollSpeed.value = 0` before the branches (a one-line fix), then this becomes a clean adopt.

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

### 6. The `dataTable` family — `BasicTable` / `DataTable` / `MyTableFooter`

Held back together; they only make sense as a unit. This is a **rewrite, not an import repoint**.

- **Local files kept:** `src/components/general/dataTable/{BasicTable,DataTable,MyTableFooter}.vue`
- **Importers:** `BasicTable` 12, `DataTable` 3, `MyTableFooter` 1 (from `BasicTable`)

What differs:

|                      | local `DataTable`           | framework `DataTable`                                                                                    |
|----------------------|-----------------------------|----------------------------------------------------------------------------------------------------------|
| `items`              | `defineModel` (two-way)     | plain prop                                                                                               |
| `loading`            | `defineModel`               | plain prop                                                                                               |
| `showSelect` default | `true`                      | `false`                                                                                                  |
| generic constraint   | `TItem extends IMyResponse` | `TItem extends IIdResponse` (needs `id`)                                                                 |
| cell rendering       | passthrough                 | auto-formats by key heuristic — date / datetime / boolean / currency / percent, via `useTableFormatters` |
| extra models         | —                           | `v-model:expanded`, `v-model:selected`                                                                   |
| actions column       | rendered by `BasicTable`    | rendered by `DataTable` itself                                                                           |
| styling              | 2px `#bbb` border           | themed `.my-data-table`, 8px radius, hover rows                                                          |

Every `v-model="items"` / `v-model:loading` call site changes shape, selection checkboxes disappear unless `showSelect` is passed explicitly, and cells start
auto-formatting based on column-key names — a visible change to every table in the app.

Separately, the local `BasicTable` exposes a `formattedColumn` slot the framework's has no counterpart for (the framework forwards per-column `#item.<key>` instead).
Five app tables consume it: `ActivityCategoryTable`, `ActivityRoleTable`, `BacklogTable`, `BucketListTable`,
`RoutineSettingsView`.

**Recommendation:** do this as its own step with the app running side by side, not folded into a mechanical migration commit.

Related: `getNestedValue` moved to `_common/utils/helperMethods.ts` and now returns `unknown` where the local one returned `any`. The local `BasicTable` bridges this
with a `getColumnValue` wrapper; delete the wrapper when the component goes.

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

The runtime code is right, so there is nothing to fix in `_common`. The gap is documentation: nothing in `SETUP.md` says the `notifications` module requires a service
worker in dev, so the next app rediscovers both from scratch.

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
- `component/settings/{AboutSection,DataExportSection,PreferencesSection}.vue` — hardcoded support e-mail and `/legal/*` links, an `antiprocrastination-export-*.json`
  filename, and an `askBeforeDelete` toggle. All render through the framework view's `#append` / `#preferences` slots.
- `view/UserSettingsView.vue` + `user.routes.ts` — a thin wrapper filling those slots, and the `/user/settings` route for it. The framework's `userRoutes` covers only
  the five signed-out views.
- `dto/userAugmentation.ts` — **new.** Merges `askBeforeDelete` / `firstDayOfWeek` into the framework's `User` / `UserPreferencesRequest` via `declare module`.

Three things changed shape rather than moving:

- **`@/router.ts` → `useRouter()`** in six files. Importing the app's router singleton is not something framework code can do.
- **The Google Calendar card left `SecuritySection`** and became `core/googleCalendar/component/GoogleCalendarCard.vue`, rendered through the new `#integrations`
  slot. Third-party account links are host-app concerns.
- **`UserSession implements IMyResponse` dropped the clause.** `IMyResponse` is `export type IMyResponse = object` — a no-op marker with no framework counterpart, so
  implementing it bought nothing and cost a dependency on `@/dtos/`.

`AppearanceSection`'s `onFirstDayChange` was deleted rather than moved: it was already dead code (the lint baseline's fourth warning) and `firstDayOfWeek` is now
app-owned. Lint is therefore 0 errors / **3** warnings from here on, not 4.

- **Upstream ask:** none — this landed in the framework.
