# B2 · Backend ask — the dispatch-history row cannot name the reminder it is about

**Contract only.** This asks whether a row should be able to name its reminder, and if so by which
field. Whether that is a projection join, a denormalized snapshot column or something else is the
backend's decision, and nothing below should be read as prescribing one.

**Framework-shared.** `/reminder-dashboard/dispatch-history` is part of the shared `Sydowwe.Reminders`
service. The ask is additive — no existing field changes name, type or nullability, and a consumer that
ignores the new field keeps working.

## The problem

`ReminderDispatchDto` carries `ReminderDefinitionId` and nothing else that identifies what the row is
about — no `Kind`, no `OwnerModule`. The dispatch-history table is the audit view an admin lands on from
three different places, and every row reads as a timestamp, an outcome and an opaque id.

This surfaced while wiring B1's `EffectiveFailuresOnly` drill-down. The overview's failure card
*does* name each failure — `OverviewFailedDispatch` carries `OwnerModule` and `Kind`, flattened from the
definition precisely "so the card needs no second call". Clicking through to see all of them lands on a
table that cannot. The admin goes from "ExpiryWarning / Zmluvy failed" to "#41 failed", which is a
strictly worse view of the same rows.

Worth stating, because it is the reason this was not noticed sooner: the client had been *reading*
`json.kind` and `json.ownerModule` off this row since the view was written. Neither has ever existed, so
both silently rendered as blanks in a column headed "Druh". The same DTO was misreading four more field
names (`occurrenceInstant` for `occurrenceAt`, `correctsDispatchId` for `reversesDispatchId`,
`notificationType` for `notificationTypeSnapshot`, and an array for the `recipientsSnapshot` JSON
string) — every row showed "Invalid Date" and no correction was ever marked as one. That is all fixed
client-side now; `kind` / `ownerModule` are the only two that cannot be, because the server has nothing
to give.

The client currently renders `#{reminderDefinitionId}` as a link to the definition detail view. That is
honest and navigable, but it is a workaround: identifying a row costs a page load each.

## The business rules

Please confirm or correct — the client is guessing at the intent here.

1. **Is the omission deliberate?** The ledger snapshots the *dispatch*, and `Kind` / `OwnerModule` live
   on the definition, which is mutable. Excluding them may be a considered "the ledger records what was
   sent, not what it was about" decision. If so, say it, and this ask should be closed rather than
   implemented — the id link is then the correct UI and we will stop asking.
2. **If they were to be included, snapshot or join?** These differ and the difference is visible: a
   definition renamed after a dispatch would show its *current* kind under a join and its *dispatch-time*
   kind under a snapshot. For an append-only audit ledger the snapshot is the more defensible answer, and
   it is what `NotificationTypeSnapshot` and `TemplateKeySnapshot` already do on this same row — but it
   is a retention and storage question, not the client's to decide.
3. **Does this apply to the CSV export too?** `ExportReminderDispatchHistoryEndpoint` reuses
   `ReminderDispatchDto.Projection`, so an exported ledger has the same gap: a spreadsheet of ids. If the
   answer to (1) is "deliberate", the export is the place where it hurts most, since there is no detail
   view to click through to.

## The shape the frontend needs

If (1) says the fields belong here, two additive fields on `ReminderDispatchDto`:

| Field         | Type   | Null?  | Why / who renders it                                                   |
| ------------- | ------ | ------ | ---------------------------------------------------------------------- |
| `kind`        | string | see below | Primary label of the row's first column, replacing `#{id}`.         |
| `ownerModule` | string | see below | Caption under it — tells the admin whose problem the row is.        |

Nullability is the backend's call and follows from (2): a snapshot taken at dispatch time is non-null
for rows written after the change and null for the existing ledger, whereas a join is non-null unless the
definition was hard-deleted. Either is fine — the client renders the id link as the fallback wherever
they are null, which is the behaviour it has today for every row.

Not hot: the history is a paged admin table, default 25 rows.

## What changes on the frontend once this lands

- `DispatchHistoryGridResponse` gains the two fields and the file's closing note about them being
  deliberately absent is deleted.
- `ReminderDispatchHistoryView`'s first column goes back to a kind/ownerModule pair with the id link as
  its fallback, matching how `ReminderUpcomingView` and the overview's failure card already render the
  same information.
- Nothing else. The `EffectiveFailuresOnly` drill-down, the filters and the URL state are unaffected.

**If the answer to (1) is "deliberate, use the id"**, the only change is documentation: this ask is
closed and the note in `DispatchHistoryGridResponse` becomes a statement of intent rather than a pointer
to an open question.
