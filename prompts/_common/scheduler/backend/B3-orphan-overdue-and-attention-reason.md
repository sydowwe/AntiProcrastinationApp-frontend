# B3 · Backend ask — the dashboard renders three signals the server computes but never sends

**Contract only.** This asks for response fields and the rules behind them; where the values come
from, how they are stored, computed or cached, and whether any of it needs an index are entirely the
backend's call.
**Framework-shared.** `Sydowwe.Scheduler` is shared framework infrastructure and its client lives in
the `vue_framework` submodule, so every app in the family gets whatever lands here. Everything below
is **additive** — no existing field changes name, type or nullability, and a client that ignores the
new fields keeps working exactly as it does today.

Written after finishing S8 (the response-DTO realignment) and walking all five screens against a live
server on `https://localhost:8080`. Everything asserted here was reproduced, not read off the code.

## The problem

Three pieces of information are **already computed on the server**, are **not derivable on the
client**, and do not reach the response. Each one leaves a control or a piece of copy permanently dark.

### 1. `isOrphaned` and `isOverdue` are not on `ScheduledJobDto`

`ScheduledJobDto` carries no orphan flag and no overdue flag. Confirmed live:
`POST /api/scheduler-dashboard/jobs-overview` returns
`{ jobKey, handlerKey, ownerModule, description, scheduleType, cron, intervalPreset, intervalCount,
runAtUtc, timeZoneId, misfirePolicy, disallowConcurrent, maxRetries, alertOnFailure, status,
nextRunAt, lastRunAt, lastOutcome, isActive, id }` — neither flag, on any row.

The server plainly knows both:

- **Orphaned.** `GetSchedulerHealthEndpoint` set-differences the registered `IScheduledJobHandler`
  keys against the registry to build `OrphanedJobs`. That is a fact about the running process — the
  client cannot compute it from any response it can see.
- **Overdue.** `OverduePolicy.WhereOverdue` applies a 60 s grace margin, and
  `ScheduledJobsOverviewFilterRequest.OnlyOverdue` **filters on it**. Reproduced: the unfiltered grid
  returns 10 rows, `onlyOverdue: true` returns exactly 1 (`reminders.scan`, next run five hours in the
  past). So the server will happily tell you *which* jobs are overdue as a filter, and refuses to say
  *whether* the row it just returned is one of them.

What that costs, per component:

| Component | Line | Consequence today |
|---|---|---|
| `SchedulerJobsView.vue` | `:79` | The orphan badge on a grid row can never appear. |
| `SchedulerJobsView.vue` | `:108` | The overdue chip in the status column can never appear — including on the single row that the `onlyOverdue` filter had just selected, one request earlier. |
| `SchedulerJobDetailView.vue` | `:26`, `:51` | The orphan chip and the explanatory orphan alert can never appear. |
| `SchedulerJobDetailView.vue` | `:125` | The "overdue state" row now renders an em dash for every job in the registry. |
| `JobActionButtons.vue` | `:149` | `canTrigger` is `isOrphaned !== true && status !== Removed`, so **Trigger now is enabled on every job**, orphaned ones included. The click is predicted to fail by the module's own error mapper and is only discovered afterwards. |
| `SchedulerRunDetailView.vue` | `:42-49` | Replay is offered on every run, for the same reason (see §"one more consumer" below). |

Until S8 both flags were typed `boolean` and defaulted to `false` in `fromJson`. That silently turned
"the server didn't say" into "no", and the visible result was the job detail page telling the operator
**"On schedule"** about every job in the system — including the one that was five hours late. S8
retyped them `boolean | null` and every consumer now tests `=== true`, so the negative is no longer
asserted; the honest cost is that the affordances above are inert rather than wrong.

### 2. The needs-attention lists have no reason string

`SchedulerHealthDto.FailedJobs` / `OverdueJobs` / `OrphanedJobs` are `List<ScheduledJobDto>`, which
carries nothing explaining *why* a row is on the list it is on. `AttentionJobItem.detail`
(`dto/response/AttentionJobItem.ts:20`) reads `json.detail`, which is never present, so
`AttentionJobList.vue:59` degrades the row to a job key, an owner module and a timestamp.

Reproduced on `/planovac/pozornost`: the "Overdue / stuck" card lists `reminders.scan`, `Reminders`,
"Next run 5 hours ago" — and says nothing about what is wrong with it. A reason is close to the whole
point of an attention list; without one the operator has to open each row to learn anything.

## The business rules

Stated as the frontend currently assumes them, so they can be **confirmed or corrected**. The client
will follow the server's answer.

1. **Is "orphaned" the same predicate on the grid as on the health view?** The client assumes yes —
   `Status != Removed && !registeredHandlerKeys.Contains(HandlerKey)`, exactly as
   `GetSchedulerHealthEndpoint` computes it. If a `Removed` job should read as orphaned in a grid
   context, say so, because the two views would then disagree by design.
2. **Which overdue margin does a grid row report?** `OverduePolicy` deliberately parameterises the
   margin and documents that a *display* margin (60 s) and an *alert* margin are different values. The
   client assumes a row flag reports the **display** margin — the same one `onlyOverdue` filters on —
   so that filtering by overdue and reading the chips can never contradict each other. Confirm.
3. **Is a job that is executing right now overdue?** `WhereNotInFlight` exists precisely because the
   answer differs for a dashboard and an alert, and its own doc comment argues a dashboard *should*
   show the long-running job as late, next to `LastRunAt`. The client has no opinion and will render
   whatever the flag says; it only needs the answer to be the same one `onlyOverdue` uses.
4. **Is either flag hot enough to matter?** The grid is paged (25 rows) and the health view is
   uncapped. If computing orphan status per row is a per-request handler-key set lookup, the client
   assumes it is free; if it is not, a flag on the health lists alone plus nothing on the grid is a
   worse but acceptable answer — say so rather than doing something expensive quietly.
5. **What is a reason string for?** The client treats `detail` as **display-only prose, already
   localized server-side, never parsed.** If it should be a code the client localizes instead, that is
   a better contract for a shared module and the frontend will take it — but it has to be decided now,
   because the two are not interchangeable later.

## The shape the frontend needs

**A. Two flags on `ScheduledJobDto`** — hangs off every surface that already returns it
(`/scheduler-dashboard/jobs-overview`, its `/export`, `/scheduled-job/{id}`,
`/scheduled-job/filtered-table`, and the three health lists). Additive; no existing consumer breaks if
absent, because the client already treats absent as unknown.

| Field | Type | Rendered by |
|---|---|---|
| `isOrphaned` | `bool` (non-null) | the grid badge, the detail chip + alert, and `JobActionButtons`' trigger gate |
| `isOverdue` | `bool` (non-null) | the grid status chip and the detail's "overdue state" row |

Non-null matters: the client's `null` exists **only** to encode "the server does not send this". Once
the field is real, `false` is a claim the client is willing to render as "On schedule", and today it
cannot make that claim about anything.

**B. A reason string on the needs-attention lists** — one nullable `detail` (or whatever it is
called) per row, on the three `SchedulerHealthDto` lists only. Not on the grid; the grid has no place
to put it. What each list needs it to say:

| List | The reason should carry |
|---|---|
| `FailedJobs` | why the last run failed — the error type and/or a truncated message from the run that set `LastOutcome = Failed` |
| `OverdueJobs` | how far past due, e.g. "overdue by 5 h" (the client renders the raw `nextRunAt` distance already, so if the string only restates that, it is not worth the work — the useful version says something the timestamp does not) |
| `OrphanedJobs` | which handler key went missing — the client renders `jobKey`, and it is `handlerKey` that no longer resolves |

If the three lists want genuinely different shapes, three differently-named fields are better than one
overloaded one; the client renders whatever single string a row carries.

**Not asked for: the reverse replay lineage.** `ScheduledJobRunDetailDto.ReplayedByRunIds` is a bare
`List<long>`, and S8 considered asking for projected rows (outcome + start time per child) so the
lineage list could show chips. It shipped as a **link list** instead — verified live on run #14104,
which correctly lists runs #14112, #14125 and #14151 — and that reads well. Projecting rows on a
shared-infrastructure endpoint to buy a little polish is not a trade worth making, and fetching each
child from the client would be an N+1 on a detail page. Leave it as ids.

## One more consumer of the orphan flag

`SchedulerRunDetailView.vue:42-49` carries a `// TODO(B3):` pointing at this file. The Replay button
is enabled on every run, because `ScheduledJobRunDetailDto` says nothing about the state of the job
behind the run — while `ReplayJobRunEndpoint` documents a **409 for exactly this case** ("Handler no
longer registered, or job has been removed") and the module's own error mapper already has the
message for it. So the failure is known, predicted, and still only discovered after the click.

This is the same server fact as (A), one hop away, so it is listed here rather than as its own ask:
either `ScheduledJobRunDetailDto` gains the orphan/status of its job, or it gains nothing and the
frontend keeps letting the 409 answer. **The grid flags in (A) are worth far more than this one** —
if only one thing lands, land those.

## What changes on the frontend once this lands

- `ScheduledJobGridResponse` / `ScheduledJobResponse`: `isOrphaned` / `isOverdue` go back to `boolean`
  (`dto/response/ScheduledJobGridResponse.ts:26,28,58,59` and the same four in `ScheduledJobResponse`),
  and the long comment explaining why they are null is deleted.
- `JobActionButtons.vue:149` drops `!== true` back to `!isOrphaned`, and the prop's doc comment about
  "unknown is treated as allow" goes away — the gate becomes real for the first time.
- `SchedulerJobDetailView.vue:125` loses its third branch: the row goes back to chip-or-"On schedule",
  and the comment explaining the em dash is deleted.
- `SchedulerJobsView.vue:79,108` and `SchedulerJobDetailView.vue:26,51` drop `=== true`.
- `AttentionJobList.vue:59` starts rendering the reason it was written for, and the note on
  `AttentionJobItem.ts:20` is deleted.
- `SchedulerRunDetailView.vue:42` — the `TODO(B3)` goes, if the run-detail half lands too.
- `src/_common/docs/modules/scheduler.md` loses its remaining "Open questions" entry for this module.
