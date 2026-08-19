# S1 · Goal-gradient progress bars

- **Scope:** both list kinds (shared base component)
- **Backend:** none — frontend only
- **Model / effort:** Sonnet 5, low–medium effort
- **Research:** Kivetz, Urminsky & Zheng (2006, *JMR*) — goal-gradient and endowed-progress effects

---

```
Add visible progress indicators to the todo list, implementing the goal-gradient /
endowed-progress effect (Kivetz, Urminsky & Zheng 2006): effort accelerates as visible
completion approaches.

Two levels:
1. Per item, in src/core/todoList/component/BaseTodoListItem.vue — a thin determinate
   progress bar along the bottom edge of the VListItem when the item has real substructure:
   either isMultipleCount (doneCount/totalCount) or steps.length > 0 (fraction of
   steps where isDone). Items with neither get no bar. Reuse the existing `accentColor`
   computed for the bar color so it matches the priority accent stripe.
2. Per list — a progress summary in the VCard header of both
   src/core/todoList/view/TodoListView.vue and view/RoutineToDoListView.vue:
   "7 / 12" plus a VProgressLinear. Count completed vs total across the *unfiltered*
   `items` ref, not `displayedItems`, so filtering doesn't distort progress.

BaseTodoListItem.vue is generic over IBaseToDoListItem and shared by
NormalTodoListItem.vue and routine/RoutineTodoListItem.vue — change it once, verify both.
Note it keeps local `isDone` / `doneCount` / `localSteps` refs synced by watchers; derive the
bar from those locals so it animates instantly on click before the API round-trip.

Keep it subtle: 3px, no labels on the item-level bar. New strings go in
_locales/todoList.{sk,en}.ts. Run `npm run type-check` and `npm run lint`.
```
