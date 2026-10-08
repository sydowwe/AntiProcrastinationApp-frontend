# history-review — findings

> Pass: inventory · captured 2026-09-14 · commit `adc9c67f`

**Tally:** blocker 0 · bug 3 · a11y 0 · polish 1 · opportunity 0 · unverified 0 (open entries only: B5, B6, B7, P4.
Everything earlier is closed: B1-B4, A1-A2, P1-P3 fixed and verified in code; U1 and U2 verified/resolved)

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-14 | `adc9c67f` | initial inventory pass |
| 2 | 2026-09-24 | (code check, no commit) | B1-B3, A2, P2-P3 confirmed fixed in code; U2 confirmed resolved by backend B2 nullability audit |
| 3 | 2026-09-24 | (browser check, no commit) | U1 closed — both the plain-empty and genuine first-run branches confirmed live on Calendar and Summary |
| 4 | 2026-09-25 | `d423edcc` | **retest round** — 6 retested live: B1, B2, B3, A2, P2, P3 pass; none reopened; none blocked. Account(s): primaryUser (`e2e/.state/auth-10001.json`). Mutations made and reverted: B2's `**/api/activity-history/dashboard/detail/pie-chart` route (500), unrouted and reload confirmed recovery — no residue. No regressions seen outside the Verify blocks. |
| 5 | 2026-10-06 | `27dd210b` | **x4 narrow viewport (390×844)** — 3 views checked; new: B5, B6, B7, P4. Calendar's header/toolbar defect is the framework `CalendarGrid` one already filed as `planner-day` P3; `/activity-history/calendar` was added to its **Where** rather than filed again. |

---

### B1. The period-total banner renders clipped to ~2 illegible characters in Summary's Top Activities panel
- **Status:** fixed and verified (retest 2026-09-25, live) — at 1440×900 on `/activity-history` (default
  week range, `baseline=last7days`) the alert renders full text "Period total: 19h 7m vs previous: 7h 16m
  +163.1%" on one line, unclipped; element screenshot confirms
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
- **Status:** fixed and verified (retest 2026-09-25, live) — routed `**/api/activity-history/dashboard/detail/pie-chart`
  to 500, reloaded `/activity-history/detail?date=2026-09-23`: pie panel showed "Failed to load" + a "Retry"
  button, no "No data" text present; unrouted and reloaded, panel recovered with no error state left over
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
- **Status:** fixed and verified (retest 2026-09-25, live) — `/activity-history/detail?date=2026-09-23`
  breadcrumb reads "Home › Summary › History Detail" (`.v-breadcrumbs` textContent
  `"HomeSummaryHistory Detail"`); `/activity-history` itself still reads plain "Home › Summary"
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
- **Status:** fixed and verified (retest 2026-09-25, live) — `/activity-history/calendar` day cells expose
  aria-labels like "Wednesday, September 23, 2026"; `getByLabel('Wednesday, September 23, 2026').click()`
  navigated to `/activity-history/detail?date=2026-09-23` as expected
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
- **Status:** fixed and verified (retest 2026-09-25, live) — `/activity-history/detail?date=2026-09-23`
  (7-group day) at 1440×900 renders the legend in an external box beside the donut, fully inside its own
  panel, no text crossing into the slice area. Screenshot:
  `docs/views/history-review/screenshots/retest-2026-09-25-P2-full.png`
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
- **Status:** fixed and verified (retest 2026-09-25, live) — `document.querySelector('h1')?.textContent`
  on `/activity-history/calendar` returns "History Calendar", present above the Mode/Month/Year row
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

### B5. The stacked-bar chart collapses to a 4 px strip on Summary and Detail: no bars, the legend pushed out of the card, time-range controls clipped (390 px)
- **Status:** open
- **Severity:** bug
- **Where:** @390×844 · `/activity-history` and `/activity-history/detail?view=stackedBars` → `src/core/activityTracking/component/stackedBars/StackedBarsChart.vue:3-30` (header row `d-flex align-center ga-5`, no `flex-wrap`). The component belongs to `activityTracking` and is imported by both history views, which size it as `flex-fill` with `min-height: 200px` (`HistorySummaryView.vue:45-46`, `HistoryDetailView.vue:103-104`). The four activity-tracking dashboards mount the same component without that cap, and `tracking-dashboards` B4 measured their columns at 422 px tall, so the collapse is history-side. Their header and legend layout is the same code, though. Also broken at 768×1024.
- **Expected:** at phone width the chart still shows its bars, which are the view's main visual and the only way to drill from Summary into a day (plain sense; `inventory.md` → "Stacked-bar columns … drills into a day").
- **Actual:** the header puts the Window select, the `#header-right` slot (Summary's "Day from" `TimeRangePicker`) and the legend on one non-wrapping line that's 773 px wide. The 8-item legend wraps into a 133×229 column at x 648–781, entirely outside the card (8–382, `overflow: hidden`). The header's 229 px height fills the 200 px card, so `.stacked-bars-container` gets **4 px** (y 597–601): no bars render. On Summary the TimeRangePicker's steppers at x 422–628 are clipped and can't be reached. On Detail (no header slot) the legend fits inside the card but still takes its height, and the plot is again 4 px. At 768 px: plot 4 px tall, legend 648–781 past a card ending at 760.
- **Evidence:** `docs/views/history-review/screenshots/activity-history--mobile.png` (blank card, "h —" stepper cut off), `activity-history-detail-bars--mobile.png` (legend, no bars). `eval`: `.stacked-bars-container` → `8-382 y597-601 374x4`, `div.legend` → `648-781 y356-585`, header slot buttons at `422-470`, `478-526`, `580-628`.
- **Repro:** 1. `resize 390 844`, open `/activity-history`. 2. Look at the card under Export: a blank area and the Window/Day-from row, no bars. 3. `eval` `document.querySelector('.stacked-bars-container').getBoundingClientRect().height` → 4.
- **Verify:** 1. `playwright-cli resize 390 844`, then `reload` on `/activity-history`. 2. `eval` `[...document.querySelectorAll('.stacked-bars-container, div.legend')].map(e => e.getBoundingClientRect())`. 3. **Pass condition:** the container is at least 150 px tall, the legend's `right` is ≤ the card's `right`, and every `button` inside the chart card has `right <= 390`. 4. Repeat on `/activity-history/detail?date=2026-10-02&view=stackedBars`: same container check.
- **Root cause guess:** two things together. The header row can't wrap, so the legend grows taller rather than dropping to its own line. And the history views give the card `flex-fill` + `min-height: 200px`: on a phone the column is taller than the screen, so `flex-fill` adds nothing, and the card stays at its 200 px minimum, which the 229 px header fills.
- **Suggested fix:** give the header `flex-wrap`, and below `md` move the legend into its own full-width row under the plot (or behind a toggle). Also give the plot a `min-height` so the header can't squeeze it to zero.

### B6. Long-titled timeline cards on Detail push their "More actions" menu past the panel edge — reachable only by an unmarked sideways swipe (390 px)
- **Status:** open
- **Severity:** bug
- **Where:** @390×844 · `/activity-history/detail` (timeline view) → `src/core/activityHistory/component/HistoryRecordItem.vue:34-37` (`VCard class="flex-1-0"` and a title row `d-flex align-center` holding `VCardTitle` + role `VChip`, no wrap). Clipping container: `src/core/historyDashboard/component/HistoryTimeline.vue:3` (`flex-fill mx-3 overflow-y-auto`, which makes `overflow-x` `auto` as well).
- **Expected:** each record's ⋮ (Edit/Delete) is on screen in the list as rendered. It's the only entry point for editing or deleting a record from this view (plain sense; `inventory.md` → Timeline "overflow menu").
- **Actual:** on 2026-10-02, four of seven cards are wider than their column. "Morning Exercise" + "Health & Fitness" is 88–413, "Grocery Shopping" 88–421, "Meal Preparation" 88–414, "Feature Development" 88–397. The panel clips at x 366, so their ⋮ buttons (365–405, 373–413, 366–406, 349–389) are fully or mostly hidden, and the role chip runs into the cut edge. The panel scrolls sideways (`scrollWidth` 397 vs 342), which reveals the ⋮ but cuts off the time column on the left. Nothing hints that the list scrolls sideways, and short-titled cards (e.g. "Desk Research", 88–358) look complete. The menu itself fits once open (191–310).
- **Evidence:** `docs/views/history-review/screenshots/activity-history-detail--mobile.png` (Morning Exercise card cut at the edge), `activity-history-detail-cards--mobile.png` (after the sideways scroll: ⋮ visible, time column cut). `eval` per card: `menu 365-405 … clip flex-fill.mx-3 24-366`.
- **Repro:** 1. `resize 390 844`, open `/activity-history/detail?date=2026-10-02&view=timeline`. 2. Scroll the timeline panel down to "Morning Exercise". 3. Its ⋮ isn't visible, and the "Health & Fitness" chip is cut at the right edge.
- **Verify:** 1. `playwright-cli resize 390 844`, then `reload` on `/activity-history/detail?date=2026-10-02&view=timeline`. 2. `eval` `(p => [p.scrollWidth, p.clientWidth])(document.querySelector('main .flex-fill.mx-3'))`. 3. **Pass condition:** the two are equal, and every `button[aria-label^="More actions"]` has `right <=` the panel's `right` (366).
- **Root cause guess:** `flex-1-0` is `flex: 1 0 auto`, so the card can't shrink below its content, and a nowrap `VCardTitle` next to a chip sets that content width. Vertical-only scrolling was intended, and `overflow-y-auto` brings `overflow-x: auto` with it.
- **Suggested fix:** use `flex-1-1` with `min-width: 0` on the card, let the title row wrap (chip under the title below `sm`), and set `overflow-x: hidden` on the timeline panel.

### B7. The pie chart is squeezed to 134 px beside "Period Totals", and its legend names are cut to 0–2 letters (390 px)
- **Status:** open
- **Severity:** bug
- **Where:** @390×844 · `/activity-history` and `/activity-history/detail` → `src/core/historyDashboard/component/pieChart/HistoryPieChartSection.vue:28-41` (`d-flex ga-2` with the pie `flex-fill`/`min-width: 0` beside a details card with `min-width: 200px; max-width: 250px`, no breakpoint). The Home widget mounts `HistoryPieChart` without this section and rendered no canvas on 2026-10-06, so `/` isn't affected as far as this pass could see.
- **Expected:** the legend is the only key from slice colour to activity name on a touch screen, so its names have to be readable (plain sense). The desktop fix for legend overlap (P2) kept the legend readable at desktop width.
- **Actual:** the section is 342 px wide, the details card takes 200, and the pie canvas gets 134×330. `HistoryPieChart` therefore uses its stacked layout and truncates each legend label to the remaining text width. On Summary the labels read "F… (26.6%)", "D… (18.3%)", "M… (15.3%)", paged "1/2" behind ~14 px canvas arrows. On Detail some read "F (33.2%)" and some just "(17.6%)", with no name at all. Meanwhile "Period Totals" shows three short rows in a 200×330 card that's mostly empty.
- **Evidence:** `docs/views/history-review/screenshots/activity-history-pie--mobile.png` (Summary), `activity-history-detail-cards--mobile.png` (Detail, bottom). `eval`: `flex-fill 24-158 … 134x330`, details card `166-366 … 200x330`.
- **Repro:** 1. `resize 390 844`, open `/activity-history`. 2. Scroll to the bottom card. 3. Read the legend.
- **Verify:** 1. `playwright-cli resize 390 844`, then `reload` on `/activity-history`. 2. `eval` `document.querySelector('main canvas').getBoundingClientRect().width`. 3. **Pass condition:** the canvas is ≥ 300 px wide (the pie and the details card stack below `sm`), and in the read-back screenshot every visible legend entry shows at least the first word of its activity name. 4. Same on `/activity-history/detail?date=2026-10-02`.
- **Root cause guess:** a side-by-side row with a fixed-width sibling and no breakpoint. Related to P2 (the legend/donut overlap fixed for desktop) in the same component pair, but a different mechanism. `tracking-dashboards` B3 is the same shape (a pie card that keeps its desktop row on a phone) in `activityTracking`'s own pie component.
- **Suggested fix:** `flex-column flex-sm-row` on the row in `HistoryPieChartSection.vue:28`, and drop the details card's `min-width` when stacked.

### P4. The period-total banner is wider than the screen, cutting off its %-change chip and making the page pan sideways (390 px)
- **Status:** fixed 2026-10-08 (`F93`: the inner row wraps and `.myAlert` is `max-width: 100%`. At 390 on `/activity-history` the
  banner is 8–382 (≤ 386), two lines tall with the chip wrapped onto the second, and the scroller is 390/390. `/detail`: 16–372. At 1280
  and 1440 it is the same one-line 296–726 banner as before, so `B1` holds)
- **Severity:** polish
- **Where:** @390×844 · `/activity-history` and `/activity-history/detail` (Top Activities panel) → `src/core/historyDashboard/component/summaryCards/HistoryPeriodBanner.vue:11` (inner `d-flex align-center ga-1`, no wrap) together with `:72-74` (`.myAlert { flex: 0 0 auto }`, the B1 fix). Fine at 768×1024, where the 416 px banner fits.
- **Expected:** the banner fits the panel width and wraps its text, so the change chip stays readable (plain sense; B1's own Verify asked for the banner to be legible).
- **Actual:** the banner measures 4–420 on both views. The "+163.1%" chip (Summary, `344-404`) is cut at the screen edge, and `main .v-container` scrolls 420/390, so the whole Summary page pans 30 px sideways. B1 fixed the desktop case, where the alert was squeezed to two characters, by sizing the alert to its content. At 390 px that content (label, two totals, "vs previous:", chip) is ~416 px on one line.
- **Evidence:** `docs/views/history-review/screenshots/activity-history-lower--mobile.png`. `eval`: `.v-alert … 4-420 … chip 344-404`, container `420/390`. On Detail the overflow script lists `div.v-alert … text-success → 420`.
- **Repro:** 1. `resize 390 844`, open `/activity-history`. 2. Scroll to "Top Activities". 3. The banner's chip runs off the right edge.
- **Verify:** 1. `playwright-cli resize 390 844`, then `reload` on `/activity-history`. 2. `eval` `document.querySelector('main .v-alert').getBoundingClientRect().right` and `(c => [c.scrollWidth, c.clientWidth])(document.querySelector('main .v-container'))`. 3. **Pass condition:** the alert's `right` ≤ 386 and the container numbers are equal. Then check at 1280 px that the banner is still not clipped (B1 must not regress).
- **Root cause guess:** B1's fix (content-width basis) is correct for the wrapping parent row, but the alert's inner row can't wrap, so its content width is fixed at one line.
- **Suggested fix:** add `flex-wrap` to the inner row (and `max-width: 100%` on `.myAlert`), so the comparison and chip drop to a second line below ~420 px.
