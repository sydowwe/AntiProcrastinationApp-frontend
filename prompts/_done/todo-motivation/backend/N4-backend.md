# N4 · Backend ask — daily recap of items completed today

**Contract only.** This states the endpoint the frontend calls and the fields it reads, nothing about storage. Whether completion is a stored timestamp or derived,
entities, EF configuration, migrations and how the aggregate is computed are the backend agent's decisions, not requests made here.

## Why the existing endpoints don't cover this

`TodoListItemEntity` (`../../../../src/core/todoList/dto/response/TodoListItemEntity.ts`) carries `isDone` but no completion timestamp, so nothing built on the todo
endpoints alone can answer "finished TODAY" — a long-done item and one completed an hour ago look identical. `activityHistory`'s DTOs (`ActivityHistory`,
`ActivityLoggedTimeAggregate`) key logged time to an `activityId`, not to a
`todoListItemId`, and `historyDashboard`'s day-level aggregates (`CalendarActivityDaySummary`,
`HistorySummaryCard`) group by activity/role/category totals, never by todo-item completion. None of these can produce "which todo items were completed on date X,
and how much time was logged against them."

## The endpoint

|              |                               |
|--------------|-------------------------------|
| Method       | `GET`                         |
| Route        | `/todo-list-item/daily-recap` |
| Query params | `date` (string, `YYYY-MM-DD`) |

## The response

A single JSON object:

| Field                    | Type                                                   | Nullable                       |
|--------------------------|--------------------------------------------------------|--------------------------------|
| `items`                  | array of `{ name: string, timeLoggedSeconds: number }` | no — empty array on a zero day |
| `totalTimeLoggedSeconds` | integer                                                | no                             |

`items[].name` is the display name shown in the recap (the frontend does not resolve an activity id — whatever name the item should read as when the task is later
moved, renamed or deleted, this endpoint supplies it directly). `timeLoggedSeconds` is time logged against that specific completed item, not an activity-wide total.
`totalTimeLoggedSeconds` is the sum shown in the card header; the frontend does not recompute it from `items` client-side, so it need not equal the sum of
`items[].timeLoggedSeconds` if the backend's definition of "logged today" differs at the aggregate level (e.g. it includes time logged against items completed on a
different day).

## Frontend behaviour ahead of this landing

The card (`../../../../src/core/todoList/component/DailyRecapCard.vue`) already exists end-to-end — DTO (`../../../../src/core/todoList/dto/response/DailyRecap.ts`),
fetch (`fetchDailyRecap` in
`../../../../src/core/todoList/api/todoListItemApi.ts`, called with `_silent: true`), and wiring into
`../../../../src/core/todoList/view/TodoListView.vue`. Until this endpoint exists the request 404s, the catch returns `null`, and the card renders nothing — no error
is shown to the user. No other code changes are needed on the frontend once the endpoint ships.
