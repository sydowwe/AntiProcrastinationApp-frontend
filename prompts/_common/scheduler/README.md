# `_common/scheduler` prompts

Improvements to `src/_common/modules/scheduler/` — the framework's admin background-jobs dashboard,
33 files / ~2.3k lines. One self-contained prompt per file, each written to be pasted into a fresh
session in this repo (`CLAUDE.md` auto-loads there, so the prompts carry only task-specific facts —
paths, line numbers, the framework composables that already exist — rather than restating conventions).

Correctness first, then structure, then UX. Every defect below was confirmed by reading the code.

## ⚠ These prompts edit the submodule

`src/_common` is the `vue_framework` git submodule, and `CLAUDE.md` says never to write to it. **The
user has explicitly approved editing it in place for this work.** Every prompt repeats that in a short
block, because each is meant to be pasted cold. What that means in practice:

- Edit the files under `src/_common/modules/scheduler/` directly. Do **not** fork a file into `src/`,
  and do **not** add a `migration-revision.md` entry — that file records gaps you are *not* allowed to
  fix, which is the opposite of this situation.
- Leave the work in the submodule's working tree and say so in your final message: the parent repo will
  show a dirty submodule pointer. Commit inside the submodule and bump the pointer **only if the user
  asks**.
- **ESLint and Prettier are configured to ignore `src/_common`.** `npm run lint` will not check, format,
  or warn about anything you write here. Match the surrounding style by hand: tabs for indentation,
  `<script setup>` body indented one level inside the tag, single quotes, no semicolons.
- `npm run type-check` **does** cover `src/_common`. The baseline is 72 errors, all app-side in
  `src/core`; `_common` itself is clean. **Any new `_common` error is a regression you introduced**,
  not baseline noise.

## Index

| #  | Prompt                                                        | Kind       | Backend  | Model      | Effort   |
|----|---------------------------------------------------------------|------------|----------|------------|----------|
| S1 | [Correctness sweep ⭐](S1-correctness-sweep.md)                | bug        | possibly | Sonnet 5   | medium   |
| S2 | [Locale independence](S2-locale-independence.md)              | bug / i18n | —        | Sonnet 5   | med–high |
| S3 | [Two grids onto `useServerTable` ⭐](S3-table-plumbing.md)     | debt       | —        | **Opus 5** | high     |
| S4 | [Shared shells](S4-shared-shells.md)                          | debt       | —        | **Opus 5** | high     |
| S5 | [Freshness](S5-freshness.md)                                  | UX         | likely   | **Opus 5** | high     |
| S6 | [Operator affordances](S6-operator-affordances.md)            | UX         | likely   | Sonnet 5   | medium   |
| S7 | [Keyboard, screen readers, narrow screens](S7-a11y.md)        | UX         | —        | **Opus 5** | high     |
| S8 | [Contract realignment ⭐](S8-contract-realignment.md)          | bug        | yes      | **Opus 5** | high     |

Each prompt is independently runnable. `Depends on` in each header is about avoiding merge pain, not
correctness. The only ordering that really matters:

- **S1 first** — it fixes live bugs S3 and S4 would otherwise carry forward.
- **S3 before S4/S7** — S3 rewrites the script block of both grids and deletes a composable; running
  the others first means doing that work twice.
- **S3 before S6** — S6 builds links into the jobs list, and S3 changes the URL query format those
  links have to produce.
- **S1 before S4** — S4 extracts the detail-page shell whose states S1 fixes.

- **S8 last, and it is not optional.** It came out of the B2 sweep, which found that this client was
  written against an API nobody had checked: every route was wrong, and several response fields still
  are. S8 finishes that against the real server (`RiderProjects/AdhdTimeOrganizer/framework/Sydowwe.Scheduler`)
  and is the first prompt that requires actually running the module against a live backend.

**Running them in numeric order — S1 → S2 → S3 → S4 → S5 → S6 → S7 → S8 — satisfies all five**, and is
the right default. If you want to parallelize, S2 and S5 touch little of what S3/S4 rewrite; S6 and
S7 are the two that genuinely want to go last.

Each prompt tells the agent to leave its work in the submodule's working tree, so expect a dirty
`src/_common` after every run.

## The confirmed defects

- **The run detail view never refetches when only the route param changes.** `loadRun` is wired to
  `onMounted` alone (`SchedulerRunDetailView.vue:304`). Three flows go run-detail → run-detail: the
  "replayed from" parent link (`:147`), each child link in the lineage list (`:167`), and the
  post-replay `router.push` (`:293`). Vue Router reuses the component, so the URL and the breadcrumb
  change while the body still shows the previous run's outcome, error and payload. On the replay path
  the success snackbar fires, the URL says run #91, and the page is still run #47. (S1)
- **Every failure is reported as "this was deleted".** `SchedulerJobDetailView.vue:188-193` and
  `SchedulerRunDetailView.vue:276-281` catch everything and null the record, rendering a not-found
  alert whose text says the record "may have been removed or the link is no longer valid". A 500, a
  dropped connection and a 403 all claim the operator's job was deleted. Neither page offers a retry.
  (S2 for the states, S1 for the fix)
- **Non-admins get a blank white page.** `SchedulerJobsView.vue:6`, `SchedulerJobDetailView.vue:6` and
  `SchedulerNeedsAttentionView.vue:6` wrap the whole page in `<template v-if="isAdmin">` with no
  `v-else`. `SchedulerRunDetailView.vue:214-219` is the only one that renders `general.forbidden` —
  so three of four views render an empty `VContainer`. (S1)
- **An unhandled promise rejection on every non-cancel grid error.** `loadItems` re-throws
  (`SchedulerJobsView.vue:305-307`, `JobRunHistory.vue:288-290`) from an `async` handler wired to
  `@onLoadItems`, so nothing awaits it. The grid keeps its stale rows and the spinner clears — a
  failed filter silently shows the previous result set as if it were the new one. (S1, moves into
  `useServerTable`'s `onError` in S3)
- **The overdue switch is outside the filter it belongs to.** `onlyOverdue` is a separate ref
  (`SchedulerJobsView.vue:227`) merged into the request at `:263`, so FilterPanel's reset does not
  clear it and it produces no chip. Meanwhile `ScheduledJobFilter.onlyOverdue` is a declared field
  that is never assigned — a wire-payload slot only. (S1)
- **The post-trigger refresh races the job it triggered.** `SchedulerJobDetailView.vue:196-199` calls
  `runHistory.reload()` the instant `triggerJobNow` resolves, though the API's own doc comment
  (`SchedulerApi.ts:57`) and the success message both say the run happens in the background. Same at
  `JobRunHistory.vue:325` after a replay, under a comment reading "refresh shortly" — which it does
  not do. The operator clicks Trigger, gets a success snackbar, and nothing changes. (S1 + escalation)
- **There is no `scheduler.en.ts`.** `_locales/` holds `scheduler.sk.ts` only. EN is the documented
  fallback locale, so an EN user gets raw keys (`scheduler.job.jobKey`) across all four views. The
  `user` module in the same submodule ships both files, so this is an omission, not a convention. (S2)
- **"every 1 minút".** `ScheduleDisplay.vue:35` passes `intervalValue` as vue-i18n's plural count, but
  the `scheduler.intervalUnit.*` messages (`scheduler.sk.ts:53-61`) have no `|` choice forms, so every
  interval renders the genitive plural regardless of count. The three-form SK plural rule already
  exists at `src/i18n.ts:9`. (S2)
- **Slovak baked into framework code.** Export filenames `planovac-ulohy.${format}` /
  `planovac-behy.${format}` are string literals in `SchedulerApi.ts:45,98`, and the route paths
  (`/planovac/ulohy`, `/planovac/behy`, `/planovac/pozornost`) are hardcoded in a module meant to
  mount in any app. Two breadcrumbs then hardcode the URL *again* as a bare string —
  `SchedulerJobDetailView.vue:202` and `SchedulerRunDetailView.vue:272-273` — instead of using the
  route name, so renaming a path breaks them silently. (S2)

## Duplication, measured

- **Both grids hand-roll table plumbing this same submodule already ships.**
  `composable/listQueryState.ts` (39 lines) plus `buildRequest`/`syncQuery`/`loadItems`/`reload` in
  `SchedulerJobsView.vue:204-317` and `JobRunHistory.vue:190-296` reimplement
  `_common/composable/table/useTableUrlState.ts` and `useServerTable.ts` — URL hydration, sort
  encoding, page reset, mount-burst coalescing and an `onError` hook, all of which the canonical
  versions already handle. ~150 duplicated lines inside the repo that owns the original. (S3)
- **`router.replace({ query })` wipes the whole query string.** Both `syncQuery` functions
  (`SchedulerJobsView.vue:293`, `JobRunHistory.vue:276`) build a fresh object from list state only,
  dropping any unrelated param on the route. (S3)
- **The two detail views are the same page written twice** — identical loading spinner, identical
  not-found alert, and an identical `repeat(auto-fit, minmax(220px, 1fr))` info grid under two
  different class names (`.job-info-grid`, `.run-info-grid`). (S4)
- **`.info-row__value` does nothing.** It is scoped CSS in `InfoRow.vue:34` with no `:slotted()`, but
  both detail views apply it to spans passed *into* the slot (`SchedulerJobDetailView.vue:60,88,94,115`,
  `SchedulerRunDetailView.vue:153`). Slot content compiles in the parent's scope, so the selector
  never matches and those values silently render at default size and colour instead of `0.9375rem`.
  (S4)
- **Three near-identical chips.** `JobStatusChip`, `RunOutcomeChip` and `TriggerSourceChip` are the
  same 40-line enum → icon + colour + `$t()` switch, three times, each with an unreachable `default:`
  branch. (S4)
- **`useSchedulerFormat` holds no reactive state.** The module's own map
  (`src/_common/docs/modules/scheduler.md`) already notes it belongs in `utils/`. (S4)
- **`dto/index.ts` is a barrel nothing imports.** All 33 files use long absolute paths instead. (S4)

## The operator experience

- **The health dashboard has no auto-refresh and no "as of".** `SchedulerNeedsAttentionView` fetches
  once `onMounted` (`:220`) behind a manual refresh button. It is the page an operator leaves open on
  a second monitor, and it will happily show a four-hour-old all-clear. (S5)
- **Nothing anywhere is relative.** `nextRunAt`, `lastRunAt` and `startedAt` render only as absolute
  timestamps. "Next run 14:32:00" requires the operator to know what time it is; "in 4 min" does not.
  (S5)
- **Neither the correlation ID nor the payload can be copied.** `SchedulerRunDetailView.vue:86`
  renders `correlationId` in a `<code>` with `word-break: break-all` — the exact value you paste into
  a log search, selectable only by dragging across a wrapped string. (S6)
- **The payload block is uncapped.** `.run-payload` (`:320-329`) is a `<pre>` with `white-space: pre`
  and no height limit; a large snapshot makes the card taller than the viewport. (S6, S7)
- **Replay is offered on runs that cannot be replayed.** `SchedulerRunDetailView.vue:34-41` always
  shows the button. `JobActionButtons.vue:115` disables *trigger* for orphaned jobs for exactly this
  reason, and `replayError` (`useSchedulerFormat.ts:26-28`) already has a dedicated message for the
  resulting 409 — so the failure is known, predicted, and still only discovered after clicking. (S6 +
  escalation)
- **The needs-attention lists dead-end.** Each row links to one job; there is no "show me all 12
  failed jobs in the grid", though the jobs list has a `lastOutcome` filter that would do it. (S6)
- **Fixed pixel widths on the dashboard.** `min-width: 320px; flex-basis: 31%` on the attention cards
  and `min-width: 180px` on the count cards, both inline styles — on a narrow window the three lists
  stack with a horizontal scrollbar. (S7)
- **`.attention-row` has hover styling and no focus styling** (`AttentionJobList.vue:83-92`). It is a
  `RouterLink`, so it is keyboard-reachable and gives no indication of where you are. (S7)

## Accepted, not a defect

- **`meta.requiredRole: 'admin'` plus an in-view `isAdmin` check is deliberate belt-and-braces.** In
  *this* app the adapter returns constant `true` (`src/core/user/authAdapter.ts`), which is why the
  blank-page bug has never been seen here — but the module ships to apps with a real role model. Keep
  both layers. S1 only fixes what the view renders when the check fails.
- **`ScheduledJobRunFilter.jobId` being re-pinned in `buildRequest`** rather than trusted from the
  filter ref is a correct guard, not duplication. Keep it through the S3 migration.
- **The Slovak URLs stay Slovak in this app.** S2 makes the module's paths configurable; it must
  configure them back to `/planovac/*` here, so bookmarks and `src/app/nav/navItems.ts` keep working.

## Backend

`backend/` starts empty on purpose. These prompts do not pre-write backend requests — the agent
implementing one is the one that discovers exactly which field was missing and writes a sharper ask
than anyone could from a cold read. S1, S5 and S6 each end with an escalation block telling the agent
to finish the frontend work first, then write the ask if it actually hit the wall.
`backend/README.md` holds the format and the scope rules (contract and business logic only — no
storage, entity or migration decisions), plus the one rule specific to this module: the scheduler
service is shared framework infrastructure, so additive changes are strongly preferred.
