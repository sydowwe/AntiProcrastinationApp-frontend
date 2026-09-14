# planner-day — use cases

## What this unit is for
Lets a user schedule specific `PlannerTask`s onto specific days, see the whole month at a glance, and reuse
recurring shapes of a day (`TaskPlannerDayTemplate`) instead of re-building the same schedule from scratch.
It answers three questions: what does my month look like, what am I doing right now today, and how did today's
plan compare to what I actually did.

## Where it sits
A user arrives here from the sidebar's "Task planner" group (`Day planner`, `Day planner - template`,
`Planner settings`), from a notification/reminder that names a task (via `PlannerTaskLinkView`'s bare-id
redirect), or from the calendar's own "Use Today" / apply-template flow on the template list (out of this
unit — see `planner-templates`). Applying a template writes real `PlannerTask` rows for a day; to-do items can
be linked to a planner task (`todoListItemId`) so a to-do and its scheduled slot stay in sync — see
`glossary.md`'s planner vocabulary table. From here a user's next stop is usually the day itself
(`/day-planner/:date`) to log actual start/end times as tasks are worked, or `/todo-list` if a task is linked
to a to-do item.

## Views

### PlannerCalendarView (`/day-planner`)
**Purpose:** month-at-a-glance view of every day's plan: task count, completion, day type, holidays, and a
day-vs-day comparison of planned vs. actual effort.
**Who opens it and why:** the sidebar's default "Day planner" entry — a user checking what's ahead this month,
bulk-editing several days at once (day type, applying a template, copying a day), or jumping into one specific
day.

**What the user can do**
- browse by month, or switch to a rolling range (from-start / to-end / centered) measured in days, weeks or
  months, via the "Mode" control
- filter the visible days to all week / workdays only / weekend only
- select one or more days and: change their day type in bulk, apply a template to all of them, or copy one
  day's tasks into all of them
- apply a template to one or more days directly from the calendar (separately from the bulk-select flow),
  previewing it before committing, with a start-time offset and a conflict-resolution choice
- edit a single day's details (wake/bed time or duration, label, day type, location, weather, notes) without
  leaving the month view
- click any day to jump to that day's full view (`/day-planner/:date`)

**What the user can see, and the question it answers**
- the month grid — answers "what's scheduled, and how much of it is done, on each day this month"
- per-day mini progress (N/M tasks, a completion %, colour-coded task chips) — answers "which days are
  light and which are packed"
- the holiday strip — answers "which days this month are public holidays" (names come from the backend,
  untranslated — see findings)
- the footer stats bar (tasks done this month, avg completion %, days planned out of days in view) — answers
  "how is this month going overall"
- the plan-vs-actual trend line — answers "across the days I've actually logged, how far off was my plan"

**Depends on:** `firstDayOfWeek` user preference (week start), the account's planner settings for a day's
default wake/bed time, `useDayPlannerSettingsStore`'s apply-template defaults (conflict resolution, preview-on
default) seeded on mount.

### DayPlannerView (`/day-planner/:date`)
**Purpose:** the actual schedule for one day — a time-grid of tasks a user can create, drag, resize, complete,
skip, or reschedule, plus a passive "what's now / what's next" readout and a plan-vs-actual summary once the
day is materially over.
**Who opens it and why:** clicking a day in the calendar, following a reminder/notification link through
`PlannerTaskLinkView`, or navigating directly to today (the default landing route when `/day-planner/:date`'s
`:date` is omitted).

**What the user can do**
- create a task by dragging on the empty grid, or via a dialog; edit, resize, move, delete it
- mark a task in-progress/complete/skipped, logging actual start/end time as it's worked
- multi-select tasks (via the same keyboard/pointer affordances as the calendar's bulk mode) and bulk-change
  status, skip, or reschedule them
- apply a day template to this day, previewing it first and choosing how conflicts with existing tasks resolve
- navigate to the previous/next day, or back to the calendar
- act on the overdue-tasks banner if this day has tasks whose window passed while still `NotStarted`

**What the user can see, and the question it answers**
- the time-grid with each task's block (colour, name, time range, status icon) — answers "what's on today"
- the now/next indicator — answers "what should I be doing right now, and what's after that" (rendered only
  when the viewed date is today and something is scheduled)
- the progress block (completed/total, a completion bar, planned/free/over-capacity minutes) — answers "how
  full is today, and how much of it is done"
- the plan-vs-actual block — answers "did today run long, start late, or not happen as planned" (rendered only
  once the day is materially finished; background and cancelled tasks are excluded from the arithmetic)
- the overdue-tasks banner — answers "what did I plan for earlier today that I never started"

**Depends on:** `useDayPlannerSettingsStore` (slot duration, defaults), `useCurrentTimeIndicator`/
`usePlannerNowNext` (today-only, live clock), `useTaskReminders` (this view does not itself notify — reminders
are a separate composable wired to user reminder settings).

### PlannerTaskLinkView (`/day-planner/task/:id`)
**Purpose:** a deep-link hop, not a screen a user browses to. Resolves a bare `PlannerTask` id (all a
notification or another module can carry) to the dated URL that can actually show it, then redirects.
**Who opens it and why:** clicking through from a reminder/notification that names a task but not its date.

**What the user can do**
- nothing directly — it is a redirect. On success it lands on `/day-planner/:date?focus=<taskId>`, which
  scrolls to and highlights that task once `DayPlannerView` has loaded its tasks.

**What the user can see, and the question it answers**
- a brief loading state while the task's date is resolved; an error state if the id does not resolve to a
  task the account can see (see findings for exact copy and status handling)

**Depends on:** nothing user-configurable — pure lookup-and-redirect.

### DayPlannerSettingsView (`/day-planner/settings`)
**Purpose:** the module's settings, split into tabs since a recent refactor (95c7bbf2): view defaults,
calendar-view defaults, repeating tasks, skip reasons, and planner reminders.
**Who opens it and why:** a user tuning default wake/bed time, slot granularity, which day types show in the
"days to show" filter by default, managing recurring tasks, or naming their own skip reasons.

**What the user can do**
- set default view options for the day grid (slot duration, start/end of day)
- set default options for the calendar view (mode, days-to-show)
- create/edit/delete repeating planner tasks (`RepeatingPlannerTask` — a time slot with a `RecurrenceType`,
  distinct from a routine to-do item's streak)
- manage the set of skip reasons offered when cancelling a task
- configure planner-specific reminder behaviour

**What the user can see, and the question it answers**
- each tab's current saved values — answers "what will a new day/calendar view start out looking like"

**Depends on:** nothing external; this is itself one of the three settings systems described in
`glossary.md` — module-local settings, not user preferences or reminder preferences (except the reminders tab,
which is a thin planner-specific layer over the reminder-preference system).

## Entity lifecycle
A `PlannerTask` is created directly on a day (drag or dialog) or written in bulk by applying a template. It is
edited in place (time, status, actual times) and deleted individually or via bulk multi-select. Deleting a
`Calendar` day's tasks does not delete the day itself — `Calendar`/`DayPlan` rows exist for every date
regardless of whether tasks are scheduled (the seed data shows `0/0 tasks` days throughout the month). A
`TaskPlannerDayTemplate` is a separate lifecycle documented in `planner-templates` (out of this unit); applying
one here only writes new `PlannerTask` rows and stamps `isFromTemplate`/`sourceTemplateTaskId` — the template
itself is untouched.

## Data this unit captures but does not spend
- `Calendar.location` / `Calendar.weather` / `Calendar.notes` — set in the "Edit Details" dialog, but no
  surface in this unit reads them back (no day-details summary, no month-view tooltip, no filter by
  location/weather).
- `PlannerTask.skipReason` — collected via the skip dialog, feeds the plan-vs-actual "never happened" bucket
  as a count only; the reason text itself is not surfaced anywhere in this unit.
