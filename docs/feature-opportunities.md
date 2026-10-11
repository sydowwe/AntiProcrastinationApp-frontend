# Feature opportunities: needs backend logic

> Synthesised 2026-10-06 · frontend `27dd210b` (working tree dirty: a concurrent session's `docs/opportunities.md`,
> `prompts/feature-discovery/README.md` and 11 untracked `e2e/tests/*.spec.ts`, none of them read as input; plus this
> pass's dated notes in `F1-journey-gaps.md`) · backend `0409fa0`, **clean** (framework submodule `240dc58`) · inputs:
> `docs/feature-discovery/F1–F4`.
>
> This file sits next to `docs/opportunities.md`, which covers frontend-only and DTO-field work. **Every OP there
> (OP1–OP23) is closed**, so none of the candidates below collides with one. The dedupe set was also re-read:
> `docs/notification-audit.md` (N1–N5, none built), `prompts/captured-data/README.md` (C1–C5), and the `prompts/_done/`
> indexes (no commits since 2026-10-03).

## Method

**Step 0, freshness.**
- **Backend.** HEAD is still `0409fa0`, the commit F2, F3 and F4 were rechecked against, so no backend claim has gone
  stale since.
- **Frontend.** Since F3's commit (`369ec8c5`) there are three commits. `81c380e8` is the calibration-copy fix (F3
  *Out of scope* #1 already records it). The other two are docs.
- **F1 was the input not rechecked as a whole.** Its header named `cde16f8`, and only F3 had corrected parts of it, so I
  re-opened F1-01, F1-03, F1-04 and F1-06. Two claims had moved, and each now has a dated *Built since* note in F1:
  - the carry-over now *moves* tasks;
  - a seven-day `GET /planner-task/carry-over-candidates` exists, which halves F1-04's planner gap.

**Steps 1–3.**
- **Merge.** The 26 candidates in F1–F4 became 13. Anything that was not a strong candidate went to *Rejected* with its
  reason.
- **Spot-check.** For each of the top 8 I re-opened the claims it rests on, in both repos (*Evidence re-checked* line in
  each FO). None failed. One was narrowed (FO5).

**Scoring.** Each FO is scored against `_RULES.md` § *Who the user is*. A feature that turns data the app already
holds into one less decision scores highest. A feature that adds a form, a pile or a nag is penalised even when it is
cheap.

## Owner decisions (2026-10-06)

| Question | Decision |
|---|---|
| **FO7:** is `HasExtensionAccess` a deliberate gate? | **No.** Delete the override so the framework default (`=> true`) applies, and add a *Trackers* card with a revoke. Pairing codes (option b) are deferred, not rejected; see FO7. |
| **F4 Q1:** excuse away cycles automatically, or offer it on return? | **Automatically.** Includes the retroactive handler. |
| **F4 Q2:** how much of a longer cycle must be away? | **At least half** of its days (4 of 7 for a week). A 3-day flu inside a week is not excused. |
| **F4 Q3:** does `Special` count as away? | **No.** Only `Vacation` and `SickDay` do. |
| **FO5:** thresholds | **Greet after 4 days away, go quiet after 3**, as proposed. |

Still open: F4 questions 4–10 (holidays, the named stretch and its follow-ons, item streaks). None of them blocks
FO1's first two steps.

## Top picks

1. **FO1. Vacation and sick days stop breaking routines.** Coming back from time away is the moment an ADHD user
   abandons the app. Today that moment greets them with every streak broken. The user already marks the days, so this
   fix needs no new input. Ranks first: highest value, no input, backend M, and it unlocks FO5 and the stretch entity.
2. **FO2. Time logged anywhere ticks off the plan.** A pomodoro on the planned activity completes the planned block,
   the same way desktop-tracked time already does. The automation is finished and has one publisher. This is mostly
   wiring (S–M), and it removes a manual tick from every timed block.
3. **FO3. A task that keeps slipping is offered a smaller first step.** The fourth carry-over of "Call the insurer" gets
   *Start 10 minutes* or *Split it*, never a count. The first phase is backend S with no migration: it reads
   `CarryOverCount` and skip keys through an exact FK that already exists.
4. **FO4. Re-plan the rest of today in one tap.** What slipped is packed into the time that's left, with a preview and
   a one-tap choice for whatever won't fit. It is the biggest single recovery feature. Ranked below FO3 only on cost
   (M + M).
5. **FO5. Coming back after a gap: three decisions instead of a pile.** It covers the absence nobody marked, which FO1
   cannot see. Value is high, but it is M–L and touches the framework's `NotificationService`. It also leans on FO1
   (the away check) and FO3 (the move rule), so it comes after both.
6. **FO6. Recurring commitments put themselves on the plan.** It is opt-in, today and tomorrow only. "Gym Mon/Wed/Fri" is
   the commonest plan nobody re-enters, and today it never reaches home or a reminder. Costs one switch per rule.
7. **FO7. Every user can connect a tracker.** Today only the seeded root admin can sign a tracker in. That makes this
   S-cost gate the onboarding cliff for all of tracking, FO9 included. The owner confirmed the gate is not deliberate
   (2026-10-06).
8. **FO8. Estimates that learn, per item.** To-do and routine estimates, and timer lengths, are fitted to what actually
   happened, keyed on exact links rather than the activity. It fixes S3's unit mismatch. Ranked eighth because the links
   only exist since 2026-10-03, so the data needs a few weeks.

FO9–FO13 are sound but narrower, or blocked on one of the above. They are listed under *Build waves*.

## Build waves

A wave groups features that share a backend change. Every backend step that adds a migration ends with **"owner applies
the migration and restarts the API"** (it runs under Rider's debugger; migrations are applied by hand). The frontend
never ships a call to a route or field that the running API does not have yet.

| Wave | FOs | Shared backend change | Order inside the wave |
|---|---|---|---|
| **A. Away means away** ✅ (2026-10-11) — FO1, FO11 built and browser-checked | FO1, FO11 (then F4-02 if wanted) | Core `DayType.IsAway()` + `CalendarDayTypesChangedEvent`, and both Planning suggestion endpoints (`GetSuggestionsTaskPlannerDayTemplateEndpoint`, `GetSuggestionsRepeatingPlannerTaskEndpoint`) | 1. FO1's no-migration step: `IsAway`, suggestion ranking, J2/J3 skips. 2. FO1's `is_excused` migration + reset sites + event handler. 3. FO11 in the same repeating-suggestions endpoint. Its window is a SQL edit; its dismissal table is the only migration. 4. F4-02 only if the owner answers F4 open question 5 with yes. **Status (2026-10-11):** steps 1–2 built, migration `20261006183310` applied locally. Step 3 (FO11) built and browser-checked 2026-10-11. Step 4 waits on F4 open question 5 |
| **B. The plan follows what happened** ✅ (2026-10-08) | FO2, FO7, FO9 | Publishers of `ActivityTimeRecordedEvent` (only the desktop heartbeat today) and the tracker ingest paths | 1. FO2 (History publishes; client `forceValue` fix in the same change). 2. FO7 (decided: drop the gate, S). 3. FO9: F2-01's Android attribution is the second publisher, then F3-02's rule suggestions. **All three built**; FO9 waits only on an API restart |
| **C. Recover the day** — FO3/FO4/FO6 ✅, FO10 open (2026-10-11) | FO3, FO4, FO6, FO10 | Planner write paths (one "missed" definition, a move-with-trace rule, free-interval packing) and **one batched migration on `planner_task`** | 1. FO3 phase 1 (no migration). 2. FO4 (no migration). 3. **One `planner_task` migration** carrying FO3 phase 2's `OriginalStartTime` / `PostponeCount` *and* FO6's `SourceRepeatingTaskId`, so the hot table is migrated once. 4. FO6's materialiser. 5. FO10 can run any time. It widens FO4's window from midnight to the user's bed time. **Status (2026-10-11):** steps 1–4 built; migrations `20261007200704` and `20261007204638` applied locally. Left: FO10, FO4's live check against the real routes (it was checked with mocks), and the `todo-motivation.spec.ts` re-run for FO3 |
| **D. Coming back** | FO5 | `User.LastActiveAt`, the `IReturnSummarySource` seams, the framework's `IRecipientEngagementReader` | After A (shares FO1's away check) and C (carries tasks with FO3's move rule). The greeting ships first; the notification back-off is a separable second step. **Status (2026-10-11):** step 1 committed (`874ee396`); step 2 built backend-side, not committed |
| **E. Learn from what happened** | FO8 | One shared median/threshold/wording rule; item-keyed History seams | F3-01 (to-dos, exact FKs) → F2-06 (routine items) → F2-07 (timer lengths). Start once ~4 weeks of linked rows exist, i.e. early November. Check the real distribution first |
| **F. Leisure** | FO12, FO13 | `.ActivityProfiles` draw and readiness | FO13 any time (independent handler). FO12: F2-04's weather-in-draw + client adoption, then F3-06's last-done seam |

---

### FO1. Vacation and sick days stop breaking routines, nudging, and suggesting the office
- **Status (2026-10-07): built and committed** (backend `ab5f0e7`, frontend `ec4b7a30`). Migration
  `20261006183310_RoutinePeriodCompletionIsExcused` is the owner's to apply; it was not confirmed applied when this line
  was written. What was built (2026-10-06): backend: Core
  `DayTypeExtensions.IsAway` + `CalendarDayTypesChangedEvent`; `ICalendarDayLookup.GetAwayDatesAsync`;
  `RoutineAwayRule` wired into all five reset sites (job, grouped read, both toggles, the host's planner-task
  sync); `CalendarDayTypesChangedEventHandler` (retroactive); J2/J3 skips; P1 silent for `Excused`; both
  suggestion endpoints; migration `20261006183310_RoutinePeriodCompletionIsExcused`. Item streaks are held
  (F4 open question 10, recommended answer taken). Excused cycles are left out of `totalPeriodsElapsed`, the
  trend and the weekly review card. Frontend: `isExcused` parsed, away cell in both heatmaps, no freeze offer,
  `DayContextBar` line, Details-dialog hint.
- **Source:** F4-01 (F4 unlocks 1–3). F4 unlock 8, the re-entry day, moves to FO5.
- **Moment:** the first morning back from a holiday or a sick week.
- **Today:**
  - **Routines never read the day type.** A grep of `.Routines` for `DayType` finds nothing. `TryReset` scores every
    cycle `Extended` / `OnGrace` / `Broken` from item counts alone (`RoutineResetService.cs:219-251`), and every undone
    item's streak zeroes (`:253-255`).
  - **Freezes cannot cover time away.** They are manual, one per missed cycle, 2 a month by default and 10 at most
    (`RoutineStreakFreezeService.cs`), so a two-week vacation breaks every daily routine.
  - **The nudges ignore away days.** J2 (P4/P5) reads no calendar, and J3 (P6) reads only `WakeUpTime`.
  - **Suggestions rank weekday history above the day type.** Template history mixes weekday and day-type patterns in one
    `OrderByDescending(OccurrenceCount)` (`GetSuggestionsTaskPlannerDayTemplateEndpoint.cs:70-81`), so a vacation Monday
    is offered the office Monday.
  - **The input exists:** `Vacation` / `SickDay` are settable from the Details dialog and the bulk bar.
- **Backend logic needed:**
  - *Core:* `DayType.IsAway()` and `CalendarDayTypesChangedEvent(userId, dates)`.
  - *Routines:* a cycle with at least half its days away is excused. That means `RoutinePeriodCompletion.IsExcused`, a
    CHECK against `IsFrozen`, and `StreakOutcome.Excused`. An excused cycle carries the run like a freeze without
    spending budget, and its item streaks hold. This runs in all three reset sites, with the away dates pre-read through
    the existing `ICalendarDayLookup`, which already carries `DayType` (`ICalendarDayLookup.cs:25`).
  - *Routines, retroactive:* a handler for the Core event excuses past cycles and re-walks the streak.
  - *Routines, nudges:* J2 and J3 skip an away today, and P1 is not sent for `Excused`.
  - *Planning:* on away days, day-type entries rank first, and the two pattern tiers of the repeating suggestions are
    dropped. Planning publishes the event from both day-type write paths.
- **Frontend surface:**
  - an "away" cell in `RoutineGroupHeatmap.vue` / `RoutineGroupHistoryBody.vue`;
  - no freeze action on an excused cell (`useStreakFreeze.ts`);
  - "You're away today" in `DayContextBar.vue` (OP5, built);
  - an optional hint in `CalendarDetailsDialog.vue`.
- **Data it runs on:** `Calendar.DayType` and `RoutinePeriodCompletion.PeriodStart/End`, both existing. **No new input.**
- **Score:** value **H** · data ready **yes** · backend **M** · frontend **S** · risk **M**. It changes what a streak
  means, and it migrates `routine_period_completions`, which is small but hand-configured (no `BaseEntityConfigure()`,
  no `row_version`).
- **Unlocks:** FO5's away check, FO6's gate, F4-02, and the F4-01 suppression rule that N2/N4 will need.
- **Risks / open questions:** F4 open questions 7 and 10. Questions 1–3 were decided on 2026-10-06: excusal is
  automatic, the rule is "at least half the cycle's days", and `Special` is not away. Item streaks cannot be repaired
  retroactively. UTC cycle edges against local dates can be off by one, and the majority rule absorbs it.
- **Dedupe:** new. It adds a suppression condition to audit P1/P4/P5/P6, not a trigger. It re-ranks inside B27's
  response.
- **Evidence re-checked (F5):** the `DayType` grep of `.Routines` (none), `RoutineResetService.cs:219-275`,
  `ICalendarDayLookup.cs:22-31`, and the template endpoint's ordering at `:70-81` (F4 cited `:79-95`; it moved).
- **Implementation split:** a **separate backend agent**: a migration on an existing table, a cross-slice event and
  handler, three reset sites, and row-asserting tests. Then a frontend session.
- **Model / effort:** backend Opus 5.5, high. Frontend Sonnet 5.5, medium.

### FO2. Time logged anywhere ticks off the plan, not only desktop-tracked time
- **Status (2026-10-06): built and checked live (backend `9058535`), no migration.**
  Backend: History's `ActivityTimeRecordedPublisher` (behind `IActivityTimeRecordedPublisher`) runs after both
  creates commit and before the 201. It publishes one event per (local day, activity), with the window clipped at
  local midnight. The day totals are read back through the attribution sink, so they match the heartbeat's.
  Failures are logged, not thrown. `ActivityDayTotal` gains an optional `TodoListItemId` / `RoutineTodoListId`.
  With a link, the fallback completes that item only, and leaves the other kind alone. Without one, it picks the
  oldest open item, not an unordered `FirstOrDefault`.
  **Added on the way: the handler now ignores an event with no unclaimed time.** Without that guard, a timer
  completed from the morning *Coding* block, then logged, flipped the afternoon *Coding* block to *In progress*
  on zero seconds. One existing test seeded no time at its window and was given the heartbeat's real minute.
  Tests: `HistoryTicksOffThePlanTests` (4, over HTTP: a session completes a block, a single row starts one, a linked
  pomodoro completes its own item, the user's local day across a UTC date line) plus 4 new
  `ActivityTimeAutomationTests`.
  Frontend: `BaseTodoListLogTimeController` toggles with `forceValue: true`. `DayPlannerLogTimeController` now
  completes the block *before* it saves the session, rather than both at once.
- **Source:** F2-02. F2-01 later becomes the second publisher (FO9).
- **Moment:** right after a 25-minute pomodoro, when the planner block for that activity still reads *Not started*.
- **Today:**
  - **The automation exists, with one publisher.** `ActivityTimeRecordedEventHandler` completes or starts the planner
    task whose span holds the window. Failing that, it completes a to-do or routine item. Its only production publisher
    is `DesktopActivityHeartbeatEndpoint.cs:196`: a grep for `new ActivityTimeRecordedEvent` finds only that line and
    one test.
  - **History's write paths raise nothing.** `CreateActivityHistoryEndpoint` and `CreateActivityHistorySessionEndpoint`
    publish no event.
  - **The client patches a few paths by hand,** and one patch is a latent bug. `BaseTodoListLogTimeController.vue:80`
    toggles the item with **no `forceValue`**, so a server-side auto-complete followed by this toggle would un-complete
    it.
- **Backend logic needed** (`.History`):
  - Raise the event after both creates commit. The event must carry the user's local `Day` and
    `WindowStart`/`WindowEnd`, resolved through the user's zone (`ActivityTimeRecordedEvent.cs:25-28`), plus the day
    totals from the attribution sink.
  - Key the to-do/routine fallback on the row's item link when it has one. Today the fallback uses an unordered
    `FirstOrDefaultAsync` on the activity.
- **Frontend surface:** none new. The client's manual toggles switch to `forceValue: true`, or are removed, **in the
  same change**.
- **Data it runs on:** existing history rows and the item links. **No new input.**
- **Score:** value **H** · data ready **yes** · backend **S–M** · frontend **S** · risk **M**. The client toggle
  collision is the main risk. A deliberate timer completing the wrong one of two items that share an activity would be
  visible, hence the item-link key.
- **Unlocks:** FO9's Android publisher, and F1-02's start evidence if that is ever built.
- **Dedupe:** new. C5 changed what a session row is, not what it triggers.
- **Evidence re-checked (F5):** the publisher grep (above), and `BaseTodoListLogTimeController.vue:80`, which still
  sends `{ ids: [...] }` alone.
- **Implementation split:** **one session for both repos.** The publisher is additive, with no migration, and the
  client fix must ship with it.
- **Model / effort:** Opus 5.5, high. The zone and window rules and the cross-slice handler semantics are easy to get
  subtly wrong.

### FO3. A task that keeps slipping is offered a smaller first step, and carrying it over stops counting against you
- **Status (2026-10-07): both phases built.** Phase 1 checked live (no migration). Phase 2 (backend `410dced`)
  is built and tested but **not yet live**: it needs migration `20261007200704_PlannerTaskPostponeAndRepeatingSource` applied and
  an API restart. That migration is wave C's single `planner_task` migration, and also carries FO6's two columns.
  - **Phase 2, as built:**
    - **Planner.** `PlannerTaskPostponeRule` is the one rule, fed by `PlannerTaskMoveRecorder` from the PUT and the
      span patch. A move is a postponement when the task was `NotStarted`, the new slot is later, and the
      *original* slot has passed on the user's clock. It adds 1 to `PostponeCount`; on the first slip it fixes
      `OriginalDate` + `OriginalStartTime` as a pair. Carry-over sets the same pair but counts only
      `CarryOverCount`, so the two counts are disjoint. Moving a started block, or tidying up a future day, is not
      counted.
    - **Drift.** The trend measures a block's lateness from its original start while it is still on that day, so
      a snoozed block started at its new time reads as late.
    - **To-dos.** `TodoListItemPostponeRule` adds 1 to `PostponeCount` and sets `FirstDueDate` once, when an open
      item's due date is pushed later after its first due date has passed. It runs on the item PUT and on the new
      `POST /todo-list-item/reschedule-overdue { listId?, days }`, which the banner now calls instead of a PUT per
      item.
    - **Help.** Both counts feed `planHelp` as failed attempts that point to *a smaller step*. An item that is only
      ever renegotiated can be stuck too. Neither count reaches the wire (`[JsonIgnore]`; asserted on raw JSON).
    - **Not done:** an undo of the bulk reschedule restores the dates but leaves the postponement counted (no
      undo endpoint). FO4's *apply* must call `PlannerTaskMoveRecorder` too.
  - **Backend:** `ITodoListItemPlanSource.PlanHistoryAsync` sorts every linked block by outcome: completed,
    carried over (the sum of `CarryOverCount`), missed (a foreground `NotStarted`/`OnHold` block on a day before
    the user's today), and skipped per key. TodoLists' `TodoListItemPlanHelp` turns that into `planHelp`
    (`smallerStep` / `shorterBlock` / `reconsider`) on get-all, get-by-id and the dashboard widget.
  - **The rule:** stuck = 3+ failed attempts and none completed, and the item is open. The kind is the dominant
    reason: not-relevant → `reconsider`, no-time → `shorterBlock`, everything else → `smallerStep`. Ties go to the
    gentler offer. No count reaches the wire.
  - **Tests:** `TodoListItemPlanHelpTests` (5, over HTTP, one built from three real carry-overs and asserting the
    raw JSON has no count field) and `TodoListItemPlanHelpRuleTests` (7, pure).
  - **Frontend:** `StuckItemOffer.vue` under a stuck row in `NormalTodoListItem`, on the list and in home's
    `TodoListWidget`. It offers *Start 10 min*, *Split into steps* and *Pair a reward* (each of those opens the
    edit dialog on its field), plus *Let it go* (the ordinary delete). The kind picks the lead option.
  - **Dismissal:** *Not now*, or acting on the offer, puts it away for 7 days, device-local and user-scoped
    (`usePlanHelpDismissal.ts`). On home, everything except *Start 10 min* goes to the lists page, as the
    widget's own edit and delete already do. Spec: `e2e/tests/todo-stuck-item-offer.spec.ts`.
- **Source:** F3-05 + the remainder of F1-03 (its carry-over half is built).
- **Moment:** the list shows "Call the insurer" again, after four planner attempts that were skipped or carried over.
- **Today:**
  - **The planner keeps each attempt.** Every linked task keeps its status, skip key, `OriginalDate` and
    `CarryOverCount` (`PlannerTask.cs:10-13,36-42`).
  - **The to-do side sees only the next open slot.** `TodoListItemPlanSource` drops `Completed`, `Cancelled` and
    everything before today (`TodoListItemPlanSource.cs:24-31`), so every failed attempt is invisible to the list.
  - **Moves on the same day leave no trace.** Home's *Move later*, the day view's reschedule and the to-do renegotiation
    still overwrite the planned time or due date. A grep of every `*.cs` finds no `PostponeCount`,
    `OriginalStartTime` or `FirstDueDate`. A carried task is still *moved* correctly (F1-03 *Partly built since*).
- **Backend logic needed:**
  - **Phase 1** (`.Planning` + `.TodoLists`, no migration):
    - `ITodoListItemPlanSource.PlanHistoryAsync(itemIds)`, joined on the exact FK `planner_task.todolist_item_id`;
    - a derived, never-stored `planStuck` on the item read: 3 or more failed attempts and none completed;
    - the response carries the *kind* of help (`smallerStep` / `shorterBlock` / `reconsider`, chosen from the dominant
      skip key or carry-overs), **never the counts**.
  - **Phase 2** (wave C's single `planner_task` migration):
    - `OriginalStartTime` and `PostponeCount` on `PlannerTask`; `FirstDueDate` and `PostponeCount` on `TodoListItem`;
    - one increment rule across the update, span-patch and replan paths: the item moves later while `NotStarted` /
      overdue, after its original start has passed;
    - `POST /todo-list-item/reschedule-overdue { listId?, days }`, which replaces the per-item PUT loop
      (`useOverdueRenegotiation.ts:34,54`).
- **Frontend surface:** one offer on a stuck item in `BaseTodoListItem` and home's `TodoListWidget`: *Start 10 minutes*
  (S2 quick-start), *Split into steps*, *Pair a reward*, or *Let it go*.
- **Data it runs on:** existing planner tasks and the FK. `CarryOverCount` only exists since the carry-over command
  landed (2026-10-04), but skip keys go back further. **No new input.**
- **Score:** value **H** · data ready **yes** (phase 1) · backend **S** then **M** · frontend **S–M** · risk **L**, then
  **M** for phase 2 (the hot-table migration and four write paths).
- **Unlocks:** FO5 (the move rule), and phase 2 corrects the plan-vs-actual trend's drift input.
- **Risks / open questions:** **never show the number.** Whether a carry leaves the streak denominator is a streak-rule
  call (F1-03). Tracker-completed blocks count as completed, which is the forgiving direction.
- **Dedupe:** extends `_done/todo-motivation` N2 and C1. It merges F1-03 (the slip on the task) with F3-05 (the slip
  carried to the item).
- **Evidence re-checked (F5):** `PlannerTask.cs:31-42`, `TodoListItemPlanSource.cs:14-40`, and the grep for the phase-2
  columns (none).
- **Implementation split:** phase 1 is **one session**: an additive seam method and a derived flag. Phase 2 needs a
  **separate backend agent**: a migration on an existing hot table and a rule across write paths.
- **Model / effort:** Opus 5.5, high, for both. The framing (offer help, never a score) is the hard part.

### FO4. "Re-plan the rest of today": one tap moves what slipped into the time that's left
- **Status (2026-10-07): built, no migration; live check waits on an API restart.** Backend `565f3e6`, frontend
  the commit after `0fd7e874`. The running API predated it, so the UI was checked with mocked `replan` /
  `apply` routes, and *Move later* falls back to its old shift until the restart.
  - **Backend:**
    - `POST calendar/day-plan/{date}/replan` returns a preview with a token. `…/replan/apply` recomputes from
      the token in one transaction, with one reminder re-sync.
    - A changed day, a token older than 10 minutes or a second submit is a 409, and nothing is written.
    - `GET …/next-free-slot?minutes=&notBeforeMinute=&excludeTaskId=` finds one block's slot.
    - "Missed" is derived in one place (`PlannerTaskMissedRule`), and the packing is `DayPacking`.
    - Every move goes through `PlannerTaskMoveRecorder`, so a re-plan counts postponements like a manual move.
    - What moves: `NotStarted` foreground blocks of activities that are not unavoidable. `InProgress`, `OnHold`,
      `Completed` and unavoidable blocks stay put; background blocks neither move nor block.
    - The window runs from now to bed time, which is 23:59 until FO10. Optional blocks (importance 666) give way
      first.
    - *Tomorrow* keeps the time of day and does not check tomorrow's free time.
  - **Frontend:**
    - `ReplanDayForm.vue`: a before/after `MiniTimeline`, the moves listed in text, and a *Tomorrow* / *Skip*
      toggle per block that won't fit (optional blocks default to *Skip*). A 409 swaps in a fresh preview.
    - Shared flow: `useDayReplan`. A preview with nothing to move never opens the dialog.
    - Entry points: the now bar (missed mode), the planner card header, and `ReplanTodayBanner` on today's day
      view. All three are offered only when `isMissedAndMovable` matches a block.
    - Home's *Move later* asks `next-free-slot`.
  - **Not done:** the leisure "Do it now" and to-do handoff callers of `next-free-slot`; the N5 notification.
- **Source:** F1-01. It can later read FO10's bed time and F3-04's typical-load figure (both noted in *Rejected* /
  FO10).
- **Moment:** 11:30, after the 10:00 and 11:00 blocks both slipped.
- **Today:**
  - **Recovery is per task, and nothing knows where the free time is.** `snoozeTask` moves one block and checks nothing
    else on the day (`useTodayPlan.ts:359-375`).
  - **The carry-over places blind too.** It now moves rather than copies, but it lands at the same time of day behind an
    overwrite confirm (`OverdueTasksBanner.vue:125-156`).
  - **Leisure "Do it now"** books from now without an overlap check.
  - **The server has neither piece:** no "missed" state, and no free-slot or replan route (a grep of every `*.cs` for
    `replan|freeSlot|NextFree` finds nothing).
- **Backend logic needed** (`.Planning`):
  - **One "missed" definition:** `NotStarted`, not background, and `EndTime` passed in the user's zone. It is derived,
    never stored, and N5 can reuse it.
  - **`POST /calendar/day-plan/{date}/replan` returns a preview.** It packs the missed tasks and the not-yet-started
    future ones, in order, into the free intervals before bed time. Fixed blocks stay put: `InProgress`, `Completed`,
    `IsUnavoidable` activities and background tasks. Optional tasks drop first when time runs out, and the rest come back
    as `wontFit[]`.
  - **`POST …/replan/apply`** moves everything in one transaction, resolves `wontFit[]` (to tomorrow, or a skip with
    `NoTime`), and runs one `SyncForPlannerTasksAsync` for the whole set.
  - **`GET …/next-free-slot?minutes=`** applies the same rule to one block, for snooze, leisure and the to-do handoff.
- **Frontend surface:** a *Re-plan the rest of today* button in `NowBar` (missed mode), in the `DayPlannerWidget` header
  and in a today-only `DayPlannerView` banner. The preview renders on the existing grid. *Move later* switches to
  `next-free-slot`.
- **Data it runs on:** planner spans, status and importance, `Activity.IsUnavoidable`, `Calendar.BedTime`. **No new
  input** beyond one tap and one choice.
- **Score:** value **H** · data ready **yes** · backend **M** · frontend **M** · risk **L–M**. There is no schema change,
  and it never auto-applies.
- **Unlocks:** one placement rule for three modules, and an action N5's notification can carry.
- **Risks / open questions:** what counts as fixed (start with `IsUnavoidable` + `InProgress`). `wontFit[]` is resolved
  inside the action and never parked as a list. Until FO10, the window runs to midnight (`BedTime` defaults to 00:00).
- **Dedupe:** new. It extends audit N5 and `_done/home` H9.
- **Evidence re-checked (F5):** `useTodayPlan.ts:359-375`, `OverdueTasksBanner.vue:125-156`, and the backend grep
  (above). F1 now carries a *Built since* note for the carry-over change.
- **Implementation split:** a **separate backend agent**. The packing rule is real domain logic with edge cases
  (overlaps, background tasks, importance), and an atomic apply with one reminder re-sync. Then a frontend session.
- **Model / effort:** Opus 5.5, high, for both.

### FO5. Coming back after a gap: one card turns the pile into three decisions, and the app goes quiet while you're gone
- **Status (2026-10-08): step 1 (the greeting) built and on backend `dev` (`8863158`), migration
  `20261008080300_UserLastActiveAndWelcomeBack` applied.** Frontend card built and committed: `WelcomeBackCard.vue`
  above the now bar, in `src/core/home/`. Checked end to end in the browser against the real API (2026-10-08), at
  desktop and phone widths: the card with the seed's pile, start fresh (7 to-dos spread, 4 tasks closed, 5
  notifications read), undo from the toast (all restored, card back), and dismiss (stays gone after a reload). The
  back-off (step 2) is not built. Built: `User.LastActiveAt` (hourly stamp, tracker tokens excluded) and
  `GET /welcome-back`, plus `POST /welcome-back/fresh-start`, `/fresh-start/undo` and `/dismiss`. Also a server-only
  `SkipReasonKey.Away`, which the skip summary ignores. Two departures from the spec below:
  - Host-side with no per-slice seams, as the deletion summary is.
  - The card's past tasks span the whole absence, not only days older than seven, so answering it also clears the
    carry-over banner.
  FO6's `IsUserAbsentAsync` deliberately stays false, because every caller is the user's own request.
- **Source:** F1-04 + F4 unlock 8 (the re-entry day).
- **Moment:** opening the app after eight unplanned days, onto overdue to-dos across four lists, broken streaks and a
  wall of unread notifications.
- **Today:**
  - **The planner half is partly built.** `GET /planner-task/carry-over-candidates` covers the last seven days in one
    read (`GetCarryOverCandidatesPlannerTaskEndpoint.cs:13-31`).
  - **Everything else is still per slice.** To-do renegotiation is per list and client-side
    (`useOverdueRenegotiation.ts:34,54`). The dashboard query has no lower bound (`GetDashboardTodoListItemEndpoint.cs:46`).
    Routine streaks are simply gone.
  - **Nothing can tell an absent user from a busy one.** `User.cs` has no activity field. OP19's `lastLoginAt` is the
    last *sign-in*, not the last use, so the routine producers keep pushing every day.
- **Backend logic needed** (host, with keyed `IReturnSummarySource` seams per slice):
  - **`User.LastActiveAt`,** stamped at most hourly.
  - **`GET /welcome-back`** returns null under 4 days away. Otherwise it returns the overdue to-dos, the past
    `NotStarted` planner tasks (beyond the seven-day banner), the broken routine streaks, and the unread count.
  - **`POST /welcome-back/fresh-start`** applies three choices in one call, with an undo token. To-dos become "someday"
    or are spread over N days. Past tasks are closed with a new `SkipReasonKey.Away`, or carried with FO3's rule.
    Notifications are marked read.
  - **Back-off:** a framework collaborator, `IRecipientEngagementReader` (default: engaged), lets `NotificationService`
    hold non-essential kinds after 3 days away.
  - **One "away today?" check, shared with FO1.**
- **Frontend surface:** a one-time card above the NowBar on `HomeView`, with three rows, sensible defaults and *Start
  fresh*. FO1's away days get "welcome back" copy here instead of an overdue banner.
- **Data it runs on:** existing rows in four slices, plus one new column. **No new input** beyond three optional
  choices.
- **Score:** value **H** · data ready **partly** (`LastActiveAt` only accumulates from deploy) · backend **M–L** ·
  frontend **M** · risk **M** (a two-repo framework change for the back-off; separable).
- **Risks / open questions:** the thresholds are decided (2026-10-06): the card greets after 4 days away, and the
  back-off starts after 3. So a 3-day absence goes quiet but gets no card on return. That is deliberate: a long weekend
  should not trigger a greeting. The card is never
  led by numbers. `SkipReasonKey.Away` also needs its wire token and labels.
- **Dedupe:** new as a whole. It extends `_done/todo-motivation` N2 and the planner carry-over, and complements FO1.
  The back-off is a suppression rule, not a new notification.
- **Evidence re-checked (F5):** `User.cs:10-33`, `GetDashboardTodoListItemEndpoint.cs:43-47`,
  `useOverdueRenegotiation.ts`, and the carry-over-candidates endpoint. **Narrowed:** the planner half now only needs
  days older than seven (F1 *Built since* note).
- **Implementation split:** a **separate backend agent**: cross-slice seams, a column on `users`, and a framework
  collaborator, which means two backend repos. Then a frontend session.
- **Model / effort:** backend Opus 5.5, high. Frontend Sonnet 5.5, high.

### FO6. Recurring commitments put themselves on the plan (opt-in, today and tomorrow only)
- **Status (2026-10-07): built and committed (backend `5c17788`, frontend the commit after it); two migrations to
  apply,** FO3 phase 2's `20261007200704` first. Backend: `RepeatingTaskMaterialiser` (Planning)
  runs from `GET /calendar/day-plan/{date}` (home) and `GET /calendar/by-Date/{date}` (the day planner) for the user's
  today and tomorrow, and after a rule's create/update.
  **The "never twice" record is `RepeatingPlannerTask.MaterialisedThrough`** (migration
  `20261007204638_RepeatingPlannerTaskMaterialisedThrough`), because a deleted occurrence takes its own `planner_task`
  evidence with it. Every day the materialiser looks at is decided, so a deleted or skipped occurrence never returns,
  and neither does one on an away day that is un-marked later. Conflicts go through
  `PlannerTemplateApplier.StageAgainstDay` (split out of `Stage`) with `DefaultConflictResolution`. A rule edit
  updates its *untouched* occurrences from today on: `NotStarted`, no original slot, still the old rule's exact plan,
  and no to-do, Google or reminder link. When the rule stops placing on a day, such an occurrence is removed. A day
  the edit newly matches gets its block. The day matcher `RepeatingPlannerTaskSchedule.FallsOn` is now shared with
  the suggestion endpoint. The validator refuses `AutoPlace` on a `DayType` rule scheduled only for away days. The
  FO5 hook is `IsUserAbsentAsync` (always false). Frontend: the switch in `RepeatingTaskDialog`, and a `repeat`
  mark in the origin slot of `PlannerTaskBlock`. **Not built:** reminders (N1). Marking a day away after its
  occurrence was placed does not remove the occurrence.
- **Source:** F1-06.
- **Moment:** Wednesday 17:40. "Gym, Mon/Wed/Fri 18:00" exists as a rule, but home doesn't show it and no reminder is
  coming.
- **Today:**
  - **A rule nothing materialises.** `RepeatingPlannerTask` has no materialisation field (`RepeatingPlannerTask.cs:5-16`).
  - **It surfaces in one place.** It shows only as a suggestion in the day planner's side panel. Home reads
    `GET /calendar/day-plan/{date}`, which returns real tasks only.
  - **No reminder can reach it.** The audit's N1 covers only real `PlannerTask` rows, and N1 is still unbuilt: the
    Planning endpoints re-sync existing reminders, but no planner-task create registers one.
- **Backend logic needed** (`.Planning`):
  - **Two columns:** `RepeatingPlannerTask.AutoPlace` (default false) and `PlannerTask.SourceRepeatingTaskId` (`SET NULL`,
    indexed, navigation-free). **Already added (2026-10-07)** in FO3 phase 2's migration
    `20261007200704_PlannerTaskPostponeAndRepeatingSource`; no DTO exposes them and nothing writes them yet.
  - **A materialiser beside `CalendarProvisioner`.** It runs lazily from the day-plan read for today and tomorrow, and
    creates one `NotStarted` occurrence unless one with that source already exists, whatever its status.
  - **Occurrence rules.** Deleting or skipping an occurrence never touches the rule and is never undone. Editing the rule
    updates untouched future occurrences. A conflict follows `DefaultConflictResolution`.
  - **Gates:** skip a day that FO1 marks away, and a user that FO5 sees as absent.
- **Frontend surface:** one switch in `RepeatingTaskDialog` ("Put it on my plan automatically"), and a small repeat
  mark in OP15's origin slot.
- **Data it runs on:** existing rules. **New input:** one switch per rule, once.
- **Score:** value **M–H** · data ready **yes** · backend **M** · frontend **S** · risk **M** (a GET that writes, with
  precedent in `GET /planner/settings`; and auto-placed blocks the user didn't choose today).
- **Unlocks:** N1 for recurring commitments.
- **Dedupe:** it extends audit N4 and OP10, and is distinct from FO11 (patterns, not user-set rules).
- **Evidence re-checked (F5):** `RepeatingPlannerTask.cs` (no `AutoPlace`), a grep for `AutoPlace|SourceRepeatingTaskId`
  (none), and the reminder-registration call sites (the 11 Planning endpoints that call it do not include a
  planner-task create).
- **Implementation split:** a **separate backend agent** for the materialiser that writes from a read path (the
  `planner_task` columns already landed with FO3 phase 2). Then a small frontend session.
- **Model / effort:** backend Opus 5.5, medium. Frontend Sonnet 5.5, low.

### FO7. Every user can connect the desktop tracker, browser extension or phone app
- **Status (2026-10-07): built and committed, no migration.** Backend `bcf8671` deletes the `HasExtensionAccess`
  override; framework `4edb8bd` adds `IsExtensionClient` to `GET /user/sessions`. Frontend `ba3e54ea` adds
  `TrackersCard.vue` under `#integrations` (what each tracker records, in the privacy policy's words, plus a *Sign out*
  per tracker session); `_common` `a0d8095` labels tracker sessions "App" and makes the revoke quiet on a 404.
  The column `User.HasExtensionAccess` is still there, unread, until a migration drops it. Pairing codes stay deferred.
  **Follow-up (2026-10-07, backend `dc5059c`, API restart needed):** a tracker token could still open `/hubs/notifications` and receive live
  notifications, because the hub is not a FastEndpoints route and never got the configurator's `DenyExtensionClients`.
  `Program.cs` now attaches the policy to the hub mapping, pinned by
  `ExtensionActivityTrackingTests.ExtensionJwt_CannotOpen_TheNotificationHub`. With that, a tracker token reaches only
  the three ingest routes (desktop heartbeat, web-extension heartbeat, Android sync), and those return counts, not data.
- **Source:** F2-03.
- **Moment:** a new user installs the tracker, signs in, and gets "Extension access not enabled for this account".
- **Today:**
  - **One flag gates all three trackers.** `ExtensionLoginEndpoint` gates on `User.HasExtensionAccess` (`User.cs:17`,
    default `false`).
  - **Only seeders write it.** The production writers are `DefaultUsersSeeder.cs:55,70` (the root admin); the other hits
    are the e2e seeder and tests.
  - **No screen mentions it,** so all three trackers work for the root account only.
- **Decided (2026-10-06): the gate was never meant to be.** The flag added no security. The tracker already signs in
  with the account's own password, through the same `PasswordSignInFlow` (lockout, e-mail confirmation, 2FA) and a
  5-per-minute throttle (`BaseExtensionLoginEndpoint.cs:64,71`). The access check runs only after the password is
  verified (`:83`). The `ActivityTracking` role still comes from the token's client type alone
  (`ExtensionRoleClaimsProvider.cs:31`), so web tokens stay shut out of the tracking endpoints.
- **Backend logic needed** (host):
  - **Delete the `HasExtensionAccess` override** in `ExtensionLoginEndpoint.cs:24`, so the framework default
    (`=> true`) applies. Leave the column for now. Dropping it is a later migration, and the seeders and
    `DefaultUsersSeederTests` still write it.
  - **Tell tracker sessions apart.** `RefreshToken.IsExtensionClient` is stored, but the sessions list does not return
    it (`UserSession.ts` has no such field). Add it to the session response as an additive framework field, so the card
    can list trackers and the existing session revoke kills them.
- **Frontend surface:** a *Trackers* card in `/user/settings` → `#integrations`, beside `GoogleCalendarCard.vue`. It
  says plainly what each tracker records, lists the connected tracker sessions, and offers a revoke on each.
- **Data it runs on:** the existing refresh-token rows. **New input: none.**
- **Score:** value **M** (it gates every tracking feature) · data ready **yes** · backend **S** · frontend **S** · risk
  **L–M** (privacy: the card must say plainly what a tracker records).
- **Unlocks:** FO9, and every tracking-dependent join in F2–F3.
- **Risks / open questions:**
  - **Pairing code (option b), deferred.** Build it only if typing a password into a tracker becomes the problem. The
    likely case is an account created through Google sign-in (`GoogleSignIn.vue`), which may have no password to type.
    Checked 2026-10-08 (see FO9's status): it has none, and *Forgot password* sets one.
  - **The self-service toggle (option a) is rejected.** It adds a consent click and no security.
- **Dedupe:** new.
- **Evidence re-checked (F5):** the grep for `HasExtensionAccess =` assignments (seeders and tests only).
- **Implementation split:** **one session for both repos.** It removes one override and adds one framework session
  field. The framework change is backend submodule first, then the pointer.
- **Model / effort:** Sonnet 5.5, medium.

### FO8. Estimates that learn from what happened, per item and per timer
- **Source:** F3-01 (to-do items, lead) + F2-06 (routine items) + F2-07 (timer lengths). They share one rule for
  medians, sample thresholds and wording.
- **Moment:** typing "30 min" into an *Admin* to-do when the last eight *Admin* items took about twice that; starting
  a 25-minute focus that usually stops at 12.
- **Today:**
  - **To-dos calibrate on the activity.** S3's figure is keyed on the activity, summing all its history (tracker rows
    included) per *sitting* (`AggregateByActivityActivityHistoryEndpoint.cs:43-57`). The client then divides it by a
    per-*item* estimate. No route returns item time across days.
  - **The routine link is unread.** `ActivityHistory.RoutineTodoListId` has no reader beyond validators, ownership
    checks and the index (grep).
  - **Timer outcomes are unread.** `ActivityHistorySession.Outcome` and `PlannedLength` (OP6) are only echoed and
    exported.
- **Backend logic needed:**
  - **F3-01, to-dos:** `GET /todo-list-item/estimate-fit?groupBy=list|category|priority`, over the exact FKs
    (`ITodoListItemLoggedTimeSource` plus one new `ITodoListItemPlanSource` method).
  - **F2-06, routines:** a `RoutineItemLoggedTimeSource` seam, plus `typicalSeconds` / `sampleCount` on the routine
    response.
  - **F2-07, timers:** `GET /activity-history/session/fit?activityId=` returns the largest length that completes at
    least 70% of the time.
  - **Shared rule:** all compute on read, use medians, and say nothing below their thresholds (5 / 3 / 5 samples).
- **Frontend surface:**
  - the `TodoListView` header and the item chip (replacing the activity ratio);
  - "usually ~18 min" on routine rows;
  - a "Try 15 min" chip in the timer setup and `TrackTimeDialog`.
- **Data it runs on:** existing rows. The item links exist only since 2026-10-03, and `PlannedLength` only since OP6.
  **No new input.**
- **Score:** value **M** · data ready **partly** (young links) · backend **S–M** per part · frontend **S** · risk **L**.
- **Risks / open questions:** describe the estimate, never the person. Never rewrite `SuggestedTime` automatically: it
  also gates tracker auto-completion. The timed items are the ones the user chose to time.
- **Dedupe:** extends `_done/todo-motivation` S3 (and fixes its unit mismatch, F3 *Out of scope* #2), OP13, OP6 and C5.
- **Evidence re-checked (F5):** `AggregateByActivityActivityHistoryEndpoint.cs:43-57`, and the `RoutineTodoListId` reader
  grep.
- **Implementation split:** **one session for both repos** per part. These are additive reads with no migration.
- **Model / effort:** Sonnet 5.5, high. The shared wording rule is worth a careful pass.

### FO9. Tracking that covers your day: phone time counts, and the tracker suggests rules from your own timers
- **Status (2026-10-08): built and browser-checked, no migration.** Checked against the restarted API with six
  timers posted for the seed user: both grids showed their chip, *Create rule* confirmed and created the exact
  rule (the row then showed it), and *Not this* survived a reload.
  - **F2-01, backend.** `AndroidSyncEndpoint` resolves each *newly stored* session through
    `AndroidMappingRuleSet` and attributes it with a new sink method,
    `IActivityTimeAttributionSink.AttributeSpanAsync`. A re-sent session is skipped by the existing dedup, so
    it is never attributed twice. An ignore rule attributes nothing; the session is still stored.
  - **Double-count policy (decided here).** A second of phone time is not added when a record of the
    *same activity* already covers it (a timer, the desktop heartbeat, an earlier session in the batch); what is
    left extends the record it touches. Other activities' records are not subtracted — overlapping rows of
    different activities were already possible, and picking between sources stays the unified dashboards' job.
    A leftover under a minute that extends nothing is dropped, because `IntTime` would store it as zero.
  - **Only the user's today drives completion.** The sync publishes `ActivityTimeRecordedEvent` (the FO2
    rule) for today only. A sync is a backlog upload, and the handler's to-do / routine fallback has no day,
    so last Tuesday's reading would otherwise tick off today's routine item. Past days are attributed to
    History and stop there.
  - **F3-02, backend.** New Core seam `IFocusIntervalSource` (History: Pomodoro `Focus` rows and countdown
    rows only) and `GET /activity-tracking/desktop/mapping-suggestions?days=30` (1–90). It joins focus
    intervals to the desktop ledger by `WindowStart`, drops minutes any active rule covers (ignore rules
    included), and suggests an **exact-process, activity-target** rule at 3+ sittings, 10+ minutes and 70 %+
    under one activity (`MappingSuggestionRule`). Role-level suggestions were left out: a role-only rule moves
    dashboards but not completion, which is not what "Suggested: Thesis" promises.
  - **F3-02, Android.** `GET /activity-tracking/android/mapping-suggestions?days=30` suggests an
    **exact-package** rule on the same thresholds, with phone sessions clipped to the focus interval, plus one
    more: the app must fill at least half the timer sittings it appeared in (`MappingSuggestionRule.MinFill`).
    On a phone, the app in the foreground during a focus timer is as often the distraction as the work, so
    Instagram checked through every Thesis pomodoro would otherwise pass. Duolingo through a language timer
    does pass. The desktop does not apply it: work there is spread over several processes.
  - **F3-02, frontend.** `component/settings/MappingSuggestionChip.vue` replaces *Undecided* on a desktop or
    android distinct-entries row that has a suggestion: "Suggested: Thesis · seen in 7 of your 9 Thesis
    timers", *Create rule* (confirms what the rule will do, then the ordinary create) and *Not this*
    (device-local, user-scoped, keyed by process or package + activity). The load and the dismissals are
    `useMappingSuggestions`, shared by both grids.
  - **Tests:** `AndroidSyncAttributionTests` (5), `DesktopMappingSuggestionsTests` (6),
    `AndroidMappingSuggestionsTests` (4), five new `ActivityTimeAttributionSinkTests`, `SeamWiringTests`
    extended.
  - **Not done:** the android sessions synced before this stay unattributed (no backfill).
  - **FO7's pre-FO9 check:** an account created through Google sign-in has no password
    (`UserRegistrationFlow.cs:125`), so it cannot sign a tracker in directly. *Forgot password* does set one
    (`ResetPasswordAsync` works on a passwordless account), so it is a detour, not a dead end. Pairing codes
    stay deferred; a hint on the *Trackers* card for passwordless accounts would be the cheap fix if it bites.
- **Source:** F2-01 (Android attribution) + F3-02 (mapping suggestions).
- **Moment:** 90 minutes of phone reading missing from history, and an *Uncovered* list of processes with no hint
  which one was the thesis.
- **Today:**
  - **Android rules apply to nothing.** `AndroidSyncEndpoint` takes no attribution sink, and the server's own warning
    says so (`AndroidMappingRuleSet.cs:10`).
  - **Every desktop rule is hand-written.** There is no suggestion logic in `.Tracking` or `src/core/activityTracking`.
    Rule coverage caps every tracking join (F3 *Join quality* #7: zero in dev).
- **Backend logic needed:**
  - **F2-01:** resolve each newly inserted Android session through the rule set, attribute it idempotently on the
    existing unique key, and publish `ActivityTimeRecordedEvent` on the user's local day (the FO2 rule).
  - **F3-02:** a Core seam, `IFocusIntervalSource` (timer focus rows only), and
    `GET /activity-tracking/desktop/mapping-suggestions` (time overlap with the desktop ledger, minus covered entries).
    It suggests at 3 or more sessions, 10 or more minutes and 70% or more under one activity.
- **Frontend surface:** none new for F2-01 (copy on the Android mappings tab). For F3-02, a *Suggested: Thesis* chip
  with *Create rule* / *Not this* on the desktop *Uncovered* tab.
- **Data it runs on:** the rules the user wrote, timer sessions, the ledgers. **No new input.**
- **Score:** value **M** · data ready **yes** · backend **M + M** · frontend **S** · risk **M**. Desktop + Android
  double counting has no precedence in `ActivityHistory`. A wrong rule is silent and permanent, so a suggestion is
  never applied automatically.
- **Dedupe:** new. B24 found the Android gap and deferred it; this proposes the decision B24's chip asks for.
- **Implementation split:** a **separate backend agent**: idempotent ingest attribution, a cross-slice seam, and a
  double-count policy decision.
- **Model / effort:** Opus 5.5, high.

### FO10. Mornings start when yours do
- **Source:** F2-10.
- **Moment:** a user who wakes at 10:30 gets the 08:00 routine push. Every future morning sweep (N2, N4) and FO4's
  window inherit the same defaults.
- **Today:** every day row is created at `WakeUpTime 08:00` / `BedTime 00:00` (`CalendarDayFactory.cs:20-26`, whose
  comment records the postponed decision), and `CalendarSeeder` pre-fills two years.
- **Backend logic needed:** a per-user default wake and bed time in `/user/preferences` (CLAUDE.md § *Where a
  preference lives*, rule 2), read by `CalendarDayFactory.Create`. A one-off backfill rewrites untouched future rows
  only, which needs an override marker.
- **Frontend surface:** two time pickers in `/user/settings` → Preferences, via `userAugmentation.ts`.
- **Data it runs on:** `Calendar.WakeUpTime/BedTime`. **New input:** two times, once.
- **Score:** value **M** · data ready **partly** · backend **M** · frontend **S** · risk **M** (a data backfill on the
  pre-seeded `calendar` table).
- **Unlocks:** FO4's window, audit N2/N4's anchor, and the late-night ideas F1 and F3 rejected for lack of one.
- **Dedupe:** new. It is the prerequisite the audit's sweeps assume.
- **Implementation split:** a **separate backend agent**: a data backfill on an existing hot table, with a marker.
- **Model / effort:** Opus 5.5, medium.

### FO11. Planner suggestions that follow what you do now, not what you did once
- **Status (2026-10-11): built, committed and browser-checked against the real API** (backend `ae81381`,
  frontend the commit after `5f682c87`). The owner applied
  the migration and restarted the API, and the view stamp matches the new script.
  - **Setup:** six planner tasks were created through the app's API (Morning Exercise and Read a Novel, three
    past Mondays each). Monday 12 October then showed both as "every Mon · seen 3×" rows.
  - **Results:** × dismissed one (`dismiss` 204, row gone, snackbar with Undo). Undo on the other brought it
    back (`dismiss/undo` 204). After a reload the server still hid the dismissed one. Exactly one row is in
    `planner_suggestion_dismissal`.
  - **Found on the way:** `ReplanTodayBanner.vue` (FO4) blanked the whole day view on any full page load. The
    store persists `viewedDate` to sessionStorage as a string, and `formatDateForApi` threw on it. It is now
    wrapped in `new Date(...)`. FO4's own check had used mocked routes and in-app navigation, so it never
    reloaded.

  What was built:
  - **Window:** both views count only recent sittings. A weekday pattern needs 3+ in 12 weeks and one in the
    last 4. A day-of-month pattern needs 3+ in 12 months and one in the last 3. The numbers live in
    `SuggestionPatternWindow` and are repeated literally in both SQL scripts, because a view takes no
    parameters. `SuggestionPatternRefreshQueue` marks both views dirty once per UTC date, so the window moves
    even when nothing is written.
  - **Dismissal:** a `PlannerSuggestionDismissal` table and `POST /repeating-planner-task/suggestions/dismiss`.
    One row hides both pattern tiers, never a user-set rule. It lapses after one window length, and by then
    a pattern can only come back by re-forming from sittings made after the dismissal. A merge carries it.
  - **Undo, beyond the spec:** `POST …/dismiss/undo`, because a dismissal hides a pattern for weeks and the
    app pairs one-tap removals with an Undo snackbar.
  - **Frontend:** a "Not any more" × on pattern rows in `RepeatingTasksSection.vue`. The row hides
    immediately, and an Undo snackbar follows.
  - **Tests:** the existing suggestion tests moved off fixed 2027 dates onto dates relative to today. The
    window is measured from the database clock, so they would have started failing on their own around
    August 2027.
- **Source:** F2-08.
- **Moment:** scrolling past "Tuesday: Swimming 18:00" from a course dropped last spring.
- **Today:** both pattern views keep any pattern seen 3 times over **all** history (`mv_activity_history_pattern.sql:57,73`,
  `mv_planner_task_pattern.sql:33,49`). Nothing records "shown and ignored".
- **Backend logic needed:** a recency window and decay in both views. That is a SQL edit plus a restart:
  `SuggestionPatternViewInstaller` rebuilds a view when its script hash changes. It also needs a
  `PlannerSuggestionDismissal` table and `POST /repeating-planner-task/suggestions/dismiss`, which the suggestions query
  honours.
- **Frontend surface:** "×, not any more" on pattern-sourced rows in `RepeatingTasksSection`.
- **Data it runs on:** existing rows. **New input:** an optional one-tap dismiss.
- **Score:** value **M** · data ready **yes** · backend **M** · frontend **S** · risk **L–M** (existing users' suggestions
  change on the first rebuild).
- **Dedupe:** new. It edits the same endpoint as FO1's away ranking, hence wave A.
- **Implementation split:** **one session.** The view edit is restart-only, and the new table is additive.
- **Model / effort:** Sonnet 5.5, medium.

### FO12. The leisure picker remembers what you turned down, and what you actually did
- **Source:** F2-04 (adopt the server draw, with weather) + F3-06 (last done, unkept commitments).
- **Moment:** in the evening at `/leisure/pick`, being offered again what was rerolled on the laptop, or done
  yesterday.
- **Today:**
  - **The server draw and its seen-record have no client caller.** `/leisure/pick` ranks 200-row grids in the browser.
  - **The server draw lacks weather.** `LeisureDrawConstraints.cs:12` has no weather input, so adopting it as it stands
    would drop `_done/leisure` D2.
  - **The ranker knows nothing of what happened.** It never sees history or planner outcomes.
- **Backend logic needed:**
  - **F2-04:** feed `WeatherFitRule` into `LeisureRankingContext`, with the client's semantics pinned in tests.
  - **F3-06, later:** a keyed `IActivityLastDoneSource` (History, Planning, ActivityProfiles). Staleness then reads from
    `max(LastSuggestedAt, LastDoneAt)`, with a soft demotion after two unkept "plan for later" commitments.
- **Frontend surface:** `useLeisurePicker.ts` switches to the draw, keeping the `?seed=` contract. Commit and reroll
  call `/seen`. A "last time: 3 weeks ago" caption.
- **Data it runs on:** existing profiles, records, history and planner rows. **No new input.**
- **Score:** value **M** · data ready **yes** · backend **S–M**, then **M** · frontend **M** · risk **M** (the two rankers
  may have drifted, and the adoption must diff them).
- **Dedupe:** extends `_done/leisure` D1/D2.
- **Implementation split:** F2-04 is **one session** (an additive backend input, with the ranker swap as the real
  work). F3-06 needs a **separate backend agent** (a keyed seam with three implementations).
- **Model / effort:** Opus 5.5, high.

### FO13. A project becomes suggestible again once its shopping is done
- **Source:** F2-05.
- **Moment:** the weekend after ticking "Shopping for Build a Bookshelf", when the picker never offers the bookshelf.
- **Today:** the only `TodoListItemIsDoneChangedEvent` handler is Planning's. `ReadinessStatus` changes only by hand, and
  `NeedsShopping` is excluded from every draw.
- **Backend logic needed:** an `.ActivityProfiles` handler moves the project to `ReadyToStart` when its handoff item is
  done. It is precise only with a link carried from the handoff (an ActivityProfiles-owned link row, or carried on the
  event).
- **Frontend surface:** the handoff dialog sends the project id, and the readiness board moves the card.
- **Data it runs on:** the existing handoff item. **No new input.**
- **Score:** value **M–L** · data ready **yes** · backend **S–M** · frontend **S** · risk **L**.
- **Dedupe:** extends leisure-projects O1 and `_done/leisure` P1.
- **Implementation split:** **one session.**
- **Model / effort:** Sonnet 5.5, medium.

---

## Rejected

**Dropped or deferred by F5** (each was a candidate in F1–F4):

- **F1-02, a nudge inside an unstarted block.** The most nag-prone candidate. It depends on N1 (unbuilt) and FO2 for
  its evidence, and its grace setting has no home until reminder preferences can store an offset (a framework
  question). Revisit after FO2 and N1.
- **F1-05, templates that learn real durations.** Planner actual times are partly tracker-written, and nothing says
  which (F3 *Join quality* #4). Manual completions mostly carry no actual start. Revisit if planner actual times gain a
  source marker. FO8 covers the clean-data cases.
- **F2-09, mirror the plan into Google Calendar.** The owner must first pick one reminder channel per user against N1,
  or alerts arrive twice. Since F2, the manual sync already drops cancelled and background tasks. Defer.
- **F3-03, declared focus against tracked reality.** Backend L, a privacy flag (tracking data on history and planner
  screens), and its value is capped by rule coverage. Revisit after FO7 and FO9.
- **F3-04, plan load against what got done.** It needs about 20 planned days per user and is confounded by workday vs
  weekend. Its one figure could later feed FO4. Defer.
- **F4-02, the named `TimeAway` stretch.** Build only if the owner answers F4 open question 5 with yes, and only after
  FO1. F4's option B, derived runs, is the cheap experiment.
- **F2-01, F2-06, F2-07, F3-05 and F3-06 as standalone FOs.** Merged into FO9, FO8, FO3 and FO12.

**From F1:**

- One-field capture inbox entity: frontend-only (*Out of scope* #1).
- Drift nudge during an `InProgress` block: surveillance.
- Evening "close the day" push: worst-timed, and reads as failure.
- Wind-down nudge past bed time: no signal until FO10.
- Earned-leisure budget: a token economy.
- Pausing routines on away days: FO1.
- Server-side weekly review: frontend composition.
- Auto-closing yesterday's tasks overnight: destroys honest data.
- "You abandon 60% of sessions": a score.

**From F2:**

- `PlannerTaskStatus.OnHold`: a user state with no rule waiting.
- Server-produced `Vacation`/`SickDay`: user-chosen by design (FO1).
- `Calendar.Location` matching: OP18/C3.
- `TaskPlannerDayTemplate.Tags`: would add a form.
- `IsUnavoidable` free time: F3-04, deferred.
- Planner streak grace days: deliberately absent.
- Carry-over: built.
- Standalone reminders, digests, `DeadlineApproaching`: audit N1/N2.
- `ReminderLeadDays` / `FreezeBudget`: OP1.
- `DomainDetailsResponse` / 2FA setup: OP16/OP12.
- Auto-filling `Calendar.Weather`: removes no decision.
- `PredefinedSkipReasons` unread: deliberate.
- `RoutineTodoList.LastCompletedAt`: echo only.
- `Calendar.cs:45` "Future" note: nothing behind it.
- Routine completion-history and distinct-processes reads: plain reads.
- Account-deletion stats card: captured-data *Considered*.
- Tracking retention asymmetry: none.
- `HolidayCalendar.ForYear`: adds nothing.

**From F3:**

- Saturday leisure → Monday productivity: too few samples, and it frames rest as an input.
- Late-night device use → next-day skips: no anchor until FO10, and a surveillance verdict.
- Per-block adherence score: contradicts the automation's own rule.
- One "accounted day" total: double-counts without a `Source` column.
- Routine done but its block not: already synced.
- Routines vs the overdue pile: not reconstructable.
- Weather × completion: no weather history.
- Leisure × tracking: no rules for leisure apps, and judgemental.
- Nightly "day facts" table: infrastructure for its own sake.
- Planner estimate vs actual via History: circular (see F1-05 above).

**From F4:**

- Day type as a user lookup table: breaks the enum's rules.
- HomeOffice/Office as a day type: that is `Location`.
- Migrating `Label` into stretches: three incompatible readings.
- Effective day type computed at read time: every reader would change.
- Overlapping or nested stretches: a one-day override covers the real case.
- RRULE on stretches: "copy from last year" instead.
- Auto-detecting vacations: guesses about the user's life.
- Framework "quiet until" now: one module needs it.
- Away days in the planner streak: already neutral.
- "Sick days this year" stat: a health score.
- Template on every stretch day by default: tasks nobody asked for.
- `Special` as away: it means unusual, not absent.

## Out of scope, but noticed

Still open on 2026-10-06, merged from F1–F4 and deduped. Every OP in `docs/opportunities.md` is closed, so none of these
is already queued there. Items the inputs record as *Fixed since* are not repeated.

1. **Bug (frontend): the bulk bar offers `Holiday`, a day type the server does not have.** `BulkSelectActionBar.vue:66`
   builds from `Object.values(DayType)`, which includes the framework's `Holiday`. Reuse `dto/enum/dayTypeOptions.ts`,
   as the dialog already does. `docs/views/planner-day/inventory.md:31` documents the wrong option. (F4 #1)
2. ~~**Latent bug (frontend): the log-time controller toggles without `forceValue`**~~ Fixed with FO2 (2026-10-06).
   (F2-02)
3. **Tone (frontend): the day progress ring turns red below 50%** (`DayPlannerProgressBlock.vue:67-78`), which the
   `_done/day-planner` F2 prompt ruled out. (F3 #6)
4. **Frontend-only: show the plan on the unified tracking timeline for one day.** Both reads exist, and
   `activityTracking` may import `dayPlanner`'s `api/`. The tracking page already shows device data, so this raises no
   privacy issue. (F3 #5)
5. **Frontend-only: one-field capture.** Chain the activity quick-create with `POST /todo-list-item`, mindful that each
   capture becomes a permanent `Activity` and that items are unique per (activity, list). (F1 #1)
6. **Frontend-only: suggest `/leisure/pick` from `NowBar`'s "You're done for today!"** (F1 #4)
7. **Frontend-only, superseded by FO8: the to-do → planner handoff ignores the calibration ratio it has already
   computed** (`TodoListView.vue`, F1 #2). FO8's group ratio is the correct input. Scaling by today's activity-keyed
   ratio would inherit S3's unit mismatch (F3 #2).
8. **Design note (backend): `Calendar.AppliedTemplateId` has no FK.** A deleted template leaves a dangling id. Nothing
   reads the id yet; note it before something does. (F4 #4)
9. **Design note: a holiday weekday stays `Workday`,** so day-type recurrences fire on holidays. This is F4 open
   question 4. (F2 #5)
10. **Dead branch (framework): `DayType.Holiday`'s colour and icon** (`_common/dto/enum/DayType.ts:16,35`) are
    unreachable from server data. Removing the member is a framework change; weigh it against other apps. (F4 #5)
11. **Stale backend comments and seed:**
    - `ActivityHistory.cs:16` claims the web extension attributes rows (F3 #3);
    - `Calendar.cs:26` and `PlannerTaskSeeder.cs:91` model HomeOffice/Office as a label (F4 #3, folded into FO1).
12. **Stale docs:**
    - `docs/data-map/planner.md:130` and `docs/data-map.md:448` say the label is not in the month cell (F4 #2);
    - `docs/data-map.md` § *Endpoints with no client caller* lacks `POST /leisure-suggestion/seen`, the routine
      completion-history and distinct-processes reads, and `/reminder/*`, and misnames the draw route (F2 #6).
13. **Known gap capping every History-side join:** tracker attribution truncates sub-minute seconds (`IntTime.cs:14-18`,
    pinned as `KnownGap`). FO2, FO9 and the deferred F3-03 inherit it. (F3 #7)
