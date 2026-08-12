# A8 · Quick-create resolves its role by English display name

- **Scope:** `src/core/activity/composable/quickCreateActivityComposition.ts`, its 4 consumers
- **Backend:** yes — **this prompt writes its own contract ask** as its last step (see the end)
- **Model / effort:** Sonnet 5, medium — small surface, but it is a live time bomb and the fix has a server-side half.
- **Depends on:** A1 (item 8 cleans two lines in this file)
- **Unblocks:** nothing

---

```
composable/quickCreateActivityComposition.ts resolves which role a quick-created activity belongs to
by fetching it by its English display name over HTTP:

  export type QuickCreateActivityRoleName = 'Routine task' | 'To-do list task' | 'Planner task'

  async function getQuickCreateActivityRoleIdByView() {
    return await API.get('/activity-role/by-name/' + viewName).then(...)
  }

The union type is passed down as the `viewName` prop of ActivitySelectOrQuickEditFormField, from four
call sites:

  core/todoList/component/normal/ToDoListItemDialog.vue
  core/todoList/component/routine/dialog/RoutineToDoListForm.vue
  core/dayPlanner/component/BasePlannerTaskDialog.vue
  core/dayPlanner/component/settings/RepeatingTaskDialog.vue

and it is also rendered to the user — ActivitySelectOrQuickEditFormField.vue:11 interpolates it into
`activities.quickCreateActivityWithRole` ("Rýchle vytvorenie aktivity s roľou \"{role}\""). So the
Slovak UI currently prints an untranslated English role name inside a Slovak sentence.

Four things are wrong and they compound:

1. **It breaks the moment roles are localized or renamed.** The lookup key is a display string. If a
   Slovak user renames their "To-do list task" role — which the settings UI fully permits, there is no
   protection on it — every quick-create from the to-do dialog starts failing.
2. **It fails silently-ish.** The `.then` chain has no catch. A 404 rejects, the axios interceptor
   shows a generic error snackbar, and the user sees their quick-created activity simply not appear.
   There is no message that says what actually happened.
3. **One extra round trip per quick-create**, every time, for a value that changes approximately never.
4. **The display string and the lookup key are the same string**, so they cannot be changed
   independently — which is exactly what fixing 1 requires.

=== The fix, in two halves ===

**Half A — frontend, do this regardless.** Separate identity from display:

  - Replace the string union with an enum in dto/enum/, e.g. `SystemActivityRole { ROUTINE_TASK,
    TODO_LIST_TASK, PLANNER_TASK }`, carrying a stable key — not a display name.
  - The four call sites pass the enum member.
  - The label shown to the user comes from the locale file
    (`activities.systemRole.routineTask` etc., SK + EN), not from the enum value.
  - Cache the resolved role id — this is a per-session constant. If A7 has landed, put it in the
    activity options store; if not, memoize in the composable module scope and invalidate on role
    mutation.
  - Add an explicit failure path: if the role cannot be resolved, show a specific snackbar
    (`activities.systemRoleMissing`) and do not attempt the create. Right now a failed lookup produces
    a rejected promise inside `quickCreateActivity` and the caller's
    `execAndReturnStatus` returns undefined, which ActivitySelectOrQuickEditFormField's consumers
    treat as "user cancelled".

**Half B — the backend ask, which you write at the end.** The stable key has to exist server-side for
the enum to mean anything: a system key on activity roles, and a lookup that does not go through the
display name.

Ship Half A first, against the existing by-name endpoint — keep the enum→English name mapping in one
private constant in the composable, clearly marked as the temporary bridge, so swapping in the real
lookup later is a one-line change and the four call sites never learn about it.

**Then, as your final step, write `prompts/activity/backend/A8-backend.md`.** Write it after the
frontend is working, not before — the contract should describe what your implementation actually needs
to call, in the exact field names and casing your `fromJson` will read.

Rules for that file, matching the other modules' backend asks
(see `prompts/activity-history/backend/B1-group-ids.md` for the house format):

  - **Contract only.** Endpoint, method, route, request shape, response fields with types and
    nullability, in the JSON casing the frontend reads. No entities, no EF, no migrations, no opinion
    on how the value is stored or seeded — the .NET solution is not in this repo and anything past the
    contract is a guess dressed as a spec.
  - State the problem before the ask, with the concrete live failure (renaming a role breaks
    quick-create from four dialogs).
  - Say what the frontend will do with it, and what it does in the meantime.
  - Cover the case the backend has to answer that you cannot: whether these three roles are seeded per
    user, whether a user can delete one, and what the endpoint returns if they have.
  - Include the enum values you chose, so the two sides agree on the key strings.

=== While you are here ===

`quickEditActivity` (line 34) PATCHes to `/activity/{id}/Overwrite` or `/activity/{id}/Clone` with the
mode as a PascalCase path segment, typed as an inline `'Overwrite' | 'Clone'` union repeated in three
files (this composable, ActivitySelectOrQuickEditFormField.vue:108, and its quickEditModeItems). Make
it a real enum in dto/enum/ and import it in all three. Do not change the wire format — that is a
backend contract and B1 does not cover it.

Verify: quick-create an activity from all four dialogs, in both SK and EN, and confirm the role label
in the switch reads in the current language. Rename the "To-do list task" role in
/activity-settings/roles and confirm quick-create still works (this is the regression test for the
whole prompt — it fails today). `npm run type-check` (baseline 72) and `npm run lint`.
```
