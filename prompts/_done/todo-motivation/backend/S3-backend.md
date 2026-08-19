# S3 · Backend ask — logged time aggregate per activity

**Contract only.** This states the endpoint the frontend calls and the fields it reads, nothing about storage. Entities, EF configuration, migrations, indexes and
how the aggregate is computed are the backend agent's decisions, not requests made here.

No frontend work shipped ahead of this one — the feature (an estimate-vs-actual calibration chip and a
"your estimates run about Nx" header line) has no meaningful partial version without real actual-duration numbers, so nothing was built yet.

## Why the existing dashboard endpoints don't cover this

`historyDashboard`'s pie-chart endpoint (`POST /activity-history/dashboard/summary/pie-chart`) already aggregates logged seconds `groupBy: 'ACTIVITY'`, but the
response (`HistoryPieChartItem`) carries only
`name: string` — no `activityId`. Activity names are not enforced unique, so matching that back to a specific `TodoListItemEntity.activity.id` would be unreliable.
This ask is for an aggregate keyed by id.

## The endpoint

|              |                                           |
|--------------|-------------------------------------------|
| Method       | `POST`                                    |
| Route        | `/activity-history/aggregate-by-activity` |
| Request body | `{ "activityIds": number[] }`             |

## The response

A JSON array, one entry per activity id that has at least one logged `ActivityHistory` row — ids with no logged history are simply omitted, not returned with zeros:

| Field          | Type    | Nullable                             |
|----------------|---------|--------------------------------------|
| `activityId`   | integer | no                                   |
| `totalSeconds` | integer | no                                   |
| `entryCount`   | integer | no — always ≥ 1 for a returned entry |

The frontend computes the average itself (`totalSeconds / entryCount`) and compares it against
`TodoListItemEntity.suggestedTime` / `RoutineTodoListItemEntity.suggestedTime` (already on both DTOs, see
`../../../../src/core/todoList/dto/response/TodoListItemEntity.ts` and
`../../../../src/core/todoList/dto/response/routine/RoutineTodoListItemEntity.ts`). No pre-computed ratio or average is needed in the response.

## Scope

One aggregate per activity id across all of that user's logged history — no date range, no grouping by day/week. The frontend requests it for the set of activity ids
currently visible in a rendered todo list (both normal and routine), batched into one call rather than one request per item.
