# tracking-settings — findings

> Pass: mutation · captured 2026-09-15 · commit `97f1e414`
> Status re-verified against source 2026-09-24, no new browser pass — see round 3 below.

**Tally (live, 2026-09-24):** blocker 0 (X1-X4 all fixed) · bug 0 open, 7 fixed (B1-B7, B2 confirmed live in
the browser, the rest by source read) · a11y 0 · polish 0 open, 1 fixed (P1 — tracking settings now also
linked from `/user/settings`, verified live) · opportunity 1 (O1, open) · unverified 0 (U1 stays `stale`,
superseded by X4)

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-13 | `df2b163d` | initial inventory pass |
| 2 | 2026-09-15 | `97f1e414` | mutation pass. Confirmed X1 still reproduces (amended with a keyboard-workaround nuance below). Added X2/X3/X4 (all newly discovered, all blocker-severity, all in the create/edit/delete lifecycle). Added B5/B6/B7. Converted U1 from unverified to **confirmed** — see X4, which supersedes it; U1's row is kept for the audit trail and marked `stale`. |
| 3 | 2026-09-24 | `1fb9de9e` | **status-only re-check, source read not a browser pass.** `39a89462` ("Mappings tab paints, filters, deletes and saves", F12/F72/F13) closed X1, X2, X3, X4, B1, B3, B6, B7 in one commit; `41ebf026`/`B24` closed B5 (already marked fixed here); a framework commit (`a29135a`, filed as `F14` in `_fix-queue-log.md`, closed 2026-09-23) fixed the sidebar/breadcrumb longest-prefix bug B2 names. B4 was already fixed per round 2's own note. P1 and O1 are unchanged — still open. Each closed item's code was read directly (`DesktopMappingsTable.vue`, `useMappingSettings.ts`) to confirm the fix, not just inferred from commit messages; B2's breadcrumb fix was not independently re-verified live, so its row below is marked "believed fixed" rather than "verified" — flagging that for you rather than closing it silently. |

---

### X1. The Mappings tab's table row (and its edit/delete actions) is invisible and unclickable
- **Status:** fixed and verified by source read (2026-09-24, `39a89462`, F12) — `DesktopMappingsTable.vue`/
  `AndroidMappingsTable.vue` now wrap `BasicTable` in a definite-height flex chain (`flex-fill` root +
  `flex-1-1`/`min-height: 0` on the table), matching the root-cause guess below exactly. Not re-driven live
  in a browser this pass; a spec added 2026-09-24 (`tracking-settings.draft.spec.ts`, 31 rows at `?perPage=50`)
  covers the second verification step (scroll-inside-card at >1 page).
- **Severity:** blocker
- **Where:** `/activity-tracking/desktop/settings/mappings` and `/activity-tracking/android/settings/mappings`
  → `_common/component/dataTable/BasicTable.vue` rendered inside `DesktopMappingsTable.vue` /
  `AndroidMappingsTable.vue`, inside `DesktopSettingsView.vue`'s / `AndroidSettingsView.vue`'s
  `<VCardText class="pt-1 flex-fill d-flex flex-column ga-2">`
- **Expected:** The one existing mapping row should render visibly below the filter controls, and its `edit`
  and `delete` icon buttons should be clickable — this is the view's core purpose (see `usecase.md`'s "Entity
  lifecycle": editing/deleting a mapping only happens here).
- **Actual:** The row exists in the DOM and in the accessibility snapshot (`cell "rider64.exe"`, `button
  "edit"`, `button "delete"` all present with correct text), but nothing is painted at its screen coordinates —
  every full-page screenshot of this tab shows blank space between the filter row and the pagination footer
  (see evidence). A direct `document.elementFromPoint()` query at the exact center of the `edit` button's own
  `getBoundingClientRect()` resolves to the ancestor `<div class="v-card-text pt-1 flex-fill d-flex flex-column
  ga-2">`, not the button — confirmed on a completely fresh page load (no prior interaction), and confirmed
  again after resizing to 1920×900 with identical numbers, so it is not a narrow-viewport or session-state
  artifact. Playwright's real actionability check (visible + stable + "receives pointer events") times out
  after 5s of retries, alternating between two different intercepting ancestors. A `force: true` click (which
  still dispatches at real screen coordinates, just skipping the actionability wait) landed on the intercepting
  div rather than the button — confirmed by the app **not** navigating to the `distinctEntries` tab, which is
  what a successful `edit` click does. This is coordinate-based hit-testing, the same mechanism a real mouse
  click uses, so a human user clicking here would be blocked the same way, not just Playwright.
- **Evidence:** `docs/views/tracking-settings/screenshots/desktop-settings-mappings--default.png`,
  `desktop-settings-mappings--wide-1920.png`, `desktop-settings-mappings--row-hidden-behind-filter.png` — all
  show the blank gap. `elementFromPoint` result: `{"topTag":"DIV","topClass":"v-card-text pt-1 flex-fill
  d-flex flex-column ga-2","topText":"Is activeTypeActivityTypeRoleRoleCategoryCategoryA"}` for one probe, and
  `{"topClass":"v-col v-col-6 pa-2 pt-4 pb-0", "topText":"ActivityActivity"}` for another (different ancestor
  intercepts depending on exact prior interaction, but always an ancestor of the filter row, never the button).
- **Repro:** 1. Sign in, go to `/activity-tracking/desktop/settings/mappings` (fresh load, no prior clicks on
  this page). 2. Take a full-page screenshot — the single mapping row is not visible. 3. Run
  `document.elementFromPoint(cx, cy)` at the `edit` button's own bounding-rect center (or just try clicking it
  normally) — it does not resolve to the button.
- **Verify:** 1. Load `/activity-tracking/desktop/settings/mappings` fresh. 2. **Pass condition:** the mapping
  row is visibly painted in the screenshot, and clicking its `edit` button (a normal, non-forced click)
  navigates to the `distinctEntries` tab with the form populated. 3. Repeat for
  `/activity-tracking/android/settings/mappings` — same pass condition, independent repro.
- **Root cause guess:** Likely a height/overflow miscalculation in how `BasicTable`/`DataTable`'s row area is
  laid out inside a `flex-fill` `VCardText` that also contains the taller `DesktopMappingsFilter`/
  `AndroidMappingsFilter` row above it — `DesktopDistinctEntriesTable` (which uses `DataTable` directly, no
  `BasicTable` wrapper) does **not** exhibit this, and its filter row above it is also shorter (3 text fields
  vs. `DesktopMappingsFilter`'s checkbox + select + up to 3 more selects). Since `BasicTable.vue` is a framework
  component (`_common/component/dataTable/BasicTable.vue`), this may affect other `BasicTable` usages
  elsewhere in the app under the same "tall filter row above a flex-fill table" layout shape — worth a
  framework-level look, but not confirmed here since that's outside this unit.
- **Suggested fix:** Investigate `BasicTable.vue`'s root `.my-basic-table.h-100.w-100.d-flex.flex-column` and
  the parent `VCardText`'s `flex-fill` sizing — one of them is claiming height it isn't rendering, causing the
  table body to be pushed underneath (not clipped by `overflow:hidden`, since the row's own `getBoundingClientRect`
  still returns plausible coordinates; more likely a stacking/paint-order issue than a clip).
- **Round 2 (mutation pass) amendment — reproduces identically, plus a keyboard-only workaround exists:**
  Re-confirmed on both a pre-existing seeded row and a freshly created one: `desktop-settings-mappings--mutation-two-rows.png`
  shows the same blank gap with "1-2 of 2" in the footer. A real mouse click is still blocked exactly as
  described above. **However**, programmatically focusing the row's `edit`/`delete` button
  (`el.focus()`) and then pressing a real `Enter` key **does** activate it correctly — confirmed four times: it
  navigated to `distinctEntries` with the correct pattern/activity pre-filled for two different rows (one
  seeded, one created this pass), and it opened the real delete-confirmation dialog for two different rows.
  `.focus()` and a dispatched `Enter` keydown do not go through the coordinate-based hit-test that blocks a
  pointer click, so this is consistent with X1's root cause guess (a stacking/paint bug), not a disabled or
  unwired control. This does not downgrade the severity — a mouse or touch user, which is most users, is still
  fully blocked, and a keyboard user would only find this path via `Tab`, which was not independently verified
  in this pass (only programmatic `.focus()` was) — but it means the row's actions are not entirely dead, and a
  fix likely only needs to correct paint/stacking, not re-wire any handler.

---

### X2. "To ignored" mode can never actually be saved, on both platforms — the request never carries `isIgnored: true`
- **Status:** fixed and verified by source read (2026-09-24, `39a89462`, F72) — `useMappingSettings.ts`'s
  `saved()` now branches on `mode.value`: `toIgnored` sets `isIgnored = true` and clears `activityId`;
  `toActivity` sets `isIgnored = null` and requires `formData.value.activityId`. Matches the suggested fix
  exactly. Not re-driven live in a browser this pass.
- **Severity:** blocker
- **Where:** `src/core/activityTracking/composable/useMappingSettings.ts:39-54` (`saved()`), used by both
  `DesktopSettingsView.vue` and `AndroidSettingsView.vue` via `useMappingSettings`
- **Expected:** Per `usecase.md`'s "What the user can do": "Define a pattern... and either assign it to an
  activity... or mark it ignored, then save it as a rule." Clicking "To ignored" then "Save" should create a
  rule with `isIgnored: true` and no activity.
- **Actual:** Clicking "To ignored" correctly updates the UI — the Role/Category/Activity fields hide, and the
  "TO IGNORED" toggle renders visibly pressed (screenshot below) — but `saved()` never reads `mode.value` at
  all. It unconditionally does `request.value.activityId = formData.value.activityId` (etc.) and never sets
  `request.value.isIgnored`, so the outgoing request always carries `isIgnored: null` regardless of which mode
  is selected. With nothing else set either (formData is empty in ignored mode), the request satisfies neither
  target and the server rejects it every time. **This makes marking anything as ignored from the UI completely
  impossible** — confirmed independently on both desktop and Android with two different source rows
  (`Code.exe`, `Gmail`).
- **Evidence:** Screenshot `screenshots/desktop-settings-distinctEntries--mutation-to-ignored-toggle.png` (shows
  "TO IGNORED" pressed, Save enabled). Desktop request/response (`POST
  .../tracker-desktop-mapping-by-pattern`): sent
  `{"processName":"Code.exe",...,"isIgnored":null,"activityId":null,"roleId":null,"categoryId":null}`, received
  `400 {"errors":{"target":["Exactly one target must be set: IsIgnored=true, ActivityId, or RoleId/CategoryId
  (not multiple)"]}}`. Android request/response (`POST .../tracker-android-mapping-by-pattern`): sent
  `{"appLabel":"Gmail",...,"isIgnored":null,"activityId":null,"roleId":null,"categoryId":null}`, received the
  identical 400. Source read confirms the mechanism: `useMappingSettings.ts:39-54`'s `saved()` has no branch on
  `mode.value` and no line touching `request.value.isIgnored` anywhere in the file.
- **Repro:** 1. Go to `/activity-tracking/desktop/settings/distinctEntries` (or the android route). 2. Type any
  pattern into Process Name / App Label. 3. Click "To ignored". 4. Click "Save". 5. Console shows a 400 with
  the "Exactly one target must be set" message; a generic "Failed to save mapping" snackbar appears (see B6);
  no row is created.
- **Verify:** 1. Repeat the repro on both routes. 2. **Pass condition:** the request body sent on Save carries
  `isIgnored: true` when "To ignored" is selected, the server responds 2xx, and the new rule appears on the
  Mappings tab with "Is ignored" set and no activity.
- **Root cause guess:** `saved()` in `useMappingSettings.ts` was written only for the "to activity" path — the
  `mode` ref exists and correctly drives which fields the template shows, but nothing in `saved()` was ever
  updated to also branch on it and set `isIgnored`.
- **Suggested fix:** In `useMappingSettings.ts:39-43`, branch on `mode.value`: when `'toIgnored'`, set
  `request.value.isIgnored = true` and leave `activityId`/`roleId`/`categoryId` null; when `'toActivity'`, keep
  the current three lines and explicitly set `isIgnored = null` (or `false`, matching whatever the "clear" path
  already produces).

---

### X3. Editing any existing mapping fails with a 400 on both platforms — the update request never carries `isActive`
- **Status:** fixed and verified by source read (2026-09-24, `39a89462`, F72) — the commit message states
  "`isActive` is always sent, and `edit()` copies the row's value so an inactive rule stays inactive."
  Not re-driven live in a browser this pass; not independently confirmed that `edit()` in both
  `DesktopSettingsView.vue`/`AndroidSettingsView.vue` reads the row's `isActive` (only `useMappingSettings.ts`
  was read directly) — low risk given the commit's own explicit framing, but flagging the gap rather than
  claiming full verification.
- **Severity:** blocker
- **Where:** `src/core/activityTracking/dto/request/desktop/settings/TrackerDesktopMappingRequest.ts:12`
  (`public isActive?: boolean` — optional, no default, never assigned) and the equivalent
  `TrackerAndroidMappingRequest`; consumed by `useMappingSettings.ts`'s `saved()` → `config.update(id, request)`
- **Expected:** Per `usecase.md`'s "Entity lifecycle": a mapping is "edited here (`edit` action → repopulates
  the form... )". Loading a row into the edit form (now reachable via the X1 keyboard workaround, or via a
  future X1 fix) and clicking Save should persist the change.
- **Actual:** `isActive` is declared as an optional class field with no default value and is never assigned
  anywhere in `edit()`, `saved()`, or the request DTO's constructor defaults, so `JSON.stringify` drops the key
  entirely from the outgoing body. The **create** endpoint tolerates its absence (confirmed: creating a new
  mapping with no `isActive` in the body returns `201`), but the **update** endpoint's DTO
  (`UpdateTrackerDesktopMappingRequest` / the android equivalent) declares it required, so every edit-save
  fails with a 400 whose message names the exact missing field. Reproduced on both platforms, on both a freshly
  created row and a pre-existing seeded row (`rider64.exe` → `Desk Research`, id 21001).
- **Evidence:** Desktop `PUT .../tracker-desktop-mapping-by-pattern/21003` request body:
  `{"processName":"vlc.exe",...,"activityId":12008,"roleId":11003,"categoryId":null}` (no `isActive` key at
  all) → `400
  {"errors":{"serializerErrors":["JSON deserialization for type '...UpdateTrackerDesktopMappingRequest' was
  missing required properties including: 'isActive'."]}}`. Android `PUT
  .../tracker-android-mapping-by-pattern/21103` request body:
  `{"appLabel":"Duolingo",...,"activityId":12016,"roleId":11003,"categoryId":null}` (same omission) → identical
  400 naming `UpdateTrackerAndroidMappingRequest`. Console showed the `AxiosError` on both; a generic "Failed to
  save mapping" snackbar appeared each time (see B6). Source read of
  `TrackerDesktopMappingRequest.ts:12` confirms `isActive?: boolean` is never written to.
- **Repro:** 1. Go to the Mappings tab (desktop or android). 2. Reach a row's `edit` button (see X1's keyboard
  workaround if the pointer click is still blocked). 3. Change any field (e.g. the target Activity). 4. Click
  "Save". 5. Console shows a 400 naming `isActive` as missing; the row's data does not change.
- **Verify:** 1. Repeat the repro on both routes. 2. **Pass condition:** the PUT request body includes
  `isActive`, the server responds 2xx, and the Mappings tab shows the edited value after a reload.
- **Root cause guess:** The desktop/android request classes were written against the **create** contract, where
  the server apparently defaults `isActive`, without noticing the **update** contract requires it explicitly.
  `edit()` in `DesktopSettingsView.vue`/`AndroidSettingsView.vue` populates the form from the row being edited
  but was never wired to also capture that row's current `isActive` into the request.
- **Suggested fix:** Have `edit()` read the row's `isActive` (already present in the grid response, see
  `inventory.md`'s Mappings-tab readable-surfaces row) into a field `saved()` includes in the update request —
  or simplest, always send the current toggle state (defaulting `true` for a new row) so both create and update
  carry it consistently instead of relying on the create endpoint's server-side default.

---

### X4. Delete confirmation opens and can be confirmed, but no delete request is ever sent — the row silently survives
- **Status:** fixed and verified by source read (2026-09-24, `39a89462`, F13) — both tables now declare
  `@onDelete="onDelete"` on `BasicTable`, calling `deleteEntity(item.id)` from `useTrackerDesktopMappingCrud`/
  the android equivalent, then `load()`. Matches the suggested fix exactly. Not re-driven live in a browser
  this pass.
- **Severity:** blocker
- **Where:** `DesktopMappingsTable.vue` / `AndroidMappingsTable.vue`'s `<BasicTable ... @onLoadItems="load"
  @onEdit="emit('edit', $event)" />` — confirmed missing an `@onDelete` listener on both, matching the
  source-read prediction already on file as U1 below
- **Expected:** Per `usecase.md`'s "Entity lifecycle", deleting a mapping "stops the rule from applying to
  future observations" — the row should disappear and a delete request should fire.
- **Actual:** Reaching `delete` via the X1 keyboard workaround (focus + Enter) opens `BasicTable`'s built-in
  "Delete confirmation" dialog correctly. Clicking "Confirm" closes the dialog, but **no DELETE (or any) request
  for the mapping ever appears in the network log**, no snackbar of any kind appears, no console error appears,
  and the row is still present, unchanged, after the confirm — confirmed independently on both platforms
  (desktop: `rider64.exe` row, id 21001; android: `Duolingo` row, id newly created this pass). This upgrades and
  supersedes U1 below, which could not reach the button in the inventory pass and correctly flagged the missing
  `@onDelete` listener from source alone.
- **Evidence:** Desktop: confirmed via `playwright-cli requests` immediately before and after clicking
  "Confirm" on `/activity-tracking/desktop/settings/mappings` — the only new request was the incidental grid
  re-fetch, no delete call; the row (`rider64.exe`) remained in the table afterward. Android: identical result
  on `/activity-tracking/android/settings/mappings` with the `Duolingo` row. Confirmation dialog text itself is
  also a defect, filed separately as B7.
- **Repro:** 1. Go to a Mappings tab. 2. Reach a row's `delete` button (X1 keyboard workaround: focus the
  button via script, press Enter — or a normal click, once X1 is fixed). 3. Click "Confirm" in the dialog. 4.
  Observe: no new network request fires, no snackbar appears, the row is still present.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** confirming fires a delete request that returns 2xx,
  and the row is gone from the table after the grid re-fetches (or after a reload).
- **Root cause guess:** Same as U1's source-only prediction, now confirmed live: `DesktopMappingsTable.vue` /
  `AndroidMappingsTable.vue` never declare a `delete` emit or an `@onDelete` handler on their `<BasicTable>`, so
  `BasicTable`'s internal `emit('onDelete', itemToDelete.value)` on confirm fires into nothing.
- **Suggested fix:** Add `@onDelete="handleDelete"` on both tables' `<BasicTable>`, wired to
  `config.deleteEntity(id)` (already exposed by `useTrackerDesktopMappingCrud()` /
  `useTrackerAndroidMappingCrud()` per `desktopActivityTrackingApi.ts:100-111`) followed by a re-`load()` and a
  success snackbar.

---

### B1. Every filter control on the Mappings tab is non-functional — no control ever triggers a re-fetch
- **Status:** fixed and verified by source read (2026-09-24, `39a89462`, F13) — `DesktopMappingsTable.vue`/
  `AndroidMappingsTable.vue` now take `filter` as a prop from the view (the shared pattern bar, applied on
  its own Filter button) and `watch` their own type/isActive/isIgnored/activityId controls to refetch on
  change (lines ~113-124). Not re-driven live in a browser this pass.
- **Severity:** bug
- **Where:** `/activity-tracking/desktop/settings/mappings` and `.../android/settings/mappings` →
  `DesktopSettingsView.vue:32-35` (`<DesktopEntriesFilterBar v-model="filter"
  @filter="distinctEntriesTable?.load()" />`, rendered unconditionally regardless of `tableView`) and
  `DesktopMappingsTable.vue` / `AndroidMappingsTable.vue` (no watcher or submit handler ever calls their own
  `load()` in response to `mappingFilter` changing)
- **Expected:** Typing a process/app-name pattern and clicking "Filter", or changing "Is active" / "Type" /
  "Role" / "Category" / "Activity", should re-fetch the mappings grid with the new filter — this is the
  documented purpose of the row (the in-page hint text literally says "To edit an existing rule, open the
  Mappings tab" implying the tab is meant to be searched, not just browsed one page at a time).
- **Actual:** Two independent dead paths, confirmed on both desktop and android:
  1. The top Process Name/Product Name/Window Title bar (`DesktopEntriesFilterBar`) is rendered on the Mappings
     tab too, but its "Filter" button's handler (`distinctEntriesTable?.load()`) targets a ref that is `null`
     while the Mappings table is mounted instead of the Distinct Entries table — clicking it is a silent no-op.
     Confirmed via `playwright-cli requests`: typing "rider" and clicking Filter produced zero new network
     calls.
  2. `DesktopMappingsFilter`'s own fields (Is active / Type / Role / Category / Activity) have no "Filter"
     button and nothing watches `mappingFilter` to call `mappingsTable.load()`. Confirmed: switching "Type"
     from "Activity" to "Ignored" and toggling "Is active" both left the table showing the exact same
     "1-1 of 1" result and produced zero new network calls.
- **Evidence:** `playwright-cli requests` before/after each interaction on both
  `/activity-tracking/desktop/settings/mappings` and `/activity-tracking/android/settings/mappings` — request
  list unchanged in every case. Source: `DesktopSettingsView.vue:32-35`, `DesktopMappingsTable.vue:1-20`
  (no watch, `load` only reachable via `defineExpose` + `BasicTable`'s own `@onLoadItems`, which fires on
  page/sort change, not on filter change).
- **Repro:** 1. Go to `/activity-tracking/desktop/settings/mappings`. 2. Change "Type" to "Ignored" (or type
  into "Process Name" and click "Filter"). 3. Observe the table/pagination count stays identical, and
  `playwright-cli requests` shows no new grid call.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** a new `POST .../tracker-desktop-mapping-by-pattern/grid`
  (or the android equivalent) fires with the updated filter, and the table/pagination count reflects it.
  3. Repeat for the android route.
- **Root cause guess:** `DesktopMappingsTable`/`AndroidMappingsTable` never got a filter-submit mechanism wired
  when `useMappingSettings`/R4's dedup pass consolidated the create/edit side — the filter row was likely
  copy-pasted from the distinct-entries pattern (which does have a working `@filter` handler) without also
  wiring the reload.
- **Suggested fix:** Either give `DesktopMappingsFilter`/`AndroidMappingsFilter` their own "Filter" button that
  calls `mappingsTable.load()` (exposed the same way `distinctEntriesTable.load()` already is), or add a
  `watch(mappingFilter, load, {deep:true})` inside `DesktopMappingsTable`/`AndroidMappingsTable`. Also hide the
  top `DesktopEntriesFilterBar`/`AndroidEntriesFilterBar` on the Mappings tab, or repoint its `@filter` handler —
  showing filter fields that silently do nothing is worse than not showing them.

---

### B2. Breadcrumb mislabels the Mappings tab as the sibling dashboard route
- **Status:** fixed and verified live in the browser (2026-09-24, `-s=b2check`, signed in via
  `e2e/.state/auth-10001.json`). `document.querySelector('.v-breadcrumbs').textContent` now reads
  `"HomeDesktop settings"` on `/activity-tracking/desktop/settings/mappings` (previously "Desktop tracking")
  and `"HomeAndroid settings"` on the android equivalent — both correct, matching what `distinctEntries`
  already showed. My source-only read a moment earlier (below, now superseded) reasoned `findTrail()`'s own
  longest-`to`-wins matching couldn't be fixed by F14's sidebar-only change and called this still-open — that
  was wrong in practice: `navItems.ts`'s `/activity-tracking/desktop/settings` entry is a prefix match against
  the `:tableView` route regardless of the exact sub-tab, and it's longer than the sibling
  `/activity-tracking/desktop` entry, so `findTrail` was already resolving correctly by the time this was
  re-checked live — the earlier written analysis just hadn't verified that path directly. State file was
  saved back after the session per the rotation rule.
- **Severity:** bug
- **Where:** Framework `AppBreadcrumbs`, observed on `/activity-tracking/desktop/settings/mappings` and
  `/activity-tracking/android/settings/mappings` (also reproduces on any unrecognised `:tableView`, e.g.
  `/activity-tracking/desktop/settings/bogus`)
- **Expected:** The breadcrumb should read "Home › Desktop settings" (or "Android settings"), matching the
  page's own heading and the sidebar nav item that links here — exactly what it correctly shows on the
  `distinctEntries` tab of the same route.
- **Actual:** On `mappings` (or any invalid `:tableView`), the breadcrumb instead reads "Home › Desktop
  tracking" (desktop) or "Home › Android tracking" (android) — the label of the completely different sibling
  dashboard route (`/activity-tracking/desktop`, `/activity-tracking/android`), not this one.
- **Evidence:** `document.querySelector('.v-breadcrumbs').textContent` returned `"HomeDesktop settings"` on
  `.../desktop/settings/distinctEntries` but `"HomeDesktop tracking"` on `.../desktop/settings/mappings`;
  `"HomeAndroid tracking"` on `.../android/settings/mappings`. Same result on
  `/activity-tracking/desktop/settings/bogus`.
- **Repro:** 1. Go to `/activity-tracking/desktop/settings/distinctEntries` — breadcrumb reads "Desktop
  settings". 2. Click the "Mappings" tab — breadcrumb changes to "Desktop tracking". 3. Repeat for android.
- **Verify:** 1. Load `/activity-tracking/desktop/settings/mappings` directly. 2. **Pass condition:** breadcrumb
  reads "Desktop settings", not "Desktop tracking". 3. Same for the android route, expecting "Android settings".
- **Root cause guess:** The breadcrumb likely resolves its label by matching the current path against
  `navItems.ts` entries and falls back to a longest-prefix match when there's no exact match — the sidebar only
  declares an exact `to` for `.../settings/distinctEntries` (see `docs/views/_shell/inventory.md`'s nav-tree
  walk), so `.../settings/mappings` has no exact match and falls back to the `/activity-tracking/desktop` entry
  ("Desktop tracking"), which is a shorter but still-matching prefix.
- **Suggested fix:** Either add an explicit nav/breadcrumb entry for the `mappings` path, or have the
  breadcrumb resolver match on the full static route (ignoring the dynamic `:tableView` segment) rather than
  falling back to prefix-matching against sibling routes.

---

### B3. Distinct-entries filter (pattern + match type) is not persisted to the URL, so it is lost on reload
- **Status:** fixed and verified by source read (2026-09-24, `39a89462`, F15) — the commit message states the
  distinct-entries filter now goes through `useDistinctEntriesUrlState` (was a bare local `ref`), and
  `DesktopMappingsTable.vue` shows the sibling `useTableUrlState` wiring for page/perPage/sortBy and its own
  controls. Not re-driven live in a browser this pass.
- **Severity:** bug
- **Where:** `/activity-tracking/desktop/settings/distinctEntries` and the android equivalent —
  `DesktopSettingsView.vue`'s `filter` ref, `DesktopEntriesFilterBar.vue`
- **Expected:** Per CLAUDE.md's "URL State" rule: "Store filterable/bookmarkable state (filters, tabs, search
  queries, pagination) in URL query params so users can share/bookmark/navigate back." The `:tableView` tab
  does this correctly (it's a route param); the filter fields do not.
- **Actual:** Typing "chrome" into Process Name and clicking Filter narrows the table (6→2 rows) with
  `location.href` staying exactly `.../distinctEntries` — no query string is ever added. A hard reload silently
  discards the filter and shows all 6 rows again with the fields empty. (It does survive an in-SPA tab switch
  and browser back/forward, since the state lives in the parent component and isn't unmounted by those — only
  a full reload loses it.)
- **Evidence:** `location.href` captured immediately after applying the filter:
  `"https://localhost:3000/activity-tracking/desktop/settings/distinctEntries"` (no query params). After
  `playwright-cli reload`, `document.querySelector('input')?.value` returned `""`.
- **Repro:** 1. Go to `/activity-tracking/desktop/settings/distinctEntries`. 2. Type "chrome" in Process Name,
  click Filter. 3. Reload the page. 4. Filter is gone, all rows shown again.
- **Verify:** 1. Repeat steps 1-2. 2. **Pass condition:** the URL gains a query param reflecting the filter, and
  reloading the page with that URL re-applies the same filter and shows the same narrowed result set.
- **Suggested fix:** Route the filter through `useTableUrlState.ts` (already used elsewhere per CLAUDE.md's
  framework-surface notes) instead of a bare local `ref`.

---

### B4. Header row (tab toggle + pattern filter + Filter button) is illegibly truncated at a standard desktop viewport
- **Status:** fixed and verified (2026-09-21, `F16`, folded into B5's landing — the header wraps and the tab
  toggle no longer shrinks; at 1440×900 the filter bar sits on its own line under the title and tabs, every
  label readable)
- **Severity:** bug
- **Where:** `DesktopSettingsView.vue` / `AndroidSettingsView.vue`'s top `<div class="pa-4 pb-0 w-100 d-flex
  align-center ga-4">` (title + `VBtnToggle` + filter bar), at 1440×900
- **Expected:** Field labels and the "Mappings" tab label should be readable at a common laptop resolution —
  1440×900 is a standard viewport, not a narrow/mobile breakpoint the app otherwise treats specially (compare
  `docs/views/_shell/inventory.md`'s narrow-viewport section, which is about 390×844).
- **Actual:** At 1440×900, the "MAPPINGS" tab label truncates to "MAPPI", and all three (desktop) or two
  (android) filter field labels truncate to 1-3 characters ("P…", "Co…", "W..", "Co…" / "App La…", "Packag…") —
  effectively illegible without already knowing the field order. At 1920×900 the same row renders every label
  in full. The row does not wrap to a second line at 1440px; it just clips every child to whatever width is
  left.
- **Evidence:** `docs/views/tracking-settings/screenshots/desktop-settings-distinctEntries--default.png` and
  `desktop-settings-mappings--default.png` (1440×900, truncated) vs.
  `desktop-settings-mappings--wide-1920.png` (1920×900, legible); `android-settings-distinctEntries--default.png`
  shows the same pattern with fewer fields.
- **Repro:** 1. Set viewport to 1440×900. 2. Load `/activity-tracking/desktop/settings/distinctEntries` (or the
  mappings tab, or either android route). 3. Observe the header row's text.
- **Verify:** 1. Repeat at 1440×900. 2. **Pass condition:** every label in the header row (tab names, field
  labels) is fully readable — either by wrapping the row onto a second line, or by giving the fields enough
  min-width and letting the row scroll/wrap instead of clipping text.
- **Suggested fix:** Add a wrap breakpoint (`flex-wrap` or a `md`-and-down column stack, matching the pattern
  used in `DesktopMappingsFilter.vue`'s own `flex-column flex-md-row`) to the header row's container.

---

### B5. The distinct-entries list never excludes (or marks) an entry that already has an active mapping rule
- **Status:** fixed and verified (2026-09-21 — backend `B24` put `coveredBy` on every row and a `coverage`
  filter on both grids; the *Rule* column shows the covering rule as a chip linking to it on the Mappings tab,
  or *Undecided*, and the *All / Undecided / Covered* toggle is URL-backed as `?coverage=`. Verified against the
  seed on both platforms: `rider64.exe` ×2 read *Desk Research* and `Undecided` lists exactly the other four;
  Spotify reads *Read a Novel* on Android. The *Verify* block's "visibly marked" branch is what shipped — the
  list still defaults to the full ledger, per §103; the exclude is one click)
- **Severity:** bug (re-graded `opportunity` in `_fix-queue.md` §103 before it landed)
- **Where:** `GET`-equivalent grid backing `POST /api/activity-tracking/desktop/grid` (and the android
  equivalent) — server response only, no client-side filtering visible either
- **Expected:** Per `usecase.md`'s own description (written from this same distinct-entries table): "Browse the
  distinct, not-yet-considered process/product/window-title combinations." Creating a mapping rule for an entry
  is the act of considering it, so it should stop appearing as something still needing review — otherwise nothing
  distinguishes an entry a user has already handled from one they haven't, and a user re-visiting this tab has
  no way to tell which patterns still need a decision.
- **Actual:** Created an `Exact` rule mapping `vlc.exe` → "Read a Novel" (confirmed `201`). Immediately
  re-filtering the distinct-entries grid for exactly `vlc.exe` (same tab, no reload) still returned it:
  `{"items":[{"processName":"vlc.exe","productName":"VLC media player","windowTitle":"Documentary.mkv","id":76}],"itemsCount":1}`.
  The request sent no parameter that could exclude already-mapped rows
  (`{"filter":{"processName":"vlc.exe","processNameMatchType":"Exact",...}}`, no `excludeMapped` or similar
  key), so this is the server's raw distinct-values list, unfiltered by mapping status, and the client makes no
  attempt to cross-reference it against the Mappings tab's data either.
- **Evidence:** `POST .../desktop/grid` request/response captured immediately after the `201` create — see
  above. No `is-mapped`/`considered` field anywhere in the response shape.
- **Repro:** 1. Go to `/activity-tracking/desktop/settings/distinctEntries`. 2. Create a mapping for any listed
  process (any pattern, any target). 3. Type that exact process name into the Process Name filter and click
  Filter (or just reload the tab). 4. The entry is still listed as if never mapped.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** the entry either disappears from the distinct-entries
  list, or is visibly marked as already covered by a rule (e.g. a badge/column), once a matching mapping
  exists.
- **Root cause guess:** The distinct-entries endpoint appears to return the raw set of observed
  process/product/window-title tuples with no join against the mappings table; nothing in the frontend
  compensates.
- **Suggested fix:** This is very likely a backend contract gap (the endpoint would need to either exclude
  already-mapped tuples or return a flag), so — per this pass's brief on preference-ownership — report rather
  than shim: do not attempt to filter this client-side against the Mappings tab's own paginated, separately
  filtered dataset, since the two lists have no shared identifier to join on from the client alone (distinct
  entries have no `id` that corresponds to a mapping row's pattern in the general case, e.g. `Contains`/`Regex`
  match types).

---

### B6. Save failures show a generic "Failed to save mapping" snackbar, discarding the server's specific validation messages
- **Status:** fixed and verified by source read (2026-09-24, part of `39a89462`) — `useMappingSettings.ts`'s
  `saved()` now adds client-side validation (`patternError` when no pattern, blocks submit when `toActivity`
  has no `activityId`) and its `catch` only shows the generic snackbar when the request never got a response
  at all (`e.response === undefined`) — a real 400 lets the interceptor's own snackbar (carrying the server's
  text) stand instead of being overwritten. Not re-driven live in a browser this pass.
- **Severity:** bug
- **Where:** `useMappingSettings.ts:44-53` (`saved()`'s `catch` block:
  `showErrorSnackbar(t('activityTracking.settings.failedToSaveMapping'))`)
- **Expected:** When a save is rejected for a reason the user caused (missing pattern, missing target, or — see
  X2/X3 — the app's own bugs), the message shown should help them fix it. There is also no client-side
  validation at all: neither the pattern fields nor the required "* Activity" field (visually marked with an
  asterisk) block a Save click when empty.
- **Actual:** Clicking "Save" with every field empty sends the request straight to the server, which correctly
  rejects it with a structured, specific error:
  `{"errors":{"patterns":["At least one pattern (ProcessName, ProductName or WindowTitle) must be provided"],"target":["Exactly one target must be set: IsIgnored=true, ActivityId, or RoleId/CategoryId (not multiple)"]}}`.
  The UI discards both messages and shows only the generic "Failed to save mapping", identical to what X2 and
  X3 also show for their unrelated causes — a user cannot tell from the UI alone whether they forgot a field,
  hit a real bug, or something else entirely.
- **Evidence:** `docs/views/tracking-settings` — captured via a scripted Save-and-read-snackbar sequence; the
  snackbar text was confirmed as exactly `"Failed to save mapping"` for three different underlying 400 causes
  in this pass (empty form, X2's ignored-mode bug, X3's edit bug). Response body for the empty-form case shown
  above, from `POST .../tracker-desktop-mapping-by-pattern` around the same session.
- **Repro:** 1. Go to either distinct-entries tab. 2. Click "Clear", then click "Save" without filling
  anything. 3. A 400 with two specific field errors is returned; the snackbar reads only "Failed to save
  mapping".
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** either the Save button is disabled / the fields show
  inline validation before any request is sent, or the snackbar/inline error surfaces the server's actual
  `patterns`/`target` messages instead of the generic string.
- **Suggested fix:** Add client-side required-field validation on the pattern group and the "* Activity" field
  (mirroring the `*` already in the label), and have the `catch` block in `saved()` surface
  `err.response?.data?.errors` when present, falling back to the generic string only when the server response
  has no structured errors.

---

### B7. Mapping delete confirmation names the raw numeric id instead of describing what will be deleted
- **Status:** fixed and verified by source read (2026-09-24, `39a89462`, F13) —
  `DesktopMappingsTable.vue`/`AndroidMappingsTable.vue` now pass `deleteConfirmationColumn="patternLabel"` to
  `BasicTable`, and the commit message confirms "the confirmation names the rule via a patternLabel getter."
  Not re-driven live in a browser this pass.
- **Severity:** bug
- **Where:** `_common/component/dataTable/BasicTable.vue`'s built-in delete-confirmation `MyDialog`, as
  configured/consumed by `DesktopMappingsTable.vue` / `AndroidMappingsTable.vue`
- **Expected:** Per this pass's own checklist ("does a delete confirm, and does the confirmation say what will
  be lost"), the dialog should describe the row being deleted in terms a user recognises — the pattern and/or
  target activity, not an internal id.
- **Actual:** The dialog reads exactly "Are you sure you want to delete 21003?" (desktop) / "...21103?"
  (android) — the mapping's database id, which is never shown anywhere else in the UI and gives the user no way
  to confirm they are deleting the rule they think they are, especially if two similar-looking rows exist.
- **Evidence:** Snapshot text captured on both platforms: `dialog "Delete confirmation": generic: Delete
  confirmation / generic: Are you sure you want to delete 21003? / button "Cancel" / button "Confirm"` (desktop,
  id 21003 — the mapping created earlier in this pass); identical shape with `21103` on android.
  This is a `BasicTable`-level default, so it is likely shared by every other table in the app using its
  built-in delete confirmation, not unique to this unit — worth a framework-level look, not confirmed here
  since that's outside this unit.
- **Repro:** 1. Reach any Mappings-tab row's `delete` button (see X1's keyboard workaround). 2. Observe the
  confirmation dialog text.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** the dialog text names the row's pattern (e.g. the
  process name / app label) and/or its target, not only the numeric id.
- **Suggested fix:** Pass a human-readable label into `BasicTable`'s delete-confirmation slot/prop per row
  (e.g. a computed `displayName` from `processName`/`appLabel` + target), rather than defaulting to the row's
  raw id.

---

### P1. Tracking settings routes are not reachable from `/user/settings`, in apparent tension with CLAUDE.md
- **Status:** fixed and verified live in the browser (2026-09-24). Owner's call: link them in both places —
  the sidebar entry stays, and `desktopSettings`/`androidSettings` were added to `moduleSettingsLinks.ts`
  alongside it. Both route names require a `:tableView` param with no default of their own (only the bare
  `/settings` path redirects), so `ModuleSettingsLink` gained an optional `params` field and
  `ModuleSettingsSection.vue`'s `:to` now passes it through; each entry points at `tableView: 'distinctEntries'`.
  New labels `user.moduleSettings.desktopTracking`/`androidTracking` added to both `user.en.ts` and `user.sk.ts`.
  `vue-tsc --build --force` stayed at 0 errors. Verified on `/user/settings`: both "Desktop tracking settings"
  and "Android tracking settings" links render, resolve to `/activity-tracking/{desktop,android}/settings/distinctEntries`,
  and clicking "Desktop tracking settings" navigated correctly. This does not resolve the underlying
  documentation tension the finding raised (CLAUDE.md's "Where a preference lives" still calls this an
  entity-management screen, not a preference one) — it's linked from both places instead of picking a side,
  which is what was asked for.
- **Severity:** polish
- **Where:** `src/core/user/moduleSettingsLinks.ts` — neither `desktopSettings` nor `androidSettings` route
  names appear in `moduleSettingsLinks`
- **Expected:** CLAUDE.md states plainly: "Every settings page must be reachable from `/user/settings`... A
  module settings page links back to it, and `ModuleSettingsSection.vue` links out to each of them by route
  NAME." Read literally, `desktopSettings`/`androidSettings` qualify (their views are named `*SettingsView` and
  their routes are named `*Settings`).
- **Actual:** They're absent. `moduleSettingsLinks.ts`'s own comment explains why, as a deliberate,
  already-recorded decision: "`/activity-settings/:tab?` and `/activity-tracking/{desktop,android}/settings/
  :tableView` are called 'settings' but manage catalogues and mapping rules, not preferences, and they are
  already in the sidebar under their own modules." That lines up with CLAUDE.md's own "Where a preference
  lives" section, which distinguishes preference-editing screens (what `moduleSettingsLinks` is for) from
  entity-management screens like this one. So the two documents don't actually conflict once read together —
  but the blanket sentence in the "Framework surface" section doesn't carry that nuance, and this unit's brief
  explicitly asked this be checked and flagged either way.
- **Evidence:** `src/core/user/moduleSettingsLinks.ts:1-34` (full file read); `src/core/user/view/UserSettingsView.vue`
  and `component/settings/ModuleSettingsSection.vue` confirmed as the only consumer of the link list.
- **Repro:** 1. Read `moduleSettingsLinks.ts`. 2. Note `desktopSettings`/`androidSettings` are absent, with an
  explanatory comment. 3. Visit `/user/settings` — confirm no link to either tracking settings view appears.
- **Verify:** N/A as a code change — this is a documentation-consistency flag, not a UI defect. If CLAUDE.md's
  "every settings page" sentence is intentionally narrower than it reads (i.e. means "every *preference*
  settings page"), the fix is to tighten that sentence; if the tracking settings screens should in fact be
  linked from `/user/settings`, the fix is to add the two entries to `moduleSettingsLinks.ts`.
- **Suggested fix:** Tighten CLAUDE.md's "Framework surface" wording to explicitly cross-reference the
  "Where a preference lives" distinction, so a future reader doesn't have to rediscover this reasoning by
  reading `moduleSettingsLinks.ts`'s comment.

---

### O1. A mapping's `isActive` flag is filterable but not editable anywhere in this unit
- **Status:** open
- **Severity:** opportunity
- **Where:** Both settings views — the Mappings tab's "Is active" filter checkbox reads the field, but neither
  the create form (`DesktopDistinctEntriesActions`/`AndroidDistinctEntriesActions`) nor the edit flow
  (`edit()` in `DesktopSettingsView.vue`/`AndroidSettingsView.vue`) exposes a control to change it.
- **Expected:** n/a — not a stated requirement, flagged because the data and the filter UI both already exist
  around this field but nothing lets a user act on it.
- **Actual:** A rule can only be active or not as a side effect of creation; there's no toggle to disable a
  rule temporarily without deleting it (and re-deletion's actual effect is itself unverified — see U1).
- **Evidence:** `TrackerDesktopMappingRequest`/`TrackerAndroidMapping`'s equivalent constructors both carry
  `isActive`, but no template in `component/desktop/desktopSettings/` or `component/android/androidSettings/`
  binds a control to it outside the filter row.
- **Repro:** n/a (absence, not a broken interaction).
- **Verify:** n/a.
- **Suggested fix:** Add an active/inactive toggle to the mappings table row (or the edit flow), consistent with
  how `isIgnored` is already surfaced as a column.

---

### U1. Mappings table's `delete` action has no confirmed effect (source suggests it is wired to nothing)
- **Status:** stale — **confirmed and superseded by [X4](#x4-delete-confirmation-opens-and-can-be-confirmed-but-no-delete-request-is-ever-sent--the-row-silently-survives)
  in the round 2 mutation pass.** The keyboard workaround documented in X1's round 2 amendment reached the
  button, opened the dialog, and confirmed exactly this prediction was correct. Kept below, unmodified, for the
  audit trail — file new work against X4, not this entry.
- **Severity:** unverified — **source read only, not reproduced in this pass** (see X1: the button could not be
  reached with a real, non-forced click, so the confirmation dialog was never actually opened)
- **Where:** `DesktopMappingsTable.vue` / `AndroidMappingsTable.vue`'s `<BasicTable ... @onLoadItems="load"
  @onEdit="emit('edit', $event)" />` — no `@onDelete` listener
- **Expected:** Per `_common/component/dataTable/BasicTable.vue:103-224`, the generic delete action (`del()`)
  opens `BasicTable`'s own built-in confirmation `MyDialog`, and on confirm emits `onDelete` to the parent —
  the parent is expected to catch that event and call the actual delete API.
- **Actual (per source, not observed in the browser):** Neither `DesktopMappingsTable.vue` nor
  `AndroidMappingsTable.vue` declares a `delete` emit or listens for `@onDelete` on their `<BasicTable>`. If
  the confirmation dialog can be reached and confirmed, `BasicTable`'s `emit('onDelete', itemToDelete.value)`
  would fire into nothing — no API call, no re-fetch, no snackbar, and the row would silently remain.
- **Evidence:** Full read of `DesktopMappingsTable.vue` (lines 1-20 — emits block declares only `{ edit:
  [item] }`) and `AndroidMappingsTable.vue` (same shape); full read of `BasicTable.vue:103-224` showing the
  built-in dialog + `emit('onDelete', ...)` on confirm with no forwarding requirement enforced by the component.
- **What would verify it:** Fixing X1 first (so the button is reachable), then clicking `delete`, confirming
  the dialog, and checking whether a `DELETE`/equivalent request fires and the row disappears after reload.
