# Notification audit

> Audited 2026-10-02 · frontend commit `0e77f904` · backend commit `4e49e3a` (framework submodule `122859c`)
>
> The backend working tree was **dirty** at audit time (uncommitted edits in `AdhdTimeOrganizer.History`, including
> `TimerBoundaryAlarmJobHandler.cs` and `TimerBoundaryAlarmService.cs`, and in `NotificationCatalogTests.cs`). What is
> described here is the working tree, not the commit. Inputs: `docs/data-map.md` § Time-bearing fields,
> `docs/data-map/framework.md` § App wiring, `src/app/notifications/notificationTypeMeta.ts`.

## Summary

The backend has **26 producers**: 12 places that raise a notification, 2 that register a reminder, and 12 scheduler jobs.
Six of the jobs are also notification triggers. Every notification the user can receive goes through one pipe,
`NotificationService.NotifyAsync`. The pipe writes the history row, sends in-app through SignalR, and sends Web Push
and e-mail subject to the per-type × channel matrix. Quiet hours hold back push and e-mail.

**Coverage is clean in one direction.** No real producer raises a kind the frontend lacks metadata for. The only route
to one is the QA endpoint's `?type=`. In the other direction, **2 registered kinds are never raised in production**:
`DeadlineApproaching` and `ReminderDigest`. **Two more are raised by code the frontend cannot reach**:
- `PersonalReminder`: no client screen creates a Planning `Reminder` row.
- `RoutinePeriodEndingSoon`: it is gated on `reminderLeadDays`, which the client drops and overwrites with null on every
  save.

All three top candidates mostly need delivery machinery that already exists:

- **N1.** Planner task-start reminders that arrive with the app closed. The whole chain is built and routed, but nothing
  creates the row.
- **N2.** To-dos due today or overdue. This is the app's only user-written deadline, and nothing ever announces it.
- **N3.** Routine "period ending soon". The producer is finished; the frontend only needs to send one field.

## Producers

**How to count.** A *notification* row is a call site that reaches `NotifyAsync`. A *reminder* row is a call site that
registers a `ReminderDefinition`. A *job* row is a scheduler registration. A job that triggers a notification appears in
both lists. Every cron below is Quartz: seconds first, evaluated in UTC.

**Gating shared by every notification row:**
- `NotificationPreference` per (type, channel), edited in the matrix on `/nastavenia/pripomienky`.
  - In-app and Web Push are on by default.
  - E-mail is on by default only for `DeadlineApproaching`, `ScheduledJobFailed` and `ScheduledJobOverdue`
    (`NotificationChannelDefaults.cs`).
- **Quiet hours**: an opt-in, per-user window in the recipient's own zone.
  - Push and e-mail are held until the window ends, then flushed by J7.
  - In-app is never held.
  - `TimerBoundary` is the only exempt kind (`QuietHoursExemptTypes.cs`).
- **Web Push** sends only when VAPID is configured and the device has a subscription.
- **E-mail** sends only when SMTP is configured.

**Additional gating on the reminders path (P11, P12):**
- A `ReminderKindPreference` row for `(ownerModule, kind)` mutes the reminder for that recipient.
- When **every** recipient is inside quiet hours, the whole dispatch is postponed, in-app included. It then goes out
  marked late.
- A snooze that has come due ignores quiet hours, because the user picked that instant.

### Notifications

| # | backend file | trigger | ownerModule / kind | channels | gated by |
| --- | --- | --- | --- | --- | --- |
| P1 | `AdhdTimeOrganizer.Routines/infrastructure/jobs/RoutineTodoListResetJobHandler.cs` | cron, job J1 (`0 0 2 * * ?`): a period that rolled over is reset | Routines / `RoutinePeriodEnded` | in-app, push (e-mail opt-in) | shared gating; hidden periods are skipped |
| P2 | `AdhdTimeOrganizer.Routines/application/endpoint/routineTodoList/query/GetAllGroupedRoutineTodoListEndpoint.cs` | user action: reading the routine list applies an overdue reset lazily | Routines / `RoutinePeriodEnded` | same | shared gating; whichever reset site (P1/P2/P3) gets there first sends it, and a lost race sends nothing |
| P3 | `…/routineTodoList/command/RoutineToggleIsDoneTodoListEndpoint.cs` | user action: ticking an item applies an overdue reset lazily | Routines / `RoutinePeriodEnded` | same | same as P2 |
| P4 | `AdhdTimeOrganizer.Routines/infrastructure/jobs/RoutinePeriodNudgeJobHandler.cs` | cron, job J2 (`0 0 9 * * ?`): fires when `now` is within `ReminderLeadDays` of the next reset and an item is still open | Routines / `RoutinePeriodEndingSoon` | same | shared gating; **`RoutineTimePeriod.ReminderLeadDays` must be non-null** (opt-in per period; the client cannot set it, G1); marked per reset |
| P5 | same file | cron, job J2: fires within 1 day of `StreakGraceUntil` | Routines / `RoutineStreakGraceExpiring` | same | shared gating; the period needs `StreakGraceDays > 0` and a missed threshold |
| P6 | `AdhdTimeOrganizer.Routines/infrastructure/jobs/RoutineSuggestedTodayJobHandler.cs` | cron, job J3 (`0 0/15 * * * ?`): first run after the user's local `Calendar.WakeUpTime` (08:00 when no day row exists) | Routines / `RoutineSuggestedToday` | same | shared gating; only non-daily, visible periods with items suggested for today and not done; one per user per local day |
| P7 | `AdhdTimeOrganizer.History/application/job/TimerBoundaryAlarmJobHandler.cs` | one-shot job J4 at each boundary the client posts to `POST /activity-history/timer-alarm/schedule` | History / `TimerBoundary` | in-app, push | per-type matrix only; **exempt from quiet hours**; cancelled by `…/timer-alarm/cancel` |
| P8 | `framework/Sydowwe.Scheduler/application/job/ScheduledJobDispatcher.cs` → `framework/Sydowwe.Notifications/infrastructure/JobFailureNotifier.cs` | a job fails terminally and has `AlertOnFailure` on (off for J4 and J12) | Scheduler / `ScheduledJobFailed` | in-app, push, **e-mail on by default** | recipients are **Admin and Root only** (`NotificationRecipients.AtOrAbove(Admin)`); every account here is a plain `User` except the seeded root |
| P9 | `framework/Sydowwe.Scheduler/application/job/OverdueJobSweepJobHandler.cs` → `JobFailureNotifier.cs` | cron, job J6 (every 10 min): an active job's `NextRunAt` is stale | Scheduler / `ScheduledJobOverdue` | same as P8 | Admin and Root only; throttled to one alert per job per 12 h |
| P10 | `framework/Sydowwe.Notifications/application/endpoint/notification/SendTestNotificationEndpoint.cs` | user action: `POST /notification/test[?type=]` | Notifications / `Test` by default, **or any of the 20 `NotificationType` members** | to the caller only | shared gating |
| P11 | `framework/Sydowwe.Reminders/application/job/ReminderScanJobHandler.cs` (per occurrence + due snoozes) | cron, job J5 (every 5 min): `NextOccurrenceAt + lead offset ≤ now` | the definition's `NotificationType`. In practice only `PersonalReminder`, from R1 | in-app, push (e-mail opt-in) | reminders-path gating above, plus shared gating |
| P12 | same file, `ProcessDigestKeyAsync` | cron, job J5: due definitions that carry a `DigestKey` | Reminders / `ReminderDigest` | in-app, push | as P11. **No definition in this app ever sets a `DigestKey`**, so this never fires |

### Reminders

| # | backend file | trigger | ownerModule / kind | channels | gated by |
| --- | --- | --- | --- | --- | --- |
| R1 | `AdhdTimeOrganizer.Planning/application/service/ReminderRegistrationService.cs` | user action: `CreateReminderEndpoint` / `UpdateReminderEndpoint` register the definition. Edits to planner tasks re-sync or cancel it (`UpdatePlannerTask`, `PatchPlannerTaskSpan`, `PatchPlannerTaskStatus`, `ApplyTemplate[Batch]`, `DeletePlannerTask`, `BatchDeletePlannerTask`). A task that is completed or cancelled retires its reminder | `Portal` / `PersonalReminder` (subject `Reminder:<id>`, `NotificationType.PersonalReminder`) | through P11 | `ReminderKindPreference("Portal","PersonalReminder")`. `UserPlannerSettings.RemindersEnabled` / `ReminderMinutesBefore` only **pre-fill** the lead offset on create and never gate delivery. **No frontend screen calls `POST /reminder`** (see Coverage gaps) |
| R2 | `framework/Sydowwe.Reminders/application/endpoint/reminderDefinition/command/RegisterReminderEndpoint.cs` | admin action: ad-hoc registration | any pair / any type | through P11 | Admin only; the frontend's reminders module has no create form for it |

### Scheduler jobs

| # | backend file | trigger | ownerModule / jobKey | channels | gated by |
| --- | --- | --- | --- | --- | --- |
| J1 | `AdhdTimeOrganizer.Routines/infrastructure/scheduling/RoutinesScheduledJobsRegistrar.cs` | `0 0 2 * * ?` | Routines / `Routines.TodoListReset` | raises P1 | — |
| J2 | same | `0 0 9 * * ?` (09:00 UTC for **every** user, with no per-user zone) | Routines / `Routines.PeriodNudge` | raises P4, P5 | — |
| J3 | same | `0 0/15 * * * ?` | Routines / `Routines.SuggestedToday` | raises P6 | — |
| J4 | `AdhdTimeOrganizer.History/application/service/TimerBoundaryAlarmService.cs` (re-pushed on boot by `TimerBoundaryAlarmRegistrar`) | `ScheduleSpec.RunOnceAt(boundaryAt)`, one per alarm row; `FireAndProceed`, `MaxRetries 0`, `AlertOnFailure false`; rows more than 10 min stale are dropped on boot | History / `History.TimerBoundaryAlarm` + per-row key | raises P7 | — |
| J5 | `framework/Sydowwe.Reminders/infrastructure/scheduling/RemindersScheduledJobsRegistrar.cs` | every 5 min (`ReminderScan:CadenceMinutes = 5` in `appsettings.json`); `FireAndProceed`. **That cadence is the precision floor for every reminder** | Reminders / `reminders.scan` | raises P11, P12 | — |
| J6 | `framework/Sydowwe.Scheduler/infrastructure/scheduling/SchedulerScheduledJobsRegistrar.cs` | every 10 min (`OverdueJobSweepOptions.CadenceMinutes`) | Scheduler / `Scheduler.OverdueJobSweep` | raises P9 | — |
| J7 | `framework/Sydowwe.Notifications/infrastructure/scheduling/NotificationsScheduledJobsRegistrar.cs` | `0 0/15 * * * ?` | Notifications / `Notifications.FlushDeferredNotifications` | re-delivers push/e-mail held by quiet hours; preferences are checked again at flush time | — |
| J8 | same | `0 15 3 * * ?` | Notifications / `Notifications.PurgeExpiredHistory` | none (retention) | — |
| J9 | `AdhdTimeOrganizer.Tracking/infrastructure/scheduling/TrackingScheduledJobsRegistrar.cs` | `0 30 3 * * ?` | Tracking / `Tracking.PurgeExpiredActivityTrackingEntries` | none (retention) | — |
| J10 | `framework/Sydowwe.Scheduler/infrastructure/scheduling/SchedulerScheduledJobsRegistrar.cs` | `0 30 3 1 * ?` | Scheduler / `Scheduler.PurgeExpiredRunLogs` | none (retention) | — |
| J11 | `framework/Sydowwe.Reminders/infrastructure/scheduling/RemindersScheduledJobsRegistrar.cs` | `0 45 3 1 * ?` | Reminders / `Reminders.PurgeExpiredDispatchLog` | none (retention) | — |
| J12 | `AdhdTimeOrganizer/infrastructure/scheduling/PortalScheduledJobsRegistrar.cs` | `0/10 * * * * ?`; `MaxRetries 0`, `AlertOnFailure false` | Portal / `Portal.SuggestionPatternRefresh` | none (materialized-view refresh) | — |

`RefreshTokenCleanupService` (`Program.cs:358`) is a plain hosted `BackgroundService`, not a Scheduler job. It notifies
nobody and is left out of the count.

**No producer** exists in `AdhdTimeOrganizer.TodoLists`, `AdhdTimeOrganizer.ActivityProfiles` (leisure),
`AdhdTimeOrganizer.Tracking` (apart from J9's purge) or `AdhdTimeOrganizer.Core`. Neither `INotificationService`,
`IReminderRegistry` nor `IScheduler` is referenced in any of them.

### Observations on existing producers

- **P1 can wake people up.** Its reset runs at 02:00 UTC, which is 03:00–04:00 in Slovakia. Quiet hours are opt-in,
  so a user who has not set any gets a routine-summary push in the middle of the night. P6 already solves the same
  problem by anchoring to each user's wake-up time.
- **J2 is not per-user.** It nudges every user at 09:00 UTC, while J3, its sibling job, works per user and per zone.
- **R1's precision is J5's cadence.** A 10-minute lead lands 5–10 minutes before the start.
- **A comment in R1 is out of date.** `ReminderRegistrationService.ComposeTaskInstant` says quiet hours are evaluated in
  the deployment zone. `NotificationService` now reads each recipient's own zone through `IUserTimeZoneReader`
  (`ModuleServiceExtensions.cs:139`).

## Coverage gaps

### Emitted, no frontend metadata

**None from a real producer.** `AddNotificationCatalog` lists exactly the 11 kinds that P1–P12 can raise, and
`notificationTypeMeta.ts` registers the same 11.

The one route around that is P10's `?type=`. It accepts all 20 `NotificationType` members, including the 9 from the
other app (`StockLow`, `UpcomingHrEvents`, `LeavePending`, `WorkLogComplianceBreach`, `LeaveApproved`, `LeaveRejected`,
`WorkLogApproved`, `WorkLogRejected`, `RegistratoryDisposalDue`). Any signed-in user can therefore raise one of these to
themselves. It would arrive as a grey bell with the raw enum name, no click-through, and no entry in the inbox type
filter. This is QA-only and harmless, but it is the only path to an unregistered kind.

### Registered, never emitted

I checked these twice: every `NotifyAsync` call, every `IReminderRegistry` caller, and every `IReminderRenderer`
implementation. There are none of the last.

- **`DeadlineApproaching`: never raised in production.** No app module registers a reminder under it, and no renderer
  returns it. It shows up only in:
  - `DevReminderSeeder`, whose definitions belong to another app's domain (`OwnerModule = "Zmluvy"`, contract expiry);
  - P10's sample payload;
  - R2, the admin ad-hoc path;
  - the e2e seeder.

  It is still the obvious kind for a "something is due" producer (see N2), which is presumably why it is registered.
  P10's sample title, *"Naplánovaná aktivita – blíži sa začiatok"*, describes a planned activity about to start, the
  exact use N1 needs.
- **`ReminderDigest`: never raised in production.** P12 needs a `DigestKey`, and R1 never sets one (no app code
  outside `framework/` mentions `DigestKey` apart from migrations). Only the seeders and P10 produce it.

Two more kinds are raised by real code that this frontend cannot set off. They are not dead wiring, but no real user
receives them:

- **`PersonalReminder` (R1 → P11): no client caller.** None of the 37 `src/core/*/api/*.ts` files calls
  `POST /reminder` / `PUT /reminder/{id}`, and no view creates a reminder. Several pieces are built for a reminder that
  can never exist:
  - the subject route `plannerTask → /day-planner/task/:id`;
  - the `myReminders` fallback;
  - the `("Portal","PersonalReminder")` mute row;
  - the planner settings explainer: *"…used as the default when you create a reminder for a task…"*
    (`dayPlanner.en.ts:26`).

  The rows exist only in the e2e seed. `docs/data-map.md` § Endpoints with no client caller should list
  `/reminder/*`, and currently does not.
- **`RoutinePeriodEndingSoon` (P4): gated on a field the client destroys.** `EvaluateEndingSoon` returns null unless
  `RoutineTimePeriod.ReminderLeadDays` is set. `/routine-settings` neither displays nor sends it, so every create and
  edit writes it back to `null` (data-map G1). No seeder sets it either.

## Candidates: time-bearing data nothing notifies about

Ranked by the value to the user, discounted by how much of the delivery chain is still missing.

### N1. "Standup with Marek starts in 10 minutes", even when the planner tab is closed
- **Field(s):** `PlannerTask.startTime` (on `Calendar.date`), `UserPlannerSettings.reminderMinutesBefore`. Also
  `PlannerTask.date` for tasks created outside a day view.
- **Why a user wants it:** for someone with ADHD, time blindness makes the transition into a planned block the moment
  that is most often missed. The user has already set a lead time and switched it on. Today it fires only through
  `useTaskReminders`, as a browser notification in an **open planner tab, viewing today**. That is the one situation
  where the user least needs it.
- **Carried by:** R1 → J5/P11 → `PersonalReminder`, which already carries `subject: plannerTask` and is already routed to
  `/day-planner/task/:id`.
  - **The only missing piece is the step that creates the `Reminder` row.** Two ways to add it:
    - (a) Server-side auto-registration in the planner-task create / copy / apply-template endpoints when
      `RemindersEnabled`. This is one place, and it covers batch applies.
    - (b) A client "Remind me" control on `PlannerTaskDialog` calling `POST /reminder { plannerTaskId }`, with the lead
      left unset so `ApplyUserDefaultsAsync` fills it in.
  - **I prefer (a).** An opt-in per task means the default gets nobody reminded.
  - **(a) reverses the B2 answer.** B2 said `remindersEnabled` only pre-fills the lead. Under (a) it decides whether a
    reminder exists at all. The explainer text and B2 need rewording with it.
  - **`useTaskReminders` should step aside** whenever push is available. Otherwise the user gets the same reminder
    twice.
  - **Precision is 5 minutes (J5).** If that is too coarse, J4's one-shot trigger is precise, but it costs one live
    trigger per task.
- **Gating:** the existing `ReminderKindPreference("Portal","PersonalReminder")` mute, plus the `PersonalReminder` row in
  the delivery matrix. Quiet hours apply, which is correct: a sweep raises this, not a timer the user just pressed.
  E-mail stays off by default.
- **Size:** M

### N2. "3 to-dos are due today, and 2 are overdue"
- **Field(s):** `TodoListItemEntity.dueDate`, `TodoListItemEntity.dueTime`
- **Why a user wants it:** this is the only deadline in the app the user writes themselves, and right now it shows only
  as a banner on a list they have to open. For a user with ADHD, a due date nobody announces passes silently.
- **Carried by:** a new sweep shaped exactly like `RoutineSuggestedTodayJobHandler` (J3/P6). Like that job, it would:
  - run every 15 minutes;
  - wait for the user's local `Calendar.WakeUpTime` through `ICalendarDayLookup`;
  - mark itself once per user per local day;
  - build the message at send time, so items ticked before the morning drop out.

  Building at send time is the same reason the routine nudges are swept rather than registered as reminders: a reminder
  payload is frozen when it is registered. The sweep needs:
  - a new `NotificationType` member, which is an append to the shared enum in `Sydowwe.Framework.Contracts`;
  - an entry in `AddNotificationCatalog` and portal texts in SK and EN;
  - a payload with counts and a subject, so the click lands on the to-do list;
  - an entry in `notificationTypeMeta.ts`.

  It must count "overdue" with the **frontend banner's threshold**, which today exists only in this repo. That threshold
  has to move server-side or be shared, or the push and the banner will disagree.

  Possible extension: items with a `dueTime` could also register a per-item reminder with R1's mechanism under
  `("TodoLists","TodoDue")` at `dueTime − lead`, cancelled when ticked or deleted. Reusing `DeadlineApproaching` for
  that is tempting, but B2 settles its click as a constant route to `/pripomienky/moje`, which is the wrong place for a
  to-do.
- **Gating:** a row for the new kind in the delivery matrix (in-app and push on, e-mail off). Quiet hours apply, not
  exempt.
- **Size:** M (backend job + kind + texts; frontend meta and label)

### N3. "Weekly chores: 3 of 8 still open, 2 days left"
- **Field(s):** `RoutineTimePeriodEntity.nextResetAt`, `RoutineTimePeriod.reminderLeadDays`
- **Why a user wants it:** it turns the end of the period from a surprise into a deadline that still leaves time to act.
  It also comes before the streak-break warning (P5), not after it.
- **Carried by:** **already built**: P4 via J2, with the kind registered and routed (`routinePeriod → /routine-todo-list?focus=`).
  It needs only the client to:
  - map `reminderLeadDays` in the period response and in `TimePeriodRequest`;
  - expose it in the `/routine-settings` period dialog (server validator: `< LengthInDays`).

  This also fixes G1's wipe-on-save. Follow-up, not a blocker: J2 fires at 09:00 UTC for everyone. Anchoring it per user
  the way J3 does would make "2 days left" arrive in each user's morning.
- **Gating:** the `RoutinePeriodEndingSoon` row in the delivery matrix; quiet hours; per-period opt-in (`null` = off),
  which is correct for a recurring kind. Hidden periods are skipped.
- **Size:** S (frontend only)

### N4. "Your day isn't planned yet. Apply 'Workday'?"
- **Field(s):** `Calendar.wakeUpTime`, `PlannerStreak.currentStreak`, `Calendar.dayType`,
  `TaskPlannerDayTemplate.suggestedForDayType` / `.scheduledDays`
- **Why a user wants it:** the planner already counts consecutive planned days as a streak. That is the habit the app
  wants to build, and a morning with no plan breaks it without a word. A morning nudge that names today's matching
  template turns planning the day into a single tap.
- **Carried by:** the same sweep pattern as P6/N2: per-user wake-up, once per local day, built at send time. It needs a
  new kind and a subject or route to `/day-planner/<today>`. To avoid nagging people who don't use the planner, send it
  only to users who planned on most of the last 7 days.
- **Gating:** a row for the new kind in the delivery matrix; quiet hours.
- **Size:** M

### N5. "Your 14:00–15:00 'Write report' block has ended and never started. Reschedule or skip?"
- **Field(s):** `PlannerTask.endTime`, `PlannerTask.status`
- **Why a user wants it:** a block that slips by unnoticed is the moment to either move it or record a skip reason.
  The app already collects skip reasons (`SkipSummary`), so this nudge sends the user to a decision instead of a
  silently growing backlog.
- **Carried by:** R1's mechanism with a second kind (`("Portal","PlannerTaskMissed")`), registered at the end instant.
  It needs an extra rule so that a move to `InProgress` cancels the reminder. Today `SyncForPlannerTasksAsync` cancels
  only on `Completed` / `Cancelled`.
- **Gating:** its own `ReminderKindPreference` row, so it can be muted separately from N1; quiet hours.
- **Size:** M. Ranked last because it is noisier than N1 and comes after the moment that matters most.

### Considered and rejected

- `RoutineTodoListItemEntity.suggestedDays` / `.suggestedDayOfMonth`: already covered by P6.
- `RoutineTimePeriodEntity.streakGraceDays` (→ `StreakGraceUntil`): already covered by P5.
- `RoutineTodoListItemEntity.timePeriod`, `.lengthInDays`, `.resetAnchorDay`: already covered by P1–P3 (reset summary).
- `ScheduleTimerAlarmsRequest.boundaries[].boundaryAt` and the running timer's `endsAt`: already covered by P7.
- `RoutineTimePeriodEntity.freezeBudgetResetsAt`: a refilled freeze budget is nothing the user can act on.
- `completionHistory[].periodStart` / `.periodEnd`: in the past.
- `UserRoutineSettings.routineReviewDismissedForWeekStart`: the fresh-start review is in-app and shows on the next
  visit. A weekly push with no deadline behind it is a nag.
- `RepeatingPlannerTask.*` (recurrence, `activeFromDate` / `activeToDate`): a rule, not an occurrence. It becomes
  remindable once applied as a `PlannerTask`, which N1 covers.
- `SuggestionResponse.*`, `CalendarTaskSummary.*`: derived copies of rows covered above.
- `TemplatePlannerTask.startTime` / `.endTime`, `TaskPlannerDayTemplate.defaultWakeUpTime` / `.defaultBedTime`: no date
  until applied.
- `Calendar.bedTime`: it bounds the planner grid, and the user never asked to be told about it. A wind-down nudge would
  be a new feature, not a gap in the data.
- `Calendar.holidayKey` / `.holidayName`: context, not an obligation.
- `HistoryWindow.*`, `CalendarActivityDaySummary.wakeUpTime` / `.bedTime`, activityTracking chart windows: chart
  buckets and derived copies.
- `User.firstDayOfWeek`, `User.timezone`: context for other times.
- leisure (`MemoryAnchor.*`, estimates): no deadline, start or recurrence among them.
- activityTracking: everything is observed after the fact; no row is written by the user.
