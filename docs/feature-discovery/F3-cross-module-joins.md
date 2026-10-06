# F3. Cross-module joins

> Swept 2026-10-06 · frontend commit `369ec8c5` (working tree dirty: `docs/opportunities.md` modified and 11 untracked
> `e2e/tests/*.spec.ts`, none of them read as input) · backend commit `0409fa0`, **clean**.
>
> Inputs read: `prompts/feature-discovery/_RULES.md` and the README; the backend's `CLAUDE.md`, `docs/modules.md`,
> `docs/claude/slices.md`, `AdhdTimeOrganizer.Core/application/seam/README.md`, and the `summary.md` / `domain-map.md` of
> History, Tracking and Planning (`docs/architecture.md` too, which the backend `CLAUDE.md` marks as a leftover from
> another solution, so I did not rely on it). Dedupe: `docs/opportunities.md`, `docs/notification-audit.md` (headings and
> producer table), `prompts/captured-data/README.md`, the index of every `prompts/_done/*/README.md`, plus
> `_done/todo-motivation/S3`, `_done/day-planner/F2` and `_done/activity-history/H10` in full, and greps of
> `docs/views/_fix-queue{,-log}.md`. I also read the sibling passes `F1-journey-gaps.md`, `F2-half-built-backend.md` and
> `F4-day-type-periods.md` (headings, plus F1-02, F1-03, F1-05, F2-01, F2-02, F2-04, F2-06 and both *Rejected* lists in
> full), so that this file does not re-propose what they claimed.

## Method

I listed every entity in Planning, TodoLists, Routines, History, Tracking, ActivityProfiles and Core and read each
`*Configuration.cs` that declares a key another module could join on. I also read the host's
`ConfigureCrossSliceRelationships` and every Core seam and seam event. That gave the join matrix below. For each joinable
pair, I wrote down the questions a user would ask, then searched both repos for an endpoint or client composable that
already answers them. That covered the history dashboards and `aggregate-by-activity`, the planner's trend and skip
summary, the daily recap, the unified tracking dashboards, the leisure ranker and the to-do calibration. A question
survived only if answering it needs a new server-side query across at least two modules.

The main finding sits under the candidates, not in them. **Most of the joins the prompt hopes for go through a weak key
(`ActivityId`) or a contaminated one.** History cannot tell tracker-written rows from manual ones. Planner actual times
are partly written by the tracker. Only desktop tracking resolves to activities at all. So the candidates below
deliberately lean on the few **exact** keys the schema has: the three cross-slice FKs and the timer sessions.

## Join matrix

Modules are those named in the prompt. "Activity" means both rows carry `ActivityId` (Core's hub), which is a weak key,
since one activity spans many items, blocks and days. **Bold** marks an exact, row-level key.

|              | **Planner**                                     | **To-dos**                                              | **Routines**                                              | **History** (logged + timers)                                      | **Tracking** (desktop / web / android)                                 | **Leisure** (ActivityProfiles)              |
|--------------|-------------------------------------------------|---------------------------------------------------------|-----------------------------------------------------------|--------------------------------------------------------------------|------------------------------------------------------------------------|---------------------------------------------|
| **Planner**  | —                                               | **FK `PlannerTask.TodolistItemId`** + activity          | activity + date, at event time only                       | activity + time overlap; materialized view for suggestions         | time overlap only (desktop: activity + day, via event)                 | activity (a commitment books a block)       |
| **To-dos**   |                                                 | —                                                       | none (shared base class, no row link)                     | **FK `ActivityHistory.TodoListItemId`** (rows since 2026-10-03) + activity | activity, via desktop event only                                       | **FK `TodoListItem.PairedLeisureActivityId`** → Activity |
| **Routines** |                                                 |                                                         | —                                                         | **FK `ActivityHistory.RoutineTodoListId`** (rows since 2026-10-03) + activity | activity, via desktop event only                                       | none (activity only)                        |
| **History**  |                                                 |                                                         |                                                           | —                                                                  | activity via desktop mapping at ingest (no back-reference); time overlap | activity                                    |
| **Tracking** |                                                 |                                                         |                                                           |                                                                    | —                                                                      | activity, via a mapping rule only           |

Evidence for each cell:

- **The three exact FKs** are declared host-side, navigation-free, all `SetNull`: `AppDbContext.cs:227-258`. The fourth
  cross-module FK is `TodoListItem.PairedLeisureActivityId` → `Activity` (`TodoListItemConfiguration.cs:38-45`). It points
  at the leisure *activity*, not at a profile row.
- **Planner ↔ Routines** meet only inside `RoutineTodoListIsDoneChangedEventHandler`, which matches today's planner tasks
  by activity (seam README, event table; Planning `domain-map.md:542`). Routines' only Planning read is
  `ICalendarDayLookup` for `WakeUpTime` (`RoutineSuggestedTodayJobHandler.cs:43`).
- **Planner ↔ History**: no FK. Planning reads History only through `mv_activity_history_pattern`, which is activity plus
  weekday plus time of day (`slices.md` § Planning). The plan-vs-actual trend reads `PlannerTask` actual times, not
  History (`GetPlanVsActualTrendPlannerTaskEndpoint.cs:23`).
- **Tracking → everything**: `.Tracking` references Core only (Tracking `summary.md:59-61`). A grep of `.Tracking` for
  `PlannerTask|ActivityHistory|TodoListItem|RoutineTodoList` hits one doc comment
  (`DesktopActivityHeartbeatEndpoint.cs`), and nothing else. Its only outbound links are the attribution sink and
  `ActivityTimeRecordedEvent`, both desktop-only (`DesktopActivityHeartbeatEndpoint.cs:111-115, :196-202`; `AttributeAsync`
  has no other production caller besides the e2e seeder, `E2eFixtureSeeder.cs:1372`). The host handler then matches by
  `ActivityId` and the user's day (`ActivityTimeRecordedEventHandler.cs:92-99, :196-221`).
- **Leisure → anything**: `.ActivityProfiles` has zero outbound edges and no `ActivityHistory`, `PlannerTask` or tracking
  reference (grep). The draw's memory is its own `LeisureSuggestionRecord` (`LeisureSuggestionRecord.cs:23-36`).

### Join quality: what each key actually supports

1. **`ActivityId` is the universal key, and a weak one.** A to-do item is unique on `(UserId, ActivityId, TodoListId)`
   (`TodoListItemConfiguration.cs:47-48`), so one activity can sit on several lists, in several planner blocks a day, and
   in tracker-attributed history. The History slice already documents the double-count this causes when "time for an
   item" is widened to "time for its activity" (seam README, `ITodoListItemLoggedTimeSource` paragraph).
2. **The item links are young.** `ActivityHistory.TodoListItemId` / `RoutineTodoListId` were sent by no client until
   2026-10-03 (History `summary.md:220-221`), so every row before then is unlinked.
3. **History has no source column.** A tracker-attributed row, a manual entry and a stopwatch row all have
   `SessionId == null` and no item link (`ActivityHistory.cs:41-46`; the sink writes bare rows,
   `ActivityHistoryTimeAttributionSink.cs:48-55`). Any comparison of "logged" against "tracked" that goes through
   History is partly circular.
4. **Planner actual times are partly tracker-written.** The automation sets `ActualStartTime` / `ActualEndTime` on the
   tasks it completes (`ActivityTimeRecordedEventHandler.cs:121-129`), and nothing records that it did. So "planned vs
   actual" is also partly circular for any mapped activity.
5. **The only clean, user-declared time intervals are timer sessions.** These are `ActivityHistorySession` plus its rows,
   with `SessionId` and `Phase` (`ActivityHistory.cs:46-51`, `TimerSession.cs:46-51`, `ActivityHistorySession.cs:31-55`).
   Each one says "I am doing activity X from t₀ to t₁". They have existed only since `captured-data` C5.
6. **Tracking reaches activities through desktop rules only.** Android rules are applied by nothing (Tracking
   `summary.md:154-158`). The web extension has no mapping entity (grep for `TrackerWeb|WebMapping`: none). The unified
   layer is label-based and joins no web domain to anything (`UnifiedLabelResolver.cs:21-26`). Two more gaps:
   - Role- or category-only rules attribute nothing to History, because only `match.ActivityId` reaches the sink
     (`DesktopActivityHeartbeatEndpoint.cs:111`).
   - Ignored entries are not stored at all (`:90-91`).
7. **Rule coverage is unknown.** The dev database has no mapping rows (`docs/opportunities.md:59`). Prod is
   `unverified`. Every tracking → activity join therefore has to report its own coverage, or the result means nothing.
8. **Tracker → History attribution drops sub-minute seconds.** `new IntTime(seconds)` keeps hours and minutes only
   (`IntTime.cs:14-18`). It is pinned as a known gap (History `testing.md:77-88`). A minute split across two applications
   is attributed as zero to both.
9. **Clocks differ by module.** Planner dates are the user's local dates. Routine periods close on UTC midnights by
   design (`RoutineResetService.cs:26, :257`; Routines `domain-map.md:126`). History and tracking store UTC instants.
   A day-level join of routines to the planner is off by the user's UTC offset at night.

## Candidates

### F3-01. Which kinds of to-dos run long: estimate, planned block and logged time, side by side, per item
- **Moment:** typing "30 min" into a new *Admin* to-do, when the last eight *Admin* items each took about twice what
  was typed.
- **Today:**
  - One item has three durations and nothing puts them side by side:
    - the estimate, `SuggestedTime` (`BaseTodoListItem.cs:13`);
    - the block it was planned into, through `PlannerTask.TodolistItemId` (`PlannerTask.cs:64`, FK `AppDbContext.cs:227-238`);
    - the time logged against it, through `ActivityHistory.TodoListItemId` (`ActivityHistory.cs:31`, FK `AppDbContext.cs:244-251`).
  - The existing calibration (S3) joins on the **activity**, not the item. `aggregate-by-activity` sums every row of the
    activity across all history, tracker-attributed rows included, and divides by *sittings*
    (`AggregateByActivityActivityHistoryEndpoint.cs:43-57`). The client then divides that per-sitting mean by the
    per-item estimate (`useEstimateCalibration.ts:49-63`). An item done in three sittings therefore reads as a third of
    its real length, and the History slice's own rule says not to widen item time to the activity (seam README).
  - The daily recap is keyed on the item. It covers one day and completed items, and it has no estimate in it
    (`GetDailyRecapTodoListItemEndpoint.cs:66-90`). No route returns item time across days grouped by list, category or
    priority (grep of `.TodoLists` and `.History` endpoints).
- **Backend logic needed** (`.TodoLists`, plus a seam method in `.Planning`):
  - **Join:** `todo_list_item ⋈ activity_history ON todo_list_item_id` and `⋈ planner_task ON todolist_item_id`. Every
    key is an exact FK, and **no time-overlap logic is needed**.
  - Logged seconds come through the existing `ITodoListItemLoggedTimeSource.LoggedSecondsBetweenAsync`
    (`ITodoListItemLoggedTimeSource.cs:51`), which already takes any range.
  - Planned minutes need one new method on `ITodoListItemPlanSource`: the span of the first block linked to each item.
  - **New read:** `GET /todo-list-item/estimate-fit?groupBy=list|category|priority`. It takes items completed in the last
    90 days (`CompletedTimestamp`) that have `SuggestedTime > 0` and at least one linked second. Per group it returns:
    - the median of `logged / estimate`;
    - the median of `planned / estimate`;
    - the sample count.

    Open items are added with their logged-so-far, so a long item shows its progress.
  - It stays silent below 5 items per group (S3's threshold).
  - **Compute on read**: hundreds of rows at most.
  - It extends the list header and the item chip. It needs no new view.
- **Frontend surface:**
  - `TodoListView` header line (replaces the activity-keyed ratio at `TodoListView.vue:303-309`).
  - `BaseTodoListItem`'s "You usually spend…" chip (`BaseTodoListItem.vue:238-239`), when item-level data exists.
  - The to-do → planner handoff can size the block by the group ratio (F1 *Out of scope* #2).
- **Data it runs on:** `SuggestedTime`, `CompletedTimestamp`, the two FKs. **No new input.**
- **Size:** backend S–M; frontend S.
- **Risks / open questions:**
  - **Thin and biased data.** Links exist only from 2026-10-03. Logging time is optional, and "a completed task with no
    time against it is an ordinary case" (`GetDailyRecapTodoListItemEndpoint.cs:106-107`). Timed items are the ones the
    user chose to time.
  - **Framing:** describe the estimate, not the person: "*Admin* items took about 1.5× the estimate (8 items)". No red,
    no per-item verdict.
  - **Never rewrite `SuggestedTime` automatically.** It also gates tracker auto-completion
    (`ActivityTimeRecordedEventHandler.cs:202`).
  - **Privacy:** none. No tracking data is involved.
- **Dedupe:** extends `_done/todo-motivation` **S3**. It moves the join from activity to item and fixes the
  per-sitting/per-item unit mismatch. It is a sibling of **F2-06** (routine items, per-item median) and **F1-05** (planner
  template lines). The three should share one rule for thresholds, medians and wording. It also extends **OP13**, which
  shows per-item time for one day only.

### F3-02. The tracker suggests mapping rules, learned from your own focus timers
- **Moment:** on `/activity-tracking/desktop/settings`, facing a long *Uncovered* list and no idea which of those
  processes was the thesis.
- **Today:**
  - Time reaches an activity only if the user wrote a rule for it (`DesktopActivityHeartbeatEndpoint.cs:88-115`). The
    distinct-entries grid shows which tuples are uncovered (Tracking `domain-map.md:215-243`), and every rule is authored
    by hand.
  - **No suggestion logic exists.** There are no `suggest` hits in `.Tracking` or in `src/core/activityTracking`.
    `fetch-categories-and-roles-by-pattern` only lists the targets of rules the user already has
    (`FetchCategoriesAndRolesByPattern.cs:36-63`).
  - Coverage is the ceiling on every tracking → activity join: F2-01, F2-02, F1-02 and F3-03. In dev it is zero (join
    quality #7).
  - **The labels to learn from already exist, and only one source is clean.** Timer focus rows are explicit, user-declared
    intervals (join quality #5). Tracker-attributed history rows and tracker-written planner actual times would feed the
    rules back into themselves (#3, #4), so they must not be used.
- **Backend logic needed:**
  - **Core seam `IFocusIntervalSource`**: read, resolved as a single service, implemented by `.History`. It returns
    `(activityId, startUtc, endUtc)` for session rows that are `Focus` or a plain `Timer` in a range. Same shape as
    `ICalendarDayLookup`. Manual and stopwatch rows are excluded, because they are indistinguishable from tracker rows.
  - **`.Tracking`: `GET /activity-tracking/desktop/mapping-suggestions?days=30`.**
    - **Join:** each focus interval ⋈ `desktop_activity_entry` on `UserId` and `WindowStart ∈ [start, end)`, which is
      **time overlap** served by the `(UserId, WindowStart)` index (`DesktopActivityEntryConfiguration.cs:40`).
    - Entries any active rule covers are dropped, through the one matcher, `DesktopMappingRuleSet`.
    - Per `(ProcessName, ProductName)` × activity it sums active seconds and counts distinct sessions.
    - **Suggestion rule:** at least 3 sessions, at least 10 minutes, and at least 70% of that process's in-session time
      under one activity. A process split across several activities is never suggested at process level; that is the
      browser case. When the activities share a role, it offers the role instead.
  - **Compute on read**: tens of intervals, each reading one minute-indexed slice. No job.
  - **Android** follows the same shape once F2-01 applies its rules. The web extension cannot follow it: there is no
    mapping entity to suggest into.
- **Frontend surface:** the desktop *Uncovered* tab of the distinct-entries grid. A row gets a "Suggested: *Thesis* — seen
  in 7 of your Thesis timers" chip with **Create rule** (the existing create endpoint, prefilled) and **Not this**
  (remembered via `useUserScopedStorage`).
- **Data it runs on:** timer sessions, the desktop ledger and the existing rules. **No new input**, and accepting a
  suggestion takes one tap.
- **Size:** backend M (the seam, the endpoint, and tests that assert on rows); frontend S.
- **Risks / open questions:**
  - **A wrong rule is silent and permanent.** It re-attributes every future heartbeat and feeds completion automation.
    So suggestions are never applied automatically, and the accept step should say what the rule will do.
  - Role-only suggestions affect dashboards only (join quality #6). Say so, or offer activity targets only.
  - Timer sessions are recent (C5), so there is little to learn from at first. The thresholds keep it quiet rather than
    wrong.
  - **Privacy:** it reads timer data inside Tracking but shows results only on the tracking settings page, which already
    shows this data. **No new exposure.**
- **Dedupe:** new. B24 (`coveredBy`) shows which rows need a decision. This proposes the decision. It is a prerequisite
  in practice for F2-01, F2-02, F1-02 and F3-03.

### F3-03. "What did my devices do while I was focusing?" Declared focus against tracked reality
- **Moment:** after a pomodoro, or on Friday afternoon, when the user wonders whether *mornings* or *afternoons* actually
  work for focus.
- **Today:**
  - The prompt's headline question ("I plan focus work in the morning — do I do it, or does tracking show YouTube?") has
    no endpoint.
  - Tracking never reads planner or history rows (matrix evidence).
  - Its focus-metrics dashboards measure fragmentation over a time-of-day window, with no notion of what the user meant
    to do in it (Tracking `domain-map.md:195-213`).
  - History knows the declared intervals and nothing about devices. The plan-vs-actual trend compares planned and actual
    *times* only (Planning `domain-map.md:196-228`).
  - F1-02 uses tracker evidence only to word a live nudge. F1 hands the after-the-fact join to this pass (F1 § *Rejected*,
    the drift-nudge line).
  - **A per-block verdict would contradict the server's own rule.** Time tracked "*anywhere* in the day counts toward a
    block … a rule that says otherwise teaches an ADHD user that the plan is a trap" (`ActivityTimeRecordedEventHandler.cs:77-79`).
- **Backend logic needed** (`.Tracking`, two read seams):
  - **Intervals, two lenses, built in this order:**
    1. **Lens A, timers:** `IFocusIntervalSource` from F3-02. These intervals are exact.
    2. **Lens B, planned blocks:** a new `IPlannedBlockSource` (`.Planning`). It returns `(activityId, roleId,
       categoryId, startUtc, endUtc, status)` for non-background tasks, converted on the user's clock. These intervals
       are fuzzy, because a block may have been done at another time.
  - **Join:** each interval ⋈ all three ledgers by **time overlap**, clipped to the interval:
    - desktop and web on `WindowStart`, android on `SessionStartUtc`/`SessionEndUtc`. All three are indexed
      (`DesktopActivityEntryConfiguration.cs:40`, `WebExtensionActivityEntryConfiguration.cs:29`,
      `AndroidSessionDataConfiguration.cs:21,33`);
    - minutes are allocated with `UnifiedMinuteMerger`, so the parts add up the same way the unified dashboards' do.
  - **Classification comes from the per-source ledgers, not from unified labels**, because labels carry no mapping (join
    quality #6). Each minute is one of:
    - the declared activity;
    - the same role or category;
    - another mapped activity;
    - unmapped, with its top labels;
    - phone;
    - no device activity.
  - **New read:** `POST /activity-tracking/focus-review { dateFrom, dateTo, lens }`, capped at 31 days. It aggregates
    **per activity × time-of-day band**, never per block or per session.
  - **Only "trackable" activities get a match share.** An activity is trackable if an active rule targets it, its role or
    its category. Every other activity reports only phone and no-device minutes, so a gym block is never told it "didn't
    happen".
  - **Compute on read, not precomputed.** Intervals are few and the reads are indexed. A stored verdict would go stale,
    because rules are reinterpretable after the fact (Tracking `domain-map.md:25-27`). Retention is 3 years
    (`appsettings.json:47-50`), so nothing ages out from under a 31-day read.
- **Frontend surface:**
  - **Lens A:**
    - an optional line on a finished session in the history timeline, e.g. "Desktop: 22 of 25 min in Word / Zotero ·
      phone opened twice";
    - one H10-style sentence in the history summary insights, e.g. "In morning *Thesis* timers about 80% of desktop
      time was Thesis apps; afternoons about half".
  - **Lens B:** one line under `PlanVsActualTrendLine` on the planner calendar.
- **Data it runs on:** timer sessions, planner tasks, the three ledgers and the rules. **No new input.**
- **Size:** backend L (two seams, a three-ledger classification, and tests that assert on seconds); frontend M.
- **Risks / open questions:**
  - ⚠ **Privacy flag: this puts tracking data on history and planner screens, which have never shown it**, and it puts
    phone data next to focus. Make it opt-in, off by default, and never in a notification.
  - **Insight vs judgement:**
    - Frame it as *where focus holds* ("your mornings hold focus best"), not where it fails.
    - Use minutes, not a percentage score, and never rank days.
    - Unmapped time is shown honestly, with a link to F3-02, never counted as distraction.
  - **Join fuzziness:**
    - Lens A is exact in time and limited only by rule coverage.
    - Lens B also mislabels any block done at another time. That is why lens B aggregates by band, and why lens A ships
      first.
  - **Bias:** with no web mapping, a whole browser hour can only be "unmapped" or "same role via the desktop browser
    rule". State the coverage beside every figure.
- **Dedupe:** new; F1 hands it over. It builds on F3-02 for coverage. Its surface overlaps `_done/activity-history`
  **H10** (insights) and `_done/activity-tracking` **U5** (fragmentation per day, with no declared intent). It differs from
  F1-02, which is a live nudge, not a review.

### F3-04. How much plan your days really hold: plan load against what got done, routines included
- **Moment:** 08:30, the day already has 7 h of blocks, and the user is about to add one more.
- **Today:**
  - The planner's "over capacity" compares planned minutes with the *view window* (`DayPlannerProgressBlock.vue:81-90`).
    That is the clock's capacity, not the person's.
  - The plan-vs-actual trend is one aggregate per range (Planning `domain-map.md:196-228`). The skip summary groups by
    reason and start hour (`:253-276`). Neither breaks results down by how full the day was.
  - Routines record only per-period counts (`RoutinePeriodCompletion.cs:15-37`) and never see the plan. Planning reads
    no routine data (grep).
  - The history calendar joins day metadata with logged totals, but not with planned load
    (`CalendarActivityDaySummary.cs:6-27`).
  - The prompt's "Do I skip routines on days the planner is overloaded?" has no endpoint anywhere.
- **Backend logic needed:**
  - **New Core seam `IRoutineDayCompletionSource`** (`.Routines`). It returns completed/total per date for periods with
    `LengthInDays == 1` (`RoutineTimePeriod.cs:12`). Longer periods are left out: their per-item done dates are not kept,
    because `LastCompletedAt` is overwritten (`RoutineToDoList.cs:12`).
  - **`.Planning`: `POST /planner-task/load-fit { dateFrom, dateTo }`.** It covers up to 90 days, strictly before the
    user's today, using the trend's eligibility rules.
    - **Join:** `calendar ⋈ planner_task` per day, then ⋈ routine day completions **on date**. This is day-level, with no
      interval overlap.
    - Per day it computes the planned minutes (qualifying tasks only), the share completed, and the daily routine share.
    - Days are bucketed by planned hours (for example < 3, 3–5, 5–7, > 7). Each bucket gets the day count, the median
      task completion and the median routine completion.
    - It derives `typicalFullDayMinutes`: the largest bucket whose median completion holds near the user's overall
      median. Below 5 days per bucket the value is `null`.
  - **Optionally**, tasks whose activity `IsUnavoidable` (`Activity.cs:13`) count as fixed time rather than chosen load.
    F2 deferred this ("free time left today") to F3.
  - **Compute on read**: a few hundred rows.
- **Frontend surface:**
  - `DayPlannerProgressBlock` gets one quiet line when today's planned load passes the typical figure: "Days planned past
    ~5 h usually leave things undone — routines too".
  - The planner calendar can show the same figure as a faint line.
  - F1-01 (re-plan the rest of today) can read it.
- **Data it runs on:** planner tasks and statuses, daily routine completions. **No new input.**
- **Size:** backend M; frontend S.
- **Risks / open questions:**
  - **Confounding.** Heavy days are workdays. Bucket weekdays and weekends separately when the sample allows. Either way,
    call it a pattern, not a cause.
  - **Clock mismatch:** routine days are UTC-dated (join quality #9). That is acceptable for counts; document it.
  - `WakeUpTime` / `BedTime` are defaults on most rows (Planning `domain-map.md:393`; OP5), so they cannot be the
    denominator. Use absolute minutes.
  - Needs about 20 planned days before it says anything.
  - **Framing:** it describes the plan ("this plan is bigger than the days you usually finish"), never the person. It
    never blocks adding a task and never uses red.
  - **Privacy:** none.
- **Dedupe:** new. It extends `_done/day-planner` **F2** (one day plus a range trend) with a load dimension and routines.
  It is distinct from F1-05 (durations per template line) and absorbs F2's rejected `IsUnavoidable` item.

### F3-05. A to-do that keeps failing in the plan gets offered a smaller first step
- **Moment:** opening the list and seeing "Call the insurer" again. It has been put on the plan four times, and each time
  it was skipped or carried over.
- **Today:**
  - The planner records each attempt on the linked task:
    - its status;
    - its skip key or reason (`PlannerTask.cs:10-13`);
    - `CarryOverCount` and `OriginalDate` (`PlannerTask.cs:36-42`; Planning `domain-map.md:230-242`, which is F1-03's
      carry-over, now built).
  - **The to-do side sees only the next open slot.** `TodoListItemPlanSource` drops `Completed` and `Cancelled` tasks and
    everything before today (`TodoListItemPlanSource.cs:24-39`). Every past failed attempt for the item is invisible to
    the list.
  - Copy-to-days and template applies drop the link (Planning `domain-map.md:335, 356`). So every linked task came from
    the item itself, and the counts are clean.
- **Backend logic needed:**
  - `.Planning`: a second method on `ITodoListItemPlanSource`, `PlanHistoryAsync(itemIds)`. Per item it returns:
    - blocks planned, completed and skipped;
    - the top `SkipReasonKey`;
    - the summed `CarryOverCount`;
    - the date of the last attempt.

    **Join:** `planner_task.todolist_item_id` (exact FK), with no time logic.
  - `.TodoLists`: a derived, never-stored `planStuck` rule: 3 or more failed attempts and none completed. It is computed
    on the item read. The response carries the *kind* of help, not the counts: `smallerStep` (mostly `NoEnergy` or
    carried), `shorterBlock` (mostly `NoTime`) or `reconsider` (mostly `NotRelevant`).
  - **Compute on read**, keyed by ids the list already loaded.
- **Frontend surface:** `BaseTodoListItem` and home's `TodoListWidget` show one offer for a stuck item, matching the kind:
  - "Start 10 minutes" (the S2 quick-start);
  - "Split into steps";
  - "Pair a reward" (N5);
  - "Let it go".
- **Data it runs on:** existing planner tasks and the FK. **No new input.**
- **Size:** backend S; frontend S–M.
- **Risks / open questions:**
  - **Never show the count.** "Planned 4×, skipped 4×" is exactly the punishing score `_RULES.md` warns about. The
    numbers only choose *which* help to offer (F1-03 made the same call).
  - **Auto-completed or tracker-completed blocks** count as completed, which is the forgiving direction.
  - **Privacy:** none.
- **Dedupe:** extends **F1-03**, which keeps the slip on the planner task; this carries the outcome to the item that
  caused it. Related to `captured-data` **C1** (skip reasons, planner only) and `_done/todo-motivation` **N2** (overdue
  renegotiation, driven by due dates).

### F3-06. The leisure picker learns what you actually did, not only what it showed you
- **Moment:** the evening, at `/leisure/pick`. "Board games" is offered again, though it was committed to twice last week
  and happened neither time. Meanwhile a walk the user loves hasn't come up in a month.
- **Today:**
  - The ranker's staleness reads `LastSuggestedAt`, which records when a card was shown and acted on, not when the
    activity was done (`LeisureDrawRanker.cs:223-232`). The only outcomes recorded are `Committed` and `Rejected`
    (`LeisureSuggestionRecord.cs:30-35`; `LeisureSuggestionOutcome.cs:16-20`).
  - Committing books a planner block. "Plan for later" leaves it `NotStarted`. "Do it now" sets it `InProgress` and lets
    it close itself (`useLeisureCommitment.ts:100-111`).
  - So the app holds the block's fate, every history row for the activity, and `MemoryAnchor` (`MemoryAnchor.cs:5-11`),
    and the draw uses none of them. There is no history or planner reference in `.ActivityProfiles`, and none in
    `src/core/leisure` (greps).
  - The server draw itself has no client caller yet, because the client ranks in the browser (F2-04).
- **Backend logic needed:**
  - **A keyed Core seam `IActivityLastDoneSource`**, shaped like `IActivityReferenceSource`. Three implementations:
    - History: the latest row start per activity;
    - Planning: the latest `Completed` block, plus the fate of "plan for later" blocks booked since the last commitment;
    - ActivityProfiles: its own anchors.

    **Join:** by `ActivityId` and date only, with no interval overlap.
  - **`.ActivityProfiles`:**
    - The draw context gains `LastDoneAt` and `UnkeptCommitments` per candidate.
    - Staleness reads from `max(LastSuggestedAt, LastDoneAt)`, so something done yesterday is not offered tonight.
    - It applies a soft demotion after two unkept "plan for later" commitments, which expires after 30 days.
  - **Compute on read**: up to 200 candidates × three indexed lookups.
- **Frontend surface:** the `PickerView` card gets a "last time: 3 weeks ago" caption. That is a memory, never a
  reproach. The rest is ordering.
- **Data it runs on:** existing history, planner and anchor rows. **No new input.**
- **Size:** backend M; frontend S. It depends on F2-04 adopting the server draw, or the client ranker must consume a new
  read.
- **Risks / open questions:**
  - **Absence is weak evidence.** Most rest is never logged, and an untouched rest block may simply not have been ticked.
    Only *positive* evidence moves `LastDoneAt`. Unkept commitments only nudge the ordering, and only softly.
  - **No list of things you didn't do.** That would be a guilt pile for rest, and leisure must not become an obligation.
  - **Privacy:** none.
- **Dedupe:** extends `_done/leisure` **D1** (the draw) and **F2-04** (the seen record), which uses what was shown; this
  adds what was done. Distinct from `captured-data` **C2** (rewards paired to to-dos).

## Rejected

- **"Does leisure I logged on Saturday change how Monday goes?"** (the prompt's example). There are about four Mondays a
  month, which is too few, and they are confounded by everything else that differs between weeks. More importantly, it
  frames rest as an input to productivity, and rest that has to earn its place is the opposite of what the leisure module
  is for.
- **Late-night device use → next-day skips or `NoEnergy`** (Tracking × Planning). `BedTime` is 00:00 on most rows (Planning
  `domain-map.md:393`), so "late" has no anchor. The F1 pass rejected the matching wind-down nudge for the same reason.
  Late nights also follow hard days, so cause and effect are tangled. And "your phone at 1 a.m. cost you tomorrow" is a
  verdict built from surveillance data. Revisit after F2-10.
- **A per-block adherence score** ("the tracker saw 40% of your plan"). It contradicts the automation's rule that work at
  another time still counts (`ActivityTimeRecordedEventHandler.cs:77-79`), it punishes moving work around, and rule
  coverage is unknown. F3-03 aggregates by band instead.
- **One "accounted day" total across History and tracking.** It double-counts, because tracker-attributed History rows
  carry no source marker (join quality #3). The fix is a `Source` column on `ActivityHistory`, which is infrastructure
  with no user-visible feature until something needs the union.
- **"Routine done but its planner block is not"** (Routines × Planner). This is already handled:
  `RoutineTodoListIsDoneChangedEventHandler` syncs today's blocks for the activity (Planning `domain-map.md:542`).
- **"Do I skip routines when my to-do list is overdue?"** The size of the overdue pile on a past date cannot be
  reconstructed, because renegotiation overwrites `DueDate` (`TodoListItem.cs:8`) and nothing keeps its history (F1-03).
- **Weather × completion or leisure history.** No entity stores provider readings (entity list: the
  `OpenMeteoWeatherProvider` result is used live for the leisure fit). `Calendar.Weather` is a free-text note
  (`Calendar.cs:40`), so there is no weather history to join against.
- **Leisure × tracking** ("phone time crowds out rest"). Classifying leisure apps rests on rules that do not exist for web,
  are not applied on android, and are absent in dev. It would also be the most judgemental sentence the app could write.
- **A nightly "day facts" table joining everything.** It is infrastructure for its own sake: none of the six candidates
  needs precomputation at current volumes, and each says so.
- **"Estimate vs took" for planner blocks by activity.** This is F1-05's per-activity half. F1-05 asked whether it should
  join History sittings instead. **It should not**: join quality #3 and #4 make History and tracker-written actual times
  partly circular. Planner blocks should keep using their own actual times, and F3-01 covers to-dos by item link.

## Out of scope, but noticed

1. **Bug (frontend copy): the calibration header reads backwards.** `useEstimateCalibration.ts:57` computes
   `actual / estimate`. `todoList.en.ts:133` prints it as "Your estimates run about {ratio}x actual time", which says the
   opposite: 1.6 means things take 1.6× the estimate. The SK string (`todoList.sk.ts:144`) is merely ambiguous.
   **Fixed 2026-10-06:** both strings now read "Tasks take about {ratio}x your estimate" / "Úlohy trvajú približne
   {ratio}x tvojho odhadu", and `e2e/tests/todo-motivation.spec.ts:219` matches the new text.
2. **Design flaw (frontend + backend), S3's unit mismatch.** The "usually" figure is a per-*sitting* mean of the
   activity's whole history (`AggregateByActivityActivityHistoryEndpoint.cs:56`), compared with a per-*item* estimate
   (`useEstimateCalibration.ts:57`; the chip at `BaseTodoListItem.vue:238-239`). F3-01 is the fix. A client-only
   stopgap is not possible, because no route returns per-item totals across days.
3. **Stale comment (backend).** `ActivityHistory.cs:16` says the "desktop / web-extension heartbeat" attributes rows.
   Only the desktop heartbeat does (`DesktopActivityHeartbeatEndpoint.cs:114`). The web-extension ingest takes only a
   `DbContext` (`WebExtensionDataHeartbeatEndpoint.cs:13`), and so does the android sync (`AndroidSyncEndpoint.cs:18`).
4. **Stale claims in sibling F1, for F5.** **Corrected in F1 on 2026-10-06**, each with a "Fixed since" note. At backend
   `0409fa0`:
   - **F1 #5 is fixed.** The handler goes through `ApplyStatus` (`ActivityTimeRecordedEventHandler.cs:121`), records
     actual times (`:125-129`), re-syncs reminders (`:133`) and orders its candidates (`:97-98`).
   - **F1 #6 is fixed.** The heartbeat takes the user's day (`DesktopActivityHeartbeatEndpoint.cs:182-186`).
   - **F1-05's risk no longer holds.** It says tracker-driven completions record no actual times; they now do, which is
     also why join quality #4 matters.
   - **F1-03's carry-over half is built** (`PlannerTask.cs:36-42`; Planning `domain-map.md` § *Carrying a task over
     (F1-03)*).
   - **F1 #3 is fixed.** Leisure commitments now send the optional importance (`useLeisureCommitment.ts:102`).
5. **Frontend-only: show the plan on the unified tracking timeline for one day.** Both reads exist: the day-plan route
   and the unified timeline. `activityTracking` may import `dayPlanner`'s `api/`. This puts the plan on the tracking page,
   which already shows device data, so it does not raise F3-03's privacy issue.
6. **Frontend-only: the day progress ring turns red below 50%** (`DayPlannerProgressBlock.vue:67-78`). That is the tone
   the `_done/day-planner` F2 prompt ruled out ("No red, no warning icons").
7. **Known gap that caps every History-side join:** tracker attribution truncates sub-minute seconds (`IntTime.cs:14-18`;
   History `testing.md:77-88`). It is already pinned as `KnownGap`. It is listed here because F2-01, F2-02, F1-02 and
   F3-03 inherit it.
