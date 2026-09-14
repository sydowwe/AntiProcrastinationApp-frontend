# planner-day — findings

> Pass: inventory · captured 2026-09-14 · commit `6aac48bb`

**Tally:** blocker 0 · bug 6 · a11y 1 · polish 0 · opportunity 0 · unverified 0

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-14 | `6aac48bb` | initial inventory pass |

---

### B1. `DayPlannerSettingsView`'s tabs stack instead of switching — every tab you've visited stays rendered
- **Status:** open
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
- **Status:** open
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
- **Status:** open
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
- **Status:** open
- **Severity:** bug
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
- **Status:** open
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
- **Status:** open
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

---

### A1. Calendar month prev/next arrows have no accessible name
- **Status:** open
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
