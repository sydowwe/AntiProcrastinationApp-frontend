# history-review — findings

> Pass: inventory · captured 2026-09-14 · commit `adc9c67f`

**Tally:** blocker 0 · bug 0 · a11y 0 · polish 0 · opportunity 0 · unverified 0 (everything closed — all of
B1-B4, A1-A2, P1-P3 fixed and verified in code; U1 and U2 verified/resolved)

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-14 | `adc9c67f` | initial inventory pass |
| 2 | 2026-09-24 | (code check, no commit) | B1-B3, A2, P2-P3 confirmed fixed in code; U2 confirmed resolved by backend B2 nullability audit |
| 3 | 2026-09-24 | (browser check, no commit) | U1 closed — both the plain-empty and genuine first-run branches confirmed live on Calendar and Summary |

---

### B1. The period-total banner renders clipped to ~2 illegible characters in Summary's Top Activities panel
- **Status:** fixed and verified (code check 2026-09-24 — `HistoryPeriodBanner.vue`'s `.myAlert` now sets
  `flex: 0 0 auto` with a comment explaining VAlert's default `flex: 1 1 0%` was the cause; the parent row's
  `flex-wrap` now activates instead of compressing the alert)
- **Severity:** bug
- **Where:** `src/core/historyDashboard/component/summaryCards/HistoryPeriodBanner.vue` (the `VAlert`,
  `style="max-width: fit-content"` with no `flex-shrink: 0`) rendered inside
  `src/core/historyDashboard/component/summaryCards/HistorySummaryCards.vue:4`'s
  `d-flex ga-4 align-center mb-4 flex-wrap` header row, on `/activity-history` (`HistorySummaryView`)
- **Expected:** The banner should show its full content — "Period total: 19h 7m vs previous: 7h 16m
  +163.1%" — or wrap onto its own line if the row runs out of width. Plain sense: information rendered but
  unreadable is worse than not rendering it at all.
- **Actual:** In the two-select-plus-banner header row (title + "Compared to" select (170px) + "Show" select
  (100px) + the banner), the banner is compressed below its `fit-content` size instead of wrapping, showing
  only a green icon and "Pe" / "to" fragments. Confirmed via a cropped screenshot of the alert element
  itself: it renders at ~62×34px against a full accessibility-tree text content of "Period total: 19h 7m vs
  previous: 7h 16m +163.1%".
- **Evidence:** `docs/views/history-review/screenshots/summary--period-total-alert-clipped.png` (element
  screenshot showing only "Pe"/"to"); full-page context in
  `docs/views/history-review/screenshots/activity-history--populated.png`.
- **Repro:** 1. Sign in, go to `/activity-history` with the default week range (enough top-activity data to
  populate a real percent-change, e.g. any period with 2+ weeks of history behind it). 2. Look at the
  "Top Activities" panel header, to the right of the "Show" dropdown. 3. The period-total banner is
  unreadable.
- **Verify:** 1. Load `/activity-history` in a viewport ≥1440px wide with a populated baseline comparison.
  2. **Pass condition:** the banner either shows its full text on one line, or wraps to a new line below the
  two selects — never compressed below a readable width. 3. Confirm the two selects and title are unaffected.
- **Root cause guess:** `VAlert`'s `max-width: fit-content` sets an upper bound but not a lower one; as a
  flex item with the browser's default `flex-shrink: 1`, it is allowed to shrink below its intrinsic content
  width once the row's total intrinsic width exceeds the container, rather than the row wrapping first.
- **Suggested fix:** Add `flex-shrink: 0` (and optionally `min-width: fit-content`) to `.myAlert` in
  `HistoryPeriodBanner.vue`, so the flex-wrap on the parent row activates instead of compressing the alert.

### B2. A failed dashboard request renders identically to a genuinely empty period
- **Status:** fixed and verified (code check 2026-09-24, `F27` — `useHistoryDashboard.ts` now tracks a
  per-panel error ref (`stackedBarsError`/`pieChartError`/`summaryCardsError`/`timeOfDayError`) alongside
  the nulled data, and `HistoryPieChartSection.vue` (and siblings) branch on `error` to render
  `HistoryErrorState` with a retry affordance instead of falling through to the empty-state branch; the
  first-run check also now bails out rather than answering on a failed round)
- **Severity:** bug
- **Where:** `src/core/historyDashboard/component/pieChart/HistoryPieChartSection.vue` (and, by the same
  composable, the stacked-bars/summary-cards panels), on `/activity-history/detail`
  (`HistoryDetailView`) — the same `useHistoryDashboard` composable backs `HistorySummaryView` too, so the
  gap is shared, not Detail-specific
- **Expected:** CLAUDE.md's own tracked gap (`docs/views/_fix-queue.md` / the runbook's Class 1 section)
  says a paged grid needs "an error state distinct from its empty state." The same expectation applies here:
  a request failure should not look identical to "nothing happened in this window."
- **Actual:** Mocked `POST /activity-history/dashboard/detail/pie-chart` to return 500, then reloaded. The
  panel rendered exactly the same `HistoryEmptyState` ("No data for this period · 09.09.2026") as a real
  empty response. The failure *does* surface elsewhere — one `AxiosError` logged through the shared
  interceptor at `src/_common/axiosConfig.ts:122` (which per its own contract also fires an error snackbar) —
  but nothing in the pie-chart panel itself tells the user their data failed to load rather than not
  existing.
- **Evidence:** console line `[ERROR] AxiosError: Request failed with status code 500 @
  .../axiosConfig.ts:122`; response `POST .../dashboard/detail/pie-chart => 500` in the request log; on-screen
  text unchanged from the genuine-empty repro on `date=2026-09-07`.
- **Repro:** 1. `playwright-cli route "**/api/activity-history/dashboard/detail/pie-chart" --status=500`.
  2. Reload `/activity-history/detail`. 3. The pie-chart panel shows "No data for this period" with no error
  indication. 4. `playwright-cli unroute` to clean up.
- **Verify:** 1. Repeat the repro above. 2. **Pass condition:** the panel shows a state visibly distinct from
  the empty state (e.g. a retry affordance or an error icon/message), not the same copy as "No data for this
  period."
- **Root cause guess:** `useHistoryDashboard.ts`'s fetchers likely null the data ref on any rejection
  (correct, per H1's fix) but do not track a separate `hasError` flag per panel, so the empty-state branch
  fires for both "null because empty" and "null because failed."
- **Suggested fix:** Track a per-fetch error flag in `useHistoryDashboard` and have each `HistoryEmptyState`
  consumer branch on it to render a distinct (even minimally distinct — different icon/copy) error state.

### B3. Breadcrumb reads "Home › Summary" while viewing the Detail page
- **Status:** fixed and verified (code check 2026-09-24 — `HistoryDetailView.vue` calls the framework's
  `useSetBreadcrumbExtra()` and pushes the resolved page title, exactly the suggested fix / the shell pass's
  P1 pattern)
- **Severity:** bug
- **Where:** `src/_common/nav/AppBreadcrumbs.vue` / `src/_common/composable/general/useBreadcrumbs.ts`
  (`matchesPath`, `src/_common/nav/navTypes.ts:41-44`), on `/activity-history/detail`
  (`HistoryDetailView`)
- **Expected:** The breadcrumb should reflect the page actually being viewed. Plain user sense, and the same
  expectation the shell pass's P1 finding (`docs/views/_shell/inventory.md`) already established and fixed
  for `/todo-list/:id` via `useSetBreadcrumbExtra()`.
- **Actual:** On both a fresh `goto` of `/activity-history/detail?date=2026-09-09` and after navigating there
  via a stacked-bar click, the breadcrumb shows "Home › Summary" — reading `document.querySelector('.v-breadcrumbs').textContent` returns `"HomeSummary"` — while the page heading and content are
  "History Detail". `matchesPath('/activity-history', '/activity-history/detail')` returns `true` because
  `path.startsWith(to + '/')`, so the Summary nav item (the only sibling registered with a `to`) wins the
  trail match for the un-registered `/activity-history/detail` route.
- **Evidence:** `docs/views/history-review/screenshots/activity-history-detail--timeline-populated-en.png`
  (breadcrumb visible at top); `location.href` confirmed `/activity-history/detail?...` at time of capture;
  direct eval of `.v-breadcrumbs` textContent.
- **Repro:** 1. Go directly to `/activity-history/detail?date=2026-09-09` (or drill in via a stacked-bar
  click from Summary). 2. Read the breadcrumb in the top bar. 3. It says "Home › Summary", not anything
  naming Detail.
- **Verify:** 1. Load `/activity-history/detail?date=2026-09-09`. 2. **Pass condition:** the breadcrumb names
  the Detail page (e.g. "Home › History › <date>" or "Home › Summary › <date>" — any segment distinguishing
  it from the plain Summary route). 3. Confirm `/activity-history` itself still shows just "Home › Summary"
  unaffected.
- **Root cause guess:** `/activity-history/detail` has no entry in `src/app/nav/navItems.ts`, so
  `findTrail` never terminates on it directly and falls back to its longest-matching ancestor prefix
  (`/activity-history`, i.e. Summary).
- **Suggested fix:** Same pattern as the shell's P1 fix — have `HistoryDetailView.vue` call the framework's
  `useSetBreadcrumbExtra()` to push a segment naming the viewed date/page once mounted, rather than changing
  the framework's generic prefix-matching (which other apps' un-navved routes may depend on as-is).

### B4. Calendar public-holiday names render in Slovak regardless of the account's English locale
- **Status:** fixed and verified (2026-09-21 — backend `B19` sends a stable `holidayKey` on the History calendar
  endpoint too; `CalendarGrid`'s holiday chips resolve it through the framework's `useHolidayLabel()`, so this
  view and the planner closed together. `_fix-queue.md` retired §8; body in the log.)
- **Severity:** polish (re-graded from `bug`, `_fix-queue.md` *Contradictions* §30 — a proper noun, not app text in the wrong locale)
- **Where:** `src/_common/component/calendar/CalendarGrid.vue:97-104` (`{{ formatToDateWithDay(holiday.date)
  }} - {{ holiday.holidayName }}`), rendering the `holidayName` field from
  `POST /activity-history/dashboard/calendar`'s response, on `/activity-history/calendar`
- **Expected:** With the account's language preference set to English (confirmed via `/user/settings` →
  Language = English, and every surrounding piece of UI — nav labels, month/day names, breadcrumbs —
  rendering in English), holiday names should also be in English (or at minimum not silently render in a
  language the user never selected).
- **Actual:** The holiday strip at the bottom of the September 2026 calendar reads "01.09. - Deň Ústavy
  Slovenskej republiky" and "15.09. - Sedembolestná Panna Mária" — untranslated Slovak public-holiday names —
  while every other string on the same screen is English.
- **Evidence:** `docs/views/history-review/screenshots/activity-history-calendar--populated.png` (bottom
  strip); confirmed the component just renders whatever `holidayName` string the server sends
  (`CalendarGrid.vue:104`), so the gap is in the data, not client-side i18n handling.
- **Repro:** 1. Sign in as an English-locale account. 2. Go to `/activity-history/calendar`, viewing a month
  containing a Slovak public holiday (September 2026 has two). 3. Read the holiday strip at the bottom.
- **Verify:** 1. Same repro. 2. **Pass condition:** the holiday name is in the account's locale, or the
  strip is omitted/generic for accounts outside Slovakia — not left silently in Slovak.
- **Root cause guess:** Same class as the shell pass's B1 finding (notification content ignoring locale) —
  content resolved/stored server-side rather than through vue-i18n against the request's locale. Likely a
  backend calendar/holiday-table localization gap, not a frontend rendering bug — do not batch with
  client-side raw-key findings.
- **Suggested fix:** Escalate to whoever owns the holiday-table/calendar seed data, alongside the shell's B1
  (notification locale) — both are the same root shape (server-authored user-facing text bypassing
  vue-i18n).

### A1. Stacked-bar chart columns have no accessible name
- **Status:** fixed and verified (2026-09-22, `F29` — each bar is `button "View details for <name>, <duration>,
  <window>"` on Summary, Tab reaches it and Enter/Space drill into Detail on the bar's date; on Detail, where
  nothing listens for a click, the same bar is `role="img"` with the same label and no pointer cursor.
  `history-review.draft.spec.ts` A1 is promoted from `fixme` to a real test)
- **Severity:** a11y
- **Where:** `StackedBarsChart` (`src/core/activityTracking/component/stackedBars/`), mounted by both
  `HistorySummaryView` and `HistoryDetailView` — the per-window bar segments render as unnamed `div`s
- **Expected:** Every interactive element needs an accessible name (PROMPT-TEMPLATE.md's own checklist, and
  general WAI-ARIA expectation) — these are the primary drill-down control on the Summary view.
- **Actual:** The accessibility snapshot shows each bar as `generic [ref=...] [cursor=pointer]` with no
  text content, `aria-label`, role, or title — confirmed across two loads (pre- and post-reseed), 25 and 42
  such elements respectively depending on window-size/range settings. They are fully clickable (confirmed —
  drilling into Detail works) but unaddressable by name for assistive tech or by role-based automation; this
  pass had to fall back to raw refs/`.bar-column`-style selectors to interact with them at all.
- **Evidence:** snapshot excerpts showing `generic [ref=f1e433] [cursor=pointer]` through `[ref=f1e483]` with
  no accessible name, on `/activity-history`.
- **Repro:** 1. Load `/activity-history`. 2. Tab to or inspect a stacked-bar column. 3. It has no accessible
  name.
- **Verify:** 1. Load `/activity-history`. 2. Inspect any bar segment. 3. **Pass condition:** it exposes a
  localized accessible name (e.g. "View <group> details for <window range>"), and clicking it still drills
  into Detail as before.
- **Suggested fix:** Add an `aria-label` per bar segment in `StackedBarsChart.vue`, built from the window's
  date/time range and dominant group — this also fixes the equivalent gap wherever else the component is
  mounted (`activityTracking` dashboards).

### A2. Calendar day cells have no accessible name
- **Status:** fixed and verified (code check 2026-09-24 — `CalendarGrid.vue`'s day-cell wrapper now carries
  `:aria-label="dayData ? dayCellLabel(dayData) : undefined"`, framework-level so day planner's calendar gets
  it too)
- **Severity:** a11y
- **Where:** `CalendarGrid.vue` (framework) day-cell slot, as consumed by `HistoryCalendarView.vue` via the
  `#day-cell-content` slot, on `/activity-history/calendar`
- **Expected:** Same as A1 — the day cell is the sole way to drill into a specific day from the calendar and
  needs an accessible name.
- **Actual:** The clickable day-cell wrapper renders as `generic [cursor=pointer]` with no accessible name in
  the snapshot; had to locate it by nearby visible date text and take the (occasionally wrong, see repro
  note below) neighbouring ref rather than addressing the cell itself by name.
- **Evidence:** snapshot excerpt for the 10 September cell, `generic [ref=f10e392] [cursor=pointer]` with no
  name; confirmed clickable (navigated to Detail on click).
- **Repro:** 1. Load `/activity-history/calendar`. 2. Inspect any day cell in the snapshot. 3. No accessible
  name.
- **Verify:** 1. Load `/activity-history/calendar`. 2. Inspect a day cell. 3. **Pass condition:** it exposes
  an accessible name naming the date (e.g. "View history for September 10, 2026"), and clicking it still
  navigates to `/activity-history/detail?date=...` as before.
- **Root cause guess:** Likely the same **[framework]** `CalendarGrid.vue` day-cell markup used by
  `dayPlanner`'s calendar too — worth checking whether that unit already flagged this, and batching if so.
- **Suggested fix:** Add an `aria-label` to the day-cell root in `CalendarGrid.vue`, generic enough to make
  sense for any consumer (day planner, history).

### P1. "View details for <name>" button doesn't show details — it toggles a cross-highlight filter
- **Status:** fixed and verified (2026-09-22, `F30` — the label now reads *"Highlight <name> in the chart"* /
  *"Zvýrazniť <name> v grafe"*, the card exposes `aria-pressed` that follows the selection, and Enter/Space
  toggle it the way a click does. Behaviour unchanged. `history-review.draft.spec.ts` P1 is promoted from
  `fixme` to a real test)
- **Severity:** polish
- **Where:** `HistorySummaryCard.vue` (accessible name "View details for {name}"), on `/activity-history`
  and `/activity-history/detail`'s Top Activities cards
- **Expected:** An accessible name starting "View details for X" implies opening a details view for X (a
  dialog, a navigation, an expansion). Plain sense: the name should describe what actually happens.
- **Actual:** Clicking the card adds/removes a `summary-card--selected` class and highlights the
  corresponding group in the adjacent pie chart — a cross-filter/selection toggle, not a details view. No
  navigation, no dialog, no expanded content.
- **Evidence:** `el.className` before/after click: `"...summary-card"` → `"...summary-card
  summary-card--selected"`; no URL change, no new content rendered.
- **Repro:** 1. Load `/activity-history` with populated Top Activities cards. 2. Click a card. 3. It
  highlights in the pie chart; nothing resembling "details" opens.
- **Verify:** 1. Same repro. 2. **Pass condition:** the accessible name matches the actual behaviour (e.g.
  "Highlight <name>" / "Filter to <name>"), or the behaviour is changed to actually show details — either
  resolves the mismatch.
- **Suggested fix:** Rename the accessible label (`i18n` key) to describe the highlight/filter behaviour
  rather than "view details."

### P2. Pie-chart legend text can overlap the donut when it doesn't fit the hole
- **Status:** fixed and verified (code check 2026-09-24, `F31` — `HistoryPieChart.vue` was rewritten to
  compute the legend layout from the measured container width in pixels rather than an in-hole percentage
  layout, with a side legend or a stacked/paged legend depending on available width; a details card now sits
  beside the donut instead of text inside it)
- **Severity:** polish
- **Where:** `HistoryPieChartSection.vue` / the shared pie-chart component, on `/activity-history/detail`
  (2-group day) and visible in a lighter form on `/activity-history` too
- **Expected:** Legend text inside a donut chart's centre should stay within the hole, or the chart should
  fall back to an external legend when entries don't fit.
- **Actual:** On a day with two groups ("Write Blog Post", "Desk Research"), the in-hole legend renders both
  names with percentages, and the first line's text visibly runs across the boundary into the coloured
  slice area rather than staying inside the hole.
- **Evidence:** `docs/views/history-review/screenshots/activity-history-detail--timeline-populated-en.png`
  (donut chart, centre-left).
- **Repro:** 1. Load `/activity-history/detail?date=2026-09-09` (2 groups on this seed). 2. Look at the pie
  chart's in-hole legend.
- **Verify:** 1. Same repro. 2. **Pass condition:** legend text stays fully inside the donut hole or moves
  external when it would overflow.
- **Suggested fix:** Cap the in-hole legend to a max width matching the hole's diameter, or switch to an
  external legend below/beside the chart once entry count/name length exceeds a threshold.

### P3. HistoryCalendarView has no page heading, unlike its two sibling views
- **Status:** fixed and verified (code check 2026-09-24 — `HistoryCalendarView.vue` now renders
  `<h1 class="text-h4">{{ $t('history.calendar.title') }}</h1>` in the header row, matching the sibling views)
- **Severity:** polish
- **Where:** `src/core/activityHistory/view/HistoryCalendarView.vue`, on `/activity-history/calendar`
- **Expected:** Consistency with sibling views — `HistorySummaryView` renders `<h1>Activity History</h1>`
  and `HistoryDetailView` renders `<h1>History Detail</h1>`; a user moving between the three views loses a
  visible orientation cue on Calendar alone.
- **Actual:** `document.querySelector('h1')` returns `null` on `/activity-history/calendar` — the view opens
  straight into the Mode/Month/Year/Days-to-show control row with no heading above it.
- **Evidence:** `eval "!!document.querySelector('h1')"` → `false`, confirmed on a clean load.
- **Repro:** 1. Load `/activity-history/calendar`. 2. Compare against `/activity-history` and
  `/activity-history/detail`, both of which show a heading in the same position.
- **Verify:** 1. Load `/activity-history/calendar`. 2. **Pass condition:** an `<h1>` matching the sibling
  views' pattern (e.g. "Calendar" or the existing `history.calendar.*` namespace's title key, if one exists)
  is present above the Mode/Month/Year row.
- **Suggested fix:** Add the same header row pattern (`<h1>{{ $t('history.calendar.title') }}</h1>`, with a
  matching locale key) that the other two views already use.

### U1. First-run / all-empty states on Calendar and Summary not independently exercised
- **Status:** fixed and verified (2026-09-24, browser check via `playwright-cli`). Two branches confirmed
  live:
  1. **All-days-empty, account has history elsewhere** (`hasAnyHistoryEver === true`) — signed in as the
     seed's primary user (`test@example.com`), pointed Calendar at year 2020 and Summary at
     `date=2020-01-15`. Both rendered the plain empty state ("No activity recorded in the visible range." /
     "No data for this period", `15.01.2020`), not the first-run onboarding block — correct, since that
     account has real history in 2026.
  2. **Genuinely never recorded anything** (`hasAnyHistoryEver === false`) — signed in as the seed's admin
     account (`admin@example.com`, zero activity history rows) and loaded both `/activity-history/calendar`
     and `/activity-history`. Both rendered `HistoryFirstRunState`: "No activity recorded yet — Log something
     you already did, or start a timer for what you're doing now." with working "Log manually" /
     "Start a timer" links. Calendar's day grid still rendered every day cell as "No activity" underneath the
     banner, as designed.
  Both branches behave as H7 specifies. **Detail's** three-panel empty state (a genuinely history-free day,
  `date=2026-09-07`) was already confirmed live in the original pass and matches H7's stated design.
- **Severity:** unverified (resolved)
- **Where:** `HistoryFirstRunState` / `HistoryEmptyState`, as wired into `HistoryCalendarView.vue:3-13` and
  (by shared composable) `HistorySummaryView.vue`
- **What verified it:** Original pass only had the primary/secondary seed accounts on hand, which always
  carry history in the months/weeks viewed, so the two branches above were confirmed by code read only. This
  check used the seed's admin account (zero history) for the first-run branch and a 2020 date range on the
  primary account for the plain-empty branch, closing the gap live.

### U2. H1's null-wake-up-time fix not exercised against a live null value
- **Status:** resolved — moot (code check 2026-09-24). `CalendarActivityDaySummary.ts:18-24` now carries a
  `B2` comment stating `wakeUpTime`/`bedTime` are **never** null — non-nullable backend column, constructed
  unconditionally, no code path emits null for either. The `git log` on the file shows a `fix(...): apply B2
  nullability audit` commit after the original H1 fix. The premise this finding asked to verify (a live null
  value reaching the client) can no longer occur, so there is nothing left to exercise; the "not recorded"
  case is now represented by the backend's `08:00`/`00:00` defaults instead, per the same comment.
- **Severity:** unverified
- **Where:** `src/core/historyDashboard/dto/response/CalendarActivityDaySummary.ts:37-38`,
  `HistoryCalendarView.vue:13-24`
- **What would verify it:** H1 fixed a crash where a day with no sleep record (`wakeUpTime`/`bedTime` both
  or partially null) threw inside `Time.fromJson` and blanked the whole month. Every day cell visible in
  this pass's seed data carried a non-null `08:00 - 00:00` wake/bed row, so the null-safe path (`Time | null`,
  independent rendering per H1's fix) was read in code but never exercised live. A seed row with a missing
  sleep record would be needed to confirm the fix on screen rather than by source inspection alone.
