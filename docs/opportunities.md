# Opportunities

> Reconciled 2026-10-01 · commit `0e77f904` · inputs: the *Opportunities* tables of docs/data-map/{todo,planner,history,
> tracking,leisure,account}.md, plus docs/data-map.md § *Unspent data* and § *Server sends, client drops*.
>
> Every one of the seven unit `O` findings is already fixed or built (see *Closed*). So every cluster below is
> `from data-map`: no unit agent proposed it. Each one covers at least one backlog entry or server-drop gap, and all 58
> backlog fields are covered. The 63 unspent-by-design fields (data-map.md § *Unspent by design*) get no opportunity.

## Top picks

1. ~~**OP1. Routine periods: warn before the reset, and stop saving over the warning.**~~ Done. See *Closed*.
2. ~~**OP2. Make "Show details panel by default" do something.**~~ Done. See *Closed*.
3. ~~**OP3. Keep what's typed into a list's description.**~~ Done. See *Closed*.
4. ~~**OP4. Tell the app where you are, so "good weather today" works.**~~ Done. See *Closed*.
5. ~~**OP5. Show today's day context on home.**~~ Done. See *Closed*.
6. ~~**OP6. Remember the plan when a timer stops early.**~~ Done. See *Closed*.
7. ~~**OP7. "Streak kept today" on the flame.**~~ Done. See *Closed*.
8. ~~**OP8. Say when the longest focus block happened.**~~ Done. See *Closed*.

### OP15. Show which template a task or day came from
- **Source:** from data-map (backlog `PlannerTask.sourceTemplateTaskId`, `.isFromTemplate`, `Calendar.appliedTemplateId`)
- **Data it spends:** `PlannerTask.sourceTemplateTaskId` (with `isFromTemplate` derived from it client-side),
  `Calendar.appliedTemplateId`
- **Where it would surface:** a small "from template" mark on task blocks. The *Using template …* line in
  `DayTemplatePicker` and the month cell becomes a link to the template.
- **Needs backend:** no
- **Size:** S
- **Value:** Telling a template task from a hand-added one is how a user sees whether their template still fits their
  days. The glossary already claims "the origin survives". This makes that true on screen.

### OP17. To-do lists and routine rows: category, counts and colour
- **Source:** from data-map (backlog `TodoList.category`, `TodoListCategory.listCount`, `RoutineTodoListItem.color`)
- **Data it spends:** `TodoList.category` (echo), `TodoListCategory.listCount` (phantom), `RoutineTodoListItem.color`
  (phantom; could take `timePeriod.color`)
- **Where it would surface:** a category chip on `TodoListCard`, the count badge in `TodoListCategoryPanel` (already
  built), and the accent bar on routine rows (already supported)
- **Needs backend:** yes, for `listCount`: the server must send it on `TodoListCategoryResponse`. The other two are
  client-only.
- **Size:** S
- **Value:** Small orientation cues. The count badge also restores the delete-confirm detail ("this category holds 4
  lists"), which is the safety half.

### OP18. Suggest templates by where you'll be
- **Source:** from data-map (backlog `TaskPlannerDayTemplate.suggestedLocation`)
- **Data it spends:** `TaskPlannerDayTemplate.suggestedLocation`, matched against `Calendar.location` (spent)
- **Where it would surface:** `DayTemplatePicker`, which could mark or float templates whose location matches the day's
- **Needs backend:** no for a client-side mark. Server-side ranking was put out of scope (B27 §5).
- **Size:** S
- **Value:** "Office day" vs "home day" templates are the obvious use of this field. Today the user sets it and nothing
  ever uses it.

### OP19. Sign-in history: when each session started, and the last login
- **Source:** from data-map (backlog `UserSession.createdAt`, `User.lastLoginAt`, `LoginRequest.stayLoggedIn`)
- **Data it spends:** `UserSession.createdAt`, `User.lastLoginAt` (phantom), `LoginRequest.stayLoggedIn` (write-only)
- **Where it would surface:** `/user/settings` → Active sessions ("signed in 3 Sep", "remembered"), and the Appearance
  card's "Last login" row (already built)
- **Needs backend:** yes, for `lastLoginAt` (no user response carries it) and for showing `stayLoggedIn` per session.
  `createdAt` is client-only.
- **Size:** S
- **Value:** A session list without start dates can't show the one thing it's for: a sign-in the user doesn't recognise.

### OP20. Tracking detail panels: show the splits already sent
- **Source:** from data-map (backlog `DesktopWindowTitleStats.*Seconds`, `Unified*.sources`)
- **Data it spends:** `DesktopWindowTitleStats.activeSeconds`, `.backgroundSeconds`, `.fullscreenSeconds`,
  `.soundSeconds`; `UnifiedSummaryItem.sources`, `UnifiedWindowItem.sources`
- **Where it would surface:** `DesktopProcessDetailsPanel` window-title rows; unified summary cards and the stacked-bar
  tooltip
- **Needs backend:** no
- **Size:** S
- **Value:** "Was that video playing in the background or watched fullscreen?" is the difference between noise and a
  lost evening. The source chips already exist on the unified pie.

### OP21. Time-of-day insight: how often, not only how much
- **Source:** from data-map (backlog `HistoryTimeOfDayHour.entries`, `HistoryTimeOfDayResponse.daysInRange`)
- **Data it spends:** `HistoryTimeOfDayHour.entries`, `HistoryTimeOfDayResponse.daysInRange`
- **Where it would surface:** the time-of-day insight on `/activity-history` ("mornings, on 12 of 30 days")
- **Needs backend:** no. But `daysInRange` is unused on purpose today (`useHistoryInsights.ts`), so this is a design
  decision, not a wiring fix.
- **Size:** S
- **Value:** "Most of your time is 9–11" can come from three long days. Frequency tells the user whether it's a habit.

### OP22. Mapping rules aimed at a role or category show their target
- **Source:** from data-map (backlog `TrackerDesktopMapping.roleId/categoryId` and the Android twins)
- **Data it spends:** `roleId`, `categoryId` on both mapping responses
- **Where it would surface:** the Mappings tab's target column, and `edit()` in `DesktopSettingsView` /
  `AndroidSettingsView`
- **Needs backend:** no
- **Size:** S
- **Value:** This client never creates such a rule. But one that exists renders blank and reopens as "ignored", so a
  save could silently turn it into an ignore rule. Worth it only if such rows exist in real data.

### OP23. "Experienced" opens the exact memory
- **Source:** from data-map (backlog `memoryAnchorId` on the backlog and bucket-list profiles; the leftover of
  leisure-backlog-picker O2, closed)
- **Data it spends:** `ActivityBacklogProfile.memoryAnchorId`, `ActivityBucketListProfile.memoryAnchorId`
- **Where it would surface:** `ExperiencedCell`'s link, opening the anchor itself rather than the list filtered by activity
- **Needs backend:** no
- **Size:** S
- **Value:** Small. For a one-time experience the filtered list usually holds one anchor anyway, which is why O2 was
  closed by `activityId`.

## Closed

- **OP14**, built 2026-10-04, in both repos. The tracking ledgers' `averageSeconds` was already the right number: the
  baseline's mean day multiplied out to the selected span (`BaseSummaryCardsEndpoint.ScaleToSpan`), so it sits on
  the card's own scale. **History's was not.** The B2 comment was right: `HistorySummaryCardsBuilder` sent the
  baseline's bare *daily* mean beside a *period* total, so on a 7-day range "usually 30m" would have sat under
  "3h 30m · ▲ 0%". The API now sends the baseline scaled to the reported period
  (`baselineTotal × dayCount / baselineDays`, multiplied before the divide, as tracking does), and `percentChange`
  is computed from `totalSeconds` against that same number rather than from two rounded daily means. On a one-day
  range both are unchanged. This is a response-meaning change only, with no migration, but the running API needs a
  restart to pick it up. `AverageSeconds_IsTheBaselineScaledToTheReportedPeriod` pins it on a 4-day range (7h over
  a 7-day baseline reads 4h, and 2h reads −50%). 33/33 pass across the history summary-card, group-identity and
  archived-read classes.
  On screen, `ActivityStatColumn` (desktop, web, Android and unified cards, both active and background columns) and
  history's `HistorySummaryCard` add a caption under the percentage: "usually 25m" / "zvyčajne 25m". It shows only
  when there is a percentage, so a NEW card or a zero baseline ("-") gets no caption. A base under a minute prints
  in seconds ("usually 45s"), the same fix as OP13's.
  Checked live on `/activity-tracking/desktop`: "JetBrains Rider 30m · ▲ 16.7% · usually 25m", with background
  columns reading the same way. The seed has no history before its own week, so every history card reads NEW. After
  the API restart, one 7h *Feature Development* row was added on 23 Sep (inside the last7days baseline of the
  8-day *Week* range over 4 Oct) through `POST /activity-history`. The real response carried `averageSeconds: 28800`
  (7h ÷ 7 × 8; the old code would have sent 3600) and `percentChange: -8.3`, and the card read "7h 20m · ▼ 8.3% ·
  usually 8h". No console errors. The row (id 15502) was left in the dev database. `e2e/tests/summary-card-baseline.spec.ts` (2 tests,
  route-patched) covers the tracking caption with a sub-minute base and a NEW card, and the history caption with a
  NEW card and a zero-base card. Both passed on 2026-10-04 (16 s).

- **OP13**, built 2026-10-04, app-side only. `DailyRecapItem` already sent and parsed `timeLoggedSeconds`, the
  seconds linked to that exact item (OP6's follow-up), so the backend did not change. `DailyRecapCard` replaces the
  comma-joined names with one row per item, in completion order: the name, then its time ("Write report 1h 30m"). An
  item completed with no recording shows only its name, which is the ordinary case and not a gap. A time under a
  minute prints in seconds ("40s"), because `fromSeconds` floors it to "0m". After five rows the rest fold behind
  "+ N more" / *Show less* (`aria-expanded`), so a full day cannot push the list itself down. The name and the time
  are separated by a real `&nbsp;`, not only a flex gap, which read "Gym45m" as text.
  Checked live with the recap response route-patched to seven items: the five rows, the toggle and the sub-minute
  row rendered as above. The real seed day showed one item with no time and no time label. No console errors.
  `e2e/tests/daily-recap-item-time.spec.ts` (2 tests, route-patched) covers the per-row times with a zero row and a
  sub-minute row, and the fold at five rows. Both passed on 2026-10-04 (16 s).

- **OP10**, built 2026-10-04, in both repos. Both responses already sent every rule field, and the day and day-type
  names on the wire already match the client enums, so no DTO changed. **"Needs backend: no" was wrong anyway:** the
  suggestions endpoint checked `activeFromDate` / `activeToDate` only on DateRange rules. A weekly, monthly or day-type
  rule with a window kept being suggested past its end date, so the new caption would have read "every Sun · until
  03.10." on 4 Oct. The window now bounds every type, and an unset bound is open. The validator's from ≤ to rule
  now applies to every type, not only DateRange. `WeeklyRule_OutsideItsWindow_IsNotSuggested` covers an ended window,
  a future one, and an open start with today as the inclusive end (15/15 in `RepeatingPlannerTaskSuggestionsTests`).
  This is a query change only, with no migration, but the running API needs a restart to pick it up.
  `useRecurrenceSummary` (`dayPlanner/composable/`) formats a rule as one line: "every Mon, Wed · until 30.11.",
  "on weekends", "days 4, 15 of each month", "on Workday, Weekend days", "01.10. – 15.01.2027". The year shows only
  when it is not the current one. `RepeatingTasksTab` gains a *Schedule* column, and a paused rule is dimmed
  everywhere except its switch. Each suggestion in `RepeatingTasksSection` gets a caption line with the rule that
  matched, followed by "seen N×" for a pattern suggestion (the count used to sit on the time line).
  **Fixed on the way:** the table's *Active* switch sent `{ isActive }` alone to the full-replace PUT, which the
  validator rejects for its missing activity and importance. It now sends the whole rule.
  Checked live with five rules created through the API: the table read as above, the switch PUT 200 and kept the
  importance and dates, and the row dimmed. On 4 Oct, the not-yet-restarted API suggested the ended Sunday rule, which
  is exactly the bug above. The other matching rules' activities were already planned that day. The rules were
  deleted afterwards. No console errors.
  `e2e/tests/repeating-task-schedule.spec.ts` (4 tests; it creates its rules through the API and deletes them) covers
  the *Schedule* line for all four types with their windows and the year rule, the switch's full-rule PUT with the
  importance and dates kept, the paused row dimmed while its switch is not, the caption on a matching rule, and a
  route-patched pattern suggestion reading "every Tue · seen 4×". The same test also asserts that an ended window
  and a future one are *not* suggested. On 2026-10-04, 3 of 4 passed. The fourth failed only on that window
  assertion: the running API had started at 20:55:05, 25 s before the endpoint fix was saved, so it still
  suggested both. It needs the API restart to pass.

- **OP9**, built 2026-10-04, in both repos. **The sizing note was wrong about the backend:** `calendarId` and
  `succeeded` say *which* day failed, but not *why*. On the day-type batch, the realistic failure is a week marked
  Workday, where Saturday and Sunday are refused, and "Sat 12.09. failed" alone reads like a bug. The API's
  `CalendarBatchResult` now carries a nullable `FailureReason` (`NotFound` / `DayTypeNotAllowed` / `Error`), set at
  every `Failed(...)` site of the three batch endpoints. This is a response field only, with no migration.
  `CalendarBatchEndpointTests`, `CalendarDayTypeRuleTests` and `ApplyTemplateEdgeTests` pin the reason on every failed
  row (48/48 pass). On `/day-planner`, all three partial snackbars (template apply, copy day, day type) now name the
  failed dates, grouped by reason, five per group before "+N more": "Day type updated — 1/3 days succeeded,
  2 failed. Sa 12.09., Su 13.09.: a weekend day cannot be a workday. The failed days are still selected." The
  day-type call site turns `DayTypeNotAllowed` into the specific direction (workday on a weekend, or weekend on a
  weekday). The snackbar stays up for 10 s and can be closed. The failed days stay selected in bulk-select mode, so
  the grid marks them. A `NotFound` day is left out of that selection because it has no cell. A clean batch closes
  the mode as before. An API without the field falls back to *could not be saved*.
  **Fixed on the way:** the bar's *Change day type* select was uncontrolled. Once the bar stayed open, it kept
  showing the last pick, and picking the same type again (the retry) emitted nothing. It is now pinned to `null`.
  `tasksCopyPartial` said "tasks succeeded", but it counts days.
  Checked live with the day-type response route-patched to add the reason, because the running API predates it:
  Fri–Sun → Workday gave the message above with 2 days selected, a second Workday pick fired again (0/2), and Fri
  alone showed "Day type updated for 1 day" and left bulk mode. After the API restart, the same Fri–Sun run against
  the real response, with no patch, gave the same message and the weekend-specific reason. No console errors. No e2e
  spec yet. The seed's
  Thu 10 and Fri 11 Sep were written as Workday during the check.

- **OP8**, built 2026-10-04, app-side only. `FocusBlockDto` already sent `StartedAt` / `EndedAt` and `FocusBlock.fromJson`
  already parsed them, so the backend did not change. `ActivityFocusStrip` adds a line under the block's label:
  "11:00–11:30" for one active day, and "Mon, 9/28, 11:00–11:30" once `daysWithActivity` > 1, because the clock times
  alone name no day. The times are server instants, so they go through `timeInUserZone`, and the day through
  `Intl.DateTimeFormat` in `userTimeZone`. The timeline axis does not, because its bounds are calendar-day values. A
  block with an unparseable time shows no line. Checked live on `/activity-tracking/desktop`: today showed
  "11:00–11:30" under "JetBrains Rider", which matches its timeline session, and *Last 30 days* read "Mon, 9/28, 11:00–11:30". No
  console errors. `FocusBlock.fromJson` turns a `null` or missing time into an Invalid Date, because
  `new Date(null)` is the epoch and printed "09:00–09:00" in a UTC+9 browser (`FocusBlock.test.ts`).
  `e2e/tests/focus-block-times.spec.ts` (4 tests, route-patched) covers the one-day line, the day prefix over several
  active days, and no line when the times are omitted or `null`. All 4 passed on 2026-10-04 (17 s). The account's
  zone follows the browser here (`syncBrowserTimeZone`), so the spec computes its expected strings in the page. Pinning
  the zone with a CDP override instead writes that zone onto the seed account.

- **OP7**, built 2026-10-04, in both repos. **The sizing note was wrong:** `isTodayComplete` alone could not say "today
  still has to be earned". Its `false` covers both an unfinished today, which breaks the run at midnight, and a today with
  nothing that counts (no tasks, or only optional, background or skipped ones), which cannot break it. Reading `false`
  as "at stake" would nag on every unplanned weekend. The API now also sends `PlannerStreakResponse.TodayOutcome`
  (`Empty` / `Complete` / `Incomplete`, the existing `PlannerStreakService.PlannerDayOutcome`), which the walk already
  computed and threw away. `isTodayComplete` stays. It is not a migration, just a response field.
  `PlannerStreakTests` pins all three outcomes, including a new background-only-today case (26/26 pass). On home, both
  flame chips (NowBar and the planner widget header) fill in (`warningDark`, flat) with a check once today is kept,
  and stay tonal otherwise. Both share one accessible name and tooltip from `useTodayPlan`: "Streaks: 4 · kept today /
  finish today's plan to keep it / nothing today can break it · Best: 9". Before this, the widget's tooltip showed
  only the best streak, and the NowBar chip only the count. An API without the field falls back to `Complete` or
  `Empty`, never to "at stake".
  Checked live with the day-plan response route-patched to each outcome: both chips carried the right label, variant
  and check mark. No console errors. No e2e spec yet. After the API restart, the real day-plan response carried
  `"todayOutcome": "Incomplete"` for the seed account's unfinished today. That account's streak is 0, so no chip
  showed there; the chip states were only seen with the patched response.

- **OP5**, built 2026-10-04, app-side only. `GET /calendar/day-plan/{date}` already projected every field through
  `CalendarResponse`, so the backend did not change and there is no extra request. `DayContextBar` sits under the
  planner widget's header on home. It renders outside the widget's `hasPlan` branches, so a holiday or a note still
  shows on a day with no plan. It shows the label, the holiday (through `useHolidayLabel`), the location, the weather,
  and the notes, which are clamped to two lines with the full text as a tooltip so they cannot push the task list off
  the no-scroll dashboard. The day type shows only when it differs from what the weekday implies, and a Holiday day
  type gives way to the holiday's own name. An ordinary day renders nothing. **Not spent:** `wakeUpTime` and `bedTime`.
  Every row carries them from the defaults, so they would show every day and say nothing.
  Checked live with the day-plan response route-patched: a label, a Vacation type, Travel, the weather and a
  three-line note rendered as one chip row plus a clamped note at 1440 px. A Holiday on an unplanned day showed its
  name above *Plan today*, with no "Holiday" chip. The real seed day showed no bar. No console errors.
  `e2e/tests/home-day-context.spec.ts` (4 tests, route-patched so the fixture stays read-only) covers the full context
  with the clamped note and its tooltip, a translated holiday on an unplanned day with no duplicate type chip, an
  ordinary workday rendering no bar, and a workday on a weekend showing its type. All 4 passed on 2026-10-04 (22 s).

- **OP3**, built 2026-10-04, in both repos. The server already stored a list's description as `text` (the shared
  `NameTextIconRequest`) and a step's `note` on every step path, so the contract did not change. `TodoListRequest`
  now sends `text`, and `TodoListEntity.fromJson` reads it back into `description`. Before this, the client sent and
  read `description`, so the text was dropped in both directions. **The backend did change in one place:**
  `TodoListValidator` had no length rule, so once the text started arriving, an over-long one would have hit Postgres
  as a 22001 and reached the form with no field to attach to. It now has `MaximumLength(EntityFieldLengths.Text)`
  (1000), and `TodoListDescriptionTests` pins the round trip through POST, PUT and GET, plus the 1000/1001 boundary.
  The form caps the textarea at 1000 with a counter. `TodoListStepsFormField` has a note toggle per step
  (`aria-pressed`, named by position like the move and delete buttons). It opens a note field under the step, and
  the field is already open when the step has a note. Clearing the field, or toggling again, drops the note.
  `TodoListItemStepRequest` turns a blank note into `null`, and both item dialogs rebuild their steps through it.
  Checked live: a list created with a description showed it on its card, the edit form opened with it, and an edit
  survived a reload. An item saved with two steps, where only one had a note, posted `"Oat, 2 litres"` and `null`.
  The note rendered under its step, and the edit dialog reopened with only that step's note field open.
  `e2e/tests/todo-list-description-step-note.spec.ts` (5 tests) covers the description on create (the POST carries
  `text`, the card shows it), the edit dialog prefill plus an edit surviving a reload, the 1000-character cap, a step
  note opening pre-filled while a blank one is sent as `null`, and toggling a note off clearing it on the server.
  All 5 passed on 2026-10-04 (24 s).

- **OP2**, built 2026-10-04, app-side only. The API already stored, returned and saved
  `detailsPanelExpandedByDefault`, so the backend did not change. `useRoutinePlacement` takes an optional
  `openByDefault` getter, and `DayPlannerView` passes the setting. A wide day view starts open or closed as saved. A
  compact one still starts closed. The setting is read through a watcher, so it applies after a full reload, when the
  settings arrive after mount. It also applies when the layout crosses the compact threshold. **The sizing note was
  wrong:** this was more than one read. A wide planner showed the panel whatever `panelOpen` said
  (`v-show="panelOpen || !compact"`), and its ✕ and the header's ☰ were compact-only, so there was nothing for the
  setting to close. The shell now obeys `panelOpen` at every width. The ✕ and the ☰ (day header, template header,
  and the template not-found alert) now show at every width, so the template planner's panel can be closed on a
  wide screen too. The setting itself stays day-view only, like the rest of *View Defaults*: the template planner
  always starts open.
  Checked live at 1600 px: with the setting off, the panel started closed after in-app navigation and after a full
  reload. ☰ opened it and ✕ closed it. With the setting back on (the seed value), it started open, and at 700 px it
  started closed. On template 20001, ✕ and ☰ closed and reopened the panel. No console errors. No e2e spec yet.

- **OP1**, built 2026-10-04, app-side only. The API already accepted, validated and returned both fields
  (`RoutineTimePeriodValidator`: lead 1 to length − 1 or null, budget 0–10), and `RoutinePeriodNudgeJob` already
  delivers the nudge, so the backend did not change. `TimePeriodRequest` now carries `freezeBudget` and
  `reminderLeadDays`, and `fromEntity` copies them. Before this, the server's full-replace update reset every edited
  period's budget to 2, capped the banked freezes to it, and switched the nudge off. `TimePeriodForm` gained
  *Nudge me before the reset (days)* (clearable, so empty = no nudge; disabled on a one-day period, which has no valid
  lead; clamped when the length shrinks) and *Skips per month* in the streak section. The history-depth max went from
  52 to the server's 100, so a deeper period no longer fails client validation on edit. `/routine-settings` shows both as
  columns. `freezeBudget` needs an explicit slot, because the framework table's key heuristic reads "budget" as money
  and printed `€2.00`. `RoutinePeriodTimeline` reads "🔔 nudge 29 Oct · 1 Nov" while the nudge is still ahead: a weekday
  within six days, a date beyond that. The edit path in `RoutineSettingsView` now assigns onto the entity instead of
  spreading it into a plain object, which dropped its getters. The freeze tooltip said "per period", but the server refills
  the budget **per calendar month**, so it now says that (EN and SK).
  **Not spent:** `lastResetAt` (the timeline derives the cycle start from `nextResetAt` − length, which is right for
  anchored periods; the reset job can stamp `lastResetAt` late on a catch-up read) and the heatmap's "last N periods"
  caption.
  Checked live on the seed account: saving Weekly with a budget of 3 and then a nudge of 2 sent both fields on both
  PUTs, and the budget survived the second save. A 3-day nudge on Monthly rendered "nudge 29 Oct · 1 Nov". A 1-day
  period shows the field disabled. Clearing the field sent `null`. All rows were restored to the seed's values afterwards.
  `e2e/tests/routine-period-nudge-skips.spec.ts` (4 tests) covers a rename keeping the budget, the banked skips and the nudge,
  clearing the nudge to `null` with a budget of 0, clamping the nudge when the period shrinks, and the disabled field on a
  one-day period. All 4 passed on 2026-10-04 (21 s).

- **OP16**, built 2026-10-04. The API already had `domain-details`, with ranked per-page times and integration tests
  (`TrackingDetailsEndpointsTests`). **Follow-up, same day, in the API:** with that list in use, the pie rows' own
  `pages` (web) and `windowTitles` (desktop) had no reader on either dashboard. They were every distinct URL or title
  over the span, unbounded, so both were removed (the backend review's `PERF-5`). The totals keep the distinct counts,
  and the parity tests now hold those against the details endpoints' lists. Selecting a domain on
  `/activity-tracking` now calls it, with the same envelope and daily window as the desktop and Android lookups. The
  call can be aborted, it is `_silent`, and it re-fetches when the range changes. `fromJson` parses `PageVisit`
  (`path`, `totalSeconds`, `activeSeconds`, `backgroundSeconds`). It used to map to a `seconds` member that does not exist.
  The page list sits **under the chart, at full section width**, not in the side panel. That column is about 155 px
  even at 1920 px, too narrow for a path. Each row is a link to the page (http(s) only) with its time and the full URL
  as a tooltip. It shows an "active · in background" caption when the page has background time, and five rows until
  "+ N more" is clicked. Time the pages do not cover is shown as *Without a page address*. Those entries were tracked
  to the domain only, and the endpoint leaves them out of `pages`. A domain with no pages at all says so. A 404 (a
  stale `?selected=`) has its own sentence and no retry. The day total's *Visits* row, a phantom that always read "-",
  is now *Entries* from `TotalEntries`.
  **Layout fix found on the way:** the web side panel was a `VCard` placed directly in the flex row. Its
  `overflow: hidden` drops the card's minimum width to 0, so at `lg` widths the pie (470 px, in a 424 px column)
  squeezed the panel to 2 px. *Close details* had zero width and could not be clicked. It is now wrapped in a
  `flex-fill` div, like the desktop and Android sections. The chart still overflows its column on all four dashboards
  (the `chart-column` class has no CSS anywhere). That part is not fixed here.
  Four route-mocked tests are in `e2e/tests/tracking-dashboards.draft.spec.ts` (request scope, ranking and "+ 2 more",
  the remainder, *Entries* instead of *Visits*), and they pass. The 404 and 500 states were checked against the live app
  with a `playwright-cli run-code` snippet. Checked live against the seed day: `github.com` read
  `/sydowwe/adhd-time-organizer/pulls` 23m plus 8m without a page, which matches the 1410 s and 484 s in the response.

- **OP11**, built 2026-10-03, app-side only. The API already sent `key`/`label` on all 12 per-source DTOs
  (`IDashboardItem`), so the backend did not change. All 12 client DTOs now parse the pair (`dto/DashboardItem.ts`).
  The shared view-models (`SummaryCardsData`, `PieSegment`, `StackedBarsInputItem`, `TimelineSessionDto`) carry
  `key` and `label` instead of one `domain`/`name` string. Selection, the details lookup and the colour hash read
  `key`, and only the printed text reads `label`. **`?selected=` changed meaning:** on desktop it holds the process
  name, on Android the package name. Web (domain) and unified (merged label) are unchanged. An old desktop or
  Android link that carries a display name selects nothing. Where two keys share a label in one panel, cards and
  legends print "Label (key)". The pie legend shortens the label, never the key. The timeline block's hover text
  and tooltip name the key too. The desktop details panel gained a *Process* row. The pie and the timeline used to
  hash different fields for desktop. They now both hash the process name. Covered by two route-mocked tests in
  `e2e/tests/tracking-dashboards.draft.spec.ts`: two `Microsoft Teams` processes get two cards, and the second one
  opens `ms-teams.exe`. The Android test now asserts `?selected=` is the package the details were fetched by.
  Checked live: all four dashboards, the collision through route mocks, and a desktop timeline click
  (`selected=rider64.exe`).

- **OP6**, built 2026-10-03, in both repos. The API gained one nullable `PlannedLength` (`IntTime`) on
  `ActivityHistorySession`, its request and its response, plus the GDPR export and migration
  `ActivityHistorySessionPlannedLength`. It holds the *focus* the timer was set for: a countdown's length, or a
  pomodoro's focus length × `plannedFocusPeriods`. Breaks are left out, and one period's length is that ÷ the count. It
  is optional and must be positive when sent, so pre-OP6 sessions read null. On screen: a countdown row stopped early
  reads "Stopped early: 12m of 25m planned", a pomodoro header that did not complete reads "Focus 37m of 1h 40m
  planned", and the Detail CSV gains a *Planned focus (s)* column. Embedded timers (`TrackTimeDialog`, from the planner,
  the to-do lists and home) now save through the session endpoint, so they keep `outcome`, the plan and a pomodoro's
  rest rows. The to-do undo deletes every row the session wrote. **Home had never saved tracked time at all**: since
  `c38fe75d` its dialog's `done` only refreshed the dashboard and dropped the result. It now writes it. The
  plan-vs-actual trend line is not built.
  **Follow-up, same day: the to-do link.** No history row had ever carried a to-do link. The client never sent one, on
  any path, so the daily recap showed every item at zero time however long its timer ran. The session request now
  takes `todoListItemId` / `routineTodoListId`, with the single create's rules (positive, never both, ownership-checked
  with a 404). The API stamps the link on the *focus* rows only, because a break is not the item's time. The client
  sends it from the to-do lists (manual log and timer, keyed by list kind), and from the planner and home when the
  task was planned from a to-do item. Covered by `TodoListItemDailyRecapTests` (a linked pomodoro credits 25 + 15
  minutes, not its 5-minute break) and two new `ActivityHistorySessionTests` cases.
  Checked live: a countdown stopped early from home's NowBar posted one `Timer`/`StoppedEarly` session with
  `plannedLength`, and Detail read *Stopped early: 1m of 1h 30m planned*. On `/todo-list/13002`, a quick-start timer
  stopped at 1m (session, `todoListItemId: 14012`) and a 20m manual log (single row, `todoListItemId: 14011`) put
  60 s and 1200 s on their items' recap rows ("3 things finished today — 21m logged"). Both undos then deleted their
  rows and reopened the items.

- **OP4**, built 2026-10-03, app-side only. The API already stored, validated (120 chars), returned and cleared
  (`''`) the field, so the backend did not change. `weatherLocation` is declared in `userAugmentation.ts` and read
  through `useUserPreferences`. `WeatherLocationField` on `/user/settings` → Preferences saves it on blur or Enter.
  `/leisure/pick` shows a dismissible "set your town" hint, but only while the field is empty *and* some candidate has
  a real weather dependency. U1 is settled (data-map.md): a null location means no signal, and there is no fallback.
  The geocoder resolves a town name or "Town, Country" in English, but not a country code. The field's hint says so,
  because a miss is silent. The privacy policy now names the location and the Open-Meteo lookup (§2, §12). Covered by
  `e2e/tests/weather-location.spec.ts` (8 tests). Checked against the live API: the fit went from `[]` to three ids
  once "Košice, Slovakia" was set.

- **OP12**, done 2026-10-03 (`_common` `439502d`, app `a7e56d9f`): `LoginView` honours `requiresTwoFactor` and `requiresTwoFactorSetup` on
  both the password and the Google answer. Forced setup calls `POST /auth/login/2fa/setup`, then shows the QR and the
  recovery codes, then the code dialog. A password sign-in writes `auth.lastUsedEmail` from the typed address. U2 is
  settled: `LoginResponse` has no `email`. Covered by `e2e/tests/two-factor-sign-in-setup.spec.ts` (forced setup) and
  the `lastUsedEmail` assertion in `auth.spec.ts`. The Google 2FA branch has no live coverage: a spec cannot
  drive the OAuth popup, and the server sends that branch only with `FederatedLoginSatisfiesTwoFactor = false`.
  Wiring the setup endpoint exposed two backend holes, closed in the same pass (API `framework` `892a6f7`, API `0b76121`).
  The setup endpoint handed an existing authenticator key to anyone who had passed the password step. Under
  `TwoFactorMode.Required`, the code step accepted any code for an account whose 2FA flag was off, and setup could not
  enrol that account.

- todo-lists **O1**, resolved 2026-09-12: estimate-vs-actual calibration lacked seed data. The fixture now delivers it,
  with passing specs.
- activity-settings **O1**, fixed 2026-09-24: Role and Category icons are shown in their settings tables.
- tracking-settings **O1**, built 2026-09-24: a mapping's `isActive` is editable inline on both Mappings tables.
- leisure-backlog-picker **O1**, fixed 2026-09-25: `maxParticipants` is shown (People column) and used by the picker.
- leisure-backlog-picker **O2**, fixed 2026-09-24: the anchor link navigates by `activityId`. The `memoryAnchorId`
  leftover is OP23.
- leisure-bucket-anchors **O1**, built 2026-09-24: `financialGoal`, `inspirationSource` and the anchor source flags are
  spent.
- leisure-projects **O1**, fixed 2026-09-25: the shopping-list → to-do handoff exists. It is guarded by the server's unique
  index, not `isOnTodoList`, which is never populated.

Not counted: tracking-settings **B5** (distinct entries mark covered tuples). It was filed as a bug, re-graded to
opportunity in `_fix-queue.md` §103, and has landed.
