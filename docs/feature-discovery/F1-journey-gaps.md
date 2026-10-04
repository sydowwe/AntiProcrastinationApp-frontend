# F1. User-journey gaps

> Swept 2026-10-04 · frontend commit `5944d9c8` (working tree dirty: a concurrent session's uncommitted OP16 work in
> `src/core/activityTracking/`, `docs/opportunities.md`, `docs/data-map.md`, `e2e/tests/`, the `src/_common` pointer, and
> the untracked `docs/feature-discovery/`; none of it is cited here) · backend commit `cde16f8`, **clean** (framework
> submodule `892a6f7`).
>
> Inputs read:
> - **Rules and the journey's sources:** `prompts/feature-discovery/_RULES.md`; all fifteen `docs/views/<unit>/usecase.md`
>   plus `_submodule/{notifications,reminders-user,scheduler}/usecase.md`; `docs/views/glossary.md`.
> - **The dedupe set:** `docs/opportunities.md`, `docs/notification-audit.md`, `prompts/captured-data/README.md`, every
>   `prompts/_done/*/README.md`, and targeted greps of `docs/views/_fix-queue{,-log}.md`.
> - **The sibling passes:** `docs/feature-discovery/F2-half-built-backend.md`, and `F4-day-type-periods.md` (which appeared
>   mid-pass), so I could cross-reference them rather than overlap.
> - **Backend:** `CLAUDE.md`, `docs/modules.md`, `docs/claude/slices.md`, `docs/notificationSetup.md`, the Planning
>   `summary.md` and `domain-map.md`, and the TodoLists `domain-map.md`. `docs/architecture.md` was read, but it is a
>   leftover from another solution (the backend `CLAUDE.md` says so), so nothing here relies on it.

## Method

I built the journey from the use cases rather than the screens. It has nine stages: *Plan* covers both the day and the
week, and *Stuck* and *drifting* are one stage.

For each stage I listed what the app does today and traced every claim to code in both repos:
- **Frontend:** the home plan composable and its action menu, the planner's carry-over and reschedule paths, the to-do
  renegotiation, the leisure commit, and the routine review.
- **Backend:** the planner-task entity and status rule, the streak reader, the batched calendar reads, the tracking
  automation handler, the timer-alarm table and the user entity.

Every "nothing does X" below names the grep or file that establishes it. I then dropped three kinds of gap: those whose fix
is frontend-only (listed under *Out of scope*), those the notification audit already owns (N1–N5), and those owned by
`docs/opportunities.md`, F2 or F4.

Six candidates survived. Three of them (Start, Stuck, Recover) sit on the stages the data-map method could not see,
because a missed start leaves no row behind.

One structural finding runs under all six: **the server has no concept of a missed block or of a postponement.**
- "Missed" exists only as a client-side computed value (`useTodayPlan.ts:144-146`).
- "Never happened" exists only in a trend over days that are already over.
- Every way of moving a task overwrites the time it was planned for.

## Journey table

| Stage | What the app does today (evidence) | Gap | Candidate |
|---|---|---|---|
| **Capture**: "I should…" lands somewhere | A to-do item needs an activity, a priority and optionally a list (`TodoListItem.cs:5-12`; `ActivityId` is non-null on `BaseEntityWithActivity`). The dialog quick-creates the activity under the system "To-do list task" role (`todoList.en.ts:13`). There is no capture inbox anywhere: a grep for `inbox\|quickCapture\|brainDump` in both repos finds only the notification inbox. | One-field capture can be built client-side by chaining two existing calls. | frontend-only (*Out of scope* #1) |
| **Plan**: the day and week take shape | **Templates** can be applied with four conflict modes. There are copy-to-days and a day-type batch. The to-do "Not scheduled" chip opens the planner dialog (`TodoListView.vue:380-382`). **Repeating tasks** are only *suggestions*, shown only in the day view's side panel (`DayPlannerView.vue:216,310-333`; `GetSuggestionsRepeatingPlannerTaskEndpoint.cs:67-90`). The Planning glossary says they are "not materialised into planner tasks by anything today" (`domain-map.md:400`). | **Recurring commitments:** "Gym Mon/Wed/Fri 18:00" is never on the plan home shows, so it can never get a reminder (N1 needs a `PlannerTask` row). **Lengths:** a new block's length is whatever the user drags. A to-do's length is its raw estimate, even when the same screen has computed that the user's estimates run 1.6× (`TodoListView.vue:305-309`). | F1-06, F1-05 |
| **Start**: the planned moment arrives | **Alerts:** "Starting in N min" and "Start now" fire as browser notifications, **only in an open home tab** (`useTodayPlan.ts:396-420`). **Actions:** one-tap Start and Track on the NowBar (`TaskActionMenu.vue:32,37`). **Automatic start:** desktop-tracked time on the block's activity auto-starts it (`ActivityTimeRecordedEventHandler.cs:61-79`). **Planned:** audit N1 would deliver the start reminder with the app closed. | After the start moment nothing happens until the block is over. Nobody asks "did you start?" while there is still time to. The server holds the evidence (status, timer alarms, history rows, the tracker ledger), but no code joins it. | F1-02 |
| **Stuck / drifting** | **Home** shows only the *last* missed block, as "Missed — was due 10m ago" (`useTodayPlan.ts:166-177,234-236`). **The day view's now/next** leaves overdue blocks to `OverdueTasksBanner` (`usePlannerNowNext.ts:105-108`). That banner looks only at **yesterday** (`OverdueTasksBanner.vue:80-91`), so on the planner today's missed blocks belong to no surface at all. **Tracking** records where the time went, and nothing compares it with the plan. | A block that keeps sliding looks the same as one that slipped once. Snooze, reschedule, carry-over and to-do renegotiation all overwrite the planned time or due date (`useTodayPlan.ts:343-359`, `DayPlannerView.vue:490-512`, `OverdueTasksBanner.vue:122-124`, `useOverdueRenegotiation.ts:52-56`), and no column records a move (backend grep in F1-03). | F1-03 |
| **Recover**: the day went off plan | Only per-task actions: snooze 15/30/60 min (moves one task, overlap unchecked), extend, and skip with a reason (`TaskActionMenu.vue:49-75`). There is also a bulk reschedule to another date that keeps the clock times (`DayPlannerView.vue:490-512`). | Nothing fits what's left into the time that's left. Each move touches one task and is unaware of the next one. The three modules that place blocks (home snooze, leisure "Do it now", planner carry-over) each place them blind. | F1-01 |
| **Close the day** | **Done today:** the to-do daily recap (`GET …/daily-recap`), and the planner's plan-vs-actual block once the day is over. **Carry-over:** next morning, "Not completed yesterday" offers to **copy** yesterday's open tasks into the same clock slots (`OverdueTasksBanner.vue:109-134`). | A carried task is copied, so the original stays `NotStarted`. It breaks yesterday's streak day (`PlannerStreakReader.cs:44-45,51`: only `Cancelled` leaves the denominator) and counts as "never happened" in the trend. Skipping is rewarded and carrying over is punished. | F1-03 |
| **Review the week** | History summary and insights, the planner month footer with the plan-vs-actual trend and skip summary, routine heatmaps and the weekly fresh-start review (keep / reduce / pause), and the tracking dashboards. | Nothing turns the week into a change to next week's plan. Templates keep the shape they were drawn with: `SourceTemplateTaskId` is written and only ever echoed back (`PlannerTaskResponse.cs:16,81`). The trend is one global number (`PlanVsActualTrendService`). | F1-05 |
| **Rest / reward** | **Booking:** the leisure picker's "Do it now" and "Plan for later" book a planner task (`useLeisureCommitment.ts:68-93`). **Rewards:** the earned-reward strip, built from the daily recap (C2). **End of day:** "You're done for today!" (`home.en.ts:35`). | Booking rest makes it a qualifying streak task, because no importance is sent (`useLeisureCommitment.ts:82-89`). A rest block left unticked therefore breaks the streak. This is fixable client-side. | frontend-only (*Out of scope* #3) |
| **Long gaps**: a week without opening the app | **While away:** P1, P4, P5 and P6 keep sending routine pushes every day (audit producer table). There is no activity signal to gate on: neither `User.cs` nor `BaseUser.cs` carries a last-active field. **On return:** home's to-do widget lists **every** overdue item across all lists (`GetDashboardTodoListItemEndpoint.cs:43-47`, no lower bound). Each list has its own renegotiation banner (`useOverdueRenegotiation.ts:29-35`). The planner carry-over sees only yesterday. Routine streaks are gone. The history first-run probe tells someone idle for over a year that they are new (`historyDashboardApi.ts:101-109`). | No surface answers "I'm back, what now?" in one place. No server read can find the unclosed planner days either: the task summaries carry no status (`GetTaskSummariesCalendarEndpoint.cs:63-74`). F4-01 covers time away the user *marked*; this is the gap nobody marked. | F1-04 |

## Candidates

### F1-01. "Re-plan the rest of today": one tap moves what slipped into the time that's left
- **Moment:** 11:30, after the 10:00 and 11:00 blocks both slipped, when the plan on screen has become a list of things
  the user has already failed.
- **Today:**
  - **Recovery is per task.**
    - *Move later* shifts one block 15/30/60 minutes from now and PUTs it. It checks nothing else on the day, so it can
      land on top of the next block (`useTodayPlan.ts:343-359`, `TaskActionMenu.vue:60-64`).
    - *Skip* closes one block (`useTodayPlan.ts:329-340`).
    - The day view's bulk reschedule sends the selected blocks to another date at the same clock times
      (`DayPlannerView.vue:490-512`).
  - **Three modules place blocks, and none knows where the free time is.**
    - Home's snooze, above.
    - Leisure's "Do it now" books from now without checking for overlaps (`useLeisureCommitment.ts:68-93`).
    - The planner's carry-over copies into the original clock slot, and only offers the template conflict modes
      (`OverdueTasksBanner.vue:99-134`).

    A grep of `src/` for `freeSlot|nextFree|findFree|availableSlot` finds nothing.
  - **The server has no "missed" state.** `PlannerTaskStatus` has no such member (`PlannerTask.cs:7`), and the trend's
    `NeverHappenedCount` covers only days strictly before today (Planning `domain-map.md` § *Plan-vs-actual trend*).
  - **There is no batch move.** `PatchPlannerTaskSpanEndpoint` takes one task, and each `UpdatePlannerTaskEndpoint` call
    re-syncs reminders on its own (`UpdatePlannerTaskEndpoint.cs:63`).
- **Backend logic needed** (`.Planning`):
  - **A missed rule, owned in one place.** A non-background task is missed when it is `NotStarted` and its `EndTime` has
    passed in the user's zone (`TaskPlannerHelper.TodayIn`). Derived, never stored, like the streak. N5's end-of-block
    reminder needs the same definition.
  - **`POST /calendar/day-plan/{date}/replan` returns a preview.**
    - It packs every missed task and every not-yet-started future task, in their original order, into the free intervals
      between now and `Calendar.BedTime`.
    - **Fixed blocks stay where they are:**
      - anything already `InProgress` or `Completed`;
      - tasks whose activity is `IsUnavoidable` (a grep of `IsUnavoidable` outside tests finds only DTO projections, the
        request and the activity filter, so this would be its first real use);
      - background tasks, which never block anyway.
    - **When time runs out**, optional tasks (importance 666, `BasePlannerTask.cs:18`) drop first, then the latest ones.
    - Whatever does not fit comes back as `wontFit[]`. Nothing is ever silently shrunk.
  - **`POST …/replan/apply` takes the accepted preview** and does four things:
    - moves the spans in one transaction;
    - handles `wontFit[]` as the user chose in the preview: moved to tomorrow's first free slots, or closed with
      `SkipReasonKey.NoTime`;
    - calls `SyncForPlannerTasksAsync` once for the whole set;
    - keeps each task's original planned time (see F1-03).
  - **`GET /calendar/day-plan/{date}/next-free-slot?minutes=`** applies the same packing rule to a single block. Home's
    snooze, leisure's commit and the to-do → planner handoff call it instead of placing blind.
- **Frontend surface:**
  - `NowBar` in `missed` mode and the `DayPlannerWidget` header get a "Re-plan the rest of today" button.
  - `DayPlannerView` gets the same button in a today-only banner. That fills the hole `usePlannerNowNext.ts:105-108`
    assumes the overdue banner covers.
  - The preview renders on the existing grid.
  - *Move later* switches to `next-free-slot`.
- **Data it runs on:** `PlannerTask` spans, status and importance; `Activity.IsUnavoidable`; `Calendar.BedTime`. **No new
  input** beyond one tap and one choice for what doesn't fit.
- **Size:** backend M; frontend M.
- **Risks / open questions:**
  - **What counts as fixed is the owner's call.** `IsUnavoidable` is an activity-level flag, and a meeting with a person
    may not carry it. A per-task "fixed time" flag would be a new form field, so start with `IsUnavoidable` plus
    `InProgress` only.
  - **`wontFit[]` must not become a guilt pile.** It is resolved inside the same action (tomorrow, or let it go) and never
    parked on screen as a list.
  - **Never auto-apply.** A plan the server rearranges while the user isn't looking is a different, worse feature.
  - **Client-side is possible, but weaker.** The day's tasks are already on the client, so the packing could run there for
    the in-app button alone. The server version earns its place through three things: one `next-free-slot` rule for three
    modules, one atomic move with one reminder re-sync, and a one-tap action N5's notification can carry without the
    planner open.
  - **Collapse with N5.** Once two or more blocks are missed, one "Today's plan has slipped — re-plan the rest?" should
    replace N5's per-block pings.
  - **The window runs to midnight for now.** `BedTime` defaults to 00:00 (`CalendarDayFactory.cs:23-26`) until F2-10 lands.
- **Dedupe:** new.
  - Extends audit **N5** (the missed-block notification) by giving it a server-side action.
  - Extends `_done/home` **H9**'s per-task vocabulary (snooze, extend, skip) with a whole-day operation.
  - Not the existing day-level over-capacity warning (`_done/day-planner` *Deliberately excluded*), which only reports.

### F1-02. A block that hasn't started gets one nudge, while there is still time to start it
- **Moment:** 10:12. "Write report" (10:00–11:00) is still `NotStarted`, no timer is running for it, and the desktop
  tracker has seen twelve minutes of YouTube.
- **Today:**
  - **Client-side alerts stop at the slot start.** The home tab's own clock fires "Starting in N min" and "Start now".
    Nothing fires after that (`useTodayPlan.ts:396-420`), and nothing reaches a closed tab.
  - **The audit covers the moments before and after, not during.** Its N1 moves the *pre-start* reminder server-side. Its
    N5 fires *after the block has ended* ("never started — reschedule or skip?"), which is too late to start.
  - **Server-side start detection is narrow.** It is `ActivityTimeRecordedEventHandler.cs:61-79`, which flips the task to
    `InProgress` when desktop-mapped time for the same activity arrives. Only the desktop heartbeat feeds it (F2-02).
  - **The server already holds the evidence that a block started:**
    - the task's status;
    - a running countdown or pomodoro for the activity: `TimerBoundaryAlarm` rows, which live for the length of one timer
      (`TimerBoundaryAlarm.cs:24-51`);
    - history rows saved for the activity since the block began;
    - the desktop and web ledgers for the same window (`DesktopActivityHeartbeatEndpoint.cs:83-110`).

    No code joins these. The audit lists no notification producer in TodoLists, ActivityProfiles, Tracking (beyond J9's
    purge) or Core.
- **Backend logic needed** (host `AdhdTimeOrganizer`, because it reads Planning, History and Tracking):
  - **A sweep job every 5 minutes**, shaped like J3/P6 (`RoutineSuggestedTodayJobHandler.cs:80,150`). For each user's
    today, in their own zone, it selects tasks that meet all of these:
    - `NotStarted`, not background, not optional;
    - `StartTime + grace` has passed (default grace 10 minutes);
    - `EndTime − 15 min` has not passed, so enough of the block is left to be worth starting;
    - **no evidence of a start**: no `TimerBoundaryAlarm` for the activity, and no `ActivityHistory` row for it starting
      at or after `StartTime`.
  - **Tracker evidence only changes the wording.** When a tracker is connected, ledger seconds in `[StartTime, now]` on
    other processes or domains change the message text. They never decide whether it sends.
  - **One nudge per task**, keyed on the task id, with the message built at send time.
  - **A new `NotificationType`.** It is appended to the shared enum in `Sydowwe.Framework.Contracts`, with a catalogue
    entry and SK/EN texts. The subject is the task, so a click lands on `/day-planner/task/:id`.
  - **Back-off.** After N nudges in a row that were neither acted on (`InProgress` within 15 minutes) nor skipped, stop
    for that user for a week. This needs one small per-user counter row.
  - **Cross-slice reads go through a seam**: `IActivityStartEvidenceSource`, keyed, implemented by History and Tracking.
    This is the same shape as `IActivityMembershipSource` (`slices.md` § *Cross-slice seams*).
- **Frontend surface:**
  - An entry in `notificationTypeMeta.ts`.
  - `PlannerTaskLinkView` already redirects to the task. The focused block gets a "Start 10 minutes" button that opens the
    embedded `TrackTimeDialog` with `initialDuration` 10 and `autoStart`, the same pair the to-do quick-start uses
    (`TodoListView.vue:408`).
- **Data it runs on:** `PlannerTask`, `TimerBoundaryAlarm`, `ActivityHistory`, and the desktop and web ledgers. **No new
  input**; the grace period defaults to 10 minutes.
- **Size:** backend M–L (the seam and the back-off are most of it); frontend S.
- **Risks / open questions:**
  - **This is the most nag-prone candidate here.** One nudge per block, the back-off, the per-kind mute (reminder
    preferences) and quiet hours all apply.
  - **The grace setting has nowhere to live yet.** Per CLAUDE.md § *Where a preference lives*, rule 1, it belongs to
    reminder preferences. Today those store only enabled/muted per kind, so adding an offset is a framework question.
  - **False positives from stopwatches.** A stopwatch running for the activity is invisible to the server.
    `TimerBoundaryAlarm` is deliberately not timer state, and stopwatches post no alarms. So the copy must be a question
    ("Started already? Tap to mark it"), and that tap marks the block `InProgress`.
  - **Tracker evidence never triggers a nudge on its own.** A "you're on YouTube" push is surveillance, not help.
  - **Delivery.** Push needs VAPID. Without it the nudge is in-app only, which still reaches an app that is open on another
    page.
- **Dedupe:**
  - Extends audit **N1** (before the start) and **N5** (after the end) with a trigger neither lists: *inside the block, no
    evidence of a start*. The evidence join is the new backend logic.
  - Gains from F2-02 (timers raising `ActivityTimeRecordedEvent`).
  - Its tracker signal depends on F2-03.

### F1-03. Missed starts leave a trace: postponements are remembered, and carrying a task over stops counting against you
- **Moment:** Thursday morning, carrying "Call the insurer" over for the fourth day running. Nothing in the app can tell it
  apart from a task that slipped once.
- **Today:**
  - **Every way of moving work forward overwrites the original:**
    - home's *Move later* PUTs a new `startTime`/`endTime` (`useTodayPlan.ts:349-353`);
    - the day view's reschedule PUTs a new `calendarId` (`DayPlannerView.vue:497-499`);
    - the to-do renegotiation PUTs a new `dueDate` (`useOverdueRenegotiation.ts:52-56`);
    - the planner carry-over **creates a fresh copy** with no link to the original (`OverdueTasksBanner.vue:122-124`).
  - **No backend column records a move.**
    - `PlannerTask.cs:7-19` and `TodoListItem.cs:5-42` have no original time, no move count and no carried-from link.
    - A solution-wide grep for
      `Postpone|Reschedul|CarriedFrom|CarryOver|OriginalStart|OriginalDue|TimesMoved|MoveCount|SnoozeCount` finds only
      scheduler and timer-alarm internals.
  - **This distorts two numbers.**
    - *Drift is understated.* `DriftMinutes` compares the actual start with `StartTime`, and a snoozed task's `StartTime`
      is already the snoozed time.
    - *Carrying over is punished.* The copy leaves yesterday's original `NotStarted`. The streak counts a day only when
      every qualifying task is `Completed`, and only `Cancelled` leaves the denominator (`PlannerStreakReader.cs:44-45,51`).
      So carrying a task over breaks yesterday's streak day where skipping it would not, and it adds a "never happened" to
      the trend.
  - **Skips leave a trace and postponements do not.** A skip keeps its reason and key (C1's skip summary).
- **Backend logic needed:**
  - **`.Planning`:**
    - `PlannerTask` gains `OriginalDate` and `OriginalStartTime`. They are set on create and carried across moves. PUT and
      span patch never write them. Copy-to-days and template apply set fresh ones, because those are a new plan, not a
      move.
    - `PlannerTask` also gains `PostponeCount`. One rule in the update and span paths increments it: the block moves later
      (or to a later day) while `NotStarted` **and** after its original start has passed. An early tidy-up of tomorrow is
      not a postponement.
    - A **carry-over command**, `POST /planner-task/{id}/carry-to/{date}`, *moves* the task under the same rule and leaves
      no stale original. The banner switches from copying to this, so yesterday's day stops being held hostage.
  - **`.TodoLists`:**
    - `TodoListItem` gains `FirstDueDate` and `PostponeCount`. `UpdateTodoListItemEndpoint` increments the count when an
      **overdue** item's `DueDate` moves later.
    - The bulk renegotiation becomes one `POST /todo-list-item/reschedule-overdue { listId?, days }` that applies the rule
      once. The list id becomes optional (see F1-04).
  - **The stuck signal:** both responses expose `postponeCount`, plus an `isSliding` flag at `PostponeCount ≥ 3`, computed
    on read and never stored as a status.
- **Frontend surface:**
  - **Sliding items** appear in the to-do renegotiation banner and in home's `TodoListWidget` and `NowBar`. They show
    **options, not a count**:
    - "make the first step 10 minutes" (the quick-start exists, `TodoListView.vue:408`);
    - "split it" (steps exist);
    - "pair a reward" (temptation bundling exists);
    - "let it go" (delete, or clear the date).
  - **The planner banner** keeps its look, and moves instead of copying.
- **Data it runs on:** existing task and item rows, plus two or three columns each. **No new input.**
- **Size:** backend M (a migration, one rule across four write paths, the carry endpoint); frontend M.
- **Risks / open questions:**
  - **Never show the number.** "Moved 5 times" is exactly the punishing score `_RULES.md` warns about. The count only
    decides *which* help to offer.
  - **Whether a carried task counts as a missed streak day** is a streak-rule decision. This proposal treats a carry like a
    skip and takes it out of the denominator, because the user did make a decision about it.
  - **Migration:** existing rows get `Original* = current` and `PostponeCount = 0`. History from before the deploy cannot
    be recovered, and that is acceptable.
  - **Linked to-dos double-count unless the move updates them.** A to-do scheduled into the planner takes the block's date
    as its due date (`TodoListView.vue:465-468`), but moving the block does not update it. The item then turns overdue,
    and renegotiating it would count a second postponement. The carry/move rule should move the linked item's due date in
    the same operation, through a cross-slice event, the same way `PlannerTaskIsDoneChangedEvent` already fans out.
- **Dedupe:** new.
  - Extends `_done/todo-motivation` **N2** (defusing the overdue pile with a bulk reschedule) by making repeated
    renegotiation visible to the help it offers.
  - Fixes the planner carry-over's copy semantics.
  - Corrects the input to the `PlanVsActualTrendService` drift.
  - C1 records skips; this records the other way a plan fails.

### F1-04. Coming back after a week away: one screen turns the pile into three decisions, and the app stops nudging while you're gone
- **Moment:** opening the app after eight unplanned days away, onto 23 overdue to-dos, four lists each with its own
  banner, broken streaks and 31 unread notifications.
- **Today:**
  - **While away, the pushes keep coming.** The routine producers fire every day: P1 at 02:00 UTC, P4 and P5 at 09:00 UTC,
    and P6 every morning (audit producer table). None of them can tell a busy user from one who has stopped opening the
    app, because no last-active field exists:
    - `User.cs:10-32` and `BaseUser.cs` carry none;
    - the sessions list's "last used" is just the refresh token's `CreatedAt` (`BaseGetUserSessionsEndpoint.cs:40`);
    - expired tokens are deleted by `RefreshTokenCleanupService` (framework `RefreshTokenCleanupService.cs:9,40`).
  - **On return, each surface shows its own slice of the pile:**
    - home's to-do widget lists every overdue item across all lists, because the dashboard query has no lower bound
      (`GetDashboardTodoListItemEndpoint.cs:43-47`);
    - renegotiation is per list and client-side, working from that list's items only (`useOverdueRenegotiation.ts:13,29-35`);
    - the planner offers only *yesterday's* open tasks (`OverdueTasksBanner.vue:80-91`). The seven days before that never
      surface, and the only range read carries no status (`GetTaskSummariesCalendarEndpoint.cs:63-74`), so the client
      cannot find them without one `filter` call per day;
    - the routine weekly review asks about one period at a time, and "pause" means hiding it indefinitely
      (`useRoutineGroups.ts:52-61`);
    - history's first-run probe looks only at the last 366 days (`historyDashboardApi.ts:101-109`).
- **Backend logic needed** (host `AdhdTimeOrganizer`, because it spans slices; each slice exposes a keyed
  `IReturnSummarySource` seam, the same pattern as `IActivityMembershipSource`):
  - **`User.LastActiveAt`**, stamped at most hourly by authenticated requests (a host middleware, or the refresh endpoint).
  - **`GET /welcome-back`** returns `null` unless `now − LastActiveAt ≥ 4 days`. Otherwise it returns, for the time since
    `LastActiveAt`:
    - overdue to-dos across all lists (a count and the oldest few);
    - `NotStarted`, non-background planner tasks on past days (a count and the day span);
    - routine periods whose streak broke, and whether a freeze can still cover one;
    - the unread notification count (`/notification/unread-count` already exists).
  - **`POST /welcome-back/fresh-start`** applies the user's three choices in one call, with an undo token:
    - *to-dos:* clear the due date ("someday"), or spread them over the next N days;
    - *past planner tasks:* close them with a new `SkipReasonKey.Away`, or carry chosen ones to today (F1-03's move).
      `Away` takes them out of the streak and trend denominators without polluting C1's skip-reason insights;
    - *notifications:* mark all read.
  - **Away back-off.** A new framework collaborator, `IRecipientEngagementReader`, is registered by the app and defaults to
    "engaged", so other apps are unchanged. Through it, `NotificationService` holds non-essential kinds once `LastActiveAt`
    is more than 3 days old:
    - held: `RoutinePeriodEnded`, `RoutineSuggestedToday`, `RoutinePeriodEndingSoon`, and N2/N4 once built;
    - exempt: `TimerBoundary`, `PersonalReminder` and the admin job alerts.
- **Frontend surface:**
  - `HomeView` gets a one-time card above the NowBar whenever `welcomeBack != null`. It has three rows (to-dos, planner,
    routines), each with a sensible default, and one "Start fresh" button.
  - The per-list renegotiation banner stays for the ordinary case.
- **Data it runs on:** existing rows across TodoLists, Planning, Routines and Notifications, plus one new column. **No new
  input** beyond the three choices, which are optional.
- **Size:** backend M–L (the seams, the column and the framework collaborator); frontend M.
- **Risks / open questions:**
  - **Skippable, and never led by numbers.** "23 overdue" is exactly the wall the card exists to remove, so its headline is
    the action, and the user can dismiss it.
  - **The thresholds are the owner's call:** 4 days before greeting, 3 days before backing off.
  - **The back-off touches the framework's `NotificationService`**, which makes it a two-repo change. It is separable: the
    greeting is useful without it.
  - **`SkipReasonKey.Away` is not just an enum member.** It also needs a wire token in `SkipReasonKeyTokens` and labels in
    `SkipReasonKeyLabels`.
  - **Share one away check with F4-01.** F4-01 suppresses J2/J3 on days the user *marked* as away. One "is this user away
    today?" check should serve both, so the two suppressions cannot disagree.
  - **Interacts with F1-06.** Auto-placed blocks must not pile up for an absent user.
- **Dedupe:** new as a whole.
  - Extends `_done/todo-motivation` **N2** (per list, client-only) to every list in one transaction.
  - Extends the planner carry-over from one day to the whole gap.
  - Serves the same returning user as the open `_done/activity-history` ask (`has-any`).
  - Complements **F4-01**, which needs the days to be marked; this needs nothing marked.
  - The back-off is a new *suppression* rule, not a new notification. The audit flags J2's wrong hour, not this.

### F1-05. Plans that learn how long things really take, per template line and per activity
- **Moment:** Sunday evening, applying the "Workday" template for the fifth week running. Its "Email" block has run 40
  minutes over every time, and its "Gym" block has been skipped on six Mondays out of seven.
- **Today:**
  - **Template lines.** Applying a template stamps `SourceTemplateTaskId` on each task (`PlannerTemplateApplier.cs:240`),
    and copy-to-days carries it (`CopyToDaysPlannerTaskEndpoint.cs:134`). Its only reader is the response echo
    (`PlannerTaskResponse.cs:16,81`; solution-wide grep). OP15 proposes showing it. The template itself tracks only
    `UsageCount` and `LastUsedAt` (`PlannerTemplateApplier.cs:101-102`).
  - **Activities.**
    - The plan-vs-actual trend is one aggregate over a date range (Planning `domain-map.md` § *Plan-vs-actual trend*), not
      broken down by activity or template line.
    - History's `aggregate-by-activity` is an all-time mean per sitting (`AggregateByActivityActivityHistoryEndpoint.cs:16,49-56`).
      S3 turns it into a to-do calibration chip.
    - The planner uses none of it. The to-do → planner handoff passes the raw `suggestedTime` (`TodoListView.vue:380-382`),
      although the same view computes a calibration ratio (`:305-309`).
  - **Nothing feeds actuals back into the next plan.**
- **Backend logic needed** (`.Planning`):
  - **`GET /task-planner-day-template/{id}/fit`.** For each template line, over the last 8 weeks of tasks carrying its
    `SourceTemplateTaskId`, it returns:
    - how many times the line was applied;
    - the share completed and the share skipped, with the top skip key;
    - median planned length against median actual length (`Completed` tasks with both actual times);
    - median start drift (against `OriginalStartTime` once F1-03 lands).

    From these it derives at most three concrete suggestions, such as "shorten Email to 20 min", "drop Gym on Mondays" or
    "start Deep work 30 min earlier". Each is a single line edit, which the client applies through the existing
    template-task PUT.
  - **`GET /planner-task/activity-fit?activityIds=`.** The same planned-vs-actual medians, grouped by activity, for blocks
    that did not come from a template. It feeds the task dialog's default length.
  - **Both stay silent below 4 samples.**
- **Frontend surface:**
  - `TemplateDayPlannerView`'s side panel gets a *How this template has been going* section listing the suggestions, each
    with an "Apply" button.
  - `TemplateListView` cards get a quiet dot when a template has a suggestion.
  - `PlannerTaskDialog` gets a "usually ~50 min" hint that can be used in one tap.
- **Data it runs on:** `PlannerTask` status, skip key, actual times and `SourceTemplateTaskId`. **No new input.**
- **Size:** backend M; frontend M.
- **Risks / open questions:**
  - **The data is thinner than it looks.** Ticking a block done from home sends `task.actualStartTime`, which is null
    unless *Start* was pressed (`useTodayPlan.ts:296-301`). Tracker-driven completions set no actual times at all
    (`ActivityTimeRecordedEventHandler.cs:78`). So the measurable samples are mostly blocks the user explicitly started.
    Check the real distribution before building.
  - **Suggestions describe the template, never the person.**
  - **Never edit a template automatically.**
  - **Overlaps F3 in spirit** (planner × history). The per-activity half could also join history sittings; that is F3's
    call.
- **Dedupe:**
  - Extends **OP15**, which shows a task's origin; this puts it to use.
  - Extends **S3** (to-dos only, an all-time mean, a chip that never changes the plan), **F2-06** (routine items) and
    **F2-07** (timer lengths) to planner blocks and templates.
  - B27 ranked templates; it never changed one.

### F1-06. Recurring commitments put themselves on the plan (opt-in, today and tomorrow only)
- **Moment:** Wednesday 17:40. "Gym, Mon/Wed/Fri 18:00" exists as a repeating task, but home's plan doesn't show it, no
  reminder is coming, and the user sees it only if they happen to open the day planner.
- **Today:**
  - **A repeating task is a rule that nothing materialises.** `RepeatingPlannerTask.cs:5-16` has no materialisation, and
    the Planning `domain-map.md:400` says it is "not materialised into planner tasks by anything today".
  - **It surfaces only in the day planner.** It appears as a *user-set suggestion* from
    `GET /repeating-planner-task/suggestions/{calendarId}` (`GetSuggestionsRepeatingPlannerTaskEndpoint.cs:67-90`), and
    only `DayPlannerView` calls that endpoint (`DayPlannerView.vue:216,310-333`). Home reads `GET /calendar/day-plan/{date}`,
    which returns only real tasks.
  - **No reminder can ever reach it.** The audit rejected reminders for recurrences because "it becomes remindable once
    applied as a `PlannerTask`, which N1 covers". Nothing applies it, so N1 never reaches a recurring commitment.
  - **N4 doesn't cover it either:** N4's morning nudge applies templates, not recurrences.
- **Backend logic needed** (`.Planning`):
  - **Two new columns:** `RepeatingPlannerTask.AutoPlace` (bool, default false) and `PlannerTask.SourceRepeatingTaskId`
    (nullable, `SetNull`).
  - **A materialiser**, a domain service next to `CalendarProvisioner`. It runs lazily from `GetDayPlanCalendarEndpoint`
    for today and tomorrow, and from N4's morning sweep if that gets built. For each matching auto-place rule it creates
    one `NotStarted` task, unless the day already has a task with that `SourceRepeatingTaskId`.
  - **Rules for occurrences:**
    - Deleting or skipping an occurrence never touches the rule, and the occurrence is never re-created (the per-day
      "already exists" check counts every status).
    - Editing the rule updates future occurrences that are still `NotStarted` and untouched (their span still equals the
      rule's).
    - A conflict with an existing task resolves with the user's `DefaultConflictResolution`.
    - Reminders are registered only if N1's auto-registration lands.
  - **The suggestions endpoint needs no change** to stop offering what was auto-placed: its covered-activity set already
    excludes it (`:57-65`).
- **Frontend surface:**
  - `RepeatingTaskDialog` gets one switch: "Put it on my plan automatically".
  - Occurrences render as ordinary blocks with a small repeat mark, in the same slot as OP15's origin mark.
- **Data it runs on:** existing rules. **New input:** one switch per rule.
- **Size:** backend M; frontend S.
- **Risks / open questions:**
  - **Auto-placed blocks the user didn't choose today can turn into a guilt pile.** So: only today and tomorrow, never
    further ahead, and never for a user who has been away for days (gate on F1-04's `LastActiveAt`) or whose day is marked
    away (F4-01's `DayType.IsAway()`).
  - **A missed occurrence needs no special case.** F1-01 and F1-03 handle it like any other block.
  - **A GET that writes.** Materialising lazily on read means `GetDayPlanCalendarEndpoint` writes. There is precedent:
    `GET /planner/settings` is already get-or-create (Planning `domain-map.md` navigation index).
- **Dedupe:**
  - Extends audit **N4** (a nudge to apply a template) by removing the recurring part of that decision.
  - Extends **OP10**, which shows a rule's schedule.
  - Unblocks **N1** for recurring commitments.
  - Distinct from **F2-08** (which *pattern* suggestions qualify); this is about *user-set* rules.

## Rejected

- **A one-field capture inbox (a new `InboxEntry` entity).** The client can already chain the activity quick-create (under
  the system "To-do list task" role) with the item create at a default priority, so this is frontend-only (*Out of scope*
  #1). Capturing from outside the app (Android share sheet, tray app) needs clients this pass cannot see.
- **A drift nudge during a block already `InProgress`** ("the tracker sees you on YouTube"). It is surveillance rather than
  help, and a notification users learn to ignore. Tracker evidence appears only in F1-02's wording. A post-hoc "during
  *Write report*, the tracker saw…" is F3's tracking × planner join.
- **An evening "close the day" push** ("3 done, 2 left — carry them over?"). It lands when an ADHD user is most depleted,
  and it reads as "you didn't finish". The morning carry-over (fixed by F1-03) and F1-01 cover the same decision without a
  nightly ping.
- **A wind-down nudge when the tracker sees activity past bedtime.** `BedTime` defaults to 00:00 for everyone
  (`CalendarDayFactory.cs:23-26`; F2-10), so there is no signal yet, and a late-night push is the worst-timed notification
  the app could send. Revisit after F2-10.
- **An earned-leisure budget** ("40 min of focus earns 20 min of guilt-free rest"). That is a token economy, which every
  `_done` set rules out (Deci, Koestner & Ryan; `_done/todo-motivation/README.md` *Deliberately excluded*).
- **Pausing routines and streaks on `Vacation` / `SickDay` days.** A grep of `.Routines` finds no `DayType` reader.
  **F4-01** covers this.
- **A server-side weekly review.** The composite screen is frontend work over existing endpoints, plus the new reads from
  F1-03 and F1-05.
- **Auto-closing yesterday's unstarted planner tasks overnight.** Changing status behind the user's back destroys the
  honest "never happened" data. F1-03 (a carry becomes a move) and F1-04 (the user-confirmed `Away` key) close them with
  consent.
- **A session-level "you abandon 60% of focus sessions" insight.** That is a score. F2-07 already spends
  `ActivityHistorySession.Outcome` without one.

## Out of scope, but noticed

The bugs below (#3, #5, #6, #7, #9, and the design note #10) are also in `docs/bugs-to-investigate.md`, each with how to
confirm it and a direction for the fix.

1. **Frontend-only: one-field capture.** Chain the activity quick-create and `POST /todo-list-item`, using the user's
   default list and priority, so that "Call the dentist" lands from a single field. Both endpoints exist; the friction is
   the dialog (`ToDoListItemDialog.vue`). Two design constraints for whoever builds it:
   - every captured thought becomes a permanent `Activity` in every picker (`ActivityId` is non-null on
     `BaseEntityWithActivity`);
   - `TodoListItem` is unique on `(UserId, ActivityId, TodoListId)` (TodoLists `domain-map.md`, invariant 4), so the same
     thought cannot be captured twice into one list.
2. **Frontend-only: the to-do → planner handoff ignores a calibration it has already computed.** `TodoListView.vue:380-382`
   passes the raw `suggestedTime` while `:305-309` holds the ratio. Scaling the handoff length by that ratio is a client
   change.
3. **Frontend-only: rest breaks the planner streak.** Leisure "Do it now" and "Plan for later" create a planner task with no
   `importanceId` (`useLeisureCommitment.ts:82-89`). Only the optional marker (666) or `Cancelled` keeps a task out of the
   streak (`PlannerStreakReader.cs:44-45,51`), so a rest block left unticked breaks the next day's streak. Sending the
   user's optional-importance id at commit time fixes it.
4. **Frontend-only: suggest the picker when the day is done.** `NowBar` in `allDone` mode ("You're done for today!",
   `home.en.ts:35`) could link to `/leisure/pick`.
5. **Bug-ish (backend): tracker-driven status changes skip the status rules.** `ActivityTimeRecordedEventHandler.cs:78`
   assigns `Status` directly instead of going through `ApplyStatus`. It records no actual times and never calls
   `SyncForPlannerTasksAsync`, although the Planning `summary.md` requires every status write path to call it. A
   tracker-completed task therefore keeps its reminder registered. That is harmless today, because no client creates
   reminders (audit R1), but it matters once N1 lands. Separately, `:61-67` picks the day's task for an activity with an
   unordered `FirstOrDefault`.
6. **Bug (backend): the heartbeat's day is the UTC day.** Verified at code level in a follow-up on 2026-10-04.
   - `DesktopActivityHeartbeatEndpoint.cs:171` takes `DateOnly.FromDateTime(windowStart)`.
   - `WindowStart` is a `timestamptz` value, so it is UTC (`DailyWindowMaskRequest.cs:57-62`).
   - The day total is a UTC range too (`ActivityHistoryTimeAttributionSink.cs:64-65`).
   - `ActivityTimeRecordedEventHandler.cs:64` compares that day against `Calendar.Date`, which is the user's local date.

   So for a Bratislava user, time tracked between local midnight and 01:00/02:00 completes or starts *yesterday's*
   planner task.
7. **Stale doc: `docs/views/planner-day/usecase.md` misdescribes the overdue banner.** It says the banner covers tasks on
   *this* day "whose window passed while still `NotStarted`". In the code it shows only *yesterday's* open tasks, and only
   while viewing today (`OverdueTasksBanner.vue:80-91`; title key `planner.calendar.notCompletedYesterday`,
   `dayPlanner.en.ts:124`). The comment at `usePlannerNowNext.ts:105-108` relies on the doc's wrong reading.
8. **Stale claim in F2: duplicate suggestions (corrected in F2 on 2026-10-04).** F2's *Out of scope* #4 marked as
   unverified whether the suggestions endpoint skips activities already planned that day. It does:
   `GetSuggestionsRepeatingPlannerTaskEndpoint.cs:57-65` seeds a covered-activity set from every task on the calendar,
   whatever its status.
9. **Minor bug (frontend): rescheduling to an unseeded date fails.** `DayPlannerView.vue:491` resolves the target calendar
   through `by-Date`, which 404s for a date with no row. `UpdatePlannerTaskEndpoint` already accepts `date` and creates the
   day lazily (Planning `domain-map.md` § *Lazy day creation*). In practice this only bites for dates beyond next year,
   because the seeder fills this year and next.
10. **Design note: a planner task made from a to-do writes its date back into the item** (`TodoListView.vue:465-468`,
    `dueDate` and `dueTime`). A missed block therefore also makes the to-do overdue, and snoozing the block does not update
    the item's `dueTime`. F1-03's risks cover the consequence.
