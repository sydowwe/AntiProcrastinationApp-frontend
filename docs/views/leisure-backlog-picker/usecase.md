# leisure-backlog-picker — use cases

## What this unit is for
Two views that form one loop: `BacklogView` is where the user files "things I could do" with a rich
vocabulary (energy, effort, location, weather, cost, duration, party size), and `PickerView`
(`/leisure/pick`, "What should I do right now?") is the payoff — it reads that backlog (plus the
bucket list and projects) and answers the question the filters alone never could: "I have 45
minutes, low energy, indoors — what should I do?" `PickerView` **spends** what `BacklogView`
**collects**; documenting the picker without knowing the backlog's shape would be documenting half
a feature.

## Where it sits
A user arrives at `/leisure/backlog` from the sidebar's "Leisure" group to file things they could do
some day, the same way they would use any of the other three leisure tables (bucket list, projects,
memory anchors — out of this unit's scope, see `docs/views/glossary.md`). `/leisure/pick` is reached
from the same nav group ("What should I do?", listed first) and is a dead end in the useful sense —
it is the terminal screen for "I'm bored," not a hub. Its cards commit the user forward into
`dayPlanner` (via `core/dayPlanner/api` and `dto` only, the cross-module boundary `CLAUDE.md`
allows), either starting a task now or booking a slot later today. `BacklogView`'s "Experienced"
column links sideways into `leisureMemoryAnchors` (also out of scope) to close the loop on a
one-time activity.

## Views

### BacklogView (`/leisure/backlog`)
**Purpose:** File and maintain "things I could do" — one backlog profile per activity.
**Who opens it and why:** Someone stocking the pool the picker draws from, or auditing what they
already filed (via the "Experienced" progress readout and filters).

**What the user can do**
- Filter the backlog by activity name, location, weather dependency, energy, effort, cost tier,
  a duration ceiling, and a tri-state repeatable/experienced toggle — every field round-trips through
  the URL, so a filtered view is bookmarkable and survives a reload.
- Create, edit and delete a backlog profile via a dialog form, including creating the underlying
  Activity inline (`ActivityAutocompleteWithCreate` → `QuickCreateActivityDialog`) without leaving
  the leisure module.
- Mark a one-time (non-repeatable) entry "I did this" inline, which opens the anchor-capture flow
  (`useAnchorCapture`) and, once anchored, links through to the matching Memory Anchors row.
- See a live "N of M experienced" progress readout, scoped to the one-time half of the backlog under
  the current filter.

**What the user can see, and the question it answers**
- The table (activity, location, weather, energy, cost, duration, repeatable icon, experienced
  action) — answers "what have I filed, and what does each entry need to happen?"
- A "good for today" chip on the weather column — answers "does today's actual weather favour this
  one?" (raw signal from `GET /leisure-weather-fit`, derived comparison against the row's
  `weatherDependencyId`)
- The experienced-progress bar — answers "how much of my one-time backlog have I actually done?"

**Depends on:** the `activity-location-type`, `activity-weather-dependency` and
`activity-expected-cost-tier` lookup tables (shared with the create/edit form and the filter); the
weather-fit signal, which degrades to "no badge" when absent — see Findings.

### PickerView (`/leisure/pick`)
**Purpose:** Turn constraints ("I have X minutes, Y energy, Z people") into three concrete
suggestions instead of a filtered list, per Iyengar & Lepper — a long eligible list reproduces the
paralysis the module exists to cure.
**Who opens it and why:** Someone with unstructured time who does not want to think through their
own backlog — the app's answer to "I'm bored."

**What the user can do**
- Set time available (15 min – 4 h), energy (low/medium/high) and who's around (alone/pair/group) as
  one-tap toggle chips, plus optional secondary constraints (max cost, location) behind a
  "More constraints" disclosure.
- Draw again ("Something else") without repeating the same three, and reload or share the URL to
  reproduce the exact same draw (`?minutes=&energy=&people=&seed=`).
- Commit to a suggestion: "Do it now" starts tracking immediately (an in-progress `PlannerTask`
  starting this minute); "Plan for later" opens a time picker and books a slot later today.
- Escape from a specific suggestion into "Browse everything" (back to the full backlog table) when
  none of the three land.

**What the user can see, and the question it answers**
- Up to three suggestion cards, each showing source (backlog/project/bucket list), a "why" list
  (duration fit, energy fit — labelled "estimated" when derived rather than stated, weather fit,
  comfort-zone step) — answers "why this, specifically, right now?"
- Three distinct empty states (load failed / nothing filed at all / nothing fits these constraints)
  — answers "is this broken, empty, or just too narrow?"
- Once committed, the card flips to a confirmation showing the booked time range and a link to open
  the day planner — answers "did that actually go anywhere?"

**Depends on:** the same three leisure tables `BacklogView`'s siblings own (backlog, bucket list,
project), `useLeisureFilterChips`/lookup data for cost and location options, the weather-fit signal
(ranking only, never a hard gate on its own absence), and per-account `localStorage` staleness
history (`leisure.picker.history::<userId>`, via `useUserScopedStorage`) so a draw does not repeat
itself indefinitely.

## Entity lifecycle
A backlog profile is created and deleted from `BacklogView`'s dialog, keyed 1:1 to an `Activity`
(`activityId` is the profile's own id — see glossary). `PickerView` never creates or deletes a
backlog profile; its only write is a `PlannerTask` in `dayPlanner`, cross-module, on commit. Deleting
a backlog profile has no cascade (confirmed: the delete dialog asks only "Are you sure you want to
delete `<activity name>`?", no child-count warning), consistent with a profile having no rows of its
own that reference it. Anchoring (marking one-time backlog entries "done") creates a `MemoryAnchor`
row, owned by a different unit.

## Data this unit captures but does not spend
- **`ActivityBacklogProfile.minParticipants` / `maxParticipants` as *filters*.** Both fields exist on
  `ActivityBacklogProfileFilter`, both round-trip through the URL (`leisureFilterUrlState.ts`), but
  `BacklogView`'s `<FilterPanel>` never renders an input for either — there is no way to reach this
  filter from the UI at all, only by hand-editing the query string.
- **`ActivityBacklogProfile.maxParticipants` in the picker's ranking.** `useLeisurePicker.ts`'s
  `backlogSuggestion()` reads `minParticipants` into `CandidateFacts` but never reads
  `maxParticipants` — a backlog entry capped at 2 people is suggested identically for a "group" (4)
  draw. (`D1-backend.md` flags the field's own filter semantics as ambiguous, which may be why the
  picker's client-side draw never picked it up either.)
- **`WeatherFit.matchingWeatherDependencyIds` as an empty array.** The contract
  (`prompts/_done/leisure/backend/D2-backend.md`) explicitly says the frontend cannot and need not
  distinguish "no signal" from "signal says nothing matches" — but the ranking code *does*
  distinguish them (checks `!== null`), and the backend today sends the empty-array shape. See
  Findings X2 — this is the sharpest capture-without-spend gap in the unit, because the intent was
  explicitly "treat both as no opinion" and the implementation treats them as opposites.
