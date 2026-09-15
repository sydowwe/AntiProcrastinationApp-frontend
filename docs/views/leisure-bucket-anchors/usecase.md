# leisure-bucket-anchors — use cases

## What this unit is for

Two of the leisure module's four profile tables, and the one relationship the module builds between
them. The bucket list ("something I want to do once") is where a one-time experience is filed; the
memory anchor ("something I did and want to remember") is where its completion is recorded — a month, a
rating, a highlight note. Closing that loop (bucket list → "I did this" → memory anchor) is this unit's
reason for existing as a pair rather than two independent CRUD screens.

## Where it sits

A user reaches `/leisure/bucket-list` from the sidebar's Leisure group to file something they want to
experience once. Once they've done it, either the bucket list row's "I did this" action or the memory
anchors "Add" button opens the same capture dialog (`MemoryAnchorForm` / `NewMemoryAnchorForm`) to record
the memory. From the memory anchors side, a "Bucket List" source chip on an anchor navigates back to the
originating bucket-list row (filtered by activity name), and the reverse chip on the bucket-list row
navigates to the anchor. The pair also touches the backlog module (`/leisure/backlog`) for its one-time
half — `useAnchorCapture`, `ExperiencedCell` and the source-chip vocabulary are shared with backlog rows,
though backlog itself is a different unit's scope.

## Views

### BucketListView (`/leisure/bucket-list`)
**Purpose:** File and browse things the user wants to experience once, and see how many have been
experienced.
**Who opens it and why:** Planning ahead ("what do I still want to try"), or filing a new idea while
comfort-zone stretching is on their mind.

**What the user can do**
- Add a bucket-list profile (activity, experience type, comfort-zone step 1–5, requires travel, financial
  goal, inspiration source) via `NewBucketListProfileForm` — **confirmed working**. Edit and delete an
  existing profile via `BucketListProfileForm` are exposed identically but **both are completely
  non-functional** (silent 404, no error shown to the user) — see `findings.md` X4.
- Toggle between a **table** and a **ladder** view, with the choice kept in the `view` URL query param.
- Filter by activity name, experience type, comfort-zone step range, "requires travel" and "experienced"
  (tri-state: any / yes / no) — the panel's state round-trips through the URL. Only `activityName` and
  `isAnchored` actually narrow the result set; the comfort-zone-step range is accepted and sent but ignored
  server-side (see `findings.md` B1).
- Mark a row "I did this" from the table's Experienced column or the ladder's per-item action, which opens
  the memory-anchor capture dialog pre-filled with the activity — **confirmed working**, including the
  reverse: deleting the resulting anchor correctly un-marks the row as experienced again.
- On the ladder, see one highlighted "next rung" nudge — the lowest comfort-zone step that still has an
  unexperienced item — and delete an item directly from its rung card (same non-functional delete as above).

**What the user can see, and the question it answers**
- Experienced-progress bar ("N of M experienced") — answers "how much of my list have I actually done?"
  Hidden until the API returns at least one row carrying `isAnchored` and only meaningful while the
  "experienced" filter itself is not narrowing the set.
- Table's "Experienced" column and the ladder's per-item chip — answers "is this one already done, and if
  so, where's the memory?" (the chip is a link into the matching memory anchor).
- Ladder's five rungs, grouped by `comfortZoneStep` — answers "how far outside my comfort zone does each
  idea sit, and where's the next honest step?"

**Depends on:** `isAnchored` completion data must be present on the API response, or the progress bar and
the ladder's "next rung" nudge silently stay hidden rather than showing a false number.

### MemoryAnchorsView (`/leisure/memory-anchors`)
**Purpose:** Record and revisit experiences the user has actually had.
**Who opens it and why:** Right after doing something worth remembering (via the bucket-list/backlog "I
did this" action), or later, looking back at a year.

**What the user can do**
- Add, edit and delete a memory anchor (activity, month, year, highlight note, rating 1–10) via
  `MemoryAnchorForm` / `NewMemoryAnchorForm`. The activity picker only offers activities eligible for
  anchoring (a one-time backlog or bucket-list profile); when opened via "I did this" the activity is
  locked instead of picked.
- Toggle between a **table** and a **timeline** view, kept in the `view` URL query param.
- Filter by activity name, year, month and minimum rating.
- On the timeline, navigate by year (a menu lists every year that has at least one anchor, plus the
  current year), see a twelve-cell year strip shaded by that month's best rating, and read each month's
  anchors — including the highlight note — inline, with no click required.
- Click a "Bucket List" / "Backlog (one-time)" source chip to jump back to the originating row, filtered
  by activity name.

**What the user can see, and the question it answers**
- Table's Rating column (colour-coded, `/10`) and the timeline's rating-driven colour intensity — answers
  "how good was this one?" without making a low rating read as a failure (intensity only, never a warning
  colour).
- Timeline's year strip and per-month gap — answers "which months of this year have a memory in them, and
  which are honestly empty?"
- Source chip — answers "did this come from something I filed in advance, and where?"

**Depends on:** The `anchor-eligible-activities` endpoint for the unlocked create path (see Findings — this
is currently broken against the running backend). The month/year strip's "which years have anything"
question depends on the client holding every anchor for the account at once (see Findings — the fetch that
should supply this is also currently broken).

## Entity lifecycle

A bucket-list profile (`ActivityBucketListProfile`, keyed by `activityId`) is created, edited and deleted
entirely within `BucketListView`. **Create works; edit and delete do not** — both send the profile's
`activityId` where the backend expects the profile's own row id, so every `PUT`/`DELETE` 404s silently (no
error shown, the edit dialog just stays open and the deleted row just stays in the table). Confirmed in the
mutation pass across both the table and ladder call sites; see `findings.md` X4. Deleting a profile (once
that bug is fixed) does not touch any memory anchor that already points at the same activity — the two are
related by `activityId`/`memoryAnchorId`, not by cascade.

A memory anchor (`MemoryAnchor`) is created either from `MemoryAnchorsView` directly (any eligible
activity — **currently broken, the eligible-activities endpoint 404s**, see `findings.md` X3) or via the "I
did this" capture flow from a bucket-list or backlog row (`useAnchorCapture`, activity locked — **confirmed
working end-to-end** in the mutation pass). Editing changes month/year/rating/note (**confirmed working** —
unlike the bucket-list profile, `MemoryAnchor` carries its own real id, not an activity-derived one).
Deleting it does not delete the bucket-list or backlog profile it came from, but **does correctly flip the
source profile's `isAnchored` back to `false`** — confirmed in the mutation pass by creating an anchor via
"I did this," deleting it, and observing the bucket-list row revert from "Experienced" to "I did this."

## Data this unit captures but does not spend

- `ActivityBucketListProfile.financialGoal` and `.inspirationSource` — captured on every profile, but nothing
  in either view (or in the ladder/timeline) uses them to sort, filter, or drive any suggestion.
  `inspirationSource` in particular reads as free-text worth surfacing somewhere richer than a table cell —
  and right now isn't even reaching the table cell it has: a formatter bug renders it as "—" unconditionally
  (`findings.md` B3), so today this field is captured but not read back anywhere in the UI at all.
- `MemoryAnchor.hasBacklog` / `backlogIsRepeatable` / `hasBucketList` — three fields whose only purpose
  today is choosing which one source chip (if any) to render. The richer question they could answer — "of
  everything I've anchored, how much came from planning ahead versus a repeatable habit I happened to
  anchor once" — is not asked anywhere.
