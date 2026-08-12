# B1 · Backend ask — stable ids on dashboard group items

**Contract only.** This states the fields the frontend reads, nothing about storage. Entities, EF
configuration, migrations, indexes and how the aggregate is computed are the backend agent's decisions,
not requests made here.

No frontend work is blocked on this in the sense of "nothing shipped" — the dashboards work today. What
does not work is correctness of grouping, described below.

## The problem

Every group-shaped response in the history dashboard identifies a group by its **display name only**:

| DTO | File | Identifying field |
|---|---|---|
| `HistoryPieChartItem` | `src/core/historyDashboard/dto/response/HistoryPieChartItem.ts` | `name: string` |
| `HistorySummaryCard` | `src/core/historyDashboard/dto/response/HistorySummaryCard.ts` | `name: string` |
| `HistoryGroupItem` (stacked-bar segments) | `src/core/historyDashboard/dto/response/HistoryGroupItem.ts` | `name: string` |
| `CalendarActivityRoleSummary` | `src/core/historyDashboard/dto/response/CalendarActivityRoleSummary.ts` | `roleName: string` |

All four are produced by `POST /activity-history/dashboard/{summary,detail}/{stacked-bars,pie-chart,summary-cards}`
and `POST /activity-history/dashboard/calendar`, grouped by the `groupBy` value `ACTIVITY` / `ROLE` / `CATEGORY`.

Activity names are not enforced unique. Two activities called "Reading" are, to this frontend, one group.
Consequences that are live today:

1. Selecting a pie segment or a summary card sets `selectedGroup: string | null` and cross-highlights by
   string equality (`HistorySummaryCards.vue`, `HistoryPieChartSection.vue`). Two same-named activities
   highlight together and their totals are read as one.
2. Any comparison across periods (`percentChange`, `isNew`) is matching by name, so renaming an activity
   reads as "one group vanished, a new one appeared".
3. Drilling from a chart into a filtered view keyed by the group is not implementable at all.

The same gap was already noted from the todo side — see `prompts/todo-motivation/backend/S3-backend.md`,
which asked for a separate id-keyed aggregate endpoint for exactly this reason.

## The ask

Add a stable id to each group item, alongside the existing `name` — do not replace `name`, it is still what
is rendered.

| DTO | New field | Type | Nullable |
|---|---|---|---|
| `HistoryPieChartItem` | `groupId` | integer | see below |
| `HistorySummaryCard` | `groupId` | integer | see below |
| `HistoryGroupItem` | `groupId` | integer | see below |
| `CalendarActivityRoleSummary` | `roleId` | integer | no |

`groupId` is the id of the entity the row was grouped by — the activity id when `groupBy: ACTIVITY`, the role
id for `ROLE`, the category id for `CATEGORY`. It is nullable **only** if the backend already emits rows that
belong to no such entity (e.g. an "uncategorised" bucket for activities with no category). If such buckets
exist, `groupId: null` on them is correct and the frontend will key those by name as it does today; if they
do not exist, the field is non-nullable. State which is the case in the response — the frontend cannot infer
it.

No other change to these DTOs. No new endpoints, no change to any request shape, no change to sort order or
to the existing `topN` / limit semantics.

## What the frontend will do with it

Change `selectedGroup` from `string | null` to the id, key cross-highlighting and period-over-period matching
off it, and fall back to name matching when `groupId` is null. `name` continues to be the only thing rendered.
