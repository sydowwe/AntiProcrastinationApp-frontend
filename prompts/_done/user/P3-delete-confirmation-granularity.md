# P3 · One boolean governs five deletes with wildly different blast radii

- **Scope:** `../../../src/core/user`, five delete call sites in `todoList`, `dayPlanner`, `historyDashboard`
- **Backend:** likely, if the preference gains values — see below
- **Framework:** none
- **Model / effort:** Opus 5, high effort. Small diff, and getting the default wrong destroys user data.
- **Depends on:** U1. Do not start this before the hydration bug is fixed — you would be tuning a preference that is not being read.

---

```
`askBeforeDelete` is a single global boolean, and it sits in front of five deletions that are not
remotely comparable:

    core/todoList/view/TodoListsView.vue:313          delete a LIST — takes its items with it
    core/todoList/composable/useTodoListCategories.ts:66   delete a CATEGORY — takes its lists?
    core/dayPlanner/view/TemplateListView.vue:507     delete a plan TEMPLATE — reusable, reconstructing
                                                      it is real work
    core/dayPlanner/component/DayPlanner.vue:92       delete a planner ENTRY — one task, one day
    core/historyDashboard/component/HistoryTimeline.vue:170   delete a HISTORY entry — a record of
                                                      something that actually happened

A user who turns the preference off to stop being nagged about single planner entries has also turned
it off for "delete this list and everything in it". That is the whole problem: the preference is
asked once, in a context-free settings page, and applied everywhere.

Read all five call sites before deciding anything. Establish, per site, what is actually destroyed —
follow `deleteEntity` into the module's api composable and see whether children cascade. Do not
assume; two of these look like leaf deletes and are not.

ALSO READ WHAT ALREADY EXISTS. `_common/composable/general/useUndoStack.ts` is a bounded (10) LIFO of
undoable actions, and this app already uses it in five places — `core/todoList/composable/
useTodoListUndo.ts`, `core/dayPlanner/composable/{usePlannerCrud,usePlannerKeyboard,
usePlannerPointerInteractions}.ts`, and both planner views. The planner already lets you undo a
delete. The list views do not. That asymmetry is more of the answer than a better dialog is.

THE SHAPE TO AIM FOR

Confirm on consequence, not on preference:

  - A delete that CASCADES (takes children with it) always confirms, and the dialog says how many
    children — "delete this list and its 14 items?" — regardless of the preference. A user cannot
    meaningfully consent to a number they were not shown, and no preference should be able to switch
    that off. This is the one place you should overrule the setting.
  - A delete that is a LEAF and is UNDOABLE honors the preference, and when the preference says
    "don't ask", shows an undo affordance instead of a dialog. Undo is strictly better than a
    confirm: it costs nothing when you meant it and recovers you when you did not.
  - A delete that is a leaf and is NOT undoable honors the preference as it does today.

Implement it as a small helper in `src/core/user/composable/` — extend the `useUserPreferences()`
U1 created, or add `useDeleteConfirmation()` beside it — exposing something like
`shouldConfirm({ cascades, undoable })`. It must live in `core/user` and be imported by the five
sites, not reimplemented five times. It reads the preference through U1's defaulted accessor, never
through `currentUser` directly.

Then the settings control. Do NOT ship a matrix of checkboxes; that trades one bad default for six.
Either keep the single switch and relabel it honestly (it now means "ask before deleting single
items" — the cascade case is not covered by it and the label must not imply otherwise), or make it
three values (always / only when something is lost / never) if and only if you can express all three
in one sentence of Slovak that a user understands without a tooltip. Recommend one, implement it,
and put the reasoning in your summary.

THE DEFAULT IS THE DECISION

Whatever you build, an absent or unknown preference must land on "ask". U1 established that; do not
undo it. Confirm your change preserves it by clearing localStorage and deleting a list.

If you widen the preference beyond a boolean, `askBeforeDelete` changes type on both sides of
`/user/preferences`. That is a contract change: write
`prompts/user/backend/B<n>-delete-confirmation-preference.md` per `prompts/user/backend/README.md`
with the new value set, the migration semantics for existing rows (what `true` and `false` become),
and the server-side default. Do the frontend work first and keep it working against the boolean until
the backend answers — do not ship a client that sends a value the server will reject.

Add undo to the list deletes that lack it only if `useTodoListUndo.ts` makes it cheap. If it turns
out to need real work in another module, that is out of scope: leave those sites on the confirm path,
and say in your summary which sites would benefit and roughly what it would take. Do not restructure
`core/todoList` from a `core/user` prompt.

Run `npm run type-check` and `npm run lint`. Verify all five paths by hand, with the preference on and
off, and confirm the cascade case still asks when the preference is off.
```
