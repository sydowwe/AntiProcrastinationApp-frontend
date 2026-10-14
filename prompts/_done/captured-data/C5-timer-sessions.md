# C5 · Timer sessions as sessions — group a Pomodoro, and keep how it ended

- **Scope:** `activityHistory` (the running-timer store, the three live timer views, the save path) × `historyDashboard` (the timeline and every surface that
  counts records)
- **Backend:** yes. `ActivityHistory` has no session concept. See the escalation block.
- **Model / effort:** Opus 5.5, high. This changes what one history row *means*, and at least five surfaces count rows. A cheaper model ships the grouping and
  quietly breaks the insights.
- **Why one prompt and not two:** grouping a session's rows and recording whether it ran to completion share one save path and one backend change, and
  "how it ended" is a property of the session, not of a row. See `README.md` → *Why five prompts and not six*.

---

```
Two related things the timer module knows and then throws away at save time:

  1. A Pomodoro session is one sitting — four focus periods, the rests between them, maybe two
     cycles. The history shows it as two unrelated rows that do not even line up with what
     happened.
  2. Whether a timer or Pomodoro RAN TO ITS END or was STOPPED EARLY. The store tracks it; the save
     drops it. "Sessions finished vs abandoned" is one of the few procrastination signals this app
     could measure directly, and it is discarded every time.

The owner's decision for (1): ONE POMODORO SESSION IS ONE GROUP — every focus period and every rest
of that sitting belongs together, and the history should show it that way.

Line numbers below are as of commit 5e6c4ab7 (2026-09-27). Verify each before relying on it.

--- What happens today ---

The store — src/core/activityHistory/store/runningTimerStore.ts:
  - PomodoroSession (:143-161) keeps ACCUMULATORS only: focusElapsedMs, restElapsedMs. No record of
    individual phases, their start instants, or pauses. creditElapsed (:397-411) is where a phase's
    elapsed time is banked — the natural place to also log a segment.
  - endedAutomatically (:107) is set by endSession (:603-617: true when the clock ran out, false on
    Stop) and by reconcile (:743-763). Read reconcile's header comment in full: a Pomodoro reopened
    after an absence stops at the FIRST missed boundary and is marked endedAutomatically = true —
    i.e. "ended automatically" does NOT mean "completed the planned cycles". It can mean "the user
    left, and the clock ran the current phase out". Decide what the stored fact should be (see below).
  - Sessions persist in user-scoped localStorage and are hydrated on reload. A new field must
    tolerate a stored session from before it existed (see how alarmSessionId is optional for exactly
    this reason, :108-116).

The save — src/core/activityHistory/component/PomodoroTimerView.vue:263-310:
  - Writes AT MOST TWO rows via useSaveActivityToHistory → POST activity-history
    (api/activityHistoryApi.ts:27): all focus time summed, against the focus activity; all rest time
    summed, against the rest activity (only if one was picked and it rounds to ≥ 1 minute).
  - BOTH rows are dated new Date(current.startedAtEpoch). So on the day's timeline a 2-cycle session
    renders as a 100-minute focus block and a 25-minute rest block starting at the SAME instant,
    overlapping — neither shows when anything actually happened.
  - Both calls are fire-and-forget (`void`). A partial failure is silent.
  - Lengths go through sessionLengthFromMs (composable/useSessionLength.ts:26), which rounds to whole
    minutes; a zero-minute row is a 400 server-side (B17), and discardIfTooShort handles the
    whole-session case.

The embedded path — TrackTimeDialog.vue (:56-74, :149) embeds the three timer views with a pinned
activity; they emit done(startTimestamp, length) instead of saving, and the embedder saves.
Embedders: dayPlanner's LogTimeController.vue (:90) / DayPlannerLogTimeController.vue (also used from
HomeView.vue), and todoList's BaseTodoListLogTimeController.vue — grep TrackTimeDialog to confirm the
full list. For a Pomodoro that emit carries only the focus total. Decide whether embedded Pomodoros
get sessions too, and say so.

The record — ActivityHistory (dto/response/ActivityHistory.ts): id, startTimestamp, length,
activity. Server entity (C:\Users\jakub\RiderProjects\AdhdTimeOrganizer, AdhdTimeOrganizer.History/
domain/model/entity/ActivityHistory.cs): StartTimestamp, Length, EndTimestamp, TodoListItemId,
RoutineTodoListId. No session, no outcome.

--- What to build ---

A. RECORD THE PHASES. Extend the Pomodoro session with a log of phase segments: kind (focus/rest,
   short/long if useful), start instant, end instant, as actually run. Pauses split a phase into
   segments; merge a phase's segments back into one span for saving, or save them as separate spans
   — decide, and remember that a rest the user paused through is still one rest. Never credit time
   the store would not credit (the rule 2 in reconcile's comment: no fabricated focus minutes).

B. SAVE THE SESSION AS A GROUP. Recommended shape: one history row per focus period and per rest,
   each dated at its REAL start, all carrying the same session identity — so the timeline stops
   lying about when things happened. Then settle, in writing:
     - ROUNDING. Four 25m focus rows round cleanly; a 40-second paused sliver does not. Per-row
       rounding can make the parts disagree with the total the save dialog quoted. Decide which
       number is authoritative and make the dialog quote that one.
     - ZERO-LENGTH PARTS. A rest cut short at 20 seconds rounds to 0 and is a 400. Drop it, or fold
       it into a neighbour — do not send it.
     - ATOMICITY. N rows written with N fire-and-forget calls can half-land. The session should be
       written all-or-nothing. That is almost certainly a backend endpoint (see the ask); do not
       fake atomicity client-side with compensating deletes.
     - Rest activity absent: today no rest row is written. Keep that (the rests then exist only as
       gaps between focus rows, which is honest).

C. RECORD HOW IT ENDED. For timer and Pomodoro (a stopwatch never ends on its own — confirm and
   exclude it). Decide the stored fact from what the store can actually know. Candidates:
   completed (ran every planned phase) / stopped early (Stop pressed) / ran out while away (the
   reconcile case). A boolean endedAutomatically conflates the first and third. Whatever you pick,
   it lives on the SESSION, not on each row.

D. SHOW IT. On the day timeline (src/core/historyDashboard/component/HistoryTimeline.vue, rows via
   src/core/activityHistory/component/HistoryRecordItem.vue), a session's rows read as one unit:
   collapsed to the session with its span and focus total, expandable to its phases — or visibly
   bracketed. Your call; keep it a timeline, not a new widget. The outcome may appear there as a
   quiet label ("stopped after 2 of 4") — descriptive, never red, never "failed".
   Do not build a "finished vs abandoned" statistic in this prompt. Make the data exist and be
   visible per session; the aggregate is a later, separate decision with its own sample-size rules
   (see prompts/_done/activity-history/H10-insights.md for the standard it would have to meet).

--- The part a cheaper model would miss: everything that counts rows ---

Splitting one Pomodoro into eight rows changes every "how many entries" number in the app unless
you handle it. Find each consumer and decide, per consumer, whether it should count ROWS or
SESSIONS. At least:
  - historyDashboard/composable/useHistoryInsights.ts — "per entry" averages and the
    "arrives in many short entries" insight (:80-160). A 2-hour Pomodoro becoming 4 × 25m would
    make a focused morning read as fragmented. This is the one most likely to be silently wrong.
  - the pie chart's entry counts, the calendar's per-day session count
    (dto/response/CalendarActivityDaySummary.ts), HistoryDayCellContent.vue;
  - todoList's estimate calibration (POST /api/activity-history/aggregate-by-activity) and the daily
    recap — sums, probably unaffected, but confirm;
  - CSV/Excel export on Summary and Detail.
Many of these are computed SERVER-side. List which, and put them in the ask rather than
re-counting client-side.

Editing: EditActivityHistoryForm.vue edits one row. Decide what editing or deleting one phase of a
session does (probably: allowed, the row stays in its session). Do not build session-level editing.

--- The honest frontend-only fallback ---

A, C (in the store) and the save-dialog changes can all land before the backend. B and D cannot:
without a session identity on the server, rows cannot be grouped on read. Do NOT encode the session
in a note field or a localStorage map of row ids. Ship A and C's store half, keep saving the way it
works today, leave TODO(Bn) at saveActivity, and write the ask.

--- Do NOT ---
  - change the stopwatch or manual entry save beyond what falls out for free — the owner's scope is
    the Pomodoro session (and the timer's outcome flag);
  - change how alarms are scheduled (timerBoundaries.ts) or how reconcile resolves an absence;
  - add an outcome statistic, streak or score.

--- Verification ---

npm run type-check (baseline 0; check the exit code), npm run lint, and extend
store/runningTimerStore.test.ts for the segment log: pause/resume inside a phase, a phase boundary,
Stop mid-rest, and a reconcile after an absence (use the existing fake-clock pattern in that file).
playwright-cli -s=c5 (state-load → reload → state-save), once the backend has landed:
  - Run a short Pomodoro (1-minute focus, 1-minute rests, 2 periods, 1 cycle) with a rest activity,
    to the end. Detail timeline for today: one session, phases at their real times, no overlap,
    outcome "completed".
  - Run another and Stop during the second focus: the session shows what ran and "stopped early".
  - Summary insights for today read the same kind of sentence they did before, not a new
    "fragmented" one caused by the split.
  - A plain timer run to the end and one stopped early: each one row, each with its outcome.
Delete the rows you created, or reseed.

--- After the frontend work is done: write the backend ask ---

Contract + rules, in one ask:
  - how a session is created with its rows (recommend: one request, all-or-nothing, returning the
    row ids and the session id) — the route and shape are the backend's call; state what the client
    sends (per row: activityId, startTimestamp, length; per session: kind, outcome, planned
    shape if you want it shown) and what it reads back;
  - the session identity and outcome on the ActivityHistory response, with nullability (every row
    written before this lands has none — say how the client renders those);
  - what happens to the session when one of its rows is edited or deleted, and when the last is;
  - for each server-computed count you listed above: should it count rows or sessions? Ask it as a
    question per endpoint, with the consequence of each answer;
  - B17's zero-length rule applies per row — confirm.
Write it to prompts/captured-data/backend/Bn-<slug>.md per prompts/captured-data/backend/README.md.
```
