# planner — data-map extract

> Extracted 2026-10-01 · commit `4d890646` · units: 07 `planner-day`, 08 `planner-templates`, 02 `activity-settings` · modules: `dayPlanner`, `activity`
> DTO files read: 58 · fields mapped: 137 · skipped by rule: ids, join-only FKs, transport wrappers
>
> Also skipped, and said once here: **filter/query request DTOs** (`PlannerTaskFilter`, `CalendarFilter`,
> `TemplatePlannerTaskFilter`, `PlanVsActualTrendFilter`, `ActivityFilter`, `NameTextFilter`). They shape a read and capture
> nothing. **Client-only value objects** that never cross the wire as a response (`ActivitySelection`,
> `ActivityFormSelectOptions`, `QuickActivityToolsDto`, `ActivityFormRequest` as form state, `ITimelineTask`). **Client-computed
> layout fields** (`gridRowStart`, `gridRowEnd`, `isDuringBackgroundTask`, `isTaskOneRow`). **Join-only FKs**: `PlannerTask.calendarId`
> (used only by `PlannerTaskLinkView.vue:68` to resolve a date), `TemplatePlannerTask.templateId`,
> `SuggestionResponse.repeatingPlannerTaskId` (list key only), `MergeActivitiesResult.survivorId`, the copy-day and batch id lists.
> Kept FKs that a view decides on: `PlannerTask.todoListItemId`, `UserPlannerSettings.defaultApplyTemplateId`,
> `Calendar.appliedTemplateId`, `BatchOperationResult.calendarId`, `ActivityFilterFormResponse.roleId/categoryId`.
>
> **Request ↔ response mapping.** Request fields that also come back in a response are folded into the response row, not given a
> row of their own. `PlannerTaskRequest`, `PatchPlannerTaskStatusRequest` → `PlannerTask`. `TemplatePlannerTaskRequest` →
> `TemplatePlannerTask`. `RepeatingPlannerTaskRequest` → `RepeatingPlannerTask`. `CalendarRequest` → `Calendar`.
> `TaskPlannerDayTemplateRequest` → `TaskPlannerDayTemplate`. `UserPlannerSettingsRequest` → `UserPlannerSettings` (1:1).
> `ActivityRequest`, `QuickEditActivityRequest` → `Activity`. `RoleRequest` → `Role`. `CategoryRequest` → `Category`.

## Summary

- **The unit docs undercount what is spent.** The planner-day `usecase.md` calls `Calendar.location/weather/notes` unspent, but all three render
  in the month cell (`CalendarDayCellContent.vue:21-88`) and the day's side panel (`DayDetailsPanel.vue:25-62`). The activity-settings
  `usecase.md` calls `Role.systemKey` and `Role/Category.icon` unsurfaced, and both claims are now stale. See *Contradictions*.
- **One true `echo` setting:** `UserPlannerSettings.detailsPanelExpandedByDefault`. The View Defaults tab writes it and the server stores it,
  but no planner view reads it. The toggle has no effect.
- **The richest unspent data is recurrence.** The six recurrence fields of `RepeatingPlannerTask` (`scheduledDays`, `scheduledDates`,
  `activeFromDate`, `activeToDate`, `scheduledForDayTypes`, `isActive`) are `echo` on the client. Only the server's suggestion matcher
  spends them. They come back on every `SuggestionResponse` too, and there all six are `unread`. They are the strongest time-bearing candidates
  for reminders in this group. `TaskPlannerDayTemplate.suggestedLocation` was the other `echo` until OP18, which spends it
  client-side in `DayTemplatePicker` (the server still ignores it, B27 §5).
- **Origin tracking is dead.** `PlannerTask.isFromTemplate` is parsed but never sent: the server's `PlannerTaskResponse` has no such member, so it
  is always `undefined`. `sourceTemplateTaskId` is sent but never read, and `Calendar.appliedTemplateId` is sent but never read. Only
  `appliedTemplateName` reaches the screen. No view can say "this task came from template X".
- **Skip data is now fully spent (C1).** The reason text and key reach the home *Skipped* chip and the day's plan-vs-actual block, and the
  server's `skip-summary` aggregate reaches the calendar's `SkipSummaryLine`. `PlannerStreak.isTodayComplete` is the one unread streak field.
- **Strongest cross-module reads:** `home` reads most of `PlannerTask` (status, times, skip reason, `todoListItemId`) and `PlannerStreak`.
  `Activity`, `Role` and `Category` (name, text, colour, icon) are read by `activityHistory`, `todoList`, `home`, `dayPlanner` and
  `activityTracking`. An odd ownership detail: the `calendar/*` API composable lives in `activityHistory/api/calendarApi.ts`, though every DTO it
  returns is `dayPlanner`'s.

## Entities

### Shared planner-task fields — `PlannerTask.ts`, `template/TemplatePlannerTask.ts`, `RepeatingPlannerTask.ts`, `SuggestionResponse.ts` (all via `IBasePlannerTask`) · request: `IBasePlannerTaskRequest.ts` (`PlannerTaskRequest`, `TemplatePlannerTaskRequest`, `RepeatingPlannerTaskRequest`)

Status is given for **day tasks and template tasks**. Both render through the shared `BaseTaskBlock.vue` / `BackgroundTaskBlock.vue`.
**Repeating tasks** override this: their settings table (`RepeatingTasksTab.vue`) shows only activity, colour, time, recurrence type and active,
so on the repeating entity itself `location`, `notes`, `importance` and `isBackground` are `echo`. They are still spent, because the server
copies them onto each `SuggestionResponse`, and `DayPlannerView.vue:339-346` (`handleAddSuggestion`) copies them into a real `PlannerTask`.

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `startTime` | `Time` | day grid drag / `PlannerTaskDialog`; template grid / `TemplatePlannerTaskDialog`; `RepeatingTaskDialog`; home widget *move later* (PUT) | grid block position; home `useTodayPlan.ts:139`, `DayStrip.vue:32`, `NowBar.vue`; `MiniTimeline.vue:62` | spent | yes |
| `endTime` | `Time` | same as `startTime` | same as `startTime`; home *give it longer* reads it back | spent | yes |
| `isBackground` | `boolean` | task dialogs ("Is background") | grid lane (`BackgroundTaskBlock`), `MiniTimeline.vue:57`; home `useTodayPlan.ts:122`; `OverdueTasksBanner.vue:90` | spent | — |
| `activity` | `Activity` | task dialogs (activity picker / quick edit) | task block name, role, category; home `DayPlannerWidget.vue:189-224` | spent | — |
| `location` | `string \| null` | task dialogs ("Location") | `BaseTaskBlock.vue:100-109` (visible line + a11y name), `BackgroundTaskBlock.vue:85` | spent | — |
| `notes` | `string \| null` | task dialogs ("Notes") | `BaseTaskBlock.vue:112-121` | spent | — |
| `importance` | `TaskImportance \| null` | task dialogs ("Importance") | `BaseTaskBlock.vue:45-51` (icon + colour), a11y name `:256`; `RepeatingTasksSection.vue:71-83` (text chip) | spent | — |
| `color` | `string` | server (the role's colour, `PlannerTaskResponse.cs`) | home `useTodayPlan.ts:241`; `MiniTimeline.vue:12`; `RepeatingTasksTab.vue:19`; `TemplateComparisonDialog.vue:77` | derived · spent | — |

### PlannerTask (day task only) — `src/core/dayPlanner/dto/response/PlannerTask.ts` · request: `PlannerTaskRequest.ts`, `PatchPlannerTaskStatusRequest.ts`

Captured from more places than the planner. `todoList` (`TodoListView.vue`, `RoutineToDoListView.vue`) and `leisure` (`useLeisureCommitment.ts`)
create tasks through `PlannerTaskRequest`. `home` patches status, times and skip reason. Applying a template, copying a day and adding a
repeating suggestion all write tasks too.

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `status` | `PlannerTaskStatus` | selection bar *Change status*, keyboard `D`, skip dialog; home `TaskActionMenu` (PATCH `…/status`) | grid status icon; `usePlanVsActual.ts:31`; home `DayPlannerWidget.vue:259-338`, `useTodayPlan.ts:128-416` | spent | — |
| `isDone` | `boolean` | server (`PlannerTask.IsDone`, toggled via `…/is-done` batch) | `OverdueTasksBanner.vue:90` (filters yesterday's tasks) | derived · spent | — |
| `actualStartTime` | `Time \| null` | *Log time* (`DayPlannerLogTimeController.vue:44-57`); home tracker `markInProgress`; leisure commit (`useLeisureCommitment.ts:88`) | `PlannerTaskBlock.vue:15-23`; `usePlanVsActual.ts:31-78`; home `useTodayPlan.ts:299-320` | spent | yes |
| `actualEndTime` | `Time \| null` | *Log time*; home *complete* (`useTodayPlan.ts:320`) | `PlannerTaskBlock.vue:15-23`; `usePlanVsActual.ts:68-78` | spent | yes |
| `isFromTemplate` | `boolean \| undefined` | — (never sent) | — | unread | — |
| `sourceTemplateTaskId` | `number \| null` | server (apply-template) | — | derived · unread | — |
| `skipReason` | `string \| null` | day planner skip dialog (`SkipReasonForm.vue`, user's own reasons or free text), via PATCH `…/status` | home `DayPlannerWidget.vue:332-334` (*Skipped: …* chip); `DayPlannerPlanVsActualBlock.vue:120-121` (reason groups); server `skip-summary` → `SkipSummaryLine.vue` | spent | — |
| `skipReasonKey` | `BuiltInSkipReason \| null` | home `TaskActionMenu.vue:73` (the three built-in reasons), via PATCH `…/status` | home `DayPlannerWidget.vue:333`; `DayPlannerPlanVsActualBlock.vue:121` | spent | — |
| `todoListItemId` | `number \| null` | `PlannerTaskDialog.vue:128-129` when planned from a to-do item (sent as `todolistId`) | home `useTodayPlan.ts:277` → `linkedTodoItemSync.ts` (completing the task ticks the item) | spent | — |
| `date` | `Date` (request only) | `PlannerTaskDialog.vue:116` when created from outside a day (to-do list) | — (no response member; the day is readable only via `calendarId` → `Calendar.date`) | write-only | yes |

Note on `skipReason` (B26, verified 2026-09-23): only `PATCH …/status` writes it. The full PUT still sends the field, but the server ignores
it, keeps it while the task stays `Cancelled`, and clears it when the status leaves `Cancelled`. Since B1 (landed 2026-09-28) a task carries a
`skipReasonKey` or a free-text `skipReason`, never both.

### TemplatePlannerTask — `src/core/dayPlanner/dto/response/template/TemplatePlannerTask.ts` · request: `template/TemplatePlannerTaskRequest.ts`

No fields beyond the shared set: it has times but no date, and that is the whole difference. `templateId` is skipped as a join FK. It *is*
written (`TemplateSplitView`'s cross-panel move PATCHes it), but no view displays it. See *Server sends, client drops* for the three layout
keys `fromJson` reads but the server never sends.

### RepeatingPlannerTask — `src/core/dayPlanner/dto/response/RepeatingPlannerTask.ts` · request: `RepeatingPlannerTaskRequest.ts`

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `isActive` | `boolean` | `RepeatingTasksTab.vue:41-47` (inline switch, its own editor) | — on the client; the server's suggestion matcher reads only active rows | echo | — |
| `recurrenceType` | `RecurrenceType` | `RepeatingTaskDialog` (4 tabs) | `RepeatingTasksTab.vue:30-38` (chip in the settings table) | spent | yes |
| `scheduledDays` | `DayOfWeek[]` | `RepeatingTaskDialog.vue:116-122` | — on the client (dialog only); the server spends it (`GetSuggestionsRepeatingPlannerTaskEndpoint`) | echo | yes |
| `scheduledDates` | `number[]` | `RepeatingTaskDialog` (day-of-month tab) | — on the client; server suggestions only | echo | yes |
| `activeFromDate` | `string \| null` | `RepeatingTaskDialog` (date-range tab) | — on the client; server suggestions only | echo | yes |
| `activeToDate` | `string \| null` | `RepeatingTaskDialog` (date-range tab) | — on the client; server suggestions only | echo | yes |
| `scheduledForDayTypes` | `DayType[]` | `RepeatingTaskDialog.vue:213` (day-type tab) | — on the client; server suggestions only | echo | yes |

### SuggestionResponse (repeating-task suggestion for a day) — `src/core/dayPlanner/dto/response/SuggestionResponse.ts` · request: none (`GET repeating-planner-task/suggestions/{calendarId}`)

The shared task fields are spent here: `RepeatingTasksSection.vue` shows activity, colour, times and importance, and `handleAddSuggestion`
copies `location`, `notes`, `importance` and `isBackground` into a new task.

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `sourceType` | `'UserSet' \| 'PlannedPattern' \| 'HistoryPattern'` | server | `RepeatingTasksSection.vue:26-52` (badge + `isAutomatic`) | derived · spent | — |
| `occurrenceCount` | `number \| null` | server | `RepeatingTasksSection.vue:64-67` | derived · spent | — |
| `recurrenceType` | `RecurrenceType` | server (copied from the repeating task) | — | derived · unread | yes |
| `scheduledDays` | `DayOfWeek[]` | server | — | derived · unread | yes |
| `scheduledDates` | `number[]` | server | — | derived · unread | yes |
| `activeFromDate` | `string \| null` | server | — | derived · unread | yes |
| `activeToDate` | `string \| null` | server | — | derived · unread | yes |
| `scheduledForDayTypes` | `DayType[]` | server | — | derived · unread | yes |

### Calendar (one day) — `src/core/dayPlanner/dto/response/Calendar.ts` · request: `CalendarRequest.ts` (+ `PATCH calendar/day-type/batch`)

Fetched through `activityHistory/api/calendarApi.ts` (`calendar/filter`, `calendar/day-plan/{date}`, by-date and by-id reads).

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `date` | `string` | server (rows are bulk-seeded per year) | `CalendarStatsBar.vue:72-84`, `CalendarDayCellContent.vue:112`, navigation `PlannerCalendarView.vue:314`, `PlannerTaskLinkView.vue:74` | derived · spent | yes |
| `dayType` | `DayType` | Day Details dialog (`CalendarDetailsDialog.vue:38`); bulk bar *Change day type* | `DayDetailsPanel.vue:21-24` (`DayTypeChip`); the server matches it for both suggestion endpoints | spent | yes |
| `dayIndex` | `number` | server | `CalendarDetailsDialog.vue:108` (natural weekday/weekend type) | derived · spent | yes |
| `label` | `string \| null` | Day Details dialog (`:27`) | `DayDetailsPanel.vue:9-14` (heading), and the month cell's header (framework `CalendarDayCellHeader`, rendered by `CalendarGrid` for every day) | spent | — |
| `holidayKey` | `string \| null` | server (B19) | `DayDetailsPanel.vue:44` via `useHolidayLabel()`; calendar holiday strip | derived · spent | yes |
| `holidayName` | `string \| null` | server | `DayDetailsPanel.vue:41` (gate + fallback text) | derived · spent | yes |
| `wakeUpTime` | `Time` | Day Details dialog (`:18`); day view start steppers | `CalendarDayCellContent.vue:9-17,46`; bounds the day grid (`DayPlannerView.vue:267`); `OverdueTasksBanner.vue:86` | spent | yes |
| `bedTime` | `Time` | Day Details dialog (`:19`); day view duration steppers | same as `wakeUpTime` | spent | yes |
| `appliedTemplateId` | `number \| null` | server (set when a template is applied) | — | derived · unread | — |
| `appliedTemplateName` | `string \| null` | server | `CalendarDayCellContent.vue:52-61`; `DayTemplatePicker.vue:177-187` (*Using template …*) | derived · spent | — |
| `weather` | `string \| null` | Day Details dialog (`:55`) | `CalendarDayCellContent.vue:65-75`; `DayDetailsPanel.vue:48-54` | spent | — |
| `notes` | `string \| null` | Day Details dialog | `CalendarDayCellContent.vue:77-88`; `DayDetailsPanel.vue:56-62` | spent | — |
| `location` | `Location \| null` | Day Details dialog | `CalendarDayCellContent.vue:20-31` (icon + label); `DayDetailsPanel.vue:25-37` | spent | — |
| `totalTasks` | `number` | server (live count) | `CellTaskProgress.vue`, `CalendarStatsBar.vue:65`, `DayPlannerProgressBlock.vue:12-25` | derived · spent | — |
| `completedTasks` | `number` | server | same as `totalTasks` (+ `completionRate` getter) | derived · spent | — |

### CalendarTaskSummary (month-cell task chip) — `src/core/dayPlanner/dto/response/CalendarTaskSummary.ts` · request: none (`POST calendar/task-summaries`)

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `startTime` | `Time` | server (from `PlannerTask`) | `CellTaskProgress.vue:59`, `MiniTimeline.vue:62` | derived · spent | yes |
| `endTime` | `Time` | server | same | derived · spent | yes |
| `isBackground` | `boolean` | server | `MiniTimeline.vue:57-58` (lane) | derived · spent | — |
| `color` | `string` | server | `MiniTimeline.vue:12-22` | derived · spent | — |
| `activityName` | `string` | server | `CellTaskProgress.vue:61` | derived · spent | — |

### DayPlan — `src/core/dayPlanner/dto/response/DayPlan.ts` · request: none (`GET calendar/day-plan/{date}`)

`calendar`, `tasks` and `streak` are wrappers around the entities mapped here and below.

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `date` | `string` | server (echo of the requested date) | — | derived · unread | yes |
| `hasPlan` | `boolean` | server (`Tasks.Count > 0`) | home `useTodayPlan.ts:439` → `NowBar.vue:163-309`, `DayPlannerWidget.vue:59-117` | derived · spent | — |

### PlannerStreak — `src/core/dayPlanner/dto/response/PlannerStreak.ts` · request: none (inside `DayPlan`)

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `currentStreak` | `number` | server | home `NowBar.vue:150-158,300`, `DayPlannerWidget.vue:40-47` | derived · spent | yes |
| `bestStreak` | `number` | server | home `DayPlannerWidget.vue:45` (tooltip) | derived · spent | yes |
| `isTodayComplete` | `boolean` | server | — | derived · unread | — |
| `today` | `string` | server | home `useTodayPlan.ts:386` (`assertServerDateAgrees`, console diagnostic only) | derived · spent | yes |
| `timezone` | `string` | server | home `useTodayPlan.ts:390` (same diagnostic) | derived · spent | — |

### TaskPlannerDayTemplate (template) — `src/core/dayPlanner/dto/response/template/TaskPlannerDayTemplate.ts` · request: `template/TaskPlannerDayTemplateRequest.ts` (+ `PATCH …/{id}/pinned`)

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `name` | `string` | `TaskPlannerDayTemplateDetailsForm` | `TemplateCard`, `DayTemplatePicker.vue:45,96`, apply-template selects, split-view selects | spent | — |
| `description` | `string \| null` | details form (`:33`) | `TemplateCard.vue:152-155`; `DayTemplatePicker.vue:121-127` | spent | — |
| `icon` | `string \| null` | details form | `TemplateCard`; `DayTemplatePicker.vue:39-44,97-100` | spent | — |
| `isActive` | `boolean` | `TemplateCard` switch; details form | list sections + dimming (`TemplateListView.vue:249`); `DayTemplatePicker.vue:255` (drops inactive suggestions); the server filters suggestions on it (B27 §3) | spent | — |
| `isPinned` | `boolean` | pin toggle (`PATCH …/pinned`; deliberately absent from the create/update body) | `TemplateListView.vue:273-277` (Pinned section) | spent | — |
| `usageCount` | `number` | server (incremented on apply) | `TemplateCard.vue:130`; *Most Used* sort `TemplateListView.vue:249` | derived · spent | — |
| `lastUsedAt` | `string \| undefined` | server (set on apply) | `TemplateCard.vue:131-132`; *Recently Used* sort `TemplateListView.vue:253-256` | derived · spent | yes |
| `suggestedForDayType` | `DayType` | details form (`:42`) | `TemplateCard.vue:44`, `DayTemplatePicker.vue:103`, `TemplateComparisonDialog.vue:41`; the server's suggestion pattern type 3 | spent | yes |
| `tags` | `string[]` | details form (`:57`) | `TemplateCard.vue:138-142`; `DayTemplatePicker.vue:129-142`; `TemplateComparisonDialog.vue:46` | spent | — |
| `defaultWakeUpTime` | `Time` | details form (`:17`) | `TemplateCard.vue:79-91`; `DayTemplatePicker.vue:117`; bounds the template grid (`TemplatePlannerPanel.vue:75`) and the apply preview (`dayPlannerStore.ts:71`) | spent | yes |
| `defaultBedTime` | `Time` | details form (`:24`) | same as `defaultWakeUpTime` | spent | yes |
| `scheduledDays` | `DayOfWeek[]` | details form (`:85`) | `TemplateCard.vue:102-107` (read-only strip); the server's suggestion pattern type 2 | spent | yes |
| `suggestedLocation` | `Location \| undefined` | details form (`:49`) | `DayTemplatePicker.vue` (matched against the day's `location`: chip, extra suggestion, preview line, OP18); the server's suggestions ignore it, B27 §5 | spent | — |

### TemplateSuggestionResponse — `src/core/dayPlanner/dto/response/template/TemplateSuggestionResponse.ts` · request: none (`GET task-planner-day-template/suggestions/{calendarId}`)

`template` is a wrapper around `TaskPlannerDayTemplate`.

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `patternType` | `0 \| 1 \| 2 \| 3` | server (B27) | `DayTemplatePicker.vue:264-282` (sentence choice, history vs settings) | derived · spent | — |
| `patternLabel` | `string` | server (invariant DayOfWeek / DayType name) | `DayTemplatePicker.vue:263-267` (translated chip) | derived · spent | yes |
| `occurrenceCount` | `number` | server | `DayTemplatePicker.vue:56-61` (history entries only) | derived · spent | — |

### UserPlannerSettings (module-scoped preferences) — `src/core/dayPlanner/dto/response/UserPlannerSettings.ts` · request: `UserPlannerSettingsRequest.ts` (`GET/PUT planner/settings`)

This is the third preference system in CLAUDE.md's *Where a preference lives*: settings meaningful only inside the planner, plus a template FK.
`remindersEnabled` and `reminderMinutesBefore` sit beside the reminder-preference system. Per `dayPlannerSettingsStore.ts:12-21` (B2), on the
server they only prefill a task reminder's lead time, and on the client they gate the in-tab nudge. Delivery itself belongs to reminder
preferences.

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `remindersEnabled` | `boolean` | `PlannerRemindersTab.vue:9` | `DayPlannerView.vue:174` (gates `useTaskReminders`); server prefill | spent | — |
| `reminderMinutesBefore` | `number` | `PlannerRemindersTab.vue:22` | `DayPlannerView.vue:173`; server reminder lead-time prefill | spent | yes |
| `detailsPanelExpandedByDefault` | `boolean` | `ViewDefaultsTab.vue:9` | — (store + its own tab only) | echo | — |
| `arrowKeyNavEnabled` | `boolean` | `ViewDefaultsTab.vue:15` | `useDayNavigation.ts:66` | spent | — |
| `predefinedSkipReasons` | `string[]` | `SkipReasonsTab.vue:50-51` | `SkipReasonForm.vue:3-7` (offered in the day planner's skip dialog) | spent | — |
| `slotDurationMinutes` | `number` | `ViewDefaultsTab.vue:23` | `DayPlannerView.vue:237` (grid granularity) | spent | yes |
| `defaultApplyTemplateId` | `number \| null` | `CalendarViewDefaultsTab.vue:9` | `PlannerCalendarView.vue:276` (seeds the apply-template bar) | spent | — |
| `defaultConflictResolution` | `ApplyTemplateConflictResolution` | `CalendarViewDefaultsTab.vue:16` | `PlannerCalendarView.vue:277` | spent | — |
| `defaultApplyPreviewMode` | `boolean` | `CalendarViewDefaultsTab.vue:22` | `PlannerCalendarView.vue:278` | spent | — |

### PlanVsActualTrend — `src/core/dayPlanner/dto/response/PlanVsActualTrend.ts` · request: `PlanVsActualTrendFilter.ts` (`POST planner-task/plan-vs-actual-trend`)

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `taskCount` | `number` | server | `PlanVsActualTrendLine.vue:16` (render gate) | derived · spent | — |
| `plannedMinutes` | `number` | server | `PlanVsActualTrendLine.vue:22` | derived · spent | yes |
| `actualMinutes` | `number` | server | `PlanVsActualTrendLine.vue:23` | derived · spent | yes |
| `startedLateCount` | `number` | server | `PlanVsActualTrendLine.vue:48-49` | derived · spent | — |
| `ranLongerCount` | `number` | server | `PlanVsActualTrendLine.vue:51-52` | derived · spent | — |
| `neverHappenedCount` | `number` | server | `PlanVsActualTrendLine.vue:54-58` | derived · spent | — |

### SkipSummary — `src/core/dayPlanner/dto/response/SkipSummary.ts` · request: `PlanVsActualTrendFilter.ts` (`POST planner-task/skip-summary`, C1 / captured-data B1)

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `skippedCount` | `number` | server | `SkipSummaryLine.vue:62-63` (render gate) | derived · spent | — |
| `reasons[].reason` | `string \| null` | server (grouped by exact text) | `SkipSummaryLine.vue:60` → `useSkipReasonSummary` → `topSkipReason` | derived · spent | — |
| `reasons[].reasonKey` | `BuiltInSkipReason \| null` | server | same | derived · spent | — |
| `reasons[].count` | `number` | server | same (ranking) | derived · spent | — |
| `byStartHour[].hour` | `number` | server | `skipRangeInsights.ts:69-76` (`lateSkipPattern`) | derived · spent | yes |
| `byStartHour[].plannedCount` | `number` | server | `skipRangeInsights.ts:72,75` | derived · spent | — |
| `byStartHour[].skippedCount` | `number` | server | `skipRangeInsights.ts:73,76` | derived · spent | — |

### TaskImportance (lookup) — `src/core/dayPlanner/dto/response/TaskImportance.ts` · request: none from any view (`useTaskImportanceCrud` exposes create/update, but no screen calls them)

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `text` | `string` | server (seeded lookup) | importance select; `RepeatingTasksSection.vue:83`; task a11y name `BaseTaskBlock.vue:256` | derived · spent | — |
| `color` | `string` | server | `BaseTaskBlock.vue:51`, `BackgroundTaskBlock.vue:35`, `RepeatingTasksSection.vue:72` | derived · spent | — |
| `icon` | `string \| null` | server | `BaseTaskBlock.vue:50`, `RepeatingTasksSection.vue:79` | derived · spent | — |
| `importance` | `number` | server | `BasePlannerTaskDialog.vue:153` (default selection = 400) | derived · spent | — |

### BatchOperationResponse — `src/core/dayPlanner/dto/response/BatchOperationResult.ts` · request: apply-template batch, `copy-to-days`, `day-type/batch`

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `succeededCount` | `number` | server | `useBulkTaskAction.ts:70-72` (partial-success snackbar) | derived · spent | — |
| `results[].calendarId` | `number` | server | — (which day failed is never shown; only `results.length` is read, `useBulkTaskAction.ts:71`) | derived · unread | — |
| `results[].succeeded` | `boolean` | server | — (only as `fromJson`'s fallback when `succeededCount` is missing) | derived · unread | — |

### Apply-template command — `src/core/dayPlanner/dto/request/ApplyTemplateToTaskPlannerRequest.ts`, `ApplyTemplateToTaskPlannerBatchRequest.ts` · response: `ApplyTemplatePlannerTaskResponse` (wrapper: `Calendar` + `PlannerTask[]`)

`templateId` comes back as `Calendar.appliedTemplateId/Name`, and `tasksFromTemplate` is a list of `PlannerTaskRequest`. Both are mapped
above. The command adds one field of its own.

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `conflictResolution` | `ApplyTemplateConflictResolution` | apply bar / bulk apply dialog / day-view apply bar (default from `UserPlannerSettings`) | — (a command parameter; nothing records which resolution was used) | write-only | — |

### Activity — `src/core/activity/dto/response/Activity.ts` · request: `ActivityRequest.ts`, `QuickEditActivityRequest.ts` (+ `PATCH …/archived`, `POST …/merge`, `POST …/clone`)

Captured in `ActivityForm` on `/activity-settings/activities`, and also by every quick-create / quick-edit path: the activity picker's `+`,
`QuickCreateActivityDialog` (leisure), the planner task dialog's *Quick edit activity*, and the to-do and tracking-mapping forms.
**Readers by module** (one representative file each; the full call-site list is longer):
`dayPlanner` → `BaseTaskBlock.vue`; `home` → `DayPlannerWidget.vue`; `todoList` → `BaseTodoListItem.vue`;
`activityHistory` → `HistoryRecordItem.vue`; `leisure` → `ActivityAutocompleteWithCreate.vue`; `activityTracking` → `DesktopMappingsTable.vue`
(through the slim `ActivityFilterFormResponse`, below).

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `name` | `string` | `ActivityForm`, quick-create, quick-edit | every module above: task blocks, history rows, to-do rows, home widget, pickers | spent | — |
| `text` | `string \| null` | `ActivityForm` ("Activity description"), quick-edit | `activityHistory/HistoryRecordItem.vue:75-79`, `HistoryDetailView.vue:419` (export); `todoList/BaseTodoListItem.vue:80`; activities table | spent | — |
| `isUnavoidable` | `boolean` | `ActivityForm` / `NewActivityForm.vue:57` | `ActivityTable.vue:84-88` only (*Unavoidable* column); no other module reads it or decides on it | spent | — |
| `role` | `Role` | `ActivityForm` role picker | see `Role` | spent | — |
| `category` | `Category \| null` | `ActivityForm` category picker, quick-edit | see `Category` | spent | — |
| `isArchived` | `boolean` | row archive toggle (`PATCH …/archived`) | `ActivityTable.vue:64,106-110,226` (dimming, icon); the server excludes archived rows from pickers | spent | — |
| `usageCount` | `number` | server (settings grid only; `0` when nested) | `ActivityTable.vue:81-82` (*Records*); `MergeActivitiesDialog.vue:71-99` | derived · spent | — |
| `canDelete` | `boolean` | server (settings grid only; `false` when nested) | `ActivityTable.vue:128-137,299` | derived · spent | — |

### Role — `src/core/activity/dto/response/Role.ts` · request: `RoleRequest.ts`

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `name` | `string` | `ActivityRoleForm` | roles table; `activityHistory/HistoryRecordItem.vue:46`, `HistoryDetailView.vue:416`; `dayPlanner/BaseTaskBlock.vue:85,252` | spent | — |
| `text` | `string \| null` | `ActivityRoleForm` | roles table; `activityHistory/HistoryRecordItem.vue:48-52` | spent | — |
| `color` | `string \| null` | `ActivityRoleForm` (`ColorPicker`) | roles table swatch; `activityHistory/HistoryRecordItem.vue:40`; `dayPlanner/BaseTaskBlock.vue:83,202`; becomes every planner task's server `color` | spent | — |
| `icon` | `string \| null` | `ActivityRoleForm` (`IconPicker`) | roles table Icon column (O1); `activityHistory/HistoryRecordItem.vue:44`; `dayPlanner/BaseTaskBlock.vue:82` | spent | — |
| `systemKey` | `SystemActivityRole \| null` | server (three system roles) | `ActivityRoleTable.vue:140` (delete tooltip says why); quick-create resolves roles by key via `GET activity-role/by-system-key` | derived · spent | — |
| `usageCount` | `number` | server (grid / by-id only) | `ActivityRoleTable.vue:142` (*in use by N* tooltip) | derived · spent | — |
| `canDelete` | `boolean` | server | `ActivityRoleTable.vue:37,139,151` (disables delete) | derived · spent | — |

### Category — `src/core/activity/dto/response/Category.ts` · request: `CategoryRequest.ts`

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `name` | `string` | `ActivityCategoryForm` | categories table; `home/DayPlannerWidget.vue:224`; `activityHistory/HistoryRecordItem.vue:66`; `dayPlanner/BaseTaskBlock.vue:95` | spent | — |
| `text` | `string \| null` | `ActivityCategoryForm` | categories table *Text* column only | spent | — |
| `color` | `string \| null` | `ActivityCategoryForm` | categories table; `home/DayPlannerWidget.vue:221`, `home/useTodayPlan.ts:241` (task colour fallback) | spent | — |
| `icon` | `string \| null` | `ActivityCategoryForm` | categories table Icon column (O1); `home/DayPlannerWidget.vue:222`; `activityHistory/HistoryRecordItem.vue:62`; `dayPlanner/BaseTaskBlock.vue:92-93` | spent | — |
| `role` | `string \| null` | server (`ActivityCategoryGridResponse.Role`: comma-joined roles of the category's activities) | categories table *Role* column (sortable via a server proxy) | derived · spent | — |
| `usageCount` | `number` | server (grid only) | `ActivityCategoryTable.vue:142-147` (cascade confirmation count) | derived · spent | — |
| `canDelete` | `boolean` | server | — (deliberately not read; the table confirms with `usageCount` instead, per the DTO comment) | derived · unread | — |

### ActivitySelectOptionCombination — `src/core/activity/dto/response/ActivitySelectOptionCombination.ts` · request: none (`GET {source}/form-select-options`)

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `roleOption` | `SelectOption` | server | `ActivitySelectsComposition.ts:37-75` (narrows the picker matrix) | derived · spent | — |
| `categoryOption` | `SelectOption \| null` | server | `ActivitySelectsComposition.ts:31-80` | derived · spent | — |
| `taskPriorityOption` | `SelectOption \| null` | server (hard-coded `null` on all three sources) | — | derived · unread | — |
| `routineTimePeriodOption` | `SelectOption \| null` | server (hard-coded `null`) | — | derived · unread | — |

### MergeActivitiesResult — `src/core/activity/dto/response/MergeActivitiesResult.ts` · request: `MergeActivitiesRequest.ts`

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `mergedCount` | `number` | server | `MergeActivitiesDialog.vue:129` (success snackbar) | derived · spent | — |
| `repointedCount` | `number` | server | `MergeActivitiesDialog.vue:130` | derived · spent | — |

### ActivityFilterFormResponse (slim activity on tracking mappings) — `src/core/activity/dto/response/ActivityFilterFormResponse.ts` · request: none of its own

Owned by `activity`. Its only importers are `activityTracking`'s `TrackerDesktopMappingResponse` and `TrackerAndroidMappingResponse`.

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `text` | `string` | server (the activity's name, per the mapping tables' column title) | `activityTracking/DesktopMappingsTable.vue:93`, `AndroidMappingsTable.vue:91` | spent | — |
| `roleId` | `number` | server | `activityTracking/DesktopSettingsView.vue:162`, `AndroidSettingsView.vue:158` (pre-fills the mapping edit form) | spent | — |
| `categoryId` | `number \| null` | server | `activityTracking/DesktopSettingsView.vue:163`, `AndroidSettingsView.vue:159` | spent | — |

## Cross-module reads
| field | owned by | read by (module → file) | what for |
| --- | --- | --- | --- |
| `PlannerTask.startTime/endTime/status/isBackground/color/activity` | dayPlanner | home → `composable/useTodayPlan.ts`, `component/DayPlannerWidget.vue`, `DayStrip.vue`, `NowBar.vue` | today's list, now/next, day strip, progress |
| `PlannerTask.skipReason/skipReasonKey` | dayPlanner | home → `component/DayPlannerWidget.vue:332-334` | the *Skipped: <reason>* chip |
| `PlannerTask.todoListItemId` | dayPlanner | home → `composable/useTodayPlan.ts:277` (`linkedTodoItemSync.ts`) | completing a task ticks its linked to-do item |
| `PlannerTask.actualStartTime` | dayPlanner | home → `composable/useTodayPlan.ts:299-320` | start/complete tracking from the home now-bar |
| `DayPlan.hasPlan`, `PlannerStreak.currentStreak/bestStreak/today/timezone` | dayPlanner | home → `composable/useTodayPlan.ts:386-445`, `component/NowBar.vue`, `DayPlannerWidget.vue:40-47` | empty-state choice, flame chip, server-date sanity check |
| `Calendar` (whole entity, via the API) | dayPlanner (DTO) | activityHistory → `api/calendarApi.ts` (hosts the `calendar/*` client for dayPlanner and home) | API ownership only; no `activityHistory` view reads a `Calendar` field |
| `Activity.name` | activity | dayPlanner → `component/BaseTaskBlock.vue`; todoList → `component/BaseTodoListItem.vue`; activityHistory → `component/HistoryRecordItem.vue`; home → `component/DayPlannerWidget.vue:189`; leisure → `component/ActivityAutocompleteWithCreate.vue:70` | labels everywhere an activity is referenced |
| `Activity.text` | activity | activityHistory → `component/HistoryRecordItem.vue:75-79`, `view/HistoryDetailView.vue:419`; todoList → `component/BaseTodoListItem.vue:80` | subtitle / export column |
| `Role.name/text/color/icon` | activity | activityHistory → `component/HistoryRecordItem.vue:40-52`; dayPlanner → `component/BaseTaskBlock.vue:82-85,202` | role chip, task block colour |
| `Category.name/color/icon` | activity | home → `component/DayPlannerWidget.vue:221-224`, `composable/useTodayPlan.ts:241`; activityHistory → `component/HistoryRecordItem.vue:62-66`; dayPlanner → `component/BaseTaskBlock.vue:92-95` | category chip, colour fallback |
| `ActivityFilterFormResponse.text/roleId/categoryId` | activity | activityTracking → `component/desktop/desktopSettings/DesktopMappingsTable.vue:93`, `view/DesktopSettingsView.vue:162-163` (and the Android twins) | mapping table's activity column, edit-form pre-fill |

## Server sends, client drops
| response DTO | backend type | dropped members | note |
| --- | --- | --- | --- |
| `Activity` | `AdhdTimeOrganizer.Core/…/activity/ActivityResponse.cs` | `isOnTodoList` | Also nested in every planner-task, repeating-task and suggestion payload, where the projections hard-code it to `false`. |
| `Calendar` | `AdhdTimeOrganizer.Planning/…/taskPlanner/CalendarResponse.cs` | `streak` | Always `null` in practice: `Projection` never sets it, and the `day-plan` route nulls it in favour of `DayPlan.streak`. |
| `PlannerTask` | `…/taskPlanner/PlannerTaskResponse.cs` | none at top level (nested `activity.isOnTodoList`, see `Activity`) | **Reverse gap:** `fromJson` reads `json.isFromTemplate`, which the server never sends (no member). |
| `TemplatePlannerTask` | `…/taskPlanner/template/TemplatePlannerTaskResponse.cs` | none | **Reverse gap:** `fromJson` reads `gridRowStart`, `gridRowEnd`, `isDuringBackgroundTask`, which the server never sends. They are client layout state, recomputed by the store. |
| `RepeatingPlannerTask` | `…/taskPlanner/RepeatingPlannerTaskResponse.cs` | none | — |
| `SuggestionResponse` | `…/suggestion/SuggestionResponse.cs` | none | Kept but unread: the six recurrence members (see entity table). |
| `CalendarTaskSummary` | `…/taskPlanner/CalendarTaskSummariesResponse.cs` (`PlannerTaskSummaryResponse`) | none | The envelope's `days[].calendarId` is consumed by `calendarApi.ts:54`. |
| `DayPlan` | `…/taskPlanner/DayPlanResponse.cs` | none | — |
| `PlannerStreak` | `…/taskPlanner/PlannerStreakResponse.cs` | none | — |
| `TaskPlannerDayTemplate` | `…/taskPlanner/template/TaskPlannerDayTemplateResponse.cs` | none | The server's `DefaultWakeUpTime`/`DefaultBedTime` are nullable; the client types them as non-null `Time`. |
| `TemplateSuggestionResponse` | `…/suggestion/TemplateSuggestionResponse.cs` | none | **The endpoint is called.** `DayTemplatePicker.vue:236` has called `GET task-planner-day-template/suggestions/{calendarId}` since 2026-09-24 (B27). It is not an unused endpoint. See *Contradictions* #5. |
| `UserPlannerSettings` | `…/taskPlanner/UserPlannerSettingsResponse.cs` | none | — |
| `PlanVsActualTrend` | `…/taskPlanner/PlanVsActualTrendResponse.cs` | none | — |
| `SkipSummary` | `…/taskPlanner/SkipSummaryResponse.cs` | none | — |
| `TaskImportance` | `…/taskPlanner/TaskImportanceResponse.cs` | none | — |
| `BatchOperationResponse` | `…/taskPlanner/CalendarBatchResultResponse.cs` | none | Kept but unread: per-row `calendarId` / `succeeded`. |
| `ApplyTemplatePlannerTaskResponse` | `…/taskPlanner/ApplyTemplatePlannerTaskResponse.cs` | none | — |
| `Role` | `AdhdTimeOrganizer.Core/…/activity/ActivityRoleResponse.cs` | none | — |
| `Category` | `…/activity/ActivityCategoryResponse.cs`, `ActivityCategoryGridResponse.cs` | none | `RoleSortKey` is `[JsonIgnore]`, so it is never sent. |
| `ActivitySelectOptionCombination` | `…/activity/ActivityFormSelectOptionsResponse.cs` | none | — |
| `MergeActivitiesResult` | `…/activity/MergeActivityResponse.cs` | none | — |
| `ActivityFilterFormResponse` | not located | — | Nested in the tracking-mapping responses; the search budget was spent on the planner types. |

## Opportunities
| id | unit | status | claim | fields involved |
| --- | --- | --- | --- | --- |
| O1 | activity-settings | fixed and verified (retest 2026-09-24, live) | Role/Category icon is captured and used elsewhere, but never shown in the settings tables themselves | `Role.icon`, `Category.icon` |

`planner-day` and `planner-templates` have no `opportunity` findings (`planner-templates/findings.md:6`: *opportunity 0*).

## Contradictions

1. **planner-day `usecase.md` §*Data this unit captures but does not spend*:** says `Calendar.location` / `weather` / `notes` have "no surface in
   this unit [that] reads them back (no day-details summary, no month-view tooltip…)". **Code:** all three render in the month grid cell
   (`src/core/dayPlanner/component/calendar/CalendarDayCellContent.vue:20-31` location, `:65-75` weather, `:77-88` notes) and in the day
   view's side panel (`src/core/dayPlanner/component/normal/DayDetailsPanel.vue:25-37`, `:48-54`, `:56-62`). They are `spent`.
2. **planner-day `usecase.md`, same section:** says `PlannerTask.skipReason` "feeds the plan-vs-actual 'never happened' bucket as a count
   only; the reason text itself is not surfaced anywhere in this unit". **Code (C1, plus B26 and captured-data B1):** the day's
   plan-vs-actual block lists the reasons (`DayPlannerPlanVsActualBlock.vue:50-84,120-121`), the calendar's `SkipSummaryLine.vue:60-63` shows
   the top reason over a range, and home shows it on the *Skipped* chip (`home/component/DayPlannerWidget.vue:246-251,332-334`). `skipReasonKey`
   is new since that doc was written. The doc is stale.
3. **activity-settings `usecase.md`, *Data this unit captures but does not spend*:** says `Role.icon` / `Category.icon` are not rendered by
   either settings table. **Code:** both tables now have an Icon column (O1, fixed and verified 2026-09-24). The O1 status note says its
   original "used elsewhere" evidence (`ActivitySelectionForm.vue:92`) was a hardcoded icon. The claim itself still holds through other
   files: `activityHistory/component/HistoryRecordItem.vue:44,62`, `dayPlanner/component/BaseTaskBlock.vue:82,92-93`,
   `home/component/DayPlannerWidget.vue:222`.
4. **activity-settings `usecase.md`:** says `Role.systemKey` is "never surfaced in the UI at all", and that the Roles table's Delete "doesn't
   read [`canDelete`] at all and renders enabled anyway" (also `inventory.md`'s Roles actions row). **Code:**
   `src/core/activity/component/activityRole/ActivityRoleTable.vue:37` disables Delete on `!item.canDelete`, and `:139-142` builds the tooltip
   from `systemKey` / `usageCount`. Both fields are `spent` (findings B7 is fixed; the use-case text was not updated).
5. **The group brief (`prompts/view-docs/phase4/b-planner.md`):** says "the client never calls
   `GET /task-planner-day-template/suggestions/{calendarId}`". **Code:** `src/core/dayPlanner/api/taskPlannerDayTemplateApi.ts:44-47`
   (`fetchSuggestions`) is called by `src/core/dayPlanner/component/normal/DayTemplatePicker.vue:231-240` on every calendar change and rendered
   at `:14-63`. It has been wired since 2026-09-24 (`prompts/view-docs/backend/_done/B27-*.md`, "Frontend half done the same day"). So it
   is not listed as an unused endpoint. The *repeating*-task twin (`repeating-planner-task/suggestions/{calendarId}`) is also called
   (`DayPlannerView.vue:320`).
6. **`docs/views/glossary.md`, planner vocabulary:** "`PlannerTask` records `isFromTemplate` and `sourceTemplateTaskId` so the origin survives."
   **Code / backend:** `PlannerTaskResponse.cs` has no `IsFromTemplate` member, so `PlannerTask.isFromTemplate` (`PlannerTask.ts:881`) is
   always `undefined`. `SourceTemplateTaskId` is sent, but nothing in `src/` reads it. The origin is stored but no view can show it.
7. **planner-day `inventory.md`, settings actions (*Show details panel by default*), and `usecase.md`** ("answers 'what will a new day/calendar
   view start out looking like'"): both imply the toggle takes effect. **Code:** `detailsPanelExpandedByDefault` is read only by its own tab
   (`ViewDefaultsTab.vue:9`), the settings store and the save request (`DayPlannerSettingsView.vue:109`). No planner view reads it, so the
   saved value changes nothing.

## Unsettled
None.
