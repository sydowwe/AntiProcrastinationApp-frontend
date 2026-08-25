# F2 · Backend ask — the cross-day plan-vs-actual trend

**Contract only.** This states the endpoint and the fields the frontend reads. Entities, EF configuration, migrations, indexes, and how the aggregate is computed and
stored are the backend agent's decisions, not requests made here.

## What already shipped, frontend-only, no backend change

The single-day plan-vs-actual block (`component/normal/DayPlannerPlanVsActualBlock.vue`,
`composable/usePlanVsActual.ts`) needed nothing from the backend — `store.tasks` for the viewed day already carries
`actualStartTime`/`actualEndTime` alongside `startTime`/`endTime`, so the drift for *one* day is computed client-side from data already on screen. It shows "Planned
6h 30m · logged 7h 45m" plus how many tasks started late, ran longer, or never happened, and is withheld until the viewed day is materially over.

## Why the trend cannot be answered from what's already fetched

The genuinely useful version of this feature — "your tasks typically run about 20% longer than you plan" — needs many days of history, not one.
`POST planner-task/filter` (`PlannerTaskFilter`) takes one `calendarId` and a `Time`
window; there is no multi-day form, and fetching 30+ days of tasks one calendar at a time to aggregate client-side is exactly the fan-out pattern P5 already asked to
eliminate elsewhere in this module. Nothing under
`../../../../src/core/historyDashboard/api` or `../../../../src/core/activityHistory/api` answers this either — those aggregate
`ActivityHistory` records (free-standing time tracking), not `PlannerTask.startTime`/`endTime` vs.
`actualStartTime`/`actualEndTime` drift, which only exists on planner tasks.

## `POST planner-task/plan-vs-actual-trend`

### Request

| Field   | Type                 | Nullable | Notes                                                                         |
|---------|----------------------|----------|-------------------------------------------------------------------------------|
| `from`  | string, `YYYY-MM-DD` | no       | Inclusive start of the range, same format `CalendarFilter.from` already uses. |
| `until` | string, `YYYY-MM-DD` | no       | Inclusive end of the range.                                                   |

The frontend will call this once per range the trend view shows (e.g. "last 30 days"), not per day.

### Response

```json
{
  "taskCount": 42,
  "plannedMinutes": 3150,
  "actualMinutes": 3780,
  "startedLateCount": 11,
  "ranLongerCount": 18,
  "neverHappenedCount": 4
}
```

| Field                | Type    | Nullable | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
|----------------------|---------|----------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `taskCount`          | integer | no       | Count of tasks the aggregate is built from — the same eligibility rule as the single-day block: non-background, not cancelled, on a day that is materially over, and **not** `Completed`-without-both-actual-times. That last exclusion matters: such a task can contribute planned minutes but never actual minutes, so counting it would report the range as under-run with nothing in the other fields to explain why. It is excluded from every field below. |
| `plannedMinutes`     | integer | no       | Sum of `endTime - startTime` (midnight-wrap aware) across those tasks.                                                                                                                                                                                                                                                                                                                                                                                           |
| `actualMinutes`      | integer | no       | Sum of `actualEndTime - actualStartTime` across the subset of `taskCount` that is `Completed` (which, per the rule above, always carries both actual times).                                                                                                                                                                                                                                                                                                     |
| `startedLateCount`   | integer | no       | Of the tasks counted in `actualMinutes`, how many started later than planned.                                                                                                                                                                                                                                                                                                                                                                                    |
| `ranLongerCount`     | integer | no       | Of the tasks counted in `actualMinutes`, how many ran longer than planned.                                                                                                                                                                                                                                                                                                                                                                                       |
| `neverHappenedCount` | integer | no       | Tasks in `taskCount` that never reached `Completed` on a day that is materially over (`NotStarted`/`InProgress`/`OnHold`). Cancelled tasks are excluded from `taskCount` entirely, not counted here.                                                                                                                                                                                                                                                             |

If `taskCount` is `0` (no eligible tasks in the range, or the range is entirely still in progress / in the future), the frontend renders nothing rather than a
zeroed-out card — same restraint as the single-day block.

## Follow-up ask — one field, so the trend can state a percentage

**Status: the endpoint above has landed and the trend surface is built against it**
(`component/calendar/PlanVsActualTrendLine.vue`, under `CalendarStatsBar` in `PlannerCalendarView`). It shows planned vs. logged minutes for the displayed range plus
the three drift counts. It shows **no percentage**, and that is the one thing the feature is really for — "your tasks typically run about 20% longer than you plan"
is the sentence the research says corrects an estimate.

It cannot be computed from the six fields. `plannedMinutes` spans every task in `taskCount`, including the ones that never happened; `actualMinutes` spans only the
measured tasks. Their ratio is a valid per-task estimation figure **only** when `neverHappenedCount` is `0`, and silently understates the person's pace otherwise.
Showing a number that is wrong most of the time is worse than showing none, so the surface currently shows none.

The fix is the subtotal your own note offered:

| Field                    | Type    | Nullable | Notes                                                                                                                                                                                         |
|--------------------------|---------|----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `measuredPlannedMinutes` | integer | no       | Sum of `endTime - startTime` (midnight-wrap aware) across **exactly** the tasks that `actualMinutes` is summed over — the Completed ones carrying both actual times. `0` when there are none. |

With it, `actualMinutes / measuredPlannedMinutes` is a like-for-like ratio over one population, and the trend can state the percentage with `neverHappenedCount`
still shown beside it as the abandonment figure it actually is. Nothing else is needed; no other field on the response changes.

## Once this lands

The frontend adds a small trend surface (exact placement not yet decided) that reads these six numbers and states, descriptively, how the person's estimates compare
to their logged time over the range — the same "no red, no warning icon" tone as the single-day block. No further backend change is anticipated for that; this
contract is expected to be sufficient.
