# B18 · Backend ask — carry the error *type* in the 409 body, so the client can word a unique violation, an FK refusal and a concurrency conflict differently

**Contract only.** A field on the error body. The client will branch on it; the server keeps mapping to
status codes exactly as today.

> Written 2026-09-15 from `docs/views/_fix-queue.md` escalation §7, which shrank on 2026-09-14 to this one
> bullet: the client-side half is closed (`TimePeriodForm` validates name and length before submitting,
> `e39c01c1`, and words the race-only 409 correctly — `todo-routine/B11`), and the "validate → 400" half is
> a pinned backend contract (`RoutineTimePeriodUniqueIndexTests` asserts `Conflict`) that this ask does not
> reopen. **Blocking nothing.** A framework nicety on both sides — `Sydowwe.Framework` there,
> `vue_framework` here.

---

## The problem

The server distinguishes three kinds of 409 and flattens them to a status at the boundary:

| `ResultErrorType` (`DatabaseExceptionUtils.cs`) | meaning | status (`EndpointHelper.cs`) |
| --- | --- | --- |
| `DbConcurrencyError` | the row changed under you | 409 |
| `DbUniqueViolationError` | something with that key already exists | 409 |
| `DbForeignKeyError` | something still depends on this row | 409 |
| `Conflict` (business) | e.g. *"This is a system role… cannot be deleted"* | 409 |

The client's interceptor switches on status alone (`ErrorHandlingFunctions.ts`, `case 409` →
`httpErrors.conflict`, *"This record was changed by someone else. Refresh the page and try again."*). So a
second 7-day routine period (unique index), deleting a period that still has lists (FK `Restrict`), and a
genuine stale-row edit all read as the same sentence — and only the last one is true.

The client has worked around it twice already (`todo-routine/B9`, `B11`): pass `_silent: true` on the
request and word the 409 at the call site. That is a per-endpoint copy of knowledge the server has in one
place, and it will be copied again at the next endpoint that can 409 for a non-concurrency reason.

`FW19` (app-side, framework) makes the **`errors` map** legible when present, which covers the business
`Conflict` case (*"system role"*) — but the three DB-derived 409s carry only the generic `message`
(*"Unique constraint violation during Create"*), and the client cannot safely parse prose.

## The business rules

1. **The four 409s are different user situations** and deserve different sentences: *retry after refresh*
   (concurrency), *pick another value* (unique), *remove the dependents first* (FK), *the server's own
   message* (business).
2. **The status codes do not change.** Everything that is 409 today stays 409; existing tests that assert
   `Conflict` are unaffected.
3. **The type is an enum name, stable and documented**, not a message the client matches on.

## The shape the frontend needs

On every error body the framework emits, one added field:

```json
{ "statusCode": 409, "message": "Unique constraint violation during Create", "errorType": "DbUniqueViolationError" }
```

`errorType` = the `ResultErrorType` member name, serialised as a string (the API already serialises enums by
name). Ideally on **all** error statuses, not only 409 — it costs nothing extra and lets the client tell
`EmailNotConfirmed` from `TwoFactorAuthRequired` on 403 without reading text (see `B13`). Absent on
FluentValidation 400s is fine; those carry `errors`.

## What changes on the frontend once this lands

- `vue_framework`'s `ErrorHandlingFunctions.ts` gains a per-type wording under `case 409` (and `403`), with
  the status-only sentence as the fallback when `errorType` is absent — so every app on the framework benefits
  and older APIs keep working.
- The two `_silent` + call-site wordings in `todoList` (`todo-routine/B9`, `B11`) can be deleted.
- `useDeleteConfirmation` can stop guessing about FK refusals it cannot see.
