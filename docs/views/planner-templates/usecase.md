# planner-templates — use cases

## What this unit is for
A **template** (`TaskPlannerDayTemplate`, per `docs/views/glossary.md`'s planner vocabulary) is a reusable
shape of a day — a named set of template tasks with default wake/bed times, days it's meant for, and a
usage history. This unit is where a user builds, edits, compares and applies those templates, so that
"plan my day" can mean "start from Home Office" instead of placing every task from scratch. Applying a
template is out of this unit's scope (it happens on `/day-planner/:date`, in the `dayPlanner` day unit)
but is launched from here via "Use Today".

## Where it sits
Reached from the sidebar under Task planner → "Day planner - template", or from `/day-planner` if a user
wants to manage the templates they've built. From the list, a user opens one template to edit its tasks
(`TemplateDayPlannerView`), or opens two at once side by side (`TemplateSplitView`) to compare or move
tasks between them. "Use Today" hands off to `/day-planner/:date` (the `dayPlanner` unit). "Routine" tab
inside a template pulls in routine to-do items from `todoList` (`RoutineTodoListItemEntity`, per the
glossary) so a recurring obligation can be dropped onto the template's grid.

## Views

### TemplateListView (`/day-planner/templates`)
**Purpose:** Browse, sort, create, edit, duplicate, delete and pin templates; enter compare mode or the
split editor.
**Who opens it and why:** Anyone managing their set of day templates — building a new one, tidying up an
old one, or picking one to apply today.

**What the user can do**
- Sort templates by most used, recently used, or alphabetically
- Pin a template so it always sits in its own section at the top
- Toggle a template active/inactive (inactive ones sort last and render dimmed)
- Create, edit, duplicate or delete a template (delete cascades to its tasks and confirms with the count)
- Select two templates and compare them side by side in a dialog, or jump to the full split-screen editor
- Apply a template to today, handing off to the day planner with `?applyTemplateId=`

**What the user can see, and the question it answers**
- Template card (name, icon, active toggle, pin, day-type chip) — "what is this template for, is it in use"
- Mini-timeline bar per card — "roughly how full is this template's day, at a glance"
- "Used N times" / last-used date — answers "which templates do I actually rely on" (drives the default sort)
- Scheduled-days row (Mon–Sun toggle strip, read-only here) — "which days is this meant for"

**Depends on:** none of the three per-user preference systems directly; pin state is now server-side
(`isPinned`, migrated off a legacy per-device `localStorage` set — see `migrateLegacyPins` in
`TemplateListView.vue`).

### TemplateSplitView (`/day-planner/templates/split`)
**Purpose:** Edit two templates side by side, and move a task from one into the other by dragging it
across.
**Who opens it and why:** Comparing two similar templates while editing both, or reorganizing a task from
one day-shape into another — reachable only via the "Edit Side by Side" button on the list (desktop
widths only; no nav entry).

**What the user can do**
- Pick a template independently for the left and right panel from all templates (no active-only filter)
- Everything `TemplateDayPlannerView` can do, twice, once per panel (see below)
- Drag a task from one panel's grid and drop it on the other panel to move it to that template (this
  calls the task-update API with the new `templateId`, not a client-only reorder)

**What the user can see, and the question it answers**
- Two independent `TemplateDayPlannerView` instances — "how do these two templates compare, side by side"

**Depends on:** two separate Pinia store instances (`main` / `secondary`, via `storeId` prop) so the two
panels' selections, clipboards and undo stacks don't collide.

### TemplateDayPlannerView (`/day-planner/templates/:templateId`)
**Purpose:** Edit one template's details and its set of template tasks on a day-shaped grid.
**Who opens it and why:** Opened from a list card click, from "Edit Details" (details tab pre-selected),
or as either panel of the split view (via `templateId` prop instead of the route param — see the
route-registration note in the component itself).

**What the user can do**
- Edit template metadata (name, wake/bed time, description, suggested day type, suggested location, tags,
  icon, scheduled days) in the side panel's Details tab
- Add, edit, cut, duplicate, split and delete template tasks on the grid; multi-select and bulk-move by
  arrow key
- Switch to the Routine tab and select a routine to-do item to "place" it — it becomes a draggable preview
  on the grid until dropped or cancelled
- Undo (`Ctrl+Z`), with a per-view-instance stack that clears only when this is the sole mounted planner

**What the user can see, and the question it answers**
- Header stat line ("N tasks · Xh planned · Yh free") — "how full is this template's day" (deliberately
  excludes background tasks — see `docs/views/planner-templates/findings.md` for whether that should be
  labelled)
- Time grid, one row per 10-minute slot between wake and bed time — "what's scheduled and when"
- Each task button's accessible name carries time, role, category, importance and location — this is a
  well-built surface (see Findings for the one contrasting a11y gap: the mobile panel toggle)

**Depends on:** the account's activity/role/category option lists (`useActivityOptionsStore`, loaded once
at app boot); nothing from the three per-user preference systems.

## Entity lifecycle
A template is created via "Add Template" (or "Duplicate", which also copies its tasks) and deleted via
"Delete", which cascades to every template task and confirms with the count regardless of the
`askBeforeDelete` preference (per `useDeleteConfirmation`'s cascade rule). A template's tasks are owned by
`TemplatePlannerTask` rows scoped by `templateId`; they carry no date, only times, which is the entity's
whole distinction from a real `PlannerTask`. Applying a template (outside this unit) writes real
`PlannerTask` rows for a specific day, recording `isFromTemplate` and `sourceTemplateTaskId` so the origin
survives — this unit only edits the template, never a day built from it.

## Data this unit captures but does not spend
- `usageCount` / `lastUsedAt` — incremented by the *apply* flow (out of this unit), read here only to
  drive the "Most Used" / "Recently Used" sort and the card's "Used N times" line. This unit never writes
  either field itself.
- `suggestedLocation` — captured on every template (create/edit form) but no view in this unit, the split
  view, or the comparison dialog surfaces it back to the user anywhere a location-aware suggestion could
  use it (contrast with `suggestedForDayType`, which the day planner's "Apply Template" flow reads to
  suggest a template for today — out of this unit, but confirms the day-type field is spent while location
  is not).
