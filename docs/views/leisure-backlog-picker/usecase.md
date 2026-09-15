# leisure-backlog-picker — use cases

## What this unit is for
Two halves of one loop: `BacklogView` is where the user files "things I could do" against the
richest vocabulary in the leisure module (energy, effort, location, weather dependency, cost tier,
duration, party size, repeatability). `PickerView` is where that vocabulary gets spent — the user
states time/energy/people available and gets three concrete suggestions instead of a filtered list,
with a one-click way to commit to one right now or later today.

## Where it sits
A user arrives at `/leisure/backlog` either to stock the backlog for the first time or to add/edit
one entry, then later arrives at `/leisure/pick` — from the sidebar directly, or from anywhere via
the "What should I do?" nav entry — when they are actually free and undecided. Committing a
suggestion hands off to `dayPlanner` (creates a `PlannerTask` for today, via `dayPlanner/api` only,
per `CLAUDE.md`'s cross-module rule). `PickerView` also reads `activityProjectProfile` and
`activityBucketListProfile` (the other two leisure tables) as secondary suggestion sources, and both
views can create a `MemoryAnchor` when a one-time backlog entry is marked done — that anchor is
edited/viewed on `/leisure/memory-anchors`, outside this unit.

## Views

### BacklogView (`/leisure/backlog`)
**Purpose:** CRUD + filter surface for `ActivityBacklogProfile` rows — the picker's main pool.
**Who opens it and why:** stocking the backlog for the first time, or maintaining an existing entry
(new duration estimate, marking something as done).

**What the user can do**
- Filter the backlog by activity name, location, weather dependency, energy, effort, cost tier,
  duration ceiling, repeatable/one-time, and experienced/not — filters persist in the URL and
  survive a reload.
- Create a backlog entry, picking an existing activity or creating a brand-new one inline without
  leaving the dialog (L4's inline-create, via `ActivityAutocompleteWithCreate` → a nested
  `QuickCreateActivityDialog`).
- Edit an existing entry (activity locked once created — the identity of a backlog profile is one
  activity, per the glossary).
- Delete an entry, with a confirmation naming the activity.
- Mark a one-time (non-repeatable) entry "I did this", opening a "Write it down" memory-anchor form
  inline (month/year, highlight note, 1–10 rating) without leaving the table.
- Jump from an anchored row's "Experienced" chip to `/leisure/memory-anchors` pre-filtered to that
  activity.

**What the user can see, and the question it answers**
- The table (location, weather, energy, cost, duration, repeatable, experienced columns) — answers
  "what do I already have filed, and in what state?"
- A "good for today" chip on rows whose weather dependency matches today's actual conditions —
  answers "is now specifically a good time for this one?"
- An "N of M one-time things experienced" progress bar, scoped to non-repeatable entries only —
  answers "how much of my one-time backlog have I actually gotten to?" (hidden when the API doesn't
  carry `isAnchored` yet, when the current filter is already slicing on `isAnchored`/`isRepeatable`,
  or when the denominator is zero.)

**Depends on:** the `askBeforeDelete`/`firstDayOfWeek` preferences are not read here (delete always
confirms unconditionally via `BasicTable`'s own dialog, independent of the app-wide preference — see
findings). Reads today's weather fit (`leisure-weather-fit`) for the "good today" badge only; degrades
silently if unavailable.

### PickerView (`/leisure/pick`)
**Purpose:** turn the backlog (plus eligible bucket-list and project rows) into three ranked
suggestions and commit the user to one.
**Who opens it and why:** the user is free, undecided, and wants an answer rather than a list —
this is explicitly built against Iyengar & Lepper (2000): a long eligible list reproduces the
paralysis the feature exists to cure.

**What the user can do**
- State time available (15 min – 4 h), energy right now, and who's around — all default to sensible
  values, so the view is usable with zero input, and every change re-ranks (re-fetching the pool
  only when the change could alter which rows are eligible; energy/people re-rank locally).
- Optionally reveal a secondary "spend at most" cost tier and a location constraint.
- Commit to a suggestion: "Do it now" (books a slot on today's plan starting now, `InProgress` with
  `actualStartTime` set) or "Plan for later" (pick a start time; `NotStarted`).
- "Something else" — reroll for three different suggestions, recording the rejected draw as "shown"
  so the same three don't keep reappearing.
- "Browse everything" / "Fill the backlog" — bail out to `BacklogView` when the picker can't help.
- Once committed, the card shows the booked time range and a link to open the day planner.

**What the user can see, and the question it answers**
- Up to three suggestion cards (activity, source chip, a short list of *why* it was picked: duration
  fit, energy match — labelled as stated vs. derived depending on the source, context label, comfort
  step, weather fit) — answers "what should I actually do, and why this one?"
- Three distinct empty states (failed to load / nothing filed at all / nothing fits current
  constraints), each with its own copy and its own recovery action — answers "why is nothing here,
  and what do I do about it?" without blaming the user for a server failure.

**Depends on:** `PROJECT_MIN_MINUTES` (60) and `BUCKET_LIST_MIN_MINUTES` (120) gate whether those two
sources are even fetched — a project/bucket-list row is invisible under a short time budget by
design, not a bug. Today's weather fit (`leisure-weather-fit`) feeds both a hard exclusion and a
ranking bonus for backlog rows — see findings for a defect in how a "no dependency" row is treated.

## Entity lifecycle
An `ActivityBacklogProfile` is created and edited only from `BacklogView` (`BacklogProfileForm.vue` /
`NewBacklogProfileForm.vue`), keyed 1:1 by `activityId` (an activity can have at most one backlog
profile — see `docs/views/glossary.md`). It is spent by `PickerView` as one of up to three ranked
candidates and, once marked "I did this", produces a `MemoryAnchor` (created inline from either the
backlog table or a suggestion's follow-through — memory anchors are not created inside this unit
today; only the backlog table's "I did this" affordance creates one here). Deleting a backlog profile
does not delete the activity or any memory anchor already linked to it. **As documented, edit and
delete are both non-functional in the running app** — see finding X1.

## Data this unit captures but does not spend
- `maxParticipants` — captured on both create and edit forms (`NewBacklogProfileForm.vue`), but no
  column renders it in `BacklogTable.vue` and no picker logic reads it (`leisureScoring.ts` only
  ever reads `minParticipants`, as a hard "not enough people" exclusion). A user filling in "at most
  4 people" gets no feedback anywhere that the field did anything.
- `memoryAnchorId` — carried on `ActivityBacklogProfile` and echoed by the API, but the frontend
  never reads it: `ExperiencedCell.vue`'s "open the anchor" link navigates by `activityName` query
  filter on `/leisure/memory-anchors` instead of the id it already has in hand. Works today because
  activity name is unique-enough in the seed, but is a name-collision risk the id would avoid.
- `effortType` on non-backlog sources — the picker's "effort variety" scoring signal
  (`EFFORT_VARIETY_BONUS`) only ever has a non-null `effortType` to compare against for backlog
  candidates; the concept exists but two of the three sources can never trigger it.
