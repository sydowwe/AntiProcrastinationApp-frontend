# N1 · Schedule-first (implementation intentions) ⭐

- **Scope:** normal todo list
- **Backend:** none — frontend only
- **Model / effort:** Opus 5, high effort — this one is mostly judgment about *where* to put pressure in an existing UI, and it touches three files that must stay coherent
- **Research:** Gollwitzer & Sheeran (2006) meta-analysis, 94 studies, d ≈ 0.65 — the largest single effect in this whole set

---

```
Implement implementation intentions in the normal todo list. Gollwitzer & Sheeran's 2006
meta-analysis (94 studies, d ~= 0.65) found that committing to a specific when/where beats
mere intention by a wide margin. This is the single strongest known intervention here, and
the app already has all the pieces — they're just buried.

Current state: TodoListItemEntity has `dueDate` and `dueTime`, and
src/core/todoList/component/normal/NormalTodoListItem.vue declares a `moveToList`
additionalAction while "addToPlanner" sits inside the shared overflow VMenu in
BaseTodoListItem.vue. Scheduling is therefore a buried, optional afterthought.

Reframe unscheduled as the incomplete state, not the default:
1. In NormalTodoListItem.vue's `#pre-chips` slot, render a muted, clickable "not scheduled"
   chip when the item has no dueDate. Clicking it opens the planner dialog directly —
   TodoListView.vue already has `openAddToPlanner(item)` calling
   plannerStore.openCreateDialogWithActivity(...). Wire to that; do not build a new dialog.
2. Add a header nudge in view/TodoListView.vue: "3 tasks have no time slot" with a button
   that opens the first unscheduled one. Only show it when count > 0 and the list has
   more than a couple of items.
3. A due DATE alone is a deadline, not an implementation intention. When the user sets a
   due date in normal/ToDoListItemDialog.vue, make the time field prominent rather than
   optional-looking, so "Tuesday 09:00" is the natural output.

Do NOT add nagging modals or block any flow. Strings in _locales/todoList.{sk,en}.ts (SK
primary). Run `npm run type-check` and `npm run lint`.
```
