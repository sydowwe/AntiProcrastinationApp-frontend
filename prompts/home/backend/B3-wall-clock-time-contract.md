# B3 · Backend ask — how does the server interpret a bare `Time` (wall clock, no offset)?

**Contract only.** This asks what the server *means* by the `Time` values the client sends and
returns; it does not ask for a particular column type, conversion site, or storage decision.

## The problem

The client sends wall-clock times as a bare `{ hours, minutes }` object with no offset attached
(`src/_common/dto/dto/Time.ts`). Two sibling endpoints in the same dashboard currently receive that
object under **two different conventions**, which means at most one of them can be right:

- `POST /activity-history/dashboard/detail/stacked-bars` (and `/pie-chart`, `/summary-cards`,
  `/timeline`) gets the user's picked window as-is —
  `src/core/activityHistory/view/HistoryDetailView.vue:234-239` passes `timeFrom` / `timeTo`
  straight into `DetailStackedBarsRequest` (`DateAndTimeRangeRequest.from/to`).
- `POST /activity-history/dashboard/summary/stacked-bars` gets the *same kind of value* converted to
  UTC first — `src/core/activityHistory/view/HistorySummaryView.vue:248-249` wraps both in
  `formatTimeDtoToUtcTimeDto` (`src/_common/utils/DateTimeHelper.ts:84-88`).

That helper is itself suspect regardless of the answer: it converts using dayjs against the fixed
date `2000-01-15`, so it applies the **browser's January (standard-time) offset**, not the offset in
force on the day being queried and not the user's configured zone at all. A user in a DST zone
querying a July range gets a window shifted by an hour; a user whose profile timezone differs from
their device's gets it shifted by the difference.

User-visible consequence today: the summary view's stacked-bar chart can be windowed to a different
hour range than the one the user picked, and its axis labels
(`HistorySummaryView.vue:194-206`, `chartTimeFrom` / `chartTimeTo`, read back off the response with
browser-local field reads) then disagree with the detail view for the same data.

Separately, and this is the reason the question is being asked now: the C1 clock audit changed the
client so that **persisted** wall-clock times are read in the user's configured timezone rather than
the browser's —

- `PatchPlannerTaskStatusRequest.actualStartTime` / `actualEndTime`
  (`src/core/dayPlanner/dto/request/PatchPlannerTaskStatusRequest.ts:7-8`), written from
  `src/core/dayPlanner/component/normal/DayPlannerLogTimeController.vue:117` and from the three timer
  views in `src/core/activityHistory/view/` (`TimerView.vue`, `StopWatchView.vue`,
  `PomodoroTimerView.vue`) via `timeInUserZone(startTimestamp)`.
- Planner task `startTime` / `endTime` (`PlannerTaskRequest`), prefilled from `timeInUserZone()`.

Those now go over the wire as **user-zone wall clock, no conversion**. If the server reinterprets
them (as UTC, or against the request's inferred offset), the audit moved the bug instead of removing
it — and it would be writing wrong hours into history, which no later fix recovers.

## The business rules we are guessing at

Each of these is currently a client-side assumption, not a decision anyone made. Please confirm or
correct; the frontend will follow the answer.

1. When the server receives a bare `Time` on a **command** — `actualStartTime`, `actualEndTime`,
   planner `startTime` / `endTime` — does it treat it as wall-clock time in the user's
   `User.Timezone`, as UTC, or as something it converts? `PlannerStreakResponse` already resolves day
   boundaries in `User.Timezone`, which is why the client assumed the former.
2. Same question on a **query** — `DateAndTimeRangeRequest.from/to` and
   `HistorySummaryStackedBarsRequest.windowStartTime/windowEndTime`. Are these two meant to differ?
   If both are user-zone wall clock, `formatTimeDtoToUtcTimeDto` at
   `HistorySummaryView.vue:248-249` is a live bug and the client deletes it.
3. On the way **back**: `HistoryWindow.windowStart` / `windowEnd` are strings the client parses with
   a `new Date(...)` that falls back to `new Date(str.replace(' ', 'T'))`
   (`HistorySummaryView.vue:219-223`) — i.e. it currently succeeds only because the string has no
   zone designator and is therefore read as browser-local. Are these intended to be zone-less local
   wall clock, or instants? If they are instants, they need a `Z` or an offset; if they are wall
   clock in the user's zone, say so and the client will stop treating them as `Date`s at all.
4. `ActivityHistory.startTimestamp` (`src/core/activityHistory/dto/response/ActivityHistory.ts:14`)
   is parsed as an instant. Confirm it is serialized with an offset — several display sites
   (`HistoryTimeline.vue`, `HistoryRecordItem.vue`) depend on that being true.

## The shape the frontend needs

No new fields are requested. What is needed is a stated convention, ideally one convention:

- For every `Time`-typed request field, whether the server reads it in `User.Timezone`. Naming the
  .NET type it binds to (`TimeOnly` vs `DateTime`) would settle it immediately.
- For every date-time-typed response field, whether it carries an offset. If
  `HistoryWindow.windowStart/windowEnd` are zone-less by design, documenting that is enough — the
  client will keep reading them as wall clock and stop pretending they are instants.

None of this is hot-path; it is a documentation/confirmation ask with at most one endpoint fix
behind it (the summary/detail divergence in rule 2).

## What changes on the frontend once this lands

- If bare `Time` is user-zone wall clock everywhere: `formatTimeDtoToUtcTimeDto` and its one call
  site (`HistorySummaryView.vue:248-249`) are deleted, and the helper can be dropped from
  `_common/utils/DateTimeHelper.ts` — it has no other caller in this app. The `// TODO(B3)` at that
  call site goes with it.
- If it is UTC: the C1 audit's section-A changes need an inverse applied at the four write sites
  named above, and `useUserClock.timeInUserZone` gains a UTC-facing sibling. That is the outcome
  worth knowing about before more history accumulates.
- If `windowStart`/`windowEnd` gain offsets: `parseDate`'s `replace(' ', 'T')` fallback and the
  browser-local `Time.fromDate` reads at `HistorySummaryView.vue:194-206` are replaced by
  `timeInUserZone`, and the deliberately-unmigrated note there is removed.
