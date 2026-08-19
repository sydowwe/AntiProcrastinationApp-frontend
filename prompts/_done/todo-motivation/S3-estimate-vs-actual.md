# S3 · Estimate-vs-actual calibration

- **Scope:** both list kinds
- **Backend:** likely — starts with a feasibility check, may stop and report
- **Model / effort:** Sonnet 5, medium effort (bump to Opus 5 if the aggregation design turns out to be non-trivial)
- **Research:** planning fallacy (Kahneman & Tversky; Buehler, Griffin & Ross); informational vs controlling feedback (Deci & Ryan)

---

```
Counter the planning fallacy (Kahneman & Tversky; Buehler et al.) with informational
feedback rather than rewards: show the user how their own time estimates compare to reality.

Data already exists on both sides: `suggestedTime: Time | null` is on both
TodoListItemEntity and RoutineTodoListItemEntity (dto/response/), and actual durations are
logged into the activityHistory module keyed by activity.

FIRST: determine whether an endpoint can return aggregate logged time per activity. Look at
src/core/activityHistory/api/ and src/core/historyDashboard/api/. Do not fabricate
client-side aggregation over a full history fetch.

If the data is reachable, build:
- On an item with both a suggestedTime and prior logged time for that activity, a small
  tonal chip: "~30m / usually 50m".
- A calibration line in the todo list header: "your estimates run about 1.6x" once there
  are >= 5 comparable items.

Framing must be neutral and informational, never scolding — the goal is calibration, not
guilt. Cross-module access is allowed ONLY via activityHistory's api/ or dto/ per CLAUDE.md;
never import its components, composables or store.

FINALLY — if the aggregate was not reachable, finish every frontend piece that was possible
without it, then write the backend ask to prompts/todo-motivation/backend/S3-backend.md.

CONTRACT ONLY. That file states just two things: the endpoint the frontend needs (method,
route, request shape) and the DTO fields it consumes, with types and nullability, in the
JSON naming the frontend fromJson will read. Here that is aggregate logged time per
activity.

Do NOT specify entities, EF or migrations, storage, indexes, how the aggregate should be
computed, or any business rule. Those are the backend agent's decisions. Write what the
frontend consumes, nothing about how it is produced. If no backend change was needed, do not
create the file — say so instead.
```
