# Fix queue — X4 narrow viewport (390 px)

> Built 2026-10-07 · commit `e99e54f0` · split out of [`../_fix-queue.md`](../_fix-queue.md) the same day · source: the X4
> narrow-viewport round (`x4/00-shell`, `a`–`f`) across all 15 app units and the shell · findings considered: 47 · batches: 27
> (17 app, 10 framework) · escalations: 0 · `unverified`: 4, plus one unfiled observation

> **Why a separate queue.** The X4 round is one pass over every unit at one viewport, and its 27 batches were opened together. The
> app queue (`docs/views/_fix-queue.md`) keeps everything else. Batch ids are **not** renumbered: `F91`–`F107` and `FW27`–`FW36`
> continue the app queue's sequence, and the unit `findings.md` files and the log's §127–§135 cite them that way. The next app-queue
> number is `F109` / `FW38`, whichever queue files it (`F108` and `FW37` were filed here on 2026-10-08). `x4/submodule`'s findings go to the `_submodule` queue
> (`prompts/view-docs/units/_submodule/_fix-queue.md`), not here.

> **The seventeenth pass (2026-10-07) absorbed the X4 narrow-viewport round** (`x4/00-shell`, `a`–`f`).
> Its 47 findings became 17 app batches (`F91`–`F107`) and 10 framework batches (`FW27`–`FW36`), with no
> escalations and four `unverified` rows. **Both blockers are in `F91`.** Land `F92` first: it's one line,
> and it moves every later 390 px measurement by 4 px. `planner-day/U1` should be settled before `F91`
> closes `B9`, because both touch the same grid. `F100`–`F107` and `FW34`–`FW36` are trivial and can land
> as one sweep each, the way `F80`–`F83` did. The narrative, contradictions §127–§135 and re-grades are
> in the log.

> **2026-10-08: `F92` and `F93` closed, and `planner-day/U1` settled: confirmed.** A touch swipe on the task column scrolls
> nothing. It opens the create dialog or moves the task under the finger. The finding is now `planner-day/B10` (`blocker`), fixed by
> the new **`F108`**, which should land **with or before `F91`** (same grid). `F92`'s re-measure traced `auth/P4`'s leftover 4 px to
> the framework's `VCol` `pa-2` default, now **`FW37`**. Both API reads the planner and the to-do lists need
> (`POST /api/planner-task/filter`, `GET /api/todo-list-item`) returned 500 on 2026-10-08, so the planner day route and the to-do rows
> couldn't be measured. Re-check those before closing anything else that touches them. **`F94`–`F97`, which closed before `F92`
> narrowed the phone content area, were re-checked the same day at 390 and 1440 on all six routes and still pass.** No code
> changed. The notes are in the log under each batch.

> **2026-10-08, later: `F91` closed, then `F108` right after it, tested together on the same grid.** Both of `F91`'s blockers are
> fixed. Below `md` the day card no longer clips, and the page scrolls. A swipe over the task column now scrolls the grid, and drag,
> create and resize wait for a long press on touch. Drag was exercised on the template only, with writes aborted, because
> `POST /api/planner-task/filter` still returned 500 and the day had no tasks. `F91`'s log entry also records an unfiled FO4 crash:
> `/day-planner/:date` can load blank once `viewedDate` has been persisted.

> **2026-10-11: `FW34`–`FW37` closed; every framework batch in this queue is now done.** `FW34`–`FW36` had shipped on 2026-10-08
> (framework `8816d7f`, pointer `6472b288`) without the queue being closed. They were browser-verified and moved today. `FW37` took
> option 1 and turned up a setup gap: the app had never imported `framework.css`. It does now, and `base.css` keeps only what's
> app-specific. Re-measure anything at 390 against this: nested gutter rows moved 4 px inward. Open: `F100`, `F102`–`F107`.

> **2026-10-11, later: the layout sweep `F100`, `F103`–`F107` closed** in one commit and one `playwright-cli` pass at 390 and
> 1440. Two findings along the way are in the log: `F107`'s alert height came from a stretched container, not from the narrow
> column, and CDP's `hover: none` media override doesn't take in this Chromium, but touch emulation does (`F103`). **Only
> `F102` is open now** (the bucket-list delete confirmation, reseed first).

> Closed batches, closed verification items, the pass narrative and the *Contradictions & re-grades* audit trail live in
> [`_fix-queue-log.md`](_fix-queue-log.md) beside this file. This file holds only open work. **Closing an item is a move, not a
> mark**, by the four steps at the top of [`../_fix-queue.md`](../_fix-queue.md): the body goes to this folder's log under
> *Closed batches* with a `> ✅ **FIXED <date>.**` note, a tombstone stays here, and the summary row keeps a ✅.

## Summary

| batch | title | scope | findings closed | effort |
| --- | --- | --- | --- | --- |
| F91 | ✅ **FIXED 2026-10-08** (`flex-shrink-0` on the crushed cards; below `md` the settings, planner and routine cards release their height and the page scrolls; the planner card also stopped overrunning its clip at 1440; drag on the grid unverified, planner reads 500; body in the log) — Viewport-locked views clip or crush their own cards on a phone: the picker's constraints, the tracking settings card, the day card, the routine footer and the unified Sources card (**2 blockers**) | app (5 modules; **not** `App.vue`) | `leisure-backlog-picker/X2`, `tracking-settings/X5`, `planner-day/B9`, `todo-routine/B12`, `tracking-dashboards/B6` | high |
| F92 | ✅ **FIXED 2026-10-08** (`px-3` on the scroller, Pomodoro's row `min-width: 0`, `ActivitySelectionForm`'s nested row `mx-n2`; `/login` and `/registration` keep 4 px, now `FW37`; body in the log) — `App.vue`'s 8 px phone padding doesn't cover `VRow`'s −12 px gutters, so the content scroller pans 4–10 px | app (`App.vue:29` + the Pomodoro root row) | `auth/P4`, `tracking-dashboards/P2`, `history-capture/P2` | low |
| F93 | ✅ **FIXED 2026-10-08** (all four rows wrap, single-line at 1280/1440 wherever they fit; the to-do ⋮ check is pending an API 500; body in the log) — Four header rows that never wrap push their controls off-screen and pan the page sideways | app (4 modules) | `activity-settings/B10`, `todo-lists/B10`, `planner-templates/P4`, `history-review/P4` | med |
| F94 | ✅ **FIXED 2026-10-07** (rows stack below `sm`/`md`; the tracking pie measures its width and stacks its legend below 440 px; body in the log) — Both pie sections keep their desktop side-by-side row on a phone | app (`historyDashboard`, `activityTracking`) | `history-review/B7`, `tracking-dashboards/B3` | med |
| F95 | ✅ **FIXED 2026-10-07** (header wraps, legend under the plot below `md`, 150 px plot floor, history cards `min-content`; body in the log) — The stacked-bar chart's header can't wrap, so the plot is left 4 px tall | app (`activityTracking`, mounted by `activityHistory`) | `history-review/B5` | med |
| F96 | ✅ **FIXED 2026-10-07** (the shortest session gets ≥ 24 px and the grid scrolls; header wraps; body in the log) — The timeline at phone width: fixed 48 px gap columns squeeze sessions to 6 px, and the Single/Split toggle is clipped | app (`activityTracking/component/timeline/`) | `tracking-dashboards/B5`, `P1` | med |
| F97 | ✅ **FIXED 2026-10-07** (`position: static` below `md`; body in the log) — The dashboard header stays sticky at 269–377 px on a phone | app | `tracking-dashboards/B4` | low |
| F98 | ✅ **FIXED 2026-10-07** (the panel and the Categories dialog hand focus back to their opener; body in the log) — Two overlays on a phone drop focus to `<body>` when they close (the app half; the drawer is `FW29`) | app (`dayPlanner`, `todoList`) | `planner-day/A2`, `todo-lists/A4` | low |
| F99 | ✅ **FIXED 2026-10-08** (the alert option: below `md` a "needs a wider screen" alert with links to each pick and the list; body in the log) — The template split view has no narrow layout, and a shared link opens it on a phone anyway | app | `planner-templates/B6` | low–med |
| F100 | ✅ **FIXED 2026-10-11** (both pairs stack below `sm`; body in the log) — Two pairs of side-by-side form fields never stack: Min/Max people, Day Type/Location | app | `leisure-backlog-picker/P2`, `planner-day/P5` | trivial |
| F101 | ✅ **FIXED 2026-10-08** (`59ce7415`: below `sm` a bold `N/M` over the bar plus icon markers, with no clock row; every cell fits at 390–1440; body in the log) — Month-grid day cells overflow their 52 px (the app half of `FW33`) | app | `planner-day/P4` | low |
| F102 | The bucket-list ladder deletes on one tap, with no confirmation (not width-specific) | app | `leisure-bucket-anchors/B4` | low |
| F103 | ✅ **FIXED 2026-10-11** (shown under `hover: none`, theme text colour; body in the log) — Reorder mode's drag handle is hover-only, and white on a light card | app | `todo-lists/P3` | trivial |
| F104 | ✅ **FIXED 2026-10-11** (columns stack below `sm`; body in the log) — The readiness board shows 1.4 columns on a phone, with no snap | app | `leisure-projects/P4` | low |
| F105 | ✅ **FIXED 2026-10-11** (chip doesn't shrink, the note wraps under the bar; body in the log) — The routine widget's group chips shrink until "Weekly" reads "Weekl" | app | `home/P1` | trivial |
| F106 | ✅ **FIXED 2026-10-11** (the row wraps, the group drops under its caption; body in the log) — The "Time slot size" toggle cuts "30 MIN" at phone width | app | `planner-day/P6` (slot-size half) | trivial |
| F107 | ✅ **FIXED 2026-10-11** (link under the text below `sm`; also the full-height stretch; body in the log) — "Task not found" squeezes its message into 82 px beside its link | app | `planner-day/P7` | trivial |
| F108 | ✅ **FIXED 2026-10-08** (`pan-y` on the column; on touch, drag/create/resize arm only after a 400 ms long press, a tap on a task selects it, and clipboard placement waits for a tap; mouse unchanged; real-device and touch clipboard unverified; body in the log) — A touch swipe on the planner's task column creates or moves a task instead of scrolling (**blocker**, settled from `U1` 2026-10-08) | app (`dayPlanner`) | `planner-day/B10` | med |
| FW27 | ✅ **FIXED 2026-10-07** (the `actions` header gets Vuetify's `fixed: 'end'`; body in the log) — `DataTable`'s sticky actions column never sticks: the selector looks for a `.v-data-table` *inside* the element that is the `.v-data-table` | **framework** (`dataTable/DataTable.vue`) | `leisure-backlog-picker/B6`, `activity-settings/P3`, `planner-day/P6` (Add half) | low |
| FW28 | ✅ **FIXED 2026-10-07** (below `md` the actions scroll in a strip, Cancel outside it; body in the log) — `ActionBar` grows to its content on a phone, and both ends, Cancel included, are off-screen | **framework** (`ActionBar.vue`) | `_shell/B2` | med |
| FW29 | ✅ **FIXED 2026-10-07** (focus in on open, Escape closes, focus back to the toggle or to `<main>`; brand link hidden on the link; body in the log) — The mobile nav drawer doesn't manage focus, and the hidden brand link is still a tab stop | **framework** (`nav/`) | `_shell/A4`, `_shell/A5` | low |
| FW30 | ✅ **FIXED 2026-10-07** (the recommended option: one entry list, `useUserMenuEntries`, for the menu and the footer; body in the log) — Below `md` the drawer footer replaces two of the user menu's five entries, so *My reminders* has no path | **framework** (`nav/AppSidebar.vue`), decision | `_shell/B3` | low–med |
| FW31 | ✅ **FIXED 2026-10-07** (below `md` parent + current only; every crumb one line, ellipsised with `title`; body in the log) — Breadcrumbs wrap to two or three lines inside the top bar | **framework** (`nav/AppBreadcrumbs.vue`), decision | `_shell/P4` | low |
| FW32 | ✅ **FIXED 2026-10-07** (error toasts are closable by default, placement stays top; `P3`'s literal `Verify:` still fails, see the log) — The top-placed snackbar covers the page's first action for 3 s on a phone | **framework** (`feedback/Snackbar.vue`), framework-wide default | `_shell/P3` | low |
| FW33 | ✅ **FIXED 2026-10-08** (framework `8cf8079`: headers are a sticky row of the scroller with short names below `md`, the toolbar wraps, and the cell header shows the day number below `sm`; it also fixed *Workdays* drawing 7 columns; body in the log) — `CalendarGrid` at phone width: full weekday names misalign the headers, and the toolbar row doesn't wrap | **framework** (`calendar/CalendarGrid.vue`) | `planner-day/P3` (+ `/activity-history/calendar`) | low |
| FW34 | ✅ **FIXED 2026-10-08, closed 2026-10-11** (framework `8816d7f`: columns from the measured width, 3 at 390; body in the log) — The icon picker keeps 7 columns at any width | **framework** (`inputs/IconPickerDialog.vue`) | `todo-lists/P2` | trivial |
| FW35 | ✅ **FIXED 2026-10-08, closed 2026-10-11** (framework `8816d7f`: 40×40; body in the log) — The password show/hide toggle is a 20×20 tap target | **framework** (`modules/user/component/MyPasswordInput.vue`) | `user-settings/A2` | trivial |
| FW36 | ✅ **FIXED 2026-10-08, closed 2026-10-11** (framework `8816d7f`: metadata in the default slot, wraps; body in the log) — Active-session rows clamp their subtitle to one line, hiding "Last used" | **framework** (`modules/user/component/settings/SessionsSection.vue`) | `user-settings/P2` | trivial |
| FW37 | ✅ **FIXED 2026-10-11** (option 1: a −8 px gutter rule in `framework.css`; the app now imports `framework.css`, which it never had; 390/390 on all 14 routes; body in the log) — The `VCol` default is `pa-2` (8 px) but `VRow` keeps −12 px gutters, so every row nested in a column overruns by 4 px | **framework** (`bootstrap/createAppVuetify.ts:48`, `modules/user/view/`), decision | `auth/P4` (the `/login` + `/registration` remainder) | low |

**Seventeenth pass (2026-10-07):** 17 app batches opened (`F91`–`F107`) and 10 framework batches (`FW27`–`FW36`), all of them open. No escalation was added.

---

> **The X4 batches (seventeenth pass).** Every finding below was observed at 390×844 with measured
> geometry and a screenshot, and each `Verify:` block starts with `playwright-cli resize 390 844`, so it
> runs as written. **Every layout batch's verification also re-checks 1440×900.** Four of these defects
> were made or left in place by fixes that were verified at desktop width only (log §130).

<!-- F91 (viewport-locked views clip or crush their own cards on a phone — leisure-backlog-picker/X2, tracking-settings/X5, planner-day/B9, todo-routine/B12, tracking-dashboards/B6) fixed 2026-10-08 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F92 (App.vue's 8 px phone padding vs VRow's −12 px gutters — auth/P4, tracking-dashboards/P2, history-capture/P2) fixed 2026-10-08 — body moved to _fix-queue-log.md → Closed batches. auth/P4's /login + /registration remainder is FW37. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F93 (four header rows that never wrap — activity-settings/B10, todo-lists/B10, planner-templates/P4, history-review/P4) fixed 2026-10-08 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F94 (both pie sections keep their desktop side-by-side row on a phone — history-review/B7, tracking-dashboards/B3) fixed 2026-10-07 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F95 (the stacked-bar chart's header can't wrap, plot left 4 px — history-review/B5) fixed 2026-10-07 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F96 (timeline sessions squeezed to 6 px, Single/Split toggle clipped — tracking-dashboards/B5, P1) fixed 2026-10-07 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F97 (the dashboard header stays sticky at 269–377 px on a phone — tracking-dashboards/B4) fixed 2026-10-07 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F98 (two overlays drop focus to <body> on close — planner-day/A2, todo-lists/A4) fixed 2026-10-07 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F99 (the template split view has no narrow layout — planner-templates/B6) fixed 2026-10-08 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F100 (two pairs of side-by-side form fields never stack — leisure-backlog-picker/P2, planner-day/P5) fixed 2026-10-11 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F101 (month-grid day cells overflow their 52 px — planner-day/P4) fixed 2026-10-08 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

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

<!-- F103 (reorder mode's drag handle is hover-only, and white on a light card — todo-lists/P3) fixed 2026-10-11 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F104 (the readiness board shows 1.4 columns on a phone, with no snap — leisure-projects/P4) fixed 2026-10-11 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F105 (the routine widget's group chips shrink until "Weekly" reads "Weekl" — home/P1) fixed 2026-10-11 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F106 (the "Time slot size" toggle cuts "30 MIN" at phone width — planner-day/P6 slot-size half) fixed 2026-10-11 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F107 ("Task not found" squeezes its message into 82 px beside its link — planner-day/P7) fixed 2026-10-11 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- F108 (a touch swipe on the planner's task column creates or moves a task instead of scrolling — planner-day/B10) fixed 2026-10-08 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW27 (DataTable's sticky actions column never sticks — leisure-backlog-picker/B6, activity-settings/P3, planner-day/P6 Add half) fixed 2026-10-07 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW28 (ActionBar grows to its content on a phone, Cancel off-screen — _shell/B2) fixed 2026-10-07 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW29 (the mobile nav drawer doesn't manage focus; the hidden brand link is a tab stop — _shell/A4, _shell/A5) fixed 2026-10-07 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW30 (the drawer footer drops three of the user menu's entries, My reminders unreachable on a phone — _shell/B3) fixed 2026-10-07 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW31 (breadcrumbs wrap inside the top bar — _shell/P4) fixed 2026-10-07 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW32 (the top-placed snackbar covers the page's first action on a phone — _shell/P3) fixed 2026-10-07 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW33 (CalendarGrid at phone width: misaligned headers, a toolbar that doesn't wrap — planner-day/P3) fixed 2026-10-08 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW34 (the icon picker keeps 7 columns at any width — todo-lists/P2) fixed 2026-10-08 (framework 8816d7f), closed 2026-10-11 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW35 (the password show/hide toggle is a 20×20 tap target — user-settings/A2) fixed 2026-10-08 (framework 8816d7f), closed 2026-10-11 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW36 (active-session rows clamp their subtitle, hiding "Last used" — user-settings/P2) fixed 2026-10-08 (framework 8816d7f), closed 2026-10-11 — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

<!-- FW37 (the VCol pa-2 default vs VRow's −12 px gutters — auth/P4) fixed 2026-10-11 (option 1, plus the app now imports framework.css) — body moved to _fix-queue-log.md → Closed batches. Number retired, not reused; the summary table keeps its ✅ row. -->

## Needs verification (unverified findings, and what would settle each)

### X4 narrow viewport (390 px): four `unverified`, plus one unfiled observation (seventeenth pass)

Each of the four needs something the read-only desktop-Chromium pass couldn't supply: real touch, a soft keyboard, or a write.
`planner-day/U1` was settled on 2026-10-08 (**confirmed**, now `B10` → `F108`; the row is in the log's *Closed verification items*), so
three remain. The method that settled it was CDP touch emulation in `playwright-cli run-code`, with writes routed to `abort()`. It
may not settle `todo-lists/U4`: that drag runs on native HTML5 drag events, and desktop Chromium may not start one from emulated touch.

| finding | what settles it | note |
| --- | --- | --- |
| `todo-lists/U4`: touch drag-to-reorder (`pragmatic-drag-and-drop` on native HTML5 drag events) | a real phone or an emulator with touch: Change order, long-press a row, drag it two rows, and check the drop indicator and `PATCH …/change-display-order` | If it fails, it becomes a `bug` with no alternative path (no move up/down, no keyboard route). `F103` makes the handle visible either way |
| `_shell/U3` **[framework]**: `MyDialog`'s footer behind the on-screen keyboard | a real device or an emulator with a soft keyboard. Focus the first field of *New list* (`/todo-list`) and *Add Template* (`/day-planner/templates`, Cancel/Create at y 758–794, the worst case), and see whether the visual viewport pans to the footer | The answer applies app-wide, and a confirmed defect is a framework batch |
| `history-capture/U2`: the *Record new activity* confirm dialog at 390 | a mutation-allowed pass: Stopwatch with a long-named activity, run it past one minute, Stop, check the dialog's fit and the sentence's wrap, then Cancel | Low risk: the same `MyDialog` fitted at 24–366 for *Create new activity* |
| *(unfiled)* Home's history pie rendered **no canvas** at 390 on 2026-10-06 (an aside in `history-review/B7`'s **Where**) | open `/` at 390 and at 1440 on a seed date with history data; if the widget has data and still draws no canvas, file it against `home` | §134. It may only have been an empty day |

## Deferred to opportunities

**The X4 narrow-viewport round filed no `opportunity` finding** (seventeenth pass, 2026-10-07). One lead for Phase 4, so it isn't
rediscovered: the template split view's only entry is desktop-only on purpose. `F99` recommends a "needs a wider screen" guard over a
phone layout, so any one-pane-at-a-time compare on a phone would be a new feature, not a fix.
