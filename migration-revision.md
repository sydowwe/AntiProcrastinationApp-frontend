# Migration revisions — items deferred pending upstream framework changes

Things the alignment migration could not adopt because `src/_common` (the `MDF_framework` submodule)
lacks a capability this app actively uses. Per the brief's §6 rule these are **not forked locally** —
they stay as app-local files until the framework gains the missing piece, then get repointed.

**Never fix these by editing `src/_common`.** Add them in the framework repo, bump the submodule
pointer, then delete the local file and repoint its importers.

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
- **Why it matters:** the day planner's undo button shows `Undo: <description> · go to <date>` and
  navigates the planner to the date the undone action belongs to. Adopting the framework version
  deletes that navigation.
- **Also in the framework version, and wanted:** `undo()` wraps the callback in `try/catch` and shows
  an error snackbar on failure; the success message goes through `t('common.undoSuccess')` instead of
  a hardcoded English string. Both are improvements — take them when `date` lands.
- **Upstream ask:** add an optional `date?: Date` to `UndoEntry` and return
  `nextUndoDate = computed(() => stack.value[0]?.date ?? null)`.

### 2. `EnumComposable` — missing `convertToEnum` / `getEnumKeyByValue`

- **Local file kept:** `src/composables/general/EnumComposable.ts`
- **Framework file:** `_common/composable/general/EnumComposable.ts` (has only `getEnumSelectOptions`,
  which is identical apart from an explicit return type)
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
- **Extra work when adopting:** the framework's rules take their messages from `t('validation.*')`.
  Those keys exist in `_common/_locales/common.sk.ts` (already spread into `src/locales/SK.ts`) but
  **not in `src/locales/EN.ts`**, which has no `validation` namespace. Mirror them before switching,
  or EN users see raw keys.
- **Upstream ask:** add `phoneNumberRule` to `useGeneralRules`.

### 4. `useAutoScroll` — the framework version has a bug

- **Local file kept:** `src/composables/general/useAutoScroll.ts`
- **Framework file:** `_common/composable/general/useAutoScroll.ts`
- **This one is not a missing capability — the framework version is broken.** It hoists the
  `setInterval` out of the two edge-proximity branches and guards it with
  `if (autoScrollSpeed.value !== 0)`. When the pointer moves out of the edge zone neither branch
  runs, so `autoScrollSpeed` keeps its previous non-zero value, the guard passes, and a fresh
  interval starts — the container scrolls forever until `stopAutoScroll()` is called explicitly.
  The local version starts the interval only inside a branch, so leaving the edge zone stops it.
- **Used by:** 2 files.
- **Upstream ask:** reset `autoScrollSpeed.value = 0` before the branches (a one-line fix), then this
  becomes a clean adopt.

---

## Deferred at step 7 (components) — noted early

`src/components/general/dataTable/BasicTable.vue` exposes a `formattedColumn` slot that the
framework's `_common/component/dataTable/BasicTable.vue` does not have — the framework forwards
per-column `#item.<key>` slots instead. Five app tables consume `formattedColumn`
(`ActivityCategoryTable`, `ActivityRoleTable`, `BacklogTable`, `BucketListTable`,
`RoutineSettingsView`). Swapping in the framework component is therefore a rewrite of those five
call sites, not an import repoint — budget for it.

Related: `getNestedValue` moved to `_common/utils/helperMethods.ts` and now returns `unknown` where
the local one returned `any`. The local `BasicTable` bridges this with a `getColumnValue` wrapper;
delete the wrapper when the component goes.
