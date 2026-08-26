# B3 · Backend ask — a batch pause / resume / cancel, and what it returns when part of it fails

**Contract only.** This asks for one endpoint shape and, much more importantly, for six semantic
decisions the client is currently guessing at. Whether the batch is a loop, a set-based update, a
transaction or a queued job is the backend's decision, and nothing below should be read as prescribing
one.

**Framework-shared.** `/reminder-definition/{pause,resume,cancel}` belongs to the shared reminder
service, so a batch endpoint added here serves every consumer, not just this app. It is purely
additive: the three single endpoints stay exactly as they are, and a consumer that never calls the
batch route is unaffected.

## The problem

The reminder register (`ReminderDefinitionsView.vue`) is the list of every reminder in the system,
filterable by owner module, subject type, kind, status and schedule type. The realistic admin tasks on
it are inherently plural — "pause everything owned by the module we are migrating tonight", "cancel the
reminders for the subjects deleted in yesterday's import", "resume everything paused during the
maintenance window".

Every lifecycle endpoint takes exactly one 4-part `ReminderKeyRequest` and returns no content
(`ReminderDefinitionApi.ts:31-53`). So the register now ships bulk actions built on **N parallel
requests** — `runBulkLifecycleAction` in the same file, a pool of six workers over a shared cursor,
with per-key result slots, a progress callback and `_silent` so the interceptor does not stack one
error snackbar per failed request.

That is a real feature and it works. It is also the client doing a server's job, and it does the job
worse in ways that are visible:

- 40 reminders is 40 round trips, 40 auth checks and 40 independent transactions.
- The client picks the concurrency (6) with no idea what the service can take.
- There is no batch in any log or audit trail — just N unrelated single actions from one user in the
  same second.
- The client cannot know whether a reminder that failed left anything half-done.

## The business rules

Please confirm or correct each of these. The client currently guesses, and where it guesses it says so.

1. **Partial applicability, not all-or-nothing.** The client wants a batch where each key succeeds or
   fails independently, and it wants the per-key outcomes back. This is not a preference — it is what
   the screen is for. A worked example from testing this feature: one run of two resumes produced two
   failures with two *different* causes, one a routing failure and one a genuine server-side
   `FormatException` on that reminder's cron expression. An all-or-nothing batch would have reported
   "the batch failed" and the admin would have learned nothing about either. If you believe
   all-or-nothing is right here, say why, because the UI has to change if so.

2. **What comes back for a failure, in a form a UI can render per row.** Today the client renders
   whatever `extractServerMessage` finds in the error body, per reminder, in a result dialog
   (`BulkActionResultDialog.vue`). For the cron failure above that meant rendering a raw .NET exception
   string — `System.FormatException: Unexpected end of expression. at Quartz.CronExpression.BuildExpression(...)`
   — verbatim to an admin. **That is worth fixing regardless of whether this endpoint is ever built**:
   the single-action endpoints are leaking stack frames into a response body that a client will display.
   What the batch needs per failed key is a stable machine-readable reason code plus a message safe to
   show, not a stack trace.

3. **Does idempotency survive batching?** The single endpoints are documented client-side as idempotent
   server-side (`ReminderDefinitionApi.ts:28`) — but that comment is an assumption written from the
   outside, and it has never been tested. In a batch it matters much more, because a mixed selection is
   the normal case. Is pausing an already-Paused reminder a **success**, a **skip** (distinct outcome,
   counted separately), or a **failure**? The client would prefer a distinct "no change needed" outcome
   so its report can say "18 paused, 4 already paused, 0 failed" instead of silently inflating the
   success count — but it will render whatever the server decides.

4. **Is there an upper bound on batch size, and what happens above it?** The client caps its selection
   at one page (25 by default, user-adjustable), and it prunes the selection to the rows currently on
   screen precisely so a user cannot act on 4 000 invisible rows. If the server wants a hard cap, name
   it and say whether exceeding it is a 400 or a truncation — a truncation the client cannot detect is
   the dangerous one.

5. **Does a batch cancel need the same terminal guarantees as a single one if it fails halfway?** Cancel
   is terminal and irreversible (`reminders.cancel.warningText` promises the user exactly that). If a
   batch cancel of 30 fails at 17, is the client entitled to assume the 17 are genuinely, durably
   cancelled and the other 13 genuinely untouched? The confirmation dialog the user just clicked through
   says cancelling cannot be undone; if a partially-applied batch can leave a reminder in some third
   state, that promise is not true and the UI wording has to change.

6. **Are the three actions one endpoint or three?** The client would take either. One route with an
   action discriminator keeps the audit story simple; three mirror the existing surface. The backend's
   call — this is the one question here that really is only about shape.

## The shape the frontend needs

Whatever the route(s), the request carries the keys and the response carries one outcome per key:

**Request** — a list of the existing `ReminderKeyRequest` (`ownerModule`, `subjectType`, `subjectId`,
`kind`), plus the action if it is one endpoint rather than three.

**Response** — one entry per requested key, echoing the key so the client can match it back to a row
(the client sends them in the order the table displays and would like them back the same way, but it
will match on the key rather than on position):

| Field      | Type                                       | Null? | Why / who renders it                                                                                         |
| ---------- | ------------------------------------------ | ----- | ------------------------------------------------------------------------------------------------------------ |
| `key`      | `ReminderKeyRequest`                       | no    | Matches the outcome to its table row — `BulkActionResultDialog` names each failure by module/subject/kind.     |
| `outcome`  | enum: `Applied` / `NoChange` / `Failed`    | no    | Drives the three counts in the result. `NoChange` only if the answer to (3) makes it a distinct state.        |
| `reason`   | string (stable code)                       | yes   | Non-null when `Failed`. Lets the client group and localize rather than render server prose.                   |
| `message`  | string                                     | yes   | Human-readable, **safe to display** — see (2). Rendered as the per-row subtitle in the result dialog.          |

Not hot: an admin screen, at most one page of reminders per call.

## What changes on the frontend once this lands

- `runBulkLifecycleAction` (`ReminderDefinitionApi.ts`) loses its worker pool, its shared cursor, its
  indexed outcome slots and its `_silent` handling — roughly 60 lines become one `API.post`. The
  `// TODO(Bn):` on it goes away, along with the note explaining why the client is doing this.
- `BulkLifecycleOptions.onProgress` and the progress bar in `ReminderBulkActionBar.vue` go away: one
  request has no meaningful progress to show, only a spinner.
- `messageFor()` in `ReminderBulkActionBar.vue` — which currently reverse-engineers a message out of an
  `AxiosError` — is replaced by reading `message` off the outcome.
- `BulkActionResultDialog` stays, and gets *better*: if (3) yields a distinct `NoChange`, it can finally
  report "18 paused, 4 already paused" rather than counting an idempotent no-op as an action taken.
- `BulkCancelReminderDialog` and the whole selection / applicability / confirmation layer are unaffected
  — those are client concerns and stay client-side.

**If the answer is "no batch endpoint"**, nothing breaks: the N-request version is what ships today and
it is honest about partial failure. But (2) — the raw exception text in the single endpoints' error
bodies — is still worth fixing on its own, because the client is already displaying it.
