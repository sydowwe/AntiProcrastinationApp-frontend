# H9 · Make a running timer survive navigation and reload

- **Scope:** activityHistory timers (+ home, dayPlanner consumers)
- **Backend:** none for the core work; see the note at the end
- **Model / effort:** Opus 5, high effort — three timers with different state machines, two embedding contexts, and a class of bug (lost work) where a plausible-looking implementation that drifts by a few seconds is worse than none.
- **Depends on:** H1 (items 5-7 fix real defects in these exact files)
- **Unblocks:** nothing

---

```
The single largest user-facing defect in this module: a running timer is destroyed by any navigation
or reload, and the elapsed time is lost silently. For an app whose purpose is getting people to
start and stay on tasks, losing a 40-minute focus session because the user clicked something is the
worst failure mode available.

--- What is actually broken ---

All three timers hold their entire state in component-local refs:

  StopWatchView.vue    time, startedAt, pausedElapsed, intervalId
  TimerView.vue        endsAt, pausedRemaining, initialTime, selectedActivityName, startTimestamp
  PomodoroTimerView.vue endsAt, pausedRemaining, phaseStartedAt, focusTimeElapsed, restTimeElapsed,
                       currentCycle, currentFocusPeriod, isFocus, plus the three duration pickers

Each is a route (activityHistory.routes.ts: 'stopwatch', 'timer', 'pomodoroTimer') AND is embedded
compactly inside TrackTimeDialog.vue, which is opened from
src/core/dayPlanner/component/normal/LogTimeController.vue and src/core/home/component/NowBar.vue.

Consequences today:
1. Navigating away from /activity-history/timer unmounts the view. `onUnmounted` clears the interval
   and nothing is persisted. The session is gone, with no warning and no way to recover it.
2. Reloading the tab does the same.
3. Closing TrackTimeDialog while a timer runs does the same. The dialog sets `:persistent="isRunning"`
   which blocks the backdrop click — an acknowledgement of the problem, not a fix.
4. TrackTimeDialog.vue:114 — `watch(selectedMethod, () => { isRunning.value = false })`. Switching
   the stopwatch/timer/pomodoro toggle mid-session unmounts the running child and discards it, with
   no confirmation.

--- What to build ---

A Pinia setup store in src/core/activityHistory/store/ owning the running session. Per CLAUDE.md,
Pinia stores here persist to sessionStorage by default — that alone fixes reload within a tab. Decide
explicitly whether this one should use localStorage instead so a closed tab does not lose the
session, and write the reasoning into the store as a comment.

The state must be expressed in ABSOLUTE TIMESTAMPS, never in accumulated tick counts. The existing
code already does this correctly (`endsAt`, `phaseStartedAt`, `startedAt` are all `Date.now()`
values, and elapsed is derived) — preserve that property exactly, because it is what makes rehydration
correct. On rehydrate, remaining/elapsed is recomputed from the stored timestamps against the current
clock. Never store or restore a `setInterval` id; intervals are a rendering concern and are recreated
on mount.

Handle these cases explicitly, they are where this goes wrong:
- Rehydrating a countdown whose `endsAt` is already in the past — the phase ended while the app was
  closed. The timer must land in the ended state and offer to log the completed session, not show a
  negative or a zero that the user has to interpret.
- The same for a pomodoro that crossed one or more phase boundaries while away: reconstruct which
  phase it should now be in from the phase durations and the elapsed wall time, or — if that
  reconstruction is ambiguous (e.g. a multi-hour absence) — stop at the first missed boundary and
  present it as a completed session rather than fabricating cycle counts. Fabricated focus minutes in
  a productivity log are worse than a short one.
- A paused timer stores remaining duration, not an end timestamp; pausing and reloading must not
  resume the countdown.
- Only one session at a time. Starting a second timer while one runs must prompt, not silently
  replace.

Then:
1. Rewrite the three views to read and write the store instead of local refs. Keep their templates
   and their public interface unchanged — the `activityId` / `activityName` / `compact` /
   `initialDuration` / `autoStart` props and the `started` / `done` emits are consumed by
   TrackTimeDialog and must behave identically.
2. Fix TrackTimeDialog's method-switch: if a session is running, either confirm before discarding
   (useDialog's `confirm()`) or disable the toggle.
3. Surface the running session outside the timer views. NowBar (src/core/home/component/NowBar.vue)
   is the natural place — check what it already shows before adding anything. A user who navigated
   away needs a visible way back to the running timer; that is the actual payoff of this work.
4. Route-leave: with the store in place, navigating away no longer loses data, so do NOT add a
   navigation guard that blocks it. Blocking navigation to protect state you have now made durable is
   the wrong trade.

--- Explicitly out of scope ---

Do NOT: sync the running timer to the server, add a service worker or Web Worker, add
`beforeunload` handlers, add a cross-tab BroadcastChannel, or unify the three timers into one
component. The three state machines stay three state machines behind one store.

--- If you conclude server-side persistence is required ---

It is not required for this prompt and you should ship the client-side version regardless. But if
during the work you find a concrete case only the server can fix (e.g. the user runs a timer on the
phone and opens the desktop app), do not implement it — finish the frontend, then write the contract
ask to prompts/activity-history/backend/H9-backend.md following the format of the two files already
in that directory. Contract only: endpoint, method, route, request shape, response fields with types
and nullability. No entities, no storage decisions.

Verify, and be rigorous — this is a data-loss fix, so "it looks right" is not evidence:
- Start a 25-minute timer, note the wall-clock time, reload, and confirm the remaining time is
  correct to the second against the wall clock.
- Start the stopwatch, navigate to /activity-history and back, confirm elapsed kept counting.
- Start a pomodoro, pause it, reload, confirm it is still paused with the same remaining time.
- Start a 1-minute timer, close the tab, reopen after 3 minutes, confirm it presents a completed
  1-minute session and does not log 3 minutes.
- Open TrackTimeDialog from the day planner, start a timer, close the dialog, reopen it, confirm the
  session is still there and `done` still emits the right length to LogTimeController.
Run `npm run type-check` and `npm run lint`.
```
