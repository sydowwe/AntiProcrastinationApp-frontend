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

## Closed verification items

*(none yet)*

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
| `_shell/A4` (Escape) vs `_shell` round 2 | contradicting records | A4 taken as current | §127 |
