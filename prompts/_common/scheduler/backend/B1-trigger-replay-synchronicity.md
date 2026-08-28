# B1 · Backend ask — is trigger/replay synchronous, and can either return a run id?

**Contract only.** This does not prescribe storage, entities, or how the job runner is implemented —
only the response contract `POST /scheduled-job/{id}/trigger` and `POST /scheduled-job-run/{runId}/replay`
should offer.
**Framework-shared.** `src/_common/modules/scheduler/` is the shared scheduler module in `vue_framework`,
not an app endpoint. Any change here affects every app that mounts the module, so an additive change
(a new optional response field) is strongly preferred over a breaking one.

## The problem

`SchedulerJobDetailView.vue` (trigger) and `JobRunHistory.vue` (replay) both assume the new run row
exists shortly after the POST resolves:

- `SchedulerApi.ts:58` — `triggerJobNow` returns `Promise<void>` and never inspects the response body.
- `SchedulerApi.ts:107-110` — `replayRun` reads `response.data?.id ?? response.data`, which is the shape
  of a guess, not a documented contract. The client genuinely does not know whether the endpoint
  returns `{ id }`, a bare number, or nothing.
- The success messages both say the run happens "shortly"/"in the background"
  (`scheduler.actions.triggered`, `scheduler.replay.success` in `_locales/scheduler.sk.ts`), which is
  the frontend already assuming asynchrony without ever having confirmed it.

Because neither call site had a real signal to wait on, we (frontend) just fixed the operator-visible
symptom — click Trigger/Replay, get a success snackbar, watch the history not update — with a bounded
client-side poll: `JobRunHistory.vue`'s new `pollForNewRun()` refreshes immediately, then up to 3 more
times 3 seconds apart, stopping early once the row count grows. It works, but it is a guess at timing
or an outright waste of a request cycle, not a contract.

## The business rules

Please confirm or correct these, since the frontend is currently guessing at all three:

1. Does `POST /scheduled-job/{id}/trigger` complete synchronously (the run has already been written to
   history by the time the response comes back), or does it enqueue the run for later execution?
2. Same question for `POST /scheduled-job-run/{runId}/replay`.
3. If either enqueues, is there any signal available at enqueue time that the client could use instead
   of polling blind — a returned run id, a `Location` header, anything that lets the client jump
   straight to the new run (as `SchedulerRunDetailView.vue:292-296` already tries to do after replay)?

## The shape the frontend needs

- `POST /scheduled-job-run/{runId}/replay` → ideally `{ id: number }` in the response body, always
  present, so `SchedulerApi.ts:109`'s `response.data?.id ?? response.data` guess can become
  `response.data.id`. This is read by `SchedulerRunDetailView.vue:confirmReplay` (to navigate straight
  to the new run) and `JobRunHistory.vue:confirmReplay` (currently just polls because it has nothing
  else to jump to).
- `POST /scheduled-job/{id}/trigger` → same shape, `{ id: number }` for the new run, if at all feasible
  given how triggering is implemented. Consumed by `SchedulerJobDetailView.vue:onTriggered`, which
  today can only ask `JobRunHistory` to poll because it has no run id to look for directly.
- Either is additive: today's callers (`triggerJobNow`, `replayRun`) discard/guess at the body already,
  so adding a well-defined field breaks nothing that currently works.

## What changes on the frontend once this lands

- If replay returns a guaranteed `{ id }`: delete the `typeof newRunId === 'number' && newRunId > 0`
  guard in `SchedulerRunDetailView.vue:confirmReplay`, and `JobRunHistory.vue:confirmReplay` can
  navigate/highlight the new run directly instead of polling.
- If trigger also returns `{ id }` (or confirms it's synchronous): `SchedulerJobDetailView.vue:onTriggered`
  and `JobRunHistory.vue`'s `pollForNewRun`/`clearPoll`/`POLL_INTERVAL_MS`/`POLL_ATTEMPTS` machinery can
  be deleted entirely in favour of a single deterministic refresh.
- If both are confirmed asynchronous with no id available, at minimum the bounded poll we shipped stays
  as the honest answer — but the timing constants should move from a frontend guess to a documented
  "typical enqueue-to-visible latency" so they're not arbitrary.
