# R6 · One module, two paginated-query paths, and an export path with no state at all

- **Scope:** `src/_common/modules/reminders/api/{ReminderDashboardApi,ReminderDefinitionApi}.ts`; possibly `_common/api/useFetchFilteredTable.ts`
- **Backend:** —
- **Model / effort:** **Opus 5**, medium–high
- **Depends on:** R5 (which settles how the views consume these; running R6 first means adapting twice)
- **Unblocks:** nothing

---

```
The reminders module reaches the server three different ways for what is nearly the same operation. Pick
one, and be deliberate about what the framework should own.

--- Submodule note, read this first ---

These files live in src/_common, the vue_framework git submodule. CLAUDE.md says never to write to it;
this task is the approved exception. Edit them in place; do not fork into src/ and do not add a
migration-revision.md entry. Leave the work in the submodule's working tree and say so at the end. Commit
and bump the pointer only if asked. ESLint and Prettier IGNORE src/_common — match the surrounding style
by hand (tabs, single quotes, no semicolons).

**This prompt can touch shared framework files outside the reminders module.** That is allowed and may be
the right answer, but it raises the stakes: _common/api/useFetchFilteredTable.ts has consumers across
this app and potentially other apps. Anything you change there must be backwards compatible, and you must
call it out prominently in your final message.

--- The three paths ---

1. api/ReminderDashboardApi.ts:28-47 — a module-local `useFilteredTableQuery`. POSTs to an explicit path
   (the dashboard endpoints do not follow the generic /{entity}/filtered-table convention), keeps one
   AbortController per composable instance, and aborts the previous request on every new one. Wraps
   everything in useRequestState.run, so `loading` and `error` are tracked. Used by the three dashboard
   views via useUpcomingReminderQuery / useMyReminderQuery / useDispatchHistoryQuery.

2. api/ReminderDefinitionApi.ts:12-25 — the framework's `useFetchFilteredTable`, sharing a request state
   with useEntityQuery. Used by the register list. **No abort.** So the register races on rapid filter
   edits in a way the dashboard views do not: two in-flight requests, and whichever returns last wins,
   which is not necessarily the one the user asked for last.

3. api/ReminderDashboardApi.ts:49-64 — `exportFiltered`. A bare `API.post` with `responseType: 'blob'`.
   No request state, no abort, not wrapped in `run`. Its `loading` is instead re-implemented per view as
   a local `exporting` ref with its own try/catch and its own error snackbar
   (ReminderUpcomingView.vue:271-282 and ReminderDispatchHistoryView.vue:253-264 — the same twelve lines
   twice).

So: two views abort and one does not; two views hand-roll export loading and the composable knows nothing
about it.

--- The decision this prompt is actually about ---

Read _common/api/useFetchFilteredTable.ts and _common/api/useRequestState.ts first, then decide, and
state your reasoning before you write code:

**Does abort belong in the framework's useFetchFilteredTable, or is the module-local wrapper correct?**

The case for pushing it up: every filtered table in every app has this race; useRequestState already
handles cancellation correctly (it re-throws `axios.isCancel` without recording an error,
useRequestState.ts:44-45), so the plumbing is half there; and the module-local copy exists only because
the dashboard endpoints have non-conventional paths, which is a routing difference, not a behavioural one.

The case against: aborting changes observable behaviour for existing consumers — a caller that awaits
`fetchFilteredTable` and does not handle cancellation will start seeing rejections it never saw before.
That is exactly the bug R1 fixed inside this module, and there is no guarantee other consumers got the
same treatment.

If you push it up, it must be opt-in (a flag on the config, defaulting to today's behaviour) unless you
have checked every consumer in this repo and can say so. Grep for useFetchFilteredTable and count them.
If you keep it local, then say why in a comment at the top of useFilteredTableQuery, and make the
register use the local one so at least the module is internally consistent — a path prefix is not a
reason for two of five tables to behave differently under load.

Either answer is defensible. An unstated answer is not.

--- Then, regardless of that decision ---

1. Give the export path request state. `exportFiltered` should track its own loading and route errors the
   same way the queries do, so the two views can drop their local `exporting` refs and their duplicated
   try/catch/snackbar. Follow the shape of the existing exported functions — the views should end up with
   `const { exporting, exportList } = ...` or equivalent, not twelve lines each.

   Keep the behaviour identical from the user's side: the ExportMenu still shows a spinner while the blob
   downloads, and a failure still surfaces `reminderDashboard.exportError`. The filename fallback logic
   (filenameFromContentDisposition, lines 59-62) stays exactly as it is, Slovak fallback names included —
   the module is Slovak-only by design, do not "fix" those.

2. Decide whether export should abort with the query or independently. Today it shares nothing. A user
   who edits a filter mid-export almost certainly wants the export they clicked, not the one matching the
   new filter — so an export probably should NOT be aborted by a subsequent query. Make that explicit
   rather than incidental.

3. Do not merge the two api files. The split (definition registry vs dashboard) mirrors the two backend
   controllers and is correct.

4. Keep every exported function's name and signature unless you have a reason; these are framework API and
   the five views are not necessarily the only callers. Grep before renaming anything.

--- Out of scope ---

- Retry, caching, deduplication, request queues.
- The three lifecycle endpoints (pause/resume/cancel, ReminderDefinitionApi.ts:31-43). They are fine:
  small, documented, idempotent server-side, and correctly not wrapped in shared state.
- What the views do with the results (R5) and what the user sees on failure (R2).

--- Verification ---

npm run type-check — baseline 72 errors, all app-side in src/core; src/_common is clean, so any _common
error is yours. npm run lint stays at 0. If you touched useFetchFilteredTable, `npx vite build` too, and
exercise at least one non-reminders table in the app (the app has several — find one and load it) to
prove you did not break an existing consumer.

Then:
  - /pripomienky/register — type quickly into the ownerModule filter. The rows that land match the LAST
    thing you typed. Console stays clean.
  - /pripomienky/nadchadzajuce — export to each offered format; the spinner shows for the duration, the
    file downloads with the server's filename, and a blocked request shows the export error snackbar.
  - Start an export, then immediately change a filter: the downloaded file matches the filter that was
    active when you clicked.

State in your final message: which way you decided on abort and why, how many useFetchFilteredTable
consumers you found, and whether anything outside modules/reminders/ changed.
```
