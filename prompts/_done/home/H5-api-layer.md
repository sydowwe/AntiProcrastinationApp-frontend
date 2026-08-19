# H5 · Route home's requests through the owning modules' api composables

- **Scope:** `../../../src/core/home/component/TodoListWidget.vue`, `RoutineTodoWidget.vue`; possibly `../../../src/core/todoList/api/todoListItemApi.ts`
- **Backend:** possibly — `dashboard-widget` has no stated contract; see the escalation block at the end
- **Model / effort:** Sonnet 5, medium
- **Depends on:** H1 (route fix touches the same files)
- **Unblocks:** H6 (error handling wants one place per request)

---

```
Two home widgets bypass the api layer and call axios with raw URL strings:

  TodoListWidget.vue:100   await API.get('todo-list-item/dashboard-widget')
  TodoListWidget.vue:94    API.patch('todo-list-item/toggle-is-done', { ids: [item.id], forceValue })
  RoutineTodoWidget.vue:182 API.patch('/routine-todo-list/toggle-is-done', { ids: [item.id], forceValue })

Meanwhile src/core/todoList/api/ already owns both of those endpoints:
  todoListItemApi.ts:84       API.patch(`/${url}/toggle-is-done`, { ids: [id], forceValue })
  routineTodoListApi.ts:57    the same for routine items
  routineTodoListApi.ts:31    getAllGrouped() — which RoutineTodoWidget already uses correctly

So the routine widget calls the composable for reading and hand-rolls the URL for writing, in the
same file. Note also the leading-slash inconsistency between the two hand-rolled paths ('/routine-…'
vs 'todo-list-item/…'); one of them is relying on the axios baseURL joining behaviour by luck.

Do this:

1. In TodoListWidget and RoutineTodoWidget, replace every direct `API.*` call with the corresponding
   function from src/core/todoList/api/. Read todoListItemApi.ts and routineTodoListApi.ts first —
   use the existing single-item toggle, do not add a parallel one. Drop the now-unused
   `import { API } from '@/_common/axiosConfig.ts'` from both widgets.

2. `todo-list-item/dashboard-widget` (TodoListWidget.vue:100) has no composable at all. Add one to
   src/core/todoList/api/todoListItemApi.ts — it is that module's endpoint, so it belongs there, not
   in a new home-owned api/ directory. Give it a name that says what it returns rather than where it
   is displayed (the endpoint's own name is display-coupled; the composable's need not be). It
   returns rows parsed by `TodoListItemEntity.listFromObjects`, so type it as
   `Promise<TodoListItemEntity[]>` and do the parsing in the api layer, not in the widget. Compose it
   from the base composables in @/_common/api/ if one fits; a plain typed wrapper is fine if none does.

3. Check whether the same endpoint is called from anywhere else in src/ and repoint those too.

This is ONLY about the api layer. Home importing components out of other modules
(NormalTodoListItem, RoutineTodoListItem, HistoryPieChart, TrackTimeDialog) is an accepted exception
— home is the composition layer. Leave those imports alone and do not raise them.

Do not change request/response shapes, do not add retries, and do not add error handling here — H6
owns that and will wrap these calls once they exist in one place.

--- Verification ---

npm run type-check (≤ 72 errors), npm run lint (0 errors). Then on the home page: both todo widgets
load, ticking an item in each persists across a reload, and the network tab shows the same URLs and
payloads as before.

--- After the frontend work is done: write the backend ask, IF you found one ---

Step 2 makes you the first person to type a signature for `todo-list-item/dashboard-widget`. You may
find you cannot type it honestly, because the endpoint's contract is not stated anywhere: how many
rows it returns, in what order, whether it is already filtered to "upcoming and overdue" (the widget's
own empty text at TodoListWidget.vue:33 claims it is) or whether the client is expected to filter,
and whether `dueDate` is nullable — TodoListWidget.vue:83-85 handles null, which is either correct or
dead defensive code.

If you had to guess at any of that, write it up as a backend ask AFTER the frontend work is finished
and verified. Read prompts/home/backend/README.md for the format and scope rules — you are asking for
a statement of fact about an existing response, plus a shape change only if the answer warrants one —
and write it to prompts/home/backend/Bn-<slug>.md. List each field you guessed at and say what you
assumed, so the backend can confirm or correct it.

If the contract turned out to be discoverable and unambiguous, do not write anything. An ask that
says "please confirm the thing I already confirmed" wastes the backend agent's turn.
```
