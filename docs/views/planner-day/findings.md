# planner-day — findings

> Pass: inventory + mutation · captured 2026-09-14, 2026-09-15 · commit `041d9b2d`
> Re-verified against current tree 2026-09-24 (commit `222f0051`) — **all 12 findings confirmed fixed in code.**

**Tally:** blocker 1 · bug 9 · a11y 2 · polish 7 · opportunity 0 · unverified 1 (20 entries) — **open:** bug 1 (B9) · a11y 1 (A2) · polish 5 (P3–P7) · unverified 1 (U1); every pre-x4 entry is fixed

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-14 | `6aac48bb` | initial inventory pass |
| 2 | 2026-09-15 | `041d9b2d` | mutation pass — full create/edit/delete lifecycle for `PlannerTask`, `RepeatingPlannerTask` and a skip reason; found X1, B7, B8, P1, P2 |
| 3 | 2026-09-24 | `222f0051` | verification-only pass (source read, no browser drive) — every open finding checked against current code; all fixed, see per-finding notes below |
| 4 | 2026-09-24 | `d423edcc` | **retest round** — 11 retested live: X1, B1, B2, B3, B5, B6, B7, B8, A1, P1, P2 pass; none reopened; none blocked. B7's past-day half used a throwaway task on `23-09-2026` because the seed has no tasks before today. Account(s): primaryUser (form sign-in, since the cached `auth-10001.json` refresh token was dead: `POST /auth/refresh` 401). Mutations made and reverted: activity 12003 renamed "Code Review RETEST" and back; throwaway tasks on `23-09-2026` and `24-09-2026` created and deleted; calendar Days/Duration URL state reset to defaults. Regressions seen outside the Verify blocks: none. |
| 5 | 2026-10-06 | `27dd210b` | **x4 narrow viewport (390×844)** — 4 views checked; new: B9, A2, P3, P4, P5, P6, P7, U1. SelectionActionBar / bulk-select / apply-template bar overflow added to `_shell` B2 rather than re-filed. |

---

### X1. Editing a task's name is completely broken — the edit is either silently blocked or silently discarded, in both toggle states
- **Status:** fixed and verified (retest 2026-09-24, live) — toggle on: "Code Review" → "Code Review RETEST" sent `PUT /api/activity/12003/quick-edit` 204 + `PUT /api/planner-task/16003` 200 and the grid showed the new name at once (renamed back, restored); toggle off: the Name field is replaced by a `* Activity` picker, so there's no editable field left to discard.
- **Severity:** blocker
- **Where:** `src/core/dayPlanner/component/BasePlannerTaskDialog.vue:120` (`save()`) →
  `src/core/activity/component/ActivitySelectOrQuickEditFormField.vue:65` (`execAndReturnStatus`) →
  `src/core/activity/composable/quickCreateActivityComposition.ts:28` (`quickEditActivity`) →
  `src/core/activity/store/activityOptionsStore.ts:162`, which calls `PATCH /api/activity/{id}/Overwrite`
- **Expected:** `PlannerTask` has no name of its own — the "* Name" field in the Edit Task dialog edits the
  underlying shared `Activity`'s name (see `glossary.md`'s Activity spine). Typing a new name and confirming
  should rename the activity (with the "Quick edit activity" toggle controlling exactly that), the way every
  other editable field in the same dialog saves.
- **Actual:** Two independent failures, covering both states of the "Quick edit activity" toggle (which
  defaults to **checked**, mode "Overwrite", every time the dialog is opened):
  1. **Toggle ON (the default):** confirming with a changed Name calls `PATCH /api/activity/12002/Overwrite`,
     which the backend answers with **404** — the route does not exist. This call is awaited before the
     actual task PUT, so the failure blocks the *entire* save: not just the name, but every other field
     changed in the same dialog session (time, status, importance, location, …) is discarded too. The dialog
     stays open, the Confirm button remains clickable, and **nothing** in the UI indicates a failure — no
     snackbar, no inline error, no console-visible user-facing message (only a raw `AxiosError` in devtools).
  2. **Toggle OFF:** confirming succeeds — `PUT /api/planner-task/{id}` returns 200 and every other field
     change is saved correctly — but the typed Name change is silently dropped. `GET` the task afterward and
     `activity.name` is unchanged. There is no per-task name field for the value to land in, and with the
     toggle off nothing writes it to the Activity either, so the edit vanishes with no error and no warning
     that it wouldn't be applied.
  In short: **there is no toggle state in which changing a task's name actually works**, and the failure mode
  in both cases is silent.
- **Evidence:** Requests captured live: `PATCH https://localhost:8080/api/activity/12002/Overwrite` → `404`
  (toggle on, dialog stays open, task block in the grid unchanged — screenshot
  `day-planner-date--mutation-quickedit-404-silent.png`); `PUT https://localhost:8080/api/planner-task/16008`
  → `200` (toggle off) whose response body still reads `"activity":{"name":"Feature Development",...}` despite
  typing "Feature Development Renamed" into the Name field beforehand. Console:
  `AxiosError: Request failed with status code 404` at `activityOptionsStore.ts:162` via
  `quickCreateActivityComposition.ts:28` via `ActivitySelectOrQuickEditFormField.vue:65` via
  `BasePlannerTaskDialog.vue:120`.
- **Repro:** 1. Go to `/day-planner/15-09-2026` (or any day with a task). 2. Select a task, press `E` to edit.
  3. Clear "* Name" and type a new value. 4. Leave "Quick edit activity" checked (the default). 5. Click
  Confirm. **Observe:** dialog stays open, no error shown, task block unchanged. 6. Uncheck "Quick edit
  activity". 7. Click Confirm again. **Observe:** dialog closes, task block still shows the *old* name.
- **Verify:** 1. Repeat the repro's steps 1–5. **Pass condition (toggle on):** either the rename succeeds and
  the activity's name updates everywhere it's referenced, or the dialog shows a visible error and stays open
  for a reason the user can act on — not silent no-op. 2. Repeat with the toggle off. **Pass condition:** the
  Name field either applies the caller's intent (e.g. by disabling/hiding the field entirely when quick-edit is
  off, since there's nothing for it to write to) or is clearly read-only, never an editable-looking field whose
  value is discarded.
- **Root cause guess:** `PATCH /api/activity/{id}/Overwrite` is not a registered backend route (confirmed 404,
  not a permissions/400 shape) — this is very likely the same class of gap as the other backend-route findings
  already filed in `prompts/view-docs/backend/` for other units. The toggle-off silent-discard is a separate,
  purely frontend gap: `ActivitySelectOrQuickEditFormField.vue` has no code path that does anything with the
  Name field's value when quick-edit is off.
- **Suggested fix:** Backend: register (or fix the method/route on) the activity-overwrite endpoint. Frontend,
  independent of that: (a) `save()` should not let a rejected `quickEditActivity` call silently swallow the
  rest of the form's save — catch it, show `useSnackbar().showErrorSnackbar`, and keep the user's other field
  edits either saved or visibly unsaved, not silently discarded; (b) when "Quick edit activity" is off, either
  disable the Name field (there is nothing for it to write to) or make it a read-only display of the current
  activity name, so it cannot look editable while being a no-op.

---

### B1. `DayPlannerSettingsView`'s tabs stack instead of switching — every tab you've visited stays rendered
- **Status:** fixed and verified (retest 2026-09-24, live) — after clicking all five tabs in repro order, on Calendar View exactly one `.v-window-item` is displayed (`--active`, `offsetHeight` 222); the other four are `display:none`, height 0.
- **Severity:** bug
- **Where:** `src/core/dayPlanner/view/DayPlannerSettingsView.vue:31-36` and `:52-58` (the `repeating` and
  `skipReasons` `VTabsWindowItem`s)
- **Expected:** Clicking a settings tab shows only that tab's content, per ordinary tab semantics and every
  other tabbed view in this app.
- **Actual:** Switching tabs does not hide the previous content. On a fresh load, clicking through
  Repeating Tasks → In-App Nudges → View Defaults → Skip Reasons → Calendar View leaves the **Repeating
  Tasks table** visible on every subsequent tab, and by the time "Calendar View" is reached, **both** the
  Repeating Tasks table and the Skip Reasons panel ("No predefined reasons yet. Add one below." + input +
  ADD button) are stacked above Calendar View's own actual content. Confirmed reproducible from a clean
  reload, not a one-off race.
- **Evidence:** `docs/views/planner-day/screenshots/day-planner-settings--nudges-tab.png`,
  `--viewdefaults-tab.png`, `--skipreasons-tab.png`, `--calendarview-tab.png` (each shows the leaked content
  above the real panel). Confirmed at the DOM level with the Calendar View tab active:
  `document.querySelectorAll('.v-window-item')` returns 5 items; three have non-zero `offsetHeight` and
  `display` other than `none` (`flex`/`flex`/`block`) while only one carries `v-window-item--active`. Their
  class lists are the tell: `"...flex-fill d-flex flex-column ga-4 pt-3"` (Repeating Tasks) and
  `"...pt-3 d-flex flex-column ga-4"` (Skip Reasons) — the two **stuck-visible** items — versus
  `"...pt-3"` (In-App Nudges, View Defaults) — the two that correctly hide. No console error accompanies it;
  this is a pure CSS defect.
- **Repro:** 1. Go to `/day-planner/settings`. 2. Click through all five tabs in order. 3. On the last one
  ("Calendar View"), scroll from the top: observe the Repeating Tasks table and the Skip Reasons panel both
  rendered above the Calendar View content.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** at every tab, exactly one panel's content is visible
  — no other tab's table, toggles, or inputs appear above or below it.
- **Root cause guess:** `VTabsWindowItem`s for `repeating` and `skipReasons` carry `d-flex` directly on the
  component (`class="flex-fill d-flex flex-column ga-4 pt-3"` and `class="pt-3 d-flex flex-column ga-4"`
  respectively). Vuetify's utility classes apply `display` with `!important`, which wins over the
  component's own inactive-item `display: none` rule regardless of which one is later in the cascade — so any
  `VTabsWindowItem` carrying a `d-*` display utility never actually hides when inactive. The two tabs without
  a `d-flex` class (`In-App Nudges`, `View Defaults`) hide correctly, which is exactly the pattern observed.
- **Suggested fix:** Don't put layout utility classes directly on `VTabsWindowItem`. Wrap each tab's content
  in an inner `<div class="d-flex flex-column ga-4">` and leave the `VTabsWindowItem` itself with only
  spacing classes (e.g. `pt-3`), matching how `In-App Nudges` / `View Defaults` are already written.

### B2. `MyDateInput` ignores the caller's `label` prop — always renders the generic "Date" label
- **Status:** fixed and verified (retest 2026-09-24, live) — the Copy Day dialog's field is `textbox "Source date"`; second consumer `HistoryDateRangeSelector` on `/activity-history` renders `textbox "From"`, and no field there reads "Date".
- **Severity:** bug — **[framework]**
- **Where:** `src/_common/component/dateTime/MyDateInput.vue:11-13`; observed via `CopyDayForm.vue`'s "Copy
  tasks to N day(s)" dialog, opened from `/day-planner`'s bulk-select action bar
- **Expected:** `CopyDayForm.vue` passes `:label="$t('planner.calendar.sourceDateLabel')"` (= "Source date")
  to `MyDateInput`. A caller-supplied label should render, the way every other labelled input in this app does.
- **Actual:** The dialog's single date field is labelled plain "Date" — both the floating label and the
  accessible name. Source shows why: `MyDateInput.vue` does `v-bind="$attrs"` on the `VDateInput` at line 11,
  then an explicit `:label="$t('dateTime.date')"` at line 13 on the same element — the later binding always
  wins, so any `label` attr arriving via `$attrs` is silently discarded for **every** consumer of
  `MyDateInput` in the app, not just this dialog.
- **Evidence:** `docs/views/planner-day/screenshots/day-planner--copy-day-dialog-label-bug.png` (dialog titled
  "Copy tasks to 1 day", field labelled "Date"); locale keys confirmed in
  `src/core/dayPlanner/_locales/dayPlanner.en.ts:103` (`sourceDateLabel: 'Source date'`) and
  `dayPlanner.sk.ts:110`; source read of `MyDateInput.vue:11-13`.
- **Repro:** 1. Go to `/day-planner`. 2. Click "Select Days", select any day. 3. Click "Copy Day". 4. Read the
  date field's label.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** the field reads "Source date", not "Date". 3. Spot
  check one other `MyDateInput` consumer with a custom `label` (grep the app for `<MyDateInput` with a
  `:label` prop) to confirm the fix isn't scoped to just this call site.
- **Suggested fix:** In `MyDateInput.vue`, move the explicit `:label="$t('dateTime.date')"` binding before
  `v-bind="$attrs"` (or make it a prop with that i18n string as its default, e.g. `label = $t('dateTime.date')`
  in `defineProps`), so a caller-supplied `label` in `$attrs` overrides the generic default instead of being
  overridden by it.

### B3. The calendar's range configuration and day-filter do not round-trip in the URL, contrary to this module's own P7 fix
- **Status:** fixed and verified (retest 2026-09-24, live) — "Workdays (Mon-Fri)" wrote `?days=workdays` and survived a reload; Duration with Anchor "To end" and Quantity 4 wrote `?range=duration&anchor=end&from=2026-09-24&qty=4` and came back intact after a reload; both reset to defaults afterwards.
- **Severity:** bug
- **Where:** `PlannerCalendarView.vue` / `composable/useCalendarUrlState.ts`
- **Expected:** `prompts/_done/day-planner/P7-calendar-url-state.md` states plainly: "The displayed month/date
  range... Decide the direction explicitly: the URL should drive CalendarGrid's initial range, and
  `@dateRangeChange` should write back." Only `mode` (bulk/edit/apply-template) and `templateId` are documented
  as exclusions from that requirement (along with `selectedDayIds`, excluded deliberately).
- **Actual:** Two independent pieces of range/view state are lost on reload:
  1. Switching the "Days to show" selector from "All week" to "Workdays (Mon-Fri)" filters the grid, but a
     reload resets it to "All week".
  2. Switching "Mode" from "Month" to "Duration" (which reveals Anchor / Date from / Unit / Quantity controls
     and narrows the grid to a rolling range) is not reflected in the URL at all — a reload silently reverts to
     "Month" mode on the current month, discarding the whole configuration.
  Only plain month navigation (`?month=YYYY-MM`) actually persists. (The settings view has the same class of
  gap for its own tabs — see B6 — but that one is not covered by P7's explicit promise the way this is.)
- **Evidence:** `docs/views/planner-day/screenshots/day-planner--duration-mode.png` (Duration mode configured,
  URL bare `/day-planner`) vs. `day-planner--duration-mode-after-reload.png` (back to Month/September after
  reload); `day-planner--workdays-filter.png` (Workdays filter applied, URL still bare) followed by a reload
  that reset the selector back to "All week" (confirmed via a fresh `find "Days to show"` snapshot).
- **Repro:** 1. Go to `/day-planner`. 2. Set "Days to show" to "Workdays (Mon-Fri)". 3. Reload. 4. **Observe:**
  selector is back to "All week". Separately: 1. Set Mode to "Duration". 2. Note the URL is unchanged. 3.
  Reload. 4. **Observe:** Mode is back to "Month".
- **Verify:** 1. Set "Days to show" to "Workdays (Mon-Fri)", reload. **Pass condition:** selector still reads
  "Workdays (Mon-Fri)". 2. Set Mode to "Duration" with a non-default Anchor/Unit/Quantity, reload. **Pass
  condition:** the same Duration configuration is restored, and the URL carries enough to do so.
- **Root cause guess:** `useCalendarUrlState.ts` (added by P7) appears to only ever have modelled `month`,
  `mode` and `templateId` — the Days-to-show filter and the Range/Duration mode's own sub-fields were never
  added to it, despite being state P7's own text calls out as in-scope ("the displayed month/date range").
- **Suggested fix:** Extend `useCalendarUrlState.ts` to also encode the days-to-show filter and, when Mode is
  Range or Duration, its Anchor/Date-from/Unit/Quantity fields — following the same "absent when default"
  encoding rule already used for `mode`.

### B4. Holiday names render in Slovak regardless of the account's English locale
- **Status:** fixed and verified (2026-09-21 — backend `B19` sends a stable `holidayKey`; the client resolves it
  through `calendar.holidays.*` via the framework's `useHolidayLabel()`, falling back to `holidayName`. The
  `fixme` in `planner-day.draft.spec.ts` is now a passing test. `_fix-queue.md` retired §8; body in the log.)
- **Severity:** polish (re-graded from `bug`, `_fix-queue.md` *Contradictions* §30 — a proper noun, not app text in the wrong locale)
- **Where:** Holiday strip under the `PlannerCalendarView` month grid; data via `POST /api/calendar/filter`
  (`holidayName` field)
- **Expected:** With the account locale set to English (confirmed for every other piece of chrome in this
  unit), a holiday name shown in the UI should be in English — the same expectation already filed against
  notification content in `docs/views/_shell/inventory.md` B1.
- **Actual:** Every holiday name is untranslated Slovak: "Deň Ústavy Slovenskej republiky", "Sedembolestná
  Panna Mária", "Deň vzniku Slovenskej republiky / Nový rok", "Zjavenie Pána...". Confirmed straight from the
  API response, not a client-side rendering issue.
- **Evidence:** `response-body` of `POST /api/calendar/filter` for September 2026:
  `"holidayName":"Deň Ústavy Slovenskej republiky"` on `2026-09-01`, `"Sedembolestná Panna Mária"` on
  `2026-09-15`; screenshot `day-planner--month-default.png` shows the rendered strip.
- **Repro:** 1. Confirm account locale is English. 2. Go to `/day-planner` on a month containing a Slovak
  public holiday (September 2026 has two in the seed). 3. Read the holiday strip.
- **Verify:** 1. Same repro. 2. **Pass condition:** holiday names read in English (e.g. "Constitution Day",
  not "Deň Ústavy Slovenskej republiky").
- **Root cause guess:** Same class as shell B1 — holiday names are almost certainly a fixed backend/database
  table of Slovak public holidays with no localized variant, not a `vue-i18n` gap on this side. Batch with
  shell B1 in a backend localization session.
- **Suggested fix:** Backend ask: either localize the holiday name table, or return a stable holiday key the
  frontend can map through vue-i18n (the same shape already used for e.g. `PlannerTaskStatus`).

### B5. Invalid route params surface as uncaught console exceptions instead of a handled state
- **Status:** fixed and verified (retest 2026-09-24, live) — `/day-planner/not-a-date` and the ISO `/day-planner/2026-09-11` both redirect to `/day-planner/24-09-2026` with no `by-date` request; `/day-planner/31-12-2025` shows "Day not available" + "Back to today"; `/day-planner/task/999999` shows the unchanged "Task not found" card; console has only the interceptor's handled 404 log and no uncaught exception.
- **Severity:** bug
- **Where:** `src/core/dayPlanner/view/DayPlannerView.vue:132` (via `useEntityQuery.ts`'s unwrapped throw) and
  `PlannerTaskLinkView`'s equivalent lookup
- **Expected:** An invalid or malformed param should either redirect, or fail visibly *and* be caught, the way
  `PlannerTaskLinkView` already does for an unknown task id (a friendly "Task not found" card) — without also
  leaving an uncaught `AxiosError` in the console. This matches the exact pattern already flagged in
  `docs/views/_shell/inventory.md` for `/todo-list/999999`.
- **Actual:** Two cases produce an uncaught `AxiosError` on the console in addition to whatever the UI shows:
  1. `/day-planner/not-a-date` — `GET /api/calendar/by-date/not-a-date` returns 400; the page does not crash,
     but the entire header row (date, task count, progress bar, now/next, Add Task button) silently disappears
     — only the empty grid and side panel remain, with **no visible error message at all**, and the invalid
     URL stays in the address bar unchanged.
  2. `/day-planner/task/999999` — `GET /api/planner-task/999999` returns 404; the UI **does** show a graceful
     "Task not found" card with a working "Open the calendar" link, but the 404 is still logged as an uncaught
     `AxiosError`.
- **Evidence:** `docs/views/planner-day/screenshots/day-planner-date--invalid-date.png` (blank header, no
  error copy); `day-planner-task--invalid-id.png` (graceful card); console capture showing
  `AxiosError: Request failed with status code 400` at `DayPlannerView.vue:132` and an equivalent 404 stack for
  the task-link case.
- **Repro:** 1. Navigate to `/day-planner/not-a-date`. 2. Open the console — an uncaught `AxiosError` is
  logged, and the page shows no date, no task count, no Add Task button, no error message. Separately: 1.
  Navigate to `/day-planner/task/999999`. 2. The "Task not found" card renders correctly, but the console still
  shows an uncaught 404 `AxiosError`.
- **Verify:** 1. Repeat both repros. 2. **Pass condition (date case):** either the route normalizes/redirects
  invalid dates, or the view shows a visible "invalid date" message instead of a silently blank header — and
  no uncaught exception reaches the console either way. 3. **Pass condition (task case):** the existing
  "Task not found" UI is unchanged, but the console shows no uncaught exception (i.e. the 404 is caught where
  the error card's data is derived, not just handled for display purposes).
- **Root cause guess:** `useEntityQuery.ts`'s `fetchByDate`/`fetchById` calls are awaited inside
  `Promise.all` without a `.catch`, so a non-2xx response propagates as an unhandled rejection at the
  `onMounted` boundary — same shape as the already-known `/todo-list/999999` case in the shell doc.
- **Suggested fix:** Wrap the calendar/task lookups in a try/catch (or pass `_silent` + handle the rejection
  explicitly) and render a visible message for the invalid-date case specifically, since right now it is the
  one of the two with no user-facing signal whatsoever.

### B6. The settings view's active tab is not reflected in the URL
- **Status:** fixed and verified (retest 2026-09-24, live) — each tab click wrote `?tab=<tab>` (e.g. `?tab=calendarView`), a reload on `calendarView` restored it `[selected]`, and the default Repeating Tasks tab leaves the URL bare.
- **Severity:** bug
- **Where:** `DayPlannerSettingsView.vue`'s `activeTab` ref
- **Expected:** CLAUDE.md's URL State rule: "Store filterable/bookmarkable state (filters, tabs, search
  queries, pagination) in URL query params."
- **Actual:** Switching tabs (Repeating Tasks / In-App Nudges / View Defaults / Skip Reasons / Calendar View)
  does not touch the URL; a reload always returns to "Repeating Tasks" regardless of which tab was open.
- **Evidence:** `location.href` stayed `https://localhost:3000/day-planner/settings` across every tab click in
  this pass; a reload after selecting "Calendar View" landed back on "Repeating Tasks" (`find "Repeating
  Tasks"` showed it `[selected]` post-reload).
- **Repro:** 1. Go to `/day-planner/settings`. 2. Click "Skip Reasons". 3. Reload. 4. **Observe:** back on
  "Repeating Tasks".
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** the URL carries the active tab and a reload restores
  it.
- **Suggested fix:** Mirror `activeTab` to a `tab` query param with `router.replace`, same pattern as this
  module's own `useCalendarUrlState.ts`.

### B7. The plan-vs-actual block treats every day as "materially done" the instant it loads — F2's own withhold-until-over rule never actually holds
- **Status:** fixed and verified (retest 2026-09-24, live) — today (`24-09-2026`, 14:35 local, day 08:00→00:00): the block is absent; past day: no seeded tasks exist before today, so a throwaway task on `23-09-2026` was used, and the block read "Planned 1h · logged 0m · 1 task never happened" (the task was deleted afterwards and the day is back to 0 tasks).
- **Severity:** bug
- **Where:** `src/core/dayPlanner/composable/usePlanVsActual.ts:37` (`isDayMateriallyDone`) and
  `src/core/dayPlanner/store/dayPlannerStore.ts:158-171` (`viewEndDate`)
- **Expected:** `prompts/_done/day-planner/F2-plan-vs-actual.md` states explicitly: *"Do not compute a drift
  verdict at 10:00 for a day that ends at 23:00. Either restrict to finished tasks or show nothing until the
  day is materially done."* `isDayMateriallyDone = currentTime.value >= store.viewEndDate` is the intended
  gate for exactly this.
- **Actual:** `viewEndDate` is computed from `core.viewEndTime.hours`: if `endHour >= 24` it correctly rolls
  onto tomorrow, but the `else` branch (`endHour` 0–23) sets `date.setHours(endHour, endMinute, 0, 0)` on
  **today's** date with no adjustment — even though the rest of the module treats an end-hour lower than the
  start-hour as an overnight wrap (`isOverMidnight = viewStartTime.hours > viewEndTime.hours`,
  `usePlannerStoreCore.ts:99`). Every day observed in this pass (and throughout the seed) has `bedTime`
  `{hours:0, minutes:0}` — rendered as "00:00", i.e. midnight, the *end* of an 08:00–00:00 day — which the
  `else` branch turns into `viewEndDate` = **today at 00:00:00**, an instant that is in the past for virtually
  the entire day. The result: `isDayMateriallyDone` is `true` almost immediately after midnight and stays
  `true` for the rest of the day, so the plan-vs-actual block renders its "materially done" verdict at any
  hour, not just once the day is over. Confirmed live: at **19:54 local time**, on a day running 08:00–00:00
  with one task still two minutes from starting, the block already read "Planned 3h · logged 0m · 3 tasks
  never happened" — counting a task that had not even started yet as "never happened" (a direct consequence:
  `neverHappenedCount` only checks `status !== Completed`, which is a safe simplification *if* the day is
  genuinely over, but is wrong the moment the gate that's supposed to guarantee that is itself broken).
- **Evidence:** Screenshot `day-planner-date--mutation-task-created.png` (header shows "Planned 3h · logged
  0m", "3 tasks never happened" at 19:5x with a task starting at 19:55 still pending); browser time confirmed
  via `new Date().toString()` → `Tue Sep 15 2026 19:54:44 GMT+0200`; grid header read "Time grid 08:00 – 00:00"
  confirming `bedTime = {hours:0, minutes:0}`; source read of both files above.
- **Repro:** 1. Go to `/day-planner/<today's date>` any time other than exactly midnight, on a day whose bed
  time renders as "00:00" (the seed default). 2. **Observe:** the plan-vs-actual line under the progress bar
  ("Planned Xh · logged Ym" / "N tasks never happened") is already visible, hours before the day's actual end.
- **Verify:** 1. Same repro, at e.g. 10:00 on a day that runs until 23:00 or 00:00. **Pass condition:** the
  plan-vs-actual block renders nothing (per F2's own spec) until the day is genuinely over. 2. Once genuinely
  past the day's end time, confirm the block **does** appear and its counts are correct.
- **Root cause guess:** `viewEndDate`'s `else` branch never accounts for an overnight-spanning view the way
  `isOverMidnight` elsewhere in the same store already does — it needs the same "does end-hour roll past
  start-hour" check, not just a hardcoded `>= 24` threshold that the day's actual data (`bedTime.hours = 0`)
  never reaches.
- **Suggested fix:** In `dayPlannerStore.ts`'s `viewEndDate`, treat `endHour < core.viewStartTime.value.hours`
  (i.e. reuse the existing `isOverMidnight` condition) the same as `endHour >= 24`: roll onto the next
  calendar day before setting hours.

### B8. A deleted task's calendar day-summary counters (total/completed/%) never refresh — confirmed stale even after a full reload
- **Status:** fixed and verified (retest 2026-09-24, live) — on `24-09-2026` the seeded "1/3 tasks 33%" went to "1/4 tasks 25%" after creating a throwaway task and back to "1/3 tasks 33%" after deleting it, both without a reload; a full reload still read "1/3 tasks 33%". (Root cause was client-side: `CalendarResponse.cs` counts live, `DayPlannerView.vue` now refetches counts on `taskCountKey` change — F87.)
- **Severity:** bug
- **Where:** `DayPlannerProgressBlock.vue:9-22` reads `calendar.completedTasks` / `calendar.totalTasks` /
  `calendar.completionRate` straight from the `Calendar` API payload (`GET /api/calendar/by-date/{date}`);
  confirmed stale server-side, not a frontend cache issue
- **Expected:** Deleting a task should update every surface counting that day's tasks. The `taskStats` figures
  in the same component (planned/free minutes, computed client-side from `store.tasks`) already do this
  correctly — the header's "N/M tasks · X%" should too.
- **Actual:** Created a 3rd task on 2026-09-15 (`1/3 tasks 33%` — correct), then deleted it. The header
  continued to read **"1/3 tasks 33%"** — stale by one task — while the *same line*'s "2h planned" (client-side)
  and the plan-vs-actual block's "2 tasks never happened" below it (also client-side) both correctly reflected
  the remaining 2 tasks. Confirmed this is not a Vue-reactivity/staleness artifact: a **full page reload**
  still returned `"totalTasks":3,"completedTasks":1` from `GET /api/calendar/by-date/15-09-2026` — the
  `Calendar` row's own cached counters were never decremented server-side when the task was deleted.
- **Evidence:** Screenshot `day-planner-date--mutation-stale-progress-count.png` (taken pre-reload, same
  "1/3 tasks 33%" reading); response body of the post-reload `GET /api/calendar/by-date/15-09-2026`:
  `{"...","totalTasks":3,"completedTasks":1,...}` while the grid genuinely rendered only 2 task blocks
  (Bug Fixing, Code Review) and the plan-vs-actual line agreed on 2.
- **Repro:** 1. Note a day's "N/M tasks X%" header. 2. Create a task on that day, confirm the header increments.
  3. Delete that task. 4. **Observe:** header does not decrement. 5. Reload the page. 6. **Observe:** still not
  decremented.
- **Verify:** 1. Repeat the repro. **Pass condition:** after step 6 (a reload), the header's task count and %
  match the actual number of task blocks rendered in the grid.
- **Root cause guess:** Backend-side — `Calendar.totalTasks`/`completedTasks` read as a denormalized counter on
  the `Calendar` row (or a `DayPlan` aggregate) that gets incremented on `POST /api/planner-task` but is not
  decremented on `DELETE /api/planner-task/{id}`. Not a frontend fix — the same class of gap as the other
  backend-confirmed counters in this doc set; worth batching into a backend session with X1.
- **Suggested fix:** Backend: recompute or decrement the `Calendar`'s task counters in the same transaction as
  the `PlannerTask` delete (and audit the status-change path too, since `completedTasks` is equally
  denormalized).

---

### A1. Calendar month prev/next arrows have no accessible name
- **Status:** fixed and verified (retest 2026-09-24, live) — both arrows resolve by role as `button "Previous month"` / `button "Next month"` and both work (Next wrote `?month=2026-10` and moved the grid forward, Previous moved it back). The arrows still exist, contrary to the earlier "fixed by redesign" note; they now live in `MonthYearPicker.vue`, labelled through `dateTime.previousMonth/nextMonth`.
- **Severity:** a11y — **[framework]**
- **Where:** `src/_common/component/calendar/CalendarGrid.vue`'s prev/next month buttons, rendered on
  `/day-planner`
- **Expected:** every icon-only control needs an accessible name (same rule as shell A2, filed against the
  sidebar hamburger).
- **Actual:** `document.activeElement`-style inspection of both arrow buttons shows empty `textContent`, `null`
  `aria-label`, and `null` `title`.
- **Evidence:** JS eval on both button refs: `{"text":"","aria":null,"title":null}` for both prev and next.
- **Repro:** 1. Go to `/day-planner`. 2. Inspect the `<` and `>` buttons next to the Month/Year selects.
- **Verify:** 1. Same repro. **Pass condition:** both buttons expose a localized accessible name (e.g.
  "Previous month" / "Next month") and still function.
- **Root cause guess:** Same class as shell A2 (sidebar hamburger) — a framework-wide gap in icon-only `VBtn`
  usage, not specific to this module.
- **Suggested fix:** Add localized `aria-label`s to the two buttons in `CalendarGrid.vue`.

---

### P1. Missing FontAwesome icon on the "Date range" recurrence tab — console error, blank icon slot
- **Status:** fixed and verified (retest 2026-09-24, live) — in the New Repeating Task dialog all four recurrence tabs, "Date range" included, render an `<svg>` icon, and the console shows 0 errors on open (no "Could not find one or more icon(s)").
- **Severity:** polish
- **Where:** New/Edit Repeating Task dialog (`/day-planner/settings`, Repeating Tasks tab → Add), the
  "Recurrence" tab strip's "Date range" button
- **Expected:** Each recurrence-type tab (Day of week, Day of month, Date range, Day type) shows a leading
  icon, matching the other three.
- **Actual:** "Date range" renders with no icon at all — just the text, misaligned against its siblings which
  all have one. Console logs `Could not find one or more icon(s) {prefix: fas, iconName: calendar-range}` the
  moment the dialog opens.
- **Evidence:** Screenshot `day-planner-settings--mutation-repeating-recurrence.png` (Day of week/Day of
  month/Day type all show an icon, Date range shows none); console:
  `[ERROR] Could not find one or more icon(s) {prefix: fas, iconName: calendar-range}` at
  `@fortawesome_vue-fontawesome.js`.
- **Repro:** 1. Go to `/day-planner/settings`, Repeating Tasks tab. 2. Click the "+ Add" button. 3. Look at the
  four recurrence-type tab buttons.
- **Verify:** 1. Same repro. **Pass condition:** "Date range" shows an icon matching its siblings, and the
  console logs no "Could not find one or more icon(s)" error.
- **Root cause guess:** `calendar-range` is not part of the FontAwesome 7 free/solid icon set actually bundled
  by this app (CLAUDE.md specifies FontAwesome 7) — likely a renamed or pro-only icon referenced by its old
  name.
- **Suggested fix:** Swap to a bundled icon (e.g. `calendar-days` or `calendar-week`, both present elsewhere in
  this module's own recurrence tabs) in whichever component renders the recurrence tab strip.

### P2. "Importance" is silently required in the New/Edit Repeating Task dialog but shows no required-field asterisk
- **Status:** fixed and verified (retest 2026-09-24, live) — the New Repeating Task dialog's Importance field reads `combobox "* Importance"` before any submit attempt.
- **Severity:** polish
- **Where:** New/Edit Repeating Task dialog, `Importance` select — contrast with the same dialog's `* Name` /
  `* Activity`, which do carry the asterisk convention used throughout this app's dialogs
- **Expected:** Every other required field in this app's forms (confirmed in the same session: Add/Edit Task's
  `* Name`, `* Activity`) is marked with a leading `*` before its label. A field that blocks submission with
  "This field is required" should carry the same marker.
- **Actual:** Clicking Confirm with Importance left unset fails with a "This field is required" alert under the
  field — but the label reads plain "Importance", not "* Importance", so there is no upfront visual cue that
  this field (unlike Location, Notes, "Is background" on the very same dialog) is mandatory.
- **Evidence:** Snapshot showing `combobox "Importance"` (no asterisk) alongside `alert: "This field is
  required"` after a failed submit attempt; contrasted with `combobox "* Activity"` and `textbox "* Name"` in
  the same dialog and in the plain Add/Edit Task dialog, where Importance is genuinely optional and unmarked.
- **Repro:** 1. Go to `/day-planner/settings`, Repeating Tasks tab, click "+ Add". 2. Fill Activity and pick a
  recurrence day, but leave Importance unset. 3. Click Confirm. **Observe:** submission fails with "This field
  is required" under Importance, which had no asterisk warning beforehand.
- **Verify:** 1. Same repro. **Pass condition:** the Importance label carries the same required-field marker as
  Name/Activity before the user ever attempts to submit.
- **Suggested fix:** Add the `*` prefix to the Importance label in the repeating-task form (or, if Importance
  is genuinely meant to be optional here the way it is in the plain task dialog, relax the validator instead —
  whichever matches the intended design).

### B9. The day view's card clips its own content: the last 40 minutes of the day can't be scrolled to, and a focus scroll hides the header for good (390 px)
- **Status:** fixed 2026-10-08 (`F91`: below `md` the card isn't viewport-height and the page scrolls. At every width the card body
  can shrink, so the grid fits the card, which it didn't at 1440 either (up to 108 px clipped in a split pane). Step 2 passes on the
  day and the template at 390 and 1440, and on both split panes at 1440; below `md` the split is `F99`'s alert. Step 3 couldn't run,
  because task 16002 is gone. Swipe-scrolling the grid was `B10`, fixed the same day by `F108`)
- **Severity:** bug
- **Where:** @390×844 · `/day-planner/05-10-2026` → `DayPlanner.vue:4` (`VCard class="h-100"`, Vuetify's `overflow: hidden`) + `DayPlanner.vue:162-166` (`.calendar-grid { height: 500px }` below 600 px) + `DayPlannerHeader.vue` (wraps to ~470 px). **Also `/day-planner/templates/20001` and both panes of `/day-planner/templates/split?left=20001&right=20002`** (confirmed by x4 `planner` second half, 2026-10-06). On the template view the card is `t80 b828 sh 810/748` and the grid ends at 878, so the last label reached is 22:40 of a 07:00–23:00 day. In each split pane the card is `sh 854/672` with the grid ending at 1060 against the card's 880, and the card itself ends 36 px below the viewport with nothing to scroll it into view (`.v-container` 780/780). Focusing a task in the left pane scrolled its clipped card by 182 px and took the pane's title, slot buttons and template select with it (`docs/views/planner-templates/screenshots/day-planner-templates-split--mobile-tasks.png`).
- **Expected:** every time slot in the grid can be scrolled into view, and the date heading and day arrows stay reachable (plain sense, WCAG 1.4.10 reflow).
- **Actual:** the header wraps to ~470 px, so the card's content is 992 px tall inside a 748 px card (top 80, bottom 828) with `overflow-y: hidden`. The grid (560–1060) is its own scroller, but its bottom 232 px sit below the card's clip. Scrolled to the end, the last visible label is `23:10`. `23:20`–`00:00` never appear. Separately, `/day-planner/task/16002` focuses the task, and the browser scrolls the clipped card to do it (`scrollTop` 244). The date title (`top -133`), the prev/next arrows and the panel toggle leave the screen. A mouse wheel over the header leaves `scrollTop` at 244, and touch can't scroll an `overflow: hidden` box, so only a reload brings them back.
- **Evidence:** `docs/views/planner-day/screenshots/day-planner-date--mobile-grid-bottom.png`, `day-planner-task--mobile-redirect.png`. `eval` ancestor chain of `.calendar-grid`: `v-card` `t80 b828 oy=hidden sh=992 ch=748`. At 768×1024 the card fits (`sh 928 = ch 928`), so this is phone-only.
- **Repro:** 1. `resize 390 844`, open `/day-planner/05-10-2026`. 2. Scroll the time grid to its end. 3. The last label is 23:10. 4. Open `/day-planner/task/16002`. 5. The date heading is gone and nothing scrolls it back.
- **Verify:** 1. `playwright-cli resize 390 844`, then `reload` on `/day-planner/05-10-2026`. 2. `eval` `(() => { const g=document.querySelector('.calendar-grid'); g.scrollTop=g.scrollHeight; const c=g.closest('.v-card'); return [g.getBoundingClientRect().bottom <= c.getBoundingClientRect().bottom, c.scrollHeight <= c.clientHeight] })()`. **Pass:** `[true, true]`. 3. Open `/day-planner/task/16002`. **Pass:** `.date-title` has `top >= 64`, or the page itself scrolls (document `scrollHeight > innerHeight`) so the user can reach it.
- **Root cause guess:** a fixed-height grid inside a height-capped, overflow-hidden card. That works on desktop, where the header is one ~80 px row, and breaks once the header wraps.
- **Suggested fix:** below `md`, drop `h-100` from the card and let the page scroll, or size the grid as `flex: 1 1 0; min-height: 0` so it shrinks to the space the header leaves.

### A2. The compact side panel acts like a modal but doesn't manage focus: focus stays on the toggle it covers, Escape doesn't close it, and closing drops focus to `<body>` (390 px)
- **Status:** fixed 2026-10-07 (`F98`: when compact, `PlannerSidePanelShell` focuses its X on open, closes on Escape and refocuses the opener on close. Verified on the day, the template and a split pane)
- **Severity:** a11y
- **Where:** @390×844 · `/day-planner/05-10-2026` → `PlannerSidePanelShell.vue:5-25` (absolute overlay, `z-index: 30`, when `compact`) and `DayPlannerHeader.vue:8-14` (the toggle). **Also `/day-planner/templates/20001` (toggle in `TemplatePlannerHeader.vue:8-14`) and each pane of `/day-planner/templates/split`** (confirmed by x4 `planner` second half, 2026-10-06). Same three symptoms on both: after "Open panel", focus stays on the header toggle (now "Close panel"), which `elementFromPoint` shows is covered. Escape leaves the panel open. Closing with the panel's X leaves focus on `<body>`. In a split pane the panel is also clipped by the 171 px pane: its X spans 157–193 across the pane edge, and Bed Time and the Routine tab are cut (`docs/views/planner-templates/screenshots/day-planner-templates-split--mobile-panel.png`).
- **Expected:** an overlay panel that covers the controls under it moves focus into itself, closes on Escape, and returns focus to its opener (WAI-ARIA disclosure/dialog practice; same expectation as `_shell` A4 for the nav drawer).
- **Actual:** after "Open panel", `document.activeElement` is still the header toggle (now named "Close panel"), and it sits under the panel: `elementFromPoint(48,128)` hits the panel's card. Escape leaves the panel `display: flex`. Closing with the panel's X leaves focus on `<body>`. While the panel is open, the DOM holds two "Close panel" buttons: the panel's X (first in DOM, visible) and the covered header toggle.
- **Evidence:** `docs/views/planner-day/screenshots/day-planner-date--mobile-panel-open.png`. `eval` on `document.activeElement` after each step.
- **Repro:** 1. `resize 390 844`, open `/day-planner/05-10-2026`. 2. Click "Open panel". 3. Check focus; press Escape. 4. Click the panel's X; check focus.
- **Verify:** 1. `playwright-cli resize 390 844`, then `reload`. 2. Click `getByRole('button', { name: 'Open panel' })`. **Pass:** `document.activeElement` is inside the panel card. 3. Press Escape. **Pass:** the panel is `display: none` and focus is on `getByRole('button', { name: 'Open panel' })`.
- **Suggested fix:** when `compact`, focus the panel's X on open, add `@keydown.esc` on the card, and refocus the header toggle on close (the view owns both, through `panelOpen`).

### P3. Month grid at phone width: day headers misalign and clip, the "Days to show" select stretches and clips, and the grid gets a 263 px window — [framework] (390 px)
- **Status:** fixed 2026-10-08 (`FW33`, framework `8cf8079`, pointer bumped in `59ce7415`). The headers are a sticky row of the
  scroller (short names below `md`), and the toolbar wraps. All three steps pass at 390 on `/day-planner` and
  `/activity-history/calendar`: every header matches its column to 0 px, nothing in the toolbar ends past 390, and both fields are
  40 px tall. The body window grew from 286 to 335 px. The rest of the toolbar height is `MonthYearPicker`'s own wrap (› alone on
  a line), which is outside this finding.
- **Severity:** polish — **[framework]**
- **Where:** @390×844 · `/day-planner` → `src/_common/component/calendar/CalendarGrid.vue:15-31` (toolbar `d-flex ga-3` with no wrap, `VSelect minWidth="210px"`), `:46-55,363-370` (headers use `day.name`, never the `shortName` that `allDays` already computes; `padding-right: 16px`). **Also `/activity-history/calendar`** (added by x4 `history`, 2026-10-06): header grid 17–417 over a 17–373 body, so the Thursday cell "01.10." (170–220) sits mostly under "Wed" (127–201) and "Sun" (366–417) is clipped. The "Days to show" select is 213–423 × 165–407 (242 px tall). The DateRangePicker is squeezed so ‹ sits above Month and › beside Year. Same overflow-script lines (`div.d-flex.ga-3 → 423`, `div.day-header.weekend → 417`). `docs/views/history-review/screenshots/activity-history-calendar--mobile.png`, `--768.png`.
- **Expected:** the column headers line up with the day columns and fit, every toolbar control is fully visible, and the grid shows a useful slice of the month (plain sense).
- **Actual:** full weekday names push the header grid to 400 px in a 372 px card. "Wednesday" spans 115–193 over a 115–168 column, and "Sunday" (358–409) is cut to "Sun". The DateRangePicker (168 px) and the 210 px select share a non-wrapping row, so the select stretches to 242 px tall, ends at 415 and loses its chevron under the card title's `overflow: hidden`. The toolbar ends at y≈430, so `.calendar-body` is 263 px tall for 1100 px of weeks: about one week at a time.
- **Evidence:** `docs/views/planner-day/screenshots/day-planner--mobile.png`, `day-planner--mobile-week2.png`. Overflow script: `div.d-flex.ga-3 → 415`, `div.day-header.weekend → 409`. At 768×1024 the select is still 148 px tall (`day-planner--768.png`).
- **Repro:** 1. `resize 390 844`, open `/day-planner`. 2. Look at the header row and the "Days to show" field.
- **Verify:** 1. `playwright-cli resize 390 844`, then `reload` on `/day-planner`. 2. Run the overflow script. **Pass:** no `day-header` and no toolbar element ends past 390, and each `.day-header`'s left/right matches the column below it within 2 px. 3. **Pass:** the "Days to show" `.v-field` is ≤ 56 px tall.
- **Suggested fix:** render `shortName` below `sm`, give the toolbar row `flex-wrap`, and drop the select's fixed `minWidth` below `sm`.

### P4. Month-grid day cells cut off their own summary: "0/2 task", no percentage, and a clipped today badge (390 px)
- **Status:** fixed 2026-10-08 (`F101` in `59ce7415`; the today badge is `FW33`'s, in the framework cell header). Below `sm` a cell
  shows the day number, a bold `N/M` over the bar, and icon markers for location, template, weather and notes. Verify passes at 390:
  31/31 `.day-cell`s, and every `.cell-content` too, have `scrollWidth <= clientWidth` (the today cell was 71/51). Also clean at 768,
  1280 and 1440, where the full row now wraps instead of overrunning a 105 px cell.
- **Severity:** polish
- **Where:** @390×844 · `/day-planner` → `src/core/dayPlanner/component/calendar/CellTaskProgress.vue:65-95` (the below-`sm` branch) inside `CalendarGrid`'s 53 px `.day-cell` (`overflow: hidden`).
- **Expected:** a day cell shows the planned/done figure in a form that fits the cell (plain sense; at desktop width the cell carries `N/M tasks` + `%`).
- **Actual:** the today cell's content is 71 px wide in a 52 px cell. It reads "06.10" with the badge cut, "0/2 task", and the percentage is invisible. Below 600 px the tooltip with the day's task names is dropped (`v-if="smAndUp"`), so the cell has no other way to show them. Time ranges wrap to three lines ("08:00 / - / 00:00").
- **Evidence:** `docs/views/planner-day/screenshots/day-planner--mobile-week2.png`. `eval` on `.day-cell.today`: `scrollWidth 71 / clientWidth 52`, `innerText "06.10. | 08:00 - 00:00 | 0/2 tasks0%"`.
- **Repro:** 1. `resize 390 844`, open `/day-planner`. 2. Scroll the grid to the current week.
- **Verify:** 1. `playwright-cli resize 390 844`, then `reload` on `/day-planner`. 2. `eval` every `.day-cell:not(.empty)`. **Pass:** `scrollWidth <= clientWidth` for each.
- **Suggested fix:** below `sm`, show a compact `N/M` (or just the progress bar) and drop the clock row.

### P5. Day Details dialog: the Location field is squeezed to 76 px and shows "L…" (390 px)
- **Status:** open
- **Severity:** polish
- **Where:** @390×844 · `/day-planner?mode=editDetails` → click a day (also the panel's EDIT on `/day-planner/:date`) → Day Details dialog, Day Type / Location row.
- **Expected:** a field's label and value are readable (plain sense).
- **Actual:** Day Type takes 77–220 and Location's field 273–349. The label renders "L…", and a picked location would be truncated the same way. The dialog itself fits (24–366), and Cancel/Confirm are visible.
- **Evidence:** `docs/views/planner-day/screenshots/day-planner--mobile-day-details-dialog.png`. The Location input box is 114 px including its icon.
- **Repro:** 1. `resize 390 844`, open `/day-planner`. 2. "Edit Details", click any day.
- **Verify:** 1. `playwright-cli resize 390 844`, then `reload` on `/day-planner?mode=editDetails`, click a day. **Pass:** the Location field's `.v-field` is ≥ 150 px wide, or sits on its own row.
- **Suggested fix:** stack Day Type and Location below `sm` (`cols="12" sm="6"`).

### P6. Planner settings hide controls in horizontal scrollers with no cue: the Repeating Tasks "Add" button and the "30 MIN" slot size (390 px)
- **Status:** open — the *Add* half fixed 2026-10-07 (`FW27`, the pinned actions column); the "30 MIN" half is `F106`
- **Severity:** polish (both are reachable by scrolling sideways)
- **Where:** @390×844 · `/day-planner/settings` → Repeating Tasks table header (`v-table__wrapper`, `scrollWidth 458 / clientWidth 372`); `?tab=viewDefaults` → "Time slot size" `MyBtnToggle` (`overflow-x: auto`, ends at 365). **Added by x4 `leisure` (2026-10-06):** the Repeating Tasks "Add" is `BasicTable`'s header button. Its root cause is a dead sticky rule in the framework table, which was meant to pin the actions column. Filed once as `leisure-backlog-picker` B6 [framework], so fix that half there rather than moving the button here.
- **Expected:** a tab's primary action is visible on landing, above all on an empty table whose only next step is that action (plain sense).
- **Actual:** the "Add" icon button sits at x 411–451, past the right edge, in an empty table that says "No data available". Nothing hints that the table scrolls. In View Defaults, "30 MIN" (334–413) is cut to "30". The tab strip itself also overflows (to 691), but that's Vuetify's swipeable tab bar, and every tab is reachable.
- **Evidence:** `docs/views/planner-day/screenshots/day-planner-settings--mobile.png`, `day-planner-settings--mobile-viewdefaults.png`.
- **Repro:** 1. `resize 390 844`, open `/day-planner/settings`. 2. Look for the Add button. 3. Open View Defaults.
- **Verify:** 1. `playwright-cli resize 390 844`, then `reload` on `/day-planner/settings`. 2. **Pass:** `getByRole('button', { name: 'Add', exact: true })` has `right <= 390` without scrolling. 3. On `?tab=viewDefaults`, **pass:** every button in the "Time slot size" group has `right <= 390`.
- **Suggested fix:** move "Add" out of the table header into the tab's own toolbar. Let the slot-size group wrap, or use shorter labels ("30m") below `sm`.

### P7. "Task not found" squeezes its message into an 82 px column inside a 684 px-tall alert (390 px)
- **Status:** open
- **Severity:** polish
- **Where:** @390×844 · `/day-planner/task/999999` → `PlannerTaskLinkView`'s `VAlert` with the "Open the calendar" link in `#append`.
- **Expected:** the error message reads as a paragraph across the alert (plain sense).
- **Actual:** the append slot (179–350) keeps its row, leaving `.v-alert__content` 81–163. "This task no longer exists — it was most likely deleted in the meantime." wraps one or two words per line, and the alert grows to 112–796. The link itself works and is hit-testable.
- **Evidence:** `docs/views/planner-day/screenshots/day-planner-task--mobile.png`. Console: only the interceptor's handled 404 (known, see B5).
- **Repro:** 1. `resize 390 844`. 2. Open `/day-planner/task/999999`.
- **Verify:** 1. `playwright-cli resize 390 844`, then `reload` on `/day-planner/task/999999`. **Pass:** `.v-alert__content` is ≥ 250 px wide and the alert is under 250 px tall.
- **Suggested fix:** put the link under the text (default slot, or an actions row) instead of `#append` below `sm`.

### B10. A swipe on the task column doesn't scroll the day grid: it opens *Add New Task* or moves the task under the finger — confirmed live, renumbered from `U1` (390 px)
- **Status:** fixed 2026-10-08 (`F108`: the column is `pan-y`, and on touch, drag, create and resize arm only after a 400 ms
  long press. Verified with emulated touch at 390 on the template, where a swipe scrolls 104 px from an empty slot and from task
  20101 with no dialog and no write, and on the day, where it scrolls 107 px. The mouse path at 1440 is unchanged)
- **Severity:** blocker (re-graded from `unverified`, 2026-10-08). The natural scroll gesture writes to the server on every
  `DayPlanner` mount, on any touch device, and the only way to scroll the grid is its 80 px time column.
- **Confirmed (2026-10-08):** `playwright-cli` at 390×844 on `/day-planner/templates/20001`, with CDP touch emulation
  (`Emulation.setTouchEmulationEnabled`, `navigator.maxTouchPoints` 5) and real touch input (`Input.dispatchTouchEvent`, a 100 px
  upward swipe in ten steps). Every write to `/api/(template-)planner-task` was intercepted and aborted, so no fixture row changed.
  The day route couldn't be used: `POST /api/planner-task/filter` returned 500 that day, so its grid didn't render. The template
  view mounts the same `DayPlanner` and `PlannerTasksColumn`.
  - **Empty slot** (235, 518): the grid's `scrollTop` stayed 0, and the *Add New Template Task* dialog opened.
  - **Task block** (235, 611): the grid's `scrollTop` stayed 0, and `PATCH /api/template-planner-task/20101` fired. The task was moved
    under the finger.
  - **Control, time column** (66, 518), `touch-action: auto`: the same gesture scrolled the grid 181 px, so the emulated input does
    produce native scrolling.

  Read with the source: `touch-action: none` means the browser never claims the gesture for scrolling and never sends
  `pointercancel`. `handlePointerDown` therefore always starts a creation preview or a drag, `pointerup` opens the dialog (`:353`), and
  a drag past `MOVEMENT_THRESHOLD` (5 px) saves the move (`:262`).
- **Where:** @390×844 · `/day-planner/:date` (and every `DayPlanner` mount; **`/day-planner/templates/20001` confirmed** by x4 `planner` second half, 2026-10-06: `.tasks-column` is `touch-action: none` across 102–368 of the 20–370 grid, the same geometry. In a split pane it is 63 px of a 147 px grid) → `PlannerTasksColumn.vue:181-188` (`.tasks-column { touch-action: none }`), `usePlannerPointerInteractions.ts:74-113`.
- **What verified it** (the round's original note, kept): live: `.tasks-column` has computed `touch-action: none` and spans x 102–368 of the 20–370 grid. Only the 80 px time column (`touch-action: auto`) lets the browser scroll. Source: a `pointerdown` on an empty slot starts a creation preview (and `pointerup` opens the create dialog, line 353), and one on a task block starts a drag that moves the task once past `MOVEMENT_THRESHOLD`. So a vertical swipe over 76 % of the grid would either open "Add New Task" or reschedule the task under the finger. This pass's browser has `maxTouchPoints 0`, and the read-only rule forbids the drag, so neither was reproduced. Needs a touch-enabled context (`hasTouch: true`, `page.touchscreen`) on a throwaway day: swipe up over an empty slot and over a task, and record whether the grid scrolls, a dialog opens, or a `PUT /api/planner-task/*` fires.
- **Verify:** 1. `playwright-cli resize 390 844`, then enable touch through `run-code` (a CDP session:
  `Emulation.setTouchEmulationEnabled { enabled: true, maxTouchPoints: 5 }`), route writes to `/api/(template-)?planner-task` to
  `abort()`, and `reload` on `/day-planner/templates/20001` (and on `/day-planner/:date` once its filter loads). 2. Dispatch a 100 px
  upward `touchStart` / `touchMove` ×10 / `touchEnd` over an empty slot, then over a task block. **Pass:** each swipe changes the grid's
  `scrollTop`, opens no dialog and sends no write. 3. A long-press on a task block and then a drag still moves it, and a long-press on an
  empty slot followed by a drag still creates. 4. With a mouse at 1440, drag-to-move and drag-to-create behave as before.
- **Suggested fix:** `touch-action: pan-y` on the column, and start drag/create only after a long-press for `pointerType === 'touch'`.
