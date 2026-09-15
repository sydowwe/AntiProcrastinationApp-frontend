# B20 · Backend ask — a paged grid still answers 500 when `sortBy` names a member that resolves but is not scalar

**Contract only.** The follow-up `B2`'s close-out invited: *"If you see `errorId` in a body, that is still an
unhandled 500 and a different bug — report it."* This is that report.

> Probed against the running local API 2026-09-13, twice (once before and once after the `B2` deploy), signed
> in as the seed's `primaryUser`. Recorded in `docs/views/_fix-queue.md` escalation §5's follow-up; written
> as its own ask 2026-09-15. **Not blocking today** — no client column emits such a key — but it is the
> first thing the next sortable lookup column will hit.

---

## The problem

`B2` fixed the general case: an **unrecognised** sort key is a 400 naming the key. Measured on
`activity-backlog-profile/grid`:

| `sortBy[0].key` | status |
| --- | --- |
| `zzzNotAColumn` | **400** `errors.sortBy: ["Unknown sort key 'zzzNotAColumn'."]` ✅ |
| `energyDemandId` (present on every row, not sortable) | **400** ✅ |
| `locationType.text` | **200** ✅ |
| `activity.name` | **200** ✅ |
| **`locationType`** | **500** `errorId be94ee6d327f`, re-probed `13ae656a28ee` |
| **`activity`** | **500** `errorId 28962860a3af` |

So a key that resolves to a **non-scalar member** — a nested object rather than a leaf — is neither refused
nor sorted; it is an unhandled 500 behind what the client renders as an empty table (the `B2` close-out's own
"one thing to fix on our side" — tracked as `F27`/`F61`'s error-state work).

This is precisely the key a real column definition emits: a `TableColumn('locationType', …, sortable)` sends
`locationType`, not `locationType.text`, unless the author already knows the trap.

## The business rules

1. **Every `sortBy` key is either applied or refused with a 400 naming it.** No key produces a 500 — `B2`'s
   rule, extended from "unknown" to "known but not orderable".
2. **A non-scalar member is not orderable.** Refuse it with the same shape as the unknown-key case, ideally
   with a hint (*"'locationType' is not sortable; try 'locationType.text'"*) — but the status and the
   `errors.sortBy[]` shape are what the client depends on, not the sentence.
3. **This is the shared layer**, not per-grid — the same place `B2` put the unknown-key check, so all five
   profile grids, the reminder reads and any future grid inherit it.

## The shape the frontend needs

The existing 400 shape:

```json
{ "statusCode": 400, "message": "One or more errors occurred!", "errors": { "sortBy": ["…"] } }
```

No `errorId`. One integration test that sorts by a navigation-property key and asserts 400, next to the
`zzzNotAColumn` one.

## What changes on the frontend once this lands

Nothing today. When a lookup column is made sortable, its `TableColumn` must still emit the `.text` leaf
(recorded as a latent trap in `_fix-queue.md` §5) — but a mistake becomes a 400 the interceptor shows, not a
500 behind an empty table. `useTableFormatters`' `FW20` work and the `F27` error state are the client-side
companions.
