# history-capture — findings

> Pass: mutation · captured 2026-09-15 · commit `63e851ff`

**Tally:** blocker 0 · bug 6 · a11y 0 · polish 1 · opportunity 0 · unverified 0

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-14 | `5e42b813` | initial inventory pass |
| 2 | 2026-09-15 | `63e851ff` | mutation pass. No code touching this unit landed between rounds ( `git log 5e42b813..63e851ff` on the four views, the store, `TimePicker.vue`, `TimeDisplay.vue` and both `common.*.ts` locale files is empty), so B1/B2 are re-confirmed live rather than re-discovered; B3/P1 were not re-walked (no code change, low risk of drift, time better spent on the entity lifecycle this pass exists to test). U1 is now reproduced live and **renumbered to B6** with a corrected description — the frontend does fire a second request, but the backend rejects it with `409` rather than writing a duplicate, which the inventory pass could not have known without submitting for real. Two new bugs found doing the create lifecycle: **B4** (Pomodoro writes a zero-length history row behind a malformed confirmation prompt) and **B5** (Timer silently discards a sub-minute session with no feedback at all). Both are the same root shape as the already-open `H11-timer-end-notifications.md` note about the untagged final pomodoro boundary: nobody wrote down what should happen when a session ends before it produces a whole minute. |

---

### B1. `dateTime.secondsShort` renders as the raw i18n key on every running clock
- **Status:** open — re-confirmed round 2, visible in `screenshots/stopwatch--mutation-saved.png`
- **Severity:** bug
- **Where:** `src/_common/component/dateTime/TimeDisplay.vue:38` (`t('dateTime.secondsShort')`), consumed by
  `StopWatchView`, `TimerView` and `PomodoroTimerView` via `TimeDisplay`/`TimeDisplayWithProgress`. Root cause:
  `src/locales/common.en.ts`'s `dateTime` block (lines 339–392) and `src/locales/common.sk.ts`'s equivalent
  block mirror `hoursShort`/`minutesShort` from the framework's `_common/_locales/common.{en,sk}.ts` (which do
  have `secondsShort: 's'`, at line 254/248 respectively) but omit `secondsShort` itself.
- **Expected:** Per CLAUDE.md's i18n section, a framework key the app's own `common` namespace replaces wholesale
  must be mirrored in full — this is the exact pattern that already caused R5/R6/R11 (`validation`,
  `general.undoSuccess`, `calendar`), and the comment directly above the mirrored block even says so
  ("EN needs the mirror even more than SK does"). `secondsShort` should read "s" as it does everywhere the
  framework itself renders it.
- **Actual:** The seconds box on every running stopwatch/timer/pomodoro display reads the literal string
  `dateTime.secondsShort` instead of "s", and the console logs
  `[intlify] Not found 'dateTime.secondsShort' key in 'EN' locale messages` every time.
- **Evidence:** `docs/views/history-capture/screenshots/stopwatch--default.png` (raw key visible next to the
  seconds "00"); console line captured via `playwright-cli console` on `/activity-history/stopwatch`,
  `/activity-history/timer` and `/activity-history/pomodoro`.
- **Repro:** 1. Go to `/activity-history/stopwatch` (or timer/pomodoro). 2. Look at the label above the seconds
  digits. 3. It reads `dateTime.secondsShort`, not "s".
- **Verify:** 1. Load `/activity-history/stopwatch`. 2. **Pass condition:** the seconds box's small label reads
  "s", and the console shows no `[intlify] Not found 'dateTime.secondsShort'` warning. 3. Repeat on
  `/activity-history/timer` and `/activity-history/pomodoro`.
- **Root cause guess:** a single missing line in two files — same class as R5/R6/R11.
- **Suggested fix:** add `secondsShort: \`s\`,` to the `dateTime` block in both `src/locales/common.en.ts` (next
  to `minutesShort` at line 375) and `src/locales/common.sk.ts` (next to `minutesShort` at line 166).

### B2. Typed durations silently round to the nearest 5 minutes, with no feedback
- **Status:** open — re-confirmed round 2 live on `/activity-history/timer` (typed `0002` → field read `00:00`)
- **Severity:** bug
- **Where:** `src/_common/component/dateTime/TimePicker.vue:99,114-129` (`roundToNearestInterval(minutes,
  interval.value)`, `interval` defaulting to `allowedMinutesSelected = '5'`), used with no override by
  `TimerView`'s Length field, `PomodoroDurationCard`'s three fields (Focus/Short rest/Long rest), and
  `AddActivityManuallyForm`'s Length field.
- **Expected:** Typing a duration should either accept what was typed, or visibly show what it was rounded to
  and why — plain user sense, and consistent with the fact that the seeded Pomodoro preset "Short Sprint" has a
  3-minute short rest (i.e. the *data model* has no 5-minute floor — only this input widget does).
- **Actual:** Typing `0007` into any of these fields silently produces `00:05`; typing `0001` or `0002` silently
  produces `00:00`. No inline hint, no snackbar, no visual difference from a successful exact entry — the field
  simply shows a different number than what was typed once the 5th character completes the mask. On
  `TimerView`, following this up with Start when the rounded value lands on `00:00` produces the generic
  "please set a duration" error, which does not explain that the real problem was the typed value being rounded
  away.
- **Evidence:** `playwright-cli eval` on the Length field: typed `"0007"` → field value `"00:05"`; typed
  `"0001"`/`"0002"` (separately) → field value `"00:00"`, reproduced twice on `/activity-history/timer`. Source
  read confirms the same `TimePicker` component (same default interval) backs the two affected fields on
  `/activity-history/pomodoro` and the one on `/activity-history/manual`.
- **Repro:** 1. Go to `/activity-history/timer`. 2. Click the Length field, select all, type `0007`. 3. The field
  reads `00:05`, not `00:07`.
- **Verify:** 1. Go to `/activity-history/timer`. 2. Type `0007` into Length. 3. **Pass condition:** either the
  field keeps `00:07`, or — if 5-minute granularity is intentional — the field shows a visible rounding
  indicator (helper text or a brief inline note) rather than silently substituting a different number. 4. Repeat
  on `/activity-history/pomodoro`'s three duration fields and `/activity-history/manual`'s Length field.
- **Root cause guess:** `TimePicker.vue` defaults `allowedMinutesSelected` to `'5'` and none of the three call
  sites in this unit override it, unlike (presumably) call sites elsewhere that intend coarse granularity.
- **Suggested fix:** either pass a finer `allowedMinutesSelected` (e.g. `'1'`) to the three call sites in this
  unit, since a user recording or setting an exact number of minutes is the whole point of a manual/typed
  duration entry, or surface the rounding at the point it happens.

### B3. A preset chip's "Close" button is always present, does nothing useful outside edit mode, and its visible effect is not real
- **Status:** open — not re-walked round 2 (no code change on `TimerPresetsSection.vue` since round 1; time spent on
  the mutation pass's entity lifecycle instead)
- **Severity:** bug
- **Where:** `src/core/activityHistory/component/TimerPresetsSection.vue:44-51,93-100` (the `#close` template on
  both the Quick Times and Activity Presets `VChip`s), observed on `/activity-history/timer`.
- **Expected:** A control named "Close" (its `aria-label`, confirmed via DOM inspection:
  `<button class="v-chip__close" aria-label="Close">`) should either not exist when it has no useful action, or
  should do the thing its name implies.
- **Actual:** Every preset chip renders a real, focusable `button.v-chip__close` at all times — not just in edit
  mode, where the intended pencil icon shows inside it. Outside edit mode the button is visually blank (the
  pencil icon is `v-if="editMode"`) but still in the DOM and the tab order. Clicking it (confirmed via a direct
  DOM `.click()`, since it renders with no accessible bounding target outside edit mode) removes the chip from
  the on-screen list immediately, with **no network request** — confirmed via `playwright-cli requests` showing
  no new call — and the chip **reappears after a reload**, proving the removal is purely a client-side visual
  artifact, not a delete.
- **Evidence:** DOM inspection (`outerHTML` of `.v-chip__close`, no `closable` prop set anywhere in the source);
  `playwright-cli requests` before/after the click (no new request); reload of `/activity-history/timer` showing
  the "removed" 15m chip back in place.
- **Repro:** 1. Go to `/activity-history/timer`, do not click Edit. 2. Via devtools/JS, click the hidden
  `.v-chip__close` button on the 15m chip (`document.querySelectorAll('.v-chip')` → find the one starting
  "15m" → `.querySelector('.v-chip__close')`). 3. The chip disappears from the row. 4. Reload — it is back.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** either the close button is not rendered/focusable
  outside edit mode at all, or clicking it actually deletes the preset (with the same confirm-and-cascade
  treatment `PomodoroPresetsDialog`'s trash icon already gets) rather than only hiding it from the current page
  load.
- **Root cause guess:** the `VChip` `#close` slot is defined without the `closable` prop being set, so Vuetify
  renders the close-button chrome unconditionally instead of only when explicitly closable; the actual delete
  action was clearly meant to live behind edit mode's pencil icon (`openEditDialog`), and this is a side effect
  of reusing the same slot for both.
- **Suggested fix:** only render the `#close` slot's button at all when `editMode` is true (e.g. gate the whole
  template, not just the icon inside it), or bind `closable` explicitly and give it the edit-mode click handler
  instead of leaving Vuetify's default (silent, unbound) close behaviour active outside edit mode.

### B4. A pomodoro stopped inside the first minute writes a zero-length history row behind a malformed confirm prompt
- **Status:** open
- **Severity:** bug
- **Where:** `src/core/activityHistory/component/PomodoroTimerView.vue:255-281` (`finishSession()` has no
  near-zero-length guard, unlike `TimerView`'s — see B5), and
  `src/core/activity/component/SaveActivityBody.vue:3` (`$t('activities.confirmSaveActivity', { activity,
  timeSpent: timeSpent.getNice })`) reading `src/_common/dto/dto/Time.ts:40-42`'s `getNice` getter, which returns
  `"" + ' ' + ""` (a lone space) when both `hours` and `minutes` are 0.
- **Expected:** Either the dialog names a real, non-zero duration, or a session too short to log at minute
  granularity is handled the same way `TimerView` handles it (discarded, not offered for saving) — plain user
  sense either way, since a history row that says "done for" nothing is not information.
- **Actual:** Starting a pomodoro and pressing Stop within the same second still opens "Record new activity" with
  the activity name, but the duration slot renders as a bare "?" — literally "Confirm saving activity "Brush
  Teeth" - done for ?" — because `getNice` produced only a blank space for a 0h/0m `Time`. Pressing **Confirm**
  files a real `POST /api/activity-history` with `"length":{"hours":0,"minutes":0}` and gets a `201` — a
  zero-length row is written to the account's history with no further warning.
- **Evidence:** `screenshots/pomodoro--mutation-confirm-dialog-malformed-duration.png` (dialog reads "done for
  ?"); `POST https://localhost:8080/api/activity-history` request body
  `{"startTimestamp":"2026-09-15T12:49:03.655Z","length":{"hours":0,"minutes":0},"activityId":12027}`, response
  `201` body `15503` (the created row's id — removed by this pass's end-of-session reseed, see the closing
  report).
- **Repro:** 1. Go to `/activity-history/pomodoro`. 2. Pick a focus activity. 3. Click Start, then immediately
  click Stop (within the same second). 4. The confirm dialog reads "... - done for ?". 5. Click Confirm. 6. A
  `POST /api/activity-history` fires with `length: {hours:0, minutes:0}` and returns `201`.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** either the dialog is not shown at all for a session
  that produced 0 logged minutes (matching `TimerView`'s discard-and-clear behaviour), or it is shown with a
  duration that reads sensibly (e.g. "less than a minute") and, if confirmed, writes a length that is not
  literally zero. 3. Confirm no `length: {hours:0, minutes:0}` row is created either way.
- **Root cause guess:** `Time.getNice` was written for durations that are always at least a minute (every other
  call site rounds up first); nothing pomodoro-specific is wrong, `PomodoroTimerView.finishSession` just never
  got the same "less than a minute → discard" branch `TimerView.finishSession:216-219` has, so it takes the
  general path and hits `getNice`'s blank-string edge case instead.
- **Suggested fix:** add the same `if (timeSpent.getInMinutes <= 0) { store.clearSession(); return }` short-circuit
  `TimerView` already has, before opening the save dialog — this also incidentally never calls `getNice` with a
  zero `Time` from this call site again, so it does not need its own fix to be safe here (though `getNice`
  returning a bare space for 0h/0m is arguably worth hardening on its own, since any other future call site
  reading it will reproduce the same "?" text).

### B5. Stopping a timer inside the first minute discards the elapsed time with zero feedback
- **Status:** open
- **Severity:** bug
- **Where:** `src/core/activityHistory/view/TimerView.vue:216-219` (`if (length.getInMinutes <= 0) {
  store.clearSession(); return }`, inside `finishSession()`)
- **Expected:** Losing recorded time should say so. `runningTimerStore.ts`'s own header comment states the
  file's rule 2 as "never fabricate time the user did not spend" — the inverse, silently throwing away time the
  user *did* spend with no dialog and no snackbar, is the same failure in the other direction: a user has no way
  to know the session vanished rather than saved.
- **Actual:** Starting a timer and pressing Stop before a full minute has elapsed clears the session and returns
  the view to its idle duration-picker state — no "Record new activity" dialog (unlike the stopwatch and
  pomodoro, which always open it), no error or info snackbar, and no `POST /api/activity-history` call at all.
  The only visible change is the Length field reverting to the duration that was set before Start.
- **Evidence:** `screenshots/timer--mutation-silent-discard-sub-minute.png` (idle picker, no dialog, no
  snackbar, immediately after Start→Stop within ~15 seconds); `playwright-cli requests` for the same span shows
  only `POST timer-alarm/schedule` (on Start) and `POST timer-alarm/cancel` (on Stop) — no
  `POST /api/activity-history`; `localStorage`'s `runningTimerSession::u<id>` key read `null` immediately after.
- **Repro:** 1. Go to `/activity-history/timer`. 2. Set any length, pick an activity, click Start. 3. Immediately
  click Stop (well under a minute later). 4. The view returns to the idle picker. No dialog, no snackbar.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** the user is told what happened — either a
  "session too short to log" snackbar/message at the moment of Stop, or the save dialog still opens and states
  the true (sub-minute) elapsed span rather than being skipped outright silently.
- **Root cause guess:** same shape as B4 — a sub-minute session is real state today (`length.getInMinutes <= 0`
  is a deliberate branch, not an oversight) but the branch only prevents the bad outcome (a zero-length row) and
  says nothing about it, where B4's `PomodoroTimerView` has the opposite gap (says something, but the something
  is wrong, and does not prevent the bad outcome).
- **Suggested fix:** replace the silent `store.clearSession(); return` with a snackbar (e.g. reusing
  `history.errorSavingToHistory`-style copy, but phrased as "too short to log" rather than an error) before
  clearing, so this path and B4's fixed path end up symmetric: both a stopwatch/pomodoro *and* a timer tell the
  user when a session produced nothing to save.

### B6. Manual entry form fires a second request on a fast double-click, and never resets after a successful save
- **Status:** open — renumbered from round 1's `U1` now that it has been reproduced live; the description below
  replaces round 1's source-only account, which guessed the second request would write a duplicate row. It does
  not — the backend rejects it.
- **Severity:** bug
- **Where:** `src/core/activityHistory/view/AddActivityManuallyView.vue` (no `@saved` handler on
  `<AddActivityManuallyForm>`) and `src/core/activityHistory/component/AddActivityManuallyForm.vue:63-82`
  (`saveActivity()` — no loading flag, and `emit('saved')` on success is not listened to by the view)
- **Expected:** A double-click should not fire a second write, and after a successful "Record activity to
  history" the form should either clear (matching the other three views' Stop → confirm → session-cleared
  pattern) or at least give the user a way to tell the save happened, since the fields hold exactly what they
  held before submitting.
- **Actual:** `playwright-cli dblclick` on "Record activity to history" fires **two** `POST /api/activity-history`
  requests. The backend does not write two rows — the first to arrive got `201` (id `15504`), the second got
  `409` — but the frontend has no idea that will happen: it fires both regardless, and the `409` surfaces only as
  an uncaught-looking `AxiosError` in the console (`src/_common/axiosConfig.ts:122`) via
  `useSaveActivityToHistory.ts:13` → `useEntityCommand.ts:13`. Whichever snackbar `saveActivityToHistory` shows
  for the failed half (success for one call, `history.errorSavingToHistory` for the other) was gone by the time
  the follow-up screenshot was taken, consistent with CLAUDE.md's few-seconds auto-dismiss. Separately, and
  regardless of the double-click: after the single successful save, the Activity, When and Length fields are
  still exactly as filled in — nothing resets.
- **Evidence:** `screenshots/manual--mutation-double-submit-409.png` (form still fully populated, no visible
  snackbar, taken immediately after the double-click); `playwright-cli requests` showing
  `POST /api/activity-history => 409` immediately followed by `POST /api/activity-history => 201`;
  `playwright-cli console error` showing the `409` `AxiosError` stack through `AddActivityManuallyForm.vue:58` →
  `AddActivityManuallyView.vue:26`; response body of the `201` call is `15504` (a single row — confirmed only one
  was created, both removed by this pass's end-of-session reseed).
- **Repro:** 1. Go to `/activity-history/manual`. 2. Pick an activity, set a non-zero Length. 3. Double-click
  "Record activity to history" fast enough for both clicks to register before the first response returns. 4. Two
  `POST /api/activity-history` calls fire; one comes back `409`. 5. The form is not cleared or disabled at any
  point.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** only one `POST /api/activity-history` fires per
  double-click (button disables after the first click, or debounces), so the `409` path is unreachable; separately, after any single successful save, the form clears or otherwise makes it obvious the save happened. 3. No
  console error from a self-inflicted `409`.
- **Root cause guess:** same as round 1's guess — no loading flag guarding re-entry into `saveActivity()`, and no
  `@saved` listener on the view resetting the form — but the consequence is milder than round 1 could tell from
  source alone: the backend's own conflict handling (unconfirmed mechanism — same-`activityId`+`startTimestamp`
  uniqueness is the likely shape, not verified from this repo) is what actually prevents a duplicate row, not
  anything client-side.
- **Suggested fix:** disable the button (or guard re-entry) while `saveActivity()`'s `await create(...)` is
  pending, so the `409` case stops being reachable at all; and wire `AddActivityManuallyForm`'s existing `saved`
  emit to reset `dateTime`/`timeLength`/the activity selection in `AddActivityManuallyView.vue`, which does not
  listen for it today.

### P1. Leftover `console.log` fires on every Timer/Pomodoro preset load
- **Status:** open — not re-walked round 2 (no code change since round 1)
- **Severity:** polish
- **Where:** `src/core/activityHistory/component/TimerPresetsSection.vue`, in `loadPresetsData()`
  (`console.log(allPresets.value)`, immediately after `allPresets.value = await fetchAll()`)
- **Expected:** Production code should not print debug output to the console on every mount.
- **Actual:** `[LOG] Proxy(Array) @ .../TimerPresetsSection.vue:44` prints on every load of `/activity-history/
  timer` and `/activity-history/pomodoro` (both mount this component while idle).
- **Evidence:** `playwright-cli console` on `/activity-history/timer` after a Stop/Cancel cycle, showing the
  `[LOG]` line pointing at the component's own source location.
- **Repro:** 1. Go to `/activity-history/timer`. 2. Open the console. 3. See the logged array.
- **Verify:** 1. Load `/activity-history/timer`. 2. **Pass condition:** `playwright-cli console` shows no `[LOG]`
  entry from `TimerPresetsSection.vue`.
- **Suggested fix:** delete the `console.log(allPresets.value)` line.
