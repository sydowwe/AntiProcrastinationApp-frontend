# leisure-projects — findings

> Pass: inventory · captured 2026-09-13 · commit `430e6f03`

**Tally:** blocker 0 · bug 3 · a11y 3 · polish 1 · opportunity 1 · unverified 0

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-13 | `430e6f03` | initial inventory pass |

---

### B1. Board/Table view mode does not reliably survive a reload, contradicting the requirement it was built for
- **Status:** open
- **Severity:** bug
- **Where:** `src/core/leisure/view/ProjectsView.vue:146` (`watch(viewMode, ...)`) racing
  `src/_common/composable/table/useTableUrlState.ts:106-136` (`syncToUrl`), triggered by
  `src/_common/component/dataTable/BasicTable.vue:191-202` (default-sort-on-mount watcher)
- **Expected:** The view-mode toggle writes `view` to the URL and survives a reload. This is not a
  guess — it is the explicit deliverable of the prompt that built this toggle
  (`prompts/_done/leisure/backend/../P1-readiness-board.md`, point 1: *"toggled against the existing
  table with the mode in a URL query param (CLAUDE.md requires bookmarkable view state)"*), and
  CLAUDE.md's own URL-state rule ("Store filterable/bookmarkable state ... in URL query params").
- **Actual:** From a fresh, query-string-free load of `/leisure/projects`, clicking "Table" leaves the
  URL as `?page=1&perPage=25&sortBy=activity.name:asc` — no `view` key at all. Reloading falls back to
  Board, silently discarding the user's explicit choice. The failure is a race, not a permanent bug:
  once `sortBy` is already present in the URL (so `BasicTable`'s default-sort watcher has nothing to
  push), the same click *does* write `view=table` correctly. So the bug reproduces reliably only from a
  clean state, and intermittently otherwise.
- **Evidence:** Two navigations recorded via `playwright-cli`:
  1. Fresh load → click "Table" → URL `https://localhost:3000/leisure/projects?page=1&perPage=25&sortBy=activity.name:asc` (no `view`).
  2. Same view, filter already applied (so `sortBy` pre-existing) → click "Table" → URL correctly gains `&view=table`.
  3. Reload after case 1 → board toggle button shown `[active]` in the snapshot, not table, confirming the fallback.
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

### B2. Every board-mode filter change fires two competing grid requests, breaking the "one fetch per filter change" guarantee
- **Severity:** bug
- **Status:** open
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
  first. In this pass the 200-item call was the one aborted.
- **Evidence:** `playwright-cli requests` after applying `readinessStatuses=needsShopping` from the
  board showed three grid POSTs for one filter change: request #1421 (`itemsPerPage:200`) →
  `net::ERR_ABORTED`; request #1422 (`itemsPerPage:25`) → 200. Request bodies confirmed via
  `playwright-cli request-body 1421` / `1422`. Source read of `useFetchFilteredTable.ts:31-56` confirms
  the single-`AbortController`-per-instance design and its cancellation fallback (see root cause).
- **Repro:**
  1. Navigate to `/leisure/projects` (board mode, default).
  2. Open the Filter panel, set Readiness to any value, Confirm.
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
  cancellation fallback (`catch(e) { if (isCancel && latest !== promise) return latest }`,
  `useFetchFilteredTable.ts:47-53`) means the aborted call does not throw — it silently resolves with
  the *other* call's result instead. That is a correctness risk beyond the wasted round trip: with more
  than 25 matching projects (not reproducible with this seed's single row), a board-mode filter change
  could resolve with the table's 25-row page rather than the board's intended 200-row page, silently
  under-rendering the board. This consequence is inferred from the code path, not directly observed in
  this pass — flagged here rather than filed as its own finding, since it shares this one root cause.

### B3. The activity icon/colour this module was built to render never appears — the API nests it, the DTO reads it flat
- **Status:** open
- **Severity:** bug
- **Where:** `src/core/leisure/dto/response/ActivityInfo.ts:10-13` (`fromJson` reads `object.icon` /
  `object.color`); `src/core/leisure/component/ActivityNameCell.vue:3-8` (renders `activity.icon`,
  conditionally)
- **Expected:** L3 built this explicitly: *"ActivityInfo ... carries `icon` and `color` alongside
  `name`, and every one of the four tables renders the bare name and throws both away ... Render the
  activity icon in the `activity.name` cell of all four tables, tinted with its colour"*
  (`prompts/_done/leisure/L3-shared-inputs.md`, item 4). The code to do this exists and is wired up.
- **Actual:** No icon renders next to "Build a Bookshelf" on either the board card or the table row,
  even though the seeded activity has a role with `icon: "fas fa-guitar"`, `color: "violet"`. The live
  `POST /api/activity-project-profile/grid` response nests these under `activity.role.icon` /
  `activity.role.color` — there is no `activity.icon` / `activity.color` at the top level the DTO reads,
  so `ActivityInfo.fromJson` always resolves both to `null` and `ActivityNameCell`'s `v-if="activity.icon"`
  never fires.
- **Evidence:** `docs/views/leisure-projects/screenshots/leisure-projects--board-default.png` — no icon
  next to "Build a Bookshelf". Response body of request #1415
  (`playwright-cli response-body 1415`): `"activity":{...,"role":{...,"color":"violet","icon":"fas
  fa-guitar",...},...}` — `icon`/`color` absent from `activity` itself.
- **Repro:**
  1. Navigate to `/leisure/projects`.
  2. Look at the "Build a Bookshelf" card (board) or row (table).
  3. No icon appears next to the name.
- **Verify:**
  1. Navigate to `/leisure/projects`.
  2. **Pass condition:** the activity name cell/card renders an icon tinted the activity's role colour.
- **Root cause guess:** Either the backend was expected to flatten `role.icon`/`role.color` onto the
  `ActivityInfo` payload and does not, or `ActivityInfo.fromJson` was written against an assumed shape
  that was never verified against the real endpoint (L3's prompt asserts "the data is already on the
  wire" without citing a response body).
- **Suggested fix:** Change `ActivityInfo.fromJson` to read `object.role?.icon ?? null` /
  `object.role?.color ?? null` as a fallback when the flat fields are absent, or ask the backend to add
  them directly to keep `ActivityInfo` a flat DTO.

### A1. Filter panel's close (×) button has no accessible name — [framework]
- **Status:** open
- **Severity:** a11y — **[framework]**
- **Where:** `src/_common/component/FilterPanel.vue:49-54` (`VIconBtn icon="close"`, no `title`/
  `aria-label`)
- **Expected:** Every icon-only control needs an accessible name (CLAUDE.md/PROMPT-TEMPLATE checklist;
  same rule the shell pass applied to the sidebar hamburger, A2 in `docs/views/_shell/inventory.md`).
- **Actual:** `document.activeElement`-style inspection of the button (`playwright-cli eval`) returned
  `{"text":"","ariaLabel":null,"title":""}`.
- **Evidence:** `playwright-cli eval` result quoted above, against the panel opened from
  `/leisure/projects`.
- **Repro:** 1. Open the Filter panel. 2. Inspect the × button in its header. 3. No accessible name.
- **Verify:** 1. Open the Filter panel on any view using it. 2. **Pass condition:** the close button
  exposes a localized accessible name (e.g. `general.close`).
- **Root cause guess:** Same class of gap as the shell pass's A2 (sidebar hamburger) — a framework
  `VIconBtn` shipped without a label. Since `FilterPanel` is shared by all four leisure tables (and any
  other module using it), this is one fix in `_common`, not a per-view one.
- **Suggested fix:** Add a localized `aria-label` (e.g. `$t('general.close')`) to the `VIconBtn` in
  `FilterPanel.vue:49`.

### A2. Table's "Messy" column renders a bare icon with no accessible text
- **Status:** open
- **Severity:** a11y
- **Where:** `src/core/leisure/component/project/ProjectTable.vue:25-31`
  (`<template #item.isMessy>` → `<VIcon :color :icon size="16" />`, no label)
- **Expected:** A status conveyed only by icon needs a text alternative, per the same rule as A1.
- **Actual:** The cell for "Build a Bookshelf" (which has `isMessy: true`) renders only a check-mark
  `VIcon`; the accessibility snapshot shows an empty cell (`cell [ref=...]` with no text/name).
- **Evidence:** Table-mode snapshot, `cell [ref=f14e320]` (the Messy column for the one seeded row) has
  no accessible text, confirmed against the source only rendering a bare `VIcon`.
- **Repro:** 1. Switch to Table view on `/leisure/projects`. 2. Inspect the "Messy" column for a row
  where `isMessy` is true.
- **Verify:** 1. Switch to Table view. 2. **Pass condition:** the Messy cell exposes a text alternative
  (visible text, or an `aria-label` on the icon) in addition to or instead of the bare icon.
- **Suggested fix:** Add `:aria-label="item.isMessy ? t('general.yes') : t('general.no')"` (or similar)
  to the `VIcon`, matching whatever convention the app uses elsewhere for boolean icon columns.

### A3. Non-active readiness-status buttons on the board have very low contrast
- **Status:** open
- **Severity:** a11y
- **Where:** `src/core/leisure/component/project/ProjectReadinessBoard.vue:130-146` (status button row,
  `:color="s === item.readinessStatus ? STATUS_META[s].color : 'grey-lighten-2'"`, `variant="tonal"`)
- **Expected:** An interactive control's icon should be visually distinguishable from its background at
  normal viewing distance — plain user sense, and the same expectation the a11y checks above rely on.
- **Actual:** The two non-active status buttons on a card (e.g. "Ready to start" and "Planning" on a
  card currently "Needs shopping") render as near-invisible pale circles — visually confirmed in the
  full-page screenshot, and confirmed by computed style: `class="... text-grey-lighten-2 ...
  v-btn--variant-tonal"`, `background-color: rgba(0, 0, 0, 0)` (fully transparent — `tonal` isn't adding
  any background tint at this color, so contrast rests entirely on the very light `grey-lighten-2` icon
  glyph against the white card).
- **Evidence:** `docs/views/leisure-projects/screenshots/leisure-projects--board-default.png` (the two
  faint circles left and right of the orange "Needs shopping" button); `playwright-cli eval` computed
  style dump of the three status buttons.
- **Repro:** 1. Navigate to `/leisure/projects` (board mode). 2. Look at the status-button row on the
  "Build a Bookshelf" card.
- **Verify:** 1. Navigate to `/leisure/projects`. 2. **Pass condition:** the two non-active status icons
  are clearly visible against the card background (not just the active one).
- **Suggested fix:** Use a darker/more saturated inactive color (e.g. a `secondaryOutline`-family shade
  already used elsewhere in this module) instead of `grey-lighten-2`, or give the `tonal` variant an
  actual background tint so the icon has contrast to sit on.

### P1. `FilterPanel` logs a recurring Vue warning about an attribute it can never use
- **Status:** open
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
  just this one).
- **Evidence:** `playwright-cli console` on `/leisure/projects`, five+ identical `[INFO]` entries naming
  `<FilterPanel>`/`<ProjectsView>`.
- **Repro:** 1. Navigate to `/leisure/projects`. 2. Open the console. 3. See the warning.
- **Verify:** 1. Navigate to `/leisure/projects`. 2. **Pass condition:** no "Extraneous non-props
  attributes" warning naming `FilterPanel` in the console.
- **Root cause guess:** Same shape as A1 — a `_common` component issue (multi-root template breaks attr
  inheritance) surfacing at an app call site. Worth batching with A1 since both are `FilterPanel`
  cleanup, but this one is a dead prop, not a missing label.
- **Suggested fix:** Drop `class="flex-1-1"` from the `<FilterPanel>` call sites that don't need it
  (framework already applies `flex-fill` internally), or fix `FilterPanel.vue` to have a single root
  element so attrs inherit normally.

### O1. `activity.isOnTodoList` rides on every response unread — and P1's own shopping-list-to-todo handoff was never built or declined in writing
- **Status:** open
- **Severity:** opportunity
- **Where:** `src/core/leisure/dto/response/ActivityInfo.ts` (does not read `isOnTodoList`); board/table
  components (no todo-list affordance anywhere in this module)
- **Expected:** P1's prompt explicitly asked this unit's author to evaluate a shopping-list-to-todo
  handoff for `NeedsShopping` projects and, if not built, "note why rather than half-building it"
  (`prompts/_done/leisure/P1-readiness-board.md`, point 4). `migration-revision.md` is where such notes
  go per CLAUDE.md's convention.
- **Actual:** No handoff exists in `src/core/leisure/` or `src/core/todoList/`, and
  `migration-revision.md` has no entry about it (checked via grep for "materialsNeeded", "shopping",
  "P1"). Meanwhile every `/api/activity-project-profile/grid` response row carries
  `activity.isOnTodoList` — a field that looks purpose-built for exactly this feature (so a project's
  materials aren't offered as a to-do a second time if they already are one) — and nothing in `src/`
  reads it.
- **Evidence:** Response body of request #1415 includes `"isOnTodoList":false`;
  `ActivityInfo.fromJson`/`ActivityInfo` class (no `isOnTodoList` field); grep for `isOnTodoList` across
  `src/` returns no matches; grep of `migration-revision.md` for the relevant terms returns no matches.
- **What exists / what it could feed:** `materialsNeeded: string[]` per `NeedsShopping` project (already
  rendered on the board card) plus the backend's own `isOnTodoList` flag on the activity is enough raw
  material to build the handoff P1 asked for — surface a "Add to to-do list" affordance on
  `NeedsShopping` cards, guarded by `isOnTodoList` so it doesn't offer twice, writing through
  `core/todoList`'s `api/`/`dto/` only, per CLAUDE.md's cross-module rule (same constraint P1 named
  explicitly).
