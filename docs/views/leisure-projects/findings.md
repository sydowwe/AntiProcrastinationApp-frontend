# leisure-projects — findings

> Pass: mutation · captured 2026-09-15 · commit `f457aa0c`

**Tally:** blocker 0 (1 fixed and verified live) · bug 0 (5 fixed and verified live) · a11y 0 (4 fixed and verified live) · polish 0 (3 fixed and verified live) · opportunity 0 (1 fixed and verified live) · unverified 0 (2 verified, both pass)

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-13 | `430e6f03` | initial inventory pass |
| 2 | 2026-09-15 | `f457aa0c` | mutation pass. Re-verified every round-1 finding: B1, B2, A1, A2, A3, P1 and O1 still reproduce as described; B3 (activity icon never rendering) is **fixed** — `ActivityInfo.fromJson` now falls back through `category`/`role` for `icon`/`color`. Added X1 (every write 404s — the headline finding of this pass), B4, B5, A4, P2, P3, U1, U2 from exercising create/edit/delete/status-change. |
| 3 | 2026-09-24 | code check only (no browser pass) | X1, B1, B2, B4, B5, A1, A2, A3, A4, P1, P2, P3, O1 confirmed fixed in code against the fix-queue commits; U1, U2 unchanged (unverified either way) |
| 4 | 2026-09-24 | live `playwright-cli` pass | U1, U2 exercised via route mocking; both pass as designed |
| 5 | 2026-09-25 | `d423edcc` | **retest round** — 12 retested live: X1, B1, B2, B4, B5, A1, A2, A3, P1, P2, P3, O1 all pass; none reopened, none blocked. Account: primaryUser. Mutations made and reverted: created a throwaway project ("Throwaway Retest Project", est. hours 8.5/8.75, activity id 12103) for B5/B4/X1, deleted last; added one to-do item via O1 to `/todo-list/13002` (Errands), deleted afterwards. The "Throwaway Retest Project" activity itself (id 12103) outlived its project profile (they are separate deletes); triage removed it from `/activity-settings/activities` afterwards (`DELETE /api/activity/12103` → 204), so no residue remains. No regressions seen outside the Verify blocks. |

---

### X1. Every write to an existing project profile — status change, edit, delete — 404s
- **Status:** fixed and verified (retest 2026-09-25, live) — status click on a throwaway project sent `PUT /api/activity-project-profile/17202` → 200 and the card moved column (count updated); edit dialog Save sent the same `PUT` → 200 and closed; Delete sent `DELETE /api/activity-project-profile/17202` → 204 and a reload confirmed the row gone.
- **Fix applied:** `ActivityProjectProfile` now has a real
  `id` field read from the response (`dto/response/ActivityProjectProfile.ts:12`, with a comment explaining
  the old alias bug); `ProjectReadinessBoard.vue`, `ProjectProfileForm.vue` and `ProjectTable.vue` now call
  `update`/`deleteEntity` with `item.id`/`entityToEdit.id` instead of `activityId`.
- **Severity:** blocker
- **Where:** `src/core/leisure/component/project/ProjectReadinessBoard.vue:242` (`update(item.activityId, ...)`),
  `:231` (`deleteEntity(item.activityId)`); `src/core/leisure/component/project/ProjectProfileForm.vue:35`
  (`update(entityToEdit.activityId, ...)`); `src/core/leisure/component/project/ProjectTable.vue:108`
  (`deleteEntity(item.activityId)`). Root cause: `src/core/leisure/dto/response/ActivityProjectProfile.ts:20-22`
  (`get id() { return this.activityId }`) never reads the server's own distinct `id` field at all —
  `fromJson` doesn't destructure it, so it's silently dropped.
- **Expected:** Changing a project's readiness status with one click (the entire point of
  `prompts/_done/leisure/P1-readiness-board.md`), saving an edit, or deleting a project should persist.
  Plain user sense, and the same expectation the sibling `leisure-backlog-picker` unit's X1 finding
  documents for the backlog table — this is the identical defect class in a second leisure table.
- **Actual:** Every PUT/DELETE to `/api/activity-project-profile/{activityId}` returns 404. Confirmed
  directly: the seeded row is `activityId:12009` / `id:17201` (from the `grid` response); a row created in
  this pass came back as `activityId:12008` / `id:17202`. `PUT /api/activity-project-profile/12009` → 404,
  `DELETE /api/activity-project-profile/12009` → 404. Manually issuing `DELETE
  /api/activity-project-profile/17202` (the row's own id, via `fetch()` in the page context) → **204** —
  confirming the server is keyed by its own id, not `activityId`, and every write call site in this
  component tree uses the wrong one. This affects both board and table surfaces identically, since both
  call the same `activityProjectProfileApi.ts` functions.
- **Evidence:** `screenshots/leisure-projects--board-status-change-404-silent.png`,
  `screenshots/leisure-projects--mutation-edit-404-silent.png`,
  `screenshots/leisure-projects--mutation-delete-404-silent.png`. Network: `PUT
  /api/activity-project-profile/12009` → 404 (×2, one from a status-button click, one from Save), `DELETE
  /api/activity-project-profile/12009` → 404; manual `DELETE /api/activity-project-profile/17202` → 204.
- **Repro:** 1. Go to `/leisure/projects` (board view). 2. Click any other status button on the "Build a
  Bookshelf" card (e.g. "Ready to start"). The card does not move, no snackbar appears. 3. Click the card
  to edit it, change nothing, click Save — dialog stays open, no error shown. 4. Click Delete, confirm —
  row remains.
- **Verify:** 1. Click a status button on a card. **Pass condition:** the card moves to the new column and
  the column counts update. 2. Edit a project and Save. **Pass condition:** the dialog closes and the
  change is visible. 3. Delete a project and confirm. **Pass condition:** the row disappears and a reload
  does not bring it back.
- **Root cause guess:** Same shape as the backlog unit's X1 — `ActivityProjectProfile.id` should return a
  real `id` field threaded through the constructor from the server response, not `activityId`, and the four
  call sites above should use it instead of `item.activityId`/`entityToEdit.activityId`. Likely worth fixing
  once across all four leisure profile DTOs (`ActivityBacklogProfile` has the identical pattern; bucket-list
  and memory-anchor were not re-checked in this pass but should be, given two-for-two so far) rather than
  patching this table in isolation.
- **Suggested fix:** Add a real `id` field to `ActivityProjectProfile`'s constructor and `fromJson`, return
  it from the `id` getter, and change the four call sites to pass `item.id`/`entityToEdit.id`. Keep
  `activityId` for anything that's genuinely about the activity relationship.

---

### B1. Board/Table view mode does not reliably survive a reload, contradicting the requirement it was built for
- **Status:** fixed and verified (retest 2026-09-25, live) — from a query-string-free load of `/leisure/projects`, clicking "Table" put `view=table` in the URL immediately (`eval location.href` checked right after the click), and a reload kept Table (button showed `[pressed]`, table rendered).
- **Fix applied:** `ProjectsView.vue` now re-checks and
  re-writes `view` after every settled navigation (`watch([viewMode, () => route.fullPath], writeViewToUrl)`)
  instead of racing a single `router.replace` against `useTableUrlState`'s own writer, with a comment (F1)
  explaining the old race.
- **Severity:** bug
- **Where:** `src/core/leisure/view/ProjectsView.vue:146` (`watch(viewMode, ...)`) racing
  `src/_common/composable/table/useTableUrlState.ts:106-136` (`syncToUrl`), triggered by
  `src/_common/component/dataTable/BasicTable.vue:191-202` (default-sort-on-mount watcher)
- **Expected:** The view-mode toggle writes `view` to the URL and survives a reload. This is not a
  guess — it is the explicit deliverable of the prompt that built this toggle
  (`prompts/_done/leisure/P1-readiness-board.md`, point 1: *"toggled against the existing
  table with the mode in a URL query param (CLAUDE.md requires bookmarkable view state)"*), and
  CLAUDE.md's own URL-state rule ("Store filterable/bookmarkable state ... in URL query params").
- **Actual:** From a fresh, query-string-free load of `/leisure/projects`, clicking "Table" leaves the
  URL as `?page=1&perPage=25&sortBy=activity.name:asc` — no `view` key at all. Reloading falls back to
  Board, silently discarding the user's explicit choice. The failure is a race, not a permanent bug:
  once the table has already been mounted once in the page's lifetime (so this side effect has already
  fired), the same click *does* write `view=table` correctly. So the bug reproduces reliably only from a
  clean state, and not on subsequent toggles in the same page load.
- **Evidence:** Round 1: two navigations recorded via `playwright-cli` (fresh load → click "Table" → no
  `view` key; reload → falls back to board). Round 2 (this pass): reproduced twice more from a fresh
  `goto /leisure/projects` — `eval location.href` immediately after the first-ever "Table" click showed no
  `view` param both times; a subsequent Board→Table→Board→Table sequence in the same page load then wrote
  `view=` correctly on every click.
- **Repro:**
  1. Sign in, navigate to `https://localhost:3000/leisure/projects` with no query string.
  2. Click the "Table" toggle button.
  3. Read the URL — `view=table` is missing.
  4. Reload the page.
  5. The view falls back to Board.
- **Verify:**
  1. Navigate to `/leisure/projects` with no query string.
  2. Click "Table".
  3. **Pass condition:** the URL contains `view=table` immediately after the click (not just after some
     later interaction).
  4. Reload.
  5. **Pass condition:** the view is still Table.
- **Root cause guess:** `ProjectsView.vue`'s own `watch(viewMode, ...)` and `useTableUrlState`'s
  `syncToUrl` (invoked here because switching to Table mounts `BasicTable` for the first time, whose
  `watch(() => columnsProp, ...)` pushes a default sort item into the shared `sortBy` ref) both call
  `router.replace({ query: {...route.query, ...} })` independently and asynchronously. Whichever reads
  `route.query` last wins, and since Vue Router's reactive `route.query` only updates after a navigation
  *resolves*, the second call can read a `route.query` snapshot from before the first call's `view` key
  landed, silently overwriting it away.
- **Suggested fix:** Route the view-mode write through the same `syncToUrl`/query-merge path
  `useTableUrlState` uses (so there is one writer, not two), or have `ProjectsView.vue` write `view` via
  a functional query updater (`router.replace(to => ({ query: { ...to.query, view } }))`) if vue-router's
  API supports reading the *latest* pending query rather than a stale snapshot.

---

### B2. Every board-mode filter change fires two competing grid requests, breaking the "one fetch per filter change" guarantee
- **Status:** fixed and verified (retest 2026-09-25, live) — applied a fresh `projectArea=Woodworking` filter from board mode; exactly one `POST /api/activity-project-profile/grid` fired (request #1455), body `itemsPerPage:200` with the filter, → 200. No second/aborted request.
- **Fix applied:** `ProjectsView.vue` now shares one
  `useServerTable`/`fetchFilteredTable` between board and table instead of the board driving a second,
  competing fetch (F2). Comment in the file documents the old race and the resolved-with-the-other-call's-
  result risk this closes.
- **Severity:** bug
- **Where:** `src/core/leisure/view/ProjectsView.vue:129-153` (`loadBoard()` and its
  `watch([viewMode, filter], ...)`) vs. `src/_common/composable/table/useServerTable.ts:107-116` (its
  own unconditional `watch(filter, ...)`), both driving the one shared
  `fetchFilteredTable` returned by `useActivityProjectProfileCrud()`
- **Expected:** L1's explicit acceptance test: *"changing a filter must still fire exactly one
  request ... the single-fetch guarantee is the whole reason the composable exists"*
  (`prompts/_done/leisure/L1-server-table-adoption.md`).
- **Actual:** Applying a filter while Board is the active view mode fires **two** `POST
  /api/activity-project-profile/grid` calls in the same tick — one with `itemsPerPage:200` (from
  `loadBoard()`, the request that actually feeds the visible board) and one with `itemsPerPage:25`
  (from `useServerTable`'s own filter watcher, which keeps running even though `ProjectTable` isn't
  mounted and nothing reads its `items`/`itemsLength` while in board mode). Both calls go through the
  same `useFetchFilteredTable` instance, which keeps one `AbortController` — the second call aborts the
  first.
- **Evidence:** Round 1: `playwright-cli requests` after applying `readinessStatuses=needsShopping` from
  the board showed the same two-POST pattern. Round 2 (this pass): re-applied a fresh filter
  (`projectArea=Woodworking`) from board mode and confirmed again — request bodies:
  `{"itemsPerPage":200,...,"filter":{...,"projectArea":"Woodworking",...}}` → `net::ERR_ABORTED`;
  `{"itemsPerPage":25,...,"filter":{...,"projectArea":"Woodworking",...}}` → 200.
- **Repro:**
  1. Navigate to `/leisure/projects` (board mode, default).
  2. Open the Filter panel, set any filter field, Confirm.
  3. Inspect network requests — two `POST /api/activity-project-profile/grid` calls fire for the one
     filter change, with different `itemsPerPage` values; one is `net::ERR_ABORTED`.
- **Verify:**
  1. Navigate to `/leisure/projects` (board mode).
  2. Apply any filter change.
  3. **Pass condition:** exactly one `POST /api/activity-project-profile/grid` request fires, and it
     carries the board's own `itemsPerPage` (200), not the table's.
- **Root cause guess:** `useServerTable`'s internal `watch(filter, ...)` (`useServerTable.ts:107-116`)
  has no way to know the table it serves isn't currently mounted, so it fires unconditionally whenever
  the shared `filter` ref changes — including while `ProjectsView.vue` is in board mode and driving the
  same filter through its own, separate `loadBoard()` call. Both calls share one
  `useFetchFilteredTable()` instance (one `AbortController`, one `latest` promise), so they race.
- **Suggested fix:** give the board its own `fetchFilteredTable` instance (call
  `useActivityProjectProfileCrud()` — or just `useFetchFilteredTable` — a second time for `loadBoard`),
  so the two fetches no longer share a cancellation controller. Note `useFetchFilteredTable`'s
  cancellation fallback (`catch(e) { if (isCancel && latest !== promise) return latest }`) means the
  aborted call does not throw — it silently resolves with the *other* call's result instead. That is a
  correctness risk beyond the wasted round trip: with more than 25 matching projects (not reproducible
  with this seed's single row), a board-mode filter change could resolve with the table's 25-row page
  rather than the board's intended 200-row page, silently under-rendering the board. This consequence is
  inferred from the code path, not directly observed in either pass — flagged here rather than filed as
  its own finding, since it shares this one root cause.

---

### B3. The activity icon/colour this module was built to render never appears — the API nests it, the DTO reads it flat
- **Status:** fixed — **verified 2026-09-15**
- **Severity:** bug
- **Where:** `src/core/leisure/dto/response/ActivityInfo.ts:26-43` (`fromJson`)
- **Fix applied:** `ActivityInfo.fromJson` now reads the flat fields first and falls back to
  `category?.icon ?? role?.icon` (and the same chain for `color`/`categoryName`), with a code comment
  explaining the two wire shapes (`/leisure/pick`'s flat `ActivityInfoResponse` vs. the four profile
  grids' nested `ActivityResponse`). This directly addresses the gap round 1 found.
- **Verified:** `screenshots/leisure-projects--board-default.png` (this pass) shows an icon rendering next
  to "Build a Bookshelf" on the board card, sourced from `activity.role.icon` in the live `grid` response
  (`"role":{...,"color":"violet","icon":"fas fa-guitar",...}`, no flat `activity.icon`/`activity.color` —
  the same nested-only shape round 1 observed, now correctly handled by the fallback).
- **Originally reported (round 1, 2026-09-13):** No icon rendered next to "Build a Bookshelf" on either the
  board card or the table row, even though the seeded activity has a role with `icon: "fas fa-guitar"`,
  `color: "violet"` — `ActivityInfo.fromJson` only read the flat fields, which the profile-grid endpoints
  never send, so both always resolved to `null` and `ActivityNameCell`'s `v-if="activity.icon"` never
  fired.

---

### B4. Editing a project with a fractional `estimatedHours` silently rounds it — and the rounded value is what gets saved
- **Status:** fixed and verified (retest 2026-09-25, live) — on a throwaway project created with `estimatedHours: 8.5`: edit dialog showed "8.5" and an unmodified Save sent `"estimatedHours":8.5` in the `PUT` body; then entering `8.75` and saving sent `"estimatedHours":8.75` (not truncated).
- **Fix applied:** `NewProjectProfileForm.vue`'s
  `VNumberInput` now sets `:precision="null"`.
- **Severity:** bug
- **Where:** `src/core/leisure/component/project/NewProjectProfileForm.vue:34-39` (`VNumberInput` with
  `:step="0.5"` but no `:precision`), root cause `node_modules/vuetify/lib/components/VNumberInput/VNumberInput.js:40-42`
  (`precision` prop defaults to `0`, not `null`)
- **Expected:** Opening the edit dialog for a project with `estimatedHours: 8.5` should show "8.5", and
  saving without touching that field should not change it.
- **Actual:** The "Est. hours" field displays "9" for a stored value of `8.5` (confirmed via
  `el.value` on the raw `<input>`, not just the rendered text). This is not just a display artifact:
  clicking Save with no other changes sends `"estimatedHours":9` in the request body — the display rounding
  corrupts the actual submitted value. This is currently masked by X1 (the PUT 404s before it can persist),
  but it will silently corrupt every project's `estimatedHours` the moment X1 is fixed, since simply opening
  and saving an edit dialog is enough to trigger it — no user action on the field required.
- **Evidence:** Edit dialog screenshot `screenshots/leisure-projects--mutation-edit-dialog.png` (shows "9"
  for the seeded row's `8.5`); request body of the `PUT /api/activity-project-profile/12009` from an
  untouched Save: `{"activityId":12009,...,"estimatedHours":9,...}` against a `grid` response of
  `"estimatedHours":8.50` for the same row.
- **Repro:** 1. Go to `/leisure/projects`. 2. Click the "Build a Bookshelf" card (Est. hours: 8.5). 3.
  Observe the "Est. hours" field reads "9". 4. Click Save without changing anything. 5. Inspect the request
  body — `estimatedHours` is `9`, not `8.5`.
- **Verify:** 1. Same repro. 2. **Pass condition:** the Est. hours field displays "8.5" on open, and an
  unmodified Save sends `estimatedHours: 8.5`. 3. Confirm a value with more than one decimal digit (e.g.
  entered as 8.75) is not silently truncated either, once a `:precision` is chosen.
- **Root cause guess:** `VNumberInput`'s `precision` prop defaults to `0` (whole numbers), independent of
  `step`. The form sets `:step="0.5"` (correct for the increment buttons) but never sets `:precision`, so
  Vuetify formats and coerces the displayed/submitted value to zero decimal places.
- **Suggested fix:** Add `:precision="1"` (or whatever the backend's actual constraint is — not verified in
  this pass) to the `Est. hours` `VNumberInput` in `NewProjectProfileForm.vue`.

---

### B5. Create-dialog's Activity field shows a literal "0" and it leaks into typed search text
- **Status:** fixed and verified (retest 2026-09-25, live) — fresh create dialog: Activity field was empty (no "0"); typing "Throwaway Retest Project" without touching Clear left the field containing exactly that text (`input.value` checked), and "Create activity "Throwaway Retest Project"" was offered as expected.
- **Fix applied:** `ActivityProjectProfileRequest.activityId`
  now defaults to `null` (widened to `number | null`), with a doc comment pointing at the sibling backlog
  fix (F63).
- **Severity:** bug
- **Where:** `src/core/leisure/component/ActivityAutocompleteWithCreate.vue` (shared component, `v-model`
  bound to `model.activityId`), root cause `src/core/leisure/dto/request/ActivityProjectProfileRequest.ts:7`
  (`activityId: number = 0`)
- **Expected:** An unselected required activity field should show its label as a placeholder, not a value —
  the same expectation already filed against the backlog unit's identical component/pattern (B2 there).
- **Actual:** `ActivityProjectProfileRequest`'s `activityId` defaults to `0`, and since no lookup item has
  id `0`, the autocomplete renders the literal text "0" on a fresh create dialog. Typing a search term
  without first clearing the field prepends to the leaked "0": typing "Learn Bouldering" produced the
  literal string "0Learn Bouldering" in the field, which does not match the existing "Learn Bouldering"
  activity (so the only option offered was "Create activity "0Learn Bouldering"", not the real activity).
  Clearing the field first (via the field's own Clear button) and retyping resolves correctly.
- **Evidence:** `screenshots/leisure-projects--mutation-create-dialog.png` (Activity field shows "0").
  Accessibility snapshot after typing without clearing: `combobox "Activity" [expanded] [active]: 0Learn
  Bouldering`, with the only dropdown option `Create activity "0Learn Bouldering"`; after clearing first,
  the same search correctly resolved to `option "Learn Bouldering"`.
- **Repro:** 1. Go to `/leisure/projects`, click Add. 2. Observe the Activity field reads "0". 3. Without
  clicking Clear, type an existing activity's name (e.g. "Learn Bouldering"). 4. Observe the field now
  reads "0Learn Bouldering" and no existing activity matches.
- **Verify:** 1. Open the create dialog fresh. 2. **Pass condition:** Activity shows its label as a
  placeholder with no value text. 3. Type an existing activity's name without touching Clear. **Pass
  condition:** the field contains only what was typed, and the matching existing activity appears as an
  option.
- **Root cause guess:** Same as the backlog unit's B2 — `activityId` (and likely other FK-shaped fields with
  no sensible zero value) should default to `null`, not `0`, matching how `effortType` is already correctly
  defaulted to `null` elsewhere in the module.
- **Suggested fix:** Change `ActivityProjectProfileRequest.activityId`'s default to `null` and widen its
  type to `number | null` (mirroring the backlog unit's suggested fix), since `ActivityAutocompleteWithCreate`
  already types its `model` as `number | null`.

---

### A1. Filter panel's close (×) button has no accessible name — [framework]
- **Status:** fixed and verified (retest 2026-09-25, live) — opened the Filter panel on `/leisure/projects`; the close button's accessible name is "Close" (both the accessibility snapshot and `getAttribute('aria-label')` on the button returned `"Close"`).
- **Fix applied:** `FilterPanel.vue`'s close `VIconBtn`
  now has both `:title` and `:aria-label` bound to `general.close`.
- **Severity:** a11y — **[framework]**
- **Where:** `src/_common/component/FilterPanel.vue:49-54` (`VIconBtn icon="close"`, no `title`/
  `aria-label`)
- **Expected:** Every icon-only control needs an accessible name (CLAUDE.md/PROMPT-TEMPLATE checklist;
  same rule the shell pass applied to the sidebar hamburger, A2 in `docs/views/_shell/inventory.md`).
- **Actual:** `document.activeElement`-style inspection of the button (`playwright-cli eval`) returned
  `{"text":"","ariaLabel":null,"title":null}` (round 2; round 1 recorded `"title":""`, same absence).
- **Evidence:** `playwright-cli eval` result quoted above, against the panel opened from
  `/leisure/projects`, reproduced in both passes.
- **Repro:** 1. Open the Filter panel. 2. Inspect the × button in its header. 3. No accessible name.
- **Verify:** 1. Open the Filter panel on any view using it. 2. **Pass condition:** the close button
  exposes a localized accessible name (e.g. `general.close`).
- **Root cause guess:** Same class of gap as the shell pass's A2 (sidebar hamburger) — a framework
  `VIconBtn` shipped without a label. Since `FilterPanel` is shared by all four leisure tables (and any
  other module using it), this is one fix in `_common`, not a per-view one.
- **Suggested fix:** Add a localized `aria-label` (e.g. `$t('general.close')`) to the `VIconBtn` in
  `FilterPanel.vue:49`.

---

### A2. Table's "Messy" column renders a bare icon with no accessible text
- **Status:** fixed and verified (retest 2026-09-25, live) — switched to Table view; the Messy cell for "Build a Bookshelf" now exposes accessible text ("Messy") in the accessibility snapshot instead of an empty cell.
- **Fix applied:** `ProjectTable.vue`'s Messy cell now
  keeps the icon decorative (no click handler, so `aria-hidden` per the app's documented convention, F4)
  with a `d-sr-only` sibling span carrying `leisure.a11y.messy`/`notMessy`.
- **Severity:** a11y
- **Where:** `src/core/leisure/component/project/ProjectTable.vue:25-31`
  (`<template #item.isMessy>` → `<VIcon :color :icon size="16" />`, no label)
- **Expected:** A status conveyed only by icon needs a text alternative, per the same rule as A1.
- **Actual:** The cell for "Build a Bookshelf" (which has `isMessy: true`) renders only a check-mark
  `VIcon`; the accessibility snapshot shows an empty cell (`cell [ref=...]` with no text/name), confirmed
  again in this pass's own table-view snapshot.
- **Evidence:** Table-mode snapshot (both passes), Messy column cell for the one seeded row has no
  accessible text, confirmed against the source only rendering a bare `VIcon`.
- **Repro:** 1. Switch to Table view on `/leisure/projects`. 2. Inspect the "Messy" column for a row
  where `isMessy` is true.
- **Verify:** 1. Switch to Table view. 2. **Pass condition:** the Messy cell exposes a text alternative
  (visible text, or an `aria-label` on the icon) in addition to or instead of the bare icon.
- **Suggested fix:** Add `:aria-label="item.isMessy ? t('general.yes') : t('general.no')"` (or similar)
  to the `VIcon`, matching whatever convention the app uses elsewhere for boolean icon columns.

---

### A3. Non-active readiness-status buttons on the board have very low contrast
- **Status:** fixed and verified (retest 2026-09-25, live, screenshot) — screenshot `screenshots/retest-2026-09-25-A3.png` shows both inactive icons on the "Build a Bookshelf" card (outlined grey circles with a solid dark icon) clearly visible against the card background, next to the active orange "Needs shopping" button.
- **Fix applied:** inactive buttons in
  `ProjectReadinessBoard.vue` are now `outlined` `neutral-600` instead of tonal `grey-lighten-2` (F5), with
  a comment recording the contrast measurements (3:1 on both themes) that drove the choice.
- **Severity:** a11y
- **Where:** `src/core/leisure/component/project/ProjectReadinessBoard.vue:130-146` (status button row,
  `:color="s === item.readinessStatus ? STATUS_META[s].color : 'grey-lighten-2'"`, `variant="tonal"`)
- **Expected:** An interactive control's icon should be visually distinguishable from its background at
  normal viewing distance — plain user sense, and the same expectation the a11y checks above rely on.
- **Actual:** The two non-active status buttons on a card (e.g. "Ready to start" and "Planning" on a
  card currently "Needs shopping") render as near-invisible pale circles — visually confirmed again in
  this pass's `screenshots/leisure-projects--board-default.png` (the two faint circles left and right of
  the orange "Needs shopping" button).
- **Evidence:** `screenshots/leisure-projects--board-default.png`; round 1's computed-style dump:
  `class="... text-grey-lighten-2 ... v-btn--variant-tonal"`, `background-color: rgba(0, 0, 0, 0)`.
- **Repro:** 1. Navigate to `/leisure/projects` (board mode). 2. Look at the status-button row on the
  "Build a Bookshelf" card.
- **Verify:** 1. Navigate to `/leisure/projects`. 2. **Pass condition:** the two non-active status icons
  are clearly visible against the card background (not just the active one).
- **Suggested fix:** Use a darker/more saturated inactive color (e.g. a `secondaryOutline`-family shade
  already used elsewhere in this module) instead of `grey-lighten-2`, or give the `tonal` variant an
  actual background tint so the icon has contrast to sit on.

---

### A4. The board card's primary click target — open the edit dialog — has no keyboard path
- **Status:** fixed and verified (2026-09-22, `F78` — the card is `button "Edit <name>"` with `tabindex="0"`,
  a `:focus-visible` ring, and `@keydown.enter.space.self.prevent` → `onEdit`. Verified live on
  `/leisure/projects?view=board`: Enter on the focused card opens the edit dialog; Enter on the nested
  *Delete* opens only the delete confirmation, not the edit dialog — `.self` keeps the nested status/Delete
  buttons independent)
- **Severity:** a11y
- **Where:** `src/core/leisure/component/project/ProjectReadinessBoard.vue:64-71` (`<VCard ... @click="onEdit(item)">`)
- **Expected:** An element that is the primary way to open an edit dialog should be reachable and
  activatable by keyboard — the same standard already applied to the sibling backlog unit's `ExperiencedCell`
  finding (A1 there).
- **Actual:** `getAttribute('role')` and `getAttribute('tabindex')` on the card's DOM node both return
  `null` — it renders as a plain `<div>` with a click handler and `cursor: pointer` styling only. It cannot
  be reached by Tab and has no accessible role announcing it as interactive. (The status buttons and the
  Delete button on the same card *are* real, named `<button>`s and remain keyboard-reachable — this finding
  is specifically about the card body / edit gesture.)
- **Evidence:** `page.evaluate` on the card element: `{"tag":"DIV","tabindex":null,"role":null}`.
- **Repro:** 1. Go to `/leisure/projects` (board view). 2. Tab through the page. 3. Observe focus never
  lands on the card body itself, only on its status/delete buttons.
- **Verify:** 1. Same setup. 2. **Pass condition:** the card is reachable via Tab, exposes an accessible
  role (e.g. `button`), and Enter/Space on it opens the edit dialog exactly as a mouse click does.
- **Suggested fix:** Add `role="button"` and `tabindex="0"` (plus a `@keydown.enter`/`@keydown.space`
  handler, or use a Vuetify prop that already wires this) to the card, taking care that the status buttons
  and Delete button nested inside it remain independently focusable and don't trigger the card's own
  handler when activated (they already `@click.stop`, so only the keyboard-activation path needs adding).

---

### P1. `FilterPanel` logs a recurring Vue warning about an attribute it can never use
- **Status:** fixed and verified (retest 2026-09-25, live) — navigated to `/leisure/projects` and opened the Filter panel; `playwright-cli console info` showed 0 messages (total console messages: 2, none naming `FilterPanel`).
- **Fix applied:** `ProjectsView.vue`'s `<FilterPanel>`
  call no longer passes a `class` prop, so this warning no longer fires from this view. (Framework-level
  root cause — `FilterPanel`'s multi-root template — not independently re-checked, but not observable from
  this view either way now.)
- **Severity:** polish
- **Where:** `src/_common/component/FilterPanel.vue` (multi-root template: a `<div>` root plus a sibling
  `<Teleport>`, so Vue cannot auto-inherit attrs); called with `class="flex-1-1"` at
  `src/core/leisure/view/ProjectsView.vue:27`
- **Expected:** No console warnings naming app code on a normal page load/interaction.
- **Actual:** Every render/interaction on `/leisure/projects` logs (repeatedly): `"Extraneous non-props
  attributes (class) were passed to component but could not be automatically inherited because
  component renders fragment or text or teleport root nodes. at <FilterPanel> at <ProjectsView>"`.
  Harmless in this instance — `FilterPanel`'s own root `<div>` already declares `flex-fill` internally,
  so the externally-passed `class="flex-1-1"` was never doing anything — but it is dead code producing
  console noise on every view that passes `class` to `FilterPanel` (likely all four leisure tables, not
  just this one). Reproduced again in this pass's console log.
- **Evidence:** `playwright-cli console` on `/leisure/projects`, multiple identical `[INFO]` entries
  naming `<FilterPanel>`/`<ProjectsView>` in both passes.
- **Repro:** 1. Navigate to `/leisure/projects`. 2. Open the console. 3. See the warning.
- **Verify:** 1. Navigate to `/leisure/projects`. 2. **Pass condition:** no "Extraneous non-props
  attributes" warning naming `FilterPanel` in the console.
- **Root cause guess:** Same shape as A1 — a `_common` component issue (multi-root template breaks attr
  inheritance) surfacing at an app call site. Worth batching with A1 since both are `FilterPanel`
  cleanup, but this one is a dead prop, not a missing label.
- **Suggested fix:** Drop `class="flex-1-1"` from the `<FilterPanel>` call sites that don't need it
  (framework already applies `flex-fill` internally), or fix `FilterPanel.vue` to have a single root
  element so attrs inherit normally.

---

### P2. Card metadata line is missing a space before the second "·" separator
- **Status:** fixed and verified (retest 2026-09-25, live) — board card and screenshot (`retest-2026-09-25-A3.png`) show "Intermediate · Woodworking · 8.5h" with a space on both sides of both separators; a freshly created throwaway project also read "Beginner · Retest Area · 8.5h" correctly spaced.
- **Fix applied:** `ProjectReadinessBoard.vue`'s
  `metaLine()` now builds an array of present parts and joins with `' · '` once, instead of two independent
  conditional templates each supplying their own separator.
- **Severity:** polish
- **Where:** `src/core/leisure/component/project/ProjectReadinessBoard.vue:86-98` — two adjacent
  `<template v-if>` blocks each starting with a literal `· ` (space after, none before)
- **Expected:** Consistent spacing around both separators, e.g. "Intermediate · Woodworking · 8.5h".
- **Actual:** Renders "Intermediate · Woodworking· 8.5h" — a space before/after the first "·" but none
  before the second, because the two `<template>` blocks are adjacent in the source with no whitespace
  between them and each only leads with `· ` (space after, not before).
- **Evidence:** `screenshots/leisure-projects--board-default.png` and every later board screenshot in this
  pass show the same "Woodworking· 8.5h" run-together text; reproduced again on a freshly created project
  ("Beginner · Climbing gear· 1h").
- **Repro:** 1. Go to `/leisure/projects` (board view) with a project that has both a Project area and
  Estimated hours set. 2. Read the metadata line under the project name.
- **Verify:** 1. Same setup. 2. **Pass condition:** both "·" separators have a space on both sides.
- **Suggested fix:** Change the second template to lead with `" · "` and ensure a single space is emitted
  regardless of which optional fields are present (e.g. build the line as an array of present parts joined
  with `' · '` instead of two independent conditional templates).

---

### P3. Filtering to zero results shows the same "you have no projects at all" empty state and Add button as a genuinely empty list
- **Status:** fixed and verified (retest 2026-09-25, live) — filtered board to `isMessy=false` (excludes the one seeded messy row); rendered "Nothing matches these filters." with a "Clear filters" button, distinct from the true-empty copy. Filter cleared afterwards.
- **Fix applied:** both `ProjectTable.vue` and
  `ProjectReadinessBoard.vue` now route through `LeisureEmptyState` with a `:filtered` prop and an
  `@onClearFilters` handler (F79), distinguishing "nothing matches" from "you have none."
- **Severity:** polish
- **Where:** `src/core/leisure/component/project/ProjectTable.vue:33-51` (`#noData` slot) and
  `src/core/leisure/component/project/ProjectReadinessBoard.vue:7-24` (`isEmpty` branch) — both keyed only
  on `items.length === 0`, with no distinction for "filtered to zero"
- **Expected:** A filtered-to-zero result should read differently from a genuinely empty list — plain user
  sense, since the copy ("These are things you're building or making. You don't have any projects here
  yet.") plus a prominent Add button reads as "you have never created one," which is misleading when the
  user's own filter is why nothing is showing, and could nudge them to create a duplicate rather than clear
  the filter.
- **Actual:** Filtering `Messy: false` against the one seeded (messy) project produces the identical
  zero-projects empty state and Add button as the true empty state would, on both the table and the board.
- **Evidence:** `screenshots/leisure-projects--table-filtered-empty.png` — filter chips "Activity: Bookshelf"
  and "Messy: ✗" visible in the toolbar alongside the "you don't have any projects here yet" copy.
- **Repro:** 1. Go to `/leisure/projects`. 2. Filter by `Messy: false` (or any filter that excludes the
  seeded row). 3. Observe the empty state copy and Add button, identical to what an account with zero
  projects would see.
- **Verify:** 1. Same repro. 2. **Pass condition:** the empty state distinguishes "no results for this
  filter" (e.g. suggesting clearing the filter) from "you have no projects yet."
- **Root cause guess:** Same single `#noData`/`isEmpty` branch is used for both cases; likely shared by the
  other three leisure tables too (not re-verified here, out of scope for a single-view unit) since all four
  came out of the same `L4-onboarding-empty-states.md` pass.
- **Suggested fix:** Check `filter.value?.hasAny()` (already implemented on every leisure filter DTO) in
  addition to `items.length === 0`, and show a "no projects match your filters" message with a "clear
  filters" action instead of the Add CTA when a filter is active.

---

### O1. `activity.isOnTodoList` rides on every response unread — and P1's own shopping-list-to-todo handoff was never built or declined in writing
- **Status:** fixed and verified (retest 2026-09-25, live) — drove the flow on "Build a Bookshelf" (`NeedsShopping`): clicked "Add to to-do list: Build a Bookshelf", picked list "Errands" and priority "This week", confirmed → `POST /api/todo-list-item` → 201, item id `14103`. Item appeared on `/todo-list/13002` as "Build a Bookshelf · Shopping for Build a Bookshelf" with steps. Deleted the item afterwards (`DELETE /api/todo-list-item/14103` → 204, "Undo: Delete" snackbar shown and the row gone from the list).
- **Fix applied (2026-09-24, `cfa6434d`):** `ProjectReadinessBoard.vue` now has an "Add to to-do list" button
  on `NeedsShopping` cards with unmet materials/tools, opening `ShoppingToTodoDialog.vue`, which writes
  through `core/todoList`'s own api/dto per the cross-module rule.
- **Severity:** opportunity
- **Where:** `src/core/leisure/dto/response/ActivityInfo.ts` (does not read `isOnTodoList`); board/table
  components (no todo-list affordance anywhere in this module)
- **Expected:** P1's prompt explicitly asked this unit's author to evaluate a shopping-list-to-todo
  handoff for `NeedsShopping` projects and, if not built, "note why rather than half-building it"
  (`prompts/_done/leisure/P1-readiness-board.md`, point 4). `migration-revision.md` is where such notes
  go per CLAUDE.md's convention.
- **Actual:** No handoff exists in `src/core/leisure/` or `src/core/todoList/`, and
  `migration-revision.md` has no entry about it. Meanwhile every `/api/activity-project-profile/grid`
  response row carries `activity.isOnTodoList` (confirmed again in this pass's own grid responses,
  `"isOnTodoList":false`) — a field that looks purpose-built for exactly this feature (so a project's
  materials aren't offered as a to-do a second time if they already are one) — and nothing in `src/`
  reads it.
- **Evidence:** Round 1: response body of request #1415 includes `"isOnTodoList":false`;
  `ActivityInfo.fromJson`/`ActivityInfo` class (no `isOnTodoList` field); grep for `isOnTodoList` across
  `src/` returns no matches; grep of `migration-revision.md` for the relevant terms returns no matches.
  Round 2: same field present and unused in this pass's `grid` responses; grep for `todoList` under
  `src/core/leisure/` returns only an unrelated comment in `useLeisureCommitment.ts`, confirming no
  hand-off was built.
- **What exists / what it could feed:** `materialsNeeded: string[]` per `NeedsShopping` project (already
  rendered on the board card) plus the backend's own `isOnTodoList` flag on the activity is enough raw
  material to build the handoff P1 asked for — surface an "Add to to-do list" affordance on
  `NeedsShopping` cards, guarded by `isOnTodoList` so it doesn't offer twice, writing through
  `core/todoList`'s `api/`/`dto/` only, per CLAUDE.md's cross-module rule (same constraint P1 named
  explicitly).

---

### U1. Genuinely-empty board/table state not reached with current seed
- **Status:** verified, passes (2026-09-24, `playwright-cli`) — mocked `POST **/activity-project-profile/grid`
  to return `{"items":[],"itemsCount":0}` and loaded `/leisure/projects` signed in as the primary seed user.
  Both the board (`isEmpty` branch) and the table (`#noData` slot) render "These are things you're building
  or making. You don't have any projects here yet." with an inline "Add" button, as designed.
- **Severity:** unverified
- **What would verify it:** The seed always carries at least one project profile
  (`profiles.project: 17201`), and this pass could not delete it through the UI (X1) or safely delete it
  directly against the API without disturbing shared seed state other units/specs may depend on. The
  `leisure.emptyStates.projects` copy and Add CTA were read from source but not exercised on a truly empty
  list. A pass with a seed variant carrying zero project profiles (or run after X1 is fixed, so the seeded
  row can be deleted and restored via reseed) would confirm this renders as designed.

### U2. Loading skeleton/progress state not screenshotted
- **Status:** verified, passes (2026-09-24, `playwright-cli`) — delayed `POST **/activity-project-profile/grid`
  by 4s via `page.route`/`page.waitForTimeout`, then snapshotted immediately after reload on both view modes.
  Board shows a `progressbar` (`VProgressLinear`) above the column grid; table shows a `progressbar` in its
  header row plus a `cell "Loading items..."`, confirming both loading states render as designed.
- **Severity:** unverified
- **What would verify it:** The board's `VProgressLinear` (visible only for the duration of the initial
  `grid` fetch) was seen once in an early snapshot taken mid-load in this pass, but was too fast to
  reliably capture in a saved screenshot — the same limitation the sibling `leisure-backlog-picker` unit
  noted (its U4) for the picker's skeleton loader. A pass with a throttled network would give a firmer
  look at the loading state on both board and table.
