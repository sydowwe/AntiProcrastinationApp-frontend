# F4. Day-type periods: a design pass

- **Date:** 2026-10-04
- **Frontend:** `5944d9c8`. The working tree is dirty, but only in `activityTracking` and the `src/_common` pointer, none
  of it on the paths read here.
- **Backend:** `cde16f8`, clean.
- **Inputs read:** `_RULES.md`, the F4 prompt, `prompts/captured-data/README.md` and `C3-template-by-location.md`,
  `docs/opportunities.md` (OP5, OP18), `docs/notification-audit.md` (producers, N2–N4), `docs/data-map.md` and
  `docs/data-map/planner.md`, `docs/views/glossary.md`, `docs/feature-discovery/F2-half-built-backend.md` (Rejected
  and noticed items 5), and the owner's 2026-04-02 brainstorm (memory). Backend: `CLAUDE.md`, `docs/modules.md`, and the
  Planning and Routines `summary.md` / `domain-map.md`. The backend's `docs/architecture.md` is a stale copy from
  another solution (its own `CLAUDE.md` says so), so it was skipped.

## Method

I traced every field the brainstorm names (`label`, `dayType`, `holidayName`, `location`, `appliedTemplateId`) from the
entity, through every server reader, to every client surface. Every claim that something is missing comes from a
search, and the search is named where it matters. I then followed day type into the three places a "vacation" would
have to mean something: suggestions (both endpoints and the pattern view), routine streaks and freezes, and the
notification producers. I did not query the dev database, so whether real rows hold period-like labels is
`unverified`. There is one design finding that reshapes the prompt's question, so it comes first.

> **The premise is half true.** The prompt says a day's type is free text. It is not. `Calendar.DayType` is a
> five-member enum (`Workday`, `Weekend`, `Vacation`, `SickDay`, `Special`) with server rules attached. And the
> brainstorm's "workday variant" (HomeOffice / Office) is *already* modelled twice: by the `Location` enum on the day
> and by the identity of the applied template. The only free text is `Calendar.Label`, and nobody agrees on what it is
> for. So "turn the label into a lookup" would add a third model for something already modelled twice. The part of the
> brainstorm that is genuinely missing is the **named, dated span**: "Barcelona, 12–20 Aug".

---

## Current state

### The day row

`AdhdTimeOrganizer.Planning/domain/model/entity/Calendar.cs`. There is one row per (user, date), and the unique index
is `CalendarConfiguration.cs:27`.

| Field | Shape | Written by | Read by (server) | Read by (client) |
|---|---|---|---|---|
| `DayType` | enum, `Core/domain/model/enum/DayType.cs` (5 members) | `CalendarDayFactory.cs:36,47-48` gives the natural `Workday`/`Weekend`. Users write it through `PUT /calendar/{id}` (`CalendarRequest.cs:10,23`) and `PATCH /calendar/day-type/batch` (`BatchUpdateDayTypeCalendarEndpoint.cs:33,65`) | `CalendarDayTypeRule.cs:19-26` (no Workday on a weekend, no Weekend on a weekday). Both suggestion endpoints (below). `mv_template_suggestion_pattern.sql:14-29`. `ICalendarDayLookup` → History's calendar dashboard (`CalendarActivityEndpoint.cs:95`) | `DayTypeChip` in the side panel. The coloured badge and border in the month cell (`_common/component/calendar/CalendarDayCellHeader.vue:5,14-21`). The Details dialog. The bulk bar |
| `Label` | `string?`, max 100 (`CalendarConfiguration.cs:22`) | The Details dialog only (`CalendarRequest.cs:11,24`) | **Echo only.** It is projected (`CalendarResponse.cs:61`, `CalendarDayLookup.cs:21`, `CalendarActivityEndpoint.cs:97`) but no query filters, groups or matches on it. Search: `\.Label\b` across all `*.cs` outside Tracking/ActivityProfiles finds only projections, the validator, seeders and tests | Month-cell header in **both** calendars (`CalendarDayCellHeader.vue:23-28`, rendered unconditionally by `CalendarGrid.vue:83`). The side-panel heading (`DayDetailsPanel.vue:14`) |
| `HolidayKey` / `HolidayName` | `init`-only strings | `CalendarDayFactory.cs:40-41` from `HolidayCalendar` (Slovak only, B19) | Nothing branches on them. **A holiday does not change the day type**: a holiday on a Tuesday is a `Workday` (`CalendarDayFactory.cs:37-39`) | Holiday strip, gift badge |
| `Location` | enum `Home`/`Office`/`Travel` (`Core/domain/model/enum/Location.cs`) | The Details dialog only | **Nothing.** C3 and OP18 propose matching it against `TaskPlannerDayTemplate.SuggestedLocation`. F2 confirmed there is no server comparison | Month cell and side panel (data-map planner.md:139) |
| `AppliedTemplateId` / `Name` | `long?` with **no FK** (model snapshot: a plain `bigint` with no relationship), and a name snapshot | `PlannerTemplateApplier` stamp | `mv_template_suggestion_pattern.sql:3,8` is the whole of the template-suggestion history | Name only (`CalendarDayCellContent.vue:52-61`, `DayTemplatePicker.vue:177-187`). The id is unread |

**Nobody agrees what `Label` is for.** Three sources give three readings:

- **Backend comment, `Calendar.cs:26`:** `// "HomeOffice", "Office", custom labels`. The dev seeder writes exactly that
  (`PlannerTaskSeeder.cs:91`: `"HomeOffice"` on even days, `"Office"` on odd). That is a workday variant, which is
  `Location`'s job.
- **Frontend placeholder, `dayPlanner.en.ts:112`:** "e.g., Project Deadline, Birthday...". That is an event marker.
- **Brainstorm:** a period name ("Barcelona vacation").

The template entity has the same overlap. `TaskPlannerDayTemplate.cs:9` comments the name as
`"HomeOffice", "Office", "Weekend", "Sick Day"`, and the e2e fixture ships three templates whose `SuggestedLocation`
is Home / Office / Home (`E2eFixtureSeeder.cs:1083,1099,1115`). **The template is the workday variant.** The day records
which variant it was through `AppliedTemplateName`.

### How templates are suggested today (B27)

`GetSuggestionsTaskPlannerDayTemplateEndpoint.cs`:

1. **History.** Patterns from `mv_template_suggestion_pattern` matching this weekday (type 0) or this day type (type 1),
   **ordered by `OccurrenceCount` descending** (`:79-95`). The view needs at least 2 applications (`.sql:10,29`) and
   hard-codes the five enum names in a `CASE` (`.sql:17-24`).
2. **Metadata.** Templates whose `ScheduledDays` contain the weekday (type 2) or whose `SuggestedForDayType` equals the
   day type (type 3). Weekday-and-type matches come first, then `UsageCount` (`:100-108`).

**The weekday outranks the day type, even on a vacation day.** Take a user who has applied "Office" on twenty Mondays and
"Beach" on three Vacation days. On a Monday they marked Vacation, "Office" comes first: 20 > 3 at `:80`. Without
history, it is the same story. An "Office" template scheduled for Mondays beats a "Beach" template whose
`SuggestedForDayType = Vacation` once usage breaks the tie (`:106-107`).

The repeating-task twin has the same blind spot. `GetSuggestionsRepeatingPlannerTaskEndpoint.cs:124-127,148-151`
matches its planner-pattern and history-pattern tiers on **weekday and day-of-month only**. So a vacation Monday is
offered the workday Monday's standup, commute and focus block from history. Tier 1 (user-set recurrences, `:82-90`) is
fine: a recurrence the user scoped with `RecurrenceType.DayType` already respects the day.

### How this approaches C3 / OP18 / B27

- **B27** (shipped) suggests by weekday and day type. Location is out of scope.
- **C3** (`prompts/captured-data/C3-template-by-location.md`, not built: there is no `B*` file for it in
  `prompts/captured-data/backend/`) adds a location-match pattern type. Its option (b) makes applying a template
  stamp its `SuggestedLocation` onto a day that has none, so the field earns its keep from day one.
- **OP18** is the same idea, as a client-side mark.

**This design leaves workday variants to `Location`, C3 and the template, and adds nothing competing.** A period may
*feed* that path: a trip can carry `Location = Travel` onto its days. It does not replace it.

### Routines: what a vacation does to a streak today

- **Scoring** (`Routines/domain/service/RoutineResetService.cs:219-275`). At each boundary a period's
  `CompletedCount / TotalCount` is compared against `StreakThreshold`. The result is `Extended`, `OnGrace` (when
  `StreakGraceDays > 0`) or `Broken`. Only an item-less cycle is `NotEvaluated` (`:226-227`).
- **Item streaks** are settled in `OpenNewCycle` (`:253-255`). An undone item's own streak zeroes, and there is no freeze
  at item level.
- **Freezes** are spent by hand on one missed cycle each (`RoutineStreakFreezeService.Apply`, `:77-112`). The budget is
  `DefaultFreezeBudget = 2` per calendar month (`:23,33-37`), capped at `MaxFreezeBudget = 10` (`:30`).

**So a two-week vacation breaks every daily routine.** It produces fourteen missed cycles against a budget of 2 (10 at
most), and every item streak zeroes regardless. A weekly routine survives one missed week only if the user remembers to
open the screen and spend a freeze, which they won't, because they were on vacation. Routines never reads `DayType`.
The only reader of day metadata in the slice is the suggested-today digest, which reads `WakeUpTime` through Core's
`ICalendarDayLookup` (`RoutineSuggestedTodayJobHandler.cs:43,149`). That seam already carries `DayType`
(`Core/application/seam/ICalendarDayLookup.cs:25`), so **no new seam is needed** for Routines to learn that a day is
away.

The planner's own streak needs nothing. An unplanned day neither breaks nor extends it (Planning domain-map, *Day-plan
completion streak*), so a vacation with no plan is already neutral.

### Notifications: what fires on a vacation day

Quiet hours are a single daily wall-clock window per user (`QuietHoursReader.cs`: `StartMinute`/`EndMinute`). There is
no date-range concept anywhere in the Notifications module. These producers ignore the day type:

- **P4** (ending soon) and **P5** (grace expiring). Both come from job J2 at 09:00 UTC, which reads no calendar (search:
  `ICalendarDayLookup` appears in `RoutineSuggestedTodayJobHandler.cs` only).
- **P6** (the suggested-today digest). It reads the day row, but only for `WakeUpTime`.
- **P1** (period-ended summary), which would announce the vacation's broken streaks.
- The proposed N2 (to-dos due) and N4 ("your day isn't planned yet") would do the same.

### The client

- **Bulk day type** acts only on loaded days. `PlannerCalendarView.vue:452-458` filters `calendarDays` (the visible
  month) by the selection, so a vacation crossing a month boundary takes two operations.
- **The Details dialog** offers the natural type plus `Vacation` / `SickDay` / `Special` (`CalendarDetailsDialog.vue:104-118`).
- **Home** shows none of the day's context (OP5, unbuilt; no `dayType`/`label` reference under `src/core/home`).

---

## Day type vs period

**Two concepts. Keep them apart.**

| | Day type | Period |
|---|---|---|
| Question it answers | "What kind of day is this?" | "Which stretch of my life does this day belong to?" |
| Cardinality | Exactly one per day, always present | Zero or one per day, most days have none |
| Shape | Categorical, from a small fixed set | A named, dated range the user creates |
| Has behaviour | **Yes.** `CalendarDayTypeRule`, both suggestion endpoints, the pattern view's `CASE`, and (proposed) routine excusal and nudge silencing | Only through the day type it puts on its days, plus its name, template and location |
| Lifetime | Permanent, one value per date | Created, resized, deleted |
| Recurs? | Implicitly: every Saturday is a Weekend | Rarely, and never on fixed dates ("skiing, some week in February") |

Merging them fails in both directions:

- **A period as a day type** ("Barcelona vacation" as a lookup row every day points at) turns each trip into a new
  category. Every rule that asks "is this day a vacation?" then needs a second lookup ("which kind is this row?"), so
  the enum comes back anyway, one join further away.
- **A day type as a period** ("Office" as a lookup row) has no dates, no name the user chose for this occasion, and no
  end. It is a category wearing a period's clothes.

They connect in one place: **a period imposes its kind on its days.** Barcelona makes 12–20 Aug `Vacation`. Everything
that already reads `DayType` then works without knowing periods exist. That is the core of the proposed model.

**Should day type itself become a user lookup table?** No. Its members carry rules on both ends of the stack, and a
user-defined "Gym day" type would carry none. The custom need is already covered: `Special` plus the label for one-off
days, `Location` for where you work, and the template for the shape of the day. See *Rejected*.

---

## Proposed model

### Working name: not "period"

"Period" already belongs to Routines (`RoutineTimePeriod`, `RoutinePeriodCompletion`, glossary lines 69–70). A third
"period" in the planner would be a glossary entry nobody reads. **Working name: `TimeAway`** (UI: *Time away*). The
v1 kinds are `Vacation` and `SickDay`, and both mean "away". The final name is an open question.

### Entities

```
User 1──* TimeAway            (Planning slice, schema `planning`, table `time_away`)
TimeAway 1──* Calendar        (via new Calendar.TimeAwayId, nullable, ON DELETE SET NULL)
TimeAway *──1 TaskPlannerDayTemplate   (optional, ON DELETE SET NULL)
```

`TimeAway : BaseEntityWithUser` (covered by the host's global user filter):

| Field | Type | Notes |
|---|---|---|
| `Name` | `string`, ≤ 100 | "Barcelona", "Flu". Required, and free to repeat across years (the "Skiing" lineage, below) |
| `Kind` | `DayType`, restricted to `Vacation` / `SickDay` | Reuses the enum rather than inventing one, so stamping is a plain assignment. A validator rejects the other three |
| `StartDate`, `EndDate` | `DateOnly`, inclusive | `EndDate ≥ StartDate`. Length ≤ `PlannerBatchLimits.MaxCalendarIds` (366) |
| `TemplateId` | `long?` → `TaskPlannerDayTemplate` | Optional. Drives suggestions inside the stretch (*Server logic*) |
| `Location` | `Location?` | Optional, `Travel` for a trip. Stamped onto days whose location is null, which feeds C3 |
| `Notes` | `string?`, ≤ 1000 | |

Index `(user_id, start_date)`. There is no unique index, because overlap is enforced by a rule (below).

**Why a FK on the day as well as a date range on the stretch?** The range is the source of truth for the user. The FK
makes the stamp **reversible precisely**. Deleting or shrinking a stretch un-stamps exactly the days it stamped, and
never a day the user typed `Vacation` onto by hand. The FK is also what the brainstorm asked for ("all days of
Barcelona" is one indexed predicate), and it lets the existing day reads return the stretch's name with one join and no
second request.

### Cardinality and overlap

- **One stretch per day. Stretches may not overlap** (400 on create or resize). Adjacent stretches are fine.
- **A sick day inside a vacation is a day override, not a nested stretch.** The user sets that one day's `DayType` to
  `SickDay`. It keeps its `TimeAwayId`, so it still belongs to Barcelona. A single FK only works because overlap is
  forbidden, and the override covers the one real nesting case.

### Ownership

Per user, like every other planner entity. Applying a stretch's template checks `TemplateId` ownership the way
`UpdatePlannerSettingsEndpoint` checks `DefaultApplyTemplateId`. The entity must be added to the GDPR export and
deletion, or `UserDataExportAndDeletionTests` fails (Planning summary, *Extension playbook*). That failure is the test
working.

### What happens to the existing free-text labels

**Leave them alone, and keep the field.** The label is not a stretch name. A day in Barcelona can carry the label
"Flight 07:40". Migrating labels into stretches would guess at intent across three incompatible readings, and the
frontend's own placeholder says labels are event markers. Two things do change:

- The backend comment (`Calendar.cs:26`) and the dev seeder (`PlannerTaskSeeder.cs:91`) stop modelling HomeOffice/Office
  as a label. That is `Location`. This is a small backend hygiene fix and changes no data.
- An **optional, one-off, owner-run** conversion: a run of consecutive `Vacation`/`SickDay` days sharing one non-null
  label becomes a stretch. This only makes sense if such runs exist in the owner's data, which is `unverified` (I did
  not query the dev DB). Do not ship it as a migration.

### Deleting a stretch

1. **Days whose `DayType` still equals the stretch's `Kind`** go back to their natural type through
   `CalendarDayFactory`'s rule (Weekend on Sat/Sun, else Workday). Days the user overrode keep their override.
2. **`TimeAwayId`** is set null. The app does this inside the delete endpoint, and the FK's `SET NULL` is the backstop.
3. **The stretch's stamped `Location`** goes back to null on days where it still equals the stretch's.
4. **Tasks are never touched.** Neither the tasks a template applied nor the tasks the user planned are deleted. Deleting
   a label for a stretch of days must not delete what the user did on them.
5. **Routine cycles already excused stay excused.** The streak is only ever raised (`RecomputeStreak`), and un-excusing
   history would break a streak retroactively. That is the one outcome this feature exists to prevent. This is an open
   question, with a recommendation.

A resize is a delete of the days that leave plus a stamp of the days that join, under the same two rules.

---

## Server logic

Everything below lives in **Planning**, except the excusal rule, which lives in **Routines**. That respects the slice
graph: Routines reads Planning's days only through Core's existing `ICalendarDayLookup`, and Planning tells Routines
about a change only through a Core event. The second is the pattern `RoutineTodoListIsDoneChangedEvent` uses in the other
direction.

### 1. "Away" is a day-type property, not a stretch property

A Core extension, `DayType.IsAway() => Vacation or SickDay`, sits beside the enum. It is the single definition, so
Planning and Routines cannot disagree. Rules 2–5 hang off the **day type**, not off `TimeAway`, so they work the same
whether a day became `Vacation` through a stretch, the bulk bar or the Details dialog. **This is what lets the lighter
alternative deliver most of the value** (see below).

### 2. Suggestions respect the day type

- **Template suggestions on an away day:** day-type entries (types 1 and 3) rank above weekday entries (types 0 and 2).
  Weekday entries are demoted, not dropped. Some users have one template for everything.
- **Inside a stretch with a `TemplateId`:** that template is suggested first, as a new pattern type 4 ("planned for
  Barcelona", label = the stretch name). An explicit choice beats history.
- **Repeating-task suggestions on an away day:** drop tiers 2 and 3, the planner and history patterns. Those are
  statistics, and workdays dominate them. Tier 1 (recurrences the user set) stays unchanged. A daily medication
  recurrence must still appear on vacation, and a user who wants a recurrence off on vacation already has
  `RecurrenceType.DayType` for it.
- **Holidays:** a holiday weekday is still a `Workday` (F2 noticed item 5). Whether to treat a holiday like a weekend for
  ranking is an open question. It is not part of "away".

### 3. Mark a range in one operation

`POST /time-away` takes `{name, kind, startDate, endDate, templateId?, location?, applyTemplate?}`. In one request it:

1. **Rejects overlaps** with the user's existing stretches.
2. **Provisions missing days** through `CalendarDayFactory`, the single definition of a new day. It does this in bulk
   rather than calling `CalendarProvisioner.EnsureForDateAsync` per date, which commits each time.
3. **Stamps each day.** It sets `TimeAwayId`. It sets `DayType = Kind` where the day's type is natural (Workday/Weekend)
   or already `Kind`, and leaves another override in place. It sets `Location` where it is null. Weekends inside the range
   are stamped too: a Saturday in Barcelona is away. `CalendarDayTypeRule` allows `Vacation`/`SickDay` on any day.
4. **Optionally applies the template** to each day through `PlannerTemplateApplier` in `Ignore` mode, so existing tasks
   win. It is opt-in, never the default.

Every day it touches is reported per day, like the existing batch endpoints. Unlike them, the stretch row and its stamp
are one transaction. A stretch whose days are half-stamped is a state no screen can explain. `PUT` resizes and `DELETE`
un-stamps, following the deletion rules above.

### 4. Away cycles do not break routine streaks (Routines)

The excusal rule:

- **When a cycle is excused.** A cycle is *excused* when at least half of its days (`PeriodStart`..`PeriodEnd`, which are
  already `DateOnly` on `RoutinePeriodCompletion.cs:19-20`) are away days for that user. For a daily routine that means
  the day itself is away. For a weekly one, four or more of its seven days. The threshold is an open question.
- **What an excused cycle records.** It writes its completion row with a new `IsExcused = true` and the outcome
  `StreakOutcome.Excused`. It **carries** the run the way a freeze does, without spending budget. The streak is held, not
  extended, and grace is not opened. `RecomputeStreak` treats `IsExcused` like `IsFrozen`. `Apply` refuses to freeze an
  excused row (`NotAMiss`). A CHECK forbids both being set. A cycle the user actually completed is scored normally:
  excusal never turns an `Extended` into anything else.
- **Item streaks.** Undone items in an excused cycle keep their streak. `OpenNewCycle` skips the zeroing.
- **Where the rule is applied.** It goes in all three reset sites: the J1 job, the grouped read and the bulk toggle.
  `TryReset` is static and pure, so each caller pre-reads the away dates for the cycles it is about to close through
  `ICalendarDayLookup.GetDaysAsync`, and passes them in as a set. That is one read per user per page in J1.
- **Retroactively.** Nobody pre-marks a sick day, and the ADHD-typical flow is to come back and then fix the calendar.
  So Planning publishes a Core event, `CalendarDayTypesChangedEvent(userId, dates)`, from `UpdateCalendarEndpoint`, the
  batch day-type endpoint and the stretch stamp. A Routines handler re-checks the closed completions covering those
  dates, sets `IsExcused` where the rule now holds, clears an open grace window owned by the newest one (as `Apply` does),
  and re-walks the streak. `RecomputeStreak` only raises, so a streak broken last Tuesday comes back. **Item streaks
  cannot come back retroactively**, because they have no history to re-derive from. That is a known, stated limit.
  Cross-slice handlers log and swallow, so this needs a behavioural test that asserts on rows (backend `CLAUDE.md`,
  *Silent failures*).
- **Time zones.** Routine boundaries are UTC (Routines domain-map, *Time*), while away days are user-local dates. Using
  the completion row's `DateOnly` span against local dates can be off by one day at the edges for zones far from UTC. The
  majority rule absorbs that. Say so in the code.

### 5. Away days are quiet days (Routines producers)

- **On a user-local away today:** J3 skips the P6 digest. J2 skips P4 and P5 (J2 has to resolve the user's today, as J3
  already does through `IUserTimeZoneReader`). P1 is not sent for an `Excused` outcome. The persisted Contracts payload
  enum `RoutineStreakOutcome` is **not** extended: an excused cycle produces no payload.
- **Reminders still fire** (P11, both standalone and task-attached). The user created each one explicitly, a birthday
  reminder must survive a vacation, and planning a task on a vacation day is itself a statement of intent.
- **Future sweeps** (N2, N4) must apply the same skip. Write it into their asks.
- **Not a framework change yet.** "Do not disturb until a date" is generic and could one day be a `Sydowwe.Notifications`
  capability, with this app registering a collaborator that says "today is away". Today every affected producer is a
  Routines job, so the check belongs there. Revisit when a second app wants it.

### 6. Overlap and edit rules, collected

| Rule | Enforced by |
|---|---|
| Stretches of one user do not overlap | App, on create and resize (400) |
| `Kind ∈ {Vacation, SickDay}` | Validator |
| `StartDate ≤ EndDate`, length ≤ 366 days | Validator, reusing `PlannerBatchLimits` |
| `TemplateId` belongs to the user | App, per write endpoint, as every other referenced id in the slice |
| A stamp never overwrites a non-natural day type of another kind, nor a non-null location | `TimeAwayStamper`, the single implementation behind create, resize and delete, in the `PlannerTemplateApplier` style |
| Un-stamping restores only what the stamp wrote | The same class, keyed on `TimeAwayId` + equality with `Kind`/`Location` |
| `IsFrozen` and `IsExcused` are exclusive | DB CHECK on `routine_period_completions` |

---

## What it unlocks

Ranked by value for an ADHD user. Each row says whether it needs the full model (F4-02, the stretch entity) or only
day-type behaviour (F4-01).

| # | What the user gets | Why it matters | Needs |
|---|---|---|---|
| 1 | **Coming back from a vacation or a sick week does not cost every routine streak.** Away cycles are excused automatically, item streaks hold, and marking the days afterwards still repairs the routine streak | The day after a holiday is the classic moment an ADHD user abandons an app: everything is red and broken, and starting again feels pointless. This removes the punishment for having a life, with no form and no decision | **Day type only** (F4-01) |
| 2 | **No streak or "items still open" nudges while away** | A nudge on vacation is one the user learns to ignore, and the habit of ignoring survives the vacation | Day type only |
| 3 | **Suggestions fit the day.** No "Office" template or standup suggestion on a beach day, and a "Vacation" template floats up | Removes a wrong default from the moment of starting the day | Day type only |
| 4 | **Mark "Barcelona, 12–20 Aug" once,** across a month boundary, from a date range | Today it is a bulk action per visible month, and the days stay nameless | **Stretch** (F4-02) |
| 5 | **The stretch's template is suggested first on its days**, and optionally applied to all of them | Turns a light "vacation day" shape into zero decisions per day | Stretch |
| 6 | **A quiet "time away" list:** past trips and sick spells with dates and length, and each one's activity calendar (History's existing `calendar-activity` endpoint already takes a range) | Useful memory and records, e.g. sick leave for an employer. Low frequency. Must never become a counter ("12 sick days this year") | Stretch for names. Day type alone can derive unnamed runs (see the lighter alternative) |
| 7 | **"Skiing again?"** Create next year's stretch from last year's: same name, template and location, with new dates | Rare, and saves maybe a minute a year | Stretch |
| 8 | **Re-entry day:** home on the first day after a stretch says "welcome back" and offers the usual template, instead of an overdue banner | A gentle restart. The banner after a holiday is a guilt pile | Derivable from day type ("yesterday away, today not"). A name makes the copy warmer |

Items 1–3 carry most of the value, and none of them needs the stretch entity.

---

## Lighter alternative

Here are three sizes, compared honestly.

**A. Day-type behaviour only (F4-01).** There is no new planner entity. Rules 1, 2, 4 and 5 above hang off the existing
enum. The user already has every input: the Details dialog and the bulk bar both set `Vacation`/`SickDay` today.
- *Delivers:* unlocks 1, 2, 3 and 8.
- *Costs:* one Routines migration (`is_excused` on a small table), a Core event, two suggestion endpoints and two job
  edits.
- *Misses:* names, one-operation ranges across months, the stretch's template, and the history list.

**B. A plus derived runs.** This adds one read, `GET /calendar/away-runs?from&until`, which groups consecutive away days
(bridging nothing; a weekend inside a vacation is itself `Vacation` if the user marked it) into runs and names each run
by the label its days share, if they share one. There is no schema change.
- *Delivers:* most of unlock 6, with "Barcelona" as a name if the user labelled the days.
- *Fragility:* one typo splits a run, renaming means relabelling every day, and there is no template and no lineage. It is
  a reasonable stepping stone if the owner is unsure whether named stretches are wanted, and it is cheap to throw away.

**C. The full stretch entity (F4-02).** Everything in *Proposed model*. It adds unlocks 4, 5, 6 and 7 to whatever A
delivers. Its cost is a new table, a column on `calendar`, a stamping class with three callers, five endpoints and a new
client surface.

**The brainstorm's literal version, D (day type as a user lookup table),** is rejected. It costs more than C, breaks the
rules attached to the enum, and the only new thing it offers, user-named categories, is covered by `Special` + label +
`Location` + template.

**Recommendation:** build **A** (F4-01) first. It is where the ADHD value is, and it changes no planner schema. Then
decide on **C** (F4-02) with the owner. If the answer is "maybe", ship **B**'s single read as the experiment. A is a
prerequisite for C anyway: a stretch that stamps `Vacation` is only worth having once `Vacation` means something.

---

## Rollout

Migrations are applied by hand, and the API runs under the owner's Rider debugger (memory: *API migrations are
manual*). Every backend step therefore ends with **"owner applies the migration and restarts the API"**. The frontend
must not ship a call to a route or a field that does not exist yet.

### F4-01 (day-type behaviour)

1. **Backend, no migration.**
   - `DayType.IsAway()` in Core.
   - Suggestion ranking in both Planning endpoints.
   - The J2/J3 skips.
   - Fix the `Calendar.cs:26` comment and the dev seeder's labels.

   All of this is additive and can deploy alone. Tests: an away Monday ranks the day-type template first and drops tier
   2/3 suggestions; J3 sends nothing on an away day.
2. **Backend, one migration.** `routine_period_completions.is_excused boolean NOT NULL DEFAULT false`, plus the CHECK
   against `is_frozen`.
   - **The table is the odd one out:** it is configured without `BaseEntityConfigure()`, has no `row_version` and has a
     plural name (Routines domain-map, `RoutinePeriodCompletionConfiguration`). Write the migration by hand-review, not
     blind `migrations add`.
   - Add `StreakOutcome.Excused`, the reset-site plumbing, the `RecomputeStreak`/`Apply` changes, the Core event, and the
     Routines handler.
   - **Owner applies the migration and restarts.**
   - Behavioural tests on rows: excusal at reset; retroactive excusal raises a broken streak; a frozen row is never
     excused; the event handler survives a publisher whose scope has ended.
3. **Frontend.**
   - `RoutineTimePeriodEntity` and its completion DTO parse `isExcused`.
   - `RoutineGroupHeatmap.vue` and `RoutineGroupHistoryBody.vue` render an excused cell (umbrella icon, neutral colour,
     never the miss colour).
   - `useStreakFreeze.ts` never offers a freeze on one.
   - SK/EN copy: "Away. Doesn't count against you".
   - Optional: a one-line hint under the Details dialog's day-type select ("Vacation and sick days pause your
     routines").

   There is no new input anywhere.

### F4-02 (the stretch entity), after F4-01

1. **Backend, one migration, additive.**
   - Table `planning.time_away`.
   - `calendar.time_away_id bigint NULL` with an FK to it (`SET NULL`) and an index. Adding a nullable column with no
     default is metadata-only in Postgres, even on the hot `calendar` table.
   - Pin the FK constraint name explicitly, as the slice does for its cross-slice FK, so it cannot drift with
     configuration order.
   - Add `TimeAway` to the GDPR export and deletion.
   - **Owner applies the migration and restarts.**
2. **Backend, logic.**
   - `TimeAwayStamper`.
   - CRUD and list endpoints, with the overlap rule.
   - Template pattern type 4.
   - `CalendarResponse` / `CalendarDaySummary` gain `TimeAwayId` + `TimeAwayName`. These are additive fields, so old
     clients ignore them.
   - Publish `CalendarDayTypesChangedEvent` from the stamper, which the F4-01 handler then consumes for free.
3. **Frontend.**
   - **Creating a stretch:** a *Mark time away* dialog. It opens from the bulk bar, with the date range prefilled from the
     selection, and from the Details dialog.
   - **Showing it:** a chip with the stretch's name in `CalendarDayCellHeader` (framework-generic: it takes an optional
     `spanName`, so no app domain leaks into `_common`) and in `DayDetailsPanel`.
   - **The list:** a *Time away* list, reachable from the planner calendar. **Not** from `/user/settings`, because a
     stretch is data, not a preference.
   - **Suggestions:** the new pattern sentence in `DayTemplatePicker.vue:274-282`, with the union in
     `TemplateSuggestionResponse.ts:12` widened to `| 4`.
   - **Copy:** SK/EN strings in `dayPlanner.{sk,en}.ts`.
4. **Optional, owner-run.** Convert existing labelled away-runs into stretches, if they exist.

---

## Open questions for the owner

1. **Automatic or offered?** Should away days excuse routine cycles automatically (recommended: it removes a decision,
   and the user is the only person the streak is for), or should the app offer it on return?
2. **The coverage rule for longer cycles.** Excuse a weekly or monthly cycle when at least half its days are away
   (recommended), only when all are, or when any are? A three-day flu inside a week is the case that decides it.
3. **Does `Special` count as away?** Recommended: no. `Special` is "unusual day", not "absent".
4. **Holiday weekdays:** treat them like weekends for suggestion ranking? Count them as away for streaks? (F2 noticed
   item 5.) Recommended: ranking yes, streaks no.
5. **Is a named stretch wanted at all,** beyond A? What would you open the *Time away* list for? If the answer is
   "rarely", ship B's single read and stop.
6. **Entity name.** `TimeAway`, or something else? Avoid "period", which belongs to Routines.
7. **Deleting a stretch:** keep the routine cycles it excused excused (recommended), or re-score them?
8. **Should a stretch apply its template to every day on creation,** or only float it as the first suggestion
   (recommended default)?
9. **Existing labels:** do any of your real days carry a label repeated across consecutive vacation days? If yes, the
   one-off conversion is worth writing. If not, skip it.
10. **Item streaks while away:** hold them (recommended), or let them zero and protect only the period streak?

---

## Candidates

### F4-01. Vacation and sick days stop breaking routines, nudging, and suggesting the office
- **Moment:** the first morning back from a holiday or a sick week. That is the day an ADHD user either restarts or quietly
  gives up on the app.
- **Today:**
  - *Routines never read the day type.* Every missed cycle while away is `OnGrace` or `Broken`
    (`RoutineResetService.cs:232-250`), and every undone item's streak zeroes (`:253-255`). Freezes are manual, one per
    cycle, at 2 a month by default and 10 at most (`RoutineStreakFreezeService.cs:23,30,77-112`), so a two-week vacation
    breaks every daily routine whatever the user does.
  - *The nudges ignore away days.* J2 (P4/P5) reads no calendar. J3 (P6) reads only `WakeUpTime`
    (`RoutineSuggestedTodayJobHandler.cs:149`).
  - *Suggestions rank weekday history above the day type.* Template history is ordered by `OccurrenceCount` across
    weekday and day-type patterns alike (`GetSuggestionsTaskPlannerDayTemplateEndpoint.cs:79-95`). Repeating-task
    pattern tiers match only weekday and day-of-month (`GetSuggestionsRepeatingPlannerTaskEndpoint.cs:124-127,148-151`).
    A vacation Monday is offered the office Monday.
  - *The input already exists:* `DayType.Vacation`/`SickDay` are settable today (`CalendarDetailsDialog.vue:104-118`,
    `BatchUpdateDayTypeCalendarEndpoint.cs`).
- **Backend logic needed:**
  - *Core:* `DayType.IsAway()` (Vacation, SickDay), and `CalendarDayTypesChangedEvent(userId, dates)`.
  - *Routines:*
    - **Excusal at reset.** A cycle with at least half of its days away is excused. It writes
      `RoutinePeriodCompletion.IsExcused` (new column, CHECK against `IsFrozen`) and `StreakOutcome.Excused`, and carries
      the run like a freeze without spending budget. Item streaks are held.
    - **Where it runs.** Wired into all three reset sites, with the away dates pre-read through the existing
      `ICalendarDayLookup` seam.
    - **The rest of the slice.** `RecomputeStreak` treats excused like frozen, `Apply` refuses excused rows, and a
      handler for the Core event excuses retroactively and re-walks the streak.
    - **Nudges.** J2 and J3 skip a user whose local today is away, and P1 is not sent for `Excused`.
  - *Planning:*
    - Template suggestions rank day-type entries above weekday entries on away days.
    - Repeating suggestions drop the two pattern tiers on away days.
    - Publish the event from `UpdateCalendarEndpoint` and the batch day-type endpoint.
  - *Also:* fix the `Calendar.cs:26` comment and the `PlannerTaskSeeder.cs:91` labels (Location's job).
- **Frontend surface:**
  - `RoutineGroupHeatmap.vue` and `RoutineGroupHistoryBody.vue` show an "away" cell.
  - `useStreakFreeze.ts` hides the freeze action on it.
  - An optional one-line hint in `CalendarDetailsDialog.vue`.
  - Suggestion order changes are invisible: the server re-ranks.
- **Data it runs on:** `Calendar.DayType` (existing, user-set), `RoutinePeriodCompletion.PeriodStart/End` (existing).
  New input: **none**.
- **Size:** backend **M** (one small migration, an event and handler, three reset sites, two endpoints, two jobs).
  Frontend **S**.
- **Risks / open questions:**
  - It changes what a routine streak *means*: away time stops counting.
  - The coverage threshold for weekly and monthly cycles is a decision (open questions 1–2).
  - UTC cycle boundaries against local dates can be off by one at the edges, and the majority rule absorbs it.
  - Item streaks cannot be repaired retroactively.
  - Abuse ("mark everything vacation") is not a concern for a self-tracking tool.
  - ADHD check: it removes a guilt pile and a nag, and asks for no form.
- **Dedupe:** new. It touches but does not redo the notification audit: it adds a *suppression* condition to P1, P4, P5
  and P6, not a new trigger. It complements B27 (re-ranking within its response, no new endpoint) and leaves C3/OP18
  untouched. It closes F2's *Rejected* hand-off ("`DayType.Vacation/SickDay/Special` never produced server-side … belongs
  to F4").

### F4-02. Mark "Barcelona, 12–20 Aug" once, and the days remember it
- **Moment:** booking a trip or calling in sick for a few days. That is the one moment the user knows the range, and it
  is often across a month boundary.
- **Today:**
  - *Days can be marked, but not as a range or under a name.* Away days can be marked only as loaded days in the visible
    month (`PlannerCalendarView.vue:452-458`). The only name available is the free-text label (`Calendar.cs:26`,
    max 100), which nothing queries: every server `.Label` reference is a projection.
  - *Nothing groups days.* `CalendarFilter.cs:5-11` takes only `From`/`Until`, and no entity groups days into a named
    span. Search: `DateOnly` properties under `.Planning/domain/model/entity` are only `Calendar.Date` and
    `RepeatingPlannerTask.ActiveFromDate/ToDate`, and the latter is a recurrence window.
  - *A template cannot be tied to an occasion,* only to a weekday or day type (`TaskPlannerDayTemplate.cs:18-20`).
- **Backend logic needed (Planning):**
  - *The entity.* New `TimeAway` (user-scoped: `Name`, `Kind ∈ {Vacation, SickDay}`, `StartDate`/`EndDate`, optional
    `TemplateId` (FK, `SET NULL`), `Location`, `Notes`), plus `Calendar.TimeAwayId` (FK, `SET NULL`).
  - *The rules.* No overlap. A `TimeAwayStamper`, the single implementation for create, resize and delete, which
    provisions missing days through `CalendarDayFactory`, stamps day type and location without overwriting user
    overrides, and un-stamps only what it wrote. A stretch and its stamp are one transaction. Template pattern type 4
    ("planned for <name>") ranks first inside a stretch.
  - *The endpoints.* CRUD and list. `CalendarResponse`/`CalendarDaySummary` gain the stretch id and name. Applying the
    template is opt-in, in `Ignore` mode.
  - *Housekeeping.* GDPR export and deletion. Publish F4-01's event from the stamper.
- **Frontend surface:**
  - A *Mark time away* dialog, reached from `BulkSelectActionBar.vue` (range prefilled) and `CalendarDetailsDialog.vue`.
  - A stretch-name chip in `CalendarDayCellHeader.vue` (framework-generic optional prop) and in `DayDetailsPanel.vue`.
  - A *Time away* list off the planner calendar.
  - The pattern-4 sentence in `DayTemplatePicker.vue`.
- **Data it runs on:** existing `Calendar` rows and templates. New input: **a name and a date range, entered once per
  trip or illness.** That is a form, but one that replaces per-day bulk actions rather than adding to them.
- **Size:** backend **M–L** (new table, a column on `calendar`, the stamper with three callers, five endpoints, a
  suggestion tier). Frontend **M**.
- **Risks / open questions:**
  - Worth building only if the owner wants names and history (open question 5). Option B (derived runs from day type
    and label) is the cheap experiment.
  - The naming collision with Routines' "period" (open question 6).
  - The delete semantics for excused cycles (open question 7).
  - A *Time away* history must stay a quiet list, never a counter of sick days.
  - It depends on F4-01 for most of its value: a stamped `Vacation` matters only once `Vacation` does something.
- **Dedupe:** new. It is the owner's 2026-04-02 brainstorm and the *Considered* entry in
  `prompts/captured-data/README.md:75`. It extends F4-01 (stretches stamp the day type F4-01 acts on). It does not
  overlap C3/OP18: workday variants stay `Location` + template, and a stretch's `Location` only feeds that path.

---

## Rejected

- **Day type as a user-defined lookup table (the brainstorm, literally).** The enum's members carry rules on both ends:
  `CalendarDayTypeRule`, the pattern view's hard-coded `CASE` (`mv_template_suggestion_pattern.sql:17-24`), the client's
  colours and icons (`_common/dto/enum/DayType.ts`), and F4-01's away rule. User-defined rows would carry none. Custom
  categories are already covered by `Special` + label + `Location` + template.
- **"HomeOffice / Office" as a day-type lookup.** That is `Location` (Home/Office/Travel), already on the day and on the
  template. Template-by-location is C3/OP18.
- **Migrating `Label` into stretches.** The label has three incompatible readings (backend comment, frontend
  placeholder, brainstorm). A day can belong to Barcelona *and* carry a label. Only an owner-run, data-dependent
  conversion is worth considering.
- **An effective day type computed at read time from the stretch,** instead of stamping. Every reader would have to
  learn about stretches: two endpoints, the materialized view's SQL, `ICalendarDayLookup`, History's dashboard and the
  client cell. Stamping keeps all of them unchanged.
- **Overlapping or nested stretches.** The single real case, a sick day inside a vacation, is a one-day override. Nesting
  would need a many-to-many and a precedence rule.
- **Recurrence rules on stretches (RRULE, "every February").** Annual trips do not land on fixed dates. "Create next
  year's from last year's" covers it with no rule engine.
- **Auto-detecting vacations from missing activity or tracking.** It guesses, it is wrong on a quiet week at home, and it
  turns tracking data into an inference about the user's life.
- **A date-range "quiet days" capability in the Notifications framework now.** Every affected producer is a Routines job.
  Revisit when a second app wants "do not disturb until".
- **Changing the planner's day streak for away days.** It already treats an unplanned day as neutral.
- **A "sick days this year" stat or badge.** It is a score about the user's health, and it counts against them.
- **Applying a stretch's template to every day by default.** It creates tasks the user did not ask for. Opt-in only.
- **Treating `Special` as away.** It means "unusual", not "absent", and an exam day must still nudge.

## Out of scope, but noticed

1. **Bug (frontend): the bulk bar offers a day type the server does not have.**
   - *The cause.* `BulkSelectActionBar.vue:63` builds its options from `Object.values(DayType)`, and the framework enum
     includes `Holiday` (`src/_common/dto/enum/DayType.ts:4`). The server's `DayType` has no `Holiday` member
     (`AdhdTimeOrganizer.Core/domain/model/enum/DayType.cs`).
   - *The likely result.* Choosing *Holiday* sends `dayType: "Holiday"` to `PATCH /calendar/day-type/batch`, which should
     fail enum binding and reject the whole batch. The runtime response is `unverified`: I did not call the API.
   - *Docs and the fix.* `docs/views/planner-day/inventory.md:31` documents *Holiday* as an option. The dialog's own list
     already excludes it (`dto/enum/dayTypeOptions.ts:7`), and the bar should reuse that list.
2. **Stale doc: the label *is* in the planner's month cell.** `docs/data-map/planner.md:130` ("not in the month cell")
   and `docs/data-map.md:445` ("the planner calendar shows only in the side panel") are both wrong.
   `CalendarGrid.vue:83` renders `CalendarDayCellHeader` for every grid, and that component prints `day.label`
   (`CalendarDayCellHeader.vue:23-28`). The planner calendar uses the same grid (`PlannerCalendarView.vue:2`).
3. **Stale comment and seed (backend):** `Calendar.cs:26` and `PlannerTaskSeeder.cs:91` model HomeOffice/Office as a
   label, which duplicates `Location`. This is folded into F4-01's backend step, and is harmless on its own.
4. **`Calendar.AppliedTemplateId` has no FK** (model snapshot: a plain `bigint applied_template_id`, no relationship). A
   deleted template leaves a dangling id behind its name snapshot. The suggestion endpoint already tolerates this by
   loading templates first (`GetSuggestionsTaskPlannerDayTemplateEndpoint.cs:59-66`), so nothing breaks today. Note it
   before anything starts reading the id.
5. **Dead branch (frontend framework):** `DayType.Holiday`'s colour and icon (`_common/dto/enum/DayType.ts:16,35`) can
   never be reached from server data, because the server never sends `Holiday`. Removing the member is a framework
   change. Weigh it against other apps that might use it.
6. **Frontend-only: home still shows none of the day's context** (OP5, unbuilt). F4-01 would make "Vacation" worth
   showing there: "You're away today. Routines are paused."
