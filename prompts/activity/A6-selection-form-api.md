# A6 · Reshape ActivitySelectionForm's public API

- **Scope:** `src/core/activity/`, plus 10 consumer files in `activityHistory` and `activityTracking`
- **Backend:** none
- **Model / effort:** **Opus 5**, high — this is a "where does the seam go" problem across five modules. A wrong answer gets torn out later, and the compiler will not catch a missed `defineExpose` consumer in a template.
- **Depends on:** A1 (items 6 and 8 change the same component), A2 (deletes one of the exposed members)
- **Unblocks:** nothing, but everything downstream is cheaper afterwards

---

```
ActivitySelectionForm.vue is the most-reused component in this app — 10 call sites across
activityHistory and activityTracking — and it is driven almost entirely through `defineExpose` and
template refs. That inverts Vue's data flow: parents reach in, read computed values off a child
instance, and call methods on it. There is no type checking across that boundary in templates, and
half the exposed surface exists only because the child happens to know something the parent needed.

Read all of this before changing anything:

  src/core/activity/component/ActivitySelectionForm.vue
  src/core/activity/composable/useActivitySelectionFormState.ts
  src/core/activity/component/ActivitySelectOrQuickEditFormField.vue

Consumers of ActivitySelectionForm (10):
  core/activityHistory/component/AddActivityManuallyForm.vue
  core/activityHistory/component/EditActivityHistoryForm.vue
  core/activityHistory/component/HistoryPanelFilter.vue
  core/activityHistory/view/PomodoroTimerView.vue           ← two instances, focus + rest
  core/activityHistory/view/StopWatchView.vue
  core/activityHistory/view/TimerView.vue
  core/activityTracking/component/android/androidSettings/AndroidDistinctEntriesActions.vue
  core/activityTracking/component/android/androidSettings/AndroidMappingsFilter.vue
  core/activityTracking/component/desktop/desktopSettings/DesktopDistinctEntriesActions.vue
  core/activityTracking/component/desktop/desktopSettings/DesktopMappingsFilter.vue

Consumers of ActivitySelectOrQuickEditFormField (4):
  core/todoList/component/normal/ToDoListItemDialog.vue
  core/todoList/component/routine/dialog/RoutineToDoListForm.vue
  core/dayPlanner/component/BasePlannerTaskDialog.vue
  core/dayPlanner/component/settings/RepeatingTaskDialog.vue

Three changes, in this order.

=== 1. Selection state comes out as data, not as getters read off a ref ===

Today ActivitySelectionForm exposes six computed name-getters. PomodoroTimerView.vue reads
`mainActivitySelectionForm?.getSelectedActivityName` directly in its template (lines 218, 221, 230)
and casts it `as string` in script (lines 446, 517-518). HistoryPanelFilter reads
getSelectedRoleName / getSelectedCategoryName / getSelectedTaskPriorityName the same way. That is a
child rendering into its parent by proxy.

Replace them with one emitted/modelled selection object. Suggested:

  const selection = defineModel<ActivitySelection | null>('selection', { default: null })

  class ActivitySelection {
    activityId: number | null
    activityName: string
    roleId / roleName
    categoryId / categoryName
    taskPriorityId / taskPriorityName
    routineTimePeriodId / routineTimePeriodName
  }

Kept in sync inside useActivitySelectionFormState from the same computeds that exist now. Parents bind
`v-model:selection="…"` and read a plain reactive object — typed, no `as string`, no optional chaining
through a component instance.

Names are display data derived from the loaded options. Note the ordering hazard this already has and
must not regress: the options list loads in `onMounted`, so for one tick after mount every name
computed returns `''`. PomodoroTimerView reads them at timer-save time so it has never been hit, but a
consumer that reads on mount will get an empty string, not undefined. Make `selection` null until
options have loaded rather than an object full of empty strings.

`getSelectedActivityId` is deleted by A2 — do not carry it forward.

=== 2. saveActivityToHistory does not belong in the activity module ===

useActivitySelectionFormState.ts:95-107 imports `useActivityHistoryCrud` from
`@/core/activityHistory/api/` and writes history records, with its own hardcoded English snackbars.
CLAUDE.md permits cross-module imports via another module's `api/`, so this is legal — but it is the
wrong module: a *selection* composable that also *commits* a history record is why three timer views
call `activitySelectionForm.value?.saveActivityToHistory(...)` instead of owning their own save.

Move it to activityHistory — a `useSaveActivityToHistory()` composable in
core/activityHistory/composable/, taking `(activityId, activityName, startTimestamp, activityLength)`.
The three timer views (TimerView, StopWatchView, PomodoroTimerView) call it directly with the
`selection` they now hold from change 1. This removes the last reason for those views to keep a
template ref at all, apart from validate().

PomodoroTimerView.vue:574-582 calls it on two different form instances (focus and rest) — check that
path carefully, it is the only two-instance consumer.

=== 3. Four layout booleans become one prop ===

`isInDialog`, `isInRow`, `isFilter` and `showFromToDoListField` currently produce expressions like
`:lg="isInDialog ? 12 : isInRow ? 3 : 6"` (line 48) and
`:density="isInRow ? 'compact' : 'comfortable'"` (lines 82, 91). Four booleans describe 16 states, of
which 3 are real.

Collapse the two pure-layout ones into `layout?: 'stacked' | 'row' | 'dialog'` (default 'stacked').
Keep `isFilter` — it is not layout, it changes where the selected id is stored and whether the field
is required — but rename it to something that says so (`mode?: 'select' | 'filter'`) since it now
sits next to a real layout prop. Keep `showFromToDoListField`; it is a genuine content toggle.

Audit each of the 10 call sites for which of the three layouts it actually wants. Do not preserve
accidental combinations — if a call site currently passes `isInDialog` *and* `isInRow`, decide which
one it meant and say so in your summary.

=== What stays imperative ===

`validate()` stays exposed and stays called through a template ref. It is a genuine imperative
action with no data-flow equivalent, and four call sites depend on it
(AddActivityManuallyForm, PomodoroTimerView:354, ActivitySelectOrQuickEditFormField:132, and the
dialogs). Do not try to model validation as state.

`loading` should move from defineExpose to a plain emit or a `v-model:loading` — one consumer
(ActivitySelectOrQuickEditFormField) re-exposes its own `loading` up another level, which is the same
anti-pattern one layer higher. Fix both layers.

=== Constraints ===

- Do this as one commit per change (1, 2, 3), not one commit for all three. Each is independently
  revertable and each leaves the app working.
- `npm run type-check` (baseline 72 errors, CLAUDE.md) must not increase. Template-ref property access
  is not always type-checked, so type-check passing does not prove the consumers are correct —
  grep for each removed exposed name across src/ before declaring done.
- Do not touch src/_common. If the framework is missing something, add a migration-revision.md entry
  per CLAUDE.md rather than working around it locally.

Verify by exercising every consumer in the running app: the three timer views (start → stop → the save
confirmation names the right activity), the history filter panel (role/category/priority chips show
the selected names), Add-activity-manually and Edit-history-record dialogs, both android and desktop
tracking settings views (mappings filter + the distinct-entries action bar), and all four
ActivitySelectOrQuickEditFormField dialogs in todoList and dayPlanner.
```
