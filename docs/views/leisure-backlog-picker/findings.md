# leisure-backlog-picker — findings

> Pass: mutation · captured 2026-09-15 · commit `f457aa0c`

**Tally:** blocker 0 (1 fixed and verified live) · bug 0 (5 fixed and verified live) · a11y 0 (1 fixed and verified live) · polish 0 (1 fixed and verified live) · opportunity 0 (2 fixed and verified live) · unverified 0 (5 verified, all pass)

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-15 | `f457aa0c` | initial mutation pass |
| 2 | 2026-09-24 | code check only (no browser pass) | X1, B1, B2, B3, B4, B5 confirmed fixed in code; A1 already marked fixed and reconfirmed; P1, O1, O2, U1-U5 still open |
| 3 | 2026-09-24 | live `playwright-cli` pass | U1-U5 all exercised via route mocking + a second-account sign-in; all five pass as designed, no defects found |
| 4 | 2026-09-24 | uncommitted | O1, O2, P1 fixed (P1 in the framework) |
| 5 | 2026-09-25 | `d423edcc` | **retest round** — 7 retested live: X1, B1, B2, B3, B4, B5, O1 pass; none reopened; none blocked (B1's third Verify step — a real weather-dependency entry still excluded/boosted — and O1's ranking-penalty observation could not be exercised: the seed has only one backlog row). Account: primaryUser. Mutations made and reverted: X1 Duration edit on row 17001 (45→46→45); two throwaway backlog rows created and deleted (ids 17002, 17003) for the X1-delete and B4 checks, neither of which produced a memory anchor. No regressions seen outside the Verify blocks; F90 toggle groups on `/leisure/pick` ("Time available"/"Energy right now"/"Who's around") still correctly named and pressed-stated. |

---

### X1. Editing or deleting any backlog profile fails — the frontend uses the wrong id
- **Status:** fixed and verified (retest 2026-09-25, live) — edited the seeded row (id 17001): changed Duration
  45→46 and Saved, dialog closed, table showed "46" (`PUT /api/activity-backlog-profile/17001` → 200); reverted
  46→45 the same way. Created a throwaway entry (Grocery Shopping) to test delete: `POST
  /api/activity-backlog-profile` → 201 (id 17002), then deleted it (`DELETE
  /api/activity-backlog-profile/17002` → 204) — row disappeared and stayed gone after a reload.
- **Severity:** blocker
- **Where:** `src/core/leisure/component/backlog/BacklogProfileForm.vue:48` (`update(entityToEdit.activityId, ...)`),
  `src/core/leisure/component/backlog/BacklogTable.vue:151` (`deleteEntity(item.activityId)`), root
  cause in `src/core/leisure/dto/response/ActivityBacklogProfile.ts:27-29` (`get id() { return this.activityId }`)
- **Expected:** Editing a backlog entry's duration and saving persists the change; deleting a row
  after confirming removes it. Plain user sense, and the entity lifecycle described in
  `docs/views/glossary.md` ("an activity has at most one backlog profile").
- **Actual:** Both operations 404. `ActivityBacklogProfile.fromJson` reads the server's own row id
  (a distinct field, e.g. `"id":17002`) but the DTO's `id` getter discards it and returns `activityId`
  (e.g. `12005`) instead. Every write call in this unit is keyed by `entityToEdit.activityId` /
  `item.activityId`, which is not what the REST resource is keyed by. Confirmed directly:
  `GET /api/activity-backlog-profile/12005` (activityId) → 404; `GET /api/activity-backlog-profile/17002`
  (the same row's own id, taken from the grid response) → 200. The mismatch is not particular to the
  row I created — the pre-existing seeded row is `activityId:12007` / `id:17001`, also mismatched, so
  this affects every backlog profile, not an edge case.
- **Evidence:** `docs/views/leisure-backlog-picker/screenshots/leisure-backlog--mutation-edit-dialog-404-silent.png`,
  `screenshots/leisure-backlog--mutation-delete-404-silent.png`; network:
  `PUT /api/activity-backlog-profile/12005` → 404, `DELETE /api/activity-backlog-profile/12005` → 404,
  `GET /api/activity-backlog-profile/17002` → 200 (same row, correct id).
- **Repro:** 1. Go to `/leisure/backlog`. 2. Click "edit" on any row, change Duration, click Save. The
  dialog stays open with no visible error; the row's duration is unchanged after closing. 3. Click
  "delete" on the same row, confirm. The confirmation dialog closes but the row remains in the table.
- **Verify:** 1. Go to `/leisure/backlog`, edit a row's Duration and Save. 2. **Pass condition:** the
  dialog closes and the table shows the new duration. 3. Delete a row and confirm.
  **Pass condition:** the row disappears and a reload does not bring it back.
- **Root cause guess:** `ActivityBacklogProfile.id` should return the server's own `id` field, not
  `activityId` — or, if the identity-by-activity model documented in the glossary is intentional, the
  PUT/DELETE routes need to accept `activityId` server-side instead. This is a contract question
  between the DTO and the API, not purely a frontend typo — flag to whoever owns the backend contract
  before picking a fix.
- **Suggested fix:** If the server resource really is keyed by its own row id, change `id` to return
  a real `id` field threaded through the constructor (not computed from `activityId`), and update the
  two call sites above to use it. Do not silently alias — anything relying on "one activity, one
  profile" elsewhere (`ExperiencedCell`'s reverse lookup, `useLeisurePicker`'s `key` construction)
  should keep using `activityId` explicitly, since that part of the model is correct.

---

### B1. The picker hard-excludes a "no weather dependency" backlog entry whenever today's weather doesn't match any lookup value — currently blocking the only seeded suggestion
- **Status:** fixed and verified (retest 2026-09-25, live) — `GET /leisure-weather-fit` returned
  `{"matchingWeatherDependencyIds":[]}` (same empty-match condition as the original finding), and "Read a
  Novel" (weatherDependency "None") still appeared as the picker's suggestion on `/leisure/pick`'s default
  load — no "Nothing matches those constraints". The Verify block's third step (confirm a real-dependency
  entry is still excluded/boosted) could not be exercised: the seed has only this one backlog row and none
  with an actual weather dependency. That half is held by unit tests instead (passing 2026-09-25):
  `leisureScoring.test.ts` › "excludes a backlog activity whose weather dependency does not fit today…" and
  "ranks a backlog activity up when its weather dependency matches today", plus
  `activityBacklogProfileWeatherCode.test.ts` (a *None* row maps to `realWeatherDependencyId: null`).
- **Severity:** bug
- **Where:** `src/core/leisure/composable/leisureScoring.ts` `isEligible()` (backlog branch), fed by
  `src/core/leisure/composable/useWeatherFit.ts` and `useLeisurePicker.ts`'s `redraw()`
- **Expected:** Per `prompts/_done/leisure/D2-weather-aware.md` (¶2, "degrade honestly... the picker
  must rank exactly as it does today [without weather]") and the `activity-weather-dependency` lookup
  itself including a "None" value, a backlog entry that declares no weather dependency should never
  be excluded — or boosted — by weather. It should rank identically with or without a weather signal.
- **Actual:** `isEligible()` treats every non-null `weatherDependencyId` identically: if
  `weatherMatchIds` is non-null (i.e. the weather call succeeded, even if it matched nothing) and does
  not contain the candidate's id, the candidate is excluded — with no special case for the "None"
  lookup value. Right now, live, `GET /leisure-weather-fit` returns `{"matchingWeatherDependencyIds":[]}`
  (a successful call, empty match set — not the "unavailable" `null` case the code otherwise handles
  correctly). Under that response, the seed's one backlog row ("Read a Novel", `weatherDependency:
  "None"`, id 5) is excluded, and with the seed's one project ineligible for an unrelated reason
  (`readinessStatus: NeedsShopping`), the picker shows **zero suggestions on a fresh default load** —
  "Nothing matches those constraints" — despite one plainly-eligible candidate (45 min ≤ 60 available,
  1 participant ≤ 1 available).
- **Evidence:** `screenshots/leisure-pick--empty-nothing-fits.png` (default load, real weather
  response); `screenshots/leisure-pick--suggestions-mocked-weather.png` (identical candidate appears
  once `leisure-weather-fit` is mocked to return `{"matchingWeatherDependencyIds":[5]}` via
  `playwright-cli route`) — same pool, same constraints, only the weather response differs. Network:
  `GET https://localhost:8080/api/leisure-weather-fit` → `200 {"matchingWeatherDependencyIds":[]}`.
- **Repro:** 1. Go to `/leisure/pick` with default constraints (1 h, Medium, Just me) against the
  seed data, on a day the weather service returns an empty match set (currently: always, for this
  environment). 2. Observe "Nothing matches those constraints" despite the backlog containing one
  eligible entry.
- **Verify:** 1. With a backlog entry whose `weatherDependency` is "None" and otherwise eligible,
  load `/leisure/pick`. 2. **Pass condition:** the entry appears as a suggestion regardless of what
  `matchingWeatherDependencyIds` contains (empty array, non-matching array, or omitted entirely) — a
  "None" dependency must never be hard-excluded or scored via the weather-match bonus. 3. Confirm a
  backlog entry with an actual weather dependency (e.g. "Sunny") is still correctly excluded/boosted.
- **Root cause guess:** `isEligible`/`scoreCandidate` never special-case the specific lookup id that
  means "not weather dependent" — they were written generically against "any `weatherDependencyId`",
  which is correct for a real dependency but wrong for the "none" sentinel value. The same gap shows
  up in the ranking bonus: the mocked screenshot's reason chip reads "Good weather for this today" for
  an indoor, weather-independent activity, which is misleading even in the cases where it happens not
  to be excluded.
- **Suggested fix:** Either carry a `boolean` "has a real weather dependency" alongside
  `weatherDependencyId` in `CandidateFacts` (cleanest — doesn't depend on a magic lookup id staying
  stable), or special-case the "None" lookup's id explicitly and skip both the hard exclusion and the
  `WEATHER_MATCH_BONUS`/reason-chip for it.

---

### B2. Create-dialog required selects show a literal "0" instead of a placeholder, and it leaks into typed search text
- **Status:** fixed and verified (retest 2026-09-25, live) — fresh create dialog: Activity, Location, Weather
  and Cost all show their label as a placeholder with no value text; typing "Grocery" into Activity (without
  clearing first) left the field reading exactly "Grocery", no "0" prefix.
- **Severity:** bug
- **Where:** `src/core/leisure/component/backlog/NewBacklogProfileForm.vue` (Activity, Location,
  Weather, Cost fields), root cause `src/core/leisure/dto/request/ActivityBacklogProfileRequest.ts:6-13`
  (`activityId = 0`, `locationTypeId = 0`, `weatherDependencyId = 0`, `expectedCostTierId = 0`)
- **Expected:** An unselected required field shows its label as a placeholder (e.g. "Activity"),
  not a value — plain sense, and how every other `VIdSelect`/`VIdAutocomplete` in the app behaves
  when its model is `null`.
- **Actual:** `ActivityBacklogProfileRequest`'s numeric defaults are `0`, not `null`. Since no lookup
  item has id `0`, Vuetify renders the raw model value as text: all four fields show a literal "0" on
  the fresh create dialog. Worse for the Activity autocomplete specifically: it is a search field, and
  the leaked "0" is not cleared on focus — typing "Grocery" while the field displays "0" produces
  "0Grocery", which becomes both the search filter text and (if nothing matches) the pre-filled name
  offered by the inline "Create activity …" quick-create affordance from L4.
- **Evidence:** `screenshots/leisure-backlog--mutation-create-dialog.png` (four fields showing "0"),
  `screenshots/leisure-backlog--mutation-create-zero-leak.png` (field reads "0Grocery", no-results row
  reads `Create activity "0Grocery"`).
- **Repro:** 1. Go to `/leisure/backlog`, click Add. 2. Observe Activity/Location/Weather/Cost all
  show "0". 3. Click into Activity and type "Grocery" without first clearing the field. 4. Observe
  the field reads "0Grocery".
- **Verify:** 1. Open the create dialog fresh. 2. **Pass condition:** Activity, Location, Weather and
  Cost show their label as a placeholder with no value text. 3. Click into Activity and type a search
  term without touching the clear button. **Pass condition:** the field contains only what was typed.
- **Root cause guess:** The request DTO's defaults should be `null` for every field that is a real
  foreign key with no sensible zero value (`activityId`, `locationTypeId`, `weatherDependencyId`,
  `expectedCostTierId`), matching how `effortType` is already correctly defaulted to `null`. This
  likely also requires widening the constructor/field types to `number | null`.
- **Suggested fix:** Change the four defaults to `null` and widen the types; verify the `create`
  request still round-trips correctly once a real selection overwrites them (should be unaffected,
  since a selection already overwrites the field regardless of its starting value).

---

### B3. Create-form client validation doesn't match server requirements, and the failure is shown as a useless generic message
- **Status:** fixed and verified (retest 2026-09-25, live) — opened the create dialog and clicked Create with
  nothing selected: inline "This field is required" appeared under Activity, Location, Weather and Cost, and
  no `POST /api/activity-backlog-profile` request was sent (confirmed via the network log).
- **Severity:** bug
- **Where:** `src/core/leisure/component/backlog/NewBacklogProfileForm.vue` (only `Activity` carries
  `:rules="[requiredRule]"`, via `ActivityAutocompleteWithCreate.vue`; Location/Weather/Cost carry
  none), `src/core/leisure/component/backlog/BacklogProfileForm.vue:42-57` (`onConfirm` has no
  `catch`), root cause `src/_common/composable/general/rules/RulesComposition.ts:22-27` (`requiredRule`
  treats `0` as a valid, present value)
- **Expected:** A create form should not let the user submit a state the server is going to reject
  for a reason the server can already name — either block it client-side, or show the server's
  specific complaint. `src/_common/axiosConfig.ts` already has `extractServerFieldError()` built
  for exactly this (FastEndpoints' `{errors: {propertyName: [...]}}` shape → route to the right field).
- **Actual:** Because of B2, an untouched Activity field holds `0`, and `requiredRule(0)` returns
  `true` (it only rejects `null`/`undefined`/empty string/empty array — `0` is none of those). So the
  client-side `form.value!.validate()` passes with nothing selected, and Location/Weather/Cost have no
  rule to fail even if they did check for `0`. The request reaches the server and gets a 400 with
  `{"errors":{"activityId":["Activity not found."]}}`. `BacklogProfileForm.vue`'s `onConfirm` has no
  `catch`, so the specific message never reaches the UI — the only thing the user sees is the axios
  interceptor's generic snackbar, which for a 400 prefers the response's own top-level `message`
  field ("One or more errors occurred!") over the actually-useful per-field text sitting right next
  to it in `errors.activityId[0]`.
- **Evidence:** `screenshots/leisure-backlog--mutation-create-invalid-400.png` (dialog after submit,
  no field-level error shown anywhere). Network: `POST /api/activity-backlog-profile` → 400, body
  `{"statusCode":400,"message":"One or more errors occurred!","errors":{"activityId":["Activity not found."]}}`;
  request body `{"activityId":0,"locationTypeId":0,"weatherDependencyId":0,...}`.
- **Repro:** 1. Go to `/leisure/backlog`, click Add. 2. Click Create without selecting anything.
  3. Observe: no red field state, dialog stays open, a snackbar reading "One or more errors occurred!"
  appears and disappears within a few seconds with no way to tell which field was the problem.
- **Verify:** 1. Open the create dialog, submit with nothing selected. 2. **Pass condition:** the
  Activity field (and any other genuinely-required field) shows a visible validation message before
  any request is sent, OR — if it does reach the server — the resulting snackbar/field state names
  the specific field the server rejected, not a generic "errors occurred" string.
- **Root cause guess:** Same defaults-of-`0` issue as B2 is what lets `requiredRule` pass; fixing B2
  (defaults to `null`) would make the existing `requiredRule` on Activity correctly block submission.
  Location/Weather/Cost still need a `required` rule added, since B2 alone only fixes the display, not
  the missing validation on those three fields. Separately, `onConfirm` should catch the write and
  call `extractServerFieldError(error, 'activityId')` (etc.) to surface the specific message instead
  of relying on the generic interceptor snackbar.
- **Suggested fix:** Add `:rules="[requiredRule]"` to Location/Weather/Cost's `VIdSelect`s; wrap
  `onConfirm`'s `create`/`update` call in `try/catch` and surface `extractServerFieldError` (or at
  least the caught error) rather than letting it propagate silently to the interceptor only.

---

### B4. Same pattern in the memory-anchor form: Highlight is server-required, has no client rule, and the 400 is silent
- **Status:** fixed and verified (retest 2026-09-25, live) — created a throwaway non-repeatable backlog entry,
  clicked "I did this" to open "Write it down", left Highlight empty, clicked "Save the moment": inline "This
  field is required" appeared under Highlight and no `POST /api/memory-anchor` request was sent. Cancelled the
  dialog (no anchor created) and deleted the throwaway backlog row afterward.
- **Severity:** bug
- **Where:** `src/core/leisure/component/memoryAnchor/NewMemoryAnchorForm.vue` (Highlight field, no
  `required` rule observed), `src/core/leisure/component/memoryAnchor/MemoryAnchorForm.vue` (its
  `onConfirm` — at capture time it matched B3's pattern; since the fix it catches the write and routes the
  server's per-field message through `formRef.applyServerError(e)`, confirmed by source read 2026-09-25)
- **Expected:** Same as B3 — either block an empty Highlight client-side, or show the server's actual
  complaint.
- **Actual:** Clicking "Save the moment" with Highlight empty sends the request, gets a 400
  (`{"errors":{"highlightNote":["'highlight Note' must not be empty."]}}`), and the dialog stays open
  with no red state on the Highlight field — only the same generic "One or more errors occurred!"
  snackbar as B3.
- **Evidence:** `screenshots/leisure-backlog--mutation-anchor-400-silent.png`. Network:
  `POST /api/memory-anchor` → 400, body
  `{"statusCode":400,"message":"One or more errors occurred!","errors":{"highlightNote":["'highlight Note' must not be empty."]}}`;
  request body `{"activityId":12005,"anchorMonth":9,"anchorYear":2026,"highlightNote":"","rating":5}`.
- **Repro:** 1. Go to `/leisure/backlog`, click "I did this" on an eligible row. 2. Leave Highlight
  empty, click "Save the moment". 3. Observe: dialog stays open, no field-level error, generic
  snackbar only.
- **Verify:** 1. Open "Write it down" for an eligible activity, leave Highlight empty, submit.
  2. **Pass condition:** a visible validation message appears on the Highlight field before or
  instead of a network round-trip.
- **Root cause guess:** Same missing-required-rule-plus-uncaught-write pattern as B3 — likely worth
  batching the fix for both forms together rather than treating as unrelated.
- **Suggested fix:** Add a `required` rule to the Highlight textarea; same `extractServerFieldError`
  treatment as B3's suggested fix.

---

### B5. Duration column renders as a percentage — "90.00 %" instead of "90 min"
- **Status:** fixed and verified (retest 2026-09-25, live) — **[framework]** the Duration (min) column reads
  "45" (and "46" during the X1 edit check), no "%" in either state. No other duration-like column noticed a
  regression in the other direction during this pass.
- **Severity:** bug — **[framework]**
- **Where:** `src/_common/composable/table/useTableFormatters.ts` `isPercentKey()` /
  `PERCENT_KEYWORDS`, observed via `src/core/leisure/component/backlog/BacklogTable.vue`'s
  `durationMinutes` column (no `#item.durationMinutes` slot override, so it falls through to the
  generic formatter in `src/_common/component/dataTable/DataTable.vue:56-57`)
- **Expected:** The "Duration (min)" column should render a plain number (e.g. "90"), matching its
  own header label.
- **Actual:** Every row shows e.g. "90.00 %". `PERCENT_KEYWORDS` includes `'ratio'`, and
  `isPercentKey()` does `key.toLowerCase().includes(kw)` — `"durationminutes"` contains `"ratio"` as a
  substring (**du-RATIO-nMinutes**), a false-positive match unrelated to the column's actual meaning.
- **Evidence:** `screenshots/leisure-backlog--default.png` and every later Backlog screenshot in this
  pass — the "Duration (min)" column consistently reads "45.00 %" / "90.00 %" for both the seeded row
  and the row created in this pass.
- **Repro:** 1. Go to `/leisure/backlog`. 2. Read any row's Duration (min) column.
- **Verify:** 1. Go to `/leisure/backlog`. 2. **Pass condition:** the Duration column shows a plain
  number, no "%". 3. Confirm no other column in this app whose key happens to contain "duration" (a
  substring of "ratio") regressed to plain-number-as-percent in the other direction — this is a
  shared, keyword-matched formatter, so the fix affects every consumer, not just this table.
- **Root cause guess:** Substring matching on short, generic keywords (`'ratio'`, `'rate'`, `'vat'`)
  is inherently collision-prone against compound English words. `"duration"` is the only confirmed
  collision found in this pass, but the same risk applies to any future column key containing one of
  these substrings.
- **Suggested fix:** Word-boundary match instead of substring match (e.g. split the key into words by
  casing and compare whole words), or require an explicit opt-in (a column-level format hint) rather
  than inferring format from the key name at all — the latter is more invasive but removes this whole
  class of false positive.

---

### A1. The "Experienced" chip has no accessible interactive role
- **Status:** fixed and verified (2026-09-22, `F49`'s action-chip tier — `role="button"` on the chip; Vuetify's
  `link` already gave it `tabindex="0"` and the Enter/Space keydown, the role was the only missing piece.
  Verified live on `/leisure/bucket-list`, whose seeded row is anchored: `getByRole('button', { name:
  'Experienced' })` resolves, Tab reaches it, Enter navigates to `/leisure/memory-anchors?activityName=…`
  exactly as a click does. The `MemoryAnchorTable` source chips got the same attribute) — reconfirmed in code
  2026-09-24: `role="button"` still present on `ExperiencedCell.vue`'s chip.
- **Severity:** a11y
- **Where:** `src/core/leisure/component/ExperiencedCell.vue` — the `<VChip link @click="openAnchor">`
  shown once a row is anchored
- **Expected:** An element the user can click to navigate should be reachable by an accessible role
  (`button` or `link`) and by its visible name, per the same standard the PROMPT-TEMPLATE checklist
  applies to every other control in this pass.
- **Actual:** `playwright-cli click "getByRole('button', { name: 'Experienced' })"` found no match;
  reaching the chip required falling back to a text-based locator
  (`locator('tbody').getByText('Experienced')`). The accessibility snapshot renders the chip as a
  bare `generic` node with a `data-no-activator` div inside it, not as a `button`/`link` role.
- **Evidence:** Tool error `Error: "getByRole('button', { name: 'Experienced' })" does not match any
  elements`, immediately followed by a successful click via the text-based fallback in the same
  session (see transcript around the anchor-navigation step of this pass).
- **Repro:** 1. Go to `/leisure/backlog` with at least one anchored row. 2. Try to address the
  "Experienced" chip by role (`button` or `link`) and its visible name.
- **Verify:** 1. Same setup. 2. **Pass condition:** `getByRole('button', { name: 'Experienced' })` or
  `getByRole('link', { name: 'Experienced' })` resolves to the chip, and activating it via keyboard
  (Tab to it, Enter) navigates to the memory anchors view exactly as a mouse click does.
- **Suggested fix:** Vuetify's `VChip` with `link` should already emit `role="button"` and
  `tabindex="0"` when clickable — confirm whether a prop or wrapper here is suppressing that, and
  whether the same pattern is reused by other clickable chips in the framework (`ChipWithIcon.vue`).

---

### P1. Clicking a second column header adds a secondary sort instead of replacing the first
- **Status:** fixed and verified (2026-09-24) — **[framework]** `DataTable.vue` now passes
  `multiSort: { key: 'ctrl' }`: a plain header click replaces the sort, Ctrl/⌘-click adds a key, and a
  multi-key `sortBy` from the URL still applies. Multi-sort itself was kept; only the silent layering on a
  plain click is gone. Verified live on `/leisure/backlog`: a plain click on Duration →
  `sortBy=durationMinutes:asc`; a Ctrl-click on Activity → `durationMinutes:asc,activity.name:asc`; a plain
  click on an existing key still flips its direction. Documented in `_common/docs/components.md`.
- **Severity:** polish
- **Where:** `BacklogTable.vue`'s columns, backed by `BasicTable`/`DataTable` (framework) — observed
  clicking "Duration (min)" while already sorted by "Activity"
- **Expected:** Clicking a column header in a simple, non-multi-sort-advertised table like this one
  typically replaces the active sort, the way most of this app's single-sort tables behave — no
  visible affordance here (no shift-click hint, no multi-sort icon) tells the user clicking a second
  header will layer a sort instead of switching to it.
- **Actual:** `sortBy` became `activity.name:asc,durationMinutes:asc` after a single plain click on
  "Duration (min)" while "Activity" was still the active sort — accepted by the server with no error,
  just not the sort the click looked like it was asking for.
- **Evidence:** URL changed from `sortBy=activity.name:asc` to
  `sortBy=activity.name:asc,durationMinutes:asc` after one click on the Duration header, no modifier
  key held.
- **Repro:** 1. Go to `/leisure/backlog` (default sort: Activity). 2. Click the "Duration (min)"
  header once. 3. Observe the URL's `sortBy` gains a second key rather than replacing the first.
- **Verify:** 1. Same steps. 2. **Pass condition:** either the URL replaces the sort key entirely
  (single-sort table), or — if multi-sort is intentional — the header UI visibly indicates
  multi-sort is active (numbered sort badges, as `BacklogTable`'s own "Activity 1" header chip
  already shows for the primary key, extended to the secondary).
- **Root cause guess:** Likely `BasicTable`/`DataTable`'s default Vuetify `VDataTable` `multiSort`
  behaviour, shared by every table in the app — if so this is a framework-wide default, not specific
  to this unit, and worth checking against the other leisure tables (Projects, Bucket list, Memory
  anchors) before filing a fix here.

---

### O1. `maxParticipants` is captured on every backlog entry and spent nowhere
- **Status:** fixed and verified (retest 2026-09-25, live) — on `/leisure/backlog` the "People" column renders
  (e.g. "1", "1+" for the throwaway row created during this pass). On `/leisure/pick`, setting "Who's around"
  to "A group" (people=4) still surfaced the seed's one backlog row (`maxParticipants: 1`) as the suggestion —
  it ranks rather than hard-excludes, as the fix intends. Could not observe the ranking penalty directly
  (only one backlog candidate exists in the seed), only that exclusion does not occur. The penalty itself is
  held by `leisureScoring.test.ts` (a `maxParticipants: 2` entry scores below `4` and `null` at people=4;
  passing 2026-09-25).
- **Severity:** opportunity
- **Where:** `NewBacklogProfileForm.vue` (Max people input) → `ActivityBacklogProfileRequest.maxParticipants`
  → `ActivityBacklogProfile.maxParticipants`; no `BacklogTable.vue` column reads it, and
  `leisureScoring.ts`'s `CandidateFacts.minParticipants` is the only participant field the picker's
  `isEligible()` ever checks.
- **Where it could feed:** the picker's hard-exclusion logic already treats `minParticipants` as "not
  enough people"; `maxParticipants` is the natural symmetric signal for "too many people" (a
  two-player game suggested to "A group") or for down-ranking (not excluding) an activity that
  doesn't use all the people available. Right now the field the user filled in has no observable
  effect anywhere in the app.
- **Confirmed still open (code check 2026-09-24):** `leisureScoring.ts` only references `minParticipants`;
  `maxParticipants` doesn't appear there, and `BacklogTable.vue`'s column list has no `maxParticipants` entry.
- **Repro:** 1. Create a backlog entry with Max people = 2. 2. Look for it anywhere in `BacklogTable`'s
  columns (not present) or in the picker's eligibility/ranking for a "who's around: A group" (4+)
  constraint (not read).

### O2. `ExperiencedCell`'s "open anchor" link navigates by activity name, not the id it already has
- **Status:** fixed and verified (2026-09-24) — navigates by `activityId` rather than `memoryAnchorId`: the
  server's `MemoryAnchorFilterRequest` already accepted `ActivityId`, and a one-time activity has at most one
  anchor, so it is just as exact and needs no new route. `MemoryAnchorFilter` gained `activityId` (URL
  `?activityId=`, round-tripped in `memoryAnchorFilterUrlState`, sent by the timeline too); its chip names the
  activity from the loaded rows and is the only way to clear it. `leisure-bucket-anchors.draft.spec.ts`'s
  chip test now asserts the id URL and the "Activity: Learn Bouldering" chip, and passes live. The reverse
  direction (`MemoryAnchorTable`'s source chips → backlog/bucket list) still navigates by name.
- **Severity:** opportunity
- **Where:** `src/core/leisure/component/ExperiencedCell.vue` `openAnchor()` — navigates to
  `{ name: 'leisureMemoryAnchors', query: { activityName } }`, while `ActivityBacklogProfile` already
  carries `memoryAnchorId` for exactly this row.
- **Where it could feed:** a direct id-based filter (or a future anchors detail route) would survive
  an activity being renamed and would not risk two differently-anchored activities sharing a display
  name (the filter is a text match on `activityName`, not a strict id match) — currently a latent
  correctness risk rather than an observed failure, since the seed has no name collisions to expose
  it.
- **Repro:** 1. Read `ExperiencedCell.vue`'s `openAnchor()` and `ActivityBacklogProfile`'s fields side
  by side — `memoryAnchorId` is present on every anchored row and unused by this function.

---

### U1. Backlog table empty state not reached with current seed
- **Status:** verified, passes (2026-09-24, `playwright-cli`) — mocked `POST **/activity-backlog-profile/grid`
  to return `{"items":[],"itemsCount":0}` and loaded `/leisure/backlog` signed in as the primary seed user.
  The `#noData` slot renders "These are things you could do. You don't have any here yet." with an inline
  "Add" button, as designed.

### U2. Picker's "nothing filed at all" empty state not reached
- **Status:** verified, passes (2026-09-24, `playwright-cli`) — mocked all three `grid` endpoints
  (`activity-backlog-profile`, `activity-project-profile`, `activity-bucket-list-profile`) to return empty
  and loaded `/leisure/pick`. Renders "There's nothing to pick from yet. Add a few activities to your backlog
  and come back." with a "Fill the backlog" link, as designed.

### U3. Picker's "load failed" empty state not reached
- **Status:** verified, passes (2026-09-24, `playwright-cli`) — mocked `POST **/activity-backlog-profile/grid`
  to return a 500 and loaded `/leisure/pick`. Renders "We couldn't load your activities. Try again in a
  moment." plus the generic error snackbar ("A server error occurred. Please try again later."), as designed.

### U4. Picker's loading skeleton not screenshotted
- **Status:** verified, passes (2026-09-24, `playwright-cli`) — delayed `POST **/activity-backlog-profile/grid`
  by 4s via `page.route`/`waitForTimeout`, then snapshotted immediately after `goto /leisure/pick`. The
  accessibility tree shows three `alert "Loading..."` nodes (the `VSkeletonLoader` state), confirming it
  renders as designed.

### U5. `suggestionHistory` storage scoping not verified
- **Status:** verified, passes (2026-09-24, `playwright-cli` + code read) — the code comment in
  `suggestionHistory.ts` already documents this was addressed by a prior fix (P4: "found this key
  un-namespaced and scoped it by account"), which routes through `readUserScoped`/`writeUserScoped`
  (`useUserScopedStorage.ts`), keying as `` `${name}::u${accountId}` ``. Live-confirmed: clicking "Something
  else" as the primary seed user (id 10001) wrote `leisure.picker.history::u10001` to `localStorage`.
  Signing in as the secondary seed user (id 10002) in the same browser showed no `leisure.picker.history`
  key at all under that session — no leak, no cross-account read.
