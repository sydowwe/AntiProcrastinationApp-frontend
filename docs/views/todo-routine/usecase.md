# todo-routine — use cases

## What this unit is for

Tracks obligations you do *repeatedly* rather than once — a routine item has a recurrence period (daily,
weekly, monthly, yearly, or a custom period defined in Settings) instead of a due date, and its main payoff is
a visible streak: consecutive periods completed at or above a configurable threshold. The unit is the app's
answer to habit formation, separate from the one-off "mean to do" items in `todoList`'s normal list (see
`docs/views/glossary.md`, "The three list vocabularies").

## Where it sits

Reached from the sidebar's "To-do list" group ("Routine" entry, per `docs/views/_shell/inventory.md`). A user
typically arrives here after setting up routines to check off today's/this-period's obligations, glance at
streaks, or (rarely) tune the recurrence periods themselves on the settings sub-page. From here a routine
item can hand off to `dayPlanner` (schedule it for a specific time slot) or `activityTracking`'s running-timer
machinery (log time against it). Both hand-offs mirror the normal list's equivalents documented in
`docs/views/todo-lists/usecase.md`.

## Views

### RoutineToDoListView (`/routine-todo-list`)
**Purpose:** Check off routine obligations, grouped by recurrence period, and see streak/consistency feedback.
**Who opens it and why:** Daily use — "what am I supposed to do today/this week/this month/this year", plus
periodic streak-freeze and weekly-review nudges.

**What the user can do**
- Toggle a routine item done/not-done (single-count items), or increment a step/multi-count item toward its
  target
- Filter which recurrence-period columns are visible via the "Groups" multi-select
- Reorder items within a period via drag-and-drop ("Reorder" mode)
- Create, edit, or delete a routine item; each carries an activity, an optional recurrence detail
  (day-of-week / day-of-month), an optional suggested duration, a note and steps
- Spend a "streak freeze" to retroactively cover a missed period without breaking the streak (R1)
- Log time manually or quick-start a 10-minute timer against an item
- Add an item to the day planner
- Open a per-period history dialog showing a completion heatmap
- Act on a weekly "fresh-start" review card once per week, per routine: keep, reduce frequency, or pause (R2)
- Undo the last reorder/create/edit/delete (not done-toggles — see findings)

**What the user can see, and the question it answers**
- Per-period mini timeline (top of each card) — answers "how much of the current period is left"
- Streak flame + count, best-streak tooltip — answers "how long is my current run, and is it a personal best"
- Consistency percentage, trend arrow — answers "am I doing this more or less often than before"
- Group progress ("N / M" + thin bar) and a second, differently-computed progress bar ("~time left" + %) —
  both answer "how much of this period's items are done", inconsistently (see findings)
- Completion heatmap (compact, per card) — answers "which recent periods did I complete"
- "N skips left" chip — answers "how many streak-freezes do I have this budget cycle"

**Depends on:** `askBeforeDelete` / `firstDayOfWeek` user preferences (via `core/user/composable`), the
account's routine-review dismissal state (server-side, `routine/settings`), and whichever recurrence periods
exist (managed on the settings sub-page).

### RoutineSettingsView (`/routine-settings`)
**Purpose:** Manage the recurrence periods (Daily/Weekly/Monthly/Yearly plus any custom ones) that
`RoutineToDoListView` groups items by — length, streak threshold, grace days, reset anchor, colour, visibility.
**Who opens it and why:** Infrequent — setting up a new recurrence cadence, or tuning how forgiving an
existing one's streak rule is.

**What the user can do**
- Add, edit, or delete a time period
- Toggle a period's visibility (hidden periods are excluded from the group selector on the main view)
- See a "personal bests" summary card per period once it has accumulated history

**What the user can see, and the question it answers**
- Time-period table (name, length, reset anchor, streak threshold, grace days, hidden) — answers "what
  recurrence periods exist and how strict is each one's streak rule"
- Personal-bests panel — answers "what's my best run and current consistency, per period" (only once a period
  has at least one elapsed cycle — see findings)

**Depends on:** nothing from another module. Entirely self-contained CRUD over `RoutineTimePeriodEntity`.

## Entity lifecycle

A routine item (`RoutineTodoListItemEntity`) is created pointing at an Activity and a `RoutineTimePeriodEntity`;
editing can move it to a different period (a cross-group operation, distinct from the normal list's
cross-*list* drag). Deleting a routine item removes it outright (no cascade — it owns no children). A
`RoutineTimePeriodEntity` deleted on the settings page presumably takes its routine items with it, but this
pass could not confirm what happens to them, because the delete-confirmation dialog gives no indication of
cascade impact at all (see findings) and deleting a real period was avoided to keep the seed intact for the
rest of the pass.

## Data this unit captures but does not spend

- `RoutineTodoListItemEntity.suggestedDays` / `suggestedDayOfMonth` — rendered as small chips on the item
  (post-chips slot) but nothing schedules or reminds against them within this unit; presumably consumed by a
  reminder job outside this pass's scope.
- `RoutineTimePeriodEntity.historyDepth` — configurable on the settings form ("how many past periods to show
  in the completion heatmap") but this pass could not observe its effect, since no period had any history to
  truncate.
