# B2 · Backend ask — authoritative nullability for the dashboard responses

**Contract only.** This asks for a statement of fact about existing responses, plus one shape change if the
answer comes back a particular way. No storage, entity or computation decisions are requested.

This one is cheap and it is fixing a live crash, so run it first of the two.

## The live bug

`src/core/historyDashboard/dto/response/CalendarActivityDaySummary.ts` declares:

```ts
public readonly wakeUpTime: Time,   // non-nullable
public readonly bedTime: Time,      // non-nullable
```

and builds them with `Time.fromJson(json.wakeUpTime)`. `Time.fromJson` (`src/_common/dto/dto/Time.ts:17`)
destructures its argument, so **`null` throws a TypeError**. That throw propagates out of `fromJson`, out of
the `data.map(...)` in `getCalendarActivitySummary`, and into the caller's catch — which sets `days = []`.
The user sees an empty calendar month with no error message.

The frontend is being fixed to guard this regardless (`prompts/activity-history/H1-correctness-sweep.md`,
item 1). This ask is about which side is actually wrong.

## The questions

For `POST /activity-history/dashboard/calendar` → each day summary:

1. Can `wakeUpTime` be null? Can `bedTime`? Independently of each other — a day with a recorded wake time
   but no recorded bed time?
2. Are days with no records at all returned as rows with zeroed fields, or omitted from the array entirely?
   The frontend currently assumes every day in the requested range comes back.
3. `label` and `holidayName` are already read as `?? null` — confirm those are genuinely nullable.
4. `dayIndex` — the frontend's `isWeekend` getter tests `dayIndex === 6 || dayIndex === 7`. Confirm the
   convention (1-based Monday? 0-based Sunday?), because that getter is wrong under at least one of them.

For the six `POST /activity-history/dashboard/{summary,detail}/{stacked-bars,pie-chart,summary-cards}`
endpoints, confirm nullability of the fields the frontend currently defaults with `?? null` or `?? 0`, and
say for each whether the default is masking a real null or is dead defensive code:

| DTO | Fields |
|---|---|
| `HistoryPieChartItem` | `color`, `entries` |
| `HistoryGroupItem` | `color` |
| `HistorySummaryCard` | `color`, `percentChange`, `isNew`, `averageSeconds` |
| `HistoryPieTotals` | `totalSeconds`, `totalEntries`, `uniqueGroups` |
| `HistoryPeriodComparison` | all fields |
| `HistoryWindow` | `windowStart`, `windowEnd`, `items` |

## One shape note

`HistoryWindow.windowStart` / `windowEnd` arrive as strings and both history views parse them with a helper
that tries `new Date(str)` and falls back to `new Date(str.replace(' ', 'T'))` — i.e. the frontend is
hedging against two different serializations. State the actual format (ISO 8601 with offset, ISO without
offset, or `yyyy-MM-dd HH:mm:ss`) and whether it is UTC or local. If it is not ISO 8601 with an offset,
making it so is the requested change; the frontend will then drop the fallback parse.

## Deliverable

A written answer, not code. If any answer is "yes, null is possible", the frontend DTOs get the matching
`| null` and the guard — that is app-side work and does not need a backend change. Only the timestamp format
question may require touching a response.
