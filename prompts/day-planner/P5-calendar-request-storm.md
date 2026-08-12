# P5 · The calendar view fires one request per day (and per task, per day, on copy)

- **Scope:** `view/PlannerCalendarView.vue`
- **Backend:** **yes** — emits `prompts/day-planner/backend/P5-backend.md`
- **Model / effort:** Sonnet 5, medium effort — the frontend half is bounded; the honest outcome is partly a backend ask
- **Impact:** a month view is up to 31 parallel requests on every navigation; a bulk copy is *tasks × days* POSTs

---

```
src/core/dayPlanner/view/PlannerCalendarView.vue fans out per-day requests in four places. Reduce
what you can from the frontend, then write the backend ask for what you cannot.

THE FOUR SITES

1. Cell contents — the worst one.
   watch(calendarDays, async days => {
     const daysWithTasks = days.filter(d => d.totalTasks > 0)
     await Promise.all(daysWithTasks.map(async d => {
       const tasks = await fetchPlannerTasks(new PlannerTaskFilter(d.id, d.wakeUpTime, d.bedTime))
       dayTasksMap.value.set(d.id, tasks)
     }))
   })
   One POST per day with any task. A populated month = up to 31 concurrent requests, re-fired on
   every month navigation, with no cancellation — navigate three months quickly and ~90 in-flight
   requests race to write dayTasksMap out of order.
   Note what the cells actually consume: component/calendar/CalendarDayCellContent.vue and
   CellTaskProgress.vue. Check whether they need full PlannerTask objects or only a per-day summary.
   If it is a summary, that is the shape to ask the backend for.

2. executeCopyDay — targetDays.flatMap(day => sourceTasks.map(task => createTaskWithResponse(req)))
   That is tasks × days POSTs in one Promise.allSettled. Twelve tasks copied to ten days = 120
   requests, and the allSettled result is discarded — the snackbar claims success unconditionally.

3. executeBulkApply — one POST to calendar/apply-planner-template per selected day. It does count
   the rejections (good) but still fans out N requests for one user action.

4. executeBulkDayTypeChange — one updateCalendar per day, allSettled result discarded entirely,
   snackbar always claims success.

DO ON THE FRONTEND, NOW
- Make the cell-content watcher cancellable and race-safe: track a request generation (or use an
  AbortController) so a stale month's responses cannot overwrite dayTasksMap for the current month.
  This is a real bug independent of any backend change.
- Stop discarding Promise.allSettled results in sites 2 and 4. Report partial failure the way
  executeBulkApply already does, instead of a blanket success snackbar.
- Cap concurrency on whatever fan-out survives, so a 31-day month does not open 31 sockets.
- refresh() is called without await in several handlers and swallows all errors into an empty
  calendar (`catch { calendarDays.value = [] }`) — a transient failure silently blanks the month.
  Distinguish "no days" from "load failed" and let the user retry.

THEN — write the backend ask to prompts/day-planner/backend/P5-backend.md.
CONTRACT ONLY. State exactly two things: the endpoints the frontend needs (method, route, request
shape) and the DTO fields it consumes, with types and nullability, in the JSON naming the frontend's
fromJson will read. Concretely, that is likely to be:
  - a per-day task summary for a date range, in ONE request, carrying whatever
    CalendarDayCellContent / CellTaskProgress actually render (verify before you write it — do not
    ask for fields nothing displays);
  - a batched apply-template-to-many-days call;
  - a batched copy-day-to-many-days call;
  - a batched day-type update.

Do NOT specify entities, EF or migrations, transactional boundaries, storage, or how conflict
resolution is implemented server-side. Those are the backend agent's decisions. The existing
per-day endpoints and the ApplyTemplateConflictResolution semantics stay as they are — you are
asking for a batched entry point, not a redesign. Note in the file which frontend code already
landed and what changes once the endpoints exist. If some part needed no backend change, say so
rather than padding the ask.

Do not fake a batched endpoint by leaving the fan-out behind a wrapper that pretends to be one call.

Run `npm run type-check` (baseline 72, all app-side in src/core) and `npm run lint` (0 errors).
```
