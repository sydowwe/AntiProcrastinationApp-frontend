# A1 · Correctness sweep (activity)

- **Scope:** `src/core/activity/`
- **Backend:** none
- **Model / effort:** Sonnet 5, medium — every item is located and diagnosed below; the work is applying fixes carefully, not finding them.
- **Depends on:** nothing
- **Unblocks:** everything (do this first)

---

```
Fix the following confirmed defects in src/core/activity/. Each is a real bug with a located cause.
Do NOT restructure anything — A2 deletes dead code, A3 deduplicates the tables and A6 reshapes
ActivitySelectionForm's API. Overlapping with them here creates conflicts.

--- 1. ActivityRequest.fromJson passes constructor arguments in the wrong order ---

src/core/activity/dto/request/ActivityRequest.ts

  constructor(name, text, roleId, categoryId, isUnavoidable)
  static fromJson(...) { return new ActivityRequest(name, text, isUnavoidable, roleId, categoryId) }

`isUnavoidable` (a boolean) lands in `roleId`, `roleId` lands in `categoryId`, and `categoryId` is
dropped. Every field after `text` is wrong.

First check whether anything calls it (`grep -rn "ActivityRequest.fromJson" src/`). If nothing does,
delete the method — a request DTO rehydrated from JSON has no caller in this app, and a broken
unused method is worse than no method. If something does call it, fix the argument order.

--- 2. Activity.fromJson does not hydrate its nested DTOs ---

src/core/activity/dto/response/Activity.ts:15-25

  const { id = 0, name = '', text = '', isUnavoidable = false,
          role = new Role(), category = new Category() } = object
  return new Activity(id, name, text, isUnavoidable, role, category)

Two problems:

a) `role` and `category` are assigned straight from the raw JSON. They are never passed through
   `Role.fromJson` / `Category.fromJson`, so `activity.role` is a plain object that only looks like a
   Role. It works today because both classes are pure data, and it will stop working the moment
   either grows a method or a normalising fromJson. Fix: `role: Role.fromJson(object.role)`,
   `category: object.category ? Category.fromJson(object.category) : null`.

b) `category = new Category()` as a destructuring default. Destructuring defaults fire only when the
   key is **absent**, not when it is null. So an omitted category becomes a Category with id 0 and
   name '' — which renders as an empty cell in ActivityTable rather than the intended '—', because
   `item.category?.name ?? '—'` sees the empty string, not null. An explicit null category works
   correctly today. Make both paths produce null.

`text` is typed `string | null` but defaults to `''`. Default it to null so the type is honest.

--- 3. ActivitySelectOptionCombination.fromJson has the same bug, and one worse case ---

src/core/activity/dto/response/ActivitySelectOptionCombination.ts:17-24 destructures with
`roleOption = SelectOption.fromJson(object.roleOption)` and the same for the other three options.
Three outcomes, only one of which is correct:

- key present with an object → the **default never runs**; the raw JSON object is stored, not a
  SelectOption instance.
- key present with null → default never runs; null is stored. This is the only correct path.
- key **absent** → the default runs `SelectOption.fromJson(undefined)`, which destructures undefined
  and throws TypeError. The whole options fetch then dies (see item 4).

Rewrite it without destructuring defaults for these four fields:

  const roleOption = SelectOption.fromJson(object.roleOption)          // required, per the type
  const categoryOption = object.categoryOption ? SelectOption.fromJson(object.categoryOption) : null
  // …same for taskPriorityOption and routineTimePeriodOption

Note the knock-on: because `categoryOption` is currently never a SelectOption *instance*, the three
`.filter((option): option is SelectOption => option !== null)` guards in
composable/ActivitySelectsComposition.ts:69, 74 and 79 are doing nothing useful. After this fix they
become meaningful — keep them.

Rename `listFromJsonList` to `listFromObjects` to match every other response DTO in the app, and
update the one call site (ActivitySelectsComposition.ts:24).

--- 4. The select-options fetch swallows its own failure ---

composable/ActivitySelectsComposition.ts:20-30 calls `API.get` directly and ends with
`.catch(error => { console.error(...); return [] })`. A failed request is indistinguishable from an
account with no activities: every dropdown in the app renders empty, with no snackbar and no error.

Route it through the framework instead of raw axios. `useEntityQuery` cannot express this URL
(`{source}/form-select-options` is not `/{entity}/{id}`), so keep a hand-written function but use
`useRequestState` from '@/_common/api/useRequestState.ts' so the interceptor surfaces the error and
`loading` is shared. Drop the catch entirely — let it reject. Callers already have a `loading` flag;
make them null their options on rejection rather than silently keeping stale ones.

--- 5. Role and category filters on the settings view are broken ---

view/ActivitySettingsView.vue:28-51 binds two VComboboxes with `v-model="roleCombobox as any"` over
`ref<any[]>([])`, then lines 151-169 split the selection with
`vals.filter(v => typeof v === 'number')` for ids and `typeof v === 'string'` for free text.

VCombobox with `:items` of objects and no `returnObject={false}` emits the **selected item objects**,
not their `itemValue`. So the number branch never matches, `activityFilter.roleIds` stays empty, and
picking a role from the list contributes nothing to the filter. Only typed free text (which does come
back as a string) reaches the server.

Fix by typing the refs honestly — `ref<(SelectOption | string)[]>([])` — and splitting on
`typeof v === 'string'` for free text vs. `v.id` for picked options. Remove both `as any` casts; if
Vuetify's generic fights you, the fix is the ref type, not a cast. Verify against the running app
that picking "Work" from the Roles combobox actually narrows the table.

--- 6. Options do not cascade outside filter mode ---

composable/useActivitySelectionFormState.ts:70-79 recomputes `filteredOptions` inside
`watch(formData, …)` but guards the whole body with `if (isFilter)`. In the create/select case
(`isFilter === false`, which is most of the app) choosing a role therefore does not narrow the
category or activity list — the whole point of `filterActivityFormSelectOptions`.

Recompute `filteredOptions` unconditionally; keep only the `activityIdModel.value = newValue.activityId`
assignment behind the `isFilter` guard, since in the other mode selection lives in `selectedActivityId`
and that assignment would fight the user.

Watch out for the loop this opens: narrowing the activity list can invalidate an already-selected
activity. After recomputing, if the selected activity id is no longer present in
`filteredOptions.activityOptions`, clear it. Same for role and category.

--- 7. useTimerNotifications leaks and cross-cancels ---

composable/useTimerNotifications.ts is a module-level singleton (shared `titleIntervalId`,
`soundIntervalId`, `audioContext`, `originalTitle`) wrapped in a function that *looks* per-component.
Two consumers — TimerView.vue and PomodoroTimerView.vue.

a) Line 83 calls `document.addEventListener('visibilitychange', …)` on **every** invocation of
   `useTimerNotifications()`, with no dedupe. Two live consumers, two listeners.
b) `cleanup()` (line 95) both stops all notifications and removes the shared listener. It is wired to
   `onUnmounted`, so the first component to unmount stops the *other* component's alarm and unhooks
   visibility handling for everyone still running.
c) `onUnmounted` is called unconditionally inside the composable, so calling it outside a component
   setup logs a Vue warning.
d) `originalTitle` is captured at module evaluation time — whatever the title was when the bundle
   loaded, which is not necessarily what it should be restored to.

Make the module state genuinely global and reference-counted: attach the visibilitychange listener
once on first use and remove it when the last consumer unmounts; have per-consumer cleanup stop only
its own notification, not the shared machinery. Capture the title to restore at the moment the
animation starts, not at module load. Guard `onUnmounted` with `getCurrentInstance()`.

Also: an AudioContext created before a user gesture starts in the 'suspended' state and stays there.
`playNotificationSound` should `await audioContext.resume()` when `state === 'suspended'` — otherwise
the timer-end alarm is silent for anyone who hasn't clicked since page load.

--- 8. Small ones ---

- component/ActivitySelectOrQuickEditFormField.vue:163 — stray `console.log(selectedActivityId.value)`.
  Delete.
- composable/quickCreateActivityComposition.ts:22 — stray `console.log(response.data)`. Delete.
- component/ActivitySelectOrQuickEditFormField.vue:159 —
  `JSON.parse(JSON.stringify(activityBeforeEdit.value))` clones a QuickActivityToolsDto into a plain
  object, so `activityFormFieldData` is no longer the class it is typed as. Construct a new
  QuickActivityToolsDto from the fields instead.
- composable/quickCreateActivityComposition.ts:39 — `parseInt(response.data)` with no radix on a value
  that is already a number in the JSON body. Use `Number(response.data)` and handle a null body
  (Overwrite mode returns no id) explicitly rather than relying on `response.data ? … : null`, which
  also treats id 0 as absent.
- composable/useActivitySelectionFormState.ts:96 — `if (!activityIdModel.value)` treats id 0 as
  absent. Use `== null`.
- component/ActivitySelectionForm.vue:9-36 — `formData!` non-null assertions on a defineModel that has
  a default and can never be null. Drop the `!`s.

Leave the hardcoded English alone — A4 localizes the module and doing it here would collide.
Leave the three tables' duplication alone — that is A3.

Verify: `npm run type-check` (baseline is 72 errors, all in src/core — note the new number),
`npm run lint` (must stay at 0 errors). In the running app: /activity-settings on all three tabs with
each filter exercised, the stopwatch and pomodoro views end-to-end including the end-of-timer sound,
and the activity picker inside a to-do item dialog with a role selected (item 6).
```
