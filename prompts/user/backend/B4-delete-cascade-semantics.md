# B4 · Backend ask — what a to-do list category delete actually destroys

**Contract only.** Nothing below implies a table, an FK rule, or where the cascade is implemented.

## The problem

`P3` made delete confirmation depend on the **consequence** of the delete rather than on a global
preference (`src/core/user/composable/useDeleteConfirmation.ts`): a delete that takes children with
it always confirms and the dialog states how many children, whatever the user's `askBeforeDelete`
setting says.

That requires knowing, per delete, whether children go with it. For four of the five sites the answer
is visible from the client. For the fifth it is not:

- `src/core/todoList/composable/useTodoListCategories.ts:66` deletes a category via
  `DELETE todo-list-category/{id}` (`src/core/todoList/api/todoListCategoryApi.ts:10-27`). The
  request takes no reassignment argument and returns no body.
- The client cannot tell whether the lists in that category are **deleted with it**, **orphaned**
  (`TodoListEntity.category` set to `null`), or whether the delete is **rejected** while lists still
  reference it.
- `TodoListsView.vue` reloads both categories and lists afterwards, which is consistent with all
  three.

**User-visible consequence today:** the confirmation dialog for a category with lists in it says
`Do tejto kategórie patrí zoznamov: {count}.` and deliberately stops there — it states the count and
promises nothing about their fate, because we do not know it. If the server deletes those lists, the
dialog is under-warning the user about the largest destructive action in the module. If it orphans
them, the dialog is scaring the user about something harmless and the delete should not be forced to
confirm at all.

## The business rules

Each of these is a guess in the client today. Confirm or correct:

- **What happens to the lists in a category when the category is deleted?** Deleted with it,
  orphaned to no category, or the delete is refused? If it is refused, with what status — and does
  the client get anything it can distinguish from a generic failure?
- **Is that the intended product rule, or an artefact of the FK configuration?** These are different
  questions and the answer to the second does not settle the first. A category reads like a label,
  and labels do not usually destroy what they label — but the current behaviour is what it is, and we
  will follow it.
- **If lists are deleted with the category, does that cascade further to their items?** The list
  delete does (`TodoListEntity.itemCount` is what the list dialog counts), so a category delete would
  destroy three levels. That number is the one worth putting in front of a user.
- **Should deleting a non-empty category be offered at all without a reassignment step?** If the
  answer to the first question is "deleted with it", we would rather ask for a target category than
  ask for a confirmation — but that is a contract addition, so it is your call, not ours.

Same question, second site, cheaper to answer: `DELETE task-planner-day-template/{id}`
(`src/core/dayPlanner/view/TemplateListView.vue:517`) — the client **assumes** the template's
`TemplatePlannerTask` rows go with it and words the dialog that way. Confirm that assumption. If a
template delete leaves orphaned template tasks behind, the copy is wrong and so is the data.

## The shape the frontend needs

Nothing new on the wire if the answer is simply stated — the client already has the counts it needs
(`TodoListCategoryEntity.listCount`, `TodoListEntity.itemCount`, and the template's task list, which
`TemplateListView` loads eagerly for the cards). **An answer in prose is enough to finish this.**

Two cases would need a contract change, and only if you decide they are the right rule:

1. **Deleting a category reassigns its lists.** Then `DELETE todo-list-category/{id}` needs a target
   category (nullable = "no category"), and `useTodoListCategories.ts` grows a picker in the dialog.
2. **A category delete is refused while lists reference it.** Then the client needs to distinguish
   that rejection from a generic 4xx, so it can say "move these 6 lists first" instead of showing the
   interceptor's generic error snackbar.

If the cascade destroys items as well as lists, a single count of the **items** that would be lost —
alongside the existing `listCount` — would let the dialog name the real number. Cold path, one
category at a time, opened only when the user clicks delete; latency is irrelevant.

## What changes on the frontend once this lands

- `useTodoListCategories.ts` — the `deleteCategoryText` computed and the comment above it stop
  hedging. Either the copy states the cascade the way the list and template dialogs do, or the
  `cascades: (category.listCount ?? 0) > 0` flag becomes `cascades: false` and a category delete
  honours the user's preference like the other leaf deletes.
- The `TODO(B4)` comment at that site is removed.
- If the answer is "reassign", the flow gains a picker; if it is "refused", it gains a specific error
  path. Both are small, and both are wrong to build before the answer.
