# tracking-dashboards — findings

> Pass: inventory · captured 2026-09-14 · commit `6aac48bb`

**Tally:** blocker 0 · bug 6 (B1, B2 fixed; B3, B4, B5, B6 open) · a11y 2 (A1, A2 fixed) · polish 2 (P1, P2 open) ·
opportunity 0 · unverified 1 (U1 verified) — 11 entries, 6 open

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-14 | `6aac48bb` | initial inventory pass |
| 2 | 2026-09-24 | (working tree) | code check: B1, B2, A2 confirmed fixed in code; U1 verified live via `playwright-cli` route mocking — all findings closed |
| 3 | 2026-09-25 | `d423edcc` | **retest round** — 3 retested live: B1, B2, A2 pass. Account: primaryUser. Mutations made and reverted: none (date-range radio and `?selected` are URL state only; Android Spotify selection deselected via Close details before moving on). Regressions seen outside the Verify blocks: none. |
| 4 | 2026-10-06 | `27dd210b` | **x4 narrow viewport (390×844)** — 4 views checked; new: B3, B4, B5, P1, P2. Also new, filed afterwards at the owner's request as a desktop defect (reproduces at 1440×900): B6, the unified Sources card squashed to 26 px with its chips unhittable. |

---

### B1. Web dashboard's domain-detail close button renders no icon — wrong icon set (`mdi-*` in a FontAwesome-only app)
- **Status:** fixed and verified (retest 2026-09-25, live) — `/activity-tracking`, opened the github.com detail panel; close button renders `fa-xmark` SVG (`data-icon="xmark"`, `data-prefix="fas"`) and exposes name "Close details"; console clean (0 errors, 0 info) — no "Could not find one or more icon(s)".
- **Severity:** bug
- **Where:** `src/core/activityTracking/component/pieChart/ActivityDetailsPanel.vue:7` — the close button
  shown when a domain is selected on `/activity-tracking`
- **Expected:** CLAUDE.md: "ICONS FontAwesome 7". Every other close button in this same module
  (`DesktopProcessDetailsPanel.vue:6`, `unified/UnifiedPieChartSection.vue:71`) uses `icon="fas fa-xmark"` and
  renders correctly.
- **Actual:** `ActivityDetailsPanel.vue` uses `icon="mdi-close"` — a Material Design Icons name, which the
  FontAwesome Vue component cannot resolve. The button renders with an empty `<i class="v-icon">` (no visible
  glyph) and the console logs `Could not find one or more icon(s) {prefix: fas, iconName: mdi-close}`. The
  button is still clickable and carries `aria-label="Close domain details"`, so it is not a total dead end,
  but a sighted user sees a blank square where a close icon should be.
- **Evidence:** Console error captured on `/activity-tracking?selected=github.com`; DOM inspection of the
  button's `innerHTML` shows an empty `<i>` with no child SVG; source read confirms the prop value.
- **Repro:** 1. Go to `/activity-tracking`. 2. Click any Top Domains card (e.g. "View details for github.com").
  3. Look at the top-right of the opened detail panel, or check the console.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** the close button renders a visible X/close glyph and
  the console logs no `Could not find one or more icon(s)` error.
- **Root cause guess:** This is exactly the "diverge for no apparent reason" pattern the three dashboards are
  prone to (R2's premise) — `DesktopProcessDetailsPanel.vue` and `UnifiedPieChartSection.vue` got the icon
  right, `ActivityDetailsPanel.vue` (the oldest of the three, web-extension) did not.
- **Suggested fix:** Change `icon="mdi-close"` to `icon="fas fa-xmark"` on `ActivityDetailsPanel.vue:7`.

### B2. Android dashboard's app selection opens no detail panel — Web and Desktop both do
- **Status:** fixed and verified (retest 2026-09-25, live) — `/activity-tracking/android`, selected Spotify; side panel replaced the summary card with `GET /api/activity-tracking/android/app-details?packageName=com.spotify.music&...` (200) showing Total 3h 30m, Share of period 32.4%, Package, **and** Sessions: 6, Average/Longest session, First/Last use, By-day breakdown — the original, un-narrowed pass condition holds (active seconds + session count both present), via the endpoint backend `B23` shipped (§18, API `c00e64d`; frontend `c2075f61` with `F47`). Close details cleared `?selected` and the panel.
- **Severity:** bug
- **Where:** `src/core/activityTracking/component/android/AndroidPieChartSection.vue` (whole component) vs.
  `pieChart/ActivityPieChartSection.vue` (web) and `desktop/DesktopPieChartSection.vue` (desktop)
- **Expected:** All three per-source dashboards share the same interaction model up to this point — clicking a
  summary card or pie slice selects an item (`?selected=`, a highlighted pie slice, a bordered card). On Web
  and Desktop that selection also opens a detail panel: Web shows the domain's Active/Background split plus
  its page list from data already on the page; Desktop fires a dedicated `process-details` request for a
  window-title breakdown. The unit brief's own premise (R2/U4) is that the three dashboards are expected to
  diverge in what they track, not in whether "select an item" does anything.
- **Actual:** Clicking an app card or pie slice on `/activity-tracking/android` sets `?selected=<app>`,
  highlights the pie slice and borders the card — and stops there. The panel beside the pie chart stays the
  fixed "Total time / Apps / Sessions" summary, unchanged before and after selection. Confirmed via network
  that selecting an app fires **zero** requests (Desktop's equivalent click fires
  `GET .../desktop/process-details`).
- **Evidence:** `screenshots/android--app-selected.png` (Spotify selected, right panel unchanged from
  `screenshots/android--default.png`'s panel); `playwright-cli requests` showed no new request between the two
  states; source read of `AndroidPieChartSection.vue` confirms the right-hand panel's markup has no branch on
  `selectedAppLabel` at all.
- **Repro:** 1. Go to `/activity-tracking/android`. 2. Note the Total/Apps/Sessions panel beside the pie chart.
  3. Click any Top Apps card. 4. Compare the panel — identical.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** selecting an app changes the side panel to show that
  app's own detail (at minimum its active seconds and session count, matching what `AndroidAppSummaryDto`
  already carries client-side — no new endpoint is obviously required for at least a Web-style local detail).
- **Root cause guess:** Android's pie-chart section was likely built by copying the simpler of the two
  existing patterns and never wired the selection branch, rather than a deliberate simplification — the data
  needed for at least a basic breakdown (per-app active seconds, session count) already reaches the client in
  the same `pie-chart`/`summary-cards` responses the other two panels consume locally.
- **Suggested fix:** Add a domain-detail-style branch to `AndroidPieChartSection.vue` using the already-fetched
  `apps` prop, mirroring `ActivityPieChartSection.vue`'s `selectedDomainDetails` computed rather than
  Desktop's extra fetch (Android's `AndroidAppPieData` likely has no window-title equivalent to fetch).

### A1. Date-range and source-filter chips are focusable but expose no accessible role or state
- **Status:** fixed and verified (2026-09-22, `F49` — roles and states are set through attrs at the call
  sites: the presets are `radiogroup "Date range"` of `radio` chips with `aria-checked`, the source chips are
  `button`s with `aria-pressed` that flips on click. Arrow keys do not move the radio selection — Tab reaches
  every chip and Enter/Space are Vuetify's — which is a known, accepted partial pattern.
  `tracking-dashboards.draft.spec.ts` A1 is promoted from `fixme` to a real test)
- **Severity:** a11y
- **Where:** `src/core/activityTracking/component/ActivityRangePicker.vue:13-28` (`VChip` inside
  `VChipGroup`, the Today/Last 7 days/This week/Last 30 days/Custom row on all four dashboards) **and**
  `src/core/activityTracking/component/unified/ActivitySourceFilter.vue:31-48` (bare `VChip`s, the
  Browser/Desktop/Phone toggles on `/activity-tracking/unified`) — same gap, two components.
- **Expected:** An interactive, keyboard-focusable control needs an accessible role/name/state so assistive
  tech can announce it as selectable and report whether it is currently active, per the same standard the
  shell pass already applied to the sidebar toggle (`_shell/inventory.md` A2).
- **Actual:** Both chip sets render as `<span class="v-chip ..." tabindex="0">` with `role: null` and no
  `aria-label`/`aria-pressed`/`aria-checked`. They are reachable by Tab and clickable, but a screen reader has
  nothing to announce beyond the plain text content, no indication of group membership, and — for the source
  filter specifically — no way to tell a selected (tonal, coloured) chip from a deselected (outlined, muted)
  one without seeing the colour.
- **Evidence:** `playwright-cli eval` attribute dump on the "Today" chip:
  `{"tag":"SPAN","role":null,"tabindex":"0","ariaLabel":null}`; same dump on the "Browser 1h 22m" source chip:
  `{"text":"Browser 1h 22m","role":null,"tabindex":"0","ariaPressed":null}`.
- **Repro:** 1. Go to `/activity-tracking`. 2. Inspect the "Today" chip's DOM node (or tab to it and check
  `document.activeElement`). 3. Note the missing `role`/`aria-label`. 4. Go to `/activity-tracking/unified`,
  repeat on the "Browser" chip.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** each chip exposes a role (e.g. `radio`/`option`) or
  an `aria-label` naming it, and the source chips additionally expose their on/off state (`aria-pressed` or
  equivalent) so a screen reader user can tell which sources are currently included.
- **Root cause guess:** Likely Vuetify's `VChip`/`VChipGroup` default rendering (no ARIA wiring applied at
  either call site) rather than anything specific to this module — worth checking whether other `VChipGroup`/
  `VChip` usages in `_common` have the same gap before treating this as app-only.
- **Suggested fix:** Either pass Vuetify's chip-group selection semantics explicitly, or wrap with
  `role="radiogroup"`/`role="radio"` (range picker) and `aria-pressed` (source filter) at these call sites.

### A2. Desktop process-detail panel's close button has no accessible name at all
- **Status:** fixed and verified (retest 2026-09-25, live) — `/activity-tracking/desktop`, opened the JetBrains Rider detail panel; `getByRole('button', { name: 'Close details' })` resolves inside the panel, `aria-label` = "Close details".
- **Severity:** a11y
- **Where:** `src/core/activityTracking/component/desktop/DesktopProcessDetailsPanel.vue:5-11` — the close
  `VBtn` in the panel opened by selecting a process on `/activity-tracking/desktop`
- **Expected:** Every icon-only control needs an accessible name (text, `aria-label`, or `title`) — the same
  rule the shell pass applied to the sidebar toggle, and the one this module's own `ActivityDetailsPanel.vue`
  (web dashboard) already follows: its close button carries
  `:aria-label="$t('activityTracking.pieChart.closeDomainDetails')"`.
- **Actual:** `DesktopProcessDetailsPanel.vue`'s `VBtn` has `icon="fas fa-xmark"` (the icon itself renders
  correctly, unlike B1) but no `aria-label`, no `title`, and no visible text. `document.activeElement`/DOM
  inspection of the live button confirms `aria-label: null`, `title: null`.
- **Evidence:** `playwright-cli eval` on the detail panel's close button after selecting "JetBrains Rider" on
  `/activity-tracking/desktop`: `{"hasBtn":true,"ariaLabel":null}`; source read confirms no `aria-label` prop
  is passed. Screenshot: `screenshots/desktop--process-detail-panel2.png`.
- **Repro:** 1. Go to `/activity-tracking/desktop`. 2. Click any Top Processes card. 3. Inspect the "✕" button
  at the top-right of the opened detail panel.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** the button exposes an `aria-label` (or equivalent)
  naming it as closing the process details.
- **Root cause guess:** Same family as B1 — the three pie-chart-detail panels (web/desktop/unified) were each
  built slightly differently; web got the label right but the wrong icon, desktop got the icon right but no
  label. Worth fixing both in the same pass and checking `unified/UnifiedPieChartSection.vue`'s close button
  for the same gap while there.
- **Suggested fix:** Add `:aria-label="$t('activityTracking.pieChart.closeProcessDetails')"` (or reuse the
  existing `closeDomainDetails` key) to the `VBtn` at `DesktopProcessDetailsPanel.vue:5`.

### U1. Loading and error states for the four dashboard panels not exercised live
- **Status:** verified (2026-09-24) — exercised live on `/activity-tracking` (web) with `playwright-cli route`
  mocking of `**/activity-tracking/web-extension/**`:
  - **Loading:** delayed all five panel endpoints by 20s and captured the page mid-flight — 11
    `.v-skeleton-loader` elements rendered across the Timeline, Shape of the day, Top Domains and side-panel
    cards (screenshot confirmed visually).
  - **Error:** forced all five endpoints to `500` — each of the five panels independently rendered its own
    "Failed to load" + Retry block (no shared/global error state).
  - **Retry scoping:** with `summary-cards` mocked to succeed and the other four still forced to fail, clicking
    the Top Domains panel's Retry button fired exactly one new request (`summary-cards` → 200) and left the
    other four panels' requests untouched — confirms retry is scoped per-panel, not global.
  - Not covered: Desktop/Android/Unified dashboards specifically (same composable/pattern, not spot-checked
    individually this round).
- **Severity:** unverified
- **Where:** `useActivityDashboard.ts` loading/error refs, rendered by `StackedBarsChart.vue`,
  `ActivityTimeline`, `ActivitySummaryCards.vue`, pie-chart sections, `ActivityFocusStrip.vue`

### B3. The pie card keeps its desktop row on a phone: the donut is cut in half, and the selection's detail panel and its Close button are off the card (390 px)
- **Status:** open
- **Severity:** bug
- **Where:** @390×844 · `src/core/activityTracking/component/pieChart/ActivityPieChart.vue:219-222` (`.chart { width: 470px }`)
  and `:158` (`center: ['115%', '42%']`), inside the non-wrapping `d-flex ga-2` row of `ActivityPieChartSection.vue:49`,
  `DesktopPieChartSection.vue:47`, `AndroidPieChartSection.vue:47` and `UnifiedPieChartSection.vue:50`. All four dashboards:
  `/activity-tracking`, `/activity-tracking/unified`, `/activity-tracking/desktop`, `/activity-tracking/android`.
- **Expected:** the side panel is the readout for the pie: Day Total, the selected item's split, Desktop's window titles and
  Android's session stats. B2 and A2 were fixed to make that panel work, so it should be readable on a phone too (plain sense; WCAG 1.4.10 reflow).
- **Actual:** the canvas is 470 px wide, but the card's content box is 342 px, and the card is `overflow: hidden` (the comment at
  `ActivityPieChartSection.vue:61-62` relies on that). `.chart-column` spans x 24–494, and the panel `.flex-fill` spans 502–626 (web),
  502–648 (unified, desktop) or 502–603 (android), all outside the clip. Nothing a user can do scrolls it into view. With an item selected,
  **Close details** sits at x 607 (web), 633 (desktop) and 650 (android). Desktop's "Window titles:" list starts at x 517. The donut's
  right half is cut at the card edge. Only the web view's full-width `DomainDetailsList`, under the row, stays readable. Deselecting
  still works by tapping the card or the slice again, so nothing gets stuck selected, but the selection shows nothing.
- **Evidence:** `docs/views/tracking-dashboards/screenshots/activity-tracking-pie--mobile.png`. `eval`: canvas `[470, 470]` vs card
  `clientWidth` 382. Rects for the panel and the close button as above. Console clean.
- **Repro:** 1. `resize 390 844`, open `/activity-tracking?date=<seedDate>`. 2. Scroll to the pie card. 3. Tap the github.com
  card. 4. Look for github.com's Total/Active/Background and the close icon.
- **Verify:** 1. `playwright-cli resize 390 844`, then `reload` on `/activity-tracking?date=<seedDate>&selected=github.com`.
  2. `eval` the `getBoundingClientRect()` of `[aria-label="Close details"]` and the width of `.chart canvas`. 3. **Pass condition:**
  the button's `right <= innerWidth`, `elementFromPoint` at its centre is the button, and the canvas is no wider than its card's
  `clientWidth`. 4. Repeat on `/activity-tracking/desktop` (tap JetBrains Rider) and `/activity-tracking/android` (tap Spotify).
- **Root cause guess:** a fixed px chart width in a row that never wraps, the same in all four sections. The Close button is
  also 20×20, under WCAG 2.5.8's 24 px. That's the same at desktop width, so it isn't filed here, but it's worth fixing in the same change.
- **Suggested fix:** `.chart { width: 100%; max-width: 470px }`, plus `flex-wrap` on the row (or `flex-column` below `md`) so the
  panel drops under the chart. Move the pie off the hardcoded `115%` centre.

### B4. The sticky dashboard header pins 269–377 px under the app bar, leaving a phone under 60% of the screen for the data (390 px)
- **Status:** open
- **Severity:** bug
- **Where:** @390×844 · `src/core/activityTracking/component/ActivityDashboardHeader.vue:2-5` (`position: sticky; top: 0;
  z-index: 1000`). All four dashboards.
- **Expected:** a pinned filter bar stays bar-sized. On a phone it should collapse into a summary that opens the controls, or stop
  being sticky (plain sense; the group file asks whether the filter bar "fits, or collapses into something reachable").
- **Actual:** the header wraps to six rows: title, preset chips, Mode + Date from/Date to (Custom only), Start, h/min, Stacked
  bars/Timeline. It measures **269 px** with a preset (32% of 844) and **377 px** with Custom (45%). With the 64 px app bar, 333–441 px
  stay pinned, which leaves 403–511 px for content, and every panel slides underneath. The stacked-bars columns alone are 422 px tall.
- **Evidence:** `docs/views/tracking-dashboards/screenshots/activity-tracking-timeline-scrolled--mobile.png` (the timeline card
  scrolled under the header). `eval` on the sticky div: `{ top: 64, h: 377, pct: 45 }` with `?date=…` (Custom), and
  `{ top: 84, h: 269, pct: 32 }` on a bare `/activity-tracking` (Today).
- **Repro:** 1. `resize 390 844`, open `/activity-tracking?date=<seedDate>`. 2. Scroll the page down.
- **Verify:** 1. `playwright-cli resize 390 844`, then `reload` on `/activity-tracking?date=<seedDate>`. 2. Scroll `.v-main .v-container` to
  `scrollTop = 600`. 3. **Pass condition:** whatever header is still pinned is ≤ 120 px tall
  (`getBoundingClientRect().height` on the element with `position: sticky`), or nothing is sticky. The date and time controls are
  still reachable, directly or through one tap.
- **Suggested fix:** below `md`, use `position: static`, or collapse range, time and view behind one summary chip ("5 Oct · 07:00–24:00 ·
  Timeline") that opens a bottom sheet.

### B5. The timeline squeezes sessions to 6–23 px at phone width: bars become slivers and labels read "J…" (390 px)
- **Status:** open
- **Severity:** bug
- **Where:** @390×844 · `src/core/activityTracking/component/timeline/TimelineGrid.vue:146` (`GAP_COLUMN_WIDTH = 48`), `:250`
  (`min-width: 600px`), `calculateSegmentWidths` in `timelineUtils.ts` (`activityWidth = available − gaps × 48`). Worst on
  `/activity-tracking/unified`, then `/activity-tracking/android` and `/activity-tracking/desktop`. `/activity-tracking` holds up only
  because its seed day has 3 sessions.
- **Expected:** the timeline is readable, or scrolls to a readable scale (group-file trap: "say whether it scrolls, squashes or
  clips"). Its bars are the click target that selects an item, so they need to be tappable (24 px, WCAG 2.5.8).
- **Actual:** it does both, badly. It scrolls (600 px inside 342, 258 px of scroll), but every "no activity" gap is a fixed 48 px
  column, and that comes out of the same 600 px. Unified's seed day has 11 sessions and 12 gaps, so the gaps take 576 px and all 11
  sessions share 24 px: **each is 6 px wide**, and the card shows only gap columns. Android: 5 sessions at 6–7 px. Desktop: 7
  sessions at 12–23 px, labelled "J…", "G…", "V…". Web: 39–47 px, readable. The time axis overprints too ("10:00" over "10:35",
  "15:00" over "15:15"). The width is container-driven, so a wider container gives the sessions the extra room. It only collapses at narrow widths.
- **Evidence:** `docs/views/tracking-dashboards/screenshots/unified-timeline--mobile.png`, `desktop--mobile.png`,
  `android--mobile.png`. `eval` widths of `.timeline-session`: unified all `w6`, android `7,6,6,6,6`, desktop `23,19,19,16,16,12,12`.
- **Repro:** 1. `resize 390 844`, open `/activity-tracking/unified?date=<seedDate>`. 2. Look at the timeline card. Scroll it sideways.
- **Verify:** 1. `playwright-cli resize 390 844`, then `reload` on `/activity-tracking/unified?date=<seedDate>`. 2. `eval`
  `[...document.querySelectorAll('.timeline-session')].map(e => e.getBoundingClientRect().width)`. 3. **Pass condition:** every
  width is ≥ 24, and `.timeline-container` scrolls horizontally to reach any that aren't on screen.
- **Suggested fix:** derive the grid's min width from the content, e.g. `gaps × 48 + sessions × 40`, instead of a flat 600 px, so the
  container scrolls further rather than squeezing. Or narrow the gap columns below `md`.

### P1. The timeline's Single/Split toggle is clipped by its own group, and on All sources Split is hidden entirely (390 px)
- **Status:** open
- **Severity:** polish
- **Where:** @390×844 · `src/core/activityTracking/component/timeline/ActivityTimeline.vue:48-68` (the `MyBtnToggle` in `.header`).
  `/activity-tracking`, `/activity-tracking/desktop`, `/activity-tracking/unified`. `/activity-tracking/android` fits, because its legend has one entry.
- **Expected:** both buttons of a two-button toggle are visible (plain sense).
- **Actual:** the `v-btn-group` clips at x 366 (`overflow-x: auto`). Web/desktop: Split spans 331–386, so 35 px shows, labelled
  "SPLI". Unified: the three lane labels push the group right. Single reads "SING", and Split (385–435) is wholly past the
  clip. It's reachable only by swiping a 100 px group sideways, which nothing hints at. Polish, not bug: Split is a secondary
  layout and it can still be reached.
- **Evidence:** `docs/views/tracking-dashboards/screenshots/unified--mobile.png`, `activity-tracking--mobile.png`. `eval`: Split
  `[385, 435]` vs its group's clip at 366 (unified).
- **Repro:** 1. `resize 390 844`, open `/activity-tracking/unified?date=<seedDate>`. 2. Look at the timeline card's top-right corner.
- **Verify:** 1. `playwright-cli resize 390 844`, then `reload` on `/activity-tracking/unified?date=<seedDate>`. 2. `eval` the rect of
  the button whose text is "Split". 3. **Pass condition:** its `right` is ≤ its `v-btn-group`'s `right`, and ≤ `innerWidth`.
- **Suggested fix:** let `.header` wrap (`flex-wrap`), so the toggle drops under the title and legend.

### P2. The dashboards' content scroller pans 4 px sideways (390 px)
- **Status:** open
- **Severity:** polish
- **Where:** @390×844 · the `VRow` at `ActivityDashboard.vue:54` (and its twins in the other three views) inside `.v-main .v-container`
  (`overflow: auto`). All four dashboards.
- **Expected:** no sideways scroll at 390 px (template step 2; WCAG 1.4.10).
- **Actual:** `.v-main .v-container` has `scrollWidth` 394 vs `clientWidth` 390, and the offender is `div.v-row → 394`. `docScroll` stays
  390 because this is the app's inner scroller, so the page itself doesn't scroll, but a sideways swipe nudges all the content
  4 px. Not measured at desktop width.
- **Evidence:** the overflow `eval` on all four routes: `mainScroller: [394, 390]`, offender `div.v-row → 394`.
- **Repro:** 1. `resize 390 844`, open `/activity-tracking?date=<seedDate>`. 2. Swipe the content left.
- **Verify:** 1. `playwright-cli resize 390 844`, then `reload` on each of the four routes. 2. **Pass condition:**
  `document.querySelector('.v-main .v-container')` has `scrollWidth <= clientWidth`.
- **Root cause guess:** `VRow`'s −12 px gutters overrun the container's narrow-screen padding. **Added by x4 `account` (2026-10-06):** the padding is `App.vue:29`'s `px-2`, shared by every route. The same 4 px pan shows on `/user/settings` and `/forgotten-password`, and 8 px on `/login` and `/registration` (nested rows). Filed with all routes as `auth` P4, so fix them together.

### B6. The All sources view squashes its Sources card to 26 px, so the Browser/Desktop/Phone chips render under the timeline and can't be clicked
- **Status:** open
- **Severity:** bug
- **Where:** `/activity-tracking/unified` → `src/core/activityTracking/component/unified/ActivitySourceFilter.vue:2-5` (`VCard`, which
  Vuetify makes `overflow: hidden`), a child of the `h-100 d-flex flex-column` root at `UnifiedActivityDashboard.vue:2`. Happens at every
  width: measured at 1440×900 and at 390×844.
- **Expected:** the source chips are this view's only filter, and per the component's own comment (`ActivitySourceFilter.vue:24-29`)
  they're "the control a user reaches for when the dashboard came back empty or wrong", so they must be visible and clickable (stated
  intent; inventory: "Toggles that source out of/into the merge").
- **Actual:** the card renders **26 px** tall, but its content is 128 px at 1440×900 and 204 px at 390×844 (the chips wrap). The chips
  spill below the card's box. The timeline card that follows paints over them, so `elementFromPoint` at a chip's centre doesn't
  return the chip, at either width. At 390 the Browser chip sits at y 486–518, and Desktop and Phone at 534–566, while the card ends
  at 499 and the timeline card starts at 515.
- **Evidence:** `eval` on the chip's closest `.v-card`: 1440×900 → `{ top: 318, height: 26, scrollHeight: 128, chipHit: false }`;
  390×844 → `{ top: 473, height: 26, scrollHeight: 204, chipHit: false }`. `docs/views/tracking-dashboards/screenshots/unified--mobile.png`
  shows the sliver at y ≈ 473–499 with a chip half-visible under the timeline card. No desktop-width screenshot was taken.
- **Repro:** 1. Open `/activity-tracking/unified?date=<seedDate>` at 1440×900. 2. Look under the header for the Sources panel.
  3. Click the Desktop chip.
- **Verify:** 1. Open `/activity-tracking/unified?date=<seedDate>` at 1440×900, and again after `playwright-cli resize 390 844` and a reload.
  2. `eval`: for each `[aria-pressed]` chip whose text matches Browser/Desktop/Phone, the `elementFromPoint` at its centre is
  inside the chip, and its closest `.v-card` has `getBoundingClientRect().height >= scrollHeight`. 3. **Pass condition:** both hold at both
  widths, and clicking Desktop adds `?sources=webExtension,android` to the URL.
- **Root cause guess:** a flex item with `overflow: hidden` has a min-height of 0, so the `h-100` column shrinks it to fit
  everything else into the viewport. The header isn't shrunk because it's `overflow: visible`, and the chart wrapper is a plain
  `div`. Same mechanism as tracking-settings X5, and as the earlier F-fix comment at `ActivityPieChartSection.vue:61-62`.
- **Suggested fix:** `class="flex-shrink-0"` on `<ActivitySourceFilter>` in `UnifiedActivityDashboard.vue`, or drop `h-100` from the view root.
- **Found by:** the x4 narrow-viewport pass (2026-10-06), re-measured at 1440×900. Filed as a desktop defect, so its title carries
  no `(390 px)`.
