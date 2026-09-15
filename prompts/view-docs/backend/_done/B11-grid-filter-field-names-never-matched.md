# B11 · Backend ask — five grid filters: the client sends fields the server does not read

**Contract only.** How each filter is applied is the backend's; this ask is about **which field names the
five filter records accept**, so that what the client has sent since August actually filters.

> **Blocker** on the four leisure grids (`leisure-backlog-picker/X1`, `leisure-bucket-anchors/B1`) and a
> silent `bug` on the activities grid (`activity-settings/B1`). Written 2026-09-15 from
> `docs/views/_fix-queue.md` escalations **§6 and §13**, which are one defect class on five endpoints.
> Source read in `AdhdTimeOrganizer` 2026-09-15.

---

## The problem

`IFilterRequest` is an empty marker and `BaseGridEndpoint` applies nothing generic
(`BaseGridEndpoint.cs:124-125` → `ApplyCustomFiltering` only). Each grid reads a handful of named members off
its own filter record, and **System.Text.Json drops unknown members silently** — so a request carrying a field
the record does not declare returns the **unfiltered** grid with a **200**. No test on either side can see it.

Both units misdiagnosed this from the browser (a filter that "works on two requests and fails on one"; five
fields "ignored" and one "working"), because a 200 with rows looks like success.

### The five contracts, side by side

| grid | client sends (`src/core/**/dto/request/*Filter.ts`) | server reads (`*FilterRequest.cs` + `ApplyCustomFiltering`) | never applied |
| --- | --- | --- | --- |
| `activity/grid` | `name`, `text`, `roleName`, **`roleIds[]`**, `categoryName`, **`categoryIds[]`**, `isArchived` | `Name`, `Text`, `IsUnavoidable`, `IsArchived`, `RoleName`, `CategoryName`, **`RoleId`**, **`CategoryId`** | the two id lists |
| `activity-backlog-profile/grid` | `activityName`, `locationTypeIds[]`, `weatherDependencyIds[]`, `energyLevels[]`, `effortTypes[]`, `expectedCostTierIds[]`, `maxDurationMinutes`, `minParticipants`, `maxParticipants`, `isRepeatable`, `isAnchored` | `EnergyLevel` (scalar), `EffortType` (scalar), `IsRepeatable`, `IsAnchored` | 9 of 11 |
| `activity-bucket-list-profile/grid` | `activityName`, `experienceTypeIds[]`, `minComfortZoneStep`, `maxComfortZoneStep`, `requiresTravel`, `isAnchored` | `RequiresTravel`, `ComfortZoneStep` (exact), `IsAnchored` | 4 of 6 |
| `memory-anchor/grid` | `activityName`, `year`, `month`, `minRating` | `AnchorMonth`, `AnchorYear`, `ActivityId` | all 4 — the client's `year`/`month` are being renamed to `anchorYear`/`anchorMonth` app-side (`F60`); `activityName` and `minRating` remain |
| `activity-project-profile/grid` | `activityName`, `difficultyLevels[]`, `readinessStatuses[]`, `projectArea`, `isMessy` | `DifficultyLevel` (scalar), `ReadinessStatus` (scalar), `IsMessy`, `ProjectArea` | 3 of 5 |

Two concrete consequences worth naming:

- **`activityName` filters on none of the four leisure grids** — every *Activity* filter chip, every
  `?activityName=` bookmark, and the memory-anchor table's source-chip navigation
  (`MemoryAnchorTable.vue:125` pushes `{ activityName }` to the source view) has always returned everything.
- **The activities settings grid has never filtered by role or category.** `git log -S roleIds` bottoms out
  at `540f9529` (2026-08-07) with the list shape already in place; no commit on either side ever carried the
  other's name.

## The business rules

The client's shapes encode UI decisions that are already shipped and bookmarkable, so this is a request to
**adopt the client's field names**, not a request to confirm the server's:

1. **Multi-select is a list.** `roleIds`, `categoryIds`, `locationTypeIds`, `weatherDependencyIds`,
   `expectedCostTierIds`, `experienceTypeIds`, `energyLevels`, `effortTypes`, `difficultyLevels`,
   `readinessStatuses` are chips in a combobox and comma-joined lists in the URL
   (`activitySettingsUrlParams.ts:67,69`, `leisureFilterUrlState.ts`). Semantics: **any-of** (`Contains`).
   Narrowing the client to a scalar would change the control, the param names and every bookmark.
2. **`activityName` is a case-insensitive contains** on the activity's name, on all four profile grids.
3. **Ranges are inclusive comparisons**: `minComfortZoneStep`/`maxComfortZoneStep`, `maxDurationMinutes`,
   `minParticipants`/`maxParticipants`, `minRating`. The bucket-list grid's current exact-match
   `ComfortZoneStep` has no client sender; keep or drop as you prefer.
4. **`null` means "no opinion"** on every field, as today.
5. **The existing scalars (`RoleId`, `EnergyLevel`, …) have no client sender.** Keep them if anything else
   sends them; nothing on this side does.

Please say if any of these is wrong — the client will follow the server's answer.

## The shape the frontend needs

The five filter records accepting the client's column of the table above, with the types as written
(`number[]` for id lists, enum lists for the enum fields, `number | null` for ranges, `string | null` for
names). No response changes.

**And one integration test per grid that pins the field names.** The failure mode here is a silent 200; a
test that posts each field and asserts a narrowed count is the only thing that would have caught three months
of this. (`B2`/`B7` asked the same for sort keys, and it worked.)

## What changes on the frontend once this lands

Nothing — `hasAny()`, the chips and the URL codecs already carry every field. The alternative — hiding the
inputs the server does not read — is a product regression for a contract gap and is not what we want.

Two things still land app-side regardless: `F18` (the activities combobox's mount-time rebuild wiping URL ids)
and `F60` (the memory-anchor `year`/`month` → `anchorYear`/`anchorMonth` rename). `leisure-backlog-picker/X1`'s
`Verify:` block is the acceptance test for the `activityName` half.

---

## ✅ Answered and landed — 2026-09-15 (`AdhdTimeOrganizer`, uncommitted on `dev`)

**Every name in the "client sends" column above is now declared on the server record and applied in
`ApplyCustomFiltering`.** No response changes, no route changes, no new fields for the client to send.

| grid | now accepted (camelCase on the wire) | semantics |
| --- | --- | --- |
| `activity/grid` | `roleIds[]`, `categoryIds[]` | any-of |
| `activity-backlog-profile/grid` | `activityName`, `locationTypeIds[]`, `weatherDependencyIds[]`, `expectedCostTierIds[]`, `energyLevels[]`, `effortTypes[]`, `maxDurationMinutes`, `minParticipants`, `maxParticipants` | see rules |
| `activity-bucket-list-profile/grid` | `activityName`, `experienceTypeIds[]`, `minComfortZoneStep`, `maxComfortZoneStep` | inclusive range |
| `memory-anchor/grid` | `activityName`, `minRating` | `anchorYear`/`anchorMonth` unchanged — **`F60` stands**, no alias for `year`/`month` |
| `activity-project-profile/grid` | `activityName`, `difficultyLevels[]`, `readinessStatuses[]` | any-of |

Types as asked: `number[]` for id lists, enum-name string arrays (`["High","Medium"]`, `["ReadyToStart"]`)
for the enum lists, `number | null` for ranges, `string | null` for names.

**All five business rules confirmed**, with four details the ask did not cover:

1. **Any-of, and an empty list is "no opinion", not "match nothing".** `roleIds: []` returns the same
   rows as omitting it — pinned by a test, so the combobox clearing its last chip to `[]` is safe.
   (`F18` still normalises it to `null`; that is now a tidiness fix, not a correctness one.)
2. **`activityName` is a case-insensitive contains on all four profile grids** — `ILIKE`, with `%` and
   `_` escaped as literals, same as the activity grid's `name`.
3. **Ranges are inclusive**, and `maxParticipants` **drops rows whose own `maxParticipants` is `null`**
   (an unbounded entry never fits under a cap). Offered as a one-line change if we want `null` rows to
   pass a cap; we do not — the reading matches the picker's question.
4. **`null` is "no opinion" everywhere, and whitespace-only strings are treated as `null`.**
5. **The existing scalars are kept** (`roleId`, `categoryId`, `energyLevel`, `effortType`,
   `comfortZoneStep`, `difficultyLevel`, `readinessStatus`, `activityId`), still exact-match. **Do not
   start sending them — the lists are the contract.**

Two null-column notes, flagged so nobody files them as bugs: `categoryIds` never matches an activity
with no category, and `effortTypes` never matches a backlog entry with no effort type.

**Tests — `GridFilterFieldNameTests`**, one per grid plus the empty-list pin. Each posts every field
under its **camelCase wire name as a raw JSON property** (so the test cannot pass by agreeing with the
server's PascalCase member), seeds a matching row and a decoy, and asserts the decoy is dropped —
no assertion is on the status code alone, because a 200 with rows is exactly what the bug looked like.
Adding a member to any of the five records means adding a case there.

### Frontend half: none. Verified by inspection 2026-09-15

All five client filter classes already carry exactly these names —
`ActivityFilter.ts` (`roleIds`, `categoryIds`), `ActivityBacklogProfileFilter.ts` (all nine),
`ActivityBucketListProfileFilter.ts` (all four), `ActivityProjectProfileFilter.ts` (all three),
`MemoryAnchorFilter.ts` (`activityName`, `minRating`). Nothing to rename, hide or re-encode;
`hasAny()`, the chips and the URL codecs were already correct.

One thing checked rather than assumed: the client's enums declare **camelCase values** per CLAUDE.md
(`EnergyLevel.High = 'high'`, `ReadinessStatus.ReadyToStart = 'readyToStart'`), so the wire payload is
`["high"]`, not the `["High"]` of the reply's example. `JsonStringEnumConverter` matches enum names
**case-insensitively**, so both spellings bind — but it is the one place where a future
`[JsonStringEnumConverter(JsonNamingPolicy.CamelCase)]`-style tightening on either side would break
silently, in the same "200 with the wrong rows" way this whole ask was about.

**Still app-side, unchanged by this:** `F18` (the mount-time combobox rebuild wiping URL ids) and `F60`
(the memory-anchor `year`/`month` → `anchorYear`/`anchorMonth` rename). Both verification blocks that
said "check the request, not the table" can now check the table.
