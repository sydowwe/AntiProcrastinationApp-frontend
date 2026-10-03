# Fix queue — log (`_submodule` units 16–19)

> Audit trail for [`_fix-queue.md`](_fix-queue.md) beside this file. Nothing here is open work.
> Created on the fourth pass. Passes 1–3 kept their notes inline in the queue, and those notes were moved here
> verbatim (*Passes 1–3* below).

## Pass history (newest first)

> **Fourth pass, 2026-10-01, commit `0e77f904` (framework `b1b82a1`) — unit 16 `reminders-user` absorbed (inventory
> + mutation).** 21 entries considered (X1, B1–B6, A1–A4, P1–P7, O1, U2, U3), all `[framework]`. Four new batches:
> S28 (X1 + B2), S29 (B5 + P4), S30 (A2's Dismiss half + P5 + P7) and S31 (A3, rule 4). Six findings were folded into
> existing batches by cause: B3 → S20, A4 → S26 and P2 → S23 (the three the third pass pre-listed), plus A1 → S13,
> P1 → S17 and P6 → S11. S13, S17 and S11 were widened in place, and S13 and S17 changed their titles. Two new
> escalations: §S6 (B1, B4) and §S7 (B6, plus B2's server half). P3 is parked under §S2 as a client half that needs the
> kind catalog. U3 went to *Needs verification* and O1 to *Deferred*. U2 was not queued, because the unit settled it
> itself (`stale`). §S5 stays unused, because the third pass reserved it conditionally. The queue/log split from
> `TRIAGE-PROMPT.md` was applied on this pass: the queue's *Re-grades & notes* section and its post-summary note on
> `scheduler/P2` moved here, the queue's header now points here, and S7's "leave `MyRemindersView` to unit 16's
> triage" was answered in place. Totals: 83 findings considered, 31 framework batches, 0 app-side, 6 escalations.

> **Third pass, 2026-10-01 — unit 17 `reminders-admin` absorbed (inventory).** 22 findings: 10 new batches
> (S18–S27), and S5 and S7 widened. Details in *Passes 1–3* below.

> **Second pass, 2026-10-01 — unit 18 `notifications` absorbed (inventory + mutation).** 19 findings: S10–S17, and
> §S2–§S4 escalated. `scheduler/P2` was moved into S11. Details below.

> **First pass, 2026-09-30 — unit 19 `scheduler`.** S1–S9 and §S1. Details below.

## Closed batches

## S10. Inbox never loads unless the SignalR handshake succeeds
> ✅ **FIXED 2026-10-03** (framework `b038d3e`). `connect()` now runs `loadNotifications()` side by side with the first
> `hub.start()` instead of after it. A failed initial start retries on the `reconnectForever` delays (new `startHub()`
> plus a retry timer cleared by `disconnect()`), and a *retried* start re-reads the list, as `onreconnected` does. A new
> `hasConnected` ref lets the inbox and the bell say "Connecting..." before the first connect. "Reconnecting..." is kept
> for a dropped connection (new `notifications.connecting`; SK `reconnecting` became "Opätovné pripájanie...", since
> "Pripájanie..." now means the first state). Four unit tests were added, covering list-without-hub, retry then reload,
> one `mine` + one `unread-count` when healthy, and no retries after `reset()`. Docs: `docs/modules/notifications.md`.
> **Verified** in the browser (`playwright-cli`, 1440×900, `primaryUser`): with negotiate routed to 503, `/notifikacie`
> rendered the rows with "3 unread" and "Connecting...", and the bell read "Notifications, 3 unread". Negotiate retried.
> After `unroute`, with no reload, the hub connected on its own, the label cleared, and exactly one more `mine` +
> `unread-count` followed. A normal load issued one of each. An unplanned API restart mid-session showed the dropped
> case: the list stayed up under "Reconnecting...", and the hub recovered when the API came back. **Not verified:** the
> bell's first-paint `aria-label` was only read after load, not during the handshake.
- **Scope:** **[framework]** `src/_common/modules/notifications/composable/useNotifications.ts`, `view/NotificationsView.vue`
- **Closes:** `notifications/B1`
- **Root cause:** `connect()` awaits `hub.start()` and only then calls `loadNotifications()` (`useNotifications.ts:549-567`).
  The list and unread count are REST resources, but they are sequenced behind the realtime channel. A failed *initial*
  `start()` is not covered by `withAutomaticReconnect`, and the catch only nulls `connectPromise` for a retry nothing
  triggers. So a hub outage renders the **first-run** empty state ("No notifications yet") with badge 0, permanently.
  The coded `loadError` + Retry state is unreachable because `error` is never set. The view also reads
  `isConnected === false` as "Reconnecting…" before the first connect ever happened.
- **Files:** `useNotifications.ts:549-567` (`connect`), `:306` (the failure log), the reconnect-delay policy
  (`reconnectForever`); `NotificationsView.vue` (the "Reconnecting…" label and the skeleton gating on `isLoading`).
- **What to change:** (1) start `loadNotifications()` (list + unread count) in parallel with, or before, `hub.start()`,
  and set `isLoading` from the REST load, not the handshake. (2) On a failed initial `start()`, schedule retries with
  the same `reconnectForever` delays. (3) Label the never-connected state "Connecting…" (new key, sk + en) or hide it,
  keeping "Reconnecting…" for a dropped connection.
- **Do not change:** the live-arrival path (hub → prepend, no refetch), which works (settled in the unit's findings,
  *Settled: `_shell` B1*).
- **Verification:** `notifications/B1` `Verify:` (negotiate mocked to 503, then `unroute` and wait ~70 s for a second
  `negotiate`). Also confirm a normal load still issues exactly one `mine` + one `unread-count` (no duplicate from the
  hub's `onreconnected` refetch).
- **Risk:** the bell (`_shell`) shares this composable, so the badge's first value now comes from REST before the hub is
  up. That is the intent, but re-check the bell's `aria-label` count on first paint.

## S12. Notifications controls with no name or a repeated one
> ✅ **FIXED 2026-10-03** (framework `40255f1`). A1: the inline badge is `aria-hidden` and the toggle is named
> `notifications.filter.unreadWithCount` ("Unread, 3"). The bell's badge (in this module, `NotificationBell.vue`, not the
> shell) gets `role="none"`, an empty `aria-label` and `aria-live="off"`. `aria-hidden` is not usable there, because
> VBadge puts it on the root, which wraps the button. A3: `markReadItem` / `markUnreadItem` with `{ title }` (the tooltip
> keeps the short form), and the cluster is named from type label + size (`clusterExpand` / `clusterCollapse` now take
> `{count}` / `{type}`). A5: `aria-labelledby` = row label span id + column `th` id, from `useId()` via
> `matrixRowHeaderId` / `matrixColumnHeaderId` in `notificationPreferenceMatrix.ts`. The id sits on the label span, not
> the `th`, so the silenced caption is not folded into 3 names per row. A7: `:aria-label="kindLabel"`.
> **Verified** in the browser: `getByRole('button', { name: /^Unread/ })` → 1, named "Unread, 3"; `getByRole('status')`
> → 0 on `/notifikacie` (the bell's "Badge" status is gone). The rows read "Mark notification Deadline approaching as
> read" etc. Two raised `Test` notifications clustered as "Expand 2 notifications: Test" (both deleted afterwards,
> unread back to 3). `getByRole('checkbox', { name: /Personal reminder.*In-app|In-app.*Personal reminder/ })` → 1.
> **Not verified:** A7 live. It needs a kind row, i.e. a `PUT /reminder-preference/kind` write that cannot be undone
> short of a reseed (the card would leave its empty state for later specs), so only the source was checked. Note that
> `playwright-cli snapshot` still *lists* the hidden badge as `status "3"` under the toggle; role queries, which honour
> `aria-hidden`, do not see it.
- **Scope:** **[framework]** `src/_common/modules/notifications/` (+ both locale files)
- **Closes:** `notifications/A1`, `A3`, `A5`, `A7`
- **Root cause:** four controls take their name from nothing, or from a generic string. `VBadge` renders
  `aria-label="Badge"`, which replaces the count in the *Unread* toggle's name ("Unread Badge"). The read toggle and
  cluster use one fixed string per row. The 33 matrix `VCheckboxBtn`s and the reminder-kind `VSwitch` have no label at
  all.
- **Files:** `component/NotificationInboxToolbar.vue:13-22` (A1); `component/NotificationRow.vue:72-80`,
  `component/NotificationClusterSummary.vue` (A3); `component/NotificationTypeSettingsRow.vue:39-52` (A5);
  `reminderPreference/component/ReminderKindRow.vue:22-29` (A7).
- **What to change:** A1: `aria-hidden` the badge and put the count in the toggle's `aria-label` via
  `notifications.unreadCount` (or give the badge that label). A3: `notifications.markReadItem` / `markUnreadItem` taking
  `{ title }`, mirroring `dismissItem`; the cluster's label from its summary text (type + count). A5:
  `aria-labelledby="<row th id> <column th id>"`, which names the box from the headers already there and so keeps the
  source comment's "don't read it twice" intent. A7: `:aria-label="kindLabel"` on the switch.
- **Do not change:** `dismissItem` (already right); the bell's own `aria-label` (already carries the count). The
  top-bar `status "Badge"` next to it is the same `VBadge` default. Hide it in the same edit if it is in this module,
  and leave it if it lives in the shell's `Navbar.vue`.
- **Verification:** the four findings' `Verify:` blocks. A7 needs a kind row first (`PUT /reminder-preference/kind`,
  as in its Repro) until §S2 lands.
- **Risk:** none functional. e2e locators that used `'Unread Badge'` or a structural fallback for the matrix can move to
  the new names.

## S14. Preference cards' purple palette fails contrast
> ✅ **FIXED 2026-10-03** (framework `5b2e76b`). `color="secondary"` was dropped from all three cards (`elevation="2"`
> kept). Measuring after that showed the batch's premise was incomplete. On a surface card the info notice's text
> (theme `info`, `#0284C7`) still measured only **3.53:1**, so the alert also takes `color="primaryOutline"` (light
> `#1D4ED8`), and `type="info"` still supplies the icon. **Verified** in the light theme with `getComputedStyle`
> against the card background (`rgb(238,238,238)`): subtitles 12.65:1, the three card icons 4.45:1 (≥ 3:1 for
> non-text), notice text 5.78:1. A screenshot confirmed the page reads as plain surface cards. **Not verified:** the dark
> theme. Toggling it writes the user's theme preference, so it was left alone. Also not measured: the quiet-hours-on
> states (Saved, active-now line). They are standard `text-success` / `text-primary` on a surface now, like the rest of
> the app. `SessionsSection.vue` (user module) has the same `color="secondary"` card. Out of scope here, and not
> measured.
- **Scope:** **[framework]** `src/_common/modules/notifications/component/QuietHoursCard.vue`,
  `reminderPreference/component/ReminderKindList.vue`, `component/NotificationTypeSettingsCard.vue`
- **Closes:** `notifications/A4`
- **Root cause:** all three cards are `VCard color="secondary"` (`#7C3AED`, light theme), and every foreground on them
  was designed for a surface background: `color="primary"` icons ≈ 1.1:1, the info alert ≈ 1.4:1, empty-state text
  ≈ 2.4:1, and subtitles ≈ 3.7:1. Round 2 adds the states that only show once quiet hours are on: the green "✓ Saved"
  (the card's only save confirmation), the blue active-now line, the switch track, and the kind row's
  `primaryOutline` chip. N12 copied the palette from the two older cards rather than choosing it.
- **What to change:** drop `color="secondary"` so the cards are surface cards like every other settings screen. Keep
  `elevation="2"`. If the tint is a product decision, the alternative is switching *every* foreground to
  `on-secondary`, including the success/primary text colours, which is more edits and easier to get half right.
- **Verification:** `notifications/A4` `Verify:` in the light theme; also open the dark theme once, which was not
  checked by the unit.
- **Risk:** visual only; none outside this page.

## S16. Notifications copy that says the wrong thing
> ✅ **FIXED 2026-10-03** (framework `8c5dd57`, plus the app-side half of P4 in the pointer-bump commit). P2:
> `emptyFilteredAll` when `!hasMore`. P3: `dismissManyConfirmTitle` (`{count}`, EN two forms, SK three). P4 split by who
> owns the vocabulary. Reading the API showed that only `ReminderDigest`'s title ("Reminders" / "Pripomienky") comes from
> the framework backend (`Sydowwe.Notifications/application/text`). The routine titles ("Period ended", "Period ending
> soon") are this app's `PortalNotificationTexts` overrides, and the framework's defaults are just "New notification".
> So the framework label became "Reminders (summary)" / "Pripomienky (súhrn)". The two routine types got app-side
> `NotificationTypeMeta.label`s, "Routine period ending soon" / "Routine period ended" (SK "Obdobie rutiny sa čoskoro
> končí" / "… sa skončilo"), following `RoutineSuggestedToday`'s precedent. P6: the subtitle and both active-now lines
> now say that scheduled reminders and push/e-mail copies wait, while the in-app list keeps updating. **Verified** in the
> browser (EN): `/notifikacie?type=ScheduledJobFailed` reads "None of your notifications match this filter." with no
> *Load older*. Select all → Dismiss is titled "Dismiss 8 notifications?" (cancelled). The Type options read "Reminders
> (summary)", "Routine period ending soon" and "Routine period ended". The quiet-hours subtitle shows the new sentence.
> **Not verified:** the SK strings on screen (source only), and the active-now line live, which needs quiet hours
> switched on over the current time.
- **Scope:** **[framework]** `src/_common/modules/notifications/` views + `src/_common/_locales/common.{sk,en}.ts`
  (`notifications.*`, `notifications.type.*`, `reminderPreference.quietHours.*`)
- **Closes:** `notifications/P2`, `P3`, `P4`, `P6`
- **Root cause:** four strings that do not match the state or the server. P2: `notifications.emptyFiltered` always
  offers "load older ones", even when `hasMore` is false and no button renders. P3: the bulk dismiss confirm reuses the
  singular `dismissConfirmTitle`. P4: the type labels (`common.en.ts:386-392`: "Routine ended", "Reminder digest",
  "Timer finished") are a different vocabulary from the server-rendered titles on the rows they filter ("Period
  ended", "Reminders", "Focus finished"). P6: the quiet-hours subtitle and active-now line promise "we won't disturb
  you" and "a reminder arriving now will be delivered at …", but the server never holds the in-app row, so the bell
  keeps filling during the window.
- **Files:** `view/NotificationsView.vue:119-149` (P2), `:392-396` (P3); `common.{sk,en}.ts` `notifications.type.*`
  (P4); `component/QuietHoursCard.vue:94-105` and the `reminderPreference.quietHours.subtitle` / `activeNow*` keys (P6).
- **What to change:** P2: two keys, chosen on `hasMore`. P3: a plural title key with a count (`{n}`, sk plural forms).
  P4: align each label's key noun with the server title ("Period ended" / "Period ending soon" / "Reminders"). The same
  labels head the delivery-matrix rows, so both surfaces change together. Check the sk labels against the backend's sk
  titles too. P6: one sentence in both locales saying the notification list still updates, and only push/e-mail
  copies and scheduled reminders wait for the window to end.
- **Do not change:** the server titles (a backend wording decision, and they are already English per locale);
  `TimerBoundary`'s label, since its three server titles share no noun and "Timer finished" is the nearest honest
  umbrella.
- **Verification:** the four findings' `Verify:` blocks.
- **Risk:** if §S3 lands and the server starts discounting unconfigured channels, P6's new sentence is still true. It
  describes the in-app exemption, which §S3 does not touch.

## Closed verification items

_None yet._

## Contradictions & re-grades

### Contradictions

Numbered from 1 here. Passes 1–3 recorded theirs inline, and those are kept verbatim under *Passes 1–3*.

1. **`reminders-user/A2` vs the app queue's FW1 decision.** The finding expects both the Snooze and the Dismiss dialog
   to close on Escape, and suggests `:persistent="false"` on both. FW1 (owner decision 2026-09-23,
   `docs/views/_fix-queue-log.md` → *Closed batches* → FW1) names `SnoozeDialog` among the dialogs "kept persistent on
   purpose", because it carries a custom-time form. The Dismiss dialog is an input-less confirmation, exactly the
   kind FW1 opted out. Step 1 missed it because it is template-declared in `MyRemindersView`, not one of the ten sites
   it listed. Resolution: the Dismiss half goes to S30, and the Snooze half is dropped. The unit's phase-5 spec should
   assert that Snooze *resists* Escape.
2. **`reminders-user/A1` vs S13's framing.** S13 (from `notifications/A2`) blamed `DialogHost` entries and offered
   "capture `document.activeElement` at `openDialog()`" as its first option. `SnoozeDialog` is not a `useDialog()`
   dialog. It is a template `v-if` that mounts already open (`MyRemindersView.vue:152-158`), so that option would close
   `notifications/A2` and leave `reminders-user/A1` open. S13 now requires the fix inside `MyDialog`.
3. **S22's identity helper cannot reach `/pripomienky/moje`.** S22 names a reminder `{subjectType} #{subjectId}`, and
   the personal `my-upcoming` row carries neither field. So `reminders-user/B1` does not fold into S22. It is §S6. S22's
   *Do not change* now says so, so that a fixing session does not widen it.
4. **Stale comments in framework source**, found by unit 16. None gets a batch of its own. `MyRemindersView.vue:296`:
   "MyDialog already restores focus to whatever opened it" is false until S13 lands.
   `useReminderTableErrors.ts`: "Giving these five tables a proper error state is R2's job", but R2 never took it
   (S29). `UpcomingReminderGridResponse.ts` header: `MyRemindersView` "renders none of" the omitted fields "except
   `cronExpression`", but it renders `intervalPreset` too (§S6's client half corrects it). The module README's
   "Slovak-only" claim, already noted on the third pass, is stale again (`reminders-user` *Intent sources*).

### Re-grades

Fourth pass (unit 16 `reminders-user`):

- **`B4` bug → polish**, escalated in §S6. The finding's own *Expected* is the column's "one-off or repeating?"
  question, and the row's repeat icon already answers it. What is missing is *how often*: real, but polish.
- **`A2` a11y → split; Snooze half dropped** (Contradiction 1). The Dismiss half keeps its severity, in S30.
- **`X1` blocker, kept.** It is the best-evidenced finding in the unit: observed 404s with the request bodies, a 204
  with the server's keys from the same page, and confirmed in source on this pass (client `.ts` vs server `.cs`).
- **`B2` bug, kept, and batched with `X1` despite a different cause.** It is a shipping constraint, not a cause match:
  X1 alone makes the harmful default reachable (rule 3's spirit, one fixing session; S28 *Risk* states the order).
- **`B1` bug and `B6` bug, kept**, escalated as §S6 and §S7. Both are contract gaps the client cannot close.
- **`P3` polish, not batched.** It is parked under §S2: the selects and the labels need the kind catalog, and the
  interim (dropping the two filters) is an owner call.
- **`B5` + `P4` merged into S29.** They are the same `#no-data` slot. B5's "all four tables share it" is source-only
  (the same helper at four `onError` sites, confirmed by grep). S29's verification adds one admin-table check rather
  than asserting it.
- **Merged into existing batches as cross-unit duplicates (6):** `B3` → S20, `A4` → S26, `P2` → S23, `A1` → S13,
  `P1` → S17, `P6` → S11. Each was checked against the batch's root cause, not just its symptom.
- **`U2`, not queued.** The unit marked it `stale` in its own round 2 (all paths work as coded except P7's copy, which
  is S30).
- **`U3`, kept unverified.** The browser and the account share a zone, so the pass could not tell them apart.
- **`O1` → Deferred**, noted as §S7's client half.

### Passes 1–3 (moved verbatim from the queue's *Re-grades & notes* on the fourth pass)

The note that sat under the queue's Summary table until the fourth pass:

> `scheduler/P2` was *not batched* on the first pass, deferred to the app queue's *Contradictions* §22. It is now in
> **S11**. §22 is a note, not a queued fix ("unfiled, unobserved in a browser"), so deferring to it parked the
> defect nowhere. `notifications/B2` is the first observed instance. See *Re-grades & notes*.

#### First pass, 2026-09-30 — unit 19 `scheduler`

- `B6` (bug) → **escalation §S1**. The cause is server-side, and the client reports the state correctly. Severity is
  unchanged.
- `P2` (polish) → **not batched**. It duplicates app-queue §22 (`DateTimeHelper` hardcoded `sk`). *(Reversed in the
  second pass: now in S11.)*
- Pairs batched together because one fixing session edits the same block: `B1`+`P1` (jobs-grid setup), `B3`+`B4`
  (breadcrumb ownership), `A1`+`A2` (naming), and `P4`+`P5`+`P6` (run-detail cards). `X1` and `B5` are **not**
  merged, even though both are flex-height bugs. They are different containers with different fixes, and S1 must not
  change `SchedulerDetailPage` in a way that affects S2's page.
- Contradiction with the unit prompt: it said to expect the code to lag `prompts/_common/scheduler/` ("a gap here is
  usually *not built yet*"). S1, S3, S4, S5, S6, S7 and S8 have all landed (`git -C src/_common log --
  modules/scheduler`), and every listed claim checked live holds (table in `docs/views/_submodule/scheduler/findings.md`). That
  prompt set is effectively done and could move to `_done/`. That is the owner's call, not this queue's.
- Not filed, observed in passing (framework-wide, outside this unit): `ExportMenu`'s open menu joins the activator's
  accessible name (`button "Export Excel (.xlsx) CSV (.csv)"`), and every `FilterPanel` chip's remove button is named
  just "Close". Whichever unit meets them next can file them.

#### Second pass, 2026-10-01 — unit 18 `notifications` absorbed (inventory round 1 + mutation round 2)

- 19 findings, all `[framework]`: 14 batched into S10–S17, 3 escalated (§S2–§S4), 2 to *Needs verification*. None
  dropped and none merged across units, except `scheduler/P2`, which joins `notifications/B2` in S11.
- **Re-grade of this queue's own first-pass call:** `scheduler/P2` "not batched" → **batched in S11**. The first pass
  deferred it to the app queue's §22. §22 is a *Contradictions* note that explicitly left the defect "unfiled,
  unobserved in a browser", so deferring to it parked the fix nowhere. With a second, independently observed consumer
  (`notifications/B2`), rule 4 applies: a framework-wide default gets its own batch.
- `notifications/B3` (bug) → **escalation §S2**. The card cannot be fixed without a server catalog. Its client half is
  described in §S2, to be appended as a batch when the catalog lands. Severity unchanged.
- `notifications/B4` (bug) → **escalation §S3**. The cause is the dispatcher's `activeIds`. The client caption states
  the documented intent. Severity unchanged.
- `notifications/P5` (polish) → **escalation §S4**. It is a catalog decision, and a client filter is the documented
  wrong answer.
- `notifications/P4` looked app-side in its finding ("the label keys are app-side, `src/app/notifications/`"). They
  are not: the four labels in question are the framework's `notifications.type.*` (`src/_common/_locales/common.en.ts:
  386-392`). The app's `notificationTypeMeta.ts` registers a label only for `RoutineSuggestedToday`. So P4 is
  framework, batched in S16, and no app-side batch results.
- Kept as separate batches despite touching the same module: S12 (names) vs S16 (copy). One is a11y attributes and the
  other is visible wording with product choices in it (P4, P6). S13 and S15 are their own batches under rule 4:
  `MyDialog` and `SnackbarComposable` defaults reach every app.
- **Contradiction (resolved in the unit docs):** `docs/views/_submodule/notifications/usecase.md` said the dispatcher "defers every
  notification (not just reminders)" inside quiet hours, and that turning off every deliverable channel removes a type
  from the inbox. Round 2 disproved both (P6, B4). The usecase was corrected in the same pass.
- **Contradiction, cross-repo, not queued:** the API repo's `docs/e2eTestSeed.md` still warns that "the bell's text is
  Slovak regardless of the account's locale". Round 1 settled that it is not (`_shell` B1, closed 2026-09-21 after
  backend `B15`). It is a stale doc in another repo, so fix it there when next touched.
- **Downstream app string to recheck after §S2/§S3 (second pass):** `dayPlanner.en.ts:27` sends users to reminder preferences to
  turn reminders off "entirely". Today neither the kinds card (§S2) nor the matrix (§S3, the row still lands) can
  fully do that on this deployment. If either escalation resolves as "keep behaviour", that string needs an app batch.

#### Third pass, 2026-10-01 — unit 17 `reminders-admin` absorbed (inventory)

- 22 findings, all `[framework]`: 18 fix findings in 10 new batches (S18–S27) and 2 existing ones (S5, S7), 2 to
  *Needs verification*, 1 to *Deferred*. None dropped. No severities changed.
- **Merged into existing batches, by cause:** `reminders-admin/B3` → **S5**. It is the same assumption with the same
  comment, and it tips S5 toward the shell-level de-dup. `reminders-admin/P2` → **S7**, the same missing `_silent`. Both
  batches were widened in place rather than duplicated. Their titles changed, their numbers did not.
- **Related but kept separate:** S18 (reminders flex-shrink) vs S2 (scheduler flex-shrink), and S23 (reminders
  tie-breaker) vs S3 (2) (scheduler tie-breaker). Each pair has one cause but different files, and S2/S3 already carry
  scheduler-only work. A fixing session can take a pair together.
- **Rule 4 splits:** S25 (`BasicTable` select column), S26 (`FilterPanel` chip close label) and S27 (`ExportMenu`)
  each change a component every app renders. S26 and S27 file the two items the first pass noted as "observed in
  passing … whichever unit meets them next can file them".
- **Contradiction with an intent source (resolved by observation):** R1 bug 5 and the register's `TODO(Bn)` say the
  grid endpoint does not return `cronExpression`/`intervalPreset`, and the fix was parked on a backend ask that was
  never written. The live response carries `intervalPreset`, `cron` (not `cronExpression`) and `dueAt`, so S19 is
  client-only. The README's "the module is Slovak-only, do not add an EN locale" is also stale: both `.en.ts` files
  exist and render. Neither needs a batch. Both are notes for whoever next reads `prompts/_done/_common/reminders/`.
- **Contradiction between units (not yet absorbed):** unit 16's `reminders-user/B3` (date "to" bound), `A4` (chip
  "Close") and `P2` (sort tie-breaker) are the same defects as `reminders-admin/B4`, `A3` and `P1`. They are listed in
  S20, S26 and S23 as cross-unit duplicates so unit 16's triage closes them there. `reminders-user/B4`
  (interval row "—" on `/pripomienky/moje`) looks like `reminders-admin/B1` but is **not** the same cause: the
  personal `my-upcoming` projection genuinely omits `intervalPreset` (per the DTO header), so it stays a backend
  question for unit 16's triage.
- **Observed, not filed (unit's findings file, *Observed, not filed*):** a `RecurringInterval` reminder's local time
  moves with DST, because the series is a UTC instant (#23003: 10:00 in October, 9:00 November–March). This is a
  server rule in `Sydowwe.Reminders`. If the product wants wall-clock recurrence, it becomes an escalation (§S5) at
  that point. No client change either way.
- **Concurrency note:** the unit's draft spec was run once (global setup reseeds). Unit 16's files were last written
  minutes before, and no other `playwright-cli` session was live at the time.
