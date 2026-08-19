# D1 · "What should I do right now?" — the picker ⭐

- **Scope:** new view, reads all four existing surfaces
- **Backend:** yes — a scoring/suggestion endpoint
- **Model / effort:** Opus 5, high effort — the scoring model and the restraint to show three options instead of forty are the whole deliverable; the code around them is small
- **Research:** Iyengar & Lepper (2000, *JPSP*) — larger choice sets reduce both the likelihood of choosing and satisfaction with the choice. Gollwitzer (1999) — implementation intentions ("when X, I will do Y") beat intentions alone.

---

```
The leisure module is four CRUD tables. It stores, in ActivityBacklogProfile alone: energyLevel,
effortType, durationMinutes, locationType, weatherDependency, expectedCostTier, minParticipants,
maxParticipants, isOneTime. That is precisely the vocabulary needed to answer "I have 45 minutes,
low energy, I'm indoors and broke — what should I do?" — and nothing in the app answers it. The
filters exist so the user can go find the answer manually, which is the version of this feature
that requires the user to already know what they want.

Build the picker: a new route (keep the existing four routes untouched — this is a fifth,
/leisure/pick, with its own nav entry under the leisure group in src/app/nav/navItems.ts).

THE INPUT is a small constraint form, not a filter panel. Time available, energy right now, and
who's around are the ones that actually gate a decision; cost and indoor/outdoor are secondary.
Default every field to something sensible so the user can land and press one button. Persist the
constraints in URL query params (CLAUDE.md requires bookmarkable state — /leisure/pick?minutes=45
&energy=low should be a shareable "I'm bored" bookmark).

THE OUTPUT IS THREE SUGGESTIONS. Not a table, not a filtered list — three cards. This is the
single most important decision in the prompt and the easiest one to quietly get wrong by
"just showing the matches". Iyengar & Lepper: a long list of eligible activities reproduces the
paralysis the module is supposed to cure. Show three, with a "something else" reroll. Each card
shows the activity (icon and colour are on ActivityInfo already), why it was picked ("fits 45 min,
low energy"), and one primary action.

SOURCES. The backlog is the obvious pool, but bucket list entries (ActivityBucketListProfile) and
projects (ActivityProjectProfile) are candidates too, and mixing them is what makes this feel
alive rather than like a saved filter. A project with readinessStatus = ReadyToStart and a low
estimatedHours is a perfectly good Saturday suggestion; one that NeedsShopping is not. A bucket
list item is a rare, high-value suggestion — surface it occasionally, not constantly.

SCORING — decide deliberately and write down the rule you chose:
- Hard constraints (exclude): durationMinutes over the time available; minParticipants above the
  people available; a cost tier above what the user asked for.
- Soft signals (rank): energy match, effort variety, staleness (something not suggested recently
  beats the same three items every time), and — for bucket list items — comfortZoneStep, where the
  smallest untried step is the most actionable one.
- Deliberate randomness. A deterministic top-3 becomes invisible after a week.

FOLLOW-THROUGH. A suggestion the user reads and forgets is worth nothing. The card's primary
action should commit the user to it — check what src/core/dayPlanner/ and
src/core/activityTracking/ expose through their api/ (and ONLY their api/ or dto/ — never their
component/, composable/ or store/) and hand off to whichever can either start tracking the
activity now or place it on today's plan. Gollwitzer: the commitment is where the effect lives.

STEP 1, before any UI: read src/core/leisure/api/ and the three profile DTOs to confirm what the
existing filtered endpoints can and cannot express. The existing POST filter endpoints can do the
hard constraints. They cannot do cross-source ranking, staleness, or "don't repeat yesterday's
suggestions" — those need the server, or they need the client to pull whole tables down and rank
locally, which does not scale and cannot remember anything.

Build the frontend against the shape you want. Where the existing endpoints suffice, use them.
Then write the backend ask to prompts/leisure/backend/D1-backend.md.

CONTRACT ONLY: the endpoint(s) the frontend calls (method, route, request shape) and the DTO
fields consumed back, with types and nullability, in the JSON naming the frontend fromJson reads.
Say what the endpoint must RETURN, not how it should compute it — if the ranking belongs on the
server, state the inputs and the shape of the ranked result and leave the algorithm to the backend
agent. No entities, no EF or migrations, no FK or cascade decisions, no validation rules.

Strings in _locales/leisure.{sk,en}.ts, SK primary. `npm run type-check` baseline is 72 errors,
all app-side — do not add, and never add one in src/_common. `npm run lint` must stay at 0.
```
