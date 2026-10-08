# activity-settings — findings

> Pass: mutation · captured 2026-09-15 · commit `04c405e9`

**Tally (as of round 6):** blocker 0 open (X1 fixed and verified live) · bug 1 open (B10; B1–B9 fixed and verified live) · a11y 0 open (A1 verified live) · polish 1 open (P3; P1, P2 verified live) · opportunity 0 open (O1 built and verified live) · unverified 0 open (U1/U2 resolved in round 2, U3 by `F23`, U4 by the `F18` retest). 20 entries, **2 open**, both from the x4 narrow-viewport pass.

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-13 | `df2b163d` | initial inventory pass |
| 1b | 2026-09-13 | `df2b163d` | dev server had gone down and the account had been reseeded (fixture `e2e-v3`, see the operator note below) in between; re-verified B1-B7, A1 and P1 against the fresh session — all reproduced identically (same seeded ids/names). Confirmed U3 (browser back collapses filter edits, per `router.replace`) and opened the Role/Category create dialogs (formerly U2/U5) — folded a new confirmed defect (B7: Roles/Categories never disable Delete for a non-deletable row) out of that work, and narrowed the old U2 to what's still genuinely unknown (what a Delete click on a protected row actually does server-side). Tally: bug 6→7, unverified 6→4. |
| 2 | 2026-09-15 | `04c405e9` | **mutation pass**, fixture `e2e-v4`. Ran the full entity lifecycle (create → edit → archive → unarchive → merge → delete) for Activity — every step worked correctly, including the merge confirmation's exact-count copy and the nested double-confirmation. Attempting the same for Role/Category surfaced a new **blocker** (X1: create/edit is completely broken for both tabs — the framework `ColorPicker` emits a palette name like `"rose"` but the backend now requires a hex string) and a new bug (B8: the generic delete-confirmation dialog they fall back to shows the raw numeric id, not the name). Resolved **U1** (archived-empty copy confirmed correct) and **U2** (system-role delete is correctly refused server-side with a good, specific message — which is itself hidden by a newly-found framework bug, B9). Reconfirmed B1-B7 still open against the new fixture. Tally: blocker 0→1, bug 7→9, unverified 4→2. |
| 3 | 2026-09-24 | `1fb9de9e` | **code-only re-check** (no browser session, no reseed) — read the current source for every open finding rather than re-driving the UI. **Fixed in code:** B2/B3 (`useActivityFilterDrafts.ts` was rewritten — combobox rebuild is now a pure derivation, filter writes come only from user input via `onRoleComboboxInput`/`onCategoryComboboxInput`, comments at the top of the file cite both bugs by number), B4 (`DataTable.vue:91` now binds `:title="action.text"`), B5 (`src/router.ts` now has a `/:pathMatch(.*)*` → `NotFoundView` catch-all), B6 (`navItems.ts` registers the family path `/activity-settings`, not the literal `activities` tab, with a comment citing F14), B7 (`ActivityRoleTable.vue`/`ActivityCategoryTable.vue` now have a custom `#actions` slot gating Delete on `canDelete`, matching `ActivityTable.vue`'s pattern), B8 (same custom slot passes `item.name` into the confirmation text directly, no more `deleteConfirmationColumn` gap), B9 (`extractServerMessage` in `axiosConfig.ts` now checks `errors` before `message`), A1 (the trash `VIconBtn` now has `:aria-label`, wrapped in a `VTooltip` on the parent span), P1 (Categories' "Role" column renamed to `t('activities.rolesInUse')` = "Roles in use"), P2 (both comboboxes in `ActivitySettingsView.vue` now set explicit `style="min-width: 200px"`). **Still open, confirmed unchanged:** X1 (`ColorPicker.vue:31` still does `model = color.name`, a palette name, not hex — the blocker stands), O1 (still no icon column in either table). **Not verifiable from code alone:** B1 (backend-side filter handling — frontend request shape is unchanged, so it is presumed still open, but this needs a live request/response check against the running API, not a source read). U3/U4 are session-lifetime/one-off observations, not code defects — left as-is. No browser session was run this round, so this is a source-level check only, not a fresh repro. |
| 4 | 2026-09-24 | `1fb9de9e` | **live check of X1 and B1**, no reseed. Round 3's "X1 still open" read the wrong side: `ColorPicker` emitting a palette name is the *intended* contract. The API moved to it in B10 (`f4ae199`, `b34181e`: `ColorRuleExtensions.MustBePaletteColor`, `ColorPalette` — the same 29 names as `colorPalette.ts`). B1 was the API's filter record declaring `RoleId`/`CategoryId` while the client sent `roleIds`/`categoryIds`, fixed in B11 (`68ec991`). No frontend change was needed for either. Both close as **fixed and verified**; see each finding's Status for evidence. The same session also reconfirmed B2/B3 (URL param survives, one grid request), B7 (disabled Delete with a reason label on in-use/system roles) and B8 (confirmation names the row, button reads "Delete"). The fixture is unchanged: the Health & Fitness edit saved identical values, and the throwaway category was deleted (204). Side fix: the Role/Category Name fields' client-only `lettersWithDiacriticsAndSpecialCharsRule` rejected digits ("letters and special characters only"), so `X1VerifyCategory` could not be submitted. The API only requires non-empty and max length, and a name is the user's own label, so the rule was dropped from `ActivityRoleForm.vue`/`ActivityCategoryForm.vue`, keeping `requiredRule`. The framework rule itself is untouched. |
| 5 | 2026-09-24 | `d423edcc` | **retest round** — 12 retested live: B2, B3, B4, B5, B6, B7, B8, B9, A1, P1, P2, O1 pass; none reopened; none blocked. Deviations: B4 checked on `/leisure/projects` (Roles/Categories no longer render `DataTable`'s default actions since B7); B9 via a `playwright-cli route` 400 mock, since B7 leaves no clickable server refusal; B7's disabled-Delete condition holds for Roles only, Categories are always-enabled by design. Account(s): primaryUser (10001). Mutations made and reverted: locale EN→SK→EN (twice, confirmed EN); one DELETE route mock, unrouted, row intact; one delete dialog cancelled. Regressions seen outside the Verify blocks: none. Status drift reconciled afterwards: U3 (closed by `F23`) and U4 (closed by the `F18` retest) still read `open` here and are now marked resolved; tally updated. |
| 6 | 2026-10-06 | `27dd210b` | **x4 narrow viewport (390×844)** — 3 views checked (Activities, Roles, Categories tabs); new: B10, P3. The tab bar fits (8–312). Row actions are reachable by swiping the table, and the create/edit dialogs fit. The Merge dialog wasn't opened, because it needs row checkboxes ticked and this pass is read-only. |

**Operator note (round 2):** this round deliberately did **not** run `POST /api/test/seed` to clean up, even though one seeded activity ("Unused Idea", id 12012) was permanently deleted as part of delete-lifecycle testing and could not be restored through the UI (Activity creation works, but the new row would get a different id than the fixture's). Reseeding wipes every account, and this round's own git-status snapshot showed several other `view-docs` units mid-edit, so a shared reseed risked repeating the exact parallel-session collision `findings.md` round 1b already recorded. **Whoever runs the next unit against this account should reseed first** and can then disregard this note.

**Operator note (round 1):** this round's draft e2e spec run (the template's mandated "run only your own file, once"
step) triggered `POST /api/test/seed` via `e2e/global-setup.ts`, resetting every account to fixture `e2e-v3`
— done in error while two other view-docs units were running in parallel, which CLAUDE.md explicitly warns
against (it wipes every account and invalidates every `e2e/.state/auth-*.json`). All findings below were
captured beforehand against the prior fixture; see the caveat at the top of `inventory.md`. If the other two
units' passes look like they lost data or got signed out partway through, this is why.

---

### X1. Creating or editing a Role or Category is completely broken — the Color field always fails server validation
- **Status:** fixed and verified (round 4, 2026-09-24, live). Fixed server-side in the API's B10 (`f4ae199`, `b34181e`): a colour is now a palette name everywhere (`MustBePaletteColor`), so `ColorPicker`'s `color.name` is the correct wire value and needs no change. Round 3's "still open" was mistaken. Live: `PUT /api/activity-role/11002` with Health & Fitness unchanged (`"color":"emerald"`) → **200**, dialog closed. `POST /api/activity-category` `{"name":"XVerifyCategory","color":"rose"}` → **201**, dialog closed, row appeared, then deleted (204).
- **Severity:** blocker
- **Where:** `/activity-settings/roles` and `/activity-settings/categories` → Create/Edit dialogs (`ActivityRoleForm.vue`, `ActivityCategoryForm.vue`) → `POST /api/activity-role`, `PUT /api/activity-role/:id`, `POST /api/activity-category`
- **Expected:** Filling in a valid name and submitting the Create/Edit form for a Role or Category should succeed, per plain user sense — this is the module's only lookup-table management screen, and A1/A4/A5's own verify steps assume creating a role/category works.
- **Actual:** Every Create **and every Edit** for both Roles and Categories fails with a 400. The framework's `ColorPicker.vue` (`src/_common/component/inputs/ColorPicker.vue:31`, `model = color.name`) writes a palette **name** (`"rose"`, `"red"`, …) into `RoleRequest.color`/`CategoryRequest.color`; the backend's validator now requires a hex string (`"Color must be a valid hex color code (e.g. #FFFFFF or #FFF)"`). This is not limited to newly-picked colors: editing an **existing, untouched** role ("Health & Fitness", whose stored color is already the name `"green"`) and clicking Save with no changes fails identically, because the edit form round-trips the same named value back to the server. The dialog gives the user no visible clue anything went wrong beyond a snackbar reading the unhelpful generic "One or more errors occurred!" (see B9) — it just sits open as if the click did nothing.
- **Evidence:** `POST /api/activity-role` request body `{"name":"ViewDocsTestRole","text":"...","color":"rose","icon":null}` → 400
  `{"statusCode":400,"message":"One or more errors occurred!","errors":{"color":["Color must be a valid hex color code (e.g. #FFFFFF or #FFF)"]}}`.
  Identical failure confirmed on `PUT /api/activity-role/11002` (Health & Fitness, no fields changed) and on `POST /api/activity-category` with color `"red"`. Screenshots:
  `screenshots/roles--create-400-bug.png` (dialog stuck open, no visible error), `screenshots/categories--create-400-bug.png`.
- **Repro:** 1. Go to `/activity-settings/roles`. 2. Click "+", fill Name, pick any Color swatch, click Create. 3. Request fails with 400; dialog stays open. 4. Separately: open Edit on any existing role, change nothing, click Save — same 400.
- **Verify:** 1. Repeat the repro for Create and Edit, on both Roles and Categories. 2. **Pass condition:** the request succeeds (2xx), the dialog closes, and the row appears/updates in the table.
- **Root cause guess:** Contract mismatch between the framework's `ColorPicker` (always emits a palette name) and this backend's validation (now requires hex) — either the backend tightened validation on a field the framework never sent hex for, or the backend previously accepted names and a recent change enforces hex. Existing rows still show named colors in their GET responses (`"color":"blue"` for "Work"), so this looks like a **write-path regression**, not a read/write format that was always hex. Not fixable from this repo alone without knowing which side is supposed to change; likely needs either the backend to accept the same palette names it already stores, or `ColorPicker` to be given a hex-emitting variant.
- **Suggested fix:** n/a — needs a decision on which side owns the color format. If the backend's hex requirement is intentional, `ColorPicker.vue` needs a hex-output mode (or `COLOR_PALETTE` needs a name→hex map at the call site); if not, the backend validator should accept the same values it already stores and returns.
- **Note:** this also breaks the inline "Add new role"/"Add new category" quick-create buttons inside the Activity create/edit dialog (`NewActivityForm.vue` opens the same `ActivityRoleForm`/`ActivityCategoryForm`) — not independently re-tested in the browser, but it is the identical component and request path, so it is affected by construction, not by inference from an untested code path with different inputs.

---

### B1. Picking a role or category from the settings filter does nothing — the server ignores `roleIds`/`categoryIds`
- **Status:** fixed and verified (round 4, 2026-09-24, live). Fixed server-side in the API's B11 (`68ec991`): `ActivityFilterRequest` declared only singular `RoleId`/`CategoryId`, so the client's `roleIds`/`categoryIds` were dropped on binding. It now declares both, and `GridActivityEndpoint` applies them any-of. Live: `/activity-settings/activities?roleIds=11001` → body `roleIds:[11001]` → `itemsCount: 9`, all 9 rows under "Work" (its `usageCount`). `?categoryIds=11501` → `itemsCount: 4`, all under "Deep Work". The URL kept its param and exactly one grid request fired (B2/B3 also hold).
- **Severity:** bug
- **Where:** `/activity-settings/activities` → Roles/Categories filter comboboxes → `POST /api/activity/grid`
- **Expected:** Per `A1-correctness-sweep.md` item 5 (a previously-fixed defect: "picking a role from the
  list contributes nothing to the filter"), selecting "Work" from the Roles combobox should narrow the table
  to activities under that role.
- **Actual:** The frontend correctly sends `roleIds:[11001]` in the request body (confirmed — the earlier
  frontend-binding bug from A1 item 5 is fixed), but the response is **identical to the completely
  unfiltered list** — same 22 items, same roles including "Health & Fitness" and "Hobbies & Leisure", not
  just "Work". Free-text `roleName` filtering works correctly (a nonsense value correctly returns 0 items),
  isolating the defect to the id-based path.
- **Evidence:** Request/response pair for `POST /api/activity/grid` with body
  `{"filter":{"roleIds":[11001], ...}}` returning `{"itemsCount":22,...}` including non-Work roles; contrast
  with the same request using `{"roleName":"NotARealRoleXYZ"}` correctly returning `{"itemsCount":0}`.
- **Repro:** 1. Go to `/activity-settings/activities`. 2. Open the Roles combobox and pick "Work" (not typed
  free text — an actual list option). 3. Observe the table.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** every visible row's Role column reads "Work". 3.
  Repeat for the Categories combobox with a real category option — same pass condition on the Category
  column.
- **Root cause guess:** Backend — the frontend's request shape is correct and matches
  `ActivityFilter`'s fields exactly (confirmed via source read); the `roleIds`/`categoryIds` fields appear to
  be unread server-side while `roleName`/`categoryName`/`name`/`text` are all honored. Not fixable from this
  repo alone; needs a backend-side check of the `/api/activity/grid` filter handling for these two fields
  specifically.
- **Suggested fix:** n/a — backend investigation needed. If this repo's contract is missing something (e.g.
  the two fields have a casing or shape mismatch the backend actually expects), a quick check would be to
  log the raw filter payload server-side and compare field names.

### B2. `roleIds`/`categoryIds` query params are silently dropped on a fresh page load
- **Status:** fixed and verified (retest 2026-09-24, live) — fresh `goto /activity-settings/activities?roleIds=11001` kept `?roleIds=11001` in the URL, the grid request carried `roleIds:[11001]`, and all 9 returned rows have role "Work".
- **Severity:** bug
- **Where:** `/activity-settings/activities?roleIds=…` or `?categoryIds=…`, direct navigation ·
  `src/core/activity/composable/useActivityFilterDrafts.ts` (the `onMounted` → `refreshActivityCombos()` →
  combobox-watcher chain)
- **Expected:** CLAUDE.md's URL-state rule, and `A5-url-state-and-filtering.md`'s explicit verify step
  ("filter the activities tab, copy the URL, open it in a new tab — same view"), require id-based filters to
  survive a fresh load exactly like the text filters do.
- **Actual:** `?name=read` and `?text=…` survive a fresh `goto` or `reload` correctly. `?roleIds=11001` and
  `?categoryIds=11501` are hydrated into `activitiesFilter` correctly for one tick, then **immediately wiped
  back to empty** before the first request ever fires — the URL itself loses the param within the same page
  load, and it does not come back once the options store finishes loading.
- **Evidence:** `playwright-cli goto ".../activities?roleIds=11001"` → `location.href` reads back as
  `".../activities"` (param gone) within the same load, repeatable 2/2 attempts on both `roleIds` and
  `categoryIds`; `?name=read` on the same route/session survives identically-performed reloads.
- **Repro:** 1. Fresh browser, sign in. 2. Navigate directly to
  `/activity-settings/activities?roleIds=11001`. 3. Check `location.href`.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** the URL still reads `?roleIds=11001` after load,
  and the table is filtered to Role = Work (once B1 is also fixed; until then, verify the URL and the
  outgoing request body only, not the visible rows).
- **Root cause guess:** `useActivityFilterDrafts.ts`'s `onMounted` hook calls `refreshActivityCombos()`
  synchronously, which builds the combobox chips by matching `activitiesFilter.value.roleIds` against
  `roleOptions.value` (`activitySettingsUrlParams.ts`'s `buildCombobox`). `roleOptions` is fed by
  `useActivityOptionsStore()`, an async fetch that has not resolved yet at that point in a fresh page load,
  so every id fails to match and `buildCombobox` returns `[]`. Assigning that new (if empty) array to
  `roleCombobox.value` still triggers its `watch(..., { deep: true })` (a ref reassignment always fires,
  even array-to-array-of-same-length-zero), which then writes `activitiesFilter.value.roleIds = []` —
  overwriting the correctly-hydrated ids **before the store's fetch ever resolves**. The later
  `watch([roleOptions, categoryOptions], …)` handler only re-derives the combobox display from the
  (already-wiped) filter, so there is no recovery path. Same mechanism as B3 below.
- **Suggested fix:** Guard `refreshActivityCombos()` (and the combobox watchers it feeds) so it does not run,
  or does not write back to `activitiesFilter`, until `roleOptions`/`categoryOptions` have loaded at least
  once — e.g. skip the initial mount call when the options arrays are still empty and rely solely on the
  `watch([roleOptions, categoryOptions], …)` handler to populate the combobox once data exists, without that
  handler ever writing back into the filter itself (it currently reuses the same function that does both
  read and write).

### B3. `POST /api/activity/grid` fires twice on every load of the Activities tab
- **Status:** fixed and verified (retest 2026-09-24, live) — `playwright-cli requests` after a fresh navigation shows exactly one `POST /api/activity/grid` (200) and no aborted request before it.
- **Severity:** bug
- **Where:** `/activity-settings/activities`, any fresh load or reload
- **Expected:** One request per table load, per CLAUDE.md's "duplicate requests" check.
- **Actual:** Every load fires the grid request twice: the first is `net::ERR_ABORTED`, the second succeeds
  with `200`. Reproduced 3/3 times (initial load, a `goto` to the same URL, a `reload`).
- **Evidence:** `playwright-cli requests` after each of 3 separate loads all show the identical pair
  `POST .../api/activity/grid => [FAILED] net::ERR_ABORTED` immediately followed by
  `POST .../api/activity/grid => [200]`.
- **Repro:** 1. Go to `/activity-settings/activities` (fresh load or `reload`). 2. Check the network log.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** exactly one `POST /api/activity/grid` per load, no
  aborted request preceding it.
- **Root cause guess:** Same mechanism as B2 — `BasicTable`'s own mount fires `loadItems()` once; the
  `onMounted` combobox rebuild described in B2 reassigns `roleCombobox`/`categoryCombobox` (even to the same
  empty value), which retriggers `useLookupTable`'s deep watch on the filter object and calls `loadItems()` a
  second time, aborting the first. The Roles and Categories tabs have no comboboses in their filter bar and
  do not exhibit this — confirmed no duplicate `POST /api/activity-role/grid` or
  `.../api/activity-category/grid` across the same test sequence.
- **Suggested fix:** Likely resolved by the same fix as B2 — stop the mount-time combobox rebuild from
  writing into the filter when nothing actually changed.

### B4. Framework `DataTable`'s default row-action buttons show the untranslated internal name, not the localized label
- **Status:** fixed and verified (retest 2026-09-24, live) — checked on `/leisure/projects` (`ProjectTable.vue`, default `DataTable` actions; Roles/Categories now use their own `#actions` slot since B7, so they no longer exercise this path): `title`/`aria-label` read "Edit"/"Delete" in EN and "Upraviť"/"Vymazať" in SK; account switched back to EN.
- **Severity:** bug — **[framework]**
- **Where:** `src/_common/component/dataTable/DataTable.vue:83` (`:title="action.name"`); observed via the
  Roles and Categories tabs' default Edit/Delete buttons
- **Expected:** The action button's tooltip/accessible name should be the localized label
  (`t('general.edit')` → "Edit" in English), matching every other named control in the app.
- **Actual:** The rendered `title` attribute is the raw internal slug `"edit"` / `"delete"` (lowercase, never
  translated), not the `"Edit"` / `"Delete"` string that is actually computed and passed into the same
  `TableAction`. Confirmed via DOM (`button.title === "edit"`, `=== "delete"`) on every row of both tables.
  Contrast with `ActivityTable.vue`'s own custom actions, which correctly show "Edit"/"Archive".
- **Evidence:** `TableAction` is constructed as
  `new TableAction('edit', t('general.edit'), ...)` in `BasicTable.vue:175` — `name` is the first
  (untranslated) positional arg, `text` is the second (translated) one. `DataTable.vue:83` renders
  `:title="action.name"`, reading the wrong field.
- **Repro:** 1. Go to `/activity-settings/roles`. 2. Inspect any row's Edit or Delete button's `title`
  attribute (devtools, or `button.title` via console).
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** the title reads "Edit"/"Delete" (or the current
  locale's translation), not the lowercase internal slug. 3. Switch to Slovak and confirm the title changes
  language too — today it would not, since it never went through `t()` in the first place.
- **Root cause guess:** One-line field mix-up in the framework's `DataTable.vue`. Affects every table across
  every app on the framework that uses `BasicTable`'s default (non-custom) row actions — this unit is just
  where it was discovered, not where it originates.
- **Suggested fix:** `DataTable.vue:83` — change `:title="action.name"` to `:title="action.text"`.

### B5. An invalid `:tab` value renders a blank page and floods the console with router warnings
- **Status:** fixed and verified (retest 2026-09-24, live) — `/activity-settings/nonsense` renders the NotFound view ("Page not found" / "Back to home"); `console warning` and `console info` show no router warnings.
- **Severity:** bug
- **Where:** `/activity-settings/nonsense` (or any value outside `activities|roles|categories`)
- **Expected:** `A5-url-state-and-filtering.md` item 4 explicitly asks for "default a missing tab to
  'activities' via a redirect." An invalid tab is the same class of problem as a missing one.
- **Actual:** The route regex correctly rejects the path (no false-positive match), but nothing catches the
  resulting no-match: the main content area renders completely blank (sidebar and top bar still render), no
  "not found" message of any kind appears, and the console logs 24 `[Vue Router warn]: No match found for
  location` warnings — one for the literal path, then 23 more repeating for an **empty-string** path,
  suggesting something (plausibly a nav-highlight or breadcrumb computation) retries the failed resolution
  in a loop.
- **Evidence:** `playwright-cli console warning` after `goto .../activity-settings/nonsense` returns 24
  matching warnings; screenshot shows an empty grey panel with sidebar/topbar intact.
- **Repro:** 1. Navigate to `/activity-settings/nonsense`. 2. Observe the main content area and the console.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** the app redirects to
  `/activity-settings/activities` (or shows an explicit not-found view) and the console logs no router
  warnings.
- **Root cause guess:** No catch-all/`:pathMatch(.*)*` redirect exists for this route family, and something
  in the shell (nav highlighting or breadcrumbs, per the repeating empty-path warnings) keeps re-attempting
  resolution against the failed route.
- **Suggested fix:** Either broaden the route to `:tab(activities|roles|categories)?` with a
  `beforeEnter` that redirects anything non-matching to `activities`, or add this path shape to the app's
  global not-found handling if one exists elsewhere in `router.ts`.

### B6. Breadcrumb shows only "Home" on the Roles and Categories tabs (direct navigation)
- **Status:** fixed and verified (retest 2026-09-24, live) — direct navigation to `/activity-settings/roles` and `/activity-settings/categories` both show "Home › Activity settings" with Home as a link.
- **Severity:** bug
- **Where:** `AppBreadcrumbs` (framework) on `/activity-settings/roles` and `/activity-settings/categories`
- **Expected:** Same breadcrumb as the Activities tab — "Home › Activity settings" (confirmed correct there).
  All three tabs share one route `name` (`'activitySettings'`), so there is no reason for the crumb to differ
  by tab.
- **Actual:** On a direct navigation to `/activity-settings/roles` or `/activity-settings/categories`, the
  breadcrumb renders **only** "Home" as plain (non-link) text — as if the current page were Home, not
  Activity settings. `/activity-settings/activities`, on the same account and session, correctly shows
  "Home › Activity settings" with "Home" as a link.
- **Evidence:** Snapshot diff: `/activity-settings/activities` →
  `listitem: link "Home"` + `listitem: generic "Activity settings"`; `/activity-settings/roles` and
  `/activity-settings/categories` → `listitem: generic "Home"` only, on otherwise-identical accessibility
  trees (same session, back-to-back navigations).
- **Repro:** 1. Navigate directly to `/activity-settings/roles`. 2. Read the breadcrumb.
- **Verify:** 1. Repeat the repro for both `roles` and `categories`. 2. **Pass condition:** breadcrumb reads
  "Home › Activity settings" on both, matching the `activities` tab.
- **Root cause guess:** `navItems.ts` registers only the literal path `/activity-settings/activities` for
  the sidebar entry; if `AppBreadcrumbs` resolves the current crumb by matching the literal current path
  against nav-tree entries rather than by the route's `name`, then `roles`/`categories` simply fail to match
  anything and fall back to showing just the root crumb.
- **Suggested fix:** Either register all three tab paths in `navItems.ts` (even if only `activities` is
  actually shown in the sidebar), or fix the framework's breadcrumb resolution to match by route `name`
  first and fall back to path matching only when no name match exists.

### B7. Roles and Categories tables never disable Delete for a non-deletable row, unlike Activities
- **Status:** fixed and verified (retest 2026-09-24, live) — all 6 seeded roles are `canDelete:false` and every Role Delete is disabled with a specific reason as its accessible name ("Activities with this role: N. Move them…" / "The app itself uses this role…"). Categories keep Delete enabled **by design** (the server reclassifies a used category's activities, so `canDelete` is advisory there) and confirm with a cascade count instead (see B8).
- **Severity:** bug
- **Where:** `/activity-settings/roles`, `/activity-settings/categories` — the default `BasicTable` Delete
  action (`src/_common/component/dataTable/BasicTable.vue:209-216`)
- **Expected:** Both `Role` and `Category` responses carry `canDelete`/`usageCount`, exactly like `Activity`
  does, and the Activities table correctly disables its Delete button with an explanatory tooltip when
  `!item.canDelete` (`ActivityTable.vue:127,135`). The same protection should exist on the other two tables —
  there is no reason a referenced or system-protected row should offer a plain, always-enabled delete.
- **Actual:** Neither `ActivityRoleTable.vue` nor `ActivityCategoryTable.vue` reads `canDelete` at all — they
  use `BasicTable`'s default action, which is always enabled and shows a generic
  `t('general.deleteConfirmationText', { name })` confirmation ("Are you sure you want to delete X?") with no
  awareness of whether the delete can actually succeed. Confirmed on the seed data: the three system roles
  ("Planner task", "Routine task", "To-do list task" — `systemKey` set, `canDelete: false`) and every
  in-use role/category (e.g. "Work", `usageCount: 9`, `canDelete: false`; "Errands", `usageCount: 10`,
  `canDelete: false`) all render their Delete button as `disabled: false` in the DOM. The confirmation
  dialog's copy also gives no hint that the target is a system role — "Are you sure you want to delete
  Planner task?" reads identically to any user-created role.
- **Evidence:** `POST /api/activity-role/grid` response includes
  `{"systemKey":"plannerTask","canDelete":false,"name":"Planner task",...}`; DOM check on that row's buttons:
  `{"title":"delete","disabled":false}`. Same pattern confirmed for all three Categories rows
  (`canDelete:false` for every one, `disabled:false` on every Delete button).
- **Repro:** 1. Go to `/activity-settings/roles`. 2. Inspect the Delete button's `disabled` state on the
  "Planner task" row (or any row — none are disabled). 3. Compare with `/activity-settings/activities`,
  where a referenced activity's Delete button is genuinely disabled.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** a role/category with `canDelete: false` has a
  disabled Delete button with an explanatory tooltip, matching the Activities table's pattern.
- **Root cause guess:** `ActivityRoleTable.vue`/`ActivityCategoryTable.vue` were built before (or without
  porting) the `canDelete` gating that `A9-archive-and-merge.md` added to the Activities table — they still
  use `BasicTable`'s generic default actions instead of a custom `#actions` slot like `ActivityTable.vue`'s.
- **Suggested fix:** Give both tables a custom `#actions` slot mirroring `ActivityTable.vue`'s Delete button
  (`:disabled="!item.canDelete"` + a tooltip explaining why), the same pattern already proven there.
- **Note:** round 1 deliberately did not click Delete on a system role to see what the server does. Round 2
  (mutation pass) did, since a mutation pass is expected to reseed afterward — see **U2**, now resolved: the
  server correctly refuses with a 409 and the role is not deleted. The missing client-side safeguard
  documented here is still open regardless of that finding.

### B8. Roles/Categories delete confirmation shows the raw numeric id instead of the row's name, and a generic "Confirm" instead of "Delete"
- **Status:** fixed and verified (retest 2026-09-24, live) — Delete on category "Errands" opened "Are you sure you want to delete Errands? Activities in this category: 10. They are kept, but lose their category." with a "Delete" button; cancelled.
- **Severity:** bug
- **Where:** `/activity-settings/roles`, `/activity-settings/categories` — the default `BasicTable` delete
  confirmation dialog (`src/_common/component/dataTable/BasicTable.vue:199-210`)
- **Expected:** The confirmation should name what is about to be deleted, the way the Activities tab's own
  delete confirmation does ("Are you sure you want to delete Bug Fixing?").
- **Actual:** Clicking Delete on the "Planner task" role opens a dialog reading **"Are you sure you want to
  delete 4?"** — `4` is the role's raw database id, not its name. The confirm button also reads generic
  "Confirm" rather than "Delete" (the Activities tab's custom dialog explicitly sets `confirmBtnLabel`; this
  generic one does not).
- **Evidence:** `screenshots/roles--delete-confirm-raw-id.png`. Source: `BasicTable.vue`'s `del(item)` does
  `const name = deleteConfirmationColumn ? getNestedValue(item, deleteConfirmationColumn) : item.id` — neither
  `ActivityRoleTable.vue` nor `ActivityCategoryTable.vue` passes a `deleteConfirmationColumn` prop, so it falls
  through to the raw id every time, for every row, on both tables.
- **Repro:** 1. Go to `/activity-settings/roles` (or `/categories`). 2. Click the delete icon on any row.
  3. Read the confirmation text.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** the dialog names the row by its `name` field, not its
  id, and (optionally, lower priority) the confirm button reads "Delete".
- **Root cause guess:** `BasicTable`'s generic actions were adopted by both tables (see B7's same root cause)
  without passing the `deleteConfirmationColumn="name"` prop the component already supports.
- **Suggested fix:** Add `deleteConfirmationColumn="name"` to both `<BasicTable>` usages.

### B9. `extractServerMessage` shows the generic top-level `message`, hiding the specific, useful text in `errors` — framework-wide
- **Status:** fixed and verified (retest 2026-09-24, live) — no server refusal is reachable by clicking any more (B7 disables every refusable role Delete), so `DELETE /api/activity-category/11501` was answered by a `playwright-cli route` mock: 400 with generic `message` plus `errors.generalErrors` = the system-role text. The snackbar showed the specific `errors` text, not "One or more errors occurred!"; route removed, row still present.
- **Severity:** bug — **[framework]**
- **Where:** `src/_common/axiosConfig.ts:86-101` (`extractServerMessage`), which feeds every automatic error
  snackbar in the app (`axiosConfig.ts:217-262`)
- **Expected:** When a backend error response carries both a generic top-level `message` and a specific,
  human-written explanation in `errors`, the snackbar should show the specific one — that is clearly the
  intent, since the function already has a branch that reads `errors` at all.
- **Actual:** `extractServerMessage` checks `obj.detail`, then `obj.message`, then `obj.errors`, **returning as
  soon as any of them is non-empty**. This backend's error shape always sets a generic `message` ("One or more
  errors occurred!") alongside the useful text in `errors`, so the `errors` branch is dead code against this
  API — the specific string is never reached. Confirmed twice in this pass with genuinely useful backend text
  that the user never sees:
  1. X1's color validation: `errors.color` = `"Color must be a valid hex color code (e.g. #FFFFFF or #FFF)"` —
     the user sees "One or more errors occurred!" instead.
  2. The system-role delete guard (409, see U2): `errors.generalErrors` = `"This is a system role the app
     files quick-created activities under, so it cannot be deleted. You can rename it instead."` — again
     replaced by the same generic string.
- **Evidence:** Response bodies quoted in X1 and U2; `extractServerMessage`'s field-check order in
  `axiosConfig.ts:87-99`.
- **Repro:** 1. Trigger any 400/409 from this backend that has both `message` and `errors` set (X1's repro
  works). 2. Read the snackbar text.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** the snackbar shows the specific text from `errors`
  (e.g. the color-format message or the system-role message), not "One or more errors occurred!".
- **Root cause guess:** `obj.message` is checked before `obj.errors` in `extractServerMessage`; for this
  backend's error shape the two are never both meaningful at once, so the check order needs reversing (prefer
  `errors` when present, fall back to `message`).
- **Suggested fix:** In `extractServerMessage`, try the `errors`-extraction branch before the plain
  `obj.message` check, at least when `message` is a generic, non-actionable string. Framework-level fix —
  affects every app on this backend shape, not just this module.

---

### A1. The Activities table's Delete button has no accessible name
- **Status:** fixed and verified (retest 2026-09-24, live) — enabled ("Unused Idea", 12012): `aria-label="Delete"`, and `getByRole('button', { name: 'Delete' })` resolves to it; disabled ("Brush Teeth", `canDelete:false`): `aria-label` = the `activities.archive.deleteBlocked` text ("Only an activity nothing refers to can be deleted. Archive this one instead.").
- **Severity:** a11y
- **Where:** `src/core/activity/component/ActivityTable.vue:121-137` (the custom `#actions` slot's trash
  `VIconBtn`)
- **Expected:** Every icon-only control needs an accessible name (CLAUDE.md's icon-button convention, and
  plain WCAG expectation) — the sibling Edit and Archive buttons in the same row both get one via a `:title`
  prop.
- **Actual:** The trash `VIconBtn` has no `:title` and no `aria-label` at all. Confirmed via DOM:
  `button.title === ""`, `button.getAttribute('aria-label') === null`, both disabled and (by code read)
  enabled states — the prop is simply never set, unlike Edit (`:title="t('general.edit')"`) and Archive
  (`:title="…"`) two lines above it in the same template. The only place a label exists is a `VTooltip`
  attached to the **wrapping `<span>`** (needed so a disabled button still shows a tooltip explaining why),
  which is not the same as the button itself having an accessible name — a screen reader or role+name
  locator addressing the button directly gets nothing.
- **Evidence:** `eval` of `tbody button` elements: Edit → `title: "Edit"`; Archive → `title: "Archive"`;
  Delete → `title: ""`, `aria: null`. `playwright-cli find "Delete"` returns no matches on this table.
- **Repro:** 1. Go to `/activity-settings/activities`. 2. Inspect any row's trash-icon button's `title`/
  `aria-label`.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** the button exposes a localized accessible name
  (e.g. via `:title="t('general.delete')"` or `t('activities.archive.deleteBlocked')` when disabled), and a
  role+name locator (`getByRole('button', { name: 'Delete' })`) resolves to it.
- **Root cause guess:** The `:title` prop was likely omitted because the tooltip text needs to differ by
  `canDelete` state and the tooltip was moved to the wrapper span to work around Vuetify's disabled-button
  pointer-events issue — but the button's own accessible name got dropped in the process instead of being
  set to the same conditional string.
- **Suggested fix:** Add `:title="item.canDelete ? t('general.delete') : t('activities.archive.deleteBlocked')"`
  to the trash `VIconBtn` itself (same conditional text already used by the `VTooltip` two lines below it).

---

### P1. Categories table's "Role" column is a derived, potentially multi-value aggregate, not a stored relationship
- **Status:** fixed and verified (retest 2026-09-24, live) — the Categories column header reads "Roles in use".
- **Severity:** polish
- **Where:** `/activity-settings/categories`, "Role" column · `src/core/activity/dto/response/Category.ts`
  (`role: string | null`), `src/core/activity/dto/request/CategoryRequest.ts` (no `roleId` field at all)
- **Expected:** Plain user sense — a singular column header named "Role" implies one value, and implies a
  category is scoped to a role the way `docs/views/glossary.md` describes it.
- **Actual:** The "Errands" category's Role cell reads "Health & Fitness, Hobbies & Leisure, Work" — a
  comma-joined string of every distinct role among the activities currently using that category. Confirmed
  the field is genuinely computed, not a stored FK: `CategoryRequest` (the create/edit payload) has no
  `roleId`/role field whatsoever, so a category cannot be assigned a role through the UI at all.
- **Evidence:** `POST /api/activity-category/grid` response:
  `{"role":"Health & Fitness, Hobbies & Leisure, Work", "name":"Errands", ...}`.
- **Repro:** 1. Go to `/activity-settings/categories`. 2. Find a category used by activities under more than
  one role (e.g. "Errands" in the seed data). 3. Read its Role cell.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** either the column is relabeled to make clear it is
  an aggregate ("Used under", "Roles in use", …) and/or rendered as chips rather than a comma string, so it
  no longer reads as a single stored value.
- **Suggested fix:** Rename the column, or render multiple roles as small chips instead of one string —
  either is a low-effort clarity fix once someone decides which framing is intended.

### P2. The Categories filter combobox's label is visibly truncated
- **Status:** fixed and verified (retest 2026-09-24, live) — at 1440×900 "Categories" and "Roles" both render in full (`screenshots/retest-2026-09-24-P2.png`).
- **Severity:** polish
- **Where:** `/activity-settings/activities`, filter bar, the "Categories" multi-select combobox
- **Expected:** A label should render in full, or the field should be wide enough for it, consistent with
  the adjacent "Roles" combobox.
- **Actual:** At the captured viewport (1920×889, full-page screenshot), the Categories combobox renders its
  label as "Catego…" (visibly clipped), while "Roles" — a shorter word occupying a similarly-sized field —
  renders in full.
- **Evidence:** `screenshots/activities--default.png` (visual sweep) — the "Catego..." truncation is visible
  in the filter bar's fourth control.
- **Repro:** 1. Go to `/activity-settings/activities` at a standard desktop viewport. 2. Look at the
  Categories filter field's label.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** "Categories" renders in full, not truncated.
- **Suggested fix:** Give the Categories field slightly more `min-width`, or let the filter bar's flex
  allocation size by content rather than an even split.

---

### O1. Role/Category icon is captured and used elsewhere, but never shown in the settings tables themselves
- **Status:** fixed and verified (retest 2026-09-24, live) — Roles: all 6 Icon cells render the row's `icon` (`<svg data-icon>` matched 1:1 against the grid response, e.g. Work → `briefcase`); Categories: all 3 seeded rows have `icon:null` and render "—". Original fix note (round 3): added an Icon column to both `ActivityRoleTable.vue` and `ActivityCategoryTable.vue`, rendered as a `VIcon` bound directly to `item.icon` (a `—` placeholder when unset), same treatment as the existing color-swatch cell. `npm run type-check` (`vue-tsc --build --force`) passes clean. Note while fixing: the "used elsewhere" half of the original write-up (`ActivitySelectionForm.vue:92`) turned out to be a **different, hardcoded** icon (`'user-tag'`/`'folder'` for the narrowing chips), not `role.icon`/`category.icon` — doesn't change the fix, just worth knowing the original evidence for that clause was slightly off. Not yet re-verified live in the browser.
- **Severity:** opportunity
- **Where:** `/activity-settings/roles`, `/activity-settings/categories` — no Icon column in either table
- **Expected:** n/a — nothing is broken; this is spent effort with no payoff at the point of entry.
- **Actual:** Both `ActivityRoleForm.vue` and `ActivityCategoryForm.vue` include an `IconPicker`, and every
  Role/Category API response carries a real `icon` value (e.g. `"icon":"fas fa-briefcase"` for "Work"), and
  it **is** read elsewhere — `ActivitySelectionForm.vue:92` renders a role/category chip icon in the activity
  picker. But neither settings table shows it, so a user who just picked an icon while creating/editing a
  role or category has no way to confirm what they picked without reopening Edit.
- **Evidence:** `ActivityRoleTable.vue`/`ActivityCategoryTable.vue` column lists (Name/Text/Color and
  Role/Name/Text/Color respectively) — no `icon` column; API response for "Work" includes
  `"icon":"fas fa-briefcase"`.
- **Suggested fix:** Add a small icon column (or fold it into the existing color-swatch cell) to both
  tables, matching the box-archive icon treatment already used in the Activities table.

---

### U1. ~~The "no archived activities" empty-state copy was not independently confirmed~~ — resolved
- **Status:** fixed and verified (2026-09-15, mutation pass round 2 — this was already correct, not a code fix)
- **Severity:** unverified (closed)
- **Where:** `ActivityTable.vue:144` (`archivedOnlyView` ternary), Archived filter view
- **Verified:** Temporarily un-archived the seed's only archived activity ("Retired Hobby") to empty the
  Archived view, confirmed the table renders exactly the copy `t('activities.archive.noneArchived')` ("Nothing
  has been archived yet.") with **no** create button (`TableEmptyState`'s `v-if="!isFiltered"` correctly hides
  it for a filtered empty state) — `screenshots/activities--archived-empty-mutation.png`. Re-archived "Retired
  Hobby" immediately afterward to restore the seed's original state (confirmed back to "1-1 of 1" on the
  Archived view).

### U2. ~~What actually happens when Delete is clicked on a system or referenced role/category~~ — resolved
- **Status:** fixed and verified (2026-09-15, mutation pass round 2 — server-side behavior is correct; the
  UI-side gap this uncovered is now B9)
- **Severity:** unverified (closed)
- **Where:** `/activity-settings/roles` — confirmed on "Planner task" (`systemKey: plannerTask`)
- **Verified:** Clicked Delete → Confirm on the "Planner task" system role. The server correctly refused with
  `409 Conflict` (`DELETE /api/activity-role/4 => 409`) and the role was **not** deleted (confirmed still
  present in the table afterward). The server's own error message is good and specific: "This is a system
  role the app files quick-created activities under, so it cannot be deleted. You can rename it instead." —
  but the user never sees that text because of a separate, newly-found bug, **B9**, which shows the generic
  "One or more errors occurred!" instead. B7 (missing client-side disabled state) is still open regardless —
  the button should never have offered this action in the first place.

### U3. ~~A repeated 401→refresh failure that ends in a real sign-out, not root-caused~~ — resolved
- **Status:** resolved (docs only, `F23`, 2026-09-23) — explanation (b) confirmed from the API source: every refresh rotates the token (`JwtService.cs:38`) and a stale one is tolerated for 5 s only (`RefreshTokenService.cs:35`), so two sessions sharing one state file sign each other out. Not a code defect; CLAUDE.md's *Browser verification* section and the view-docs runbook now require one state per session and a `state-save` after every load. See `_fix-queue-log.md` → `F23`.
- **Severity:** unverified
- **Where:** mid-pass, on `/activity-settings/activities` (twice, roughly 15-20 minutes apart)
- **What would verify it:** Both times, an aging session hit a burst of 401s (expected, per CLAUDE.md's
  "expect a burst of 401s" note) but did **not** recover the way the documented pattern describes — the
  second time, the network log showed `POST /api/auth/refresh` itself answering **401** (not just the
  original request), meaning the refresh token was rejected outright rather than the access token simply
  being stale. Re-signing in via the login form worked immediately and cleanly both times. Two plausible,
  un-distinguished explanations: (a) ordinary refresh-token TTL expiry on a long-running manual session (this
  pass ran considerably longer than the documented ~15-minute access-token window), or (b) if another
  parallel session shares the same `e2e/.state/auth-10001.json` storage state and its refresh flow rotates
  the token, a second session holding the pre-rotation token would see exactly this — a real collision risk
  the CLAUDE.md docs don't call out for parallel `playwright-cli` sessions. Not chased further since it is a
  session/token-lifetime concern rather than an activity-settings-specific defect, but worth flagging for
  whoever runs multiple view-docs units concurrently against the same storage-state file.
- **Re-checked in code (round 3, 2026-09-24):** `axiosConfig.ts`'s refresh handling is single-flight
  (`refreshSession()` — every 401'd request awaits the same in-flight `POST /auth/refresh`, cleared once
  it settles) and already refuses to refresh-and-retry a request that already carries the retry flag ("a
  401 that survived one refresh-and-retry: stop here rather than loop forever"). Both explanation (a)
  (ordinary refresh-token TTL expiry on a long session) and (b) (a second session rotating the same
  storage-state file's refresh token) remain fully consistent with the code as written — neither is ruled
  out by this read, and neither is a code defect to fix: (a) is expected token lifetime, (b) is the
  documented storage-state single-use hazard (CLAUDE.md's "a state file is single-use" section). **Leaving
  open, unchanged** — this is an environmental/session-lifetime observation, not something fixable in
  `activity-settings` code.

### U4. ~~A single unexplained "0 of 0" result on an unfiltered request, not reproduced on retry~~ — resolved
- **Status:** resolved (retested live with `F18`, 2026-09-15) — type "Deep" → clear, three rounds, reading `itemsCount` off each response: `1` then `26` every time, two requests per round and no third. The "0 of 0" did not recur, since `F18` removed the only competing request this view fires. See `_fix-queue-log.md` → `F18`.
- **Severity:** unverified
- **Where:** `/activity-settings/activities`, after clearing the Name filter mid-session (following several
  prior filter/tab interactions in the same session)
- **What would verify it:** Once, the table rendered the default (non-filtered-copy) empty state and
  "0-0 of 0" immediately after clearing the Name field, while the outgoing request body was
  `{"useFilter":false,"filter":null}` — a fully unfiltered request — on an account known to have 22
  activities. The response body for that specific request was not captured at the time, so it is unknown
  whether the server actually returned 0 items or a stale/aborted response (see B3, which already confirms
  this view fires competing requests on load) overwrote a newer one client-side. A clean retry (reload →
  clear filter) immediately afterward correctly showed "1-10 of 22" and did not reproduce it. Two further
  attempts in a later session (typing then clearing the Name filter; setting then clearing a free-text
  `roleName` chip) also failed to reproduce it — both times the table correctly recovered to "1-10 of 22" /
  `itemsCount: 22` after clearing. Leaning towards a one-off artifact of an unusual interaction order in the
  first session rather than a reliably reproducible defect, but leaving it logged rather than dismissed,
  since it was seen once with real evidence (an unfiltered request body next to a genuinely empty rendered
  table).
- **Re-checked in code (round 3, 2026-09-24):** the suspected mechanism — B3's mount-time double-fire
  racing a genuine request and a stale one overwriting it — is gone (B3 is fixed; see above). Separately,
  `useFetchFilteredTable.ts` (the shared fetch layer this table's `useLookupTable.ts` sits on) already
  guards exactly this race in code: `fetchFilteredTable()` aborts its own previous in-flight call, and its
  `.catch` explicitly checks `axios.isCancel(e) && latest !== promise` and resolves with the **newest**
  in-flight promise instead of surfacing the aborted one — so even a future race of this shape could not
  render a stale/empty result, only wait for the latest one. Between B3's fix removing the specific trigger
  and this pre-existing abort-race guard, the mechanism this finding worried about no longer looks
  reachable. **Downgrading confidence, not the status** — still logging it as open/unverified since it was a
  genuine one-off observation with real evidence, but a future repro attempt should hit for it.

---

### B10. The filter bar is pushed off-screen by the tabs: off to the right on Activities, and squeezed to 14 px slivers on Roles and Categories (390 px)
- **Status:** fixed 2026-10-08 (`F93`: below `md` the filter group takes its own full-width line under the tabs. At 390 the scroller is
  390/390 on all three tabs, the filters sit at 12–378 under the tabs, and Roles' two fields are 179 px each. At 1280 and 1440 the
  filters still sit beside the tabs, 56 px from them, and the Categories label isn't clipped (77/77, `F22` holds))
- **Severity:** bug
- **Where:** @390×844 · `/activity-settings/activities`, `/roles`, `/categories` →
  `ActivitySettingsView.vue:3-14` (row `d-flex align-center` with no wrap; `VTabs class="flex-0-0"`, 312 px;
  filter group `d-flex flex-wrap ga-2 ml-14 flex-1-1`; Roles/Categories comboboxes `min-width: 200px`)
- **Expected:** every filter is visible and usable on landing at phone width, as it is at desktop width
  (plain sense; WCAG 1.4.10 reflow). The F22 comment on the tabs says the filter group should wrap *beside*
  them, and that only works while there is room beside them.
- **Actual:** the tabs end at 312 and `ml-14` adds 56 px, so the filter group starts at x 368. **Activities:**
  Name 368–486, Text 494–612, Roles and Categories 368–612, and the Active/Archived/All toggle 368–612. Only a
  22 px sliver of each shows at the right edge. `main .v-container` (`overflow-x: auto`) is 612/390, so the
  whole page content pans 222 px sideways under a swipe, tabs and table included. **Roles / Categories:** the
  group can't overflow, because its two text fields shrink instead. Name and Text are each **14 px wide**
  (368–382), with no label or value visible and no scroll to reveal them (`.v-container` 390/390).
- **Evidence:** `docs/views/activity-settings/screenshots/activities--mobile.png`, `roles--mobile.png`,
  `categories--mobile.png`. Overflow script on Activities: `div.d-flex.flex-wrap.ga-2 → 612`. `eval`
  on `.v-input` boxes: Roles tab `Name: 368,80,382,120`, `Text: 368,128,382,168`.
- **Repro:** 1. `resize 390 844`. 2. Open `/activity-settings/activities` and look for the Name filter. 3. Switch
  to Roles.
- **Verify:** 1. `playwright-cli resize 390 844`, then `reload` on `/activity-settings/activities`. 2. **Pass:**
  `getByRole('textbox', { name: 'Name' })`, both comboboxes and the Active/Archived/All buttons each have
  `left >= 0 && right <= 390`, and `main .v-container` has `scrollWidth <= clientWidth`. 3. On
  `/activity-settings/roles`, **pass:** the Name and Text fields are each at least 150 px wide.
- **Root cause guess:** the F22 fix stopped the tabs shrinking and let the filters wrap beside them, but the
  outer row still never wraps, so below ~700 px there's no "beside".
- **Suggested fix:** `flex-wrap` on the outer row, and drop `ml-14` below `md`. The filter group then takes its
  own full-width line under the tabs. Or move the filters into a `FilterPanel`/expansion below `sm`.

### P3. The create (+) button sits in the table's last column, behind a sideways table swipe on Activities and Categories (390 px)
- **Status:** fixed 2026-10-07 (`FW27`: the framework `DataTable` pins its `actions` column with Vuetify's `fixed: 'end'`, so the + stays on screen; the button stays in the header, per §128)
- **Severity:** polish (reachable by swiping the table; the row actions in the same column are reachable the same way, by design)
- **Where:** @390×844 · `/activity-settings/activities` (Add at 606–646 in a 372 px `.v-table__wrapper`,
  `scrollWidth 693`), `/activity-settings/categories` (391–431, `scrollWidth 454`). On `/roles` the table
  is narrow enough that Add (319–359) shows. Component: framework `BasicTable.vue:21-41` (`#header.actions`
  create button).
- **Expected:** a tab's create action is visible on landing (plain sense). Row actions may sit behind the
  table's own scroll, but "create" isn't tied to a row.
- **Actual:** on landing, the Activities and Categories tables show no create button. Swiping the table to its
  end reveals it, along with the row actions, which all hit-test correctly once scrolled in (Edit and
  Archive at 237–325, 40×40). Nothing hints that the table scrolls.
- **Evidence:** `docs/views/activity-settings/screenshots/activities--mobile.png` (no "+") vs
  `activities--mobile-actions.png` (after the swipe). `categories--mobile.png`: Edit starts at 367, and Add is
  off-screen.
- **Repro:** 1. `resize 390 844`. 2. Open `/activity-settings/activities`. 3. Look for the "+" button.
- **Verify:** 1. `playwright-cli resize 390 844`, then `reload` on `/activity-settings/activities` and
  `/activity-settings/categories`. 2. **Pass:** `getByRole('button', { name: 'Add', exact: true })` has
  `right <= 390` without scrolling the table.
- **Root cause guess:** the same root as planner-day **P6** (the Repeating Tasks "Add" in the same
  `BasicTable` header slot). Both come from `BasicTable` putting the create button in the actions column
  header, so the fix probably belongs in the framework: one finding to batch, two units affected.
- **Suggested fix:** below `md`, render `BasicTable`'s create button above the table (or let the page supply
  it in a toolbar) instead of in the last column header.
