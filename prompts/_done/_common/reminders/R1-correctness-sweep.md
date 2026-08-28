# R1 · Correctness sweep — five live bugs in the reminders views

- **Scope:** `src/_common/modules/reminders/view/{ReminderDefinitionsView,ReminderDispatchHistoryView,MyRemindersView,ReminderUpcomingView}.vue`
- **Backend:** likely, for one of the five — see the escalation block at the end
- **Model / effort:** Sonnet 5, medium
- **Depends on:** nothing
- **Unblocks:** R5 (which rewrites these script blocks and would otherwise carry the bugs forward)

---

```
Five confirmed bugs in src/_common/modules/reminders/. Fix them; do not restructure anything else
(R5 owns the structural rewrite of these same files, and a big refactor here makes that merge painful).

--- Submodule note, read this first ---

These files live in src/_common, the vue_framework git submodule. CLAUDE.md says never to write to it;
this task is the approved exception. Edit them in place — do not fork anything into src/, and do not add
a migration-revision.md entry (that file is for gaps you are NOT allowed to fix). Leave the work in the
submodule's working tree and say so at the end; the parent repo will show a dirty submodule pointer.
Commit inside the submodule and bump the pointer only if asked.

ESLint and Prettier are configured to IGNORE src/_common, so `npm run lint` will not check or reformat
what you write here. Match the surrounding style by hand: tabs, single quotes, no semicolons, and the
`<script setup>` body indented one level inside the tag.

--- Bug 1: applying a filter on the register leaves you on the old page ---

ReminderDefinitionsView.vue:13 wires the FilterPanel as `@apply="loadItems"`.

The four other views wire `@apply="reload"`, where `reload()` sets `page.value = 1` before loading
(e.g. MyRemindersView.vue:239-242). So on the register, filtering to something with four matches while
you are on page 3 renders an empty table with a populated pager.

Fix: give ReminderDefinitionsView the same `reload()` the others have, and wire `@apply` to it.

--- Bug 2: the dispatch history fires two requests on mount, and the first is unfiltered ---

ReminderDispatchHistoryView.vue:266-273 does:

    onMounted(() => {
        const reminderIdParam = Number(route.query.reminderId)
        if (...) filter.value.reminderId = reminderIdParam
        loadItems()
    })

But the table already loads itself: BasicTable forwards `@onLoadItems` from DataTable.vue:23, which
emits it from `@update:options` — and Vuetify's server table emits `update:options` on mount. So there
are two fetches, and the ordering puts the unfiltered one first. This is the only one of the five views
with an `onMounted` fetch; the others rely on the table's emit alone, which is the correct pattern here.

Fix: apply the deep-linked `reminderId` to `filter` synchronously during setup (not in `onMounted`), and
drop the `onMounted(loadItems)` entirely. Confirm in the network tab that exactly one request goes out on
mount and that it carries the reminderId when you arrive via
`?reminderId=…` — that link is produced by ReminderUpcomingView.vue:163 and
OverviewFailureList.vue:45, so test from both.

--- Bug 3: aborted requests become unhandled promise rejections ---

useFilteredTableQuery (api/ReminderDashboardApi.ts:28-47) aborts the previous in-flight request whenever
a new one starts, and useRequestState.run re-throws cancellations deliberately
(_common/api/useRequestState.ts:44-45 — "Cancelled requests are intentional"). That contract is fine.
What is missing is the catch on the consumer side: every view does

    async function loadItems() {
        const result = await fetchFilteredTable(buildRequest())
        items.value = result.items
        itemsLength.value = result.itemsCount
    }

and then hands `loadItems` straight to `@onLoadItems` as a bare handler. Nobody awaits it, so every
aborted request surfaces as an unhandled rejection. Type into a filter field quickly and watch the
console.

Fix: swallow cancellations in `loadItems` in all five views — `axios.isCancel(e)` is the check
useRequestState itself uses; re-throw or surface anything else rather than silencing all errors (R2 owns
what the user actually sees on a real failure, so do not build an error UI here — just stop the unhandled
rejection and leave real errors reaching the interceptor). Keep the fix in one shape across the five
files so R5 can lift it into one place later.

--- Bug 4: snooze and dismiss stay enabled after the occurrence passes ---

MyRemindersView.vue:206-209:

    function canAct(id: number): boolean {
        const next = itemsById.value.get(id)?.nextOccurrence
        return next !== null && next !== undefined && next.getTime() > Date.now()
    }

`Date.now()` is not reactive, so nothing re-evaluates this as time passes. This is a page people leave
open: an occurrence 40 seconds away keeps its enabled Snooze and Dismiss buttons indefinitely, and the
click then 400s and is explained to the user as "this occurrence is no longer in the future"
(handleActionError, line 306) — a bug reported to the user as if it were their mistake.

Fix: drive the comparison from a reactive clock. `_common/composable/general/useCurrentTime.ts` already
exists — read it first and use it if its tick interval suits (a minute-granularity tick is plenty; do not
add a per-second timer to a table). The same clock should drive SnoozeDialog's validity check
(SnoozeDialog.vue:125 has the identical `Date.now()` pattern) if that falls out naturally; if it does
not, leave the dialog to R10 and note it.

--- Bug 5: the register's schedule column is always "—" ---

ReminderDefinitionsView.vue:84:

    <template #item.scheduleType="{ item }">
        <ReminderScheduleDisplay :scheduleType="item.scheduleType" />
    </template>

ReminderScheduleDisplay takes four props. With only `scheduleType`, a RecurringCron row renders "—"
(component line 12) and a RecurringInterval row renders "—" (line 47); only OneShot degrades gracefully,
to the bare type name. The three dashboard views pass all four and render correctly
(e.g. ReminderUpcomingView.vue:117-122).

The reason the register cannot pass them: ReminderDefinitionGridResponse
(dto/response/ReminderDefinitionGridResponse.ts) has no `cronExpression` and no `intervalPreset`.
UpcomingReminderGridResponse has both. The grid endpoint simply does not return them.

Do the honest frontend-only part now: pass `:dueAt="item.nextOccurrenceAt"` so OneShot rows at least
render their date like they do elsewhere, and leave a `// TODO(Bn):` at the call site naming the two
missing fields. Do NOT invent a client-side workaround — do not fetch the detail endpoint per row, and do
not hide the column. Then write the ask (see the last section).

--- Verification ---

npm run type-check — the baseline is 72 errors, all app-side in src/core; src/_common is clean, so any
_common error in the output is one you introduced. npm run lint must stay at 0 errors (it will not cover
the files you edited, but it must not break on the app side either).

Then, signed in, with the network tab open:
  /pripomienky/register     — filter to something narrow from page 2+; you land on page 1 with results.
                              A cron reminder shows its date or type, not a bare "—".
  /pripomienky/historia     — exactly one request on mount. Arriving from the upcoming list's
                              "view history" button pre-filters to that reminder on the FIRST request.
  /pripomienky/nadchadzajuce — type quickly into the ownerModule filter; console stays clean.
  /pripomienky/moje         — a row whose occurrence passes while you watch has its buttons disable
                              without a reload.

--- After the frontend work is done: write the backend ask, IF you found one ---

Bug 5 is the one you cannot finish. Before writing anything, check whether you actually need the backend:
read ReminderDefinitionGridResponse and UpcomingReminderGridResponse side by side and confirm the two
fields really are absent from the former rather than being dropped in fromJson.

If they are absent, write the ask AFTER the frontend work is finished and verified. Read
prompts/_common/reminders/backend/README.md for the format and the scope rules first — in particular, this is the
FRAMEWORK's shared reminder service, so say so, and say whether the change is additive. Write it to
prompts/_common/reminders/backend/Bn-<slug>.md.

The interesting part of the ask is not "please add two fields". It is the question underneath: the
register list is the reminder *registry*, and its grid response is conspicuously leaner than the
dashboard's. Ask whether that is deliberate — and if it is, what the register's schedule column is
supposed to show, because right now the answer is nothing.

If it turns out the fields are there and the view simply failed to pass them, fix the view and write
nothing.
```
