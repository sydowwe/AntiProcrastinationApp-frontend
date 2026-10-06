# F2. Half-built backend capabilities

> Swept 2026-10-03 · frontend commit `e314b69c` (working tree dirty with unrelated `docs/views/` renames) · backend commit
> `ec4d018`, **clean** (framework submodule `9801384`).
>
> Inputs read: `prompts/feature-discovery/_RULES.md`, `docs/notification-audit.md` (the producer table is the dedupe list
> for notifications, reminders and the scheduler), `docs/opportunities.md`, `prompts/captured-data/README.md`, the index of
> every `prompts/_done/*/README.md`, `docs/data-map.md` § *Endpoints with no client caller*, `docs/data-map/leisure.md`, and
> targeted greps of `docs/views/_fix-queue{,-log}.md`.
>
> **Rechecked 2026-10-06** against backend `0409fa0` (clean, 30 commits after `ec4d018`) and frontend `15330036`. Every
> candidate's claims were re-opened, along with *Out of scope*. Results: F2-01, F2-03, F2-04, F2-05, F2-06, F2-08 and F2-10
> still hold, with some line numbers moved. F2-02 and F2-07 shifted, and F2-09 is partly built. *Out of scope* #3 and #7
> are fixed. Each change carries a dated note in place.

## Method

I swept every backend project except `framework/` (read only where the app wires it in), skipping `bin/`, `obj/` and
`Migrations/`. For each pattern:

1. **Columns nothing writes.** I listed every property on every entity under `*/domain/model/entity/`, then grepped for
   assignments (`Prop =`) outside DTO mapping, tests and seeders. Every hit got a second grep for logic readers.
2. **Enum members nothing produces.** I dumped every enum and grepped `Enum.Member` across production code.
3. **Uncalled endpoints.** I listed every literal route (`Get|Post|Put|Patch|Delete("…")`, 70 routes; the CRUD base
   classes aren't included) and grepped `src/` for each path segment, including the concatenated `${url}/…` forms.
4. **Uncalled methods.** A script listed every public method in `domain/service`, `application/service`, `*/helper`,
   `serviceContract` and `application/seam`, and kept those whose name appears in no other non-test file.
5. **Postponed work.** I grepped case-sensitively for `TODO|FIXME|HACK|NotImplementedException|NotSupportedException`, then
   grepped comments for "not yet", "for now", "future", "never read", "when it does" and similar.
6. **No lifecycle** and 7. **asymmetry.** I read the seams (`Core/application/seam`), the event handlers, the three
   suggestion materialized views and every ingest endpoint side by side.

I ran `git log -S` wherever intent was in doubt. I checked every candidate against both repos and the dedupe list.

**What came up empty:**
- Pattern 5: production code has **no** `TODO`/`FIXME`/`NotImplementedException`. The postponed decisions live in doc
  comments instead (F2-01, F2-10).
- Pattern 4: no domain service or helper is uncalled. The hits were records, constructors and `HolidayCalendar.ForYear`.

The strongest finds are asymmetries (pattern 7). The server built a capability for one source, one module or one client,
and its sibling never got it.

## Candidates

### F2-01. Phone time counts as activity time, the same as computer time
- **Moment:** in the evening, when the user opens history and finds the 90 minutes of phone reading they mapped to
  "Reading" missing, while the same reading on the laptop is there.
- **Today:**
  - Desktop heartbeats resolve each entry through the user's mapping rules and write the time into `ActivityHistory`.
    See `DesktopActivityHeartbeatEndpoint.cs:83` (`rules.Resolve`), `:109` (`attributionSink.AttributeAsync`) and `:179`
    (which raises `ActivityTimeRecordedEvent`, see F2-02).
  - The Android sync never reads the mapping table. `AndroidSyncEndpoint.cs:18` does not even take
    `IActivityTimeAttributionSink`.
  - The server documents the gap. `AndroidMappingRuleSet.cs:10`: *"⚠ Nothing on the ingest side reads this yet … an
    android rule is created, listed, edited and deleted and applied to nothing."*
    `FetchTableDistinctAndroidEntry.cs:61-63` adds: *"the sync does not apply the rules yet … see AndroidMappingRuleSet,
    which is where the sync should resolve from when it does."*
  - The B24 answer, recorded in `_fix-queue-log.md:6189-6192`, says nothing records whether this is "not yet" or "by
    design".
  - The client ships a full Android mappings UI (`androidActivityTrackingApi.ts:90`) whose rules change nothing but the
    `coveredBy` chip.
  - The web extension has no mapping entity at all. `WebExtensionActivityEntry` stores domains only, and the unified view
    (`Tracking/application/service/unified/*`) never touches activities.
- **Backend logic needed** (`.Tracking`):
  - In `AndroidSyncEndpoint`, resolve each stored session through `AndroidMappingRuleSet` (it already exists for exactly
    this).
  - For an activity-targeted rule, call `IActivityTimeAttributionSink.AttributeAsync` over the session's span, then raise
    `ActivityTimeRecordedEvent` with per-activity day totals, the way the desktop heartbeat does at `:170-179`.
  - Sessions are synced in batches and may overlap ones already stored. Attribution must be idempotent per
    `(DeviceId, PackageName, SessionStartUtc)`, the unique key `AndroidSessionDataConfiguration.cs:20` already enforces.
    Attribute only newly inserted rows.
  - Optional second step: a `TrackerWebMappingByPattern` (domain pattern → activity) with the same resolver shape. This is
    a new entity, so it is size L on its own.
- **Frontend surface:**
  - None new. Mapped phone time appears in `/activity-history`, the history calendar and every surface that already reads
    `ActivityHistory`.
  - `AndroidSettingsView`'s mappings tab starts meaning what it says. The B24 chip copy ("a rule exists that would match")
    can drop its caveat.
- **Data it runs on:** `AndroidSessionData`, `TrackerAndroidMappingByPattern` (both existing). No new input; the user has
  already written the rules.
- **Size:** backend M (Android only); L with web mappings. Frontend S (copy only).
- **Risks / open questions:**
  - **Double counting.** A user mapping Chrome on desktop and Chrome on Android to the same activity gets both. The
    unified view has an overlap rule (`TrackingSource.cs`: web > desktop > android), but `ActivityHistory` has none. The
    owner must decide whether attribution respects that precedence.
  - **Late batches.** Phones sync late, so attribution lands hours after the fact. F2-02's automation then fires on a past
    day; it should be limited to "today".
  - Mapping rules edited after the fact are not re-applied, the same as desktop today.
  - **Still open (checked 2026-10-06, backend `0409fa0`).** `AndroidSyncEndpoint` still takes no attribution sink, and
    the `AndroidMappingRuleSet.cs:10` warning stands. The heartbeat's references have moved: `rules.Resolve` is at `:88`,
    `AttributeAsync` at `:114`, and the event at `:196-202`. **New constraint:** the event now requires the user's local
    `Day`, `WindowStart` and `WindowEnd`, and its remarks name the Android sync as a future publisher that must resolve
    the zone first (`ActivityTimeRecordedEvent.cs:25-28`). Skipping that step reintroduces the heartbeat's UTC-day bug, which has since been fixed.
- **Dedupe:** new. B24 (`prompts/view-docs/backend/_done/B24-…`) found the gap and explicitly deferred it. The tracking
  set (`_done/activity-tracking` R4, U4) never applied rules at ingest.
- **Pattern:** 7 (also 1: the rules table is written, and nothing on the ingest side reads it)

### F2-02. Time logged anywhere ticks off the plan, not only desktop-tracked time
- **Moment:** right after a 25-minute pomodoro started from `/activity-history/pomodoro` or the NowBar, when the planner
  block for that same activity still reads *Not started*.
- **Today:**
  - `ActivityTimeRecordedEventHandler.cs:59-85` is a finished automation: from logged seconds it completes (or starts) the
    day's planner task. With no planner task it completes the to-do or routine item whose `SuggestedTime` is covered
    (`:88-110`), and it fans out `PlannerTaskIsDoneChangedEvent`.
  - The **only** publisher is `DesktopActivityHeartbeatEndpoint.cs:179`. A grep for `PublishAsync` in
    `.History/application/endpoint` and the rest of `.Tracking/application/endpoint` finds none.
    `CreateActivityHistoryEndpoint`, `CreateActivityHistorySessionEndpoint` and `AndroidSyncEndpoint` never raise it.
  - The client covers a few paths by hand:
    - `LogTimeController.vue:86` marks a planner task in progress when its own dialog starts a timer.
    - `BaseTodoListLogTimeController.vue:80` toggles the item after logging.

    A timer started anywhere else completes nothing.
- **Backend logic needed:**
  - `.History`: raise `ActivityTimeRecordedEvent` after `CreateActivityHistoryEndpoint` and
    `CreateActivityHistorySessionEndpoint` commit, with day totals from `IActivityTimeAttributionSink.TotalSecondsOnDayAsync`
    in the user's zone.
  - `.Tracking`: raise it from the Android sync once F2-01 lands.
  - The handler is host-side by design (its remarks explain why), so nothing moves.
- **Frontend surface:** the day planner, the home `DayPlannerWidget` and the to-do and routine lists, after their next
  read. No new UI.
- **Data it runs on:** `ActivityHistory`, `PlannerTask`, `TodoListItem.SuggestedTime`, `RoutineTodoList.SuggestedTime`. No new
  input.
- **Size:** backend S–M; frontend S (remove or adjust the client-side toggles).
- **Risks / open questions:**
  - **Collision with the client's toggle.** `BaseTodoListLogTimeController.vue:80` sends `toggle-is-done` with **no**
    `forceValue`. If the server has just auto-completed the item, the client's toggle un-completes it. The client must
    switch to `forceValue: true` in the same change.
  - Automation keyed on activity alone (`ActivityTimeRecordedEventHandler.cs:61`) can complete the wrong one of two items
    that share an activity. It is acceptable for desktop's ambient time; it is more visible for deliberate timers.
  - **Recommendation:** key the automation on the item link when the row carries one. The client has sent
    `todoListItemId` / `routineTodoListId` since `f522b0c9` (see *Out of scope* #1).
- **Still open, but the handler changed (checked 2026-10-06, backend `0409fa0`, mostly `c96d678`).**
  - *Still true:* the heartbeat is the only publisher (`DesktopActivityHeartbeatEndpoint.cs:196`). There is no
    `new ActivityTimeRecordedEvent` anywhere else in production code. The client's toggle still sends no `forceValue`
    (`BaseTodoListLogTimeController.vue:80`).
  - *Changed:* the event now carries `WindowStart`/`WindowEnd` on the user's clock (`ActivityTimeRecordedEvent.cs:42-47`),
    so a History publisher must resolve the user's zone and send the logged span, not only day totals. The remarks name
    timers as a future publisher bound by that rule (`:25-28`). The handler now
    picks the planner task whose span contains the window, ordered by start time then id (`ActivityTimeRecordedEventHandler.cs:90-109`).
    It goes through `ApplyStatus`, records actual times and re-syncs reminders (see F1 *Out of scope* #5). That narrows
    the wrong-item risk above for planner tasks.
  - *Still keyed on activity alone:* the no-planner-task fallback for to-do and routine items now sits at `:196-215` and
    uses an unordered `FirstOrDefaultAsync`. The recommendation to key it on the item link stands.
  - *Not an overlap:* the new `CompleteFinishedPlannerTasksJobHandler` closes only `InProgress` tasks flagged
    `AutoCompleteAtEnd` (leisure rest booked with "do it now"). It does not react to logged time.
- **Dedupe:** new. C5 (`captured-data`) changed what a session row is, not what it triggers.
- **Pattern:** 7

### F2-03. Let every user connect the desktop tracker, browser extension or phone app
- **Moment:** the first time a new user installs the tracker and signs in, and gets "Extension access not enabled for
  this account".
- **Today:**
  - `ExtensionLoginEndpoint.cs:24` gates `POST /auth/extension/login` on `User.HasExtensionAccess` (`User.cs:17`, default
    `false`). The framework base denies with 403 (`BaseExtensionLoginEndpoint.cs:83-85`).
  - The **only** production writer is `DefaultUsersSeeder.cs:55` / `:70`, the seeded root admin. No endpoint, settings
    request or registration path sets the flag: I grepped every `.cs` file outside `bin/obj`, and the other hits are
    tests and migrations.
  - No client screen mentions it. A grep of `src/` for `extensionAccess|extension/login` finds nothing.
  - So all three trackers (desktop, web extension, Android; the framework doc at `BaseExtensionLoginEndpoint.cs:18` names
    all three clients) work for the root account only.
  - `git log -S HasExtensionAccess` goes back to `d8486ab` (2026-02-02, "auth fixes and activity-tracking"), with no later
    intent recorded.
- **Backend logic needed** (host `AdhdTimeOrganizer`): a self-service grant. One of:
  - (a) a `PUT /user/extension-access { enabled }` endpoint, or
  - (b) a short-lived pairing code shown in settings and redeemed by the tracker's first sign-in. This avoids typing a
    password into a tray app.

  Either way, add a revoke that kills extension refresh tokens. `IJwtService` already models extension sessions on the
  refresh-token entity (`BaseExtensionLoginEndpoint.cs:23-25`).
- **Frontend surface:** `/user/settings`. The app's `#integrations` slot already hosts `GoogleCalendarCard.vue`; a
  "Trackers" card would sit next to it.
- **Data it runs on:** the existing flag and refresh-token rows. New input: one toggle, or a pairing code, once.
- **Size:** backend S for (a), M for (b). Frontend S.
- **Risks / open questions:**
  - The gate may be deliberate, as a beta or entitlement switch. The owner should say so. If it is not, the cheapest fix
    is to delete the override and let the framework default (`=> true`) apply.
  - **Still open (checked 2026-10-06, backend `0409fa0`).** The writers are unchanged: `DefaultUsersSeeder.cs:55,70`
    only. The framework default is now at `BaseExtensionLoginEndpoint.cs:58`, and the denial at `:83`.
  - **This is the onboarding cliff for every tracking feature, F2-01 included.** Nothing else in tracking matters until
    a user can sign a tracker in.
- **Dedupe:** new. No doc in `docs/` or `prompts/` mentions `HasExtensionAccess`.
- **Pattern:** 1

### F2-04. Leisure suggestions that remember what you turned down, on every device
- **Moment:** on the phone in the evening, after rerolling past "Board games" twice on the laptop, the user is offered it
  again.
- **Today:**
  - The server has a finished draw:
    - `DrawLeisureSuggestionEndpoint.cs:48` (`POST /leisure-suggestion`) ranks all three profile tables in SQL plus
      `LeisureDrawRanker`.
    - `RecordSeenLeisureSuggestionEndpoint.cs:40` (`POST /leisure-suggestion/seen`) writes `LeisureSuggestionRecord`
      (`LastSuggestedAt`, `LastOutcome`).
    - The record drives staleness and effort variety. The endpoint's own summary (`:20-29`) says this is *"the half of
      this feature that could not be fixed client-side at all."*
  - **Neither endpoint has a client caller.** A grep of `src/` for `leisure-suggestion` finds nothing.
  - `/leisure/pick` still fetches the three grids at `CANDIDATE_PAGE_SIZE = 200` (`useLeisurePicker.ts:48`) and ranks in
    the browser (`leisureScoring.ts`), so `LeisureSuggestionRecord` is never written in production.
  - `docs/data-map/leisure.md:120` lists the uncalled endpoint. It does not say what blocks adoption.
  - **What is missing on the server is weather.**
    - `LeisureDrawConstraints` carries only minutes, energy and people (`LeisureDrawConstraints.cs`). The request adds
      cost tier and location (`LeisureSuggestionDrawRequest`).
    - The client folds `WeatherFit` into its own ranking (`useLeisurePicker.ts:26`, `:292`). Adopting the server draw as
      it stands would silently drop the weather exclusion and bonus that `_done/leisure` D2 built.
- **Backend logic needed** (`.ActivityProfiles`): have the draw call `WeatherFitRule` / `IDailyWeatherProvider` (same
  project, `GetLeisureWeatherFitEndpoint` already composes them). Feed `matchingWeatherDependencyIds` into
  `LeisureRankingContext` as an exclusion and a bonus, with the same semantics as the client's `leisureScoring.ts`. Then
  pin those semantics in `LeisureWeatherFitTests` and the ranker tests.
- **Frontend surface:** `PickerView.vue` / `useLeisurePicker.ts` switch to the draw. `useLeisureCommitment.ts` and the
  reroll path call `/seen` with `committed` / `rejected`.
- **Data it runs on:** the existing profiles, `LeisureSuggestionRecord`, `User.WeatherLocation`. No new input.
- **Size:** backend S–M (weather in the draw); frontend M (replace the client ranker, keep the `?seed=` URL contract).
- **Risks / open questions:**
  - Two rankers exist today, and their rules may have drifted. The adoption must diff them, not assume.
  - `/seen` only on commit or reroll, never on render: the outcome enum's doc forbids recording a rendered draw
    (`LeisureSuggestionOutcome.cs`).
  - Weather depends on OP4 (the user's location) to do anything at all. **OP4 is done** (`docs/opportunities.md`
    → *Closed*), so the weather input now exists.
  - **Still open (checked 2026-10-06).** `src/` has no `leisure-suggestion` caller, and `LeisureDrawConstraints.cs:12`
    still carries only minutes, energy and people.
- **Dedupe:** extends `_done/leisure` D1, whose backend half (`D1-backend.md` §1–2) shipped and whose frontend never
  adopted it. Also extends D2: this adds weather to the server ranker, which D2 put client-side.
- **Pattern:** 3

### F2-05. A project becomes suggestible again once its shopping is done
- **Moment:** the weekend after the user bought the boards and glue and ticked "Shopping for Build a Bookshelf", when
  they ask the picker what to do and the bookshelf never comes up.
- **Today:**
  - The shopping handoff creates **one to-do item for the project's own activity** with the materials as steps
    (`leisure.en.ts:60-66`, `ShoppingToTodoDialog.vue`).
  - Ticking that item changes nothing on the project. The only writers of `ReadinessStatus` are the profile request
    (`ActivityProjectProfileRequest.cs:38`) and the manual `PatchActivityProjectProfileStatusEndpoint.cs:37`.
    `TodoListItemIsDoneChangedEvent` (Core) has handlers only in `.Planning` (`TodoListItemIsDoneChangedEventHandler.cs:26`).
  - Meanwhile `NeedsShopping` is excluded from every draw (`DrawLeisureSuggestionEndpoint.cs:229-231`,
    `LeisureDrawRanker.cs:187`). A project whose shopping is finished stays invisible until the user remembers to go back
    to the readiness board and flip a status.
- **Backend logic needed** (`.ActivityProfiles`, handler on Core's `TodoListItemIsDoneChangedEvent`): when an item is
  marked done, find a `NeedsShopping` project for that item's activity and move it to `ReadyToStart`. Un-ticking should
  not move it back; the materials are bought.
  - **A link is needed for precision.** Keying on activity alone also catches a "work on the bookshelf" to-do.
  - The clean fix is a nullable `SourceProjectProfileId` on `TodoListItem`, set by the handoff. That is a cross-slice FK
    from TodoLists to ActivityProfiles, so it is better expressed as an `ActivityProfiles`-owned link row, or carried on
    the event.
- **Frontend surface:** the readiness board (`ProjectReadinessBoard.vue`) shows the card moving columns, and the handoff
  dialog sends the project id. Optionally, the completion snackbar says "Bookshelf is ready to start".
- **Data it runs on:** the existing handoff item and project. No new input.
- **Size:** backend S (handler) to M (with the link); frontend S.
- **Risks / open questions:** partial shopping (some steps unticked when the item is ticked done). Moving on item-done
  rather than all-steps-done matches how the user closes it. The status change must be idempotent and must not fire for
  projects in `Planning`.
  **Still open (checked 2026-10-06, backend `0409fa0`).** The only `TodoListItemIsDoneChangedEvent` handler is still
  Planning's, the `ReadinessStatus` writers are unchanged, and `ShoppingToTodoDialog.vue` sends no project id.
- **Dedupe:** extends leisure-projects **O1** (closed 2026-09-24, `_fix-queue-log.md:7130`) and `_done/leisure` P1
  (readiness board). Both built the outbound half; this closes the loop back.
- **Pattern:** 6

### F2-06. Routine items learn how long they really take
- **Moment:** on Sunday, planning the week's chores, when "Clean bathroom" still claims 10 minutes because that was the
  guess typed in March.
- **Today:**
  - `ActivityHistory.RoutineTodoListId` (`ActivityHistory.cs:39`) is accepted (`ActivityHistoryRequest.cs:27`),
    ownership-checked (`ActivityHistoryReferencedIds.cs:61`) and indexed (`ActivityHistoryConfiguration.cs:36`).
  - **No server code reads it for anything.** Its to-do twin has a seam, `TodoListItemLoggedTimeSource.cs`, read by the
    daily recap. Routines have no equivalent. Re-checked 2026-10-04: outside validators, ownership checks, the FK and the
    index, nothing references it.
  - **The client has sent it since 2026-10-03** (`f522b0c9`). `BaseTodoListLogTimeController.vue:106` sends
    `routineTodoListId` for a routine item, and the session request carries it too (`ActivityHistorySessionRequest.ts:44`).
    So the link is now written, and is waiting for a reader. This paragraph used to say no client sent it.
  - The estimate the user maintains by hand is `RoutineTodoList.SuggestedTime`. It also decides when tracked time
    auto-completes the item (`ActivityTimeRecordedEventHandler.cs:88-110`).
- **Backend logic needed:**
  - `.History`: implement a `RoutineItemLoggedTimeSource` seam, with the same shape and the same "keyed on the link, never
    widened to the activity" rule as the to-do seam.
  - `.Routines`: a per-item median of logged length over the last N completions, returned on `RoutineToDoListResponse`
    (for example `typicalSeconds`, `sampleCount`).
  - Rule: below 3 samples, return nothing.
- **Frontend surface:** the routine list row ("usually ~18 min"). `RoutineTodoListItem` edit gets a one-tap "use 18 min"
  next to `SuggestedTime`. The day planner's routine side panel can size a dropped block by it.
- **Data it runs on:** `ActivityHistory.Length` and `.RoutineTodoListId`. The client already sends the link (see above),
  so only rows logged since 2026-10-03 carry it. No new input.
- **Size:** backend M; frontend S.
- **Risks / open questions:**
  - Show the number as information, never as "you were slow".
  - Never overwrite `SuggestedTime` silently: it gates auto-completion, so changing it changes behaviour.
  - **Still open (checked 2026-10-06, backend `0409fa0`).** Nothing reads the column yet. The session endpoint now writes
    the link and ownership-checks it (`CreateActivityHistorySessionEndpoint.cs:71-79,106-116`), so timer sessions carry
    it as well as single rows.
- **Dedupe:** extends `_done/todo-motivation` **S3** (estimate vs actual, to-dos only) to routines, and OP13 (per-item time
  in the recap, to-dos only).
- **Pattern:** 7 (and 1: written by nobody, read by nothing)

### F2-07. Default timer lengths that fit how you actually focus
- **Moment:** starting a focus session for "Thesis writing". The user picks 25 minutes again, though it has been stopped
  around minute 12 nine times out of ten.
- **Today:**
  - C5 made the server store how each sitting ended: `ActivityHistorySession.Outcome` (`Completed` / `StoppedEarly` /
    `RanOutWhileAway`, `ActivityHistorySession.cs:34`), plus `PlannedFocusPeriods` / `CompletedFocusPeriods`.
  - The **only** production reader of `Outcome` and `CompletedFocusPeriods` is the GDPR export
    (`GetUserDataExportEndpoint.cs:104-106`). A grep of all non-test code finds no query, aggregate or dashboard over
    either.
  - The client picks timer lengths from `TimerPreset` / `PomodoroTimerPreset` rows the user maintains, or from a planner
    block's length.
- **Backend logic needed** (`.History`): `GET /activity-history/session/fit?activityId=` returns, over the last N sessions
  of that activity:
  - the share that completed;
  - the median length of a completed focus row;
  - the median length at which `StoppedEarly` sittings stopped.

  From those, a suggested focus length: the largest length that has completed at least 70% of the time.
- **Frontend surface:** the timer and pomodoro setup in `TimerView.vue` / `PomodoroTimerView.vue`, and the embedded
  `TrackTimeDialog`: a one-tap "Try 15 min — that's what usually works for this" chip next to the presets.
- **Data it runs on:** `ActivityHistorySession.Kind/Outcome`, the rows' `Length` and `Phase`. No new input.
- **Size:** backend S–M; frontend S.
- **Risks / open questions:**
  - **It must never read as a score.** No "you abandon 60% of sessions" line.
  - The precise measure needs OP6's planned length. Until then the server can only infer "stopped early at X", not "out
    of Y".
  - Below about 5 sessions, show nothing.
  - **Corrected 2026-10-06 (backend `0409fa0`): the planned length exists now.** OP6 is done. `ActivityHistorySession.PlannedLength`
    (`ActivityHistorySession.cs:52`, `79c429d`) stores what the timer was set to, so "stopped at X out of Y" is measurable.
    It covers only sessions since 2026-10-03, so the sample threshold matters even more at first.
  - Still no aggregate. `Outcome`, the focus-period counts and `PlannedLength` are now **echoed** on every history row
    (`ActivityHistoryResponse.cs:56-59`) as well as in the export (`GetUserDataExportEndpoint.cs:104-107`). Both are
    projections. No query reads them.
- **Dedupe:** extends OP6 (which adds the planned length; this spends it) and C5 / `captured-data/backend/B3` (which stored
  the outcome with no reader).
- **Pattern:** 1

### F2-08. Planner suggestions that follow what you do now, not what you did once
- **Moment:** opening a day in the planner and scrolling past a "Tuesday: Swimming 18:00" suggestion that comes from a
  course the user dropped last spring.
- **Today:**
  - The pattern suggestions come from two materialized views (`mv_activity_history_pattern.sql`,
    `mv_planner_task_pattern.sql`), refreshed by J12. Both group over **all history ever**, with no time window, and keep
    any pattern seen `HAVING COUNT(*) >= 3`. Three Tuesdays in 2025 means a suggestion every Tuesday forever.
  - `GetSuggestionsRepeatingPlannerTaskEndpoint.cs:115-154` reads them with no notion of "shown and ignored".
  - The sibling module solved exactly this: leisure's `LeisureSuggestionRecord` buries what the user passed over.
    `LeisureSuggestionOutcome.cs`: *"that is what stops the same three appearing every visit"*.
  - Templates track `UsageCount` / `LastUsedAt` (`PlannerTemplateApplier.cs:101-102`). Pattern suggestions track
    nothing.
- **Backend logic needed** (`.Planning` plus the view scripts in the host):
  - (1) Add a recency window and decay to both views, for example the last 12 weeks, weighted by recency. That is a
    migration that re-creates the views.
  - (2) Add a `PlannerSuggestionDismissal` entity `(user, activityId, patternType, patternValue, dismissedAt, count)`
    written by a `POST /repeating-planner-task/suggestions/dismiss`.
  - (3) The suggestions query skips patterns dismissed recently, and drops them for good after repeated dismissals.
- **Frontend surface:** `RepeatingTasksSection` in the day planner gets an "×, not any more" on pattern-sourced suggestions
  (`sourceType` ≠ `userSet`). User-set recurrences are edited, not dismissed.
- **Data it runs on:** existing history and planner rows. New input: an optional one-tap dismiss.
- **Size:** backend M; frontend S.
- **Risks / open questions:** decay changes which suggestions existing users see on the first refresh after deploy. The
  window length is the owner's call. Do not show a dismissal count: that would be a guilt pile.
- **Still open, and cheaper than stated (checked 2026-10-06, backend `0409fa0`).** Both views were rewritten (see *Out of
  scope* #3), but they still have no time window: `HAVING COUNT(*) >= 3` over all history (`mv_activity_history_pattern.sql:57,73`,
  `mv_planner_task_pattern.sql:33,49`). There is no dismissal entity. The endpoint's pattern tiers are now at
  `GetSuggestionsRepeatingPlannerTaskEndpoint.cs:130-131,154-155`. **Correction to step (1):** it is not a migration.
  `SuggestionPatternViewInstaller` stamps each view with its script's hash and rebuilds it at boot when the script
  changes. Its remarks say "Changing a script is the whole deploy … none should be written". So the window is a SQL edit
  plus a restart, and the dismissal entity is the only migration.
- **Dedupe:** new. B27 (template suggestions) addressed *template* ranking, not activity patterns. OP10 shows a rule's
  schedule; this changes which patterns qualify.
- **Pattern:** 7

### F2-09. Your plan in Google Calendar stays correct after you change it
- **Moment:** after the user deletes or skips a block in the morning, their phone's calendar still shows it, and still
  fires its alert.
- **Today:**
  - `SyncCalendarToGoogleEndpoint.cs:63-95` is a manual, per-day, push-only button (`GoogleCalendarSyncBtn.vue`). It
    inserts or updates **every** task on the day, including `Cancelled` and `IsBackground` ones.
  - It never deletes. `GoogleEventId` is written only at `:88`. A grep shows that no delete, cancel, move or template
    re-apply path reads it, so a deleted or skipped task leaves an orphaned Google event.
  - Nothing re-syncs on edit. `SyncCalendarToGoogleTests.cs` pins only the not-connected, foreign-calendar and no-tasks
    cases.
- **Backend logic needed** (host + `.Planning`):
  - An `IGoogleCalendarMirror` seam called after planner-task create, update, span-patch, status-patch, delete,
    batch-delete and template apply. It upserts on change and deletes the Google event on delete, `Cancelled` or move
    off the day.
  - Background tasks are skipped.
  - It runs best-effort and off the request path, as a FastEndpoints event or a Scheduler one-shot. Google failures must
    never fail a planner write.
  - A per-user "keep in sync" switch, stored with the Google connection.
- **Frontend surface:** `GoogleCalendarCard.vue` gets the switch. `GoogleCalendarSyncBtn.vue` becomes "Sync now" or goes
  away.
- **Data it runs on:** `PlannerTask.*`, `GoogleEventId`, `User.GoogleCalendarRefreshToken`. New input: one switch.
- **Size:** backend M; frontend S.
- **Risks / open questions:**
  - Rate limits on template applies across many days.
  - A revoked token mid-session, for which the 409 wording already exists (`cd0a252`, B18).
  - Two-way sync (reading busy times from Google) is a different, larger feature and is not proposed here.
  - Overlaps N1 in effect: native calendar alerts would reach a closed-app user. The owner should pick one channel per
    user so reminders do not arrive twice.
- **Partly built since (checked 2026-10-06, backend `0409fa0`, `77b09db`):** the manual sync now skips `Cancelled` and
  background tasks, and deletes the Google event of one that became so since the last sync (`SyncCalendarToGoogleEndpoint.cs:79-82,138`,
  `RemovedCount` at `:20`). **Still open:** it is still a manual, per-day button. `GoogleEventId` is still read only
  inside that endpoint, so deleting a task or moving it off the day leaves its event behind, and nothing re-syncs on
  edit. The mirror seam and the switch are unchanged in scope.
- **Dedupe:** new. B14 (`view-docs/backend/_done`) fixed the OAuth connect and left sync "unchanged" (`_fix-queue-log.md:5650`).
- **Pattern:** 6

### F2-10. Mornings start when yours do
- **Moment:** a user who wakes at 10:30 gets the routine "suggested today" push at 08:00, and every morning sweep the
  audit proposes (N2, N4) would inherit the same hour.
- **Today:**
  - Every day row is created with `WakeUpTime = 08:00` and `BedTime = 00:00` (`CalendarDayFactory.cs:23-26`).
  - The comment records the postponed decision: *"Not user-configurable today — `UserPlannerSettings` has no wake/bed
    fields — so this is the one place to change when it becomes so."*
  - `CalendarSeeder` pre-fills this year and next with those defaults. A template's `DefaultWakeUpTime` overrides them
    only when that template is applied (`PlannerTemplateApplier.cs:98`).
  - P6 (`RoutineSuggestedTodayJobHandler`) anchors on that `WakeUpTime`. So does the history calendar's sleep row, through
    `CalendarDayLookup.cs:21`.
- **Backend logic needed:**
  - A per-user default wake and bed time.
  - Per CLAUDE.md § *Where a preference lives*, rule 2 (routines, planner and history all read it), it belongs in
    `/user/preferences`, not `UserPlannerSettings`. That puts it in the host's user augmentation.
  - `CalendarDayFactory.Create` reads it.
  - A one-off backfill rewrites only **untouched future** rows. "Untouched" needs a marker, because a row whose wake time
    equals the old default cannot be told apart from one the user set to 08:00. Use a nullable `WakeUpTimeOverride`, or
    a flag.
  - Optional later step: infer a suggested value from the first tracked activity of the day (desktop/Android) over the
    last 14 days. That is observed data, so no form.
- **Frontend surface:** `/user/settings` → Preferences (two time pickers), added via `userAugmentation.ts`.
- **Data it runs on:** `Calendar.WakeUpTime/BedTime`. New input: two times, once.
- **Size:** backend M (the backfill marker is the cost); frontend S.
- **Risks / open questions:** day rows are pre-seeded, so this is a data migration, not a default change. Weekday vs
  weekend wake times are where F4's day-type work comes in.
  **Still open (checked 2026-10-06, backend `0409fa0`).** `CalendarDayFactory.cs:20-26,42-43` is unchanged. The template
  override has moved to `PlannerTemplateApplier.cs:122`.
- **Dedupe:** new. It is the prerequisite the audit's N2/N4 sweeps assume ("wait for the user's local
  `Calendar.WakeUpTime`").
- **Pattern:** 5

## Rejected

- **`PlannerTaskStatus.OnHold`**: no server code produces it (no `PlannerTaskStatus.OnHold` outside the enum), but the
  client can set it (`PlannerTaskStatus.ts:7`, `DayPlannerWidget.vue:338`). It is a user state with no rule waiting on it.
- **`DayType.Vacation/SickDay/Special` never produced server-side**: user-chosen by design (`CalendarDayFactory.cs:47` only ever yields `Weekend` or `Workday`).
  It belongs to F4.
- **`Calendar.Location` vs `TaskPlannerDayTemplate.SuggestedLocation`**: no server comparison (`Location.Home|Office|Travel`
  has zero references), but this is OP18 / C3. (OP18 was built app-side on 2026-10-05.)
- **`TaskPlannerDayTemplate.Tags`**: written and echoed, never queried (only `TaskPlannerDayTemplateConfiguration.cs:30`).
  Spending it would add a form field.
- **`Activity.IsUnavoidable`**: only a grid filter (`GridActivityEndpoint.cs:114`). A "free time left today" computation
  over it is a cross-module join, so it is F3.
- **Planner streak grace days**: deliberately absent (`PlannerStreakService.cs:76-78`).
- **Carry over unfinished tasks**: exists client-side (`OverdueTasksBanner.vue`, "Not completed yesterday" + reschedule).
  Since 2026-10-04 it is also a server move, `POST /planner-task/{id}/carry-over` (F1-03's *Partly built since* note).
- **Standalone or recurring `Reminder`, `ReminderRecurrence`, `DigestKey`, `DeadlineApproaching`**: notification-audit N1,
  N2 and *Coverage gaps*.
- **`RoutineTimePeriod.ReminderLeadDays` / `FreezeBudget`**: N3 / OP1.
- **`DomainDetailsResponse`, `SetupTwoFactorForLoginEndpoint`**: OP16, OP12. Finished, frontend-only.
- **Auto-fill `Calendar.Weather` from `OpenMeteoWeatherProvider`**: the planner's weather is a note, and filling it removes
  no decision.
- **`UserPlannerSettings.PredefinedSkipReasons` unread server-side**: deliberate (`PlannerStreakService.cs:69-70`).
- **`RoutineTodoList.LastCompletedAt` never read**: echo only, and nothing waits on it.
- **`Calendar.cs:45` "Future: Events, TodoLists, Habits"**: a vague navigation-property note with no half-built code behind
  it.
- **`GET /routine-time-period/{id}/completion-history` and `GET /distinct-processes`**: uncalled, but plain reads. The grouped
  routine endpoint already carries the history (`GetAllGroupedRoutineTodoListEndpoint.cs:96`).
- **Account-deletion summary as a stats card**: `captured-data` *Considered* list.
- **Tracking retention asymmetry**: none. J9 purges all three ledgers (`PurgeExpiredActivityTrackingEntriesJobHandler.cs:51-64`).
- **`HolidayCalendar.ForYear`**: the only uncalled domain method. A holiday list adds nothing over the per-day
  `HolidayName`.

## Out of scope, but noticed

1. **Fixed 2026-10-03 (`f522b0c9`, the OP6 follow-up): to-do and routine time now links to its item.** This item used
   to report that the client never sent the link.
   - `ActivityHistoryRequest.ts:13,15` and `ActivityHistorySessionRequest.ts:43-44` carry `todoListItemId` and
     `routineTodoListId`.
   - `BaseTodoListLogTimeController.vue:92` sends the link, and `:106` picks it by list kind: a routine item sends
     `routineTodoListId`, a normal item sends `todoListItemId`.
   - The daily recap's per-item time is no longer always zero, so OP13 has real data (`docs/opportunities.md` → *Closed*,
     OP6).
2. **Settled 2026-10-04: editing a history row keeps its link.** This item used to flag, unverified, that the edit might
   drop it.
   - `EditActivityHistoryForm.vue:55-57` still PUTs `ActivityHistoryRequest` without the link fields.
   - The server's `ActivityHistoryRequest.UpdateEntity` deliberately writes neither link column
     (`AdhdTimeOrganizer.History/application/dto/request/ActivityHistoryRequest.cs:52-55`), so nothing is nulled. Fixed
     in `5f97385d`. Not a bug.
3. **Bug (backend SQL): averaged suggestion times are wrong.** Both pattern views compute
   `make_time(AVG(hour)::int, AVG(minute)::int, 0)` (`mv_activity_history_pattern.sql:7-12`, `mv_planner_task_pattern.sql`
   same), averaging hours and minutes separately. Two sittings at 09:50 and 10:10 average to 10:30, not 10:00.
   `EXTRACT(ISODOW FROM ah.start_timestamp)` is evaluated in the DB session's zone, not the user's (unverified for this
   deployment).
   **Fixed since (checked 2026-10-06, backend `fed1999` + `1725174`, both 2026-10-03):** both views now take a circular
   mean on the clock (`mv_activity_history_pattern.sql:11,49-54,89-90`, `mv_planner_task_pattern.sql:1,25-30,67-68`).
   The history view converts to the user's zone before taking the weekday (`mv_activity_history_pattern.sql:24-25,40`).
   The planner view takes it from the local `c.date` (`mv_planner_task_pattern.sql:14`). Changing zone refreshes the
   history view.
4. **Settled 2026-10-04 (checked during F1): no duplicate suggestions.** This item used to say, unverified, that the
   endpoint does not exclude activities already planned on that calendar. It does.
   `GetSuggestionsRepeatingPlannerTaskEndpoint.cs:57-65` seeds a covered-activity set from every `PlannerTask` on the
   calendar, whatever its status, and all three suggestion tiers skip activities in that set (the comment at `:57-59`
   says so). Not a bug.
5. **Design note, F4 input: holidays keep their weekday type.** A public holiday on a weekday stays `DayType.Workday`
   (`CalendarDayFactory.cs:37-39`), so `RecurrenceType.DayType = Workday` recurrences are suggested on holidays
   (`GetSuggestionsRepeatingPlannerTaskEndpoint.cs:77`).
6. **Stale doc: data-map's uncalled-endpoint list.** `docs/data-map.md` § *Endpoints with no client caller* also lacks:
   - `POST /leisure-suggestion/seen`;
   - `GET /routine-time-period/{id}/completion-history`;
   - `GET /distinct-processes`;
   - `/reminder/*`, which the notification audit already flagged.

   It also names the draw as `/leisure/suggestion/draw`; the route is `POST /leisure-suggestion`.
7. **Google sync pushes too much.** It pushes `Cancelled` and background tasks (`SyncCalendarToGoogleEndpoint.cs:63`, no
   status filter). This is folded into F2-09, but it is a defect on its own if F2-09 is not built.
   **Fixed since (checked 2026-10-06, backend `77b09db`, 2026-10-03):** they are filtered out at `:138`, and an event
   already pushed for one is deleted (`:79-82`).
