# Fix queue — X4 narrow viewport — log

> Audit trail for [`_fix-queue.md`](_fix-queue.md) beside this file, split out of [`../_fix-queue-log.md`](../_fix-queue-log.md)
> on 2026-10-07 together with the queue. Nothing here is open work. Sections: the pass narrative, batch bodies moved here when their
> fix was verified, settled verification items, and the *Contradictions & re-grades* audit trail. Contradiction numbers continue
> the app log's sequence (§127–§135), so a `§n` cited in the queue resolves here; any lower `§n` is in the app log.

## Pass history (newest first)

> **Seventeenth pass, 2026-10-07, commit `e99e54f0`: the X4 narrow-viewport round absorbed** (`x4/00-shell` in `0e77f904`, then
> groups `a`–`f` in `8a2d4ffa`, `fb38dc15`, `cb161387`, `7e7fe905`, `dd9ded6c`, `dcbc2655`, `fcd8f877`). The operator scoped the pass
> to the X4 findings (`UNIT-ORDER.md` B3). The seven group runs filed **47 findings** across 14 units and the shell. Forty-five carry
> `(390 px)` in the title. Two were filed without it: `leisure-bucket-anchors/B4` is a one-tap delete that isn't width-specific, found
> by accident **at the cost of the fixture's only bucket-list row, 17101**, so reseed before trusting that unit's specs.
> `tracking-dashboards/B6` was re-measured at 1440 and is a desktop defect. The 47 became **17 app batches (`F91`–`F107`) and 10
> framework batches (`FW27`–`FW36`)**, with no escalations (nothing seen at 390 px is server-side) and four `unverified` rows. Every
> finding carries measured geometry and a screenshot, so none was dropped to `unverified` for weak evidence, and none was dropped
> outright. Two severities changed, both upward by merging (`activity-settings/P3` and `planner-day/P6`'s *Add* half into `FW27`).
>
> What this pass could see that no single group could is **two common ancestors**. `App.vue:29`'s container
> (`h-100 d-flex px-2 … overflow-y-auto`) sits behind three families:
> - its `px-2` against `VRow` gutters causes the 4–10 px pans (`F92`);
> - its `overflow-y-auto` computes `overflow-x: auto`, which is why four non-wrapping rows in four modules all show up as "the whole
>   page pans" rather than as a clip (`F93`);
> - its definite height under `d-flex` stretch is behind the five viewport-locked layouts, which include both blockers (`F91`).
>
> The other ancestor is the framework `DataTable`'s sticky actions column, which has never matched (`FW27`). Three units reported its
> symptom, with two different proposed fixes (§128). The container itself stays untouched: `F91` fixes the views, not `App.vue`.
>
> Four X4 defects were made or left in place by fixes verified only at desktop width (§130). Every new layout batch therefore names a
> 1440 *and* a 390 check, and the queue says so above `F91`. Two records disagree with the queue: `user-settings/U3` (§131) and
> `_shell` round 2's Escape claim (§127). One architecture note isn't a finding: `StackedBarsChart` crosses a module boundary (§135).
>
> Coverage: the seven `x4/` prompt files are still in `prompts/view-docs/x4/`, not `_done/`, although each has its commit; that's the
> operator's call. `x4/submodule.md` has not run, and its findings go to `prompts/view-docs/units/_submodule/_fix-queue.md`, not here.
> The queue's header said units 16–19 had not run; they have, with their own queue, and the header now says so.

## Closed batches

## FW27. `DataTable`'s sticky actions column never sticks
> ✅ **FIXED 2026-10-07** (framework `2819f1a`, one commit for `FW27`/`FW28`/`FW32`). The column is now keyed on the header, not `:last-child`:
> `DataTable` gives the header keyed `actions` Vuetify 3.12's own `fixed: 'end'` (from `columns` or raw `headers`, unless the header
> sets `fixed` itself). Vuetify supplies the sticky position, the opaque surface background and `z-index: 2` on the header cell under
> `fixedHeader`, so the corner cell is handled. A table without actions pins nothing. The dead `:237-243` rule was deleted, and so was
> the dead hover rule at `:280`: it had never rendered, and the table's `hover` prop already highlights rows. One new rule keeps a
> `highlightedId` row's tint on the opaque pinned cell. Documented in `components.md` → *Data tables*.
> **Verified** with `playwright-cli` at 390×844: `/leisure/backlog` and `/leisure/projects?view=table` both put Add at 309–349, Edit
> at 285–325 and Delete at 333–373 (`innerWidth` 390) with the table unscrolled, and the same after `scrollLeft = 200`; the header
> fixed cell computes `z-index: 2`. A screenshot showed the pinned column opaque over the scrolled data. `vue-tsc --build --force`: 0.
> **Not verified:** bucket-list and memory-anchors in table mode, Activities/Categories (`activity-settings/P3`), `planner-day/P6`
> step 2, expanded and selectable rows, and the 1440 look of a table that fits.

- **Scope:** **[framework]** `src/_common/component/dataTable/DataTable.vue:237-243` (and `:280`): submodule commit + pointer bump.
- **Closes:** `leisure-backlog-picker/B6`, `activity-settings/P3` (merged, re-graded `polish` → `bug`), and `planner-day/P6`'s *Add*
  half.
- **Root cause:** `.my-data-table` is set on the `VDataTable` root itself (`DataTable.vue:6`, `class="flex-fill my-data-table"`), so
  `.my-data-table :deep(.v-data-table th:last-child)` looks for a `.v-data-table` *inside* it and never matches. The actions column, and
  `BasicTable`'s header *Add* with it, scrolls away with the data. On a phone they start 300–450 px off-screen, with no cue. In table
  mode, four leisure views and the Activities/Categories tabs have no other create action on screen. The row-hover rule at `:280` uses
  the same dead descendant, so it has never applied either (read this pass).
- **What to change:** target the cells directly, `.my-data-table :deep(th:last-child), .my-data-table :deep(td:last-child)`, or better,
  a class on the actions column, so a table with `showActions: false` doesn't pin its last *data* column. Keep the opaque background on
  the sticky cells. Fix `:280` the same way, or delete it if the hover highlight was never wanted (it has never rendered). Document the
  pinned column under *Data tables* in `src/_common/docs/components.md`.
- **Do not change:** don't move the create button out of the header, as `activity-settings/P3` and `planner-day/P6` suggest (§128).
  The CSS already declares the intent, and pinning the column also fixes the row actions, which moving the button wouldn't.
- **Verification:** `leisure-backlog-picker/B6`'s `Verify:` (backlog and projects-table; also bucket-list and memory-anchors in table
  mode), `activity-settings/P3`'s on Activities and Categories, `planner-day/P6` step 2. At 1440, a table that fits looks the same.
- **Risk:** ships to every app. Check the corner cell where `fixedHeader`'s top-sticky and the new right-sticky meet (z-index), and
  expanded and selectable rows.

## FW28. `ActionBar` grows to its content on a phone, and both ends, Cancel included, are off-screen
> ✅ **FIXED 2026-10-07** (framework `2819f1a`, one commit for `FW27`/`FW28`/`FW32`). The overflow-strip option: the default slot now sits in an
> `.action-bar__actions` strip, and Cancel (`flex-shrink-0`) sits outside it. Below `md` (`max-width: 959.98px`) the bar drops
> `min-width: min-content` and is capped at `100vw − --v-layout-left − --v-layout-right − 16px`, and the strip scrolls sideways. The
> old `max-width: 98%` at ≤ 600 px is gone (the cap replaces it). `FW17`'s centring is untouched. Scroll was chosen over `flex-wrap`
> because a wrapped bar grows upward over what it acts on; documented in `components.md` → `ActionBar.vue`. App consumers'
> descendant selectors (`.action-bar .selection-count`, `useActionBarFocusReturn`'s `.action-bar`) still match.
> **Verified** with `playwright-cli`: one task selected on `/day-planner/2026-10-06` at 390×844 puts the bar at 8–382 and Cancel at
> 311–373; the strip is 286 px wide over 655 px of content, and scrolling it to the end brings Split to 257–303. Screenshot checked.
> At 1440×900 the bar is 319–1409 with no overflow and `overflow-x: visible`, i.e. unchanged. `vue-tsc --build --force`: 0.
> **Not verified:** the bulk-select, apply-template and template-selection bars, 768 px, and a bottom snackbar over the bar (moot:
> `FW32` kept the toast at the top).

- **Scope:** **[framework]** `src/_common/component/ActionBar.vue:36-51,69-85`.
- **Closes:** `_shell/B2`. It was observed on four bars: day selection (−177…567), bulk select (−136…526; *Copy Day* and *Cancel* lost),
  apply-template (marginal) and template selection (*Cancel* 39 px visible).
- **Root cause:** `min-width: min-content` plus `text-wrap: nowrap` override the mobile `max-width: 98%`, so the bar grows to its
  content: 744 px at 390, 974 at 768. `FW17`'s centring then puts both ends off-screen, and the bar is `position: fixed`, so no scroll
  reaches them. A phone has no Escape key, so a lost *Cancel* is the only way out.
- **What to change:** below `md`, drop `min-width: min-content` and cap the bar at the content box (`FW17`'s offsets) minus 16 px. Put
  the actions in an `overflow-x: auto` strip with *Cancel* outside it, always visible. `flex-wrap` is the alternative: decide once, and
  document it in `components.md`.
- **Do not change:** `FW17`'s content-box centring. An app-side overflow menu for `dayPlanner`'s secondary actions is a separate
  question; file it only if the bar is still unusable after this fix.
- **Verification:** `B2`'s `Verify:`, plus the bulk-select and template-selection bars, then 768 and 1440 unchanged.
- **Risk:** every app's action bars. Check that a bottom-placed snackbar doesn't land on it (`FW32`).

## FW32. The top-placed snackbar covers the page's first action for 3 s on a phone
> ✅ **FIXED 2026-10-07** (framework `2819f1a`, one commit for `FW27`/`FW28`/`FW32`). The close-action option: `showErrorSnackbar` now defaults
> `closable` to `true`, like the other two, and the interceptor's two explicit `{ closable: false }` on 403 were removed, so every
> error toast has Close. Placement stays `location="top"`, because at the bottom it would cover `FW28`'s Cancel. The queue is
> untouched (`Q1`). `SnackbarComposable.test.ts` updated (error toast closable, plus an explicit `closable: false` still honoured;
> 17/17 pass). Documented in `composables.md` and `components.md`.
> **Verified** with `playwright-cli` at 390×844 on `/todo-list/999999999`: the 404 toast now carries a 57×36 Close; after tapping it,
> `elementFromPoint` at "To the lists"' centre hits the link and no toast is active.
> **Not verified, and not met as written:** `_shell/P3`'s `Verify:` step 3 (the link is hit within 1 s of load) still fails under
> this option, because the toast still appears over the link. That condition only fits the bottom-placement option. Recorded on the
> finding.

- **Scope:** **[framework]** `src/_common/component/feedback/Snackbar.vue:8-14`. It gets its own batch under rule 4, because the
  placement is a framework-wide default.
- **Closes:** `_shell/P3`.
- **Root cause:** `location="top"` + `mt-16` puts the 404 toast (no close button, 3000 ms) exactly over the not-found alert's only
  action, and the toast's `pointer-events: auto` swallows the tap.
- **What to change:** decide between `location="bottom"` below `md` (the usual phone placement) and a close action on error toasts.
  **Weigh `FW28`:** `ActionBar` is fixed to the bottom, so a bottom toast would cover *its* Cancel instead. The close action has no
  such collision. Keep the `VSnackbarQueue` (`Q1`, 2026-09-24).
- **Verification:** `P3`'s `Verify:`. If you choose bottom, also open a selection bar and fire a toast.
- **Risk:** every app's toasts.

## F98. Two overlays on a phone drop focus to `<body>` when they close
> ✅ **FIXED 2026-10-07** (app-side; the drawer half is `FW29`, same convention). **Panel:** `PlannerSidePanelShell` now handles focus
> itself while `compact`, so all three planner mounts (day, template, split pane) get it without view wiring. On open it remembers
> the opener (whichever control it was: either header's toggle, the header's Details/Routine buttons, the not-found alert's toggle)
> and focuses the panel's X (`.panel-close`). `@keydown.esc` on the card closes it. On close it refocuses the opener, but only if
> focus was in the panel or already on `<body>`, so the close that picking a routine item triggers doesn't pull focus off the grid.
> **Categories dialog:** `@afterLeave` refocuses the Categories button through a template ref. That covers Close, Escape and picking
> a category with one handler; an `activator` would also have toggled on the button's own click. The header stays non-`inert`.
> **Verified** with `playwright-cli` at 390×844: on `/day-planner/05-10-2026` and `/day-planner/templates/20001`, *Open panel* puts
> focus on the panel's X (`.panel-close`, not the covered header toggle of the same name); Escape hides the card (`display: none`) and
> focus is on *Open panel*; the X does the same. In the split view (`?left=20001&right=20002` at 1440, where each pane is compact),
> the same on the first pane. `/todo-list`: Close, Escape, and picking *Other* all leave focus on the Categories button. No console
> errors. `vue-tsc --build --force`: 0.
> **Not verified:** the second split pane, and the not-found alert's toggle as an opener.

- **Scope:** app-side: `src/core/dayPlanner/component/PlannerSidePanelShell.vue:5-25`, `normal/DayPlannerHeader.vue:8-14`,
  `template/TemplatePlannerHeader.vue:8-14`; `src/core/todoList/view/TodoListsView.vue:4-27,68-75`. **The framework's mobile drawer has
  the same three symptoms and is `FW29`.** Rule 1 makes them two batches; use the same convention in both.
- **Closes:** `planner-day/A2`, `todo-lists/A4`.
- **Root cause:** both overlays are opened through `v-model`, and neither knows what opened it. The compact side panel is an
  absolutely positioned layer (`z-index: 30`) with no focus handling at all: focus stays on the toggle it now covers, Escape does
  nothing, and closing drops focus to `<body>`. The Categories `VDialog` has no `activator`, so Vuetify has no element to give focus
  back to.
- **What to change:** one convention: on open, focus moves into the overlay; Escape closes it; on close, focus returns to whatever
  opened it.
  - Panel: when `compact`, focus the panel's X on open, add `@keydown.esc` on the card, and refocus the header toggle on close. The
    view owns `panelOpen` and both headers.
  - Categories dialog: an `activator` (template ref, or `activator="parent"`), or a refocus in `@afterLeave`. Either way it must also
    cover the close that happens when a category is selected.
- **Do not change:** `F56`'s names (*Open panel* / *Close panel*), `F51`'s panel geometry.
- **Verification:** both `Verify:` blocks, with `A2`'s also run on `/day-planner/templates/20001` and in a split pane.
- **Risk:** low. While the panel is open the covered header toggle is a second *Close panel*; making the header `inert` is optional.

## FW29. The mobile nav drawer doesn't manage focus, and the hidden brand link is still a tab stop
> ✅ **FIXED 2026-10-07** (framework, one commit for `FW29`/`FW30`/`FW31`). **A4:** while temporary, `AppSidebar` passes
> `captureFocus` + `retainFocus` and also focuses its first entry on open, because `captureFocus` only acts on the *next* focus or
> Tab, so after a click focus would still be on the toggle. `@keydown.esc` on the drawer closes it. Vuetify's drawer has no Escape
> handling of its own, so nothing double-closes (§127's round-2 claim doesn't reproduce). The drawer emits
> `closed('dismiss' | 'navigate')`, and `Navbar` places focus: a dismiss goes to the toggle (`AppTopBar` exposes `focusToggle()`), a
> chosen entry goes to `<main>`. That is the generic form of `#main-content`, because the framework can't name the app's id; it adds
> `tabindex="-1"` if `<main>` has none. Nothing moves if focus was elsewhere at close, e.g. a resize into the temporary layout.
> **A5:** `d-none d-md-flex` moved onto the `RouterLink`. Documented in `composables.md` → `src/_common/nav/`.
> **Verified** with `playwright-cli` at 390×844: Tab from the toggle lands on the 35×35 theme toggle, and the brand link computes
> `display: none`. Opening puts focus on *Home* inside `.app-sidebar`; Escape closes it (`--active` gone) with focus on *Toggle
> navigation*; a scrim tap does the same; choosing *My reminders* navigates and focuses `<main>`. At 1024×800, open and Escape behave
> the same. At 1440, the brand link is 205×36 and is the Tab stop after the toggle. `vue-tsc --build --force`: 0.

- **Scope:** **[framework]** `src/_common/nav/AppSidebar.vue:2-12`, `Navbar.vue` (it owns the toggle hand-off), `AppTopBar.vue:19-31`.
  The app-side twin is `F98` (rule 1).
- **Closes:** `_shell/A4`, `_shell/A5`.
- **Root cause:** `A4`: below 1280 px the drawer is temporary, with a scrim, but it passes neither `captureFocus` nor `retainFocus`.
  Vuetify 3.12.4's `VNavigationDrawer` has no Escape handling, and nothing refocuses the hamburger on close. `A5`: `d-none d-md-flex`
  sits on the `VSheet` *inside* the brand `RouterLink`, so the link itself stays rendered at 0×0 and focusable.
- **What to change:**
  - `A4`: `captureFocus` and `retainFocus` while temporary; `@keydown.esc` closes the drawer; `Navbar` refocuses the toggle after a
    scrim tap or Escape. When an item is chosen, the route change takes focus: send it to `#main-content`, as the skip link does,
    rather than back to the toggle.
  - `A5`: move `d-none d-md-flex` onto the `RouterLink`.
- **Verification:** `A4`'s and `A5`'s `Verify:` blocks, also run at 1024 because the drawer is temporary up to 1280. At 1280+, the brand
  link is still a tab stop.
- **Risk:** `_shell` round 2 recorded that Escape closes the drawer (§127). Whatever that observation was, the handler this adds must
  not double-close.

## FW30. Below `md` the drawer footer replaces two of the user menu's five entries, so *My reminders* has no path
> ✅ **FIXED 2026-10-07** (framework, one commit for `FW29`/`FW30`/`FW31`). The recommended option. A new
> `nav/useUserMenuEntries.ts` holds the five entries (settings, my reminders, notifications, reminder preferences, log out), and
> `UserMenu` and the mobile drawer footer both render it, so they can't drift. The footer is now a compact `nav` list under a
> display-name subheader, replacing the account button + log-out icon. That also drops the hard-coded `'Tester Testovič'` fallback,
> and the subheader simply isn't rendered without a name. `navItems.ts` is untouched. Documented in `composables.md` →
> `src/_common/nav/`.
> **Verified** with `playwright-cli` at 390×844: with the drawer open, `.app-sidebar` holds `a[href="/pripomienky/moje"]` and
> `a[href="/notifikacie"]`, and clicking *My reminders* lands on `/pripomienky/moje`. At 1440 the user menu lists the same five
> entries in the same order and the drawer has no footer. `vue-tsc --build --force`: 0.
> **Not verified:** log out from the footer (not clicked, to keep the shared state file alive).

- **Scope:** **[framework]** `src/_common/nav/AppSidebar.vue:85-110`, `nav/UserMenu.vue:8`. **This needs a decision first:** the drawer
  footer of every app changes.
- **Closes:** `_shell/B3`.
- **Root cause:** below `md` the user-menu activator is `d-none`. The drawer footer copies only *User settings* and *Log out*. This app
  keeps `myReminders` out of `navItems.ts:79` *because* the user menu links to it, so `/pripomienky/moje` has no path on a phone except
  through a reminder notification.
- **What to change:** recommended: the drawer footer renders `UserMenu`'s entries from the same source list, so the two can't drift.
  The alternative is an icon-only `UserMenu` activator in the top bar below `md`. Document it in the nav section of the framework docs.
- **Do not change:** `navItems.ts`. Adding `myReminders` there duplicates it on desktop.
- **Verification:** `B3`'s `Verify:`, including that Notifications is still reachable.
- **Risk:** every app's mobile drawer footer grows by up to three entries.

## FW31. Breadcrumbs wrap to two or three lines inside the top bar
> ✅ **FIXED 2026-10-07** (framework, one commit for `FW29`/`FW30`/`FW31`). The recommended option, parent + current. Below `md`
> (`smAndDown`) `AppBreadcrumbs` renders only the last two crumbs, and the parent stays a link. At every width each crumb is
> `nowrap` and ellipsises, with its full text in `title`. Ancestors take `flex-shrink: 100` down to a 40 px stub, so the current page
> is the last to truncate. Documented in `composables.md` → `src/_common/nav/`.
> **Verified** with `playwright-cli` at 390×844: every crumb `li` is 24 px tall on `/todo-list/13001`, `/todo-list/13002`,
> `/day-planner/templates/20001`, `/activity-history/detail` (now *Summary › History Detail*, both in full) and `/leisure/pick`; the
> slot is 216 px with `scrollWidth` = `clientWidth`. On the template route the current crumb still ellipsises (148 of the 171 px it
> needs) and the parent is a 40 px "H…". Both carry `title`, which is what `P4`'s pass condition allows. At 1440 the full trail
> renders, untruncated, on the template and detail routes.

- **Scope:** **[framework]** `src/_common/nav/AppBreadcrumbs.vue` (the 204 px slot in `AppTopBar.vue:33-36`). This is a decision: the
  collapse rule is every app's.
- **Closes:** `_shell/P4`. Seen on nine routes. At its worst, on `/activity-history/detail`, the current crumb is clipped to
  "His / Det".
- **What to change:** below `md`, show only the parent and the current crumb (or just a back link to the parent), with `text-truncate`
  on the title span and the full text in `title`.
- **Do not change:** the labels themselves (`F11`, `F14`, `F28`).
- **Verification:** `P4`'s `Verify:`, plus `/activity-history/detail`.

## F94. Both pie sections keep their desktop side-by-side row on a phone
> ✅ **FIXED 2026-10-07** (app-side, one change for `F94`–`F97`). **History:** `HistoryPieChartSection`'s row is
> `flex-column flex-sm-row`, and the details card's `min-width`/`max-width` apply only at `smAndUp`. `HistoryPieChart` (`F31`) is
> untouched and just gets the full width. **Tracking:** `ActivityPieChart` measures its own width (`useElementSize`, `autoresize`). The
> container is `width: 470px; max-width: 100%`. At 440 px or wider it keeps the side layout, with the donut's centre at
> `width − 125` px, which is exactly the old `115%` of the 300 px box at 470. Below 440 the donut is centred and the legend becomes one
> paged horizontal row under it (canvas 265 px tall). Both branches set every position key, because vue-echarts merges options and a
> key set by only one branch would survive a switch. The four section rows are `flex-column flex-md-row`. The card's `overflow:
> hidden` is unchanged, and so are `F46`'s and `F48`'s wiring. *Close details* is still 20×20 (not free: it's three different buttons).
> **Verified** with `playwright-cli` at 390×844: on `/activity-tracking?date=2026-10-06&selected=github.com` the canvas is 342 px in a
> 382 px card, *Close details* sits at x 331–351 and `elementFromPoint` at its centre is the button, and the screenshot shows a whole
> donut with the legend under it. On `/activity-history` and `/activity-history/detail?date=2026-10-02`, the canvases are 342 and 326 px
> (≥ 300). At 1440×900 the tracking chart is 470 px on web, desktop and unified, and both history pie rows are `row`.
> **Not verified:** `B3`'s step 4 taps (Rider on desktop, Spotify on Android) at 390; the history legend's read-back screenshot.
> **Re-checked 2026-10-08 after `F92`** (the scroller's `px-3` takes 8 px off the content area below `md`): still passes. At
> 390×844 every section row is `column`. The tracking canvas is 334 px in a 374 px card on web, desktop, Android and unified (was
> 342/382), so it stays on the stacked branch. The history canvases are 334 (Summary) and 318 (Detail), still ≥ 300. At 1440×900
> every row is `row` and the tracking canvas is 470 px. **Seen at 1440, not an X4 regression:** the donut's right edge is clipped by
> about 6 px at the card's edge. `HEAD`'s fixed 470 px canvas with `center: ['115%', …]` puts the donut in exactly the same place,
> and `F92` didn't change the padding at `md`. Unfiled.

- **Scope:** app-side, two modules with one shape: `src/core/historyDashboard/component/pieChart/HistoryPieChartSection.vue:28-41`;
  `src/core/activityTracking/component/pieChart/ActivityPieChart.vue:158,219-222` plus the row in each of the four sections
  (`ActivityPieChartSection.vue:49`, `DesktopPieChartSection.vue:47`, `AndroidPieChartSection.vue:47`, `UnifiedPieChartSection.vue:50`).
- **Closes:** `history-review/B7`, `tracking-dashboards/B3`. `history-review/B7` names the latter as the same shape.
- **Root cause:** in both modules a pie sits beside a details panel in a `d-flex ga-2` row with no breakpoint. In history, the
  fixed-width details card (200–250 px) leaves the canvas 134 px, so the legend cuts each name to 0–2 letters. In tracking, the canvas
  is a fixed 470 px with `center: ['115%', '42%']`, wider than the 342 px card. The donut is cut in half, and the panel (Day Total, the
  selection's split, *Close details*) lies outside the card's `overflow: hidden`, where nothing can reach it.
- **What to change:**
  - History: `flex-column flex-sm-row` on the `HistoryPieChartSection` row, and the details card's `min-width` only while the two sit
    side by side.
  - Tracking: `.chart { width: 100%; max-width: 470px }`, a centre derived from the chart rather than the hardcoded `115%`, and
    `flex-column flex-md-row` (or `flex-wrap`) on the four section rows so the panel drops under the chart.
- **Do not change:** `F31`'s measured-width legend logic, which should simply get a wider canvas; `F46`'s close-button wiring; `F48`'s
  `showViewMode`; the card's `overflow: hidden`, which the comment at `ActivityPieChartSection.vue:61-62` relies on. *Close details* is
  20×20, under WCAG 2.5.8's 24 px. That is unfiled and the same at desktop width, so enlarge it in the same edit only if it's free.
- **Verification:** both `Verify:` blocks (history on Summary and Detail; tracking on web, desktop and Android), then 1440 unchanged.
- **Risk:** `F31`'s side-legend branch must still be chosen at desktop width.

## F95. The stacked-bar chart's header can't wrap, so the plot is left 4 px tall
> ✅ **FIXED 2026-10-07** (app-side, one change for `F94`–`F97`). `StackedBarsChart`'s header row is `flex-wrap`. The legend is
> extracted into `StackedBarsLegend.vue`, which renders in the header at `mdAndUp` and under the plot below `md`. The grid's inline
> `min-height: 0` is now `150px`. In the two history views the flat `min-height: 200px` (on the Summary card, and on Detail's wrapper)
> became `min-height: min-content`: never shorter than header plus the plot's floor, at any width, without touching the card's `h-100`
> that the tracking dashboards use. **Found on the way:** on Summary, the `#header-right` `TimeRangePicker` (passed `flex-shrink-0`)
> stayed one max-content line, and its h/m steppers ran to x 508. It now also gets `max-width: 100%`, so its own `flex-wrap` root wraps.
> That fix is app-side; the framework component is untouched.
> **Verified** with `playwright-cli` at 390×844: `/activity-history` has a 694 px plot (bars render, screenshot read), the legend's
> right edge equals the card's (382), and every header button has `right ≤ 336`. On `/activity-history/detail?date=2026-10-02&view=stackedBars`
> the plot is 567 px and the legend's right edge equals the card's (374). At 1440×900, on both routes the legend sits above the plot.
> No console errors.
> **Not verified:** the 768 px case the root cause mentions; the four tracking dashboards' bars at 390 (the tracking runs above were
> on the pie and the timeline).
> **Re-checked 2026-10-08 after `F92`:** still passes, and it covers the tracking half that was missing above. At 390×844, on all four
> dashboards with `view=stackedBars`, the plot is 567 px, the legend sits under it and spans the card (12–378), and the header controls
> end at x 132. Web's screenshot shows the bars drawing. On Summary the controls end at 340 inside a 378 card (plot 694 px), and on
> Detail at 140 inside 370 (plot 567 px). At 1440×900 the legend is back above the plot on all six. **Seen at 390, outside this batch:**
> in the 30 min window the last x-axis category reads "11:30 - 1". That's ECharts truncating a label inside the canvas, not a layout
> overflow. Unfiled. Still not checked: the 768 px case.

- **Scope:** app-side: `src/core/activityTracking/component/stackedBars/StackedBarsChart.vue:3-30`;
  `src/core/activityHistory/view/HistorySummaryView.vue:45-46`, `HistoryDetailView.vue:103-104`.
- **Closes:** `history-review/B5`.
- **Root cause:** two causes together. The header row (the Window select, the `#header-right` slot, the legend) doesn't wrap, so the
  8-item legend grows into a 229 px-tall column instead of dropping to its own line. And the history views size the card
  `flex-fill` + `min-height: 200px`; on a phone the column is taller than the screen, so `flex-fill` adds nothing and the card sits at
  200 px, which the header fills. The plot gets 4 px. This also breaks at 768.
- **What to change:** `flex-wrap` on the header. Below `md`, put the legend on its own full-width row under the plot. Give
  `.stacked-bars-container` a `min-height` (about 150 px) so the header can't squeeze it, and let the history card's height be header
  plus plot below `md` (the `F91` rule).
- **Do not change:** `F29`'s bar semantics, or the Detail drill-through (`interactive` bars, `d492bc1b`).
- **Verification:** `B5`'s `Verify:` on both routes. The four tracking dashboards still show their bars at 390 and at 1440.
- **Risk:** the component belongs to `activityTracking` and is imported by two `activityHistory` views (§135), so every edit lands on
  all four dashboards too.

## F96. The timeline at phone width: sessions squeezed to 6 px, and the Single/Split toggle clipped
> ✅ **FIXED 2026-10-07** (app-side, one change for `F94`–`F97`). **B5:** `calculateSegmentWidths` takes a `minPixelsPerMinute`, and the
> activity share is `max(available − gaps, activity minutes × that)`. `TimelineGrid` derives it per group (single, or each split half)
> as 24 px over the shortest session's clipped duration, with sessions under 10 min counted as 10, which caps the scale at 2.4 px/min.
> The grid's width is never under 600 px, and `.timeline-segments` is `width: max-content; min-width: 100%`, so the container
> scrolls. The first cut used 40 px a session (the batch's "about 40"), but that made the seed's unified day scroll at 1440 (1453 px
> in a 1096 px card). 24 is `B5`'s own pass threshold and fits 1440 exactly. The gap columns stay 48 px (the optional part).
> **P1:** `.header` and `.legend` wrap, and the toggle is `flex-shrink-0`. `F90`'s `label` is kept.
> **Verified** with `playwright-cli` on `/activity-tracking/unified?date=2026-10-06`, timeline view. At 390×844 all 11 sessions are
> ≥ 24 px (the narrowest is 24) and the container scrolls (1096 / 342), in Single and in Split. *Split*'s right edge equals its group's
> (145 ≤ 390). At 1440×900, web, desktop and unified are all `scrollWidth = clientWidth` (1096), with no horizontal scroll.
> **Not verified:** `B5`'s note that axis labels overprint (looked at in neither direction); bars against the axis were not checked
> by eye.
> **Re-checked 2026-10-08 after `F92`:** still passes. The 600 px grid floor scrolls inside its own container, so the narrower content
> area only widens the scroll. At 390×844 the container is 600/334 on web, desktop and Android, 1096/334 on unified, and 642/334 on
> unified in *Split*. The narrowest session is still 24 px on unified (web 100, desktop 55, Android 31). The header wraps, and the
> toggle ends at x 149, or at 362 inside a 362 header on Android, where it fits on the title row. At 1440×900 all four dashboards are
> 1096/1096, with no scroll.

- **Scope:** app-side: `src/core/activityTracking/component/timeline/TimelineGrid.vue:146,250`, `timelineUtils.ts`
  (`calculateSegmentWidths`), `ActivityTimeline.vue:48-68`.
- **Closes:** `tracking-dashboards/B5`, `tracking-dashboards/P1`.
- **Root cause:** `B5`: the grid's minimum width is a flat 600 px, and every idle gap takes a fixed 48 px out of it. With 12 gaps, the
  11 sessions share 24 px, 6 px each. `P1`: the timeline's `.header` (title, legend, `MyBtnToggle`) doesn't wrap, so the toggle is
  clipped by its own `overflow-x` group, and on All sources *Split* disappears entirely.
- **What to change:** derive the grid's minimum width from its content (gaps × 48 + sessions × a minimum session width of about
  40 px), so the timeline scrolls further rather than squeezing. Optionally narrow the gap columns below `md`. Add `flex-wrap` on
  `.header` so the toggle drops under the title and legend.
- **Do not change:** `F90`'s `label` on the toggle.
- **Verification:** both `Verify:` blocks, then the web seed day's timeline at 1440, unchanged.
- **Risk:** bars must stay aligned with the time axis. `B5` also noted axis labels overprinting; check it improves, but don't file it.

## F97. The dashboard header stays sticky at 269–377 px on a phone
> ✅ **FIXED 2026-10-07** (app-side, one change for `F94`–`F97`). The inline sticky style moved to a scoped `.dashboard-header` class,
> with `position: static` under a `max-width: 959.98px` media query (`md` is 960 in `displayThresholds`). The `z-index: 1000` only
> applies while it is sticky, and nothing else in `activityTracking` reads it. `F7`'s chip scroller is untouched.
> **Verified** with `playwright-cli` at 390×844 on `/activity-tracking?date=2026-10-06`: with the content scroller at `scrollTop = 600`,
> no element under `.v-main` has `position: sticky`. At 1440×900 the header computes `sticky` on web, desktop and unified.
> **Re-checked 2026-10-08 after `F92`:** still passes. The header computes `static` at 390×844 on all four dashboards (366 × 377 px,
> both views) and `sticky` at 1440×900 on all four, Android included this time.

- **Scope:** app-side: `src/core/activityTracking/component/ActivityDashboardHeader.vue:2-5`.
- **Closes:** `tracking-dashboards/B4`.
- **Root cause:** the sticky header (`top: 0; z-index: 1000`) wraps to six rows on a phone: 269 px with a preset, 377 px with Custom.
  Under the 64 px app bar, that pins 333–441 px, so a 422 px stacked-bars column can never be seen whole.
- **What to change:** `position: static` below `md`. That is one line and passes the `Verify:`. A collapsed summary chip that opens a
  bottom sheet is the richer option, but it isn't needed.
- **Do not change:** the sticky header at desktop width; `F7`'s chip scroller.
- **Verification:** `B4`'s `Verify:`.
- **Risk:** check that nothing else depends on its `z-index: 1000`.

## F99. The template split view has no narrow layout, and a shared link opens it on a phone anyway
> ✅ **FIXED 2026-10-08** (app-side). The recommended option. Below `md`, `TemplateSplitView` renders a `VAlert`
> (`planner.template.narrowScreenTitle` / `narrowScreenText`) instead of the grid, with an *Open {name}* link per valid URL pick and
> *Back to templates*. The drop targets used to be set up once in `onMounted`; since the panels now mount and unmount with the
> breakpoint, they're registered by a `flush: 'post'` watch on the two panel refs and torn down before each re-register.
> **Verified** with `playwright-cli` at 390×844 on `/day-planner/templates/split?left=20001&right=20002`: the alert shows,
> with links to `/day-planner/templates/20001` (Home Office), `/20002` (Office Day) and `/day-planner/templates`, and there's no page-level
> sideways scroll. After resizing to 1440×900 both `.split-panel`s render and the alert is gone, with no console errors. Cross-pane drag after a
> narrow → wide resize wasn't driven.

- **Scope:** app-side: `src/core/dayPlanner/view/TemplateSplitView.vue`.
- **Closes:** `planner-templates/B6`.
- **Root cause:** the only way in, *Edit Side by Side*, is `mdAndUp` on purpose (a drag-and-drop editor, recorded as deliberate in
  the twelfth pass). But the route isn't guarded, and `F54` put both picks in the URL. A shared link therefore opens two 171 px panes
  on a phone, with the 30M slot button outside the card's clip and task titles cut to "Morni".
- **What to change:** recommended: below `md`, render an alert saying the view needs a wider screen, with links to each template's own
  view (`/day-planner/templates/:left` and `:right`) and back to the list. The alternative is one pane at a time behind a `MyBtnToggle`.
  The alert is cheaper, and it's also honest about cross-pane drag on touch, which is unverified (`planner-day/U1`).
- **Do not change:** the desktop split (`F88`).
- **Verification:** `B6`'s `Verify:`. Either branch it lists passes.
- **Risk:** low.

## F92. `App.vue`'s 8 px phone padding doesn't cover `VRow`'s −12 px gutters, so the content scroller pans sideways
> ✅ **FIXED 2026-10-08** (app-side). `App.vue:29`'s scroller is `px-3` at every width, and `PomodoroTimerView.vue:2`'s root row is
> `style="min-width: 0"`. **A third change was needed:** the container fix alone left Timer and Manual at 394/390. The cause is the one
> `auth/P4` couldn't trace. The framework's `createAppVuetify` defaults `VCol` to `pa-2` (8 px) while `VRow` keeps −12 px gutters, so
> `ActivitySelectionForm.vue:45`'s row, nested in an 8 px column, overran it by 4 px. That row got `mx-n2`, the residue rule this
> batch allowed. The same shape in `src/_common/modules/user/view/` keeps `/login` and `/registration` at 394/390 (from 8 px over to
> 4). Under this batch's rule 1 that is a new framework batch, **`FW37`**, and `auth/P4` stays open for it.
> **Verified** with `playwright-cli` at 390×844, `main .v-container` `scrollWidth`/`clientWidth`: `/user/settings` 390/390,
> `/forgotten-password` 390/390 (signed out), the four dashboards (`/activity-tracking`, `/unified`, `/desktop`, `/android`) 390/390
> with controls from 12, and the three capture views 390/390 with every field at 8–382. At 1440×900 each of these routes is
> 1152/1152. `vue-tsc --build --force`: 0.
> **Not verified:** the `/day-planner/:date` spot-check. `POST /api/planner-task/filter` returned 500 on 2026-10-08, so the grid didn't
> render. `/day-planner/templates/20001` (same `DayPlanner`) rendered normally at 390.

- **Scope:** app-side: `src/App.vue:29`, `src/core/activityHistory/component/PomodoroTimerView.vue:2`.
- **Closes:** `auth/P4`, `tracking-dashboards/P2`, `history-capture/P2`: the same defect seen from three routes (merged, §129).
- **Root cause:** below `md` the content container is `px-2` (8 px), and a gutter `VRow` has −12 px margins, so each gutter row level
  overruns by 4 px. The container is `overflow-y-auto`, which computes `overflow-x: auto` as well, so the overrun becomes a sideways pan
  rather than a clip. `documentElement.scrollWidth` stays 390, which is why page-level checks miss it. Pomodoro has a second cause: its
  `noGutters` root row is a flex item of the `d-flex` container and keeps `min-width: auto`, so it grows to its content's 384 px.
- **What to change:** `px-2 px-md-3` → `px-3` on `App.vue:29`, and `min-width: 0` (or `w-100`) on `PomodoroTimerView.vue:2`'s root row.
  Then re-measure `/login` and `/registration`: `auth/P4` says their nested rows add 4 px more than the arithmetic predicts, and nobody
  traced why. Those rows live in `src/_common/modules/user/view/`, so any residue there is a **new framework batch**, not part of this
  one (rule 1).
- **Do not change:** don't add per-view `noGutters` as `history-capture/P2` suggests. The container fix covers those views, and
  `noGutters` belongs only where a residue survives it.
- **Verification:** the three `Verify:` blocks, covering every route they name (four auth/settings routes, three capture views, four
  dashboards). Also spot-check `/day-planner/:date` at 390 for anything the 4 px of extra side padding pushed over.
- **Risk:** every page gets 4 px more padding per side below `md`. Land this **before** `F91` and `F93`, whose pass conditions measure
  the same scroller.

## F93. Four header rows that never wrap push their controls off-screen and pan the page sideways
> ✅ **FIXED 2026-10-08** (app-side, landed right after `F92`).
> - **`ActivitySettingsView`:** the outer row is `flex-wrap flex-md-nowrap … gr-2`, and the filter group is
>   `ml-md-14 flex-1-1-100 flex-md-1-1`. Below `md` it fills its own line, and from `md` up the row can't wrap, so `F22`'s
>   wrap-inside-the-group behaviour is unchanged.
> - **`TodoListToolbar`:** two groups in a wrapping row. Back + *Add* are `flex-1-1-100 flex-sm-1-1`, and Change order / Focus /
>   Undo wrap among themselves. This mirrors `RoutineToDoListView`.
> - **`TemplateListView`:** both header rows wrap, and the sort select's `min-width: 170px` is bound to `smAndUp`.
> - **`HistoryPeriodBanner`:** the inner row wraps, and `.myAlert` gets `max-width: 100%` beside `F26`'s `flex: 0 0 auto`.
>
> **Verified** with `playwright-cli`, `main .v-container` 390/390 on every route at 390×844:
> - Activities: the filters sit under the tabs at 12–378. Roles' two fields are 179 px each, where they used to be 14 px.
> - `/todo-list/13001` and `/13002`: the toolbar spans 8–382, with Undo at 303–367.
> - Templates: the toolbar sits under the title, with *Add Template* whole at 165–316.
> - Banner: 8–382 and two lines on `/activity-history` (chip wrapped), 16–372 on `/detail`.
>
> At 1280 and 1440 the Activities filters stay beside the tabs (56 px gap), and the Categories label isn't clipped (77/77, so `F22`
> holds). The templates header stays on one line, and the banner is the same one-line 296–726 (so `F26`/`B1` hold). **One deliberate
> difference:** at 1280/1440 the to-do toolbar now wraps to two lines. Its column is 464 px, and the old single row was 496 px. Measured
> by reconstructing the old layout in the DOM, it already overran the column by 16 px on each side, so wrapping is the honest fit, not
> a regression. `vue-tsc --build --force`: 0.
> **Not verified:** `todo-lists/B10` step 2, the first ⋮ button's `right`, and the reorder-mode toolbar. `GET /api/todo-list-item`
> returned 500 on 2026-10-08, so no rows rendered, and a loading overlay blocked *Change order*. Re-run both once the API serves items.

- **Scope:** app-side: `src/core/activity/view/ActivitySettingsView.vue:3-14`, `src/core/todoList/component/TodoListToolbar.vue:2`,
  `src/core/dayPlanner/view/TemplateListView.vue:3-58`, `src/core/historyDashboard/component/summaryCards/HistoryPeriodBanner.vue:11,72-74`.
- **Closes:** `activity-settings/B10`, `todo-lists/B10`, `planner-templates/P4`, `history-review/P4`.
- **Root cause:** each of the four files has a horizontal `d-flex` row of content-width controls with no `flex-wrap`: tabs plus a
  filter group, five toolbar buttons, title plus sort select plus *Add Template*, banner text plus a %-change chip. `App.vue`'s container
  computes `overflow-x: auto`, so a row that's too wide doesn't clip. It widens the scroller, and the whole view pans sideways: 90 px
  on a to-do list, 222 px on Activities, where each row's ⋮ (the only way to Edit or Delete) starts off-screen. On Roles and Categories
  the same row can't overflow, so it squeezes its two text fields to 14 px instead. Two of the four were shaped by fixes verified only
  at desktop width (§130): `F22` (tabs `flex-0-0`, filters "wrap *beside* them") and `F26` (the banner sized to one line of its own
  content).
- **What to change:**
  - `ActivitySettingsView`: `flex-wrap` on the outer row, `ml-14` → `ml-md-14`, and below `md` the filter group takes its own
    full-width line under the tabs.
  - `TodoListToolbar`: `flex-wrap`, with *Add* on its own `flex-grow-1` row below `sm`, the way `RoutineToDoListView` already splits
    the same buttons over two rows. Check reorder mode too, because *Finish reordering* is longer.
  - `TemplateListView`: `flex-wrap` on the header row so the toolbar sits under the title, and the sort select's `min-width` only at
    `smAndUp`.
  - `HistoryPeriodBanner`: `flex-wrap` on the inner row at `:11`, plus `max-width: 100%` on `.myAlert`.
- **Do not change:** `F22`'s `flex-0-0` on `VTabs` and the comboboxes' `min-width`; `F26`'s `flex: 0 0 auto` on the banner; the
  to-do item rows (`todo-lists/B10`: "don't shrink the item rows").
- **Verification:** the four `Verify:` blocks. Then, at 1280 and 1440, re-check the earlier fixes: `F22` (the Categories label isn't
  clipped) and `F26` (the banner is legible, per `history-review/B1`'s `Verify:`).
- **Risk:** low. Each row must stay a single line wherever it fits.

## F91. Viewport-locked views clip or crush their own cards on a phone
> ✅ **FIXED 2026-10-08** (app-side). One rule, gated with `useDisplay().mdAndUp` in every file. A scoped media query (`F97`'s
> choice) can't take off Vuetify's `h-100`, which is `!important`, so the class bindings won.
> - **Tool 1, every width:** `flex-shrink-0` on `ConstraintBar`, the empty-state card and `WeatherLocationHint` in `PickerView`, and
>   on `<ActivitySourceFilter>`. `DismissibleMappingHint` went from `flex-grow-0` to `flex-0-0` for the same reason: `X5` named its
>   shrink, and at 1440 it was 32 px tall. It's 76 px now.
> - **Tool 2, below `md`:** both settings views drop `h-100` from the wrapper and the card. The card then gets `.natural-height`, whose
>   scoped `:deep(.v-table__wrapper) { height: auto !important }` gives the framework table its rows' height in place of `FW4`'s
>   `height: 0` (the *Risk* line). `DayPlanner`'s card is `h-100` only at `mdAndUp`. `RoutineToDoListView`'s row drops
>   `flex-grow-1 overflow-hidden` and `min-height: 0`, and its columns drop `h-100`.
> - **Tool 3:** `RoutineGroupCard`'s item area is `flex-1-1` + `min-height: 0`. The basis is `auto`, not the batch's `0`, so an
>   auto-height card below `md` doesn't size the area to nothing. A new `BaseToDoList` prop, `naturalHeight`, drops the item
>   scroller's `height: 0`. The card passes `!mdAndUp`, so on a phone the list shows all its items (it was a 159 px window) and the
>   page scrolls.
> - **Found at 1440 and fixed in the same change:** `DayPlanner`'s card overran its own clip at desktop width too. It measured 832/804
>   on the day, 836/804 on a template and 836/728 in each split pane, which hid up to 108 px of the grid's bottom, so `B9`'s pass
>   condition failed at 1440. The `VCardText` got `min-height: 0`, and the 600 px grid now shrinks to the space the header leaves
>   (568 px on the day, 488 per pane). This is `B9`'s own second suggested fix. Nothing else in the desktop layout moved.
> - **Not changed:** `TemplateSplitView`. `F99` landed in parallel and renders an alert instead of the panes below `md`, so `B9`'s
>   split-pane route has no panes left to clip at 390.
>
> **Verified** with `playwright-cli` (form sign-in, own `-s=` session):
> - **`X2` at 390, two suggestions:** `ConstraintBar` 325/325, and "A group" is hit-testable. With *More constraints* open it's 437/437,
>   at `scrollTop` 0, with "Time available" in view. At 1440: 156/156. The three-card case needs a mocked grid and wasn't re-run.
> - **`X5` at 390, all four routes, after `mousewheel 0 2000`:** the page scroller moved (1473/780 on desktop distinctEntries), and the
>   card is `scrollHeight == clientHeight` on all four. Save and the first row are in view and hit-testable on both distinctEntries
>   tabs. On both mappings tabs the row's Edit and Delete are hit-testable. The row is wider than the screen, so its geometric centre is
>   off-screen and was checked at x 100. At 1440 the card is still viewport-locked (80–884), and the table wrapper is 428 px (471
>   before, because the hint now keeps its full height).
> - **`B9`:** `[true, true]` on the day and on `/day-planner/templates/20001`, at 390 and at 1440. The last label in view is 00:00 on the
>   day (it was 23:10), and 23:00 on the template's 07:00–23:00 day. Both split panes are `[true, true]` at 1440. Step 3
>   (`/day-planner/task/16002`) couldn't run, because task 16002 no longer exists ("Task not found"). The card at 390 is 931/931, so
>   a focus scroll has nothing left to scroll.
> - **`B12` at 390:** the heatmap is 434–474 in a card ending at 482. It's hit-testable and opens the *Daily* history dialog, and *Hide
>   done* is hit-testable too. The list is 536/536. At 1440 all four groups' heatmaps sit inside their cards (868 against 876), which
>   also clears §132's fourth group.
> - **`B6`:** all three chips are hit-testable and their card is whole (206 for 204 at 390), at both widths. *Desktop* writes
>   `?sources=webExtension,android`.
> - `vue-tsc --build --force`: 0. eslint on the touched files: 0.
>
> **Not verified:** drag-to-move and drag-to-create on the grid (the *Risk* line). `POST /api/planner-task/filter` still returned 500
> on 2026-10-08, so the day had no task blocks, and a drag on the template would write. Touch-scrolling the day is `F108`'s blocker,
> which is still open: below `md` the page scrolls now, but a swipe over the task column still doesn't (`B10`).
> **Found on the way, not filed:** after one visit, a full load of `/day-planner/:date` can render a blank page. The `dayPlanner`
> store's persisted `viewedDate` comes back from `sessionStorage` as an ISO string, and `ReplanTodayBanner` (FO4, `d0b24eda`) passes it
> to `formatDateForApi`, which throws `d.getFullYear is not a function`. Clearing `sessionStorage.dayPlanner` brings the page back. It
> doesn't happen on every load: one load with the string persisted rendered normally.

- **Scope:** app-side: `src/core/leisure/view/PickerView.vue`, `src/core/activityTracking/view/{Desktop,Android}SettingsView.vue`,
  `src/core/activityTracking/view/UnifiedActivityDashboard.vue`, `src/core/dayPlanner/component/DayPlanner.vue`,
  `src/core/todoList/view/RoutineToDoListView.vue` + `component/routine/RoutineGroupCard.vue`. **Not** `App.vue`.
- **Closes:** `leisure-backlog-picker/X2` (**blocker**), `tracking-settings/X5` (**blocker**), `planner-day/B9` (all three of its
  routes: the day, `/day-planner/templates/20001`, both split panes), `todo-routine/B12`, `tracking-dashboards/B6`.
- **Root cause:** `App.vue:29`'s content container is `h-100 d-flex … overflow-y-auto` inside a `VMain` locked to `100dvh`. That
  makes every routed view's root a flex item stretched to a definite height, 780 px at 390×844. These five views lay themselves out as
  full-height flex columns. A `VCard` is `overflow: hidden`, and as a flex item that lets it shrink to `min-height: 0`. One mechanism
  produces two outcomes:
  - **A card that sits among several children shrinks below its content.** The picker's `ConstraintBar` drops to 32 of 325 px with
    three suggestions showing. The unified `ActivitySourceFilter` is 26 px at **every** width.
  - **A card that is itself `h-100` clips** whatever the `md` stacking makes taller than the viewport: the settings card's Save and
    table, the day card's last 40 minutes, the routine card's footer. Because the card clips, the page scroller has nothing to scroll.

  Desktop works only because the content happens to fit. Read this pass: `App.vue:28-33`, `PickerView.vue:2`,
  `DesktopSettingsView.vue:2-6`, `AndroidSettingsView.vue:2,5`, `UnifiedActivityDashboard.vue:2`, `DayPlanner.vue:4,162-166`,
  `RoutineToDoListView.vue:68-73` and `RoutineGroupCard.vue:2,11`.
- **What to change:** apply one rule to all five: *below `md`, a view does not lock itself to the viewport, and the page scrolls.* There
  are three tools:
  1. **A card that must keep its content gets `flex-shrink-0`, at every width:** `ConstraintBar` and the empty-state card in
     `PickerView`, and `<ActivitySourceFilter>` in `UnifiedActivityDashboard.vue`. `tracking-dashboards/B6` fails at 1440 as well, so
     don't gate it on a breakpoint.
  2. **A full-height card releases its height below `md`:**
     - `DesktopSettingsView` and `AndroidSettingsView`: `h-100` on the wrapper and the card only at `mdAndUp`, with the table at its
       natural height below that.
     - `DayPlanner.vue:4`'s card: `h-100` only at `mdAndUp`. The 500 px grid below 600 px then shows in full and the page scrolls.
       Nothing overflows the card any more, so the focus scroll that hid the header for good goes away too.
     - `RoutineToDoListView`'s board row: `overflow-hidden` and `flex-grow-1` only at `mdAndUp`.
  3. **`RoutineGroupCard.vue:11`'s item area changes from `h-100` to `flex: 1 1 0; min-height: 0`, at every width.** That alone keeps
     the footer inside the card, and `B12` itself says one of the four groups clips at 1440 as well (§132).

  Vuetify 3 has no responsive height helper. Gate with `useDisplay().mdAndUp` or with a scoped media query; pick one and use it in all
  five views.
- **Do not change:** `App.vue:29`. Every other view relies on `h-100` resolving against it, and `X2` warns against exactly this. Also
  leave the desktop layouts alone: `F12` and `F16` verified the settings card at 1440, and `F88` gave the planner its own-width layout.
- **Verification:** the `Verify:` blocks of all five findings, with `planner-day/B9`'s run on all three of its routes. Then confirm each
  view is unchanged at 1440×900, and that `tracking-dashboards/B6` passes there too.
- **Risk:** `FW4` says `DataTable`/`BasicTable` need a definite-height flex parent. Wherever the settings card releases its height, the
  table needs a natural height of its own, or it collapses to 0 px (the `F12` shape). On the planner, once the card stops clipping,
  check that drag-to-move and drag-to-create still behave on the grid.

## F108. A touch swipe on the planner's task column creates or moves a task instead of scrolling
> ✅ **FIXED 2026-10-08** (app-side, landed right after `F91`; the two were tested together on the same grid).
> - **`PlannerTasksColumn`:** `.tasks-column` is `touch-action: pan-y`, plus `-webkit-touch-callout: none`.
> - **`usePlannerPointerInteractions`, touch only:** a `pointerdown` from touch starts nothing. It records a pending press, and a
>   400 ms timer (`LONG_PRESS_DELAY`) arms it, unless the finger moves past `MOVEMENT_THRESHOLD` first or the browser takes the touch
>   as a scroll (`pointercancel`). Once armed, the press runs the mouse's own gesture code, so drag, drag-to-create and resize behave as
>   they do with a mouse, auto-scroll included. A non-passive `touchmove` listener cancels the scroll for an armed press, and
>   `contextmenu` is suppressed while a press is pending or armed. `pointercancel` drops whatever the press had begun and redraws a
>   moved or resized task at its original span. Nothing is committed.
> - **What a tap does on touch:** on a task, the same as a click (select, and a double tap edits). On an empty slot, nothing,
>   because the tap that stops a fling lands on one. A long press opens *Add New Task*.
> - **Resize handles wait too.** A handle is 8 px tall and sits on every block, so a scrolling finger hits one as easily as the block.
>   A tap on a handle selects the task. The reason is in the `handleResizeStart` comment.
> - **Clipboard placement, touch path only:** a touch in placement mode used to place on `pointerdown`, so a swipe would have written
>   too. Now a tap places the tasks, and since touch has no hover, the conflict check runs at the tapped slot. A conflict shows the new
>   `planner.feedback.placementConflict` snackbar (sk + en) and places nothing. The mouse's hover-and-click path is unchanged.
> - The mouse path is otherwise reorganised but not changed: the click logic is `handleTaskClick`, the hover preview is
>   `updateClipboardPreview`, and the gesture starts are `startTaskDrag` / `startCreation` / `startResize`.
>
> **Verified** with `playwright-cli` and CDP touch emulation (`maxTouchPoints` 5, `Input.dispatchTouchEvent`), with every
> non-GET write to `/api/(template-)?planner-task` routed to `abort()`. The scripts are `.playwright-cli/f108-touch.js`,
> `f108-touch-day.js` and `f108-mouse.js` (gitignored).
> - **`/day-planner/templates/20001` at 390:**
>   - A 100 px swipe up scrolls the grid 104 px from an empty slot and from task 20101, with no dialog and no write. `B10`'s pass
>     condition holds. The time-column control scrolls 174 px.
>   - A press held 200 ms that then swipes still scrolls (105 px).
>   - A tap on an empty slot does nothing.
>   - A tap on the task selects it, a second tap deselects it, and a double tap opens *Edit Template Task*.
>   - A 600 ms long press on an empty slot opens *Add New Template Task*, with or without a drag after it.
>   - A long press plus a 60 px drag on the task fires `PATCH /api/template-planner-task/20101` with the grid still (`scrollTop` 0 → 0).
>     So does a 40 px drag on its bottom resize handle.
>   - A long press released without moving selects the task.
> - **`/day-planner/06-10-2026` at 390:** a swipe scrolls the grid 107 px, a tap does nothing, and a long press opens *Add New Task*.
>   The day had no task blocks, because `POST /api/planner-task/filter` still returned 500, so the task cases ran on the template only.
> - **Mouse at 1440×900** on the template, `maxTouchPoints` 0: drag-to-move and bottom-handle resize each fire the `PATCH`;
>   drag-to-create and a single click on an empty slot open *Add New Template Task*; double-click opens edit. All unchanged.
> - `vue-tsc --build --force`: 0. eslint on the touched files: 0.
>
> **Not verified:**
> - A real device. Emulated touch doesn't show iOS's callout or Android's long-press context menu, and doesn't show whether the
>   10 ms `navigator.vibrate` on arming is felt.
> - Clipboard placement by touch: no clipboard was set up, and a placement writes.
> - Scroll chaining from the grid to the page once the grid reaches its end, which `F91` made possible below `md`.
> - The split panes, which are desktop-only since `F99`.

- **Scope:** app-side: `src/core/dayPlanner/component/PlannerTasksColumn.vue:181-188` (`.tasks-column { touch-action: none }`),
  `src/core/dayPlanner/composable/usePlannerPointerInteractions.ts:74-113,238-355`. This covers every `DayPlanner` mount: the day, the
  template view and the split panes (the split view is desktop-only since `F99`).
- **Closes:** `planner-day/B10` (**blocker**; it was `U1`, settled live on 2026-10-08).
- **Root cause:** `touch-action: none` across 76 % of the grid means the browser never takes a vertical swipe as a scroll and never
  sends `pointercancel`. Every touch is a `pointerdown` the composable acts on. On an empty slot it starts a creation preview, and
  `pointerup` opens *Add New Task* (`:350-353`). On a task block it starts a drag, which saves a move once it passes 5 px
  (`MOVEMENT_THRESHOLD`, `:262`). Measured with emulated touch on `/day-planner/templates/20001`: the grid's `scrollTop` stayed 0 for
  both swipes, the dialog opened, and `PATCH /api/template-planner-task/20101` fired. The same swipe on the 80 px time column scrolled
  181 px.
- **What to change:** `touch-action: pan-y` on `.tasks-column`, so a vertical swipe scrolls. For `pointerType === 'touch'`, arm
  drag/create/resize only after a long-press (~400 ms with < `MOVEMENT_THRESHOLD` movement). Once armed, take the gesture: set
  `touch-action: none` for the rest of the gesture, or call `preventDefault` on `touchmove`, so the drag doesn't also scroll. A
  `pointercancel` before arming (the browser started scrolling) must clear the pending preview and drag state, the same as a `pointerup`
  that didn't move. Mouse and pen keep today's immediate behaviour. Resize handles: decide whether a touch on the handle arms at once
  (it's a deliberate target) or also waits, and say which in the code comment.
- **Do not change:** the mouse path, including `F88`'s own-width layout, the double-click to edit, clipboard placement, the keyboard
  contract (`usePlannerKeyboard`) and the auto-scroll while dragging.
- **Verification:** `B10`'s `Verify:` on `/day-planner/templates/20001` and on `/day-planner/:date` (once `POST /api/planner-task/filter`
  stops 500ing). Then, at 1440 with a mouse: drag-to-move, drag-to-create and resize, unchanged.
- **Risk:** med. Land it **with or before `F91`**: `F91` releases the same card's height below `md` (`planner-day/B9`), and both change
  how the grid scrolls on a phone. Test them together. A long-press can also trigger the OS context menu or text selection.
  `user-select: none` is already set; add `-webkit-touch-callout: none` if iOS shows a callout.

## FW33. `CalendarGrid` at phone width: misaligned headers, a toolbar that doesn't wrap, a 263 px window
> ✅ **FIXED 2026-10-08** (framework `8cf8079`, pointer bumped in the app's `59ce7415` together with `F101`). It goes further than
> *What to change*, for two reasons. First, the header carried a fixed `padding-right: 16px` for an assumed scrollbar, and the
> scrollbar measured **0 px** (overlay), so `shortName` alone would still have left every column up to 16 px out. The headers are
> now the sticky first row of `.calendar-body` (`z-index: 11`, above a hovered cell's 10), so they share the body's width with or
> without a scrollbar. Second, both rows use `repeat(n, minmax(0, 1fr))`, so no content can widen a column. Full names from `md`
> up, not `sm`: between 600 and 959 px a column is 75–130 px and "Wednesday" needs about 90. The toolbar group is `flex-wrap`, and
> the select's `minWidth` is `smAndUp`-only. Also in this commit, the today ring was the overflow `planner-day/P4` measured (71/51),
> and it sits in the framework's `CalendarDayCellHeader`. Below `sm` that header now shows the day of the month only, with a 2 px
> ring, 4 px padding and wrapping badges. The cell's `aria-label` still carries the full date.
> **Found and fixed here, unfiled:** a `.calendar-header, .calendar-week { --calendar-columns: 7 }` rule overrode the container's
> inline count, so *Workdays* drew five days in seven columns, with two blank ones (measured at 1440: 7 tracks of 161 px under
> five headers). The rule was deleted; *Workdays* now draws 5 tracks at 390 and 1440. Documented in `components.md` → `CalendarGrid`.
> **Verified** with `playwright-cli` at 390, 768 and 1440 on `/day-planner`, and at 390 and 1440 on `/activity-history/calendar`:
> every `.day-header` matches its column to 0 px, nothing in the toolbar ends past `innerWidth`, both toolbar `.v-field`s are 40 px
> tall (the select was 242), and no `.day-cell` overflows. At 390 the planner's body window went from 286 to 335 px. Screenshot
> checked at 390. `vue-tsc --build --force`: 0. The e2e spec's full-name header check (`planner-day.draft.spec.ts:84`) runs at
> desktop width, where full names still render. The spec wasn't run.
> **Not verified:** the *Weekend* view, a day-type or holiday badge at 390 (none in this month's seed data), and Safari.
> **Seen, not fixed, unfiled:** `MonthYearPicker` still wraps its › chevron onto a line of its own at 390, so the toolbar is
> ~80 px taller than it needs to be. On `/activity-history/calendar` at 390 all 31 `HistoryDayCellContent`s overflow inside the cell
> (the grid itself passes). That is the history twin of `F101`, app-side in `historyDashboard`.

- **Scope:** **[framework]** `src/_common/component/calendar/CalendarGrid.vue:15-31,46-55,363-370`. The app half (the cell contents)
  is `F101` (rule 1).
- **Closes:** `planner-day/P3`, which already lists `/activity-history/calendar` in its **Where**.
- **Root cause:** the headers render `day.name` and never use the `shortName` that `allDays` already computes, so the header grid is
  400 px over a 372 px body. The toolbar (`DateRangePicker` + a `minWidth="210px"` select) doesn't wrap, so the select stretches to
  242 px tall, and the grid body is left 263 px.
- **What to change:** render `shortName` below `sm`, add `flex-wrap` on the toolbar, and apply the select's `minWidth` only at
  `smAndUp`.
- **Do not change:** `FW6`'s day-cell semantics, `FW16`'s models.
- **Verification:** `P3`'s `Verify:` on both routes. At 1440 the headers keep their full names.

## F101. Month-grid day cells overflow their 52 px
> ✅ **FIXED 2026-10-08** (app `59ce7415`, which also bumps the pointer for `FW33`). `CellTaskProgress` has a new below-`sm` branch:
> a bold, colour-coded `N/M` over the 4 px bar, and nothing on a day with no tasks (rather than "0/0"). `CalendarDayCellContent`
> drops the clock and location row below `sm`, and the template, weather and notes rows with it. Each was a word or two per line
> in a 44 px column. One wrapping row of their icons stands in, and the padding drops to 4 px. The task-name tooltip stays
> `smAndUp`-only in effect: the compact branch has none, because a tooltip on a non-focusable child of a `role="button"` cell
> carries nothing on touch.
> **Also fixed, same component:** from `sm` up, the "N/M tasks ▬ %" row overran its cell at 768 (115–121 px in 105). It now
> wraps (the bar is `flex: 1 1 16px`). At 1440 it stays on one line (bars 29–36 px), and at 1280 and 768 the bar and the % drop
> under the count.
> **Verified** with `playwright-cli` on `/day-planner`: at 390 `P4`'s `Verify:` passes, all 31 `.day-cell`s at
> `scrollWidth <= clientWidth` (today was 71/51), and every `.cell-content` too (31 overflowed before). The cells read
> `6 1/3`, `7 0/2`, `9 0/2`, and the screenshot shows the bars and the mini timelines inside. Zero overflow at 768, 1280 and 1440, and
> in *Workdays* at 390 and 1440. `vue-tsc --build --force`: 0; lint clean.
> **Not verified:** a day with location, template, weather or notes at 390, so the icon row is unrendered in the seed's October.

- **Scope:** app-side: `src/core/dayPlanner/component/calendar/CellTaskProgress.vue:65-95` (the below-`sm` branch). **The cell lives
  in the framework's `CalendarGrid`, whose headers and toolbar are `FW33`.** Rule 1 makes this two batches; they're independent and can
  land in either order.
- **Closes:** `planner-day/P4`.
- **Root cause:** the below-`sm` branch still renders the clock range and "N/M tasks" + "%", 71 px of content in a 52 px cell
  (`overflow: hidden`), so the cell reads "0/2 task" and loses its percentage. The task-name tooltip is dropped below 600 px
  (`v-if="smAndUp"`), so nothing else carries the information.
- **What to change:** below `sm`, show a compact `N/M` (or only the progress bar) and drop the clock row.
- **Verification:** `P4`'s `Verify:`.

## FW34. The icon picker keeps 7 columns at any width
> ✅ **FIXED 2026-10-08, closed 2026-10-11** (framework `8816d7f`, pointer bumped in the app's `6472b288` together with
> `FW29`–`FW31`). The fix landed on 2026-10-08, but the queue wasn't closed or browser-verified until 2026-10-11. It doesn't
> follow *What to change*: the grid is virtualised one row per item, so `auto-fill` would wrap a row onto two lines. Instead,
> tiles per row are computed from the scroller's measured width (72 px minimum, 8 px gap, capped at 7), and each name carries a
> `title`. Documented in `components.md` → `IconPickerDialog`.
> **Verified** with `playwright-cli` at 390 on `/todo-list` → *New list* → Icon: 3 columns, every name whole, nothing past the
> dialog (screenshot checked).
> **Not verified:** the 7-column cap at 1440. The measuring selector matched nothing, and it wasn't re-run.

- **Scope:** **[framework]** `src/_common/component/inputs/IconPickerDialog.vue:251-256`.
- **Closes:** `todo-lists/P2`.
- **What to change:** `grid-template-columns: repeat(auto-fill, minmax(72px, 1fr))`.
- **Verification:** `P2`'s `Verify:`. At 1440 the grid is unchanged.

## FW35. The password show/hide toggle is a 20×20 tap target
> ✅ **FIXED 2026-10-08, closed 2026-10-11** (framework `8816d7f`, app `6472b288`). The fix is the recommended one: `density="compact"`
> is gone from the `#append-inner` button. The accessible name (`FW7`) is unchanged.
> **Verified** with `playwright-cli` at 390 on `/login`, signed out: the button is 40×40, "Show password".
> **Not verified:** the Change password and Change e-mail dialogs and `/registration`. They render the same component.

- **Scope:** **[framework]** `src/_common/modules/user/component/MyPasswordInput.vue:11-19`.
- **Closes:** `user-settings/A2` (`/login`, `/registration`, the change-password and change-e-mail dialogs).
- **What to change:** drop `density="compact"` (or set `size="default"`) on the `#append-inner` button. The 56 px field has room for a
  36–40 px button.
- **Do not change:** `FW7`'s accessible name.
- **Verification:** `A2`'s `Verify:`.

## FW36. Active-session rows clamp their subtitle to one line, hiding "Last used"
> ✅ **FIXED 2026-10-08, closed 2026-10-11** (framework `8816d7f`, app `6472b288`). It took the third option: the metadata moved
> from `#subtitle`, which `VListItem` clamps, to the default slot, so it wraps. The uncommitted chip edit this body warned about was
> no longer in the submodule on 2026-10-11 (clean `git status`).
> **Verified** with `playwright-cli` at 390 on `/user/settings`: the row reads "… · Signed in: … · Last used: 3 minutes ago" in
> full, 230 px wide, with `scrollWidth <= clientWidth`.

- **Scope:** **[framework]** `src/_common/modules/user/component/settings/SessionsSection.vue:51-58`. At the x4 run the submodule held
  an uncommitted edit to this file (a chip), so check the submodule's own `git status` first.
- **Closes:** `user-settings/P2`.
- **What to change:** `lines="two"` on the `VList` (or `text-wrap` on the subtitle), or split the metadata so "Last used" gets its own
  line below `sm`.
- **Verification:** `P2`'s `Verify:`.

## FW37. The `VCol` default is `pa-2`, but `VRow` keeps −12 px gutters: every row nested in a column overruns it by 4 px
> ✅ **FIXED 2026-10-11** (framework and app, uncommitted at the time of writing). Option 1: `framework.css` gets
> `.v-row:not(.v-row--no-gutters):not(.v-row--dense) { margin-inline: -8px }`, with a comment, and `createAppVuetify.ts`'s `VCol`
> default points at it. `SETUP.md` §6 documents the pairing (and now says five corrections, not four). `ActivitySelectionForm`'s
> `mx-n2` from `F92` is gone, now redundant.
> **Found here: this app never imported `framework.css`.** `main.ts` loaded only `src/assets/main.css` → `base.css`, an older
> hand-copy of part of it. So the rule alone would have reached nothing, and the app had also been missing four other framework
> corrections: the `--v-field-*` colours, the autofill repaint, three-line list-item alignment and the fixed-header rule. The
> operator chose to adopt it. `main.ts` now imports `@/_common/assets/framework.css` before `main.css`, as `SETUP.md` says, and
> `base.css` is down to what's app-specific: `body`'s `color: white !important` and font stack, `--v-list-prepend-gap` and
> `.is-hidden`.
> **Verified** with `playwright-cli`. At 390, `main .v-container` has `scrollWidth == clientWidth` on `/login`, `/registration`,
> `/forgotten-password`, `/user/settings`, `/` and all of `F92`'s routes (`/activity-tracking/{unified,desktop,android}`,
> `/activity-history`, `…/pomodoro`, `…/stopwatch`, `…/timer`, `…/manual`). `/login` and `/registration` went from 394/390 with
> controls at 8–382 to 390/390 with controls at 12–378. `/` and `/activity-history/manual` were screenshot-checked at 1440 in the
> light and dark themes; fields read correctly in both, with no console errors. `vue-tsc --build --force`: 0; eslint clean on
> the touched files.
> **Not verified:** a dense grid of cards at 1440 measured edge to edge (only screenshot-checked), and Safari.
> **Seen, not fixed, unfiled:** on `/` in the light theme, the routine widget's item titles are white on a light card. That comes
> from a hard-coded `text-white` class, not from this change: the colour is the same with `framework.css` disabled.

- **Scope:** **[framework]** `src/_common/bootstrap/createAppVuetify.ts:48` (`VCol: { class: 'pa-2' }`) and, depending on the option,
  `src/_common/modules/user/view/LoginView.vue:31` and `RegistrationView.vue:62`.
- **Closes:** `auth/P4`, the remainder `F92` left. At 390 `/login` and `/registration` measure 394/390, with controls at 8–382.
- **Root cause:** found by `F92`'s re-measure on 2026-10-08. The framework's component default gives every `VCol` 8 px of padding, but
  `VRow` keeps Vuetify's −12 px margins, which are sized for a 12 px column. A row nested inside a column overruns that column by
  4 px per level, and the scroller turns it into a sideways pan.
- **What to change:** option 1 (chosen) was one framework style rule sizing the default gutter to the default padding. Option 2 was
  dropping `pa-2` (too broad). Option 3 was fixing only the two `modules/user/view/` rows (leaves the trap armed).
- **Do not change:** `App.vue`'s `px-3` (`F92`).
- **Verification:** `auth/P4`'s `Verify:` on all four routes, then `F92`'s routes at 390, then 1440.

> **`F100`, `F103`–`F107` closed together on 2026-10-11 as one sweep**, the way `F80`–`F83` did. They share one commit, one
> `playwright-cli` session at 390×844 and 1440×900, `vue-tsc --build --force`: 0 and `npm run lint`: 0. `F102` stays open: it is a
> delete-confirmation change, not layout.

## F100. Two pairs of side-by-side form fields never stack
> ✅ **FIXED 2026-10-11.** Neither pair was a `VRow`, so *What to change*'s `cols="12" sm="6"` became `flex-column flex-sm-row` on
> the two `d-flex` rows. In `CalendarDetailsDialog`, Day Type's `maxWidth="200px"` now applies only from `sm` up (`useDisplay`);
> stacked, it would have sat at 200 px between full-width fields.
> **Verified** with `playwright-cli`. `leisure-backlog-picker/P2`: at 390 Min and Max people stack at 310 px each, and the "Max
> people" label is `scrollWidth 74 / clientWidth 74`; at 1440 they stay side by side at 258 px. `planner-day/P5`: at 390 Location's
> `.v-field` is 273 px on its own row (pass: ≥ 150); at 1440 Day Type is 200 px and Location 336 px on one row, as before.
> **Not verified:** the edit dialog's Min/Max row (same component).

- **Scope:** app-side: `src/core/leisure/component/backlog/NewBacklogProfileForm.vue:58-67` (Min/Max people),
  `src/core/dayPlanner/component/normal/CalendarDetailsDialog.vue:35-49` (Day Type / Location).
- **Closes:** `leisure-backlog-picker/P2`, `planner-day/P5`.
- **Root cause:** each pair sits side by side at every width. In a 342 px dialog the second field's label truncates: "Max …" (a
  69 px input behind the number buttons) and "L…".
- **What to change:** `cols="12" sm="6"` on both pairs.
- **Verification:** both `Verify:` blocks.

## F103. Reorder mode's drag handle is hover-only, and white on a light card
> ✅ **FIXED 2026-10-11.** `@media (hover: none) { .drag-handle { opacity: 1 } }` is copied from `TodoListCategoryPanel`. For
> the colour, `color="white"` is dropped: the icon inherits the card's text colour, `rgba(31, 41, 55, 0.87)` in the light theme.
> **Verified** with `playwright-cli` on both routes at 390, in reorder mode with the mouse moved to (5, 830): every handle is at
> opacity 1 under `(hover: none)` (7 on `/routine-todo-list`, 8 on `/todo-list/13001`), and opacity 0 with a hover-capable pointer,
> so desktop keeps its hover-to-reveal. Both lists exited reorder mode cleanly.
> **How the media query was reached:** CDP's `Emulation.setEmulatedMedia` with a `hover: none` feature does **not** take in this
> Chromium (`matchMedia('(hover: none)')` stays `false`). `Emulation.setTouchEmulationEnabled` (`maxTouchPoints: 5`) does, and
> turns on `(pointer: coarse)` with it. Under touch emulation Playwright's `click()` lands, but then times out on its own
> post-action wait, so the mode switches were pressed with a DOM `click()` from `evaluate`.
> **Not verified:** the dark theme, and a real device. `todo-lists/U4` (whether touch drag works at all) is unchanged.

- **Scope:** app-side: `src/core/todoList/component/BaseTodoListItem.vue:429-447`.
- **Closes:** `todo-lists/P3`. Whether touch dragging works at all is `todo-lists/U4` (*Needs verification*); land this either way.
- **Root cause:** `.drag-handle` is `opacity: 0` unless hovered, and a phone has no hover. `TodoListCategoryPanel.vue:265-269` already
  solves the same problem.
- **What to change:** `@media (hover: none) { .drag-handle { opacity: 1 } }`, copied from the category panel, and a theme-aware
  colour instead of `white`.
- **Verification:** `P3`'s `Verify:` on both routes.

## F104. The readiness board shows 1.4 columns on a phone, with no snap
> ✅ **FIXED 2026-10-11**, the recommended option: below `sm` (`max-width: 599.98px`) `.readiness-board` is
> `grid-template-columns: 1fr`. `F2`, `F5` and `F78` are untouched.
> **Verified** with `playwright-cli` on `/leisure/projects`: at 390 all three columns sit at `left` 12, `right` 378 (stacked: within
> 16 px of the first), the board is `scrollWidth 366 / clientWidth 366`, and the empty columns are 78 px tall. At 1440 the columns
> stay three across (300–665, 681–1047, 1063–1428) with no scroll.

- **Scope:** app-side: `src/core/leisure/component/project/ProjectReadinessBoard.vue:321-327`.
- **Closes:** `leisure-projects/P4`.
- **Root cause:** `grid-template-columns: repeat(3, minmax(260px, 1fr))` with `overflow-x: auto` and no `scroll-snap-type`, so on
  landing the seed's only card sits cut through its title at the screen edge.
- **What to change:** recommended: stack the columns below `sm` (`grid-template-columns: 1fr`); empty columns are already short.
  The alternative is `scroll-snap-type: x mandatory` with columns at `calc(100% - 32px)`.
- **Do not change:** `F2`, `F5` and `F78` on the same board.
- **Verification:** `P4`'s `Verify:`.

## F105. The routine widget's group chips shrink until "Weekly" reads "Weekl"
> ✅ **FIXED 2026-10-11.** The period chip is `flex-shrink-0`, and the group row is `flex-wrap`. The bar takes a zero basis
> (`flex-1-1-0`, `min-width: 64px`), and the count and the note are `text-no-wrap`, so when the row runs out of room the
> "+N not due today" note drops whole under the bar instead of taking the chip's width. `F7`'s header is untouched.
> **Verified** with `playwright-cli` on `/`: `P1`'s `Verify:` reads 0 for Daily, Weekly and Monthly at 390 and at 1440 (pass:
> ≤ 0). The bars are 138–246 px at 390 and 312–435 px at 1440, and the page doesn't pan at either width.
> **Seen, not fixed (already noted under `FW37`):** the item titles in this widget are white on the light card.

- **Scope:** app-side: `src/core/home/component/RoutineTodoWidget.vue:65-73`.
- **Closes:** `home/P1`.
- **What to change:** `flex-shrink-0` on the period chip, and let the "+N not due today" note wrap under the bar.
- **Do not change:** `F7`'s header fix in the same widget.
- **Verification:** `P1`'s `Verify:`.

## F106. The "Time slot size" toggle cuts "30 MIN" at phone width
> ✅ **FIXED 2026-10-11**, the wrap option. The row holding the "Time slot size" caption and the group is `flex-wrap`, so on a
> phone the group moves under the caption, keeping its full labels. The group itself isn't wrapped (a broken button group would
> lose its joined outline). `F90`'s `label` is unchanged.
> **Verified** with `playwright-cli` on `/day-planner/settings?tab=viewDefaults`: at 390 the buttons run 29–340 and "30 MIN" ends
> at 340 (pass: every `right <= 390`), and the group is `scrollWidth 311 / clientWidth 311`. At 1440 it stays on the caption's row
> (418–755).

- **Scope:** app-side: `src/core/dayPlanner/component/settings/ViewDefaultsTab.vue:22-33`.
- **Closes:** `planner-day/P6`, the slot-size half. Its *Add* half belongs to `FW27` (rule 1).
- **What to change:** let the group wrap, or use shorter labels ("30m") below `sm`. Keep `F90`'s `label`.
- **Verification:** `P6`'s `Verify:` step 3.

## F107. "Task not found" squeezes its message into 82 px beside its link
> ✅ **FIXED 2026-10-11.** Below `sm` the *Open the calendar* link renders in the alert's default slot, under the text and
> right-aligned; from `sm` up it stays in `#append`.
> **Also fixed, same view:** the alert's 684 px height was not the narrow column. The `VContainer` fills the viewport (836 px)
> under `d-flex`, and its default `align-items: stretch` pulled the alert to full height at every width (740 px at 1440, with
> 100 px of text). `align-start` on the container fixes it. Without it, `P7`'s height condition can't pass.
> **Verified** with `playwright-cli` on `/day-planner/task/999999`: at 390 `.v-alert__content` is 262 px and the alert 149 px
> (pass: ≥ 250 and < 250), and the link is at 175–346. At 1440 the alert is 132 px with the link in `#append`.
> **Note for the next edit here:** `v-else` can't pair with a `v-if` on a named-slot `<template>`, because Vue lifts slot templates
> out of the sibling chain. The first attempt did that, and the dev server served the view as a 500. The default-slot block
> carries its own `v-if="!smAndUp"`.

- **Scope:** app-side: `src/core/dayPlanner/view/PlannerTaskLinkView.vue` (the `VAlert` with *Open the calendar* in `#append`).
- **Closes:** `planner-day/P7`.
- **What to change:** below `sm`, move the link under the text (default slot, or an actions row) instead of `#append`.
- **Verification:** `P7`'s `Verify:`.

## Closed verification items

- **`planner-day/U1`: settled 2026-10-08, confirmed.** It is now `planner-day/B10` (`blocker`) and opens `F108`. Method:
  `playwright-cli run-code` at 390×844 with a CDP session (`Emulation.setTouchEmulationEnabled`, `maxTouchPoints` 5) and real touch
  input (`Input.dispatchTouchEvent`, 100 px upward swipes in ten steps). Writes to `/api/(template-)?planner-task` were routed to
  `abort()`, so nothing reached the server. It ran on `/day-planner/templates/20001`, because the day route's
  `POST /api/planner-task/filter` returned 500 and no grid rendered.
  - **Empty slot:** `scrollTop` stayed 0, and *Add New Template Task* opened.
  - **Task block:** `scrollTop` stayed 0, and `PATCH /api/template-planner-task/20101` fired.
  - **Control, the 80 px time column (`touch-action: auto`):** the grid scrolled 181 px.

  One trap: a first run swept the control first, which scrolled the grid under the targets that had already been measured and
  swapped the two outcomes. Measure, swipe the column, and swipe the control last. The script is
  `.playwright-cli/u1-touch.js` (gitignored, so copy it before `npm run playwright:clean`).

## Contradictions & re-grades

### Contradictions

*Seventeenth pass (2026-10-07), the X4 narrow-viewport round:*

127. **`_shell/A4` says Escape doesn't close the mobile drawer, but `_shell` round 2 recorded that it does.** A4 tried Escape with
    focus in three places and found no Escape handler in Vuetify 3.12.4's `VNavigationDrawer.js`. No batch in this queue has touched
    the drawer's close path since round 2, so this reads as round 2 being wrong, perhaps observed at a width where the drawer is
    permanent, rather than as a regression. `FW29` adds the handler either way, and its *Risk* line says it must not double-close.

128. **One defect, two proposed fixes.** `activity-settings/P3` ("render `BasicTable`'s create button above the table") and
    `planner-day/P6` ("move *Add* into the tab's toolbar") both treat the off-screen *Add* as a placement problem.
    `leisure-backlog-picker/B6` found the actual mechanism: `DataTable.vue:237-243` declares the last column
    `position: sticky; right: 0`, and the selector can never match, because `.my-data-table` *is* the `.v-data-table`. Read this pass,
    including `:6`. The queue takes `B6`'s fix (`FW27`): it restores declared intent, and it also pins the row actions, which moving
    the button wouldn't. The row-hover rule at `:280` has the same dead descendant and has never rendered either; `FW27` covers it.
    `planner-day/P6` had already been annotated with the merge by the x4 `leisure` group.

129. **The gutter pan came with three diagnoses.** `tracking-dashboards/P2` blamed each dashboard's `VRow`. `history-capture/P2`
    proposed `noGutters` per view. `auth/P4`, the last group to run, found the shared cause, `App.vue:29`'s `px-2`, and annotated
    `tracking-dashboards/P2`. The queue merges all three into `F92` with the container fix, and keeps `history-capture/P2`'s second,
    distinct cause: Pomodoro's `noGutters` row grows through `min-width: auto` under the same `d-flex` container. `auth/P4`'s
    untraced extra 4 px on the nested `/login` and `/registration` rows would be a framework residue, which `F92` says to file
    separately if it survives.

130. **Four X4 defects were made or left in place by fixes verified at desktop width only.** Two were made:
    - `F22`'s comment promises the filters wrap "beside" the tabs, and below ~700 px there is no "beside" (`activity-settings/B10`).
    - `F26` sized the period banner to one line of its own content, which is what makes it 420 px at 390 (`history-review/P4`).

    Two were left in place:
    - `F12` made the tracking-settings table visible, inside a card that clips at 390 (`tracking-settings/X5`).
    - `F31` fixed the pie's legend layout, but not the row that squeezes its canvas to 134 px (`history-review/B7`).

    The counterexample is `F51`, which was verified at 390 and 1024, and whose `X2`/`A3` didn't reproduce in this round. The
    seventeenth pass puts a 390 check into every layout batch's *Verification*.

131. **`user-settings/U3` is closed in the queue and open in its unit file.** The queue (*Needs verification* → `user-settings`) closed
    it on 2026-09-24 by promoting the spec. `user-settings/findings.md` still reads `Status: open`, and the unit's x4 round-history row
    says "U3 itself was left as filed". The queue is right and the unit file is stale. The next session that writes to that file
    should mark it.

132. **`todo-routine/B12` is filed as narrow-only, but its own evidence says otherwise.** It reports that at 1440×900 "the footer sits
    inside the card for three of the four groups", which leaves one group clipped at desktop width too. `F91`'s item-area change
    (`h-100` → `flex: 1 1 0; min-height: 0`) is therefore not breakpoint-gated.

133. **`leisure-bucket-anchors/B4`'s expectation is stricter than the rule it cites.** It expects a confirmation unconditionally and
    cites CLAUDE.md's `useDeleteConfirmation`. That composable lets a non-cascading, non-undoable delete skip the dialog when
    `askBeforeDelete` is off. So the `Verify:` holds only with the preference at its default (`true`, read this pass in
    `useUserPreferences.ts`), and `F102` says so. The unit's inventory states that the ladder's delete "opens the same
    delete-confirmation dialog"; that line is wrong and should be corrected when the unit is next written.

134. **`history-review/B7` notes in passing that Home's history pie "rendered no canvas on 2026-10-06".** That pass treated it as "not
    affected"; it could equally be a widget that never draws. It was not filed by `home`'s own x4 run (which checked one view). Moved
    to *Needs verification* as an unfiled row.

135. **`StackedBarsChart` crosses a module boundary that CLAUDE.md forbids.** `HistorySummaryView.vue:142` and
    `HistoryDetailView.vue:217` (`activityHistory`) import `@/core/activityTracking/component/stackedBars/StackedBarsChart.vue`. The
    only sanctioned cross-module component import is the `historyDashboard` library. This is not an X4 finding, and the queue opens no
    batch for it. `F95` names it in its *Risk*, because every edit there lands on two modules' screens, and moving the component into
    `historyDashboard` (or raising it for the framework) is the rule's own remedy.

### Re-grades

| finding | was | now | why |
| --- | --- | --- | --- |
| *(seventeenth pass, 2026-10-07: the X4 narrow-viewport round, 47 findings)* | | | |
| `activity-settings/P3` | `polish`, *"framework: render the create button above the table"* | **merged into `leisure-backlog-picker/B6`** (`FW27`) and graded with it: **`bug`** | §128. The same dead sticky rule. On Activities and Categories the only create action is off-screen with no cue, which `B6` grades `bug` on four leisure tables |
| `planner-day/P6` | `polish`, two halves | the *Add* half is **merged into `FW27`** (`bug`); the slot-size half stays `polish` (`F106`) | The unit had already annotated the merge; split on rule 1 |
| `tracking-dashboards/P2` + `history-capture/P2` (Timer/Manual half) | two `polish` findings with per-view fixes | **merged into `auth/P4`** (`F92`), `polish` | §129. One cause, `App.vue:29`'s `px-2` |
| `history-capture/P2` (Pomodoro half) | the same finding | stays in `F92` as a second cause | The same container (`d-flex` stretch leaves the row at `min-width: auto`), so the same session |
| `todo-routine/B12` | `bug`, "a narrow-viewport defect" | `bug` stands, **not narrow-only** | §132. One of four groups clips at 1440 by the finding's own evidence |
| `leisure-bucket-anchors/B4` | `bug`, "a confirmation appears" unconditionally | `bug` stands; its **`Verify:` is conditioned** on `askBeforeDelete` (default `true`) | §133 |
| `tracking-dashboards/B4` | `bug` | `bug` stands, after `polish` was considered | Nothing is unreachable, but a 422 px stacked-bars column can never be seen whole under a 377 px pin |
| `planner-templates/B6` | `bug` | `bug` stands, with its **reach noted**: the only phone path is a link (`F54` made links shareable) | `F99` recommends a guard message, not a phone layout |
| `leisure-backlog-picker/X2`, `tracking-settings/X5` | `blocker` ×2 | both stand, both in `F91` | The picker's whole input on a phone, and Save plus every mapping row. Both are reachable only at desktop width |
| `planner-day/U1` | `unverified` | `unverified`, **settle first** | If confirmed, a swipe creates or moves a task. Its fix touches the grid `F91` releases |
| *(aside in `history-review/B7`)* Home's pie drew no canvas | unfiled | a *Needs verification* row | §134 |
| *(2026-10-08, closing `F92`/`F93`)* | | | |
| `planner-day/U1` | `unverified`, settle first | **confirmed**, renumbered **`B10`**, **`blocker`**, opens `F108` | A swipe, the natural scroll gesture, writes to the server (it moves a task) or opens the create dialog on every `DayPlanner` mount. Only the 80 px time column scrolls. See *Closed verification items* |
| `auth/P4` | `polish`, closed by `F92` | `polish` stands, **split**: `F92` fixed `/forgotten-password` and `/user/settings`; `/login` + `/registration` (4 px) move to **`FW37`** | The residue is the framework's `VCol` `pa-2` default against `VRow`'s −12 px, under `modules/user/view/`. `F92` itself said residue there is a new framework batch |
| `_shell/A4` (Escape) vs `_shell` round 2 | contradicting records | A4 taken as current | §127 |
