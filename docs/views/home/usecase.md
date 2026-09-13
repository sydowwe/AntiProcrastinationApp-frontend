# home — use cases

## What this unit is for
The dashboard the app opens on: "what should I be doing right now," backed by today's plan, today's
routine obligations, today's upcoming to-dos, today's tracked activity, and one-tap entry points into
recording new activity. It is built to be left open in a pinned tab all day, not just glanced at once
per session.

## Where it sits
It is the landing route (`/`) — where a session starts after sign-in and where the sidebar's "Home"
entry always returns to. From here a user either acts in place (tick a task, start a timer, snooze,
skip) or is routed out to the owning module's full view: the day planner, the to-do list, the routine
list, activity history detail, or one of the four activity-recording views (pomodoro, timer,
stopwatch, manual entry). `home` is the app's composition layer: it imports live components from
`dayPlanner`, `todoList`, `activityHistory`/`historyDashboard` and renders them together, which is a
deliberate, documented exception to the module-boundary rule (`home.routes.ts`, `prompts/_done/home/README.md`
"Accepted, not a defect") — not something to flag as a violation.

## Views

### HomeView (`/`)
**Purpose:** Answer "what do I do right now," and surface today's plan, routine obligations, upcoming
to-dos and tracked time without navigating anywhere.
**Who opens it and why:** Every session start, and repeatedly through the day as a pinned tab —
CLAUDE.md's own framing for this page is "the tab is open all day."

**What the user can do**
- See the one task that matters right now (or next, or most recently missed) in the now bar, and
  start it, finish it, track time against it, extend it, snooze it or skip it — one action vocabulary,
  available identically from the now bar and from the day-planner widget's per-row menu.
- Open today's day plan as a list, see the day as a proportional strip, and tick any task done in
  place.
- See every routine (recurring) obligation grouped by time period (Daily/Weekly/Monthly/Yearly), with
  a per-group and an overall done/total count and a per-period streak, and tick items done in place.
- See upcoming and overdue to-do items sorted by due date, with an overdue/due-today/due-in indicator
  on each row (rendered by the shared `NormalTodoListItem`, not by `home` itself), and a done/total
  count.
- Toggle "hide done" independently on the routine list and the to-do list.
- See today's tracked activity as a per-activity pie chart with a total.
- Jump straight into recording activity: Pomodoro (primary), Timer, Stopwatch, or a manual entry.
- Use single-letter keyboard shortcuts (S start, F finish, T track, M move later, P open planner) that
  act on the focus task, suppressed while a text input has focus.
- Open any widget's full view via a per-card "open" button, and land on the same day/date the widget
  was showing.

**What the user can see, and the question it answers**
- Now bar (headline, kicker, countdown, progress bar) — answers "what should I be doing right now, and
  how am I doing against it"
- Day strip (proportional bar with an elapsed fill and a now-marker) — answers "how much of today's
  plan is behind me"
- Day planner list — answers "what is still ahead today, and when"
- Routine group progress bars and streak chips — answers "am I keeping up with my recurring
  obligations, and for how long"
- Activity pie chart + total — answers "where did today's tracked time actually go"
- To-do due-date indicators — answers "which of these is actually urgent"

**Depends on:** the user's configured timezone (`userTimeZone`, not the browser's — the plan, the
streak and every countdown resolve "today" in it), the locale (date formatting, pluralization of
routine period labels), and nothing from `askBeforeDelete`/`firstDayOfWeek` — this view has no delete
paths and no week-start-dependent surface.

## Entity lifecycle
`home` creates and destroys nothing of its own. It is a read/write **view** onto entities owned by
other modules:
- `PlannerTask` status is mutated in place (start/finish/skip/snooze/extend) through `dayPlanner`'s own
  API composable — no create, no delete.
- To-do and routine item `isDone` is toggled in place through `todoList`'s API composables.
- The day's `PlannerStreak` is read-only here — server-computed (see `PlannerStreak` in the glossary),
  not derived or cached client-side. The module's own history (`prompts/_done/home/H2-shared-state-lifecycle.md`)
  shows this used to be a client-side localStorage guess that drifted; that escalation appears to have
  been resolved upstream, since no `plannerStreakStore` or streak-related `localStorage` key exists in
  the module any more (confirmed empty via `localstorage-list` in this pass).
- Nothing here is soft-deleted, archived, or cascades to another entity.

## Data this unit captures but does not spend
None. Every value `home` reads is either rendered directly or feeds a derived display value (countdown,
progress percent, days-until-due); nothing is written here that no view reads back.
