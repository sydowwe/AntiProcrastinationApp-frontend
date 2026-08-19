# B1 backend ask — completion on the bucket list and the one-time backlog

The frontend now closes the loop the backend already half-models: a memory anchor is the *completion*
of a one-time experience (`MemoryAnchor` already returns `hasBucketList`, `hasBacklog` and
`backlogIsOneTime`, and `GET /memory-anchor/anchor-eligible-activities` already knows which activities qualify). The inverse — *has this bucket list entry been
anchored?* — is information the backend demonstrably has and does not currently return.

Everything on the frontend side is already merged and shipping. Each new field is read with a `null`
default in `fromJson`, so until this lands the completion column shows only the "I did this" action, the progress readout hides itself entirely, and nothing
regresses. No frontend change is needed when the fields appear — they light up on their own.

## Two existing endpoints must carry two new fields

`POST /activity-bucket-list-profile/filtered-table`
`POST /activity-backlog-profile/filtered-table`

Both already return `{ items: [...], itemsCount: n }`. Each element of `items` gains:

| field            | type             | nullability                                                                                          |
|------------------|------------------|------------------------------------------------------------------------------------------------------|
| `isAnchored`     | `boolean`        | non-null on the bucket list. On the backlog: non-null; `false` for any entry that is not `isOneTime` |
| `memoryAnchorId` | `number` (`int`) | nullable — `null` whenever `isAnchored` is false                                                     |

JSON names exactly as written (camelCase); those are the keys
`ActivityBucketListProfile.fromJson` / `ActivityBacklogProfile.fromJson` destructure.

`memoryAnchorId` is not consumed by a screen yet — the "Experienced" chip currently navigates to the anchors table filtered by activity name. It is asked for here
because it is the field that makes the link exact rather than name-matched, and adding it later means a second pass over the same DTO. Drop it if it is expensive;
the frontend degrades to the name filter it already uses.

## The same two endpoints' filter object gains one field

The request body is the existing `FilteredTableRequest` shape (`{ itemsPerPage, page, sortBy, useFilter, filter }`). The `filter` object gains, on both endpoints:

| field        | type               | meaning                                                               |
|--------------|--------------------|-----------------------------------------------------------------------|
| `isAnchored` | `boolean` nullable | `null` → not filtered; `true` → only anchored; `false` → only not yet |

Tri-state, same convention as the `isOneTime` and `requiresTravel` fields already on these filters. The frontend sends it from three places: the filter panel's
checkbox, and the two count-only requests behind the "4 of 17 experienced" readout (page size 1, `useFilter: true`, reading `itemsCount` only — one with
`isAnchored: null`, one with `isAnchored: true`; the backlog pair additionally sets
`isOneTime: true`).

## One new accepted sort key

`sortBy` should accept `{ key: "isAnchored", order: "asc" | "desc" }` on both endpoints.

The frontend does **not** send it today, in any form: the completion column is rendered non-sortable and the default sort is untouched. An unknown sort key can fail
the whole page rather than degrade to "unsorted", and neither a default nor a clickable header is worth handing the user that failure before the key exists.

When this lands, the frontend change is two lines and it is worth making in the same pass:

- `TableColumn('isAnchored', …, false)` → `true` in `BucketListTable.vue` and `BacklogTable.vue`, so the header becomes clickable.
- `defaultSortBy: [new VSortItem('isAnchored', 'asc'), new VSortItem('activity.name', 'asc')]` on
  `bucketListFilterUrlState()` in `../../../../src/core/leisure/composable/leisureFilterUrlState.ts`, which is what puts the done entries out of the way of the
  undone ones by default.

Say so when the key is live and both will be flipped.

## Out of scope for this file

How "anchored" is derived, where it is stored, whether it is computed or persisted, entity and migration decisions, cascade behaviour when an anchor is deleted, and
whether an already-anchored activity should keep appearing in `anchor-eligible-activities` — all backend calls. The frontend only states what it sends and what it
reads.
