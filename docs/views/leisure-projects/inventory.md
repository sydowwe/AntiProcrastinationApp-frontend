# leisure-projects — inventory

> Captured 2026-09-13 · locale EN · account `test@example.com` · commit `430e6f03`

## Views

### ProjectsView (`/leisure/projects`)
![board, default](screenshots/leisure-projects--board-default.png)

**Route:** `/leisure/projects` · params: none · guard: auth (not in `SIGNED_OUT_ONLY_ROUTES`, requires sign-in
per shell doc's general pattern)
**Reached from:** sidebar Leisure group → "Projects"

**Actions**
| label | kind | selector | does | destination |
| --- | --- | --- | --- | --- |
| Board / Table toggle | button group (`VBtnToggle`) | `getByRole('button', { name: 'Board' \| 'Table' })` | switches view mode; writes `view` query param | in place |
| Filter | button | `getByRole('button', { name: 'Filter' })` | opens the `FilterPanel` overlay (`role=dialog`) | overlay |
| Filter panel close (×) | button, **icon-only, no accessible name** | fallback: CSS `.v-btn--icon.text-secondaryOutline` inside the panel header, or `getByTitle('')` (empty) | closes the filter overlay | in place — see Findings A1 |
| Filter chip, e.g. "Readiness (1)" | chip | `getByText('Readiness (1)')` | shows active filter value | n/a |
| Filter chip's "Close" | button | `getByRole('button', { name: 'Close' })` (scoped to the chip) | clears that one filter field | in place |
| Filter panel fields: Activity (text), Difficulty (select), Readiness (select), Area (text), Messy (tri-state checkbox) | input / select / checkbox | role+name, e.g. `getByRole('textbox', { name: 'Activity' })` | edit the draft filter | n/a until Confirm |
| Filter panel Clear | button | `getByRole('button', { name: 'Clear' })` | resets the draft filter to default | n/a |
| Filter panel Confirm | button | `getByRole('button', { name: 'Confirm' })` | applies the draft filter, closes the panel, resets to page 1 | in place, triggers reload |
| Add | button | `getByRole('button', { name: 'Add' })` | opens the create dialog (`ProjectProfileForm`) | dialog |
| **Board** — card (click anywhere on it) | row action (`VCard`, whole card clickable) | `getByText('<activity name>')` | opens the edit dialog, pre-filled, activity field locked | dialog |
| **Board** — card Delete (trash, icon-only) | button | `getByTitle('Delete')` | opens a delete-confirmation dialog | dialog |
| **Board** — status buttons (3 per card, icon-only) | button row | `getByRole('button', { name: 'Ready to start' \| 'Needs shopping' \| 'Planning' })`, scoped to the card | one click sets `readinessStatus` to that column; **not exercised in this pass** (Pass is inventory — a click here is a real, non-reversible mutation against the live backend, no status-only route exists to undo it cleanly) — behaviour confirmed by source read only (`ProjectReadinessBoard.vue:238-247`) | in place, moves the card |
| **Board** — empty-state Add | button | `getByRole('button', { name: 'Add' })`, scoped to the empty-state block | same as header Add | dialog |
| **Table** — column headers (Activity, Difficulty, Readiness, Area, Est. hours) | sortable header | `getByRole('columnheader', { name: '<label>' })` | toggles sort, writes `sortBy` to the URL | in place |
| **Table** — row "edit" (icon-only, has accessible name) | button | `getByRole('button', { name: 'edit' })` scoped to row | opens the edit dialog | dialog |
| **Table** — row "delete" (icon-only, has accessible name) | button | `getByRole('button', { name: 'delete' })` scoped to row | deletes immediately — **`ProjectTable.vue`'s own `onDelete` has no confirmation of its own**, but `BasicTable` wraps every delete action in its own `MyDialog` confirm before emitting `onDelete`, so a confirm dialog does appear in practice (see Findings) | dialog, then in place |
| **Table** — footer "Add" (in the actions column header) | button | `getByRole('button', { name: 'Add' })` inside the header row | same as header Add | dialog |
| **Create/Edit dialog** fields: Activity (autocomplete, locked on edit), Difficulty (select), Readiness (select), Area (text), Est. hours (`VNumberInput`), Messy (checkbox), Materials needed / Required tools (`VCombobox`, free-entry chips) | various | role+name | edit the draft request | n/a until Create/Save |
| **Create/Edit dialog** Cancel | button | `getByRole('button', { name: 'Cancel' })` | closes without saving | in place |
| **Create/Edit dialog** Create / Save | button | `getByRole('button', { name: 'Create' \| 'Save' })` | validates, then creates/updates | in place, triggers reload |
| **Create dialog** activity autocomplete "no data" → create option | list item | `getByText(/Create ".*"|Create a new activity/)` | opens `QuickCreateActivityDialog` (not opened this pass — out of unit scope, it is `core/activity`-adjacent tooling reused from `ActivityAutocompleteWithCreate.vue`) | dialog |
| **Delete confirmation** Cancel / Confirm | button | `getByRole('button', { name: 'Cancel' \| 'Confirm' })` | closes / deletes | in place / mutates |

**Readable surfaces**
| surface | kind | contents | raw/derived | populated by |
| --- | --- | --- | --- | --- |
| Readiness board | 3-column card board | one card per project, grouped by `readinessStatus` | grouping is **derived** client-side (`computed` `Map` keyed by `COLUMN_ORDER`, `ProjectReadinessBoard.vue:193-199`); card fields are raw | `POST /api/activity-project-profile/grid` (via `loadBoard()`, fixed `itemsPerPage: 200`) |
| Board column count chip | badge | count of cards in that column | derived (`grouped.get(status)?.length`) | same request |
| Board card body | text | activity name, difficulty, area, est. hours, messy icon | raw | same request |
| Board card blockers (NeedsShopping only) | text list | first 3 of `materialsNeeded` / `requiredTools`, "+N more" if longer | raw values, **truncation is derived** (`blockerLine()`, max=3) | same request |
| Board card activity icon | icon | **intended**: `activity.icon` tinted `activity.color` | would be raw, but the field the component reads is never populated — see Findings B3 | n/a — never renders |
| Table | server-paginated grid (`BasicTable`) | Activity, Difficulty, Readiness, Area, Est. hours, Messy (icon only, no text), row actions | raw, except Messy which renders a `VIcon` (check/minus) with no accessible name — see Findings A2 | `POST /api/activity-project-profile/grid` (`itemsPerPage: 25` default, via `useServerTable`) |
| Filter chips | chip row | one per active filter field, formatted via `textChip`/`countChip`/`boolChip` | derived (formatted from filter state) | n/a, client-only |

**States**
- empty: board → large centered empty-state ("These are things you're building or making. You don't have
  any projects here yet." + an Add button), triggered by filtering to zero matches (e.g. `projectArea=zzznonexistent`)
  or an account with no projects at all; table → the same string in `BasicTable`'s `noData` slot. Screenshots:
  `leisure-projects--board-empty.png`, `leisure-projects--table-empty.png`.
- loading: board shows a top `VProgressLinear` (indeterminate) while `boardLoading`; table shows `BasicTable`'s
  own loading state (not screenshotted separately — brief on this seed's single row).
- error: not reachable with current seed/tooling — no way to force a 4xx/5xx from the UI without network
  interception, which this pass did not attempt.

**URL & persisted state**
- `page`, `perPage`, `sortBy` — table pagination/sort; round-trip through reload correctly (confirmed:
  reloaded with `sortBy=activity.name:asc` in the URL, table still sorted ascending after).
- `activityName`, `difficultyLevels`, `readinessStatuses`, `projectArea`, `isMessy` — filter fields; **all
  five round-trip correctly through a reload**, confirmed for `readinessStatuses` (chip "Readiness (1)"
  survived a reload) and `projectArea`.
- `view` (`board` | `table`) — **intended** to round-trip so the chosen view mode survives a reload
  (explicitly required by the P1 prompt that built this toggle, citing CLAUDE.md's URL-state rule). **Does
  not reliably survive** — see Findings B1. It is written correctly roughly half the time depending on
  whether `BasicTable`'s default-sort side effect fires in the same tick.
- Nothing in this view touches `localStorage`.

**Dialogs opened from here**
- **Filter** (`FilterPanel`, a `Teleport`-to-body overlay, not a `MyDialog`) — fields listed above; closes
  on Escape (confirmed) and on its own × button (confirmed) and on Confirm/click-outside.
- **Add / Edit** (`ProjectProfileForm` in a `MyDialog` via `useDialog().openDialog`) — persistent by default
  (framework default per shell doc A1); Escape does **not** close it (confirmed, consistent with the known
  framework default, not a new finding).
- **Delete confirmation** — board uses `useDialog().confirm()` directly from `ProjectReadinessBoard.vue`;
  table's delete goes through `BasicTable`'s own built-in `MyDialog` confirm. Both read
  "Are you sure you want to delete `<activity name>`?" with no cascade information (the profile delete
  does not cascade to anything, so this matches CLAAUDE.md's cascade-confirmation rule by not needing it).

**Keyboard**
- Escape closes the Filter overlay (confirmed) but not the Add/Edit `MyDialog` (confirmed, same framework
  default documented in the shell pass).
- No arrow-key or other custom keyboard navigation observed on the board (cards are click-only, no
  roving-tabindex or drag-and-drop keyboard equivalent).
- Table column-header sort is reachable by keyboard (native `<th>`/button semantics via Vuetify's
  `VDataTableServer`), not separately re-verified beyond the click test in this pass.

**Console & network**
- errors/warnings: one recurring **info-level** Vue warning naming app code — `"Extraneous non-props
  attributes (class) were passed to component... at <FilterPanel> at <ProjectsView>"`, fired on every
  render/re-render of this view. See Findings P1.
- non-2xx: none observed.
- duplicate requests: **yes** — every filter change made while the board is the active view mode fires
  **two** `POST /api/activity-project-profile/grid` calls with different `itemsPerPage` (200 and 25); one
  is aborted client-side. See Findings B2 — this is the module's own `loadBoard()` racing a filter-watcher
  inside `useServerTable` that has no reason to run while the table isn't mounted.

## Transitions out of this unit
| from | control | goes to |
| --- | --- | --- |
| Sidebar | "Backlog" / "Bucket list" / "Memory anchors" / "What should I do?" | other `leisure` views — not followed, out of unit scope |
| Create/Edit dialog | activity autocomplete "create new" option | `QuickCreateActivityDialog` — not opened this pass |
