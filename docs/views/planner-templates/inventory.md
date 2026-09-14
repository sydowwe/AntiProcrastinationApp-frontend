# planner-templates — inventory

> Captured 2026-09-14 · locale EN · account `test@example.com` · commit `6aac48bb`

Fixture: `homeOffice` (id `20001`, 5 tasks), `officeDay` (id `20002`, 4 tasks), `pinned` a.k.a. "Relaxed
Weekend" (id `20003`, 3 tasks, the only `isPinned` one). All template tasks are foreground (no
`isBackground` seed data — the header stat line's background exclusion could not be exercised).

## Views

### TemplateListView (`/day-planner/templates`)
![default](screenshots/day-planner-templates--default.png)

**Route:** `/day-planner/templates` · params: none · guard: auth
**Reached from:** sidebar "Task planner → Day planner - template"; "Cancel"/back-arrow from the split view

**Actions**
| label | kind | selector | does | destination |
| --- | --- | --- | --- | --- |
| Compare | button | `getByRole('button', {name:'Compare'})` | enters compare mode, button becomes disabled "Compare (0/2)" + a "Cancel" button appears | in place |
| (compare-mode) card selection checkbox | checkbox, **unnamed** | no accessible name; also pointer-blocked by the template's own `VIcon` sitting on top of it (see Findings A2) | intended to toggle a template into the 2-slot comparison selection | in place — use the card body click instead, which works |
| Card body (compare mode) | row-ish click target | `getByText(<card text>)` (no dedicated role) | toggles that template into/out of the 2-slot selection, updates "Compare (n/2)" | in place |
| Compare (n/2) | button | `getByRole('button', {name:/Compare \(/})` | enabled at 2/2; opens the `TemplateComparisonDialog` | dialog — **renders completely empty, see Findings X1** |
| Cancel (list toolbar) | button | `getByRole('button', {name:'Cancel'})` | exits compare mode, clears selection | in place |
| Sort dropdown | select | `getByRole('combobox')` | Most Used / Recently Used / Alphabetical; re-sorts within each section (pinned/active/inactive) | in place — **not reflected in the URL, see Findings B4** |
| Edit Side by Side | button | `getByRole('button', {name:'Edit Side by Side'})` | navigates to the split view; renders only at `mdAndUp` (no mobile equivalent) | `/day-planner/templates/split` |
| Add Template | button | `getByRole('button', {name:'Add Template'})` | opens the create dialog (`TemplateDetailsForm`) | dialog |
| Template card (click) | row | `getByText(<card text>)` | navigates to the template's detail view | `/day-planner/templates/:id` |
| Active/Inactive switch | switch | `getByRole('switch', {name:'Active'})`/`'Inactive'` | toggles `isActive`, reloads the list (moves the card between sections) | in place — **label text wraps vertically, see Findings B1** |
| Pin toggle | icon button, **unnamed** | no accessible name/title (see Findings A1); only reachable via a positional locator | `PATCH .../pinned`, optimistic with rollback on failure | in place |
| Delete | button | `getByRole('button', {name:'Delete'}).first()` etc. | opens a confirm dialog naming the template and, if it has tasks, the cascade count | dialog |
| Edit Details | button | `getByRole('button', {name:'Edit Details'})` | opens the edit dialog, pre-filled including `suggestedForDayType` | dialog |
| Duplicate | button | `getByRole('button', {name:'Duplicate'})` | opens the create dialog pre-filled with `"<name> (copy)"` and every field, including `suggestedForDayType` | dialog |
| Use Today | button | `getByRole('button', {name:'Use Today'})` | navigates to today's day planner with `?applyTemplateId=<id>` | `/day-planner/:todayDate?applyTemplateId=<id>` (out of unit) |

**Readable surfaces**
| surface | kind | contents | raw/derived | populated by |
| --- | --- | --- | --- | --- |
| Template card grid, 3 sections | cards, `VCol lg=4` | pinned / active / inactive, each independently drag-reorderable (`useTemplateCardDragAndDrop`) | raw (order is client-side drag state, not persisted server-side beyond `isPinned`) | `GET /api/task-planner-day-template` |
| Mini-timeline bar | bar chart, one `<div>` segment per task | task time-of-day proportion within wake–bed window | derived (`getPosition` in `MiniTimeline.vue`) | `POST /api/template-planner-task/filter`, one call per template, keyed by `requestKey: t.id` |
| "Used N times" / "Last used" | text | `usageCount` / `lastUsedAt` | raw | same `GET` as the card list |
| Scheduled-days strip | read-only `VBtnToggle` | `scheduledDays` | raw | same |
| DayTypeChip | chip | `suggestedForDayType` | raw | same — **text hard-clipped with no ellipsis when the row is crowded, see Findings B1** |

**States**
- empty: not reachable with current seed (3 templates always present)
- loading: `LoadingFullscreen` overlay (framework, documented in `_shell/inventory.md`) while `loadTemplates()` runs
- error: not reachable — `fetchAll()` had no way to be made to fail from the UI in this pass

**URL & persisted state**
- No query params used at all. Sort choice, compare-mode and pin drag-order are pure component state and
  do not survive a reload (drag-order is intentionally ephemeral per source comments; sort is not).

**Dialogs opened from here**
- **Add/Edit/Duplicate template** (`TemplateDetailsForm` inside `MyDialog`) — Template Name, Wake Up, Bed
  Time, Description, Suggested for Day Type, Suggested Location, Tags, Icon, Scheduled Days. Confirm label
  is "Create" or "Update". **"Suggested for Day Type" carries no required-rule and no asterisk — see
  Findings B2.**
- **Delete confirm** (`useDialog().confirm`) — "Delete template? '<name>' cannot be restored." plus, when
  the template has tasks, "Tasks in this template: N. They will be deleted with it." Matches CLAUDE.md's
  cascade-confirmation rule.
- **Compare Templates** (`TemplateComparisonDialog`) — **renders two empty panels every time it is opened,
  see Findings X1.** Has a "Confirm" button with no handler — see Findings B3.

**Keyboard**
- Standard Vuetify `VSelect`/`VDialog` keyboard handling observed (arrow keys inside the sort dropdown,
  Enter to submit forms per `MyDialog`'s `onEnterKey`). No custom shortcuts on this view.

**Console & network**
- errors/warnings: none on initial load or on ordinary navigation (three `POST .../filter` calls, one per
  template, all `[200]` — the `requestKey` fix from the intent sources holds)
- non-2xx: none, **except** the reproducible failures under Findings X1/B2 (both are user-triggered, not
  load-time)
- duplicate requests: none on load. One always-firing minor issue: `MiniTimeline.vue:50` calls
  `console.log(tasks)` on every render of every card's timeline — three log lines on every load, see
  Findings P3.

### TemplateSplitView (`/day-planner/templates/split`)
![empty](screenshots/day-planner-templates-split--empty.png)
![populated](screenshots/day-planner-templates-split--populated.png)

**Route:** `/day-planner/templates/split` · params: none · guard: auth
**Reached from:** "Edit Side by Side" on the list (desktop only, no nav entry — the only way in)

**Actions**
| label | kind | selector | does | destination |
| --- | --- | --- | --- | --- |
| back arrow | icon button | `getByRole('button')` near the title (has an icon but check accessible name — not separately verified this pass) | returns to the list | `/day-planner/templates` |
| Left Template / Right Template | select | `getByRole('combobox', {name:'Left Template'/'Right Template'})` | loads that `TemplateDayPlannerView` into the panel, independently of the other side | in place |
| everything `TemplateDayPlannerView` exposes | — | — | identical to the standalone view, once per panel, against independent `main`/`secondary` stores | in place |
| drag a task across panels | drag-and-drop (`@atlaskit/pragmatic-drag-and-drop`) | not verified by an actual drag in this pass (too failure-prone to script reliably; a drag handle icon is visible on each task block) | intended to move the task to the other template via `PATCH` + local store splice | in place |

**Readable surfaces**
| surface | kind | contents | raw/derived | populated by |
| --- | --- | --- | --- | --- |
| "Select a template" placeholder | empty-panel text | shown per side until a template is picked | — | — |
| Two independent template detail panels + grids | see `TemplateDayPlannerView` below | — | — | — |

**States**
- empty: both panels show "Select a template" until picked (this is the view's default landing state, not
  a degraded one)
- loading: template-options dropdowns show `:loading` while `fetchAll()` resolves
- error: not reached in this pass

**URL & persisted state**
- Left/right template selection is **not** in the URL. Confirmed: select both sides, reload — both panels
  reset to "Select a template", selections are lost. See Findings B4 (same root issue as the list's sort
  dropdown — this view is a second instance of it).

**Dialogs opened from here**
- Every dialog `TemplateDayPlannerView` opens (task create/edit), scoped correctly per panel — confirmed
  by selecting a task in the left panel and pressing `e`: exactly one dialog opened, for the left panel's
  task. This is the P1-defect-3 fix holding under direct test.

**Keyboard**
- Confirmed scoped correctly: selecting a task in one panel and pressing a shortcut (`e`) affects only
  that panel, not both — the split view's core known risk (duplicated global key handling) did not
  reproduce.

**Console & network**
- errors/warnings: none. Two-or-more `POST .../filter` calls abort as templates load (expected, per the
  `latestLoadToken` handling in `TemplateDayPlannerView.vue`) and are silently swallowed — no console noise.
- non-2xx: none
- duplicate requests: the expected/handled aborts above; nothing unhandled

## Transitions out of this unit
| from | control | goes to |
| --- | --- | --- |
| TemplateListView | "Use Today" | `/day-planner/:date?applyTemplateId=<id>` (dayPlanner unit) |
| TemplateListView | template card click | `/day-planner/templates/:id` (in-unit) |
| TemplateListView | "Edit Side by Side" | `/day-planner/templates/split` (in-unit) |
| TemplateSplitView | back arrow | `/day-planner/templates` (in-unit) |
| TemplateDayPlannerView (Routine tab) | placing a routine item | reads `RoutineTodoListItemEntity` data from `todoList`, via the sanctioned `historyDashboard`-style cross-module read — no navigation |

---

### TemplateDayPlannerView (`/day-planner/templates/:templateId`)
![default](screenshots/day-planner-templates-id--default.png)
![placing a routine item](screenshots/day-planner-templates-id--placing-routine-item.png)
![mobile — panel closed](screenshots/day-planner-templates-id--mobile.png)
![mobile — panel "open" (broken)](screenshots/day-planner-templates-id--mobile-panel-open2.png)
![invalid id — stale header](screenshots/day-planner-templates-id--invalid.png)

**Route:** `/day-planner/templates/:templateId` · params: `templateId: number, read from route.params`
(deliberately no `props: true` — see the comment in the component; the split view instead passes it as a
prop) · guard: auth
**Reached from:** list card click, "Edit Details" (opens the details dialog, not this route), split view
(as a prop, not this route)

**Actions**
| label | kind | selector | does | destination |
| --- | --- | --- | --- | --- |
| DETAILS / ROUTINE toggle | `VBtnToggle` | `getByRole('button', {name:'Details'/'Routine'})` | switches the side-panel tab; bodies mount/unmount (Routine reloads its list each time) | in place |
| Template Name / Wake Up / Bed Time / Description / Suggested for Day Type / Suggested Location / Tags / Icon / Scheduled Days | form fields | — | edits local form state | — |
| Update details | button | `getByRole('button', {name:'Update details'})` | `PATCH` the template, reloads details | in place |
| Routine item row | list item | `getByRole('listitem')` inside the Routine panel | selects it as the "placing" item, shows a "Placing / <name> / Cancel" banner over the grid | in place |
| Cancel (placing banner) | button | `getByRole('button', {name:'Cancel'})` | clears the placement, banner disappears | in place |
| Start / duration steppers, 5M/10M/15M/30M | inputs + buttons | — | changes the grid's time-slot granularity | in place |
| Add New Task | button | `getByRole('button', {name:'Add New Task'})` | opens the create-task dialog | dialog |
| Task block (grid) | button, accessible name includes time/role/category/importance/location | `getByRole('button', {name:/<task name>/})` | selects it; selection-actions bar appears (Edit/Cut/Duplicate/Split/Cancel) | in place |
| mobile panel-close "X" | icon button | `d-md-none`, no separate accessible-name check done | closes the panel at `<md` widths | in place |
| mobile panel-open toggle (the collapsed pill) | icon button, **unnamed** | no accessible name (see Findings A3) | opens the panel at `<md` widths — **but see Findings X2, the opened panel is unusable** | in place |

**Readable surfaces**
| surface | kind | contents | raw/derived | populated by |
| --- | --- | --- | --- | --- |
| Header stat line | text | "N tasks · Xh Ym planned · Zh Wm free" | derived, **excludes background tasks by design** (`taskStats` filters `nonBgTasks`) — not exercised with a background task in this seed | client-side, from `store.tasks` |
| Time grid | custom grid, one row per slot | task blocks positioned by time | raw times, derived pixel/row position | `POST /api/template-planner-task/filter` |
| Task block accessible name | text | "`<name>, <start> to <end>, role: <role>[, category: <category>][, importance: <level>][, location: <loc>]`" | raw, composed | same |
| Keyboard help paragraph | text (visually hidden, in the a11y tree) | "Tab moves between tasks. Space or Enter selects... Arrow Up/Down move... Escape clears." | static | — |
| Routine panel: period selector + "M/N tasks" + "M/N fully planned" + item list with streak numbers | text/list | routine items from `todoList`, cross-module read | raw | `GET /api/routine-todo-list/grouped-by-time-period` (boot-time, per shell inventory) filtered by period |

**States**
- empty: no-tasks-for-this-template state not exercised (every seeded template has tasks); the grid would
  presumably render with no blocks — not distinguished from "still loading" in this pass
- loading: `LoadingFullscreen` overlay, suppressed for split-view panels (`if (!isSplitView) showFullScreenLoading()`)
- error (invalid id `/day-planner/templates/999999`): grid renders empty (real — no tasks for that id) and
  a **404 fires from `TemplatePlannerPanel.vue`'s `loadTemplateDetails`, but the header keeps showing the
  previously-viewed template's name ("Home Office") instead of any not-found indication — see Findings X2.**

**URL & persisted state**
- `templateId` round-trips correctly through a reload and back-navigation once a *valid* id is in the URL.
- The `templateDayPlannerStore` **persists to `sessionStorage`** (Pinia default persistence, no
  `persist: false` override) including `currentTemplateId` and `templateName` — this is the mechanism
  behind Findings X2: a stale, previously-loaded template's name survives a failed reload of a bad id.

**Dialogs opened from here**
- **Add/Edit template task** (`TemplatePlannerTaskDialog`) — not exhaustively inventoried field-by-field in
  this pass (out of the time budget); confirmed it opens, confirmed exactly one instance opens under `e`
  in the split view.

**Keyboard**
- Fully documented by the view's own on-grid help paragraph (see Readable surfaces above): Tab between
  tasks, Space/Enter select, `E` edit, Delete removes, Ctrl+D duplicates, Arrow Up/Down move by one slot,
  Escape clears selection. Confirmed scoped per-instance in the split view (see TemplateSplitView above).

**Console & network**
- errors/warnings: none on a valid id. **On an invalid id, an uncaught 404 (`AxiosError`) from
  `TemplatePlannerPanel.vue:49`** — same class as the shell inventory's documented `/todo-list/999999`
  finding (unhandled console exception, graceful-looking UI) but here the UI is actively misleading rather
  than merely empty — see Findings X2.
- non-2xx: the 404 above, on invalid id only
- duplicate requests: two `POST .../filter` calls legitimately abort during a template switch (the
  `latestLoadToken` + view-window-watcher interaction described in the component's own comments) and are
  silently handled — not a defect

**Mobile (390×844), out of the shell's own scope:**
- Panel-closed state renders correctly, full-width grid, no horizontal overflow.
- Opening the panel produces a **400×16px, horizontally-offscreen sliver** instead of a usable panel — see
  Findings X2 (the blocker, not the a11y-only finding above). The close "X" is still clickable and does
  close it back to the collapsed state.
