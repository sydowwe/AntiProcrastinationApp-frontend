# Bugs to investigate

> Collected 2026-10-04 from the F1 feature-discovery pass (`docs/feature-discovery/F1-journey-gaps.md`, *Out of scope*) ·
> frontend `5944d9c8` · backend `cde16f8` (clean).
>
> **Nothing here was reproduced in a running app.** F1 was a reading pass. Each entry says how far it was checked, gives a
> way to confirm it, and suggests a direction for the fix. Ordered by impact, highest first.

## Status — 2026-10-04

Every entry was re-checked against the code and held. Fixed, uncommitted at the time of writing. The backend
side needs two migrations applied by hand (`PlannerTaskAutoCompleteAtEnd`, `PlannerTaskCarryOver`) and an API restart:

| # | Outcome |
|---|---|
| 1 | **Fixed (backend).** The heartbeat resolves the user's zone; `IActivityTimeAttributionSink.TotalSecondsOnDayAsync(DateOnly)` became `TotalSecondsBetweenAsync(fromUtc, toUtc)`; `ActivityTimeRecordedEvent` carries the user's `Day` plus the window's local start/end. Pinned by `ExtensionActivityTrackingTests.Heartbeat_AfterTheUsersMidnight_DrivesTheUsersTodayNotUtcs`. |
| 2 | **Fixed (backend).** Deterministic pick (window-containing block, else earliest), `ApplyStatus`, actual times on the user's clock, `SyncForPlannerTasksAsync`. *Decided:* time tracked anywhere in the day counts toward a block, but **once** — a completed same-activity block claims everything tracked up to its end, so a second block only sees time after it (the sink now counts ledger rows by overlap, pro rata). *Also found, not fixed:* the to-do fan-out (`TodoListItemIsDoneChangedEventHandler`) completes planner tasks without actual times. |
| 3 | **Fixed, option (b).** `POST /planner-task/{id}/carry-over` moves the task forward and keeps `OriginalDate` / `CarryOverCount`; the banner uses it and now offers the last **week's** open tasks (`GET /planner-task/carry-over-candidates`), not only yesterday's. Blocks show "N×" when carried over; the calendar's trend line reports carry-overs separately from "never happened". Correction to the entry: carry-over never *broke* the streak — yesterday's open task had already broken it at midnight; the copy failed to *repair* it, where a skip does. |
| 4 | **Fixed.** Picker-booked rest is created with the user's Optional (666) importance, so it never counts toward the streak (*decided*). "Do it now" blocks are also created `autoCompleteAtEnd` and a five-minute Planning job closes them when their slot ends. Correction: the select-options endpoint returns only `{id, text}`; the id comes from `GET /task-importance`. |
| 5 | **Fixed.** Reschedule sends `date` and clears `calendarId`; verified in the app by rescheduling into 2028. |
| 6 | **Fixed.** `usecase.md` and the `usePlannerNowNext` comment describe the banner as it is. |
| 7 | **Fixed** with #1. |
| 8 | **Decided and fixed:** neither owns the other's date. `dueDate` is the user's deadline and the planner never writes it any more; "scheduled" is read from the planner as `nextPlannedSlot` (Core seam `ITodoListItemPlanSource`, implemented in Planning). The item shows a "planned" chip beside the deadline chip, and "not scheduled" means neither. Items already stamped by the old code keep their date. |

Found along the way, and fixed:

- **A `Date` sent as a `DateOnly` lands a day early on a UTC host.** `PlannerTaskRequest.date` and `CalendarFilter.from/until`
  serialised as UTC instants (`2026-10-03T22:00:00Z` for 4 October in Bratislava); the framework's `DateOnlyJsonConverter`
  resolves those in the *server's* zone. Both now send `YYYY-MM-DD` (`calendarDayOnTheWire.test.ts`). The converter itself
  is unchanged: an instant has no single calendar day, so no server-side fix is correct; the client must send a date.
- **The banner offered skipped tasks** (`isDone` is Completed only), and the copy carried their status and actual start.
- **The banner's Overwrite deleted today's tasks without asking.** It now goes through `useDeleteConfirmation` as a cascade.

Seen, not fixed: the day header's next-day lookup 404s (console error only) on any day whose neighbour has no calendar
row — the same unseeded-day shape as #5.

## Bugs

### 1. Tracked time early in the morning completes yesterday's planner task (backend)

- **Checked:** at code level, end to end.
- **What happens:** the desktop heartbeat works out "the day" as a **UTC** date, but planner days are the user's **local**
  dates. For a Slovak user (UTC+1/+2), time tracked between local midnight and 01:00/02:00 starts or completes
  *yesterday's* planner task for that activity. Every day's total also runs from 01:00/02:00 local to the same time the
  next day.
- **Evidence:**
  - `AdhdTimeOrganizer.Tracking/application/endpoint/desktop/command/DesktopActivityHeartbeatEndpoint.cs:171`:
    `var day = DateOnly.FromDateTime(windowStart);`.
  - `WindowStart` is a `timestamptz` value, so it is UTC
    (`AdhdTimeOrganizer.Tracking/application/dto/request/DailyWindowMaskRequest.cs:57-62`).
  - `AdhdTimeOrganizer.History/application/seam/ActivityHistoryTimeAttributionSink.cs:64-65` sums the day as a half-open
    **UTC** range.
  - `AdhdTimeOrganizer/application/eventHandler/ActivityTimeRecordedEventHandler.cs:64` matches it against
    `pt.Calendar.Date == day`, which is a local date.
  - Every other "today" in Planning goes through the user's zone (`TaskPlannerHelper.TodayIn`; Planning `domain-map.md` §
    *Which "today" — the user's, everywhere*). This path is the exception.
- **Confirm it:** add a case to `ActivityTimeAutomationTests`, the way
  `CompletionFanOutTests.TogglingTodoItem_UsesTheUsersOwnDayBoundary` moves the test user onto a zone whose date
  differs from UTC's.
  1. Put a planner task on local date D.
  2. Post a heartbeat at a UTC instant that falls on D−1 UTC but on D locally.
  3. Expect D's task to change. Today it won't.

  Run it with `./scripts/test.ps1 -Class '*ActivityTimeAutomation*'`. The integration tests use their own Postgres, so
  running them is safe while the app is under the debugger.
- **Fix direction:**
  - In the heartbeat endpoint, resolve the user's zone (`IUserTimeZoneResolver`, as `GetDashboardTodoListItemEndpoint`
    does) and derive the local day from `windowStart`.
  - Change `IActivityTimeAttributionSink.TotalSecondsOnDayAsync` to take a `[fromUtc, toUtc)` instant range, the same
    shape as `TodoListItemLoggedTimeSource`, so the caller supplies the user's day.
  - Any future publisher of `ActivityTimeRecordedEvent` (Android sync, timers; see F2-01 and F2-02) must use the same
    rule.

### 2. Tracker-driven planner automation skips the status rules (backend)

- **Checked:** at code level.
- **What happens:** when tracked time completes or starts a planner task, the handler assigns `Status` directly. That
  causes four problems:
  - **No actual times are recorded.** A tracker-completed task is "unmeasurable" in the plan-vs-actual trend: it counts
    as planned, with no actual minutes.
  - **Its reminder is never re-synced.** A completed task's reminder therefore stays registered. Today this is latent,
    because no client creates reminders (notification audit, R1). It becomes visible the moment audit N1 lands.
  - **The task is picked arbitrarily** when two open tasks for the same activity share a day.
  - **Time outside the block counts toward it.** The whole day's tracked total is compared with one task's planned
    duration.
- **Evidence:**
  - `AdhdTimeOrganizer/application/eventHandler/ActivityTimeRecordedEventHandler.cs`:
    - `:78` sets `plannerTask.Status = …` instead of calling `PlannerTask.ApplyStatus`.
    - The method writes no `ActualStartTime` / `ActualEndTime` and makes no `SyncForPlannerTasksAsync` call.
    - `:61-67` uses `FirstOrDefaultAsync` with no `OrderBy`.
    - `:75-76` compares `TotalSecondsOnDayAsync` against `EndTime − StartTime`.
  - The rule it breaks is in `AdhdTimeOrganizer.Planning/docs/summary.md`, the gotcha on `Reminder.RemindAt`: "Any write
    path that moves a task's time or changes its status must call `SyncForPlannerTasksAsync`".
- **Confirm it:** in `ActivityTimeAutomationTests`:
  - assert that a tracker-completed task has actual times, and that its `ReminderDefinition` is cancelled;
  - seed two open tasks for one activity on one day and check which one moves.
- **Fix direction:**
  - Choose the task deterministically: prefer the one whose span contains the window's local time, otherwise the earliest
    by `StartTime`.
  - Go through `ApplyStatus`.
  - Set `ActualStartTime` on `NotStarted → InProgress`, and `ActualEndTime` on completion, both in the user's zone (this
    needs bug 1's zone resolution).
  - After the save, call `IReminderRegistrationService.SyncForPlannerTasksAsync([task.Id])`. The host handler can
    resolve it, because it references every slice.
  - Whether time outside the block should count at all is a product decision.

### 3. Carrying a task over from yesterday breaks yesterday's streak (frontend)

- **Checked:** at code level.
- **What happens:** the day view's "Not completed yesterday" banner **copies** each open task into today, so yesterday's
  original stays `NotStarted`. That has four effects:
  - **Yesterday can no longer count for the streak.** A day only counts when every qualifying task is `Completed`, and
    only `Cancelled` leaves the count.
  - **The trend records a miss.** The original also lands in the plan-vs-actual trend as "never happened".
  - **The copy is unlinked.** Nothing connects it to the original.
  - **Skipping beats carrying over.** Skipping the task instead would have kept the streak, so the user is rewarded for
    giving up on a task rather than keeping it.

  The banner also looks only at yesterday. Tasks from two or more days ago never surface.
- **Evidence:**
  - `src/core/dayPlanner/component/normal/OverdueTasksBanner.vue`:
    - `:80-91` only fetches yesterday, and only while today is being viewed;
    - `:109-134` calls `createWithResponse` on a copy and never touches the original.
  - `AdhdTimeOrganizer.Planning/application/service/taskPlanner/PlannerStreakReader.cs:44-45,51`: the qualifying
    predicate and the `Cancelled` count.
- **Confirm it:**
  1. Plan two tasks yesterday and complete one.
  2. Carry the other over from the banner. The flame drops.
  3. Redo it, but skip the task instead of carrying it. The flame holds.
- **Fix direction:**
  - **(a) Frontend-only, now:** *move* the original instead of copying it. Use the PUT `DayPlannerView.handleReschedule`
    already does (`DayPlannerView.vue:497-499`), with today's calendar and a slot. That fixes the streak penalty, but the
    record that the task slipped is lost.
  - **(b) Properly:** F1-03's carry-over command, which moves the task and keeps `OriginalDate` / `OriginalStartTime`.
    It is a backend change.

### 4. Rest booked from the leisure picker breaks the planner streak (frontend)

- **Checked:** at code level.
- **What happens:** "Do it now" and "Plan for later" create a planner task with no importance. The streak counts every task
  that isn't background, optional or skipped, so a rest block the user doesn't tick as done makes the next day's streak
  read 0. "Do it now" even starts the task as `InProgress`, and nothing ever completes it.
- **Evidence:**
  - `src/core/leisure/composable/useLeisureCommitment.ts:82-89` builds the request with no `importanceId`.
  - `PlannerStreakReader.cs:44-45` excludes only the optional marker (importance 666, `TaskImportance.OptionalMarkerValue`).
- **Confirm it:**
  1. Complete everything else on today's plan.
  2. Commit a suggestion with "Do it now" and don't tick it.
  3. Tomorrow, the flame has reset.
- **Fix direction:**
  - Send the user's optional-importance id at commit time. It is the `TaskImportance` row whose importance is 666,
    available through `GetSelectOptionsTaskImportanceEndpoint`.
  - Or decide on the server that picker-booked blocks never qualify for the streak.
  - Either way, it is a product call whether rest should ever count toward the streak.

### 5. Rescheduling to a date with no calendar row fails (frontend)

- **Checked:** at code level. **Unverified:** which accounts lack the rows.
- **What happens:** the day view's bulk *Reschedule* looks up the target day with the by-date read, which 404s when there
  is no calendar row. The whole action then fails before any task is moved. The server would have created the day itself
  if the client had sent `date`.
- **Evidence:**
  - `src/core/dayPlanner/view/DayPlannerView.vue:491` calls `fetchCalendarByDate`.
  - `src/core/activityHistory/api/calendarApi.ts:24-25` is the by-field read; the comment at `:35` says it 404s.
  - `UpdatePlannerTaskEndpoint` accepts `date` and provisions the day (Planning `domain-map.md` § *Lazy day creation*).
- **When it bites:**
  - `CalendarSeeder` seeds this year and next (`CalendarSeeder.cs:28-31`), so for any account any date from the year
    after next onward fails.
  - Accounts created while the seeder still hard-coded `{2025, 2026}` (its own comment, `:22-23`) may have **no 2027
    rows**. If so, rescheduling into 2027 fails for them from January. I found `SetupDefaults` runs at user setup, and did
    not establish whether anything re-seeds existing accounts.
- **Confirm it:**
  - Reschedule a task to a date in 2028; that fails for any account.
  - For the 2027 case, query `planning.calendar` for an older account's 2027 rows.
- **Fix direction:**
  - Send `request.date` instead of `request.calendarId`, as the leisure commit already does
    (`useLeisureCommitment.ts:84`). The validator requires exactly one of the two.
  - Drop the lookup.

## Doc bugs

### 6. `planner-day/usecase.md` misdescribes the overdue banner

- `docs/views/planner-day/usecase.md:69` and `:79` say the banner covers *today's* tasks "whose window passed while still
  `NotStarted`".
- The code shows only *yesterday's* open tasks (bug 3).
- The comment at `src/core/dayPlanner/composable/usePlannerNowNext.ts:105-108` leans on the doc's reading. As a result,
  today's missed blocks get no prompt anywhere in the day view; F1-01 is the feature that would fill that gap.

### 7. The attribution sink's comment claims a match that isn't there

- `ActivityHistoryTimeAttributionSink.cs:60` says its UTC day range matches `TodoListItemLoggedTimeSource`.
- That source does not compute a day at all. It takes instants from its caller (`TodoListItemLoggedTimeSource.cs:15,34`),
  and the daily recap passes the user's own day (TodoLists `domain-map.md`: "The recap's day is the user's day").
- Fix the comment along with bug 1.

## Design question (not a bug yet)

### 8. A planner task made from a to-do writes its date into the item, once

- Creating a planner task from a to-do item sets the item's `dueDate` and `dueTime` to the block's
  (`src/core/todoList/view/TodoListView.vue:465-468`).
- Moving or snoozing the block later does not update the item. A missed block therefore makes the to-do overdue as well,
  and a snoozed block leaves the item's `dueTime` stale.
- Decide which of the two owns the date. If the planner does, the move paths need to update the linked item: a
  cross-slice event, like `PlannerTaskIsDoneChangedEvent`.

## Not bugs any more (don't chase these)

- **F2 *Out of scope* #4 (duplicate repeating-task suggestions).** Settled: the endpoint excludes activities already on
  the day (`GetSuggestionsRepeatingPlannerTaskEndpoint.cs:57-65`). F2 has been corrected.
- **F2 *Out of scope* #1 ("to-do and routine time is never linked to its item").** Fixed by the OP6 follow-up:
  `ActivityHistoryRequest.ts:13,15` and `ActivityHistorySessionRequest.ts:43-44` carry both links.
- **F2 *Out of scope* #2 (unverified: "editing a history row may drop its link").** Fixed by `5f97385d`.
  `ActivityHistoryRequest.UpdateEntity` deliberately writes neither link
  (`AdhdTimeOrganizer.History/application/dto/request/ActivityHistoryRequest.cs:52`).

F2 has been corrected for all three (#1, #2, and the F2-06 / F2-02 lines that depended on #1).
