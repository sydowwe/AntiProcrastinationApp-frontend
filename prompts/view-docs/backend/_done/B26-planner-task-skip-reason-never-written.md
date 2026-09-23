# B26 · Backend ask — a planner task's `skipReason` is readable and never writable

**Contract only.** One optional field on one request, and two rules about when it is kept. The column,
its length and the entity already exist; nothing here asks for a storage change.

> Written 2026-09-22 from `docs/views/_fix-queue.md` → *Escalations* §21, which came out of verifying `F59`
> (`home/B4`, fixed in `dfd64a6a`). **Blocking one chip, not a flow.** Skipping works, and the task
> reaches `Cancelled`. What never arrives is the reason, so the home widget's new *Skipped* chip always
> falls back to the bare label. It needs **no frontend change** to show the reason once this lands.
>
> ✅ **LANDED 2026-09-22** on the API's `dev` working tree, not yet committed there at the time of
> writing. **Verified end to end on 2026-09-23** against the restarted API; the backend's response is
> at the bottom. The one deviation is that the PUT's clearing lives in `UpdateEntity`, not `ApplyStatus`.
> **Frontend half: none**, as predicted. The day planner defect listed below was fixed separately
> (`d5e57027`).

---

## The problem

`PlannerTask.SkipReason` is a column (`PlannerTaskConfiguration.cs:24`, `HasMaxLength(500)`), and
`PlannerTaskResponse` returns it (`:17`, `:78`). **No request DTO in `AdhdTimeOrganizer.Planning` declares
it.** A search for `SkipReason` across the solution finds writers only in tests
(`RoutineCompletionFanOutTests.cs:196`) and the seeder. So the value is read-only over HTTP: a task can
only carry a reason if a fixture put it there.

The client has been sending it all along, and the server has been dropping it:

- **Home widget** (`TaskActionMenu` → *Skip* → a reason) sends
  `PATCH /api/planner-task/{id}/status` with
  `{"status":"cancelled","actualStartTime":null,"actualEndTime":null,"skipReason":"Ran out of time"}`.
  `PatchPlannerTaskStatusRequest` has `Status`, `ActualStartTime` and `ActualEndTime` only, so the
  serializer ignores the fourth key. The answer is 204, and the next `GET /api/calendar/day-plan/{date}`
  returns the task as `"status":"Cancelled","skipReason":null`. Observed live on 2026-09-22 against
  seeded task 16003.
- **Full `PUT /api/planner-task/{id}`** (the home widget's *move later* / *give it longer*, and the
  day-planner dialog) sends `skipReason` inside `PlannerTaskRequest`. The server's `PlannerTaskRequest`
  has no such member, and `UpdateEntity` does not touch the column. This is harmless today, because the
  PUT cannot *clear* a reason either. But `UpdateEntity` assigns `entity.Status = Status` directly
  instead of going through `ApplyStatus`, so a PUT that moves a task out of `Cancelled` bypasses whatever
  rule 2 below puts in `ApplyStatus`.

## The business rules

1. **`PATCH …/status` accepts an optional `skipReason`.** It is a plain string: free text, ≤ 500
   characters to match the column, and trimmed, with a blank value treated as null. It is **not**
   constrained to `UserPlannerSettings.PredefinedSkipReasons`: the home widget offers its own three
   reasons, and the day planner offers the user's list, so validating against one would reject the
   other.
2. **A reason is only ever attached to a `Cancelled` task.**
   - On a transition **to** `Cancelled`, store the request's `skipReason`, which may be null. A re-skip
     with a different reason overwrites the old one.
   - On a transition **out of** `Cancelled`, to any status, clear it. That is the home widget's
     *Restore*, which sends `notStarted`, and the checkbox that used to send `completed`. Without this, a
     restored task keeps a reason for a skip that no longer holds, which is the orphan
     `RoutineCompletionFanOutTests.cs:210` already calls *"the visible half of the same bug"*.
   - `ApplyStatus` already clears the actual times on the same kind of transition, so it is the natural
     home. The rule is the ask; where it lives is yours.
3. **A `skipReason` sent with any other status is a 400**, not a silent drop. This is the same reasoning
   `PlannerTaskRequest.ActualStartTime`'s doc comment gives for rejecting a value *"the next status change
   would silently drop"*. Nothing in the client sends that combination today. The client always sends
   `skipReason: null` beside a non-cancelled status, so null must stay accepted with every status.
4. **The full PUT does not write the reason, and it does not keep one past a status change.** If its
   `Status` leaves `Cancelled`, rule 2's clearing applies. If it stays `Cancelled` (a skipped task moved
   later), the stored reason survives, even though the PUT body carries whatever the client last read.
   Please don't make the PUT a second writer of this field. The status PATCH is the one place a skip is
   recorded, and the day-plan fan-out, reminder sync and `PlannerTaskIsDoneChangedEvent` all hang off it.
5. **Existing behaviour is otherwise unchanged:** the status PATCH's side effects (reminder sync, the
   done-changed event, 204), and the routine fan-out's rule that a `Cancelled` task is left alone
   (`RoutineCompletionFanOutTests`). The reason is display data. It does not feed the streak:
   `PlannerStreakService.cs:69` already decided per-reason nuance is out.

## The shape the frontend needs

`PATCH /api/planner-task/{id}/status`, one added optional member:

```json
{ "status": "cancelled", "actualStartTime": null, "actualEndTime": null, "skipReason": "Ran out of time" }
```

The client already sends this body (`PatchPlannerTaskStatusRequest.ts` in the app). The response stays
204. The read side is already there: `PlannerTaskResponse.skipReason`, returned by
`GET /api/calendar/day-plan/{date}` and the planner's task reads.

Errors: rule 1's length cap and rule 3's combination are FluentValidation 400s with the usual `errors`
map. They need no `errorType` (`B18`: validation 400s carry none).

## What changes on the frontend once this lands

- **Home (`DayPlannerWidget.vue`): nothing.** The chip already renders `home.skippedBecause` with
  `task.skipReason` and falls back to `home.skipped` on null. Verify it by skipping a task from its action
  menu and reading *"Skipped: Ran out of time"* after the refetch. Then click *Restore* and confirm that
  the next day-plan read carries `skipReason: null` (rule 2).
- **Day planner: a separate frontend defect, not part of this ask** — ✅ fixed 2026-09-23 in `d5e57027`
  (`handleSkip` now calls `patchStatus`), and verified with this ask. Original note: `DayPlannerView.vue`'s bulk
  `handleSkip` (`:421-447`) calls the generic `patch()`, which is `PATCH /api/planner-task/{id}`. That is
  `PatchPlannerTaskSpanEndpoint`, whose `Mapping` writes `StartTime`/`EndTime` and nothing else. So the
  day planner's Skip persists **neither the status nor the reason**. Only the local store shows it as
  cancelled, until the next read. This was found from source while writing this ask and has not been
  reproduced in a browser. The fix is client-side: route it through `patchStatus`, as the home widget
  does. It is listed here only so nobody reads the span endpoint's silence as part of this contract.
- **Locale, for the record:** both clients send the reason as display text in the user's locale at skip
  time, so a reason written in SK stays SK after a switch to EN. This is accepted for free-text data, and
  it is the reason rule 1 does not validate against a vocabulary. If the backend would rather store a key
  for the built-in reasons, say so in the response. The client would then send a key for its three and
  free text for the user's own.

---

## Backend response (2026-09-22) — landed on `dev`, uncommitted at the time

The contract is as asked. The frontend needs no change.

### Contract

`PATCH /api/planner-task/{id}/status` accepts the body the client already sends. The response is still 204,
and the side effects are unchanged: reminder sync, `PlannerTaskIsDoneChangedEvent`, and the routine and
to-do fan-out leaving `Cancelled` tasks alone. The reason is display-only and does not affect the streak.
The read side is the existing `PlannerTaskResponse.skipReason`.

### Rules as implemented

1. **Free text.** The server trims it, stores a blank value as null, and caps it at 500 characters after
   trimming. It is not checked against `PredefinedSkipReasons`.
2. **The reason only exists on a `Cancelled` task.**
   - A PATCH to `cancelled` stores the request's reason, which may be null. Skipping again overwrites it.
   - A PATCH to any other status clears it. That covers both Restore (`notStarted`) and `completed`.
3. **Validation 400s** use the usual FluentValidation `errors` map with no `errorType`.
   - A non-blank `skipReason` sent with any other status is rejected: *"SkipReason is only allowed when
     Status is Cancelled."*
   - A reason longer than 500 characters is rejected: *"SkipReason must be 500 characters or fewer."*
   - `skipReason: null` or blank is accepted with every status, so every body the client sends today
     passes.
4. **The full PUT never writes the reason.**
   - If the task stays `Cancelled`, the stored reason survives, whatever the body says.
   - If the PUT's status leaves `Cancelled`, the reason is cleared.
   - **The deviation from the ask:** that clearing is done in `UpdateEntity`, not by routing the PUT
     through `ApplyStatus`. `ApplyStatus` would also have started clearing the actual start and end times
     on a PUT, which would change existing behaviour.

Integration tests send the exact four-key client body and cover:
- skip, re-skip, then restore
- completing a skipped task
- a blank reason
- a reason sent with each non-cancelled status (400, nothing applied)
- a null reason with each non-cancelled status (204)
- 500 characters (204) versus 501 characters (400)
- a PUT that stays `Cancelled` and a PUT that leaves it

All 99 tests in the four planner-status classes pass.

On keys for the built-in reasons, the backend stores the free text as sent. Keys would be a separate
ask.

## Verified end to end, 2026-09-23

The API was restarted at 07:30 and 08:17 on 2026-09-23. Until then the `:8080` process predated the
20:57 edit, which is why the first attempt on 2026-09-22 still read `skipReason: null`. The checks were
run on a task created through `POST /api/planner-task` for today (16008) and deleted afterwards.

- **Home, skip.** The *Skip → Ran out of time* PATCH returned 204. The next `day-plan` read returned
  `Cancelled / "Ran out of time"`, and the chip reads *"Skipped: Ran out of time"*.
- **Home, Restore.** The body was `{"status":"notStarted",…,"skipReason":null}` → 204. The next read
  returned `NotStarted / null`.
- **Day planner, skip** (`d5e57027`). The request went to `PATCH …/16008/status` with
  `"skipReason":"Meeting ran long"`. After a reload the task is `Cancelled` with `"Meeting ran long"`.
- **Not driven:** rule 3's 400s and rule 4's PUT, which the client never triggers today. The backend's
  integration tests cover both.
