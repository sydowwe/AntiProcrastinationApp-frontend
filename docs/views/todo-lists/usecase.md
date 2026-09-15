# todo-lists — use cases

## What this unit is for
The normal (non-routine) to-do list: users create named lists ("Default", work/personal buckets, etc.), group
them into categories, and track discrete or multi-step tasks inside each list. It is the one-off/ad-hoc
counterpart to the `todo-routine` unit's recurring lists, and it is the primary surface for the app's
motivational scaffolding aimed at procrastination specifically — implementation intentions, focus limiting,
goal-gradient progress, one-tap timer starts and estimate calibration all live here.

## Where it sits
Reached from the sidebar ("To-do list" › "To-do list", as distinct from its sibling "Routine"). A user typically
arrives from Home or the sidebar, picks or creates a list, and works through its items. From inside a list they
can jump out to: the day planner (via "add to planner" / the "Not scheduled" chip / the header nudge), the
activity tracking / running-timer machinery (via "log time" and the one-tap quick-start stopwatch), and the
leisure backlog (via the "reward when done" pairing, offered as a snackbar on completion). Deleting a list
returns the user to the list view; there is no deep link back into a specific list item from elsewhere in the
app that this pass found.

## Views

### TodoListsView (`/todo-list`)
**Purpose:** Browse, search, sort, create and delete named to-do lists, organised by category.
**Who opens it and why:** Landing point for the to-do-list feature — a user comes here to pick which list to
work in, or to set up a new list/category before starting to add items.

**What the user can do**
- Filter lists by category (desktop: left rail; mobile: full-screen category drawer) and by name (debounced
  search), and toggle sort direction (A–Z / Z–A).
- Create, edit and delete categories, and hide categories that currently have no lists.
- Create, edit and delete lists. Deleting a non-empty list is a cascading delete and always confirms, naming how
  many items go with it, regardless of the "ask before delete" preference.
- Open a list by clicking its card, landing on `TodoListView`.

**What the user can see, and the question it answers**
- Per-list progress bar and "`x / y` done" count — answers "how far along am I on this list?" (raw: `itemCount`
  vs. presumably a done-count field on `TodoListEntity`, populated server-side by `filter-sort`).
- Category tree with an "All" entry and one entry per category (plus an implicit "Other" bucket for uncategorised
  lists) — answers "which lists belong together?"
- Empty states distinguish "no lists at all", "no lists match this search" and "no lists in this category".

**Depends on:** no user preference beyond `askBeforeDelete` (via `useDeleteConfirmation`, only consulted for
non-cascading deletes — a cascading delete here always confirms).

### TodoListView (`/todo-list/:id`)
**Purpose:** Work a single list's items — check them off, schedule them, log time against them, and reorder,
filter, sort or focus them.
**Who opens it and why:** A user has picked a list from `TodoListsView` and wants to actually do the tasks in
it.

**What the user can do**
- Add an item (activity + role/category, priority, due date/time, optional repeat, suggested duration, a
  "reward when done" leisure pairing, and a note).
- Check an item done (single checkbox, or a `doneCount`/`totalCount` stepper for multi-count items), expand and
  tick individual steps, edit, delete, move to another list, log time (manual or a running timer), or add it to
  the day planner — all from a per-row overflow menu, plus a promoted one-tap "start a timer now" stopwatch
  button on the row itself.
- Mark up to 3 items as today's "focus" (a star toggle) and switch on Focus mode to hide everything else; the
  cap is enforced with a plain-language message, not a silently ignored click.
- Filter by priority and by due state (overdue / due today), hide completed items, and cycle sort between
  custom (drag) order, priority and due date. Reordering (drag-and-drop) is its own mode, mutually exclusive
  with focus mode and disabled while any non-custom sort is active.
- Click an unscheduled item's "Not scheduled" chip (or the header "N tasks have no time slot" nudge's SCHEDULE
  button) to jump straight into the day-planner task dialog for that item — the buried "add to planner" affordance
  is promoted to a first-class, always-visible control for anything without a due date.
- Undo the last destructive/logging action (add, edit, delete, done-toggle, log-time) via a dedicated undo button
  that shows how many actions are queued and what the next undo would revert.
- Bulk-uncheck all items in the list (via `BaseToDoList`'s `uncheckAll` action, surfaced through the list
  component).
- Reschedule overdue items in bulk, or step through them one at a time, once a configured threshold of overdue
  items is reached.

**What the user can see, and the question it answers**
- Header progress bar + "`done / total`" — answers "how much of this list is done?" (raw, computed client-side
  from the *unfiltered* `items` ref so filtering never distorts it).
- Per-item thin progress bar along the row's bottom edge, for items with steps or a `doneCount`/`totalCount` —
  answers "how far into this specific task am I?" (derived client-side from local, optimistically-updated refs).
- A calibration line in the header ("your estimates run about `N`x") once ≥5 comparable items exist, and a
  per-item "~30m / usually 50m" chip on items that have both a `suggestedTime` and prior logged history for the
  same activity — answers "do I estimate my own tasks accurately?" (derived: ratio of actual-logged-time to
  suggested-time, averaged per item; backed by a real endpoint,
  `POST /api/activity-history/aggregate-by-activity`).
- A "daily recap" card ("1 thing finished today — 0m logged", naming the item) — answers "what did I actually
  finish today?"
- An "N tasks have no time slot" banner and per-item "Not scheduled" chips — answer "which of my tasks have no
  implementation intention yet?"
- An "N tasks are overdue" banner (not observed with this seed — no overdue items existed) that would offer bulk
  reschedule or one-by-one review.

**Depends on:** the leisure backlog module (for the "reward when done" pairing chip and snackbar, read via
`useLeisurePairing`), the activityHistory module (for the calibration aggregate, read via
`useEstimateCalibration`, cross-module through `api/`+`dto/` only), the day planner module (for the "add to
planner" dialog and store), and the `askBeforeDelete` preference (a list delete always confirms regardless, per
`TodoListsView.vue`'s comment — the preference has no vote when the delete cascades).

## Entity lifecycle
A `TodoListEntity` (a named list) is created and deleted from `TodoListsView`; a `TodoListItemEntity` is created,
edited, moved between lists, and deleted from `TodoListView`. Deleting a list cascades to every item inside it —
the confirmation dialog states the item count. Deleting an item is a leaf delete (no further cascade). Moving an
item between lists does not delete/recreate it; the item id is preserved across the move (confirmed via
`moveToList` in `TodoListView.vue`).

## Data this unit captures but does not spend
- `TodoListItemEntity.suggestedTime` is written on create/edit but only read back for calibration display,
  quick-start-timer prefill, and the day-planner handoff duration — it is not otherwise displayed as a discrete
  field anywhere in this unit's own views.
- The "reward when done" leisure pairing (`pairedLeisureActivityId`) is set at item-creation time but only
  surfaces later as a chip and a completion-time snackbar — there is no view in this unit that lists "items with
  a pending reward" as its own surface.

**Correction (mutation pass, 2026-09-15):** the inventory pass's claim that `TodoListItemEntity.note` is "only
exposed as a truncated tooltip on hover, never shown in full inline" does not hold — creating an item with a
note and reloading `/todo-list/:id` shows the note rendered inline under the item title (confirmed via
screenshot, `todo-list-id--mutation-item-done.png`). `note` is fully spent by this unit; it has been removed
from this list.
