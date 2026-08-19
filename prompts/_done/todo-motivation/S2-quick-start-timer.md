# S2 · One-tap "start 10 minutes"

- **Scope:** both list kinds (shared base component)
- **Backend:** none — frontend only
- **Model / effort:** Sonnet 5, medium effort (needs discovery of the existing timer path)
- **Research:** task-initiation cost as the procrastination bottleneck; Steel (2007) — the *Delay* term in Temporal Motivation Theory

---

```
Lower task-initiation activation energy: the bottleneck for procrastination is starting,
not persisting. Add a one-tap timer start directly on each todo item row.

Today, time logging is buried in the overflow VMenu — `actions` array in
src/core/todoList/component/BaseTodoListItem.vue (~line 234) emits `logTime`, which both
TodoListView.vue and RoutineToDoListView.vue route to
component/BaseTodoListLogTimeController.vue via `openLogTime`.

Change: promote a visible play/stopwatch VIconBtn onto the row itself (next to the overflow
menu), which starts a running timer immediately with no dialog and no duration prompt.
The commitment is to the timer, not the task. Prefill duration from the item's
`suggestedTime` when set, else default to 10 minutes.

Inspect BaseTodoListLogTimeController.vue's `open(activityId, activityName, isManual, ...)`
signature first — there is already a non-manual (running timer) path; use it rather than
adding a parallel mechanism. Check src/core/activityTracking/ for an existing running-timer
store before creating state.

Hide the button while isInChangeOrderMode. Applies to both list kinds through the shared
base component. Strings in _locales/todoList.{sk,en}.ts.
```
