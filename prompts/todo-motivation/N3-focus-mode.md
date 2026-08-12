# N3 · "Today: pick 3" focus mode

- **Scope:** normal todo list
- **Backend:** none — frontend only
- **Model / effort:** Sonnet 5, medium effort — well-bounded, one composable plus one view, follows an established pattern in the file
- **Research:** Iyengar & Lepper (2000) — choice overload suppresses action

---

```
Add a focus mode to the normal todo list that counters choice overload (Iyengar & Lepper
2000): long lists suppress action. The app currently offers five priority levels, three
sort modes and two filter axes — that is more decision surface, not less.

Implement in src/core/todoList/composable/useTodoListFilters.ts and
view/TodoListView.vue. That composable already keeps all filter state in vue-router query
params (hideDone, sort, priorities, due) — follow the same pattern exactly so focus mode is
bookmarkable and survives reload.

Behaviour:
- A "Focus" toggle in the header. When on, only user-chosen focus items are shown; everything
  else is hidden, not merely dimmed.
- The user marks up to 3 items as today's focus. Persist the chosen ids in the URL query
  (e.g. focus=12,44,51) — no backend field, no schema change.
- At 3 chosen, further items are not selectable; say so plainly rather than silently
  ignoring the click. The cap IS the feature.
- Reuse the existing `displayedItems` computed as the single filtering funnel; add focus as
  one more stage rather than a parallel code path.
- Mutually exclusive with isInChangeOrderMode, like the other filters.

Strings in _locales/todoList.{sk,en}.ts. Run `npm run type-check` and `npm run lint`.
```
