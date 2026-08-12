# Backend asks — written by the agent that hits the wall

This directory is a **destination**, not a queue. It starts empty on purpose.

The prompts in `prompts/_common/scheduler/` do not pre-write backend requests. The agent implementing
a prompt is the one that discovers exactly which field was missing, which nullability was wrong, or
which computation cannot honestly be done client-side — and it writes a sharper ask than anyone could
from a cold read. S1, S5 and S6 tell you to come here. This file says what to write.

## The rule

If, while implementing a prompt, you conclude that the correct fix requires a backend change:

1. **Do not stop, and do not implement a fake version of it.** Finish everything in the prompt that
   does not depend on the backend.
2. **Do the honest frontend-only fallback** the prompt describes, and leave a `// TODO(Bn):` comment
   at the site pointing at the file you are about to write.
3. **Write the ask** to `prompts/_common/scheduler/backend/Bn-short-slug.md`, numbering from the
   highest `Bn` already in this directory.
4. **Report it** in your final message: what you could not do, and the filename you wrote.

## This is the framework's backend, not the app's

`src/_common/modules/scheduler/` is part of the `vue_framework` submodule, and the scheduler service
it talks to (`/scheduled-job/*`, `/scheduled-job-run/*`) is shared infrastructure, not an
AntiProcrastinationApp endpoint. **Say so at the top of every ask.** It changes the calculus for the
backend agent: a field added here is added for every consumer, so an ask that only makes sense for
one app's UI is the wrong ask, and a compatibility-breaking change to an existing response is close
to unacceptable. Prefer additive fields, and say explicitly whether an existing consumer breaks if
the field is absent.

There is a second reason to be careful here. `src/_common/docs/modules/scheduler.md` marks most of
this module's non-CRUD routes as **assumed** — `/needs-attention`, `/{id}/trigger`, `/pause`,
`/resume`, `/{runId}/replay` and both `/export`s were never confirmed against a real implementation.
Check that list before writing: "does this endpoint behave the way four view files assume it does" is
a legitimate ask on its own, and a cheaper one than a shape change.

## What the ask must and must not contain

**Contract and business rules only.** Do not prescribe storage, entities, EF configuration,
migrations, indexes, or where a computation happens — those are the backend agent's decisions.
Requesting a specific table or a specific query is out of scope and will be ignored.

Use this structure:

```markdown
# Bn · Backend ask — <one line>

**Contract only.** <one sentence disclaiming implementation decisions.>
**Framework-shared.** <one sentence: this is the shared scheduler service, additive changes preferred.>

## The problem
<What is wrong TODAY, with file:line citations from src/_common/modules/scheduler/. Describe the
operator-visible consequence, not the code smell. If it is a live bug, say so and say what the
operator currently sees.>

## The business rules
<Every rule the frontend currently assumes, stated so the backend can confirm or CORRECT it. Frame
each as a question where the current client behaviour looks like a guess rather than a decision. The
frontend will follow the server's answer, not the other way round.>

## The shape the frontend needs
<Fields, their types, their nullability, and WHY each is needed — name the component that renders it.
Say which endpoint it should hang off, whether it is additive or breaking, and whether it is hot
enough to matter.>

## What changes on the frontend once this lands
<Which files get deleted or simplified, and which `// TODO(Bn):` comments get removed. This is how the
backend agent judges whether the ask is worth the work.>
```

## Known candidates

Listed so you recognise the situation, **not** so you write them speculatively — only write the ask
if you actually reached it while doing the work.

- **Whether `trigger` and `replay` are synchronous** (from S1). Both refresh handlers assume the new
  run row exists the moment the POST resolves, and it usually does not — so the operator clicks
  Trigger, gets a success snackbar, and watches nothing happen. The interesting question is not "how
  long should we poll", it is whether either endpoint could hand back a run id instead.
- **The replay response shape** (from S1, S6). `SchedulerApi.ts:109` reads
  `response.data?.id ?? response.data` — the client does not know whether it receives `{ id }`, a
  bare number, or nothing, and `SchedulerRunDetailView.vue:292` then guards with
  `typeof newRunId === 'number' && newRunId > 0` before daring to navigate. One sentence deletes both
  the guess and the guard.
- **Job status on the run response** (from S6). `ScheduledJobRunResponse` carries no orphan or status
  flag, so the run detail view offers Replay on runs whose job has no handler left — a click that is
  predicted to 409 by the module's own error mapper (`useSchedulerFormat.ts:26-28`) and is only
  discovered after the fact. `JobActionButtons.vue:115` disables trigger for exactly this reason,
  because *it* is given `isOrphaned`.
- **`needs-attention` freshness and window** (from S5). The response has no "as of" timestamp, so a
  dashboard left open cannot tell the operator how old it is, and the rollup's "last day" window is a
  server-side constant the client only knows from a Slovak locale string
  (`scheduler.needsAttention.recentOutcomes`). Also unstated: whether the three job lists are capped,
  which decides whether `AttentionJobList.vue:26` rendering `items.length` as a headline count is
  telling the truth on a bad day.
- **Whether `/export` honours the paging fields in `FilteredTableRequest`** (pre-existing; noted as
  review M1 in the module map). Both callers send `rowsPerPage: -1` to mean "everything"
  (`SchedulerJobsView.vue:266-272`) — an unverified convention. If the server pages it instead, every
  export an operator has ever taken was silently truncated to 25 rows.
