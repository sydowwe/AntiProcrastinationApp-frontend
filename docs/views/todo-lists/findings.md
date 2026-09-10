# todo-lists — findings

> Pass: inventory · captured 2026-09-09 · commit `acd7db0d`

**Tally:** blocker 0 · bug 2 (both fixed + verified) · a11y 2 (both fixed + verified) · polish 1 (fixed + verified) ·
opportunity 1 · unverified 3

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-09 | `acd7db0d` | initial inventory pass |
| 1a | 2026-09-10 | `acd7db0d` | backfilled `Status:` / `Verify:` / `Root cause guess:`; renumbered `B3` → `U3` (its severity was `unverified`, which had also double-counted it in the tally as a bug) |
| 2 | 2026-09-10 | working tree | **fix pass** — B1, B2, A1, A2, P1 code-fixed. `npm run type-check` 0 errors, `npm run lint` 0 errors. O1/U1/U2/U3 untouched (seed-data / mutation-pass work, not code). |
| 2a | 2026-09-10 | working tree | **browser verification** on `https://localhost:3000`, EN locale, signed in. All five `Verify:` blocks executed — see each finding's *Verified* line. Two follow-ups came out of it: a layout fix to B1's new alert, and **five more nameless icon controls on `/todo-list/:id`** that A1's `/todo-list`-scoped sweep never covered (recorded under A1). |

---

### B1. Invalid list id throws an unhandled console exception with no visible error state
- **Status:** fixed and verified (round 2 / 2a)
- **Severity:** bug
- **Where:** `/todo-list/999999` → `src/core/todoList/view/TodoListView.vue:126`, the `onMounted` call to
  `fetchByIdNamedList(todoListId)` (via `useEntityQuery`/`useRequestState`)
- **Expected:** A 404 on the list fetch should surface *something* to the user — an error state, a redirect, or
  at minimum a caught rejection — per plain user sense and the general pattern of `_silent`/error-snackbar
  handling documented in CLAUDE.md's `_common/api/` section.
- **Actual:** The fetch throws, is not awaited with a catch, and produces an unhandled promise rejection logged
  to the console (`AxiosError: Request failed with status code 404`, plus Vue's "Unhandled error during
  execution of mounted hook at `<TodoListView>`"). The UI degrades silently to the same "No tasks" empty state
  used for a legitimate empty list — a user who mistypes or follows a stale link sees no indication anything
  went wrong; only the list title area is blank (no name, no icon) where a real list would show one.
- **Evidence:** `docs/views/todo-lists/screenshots/todo-list-id--invalid-id.png`; console line:
  `[EXCEPTION] AxiosError: Request failed with status code 404` at
  `.../src/core/todoList/view/TodoListView.vue:126:26` via `useEntityQuery.ts:16` / `useRequestState.ts:17`;
  network: `GET /api/todo-list/999999` → 404. Reproduced twice.
- **Repro:** 1. Sign in. 2. Navigate to `/todo-list/999999`. 3. Open devtools console — see the AxiosError and
  the unhandled-mounted-hook message. 4. Observe the page itself shows "No tasks" with no error indicator.
- **Verify:** 1. Navigate to `/todo-list/999999`. 2. **Pass condition:** the console contains no `AxiosError`
  and no "Unhandled error during execution of mounted hook" entry, **and** the page renders an explicit
  not-found state (or has redirected to `/todo-list` with an error snackbar) — not the generic "No tasks"
  empty state. 3. Then navigate to `/todo-list/1` and confirm a valid list still renders its name, icon and
  items normally.
- **Note:** flagged in advance by the `_shell` pass and reproduced here as this unit's own finding.
- **Suggested fix:** Catch the `fetchByIdNamedList` call specifically (it's the one genuinely-missing-entity
  fetch, unlike the items fetch which legitimately returns an empty array), and either redirect to `/todo-list`
  with an error snackbar or render an explicit "list not found" state instead of the ambiguous empty-list copy.
- **Fix applied (round 2):** `TodoListView.vue` — added a `loadFailed` ref and a try/catch/finally around the
  mount load. Four changes: (a) the two fetches are now ordered list-then-items, so a 404 short-circuits before
  the ambiguous `[]`; (b) the rejection is caught and turns into `loadFailed`, which renders a `VAlert`
  not-found state with a "to the lists" button, modelled on `PlannerTaskLinkView.vue`; (c) `loadFailed` is
  seeded from `!Number.isFinite(todoListId)`, so `/todo-list/abc` never issues a request at all; (d)
  `hideFullScreenLoading()` in the `finally` — the axios error branch never hides the overlay, so the failure
  path used to leave it up. The 404 snackbar still comes from the interceptor; this only owns what stays on
  screen. New keys: `toDoList.namedList.notFoundTitle` / `notFoundText` / `toLists` in both locales.
- **Verified (2a):** `/todo-list/999999` renders "This list doesn't exist" with the not-found copy, a "TO THE
  LISTS" button and the interceptor's 404 snackbar. `/todo-list/1` still renders its name, progress and all 8
  items. **Vue's "Unhandled error during execution of mounted hook" is gone**, which was the actionable half.
- **One caveat on the pass condition:** an `AxiosError: Request failed with status code 404` line *does* still
  appear in the console — but it is the framework interceptor's own deliberate `console.error('ERROR: ', error)`
  (`axiosConfig.ts:173`), which logs **every** error response app-wide, handled or not. Silencing it is a
  framework decision about global logging policy, not this view's to make. The finding's "no `AxiosError` in
  the console" wording was too strict; read it as "no *unhandled* rejection", which does now hold.
- **Follow-up fix during verification:** the first render had the `VAlert` stretched to the full column height
  (the flex `VCol` defaults to `align-items: stretch`), leaving the title floating mid-page and the append
  button stranded at the top. Added `align-start`.

### B2. `iconPicker.icon` / `iconPicker.selectIconPlaceholder` render as raw i18n keys in the English locale
- **Status:** fixed and verified (round 2 / 2a)
- **Severity:** bug — **[framework]**
- **Where:** `TodoListForm` (list create/edit) and `TodoListCategoryForm` (category create/edit) icon-picker
  field, backed by `src/_common/component/inputs/IconPicker.vue`; the missing mirror belongs in
  `src/locales/common.en.ts`
- **Expected:** With the account's language set to English, every field label should resolve to English text,
  per CLAUDE.md's i18n rules and the same expectation raised as the `_shell` pass's B1 for notification content.
- **Actual:** The icon-picker field's label renders literally as `iconPicker.icon`, and its placeholder as
  `iconPicker.selectIconPlaceholder` — both raw, untranslated keys. Console confirms:
  `[intlify] Not found 'iconPicker.icon' key in 'EN' locale messages.` and the same for
  `selectIconPlaceholder`. Verified independently: `iconPicker` appears only in
  `src/_common/_locales/common.sk.ts:594` and is referenced from `src/locales/SK.ts:26` — it is absent from
  `src/locales/common.en.ts` and `EN.ts` entirely.
- **Evidence:** `docs/views/todo-lists/screenshots/todo-list--edit-list-dialog-icon-key-leak.png`; console lines
  `[intlify] Not found 'iconPicker.icon' key in 'EN' locale messages.` and
  `[intlify] Not found 'iconPicker.selectIconPlaceholder' key in 'EN' locale messages.`, each reproduced twice
  (list edit dialog and category create dialog).
- **Repro:** 1. Set locale to English. 2. Go to `/todo-list`. 3. Click the pencil (edit) icon on the "Default"
  list, or the "+" to add a category. 4. Observe the icon-picker field's label.
- **Verify:** 1. With locale EN, open `/todo-list` → edit the "Default" list. 2. **Pass condition:** the
  icon-picker label reads as English prose, not `iconPicker.icon`, and the console logs no
  `[intlify] Not found 'iconPicker.*'` warning. 3. Cancel, click "+" to add a category, and confirm the same
  in that dialog. 4. Also confirm `general.none` resolves (it was missing in the same console capture).
- **Root cause guess:** Missing locale mirror — this is the fourth instance of the documented
  `general`-namespace collision class (CLAUDE.md R5/R6/R11 cover `validation`, `general.undoSuccess`,
  `calendar`). Likely shares a fix batch with any other raw-key finding in this sweep.
- **Suggested fix:** Mirror `iconPicker.*` into `src/locales/common.en.ts` — the same remedy CLAUDE.md already
  prescribes for the three prior instances.
- **Fix applied (round 2):** Mirrored the whole `iconPicker` namespace (all 11 keys `IconPicker.vue` /
  `IconPickerDialog.vue` resolve, not just the two that leaked on this screen) into `src/locales/common.en.ts`,
  with the same explanatory comment style as the `calendar` mirror above it.
- **Also found while fixing:** the `general.none` in the verify step is worse than reported — it is missing from
  **both** app locales, not just EN. The framework defines it (`_common/_locales/common.sk.ts:171`) for
  `ColorPicker.vue` and `MyPdfViewer.vue`, and this app's `general` replaces the framework's wholesale, so SK
  rendered the raw key too. Added to `common.sk.ts` and `common.en.ts`. That makes this the **fifth** instance
  of the R5/R6/R11 collision class, and the first one that bit the primary locale.
- **Verified (2a):** with locale EN, the edit-list dialog and the new-category dialog both render the icon
  field's label as **"Icon"**, and a console sweep across `/todo-list`, `/todo-list/1`, the edit dialog and the
  category dialog returned **zero** `[intlify] Not found` warnings of any kind.

### A1. Five icon-only controls on `TodoListsView` have no accessible name
- **Status:** fixed and verified (round 2 / 2a) — **scope grew: 13 controls across two views, not 5**
- **Severity:** a11y
- **Where:** `/todo-list` — the category "+" add button, the category sort-direction toggle, the list
  sort-direction toggle, and the per-list-card edit (pencil) and delete (trash) buttons
- **Expected:** Per WAI-ARIA convention and consistent with the `_shell` pass's A2 finding on the sidebar
  toggle, every icon-only interactive control needs a name reachable by assistive tech — `aria-label`, `title`,
  or equivalent.
- **Actual:** A `document.querySelectorAll('main button')` sweep of this view found 5 buttons whose
  `textContent`, `aria-label` and `title` are all empty (only rendering a bare Vuetify `v-icon`). Contrast with
  the "NEW LIST" and mobile "Categories" buttons on the same view, which carry visible text.
- **Evidence:** JS console query (`Array.from(document.querySelectorAll('main button')).map(b => ({text, aria,
  title}))`) returned 5 entries with `text: "", aria: null, title: null` on `/todo-list`, matched positionally
  to the add-category "+", category sort toggle, list sort toggle, and the per-card pencil/trash on the
  "Default" card via `read_page`'s accessibility-tree refs.
- **Repro:** 1. Load `/todo-list`. 2. Inspect the "+"/sort/pencil/trash icon buttons in devtools. 3. Confirm no
  `aria-label`/`title`/text content on any of them.
- **Verify:** 1. Load `/todo-list`. 2. Run
  `Array.from(document.querySelectorAll('main button')).filter(b => !b.textContent.trim() && !b.getAttribute('aria-label') && !b.title).length`
  in the console. 3. **Pass condition:** returns `0`. 4. Spot-check that the names are localized (they change
  with the locale), not hardcoded English.
- **Root cause guess:** Same class as `_shell`'s A2/A3 and this unit's A2 — icon-only `VIconBtn` usage without
  a label. Seven such controls found so far across two units; batch them as one fix.
- **Suggested fix:** Add localized `aria-label` to each: e.g. `t('toDoList.category.add')`, `t('general.sort')`,
  `t('general.edit')`, `t('general.delete')` — most of these strings already exist for equivalent button text
  elsewhere and just need wiring to the icon-only variant.
- **Fix applied (round 2):** Added `:title` + `:aria-label` (matching the pair `BaseTodoListItem.vue`'s
  stopwatch button already used) to **eight** icon-only controls, not five — the sweep missed the three inside
  `.cat-item__actions`, which are `opacity: 0` until hover but are in the DOM and focusable throughout:
  - `TodoListsView.vue` — list sort toggle → `general.toggleSortDirection`
  - `TodoListCategoryPanel.vue` — both "+" buttons (desktop and mobile) → `toDoList.category.add`; the mobile
    close "×" → `general.close`; the category sort toggle → `general.toggleSortDirection`; the per-category
    pencil/trash → `` `${general.edit}: ${cat.name}` `` / `` `${general.delete}: ${cat.name}` ``
  - `TodoListCard.vue` — per-card pencil/trash, same name-qualified pattern
  The edit/delete labels carry the entity name deliberately: ten cards' worth of bare "Edit" is a list of
  identical names, which passes the automated check in `Verify:` while still being unusable.
- **New keys:** `general.toggleSortDirection` and `general.moreActions` (A2) in both `common.{sk,en}.ts`.
- **Also fixed in passing** (same files, plainly wrong, one line each — all three are CLAUDE.md i18n
  violations, not a11y): `TodoListsView.vue`'s hardcoded English `Categories` button →
  `toDoList.namedList.categories`; `TodoListCategoryPanel.vue`'s hardcoded `label="Hide empty"` switch → new
  `toDoList.category.hideEmpty`; `TodoListCard.vue`'s hardcoded `{done} / {total} done` progress line → new
  `toDoList.namedList.doneCount`.
- **Verified (2a):** the `Verify:` query on `/todo-list` returns **`0`** (9 buttons, 7 of them icon-only,
  all named). Names read `Close`, `New category`, `Change sort direction`, `Edit: Default`, `Delete: Default` —
  localized, and they follow the locale rather than being hardcoded.
- **Scope correction found during verification.** Running the same query on `/todo-list/:id` — which A1 was
  never scoped to, and which A2 only looked at the ⋮ on — returned **4** more nameless buttons, plus a 5th the
  query structurally could not see. All five are now fixed:
  - `TodoListToolbar.vue` — the back arrow. **The `main button` selector missed it entirely**: `:to` makes
    Vuetify render an `<a>`, not a `<button>`, so it was invisible to the audit that defined this finding.
    Anyone re-running the `Verify:` query as written will still miss controls of this shape — use
    `main button, main a.v-btn`. → `general.backToList`
  - `TodoListUndoBtn.vue` — the undo button. Also carried **two hardcoded English strings** (`` `Undo: ${…}` ``
    and `'Nothing to undo'`) in its tooltip. Now a single `label` computed that serves as both tooltip and
    `aria-label`. → `general.undo` (a *sixth* instance of the collision class — the framework defines it,
    this app's `general` replaced it) + new `general.nothingToUndo`
  - `BaseTodoListItemSteps.vue` — the steps expand/collapse chevron, ×3 on this list. Given
    `general.show`/`general.hide` qualified with the steps label, plus `aria-expanded`.
- **Re-verified after those:** `/todo-list/:id` now returns **`0`** unnamed across 36 controls with the widened
  `button, a.v-btn` selector.

### A2. The overflow-menu trigger (⋮) on each to-do item has no accessible name
- **Status:** fixed and verified (round 2 / 2a)
- **Severity:** a11y
- **Where:** `/todo-list/:id` — `src/core/todoList/component/BaseTodoListItem.vue`'s `ellipsis-vertical`
  `VIconBtn` (the per-row action menu trigger)
- **Expected:** Same standard as A1 — an icon-only trigger for a menu containing destructive actions (Delete)
  needs a discoverable name, arguably more so than most icon buttons given what it exposes.
- **Actual:** The button carries no `aria-label`/`title`/text; the menu items themselves (LOG TIME, ADD TO
  PLANNER, EDIT, DELETE, MOVE TO LIST) are properly labelled once open, but the trigger that opens them is not
  independently nameable via `read_page`'s accessibility tree.
- **Evidence:** `read_page` accessibility-tree dump of `/todo-list/1` shows the button rendering only a nested
  `img`/icon element with no adjacent text or `aria-label` attribute captured.
- **Repro:** 1. Load `/todo-list/1`. 2. Tab to or inspect the ⋮ button on any item row. 3. Confirm no accessible
  name.
- **Verify:** 1. Load `/todo-list/1`. 2. Inspect any item row's ⋮ button. 3. **Pass condition:** it exposes a
  localized accessible name (e.g. "More actions"), and the menu it opens still contains the same five entries.
- **Root cause guess:** Same batch as A1 and `_shell` A2/A3.
- **Suggested fix:** Add localized `aria-label` to the `VIconBtn` in `BaseTodoListItem.vue`.
- **Fix applied (round 2):** `BaseTodoListItem.vue:119` — `:title="general.moreActions"` plus
  `:aria-label="`${general.moreActions}: ${toDoListItem.activity.name}`"`. The title stays unqualified (a
  tooltip already sits next to the row it describes); the aria-label carries the task name, because in the
  accessibility tree every row's trigger is otherwise the same string. This also covers the routine list —
  `BaseTodoListItem` is the shared base for both kinds.
- **Verified (2a):** every ⋮ on `/todo-list/1` now exposes a distinct name — `More actions: Online Course`,
  `More actions: Grocery Shopping`, `More actions: Feature Development`, and so on through all 8 rows.

### P1. "Clear filters" only clears priority/due filters, not the full filter set
- **Status:** fixed and verified (round 2 / 2a) — and the repro the original pass never ran is now confirmed
- **Severity:** polish
- **Where:** `/todo-list/:id` — `TodoListFilters.vue`'s "Clear filters" chip, backed by
  `src/core/todoList/composable/useTodoListFilters.ts`'s `clearFilters()`
- **Expected:** A control labelled generically "Clear filters" reads, at a glance, as "reset everything I've set
  on this list" — plain user sense, especially once `hideDone` and `sort` are also visibly-active filter-like
  toggles on the same screen.
- **Actual:** `clearFilters()` resets only `filterPriorityIds` and `filterDueState`; `hideDone` and `sort` are
  untouched, and the chip does not appear at all unless a priority or due filter is active. A user with
  `hideDone` on and a due filter active who clicks "Clear filters" still sees completed items hidden
  afterward, with no indication that only some filters were reset.
- **Evidence:** **Source read only — not reproduced in the browser during this pass.** Code read of
  `useTodoListFilters.ts` (`clearFilters` body); the chip's conditional render is tied to
  `filterPriorityIds`/`filterDueState` only.
- **Repro:** *(not executed — see Evidence)* 1. Turn on "Hide done". 2. Click a priority chip. 3. Click "Clear
  filters". 4. Expect "Hide done" to still be on.
- **Verify:** 1. Open `/todo-list/1`. 2. Turn on "Hide done", then activate a priority filter. 3. Click "Clear
  filters". 4. **Pass condition:** either every filter including "Hide done" is reset, **or** the control's
  label names its narrower scope (e.g. "Clear priority & due filters"). Either resolution closes this.
- **Suggested fix:** Either rename the control or extend `clearFilters()` to reset `hideDone` and `sort` too,
  matching the broader label.
- **Fix applied (round 2):** Took the broaden-the-reset resolution, with one deliberate exclusion.
  `useTodoListFilters.clearFilters()` now resets `priorities`, `due` **and** `hideDone`; `sortMode` is left
  alone, because it reorders rather than hides and its own button always states the mode it is in — resetting
  an ordering under a "Clear filters" label would be its own surprise. A new `hasActiveFilters` computed
  (`priorities.length > 0 || due !== null || hideDone`) drives the chip's visibility, so the chip now appears
  whenever anything it would clear is active.
- **Root cause, which the finding did not have:** there were **two** `clearFilters` implementations. The
  composable's was dead code (defined, exported, never imported); the live one was a private copy inside
  `TodoListFilters.vue`, which cannot see `hideDone` at all — it lives in `TodoListTitleBar`. So the narrow
  behaviour was not a decision, it was the copy that could only reach two of the three. Resolved by deleting
  the component's copy: `TodoListFilters` now takes `hasActiveFilters` as a plain prop and emits `clear`, and
  `TodoListView` wires that to the composable. One implementation, and it is the one with access to all three.
- **Note:** `clearFilters` is now a **single** `router.replace` with all three query keys set to `undefined`.
  Three sequential setter writes would not have worked — each spreads `route.query`, which does not update
  synchronously, so the last write would resurrect the first two.
- **Verified (2a):** turning "Hide done" on alone now makes the chip appear at `?hideDone=true` — under the old
  behaviour it stayed hidden, which is the reported defect's other half. Adding a priority and a due filter
  gave `?hideDone=true&priorities=2&due=today`; **one** click on "Clear filters" returned the URL to a bare
  `/todo-list/1`, switched "Hide done" off, deselected both chip groups, hid the chip, and brought all 8 items
  back. `sort` was not in play (list was in `custom`), consistent with the exclusion above.

### O1. Estimate-vs-actual calibration is fully built but has no seed data to demonstrate it
- **Status:** open
- **Severity:** opportunity
- **Where:** `/todo-list/:id`, `src/core/todoList/composable/useEstimateCalibration.ts` +
  `POST /api/activity-history/aggregate-by-activity`
- **What exists:** The full frontend implementation of intent-source S3 (per-item chip, header ratio line,
  neutral framing) is in place and the backend contract has landed (confirmed 200 response with a real
  aggregate data structure). This is further along than the intent doc anticipated — S3 expected a possible
  backend gap and a contract-only ask file, and no such file exists in `prompts/_done/todo-motivation/backend/`,
  consistent with the backend already shipping.
- **What it could feed:** Nothing further on the frontend; this is a seed-data gap, not a product gap. Add ≥5
  items with a non-zero `suggestedTime` **and** matching activity-history entries so the path is exercised.
  Tracked in the runbook's *Test data* section as a seed requirement.

### U1. Overdue-renegotiation banner and bulk-reschedule / one-by-one review flow not exercised
- **Status:** open
- **Severity:** unverified
- **Where:** `/todo-list/:id` — `OverdueRenegotiateBanner.vue` / `useOverdueRenegotiation.ts`
- **What would verify it:** The "Default" list's seed data has zero overdue items (confirmed via the "Past due"
  filter chip returning "No tasks"), so the banner's `overdueItems.length >= RENEGOTIATE_THRESHOLD` condition
  never evaluates true. To verify: seed or create an item with a past `dueDate` and not done, reach the
  configured threshold, and confirm the banner appears with working "reschedule all" and "review one by one"
  actions.

### U2. Multi-count item counter's click behaviour on a fresh (0-progress) item was inconclusive
- **Status:** open
- **Severity:** unverified
- **Where:** `/todo-list/1` — `TodoListItemCounter.vue`, the "0/2" counter on the "Online Course" item
- **What would verify it:** A single click on the counter chip briefly showed a hover/pressed checkbox
  affordance but the count did not change and no `todo-list-item`/`api` network request fired — inconsistent
  with `progressClicked()`'s guard (`doneCount >= totalCount` no-ops, but `0 >= 2` is false, so a click should
  have incremented). Unclear whether the click landed on the intended hit target (the swap between "show count"
  and "show checkbox" on hover may move the interactive element under the cursor) or whether there is a real
  dead click. To verify: confirm via `read_page` exactly which element is hit-tested at that position, click
  precisely on it, and check network traffic immediately after. **The mutation pass should settle this** — it
  is allowed to change item state.

### U3. S3's per-item "usually Nm" chip and header calibration line could not be visually confirmed
- **Status:** open
- **Severity:** unverified
- **Where:** `src/core/todoList/component/BaseTodoListItem.vue` (per-item chip, gated on
  `toDoListItem.suggestedTime?.isNotZero()`) and `TodoListTitleBar.vue` (header line, gated on ≥5 comparable
  items via `useEstimateCalibration.calibrationRatio`)
- **What would verify it:** Both are implemented and the backing endpoint returns 200, but none of the 8 seed
  items in the "Default" list have a non-zero `suggestedTime`, so the per-item chip never renders and there
  were 0 comparable items for the header line (which needs ≥5). To verify: seed ≥5 items with both a
  `suggestedTime` and prior logged activity-history entries for the same activity, reload `/todo-list/:id`, and
  confirm both surfaces render with plausible values and neutral (non-scolding) wording.
- **Note:** the same seed gap as O1; fixing the seed resolves both.
