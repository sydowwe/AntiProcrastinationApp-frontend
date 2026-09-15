# leisure-bucket-anchors — findings

> Pass: inventory · captured 2026-09-15 · commit `50bd6b0d`

**Tally:** blocker 3 · bug 2 · a11y 1 · polish 1 · opportunity 1 · unverified 2

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-15 | `50bd6b0d` | initial inventory pass |

---

### X1. Bucket-list ladder view always shows the empty state, even with real data — request always fails with 400
- **Status:** open
- **Severity:** blocker
- **Where:** `/leisure/bucket-list` → Ladder toggle → `src/core/leisure/view/BucketListView.vue:65` (`loadLadder`), `LADDER_PAGE_SIZE = 500` at line ~142
- **Expected:** B2 built the ladder to show every bucket-list row grouped by comfort-zone rung. With one real
  seeded row (`Learn Bouldering`, `comfortZoneStep: 3`), switching to the ladder should show it on rung 3.
- **Actual:** The ladder fetch (`itemsPerPage: 500`) fails with a 400 every single time, and because
  `loadLadder`'s `catch`-free `try/finally` leaves `ladderItems` at its initial `[]`, the view renders the
  **empty state** ("You don't have any here yet") instead of an error — indistinguishable from a genuinely
  empty bucket list. The bug survives a reload (URL `view=ladder` is bookmarkable, and the 400 reproduces on
  every fresh load).
- **Evidence:** `docs/views/leisure-bucket-anchors/screenshots/bucket-list--ladder-error.png`; console:
  `AxiosError: Request failed with status code 400 ... at loadLadder (BucketListView.vue:65:24)`; response
  body of `POST /api/activity-bucket-list-profile/grid`: `{"statusCode":400,"message":"One or more errors
  occurred!","errors":{"itemsPerPage":["Must not exceed 200."]}}`.
- **Repro:** 1. Go to `/leisure/bucket-list` (table shows 1 row). 2. Click the Ladder toggle. 3. Ladder shows
  "You don't have any here yet" despite the table having a row a moment ago.
- **Verify:** 1. Go to `/leisure/bucket-list`, click Ladder. 2. **Pass condition:** the console shows no 400
  from `/api/activity-bucket-list-profile/grid`, and the ladder shows the same row(s) the table shows, grouped
  under the correct rung.
- **Root cause guess:** `LADDER_PAGE_SIZE = 500` exceeds the backend's documented max `itemsPerPage` of 200.
  Same shape of bug as X2 (`TIMELINE_PAGE_SIZE = 500` in `MemoryAnchorsView.vue`) — both were sized as "a
  generous cap" per their own code comments without checking the backend's actual limit. **This exact bug
  already happened once and was already fixed** in this same module:
  `src/core/leisure/view/ProjectsView.vue:118-122` sets `BOARD_PAGE_SIZE = 200` with a comment reading "200
  is not a preference — it is the server's cap... the previous 500 made every board load answer 400 and the
  view rendered '0-0 of 0'" (also documented in `e2e/tests/leisure-profiles.spec.ts`'s file header). B2/M1
  reintroduced the identical mistake independently when they wrote the ladder/timeline constants. Fix X1 and
  X2 together, and grep the rest of the module for any other `= 500` page-size constant before closing this.
- **Suggested fix:** Copy `ProjectsView.vue`'s fix exactly: `LADDER_PAGE_SIZE = 200`. If a user could ever
  have more than 200 bucket-list rows, page through server-side instead — but match whatever the projects
  board eventually does here rather than diverging. Either way, wrap the fetch so a failure renders a visible
  error state instead of silently falling through to "empty."

### X2. Memory-anchors timeline view always shows the empty state, even with real data — same 400 as X1
- **Status:** open
- **Severity:** blocker
- **Where:** `/leisure/memory-anchors` → Timeline toggle → `src/core/leisure/view/MemoryAnchorsView.vue:58`
  (`loadTimeline`), `TIMELINE_PAGE_SIZE = 500` at line ~120
- **Expected:** M1 built the timeline to show a year at a time; with two real seeded anchors (July 2026 7/10,
  August 2026 9/10) the current year's strip should show two shaded months.
- **Actual:** Identical failure mode to X1: `itemsPerPage: 500` → 400 → `timelineItems` stays `[]` →
  "You don't have any memory anchors here yet" is shown despite two real anchors existing (confirmed visible
  in the table view seconds earlier).
- **Evidence:** `docs/views/leisure-bucket-anchors/screenshots/memory-anchors--timeline-error.png`; console:
  `AxiosError: Request failed with status code 400 ... at loadTimeline (MemoryAnchorsView.vue:58:24)`;
  response body of `POST /api/memory-anchor/grid`: `{"statusCode":400,...,"errors":{"itemsPerPage":["Must not
  exceed 200."]}}`.
- **Repro:** 1. Go to `/leisure/memory-anchors` (table shows 2 rows). 2. Click the Timeline toggle. 3. Timeline
  shows the empty state.
- **Verify:** 1. Go to `/leisure/memory-anchors`, click Timeline. 2. **Pass condition:** no 400 from
  `/api/memory-anchor/grid`; the year strip shows shaded cells for July and August 2026, and both anchors'
  highlight notes render under their month.
- **Root cause guess:** Same as X1 — batch the fix. See X1 for the precedent (`ProjectsView.vue`'s
  `BOARD_PAGE_SIZE`) showing this exact bug was already found and fixed once in this module.
- **Suggested fix:** Same as X1 — `TIMELINE_PAGE_SIZE = 200`.

### X3. Memory anchor "Add" (unlocked) is completely non-functional — eligible-activities endpoint returns 400, and the form hangs in a permanent loading state
- **Status:** open
- **Severity:** blocker
- **Where:** `/leisure/memory-anchors` → Add → `src/core/leisure/component/memoryAnchor/NewMemoryAnchorForm.vue:107-112`
  (`onMounted`), backend route `GET /api/memory-anchor/anchor-eligible-activities`
- **Expected:** Opening "Add" without a pre-locked activity (i.e. not via "I did this") should populate the
  Activity picker with every activity eligible for anchoring, per B1's contract
  (`fetchAnchorEligibleActivities()`, which B1's prompt explicitly said already existed).
- **Actual:** The request 400s. The response body — `{"errors":{"id":["Value [anchor-eligible-activities] is
  not valid for a [Int64] property!"]}}` — shows the backend is treating `anchor-eligible-activities` as an
  `{id}` route parameter, meaning the specific route is not registered (or is shadowed by a generic
  `/api/memory-anchor/{id}` route matching first). On the frontend side, `onMounted`'s `await
  fetchAnchorEligibleActivities()` has no `try/catch`, so the thrown error skips `loading.value = false` —
  the Activity field is left showing a permanent loading spinner and the literal default value `0`, forever.
  The form's own designed fallback (`leisure.errors.noEligibleActivities` alert with links to Backlog/Bucket
  list) never has a chance to render, because that only triggers on `!loading && length === 0`, and `loading`
  never clears.
- **Evidence:** `docs/views/leisure-bucket-anchors/screenshots/memory-anchors--create-dialog.png`; console:
  `AxiosError: Request failed with status code 400 ... at fetchAnchorEligibleActivities
  (memoryAnchorApi.ts:25:22) ... at NewMemoryAnchorForm.vue:39:34`; request `GET
  /api/memory-anchor/anchor-eligible-activities` → 400, body above.
- **Repro:** 1. Go to `/leisure/memory-anchors`. 2. Click "Add". 3. Activity field shows "0" with a spinner
  that never resolves; no options are ever offered.
- **Verify:** 1. Go to `/leisure/memory-anchors`, click "Add". 2. **Pass condition:** `GET
  /api/memory-anchor/anchor-eligible-activities` returns 200, and the Activity field either lists real options
  or (if the account has none) shows the "no eligible activities" alert with working Backlog/Bucket list
  links — never a spinner that does not resolve.
- **Root cause guess:** Backend route registration/ordering gap (frontend-unfixable — needs a backend fix or
  a written backend ask). The frontend's missing `try/catch` in `onMounted` is a separate, fixable bug: any
  future transient failure of this endpoint will have the same stuck-spinner symptom.
- **Suggested fix:** Backend: register/reorder the `anchor-eligible-activities` route ahead of the `{id}`
  route. Frontend: wrap the `onMounted` fetch in `try/catch/finally` so `loading.value = false` always runs
  and a failure falls through to the existing "no eligible activities" alert (or a distinct error alert)
  rather than hanging.

### B1. Numeric and date range filters are silently ignored server-side on both grid endpoints
- **Status:** open
- **Severity:** bug
- **Where:** `POST /api/activity-bucket-list-profile/grid` (`minComfortZoneStep`/`maxComfortZoneStep`) and
  `POST /api/memory-anchor/grid` (`year`, `month`, `minRating`) — filter panels at `/leisure/bucket-list` and
  `/leisure/memory-anchors`
- **Expected:** Setting a filter narrows the result set — this is what every other filter field on these two
  screens does (`activityName` and `isAnchored` both confirmed working correctly in this pass), and it is
  what the filter chips and URL state claim is happening.
- **Actual:** The frontend correctly builds and sends the filter (confirmed in every request body below), but
  the response is identical to the unfiltered response in every case tested:
  - `GET /leisure/bucket-list?minComfortZoneStep=5` — the seeded row (`comfortZoneStep: 3`) still appears.
  - `GET /leisure/memory-anchors?year=2025` — request body `{"...,"year":2025,...}`; response still returns
    both 2026 anchors.
  - `GET /leisure/memory-anchors?month=1` — request body `{"...,"month":1,...}`; response still returns both
    the July and August anchors.
  - `GET /leisure/memory-anchors` with Rating filter set to 9 via the UI — URL becomes `?minRating=9`, request
    body `{"...,"minRating":9,...}`; response still returns the 7/10 anchor alongside the 9/10 one.
  This specifically affects L2's fixed rating-filter range (now correctly 1–10 on the frontend) — the range
  is reachable, but the filter it feeds does nothing.
- **Evidence:** Request/response pairs captured via `playwright-cli request-body`/`response-body` for each
  case above (not separately screenshotted — this is a data-correctness defect, verifiable from the network
  panel, not a rendering one).
- **Repro:** 1. Go to `/leisure/memory-anchors`. 2. Open Filter, set Rating to 9, Confirm. 3. Both the 7/10 and
  9/10 rows still show.
- **Verify:** 1. Go to `/leisure/memory-anchors?minRating=9`. 2. **Pass condition:** only the 9/10 "Learn
  Bouldering" row appears, "Retired Hobby" (7/10) is filtered out. 3. Repeat for `?year=2025` (pass condition:
  zero rows, since both seeded anchors are 2026) and for `/leisure/bucket-list?minComfortZoneStep=5` (pass
  condition: zero rows, since the seeded row is step 3).
- **Root cause guess:** Backend — these four fields are likely not wired into the grid endpoints' `where`
  clause at all (unlike `activityName`, presumably a `contains` filter, and `isAnchored`, presumably a plain
  equality filter, both of which do work). Not a frontend defect; the frontend's job here — building and
  sending the right shape — is already confirmed correct.
- **Suggested fix:** Backend: wire `minComfortZoneStep`/`maxComfortZoneStep`/`year`/`month`/`minRating` into
  the respective grid queries. No frontend change needed once that lands.

### B2. Create dialogs show a literal "0" in required pickers, and the required-field rule accepts it — an invalid submission reaches the server
- **Status:** open
- **Severity:** bug
- **Where:** `src/core/leisure/dto/request/ActivityBucketListProfileRequest.ts:4` (`experienceTypeId: number
  = 0`) and `src/core/leisure/dto/request/MemoryAnchorRequest.ts:15` (`activityId: number = 0`), consumed by
  `NewBucketListProfileForm.vue` (`VIdSelect v-model="model.experienceTypeId"`) and
  `NewMemoryAnchorForm.vue` (`VIdAutocomplete v-model="model.activityId"`); validated by
  `src/_common/composable/general/rules/RulesComposition.ts:22` (`requiredRule`)
- **Expected:** A fresh "Add" dialog's required pickers should appear empty (placeholder state) until the
  user chooses something, and attempting to submit without choosing should be blocked client-side with a
  visible validation message — this is plain sense for any required field, and matches how every other
  required text/select field in these two forms behaves.
- **Actual:** Both `ActivityBucketListProfileRequest.experienceTypeId` and `MemoryAnchorRequest.activityId`
  default to the number `0`, not `null`. Vuetify's autocomplete/select cannot resolve `0` against any real
  option id, so it renders the raw value as text: the Activity field on a brand-new Bucket List dialog and
  the Memory Anchors dialog both literally show **"0"**, and Bucket List's Experience type field does too —
  looking like something is already (wrongly) selected rather than empty. Worse, `requiredRule` only rejects
  `null`/`undefined`/empty-string/empty-array, so `0` passes as "valid." Clicking "Create" on the Memory
  Anchors dialog with the untouched default did submit: `POST /api/memory-anchor` fired with
  `{"activityId":0,"highlightNote":"",...}` and was rejected by the backend (`400`, `"Activity not
  found."`/`"'highlight Note' must not be empty."`) — so no bad data was written, but the rejection is silent
  in the UI (no field-level error text was visible in this pass; a snackbar may have fired and auto-dismissed
  before capture — not independently confirmed either way).
- **Evidence:** `docs/views/leisure-bucket-anchors/screenshots/bucket-list--create-dialog.png` (Activity and
  Experience type both show "0"); `docs/views/leisure-bucket-anchors/screenshots/memory-anchors--create-invalid-submit.png`
  (Activity still "0" after a rejected Create click); request `POST /api/memory-anchor` body
  `{"activityId":0,"anchorMonth":9,"anchorYear":2026,"highlightNote":"","rating":5}` → 400, body
  `{"errors":{"highlightNote":["'highlight Note' must not be empty."],"activityId":["Activity not
  found."]}}`.
- **Repro:** 1. Go to `/leisure/bucket-list`, click Add. 2. Activity and Experience type fields both show "0".
  Or: 1. Go to `/leisure/memory-anchors`, click Add. 2. Click Create without touching any field. 3. A
  `POST /api/memory-anchor` fires and is rejected server-side, with no visible client-side validation message
  having stopped it first.
- **Verify:** 1. Open either "Add" dialog fresh. 2. **Pass condition:** the Activity (and, for Bucket List,
  Experience type) field is visually empty/placeholder, not "0". 3. Click Create without selecting anything.
  4. **Pass condition:** no network request fires; a visible "required" message appears under the field
  instead.
- **Root cause guess:** The DTO fields should be typed `number | null = null`, matching the pattern already
  used correctly elsewhere in this module (e.g. `ActivityBucketListProfileRequest.financialGoal: number |
  null = null`). This is the same class of defect L2 fixed for other fields in this module (`as number |
  null` template casts) — these two just weren't in L2's located list.
- **Suggested fix:** Change both defaults to `null` (and the constructor/`fromJson` param types to `number |
  null`), matching `financialGoal`'s existing pattern. `requiredRule` already correctly rejects `null` — no
  change needed there once the defaults stop being `0`.

### A1. Several icon-only controls have a `title` but no `aria-label` across both views
- **Status:** open
- **Severity:** a11y
- **Where:** Table/Ladder toggle and Table/Timeline toggle (`BucketListView.vue`, `MemoryAnchorsView.vue`),
  row `edit`/`delete` buttons (`BasicTable`, shared framework component), Timeline's previous/next-year
  buttons (`MemoryAnchorTimeline.vue`)
- **Expected:** Consistent with this app's own pattern on the same screens (the notification bell and the
  delete/edit column both have precedent for `aria-label`), icon-only controls should expose a name via
  `aria-label`, not rely solely on `title`.
- **Actual:** `document.activeElement`/query inspection confirms these controls have `title` set (e.g.
  `title="Table"`, `title="edit"`) and `aria-label: null`. A `title`-only name is real but weaker than
  `aria-label`: it is not exposed until hover/focus in some assistive tech, and (observed in the same query)
  the row action titles are lower-case ("edit", "delete") while the header titles are sentence-case ("Add",
  "Table", "Ladder") — an inconsistency riding along with the same defect.
- **Evidence:** `JS eval`: `[{"title":"Table","aria":null},{"title":"Ladder","aria":null},{"title":"Add","aria":null},{"title":"edit","aria":null},{"title":"delete","aria":null}]`.
- **Repro:** 1. Go to `/leisure/bucket-list`. 2. Inspect the Table/Ladder toggle or a row's edit/delete
  buttons. 3. `aria-label` is `null`; only `title` is set.
- **Verify:** 1. Inspect the same controls. 2. **Pass condition:** each exposes a non-null, localized
  `aria-label` describing its action (and, for the row actions, ideally naming the row — "Edit Learn
  Bouldering" rather than a bare "Edit").
- **Root cause guess:** `edit`/`delete` are very likely a shared `BasicTable` (framework) default, so a fix
  there would cover every table in the app, not just this unit — batch with any other unit's report of the
  same pattern rather than fixing per call site.
- **Suggested fix:** Add `aria-label` alongside the existing `title` on the view-mode toggle buttons
  (app-side, quick) and file the `BasicTable` row-action case as a framework fix (same shape as shell finding
  A2, the sidebar hamburger).

### P1. The "Experienced" filter chip's icon does not change between its true and false states
- **Status:** open
- **Severity:** polish
- **Where:** `src/core/leisure/view/BucketListView.vue:219` (`isAnchored: boolChip('leisure.fields.experienced', 'circle-check')`) and
  `src/core/leisure/composable/useLeisureFilterChips.ts:19` (`boolChip`)
- **Expected:** A filter chip showing "false" should look visually distinct from one showing "true" — the
  chip's label text already does this correctly (`✓`/`✗`), so the icon should follow.
- **Actual:** `boolChip(labelKey, trueIcon, falseIcon = trueIcon)` defaults `falseIcon` to `trueIcon` when the
  caller passes only one icon, and every call site in this module (`isAnchored`, `requiresTravel`) does pass
  only one — so the chip always shows the same `circle-check` icon regardless of the filter's actual value,
  while the adjacent label text correctly flips between `✓` and `✗`.
- **Evidence:** `docs/views/leisure-bucket-anchors/screenshots/bucket-list--filter-chip-applied.png` — the
  "Experienced: ✗" chip (filtered to `isAnchored: false`) still shows a checkmark-style icon.
- **Repro:** 1. Go to `/leisure/bucket-list`. 2. Filter → Experienced → set to the "false" state → Confirm.
  3. The resulting chip's icon is the same check-style icon as the "true" state would show.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** the chip icon for the false state visibly differs
  from the true state (e.g. an X/circle-slash icon), matching the label text's `✓`/`✗`.
- **Suggested fix:** Pass an explicit `falseIcon` at each `boolChip(...)` call site, or drop the unused
  parameter and always derive the icon from the label text's own `✓`/`✗` logic.

### O1. `financialGoal`, `inspirationSource` and the anchor's source flags are captured but never spent
- **Status:** open
- **Severity:** opportunity
- **Where:** `ActivityBucketListProfile.financialGoal` / `.inspirationSource` (both views' tables render them
  as plain columns only); `MemoryAnchor.hasBacklog` / `.backlogIsRepeatable` / `.hasBucketList` (used only to
  choose which single source chip to render)
- **What exists:** Every bucket-list row already carries a savings-goal number and a free-text "why this"
  note; every memory anchor already carries enough to classify itself as planned-in-advance vs.
  once-off-habit.
- **What it could feed:** A "financial goal" total/progress readout alongside the existing experienced-count
  progress bar (same pattern `useExperiencedProgress` already established); surfacing `inspirationSource` on
  the ladder's cards rather than only in the table, since the ladder is the "why am I avoiding this"
  surface where the reminder would land best; a breakdown on the memory-anchors timeline of "planned vs.
  spontaneous" memories, which the savoring-literature framing M1 was built around would support directly.
- **Not filed as a bug:** both views work correctly as built; this is unspent data, not broken data.

### U1. "I did this" capture flow (locked-activity create) not exercised — no eligible seed row
- **Status:** open
- **Severity:** unverified
- **Where:** `ExperiencedCell.vue` → `useAnchorCapture.ts` → `MemoryAnchorForm.vue` (`lockActivity` path)
- **What would verify it:** The only seeded bucket-list row is already `isAnchored: true`, so the "I did
  this" button (shown only for `isAnchored !== true` rows) never rendered in this pass, and no backlog
  one-time row was available either. Needs either a fresh, not-yet-anchored bucket-list/backlog profile in
  the seed, or a mutation-pass session that creates one, clicks "I did this," and confirms the dialog opens
  pre-filled with the activity locked and defaults to the current month/year.

### U2. Effect of deleting a memory anchor on its source profile's `isAnchored` flag not verified
- **Status:** open
- **Severity:** unverified
- **Where:** `MemoryAnchor` deletion vs. `ActivityBucketListProfile.isAnchored`/`.memoryAnchorId`
- **What would verify it:** This pass did not delete either of the two seeded anchors (both are the only
  anchor data in the account; deleting them would have cost every other unit's fixture until a reseed). A
  mutation-pass session should delete the anchor for "Learn Bouldering" and confirm whether the bucket-list
  row's Experienced chip reverts to "I did this" or stays stuck showing "Experienced" with a dangling
  `memoryAnchorId`.
