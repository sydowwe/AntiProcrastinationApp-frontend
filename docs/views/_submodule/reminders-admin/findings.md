# reminders-admin — findings

> Pass: inventory · captured 2026-10-01 · commit `4d890646` (framework `b1b82a1`)

**Tally:** blocker 1 · bug 6 · a11y 4 · polish 8 · opportunity 1 · unverified 2  (22 entries)
**Open after round 2 (2026-10-05):** 20 fixed (S5, S7, S18–S27, O1) · 1 verified (U2) · 1 unverified (U1)

Visual sweep: one screenshot read back per view. It found X1 (detail cards clipped) and B6 (history notice crushed),
neither visible in the accessibility snapshot, and the empty last column (P6). The register, Upcoming and overview
sweeps found nothing further.

Intent-source claims checked (R1, R5, R7, R9, R12): R1's page reset on filter, single mount request on the history,
and clean console under filtering hold; R1 bug 5's "the grid does not return the schedule" no longer holds (B1).
R5: paging, sorting and filtering are server-side and round-trip through the URL on all four list views; the
`?reminderId=` deep link is the filter's own param. R7: no in-view admin guard remains; the comment in
`reminders.routes.ts` is in place. R9: freshness label, focus refresh, stale-content-on-failure and every
drill-down hold (U1/U2 for the rest). R12: the occurrence preview renders for every status in the seed, with
honest paused/cancelled copy. The README's "module is Slovak-only" note is stale — `reminders.en.ts` and
`remindersDashboard.en.ts` exist and render.

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-10-01 | `4d890646` | initial inventory pass |
| 2 | 2026-10-05 | `0a7c9b25` | closed against `_fix-queue-log.md`: X1, B1–B6, A1–A4, P1–P8 fixed; O1 deferred; U2 verified (mocked overview); U1 still open |

All findings are **[framework]** — `src/_common/modules/reminders/` or a framework component it mounts.

---

### X1. [framework] Detail view: every card is clipped — the values are unreadable at 1440×900
- **Status:** fixed 2026-10-04 (S18, framework `7c048c2`; `flex-shrink-0` on every direct child of the detail and overview containers; Content card 277/277 was 192/277, the container scrolls; the e2e test is real)
- **Severity:** blocker
- **Where:** `/pripomienky/register/23201` (any id) → all six cards · `view/ReminderDefinitionDetailView.vue:2-5`
  (`VContainer class="d-flex flex-column ga-4"`)
- **Expected:** the detail page's purpose is to read a reminder's key, lifecycle, schedule and recipients (R12:
  "the registry is the screen where you check that a reminder is configured correctly"). Each card shows its content;
  the page scrolls.
- **Actual:** the view's container is a flex column inside the app's height-bounded main area (836 px). Its children
  keep the default `flex-shrink: 1`, and every `VCard` is `overflow: hidden`, so the cards shrink to fit and clip.
  Measured (`clientHeight / scrollHeight`): Reminder key 85/114, Lifecycle 89/119, Schedule 89/119, Upcoming
  occurrences 129/181, Recipients 89/119, Content 192/277. On screen, *Portal*, *23001*, the status chip, the next
  occurrence, *Due at*, the lead-time chips and the recipient chip show only their top few pixels, and the preview's
  "These are all the remaining occurrences." line is cut off entirely. The container itself does not scroll
  (`scrollHeight` 836 = `clientHeight`), so there is no way to reach the hidden part. It only fits on a viewport
  tall enough for ~1 000 px of content.
- **Evidence:** screenshot `screenshots/pripomienky-register-id.png`; `playwright-cli eval` measuring
  `main .v-container .v-container.flex-column` children (numbers above).
- **Repro:** 1. Viewport 1440×900. 2. Open `/pripomienky/register/23201`. 3. Look at the Reminder key card's values.
- **Verify:** 1. Viewport 1440×900, open `/pripomienky/register/23201`. 2. **Pass:** for every direct child of the
  view's container, `scrollHeight <= clientHeight` (`eval` as above), and the Reminder key card visibly reads
  "Portal · Reminder · 23001 · PersonalReminder"; the page scrolls to reach the Content card.
- **Root cause guess:** the same as `scheduler/B5` (`_submodule/_fix-queue.md` S2) — a `d-flex flex-column` page
  container with shrinkable `overflow: hidden` cards. `ReminderOverviewView` has the identical container but was
  **not** observed clipping (its content fits at 900 px, and at 720 px only the failure card shrinks, harmlessly); it
  will clip once the seed or a real deployment gives it more content, so fix both containers together. B6 is the same
  family in a third container.
- **Suggested fix:** `flex-shrink-0` on the container's direct children, or drop `d-flex flex-column` for a block
  stack with `ga-4` → margins.

### B1. [framework] Register's Schedule column is "—" for recurring rows, though the grid response carries the schedule
- **Status:** fixed 2026-10-04 (S19, framework `f103416`; the grid DTO maps `dueAt`, `intervalPreset`, `cron` → `cronExpression`; #23003 reads "Monthly", the `TODO(Bn)` is gone; a `RecurringCron` row is not in the seed, so that mapping was checked through `fromJson` only)
- **Severity:** bug
- **Where:** `/pripomienky/register` → row "Reminder #23003", Schedule type cell ·
  `dto/response/ReminderDefinitionGridResponse.ts:21-32`, `view/ReminderDefinitionsView.vue:94-100`
- **Expected:** the recurring row reads "Monthly" like it does on `/pripomienky/nadchadzajuce` and the detail view.
  R1 bug 5 wanted exactly this and parked it on a backend ask ("the grid endpoint simply does not return them").
- **Actual:** "⟳ —". The `POST /reminder-definition/grid` response for id 23203 contains
  `"intervalPreset":"Monthly","cron":null,"anchorDate":"2026-10-12T08:00:00+00:00"` — every schedule field is on the
  wire. `ReminderDefinitionGridResponse.fromJson` maps only eight fields and drops them. The view's
  `<!-- TODO(Bn): grid response has no cronExpression/intervalPreset -->` states a premise that is no longer true,
  and no ask was ever written (`prompts/_done/_common/reminders/backend/` has B1–B4, none about it). Note the
  server field is `cron`, not `cronExpression`.
- **Evidence:** screenshot `screenshots/pripomienky-register.png` (4th row); `playwright-cli response-body` on the
  mount's `POST /api/reminder-definition/grid` (200).
- **Repro:** 1. Sign in as `admin@example.com`. 2. Open `/pripomienky/register`. 3. Row "Reminder #23003", Schedule type column.
- **Verify:** 1. Open `/pripomienky/register`. 2. **Pass:** the "Reminder #23003" row's Schedule type cell reads
  "Monthly" (not "—"), and the `TODO(Bn)` comment at the call site is gone.
- **Root cause guess:** the DTO predates the server adding the fields. Same cause as B2.
- **Suggested fix:** map `dueAt`, `intervalPreset`, `cron` (→ `cronExpression`) in `fromJson`; pass all four props to
  `ReminderScheduleDisplay` as the upcoming view does.

### B2. [framework] Register and Upcoming: "Due …" shows the next lead-time nudge, not the due date
- **Status:** fixed 2026-10-04 (S19, framework `f103416`; both views pass `:dueAt="item.dueAt"`; #23001 reads "Due 05.10.2026 17:00:00" while Next occurrence stays 16:30; paused/cancelled one-shots now show their due date too)
- **Severity:** bug
- **Where:** `/pripomienky/register` and `/pripomienky/nadchadzajuce` → Schedule type cell of every active one-shot ·
  `ReminderDefinitionsView.vue:96-99` and `ReminderUpcomingView.vue:120-125` (both `:dueAt="item.nextOccurrenceAt"`);
  `UpcomingReminderGridResponse.fromJson` also leaves `dueAt` unmapped although the admin `/upcoming` response carries it
- **Expected:** "Due X" states when the thing is due. R1 chose `nextOccurrenceAt` as a stand-in only because
  `dueAt` was believed absent from the grid response. Plain sense: a label saying *Due* must not show a different
  instant.
- **Actual:** Reminder #23101 (`dueAt 2026-10-01T11:00Z`, lead offset −60) reads "Due 01.10.2026 12:00:00" (browser
  UTC+2), i.e. its 10:00Z nudge; the real due time is 13:00. Reminder #23001 (`dueAt 15:00Z`, offsets −30/0) reads
  "Due 02.10.2026 16:30:00", its −30 nudge; due is 17:00. The cell duplicates the Next occurrence column on every
  row and misstates the deadline on every row with a negative offset. The response carries the real `dueAt`.
- **Evidence:** screenshot `screenshots/pripomienky-register.png` rows 1–2; grid response body (`dueAt`,
  `nextOccurrenceAt`, `leadOffsets` for 23301 and 23201). Cross-check: detail view `/pripomienky/register/23201`
  shows *Due at* 02.10.2026 17:00:00 (see detail section).
- **Repro:** 1. Open `/pripomienky/register`. 2. Compare the first row's "Due …" with its Next occurrence column.
- **Verify:** 1. Open `/pripomienky/register`, then `/pripomienky/nadchadzajuce`. 2. **Pass:** on both, the
  "Reminder #23001" row reads "Due 02.10.2026 17:00…" (its `dueAt`, same as the detail page's *Due at*) while Next
  occurrence still reads 16:30.
- **Root cause guess:** same as B1 — `fromJson` drops `dueAt`, so the views pass the nearest thing they have.
- **Suggested fix:** as B1; map `dueAt` in both grid DTOs and pass `:dueAt="item.dueAt"`.

### B3. [framework] Detail breadcrumb shows "Reminder register" twice
- **Status:** fixed 2026-10-04 (S5, framework `6154af1`; `useBreadcrumbs` skips an extra already in the chain, so no view edit; `/23201` → `Home › Reminder register › Reminder #23001`, cold `/999999` → `Home › Reminder register`)
- **Severity:** bug
- **Where:** `/pripomienky/register/23201` → top-bar breadcrumb · `ReminderDefinitionDetailView.vue:382-387`
- **Expected:** one crumb per level: *Home › Reminder register › {reminder}*.
- **Actual:** "Home › Reminder register › Reminder register › PersonalReminder". The view always prepends a register
  crumb on the premise, stated in its own comment, that "the register list is not a nav path". In this host it is
  (sidebar › Reminders › Reminder register, `src/app/nav/navItems.ts:80`), so the shell's longest-prefix match already
  renders it. Same on the not-found state: "Home › Reminder register › Reminder register". Identical in shape to
  `scheduler/B3` (`_submodule/_fix-queue.md` S5), which already asks for a framework-level decision on it.
- **Evidence:** `eval` of `.v-breadcrumbs-item` texts on `/23201` and `/999999`; screenshot
  `screenshots/pripomienky-register-id.png` (top bar).
- **Repro:** 1. Open `/pripomienky/register/23201`. 2. Read the breadcrumb.
- **Verify:** 1. Open `/pripomienky/register/23201`. 2. **Pass:** the breadcrumb contains exactly one
  "Reminder register" segment (a link to `/pripomienky/register`), followed by the reminder's segment.
- **Root cause guess:** same decision as S5: a framework view cannot know whether the host's nav lists its parent.
- **Suggested fix:** whatever S5 decides — ideally the shell de-duplicating an extra crumb whose `to` equals the
  last nav-derived crumb's, which fixes both modules at once.

### B4. [framework] A "to" date filter excludes the day it names
- **Status:** fixed 2026-10-04 (S20, framework `4920a5b`; the server compares `<=`, so each filter's `toJSON` sends `to` as local 23:59:59.999; `?to=2026-10-05` lists #23101 and #23001; the overview card count against its drill-down was not verified)
- **Severity:** bug
- **Where:** `/pripomienky/nadchadzajuce` → Filter → *Next occurrence to* (same codec and DTO shape on the register's
  *Next occurrence to* and the history's *Dispatched to*) · `dto/request/reminderFilterParams.ts:69-75`
  (`writeDate`/`readDate` → a calendar day ↔ local midnight), the filter DTOs, which send that `Date` as-is
- **Expected:** "Next occurrence to 2 Oct" includes reminders occurring on 2 Oct — the ordinary reading of a
  date-range end, and what `VDateInput` (a day picker, no time) invites.
- **Actual:** `?to=2026-10-02` returns 1 result (01.10 12:00); Reminder #23001 at 02.10.2026 16:30 is excluded. The
  request carries `"nextOccurrenceTo":"2026-10-01T22:00:00.000Z"` — the *start* of 2 Oct in the browser's zone — so
  the upper bound ends before the named day begins. Picking the date in the dialog sends the same instant (observed
  with 3 Oct → `2026-10-02T22:00:00.000Z`), so this is not only a URL-codec artefact. The overview's due-soon
  drill-down builds its `to` through the same codec and inherits it (the source comment there already admits "the two
  can still differ by a few rows").
- **Evidence:** screenshot `screenshots/pripomienky-nadchadzajuce--to-filter.png` ("1 result found"); request body
  of `POST /reminder-dashboard/upcoming` after applying the filter.
- **Repro:** 1. Open `/pripomienky/nadchadzajuce?to=2026-10-02`. 2. Count rows (1) and compare with the unfiltered
  list (Reminder #23001 is at 02.10.2026 16:30).
- **Verify:** 1. Open `/pripomienky/nadchadzajuce?to=2026-10-02`. 2. **Pass:** "2 results found", and the Reminder
  #23001 row (02.10.2026 16:30) is listed. 3. `/pripomienky/historia?to=<a dispatch's own day>` still includes that
  day's rows.
- **Root cause guess:** date-only filter bounds are serialized as local-midnight instants and the server compares
  instants; nothing moves the upper bound to the end of the day.
- **Suggested fix:** send the upper bound as the start of the *next* local day (and ask the server to treat it as
  exclusive), or as 23:59:59.999 local. Decide once for all three views' codecs. Check what the server's comparison is
  (`<` or `<=`) before choosing.

### B5. [framework] Dispatch history renders a raw i18n key for skip reasons the client does not know
- **Status:** fixed 2026-10-04 (S21, framework `60c85f0`; `SkipReason` mirrors the server's eight members, unknown values fall back to `skipReasonUnknown`; the fallback itself was read from source only)
- **Severity:** bug
- **Where:** `/pripomienky/historia` → 27.09.2026 Skipped row → Outcome caption · `dto/enum/SkipReason.ts`,
  `_locales/remindersDashboard.{en,sk}.ts` (`skipReason.*`), `ReminderDispatchHistoryView.vue:137-142`
- **Expected:** a readable reason, or at least a neutral fallback — never a key (CLAUDE.md localization rule).
- **Actual:** "reminderDashboard.skipReason.QuietHours". The client enum and both locales know four reasons
  (`NoRecipients`, `OptedOut`, `Dismissed`, `Snoozed`); the server's `SkipReason`
  (`framework/Sydowwe.Reminders/domain/enum/SkipReason.cs`) has eight — also `AlreadyDispatched`, `QuietHours`,
  `Cancelled`, `Other`. The server marks three of those "reserved — never written by the current scanner", but
  `Other` ("any other deliberate skip") is live, and the seed row proves the column can carry any of them.
- **Evidence:** screenshot `screenshots/pripomienky-historia.png` (third row); snapshot `generic:
  reminderDashboard.skipReason.QuietHours`.
- **Repro:** 1. Open `/pripomienky/historia`. 2. The 27.09.2026 10:00 row.
- **Verify:** 1. Open `/pripomienky/historia`. 2. **Pass:** the 27.09 row's caption is a sentence (e.g. "Quiet hours"),
  and `document.querySelector('main').innerText` contains no `reminderDashboard.` substring.
- **Suggested fix:** add the four members to the enum and both locales, and render an unknown value through a
  generic fallback key rather than `$t` on an unchecked key.

### B6. [framework] Dispatch history's read-only notice is crushed to a 16 px sliver
- **Status:** fixed 2026-10-04 (S18, framework `7c048c2`; alert is `flex-0-0` because `VAlert` declares `flex: 1 1 0%`, measured 44/44, table fills the rest, footer flush; the e2e test is real)
- **Severity:** bug
- **Where:** `/pripomienky/historia` → the info `VAlert` above the table · `ReminderDispatchHistoryView.vue:2-5`
  (`VContainer class="d-flex flex-column h-100"`) and `:79-85`
- **Expected:** the notice is there to be read — it explains why nothing in the ledger can be edited and why a
  "Corrected" row exists (source comment on the alert; R8/R2 era copy).
- **Actual:** the alert is `clientHeight` 16 of `scrollHeight` 44, `overflow: hidden`, `flex-shrink: 1`. On screen
  it is a thin tinted bar with the top of its icon; the sentence is not visible at 1440×900 even with 7 rows.
- **Evidence:** screenshot `screenshots/pripomienky-historia.png` (bar under the heading); `eval` of `main .v-alert`
  heights.
- **Repro:** 1. Viewport 1440×900. 2. Open `/pripomienky/historia`.
- **Verify:** 1. Viewport 1440×900, open `/pripomienky/historia`. 2. **Pass:** `main .v-alert` has
  `scrollHeight <= clientHeight` and its sentence is visible above the table.
- **Root cause guess:** flex-shrink in a height-bounded flex column — same family as X1 and `scheduler/B5`, different
  container (this one is `h-100` so the table can fill; only the non-table children need `flex-shrink-0`).
- **Suggested fix:** `class="mb-3 flex-shrink-0"` on the alert (and the result announcer row, to be safe).

### A1. [framework] Row actions on the register and Upcoming all share one accessible name
- **Status:** fixed 2026-10-04 (S22, framework `dcd6b11`; `reminderLabel(row)` = `{subjectType} #{subjectId}` names every row action; the four Pause buttons have four distinct names; the e2e tests are real)
- **Severity:** a11y
- **Where:** `/pripomienky/register` → Actions column · `ReminderDefinitionsView.vue:127` (`kindOf(id)`),
  `component/ReminderActionButtons.vue` (same `kind` naming); `/pripomienky/nadchadzajuce` → history button,
  `ReminderUpcomingView.vue:172` ("Show dispatch history of reminder PersonalReminder" ×4)
- **Expected:** the source comment's own intent: "an icon-only button's accessible name has to name the reminder it
  acts on — otherwise every row announces the same word".
- **Actual:** names are built from `kind` alone. Every seeded reminder is `PersonalReminder`, so six rows expose
  "Show detail of reminder PersonalReminder" ×6, "Pause reminder PersonalReminder" ×4, "Cancel reminder
  PersonalReminder" ×5. A screen-reader user tabbing the Actions column cannot tell rows apart, and a
  `getByRole('button', { name })` locator cannot address a single row. `kind` is a type, not an identity — the
  realistic register (many rows of one module's one kind) always collides.
- **Evidence:** register snapshot (`.playwright-cli/ra-register.yml`, not kept) — `button "Pause reminder
  PersonalReminder"` on rows 23301, 23201, 23202, 23203.
- **Repro:** 1. Open `/pripomienky/register`. 2. `playwright-cli find "Pause reminder"` → four identical matches.
- **Verify:** 1. Open `/pripomienky/register`. 2. **Pass:** `getByRole('button', { name: /Pause reminder/ })`
  resolves to four buttons with **four different** names, each carrying the row's subject (e.g. "Reminder #23001").
- **Suggested fix:** name by the Subject cell's text (`{subjectType} #{subjectId}`), optionally plus kind. Same
  helper in `ReminderActionButtons`, the eye button, and the upcoming view's history button.

### A2. [framework] Row-selection checkboxes have no accessible name
- **Status:** fixed 2026-10-04 (S25, framework `e46b50f`; `DataTable` overrides both select slots, new `itemLabel` prop, register passes `reminderLabel`; "Select all rows" / "Select Reminder #23001"; shift-click range selection and other apps' tables not verified)
- **Severity:** a11y
- **Where:** `/pripomienky/register` → select column (header and every row) · `BasicTable` `showSelect`
  (`_common/component/dataTable/BasicTable.vue:15`) — framework-wide table component
- **Expected:** every control nameable (template rule; WCAG 4.1.2). The bulk bar next to it is carefully named
  ("Pause 1 reminder"), so the checkbox that drives it is the gap.
- **Actual:** snapshot shows bare `checkbox` for the select-all header and all six rows — no name, no label.
- **Evidence:** register snapshot with a row selected (`.playwright-cli/ra-bulk.yml`): `columnheader > checkbox
  [ref=f6e213]`, `cell > checkbox` per row.
- **Repro:** 1. Open `/pripomienky/register`. 2. `playwright-cli snapshot` → select column.
- **Verify:** 1. Open `/pripomienky/register`. 2. **Pass:** the header checkbox has a name such as "Select all" and
  `getByRole('checkbox', { name: /Reminder #23001/ })` resolves to exactly one row checkbox.
- **Root cause guess:** Vuetify's `VDataTable` select column renders unlabeled `VCheckboxBtn`s; `BasicTable` does not
  override `header.data-table-select` / `item.data-table-select`. Every `showSelect` table in every app inherits it.
- **Suggested fix:** override both slots in `BasicTable` with an `aria-label` (row label from a caller-supplied
  `itemLabel` function, falling back to the row id).

### A3. [framework] Every filter chip's remove button is named "Close"
- **Status:** fixed 2026-10-04 (S26, framework `67d4a72`; `closeLabel` from the new `general.removeFilter`, read "Remove filter: Kind: Personal" on `/pripomienky/moje`; the `?status=Paused` admin case was not driven)
- **Severity:** a11y
- **Where:** `/pripomienky/register?status=Paused` → chip "Paused" → its × · `_common/component/FilterPanel.vue`
  (framework-wide; the upcoming and dispatch-history views mount the same panel)
- **Expected:** a remove control says what it removes ("Remove filter: Paused").
- **Actual:** `generic "Paused" > button "Close"`. With two chips there are two identical "Close" buttons, and "Close"
  reads as closing a dialog. Noted-but-unfiled by the scheduler unit (`_submodule/_fix-queue.md`, *Re-grades*, first
  pass): "every `FilterPanel` chip's remove button is named just 'Close'. Whichever unit meets them next can file them."
- **Evidence:** snapshot after applying the Paused filter: `button "Close" [ref=f1e642]` inside the chip.
- **Repro:** 1. Open `/pripomienky/register?status=Paused`. 2. `playwright-cli find "Close"`.
- **Verify:** 1. Open `/pripomienky/register?status=Paused`. 2. **Pass:** the chip's button is named "Remove filter:
  Paused" (or similar, carrying the chip label); no `button "Close"` remains outside a dialog.
- **Suggested fix:** `VChip`'s `closeLabel` prop, from a framework key taking `{ label }`.

### A4. [framework] Export menu: the open list joins the button's name and its items have no role
- **Status:** fixed 2026-10-04 (S27, framework `67d4a72`; the join came from `aria-owns` on the activator, so an explicit `aria-label` plus `role="menu"` / `role="menuitem"`; verified on `/activity-history`, the admin grids and Enter-to-download not driven)
- **Severity:** a11y
- **Where:** `/pripomienky/nadchadzajuce` → Export · `_common/component/ExportMenu.vue` (framework-wide; the dispatch
  history mounts the same component)
- **Expected:** a menu button keeps its name when open, and each format is a `menuitem` (or button) reachable by
  role. Noted-but-unfiled by the scheduler unit ("`ExportMenu`'s open menu joins the activator's accessible name").
- **Actual:** while open, the snapshot shows `button "Export Excel (.xlsx) CSV (.csv)" [expanded]` with a `list` of
  two `listitem`s *inside* it. Neither format has a role or a name of its own; the only working locator was
  `getByText('CSV (.csv)')`.
- **Evidence:** `playwright-cli find --regex "Excel|CSV|Export"` after clicking Export; the CSV click produced
  `POST /reminder-dashboard/upcoming/export?format=csv` → 200.
- **Repro:** 1. Open `/pripomienky/nadchadzajuce`. 2. Click Export. 3. Snapshot.
- **Verify:** 1. Open `/pripomienky/nadchadzajuce`, click Export. 2. **Pass:** the button is still named "Export";
  `getByRole('menuitem', { name: 'CSV (.csv)' })` (or `button`) resolves and triggers the export.
- **Root cause guess:** the menu content renders inside the activator (not attached/teleported), and its items are
  `VListItem`s without `link`/`role`.
- **Suggested fix:** render the `VMenu` content outside the activator and give the items `role="menuitem"` (Vuetify
  does this when the list is a proper `VList` inside `VMenu`).

### P1. [framework] Register and Upcoming default sorts get a tie-breaker pushed, so the URL is always rewritten and a column shows a "2"
- **Status:** fixed 2026-10-04 (S23, framework `5d03e01`; URL half only: a bare `/pripomienky/register` and `/nadchadzajuce` keep `location.search === ''`. The "no rank badge" half is won't-fix by owner decision: the "2" now reports the view's real, declared order, and hiding it would be a `BasicTable` change in every app)
- **Severity:** polish
- **Where:** `/pripomienky/register` → header · `ReminderDefinitionsView.vue:181` (`defaultSortBy`);
  `/pripomienky/nadchadzajuce` → header ("Kind 2", URL `sortBy=nextOccurrenceAt:asc,kind:asc`) ·
  `ReminderUpcomingView.vue:224`; `BasicTable.vue:198` (the push). The dispatch history is unaffected — its default
  (`dispatchedAt desc`) is its first column, and `?reminderId=23201` arrived without a rewrite.
- **Expected:** the default state is the default URL; a column the user never sorted does not display a sort rank.
- **Actual:** `defaultSortBy` is `[nextOccurrenceAt asc]`; `BasicTable` appends its first column (`ownerModule asc`),
  so state ≠ default on every mount. A bare `/pripomienky/register` is rewritten to
  `…&sortBy=nextOccurrenceAt:asc,ownerModule:asc`, and the Owner module header shows an up-arrow and a "2" badge.
  Identical to `scheduler/P1` (`_submodule/_fix-queue.md` S3), in another module.
- **Evidence:** screenshot `screenshots/pripomienky-register.png` (header); URL after `goto`; request body
  `"sortBy":[{"key":"nextOccurrenceAt"…},{"key":"ownerModule"…}]`.
- **Repro:** 1. Open `/pripomienky/register`. 2. Read the URL and the Owner module header.
- **Verify:** 1. Open `/pripomienky/register`. 2. **Pass:** either the URL stays bare / carries only the default, or
  the default itself is `nextOccurrenceAt:asc,ownerModule:asc` — and the Owner module header carries no rank badge
  on a fresh load. 3. Same on `/pripomienky/nadchadzajuce` for the Kind header.
- **Root cause guess:** same as `scheduler/P1` — `defaultSortBy` omits the tie-breaker `BasicTable` will add.
- **Suggested fix:** `defaultSortBy: [new VSortItem('nextOccurrenceAt', 'asc'), new VSortItem('ownerModule', 'asc')]`.
  Check the other three tables' defaults against their first column at the same time.

### P2. [framework] Detail's 404 (and the overview's load failure) is reported twice — on the page and in an error snackbar
- **Status:** fixed 2026-10-04 (S7, framework `62451f7`; `_silent: true` on the detail `fetchById` and `fetchReminderOverview`; source and typecheck only, the routed 404 / 503 paths were not driven in the browser)
- **Severity:** polish
- **Where:** `/pripomienky/register/999999` (and `/23001`, a portal id) · `ReminderDefinitionDetailView.vue:361-380`
  (`fetchById` without `_silent`). Same on `/pripomienky/prehlad` when the overview request fails: the page says
  "Failed to load the overview." / "Refresh failed — showing older data." and the snackbar says "The service is
  temporarily unavailable…" (`ReminderOverviewView.vue:274-294`, `fetchReminderOverview` not `_silent`). On a page
  built to auto-refresh every 5 min, an outage then snackbars on every poll and every focus.
- **Expected:** R2 made the page itself say "not found"; a second, transient error toast for the same fact is noise.
  The same defect is queued for the scheduler as `scheduler/P3` (S7).
- **Actual:** card "This reminder does not exist or has been removed." **and** the interceptor's snackbar "The
  requested item was not found." `GET /reminder-definition/999999` → 404.
- **Evidence:** screenshots `screenshots/pripomienky-register-id--not-found.png`,
  `pripomienky-prehlad--refresh-failed.png`, `pripomienky-prehlad--load-failed.png`; `eval` of `.v-snackbar__content`
  (overview failures produced with `playwright-cli route "**/api/reminder-dashboard/overview" --status 503`).
- **Repro:** 1. Open `/pripomienky/register/999999`.
- **Verify:** 1. Open `/pripomienky/register/999999`. 2. **Pass:** the not-found card renders and no
  `.v-snackbar__content` appears within 2 s. 3. On `/pripomienky/prehlad`, route the overview to 503 and click
  *Refresh*: the "Refresh failed" line appears and no snackbar does.
- **Suggested fix:** `_silent: true` on both requests (the idiom S7 uses).

### P3. [framework] The detail page is titled by the reminder's kind, so every reminder has the same heading
- **Status:** fixed 2026-10-04 (S22, framework `dcd6b11`; `h1` and last crumb are `reminderLabel`, kind kept as a caption; `/23201` reads "Reminder #23001", `/23202` "Reminder #23002")
- **Severity:** polish
- **Where:** `/pripomienky/register/:id` → `h1` and the last breadcrumb · `ReminderDefinitionDetailView.vue:21, 386`
- **Expected:** a detail page's heading identifies the record. The register names a row by its Subject
  ("Reminder #23001"); the payload carries a human title ("Call the dentist").
- **Actual:** all six seeded reminders render `h1` "PersonalReminder" and end the breadcrumb in "PersonalReminder".
  Two tabs open on two reminders are indistinguishable by heading, title or crumb.
- **Evidence:** `eval` of `main h1` on 23201, 23203, 23204, 23205, 23301 — "PersonalReminder" each time.
- **Repro:** 1. Open `/pripomienky/register/23201`, then `/23202`. 2. Compare the headings.
- **Verify:** 1. Open `/pripomienky/register/23201` and `/23202`. 2. **Pass:** the two `h1`s differ (e.g.
  "Reminder #23001" vs "Reminder #23002", kind kept as a caption).
- **Suggested fix:** `{subjectType} #{subjectId}` as the heading and crumb, kind beside it. Same identity string as A1.

### P4. [framework] "With lead time" is shown for a reminder whose only offset is the deadline itself
- **Status:** fixed 2026-10-04 (S19, framework `f103416`; `hasLeadOffsets` counts only `offsetMinutes < 0`; the chip shows on #23101 and #23001, not #23002)
- **Severity:** polish
- **Where:** `/pripomienky/nadchadzajuce` → Reminder #23002 → Schedule type chip · `UpcomingReminderGridResponse.ts:76`
  (`countOf(json.leadOffsets) > 0`)
- **Expected:** the chip's own hint: "This one-shot reminder also alerts at the given lead time **before** the
  deadline." An offset of 0 is the deadline (the detail page labels it "right at the deadline").
- **Actual:** #23002 has `leadOffsets: [{ offsetMinutes: 0 }]` and shows the chip, telling the admin about an early
  alert that does not exist. #23101 (−60) and #23001 (−30, 0) are correct.
- **Evidence:** upcoming snapshot row "Reminder #23002" → `generic "This one-shot reminder also alerts…": With lead
  time`; response body `leadOffsets` for id 23202; detail `/pripomienky/register/23202` → *Lead times* "right at the deadline" only.
- **Repro:** 1. Open `/pripomienky/nadchadzajuce`. 2. Row "Reminder #23002".
- **Verify:** 1. Open `/pripomienky/nadchadzajuce`. 2. **Pass:** "With lead time" appears on the #23101 and #23001
  rows and **not** on #23002.
- **Suggested fix:** `leadOffsets.some(o => o.offsetMinutes < 0)`.

### P5. [framework] Upcoming rows cannot open the reminder they list
- **Status:** fixed 2026-10-04 (S22, framework `dcd6b11`; the upcoming caption is a `RouterLink` to the definition; #23001 lands on `/pripomienky/register/23201`)
- **Severity:** polish
- **Where:** `/pripomienky/nadchadzajuce` → Kind cell (`Reminder #23001` caption) · `ReminderUpcomingView.vue:107-117`
- **Expected:** consistency with the sibling register, whose Subject cell links to the detail; the row `id` here is
  the same definition id (the history button already uses it).
- **Actual:** the kind/subject cell is plain text and the only row action is dispatch history. To inspect an upcoming
  reminder's schedule or occurrence preview, the admin must go to the register and find it again.
- **Evidence:** upcoming snapshot — `cell "PersonalReminder Reminder #23001"` has no `link`; the register's
  equivalent is `link "Reminder #23001"` → `/pripomienky/register/23201`.
- **Repro:** 1. Open `/pripomienky/nadchadzajuce`. 2. Try to open Reminder #23001.
- **Verify:** 1. Open `/pripomienky/nadchadzajuce`. 2. **Pass:** `getByRole('link', { name: /Reminder #23001/ })`
  resolves and navigates to `/pripomienky/register/23201`.
- **Suggested fix:** wrap the caption in the same `RouterLink` the register uses.

### P6. [framework] Dispatch history has an empty, unnamed last column
- **Status:** fixed 2026-10-04 (S24, framework `113fcaf`; `:showActions="false"`, the header row is exactly the five named columns)
- **Severity:** polish
- **Where:** `/pripomienky/historia` → rightmost column · `ReminderDispatchHistoryView.vue:92-105` (`BasicTable` with
  `hasEdit/hasDelete/hasCreate` false and no `#additionalActions`)
- **Expected:** no actions → no actions column. The register and Upcoming at least name theirs ("Actions", sr-only).
- **Actual:** a 42 px column whose header has no text and no name, and whose seven cells are empty.
- **Evidence:** screenshot `screenshots/pripomienky-historia.png` (right edge); `eval` — last `th` text `""`,
  `aria-label` null, every last `td` empty.
- **Repro:** 1. Open `/pripomienky/historia`. 2. Look at the right edge of the table.
- **Verify:** 1. Open `/pripomienky/historia`. 2. **Pass:** the header row has exactly five column headers (Dispatched,
  Reminder ID, Outcome, Notification type, Recipients) and no empty trailing column.
- **Suggested fix:** check `BasicTable` for a prop that suppresses the actions column when there are no actions; if
  there is none, that is the framework-level fix (it would apply to every read-only table).

### P7. [framework] "Corrects #23501" points at a dispatch id the table never shows
- **Status:** fixed 2026-10-04 (S24, framework `113fcaf`; the chip reads "Corrects the {time} record" and the corrected row gets a "Corrected by the {time} record" chip; a correction split across a page boundary was not verified, only the filter case)
- **Severity:** polish
- **Where:** `/pripomienky/historia` → 25.09.2026 21:00 row → chip "Corrects #23501" · `ReminderDispatchHistoryView.vue:127-135`
- **Expected:** the corrected record is identifiable from the screen — that is the chip's whole job.
- **Actual:** #23501 is the dispatch row's own id. No column shows dispatch ids, and the neighbouring Reminder ID
  column uses the same `#n` form for a *different* kind of id (definition ids, #23205). An admin will read "#23501" as
  a reminder id and not find it. (It only happens to be findable by hovering the failed row's cause, whose `title` is
  the correlation id `e2e-dispatch-23501` — a seed coincidence.)
- **Evidence:** screenshot `screenshots/pripomienky-historia.png` (row 5); snapshot `generic "This record is a
  correction that replaces an earlier record.": "Corrects #23501"`.
- **Repro:** 1. Open `/pripomienky/historia`. 2. Try to find record #23501 on the page.
- **Verify:** 1. Open `/pripomienky/historia`. 2. **Pass:** the corrected row is identifiable — e.g. the chip reads
  "Corrects the 25.09.2026 20:00 dispatch", or the corrected row is marked/linked, or dispatch ids are shown.
- **Suggested fix:** label by the corrected row's `dispatchedAt` if it is in the response, or mark the corrected row
  ("Corrected by a later record"); a dispatch-id column is the fallback.

### P8. [framework] Date-only filter chips print a midnight time
- **Status:** fixed 2026-10-04 (S20, framework `4920a5b`; all eight date chips use `formatToDate`; "Next occurrence to: 05.10.2026")
- **Severity:** polish
- **Where:** filter chips on all three list views — "Next occurrence to: 03.10.2026 0:00:00", "Dispatched from:
  24.09.2026 0:00:00" · `chipFormatters` in `ReminderDefinitionsView.vue:281-288`, `ReminderUpcomingView.vue:265-272`,
  `ReminderDispatchHistoryView.vue:248-261` (all call `formatInstant`)
- **Expected:** a day picked in a day picker is echoed as a day. The time also invites the reading that the bound is
  an instant at 00:00 — which is exactly the misunderstanding behind B4.
- **Actual:** every date chip appends ` 0:00:00`.
- **Evidence:** `eval` of the chips after `?to=2026-10-03` (upcoming) and `?outcome=Sent&from=2026-09-24` (history).
- **Repro:** 1. Open `/pripomienky/historia?from=2026-09-24`. 2. Read the chip.
- **Verify:** 1. Open `/pripomienky/historia?from=2026-09-24`. 2. **Pass:** the chip reads "Dispatched from:
  24.09.2026" (in whatever date shape S11 settles on), with no time.
- **Suggested fix:** `formatToDate` in the six date chip formatters. The instant format itself (`DD.MM.YYYY H:mm:ss`
  in EN, unpadded hour) is `DateTimeHelper`'s `sk` pin — `_submodule/_fix-queue.md` S11 — and is not re-filed here.

---

## Opportunities

### O1. [framework] Reminders are named by type and id everywhere, while the row already carries a human title
- **Status:** fixed 2026-10-05 (server `displayLabel` from an owner-registered `IReminderLabelResolver`, resolved at read time; `reminderLabel` prefers it and keeps the subject as a caption; also lands §S6 (a). Server tests and the O1 e2e tests pass; verified live on all six screens. See `_fix-queue-log.md` → *Closed opportunities*)
- **Severity:** opportunity
- **Where:** register Subject, Upcoming Kind cell, detail `h1`, overview failure rows, dispatch history Reminder ID
- **What exists:** every grid and detail response carries `payloadJson`, and for this app's Portal reminders it holds
  `"title": "Call the dentist"` / `"Pay the rent"` / `"Post the parcel"`. The screens show "PersonalReminder" and
  "Reminder #23001" instead. With six reminders of one kind, an admin cannot tell which one they are looking at
  without opening the payload (A1, P3 are the accessibility face of the same gap).
- **What it could feed:** a display label per row. The payload is opaque to the framework on purpose (README: no PII,
  `RecipientChips` shows bare ids), so this is not "parse the payload". It is a framework hook: an optional
  per-`(ownerModule, kind)` label resolver the host registers, the way `notificationTypeMeta` works, falling back to
  today's `{subjectType} #{subjectId}`. Or a server-side `displayLabel` the owning module fills in at registration.
  Either is a product decision, and the resolver must decide whether a title counts as PII in another host.

## Observed, not filed

- **A monthly reminder's local time moves with DST.** Reminder #23003 (Monthly, anchor `2026-10-12T08:00Z`)
  previews 10:00 in October, 9:00 November–March and 10:00 again from April (browser Europe/… UTC+2/+1). The detail
  and preview render the server's instants faithfully. Whether a `RecurringInterval` should keep wall-clock time in
  the owner's zone, as someone paying rent "on the 12th at 10:00" would expect, is a server rule
  (`Sydowwe.Reminders`), and cron is documented as UTC on purpose. Recorded for the backend owner, not as a client
  defect.
- **The "Effective failures only" checkbox explains itself only through `title`** (unreachable by keyboard or touch,
  the same shape as `scheduler/B2`). Seen in source and the filter dialog; the hint text itself was not read in the
  browser, so it is not filed.

---

## Unverified

### U1. [framework] Overview's 5-minute poll, its pause while hidden, and the ticking "Updated N minutes ago"
- **Status:** open (queued under `_fix-queue.md` → *Needs verification*; needs the headed two-tab run, together with `scheduler/U2`)
- **Severity:** unverified
- **Where:** `/pripomienky/prehlad` · `ReminderOverviewView.vue:321-371` (poll, visibility handling),
  `:298-307` (freshness label)
- **Claim (R9):** refreshes on a 5-minute poll that stops while the tab is hidden, and re-fetches on return; the
  freshness label ticks without a reload.
- **Observed:** the focus path only — throttled within 30 s, fires after 32 s. The poll interval, the hidden-tab
  pause and a minute tick were not observed: the session was headless with one tab, and waiting 5+ minutes per
  check was not spent.
- **What would settle it:** a headed browser, `/pripomienky/prehlad` left visible for 6 min (expect 1 extra
  `GET …/overview` and the label to read "Updated 5 minutes ago"), then a second tab in front for 6 min (expect 0
  requests), then back (expect 1). Same shape as `scheduler/U2`.

### U2. [framework] The overview's failure card with more failures than it renders
- **Status:** verified 2026-10-05 (mocked overview, 40 failures / 20 rows: headline 40, 8 rows, "Showing 8 of 40", link to `?needsAttention=true`; proves the client logic only, not that the server's count equals the history list's)
- **Severity:** unverified
- **Where:** `/pripomienky/prehlad` → *Failures needing attention* · `component/OverviewFailureList.vue`
- **Claim (R9 problem 3):** the card caps what it renders and says "showing N of M" honestly, linking through for the
  rest; the headline number is the true total (`failedNeedingAttention`), not `items.length`.
- **Observed:** with one failure the card shows 1 row, count 1, and the "View in dispatch history" link (→ 1 result).
  The cap and the "N of M" line cannot appear.
- **What would settle it:** a fixture with more uncorrected failed dispatches than the card's cap (read the cap in
  `OverviewFailureList.vue`; ≥ 11 is safe), then compare the headline, the rendered rows, the "N of M" line and the
  history's `?needsAttention=true` count.

