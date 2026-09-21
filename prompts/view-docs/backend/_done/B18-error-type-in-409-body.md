# B18 · Backend ask — carry the error *type* in the 409 body, so the client can word a unique violation, an FK refusal and a concurrency conflict differently

**Contract only.** A field on the error body. The client will branch on it; the server keeps mapping to status codes exactly as today.

> Written 2026-09-15 from `docs/views/_fix-queue.md` escalation §7, which shrank on 2026-09-14 to this one
> bullet: the client-side half is closed (`TimePeriodForm` validates name and length before submitting,
> `e39c01c1`, and words the race-only 409 correctly — `todo-routine/B11`), and the "validate → 400" half is
> a pinned backend contract (`RoutineTimePeriodUniqueIndexTests` asserts `Conflict`) that this ask does not
> reopen. **Blocking nothing.** A framework nicety on both sides — `Sydowwe.Framework` there,
> `vue_framework` here.

---

## The problem

The server distinguishes three kinds of 409 and flattens them to a status at the boundary:

| `ResultErrorType` (`DatabaseExceptionUtils.cs`) | meaning                                           | status (`EndpointHelper.cs`) |
|-------------------------------------------------|---------------------------------------------------|------------------------------|
| `DbConcurrencyError`                            | the row changed under you                         | 409                          |
| `DbUniqueViolationError`                        | something with that key already exists            | 409                          |
| `DbForeignKeyError`                             | something still depends on this row               | 409                          |
| `Conflict` (business)                           | e.g. *"This is a system role… cannot be deleted"* | 409                          |

The client's interceptor switches on status alone (`ErrorHandlingFunctions.ts`, `case 409` →
`httpErrors.conflict`, *"This record was changed by someone else. Refresh the page and try again."*). So a second 7-day routine period (unique index), deleting a
period that still has lists (FK `Restrict`), and a genuine stale-row edit all read as the same sentence — and only the last one is true.

The client has worked around it twice already (`todo-routine/B9`, `B11`): pass `_silent: true` on the request and word the 409 at the call site. That is a
per-endpoint copy of knowledge the server has in one place, and it will be copied again at the next endpoint that can 409 for a non-concurrency reason.

`FW19` (app-side, framework) makes the **`errors` map** legible when present, which covers the business
`Conflict` case (*"system role"*) — but the three DB-derived 409s carry only the generic `message`
(*"Unique constraint violation during Create"*), and the client cannot safely parse prose.

## The business rules

1. **The four 409s are different user situations** and deserve different sentences: *retry after refresh*
   (concurrency), *pick another value* (unique), *remove the dependents first* (FK), *the server's own message* (business).
2. **The status codes do not change.** Everything that is 409 today stays 409; existing tests that assert
   `Conflict` are unaffected.
3. **The type is an enum name, stable and documented**, not a message the client matches on.

## The shape the frontend needs

On every error body the framework emits, one added field:

```json
{
  "statusCode": 409,
  "message": "Unique constraint violation during Create",
  "errorType": "DbUniqueViolationError"
}
```

`errorType` = the `ResultErrorType` member name, serialised as a string (the API already serialises enums by name). Ideally on **all** error statuses, not only 409 —
it costs nothing extra and lets the client tell
`EmailNotConfirmed` from `TwoFactorAuthRequired` on 403 without reading text (see `B13`). Absent on FluentValidation 400s is fine; those carry `errors`.

## What changes on the frontend once this lands

- `vue_framework`'s `ErrorHandlingFunctions.ts` gains a per-type wording under `case 409` (and `403`), with the status-only sentence as the fallback when `errorType`
  is absent — so every app on the framework benefits and older APIs keep working.
- The two `_silent` + call-site wordings in `todoList` (`todo-routine/B9`, `B11`) can be deleted.
- `useDeleteConfirmation` can stop guessing about FK refusals it cannot see.

BACKEND RESPONSE:

B18 — landed. errorType is on the error body.

Every error body the API emits is now FastEndpoints' ErrorResponse plus one field:

{ "statusCode": 409, "message": "Unique constraint violation during Create", "errorType": "DbUniqueViolationError" }

errorType is the ResultErrorType member name, serialised as a plain string (not an enum the serializer might camelCase — the value is exactly the C# member name,
PascalCase). Branch on it; never word-match message.

Absent, not null, when the server didn't know a type. FluentValidation 400s carry no errorType at all — their errors map is unchanged and remains what per-field
rendering binds to. So switch (errorType) must fall through to the existing status-only sentence whenever the field is missing. That's also the compatibility path
for any older API.

Statuses did not move. Everything that was 409 is still 409, 403 still 403. This is purely additive.

Values you can rely on today

On 409:

- DbUniqueViolationError — something with that key exists → pick another value
- DbForeignKeyError — dependents still reference this row → remove/move them first
- DbConcurrencyError — stale row → refresh and retry (the sentence that is currently used for all four)
- Conflict — a business refusal; the message is the server's own wording and is meant to be shown

On 403 (from the password login flow — this covers B13):

- EmailNotConfirmed — drives the resend-confirmation panel
- UserLockedOut — also a 403, not 423; don't infer it from the status
- AuthenticationFailed accompanies the 401

One caveat worth knowing rather than discovering: DbConcurrencyError is reachable in principle but not currently produced by any endpoint — no request DTO carries a
row version yet, so no endpoint can detect a stale write. Wire the branch anyway (it's the correct wording for that type when it starts arriving); just don't expect
to see it in the wild today.

A concrete pair to test against. DELETE /api/activity-role/{id} returns 409 for two different reasons and now distinguishes them: a system role → Conflict (nothing
the user can do; offer rename), a role that still has activities → DbForeignKeyError (actionable; tell them to move the activities). That pair is the whole reason
the field exists, and it's the cleanest thing to build the useDeleteConfirmation behaviour on.

What you can now do

- Add per-type wording under case 409 (and 403) in vue_framework's ErrorHandlingFunctions.ts, keeping the current status-only sentence as the fallback when errorType
  is absent.
- Delete the two _silent: true + call-site wordings in todoList (todo-routine/B9, B11) — the interceptor can say it correctly now.
- useDeleteConfirmation can stop guessing about FK refusals.

Other error statuses (404s from Send.NotFoundAsync, hand-picked 400s/401s in one-off endpoints) mostly don't carry a type yet. That's by design — absent means "no
better information than the status", so the fallback branch is not a temporary state to design around, it's permanent.

BACKEND FOLLOW-UP (2026-09-21):

B18 — follow-up. The "every error body" claim is now true.

The previous note said errorType was on every error body. It was on the bodies the eight framework CRUD bases emit; eleven hand-written call sites still picked
their 409 with a bare EndpointHelper.ToStatusCode(...), which gives the same status and silently drops the type. Those are converted, and a source-scan test now
fails the build's test run on any new one. Nothing in the contract changes — same field, same values, same "absent means no better information" rule, same
statuses. What changes is which routes you can rely on to carry a type.

Now carrying errorType that weren't before:

| Route                                                                                   | 409 you'll see                                                                            | What it means                                                                                 |
|-----------------------------------------------------------------------------------------|-------------------------------------------------------------------------------------------|-----------------------------------------------------------------------------------------------|
| POST/PUT …/tracker-desktop-mapping-by-pattern, …/tracker-android-mapping-by-pattern     | DbUniqueViolationError                                                                    | the user already has a mapping with that pattern — the errors["Patterns"] message names which one |
| POST …/desktop/heartbeat, …/web-extension/heartbeat, …/android/sync                     | DbUniqueViolationError                                                                    | part of the batch was recorded concurrently; retry, stored rows are skipped                   |
| PATCH /activity/{id}/archived, POST /activity/merge                                     | whatever DbUtils derives (DbUniqueViolationError / DbForeignKeyError / DbConcurrencyError) | —                                                                                             |
| To-do step create/update/delete, toggle-done (item and step), change-display-order      | same as above                                                                             | —                                                                                             |
| PATCH /planner-task/{id}/status, POST /planner-task/apply-template                      | same as above                                                                             | —                                                                                             |

So the mapping-pattern duplicate is the second concrete pair for ErrorHandlingFunctions.ts after the activity-role delete: a 409 on a create with
DbUniqueViolationError is "pick another value", and the per-field errors map is still there for the form to render under the field.

Unchanged, restating so you don't chase it: literal Send.ErrorsAsync(404|400|500|502) calls and Send.NotFoundAsync carry no type — that's permanent, the fallback
branch is not a stopgap. DbConcurrencyError remains reachable-in-principle but not produced by any endpoint yet (no request DTO carries a row version). Wire the
branch; don't wait for it.

Pinned by: ErrorTypeContractTests (body assertions on the unique / FK / business-conflict / validation-400 cases plus the new hand-rolled Tracking 409) and
ErrorStatusBypassGuardTests (any endpoint calling EndpointHelper.ToStatusCode directly fails with the offending file named). Contract reference for backend authors
is in docs/claude/endpoints.md "Error bodies" and docs/resultErrorCodes.md.

Nothing for you to change beyond what the last note listed — the _silent wordings in todo-routine/B9/B11 and the useDeleteConfirmation guess can go.
