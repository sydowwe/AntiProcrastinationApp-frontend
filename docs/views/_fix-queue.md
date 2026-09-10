# Fix queue

> Built 2026-09-10 · commit `acd7db0d` (**working tree dirty** — see the warning below) · units triaged:
> `_shell`, `todo-lists` (9), `todo-routine` (10) · findings considered: 29 · batches: 13

> **⚠️ Read this before trusting any "already fixed" claim in this file.** `todo-lists`' round-2 fix pass is
> **uncommitted**. Every conclusion below about what is already fixed was verified against the *working tree*,
> not against `acd7db0d`. If those changes are ever stashed or discarded, `todo-routine/A3` and half of
> `todo-routine/B6` come back to life and this queue is wrong. Commit the todo-lists fix round before starting
> any batch here.

> **Status update 2026-09-10:** F1, F3, F5, F6 and F8 were fixed in one session (typecheck and lint both
> exit 0, **no browser verification** — their `Verify:` blocks are outstanding and belong to the retest round).
> F1's fix is **not** the one its finding suggested; see the correction recorded under `todo-routine/B1`.
> Everything else below is untouched.

## Summary

| batch | title | scope | findings closed | effort |
| --- | --- | --- | --- | --- |
| F1 | Checkbox / counter click opens the "Log time manually" dialog | app | `todo-routine/B1` | low |
| F2 | Multi-count counter: the increment target is unreachable by mouse, and unnamed | app | `todo-routine/A1`, `todo-lists/U2`, `todo-routine/A2` | med |
| F3 | Two disagreeing progress indicators in one routine group card | app | `todo-routine/B2` | low |
| F4 | The routine surface never went through the i18n pass | app | `todo-routine/B3`, `B4`, `B6` | high |
| F5 | Time-period delete confirmation names a raw id | app | `todo-routine/B5` | low |
| F6 | Reorder toggle never changes its label | app | `todo-routine/B7` | low |
| F7 | "Total count" label clipped in the Add dialog | app | `todo-routine/P1` | low |
| F8 | `/routine-settings` is missing from `/user/settings` | app | *(unfiled — see note)* | low |
| F9 | Icon-only controls the `todo-lists` A1 sweep never reached | app | *(unfiled — see note)* | low |
| F10 | No skip-to-content link | app | `_shell/A3` | low |
| F11 | Breadcrumb does not distinguish `/todo-list/:id` from `/todo-list` | app | `_shell/P1` | low |
| FW1 | `MyDialog` is `persistent` by default, so Escape closes nothing | **framework** | `_shell/A1` | med (decision first) |
| FW2 | Framework icon-only controls with no accessible name | **framework** | `_shell/A2` | low |

11 app-side · 2 framework · 3 escalations.

---

## F1. Checkbox / counter click opens the "Log time manually" dialog

- **Scope:** app-side `src/core/todoList/`
- **Closes:** `todo-routine/B1`
- **Root cause:** `BaseTodoListItem.vue` treats *any* click on the row as "the user wants to log time against
  this task" and emits `itemClicked` for it. The checkbox's `@click.prevent` suppresses the default but not
  propagation, so a checkbox click bubbles to the row's `@click="itemClicked"` and fires that emit as well as
  toggling `isDone`. Both list kinds wire that emit to the manual log-time dialog, so every checkbox click on
  every to-do list pops a dialog nobody asked for.
- **Files:**
  - `src/core/todoList/component/BaseTodoListItem.vue:10` — `<VListItem @click="itemClicked">`
  - `src/core/todoList/component/BaseTodoListItem.vue:27` — `<VCheckboxBtn … @click.prevent>`
  - `src/core/todoList/component/BaseTodoListItem.vue:294-312` — `itemClicked`, emit at `:305`
  - `src/core/todoList/component/BaseTodoListItem.vue:327-340` — `progressClicked`, **second emit at `:329`**
  - Consumers: `src/core/todoList/view/TodoListView.vue:110` (`@itemClicked="openLogTime($event, true)"`) and
    `src/core/todoList/component/routine/RoutineGroupCard.vue:61`
    (`@itemClicked="… emit('logTime', i, true)"` → `RoutineToDoListView.vue:88` → `openLogTime(item, true)`)
- **Scope correction the finding does not have.** B1 names `RoutineToDoListView.vue` as the consumer; the
  routine view never wires `@itemClicked` at all — the hop is `RoutineGroupCard.vue:61`. More importantly, B1's
  suggested one-line fix (`.stop` on the checkbox) **only closes the single-count half**. For a multi-count
  item, `itemClicked` returns early into `progressClicked()` (`:300-302`), and `progressClicked` emits
  `itemClicked` itself at `:329` — and `TodoListItemCounter` already has `@click.stop` on both of its
  branches, so no amount of `.stop` in the template reaches that path. The counter's own click therefore opens
  the log-time dialog too, by a route the finding never traced. Fix both emits or the bug half-survives.
- **What to change:** Decide *once* what actually should open the log-time dialog, and make both emit sites
  agree. The narrow reading — clicking the row *body* (title area) means "log time", clicking a control means
  "operate that control" — is the one the explicit "LOG TIME" overflow entry is consistent with. That means:
  add `.stop` to the checkbox at `:27`, and drop or gate the emit at `:329` so operating the counter does not
  also open a dialog.
- **Do not change:** the "LOG TIME" entry in the ⋮ overflow menu, or `@quickStartTimer` — both are deliberate
  and must keep working. Do not remove the row-body emit entirely without checking `TodoListView.vue:110`'s
  intent; clicking the task name to log time may well be the designed affordance.
- **Verification:** `todo-routine/B1`'s `Verify:` block, run on **both** `/routine-todo-list` and
  `/todo-list/1`, and extended: also click the "0/2"-style counter on a multi-count item and confirm no dialog
  opens there either (that half is not in the finding's verify block).
- **Risk:** Low, but this is the batch most likely to be a product-intent question rather than a bug. If the
  row-body click *is* meant to open log time, the fix is scoping, not removal.

## F2. Multi-count counter: the increment target is unreachable by mouse, and unnamed

- **Scope:** app-side `src/core/todoList/`
- **Closes:** `todo-routine/A1`, `todo-lists/U2` (**re-graded `unverified` → `bug`**),
  `todo-routine/A2` (**merged here, re-graded `a11y` → `unverified`; see Contradictions**)
- **Root cause:** `TodoListItemCounter.vue` renders its two behaviours as mutually exclusive branches of a
  `VHover`: the minus button when `isHovering`, the clickable progress bar when not.

  ```
  <VIconBtn      v-if="isHovering"  icon="minus" @click.stop="emit('minus')" />
  <VProgressLinear v-else                        @click.stop="emit('increment')">
  ```

  A pointer must hover an element before it can click it, so `isHovering` is always `true` at mousedown and
  **the `increment` branch can never receive a mouse click**. Every mouse click on the counter emits `minus`.
  On a fresh `0/N` item, `minusClicked()` (`BaseTodoListItem.vue:314-316`) returns early at
  `doneCount <= 0` — no state change, no network request, no visible feedback.

  That is precisely, and completely, what `todo-lists/U2` observed and could not explain ("a click briefly
  showed a hover/pressed affordance but the count did not change and no request fired"). It is not an
  inconclusive hit-test; it is a dead control, and it is reproducible from the source alone. Neither branch
  carries an accessible name, which is `todo-routine/A1`.
- **Files:**
  - `src/core/todoList/component/TodoListItemCounter.vue` — the whole component
  - `src/core/todoList/component/BaseTodoListItem.vue:314-325` (`minusClicked`), `:327-340` (`progressClicked`)
- **What to change:** Restructure the control so both actions are reachable and named. Two viable shapes —
  pick one, don't split the difference:
  1. **Two persistent buttons** (a `−` and a `+` flanking the count), each a real `<button>` with its own
     `aria-label`. Simplest, and it makes `progressClicked`/`minusClicked` symmetric.
  2. **Keep the hover swap for the visual, but stop using it for hit-testing** — render both, and let CSS
     `opacity`/`visibility` handle the reveal, so the element under the cursor is the one the user meant.

  Either way the counter must expose a localized accessible name that includes the current state, per
  `todo-routine/A1`'s pass condition (e.g. "3 of 4 done"). `VProgressLinear` with a `@click` is not a control
  and should not be the click target in either shape.

  Naming is folded into this batch rather than into F9 deliberately: you cannot fix the hit-test without
  rewriting the same two elements that need the labels.
- **Do not change:** the guards in `minusClicked`/`progressClicked` (`doneCount <= 0`, `doneCount >= total`) —
  they are correct; they were only ever reached with the wrong argument. Note that `progressClicked`'s emit at
  `:329` is **F1's** to resolve; leave it alone here so the two batches don't collide.
- **Verification:** `todo-routine/A1`'s `Verify:` block, plus `todo-lists/U2`'s: on a `0/2` item, one click on
  the intended increment target raises the count to `1/2` **and** issues an API request; one click on the
  decrement target on a `1/2` item drops it back. Re-run the A1 name query with the widened selector
  (`main button, main a.v-btn`) that `todo-lists/A1` established.
- **Risk:** Touch devices have no hover, so today they hit the `v-else` branch and increment correctly. Any
  restructure must not regress touch — this is the one place where the current bug is invisible.

## F3. Two disagreeing progress indicators in one routine group card

- **Scope:** app-side `src/core/todoList/component/routine/`
- **Closes:** `todo-routine/B2`
- **Root cause:** `RoutineGroupCard.vue` stacks two independently-computed progress summaries. Confirmed in
  source: `RoutineGroupStats.vue:133-135` counts **items** (`items.filter(isDone).length / items.length`),
  while `BaseToDoList.vue:221-224` counts **units** (`doneCount ?? (isDone ? 1 : 0)` over `totalCount ?? 1`).
  On any group mixing plain and multi-count items the two disagree by construction — the reported 2/4 vs 67%
  reproduces exactly from the seed.
- **Files:**
  - `src/core/todoList/component/routine/RoutineGroupCard.vue:7-9` (Stats) and `:25` (BaseToDoList)
  - `src/core/todoList/component/routine/RoutineGroupStats.vue:94-106`, `:133-135`
  - `src/core/todoList/component/BaseToDoList.vue:14-25`, `:221-224`
- **What to change:** Remove the duplicate summary from `RoutineGroupStats.vue:94-106` (the `v-if
  groupProgress.total > 0` block and its `groupProgress` computed). `BaseToDoList`'s bar is shared with the
  normal list, already carries the "~time remaining" companion text, and its unit-weighted maths is the more
  informative of the two.
- **Do not change:** `BaseToDoList`'s formula. It is the one the normal to-do list has always shown; changing
  it to item-counting to match `RoutineGroupStats` would silently alter every list in the app to close a
  routine-only finding.
- **Verification:** `todo-routine/B2`'s `Verify:` block — including its step 3, that `TodoListView` still shows
  its one existing summary unchanged.
- **Risk:** Low. `groupProgress` is local to `RoutineGroupStats`; confirm nothing else reads it before deleting.

## F4. The routine surface never went through the i18n pass

- **Scope:** app-side `src/core/todoList/` + `src/core/todoList/_locales/todoList.{sk,en}.ts`
- **Closes:** `todo-routine/B3`, `todo-routine/B4`, `todo-routine/B6` (**streak-tooltip half only** — the undo
  half is already fixed, see Contradictions)
- **Root cause:** One cause, not three: `/routine-settings`, its `TimePeriodForm`, the routine Add dialog and
  `RoutineTodoListItem` were written without the `_locales` step. `TimePeriodForm.vue` contains **zero** `$t()`
  calls; `RoutineSettingsView.vue` has two, both forwarded button labels. B3 looks different (a key that
  exists, under the wrong namespace) but sits in the same file as three raw literals and is closed by the same
  session editing the same locale files, so it belongs here.

  **This is not the `general`-namespace collision class** that `todo-lists/B2` and CLAUDE.md R5/R6/R11 describe.
  No mirroring into `src/locales/common.*` is involved — these keys do not exist anywhere. Do not "fix" it by
  adding entries to `common.{sk,en}.ts`.
- **Files:** the findings cover the first two; the rest are **triage-added from a source sweep of the module**
  and are the same defect in the same dialogs the unit screenshotted:
  - `view/RoutineSettingsView.vue:4` (`<h2>Time Periods</h2>`), `:10` ("Add"), `:91` (`weekDayNames` array),
    `:92-95` (`columns` — every header string), `:127,141` (dialog titles passed as raw strings)
  - `component/routine/dialog/TimePeriodForm.vue:9,14,20,24,34,42,50,60` — every label + helper text
  - `component/routine/dialog/RoutineToDoListForm.vue:28` — **B3**: `$t('toDoList.timePeriod')` →
    `$t('routineTodoList.timePeriod')`
  - `component/routine/dialog/RoutineToDoListForm.vue:38` ("Suggested days"), `:44` ("Suggested day of month"),
    `:51` ("Note") — *triage-added; same dialog as B3, same screenshot, unreported*
  - `component/routine/RoutineTodoListItem.vue:41-44` — **B6**: `Streak: … | Best: …`, `| Grace period active!`
  - `component/routine/RoutineTodoListItem.vue:57` (`DAY_OF_WEEK_SHORT_LABELS[day]`), `:64` (`Day {{ … }}`) —
    *triage-added*
  - `component/BaseTodoListRepeatCountFormField.vue:6,18,28` ("Is repeated", "Done count", "Total count") and
    `component/BaseToDoList.vue:43` (`title="Task already present in this list"`) — *triage-added, and
    **shared with the normal to-do list**, so they are `todo-lists`' defect as much as this unit's*
- **Two things the findings missed that are more than i18n:**
  1. `RoutineSettingsView.vue:92` formats a non-week-aligned anchor day as `` `${value}th` `` — which renders
     "1th", "2th", "3th" and is wrong in English before it is wrong in Slovak. Localizing this correctly means
     an ordinal rule, not a suffix constant.
  2. `RoutineTodoListItem.vue:57` uses `DAY_OF_WEEK_SHORT_LABELS`, which CLAUDE.md explicitly calls "hardcoded
     English and only a non-display fallback" — the sanctioned replacement is
     `useDayOfWeekOptions()` (`_common/composable/general/useDayOfWeekOptions.ts`). `RoutineSettingsView`'s
     local `weekDayNames` array is a second copy of the same mistake; both should route through that
     composable rather than through a new `routineTodoList.*` weekday list.
- **What to change:** Add a `routineTodoList.settings.*` namespace to `_locales/todoList.{sk,en}.ts` covering
  every literal above, wire all the files through `$t()`, and repoint B3's one key. SK is primary — write SK
  first, then EN.
- **Do not change:** `src/locales/common.{sk,en}.ts`. Nothing in this batch is a framework-collision mirror.
- **Verification:** `todo-routine/B4`'s `Verify:` block is the governing one and it is the **only** verify step
  in this sweep that requires switching the account to Slovak — the English-locale symptom is identical to
  correct behaviour, and no `[intlify] Not found` warning ever fires for a plain literal. Then B3's and B6's
  blocks. Add: the anchor-day column for a non-week-aligned period, and the weekday chips on a routine item.
- **Risk:** Large surface, mechanical edits. The real risk is stopping at the two findings' file list and
  leaving the triage-added literals — which would let the same defect be re-reported by units 9 and 14.

## F5. Time-period delete confirmation names a raw id

- **Scope:** app-side `src/core/todoList/view/RoutineSettingsView.vue`
- **Closes:** `todo-routine/B5`
- **Root cause:** `BasicTable.vue:211` falls back to `item.id` when the caller supplies no
  `deleteConfirmationColumn`, and `RoutineSettingsView`'s `<BasicTable>` (line 14) does not supply one.
- **Files:** `src/core/todoList/view/RoutineSettingsView.vue:14-26`. The name field is `text` — confirmed at
  `:93`, `new TableColumn('text', 'Name')` — so the finding's suggested `deleteConfirmationColumn="text"` is
  correct as written.
- **What to change:** Add `deleteConfirmationColumn="text"` to the `<BasicTable>` element. One line.
- **Do not change:** `BasicTable.vue:211`'s `item.id` fallback. Changing that default is a framework decision
  affecting every table in every app, and no finding demands it — see FW-adjacent note in *Contradictions*.
- **Verification:** `todo-routine/B5`'s `Verify:` steps 1-2. **Step 3 (cascade count) is not closed by this
  batch** — see Escalations.
- **Risk:** None.

## F6. Reorder toggle never changes its label

- **Scope:** app-side `src/core/todoList/view/RoutineToDoListView.vue`
- **Closes:** `todo-routine/B7`
- **Root cause:** `RoutineToDoListView.vue:37-44` swaps only `:color` and `:variant` on
  `isInChangeOrderMode`; the label at `:43` is unconditionally `$t('routineTodoList.reorder')`. State is
  conveyed by colour alone.
- **Files:** `src/core/todoList/view/RoutineToDoListView.vue:37-44`, `:230-232` (`toggleChangeOrderMode`)
- **What to change:** Bind the label to `isInChangeOrderMode`, matching the normal list's
  `CHANGE ORDER` / `FINISH REORDERING` pair. Reuse `toDoList.changeOrder` / `toDoList.finishReordering` if the
  wording should match; otherwise add `routineTodoList.*` equivalents in both locales.
- **Verification:** `todo-routine/B7`'s `Verify:` block. The unit's draft spec already asserts this —
  `e2e/tests/todo-routine.draft.spec.ts`'s "Reorder mode can be entered and exited" currently fails on
  `getByRole('button', { name: /finish reordering/i })`, so a passing run of that test *is* the verification.
- **Risk:** None. If you touch the locale files, coordinate with F4 to avoid a merge conflict.

## F7. "Total count" label clipped in the Add dialog

- **Scope:** app-side `src/core/todoList/component/BaseTodoListRepeatCountFormField.vue`
- **Closes:** `todo-routine/P1`
- **Root cause:** `controlVariant="split"` puts the −/+ buttons inside the field's own width, and the field is
  pinned at `:width="180"` / `maxWidth="190"` (`:28-34`). The floating label gets the remainder and ellipsises.
- **Files:** `src/core/todoList/component/BaseTodoListRepeatCountFormField.vue:16-34` (both `VNumberInput`s —
  "Done count" at `:18` has the same shape and the same risk at `:width="170"`)
- **Run this immediately after F4, not before.** The label is currently hardcoded English (`label="Total
  count"`, F4's list). Localizing it makes it *longer* in Slovak, so a width fix validated against "Total
  count" can be wrong the moment F4 lands. Same file, same three lines — kept as a separate batch only because
  the cause is layout, not i18n.
- **What to change:** Give the label room — widen the inputs, or move to `controlVariant="stacked"`/default,
  or let the field size to its container instead of a fixed 180px.
- **Verification:** `todo-routine/P1`'s `Verify:` block, run **in Slovak as well as English** once F4 has
  landed. This component is shared with the normal to-do list's Add/Edit dialog — check both.
- **Risk:** Low. Shared component: a width change lands on the normal list's dialog too.

## F8. `/routine-settings` is missing from `/user/settings`

- **Scope:** app-side `src/core/user/moduleSettingsLinks.ts`
- **Closes:** nothing in `findings.md` — **this finding was never filed.** `todo-routine/inventory.md:98`
  states it plainly ("**Not** in `/user/settings`'s module-settings list — see Findings B4 (orphan route,
  CLAUDE.md violation)") but `findings.md`'s B4 is the localization finding. The cross-reference is dangling
  and the finding itself is absent. Confirmed against source: `moduleSettingsLinks.ts` lists only
  `dayPlannerSettings` and `reminderPreferences`; `routineSettings` is not there. **File this as
  `todo-routine/B8` when fixing it**, so the round history stays honest.
- **Root cause:** The route was added without an entry in `moduleSettingsLinks.ts`. CLAUDE.md: "Every settings
  page must be reachable from `/user/settings`."
- **Files:** `src/core/user/moduleSettingsLinks.ts:23-30`; label key under `user.moduleSettings.*` in
  `src/core/user/_locales/user.{sk,en}.ts`
- **What to change:** Add `{ routeName: 'routineSettings', labelKey: 'routine', icon: … }` plus the two locale
  entries. **Route name only** — the file's own header comment explains why importing the view or store would
  break CLAUDE.md's cross-module rule.
- **One genuine judgement call, which the fixer should make explicitly rather than assume.**
  `moduleSettingsLinks.ts`'s comment says entity-management screens do *not* belong there, only per-user
  preference pages — and `/routine-settings` is both: it manages time-period entities (name, colour, length)
  *and* per-user streak preferences (threshold, grace days, reset anchor, history depth). The preference half
  is real and is currently reachable only from an in-page button on `/routine-todo-list`, which is the exact
  discoverability failure the file was created to fix. Adding it is the right call; say so in the commit.
- **Do not change:** `_routes.md`'s orphan table entry beyond ticking it — the unit *did* answer the orphan
  question (reachable from the SETTINGS button at `RoutineToDoListView`), so it is not a dead route.
- **Verification:** Open `/user/settings`, confirm a "Routine" row appears and navigates to `/routine-settings`,
  and that its label is localized in both locales.
- **Risk:** None.

## F9. Icon-only controls the `todo-lists` A1 sweep never reached

- **Scope:** app-side `src/core/todoList/component/`
- **Closes:** nothing filed — **triage-added.** Same root cause as `todo-lists/A1`/`A2` (already fixed): an
  icon-only control with no `aria-label`/`title`. Found by sweeping every `<VIconBtn>` in the module for a
  missing `aria-label`; these four sit in surfaces neither unit's DOM query covered (a dialog, and a control
  that only renders when `progress.done > 0`).
- **Files:**
  - `src/core/todoList/component/BaseToDoList.vue:26` — the "uncheck all" `fa-rotate-left` button.
    `v-if="progress.done > 0"`, which is why the live sweeps missed it. Renders on **both** the routine group
    cards and the normal list.
  - `src/core/todoList/component/TodoListStepsFormField.vue:10,17,31,48` — move-step-up, move-step-down,
    delete-step, add-step. Inside the Add/Edit dialogs, so no `main button` sweep would ever see them.
- **What to change:** Add `:title` + `:aria-label` following the pattern `todo-lists/A1` established
  (`BaseTodoListItem.vue:110-111,126-127`), using existing keys where they exist. Where a control repeats per
  row, qualify the name with the row's subject the way `More actions: {name}` does — four identical "Delete"
  buttons in the accessibility tree pass an automated check while remaining unusable.
- **Do not change:** the counter's buttons — those are F2's, and F2 rewrites the same elements.
- **Verification:** Re-run `todo-lists/A1`'s query with the widened selector on `/todo-list/1` **with a
  partially-completed list** (so the uncheck-all button renders) and **with the Add dialog open**
  (`document.querySelectorAll('.v-overlay button, main button, main a.v-btn')`). Pass condition: `0`.
- **Risk:** None.

## F10. No skip-to-content link

- **Scope:** app-side `src/App.vue` — **not** the framework, despite the finding's wording
- **Closes:** `_shell/A3`
- **Root cause:** No skip link exists; the first Tab stop is the framework's sidebar toggle.
- **Files:** `src/App.vue:3-18` — `<Navbar>` at `:3`, `<VMain>` (which renders the `<main>` landmark) at `:11`
- **Re-grade on scope.** `_shell/A3` proposes "App.vue **or** the framework's top-level layout". It is app-side
  and only app-side: to be the first Tab stop the link must precede `<Navbar>` in DOM order, which is
  `App.vue:3`, and `<VMain>` — the target — is already in `App.vue`. No submodule commit, no pointer bump.
- **What to change:** Insert a visually-hidden-until-focused anchor as the first child of `<VApp>`, targeting
  the main region (give `VMain` an `id`). Label from `src/locales/common.{sk,en}.ts` (app-wide string, no
  module owns it).
- **Verification:** `_shell/A3`'s `Verify:` block — all four steps, including step 4 (invisible when unfocused).
- **Risk:** None.

## F11. Breadcrumb does not distinguish `/todo-list/:id` from `/todo-list`

- **Scope:** app-side `src/core/todoList/view/TodoListView.vue` — **not** the framework
- **Closes:** `_shell/P1`
- **Root cause:** `useBreadcrumbs()` builds the trail from the nav tree (`findTrail` over `getNavTrees()`), and
  the nav tree has no entry for `/todo-list/:id`, so a param route inherits its parent's crumbs verbatim.
- **Re-grade on the suggested fix — this is the useful part.** `_shell/P1` proposes "route meta could supply a
  dynamic breadcrumb label", implying a framework change to `useBreadcrumbs`/`AppBreadcrumbs`. **The framework
  already supports this.** `_common/composable/general/useBreadcrumbs.ts` exports `useSetBreadcrumbExtra()`,
  which appends caller-supplied segments to the trail and cleans them up in `onBeforeUnmount`. The fix is a
  view calling it — no submodule commit, no pointer bump, no framework-wide default touched.
- **Files:**
  - `src/core/todoList/view/TodoListView.vue` — call `useSetBreadcrumbExtra()` and push
    `[{ title: <list name> }]` once the list resolves
  - reference only: `src/_common/composable/general/useBreadcrumbs.ts:76-92`
- **What to change:** In `TodoListView`, set the extra segment from the fetched list's name. Handle the two
  states the view already models: before the fetch resolves, and `loadFailed` (the not-found state added by
  `todo-lists/B1`'s fix) — neither should leak a raw id or an empty crumb.
- **Do not change:** `useBreadcrumbs.ts`. Adding a `meta.breadcrumb` mechanism alongside the extras mechanism
  would give the framework two ways to do one thing.
- **Verification:** `_shell/P1`'s `Verify:` block, all four steps. Add `/todo-list/999999`, which must not
  render a crumb for a list that does not exist.
- **Risk:** Low. `extraSegmentSlots` is module-level state keyed by an incrementing slot id; confirm the crumb
  clears on navigation away (the composable's `onBeforeUnmount` should handle it, but it is shared state).

---

## FW1. `MyDialog` is `persistent` by default, so Escape closes nothing

- **Scope:** **[framework]** `src/_common/component/dialog/MyDialog.vue` — submodule commit in `vue_framework`,
  then a pointer bump in this repo, in that order
- **Closes:** `_shell/A1`
- **Root cause:** `persistent` defaults to `true` (`MyDialog.vue:86`) and `onEscKey()` only closes when it is
  `false` (`:136-138`). Every call site that does not opt out — which is nearly all of them, across every app
  on the framework — is a keyboard dead end.
- **Files:** `src/_common/component/dialog/MyDialog.vue:86`, `:136-138`; docs in
  `src/_common/docs/components.md` must change in the same commit (CLAUDE.md's framework rule 3)
- **Its own batch by rule 4, and it needs a decision before a patch.** Flipping the default silently changes
  dismissal semantics for every dialog in every app, including destructive confirms. The two options the
  finding lays out — flip the default and have guarding dialogs opt *in*, versus leave the default and have
  each harmless call site opt *out* — are not equivalent in risk, and this is not a call a fixing session
  should make alone. Get the owner's answer first.
- **What to change:** whichever the decision is, plus the framework docs, plus a default that keeps existing
  apps working if it goes the opt-in way (CLAUDE.md's framework rule 2).
- **Verification:** `_shell/A1`'s `Verify:` block — **both halves**. A fix that makes every dialog escapable is
  a regression, not a fix: the destructive-confirm case must still resist Escape.
- **Risk:** Highest in this queue. It ships to every app on `vue_framework`, and the failure mode (a
  half-filled form dismissed by a stray Escape) is data loss, not a rendering glitch.

## FW2. Framework icon-only controls with no accessible name

- **Scope:** **[framework]** `src/_common/` — submodule commit, then pointer bump
- **Closes:** `_shell/A2`
- **Root cause:** Same defect class as the app-side `todo-lists/A1`/`A2`, in the submodule. Separate batch by
  rule 1 — it cannot ship in the same commit, however identical the edit looks.
- **Files:**
  - `src/_common/nav/AppTopBar.vue` — the sidebar-toggle hamburger (`_shell/A2`)
  - `src/_common/component/dataTable/BasicTable.vue:25-36` — the create "+" `VIconBtn`. *Triage-added*:
    unfiled, but it is the same cause in the same submodule and it renders on `/routine-settings`, which unit
    10 documented. Fold it in rather than leaving it for a later unit to re-report.
- **What to change:** Add localized `aria-label` (and `title` where a tooltip is wanted) using the framework's
  own locale namespace — **not** an app key. Update `src/_common/docs/components.md` in the same commit.
- **Do not change:** anything under `src/core/`. If a name needs an app-specific string, register a
  collaborator; do not import the app from the framework.
- **Verification:** `_shell/A2`'s `Verify:` block, including step 4 (the name follows the locale, is not
  hardcoded English). For `BasicTable`, check on `/routine-settings`.
- **Risk:** Low, but it is still two repos and two commits. Push the submodule commit before the pointer bump.

---

## Escalations (backend / outside this repo)

1. **Notification titles and bodies ignore the account locale** — `_shell/B1`. Text is localized server-side at
   dispatch time, so no `src/` change can fix it; the client receives a finished Slovak string. The ask is on
   whoever owns the reminder/notification dispatch templates: resolve notification text against the
   recipient's locale preference at dispatch, or send a key + params and let the client resolve it. Note the
   finding's own caveat — rows already persisted in Slovak may need a reseed rather than a code fix, so
   "existing rows are still Slovak" is not by itself evidence the fix failed. **Not written up as a backend
   prompt file** (triage does not write those).

2. **Does deleting a routine time period cascade, and to what?** — raised by `todo-routine/B5` step 3 and
   deliberately not closed by F5. The confirmation dialog says nothing about impact, and this pass declined to
   delete a real period to find out. CLAUDE.md's cascade rule is explicit: a delete that cascades **always**
   confirms and must say how many children go with it. Answering needs the server contract (are routine items
   reassigned, orphaned, or deleted?). Two consequences if it does cascade: `BasicTable`'s generic delete
   dialog cannot express a count, and it bypasses `useDeleteConfirmation` entirely — so `/routine-settings`
   would be a delete site outside the composable that CLAUDE.md names as the single owner of that decision.
   Settle the contract first; the frontend shape follows from the answer.

3. **A done-toggle advances `streak` / `lastCompletedAt` irreversibly, with no undo path.** Not a filed
   finding — it is documented in `todo-routine/findings.md`'s closing "Note on unintended seed-data mutation",
   which records that the pass could restore `isDone` but could not restore `streak: 5` or the previous
   `lastCompletedAt` through any UI or API path. That is a real product gap independent of the seed mishap: an
   accidental check (which F1 shows is easy) permanently inflates a streak, and the undo stack is never
   populated by a done-toggle at all. Needs a decision on whether toggling done off should reverse the streak
   advance, which is a server-side rule.

**Extension to an existing ask, not a new one:** the seed requirements below add to
`prompts/view-docs/backend/B1-test-seed-endpoint.md`'s list. Add them there when that file is next touched.

## Needs verification (unverified findings, and what would settle each)

**Seed-data gaps — one ask, five findings.** `todo-lists/O1` + `todo-lists/U3` (already noted in-doc as the
same gap), `todo-lists/U1`, `todo-routine/U1`, `todo-routine/U2`. None is a defect; each is a surface the
current seed cannot render. Consolidated requirement:

| what to seed | unblocks |
| --- | --- |
| ≥5 to-do items with non-zero `suggestedTime` **and** matching activity-history entries | `todo-lists/O1`, `todo-lists/U3` (per-item chip + header calibration line) |
| ≥1 overdue, not-done item past the renegotiation threshold | `todo-lists/U1` (overdue banner, bulk reschedule, one-by-one review) |
| ≥1 routine time period with `totalPeriodsElapsed > 0` and non-empty `completionHistory` | `todo-routine/U1` (weekly review card), `todo-routine/U2` (personal bests, both heatmaps, consistency/trend) |
| ≥1 routine item with `streak >= 30` (ideally 90/180/365 too) | `todo-routine/U2` (milestone icons — the seed's best is 12) |

Also: a later pass on this seed should expect Meditation's `streak` to read **6**, not 5 — see the mutation
note at the end of `todo-routine/findings.md`.

**`todo-routine/A2` — steps-expand chevron has no accessible name. Re-graded `a11y` → `unverified`;
contradicted by source.** See Contradictions. What would settle it: on `/routine-todo-list`, on a **stepped
but not multi-count** item, run the row-scoped button sweep and report the *specific* element that comes back
unnamed, with its `outerHTML` — not its inferred identity. If it is the counter, A2 is a duplicate of A1 and
closes with F2; if it is something else, it is a new finding.

**`todo-routine/B6` (undo half) and `todo-routine/A3` — both appear already fixed in the working tree.** They
need the ordinary retest round rather than a fix session: run each `Verify:` block, in a state where the undo
button is *enabled* (perform a reorder first — the original pass never could, which is why both were
source-read only).

**`_shell/U1` — snackbar stacking.** Trigger two snackbar-worthy actions in quick succession and observe
whether the second stacks or replaces. A routine done-toggle plus an undo is now an easy way to produce two.

**`_shell/U2` — fullscreen-loading strand.** Navigate away *during* a slow request under network throttling.
Source (`router.ts:68-72`) says it cannot strand; this would confirm it under the one condition not tried.

**`/routine-settings` row controls — never checked.** `todo-routine/inventory.md` records "no accessible-name
check done this pass" for the per-row pencil/trash and the "Is hidden" switch. The pencil/trash come from
`BasicTable`'s `TableAction`s, which do carry `t('general.edit')`/`t('general.delete')` labels — so they are
probably fine, but "probably" is why this is here and not in FW2. The `VSwitch` at `RoutineSettingsView.vue:52`
has `hideDetails` and no label of any kind, which looks like a real gap. One DOM sweep of that page settles
all three.

## Deferred to opportunities

- **`todo-lists/O1` — estimate-vs-actual calibration is fully built and unreachable.** Frontend complete,
  backend contract landed and returning 200; the only thing missing is data. Goes to `docs/opportunities.md`
  in Phase 4, and its seed requirement is in the table above. No code change.

## Contradictions & re-grades

Every judgement changed here was checked against the **working tree**, by reading source. No browser was used.

### Contradictions

1. **`todo-routine/A3` (undo button has no accessible name) is contradicted by the file it names.**
   `TodoListUndoBtn.vue:12` carries `:aria-label="label"`, where `label` is a computed resolving
   `general.undo` / `general.nothingToUndo` (both keys confirmed present in `common.sk.ts` **and**
   `common.en.ts`). This landed in `todo-lists`' round-2 fix, whose write-up names the file explicitly.
   **Dropped from the queue.** Needs a retest, not a fix.

2. **`todo-routine/B6`'s undo half is contradicted the same way**, by the same edit — the tooltip is no longer
   a hardcoded English literal. B6's evidence flags this half as "source read only, not reproduced in this
   pass", which is exactly the shape of finding the triage prompt says to distrust. **Re-scoped to the streak
   tooltip only**, which is fully confirmed (`RoutineTodoListItem.vue:41-44`, still literal).

3. **`todo-routine/A2` (steps chevron) is contradicted by source.** The chevron is not in
   `BaseTodoListItem.vue` as the finding states — it is `BaseTodoListItemSteps.vue:12-14`, and it carries
   `:title`, `:aria-label` **and** `aria-expanded`, all localized, all present in the tree the pass ran on.
   The pass evidently ran *after* the todo-lists fixes landed: its own A1 evidence quotes `"More actions:
   Laundry"` as a correctly-named sibling, and that string exists only because of the round-2 fix. So the
   agent saw a genuinely unnamed button on stepped items and attributed it to the chevron without confirming
   which element it was. The most likely actual culprit is `TodoListItemCounter`'s minus button — "Meal
   Preparation", one of the three items it names, is `doneCount: 3 / totalCount: 3`, i.e. multi-count — which
   makes A2 a duplicate of A1. **Re-graded `a11y` → `unverified`, merged into F2**, with the specific query
   that would settle it recorded above.

4. **`_shell/P1`'s suggested fix is contradicted by the framework's own API.** It proposes route-meta support
   for dynamic breadcrumb labels, implying a submodule change. `useBreadcrumbs.ts:76-92` already exports
   `useSetBreadcrumbExtra()` for precisely this. **Re-graded from an implied framework change to an app-side
   one-view fix (F11)** — which is the difference between a submodule commit + pointer bump and three lines in
   `TodoListView.vue`.

5. **`todo-routine/inventory.md:98` cites a finding that does not exist.** It records the `/routine-settings`
   orphan / CLAUDE.md violation and points at "Findings B4", but `findings.md`'s B4 is the localization
   finding. The orphan finding was never written up, and it is real — confirmed against
   `moduleSettingsLinks.ts`, which lists only `dayPlannerSettings` and `reminderPreferences`. **Recovered as
   F8**; file it as `todo-routine/B8`.

6. **`docs/views/_routes.md`'s coverage tracker is stale.** Units 9 and 10 both have inventories on disk and
   both rows are still unticked. Not a code defect; fix it when the next unit lands, or the tracker stops
   being the thing that proves nothing was skipped.

### Re-grades

| finding | was | now | why |
| --- | --- | --- | --- |
| `todo-lists/U2` | unverified | **bug** | Fully explained from source, no browser needed. `TodoListItemCounter`'s `VHover` renders the increment target only under `v-else` of `isHovering`; a mouse must hover to click, so the click always lands on the minus button, and `minusClicked` early-returns on a `0/N` item. That reproduces the observation exactly — no state change, no request. Not an inconclusive hit-test; a dead control. → F2 |
| `todo-routine/A2` | a11y | **unverified** | Named element is already labelled; see Contradiction 3. → F2 |
| `todo-routine/A3` | a11y | **dropped** | Already fixed; see Contradiction 1. |
| `todo-routine/B6` | bug (2 sites) | **bug (1 site)** | Undo half already fixed; see Contradiction 2. → F4 |
| `todo-routine/B1` | bug | bug, **scope grown** | The suggested `.stop` fix closes only the single-count path. `progressClicked` emits `itemClicked` itself at `BaseTodoListItem.vue:329`, and the counter already has `@click.stop`, so the multi-count path survives that fix. Consumer is `RoutineGroupCard.vue:61`, not `RoutineToDoListView` as stated. → F1 |
| `_shell/A3` | a11y (app *or* framework) | a11y, **app-side only** | `<VMain>` and the pre-`<Navbar>` insertion point are both in `App.vue`. No submodule change. → F10 |
| `_shell/P1` | polish (implied framework) | polish, **app-side** | See Contradiction 4. → F11 |
| `todo-routine/B4` | bug | bug, **scope grown** | Adds `RoutineToDoListForm.vue:38,44,51`, `BaseTodoListRepeatCountFormField.vue:6,18,28`, `BaseToDoList.vue:43`, `RoutineTodoListItem.vue:57,64` — the last three **shared with the normal to-do list**, so unit 9 has the same defect and did not report it. Also surfaces a correctness bug behind the i18n one: `RoutineSettingsView.vue:92`'s `` `${value}th` `` renders "1th"/"2th"/"3th". → F4 |
| `_shell/A2` | a11y (framework) | unchanged, **scope grown** | Adds `BasicTable.vue:25`'s create "+" — same cause, same submodule, renders on a page unit 10 documented. → FW2 |

**Corrected tally for `todo-routine`:** the header reads *bug 7 · a11y 3 · polish 1 · unverified 2*. After
triage it is **bug 6 · a11y 1 · polish 1 · unverified 2 · dropped 1** (A3 dropped, A2 → unverified and merged,
B6 halved), plus one unfiled finding recovered from the inventory (F8) and two unfiled a11y items found by
source sweep (F9).

**One thing deliberately *not* re-graded.** `BasicTable.vue:211`'s `item.id` fallback for a delete
confirmation is arguably a poor framework default — silently naming a database id is never the right answer,
and F5 is the second app in this repo to hit it. But no finding asks for it, the app-side fix is one
attribute, and by rule 4 changing it would have to be its own framework batch with its own decision. Left
alone; noted here so the next reader does not have to rediscover it.

### Findings this triage did **not** challenge

`todo-routine/B2`, `B3`, `B5`, `B7`, `P1` and `todo-lists`' five fixed findings were all re-checked against
source and stand exactly as written, including their file:line references. B5's suggested
`deleteConfirmationColumn="text"` was verified against `RoutineSettingsView.vue:93` and is correct.
