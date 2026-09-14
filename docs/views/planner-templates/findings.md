# planner-templates — findings

> Pass: inventory · captured 2026-09-14 · commit `6aac48bb`

**Tally:** blocker 2 · bug 5 · a11y 3 · polish 2 · opportunity 0 · unverified 3

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-14 | `6aac48bb` | initial inventory pass |

---

### X1. The "Compare Templates" dialog renders completely empty, every time it is opened
- **Status:** open
- **Severity:** blocker
- **Where:** `/day-planner/templates` → Compare (2/2) button → `TemplateComparisonDialog.vue:120`
- **Expected:** Selecting two templates and opening the comparison dialog should show both templates' name,
  icon, metadata and vertical timeline side by side — this is the entire purpose of the Compare feature,
  and the dialog's own empty-state markup (`:00 - :00 · 0 tasks`, blank grey boxes) is clearly not the
  intended rendering.
- **Actual:** Both panels render `:00 - :00 · 0 tasks` with an empty grey box in place of the timeline, no
  template name, no icon. A `CanceledError: canceled` is thrown from `fetchById` at
  `TemplateComparisonDialog.vue:47` (via `TemplateComparisonDialog.vue:120`'s `Promise.all`) on every
  single open.
- **Evidence:** `docs/views/planner-templates/screenshots/day-planner-templates--compare-dialog-broken.png`;
  console: `CanceledError: canceled at AbortSignal.onCanceled ... at fetchById
  (useEntityQuery.ts:12) ... at TemplateComparisonDialog.vue:47:78 ... at
  TemplateComparisonDialog.vue:47:26`. Reproduced twice in a row (open → cancel → reopen), identical
  result both times.
- **Repro:** 1. Go to `/day-planner/templates`. 2. Click "Compare". 3. Select any two template cards
  (click the card body, not the checkbox — see A2). 4. Click "Compare (2/2)". 5. Dialog opens with both
  sides showing `:00 - :00 · 0 tasks` and an empty box; console shows `CanceledError`.
- **Verify:** 1. Repeat the repro above. 2. **Pass condition:** both dialog panels show the selected
  templates' real name, icon, metadata chips and a populated vertical timeline with task blocks; no
  `CanceledError` in the console.
- **Root cause guess:** `TemplateComparisonDialog.vue:120` calls
  `Promise.all([fetchById(templateIds[0]), fetchById(templateIds[1])])` where `fetchById` comes from
  `useTaskPlannerDayTemplateTaskCrud()` → `useEntityQuery`. Per `CLAUDE.md`'s own documented gotcha,
  `useEntityQuery`'s `fetchById` holds **one AbortController per composable instance**, so the second
  `fetchById` call cancels the first before it resolves, `Promise.all` rejects, and the `watch` handler's
  `try { ... } finally { loading.value = false }` never reaches the `sides.value = [...]` assignment,
  leaving the two-item default (`{ template: null, tasks: [] }`) on screen. This is the **exact same bug
  class** as the already-fixed `TemplateListView.loadTemplates()` cancellation bug the intent sources
  describe (fixed there via a per-template `requestKey`) — it has simply reappeared in a newer component
  that doesn't use that pattern.
- **Suggested fix:** Give the two `fetchById` calls distinct keys the way `TemplateListView.loadTemplates()`
  now does for `fetchFilteredTasks`, or call two independent instances of `useTaskPlannerDayTemplateTaskCrud()`
  (one per side) so each has its own AbortController.

### X2. The template-detail side panel is unusable when opened on a mobile viewport
- **Status:** open
- **Severity:** blocker
- **Where:** `/day-planner/templates/:templateId` (and each panel of `/day-planner/templates/split`) →
  `PlannerSidePanelShell.vue:7` (`:style="{ width, minWidth: '280px' }"`), width fixed by
  `TemplateDayPlannerView.vue`'s `width="400px"` prop, at viewport 390×844
- **Expected:** Per the intent sources' own constraint for the panel-chrome extraction ("same mobile
  breakpoint behaviour... resize to mobile and confirm the close button still works"), the panel should
  render as a usable, full-width (or otherwise responsive) overlay at mobile widths, the way it does on
  `DayPlannerSidePanel`'s default 380px.
- **Actual:** Tapping the panel-open toggle at 390×844 produces a panel box measured at **400px wide ×
  16px tall, positioned at `left: -166px`** (partly off-screen to the left) — i.e., wider than the
  viewport itself and with almost no visible height. No panel content (Template Name field, wake/bed
  time, Routine list, etc.) is visible or reachable. The close "X" button is still clickable and does
  collapse it back to the closed state.
- **Evidence:**
  `docs/views/planner-templates/screenshots/day-planner-templates-id--mobile-panel-open2.png`; DOM
  measurement via `getBoundingClientRect()` on the panel's `VCard`:
  `{width: 400, height: 16.02, top: 80, left: -166, display: "flex", visibility: "visible"}`.
- **Repro:** 1. Open `/day-planner/templates/20001` (or any valid id). 2. Resize to 390×844. 3. Tap the
  unnamed panel toggle (the thin pill below the breadcrumb — see A3). 4. Panel renders as a near-invisible
  sliver, no content visible or usable.
- **Verify:** 1. Repeat the repro above. 2. **Pass condition:** the opened panel's bounding box has a
  width ≤ the viewport width and a height that fits its content (Template Name field etc. all visible and
  tappable), positioned fully on-screen.
- **Root cause guess:** `PlannerSidePanelShell.vue:7` applies `width` as a fixed inline style with no
  breakpoint override, and `TemplateDayPlannerView.vue` passes a literal `width="400px"` (vs. the
  380px default the day-planner view implicitly relies on) — neither adapts for `smAndDown`. The
  near-zero height is a secondary effect of the same fixed width overflowing its flex-column mobile
  parent.
- **Suggested fix:** Make `width` responsive in `PlannerSidePanelShell.vue` (e.g. `mdAndUp ? width :
  '100%'` or a `max-width: 100vw`), rather than a bare inline style.

---

### B1. The card title row is too crowded at 1440px: the Active/Inactive switch label wraps one character per line, and the day-type chip is hard-clipped mid-word
- **Status:** open
- **Severity:** bug
- **Where:** `TemplateCard.vue:26-51` (the `VCardTitle`'s right-hand `d-flex align-center ga-3` group:
  `DayTypeChip`, `VSwitch`, pin `VIconBtn`), all three cards on `/day-planner/templates` at a standard
  1440×900 desktop viewport (not a narrow/mobile one)
- **Expected:** Plain user sense — visible text should not wrap to one character per line, and a
  truncated label should read as truncated (an ellipsis), not be hard-clipped mid-word with no indication
  more text exists.
- **Actual:** The `VSwitch`'s `label` ("Active"/"Inactive") renders in a box measured at **20.48px wide**
  with `white-space: normal`, so "Active" wraps to "A / c / ti / v / e" stacked vertically on all three
  cards. The `DayTypeChip` next to it is squeezed to **52.6px** with `text-overflow: clip` while its
  content needs 70.6px, so "Weekend" renders as "Wee" and "Workday" as "Workd" — hard-clipped, no
  ellipsis, no tooltip.
- **Evidence:** `docs/views/planner-templates/screenshots/day-planner-templates--default.png` (visible on
  all three cards); computed styles via `getComputedStyle`: switch label `{width: "20.4844px", whiteSpace:
  "normal"}`; chip `{width: "52.6406px", overflow: "hidden", textOverflow: "clip"}` vs. content width
  `"70.5625px"`.
- **Repro:** 1. Go to `/day-planner/templates` at 1440×900 (or wider). 2. Look at any card's title row.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** "Active"/"Inactive" reads as a single
  horizontal line, and the day-type chip either fits its full text or truncates with a visible ellipsis
  (optionally a tooltip with the full value).
- **Root cause guess:** The title row's right-hand group has no element with `flex-shrink: 0` protecting
  the name/icon on the left, so `DayTypeChip`, the switch label, and the pin button all compete for
  whatever space is left after `justify-space-between` — both symptoms share this one root cause.
- **Suggested fix:** Give the `VSwitch` a `min-width` (or drop its inline `label` in favour of an
  icon+tooltip) and set `text-overflow: ellipsis` (with `white-space: nowrap`) explicitly on the chip's
  content, or simply give the row less to fit (e.g. move the pin button out of this row).

### B2. A new template can be submitted with no "Suggested for Day Type", and fails only after the dialog has already closed
- **Status:** open
- **Severity:** bug
- **Where:** `TaskPlannerDayTemplateDetailsForm.vue:38-43` (`VSelect v-model="formData.suggestedForDayType"`
  — no `:rules`, no required indicator) and `TemplateDetailsForm.vue:29-34` /
  `TemplateListView.vue:335-352,371-402` (dialog closes on the form's own `validateAndGetData()`, before
  the actual `create()` API call runs)
- **Expected:** A field the backend requires (see Actual) should either be validated client-side before
  the dialog closes, or default to a valid value the way the "Duplicate" and "Edit" flows already do.
- **Actual:** Opening "Add Template" and clicking "Create" with the day-type field left at its default
  (empty) closes the dialog immediately, then the `POST /api/task-planner-day-template` fails with
  `400 {"errors":{"serializerErrors":["JSON deserialization for type
  '...TaskPlannerDayTemplateRequest' was missing required properties including:
  'suggestedForDayType'."]}}`. The only feedback is a snackbar reading the raw backend text "One or more
  errors occurred!" — the dialog does not reopen, and everything the user typed (name, description, times)
  is lost. By contrast, "Duplicate" and "Edit Details" both pre-fill this field from the source template,
  so the gap is invisible unless a user starts a template completely from scratch.
- **Evidence:**
  `docs/views/planner-templates/screenshots/day-planner-templates--create-failed-snackbar.png`; network:
  `POST https://localhost:8080/api/task-planner-day-template => 400`, response body quoted above; console:
  `AxiosError: Request failed with status code 400 ... at handleSaveTemplate (TemplateListView.vue:175) at
  openTemplateDialog (TemplateListView.vue:153)`. Confirmed the template list count stayed at 3 (no
  partial entity was created).
- **Repro:** 1. Go to `/day-planner/templates`. 2. Click "Add Template". 3. Type a name (leave "Suggested
  for Day Type" unset). 4. Click "Create". Dialog closes; a generic-text snackbar appears; no template was
  created; the typed name is gone.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** either the form blocks submission with a visible
  "required" message on the day-type field, or the create request succeeds with a sensible default value —
  either way, the user is never left with a closed dialog, lost input, and a raw backend error string.
- **Suggested fix:** Add a required rule to the `VSelect` at `TaskPlannerDayTemplateDetailsForm.vue:38-43`
  (matching whatever the backend actually requires), or give `TaskPlannerDayTemplateRequest`'s default
  constructor a non-null `suggestedForDayType` the way the "New template" dialog already defaults
  `defaultWakeUpTime`/`defaultBedTime`.

### B3. The comparison dialog's "Confirm" button does nothing — it should not exist
- **Status:** open
- **Severity:** bug
- **Where:** `TemplateComparisonDialog.vue:6` (`:showConfirmBtn="false"`) vs.
  `src/_common/component/dialog/MyDialog.vue:94,110` (the real prop is `hasConfirmBtn`, defaulting `true`)
- **Expected:** A read-only comparison view should show only "Cancel" — which is clearly the intent, given
  `TemplateComparisonDialog.vue` explicitly tries to hide the confirm button.
- **Actual:** `MyDialog` has no `showConfirmBtn` prop — only `hasConfirmBtn`. The mistyped prop is silently
  dropped into `$attrs` and has no effect, so `hasConfirmBtn` stays at its default `true` and a "Confirm"
  button renders. Clicking it calls `emit('confirmed')` on `MyDialog`, which `TemplateComparisonDialog.vue`
  never listens for (no `@confirmed` handler) — the dialog does not close and nothing happens.
- **Evidence:** Source read of both files (prop name mismatch, confirmed by grepping `MyDialog.vue` for
  `showConfirmBtn` — zero matches, only `hasConfirmBtn`); live repro — clicking "Confirm" in the open
  dialog left it open with an unchanged snapshot.
- **Repro:** 1. Open the Compare Templates dialog (see X1's repro). 2. Click "Confirm". 3. Nothing happens;
  dialog stays open.
- **Verify:** 1. Open the Compare Templates dialog. 2. **Pass condition:** only a "Cancel" button is
  present (no "Confirm").
- **Root cause guess:** Simple prop-name typo — same fix trivially closes X1's dialog-emptiness bug's
  sibling defect, but is independent of it.
- **Suggested fix:** Change `TemplateComparisonDialog.vue:6` to `:hasConfirmBtn="false"`.

### B4. Sort choice and split-view template picks are not reflected in the URL
- **Status:** open
- **Severity:** bug
- **Where:** `TemplateListView.vue:228` (`sortBy` is a plain `ref`, not a route query param) and
  `TemplateSplitView.vue:103-104` (`leftTemplateId`/`rightTemplateId`, same)
- **Expected:** Per `CLAUDE.md`'s "URL State" rule: "Store filterable/bookmarkable state (filters, tabs,
  search queries, pagination) in URL query params so users can share/bookmark/navigate back."
- **Actual:** Selecting "Alphabetical" on the list, or picking two templates on the split view, changes
  nothing in `location.href`. Reloading either page (or sharing the URL) loses the choice — confirmed on
  the split view: after picking left=Home Office/right=Office Day and reloading, both panels reset to
  "Select a template."
- **Evidence:** `location.href` stayed `https://localhost:3000/day-planner/templates` after changing sort;
  a reload of `/day-planner/templates/split` after selecting both sides returned two "Select a template"
  panels (`docs/views/planner-templates/screenshots/day-planner-templates-split--empty.png` matches the
  reloaded state exactly).
- **Repro:** 1. On `/day-planner/templates`, change sort to "Alphabetical" — URL unchanged. 2. On
  `/day-planner/templates/split`, pick both templates, then reload — both reset to empty.
- **Verify:** 1. Repeat either repro. 2. **Pass condition:** the choice appears as a query param, and
  reloading (or opening the URL fresh) restores it.
- **Suggested fix:** Move `sortBy` to a `useRoute`/`useRouter` query param (pattern already used elsewhere
  per CLAUDE.md); same for `leftTemplateId`/`rightTemplateId` on the split view.

### B5. An invalid template id shows the previously-viewed template's name instead of a not-found state
- **Status:** open
- **Severity:** bug
- **Where:** `TemplatePlannerPanel.vue:47-56` (`loadTemplateDetails`, no try/catch, no reset of
  `store.templateName`/`store.currentTemplateId` on failure) combined with `templateDayPlannerStore`'s
  default sessionStorage persistence
- **Expected:** Navigating to a template id that doesn't exist should show some indication the template
  wasn't found — at minimum, not a real template's name as if it had loaded successfully.
- **Actual:** After viewing `/day-planner/templates/20001` ("Home Office") and then navigating to
  `/day-planner/templates/999999`, the page header still reads **"Home Office"**, even though
  `GET /api/task-planner-day-template/999999 → 404` and the side panel's own form fields are correctly
  blank. The store persists `currentTemplateId`/`templateName` to `sessionStorage`
  (`templateDayPlanner={"...","currentTemplateId":20001,"templateName":"Home Office"}`), and because
  `loadTemplateDetails()`'s `await fetchById(templateId)` throws before reaching the lines that would
  overwrite those fields, the stale hydrated values are simply never cleared.
- **Evidence:**
  `docs/views/planner-templates/screenshots/day-planner-templates-id--invalid.png` (header reads "Home
  Office" while the form panel is blank); `sessionstorage-list` output showing
  `templateDayPlanner={"...","currentTemplateId":20001,"templateName":"Home Office"}` captured
  immediately after loading the 999999 route; console: `AxiosError: Request failed with status code 404
  ... at loadTemplateDetails (TemplatePlannerPanel.vue:40:24)`.
- **Repro:** 1. Visit `/day-planner/templates/20001` (loads "Home Office"). 2. Visit
  `/day-planner/templates/999999`. 3. Header still reads "Home Office"; grid is empty; console shows a 404.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** the header does not show a stale template name —
  either a "template not found" state, a fallback label, or a redirect back to the list.
- **Suggested fix:** Wrap `loadTemplateDetails()`'s body in try/catch; on failure, reset
  `store.currentTemplateId`/`store.templateName` (or route away) instead of leaving them untouched.

---

### A1. Template card pin-toggle button has no accessible name
- **Status:** open
- **Severity:** a11y
- **Where:** `TemplateCard.vue:43-50` (`VIconBtn icon="thumbtack"`, no `aria-label`), every template card
  on `/day-planner/templates`
- **Expected:** Every icon-only interactive control needs an accessible name (CLAUDE.md's icon-only
  control rule; also the pattern the shell inventory's A2 already flagged for the sidebar toggle).
- **Actual:** `eval` on the button returns `{text: "", aria: null, title: ""}`. It is reachable only by a
  positional locator (`getByRole('button').filter({hasText:/^$/}).nth(3)`), not by name.
- **Evidence:** Direct `eval` of the DOM node's `textContent`/`aria-label`/`title`, all empty; confirmed
  the same button does trigger `PATCH .../pinned` (204) when clicked, so it is genuinely this control.
- **Repro:** 1. Go to `/day-planner/templates`. 2. Inspect the pin icon button on any card for an
  accessible name.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** the button exposes a localized accessible name
  (e.g. "Pin template" / "Unpin template", varying with state) addressable via `getByRole('button',
  {name: ...})`.
- **Suggested fix:** Add a bound `:aria-label` reflecting `isPinned` to the `VIconBtn` at
  `TemplateCard.vue:43`.

### A2. Compare-mode card checkbox has no accessible name and is pointer-blocked by the card's own icon
- **Status:** open
- **Severity:** a11y
- **Where:** `TemplateCard.vue:10-17` (`VCheckbox` in compare mode, no label), pointer-intercepted by the
  `VIcon` at `TemplateCard.vue:18-23`
- **Expected:** A selection checkbox needs an accessible name, and should be directly clickable — not
  require clicking around it.
- **Actual:** In compare mode, the per-card checkbox has no accessible name (bare `checkbox` role, no
  text). Clicking it directly via Playwright times out: `<svg ... data-icon="umbrella-beach"> ... subtree
  intercepts pointer events` — the template's own icon, rendered just after the checkbox in the same flex
  row, sits on top of it. The card body itself is still clickable and does toggle selection (that's the
  workaround used throughout this pass), so the feature is not blocked end-to-end, but the checkbox
  control as such is unusable both by name and by direct click.
- **Evidence:** Playwright's own retry log quoting the intercepting element; snapshot showing the checkbox
  as a bare, unnamed `checkbox` node.
- **Repro:** 1. Go to `/day-planner/templates`, click "Compare". 2. Try to click a card's checkbox
  directly (not the card body). 3. Click is intercepted by the template icon.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** the checkbox has an accessible name (e.g. "Select
  `<template name>` for comparison") and a direct click on it succeeds without being intercepted.
- **Suggested fix:** Add `:aria-label` to the `VCheckbox`, and either raise its `z-index`/hit area or move
  the icon so the two don't overlap.

### A3. Mobile side-panel toggle button has no accessible name
- **Status:** open
- **Severity:** a11y
- **Where:** the collapsed-panel toggle rendered by `PlannerSidePanelShell.vue` at `smAndDown` widths, on
  `/day-planner/templates/:templateId`
- **Expected:** Same icon-only-control rule as A1.
- **Actual:** `eval` on the toggle returns `{text: "", aria: null, title: ""}`; only reachable by
  `getByRole('button').nth(4)`.
- **Evidence:** Direct `eval` of the DOM node, same method as A1. (This finding is independent of X2's
  layout bug — even if X2 is fixed, this button would still lack a name.)
- **Repro:** 1. Open `/day-planner/templates/20001` at 390×844. 2. Inspect the thin pill-shaped control
  below the breadcrumb for an accessible name.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** the control exposes a localized accessible name
  (e.g. "Open template details panel").
- **Suggested fix:** Add an `:aria-label` to whichever element renders the collapsed-panel affordance in
  `PlannerSidePanelShell.vue`.

---

### P1. The Scheduled Days row is clipped in the 400px-wide side panel, with no scroll or wrap
- **Status:** open
- **Severity:** polish
- **Where:** `TaskPlannerDayTemplateDetailsForm.vue` (the `VBtnToggle` rendering Mon–Sun), inside the
  400px-wide details panel on `/day-planner/templates/:templateId`
- **Expected:** All seven day buttons should be visible, or the row should indicate more content exists
  (scroll/wrap), rather than being silently cut off by the panel's edge.
- **Actual:** At the panel's fixed width, only Mon–Fri (and part of "Fri") are visible; Sat/Sun are cut
  off by the panel boundary with `overflow: hidden` and no scrollbar or wrap.
- **Evidence:** `docs/views/planner-templates/screenshots/day-planner-templates-id--default.png` (bottom
  of the panel, "FRI" clipped, no Sat/Sun visible).
- **Repro:** 1. Open `/day-planner/templates/20001`. 2. Look at the "Scheduled Days" row in the side panel.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** all seven day buttons are visible or reachable
  (via wrap, smaller buttons, or a scroll affordance).
- **Suggested fix:** Let the `VBtnToggle` wrap onto a second line at this width, or reduce button size
  further at narrow panel widths.

### P2. `MiniTimeline.vue` leaves a debug `console.log` in place
- **Status:** open
- **Severity:** polish
- **Where:** `MiniTimeline.vue:50` (`console.log(tasks)`, right after the props destructure)
- **Expected:** No debug logging in shipped code.
- **Actual:** Every render of every template card's mini-timeline logs the raw `tasks` array to the
  console — three log lines on every load of `/day-planner/templates` with the current seed.
- **Evidence:** Console output: `[LOG] Proxy(Array) @ .../MiniTimeline.vue:26` ×3 on a fresh load (line 26
  in the transformed/mapped output; source line is 50 in the `.vue` file's `<script setup>` block).
- **Repro:** 1. Go to `/day-planner/templates`. 2. Open the console. 3. See one `Proxy(Array)` log per
  visible card.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** no `console.log` output from `MiniTimeline.vue`.
- **Suggested fix:** Delete `MiniTimeline.vue:50`.

---

### U1. Header stat line's exclusion of background tasks is unverified with current seed data
- **Status:** open
- **Severity:** unverified
- **Where:** `TemplateDayPlannerView.vue`'s `taskStats` computed (filters `nonBgTasks`), header of
  `/day-planner/templates/:templateId`
- **What would verify it:** All twelve seeded template tasks across the three fixture templates have
  `isBackground: false`, so the stat line's exclusion of background tasks from the count/planned/free
  numbers was never visibly exercised — the wording ("N tasks") could plausibly mislead once a background
  task exists (a 4-task template with one background task would read "3 tasks"). This is very likely
  intentional (background tasks don't block time), but whether the *label* should say "3 tasks (+1
  background)" or similar is a judgement call that needs a template with at least one `isBackground` task
  to evaluate against the actual rendered wording.

### U3. Split view's back button may have no accessible name (source read only, not reproduced in this pass)
- **Status:** open
- **Severity:** unverified
- **Where:** `TemplateSplitView.vue:5-11` — `<VBtn icon="arrow-left" variant="tonal" color="secondaryOutline"
  size="small" @click="...">`, the back control at the top of `/day-planner/templates/split`
- **What would verify it:** Source read only — no `aria-label` and no text content are declared on this
  button, matching the same pattern confirmed live for A1 (pin toggle) and A3 (mobile panel toggle). This
  pass's browser session ended before this specific button was `eval`'d directly, so it is reported as
  unverified rather than a confirmed `A` finding per the pass's own evidence rule. A future pass should
  `eval` the button for `{textContent, aria-label, title}` the same way A1/A3 were confirmed, and if
  confirmed, refile it as an `A` finding (likely "A4") rather than adding a new `U`.

### U2. Cross-template drag-and-drop task move (split view) not exercised by an actual drag
- **Status:** open
- **Severity:** unverified
- **Where:** `TemplateSplitView.vue:80-207` (`@atlaskit/pragmatic-drag-and-drop` wiring — `moveTask`,
  `setupDropTargets`, the `monitorForElements` handler)
- **What would verify it:** A drag handle icon is visible on each task block in the split view (confirmed
  in `docs/views/planner-templates/screenshots/day-planner-templates-split--populated.png`), and the
  source code path (`PATCH` the task's `templateId`, splice it out of the source store, push it into the
  target store) reads as complete — but simulating a real pointer drag reliably via `playwright-cli` is
  failure-prone enough that this pass did not attempt it live. A future pass should drag a task from one
  panel to the other and confirm: the task disappears from the source grid, appears in the target grid at
  the same time-of-day, the success snackbar fires, and a mid-drag drop outside either panel does not lose
  the task.
