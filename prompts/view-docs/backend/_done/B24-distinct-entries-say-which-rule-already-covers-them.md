# B24 · Backend ask — the distinct-entries grids should say which mapping rule already covers each tuple

**Contract only.** A field per grid row and one filter value. Whether the match is computed in the query, in
memory over the page, or cached is the backend's; what the client needs is the *server's* answer to "would the
ingest match this tuple to a rule today?", because only the server owns the matcher.

> Written 2026-09-21 from `docs/views/_fix-queue.md` → *Deferred to opportunities* → `tracking-settings/B5`,
> re-graded `bug` → `opportunity` in *Contradictions* §103 (the ledger is the raw observation record by design,
> so a mapped process legitimately keeps appearing). **Not a defect and blocking nothing.** What is real is the
> product gap the finding names and the queue confirms has *"a backend half (a flag per tuple, or an exclude
> toggle)"* — the client cannot join the two grids on its own, and `B5`'s own *Suggested fix* says why.

---

## The problem

`/activity-tracking/desktop/settings/distinctEntries` (and the Android tab) is where a user decides what a
tracked process *is*. `usecase.md` calls the list *"the distinct, not-yet-considered process/product/window-title
combinations"*. It is not that: `FetchTableDistinctDesktopEntry.cs` groups the raw `DesktopActivityEntry` ledger
by `(ProductName, ProcessName, WindowTitle)` and returns `{ id, processName, productName, windowTitle }` with
**no reference to the mappings table**, and the heartbeat keeps storing an entry that matches a to-activity rule
(`DesktopActivityHeartbeatEndpoint.cs:87-113` — attributes the seconds *and* adds the row; only `IsIgnored`
drops it at `:89-90`). So `B5`'s repro holds by design: create an `Exact` rule for `vlc.exe`, re-filter, and
`vlc.exe` is still listed exactly as before. Nothing on the screen tells the user which rows still need a
decision.

The client cannot compute it. The Mappings grid is a second paginated, separately filtered dataset; a rule is a
pattern with a match type (`Exact` / `Contains` / `Regex` …) per field, matched **first-match-wins in specificity
order** (`OrderBySpecificity`, `PatternMatcher.MatchesPattern`, `IsActive` only) — re-implementing that
client-side over two paged lists is the drift `B5` warned against, and it would disagree with attribution the
first time the order changed. The distinct row's `id` is `Min(e.Id)` of the ledger rows, unrelated to any
mapping id, so there is nothing to join on.

**Found while writing this, and it changes what the flag means on Android:** `AndroidSyncEndpoint.cs` never
reads `TrackerAndroidMappingByPattern` — the only readers in the solution are `AppDbContext` and
`TrackerMappingActivityReferenceSource` (the `canDelete` scan). Android rules are created, listed, edited and
deleted, and applied to nothing. If that is *not yet* rather than *by design*, the flag below should be
defined against the matcher the sync will eventually use, and the Android half of this ask waits for it. If it
is by design, say so, and the Android grid gets the flag as "a rule exists that would match" with no
attribution meaning behind it. Either answer is fine; the client should not guess.

## The business rules

1. **The server's matcher is the only truth.** `coveredBy` (below) is the rule the ingest would pick for this
   tuple *today* — same specificity order, same first-match-wins, **active rules only**, as
   `DesktopActivityHeartbeatEndpoint` does. Please share the code path rather than approximating it, so the
   grid and attribution never disagree.
2. **Inactive rules do not cover.** A rule with `isActive: false` matches nothing at ingest; a tuple whose
   only matching rule is inactive is *uncovered*. (`tracking-settings/O1`, the missing `isActive` toggle,
   becomes visible through this — a user toggling a rule off will see its tuples reappear as undecided.)
3. **Ignored rules still count as covering.** Rows recorded *before* an ignore rule was created are still in
   the ledger and still appear; they should read *"ignored by rule N"*, not *undecided*. New rows are not
   written for them, so the list drains on its own over retention.
4. **The default stays the full list.** The grid is the raw observation record, per §103. The filter below
   defaults to *all*; whether the client flips its own default to *uncovered* is a client decision the
   contract does not need.
5. **`B11`'s filter conventions apply**: an absent/null filter value means *no opinion*; the field is a plain
   camelCase JSON property, so `GridFilterFieldNameTests` gains a case for it on both grids.
6. **Not sortable.** It is a computed value, not a member the grid's `SortByMany` can reach (`B20`'s class);
   the client will not send it as a sort key.

## The shape the frontend needs

On each row of `POST /activity-tracking/desktop/grid` (`TrackerDesktopDistinctEntriesResponse`) and
`POST /activity-tracking/android/grid` (`AndroidDistinctEntriesResponse`), one added field:

```json
{
  "id": 76,
  "processName": "vlc.exe",
  "productName": "VLC media player",
  "windowTitle": "Documentary.mkv",
  "coveredBy": { "mappingId": 21001, "target": "Activity", "targetName": "Read a Novel" }
}
```

- **`coveredBy`** — `null` when no active rule matches. Otherwise:
  - `mappingId` — the rule's id, so the row can deep-link to *edit this rule* on the Mappings tab
    (`F13` gives that tab a working edit/delete; this is the link into it).
  - `target` — `"Activity" | "RoleOrCategory" | "Ignored"`, the three target groups the check constraint
    already names (`CK_TrackerDesktopMappingByPattern_TargetRequired`).
  - `targetName` — the activity's name, the role/category text (joined with ` · ` if both), or absent for
    `Ignored`. Rendered as the chip text; the client has nothing else to render it from without a second
    request per row.

On both grids' filter records (`TrackerDesktopDistinctEntriesFilter`, `AndroidDistinctEntriesFilter`), one
added field:

```json
{ "filter": { "coverage": "Uncovered" } }
```

- **`coverage`** — `"All" | "Uncovered" | "Covered"`, nullable, null = `All`. `Uncovered` is the one that
  makes the tab what `usecase.md` says it is; `Covered` is the audit view (*"which rows does rule N
  actually catch?"*). The `itemsCount` must reflect the filter, so *"12 still to decide"* can be a header.

Cost: a page is ≤ 25 tuples against a user's rule list; the desktop heartbeat already does this match per
entry per window, so per page it is cheaper than one heartbeat. `Uncovered` as a *filter* over the grouped
query is the one part that may not be a plain SQL predicate — if it has to be a post-filter over the page,
say so and the client will not promise an exact `itemsCount` for it.

## What changes on the frontend once this lands

- `TrackerDesktopDistinctEntriesResponse.ts` / `TrackerAndroidDistinctEntriesResponse.ts` gain `coveredBy`;
  the two `*DistinctEntriesFilterRequest.ts` gain `coverage`.
- `DesktopDistinctEntriesTable.vue` / `AndroidDistinctEntriesTable.vue` gain a *Rule* column: a chip with
  `targetName` (or *Ignored*) linking to the Mappings tab with the rule id in the query, or a muted
  *undecided* — and a three-way `coverage` toggle in the filter row, URL-backed like the other filters
  (`F15`'s convention). Whether the toggle defaults to *Uncovered* is decided when it lands, not here.
- `docs/views/tracking-settings/usecase.md`'s *"not-yet-considered"* sentence becomes true for the first
  time; `tracking-settings/B5` closes; *Deferred to opportunities* loses the entry.
- If the Android answer is "not yet": the Android grid ships without the column, with a one-line comment
  pointing here, and the ask stays open for that half only.
---

BACKEND RESPONSE (2026-09-21):

Status: done on dev (uncommitted as of 2026-09-21), built, integration-tested. The contract is exactly the
shape the ask drew, with three details you should read before wiring the client: `targetName` is `null` (not
absent) for `Ignored`; `Uncovered`/`Covered` counts are exact, so you may promise the header; and the Android
answer is "not applied at ingest today", handled so the chip still ships there — see the last section.

### The row field

Every item on `POST /activity-tracking/desktop/grid` (`TrackerDesktopDistinctEntriesResponse`) and
`POST /activity-tracking/android/grid` (`AndroidDistinctEntriesResponse`) now carries `"coveredBy": null` or
`"coveredBy": { "mappingId": 21001, "target": "Activity", "targetName": "Read a Novel" }`.

| Field | Type | Meaning |
| --- | --- | --- |
| `coveredBy` | `object \| null` | `null` = no active rule matches this tuple (undecided). Always present on the row. |
| `mappingId` | `number` | The rule's id — deep-link target for *edit this rule* on the Mappings tab. |
| `target` | `"Activity" \| "RoleOrCategory" \| "Ignored"` | The rule's target group. String enum, member names verbatim (no naming policy), same converter as every other enum on the API. |
| `targetName` | `string \| null` | Chip text. Activity name; for `RoleOrCategory` the role and/or category name, joined with `" · "` when both are set; `null` for `Ignored` — the server writes nulls rather than omitting, so type it as nullable, not optional. |

What it means, precisely: `coveredBy` is the rule the desktop heartbeat would pick for this tuple today — the
server's own matcher, not an approximation. Same specificity order (more pattern columns wins, then lower id),
same first-match-wins, active rules only. The heartbeat and the grid now literally call the same class, so the
chip cannot disagree with attribution.

Consequences you asked about, all confirmed and pinned by tests:
- **Inactive rule → uncovered.** A rule with `isActive: false` matches nothing at ingest, so a tuple only it
  matches shows `coveredBy: null`. Toggling a rule off will make its tuples reappear as undecided (this is the
  visible half of `tracking-settings/O1`).
- **Ignore rule → covered.** Rows recorded before the ignore rule was created still appear, and read
  `{ target: "Ignored", targetName: null }`. New rows aren't written for them, so they drain over retention.
- **Not sortable.** It's computed after the query. Sending `coveredBy` as a sort key gets the framework's
  nested-object 400; don't mark the column sortable.

### The filter field

Both filter records (`TrackerDesktopDistinctEntriesFilter`, `AndroidDistinctEntriesFilter`) gain
`{ "filter": { "coverage": "Uncovered" } }`.

| Value | Effect |
| --- | --- |
| absent / `null` | No opinion — the full raw observation record, exactly as before (§103). |
| `"All"` | Same as null. |
| `"Uncovered"` | Only tuples with `coveredBy: null` — the "still to decide" view `usecase.md` describes. |
| `"Covered"` | Only tuples with a rule — the audit view. |

- `itemsCount` and `pageCount` are exact for all three. The filter can't be a SQL predicate (patterns match in
  memory), so for `Uncovered`/`Covered` the server materialises the whole sorted distinct set, resolves it,
  filters, then pages. You can print "12 still to decide" from `itemsCount` and trust it. For `All`/null
  nothing changed — count and page stay in SQL, only the page is resolved.
- Sort order is unchanged and still SQL-side in every mode, so a page cut from the `Uncovered` view is in the
  same order the unfiltered grid shows.
- Combines freely with the existing `processName`/`productName`/`windowTitle` (or `packageName`/`appLabel`)
  + match-type filters.
- An undefined value is a 400 from the validator, not a silent fall-through to `All`.
- Whether your toggle defaults to `Uncovered` is yours to decide; the server default stays the full list.

### TypeScript you'll want

```ts
export type MappingCoverageTarget = 'Activity' | 'RoleOrCategory' | 'Ignored';

export interface MappingCoverageResponse {
  mappingId: number;
  target: MappingCoverageTarget;
  targetName: string | null;   // null for Ignored — nullable, not optional
}

export type MappingCoverage = 'All' | 'Uncovered' | 'Covered';

// TrackerDesktopDistinctEntriesResponse / TrackerAndroidDistinctEntriesResponse
coveredBy: MappingCoverageResponse | null;

// *DistinctEntriesFilterRequest
coverage?: MappingCoverage | null;
```

`GridFilterFieldNameTests` now posts `coverage` under this exact camelCase spelling to both grids and asserts
it narrows, so the wire name is pinned server-side.

### Android — the answer to the open question

Confirmed: `AndroidSyncEndpoint` does not read `TrackerAndroidMappingByPattern`. Android rules are created,
listed, edited and deleted, and applied to nothing at ingest. Nothing in the repo records whether that is "not
yet" or "by design", so the backend shipped the Android half under the reading that is correct either way:

- The Android grid ships the field and the filter now, identical shape to desktop.
- On Android, `coveredBy` means "an active rule exists that would match this pair" — same
  specificity/first-match/active-only walk over `(packageName, appLabel)` — with no attribution meaning
  behind it.
- It resolves through `AndroidMappingRuleSet`, which is the class the sync will resolve through if/when it
  starts applying rules, so the chip and the ingest would agree from the first synced session without a
  contract change.

So: build the Rule column on both tabs; no need for the "ships without the column" branch. If product later
decides Android rules should attribute, that's separate backend work and nothing on the wire changes.

### Closing the loop on your side

- `TrackerDesktopDistinctEntriesResponse.ts` / `TrackerAndroidDistinctEntriesResponse.ts` — add `coveredBy`.
- `*DistinctEntriesFilterRequest.ts` — add `coverage`.
- `DesktopDistinctEntriesTable.vue` / `AndroidDistinctEntriesTable.vue` — Rule column: chip with `targetName`
  (or *Ignored*) linking to the Mappings tab with `mappingId` in the query; muted *undecided* for null;
  three-way coverage toggle in the filter row, URL-backed per `F15`.
- `docs/views/tracking-settings/usecase.md` — the "not-yet-considered" sentence is now true when
  `coverage=Uncovered`; close `tracking-settings/B5`; drop the *Deferred to opportunities* entry.
