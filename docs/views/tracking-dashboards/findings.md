# tracking-dashboards — findings

> Pass: inventory · captured 2026-09-14 · commit `6aac48bb`

**Tally:** blocker 0 · bug 2 · a11y 2 · polish 0 · opportunity 0 · unverified 1

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-14 | `6aac48bb` | initial inventory pass |

---

### B1. Web dashboard's domain-detail close button renders no icon — wrong icon set (`mdi-*` in a FontAwesome-only app)
- **Status:** open
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
- **Status:** open
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
- **Status:** open
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
- **Status:** open
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
- **Status:** open
- **Severity:** unverified
- **Where:** `useActivityDashboard.ts` loading/error refs, rendered by `StackedBarsChart.vue`,
  `ActivityTimeline`, `ActivitySummaryCards.vue`, pie-chart sections, `ActivityFocusStrip.vue`
- **What would verify it:** This pass never saw a `VSkeletonLoader` (fetches settle before a screenshot can
  catch them) or a panel's error/retry block (no network fault injection available via `playwright-cli`). The
  code path is `_silent: true` requests with a per-panel `error` ref and a retry button, consistent across all
  four dashboards — a pass with request-throttling or interception would confirm the retry button actually
  re-fires only its own panel.
