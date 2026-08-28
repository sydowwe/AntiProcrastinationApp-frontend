# S8 · Contract realignment — the routes now match the server; the response DTOs still do not

- **Scope:** `dto/response/*`, `component/AttentionJobList.vue`, `component/ScheduleDisplay.vue`, `view/SchedulerRunDetailView.vue`, `view/SchedulerJobDetailView.vue`, `view/SchedulerJobsView.vue`
- **Backend:** yes — two fields the client renders do not exist on the server; see the escalation block
- **Model / effort:** Opus 5, high
- **Depends on:** the B2 sweep (routes + request payloads, already landed)
- **Unblocks:** any further scheduler UX work — until this lands, several screens render placeholder values

---

```
The scheduler client was written against an imagined API. Every route was wrong; a sweep has now
corrected all of them against the real server (Sydowwe.Scheduler), along with every request payload.
What is left is the RESPONSE side: the screens now get 200s carrying fields whose names the DTOs do
not read, so they render zeros, dashes and empty lists instead of erroring. Your job is to finish the
realignment and then actually look at every screen with the backend running.

SUBMODULE RULES — read before editing:
src/_common is the vue_framework repo mounted as a git submodule, and CLAUDE.md says never to write
to it. This task is an explicit, user-approved exception: the scheduler module lives there and
nowhere else. So:
  - Edit the files in src/_common in this working tree. Do NOT fork a file into src/, and do NOT add
    a migration-revision.md entry.
  - Leave the work in the submodule's working tree and say so in your final message; the parent repo
    will show a dirty submodule pointer. Commit inside the submodule only if the user asks.
  - ESLint and Prettier ignore src/_common, so `npm run lint` will not check your work. Match the
    surrounding style by hand: tabs, single quotes, no semicolons, tab-indented <script setup>.
  - `npm run type-check` DOES cover src/_common, and the baseline is ZERO errors everywhere. Any
    error, from any path, is a regression you introduced.

HOW TO ESTABLISH GROUND TRUTH — do this first, and do not skip it.
Do not trust this prompt, the DTO comments, or src/_common/docs/modules/scheduler.md. Read the
server. It is on this machine:

  C:\Users\jakub\RiderProjects\AdhdTimeOrganizer\framework\Sydowwe.Scheduler\

  application/dto/scheduledJob/ScheduledJobDto.cs          — the jobs grid + job detail row
  application/dto/scheduledJobRun/ScheduledJobRunDto.cs     — a run-history row
  application/dto/scheduledJobRun/ScheduledJobRunDetailDto.cs — the run detail
  application/dto/health/SchedulerHealthDto.cs              — the needs-attention summary
  domain/enum/, and Sydowwe.Framework.Contracts/scheduling/ — every enum
  application/endpoint/                                     — the routes, roles and request bodies

Enums serialize as their MEMBER NAME verbatim (JsonStringEnumConverter, no naming policy — see
Program.cs:362), so a C# `RunOutcome.Misfired` arrives as the string "Misfired". Every enum in
dto/enum/ must therefore match the server's members exactly, spelling included.

THE FOUR THINGS THAT ARE STILL WRONG

1. THE ORPHAN AND OVERDUE FLAGS DO NOT EXIST ON THE SERVER.
   ScheduledJobGridResponse / ScheduledJobResponse both declare `isOrphaned` and `isOverdue`, and
   both default them to false in fromJson because ScheduledJobDto carries neither. Consequences on
   screen, all of them silent:
     - the orphan badge in the jobs grid and on the job detail never appears;
     - JobActionButtons' `canTrigger` (:131) is therefore always true, so the operator can click
       Trigger on a job whose handler is gone — the click is predicted to fail by the module's own
       error mapper and is only discovered afterwards;
     - the overdue chip never appears, even though the jobs-overview filter has `onlyOverdue` and the
       health endpoint has a whole overdue list, so the server plainly knows.
   You CANNOT compute either one client-side. Orphaned means "no registered handler with this key",
   which is a server-process fact; overdue applies a server-side grace margin. Do the honest
   frontend-only thing — make the placeholders visibly nothing rather than a false negative where it
   matters, i.e. do not present "not orphaned" as a positive claim — and then write the backend ask.
   See the escalation block.

2. RUN DETAIL'S REVERSE REPLAY LINEAGE ARRIVES AS BARE IDS.
   ScheduledJobRunResponse expects `replayRuns: ReplayLineageItem[]` (id + startedAt + outcome +
   triggerSource). The server sends `replayedByRunIds: long[]` — ids and nothing else. Today the list
   maps to empty, so a run that HAS been replayed shows no sign of it.
   Decide and implement one of:
     (a) render the ids as links to each run's detail page, and drop the chips the lineage row cannot
         fill. Honest, cheap, and no worse than the empty list it replaces.
     (b) ask the backend to project the lineage rows instead of ids (escalation block).
   Do NOT fetch each run individually to fill the chips in: an N+1 on a detail page for decoration is
   not a trade worth making. If you go with (a), say in the code why the shape is what it is.

3. THERE IS NO SEPARATE "ACTUAL FIRE TIME".
   ScheduledJobRunResponse.actualFireTime is hardcoded to null in fromJson: the server has
   ScheduledFireTime (when it was DUE) and StartedAt (when it actually ran), and nothing else. The
   run detail renders a row for it that can now only ever show a dash. Either drop that row and let
   `startedAt` be the actual fire time it already is, or relabel so the pair reads
   "due at / started at". Pick one and make the labels in both locales say it.

4. `AttentionJobItem.detail` IS NEVER POPULATED.
   The needs-attention lists render a per-row reason ("overdue by 2h", the missing handler key, an
   error summary) from `detail`. ScheduledJobDto has no such field, so the row silently renders
   without it. The `v-if` degrades cleanly, so this is not a bug you must fix here — but the reason
   text is the whole point of an attention list, so it belongs in the escalation block.

WHILE YOU ARE IN THERE — the response carries more than the client reads.
ScheduledJobDto also has `misfirePolicy`, `disallowConcurrent`, `maxRetries`, `alertOnFailure`,
`timeZoneId` and `runAtUtc`; the run-history row also has `handlerKeySnapshot`, `correlationId` and
`replaysRunId`. Do not hoover all of it into the DTOs. Add only what a screen actually shows, and:
  - `runAtUtc` is not optional. ScheduleType now includes `Once` (a one-shot fires at a fixed instant
    and never recurs), and ScheduleDisplay.vue has no branch for it, so a one-shot job renders as a
    dash. Add the field, render the instant, and give it a locale string in BOTH sk and en.
  - `TriggerSource.Retry` (the dispatcher's automatic re-fire after a failure, with backoff) now
    exists in the enum and has a chip and labels. Check that the run history reads sensibly when a
    failed run is followed by three Retry rows — that is the shape an operator will actually meet.

DO NOT, in this prompt:
  - change any route or any request payload. They were verified against the server one at a time and
    are correct; if you think one is wrong, prove it from the endpoint file before touching it.
  - "fix" isOrphaned/isOverdue by inventing a client-side rule. A wrong overdue chip is worse than no
    chip.
  - widen the DTOs speculatively with every field the server happens to send.
  - touch the needs-attention response shape. It was realigned and confirmed against the server (B2).

--- Verification ---

npm run type-check — must be ZERO errors, everywhere.

Then run it for real. This module has never been seen working, and reading the C# is not the same as
watching it. Start the backend, then `npm run dev` and CHECK IT CAME UP ON PORT 3000 — the session
cookie is bound to https://localhost:3000, so a fall-forward to 3001 leaves you signed out and every
guarded screen bounces to the login page. Signed in as an admin, walk all five screens:
  - /scheduler jobs list: rows populate, the schedule column reads correctly for a cron job, an
    interval job and a one-shot; filter by owner module, by status, by last outcome and by "only
    overdue" and confirm the row set actually changes (lastOutcome and onlyOverdue are the two
    filters that only exist on the jobs-overview endpoint — if either does nothing, you are on the
    wrong route); sort by each sortable column; export xlsx and csv and open the file, confirming it
    reflects the FILTER and contains more than one page of rows.
  - a job detail: every field populated, no dashes where the server has a value.
  - its run history: durations are plausible (the server sends milliseconds, the grid renders
    seconds — a run that took 1.2 s must not read 1200 s), outcome and trigger-source chips render
    for every value including Misfired/Reversed/Retry if you can produce one, error text appears on a
    failed run, and export again.
  - a run detail: payload snapshot renders, both lineage directions render, replay works and lands
    you on (or polls up) the new run.
  - /scheduler/attention: counts, the rollup card with its window, and all three lists.
Pause and resume a job and confirm the status actually changes on the server, not just in a snackbar
— these are keyed by jobKey now, and a 404 here is silent from the operator's side.
Check both locales on every screen; a missing key renders as the raw key.

--- After the frontend work is done: write the backend ask ---

Three things above cannot be fixed from this side. Write ONE ask covering them, after the frontend
work is finished and verified, to prompts/_common/scheduler/backend/B3-<slug>.md (number from the
highest Bn already there). Read prompts/_common/scheduler/backend/README.md for the format and scope
rules first — contract only, no storage or entity prescriptions, and note in the ask that this is
shared framework infrastructure so every field must be additive.

  - `isOrphaned` and `isOverdue` on ScheduledJobDto. The server already computes both — the health
    endpoint builds an orphaned list by set-differencing the registered handler keys, and applies a
    grace margin via WhereOverdue — but neither reaches the grid. Name the two components that gate
    on them (JobActionButtons' trigger, the grid's chips) so the value of the ask is visible.
  - A reason string on the needs-attention job lists (the `detail` the client renders). Say what each
    list needs it to contain: why it failed, how far overdue, which handler key went missing.
  - The reverse replay lineage as rows rather than ids, IF you chose option (b) in item 2. If you
    shipped (a) and it reads well, do not ask — a link list is a fine answer and the ask would buy a
    little polish for a shared-infrastructure change.

Do not pre-write the ask before doing the work, and do not ask about anything you did not actually
hit. If you found the answer stated authoritatively in the server code, that is not an ask — that is
a doc fix, and the doc is src/_common/docs/modules/scheduler.md, in the same commit as your change.
```
