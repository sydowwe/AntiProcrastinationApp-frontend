# leisure-bucket-anchors — findings

> Pass: mutation · captured 2026-09-15 · commit `f457aa0c`

**Tally:** blocker 4 (X3 fixed and verified; X1, X2, X4 open) · bug 3 · a11y 1 · polish 1 · opportunity 1 · unverified 0

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-15 | `50bd6b0d` | initial inventory pass |
| 2 | 2026-09-15 | `f457aa0c` | mutation pass — full create→edit→delete lifecycle exercised for both entities. Found **X4** (edit and delete both silently 404 for every bucket-list profile — a new blocker) and **B3** (Inspiration column always renders "—" regardless of data, a framework formatter bug). Strengthened **B2** with matching evidence on the bucket-list side plus a worse search-corruption wrinkle. Reconfirmed **X1, X2, X3, B1** unchanged. Resolved **U1** and **U2** (both verified working correctly, moved to Resolved section below, no longer counted as findings). **A1** and **P1** were not re-driven this round (time-boxed; no code change expected in the affected files) — carried forward as-is. |
| 3 | 2026-09-16 | working tree | **X3 closed.** Backend shipped `GET /memory-anchor/anchor-eligible-activities` (`AdhdTimeOrganizer` `dev`, `GetAnchorEligibleActivitiesEndpoint`, pinned by 6 green `AnchorEligibleActivitiesTests`; written up as `prompts/view-docs/backend/_implemented/B12-…`) and the frontend's missing `try/catch/finally` plus a distinct failure alert landed the same day (`_fix-queue.md` `F62`, now closed — bodies in `_fix-queue-log.md` → *Closed batches*/*Closed escalations*, §12). Verified live against the restarted local backend: opening "Add" on `/leisure/memory-anchors` fetches and populates the Activity picker with no console error. |

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
- **Round 2 (mutation pass):** reconfirmed unchanged — same 400, same empty-state fallback, on the same
  `LADDER_PAGE_SIZE = 500` constant.

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
- **Round 2 (mutation pass):** reconfirmed unchanged — same 400 on `POST /api/memory-anchor/grid`, same
  empty-state fallback, even with a third real anchor present at the time of the retest.

### X3. Memory anchor "Add" (unlocked) is completely non-functional — eligible-activities endpoint returns 400, and the form hangs in a permanent loading state
- **Status:** ✅ **fixed and verified live 2026-09-16** (`_fix-queue.md` `F62`, backend §12). The backend
  shipped the missing route (`GetAnchorEligibleActivitiesEndpoint`, `AdhdTimeOrganizer` `dev`) and the
  frontend's `onMounted` now wraps the fetch in `try/catch/finally` with a distinct error alert instead of
  hanging — see `_fix-queue-log.md`'s `F62`/§12 entries for the full contract and diff. Verified live: `GET
  /api/memory-anchor/anchor-eligible-activities` returns 200 and the Activity picker on a fresh "Add"
  populates with no console error.
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
- **Round 2 (mutation pass):** reconfirmed unchanged — identical 400 and stuck-spinner symptom. Also
  confirmed the locked-activity path (`useAnchorCapture` / "I did this") does **not** hit this endpoint at
  all and works correctly (see the resolved U1 entry below), so this remains isolated to the unlocked "Add"
  entry point only.

### X4. Editing or deleting a bucket-list profile always fails with a silent 404 — every row's edit and delete is completely non-functional
- **Status:** open
- **Severity:** blocker
- **Where:** `src/core/leisure/component/bucketList/BucketListProfileForm.vue:48` (`update(entityToEdit.activityId, ...)`),
  `src/core/leisure/component/bucketList/BucketListTable.vue:133` (`deleteEntity(item.activityId)`),
  `src/core/leisure/component/bucketList/BucketListLadder.vue:214` (same call, ladder's own delete action);
  `src/core/leisure/dto/response/ActivityBucketListProfile.ts:21` (`get id(): number { return this.activityId }`)
- **Expected:** Editing a bucket-list row's fields and clicking Save should persist the change; clicking delete
  and confirming should remove the row — this is the basic CRUD contract every other entity in this app (and
  this same unit's memory anchors, confirmed working below) honours.
- **Actual:** Both actions send the wrong id. The grid response's row carries its own primary key separately
  from the activity (`"id":17101` alongside `"activityId":12008` in the same JSON object — see the `B1`
  evidence block for a full row), but `ActivityBucketListProfile`'s `id` getter returns `activityId` instead,
  and every call site explicitly passes `.activityId` (not even relying on the getter) to `update()` /
  `deleteEntity()`. The backend's routes are keyed by the profile's own id, not the activity id, so **every**
  edit and **every** delete 404s:
  - Edit: created a fresh profile (`Build a Bookshelf`, id `17102`, `activityId` `12009`), changed Comfort zone
    step 1→4, saved — `PUT /api/activity-bucket-list-profile/12009` → **404**. Repeated on the pre-existing
    seeded row (`Learn Bouldering`, id `17101`, `activityId` `12008`): `PUT
    /api/activity-bucket-list-profile/12008` → **404**.
  - Delete: confirming delete on the same fresh row fired `DELETE /api/activity-bucket-list-profile/12009` →
    **404**. Manually re-issuing the same request against the profile's own id — `DELETE
    /api/activity-bucket-list-profile/17102` → **204** — confirms the backend is fine and the frontend is
    sending the wrong key.
  - Both failures are silent: the edit dialog stays open showing the unsaved change with no error text
    anywhere in the DOM (no alert, no snackbar observed); the delete-confirmation dialog closes and the row
    stays in the table with no error surfaced either. A user has no way to know either action failed short of
    noticing the row didn't change.
  - Memory anchors, in the same unit, do **not** have this bug — `MemoryAnchor` carries its own real `id` (no
    activity-derived getter) and `MemoryAnchorTable.vue:156` passes `item.id`; a same-session no-op edit
    (`PUT /api/memory-anchor/18002` → **200**) and a real delete (`DELETE /api/memory-anchor/18004` → **204**)
    both worked correctly, confirming the bug is specific to activity-keyed profile DTOs, not a general
    problem with this unit's CRUD plumbing.
- **Evidence:** `docs/views/leisure-bucket-anchors/screenshots/bucket-list--mutation-edit-404.png` (dialog
  stuck open after a failed save, no error shown); `docs/views/leisure-bucket-anchors/screenshots/bucket-list--mutation-delete-404.png`
  (row still present after confirming delete); requests: `PUT /api/activity-bucket-list-profile/12008` → 404,
  `PUT /api/activity-bucket-list-profile/12009` → 404, `DELETE /api/activity-bucket-list-profile/12009` → 404,
  and the corrected `DELETE /api/activity-bucket-list-profile/17102` → 204 issued directly via `fetch()` in
  the page context to isolate the id as the sole variable.
- **Repro:** 1. Go to `/leisure/bucket-list`. 2. Click edit on any row, change any field, click Save. 3. Dialog
  stays open, nothing changes, no error is shown, and the network tab shows a 404 on `PUT
  /api/activity-bucket-list-profile/{activityId}`. Or: 1. Click delete on any row, confirm. 2. The row is
  still there afterwards, network tab shows a 404 on the matching `DELETE`.
- **Verify:** 1. Repeat either repro. 2. **Pass condition:** the request URL uses the profile's own `id` (the
  grid response's `id` field, not `activityId`), returns 200/204, and the table reflects the change/removal
  without a reload.
- **Root cause guess:** `ActivityBucketListProfile.id` getter aliases `activityId`, and every call site passes
  `.activityId` explicitly rather than the DTO's own `id` field — both need to change together, or the getter
  alone would silently fix call sites that use `item.id` while call sites using `.activityId` directly would
  keep failing. **This same pattern (grep-confirmed, not independently reproduced — out of this unit's scope)
  appears in three sibling leisure views**: `src/core/leisure/component/backlog/BacklogTable.vue:151`,
  `src/core/leisure/component/project/ProjectTable.vue:108`, and
  `src/core/leisure/component/project/ProjectReadinessBoard.vue:231` all call `deleteEntity(item.activityId)`
  on their own activity-keyed DTOs — worth flagging to whoever owns the `leisure-backlog-picker` and any
  future projects unit, since it reads like the same mistake made three more times rather than three
  independent bugs.
- **Suggested fix:** Change `update()`/`deleteEntity()` call sites for bucket-list (and, if the same audit
  confirms it, backlog/project) profiles to pass the DTO's real database `id`, not `activityId`. Since the
  profile is one-per-activity, `activityId` is a legitimate *business* key — but the REST routes are keyed by
  the row's own id, so the frontend needs to carry both fields distinctly rather than aliasing one to the
  other. Also wrap both `update()` and `deleteEntity()` calls in error handling that surfaces a snackbar on
  failure — right now a 404 here is indistinguishable from success to the user.

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
- **Round 2 (mutation pass):** reconfirmed unchanged for `minComfortZoneStep` — navigated directly to
  `/leisure/bucket-list?minComfortZoneStep=5`, request body correctly carried `"minComfortZoneStep":5`,
  response still returned the `comfortZoneStep: 3` seeded row (`itemsCount: 1`).

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
  **Round 2 (mutation pass) — reconfirmed and worse than first recorded:** repeated the same invalid-submit
  test on the Bucket List dialog (previously only the Memory Anchors side was submitted): `POST
  /api/activity-bucket-list-profile` fired with `{"activityId":0,"inspirationSource":""}`-shaped body → 400,
  body `{"errors":{"inspirationSource":["'inspiration Source' must not be empty."],"activityId":["Activity not
  found."]}}`. Queried every `[role=alert]` node in the form after the rejected submit — all four are empty
  strings, so the silent-failure half of this finding is now **confirmed**, not just suspected, on both
  forms. Additionally found a compounding interaction bug from the same root cause: because the Activity
  field's displayed text is the literal `"0"` rather than an empty placeholder, typing to search does not
  replace it — the input becomes `"0Build a bookshelf"`, which matches no real option and offers only "Create
  activity" instead of the real one. The user must notice this and manually clear the field with its "Clear"
  button before the search works, which is a discoverability trap layered on top of the original defect.
- **Evidence:** `docs/views/leisure-bucket-anchors/screenshots/bucket-list--create-dialog.png` (Activity and
  Experience type both show "0"); `docs/views/leisure-bucket-anchors/screenshots/memory-anchors--create-invalid-submit.png`
  (Activity still "0" after a rejected Create click); request `POST /api/memory-anchor` body
  `{"activityId":0,"anchorMonth":9,"anchorYear":2026,"highlightNote":"","rating":5}` → 400, body
  `{"errors":{"highlightNote":["'highlight Note' must not be empty."],"activityId":["Activity not
  found."]}}`. Round 2: `docs/views/leisure-bucket-anchors/screenshots/bucket-list--mutation-invalid-submit.png`
  (form after the rejected Bucket List submit, all alerts empty); request `POST
  /api/activity-bucket-list-profile` body includes `"activityId":0` → 400, body
  `{"errors":{"inspirationSource":["'inspiration Source' must not be empty."],"activityId":["Activity not
  found."]}}`; the search-corruption wrinkle is visible by typing into a fresh Activity field and observing
  the input read `"0<typed text>"`.
- **Repro:** 1. Go to `/leisure/bucket-list`, click Add. 2. Activity and Experience type fields both show "0".
  Or: 1. Go to `/leisure/memory-anchors`, click Add. 2. Click Create without touching any field. 3. A
  `POST /api/memory-anchor` fires and is rejected server-side, with no visible client-side validation message
  having stopped it first. Or: 1. Open either "Add" dialog fresh. 2. Click into the Activity field and type a
  real activity's name. 3. The input reads `"0<what you typed>"` and no matching option appears, only "Create
  activity ...".
- **Verify:** 1. Open either "Add" dialog fresh. 2. **Pass condition:** the Activity (and, for Bucket List,
  Experience type) field is visually empty/placeholder, not "0". 3. Click Create without selecting anything.
  4. **Pass condition:** no network request fires; a visible "required" message appears under the field
  instead. 5. Type a real activity's name into a fresh Activity field. **Pass condition:** the real option
  appears in the dropdown without needing to clear the field first.
- **Root cause guess:** The DTO fields should be typed `number | null = null`, matching the pattern already
  used correctly elsewhere in this module (e.g. `ActivityBucketListProfileRequest.financialGoal: number |
  null = null`). This is the same class of defect L2 fixed for other fields in this module (`as number |
  null` template casts) — these two just weren't in L2's located list.
- **Suggested fix:** Change both defaults to `null` (and the constructor/`fromJson` param types to `number |
  null`), matching `financialGoal`'s existing pattern. `requiredRule` already correctly rejects `null` — no
  change needed there once the defaults stop being `0`.

### B3. The bucket-list table's Inspiration column always renders "—", regardless of the underlying data
- **Status:** open
- **Severity:** bug
- **Where:** `src/_common/composable/table/useTableFormatters.ts:6,30-33` (`PERCENT_KEYWORDS`, `isPercentKey`,
  `formatPercent`), consumed by `src/_common/component/dataTable/DataTable.vue`'s zero-config default
  formatter (no per-column slot is defined for `inspirationSource` in `BucketListTable.vue`)
- **Expected:** A row whose `inspirationSource` is a non-empty string should show that string in the
  Inspiration column, the same way the seeded row's Financial goal ("120") and the created row's Comfort zone
  step both display their real values through the same zero-config default path.
- **Actual:** Both rows tested — the seeded `Learn Bouldering` (`inspirationSource: "A friend's climbing
  photos"`) and a freshly created `Build a Bookshelf` (`inspirationSource: "Mutation pass test row"`) — show a
  literal "—" in the Inspiration column, even though the API response, the component's own `items` prop, and
  the edit dialog (opened on the same row) all correctly carry the real string. **Root cause confirmed by
  direct introspection of the running component**: `isPercentKey('inspirationSource')` returns `true`, because
  `PERCENT_KEYWORDS` includes `'ratio'`, and the substring `"ratio"` appears inside `"inspiRATIOn"` —
  `"inspirationSource".includes('ratio')` is `true`. Once misclassified as a percent field, the cell renders
  via `formatPercent(value)`, which returns `"—"` for any value that is not `typeof === 'number'` — always,
  since `inspirationSource` is a string. This is a false-positive substring match in a keyword-heuristic
  formatter, not a data or DTO problem: `getValue(item, 'inspirationSource')` returns the correct string right
  up until the `isPercentKey` branch throws it away.
- **Evidence:** Live component introspection via the page's own Vue instance (`comp.setupState`) on
  `.my-data-table`: `isPercentKey('inspirationSource')` → `true`; `isCurrencyKey('inspirationSource')` →
  `false`; `formatPercent('Mutation pass test row')` → `"—"`; `getValue(item, 'inspirationSource')` on the
  same item → `"Mutation pass test row"` (correct). DOM evidence: the Inspiration `<td>` is wrapped in a
  `<span data-v-ff53285f>` (`DataTable.vue`'s percent-branch markup), while the Financial goal `<td>` (which
  goes through the *unwrapped* default-`else` branch) has no such span — the wrapper is the tell that the
  wrong branch fired. `docs/views/leisure-bucket-anchors/screenshots/bucket-list--mutation-created.png` and
  `bucket-list--mutation-after-i-did-this.png` both show "—" in Inspiration for rows with real data.
- **Repro:** 1. Go to `/leisure/bucket-list`. 2. The seeded `Learn Bouldering` row's Inspiration column reads
  "—". 3. Open its edit dialog — the Inspiration field correctly shows "A friend's climbing photos",
  confirming the data exists and only the table cell is wrong.
- **Verify:** 1. Repeat the repro. 2. **Pass condition:** the Inspiration column shows the real text, not "—",
  for any row with a non-empty `inspirationSource`.
- **Root cause guess:** `PERCENT_KEYWORDS = ['percent', 'rate', 'vat', 'ratio', 'discount']` in
  `useTableFormatters.ts` is a plain-substring match (`key.toLowerCase().includes(kw)`), which is inherently
  fragile — `'ratio'` collides with "inspiRATIOn" here, but the same class of collision could hit any future
  column (`'rate'` would also match "opeRATIon", "geneRATE", "iteRATE"; `'sum'` in `CURRENCY_KEYWORDS` would
  match "conSUMe"). This is a framework-level bug (`src/_common`), not specific to this app or this column.
- **Suggested fix:** Require a word boundary or a known-suffix match (e.g. the key ends with one of the
  keywords, or matches `/(?:^|[A-Z])Ratio$/` style patterns) instead of a bare substring `includes()` — or,
  more robustly, make these heuristics opt-in per column (a `format` field on `TableColumn`) rather than
  name-sniffed, since a heuristic that silently blanks real data is worse than one that under-formats it.

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

## Resolved this round

Both were `unverified` after the inventory pass and have now been directly exercised. Neither is a defect —
both are removed from the tally above (severity `unverified` no longer applies once tested) and kept here
only for continuity with round 1.

### (was U1) "I did this" capture flow (locked-activity create) — verified working correctly
- **Status:** stale (resolved — confirmed working, not a defect)
- **Where:** `ExperiencedCell.vue` → `useAnchorCapture.ts` → `MemoryAnchorForm.vue` (`lockActivity` path)
- **What was verified:** Created a fresh, not-yet-anchored bucket-list profile (`Build a Bookshelf`) in this
  mutation pass specifically to exercise this path. Clicked its "I did this" action: the capture dialog
  (`Write it down`) opened with the Activity field showing the locked activity name as read-only text (not a
  picker), Month/Year defaulted to the current month/year (September/2026), Highlight empty, and Rating
  defaulted to 5. Filling the highlight and saving fired `POST /api/memory-anchor` → 201, the dialog closed,
  the bucket-list row immediately flipped from "I did this" to "Experienced" (progress bar 1→2 of 2), and the
  new anchor appeared correctly in `/leisure/memory-anchors` with a working "Bucket List" source chip pointing
  back to the row. Screenshots: `bucket-list--mutation-i-did-this-dialog.png`,
  `bucket-list--mutation-after-i-did-this.png`, `memory-anchors--mutation-after-i-did-this.png`.

### (was U2) Deleting a memory anchor correctly reverts its source profile's `isAnchored` flag
- **Status:** stale (resolved — confirmed working, not a defect)
- **Where:** `MemoryAnchor` deletion vs. `ActivityBucketListProfile.isAnchored`/`.memoryAnchorId`
- **What was verified:** Deleted the anchor created for the U1 test above (`DELETE /api/memory-anchor/18004` →
  204). Immediately after, the source bucket-list row (`Build a Bookshelf`) reverted from "Experienced" back
  to showing the "I did this" action, and the progress bar returned to "1 of 2 experienced" — the backend
  correctly un-links the profile rather than leaving a dangling `memoryAnchorId`. Screenshot:
  `bucket-list--mutation-after-anchor-delete.png`. Note this is a one-way link revert, not a cascade delete
  (no rows are destroyed by deleting the anchor), so the delete-confirmation dialog's plain "Are you sure you
  want to delete {name}?" wording is adequate here and was not flagged as a finding.
