# P5 · Backend ask — batch the calendar view's per-day fan-out

**Contract only.** This states the endpoints and the fields the frontend reads. Entities, EF configuration, migrations,
indexes, transactional boundaries and how conflict resolution is implemented server-side are the backend agent's
decisions, not requests made here. The existing per-day endpoints (`calendar/filter`, `planner-task/filter`,
`calendar/apply-planner-template`, `POST planner-task`, `PUT calendar/{id}`) stay exactly as they are — this asks for
four additional batched entry points, not a redesign of the day-at-a-time ones.

## What already shipped, frontend-only, no backend change

`src/core/dayPlanner/view/PlannerCalendarView.vue` still makes the same four network shapes described below — that
part needs the endpoints below to actually change. What *did* ship without a backend change:

- The cell-content watcher (the per-day task fetch that populates `dayTasksMap`) is now **race-safe**: a request
  generation counter means a slow response from a month the user has since navigated away from can no longer land in
  the map after a newer month's response already has.
- All four fan-out sites (`executeBulkApply`, `executeCopyDay`, `executeBulkDayTypeChange`, and the cell-content
  watcher) now run through a small `settledWithConcurrencyLimit` helper capping in-flight requests at 6, instead of
  opening one socket per day (or per task×day) at once.
- `executeCopyDay` and `executeBulkDayTypeChange` already reported partial failure correctly (this predates P5); no
  change needed there.
- `refresh()` no longer blanks the calendar to `[]` on a transient load failure. It keeps whatever days are already
  on screen and shows a snackbar with a retry action.
- Fixed a locale bug found while touching these exact call sites: every snackbar in this file was resolving
  `dayPlanner.planner.feedback.*`, a key that does not exist in either locale (the module's own strings mount at the
  top-level `planner` namespace, not nested under `dayPlanner`) — vue-i18n was rendering the raw key to the user on
  every one of these snackbars. Corrected to `planner.feedback.*`.

None of that reduces the *number* of requests fired — only the concurrency and the race-safety. The four asks below
are what actually collapses the fan-out.

## 1. Per-day task summary for a date range — the cell-content watcher

**Why the existing endpoints cannot answer it:** `POST planner-task/filter` (`PlannerTaskFilter`) takes one
`calendarId` and a `Time` window; there is no multi-day form. The view currently calls it once per visible day with
`totalTasks > 0` — up to 31 concurrent requests per month, re-fired on every navigation.

What the cells actually render (verified against
`src/core/dayPlanner/component/calendar/CalendarDayCellContent.vue`,
`.../calendar/CellTaskProgress.vue`, and `.../template/MiniTimeline.vue` — the only three consumers of the per-day
task list):

- Completion counts and rate (`day.completedTasks`, `day.totalTasks`, `day.completionRate`) already come from
  `Calendar` itself, via `calendar/filter` — **no change needed there**.
- The tooltip in `CellTaskProgress.vue` lists each task's `startTime`–`endTime` and `activity.name`.
- `MiniTimeline.vue` positions segments from `startTime`, `endTime`, `isBackground`, and colors them from `color`.

Nothing else from `PlannerTask` is read in this path (no `notes`, `location`, `status`, `importance`, etc.) — that is
what makes this a distinct, smaller summary shape rather than the full `PlannerTask` list.

**`POST calendar/task-summaries`**

### Request

| Field   | Type                  | Nullable | Notes                                                    |
|---------|-----------------------|----------|-----------------------------------------------------------|
| `from`  | string, `YYYY-MM-DD`  | no       | Same range the view already sends to `calendar/filter` (`CalendarFilter.from`). |
| `until` | string, `YYYY-MM-DD`  | no       | Same as `CalendarFilter.until`.                          |

### Response

```json
{
  "days": [
    {
      "calendarId": 123,
      "tasks": [
        {
          "id": 456,
          "startTime": { "hours": 9, "minutes": 0 },
          "endTime": { "hours": 10, "minutes": 30 },
          "isBackground": false,
          "color": "#5c2caa",
          "activityName": "Deep work"
        }
      ]
    }
  ]
}
```

| Field                          | Type    | Nullable | Notes                                                                                   |
|---------------------------------|---------|----------|------------------------------------------------------------------------------------------|
| `days`                          | array   | no       | One entry per calendar day **that has at least one task** in the range — days with zero tasks may be omitted, the same filter the frontend already applies (`totalTasks > 0`) before it fetches today. |
| `days[].calendarId`             | integer | no       | Matches `Calendar.id` from `calendar/filter`, so the frontend keys `dayTasksMap` by it exactly as it does today. |
| `days[].tasks`                  | array   | no       | `[]` is fine but such a day should just be omitted per the row above.                   |
| `days[].tasks[].id`             | integer | no       | Used as the Vue `:key` in the tooltip list.                                              |
| `days[].tasks[].startTime`      | object `{ hours, minutes }` | no | Same shape `Time.fromJson` already reads off `PlannerTask.startTime`.               |
| `days[].tasks[].endTime`        | object `{ hours, minutes }` | no | Same shape as `endTime` today.                                                       |
| `days[].tasks[].isBackground`   | boolean | no       | Drives which timeline lane (`MiniTimeline`'s background vs. foreground segments).       |
| `days[].tasks[].color`          | string  | no       | Hex/CSS color, same as `PlannerTask.color` today.                                       |
| `days[].tasks[].activityName`   | string  | no       | Flattened from `activity.name` — the tooltip reads only the name, never the rest of `Activity` (icon, id, etc.), so there is no need to nest a full activity object here. |

**One request replaces up to 31.** The frontend calls this once per date-range change (same trigger as
`calendar/filter` today) instead of once per day-with-tasks.

## 2. Batched apply-template-to-many-days — `executeBulkApply`

**Why the existing endpoint cannot answer it:** `POST calendar/apply-planner-template`
(`ApplyTemplateToTaskPlannerRequest`) takes one `calendarId`. The bulk-apply action bar lets the user select N days
and fires N of these, same `templateId`/`conflictResolution`/`tasksFromTemplate` on every call — only `calendarId`
varies per call.

**`POST calendar/apply-planner-template/batch`**

### Request

```json
{
  "templateId": 7,
  "calendarIds": [123, 124, 125],
  "conflictResolution": "Ignore",
  "tasksFromTemplate": [
    { "startTime": { "hours": 9, "minutes": 0 }, "endTime": { "hours": 10, "minutes": 0 }, "isBackground": false,
      "location": null, "notes": null, "activityId": 3, "importanceId": null, "status": "NotStarted",
      "todoListItemId": null, "skipReason": null, "actualStartTime": null, "actualEndTime": null }
  ]
}
```

| Field                 | Type                                    | Nullable | Notes                                                                                          |
|------------------------|------------------------------------------|----------|--------------------------------------------------------------------------------------------------|
| `templateId`           | integer                                  | no       | Same as today's `ApplyTemplateToTaskPlannerRequest.templateId`.                                  |
| `calendarIds`          | integer[]                                | no       | Replaces the single `calendarId` — one entry per selected day.                                   |
| `conflictResolution`   | string enum: `Ignore` `Overwrite` `MergeIgnore` `MergeOverwrite` | no | Same enum, same semantics, applied identically to every day in `calendarIds`. |
| `tasksFromTemplate`    | `PlannerTaskRequest`[]                   | no       | Same per-task shape as today's field of the same name (`calendarId` on each task is irrelevant/ignored here — it is not day-specific, the day comes from `calendarIds`). |

### Response

The frontend only needs, per `calendarId`, whether that day succeeded — it currently derives a "N/M succeeded"
snackbar from `Promise.allSettled`. Something like:

```json
{ "results": [{ "calendarId": 123, "succeeded": true }, { "calendarId": 124, "succeeded": false }] }
```

| Field                        | Type    | Nullable | Notes                                                        |
|-------------------------------|---------|----------|----------------------------------------------------------------|
| `results`                     | array   | no       | One entry per requested `calendarId`, same length as the request. |
| `results[].calendarId`        | integer | no       | Echoes the input id, so the frontend can attribute a failure to a specific day if it later wants to. |
| `results[].succeeded`         | boolean | no       | Drives the existing partial-failure snackbar (`succeeded`/`total`/`failed` counts, already implemented). |

Partial success (some days conflict, others apply cleanly) is expected and fine — the frontend does not need the
whole batch to be transactional; today's per-day calls are not either.

## 3. Batched copy-day-to-many-days — `executeCopyDay`

**Why the existing endpoint cannot answer it:** the view resolves a source day's tasks once (`planner-task/filter` on
the source `calendarId`), then calls `POST planner-task` — `useTaskPlannerCrud().createWithResponse`, i.e. the plain
entity-create endpoint — once per `(target day, source task)` pair. Twelve source tasks copied to ten selected days is
120 individual `POST planner-task` calls today.

**`POST planner-task/copy-to-days`**

### Request

```json
{
  "sourceCalendarId": 100,
  "targetCalendarIds": [123, 124, 125]
}
```

| Field                | Type       | Nullable | Notes                                                                                     |
|-----------------------|------------|----------|----------------------------------------------------------------------------------------------|
| `sourceCalendarId`    | integer    | no       | The day being copied *from* — the frontend already resolves this via `calendar/fetchByDate` before calling. |
| `targetCalendarIds`   | integer[]  | no       | The selected days being copied *to*.                                                          |

The frontend does **not** send the source day's task list — it already has to resolve `sourceCalendarId` first (to
turn the picked date into an id), so the server re-reading that day's tasks server-side is strictly less work than
what the client does today (fetch source tasks, then re-serialize each one as a create request per target day).

### Response

Same per-target-day success/failure shape as the template-apply batch, so the frontend can reuse one component to
render "N/M succeeded" for both:

```json
{ "results": [{ "calendarId": 123, "succeeded": true }, { "calendarId": 124, "succeeded": false }] }
```

| Field                   | Type    | Nullable | Notes                                                                 |
|--------------------------|---------|----------|--------------------------------------------------------------------------|
| `results`                | array   | no       | One entry per `targetCalendarIds` entry.                                 |
| `results[].calendarId`   | integer | no       | Echoes the target id.                                                    |
| `results[].succeeded`    | boolean | no       | Drives the existing `tasksCopyPartial` / `tasksCopied` snackbar.         |

## 4. Batched day-type update — `executeBulkDayTypeChange`

**Why the existing endpoint cannot answer it:** `PUT calendar/{id}` (`useEntityCommand.updateWithResponse`) updates
one `Calendar` row, built from `CalendarRequest.fromResponse(day)` with only `dayType` overwritten — every other field
on the request is just echoing back what `calendar/filter` already returned for that day. The bulk day-type action
fires one of these per selected day.

**`PATCH calendar/day-type/batch`**

### Request

```json
{ "calendarIds": [123, 124, 125], "dayType": "Vacation" }
```

| Field         | Type                                                              | Nullable | Notes                                                        |
|----------------|--------------------------------------------------------------------|----------|------------------------------------------------------------------|
| `calendarIds`  | integer[]                                                            | no       | The selected days.                                                |
| `dayType`      | string enum: `Workday` `Weekend` `Holiday` `Vacation` `SickDay` `Special` | no  | Same `DayType` enum, same values, as today's `CalendarRequest.dayType`. |

Deliberately **only** `dayType` — none of `CalendarRequest`'s other fields (`label`, `notes`, `weather`, `location`,
`wakeUpTime`, `bedTime`) are touched by this action today (`executeBulkDayTypeChange` only overwrites `dayType` on the
`fromResponse`-cloned request), so a batch endpoint that changes anything else would be doing something the current
per-day calls do not.

### Response

Same per-day success/failure shape as asks 2 and 3:

```json
{ "results": [{ "calendarId": 123, "succeeded": true }, { "calendarId": 124, "succeeded": false }] }
```

## Once these land

Each of `executeBulkApply`, `executeCopyDay`, and `executeBulkDayTypeChange` collapses from an N-request
(or N×M-request) `settledWithConcurrencyLimit` fan-out to a single POST/PATCH, reading `results[].succeeded` in place
of `Promise.allSettled` status. The cell-content watcher's per-day loop in `PlannerCalendarView.vue` is replaced by
one `calendar/task-summaries` call per date-range change, keyed into `dayTasksMap` by `calendarId` exactly as it is
today — the race-safety and concurrency-capping code added in this pass stays as defensive depth for whatever
concurrent fetches remain (there will still be one `calendar/filter` and one `calendar/task-summaries` in flight
together), it just no longer has 31 requests to arbitrate between.
