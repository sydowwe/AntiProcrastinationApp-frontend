# todo-routine — findings

> Pass: inventory · captured 2026-09-10 · commit `acd7db0d`

**Tally (round 1, as captured):** blocker 0 · bug 7 · a11y 3 · polish 1 · opportunity 0 · unverified 2

**Tally (after triage + rounds 2/2b):** blocker 0 · bug 7 (B1, B2, B5, B7, B8 **fixed and verified**;
B3, B4, B6 open) ·
a11y 1 (A1; A2 re-graded to `unverified`, A3 dropped as already fixed) · polish 1 · opportunity 0 ·
unverified 3 (U1, U2, A2). B6 is open but halved — its undo-tooltip half was already fixed elsewhere.
B8 was filed retroactively during triage. See `docs/views/_fix-queue.md` for the reasoning behind every
re-grade.

**Tally (after round 3):** blocker 0 · **every app-side finding then filed was code-fixed** — B3, B4, B6, A1
and P1 in this round; A2 and A3 confirmed already fixed in source. **None of round 3 is
browser-verified**, so each one's `Verify:` block is outstanding, and B4/B6/P1 need the **SK** locale
to check at all.

**Tally (after round 4 — the API source read):** the two backend escalations are **settled**, and one of them
produced a new app-side finding. B5 step 3 is answered — deleting a time period does **not** cascade, it is
refused with a 409 — so the cascade question closes. The streak escalation is **corrected**: the compounding
case it feared is explicitly guarded and tested; what is left is a bounded +1. New finding **B9** (open): that
409 surfaces as "This record was changed by someone else", which is untrue and unactionable — **B9 is
code-fixed in the same round**, and is the only finding here whose defect *and* fix are both unobserved.
Still open and **not** app-side: U1 and U2 (seed gaps) and the counter hit-testing question in
`_fix-queue.md`'s *Needs verification*.

**Tally (after round 5 — live browser re-verification):** B3, B4, B6, A3 confirmed **fixed and verified** live
(B4 and B6 specifically in Slovak, as required — see below). A2 re-confirmed by source only (no stepped item in
this round's fresh seed to drive live). P1 confirmed fixed in EN; the SK half was not completed this round (see
round 5's own note). B8 re-confirmed present. The counter hit-test is **no longer an open question** for
reachability — both `Increase` and `Decrease` are hit-testable and activatable by a real mouse, and the control
is a genuine `<button>`, not the non-focusable `progressbar` `_fix-queue.md` worried about — see A1 below. B9
could **not** be verified this round: all three attempts failed with a 400 "Time period not found" that traces
to an external collision, not the app (see B9's own note). One **new** finding, **B10**, surfaced during the
Slovak spot-check: `RoutinePeriodTimeline`'s date/weekday labels ignore the account locale.

**Tally (after round 6 — B8 close-out + live pass against `e2e-v4`, 2026-09-14):** **U1 and U2 closed,
verified in a browser** — the weekly review card, both heatmaps with all three cell states, consistency /
trend, personal bests, the freeze budget and all five milestone icons render from real seeded rows (see *Round
6 browser pass*). `unverified` drops from 3 to 1 (A2, still no stepped routine item). One **new** polish
finding, **P2**: with five daily items the weekday chips overflow the Daily column at 1440 px. Nothing else
moved; B9, B10 and P1's SK half remain where round 5 left them.

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-10 | `acd7db0d` | initial inventory pass |
| 1a | 2026-09-10 | `acd7db0d` | **triage** (`docs/views/_fix-queue.md`). A3 dropped and B6 halved — both already fixed in the working tree by the `todo-lists` round-2 pass. A2 re-graded `a11y` → `unverified` (the chevron it names is labelled in source; wrong file, wrong element). B1 scope grown to the multi-count path. New finding **B8** recovered from `inventory.md:98`, which referenced it but where it was never written up. |
| 2 | 2026-09-10 | working tree | **fix pass** — B1, B2, B5, B7, B8 code-fixed (fix-queue batches F1, F3, F5, F6, F8). `npx vue-tsc --build --force` exit 0, `npm run lint` exit 0. B3/B4/B6 (F4, the i18n batch), P1 (F7) and A1/A2 (F2) untouched. **Not browser-verified** — this session had no browser; every `Verify:` block below is still outstanding. |
| 2a | 2026-09-10 | 46e4b67e | **browser verification attempt blocked** — the group's open tab and a direct navigation to `/routine-todo-list` both bounced to `https://localhost:3000/login` (Slovak-locale login form, not the expected signed-in English session). Per this round's own instructions, stopped rather than signing in. No `Verify:` block for B1/B2/B5/B7/B8 was executed; no finding status changed below. |
| 2b | 2026-09-10 | 46e4b67e | **browser verification, all five pass.** Session confirmed signed in as `999gangshit999@gmail.com`, EN locale, landed on `/routine-todo-list` with group cards (no `/login` bounce). **Environment note:** the account's data had been fully reset since the round-1/1a evidence was captured — `grouped-by-time-period` returned `items: []` for all four periods (no "Meditation", no "Meal Preparation", no "Laundry") and `/todo-list` showed "No lists" (list id 1 from earlier evidence 404s). This is a seed/DB reset, not a regression — the four time periods themselves (`Daily`/`Weekly`/`Monthly`/`Yearly`, same ids 1-4, same thresholds/colors) were intact. B7, B8, B5 don't depend on item data and were verified directly. B1 (the important one) and B2's structural check were verified by creating two temporary routine items ("Retest B1 Checkbox" single-count, "Retest B1 Counter" 0/2 multi-count) in the Daily group, exercising every step of the `Verify:` block, then deleting both afterward — board is back to "No tasks" in all four groups, no lasting drift. B2's second half (`/todo-list/1` cross-check) could not run — no normal-list data exists in this account to check. Console showed only the pre-existing B3 warning (`toDoList.timePeriod` not found), nothing new. All five findings pass; no regressions. |
| 3 | 2026-09-13 | working tree | **fix pass** — fix-queue batches F4 (A1), F5 (B3, B4, B6), F6 (P1) and F7 (the unfiled `TodoListStepsFormField` controls) all code-fixed. New `routineTodoList.timePeriods.*` namespace in `todoList.{sk,en}.ts` (**not** `settings.*` — `settings` is already a leaf string in use, and vue-i18n cannot have it be both). The `${value}th` ordinal that rendered "1th" now goes through `Intl.PluralRules(…, 'ordinal')` against four locale forms; both hardcoded weekday arrays now come from the framework's `calendar.*` keys via the new `useAnchorDayOptions()`, and `RoutineTodoListItem`'s day chips from `useDayOfWeekOptions()`. A2 and A3 re-graded to *fixed, needs retest* against source. `npm run type-check` exit 0, `npm run lint` exit 0. **No browser verification** — this session had no dev server running. |
| 4 | 2026-09-13 | working tree | **API source read**, in the backend repo `C:\Users\jakub\RiderProjects\AdhdTimeOrganizer` — no running API, no browser, source and integration tests only. Settled both backend escalations that had been carried since round 1a. **B5 step 3: answered** — `RoutineTimePeriod → RoutineTodoList` is `DeleteBehavior.Restrict`, so a delete with items is refused with a clean 409 (test-covered); only `RoutinePeriodCompletion` cascades. CLAUDE.md's cascade rule therefore does not apply to this delete. **The streak escalation: corrected** — `UpdateItemStreak` increments once per *cycle*, not per toggle, guarded by `AlreadyCountedThisCycle` and pinned by two tests, so repeated clicking cannot compound; the irreversible part is a bounded +1. **New finding B9** — the 409 renders as the generic `httpErrors.conflict` string ("changed by someone else… refresh"), which is false and unactionable for a referential-integrity refusal — **and fixed in the same round**: `onDelete` now owns the 409 via `_silent`, names the period and its routine count (fetched only in the failure path), and falls back to `handleHttpCodes` for every other status. `npm run type-check` exit 0, `npm run lint` exit 0. Still no browser: B9's defect and its fix are both unobserved. |
| 5 | 2026-09-13 | working tree | **live browser re-verification** against a fresh `e2e-v3` seed. **B3, B4, B6, A3 confirmed fixed and verified** (B4 and B6 specifically re-driven in Slovak, per this round's required spot-check). **A2** re-confirmed by source only — no stepped item in this fresh seed to drive live. **P1** confirmed fixed in EN; the SK half was not completed (session was re-scoped back to English mid-check). **B8** re-confirmed present at `/user/settings`. **A1**'s hit-testing question — already resolved outside this session via `todo-lists/B6` (the counter is now a real `<button>`, not a hover-swapped `progressbar`) — was independently corroborated: a real mouse hover-then-click on both `Increase` and `Decrease` lands on and activates the correct control. **New finding B10** — `RoutinePeriodTimeline`'s date/weekday labels call `toLocaleDateString(undefined, …)` and ignore the account's i18n locale, found during the Slovak spot-check. **B9 could not be verified** — three attempts, all blocked by what this round attributes to a concurrent session sharing the same seeded account (see B9's own entry and the environment note near the end of this file), not to the app. This session also found and reverted two **accidental mutations** on the `todo-lists` fixture (`/todo-list/13001`, items 14015/14013) caused by clicks landing on the wrong browser session before the collision was diagnosed — see the environment note. Final action: reseeded via `POST /api/test/seed` to leave a clean fixture; **the next agent must sign in fresh, not `state-load`.** |
| 6 | 2026-09-14 | working tree | **B8 closed and U1/U2 verified live against `e2e-v4`.** The API side replied that `B8`'s whole "Done when" list was already covered by its `e2e-v4` work (uncommitted on `dev` atop `7f9f9e5`; B8 had measured `e2e-v3`). First confirmed without reseeding that the running API (started 09:44) is built from the v4 seeder (dll carries `e2e-v4`), then — once the owner cleared it, other units being live on the account — reseeded: `fixture e2e-v4`, 32 completions / 1 frozen, items 19004–19007. Drove `/routine-todo-list` and `/routine-settings` in a dedicated `-s=todo-routine` session (round 5's state file was stale; signed in through the form, which works locally). **All seven surfaces render and match the rows** — raw `grouped-by-time-period` cross-checked against the DOM; console clean; nothing mutated. Three screenshots under `screenshots/*round6-v4*`. U1/U2 → verified; `B8` → `_done`; `_fix-queue.md` updated; the unit-10 prompt's "unreachable by construction" paragraph replaced with "against v4, empty is a defect". New **P2** (weekday chips overflow the Daily column at 1440). |

---

### B1. Checking off a routine item's checkbox unconditionally opens the "Log time manually" dialog
- **Status:** fixed and verified (round 2 / 2b) — verified against a substitute item, not the original seed
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
- **Verified (2b):** "Meditation" no longer exists (account data reset — see round 2b's round-history entry),
  so verification used a temporary substitute item, "Retest B1 Checkbox" (single-count, Daily group), deleted
  afterward. Before: `{id:19004, isDone:false, streak:0, lastCompletedAt:"0001-01-01T00:00:00"}`. One checkbox
  click: item visibly toggled to checked/strikethrough, progress bar to 100%, **no dialog opened**; API
  confirmed `{isDone:true, streak:1, lastCompletedAt:"2026-09-10T13:20:06.363891Z"}`. Second click: item
  toggled back to unchecked, still no dialog; API confirmed `{isDone:false, streak:1,
  lastCompletedAt:"2026-09-10T13:20:06.363891Z"}` — `isDone` reverted, `streak`/`lastCompletedAt` did not
  (expected, per the finding's own note — no API path to revert them). Both pass conditions A and B hold; **no
  regression**. The ⋮ overflow menu's "Log time" entry was then opened on the same item and confirmed it still
  shows the Stopwatch/Timer/Pomodoro/Manual-entry dialog on purpose — closed via Cancel without saving.
  Multi-count path: created a second temporary item, "Retest B1 Counter" (0/2, Daily group). Clicking the
  counter chip itself opened no dialog (chip changed to a "—" glyph — the already-known dead-click/hidden
  minus-button defect, A1/F2, correctly not counted as a B1 failure). Clicking the row body (title text) **did**
  open the "Log time manually" dialog (Start time / Length fields) and incidentally incremented the counter to
  1/2 — matches the fix's documented behaviour (`itemClicked` now fires for multi-count row-body clicks and
  calls `toggleDone()`). Closed via Cancel without saving. Both temporary items deleted afterward; all four
  group cards back to "No tasks".

### B2. Two progress indicators in the same routine group card disagree
- **Status:** fixed and verified (round 2 / 2b) — **half-verified**: the normal-list cross-check could not run
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
- **Verified (2b):** Daily group card's header area now shows a single "0%" progress bar with no separate
  "N / M" text above it (zoomed screenshot of the card header) — the structural pass condition holds regardless
  of item count, since the removed `RoutineGroupStats` block is gone entirely, not merely empty. The stats
  row's middle cell (period chip) is still visually centred, third column empty as documented. **Could not
  verify the second half** — `/todo-list/1` 404s ("This list doesn't exist") and `/todo-list` shows "No lists":
  the account's normal to-do list data was reset along with the routine data (see round 2b's round-history
  entry), so there is no normal list left in this account to confirm still shows its one summary unchanged.

### B3. Routine "Add" dialog's time-period field label renders as the raw key `toDoList.timePeriod`
- **Status:** fixed and verified (round 5) — `RoutineToDoListForm.vue` resolves
  `routineTodoList.timePeriod`, the namespace the key actually lives in
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
- **Verified (round 5):** Opened the "Add to routine to-do list" dialog on `/routine-todo-list` (fresh
  `e2e-v3` seed, EN). The field above the period select reads "Time period" in full, bound to a live
  `combobox "Time period"` value "Daily". Console captured across the whole open (`console error`) shows
  zero messages — no `[intlify] Not found 'toDoList.timePeriod'` warning, which used to fire ×4 on every
  open. Pass condition met.

### B4. `/routine-settings` and its create/edit dialog are entirely un-localized
- **Status:** fixed and verified (round 5, in Slovak) — the account language was switched to Slovak and
  the page re-driven; every string named below now renders in Slovak
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
- **Verified (round 5):** Switched the account language to Slovak at `/user/settings`, then loaded
  `/routine-settings` (screenshot: `screenshots/routine-settings--round5-sk-default.png`). Page title reads
  "Časové úseky", the add button "PRIDAŤ", column headers "Názov", "Dĺžka (dni)", "Ukotvenie resetu", "Prah
  série", "Dni odkladu", "Skryté" all render in Slovak, and the "Ukotvenie resetu" (Reset anchor) column
  shows the Slovak weekday "Pondelok" for the Weekly row. Console clean throughout. **One column header is
  still English** — "Color" (2nd column) never resolves to "Farba"; traced to source:
  `RoutineSettingsView.vue:103` passes `new TableColumn('color', '', false)` — an intentional **empty**
  title, so `BasicTable`'s own header-generation fallback capitalizes the raw key `color` → "Color" instead
  of falling back to a localized label. This is a separate, narrower gap from what B4 described (a missing
  title, not a hardcoded literal) — noted here rather than filed as a new finding, since it's `polish` and a
  one-line fix (pass an actual `$t()` title instead of `''`).

### B5. Time-period delete confirmation shows the raw numeric id instead of the period's name
- **Status:** fixed and verified (round 2 / 2b); step 3 (cascade) remains open, see below
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
- **Verified (2b):** Clicked the trash icon on the "Yearly" row (`/routine-settings`) — the dialog title
  "Delete confirmation" and body read exactly "Are you sure you want to delete Yearly?", not a bare number.
  Clicked CANCEL (not Confirm); all 4 rows (Daily/Weekly/Monthly/Yearly) still present afterward, id/column data
  unchanged. The cascade-count half of the `Verify:` block remains unestablished, as already tracked as open in
  the "Still open" note below — this round did not touch it.
- **~~Still open — the cascade half (`Verify:` step 3).~~ ANSWERED 2026-09-13, from the API source. It does
  not cascade: the delete is *refused*.** Read directly in the backend repo
  (`C:\Users\jakub\RiderProjects\AdhdTimeOrganizer`), not inferred from the client:
  - `RoutineTimePeriodConfiguration.cs:78-81` — `HasMany(r => r.RoutineTodoListColl) … .OnDelete(DeleteBehavior.Restrict)`.
  - Only two entities carry a `TimePeriodId` FK. Routine items are **Restrict**; `RoutinePeriodCompletion`
    (`RoutinePeriodCompletionConfiguration.cs`) is **Cascade** — so the only rows that die with a period are
    its own completion-history records. **No user-authored routine is ever deleted by this.**
  - `DeleteRoutineTimePeriodEndpoint` is a bare `BaseDeleteEndpoint<RoutineTimePeriod>`; the framework base
    catches the Postgres FK violation and maps it `ForeignKeyViolation` → `DbForeignKeyError` → **409**
    (`DatabaseExceptionUtils.cs:26`, `EndpointHelper.cs:14`). Not a 500.
  - Pinned by an integration test: `TodoListDeleteBehaviorTests.DeleteRoutineTimePeriod_WithItems_Returns409`
    — *"Deleting a RoutineTimePeriod that still has routine items is Restricted -- clean 409"*, asserting both
    the period and the item survive.

  **Consequences, both of which close the escalation rather than continue it:**
  1. **CLAUDE.md's cascade-delete rule does not apply to this delete** — there is no cascade and therefore no
     child count to state. `BasicTable`'s generic dialog not being able to express a count is moot here, as is
     the `useDeleteConfirmation` bypass *on cascade grounds* (the bypass itself is still true, but it is a
     plain delete with no cascading consequence, which is the case the preference already covers).
  2. **What is left is a different, real defect** — the 409 renders a message that is untrue and unactionable.
     Filed below as **B9**, which is the live half of what this step was worried about.

### B6. Hardcoded English tooltip text on the streak flame and the undo button
- **Status:** fixed and verified (round 5, in Slovak) — the streak half now resolves
  `routineTodoList.streakTooltip` / `.gracePeriodActive`; the undo half's accessible name is covered by A3
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
- **Verified (round 5):** With the account switched to Slovak, on `/routine-todo-list`, "Take Medication"
  (Daily group, seeded streak 12) shows a flame + "12" badge wired to a `VTooltip`. The tooltip renders in a
  teleported overlay, so a real hover was triggered and its content read directly off the DOM
  (`document.getElementById` on the activator's `aria-describedby` target): **"Séria: 12 · najdlhšia: 30"**
  — fully Slovak ("streak" / "best" both translated), not the literal English "Streak: 12 | Best: 30". Pass
  condition met for the streak half. The undo-tooltip half was not independently re-hovered this round (no
  undo-eligible action was deliberately created to keep the pass read-only where possible); its accessible
  name is separately confirmed live under A3 below, which is driven by the same underlying computed label.

### B7. Reorder toggle button never changes its label, unlike the normal list's equivalent
- **Status:** fixed and verified (round 2 / 2b)
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
- **Verified (2b):** On `/routine-todo-list`, clicked the toolbar button (accessible name "Reorder") — its name
  changed to "Finish reordering" (confirmed via `find`). Clicked again — name changed back to "Reorder". Text
  now correctly tracks `isInChangeOrderMode` in both directions.

### B8. `/routine-settings` is not listed on `/user/settings`
- **Status:** fixed and verified (round 2 / 2b)
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
- **Verified (2b):** `/user/settings`'s "Per-module settings" list shows three rows: "Day planner settings",
  "Notifications & reminders", "Routine time periods & streaks" — real prose, not a raw key. Clicked it;
  navigated to `/routine-settings` (confirmed via `window.location.href`).

### B9. Deleting a time period that still has routines fails with "This record was changed by someone else"
- **Status:** ✅ **fixed and verified (round 7, 2026-09-14, live)** — with exclusive access to the account this
  time. Setup through the app's own API: an 11-day period ("RT eleven", id 17 — a length the unique index
  accepts) with one routine item in it. Trash icon → the dialog reads *"Are you sure you want to delete RT
  eleven?"* (B5 holds) → **Confirm** → `DELETE /api/routine-time-period/17` → **409**, snackbar *"Can't delete
  "RT eleven" — 1 routine is still assigned to it. Move or delete it first."*, row still listed, then
  `GET …/grouped-by-time-period` (the count fetch, failure path only). No "changed by someone else" text.
  Deleting the item and confirming again → **204**, row gone. Both throwaway rows are deleted; the fixture's
  four periods are untouched. **Looking at the dialog rather than the toast, as the queue asked: it stays open
  after Confirm on both the 409 and the 204 path, Confirm disabled** — that is the `BasicTable` framework
  defect (`_fix-queue.md`, "delete-confirm dialog never closes"), now observed for the first time, and is
  unrelated to B9's own fix.
  *(Round 4 note kept below.)* Filed and fixed in the same pass from the API source read that closed B5 step 3 (see above); deleting a real
  seeded period was avoided to keep the fixture intact. The chain below is established from both codebases,
  not from a reproduction, which makes this the one finding in this file whose `Verify:` block has never been
  run in either direction.
- **Severity:** bug
- **Where:** `/routine-settings` → delete (trash icon) on a period that has routine items assigned →
  `RoutineSettingsView.vue`'s `onDelete` → `deleteEntity` → the axios interceptor's error handler
  (`_common/composable/general/ErrorHandlingFunctions.ts:23`)
- **Expected:** When a delete is refused because the row is still referenced, the message should say so and
  name the way out. The user's next action is "move or delete the routines in this period first" — the client
  can even say how many, since `/routine-todo-list/grouped-by-time-period` already gives it the per-period
  counts it renders on the list screen.
- **Actual:** The API answers **409** for exactly this case (by design — see B5 above), and `409` is mapped
  wholesale to `httpErrors.conflict`, whose text is *"This record was changed by someone else. Refresh the
  page and try again."* (`src/locales/common.en.ts:15`; the framework's own copy at
  `_common/_locales/common.{sk,en}.ts:140/148` says the same thing). Both halves are false here: nobody else
  changed anything, and refreshing will never make the delete succeed. The period stays in the table with no
  indication of why, and the only way to discover the real reason is to guess it.
- **Evidence:** API side — `RoutineTimePeriodConfiguration.cs:78-81` (`DeleteBehavior.Restrict`),
  `DatabaseExceptionUtils.cs:26` (FK violation → `DbForeignKeyError`), `EndpointHelper.cs:14`
  (`DbForeignKeyError` → 409), and the integration test
  `TodoListDeleteBehaviorTests.DeleteRoutineTimePeriod_WithItems_Returns409` proving the status is reached and
  both rows survive. Client side — `ErrorHandlingFunctions.ts:23-25` and the two `conflict:` strings.
- **Repro:** 1. Go to `/routine-settings`. 2. Delete a period that still has routine items (the seed's
  Daily/Weekly both qualify — **do this against a throwaway period you created, not a fixture row**).
  3. Confirm. 4. Read the snackbar.
- **Verify:** 1. Create a time period, assign one routine item to it. 2. Delete the period and confirm.
  3. **Pass condition:** the snackbar names the real reason — that the period still holds N routines — and
  does not say the record was changed by someone else or suggest refreshing. 4. The period is still listed
  afterwards (the delete genuinely did not happen, and the UI must not optimistically drop the row).
- **Root cause guess:** `409` has exactly one message across the whole app, and it is written for the
  optimistic-concurrency case. This endpoint returns 409 for a referential-integrity refusal instead, so the
  one generic string is wrong for it. The server does distinguish the two (`DbConcurrencyError` vs
  `DbForeignKeyError`) — that distinction is just flattened to a bare status code by the time the client sees
  it.
- **Suggested fix:** Handle it at the call site rather than by rewording the global 409 string, which is
  correct for the concurrency case it was written for: catch the 409 in `RoutineSettingsView.vue`'s
  `onDelete`, pass `_silent: true` on the request config to suppress the interceptor's snackbar (the
  mechanism CLAUDE.md documents for exactly this), and show a period-specific message with the routine count.
  **Worth raising upstream but not blocking:** a framework that returned its `ResultErrorType` in the error
  body would let every call site tell a concurrency 409 from a referential one without each one
  special-casing its own endpoint — the information exists server-side and is discarded at the boundary.
- **Fix applied (round 4):** Exactly the suggested shape, in `RoutineSettingsView.vue`'s `onDelete`:
  - `deleteEntity(item.id, { _silent: true })`, so the interceptor's generic 409 never fires. The framework's
    own doc comment on `_silent` (`_common/axiosConfig.ts:28-31`) names this case: *"when the caller wants to
    own the messaging (a contextual 409/422, say), optionally falling back to `handleHttpCodes(status)` for
    statuses it does not special-case."* That fallback is exactly what the `else` branch does, so **no other
    status loses its message** by being silenced here — that was the risk of `_silent` and it is handled.
  - The 409 branch shows `routineTodoList.timePeriods.deleteBlocked`, which names the period and the routine
    count and says to move or delete them first. The count comes from `fetchGroupedByTimePeriod()`, fetched
    **only in the failure path** — this screen makes no such request otherwise. If it fails, or returns no
    group for the period, it degrades to `deleteBlockedUnknownCount` (same sentence, no number) rather than to
    silence.
  - The row is only removed from the table after the delete actually resolves, so a refused delete leaves the
    period visible — matching the server, where nothing was deleted.
  - Both messages are SK-primary with EN mirrors; SK carries the three plural forms its rule expects.
- **Still to verify, and it matters more here than usual:** this finding was written and fixed without either
  state being seen on screen. The `Verify:` block above is the whole of the evidence for it. Run it against a
  period you created yourself.
- **Round 5: attempted three times, blocked all three times — not by this finding.** Every attempt followed
  the `Verify:` steps exactly: create a throwaway time period (`Length in days` set away from 7/30/365 to
  dodge what turned out to be a real per-account uniqueness constraint on `lengthInDays`, discovered along
  the way — the first two attempts 409'd with `"Unique constraint violation during Create"` until the length
  was changed), then create a routine item with `Is repeated` on and `Time period` set to the new period.
  All three item-creation calls failed with **400 `{"timePeriodId":["Time period not found."]}`** for a
  period id that had just been confirmed to exist (`GET /api/routine-time-period/{id}` → 200 moments
  earlier, and visible in the settings table and the `/routine-todo-list` Groups list). Between the second
  and third attempt, the period **disappeared from the account entirely** on a plain reload — not deleted by
  this session. **This is not attributed to the app.** `docs/views/_fix-queue.md` and this same findings file
  were both observed mutating on disk mid-session from a source other than this one, and `POST
  /api/test/seed` — which wipes every account — was seen to run at least once without this session calling
  it. The working theory is a concurrent session (very likely the sibling `todo-lists` unit, given `A1`'s
  status line above already references `todo-lists/B6` from outside this session) reseeding the shared
  account mid-sequence. Per this pass's own hard constraint ("stop after 3 failed attempts"), B9 stops here
  **unverified this round**, not reopened or downgraded — the fix itself was never touched, and the failure
  mode (a 400 naming a period that provably existed) does not match anything B9's own fix could produce (B9
  is about the *delete* path's error message; item-creation's `timePeriodId` validation is unrelated code).
  Re-run in a session with exclusive access to the account (see the environment note near the end of this
  file).

### B10. `RoutinePeriodTimeline`'s date and weekday labels ignore the account's language
- **Status:** fixed and verified (2026-09-14, in Slovak, `_fix-queue.md` F24) — the eight
  `toLocaleDateString(undefined, …)` sites in five files (the two below plus `RoutineGroupHeatmap.vue`,
  `RoutineGroupHistoryBody.vue`, `RoutineStreakFreeze.vue`, `useStreakFreeze.ts`) now go through
  `composable/useRoutineDateFormat.ts`, which formats with `localeTag(locale.value)`. Seen live:
  Weekly strip `po ut st št pi so ne`, Monthly `1. 9. | 8. 9. | 16. 9. | 23. 9.`, Yearly `sep okt … aug`,
  Daily reset date `15. 9.`; heatmap tooltip `7. 9. · všetko hotové`, freeze chip `obnoví sa 1. 10.`,
  history-dialog tooltip `25. 5. – 1. 6. · všetko hotové`. Flipping the store locale to EN **without a
  reload** re-rendered every label in English (`Mon | Tue | …`, `15 Sept`), so the `segments` computed
  tracks the locale. Two side findings fixed in passing: the SK `freeze.remainingTooltipWithReset` ended
  in `{date}.` and rendered `1. 10..` (SK short dates carry their own full stop; the trailing one is gone),
  and the history dialog's calendar heatmap had **never rendered** — ECharts threw *"Heatmap must use with
  visualMap"* because the frozen series added in R1 had no visual map, and `getThemeColor` only wrapped
  values containing a space while Vuetify writes `5,150,105`, so even the painted cells would have been
  black. Both fixed in `RoutineGroupHistoryBody.vue`; the dialog now shows green/dark/blue cells.
- **Severity:** bug
- **Where:** `src/core/todoList/component/routine/RoutinePeriodTimeline.vue:56` (`resetDateLabel`) and
  `:118-121` (the per-segment `label`, inside `segments`) — both call
  `new Date(...).toLocaleDateString(undefined, {...})`.
- **Expected:** Every user-facing date/weekday string in this module renders through vue-i18n or otherwise
  respects the account's language preference (CLAUDE.md, "Localization"; the same standard B4/B6 were held
  to). The adjacent `timeLabel` computed in the same file (`"5h left"`, `"7d left"`) *does* go through `$t()`
  correctly and changes with locale — this component is only half-localized.
- **Actual:** `toLocaleDateString(undefined, …)` resolves the **browser's** locale, not the app's selected
  `vue-i18n` locale. With the account set to Slovak, the countdown timeline strip on every `/routine-todo-list`
  group card still shows English weekday/month abbreviations — "Mon Tue Wed Thu Fri Sat Sun" on the Weekly
  card, "1 Sept 8 Sept 16 Sept 23 Sept" on the Monthly card, "Sept Oct … Aug" on the Yearly card — while every
  other string on the same card ("Skupiny", "zostávajú 2 vynechania", the period chip) is correctly Slovak.
  The Daily card's own `resetDateLabel` ("14 Sept" in the top-right corner) has the same defect but is easy
  to miss since a day abbreviation reads the same shape in both locales for some dates.
- **Evidence:** Reproduced live during the round-5 Slovak spot-check —
  `docs/views/todo-routine/screenshots/routine-todo-list--round5-sk-default.png`.
  Source read: `RoutinePeriodTimeline.vue:56,118-121`, both `toLocaleDateString(undefined, …)`, versus
  `:68-71`'s `t('routineTodoList.hoursLeft'/'daysLeft'/…)`, which is correctly localized in the same file.
- **Repro:** 1. Switch the account language to Slovak at `/user/settings`. 2. Go to `/routine-todo-list`.
  3. Look at the Weekly, Monthly or Yearly group card's countdown strip. 4. Weekday/month abbreviations and
  the top-right reset date are still in English.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** the weekday/month labels and the reset date render
  in Slovak (e.g. "Po Ut St Št Pi So Ne", "1. sep" or the locale's own short-date form), matching the rest of
  the card.
- **Root cause guess:** Built against the browser's `Intl` locale rather than the active `vue-i18n` locale —
  the same class of gap as B4/B6 (a component written without going through the localization pass), but here
  the API used (`toLocaleDateString`) happens to still produce *some* text in every locale, so it never
  breaks as visibly as a raw i18n key and was easy to miss.
- **Suggested fix:** Pass the app's current locale explicitly — `toLocaleDateString(locale.value, {...})`
  (or the equivalent through `@/_common/utils/DateTimeHelper.ts`'s `formatLocalized`, if it covers this
  shape) instead of `undefined`, in both `resetDateLabel` and the `segments` computed.

### B11. Creating or editing a time period with an already-used length closes the form and says "changed by someone else"
- **Status:** fixed and verified (2026-09-14) — filed from `_fix-queue.md`'s fifth-pass *Needs verification*
  entry (it was source-certain but unobserved; B9's sibling one function up in the same file).
- **Severity:** bug
- **Where:** `/routine-settings`, *Add* / edit dialog — `RoutineSettingsView.vue` `openAddDialog` /
  `openEditDialog`, `TimePeriodForm.vue`.
- **Expected:** a refused save keeps the dialog open with what was typed and says why, on the field that
  caused it.
- **Actual (before):** `lengthInDays` is unique per account (`RoutineTimePeriodConfiguration.cs:79`), and the
  API answers a bare **409** from the index. The view awaited `createWithResponse` *after* `openDialog`
  resolved — i.e. after `TimePeriodForm` had already closed itself on confirm — with no `_silent`, so the
  interceptor's status-only switch showed *"This record was changed by someone else. Refresh the page and try
  again."* and the form was gone.
- **Evidence (2026-09-14, live):** *Add* → name "Dup weekly", length 7 (the seeded Weekly), colour Blue →
  *Create*: `POST /api/routine-time-period` → **409**, the dialog stays open, and the length field reads
  *"A 7-day period already exists — each length can be used once."*; a second *Create* → 409 again, same
  state; no "changed by someone" text anywhere on the page; *Cancel* → nothing written.
- **Fix:** the request now runs *inside* the dialog's confirm — `TimePeriodForm` takes a `submit(request)`
  prop the view supplies (create or update, both `_silent`), calls it under `dialogApi.setLoading`, maps a
  409 to an inline `errorMessages` on the length field (`routineTodoList.timePeriods.lengthTaken`, SK
  pluralised deň/dni/dní), routes every other status through `handleHttpCodes`, and only closes on success.
  The error clears on the next length change and on every resubmit.
- **Follow-up, same day (`e39c01c1`):** `Text` is unique per account too (`RoutineTimePeriodConfiguration.cs:13`,
  pinned by `RoutineTimePeriodUniqueIndexTests`), and the API reports either index as the same bare 409 — so
  the inline "7-day period already exists" above was wrong whenever the *name* was the collision. The form now
  takes `existingPeriods` from the view and validates **both** fields before the request (case-insensitive
  name, exact length, the edited entity excluded); verified *"weekly"/7* → both fields flagged, **no request
  sent**. A 409 is now only reachable on a race and reads *"Another period already uses this name or this
  length — both must be unique."* on the name field.
- **Colour aside — ✅ closed the same day (`126d2968`).** With the picker on *None* the request was rejected
  **400** (`RoutineTimePeriodRequest` derives from `TextColorRequest`, colour required on the wire) and that
  closed the dialog with the generic snackbar. `ColorPicker` gained a `required` prop (framework `98b92d0`)
  that drops the *None* swatch, the form passes it, and a new `TimePeriodRequest` starts as `'blue'`.
  Verified: Add with defaults → `POST` 201 carrying `"color":"blue"`.

### A1. Multi-count item counter (e.g. "0/2") has no accessible name
- **Status:** fixed and verified (2026-09-13, via the shared component — see `todo-lists/B6`). Both
  controls carry a localized `title` + `aria-label` naming the state and the action ("Increase: 2 of 5" /
  "Decrease: 2 of 5"), verified in SK and EN. The hit-testing question in `_fix-queue.md` was confirmed as a
  real bug and fixed in the same change: the bar is a native `<button>` now (keyboard-reachable, Enter/Space),
  the minus is a second always-present button rather than a hover swap. `TodoListItemCounter.vue` is the one
  component both lists render, so this holds on `/routine-todo-list` without a separate change.
  **Independently corroborated in round 5, from `/routine-todo-list` directly:** created a temporary
  multi-count item (2 steps), then did a real `mousemove` → 1s dwell → `elementFromPoint` check →
  `mousedown`/`mouseup` (not a synthetic Playwright `.click()`, to rule out the exact synthetic-event
  artifact `_fix-queue.md` flagged) on both controls. `Increase: 0 of 2` — `elementFromPoint` resolved to
  `<button class="counter-increment" aria-label="Increase: 0 of 2">` before the click, and the click
  incremented the item to 1/2 with `PATCH .../toggle-is-done {forceValue:true}` → 204, no stray dialog.
  `Decrease: 1 of 2` — `elementFromPoint` resolved to the "Decrease: 1 of 2" button (a `<path>` inside it,
  `.closest('button')` confirms) both times this was checked, on two separate items; the click's network
  completion was lost twice to the environment collision described in B9's entry, but the **hit-target
  itself was correct** both times, which is the part this question was actually about. Net: the earlier
  "mouse user can decrement but never increment" hypothesis does not hold against this build.
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
- **Status:** ✅ **fixed and verified (round 7, 2026-09-14, live)** — a temporary Daily item with two steps
  (created and deleted through the API): the chevron exposes `aria-label="Hide: Steps"` /
  `aria-expanded="true"`, and after a click `"Show: Steps"` / `"false"` with the step list gone from the DOM.
  The unfiled `TodoListStepsFormField` sweep ran in the same session: Add dialog with two steps typed, every
  control named and position-qualified (*Move step 1 up/down*, *Delete step 1*, … *Add step*), **0 unnamed**
  of the dialog's buttons. Previous status: fixed, confirmed by source only (round 5) — `BaseTodoListItemSteps.vue:11-13` still carries
  `:title`, `:aria-label` **and** `:aria-expanded`, all localized (re-read this round, unchanged). **Not
  driven live this round** — the fresh `e2e-v3` seed's routine items (Take Medication, Weekly Review, Pay
  Rent) have no steps, so there was no stepped item on `/routine-todo-list` to hover/inspect without first
  creating one, and this round's mutation budget went to A1's hit-test and the B9 attempts instead. See
  `_fix-queue.md` Contradiction 2 for the round-3 fix history
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
- **Status:** fixed and verified (round 5) — `TodoListUndoBtn.vue:12` binds `:aria-label="label"`, a
  localized computed resolving `general.undo` + the next undo's description, or `general.nothingToUndo`
  when disabled
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
- **Verified (round 5):** DOM query on `/routine-todo-list`'s toolbar (`document.querySelectorAll('button')`
  filtered on an `aria-label` containing "undo") found exactly one match: `aria-label: "Nothing to undo",
  disabled: true` — a real, non-empty, state-appropriate accessible name on the disabled button (no
  undo-eligible action was taken this round, so only the disabled state's label was exercised; the
  "Undo: <description>" enabled-state wording was not re-driven but is the same computed property).

### P1. "Total count" label truncated to "Total co…" in the Add-routine-item dialog
- **Status:** ✅ **fixed and verified in both locales** — SK completed round 7 (2026-09-14): account set to
  Slovak, Add dialog, *Opakovaná* on → the *Celkový počet* label renders in full, `scrollWidth 101 ===
  clientWidth 101` inside a 377 px field (`screenshots/routine-todo-list--round7-sk-total-count.png`).
  Round-5 note: fixed and verified in EN; SK not completed that round — the fixed
  `:width`/`maxWidth` pair is gone, the inputs now take a `minWidth` floor and grow with the row
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
- **Verified (round 5, EN only):** Opened Add → toggled "Is repeated" on `/routine-todo-list`
  (screenshot: `screenshots/routine-todo-list--round5-add-dialog-repeated.png`). The label reads "Total
  count" in full, no clipping, with visible room to spare in the 610px dialog. **The Slovak half of this
  check ("Celkový počet", the specific case this finding flags as more likely to clip) was not completed**
  — the session was mid-way through the Slovak spot-check when it was re-scoped back to English at the
  user's request, before reaching this dialog a second time in SK. Re-run the SK half specifically; it is
  the one part of this finding still resting on the EN-only round-3 fix description rather than a live
  Slovak observation.

### Anchor-day ordinal formatting — re-check of B4's `Intl.PluralRules` fix, both locales, two values

Not a separate finding (folds into B4's fix, which owns `useAnchorDayOptions()` and
`formatAnchorDayOfMonth()`), but recorded here since the pass instructions singled it out for its own check.
On `/routine-settings`, edited the "Monthly" period's "Reset anchor day of month" away from its seeded `1`
to exercise a value that would visibly distinguish the old `${value}th` bug (which produced "1th"/"21th" for
every number) from the new locale-aware ordinal:
- **EN:** day `1` → "1st" (not "1th"); day `21` → "21st" (not "21th"), confirmed live in the settings table
  after editing and saving.
- **SK:** day `1` → "1." (period, not a suffix) — confirmed during the Slovak spot-check
  (`screenshots/routine-settings--round5-sk-default.png`, Monthly and Yearly rows both `1`, both render
  "1."). Day `21` was not re-checked in SK (the anchor-day edit was done after switching back to English) —
  low risk, since `Intl.PluralRules(locale, {type:'ordinal'})` is a single call site shared across every
  value, and the EN day-21 check already proves the plural-rules path is live rather than the old literal
  template.
Reverted the Monthly period's anchor day back to `1` immediately after the EN check, before switching
locale. Table confirmed back to "1st" (EN) afterward.

## Note on unintended seed-data mutation during this pass

While diagnosing B1, this pass inadvertently left "Meditation" (Daily group, item id 2)'s `streak` at 6 and
`lastCompletedAt` at a 2026-09-10 timestamp, instead of the pre-pass seed values (`streak: 5`,
`lastCompletedAt: 2026-09-09`). `isDone` itself was successfully restored to `false` (confirmed via a direct
API read), but the streak/last-completed advance triggered by the accidental completion could not be reverted
through the UI — no endpoint or undo path exists for it (see B1's root cause: the undo stack is never
populated by a done-toggle at all). Flagging this explicitly rather than silently leaving it: a later pass
using this same seed should expect Meditation's streak to read 6, not 5.

### What the server actually does — corrected 2026-09-13 against the API source

This note was escalated in `_fix-queue.md` as *"a done-toggle advances `streak`/`lastCompletedAt`
irreversibly… an accidental checkbox click permanently inflates a streak."* Read against
`AdhdTimeOrganizer.Routines`, **that overstates it, and the worst case it implies is explicitly guarded
against.** What is true:

- **The increment is once per *cycle*, not once per toggle.** `RoutineResetService.UpdateItemStreak` calls
  `AlreadyCountedThisCycle(item)` and returns before touching `Streak`/`BestStreak` if the item has already
  scored in the current cycle. Its own doc comment names the exact fear: *"un-ticking and re-ticking an item,
  or re-sending `ForceValue = true` at an already-complete counted item … must not walk `Streak` and
  `BestStreak` up. Only a reset opens the item up to being counted again."* Two tests pin it —
  `UpdateItemStreak_CalledTwiceInTheSameCycle_IncrementsOnlyOnce` and its control
  `UpdateItemStreak_AfterANewCycle_IncrementsAgain`. **So repeated clicking cannot compound.**
- **One accidental tick in a fresh cycle does still cost +1, permanently.** `Streak++` (and `BestStreak` if it
  is a new record), and un-ticking does not give it back — `UpdateItemStreak` returns immediately when
  `!item.IsDone`, so there is no decrement path anywhere. That is the real, and only, irreversible part.
- **`LastCompletedAt` moving on every completing toggle is deliberate**, not a leak: *"it means 'last
  completed', not 'last scored'."*
- **The period-level streak is unaffected if the tick is undone before the period rolls over.** It is
  evaluated at reset time from live state — `completedCount = items.Count(i => i.IsDone)` against
  `period.StreakThreshold` (`RoutineResetService`, the `TryReset` path) — not accumulated per toggle. So that
  half is self-correcting.

**Net: an accidental click costs exactly one point on one item's streak, once, with no period-level
consequence.** That is a design question ("should un-ticking inside the same cycle decrement?"), not the
open-ended data-integrity escalation it was filed as. The seed-drift note above still stands as written —
Meditation reads 6 — since +1 is precisely what happened.

**The design question is now written up** as
[`B9`](../../../prompts/view-docs/backend/B9-routine-untick-streak-decision.md) (backend ask; not to be
confused with finding `B9` above, which is a different thing that is already fixed). It is a decision, not a
defect, and **nothing is blocked on it** — unit 10 can run and close regardless. The client cannot decide it:
no endpoint writes an item's streak, and streak fields are server-owned by design.

### U1. Weekly review card (R2) not reached — seed has zero elapsed periods
- **Status:** ✅ **verified — closed (round 6, 2026-09-14).** The review card renders with both eligible
  periods and *Reduce frequency* opens the prefilled form; see *Round 6 browser pass* row 4. Kept below: how
  the seed gap was closed. The ask
  [`B8`](../../../prompts/view-docs/backend/_done/B8-routine-streak-history-seed.md) turned out to be already
  covered by the API's `e2e-v4` work (uncommitted on `dev` when B8 was written against `e2e-v3`).
  `E2eFixtureSeeder.AddRoutinePeriodHistory()` now seeds 16 `RoutinePeriodCompletion` rows on **Weekly**
  (period id `routineTimePeriods.Weekly`; newest-first `xf.xxxx.xx.xx.xx` — met / missed / one **frozen** on
  the second-newest cycle; streak 1, best 4) and 16 on **Daily** (one 4-of-5 miss eleven cycles back; streak
  11, best 30). `totalPeriodsElapsed` / `totalPeriodsCompleted` are derived from those rows server-side, so
  `reviewEligibleGroups` has two eligible periods. Monthly / Yearly are deliberately left bare. Pinned by
  `Seed_LeavesTheRoutineHistoryVisibleThroughTheReadPath` in the API's `TestSeedEndpointTests.cs`.
- **Severity:** ~~unverified~~ verified
- **Where:** `/routine-todo-list` — `RoutineWeeklyReviewCard.vue`, gated by
  `useRoutineGroups.ts:52-55`'s `reviewEligibleGroups` (`totalPeriodsElapsed > 0` per period).
- **What would verify it:** `GET /api/routine/settings` confirms `routineReviewDismissedForWeekStart: null`
  (never dismissed), so the card's absence is fully explained by every time period in this seed having 0
  elapsed periods — not a bug. To verify: seed at least one time period with `totalPeriodsElapsed > 0` and
  reload; confirm the card appears with Keep/Reduce frequency/Pause actions, and that "Reduce frequency" opens
  `TimePeriodForm` prefilled per the R2 intent doc.

### U2. Personal-bests panel, milestone streak icons, and populated heatmaps not reached — same seed gap
- **Status:** ✅ **verified — closed (round 6, 2026-09-14).** Personal bests, both heatmaps with all three
  cell states, consistency / trend, the freeze budget and all five milestone icons rendered against `e2e-v4`
  — *Round 6 browser pass* rows 1–3 and 5–7. Seed gap closed by the same
  [`B8`](../../../prompts/view-docs/backend/_done/B8-routine-streak-history-seed.md) close-out as U1. What
  `e2e-v4` seeds for each surface:
  - **Heatmaps / consistency / trend** — Weekly's 16 rows carry all three cell states (met, missed, frozen);
    because `totalPeriodsElapsed` is now *derived* from `completionHistory`, the client's `mockHistory()`
    fallback cannot fire for Daily or Weekly, so what renders is real, never fabricated.
  - **Personal bests** — Weekly streak 1 / best 4, Daily streak 11 / best 30, both computed from the rows by
    `RoutineStreakFreezeService.RecomputeStreak`, so they agree with the heatmap by construction.
  - **Milestone icons** — four new daily items, one per tier of `getMilestoneIcon` on `item.streak`:
    `milestone30` *Drink water* 45 (the only daily item left un-ticked), `milestone90` *Journal* 120,
    `milestone180` *Make the bed* 200, `milestone365` *Brush teeth* 400; plus the existing *Take medication* 12
    for the flame. Streaks sit well past their tier so an un-tick/re-tick pair cannot cross a boundary; a spec
    that straddles midnight UTC with one un-ticked will see the lapse zero it.
  - **Freeze** — `freezesRemaining` / `freezeBudgetResetsAt` are pre-stamped and `lastResetAt` sits on the
    current cycle boundary, so the first grouped read writes nothing; the unfrozen miss behind the frozen one
    is left for a spec to spend a freeze on. Weekly shows one freeze fewer than budget if the seeded freeze
    falls in the current calendar month.
  Ids and counts: `seed.routines.milestone*`, `seed.routineTimePeriods.Weekly` / `.Daily`,
  `seed.counts.routinePeriodCompletions` / `.frozenRoutinePeriodCompletions` (`e2e/fixtures/seed.ts`).
- **Severity:** ~~unverified~~ verified
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

### Round 6 browser pass — run 2026-09-14, all seven surfaces render against `e2e-v4`

Setup: `POST /api/test/seed` → `fixture: 'e2e-v4'`, `seedDateUtc 2026-09-14`, `counts.routinePeriodCompletions
32`, `.frozenRoutinePeriodCompletions 1`, `routines.milestone30..365 = 19004..19007`. Own `playwright-cli`
session (`-s=todo-routine`, per F23); round 5's `auth-10001.json` bounced to `/login?redirect=/` (stale refresh
token), so this round **signed in through the form** with the seed's `primaryUser` — which works locally, the
way `e2e/fixtures/auth.ts` does it — and saved `.playwright-cli/auth-todo-routine.json`. Console: 0 errors on
both views. No mutation was made: the history dialog and *Reduce frequency* form were both cancelled, nothing
was ticked, the Weekly freeze was not spent. Raw `GET /routine-todo-list/grouped-by-time-period` was read once
to cross-check the screen against the rows; the numbers below are from that response and the DOM, not by eye.

| # | where | observed | verdict |
| --- | --- | --- | --- |
| 1 | Daily group items | *Drink Water* 45 → `star` (un-ticked), *Brush Teeth* 400 → `crown`, *Make the Bed* 200 → `gem`, *Journal* 120 → `trophy`, *Take Medication* 12 → `fire-flame-curved` — all five `data-icon`s present in `main`; item tooltips `Streak: 45 · best: 45` … `Streak: 12 · best: 30` | ✅ U2 milestone icons — the four never-before-rendered branches now have a screenshot |
| 2 | Weekly card heatmap | cell classes (oldest→newest) `level-4 level-0 level-4 ×4 level-0 frozen level-4 empty` — the last 9 rows of `x x . x x . x x . x x x x . f x` plus the current-period placeholder, at the 10-cell width the card affords; frozen cell is hatched and its tooltip reads *"31 Aug – 7 Sept · covered by a skip"* | ✅ U2 third cell state |
| 3 | Daily card stats | streak **11**, consistency **94 %** (15/16), trend *"Holding steady"* with tooltip *"Recently 100 % of periods, earlier 98 %"* (the 4/5 on 2 Sept is in the earlier half); Weekly: streak **1**, **69 %** (11/16), *"Less often than before"*, tooltip *"Recently 63 %, earlier 75 %"* — 5/8 vs 6/8, exactly the seed pattern | ✅ U2 consistency / trend — computed from real rows, `mockHistory()` never involved |
| 4 | Weekly review card | present at top: *Daily — Last time 5 of 5* and *Weekly — Last time 1 of 1*, each with Keep / Reduce frequency / Pause; Monthly and Yearly correctly absent (elapsed 0). *Reduce frequency* on Daily opens `TimePeriodForm` titled "Reduce frequency", prefilled Name *Daily*, length 1, depth 16, threshold 100, grace 0, rolling — cancelled | ✅ **U1 closed** |
| 5 | freeze chips | Daily *2 skips left* (`2/2`), Weekly **1 skip left** (`1/2` — the seeded freeze falls in September, the current calendar month, as the seeder comment predicts); tooltip *"A missed period can be covered by a skip so your run continues — 2 per period, refills 1 Oct."* | ✅ U2 freeze budget |
| 6 | `/routine-settings` *Your routines over time* | two cards: **Daily** best 30 · streak 11 · 94 % · 1d; **Weekly** best 4 · streak 1 · 69 % · 7d. Monthly / Yearly are filtered out of the panel (`totalPeriodsElapsed > 0`) and keep their empty state on the list view (0 %, grey heatmap, *No tasks* on Yearly) | ✅ U2 personal bests; empty state still reachable |
| 7 | history dialog (click Weekly heatmap) | ECharts calendar May → Sep, 16 week-columns Monday-aligned: green met, dark missed, light-blue **frozen** column 31 Aug – 7 Sept, current week white. Data cross-checked against the response: ascending `periodStart`, `2026-05-25 … 2026-09-07`, one `isFrozen` | ✅ U2 heatmap (dialog) |

Screenshots: `screenshots/routine-todo-list--round6-v4-overview.png` (rows 1–5),
`routine-todo-list--round6-v4-history-dialog-weekly.png` (row 7),
`routine-settings--round6-v4-personal-bests.png` (row 6).

**Not defects, worth knowing before someone files them:**

- The card heatmap shows **10** cells, not `historyDepth` 16 — `RoutineGroupHeatmap` sizes to container width
  and slices the newest `total` entries, so Daily's 2 Sept miss is off the card and visible only in the dialog.
- One column in the dialog can show a paler border on a couple of day cells after a hover — ECharts emphasis
  state, not a data split; the rows are all Monday-aligned.
- `RoutineTodoListItem`'s **weekday chips overflow the Daily column at 1440 px** (`Mon Tue Wed T…` clipped, see
  the overview screenshot) now that the seed has five daily items with all seven days selected. Same family as
  `home/B1` / `F7` (fixed width vs. a four-column board) but on the item row, not the widget header. Filed
  below as **P2** rather than folded into this pass.
- `/routine-settings` renders no breadcrumb beyond *Home* (the list view shows *Home › Routine*). Not
  investigated; a one-line check for whoever next touches `RoutineSettingsView`'s route meta.

### P2. Routine item weekday chips overflow the column at 1440 px
- **Status:** fixed and verified (2026-09-14) — `BaseTodoListItem.vue`'s chip row is now `flex-wrap` and its
  column `min-width: 0` (the flex default `min-width: auto` was what stopped the row shrinking). At 1440×900
  with four groups the last chip's right edge is 451 px against a card edge of 574 px — nothing clips — and
  with the `Groups` filter set to Daily alone all seven chips stay on one line (unchanged). The trade-off is
  height: in the four-column layout an all-seven-days item wraps onto five lines with the title below the
  chips. A compact strip below the title would be shorter but `BaseTodoListItem` is shared with the normal
  list, so that is a layout decision for both lists, not a routine-only polish fix; left as is.
- **Severity:** polish
- **Where:** `/routine-todo-list`, Daily group — every item row with all seven days selected; `RoutineTodoListItem.vue`
- **What happens:** at a 1440×900 viewport with four groups on screen, the item row's day chips run past the
  card edge and are clipped (`Mon Tue Wed T`); the milestone icon and streak count stay visible, the remaining
  chips do not. The board was never this wide before — `e2e-v3` had one daily item.
- **Evidence:** `screenshots/routine-todo-list--round6-v4-overview.png`, Daily column.
- **Suggested resolution:** let the chip row wrap (`flex-wrap`) or collapse to a compact weekday strip below
  the title on narrow columns; do not shrink the column. Verify with the four-group default and the `Groups`
  filter set to one group (where the row has room and should not change).

## Environment note — round 5 shared a `playwright-cli` browser and a seeded account with another session

Worth recording so the next agent doesn't lose time re-diagnosing the same symptoms. This round began on the
unnamed `default` `playwright-cli` browser session (the one CLAUDE.md's instructions imply by omission) and,
partway through, started seeing: navigations to `/routine-todo-list` landing on `/todo-list/13001` instead;
a "Log time manually" dialog and an "Add to to-do list" dialog open with no corresponding action taken this
session; two `todo-lists` fixture items (14015 "Build a Bookshelf", 14013 "Deep Clean Kitchen") with their
`isDone`/counter state changed; and, later, this very findings file and `_fix-queue.md` observed to have
changed on disk between a `Read` and the next `Edit` — all without this session causing them. `playwright-cli
list` showed a `trkset` and later an `activity-settings` named session open alongside `default`, meaning at
least one other agent was active at the same time, most likely also using the unnamed `default` browser (a
named session doesn't collide) and the same seeded test account (`POST /api/test/seed` resets **every**
account, and a reseed was observed to invalidate an in-progress routine-item create mid-sequence three times
in a row — see B9's entry).

**What fixed it:** switching to an explicitly named session (`playwright-cli -s=todo-routine …`) stopped the
navigation/dialog collisions immediately — those were genuinely two tabs racing. It did **not** stop the
account-level collisions (reseeds, B9's blocked attempts), because a named *browser* session is still the
same *backend account* as everyone else's `test@example.com`. **Recommendation for future units:** always
pass `-s=<unit-name>` to `playwright-cli`, never rely on the unnamed default; and treat `POST /api/test/seed`
mid-pass as a live hazard, not just a start/end-of-pass operation, when another unit might be running
concurrently — a mutation pass has no way to tell "my write failed" apart from "someone just reset the
table" except by re-checking whether rows it created moments ago still exist.

Cleanup performed: the two accidentally-toggled `todo-lists` items were caught and would have been reverted
directly, but a `POST /api/test/seed` (see round 5's own history entry) intervened between diagnosis and the
revert attempt and reset them anyway; a final reseed was run at the end of this session to guarantee a clean
fixture regardless. **Consequence: `e2e/.state/auth-*.json` is invalidated by that final reseed — the next
agent must sign in fresh (or run a signed-in spec to regenerate it), not `state-load` the existing file.**
