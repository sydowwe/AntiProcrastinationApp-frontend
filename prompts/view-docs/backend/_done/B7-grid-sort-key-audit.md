# B7 — grid sort-key audit: one sortable column the remap missed, and the nested-vs-flat decision

> ## ✅ Answered in full — 2026-09-13
>
> Backend `fa47560` plus the archived follow-up. Every section is settled; the audit's two "things that need a
> decision" both resolve, and **neither resolved the way this file proposed.**
>
> - **§1 — fixed by shape, not by a remap, and the remap is gone.** `MemoryAnchorResponse` derives from
>   `WithActivityResponse`, so **`activity.name` resolves natively on all four profile grids**, along with
>   `activity.role.name` and `activity.category.name` (the conditional category projection left-joins, so
>   uncategorised rows sort as null rather than disappearing). This file asked to *keep* the
>   `activity.name → activityName` remaps for old bookmarked URLs; they were **deleted**, and that is safe —
>   the key those URLs carry is `activity.name`, which is exactly the key that now resolves on its own. The
>   remap only ever pointed it at a flattened member that no longer exists. `periodKey` keeps its expansion,
>   which is the case a remap is actually for.
> - **§2 — nested.** See [`B6`](B6-profile-grid-activity-name.md) for the payload. The flat
>   `activityName` is gone with no alias; the four lookups now arrive as `{id, text}` objects beside their ids.
>   **What this audit did not anticipate:** the grids send the **full `ActivityResponse`**, not the
>   `{id, name, categoryName, icon, color}` shape `ActivityInfo` parses — that flat shape survives only on
>   `/leisure/suggestion/draw`. Two shapes under one key, by route. Names render off the grids;
>   `categoryName`/`icon`/`color` will not until `ActivityInfo` derives them as `category ?? role`.
> - **§3 — both open rows resolve, and the confirmation is yes.** `activity.text` lands on a real member for
>   both mapping grids (`TrackerDesktopMappingResponse.cs:42`, `TrackerAndroidMappingResponse.cs:37`, each
>   projecting `ActivityFilterFormResponse { Id, Text = Activity.Name, RoleId, CategoryId }` through
>   `BaseGridEndpoint`). `role.name` / `category.name` **would** resolve on `activity/grid` if made sortable
>   (`GridActivityEndpoint.cs:85-86`) — safe to turn on. Note `activity` is **nullable** on the two mapping
>   grids (an unmapped pattern), so an `activity.text` sort orders those rows as null: Postgres puts nulls
>   last ascending, first descending. Not a bug.
> - **The latent bare keys stay latent, with one change:** the four lookup columns now exist as objects, so a
>   sortable one must send **`locationType.text`, not `locationType`**.
>   ⚠️ **Measured 2026-09-13, and it contradicts the reply:** a bare `locationType` returns **500**
>   (`errorId be94ee6d327f`), *not* the 400 the API stated. `locationType.text` returns 200. See the
>   correction note at the bottom of this block.
> - **§4 — `periodKey` in a secondary position works.** The expansion is a `SelectMany` over the sort array
>   (`SortKeyExtensions.ExpandSortKey`), so the two members splice in at `periodKey`'s own index and every
>   other key keeps its position. Both inherit the column's single `isDesc`, so descending is
>   `anchor_year DESC, anchor_month DESC` and never a mix. `[{rating,desc},{periodKey,desc}]` orders by rating
>   first, as clicked. **Honest gap the API flagged:** integration tests pin `periodKey` only as the *sole*
>   sort key. The splice is right by construction but nothing asserts a multi-key ordering — **the two-click
>   combinations in §4 are the cheapest place for us to catch a regression**, and that is now an e2e ask on
>   this side.
> - **§2's three adjacent breakages — all three settled.** `isRepeatable` is the single name, read and write;
>   no `isOneTime` survives anywhere in the solution except a comment recording its deliberate removal, which
>   closes the write-half concern about the binder silently defaulting it. `backlogIsRepeatable` is genuinely
>   `null` (not `false`) with no backlog entry — `(bool?)p.IsRepeatable` over a correlated subquery, pinned by
>   an integration test. `memory-anchor/grid` computes `hasBucketList`/`hasBacklog`/`backlogIsRepeatable` in
>   the projection so they sort in SQL. **Grid and by-id deliberately disagree**: `memory-anchor/{id}` leaves
>   all three at `false`/`false`/`null`, because the profiles are not reachable from the anchor and that
>   projection has no `DbContext` to reach them with. A Source cell on the edit form would read as "from
>   nowhere" — **the API offered to add them to by-id on request.**
>
> ### Two corrections to this file's model of the backend
>
> 1. **An *unknown* sort key is a `400` naming the key, not a `500`** — but **only an unknown one**.
>    `InvalidSortKeyException` → `InvalidSortKeyMiddleware`, logged at Warning. The two tracker-distinct
>    endpoints were swallowing it into a generic 500 and now rethrow explicitly.
>
>    ⚠️ **Verified 2026-09-13 against the running API, and the general claim does not hold.** Probing
>    `activity-backlog-profile/grid`:
>
>    | `sortBy` key | status | body |
>    | --- | --- | --- |
>    | `zzzNotAColumn` | **400** | `{"errors":{"sortBy":["Unknown sort key 'zzzNotAColumn'."]}}` |
>    | `locationType` (names an object) | **500** | `{"errorId":"be94ee6d327f", …}` |
>    | `locationType.text` | **200** | rows |
>
>    So the fix covers *unrecognised* keys, not keys that **resolve to a non-scalar member**. The second row
>    is the one a real column definition would produce, and it is still an opaque 500 behind a false empty
>    state — i.e. `B2`'s general class is **narrower than reported**. Not filed as a new ask here; recorded in
>    `docs/views/_fix-queue.md` for the owner of that surface, per the close-out runbook.
> 2. **The archived case is not uniform, which changes this file's "done" item 3.** `memory-anchor` keeps the
>    row and renders the name for an archived activity (the filter is lifted by name on grid *and* by-id). The
>    three `Activity*Profile` grids **drop the row entirely**, count included — the failure mode there is an
>    absent row, not a blank name. Expect `12010` on `/leisure/memory-anchors` and absent from the other three.
>
> ### Left standing on the client, unchanged by any of this
>
> `BacklogTable.vue:11`'s `deleteConfirmationColumn="activityName"` reads a field that **no longer exists on
> the response at all**. It is now unambiguously a client fix; `activity.name` is the value it wants.

> Written 2026-09-11 by reading the client's column definitions and response DTOs, **not** by probing the API.
> Every "resolves / does not resolve" claim below is about what the *client emits*; the right-hand side is
> matched against the row key sets measured in [`B6`](B6-profile-grid-activity-name.md) on the still-running
> old build. Re-check the two `activity.text` rows in §3 against the projection — I cannot see it from here.

**Repo:** the .NET 10 / FastEndpoints backend, not this one.
**Follows:** [`B2`](B2-grid-500-on-unmapped-sortby.md) (the remaps — since superseded; see B2's close-out) and
[`B6`](B6-profile-grid-activity-name.md) (the contract question). This is the audit B2's closing note asked
for — *"a new sortable column added to any of these tables can reintroduce it"* — done exhaustively across
every grid in the app rather than per view.
**Effort:** one line for §1; §2 is ~15 minutes either way. **Risk:** low.

## The two things that need a decision

> ⛔ **Both decided — see the block at the top of this file.** Item 1 no longer reproduces: `activity.name`
> resolves natively, so the *Activity* header click returns 200. Item 2 was answered **nested**.

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
