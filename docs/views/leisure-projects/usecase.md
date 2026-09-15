# leisure-projects — use cases

## What this unit is for

Tracks hobby/DIY projects the user is building — "something I'm building," per the glossary's leisure
vocabulary. Each project is a `leisure` profile hung off an `Activity` (`ActivityProjectProfile`, keyed by
`activityId`), carrying difficulty, area, estimated hours, a messiness flag, and — the part this unit's
board exists to surface — a `readinessStatus` (`Planning` / `NeedsShopping` / `ReadyToStart`) plus the
`materialsNeeded` and `requiredTools` lists that explain *why* a project is stuck.

## Where it sits

Reached from the sidebar's "Leisure" group → "Projects" (`/leisure/projects`), alongside the other three
leisure profile views (Backlog, Bucket list, Memory anchors) and the "What should I do?" picker. A user
lands here to either review what they're building, log a new project idea, or — per the readiness board's
whole reason for existing (Gollwitzer's implementation-intentions research, cited in the P1 prompt this
board was built from) — resume a stalled project by seeing exactly what it's waiting on. Nothing else in
the app links into this view; it is not referenced from the picker, the backlog, or any other module.

## Views

### ProjectsView (`/leisure/projects`)

**Purpose:** List, filter, create, edit and delete project profiles; group them by how ready they are to
work on.

**Who opens it and why:** Someone with an existing hobby/DIY project who wants to either add a new one,
check what's blocking an existing one, or bump its status after buying materials or finishing planning.

**What the user can do**

- Toggle between a **board** (grouped by readiness, the default) and a plain **table**, with the choice
  meant to survive a reload via the URL's `view` query param — see Findings B1 for where this breaks.
- Filter by activity name, difficulty, readiness, area and messiness; every field round-trips through the
  URL.
- Create a project via "Add" (bound to an existing or newly-created `Activity`) from either view.
- Edit a project by clicking its board card, or via the table's row action. **As of this pass, every write
  — status change, edit, delete — fails against the live backend; see Findings X1.**
- Delete a project from either view, behind a generic (non-cascading) confirmation.
- **Move a project between readiness columns with one click** on the board — the click writes
  `readinessStatus` immediately; there is no drag-and-drop, a status-button row on the card instead (see
  P1's "if drag-and-drop is not cleanly available, a small status control on the card is fine").

**What the user can see, and the question it answers**

- **Readiness board** (3 columns: Ready to start, Needs shopping, Planning) — answers "what am I actually
  blocked on, project by project?" `NeedsShopping` cards list the first few `materialsNeeded` and
  `requiredTools` (plus a "+N more" count when there are more than three), turning "this project is
  blocked" into a checkable list rather than a status word.
- **Table** — the same rows as a sortable/paginated grid (Activity, Difficulty, Readiness, Area, Est.
  hours, Messy), for anyone who wants the plain list rather than the grouped view. `materialsNeeded` and
  `requiredTools` are **not** columns here — they only ever surface on the board's `NeedsShopping` cards.
- **Filter chips** above both views summarise the active filter (e.g. "Readiness (1)"), each removable
  individually.
- Activity icon + name, colour-matched to the activity's role, on every card/row (`ActivityNameCell`,
  shared with the other three leisure tables) — **now renders correctly** (see Findings B3, fixed since the
  2026-09-13 inventory pass).

**Depends on:** the activity picker's own data (`useActivityCrud().fetchSelectOptions`) for the
create/edit form's activity field; no user preference (theme/locale aside) changes this view's behaviour.

## Entity lifecycle

A project profile is created by attaching profile fields to an existing `Activity`, or by creating a new
`Activity` inline (the autocomplete's "create new" option, `QuickCreateActivityDialog`) and attaching the
profile to it in the same form submit. Editing changes any profile field, including a full-payload
`readinessStatus` change via the board's one-click status control — a known, documented backend gap, not an
oversight: `prompts/_done/leisure/backend/P1-backend.md` asks for a status-only PATCH route that does not
exist yet, so every status click round-trips the whole profile (and, per Findings X1, currently 404s
regardless, for an unrelated reason — the frontend keys the write by the wrong id). Deleting removes the
profile row only — the underlying `Activity` and any history/planner/to-do rows pointing at it are
untouched, which is presumably why the delete confirmation is a plain "are you sure", not a cascade
warning: there is nothing to cascade.

## Data this unit captures but does not spend

- **`activity.isOnTodoList`** — present in every `/api/activity-project-profile/grid` response row, read by
  nothing in `src/`. It looks like backend groundwork for exactly the shopping-list-to-todo handoff P1 asked
  the frontend to *evaluate* (point 4: "consider whether a NeedsShopping project's materials list should be
  able to hand off to the todo list") — no such handoff exists in the current code, and no
  `migration-revision.md` entry explains why it was skipped. See Findings O1.
