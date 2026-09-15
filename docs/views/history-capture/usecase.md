# history-capture — use cases

## What this unit is for
The four ways a user turns real time into an `ActivityHistory` record: live-counting a stopwatch, counting down a
timer, running a Pomodoro focus/rest cycle, or typing in a past span by hand. All four end the same way — a
`startTimestamp` and a `length` against an `Activity` — which is why they are one unit even though three of them
are full-screen live clocks and the fourth is a plain form.

## Where it sits
Reached from the sidebar's "Record activity" group (Manually / Pomodoro timer / Stopwatch / Timer, in that
order) or from the notification-bell-adjacent home surface, `NowBar`, which surfaces a running stopwatch/timer/
pomodoro session with a live countdown and a link back to whichever of these four routes owns it. The same three
live views (not the manual form) are also embedded compactly inside `TrackTimeDialog.vue`, opened from
`dayPlanner`'s `LogTimeController` and from `NowBar`'s own "Track time" button — that embedding is out of this
unit's scope (it lives in `dayPlanner`/`home`), but its existence is why the three timer views' props
(`activityId`, `compact`, `initialDuration`, `autoStart`) and emits (`started`, `done`) exist at all: a routed
view and a dialog-embedded instance are the same component reading the same store.

What a recorded session feeds: the `activityHistory`/`historyDashboard` review surfaces (unit `history-review`),
and — through `ActivityLoggedTimeAggregate` — the to-do module's estimate-vs-actual calibration (see
`docs/views/glossary.md`).

## Views

### StopWatchView (`/activity-history/stopwatch`)
**Purpose:** count *up* from zero for an activity whose length isn't known in advance.
**Who opens it and why:** starting an open-ended task ("I'm going to work on this until I stop").

**What the user can do**
- Pick an activity (with optional Role/Category narrowing, and an inline "create new activity" affordance) before
  starting.
- Narrow the picker to a to-do list item or a routine item via "From to-do list" / "From routine to-do list",
  which swaps in a task-priority or time-period select.
- Start, pause, resume and stop the count. The activity picker stays interactive while paused (it is the one
  timer whose selection form does this) but locks while actually running.
- On Stop, confirm or discard saving the elapsed span to history via a "Record new activity" dialog that quotes
  back the activity name and the rounded length.

**What the user can see, and the question it answers**
- Large minute:second `TimeDisplay` — answers "how long have I been at this?"
- Start/Pause/Stop `TimerControls`, each disabled when not applicable to the current state.

**Depends on:** the running-timer store (`runningTimerStore`, see *Entity lifecycle*); the account's activity
list (`/api/activity/all-options` + `/api/activity/form-select-options`); recently-picked activities, namespaced
per account in `localStorage` (`activityPickerRecency.v1::u<id>`).

### TimerView (`/activity-history/timer`)
**Purpose:** count *down* from a fixed duration for an activity with a planned length.
**Who opens it and why:** time-boxing a task ("I'll give this 30 minutes").

**What the user can do**
- Everything the stopwatch offers, plus: set a duration by typing into a masked `HH:MM` field or picking one of
  seven Quick Time chips (15m/20m/30m/45m/1h/1h30m/2h); save a duration+activity combination as a reusable Activity
  Preset, or a duration-only Quick Time, via an "Edit" mode on the same chip row.
- On Stop (manual or automatic), the same save-to-history confirm dialog as the stopwatch, pre-filled with
  however much of the set duration actually elapsed.

**What the user can see, and the question it answers**
- Idle: the length picker plus the two preset sections — answers "how long, and with what."
- Running: `TimeDisplayWithProgress`, a ring plus digits counting down — answers "how much is left."

**Depends on:** the same running-timer store; `GET /api/timer-preset` for the two preset sections (not fetched at
all while a session is active, since the picker is unmounted then).

### PomodoroTimerView (`/activity-history/pomodoro`)
**Purpose:** run a full focus/short-rest/long-rest cycle, repeated over multiple cycles, optionally against two
different activities (one for focus, one for rest).
**Who opens it and why:** structured work sessions that want built-in breaks rather than one long block.

**What the user can do**
- Set focus/short-rest/long-rest durations, focus-periods-per-cycle and cycle count from a setup panel, reset them
  to the app defaults (25/5/15, 4 periods, 2 cycles), or load a saved multi-field preset (`PomodoroPresetsDialog`)
  that also carries its own focus/rest activity.
- Pick a focus activity (required) and an optional rest activity, each through the same
  from-to-do-list/from-routine narrowing as the other two views.
- Start, pause, resume, stop. While running, the ring recolours and retitles per phase (blue "Focus", yellow
  "Short rest", purple "Long rest").
- On Stop or natural completion, save **up to two** history records at once — the focus time against the focus
  activity, and (if any rest activity was picked and any rest time accrued) the rest time against the rest
  activity.

**What the user can see, and the question it answers**
- `TimeDisplayWithProgress` titled with the current phase and activity — answers "which phase am I in, and how
  much of it is left."

**Depends on:** the running-timer store; `GET /api/pomodoro-timer-preset` (see the dialog); the same
recently-picked-activity localStorage as the other three.

### AddActivityManuallyView (`/activity-history/manual`)
**Purpose:** back-fill a session that already happened — no live clock at all.
**Who opens it and why:** forgot to start a timer, or is logging something the app can't watch (e.g. a walk).

**What the user can do**
- Pick an activity (same `ActivitySelectionForm` as the other three, including create-new).
- Set "When" (date + time, defaulting to now) and "Length" via a masked duration field.
- Submit with a single "Record activity to history" button. Validation blocks the activity being unset (inline
  "This field is required") and a zero length (a snackbar) before any request fires; nothing is disabled while
  the request is in flight and the form is not reset or the button disabled after a successful save, so a second
  click before the snackbar appears would submit a second, identical record.

**What the user can see, and the question it answers**
- The filled-in form itself is the only "what happened" surface — there is no confirmation step before the
  write, unlike the other three views' Stop-then-confirm dialog.

**Depends on:** the running-timer store not at all — this view is stateless and independent of any live session.

## Entity lifecycle
All four views write through the same `POST` (via `useActivityHistoryCrud().create`, wrapped by
`useSaveActivityToHistory`), producing one `ActivityHistory` row: `activityId`, `startTimestamp`, `length`. There
is no edit or delete surface *in this unit* — `EditActivityHistoryForm.vue` exists in `component/` but is mounted
by the review views (`history-review` unit), not by anything routed here.

The three live views (stopwatch/timer/pomodoro) share one more piece of lifecycle that the manual form has none
of: a **running session**, held by `useRunningTimerStore()` (a hand-rolled, non-Pinia-persisted, `localStorage`-
backed singleton — see its own header comment for why). Only one session exists per browser at a time, across
*all three* kinds; starting a second kind while one is live must go through an explicit "Another timer is
running" confirm (verified: cancelling it leaves the original session untouched, confirming discards it and its
server-side alarm schedule). A session survives navigation away, a full reload, and — for up to 12 hours
(`STALE_AFTER_MS`) — closing the tab entirely; older sessions are dropped rather than resurrected. Ending a
countdown or pomodoro also registers/cancels a one-shot server-side push alarm per boundary
(`POST /api/activity-history/timer-alarm/{schedule,cancel}`) so the phase-end/session-end notification still
fires with the tab closed — verified live for both single-boundary (timer) and whole-cycle-up-front (pomodoro,
15 boundaries posted at Start for a 2-cycle/4-period run) scheduling, and for cancel-on-pause /
reschedule-on-resume.

**What happens to a session that ends inside its first minute is not one rule but two, and they disagree**
(mutation pass, findings B4/B5): `TimerView` discards it with no dialog and no feedback at all; `PomodoroTimerView`
opens the same save dialog it always would, but the duration it quotes is blank because `Time.getNice` was never
written for a zero-minute span, and confirming it writes a real `length: {hours:0, minutes:0}` row. Neither is
the intended behaviour — see the findings for what "intended" should mean here — but the app currently has both
of them at once for structurally the same situation.

## Data this unit captures but does not spend
- **`ActivityHistory.length`'s sub-minute precision** — the stopwatch and countdown both track to the second
  internally (`TimePrecise`), but nothing downstream (the review dashboards, the to-do calibration aggregate)
  reads at finer than minute granularity as far as this pass observed. Unconfirmed without cross-checking
  `history-review`'s inventory.
- **Pomodoro's per-activity split** — a completed cycle with a rest activity writes *two* history rows
  (`saveActivity()` in `PomodoroTimerView.vue`), but nothing in this unit's own screens shows the two as a linked
  pair afterward; whether the review views group them is out of scope here.
- **`endedAutomatically`** on the session (whether Stop was pressed or the clock ran out) is held on the store's
  in-memory session but is not part of the payload `saveActivityToHistory` sends — the distinction is thrown away
  at save time.
