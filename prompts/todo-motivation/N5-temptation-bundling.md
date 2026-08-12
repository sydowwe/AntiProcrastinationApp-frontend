# N5 · Temptation bundling with the leisure module

- **Scope:** normal todo list × `leisure`
- **Backend:** yes — needs a pairing field on the todo item
- **Model / effort:** Opus 5, high effort — cross-module design under the strict `api/`+`dto/`-only import rule, plus a backend contract to specify. Cheapest place to get the architecture wrong.
- **Research:** Milkman, Minson & Volpp (2014, *Management Science*) — temptation bundling raises follow-through on should-do activities

---

```
Implement temptation bundling (Milkman, Minson & Volpp 2014, Management Science): pairing a
want-to activity with a should-do activity raises follow-through on the should-do. This app
is unusually well positioned for it because it already owns a `leisure` module —
src/core/leisure/ — that most todo apps have no equivalent of.

Goal: let a normal todo item be paired with a leisure activity, so completing the task
surfaces the paired leisure item as an earned, immediate follow-on.

STEP 1 — feasibility, do this before writing UI. Read src/core/leisure/api/ and
src/core/leisure/dto/ to see what a leisure item actually is and whether it can be
referenced by id. Then confirm TodoListItemEntity / ToDoListItemRequest
(src/core/todoList/dto/) have no field for a pairing. They do not today, so this needs a
backend field (e.g. pairedLeisureId) on the todo item. Do not simulate the pairing in
sessionStorage.

STEP 2 — once the field exists:
- An optional "pair with" VIdSelect in normal/ToDoListItemDialog.vue, options from the
  leisure api.
- A small chip in NormalTodoListItem.vue's `#pre-chips` slot showing the pairing.
- On completion (the isDoneChanged path in view/TodoListView.vue), a non-blocking snackbar
  or card offering the paired leisure activity.

Cross-module import is allowed ONLY via leisure's api/ or dto/ per CLAUDE.md — never its
component/, composable/ or store/. Strings in _locales/todoList.{sk,en}.ts.

FINALLY — since the pairing field almost certainly does not exist yet, do STEP 2 as far as
the missing field allows (DTO shape, dialog field, chip, completion hand-off, locales) and
then write the backend ask to prompts/todo-motivation/backend/N5-backend.md.

CONTRACT ONLY. That file states just two things: which existing todo item endpoints must
carry the new field (create, update, and the read responses the frontend already consumes)
and the field itself, with type and nullability, in the JSON naming the frontend fromJson
will read.

Do NOT specify entities, EF or migrations, FK relationships, cascade behaviour, or
validation rules. Those are the backend agent's decisions. Write what the frontend consumes,
nothing about how it is stored. If the field already existed, do not create the file — say
so instead.
```
