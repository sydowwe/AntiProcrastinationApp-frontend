# A7 · Backend ask — `{source}/form-select-options` nullability — **ANSWERED**

Asked after building the A7 cache; answered from the .NET solution. Nothing further is needed from the
backend. Two of the answers change frontend work and are carried forward below.

## Answers

**1. Can `roleOption` be null or omitted? No — on none of the three sources.**

`ActivityFormSelectOptionsResponse.RoleOption` is a required `SelectOptionResponse`; the other three
are `SelectOptionResponse?`. The nullability split the frontend inferred from the JSON is exactly the
split in the C# type. The handler builds it unconditionally
(`BaseActivityFormSelectOptionsEndpoint.cs:58`), with no path that omits it.

The "role was deleted" hypothesis is structurally impossible: `Activity.RoleId` is `long`, not
`long?`, and `ActivityConfiguration` declares `HasOne(e => e.Role) … .IsRequired()` with
`OnDelete(DeleteBehavior.Cascade)` — deleting a role deletes its activities, so there is no orphaned
activity to leak a null through. `Activity` is not soft-deletable either.

→ **Frontend action: none.** `roleOption` stays non-nullable and both read sites stay unguarded.

**2. Can `id` or `text` be null on a nested option? No.**

`Id` is `long`. `Text` comes from `Activity.Name` / `ActivityRole.Name` / `ActivityCategory.Name`, all
required `string` through `BaseNameTextEntityConfigure()` (`.HasMaxLength(100).IsUnicode().IsRequired()`),
so NOT NULL at the column. `CategoryOption` is only constructed when `CategoryName != null`, so even
the nullable one cannot carry a null text.

Caveat the schema does not forbid: **empty string**. Write validators use `NotEmpty()` (e.g.
`QuickEditActivityValidator.cs:11`), but that is a validator, not a constraint, and not every create
path was audited. A null-text entry cannot happen; a `""`-text one is merely unknown.

→ **Frontend action: none required.** Optional cheap insurance is `text || '—'` at render time — not a
nullable declaration.

**3. Is `activity` a strict superset of the other two? Yes — but it does not buy the fetch saving.**

`activity` returns every `Activity` for the user, unfiltered. `activity-history` and `planner-task`
return `Distinct()` activities referenced by the user's history / planner rows; both dependents inherit
`BaseEntityWithActivity` with a non-nullable required FK, and both are user-scoped, so every row in the
narrow responses is a row in the wide one with identical field values.

But the subsets are defined by *which activities are referenced*, and the wide response carries no
marker of that — the subsets cannot be reconstructed from it. Collapsing to one fetch would mean
deciding that the history and planner forms may offer every activity rather than only previously-used
ones. That is a product call, not a caching optimisation.

→ **Frontend action: none. Keep the per-source cache entries.** Deliberate, not an oversight.

## Two things the answer surfaced that the ask did not

**A. The third route is `planner-task`, not `task-planner`.** `EntityRoute => "planner-task"`
(`FormSelectOptionsPlannerTaskEndpoint.cs:11`), matching `dayPlanner/api/plannerTaskApi.ts`. The enum
value is interpolated straight into the URL, so `ActivityOptionsSource.TASK_PLANNER = 'task-planner'`
would have 404'd. Latent only because nothing passes that member as a `selectOptionsSource` yet — it
would have fired the first time the planner picker was wired, which is A8/A9 territory.

→ **Fixed.** The member is now `PLANNER_TASK = 'planner-task'`, with a comment saying why.

**B. `taskPriorityOption` and `routineTimePeriodOption` are hard-coded `null` on all three sources**
(`BaseActivityFormSelectOptionsEndpoint.cs:62-63`) — literally `= null` in the object initializer, with
no subclass hook to fill them.

Confirmed live from the frontend side: the matrix is the **only** feed for both dropdowns.
`filterActivityFormSelectOptions` derives `taskPriorityOptions` / `routineTimePeriodOptions` from
nothing else, and no consumer populates them separately. So:

- the priority select revealed by "from to-do list" is **always empty**;
- the period select revealed by "from routine to-do" is **always empty**;
- `ActivitySelection.taskPriorityName` and `routineTimePeriodName` (the names A6 started exporting
  through the `selection` model) are **always `''`**, because `nameOf` looks them up in those lists.

A preselected `taskPriorityId` / `routineTimePeriodId` is not lost — `pruneSelectionsMissingFromOptions`
deliberately does not prune those two — but the user can neither see nor change it.

There was a **second, worse half** the ask did not anticipate. `filterActivityFormSelectOptions` also
filtered on those two fields when narrowing the role, category and activity lists:

```ts
(!formData.taskPriorityId || combination.taskPriorityOption?.id === formData.taskPriorityId)
```

With a priority selected and `taskPriorityOption` always null, that reads `undefined === 3` — false for
every row. So a form arriving with a preset `taskPriorityId` (an edited history record from a to-do
task) emptied **all three** dropdowns at once, not just the priority one.

**Neither half needs a backend change.** `/task-priority/all-options` and `/routine-time-period/all-options`
already exist and already have frontend API composables (`todoList/api/taskPriorityApi.ts`,
`todoList/api/timePeriodApi.ts`).

→ **Fixed.** Both lists are now their own cache kinds in `activityOptionsStore`, fetched through
todoList's `api/` composables (cross-module via `api/`, the sanctioned direction). The two dead filter
predicates are gone, and `ActivitySelectOptionCombination` documents why the two fields must never be
filtered on again. The lookups are skipped entirely when `showFromToDoListField` is false, so the
to-do and planner dialogs stay at the single request A7 got them down to. Nothing invalidates them —
todoList's crud is not wrapped — which is noted in the store as a deliberate trade.
