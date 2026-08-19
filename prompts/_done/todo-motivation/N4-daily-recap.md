# N4 · Daily progress recap

- **Scope:** normal todo list (+ optionally `home`)
- **Backend:** likely — no completion timestamp exists today; expect a stop-and-report
- **Model / effort:** Sonnet 5, medium effort — the investigation is mechanical and the honest outcome may be "here's the backend field you need"
- **Research:** Amabile & Kramer, *The Progress Principle* (2011), ~12,000 diary entries — progress on meaningful work is the strongest driver of inner work life

---

```
Build a small end-of-day recap for the todo list. Amabile & Kramer's progress-principle
research (~12,000 diary entries) found that of all events affecting work motivation, making
progress on meaningful work was the strongest — and people systematically underrate their
own progress because completed items simply vanish from view.

That is exactly what happens here: done items disappear behind the `hideDone` switch in
src/core/todoList/view/TodoListView.vue and are never celebrated.

Build a compact recap card — what you finished today, count plus total time logged, listed
by name — surfaced on the todo list view and/or src/core/home/.

FIRST determine where "completed today" comes from. Check src/core/activityHistory/api/ and
src/core/historyDashboard/api/ for an existing per-day summary endpoint. TodoListItemEntity
carries `isDone` but no completion timestamp, so the todo endpoints alone cannot answer
"finished TODAY". Do not fake it by fetching all history and filtering client-side.

Tone: factual and warm, no scores or streak pressure. Show nothing rather than an empty
state on a zero day — a "you finished 0 things" card is actively demotivating.
Strings in _locales/todoList.{sk,en}.ts.

FINALLY — if the data was not reachable, build every part of the recap that IS possible
(component, layout, locales, wiring behind whatever data you can get) and then write the
backend ask to prompts/todo-motivation/backend/N4-backend.md.

CONTRACT ONLY. That file states just two things: the endpoint the frontend needs (method,
route, request shape) and the DTO fields it consumes, with types and nullability, in the
JSON naming the frontend fromJson will read. Here that is, for a given day, the items
completed and the time logged against them.

Do NOT specify entities, EF or migrations, storage, whether completion is a stored timestamp
or derived, or any business rule. Those are the backend agent's decisions. Write what the
frontend consumes, nothing about how it is produced. If no backend change was needed, do not
create the file — say so instead.
```
