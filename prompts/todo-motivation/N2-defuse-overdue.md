# N2 · Defuse the overdue guilt pile ⭐

- **Scope:** normal todo list
- **Backend:** none — frontend only
- **Model / effort:** Opus 5, high effort — the code change is small but it is a visual-design and tone judgment in two languages, which is exactly where a weaker model produces something technically correct and motivationally wrong
- **Research:** Sirois & Pychyl (2013) — procrastination as short-term mood repair; Sirois (2014) — self-compassion reduces, guilt increases procrastination

---

```
Fix a motivational anti-pattern in the normal todo list. Sirois & Pychyl (2013) show
procrastination is short-term mood repair — you avoid the task because looking at it feels
bad — and Sirois (2014) found self-compassion REDUCES later procrastination while guilt
INCREASES it. The current UI manufactures guilt.

Current state: the `dueDateChip` computed in
src/core/todoList/component/normal/NormalTodoListItem.vue (~line 79) gives every overdue
item a red 'error' chip AND a triangle-exclamation VIcon in the `#post-chips` slot. Ten
overdue items becomes a wall of red the user avoids opening.

Change:
1. Overdue items get ONE quiet signal, not two. Drop the triangle icon; soften the chip
   toward a muted/neutral treatment. Reserve strong color for today/tomorrow, where it is
   actionable, rather than for the past, where it is only reproach.
2. Add a single "renegotiate" banner at the top of view/TodoListView.vue when overdue
   count >= 3: one line plus three actions — reschedule all to today, push all by a week,
   review one by one. `useTodoListFilters.ts` already exposes filterDueState 'overdue',
   which the review action can just switch on. Use the existing bulk/update paths in
   api/todoListItemApi.ts; add no endpoints.
3. Wire every destructive-ish action through the existing undo system
   (composable/useTodoListUndo.ts, pushEditUndo) as the other flows do.

Wording must be matter-of-fact and non-judgmental in both SK and EN — no "you failed",
no warning iconography. Strings in _locales/todoList.{sk,en}.ts.
```
