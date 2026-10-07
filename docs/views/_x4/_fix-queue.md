# Fix queue — X4 narrow viewport (390 px)

> Built 2026-10-07 · commit `e99e54f0` · split out of [`../_fix-queue.md`](../_fix-queue.md) the same day · source: the X4
> narrow-viewport round (`x4/00-shell`, `a`–`f`) across all 15 app units and the shell · findings considered: 47 · batches: 27
> (17 app, 10 framework) · escalations: 0 · `unverified`: 4, plus one unfiled observation

> **Why a separate queue.** The X4 round is one pass over every unit at one viewport, and its 27 batches were opened together. The
> app queue (`docs/views/_fix-queue.md`) keeps everything else. Batch ids are **not** renumbered: `F91`–`F107` and `FW27`–`FW36`
> continue the app queue's sequence, and the unit `findings.md` files and the log's §127–§135 cite them that way. The next app-queue
> number is `F108` / `FW37`, whichever queue files it. `x4/submodule`'s findings go to the `_submodule` queue
> (`prompts/view-docs/units/_submodule/_fix-queue.md`), not here.

> **The seventeenth pass (2026-10-07) absorbed the X4 narrow-viewport round** (`x4/00-shell`, `a`–`f`).
> Its 47 findings became 17 app batches (`F91`–`F107`) and 10 framework batches (`FW27`–`FW36`), with no
> escalations and four `unverified` rows. **Both blockers are in `F91`.** Land `F92` first: it's one line,
> and it moves every later 390 px measurement by 4 px. `planner-day/U1` should be settled before `F91`
> closes `B9`, because both touch the same grid. `F100`–`F107` and `FW34`–`FW36` are trivial and can land
> as one sweep each, the way `F80`–`F83` did. The narrative, contradictions §127–§135 and re-grades are
> in the log.

> Closed batches, closed verification items, the pass narrative and the *Contradictions & re-grades* audit trail live in
> [`_fix-queue-log.md`](_fix-queue-log.md) beside this file. This file holds only open work. **Closing an item is a move, not a
> mark**, by the four steps at the top of [`../_fix-queue.md`](../_fix-queue.md): the body goes to this folder's log under
> *Closed batches* with a `> ✅ **FIXED <date>.**` note, a tombstone stays here, and the summary row keeps a ✅.

## Summary

| batch | title | scope | findings closed | effort |
| --- | --- | --- | --- | --- |
| F91 | Viewport-locked views clip or crush their own cards on a phone: the picker's constraints, the tracking settings card, the day card, the routine footer and the unified Sources card (**2 blockers**) | app (5 modules; **not** `App.vue`) | `leisure-backlog-picker/X2`, `tracking-settings/X5`, `planner-day/B9`, `todo-routine/B12`, `tracking-dashboards/B6` | high |
| F92 | `App.vue`'s 8 px phone padding doesn't cover `VRow`'s −12 px gutters, so the content scroller pans 4–10 px | app (`App.vue:29` + the Pomodoro root row) | `auth/P4`, `tracking-dashboards/P2`, `history-capture/P2` | low |
| F93 | Four header rows that never wrap push their controls off-screen and pan the page sideways | app (4 modules) | `activity-settings/B10`, `todo-lists/B10`, `planner-templates/P4`, `history-review/P4` | med |
| F94 | Both pie sections keep their desktop side-by-side row on a phone | app (`historyDashboard`, `activityTracking`) | `history-review/B7`, `tracking-dashboards/B3` | med |
| F95 | The stacked-bar chart's header can't wrap, so the plot is left 4 px tall | app (`activityTracking`, mounted by `activityHistory`) | `history-review/B5` | med |
| F96 | The timeline at phone width: fixed 48 px gap columns squeeze sessions to 6 px, and the Single/Split toggle is clipped | app (`activityTracking/component/timeline/`) | `tracking-dashboards/B5`, `P1` | med |
| F97 | The dashboard header stays sticky at 269–377 px on a phone | app | `tracking-dashboards/B4` | low |
| F98 | Two overlays on a phone drop focus to `<body>` when they close (the app half; the drawer is `FW29`) | app (`dayPlanner`, `todoList`) | `planner-day/A2`, `todo-lists/A4` | low |
| F99 | The template split view has no narrow layout, and a shared link opens it on a phone anyway | app | `planner-templates/B6` | low–med |
| F100 | Two pairs of side-by-side form fields never stack: Min/Max people, Day Type/Location | app | `leisure-backlog-picker/P2`, `planner-day/P5` | trivial |
| F101 | Month-grid day cells overflow their 52 px (the app half of `FW33`) | app | `planner-day/P4` | low |
| F102 | The bucket-list ladder deletes on one tap, with no confirmation (not width-specific) | app | `leisure-bucket-anchors/B4` | low |
| F103 | Reorder mode's drag handle is hover-only, and white on a light card | app | `todo-lists/P3` | trivial |
| F104 | The readiness board shows 1.4 columns on a phone, with no snap | app | `leisure-projects/P4` | low |
| F105 | The routine widget's group chips shrink until "Weekly" reads "Weekl" | app | `home/P1` | trivial |
| F106 | The "Time slot size" toggle cuts "30 MIN" at phone width | app | `planner-day/P6` (slot-size half) | trivial |
| F107 | "Task not found" squeezes its message into 82 px beside its link | app | `planner-day/P7` | trivial |
| FW27 | ✅ **FIXED 2026-10-07** (the `actions` header gets Vuetify's `fixed: 'end'`; body in the log) — `DataTable`'s sticky actions column never sticks: the selector looks for a `.v-data-table` *inside* the element that is the `.v-data-table` | **framework** (`dataTable/DataTable.vue`) | `leisure-backlog-picker/B6`, `activity-settings/P3`, `planner-day/P6` (Add half) | low |
| FW28 | ✅ **FIXED 2026-10-07** (below `md` the actions scroll in a strip, Cancel outside it; body in the log) — `ActionBar` grows to its content on a phone, and both ends, Cancel included, are off-screen | **framework** (`ActionBar.vue`) | `_shell/B2` | med |
| FW29 | The mobile nav drawer doesn't manage focus, and the hidden brand link is still a tab stop | **framework** (`nav/`) | `_shell/A4`, `_shell/A5` | low |
| FW30 | Below `md` the drawer footer replaces two of the user menu's five entries, so *My reminders* has no path | **framework** (`nav/AppSidebar.vue`), decision | `_shell/B3` | low–med |
| FW31 | Breadcrumbs wrap to two or three lines inside the top bar | **framework** (`nav/AppBreadcrumbs.vue`), decision | `_shell/P4` | low |
| FW32 | ✅ **FIXED 2026-10-07** (error toasts are closable by default, placement stays top; `P3`'s literal `Verify:` still fails, see the log) — The top-placed snackbar covers the page's first action for 3 s on a phone | **framework** (`feedback/Snackbar.vue`), framework-wide default | `_shell/P3` | low |
| FW33 | `CalendarGrid` at phone width: full weekday names misalign the headers, and the toolbar row doesn't wrap | **framework** (`calendar/CalendarGrid.vue`) | `planner-day/P3` (+ `/activity-history/calendar`) | low |
| FW34 | The icon picker keeps 7 columns at any width | **framework** (`inputs/IconPickerDialog.vue`) | `todo-lists/P2` | trivial |
| FW35 | The password show/hide toggle is a 20×20 tap target | **framework** (`modules/user/component/MyPasswordInput.vue`) | `user-settings/A2` | trivial |
| FW36 | Active-session rows clamp their subtitle to one line, hiding "Last used" | **framework** (`modules/user/component/settings/SessionsSection.vue`) | `user-settings/P2` | trivial |

**Seventeenth pass (2026-10-07):** 17 app batches opened (`F91`–`F107`) and 10 framework batches (`FW27`–`FW36`), all of them open. No escalation was added.

---

> **The X4 batches (seventeenth pass).** Every finding below was observed at 390×844 with measured
> geometry and a screenshot, and each `Verify:` block starts with `playwright-cli resize 390 844`, so it
> runs as written. **Every layout batch's verification also re-checks 1440×900.** Four of these defects
> were made or left in place by fixes that were verified at desktop width only (log §130).

## F91. Viewport-locked views clip or crush their own cards on a phone
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

## F92. `App.vue`'s 8 px phone padding doesn't cover `VRow`'s −12 px gutters, so the content scroller pans sideways
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

## F94. Both pie sections keep their desktop side-by-side row on a phone
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
- **Scope:** app-side: `src/core/activityTracking/component/ActivityDashboardHeader.vue:2-5`.
- **Closes:** `tracking-dashboards/B4`.
- **Root cause:** the sticky header (`top: 0; z-index: 1000`) wraps to six rows on a phone: 269 px with a preset, 377 px with Custom.
  Under the 64 px app bar, that pins 333–441 px, so a 422 px stacked-bars column can never be seen whole.
- **What to change:** `position: static` below `md`. That is one line and passes the `Verify:`. A collapsed summary chip that opens a
  bottom sheet is the richer option, but it isn't needed.
- **Do not change:** the sticky header at desktop width; `F7`'s chip scroller.
- **Verification:** `B4`'s `Verify:`.
- **Risk:** check that nothing else depends on its `z-index: 1000`.

## F98. Two overlays on a phone drop focus to `<body>` when they close
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

## F99. The template split view has no narrow layout, and a shared link opens it on a phone anyway
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

## F100. Two pairs of side-by-side form fields never stack
- **Scope:** app-side: `src/core/leisure/component/backlog/NewBacklogProfileForm.vue:58-67` (Min/Max people),
  `src/core/dayPlanner/component/normal/CalendarDetailsDialog.vue:35-49` (Day Type / Location).
- **Closes:** `leisure-backlog-picker/P2`, `planner-day/P5`.
- **Root cause:** each pair sits side by side at every width. In a 342 px dialog the second field's label truncates: "Max …" (a
  69 px input behind the number buttons) and "L…".
- **What to change:** `cols="12" sm="6"` on both pairs.
- **Verification:** both `Verify:` blocks.

## F101. Month-grid day cells overflow their 52 px
- **Scope:** app-side: `src/core/dayPlanner/component/calendar/CellTaskProgress.vue:65-95` (the below-`sm` branch). **The cell lives
  in the framework's `CalendarGrid`, whose headers and toolbar are `FW33`.** Rule 1 makes this two batches; they're independent and can
  land in either order.
- **Closes:** `planner-day/P4`.
- **Root cause:** the below-`sm` branch still renders the clock range and "N/M tasks" + "%", 71 px of content in a 52 px cell
  (`overflow: hidden`), so the cell reads "0/2 task" and loses its percentage. The task-name tooltip is dropped below 600 px
  (`v-if="smAndUp"`), so nothing else carries the information.
- **What to change:** below `sm`, show a compact `N/M` (or only the progress bar) and drop the clock row.
- **Verification:** `P4`'s `Verify:`.

## F102. The bucket-list ladder deletes on one tap, with no confirmation
- **Scope:** app-side: `src/core/leisure/component/bucketList/BucketListLadder.vue:137-139,236-237`; `CLAUDE.md` (the
  `useDeleteConfirmation` row).
- **Closes:** `leisure-bucket-anchors/B4`. It isn't width-specific; the x4 pass found it by accident.
- **Root cause:** `onDelete` calls `deleteEntity(item.id)` and nothing else. The table's delete confirms inside the framework's
  `BasicTable`, and the projects board confirms through `confirm()` (`ProjectReadinessBoard.vue:295-301`). The ladder sits outside the
  table and never asks. Confirmed by reading the source this pass.
- **What to change:** route `onDelete` through `useDeleteConfirmation().shouldConfirm({ cascades: false, undoable: false })`, then
  `confirm()` with the board's title and `general.deleteConfirmationText` naming the activity. Move the board's delete onto the same
  call in the same edit, so leisure's two hand-written deletes agree. Add `leisure` to the composable's "Imported by" cell in
  `CLAUDE.md`, which is a sanctioned-import list.
- **Do not change:** `BasicTable`'s built-in delete dialog. It is framework code and always confirms, the same as in every other module.
- **Verification:** `B4`'s `Verify:`, with `askBeforeDelete` at its default (`true`, `ASK_BEFORE_DELETE_DEFAULT`). The finding's
  pass condition only holds while that preference is on (§133). **Reseed first.** The x4 pass deleted fixture row 17101 (*Learn
  Bouldering*), the seed's only bucket-list row, and `leisure-bucket-anchors.draft.spec.ts` fails until `POST /api/test/seed`.
- **Risk:** none beyond the reseed.

## F103. Reorder mode's drag handle is hover-only, and white on a light card
- **Scope:** app-side: `src/core/todoList/component/BaseTodoListItem.vue:429-447`.
- **Closes:** `todo-lists/P3`. Whether touch dragging works at all is `todo-lists/U4` (*Needs verification*); land this either way.
- **Root cause:** `.drag-handle` is `opacity: 0` unless hovered, and a phone has no hover. `TodoListCategoryPanel.vue:265-269` already
  solves the same problem.
- **What to change:** `@media (hover: none) { .drag-handle { opacity: 1 } }`, copied from the category panel, and a theme-aware
  colour instead of `white`.
- **Verification:** `P3`'s `Verify:` on both routes.

## F104. The readiness board shows 1.4 columns on a phone, with no snap
- **Scope:** app-side: `src/core/leisure/component/project/ProjectReadinessBoard.vue:321-327`.
- **Closes:** `leisure-projects/P4`.
- **Root cause:** `grid-template-columns: repeat(3, minmax(260px, 1fr))` with `overflow-x: auto` and no `scroll-snap-type`, so on
  landing the seed's only card sits cut through its title at the screen edge.
- **What to change:** recommended: stack the columns below `sm` (`grid-template-columns: 1fr`); empty columns are already short.
  The alternative is `scroll-snap-type: x mandatory` with columns at `calc(100% - 32px)`.
- **Do not change:** `F2`, `F5` and `F78` on the same board.
- **Verification:** `P4`'s `Verify:`.

## F105. The routine widget's group chips shrink until "Weekly" reads "Weekl"
- **Scope:** app-side: `src/core/home/component/RoutineTodoWidget.vue:65-73`.
- **Closes:** `home/P1`.
- **What to change:** `flex-shrink-0` on the period chip, and let the "+N not due today" note wrap under the bar.
- **Do not change:** `F7`'s header fix in the same widget.
- **Verification:** `P1`'s `Verify:`.

## F106. The "Time slot size" toggle cuts "30 MIN" at phone width
- **Scope:** app-side: `src/core/dayPlanner/component/settings/ViewDefaultsTab.vue:22-33`.
- **Closes:** `planner-day/P6`, the slot-size half. Its *Add* half belongs to `FW27` (rule 1).
- **What to change:** let the group wrap, or use shorter labels ("30m") below `sm`. Keep `F90`'s `label`.
- **Verification:** `P6`'s `Verify:` step 3.

## F107. "Task not found" squeezes its message into 82 px beside its link
- **Scope:** app-side: `src/core/dayPlanner/view/PlannerTaskLinkView.vue` (the `VAlert` with *Open the calendar* in `#append`).
- **Closes:** `planner-day/P7`.
- **What to change:** below `sm`, move the link under the text (default slot, or an actions row) instead of `#append`.
- **Verification:** `P7`'s `Verify:`.

<!-- FW27 (DataTable's sticky actions column never sticks — leisure-backlog-picker/B6, activity-settings/P3, planner-day/P6 Add half) fixed 2026-10-07 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW28 (ActionBar grows to its content on a phone, Cancel off-screen — _shell/B2) fixed 2026-10-07 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

## FW29. The mobile nav drawer doesn't manage focus, and the hidden brand link is still a tab stop
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
- **Scope:** **[framework]** `src/_common/nav/AppBreadcrumbs.vue` (the 204 px slot in `AppTopBar.vue:33-36`). This is a decision: the
  collapse rule is every app's.
- **Closes:** `_shell/P4`. Seen on nine routes. At its worst, on `/activity-history/detail`, the current crumb is clipped to
  "His / Det".
- **What to change:** below `md`, show only the parent and the current crumb (or just a back link to the parent), with `text-truncate`
  on the title span and the full text in `title`.
- **Do not change:** the labels themselves (`F11`, `F14`, `F28`).
- **Verification:** `P4`'s `Verify:`, plus `/activity-history/detail`.

<!-- FW32 (the top-placed snackbar covers the page's first action on a phone — _shell/P3) fixed 2026-10-07 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

## FW33. `CalendarGrid` at phone width: misaligned headers, a toolbar that doesn't wrap, a 263 px window
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

## FW34. The icon picker keeps 7 columns at any width
- **Scope:** **[framework]** `src/_common/component/inputs/IconPickerDialog.vue:251-256`.
- **Closes:** `todo-lists/P2`.
- **What to change:** `grid-template-columns: repeat(auto-fill, minmax(72px, 1fr))`.
- **Verification:** `P2`'s `Verify:`. At 1440 the grid is unchanged.

## FW35. The password show/hide toggle is a 20×20 tap target
- **Scope:** **[framework]** `src/_common/modules/user/component/MyPasswordInput.vue:11-19`.
- **Closes:** `user-settings/A2` (`/login`, `/registration`, the change-password and change-e-mail dialogs).
- **What to change:** drop `density="compact"` (or set `size="default"`) on the `#append-inner` button. The 56 px field has room for a
  36–40 px button.
- **Do not change:** `FW7`'s accessible name.
- **Verification:** `A2`'s `Verify:`.

## FW36. Active-session rows clamp their subtitle to one line, hiding "Last used"
- **Scope:** **[framework]** `src/_common/modules/user/component/settings/SessionsSection.vue:51-58`. At the x4 run the submodule held
  an uncommitted edit to this file (a chip), so check the submodule's own `git status` first.
- **Closes:** `user-settings/P2`.
- **What to change:** `lines="two"` on the `VList` (or `text-wrap` on the subtitle), or split the metadata so "Last used" gets its own
  line below `sm`.
- **Verification:** `P2`'s `Verify:`.

## Needs verification (unverified findings, and what would settle each)

### X4 narrow viewport (390 px): four `unverified`, plus one unfiled observation (seventeenth pass)

Each of the four needs something the read-only desktop-Chromium pass couldn't supply: real touch, a soft keyboard, or a write.

| finding | what settles it | note |
| --- | --- | --- |
| `planner-day/U1`: a swipe on the task column (`touch-action: none` across 76 % of the grid, on every `DayPlanner` mount including the template view and split panes) | a touch-enabled context (`hasTouch: true`, `page.touchscreen`) on a throwaway day: swipe up over an empty slot and over a task block, and record whether the grid scrolls, *Add New Task* opens, or a `PUT /api/planner-task/*` fires | **Settle first.** If confirmed, this is the worst X4 outcome: on a phone the day can't be scrolled, and a swipe creates or reschedules a task. The suggested fix (`pan-y` plus a long-press for touch) changes the same grid `F91` releases for `B9`, so settle it before `F91` closes |
| `todo-lists/U4`: touch drag-to-reorder (`pragmatic-drag-and-drop` on native HTML5 drag events) | a real phone or an emulator with touch: Change order, long-press a row, drag it two rows, and check the drop indicator and `PATCH …/change-display-order` | If it fails, it becomes a `bug` with no alternative path (no move up/down, no keyboard route). `F103` makes the handle visible either way |
| `_shell/U3` **[framework]**: `MyDialog`'s footer behind the on-screen keyboard | a real device or an emulator with a soft keyboard. Focus the first field of *New list* (`/todo-list`) and *Add Template* (`/day-planner/templates`, Cancel/Create at y 758–794, the worst case), and see whether the visual viewport pans to the footer | The answer applies app-wide, and a confirmed defect is a framework batch |
| `history-capture/U2`: the *Record new activity* confirm dialog at 390 | a mutation-allowed pass: Stopwatch with a long-named activity, run it past one minute, Stop, check the dialog's fit and the sentence's wrap, then Cancel | Low risk: the same `MyDialog` fitted at 24–366 for *Create new activity* |
| *(unfiled)* Home's history pie rendered **no canvas** at 390 on 2026-10-06 (an aside in `history-review/B7`'s **Where**) | open `/` at 390 and at 1440 on a seed date with history data; if the widget has data and still draws no canvas, file it against `home` | §134. It may only have been an empty day |

## Deferred to opportunities

**The X4 narrow-viewport round filed no `opportunity` finding** (seventeenth pass, 2026-10-07). One lead for Phase 4, so it isn't
rediscovered: the template split view's only entry is desktop-only on purpose. `F99` recommends a "needs a wider screen" guard over a
phone layout, so any one-pane-at-a-time compare on a phone would be a new feature, not a fix.
