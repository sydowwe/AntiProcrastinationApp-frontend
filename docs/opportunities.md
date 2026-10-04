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
7. **OP7. "Streak kept today" on the flame.** The server already sends `isTodayComplete`, and nobody reads it.
8. **OP8. Say when the longest focus block happened.** The strip has the times and shows only the length.

### OP7. "Streak kept today" on the flame
- **Source:** from data-map (backlog `PlannerStreak.isTodayComplete`)
- **Data it spends:** `PlannerStreak.isTodayComplete`
- **Where it would surface:** the NowBar flame chip and the planner widget's streak tooltip on home
- **Needs backend:** no
- **Size:** S
- **Value:** The flame shows a count. It doesn't say whether today still has to be earned, which is the one thing that
  would make the user act today. The class doc already asks consumers to read this field.

### OP8. Say when the longest focus block happened
- **Source:** from data-map (backlog `FocusBlock.startedAt/endedAt`)
- **Data it spends:** `FocusBlock.startedAt`, `.endedAt`
- **Where it would surface:** `ActivityFocusStrip`'s *Longest unbroken block* line ("1h 40m, 09:10–10:50")
- **Needs backend:** no
- **Size:** S
- **Value:** Knowing *when* deep focus happens is what lets someone plan hard work into that slot. The strip already has
  both times.

### OP9. Tell me which days a bulk apply failed on
- **Source:** from data-map (backlog `BatchOperationResult.results[]`)
- **Data it spends:** `BatchOperationResult.results[].calendarId`, `.succeeded`
- **Where it would surface:** the partial-success snackbar in `useBulkTaskAction.ts`, which could name the failed dates
  or select them on the calendar
- **Needs backend:** no
- **Size:** S
- **Value:** "Applied to 5 of 7 days" leaves the user hunting through a month for the two empty days, the kind of
  fiddly cleanup that gets put off.

### OP10. Show a repeating task's schedule, and why it is suggested today
- **Source:** from data-map (backlog `RepeatingPlannerTask` rule fields, echo; `SuggestionResponse` rule fields, unread)
- **Data it spends:** `RepeatingPlannerTask.scheduledDays`, `.scheduledDates`, `.activeFromDate`, `.activeToDate`,
  `.scheduledForDayTypes`, `.isActive`, and the same six on `SuggestionResponse`
- **Where it would surface:** a rule-summary column and dimmed inactive rows in `RepeatingTasksTab`, and a "why"
  caption on each suggestion in `RepeatingTasksSection` ("every Tue · until 30 Nov")
- **Needs backend:** no
- **Size:** S. Formatting only. The day-of-week labels exist (`useDayOfWeekOptions`).
- **Value:** Today the only way to check a recurrence is to open its dialog, and a suggestion appears with no reason
  given. A wrong rule then shows up as a suggestion on a day it shouldn't, with no clue why.

### OP13. Per-item time in the daily recap
- **Source:** from data-map (backlog `DailyRecap.items[].timeLoggedSeconds`)
- **Data it spends:** `DailyRecap.items[].timeLoggedSeconds`
- **Where it would surface:** `DailyRecapCard` rows on `/todo-list/:id`
- **Needs backend:** no
- **Size:** S
- **Value:** "Done today: 5 items, 2h logged" hides which item took the 2h. Per-row time is what makes the recap feel
  earned, and it feeds the user's own sense of estimates.

### OP14. Show the baseline behind each "+40%"
- **Source:** from data-map (backlog `ActivityStat.averageSeconds`, `HistorySummaryCard.averageSeconds`)
- **Data it spends:** `ActivityStat.averageSeconds` (four tracking ledgers), `HistorySummaryCard.averageSeconds`
- **Where it would surface:** tracking summary cards and history's Top Activities cards ("usually 25m", or a tooltip)
- **Needs backend:** no for tracking. For history, first confirm what `averageSeconds` holds: its DTO comment (B2) says
  the backend assigns the baseline daily average.
- **Size:** S
- **Value:** A percentage with no base reads as alarming or reassuring at random. The absolute baseline is what the user
  can compare to their day.

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
