# S1 · Correctness sweep — six live bugs in the scheduler module

- **Scope:** `src/_common/modules/scheduler/view/*.vue`, `component/JobRunHistory.vue`, `dto/request/ScheduledJobFilter.ts`
- **Backend:** possibly — trigger/replay timing has no stated contract; see the escalation block
- **Model / effort:** Sonnet 5, medium
- **Depends on:** nothing
- **Unblocks:** S3 (rewrites the grid load path), S4 (extracts the detail shell whose states you fix here)

---

```
You are fixing six confirmed bugs in the scheduler module at src/_common/modules/scheduler/.

SUBMODULE RULES — read before editing:
src/_common is the vue_framework repo mounted as a git submodule, and CLAUDE.md says never to write
to it. This task is an explicit, user-approved exception: the scheduler module lives there and
nowhere else. So:
  - Edit the files in src/_common in this working tree.
  - src/_common is a separate git repo. If you commit, commit INSIDE src/_common first, then commit
    the updated pointer in the parent repo. Work committed only in the parent is lost.
  - ESLint and Prettier ignore src/_common, so `npm run lint` will not check your work. Match the
    surrounding style by hand: tabs, single quotes, no semicolons, tab-indented <script setup>.
  - `npm run type-check` is the gate. Baseline is 72 errors, ALL app-side in src/core. src/_common is
    clean — any new error under src/_common is a regression you introduced.

Fix these six, in this order.

1. THE RUN DETAIL VIEW NEVER REFETCHES ON A PARAM CHANGE.
   SchedulerRunDetailView.vue:304 wires loadRun to onMounted only. Three flows navigate from a run
   detail page to another run detail page — the same route, a different :id:
     :147  the "replayed from" parent link
     :167  each child link in the replay-lineage list
     :293  router.push after a successful replay
   Vue Router reuses the component, so the URL and the breadcrumb change while the page still shows
   the previous run's outcome, error and payload. On the replay path this is the worst case: the
   success snackbar fires, the URL says run #91, and the body is still run #47.
   Fix: watch the `id` prop and reload. Note `id` is a destructured prop (Vue 3.5 reactive
   destructure) — `watch(() => id, ...)` is the correct form, `watch(id, ...)` is not. Use
   `{ immediate: true }` and drop the onMounted call rather than having both.
   Check SchedulerJobDetailView.vue for the same shape. It has the same onMounted-only load at :208
   and its own :id route; nothing currently links job-detail → job-detail, but fix it the same way
   for consistency and to stop the next link from reintroducing it.

2. EVERY FAILURE IS REPORTED AS "THIS WAS DELETED".
   SchedulerJobDetailView.vue:188-193 and SchedulerRunDetailView.vue:276-281 both catch everything
   and null the record, which renders the notFound alert — whose text says the record "may have been
   removed or the link is no longer valid" (scheduler.job.notFoundText / scheduler.run.notFoundText
   in _locales/scheduler.sk.ts). A 500, a network drop or a 403 all claim the operator's job was
   deleted. Neither page offers a retry.
   Fix: distinguish a 404 from everything else. Use `isAxiosError` from 'axios' — the module already
   imports it that way in JobActionButtons.vue:84 and composable/useSchedulerFormat.ts:1. On 404 keep
   the existing not-found alert. On anything else show a distinct load-failure alert WITH a retry
   button that calls the loader again. Add the new keys to _locales/scheduler.sk.ts under
   scheduler.job.* and scheduler.run.* next to the existing notFound keys. There is a precedent for
   the wording and the shape: scheduler.needsAttention.loadError plus the loadFailed ref in
   SchedulerNeedsAttentionView.vue:198.
   Note the comment currently sitting in both catch blocks ("The axios interceptor already surfaces
   the error") is true — the interceptor shows a snackbar — but a snackbar that has already faded is
   not a page state. Delete the comment along with the behaviour it justified.

3. NON-ADMINS GET A BLANK WHITE PAGE.
   SchedulerJobsView.vue:6, SchedulerJobDetailView.vue:6 and SchedulerNeedsAttentionView.vue:6 each
   wrap the entire page in <template v-if="isAdmin"> with no v-else, so a non-admin renders an empty
   VContainer. SchedulerRunDetailView.vue:214-219 is the only one that gets it right — a VCard with
   $t('general.forbidden').
   Fix: give the other three the same fallback. Copy the RunDetailView block verbatim so all four
   pages are identical; do not invent a second variant.
   Keep BOTH layers of the check. meta.requiredRole: 'admin' in scheduler.routes.ts and the in-view
   isAdmin computed are deliberate belt-and-braces for apps with a real role model — in this app the
   adapter returns constant true (src/core/user/authAdapter.ts), which is exactly why this bug has
   never been seen here. Do not "simplify" either layer away.

4. AN UNHANDLED PROMISE REJECTION ON EVERY NON-CANCEL GRID ERROR.
   SchedulerJobsView.vue:305-307 and JobRunHistory.vue:288-290:
       } catch (e: unknown) {
           if (!isCancel(e)) throw e
       }
   loadItems is async and wired to BasicTable's @onLoadItems, so nothing awaits it — the throw
   becomes an unhandled rejection. The grid keeps its stale rows and the spinner clears, so a failed
   filter silently shows the previous result set as if it were the new one.
   Fix minimally: keep ignoring cancellations, and on a real error surface it and clear the stale
   rows so the empty state is honest rather than wrong. useSnackbar (showErrorSnackbar) is already
   imported in SchedulerJobsView; JobRunHistory imports it too.
   Keep this small. S3 migrates both grids to useServerTable, which has a first-class onError hook
   this will move into — do not start that migration here, and do not add a retry button or an
   error slot to the tables.

5. THE OVERDUE SWITCH IS OUTSIDE THE FILTER IT BELONGS TO.
   SchedulerJobsView.vue:227 keeps onlyOverdue as a ref separate from the `filter` ref, merged into
   the request at :263. Consequences: FilterPanel's reset (defaultFactory at :24) does not clear it,
   it produces no filter chip, and ScheduledJobFilter.onlyOverdue (dto/request/ScheduledJobFilter.ts:15)
   is a field that is never assigned — a wire-payload slot only.
   Fix: make onlyOverdue a real part of ScheduledJobFilter. Bind the VSwitch to
   filter.value.onlyOverdue, add a chipFormatter for it alongside the six at :242-252, delete the
   separate ref, and simplify buildRequest to stop merging. Keep the switch where it is in the
   layout — it is a deliberately prominent one-click control, not a buried filter field; it just has
   to write to the same object as everything else.
   Two details: the URL param is currently `overdue` (queryBool at :227, written at :285) — keep that
   param name so existing bookmarks still work. And the filter is `boolean | null`, where null and
   false must stay distinguishable on the wire; a VSwitch gives you false, not null, so write
   `x ? true : null` when building the request, as the current code already does at :263.

6. THE POST-TRIGGER REFRESH RACES THE JOB IT TRIGGERED.
   SchedulerJobDetailView.vue:196-199 calls runHistory.reload() the instant triggerJobNow resolves.
   The API doc comment (SchedulerApi.ts:57) and the success message
   (scheduler.actions.triggered: "…the new run will appear in the history shortly") both say the run
   happens in the background. JobRunHistory.vue:325 has the same problem after a replay, under a
   comment that reads "The replay runs in the background; refresh shortly" — which it does not do.
   Net effect: the operator clicks Trigger, gets a success snackbar, and the history does not change.
   Fix honestly, frontend-only: the run appears when it appears, so refresh more than once. Do a
   short bounded poll — refresh immediately (so a synchronous backend is handled), then a small
   number of further refreshes a few seconds apart, stopping early once the row count grows. Keep it
   simple and make sure the timer is cleared on unmount (onUnmounted / onScopeDispose) so it cannot
   fire into a torn-down component. Do NOT add a spinner that blocks the table for the whole poll —
   the existing rows must stay readable.
   Read the escalation block below before you start this one: the right fix may be a contract change,
   and you are the one who will know.

DO NOT, in this prompt:
  - migrate either grid to useServerTable/useTableUrlState (that is S3),
  - extract any shared component (that is S4),
  - add an EN locale file (that is S2) — add your new keys to scheduler.sk.ts only,
  - add auto-refresh or relative timestamps (that is S5),
  - change any request or response shape.

--- Verification ---

npm run type-check — must stay at 72 errors, all in src/core. Zero under src/_common.
Then, signed in as an admin, in the app:
  - Open a run that is a replay of another run and click through the "replayed from" link: the page
    body must change, not just the URL.
  - Replay a run: after the redirect the page must show the NEW run (a different id in the header).
  - Open a job detail with a bad id in the URL (e.g. /planovac/ulohy/99999): "not found", not
    "failed to load".
  - Stop the backend and reload a job detail: "failed to load" with a working retry button.
  - Toggle "only overdue", then hit FilterPanel's reset: the switch must go off with everything else,
    and it must show a chip while on. Reload the page with ?overdue=true: still on.
  - Trigger a job and watch the history without touching anything: the new run must appear on its
    own within a few seconds.

--- After the frontend work is done: write the backend ask, IF you found one ---

Bug 6 is the candidate. A bounded client-side poll is a workaround for not knowing the contract, and
while implementing it you will have learned exactly what you do not know. The open questions:

  - Does POST /scheduled-job/{id}/trigger complete synchronously, or does it enqueue? If it enqueues,
    is there any signal (a returned run id, a Location header) the client could use instead of
    polling blind? SchedulerApi.ts:58 currently returns Promise<void> and discards the response body
    without ever having checked whether there is one.
  - Same for POST /scheduled-job-run/{runId}/replay. SchedulerApi.ts:109 reads
    `response.data?.id ?? response.data`, which is the shape of a guess — the client genuinely does
    not know whether it receives { id }, a bare number, or nothing. SchedulerRunDetailView.vue:292
    then guards with `typeof newRunId === 'number' && newRunId > 0` before daring to navigate. If the
    contract is `{ id }`, both the guess and the guard can be deleted.

If you had to guess at either, write the ask AFTER the frontend work is finished and verified. Read
prompts/_common/scheduler/backend/README.md for the format and scope rules — note especially that
this is framework code, so you are asking about the scheduler's published contract, not about this
app's database — and write it to prompts/_common/scheduler/backend/Bn-<slug>.md.

If you found the contract stated somewhere authoritative and unambiguous, do not write anything. An
ask that says "please confirm the thing I already confirmed" wastes the backend agent's turn.
```
