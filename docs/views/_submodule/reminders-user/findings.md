# reminders-user — findings

> Pass: inventory + mutation · captured 2026-10-01 (both rounds) · commit `4d890646` (framework `b1b82a1`)

**Tally (as captured):** blocker 1 · bug 6 · a11y 4 · polish 7 · opportunity 1 · unverified 2  (21 entries: X1, B1–B6, A1–A4,
P1–P7, O1, U2–U3. U1 became B6. U2 is `stale`, settled in round 2, and stays listed so the ids do not move.) The
current state is in the status line below.

**Status (2026-10-05):** 18 fixed or fixed-in-part (X1, B1, B2, B3, B4, B5, B6, A1, A2, A3, A4, P1, P2, P3, P4, P5, P6,
P7; A2's *Snooze* half and P2's badge half are won't-fix by owner decision, and P3 took the interim instead of waiting
on §S2) · O1 built (the chip; its filter and *Undo* are not) · U2 stale · U3 settled as not a defect. B6 and O1 still need a live
check once the API is restarted. Fix batches are in
`prompts/view-docs/units/_submodule/_fix-queue-log.md`.

**Cleanup (round 2):** the pass wrote to the database for real. Through the real API: one snooze marker (23202, the
05.10 occurrence snoozed to 07:27:20Z), which the scanner delivered as notification **22103** at 07:27:58Z. Also two
dismiss markers on 23201 (the second a duplicate), plus three rejected probes (two 400s, one 404) that wrote nothing.
The UI's own two attempts 404'd (X1) and wrote nothing. Every other action was a mocked response. All of it was undone by
`POST /api/test/seed` (200, fixture `e2e-v4`, **`seedDateUtc` now `2026-10-01`**, so the seed's relative dates
moved by a day). The reseed signed the session out, as expected: it invalidates `e2e/.state/auth-*.json` and
`.playwright-cli/auth.json`, so the next agent must sign in through the form, not `state-load`.

Every finding is **[framework]**: the view, its components and the endpoint all live in
`src/_common/modules/reminders/` or the framework's shared components. Fixes are a `vue_framework` commit plus a
pointer bump; B1/B4/B6 also need the framework's reminder service (`Sydowwe.Reminders`). Where a finding is a new
instance of a batch already in `prompts/view-docs/units/_submodule/_fix-queue.md`, it says so — triage should fold it
into that batch rather than open a new one.

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-10-01 | `4d890646` / fw `b1b82a1` | initial inventory pass |
| 2 | 2026-10-01 | `4d890646` / fw `b1b82a1` | mutation pass: snooze and dismiss confirmed for real, then each server outcome replayed with the correct wire keys and the client's 204/400/500 paths mocked. New: **X1** (neither action has ever reached the server: wrong JSON keys → 404 every time) and P7. U1 → **B6** (confirmed: the row stays, and a repeat dismiss is accepted). U2 settled → `stale`. B2 upgraded from source-read to observed (a snooze delivered 4 days early). B1 gained evidence that the server already renders a per-reminder text. A1 widened: every snooze *after a confirmed or failed action* drops focus too, not just the first. Working as built, no finding: the reactive `canAct` disable, the 400 / 500 handling, the success snackbar and the heading-focus fallback, and the custom-time validation |

## Intent sources, checked

| claim (source) | observed |
| --- | --- |
| Dismiss copy states it cannot be undone (R10 §1) | holds — "This cannot be undone from here." |
| Dialog closes before the row drops; pager refetches instead of lying (R10 §2–3) | holds mechanically (round 2, success mocked: dialog closes, row drops, `reload()` fires once). But the refetch returned the row again (**B6**). Since §S7 (2026-10-05) the row is kept and marked instead, and the refetch agrees. The action now reaches the server (**X1**, fixed 2026-10-04) |
| Snooze / dismiss reach the server and are recorded (R10, the whole feature) | **failed in round 2**: wrong JSON keys, 404 every time (**X1**). Fixed 2026-10-04 (S28): both now return 204 |
| Presets show their resolved instant; *tomorrow* and *next week* both anchor to 09:00 (R10 §4) | holds — see snooze dialog in inventory. Round 2 found them relative to *now*, not to the occurrence (**B2**); fixed 2026-10-04 (S28), they now count from the occurrence |
| One reset path in the snooze dialog; stale presets explained (R10 §5–6) | holds in source (`SnoozeDialog.vue` open-time watch only; warning alert covers the stale case); staleness not waited out |
| `canAct` uses a reactive clock (R10 §7, README) | holds in source (`useCurrentTime`); no occurrence passed during the pass |
| Icon-only row buttons have an accessible name naming the reminder (R8 §1) | names existed but were identical on every row — **B1**, fixed 2026-10-05 (each names its reminder's title) |
| Actions column has header text (R8 §2) | holds — sr-only "Actions" |
| A polite live region announces the result count (R8 §5) | holds — `status "3 results found"`; but it announced a failed load as "0 results found" — **B5**, fixed 2026-10-04 (S29) |
| No horizontal page scroll at 375 px (R8 §6) | holds |
| Focus lands somewhere sane after a dialog closes (R8 §7) | was only partly met — **A1**, fixed 2026-10-04 (S13) |
| List views' error state deferred to R2/R5 (R2 *Out of scope*, `useReminderTableErrors.ts` comment) | was still deferred — **B5**; taken by S29 on 2026-10-04 |
| Filter/page/sort absent from the URL (README) | stale — all in the URL, survive reload and Back |
| "The module is Slovak-only… do not add an EN locale" (README *Not in scope*) | stale — `reminders.en.ts` / `remindersDashboard.en.ts` exist and the view renders English |
| Slovak plurals (R3) | not checked — EN session; left to the X3 Slovak sweep as the unit prompt says |

---

### X1. Snooze and Dismiss always fail with 404: the client sends the wrong JSON keys, and the UI calls it "no longer available"
- **Status:** fixed 2026-10-04 (S28, framework `4e385e5`; verified live: Snooze and Dismiss both send `reminderDefinitionId` / `occurrenceAt` and get 204. `SnoozeOccurrenceRequest.test.ts` pins the keys. Not verified: a sub-millisecond occurrence would still 400 on the server's exact-match check, which is a backend truncation ask if it shows up)
- **Severity:** blocker
- **Where:** `/pripomienky/moje` → any row's *Snooze* → *Snooze*, and any row's *Dismiss* → *Dismiss delivery*;
  `src/_common/modules/reminders/dto/request/SnoozeOccurrenceRequest.ts`, `DismissOccurrenceRequest.ts` (fields
  `reminderId`, `occurrenceInstant`); server `Sydowwe.Reminders/application/dto/dashboard/{Snooze,Dismiss}ReminderOccurrenceRequest.cs`
  (fields `ReminderDefinitionId`, `OccurrenceAt`)
- **Expected:** confirming either dialog records the action. These two actions are the page's only purpose (subtitle:
  "You can snooze or dismiss a single occurrence"; R10).
- **Actual:** both POSTs return **404**. The body is
  `{"reminderId":23201,"occurrenceInstant":"2026-10-02T14:30:00.000Z","snoozeUntil":"2026-10-01T08:23:57.315Z"}`.
  The server binds `ReminderDefinitionId`/`OccurrenceAt` and ignores the two unknown keys, so the id is `0`.
  `ReminderOccurrenceActionGuard` finds no recipient row for definition 0 and answers `NotFound`. The client then
  takes its "not yours / gone" branch (`handleActionError`, 404): info snackbar **"This reminder is no longer available
  to you."**, the row is dropped, and focus parks on the heading. The follow-up `reload()` brings the row straight
  back. The user sees their own reminder declared unavailable while it stays in the list. The requests are `_silent`,
  so no error snackbar contradicts it. Nothing is written server-side. With the server's own keys
  (`{"reminderDefinitionId":23202,"occurrenceAt":"2026-10-05T09:00:00Z","snoozeUntil":…}`, sent with the app's own
  `API` instance from the same page) the same endpoint answers **204**, so the server side works.
- **Evidence:** requests `POST /api/reminder-dashboard/snooze → 404` and `POST /api/reminder-dashboard/dismiss →
  404`, each followed by a `my-upcoming → 200` that still lists the row. Request body above. Console `AxiosError:
  Request failed with status code 404` (`axiosConfig.ts:190`). Snackbar text from eval. Screenshot
  `screenshots/pripomienky-moje--snooze-404.png`. History: the client DTOs date from the module's adoption
  (`192c893`, 2026-08-05) and the server DTOs from the framework move (`a9a33b7`, 2026-08-07). Neither has changed
  since, so these actions have never worked from this screen.
- **Repro:** 1. Sign in as `seed.primaryUser`, open `/pripomienky/moje`. 2. Row 1 → *Snooze* → *Snooze* (default
  preset). 3. Watch the network panel and the snackbar. 4. Same with *Dismiss* → *Dismiss delivery*.
- **Verify:** 1. Open `/pripomienky/moje` as `seed.primaryUser`. 2. Row 1 → *Dismiss* → *Dismiss delivery*. 3. `POST
  /api/reminder-dashboard/dismiss` returns **204**, its request body carries `reminderDefinitionId` and
  `occurrenceAt`, and the snackbar reads "This occurrence will no longer be delivered to you.", not "This reminder is
  no longer available to you." Repeat for *Snooze* (204, success snackbar naming the time). Reseed afterwards.
- **Root cause guess:** contract drift in naming. It is the same family as the dispatch DTO's `occurrenceInstant` vs
  `occurrenceAt` noted in `prompts/_done/_common/reminders/backend/B2-dispatch-row-identity.md`. No test covers the
  wire shape of these two requests.
- **Suggested fix:** rename the two client DTOs' fields to `reminderDefinitionId` / `occurrenceAt` (or add a
  `toJson()` that maps them), and add a unit test asserting the serialized keys. Land it **with** B6: once the actions
  succeed, B6 is what the user sees next.

### B1. The three rows are indistinguishable — nothing says what any reminder is about
- **Status:** fixed 2026-10-05 (landed with `reminders-admin/O1`: `my-upcoming` now carries `displayLabel` from the owner's `IReminderLabelResolver`, and the row's primary text plus both `a11y.*For` labels use it. The Dismiss dialog's *Reminder* row closed §S6 the same day. Verified live: the three rows read their titles, the six buttons carry six names, and *Dismiss* on "Pay the rent" shows "Reminder: Pay the rent" above the occurrence)
- **Severity:** bug
- **Where:** `/pripomienky/moje` → table rows; `MyRemindersView.vue:86-96` (kind cell), `:124-149` (row actions);
  server `Sydowwe.Reminders/application/dto/dashboard/MyUpcomingReminderDto.cs`
- **Expected:** a user deciding whether to snooze or dismiss has to know *which* reminder a row is. The seed's
  three rows are "call the dentist", "file tax return" and "pay rent" (`seed.reminders` keys). The view's own
  subtitle promises "Upcoming reminders you are a recipient of", and R8 §1 asks that each row button name "to which
  reminder" it applies. That is plain user sense.
- **Actual:** every row reads `PersonalReminder | Portal`. The row differs only by date. Both row buttons have the
  same accessible name on all three rows (`Snooze reminder PersonalReminder`, `Dismiss delivery of reminder
  PersonalReminder`), so a screen-reader user hears six buttons naming two things. The Dismiss dialog (P5) doesn't
  say which one either. The response has no field that could tell them apart: `my-upcoming` returns only
  `ownerModule, kind, templateKey, scheduleType, nextOccurrenceAt, id`. `MyUpcomingReminderDto` deliberately omits
  `PayloadJson`, which is where a producer's title would live, as a non-admin data-exposure rule.
- **Evidence:** snapshot rows `cell "PersonalReminder"` ×3, buttons as above; response body of `POST
  /api/reminder-dashboard/my-upcoming` (inventory); screenshot `screenshots/pripomienky-moje.png`.
- **Repro:** 1. Sign in as `seed.primaryUser`. 2. Open `/pripomienky/moje`. 3. Read the Kind and Owner module
  columns, and the accessible names of the row buttons.
- **Verify:** 1. Open `/pripomienky/moje` as `seed.primaryUser`. 2. Each of the three rows shows text that
  distinguishes it from the others, not only the date. 3. `getByRole('button', { name: /^Snooze/ })` resolves to
  three **different** names.
- **Round 2:** the server already renders a recipient-facing text for these rows. When the snooze on 23202
  (`fileTaxReturn`) was delivered, the notification read title "Reminder", body **"File the tax return"**
  (`GET /api/notification/mine`, id 22103, type `PersonalReminder`). The user can read what the reminder is
  about only *after* it fires, never on the page that lets them act on it beforehand. The ask below can reuse that
  render path. It needs no new data source.
- **Root cause guess:** the personal projection has no recipient-safe display field. It is a contract gap in the
  framework's reminder service, not a rendering bug. The client cannot fix it alone.
- **Suggested fix:** escalation. Ask `Sydowwe.Reminders` for a recipient-safe label on the personal row: a
  server-rendered title from `templateKey` in the caller's locale (the way notification text is composed per read,
  `_shell` B1/backend B15), or a producer-supplied `displayTitle` separate from `PayloadJson`. Client half after
  that: render it as the row's primary text and in both `a11y.*For` labels instead of `kind`.

### B2. Snooze presets are relative to *now*, so the default moves a future occurrence *earlier*
- **Status:** fixed 2026-10-04 (S28, framework `4e385e5`; client half. Presets now count from the occurrence and the custom picker is floored at it; verified live: 17:30 same day, 07.10 9:00, 13.10 16:30 for a 06.10 16:30 row. Server half closed 2026-10-05 with §S7 (c): a `snoozeUntil` at or before the occurrence is now a 400, so the client's floor is the contract)
- **Severity:** bug
- **Where:** `/pripomienky/moje` → row *Snooze* → *Snooze reminder* dialog; `SnoozeDialog.vue:96` (default
  `in1Hour`), `:104-121` (presets); server `SnoozeReminderOccurrenceEndpoint.cs:50` (only checks
  `SnoozeUntil > now`)
- **Expected:** "snooze" means later. R10 calls these presets "remind me later". Every row on this page is a
  *future* occurrence, so a snooze target should come after the occurrence it replaces, or at least the dialog
  should say plainly that it moves the reminder earlier.
- **Actual:** on the row due **02.10.2026 16:30:00** (opened 01.10.2026 ~00:54), the presets read "In 1 hour —
  01.10.2026 1:54:23" (pre-selected), "Tomorrow morning (9:00) — 02.10.2026 9:00:00" and "In a week — 08.10.2026
  9:00:00". Two of three, including the default, are *before* the occurrence. The alert then confirms "You'll be
  reminded 01.10.2026 1:54:23", about 38 h early. On the row due 12.10.2026 all three presets are earlier. The
  server accepts any future instant (source), so confirming the default would deliver the reminder early.
- **Evidence:** snapshot of `dialog "Snooze reminder"` (radio names above) · `screenshots/pripomienky-moje--snooze.png`
  · server check read at `SnoozeReminderOccurrenceEndpoint.cs:50-51`.
  **Round 2, observed:** the UI cannot snooze at all (X1), so the delivery was exercised with the server's keys from
  the same page. 23202's occurrence is **05.10.2026 11:00**; it was snoozed to 01.10.2026 07:27:20Z → **204**. The scanner
  delivered notification 22103 ("Reminder / File the tax return") at **07:27:58Z on 01.10**, four days before the
  occurrence. The bell went to 4 unread. Per `ReminderScanJobHandler.ApplyOccurrenceMarkersAsync`, the original
  05.10 send is then skipped for this recipient (`SkipReason.Snoozed`), so a "snooze" to an earlier preset moves the
  reminder earlier for good. The preset dialog repeated the pattern in round 2: "In 1 hour — 01.10.2026 10:23:57" was
  pre-selected for the 02.10 16:30 occurrence. Fixing X1 alone makes this reachable from the default button, so
  B2 should land with X1 or before it.
- **Repro:** 1. `/pripomienky/moje`. 2. Click the first row's *Snooze* button. 3. Compare the *Occurrence* line
  with the three preset instants.
- **Verify:** 1. `/pripomienky/moje`, open *Snooze* on the row whose next occurrence is more than a day away
  (`seed.reminderDefinitions.payRentRecurring`). 2. Either every offered preset instant is later than the
  *Occurrence* instant, or the presets that are earlier are labelled as such ("Remind me earlier…"). The
  pre-selected choice is never earlier than the occurrence.
- **Suggested fix:** anchor the presets to `occurrenceInstant` (+1 h, next day 09:00 after it, +1 week), or drop the
  ones that resolve before it. Whether an *earlier* delivery should be allowed at all is a product/server question,
  so raise it alongside B1's ask.

### B3. "Next occurrence to" excludes the day you pick
- **Status:** fixed 2026-10-04 (S20, framework `4920a5b`; `MyReminderFilter.toJSON` sends the `to` bound as local 23:59:59.999. Verified live: `/pripomienky/moje?to=2026-10-05` keeps the 05.10 16:30 row and the chip reads "05.10.2026")
- **Severity:** bug
- **Where:** `/pripomienky/moje` → *Filter* → *Next occurrence to*; `MyRemindersView.vue:57-61` (VDateInput),
  `reminderFilterParams.ts:115,127` (read/write), server `ReminderDashboardQueries.cs` (`NextOccurrenceAt <= To`)
- **Expected:** a date-only "to" bound includes that date. Picking 10/02/2026 should keep the reminder due
  02.10.2026 16:30.
- **Actual:** the request sends `"nextOccurrenceTo":"2026-10-01T22:00:00.000Z"` (local midnight at the *start* of
  2 Oct), the server compares `<=`, and the result is **0 rows**. The chip gives it away: "Next occurrence to:
  02.10.2026 0:00:00".
- **Evidence:** request body of the filtered `POST /api/reminder-dashboard/my-upcoming` → `{"items":[],"itemsCount":0}`
  · `screenshots/pripomienky-moje--to-filter.png` · live region "0 results found".
- **Repro:** 1. `/pripomienky/moje?page=1&perPage=25&sortBy=nextOccurrenceAt:asc,kind:asc`. 2. *Filter* → *Next
  occurrence to* = `10/02/2026` → *Confirm*.
- **Verify:** 1. Open `/pripomienky/moje?to=<date of seed.reminderDefinitions.callTheDentist's next occurrence,
  YYYY-MM-DD>`. 2. That row is listed, and the chip does not show `0:00:00`.
- **Root cause guess:** the same `writeDate`/`readDate` pair serves `UpcomingReminderFilter` and
  `DispatchHistoryFilter` (`reminderFilterParams.ts:142,169`), so the admin *Upcoming* and *Dispatch history*
  filters (unit 17) very likely share it. One fix covers all three.
- **Suggested fix:** send the end of the chosen local day (`23:59:59.999`) for every `…To` date bound, or the next
  day's midnight with `<`. Show the chip as a date, not an instant.

### B4. A recurring-interval reminder's schedule reads "—"
- **Status:** fixed 2026-10-05 (§S6 (b): `MyUpcomingReminderDto` projects `IntervalPreset` and `Cron`, pinned by `MyUpcomingScheduleTests`. The client already passed both to `ReminderScheduleDisplay`, so no client change was needed beyond correcting `UpcomingReminderGridResponse.ts`'s header. **Verified** after an API restart (no migration): the e2e test `the recurring-interval row states its interval` passes, so the payRentRecurring row reads "Monthly")
- **Severity:** bug
- **Where:** `/pripomienky/moje` → row 3 (`seed.reminderDefinitions.payRentRecurring`) → *Schedule type* cell;
  `MyRemindersView.vue:97-104`, `ReminderScheduleDisplay.vue` (`intervalLabel`)
- **Expected:** the schedule cell says how often it repeats. That is the "is this a one-off or does it repeat?"
  question the column exists to answer.
- **Actual:** repeat icon + "—". The row's `scheduleType` is `RecurringInterval`, but `my-upcoming` does not send
  `intervalPreset`, so `ReminderScheduleDisplay` falls back to its placeholder. The DTO's doc comment
  (`UpcomingReminderGridResponse.ts`) says `MyRemindersView` "renders none of" the missing fields "except
  `cronExpression`". It renders `intervalPreset` too, and that one is always null.
- **Evidence:** snapshot `cell "—"` on the 12.10.2026 row · response row `{"scheduleType":"RecurringInterval",…}` has
  no `intervalPreset` · `screenshots/pripomienky-moje.png`.
- **Repro:** open `/pripomienky/moje` and read row 3's schedule cell.
- **Verify:** open `/pripomienky/moje`. The row whose next occurrence is 12.10.2026 (payRentRecurring) shows an
  interval label (e.g. "Monthly") in the *Schedule type* cell, not "—".
- **Root cause guess:** the same too-narrow personal projection as B1 (`MyUpcomingReminderDto`). A cron row would
  show `—` in a code chip for the same reason.
- **Suggested fix:** add `intervalPreset` and `cron` to the personal projection. Neither is recipient-sensitive. Put
  it in the same ask as B1. Until then, render the schedule-type name ("Recurring") rather than "—".

### B5. A failed load renders as "no reminders" and is announced as "0 results found"
- **Status:** fixed 2026-10-04 (S29, framework `639814a`; verified live with `my-upcoming` routed to 500: "The list could not be loaded." + *Try again*, the live region announces the failure, and *Try again* restores 3 rows after `unroute`. The admin tables got the same state, checked once on `/pripomienky/register`)
- **Severity:** bug
- **Where:** `/pripomienky/moje`; `useReminderTableErrors.ts` (`reportTableLoadError`, deliberately terminal),
  `TableResultAnnouncer.vue`
- **Expected:** a failed request looks different from an empty result and offers a retry (R2's settled pattern for
  the module's two non-table views; the helper's own comment says the table state "is R2's job").
- **Actual:** with `my-upcoming` routed to 500, the interceptor's snackbar "A server error occurred. Please try
  again later." shows for 3 s. After that the page is indistinguishable from an empty list: "No data available",
  footer "0-0 of 0", and the live region announces **"0 results found"**. There is no retry except a reload.
- **Evidence:** `playwright-cli route "**/api/reminder-dashboard/my-upcoming" --status 500` → eval: `0 results found |
  tbody: No data available | snack: A server error occurred…` · `screenshots/pripomienky-moje--error-500.png` ·
  console `AxiosError: Request failed with status code 500` (`axiosConfig.ts:190`).
- **Repro:** 1. Route `**/api/reminder-dashboard/my-upcoming` to 500. 2. Open `/pripomienky/moje`. 3. Wait 4 s.
- **Verify:** 1. Route `my-upcoming` to 500 and open `/pripomienky/moje`. 2. The page shows a load-failed message
  with a *Try again* control, and the live region does not say "0 results found". 3. Unroute, click *Try again*,
  and the three rows appear without a reload.
- **Root cause guess:** all four reminder list views pass `reportTableLoadError` as `useServerTable`'s `onError`, so
  unit 17's *Upcoming*, *Register* and *Dispatch history* share this. Fix once.
- **Suggested fix:** have `useServerTable` expose an `error` ref, or set one in `onError`. Render a failure row or
  alert with retry = `reload()`, and skip the announcer while `error` is set.

### B6. A snoozed or dismissed occurrence stays in the list unchanged, and can be dismissed again (was U1)
- **Status:** fixed 2026-10-05 (§S7, closed in `_fix-queue-log.md` → *Closed escalations*). Server: `my-upcoming` carries `myAction` (`Snoozed` / `Dismissed` / null) and `snoozeUntil` for the caller's effective action on the pending occurrence. A repeat dismiss is a 204 that writes nothing, and a `snoozeUntil` at or before the occurrence is a 400. Pinned by `MyOccurrenceActionTests` (5/5). Client: a successful action marks the row instead of dropping it (O1's chip), and a dismissed row offers no action. **Verified** against a mock that answers like the new server: after *Dismiss delivery* the row reads "Dismissed" with no buttons, both at 100 ms and after the reload, and focus is on the heading. **Not verified live:** the API under Rider still runs the old build. The new e2e block `My reminders — acted-on rows` fails until the API is restarted (no migration needed)
- **Severity:** bug
- **Where:** `/pripomienky/moje`; `MyRemindersView.vue:287-294` (`dropActiveRow` → `reload()`); server
  `GetMyUpcomingRemindersEndpoint.cs:40-41` (filters on recipient only), `DismissReminderOccurrenceEndpoint.cs` (no
  check for an existing marker)
- **Expected:** once you dismiss or snooze an occurrence, the list stops offering it as pending, or marks it
  ("Snoozed until …" / "Dismissed"). The success snackbar ("This occurrence will no longer be delivered to you.")
  should match what the list then shows.
- **Actual:** the server leaves the row as it was. After a real snooze of 23202 (204) and a real dismiss of 23201
  (204), a reload of `my-upcoming` returned `23201, 23202, 23203` with unchanged `nextOccurrenceAt`. 23202 was still
  offered as "05.10.2026 11:00:00" after its snoozed delivery had already fired. A second identical dismiss of 23201
  also returned **204**, so markers stack without limit. In the UI (success mocked, since X1 blocks the real one) the row
  drops, the success snackbar shows, and the quiet `reload()` brings the row back within ~300 ms, so the
  optimistic drop is undone at once. The user can then snooze or dismiss it again, with no sign that they already
  did.
- **Evidence:** real-API probes from the page: `dismiss → 204`, `dismiss (same body) → 204`, then `my-upcoming →
  23201,23202,23203`. Request log `#2967 dismiss 204`, `#2968 dismiss 204`, `#2972 my-upcoming 200`. With
  `snooze` routed to 204: eval sampled at 100 ms intervals from just after the click shows `3/3/H1` throughout,
  meaning 3 rows were already back, the live region said 3, and focus was on the heading; snackbar "Snoozed — you'll be
  reminded 01.10.2026 10:25:23." Screenshot `screenshots/pripomienky-moje--snooze-success-mocked.png`.
- **Repro:** (after X1 is fixed) 1. `/pripomienky/moje`. 2. Row 1 → *Dismiss* → *Dismiss delivery*. 3. Wait 1 s.
  The row is back. 4. *Dismiss* it again → 204.
- **Verify:** 1. `/pripomienky/moje`, dismiss row 1 (`seed.reminderDefinitions.callTheDentist`). 2. Reload the page.
  3. That row is either absent, or shows a *Dismissed* marker and offers no *Dismiss*. A repeat `POST
  /reminder-dashboard/dismiss` for the same occurrence is refused, or is visibly a no-op.
- **Root cause guess:** a server projection gap. `my-upcoming` ignores `ReminderOccurrenceAction`, which is O1's
  data. The client's optimistic drop + reload was written assuming the server would exclude acted-on occurrences.
- **Suggested fix:** an escalation for `Sydowwe.Reminders`. Project the caller's effective action for the pending
  occurrence onto the row (`myAction: Snoozed|Dismissed|null`, `snoozeUntil`), using the same "latest non-reversed"
  rule as `LoadEffectiveActionsAsync`. The client then renders O1's chip instead of dropping the row. Whether
  "dismiss twice" should be idempotent is part of the same ask.

### A1. The first Snooze dialog of a page load drops focus to `<body>` when it closes
- **Status:** fixed 2026-10-04 (S13, framework `60bef5b`; `MyDialog` records the opener when it mounts open and restores on unmount. Verified live: row 1 *Snooze* → Enter → *Cancel* returns focus to that button, and a snooze with `snooze` routed to 204 drops the row and parks focus on the heading, as designed)
- **Severity:** a11y
- **Where:** `/pripomienky/moje` → any row's *Snooze* → *Cancel*; `MyRemindersView.vue:152-158` (`SnoozeDialog
  v-if="activeOccurrence"`), `MyDialog.vue:144-151` (opener recorded in a non-immediate `watch`)
- **Expected:** focus returns to the button that opened the dialog (R8 §7; WCAG 2.4.3).
- **Actual:** fresh load → focus row 1's *Snooze* → Enter → *Cancel*. `document.activeElement` is `BODY`
  (reproduced twice). The *second* snooze open on the same page returns focus correctly (`BUTTON Snooze reminder
  PersonalReminder`, row index 1), and so does *Dismiss* (a template-declared MyDialog).
- **Evidence:** eval after close: `0 | BODY` (first open) vs `0 | BUTTON Snooze reminder PersonalReminder` (second).
- **Repro:** 1. Load `/pripomienky/moje`. 2. Focus the first *Snooze* button, press Enter. 3. Click *Cancel*. 4. Read
  `document.activeElement`.
- **Verify:** 1. Fresh load of `/pripomienky/moje`. 2. Focus row 1's *Snooze*, press Enter, then activate *Cancel*.
  3. `document.activeElement` is that same *Snooze* button.
- **Root cause guess:** exactly `_fix-queue` **S13** (`notifications/A2`). `SnoozeDialog` is `v-if`'d on
  `activeOccurrence`, so the first open mounts it already open. MyDialog's `watch(dialog)` never sees a
  false→true change and records no opener. Later opens reuse the mounted instance because `activeReminderId`
  is not cleared on Cancel, so the watch fires. Fold into S13 and add this route to its verification.
- **Round 2, wider than "first open":** `confirmSnooze` and `handleActionError` both set `activeReminderId = null`,
  which unmounts the `v-if`'d dialog. The *next* snooze open therefore mounts fresh and has the same defect. Observed:
  after a (mocked) successful snooze, the next *Snooze* → *Snooze* with the request routed to 500 ended with
  `document.activeElement` = `BODY` and the error snackbar showing. Every snooze after a confirmed or failed action
  loses focus, not only the first of the page load.

### A2. Escape does not close the Snooze or Dismiss dialog
- **Status:** fixed 2026-10-04 for *Dismiss* (S30, framework `0d04853`; Escape closes it and focus returns to the row's *Dismiss*). **Won't fix for *Snooze***: FW1 (owner decision 2026-09-23) keeps it persistent because it carries a custom-time form (log, Contradictions §1). The e2e spec should assert that *Snooze* resists Escape
- **Severity:** a11y
- **Where:** `/pripomienky/moje` → *Snooze* / *Dismiss* dialogs; `MyDialog.vue:86` (`persistent = true` default),
  `:136-137` (`onEscKey` returns when persistent)
- **Expected:** a modal with nothing to lose closes on Escape (WAI-ARIA dialog pattern; the template's keyboard
  checklist). The Filter dialog on the same page does.
- **Actual:** Escape with focus inside either dialog leaves it open (`.v-overlay--active` count stays 1). Only
  *Cancel* closes it.
- **Evidence:** eval after `press Escape`: overlay still active, both dialogs, twice each.
- **Repro:** open *Dismiss* on any row, press Escape.
- **Verify:** 1. `/pripomienky/moje`, open row 1's *Dismiss*. 2. Press Escape. 3. The dialog closes and focus is on
  row 1's *Dismiss* button. Repeat for *Snooze*.
- **Root cause guess:** a framework default. Every `MyDialog` that does not pass `:persistent="false"` ignores
  Escape, so this reaches well past this unit.
- **Suggested fix:** pass `:persistent="false"` on these two (nothing is typed that could be lost, except a
  custom snooze time). Or decide the default once in MyDialog as its own batch, like S13/S15.

### A3. The custom snooze time field has no accessible name
- **Status:** fixed 2026-10-04 (S31, framework `67d4a72`; verified live: the time input is `textbox "Remind me on — Time"`. Other labelled `DateTimePicker` call sites were not checked)
- **Severity:** a11y
- **Where:** *Snooze reminder* → *Custom time* → time input; `DateTimePicker.vue:17-25`
  (`:label="label ? '' : $t('dateTime.time')"`)
- **Expected:** every input has a name.
- **Actual:** the date half is `textbox "Remind me on"`. The time half is a bare `textbox` showing `00:00`, because
  `DateTimePicker` blanks the time label whenever a `label` is passed.
- **Evidence:** snapshot inside `dialog "Snooze reminder"`: `- textbox [ref=f5e410]: 00:00` ·
  `screenshots/pripomienky-moje--snooze-custom.png`.
- **Repro:** open *Snooze*, pick *Custom time*, inspect the second field.
- **Verify:** open *Snooze* → *Custom time*. `getByRole('textbox', { name: /time/i })` resolves to the time input.
- **Root cause guess:** a framework-wide component. Every `DateTimePicker` given a `label` has the same unnamed time
  field.
- **Suggested fix:** keep the visual label empty but set an `aria-label` (e.g. `` `${label} — ${t('dateTime.time')}` ``).

### A4. Filter chips' remove button is named just "Close"
- **Status:** fixed 2026-10-04 (S26, framework `67d4a72`; verified live: the chip's button reads "Remove filter: Kind: Personal" and nothing is named "Close")
- **Severity:** a11y
- **Where:** `/pripomienky/moje?kind=Personal` → chip "Kind: Personal" → its ✕; `FilterPanel.vue:13-14`
  (`closable`, `@click:close`)
- **Expected:** the button names what it removes ("Remove filter Kind: Personal").
- **Actual:** `button "Close"`. With two chips there are two identical "Close" buttons, and the Filter dialog's own
  header button is also "Close".
- **Evidence:** snapshot `generic "Kind: Personal"` → `button "Close" [ref=f1e385]`.
- **Repro:** apply any filter, inspect the chip.
- **Verify:** open `/pripomienky/moje?kind=PersonalReminder`. The chip's remove control resolves by
  `getByRole('button', { name: /Kind: PersonalReminder/ })`.
- **Root cause guess:** framework `FilterPanel`. `_fix-queue`'s scheduler notes recorded it "observed in passing…
  whichever unit meets them next can file them". This files it.
- **Suggested fix:** pass Vuetify's `closeLabel` on the chip, built from the chip's own label.

### P1. The breadcrumb calls this page "Home"
- **Status:** fixed 2026-10-04 (S17, framework `7033ca2`; verified live: `Home › My reminders`)
- **Severity:** polish
- **Where:** `/pripomienky/moje` → top-bar breadcrumb
- **Expected:** the crumb names the page ("My reminders").
- **Actual:** a single "Home" crumb, rendered as the current page, whether reached by URL or via the user menu.
- **Evidence:** snapshot `list → listitem "Home"` in the banner; eval `crumbs: Home` after the user-menu navigation.
- **Verify:** open `/pripomienky/moje`. The breadcrumb's last item reads "My reminders".
- **Root cause guess:** identical to `notifications/P1` (`_fix-queue` **S17**): a route in no nav tree gets the home
  crumb alone. Add this view to S17 (`useSetBreadcrumbExtra([{ title: t('reminderDashboard.my.title') }])`), or to
  S5's shell-level option if that is taken.

### P2. The default sort is rewritten on every mount and badges *Kind* "2"
- **Status:** fixed 2026-10-04 for the URL half (S23, framework `5d03e01`; default is now `[nextOccurrenceAt asc, kind asc]` and a bare `/pripomienky/moje` keeps `location.search === ''`). The "Kind 2" badge half is **won't fix** by owner decision (log, Contradictions §5): it now reports the view's real, declared order
- **Severity:** polish
- **Where:** `/pripomienky/moje`; `MyRemindersView.vue:217` (`defaultSortBy: [nextOccurrenceAt asc]`)
- **Expected:** opening the page with no query leaves a clean URL state equal to the default, and only the column
  the user sorted by shows a badge.
- **Actual:** `/pripomienky/moje` becomes `?…&sortBy=nextOccurrenceAt:asc,kind:asc`, and the *Kind* header carries a
  "2" priority badge the user never asked for (`BasicTable` appends its first column as a tie-breaker).
- **Evidence:** URL after `goto /pripomienky/moje`; snapshot `columnheader "Kind 2"`.
- **Verify:** open `/pripomienky/moje`. Either no *Kind* badge is shown, or the default is declared with the
  tie-breaker so state equals default.
- **Root cause guess:** same as `scheduler/P1` (`_fix-queue` **S3**): declare
  `[nextOccurrenceAt asc, kind asc]` as the default.

### P3. Raw internal codes on screen, and free-text filters that need them typed exactly
- **Status:** fixed 2026-10-05, without the catalog (owner decision: the interim). The kind cell, its caption and the row buttons' names go through `reminderKindLabel` ("Personal reminders"). The *Owner module* column ("App" on every row) and both free-text filters are gone from this view, and its URL codec ignores `module` / `kind`. Verified live: four headers, labelled rows, a Filter dialog with only *Schedule type* and the dates, and `?kind=NoSuchKind` lists all 3 rows with no chip (the param stays in the URL until the first table change). §S2 stays open for `notifications/B3`. If it lands, *Kind* can return as a select
- **Severity:** polish
- **Where:** Kind / Owner module columns; *Filter* → *Owner module*, *Kind* (`MyRemindersView.vue:34-43`)
- **Expected:** a user-facing page shows names, not identifiers, and a text field implies search.
- **Actual:** the cells show `PersonalReminder` and `Portal`. The two filters are free text matched **exactly**
  server-side, so typing `Personal` returns 0 rows (`?kind=Personal`). The user has to retype a PascalCase code
  they can only copy from the table.
- **Evidence:** `?kind=Personal` → "0 results found"; server `ApplyUpcomingFilter` uses `==`.
- **Verify:** open `/pripomienky/moje`. The kind cell shows a human label, and the Kind filter offers the kinds
  present (a select) or matches a partial string.
- **Suggested fix:** make both filters selects fed from the values present (or drop them: a personal list of a
  handful of rows needs little filtering). Localize `kind` through a label registry, the way
  `notificationTypeMeta` labels notification types. Largely moot once B1 gives rows a title.

### P4. No page-specific empty state
- **Status:** fixed 2026-10-04 (S29, framework `639814a`; verified live: filtered-empty reads "Nothing matches the current filters." + *Clear filters*, and a mocked empty list reads "No upcoming reminders.")
- **Severity:** polish
- **Where:** `/pripomienky/moje` table body
- **Expected:** an empty personal list says so in the page's own words ("No upcoming reminders", or "No reminders
  match these filters" with a *Clear* action).
- **Actual:** Vuetify's default "No data available", for both the filtered-empty and the error cases (B5).
- **Evidence:** snapshot `cell "No data available"` with `?kind=Personal` ·
  `screenshots/pripomienky-moje--empty-filtered.png`.
- **Verify:** open `/pripomienky/moje?kind=NoSuchKind`. The body shows reminder-specific copy that mentions the
  filter.

### P5. The Dismiss confirmation does not say which occurrence it dismisses
- **Status:** fixed 2026-10-04 (S30, framework `0d04853`; verified live: the dialog shows "Occurrence 06.10.2026 16:30:00". The reminder's own title joins it when §S6 lands)
- **Severity:** polish
- **Where:** row *Dismiss* → *Dismiss reminder* dialog; `MyRemindersView.vue:160-168`
- **Expected:** a confirmation for an irreversible action names its object. The sibling Snooze dialog shows an
  *Occurrence* row with the instant.
- **Actual:** "This occurrence will no longer be delivered to you…". There is no date and no reminder name, and
  the rows are otherwise identical (B1).
- **Evidence:** snapshot `dialog "Dismiss reminder"` text · `screenshots/pripomienky-moje--dismiss.png`.
- **Verify:** open *Dismiss* on row 1. The dialog shows "02.10.2026 16:30" (or the row's title once B1 lands).
- **Suggested fix:** reuse the Snooze dialog's `InfoRow` with `formatInstant(activeOccurrence)`.

### P6. Instants are Slovak-shaped in EN, with inconsistent hour padding
- **Status:** fixed 2026-10-04 (S11, framework `2cbc085`; `DateTimeHelper` resolves the locale per call. Verified live in EN: cells read `10/06/2026 4:30:00 PM`, matching the date inputs' order. The SK shape is covered by a unit test only)
- **Severity:** polish
- **Where:** Next occurrence cells, schedule cells, snooze presets, filter chips; `useReminderFormat.formatInstant` →
  `DateTimeHelper.formatToTimeWithSec` (`dayjs(...).locale('sk').format('LTS')`, `:93`)
- **Actual:** "02.10.2026 16:30:00" next to "01.10.2026 1:54:23" and "02.10.2026 0:00:00" (unpadded hours), in an
  EN session whose date inputs expect `mm/dd/yyyy`.
- **Evidence:** snapshot texts above; filter date placeholder `mm/dd/yyyy`.
- **Verify:** in EN, `/pripomienky/moje` shows English-formatted instants, consistent with the date inputs.
- **Root cause guess:** `_fix-queue` **S11**. Recorded so S11's verification walks this view. No separate batch.

### P7. A stale row's 400 is reported as "no longer in the future" even when the occurrence is still ahead
- **Status:** fixed 2026-10-04 (S30, framework `0d04853`; `actions.occurrenceChanged`, "This occurrence has changed or passed — the list was refreshed.", sk + en. Verified live with `dismiss` routed to a 400 carrying `errors.occurrenceAt`. The server's third 400, `SnoozeUntil` not in the future, is not described by it; the dialog's `isValid` rules it out except under clock skew)
- **Severity:** polish
- **Where:** `MyRemindersView.vue:361-367` (`handleActionError`, 400 branch) → `reminderDashboard.actions.pastOccurrence`;
  server `Snooze/DismissReminderOccurrenceEndpoint.cs:46-49`
- **Expected:** the snackbar names the actual reason. The server returns 400 for two different reasons: the occurrence has
  passed, **or** `OccurrenceAt` no longer matches the definition's pending occurrence. The second happens when
  the page is stale (a recurring reminder advanced, or an admin rescheduled it while the list was open).
- **Actual:** both reasons show "This occurrence is no longer in the future." For the stale case that is false: the
  new occurrence is in the future, and the list reloads to show it. The 400 body names the field that failed
  (`errors.occurrenceAt: ["OccurrenceAt must match this reminder's pending occurrence."]` vs `["Only an upcoming
  occurrence can be dismissed."]`), but the client reads only the status.
- **Evidence:** real-API probe `dismiss {reminderDefinitionId:23203, occurrenceAt:"2026-10-13T08:00:00Z"}` → 400 with the
  message above. UI with `dismiss` routed to 400 → snackbar "This occurrence is no longer in the future."
- **Verify:** 1. Open `/pripomienky/moje`. 2. Route `**/reminder-dashboard/dismiss` to 400 with body
  `{"errors":{"occurrenceAt":["OccurrenceAt must match this reminder's pending occurrence."]}}`. 3. Dismiss row 1. The
  snackbar says the reminder has changed and the list was refreshed, not "no longer in the future".
- **Suggested fix:** one neutral key for both reasons ("This occurrence has changed or passed — the list was
  refreshed."), or branch on whether `activeOccurrence` is still in the future when the 400 arrives.

### O1. The list cannot show that an occurrence is already snoozed or dismissed
- **Status:** built 2026-10-05, chip only (with B6, §S7). Each row shows *Snoozed until …* (clock, `primaryOutline`) or *Dismissed* (bell-slash, `warning`) under its title, from `my-upcoming`'s `myAction` / `snoozeUntil`. New keys `reminderDashboard.my.snoozedUntil` / `.dismissed` (sk + en). **Not built:** the *Snoozed* filter (`myAction` is filled after the page is projected, so the server cannot filter or sort on it yet) and an *Undo* (no reversal endpoint exists, and the Dismiss confirm still says it cannot be undone from here)
- **Severity:** opportunity
- **Where:** `/pripomienky/moje`
- **What exists:** the server keeps per-recipient `ReminderOccurrenceAction` markers (dismiss, and snooze with
  `SnoozeUntil`), append-only. `templateKey` is already on every row and unrendered.
- **What it could feed:** a *Snoozed until …* / *Dismissed* chip on the row, and a *Snoozed* filter. An *Undo*
  within a window, which R10 §1 left as a possible backend ask, would then have somewhere to live. This is also
  the natural fix for B6 (was U1).

*(U1 was confirmed in round 2 and is now **B6**.)*

### U2. The 404 / 400 action paths and the passed-occurrence disable are unexercised
- **Status:** stale. Settled in round 2: all three work as coded, except P7's copy.
- **Severity:** unverified
- **Round 2 result:** 404 is the path *every* action takes today (X1). It shows the info snackbar and drops the row,
  and the reload restores the row. With `dismiss` routed to 400: dialog closes, warning snackbar "This occurrence is
  no longer in the future.", `reload()` fires, and focus returns to the row's *Dismiss* button. With `snooze` routed to
  500: error snackbar "The action could not be performed. Please try again.", no reload, row kept. Focus is lost there,
  which is A1. `canAct`: with `my-upcoming` routed to a single row due 40 s later, both buttons were enabled until
  07:26:56Z and disabled from 07:27:08Z (occurrence 07:26:45Z). They disable within one clock tick, with no
  reload. Real server: a past `snoozeUntil` → 400 `SnoozeUntil must be in the future.`; a non-matching
  `occurrenceAt` → 400 `OccurrenceAt must match this reminder's pending occurrence.` (see P7); someone else's
  definition (23001) → 404.
- **Where:** `MyRemindersView.vue:349-372` (`handleActionError`), `:248-251` (`canAct`)
- **Suspected:** they behave as coded. 404 → info snackbar "no longer available" plus a row drop; 400 → warning
  snackbar plus reload; buttons disable as `nextOccurrenceAt` passes.
- **Evidence:** source read only.
- **What would settle it:** a mutation pass that routes `**/reminder-dashboard/dismiss` to 404 and then to 400 and
  confirms each snackbar and the list state. For `canAct`, a seeded occurrence a minute or two in the future, or
  `page.clock` fast-forward.

### U3. Instants follow the browser's timezone, not the account's
- **Status:** settled 2026-10-05 by source, not by a browser run: not a defect. `User.timezone` is a server-side field that `timeZoneSync.ts` keeps equal to the browser's zone (it is set from `Intl.DateTimeFormat().resolvedOptions().timeZone` on login, registration and Google sign-in, and the framework offers no manual picker on purpose), so the account zone and the browser zone cannot differ for long. `DateTimeHelper` has no zone handling and does not need any for that reason. A `timezoneId: 'America/New_York'` run was **not** driven. If a manual zone picker is ever added, re-open this and S20's date bounds
- **Severity:** unverified
- **Where:** `useReminderFormat.formatInstant` → `DateTimeHelper` (dayjs local zone)
- **Suspected:** an account whose `timezone` differs from the browser sees reminder times in the browser's zone.
  CLAUDE.md's `useUserClock` note describes that class of bug.
- **Evidence:** not distinguishable here. The browser zone is `Europe/Bratislava`, and rendered times match the UTC
  instants +2 h, as they would for a Bratislava account either way.
- **What would settle it:** set the seed account's timezone to e.g. `America/New_York` in `/user/settings` (or run
  the browser with `timezoneId`), reload, and compare row 1 with `2026-10-02T14:30Z`.
