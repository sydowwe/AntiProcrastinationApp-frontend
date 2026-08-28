# `_common/reminders` prompts

Improvements to `src/_common/modules/reminders/` — the framework's reminder registry + dashboard, 39 files / ~3.3k lines. One self-contained prompt per file, each
written to be pasted into a fresh session in this repo (`../../../../CLAUDE.md` auto-loads there, so the prompts carry only task-specific facts — paths, line
numbers, the framework composables that already exist — rather than restating conventions).

Correctness first, then structure, then UX, then new capability. Every defect below was confirmed by reading the code.

## ⚠ These prompts edit the submodule

`src/_common` is the `vue_framework` git submodule, and `../../../../CLAUDE.md` says never to write to it. **The user has explicitly approved editing it in place for
this work.** Every prompt repeats that in a short block, because each is meant to be pasted cold. What that means in practice:

- Edit the files under `src/_common/modules/reminders/` directly. Do **not** fork a file into `../../../../src`, and do **not** add a
  `../../../../migration-revision.md` entry — that file records gaps you are *not* allowed to fix, which is the opposite of this situation.
- Leave the work in the submodule's working tree and say so in your final message: the parent repo will show a dirty submodule pointer. Commit inside the submodule
  and bump the pointer **only if the user asks**.
- **ESLint and Prettier are configured to ignore `src/_common`.** `npm run lint` will not check, format, or warn about anything you write here. Match the surrounding
  style by hand: tabs for indentation,
  `<script setup>` body indented one level inside the tag, single quotes, no semicolons.
- `npm run type-check` **does** cover `src/_common`. The baseline is 72 errors, all app-side in
  `../../../../src/core`; `_common` itself is clean. **Any new `_common` error is a regression you introduced**, not baseline noise.

## Index

| #   | Prompt                                                    | Kind       | Backend  | Model      | Effort   |
|-----|-----------------------------------------------------------|------------|----------|------------|----------|
| R1  | [Correctness sweep ⭐](R1-correctness-sweep.md)           | bug        | likely   | Sonnet 5   | medium   |
| R2  | [Blank pages on failure](R2-error-states.md)              | bug / UX   | possibly | Sonnet 5   | medium   |
| R3  | [Slovak plurals](R3-slovak-plurals.md)                    | bug        | —        | Sonnet 5   | low      |
| R4  | [Encoding hygiene](R4-encoding-hygiene.md)                | debt       | —        | Sonnet 5   | low      |
| R5  | [Five views onto `useServerTable` ⭐](R5-server-table.md) | debt       | —        | **Opus 5** | high     |
| R6  | [The query / export api layer](R6-api-layer.md)           | debt       | —        | **Opus 5** | med–high |
| R7  | [Admin gating, stated once](R7-admin-gating.md)           | debt       | —        | Sonnet 5   | low      |
| R8  | [Keyboard, screen readers, narrow screens](R8-a11y.md)    | UX         | —        | **Opus 5** | high     |
| R9  | [Overview: freshness and drill-down](R9-overview.md)      | UX         | possibly | **Opus 5** | high     |
| R10 | [Snooze / dismiss hardening](R10-snooze-dismiss.md)       | UX / bug   | possibly | Sonnet 5   | medium   |
| R11 | [Bulk lifecycle actions](R11-bulk-actions.md)             | capability | **yes**  | **Opus 5** | high     |
| R12 | [Occurrence preview](R12-occurrence-preview.md)           | capability | **yes**  | **Opus 5** | high     |

Each prompt is independently runnable. `Depends on` in each header is about avoiding merge pain, not correctness. The only ordering that really matters:

- **R1 first** — it fixes live bugs that R5 would otherwise carry forward.
- **R5 before R6/R7/R8/R11** — R5 rewrites the script block of all five views; those four then edit far less. Running them first means doing the same work twice.
- **R4 before anything that touches the four view files**, if you care about a clean diff — those files currently carry a BOM, and an editor that strips it will bury
  your real change in a whole-file diff.

## The confirmed defects

- **Applying a filter on the register keeps you on page 3.** `ReminderDefinitionsView.vue:13` wires
  `@apply="loadItems"`; the other four views wire a `reload()` that resets `page` to 1 first. So a filter that matches four rows renders an empty table. (R1)
- **The dispatch history fires two requests on mount, and the first one is wrong.**
  `ReminderDispatchHistoryView.vue:266-273` calls `loadItems()` in `onMounted`, but `DataTable.vue:23`
  already emits `onLoadItems` from `@update:options`, which Vuetify fires on mount. The deep-linked
  `?reminderId=` filter is applied between the two, so request #1 goes out unfiltered. (R1)
- **Every `loadItems()` is called without a catch.** `useFilteredTableQuery`
  (`ReminderDashboardApi.ts:36`) aborts the in-flight request on every new one, and `useRequestState.run`
  correctly re-throws cancellations (`useRequestState.ts:45`) — but the views call `loadItems()` as a bare event handler, so each aborted request becomes an
  unhandled promise rejection. Type fast in a filter and the console fills up. (R1)
- **The register's schedule column is always "—".** `ReminderDefinitionsView.vue:84` renders
  `<ReminderScheduleDisplay :scheduleType>` and passes nothing else, so cron rows show "—"
  (`ReminderScheduleDisplay.vue:12`) and interval rows show "—" (line 47). The three other views pass all four props and render properly.
  `ReminderDefinitionGridResponse` does not carry
  `cronExpression`/`intervalPreset` at all — this one needs the backend. (R1 + escalation)
- **Two views render a blank page when their request fails.** `ReminderOverviewView.vue:177-187`
  swallows the error and leaves `data` null; the template's `v-else-if="data"` then matches nothing and the `v-else` forbidden card belongs to the *admin* check, not
  the data check. Same shape at
  `ReminderDefinitionDetailView.vue:250-259` — a 404 on `/reminder-definition/{id}` renders an empty container with a back button. (R2)
- **Slovak plurals are hardcoded to the 5+ form.** `reminders.sk.ts:56-58` defines
  `unit.day: 'dní'`, `hour: 'hodín'`, `minute: 'minút'`, so `formatLeadOffset(-1440)` renders **"1 dní pred termínom"**. Same bug at `remindersDashboard.sk.ts:75`
  (`'Splatné do {days} dní'` → "do 1 dní"). The three-form SK plural rule already exists at `src/i18n.ts:9` and `todoList.sk.ts:38` uses it correctly — the reminders
  locale simply never adopted it. (R3)
- **`canAct` never re-evaluates.** `MyRemindersView.vue:206-209` compares `nextOccurrence` against
  `Date.now()` with no reactive clock, so an occurrence that passes while the tab sits open keeps its snooze and dismiss buttons enabled; the click then 400s and is
  explained away as "this occurrence is no longer in the future". `useCurrentTime` exists in the framework. (R1)
- **Four view files carry a UTF-8 BOM**, and `ReminderDispatchHistoryView.vue:267` already contains mojibake — `?reminderId=â€¦`, a `…` that went through the cp1252
  round-trip your global `../../../../CLAUDE.md`
  documents. (R4)

## Duplication, measured

- **Five views hand-roll the same server-table block.** `items` / `itemsLength` / `itemsPerPage` /
  `page` / `sortBy` / `filter` / `buildRequest()` / `loadItems()` / `reload()`, copy-pasted with drift — the register's missing page reset (above) is exactly that
  drift. The framework already ships
  `_common/composable/table/useServerTable.ts`, which returns that entire set, coalesces the mount burst, and layers `useTableUrlState` on top. The reminders module
  uses neither — and neither does anything else: **`useServerTable` has zero consumers in this repo**, so R5 is both the biggest win here and the first real exercise
  of that composable. R5 says so, and pilots one view before converting five. (R5)
- **Filter, page and sort are absent from the URL** in all five views, against the explicit URL-state rule in `../../../../CLAUDE.md`. The one deep-link that exists
  (`?reminderId=`) is hand-parsed in `onMounted` and is write-only — changing the filter afterwards does not update the URL. R5 gets this for free.
- **Two different paginated-query paths.** The dashboard views use a module-local
  `useFilteredTableQuery` (`ReminderDashboardApi.ts:28`, with abort); the register uses the framework's
  `useFetchFilteredTable` (no abort). Neither export path (`exportFiltered`, line 49) has request state or abort at all, and both bypass `run()`, so `loading` never
  reflects them. (R6)
- **The admin check is written twice per view, five times over.** `meta: { requiredRole: 'admin' }` in
  `reminders.routes.ts` *and* a `v-if="isAdmin"` wrapping the entire template with a hand-rolled forbidden card in four views. In this app the adapter returns a
  constant `true`
  (`../../../../src/core/user/authAdapter.ts`), so the card is unreachable dead code — but it is the framework's file, so the answer is "state the gate once", not
  "delete it". (R7)

## New capability

R11 and R12 add things the module does not do. Both genuinely need the backend, and both are written so the frontend work lands and ships on its own first.

- **R11 — bulk lifecycle actions.** Every view passes `:showSelect="false"`; pausing 30 reminders after a data import is 30 dialogs.
- **R12 — occurrence preview.** The detail view shows a cron expression as a raw string and a single
  `nextOccurrenceAt`. An admin cannot answer "so when does this actually fire?" without deploying and waiting. Cron cannot honestly be evaluated client-side, so the
  panel is built against a stated contract and the ask is written from the work.

## Backend

`backend` starts empty on purpose. These prompts do not pre-write backend requests — the agent implementing a prompt is the one that discovers exactly which field
was missing and writes a sharper ask than anyone could from a cold read. R1, R2, R9, R10, R11 and R12 each end with an escalation block telling the agent to finish
the frontend work first, then write the ask if it actually hit the wall.
`backend/README.md` holds the format and the scope rules (contract and business logic only — no storage, entity or migration decisions).

Note that the reminders backend is framework-side too, so an ask here is a request against the shared reminder service, not against this app's endpoints. Say so in
the ask.

## Not in scope — do not raise these

- **The module is Slovak-only** (`_locales/` has no `.en.ts`, `EN.ts` spreads nothing for it, the export filenames at `ReminderDashboardApi.ts:76,98` are Slovak, and
  the route paths are `/pripomienky/*`). This is **by design** — the framework's own `common` locale is SK-only. R3 fixes plurals because they are wrong *in Slovak*;
  nothing else here is a localization defect. Do not add an EN locale, do not rename the routes, do not "fix" the export filenames.
- **`RecipientChips` renders bare `#id` references rather than names.** Deliberate — the comment at
  `RecipientChips.vue:36` states the module carries no PII. Do not resolve ids to users.
