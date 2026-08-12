# R1 · Backend ask — streak freeze

**Contract only.** This states the endpoint the frontend calls and the fields it reads, nothing about
storage. Entities, EF configuration, migrations, how the streak is recalculated, when the budget
refills, what happens when it is exhausted and whether a freeze counts toward the completion rate are
all the backend agent's decisions, not requests made here.

Intent, one line: **a freeze preserves the streak across a missed period.**

## Where it hangs

The streak the UI actually renders lives on the **time period** (`RoutineTimePeriodEntity` — `streak`,
`bestStreak`, `streakThreshold`, `completionHistory`), not on the individual routine item, and the
heatmap is drawn per time period. So the budget below is a field on the time period, and the frozen
flag is a field on a `completionHistory` entry.

(`RoutineTodoListItemEntity` also carries `streak` / `bestStreak` / `lastCompletedAt`, but no surface
displays a freeze at item level, so nothing is asked for there.)

## The endpoint

| | |
|---|---|
| Method | `POST` |
| Route | `/routine-todo-list/time-period/{timePeriodId}/streak-freeze` |
| Request body | `{ "periodStart": string }` — ISO-8601, matching the `periodStart` of the `completionHistory` entry being covered |

`periodStart` identifies which elapsed period the freeze is spent on; the frontend only ever sends one
that is already present in the `completionHistory` it was served.

**Response:** the updated time period — the same JSON shape already returned inside
`GET /routine-todo-list/grouped-by-time-period`, with the recomputed `streak`, the decremented
`freezesRemaining` and the covered entry now flagged `isFrozen: true`. The frontend re-reads it through
the existing `RoutineTimePeriodEntity.fromJson`.

## Fields consumed

Added to the time period object (already carrying `streak`, `bestStreak`, `streakThreshold`,
`completionHistory`, …):

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `freezesRemaining` | integer | **yes** | Freezes the user can still spend right now. `null` means "this server does not do freezes" — the frontend then hides every freeze affordance. Send a number, including `0`, once the feature exists. |
| `freezeBudget` | integer | yes | The full per-refill allowance, shown as context ("2 per period"). |
| `freezeBudgetResetsAt` | string (ISO-8601) | yes | When the budget next refills, shown as "refills Mar 3". Omit or `null` if there is no fixed refill date. |

Added to each entry of `completionHistory` (already carrying `periodStart`, `periodEnd`,
`completedCount`, `totalCount`):

| Field | Type | Nullable | Notes |
|---|---|---|---|
| `isFrozen` | boolean | no — absent is read as `false` | The period was covered by a freeze. Rendered as a distinct third heatmap state, neither completed nor missed. |

## What the frontend does with them

- `freezesRemaining === null` → the entire feature is invisible. Nothing is faked client-side.
- `freezesRemaining > 0` **and** the most recent elapsed period fell below `streakThreshold` and is not
  already `isFrozen` → offers a one-tap "cover the miss" that POSTs to the endpoint above. This is
  retroactive by design: the user should not need foresight to protect a run.
- `isFrozen` on a history entry → the third heatmap state, in both the compact grid
  (`RoutineGroupHeatmap.vue`) and the calendar in the history dialog (`RoutineGroupHistoryBody.vue`).

## Already shipped on the frontend

All of the above is written and merged behind the `freezesRemaining === null` gate, so nothing appears
until the server sends the fields:

- `PeriodCompletion.isFrozen` and the three budget fields on
  `src/core/todoList/dto/response/routine/RoutineTimePeriodEntity.ts`
- the third heatmap state in both heatmaps
- `spendStreakFreeze()` in `src/core/todoList/api/routineTodoListApi.ts`
- `src/core/todoList/component/routine/RoutineStreakFreeze.vue` (budget chip + cover-the-miss action)
  and `src/core/todoList/composable/useStreakFreeze.ts`
- SK + EN strings under `routineTodoList.freeze.*` and `routineTodoList.heatmapFrozen`

## Note on an existing field

`RoutineTimePeriodEntity` already carries `streakGraceDays`, and `RoutineTodoListItem.vue` uses it to
tint the flame while a grace window is open. That is a *time-based* leniency (finish late, keep the
run); a freeze is a *budgeted* one (skip entirely, keep the run). Whether the backend wants to keep
both, or fold grace days into the freeze budget, is a backend call — the frontend consumes them
independently today and will keep working either way.
