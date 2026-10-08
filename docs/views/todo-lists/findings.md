# todo-lists — findings

> Pass: mutation · captured 2026-09-15 · commit `97f1e414`

**Tally:** blocker 1 (X1, fixed + verified live) · bug 10 (B1–B9 fixed + verified; B10 open) · a11y 4 (A1–A3
fixed + verified; A4 open) · polish 3 (P1 fixed + verified; P2, P3 open) · opportunity 1 (resolved) · unverified 3
(U4 open; U1 superseded by B4, U3 verified) · settled 1 (U2 → see B3). 23 entries. **5 open**, all from
the x4 narrow-viewport pass (2026-10-06): B10, A4, P2, P3, U4.

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-09 | `acd7db0d` | initial inventory pass |
| 1a | 2026-09-10 | `acd7db0d` | backfilled `Status:` / `Verify:` / `Root cause guess:`; renumbered `B3` → `U3` (its severity was `unverified`, which had also double-counted it in the tally as a bug) |
| 2 | 2026-09-10 | working tree | **fix pass** — B1, B2, A1, A2, P1 code-fixed. `npm run type-check` 0 errors, `npm run lint` 0 errors. O1/U1/U2/U3 untouched (seed-data / mutation-pass work, not code). |
| 2a | 2026-09-10 | working tree | **browser verification** on `https://localhost:3000`, EN locale, signed in. All five `Verify:` blocks executed — see each finding's *Verified* line. Two follow-ups came out of it: a layout fix to B1's new alert, and **five more nameless icon controls on `/todo-list/:id`** that A1's `/todo-list`-scoped sweep never covered (recorded under A1). |
| 3 | 2026-09-10 | working tree | **e2e seed-backed pass** (`POST /api/test/seed` now works). Drove the "Focus" (13001) and "Errands" (13002) lists via `playwright-cli` to write Task-3 specs. U1 confirmed working (6 overdue items trip the banner, message and buttons render correctly) but its "Today" action itself is broken — filed as **B4**, a framework-level `Time.fromJson` contract bug that fails every reschedule touching an item with a due time. U2 settled — the click is not dead — but that surfaced **B3**, a new bug: the same click also opens the log-time dialog. O1/U3 still not verifiable: the seed's `withEstimate`/`withEstimateAndSteps` items (ids 14002/14001) return no `suggestedTime` in `GET /api/todo-list-item`, despite being named for it and counted in the seed response's `calibrationTodoListItems: 6` — a fixture/backend gap, reported rather than fixed here. |
| 4 | 2026-09-12 | working tree | `e2e-v2` fixture delivers `suggestedTime` — O1 resolved, U3 verified, calibration specs written. |
| 5 | 2026-09-13 | working tree | **close-out pass** — every remaining item retested in the browser (SK and EN, `playwright-cli` against `e2e-v3`). **B4 had already been fixed on the API side** (`dueTime` became `{hours, minutes}` on 2026-09-11, backend commit `6395cee`); `Time.fromJson` was made tolerant of both shapes anyway and the two B4 `fixme`s are real specs now. **B3 was not "fixed silently"** as `_fix-queue.md` had it — the round-2 edit moved the `itemClicked` emit *above* the multi-count branch, so a row-body click on a counted item both stepped the counter and opened the dialog; fixed for real this round. Two new bugs surfaced while retesting the counter and are fixed: **B5** (counter steps were never persisted) and **B6** (a dwelling mouse could only decrement, and neither action was keyboard-reachable). U1 superseded by B4. `_shell/P1` (the breadcrumb) fixed from this side. Type-check 0, lint 0, `todo-lists.spec.ts` + `todo-motivation.spec.ts` green. |
| 6 | 2026-09-15 | `97f1e414` | **formal mutation pass** (this unit's `Pass: mutation` had never been run — rounds 2–5 above were a fix/verification cycle riding on the inventory pass's own data, not a full create→edit→delete lifecycle sweep). Drove `List`, `Category` and `ToDoListItem` through create/edit/delete against fixture `e2e-v4` (seed date 2026-09-14). List and Item CRUD is clean (validation, edit, done-toggle, propagation to the list-card counter, and list deletion all work correctly, including the cascade-aware "Delete list?" confirmation). Four new defects surfaced: **X1** — category creation is 100% broken (client sends a semantic colour name, API requires a hex code); **B7** — item deletion never confirms despite "Ask before deleting single items" being on; **B8** — "Move to list" 404s on every attempt (client and server routes have diverged); **A3** — the item done-checkbox has no accessible name. Account state fully restored by hand (no reseed needed — every created entity was also deleted in-session); the next agent can keep using `e2e/.state/auth-10001.json` if still fresh, or sign in via the form (`test@example.com` / `testpass123` from `e2e/.state/seed.json`) as this session did after the stale token's refresh also 401'd. |
| 7 | 2026-09-24 | working tree | **status sweep (code read only, no browser pass).** B7, B8 and A3 are fixed in the working tree: `useUndoableListCrud.ts:121` now calls `shouldConfirm`/`confirm` before `deleteItem`'s `api.deleteEntity`; `todoListItemApi.ts:114` now sends `` API.patch(`${url}/${id}/move`, { destinationListId }) ``, matching the backend route/body shape from B8's own suggested fix; `BaseTodoListItem.vue:26` carries `:aria-label="i18n.t('toDoList.markDone', { name: toDoListItem.activity.name })"` on the `VCheckboxBtn`. None of these three carry an explicit "fixed" note of their own from whoever made the change — closing them out from source inspection, not a re-run `Verify:` pass; a browser confirmation is still owed before fully trusting the exact copy/keyboard behaviour. **X1 is unchanged and still fully broken**: `ColorPicker.vue:31` still does `@click="model = color.name"`, `TodoListCategoryForm.vue:49` still round-trips `entityToEdit.color` (or the semantic default `'blue'`) straight into `TodoListCategoryRequest` with no hex translation anywhere in between. Category creation still 400s on every colour choice. |
| 8 | 2026-09-24 | working tree | **X1 closed — the round-7 read was wrong about the contract, not the code.** The fix went the other way from X1's suggestion: the **API** now requires a palette *name* and rejects hex (`MustBePaletteColor`, `Sydowwe.Framework/application/validator/ColorRuleExtensions.cs`; the name list `ColorPalette.cs` is identical to `colorPalette.ts`'s 29 entries), and the client already sends names. The remaining `"default"` path is gone too — `TodoListCategoryForm` passes `required`, so the "None" swatch is not rendered, and `TodoListCategoryRequest` seeds `'blue'`. Pinned API-side by `NameTextColorIconValidationTests` (route `api/todo-list-category`: every palette name → 2xx; `#abcdef`, `#fff`, `default`, `""`, `Blue` → 400). No frontend change. Browser pass attempted and blocked: form sign-in got a **500** from `POST /api/auth/login`, and another `playwright-cli` session was live, so no shared state file was loaded. |
| 9 | 2026-09-25 | `d423edcc` | **retest round** — 4 retested live: X1, B7, B8, A3 all pass. Account: `primaryUser`. Mutations made and reverted: created and deleted two categories ("Retest Category Default", "Retest Category Crimson") for X1; opened and cancelled a delete confirmation for B7 (no mutation); moved item 14003 ("Code Review") Focus → Someday → Focus for B8, confirmed back at 0/0 in Someday and present in Focus. `/user/settings` "Ask before deleting single items" was already checked — untouched. **New gap found while running B8's Verify**: moving item 14003 to the "Errands" list (13002) 409s with `DbUniqueViolationError` ("Unique constraint violation during HandleAsync") — the fixed route/body shape works (confirmed 204 to a different destination and back), and the refusal is the deliberate `(UserId, ActivityId, TodoListId)` unique index, since Errands already has a "Code Review"-activity item. Not filed as a finding per retest scope; flagging for triage (→ **B9**, round 10). F90 (routine weekday picker): pass — `group "Suggested days"` with 7 day buttons (Mon–Sun), toggling adds/removes `[pressed]` correctly, no console error or new `console info` entries. Dialog cancelled, nothing saved (no POST in the request log after Cancel). |
| 10 | 2026-09-25 | working tree | **triage of round 9.** The round-9 row's "silent failure" was overstated — the interceptor did show a snackbar — but the snackbar was the generic `httpErrors.conflictUnique` ("A record with this value already exists. Choose another.") after the dialog had already closed, and the rejection escaped `openMoveToList` unhandled. Filed and fixed as **B9**, verified live. X1's retest Status corrected: the category form's `ColorPicker` is `required`, so the "default" category was created with the seeded `blue`, not a "None" swatch. Round 7's row had a stray empty cell; removed. |
| 11 | 2026-10-06 | `27dd210b` | **x4 narrow viewport (390×844)** — 2 views checked; new: B10, A4, P2, P3, U4. |

---

### X1. Creating a to-do list category always fails — the colour picker sends a semantic name, the API requires a hex code
- **Status:** fixed and verified (retest 2026-09-25, live) — created "Retest Category Default" (colour left at
  the seeded default, `blue` — the form's `ColorPicker` is `required`, so there is no "None" swatch) and "Retest
  Category Crimson" (explicit "Crimson" swatch); both `POST /api/todo-list-category`
  requests returned `201`, and both categories appeared under their typed names in the Categories panel. Both
  deleted afterward (`DELETE`-confirmed via the "Delete category?" dialog), panel back to its original three
  categories.
- **Severity:** blocker
- **Where:** `/todo-list` → "New category" dialog (`TodoListCategoryForm.vue`) → `src/_common/component/inputs/ColorPicker.vue` — **[framework]**
- **Expected:** Filling in a name and submitting the "New category" dialog creates the category, per plain user
  sense and per this unit's own `usecase.md` ("Create, edit and delete categories").
- **Actual:** Every submission fails with a **400**, regardless of which colour swatch is picked — including the
  default "None" swatch, which is selected when the dialog opens. There is no way to create a category through
  this dialog at all. The dialog also **closes as if the submission succeeded** (per this app's
  `useDialog()` pattern — confirming the form closes the dialog and hands the request to the caller, which then
  makes the API call), leaving only a generic, non-specific "One or more errors occurred!" snackbar as the only
  sign anything went wrong. A user who doesn't notice the snackbar has no way to tell the category wasn't
  created.
- **Root cause:** `ColorPicker.vue` (`src/_common/component/inputs/ColorPicker.vue:31`) sets
  `model = color.name` on swatch click — a semantic key like `"blue"`, `"crimson"`, `"default"` — sourced from
  `COLOR_PALETTE` (`src/_common/utils/colorPalette.ts`), which only carries per-theme **hex** values
  (`dark.bg`/`light.bg` etc.), never the swatch's own semantic name, out to the caller. `TodoListCategoryForm.vue`
  passes that name straight through as `TodoListCategoryRequest.color` with no translation. The backend's
  validator rejects it: `"errors":{"color":["Color must be a valid hex color code (e.g. #FFFFFF or #FFF)"]}`.
  This is a framework component (`_common/component/inputs/ColorPicker.vue`) used with an API that expects hex —
  either `ColorPicker` needs to emit the theme-appropriate hex value instead of the semantic name, or every
  caller needs to translate `color.name` → hex before sending, which defeats the point of a shared component.
- **Evidence:** three separate `POST /api/todo-list-category` requests, all **400**:
  - `{"name":"Mutation Test Category","icon":null,"color":"default"}` → `{"statusCode":400,...,"errors":{"color":["Color must be a valid hex color code (e.g. #FFFFFF or #FFF)"]}}` (default "None" swatch, no interaction)
  - `{"name":"Mutation Test Category","icon":null,"color":"blue"}` → identical 400 (explicit "Blue" swatch picked)
  - a third identical attempt, also 400
  Screenshots: `docs/views/todo-lists/screenshots/todo-list--mutation-category-validation.png` (required-name
  validation, which does work) and
  `docs/views/todo-lists/screenshots/todo-list--mutation-category-create-400-no-feedback.png` (the generic
  failure snackbar, dialog already closed, no new category in the list).
- **Repro:** 1. Sign in, go to `/todo-list`. 2. Click "New category". 3. Type a name. 4. Click a colour swatch
  (any of them — "Blue" was used here) or leave the default "None". 5. Click "Add". 6. Console/network shows a
  400 on `POST /api/todo-list-category`; the dialog closes; a red "One or more errors occurred!" snackbar
  appears; no new category is in the "Categories" panel.
- **Verify:** 1. Same repro, any colour choice including the default. 2. **Pass condition:** the request
  succeeds (2xx) and the new category appears in the "Categories" panel under the name typed. 3. Repeat with at
  least one non-default swatch to confirm the fix isn't hex-shaped-by-accident for one particular colour.
- **Suggested fix:** Either change `ColorPicker`'s `model` to the swatch's hex value (`color[currentTheme].bg`,
  or a theme-independent hex the palette doesn't currently carry) so every caller sends what the API expects, or
  add a `name → hex` lookup in `TodoListCategoryRequest`'s construction. The former fixes every current and
  future caller of `ColorPicker` at once; per CLAUDE.md's submodule rules, fix `_common` first, then bump the
  pointer.

### B7. Deleting a to-do list item never asks for confirmation, even with "Ask before deleting single items" on
- **Status:** fixed and verified (retest 2026-09-25, live) — preference confirmed checked at `/user/settings`
  ("Ask before deleting single items" `[checked]`, no change needed). On `/todo-list/13001`, deleting the "Code
  Review" item via its overflow menu opened a `dialog "Delete item?"` naming the item; clicking Cancel closed it
  with no `DELETE` request fired (confirmed via `requests` before/after) and the item still present afterward.
- **Severity:** bug
- **Where:** `/todo-list/:id` → item overflow menu → Delete → `src/core/todoList/composable/useUndoableListCrud.ts:110` (`deleteItem`), wired from `src/core/todoList/view/TodoListView.vue`
- **Expected:** Per the user's own preference at `/user/settings` — "Ask before deleting single items", **checked
  ON** for this account — and per CLAUDE.md's `useDeleteConfirmation` rules ("Reading `askBeforeDelete` directly
  at a delete site is now a bug"), deleting a single to-do list item should show a confirmation before it
  happens. List deletes on the same view (`TodoListsView.vue`) and category deletes
  (`useTodoListCategories.ts`) both correctly import and call `useDeleteConfirmation`'s `shouldConfirm`.
- **Actual:** Clicking Delete in the item's overflow menu deletes it **immediately** — `DELETE
  /api/todo-list-item/{id}` fires with no dialog in between — and the only recovery is the "Undo: Delete
  '<name>'" button that appears afterward. Reproduced twice, once on a done item and once on a not-done item,
  same result both times.
- **Root cause:** `useUndoableListCrud.ts`'s `deleteItem()` calls `api.deleteEntity(id)` directly with no
  `shouldConfirm`/`useDeleteConfirmation` check anywhere in the function — unlike the list and category delete
  sites, which both import that composable. The undo mechanism is real and does work, but it is not the same
  contract as the preference: undo requires the user to *notice* the toast and act within its window, while
  "ask before deleting" is supposed to require the user to *confirm* before the delete happens at all.
- **Evidence:** `DELETE /api/todo-list-item/14103 => [204]`, no confirmation dialog in the snapshot immediately
  before or after the click, both on `/todo-list/13102` (a "Bug Fixing" item, done) and again on the same route
  (a "Code Review" item, not done). `/user/settings` snapshot shows `checkbox "Ask before deleting single
  items" [checked]` at the time of both repros. Source read of `useUndoableListCrud.ts:110-125` confirms no
  confirmation call exists in the delete path, versus `TodoListsView.vue:186,190` and
  `useTodoListCategories.ts:8,15`, which both import and call `useDeleteConfirmation`.
- **Repro:** 1. Sign in, confirm `/user/settings` → "Ask before deleting single items" is checked. 2. Open any
  to-do list, e.g. `/todo-list/13001`. 3. Add an item (or use an existing one). 4. Open its overflow menu (⋮) →
  Delete. 5. **No dialog appears** — the item is gone immediately and an "Undo: Delete '<name>'" button shows up
  in its place.
- **Verify:** 1. Same repro, preference still checked. 2. **Pass condition:** a confirmation dialog appears
  before the item is removed, and cancelling it leaves the item in place with no `DELETE` request sent.
- **Suggested fix:** Wire `useDeleteConfirmation`'s `shouldConfirm` into `useUndoableListCrud.deleteItem` (or
  into the call site in `TodoListView.vue`) the same way `TodoListsView.vue` and `useTodoListCategories.ts`
  already do, gated on the item being a leaf delete (it always is — items have no children).

### B8. "Move to list" always fails with a 404 — the client and server routes have diverged
- **Status:** fixed and verified (retest 2026-09-25, live) — `PATCH /api/todo-list-item/{id}/move` is the route
  hit now (no more 404). First attempt (id 14003 "Code Review", Focus → Errands) returned **409**
  `DbUniqueViolationError` / "Unique constraint violation during HandleAsync" — a data conflict, not a route
  bug (filed and fixed as **B9**). Retried to a different destination (Focus → "Someday", list
  13003): `PATCH .../14003/move => 204`, item disappeared from Focus, and appeared in "Someday" with the same id
  14003 after navigating to it. Moved back Someday → Focus (`204`), confirmed present in Focus again and
  "Someday" back to 0/0.
- **Severity:** bug
- **Where:** `/todo-list/:id` → item overflow menu → "Move to list" → `src/core/todoList/api/todoListItemApi.ts:104-112` (`moveToList`)
- **Expected:** Per this unit's own `usecase.md` ("Moving an item between lists does not delete/recreate it; the
  item id is preserved") and the dialog's own "Confirm" button, picking a destination list and confirming should
  move the item there.
- **Actual:** Every attempt fails with a **404**. The item stays in its original list; the "Move to list" dialog
  closes with no visible error feedback (same silent-failure UX as X1 — console/network is the only place the
  failure shows up).
- **Root cause:** a client/server route mismatch. The client calls
  `PATCH /api/todo-list-item/move/{id}/{destinationListId}` with **no request body**
  (`todoListItemApi.ts:106`: `` await API.patch(`${url}/move/${id}/${destinationListId}`) ``). The backend's
  route is `PATCH /todo-list-item/{id}/move`
  (`AdhdTimeOrganizer.TodoLists/application/endpoint/todoListItem/command/MoveTodoListItemEndpoint.cs:22`:
  `` Patch($"/{entityName.Kebaberize()}/{{id:long:required}}/move") ``), and it expects the destination list id
  in the **request body** as `{"destinationListId": N}`
  (`MoveToListTodoListItemRequest.cs`), not as a second URL segment. The two sides look like they diverged
  independently — the path segment order is reversed (`/move/{id}/{dest}` vs `/{id}/move`) *and* the payload
  shape changed from URL param to body. The backend route otherwise looks complete and tested
  (`MoveTodoListItemTests.cs` exists in the API repo), so this reads as a frontend call that was never updated
  after a backend routing change, not a missing backend feature.
- **Evidence:** `PATCH /api/todo-list-item/move/14105/13002 => [404]`; console:
  `Error moving todo list item 14105 to list 13002 AxiosError: Request failed with status code 404` at
  `todoListItemApi.ts:83` via `TodoListView.vue:200` (`moveItemToList`) via `TodoListView.vue:197`
  (`openMoveToList`). Screenshot:
  `docs/views/todo-lists/screenshots/todo-list-id--mutation-move-to-list-404.png`. Confirmed the item ("Read a
  Novel", id 14105) was still present in the source list ("Focus", 13001) after the failed move. Backend source
  read (not part of this frontend repo, corroboration only) confirms the route and body shape described above.
- **Repro:** 1. Open any to-do list with at least one item, e.g. `/todo-list/13001`. 2. Open an item's overflow
  menu → "Move to list". 3. Pick any destination list. 4. Click "Confirm". 5. Console shows a 404 on
  `PATCH .../todo-list-item/move/{id}/{destId}`; the item is still in the source list after reload.
- **Verify:** 1. Same repro. 2. **Pass condition:** the request succeeds (2xx), the item disappears from the
  source list, and reloading the destination list shows it there with the same id.
- **Suggested fix:** Change `moveToList` in `todoListItemApi.ts` to
  `` API.patch(`${url}/${id}/move`, { destinationListId }) ``, matching the backend's actual route and body
  shape.

### A3. The to-do item's done checkbox has no accessible name
- **Status:** fixed and verified (retest 2026-09-25, live) — on `/todo-list/13001`, `eval` over
  `input[type=checkbox][aria-label^="Mark done"]` returned one distinct, activity-qualified name per row
  ("Mark done: Code Review", "Mark done: Build a Bookshelf", "Mark done: Meal Preparation", etc.), matching
  A2's pattern.
- **Severity:** a11y
- **Where:** `/todo-list/:id` — the per-item done checkbox in `src/core/todoList/component/BaseTodoListItem.vue`
  (distinct from the overflow-menu trigger already fixed as A2)
- **Expected:** Per the same WAI-ARIA standard already applied to A1/A2, an interactive control needs a
  discoverable name — doubly so for a checkbox with no adjacent visible label text (the item's activity name
  sits to its right but is not wired as the checkbox's label).
- **Actual:** `document.querySelectorAll` / `eval` confirms the checkbox element has empty `textContent`, no
  `aria-label`, and no `aria-labelledby`. A screen-reader user tabbing through the list hears only "checkbox,
  not checked" with no indication of which task it belongs to.
- **Evidence:** `eval` on the checkbox ref for the "Bug Fixing" item on `/todo-list/13102`:
  `{"text":"","aria":null,"ariaLabelledby":null}`.
- **Repro:** 1. Open any to-do list with at least one single-count (non-multi-count) item, e.g. `/todo-list/1`.
  2. Inspect the row's checkbox. 3. Confirm no `aria-label`, `aria-labelledby`, or visible text is attached to
  it.
- **Verify:** 1. Same repro. 2. **Pass condition:** the checkbox exposes an accessible name that includes the
  item's activity name (matching A2's pattern, e.g. `` `${t('general.markDone')}: ${item.activity.name}` ``), so
  every row's checkbox is independently distinguishable in the accessibility tree.
- **Root cause guess:** same class as A1/A2 — an interactive control shipped without a label. The multi-count
  counter's two buttons (fixed under B6) already carry qualified names; this is the one remaining unlabelled
  per-item control.
- **Suggested fix:** Add `:aria-label="`${t('general.markDone')}: ${toDoListItem.activity.name}`"` (or similar,
  reusing whichever key is closest to existing "mark done" copy) to the `VCheckboxBtn` in
  `BaseTodoListItem.vue`.

### B9. "Move to list" into a list that already has the item's activity fails with a misleading, post-close snackbar
- **Status:** fixed and verified (2026-09-25, live) — Focus → Errands on "Code Review" (14003): `PATCH
  .../14003/move => 409`, the dialog stayed open with *"Errands" already has a "Code Review" task* under the
  destination select and no snackbar; picking "Someday" cleared the message, and confirming gave `204`, closed
  the dialog, removed the row and showed "Moved successfully". Moved back to Focus (`204`); present there
  again. `console info` empty.
- **Severity:** bug
- **Where:** `/todo-list/:id` → item overflow menu → "Move to list" →
  `src/core/todoList/component/normal/MoveToListForm.vue`, `src/core/todoList/view/TodoListView.vue`
  (`openMoveToList`)
- **Expected:** A list holds at most one item per activity (the API's `(UserId, ActivityId, TodoListId)` unique
  index, `TodoListItemConfiguration.cs:47`), so a move into a list that already has one is refused. The user
  should be told *that*, and be able to pick another list without reopening the dialog.
- **Actual:** The dialog closed before the request went out, then the interceptor showed the generic
  `httpErrors.conflictUnique` — "A record with this value already exists. Choose another." — which names no
  value the dialog has. The rejection also escaped `openMoveToList` unhandled.
- **Evidence:** found by the round-9 retest while running B8's `Verify:` —
  `PATCH /api/todo-list-item/14003/move => [409]`,
  `{"errorType":"DbUniqueViolationError","errors":{"generalErrors":["Unique constraint violation during HandleAsync"]}}`.
- **Repro:** 1. `/todo-list/<Focus>` (`seed.todoLists`). 2. "Code Review" → overflow → "Move to list".
  3. Pick "Errands" (it already has a "Code Review" item). 4. Confirm.
- **Verify:** 1. Same repro. 2. **Pass condition:** the dialog stays open with an inline message naming the
  list and the activity, no snackbar appears, and choosing a list without that activity then moves the item
  (2xx, row gone, success snackbar).
- **Fix:** the same shape as `TimePeriodForm` and `ShoppingToTodoDialog`. `MoveToListForm` takes a `submit`
  prop and runs the move inside its own confirm, `_silent`; a 409 `DbUniqueViolationError` becomes the
  select's `errorMessages` (`toDoList.alreadyOnDestination`, SK + EN), every other status goes through
  `handleHttpCodes`. `moveToList` in `todoListItemApi.ts` now forwards an `AxiosRequestConfig`.

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

### B3. Multi-count counter click also opens the manual log-time dialog
- **Status:** fixed and verified (round 5, 2026-09-13)
- **Fix applied (round 5):** `_fix-queue.md` had this down as "fixed silently" because the counter's own
  `@increment`/`@minus` bypass `itemClicked`. That was only half of it: `itemClicked()` still emitted
  **before** the `isMultipleCount` branch and then called `progressClicked()`, so a click on the row body
  of a counted item both stepped the counter and opened the dialog — which is exactly the repro below
  ("click anywhere on the row"). The pre-round-2 code had the branch *above* the emit; the round-2 edit
  inverted it. Resolved the other way round rather than restoring it: the row body is now **only** the
  log-time gesture, for counted items as for every other row, and the counter is stepped only through its
  own two buttons (see B6). `BaseTodoListItem.vue`'s `itemClicked()` returns after the emit for counted items.
- **Verified (round 5):** on `/todo-list/13001`, clicking the "Deep Clean Kitchen" title opens "Log time
  manually" and the counter stays at 2/5; clicking the bar goes 2/5 → 3/5 with no dialog. Pinned by
  `todo-motivation.spec.ts` › "clicking the row body opens the log-time dialog and leaves the counter alone"
  and "the bar increments after a dwelling hover, without opening the log-time dialog".
- **Severity:** bug
- **Where:** `/todo-list/:id` — `src/core/todoList/component/BaseTodoListItem.vue`'s `itemClicked()` (around
  line 311), which backs the `TodoListItemCounter`'s row for multi-count items
- **Expected:** Per the comment already sitting on lines 302–305 of the same file — documenting the identical
  bug already fixed for the checkbox by giving it a dedicated `checkboxClicked()` handler that never reaches
  `itemClicked()` — operating the counter should only change the count, not also open the log-time dialog.
- **Actual:** `itemClicked()` unconditionally emits `itemClicked` (which every view wires to opening the manual
  log-time dialog) and only afterwards branches on `toDoListItem.isMultipleCount` to call `progressClicked()`.
  Both fire from one physical click on the row, so incrementing a multi-count item's counter also pops the
  "Log time manually" dialog over it every time.
- **Evidence:** `playwright-cli` snapshot before/after a single click on the "Deep Clean Kitchen" row
  (`multiCountPartial`, id 14013, "Focus" list 13001, seed `e2e-v1`): before, the counter reads `2 /5`; after
  one click, it reads `3 /5` **and** a `dialog "Log time manually"` is present in the same snapshot.
- **Repro:** 1. Sign in, open `/todo-list/13001`. 2. Click anywhere on the "Deep Clean Kitchen" row (the 2/5
  counter). 3. Observe the count become 3/5 **and** the "Log time manually" dialog open at the same time.
- **Verify:** 1. Same repro. 2. **Pass condition:** the counter increments but the log-time dialog does not
  open — matching the checkbox's already-fixed behaviour — or, if opening it is a deliberate design decision,
  a maintainer says so and this closes as working-as-intended instead.
- **Root cause guess:** `itemClicked()` needs the same split the checkbox already got: either give the counter
  its own click handler that calls `progressClicked()` without emitting `itemClicked`, or return immediately
  after the `isMultipleCount` branch's `progressClicked()` call without having emitted first. The function
  already returns early after `progressClicked()` (line 324) — the emit above it just needs to move inside the
  `else` branch, or the multi-count branch needs to run before the emit.
- **Note:** settles **U2**, which had marked this click's behaviour "inconclusive" — the click was never dead;
  see U2 for the correction.

### B4. Overdue renegotiation ("Today" / "In a week") always fails for any item with a due time — `Time.fromJson` cannot parse the backend's string shape
- **Status:** fixed and verified (round 5, 2026-09-13)
- **What actually closed it:** the **API**, on 2026-09-11 — `TodoListItemResponse.DueTime` and both request
  DTOs became `TimeDto` (`{hours, minutes}`), backend commit `6395cee` "stop two fields lying to the
  client". Re-read from the wire this round: `GET /api/todo-list-item?todoListId=13002` returns
  `"dueTime":{"hours":17,"minutes":0}`. So `_fix-queue.md`'s "re-verified unchanged and still live" was true
  of the frontend file and false of the defect — the contract the finding documented no longer exists.
  `Time.fromJson` (`src/_common/dto/dto/Time.ts`) was still made to accept the `"HH:MM[:SS]"` string by
  delegating to `Time.fromString()`, so the framework's DTO reads either shape — a cheap, generic guard for
  any other API in the family that serializes a bare `TimeOnly`. Submodule commit + pointer bump.
- **Verified (round 5):** "Today" on the Errands banner → 6× `PUT /api/todo-list-item/*` → 200, request
  body carries `"dueTime":{"hours":17,"minutes":0}`, snackbar "6 úloh presunutých na dnes", and after a
  reload every item reads "Dnes 17:00" — time of day preserved, banner gone. Both former `fixme`s in
  `todo-motivation.spec.ts` are real tests now ("Today" and "In a week"), each asserting the 17:00 survives.
- **Severity:** bug (high — silently breaks the entire bulk-reschedule feature, not just this banner)
- **Where:** `src/_common/dto/dto/Time.ts`'s `Time.fromJson()`, consumed by
  `TodoListItemEntity.fromJson` (`dueTime` field) and round-tripped by
  `ToDoListItemRequest.fromEntity` / `useOverdueRenegotiation.ts`'s `rescheduleOverdue()`
- **Expected:** Clicking "Today" (or "In a week") on the overdue-renegotiation banner reschedules every
  overdue item to the target date and shows the "Moved {count} tasks…" success snackbar.
- **Actual:** Every `PUT /api/todo-list-item/{id}` in the batch fails with **400**:
  `{"errors":{"dueTime":["Cannot get the value of a token type 'StartObject' as a string."]}}`. Nothing is
  rescheduled, no success snackbar appears, and the banner stays exactly as it was (confirmed via a
  `fetchAll()` re-read afterward: `dueDate`/`dueTime` on all 6 items unchanged from the seed).
- **Root cause:** a client/server contract mismatch on `Time`, not specific to this banner. The backend
  serializes a due time as a **string**, `"17:00:00"` (confirmed via a direct `fetch` to
  `GET /api/todo-list-item?todoListId=13002` — e.g. id 14012 "Return Library Book" has `"dueTime":"17:00:00"`).
  But `Time.fromJson()` (`src/_common/dto/dto/Time.ts:17-20`) is written for an **object** shape:
  ```ts
  static fromJson(object: any) {
      const { hours = 0, minutes = 0 } = object
      return new Time(hours, minutes)
  }
  ```
  Destructuring `{ hours, minutes }` from a string finds neither property, so **every item with a real due
  time silently parses as `00:00`** the moment it's read — not just the ones this banner touches. That
  zeroed `Time` instance then round-trips back out through `ToDoListItemRequest.fromEntity` on any update
  (not only reschedule — any `update()`/`updateWithResponse()` call that goes through `fromEntity` carries the
  same wrong `dueTime`), where it serializes to the default `{"hours":0,"minutes":0}` object shape the backend
  now rejects, because *its* `ToDoListItemRequest.dueTime` also expects the string shape it sent on the way in.
  `Time` already has a working string parser, `Time.fromString()` (same file, line 50) — `fromJson` just isn't
  calling it. This is the framework's `Time` DTO (`src/_common`), so the fix is a submodule change, not app-side.
- **Evidence:** request/response pair captured via `playwright-cli request-body`/`response-body` on the failing
  `PUT /api/todo-list-item/14012`:
  - Request body: `{"isDone":false,"activityId":12018,...,"dueDate":"2026-09-10","dueTime":{"hours":0,"minutes":0},...}`
  - Response body: `{"statusCode":400,"message":"One or more errors occurred!","errors":{"dueTime":["Cannot get the value of a token type 'StartObject' as a string."]}}`
  All 6 items in the reschedule batch (14007–14012) failed identically. Confirmed `Time.fromJson`'s
  destructuring-from-a-string behavior by reading the source directly, not just inferring it from the network
  trace.
- **Repro:** 1. Sign in, open `/todo-list/13002` ("Errands", seed `e2e-v1`). 2. The renegotiation banner reads
  "6 tasks have a date that has passed…". 3. Click "Today". 4. Open devtools — 6× `PUT .../todo-list-item/*` →
  400. 5. Reload — the same 6 items are still overdue with their original due times.
- **Verify:** 1. Same repro. 2. **Pass condition:** all 6 `PUT` calls return 2xx, the success snackbar
  ("Moved 6 tasks to today") appears, and the items' `dueDate` becomes today's date while their **time-of-day
  is preserved** (not silently zeroed to midnight) — the second half matters because a fix that only stops the
  400 without fixing the parse would still be losing every due time on read.
- **Suggested fix:** `Time.fromJson()` should handle a string input — either delegate to the existing
  `Time.fromString()` when `typeof object === 'string'`, or (if the object shape is what other endpoints
  actually send) confirm with the backend which shape is the real contract and fix whichever side is wrong.
  Given `Time.fromString()` already exists and correctly parses `"HH:MM"`/`"HH:MM:SS"`, the cheap fix is in
  `fromJson`. This is a framework file (`src/_common`) — per `CLAUDE.md`'s submodule rules, fix it there first,
  then bump the pointer.

### B5. Counter steps were never persisted — only the step that flipped `isDone` reached the server
- **Status:** fixed and verified (round 5, 2026-09-13) — found while retesting B3
- **Severity:** bug (high — a counted item's progress was lost on every reload)
- **Where:** `src/core/todoList/component/BaseTodoListItem.vue` — `progressClicked()` / `minusClicked()`
- **Expected:** Stepping a 2/5 counter to 3/5 and reloading shows 3/5.
- **Actual:** It showed 2/5. Both handlers changed the local `doneCount` ref and emitted `isDoneChanged`
  **only when `isDone` flipped** — so 2 → 3 → 4 fired no request at all, and only the 4 → 5 step did.
- **Evidence:** round-5 browser pass — `Decrease` from 2/5 to 1/5 produced no `PATCH`; reload read 2/5.
  Confirmed by reading the handlers, and by reading the API: `BaseToggleIsDoneTodoListEndpoint.IsDoneLogic`
  treats `toggle-is-done` with `forceValue: true` as **+1** and `forceValue: false` as **−1** for an item
  with a `TotalCount`, clamping and flipping `IsDone` at the ends. The endpoint was built for per-step
  reporting; the client just wasn't doing it.
- **Fix applied:** both handlers now emit on every step (`true` for +1, `false` for −1); the local change
  stays as the optimistic half and the view's per-item resync after the call brings back the server's
  count. The two home widgets (`TodoListWidget`, `RoutineTodoWidget`) route a counted item's step through
  the API and then `refreshNow()` instead of their optimistic `item.isDone = forceValue ?? !previous`, which
  would have shown a 1/5 item as done on its first increment.
- **Verified (round 5):** `PATCH /todo-list-item/toggle-is-done {"ids":[14013],"forceValue":true}` → 204,
  `GET /todo-list-item/14013` resync, reload reads 3/5; `forceValue:false` → 204, 2/5. Pinned by
  `todo-motivation.spec.ts` › "an increment survives a reload" (waits on the resync before reloading —
  the optimistic 3 says nothing about the write).

### B6. A real mouse could only ever *decrement* the counter, and neither action was keyboard-reachable
- **Status:** fixed and verified (round 5, 2026-09-13) — the "counter hit-testing" item in `_fix-queue.md`,
  confirmed and closed
- **Severity:** bug + a11y
- **Where:** `src/core/todoList/component/TodoListItemCounter.vue`
- **Expected:** Clicking the bar increments; some visible control decrements; both work from the keyboard.
- **Actual:** The component was a `VHover` that rendered the minus button **instead of** the bar while
  hovered. A mouse dwells before it clicks, so by the time the click landed the bar was gone and the minus
  button was under the pointer: 2/5 → 1/5. Playwright's synthesised move+click landed before Vue's
  re-render, which is why round 3 recorded an increment and the queue filed a "contradiction". The
  round-3 a11y label sat on the `VProgressLinear` — a `progressbar`, not focusable, not a button — so
  `Tab` reached neither action.
- **Evidence:** `playwright-cli hover` → 600 ms → `click` on the 2/5 bar: the snapshot showed
  `button "Znížiť: 2 z 5"` under the pointer and the click produced **1/5**.
- **Fix applied:** two always-present controls, no hover swap — the bar is a native `<button>` (focusable,
  Enter/Space) wrapping the progress bar, named "Increase: N of M"; a small text-variant `VIconBtn` under
  it, "Decrease: N of M", disabled at 0; the bar is disabled once done. The container stops click
  propagation so neither reaches the row's log-time gesture (B3).
- **Verified (round 5):** hover-dwell-click → 3/5; minus → 2/5; `focus()` + Enter → +1, Space on the minus →
  −1; screen-reader names correct in SK and EN. Pinned by `todo-motivation.spec.ts` › "the bar increments
  after a dwelling hover…", "the minus button decrements" and "both counter buttons are reachable and
  operable by keyboard". Caveat noted in `_fix-queue.md` for `todo-routine/A1` is discharged by the same
  change — the routine list renders the same component.

### O1. Estimate-vs-actual calibration is fully built but has no seed data to demonstrate it
- **Status:** resolved (round 4, 2026-09-12) — the `e2e-v2` fixture delivers it and both surfaces now have
  passing specs
- **Verify:** `cd e2e && npx playwright test tests/todo-motivation.spec.ts -g "calibration"` — three specs in
  *Estimate-vs-actual calibration (/todo-list/:id — "Focus")*. `GET /api/todo-list-item?todoListId=13001` now
  returns `suggestedTime` (re-read from the response body, not the UI): "Feature Development" 2h against a 2h
  26m history average, "Bug Fixing" 45m against 1h 1m, and `counts.calibrationTodoListItems: 6` clears the
  `MIN_COMPARABLE_ITEMS = 5` gate, so the header renders "Your estimates run about 1.2x actual time".
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
- **Round 3 update:** the seed (`POST /api/test/seed`, fixture `e2e-v1`) now exists and *names* two items for
  this (`todoListItems.withEstimate` = id 14002, `withEstimateAndSteps` = id 14001) and reports
  `counts.calibrationTodoListItems: 6` — but `GET /api/todo-list-item?todoListId=13001` returns **no
  `suggestedTime` field at all** for either item (confirmed via `page.evaluate(fetch(...))`, not just a UI
  read — the raw JSON has no key, not a zero value). The chip and header ratio are therefore still not
  demonstrable, for a different reason than before: the seed claims to have set this up and the count says 6,
  but the field the frontend actually gates on isn't coming back. Not fixed here — this is a backend/seed
  question, not a frontend one. No Task 3 spec was written for the estimate chip or header calibration ratio as
  a result.

### U1. Overdue-renegotiation banner and bulk-reschedule / one-by-one review flow not exercised
- **Status:** settled (round 5) — superseded by B4. The round-3 note already answered the structural question
  (6 seeded overdue items trip the banner, all three actions render); the only failing part was the
  reschedule itself, which was B4 and is fixed. The whole flow is now pinned by the four tests in
  `todo-motivation.spec.ts`'s *Overdue renegotiation banner* block.
- **Severity:** unverified
- **Where:** `/todo-list/:id` — `OverdueRenegotiateBanner.vue` / `useOverdueRenegotiation.ts`
- **What would verify it:** The "Default" list's seed data has zero overdue items (confirmed via the "Past due"
  filter chip returning "No tasks"), so the banner's `overdueItems.length >= RENEGOTIATE_THRESHOLD` condition
  never evaluates true. To verify: seed or create an item with a past `dueDate` and not done, reach the
  configured threshold, and confirm the banner appears with working "reschedule all" and "review one by one"
  actions.

### U2. Multi-count item counter's click behaviour on a fresh (0-progress) item was inconclusive
- **Status:** settled (round 3) — see **B3** for what's actually wrong
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
- **Settled (round 3):** with real seed data (`multiCountPartial`, id 14013, "Deep Clean Kitchen" at 2/5 in the
  "Focus" list), a single click on the counter row **does** increment it — 2/5 became 3/5, confirmed via
  `playwright-cli` snapshot diff. So this was never a dead click; the original repro's "no network request"
  observation was most likely the same loading-state race documented in round 3's investigation elsewhere (a
  fresh navigation's first snapshot can be taken before the item list finishes loading). The click **does**
  have a real problem, but a different one — it also opens the "Log time manually" dialog in the same click.
  Filed separately as **B3**, since that is the actual defect, not an inconclusive one.

### U3. S3's per-item "usually Nm" chip and header calibration line could not be visually confirmed
- **Status:** verified (round 4, 2026-09-12) — both surfaces observed in the browser and pinned by specs
- **Verify:** as O1. Observed on `/todo-list/13001`: the chip renders both sides (`~2h  / 2h 26m`), its
  tooltip reads "You usually spend 2h 26m on this" — neutral, as S3 requires — and the header line reads
  "Your estimates run about 1.2x actual time". The tooltip is teleported outside `#app`, so it needs a hover
  and must not be scoped to `#app`.
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
- **Round 3 update:** still not verifiable — see O1's round 3 update. The seed now names items for this
  (14001/14002) and counts 6, but the API returns no `suggestedTime` for them.

### B10. The list view pans sideways by 90 px on a phone, and each row's ⋮ menu and the Undo button start off-screen (390 px)
- **Status:** fixed 2026-10-08 (`F93`: the toolbar is two groups that wrap. Below `sm`, back + *Add* take the first line and Change
  order / Focus / Undo the second. At 390 on `/todo-list/13001` and `/13002` the scroller is 390/390, the toolbar spans 8–382 and Undo is
  at 303–367, so steps 3–4 pass). **Step 2's ⋮ measurement was not run**: `GET /api/todo-list-item` returned 500 on 2026-10-08, so no
  rows rendered. Reorder mode wasn't driven either, for the same reason. At 1440 the toolbar now wraps to two lines inside its 464 px
  column. That isn't a regression: the old single row was 496 px there and already overran the column by 16 px on each side
- **Severity:** bug
- **Where:** @390×844 · `/todo-list/:id` → `src/core/todoList/component/TodoListToolbar.vue:2` (`d-flex justify-center mb-3 ga-3`, no wrap), inside `TodoListView.vue:31-38` (`cols="12"`). Seen on `/todo-list/13001` and `/todo-list/13002`.
- **Expected:** at 390 px the view fits the viewport, and every row action can be reached without a sideways swipe (template rule: a page that scrolls sideways is always a finding; plain sense, WCAG 1.4.10 reflow).
- **Actual:** the toolbar's five controls (back 4–44, Add, Change order, Focus, Undo 408–472) sit on one row that never wraps. Its min-content width (≈ 468 px) stretches `VCol` and `VRow` to 484 px. `.v-main .v-container` has `overflow-x: auto`, so `scrollWidth` is 480 against `clientWidth` 390, and the whole view pans 90 px sideways. `document.documentElement.scrollWidth` stays 390, which is why a page-level check misses it. Before panning, these are off-screen or cut: every row's **More actions ⋮** (411–451, the only way to Edit, Delete, Move to list, Log time and Add to planner), **Undo** (408–472), **Uncheck all** (436–456), the right half of **Quick start timer** (363–403), the end of **Focus** (298–396), and the overdue banner's sentence ("Pick a new o…"). Panning brings them in (container `scrollLeft` 90 opened the menu fine), but nothing shows that the view scrolls sideways.
- **Evidence:** `docs/views/todo-lists/screenshots/todo-list-id--mobile.png` (unpanned, row ends cut), `todo-list-id-overflow-menu--mobile.png` (panned 90 px). The ancestor walk from `[aria-label^="More actions"]` shows `v-col` w484 → `v-row` w484 → `v-container` sw480/cw390 `overflow-x: auto`. At 480 px and wider only the 4 px row gutter remains (`v-container` scrollWidth = innerWidth + 4); at 768 it fits (`todo-list-id--768.png`).
- **Repro:** 1. `resize 390 844`. 2. Open `/todo-list/13001`. 3. Look at the right edge of the toolbar and of the first item row.
- **Verify:** 1. `playwright-cli resize 390 844`, then `reload` on `/todo-list/13001`. 2. `eval "(() => { const c = document.querySelector('.v-main .v-container'); const m = document.querySelector('[aria-label^=\"More actions\"]').getBoundingClientRect(); return [c.scrollWidth, c.clientWidth, Math.round(m.right)] })()"`. 3. **Pass condition:** `scrollWidth - clientWidth <= 4`, and the first More actions button's `right <= 390`. 4. The toolbar's Undo button is also within the viewport.
- **Root cause guess:** a toolbar row with no `flex-wrap`, holding five buttons whose labels don't shrink (Vuetify `VBtn` is `white-space: nowrap`). "Finish reordering" is longer still, so reorder mode is wider. `RoutineToDoListView` avoids this by splitting the same buttons over two rows.
- **Suggested fix:** let the toolbar wrap below `md` (`flex-wrap`, with Add `flex-grow-1` on its own row), or turn Change order and Focus into icon buttons with labels below `sm`. Don't shrink the item rows.

### A4. Closing the mobile Categories dialog drops focus to `<body>` (390 px)
- **Status:** fixed 2026-10-07 (`F98`: `@afterLeave` refocuses the Categories button. Verified for Close, Escape and picking a category)
- **Severity:** a11y
- **Where:** @390×844 · `/todo-list` → `src/core/todoList/view/TodoListsView.vue:4-27` (`VDialog v-model="categoryDrawerOpen"`, no `activator`) opened by the `d-md-none` Categories button at `:68-75`.
- **Expected:** when a dialog closes, focus returns to the control that opened it (WAI-ARIA dialog pattern). The template counts focus lost around a drawer or dialog as `a11y`.
- **Actual:** opening works: focus moves into `.v-overlay__content`. Closing it, by **Close** or by Escape, leaves `document.activeElement` on `<body>`. A keyboard or switch user lands at the top of the document, not on the Categories button. Selecting a category (`onMobileSelectCategory`) closes the same dialog the same way. Not directly checked, since selecting changes the list filter, but it's the same code path.
- **Evidence:** `eval` of `document.activeElement` → `"BODY"` after Close, and again after Escape. Before closing it was `v-overlay__content`.
- **Repro:** 1. `resize 390 844`, open `/todo-list`. 2. Click "Categories". 3. Click "Close". 4. Check `document.activeElement`.
- **Verify:** 1. `playwright-cli resize 390 844`, then `reload` on `/todo-list`. 2. Click `getByRole('button', { name: 'Categories' })`, then `getByRole('button', { name: 'Close' })`. 3. **Pass condition:** `document.activeElement` is the Categories button. 4. Repeat with Escape instead of Close; same pass condition.
- **Root cause guess:** the dialog is driven by `v-model` with no `activator`, so Vuetify has no element to give focus back to. Same class as `_shell` A4 (the mobile nav drawer), but a different component.
- **Suggested fix:** pass the Categories button as the dialog's `activator` (template ref or `activator="parent"`), or refocus it in a `@afterLeave` handler.

### P2. The icon picker keeps 7 columns at any width, clipping every icon name to 2–3 letters — [framework] (390 px)
- **Status:** open
- **Severity:** polish — **[framework]**
- **Where:** @390×844 · `src/_common/component/inputs/IconPickerDialog.vue:251-256` (`.icon-grid { grid-template-columns: repeat(7, 1fr) }`) and `:278-287` (`.icon-name`, 2-line clamp). Opened from `/todo-list` → New list → Icon (also New category → Icon, same component). Any app view using `IconPicker` will match.
- **Expected:** the label under each icon is readable, or not shown when it can't be (plain sense: the label exists to tell look-alike icons apart).
- **Actual:** the dialog is 342 px wide, so each tile is ≈ 37 px. Names wrap and clamp to fragments: "Do l…" (dollar-sign), "Tr u…" (truck), "Ro t…", "Ali g…", "Ca l…". The tiles are big enough to tap (≈ 37×75), so this is polish, not a target-size issue. No sideways overflow.
- **Evidence:** `docs/views/todo-lists/screenshots/todo-lists-icon-picker--mobile.png`.
- **Repro:** 1. `resize 390 844`, open `/todo-list`. 2. New list → click the Icon field. 3. Read the labels under the icons.
- **Verify:** 1. `playwright-cli resize 390 844`, then `reload` on `/todo-list`. 2. Open New list, click the Icon field. 3. **Pass condition:** every visible `.icon-name` has `scrollHeight <= clientHeight` and shows at least one whole word, or names are hidden below `sm` and exposed as `title`/`aria-label`. At 1440 the grid is unchanged.
- **Suggested fix:** `grid-template-columns: repeat(auto-fill, minmax(72px, 1fr))`, or 4 columns below `sm`.

### P3. In Change order mode the drag handle never appears on a touch screen — it's hover-only (390 px)
- **Status:** open
- **Severity:** polish
- **Where:** @390×844 · `src/core/todoList/component/BaseTodoListItem.vue:429-447` (`.drag-handle { opacity: 0 }`, shown only by `.listItem:hover` / `.drag-handle:hover`). Shared by `NormalTodoListItem` and `RoutineTodoListItem`: `/todo-list/:id` → Change order, and `/routine-todo-list` → Reorder.
- **Expected:** a mode whose whole purpose is dragging shows what to drag. A phone has no hover (template §3). `TodoListCategoryPanel.vue:265-269` already handles this with `@media (hover: none) { opacity: 1 }`.
- **Actual:** after entering reorder mode, with the pointer away from the list, every `.drag-handle` has computed `opacity: 0` (`/todo-list/13001`: 19×40 at x 361; `/routine-todo-list`: 19×40 at x 330). The rows look exactly as they did before, except that the other controls are disabled. The handle is also `color="white"` on a light card, so even when hovered it's faint in the light theme. Dragging itself is wired to the whole row, not the handle (`useTodoItemDraggable`), so this is a missing cue, not a missing control. Whether touch-dragging works at all is U4.
- **Evidence:** `docs/views/todo-lists/screenshots/todo-list-id-change-order--mobile.png`. `eval` on `.drag-handle` → `opacity 0` in both views.
- **Repro:** 1. `resize 390 844`, open `/todo-list/13001`. 2. Click Change order (no save happens until a drop). 3. Look for handles; click Finish reordering.
- **Verify:** 1. `playwright-cli resize 390 844`, then `reload` on `/todo-list/13001`. 2. Click `getByRole('button', { name: 'Change order' })`, then move the mouse to (5, 830). 3. **Pass condition:** under `(hover: none)` emulation (or with a non-hover rule), `.drag-handle` computed opacity is > 0. 4. Same on `/routine-todo-list` → Reorder. Click Finish reordering both times.
- **Suggested fix:** add `@media (hover: none) { .drag-handle { opacity: 1 } }`, as the category panel does, and pick a theme-aware colour instead of `white`.

### U4. Whether drag-to-reorder works with touch at all is unverified (390 px)
- **Status:** open
- **Severity:** unverified
- **Where:** @390×844 · `src/core/todoList/composable/dragAndDrop/useTodoItemDraggable.ts` (`@atlaskit/pragmatic-drag-and-drop` `draggable()`, which runs on the native HTML5 drag events). `/todo-list/:id` → Change order and `/routine-todo-list` → Reorder, including cross-group drops.
- **What would verify it:** native HTML5 drag-and-drop on touch depends on the browser: recent Chrome on Android starts a drag on long-press, and iOS Safari supports it from 15. Desktop Chromium resized to 390 px doesn't emulate touch dragging, and this pass mustn't drag anything (read-only). It needs a real phone or an emulator with touch: long-press a row in Change order mode, drag it two rows down, and check that the drop indicator appears and `PATCH …/change-display-order` fires (`todoListItemApi.ts:88`, `routineTodoListApi.ts:56`). If it doesn't work, reordering has no other path on a phone (no move-up/down actions, no keyboard alternative, per the inventory's Keyboard section), and this becomes a `bug`.
