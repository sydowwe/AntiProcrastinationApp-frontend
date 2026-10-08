# planner-templates — findings

> Pass: live verification · captured 2026-09-24 · commit `222f0051`

**Tally:** blocker 0 open (X1, X2 fixed) · bug 0 open (B1–B6 fixed) · a11y 0 open (A1–A4 fixed) ·
polish 1 open (P4; P1, P2 fixed, P3 fixed with its live retest blocked) · opportunity 0 ·
unverified 0 open (U2, U3 fixed) — 18 entries, **1 open** (P4, from the x4 narrow-viewport pass, round 6).
B6 was fixed 2026-10-08 (`F99`). Of the other 16 closed, 15 were confirmed live by the 2026-09-25 retest or earlier; P3 is blocked pending a
background-task fixture row

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-14 | `6aac48bb` | initial inventory pass |
| 2 | 2026-09-15 | `041d9b2d` | **mutation pass** — full Template create→edit→duplicate→delete lifecycle and template-task create→edit→delete driven live against fixture `e2e-v4`. Template CRUD is clean: create auto-navigates to the new template's detail view (undocumented until now), edit updates the card in place, duplicate pre-fills `"<name> (copy)"` plus every field including day type (verified via Cancel, not committed), and delete correctly cascades server-side with an accurate task count in the confirmation text. Verified the `askBeforeDelete` preference end-to-end for the first time in this unit: with it OFF, a single template task and a template with 0 tasks both delete with zero confirmation, while a template with ≥1 task still shows the cascade "will be deleted with it" prompt regardless of the preference — CLAUDE.md's cascade rule holds exactly as documented. Added a real `isBackground` template task (none existed in the fixture before) and used it to settle **U1** (confirmed live: the header truly excludes background tasks from both the count and the planned/free hours) — refiled as **P3**, a labelling suggestion, since the exclusion itself is working as designed. The same background task exposed a new confirmed a11y gap, **A4**: its block is a bare `<div>` with no role, name or tabindex, unreachable by Tab and immune to Escape. Broadened **B2**'s evidence: the create/edit form has *zero* `:rules` on any field (confirmed by reading `TaskPlannerDayTemplateDetailsForm.vue` in full), not only the day-type gap previously documented — an empty **Template Name** reaches the server unchallenged too. Attempted the split view's cross-template drag three times (`dragTo`, a manual multi-step pointer drag, and a handle-targeted drag ending inside the other panel); all three were captured by the source panel's own same-grid reposition instead of crossing panels (confirmed via the resulting `PATCH` body changing only `startTime`/`endTime`, never `templateId`) — **U2** stays unverified, now with much more specific negative evidence. Pin toggle confirmed to move a card between the Pinned/Active sections live in both directions, PATCH-backed. X1, X2, B1, B3, B4, B5, A1, A3, P1, P2 and U3 were not retested this round. Account state fully restored by hand (every created template/task deleted, the `askBeforeDelete` preference and pin state reset to their original values) — no reseed needed; the next agent can reuse `.playwright-cli/auth.json` if still fresh, or sign in via the form (`test@example.com` / `testpass123` from `e2e/.state/seed.json`) as this session did after the loaded `e2e/.state/auth-10001.json` state file's token had already expired. |
| 3 | 2026-09-24 | `222f0051` | **source-read check, no live drive** — read every file each open finding pointed at rather than re-running the app. All 13 open findings (X1, X2, B1-B5, A1-A3, P1-P3, U3) check out fixed in code, most tagged with an `Fnn`/`FW` reference in an explanatory comment at the fix site, so they landed as part of the app's ongoing fix queue rather than from this doc directly. **U2 is the one exception** — the drag-and-drop wiring in `TemplateSplitView.vue` is unchanged from round 2, so it stays unverified pending an actual live drag attempt (this pass did not drive the browser). See each finding below for the specific evidence read. |
| 4 | 2026-09-24 | `222f0051` | **live U2 retest.** First pass hit an unrelated environment problem: sign-in failed three ways (cached-state refresh 500s, fresh form-login 500s) because a pending backend migration hadn't been applied yet; once it was, `POST /api/test/seed` plus a fresh form login worked cleanly. Opened `/day-planner/templates/split?left=20001&right=20002` and ran `playwright-cli drag` from the "Bug Fixing" task's drag handle to the right panel's time grid — the exact same invocation that registered as a same-panel reschedule in round 2. This time it produced `PUT /api/template-planner-task/20102` with `templateId` changed from 20001 to 20002 and the start/end time untouched, and a follow-up snapshot confirmed the task moved panels. Confirms the `pointer-events: auto` fix found by source read in round 3 (`TemplatePlannerTaskBlock.vue:74-83`) is the real fix — round 2's failures were never about how the drag was scripted, only about the handle not receiving the pointer press. State was reset via a second `POST /api/test/seed` afterward. **U2 closed — every finding in this doc is now fixed.** |
| 5 | 2026-09-25 | `d423edcc` | **retest round** — 13 retested live: X1, X2, B1, B2, B3, B4, B5, A1, A2, A3, P1, P2, U3 pass; none reopened; P3 blocked (no seeded template has an `isBackground` task, and the unit notes forbid adding one to a fixture row). Account: `primaryUser`. Mutations made and reverted: pin-toggled Home Office (20001) on and back off via its pin button (PATCH `.../20001/pinned` x2, confirmed via request log); opened "Add Template" and submitted empty (B2) — no template was created (no POST fired), dialog cancelled; opened and cancelled the Compare dialog (X1/B3); the `pinned` fixture template (Relaxed Weekend) was never touched. No regressions seen outside the Verify blocks. |
| 6 | 2026-10-06 | `27dd210b` | **x4 narrow viewport (390×844)** — 3 views checked; new: B6, P4. X2 and A3 (mobile side panel) did not reproduce. On the standalone view the panel is 8–382 × 64–844 and named. Grid, panel-focus and touch defects on `TemplateDayPlannerView` and the split panes were added to planner-day B9, A2 and U1's **Where**, not re-filed here. The selection bar was added to `_shell` B2, and the Add Template dialog to `_shell` U3. |

---

### X1. The "Compare Templates" dialog renders completely empty, every time it is opened
- **Status:** fixed and verified (retest 2026-09-25, live) — opened Compare on Home Office + Office Day: both
  panels showed real name, icon/metadata chips and a populated timeline with task blocks; no `CanceledError`
  in the console.
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
- **Status:** fixed and verified (retest 2026-09-25, live) — at 390×844 on `/day-planner/templates/20001`,
  opened panel measured `{width: 374, height: 780, top: 64, left: 8}` (fully on-screen, width < viewport);
  all fields (Template Name, Wake Up/Bed Time, Suggested for Day Type, Tags, Scheduled Days) visible and
  tappable. Screenshot: `screenshots/retest-2026-09-25-X2.png`.
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
- **Status:** fixed and verified (retest 2026-09-25, live) — at 1440×900 on `/day-planner/templates`, the
  switch renders with no visible wrapping label (just the toggle), and day-type chips ("Weekend", "Workday")
  render full-text with no clipping on all three cards. Screenshot: `screenshots/retest-2026-09-25-B1.png`.
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

### B2. The entire create/edit template form has zero client-side validation — a new template can be submitted with no name and no "Suggested for Day Type", and fails only after the dialog has already closed
- **Status:** fixed and verified (retest 2026-09-25, live) — opened "Add Template", clicked "Create" with
  every field at default: dialog stayed open, Template Name showed "This field is required", no
  `POST /api/task-planner-day-template` fired (confirmed via request log). "Suggested for Day Type" is now
  pre-filled with a sensible default ("Workday") rather than needing its own required message — satisfies
  the pass condition's OR clause. Cancelled the dialog; no template was created.
- **Where:** `TaskPlannerDayTemplateDetailsForm.vue` in full (read end-to-end in round 2: not one field in
  the entire `<VForm>` — `Template Name`, `Wake Up`, `Bed Time`, `Suggested for Day Type`, `Suggested
  Location` — carries a `:rules` prop; `validateAndGetData()` calls `form.value?.validate()`, but with no
  rules registered on any field that call always resolves truthy) and `TemplateDetailsForm.vue:29-34` /
  `TemplateListView.vue:335-352,371-402` (dialog closes on the form's own `validateAndGetData()`, before
  the actual `create()` API call runs)
- **Expected:** A field the backend requires (see Actual) should either be validated client-side before
  the dialog closes, or default to a valid value the way the "Duplicate" and "Edit" flows already do. A
  required text field like Template Name should not reach the server empty at all.
- **Actual:** Opening "Add Template" and clicking "Create" with every field left at its default (name
  empty, day-type unset) closes the dialog immediately, then the `POST /api/task-planner-day-template`
  fails with `400 {"errors":{"serializerErrors":["JSON deserialization for type
  '...TaskPlannerDayTemplateRequest' was missing required properties including:
  'suggestedForDayType'."]}}`. **Round 2 (mutation pass) confirmed this is broader than the day-type gap
  originally filed here:** the request body sent was `{"name":"","description":null,"icon":null,
  "isActive":true,"defaultWakeUpTime":{"hours":7,"minutes":0},"defaultBedTime":{"hours":23,"minutes":0},
  "tags":[],"scheduledDays":[]}` — an empty `name` reached the server unchallenged, and the 400 response
  complains only about `suggestedForDayType`, meaning the backend itself does not reject an empty name
  either. A template could very plausibly be created with a **blank name** the moment a day type is also
  supplied — this pass didn't need to go further to prove the client-side gap, since the form has no
  `:rules` anywhere to catch it. The only feedback on the empty-submit failure is a snackbar reading the
  raw backend text "One or more errors occurred!" — the dialog does not reopen, and everything the user
  typed (name, description, times) is lost. By contrast, "Duplicate" and "Edit Details" both pre-fill the
  day-type field from the source template, so that particular gap is invisible unless a user starts a
  template completely from scratch.
- **Evidence:**
  `docs/views/planner-templates/screenshots/day-planner-templates--create-failed-snackbar.png` (round 1);
  `docs/views/planner-templates/screenshots/day-planner-templates--mutation-empty-create.png` (round 2,
  same empty-submit repro); network: `POST https://localhost:8080/api/task-planner-day-template => 400`,
  request/response bodies quoted above; console: `AxiosError: Request failed with status code 400 ... at
  handleSaveTemplate (TemplateListView.vue:175) at openTemplateDialog (TemplateListView.vue:153)`.
  Confirmed the template list count was unaffected both rounds (no partial entity was created). Round 2
  also read `TaskPlannerDayTemplateDetailsForm.vue` in full and confirmed zero `:rules` props exist on any
  of its fields — this is a source-corroborated claim about the *name* field specifically (not separately
  reproduced with only the name left blank and a day type supplied), so treat that one sentence as
  narrower-confidence than the reproduced day-type repro.
- **Repro:** 1. Go to `/day-planner/templates`. 2. Click "Add Template". 3. Leave every field at its
  default (empty name, unset day type). 4. Click "Create". Dialog closes; a generic-text snackbar appears;
  no template was created; everything typed is gone.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** the form blocks submission with visible
  "required" messages on both the Template Name and the day-type field (or the create request succeeds
  with sensible defaults) — either way, the user is never left with a closed dialog, lost input, and a raw
  backend error string.
- **Suggested fix:** Add `:rules` to `TaskPlannerDayTemplateDetailsForm.vue`'s Template Name (required,
  non-blank) and Suggested for Day Type (matching whatever the backend actually requires) fields, or give
  `TaskPlannerDayTemplateRequest`'s default constructor non-null/non-blank defaults the way it already
  defaults `defaultWakeUpTime`/`defaultBedTime`.

### B3. The comparison dialog's "Confirm" button does nothing — it should not exist
- **Status:** fixed and verified (retest 2026-09-25, live) — opened the Compare Templates dialog: only
  "Cancel" is present, no "Confirm" button.
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
- **Status:** fixed and verified (retest 2026-09-25, live) — changing sort to "Alphabetical" set
  `?sort=alphabetical` and it survived a reload; opening `/day-planner/templates/split?left=20001&right=20002`
  directly loaded both panels (no "Select a template" placeholders) and a reload kept them populated.
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
- **Status:** fixed and verified (retest 2026-09-25, live) — viewed `/day-planner/templates/20001` (Home
  Office) then navigated to `/day-planner/templates/999999`: header shows no stale name, form fields blank,
  and an alert reads "Template not found — There is no template with id 999999 — it was most likely
  deleted." with a "Back to templates" link.
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
- **Status:** fixed and verified (retest 2026-09-25, live) — Home Office's pin button read "Pin template:
  Home Office"; clicked it, name switched to "Unpin template: Home Office" and `PATCH
  /api/task-planner-day-template/20001/pinned` (204) fired; toggled back, name reverted to "Pin template:
  Home Office" with a second matching PATCH. `pinned` fixture template (Relaxed Weekend) untouched.
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
- **Status:** fixed and verified (retest 2026-09-25, live) — in compare mode, checkboxes are named "Select
  `<template name>` for comparison"; direct clicks on `getByRole('checkbox', { name: 'Select Home Office for
  comparison' })` and the Office Day equivalent both succeeded with no interception error.
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
- **Status:** fixed and verified (retest 2026-09-25, live) — at 390×844 on `/day-planner/templates/20001`,
  the collapsed-panel control is named "Open panel"; after opening, the close control is a labeled "X".
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

### A4. A background template task's grid block has no accessible role, name or tabindex — it is completely unreachable by keyboard
- **Status:** fixed and verified (2026-09-22, `F78` — `BackgroundTaskBlock` is `role="button"` + `tabindex="0"`
  + `aria-pressed` + the composed `aria-label` (the former `d-sr-only` sentence, now the element's own name)
  + `aria-keyshortcuts`, wired to the same `useTaskBlockKeyboard` map the foreground block uses. Verified
  live on `/day-planner/templates/20001` with a background task created for the pass and deleted after: Tab
  from the preceding foreground task lands on it, Enter/Space select it ("1 selected"), Escape clears it,
  and a click on a second task still adds — "2 selected". Was **new in round 2 (mutation pass)**)
- **Severity:** a11y
- **Where:** the `.background-task-block` rendered for a template task with `isBackground: true`, on
  `/day-planner/templates/:templateId` (and both panels of the split view) — no seeded fixture task had
  `isBackground: true` before this pass, so this block never rendered during the round-1 inventory pass
- **Expected:** Same icon/control accessibility rule already applied to the foreground task blocks (which
  are real `<button>` elements with a full composed accessible name — see `inventory.md`) and to A1/A3:
  every interactive grid element needs a role, a name, and to sit in the Tab order.
- **Actual:** `eval` on the block returns `{tag: "DIV", role: null, tabindex: null, ariaLabel: null}`. It
  has a visually-hidden sibling text ("Background activity: Feature Development, 19:30 to 20:30") but
  that text is not exposed as an accessible name for anything, because the element it would name has no
  role at all. Consequences confirmed live: (1) clicking it *does* select it (mouse-only) and the
  selection-actions bar appears correctly; (2) **Tab does not reach it** — focusing the one foreground
  task button on the same grid and pressing Tab jumps straight to the "Delete" button in the toolbar,
  skipping the background block entirely, which directly contradicts the grid's own on-screen keyboard
  help text ("Tab moves between tasks"); (3) **Escape does not clear its selection** — selecting only the
  background task and pressing Escape leaves "1 selected" still showing on the toolbar, because Escape's
  handler depends on keyboard focus being inside the grid, which a block with no `tabindex` can never
  receive. (Multi-select itself works correctly: clicking a second, focusable task afterwards *adds* to
  the selection rather than replacing it, e.g. "2 selected", and a multi-delete correctly confirms "delete
  2 selected tasks?" — the Escape/Tab gaps are specific to the background block's missing focusability,
  not a general selection bug.)
- **Evidence:** `docs/views/planner-templates/screenshots/day-planner-templates-id--mutation-background-task-stat.png`
  (the block rendered); direct `eval` of the DOM node returning the empty role/tabindex/aria-label object
  quoted above; live keyboard test: select the foreground "Bug Fixing" task by click, press Tab, confirm
  `document.activeElement` is the "Delete" toolbar button, not the background block; live test: select
  the background task alone by click, press Escape, confirm the toolbar still reads "1 selected".
- **Repro:** 1. Create (or find) a template task with "Is background" checked. 2. Click it — it selects
  (toolbar shows "1 selected") but note it renders as a `<div>`, not a `<button>`. 3. Press Escape — "1
  selected" remains. 4. Click a different, normal task instead, then press Tab — focus skips the
  background block and lands on the toolbar's "Delete" button.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** the background block is a focusable element with
  a role and an accessible name (e.g. "Background activity: `<name>`, `<start>` to `<end>`"), appears in
  the Tab sequence alongside foreground tasks, and Escape clears its selection like any other task.
- **Root cause guess:** the background-task rendering path in the template grid component was built as a
  plain positioned `<div>` (likely for the different visual treatment — a thin vertical bar, per the
  screenshot) without carrying over the `<button>` + composed-aria-label treatment the foreground task
  path already has.
- **Suggested fix:** Give the background block the same `role="button"`, `tabindex="0"`,
  keydown-select-on-Enter/Space and composed `aria-label` the foreground task blocks already use, so it
  participates in the existing Tab/Escape/selection logic instead of only being reachable by mouse.

---

### P1. The Scheduled Days row is clipped in the 400px-wide side panel, with no scroll or wrap
- **Status:** fixed and verified (retest 2026-09-25, live) — at 1440×900 on `/day-planner/templates/20001`,
  the Scheduled Days row wraps to two lines (Mon–Sat, then Sun) and all seven day buttons are fully visible.
  Screenshot: `screenshots/retest-2026-09-25-P1.png`.
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
- **Status:** fixed and verified (retest 2026-09-25, live) — loaded `/day-planner/templates` (3 cards
  rendered): `console info` and `console error` both returned 0 matching messages.
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

### P3. The header stat line's task count doesn't hint that background tasks exist when it excludes them
- **Status:** fixed, retest blocked 2026-09-25 — none of the three seeded templates (Home Office: 5 tasks,
  Office Day: 4 tasks, Relaxed Weekend: 3 tasks) has a task with `isBackground: true`; the unit prompt
  directs not to add one to a seeded template. Could not exercise the header's background-count wording
  live.
- **Severity:** polish
- **Where:** `TemplateDayPlannerView.vue`'s `taskStats` computed (filters `nonBgTasks`), header of
  `/day-planner/templates/:templateId`
- **Expected:** Plain user sense — round 1 flagged this as `U1` because no seeded task had
  `isBackground: true`, so the exclusion had never been visibly exercised. Round 2 added a real background
  task and confirmed the exclusion works exactly as the code suggests; the only open question is whether
  the wording should say so.
- **Actual:** With one foreground task ("Bug Fixing", 1h) and one background task ("Feature Development",
  1h) on the same template, the header read **"1 task · 1h planned · 15h free"** — identical to before the
  background task was added. A user looking at the grid sees two blocks but the header says one; nothing
  in the header hints that a second, background task exists. This is very likely intentional (background
  tasks don't block time, so excluding them from "planned"/"free" makes sense), but the plain **count**
  silently dropping a real task is a labelling gap, not a computation bug.
- **Evidence:** `docs/views/planner-templates/screenshots/day-planner-templates-id--mutation-background-task-stat.png`
  (header reads "1 task · 1h planned · 15h free" with the background block visibly rendered underneath);
  confirmed `.background-task-block` count was 1 via `eval` at the same moment.
- **Repro:** 1. Add one normal task and one "Is background" task to any template. 2. Read the header stat
  line — it counts only the normal task.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** the header either counts both (with planned/free
  hours still excluding background time) or explicitly notes the background task, e.g. "1 task (+1
  background) · 1h planned · 15h free" — either way, a reader isn't left inferring a task is missing.
- **Suggested fix:** Extend the stat line's template string in `TemplateDayPlannerView.vue` to mention the
  background count when it's non-zero.

---

### U3. Split view's back button may have no accessible name (source read only, not reproduced in this pass)
- **Status:** fixed and verified (retest 2026-09-25, live) — on
  `/day-planner/templates/split?left=20001&right=20002`, the back control has accessible name "Back to
  templates".

### U2. Cross-template drag-and-drop task move (split view) still not exercised by an actual successful drag
- **Status:** fixed and verified live (2026-09-24, round 4) — `TemplatePlannerTaskBlock.vue:74-83` gained
  `pointer-events: auto` on `.split-drag-handle` since round 2, with an in-code comment explicitly citing
  this finding: `BaseTaskBlock`'s `.task-content` sets `pointer-events: none`, which was swallowing every
  press into the block's own same-grid reposition before it could reach the drag handle registered with
  `draggable()`. Verified against `/day-planner/templates/split?left=20001&right=20002`
  (fixture `e2e-v4`, reseeded via `POST /api/test/seed` beforehand): `playwright-cli drag` from the "Bug
  Fixing" task's drag handle to the right panel's time-grid group produced `PUT
  /api/template-planner-task/20102` with body `{"startTime":{"hours":9,"minutes":0},
  "endTime":{"hours":10,"minutes":30},...,"templateId":20002}` — same start/end time, `templateId` changed
  from the source (20001) to the target (20002), exactly what `moveTask()` is supposed to send. A follow-up
  snapshot confirmed "Bug Fixing" now renders only in the right panel's grid and is gone from the left.
  State was restored via a second `POST /api/test/seed` afterward, so the fixture is unaffected.
- **Severity:** ~~unverified~~ resolved
- **Where:** `TemplatePlannerTaskBlock.vue:74-83` (the actual fix) and `TemplateSplitView.vue:80-207`
  (`@atlaskit/pragmatic-drag-and-drop` wiring — `moveTask`, `setupDropTargets`, the `monitorForElements`
  handler — unchanged, the bug was never in this file)
- **History:** Round 1 didn't attempt a live drag at all ("too failure-prone to script reliably"). Round 2
  made three real attempts and all three failed to cross panels — plain `dragTo` registered as a click, and
  two manual pointer-event sequences (one from the task body, one from the drag handle itself) both landed
  as a same-panel reschedule instead, because the handle wasn't actually receiving the press
  (`pointer-events: none` inherited from the block). Round 3 (source-read only) found the `pointer-events:
  auto` fix already landed but didn't drive the browser to confirm it. Round 4 confirmed it live, using the
  same `playwright-cli drag` invocation that failed in round 2 — it now works because the fix changed what
  element receives the pointer events, not how the drag is driven.

---

### B6. The split view has no narrow layout: two 171 px panes clip their own controls, task titles and side panels (390 px)
- **Status:** fixed 2026-10-08 (X4 queue `F99`, the alert branch) — verified with `playwright-cli` at 390×844: the view says it
  needs a wider screen and links to both picks and back to the list. No page-level sideways scroll; at 1440×900 the split renders.
- **Severity:** bug
- **Where:** @390×844 · `/day-planner/templates/split?left=20001&right=20002` → `TemplateSplitView.vue` (two
  side-by-side columns at every width), each pane's `DayPlanner` card (`overflow: hidden`). The only entry
  point, "Edit Side by Side", is `v-if="mdAndUp"` (`TemplateListView.vue:43`), so a phone reaches this view
  only through a link or bookmark. B4 made both picks part of the URL, which makes that more likely.
- **Expected:** a view that loads at phone width either lays its panes out so their controls are reachable
  (stacked, or one pane at a time), or says it needs a wider screen. It shouldn't render controls the user
  can't reach (plain sense; WCAG 1.4.10 reflow).
- **Actual:** the panes stay side by side, each card 171 px wide (8–179 and 211–382). In each pane the
  slot-size toggle's **30M** button (178–228 in the left pane, 381–431 in the right) lies outside the card's
  `overflow: hidden` clip, so nothing can reach it. The Start field is cut at the pane edge. The task column is
  63 px wide, so a block reads "Morni" for "Morning Exercise" and the role chip and location are cut. Opening
  a pane's side panel squeezes it into the same 171 px: the X straddles the pane edge (157–193), and Bed Time
  and the Routine tab are cut. The planner-day findings this view also inherits (B9 card clip, A2 panel focus,
  U1 touch-action) are filed there, with this route in their **Where**.
- **Evidence:** `docs/views/planner-templates/screenshots/day-planner-templates-split--mobile.png`,
  `day-planner-templates-split--mobile-tasks.png`, `day-planner-templates-split--mobile-panel.png`. `eval`
  per pane: `card [8,208,179,880]`, `btns 30M:178,418,228,454`, `tasksCol [102,…,165,…]`. The page itself
  doesn't scroll sideways (`docScroll 390`, `.v-container` 390/390).
- **Repro:** 1. `resize 390 844`. 2. Open `/day-planner/templates/split?left=20001&right=20002`. 3. Look for
  the 30M slot button in either pane, and read the task titles. 4. Tap "Open panel" in the left pane.
- **Verify:** 1. `playwright-cli resize 390 844`, then `reload` on
  `/day-planner/templates/split?left=20001&right=20002`. 2. **Pass:** either the view shows one pane at a
  time, or stacks them, or shows a "needs a wider screen" message with a link back to the list. If panes
  render, every `.v-btn-group button` in each satisfies `right <= closest('.v-card').right`, and each
  `.tasks-column` is at least 200 px wide.
- **Root cause guess:** the view was built for desktop only (its entry button is `mdAndUp`), but the route
  isn't guarded and the layout has no breakpoint.
- **Suggested fix:** below `md`, stack the panes (each full width) or show a left/right `MyBtnToggle` that
  swaps which pane is visible. Cross-pane drag is unlikely to work on touch anyway (unverified, see planner-day U1).

### P4. The list toolbar doesn't wrap: "Add Template" is cut to "+ ADD" and the whole list pans 88 px sideways (390 px)
- **Status:** fixed 2026-10-08 (`F93`: both header rows wrap, and the sort select's `min-width` applies only at `smAndUp`. At 390 the
  toolbar sits under the title, Most Used at 12–153 and *Add Template* whole at 165–316, and the scroller is 390/390. At 1280 and 1440 the
  title and all four controls stay on one line)
- **Severity:** polish (the button stays tappable through its visible 62 px)
- **Where:** @390×844 · `/day-planner/templates` → `TemplateListView.vue:3-58` (header row
  `d-flex justify-space-between`, toolbar `d-flex align-center ga-3` with no wrap; the sort `VSelect` has
  `min-width: 170px`)
- **Expected:** the page header fits the viewport and the primary action is fully visible, without the
  content panning sideways (plain sense; WCAG 1.4.10 reflow).
- **Actual:** the title wraps to "Day / Templates" (8–146), the sort select takes 146–316, and "Add Template"
  spans 328–478, so only "+ ADD" shows. The content scroller (`main .v-container`, `overflow-x: auto`) is
  478/390 wide, so the whole list pans 88 px sideways under a horizontal swipe. The cards themselves fit (4–386).
  Compare and Edit Side by Side are hidden below `md` on purpose (`v-if="mdAndUp"`), so they don't add to it.
- **Evidence:** `docs/views/planner-templates/screenshots/day-planner-templates--mobile.png`. Overflow script:
  `div.d-flex.align-center.ga-3 → 478`. `elementFromPoint(360,123)` hits the button.
- **Repro:** 1. `resize 390 844`. 2. Open `/day-planner/templates`. 3. Look at the header row.
- **Verify:** 1. `playwright-cli resize 390 844`, then `reload` on `/day-planner/templates`. 2. **Pass:**
  `getByRole('button', { name: 'Add Template' })` has `right <= 390`, and `main .v-container` has
  `scrollWidth <= clientWidth`.
- **Suggested fix:** `flex-wrap` on the header row (title above, toolbar below), or an icon-only "Add" below
  `sm`.
