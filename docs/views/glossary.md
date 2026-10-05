# Glossary

> Compiled 2026-09-10 from the DTOs at commit `acd7db0d`. Where a term's meaning is enforced by a class, the
> class is named — the code is the authority and this file is the map.

Nine modules share a small vocabulary of overlapping nouns: *activity*, *task*, *item*, *profile*, *template*,
*anchor*. They are not synonyms, and several of them are the same database row seen from a different module.
This file exists so a session working in one module does not re-derive the shape of the others.

---

## The spine: everything is about an Activity

**`Activity`** (`core/activity/dto/response/Activity.ts`) is the one entity the whole app is built around. It
is *a thing you can spend time on* — nothing more. It carries a name, an optional description, a `Role`, an
optional `Category`, and `isUnavoidable`.

Every other module's central entity **points at an Activity** rather than duplicating it:

| Module | Entity | What it adds to the Activity |
| --- | --- | --- |
| activityHistory | `ActivityHistory` | a `startTimestamp` and a `length` — time you *did* spend |
| dayPlanner | `PlannerTask` | a start/end time on a specific day, plus status — time you *intend* to spend |
| todoList | `TodoListItemEntity` | done state, priority, due date — something you *mean* to do |
| todoList | `RoutineTodoListItemEntity` | a time period and a streak — something you do *repeatedly* |
| leisure | `ActivityBacklogProfile` | energy, effort, location, weather, cost, duration |
| leisure | `ActivityBucketListProfile` | experience type, comfort-zone step, travel, financial goal |
| leisure | `ActivityProjectProfile` | difficulty, area, estimated hours, materials, readiness |
| leisure | `MemoryAnchor` | a month, a rating, a highlight note — a thing you *did* and want to remember |

**Read that table before filing any "these two look the same" finding.** A to-do item and a planner task are
not duplicates of each other; they are an intention and a schedule for the same activity, and `PlannerTask`
carries `todoListItemId` precisely so the two can be linked.

### Activity lifecycle

- **Archived** (`isArchived`) — removed from the pickers only. Every history record, to-do item and planner
  task keeps pointing at it and keeps rendering its name. Archiving is not deleting.
- **`usageCount` / `canDelete`** — how many rows across every referencing entity point at this activity, and
  whether a hard delete would be refused. Both are **lifecycle-only** fields: they are populated for the
  settings table and default to `0` / `false` on the nested `activity` payloads carried by tasks, items and
  history rows. A nested activity therefore always looks non-deletable, deliberately.

---

## Classifying an activity

**`Role`** — the broad life area an activity belongs to (`core/activity/dto/response/Role.ts`). Carries a
colour, an icon, and an optional `systemKey` (`SystemActivityRole`) marking roles the app itself relies on.
Roles are the primary axis of every history chart.

**`Category`** — a finer, optional grouping inside a role. An activity has exactly one role and at most one
category.

Both are lookup tables managed on `/activity-settings`, which is why that one view has three tabs.

---

## The three "list" vocabularies — the most confusable corner

`ToDoListKind` has exactly two values, `ROUTINE` and `NORMAL`, and they behave differently enough to be
separate screens and separate documentation units.

| Term | Class | What it is |
| --- | --- | --- |
| **To-do list** | `TodoListEntity` | A named, icon-bearing container of items. Multiple exist; `/todo-list` lists them, `/todo-list/:id` opens one. |
| **To-do list category** | `TodoListCategoryEntity` | A grouping *of lists*, not of items. The left pane on `/todo-list`. |
| **To-do item** | `TodoListItemEntity` | One thing to do, in one list. Has a due date, a priority, optional steps. |
| **Routine item** | `RoutineTodoListItemEntity` | A *recurring* obligation. No due date; instead a `timePeriod`, a `streak`, `bestStreak` and `lastCompletedAt`. Lives on `/routine-todo-list`, never in a normal list. |
| **Routine time period** | `RoutineTimePeriodEntity` | The bucket a routine item recurs in (the grouping on the routine screen). |
| **Step** | `TodoListItemStepEntity` | A sub-item of either kind of item. Not a separate list. |

Both item kinds implement `IBaseToDoListItem`, which is why components are shared between the two screens —
but a routine item has a streak and no due date, and a normal item is the reverse. **Do not describe them
interchangeably.**

**Multi-count items:** `doneCount` / `totalCount` with `isMultipleCount` (`totalCount` set and ≠ 1). An item
can be "3 of 5 done" rather than a plain checkbox.

**`suggestedTime`** — an *estimate* of how long the item takes. Compared against real `ActivityHistory` to
produce the estimate-vs-actual calibration surfaces. Distinct from `dueTime`, which is a deadline.

---

## Planner vocabulary

| Term | Class | What it is |
| --- | --- | --- |
| **Planner task** | `PlannerTask` | An activity scheduled between a `startTime` and `endTime` on one day. Carries a `PlannerTaskStatus`, optional `actualStartTime`/`actualEndTime` (plan vs actual), and `skipReason`. |
| **Day plan** | `DayPlan` | One day's set of planner tasks — what `/day-planner/:date` renders. |
| **Calendar** | `Calendar` / `CalendarTaskSummary` | The month view at `/day-planner`, summarised per day rather than per task. |
| **Template** | `TaskPlannerDayTemplate` | A reusable *shape of a day*: a named set of template tasks with default wake/bed times, `scheduledDays`, a `suggestedForDayType`, plus `isPinned` and `usageCount`. |
| **Template task** | `TemplatePlannerTask` | A task inside a template. Has times but no date — that is the whole difference from a `PlannerTask`. |
| **Repeating task** | `RepeatingPlannerTask` | A planner task with a `RecurrenceType`. Not the same as a routine to-do item: this schedules a time slot, that tracks a streak. |
| **Background task** | `isBackground` on `PlannerTask` | A task that spans time without blocking it, so other tasks can sit inside it (`isDuringBackgroundTask`). |
| **Streak** | `PlannerStreak` | Consecutive days planned — the planner's own streak, unrelated to a routine item's `streak`. |

**Applying a template** writes template tasks into a real day, which is why
`ApplyTemplateToTaskPlannerRequest` carries an `ApplyTemplateConflictResolution`. Each applied `PlannerTask`
records `sourceTemplateTaskId`, the template line it came from, so the origin survives (since OP15).
`isFromTemplate` is derived from it on the client. The server never sends it.

---

## Leisure vocabulary

The four leisure tables are **four profiles of the same Activity**, not four kinds of thing. Each has
`activityId` as its identity — `get id() { return this.activityId }` — so an activity has *at most one* backlog
profile, one bucket-list profile and one project profile, and they can coexist on the same activity.

| Term | What it means |
| --- | --- |
| **Backlog profile** | "Something I could do." The richest vocabulary in the app: `energyLevel`, `effortType`, `locationType`, `weatherDependency`, `expectedCostTier`, `durationMinutes`, participant range, `isOneTime`. This is what `/leisure/pick` spends. |
| **Bucket-list profile** | "Something I want to do once." `experienceType`, `comfortZoneStep`, `requiresTravel`, `financialGoal`, `inspirationSource`. |
| **Project profile** | "Something I'm building." `difficultyLevel`, `projectArea`, `estimatedHours`, `isMessy`, `materialsNeeded`, `requiredTools`, `readinessStatus`. |
| **Memory anchor** | "Something I did and want to remember." A month/year (not a date), a `rating`, a `highlightNote`. |

**Anchoring** is the loop that connects them. `MemoryAnchor` carries `hasBacklog`, `backlogIsOneTime` and
`hasBucketList`; the backlog and bucket-list profiles carry `isAnchored` and `memoryAnchorId`. So the data
model treats an anchor as the **completion of a one-time experience**. Note `isAnchored` is `boolean | null`,
where `null` means the API does not carry the field yet — absence of a value is not "not anchored".

**`ActivityInfo`** is a slimmed-down activity payload used by leisure profiles, rather than the full
`Activity`. Do not expect lifecycle fields on it.

---

## Tracking vocabulary — the other meaning of "activity"

`activityTracking` is about **passively observed** computer and phone usage, not about `Activity` entities. Its
"activity" means an app, window or domain you were observed using. Nothing here writes an `ActivityHistory`.

| Term | What it means |
| --- | --- |
| **Source** | `ActivitySource` — web, desktop or Android. Each has its own dashboard; `/activity-tracking/unified` merges all three. |
| **Session** | A continuous observed span (`TimelineSessionDto` and its per-source variants). |
| **Mapping** | `TrackerDesktopMapping` / `TrackerAndroidMapping` — a rule assigning an observed process, app or domain to something meaningful. What the settings views (`:tableView`) manage. |
| **Distinct entries** | The raw observed processes/apps not yet mapped — the default `tableView` on both settings routes. |
| **Focus metrics** | `FocusBlock`, `FocusMetricsBaseline` — uninterrupted stretches, and the `BaselineOption` they are measured against. |

**Do not confuse:** tracking's *timeline* (observed sessions) with the planner's *timeline* (planned tasks), or
tracking's *pie chart* (time per app) with history's *pie chart* (time per role). They are different modules,
different data, different endpoints.

---

## History vocabulary

**`ActivityHistory`** is the record of time actually spent: an activity, a start timestamp, a length. It is
written by all four capture views (stopwatch, timer, pomodoro, manual entry) and read by the review views.

**`historyDashboard`** is **not a feature module** — it is a component library for `activityHistory`, and the
one sanctioned cross-module exception in `CLAUDE.md`. Its `HistoryGroupBy`, `HistoryGroupKey` and
`HistoryPieChartItem` types describe how history rows are aggregated for display, not what a history row is.

**`ActivityLoggedTimeAggregate`** — history summed per activity. This is what the to-do module reads to compute
estimate-vs-actual, and it is the only place `todoList` touches history.

---

## Preferences — three systems, not one

`CLAUDE.md` is authoritative here; this is the one-line version, because getting it wrong is a backend change
rather than a frontend refactor.

| System | Owns |
| --- | --- |
| **User preferences** (`PUT /user/preferences`) | Things that describe the **person** or cut across modules: theme, locale, timezone, `firstDayOfWeek`, `askBeforeDelete` |
| **Reminder preferences** (`/reminder-preference/*`) | Whether, when and how a **notification** reaches the user — quiet hours, per-kind muting, channel choice. Keyed by `(ownerModule, kind)` |
| **Module settings** (e.g. `UserPlannerSettings`, `UserRoutineSettings`) | Preferences meaningful **only inside** that module, and anything whose value is a foreign key to that module's entities |

---

## Framework terms that mean something specific here

| Term | Meaning in this repo |
| --- | --- |
| **`_common`** | The `vue_framework` git submodule. Other apps depend on it; edits there are a separate commit plus a pointer bump. |
| **Framework module** | `reminders`, `notifications`, `scheduler`, `user` — opt-in features that export route tables and never self-register. |
| **Reminder** vs **notification** | A *reminder* is the scheduled rule; a *notification* is the delivered message. Different modules. |
| **Scheduler job** vs **reminder** | A *job* is server-side recurring work (Quartz cron: 6–7 fields, seconds first, 1 = Sunday, UTC). A reminder is user-facing. |
| **`ensureLoaded()`** | A store method name that is a **convention**: `createAppPinia`'s plugin calls it once on store creation. Not an interface. |
| **`ValueTitleDto`** | The select-option shape. Was `TitleValueObject` before the alignment migration. |
| **`LookupResponse`** | A generic id/name lookup row, used for the leisure vocabularies (location type, weather dependency, cost tier). |

---

## Terms that appear in the UI but are not entities

- **Focus mode** — a to-do-list view state that caps how many items are shown. Not persisted as an entity.
- **Overdue renegotiation** — a banner offering to reschedule overdue items in bulk or one by one.
- **Temptation bundling** — pairing a to-do item with a leisure activity, via `pairedLeisureActivityId`.
- **Fresh-start review** — a periodic prompt to re-examine routine items.
- **Now and next** — the home/planner surface showing the current and upcoming planner task.
- **Plan vs actual** — comparing a planner task's scheduled times against `actualStartTime`/`actualEndTime`.
