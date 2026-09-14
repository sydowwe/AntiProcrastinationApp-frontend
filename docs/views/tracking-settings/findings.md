# tracking-settings — findings

> Pass: inventory · captured 2026-09-13 · commit `df2b163d`

**Tally:** blocker 1 · bug 4 · a11y 0 · polish 1 · opportunity 1 · unverified 1

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-13 | `df2b163d` | initial inventory pass |

---

### X1. The Mappings tab's table row (and its edit/delete actions) is invisible and unclickable
- **Status:** open
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

---

### B1. Every filter control on the Mappings tab is non-functional — no control ever triggers a re-fetch
- **Status:** open
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
- **Status:** open
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
- **Status:** open
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
- **Status:** open
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

### P1. Tracking settings routes are not reachable from `/user/settings`, in apparent tension with CLAUDE.md
- **Status:** open
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
- **Status:** open
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
