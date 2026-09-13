# Fix queue

> Built 2026-09-14 · commit `df2b163d` (working tree carries the untracked `tracking-settings` and
> `activity-settings` docs, the round-5 `todo-routine` findings, and uncommitted counter/breadcrumb fixes
> under `src/core/todoList/`) · units triaged: `_shell`, `home` (1), `todo-lists` (9), `todo-routine` (10),
> `leisure-projects` (13), `tracking-settings` (6), `activity-settings` (2) · findings considered: 68 ·
> batches: 30

> **Fifth pass, 2026-09-14, commit `df2b163d` — unit 10 `todo-routine` re-absorbed after its round 5.**
> Scoped by the operator to that unit; nothing outside the sections naming it was re-read, and the fourth
> pass's `F18`–`F23` / `FW5` stand as written. Two passes ran **concurrently on this file** — the fourth
> pass was still writing its batch bodies when this one started (its summary was on disk, its bodies were
> not), so this pass waited for the file to go quiet before editing. That is the same collision class round 5
> reports for the browser and the seeded account, and it is why `F23` grows below rather than getting a
> sibling. What changed for `todo-routine`: round 5's live re-verification closed **B3, B4, B6, A1, A3** in a
> browser (B4 and B6 in Slovak, as required), corroborated the counter hit-test fix with a real mouse, and
> surfaced **one new open finding, `B10`** — the countdown timeline formats dates through the *browser's*
> locale, not the account's — which on a source read is **eight call sites in five files, not two in one**
> (*Contradictions* §21). Round 4's API source read had already settled both `todo-routine` escalations (§2,
> §3) and filed-and-fixed **`B9`**, which round 5 then could not verify in three attempts, blocked by a
> concurrent session reseeding the shared account. Net: **two new app batches** (`F24` for `B10`, `F25` for
> the `/routine-settings` "Color" header B4's retest turned up), **`F23` grown** by the two runbook rules round
> 5 paid for, one new escalation (§7, the unique-index 409), one new source-certain item under *Needs
> verification* (the create-path 409 that `B9`'s fix does not reach), and the *Awaiting retest* table rewritten
> — five of its eight rows are closed. The 68 above is 66 + `B9` + `B10`.

> **Fourth pass, 2026-09-14, commit `df2b163d` — unit 2 `activity-settings` absorbed.** Fourteen findings
> (the fifteenth, `B6`, was already borrowed into `F14` last pass — the header below says "sixteen", which
> was a miscount: the unit's tally is 7 · 1 · 2 · 1 · 4 = 15). They became **six new app-side batches
> (`F18`–`F23`, two of them docs-only) and one framework one-liner (`FW5`)**, plus one escalation (§6).
> Every finding was checked against source this pass — **including the API's**, since it is on this
> machine — and that overturned more than any previous pass (*Contradictions* §14–§20): the "backend
> ignores `roleIds`" finding is a field that has never existed on the wire, the unit's own fix for the
> Roles/Categories delete gap would have disabled every button, and the invalid-tab blank page is an
> app-wide missing catch-all that unit 2 merely walked into first. Nothing above `F18` was re-read this
> pass; the notes below still describe `F1`–`F17` and `FW1`–`FW4` as of the third pass.

> **Third pass, 2026-09-13, commit `df2b163d` — unit 6 `tracking-settings` absorbed.** Seven findings
> (1 blocker, 4 bugs, 1 polish, 1 opportunity, 1 unverified) became **six new app-side batches (`F12`–`F17`)
> and one docs-only framework batch (`FW4`)**; the previous header read 44 findings · 14 batches at
> `430e6f03`. Every one
> was checked against source this pass, and two root-cause guesses were overturned (*Contradictions*
> §9–§10) — the blocker in particular is a one-line layout omission, not the framework paint bug the unit
> suspected. Nothing above `F12` was re-read this pass; the notes below still describe `F1`–`F11` and
> `FW1`–`FW3` as of `430e6f03`.
>
> ~~⚠️ **Unit 2 `activity-settings` is also on disk and is NOT triaged here**~~ — **superseded by the fourth
> pass above.** (Kept for the audit trail: the operator scoped the third run to `tracking-settings`. One
> of its findings, `activity-settings/B6`, is the same defect as `tracking-settings/B2` and was pulled into
> `F14` under the duplicate rule; the rest waited for this run.)

> **This run supersedes the queue built earlier on 2026-09-13.** Two things changed since it:
>
> 1. **Unit 13 `leisure-projects` landed** — 8 findings, 7 of them open, and they are the bulk of the new work.
> 2. **That run's `F4`–`F7` were applied** (the four `todo-routine` app batches). Verified in source this pass:
>    `TodoListItemCounter.vue` carries `:title`/`:aria-label` on both branches, `TodoListStepsFormField.vue`
>    names all four step controls, `RoutineToDoListForm.vue:28` resolves `routineTodoList.timePeriod`,
>    `RoutineTodoListItem.vue` resolves `routineTodoList.streakTooltip`/`.gracePeriodActive`, and
>    `BaseToDoList.vue:43` is `$t('toDoList.duplicateInList')`. They are **no longer batches** — they are
>    retest items, listed under *Needs verification → Awaiting retest*.
>
> **Batches are renumbered from scratch.** The old `F1`/`F2`/`F3` (home) are this run's `F7`/`F8`/`F9`; old
> `F8`/`F9` (shell) are `F10`/`F11`; old `FW1`/`FW2`/`FW3` are `FW1`/`FW2`/`FW3` with `FW2` **grown** to two
> controls. Everything carried forward was re-read against current source this pass, not copied on trust —
> the six one-line checks are named in each batch.

## Summary

| batch | title | scope | findings closed | effort |
| --- | --- | --- | --- | --- |
| F1 | View-mode toggle loses `view=table` to a URL-write race | app | `leisure-projects/B1` | med |
| F2 | Board mode fires two grid requests through one `AbortController` | app | `leisure-projects/B2` | med |
| F3 | ✅ **FIXED 2026-09-13** — `ActivityInfo` reads `icon`/`color` flat; the API nests them under `activity.category` / `activity.role` | app + framework | `leisure-projects/B3` | low |
| F4 | Table's "Messy" icon column has no text alternative | app | `leisure-projects/A2` | low |
| F5 | Inactive readiness-status buttons are invisible (non-text contrast) | app | `leisure-projects/A3` | low |
| F6 | Dead `class="flex-1-1"` on four `FilterPanel` call sites logs a warning per render | app | `leisure-projects/P1` | low |
| F7 | `RoutineTodoWidget`'s header controls are clipped off-screen | app | `home/B1` | low-med |
| F8 | NowBar shows a contradictory "DONE" / "No plan for today" pair while loading | app | `home/B2` | low-med |
| F9 | `homeUiStore` never persists, and CLAUDE.md says the opposite of what the plugin does | app + docs | `home/B3` | low |
| F10 | No skip-to-content link | app | `_shell/A3` | low |
| F11 | ✅ **FIXED 2026-09-13** — Breadcrumb does not distinguish `/todo-list/:id` from `/todo-list` | app | `_shell/P1` | low |
| F12 | Mappings table body has zero height — the row exists but is inside a 0 px scroll box | app | `tracking-settings/X1` | low |
| F13 | Mappings tab: no filter control reaches the grid, and the delete button reaches nothing | app | `tracking-settings/B1` (+ wires `U1`) | med |
| F14 | Tabbed routes get the wrong breadcrumb (and sidebar highlight) because the nav `to` is one tab's literal path | app | `tracking-settings/B2`, `activity-settings/B6` | low |
| F15 | Distinct-entries filter, page and sort are not in the URL | app | `tracking-settings/B3` | med |
| F16 | Settings header row clips its labels at 1440 px | app | `tracking-settings/B4` | low |
| F17 | CLAUDE.md's "every settings page" sentence reads wider than `moduleSettingsLinks.ts` means | docs only | `tracking-settings/P1` | trivial |
| F18 | The mount-time combobox rebuild writes back into the activities filter — wiping URL ids and double-firing the grid | app | `activity-settings/B2`, `B3` (+ retests `U4`) | med |
| F19 | Roles/Categories tables: parse `canDelete`/`usageCount`, gate the role delete, cascade-confirm the category delete — and name the trash button before copying it | app | `activity-settings/B7`, `A1` (+ answers `U2`) | med |
| F20 | No catch-all route — any unknown URL renders a blank main area | app | `activity-settings/B5` | low |
| F21 | Categories table's "Role" column is a comma-joined aggregate presented as a single value | app | `activity-settings/P1` | low |
| F22 | Activities filter bar clips the "Categories" label | app | `activity-settings/P2` | low |
| F23 | Parallel `playwright-cli` sessions must not share one storage-state file — the API rotates refresh tokens (**grown**: nor the unnamed `default` browser session, nor a mid-pass reseed) | docs only | `activity-settings/U3` (+ `todo-routine` round-5 environment note) | trivial |
| F24 | Routine components format dates through the browser's locale, not the account's — 8 `toLocaleDateString(undefined, …)` calls in 5 files | app | `todo-routine/B10` | low |
| F25 | `/routine-settings` "Color" column header is the capitalized raw key — the title is `''` and the framework fills it in | app | *(unfiled — `todo-routine/B4`'s round-5 verification note)* | trivial |
| FW1 | `MyDialog` is `persistent` by default, so Escape closes nothing | **framework** | `_shell/A1` | med (decision first) |
| FW2 | Two framework icon-only controls have no accessible name | **framework** | `_shell/A2`, `leisure-projects/A1` | low |
| FW3 | ✅ **CLOSED 2026-09-13** — `Time.fromJson` cannot parse the backend's string shape (the API had already switched to `{hours, minutes}` on 2026-09-11; `fromJson` now accepts both) | **framework** | `todo-lists/B4` | med |
| FW4 | `DataTable`/`BasicTable` need a definite-height flex parent, and nothing says so | **framework** (docs only) | *(none — prevents the next `F12`)* | low |
| FW5 | `DataTable`'s default row actions render the internal slug as their `title`, not the localized label | **framework** | `activity-settings/B4` | trivial |

25 app-side (`F9`, `F17`, `F19` and `F23` include CLAUDE.md or runbook edits; `F17` and `F23` are nothing
else) · 5 framework · 7 escalations (3 open: §1, §6, §7 — §2 and §3 were settled by `todo-routine`'s
round-4 API read and are struck below).

**`F24` and `F25` are independent of everything, and of each other** — different files, different causes,
both in `src/core/todoList/`. `F24` needs the SK locale to verify; `F25` does not. Neither touches the
uncommitted `todoList` files in the working tree (`BaseTodoListItem.vue`, `TodoListItemCounter.vue`,
`TodoListView.vue`), so they can land before or after those are committed.

**Order among the unit-2 batches.** `F19` before `FW5` is *verified* — once the Roles/Categories tables
have their own `#actions` slot they no longer render `DataTable`'s default buttons, so `FW5` has to be
checked on a table that still does (`/routine-settings`). `F18` first if `U4` is to be retested
meaningfully, since it removes the competing request that is the only candidate explanation. `F20`,
`F21`, `F22`, `F23` are independent of everything.

**Order within the new batches matters.** `F12` first — until the row paints, `F13`'s delete wiring and
`U1` cannot be verified. Then `F13` before `F15` and `F16`: `F13` decides what the top filter bar does on
the Mappings tab (and whether it is even shown there), which changes what `F15` has to sync to the URL and
what `F16` has to lay out. `F14` and `F17` are independent.

**`F4` and `FW2` are the same defect class deliberately split** (batching rule 1): an unnamed icon control in
`src/core/leisure/` and two in `src/_common/`. The framework pair ships as a `vue_framework` commit plus a
pointer bump; the app one does not. Do not let a fixing session merge them.

---

## F1. The view-mode toggle loses `view=table` to a URL-write race

- **Scope:** app-side `src/core/leisure/view/ProjectsView.vue`, `src/core/leisure/composable/leisureFilterUrlState.ts`
- **Closes:** `leisure-projects/B1`
- **Root cause:** Two independent writers of `router.replace({ query })`, each spreading a `route.query`
  snapshot that Vue Router only refreshes once a navigation *resolves*. Confirmed in source this pass:
  `ProjectsView.vue:146` is `watch(viewMode, value => router.replace({ query: { ...route.query, view: value } }))`;
  `useTableUrlState.ts:106-107`'s `syncToUrl()` opens with `const query = { ...route.query }` and is watched on
  `[page, itemsPerPage, sortBy]` (`:138`). Switching to Table mounts `ProjectTable`/`BasicTable` for the first
  time, and `BasicTable.vue:191-202` is an `immediate: true` watcher that **pushes a default sort item into the
  shared `sortBy` ref** when the first column key isn't already there. So one click produces two replaces in the
  same tick, and whichever resolves second overwrites the other's key. `view` is the one that loses, because
  `syncToUrl` writes `page`/`perPage`/`sortBy` and knows nothing about `view`.
- **Why it is intermittent, exactly:** once `sortBy` is already in the URL, `BasicTable`'s watcher finds a match
  and pushes nothing, so there is only one writer and the click works. That is the finding's own evidence
  (case 2), and it is also the fix.
- **Files:** `src/core/leisure/view/ProjectsView.vue:125,146`; `src/core/leisure/composable/leisureFilterUrlState.ts:86-105`
  (`projectFilterUrlState`); reference only — `src/_common/composable/table/useTableUrlState.ts:106-141`,
  `src/_common/component/dataTable/BasicTable.vue:191-202`
- **What to change:** Remove the second writer rather than trying to order the two. `useTableUrlState` already
  accepts `defaultSortBy` (`:15,:81`) and nothing passes it — give `projectFilterUrlState()` a
  `defaultSortBy: [new VSortItem('activity.name', 'asc')]` matching `ProjectTable`'s first column, so
  `BasicTable`'s mount-time watcher finds its key present and pushes nothing. Then make the `view` write
  resilient on its own terms: after the replace resolves, assert `route.query.view === viewMode.value` and
  re-write if not (or read `viewMode` from the route as the single source of truth instead of holding a
  separate `ref`). **Both halves** — the first kills the reproducible case, the second stops any future third
  writer silently reintroducing it.
- **Do not change:** `useTableUrlState.ts` or `BasicTable.vue`. A shared query-merge queue in the framework is
  the "proper" fix and it is a framework batch with its own risk to every table in every app — not a side
  effect of closing one view's finding. Also do not change the other three leisure views in this batch; they
  have the same two-writer shape (`BucketListView`, `MemoryAnchorsView` each hold their own
  `watch(viewMode, …)`) but no finding, and units 11/12 have not run yet.
- **Verification:** `leisure-projects/B1`'s `Verify:` block verbatim — from a **query-string-free** load, one
  click on "Table" must put `view=table` in the URL immediately, and a reload must stay on Table. Re-run it
  twice: once from `/leisure/projects` clean, once from a URL that already carries `sortBy`.
- **Risk:** Low-medium. `defaultSortBy` means every load now carries `sortBy=activity.name:asc` in the query
  once anything syncs — harmless, but it also means the *board* default URL advertises a table sort. More
  importantly, `activity.name` is the exact key that used to 500 this grid (see *Contradictions* §2): if the
  API's sort-key remap were ever rolled back, defaulting to it would break the table on first load rather than
  on first header click. **Measured 2026-09-13: it answers 200**, and the risk has shrunk — the key resolves
  **natively** off the nested `ActivityResponse` now, not through a remap that could be rolled back, so it is
  only as fragile as the row shape itself. Re-confirm before shipping anyway.

## F2. Every board-mode filter change fires two competing grid requests through one `AbortController`

- **Scope:** app-side `src/core/leisure/view/ProjectsView.vue`
- **Closes:** `leisure-projects/B2`
- **Root cause:** `ProjectsView` drives **one** `fetchFilteredTable` instance from **two** places. Confirmed in
  source: `useActivityProjectProfileCrud()` is destructured once (`:103`) and handed to `useServerTable`
  (`:109`) *and* called directly by `loadBoard()` (`:139`). `useServerTable.ts:107-116` watches `filter`
  unconditionally — it cannot know its table is unmounted — so a board-mode filter change fires the table's
  25-row fetch alongside `ProjectsView.vue:147-153`'s own 200-row `loadBoard()`. `useFetchFilteredTable.ts:29-37`
  holds **one** `AbortController` per instance and aborts the previous call on every new one, so the two race.
- **The consequence is worse than a wasted round trip**, and this is the part to fix for, not the count:
  `useFetchFilteredTable.ts:47-55` swallows the cancellation and **resolves the aborted call with `latest`** —
  the *other* call's result. With more than 25 matching projects, a board-mode filter change can therefore
  resolve `boardItems` with the table's 25-row page and silently under-render the board. Not reproducible on
  the current seed (one row), inferred from the code path; the finding says so too.
- **The finding's own suggested fix does not satisfy its own pass condition.** Giving the board a second
  `useActivityProjectProfileCrud()` instance separates the controllers — the correctness bug goes — but leaves
  **two** requests, and `Verify:` step 3 demands exactly one. Pick a shape that gives one fetch:
- **Files:** `src/core/leisure/view/ProjectsView.vue:103-153`; reference only —
  `src/_common/composable/table/useServerTable.ts:107-116`, `src/_common/api/useFetchFilteredTable.ts:29-58`
- **What to change:** Recommended — **collapse the two fetches into one.** Board and table want the same
  filtered rows at different page sizes, so drive the board off `useServerTable`'s own `items` and set
  `itemsPerPage` to `BOARD_PAGE_SIZE` while `viewMode === 'board'` (back to 25 on switching to table). That
  deletes `loadBoard`, `boardItems` and `boardLoading`, leaves one writer of one request, and keeps the page
  size bookmarkable in the URL where it already is. Keep `BOARD_PAGE_SIZE = 200` and the comment at `:113-122`
  explaining why it is 200 and not 500 — that constraint is the server's validator and is still live.
  Acceptable alternative if the single-instance shape turns out to fight the table's paging: a second
  `useFetchFilteredTable` instance for the board **plus** gating `useServerTable`'s load on
  `viewMode === 'table'`, and amend the finding's pass condition to say why two instances were needed.
- **Do not change:** `useServerTable`'s unconditional filter watcher or `useFetchFilteredTable`'s cancellation
  fallback. Both are framework, both are load-bearing for every other table, and the "suppress the fetch when
  the consuming table is unmounted" idea needs a framework-level answer (a `enabled` option), not a patch
  here — see *Escalations* §4 for whether that is worth raising upstream.
- **Verification:** `leisure-projects/B2`'s `Verify:` block — one filter change in board mode, exactly one
  `POST /api/activity-project-profile/grid`, carrying the board's page size. Then switch to Table and confirm
  paging still works and still fires one request per page change. Check `playwright-cli requests` for
  `net::ERR_ABORTED` entries — there should be none.
- **Risk:** Medium. Touching the page-size ref changes what lands in the URL for every user of this view, and
  the board's "fetch everything" assumption only holds under the 200 cap. If a user's project count ever
  exceeds 200 the board silently truncates either way — out of scope here, worth a note in the code.

## F3. `ActivityInfo` reads `icon`/`color` flat; the API nests them under `activity.role`

> ## ✅ FIXED 2026-09-13 — and the contract it was hedging against is now settled
>
> `B6`/`B7` came back **nested, confirmed**, so the hedge below is resolved rather than permanent. Three
> corrections to what this entry assumed, all now reflected in the code:
>
> 1. **The fallback needed `category`, which this entry never mentions.** `category` takes precedence over
>    `role` and is **nullable**. The shipped rule is the server's own:
>    `icon ?? category?.icon ?? role?.icon`, same for `color`.
> 2. **`categoryName` was a false alarm.** This entry warns it "has never been checked" and would fail the
>    same way. It does not bite: its only reader is `SuggestionCard.vue:19-20`, which renders
>    `/leisure/suggestion/draw` — the one endpoint that **still sends the flat shape**. No grid-path code
>    reads it. (The "Woodworking" on the project card is `item.projectArea`, an unrelated field.) It is
>    derived anyway, via `categoryName ?? category?.name`, so both shapes parse.
> 3. **The adjacent `BacklogTable` item needed a framework change, not just a prop edit.**
>    `deleteConfirmationColumn="activity.name"` would have kept rendering *"delete **undefined**"*, because
>    `BasicTable.vue:211` indexed the row flat. It now resolves through `getNestedValue`, so dotted keys work
>    and dotless keys behave exactly as before. **That edit is in the `src/_common` submodule and needs its
>    own commit before the pointer bump.**
>
> 4. **Three sibling tables had the same defect in a quieter form and are fixed with it.** `BucketListTable`,
>    `MemoryAnchorTable` and `ProjectTable` set no `deleteConfirmationColumn` at all, so their dialogs read
>    *"delete **13004**"* — an id. `/leisure/projects` was inconsistent with itself, since the board view
>    (`ProjectReadinessBoard.vue:227`) already built the name by hand. All three now pass `activity.name`.
>
> **Files changed:** `src/core/leisure/dto/response/ActivityInfo.ts` (flat-first, nested fallback — parses
> both shapes), and `deleteConfirmationColumn="activity.name"` on all four leisure tables —
> `component/backlog/BacklogTable.vue`, `component/bucketList/BucketListTable.vue`,
> `component/memoryAnchor/MemoryAnchorTable.vue`, `component/project/ProjectTable.vue` — plus
> `src/_common/component/dataTable/BasicTable.vue` + `src/_common/docs/components.md`.
>
> **Checked and needing no change** (recorded so nobody re-derives it): the four lookup columns already parse
> via `LookupResponse.fromJson(locationType)`; `MemoryAnchor.fromJson` already reads
> `hasBacklog`/`backlogIsRepeatable`/`hasBucketList` with the correct `null` handling; all four tables already
> key their Activity column `TableColumn('activity.name', …)`, which is exactly the key that now resolves
> natively; and the `activityName` in `leisureFilterUrlState.ts` and the `*Filter` DTOs is a **filter** field,
> untouched by the deletion of the `sortBy` remap.
>
> **Verified 2026-09-13, in a browser, against the running API** (fixture `e2e-v2`):
>
> - All four profile grids return **200** with `sortBy: activity.name`, each carrying a nested `activity`
>   with `role` and a **null** `category` on the seeded rows, and **no flat `activityName`**.
> - `/leisure/projects` renders **"Build a Bookshelf"** with a **`fa-guitar` icon** — board and table. The
>   icon was absent before this fix.
> - The delete dialog reads **"Are you sure you want to delete Build a Bookshelf?"**, not the old id.
> - `/leisure/memory-anchors` renders the **archived** activity ("Retired Hobby") with its name and icon,
>   confirming the anchor-keeps-the-row rule.
> - Pinned by `src/core/leisure/dto/activityInfoNestedShape.test.ts` (5 tests, both wire shapes, null
>   category, archived row, empty object) and `e2e/tests/leisure-anchor-sort.spec.ts` (3 tests).
> - `npm run type-check` (`--build --force`) 0 errors; `npm run lint` 0 errors; `e2e` `npm run typecheck` 0.
>
> ⚠️ **One part of the original L3 feature still does not work, and it is NOT this DTO.** The icon renders
> but is **untinted**. `role.color` is the raw string `"violet"`, which `ActivityNameCell.vue:6` hands to
> `VIcon`'s `color` prop; Vuetify emits `class="text-violet"`, which is not a defined theme class, so the
> computed colour stays the default `rgba(17,24,39,0.87)`. The value arrives correctly — this is a
> **rendering** gap, not a parsing one, and it needs a decision about whether arbitrary DB colours are
> allowed to reach a Vuetify `color` prop at all (inline `style` would be the usual answer). Filed here
> rather than fixed, because it is a different defect from F3 with a different owner.

- **Scope:** app-side `src/core/leisure/dto/response/ActivityInfo.ts`
- **Closes:** `leisure-projects/B3`
- **Root cause:** `ActivityInfo.fromJson` (`:10-13`) destructures `{ id, name, categoryName, icon, color }`
  straight off the row's `activity` object. The live `activity-project-profile/grid` response carries
  `activity.role.icon` / `activity.role.color` (`"fas fa-guitar"` / `"violet"` for the seeded project) and has
  no flat `icon`/`color` at all, so both resolve to `null` and `ActivityNameCell.vue:4`'s `v-if="activity.icon"`
  never fires. The feature L3 was built for renders nothing, silently, with no error anywhere.
- **This is one edit that lights up five views, not one.** `ActivityNameCell` is mounted by `ProjectTable`,
  `ProjectReadinessBoard`, `BucketListTable`, `BucketListLadder`, `BacklogTable`, `MemoryAnchorTable` and
  `MemoryAnchorTimeline` — all four leisure entities. `SuggestionCard.vue:6,11` on `/leisure/pick` reads the
  same fields with a `?? meta` fallback, so it is *currently rendering a generic placeholder icon and looking
  fine*; check it after the fix rather than assuming it is unaffected.
- **Files:** `src/core/leisure/dto/response/ActivityInfo.ts:10-13`
- **What to change:** Read the nested shape with the flat one as a fallback —
  `object.icon ?? object.role?.icon ?? null`, same for `color` — so the DTO survives whichever shape the server
  settles on (see *Escalations* §4; the contract is genuinely unsettled and the fallback is cheap insurance).
  While in the file, confirm against a live response body which of the five fields actually arrive:
  `name` demonstrably does now, `icon`/`color` demonstrably do not, and **`categoryName` has never been
  checked** — it is read the same flat way and would fail the same way.
- **Adjacent, source-verified, not filed by any unit — fix it here if the fixing session is willing:**
  `BacklogTable.vue:11` passes `deleteConfirmationColumn="activityName"`, but `ActivityBacklogProfile` has no
  such property (it holds `activity: ActivityInfo`), and `BasicTable.vue:211` does a **flat** lookup. So
  `/leisure/backlog`'s delete dialog reads "Are you sure you want to delete **undefined**?". Same root cause as
  this batch — client written against a flat shape the API nests. It belongs to unit 11, which has not run, so
  it carries no finding id and no browser evidence; see *Contradictions* §8.
- **Do not change:** `ActivityNameCell.vue`. Its `v-if` is correct — it is being handed nulls.
- **Verification:** `leisure-projects/B3`'s `Verify:` block — the "Build a Bookshelf" card and row render a
  guitar icon tinted violet. Then check the other three leisure views render icons too (they use the same DTO)
  and that `/leisure/pick` still renders *something* rather than regressing to a blank.
- **Risk:** Low. Worst case an icon string arrives in a shape FontAwesome doesn't recognise and renders a
  missing-glyph box — visible immediately, not silent.

## F4. The table's "Messy" column renders a bare icon with no text alternative

- **Scope:** app-side `src/core/leisure/component/project/ProjectTable.vue`
- **Closes:** `leisure-projects/A2`
- **Root cause:** `ProjectTable.vue:25-31`'s `#item.isMessy` template renders a bare `VIcon` (`check` /
  `minus`) with a colour and nothing else — confirmed by source read this pass. The cell's whole meaning is
  carried by glyph and colour, so the accessibility tree shows an empty cell and a colour-blind or
  screen-reader user gets nothing.
- **Files:** `src/core/leisure/component/project/ProjectTable.vue:25-31`
- **What to change:** Give the icon a localized `aria-label` reflecting the boolean (`general.yes`/`general.no`,
  or better, the column's own meaning — "Messy" / "Not messy"). Check first whether this app already has a
  convention for boolean icon columns and follow it rather than inventing a second one; if there is none, this
  is the place it gets set, so leave a one-line comment saying so.
- **Do not change:** the icon/colour choice itself, and do **not** batch this with `FW2` — that is the same
  class of defect in the submodule (rule 1).
- **Verification:** `leisure-projects/A2`'s `Verify:` block — the Messy cell exposes a text alternative in the
  accessibility snapshot. Confirm it is localized (changes with the locale), not hardcoded English.
- **Risk:** None.

## F5. Non-active readiness-status buttons on the board are effectively invisible

- **Scope:** app-side `src/core/leisure/component/project/ProjectReadinessBoard.vue`
- **Closes:** `leisure-projects/A3`
- **Root cause:** `ProjectReadinessBoard.vue:130-146` colours every non-active status button `grey-lighten-2`
  with `variant="tonal"` — and `tonal` at that colour computes to `background-color: rgba(0,0,0,0)`, so there
  is no tint at all and a near-white glyph sits on a white card. Confirmed in source and by the finding's
  computed-style dump. These are the control the board exists to operate (one click moves a project between
  columns), so the two you *aren't* on are the two you can't see.
- **Not a naming gap.** The buttons already carry `:title="$t('enums.readinessStatus.' + s)"` (`:138`), so
  they have accessible names — this is WCAG 1.4.11 non-text contrast only, which is why it is its own batch and
  not part of `F4`.
- **Files:** `src/core/leisure/component/project/ProjectReadinessBoard.vue:133-134` (the `:color`/`:variant`
  pair)
- **What to change:** Pick an inactive treatment with real contrast — a darker neutral from the theme's
  `neutral-*` scale, or `secondaryOutline` with `variant="outlined"` so the glyph gets a border to sit
  against. Whatever is chosen, the active state must still read as clearly the active one; that contrast is
  the control's only state indicator.
- **Do not change:** `STATUS_META`'s active colours (`successDark`/`warningDark`/…) — they are the
  variant-to-colour pairing CLAUDE.md prescribes for `elevated`, and they are correct.
- **Verification:** `leisure-projects/A3`'s `Verify:` block, which is a visual check — take the screenshot,
  don't rely on the accessibility snapshot, which is blind to this by construction. Check in **both** themes:
  `grey-lighten-2` on a dark card is a different failure, and the finding only measured light.
- **Risk:** Low, visual only. The board is the default view mode for this route, so it is the first thing seen.

## F6. A dead `class="flex-1-1"` on four `FilterPanel` call sites logs a Vue warning on every render

- **Scope:** app-side — the four leisure views, **not** `src/_common/component/FilterPanel.vue`
- **Closes:** `leisure-projects/P1`
- **Root cause:** `FilterPanel.vue`'s template is multi-root (a `<div>` plus a sibling `<Teleport>`,
  `:1-82`), so Vue cannot auto-inherit attributes and logs *"Extraneous non-props attributes (class) were
  passed to component…"* for every call site that passes one. Four do — `ProjectsView.vue:27`,
  `BacklogView.vue:7`, `BucketListView.vue:27`, `MemoryAnchorsView.vue:27` — all passing the same
  `class="flex-1-1"`. It was never doing anything: the panel's own root `<div>` already declares `flex-fill`
  (`FilterPanel.vue:2`). The framework's own `FilterPanel` call sites (the four reminders views) pass no class
  and log nothing.
- **App-side or framework? App-side, deliberately.** The finding's root-cause guess calls this "same shape as
  A1", and that is wrong (see *Contradictions* §5) — a missing label and a broken attr inheritance have nothing
  in common. Making `FilterPanel` single-root would also close it, but that is a submodule commit plus a
  pointer bump to delete four characters of dead markup in this repo, and it changes the DOM shape for every
  app on the framework. Removing the dead class is strictly smaller and strictly safer.
- **Files:** `src/core/leisure/view/ProjectsView.vue:27`, `BacklogView.vue:7`, `BucketListView.vue:27`,
  `MemoryAnchorsView.vue:27`
- **What to change:** Delete the `class="flex-1-1"` attribute from all four. Check the panel still fills its
  row afterwards at desktop and mobile width — `flex-fill` and `flex-1-1` are not identical, and if the layout
  *does* change, that is the signal to fix the framework instead and this batch should stop and say so rather
  than re-adding the class.
- **Do not change:** `src/_common/component/FilterPanel.vue`.
- **Verification:** `leisure-projects/P1`'s `Verify:` block on `/leisure/projects`, then repeat the console
  check on the other three leisure views — the warning is per call site, so a fix verified on one view proves
  nothing about the others.
- **Risk:** Low, but it is a layout attribute on four screens. Look at each one.

## F7. `RoutineTodoWidget`'s header controls are clipped off-screen at a common desktop width

- **Scope:** app-side `src/core/home/component/WidgetCard.vue`
- **Closes:** `home/B1`
- **Re-verified unchanged this pass:** `WidgetCard.vue:150-151` is still `flex-wrap: nowrap` above `md`, and
  `.widget-card` is still `overflow: hidden` (`:130`).
- **Root cause:** `RoutineTodoWidget`'s header holds a title, four period-streak chips
  (Daily/Weekly/Monthly/Yearly), a done/total counter and two action buttons — wider than any other widget's
  header — so at 1440×900 it overflows by ~205px (`scrollWidth: 753` vs `clientWidth: 548`) and the two action
  buttons land 100-140px past the visible edge. They stay in the DOM and the tab order (so `find` and keyboard
  users still reach them) but are invisible and unclickable by mouse.
- **Files:** `src/core/home/component/WidgetCard.vue:142-153`; the chip row itself lives in
  `RoutineTodoWidget`'s template (in scope to reflow, not to move)
- **What to change:** Either let the chip row wrap onto its own line below the title (matching what already
  happens below `md`), or give the chip row its own `overflow-x: auto` scroller that does **not** also capture
  the two action buttons — those must stay anchored and visible regardless of how many time periods an account
  has. Do not fix by widening the card or scaling the chips: the chip count is data-driven and any
  width-tuned fix reproduces at some N.
- **Do not change:** `TodoListWidget`'s header or the shared 64px `min-height` — both are fine at every width
  tested, and the "every `WidgetCard` header lines up" invariant is deliberate (see the comment above the rule).
- **Verification:** `home/B1`'s `Verify:` block — at 1440×900 both the hide/show-done toggle and the
  open-full-view button must have `getBoundingClientRect().right` ≤ the header's own, and both clickable by
  `playwright-cli click` with no forced/JS fallback. Confirm the period chips are not clipped either.
- **Risk:** Low, one component's CSS. Re-check the header still lines up with the other three widgets.

## F8. NowBar shows a contradictory "DONE" / "No plan for today" pair while the plan is still loading

- **Scope:** app-side `src/core/home/component/NowBar.vue`, `src/core/home/composable/useTodayPlan.ts`
- **Closes:** `home/B2`
- **Re-verified unchanged this pass:** `NowBar.vue` contains **zero** occurrences of `loading` — neither in the
  `useTodayPlan()` destructure nor anywhere in the template.
- **Root cause:** Two compounding gaps. (1) `NowBar` never branches on `loading`, unlike its sibling
  `DayPlannerWidget`, which guards on it before rendering plan-derived content (`DayPlannerWidget.vue:88-92`).
  (2) `focusMode` (`useTodayPlan.ts:163-166`) is computed purely from `tasks`, independent of `hasPlan`, so
  while the `calendar/day-plan` request is in flight `tasks` is `[]` → `focusMode` is `'allDone'` ("DONE")
  while `hasPlan` is still `false` ("No plan for today"). The pair renders briefly on every load — and
  **permanently** on a genuinely plan-less day.
- **Files:** `src/core/home/component/NowBar.vue` (destructure list + template `v-if`),
  `src/core/home/composable/useTodayPlan.ts:163-166`
- **What to change:** Both halves. Add `loading` to the destructure and a loading branch matching
  `DayPlannerWidget`'s spinner; separately make `focusMode` (or the kicker binding) consult `hasPlan` before
  falling through to `'allDone'`. The loading guard alone hides the transient case and leaves the steady-state
  contradiction.
- **Do not change:** `DayPlannerWidget`'s own loading guard — it is correct and is the pattern to copy.
- **Verification:** `home/B2`'s `Verify:` block — throttle the network (or delay the day-plan endpoint) and
  load `/` on an account with a real plan: the now bar shows a loading state and never "No plan for
  today"/"DONE" for a day that has a plan. Then confirm a genuinely plan-less day still reads sensibly.
- **Risk:** Low. Confirm the `hasPlan` guard doesn't suppress the legitimate `'allDone'` state for a day that
  has a plan with every task done — that state must still render.

## F9. `homeUiStore` never persists, and CLAUDE.md asserts the opposite of what the plugin does

- **Scope:** app-side `src/core/home/store/homeUiStore.ts` + docs-only `CLAUDE.md`
- **Closes:** `home/B3`
- **Re-verified unchanged this pass:** `homeUiStore.ts:9` is still `defineStore('homeUi', () => {` with no
  third argument, and the file contains no `persist` key.
- **Root cause:** `pinia-plugin-persistedstate`'s default export (`createPersistedState()`, called with no
  arguments in `createAppPinia.ts:11`) resolves `persist = auto` through `options.auto ?? false` → **`false`**.
  The plugin is registered **opt-in**: a store persists only if it declares `persist: true` or an options
  object. `homeUiStore` declares neither, so the toggle resets on navigate-away-and-back and
  `sessionstorage-get homeUi` never finds a key. CLAUDE.md's `_common/bootstrap/` section states the opposite
  ("every store persists to sessionStorage unless it declares `persist: false`"), and `homeUiStore` was
  written straight against that wrong claim. Every other store in the app already declares `persist`
  explicitly, several with a comment noting the real behaviour — `homeUiStore` is the one that didn't, not the
  first of a pattern.
- **Files:** `src/core/home/store/homeUiStore.ts:9-14`; `CLAUDE.md`'s "`_common/bootstrap/`" Persistence bullet
- **What to change:** Add `{ persist: { storage: sessionStorage } }` as the third `defineStore` argument,
  matching `dayPlannerStore.ts:281`. In the same batch, correct CLAUDE.md to say the plugin is opt-in.
- **Do not change:** the other six stores — they already declare `persist` correctly.
- **Verification:** `home/B3`'s `Verify:` block — toggle "Hide done", confirm `sessionstorage-get homeUi`
  returns a blob containing `"hideDoneTodoList":false`, and that `/todo-list` and back preserves it.
- **Risk:** None for the store. The CLAUDE.md edit is documentation-only — but it is the second time this
  claim has cost a bug, so make the correction unambiguous rather than hedged.

## F10. No skip-to-content link

- **Scope:** app-side `src/App.vue` — not the framework
- **Closes:** `_shell/A3`
- **Re-verified unchanged this pass:** `src/App.vue` has zero matches for `skip`.
- **Root cause:** No skip link exists; the first Tab stop from a fresh load is the framework's sidebar toggle.
  To be first in the tab order the link must precede `<Navbar>` in DOM order, which is `App.vue` — and
  `<VMain>` (the `<main>` landmark it targets) is already there too, so no submodule change is needed.
- **Files:** `src/App.vue` — insert before `<Navbar>`, target `<VMain>` (give it an `id`)
- **What to change:** A visually-hidden-until-focused anchor as the first child of `<VApp>`. Label from
  `src/locales/common.{sk,en}.ts` — app-wide string, no module owns it.
- **Verification:** `_shell/A3`'s `Verify:` block — first Tab stop is a visible "skip to main content" link,
  activating it moves focus into the main region, and it is invisible when unfocused.
- **Risk:** None.

## F11. Breadcrumb does not distinguish `/todo-list/:id` from `/todo-list`

> ✅ **FIXED 2026-09-13.** `TodoListView.vue` watches `listEntity` and calls `setBreadcrumbExtra([{ title:
> name }])` (or `[]` while unresolved / not found). Verified on `/todo-list/13001`, `/todo-list/999999`, and
> navigating back to `/todo-list`. `_shell/P1` status line updated.

- **Scope:** app-side `src/core/todoList/view/TodoListView.vue` — not the framework
- **Closes:** `_shell/P1`
- **Re-verified unchanged this pass:** `TodoListView.vue` has zero matches for `useSetBreadcrumbExtra`.
- **Root cause:** `useBreadcrumbs()` builds the trail from the nav tree, which has no entry for
  `/todo-list/:id`, so the param route inherits its parent's crumbs verbatim. The framework already supports
  per-route extra segments — `_common/composable/general/useBreadcrumbs.ts` exports `useSetBreadcrumbExtra()`
  for exactly this — so no submodule change is needed.
- **Files:** `src/core/todoList/view/TodoListView.vue`; reference only,
  `src/_common/composable/general/useBreadcrumbs.ts:76-92`
- **What to change:** Call `useSetBreadcrumbExtra()` and push the fetched list's name once it resolves. Handle
  the two states the view already models — before the fetch resolves, and the `loadFailed` not-found state
  (from the fixed `todo-lists/B1`) — neither should leak a raw id or an empty crumb.
- **Do not change:** `useBreadcrumbs.ts`. A second, `meta`-based mechanism alongside the extras mechanism gives
  the framework two ways to do one thing.
- **Verification:** `_shell/P1`'s `Verify:` block, plus `/todo-list/999999`, which must not render a crumb for
  a list that doesn't exist.
- **Risk:** Low. `extraSegmentSlots` is module-level state; confirm the crumb clears on navigating away.

## F12. The Mappings table body has zero height — the row exists, inside a 0 px scroll box

- **Scope:** app-side `src/core/activityTracking/component/desktop/desktopSettings/DesktopMappingsTable.vue`,
  `src/core/activityTracking/component/android/androidSettings/AndroidMappingsTable.vue`
- **Closes:** `tracking-settings/X1`
- **Root cause — settled from source, and it is not what the finding guessed.** `DataTable.vue:7` renders
  `VDataTableServer` with **`height="0"`** plus `class="flex-fill"`, `fixedHeader` and `fixedFooter`. Vuetify
  turns that `height` into `style="height: 0"` on `.v-table__wrapper` (`VTable.js:53-57`), and the wrapper
  is `flex: 1 1 auto; overflow: auto` inside a `.v-table` that is `display: flex; flex-direction: column`
  (`VTable.css:57-63,108-112`). That is the fill-the-parent-and-scroll trick: the body has **exactly as much
  height as the `.v-table` receives from its own flex parent, and not one pixel of its own.** It works
  everywhere else in the app because every other consumer sits in a definite-height flex chain
  (`RoutineSettingsView.vue:2` is `h-100 d-flex flex-column`; `ActivityTable.vue:42-43` gives `BasicTable`
  `class="flex-1-1" style="min-height: 0"`; `DesktopDistinctEntriesTable.vue:2` — the sibling tab that
  renders fine — has `flex-fill` on its root).
  `DesktopMappingsTable.vue:2` and `AndroidMappingsTable.vue:2` are the two consumers that do not: their root
  is `d-flex flex-column ga-2` with **no `flex-fill`**, so the root's height is its content height,
  `BasicTable.vue:2`'s `h-100` resolves against an auto-height parent (i.e. to `auto`), the `.v-table` gets
  zero slack, and the wrapper stays at `height: 0` — header and row are laid out inside it and clipped.
- **Why the evidence looks the way it does.** The finding read *"not clipped, since the row's own
  `getBoundingClientRect` still returns plausible coordinates"* and concluded paint order. That inference is
  backwards: `getBoundingClientRect` reports layout position and **ignores ancestor clipping**, which is
  precisely why `document.elementFromPoint` at that rect returns the ancestor (`v-card-text`, or the filter's
  `v-col` when the scroll box has been nudged by a focus) — the button is there in layout and absent from
  hit-testing. Playwright's actionability wait failing on *"receives pointer events"* is the same fact.
- **Files:** `DesktopMappingsTable.vue:2,7`; `AndroidMappingsTable.vue:2,7`. Reference only —
  `src/_common/component/dataTable/DataTable.vue:6-7`, `BasicTable.vue:2`, and the working sibling
  `DesktopDistinctEntriesTable.vue:2,9-10`.
- **What to change:** Add `flex-fill` to both roots so they mirror `DesktopDistinctEntriesTable.vue:2`, and
  give the `<BasicTable>` the same `class="flex-1-1" style="min-height: 0"` that `ActivityTable.vue:42-43`
  already uses — the second half is what lets the table shrink below its filter-row sibling instead of
  overflowing the card. Two attributes, two files. **Then check the case the trick exists for:** with 25+
  rows (change the page size or seed more), the body must scroll *inside* the card with a sticky header,
  not push the footer off the card.
- **Do not change:** `DataTable.vue`'s `height="0"` or `BasicTable.vue`'s `h-100`. They are the deliberate
  fill-parent contract that seventeen other tables rely on; making the body self-sizing would silently
  remove sticky headers app-wide. What *is* wrong at the framework level is that the contract is
  **undocumented** — that is `FW4`, and it is a docs commit, not a code change.
- **Verification:** `tracking-settings/X1`'s `Verify:` block on both routes — the row paints in a screenshot,
  and a **normal, non-forced** click on its `edit` button navigates to the `distinctEntries` tab with the
  form populated. Add: `document.elementFromPoint()` at the button's rect centre resolves to the button.
- **Risk:** None beyond layout. The unit's own remark that the Android `VCardText` lacks the app's `flex-fill`
  class is a red herring — Vuetify's `.v-card-text` is `flex: 1 1 auto` by default (`VCard.css:249-250`), so
  both views' card bodies already fill; the omission is one level lower.

## F13. Mappings tab: no filter control reaches the grid, and the delete button reaches nothing

- **Scope:** app-side `src/core/activityTracking/view/DesktopSettingsView.vue`,
  `src/core/activityTracking/view/AndroidSettingsView.vue`, and the two `*MappingsTable.vue` components
- **Closes:** `tracking-settings/B1`. **Also wires `tracking-settings/U1`** (see below), which stays listed
  under *Needs verification* until `F12` makes its button clickable.
- **Root cause — three dead paths, not the two the finding names.** Confirmed in source:
  1. `DesktopSettingsView.vue:32-35` renders `DesktopEntriesFilterBar` unconditionally and its `@filter`
     handler is `distinctEntriesTable?.load()`. On the Mappings tab that ref is `null` (the component is
     `v-if`'d out), so Filter and Enter are silent no-ops. Same at `AndroidSettingsView.vue:32-35`.
  2. `DesktopMappingsTable.vue` holds its own `mappingFilter` (`:59`) and `formData` (`:60`), and nothing
     watches either — `load()` is reached only via `defineExpose` and `BasicTable`'s `@onLoadItems`, which
     fires on page/sort changes. So Is active / Type / Ignored changes never fetch.
  3. **The one the finding missed, and the reason its suggested fix would not pass its own `Verify:`.** Even
     with a watcher, the Activity picker would filter nothing: `formData.activityId` is **never copied** into
     `mappingFilter.activityId` (`load()` at `:62-69` sends `mappingFilter.value` as-is), and the pattern
     fields on `mappingFilter` (inherited from `DesktopDistinctEntriesFilterRequest`) are **never bound** —
     the top bar edits the *view's* `filter` ref, a different object. Repointing `@filter` at
     `mappingsTable.load()` alone would fetch with an empty pattern every time.
     (`roleId`/`categoryId` are commented out of `TrackerDesktopMappingsFilter.ts:17-18`; that is fine —
     `ActivitySelectionForm`'s Role/Category selects cascade the Activity picker's options rather than
     filtering the grid, so they are not dead, just not wire fields.)
- **Files:** `DesktopSettingsView.vue:32-35,48-52`; `AndroidSettingsView.vue:32-35,48-52`;
  `DesktopMappingsTable.vue:1-19,59-79`; `AndroidMappingsTable.vue:1-19,57-77`
- **What to change:** Pick one owner for the pattern filter on the Mappings tab and wire it through.
  Recommended: the view passes its `filter` down to the mappings table as a prop (exactly as it already does
  to `DesktopDistinctEntriesTable` at `:44`), the table builds its request by merging that pattern into
  `mappingFilter` and copying `formData.activityId` into `mappingFilter.activityId`, and `load()` is
  triggered by (a) the view's `@filter` → `distinctEntriesTable?.load() ?? mappingsTable?.load()` and (b)
  a `watch` on the mapping-only fields (`type`, `isActive`, `isIgnored`) and on `formData.activityId`.
  Do **not** deep-watch the whole `mappingFilter` — the pattern text fields would then fire a grid request
  per keystroke, which is exactly why the distinct-entries side uses an explicit Filter button.
  **Same edit, same file, wire the delete:** add `@onDelete` on both `<BasicTable>`s (they declare only
  `edit` today — `DesktopMappingsTable.vue:36`), call `deleteEntity` (already exported by
  `useTrackerDesktopMappingCrud`, `desktopActivityTrackingApi.ts:100,111`) and re-`load()`, the way the
  other eight `@onDelete` consumers do (`RoutineSettingsView.vue:163-179` is the model, including its
  409 handling). Do **not** add a second confirmation through `useDeleteConfirmation` — `BasicTable` has
  already confirmed by the time `onDelete` fires, and Escalation §2 records that this bypass of the app's
  cascade rule is a framework question, not one to paper over per call site. **Expect the dialog to stay
  open after the row is gone** — see *Needs verification*, "the `BasicTable` delete dialog never closes":
  that is a framework defect this batch will be the first to observe, not something to work around here.
- **Do not change:** `BasicTable`'s `hasDelete = true` default — removing the button instead of wiring it
  would close `U1` by deletion, and the usecase names delete as this view's purpose.
- **Verification:** `tracking-settings/B1`'s `Verify:` block on both routes — a `POST
  …/tracker-desktop-mapping-by-pattern/grid` (android equivalent) fires with the updated filter and the count
  changes. Add the third path explicitly: pick an Activity in the picker and confirm the request body carries
  its id; type a process name and click Filter on the *Mappings* tab and confirm the body carries the
  pattern. Then run `U1`'s *What would verify it* step.
- **Risk:** Medium — this is the view's only search and its only delete, and the filter object is shared
  with the create form (`useMappingSettings.ts:33,40`), so a pattern typed to search the Mappings tab is
  also the pattern the next *Save* would write. That is the existing distinct-entries behaviour and is
  arguably the feature; just do not "fix" it in this batch.

## F14. Tabbed routes get the wrong breadcrumb (and sidebar highlight) because the nav `to` is one tab's literal path

- **Scope:** app-side `src/app/nav/navItems.ts`, `src/core/activityTracking/activityTracking.routes.ts` —
  **not** the framework's `useBreadcrumbs.ts` / `navTypes.ts`
- **Closes:** `tracking-settings/B2`, `activity-settings/B6` (borrowed — see the header note)
- **Root cause:** Both units guessed it and both were right: `matchesPath()` (`navTypes.ts:41-44`) is
  `path === to || path.startsWith(to + '/')`, and `findTrail()` (`useBreadcrumbs.ts:16-39`) keeps the
  longest match. The sidebar registers `desktopSettings` as the **literal `distinctEntries` tab path**
  (`navItems.ts:25,28`) and `activitySettings` as `/activity-settings/activities`. So
  `/activity-tracking/desktop/settings/mappings` matches nothing under `settings/` and falls to the longer
  of the two remaining prefixes — `/activity-tracking/desktop`, i.e. *"Desktop tracking"*, a sibling
  screen. `/activity-settings/roles` has no shorter prefix in the tree at all, hence *"Home"* alone. One
  mechanism, two symptoms, two units. **Not filed but source-certain:** `SidebarNavItem.vue:52` uses the
  same `matchesPath`, so on the Mappings tab the sidebar highlights *Desktop tracking* and on `/roles` it
  highlights nothing. Listed under *Needs verification*.
- **Files:** `src/app/nav/navItems.ts:25,28` (and the `activitySettings` entry);
  `src/core/activityTracking/activityTracking.routes.ts:27-31,37-41`
- **What to change:** Point the three nav entries at the **family path** — `/activity-tracking/desktop/settings`,
  `/activity-tracking/android/settings`, `/activity-settings` — and add redirect routes for the two tracking
  parents to `…/distinctEntries` (`/activity-settings` already redirects to `activities`,
  `_routes.md:25`). Prefix matching then resolves every tab value, valid or not, to the right crumb *and* the
  right sidebar item; the sidebar link still lands on the same first tab via the redirect. Optionally append
  the tab as an extra crumb with `useSetBreadcrumbExtra()` (the `F11` mechanism) — not required by either
  finding's `Expected`.
- **Do not change:** the framework matcher. Name-based resolution (the `activity-settings` unit's option 2)
  is a framework batch with its own risk to every app's sidebar and needs a `MenuItem.routeName` design; the
  data fix above closes both findings without it. Also do not register the other tabs as extra nav entries —
  `MenuItem` has no `hidden` flag (`navTypes.ts:10-16`), so they would appear in the sidebar.
- **Verification:** Both `Verify:` blocks — *"Desktop settings"* / *"Android settings"* on the Mappings tabs
  and on a bogus tab value; *"Home › Activity settings"* on `/activity-settings/roles` and `/categories`.
  Add: the sidebar highlights the settings entry, not the dashboard, on every tab.
- **Risk:** Low. The redirect adds two route records to `_routes.md`'s 53 — update the manifest.

## F15. Distinct-entries filter, page and sort are not in the URL

- **Scope:** app-side `src/core/activityTracking/view/DesktopSettingsView.vue`, `AndroidSettingsView.vue`,
  `src/core/activityTracking/composable/useMappingSettings.ts`, the two `*DistinctEntriesTable.vue`
- **Closes:** `tracking-settings/B3`
- **Root cause:** `useMappingSettings.ts:33` holds `filter` as a bare `ref`, and each table holds `page`,
  `itemsPerPage`, `sortBy` as bare refs (`DesktopDistinctEntriesTable.vue:56-59`). CLAUDE.md's *URL State*
  rule names all four. The finding filed only the filter; paging and sort are the same rule and the same
  edit, so they are in scope here rather than a later ticket.
- **Files:** as above; reference — `src/_common/composable/table/useTableUrlState.ts` (the framework's
  page/perPage/sortBy sync; `leisureFilterUrlState.ts` is the app's worked example of a filter on top of it)
- **What to change:** Sync the four through `useTableUrlState` plus a filter serializer, the way
  `core/leisure/composable/leisureFilterUrlState.ts` does. **Two traps, both already paid for once:**
  1. `edit()` (`DesktopSettingsView.vue:89-107`) mutates `filter` *and* calls `router.push(...)` in the same
     tick. A URL-sync watcher will `router.replace` against a stale `route.query` snapshot at the same
     moment — the exact two-writer race that is `F1`. Fold the query into the single `router.push` inside
     `edit()`, or suspend the sync while it runs.
  2. `useTableUrlState` and `BasicTable`'s mount-time `sortBy` push (`BasicTable.vue:192-203`) interact —
     see `F1`'s `defaultSortBy` note. The distinct-entries table uses `DataTable` directly, so it is
     unaffected; the mappings table (`F13`) uses `BasicTable` and is.
  Do the Mappings tab's `mappingFilter` in the same pass **only after `F13`**, when it actually filters.
- **Do not change:** `filter`'s double duty as the create form's pattern (`useMappingSettings.ts:40`). That
  means the in-progress rule pattern lands in the URL; it is bookmarkable state by CLAUDE.md's definition
  and harmless.
- **Verification:** `tracking-settings/B3`'s `Verify:` block, then reload with `page=2`/a sort in the query
  and confirm both survive. Re-run `edit()` from the Mappings tab and confirm the query is intact afterwards.
- **Risk:** Medium — the same class of race as `F1`; test the edit hand-off specifically.

## F16. The settings header row clips its labels at 1440 px

- **Scope:** app-side `DesktopSettingsView.vue:7-36`, `AndroidSettingsView.vue:7-36`
- **Closes:** `tracking-settings/B4`
- **Root cause:** The header `<div class="pa-4 pb-0 w-100 d-flex align-center ga-4">` holds the title, the
  two-button `VBtnToggle` and the whole filter bar with no `flex-wrap`; the bar's own root only stacks below
  `md` (`DesktopEntriesFilterBar.vue:2`, `flex-column flex-md-row`). At 1440 px everything is a row and
  every child shrinks: the screenshot on disk reads *MAPPI*, *P…*, *Co…*, *W…* — confirmed from
  `desktop-settings-mappings--default.png` this pass, no browser needed.
- **Files:** as above
- **What to change:** Let the header wrap (`flex-wrap`) so the filter bar drops to its own line when it does
  not fit, and give the `VBtnToggle` `flex-shrink: 0` so tab labels never truncate. **Run after `F13`** — if
  that batch hides or repoints the bar on the Mappings tab, the row to lay out is different.
- **Do not change:** the filter bar's `flex-md-row` breakpoint — it is right for mobile and is not the
  problem.
- **Verification:** `tracking-settings/B4`'s `Verify:` block at 1440×900 on all four routes; re-check 1920
  still renders single-line, and 390 still stacks.
- **Risk:** None beyond layout.

## F17. CLAUDE.md's "every settings page" sentence reads wider than `moduleSettingsLinks.ts` means

- **Scope:** **docs only** — `CLAUDE.md`, the *Where a preference lives* section's second consequence
- **Closes:** `tracking-settings/P1`
- **Root cause:** The sentence *"Every settings page must be reachable from `/user/settings`"* is read
  literally by every unit agent (unit 10 raised it for `/routine-settings`, unit 6 for these two), while
  `moduleSettingsLinks.ts:10-14` records the actual rule — **preference** pages yes, **entity-management**
  pages no — and lists these exact routes as the excluded example. The two documents agree; only CLAUDE.md
  fails to say so where it is read.
- **What to change:** Qualify the sentence to *"every **preference** settings page"* and cross-reference the
  `moduleSettingsLinks.ts` comment as the owner of the list. One sentence. Nothing in `src/` moves.
- **Do not change:** `moduleSettingsLinks.ts` — adding the tracking routes there is the outcome the file's
  own comment argues against, and no finding asked for it.
- **Verification:** N/A — read-through. The next unit that inherits the "check `/user/settings`" brief
  should stop filing it.
- **Risk:** None.

## F18. The mount-time combobox rebuild writes back into the activities filter

- **Scope:** app-side `src/core/activity/composable/useActivityFilterDrafts.ts` (and the two `VCombobox`
  bindings in `src/core/activity/view/ActivitySettingsView.vue:28-51`)
- **Closes:** `activity-settings/B2`, `activity-settings/B3`. **Retests `U4`** — see *Needs verification*.
- **Root cause — one mechanism, two symptoms, and the unit's guess was right on both.** Confirmed in
  source: `refreshActivityCombos()` (`useActivityFilterDrafts.ts:65-76`) *reassigns* `roleCombobox` and
  `categoryCombobox` from the filter, and the two deep watchers at `:189-209` write the combobox back
  *into* the filter — `roleIds = vals.filter(…).map(v => v.id)`, which is `[]` when the combobox is
  empty. So every programmatic rebuild is also a write, and the rebuild runs in `onMounted` (`:103-107`),
  when `roleOptions` is still `[]` because `activityOptionsStore` is `persist: false` and its fetch has
  not resolved (`activityOptionsStore.ts:320`).
  - **B2:** with `?roleIds=11001`, `hydrateTabFromQuery` sets `[11001]`; the rebuild finds no option to
    match (`buildCombobox` drops unmatched ids, `activitySettingsUrlParams.ts:99-102`), assigns `[]`,
    the watcher writes `roleIds = []`, and the `activitiesFilter` deep watcher (`:167-173`) calls
    `syncUrl()`, which omits an empty list — the param is gone before the first request. When the
    options land, `watch([roleOptions, categoryOptions])` rebuilds from the already-wiped filter.
  - **B3:** on a bare load the constructor default is `roleIds = null` (`ActivityFilter.ts:8`); the
    same write turns it into `[]`. `useLookupTable.ts:41-52` guards its deep filter watch with a JSON
    snapshot **for exactly this case** — its comment names "a combobox watcher re-deriving ids/name from
    the same filter" — but `"roleIds":null` ≠ `"roleIds":[]`, so it fires `loadItems()` a second time,
    aborting the `BasicTable` mount's request. The Roles/Categories tabs have no combobox and fire once,
    which is the finding's own control.
- **Files:** `useActivityFilterDrafts.ts:65-76,103-113,189-209`; `ActivitySettingsView.vue:28-51`;
  reference only — `useLookupTable.ts:34-52`, `activitySettingsUrlParams.ts:93-105`,
  `activityOptionsStore.ts:164-169,320`
- **What to change:** Separate "the user edited the combobox" from "the code rebuilt the combobox" —
  today both go through one deep watcher. Recommended: delete the two combobox watchers and move the
  filter write into `@update:modelValue` handlers on the two `VCombobox`es (a function each,
  `onRoleComboboxInput(vals)` / `onCategoryComboboxInput(vals)`, exported from the composable). A
  component event fires for user input only, so `refreshActivityCombos()` becomes a pure derivation and
  both symptoms go. In the same handlers, **normalise the empty case to `null`** (`ids.length ? ids :
  null`) so clearing every chip returns the filter to its constructor shape and `useLookupTable`'s
  snapshot sees no change. If the watcher shape must stay, a guard flag only works with
  `{ flush: 'sync' }` on both watchers — the default pre-flush runs after a synchronous
  `syncing = false` has already been reset — so say which in the commit.
  **Do not** fix B2 by skipping the rebuild while the options are empty: a user with zero categories
  would then never get their chips built, and it leaves the writer in place for the next caller.
- **Do not change:** `useLookupTable`'s snapshot guard to treat `null` and `[]` as equal — that would
  mask the writer rather than remove it, and the guard's comment would become a second wrong claim about
  what the combobox does. Also leave the `watch(tab)` / `watch(activeTab)` mirrored early-exits alone;
  the composable's header comment explains why they are load-bearing and this batch does not touch
  tab switching.
- **Verification:** `B2`'s `Verify:` block — `?roleIds=11001` survives a fresh `goto` **and** the outgoing
  `POST /api/activity/grid` body carries `"roleIds":[11001]` (the rows will still not filter until
  Escalation §6 lands; check the request, not the table). `B3`'s block — exactly one grid `POST` per
  load, no `ERR_ABORTED`. Add: pick a role from the combobox, remove the chip, and confirm the request
  body reads `"roleIds":null` (not `[]`) and the URL has no `roleIds`. Then re-drive `U4`'s sequence
  (type a name, clear it) three times.
- **Risk:** Low-medium. The watcher graph in this composable has a warning comment for a reason; the
  change is confined to the two combobox edges, but run the tab-switch-with-filters-set case the comment
  describes before and after.

## F19. Roles/Categories tables: parse `canDelete`/`usageCount`, gate the role delete, cascade-confirm the category delete — and name the trash button before copying it

- **Scope:** app-side `src/core/activity/dto/response/Role.ts`, `Category.ts`,
  `src/core/activity/component/activityRole/ActivityRoleTable.vue`,
  `activityCategory/ActivityCategoryTable.vue`, `ActivityTable.vue:121-137`; plus one row in CLAUDE.md's
  *sanctioned cross-module imports* table
- **Closes:** `activity-settings/B7`, `activity-settings/A1`. **Answers `U2`** from source (below) — the
  browser step it asks for is optional.
- **Root cause — and two things the finding's suggested fix gets wrong.** `ActivityRoleTable.vue:2-15`
  and `ActivityCategoryTable.vue:2-15` use `BasicTable`'s default actions with `@onDelete`, so every row
  offers an always-enabled delete behind the generic *"Are you sure you want to delete X?"*. The finding
  proposes copying `ActivityTable.vue`'s `:disabled="!item.canDelete"` slot. That would fail twice:
  1. **The DTOs drop the field.** The wire carries `canDelete`/`usageCount` on both grids
     (`GridActivityRoleEndpoint.cs:41-44`, `ActivityCategoryGridResponse.cs:66-67` — and the finding's
     own evidence shows them), but `Role.fromJson` (`Role.ts:20`) and `Category.fromJson`
     (`Category.ts:14`) destructure neither. `item.canDelete` is `undefined`, `!undefined` is `true`, and
     **every** delete button would disable.
  2. **The two tables must not behave the same, because the server does not.** Read at the source:
     - **Roles:** `DeleteActivityRoleEndpoint.cs:42-62` refuses with **409** on both a `systemKey` and
       an in-use role, with a user-readable message — `Activity.RoleId` is `NOT NULL` and the FK is
       `Cascade` (`ActivityConfiguration.cs:34`), so refusing is the only non-destructive answer.
       `canDelete: false` is enforced. Mirror `ActivityTable`'s disabled button + tooltip here.
     - **Categories:** `DeleteActivityCategoryEndpoint.cs` is a bare `BaseDeleteEndpoint`; the FK is
       `SetNull` (`ActivityConfiguration.cs:42`), and `ActivityCategoryResponse.cs:26-31` says so in as
       many words: *"⚠ This one is advisory, not a prediction of a 409 … deleting a used category is not
       destructive — it blanks the classification … the field exists so the settings grid can say
       **what** a delete will reclassify before it happens."* Disabling it would block an operation the
       server deliberately allows. The correct shape is CLAUDE.md's cascade rule: a delete that takes
       other rows' state with it **always confirms and says how many** — `usageCount` activities will
       lose their category. That is `useDeleteConfirmation`'s `cascades: true` branch, which the
       generic `BasicTable` dialog cannot express (Escalation §2 is the same gap seen from
       `/routine-settings`).
- **Why `A1` is in this batch and not its own.** `ActivityTable.vue:122-131`'s trash `VIconBtn` has no
  `title`/`aria-label` (confirmed: Edit at `:99` and Archive at `:110` carry `:title`, the trash does
  not); its `VTooltip` hangs off the wrapping `<span>` because a disabled `VBtn` takes no pointer
  events. This batch tells a fixing session to copy that slot into two more tables — fix the template
  **first**, or the defect ships three times. Use **`:aria-label`**, not `:title`: the wrapper's
  `VTooltip` is already the visual tooltip, and a native `title` on the button would render a second
  one on hover (the finding's suggested `:title` fix would produce that). Same conditional text as the
  tooltip: `item.canDelete ? t('general.delete') : t('activities.archive.deleteBlocked')`.
- **Files:** `Role.ts:4-22`, `Category.ts:3-16` (add `usageCount = 0`, `canDelete = true` to the
  constructor and `fromJson`, defaults chosen so a non-grid read — the nested `role` on an
  `ActivityResponse`, which the API documents as carrying meaningless zeros — stays harmless);
  `ActivityRoleTable.vue` and `ActivityCategoryTable.vue` (custom `#actions` slot, `confirm()` from
  `useDialog` the way `ActivityTable.vue:296-313` does, then `useLookupTable`'s `onDelete`);
  `ActivityTable.vue:122` (the `aria-label`); `CLAUDE.md` — add `activity` to the `useDeleteConfirmation`
  importers row, since the table says "the five delete sites" and this makes a sixth. Locale keys for
  the category cascade copy go in `activity.{sk,en}.ts` (*"N activities will lose this category"*, with
  the count); the role tooltip can reuse `activities.archive.deleteBlocked` or get a role-specific key —
  check the SK reads naturally for a role before reusing.
- **Do not change:** the server. The asymmetry is designed and documented; do not file a "make
  categories 409 too" ask off this batch. Do not route the role delete through
  `useDeleteConfirmation` — `canDelete: true` means nothing references it, which is
  `ActivityTable`'s own reasoning at `:291-295`. Do not keep `@onDelete` on `BasicTable` alongside the
  custom slot; with `showActions` and a slot the default buttons are gone and the emit is dead.
- **Verification:** `B7`'s `Verify:` block on both tabs — the three system roles and every in-use row
  render a disabled Delete with a tooltip. Then the category half, which `B7` does not cover: click
  Delete on *"Errands"* (in use), and the dialog must name the count before Confirm; **cancel it** on the
  seed. To see the 204 + reclassify path end to end, create a throwaway category and activity through
  the API first (the mutating-spec rule). `A1`'s block — `getByRole('button', { name: 'Delete' })`
  resolves on the activities table, and hovering shows **one** tooltip. Then confirm the delete dialog
  on these two tables **closes** after Confirm — they are now on `useDialog().confirm()` and no longer on
  `BasicTable`'s built-in dialog, which is the one suspected of never closing (see *Needs
  verification*).
- **Risk:** Medium. Widening `Role`/`Category` touches every consumer of those DTOs (the option
  store, the forms, the nested `role`/`category` on `Activity`) — the additions are optional-with-default
  so nothing should notice, but run `npm run type-check`. The category cascade copy is a user-facing
  number; get the plural right in SK.

## F20. No catch-all route — any unknown URL renders a blank main area

- **Scope:** app-side `src/router.ts` (the route array's last entry) plus one small view and two locale
  keys in `src/locales/common.{sk,en}.ts` — **not** `activity.routes.ts`
- **Closes:** `activity-settings/B5`
- **Root cause — app-wide, not activity-settings.** `activity.routes.ts:10`'s
  `:tab(activities|roles|categories)` regex is correct and rejects `/activity-settings/nonsense`; what
  is missing is anything to catch the rejection. `src/` contains **no** `pathMatch`, no not-found route
  and no catch-all of any kind (grep across `src/**/*.{ts,vue}` this pass), so `/foo`, `/todo-list/abc`
  and every other unmatched path do exactly what the finding describes — sidebar and top bar render,
  `<RouterView>` renders nothing, and the console warns. Unit 2 is simply the first unit whose route
  has a constrained param, so it is the first to have typed a wrong one.
- **The 23 repeated empty-path warnings** are consistent with the ~two dozen `:to` links in the shell
  (`SidebarNavItem.vue:10,27`, `SidebarNavGroup.vue:35,60`, `UserMenu.vue:26-41`, `AppTopBar.vue:18`)
  each resolving via `useLink` against a current route that has no match; not verified further, and not
  worth it — once the current route *is* matched, the condition that produces them is gone. Confirm by
  console after the fix rather than by root-causing it first.
- **Files:** `src/router.ts` (append `{ path: '/:pathMatch(.*)*', name: 'notFound', component:
  NotFoundView }` **after** every spread — order is what makes it a fallback); the view itself.
  `TodoListView.vue:18-19` and `PlannerTaskLinkView.vue:8-9` are the app's existing not-found
  treatments (a `VEmptyState` with a localized title/text and a way home) — copy that shape.
- **What to change:** One global not-found route rendering a localized empty state with a link to
  `{ name: 'home' }`. Leave it **non-public**: a signed-out visitor on an unknown path should still go to
  `/login`, and the guard's `SIGNED_OUT_ONLY_ROUTES` bounce back to `/` afterwards is fine. Where the
  view lives is a judgement call CLAUDE.md's framework rule answers — a not-found page is generic enough
  that another app would want it as written, so `src/_common/component/` (submodule commit + pointer
  bump) is the "right" home; if the fixing session does not want a two-repo change, `src/core/home/view/
  NotFoundView.vue` with a `migration-revision.md` entry is the sanctioned fallback. The **route
  registration is app-side either way**, which is why this is an app batch.
- **Do not change:** the activity route's regex, or widen it to `:tab(…)?` with a `beforeEnter` — the
  finding's suggested fix. That closes one family and leaves every other unmatched path blank; and a
  *missing* tab already redirects (`activity.routes.ts:5-8`), so the only case it would add is
  "invalid tab → activities", which is arguably wrong (a bad URL should say so, not silently land
  somewhere else). `B5`'s pass condition accepts either; the global page satisfies it.
- **Verification:** `B5`'s `Verify:` block, then `/foo` and `/todo-list/abc` — all three render the
  not-found state, the console logs **no** `[Vue Router warn]`, and the sidebar highlights nothing.
  Signed out, `/foo` still lands on `/login`.
- **Risk:** Low. A catch-all declared *before* a real route would shadow it — it must be last, and
  `_routes.md` gains one record (54, or 56 after `F14`'s two redirects).

## F21. Categories table's "Role" column is a comma-joined aggregate presented as a single value

- **Scope:** app-side `src/core/activity/component/activityCategory/ActivityCategoryTable.vue:59`,
  `src/core/activity/_locales/activity.{sk,en}.ts`
- **Closes:** `activity-settings/P1`
- **Root cause:** By design on the server and merely mislabelled on the client.
  `ActivityCategoryGridResponse.cs:14-36` documents `Role` as *"every distinct role worn by the
  activities in this category, alphabetical and comma-joined"* — a category has no role of its own — and
  the grid sorts the column through a `RoleSortKey` proxy (`:46-47`, mapped from the incoming `role`
  key). The client header is `t('activities.role')`, the same singular label the Activities tab uses
  for a real FK. `Category.ts:10` already types it `role: string | null`; `CategoryRequest.ts` correctly
  has no role field. Severity `polish` stands — nothing is wrong, the header lies.
- **Files:** `ActivityCategoryTable.vue:59`; `activity.sk.ts` / `activity.en.ts` (one new key)
- **What to change:** A header that says what it is — *"Used under"* / *"Roles in use"* — as a new
  locale key; **keep the column key `role`**, because that is the sort key the server remaps. Rendering
  the string as chips (split on `", "`) is optional and cheap; do it only if the row height stays
  single-line at the seed's widest value (*"Health & Fitness, Hobbies & Leisure, Work"*).
- **Do not change:** `Category.ts` or the DTO shape, and do not add a `roleId` to `CategoryRequest` —
  the server has no such column and the unit's inference about the glossary is a doc question, not a
  code one.
- **Verification:** `P1`'s `Verify:` block; sort by the column once in each direction and confirm it
  still orders (the key must not have changed).
- **Risk:** None.

## F22. Activities filter bar clips the "Categories" label

- **Scope:** app-side `src/core/activity/view/ActivitySettingsView.vue:12-67`
- **Closes:** `activity-settings/P2`
- **Root cause:** The filter row `<div class="d-flex ga-2 ml-14 flex-1-1">` holds five controls (two
  text fields, two chip comboboxes, a three-button toggle) with no `flex-wrap` and no `min-width` on any
  of them, so at the captured width every child shrinks evenly and the longest label loses. Same class
  as `F16` (a flex row with shrinkable children in `tracking-settings`) — a different file with a
  different set of children, so a different edit, and kept separate for that reason; if both land in one
  session, use the same treatment.
- **Files:** `ActivitySettingsView.vue:12` (the row) and `:28-51` (the two comboboxes)
- **What to change:** A `min-width` on the two comboboxes (they also grow chips, so they are the ones
  that need room) and `flex-wrap` on the row so the toggle drops to a second line before anything
  truncates. Check 1440 and 1920 — the finding measured 1920 and it clipped there, so 1440 is worse.
- **Do not change:** `VBtnToggle`'s `flex-0-0` — it is already the one child that must not shrink.
- **Verification:** `P2`'s `Verify:` block at 1920 and 1440; a screenshot, since the a11y tree cannot
  see truncation.
- **Risk:** None beyond layout.

## F23. Parallel `playwright-cli` sessions must not share one storage-state file — the API rotates refresh tokens

- **Scope:** **docs only** — `prompts/view-docs/README.md` *Parallelism* paragraph, and CLAUDE.md's
  *Browser verification — Signing in* section
- **Closes:** `activity-settings/U3` (re-graded — see *Contradictions* §19)
- **Root cause:** The runbook says *"If you do parallelise inventory passes, give each agent its own
  session name and have it `state-load` the auth file"*. Under the API that is wrong on its face:
  `JwtService.cs:38` calls `RotateRefreshTokenAsync` on **every** refresh, and
  `RefreshTokenService.cs:35` tolerates a stale concurrent refresh for a **5-second** grace window only.
  Two sessions loaded from one `auth-10001.json` hold one refresh token; the first to hit the ~15-minute
  access-token expiry rotates it, and the second, refreshing minutes later, gets `POST /api/auth/refresh`
  → **401** and a real sign-out — which is precisely the sequence `U3` recorded, on a pass its own
  operator note says ran alongside two other units. The unit's hypothesis (b) is the mechanism; (a),
  plain TTL expiry, cannot produce a 401 on `/refresh` for a token that had just been used successfully.
- **What to change:** Replace the sentence with the rule: **one signed-in state per concurrent
  session.** Either sign each session in separately (each gets its own refresh token) or `state-load`
  the file into **one** session only. Add one line to CLAUDE.md's 401-burst paragraph: *"a 401 on
  `/api/auth/refresh` itself is not the expected burst — it means the refresh token was rotated away,
  usually by a second session sharing the same state file."* Nothing in `src/` changes.
- **Do not change:** the API's rotation or grace window. Rotation is the correct security posture and
  5 s is generous for the SPA's own concurrent-refresh race, which is what it is for.
- **Verification:** Read-through. The next parallel run should not lose a session.
- **Risk:** None.
- **Grown in the fifth pass — two more rules from `todo-routine`'s round-5 environment note, same
  paragraph, same edit.** That round ran alongside at least two other agents (`playwright-cli list` showed
  `trkset` and `activity-settings` sessions) and paid for it three ways, each a different mechanism from
  the refresh-token one above:
  1. **The unnamed `default` browser session is shared by every agent that omits `-s=`.** Round 5 saw
     navigations to `/routine-todo-list` land on `/todo-list/13001`, two dialogs open with no action of its
     own, and two `todo-lists` fixture items (14015, 14013) toggled by clicks that were meant for another
     tab — all genuinely two agents driving one browser. Switching to `-s=todo-routine` stopped it at once.
     The runbook's *"give each agent its own session name"* is conditional on *"if you do parallelise"*, and
     `PROMPT-TEMPLATE.md` never mentions `-s=` at all (grep confirms) — so the unit agent cannot know to.
     **Make it unconditional in the template:** every `playwright-cli` command in a unit pass carries
     `-s=<unit-name>`. CLAUDE.md's *Browser verification* examples should carry it too, since agents copy
     them verbatim.
  2. **`POST /api/test/seed` is a live hazard mid-pass, not a start/end-of-pass operation.** A reseed
     wipes every account; round 5's three `B9` attempts each lost a period it had just created — the third
     time on a plain reload — and its two accidental mutations were reset before it could revert them
     itself. The template's *"reseed at the end"* advice (`PROMPT-TEMPLATE.md:172`) needs the other half:
     **never reseed while another unit may be running**, and a mutation pass that sees a row it created
     vanish should suspect a reseed before suspecting the app.
  3. **The runbook already forbids concurrent mutation passes** (*Parallelism: inventory passes can,
     mutation passes cannot*), and round 5 was a mutating retest running concurrently anyway. That is an
     operator error the runbook cannot prevent, but it can make cheaper to notice: state in the template
     that `state-load`, `-s=`, and "am I the only mutating session" are three separate questions.
  The `-s=` half is the one that changes agent behaviour; the other two are one sentence each.

## F24. Routine components format dates through the browser's locale, not the account's

- **Scope:** app-side `src/core/todoList/` — five files, eight call sites, one helper
- **Closes:** `todo-routine/B10`
- **Root cause:** `toLocaleDateString(undefined, …)` resolves the **browser's** `Intl` locale, and the
  account's language is a vue-i18n setting the browser knows nothing about. The finding names two call
  sites in one file; a grep for `toLocaleDateString(undefined` across `src/` finds **eight, in five files,
  all in this module's routine components** — the same defect written five times, each with its own private
  formatter:
  - `component/routine/RoutinePeriodTimeline.vue:56` (`resetDateLabel`) and `:118-121` (the per-segment
    `label` — weekday / month+day / month, by segment mode) — the finding's two
  - `component/routine/RoutineGroupHeatmap.vue:120` — heatmap cell tooltip date
  - `component/routine/dialog/RoutineGroupHistoryBody.vue:163` — history dialog period labels
  - `component/routine/RoutineStreakFreeze.vue:69-72` — the `date` interpolated into
    `routineTodoList.freeze.remainingTooltipWithReset`
  - `composable/useStreakFreeze.ts:87-89` — `formatDate()`, a **module-level** function with no `useI18n`
    in scope, feeding `formatPeriodLabel`
  The app already has the correct pattern in three places, none of them in this module: `localeTag()` from
  `@/i18n.ts` maps the i18n locale to a BCP-47 tag, and `NowBar.vue:261` (`dateLocale = computed(() =>
  localeTag(locale.value))`), `LegalDocument.vue:68` and this module's own `useAnchorDayOptions.ts:50` (the
  round-3 `Intl.PluralRules` fix) all pass it explicitly. Round 3 localized the *strings* on these screens
  (B4/B6) by grepping for literals, which is exactly why this survived: `toLocaleDateString` produces real
  text in every locale, so there is no raw key and no literal to find.
- **Files:** the five above; reference — `src/i18n.ts:35` (`localeTag`),
  `src/core/todoList/composable/useAnchorDayOptions.ts:35,50`
- **What to change:** One small composable in `src/core/todoList/composable/` — say
  `useRoutineDateFormat()` returning `shortDate(date)` (month+day), `shortWeekday(date)` and
  `shortMonth(date)`, each `computed`-aware of `locale` via `localeTag(locale.value)` — and replace all eight
  call sites with it. The `useStreakFreeze.ts` site is the one that needs care: `formatDate` is called from
  inside the composable's returned `formatPeriodLabel`, so either `useStreakFreeze()` calls
  `useRoutineDateFormat()` itself (it already runs in setup scope) or `formatPeriodLabel` takes the
  formatter as a parameter. Do the `RoutinePeriodTimeline` `segments` computed last and make sure it still
  re-evaluates on a locale switch — it depends on `timePeriod` only today, and a `t()`-free computed will
  not re-run when `locale` changes unless it reads `locale.value` (through the helper) inside its body.
- **Do not use `formatLocalized` from `_common/utils/DateTimeHelper.ts`**, which the finding offers as an
  alternative. Despite its name it is `dayjs(date).locale('sk').format(format)` — **hardcoded Slovak**, as is
  every other formatter in that file (`:73-107`). In EN it would render Slovak abbreviations, i.e. the
  mirror image of this bug. That is a framework gap (a helper called *localized* that is not) worth a
  `migration-revision.md` line, not a fix in this batch — see *Contradictions* §22.
- **Do not change:** `RoutinePeriodTimeline.vue:68-71`'s `timeLabel` — it already goes through `t()` and
  is the correctly-localized half the finding contrasts against. Also not in scope:
  `activityTracking/component/stackedBars/StackedBarsGrid.vue:460` (`toLocaleString('en', …)`, hardcoded
  English — same class, different module, unit 5 has not run) and the four `toLocaleTimeString([], …)`
  calls in `activityTracking/component/timeline/` (locale-neutral `HH:MM`; fine).
- **Verification:** `todo-routine/B10`'s `Verify:` block — account set to Slovak, `/routine-todo-list`,
  Weekly card reads `po ut st št pi so ne`-style weekdays and Monthly/Yearly cards Slovak month forms, and
  the Daily card's top-right reset date follows. Then, still in SK: hover a heatmap cell, open a group's
  history dialog, and hover the freeze budget chip — the three sites the finding did not name. Switch back
  to EN **without reloading** and confirm every one of them re-renders in English (the `computed`
  dependency check above).
- **Risk:** Low. Pure formatting; no request shape changes. The one behavioural difference a user could
  notice is that the timeline's labels now follow the *account* language rather than the *OS* language,
  which is what every other string on the card already does.

## F25. `/routine-settings` "Color" column header is the capitalized raw key

- **Scope:** app-side `src/core/todoList/view/RoutineSettingsView.vue:103`
- **Closes:** nothing filed — `todo-routine/B4`'s round-5 verification note records it as *"noted here
  rather than filed"*. Given a batch because it is the last unlocalized string on a screen whose
  finding is otherwise closed, and it is one token.
- **Root cause:** `new TableColumn('color', '', false)` — an intentionally empty title, on the theory that
  a swatch column needs no header. The framework does not honour that: `TableHeaderComposable.ts:28` is
  `title: col.text !== '' ? col.text : capitalizeString(col.key)`, so `''` becomes **"Color"** in every
  locale. Round 5 saw it as the one English header on an otherwise Slovak table. The app's own convention is
  the opposite of the empty string: `ActivityCategoryTable.vue:62` and `ActivityRoleTable.vue:61` both
  title their swatch column `t('activities.color')`. And the key already exists —
  `routineTodoList.timePeriods.color` (`todoList.en.ts:192`, SK mirror) is what `TimePeriodForm`'s Color
  field uses.
- **What to change:** `new TableColumn('color', t('routineTodoList.timePeriods.color'), false)`. The
  `columns` computed already tracks the locale (the comment above it at `:100-101` says why), so nothing
  else moves.
- **Do not change:** `TableHeaderComposable.ts`'s fallback. Whether `''` should mean "no header" is a
  framework decision (rule 4) with one call site asking for it, and the app convention says the header
  should exist anyway.
- **Verification:** `/routine-settings` in SK — second column header reads *Farba*; in EN, *Color*. Console
  clean.
- **Risk:** None.

---

## FW1. `MyDialog` is `persistent` by default, so Escape closes nothing

- **Scope:** **[framework]** `src/_common/component/dialog/MyDialog.vue` — submodule commit in `vue_framework`,
  then a pointer bump in this repo, in that order
- **Closes:** `_shell/A1`
- **Re-verified unchanged this pass:** `MyDialog.vue:86` still defaults `persistent = true`; `onEscKey()`
  (`:136`) is still the only Escape handler.
- **Its own batch, and it needs a decision before a patch** (rule 4): flipping the default changes dismissal
  semantics for every dialog in every app on the framework, including destructive confirms. The two options —
  flip the default and have guarding dialogs opt **in**, versus keep the default and have harmless call sites
  opt **out** — are not equivalent in risk.
- **Files:** `src/_common/component/dialog/MyDialog.vue:86,136`; `src/_common/docs/components.md` in the same
  commit
- **What to change:** Whichever the decision is, plus the framework docs, plus a default that keeps existing
  apps working if it goes the opt-in way.
- **Verification:** `_shell/A1`'s `Verify:` block, **both halves** — a fix that makes every dialog escapable is
  a regression, not a fix. A destructive confirm must still resist Escape.
- **Risk:** Highest in this queue. Ships to every app on `vue_framework`, and the failure mode of getting it
  wrong (a half-filled form dismissed by a stray Escape) is data loss.

## FW2. Two framework icon-only controls have no accessible name

- **Scope:** **[framework]** `src/_common/nav/AppTopBar.vue`, `src/_common/component/FilterPanel.vue` —
  one submodule commit, then a pointer bump
- **Closes:** `_shell/A2`, `leisure-projects/A1`
- **Grown since the last queue.** Unit 13 found the second one. Both are a `VIconBtn` shipped with no
  `title`/`aria-label`, both in `src/_common`, both fixed by the same edit in the same commit — that is one
  batch, not two. Re-verified by direct read this pass: `AppTopBar.vue:11` (`icon="bars"`) has no label of any
  kind, contrasting with the theme toggle at `:44` which does carry `:title`; `FilterPanel.vue:49-55`
  (`icon="close"`) likewise.
- **Files:** `src/_common/nav/AppTopBar.vue:9-16`, `src/_common/component/FilterPanel.vue:49-55`
- **What to change:** A localized `aria-label` (and optionally `title`) on each, using the framework's own
  locale namespace — `general.close` already exists there for the panel. **Check the app-side mirror**: this
  app's `general` namespace replaces the framework's wholesale, so any key the framework resolves must also
  exist in `src/locales/common.{sk,en}.ts` or it renders raw here (CLAUDE.md R5/R6/R11 — six instances so
  far). Update `src/_common/docs/components.md` in the same commit.
- **Do not change:** anything under `src/core/` — in particular not `leisure-projects/A2`'s Messy icon (`F4`),
  which is the same class of defect on the app side and must ship separately.
- **Verification:** `_shell/A2`'s and `leisure-projects/A1`'s `Verify:` blocks — each control exposes a
  localized accessible name, the sidebar toggle still toggles, the filter panel still closes. Confirm the
  names follow the locale rather than being hardcoded English, **in SK as well as EN**, since that is where
  the missing-mirror failure shows.
- **Risk:** Low, but still two repos, two commits — submodule commit before the pointer bump.

## FW3. `Time.fromJson` cannot parse the backend's string shape

> ✅ **CLOSED 2026-09-13.** "Re-verified unchanged and still live" was true of the file and false of the
> defect: the API switched `dueTime` to `{hours, minutes}` on 2026-09-11 (backend `6395cee`), and the wire
> now reads `"dueTime":{"hours":17,"minutes":0}`. `Time.fromJson` was still made to delegate to
> `Time.fromString()` for a string argument — generic, default-preserving, documented in `baseDtos.md` —
> so the framework DTO reads either shape. Verified end to end: 6× `PUT` → 200, snackbar, 17:00 preserved
> after reload. Both `todo-motivation.spec.ts` `fixme`s are real tests now. `todo-lists/B4` closed.

- **Scope:** **[framework]** `src/_common/dto/dto/Time.ts` — submodule commit, then pointer bump
- **Closes:** `todo-lists/B4`
- **Re-verified unchanged and still live this pass:** `Time.fromJson` still reads
  `const { hours = 0, minutes = 0 } = object`.
- **Root cause:** The backend serializes a due time as the **string** `"HH:MM:SS"`, so every item with a real
  due time silently parses as `00:00` on read, and any subsequent `update()`/`updateWithResponse()`
  round-trips that zeroed value back out as `{"hours":0,"minutes":0}`, which the backend rejects with a 400
  (*"Cannot get the value of a token type 'StartObject' as a string."*). Not scoped to the overdue-renegotiation
  banner — it breaks **any** update path that serializes a `dueTime` through `ToDoListItemRequest.fromEntity`.
  `Time.fromString()` (same file, `:50-58`) already parses the string shape correctly; `fromJson` just doesn't
  call it.
- **Files:** `src/_common/dto/dto/Time.ts:17-20`
- **What to change:** Have `fromJson` delegate to `fromString` when its argument is a string.
- **Verification:** `todo-lists/B4`'s `Verify:` block — on `/todo-list/13002` ("Errands") click "Today" on the
  overdue banner: all 6 `PUT`s return 2xx, the "Moved 6 tasks…" snackbar appears, and each item's
  **time-of-day is preserved**, not zeroed. The second half matters: a fix that only stops the 400 would still
  be silently losing every due time on read.
- **Risk:** Medium. This DTO is read on every to-do item with a due time across the whole app. Test both
  directions.

## FW4. `DataTable`/`BasicTable` need a definite-height flex parent, and nothing says so

- **Scope:** **[framework]**, **docs only** — `src/_common/docs/components.md`, the *Data tables* section;
  optionally a one-line comment above `DataTable.vue:7`. Submodule commit, then pointer bump.
- **Closes:** nothing filed. It exists so the *next* `F12` does not happen: `tracking-settings/X1` cost a
  blocker grade, three screenshots, an `elementFromPoint` investigation and a wrong framework hypothesis,
  all for a missing `flex-fill`.
- **Root cause:** `DataTable.vue:7` renders `VDataTableServer` with `height="0"` — the fill-parent trick
  described under `F12` — and `BasicTable.vue:2` wraps it in `h-100`. That is a **contract on the
  consumer**: the table must sit in a flex column whose height is definite all the way up, or its body is
  0 px tall and its rows are laid out but invisible and un-clickable. `components.md:204-258` documents
  props, slots, emits and formatters and says nothing about layout. Seventeen consumers got it right by
  copying a sibling; the two that did not are the only ones that broke.
- **What to change:** One paragraph in `components.md` under *Data tables*: the table fills its parent and
  scrolls internally (that is why headers are sticky), the parent chain must therefore be definite-height
  flex columns, `flex-fill` on the wrapper plus `class="flex-1-1" style="min-height: 0"` on the table is
  the shape to copy (`ActivityTable.vue:42-43`), and the symptom of getting it wrong is "the row is in the
  a11y tree but not on screen". **Do not change the default** — a self-sizing body would drop sticky
  headers app-wide, and per batching rule 4 that is a decision, not a docs fix. If the maintainer wants a
  guard, a dev-mode `console.warn` when the wrapper measures 0 px after mount is the shape; file it as a
  separate ask.
- **Verification:** Read-through; the sentence names the symptom a future unit agent will see.
- **Risk:** None — docs only. Two repos, two commits, in order.

## FW5. `DataTable`'s default row actions render the internal slug as their `title`, not the localized label

- **Scope:** **[framework]** `src/_common/component/dataTable/DataTable.vue:83` — submodule commit, then
  pointer bump
- **Closes:** `activity-settings/B4`
- **Root cause:** Confirmed by direct read. `TableAction` is `(name, text, color, variant, icon,
  onClick)` (`TableAction.ts:1-10`); `BasicTable.vue:175,177` constructs the defaults as
  `new TableAction('edit', t('general.edit'), …)` / `('delete', t('general.delete'), …)`; and
  `DataTable.vue:83` binds `:title="action.name"` — the slug. **Its sibling already has it right:**
  `TableGrid.vue:130` binds `:title="action.text"`. Every app on the framework that uses `BasicTable`'s
  default actions ships `title="edit"` / `title="delete"` on every row, in every locale.
- **Not merged into `FW2`, deliberately.** `FW2` is two controls with *no* label; this is a control
  with the *wrong field* bound. Different cause, different fix, though nothing stops one submodule commit
  carrying both — say so in the commit message if it does.
- **Files:** `src/_common/component/dataTable/DataTable.vue:83`; `src/_common/docs/components.md` only
  if it documents the `title` (it need not gain a sentence for a one-character field name)
- **What to change:** `:title="action.text"`. Consider adding `:aria-label="action.text"` in the same
  line — `title` alone is an accessible name of last resort — but that is a small widening, not this
  finding.
- **Do not change:** `TableAction`'s field order or `BasicTable`'s constructors; `name` is the
  discriminator `TableGrid.vue:131` switches on (`action.name === 'edit'`).
- **Verification:** `B4`'s `Verify:` block — **but not on `/activity-settings/roles` once `F19` has
  landed**, because that table will no longer render the default actions. Use `/routine-settings`
  (`RoutineSettingsView.vue`, a `BasicTable` with default actions and `@onDelete`) or run this before
  `F19`. Both locales, per step 3 of the block.
- **Risk:** None. One field name, and the correct value is already what the sibling renders.

---

## Escalations (backend / outside this repo)

1. **Notification titles and bodies ignore the account locale** — `_shell/B1`. Still open, and **now
   confirmed on real data (2026-09-13)**. ~~Not re-testable on the current seed (zero notifications).~~ That
   was true of `e2e-v1`; the fixture now seeds six notifications across six kinds, and signed in as
   `primaryUser` — whose `locale` is **`EN`** — `/notifikacie` renders every title and body in **Slovak**:
   *"Blíži sa termín"*, *"Pripomienky"*, *"Obdobie sa čoskoro končí"*, *"Sústredenie skončilo"*. Only the
   fixture's own *"Testovacia notifikácia"* carries an English body, and its title is Slovak too.
   So this escalation rests on observed behaviour for the first time, not inference. Text is localized
   server-side at dispatch, so no `src/` change can fix it. The ask: resolve notification text
   against the recipient's locale preference at dispatch, or send a key + params and let the client resolve it.

2. **✅ RESOLVED 2026-09-13 (unit 10, round 4 — API source read) — it does not cascade; the delete is
   refused.** ~~Does deleting a routine time period cascade, and to what?~~ `RoutineTimePeriodConfiguration.cs:78-81`
   is `DeleteBehavior.Restrict` on `RoutineTodoListColl`; only `RoutinePeriodCompletion` cascades (its own
   history rows, nothing user-authored). The FK violation maps to a **409** (`DatabaseExceptionUtils.cs:26`
   → `EndpointHelper.cs:14`), pinned by `TodoListDeleteBehaviorTests.DeleteRoutineTimePeriod_WithItems_Returns409`.
   So CLAUDE.md's cascade rule does not apply and `BasicTable`'s inability to state a child count is moot
   *here* (the bypass of `useDeleteConfirmation` is still real, still framework, still a `FW` decision
   for a table whose delete *does* cascade — none found yet). What it left behind is the **message**: that
   409 rendered as *"changed by someone else — refresh"*, filed and fixed as `todo-routine/B9`, which is
   the one `todo-routine` item still awaiting a browser (*Needs verification*).

3. **✅ RE-SCOPED 2026-09-13 (same round) — a bounded design question, now a written ask, blocking
   nothing.** ~~A done-toggle advances `streak`/`lastCompletedAt` irreversibly, with no undo path.~~ Read
   against `RoutineResetService.UpdateItemStreak`: the increment is **once per cycle**, guarded by
   `AlreadyCountedThisCycle` and pinned by two tests, so repeated clicking cannot compound; `LastCompletedAt`
   moving is deliberate; the period-level streak is evaluated at reset from live state, so un-ticking
   before rollover costs nothing there. The irreversible part is exactly **+1 on one item, once**. Whether
   un-ticking inside the same cycle should give it back is
   `prompts/view-docs/backend/B9-routine-untick-streak-decision.md` (a decision, not a defect — not to be
   confused with finding `B9`). The client cannot act on it either way: streak fields are server-owned.

4. **✅ RESOLVED 2026-09-13 — the `activity` contract is settled; what remains is a client-side parse bug.**
   `prompts/view-docs/backend/_done/B6-profile-grid-activity-name.md` (now in `_done/`) carries the full
   answer. All three questions this entry raised are closed:
   - `activity.role.icon` / `activity.role.color` **is** the intended home — nested, not flattened. `category`
     is the same shape and is **nullable**. So **`F3`'s fallback is the permanent fix, not a shim**, and its
     direction is the server's own: `category?.icon ?? role.icon`, `category?.color ?? role.color`.
   - **All four grids agree.** Every one derives from `WithActivityResponse` and carries a full
     `ActivityResponse`, on both `…/grid` and `…/{id}`.
   - **`activity` does *not* carry `categoryName`.** Use `activity.category?.name ?? null`. The flat
     `{id, name, categoryName, icon, color}` shape still exists, but only on `/leisure/suggestion/draw`
     (`/leisure/pick`) — two different shapes under the same key, by route.

   **The client half is now fixed too (2026-09-13) — see `F3`.** `ActivityInfo.fromJson` reads the flat
   fields first and falls back to `category ?? role`, so it parses the grid shape and the draw shape with one
   code path. Still true and still worth heeding: `usageCount`, `canDelete` and `isOnTodoList` are
   structurally present on the nested activity but **left at their defaults** — do not read them off these
   rows.

   One behavioural consequence worth not designing against: an **archived** activity removes the row entirely
   from the three `Activity*Profile` grids (count included), while `memory-anchor` deliberately keeps its row
   and name. There is no such thing as a row with a blank or missing `activity`; treat one as a bug.

5. **✅ RESOLVED 2026-09-13 — `B7` answered in full; it leaves three client-side items, all in `src/`.**
   `prompts/view-docs/backend/_done/B7-grid-sort-key-audit.md`. §1 was fixed **by shape rather than by a
   remap** — `activity.name` resolves natively on all four profile grids, so the *Activity* header click on
   `memory-anchor/grid` no longer 500s, and the `activity.name → activityName` remaps were **deleted**
   (safe: bookmarked `?sortBy=activity.name:asc` URLs carry the key that now resolves natively). What lands
   on this side:
   - ✅ **FIXED 2026-09-13 — `BacklogTable.vue:11`.** Now `deleteConfirmationColumn="activity.name"`. This
     needed a **framework** change to work at all: `BasicTable.vue:211` indexed the row flat, so it resolves
     through `getNestedValue` now. Dotless keys are unaffected. See `F3`.
   - ✅ **Already satisfied — error handling distinguishes `400` from `500`.**
     `ErrorHandlingFunctions.ts:11` has had its own `case 400` all along, separate from `case 500`, so an
     unresolvable sort key (`InvalidSortKeyException` → `InvalidSortKeyMiddleware`) surfaces a snackbar rather
     than the old false empty state. **No change was needed**; verified by reading the switch, not in a
     browser.
   - ⏳ **Latent, no action taken: if a lookup column is ever made sortable, send `locationType.text`, not
     `locationType`.** None is currently sortable, so nothing to change today — this is a trap for the next
     person who makes one sortable.

     ⚠️ **And it is a worse trap than the API's reply implies.** Probed against the running API
     2026-09-13 on `activity-backlog-profile/grid`: `zzzNotAColumn` → **400** naming the key;
     **`locationType` → 500** (`errorId be94ee6d327f`); `locationType.text` → **200**. So the
     "unresolvable keys are 400 now" fix covers *unrecognised* keys only, **not keys that resolve to a
     non-scalar member** — which is precisely what a real column definition would emit. That case is still
     an opaque 500 behind a false empty state.

     **Re-probed and confirmed at the B2 close-out (2026-09-13, after the deploy):** `locationType` →
     **500** `errorId 13ae656a28ee`, `activity` → **500** `errorId 28962860a3af`, while `locationType.text`
     and `activity.name` → **200** and `energyDemandId` (a field present in every row but not sortable) →
     **400**. So this is not "B2's class is narrower than reported" — B2 *is* fixed for the class it names.
     This is a **second, distinct unhandled 500**, and B2's close-out reply names it in advance: *"If you see
     `errorId` in a body, that is still an unhandled 500 and is a different bug — report it."* Still not
     filed as a new ask here (the close-out runbook reserves that for the surface owner), but it is now an
     invited one, and this paragraph is the evidence to paste into it.

   Two smaller notes for whoever writes the specs: `activity` is **nullable** on the two tracker mapping
   grids, so an `activity.text` sort puts those rows nulls-last ascending / nulls-first descending — correct,
   not a bug. And the API flagged an **honest test gap**: its integration tests pin `periodKey` only as the
   sole sort key, so the multi-key splice (`[{rating,desc},{periodKey,desc}]` must order by rating first) is
   right by construction but unasserted. B7 §4's two-click combinations are the cheapest place to catch a
   regression, which makes this an **e2e ask on our side**, not a backend one.

6. **The activities grid filter's id fields have never matched between client and server** —
   `activity-settings/B1`. **Not** "the backend ignores `roleIds`/`categoryIds`", which is how the
   finding reads: those fields do not exist on the wire. Read at the source this pass:
   `ActivityFilterRequest.cs:27-28` declares **`RoleId: long?`** and **`CategoryId: long?`** —
   singular scalars — and `GridActivityEndpoint.cs:129-133` filters on them with `==`. The client has
   sent **`roleIds: number[]`** / **`categoryIds: number[]`** since at least the August module
   restructure (`git log -S roleIds` bottoms out at `540f9529`, 2026-08-07, with the list shape already
   in place), and no commit on either side has ever carried the other's name. System.Text.Json drops
   unknown members silently, so every id-filtered request has always returned the unfiltered list with
   a 200 and nothing anywhere said so. `A1-correctness-sweep.md` item 5 fixed the *binding* (the
   combobox now reaches the request body — the finding confirms that) and verified the request, never
   the rows.

   **This is a contract decision, not a one-side fix**, and the client cannot make it alone without a
   UI regression: the filter is a multi-select combobox with chips, and the URL state already carries
   comma-joined lists (`activitySettingsUrlParams.ts:67,69`), so narrowing the client to one id means
   changing the control, the param names and the bookmarks. **The ask:** add `RoleIds: long[]?` and
   `CategoryIds: long[]?` to `ActivityFilterRequest` and filter with `Contains` — two `Where` clauses,
   with the singular fields kept (or dropped, nothing on this side sends them). Then an integration test
   that pins the filter *field names*, since the failure mode here is a silent 200 and no test on either
   side could have caught it. Until it lands, `F18` should still be applied — it fixes what the client
   *sends*; this is about what the server *reads*.

7. **A time period's `lengthInDays` is unique per account, and the API says so as a bare 409 from the
   database index** — `todo-routine` round 5, found in passing while setting up `B9`'s retest. Confirmed
   at the source this pass: `RoutineTimePeriodConfiguration.cs:79` is
   `HasIndex(t => new { t.UserId, t.LengthInDays }).IsUnique()`, so a second 7-day or 30-day period is
   refused — round 5 hit it twice, body *"Unique constraint violation during Create"*, status 409. The
   client cannot tell that 409 from the concurrency one or from `B9`'s referential one:
   `ErrorHandlingFunctions.ts:23-25` switches on status alone and the body is never read, so the user is
   told *"This record was changed by someone else. Refresh the page and try again."* — and `TimePeriodForm`
   has already closed (`openAddDialog` awaits `openDialog` *then* calls `createWithResponse`,
   `RoutineSettingsView.vue:134-143`), so the typed form is gone with it. Two asks, in order of value:
   - **Validate it, don't let the index throw.** The endpoint already returns a 400 naming the field for
     other rule violations (`{"timePeriodId":["Time period not found."]}` is what round 5 saw on the item
     create), so a `lengthInDays` uniqueness check in the validator would surface as a normal field error
     the form can render inline, with the dialog still open. That is the same shape the create validator
     uses today, and it makes the client fix trivial.
   - **Carry the error *type* in the 409 body**, which is `B9`'s own "worth raising upstream" note: the
     server distinguishes `DbConcurrencyError` from `DbForeignKeyError` from `DbUniqueViolationError`
     (`DatabaseExceptionUtils.cs:16,25,27`) and flattens all three to a status code at the boundary. With the type on the wire, the framework's
     interceptor could word each correctly once, and `B9`'s per-call-site `_silent` pattern would not need
     copying to every endpoint that can answer 409 for a non-concurrency reason. This one is a framework
     change on the client side too (`ErrorHandlingFunctions.ts`), so it is a two-repo ask.
   The client-side half — what to do at this call site until either lands — is under *Needs verification*
   below, because the message on screen has not actually been observed; only the 409 has.

## Needs verification (unverified findings, and what would settle each)

### Awaiting retest — code-fixed this cycle, never seen in a browser

Not a fix batch and not a defect list: these need one browser session running the named `Verify:` blocks.
**Rewritten in the fifth pass against `todo-routine`'s round 5** (2026-09-13, live, fresh `e2e-v3` seed):
five of the eight rows are closed, and what is left is two half-checks and one finding that has never
been seen in either direction.

| finding | what landed | round-5 outcome |
| --- | --- | --- |
| `todo-routine/A1` | counter carries `:title`/`:aria-label` on both branches; native `<button>` (`todo-lists/B6`) | ✅ **verified.** Real `mousemove` → 1 s dwell → `elementFromPoint` → `mousedown`/`mouseup` on both controls: *Increase 0 of 2* hit its `<button class="counter-increment">` and produced 1/2 (`PATCH …/toggle-is-done {forceValue:true}` → 204, no dialog); *Decrease 1 of 2* resolved to the decrease button on two separate items. The "mouse can decrement but never increment" hypothesis is dead against this build |
| `todo-routine/B3` | `RoutineToDoListForm.vue:28` → `routineTodoList.timePeriod` | ✅ **verified** — label *Time period*, console clean across the open |
| `todo-routine/B4` | `/routine-settings` + `TimePeriodForm` localized; `useAnchorDayOptions()`; `Intl.PluralRules` ordinal | ✅ **verified in SK** — *Časové úseky*, *PRIDAŤ*, all headers, *Pondelok* in the anchor column; ordinal `1` → "1." (SK) and `1`/`21` → "1st"/"21st" (EN). **One header stayed English — "Color" — and that is `F25`**, a different cause (empty title, not a literal) |
| `todo-routine/B6` | `routineTodoList.streakTooltip` / `.gracePeriodActive` | ✅ **verified in SK** — *"Séria: 12 · najdlhšia: 30"* read off the teleported tooltip. Undo-tooltip half not re-hovered; its label is the same computed `A3` verified |
| `todo-routine/A3` | `TodoListUndoBtn.vue:12` `:aria-label="label"` | ✅ **verified** — `aria-label: "Nothing to undo"` on the disabled button; enabled-state wording not exercised |
| `todo-routine/P1` | fixed `:width`/`maxWidth` replaced by a `minWidth` floor | ⏳ **EN half verified** (*Total count* in full, room to spare). **SK half not run** — the session was re-scoped back to EN mid-check. *Celkový počet* is the longer label and the one this finding was about; one dialog open in SK settles it |
| `todo-routine/A2` | `BaseTodoListItemSteps.vue:11-13` `:title`/`:aria-label`/`:aria-expanded` | ⏳ **source-only, still.** The fresh seed has no stepped routine item, so nothing to inspect without creating one. One temporary item with two steps, one `find` on the chevron, delete it |
| `todo-routine/B9` | `RoutineSettingsView.vue:163-201` — `_silent` 409 → `deleteBlocked` / `deleteBlockedUnknownCount`, count fetched only in the failure path, row kept | ❌ **not verified — three attempts, all lost to a concurrent reseed** (the period vanished on a plain reload between attempts). Neither the defect nor the fix has ever been seen on screen. **How to run it:** exclusive access to the account (no other unit running); create a period with `lengthInDays` **not** in {1, 7, 30, 365} — the unique index (§7) rejects the seeded lengths; create one routine item in it; delete the period; read the snackbar and confirm the row stays. It is the one `todo-routine` item still on this list for a reason other than locale |
| *(unfiled)* | `TodoListStepsFormField.vue`'s four step controls now named, position-qualified | ⏳ not swept in round 5 — `main button, main a.v-btn` on the Add dialog with steps, expect `0` unnamed |
| `todo-lists/B3` | ✅ **fixed for real 2026-09-13** — it was *not* fixed silently: the round-2 edit moved the emit above the multi-count branch, so a row-body click on a counted item still stepped the counter *and* opened the dialog | closed; `Status:` line corrected; spec pins it |

### ⚠️ Found in the fifth pass: the create/edit path on `/routine-settings` has the 409 defect `B9` fixed for delete

Source-certain, **UI unobserved** — round 5 recorded the API's 409 twice (*"Unique constraint violation
during Create"*, on a 7-day and a 30-day period) but not what the snackbar said, so this stays out of a fix
batch under rule 5. The code path has one outcome, though: `openAddDialog` / `openEditDialog`
(`RoutineSettingsView.vue:133-161`) call `createWithResponse` / `update` with **no `_silent`**, the
interceptor maps every 409 to `httpErrors.conflict` (`ErrorHandlingFunctions.ts:23-25`, status only, body
ignored), and the dialog has already closed (`TimePeriodForm.vue:108-111` does `dialogApi.close(...)` on
confirm and the view awaits the request *after* that). So a user who adds a second 30-day period sees
*"This record was changed by someone else. Refresh the page and try again."* and their form is gone. Same
root cause as `B9`, one function up in the same file — `B9`'s fix is call-site-scoped and this is the
adjacent call site it did not reach.

**What would settle it:** one attempt to create a 7-day period on the seeded account; read the snackbar
(no cleanup needed — it fails). **If confirmed, it is a low-effort app batch next run**, and two things about
its shape are worth deciding from here rather than in that session:

- The message is easy — the `_silent` + `status === 409` branch `B9` already wrote, with a new
  `routineTodoList.timePeriods.lengthTaken` key ("A period of {n} days already exists"). But the **form
  should survive the failure**, and that means moving the request *inside* the dialog's confirm: `useDialogApi`
  has `onConfirm(handler)` + `setLoading()` for exactly this (CLAUDE.md, `useDialog`), and `TimePeriodForm`
  already registers `onConfirm` — it just closes immediately instead of awaiting. Same shape for edit.
- A client-side pre-check against `timePeriods` *is* possible here — the view holds the whole list
  (`fetchAll()`, `:114`), not a page — and it would be a reasonable inline hint. But it is not the fix: the
  rule is the server's, and a pre-check that passes still has to handle the 409 for the race it cannot
  see. Handle the 409 first; add the hint only if §7's first ask (a 400 naming `lengthInDays`) is declined.

### ⚠️ Found while triaging unit 6: `BasicTable`'s delete-confirm dialog never closes after Confirm — probably app-wide

Source-only, unobserved, and **not filed by any unit** — flagged here because it is the highest-leverage
one-minute check in this queue. `BasicTable.vue:218-224`'s `confirmDelete()` sets `deleteLoading = true`
(which disables the Confirm button), emits `onDelete`, clears `itemToDelete` — and **never sets
`deleteDialog = false`**. `MyDialog` does not close itself on `confirmed` either (`MyDialog.vue:66,118-121`
— only the Cancel button and a non-persistent Escape touch the model), and `deleteDialog` is private to
`BasicTable`, so none of the eight `@onDelete` consumers can close it (`RoutineSettingsView.vue:163-179`,
`LookupEditTable.vue:110-120`, the four leisure tables, the two activity tables — read all eight). `TableGrid.vue:426-432`
is the same shape, and it also still does the flat `deleteConfirmationColumn` lookup that `F3` fixed in
`BasicTable` only (`:421`). Submodule history (`git log -S` on `deleteDialog.value = false`) shows the close
was never there.

If this is right, every confirmed delete through a framework table leaves the dialog open with a disabled
Confirm button until the user finds Cancel. **Nobody in this sweep has yet confirmed a `BasicTable` delete
in a browser**: unit 10 cancelled (`todo-routine/B5` "Clicked CANCEL (not Confirm)"), unit 13 did not
delete, unit 2 opened the dialogs and cancelled (`activity-settings/B7`, "deliberately did **not** click
Delete"), unit 6 could not reach the button (`X1`). That is how a defect this visible survives four units.

**Fourth-pass note:** `F19` moves the Roles and Categories tables off `BasicTable`'s built-in dialog onto
`useDialog().confirm()`, so they will stop being evidence either way — the remaining default-action
consumers are `RoutineSettingsView`, `LookupEditTable` and the four leisure tables (the latter now
`deleteConfirmationColumn`-correct after `F3`). The one-minute check below is unchanged.

**Fifth-pass note: still unobserved after `todo-routine`'s round 5, which is the round that should have
settled it.** `B9`'s retest *is* this check — a Confirm on `/routine-settings` — and all three attempts
were lost before reaching the trash icon (see the `B9` row above). So the count is now **five units** and
one retest round without a confirmed `BasicTable` delete. The two checks share a setup; **run them as one**:
the throwaway period `B9` needs is the row this needs, and the `B9` verify block already ends with "the
period is still listed afterwards", which is a stronger reading of the same screen. One more wrinkle for
the `B9` half specifically: `onDelete` there is `async` and awaits the delete *and* a `fetchGroupedByTimePeriod`
before the snackbar, while `confirmDelete` has already emitted and cleared `itemToDelete` — so if the dialog
does stay open, it will be open with a disabled Confirm *behind* the `B9` error snackbar, and a tester reading
only the snackbar will pass `B9` and miss this. Look at the dialog, not the toast.

**What would settle it:** on `/routine-settings`, create a throwaway time period through the app's own API
(the mutating-spec rule; `lengthInDays` not in {1, 7, 30, 365} — §7), click its trash icon, click **Confirm**,
and read whether the dialog is still on screen once the row is gone. If it is, this is a **framework batch**
(`FW6` next run — `FW5` was taken by the fourth pass): either `confirmDelete`
closes the dialog immediately, or the emit carries a way for the parent to close it after the async delete
resolves — the existing `deleteLoading` flag suggests the second was the intent and was never finished.
That is a design decision for `vue_framework`, not a per-consumer workaround; do not add
`:key` remounts or a `v-if` toggle around `<BasicTable>` in `F13` to hide it.

### `activity-settings` — four `unverified`, of which two are settled from source

| finding | what settles it | note |
| --- | --- | --- |
| `U1` — the *"no archived activities"* empty-state copy | one look at `/activity-settings/activities?archived=archived` signed in as the **`secondaryUser`** (the `secondaryPage` fixture), if that account seeds no archived activity — check `e2e/.state/seed.json` first rather than assuming | Seed-data shape, not a defect. If the second account also has one, it needs a throwaway account or a `test.fixme` naming this row |
| `U2` — what a Delete on a system/referenced role or category does server-side | **settled from the API source this pass**, no browser needed: a role → **409** with a user-readable message on both the `systemKey` and in-use paths (`DeleteActivityRoleEndpoint.cs:42-62`); a category → **204**, and every activity under it has its `categoryId` set to `null` (`DeleteActivityCategoryEndpoint.cs` is a bare `BaseDeleteEndpoint`, FK `SetNull` at `ActivityConfiguration.cs:42`). Neither path deletes an activity or its history | `F19` is built on this answer. The unit's caution about the seed's system roles was well placed for the wrong reason — a role delete could never have destroyed them; a *category* delete on the seed would have silently unfiled ten activities |
| `U3` — repeated 401 → `/refresh` 401 → sign-out | **re-graded** to a runbook error, mechanism source-verified (token rotation, 5 s grace) — see `F23` and *Contradictions* §19 | Not an app defect and not retestable as one; the fix is the paragraph, and the proof is the next parallel run keeping both sessions |
| `U4` — one *"0 of 0"* on an unfiltered request | retest after **`F18`**: reload, type a name, clear it, three times, and read `itemsCount` off the response body each time | `F18` removes the only competing request this view fires, which is the only candidate mechanism the finding names. Checked `useFetchFilteredTable.ts:47-55` this pass: an aborted call defers to `latest`, so the simple "stale response overwrote the fresh one" story does not hold as written — if it recurs *after* `F18`, capture the response body, because the cause is then somewhere this queue has not looked |

### `tracking-settings` — two items that `F12`/`F13`/`F14` will surface, not close

| finding | what settles it | note |
| --- | --- | --- |
| `tracking-settings/U1` — the mapping delete button reaches nothing | run its *What would verify it* after `F12` **and** `F13` land: a `DELETE …/tracker-desktop-mapping-by-pattern/{id}` fires and the row is gone after reload | Kept `unverified` per rule 5, but it is source-certain (`DesktopMappingsTable.vue:36` declares only `edit`; `BasicTable`'s `hasDelete` default renders the button anyway). `F13` wires it; the retest also answers the dialog question above |
| *(unfiled)* sidebar highlights *Desktop tracking* on the Mappings tab, nothing on `/activity-settings/roles` | one look at the sidebar on each route, before and after `F14` | `SidebarNavItem.vue:52` uses the same `matchesPath` as the breadcrumb, so `F14`'s data fix closes both; it must be *checked*, not assumed, because the `VBtn :to` in the header toggle is a second active-state mechanism on the same screen |

### The multi-count counter is probably unreachable by a real mouse — and the last queue's "contradiction" resolves

> ✅ **CONFIRMED AND FIXED 2026-09-13** — filed as `todo-lists/B6`. `hover` → 600 ms → `click` on the 2/5 bar
> hit `button "Znížiť: 2 z 5"` and produced **1/5**, exactly as hypothesised. `TodoListItemCounter.vue` is now
> two always-present buttons (a native `<button>` around the bar, a small minus below it), both
> keyboard-operable — which also discharges the `todo-routine/A1` caveat below, since the routine list renders
> the same component. Retesting it surfaced a second defect, `todo-lists/B5`: counter steps were never
> persisted unless they flipped `isDone` (the API's `toggle-is-done` + `forceValue` is a ±1 step for counted
> items; the client only sent the last one). Also fixed.
>
> **Independently corroborated from `/routine-todo-list` in `todo-routine`'s round 5**, with the synthetic-event
> artefact this section worried about explicitly ruled out: a real `mousemove`, a 1 s dwell, an
> `elementFromPoint` read, then `mousedown`/`mouseup` — not `.click()` — landed on `Increase: 0 of 2` and
> produced 1/2, and on `Decrease: 1 of 2` resolved to the decrease button on two separate items. Screenshot:
> `todo-routine/screenshots/routine-todo-list--round5-counter-hittest.png`. **This section is closed**; it
> stays for the audit trail.

The last run filed this as an unresolvable contradiction: `TodoListItemCounter.vue`'s `VHover` renders the
decrement button under `isHovering` and the increment target under `v-else`, so a mouse must already be
hovering to click — yet `todo-lists/U2`'s round-3 retest recorded a `playwright-cli` click **incrementing** a
fresh 2/5 item. **Those two facts do agree**, and the explanation is the tool: Playwright synthesises
mousemove/mousedown/click in one burst, and Vue's re-render is asynchronous, so the `v-else` branch is still
mounted when the click lands. A human mouse dwells, the swap happens, and the click hits the minus button.
**Working hypothesis: a mouse user can decrement but never increment.** Re-graded from "needs a browser check
to resolve a contradiction" to "needs a browser check to confirm a probable `bug`" — one minute of work:
hover the counter, wait 500ms, then click, and read which of `minus`/`increment` fired.

Two things follow if it confirms, neither covered by any batch above:

- the fix is a hit-target change (one control with two zones, or a modifier-click), not a label change;
- the round-3 a11y fix put `:aria-label="increaseLabel"` on a `VProgressLinear`, i.e. a `progressbar` that is
  **not keyboard-focusable and is not a button**. Naming it satisfies the automated sweep while leaving the
  increment action unreachable by keyboard as well as by mouse. Check `Tab` reaches it before declaring
  `todo-routine/A1` verified.

### ✅ SETTLED 2026-09-13 — the grid sort-key fix is deployed, and units 11, 12 and 16 are off the blocked list

Probed directly against the running API (signed in as the seed's `primaryUser`, fixture `e2e-v3`).
`POST /api/activity-backlog-profile/grid` with `sortBy: [{"key":"activity.name","isDesc":false}]` → **200 with
rows**, and so does every other key these views send: `activity.name` on all three profile grids (plus
`activity.role.name` and `activity.category.name`), `periodKey` **and** `activity.name` on `memory-anchor/grid`,
`nextOccurrence` and `nextOccurrenceAt` on `reminder-dashboard/my-upcoming`. Unrecognised keys are now a
**400 naming the key**, not a 500.

The fix shipped is **not** the remap the old notes describe — that was replaced. `prompts/view-docs/README.md`
Class 1, its blocker table, `UNIT-ORDER.md` Wave G and the `B2` ask itself have all been rewritten to match,
and `B2` has moved to `prompts/view-docs/backend/_done/`.

**Two app-side items fall out of it,** neither blocking any unit:

| item | what | where |
| --- | --- | --- |
| `nextOccurrence` → `nextOccurrenceAt` | `/pripomienky/moje` sorts by the compatibility alias. The API accepts it on all three reminder reads *so the three stop disagreeing*, and asks us to migrate so it can be dropped. `/pripomienky/register` already sends the correct key | reminders module, framework — `_common/modules/reminders` |
| table error state ≠ empty state | The table renders its empty state for a **failed** request, so a 400 and a genuinely empty list are indistinguishable on screen. This is what turned one backend bug into three separately-filed tickets. `ErrorHandlingFunctions.ts` already snackbars a 400 (see §5 above) — what is missing is the state *in the table* | `_common/component/dataTable` |

#### ⚠️ Found while probing that endpoint: `/pripomienky/moje` parses a row shape the server does not send

Not filed as an ask, and **not** part of B2 — but unit 16 was blocked until today, so nobody has driven this
screen with rows in it, and whoever runs 16 will hit it in the first minute. Measured 2026-09-13,
`POST /api/reminder-dashboard/my-upcoming`, `useFilter: false` — the row carries exactly:

```
ownerModule, kind, templateKey, scheduleType, nextOccurrenceAt, id
```

`UpcomingReminderGridResponse.fromJson` (`src/_common/modules/reminders/dto/response/`) reads
**`json.nextOccurrence`**, which is not there, so the *Next occurrence* column and each row's `:dueAt` are
`null` on every row. It also reads `subjectType`, `subjectId`, `status`, `intervalPreset`, `cronExpression`,
`hasLeadOffsets` and `recipientCount` — none of which this projection sends — while ignoring the
`templateKey` it does send. Whether the right fix is a wider projection server-side or a narrower personal-view
DTO client-side is a contract question for unit 16 to raise, **not** a rename to apply blind. Note it is the
same field the B2 close-out asks us to migrate in `sortBy` (`nextOccurrence` → `nextOccurrenceAt`); the two are
one change, and doing the `sortBy` half alone fixes nothing visible.

This is in the **framework submodule** (`src/_common`), so it is a two-repo commit — see CLAUDE.md.

### Seed-data gaps — one ask, two findings

**The routine half is now a written ask:** `prompts/view-docs/backend/B8-routine-streak-history-seed.md`
(2026-09-13, open). `todo-routine`'s round 4 confirmed from the seeder source that it is unreachable **by
construction** — `E2eFixtureSeeder` writes item-level streaks only and seeds zero `RoutinePeriodCompletion`
rows — and sharpened the ask: `getMilestoneIcon` reads `item.streak`, not `bestStreak`, so the fixture's
`BestStreak = 30` reaches none of its five branches, and the client **fabricates** heatmap cells via
`mockHistory()` when `completionHistory` is empty and `totalPeriodsElapsed > 0`, which is why `B8` asks for
real rows rather than a counter. Do not re-file `U1`/`U2`; attach browser observations to `B8`.

| what to seed | unblocks |
| --- | --- |
| ≥1 routine time period with `totalPeriodsElapsed > 0` and non-empty `completionHistory` — **`B8`** | `todo-routine/U1` (weekly review card), `todo-routine/U2` (personal bests, heatmaps, consistency/trend) |
| ≥1 routine item with `streak >= 30` (ideally 90/180/365 too) — **`B8`** | `todo-routine/U2` (milestone icons — the seed's best is 12) |
| ≥1 **routine** item with steps (the `todo-lists` fixture has them; the routine groups do not — round 5: "Take Medication, Weekly Review, Pay Rent have no steps") | `todo-routine/A2`'s live check and the unfiled `TodoListStepsFormField` sweep, both read-only today. Low priority — a temporary item does the same job; worth one line on `B8` if it is reopened anyway |
| enough desktop mappings to exceed one page (>25, or a smaller page size in the spec) | `F12`'s second verification step — that the Mappings body *scrolls inside the card* rather than merely paints. Two seeded mappings (one `Activity`, one `Ignored`) can prove the row paints; they cannot prove the fill-parent contract still holds. Low priority: `ActivityTable` already exercises the same path with 10 rows |

Also worth naming for unit 13's own sake: the projects seed holds **one** row, which is why `F2`'s
under-rendering consequence could not be observed and why the board's grouping was only seen with one
occupied column. Two or three projects across all three readiness statuses would make that view actually
testable.

### Carried forward, unchanged

- ~~**`todo-lists/U1`**~~ — ✅ re-graded 2026-09-13 to *settled, superseded by B4/FW3*, both of which are
  closed; the whole banner flow is pinned by four tests in `todo-motivation.spec.ts`.
- **`home/U1`** — widget error/retry states never seen against a real failure. Force a 500 on one of the six
  widget endpoints (`playwright-cli route`) and confirm only that widget shows its error/Retry state, the
  other five are unaffected, and Retry re-fires.
- **`_shell/U1`** — snackbar stacking. Trigger two snackbar-worthy actions in quick succession.
- **`_shell/U2`** — fullscreen-loading strand. Navigate away *during* a slow request under throttling.

## Deferred to opportunities

**`leisure-projects/O1` — the first genuinely open `opportunity` finding of the sweep.** Every
`activity-project-profile/grid` row carries `activity.isOnTodoList` and nothing in `src/` reads it; combined
with the `materialsNeeded` already rendered on `NeedsShopping` cards, it is the raw material for the
shopping-list-to-todo handoff `P1-readiness-board.md` asked this module's author to either build or decline in
writing. Neither happened. Two separable pieces of work, and only the second is an opportunity:

- **the written decline is a small docs chore, not a feature** — `migration-revision.md` has no entry, which
  is the gap `P1` point 4 was trying to prevent. Someone should write the paragraph regardless of whether the
  feature is ever built.
- **the feature itself** goes to `docs/opportunities.md` at Phase 4, where it can be weighed against the
  cross-module map rather than decided from inside one view. Note the constraint when it is: writing through
  `core/todoList`'s `api/`/`dto/` only, per CLAUDE.md's cross-module rule.

**`tracking-settings/O1` — a mapping's `isActive` is filterable, displayed, and editable nowhere.** Both
mapping request DTOs carry it, both grids show it as a column and offer it as a filter, and neither the
create form nor `edit()` binds a control to it — so a rule can only be disabled by deleting it. Goes to
`docs/opportunities.md` at Phase 4. Two notes for when it is weighed: (1) the cheapest shape is an inline
toggle on the `isActive` column, which is a `BasicTable` `#item.isActive` slot plus a `patch` — the
`useEntityCommand` base already has `batchedToggle` for exactly this; (2) it is worth nothing until `F12`
lands, because the column it would live in is currently invisible.

**`activity-settings/O1` — role and category icons are picked in the forms, sent by the API, rendered in
the activity picker, and shown in neither settings table.** Confirmed from the column lists
(`ActivityRoleTable.vue:58-62`, `ActivityCategoryTable.vue:58-63` — Name/Text/Color, no icon) and the
wire (`GridActivityRoleEndpoint.cs` projects `Icon`). Goes to `docs/opportunities.md` at Phase 4 as a
small one. One note for when it is weighed: the cheapest shape is folding the icon into the existing
`#item.color` swatch cell (a `VIcon` inside the `VSheet`) rather than a fifth column, which keeps the
row width — and it is the same cell `F21` may already be touching on the categories table, so the two
could ship together if `F21` lands first.

`todo-lists/O1` remains `resolved` (round 4). No other open opportunity findings exist across the seven
units triaged.

## Contradictions & re-grades

Everything below was checked against the **current working-tree source** this pass, by reading the file named.

### Contradictions

1. **`prompts/view-docs/backend/B6` is stale for `/leisure/projects`.** Its screenshot block shows the project
   card rendering `—` where the activity name belongs, and its point 5 asks the server to say whether it chose
   a flat `activityName` or a nested `activity`. Unit 13's evidence answers it: the name renders, and the
   response body carries a nested `activity` object (with `role` inside it). **Closed 2026-09-13** — the ask
   was updated in place and moved to `prompts/view-docs/backend/_done/B6-profile-grid-activity-name.md`, with
   the stale screenshot block struck. All three previously-open parts are answered; see *Escalations* §4 for
   the client-side parse bug it left behind.

2. **`prompts/view-docs/README.md`'s Class-1 blocker table is stale for unit 13, and probably for 11/12/16.**
   It lists `/leisure/projects?view=table` as a 500 on `sortBy: activity.name`; unit 13 rendered the table with
   exactly that sort in the URL. Strongly indicated, not proven — the one confirming request is in *Needs
   verification*. This is the single highest-leverage check in this queue: it gates three units.

3. **`leisure-projects/B2`'s suggested fix would not pass `leisure-projects/B2`'s own `Verify:` block.** A
   second `useFetchFilteredTable` instance separates the `AbortController`s (closing the correctness half) but
   still leaves two requests per filter change, and the pass condition says "exactly one". Re-graded: the
   *finding* stands as filed, the *suggested fix* does not. `F2` names a shape that satisfies both halves.

4. **`leisure-projects/A3` is a contrast defect, not a naming one** — the buttons already carry
   `:title="$t('enums.readinessStatus.…')"` at `ProjectReadinessBoard.vue:138`. Severity `a11y` is right
   (WCAG 1.4.11), but it does **not** share a root cause with `A1`/`A2` and must not be batched with them.
   Split into `F5`.

5. **`leisure-projects/P1`'s root-cause guess is wrong.** It says "same shape as A1 — a `_common` component
   issue", and A1 is a missing `aria-label`. P1 is broken attribute inheritance from a multi-root template,
   which is unrelated, and its cheapest correct fix is **app-side** (delete four dead attributes), not a
   submodule commit. Re-graded from an implied framework batch to `F6`, app-side. The finding itself stands.

6. **The counter hit-testing "contradiction" was not a contradiction** — see *Needs verification*. Re-graded
   from "two pieces of evidence disagree" to "one probable bug plus a Playwright artifact", with a one-minute
   confirmation. This also puts a caveat on `todo-routine/A1`'s retest.

7. ~~**`todo-lists/B3`'s `Status:` still reads `open` while the code is fixed**~~ — **this contradiction was
   itself wrong** (resolved 2026-09-13). The counter's own buttons did bypass `itemClicked`, but
   `itemClicked()` emitted *before* its `isMultipleCount` branch and then called `progressClicked()`, so a
   click on the row body of a counted item did both — which is B3's own repro. Three runs read the comment
   and not the control flow. Fixed for real (row body = log time only; counter = its own buttons only),
   `Status:` corrected, spec pins it.

8. **Unfiled, source-verified, belongs to a unit that hasn't run:** `BacklogTable.vue:11` passes
   `deleteConfirmationColumn="activityName"`, but `ActivityBacklogProfile` exposes `activity: ActivityInfo`
   and no flat `activityName`, and `BasicTable.vue:211` does a flat property lookup. So `/leisure/backlog`'s
   delete confirmation should read *"Are you sure you want to delete undefined?"*. This is the **third** call
   site to hit `BasicTable`'s `item.id`/missing-column fallback (after `RoutineSettingsView`, fixed, and
   `ProjectTable`, which passes no column at all and therefore shows a bare id). `todo-routine/B5`'s "Not
   changed, deliberately" note called that framework default "a poor framework-wide default" and left it;
   with three call sites it is now worth a framework batch of its own — it needs `getNestedValue` support as
   well as a better fallback. **Not batched here**: no unit owns it yet, no browser evidence exists, and unit
   11 runs next. `F3` names the one-line half a fixing session can take safely.

9. **`tracking-settings/X1`'s root-cause guess is wrong in kind, and its inference from the evidence is
   backwards.** The finding says *"more likely a stacking/paint-order issue than a clip, since the row's own
   `getBoundingClientRect` still returns plausible coordinates"* and floats a framework-wide `BasicTable`
   defect. `getBoundingClientRect` reports layout, not visibility — a clipped element keeps its rect, which
   is exactly why `elementFromPoint` at that rect finds the ancestor. The actual cause is `DataTable.vue:7`'s
   `height="0"` fill-parent contract meeting the only two consumers whose root lacks `flex-fill`
   (`DesktopMappingsTable.vue:2`, `AndroidMappingsTable.vue:2`; the working sibling
   `DesktopDistinctEntriesTable.vue:2` has it). **Severity stays `blocker`** — the view's core action is
   unreachable — but the batch is app-side and two attributes long (`F12`), and the framework half is a
   documentation gap (`FW4`), not a code defect. The finding's supporting remark that the Android
   `VCardText` lacks `flex-fill` is also a non-issue: Vuetify's `.v-card-text` is `flex: 1 1 auto` already.

10. **`tracking-settings/B1`'s suggested fix would not pass `tracking-settings/B1`'s own `Verify:` block.**
    Both suggested shapes (a Filter button calling `mappingsTable.load()`, or a deep `watch(mappingFilter)`)
    would fire a request — and the pass condition is *"with the updated filter"*, which neither delivers:
    `formData.activityId` is never copied into `mappingFilter.activityId`, and the pattern text lives on the
    view's `filter` object, not on `mappingFilter` (`DesktopMappingsTable.vue:59-69`). Three dead paths, not
    two. The finding stands; `F13` names the shape that satisfies the pass condition. Same pattern as
    Contradiction 3 — the unit agents are reliably right about *what* is broken and reliably one step short
    on *why*.

11. **`tracking-settings/B2` and `activity-settings/B6` are one defect** (`matchesPath` prefix-matching
    against a nav `to` that names a single tab), reported from two units as two different symptoms — a
    *wrong* crumb on one, a *missing* crumb on the other. Both root-cause guesses were correct. Merged into
    `F14` even though `activity-settings` is otherwise untriaged this run, per the duplicate rule; the
    `activity-settings` unit's option 1 ("register all three tab paths in `navItems.ts`") is not available —
    `MenuItem` has no `hidden` flag, so extra entries would render in the sidebar — and its option 2 is a
    framework batch. `F14`'s family-path-plus-redirect shape is the third option neither unit named.

12. **`tracking-settings/P1` is a finding about CLAUDE.md, not about the app, and the finding says so
    itself.** It reads the two documents together and concludes they agree. Kept as `polish` and given a
    docs-only batch (`F17`) rather than dropped, because the same sentence has now cost two units a
    check (`_routes.md`'s orphan table sent unit 10 after `/routine-settings` for the same reason) and
    will cost every remaining unit with a "settings" route the same detour.

13. **The `BasicTable` delete dialog** — see *Needs verification*. Not a contradiction between units; a
    contradiction between what eight call sites assume (`onDelete` → the dialog goes away) and what the
    component does (nothing). Unobserved because no unit has confirmed a delete. Raised here because it
    would change how `F13` is verified, and it is the kind of thing this document exists to notice.

14. **`activity-settings/B1` names the wrong defect.** *"The server ignores `roleIds`/`categoryIds`"*
    implies fields that exist and are unread. They do not exist: `ActivityFilterRequest.cs:27-28` has
    `RoleId`/`CategoryId`, singular, and always has. The finding's evidence is exactly right (id filter →
    unfiltered 200, name filter → works) and its root-cause guess is right in effect and wrong in kind —
    which matters, because "unread field" invites a one-line server fix and "different contract" is a
    decision about a multi-select UI. Escalation §6 carries the corrected ask. Severity `bug` stands.
    **Also a contradiction with the `A1` prompt's own close-out**, which marked item 5 fixed: the client
    half was, the feature never was.

15. **`B2` and `B3` are one defect**, and the unit half-knew it (`B3`: *"same mechanism as B2"*). Merged
    into `F18`. What the unit could not see: `useLookupTable.ts:38-52` already carries a guard written
    against precisely this writer, and its comment describes the combobox watcher by name. The guard
    compares JSON and `null` ≠ `[]`. So this is the second time the write-back has been noticed and the
    first time it is being removed rather than filtered.

16. **`B7`'s suggested fix would have disabled every delete button on both tables, and is wrong for
    categories even once that is fixed.** (a) `Role.fromJson`/`Category.fromJson` never read
    `canDelete` — `!item.canDelete` is `!undefined`. (b) `ActivityCategoryResponse.cs:26-31` documents
    category `canDelete` as *advisory* over a `SetNull` FK, existing so the grid can *say what a delete
    reclassifies*; the role endpoint enforces its flag with a 409, the category endpoint does not exist
    as a guard at all. Copying the Activities table's disabled-button pattern onto categories blocks a
    designed operation. `F19` gates roles and cascade-confirms categories. **Severity stays `bug`** but
    the category half is the graver one: today, one click plus a generic *"Are you sure?"* silently
    unfiles every activity in a category — on the seed, *"Errands"* would take ten — which is the case
    CLAUDE.md's cascade rule was written for. The unit graded the two tables as one symptom; they are
    one missing parse and two different consequences.

17. **`B5` is filed against the wrong scope.** The finding's suggested fix (widen `:tab(…)?` with a
    `beforeEnter`) treats it as an activity-settings route problem. `src/` has no catch-all route
    anywhere, so `/foo` renders the same blank pane. Re-scoped to an app-wide batch (`F20`); the
    per-family fix is rejected in the batch's *Do not change*. Severity `bug` stands — a blank page with
    no message is a bug wherever it is.

18. **`U2` is not unverified — it is answerable without a browser**, and was answered this pass from
    `DeleteActivityRoleEndpoint.cs`, `DeleteActivityCategoryEndpoint.cs` and
    `ActivityConfiguration.cs:34,42`. Re-graded to *settled from source*; the browser step is optional
    and `F19`'s verification covers it. The unit's refusal to click Delete on a system role was the
    right call for a unit agent, and the answer (409, nothing lost) shows the risk was on the other
    tab all along.

19. **`U3` is not an app defect and not unverified — it is a runbook error with a source-verified
    mechanism.** The finding's own hypothesis (b) is exactly what `JwtService.cs:38` +
    `RefreshTokenService.cs:35` do; hypothesis (a) cannot produce a 401 on `/refresh`. Re-graded from
    `unverified` to a docs-only batch (`F23`) — batching rule 5 keeps unverified *defects* out of fix
    batches, and this is a wrong sentence in `README.md` that has already cost one unit its session.
    The parallelism paragraph it corrects was written before the seed endpoint existed and has been
    wrong since the API started rotating.

20. **`A1`'s suggested fix (`:title` on the trash button) would produce two tooltips**, because the
    `VTooltip` on the wrapping `<span>` (`ActivityTable.vue:132-136`) already provides the visible one.
    Finding stands as `a11y`; the remedy is `aria-label`. Folded into `F19` rather than its own batch
    because `F19` copies that exact slot into two more tables — see `F19`'s "why `A1` is in this batch".

21. **`todo-routine/B10` is four times the size the finding says.** It names two call sites in
    `RoutinePeriodTimeline.vue`; a grep for `toLocaleDateString(undefined` finds **eight in five files**,
    all routine components in the same module (`RoutineGroupHeatmap.vue:120`,
    `RoutineGroupHistoryBody.vue:163`, `RoutineStreakFreeze.vue:69`, `useStreakFreeze.ts:88` on top of
    the two). Same cause, same fix, one batch (`F24`). The finding's severity (`bug`) and expectation
    (CLAUDE.md *Localization*) both stand. Worth saying why round 3 missed it while fixing B4/B6 on the
    same screens: that pass hunted string **literals**, and this class produces real text in every locale
    — there is nothing to grep for except the API call itself. The next localization sweep should grep
    `toLocale*(undefined` and `toLocale*([]` as well as `\$t(`.

22. **`B10`'s suggested fallback — `formatLocalized` from `_common/utils/DateTimeHelper.ts` — would
    invert the bug, not fix it.** The finding offers it "if it covers this shape". It is
    `dayjs(date).locale('sk').format(format)` (`DateTimeHelper.ts:102-103`), and every other formatter in
    that file is the same hardcoded `'sk'` (`:73-107`). A helper named *localized* that always speaks
    Slovak is a framework gap in its own right — one that would bite any consumer app running in EN —
    but it is unfiled, unobserved in a browser, and out of this pass's scope. Recorded here so `F24`'s
    fixing session does not reach for it, and so a `migration-revision.md` line gets written by whoever
    next touches that helper.

23. **`B4`'s round-5 verification note buries a finding it declined to file.** *"One column header is
    still English — Color … noted here rather than filed."* Re-graded from an aside to a `polish` batch
    (`F25`): it is the last unlocalized string on a screen whose finding is marked *fixed and verified*,
    the fix is one argument, and the locale key already exists. A verified-fixed status line that carries
    a known residual is how the residual gets lost — better a trivial batch than a footnote.

24. **`B9`'s fix is narrower than `B9`'s own root cause.** The finding correctly diagnoses *"409 has
    exactly one message across the whole app, and it is written for the optimistic-concurrency case"*,
    then fixes exactly one call site — the delete. The **create and edit** paths in the same file hit the
    same mapping for a different 409 (`UserId + LengthInDays` unique index, round 5, twice), with the
    added cost that the dialog has already closed. Not a contradiction in the finding, a contradiction
    between its stated cause and its applied scope. The finding stands; the adjacent call site is under
    *Needs verification* (rule 5 — the API 409 was observed, the on-screen message was not) with its batch
    shape pre-written, and the systemic answer is *Escalations* §7.

25. **`todo-routine` round 5 ran a mutating retest concurrently with other units, against the runbook's
    own rule, and the runbook could not have warned the agent.** *Parallelism* says mutation passes are
    serial; the round's environment note lists a `trkset` and an `activity-settings` session alongside it,
    three `B9` attempts lost to reseeds, and two `todo-lists` fixture rows toggled by clicks meant for
    another tab. The unit agent's diagnosis was right and its remedy (`-s=todo-routine`) worked — but
    `PROMPT-TEMPLATE.md` never mentions `-s=`, so the next agent starts on the shared `default` browser
    too. That is the fourth pass's `F23` (a *different* sharing mechanism — the refresh-token file), grown
    rather than duplicated. **This pass hit the same class on `_fix-queue.md` itself**: the fourth pass was
    writing its batch bodies when this one read the file, and the first edit failed on a stale read. Two
    triage passes on one file is the same operator error as two mutation passes on one account.

26. **The fourth pass's `F23` and the third pass's *Awaiting retest* caveat on `A1` are both overtaken
    by round 5's evidence and are corrected in place, not contradicted.** The `A1` row read *"the
    reachability question got worse, not better"* — written before `todo-lists/B6` made the bar a native
    `<button>` and before round 5 drove it with a real mouse; it now reads *verified*. `F23`'s own claim
    (rotation → 401 on `/refresh`) is untouched; round 5 saw a different symptom (a period vanishing on
    reload) with a different cause (reseed), which is why it is an addition to `F23` and not a counter-example.

### Re-grades

| finding | was | now | why |
| --- | --- | --- | --- |
| `leisure-projects/A3` | `a11y`, implied batch with A1/A2 | `a11y`, **own batch** (`F5`) | Contradiction 4 — contrast, not naming |
| `leisure-projects/P1` | `polish`, framework-shaped guess | `polish`, **app-side** (`F6`) | Contradiction 5 |
| `leisure-projects/A1` | own framework finding | merged into **`FW2`** with `_shell/A2` | Same cause, same repo, one commit |
| *(counter hit-testing)* | unresolved contradiction | ✅ confirmed `bug`, **fixed 2026-09-13** as `todo-lists/B6` | Contradiction 6 |
| `todo-lists/U1` | unverified | ✅ **settled 2026-09-13**, superseded by `B4`/`FW3` (closed) | Its own round-3 note settles it; the failure was `FW3` |
| `todo-routine/A1` | code-fixed, awaiting retest | code-fixed, **keyboard reach now real** — the bar is a native `<button>` (`todo-lists/B6`) | The label used to land on a non-focusable `progressbar` |
| `tracking-settings/X1` | `blocker`, framework-shaped guess | `blocker`, **app-side** (`F12`) + docs-only framework note (`FW4`) | Contradiction 9 — a missing `flex-fill`, not a paint bug |
| `tracking-settings/B1` | `bug`, two dead paths | `bug`, **three** dead paths; suggested fix rejected (`F13`) | Contradiction 10 |
| `tracking-settings/B2` + `activity-settings/B6` | two findings, two units | merged into **`F14`** | Contradiction 11 — one matcher, one nav `to` shape |
| `tracking-settings/B3` | `bug`, filter only | `bug`, **filter + page + sort** (`F15`) | Same CLAUDE.md rule names all of them; one edit |
| `tracking-settings/P1` | `polish`, "flag either way" | `polish`, **docs-only batch** (`F17`) | Contradiction 12 |
| `tracking-settings/U1` | `unverified` | `unverified`, **source-certain**, wired by `F13`, retested after `F12` | Rule 5 keeps it out of the batch; the code path has no other possible outcome |
| `activity-settings/B1` | `bug`, "backend ignores the fields" | `bug`, **escalation §6** — a contract that never matched | Contradiction 14 |
| `activity-settings/B2` + `B3` | two findings | merged into **`F18`** | Contradiction 15 — one writer, two symptoms |
| `activity-settings/B7` | `bug`, one fix for both tables | `bug`, **two behaviours in one batch** (`F19`); suggested fix rejected | Contradiction 16 — DTO gap + advisory vs enforced |
| `activity-settings/A1` | `a11y`, own fix | `a11y`, folded into **`F19`**; `:title` → `aria-label` | Contradiction 20 |
| `activity-settings/B5` | `bug`, activity-settings scope | `bug`, **app-wide** (`F20`) | Contradiction 17 |
| `activity-settings/U2` | `unverified` | **settled from source**, answered inside `F19` | Contradiction 18 |
| `activity-settings/U3` | `unverified` | **docs-only batch** (`F23`), mechanism source-verified | Contradiction 19 |
| `activity-settings/U4` | `unverified` | `unverified`, retest **after `F18`** | The finding's own candidate cause is what `F18` removes |
| `todo-routine/A1`, `B3`, `B4`, `B6`, `A3` | code-fixed, awaiting retest | ✅ **verified in a browser** (round 5; B4/B6 in SK) | Rows closed in *Awaiting retest* |
| `todo-routine/B10` | `bug`, 2 call sites / 1 file | `bug`, **8 call sites / 5 files** (`F24`) | Contradiction 21 |
| *(unfiled — `B4` round-5 note)* | aside inside a verified finding | `polish`, **own trivial batch** (`F25`) | Contradiction 23 |
| `todo-routine/B9` | code-fixed, listed nowhere in this queue | code-fixed, **awaiting retest**, never observed either way; its create/edit sibling is source-certain under *Needs verification* | Contradiction 24; the retest is merged with the `BasicTable` dialog check |
| `todo-routine/P1` | awaiting retest, both locales | **EN verified**, SK half outstanding | Round 5 was re-scoped mid-check |
| `todo-routine/A2` | awaiting retest | still source-only — no stepped routine item in the seed | Seed-data table gains a row |
| `todo-routine/U1`, `U2` | `unverified`, seed gap | `unverified`, **filed as backend ask `B8`** | Round 4 confirmed the gap is by construction |
| *Escalations* §2 | open backend question | ✅ **resolved** — `Restrict` → 409, no cascade | Round 4 API read; the message half became `B9` |
| *Escalations* §3 | open data-integrity escalation | **re-scoped** to a bounded design question, backend ask `B9-routine-untick-streak-decision.md` | Round 4: once-per-cycle guard, tested; +1 is the whole cost |
| *(counter hit-testing)* | ✅ fixed | ✅ fixed **and corroborated with a real mouse from the routine list** | Section closed |

### Findings this triage did not challenge further

`leisure-projects/B1`, `B2`, `B3`, `A2` — each re-verified directly against source this pass (see the batches)
and they stand as filed, with `B2`'s *fix* amended per Contradiction 3. `home/B1`, `B2`, `B3` — re-verified by
targeted source check (`flex-wrap: nowrap` at `WidgetCard.vue:151`; zero `loading` in `NowBar.vue`; no third
`defineStore` argument in `homeUiStore.ts`), unchanged. `_shell/A1`, `A2`, `A3`, `P1`, `B1` — re-verified
(`persistent = true` at `MyDialog.vue:86`; no label on `AppTopBar.vue:11`; zero `skip` in `App.vue`; no
`useSetBreadcrumbExtra` in `TodoListView.vue`), unchanged. `todo-lists/B4` — re-verified against `Time.ts`,
unchanged.

`tracking-settings/B4` — stands as filed; the truncation is visible in the unit's own 1440×900 screenshot
read from disk this pass, and the header `div` at `DesktopSettingsView.vue:7` has no wrap. `B3` — stands;
`useMappingSettings.ts:33` is a bare `ref`. `O1` — stands; grep confirms no template binds `isActive`
outside the two filter rows. The unit's tally line (1·4·0·1·1·1) matches its body — the first unit in the
sweep whose count needed no correction.

`activity-settings/B4` — stands as filed, one-line read (`DataTable.vue:83`), and the finding's root-cause
guess and suggested fix are both exactly right; `FW5`. `P1` — stands, and the server's own doc comment
confirms the aggregate is by design; `F21`. `P2` — stands on the unit's screenshot; the row at
`ActivitySettingsView.vue:12` has no wrap and its children no `min-width`; `F22`. `O1` — stands. `U1` —
stands as a seed-shape gap. The unit's tally line (0·7·1·2·1·4 = 15) matches its body; the previous
queue's "sixteen" was this document's error, not the unit's.

`todo-routine` (fifth pass) — `B10` stands as filed, grown (Contradiction 21); its evidence is a
screenshot on disk (`routine-todo-list--round5-sk-default.png`) plus a source read that this pass repeated.
`B9` stands — `RoutineSettingsView.vue:163-201` matches its "Fix applied" paragraph line for line, and the
locale keys (`deleteBlocked` with SK plurals, `deleteBlockedUnknownCount`) are present in both files; the
finding's own honesty about being unobserved in either direction is the reason it is not called *fixed*
here. `B1`, `B2`, `B5`, `B7`, `B8` — verified in round 2b, unchanged, not re-read. The unit's round-5
tally paragraph matches its body: five closures, one new finding, one blocked retest, and the counter
question closed. Its round-history table is the most complete in the sweep — five rounds, each with the
commit or working-tree state it ran against — and is the reason this pass could be done from disk.

### Coverage tracker note

`docs/views/_routes.md`'s coverage tracker still shows **units 13 `leisure-projects`, 6 `tracking-settings`
and 2 `activity-settings` as ☐** despite their documents being on disk. Units 1, 9 and 10 were ticked
earlier; these three need the same. `units/06-*.md`, `units/02-*.md` and `units/10-*.md` are in
`units/_done/` (the first two staged, the third untracked); `units/13-*.md` still is not. Not a code defect —
flagged for whoever next touches that file, since the tracker's whole purpose is to prove nothing was
skipped. `F14`'s two redirect routes and `F20`'s catch-all will change `_routes.md`'s record count from
53 to 56 when they land.
