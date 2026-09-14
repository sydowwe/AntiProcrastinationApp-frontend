# history-capture — findings

> Pass: inventory · captured 2026-09-14 · commit `5e42b813`

**Tally:** blocker 0 · bug 3 · a11y 0 · polish 1 · opportunity 0 · unverified 1

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-14 | `5e42b813` | initial inventory pass |

---

### B1. `dateTime.secondsShort` renders as the raw i18n key on every running clock
- **Status:** open
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
- **Status:** open
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
- **Status:** open
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

### P1. Leftover `console.log` fires on every Timer/Pomodoro preset load
- **Status:** open
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

### U1. Manual entry form is not disabled during the save request and is not reset afterward
- **Status:** open
- **Severity:** unverified — source read only, not reproduced in this pass (a real submit would have written a
  history row, which the inventory pass deliberately avoided)
- **Where:** `src/core/activityHistory/view/AddActivityManuallyView.vue` (no `@saved` handler on
  `<AddActivityManuallyForm>`) and `src/core/activityHistory/component/AddActivityManuallyForm.vue:63-82`
  (`saveActivity()` — no loading flag, and `emit('saved')` on success is not listened to by the view)
- **Expected:** After a successful "Record activity to history", either the form clears (matching the other
  three views' Stop → confirm → session-cleared pattern) or the button disables while the request is in flight,
  so a second click before the snackbar appears cannot submit the same span twice.
- **Actual (from source, not observed live):** `AddActivityManuallyView.vue`'s template has no `@saved` listener
  at all, so nothing resets `dateTime`/`timeLength`/the activity selection after a save; `handleSave()` has no
  guard against re-entry while `saveActivity()`'s `await create(...)` is pending, and the button has no
  `:loading`/`:disabled` binding tied to that.
- **What would verify it:** fill the form with a real activity and a non-zero length, click "Record activity to
  history" twice in quick succession (or once and re-click before the snackbar appears), and check whether
  `/api/activity-history` receives one `POST` or two. Deliberately not attempted here to keep this pass
  read-only; the mutation pass for this unit should check it and clean up (delete or reseed) if it reproduces.
