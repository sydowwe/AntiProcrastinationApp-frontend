# B6 — three of the four profile grids return `activityId` with no activity name

> ✅ **Item 5 below is answered: the client is written against a NESTED `activity` object.** All four response
> DTOs call `ActivityInfo.fromJson(object.activity)` and none reads a flat `activityName` — so the
> `activityName` since added to `activity-backlog-profile/grid` is returned and never read, and that grid still
> renders `—` like the other three. Option B was never implemented; there is no client-side lookup to remove.
> Full evidence, plus the same question for the four lookup columns and the `isRepeatable`/`isOneTime`
> mismatch, in [`B7` §2](B7-grid-sort-key-audit.md). Choosing **A-nested** also makes `activity.name` resolve
> natively on all four routes, which fixes the sort gap in [`B7` §1](B7-grid-sort-key-audit.md) for free.

> Measured 2026-09-11 against a local API + local Postgres, signed in as the seed's `primaryUser` (id 10001),
> fixture `e2e-v1`.

**Repo:** the .NET 10 / FastEndpoints backend, not this one — but the answer may land on the client instead.
**Affects:** units **12** (`leisure-bucket-anchors`) and **13** (`leisure-projects`), and the `activity.name`
sort in [`B2`](B2-grid-500-on-unmapped-sortby.md).
**Effort:** small either way. **Risk:** low.

**This is a contract question, not a defect report.** Both answers below are defensible; the client cannot
choose between them because it cannot see whether the omission is deliberate. Pick one and the frontend will
follow it.

## What was measured

The row key set returned by each profile grid, `sortBy: []`, one row:

| Endpoint | Carries the activity name? | Row keys |
| --- | --- | --- |
| `activity-backlog-profile/grid` | **yes** — `activityName` | `activityId, activityName, locationTypeId, weatherDependencyId, energyLevel, effortType, minParticipants, maxParticipants, expectedCostTierId, durationMinutes, isRepeatable, isAnchored, memoryAnchorId, id` |
| `activity-project-profile/grid` | **no** | `activityId, difficultyLevel, projectArea, estimatedHours, isMessy, materialsNeeded, requiredTools, readinessStatus, id` |
| `activity-bucket-list-profile/grid` | **no** | `activityId, experienceTypeId, comfortZoneStep, requiresTravel, financialGoal, inspirationSource, isAnchored, memoryAnchorId, id` |
| `memory-anchor/grid` | **no** | `activityId, anchorMonth, anchorYear, highlightNote, rating, id` |

So the four sibling entities disagree with each other. Whatever the intended contract is, **one of these four
is already wrong**, and that is the part worth settling even if nothing else changes.

## What it looks like on screen

`/leisure/projects` in board mode renders its one seeded project under *"Needs shopping"* with real
data — *"Intermediate · Woodworking · 8.5h"*, materials and tools — and an em dash where the activity name
belongs:

```
—                                    [Delete]
Intermediate · Woodworking· 8.5h
Pine boards, Wood glue, Sandpaper
Drill, Circular saw, Clamps
```

The client builds that card through `ActivityInfo.fromJson({})` — there is no `activity` object in the row, so
it yields an empty name and the template falls back to `—`. The activity is `activityId: 12009`, *"Build a
Bookshelf"*, which is present and not archived.

The same hole shows up as *"Untitled"* on `/leisure/pick`.

## The two options, priced

### A — the grid embeds the name

Add `activityName` to the other three, matching `activity-backlog-profile`, or add a nested `activity` object
to all four. Either way the four become consistent.

- Costs one join per grid, already paid by `activity-backlog-profile`.
- **Also resolves the `activity.name` sort** in `B2` for these entities, or at least makes a flat
  `activityName` sort possible, which is what three views are reaching for.
- Correct for archived activities — see below, which is the part that decides it.

### B — the client resolves it from `/api/activity/all-options`

Leave the grids alone; the client joins `activityId` against the options list it already fetches.

- Costs nothing server-side. That endpoint is already requested on these pages and is cheap: **790 bytes, 21
  entries, `{id, text}`**.
- **But it does not cover archived activities.** `all-options` returns 21 of the fixture's 22 activities, and
  the one it omits is the archived one (`12010`). So any profile pointing at an archived activity would render
  blank under option B — and archiving an activity you have a bucket-list entry or a memory anchor for is
  exactly the normal case, since a memory anchor is by definition about something already done.
- It also cannot fix sorting: the server still cannot order by a name it does not have.

That asymmetry is why this is worth a decision rather than a shrug. Option B is free and works for the seeded
data; it has a silent failure mode on precisely the rows this feature exists to hold.

## What "done" looks like

Whichever you choose, the test is the same screen:

1. `/leisure/projects` renders *"Build a Bookshelf"* on the project card instead of `—`.
2. `/leisure/pick` renders the activity name instead of *"Untitled"*.
3. A profile whose activity is **archived** (`12010`) renders its name too — this is the case that separates
   the two options, so please check it explicitly rather than only the happy path.
4. The four profile grids agree with each other on whether the name is present and what it is called.
5. If you chose A: say whether it is a flat `activityName` or a nested `activity` object, since the client's
   response DTOs are written against one or the other.
