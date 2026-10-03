# Data map

> Reconciled 2026-10-01 · commit `0e77f904` · from docs/data-map/{todo,planner,history,tracking,leisure,account}.md · app modules only
> (framework modules: docs/data-map/framework.md)
>
> The six extracts were taken at `4d890646`. The todo and history extracts also read uncommitted work (the timer-session
> feature, `todoList/` and `home/` edits) that has since landed. Source was read in this pass only to settle the
> disagreements listed under *Corrections*.

## How to read this

Every field has one final status. `spent`: read somewhere other than the form that wrote it. `echo`: shown back only by
the control that edits it. `unread`: parsed from a response, and nothing reads it. `write-only`: sent, and no response
returns it. `derived`: computed by the server, never sent by the client; it is always paired with spent or unread.
**Phantom** marks a key the client reads but the server never sends, so the value is always the default. This pass
classes every phantom as `unread` (see *Corrections* C7). For the full per-field tables, read the extract for the group:
[todo](data-map/todo.md), [planner](data-map/planner.md) (dayPlanner + activity), [history](data-map/history.md),
[tracking](data-map/tracking.md), [leisure](data-map/leisure.md), [account](data-map/account.md) (user + googleCalendar).

567 fields mapped. 121 are unspent: **62 unread · 35 echo · 24 write-only**. 63 of the 121 are unspent by design (filters,
credentials, duplicates) and are collected at the end of the backlog. The other **58 are the backlog.**

## Unspent data: the backlog

Grouped by module. Modules are ordered by their best entry, and entries within a module run from cheapest and most
valuable down.

### todoList

The module's strongest gap is not a client field: `RoutineTimePeriod.reminderLeadDays` is sent by the server and dropped,
and every save from `/routine-settings` wipes it. See *Server sends, client drops* G1.

- `TodoList.description` · **write-only, phantom both ways.** The list's description, typed in `TodoListForm` →
  Description. The client sends `description` and the server binds `Text`, and the server returns `text` while the
  client reads `description`. Nothing the user types is stored. Fixing the mapping gives `TodoListCard` a line saying what
  the list is for, and stops the form from discarding input.
- `DailyRecap.items[].timeLoggedSeconds` · unread (derived). Seconds logged against each item completed today.
  `DailyRecapCard` shows only the total, and could say "Write report: 42m" per row.
- `RoutineTimePeriod.historyDepth` · echo. How many past periods are kept, set in `TimePeriodForm`. The server trims
  `completionHistory` to it, so it is visible only as the heatmap's length. A "last N weeks" label would explain that length.
- `TodoList.category` · echo. Set in `TodoListForm`, read only by the same form's prefill. A category chip on
  `TodoListCard` would help when the category filter is "All".
- `TodoListCategory.listCount` · unread, **phantom**. The count badge (`TodoListCategoryPanel.vue:102`) and the
  delete-confirm detail are built, but the server never sends the count. Needs a server member.
- `RoutineTodoListItem.color` · unread, **phantom**. `fromJson` hard-codes `null`, so routine rows never get the accent bar
  the component supports. It could take `timePeriod.color` client-side.

### user (account) and googleCalendar

- `User.weatherLocation` · unread, and **no writer**. "Where I am", stored on `User`, accepted by `PUT /user/preferences`,
  returned by `GET /user/data` as an untyped passthrough, and the **only** input to `GET /leisure-weather-fit`. Nothing
  in `src/` declares, reads or sends it (`weatherLocation` has zero matches). Giving it a control is what turns on
  leisure's "good today" chip and the picker's weather exclusion and bonus (see C8).
- `LoginResponse.email` · unread, **phantom**. The password login response has no `email`, so `LoginView.vue:156` calls
  `userStore.login(undefined)` and a password sign-in never writes `auth.lastUsedEmail`. The next `/login` is not
  prefilled. A client-only fix: store the e-mail the user just typed.
- `UserSession.createdAt` · unread (derived). When each session started. The Active sessions row could say "signed in
  3 Sep", which is the minimum for noticing a sign-in from a new device.
- `User.lastLoginAt` · unread, **phantom**. The Appearance card's "Last login" row is `v-if`-gated on a value no backend
  user response carries. Needs a server member.
- `LoginRequest.stayLoggedIn` · write-only. Nothing shows which sessions are "remembered". Low value.

### dayPlanner

- `UserPlannerSettings.detailsPanelExpandedByDefault` · echo. The *Show details panel by default* toggle on the View
  Defaults tab. The server stores it, and no planner view reads it, so the toggle changes nothing.
- `PlannerStreak.isTodayComplete` · unread (derived). The server's verdict on whether today already counts for the
  planner streak. The class doc says to read it rather than compare counts, and nobody does. The NowBar flame could show
  "kept today" against "not yet".
- `BatchOperationResult.results[].calendarId`, `.succeeded` · unread (derived), 2 fields. The per-day outcome of a bulk
  template apply, copy-to-days or day-type change. The partial-success snackbar reads only the count. It could name the
  days that failed.
- `RepeatingPlannerTask.scheduledDays`, `.scheduledDates`, `.activeFromDate`, `.activeToDate`, `.scheduledForDayTypes`,
  `.isActive` · echo, 6 fields. The recurrence rule, set in `RepeatingTaskDialog` (and the table switch for
  `isActive`). The settings table shows only the recurrence *type*. A rule summary column ("Mon, Wed · until 30 Nov") would
  let the user check a rule without opening it.
- `SuggestionResponse.recurrenceType`, `.scheduledDays`, `.scheduledDates`, `.activeFromDate`, `.activeToDate`,
  `.scheduledForDayTypes` · unread (derived), 6 fields. The same rule, copied onto every repeating-task suggestion. The
  suggestion row could say why it is offered today.
- `PlannerTask.sourceTemplateTaskId` · unread (derived); `PlannerTask.isFromTemplate` · unread, **phantom**;
  `Calendar.appliedTemplateId` · unread (derived). Template origin. Only `appliedTemplateName` reaches the screen. A
  task block could say "from <template>", and the day's template name could link to the template. `isFromTemplate` can
  be derived client-side as `sourceTemplateTaskId != null`.
- `TaskPlannerDayTemplate.suggestedLocation` · echo. Where a template is meant to be used, set in the details form. The
  server's suggestion matcher ignores it (B27 §5). `DayTemplatePicker` could mark templates whose location matches the
  day's `Calendar.location`.

`home` also fetches `DayPlan.calendar` (`useTodayPlan.ts:437`) and reads none of it. That object is a wrapper, and each
of its fields is `spent` on the planner's own screens, so it is not in the 121. But it means home already holds today's
`label`, `dayType`, `holidayName`, `notes`, `weather` and `location` without showing any of them.

### activityTracking

- `FocusBlock.startedAt`, `.endedAt` · unread (derived), 2 fields. When the longest unbroken block happened. The focus
  strip states the block's length only. "1h 40m, 09:10–10:50" tells the user when they focus best.
- `DesktopProcessSummaryDto.processName`, `AndroidAppSummaryDto.packageName`, `DesktopTimelineSession.processName`,
  `AndroidTimelineSession.packageName` · unread (derived), 4 fields. The stable identifier, dropped by each view's `to*`
  mapper. Selection, `?selected=` and the details lookup are therefore keyed on the display name, and two desktop
  processes that share a product name collide (`DesktopPieChartSection.vue:175`). The server's `Key`/`Label` pair (G4)
  exists to fix exactly this.
- `DayTotals.totalVisits` · unread, **phantom**. The *Visits* row always shows "-". The server sends `TotalEntries`
  instead, which the client drops (G5).
- `DomainDetailsResponse.domain`, `.totalSeconds`, `.activeSeconds`, `.backgroundSeconds`, `.entries`, `.pages` · unread
  (derived), 6 fields. `getDomainDetails` has no caller. Wired up (and with its `fromJson` fixed, G7), it turns the flat
  page list into "which pages took the time".
- `ActivityStat.averageSeconds` · unread (derived), all four ledgers. The baseline average behind each card's ▲/▼ %.
  "+40%" says nothing without "usually 25m".
- `DesktopWindowTitleStats.activeSeconds`, `.backgroundSeconds`, `.fullscreenSeconds`, `.soundSeconds` · unread
  (derived), 4 fields. The per-window-title split. Only the total per title is shown.
- `UnifiedSummaryItem.sources`, `UnifiedWindowItem.sources` · unread (derived), 2 fields. Which ledgers recorded an item.
  The unified pie shows these as chips; the cards and the bar tooltip could too.
- `TrackerDesktopMapping.roleId` / `.categoryId` and the Android twins · unread, 2 fields. This client never writes a
  role/category target, but a rule that has one renders with a blank target, and `edit()` reopens it in *To ignored*
  mode (`DesktopSettingsView.vue:160-167`).

### activityHistory and historyDashboard

- `HistorySummaryCard.averageSeconds` · unread (derived). The same idea as tracking's `averageSeconds`. The DTO comment
  (B2) says the backend fills it with the *baseline* daily average, so check what it holds before showing it.
- `HistoryTimeOfDayHour.entries`, `HistoryTimeOfDayResponse.daysInRange` · unread (derived), 2 fields. How many sessions
  fall in an hour, and over how many days. The time-of-day insight could say "on 12 of 30 days" instead of only "most of
  your time". `daysInRange` is unused on purpose today (`useHistoryInsights.ts` comment), so this is a design change.

Not a status, but the history group's largest loss: **the timer's plan never reaches the server.** `durationMs`,
`focusMs`, `shortRestMs` and `longRestMs` are `spent` client-side and are lost when the session clears, after 12 h at the
latest. A countdown stopped early cannot be compared to what was planned. The embedded `TrackTimeDialog` path (timers
started from dayPlanner, todoList or the NowBar) also drops session, phase and outcome, and does not log pomodoro rest
at all (`TimerView.vue:226-229`, `PomodoroTimerView.vue:280-282`).

### leisure

- `ActivityBacklogProfile.memoryAnchorId`, `ActivityBucketListProfile.memoryAnchorId` · unread (derived), 2 fields. The
  latest anchor for the activity. The *Experienced* chip opens the anchor list filtered by `activityId` (O2's fix). It
  could open the exact memory instead.

`effortType` is `spent` only because the picker ranks on it. It is never displayed outside the form, and `BacklogTable`
has a dead `#item.effortType` slot with no column.

### activity

No backlog. Its three unread fields are deliberate (see the list below).

### Reverse gaps: shown, but nothing can capture it

Not in the 121 (their status is `spent`), but they are the same defect seen from the other side.

- `TodoListItemStep.note`: rendered by `BaseTodoListItemSteps.vue:57-60`. `TodoListStepsFormField` has no note input.
- `RoutineTimePeriod.freezeBudget`: shown in the freeze tooltip. `TimePeriodRequest` does not send it, so every save
  resets it to the server default and clamps `freezesRemaining` (G1).
- `User.weatherLocation`: above.

### Unspent by design: counted, not proposed (63)

- **Filter and query state, echo (22).** activityHistory: `date`, `endDate`, `rangeType`, `groupBy`, `windowMinutes`,
  `windowStartTime`/`from`, `windowEndTime`/`to`, `baseline`, `topN`, `CalendarActivityRequest.startDate`/`endDate`.
  activityTracking: `coverage`, `type`, `isActive`, `isIgnored`, `activityId` (settings), `dateFrom`, `dateTo`, `from`,
  `to`, `baseline`, `windowMinutes`, `sources` (dashboards). All are URL-synced and shown by the control that sets them.
- **Request parameters and code constants, write-only (8).** history `maxItems`, `CalendarActivityRequest.topN`;
  tracking `topN`, `focusGapSeconds`, `minPercent`, `minSeconds`; dayPlanner `PlannerTask.date` (readable via
  `Calendar.date`), `ApplyTemplateToTaskPlannerRequest.conflictResolution` (a command parameter).
- **Timer alarm push, write-only (8).** `ScheduleTimerAlarmsRequest.boundaries[].{boundaryAt, phase, phaseIndex,
  phaseTotal, cycleIndex, cycleTotal}`, `.url`, and the store's `alarmSessionId`. Push-only by design (DTO header).
- **Credentials and one-time codes, write-only (6).** `LoginRequest.recaptchaToken`, `PasswordSignInRequest.password`,
  `GoogleSignInRequest.code`, the password-change trio, `twoFactorAuthToken`, the Google Calendar `connect` `code`+`state`.
- **Diagnostic or superseded, unread (5).** `PlannerStreak.today`, `.timezone` (a `console.warn` tripwire, C6);
  `Category.canDelete` (the table confirms with `usageCount` instead); `ActivitySelectOptionCombination.taskPriorityOption`,
  `.routineTimePeriodOption` (the server always sends `null`; the form fetches both lookups itself,
  `useActivitySelectionFormState.ts:131-135`).
- **Duplicates of a value already shown, unread (11).** tracking: summary `totalSeconds` (W/U), pie `seconds` (A), pie
  `entries` and `windowTitles` (D), details `processName` (D), Android details `packageName`/`appLabel`/`totalSeconds`,
  bars `totalSeconds` (W/D). history: `CalendarActivityRoleSummary.roleId` (`roleName` is the key). dayPlanner:
  `DayPlan.date` (echo of the requested date).
- **Echo by function (3).** `TrackerDesktopMapping.isActive` / Android twin (the switch is both control and display, and
  its effect shows through `coveredBy`), `User.twoFactorEnabled`, `RegistrationRequest.twoFactorEnabled`.

## Server sends, client drops

30 response types have members the client drops: todoList 5, dayPlanner + activity 2, activityHistory 1,
activityTracking 14, leisure 5 (one with no client DTO at all), user 3. One was not checked: `ActivityFilterFormResponse`
(U3).

### Gaps

- **G1. `RoutineTimePeriodResponse.reminderLeadDays`, `.lastResetAt`** (todo). Both time-bearing. `reminderLeadDays` is
  "days before the reset to nudge about unfinished items; null = no nudge". The request side is worse:
  `TimePeriodRequest` omits `reminderLeadDays` and `freezeBudget`, both `init`-defaulted on the server's request, so
  **every create or edit from `/routine-settings` writes `reminderLeadDays = null` and resets `freezeBudget`**.
- **G2. `TodoListResponse.text`** (todo). The list description, lost in both directions (see the backlog).
- **G3. `AppUserDataResponse.weatherLocation`** (account). Copied through untyped, never read, never sent. It is the only
  input to the leisure weather fit (C8).
- **G4. `Key`, `Label` on every per-source tracking item** (tracking): `SummaryCardsData`, `DesktopProcessSummaryDto`,
  `AndroidAppSummaryDto`, `DomainPieData`, `DesktopProcessPieData`, `AndroidAppPieData`, `WindowActivity`,
  `DesktopWindowActivity`, `AndroidWindowApp`, `TimelineSessionDto`, `DesktopTimelineSession`, `AndroidTimelineSession`.
  The server added them (`IDashboardItem.cs`) so the client would stop selecting on six differently named fields. The
  client parses neither.
- **G5. `DayTotalsResponse.TotalEntries`** (tracking). Dropped, while the phantom `totalVisits` is rendered as "-".
- **G6. `LoginResponse.requiresTwoFactorSetup`; Google sign-in `requiresTwoFactor`, `requiresTwoFactorSetup`**
  (account). The client never branches on them, and the server's forced-setup step (`SetupTwoFactorForLoginEndpoint`)
  has no caller. A Google sign-in is always treated as complete.
- **G7. `DomainDetailsResponse.pages[].{Path, TotalSeconds, ActiveSeconds, BackgroundSeconds}`** (tracking). `fromJson`
  maps pages to `{url, seconds}`, and there is no `seconds` member, so per-page time is lost even at parse. Moot until
  something calls the endpoint.

### Deliberate or harmless

- `TodoListItemResponse.displayOrder`, `RoutineTodoListResponse.displayOrder`: rows arrive already sorted.
- `TodoListCategoryResponse.text`: nothing on any client writes it.
- `ActivityResponse.isOnTodoList`: hard-coded `false` on every nested projection, and unset on profile rows. It cannot be
  used until the server fills it (leisure C7 in its extract).
- `CalendarResponse.streak`: always `null`; `DayPlan.streak` is the source.
- `ActivityHistoryResponse.EndTimestamp`: the client recomputes start + length in two places. Harmless while lengths are
  whole minutes.
- Leisure profile rows: the flat lookup `…Id` duplicates, and the nested `activity` extras (`text`, `isUnavoidable`,
  `isArchived`, role/category ids and names). `ActivityInfo` is slim on purpose.
- `memory-anchor/{id}` leaves `hasBacklog`/`hasBucketList`/`backlogIsRepeatable` at defaults. Only the grid fills them (B6).

### Endpoints with no client caller

- `GET …/domain-details` (`getDomainDetails`, `activityTrackingApi.ts:45-55`).
- `/leisure/suggestion/draw`. The picker ranks client-side over the three grids.
- `SetupTwoFactorForLoginEndpoint` (G6).

### The reverse: the client reads what the server never sends

Phantoms: `TodoListCategory.listCount`, `RoutineTodoListItem.color`, `TodoList.description`, `PlannerTask.isFromTemplate`,
`DayTotals.totalVisits`, `SummaryCardsData.totalSeconds` (web ledger only), `User.lastLoginAt`, `LoginResponse.email`, and
the nested `sortOrder` on leisure lookup copies. `TemplatePlannerTask.gridRowStart`/`gridRowEnd`/`isDuringBackgroundTask`
are phantoms too, but deliberately: they are client layout state.

Type mismatches: `LookupResponse.sortOrder` is `string` client-side and `int` server-side, and `costTierIdsUpTo`
string-compares it, so `10` sorts before `2`. `TaskPlannerDayTemplate.defaultWakeUpTime`/`defaultBedTime` are nullable on
the server and non-null `Time` on the client. `RoutineTodoListItem.lastCompletedAt` is a non-nullable server `DateTime`,
so "never completed" arrives as `0001-01-01`, not `null`.

## Cross-module data flow

Reads only. Rows marked C<n> were added or changed by this reconcile.

| owner | reader | fields | purpose |
| --- | --- | --- | --- |
| activity | dayPlanner, todoList, activityHistory, home, leisure | `Activity.name`; `.text` (activityHistory, todoList) | the activity's label and description wherever it is referenced |
| activity | activityHistory, dayPlanner, leisure (C4) | `Role.name/text/color/icon` (leisure: `icon`, `color` via `ActivityInfo`) | role chip, planner task colour, leisure avatar |
| activity | home, activityHistory, dayPlanner, leisure (C4) | `Category.name/color/icon` | category chip, colour fallback, leisure subtitle and avatar |
| activity | activityTracking | `ActivityFilterFormResponse.text/roleId/categoryId` | mapping table's activity column, edit prefill |
| todoList | home | every `TodoListItemEntity` row field; `RoutineTodoListItemEntity.suggestedDays/suggestedDayOfMonth/doneCount/totalCount/isDone/timePeriod`; `RoutineTimePeriodEntity.text/color/isHidden/streak/bestStreak`; `DailyRecap.items[]` | to-do and routine widgets, today-only routine filter, earned-rewards strip |
| todoList | dayPlanner | `TodoListEntity.name`; `TaskPriority.text`; `TodoListItemEntity.activity/taskPriority/suggestedTime`; `RoutineTodoListItemEntity.suggestedTime/streak/totalCount/timePeriod`; `RoutineTimePeriodEntity.text/isHidden` | source picker, routine side panel, new task length |
| todoList | activity (C1, C2) | `TaskPriority.text`, `RoutineTimePeriodEntity.text` (via `fetchSelectOptions`) | priority and period selects in the activity-selection form |
| todoList | leisure (C1, C3) | `TodoListEntity.name`, `TaskPriority.text` (via `fetchSelectOptions`) | target list and priority for the shopping-list handoff |
| dayPlanner | home | `PlannerTask.startTime/endTime/status/isBackground/color/activity/skipReason/skipReasonKey/todoListItemId/actualStartTime`; `DayPlan.hasPlan`; `PlannerStreak.currentStreak/bestStreak` | now bar, planner widget, day strip, linked to-do sync, flame chip |
| dayPlanner | historyDashboard (C5) | `Calendar.dayType/label/wakeUpTime/bedTime/holidayKey/holidayName`, projected by the server into `CalendarActivityDaySummary` | sleep row and day-type marking on the history calendar |
| activityHistory | todoList | `ActivityLoggedTimeAggregate.totalSeconds/entryCount` | estimate-vs-actual calibration |
| activityHistory (store) | home | `runningTimerStore` session: `kind`, `activityName`, `paused`, `ended`, live clock | the "timer running" chip |
| historyDashboard | home | `HistoryPieChartItem.*`, `HistoryPieTotals.totalSeconds` | today's pie and "Total tracked" |
| leisure | todoList (home passes the DTO through) | `ActivityBacklogProfile.activity.name/durationMinutes/activityId` | reward pairing, gift chip, earned-reward label, reward timer length |
| user | dayPlanner, todoList, home, activityHistory, leisure, user (+ server) | `User.timezone` (via `useUserClock`) | day boundaries and now-lines in the user's zone |
| user | dayPlanner, activityHistory, activityTracking, todoList | `User.firstDayOfWeek` (via `useUserPreferences`) | week start |
| user | todoList, dayPlanner, historyDashboard, activity | `User.askBeforeDelete` (via `useDeleteConfirmation`) | whether a non-cascading delete confirms |
| user | activity, todoList, home, activityHistory (+ every scoped-storage consumer) | `User.id` | reset on account switch; storage-key scope |
| googleCalendar | dayPlanner | `configured`, `connected`, `syncedCount` | the sync button and its snackbar |
| user (server-side only) | leisure | `weatherLocation` → `WeatherFit.matchingWeatherDependencyIds` | weather fit; the input has no client writer (C8) |
| activityTracking | activityHistory, historyDashboard | no data: the `StackedBarsChart` component and the `BaselineType` enum | history draws its bars with tracking's chart |

Writes across modules: todoList, leisure and home create or patch `PlannerTask`s. dayPlanner and todoList write plain
`ActivityHistory` rows. leisure creates a `TodoListItem` with steps (the shopping handoff). Completing a linked planner
task ticks its to-do item.

What the flow shows:
- **activity is the spine.** Six modules read it. It reads back only two of todoList's lookups.
- **home is the hub.** It owns no DTO and reads six modules: todoList, dayPlanner, activityHistory, historyDashboard,
  leisure (through todoList) and user.
- **activityTracking and leisure are near-pure producers.** No module reads tracking *data*. Leisure has one reader,
  todoList, and never reads back which of its activities are paired as rewards.
- **todoList ↔ dayPlanner is the only two-way pair:** the source picker and routine side panel one way, the planner task
  dialog and linked-item sync the other.
- **user is a different kind of hub:** three preferences fan out to four to seven modules each.
- **Data moves through more than `api/` and `dto/`.** A grep for cross-module imports of `component/`, `store/` and
  `composable/` finds 25 distinct edges outside the sanctioned set (the three `core/user` composables and the
  `historyDashboard` ↔ `activityHistory` pair). Examples: home imports todoList's row components and `earnedRewardsStore`,
  todoList imports `dayPlannerStore` and `PlannerTaskDialog`, activityHistory imports tracking's `StackedBarsChart`, and
  `core/user` imports three dayPlanner stores. This is an observation for whoever audits the boundary, not a finding here.

## Time-bearing fields

**202 fields.** Of those, 17 are client-only state (never on the wire), 16 are filter state, and 2 are server-drops.

*What the time means* opens with one of these words, so the notification audit can filter on it:
- **deadline**: a point the user must act by. A reminder can be driven from it.
- **start** / **end**: a scheduled point on a known date. A reminder can be driven from it.
- **recurrence**: a rule that generates dated points. It can drive a reminder once expanded.
- **period**: a bounded window. Its boundary can drive a reminder.
- **lead time**: an offset that configures a reminder.
- **undated**: a time of day with no date (a template). It becomes a start/end only when applied.
- **duration**: a length, either an estimate/plan or an actual/observed figure. No reminder by itself.
- **audit**: when something happened. No reminder.
- **zone / date / filter**: context for the others.

| entity.field | module | what the time means | status |
| --- | --- | --- | --- |
| `TodoListItemEntity.dueDate` | todoList | deadline: the day an item is due | spent |
| `TodoListItemEntity.dueTime` | todoList | deadline: time of day on `dueDate` (optional; dialog default 09:00) | spent |
| `RoutineTimePeriodEntity.nextResetAt` | todoList | period: the end of the current routine period (next reset instant) | derived · spent |
| `RoutineTimePeriod.reminderLeadDays` | todoList | lead time: days before `nextResetAt` to nudge about unfinished items | **server-drop** (and wiped on save, G1) |
| `RoutineTodoListItemEntity.timePeriod` | todoList | recurrence: the period a routine item recurs in | spent |
| `RoutineTimePeriodEntity.lengthInDays` | todoList | recurrence: period length | spent |
| `RoutineTimePeriodEntity.resetAnchorDay` | todoList | recurrence: weekday or day-of-month the period resets on | spent |
| `RoutineTodoListItemEntity.suggestedDays` | todoList | recurrence: preferred weekdays inside the period | spent |
| `RoutineTodoListItemEntity.suggestedDayOfMonth` | todoList | recurrence: preferred day of month inside the period | spent |
| `RoutineTimePeriodEntity.streakGraceDays` | todoList | period: days after a period ends before its streak breaks | spent |
| `RoutineTimePeriodEntity.freezeBudgetResetsAt` | todoList | period: when the streak-freeze budget refills | derived · spent |
| `RoutineTimePeriodEntity.completionHistory[].periodStart`, `.periodEnd` (2) | todoList | period: past routine windows | derived · spent |
| `RoutineTimePeriodEntity.historyDepth` | todoList | period: how many past periods are kept | echo |
| `UserRoutineSettings.routineReviewDismissedForWeekStart` | todoList | period: the week the fresh-start review was dismissed for | spent |
| `TodoListItemEntity.suggestedTime` / `RoutineTodoListItemEntity.suggestedTime` | todoList | duration (estimate): how long the item takes | spent |
| `DailyRecap.items[].timeLoggedSeconds` | todoList | duration (actual): per item, today | derived · unread |
| `DailyRecap.totalTimeLoggedSeconds` | todoList | duration (actual): today's total | derived · spent |
| `RoutineTodoListItemEntity.lastCompletedAt` | todoList | audit: last completion (`0001-01-01` when never) | derived · spent |
| `DailyRecap.items[].completedTimestamp` | todoList | audit: when the item was ticked | derived · spent |
| `RoutineTimePeriod.lastResetAt` | todoList | audit: when the period last reset | **server-drop** |
| `PlannerTask.startTime` | dayPlanner | start: scheduled start on `Calendar.date` | spent |
| `PlannerTask.endTime` | dayPlanner | end: scheduled end on `Calendar.date` | spent |
| `PlannerTask.date` | dayPlanner | date: the day a task created outside a day view lands on (request only) | write-only |
| `RepeatingPlannerTask.startTime`, `.endTime` (2) | dayPlanner | start / end: time of day of each recurrence | spent |
| `RepeatingPlannerTask.recurrenceType` | dayPlanner | recurrence: kind of rule | spent |
| `RepeatingPlannerTask.scheduledDays`, `.scheduledDates`, `.scheduledForDayTypes` (3) | dayPlanner | recurrence: the rule (weekdays, days of month, day types) | echo |
| `RepeatingPlannerTask.activeFromDate`, `.activeToDate` (2) | dayPlanner | period: the window the rule is active in | echo |
| `SuggestionResponse.recurrenceType`, `.scheduledDays`, `.scheduledDates`, `.scheduledForDayTypes`, `.activeFromDate`, `.activeToDate` (6) | dayPlanner | recurrence / period: copies of the repeating task's rule | derived · unread |
| `CalendarTaskSummary.startTime`, `.endTime` (2) | dayPlanner | start / end: copies of a task's times for the month cell | derived · spent |
| `UserPlannerSettings.reminderMinutesBefore` | dayPlanner | lead time: minutes before a task's start for its reminder | spent |
| `TemplatePlannerTask.startTime`, `.endTime` (2) | dayPlanner | undated: a template task's times; dated only when applied | spent |
| `TaskPlannerDayTemplate.defaultWakeUpTime`, `.defaultBedTime` (2) | dayPlanner | undated: the template's waking window | spent |
| `TaskPlannerDayTemplate.scheduledDays` | dayPlanner | recurrence: weekdays the template is meant for | spent |
| `TaskPlannerDayTemplate.suggestedForDayType` | dayPlanner | recurrence: the day type the template is meant for | spent |
| `TemplateSuggestionResponse.patternLabel` | dayPlanner | recurrence: the weekday or day-type name a suggestion matched | derived · spent |
| `Calendar.dayType` | dayPlanner | recurrence: the day's classification, which both suggestion endpoints match on | spent |
| `Calendar.wakeUpTime`, `.bedTime` (2) | dayPlanner | period: the day's waking window (bounds the grid) | spent |
| `Calendar.date` | dayPlanner | date: the day | derived · spent |
| `Calendar.dayIndex` | dayPlanner | date: weekday index | derived · spent |
| `Calendar.holidayKey`, `.holidayName` (2) | dayPlanner | date: public-holiday marker | derived · spent |
| `DayPlan.date` | dayPlanner | date: echo of the requested day | derived · unread |
| `PlannerStreak.today` | dayPlanner | date: the server's "today" in the user's zone | derived · unread (diagnostic, C6) |
| `PlannerStreak.currentStreak`, `.bestStreak` (2) | dayPlanner | period: consecutive planned days | derived · spent |
| `PlannerTask.actualStartTime`, `.actualEndTime` (2) | dayPlanner | audit: when the task really started and ended | spent |
| `TaskPlannerDayTemplate.lastUsedAt` | dayPlanner | audit: last apply | derived · spent |
| `UserPlannerSettings.slotDurationMinutes` | dayPlanner | duration: grid granularity | spent |
| `PlanVsActualTrend.plannedMinutes`, `.actualMinutes` (2) | dayPlanner | duration (plan / actual): range aggregate | derived · spent |
| `SkipSummary.byStartHour[].hour` | dayPlanner | audit: start hour of skipped tasks (aggregate) | derived · spent |
| `ScheduleTimerAlarmsRequest.boundaries[].boundaryAt` | activityHistory | end: a timer or pomodoro phase boundary, absolute UTC. **Already drives a server push** | write-only |
| `ScheduleTimerAlarmsRequest.boundaries[].phase`, `.phaseIndex`, `.phaseTotal`, `.cycleIndex`, `.cycleTotal` (5) | activityHistory | descriptors of that boundary (push wording) | write-only |
| running timer `endsAt`, `scheduledAlarms` (2) | activityHistory | end: the live countdown's end; source of the alarm boundaries | client-only |
| running timer `startedAtEpoch`, `runningSince`, `phaseStartedAt` (3) | activityHistory | start: the live session | client-only |
| running timer `durationMs`, `focusMs`, `shortRestMs`, `longRestMs`, `focusPeriodsPerCycle`, `totalCycles` (6) | activityHistory | duration (plan): the session's planned lengths. **Never sent** | client-only |
| running timer `accumulatedMs`, `pausedRemainingMs`, `focusElapsedMs`, `restElapsedMs`, `segments` (5) | activityHistory | duration (actual): live elapsed and remaining | client-only |
| `TimerPreset.duration` | activityHistory | duration (plan): countdown length | spent |
| `PomodoroTimerPreset.focusDuration`, `.shortBreakDuration`, `.longBreakDuration` (3) | activityHistory | duration (plan): phase lengths | spent |
| `PomodoroTimerPreset.focusPeriodInCycleCount`, `.numberOfCycles` (2) | activityHistory | duration (plan): session structure, in periods | spent |
| `ActivityHistory.length` | activityHistory | duration (actual): whole minutes | spent |
| `ActivityLoggedTimeAggregate.totalSeconds` | activityHistory | duration (actual): lifetime per activity | derived · spent |
| `CalendarActivityDaySummary.totalSeconds`, `CalendarActivityRoleSummary.totalSeconds` (2) | historyDashboard | duration (actual): per day, per role | derived · spent |
| `HistoryGroupItem.totalSeconds`, `HistoryPieChartItem.totalSeconds`, `HistoryPieTotals.totalSeconds`, `HistorySummaryCard.totalSeconds` (4) | historyDashboard | duration (actual): aggregates | derived · spent |
| `HistoryPeriodComparison.previousPeriodTotalSeconds`, `.currentPeriodTotalSeconds` (2) | historyDashboard | duration (actual): period totals | derived · spent |
| `HistoryTimeOfDayHour.totalSeconds` | historyDashboard | duration (actual): per hour of day | derived · spent |
| `HistorySummaryCard.averageSeconds` | historyDashboard | duration (baseline average) | derived · unread |
| `HistoryTimeOfDayResponse.daysInRange` | historyDashboard | duration: range length in days | derived · unread |
| `ActivityHistory.startTimestamp` | activityHistory | audit: when the time was spent | spent |
| `ActivityHistory.phase` | activityHistory | audit: pomodoro focus or rest | spent |
| `HistoryTimeOfDayHour.hour` | historyDashboard | audit: hour of day (aggregate) | derived · spent |
| `CalendarActivityDaySummary.date`, `.dayType`, `.holidayKey` (3) | historyDashboard | date: the day, its planner day type, holiday marker | derived · spent |
| `CalendarActivityDaySummary.wakeUpTime`, `.bedTime` (2) | historyDashboard | period: the planner's waking window for the day | derived · spent |
| `HistoryWindow.windowStart`, `.windowEnd` (2) | historyDashboard | period: one chart window | derived · spent |
| query `date`, `endDate`, `rangeType`, `windowMinutes`, `windowStartTime`, `windowEndTime`, `baseline`, `CalendarActivityRequest.startDate/endDate` (8) | activityHistory | filter | echo |
| timeline `startedAt`, `endedAt` · W D A U (2) | activityTracking | audit: an observed usage session | derived · spent |
| `FocusBlock.startedAt`, `.endedAt` (2) | activityTracking | audit: the longest unbroken block | derived · unread |
| `AndroidAppDetailsResponse.firstUseUtc`, `.lastUseUtc` (2) | activityTracking | audit: first and last use in range | derived · spent |
| `AndroidAppDetailsResponse.days[].date` | activityTracking | date: per-day bucket | derived · spent |
| stacked-bars `windowStart`, `windowEnd` · W D A U (2) | activityTracking | period: one chart window | derived · spent |
| timeline `durationSeconds`, `totalSeconds` (2) | activityTracking | duration (observed): per session | derived · spent |
| stacked-bars `activeSeconds`, `backgroundSeconds`, `seconds` (A) (3) | activityTracking | duration (observed): per window | derived · spent |
| stacked-bars `totalSeconds` · W D | activityTracking | duration (observed): duplicate sum | derived · unread |
| pie `activeSeconds`, `backgroundSeconds`, `totalSeconds`; totals `totalSeconds`, `activeSeconds`, `backgroundSeconds` (6) | activityTracking | duration (observed) | derived · spent |
| pie `seconds` · A | activityTracking | duration (observed): duplicate of `totalSeconds` | derived · unread |
| `ActivityStat.seconds` | activityTracking | duration (observed): summary card | derived · spent |
| summary `totalSeconds` · W U, `ActivityStat.averageSeconds` (2) | activityTracking | duration (observed / baseline average) | derived · unread |
| desktop details `totalSeconds`, `activeSeconds`, `backgroundSeconds`, `fullscreenSeconds`, `soundSeconds`, `monitorBreakdown[].activeSeconds`, `windowTitles[].totalSeconds` (7) | activityTracking | duration (observed) | derived · spent |
| desktop `windowTitles[].activeSeconds`, `.backgroundSeconds`, `.fullscreenSeconds`, `.soundSeconds` (4) | activityTracking | duration (observed): per-title split | derived · unread |
| `DomainDetailsResponse.totalSeconds`, `.activeSeconds`, `.backgroundSeconds` (3) | activityTracking | duration (observed); endpoint uncalled | derived · unread |
| Android details `meanSessionSeconds`, `longestSessionSeconds`, `devices[].totalSeconds`, `days[].totalSeconds` (4) | activityTracking | duration (observed) | derived · spent |
| Android details `totalSeconds` | activityTracking | duration (observed): duplicate of the pie row | derived · unread |
| `FocusMetricsResponse.medianSessionSeconds`, `.longestGapSeconds`, `longestBlock.seconds` (3) | activityTracking | duration (observed) | derived · spent |
| `FocusMetricsBaseline.medianSessionSeconds`, `.longestBlockSeconds`, `.longestGapSeconds` (3) | activityTracking | duration (baseline) | derived · spent |
| `UnifiedSourceBreakdown.countedSeconds`, `.displacedSeconds` (2) | activityTracking | duration (observed): per source | derived · spent |
| query `dateFrom`, `dateTo`, `from`, `to`, `baseline`, `windowMinutes` (6) | activityTracking | filter | echo |
| query `focusGapSeconds`, `minSeconds` (2) | activityTracking | filter (constant / never set) | write-only |
| `MemoryAnchor.anchorMonth`, `.anchorYear` (2) | leisure | audit: the month an experience happened | spent |
| `ActivityBacklogProfile.durationMinutes` | leisure | duration (estimate): how long the activity takes | spent |
| `ActivityProjectProfile.estimatedHours` | leisure | duration (estimate): total project effort | spent |
| picker `suggestionHistory.suggestedAt` | leisure | audit: when a candidate was last offered (per device, pruned after 90 days) | client-only |
| `User.firstDayOfWeek` | user | recurrence: week start for calendars, presets and the weekly review | spent |
| `User.timezone`, `LoginRequest.timezone`, `RegistrationRequest.timezone` (3) | user | zone: resolves every other time | spent |
| `LoginRequest.stayLoggedIn` | user | duration: chooses the refresh-token lifetime | write-only |
| `AccountDeletionSummary.trackedTimeSpanDays` | user | duration: days of tracked history | derived · spent |
| `User.createdAt` | user | audit: account creation | derived · spent |
| `User.lastLoginAt` | user | audit: last sign-in | unread (phantom, C7) |
| `UserSession.lastUsedAt` | user | audit: session last used | derived · spent |
| `UserSession.createdAt` | user | audit: session start | derived · unread |
| `AccountDeletionSummary.trackedFrom`, `.trackedTo` (2) | user | audit: span of tracked history | derived · spent |

Per module: todoList 21 · dayPlanner 45 · activityHistory + historyDashboard 59 · activityTracking 60 · leisure 5 · user 12.

For the audit, three rows already carry reminder intent: `UserPlannerSettings.reminderMinutesBefore` (spent),
`RoutineTimePeriod.reminderLeadDays` (server-drop) and `ScheduleTimerAlarmsRequest.boundaries[].boundaryAt`, which already
produces a push. No activityTracking row is user-authored. Every one of them is observed after the fact.

## Per-module summary

Counts are fields after the corrections below. "derived" figures are already inside spent or unread.

- **todoList** (64; `home` is a reader only and has no DTOs). spent 58 (27 derived) · unread 3 · echo 2 · write-only 1.
  Read [todo](data-map/todo.md).
- **dayPlanner** (106). spent 81 (42 derived) · unread 15 · echo 8 · write-only 2. Read [planner](data-map/planner.md).
- **activity** (31). spent 28 (11 derived) · unread 3. Read [planner](data-map/planner.md), from *Activity* down.
- **activityHistory + historyDashboard** (111, one boundary unit). spent 87 (41 derived) · unread 4 · echo 10 ·
  write-only 10. Read [history](data-map/history.md).
- **activityTracking** (157). spent 109 (97 derived) · unread 31 · echo 13 · write-only 4. Read
  [tracking](data-map/tracking.md).
- **leisure** (40). spent 38 (7 derived) · unread 2. Read [leisure](data-map/leisure.md).
- **user + googleCalendar** (58). spent 45 (33 derived) · unread 4 · echo 2 · write-only 7. Read
  [account](data-map/account.md), which also lists 19 client-side storage keys.

## Corrections

### Made in this reconcile

- **C1. `TaskPriority.text` has two more readers.** activity (`useActivitySelectionFormState.ts:46,134`) and leisure
  (`ShoppingToTodoDialog.vue`) both read it through `taskPriorityApi.fetchSelectOptions`. The todo extract named both in
  its entity row but not in its cross-module table. Rows added. The status is unchanged.
- **C2. `RoutineTimePeriodEntity.text` has a reader no extract listed:** activity, through
  `timePeriodApi.fetchSelectOptions` (`useActivitySelectionFormState.ts:47,135`). Row added.
- **C3. `TodoListEntity.name` is read by leisure** (`ShoppingToTodoDialog.vue:75-76,104`, via `todoListApi`). Listed by
  the leisure extract (reader side), missing from the todo extract (owner side). Row added.
- **C4. `Role.icon/color` and `Category.name/icon/color` are read by leisure**, through `ActivityInfo.fromJson` →
  `ActivityNameCell.vue`, `SuggestionCard.vue`. Listed by leisure, missing from the planner extract's owner table.
  Readers added.
- **C5. `Calendar.dayType/label/wakeUpTime/bedTime/holidayKey/holidayName` are read by historyDashboard**, server-projected
  into `CalendarActivityDaySummary` (`HistoryDayCellContent.vue:13`, framework `CalendarDayCellHeader.vue`). Listed by the
  history extract, missing from the planner extract. Row added. `Calendar.label`, which the planner calendar shows only in
  the side panel, *is* in the history calendar's cell header.
- **C6. `PlannerStreak.today` and `.timezone`: classified differently, now `derived · unread`.** The planner extract said
  `derived · spent`. The todo extract said "console.warn tripwire only, not displayed". Settled from
  `src/core/home/composable/useTodayPlan.ts:385-392`: the only read is `assertServerDateAgrees`, which either returns or
  calls `console.warn`. Nothing user-facing reads either field. Both are listed as deliberate (diagnostic).
- **C7. Phantoms are classified one way.** The todo and planner extracts classed a field the client reads but the
  server never sends as `unread`. The tracking and account extracts classed the same kind of field `derived · spent`
  (dead). All are now `unread (phantom)`. A read exists, but it never receives a value, so no user ever sees one. Three
  fields moved: `DayTotals.totalVisits` (`ActivityDetailsPanel.vue:52`), `User.lastLoginAt`
  (`AppearanceSection.vue:56,125`), and `LoginResponse.email` (`LoginView.vue:156`).
- **C8. The leisure weather path is spent in code and starved of input.** The leisure extract classes
  `WeatherFit.matchingWeatherDependencyIds`, `weatherDependency` and `weatherDependencyCode` as `spent`, and they are: the
  "good today" chip, the picker's exclusion, the bonus and the reason all read them. The account extract shows the fit's
  only input, `User.weatherLocation`, has no client writer. Confirmed: `weatherLocation` matches nothing in `src/`.
  Statuses stand, but the conclusion changes. Unless the server falls back to something (U1), those features run on an
  empty location.

### Extract contradictions that change a conclusion

**Unit docs said "captured but not spent", and code says spent** (so none of these is backlog):
- todo-lists: `suggestedTime` shows on every row as a `~Nm` chip and sums into "~time left". `pairedLeisureActivityId` has
  a waiting-reward surface (`EarnedRewardsStrip` on home).
- todo-routine: `suggestedDays` / `suggestedDayOfMonth` decide the "Today" marker and home's per-day filter.
- planner-day: `Calendar.location/weather/notes` render in the month cell and the side panel. `skipReason` reaches home's
  *Skipped* chip, the plan-vs-actual block and the calendar's `SkipSummaryLine`.
- activity-settings: `Role.icon`/`Category.icon` have table columns (O1). `Role.systemKey` and `canDelete` drive the
  delete button and its tooltip.
- tracking-settings: `isActive` has an inline switch (O1). tracking-dashboards: the Android details panel exists (B23).
- leisure: `maxParticipants`, `financialGoal` and `inspirationSource` are spent. The anchor's source flags also drive the
  timeline's per-year breakdown.
- auth: the 2FA recovery codes are shown at registration. The `redirect` query param is read (`postLoginRedirect.ts:14`).

**Unit docs said "nothing unspent", and code says otherwise:**
- home "None": `DayPlan.calendar` is stored and never read, `DayPlan.date` and `PlannerStreak.isTodayComplete` are unread,
  and `today`/`timezone` feed only a `console.warn`.
- history-review "None": `HistorySummaryCard.averageSeconds`, `CalendarActivityRoleSummary.roleId`,
  `HistoryTimeOfDayHour.entries` and `HistoryTimeOfDayResponse.daysInRange` are unread, and `EndTimestamp` is dropped.

**A documented capability does not work:**
- todo-lists inventory: "create, rename, prefilled reopen confirmed end-to-end". The Description field in the same dialog
  never persists (G2).
- planner-day inventory and usecase imply *Show details panel by default* takes effect. No view reads it.
- tracking-dashboards: `DayTotals.totalVisits` is not "unpopulated in this seed". No backend member exists.
  `DomainDetailsResponse` is "fetched": it is never fetched.
- tracking-dashboards: dashboards are "keyed on `processName` / `packageName`". The client keys selection on the display
  name.

**History capture changed shape** (the docs predate the timer-session work): sub-minute length is discarded at capture,
not left unread. `endedAutomatically` became `outcome`, which is sent and spent. Timer and pomodoro now write
`POST /activity-history/session`. The timeline's "note" is the activity's description (`activity.text`). History rows
have no note field.

**Glossary is stale** (`docs/views/glossary.md`):
- `PlannerTask` "records `isFromTemplate` … so the origin survives". `isFromTemplate` is never sent, and
  `sourceTemplateTaskId` is unread.
- Leisure profiles "have `activityId` as their identity (`get id()`)". All three now carry their own `id`. The same stale
  claim survives in the `useLeisurePairing.ts` docblock. The code reads `activityId`, so it still behaves correctly.
- `isOneTime` / `backlogIsOneTime` are now `isRepeatable` / `backlogIsRepeatable`.
- *Distinct entries* are "not yet mapped". The grid lists every observed tuple and marks which rule covers each.

**Other code and doc claims:**
- `CLAUDE.md` (sanctioned-composables table) and the `useUserPreferences.ts:17` comment name `historyDashboard` as a
  `useUserPreferences` importer. It imports only `useDeleteConfirmation`. The cross-module import grep above confirms
  this.
- `userAugmentation.ts:5-9` says `firstDayOfWeek` "does not feed the planner calendar".
  `PlannerCalendarView.vue:136` reads it, as do three files in activityHistory and activityTracking.
- The planner group brief said the client never calls `GET task-planner-day-template/suggestions/{calendarId}`.
  `DayTemplatePicker.vue:231-240` has called it since 2026-09-24.
- `ActivityInfo.ts:15` / B6 say `/leisure/pick` uses `/leisure/suggestion/draw`. It ranks client-side, and nothing calls
  the endpoint.
- projects usecase / O1: the handoff should be "guarded by `isOnTodoList`". The field is never populated on those rows.
  The shipped handoff relies on the server's unique index and a 409.

## Unsettled

- **U1. What does `GET /leisure-weather-fit` do when `User.weatherLocation` is null?** If it returns an empty list, the
  client collapses that to `null` and every weather consumer in leisure is inert (C8). This needs a backend read. It also
  decides whether OP4 in `docs/opportunities.md` is a fix or an enhancement, and what format the location takes.
- **U2. `LoginResponse.email` is settled from static code only** (`BaseLoginEndpoint.cs:74,80`, `authStore.ts:69-71`).
  The account extract asks for a live check that a plain password sign-in leaves `auth.lastUsedEmail` unwritten.
- **U3. `ActivityFilterFormResponse` was never matched to a backend type** (the planner extract's search budget ran out),
  so its server-side drops are unchecked.
