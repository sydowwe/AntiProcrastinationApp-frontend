# S6 · Operator affordances — the four things you actually do on this page

- **Scope:** `view/SchedulerRunDetailView.vue`, `view/SchedulerNeedsAttentionView.vue`, `component/AttentionJobList.vue`
- **Backend:** likely — the run response cannot say whether replay is possible; see the escalation block
- **Model / effort:** Sonnet 5, medium
- **Depends on:** S3 (it changes the URL query format these new links must produce)
- **Unblocks:** nothing

---

```
Four gaps in the scheduler module at src/_common/modules/scheduler/, all of them about what an
operator does at 3am when something has failed.

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
  - `npm run type-check` DOES cover src/_common. Baseline is 72 errors, all app-side in src/core;
    _common is clean. Any new error under src/_common is a regression you introduced.

1. THE TWO VALUES YOU CAME FOR CANNOT BE COPIED.
   SchedulerRunDetailView.vue:85-87 renders correlationId inside a <code class="run-correlation">
   whose CSS (:314-318) sets `word-break: break-all`. That is the exact string an operator pastes
   into a log search, and the only way to get it is to drag-select across a mid-word wrap. The
   payload snapshot (:121-125) has the same problem at 50 lines instead of one.
   Add copy-to-clipboard for correlationId, for the payload, and for the job key on both detail
   pages. Requirements:
     - Confirm the copy happened. useSnackbar (showSuccessSnackbar) is already the module's idiom —
       JobActionButtons.vue and both detail views use it. Do not invent a second feedback pattern.
     - navigator.clipboard is unavailable on insecure origins and can reject. Handle the failure
       with an error snackbar rather than a silent no-op; do not build a document.execCommand
       fallback for an internal admin page.
     - Check whether the framework already has a copy helper or a copy-button component before
       writing one — grep _common/utils/ and _common/component/. Use it if it exists.
     - Copy the RAW payload text (run.payloadSnapshot), not the pretty-printed version. The
       prettyPayload computed at :257-264 is for reading; what gets pasted into a tool should be what
       the run actually received. If you judge otherwise, offer both — but do not silently reformat
       what the operator thinks they copied.

2. THE PAYLOAD CARD IS UNBOUNDED.
   `.run-payload` (:320-329) is a <pre> with `white-space: pre`, `overflow-x: auto` and no height
   limit. A large snapshot pushes every card below it — the lineage card, which is how you navigate —
   off the screen.
   Cap it at a readable height with a scroll region, and give it an expand/collapse control for the
   rare case where you want the whole thing. Keep `white-space: pre` and the horizontal scroll: this
   is JSON, and wrapping it destroys the structure. Consider showing the payload's size or line count
   next to the header so a collapsed block is honest about what it is hiding.
   The <pre> is currently unlabelled and unreachable by keyboard — S7 owns that; do not duplicate it,
   but do not build something S7 will have to undo either. A scrollable region needs to be focusable;
   if that is trivial to do right here, do it and say so.

3. THE NEEDS-ATTENTION LISTS DEAD-END.
   AttentionJobList.vue:45-62 links each row to that one job. There is no way to say "show me all 12
   failed jobs in the grid", even though SchedulerJobsView has exactly the filters that would do it:
   lastOutcome (Failed) and the overdue toggle.
   Add a "view all in the jobs list" affordance per attention card, linking to schedulerJobs with the
   matching filter pre-applied in the query string:
     - failed   → lastOutcome=Failed
     - overdue  → the overdue toggle
     - orphaned → there is NO orphaned filter on ScheduledJobFilter. Do not fake one, do not filter
       client-side, and do not add a field to the DTO that the server will ignore. Either omit the
       link for that card or note it in the escalation block — decide which after checking whether
       the filter genuinely does not exist.
   CRITICAL: the query params must match what the jobs list actually reads. If S3 has run, the sort
   format is `?sortBy=key:desc` and the filter params come from its filterToParams — read that
   function and produce exactly what its paramsToFilter can parse back. If S3 has NOT run, match
   SchedulerJobsView.vue:276-293 instead. Verify by clicking the link and confirming the filter chips
   appear, not by reading the code.
   Also make the three status count cards (:50-91) do something. "Paused: 4" is a number an operator
   wants to click; each should link to the jobs list filtered by that status.

4. REPLAY IS OFFERED ON RUNS THAT CANNOT BE REPLAYED.
   SchedulerRunDetailView.vue:34-41 shows the Replay button unconditionally. But the module already
   knows this action can be impossible: JobActionButtons.vue:115 DISABLES trigger when a job is
   orphaned, with the explanation string scheduler.actions.cannotTriggerOrphaned, and
   useSchedulerFormat.ts:26-28 has a dedicated message for the 409/422 the server returns when a run's
   job no longer has a registered handler. So the failure is known, predicted, has copy written for
   it — and is still only discovered after clicking through a two-step confirmation dialog that warns
   about real side effects.
   The blocker: ScheduledJobRunResponse carries no status or orphan flag for its parent job (read the
   DTO — jobId and jobKey, nothing else about the job). The client cannot tell.
   Do the honest frontend-only version now: keep the button enabled, and make sure the failure is
   handled gracefully — the error path already maps 409/422 to the right message, so verify it
   actually fires and that the dialog closes cleanly rather than leaving the operator stuck with a
   spinner. Leave a `// TODO(Bn):` at the button. Then read the escalation block.
   Also check the acknowledge checkbox resets between uses: ReplayConfirmDialog.vue:59 resets
   `acknowledged` on the `closed` event, and MyDialog.vue:135-139 emits `closed` from a watcher on
   its v-model, so a programmatic close (JobRunHistory.vue:322, SchedulerRunDetailView.vue:290) does
   reset it. Confirm that by hand — this is the safety gate on a destructive action, and if it ever
   stops resetting, the second replay of a session happens with one click and no warning read.

DO NOT, in this prompt:
  - add auto-refresh or relative timestamps (that is S5),
  - add aria attributes, focus styling or breakpoints (that is S7),
  - add a bulk replay or bulk trigger action — replays repeat real side effects, and a multi-select
    on that is a feature decision nobody has made,
  - change any request or response shape.

--- Verification ---

npm run type-check — must stay at 72 errors, all in src/core. Zero under src/_common.
Then, as an admin:
  - Copy the correlation ID and paste it somewhere: identical string, no whitespace or line breaks
    introduced by the wrapping.
  - Copy a payload and paste it into a JSON validator: valid, and byte-identical to what the server
    sent.
  - Open a run with a large payload: the lineage card must still be reachable without scrolling past
    a wall of JSON, and expand must show the whole thing.
  - From needs-attention, click "view all" on each card and on each count card: the jobs list must
    open WITH the filter chips visible and the row count matching the number on the card it came
    from. A reload of that URL must preserve the filter.
  - Replay a run belonging to an orphaned job (or simulate the 409): a clear message, the dialog
    closes, no stuck spinner.
  - Open the replay dialog, tick acknowledge, confirm; then open it again on another run: the
    checkbox must be UNTICKED and the confirm button disabled.

--- After the frontend work is done: write the backend ask, IF you found one ---

Item 4 is the candidate, and it is a good one — the fix is a single additive field.

  - ScheduledJobRunResponse carries jobId and jobKey but nothing about the job's current state. To
    decide whether Replay is possible the client needs to know whether the job is orphaned (its
    handler is no longer registered) and, arguably, its JobStatus. ScheduledJobGridResponse and
    ScheduledJobResponse both already carry `isOrphaned` (see their :23-26), so the server plainly
    computes it — the question is whether it can ride along on the run response, which endpoint that
    should hang off, and whether it is hot enough to matter.
  - The related unknown, if you did not already resolve it in S1: what
    POST /scheduled-job-run/{runId}/replay actually returns. SchedulerApi.ts:109 reads
    `response.data?.id ?? response.data`, which is a guess with a fallback, and
    SchedulerRunDetailView.vue:292 guards with `typeof newRunId === 'number' && newRunId > 0` before
    navigating. Both disappear given one sentence of contract.
  - From item 3: whether ScheduledJobFilter can gain an `isOrphaned` filter. Only ask if you
    confirmed the grid genuinely cannot express it — and frame it as a question about whether
    orphaned is a filterable concept server-side, not as a demand for a field.

Write the ask AFTER the frontend work is finished and verified. Read
prompts/_common/scheduler/backend/README.md for the format and scope rules — note especially that
this is shared framework infrastructure, so say plainly whether an existing consumer breaks if the
field is absent — and write it to prompts/_common/scheduler/backend/Bn-<slug>.md.

If a `Bn-` file already covers the replay response shape (S1 may have written one), ADD to it or
reference it rather than filing a second ask on the same question.
```
