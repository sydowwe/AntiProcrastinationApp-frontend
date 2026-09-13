# B2 — a paged grid answers 500 when `sortBy` names a key it cannot map

> ✅ **ANSWERED AND DEPLOYED — 2026-09-13. Both halves, not one.** Verified against the running local API on
> fixture `e2e-v3`, signed in as the seed's `primaryUser`. This block replaces an earlier note describing a
> narrower, remap-only fix (`GridSortKeyExtensions`); **that fix and that file are gone** — ignore any doc
> still describing it.
>
> **1. The 500 is gone in the general case.** An unresolvable sort key is now a **400 naming the key**, never a
> 500 and never a silently unsorted page. Measured:
>
> ```
> POST /api/activity-backlog-profile/grid   sortBy: [{"key":"zzzNotAColumn"}]   → 400
> {"statusCode":400,"message":"One or more errors occurred!",
>  "errors":{"sortBy":["Unknown sort key 'zzzNotAColumn'."]}}
> ```
>
> It is the shape the grid base already uses for page/page-size errors: `errors.sortBy[]`, the offending key
> echoed (truncated at 64 chars), **no `errorId`**. *If a body carries an `errorId`, that is still an unhandled
> 500 and a different bug — report it.* Same 400 on `reminder-dashboard/my-upcoming`, which is not a `/grid`
> route, so the fix is in the shared layer as asked.
>
> **2. Every key the five broken views already send now resolves,** so they return 200 *with rows* and need no
> client change. **Units 11, 12, 16 and 13's table view are unblocked.** *The other half* below is now tidying,
> not blocking.
>
> **3. "Is sorting by a related entity's property supported?" — yes.** The B6 reshape nests the whole
> `ActivityResponse` on the row, so `activity.name` resolves **natively**, and so do `activity.role.name` and
> `activity.category.name` (all three measured 200 on `activity-project-profile/grid`). The rule is
> *resolvable*, never *nested*: `activity.zzz` → 400, exactly like a dot-free non-column. **The old "nesting is
> the trigger" hypothesis is dead** — see *The trigger* below, which is now history.
>
> **Measured this pass** (200 unless stated): `activity-backlog-profile/grid` · `activity.name`, `[]`;
> `activity-bucket-list-profile/grid` · `activity.name`; `activity-project-profile/grid` · `activity.name`,
> `activity.role.name`, `activity.category.name`, and `activity.zzz` → **400**; `memory-anchor/grid` ·
> `periodKey` **and** `activity.name` — so [`B7` §1](B7-grid-sort-key-audit.md)'s missed column is closed
> too; `reminder-dashboard/my-upcoming` · `nextOccurrence`, `nextOccurrenceAt`, and `zzzNotAColumn` → **400**.
>
> **One wording correction to the backend's own note:** the message reads `Unknown sort key 'x'.`, not
> `Sort key 'x' does not resolve on …`. The shape is as described; only the sentence differs. Render the
> `errors.sortBy[]` array, not a match on its text.
>
> **Two keys to know about going forward.** `periodKey` is a genuine **composite**, supported permanently —
> the server expands it to `anchorYear, anchorMonth` and both inherit the single `isDesc` you send, so desc is
> `anchorYear DESC, anchorMonth DESC`, never mixed. `nextOccurrence` is a **compatibility alias only**,
> accepted on all three reminder reads (`reminder-dashboard/my-upcoming`, `reminder-dashboard/upcoming`,
> `reminder-definition/grid`) so the three stop disagreeing; the backend asks us to migrate
> `/pripomienky/moje` to `nextOccurrenceAt` at our convenience so they can drop it.
>
> **What has not changed, and still binds us:** a key the server has never heard of is a hard failure — now a
> 400 instead of a 500. A new sortable column header must emit the name of a member of the **projected response
> DTO**, not a field of the entity, and not every field visible in a row qualifies. Send it once against the
> endpoint; a 400 names it immediately.
>
> **One thing to fix on our side regardless.** The table component renders its **empty state for a failed
> request**, which is what let one bug be filed three times — a 400 and a genuinely empty list are
> indistinguishable on screen. An error state distinct from the empty state would have caught this in minutes.
> Tracked app-side in `docs/views/_fix-queue.md`; not a backend concern.

> Measured 2026-09-11 against a local API + local Postgres, signed in as the seed's `primaryUser` (id 10001),
> fixture `e2e-v1`. Every status below was observed, not inferred.

**Repo:** the .NET 10 / FastEndpoints backend, not this one.
**Blocked** (past tense as of 2026-09-13) units **11** (`leisure-backlog-picker`), **12**
(`leisure-bucket-anchors`), **16** (`reminders-user`), and the table half of unit **13** (`leisure-projects`).
All four are now runnable.
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

> **Settled 2026-09-13 — none of this is blocking any more.** Every key below now returns **200 with rows** as
> sent. Only one line survives as work, and it is a rename for the backend's benefit, not ours. Per-view state
> as of the close-out:
>
> | View | Sends | Works? | Action |
> | --- | --- | --- | --- |
> | `/leisure/backlog` | `activity.name` | ✅ natively | **keep** |
> | `/leisure/bucket-list` | `activity.name` | ✅ natively | **keep** |
> | `/leisure/projects?view=table` | `activity.name` | ✅ natively | **keep** |
> | `/leisure/memory-anchors` | `periodKey` | ✅ server expands to `anchorYear, anchorMonth` | **keep** — it is one column to us |
> | `/pripomienky/moje` | `nextOccurrence` | ✅ alias for `nextOccurrenceAt` | **migrate** to `nextOccurrenceAt` so the alias can be dropped |

Recorded here only so the two halves are not each mistaken for the whole. **These are frontend fixes and are
tracked app-side; no action needed in the API repo:**

- `/pripomienky/moje` sends `nextOccurrence`; the mapped column is `nextOccurrenceAt`, which returns **200**.
  `/pripomienky/register` already sends the correct `nextOccurrenceAt`. ⬅ **the one item still outstanding.**
- ~~`/leisure/backlog` sends `activity.name`; that grid already returns a flat `activityName` field, and
  `sortBy: [{"key":"activityName"}]` returns **200**.~~ `activity.name` resolves natively now; do **not**
  migrate to `activityName`, which no DTO reads.
- ~~`/leisure/memory-anchors` sends `periodKey`, which is a client-side composite with no server column.
  `anchorYear` and `anchorMonth` both exist and return **200**.~~ `periodKey` is a supported composite and is
  the key to keep sending.
- ~~`/leisure/projects?view=table` and `/leisure/bucket-list` send `activity.name`, and neither entity exposes
  the activity name as a flat column — those two depend on the contract question in
  [`B6-profile-grid-activity-name.md`](B6-profile-grid-activity-name.md).~~ B6 was answered with the nested
  shape, which is what makes `activity.name` resolve.
