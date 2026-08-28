# R2 · Two views render a blank page when their request fails

- **Scope:** `src/_common/modules/reminders/view/{ReminderOverviewView,ReminderDefinitionDetailView}.vue`; possibly a small shared component
- **Backend:** possibly — 404 semantics on the detail endpoint; see the escalation block
- **Model / effort:** Sonnet 5, medium
- **Depends on:** nothing (R1 touches different files)
- **Unblocks:** R9 (which builds on the overview and wants a settled failure path)

---

```
Two reminders views have no failure branch at all — not a degraded one, an absent one. Both render an
empty page.

--- Submodule note, read this first ---

These files live in src/_common, the vue_framework git submodule. CLAUDE.md says never to write to it;
this task is the approved exception. Edit them in place — do not fork anything into src/, and do not add
a migration-revision.md entry. Leave the work in the submodule's working tree and say so at the end; the
parent repo will show a dirty submodule pointer. Commit and bump the pointer only if asked.

ESLint and Prettier IGNORE src/_common, so `npm run lint` will not check or format what you write. Match
the surrounding style by hand: tabs, single quotes, no semicolons, `<script setup>` body indented one
level.

--- What is broken ---

1. ReminderOverviewView.vue:177-187

    async function load() {
        if (!isAdmin.value || loading.value) return
        loading.value = true
        try {
            data.value = await fetchReminderOverview()
        } catch {
            // Error snackbars are owned by the axios interceptor.
        } finally {
            loading.value = false
        }
    }

   The comment is true — the interceptor does snackbar it — but the template has three branches:
   `v-if="loading && data === null"` (spinner), `v-else-if="data"` (content), and a `v-else` that belongs
   to the *isAdmin* check one level up, not to the data check. So after a failed load: loading is false,
   data is null, and the page renders a heading, a back button, a refresh button and nothing else. The
   snackbar has already faded by the time anyone screenshots it.

2. ReminderDefinitionDetailView.vue:311-318 + template 250-259

   Identical shape: `loadReminder()` has no catch at all, the template is `v-if="reminder"` /
   `v-else-if="loading"`, and there is no third branch. A 404 on /reminder-definition/{id} — which is
   what you get from any stale bookmark, or from the id in the URL being a reminder that was hard-deleted
   — renders an empty container with a "back to list" button and a breadcrumb that says the reminder's
   kind is undefined.

Note the second-order effect on the detail view: `loadReminder` is also the `@statusChanged` handler for
ReminderActionButtons (line 26). If a pause succeeds but the reload then fails, the page goes from
"populated" to "blank" as a direct result of the user's successful action.

--- Do this ---

1. Give both views an explicit failure branch. Capture the error in the catch (a boolean is enough; a
   message is better if you can get one out of it honestly) and render a card that states what failed and
   offers a retry that re-runs the same load function. The overview already has a Refresh button at line
   18-26 — the failure card's retry should call the same `load`, not a second code path.

2. Distinguish "not found" from "failed" on the detail view. A 404 means the reminder does not exist and
   retrying will never help, so it needs different copy and a link back to the register rather than a
   retry button. Use `isAxiosError` + `e.response?.status === 404`; MyRemindersView.vue:296-312 is the
   existing precedent in this module for branching on status codes, follow its shape.

3. Fix the breadcrumb on the failure path. ReminderDefinitionDetailView.vue:323-325 watches `reminder`
   and sets the crumb from `value.kind`; when the load fails the watcher never fires and the breadcrumb
   keeps whatever the previous route left. Set the register crumb alone on failure.

4. Do not let the failure card swallow the interceptor's snackbar — both should happen. The card is for
   the state of the page; the snackbar is for the moment. Do NOT add `_silent: true` to these requests.

5. New strings go in _locales/remindersDashboard.sk.ts (overview) and _locales/reminders.sk.ts (detail),
   in Slovak, matching the surrounding tone — those files are the module's only locale and that is
   deliberate, so do not create an .en.ts.

If the two failure cards come out near-identical, factoring them into one small component under
modules/reminders/component/ is fine and welcome. Do not build a generic framework-wide error card in
_common/component/ — that is a much larger decision than this prompt.

--- Out of scope ---

- The list views' error handling. Their tables render an empty grid on failure, which is wrong too, but
  they are five files with a shared shape that R5 collapses into one composable — fixing them here means
  fixing them twice. Leave them.
- Retry-with-backoff, request deduplication, stale-while-revalidate. One button that re-runs the load.

--- Verification ---

npm run type-check — baseline 72 errors, all in src/core; src/_common is clean, so any _common error is
yours. npm run lint stays at 0 errors.

Then simulate both failures — block the request in devtools (Network → block request URL) or point the
detail route at an id that does not exist:
  /pripomienky/prehlad          — failed load shows a card with a working retry; retry after unblocking
                                  populates the page without a reload.
  /pripomienky/register/999999  — shows a "not found" state with a link back, not a spinner and not a
                                  blank page, and the breadcrumb reads sensibly.
  /pripomienky/register/<real>  — pause the reminder with the network blocked: the page keeps its
                                  content or states the refresh failed; it does not go blank.

--- After the frontend work is done: write the backend ask, IF you found one ---

You may find the detail endpoint does not actually 404 for a missing reminder — it might 200 with an
empty body, or 403, or 500. If what you observe contradicts what you had to code against, that is a
contract question worth asking, because the "not found" branch you just wrote is only correct if the
status code is.

Only then, and only after the frontend work is verified: read prompts/_common/reminders/backend/README.md for the
format and scope rules — note especially that this is the framework's shared reminder service — and write
prompts/_common/reminders/backend/Bn-<slug>.md stating what you observed, what you assumed, and which branch of
your code depends on the answer.

If a 404 is what comes back, write nothing.
```
