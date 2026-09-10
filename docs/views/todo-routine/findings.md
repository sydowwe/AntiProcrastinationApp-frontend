# todo-routine — findings

> Pass: inventory · captured 2026-09-10 · commit `acd7db0d`

**Tally (round 1, as captured):** blocker 0 · bug 7 · a11y 3 · polish 1 · opportunity 0 · unverified 2

**Tally (after triage + round 2):** blocker 0 · bug 7 (B1, B2, B5, B7, B8 **fixed**; B3, B4, B6 open) ·
a11y 1 (A1; A2 re-graded to `unverified`, A3 dropped as already fixed) · polish 1 · opportunity 0 ·
unverified 3 (U1, U2, A2). B6 is open but halved — its undo-tooltip half was already fixed elsewhere.
B8 was filed retroactively during triage. See `docs/views/_fix-queue.md` for the reasoning behind every
re-grade.

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-10 | `acd7db0d` | initial inventory pass |
| 1a | 2026-09-10 | `acd7db0d` | **triage** (`docs/views/_fix-queue.md`). A3 dropped and B6 halved — both already fixed in the working tree by the `todo-lists` round-2 pass. A2 re-graded `a11y` → `unverified` (the chevron it names is labelled in source; wrong file, wrong element). B1 scope grown to the multi-count path. New finding **B8** recovered from `inventory.md:98`, which referenced it but where it was never written up. |
| 2 | 2026-09-10 | working tree | **fix pass** — B1, B2, B5, B7, B8 code-fixed (fix-queue batches F1, F3, F5, F6, F8). `npx vue-tsc --build --force` exit 0, `npm run lint` exit 0. B3/B4/B6 (F4, the i18n batch), P1 (F7) and A1/A2 (F2) untouched. **Not browser-verified** — this session had no browser; every `Verify:` block below is still outstanding. |

---

### B1. Checking off a routine item's checkbox unconditionally opens the "Log time manually" dialog
- **Status:** fixed (round 2) — **not yet browser-verified**
- **Severity:** bug
- **Where:** `/routine-todo-list` and `/todo-list/:id` (shared component) →
  `src/core/todoList/component/BaseTodoListItem.vue:10,27` (`VListItem`'s `@click="itemClicked"` and the
  checkbox's `@click.prevent`), routed through `itemClicked` (line 294) which both toggles `isDone` **and**
  `emits('itemClicked', …)` → `RoutineToDoListView.vue`'s `openLogTime(item, true)` (manual log-time dialog).
- **Expected:** Clicking a plain checkbox should toggle done/not-done and nothing else — plain user sense, and
  matches the sibling unit's own documented expectation for the identical shared component
  (`docs/views/todo-lists/inventory.md`: "Checkbox … toggles done | in place", no side dialog recorded).
- **Actual:** The checkbox's `@click.prevent` only calls `preventDefault()` — it does not stop propagation — so
  the click bubbles to the parent `VListItem`'s row-level `@click="itemClicked"`. That handler both flips
  `isDone` (a second, redundant toggle on top of the checkbox's own `v-model` flip) **and** unconditionally
  emits `itemClicked`, which both `RoutineToDoListView.vue` and `TodoListView.vue` wire to
  `openLogTime(item, true)` — the manual time-entry dialog. Every single checkbox click, on both list kinds,
  pops this dialog. Confirmed by direct reproduction: two consecutive clicks on the same item's checkbox each
  opened "Log time manually" and each produced exactly one real server-side `isDone` toggle (verified via
  `GET /api/routine-todo-list/grouped-by-time-period` before/after — see Evidence).
- **Evidence:** Reproduced live on `/routine-todo-list`, "Meditation" (Daily group, item id 2). Before: `isDone:
  false, streak: 5, lastCompletedAt: "2026-09-09T07:46:55Z"`. After one checkbox click: `isDone: true, streak:
  6, lastCompletedAt: "2026-09-10T08:02:44Z"`, "Log time manually" dialog open. After a second click (intended
  to revert): `isDone: false` again, but **streak stayed at 6 and lastCompletedAt stayed at the new
  timestamp** — see the note at the end of this file about unintended seed drift caused while diagnosing this.
  Console showed no errors either time; this is a silent behavioural bug, not a crash.
- **Repro:** 1. Go to `/routine-todo-list` (or `/todo-list/:id`). 2. Click directly on any single-count item's
  checkbox. 3. Observe: the item toggles done, **and** a "Log time manually" dialog opens uninvited.
- **Verify:** 1. Click a single-count item's checkbox on either list. 2. **Pass condition:** the item toggles
  done/not-done and no dialog opens. 3. Confirm the explicit "LOG TIME" overflow-menu entry still opens the
  same dialog on purpose.
- **Root cause guess:** `@click.prevent` on the checkbox needs `.stop` too, or `itemClicked`'s emit of
  `'itemClicked'` needs to be scoped to clicks on the row body, not the checkbox itself (e.g. skip the emit
  when `event.target` is inside the checkbox).
- **Suggested fix:** Add `.stop` to the checkbox's `@click.prevent.stop` in `BaseTodoListItem.vue:27`, so the
  checkbox's own `v-model` handles the toggle and the row-level `itemClicked` (and its log-time side effect)
  never fires for a checkbox click.
- **⚠️ The suggested fix above is wrong and would have broken the checkbox. Do not apply it as written.** It
  rests on "the checkbox's own `v-model` handles the toggle", and the `v-model` never fires: `@click.prevent`
  cancels the checkbox's activation behaviour, so no `input`/`change` event is emitted and `isDone` is never
  written by Vuetify. The row-level `itemClicked` was the *only* thing flipping `isDone` for a checkbox click.
  `.stop` alone would therefore have left `@click.prevent` cancelling the native toggle with nothing left to
  perform it — a checkbox that no longer checks. The finding's own evidence already ruled the premise out:
  one click produced **exactly one** server-side toggle, whereas two independent flips (v-model *and*
  `itemClicked`) would have cancelled out and produced none.
- **Fix applied (round 2):** Gave the checkbox its own handler instead of relying on propagation.
  `BaseTodoListItem.vue` — the `isDone` flip moved into a shared `toggleDone()`; the checkbox is now
  `@click.prevent.stop="checkboxClicked"`, which calls `toggleDone()` and nothing else; `itemClicked` (row
  body) keeps emitting `itemClicked` and then calls `toggleDone()`. **Second half, which the finding did not
  have:** `progressClicked()` emitted `itemClicked` itself (`:329`), and `TodoListItemCounter` already carries
  `@click.stop` on both branches — so the counter opened the dialog by a path no template modifier could
  reach. That emit moved up into `itemClicked`, so it now fires for a row-body click on a multi-count item
  and not for a counter click. Consumer chain corrected in passing: the routine view reaches this via
  `RoutineGroupCard.vue:61`, not `RoutineToDoListView.vue` as the finding states.

### B2. Two progress indicators in the same routine group card disagree
- **Status:** fixed (round 2) — **not yet browser-verified**
- **Severity:** bug
- **Where:** `/routine-todo-list`, Daily group card — `RoutineGroupStats.vue`'s `groupProgress` ("2 / 4") vs
  `BaseToDoList.vue`'s own `progress` bar ("67%"), stacked directly on top of each other in
  `RoutineGroupCard.vue`.
- **Expected:** S1's intent (`prompts/_done/todo-motivation/S1-progress-bars.md`) asks for **one** per-list
  progress summary, "count completed vs total". Plain user sense also says two numbers in the same card
  describing "how much is done" should agree.
- **Actual:** `RoutineGroupStats` shows "2 / 4" (2 of 4 items marked done — a simple item-count ratio = 50%).
  Directly below it, `BaseToDoList`'s own bar shows "67%", computed differently: `doneCount ?? (isDone?1:0)`
  summed over `totalCount ?? 1`. Because one of the four items ("Meal Preparation") is a multi-count/step item
  with `doneCount: 3, totalCount: 3`, it contributes 3 "units" to that second calculation while the other three
  single-count items each contribute at most 1 — yielding 4/6 ≈ 67% instead of 50%. Verified by fetching
  `GET /api/routine-todo-list/grouped-by-time-period` and computing both formulas by hand from the raw item
  data (Journaling: not done, doneCount null; Meditation: not done, doneCount null; Meal Preparation: done,
  doneCount 3/totalCount 3; Morning Exercise: done, doneCount null) — `2/4` and `4/6` both reproduce exactly.
- **Evidence:** `docs/views/todo-routine/screenshots/routine-todo-list--default.png` (Daily card shows "2 / 4"
  directly above a "67%" bar).
- **Repro:** 1. Go to `/routine-todo-list`. 2. Look at any group card containing a mix of plain and
  multi-count/step items where the two are not proportionally equal. 3. Compare the "N / M" text to the % bar
  directly below it.
- **Verify:** 1. Go to `/routine-todo-list`. 2. **Pass condition:** the group card shows a single progress
  summary, or the two numbers are clearly labelled as measuring different things (e.g. "items" vs
  "sub-tasks"). 3. Confirm the normal list (`TodoListView`) still shows its one existing summary unchanged —
  it does not stack `RoutineGroupStats`, so it is unaffected by whichever fix is chosen here.
- **Root cause guess:** S1 added `RoutineGroupStats`'s own progress summary for the routine view without
  noticing `BaseToDoList` (shared with the normal list) already renders one, just computed with different
  weighting.
- **Suggested fix:** Drop one of the two. Keeping `BaseToDoList`'s (already shared, already has the "~time
  remaining" companion text) and removing the duplicate summary from `RoutineGroupStats` is the smaller change.
- **Fix applied (round 2):** Took the suggested resolution. Removed the summary block and the `groupProgress`
  computed from `RoutineGroupStats.vue`; with it gone the `items` prop had no remaining reader, so the prop,
  its type import and `RoutineGroupCard.vue`'s `:items="group.items"` binding went too. `BaseToDoList`'s
  unit-weighted bar is now the single summary. The stats row is a `1fr auto 1fr` grid and the removed block
  was the third cell, so the middle cell stays centred with the third column simply empty — a comment in
  place of the block records that, so nobody "fixes" the layout by re-adding something there.
- **Not changed, deliberately:** `BaseToDoList`'s formula. It is what the normal to-do list has always shown;
  re-weighting it to item-counting to match `RoutineGroupStats` would have altered every list in the app to
  close a routine-only finding.

### B3. Routine "Add" dialog's time-period field label renders as the raw key `toDoList.timePeriod`
- **Status:** open
- **Severity:** bug
- **Where:** `src/core/todoList/component/routine/dialog/RoutineToDoListForm.vue:28`
- **Expected:** Every field label resolves to real text — CLAUDE.md's i18n rules, and the same class of defect
  already documented once in the sibling unit
  (`docs/views/todo-lists/findings.md` B2, `iconPicker.icon`).
- **Actual:** The label reads literally `toDoList.timePeriod`. The key **does** exist in the locale files, just
  under the wrong namespace: `routineTodoList.timePeriod` = `"Time period"` (`todoList.en.ts:106`,
  `todoList.sk.ts:116`), but the form calls `$t('toDoList.timePeriod')` — the *normal*-list namespace, which
  has no such key.
- **Evidence:** `docs/views/todo-routine/screenshots/routine-todo-list--add-dialog.png`; console:
  `[intlify] Not found 'toDoList.timePeriod' key in 'EN' locale messages.` ×4, reproduced on every open of the
  Add dialog.
- **Repro:** 1. Go to `/routine-todo-list`. 2. Click "Add". 3. Look at the label above the "Daily/Weekly/…"
  select.
- **Verify:** 1. Open the "Add to routine to-do list" dialog. 2. **Pass condition:** the field label reads
  "Time period" (or its Slovak equivalent), and the console logs no `[intlify] Not found 'toDoList.timePeriod'`
  warning.
- **Root cause guess:** Copy-paste from the normal list's form with the namespace prefix not updated.
- **Suggested fix:** Change `RoutineToDoListForm.vue:28` from `$t('toDoList.timePeriod')` to
  `$t('routineTodoList.timePeriod')`.

### B4. `/routine-settings` and its create/edit dialog are entirely un-localized
- **Status:** open
- **Severity:** bug
- **Where:** `src/core/todoList/view/RoutineSettingsView.vue` (whole file) and
  `src/core/todoList/component/routine/dialog/TimePeriodForm.vue` (whole file) — zero `$t()` calls in either
  file except two button labels (`t('general.create')` / `t('general.save')`, passed from the parent).
- **Expected:** All user-facing strings go through vue-i18n (CLAUDE.md, "Localization"). The account's language
  preference is English in this pass, so the defect is not visible by contrast here — but the same page would
  render identically hardcoded-English even with the account set to Slovak, since none of the text is behind
  `$t()` at all.
- **Actual:** Every visible string on `/routine-settings` is a literal: the page title "Time Periods", the
  "Add" button, every column header ("Color", "Name", "Length (days)", "Reset anchor", "Streak threshold",
  "Grace days", "Is hidden"), the weekday names used to format the "Reset anchor" column
  (`weekDayNames = ['Monday', …]`), and inside the dialog: "Name", "Length in days", "Color", "History depth
  (periods)" + its helper text, "Streak settings", "Streak threshold (%)" + helper, "Grace days" + helper,
  "Reset anchor day"/"Reset anchor day of month" + helper, and the dialog titles "Add time period"/"Edit time
  period" passed as raw strings from `RoutineSettingsView.vue:127,141`. Because these are plain string
  literals rather than unresolved `$t()` calls, **no `[intlify] Not found` console warning ever fires** — this
  class of defect is invisible to the usual detection method and was only caught by reading the component
  source and cross-checking every label against it.
- **Evidence:** `docs/views/todo-routine/screenshots/routine-settings--default.png` and
  `…--edit-dialog.png`; source read of both files (`grep -c '\$t('` returns 0 in `TimePeriodForm.vue`).
  Console confirmed clean (no warnings) on this page, corroborating that these are literals, not lookups.
- **Repro:** 1. Go to `/routine-settings`. 2. Open the "Add" dialog. 3. Every label is plain English regardless
  of account locale.
- **Verify:** 1. Switch the account language to Slovak at `/user/settings`. 2. Go to `/routine-settings` and
  open "Add". 3. **Pass condition:** every label (page title, column headers, weekday names, dialog fields and
  helper text, dialog title) renders in Slovak. This is the one finding in this pass that specifically needs a
  Slovak-locale re-check to verify the fix, since the English-locale symptom looks identical to correct
  behaviour.
- **Root cause guess:** This page and its dialog were built without going through the i18n pass the rest of
  the module had — possibly written in one sitting without the `_locales` step.
- **Suggested fix:** Add a `routineTodoList.settings.*` (or similar) namespace to
  `_locales/todoList.{sk,en}.ts` covering every literal listed above, and wire both files through `$t()`.

### B5. Time-period delete confirmation shows the raw numeric id instead of the period's name
- **Status:** fixed (round 2) — **not yet browser-verified**; step 3 (cascade) remains open, see below
- **Severity:** bug
- **Where:** `/routine-settings` → delete (trash icon) on any row → `BasicTable.vue:211`'s
  `deleteConfirmationText`, driven by an optional `deleteConfirmationColumn` prop that
  `RoutineSettingsView.vue`'s `<BasicTable>` usage never passes.
- **Expected:** A delete confirmation should identify *what* is being deleted by name — plain user sense, and
  the pattern every other delete confirmation in this module follows (the normal list's "Delete list?" names
  the list, `docs/views/todo-lists/inventory.md`).
- **Actual:** Clicking delete on the "Yearly" row (id 4) shows the dialog title "Delete confirmation" and body
  **"Are you sure you want to delete 4?"** — the raw database id, not "Yearly". `BasicTable.vue:211` falls back
  to `item.id` whenever the caller doesn't supply `deleteConfirmationColumn`, and `RoutineSettingsView.vue`
  doesn't. The dialog also states nothing about cascade impact (what happens to routine items currently
  assigned to that period) — unknown and unverified this pass, since deleting a real period was avoided to
  keep the seed intact.
- **Evidence:** `docs/views/todo-routine/screenshots/routine-settings--delete-confirmation.png` — dialog body
  reads "Are you sure you want to delete 4?". Cancelled before confirming; all 4 rows still present afterward.
- **Repro:** 1. Go to `/routine-settings`. 2. Click the trash icon on any row. 3. Read the confirmation text.
- **Verify:** 1. Click delete on the "Yearly" row. 2. **Pass condition:** the confirmation names the period
  ("Yearly"), not a bare number. 3. If deleting a period cascades to its routine items, the dialog should also
  say how many, per CLAUDE.md's cascade-delete rule — worth checking once the name fix lands.
- **Root cause guess:** `RoutineSettingsView.vue`'s `<BasicTable>` call is missing
  `deleteConfirmationColumn="text"` (the period's name field).
- **Suggested fix:** Add `deleteConfirmationColumn="text"` to the `<BasicTable>` element in
  `RoutineSettingsView.vue`.
- **Fix applied (round 2):** Exactly that — `deleteConfirmationColumn="text"` on the `<BasicTable>`. The field
  name was verified against `RoutineSettingsView.vue`'s own column list (`new TableColumn('text', 'Name')`),
  so the confirmation now names the period.
- **Not changed, deliberately:** `BasicTable.vue:211`'s `item.id` fallback. Silently naming a database id is a
  poor framework-wide default and this is the second call site to hit it, but changing it is a submodule
  commit affecting every table in every app on the framework — its own batch and its own decision, not a
  side effect of an app-side one-liner.
- **Still open — the cascade half (`Verify:` step 3).** Whether deleting a time period cascades to the routine
  items assigned to it is a server contract this pass never established, and CLAUDE.md requires a cascading
  delete to state how many children go with it. Two consequences if it does cascade: `BasicTable`'s generic
  dialog cannot express a count, and it bypasses `useDeleteConfirmation` entirely — making `/routine-settings`
  a delete site outside the composable CLAUDE.md names as the sole owner of that decision. Escalated in
  `docs/views/_fix-queue.md`.

### B6. Hardcoded English tooltip text on the streak flame and the undo button
- **Status:** open
- **Severity:** bug
- **Where:** `src/core/todoList/component/routine/RoutineTodoListItem.vue:41-44` (streak tooltip: `Streak: {{
  }} | Best: {{ }}`, plus `| Grace period active!`) and `src/core/todoList/component/TodoListUndoBtn.vue:5`
  (tooltip: `` `Undo: ${nextUndoDescription}` `` / `'Nothing to undo'`) — both plain template string literals,
  not `$t()` calls.
- **Expected:** Tooltip text is user-facing and should be localized like every other string (CLAUDE.md).
- **Actual:** Hovering the streak flame on any routine item shows the literal English tooltip "Streak: 3 |
  Best: 9" regardless of account locale (reproduced live — see Evidence). `TodoListUndoBtn.vue`'s tooltip is
  the same class of literal, confirmed by source read; not independently reproduced in the browser this pass
  because the button was disabled throughout (no undo-eligible action occurred outside the accidental mutation
  noted below, and this pass avoided deliberately creating undo history).
- **Evidence:** Streak tooltip — reproduced live, screenshot taken during the pass (not saved to disk, but the
  tooltip text "Streak: 3 | Best: 9" was captured via a zoom screenshot and cross-checked against
  `RoutineTodoListItem.vue:41-44`, which has no `$t()` wrapper). Undo tooltip — **source read only, not
  reproduced in this pass** (button stayed disabled); downgrading confidence accordingly but keeping this at
  `bug` given the streak-tooltip half is fully confirmed and both share the identical defect shape in the same
  component family.
- **Repro:** 1. Go to `/routine-todo-list`. 2. Hover the flame icon next to any item with `streak > 0`. 3. Read
  the tooltip.
- **Verify:** 1. Hover the streak flame on any item. 2. **Pass condition:** the tooltip text is localized
  (changes with account locale), not the literal "Streak: N | Best: N". 3. Trigger a real undo-eligible action
  (e.g. a reorder) and confirm the undo button's tooltip is likewise localized.
- **Root cause guess:** Same class of gap as B4 — these two components were written without going through
  `_locales`.
- **Suggested fix:** Move both strings into `_locales/todoList.{sk,en}.ts` and call `$t()` with the
  interpolated values.

### B7. Reorder toggle button never changes its label, unlike the normal list's equivalent
- **Status:** fixed (round 2) — **not yet browser-verified**
- **Severity:** bug
- **Where:** `/routine-todo-list` toolbar — `src/core/todoList/view/RoutineToDoListView.vue:37-44`. The
  button's `:color`/`:variant` swap with `isInChangeOrderMode`, but its text is unconditionally
  `$t('routineTodoList.reorder')` ("Reorder") in both states.
- **Expected:** The normal list's equivalent control text-swaps between "CHANGE ORDER" and "FINISH REORDERING"
  depending on state (`docs/views/todo-lists/inventory.md`: "toggle button | text, changes label by state").
  Plain user sense (and WCAG's "don't convey state through colour alone") both say a mode-toggle button should
  say what clicking it will do, not just change colour.
- **Actual:** Confirmed by direct reproduction (this pass's own draft Playwright spec) — after clicking the
  button, a locator for `/finish reordering/i` never appears; the button's accessible name stays "Reorder"
  throughout, with only a colour/variant change (`secondaryOutline`/outlined → `secondary`/elevated)
  distinguishing the two states.
- **Evidence:** `npx playwright test tests/todo-routine.draft.spec.ts` — the "Reorder mode can be entered and
  exited" test failed with `getByRole('button', { name: /finish reordering/i })` not found; source read of
  `RoutineToDoListView.vue:43` confirms the label is not state-dependent.
- **Repro:** 1. Go to `/routine-todo-list`. 2. Click "Reorder". 3. Read the button's text — still "Reorder",
  only the colour changed.
- **Verify:** 1. Click "Reorder" on `/routine-todo-list`. 2. **Pass condition:** the button's text changes to
  something like "Finish reordering" while active, and back to "Reorder" on exit.
- **Root cause guess:** The routine view's reorder button was written independently of the normal list's
  `CHANGE ORDER`/`FINISH REORDERING` pair and never got the same state-dependent label.
- **Suggested fix:** Bind the button's text to `isInChangeOrderMode`, matching the normal list's pattern —
  reuse `toDoList.changeOrder`/`toDoList.finishReordering` if the wording should match, or add routine-specific
  equivalents under `routineTodoList.*`.
- **Fix applied (round 2):** `RoutineToDoListView.vue:43` now reads
  `isInChangeOrderMode ? $t('routineTodoList.finishReordering') : $t('routineTodoList.reorder')`. Took the
  second option — added `finishReordering` to the `routineTodoList` namespace in both locales rather than
  reaching into `toDoList.*` — so the view resolves one namespace, and the existing "Reorder" /
  "Zmeniť poradie" wording for the inactive state is preserved. SK text mirrors `toDoList.finishReordering`
  ("Dokončiť zoraďovanie").
- **Note for the retest round:** the unit's own draft spec already asserts this. A passing
  `npx playwright test tests/todo-routine.draft.spec.ts -g "Reorder mode"` *is* the verification — it is
  currently the test that fails on `getByRole('button', { name: /finish reordering/i })`.

### B8. `/routine-settings` is not listed on `/user/settings`
- **Status:** fixed (round 2) — **not yet browser-verified**
- **Severity:** bug
- **Filed retroactively during triage.** `inventory.md`'s RoutineSettingsView section recorded this defect and
  pointed at "Findings B4", but B4 is the localization finding — the cross-reference was dangling and the
  finding itself was never written up. Recovered as fix-queue batch F8 and written here so the round history
  stays honest.
- **Where:** `src/core/user/moduleSettingsLinks.ts` — the data list `ModuleSettingsSection.vue` renders
- **Expected:** CLAUDE.md, *Where a preference lives*: "Every settings page must be reachable from
  `/user/settings`. A module settings page links back to it, and `ModuleSettingsSection.vue` links out to each
  of them by route name only."
- **Actual:** `moduleSettingsLinks` contained only `dayPlannerSettings` and `reminderPreferences`.
  `/routine-settings` was reachable solely from the in-page "SETTINGS" button on `/routine-todo-list`, so the
  streak preferences it owns (threshold, grace days, reset anchor, history depth) were findable only by
  already being on the routine list. This also resolves `_routes.md`'s orphan-candidate question for this
  route: it is **not** dead — the SETTINGS button reaches it — it was simply missing from the settings index.
- **Evidence:** source read of `moduleSettingsLinks.ts` (two entries, neither `routineSettings`) against
  `todoList.routes.ts:26` (`name: 'routineSettings'`); `inventory.md:98`.
- **Repro:** 1. Go to `/user/settings`. 2. Look at the per-module settings list. 3. No routine entry.
- **Verify:** 1. Go to `/user/settings`. 2. **Pass condition:** a routine row appears in the per-module
  settings list and navigates to `/routine-settings`. 3. Confirm the label is localized in both locales (it is
  not one of `RoutineSettingsView`'s own hardcoded strings — those are B4).
- **Fix applied (round 2):** Added `{ routeName: 'routineSettings', labelKey: 'routine', icon: 'repeat' }` to
  `moduleSettingsLinks.ts`, plus `user.moduleSettings.routine` in `user.sk.ts` / `user.en.ts`. Route name
  only, per the file's own header comment — no import of the todoList module.
- **The judgement call, recorded rather than assumed.** `moduleSettingsLinks.ts` says entity-management
  screens do *not* belong there, only per-user preference pages, and `/routine-settings` is both: it manages
  time-period entities *and* owns per-user streak preferences. The preference half is what earns it a place;
  the reasoning is in a comment next to the entry so the next reader doesn't relitigate it.

### A1. Multi-count item counter (e.g. "0/2") has no accessible name
- **Status:** open
- **Severity:** a11y
- **Where:** `/routine-todo-list`, "Laundry" (Weekly group) — `TodoListItemCounter.vue`, shared with the normal
  list.
- **Expected:** Every interactive control needs a discoverable name (WAI-ARIA), same standard as the shell's
  A2/A3 and the sibling unit's A1/A2.
- **Actual:** `document.querySelectorAll('button')` scoped to the item row shows the counter button (rendered
  as a "0/2" chip or a dash/indeterminate glyph depending on hover state) with `aria-label: null`, `title: ""`,
  and no text content reachable outside the visual glyph.
- **Evidence:** JS console query on `/routine-todo-list`, "Laundry" row — button entry with `aria: null, text:
  ""` alongside correctly-named siblings ("Quick start timer", "More actions: Laundry") in the same row.
- **Repro:** 1. Go to `/routine-todo-list`. 2. Inspect the "0/2"-style counter on "Laundry" (Weekly group).
  3. Confirm no accessible name.
- **Verify:** 1. Load `/routine-todo-list`. 2. Inspect the counter control on a multi-count item. 3. **Pass
  condition:** it exposes a localized accessible name (e.g. "2 of 4 done, increment").
- **Root cause guess:** Same shared-component gap noted as `unverified` U2 in the sibling unit's findings —
  this pass confirms it as a real a11y defect rather than leaving it unverified, since the control's lack of a
  name was directly inspected here (the sibling pass only questioned its *click* behaviour, not its name).
- **Suggested fix:** Add a localized `aria-label` to `TodoListItemCounter.vue`'s root button.

### A2. Steps-expand chevron has no accessible name
- **Status:** open
- **Severity:** a11y
- **Where:** `/routine-todo-list`, any item with steps (e.g. "Meal Preparation", "Morning Exercise", "House
  Cleaning") — the chevron toggle in `BaseTodoListItem.vue`, shared with the normal list.
- **Expected:** Same standard as A1.
- **Actual:** The expand/collapse chevron button renders with no `aria-label`/`title`/text — confirmed via a
  DOM sweep of each item row's `<button>` elements, which found this as an unnamed third button on every
  stepped item, alongside the (correctly named) "Quick start timer" and "More actions: …" buttons.
- **Evidence:** JS console query on `/routine-todo-list` — "Meal Preparation", "Morning Exercise", "House
  Cleaning" rows each show one button with `aria: null, text: ""` beyond the two named ones.
- **Repro:** 1. Go to `/routine-todo-list`. 2. Inspect the "›" chevron on a stepped item (e.g. "Meal
  Preparation"). 3. Confirm no accessible name.
- **Verify:** 1. Load `/routine-todo-list`. 2. Inspect the steps-expand chevron on a stepped item. 3. **Pass
  condition:** it exposes a localized accessible name (e.g. "Show steps" / "Hide steps", changing with state).
- **Root cause guess:** Same shared-component icon-button-without-label class as A1 and the shell/sibling
  findings — batch together.
- **Suggested fix:** Add a localized, state-dependent `aria-label` to the chevron in `BaseTodoListItem.vue`.

### A3. Undo button has no accessible name
- **Status:** open
- **Severity:** a11y
- **Where:** `/routine-todo-list` top toolbar — `TodoListUndoBtn.vue`, shared with the normal list.
- **Expected:** Same standard as A1/A2. The button does carry a `VTooltip` with real (if unlocalized, see B6)
  text, but tooltip text is not the same as an accessible name.
- **Actual:** `find` and a DOM sweep both show the button with no text content, `aria-label`, or `title`.
  Because the button was disabled throughout this pass (no undo-eligible action taken), its tooltip could not
  be hovered to confirm a description is exposed via `aria-describedby` either — noted as a gap in both name
  and (unverified) description.
- **Evidence:** `mcp__claude-in-chrome__find` for "undo button" returned `button "(unnamed)"`; DOM sweep
  confirmed `aria-label: null, title: ""` on the same element.
- **Repro:** 1. Go to `/routine-todo-list`. 2. Inspect the circular-arrow button in the toolbar (right of
  "Reorder"). 3. Confirm no accessible name.
- **Verify:** 1. Load `/routine-todo-list`. 2. Inspect the undo button. 3. **Pass condition:** it exposes a
  localized accessible name reflecting its current state (e.g. "Undo: created Journaling" / "Nothing to
  undo").
- **Root cause guess:** Same class as A1/A2.
- **Suggested fix:** Bind the existing tooltip text to `aria-label` as well as the `VTooltip`, once B6 makes
  that text localized.

### P1. "Total count" label truncated to "Total co…" in the Add-routine-item dialog
- **Status:** open
- **Severity:** polish
- **Where:** `/routine-todo-list` → Add dialog → toggle "Is repeated" → the revealed `VNumberInput` stepper.
- **Expected:** A field's visible label should not clip under normal dialog width (610px dialog, plenty of
  horizontal room elsewhere in the same dialog).
- **Actual:** The label renders as "Total co…" — confirmed the **full** accessible name is still "Total count"
  (via `read_page`'s accessibility tree, `textbox "Total count"`), so this is a visual-only clipping bug, not
  an a11y one.
- **Evidence:** `docs/views/todo-routine/screenshots/routine-todo-list--add-dialog.png` region showing "Total
  co…"; `read_page` confirms the full label text underneath.
- **Repro:** 1. Go to `/routine-todo-list`. 2. Click "Add". 3. Toggle "Is repeated". 4. Read the stepper's
  label.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** the label reads "Total count" in full, not truncated.
- **Suggested fix:** Widen the `VNumberInput`'s container or shorten the label (e.g. "Count").

## Note on unintended seed-data mutation during this pass

While diagnosing B1, this pass inadvertently left "Meditation" (Daily group, item id 2)'s `streak` at 6 and
`lastCompletedAt` at a 2026-09-10 timestamp, instead of the pre-pass seed values (`streak: 5`,
`lastCompletedAt: 2026-09-09`). `isDone` itself was successfully restored to `false` (confirmed via a direct
API read), but the streak/last-completed advance triggered by the accidental completion could not be reverted
through the UI — no endpoint or undo path exists for it (see B1's root cause: the undo stack is never
populated by a done-toggle at all). Flagging this explicitly rather than silently leaving it: a later pass
using this same seed should expect Meditation's streak to read 6, not 5.

### U1. Weekly review card (R2) not reached — seed has zero elapsed periods
- **Status:** open
- **Severity:** unverified
- **Where:** `/routine-todo-list` — `RoutineWeeklyReviewCard.vue`, gated by
  `useRoutineGroups.ts:52-55`'s `reviewEligibleGroups` (`totalPeriodsElapsed > 0` per period).
- **What would verify it:** `GET /api/routine/settings` confirms `routineReviewDismissedForWeekStart: null`
  (never dismissed), so the card's absence is fully explained by every time period in this seed having 0
  elapsed periods — not a bug. To verify: seed at least one time period with `totalPeriodsElapsed > 0` and
  reload; confirm the card appears with Keep/Reduce frequency/Pause actions, and that "Reduce frequency" opens
  `TimePeriodForm` prefilled per the R2 intent doc.

### U2. Personal-bests panel, milestone streak icons, and populated heatmaps not reached — same seed gap
- **Status:** open
- **Severity:** unverified
- **Where:** `/routine-settings` — `PersonalBestsPanel.vue` (gated on `totalPeriodsElapsed > 0`, same condition
  as U1); `/routine-todo-list` — the star/trophy/gem/crown streak-milestone icons in `RoutineTodoListItem.vue`
  (`getMilestoneIcon`, thresholds 7/30/90/180/365 — the seed's highest item streak is 12, past the flame
  threshold but short of 30); the per-group and history-dialog completion heatmaps (`completionHistory` is `[]`
  for every time period in this seed).
- **What would verify it:** Seed data with (a) at least one time period with elapsed periods and completion
  history entries — populates the personal-bests panel, both heatmaps, and the consistency/trend surfaces on
  `RoutineGroupStats`; (b) at least one routine item with `streak >= 30` — confirms the star icon (and ideally
  ≥90/180/365 for the rest). Tracked here as one seed-data ask covering multiple otherwise-unreachable
  surfaces, matching the pattern of `docs/views/todo-lists/findings.md` O1/U3.
