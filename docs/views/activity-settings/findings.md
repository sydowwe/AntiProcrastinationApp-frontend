# activity-settings — findings

> Pass: inventory · captured 2026-09-13 · commit `df2b163d`

**Tally:** blocker 0 · bug 7 · a11y 1 · polish 2 · opportunity 1 · unverified 4

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-13 | `df2b163d` | initial inventory pass |
| 1b | 2026-09-13 | `df2b163d` | dev server had gone down and the account had been reseeded (fixture `e2e-v3`, see the operator note below) in between; re-verified B1-B7, A1 and P1 against the fresh session — all reproduced identically (same seeded ids/names). Confirmed U3 (browser back collapses filter edits, per `router.replace`) and opened the Role/Category create dialogs (formerly U2/U5) — folded a new confirmed defect (B7: Roles/Categories never disable Delete for a non-deletable row) out of that work, and narrowed the old U2 to what's still genuinely unknown (what a Delete click on a protected row actually does server-side). Tally: bug 6→7, unverified 6→4. |

**Operator note:** this round's draft e2e spec run (the template's mandated "run only your own file, once"
step) triggered `POST /api/test/seed` via `e2e/global-setup.ts`, resetting every account to fixture `e2e-v3`
— done in error while two other view-docs units were running in parallel, which CLAUDE.md explicitly warns
against (it wipes every account and invalidates every `e2e/.state/auth-*.json`). All findings below were
captured beforehand against the prior fixture; see the caveat at the top of `inventory.md`. If the other two
units' passes look like they lost data or got signed out partway through, this is why.

---

### B1. Picking a role or category from the settings filter does nothing — the server ignores `roleIds`/`categoryIds`
- **Status:** open
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
- **Status:** open
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
- **Status:** open
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
- **Status:** open
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
- **Status:** open
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
- **Status:** open
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
- **Status:** open
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
- **Note:** this pass deliberately did **not** click Delete on a system role or a referenced row to see what
  the server actually does — the seed's system roles are load-bearing for the rest of the app (per
  `Role.ts`'s own comment), and confirming/denying a hard 409 wasn't worth that risk. What's confirmed here
  is the missing client-side safeguard; the exact server-side failure mode remains open (see U2).

---

### A1. The Activities table's Delete button has no accessible name
- **Status:** open
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
- **Status:** open
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
- **Status:** open
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
- **Status:** open
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

### U1. The "no archived activities" empty-state copy was not independently confirmed
- **Status:** open
- **Severity:** unverified
- **Where:** `ActivityTable.vue:144` (`archivedOnlyView` ternary), Archived filter view
- **What would verify it:** The seed account has exactly one archived activity ("Retired Hobby"), so
  switching to the Archived view always shows one row, never the empty state. Verifying the
  `activities.archive.noneArchived` copy would need either an account with zero archived activities, or
  archiving the seed's only remaining active activities first (out of scope for an inventory pass).

### U2. What actually happens when Delete is clicked on a system or referenced role/category
- **Status:** open
- **Severity:** unverified
- **Where:** `/activity-settings/roles`, `/activity-settings/categories` — confirmed seed rows: "Planner
  task" / "Routine task" / "To-do list task" (`systemKey` set), "Work" / "Errands" (in-use, `canDelete:
  false`)
- **What would verify it:** B7 confirms the Delete button is wrongly enabled for these rows and the
  confirmation dialog gives no warning. What's still open is what happens **after** confirming — a clean
  409 with a snackbar (the generic "something went wrong" experience A9's Problem 1 originally described for
  Activities), a silent no-op, or (worst case) an actual deletion of a role the app itself depends on. Not
  attempted this pass — the seed's three system roles are load-bearing for other units' passes and for the
  app itself, and this is a real DELETE call with no confirmed-safe undo. Whoever runs this needs either a
  disposable seed row to target or a green light to accept the risk on a system role.

### U3. A repeated 401→refresh failure that ends in a real sign-out, not root-caused
- **Status:** open
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

### U4. A single unexplained "0 of 0" result on an unfiltered request, not reproduced on retry
- **Status:** open
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
