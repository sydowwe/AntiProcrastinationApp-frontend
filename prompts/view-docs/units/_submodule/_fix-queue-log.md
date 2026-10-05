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

## S1. Run history on job detail has a 0 px scroll box
> ✅ **FIXED 2026-10-04** (framework `ff91bec`). Took the local fix. `JobRunHistory`'s root is a
> `min(70vh, 900px)` flex column, its toolbar is `flex-shrink-0`, and the table is `flex-1-1` + `min-height: 0`. A
> definite height there makes the job page taller than the main area. Its parent is `SchedulerDetailPage`'s flex
> column, so the job page's own cards then shrank the S2 way. Both cards got `flex-shrink-0`. The orphaned alert got
> `flex-0-0`, because `VAlert` declares `flex: 1 1 0%` and shrink-0 alone leaves a zero basis at padding height (found
> on S18). The draft spec's *"the run-history grid shows its rows"* is now a real test, the replay test uses `.click()`,
> and the matching comment in run detail's `beforeEach` was left alone. **Verified** in the browser (`playwright-cli`,
> 1440×900): `/planovac/ulohy/59` measured `.v-table__wrapper` 524/524 (was 0/108), with its row on screen. The page
> scrolls (836/944), nothing is clipped, and the footer sits at the table's bottom. Grepped `BasicTable` under
> `modules/`. The other five mounts (the jobs list, the reminder register, upcoming, my reminders and dispatch history)
> all sit in a full-page `h-100 d-flex flex-column` container, so the chain is intact. Only the history page was
> measured (S18). The orphaned alert was checked with the job response routed to `isOrphaned: true`, since no real job
> is orphaned. The page was 1044 px of content in an 836 px column, the alert 84/84 (`flex-basis: auto`) and both cards
> unclipped. **e2e** (2026-10-04): `scheduler.draft.spec.ts` gave 19 passed and 12 skipped (the remaining `fixme`s),
> including the new run-history test and the replay `.click()`. Neither new test was run against the pre-fix
> framework to watch it fail.
- **Scope:** **[framework]** `src/_common/modules/scheduler/` (submodule commit + pointer bump)
- **Closes:** `scheduler/X1`
- **Root cause:** `BasicTable`'s root is `h-100 d-flex flex-column` and needs a definite-height flex parent (the
  contract `FW4` documented in `components.md › Data tables › Layout`). `JobRunHistory` is mounted in a plain `VCard`
  inside `SchedulerDetailPage`'s content-height `VContainer`, so `.v-table__wrapper` resolves to 0 px at every viewport:
  the header row and every data row are clipped, and the footer and toolbar intercept clicks. The jobs list works only
  because its own `VContainer` is `h-100 d-flex flex-column`. This is the same shape as the app's `F12`.
- **Files:** `component/JobRunHistory.vue` (root `div.d-flex.flex-column`, `BasicTable`), `view/SchedulerJobDetailView.vue:143-154`
  (the wrapping `VCard`), `component/SchedulerDetailPage.vue` (container).
- **What to change:** give the run grid a definite height inside the job page. Simplest: a fixed/min height on the
  `JobRunHistory` root (e.g. `height: min(70vh, 900px)`) with the table `flex-fill` + `min-height: 0`. Alternative:
  make the detail page a height-bounded flex column down to the card — but that also changes run detail's scrolling,
  so prefer the local fix.
- **Do not change:** `BasicTable`'s default layout (a framework-wide default; `FW4` chose documentation).
- **Verification:** `scheduler/X1` `Verify:`; also un-`fixme` *"the run-history grid shows its rows"* in
  `e2e/tests/scheduler.draft.spec.ts` and switch the replay test from `focus()`+Enter to `.click()`.
- **Risk:** any other framework page that nests `BasicTable` in a card has the same bug. Grep `BasicTable` under
  `src/_common/modules/` while you are there, but fix only what you measure.

## S2. Needs-attention children shrink — rollup card crushed
> ✅ **FIXED 2026-10-04** (framework `d21119c`). `flex-shrink-0` on every direct child of the page column: the header,
> spinner, count row, rollup card, all-clear card and list row. The load-error alert got `flex-0-0` (see S1's note on
> `VAlert`). The `d-sr-only` live region is absolutely positioned, so it is not a flex item and was left alone. The
> draft spec's B5 `fixme` became a real test, asserting the rollup card is not clipped. **Verified** at 1440×900 with
> the overdue list populated: the rollup card measured 104/104 (was 32/104), and the container scrolls (836/1668)
> instead of clipping. With `/scheduler-dashboard/health` routed, the all-clear branch showed every card at full height
> (rollup 104/104, all-clear 200/200), and a 500 showed the load-error alert at 60/60 (`flex-basis: auto`). Both fit
> inside the viewport, so they confirm the classes rather than exercise the squeeze. The B5 e2e test passes (in the
> S1 run above).
- **Scope:** **[framework]** `view/SchedulerNeedsAttentionView.vue`
- **Closes:** `scheduler/B5`
- **Root cause:** the page's `VContainer` is `d-flex flex-column ga-4` and, inside the app's height-bounded main area, a
  836 px scroll box holding 1596 px of content. Every child is `flex-shrink: 1`, and the rollup `VCard`
  (`overflow: hidden`) is the one that gives way — 32 px of a 104 px card.
- **Files:** `SchedulerNeedsAttentionView.vue:2-5` (container), `:118-176` (rollup card).
- **What to change:** `flex-shrink-0` on the container's direct children (the count row, the rollup card, the list
  row, the all-clear card), or drop `d-flex flex-column` for a plain block stack.
- **Verification:** `scheduler/B5` `Verify:` at 1440×900 with the overdue list populated.
- **Risk:** none beyond this view.

## S18. Reminder pages clip their own content — detail cards and the history notice shrink
> ✅ **FIXED 2026-10-04** (framework `7c048c2`). Detail and overview: `flex-shrink-0` on every direct child, keeping
> the flex column and its `ga-4`. History: the header row is `flex-shrink-0` and the alert `flex-0-0`. The first try,
> `flex-shrink-0` on the alert, changed nothing (16/44 px), because `VAlert` declares `flex: 1 1 0%`. A 0% basis that
> cannot shrink still renders as just its padding. The announcer is `d-sr-only` and absolutely positioned, so it was
> left alone; it reads 1/24 by design. `components.md › Data tables › Layout` gained a paragraph on the
> shrinking-sibling case and the `VAlert` basis. **Verified** as `adminUser`, since the seed's `primaryUser` gets 403
> on every reminder-admin endpoint. At 1440×900, `/pripomienky/register/23203` and `/23201` showed all six cards at
> full height (Content 277/277, was 192/277), and the container scrolls. On `/pripomienky/historia` the alert measured
> 44/44, the table filled the rest (696 px, which adds up to the 836 px column exactly), and the footer was flush with
> the table's bottom. At 1440×720, `/pripomienky/prehlad` had no card or alert with `scrollHeight > clientHeight`, and
> the history grid scrolled internally (458/497) with its footer at 704 px of 720. **e2e** (2026-10-04): the
> X1 and B6 `fixme`s in `reminders-admin.draft.spec.ts` became real tests (no clipped card on the recurring
> definition's detail; the history notice not clipped), and the file gave 47 passed and 11 skipped. **Not verified:** the
> overview's failure list was not long enough to need its own scroll area.
- **Scope:** **[framework]** `src/_common/modules/reminders/view/` — three containers
- **Closes:** `reminders-admin/X1`, `reminders-admin/B6`
- **Root cause:** the `scheduler/B5` shape (S2) again. Each page's `VContainer` is a `d-flex flex-column` inside the
  app's height-bounded main area, and its children keep `flex-shrink: 1`, so `overflow: hidden` children give way
  instead of the page scrolling. Detail: all six cards shrink below their content (e.g. Content 192/277 px), so key,
  lifecycle, due date, lead chips and recipients show only their top pixels at 1440×900, and the container does not
  scroll. History: the table is meant to fill (`h-100`), but the info `VAlert` above it shrinks to 16/44 px and its
  sentence disappears.
- **Files:** `ReminderDefinitionDetailView.vue:2-5`; `ReminderDispatchHistoryView.vue:2-5, 79-85`;
  `ReminderOverviewView.vue:2-5` (same container as the detail; not yet clipping, fix it in the same edit).
- **What to change:** detail and overview: drop `d-flex flex-column` for a block stack (keep the spacing), or add
  `flex-shrink-0` to every direct child. History: `flex-shrink-0` on the alert and the announcer row only. The table
  must keep filling.
- **Do not change:** S2's scheduler view, which is its own batch, or `BasicTable`'s layout contract (`FW4`).
- **Verification:** `reminders-admin/X1` and `B6` `Verify:` at 1440×900. Then open `/pripomienky/prehlad` at 1440×720
  and confirm no card has `scrollHeight > clientHeight` except the failure list's own scroll area.
- **Risk:** the history table's height. Check that its footer stays pinned and the grid still scrolls internally.

## S19. Reminder grid DTOs drop schedule fields the server sends
> ✅ **FIXED 2026-10-04** (framework `f103416`). `ReminderDefinitionGridResponse` maps `dueAt`, `intervalPreset` and
> `cron` → `cronExpression`. `UpcomingReminderGridResponse` maps `dueAt`, which is null on the personal route. Both admin
> views pass all four `ReminderScheduleDisplay` props with `:dueAt="item.dueAt"`, and the `TODO(Bn)` is gone.
> `hasLeadOffsets` counts only `offsetMinutes < 0`. `MyRemindersView` still passes `nextOccurrenceAt`, as the batch
> required. **Verified** as `adminUser` (seed dates had moved since the unit, so #23001 is now due 05.10): the
> register's #23003 reads "Monthly". #23001 reads "Due 05.10.2026 17:00:00" on both the register and upcoming, while
> Next occurrence reads 16:30. "With lead time" shows on #23101 and #23001 and not on #23002. Side effect, as intended:
> the paused and cancelled one-shots (#23004, #23005) now show their due date instead of a bare "One-shot", because
> they have no next occurrence to fall back on. A `RecurringCron` row is not in the seed. Its mapping was checked by
> feeding a `cron`-shaped row through `fromJson` in the page (→ `cronExpression` set, `dueAt` null), and the display
> path is the one Upcoming already used. e2e: B1, B2 (register and upcoming) and P4 are now real tests in
> `reminders-admin.draft.spec.ts`, read against the detail page's *Due at* rather than a hardcoded time.
- **Scope:** **[framework]** `modules/reminders/dto/response/{ReminderDefinitionGridResponse,UpcomingReminderGridResponse}.ts`,
  `view/{ReminderDefinitionsView,ReminderUpcomingView}.vue`
- **Closes:** `reminders-admin/B1`, `B2`, `P4`
- **Root cause:** the admin grid endpoints (`POST /reminder-definition/grid`, `POST /reminder-dashboard/upcoming`)
  now return the full definition row: `dueAt`, `intervalPreset`, `cron`, `anchorDate`, `endsAt`, `leadOffsets[]`,
  `recipients[]` and `payloadJson`. `ReminderDefinitionGridResponse.fromJson` maps eight fields and drops the schedule,
  so the register's recurring row reads "⟳ —". Neither DTO maps `dueAt`, so both views pass `nextOccurrenceAt` as
  "Due", which is the next lead-time nudge. #23101 reads "Due … 12:00" but is due at 13:00. The register's
  `TODO(Bn)` premise ("grid response has no cronExpression/intervalPreset") is stale, and no ask was ever written.
  Separately, `hasLeadOffsets = leadOffsets.length > 0` counts a lone `0` offset (the deadline itself) as a lead time.
- **Files:** `ReminderDefinitionGridResponse.ts:21-32`; `UpcomingReminderGridResponse.ts:60-81` (`:76`
  `hasLeadOffsets`); `ReminderDefinitionsView.vue:94-100` (and its `TODO(Bn)`); `ReminderUpcomingView.vue:120-125`.
- **What to change:** add `dueAt`, `intervalPreset`, `cronExpression` (wire key `cron`, the mapping Upcoming already
  uses) to the register DTO, and `dueAt` to the upcoming DTO. Pass all four `ReminderScheduleDisplay` props with
  `:dueAt="item.dueAt"` in both views, and delete the `TODO(Bn)`. `hasLeadOffsets` becomes "any offset < 0".
- **Do not change:** `MyRemindersView` / the personal `my-upcoming` projection. Per the DTO's own header it is a
  narrower route, and its missing `intervalPreset` is `reminders-user/B4`, escalated as §S6, not this.
- **Verification:** the three findings' `Verify:` blocks.
- **Risk:** the upcoming DTO is shared with `MyRemindersView`. `dueAt` is absent on that route, so it must default to
  `null` and the personal view must keep passing what it passes today.

## S20. Date-only filter bounds are sent as instants, so "to" excludes its own day
> ✅ **FIXED 2026-10-04** (framework `4920a5b`). The server compares `<=` in all three places
> (`ReminderDashboardQueries` for upcoming, my-upcoming and history; `ReminderDefinitionGridEndpoint`), so the
> end-of-day form was chosen, which needs no server change. New `dto/request/dateOnlyBound.ts` (`endOfLocalDay`). Each
> of the four filters has a `toJSON` that sends its `to` field as local 23:59:59.999. The filter object, the `from`
> bounds and the URL codec are unchanged. All eight date chips use `formatToDate`. The overview's `dueSoonRoute`
> comment was rewritten: the list can now exceed the card only by rows later on the window's last day than now.
> **Verified** as `adminUser`: `/pripomienky/nadchadzajuce?to=2026-10-05` lists #23101 and #23001 (05.10 16:30), and the
> request body carries `"nextOccurrenceTo":"2026-10-05T21:59:59.999Z"`. The chip reads "Next occurrence to:
> 05.10.2026". `/pripomienky/historia?from=2026-09-28&to=2026-09-28` keeps both 28.09 rows, and the chips show dates
> only. `MyReminderFilter` was checked by importing it through Vite in the page: `from` serializes to the start of the
> day and `to` to the end, and the object still holds midnight. On screen as `primaryUser`,
> `/pripomienky/moje?to=2026-10-05` keeps the 05.10 16:30 row, and its chip reads "Next occurrence to: 05.10.2026"
> (`reminders-user/B3`). e2e: B4/P8 on upcoming and history's B4 are real tests; the day is read off a row, not
> computed. **Not verified:** the overview card count against its drill-down.
- **Scope:** **[framework]** `modules/reminders/dto/request/{reminderFilterParams,*Filter}.ts`, the three list views'
  `chipFormatters`, `view/ReminderOverviewView.vue` (`dueSoonRoute`)
- **Closes:** `reminders-admin/B4`, `P8`, `reminders-user/B3` (the same codec, reached through `MyReminderFilter`.
  Observed: `?to` = 2 Oct sends `2026-10-01T22:00:00.000Z` and lists 0 rows, and the chip reads "… 0:00:00").
- **Root cause:** every date filter in the module is a `VDateInput` day, carried as a `Date` at local midnight and
  sent as that instant. The server compares instants, so an upper bound named "2 Oct" ends at the *start* of 2 Oct
  (`?to=2026-10-02` → `"nextOccurrenceTo":"2026-10-01T22:00:00.000Z"`, and #23001 at 02.10 16:30 is excluded).
  History's `to` has the same problem: `?to=2026-09-25` drops both 25.09 dispatches. The chips then print the bound as
  an instant ("… 03.10.2026 0:00:00"), which invites that same misreading.
- **Files:** `reminderFilterParams.ts:69-75` (`writeDate`/`readDate`); `ReminderDefinitionFilter`,
  `UpcomingReminderFilter`, `DispatchHistoryFilter`, `MyReminderFilter` (serialization of the `to` fields); chip
  formatters at `ReminderDefinitionsView.vue:281-288`, `ReminderUpcomingView.vue:265-272`,
  `ReminderDispatchHistoryView.vue:248-261`; `ReminderOverviewView.vue:411-415`.
- **What to change:** decide the wire meaning of a date-only upper bound once, for all four filters. Either send the
  start of the *next* local day (and confirm the server's comparison is `<`), or send local 23:59:59.999. Keep the URL
  codec as a calendar day. It round-trips cleanly and is not the bug. Chips use `formatToDate`, not `formatInstant`.
  First, read the server's comparison in `Sydowwe.Reminders` (`<` vs `<=`) and pick the matching option. If it is
  `<=` on an instant, the end-of-day form is the one that needs no server change.
- **Do not change:** the `from` bounds (start of day is right for them), or the URL param names that the overview
  drill-downs build.
- **Verification:** `reminders-admin/B4`, `P8` and `reminders-user/B3` `Verify:`; the overview's due-soon card count should now equal the
  upcoming list it links to, including a row due on the window's last day.
- **Risk:** the overview's due-soon link will gain rows that fall on its last day. That is the intent, since the source
  comment there already apologises for the mismatch. The timezone is the browser's, not the account's
  (`reminders-user/U3` asks about that separately).

## S21. Dispatch history renders a raw key for skip reasons the client does not know
> ✅ **FIXED 2026-10-04** (framework `60c85f0`). `SkipReason` now mirrors the server's eight members, in its order.
> Both locales gained `AlreadyDispatched`, `QuietHours`, `Cancelled`, `Other` and a `skipReasonUnknown` fallback
> (sk first). The caption goes through the new `useReminderFormat().formatSkipReason`, which checks the value against
> `AllSkipReasonList` before building the key. **Verified** as `adminUser`: the seed's QuietHours row (now 30.09, #23203)
> reads "Skipped / Quiet hours", and `main`'s text contains no `reminderDashboard.` substring (now an e2e test). **Not verified:** the
> unknown-value fallback live (no such row exists; it was read from source only).
- **Scope:** **[framework]** `modules/reminders/dto/enum/SkipReason.ts`, `_locales/remindersDashboard.{sk,en}.ts`,
  `view/ReminderDispatchHistoryView.vue:137-142`
- **Closes:** `reminders-admin/B5`
- **Root cause:** contract drift. The server's `SkipReason` (`framework/Sydowwe.Reminders/domain/enum/SkipReason.cs`)
  has eight members and the client four. The row renders `$t(\`reminderDashboard.skipReason.${item.skipReason}\`)`
  unchecked, so `QuietHours` shows as "reminderDashboard.skipReason.QuietHours". `Other` is written by the live
  scanner. Three more are "reserved" server-side.
- **What to change:** add `AlreadyDispatched`, `QuietHours`, `Cancelled`, `Other` to the enum and both locales (sk
  first). Route the caption through a helper that falls back to a generic "Skipped (other reason)" key for any value
  outside the enum, so the next server addition cannot leak a key.
- **Verification:** `reminders-admin/B5` `Verify:`.
- **Risk:** none.

## S22. A reminder has no identity on screen — row actions, detail heading, upcoming rows
> ✅ **FIXED 2026-10-04** (framework `dcd6b11`). `reminderLabel(row)` is exported from `useReminderFormat.ts` (and
> returned by the composable): `{subjectType} #{subjectId}`, else `#{id}`. The `{kind}` param became `{label}` on
> `reminders.a11y.{pause,resume,cancel,showDetail}For` and on `reminderDashboard.a11y.viewHistoryFor`, which now read
> "Pause reminder for Reminder #23001". `snoozeFor` / `dismissFor` keep `{kind}`, because `MyRemindersView` has no
> subject (§S6). `ReminderActionButtons` builds the label from the `reminderKey` it already receives, so no new prop
> was needed. The detail `h1` and final crumb use the label, with the kind as a monospace caption. The register's
> Subject cell uses the same helper. The upcoming caption is now a `RouterLink` to the definition. **Verified** as
> `adminUser`: on the register, the four Pause buttons have four distinct names (#23101, #23001, #23002, #23003), and
> Show detail and Cancel are likewise distinct. On upcoming, the four `link "Reminder #…"` go to
> `/pripomienky/register/233xx|232xx`, and clicking #23001 lands on `/23201` with h1 "Reminder #23001". `/23202` has
> h1 "Reminder #23002". e2e: A1 (register and upcoming), P3 and P5 are now real tests. The breadcrumb still shows
> "Reminder register" twice; that is `reminders-admin/B3`, which belongs to S5.
- **Scope:** **[framework]** `modules/reminders/view/{ReminderDefinitionsView,ReminderUpcomingView,ReminderDefinitionDetailView}.vue`,
  `component/ReminderActionButtons.vue`, locales
- **Closes:** `reminders-admin/A1`, `P3`, `P5`
- **Root cause:** every reminder is named by its `kind`, which is a type and not an identity. With six
  `PersonalReminder`s, all row actions share names ("Pause reminder PersonalReminder" ×4), every detail `h1` and final
  crumb reads "PersonalReminder", and the upcoming row, which does show `Reminder #23001` as a caption, is not a link.
  The register's Subject cell (`{subjectType} #{subjectId}`, linking to the definition) is already the identity the
  module uses. It just is not used everywhere.
- **Files:** `ReminderDefinitionsView.vue:127, 262-266` (`kindOf`); `ReminderUpcomingView.vue:107-117, 172, 245-249`;
  `ReminderActionButtons.vue` (aria-labels); `ReminderDefinitionDetailView.vue:21, 386`.
- **What to change:** one helper, `reminderLabel(row) → "{subjectType} #{subjectId}"` (fallback `#{id}`), in
  `useReminderFormat`. Use it in every row action's `aria-label` (existing `a11y.*` keys take `{kind}`, so rename the
  param or add a `{label}` variant), and as the detail `h1` and crumb, with kind as a caption. Wrap the upcoming
  caption in the register's `RouterLink`.
- **Do not change:** the Subject/definition-id split (intended per the unit prompt), or `RecipientChips` (no PII by
  design). Resolving a human title is `reminders-admin/O1`, which is deferred. Do not widen the helper to
  `MyRemindersView`: the personal `my-upcoming` row carries no `subjectType`/`subjectId`, so `reminders-user/B1` needs
  the server field asked for in §S6.
- **Verification:** the three findings' `Verify:` blocks.
- **Risk:** `e2e/tests/reminders-admin.draft.spec.ts` scopes rows by `getByRole('row', { name: /Reminder #…/ })`,
  which still works. Its fixme stubs for A1/P3/P5 can become assertions.

## S24. Dispatch history: an empty actions column, and a correction that names an id nobody can see
> ✅ **FIXED 2026-10-04** (framework `113fcaf`). P6: `:showActions="false"`; `BasicTable` already declared and
> forwarded the prop, so no pass-through was needed. P7: the server's `ReminderDispatchDto` carries only
> `reversesDispatchId`, so both ends of a correction are resolved against the loaded rows, with no fetch. The
> correction's chip reads "Corrects the {time} record" when the corrected row is on the page, and "Corrects an earlier
> record" otherwise (never an id). The corrected row gets a "Corrected by the {time} record" chip (`pen`,
> `secondaryOutline`), with a hint saying to read the two together. New keys `correctsEarlier`, `correctedBy`,
> `correctedByHint`; `corrects` now takes `{time}` (sk + en). **Verified** as `adminUser`: the header row is exactly
> Dispatched, Reminder ID, Outcome, Notification type, Recipients. The 28.09 21:00 row reads "Corrects the 28.09.2026
> 20:00:00 record", and the 28.09 20:00 Failed row reads "Corrected by the 28.09.2026 21:00:00 record". Under
> `?outcome=Reversed` the corrected row is filtered out, and the chip falls back to "Corrects an earlier record".
> e2e: P6 and P7 are real tests. **Not verified:** a correction split across a page boundary (only the filter case
> was exercised).
- **Scope:** **[framework]** `modules/reminders/view/ReminderDispatchHistoryView.vue`, locales
- **Closes:** `reminders-admin/P6`, `P7`
- **Root cause:** two presentation choices in the ledger's table. (P6) The table passes `hasEdit/hasDelete/hasCreate =
  false` and no `#additionalActions`, but `DataTable`'s `showActions` defaults to `true`, leaving a 42 px unnamed,
  empty column. (P7) The *Corrected* chip reads "Corrects #23501", a dispatch-row id, while no column shows dispatch
  ids and the next column uses `#n` for definition ids.
- **Files:** `ReminderDispatchHistoryView.vue:92-105` (table), `:127-135` (chip); `_common/component/dataTable/DataTable.vue:140`
  (`showActions`, read only).
- **What to change:** (P6) pass `:showActions="false"` and confirm `BasicTable` forwards it to `DataTable` (fallthrough
  attrs). If it does not, add the pass-through, since that is the framework-level fix. (P7) label the chip by the
  corrected row's time if the response carries it, else mark the corrected row itself ("Corrected by a later
  record"). A dispatch-id column is the fallback. Do not fetch per row.
- **Verification:** `reminders-admin/P6`, `P7` `Verify:`.
- **Risk:** P7 may need a field the response lacks (`reversesDispatchId` is there; its `dispatchedAt` may not be).
  If so, the row-marking option needs nothing new.

## S25. `BasicTable`'s select column checkboxes have no name (framework-wide component)
> ✅ **FIXED 2026-10-04** (framework `e46b50f`). `DataTable` overrides `header.data-table-select` (on
> `VDataTableServer`) and `item.data-table-select` (on its own `VDataTableRow`). Both are `VCheckboxBtn`s driven by
> Vuetify's slot props. The row calls `toggleSelect(internalItem, index, $event)`, exactly as Vuetify's default does,
> so shift-click ranges survive. New optional prop `itemLabel?: (item) => string` on `DataTable`, forwarded by
> `BasicTable`. New framework namespace `table` (`selectAll`, `selectRow` `{label}`, `selectRowById` `{id}`; sk + en),
> and `docs/components.md` documents both. The register passes `reminderLabel`. `TableGrid` defaults
> `showSelect = true` and passes no `itemLabel`, so its tables get the id fallback. **Verified:** as `adminUser`, the
> register's checkboxes read "Select all rows", "Select Reminder #23101" … "#23005".
> `getByRole('checkbox', { name: 'Select Reminder #23001' })` toggles that one row and the bulk bar appears ("1
> reminder selected"). The header then reports `aria-checked="mixed"`, select-all checks all six, and a second click
> clears them. App-side, as `primaryUser`, `/activity-settings/activities` (`ActivityTable`, `showSelect`, no
> `itemLabel`) reads "Select row 12027" …, and toggling one row checks it and puts the header in the mixed state.
> e2e: A2 is a real test, and the bulk-bar test now ticks the row by its checkbox's name. **Not verified:** shift-click
> range selection, and other apps' tables (only this app was checked).
- **Scope:** **[framework]** `src/_common/component/dataTable/BasicTable.vue` (+ `DataTable.vue`), `docs/components.md`.
  Its own batch under rule 4, because every `showSelect` table in every app renders these.
- **Closes:** `reminders-admin/A2`
- **Root cause:** Vuetify's `VDataTable` select column renders bare `VCheckboxBtn`s, and the framework does not override
  `header.data-table-select` / `item.data-table-select`. The register's select-all and all six row checkboxes are
  unnamed. The bulk bar they drive is carefully named, so the gap is only the checkbox.
- **What to change:** override both slots. Header `aria-label` from a framework key ("Select all rows"); rows from an
  optional `itemLabel?: (item) => string` prop, falling back to "Select row {id}". The register passes S22's
  `reminderLabel`. Document the prop.
- **Do not change:** selection semantics (`selected` as ids, the register's "only rows you can see" pruning).
- **Verification:** `reminders-admin/A2` `Verify:`; then one app-side `showSelect` table, if any exists (grep), still
  selects.
- **Risk:** overriding the select slots re-implements indeterminate / select-all behaviour. Use Vuetify's slot props
  (`allSelected`, `someSelected`, `selectAll`, `isSelected`, `toggleSelect`) rather than local state.

## S5. Detail-page breadcrumbs: duplicate crumb on job and reminder, stale crumb on run not-found
> ✅ **FIXED 2026-10-04** (framework `6154af1`, `524312a`). Took the shell-level option. `useBreadcrumbs` skips an
> extra whose `to` is already anywhere in the chain (not just the last nav crumb, so a view listing several ancestors
> is covered too), and `composables.md` documents it. Neither detail view needed a code change; their "is not a nav
> path" comments were reworded. Run detail resets the extra to `[jobsCrumb]` in its `catch`. **Verified** (in-app
> `$router.push`, `.v-breadcrumbs-item` texts): `/planovac/ulohy/10` → `Home › Scheduled jobs ›
> Portal.SuggestionPatternRefresh`; `/planovac/behy/61991` → `Home › Scheduled jobs › Portal.SuggestionPatternRefresh ›
> Run #61991` (all three links intact); then `/planovac/behy/999999` → `Home › Scheduled jobs`. As `adminUser`,
> `/pripomienky/register/23201` → `Home › Reminder register › Reminder #23001`, and a cold load of `/999999` →
> `Home › Reminder register`. **Found and fixed alongside** (framework `f63d62d`): `ReminderDefinitionDetailView`
> loaded in `onMounted` only, so an in-app push from one reminder id to another kept showing the first reminder,
> both page and crumb. It now watches `id`, clears the old reminder on a change, and ignores a superseded load
> (`fetchById` aborts its previous call, whose catch would otherwise set `'failed'`). Verified as `adminUser`:
> in-app 23201 → 23202 → 999999 → 23203 shows each reminder and its crumb in turn, the not-found card with no
> leftover reminder, and a 30 ms back-to-back push 23201 → 23202 settles on 23202 with no error card.
- **Scope:** **[framework]** `view/SchedulerJobDetailView.vue`, `view/SchedulerRunDetailView.vue`,
  `modules/reminders/view/ReminderDefinitionDetailView.vue:382-387`
- **Closes:** `scheduler/B3`, `scheduler/B4`, `reminders-admin/B3`
- **Added in the third pass:** the reminder detail makes the same assumption with the same comment ("the register
  list is not a nav path") and renders "Home › Reminder register › Reminder register › PersonalReminder", including
  on its not-found state. Whichever option below is taken must cover it too: with the shell-level de-dup it needs no
  edit, and with the per-view option it drops `registerCrumb` from both `setBreadcrumbExtra` calls. With two modules
  now affected, the shell-level option is the better bet.
- **Root cause:** both views own their `setBreadcrumbExtra` and both get it wrong in opposite directions. Job detail
  always prepends a *Scheduled jobs* crumb, on the premise that the jobs list is not a nav path, but this host's nav
  contains it and the shell's longest-prefix match (`F14`) already renders it, so it appears twice. Run detail sets
  its chain only on success, so a failed load keeps the previous run's chain.
- **Files:** `SchedulerJobDetailView.vue:208-214`, `SchedulerRunDetailView.vue:348-370`.
- **What to change:** decide once, for a *framework* module, whether the host's nav can be assumed to list the jobs
  page. If yes, job detail sets `[{ title: jobKey }]` only. If no (the safer default for other apps), have
  `useSetBreadcrumbExtra` / the shell drop an extra crumb whose `to` equals the last nav-derived crumb's, which fixes
  job detail with no per-host assumption. Run detail: reset the extra (to `[jobsCrumb]` or `[]`) in the `catch`.
- **Verification:** `scheduler/B3` and `B4` `Verify:`; `reminders-admin/B3` `Verify:`; confirm `/planovac/behy/61991`
  still shows the full three-crumb chain.
- **Risk:** the de-dup option touches the shell's breadcrumb composable — every app. If you take it, it is its own
  framework commit with a docs line in `composables.md`.

## S17. Framework routes outside any nav tree claim to be "Home" in the breadcrumb
> ✅ **FIXED 2026-10-04** (framework `7033ca2`). Re-checked after S5 as asked: the de-dup does not cover this (these
> views set no extra, and routes carry no title meta for a shell fallback), so the batch was still needed. Each view
> sets `[{ title: t('<heading key>'), to: route.path }]` in a `watchEffect`. The `to` is a deviation from the batch
> text: with it, S5's de-dup drops the crumb if a host ever lists the page in its nav, instead of rendering
> "Notifications › Notifications". `watchEffect` so the crumb follows a locale switch. **Verified:** `/notifikacie` →
> `Home › Notifications`, `/nastavenia/pripomienky` → `Home › Notifications & reminders`, `/pripomienky/moje` →
> `Home › My reminders`. Typecheck 0.
- **Scope:** **[framework]** `src/_common/modules/notifications/view/NotificationsView.vue`,
  `reminderPreference/view/ReminderPreferencesView.vue`, `src/_common/modules/reminders/view/MyRemindersView.vue`
- **Closes:** `notifications/P1`, `reminders-user/P1`
- **Root cause:** none of the three routes is in a nav tree (`/pripomienky/moje` is reached from the user menu), and
  `useBreadcrumbs.ts:49-59` gives such a route the home crumb alone, rendered as the current page.
- **What to change:** `useSetBreadcrumbExtra([{ title: t('<heading key>') }])` in each view, from its own heading key
  (`reminderDashboard.my.title` for My reminders). That is the `F28` pattern.
- **Do not change:** `useBreadcrumbs`' fallback. Whether a nav-less framework route should get a generic crumb is the
  shell question S5 raised for the scheduler. If S5 takes the shell-level option, re-check this batch is still needed
  before doing it.
- **Verification:** `notifications/P1` and `reminders-user/P1` `Verify:`.
- **Risk:** none.

## S28. Snooze and Dismiss never reach the server, and once they do, the default snooze delivers early
> ✅ **FIXED 2026-10-04** (framework `4e385e5`, session 1). One commit for both halves, as required. (X1) The fields
> are renamed to `reminderDefinitionId` / `occurrenceAt` with the constructor order unchanged, and the new
> `SnoozeOccurrenceRequest.test.ts` pins the serialized keys of both requests. (B2) The presets now count from the
> occurrence: *1 hour after it*, *The morning after (9:00)* and *A week after it* (same time of day). The keys were
> renamed `hourLater` / `nextMorning` / `weekLater`. The custom picker's `minDate` is the occurrence, `isValid`
> requires a time after the occurrence **and** after now, and the warning became `mustBeAfterOccurrence` (it names
> the occurrence). **Verified** (`playwright-cli`, `primaryUser`, `/pripomienky/moje`): Snooze on the 06.10 16:30 row
> offered 17:30 the same day, 07.10 9:00 and 13.10 16:30. Confirming it sent
> `{"reminderDefinitionId":23201,"occurrenceAt":"2026-10-06T14:30:00.000Z","snoozeUntil":"2026-10-06T15:30:00.000Z"}`
> → **204**. Dismiss on the 09.10 row sent `{"reminderDefinitionId":23202,"occurrenceAt":"2026-10-09T09:00:00.000Z"}`
> → **204**. As predicted, the snoozed row came back on the reload (§S7 / `B6`). The e2e run's global setup reseeded
> afterwards. The custom picker's floor, checked in a follow-up pass the same day on the 06.10 16:30 row: the date
> picker disables 05.10 and earlier, and 06.10 is the first selectable day. With nothing chosen, *Snooze* is disabled
> under "Choose a time after the occurrence (06.10.2026 16:30:00)." 06.10 at 10:00 stays disabled with the same
> warning. 06.10 at 18:00 enables it, with "You'll be reminded 06.10.2026 18:00:00." **Not verified:** the
> exact-match risk below was not observed, because the e2e seed's occurrences fall on whole minutes. **Found while
> investigating, not filed:** the server's `OccurrenceAt != NextOccurrenceAt` check is exact, and JS `Date` keeps
> milliseconds only. An occurrence stored with sub-millisecond precision (`DevReminderSeeder`'s `now.AddDays(…)`,
> or anything computed from `UtcNow`) would still get a 400 from the fixed client. If that shows up, it is a backend
> truncation ask, not a client bug.
- **Scope:** **[framework]** `modules/reminders/dto/request/{SnoozeOccurrenceRequest,DismissOccurrenceRequest}.ts`,
  `component/SnoozeDialog.vue`, `_locales/remindersDashboard.{sk,en}.ts`
- **Closes:** `reminders-user/X1`, `reminders-user/B2`
- **Root cause:** two causes, in one batch because they cannot ship apart. (X1) The two request DTOs serialize
  `reminderId` / `occurrenceInstant`. The server binds `ReminderDefinitionId` / `OccurrenceAt`
  (`Sydowwe.Reminders/application/dto/dashboard/{Snooze,Dismiss}ReminderOccurrenceRequest.cs`, confirmed in source
  this pass), so it reads id 0, the guard answers 404, and the client's 404 branch tells the user their own reminder
  is "no longer available" while the reload puts it straight back. Neither action has ever worked from
  `/pripomienky/moje`: the client DTOs date from 2026-08-05, the server's from 2026-08-07, and neither has changed
  since. (B2) `SnoozeDialog`'s presets are anchored to `now` (`:98-124`) and `in1Hour` is pre-selected (`:96`,
  `:149`), but every row on the page is a *future* occurrence. The server accepts any future `snoozeUntil`, and the
  scanner then skips the original send for that recipient (`SkipReason.Snoozed`). So the default "snooze" moves a
  reminder **earlier, for good**. Observed in round 2: a 05.10 occurrence was delivered on 01.10. Today X1 is the only
  thing that keeps B2 unreachable. Fixing X1 alone would arm it.
- **Files:** as Scope; the call sites `MyRemindersView.vue:310-347` (read only, unless the constructor changes).
- **What to change:** (X1) rename the fields to `reminderDefinitionId` / `occurrenceAt`. Keep the constructors'
  positional order so the two call sites do not move. Add a unit test asserting the serialized keys of both requests,
  because no test covers the wire shape today. (B2) anchor the presets to the occurrence: 1 h after it, 09:00 on the
  day after it, 1 week after it. Floor the custom time at the occurrence as well (`minDate` and validation). Reword the
  preset labels so "In 1 hour" does not still read as "from now" (sk + en).
- **Do not change:** the `_silent` on the two action requests, or the 404/400/500 branches. Unit 16's round 2
  settled that they work as coded (U2), and their copy is S30. Whether the *server* should refuse a `snoozeUntil`
  earlier than the occurrence is §S7's question, not this batch's.
- **Verification:** `reminders-user/X1` `Verify:` (real 204s, request body keys) and `B2` `Verify:`. X1's Verify
  writes to the database, so reseed afterwards (`POST /api/test/seed`) and sign in again.
- **Risk:** once X1 lands, §S7 (`B6`) is what the user sees next: the row drops, then comes back within ~300 ms with the
  reload, and can be acted on again. Say that in the framework commit. Order: one framework commit, or B2 first.
  Never X1 alone.

## S30. My reminders: the Dismiss confirm ignores Escape and names nothing; every 400 is "no longer in the future"
> ✅ **FIXED 2026-10-04** (framework `0d04853`, session 1). (A2) `:persistent="false"` on the Dismiss `MyDialog`.
> `SnoozeDialog` is untouched and still persistent. (P5) The body is now the default slot: the existing text plus an
> `InfoRow` with `formatInstant(activeOccurrence)`, the same layout as `SnoozeDialog`. There is no title yet (§S6).
> (P7) `actions.pastOccurrence` → `actions.occurrenceChanged`, "This occurrence has changed or passed — the list was
> refreshed." (sk + en). There is no branching on `errors.occurrenceAt`. **Verified** (`playwright-cli`): the Dismiss
> dialog shows "Occurrence 06.10.2026 16:30:00", Escape closes it, and focus returns to the row's *Dismiss* (S13 had not
> landed, and was not needed for this dialog). Snooze stays open on Escape. With `/dismiss` routed to a 400 carrying
> `errors.occurrenceAt`, the snackbar read the new copy. The new e2e tests cover all three. **Note:** the server has
> a third 400, `SnoozeUntil` not in the future, which the neutral copy does not describe. The dialog's `isValid`
> rules it out except under clock skew, so no copy was added for it.
- **Scope:** **[framework]** `modules/reminders/view/MyRemindersView.vue`, `_locales/remindersDashboard.{sk,en}.ts`
- **Closes:** `reminders-user/A2` (**Dismiss half only**. The Snooze half is dropped, see the log), `reminders-user/P5`,
  `reminders-user/P7`
- **Root cause:** the Dismiss confirmation is a template-declared `MyDialog` (`:160-168`), and FW1 step 1 missed it,
  so it is still `persistent` with no input to protect. It also names nothing: "This occurrence will no longer be
  delivered…", with no date, on rows that are otherwise identical. After an action, `handleActionError`'s 400 branch
  (`:361-367`) reports every 400 as "no longer in the future". The server sends 400 for two reasons: the occurrence
  has passed, **or** `OccurrenceAt` is no longer the pending occurrence because the page is stale. The second is the
  common one for a recurring reminder, and the list it reloads then shows the occurrence still ahead.
- **What to change:** (A2) `:persistent="false"` on the Dismiss `MyDialog`, per FW1's rule that an input-less
  confirmation closes on Escape. (P5) show the occurrence in the dialog body, reusing `SnoozeDialog`'s `InfoRow` with
  `formatInstant(activeOccurrence)` (and the row's title once §S6 lands). (P7) one neutral key for both 400 reasons,
  e.g. "This occurrence has changed or passed — the list was refreshed." (sk + en). Do not branch on the response's
  `errors.occurrenceAt` text, which is server prose.
- **Do not change:** `SnoozeDialog`'s `persistent`. FW1 (owner decision, 2026-09-23) kept it persistent on purpose,
  because it carries a custom-time form.
- **Verification:** `reminders-user/A2` `Verify:` for *Dismiss* only (Escape closes it, and focus returns to the row's
  *Dismiss*); `P5` and `P7` `Verify:`. The phase-5 spec should assert that *Snooze* **resists** Escape, the way
  `two-factor.spec.ts` does for its form.
- **Risk:** none.

## S29. Reminder tables render a failed load as an empty list, in Vuetify's words
> ✅ **FIXED 2026-10-04** (framework `639814a`, session 1). `useReminderTableErrors(fetchFilteredTable)` now returns
> `{ fetch, onError, loadFailed }`. `fetch` wraps the query with `_silent: true` (passed per call, so
> `useServerTable` is untouched) and clears `loadFailed` on success. `onError` sets it on a non-cancel failure and
> ignores cancellations. The new `ReminderTableNoData.vue` is the `#noData` body in all four views: *The list could not
> be loaded.* + *Try again* (`reload`), *Nothing matches the current filters.* + *Clear filters* (filtered = the
> filter's URL params differ from a default filter's), or the page's own empty copy under `table.empty.*`. The admin
> three got their own copy in the same commit, as the batch allowed. `TableResultAnnouncer` takes `failed` and
> announces the failure instead of a count. **Beyond the batch text:** a failed load also passes `[]` / `0` to the
> table, because `useServerTable` keeps the previous page's rows on error, and the failure state would otherwise never
> render after a page or sort change. **Verified** (`playwright-cli`): with `my-upcoming` routed to 500, the body read
> "The list could not be loaded. / Try again", the live region said the same, and no snackbar appeared. After
> `unroute`, *Try again* brought back 3 rows ("3 results found"). `?kind=NoSuchKind` showed the filtered-empty state,
> and *Clear filters* dropped the param and restored the rows. On `/pripomienky/register`, a routed 500 showed the same
> failure state. The unfiltered empty state was checked in a follow-up pass the same day by routing `my-upcoming` to
> `{"items":[],"itemsCount":0}` on a bare URL. The body read "No upcoming reminders." with no button, and the live
> region said "0 results found". The seed always gives the primary user rows, so this one needs a mocked response.
- **Scope:** **[framework]** `modules/reminders/composable/useReminderTableErrors.ts`, the four list views
  (`MyRemindersView`, `ReminderDefinitionsView`, `ReminderUpcomingView`, `ReminderDispatchHistoryView`),
  `component/TableResultAnnouncer.vue`, `_locales/remindersDashboard.{sk,en}.ts`
- **Closes:** `reminders-user/B5`, `reminders-user/P4`
- **Root cause:** no table in the module owns its no-data state. `reportTableLoadError` is "deliberately terminal",
  and its own comment hands the error state to R2, which never took it. So a 500 leaves `items` empty, the live region
  announces "0 results found", and the body shows Vuetify's "No data available". The same three words appear for an
  empty list and for a filtered-empty one. The only recovery is a page reload.
- **Files:** `useReminderTableErrors.ts:21-26`; `onError: reportTableLoadError` at `MyRemindersView.vue:222`,
  `ReminderDefinitionsView.vue:186`, `ReminderUpcomingView.vue:229`, `ReminderDispatchHistoryView.vue:221`;
  `_common/composable/table/useServerTable.ts:79-80` (read only).
- **What to change:** turn the helper into a small composable that returns an `error` ref, set on a non-cancel
  failure and cleared on the next successful load, and pass its handler as `onError` in all four views. Each table's
  `#no-data` slot then renders one of three states: load failed (a message plus *Try again* → `reload()`),
  filtered-empty (module copy plus *Clear filters*), or empty (module copy). The announcer stays quiet, or announces
  the failure, while `error` is set. Once the page states the failure itself, make the load `_silent` if
  `useServerTable`'s fetch path can carry the flag, so there is one report per failure (the S7 rule). P4's
  page-specific copy is for `/pripomienky/moje` ("No upcoming reminders"). Give the admin three the failure state, and
  their own empty copy only if it is decided in the same commit.
- **Do not change:** `useServerTable`'s contract. An `error` ref on the framework-wide composable is a rule-4 change.
  Keep it in the module until a second module needs it.
- **Verification:** `reminders-user/B5` and `P4` `Verify:`. The admin tables share the path by source (the same
  helper at four sites) but were not observed failing. Repeat B5's route-to-500 once on `/pripomienky/register`.
- **Risk:** the cancellation branch must stay silent and must not set `error`, because typing in a filter aborts
  in-flight loads.

## S4. Disabled Trigger / Replay explain themselves only via an unreachable `title`
> ✅ **FIXED 2026-10-04** (framework `62451f7`, session 4 — one commit for S4 and S6–S9, because the five batches
> share `JobRunHistory`, `SchedulerRunDetailView` and both locale files). `triggerBlockedReason` /
> `replayBlockedReason` in `schedulerFormat.ts` return the reason or `null` (they replace `replayTitle`). The two
> labelled header buttons (job detail Trigger, run detail Replay) get a visible `text-caption` line under them,
> linked by `aria-describedby`; the icon-only grid rows get a wrapper `span` that owns the `title`, plus an
> `d-sr-only` description. `scheduler.actions.cannotTriggerRemoved` added (sk + en), so a `Removed` job no longer
> reads "Trigger now". **Verified** (`playwright-cli`, `primaryUser`): `/planovac/ulohy/11` shows the disabled
> *Trigger now* with "A removed job cannot be triggered."; `/planovac/behy/52704` shows *Replay run* disabled with
> "This run cannot be replayed — its job has been removed."; on `/planovac/ulohy?status=Removed` each row's disabled
> trigger button has `aria-describedby` resolving to that text and its wrapper's `title` is the same string. I used
> the `span`-wrapper approach rather than `aria-disabled` for the grid rows, so no click-handler guard is needed.
> **Not verified:** the orphaned variant (`scheduler/U3`, no orphaned job exists).
- **Scope:** **[framework]** `component/JobActionButtons.vue`, `component/JobRunHistory.vue`,
  `view/SchedulerRunDetailView.vue`, `utils/schedulerFormat.ts`, both locale files
- **Closes:** `scheduler/B2`
- **Root cause:** Vuetify renders a disabled `VBtn` with `pointer-events: none` and removes it from the tab order, so a
  `title` on it is shown to nobody. The B3 gate work put every reason there. Separately, `triggerTitle` knows only the
  orphaned reason, so a `Removed` job's disabled Trigger is titled "Trigger now".
- **What to change:** add `scheduler.actions.cannotTriggerRemoved` (sk + en) and a `triggerTitle`-style helper beside
  `replayTitle`. Carry the reason somewhere reachable: visible caption text under the two labelled header buttons;
  for the icon-only grid rows, wrap the button in a `span` that owns the `title`, or use `aria-disabled` (still
  focusable) plus `aria-describedby`. Keep one approach for all three sites.
- **Verification:** `scheduler/B2` `Verify:` on `/planovac/behy/52704` (job 11, `Removed`) and `/planovac/ulohy?status=Removed`.

## S6. Ambiguous accessible names — run links and copy buttons
> ✅ **FIXED 2026-10-04** (framework `62451f7`, session 4). The run-history link takes
> `scheduler.a11y.showRunDetail` with `startedAtOf(item.id)`; `CopyIconButton` has an optional `label` prop
> (`scheduler.actions.copyLabeled` → "Copy {label}", `aria-label` and `title`), and the four call sites pass the row's
> own label. **Verified:** run 52704 exposes `Copy Job key`, `Copy Correlation ID` and `Copy Payload snapshot`; job 11
> exposes `Copy Job key`; the history grid links are named "Show detail of the run started at …".
- **Scope:** **[framework]** `component/JobRunHistory.vue`, `component/CopyIconButton.vue` + its three call sites, locales
- **Closes:** `scheduler/A1`, `scheduler/A2`
- **Root cause:** names were taken from visible text or a generic `title`. The run link's text is a relative time
  ("now", "2 minutes ago", repeated), and `CopyIconButton` has one fixed title for every value.
- **Verification:** `scheduler/A1`, `A2` `Verify:`.

## S7. Detail pages report a 404/500 twice (alert + interceptor snackbar) — scheduler and reminders
> ✅ **FIXED 2026-10-04** (framework `62451f7`, session 4). `_silent: true` on the job and run `fetchById`
> (`useEntityQuery.fetchById` forwards its second argument into the request config), on
> `ReminderDefinitionDetailView`'s `fetchById`, and on `fetchReminderOverview`. `MyRemindersView` needed nothing, as
> the queue said. **Verified by source and typecheck only:** `vue-tsc --build --force` is clean and the argument is
> spread after `silentConfig`. **Not verified in the browser:** the routed 404 / 500 / 503 paths (`scheduler/P3`,
> `reminders-admin/P2` `Verify:`) were not driven, so confirm there is no snackbar next to the page's own message.
- **Scope:** **[framework]** the two scheduler detail views' `fetchById`, `modules/reminders/view/ReminderDefinitionDetailView.vue`
  and `api/ReminderDashboardApi.ts` (`fetchReminderOverview`)
- **Closes:** `scheduler/P3`, `reminders-admin/P2`
- **Root cause:** S1 #2 made the page state the message (not-found / load-failed + *Try again*), but the requests were
  not `_silent`, so the interceptor also snackbarred. The overview polls every 5 min and on focus, so during an outage
  it would have snackbarred repeatedly.

## S8. Run detail presentation — retries called replays, idle *Show all*, CRLF blank lines
> ✅ **FIXED 2026-10-04** (framework `62451f7`, session 4). (P4) Copy is neutral in both locales: *Related runs*,
> *Re-run of*, *Re-runs of this run*. (P5) The toggle renders when `payloadExpanded || payloadOverflows`, where
> `payloadOverflows` is `scrollHeight > clientHeight` measured on the `<pre>` after render and by a `ResizeObserver`
> (only while collapsed, so an expanded block keeps its *Show less*). (P6) `errorMessageText` is
> `errorMessage.replace(/\r\n/g, '\n').trim()`. **Verified:** run 57272 (3-line payload, `pre` 86/86 px) has no
> *Show all*; run 60270's error text ends `…POSITION: 376` with no trailing newline; 60249 and 60270 show the
> *Related runs* heading. **Not verified:** the toggle *appearing* on a payload taller than 320 px — no run in the
> fixture has one. The blank line **between** the two error lines remains: it is the server's `\r\n\r\n`, which P6's
> `Verify:` (no trailing blank space, normalised `\r\n`) does not ask to collapse.
- **Scope:** **[framework]** `view/SchedulerRunDetailView.vue`, locales
- **Closes:** `scheduler/P4`, `P5`, `P6`
- **Root cause:** three small rendering choices on one page. (P4) The server records automatic retries and operator
  replays under one `replaysRunId`, and the card labelled all of them "replay". (P5) The expand toggle rendered whenever
  there was a payload, not when the payload overflowed its cap. (P6) The error message went into `pre-wrap` untrimmed.
- **Do not change:** per-row kind is not available without a contract change, so no per-child fetch.

## S9. Overdue / failed attention lists in no meaningful order
> ✅ **FIXED 2026-10-04** (framework `62451f7`, session 4). `AttentionJobList` derives `sortedItems`: with
> `timeField === 'nextRunAt'` ascending (most late first), `lastRunAt` descending, no time field by `jobKey`; a missing
> time sorts last and ties break on `jobKey`. **Verified:** `/planovac/pozornost` lists the overdue
> `history.timer-boundary.*` jobs in order of decreasing lateness (18 d 14 h → 18 d 11 h). **Not verified:** the failed
> and orphaned lists, which are empty on this fixture.
- **Scope:** **[framework]** `component/AttentionJobList.vue`
- **Closes:** `scheduler/P7`
- **Root cause:** the lists rendered the server's order, which is neither by key nor by lateness. A presentational
  sort of a complete list, not a server rule.

## S3. Jobs grid too wide — Next run and actions off-screen; default sort pushes a tie-breaker
> ✅ **FIXED 2026-10-04** (framework `21d230e`, session 3). (B1) The *Handler key* column is gone. It is a caption under
> the job key, shown only when it differs from the job key. On this fixture that is every per-instance
> `history.timer-boundary.*` row, so the information stays on screen. Dropping the column was **not enough**: the
> grid was still 54 px over, set by three no-wrap minimums (the unbreakable
> `Tracking.PurgeExpiredActivityTrackingEntries` key, 265 px; *Status*'s "Active + Overdue" chips; *Last run*'s
> outcome chip + relative time). Two more changes. First, `ScheduleDisplay` got a `compact` prop: the grid renders a
> one-shot as "One-shot" alone, because the instant is already the row's *Next run* (and *Last run* once it fires).
> The detail page keeps the full "once at …". Second, *Status* and *Last run* use `flex-wrap`, so their chip pairs
> stack under pressure instead of setting a minimum. The *Schedule* cell is `text-no-wrap`, so it really is one line.
> (P1) `defaultSortBy: [nextRunAt asc, jobKey asc]`.
> **Verified** at 1440×900, sidebar open, as `seed.adminUser`. Wrapper `clientWidth` 1094 = `scrollWidth` 1094, and
> *Next run* ends at 1258 and *Actions* at 1411 (≤ 1411) on pages 1, 2 and 3, and with `?perPage=100` (all 73 rows).
> A bare `/planovac/ulohy` keeps `location.search === ''`.
> **Not done:** the draft spec's two `fixme`s (`scheduler.draft.spec.ts:62, 66`) are left as stubs, like the earlier
> sessions' fixmes. *Actions* fits with 0 px to spare: a longer job key or a wider locale string brings the
> scroll back, and the next lever is breaking keys at their dots (`<wbr>`).
- **Scope:** **[framework]** `view/SchedulerJobsView.vue`, `component/ScheduleDisplay.vue`, `docs/modules/scheduler.md`
- **Closes:** `scheduler/B1`, `scheduler/P1`
- **Root cause:** (1) eight columns, with a 270 px *Handler key* and a wrapping three-line *Schedule*, overflowed a
  1094 px box. (2) `defaultSortBy` omitted the `jobKey` tie-breaker that `BasicTable` appends, so state ≠ default on
  every mount.
- **Do not change:** `BasicTable`'s tie-breaker push. The run grid's default already matched.

## S23. Reminder list default sorts omit `BasicTable`'s tie-breaker
> ✅ **FIXED 2026-10-04** (framework `5d03e01`, session 3). Register `[nextOccurrenceAt asc, ownerModule asc]`. Upcoming
> and my reminders `[nextOccurrenceAt asc, kind asc]`. **Verified:** bare `/pripomienky/register`, `/nadchadzajuce`
> and `/moje` keep `location.search === ''`, and `/historia` is still unaffected. The "no rank badge" half of
> `reminders-admin/P1`'s *Verify* is won't-fix by owner decision (Contradiction 5).
- **Scope:** **[framework]** `modules/reminders/view/{ReminderDefinitionsView,ReminderUpcomingView,MyRemindersView}.vue`
- **Closes:** `reminders-admin/P1`, `reminders-user/P2`
- **Root cause:** identical to S3 part (2).

## S26. `FilterPanel` chip remove buttons are all named "Close" (framework-wide component)
> ✅ **FIXED 2026-10-04** (framework `67d4a72`, session 8; S26, S27 and S31 share one framework commit because the
> three share `docs/components.md`). `ChipWithIcon` falls attrs through to `VChip`, so `FilterPanel` passes
> `:closeLabel="i18n.t('general.removeFilter', { label })"` (new `general.removeFilter`, sk + en, in the framework's
> `common` locales; `general` is deep-merged, so the app needs no key). **e2e grep done first** (`'Close'` across
> `e2e/`): every hit is a dialog's own Close (`weather-location`, `tracking-settings.draft`, `history-capture.draft`,
> `account-isolation`, the *Filter* dialog's Close in `reminders-admin.draft`) or a comment, and none targets a chip.
> `templateDayPlanner.spec.ts:70` describes a tag chip in a details form, which does not go through `FilterPanel`.
> Nothing broke. The `reminders-admin.draft` A3 `test.fixme` is now a real test. **Verified** (`playwright-cli`,
> `primaryUser`, `/pripomienky/moje?kind=Personal`): the chip's remove button reads "Remove filter: Kind: Personal" and
> nothing is named "Close". The un-run draft test uses `?status=Paused` as `adminUser`, which was not driven.
- **Scope:** **[framework]** `src/_common/component/FilterPanel.vue` + a framework locale key. Its own batch under
  rule 4.
- **Closes:** `reminders-admin/A3`, `reminders-user/A4`. The scheduler pass noted it unfiled (log, first pass).
- **Root cause:** the chips use `VChip closable` with Vuetify's default `closeLabel` ("Close"), so every chip's remove
  button has the same name, one that also reads as closing a dialog.
- **What to change:** `:closeLabel="t('<framework key>', { label: chip.label })"` → "Remove filter: Paused" (sk + en).

## S27. `ExportMenu` joins its open list into the button's name; items have no role (framework-wide component)
> ✅ **FIXED 2026-10-04** (framework `67d4a72`, session 8). **Deviation from the batch text:** the content was already
> teleported (`VMenu` has no `attach`, and nothing in `bootstrap/` sets one). The join comes from Vuetify's `aria-owns`
> on the activator, which pulls the open menu into the button's name-from-content. So the fix is an explicit
> `aria-label` (`export.button`) on the button, plus `role="menu"` on the `VList` and `role="menuitem"` on the two items
> (Vuetify gives them no role). **Verified** (`playwright-cli`, `primaryUser`, `/activity-history`): the open button is
> named "Export", with `menu > menuitem "Excel (.xlsx)"` and `menuitem "CSV (.csv)"`, and ArrowDown moves focus to the
> Excel item. **Not verified:** that Enter on an item downloads (not triggered, to avoid writing a file), and the
> admin-only grids (scheduler, reminder history). The draft spec's `getByText` still resolves; upgrading it to the role
> locator is left for whoever next edits it.
- **Scope:** **[framework]** `src/_common/component/ExportMenu.vue`. Its own batch under rule 4.
- **Closes:** `reminders-admin/A4`. The scheduler pass noted it unfiled, and it is now filed.
- **Root cause:** the open menu's content renders inside the activator, so the button's accessible name becomes
  "Export Excel (.xlsx) CSV (.csv)". The two formats are `listitem`s with no role, and only `getByText` reaches them.
- **What to change:** let `VMenu` render its content outside the activator (default attach/teleport), and make the
  formats a `VList` of items Vuetify gives `menuitem` roles (or explicit `role="menuitem"`). Check keyboard.

## S31. `DateTimePicker`'s time field loses its name whenever a label is passed (framework-wide component)
> ✅ **FIXED 2026-10-04** (framework `67d4a72`, session 8). `TimePicker` has a new `inputLabel` prop, forwarded as
> `aria-label` to the `VMaskInput` (Vuetify routes it to the `<input>`, not the wrapper). `DateTimePicker` passes
> `"{label} — {dateTime.time}"` when it has a label and nothing otherwise, so the unlabelled case keeps its visible
> "Time" label. **Verified** (`playwright-cli`, `primaryUser`, Snooze dialog → Custom time): the time input is
> `textbox "Remind me on — Time"` showing `00:00`. **Not checked:** other labelled `DateTimePicker` call sites. The
> batch's grep of `src/core` found none passing `label` on the same line as the tag, and none were looked for
> multi-line.
- **Scope:** **[framework]** `src/_common/component/dateTime/DateTimePicker.vue` (maybe `TimePicker.vue`),
  `src/_common/docs/components.md`. Its own batch under rule 4.
- **Closes:** `reminders-user/A3`
- **Root cause:** `:label="label ? '' : $t('dateTime.time')"` blanks the time half's label so the pair reads as one
  labelled field on screen. Nothing gave assistive tech that name back.
- **What to change:** keep the visual label empty, and give the time input an `aria-label` of
  `` `${label} — ${t('dateTime.time')}` ``, forwarded to the `<input>` by `TimePicker`.

## S15. Action toasts time out in 3 s, and so does the only Undo (framework-wide default)
> ✅ **FIXED 2026-10-04** (framework `825dfb4`). The default was chosen, not the local fallback: a toast with an
> `actionLabel` now defaults to `ACTION_SNACKBAR_TIMEOUT` (10000 ms) and a plain toast keeps `SNACKBAR_TIMEOUT`
> (3000 ms). Both are exported, and an explicit `timeout` still wins. All four action call sites (`QuietHoursCard`,
> `useNotifications`, `TodoListView`, `PlannerCalendarView`) get it with no change. `SnackbarComposable.test.ts` gained
> a defaults case (the plain-default and explicit-8000 cases were unchanged and still pass). `docs/composables.md`
> states the queue cost from *Risk*. **Verified** in the running app (`playwright-cli`, `primaryUser`): the real
> `Snackbar.vue` showed an action toast for 10.2 s and a plain one for 3.2 s. **Not verified:** the quiet-hours
> *Clear* → *Undo* flow itself. It was not driven, to avoid writing the seed account's quiet hours.
- **Scope:** **[framework]** `src/_common/composable/general/SnackbarComposable.ts` + `docs/composables.md`, or
  locally `QuietHoursCard.vue`. Its own batch because the real fix is a default.
- **Closes:** `notifications/A6`
- **Root cause:** `showSnackbar` gives every toast `config?.timeout ?? 3000` (`SnackbarComposable.ts:98`), including
  those with an `actionLabel`. `QuietHoursCard.clear()` made the snackbar's *Undo* the only recovery for switching
  quiet hours off, deliberately replacing a confirm, and passes no timeout. Measured: visible for ~3.1 s, not
  reachable by keyboard or screen reader in that time (WCAG 2.2.1).
- **What to change:** decide the default: action toasts default to ≥ 8 s (or to no auto-dismiss while they carry an
  action), and plain toasts stay at 3 s. Four call sites pass an `actionLabel` today: `QuietHoursCard.vue:349`,
  `useNotifications.ts:293`, and app-side `TodoListView.vue:495` and `PlannerCalendarView.vue:258`. None sets a
  timeout, so all four get the new default. If the default is not wanted, the minimum is `timeout: 10000` on the
  quiet-hours toast alone.
- **Risk:** a longer action toast holds the queue longer. `MAX_PENDING_SNACKBARS` never drops action toasts, so a burst
  of them now takes longer to drain. That is acceptable, but say it in `composables.md`.

## S13. Closing a dialog that mounted already open drops focus to `<body>` (framework-wide component)
> ✅ **FIXED 2026-10-04** (framework `60bef5b`). `MyDialog` records the opener in `onMounted` when the model is already
> true, as well as on the open transition. It also restores in `onBeforeUnmount`, which covers a `v-if`'d dialog
> unmounted in the same tick its model goes false (`MyRemindersView.handleActionError`'s 400 path does that).
> The restore skips an opener that is no longer `isConnected`, so the row-drop case stays with `restoreFocusAfterRowDrop`
> as the batch required. Each instance holds its own opener, so nested dialogs restore one level at a time.
> `docs/components.md` gained a *Focus return* bullet. **Verified** (`playwright-cli`, `primaryUser`):
> `/pripomienky/moje` row 1 *Snooze* → Enter → *Cancel* focuses that *Snooze* button. In the round-2 case, a snooze
> with `snooze` routed to 204 drops the row and focus goes to the heading. Opening *Snooze* on another row and pressing
> *Cancel* then focuses that row's button. `/notifikacie` trash → *Dismiss notification?* returns focus to
> `Dismiss notification Suggested for today` after Escape and after Cancel (the seed's first row is no longer *Test
> notification*). The template-declared, always-mounted Dismiss `MyDialog` still returns focus after Escape.
> **Not verified:** an app-side `confirm()` (to-do item delete). It goes through the same `DialogHost` path as the
> notifications confirm, so it was not driven separately. A real nested dialog was not exercised.
- **Scope:** **[framework]** `src/_common/component/dialog/MyDialog.vue`. Its own batch: every `confirm()` /
  `openDialog()` in the framework **and** the app goes through it, and so does every `v-if`'d template dialog.
- **Closes:** `notifications/A2`, `reminders-user/A1`
- **Root cause:** `MyDialog` recorded the opener in `watch(dialog, isOpen => …)` (`MyDialog.vue:144-151`), which fires
  only on a *change*. A dialog that is **mounted already open** never sees the open transition, records no opener,
  and has nothing to restore on close. Two shapes hit it: a `DialogHost` entry (`notifications/A2`), and a template
  dialog behind a `v-if` whose condition and model flip in the same tick, `SnoozeDialog v-if="activeOccurrence"`
  (`reminders-user/A1` round 2).
- **What to change:** record the opener inside `MyDialog` when it mounts open, and restore it on close if the element
  is still connected. Capturing the element in `useDialog().openDialog()` alone is not enough, because it leaves
  `SnoozeDialog` broken.
- **Do not change:** `MyRemindersView`'s `restoreFocusAfterRowDrop`. It covers the case where the opener's row was
  deleted.
- **Risk:** nested dialogs. Restore must target the element that opened *that* dialog.

## S11. `DateTimeHelper` formatters speak only Slovak (framework-wide default)
> ✅ **FIXED 2026-10-04** (framework `2cbc085`). New `i18n/locale.ts` (`setLocaleSource` / `currentLocale`), registered
> by `installFramework` next to `setTranslator` from `i18n.global.locale`. It handles legacy mode (a string) and
> composition mode (a ref), and `AppI18n` gained `locale`. `DateTimeHelper` exports `dayjsLocale()`, resolved per call
> and lowercased: `SK` → `sk`, `EN` → `en`, `CZ` → `cs`. It falls back to `sk` when no source is registered or dayjs
> has no such locale loaded (CLAUDE.md framework rule 2). All nine `.locale('sk')` calls use it, and
> `getTranslatedMonths`'s default does too. **Choice made:** EN is dayjs's built-in US `en`, not `en-gb`, because
> `reminders-user/P6` and `scheduler/P2` ask for consistency with the date inputs, and Vuetify's `en` inputs ask for
> `mm/dd/yyyy`. Note that the app's own `localeTag` maps EN to `en-GB`. The format strings are unchanged except one:
> `groupNotificationsByDay` now passes `LL` instead of `D. MMMM YYYY`. That is not the per-consumer patch the batch
> warns against, because the root fix is in the helper. A fixed `D. MMMM` would render "28. September 2026" in EN,
> and `LL` gives "September 28, 2026" in EN and the same "28. september 2026" in SK. Unit test
> `DateTimeHelper.locale.test.ts` (fallback, switch, alias, unknown). `docs/utils.md` gained a *Locale* bullet.
> App-side, the stale comments in `src/i18n.ts` and `useRoutineDateFormat.ts` were corrected (no behaviour change;
> `useRoutineDateFormat` never used the helper). **Contradictions §22 in `docs/views/_fix-queue-log.md` is resolved.**
> **Verified** (`playwright-cli`, `primaryUser`, EN): in the running app `dayjsLocale()` is `en`, and
> `notificationDayLabel` for 2026-09-28 gives "September 28, 2026". `/pripomienky/moje` cells read
> `10/06/2026 4:30:00 PM`, matching the inputs' order. The day-planner header reads "Tu 01.09." (English weekday,
> fixed `dd DD.MM.` shape, which is an app-side follow-up if wanted). **Not verified:** a dated day header rendered
> on `/notifikacie` (the seed only has *Today* / *Yesterday* groups), the SK shape in the browser (covered by the unit
> test, since switching the seed account's locale would mutate it), `/activity-history` (the probe matched no date),
> and the e2e suite, which was not run. Run it at the next pointer bump that touches dates, as *Risk* asks.
- **Scope:** **[framework]** `src/_common/utils/DateTimeHelper.ts` + `src/_common/docs/utils.md`. Its own batch
  (batching rule 4: it changes what every app on the framework renders).
- **Closes:** `notifications/B2`, `scheduler/P2`, `reminders-user/P6`
- **Root cause:** every formatter in the file pinned dayjs to `'sk'`. `formatLocalized` was the sharpest case: a helper
  named *localized* that always spoke Slovak gave an EN account "28. september 2026" day headers on `/notifikacie`.
  Recorded app-side as *Contradictions* §22 (`docs/views/_fix-queue-log.md`).
- **What to change:** resolve the locale per call from the framework's registered i18n, falling back to `'sk'` when
  none is registered. Update `docs/utils.md`.
- **Do not change:** the format *strings*. Do not patch `groupNotificationsByDay` on its own.
- **Risk:** the widest-reaching batch in this queue. It changes visible dates in the planner header, history timeline
  and routine list for every EN account, and those screens' e2e specs may assert the Slovak shape.

## Closed escalations

### §S3 — the dispatcher counts undeliverable channels, so a muted type still reaches the inbox (`notifications/B4`)
> ✅ **FIXED 2026-10-05.** Decision: the server keeps the screen's promise (the ask's first option); the caption stays.
> **Server** (framework submodule, no migration): `NotificationService.NotifyAsync` clears `webPushIds` / `emailIds` when
> `PushNotificationOptions.IsConfigured` / `EmailNotificationOptions.IsConfigured` is false, before `activeIds` is
> computed. The dispatcher, the dispatch guards and `GET /notification-preference/channels` now read the same options. A
> side effect worth knowing: `ResolveDeferralsAsync` no longer stamps `DeferredUntil` for a channel that cannot deliver.
> `DispatchDeferred` already re-checked, so the flush path needed nothing. **No client change.** **Verified:** server
> `NotificationDeliverableChannelsTests` (3 for §S3 — muted + nothing deliverable writes no row; the same type with
> In-app on still lands; muted In-app with Push configured still writes the row) with `NotificationCatalogTests` and
> `NotificationLocaleTests`, 21/21 via `scripts/test.ps1`; live after the API restart, e2e `notification-delivery.spec.ts`
> (admin account, `Test` kind: untick In-app → PUT 204 + the caption, `POST /notification/test` leaves unread and the
> newest id unchanged and `/notifikacie?type=Test` shows nothing; control with In-app on is +1; re-ticking restores
> delivery). The specs skip themselves if Web Push is configured, because then the premise is gone. **Not run red-first:**
> the new server tests were written after the fix and not re-run against the old dispatcher.

Server: `framework/Sydowwe.Notifications/infrastructure/NotificationService.cs:63-75`. `activeIds` is the union of
recipients whose **stored preference** is on for InApp, WebPush or Email, with no check that the deployment has that
channel configured. Push is default-on for every type and unconfigured on this deployment. So a user who unticks a
type's In-app box still gets the history row and the hub push, while the settings screen, which discounts unconfigured
channels (`notificationPreferenceMatrix.ts`, `disabledChannels`), tells them "You will not get it at all — not even in
the notification list". Observed with `Test` (22104). The ask: intersect `webPushIds` / `emailIds` with the configured
channels, the same options `GET /notification-preference/channels` reads, before computing `activeIds`. Contract and
behaviour only. No client change is needed once it lands. If the server keeps today's behaviour, the client half is to
drop the silenced caption's "not even in the notification list" and count preferences rather than deliverable
channels, which contradicts the channels work (N12). Say which is intended.

### §S4 — `Test` is offered to every user as a delivery setting (`notifications/P5`)
> ✅ **FIXED 2026-10-05 — matrix and write path; the inbox type filter is not.** Decision: the catalog gate is by
> **role**, not environment, so it is testable in the e2e fixture (which runs in Development). **Server** (framework
> submodule, no migration): `NotificationCatalogOptions.AdminOnlyTypes` (+ `IsOfferedTo(type, isAdmin)`,
> `CatalogFor(isAdmin)`; empty by default, so a host that declares nothing is unchanged). `GET /notification-preference/mine`
> returns `CatalogFor(User.IsAdminOrHigher())`, `UpdateNotificationPreferenceRequestValidator` refuses a kind the caller
> is not offered (400, nothing stored), and `POST /notification/test` is now `GetAdminRole()`. That last one is a
> **behaviour change**: it was open to every account, though `domain-map.md` always said Admin+. This host sets
> `AdminOnlyTypes = [Test]` in `AddNotificationCatalog`. `Test` stays in `SupportedTypes`, so an admin still sees and can
> mute it. **No client change** for the matrix. **Verified:** server `NotificationDeliverableChannelsTests` (5 for §S4:
> user matrix has no `Test` but still has `PersonalReminder`; admin matrix has it on every channel; user PUT → 400 and no
> row; admin PUT → 204; `POST /notification/test` 403 as user, 204 as admin), 21/21 with the §S3 set; e2e
> `notification-delivery.spec.ts` (primary: no `Test` row or checkbox; admin: both present; primary's PUT → 400 and POST →
> 403 with unread unchanged). `notifications.draft.spec.ts`'s `P5` `fixme` is gone, pointing here.
> **Not done:** the `/notifikacie` Type filter still lists *Test* for everyone, because it is built from the app's
> registered `notificationTypeMeta`, not from the server. Hiding it needs either a per-account catalog read in the inbox or
> a client-side admin check, and the notifications README warns against the second (it once hid `TimerBoundary`).
> Left as is. **Also not done:** `ScheduledJobFailed` / `ScheduledJobOverdue` are Admin alerts too and are still offered
> to everyone; they are one `AdminOnlyTypes` entry each if the product wants them hidden.

Server: the notification-type catalog behind `GET /notification-preference/mine` includes `Test`, whose only producer is
the dev/QA `POST /notification/test` (`SendTestNotificationEndpoint.cs`). The client renders the catalog as given, on
purpose: the one time it filtered, it hid `TimerBoundary` (notifications README). So a non-admin sees a *Test* row
second in the matrix, and a *Test* option in the inbox's type filter. The ask: leave `Test` out of the catalog for
accounts that cannot raise it (or entirely outside Development). Catalog decision only. No client change is needed.

### §S2 — no reminder-kind catalog; the *Reminder types* card only ever shows its empty state (`notifications/B3`)
> ✅ **FIXED 2026-10-05.** Decision: the card keeps its promise, so the server gets the catalog, not the client a copy
> change. **Server** (framework submodule, no migration): `Sydowwe.Framework.Contracts.reminders.IReminderKindCatalog`
> (+ `ReminderKindDescriptor(OwnerModule, Kind)`) is the owner's declaration of the kinds it can raise, in the shape of
> `IReminderLabelResolver` (pure, synchronous, never throws). A declaration rather than a query because a kind is a free
> string on a registration, so a kind nobody has registered yet, or one the user has no reminder of, would be missing.
> `GET /reminder-preference` gains **`kinds`**: the declared kinds at their default (on), overlaid with the caller's stored
> rows, plus any stored row for an undeclared kind, so an opt-out stays visible and reversible. **`kindPreferences` is
> unchanged** (stored rows only), so `ReminderPreferenceAuthTests`' "set nothing → empty" assertion still holds and an
> un-updated client keeps working. This host declares `("Portal", "PersonalReminder")` in
> `PersonalReminderKindCatalog` (Planning), from `ReminderRegistrationService`'s constants so the two cannot drift.
> **Client:** `ReminderPreferenceResponse` carries `kinds` (falling back to the stored rows against a server that predates
> it) and `ReminderPreferencesView` hands that to the existing `ReminderKindList`; the empty-state copy no longer claims
> "you haven't changed any" (sk + en). The A7 switch name was already shipped. **Verified:** server
> `ReminderKindCatalogTests` (5) with the neighbouring reminder classes, 26/26 via `scripts/test.ps1`; client `type-check`
> exit 0, `ReminderPreferenceResponse.test.ts` (4); live after the API restart, e2e `reminder-kind-catalog.spec.ts` (4:
> off → PUT body + "Muted" + survives reload, back on is an explicit opt-in, a failed write reverts the switch, a server
> without `kinds` still renders) and the read-only `notifications.draft.spec.ts` B3 test, which replaced its `fixme`.
> Not done: the day planner's hint (`PlannerRemindersTab.vue`) was right all along once the switch exists.

Server: `framework/Sydowwe.Reminders/application/endpoint/preference/` has only `GET /reminder-preference` (the user's
stored overrides) and `PUT /reminder-preference/kind`. The client renders only stored rows, and nothing in `src/`
creates one except a toggle on a row that already exists. So the card's promise ("Mute a specific reminder type…")
can never be kept. The day planner's settings tab sends users to it to turn reminders off "for real"
(`dayPlanner.en.ts:27`, `PlannerRemindersTab.vue:32-37`). The ask: a catalog of the `(ownerModule, kind)` pairs this
deployment can raise, each with its effective `enabled`, either as `GET /reminder-preference/kinds` or folded into
`GET /reminder-preference`. That is the same shape as the notification-type catalog that `GET
/notification-preference/mine` already returns. **Client half after it lands:** render every kind from the catalog in
`ReminderKindList.vue`, drop the empty-state-only path, and carry S12's A7 name if S12 has not shipped. **`reminders-user/P3`
no longer waited on this** (closed 2026-10-05 with the interim). If the catalog lands, the *Kind* filter on My reminders
can come back as a select fed from it. That is optional, not a debt.

### §S6 — the personal reminder row has no recipient-safe identity and no interval (`reminders-user/B1`, `B4`)
> ✅ **FIXED 2026-10-05.** (a) landed with `reminders-admin/O1` (*Closed opportunities* below): not the notification
> render path but an owner-registered `IReminderLabelResolver` filling `MyUpcomingReminderDto.DisplayLabel`, with the
> payload still never crossing. Row text and both `a11y.*For` labels came with it (framework `81b82c1`). The Dismiss
> dialog's half: a *Reminder* `InfoRow` (`labelOf(activeReminderId)`, the same label-or-kind fallback the buttons
> use) above the occurrence, new key `reminderDashboard.reminder` (sk + en), framework `26e8693`. (b) is server-only:
> `MyUpcomingReminderDto` projects `IntervalPreset` and `Cron` (`Sydowwe.Reminders` `a983eea`, API `8b9581c`, pinned by
> the new `MyUpcomingScheduleTests`; no migration). The client already passed both to `ReminderScheduleDisplay` and
> `fromJson` already read `cron`, so the only client change was `UpcomingReminderGridResponse.ts`'s header comment.
> **Verified:** server — `MyUpcomingScheduleTests` + `ReminderDisplayLabelTests`, 3/3 (built to a separate artifacts
> path because the API under Rider locks `bin/`); client — `type-check` and e2e `typecheck` exit 0; live
> (`playwright-cli`, primary user) the Dismiss dialog on "Pay the rent" reads "Reminder: Pay the rent / Occurrence
> 10/17/2026 10:00:00 AM", Escape still closes it and focus returns to its button; e2e `the Dismiss dialog names the
> reminder it dismisses` passes. (b) **verified** after an API restart: the new e2e `the recurring-interval row
> states its interval` (it replaced B4's `fixme`) passes, so the "Pay the rent" row reads "Monthly".

Server: `Sydowwe.Reminders/application/dto/dashboard/MyUpcomingReminderDto.cs` returns `ownerModule, kind,
templateKey, scheduleType, nextOccurrenceAt, id` and leaves out `PayloadJson` on purpose, as a non-admin
data-exposure rule. So the three seed rows on `/pripomienky/moje` all read `PersonalReminder | Portal`, and six row
buttons name two things (B1). The interval row reads "⟳ —" (B4). The ask has two parts. (a) A recipient-safe display
title on the personal row. The server already renders one per recipient when the reminder fires (notification 22103:
"File the tax return"), so serving the same render path in the caller's locale needs no new data. (b) `intervalPreset`
and `cron`, neither of which is recipient-sensitive. **Client half after it lands** (a framework batch to append then):
render the title as the row's primary text, in both `a11y.*For` labels and in the Dismiss dialog (S30's P5). Pass
`intervalPreset` / `cronExpression` to `ReminderScheduleDisplay`. Correct `UpcomingReminderGridResponse.ts`'s header
comment, which says `MyRemindersView` renders none of the missing fields except `cronExpression`. It renders
`intervalPreset` too.

### §S7 — acted-on occurrences are invisible and repeatable; a snooze may land before its occurrence (`reminders-user/B6`, `B2`)
> ✅ **FIXED 2026-10-05.** All three parts are server-side in `Sydowwe.Reminders` (no migration). (a)
> `MyUpcomingReminderDto` carries `MyAction` (new wire enum `MyOccurrenceAction { Snoozed, Dismissed }`, or null) and
> `SnoozeUntil`. They come from the new `EffectiveOccurrenceActions`, which uses the scanner's rule (reversals and what
> they reverse are excluded, the latest `ActedAt` wins, the id breaks a tie). It is read per caller after the page is
> projected and matched to the row's *pending* occurrence only, so an action on a recurring reminder's earlier
> occurrence does not show. Like `DisplayLabel`, it cannot be sorted or filtered. (b) **A repeat dismiss is a no-op**:
> 204, nothing written. A refusal would turn a double-click or a retry into an error for a state the caller already
> has. Snoozing a dismissed occurrence is still accepted server-side (latest wins). (c) **Earlier is not valid**: a
> `snoozeUntil` at or before `OccurrenceAt` is a 400 ("SnoozeUntil must be after the occurrence it postpones."). So
> S28's custom-time floor stays, and it now matches the contract. The `SnoozeDialog` comment that called it the only
> guard was corrected. Module doc: `docs/summary.md` (snooze/dismiss endpoints, plus a new "says what they did to it"
> note). **Client half** (framework): `UpcomingReminderGridResponse` reads `myAction` / `snoozeUntil`, and new enum
> `dto/enum/MyOccurrenceAction.ts`. In `MyRemindersView`, a successful snooze or dismiss calls `markActiveRow()`
> (patch the row, quiet `reload()`) instead of `dropActiveRow()`, which is now used only on 404. The row shows O1's
> chip. A dismissed row renders **neither** action, not only no *Dismiss*: the copy calls a dismissal final, and a
> snooze would quietly undo it. `restoreFocusAfterRowDrop` became `restoreFocusIfLost`, which also covers the hidden
> buttons. **Verified:** server — new `MyOccurrenceActionTests` 5/5 (snooze reported, idempotent dismiss writes one
> row, latest wins, a reversed dismiss is ignored and re-dismissable, earlier snooze → 400), plus
> `MyUpcomingScheduleTests`, `ReminderSelfServiceAuthTests`, `ReminderDisplayLabelTests` and `SortKeyRejectionTests`,
> 31/31 in total (built to a separate artifacts path because Rider locks `bin/`). Client — `type-check` and the e2e
> `typecheck` exit 0. `playwright-cli` with `my-upcoming` mocked as the new server answers: a dismissed row reads
> "Dismissed" with no buttons, a snoozed one reads "Snoozed until 10/09/2026 12:00:00 PM" with both buttons, and an
> untouched one is unchanged. After *Dismiss delivery* (mocked 204) the row is marked at 100 ms and still marked after
> the reload, with focus on the heading. **Verified live 2026-10-05** against the restarted API: the e2e block
> `My reminders — acted-on rows` (freshSeed, reseeds after; it replaced U1's `fixme`) passes 2/2 — a real dismiss leaves
> the row reading "Dismissed" with no actions, a real snooze leaves "Snoozed until …" with *Dismiss* still enabled, and
> both survive a reload. In one full-file run the snooze test failed on a 401 from `POST /reminder-dashboard/snooze`
> (the cached auth state had outlived its ~15 min access token after the preceding reseeds). It is a fixture-session
> flake, not a defect: the same block passed on a rerun and the other 25 tests in that run passed.

Server: `GetMyUpcomingRemindersEndpoint.cs:40-41` filters on recipient only and ignores `ReminderOccurrenceAction`.
`DismissReminderOccurrenceEndpoint` does not check for an existing marker. `SnoozeReminderOccurrenceEndpoint.cs:50`
checks only `SnoozeUntil > now`. Observed with the real API: after a snooze of 23202 and a dismiss of 23201 (both
204), `my-upcoming` returned both rows unchanged, and 23202 was still offered after its snoozed delivery had fired.
A second identical dismiss also returned 204. The ask has three parts. (a) Project the caller's effective action onto
the personal row (`myAction: Snoozed | Dismissed | null`, `snoozeUntil`), using the same "latest non-reversed" rule as
`LoadEffectiveActionsAsync`. (b) Say whether a repeat dismiss is refused or a no-op. (c) Say whether a `snoozeUntil`
earlier than the occurrence is valid. Today it moves the delivery earlier for good, because the original send is then
skipped as `Snoozed`. **Client half after it lands:** replace `dropActiveRow()` + `reload()` with
`reminders-user/O1`'s chip ("Snoozed until …" / "Dismissed"), and hide *Dismiss* on a dismissed row. If (c) comes back
"earlier is valid", S28's B2 half still stands, because the *default* must not be earlier, but its custom-time floor
can go.

### §S1 — missed one-shot fires never recover; spent one-shots stay `Active` (`scheduler/B6`)
> ✅ **RESOLVED 2026-10-05** (server-side; no client change, as the ask predicted). The cause was not the missed-fire
> path. (1) A fired one-shot was never retired, so it stayed `Active` with `nextRunAt: null` (the 8); the dispatcher now
> sets it `Removed` once its occurrence is spent (`SchedulerSpentOneShotTests`, 6). (2) An alarm row deleted without a
> cancel (it cascades with its user) stranded its job: no row meant no boot re-registration, so it stayed `Active` and
> overdue (the 12). History's boot registrar now removes any alarm job with no row behind it, through the new
> `IScheduler.RemoveJobsNotInAsync` (`TimerBoundaryAlarmRegistrarTests`, 2). The e2e seed now deletes alarm jobs too,
> because its truncate restarts alarm ids and a kept job key was being re-used
> (`Seed_DeletesTimerAlarmJobs_AndKeepsEveryOtherSchedulerJob`). **Verified live after a restart:** all 62
> `History.TimerBoundaryAlarm` jobs read `Removed`, *Overdue / stuck* is 0, the default jobs list has 13 rows with no
> alarms. e2e: `scheduler-removed-jobs.spec.ts` (3). Original ask (c), whether History should still create alarms for
> long-ended timers, was answered by (2): they are now cleaned up rather than left stranded.

Original ask, unchanged: what `FireAndProceed` is contracted to do for a one-shot whose instant passed while the host
was down; which terminal status a one-shot takes after it fires; and, for the owning module (History), whether alarms
for timers that ended long ago should fire at all. Contract and behaviour only; any change had to keep existing `Active`
semantics for recurring jobs. Nothing client-side changed: the overdue chip and list were correct reports of a server
state.

## Closed verification items

### `notifications` — closed 2026-10-04
- **`U1`** ✅ — paging and "filtering never refetches page 1". 22 `Test` rows raised through the app's API client (28 total),
  then `/notifikacie?type=DeadlineApproaching` (a type present only past page 1): filtered-empty with *Load older*; one
  click sent `mine?beforeId=22105&limit=20`, the row appeared, the button went away. `mine?limit=20` fired once overall.
  Rows deleted afterwards (204). No batch results.
- **`U2`** ✅ — the row's due line. With `GET /notification/mine` routed to one row carrying `originallyDueAt`, it reads
  "Was due at 9/28/26, 8:30 AM" in EN / `Europe/Bratislava`, and the day header reads "SEPTEMBER 28, 2026" (also settles
  `notifications/B2` on a real header). Mocked, so it proves rendering only. The finding's "Originally due" wording was
  stale. No batch results.

### `scheduler` — closed 2026-10-05
- **`U1`** ✅ — does a Trigger from the jobs-grid row show the new run? Yes, for a fast job. As `primaryUser` (form
  sign-in), *Trigger job Portal.SuggestionPatternRefresh now* returned correlation `2999987a…`, and the one immediate
  `jobs-overview` reload already carried `lastRunAt 22:02:57.867`. Run history shows the same instant as the `Manual`
  run (id 75009, 11 ms), and the 10 s cron cannot explain it (22:02:57 is not a fire second). **Not covered:** a job
  slower than the reload round-trip would show the old *Last run* until the 120 s poll, and no slow harmless job exists
  to try. Re-open only if seen. No batch results.
- **`U2`** ✅ — do the pollers pause while the tab is hidden? Settled for the needs-attention poller with a *simulated*
  hidden tab: headless Chrome never reports hidden, so `document.visibilityState` was overridden and `visibilitychange`
  dispatched, which is what `usePolling` reads. On `/planovac/pozornost` (60 s): hidden 135 s → +0 `GET
  /scheduler-dashboard/health` (two polls would have fired); back to visible → +1 at once; 65 s later → +1. **Not
  covered:** the jobs list's 120 s poller (same composable, not run separately) and a real hidden tab, which needs a
  headed browser. ~~`reminders-admin/U1` stays open for that reason.~~ It closed 2026-10-05 on the same simulated
  basis: a headed `playwright-cli` tab never reports hidden either. No batch results.
- **`U3`** ✅ (closed 2026-10-05) — the orphan surfaces, untestable because no job was orphaned. Settled by a fixture
  row, not a test-only handler: the API's e2e seed (`e2e-v5`) now upserts `E2e.OrphanedFixtureJob` (`Active`, handler
  `E2e.RemovedHandler`, `nextRunAt` null) and one succeeded run of it, by key, in the scheduler schema the reset
  otherwise leaves alone. The ids are resolved per database and returned as `seed.scheduler` (75 / 75373 here).
  Server: pinned by `Seed_LeavesAnOrphanedJob_ThatTheScheduledReadsReportAsOrphaned` (health lists, job by id, run
  detail) and `Seed_Twice_KeepsOneOrphanedJobAndOneRun_UnderTheSameIds`. 31/31 in `TestSeedEndpointTests`.
  **Verified** in `e2e/tests/scheduler-orphan.spec.ts`, 8/8 against the restarted API: the grid chip, the
  row's disabled Trigger described as `cannotTriggerOrphaned`, the detail alert and chip, the header Trigger's
  visible reason, the run-history and run-detail Replay gates described as `cannotReplayOrphaned`, and the
  *Orphaned* attention list naming the handler key and linking to the job. All of them render as built, and no defect
  was found. No batch results.

### `reminders-admin` — closed 2026-10-05
- **`U2`** ✅ — the failure card's cap and "showing N of M". As `adminUser` (form sign-in), with
  `POST /reminder-dashboard/overview` routed to `failedNeedingAttention: 40` and 20 `failures` rows (the server-capped
  sample shape `OverviewFailureList`'s header documents), `/pripomienky/prehlad` rendered the headline **40**, **8**
  rows (`MAX_ROWS`), the line "Showing 8 of 40", and a link to `/pripomienky/historia?needsAttention=true`. The
  headline is the server's count, not `items.length`, and `total` in the line is read from `count`. Mocked, so it
  proves the client logic only. It does not prove the server's count equals the history list's `needsAttention` total
  (the seed's one real failure was settled by the unit). `reminders-admin/U1` stays open. No batch results.
- **`U1`** ✅ — the overview's 5-minute poll, its hidden-tab pause and the ticking freshness label. As `adminUser`
  (form sign-in) on `/pripomienky/prehlad` against the live API. **Visible:** loaded 00:56:40 local, label read "Updated
  just now" then "1/2/3 minutes ago" on each minute without a reload, and the poll's `GET /reminder-dashboard/overview`
  reached the server at 01:01:40, load + 5:00 to the second (API log). Left visible for about an hour afterwards: about
  12 polls, and the two that met an expired access token each went 401 → refresh → 200. **Hidden:** the same *simulated*
  hidden tab as `scheduler/U2`. A real one is not reachable: in a headed `playwright-cli` session a background tab still
  reports `visible` (tab 0 logged no `visibilitychange` with tab 1 in front), because of Playwright's focus emulation.
  Hidden for 6 min 19 s with `performance.timeOrigin` unchanged (no reload): +0 requests, although a poll was due at
  5:00. Back to visible: +1 at once, label "just now". **Not covered:** a real browser-hidden tab, and the poll
  restarting after a return. That run was cut when a concurrent e2e run's `POST /api/test/seed` revoked the session,
  as did two earlier attempts. Run this kind of check while no e2e suite is reseeding. **Server side:**
  `GetReminderOverviewEndpoint` is 7 aggregate reads, admin-gated (a non-admin state got 403), with no cache to go
  stale under a poll. The only unindexed predicate, `DispatchedAt >= now − 7 d`, scans a ledger that
  `PurgeExpiredReminderLedgersJobHandler` bounds, and `ReminderOverviewFailuresTests` pass (3/3). No backend change is
  needed. No batch results.

### `reminders-user` — closed 2026-10-05
- **`U3`** ✅ — do instants follow the browser's timezone rather than the account's? Settled by source, **not a defect**.
  `User.timezone` is a server-side field that `timeZoneSync.ts` keeps equal to the browser's zone (set from
  `Intl.DateTimeFormat().resolvedOptions().timeZone` on login, registration and Google sign-in, with no manual picker on
  purpose), so the two cannot differ for long, and `DateTimeHelper`'s local-zone dayjs needs no zone handling. **Not
  driven:** a `timezoneId: 'America/New_York'` browser run. Re-open it, and S20's date bounds, if a manual zone picker
  is ever added. No batch results.

## Closed opportunities

### `scheduler` — closed 2026-10-05
- **`O1`** ✅ — *Trigger now* fired on one click while *Replay* needed an acknowledged warning. It now opens a plain
  `useDialog().confirm` on the grid row and on the job detail. The confirm's `detail` line says what the button cannot:
  a paused job runs anyway and stays paused, and a run already in flight means a `disallowConcurrent` job's fire will
  likely be vetoed. That needed a server half, `ScheduledJobDto.RunningSince`, projected raw. It is worded "likely"
  because a server killed mid-run leaves the marker set. Framework `3fd289c` (client), `Sydowwe.Scheduler` `dfd999a`
  (server, pinned by two `SchedulerJobSignalsTests`). **Verified:** on `/planovac/ulohy/10`, Cancel sent no request and
  confirming sent one `trigger-now` → 200. **Mocked only:** the paused/in-flight line, checked on the grid with a routed
  `jobs-overview`, because the API under Rider ran the old build.
- **`O2`** ✅ — the jobs list was 58 % spent one-shot alarms. The list now hides `Removed` jobs by default and an
  *Include removed* switch (URL `removed=true`, chip) lifts it; an explicit `status` filter wins over the exclusion and
  disables the switch. Server: opt-in `ExcludeRemoved` on `ScheduledJobsOverviewFilterRequest`
  (`SchedulerJobsOverviewExcludeRemovedTests`, 3/3); the needs-attention *failed* "View all" lifts it because that list
  counts Removed jobs. Grouping one-shots by handler: not needed, since with `B6` fixed every alarm ends `Removed`.
  **Evidence:** `e2e/tests/scheduler-removed-jobs.spec.ts` covers hidden-by-default, *Include removed*, and
  `status=Removed`, and a bare list staying bare. **Verified 2026-10-05:** the spec passes 3/3 against the running app.

### `reminders-admin` — closed 2026-10-05
- **`O1`** ✅ — reminders were named by type and id everywhere. **Decision: server-side `displayLabel`, supplied by the
  owner, resolved at read time.** `Sydowwe.Framework.Contracts.reminders.IReminderLabelResolver` (keyed by template
  key, like `IReminderRenderer`; pure, synchronous, never throws, safe for admins *and* the reminder's own
  recipients) is called by `ReminderLabelService` after projection on every read that names a reminder: the register
  grid, the inspector, both upcoming routes, the dispatch history and the overview's failure sample. Nothing is
  stored, so no migration; the cost is that the label is not sortable or filterable. The PII question is answered by
  the contract: the owner decides, and only the owner can see its payload's meaning. This app's resolver
  (`PersonalReminderLabelResolver`, Planning slice) returns `PersonalReminderPayload.Title`. Client: `reminderLabel`
  prefers `displayLabel` and falls back to the subject (`reminderSubjectLabel`), which the register and Upcoming keep
  as a caption because two reminders may share a title; `ReminderActionButtons` takes a `label` prop; the dispatch
  history shows the label under the id; the overview failure row leads with it. `/my-upcoming` carries it too, which
  is **§S6 (a)** (row text and both `a11y.*For` labels, now `{label}`). **Verified:** server — the new
  `ReminderDisplayLabelTests` (2) plus the five neighbouring reminder classes, 50/50; client — `type-check` and the
  e2e `typecheck` exit 0. **Verified live** after an API restart (no migration): all six screens, as admin and as
  the primary user. **E2E:** seven new tests (register and Upcoming caption, breadcrumb, ledger row, overview failure
  row, and `reminders-user` B1, which replaced its `fixme`) pass, and so do the re-pointed register checkbox,
  row-action, heading and link tests. The two specs' other 11 failures are unrelated drift: the S11 locale dates
  (`10/07/2026 5:00:00 PM` against a `dd.mm.yyyy` regex), S23's bare URL, S31's second "Remind me on" textbox and the
  history empty-row text. Commits: `Sydowwe.Reminders` `13b1bd6` + API `26d5f8d` (server), framework `81b82c1`
  (client).

### `reminders-user` — closed 2026-10-05
- **`O1`** ✅ (the chip only) — the list could not show that an occurrence was already snoozed or dismissed. It was
  §S7's client half and landed with it (*Closed escalations* above). Each row shows *Snoozed until …* (clock,
  `primaryOutline`) or *Dismissed* (bell-slash, `warning`) under its title. New keys `reminderDashboard.my.snoozedUntil`
  and `.dismissed`, sk + en. **Not built:** a *Snoozed* filter, because `myAction` is filled after projection and the
  server cannot filter or sort on it, so it would need a query-side join first. Also an R10 §1 *Undo*: no reversal
  endpoint exists, and the Dismiss confirm still says it cannot be undone from here. Re-open either as its own
  opportunity if wanted.
- **`O1`** ✅ (the other two halves, 2026-10-05) — *Undo* and the *My action* filter, both built. **Undo:** `POST
  /reminder-dashboard/undo` (`UndoReminderOccurrenceActionEndpoint`) appends a `Reversal` row pointing at the caller's
  effective action, using the model's existing `ReversesActionId`, so nothing is deleted and the scanner reads it with
  the rule it already had. Idempotent (nothing to undo is a 204 that writes nothing). A snooze that has already come due
  is a 400, because the scanner re-delivers it at `SnoozeUntil` and a reversal would promise what the server cannot
  keep. Reversing a later dismiss re-exposes the snooze beneath it ("latest non-reversed wins"), pinned by a test.
  Client: a row-level *Undo* icon button on acted rows (no confirm dialog: it is the safe direction), shown only while
  the server would take it (`canUndo`: occurrence ahead, snooze not yet due); the Dismiss confirm now says "You can undo
  this from the list until the occurrence is due" instead of "cannot be undone from here". **Filter:** `myAction` on
  `UpcomingReminderFilterRequest`, honoured by `my-upcoming` only and computed **in SQL**
  (`EffectiveOccurrenceActions.WhereEffective`), so the pager's total counts the filtered set, which is what the log's
  earlier "needs a query-side join first" asked for. Client: `MyReminderFilter.myAction`, URL param `action`, a *My
  action* select and a chip. New keys `reminderDashboard.undo.*`, `a11y.undoFor`, `my.myAction`, `my.snoozed` (sk + en).
  **Verified:** server `UndoOccurrenceActionTests` (10: reversal row kept, idempotent, due-snooze 400, wrong occurrence
  400, other user's 404, filter by snoozed/dismissed with totals, latest-wins, self-scoped) with the neighbouring
  classes, 26/26; client `type-check` and e2e `typecheck` exit 0, `UndoOccurrenceRequest.test.ts` (key names, codec);
  live after the API restart, 7 new e2e tests in `reminders-user.draft.spec.ts` (undo of a dismiss and of a snooze, each
  surviving a reload; no Undo on an untouched row; keyboard reach; `?action=` for both values; the Filter dialog) and
  the re-worded Dismiss-copy test, all passing. `npm run lint` 0 errors.

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
5. **`reminders-admin/P1`'s *Verify* vs its own suggested fix** (found closing S23). The *Verify* passes when the
   default "is `nextOccurrenceAt:asc,ownerModule:asc` — and the Owner module header carries no rank badge on a fresh
   load". It cannot have both. A two-key sort is a multi-sort, and Vuetify ranks every key in it, so the declared
   tie-breaker still reads "Owner module 2" ("Kind 2" on upcoming and my reminders, "Job key 2" on the scheduler).
   The fix that shipped is the one S3 and S23 prescribed: the URL half. **Resolved 2026-10-04, owner decision:
   the badge half is won't-fix.** The badge was a defect only while it reported a sort nobody declared. Now it
   describes the view's real, declared order, which satisfies `scheduler/P1`'s *Expected* ("visible sort = the sort
   set"). Hiding the rank for a tie-breaker would hide true information, and it would be a `BasicTable` change in
   every app. `reminders-admin.draft.spec.ts`'s P1 fixme is re-titled to the URL check, and the badge is not to be
   asserted away.

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
  **Fixed 2026-10-05, without the catalog** (owner decision: take the interim). The labels never needed it, because
  `reminderKindLabel` already resolves `PersonalReminder`. The kind cell, its caption and both row-button names now go
  through that seam. The *Owner module* column (it read "App" on every row) and both free-text filters were dropped
  from `MyRemindersView` only. `myReminderFilterToParams` / `paramsToMyReminderFilter` stop reading and writing
  `module` / `kind`, so an old bookmark's param no longer narrows the list invisibly. The DTO keeps both fields because
  the server binds them and the class is exported. This is the first `reminders` → `notifications` import
  (`reminderLabels.ts`, a pure lookup). Docs: `docs/modules/notifications.md`, `SETUP.md`. **Verified** with
  `playwright-cli` (EN, `primaryUser`): headers `Kind | Schedule type | Next occurrence | Actions`, rows "Call the
  dentist / Personal reminders …", the Filter dialog has only *Schedule type* and the two dates, and
  `?kind=NoSuchKind&module=X` lists all 3 rows with no chip. The param stays in the address bar until the first table
  change, since `useTableUrlState` syncs on change only. e2e: the read-only block of `reminders-user.draft.spec.ts`
  passes, 21 passed and 3 fixme. Four stale assertions left by A3, P2 and P6 were corrected along the way.
  §S2 stays open for `notifications/B3`. If the catalog lands, the two filters can come back as selects.
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
