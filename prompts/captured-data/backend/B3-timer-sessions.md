# B3 · Backend ask — a timer session as one unit of history, with how it ended

**Contract only.** This asks for a way to write several history rows as one session in a single request, for that session's identity and outcome on the
row response, and for a rows-or-sessions answer on each endpoint that counts rows. How a session is stored, and whether it is an entity at all, is the
backend's decision.

> Written 2026-09-29 from `prompts/captured-data/C5-timer-sessions.md`, after its frontend half shipped. That half records every Pomodoro phase as it actually
> ran, and records how every countdown and Pomodoro ended, in the running-timer store (`src/core/activityHistory/store/runningTimerStore.ts`,
> `TimerOutcome` and `PomodoroSegment`). It also settles the rounding rule (`store/pomodoroSessionLog.ts`). None of it reaches the server, because a
> row has nowhere to put it. The `TODO(B3)` markers are at the two save sites.

---

## The problem

**A Pomodoro is written as two rows that are both wrong about time.** `PomodoroTimerView.vue:314` (`saveActivity`) sums every focus period into one
row against the focus activity. It sums every break into a second row against the rest activity, when the user picked one. Both rows are dated at the
moment Start was pressed. On the day's timeline (`POST /activity-history/filter` → `HistoryTimeline.vue`), a two-cycle session therefore renders as a
100-minute block and a 25-minute block **starting at the same instant and overlapping**. Neither shows when anything happened. The two creates are
also two independent fire-and-forget `POST /activity-history` calls, so one can land without the other and nobody is told.

**How it ended is thrown away.** The client now knows, for every countdown and Pomodoro, whether it:

- ran its plan to the end,
- was stopped early, or
- stopped because the app was closed across a phase boundary. It stops at the first missed boundary and does not replay the cycle (`reconcile()` in the
  store).

"Sessions finished vs. abandoned" is one of the few procrastination signals this app can measure directly. `ActivityHistory`
(`AdhdTimeOrganizer.History/domain/model/entity/ActivityHistory.cs`) has `StartTimestamp`, `Length`, `EndTimestamp`, `TodoListItemId` and
`RoutineTodoListId`, and no session and no outcome. Neither does `ActivityHistoryRequest` or `ActivityHistoryResponse`.

**The fix the client cannot do alone.** The fix is one row per phase, each at its real start. Written as N unrelated rows, that would break every surface
that counts rows: one sitting would read as eight "entries" everywhere (see *Counting* below). The rows have to arrive **as a group the server knows
about**. The client will not fake the grouping with a note field or a local map of row ids. It will not fake atomicity with compensating deletes either.

## The business rules

Each rule states what the client assumes. Correct any that are wrong, and the client follows your answer.

1. **A session is one sitting with one timer**: a Pomodoro (N rows) or a countdown (exactly one row). A stopwatch session never ends on its own and has no
   outcome, so it keeps saving the way it does today and is not a session. Manual entries and desktop/web tracking are not sessions either.
2. **Written all-or-nothing.** Either every row of the session is created, or none is and the request fails. A partial session must be impossible to
   observe.
3. **The outcome belongs to the session, not to a row.** There are three values, and the client decides which, from what its store saw:
   - `Completed`: the plan's final boundary was reached. For a countdown this includes one that ran out while the app was closed, because the whole set
     duration is what gets logged either way.
   - `StoppedEarly`: Stop was pressed before the plan was done.
   - `RanOutWhileAway`: Pomodoro only. The app was closed across a boundary that was not the last, so the session ended there.

   The server stores what it is told. It does not derive the outcome from the rows, and it cannot: a focus period cut short by Stop and one that ran its
   length look the same once rounded.
4. **The planned and completed focus-period counts are the session's too**: "stopped after 2 of 4". The client sends both for a Pomodoro and null for a
   countdown. `completedFocusPeriods ≤ plannedFocusPeriods`.
5. **Each row keeps every existing row rule.** B17's "Length must be positive" applies **per row**. The client never sends a zero-length part: it
   apportions whole minutes so that each activity's rows sum to the rounded total the save dialog quoted, and it drops a part left with zero minutes
   (`apportionMinutes` / `planPomodoroRows`). Please confirm the per-row rule rather than a per-session one. The activity-ownership check that
   `CreateActivityHistoryEndpoint.BeforeMapping` does applies to every row's activity.
6. **Rows may overlap by less than a minute.** Lengths are whole minutes (`IntTime`), and starts are exact instants. Rounding a phase up can push its
   `EndTimestamp` up to 59 seconds past the next phase's start. The client assumes this is accepted. If you would rather it clamp, say so.
7. **Editing a row keeps it in its session.** The existing `PUT activity-history/{id}` stays row-level and does not touch the session's outcome or counts.
   Those describe what the timer did, not what the rows now say. The client builds no session-level editing.
8. **Deleting a row removes it from its session. Deleting the last row removes the session.** A session with no rows never appears on any read. The
   client assumes no session-level delete endpoint is needed now.
9. **Rows written before this lands have no session**, and every reader treats such a row as a session of one. That is how they render today, so nothing
   old changes meaning.
10. ~~**Embedded timers stay single rows.** When `TrackTimeDialog` is opened for a planner task or a to-do item, the timer emits one total, and the
    embedder writes one row linked to the task (`TodoListItemId` / `RoutineTodoListId`). That path is unchanged, so the session request needs **no** task
    link.~~
    > **Corrected 2026-10-03 — both halves were wrong.** No path ever sent the link: the client's `ActivityHistoryRequest` carried only
    > `startTimestamp`, `length` and `activityId`, so every row landed unlinked and the daily recap (`GET todo-list-item/daily-recap`, which sums by
    > `TodoListItemId` alone) showed every item at zero time (`docs/feature-discovery/F2-half-built-backend.md`, "Out of scope" #1–2). And embedded timers
    > no longer stay single rows. Since `f522b0c9` (OP6) a timer or Pomodoro in `TrackTimeDialog` saves through `POST /activity-history/session`
    > (`createTracked` in `activityHistoryApi.ts`), so the session request **does** carry the link. The server already accepted it
    > (`CreateActivityHistorySessionRequest.TodoListItemId` / `RoutineTodoListId`, same rules as the row request). A stopwatch is still one row, linked
    > the same way. Editing a row keeps its link: `ActivityHistoryRequest.UpdateEntity` deliberately does not write either field, so the edit form's
    > link-less `PUT` cannot unlink it.

## The shape the frontend needs

### Writing a session

A new route; its name and method are yours. The client sends:

```json
{
  "kind": "Pomodoro",
  "outcome": "StoppedEarly",
  "plannedFocusPeriods": 8,
  "completedFocusPeriods": 2,
  "records": [
    { "activityId": 7, "startTimestamp": "2026-09-29T08:00:00.000Z", "length": { "hours": 0, "minutes": 25 }, "phase": "Focus" },
    { "activityId": 9, "startTimestamp": "2026-09-29T08:25:00.000Z", "length": { "hours": 0, "minutes": 5 },  "phase": "ShortBreak" },
    { "activityId": 7, "startTimestamp": "2026-09-29T08:30:00.000Z", "length": { "hours": 0, "minutes": 25 }, "phase": "Focus" },
    { "activityId": 7, "startTimestamp": "2026-09-29T08:55:00.000Z", "length": { "hours": 0, "minutes": 12 }, "phase": "Focus" }
  ]
}
```

- `kind`: `"Pomodoro" | "Timer"`.
- `outcome`: `"Completed" | "StoppedEarly" | "RanOutWhileAway"`, never null. `RanOutWhileAway` is only valid with `Pomodoro`.
- `plannedFocusPeriods`, `completedFocusPeriods`: `int`, both non-null for `Pomodoro` and both null for `Timer`.
- `records`: at least one; exactly one for `Timer`. Sent in start order.
  - `phase`: `"Focus" | "ShortBreak" | "LongBreak"` for a Pomodoro row, null for a Timer row. It is why a row appears as focus or a break when the
    session is expanded. The rest activity may be the same activity as the focus one, so the activity alone cannot say.
- Enum values are sent in the PascalCase the API uses, as `ScheduleTimerAlarmsRequest` already does.

The response is `201` with `{ "sessionId": <long>, "recordIds": [<long>, …] }`, with `recordIds` in `records` order. The client needs the ids only to
confirm that the whole set landed. It shows one success snackbar, or one error snackbar, for the whole session.

Errors:

- `400` validation, with no `errorType` (`B18`), for a malformed session: zero records, a Timer with ≠ 1 record, an outcome not valid for the kind,
  inconsistent counts, or any row failing an existing row rule.
- `404` on the offending field for an unowned activity, as the single create does today.

The client has no branch for a 409, and none is expected.

### Reading rows

`ActivityHistoryResponse` gains two fields. They matter most on `POST /activity-history/filter`, which the timeline reads:

```json
{
  "id": 501, "startTimestamp": "…", "length": { … }, "endTimestamp": "…", "activity": { … },
  "phase": "Focus",
  "session": {
    "id": 88,
    "kind": "Pomodoro",
    "outcome": "StoppedEarly",
    "plannedFocusPeriods": 8,
    "completedFocusPeriods": 2
  }
}
```

- `session`: **nullable**. It is null for every row written outside a session, which includes all rows written before this lands (rule 9). The same
  object repeats on each row of the session, so the timeline can group without a second request.
- `phase`: nullable. It is null for rows outside a session and for a Timer row.

`HistoryTimeline.vue` groups a day's rows by `session.id` into one unit. That unit shows the span (first row's start to last row's end), the focus total
(the sum of `Focus` rows) and a quiet outcome line, and it expands to the phases, each still a `HistoryRecordItem` with its own edit/delete. The
Detail CSV export gains a session column from the same field. That needs no further server work.

## Counting: rows or sessions?

Splitting one Pomodoro into up to fifteen rows changes every number that counts rows. Below is every place a row count reaches the client. **Please answer
each one: rows or sessions?** The client's recommendation comes first, then what each answer would do.

**1. `POST /activity-history/aggregate-by-activity`, `entryCount`** (`AggregateByActivityActivityHistoryEndpoint.cs:53`)
- The client divides `totalSeconds` by `entryCount` to get a task's typical actual time (`ActivityLoggedTimeAggregate.averageTime`, and
  `useEstimateCalibration.ts:40,57` for the "you usually take" chip and the calibration ratio). This is not "sums, probably unaffected".
- **Rows**: a four-period Pomodoro of reading counts as four 25-minute entries. The typical time drops to a quarter, and the calibration then tells the
  user they overestimate.
- **Sessions (recommended)**: count the distinct sessions with at least one row of that activity, with each session-less row counting as one.

**2. Both pie charts, `items[].entries` and `totals.totalEntries`** (`HistoryPieChartBuilder.cs:51`, `:83`, `:93`)
- These feed the insight sentences (`useHistoryInsights.ts`: "about {mean} each", "the most broken up", "your longest stretches"). They are also shown as
  "Entries" / "Total entries" (`HistoryPieChartSection.vue:71`, `:87`) and exported as the Summary CSV's entry column (`HistorySummaryView.vue:314`).
- **Rows**: a focused morning of Pomodoros becomes the most broken-up activity in the period. It is the exact opposite of what happened, and this is the
  insight most likely to be silently wrong.
- **Sessions (recommended)**: count the distinct sessions that touch the group. A session whose focus and rest activities land in two groups then counts
  once in each, so `Σ items[].entries` may exceed `totalEntries`, which should count each session once. The client never sums `entries` across all
  groups. It sums them across the insight's candidate groups, where counting a sitting's rest separately from its focus is correct. The `_other` roll-up
  may double-count the same way, and the client does not read it for insights.

**3. `POST /activity-history/dashboard/calendar`, `sessionCount`** (`CalendarActivityEndpoint.cs:71`)
- This is rendered as "N sessions" in each calendar cell (`HistoryDayCellContent.vue:32`).
- **Rows**: one Pomodoro morning reads "15 sessions" under a field literally named `sessionCount`.
- **Sessions (recommended)**: for a session that crosses the user's midnight, count it on each day it has a row, the same way its seconds already land.
  Say if you would rather count it on its first day only.

**4. `summary/time-of-day`, `hours[].entries`** (`HistorySummaryTimeOfDayEndpoint.cs`)
- There is no client reader. `HistoryTimeOfDayHour.ts` documents that it must not be used as a record count.
- **No preference**. Rows are fine. The seconds per hour become *more* accurate with no change, because breaks and later focus periods now land at their
  real hours instead of at the session's start.

**5. Summary cards and stacked bars** (`HistorySummaryCardsBuilder.cs`, both stacked-bars endpoints)
- These are sums only, so no change is expected. Please confirm that nothing there counts rows.

**6. The daily recap** (`TodoListItemLoggedTimeSource`)
- This sums by the task link. Routed Pomodoros carry no link, and the embedded path stays one linked row (rule 10). No change is expected; please confirm.

**7. The heartbeat's contiguous-window extension** (`ActivityHistoryTimeAttributionSink.cs:32-40`)
- This is not a count, but it rewrites rows. A desktop heartbeat window that starts exactly at an existing row's `EndTimestamp`, for the same activity,
  extends that row.
- **Extending a session row**: the last focus row of a Pomodoro silently grows past what the timer measured, and the session's row no longer matches its
  own outcome.
- **Excluding session rows from the probe (recommended)**: the tracked stretch becomes its own row after the session.

## What changes on the frontend once this lands

- `PomodoroTimerView.saveActivity` makes one request built from `planPomodoroRows(session)` and `pomodoroOutcomeSummary(session)`, which already exist
  and are tested, and shows one snackbar. The overlapping pair and the fire-and-forget calls go away.
- `TimerView.finishSession` saves a one-row `Timer` session carrying its outcome.
- `ActivityHistory.ts` gains `session` and `phase`, with enums through `convertToEnum`.
- `HistoryTimeline.vue` groups rows by session: collapsed to span + focus total + outcome line, expandable to phases. Rows without a session render
  exactly as today.
- Nothing is re-counted client-side. Every number in *Counting* stays the server's.
- Deliberately not built: a finished-vs-abandoned statistic. The data will exist and be visible per session. An aggregate is a separate decision, with its
  own sample-size rules (`prompts/_done/activity-history/H10-insights.md`).

## How the client will verify

Live, against the e2e seed, with `playwright-cli -s=c5`, and with no mocking:

1. Run a Pomodoro on `/activity-history/pomodoro` to its end: 1-minute focus, 1-minute rests, 2 periods, 1 cycle, with a rest activity. Save it. The
   request is one call and returns one `sessionId` and three `recordIds`. Detail timeline for today: one session, three phases at their real minutes,
   no overlap, outcome `Completed`, "2 of 2".
2. Run another and press Stop during the second focus period. It shows the rows that ran and `StoppedEarly`, "1 of 2".
3. Summary insights for today say the same kind of sentence as before these runs, not a new "most broken up" one, and the calendar cell for today counts
   two sessions for the two runs.
4. A plain timer run to the end and one stopped early: each is one row, with a `Timer` session carrying `Completed` and `StoppedEarly` respectively.
5. Delete one phase row: the session remains with the rest. Delete the others: the session is gone from the read.
6. Clean up by deleting the created rows, or reseed.
