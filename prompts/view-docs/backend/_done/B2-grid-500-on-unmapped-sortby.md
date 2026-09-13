# B2 — a paged grid answers 500 when `sortBy` names a key it cannot map

> 🔧 **FIXED in the API working tree (2026-09-11), not yet deployed.** The answer chosen is neither of the two
> in *What "done" looks like* below — it is a third and better one: **remap the keys instead of rejecting
> them.** `GridSortKeyExtensions.ExpandSortKey` rewrites `activity.name` → `activityName` and
> `periodKey` → `anchorYear, anchorMonth` onto members that exist on the projected response, so **the client
> needs no change** and the *The other half* section below is moot for these views.
>
> **The general class is not fixed, deliberately.** An unresolvable key is still an `ArgumentException` out of
> `SortByMany` — i.e. still a 500, not a 400 or an unsorted page. A new sortable column added to any of these
> tables can reintroduce it. Worth knowing before a unit pass proposes one.
>
> ⚠️ **And one existing column was missed.** `memory-anchor/grid` has a *second* sortable column that emits
> `activity.name`; only `periodKey` was remapped for that endpoint, so its Activity header still 500s. Found by
> reading every column definition in the app — [`B7`](_done/B7-grid-sort-key-audit.md), which also lists every sort
> key every grid can emit and flags two `activity.text` keys on the tracker-mapping grids that need checking.
>
> Against the still-running old build every case in this file reproduced unchanged, so **re-verify after the
> rebuild** with step 5 of *Verification*.

> Measured 2026-09-11 against a local API + local Postgres, signed in as the seed's `primaryUser` (id 10001),
> fixture `e2e-v1`. Every status below was observed, not inferred.

**Repo:** the .NET 10 / FastEndpoints backend, not this one.
**Blocks:** units **11** (`leisure-backlog-picker`), **12** (`leisure-bucket-anchors`), **16**
(`reminders-user`), and the table half of unit **13** (`leisure-projects`).
**Effort:** small. **Risk:** low — this is error handling on a path that currently throws.

## What this replaces

The runbook used to carry **three** separate "opaque `errorId` 500" asks — `activity-backlog-profile/grid`
(`73e7261d482b`), `activity-bucket-list-profile/grid` (`a2c8d4d3b9cb`) and `reminder-dashboard/my-upcoming`
(`590edbaf1ac1`). They are **one bug**, reproduced below on six different endpoints including one that is not
a `/grid` route at all. File once, fix once.

An earlier hypothesis said the trigger was a **nested** `sortBy` path (a key containing a dot). **That is
refuted.** A dot-free key that is simply not a column fails identically. The trigger is *unmappable*, not
*nested*.

## The trigger

Same route, same filter, same page size — **only `sortBy` differs**:

| `sortBy` | Result |
| --- | --- |
| `[]` | **200** |
| `[{"key":"id","isDesc":false}]` — a mapped column | **200** |
| `[{"key":"activity.name","isDesc":false}]` — nested path | **500** |
| `[{"key":"zzzNotAColumn","isDesc":false}]` — **no dot**, not a column | **500** |

Reproduced on all five `/grid` endpoints with identical results (`activity`, `memory-anchor`,
`activity-backlog-profile`, `activity-bucket-list-profile`, `activity-project-profile`), and on
`reminder-dashboard/my-upcoming`, which is not a `/grid` route — so it lives in a shared sorting or
projection layer, not in any one endpoint.

Two further observations that should help locate it:

- **Key matching is case-insensitive.** On `activity-project-profile`, `ID` → **200** but `Name` → **500**
  (that entity has no `name` column; `id` does exist). So the lookup succeeds case-insensitively and the 500
  is what happens on a *miss*.
- **The response DTO's field set is not the sortable set.** `activity-backlog-profile/grid` returns
  `energyDemandId` in every row, but `sortBy: [{"key":"energyDemandId"}]` → **500**.

### One full request/response pair

Captured from a real browser navigation to `https://localhost:3000/leisure/projects?view=table` — the client
derives `sortBy` from the URL, so this is the exact payload a user produces by opening that page.

```
POST https://localhost:8080/api/activity-project-profile/grid
content-type: application/json
accept: application/json
referer: https://localhost:3000/
```

```json
{
  "itemsPerPage": 25,
  "page": 1,
  "sortBy": [{ "key": "activity.name", "isDesc": false }],
  "useFilter": true,
  "filter": {
    "activityName": null,
    "difficultyLevels": null,
    "readinessStatuses": null,
    "projectArea": null,
    "isMessy": null
  }
}
```

```
HTTP/1.1 500  (148 ms)
content-type: application/json; charset=utf-8
server: Kestrel
```

```json
{
  "errorId": "964e0d840899",
  "message": "The request could not be completed. Quote the error id when reporting this."
}
```

Fresh `errorId`s from the same run, if more than one stack is useful:
`1a3012038865` (`activity-project-profile`, `activity.name`), `eff5ec25b298` (same endpoint, `zzzNotAColumn`),
`d50243fe1568` (`activity`, `zzzNope`), `209b209669fb` (`memory-anchor`, `periodKey`),
`b9cc6abc4909` (`activity-backlog-profile`, `energyDemandId`),
`39ae9fe5c447` (`reminder-dashboard/my-upcoming`, `nextOccurrence`).

## Why it matters more than a 500 usually does

The client's table component treats the failed request as "no rows" and renders its **empty state**. So
`/leisure/backlog` currently says

> *These are things you could do. You don't have any here yet.*

while the fixture does contain a backlog profile (`profiles.backlog` = 17001), and the same request with
`sortBy: []` returns it. Three views make the same false claim:

| View | `sortBy` it sends | What the user sees |
| --- | --- | --- |
| `/leisure/backlog` | `activity.name` | "You don't have any here yet" |
| `/leisure/bucket-list` | `activity.name` | "You don't have any here yet" |
| `/leisure/memory-anchors` | `periodKey` | "You don't have any memory anchors here yet" |
| `/pripomienky/moje` | `nextOccurrence` | "No data available" |
| `/leisure/projects?view=table` | `activity.name` | empty table |

A 500 that renders as a confident empty state is the worst available outcome: it is indistinguishable from
real emptiness, both to a user and to the documentation sweep this ask exists to unblock.

`/activity-settings/activities` is the control case — it sorts by the flat, mapped column `name` and returns
**200** with 10 rows.

## What "done" looks like

**The behaviour that is wrong is the 500.** A sort key is client input; an unrecognised one is a bad request
or a no-op, never an unhandled exception. How to do that inside the API is your call, but the choice has a
consequence worth knowing before you make it:

- **If an unmapped key returns `400` with the offending key named** — the defect is fixed and the views become
  diagnosable, but they stay empty until the client stops sending those keys (see *The other half*, below).
- **If an unmapped key is ignored and the default order is used** — the defect is fixed *and* units 11, 12, 16
  and 13's table view unblock immediately with no client change.

Either is a legitimate answer. Please say which you chose, because it decides whether the frontend work below
is blocking or merely tidying.

Also worth answering while you are in here, since four views want it: **is sorting by a related entity's
property (`activity.name`) intended to be supported at all?** Today no nested path works on any endpoint. If
the answer is no, say so and the client will stop asking.

### Verification

1. `POST /api/activity-backlog-profile/grid` with `sortBy: [{"key":"zzzNotAColumn","isDesc":false}]` returns
   **400 or 200 — never 500**, and the response body names the rejected key if it is a 400.
2. The same request with `sortBy: [{"key":"activity.name","isDesc":false}]` behaves identically to (1).
3. `sortBy: []` and `sortBy: [{"key":"id"}]` still return **200** with rows — no regression.
4. Repeat (1) against `reminder-dashboard/my-upcoming`, which is not a `/grid` route, to confirm the fix is in
   the shared layer rather than in one endpoint.
5. If you chose "ignore unknown keys": open `https://localhost:3000/leisure/backlog` signed in as the seed's
   primary user and confirm the backlog profile row renders instead of the empty state.

## The other half — not yours

Recorded here only so the two halves are not each mistaken for the whole. **These are frontend fixes and are
tracked app-side; no action needed in the API repo:**

- `/pripomienky/moje` sends `nextOccurrence`; the mapped column is `nextOccurrenceAt`, which returns **200**.
  `/pripomienky/register` already sends the correct `nextOccurrenceAt`.
- `/leisure/backlog` sends `activity.name`; that grid already returns a flat `activityName` field, and
  `sortBy: [{"key":"activityName"}]` returns **200**.
- `/leisure/memory-anchors` sends `periodKey`, which is a client-side composite with no server column.
  `anchorYear` and `anchorMonth` both exist and return **200**.
- `/leisure/projects?view=table` and `/leisure/bucket-list` send `activity.name`, and neither entity exposes
  the activity name as a flat column — those two depend on the contract question in
  [`B6-profile-grid-activity-name.md`](_done/B6-profile-grid-activity-name.md).
