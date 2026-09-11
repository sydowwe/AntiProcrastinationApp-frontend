# B7 — grid sort-key audit: one sortable column the remap missed, and the nested-vs-flat decision

> Written 2026-09-11 by reading the client's column definitions and response DTOs, **not** by probing the API.
> Every "resolves / does not resolve" claim below is about what the *client emits*; the right-hand side is
> matched against the row key sets measured in [`B6`](B6-profile-grid-activity-name.md) on the still-running
> old build. Re-check the two `activity.text` rows in §3 against the projection — I cannot see it from here.

**Repo:** the .NET 10 / FastEndpoints backend, not this one.
**Follows:** [`B2`](B2-grid-500-on-unmapped-sortby.md) (the remaps) and
[`B6`](B6-profile-grid-activity-name.md) (the contract question). This is the audit B2's closing note asked
for — *"a new sortable column added to any of these tables can reintroduce it"* — done exhaustively across
every grid in the app rather than per view.
**Effort:** one line for §1; §2 is ~15 minutes either way. **Risk:** low.

## The two things that need a decision

1. **`memory-anchor/grid` has a second sortable column emitting `activity.name`.** The B2 remap covers only
   `periodKey` for that endpoint, so the grid still 500s the moment anyone clicks the *Activity* header.
2. **The flat `activityName` added in B6 does not reach the screen.** All four client DTOs parse a **nested**
   `activity` object and nothing reads `row.activityName`. Details and the price of each option in §2.

Everything else in this file is confirmation that the rest of the app is clean, recorded so the next person
does not re-derive it.

---

## How the client decides what to send

Worth stating, because it explains why three of these 500 on *first paint* rather than on a click, and why a
column marked non-sortable is still a latent hazard.

**Two sources**, not one:

1. **Header clicks** — only on columns with `isSortable !== false`
   (`src/_common/composable/table/TableHeaderComposable.ts:31`). `multiSort` is on
   (`src/_common/component/dataTable/DataTable.vue:14`), so keys **accumulate** in one request.
2. **An auto-push on mount** — `src/_common/component/dataTable/BasicTable.vue:191-202` pushes
   `columns[0].key` into `sortBy` **regardless of whether that column is sortable**, and *appends* rather than
   replaces. None of the four leisure tables sets `defaultSortBy`, so `sortBy` starts `[]` and the first
   column's key becomes the initial and only sort. That is the whole of the first-paint 500.

A third, slower source: `sortBy` round-trips through the URL
(`src/_common/composable/table/useTableUrlState.ts:40-62`), so a bookmarked or shared
`?sortBy=activity.name:asc` survives any change made on either side. **Please keep the B2 remaps in place even
if §2 makes them redundant** — retiring them re-breaks old links.

---

## §1 — the column the remap missed

`POST /api/memory-anchor/grid`, from
`src/core/leisure/component/memoryAnchor/MemoryAnchorTable.vue:114-120`:

| Key | Sortable | Emitted how | Resolves today? |
| --- | --- | --- | --- |
| `periodKey` | yes | auto-push on mount + click | no — **remapped by B2** |
| **`activity.name`** | **yes** | **click** | **no — NOT remapped** |
| `rating` | yes | click | yes |
| `source` | no | — | no (no such field on the response) |
| `highlightNote` | no | — | yes |

`memory-anchor` is also one of the three responses that carries no activity name at all (B6's table), so
there is nothing for a flat remap to point at until B6 is answered. Either answer in §2 fixes it:
nesting makes `activity.name` resolve natively; adding flat `activityName` makes the same
`activity.name → activityName` remap available here as on the other three.

### Verification

`POST /api/memory-anchor/grid` with `sortBy: [{"key":"activity.name","isDesc":false}]` returns **200**, and
with `sortBy: [{"key":"periodKey","isDesc":true},{"key":"activity.name","isDesc":false}]` returns **200** with
rows ordered newest-period-first, then by activity name.

---

## §2 — nested vs flat: the client is written against **nested**

This is the B6 question, and the client's side of it is no longer ambiguous. **All four DTOs parse a nested
`activity` object. None reads a flat `activityName`. There is no client-side lookup to delete.**

| DTO | Line |
| --- | --- |
| `src/core/leisure/dto/response/ActivityProjectProfile.ts` | `:44` → `ActivityInfo.fromJson(activity)` |
| `src/core/leisure/dto/response/ActivityBucketListProfile.ts` | `:39` → same |
| `src/core/leisure/dto/response/ActivityBacklogProfile.ts` | `:54` → same |
| `src/core/leisure/dto/response/MemoryAnchor.ts` | `:38` → same |

`ActivityInfo` is `{ id, name, categoryName, icon, color }`, and `fromJson` defaults `activity = {}`, so a
missing object yields `name: ''`. Every column renders
`<ActivityNameCell :activity="item.activity" />`, which prints `activity.name || '—'` and draws
`activity.icon` in `activity.color`.

**So all four grids render an em dash today — including `activity-backlog-profile`, which already returns the
flat `activityName` you added.** It is not being read. There is no second request, no store lookup and no
join against `/activity/all-options` to remove; B6's option B was never implemented.

### What each answer costs

- **Nested `activity: { id, name, categoryName, icon, color }` on all four** — zero frontend change. The names
  appear, the icons and colours appear, **and `activity.name` resolves natively on all four routes**, which
  retires the §1 problem and makes the B2 remaps belt-and-braces for old URLs rather than load-bearing.
- **Flat `activityName` on all four** — the remaps stay load-bearing, and the client needs four DTO rewrites
  plus a rewrite of `ActivityNameCell`. `icon` and `color` would have to come across as `activityIcon` /
  `activityColor` or the cell loses them, which makes the flat shape three fields wide anyway.

That asymmetry is the whole recommendation. B6 §"What done looks like" item 5 asked the client to say which
shape it is written against; the answer is nested.

### Three adjacent breakages from the same drift

Not sort-related, same root cause, all currently visible:

- **`activity-backlog-profile/grid` sends `isRepeatable`; the client reads `isOneTime`**
  (`ActivityBacklogProfile.ts:44`). So `item.isOneTime` is permanently `false`: the star/rotate icon never
  flips, and `ExperiencedCell`'s `eligible` prop is always false, which disables the "mark experienced"
  affordance on every backlog row.

  **Closed on both sides — nothing to do, please just recheck.** The backend has since settled on
  `IsRepeatable` as the single name (the filter's `IsOneTime` alias is gone, and
  `MemoryAnchorResponse.BacklogIsOneTime` became `BacklogIsRepeatable`, projected as `(bool?)p.IsRepeatable`
  rather than its negation). The client has been renamed to match, all the way through: response, request,
  filter, URL param, table column, filter chip, locale key, and `MemoryAnchor.backlogIsRepeatable`. The
  user-facing spots that read as a polarity were flipped with it — the checkbox is now "Repeatable activity"
  / "Opakovateľná aktivita", the star-vs-rotate icon swapped, and the two Source-column tests became
  `backlogIsRepeatable === false`. Pinned by `src/core/leisure/dto/activityBacklogProfileIsRepeatable.test.ts`.

  **What to recheck**, since these two renames were done independently and only meet over the wire: that no
  endpoint still emits or binds `isOneTime` under any spelling, and that `BacklogIsRepeatable` really is
  `null` (not `false`) when `HasBacklog` is false — the client's Source column depends on that distinction
  and would silently label repeatable entries as anchored if it collapsed to `false`.
  `ProfileGridSortKeyTests.cs:255` looks like it already asserts exactly this.

  The write half of this was never recorded here and was the worse bug while it lasted:
  `ActivityBacklogProfileRequest` (C#) binds only `IsRepeatable`, so a body carrying `isOneTime` left it at
  the `bool` default. Every backlog entry saved as one-time whatever the checkbox said, and editing a
  repeatable entry silently converted it.
- ~~**`memory-anchor/grid` omits `hasBucketList`, `hasBacklog`, `backlogIsOneTime`**, so the *Source* column
  always renders `—` and `openSource` (`MemoryAnchorTable.vue:124`) would navigate with an empty
  `activityName` query param.~~ **Fixed** — `GridMemoryAnchorEndpoint.cs:33` now projects through
  `MemoryAnchorResponse.ProjectionWithProfiles`, which carries all three (the third as
  `backlogIsRepeatable`). Same recheck as the bullet above: confirm the grid and the by-id read agree, since
  only the grid switched projection.
- **The four lookup columns arrive as bare ids.** `locationTypeId`, `weatherDependencyId`,
  `expectedCostTierId`, `experienceTypeId` — the client parses `locationType`, `weatherDependency`,
  `expectedCostTier`, `experienceType` as `LookupResponse` objects (`{id, text}`), so all four cells render
  `—`. Same nested-vs-flat question as the activity name, and the same answer resolves both.

One purely app-side consequence, recorded so it is not mistaken for a server issue:
`BacklogTable.vue:11` passes `deleteConfirmationColumn="activityName"`, which `BasicTable.vue:211` reads as
`item['activityName']` → `undefined`, so the delete dialog names nothing. **That is a frontend bug and is
tracked app-side** — it would coincidentally start working under the flat shape, which is not a reason to
choose it.

---

## §3 — every sort key every grid in the app can emit

All 13 live `POST …/grid` call sites, traced from every `new FilteredTableRequest` construction plus every
`useServerTable` / `useLookupTable` / `useFetchFilteredTable` consumer. Read against the row key sets in
[`B6`](B6-profile-grid-activity-name.md).

### The four ActivityProfiles grids

**`activity-backlog-profile/grid`** — `src/core/leisure/component/backlog/BacklogTable.vue:121-131`

| Key | Sortable | Emitted how | Resolves? |
| --- | --- | --- | --- |
| `activity.name` | yes | **auto-push on mount** + click | no — remapped (B2) |
| `durationMinutes` | yes | click | yes |
| `locationType` | no | — | no — response has `locationTypeId` |
| `weatherDependency` | no | — | no — `weatherDependencyId` |
| `expectedCostTier` | no | — | no — `expectedCostTierId` |
| `isRepeatable` | no | — | yes — client renamed off `isOneTime` (§2) |
| `energyLevel`, `isAnchored` | no | — | yes |

**`activity-bucket-list-profile/grid`** — `BucketListTable.vue:100-112`. Table is the **default** view mode,
so the mount-time `activity.name` fires on every visit.

| Key | Sortable | Emitted how | Resolves? |
| --- | --- | --- | --- |
| `activity.name` | yes | **auto-push on mount** + click | no — remapped (B2) |
| `comfortZoneStep`, `financialGoal` | yes | click | yes |
| `experienceType` | no | — | no — `experienceTypeId` |
| `isAnchored`, `requiresTravel`, `inspirationSource` | no | — | yes |

**`activity-project-profile/grid`** — `ProjectTable.vue:80-87`. Board is the default mode and sends
`sortBy: []`; the table only mounts on `?view=table`.

| Key | Sortable | Emitted how | Resolves? |
| --- | --- | --- | --- |
| `activity.name` | yes | **auto-push on mount** + click | no — remapped (B2) |
| `estimatedHours` | yes | click | yes |
| `difficultyLevel`, `readinessStatus`, `projectArea`, `isMessy` | no | — | yes |

**`memory-anchor/grid`** — see §1.

**`activity.name` is the only dotted key any of the four emits.** There is no `locationType.name`,
`weatherDependency.name`, `expectedCostTier.name` or `experienceType.name` anywhere — those columns use bare
keys and are all non-sortable. The bare keys in the "no" rows above are **latent**, not live: they cannot be
emitted by a click today, but they would 500 if anyone flipped one to sortable, and they are reachable now via
a hand-edited `?sortBy=` URL.

### Clean — every key flat and present on the response

| Route | Keys it can emit |
| --- | --- |
| `reminder-definition/grid` | `nextOccurrenceAt` (default), `ownerModule` (auto-push), `subjectType`, `kind`, `status` |
| `reminder-dashboard/upcoming` | `nextOccurrence` (default), `kind` (auto-push), `ownerModule`, `status` |
| `reminder-dashboard/my-upcoming` | `nextOccurrence` (default), `kind` (auto-push), `ownerModule` |
| `reminder-dashboard/dispatch-history` | `dispatchedAt` (default + auto-push) |
| `scheduler-dashboard/jobs-overview` | `nextRunAt` (default), `jobKey` (auto-push), `ownerModule`, `status`, `lastRunAt` |
| `scheduler-dashboard/run-history` | `startedAt` (default + auto-push), `outcome`, `triggerSource` |
| `activity/grid` | `name` (auto-push), `usageCount` |
| `activity-category/grid` | `role` (auto-push), `name` — `Category.role` is a **flat string**, not an object |
| `activity-role/grid` | `name` (auto-push) |
| `…/tracker-desktop-distinct-entries/grid` | `processName` (default), `productName`, `windowTitle` |
| `…/tracker-android-distinct-entries/grid` | `appLabel` (default), `packageName` |

Note `activity/grid` also defines `role.name` and `category.name` columns
(`src/core/activity/component/ActivityTable.vue:178-179`), but both are non-sortable so neither is ever
emitted. The `Activity` DTO does parse nested `role` / `category` objects, so they would likely resolve if
turned on — **please confirm rather than assume**, since a unit pass may well propose making them sortable.

### The two I cannot settle from this repo — **please check these explicitly**

| Route | Key | Why it is open |
| --- | --- | --- |
| `activity-tracking/desktop/settings/tracker-desktop-mapping-by-pattern/grid` | **`activity.text`** | Sortable (`DesktopMappingsTable.vue:50`). Unlike leisure, the client here *is* written for a nested object — `TrackerDesktopMappingResponse.fromJson` reads `json.activity`, and `ActivityFilterFormResponse` is `{id, text, roleId, categoryId}` — so this plausibly resolves. I cannot see the projection. |
| `activity-tracking/android/settings/tracker-android-mapping-by-pattern/grid` | **`activity.text`** | Same, `AndroidMappingsTable.vue:48`. |

Both are on unit **06** (`tracking-settings`), whose tables are empty for fixture reasons
([`B3`](B3-seed-fixture-coverage.md)) — so a 500 here would currently be invisible behind the same false
empty state B2 describes.

### Not grids

`RoutineSettingsView.vue` and `RepeatingTasksTab.vue` both render a `BasicTable` over a `fetchAll()` GET;
their `sortBy` is Vuetify's client-side sort and never crosses the wire. `LookupEditTable.vue` and
`TableGrid.vue` carry the same auto-push and a `text` key but are **mounted nowhere in this app**.

---

## §4 — `periodKey` semantics: confirmed, with one caveat

`MemoryAnchor.periodKey` is a **client-side computed getter**, not a field
(`src/core/leisure/dto/response/MemoryAnchor.ts`):

```ts
get periodKey(): number { return this.anchorYear * 100 + this.anchorMonth }
```

It is a single composite ordinal, so expanding one column's single `isDesc` into `anchorYear` then
`anchorMonth` with the **same** direction is exactly what it means. Descending is newest-period-first. There
is no intended year-desc/month-asc reading, and the grid exposes **no separate Year or Month sortable
columns** — only `periodKey`. Year and month appear separately as *filter* fields
(`MemoryAnchorFilter.year` / `.month`), not sort keys, and the timeline view mode sends `sortBy: []`.

The column is titled with `leisure.fields.anchorMonth` and renders
`Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })` — *"September 2026"* — so a user reading the
header as "month" still gets the period-ordered result they expect.

**The caveat, because `multiSort` is on:** `periodKey` can arrive in any position, not just first —
`[{"rating",desc},{"periodKey",desc}]` and `[{"periodKey",asc},{"activity.name",asc}]` are both reachable by
two header clicks. The expansion must **splice the two keys in place at `periodKey`'s index**, not append
them. If it appends, a secondary period sort silently becomes the primary one and the page is ordered by
something the user did not ask for — the same "plausible-looking page in an arbitrary order" failure the
500-on-unmapped-key behaviour exists to prevent.

---

## What "done" looks like

1. `POST /api/memory-anchor/grid` with `sortBy: [{"key":"activity.name","isDesc":false}]` returns **200**.
2. B6 is answered **nested** (or flat, with the icon/colour fields named), and the four profile grids agree.
3. `/leisure/projects?view=table`, `/leisure/bucket-list`, `/leisure/backlog` and `/leisure/memory-anchors`
   each render the activity name in its first column instead of `—`, including for a profile whose activity is
   **archived** (`12010`) — B6's deciding case.
4. `sortBy: [{"key":"periodKey","isDesc":true},{"key":"rating","isDesc":false}]` and the same pair reversed
   both return **200**, each ordered by the key the user clicked **first**.
5. You have said whether `activity.text` resolves on the two tracker-mapping grids, and whether `role.name` /
   `category.name` would resolve on `activity/grid` if the client made them sortable.
6. ~~Backlog's `isRepeatable` / `isOneTime` mismatch is resolved one way or the other, and `memory-anchor/grid`
   either carries `hasBucketList` / `hasBacklog` / `backlogIsOneTime` or says it will not (in which case the
   client drops the *Source* column).~~ **Done on both sides — `IsRepeatable` is the single name and the grid
   carries all three. Recheck only, per §2.**

## Not yours

Tracked app-side, recorded only so the two halves are not each mistaken for the whole:

- `BacklogTable.vue:11`'s `deleteConfirmationColumn="activityName"` reads a field the DTO does not have.
- `BasicTable`'s unconditional auto-push of `columns[0].key` — pushing a key for a column the author marked
  **non-sortable** is wrong on its face, and it is why a bad first column fails on load rather than on a
  click. It lives in the `vue_framework` submodule, so changing it is a framework commit affecting other apps;
  it is not a reason to delay anything here.
