# notifications — findings

> Pass: inventory + mutation · captured 2026-09-30 / 2026-10-01 · commit `4d890646` · **framework unit** — every finding is `[framework]`
> (fix = a `vue_framework` commit + a pointer bump; never batch with app-side findings)

**Tally:** blocker 0 · bug 4 · a11y 7 · polish 6 · opportunity 0 · unverified 2  (19 entries: B1–B4, A1–A7, P1–P6, U1–U2)

**Status (2026-10-05):** 15 fixed (B1, B2, **B3**, A1–A7, P1–P4, P6) · 2 escalated to the backend (B4 → §S3, P5 → §S4) ·
U1 and U2 verified (pass). Fix batches are in `prompts/view-docs/units/_submodule/_fix-queue-log.md`.

**Cleanup (round 2):** the mutation pass toggled quiet hours on/off/undo and edited the window, unticked *Personal
reminder › In-app* and *Test › In-app*, created one reminder-kind row (`Portal`/`PersonalReminder`) and muted it, and
raised two `Test` notifications (22103, 22104). All of it was undone by `POST /api/test/seed` (200, fixture `e2e-v4`)
at the end. That reseed invalidates `e2e/.state/auth-*.json`, so the next agent must sign in, not `state-load`.

**Cleanup:** this pass created one notification — `POST /api/notification/test` → id **22119** (type `Test`) on `primaryUser`, to
settle the live-arrival question — and deleted it again with `DELETE /api/notification/22119` (204); unread count back to 10.
Nothing else was written: no read/unread toggles, no dismissals, no preference changes. Row 22118 (`RoutinePeriodEnded`,
21:10:03Z) was created by the backend's own routine job during the pass, not by this agent.

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-30 | `4d890646` | initial inventory pass |
| 2 | 2026-10-01 | `4d890646` | mutation pass, preferences only (`/nastavenia/pripomienky`). New: B4, A6, A7, P6. A4 extended to the states only reachable once quiet hours are on. U2 narrowed: in-app rows never carry `originallyDueAt` for a quiet-hours hold, by server design. Working as built, no finding: quiet-hours auto-save, debounce coalescing, the zero-length guard, the overnight and active-now copy, undo-restore, flush-on-unmount, revert-on-500 on both writable cards, matrix persistence, and the kind-row toggle + snackbar |

## Settled: `_shell` B1 — is a freshly-arrived notification English?

**Yes.** Not re-filed (it was closed 2026-09-21 after backend `B15`); recorded here because the unit prompt asked for it.
Signed in as `primaryUser` (locale EN) on `/notifikacie`, `POST /api/notification/test` (204) delivered a row over the
SignalR hub — badge 10 → 11, no REST refetch — reading **"Test notification / This is a test notification."** A
`RoutinePeriodEnded` row the backend created during the pass (id 22118, 21:10:03Z) was English too ("Period ended /
“Daily” has ended: 4 of 5 done. The streak was broken."), as were all six fixture rows. Evidence:
`screenshots/notifikacie--live-arrival-en.png`. The `docs/e2eTestSeed.md` warning that "the bell's text is Slovak
regardless of the account's locale" in the API repo is stale.

What *is* still Slovak on this screen is client-side date formatting — see B2.

---

### B1. The inbox never loads its list unless the SignalR handshake succeeds — a hub failure is a permanent, false "No notifications yet" [framework]
- **Status:** fixed 2026-10-03 (S10, framework `b038d3e`)
- **Severity:** bug
- **Where:** `/notifikacie` (and the bell) → `src/_common/modules/notifications/composable/useNotifications.ts:549-567` (`connect()` awaits `hub.start()` before `loadNotifications()`)
- **Expected:** the list and unread count are REST resources (`GET /notification/mine`, `/notification/unread-count`) and should load independently of the realtime channel; the hub only adds live arrivals. N6 asked for three distinct states — first run, filtered-empty, and "a failed load (retry)" — and the view codes all three. A screen that cannot distinguish "you have none" from "we never asked" is the false-empty-state class the view-docs README calls the dangerous one.
- **Actual:** with the hub negotiate failing (`playwright-cli route "**/hubs/notifications/negotiate*" --status 503`), no `GET /notification/mine` or `/unread-count` is ever sent. The page renders the **first-run** copy "No notifications yet. When something happens, you'll find it here.", the heading carries "Reconnecting...", the bell reads "Notifications, 0 unread" — while the account has 10 unread. `withAutomaticReconnect` does not cover a failed *initial* `start()`, and the catch only nulls `connectPromise` "to allow a later retry" that nothing triggers: **no second negotiate in ~2 minutes**, navigating away and back does not retry either (only an auth change calls `connect()`). The `loadError` + Retry state is unreachable in this path because `error` is never set. Milder form of the same gating, observed on the first load after sign-in against a freshly started API: the page showed "No notifications yet" + "Reconnecting..." + badge 0 for several seconds before the list appeared — the coded skeleton loader never shows, because `isLoading` is only set once the hub is up.
- **Evidence:** `screenshots/notifikacie--hub-down.png`; requests 4427–4432 (negotiate → 503, no notification requests follow); console `Notification hub connection failed: FailedToNegotiateWithServerError: … Status code '503'` at `useNotifications.ts:306` (compiled); with the route removed and a reload, `mine` + `unread-count` return 200 with 13 rows / `{"count":10}`.
- **Repro:** 1. Sign in, open `/notifikacie`, note N unread. 2. `playwright-cli -s=<s> route "**/hubs/notifications/negotiate*" --status 503`. 3. `reload`. 4. Wait any length of time.
- **Verify:** 1. With the negotiate route mocked to 503 as above, reload `/notifikacie`. 2. **Pass:** within a few seconds either the seeded rows render (the REST list loaded without the hub) with the bell showing the true unread count, or the card shows the "Could not load notifications" + Retry state — never "No notifications yet". 3. Remove the mock (`unroute`) without reloading and wait ~70 s: the hub connects on its own (a second `negotiate` request appears) and "Reconnecting..." disappears.
- **Root cause guess:** load sequenced behind the handshake in `connect()`; initial-start failure not covered by the retry policy; view uses `isConnected === false` to mean "reconnecting" even before the first connect.
- **Suggested fix:** in `connect()`, start `loadNotifications()` in parallel with `hub.start()` (or before it) rather than after; on a failed initial `start()`, schedule a retry with the same `reconnectForever` delays; label the pre-first-connect state "Connecting…" or hide it.

### B2. Day headers older than yesterday are formatted in Slovak on an English account — `formatLocalized` hard-codes `'sk'` [framework]
- **Status:** fixed 2026-10-04 (S11, framework `2cbc085`; EN gives "September 28, 2026" — checked through `notificationDayLabel`, not on a dated `/notifikacie` header, since the seed has only Today/Yesterday groups)
- **Severity:** bug
- **Where:** `/notifikacie` → day group header (`role=group` label, e.g. `group "28. september 2026"`) → `src/_common/modules/notifications/utils/groupNotificationsByDay.ts:46` → `src/_common/utils/DateTimeHelper.ts:102-104` (`dayjs(date).locale('sk')`)
- **Expected:** EN account → "September 28, 2026" (or the `Intl` equivalent), as the same view already does for `originallyDueAt` (`NotificationsView.vue:311`, `Intl.DateTimeFormat(locale.value.toLowerCase(), …)`). CLAUDE.md: SK primary, EN fallback — the account locale decides.
- **Actual:** "28. september 2026" — Slovak day-dot-month order (uppercased by CSS to "28. SEPTEMBER 2026"). September happens to be spelled the same in both languages; any other month will read Slovak ("28. október 2026"). "Today"/"Yesterday" are correctly English because they come from i18n.
- **Evidence:** `screenshots/notifikacie--default.png`; snapshot node `group "28. september 2026"`; source `DateTimeHelper.ts:103`.
- **Repro:** 1. Sign in as an EN account with a notification older than yesterday. 2. Open `/notifikacie`. 3. Read the third day header.
- **Verify:** 1. As `primaryUser` (EN), open `/notifikacie`. 2. **Pass:** the header above the 2026-09-28 rows reads in English month-first form (e.g. "September 28, 2026"), and switching the account to SK re-renders it as "28. september 2026".
- **Root cause guess:** `formatLocalized` (and `formatToTime24H`, harmless for `HH:mm`) pins dayjs to `'sk'`. Only two other callers exist — `src/core/historyDashboard/component/HistoryTimeline.vue` is one, so the same leak is probably live there (not checked in this unit).
- **Suggested fix:** take the locale from the registered translator / i18n instance inside `formatLocalized`, or add a locale parameter; update `docs/utils.md`.

### B3. "Reminder types" can never mute anything — the card lists only rows that already exist, and nothing creates one [framework]
- **Status:** fixed 2026-10-05 (§S2: the server declares the kinds through `IReminderKindCatalog` and `GET /reminder-preference` returns them as `kinds`; the card renders every kind, on by default. Verified live: e2e `reminder-kind-catalog.spec.ts` (4) and the read-only B3 test in `notifications.draft.spec.ts`; server `ReminderKindCatalogTests` (5))
- **Severity:** bug
- **Where:** `/nastavenia/pripomienky` → *Reminder types* card → `src/_common/modules/notifications/reminderPreference/component/ReminderKindList.vue:17-41`; the only caller of `upsertReminderKind` is `ReminderKindRow.vue:74-75`, i.e. an already-rendered row
- **Expected:** the card's own subtitle — "Mute a specific reminder type without silencing all of them" — and the page intro ("…mute individual reminders…"). The day-planner settings tab sends users here for exactly this: "Reminders delivered even with the app closed — including turning them off entirely, and quiet hours — live under *Reminder preferences*" (`dayPlanner.en.ts:27`), and its source comment names the `("Portal", "PersonalReminder")` row as "the single switch that stops a reminder from being delivered" (`PlannerRemindersTab.vue:32-37`). CLAUDE.md's ownership table puts per-kind muting in reminder preferences.
- **Actual:** `GET /reminder-preference` → `{"kindPreferences":[]}`, so the card shows only "You haven't changed any reminder type yet — you receive all reminders by default." There is no list of available kinds and no add control, and the backend offers no catalog (only `GET /reminder-preference` and `PUT /reminder-preference/kind` exist — `framework/Sydowwe.Reminders/application/endpoint/preference/`). A row can only appear if something outside this UI `PUT`s one first; nothing in `src/` does. For every user of this deployment the card is permanently the empty state, and the planner's pointer lands on a switch that does not exist. The closest real control is the *Personal reminder › In-app* cell in the delivery matrix, which is a different axis (per-type delivery, not per-kind firing) and which the page does not point to.
- **Evidence:** `screenshots/nastavenia-pripomienky--default.png`; response body of `GET /api/reminder-preference`; grep of `src/` for `upsertReminderKind` (one call site, inside the row); backend endpoint grep above.
- **Repro:** 1. Sign in as `primaryUser`. 2. Open `/nastavenia/pripomienky`. 3. Look for any way to mute a reminder kind.
- **Verify:** 1. On a fresh seed, open `/nastavenia/pripomienky` as `primaryUser`. 2. **Pass:** the *Reminder types* card offers at least the `PersonalReminder` kind as a switch (on by default) without any prior write, and toggling it off issues `PUT /api/reminder-preference/kind`. (Or, if the product decision is that the card only ever shows overrides, the subtitle no longer promises muting and the planner hint points at the control that does it.)
- **Root cause guess:** N12 built the delivery matrix on a server catalog (`GET /notification-preference/mine` returns the full product) but the older per-kind card never got the equivalent; the client has no list of `(ownerModule, kind)` pairs to render. Likely needs a backend ask (a catalog of kinds this deployment can raise, per the B4 shape) — to be written by whoever implements, per the backend-asks convention.
- **Suggested fix:** a `GET /reminder-preference/kinds` (or fold the catalog into `GET /reminder-preference`, returning every kind with its effective `enabled`), then render every kind.

### B4. Unticking a type's In-app box says "not even in the notification list", but the notification still lands in the inbox [framework]
- **Status:** escalated — backend ask §S3 in `_fix-queue.md` (dispatcher's `activeIds`; no client change if the server discounts unconfigured channels)
- **Severity:** bug
- **Where:** `/nastavenia/pripomienky` → *Notification delivery* → any row whose Push (or E-mail) default is on, e.g. *Test* / *Personal reminder* → In-app checkbox. Client: `NotificationTypeSettingsRow.vue:28-37` (the `row.silenced` caption), `notificationPreferenceMatrix.ts` (silenced = no *deliverable* channel on). Server: `Sydowwe.Notifications/infrastructure/NotificationService.cs:63-75` in the API repo.
- **Expected:** what the caption says, and what the usecase entity lifecycle and the row's own source comment rely on: with no channel that can reach the user, the server "writes no history row, so the notification never reaches the inbox either". A user who mutes a type expects it gone.
- **Actual:** the server builds `activeIds` from the stored *preferences* of all three channels and never asks whether the deployment can deliver on them. Push is default-on for every type and unconfigured here (`GET /notification-preference/channels` → WebPush `false`), so turning In-app off leaves Push "enabled", and the server still inserts the history row and pushes it over the hub. Observed: *Test › In-app* unticked (`PUT /notification-preference` `{"type":"Test","channel":"InApp","enabled":false}` 204). The row showed the caption "You will not get it at all — not even in the notification list". Then `POST /notification/test` → 204, unread 4 → 5, `GET /notification/mine?limit=1` → id 22104 `Test` at 22:26:43Z, and `/notifikacie` showed it under *Today, 00:26*. The screen tells the user the opposite of what happens.
- **Evidence:** `screenshots/nastavenia-pripomienky--test-muted-hint.png`; request 4471 body above; eval result `{"c0":"{\"count\":4}","s":204,"c1":"{\"count\":5}","topId":22104,"topType":"Test"}`; `/notifikacie` snapshot after navigation (group "Today", "● Test notification and 1 more", 00:26); source read of `NotificationService.cs:63-75` (no channel-configuration check before the insert).
- **Repro:** 1. Sign in as `primaryUser`, open `/nastavenia/pripomienky`. 2. Untick *Test › In-app*; the caption appears. 3. `POST /api/notification/test`. 4. Open `/notifikacie`.
- **Verify:** 1. On a deployment with Push and E-mail unconfigured, untick *Test › In-app* on `/nastavenia/pripomienky`. 2. `POST /api/notification/test` (204). 3. **Pass:** `GET /api/notification/unread-count` is unchanged and `/notifikacie` shows no new *Test notification*. (Or, if the product decision is that the history row is always written while any preference is on, the caption no longer says "not even in the notification list".)
- **Root cause guess:** a contract mismatch across the repos. The client's matrix discounts unconfigured channels (`disabledChannels`) and the server's dispatcher does not. The server already knows which channels are configured, because `/notification-preference/channels` reads "the same options its own dispatcher guards consult" (`NotificationTypeSettingsCard.vue:190-196`), but `NotifyAsync` does not apply them to `activeIds`.
- **Suggested fix:** backend: intersect `webPushIds` / `emailIds` with the configured channels before computing `activeIds`. No client change is needed once that lands; the caption is already right about what *should* happen.

### A1. The unread count is announced as "Badge" — the Unread filter's name is "Unread Badge" [framework]
- **Status:** fixed 2026-10-03 (S12, framework `40255f1`)
- **Severity:** a11y
- **Where:** `/notifikacie` → read-status group → `button[value=unread]` → `NotificationInboxToolbar.vue:13-22` (`VBadge inline`)
- **Expected:** the count is part of the control's meaning ("Unread, 10"); `MyBtnToggle` exists precisely to name these groups (F90).
- **Actual:** Vuetify's `VBadge` renders `<span role="status" aria-label="Badge" aria-live="polite">10</span>`; its `aria-label` replaces the number in name computation, so Playwright computes the toggle's name as **"Unread Badge"**, and a screen reader says "Badge" instead of the count. The snapshot lists the button with no name at all. `getByRole('button', { name: 'Unread' })` does not resolve uniquely (it also hits every row's "Mark as unread"), and `{ exact: true }` resolves nothing. The same `status "Badge"` node sits beside the bell in the top bar (the bell's own `aria-label` does carry the count there, so it is only redundant noise).
- **Evidence:** `playwright-cli click f9e204` echoed `getByRole('button', { name: 'Unread Badge' })`; badge outerHTML read by `eval`.
- **Repro:** 1. Open `/notifikacie` with unread > 0. 2. `playwright-cli snapshot` → the second button of `group "Filter by read status"` has no name; `generate-locator` gives "Unread Badge".
- **Verify:** 1. Open `/notifikacie` with unread > 0. 2. **Pass:** `getByRole('button', { name: /^Unread/ })` resolves to exactly one element whose accessible name contains the count (e.g. "Unread 10" / "Unread, 10 notifications") and not the word "Badge".
- **Suggested fix:** give the `VBadge` an `aria-label` carrying the count via `notifications.unreadCount`, or `aria-hidden` it and put the count in the button's `aria-label`.

### A2. Closing a `useDialog()` confirm drops focus to `<body>` instead of returning it to the button that opened it [framework]
- **Status:** fixed 2026-10-04 (S13, framework `60bef5b`; verified live: focus returns to the row's *Dismiss* after Escape and after Cancel. An app-side `confirm()` was not driven separately)
- **Severity:** a11y
- **Where:** `/notifikacie` → row trash button → *Dismiss notification?* → Cancel or Escape. Mechanism: `src/_common/component/dialog/MyDialog.vue:144-155` records `openerElement` in a `watch(dialog)` that only fires on a *change*; a `useDialog()`/`DialogHost` dialog is presumably mounted already open, so the open transition is never seen and there is nothing to restore.
- **Expected:** focus returns to the trash button (WAI-ARIA dialog pattern). `_shell/inventory.md` recorded exactly this working for a template-declared `MyDialog`.
- **Actual:** after Cancel **and** after Escape, `document.activeElement` is `BODY`. The keyboard user is thrown to the top of the document and must re-walk the list. Reproduced with a keyboard open (focus the button, Enter, Escape), not just a mouse click.
- **Evidence:** `eval` → `[false, "BODY", null]` after Escape; before opening, `activeElement` was `Dismiss notification Test notification`.
- **Repro:** 1. `/notifikacie`. 2. Focus the last row's *Dismiss notification …* button, press Enter. 3. Press Escape. 4. Read `document.activeElement`.
- **Verify:** 1. Same steps. 2. **Pass:** after Escape (and, separately, after clicking Cancel) `document.activeElement.getAttribute('aria-label')` is `Dismiss notification Test notification`.
- **Root cause guess:** affects every `confirm()` / `openDialog()` in both the framework and the app, not just this view — worth checking one app-side delete confirm before fixing.
- **Suggested fix:** in `MyDialog`, make the opener capture `{ immediate: true }` (or capture it in `useDialog().openDialog` before pushing the entry and hand it to the host).

### A3. Per-row controls repeat one name: every read toggle is "Mark as read" and every cluster is "Expand notification group" [framework]
- **Status:** fixed 2026-10-03 (S12, framework `40255f1`)
- **Severity:** a11y
- **Where:** `/notifikacie` → `NotificationRow.vue:72-80` (`:aria-label="readToggleLabel"`), cluster summary (`NotificationClusterSummary.vue`)
- **Expected:** the sibling *Dismiss* button already names its row ("Dismiss notification Period ended", `notifications.dismissItem`); a screen-reader user tabbing the buttons (after the first row they are the only Tab stops — see *Keyboard* in the inventory) needs the same context on the read toggle, and a cluster should say what it groups.
- **Actual:** 7 identical "Mark as read" and 4 identical "Mark as unread" in one list; the bulk bar's "Mark as read" shares the name too. The cluster is "Expand notification group" / "Collapse notification group" with no type or count.
- **Evidence:** accessibility snapshot of `/notifikacie` (not kept — `.playwright-cli/` is gitignored): `button "Mark as read" [ref=f12e267]`, `button "Mark as read" [ref=f12e289]`, … beside `button "Dismiss notification Deadline approaching"`; `listitem "Expand notification group" [ref=f12e241]`.
- **Repro:** 1. `/notifikacie`. 2. `playwright-cli find "Mark as read"`.
- **Verify:** 1. `/notifikacie`. 2. **Pass:** `getByRole('button', { name: 'Mark as read Deadline approaching' })` (or equivalent including the title) resolves to exactly one element, and the cluster's name contains "Timer finished" and the count.
- **Suggested fix:** a `notifications.markReadItem` / `markUnreadItem` pair taking `{ title }`, mirroring `dismissItem`; cluster label from the summary's own text.

### A4. Text and icons on the purple settings cards fail contrast — the "not set up on this server" notice is ~1.4:1 [framework]
- **Status:** fixed 2026-10-03 (S14, framework `5b2e76b`; light theme measured, dark not checked)
- **Severity:** a11y
- **Where:** `/nastavenia/pripomienky`, light theme → all three cards (`VCard color="secondary"`, `#7C3AED`): `QuietHoursCard.vue:2-11`, `ReminderKindList.vue:2-26`, `NotificationTypeSettingsCard.vue` (info `VAlert` + prepend icon)
- **Expected:** WCAG 1.4.3 — 4.5:1 for body text; 1.4.11 — 3:1 for meaningful icons. The info alert carries the one sentence explaining why two columns are disabled.
- **Actual (computed colours, contrast against `rgb(124,58,237)`):** info alert text `rgb(2,132,199)` ≈ **1.4:1** (unreadable in the screenshot); prepend icons `rgb(37,99,235)` (`color="primary"`) ≈ **1.1:1** — the moon / bell-slash / sliders glyphs are near-invisible; empty-state text `rgba(17,24,39,.72)` ≈ **2.4:1**; card subtitles white at `opacity .72` ≈ **3.7:1**. Titles (white) pass. **Round 2 (mutation):** the states only reachable once quiet hours are on are just as bad. These are the green "✓ Saved" status (`text-success`), the blue "Quiet hours are active right now…" line (`text-primary`), the primary-coloured switch track, and the reminder-kind row's `primaryOutline` "App" chip. All are read by eye, not measured, from `screenshots/nastavenia-pripomienky--kind-row-muted.png`. The "Saved" line is the card's *only* save confirmation (`QuietHoursCard.vue:58-61`).
- **Evidence:** `screenshots/nastavenia-pripomienky--default.png`, `…--delivery-matrix.png`; `eval` of `getComputedStyle` on `.v-alert__content`, `.v-card-item .v-icon`, `.text-medium-emphasis`, `.v-card-subtitle`.
- **Repro:** open `/nastavenia/pripomienky` in the light theme; read the blue notice above the table.
- **Verify:** 1. Open `/nastavenia/pripomienky` in the light theme. 2. **Pass:** the "Not set up on this server…" text and each card's subtitle measure ≥ 4.5:1 against their actual background, and the three card icons ≥ 3:1 (check with `getComputedStyle` as above, or any contrast checker on a screenshot).
- **Root cause guess:** N12 told its author to "match" `elevation="2" color="secondary"` from the two older cards, so the palette choice was copied rather than chosen; `primary`/`info` foregrounds were designed for a surface background, not for `secondary`. Dark theme not checked.
- **Suggested fix:** drop `color="secondary"` (surface cards like the rest of the settings screens) — or keep the tint and switch every foreground to `on-secondary`.

### A5. The 33 delivery-matrix checkboxes have no accessible name [framework]
- **Status:** fixed 2026-10-03 (S12, framework `40255f1`)
- **Severity:** a11y
- **Where:** `/nastavenia/pripomienky` → *Notification delivery* table → `src/_common/modules/notifications/component/NotificationTypeSettingsRow.vue:39-52` (`VCheckboxBtn`, no label)
- **Expected:** every interactive control has an accessible name (WCAG 4.1.2); the template treats an unnameable control as an a11y defect and an untestable element at once.
- **Actual:** snapshot shows `checkbox [checked] [ref=…]` with no name for every cell; `generate-locator` on the *Personal reminder › In-app* box returns `locator('#input-v-22')` — a generated id. The source comment (`:3-9`) argues this is deliberate: `scope="row"` + column headers let a screen reader announce the cell's headers, and an `aria-label` "would override the association and read the same words twice". Header announcement is real in table-reading mode, but it is not a name: forms-mode/Tab users, voice-control users ("click In-app Deadline approaching") and every test get nothing.
- **Evidence:** accessibility snapshot of `/nastavenia/pripomienky` (not kept — `.playwright-cli/` is gitignored): `rowheader "Personal reminder"` → `cell` → `checkbox [checked] [ref=f15e321]`, no name; `playwright-cli generate-locator f15e321` → `locator('#input-v-22')`.
- **Repro:** open the page, `playwright-cli snapshot`, look at any matrix checkbox.
- **Verify:** 1. Open `/nastavenia/pripomienky`. 2. **Pass:** `getByRole('checkbox', { name: /Personal reminder.*In-app|In-app.*Personal reminder/ })` resolves to exactly one element.
- **Suggested fix:** `aria-labelledby="<th id> <column header id>"` on each box — it names the control *from* the same headers, so nothing is read twice, and it keeps the comment's intent.

### A6. The quiet-hours *Undo* is on screen for ~3 s, and it is the only way back from switching them off [framework]
- **Status:** fixed 2026-10-04 (S15, framework `825dfb4`; action toasts now default to 10 s, measured 10.2 s. The quiet-hours Clear → Undo flow itself was not driven, to avoid writing the seed account's quiet hours)
- **Severity:** a11y
- **Where:** `/nastavenia/pripomienky` → *Enable quiet hours* switch off → snackbar "Quiet hours were cleared" + *Undo*. Source: `QuietHoursCard.vue:345-353` passes no `timeout`, so the toast inherits `SnackbarComposable.ts:98`'s `config?.timeout ?? 3000`.
- **Expected:** the card's own design makes the undo the recovery path, in place of a confirm dialog ("Recovery for the one destructive path is the undo in the snackbar, not a second button", `QuietHoursCard.vue:17-23`). A recovery control must be reachable in time: WCAG 2.2.1 (timing adjustable). Material's guidance for an action snackbar is 4–10 s, and an undo is commonly held until dismissed.
- **Actual:** measured with an in-page poll: the toast appeared 107 ms after the click and was gone at **3252 ms**. My first attempt, one CLI round-trip later, found no Undo button (`"getByRole('button', { name: 'Undo' })" does not match any elements`). A keyboard user has to Tab from the switch, past the time pickers and the matrix, to the teleported toast within three seconds. A screen-reader user hears "Quiet hours were cleared" and the toast is gone before *Undo* is announced. When clicked in time, the undo works (`PUT` + `GET`, "Quiet hours were restored").
- **Evidence:** eval result `{"was":false,"seen":107,"gone":3252}`; the failed click above; `screenshots/nastavenia-pripomienky--quiet-hours-off-undo.png`.
- **Repro:** 1. `/nastavenia/pripomienky`, switch quiet hours on, wait 4 s. 2. Switch off. 3. Count to four and look for *Undo*.
- **Verify:** 1. Same page with quiet hours on. 2. Switch off and do nothing. 3. **Pass:** the *Undo* button is still present after 8 s (or stays until closed), and `getByRole('button', { name: 'Undo' })` is clickable after one Tab from the switch or through a documented shortcut.
- **Root cause guess:** every action toast takes the plain toast's 3 s default. Of the four `actionLabel` call sites, only this one is an undo, but none of them sets a timeout. A default change in `SnackbarComposable` (e.g. action toasts default to ≥ 8 s) would be framework-wide.
- **Suggested fix:** local: `timeout: 10000` (or `-1`) on this toast. Framework-wide: give action toasts a longer default in `showSnackbar`, and write it in `docs/composables.md`. That is its own decision, because it affects every app.

### A7. The reminder-kind switch has no accessible name [framework]
- **Status:** fixed 2026-10-03 (S12, framework `40255f1`; source only, not re-run live — needs a kind row)
- **Severity:** a11y
- **Where:** `/nastavenia/pripomienky` → *Reminder types* card → each row's `VSwitch` → `src/_common/modules/notifications/reminderPreference/component/ReminderKindRow.vue:22-29` (no `label`, no `aria-label`)
- **Expected:** every control has an accessible name (WCAG 4.1.2), like the quiet-hours switch on the same page ("Enable quiet hours").
- **Actual:** snapshot `checkbox [checked] [ref=f7e258]` with no name. `generate-locator` → `locator('#switch-v-22')`, a generated id. The kind's name ("Personal reminders") and state ("Delivered") are sibling text, not associated. Only reachable after writing a row through the API (the card cannot create one — B3), which is why the inventory pass missed it.
- **Evidence:** `playwright-cli snapshot f7e246` (row subtree above); the click echoed `await page.locator('#switch-v-22').click()`; `screenshots/nastavenia-pripomienky--kind-row-muted.png`.
- **Repro:** 1. `PUT /api/reminder-preference/kind` `{"ownerModule":"Portal","kind":"PersonalReminder","enabled":true}`. 2. Open `/nastavenia/pripomienky`. 3. Snapshot the *Reminder types* card.
- **Verify:** 1. Same setup. 2. **Pass:** `getByRole('checkbox', { name: /Personal reminders/ })` resolves to exactly one element inside the *Reminder types* card.
- **Suggested fix:** `:aria-label="kindLabel"` on the `VSwitch` (or `aria-labelledby` the label span). Fold it into B3's rework if the card is rebuilt on a catalog.

### P1. The breadcrumb reads only "Home" on `/notifikacie` and `/nastavenia/pripomienky` [framework]
- **Status:** fixed 2026-10-04 (S17, framework `7033ca2`; verified: `Home › Notifications` and `Home › Notifications & reminders`)
- **Severity:** polish
- **Where:** top bar breadcrumb on both routes → `src/_common/composable/general/useBreadcrumbs.ts:49-59` (a route absent from every nav tree gets the home crumb alone, rendered as the current page)
- **Expected:** "Home › Notifications" / "Home › Notifications & reminders" — the same `useSetBreadcrumbExtra` mechanism `F28` used for `/activity-history/detail`.
- **Actual:** a single disabled "Home" crumb on both, i.e. each page claims to be Home.
- **Evidence:** `screenshots/notifikacie--default.png`, `screenshots/nastavenia-pripomienky--default.png` (top bar, right of the logo).
- **Repro:** open either route; read the breadcrumb.
- **Verify:** 1. Open `/notifikacie`, then `/nastavenia/pripomienky`. 2. **Pass:** the breadcrumb's last item reads "Notifications" and "Notifications & reminders" respectively — never "Home".
- **Root cause guess:** both views are framework routes outside the app's nav tree; likely true of other framework-module routes with no sidebar entry (not checked).
- **Suggested fix:** `useSetBreadcrumbExtra([{ title: … }])` in each view, from the heading's own key.

### P2. The filtered-empty state tells the user to "load older ones" when there is nothing older and no button [framework]
- **Status:** fixed 2026-10-03 (S16, framework `8c5dd57`)
- **Severity:** polish
- **Where:** `/notifikacie?type=ScheduledJobFailed` → empty state → `NotificationsView.vue:119-149`; copy key `notifications.emptyFiltered`
- **Expected:** the copy matches the actions offered: the *Load older* button only renders while `hasMore`.
- **Actual:** "None of the loaded notifications match this filter. Try loading older ones or clearing the filter." with only *Clear filter* beneath it (14 rows < page size 20, so `hasMore` is false).
- **Evidence:** `screenshots/notifikacie--filtered-empty.png`.
- **Repro:** open `/notifikacie?type=ScheduledJobFailed`.
- **Verify:** 1. Open `/notifikacie?type=ScheduledJobFailed` on the seed account. 2. **Pass:** the empty-state copy does not mention loading older notifications (or a *Load older* button is present).
- **Suggested fix:** two keys, chosen on `hasMore`.

### P3. The bulk dismiss confirmation is titled "Dismiss notification?" for 13 notifications [framework]
- **Status:** fixed 2026-10-03 (S16, framework `8c5dd57`)
- **Severity:** polish
- **Where:** `/notifikacie` → Select → Select all visible → Dismiss → `NotificationsView.vue:392-396` (`title: t('notifications.dismissConfirmTitle')`)
- **Expected:** a plural title, matching the body's "Selected notifications: 13".
- **Actual:** singular title over a 13-item body.
- **Evidence:** `screenshots/notifikacie--dismiss-many-dialog.png`.
- **Repro:** as *Where*; Cancel afterwards.
- **Verify:** 1. Same steps with ≥ 2 selected. 2. **Pass:** the dialog title is plural (e.g. "Dismiss 13 notifications?"); with 1 selected it may stay singular.

### P4. The type filter's labels do not match the titles on the rows they filter [framework]
- **Status:** fixed 2026-10-03 (S16: `ReminderDigest` in framework `8c5dd57`; the two routine types app-side in `src/app/notifications/notificationTypeMeta.ts`, because their titles are this app's backend overrides)
- **Severity:** polish
- **Where:** `/notifikacie` → Type select options (app-registered labels, `src/app/notifications/notificationTypeMeta.ts` via `notificationTypeLabel`) vs. row titles (server-rendered)
- **Expected:** picking an option finds rows that say what the option says.
- **Actual:** option "Routine ended" filters rows titled "Period ended"; "Routine ending soon" → "Period ending soon"; "Reminder digest" → "Reminders"; "Timer finished" → rows titled "Focus finished" / "Short break over" / "Timer finished".
- **Evidence:** options list read by `eval` (see inventory *Actions*); row titles in `screenshots/notifikacie--default.png`.
- **Repro:** open the Type select, compare with the list.
- **Verify:** **Pass:** each option label for the routine and digest types shares its key noun with the server title ("Period ended" ↔ "Period ended", or both say "Routine").
- **Root cause guess:** two vocabularies — app locale keys vs. the backend `NotificationTextRenderer`. Deciding which wins is a wording call, possibly on the backend side; the label keys are app-side (`src/app/notifications/`), so this one may be app-side rather than framework. The same labels head the delivery-matrix rows on `/nastavenia/pripomienky`.

### P5. A developer "Test" alert type is offered to users as a delivery setting [framework]
- **Status:** escalated — backend ask §S4 in `_fix-queue.md` (catalog decision; a client filter is the documented anti-pattern)
- **Severity:** polish
- **Where:** `/nastavenia/pripomienky` → *Notification delivery* → second row `rowheader "Test"`; also the `/notifikacie` Type filter's last option "Test"
- **Expected:** the settings screen lists alerts a user can actually receive in normal use. `POST /notification/test` is Admin-only ("send a Test notification to self (dev/QA)", `Sydowwe.Notifications/docs/domain-map.md:223`).
- **Actual:** "Test" sits second in the matrix, between *Deadline approaching* and *Reminder digest*, for a non-admin account, with a flask icon.
- **Evidence:** `screenshots/nastavenia-pripomienky--delivery-matrix.png`; `GET /notification-preference/mine` includes `{"type":"Test",…}` rows.
- **Repro:** open `/nastavenia/pripomienky` as `primaryUser`.
- **Verify:** 1. Open `/nastavenia/pripomienky` as `primaryUser`. 2. **Pass:** no row labelled "Test" (and no "Test" option in the `/notifikacie` Type filter), or the row is shown only to accounts that can raise it.
- **Root cause guess:** the row set is the server's deployment catalog (B4, landed 2026-08-27), which includes `Test`; the client deliberately renders whatever the server lists. So the fix is a backend catalog decision, not a client filter — the notifications README warns that the one time this client filtered, it hid `TimerBoundary`.

### P6. The quiet-hours card promises "we won't disturb you", but the bell keeps filling during the window [framework]
- **Status:** fixed 2026-10-03 (S16, framework `8c5dd57`; copy changed, server behaviour unchanged)
- **Severity:** polish
- **Where:** `/nastavenia/pripomienky` → *Quiet hours* subtitle (`reminderPreference.quietHours.subtitle`) and the active-now line (`reminderPreference.quietHours.activeNowToday` / `…Tomorrow`, `QuietHoursCard.vue:94-105`)
- **Expected:** copy that says what is held. The server holds (a) scheduled reminders, the whole occurrence, in the reminders scan, and (b) the **push and e-mail** copies of every other type. It never holds the history row or the in-app delivery (`NotificationService.cs:77-86` in the API: "InApp is never deferred … the notification is visible in-app immediately either way").
- **Actual:** the subtitle reads "A daily window during which we won't disturb you. Reminders that would arrive in this window are held…", and the active line "Quiet hours are active right now — a reminder arriving now will be delivered today at 00:30." With the window 00:00–00:30 active, `POST /notification/test` at 22:23:18Z (00:23 local) was in the inbox at once (id 22103, `originallyDueAt: null`), and the bell count rose. On this deployment, push and e-mail are unconfigured, so quiet hours have **no visible effect on any non-reminder alert**. The copy is literally true only if "reminder" means the Reminders module's kinds, a distinction the page never draws. Its intro and third card call everything "alerts".
- **Evidence:** `screenshots/nastavenia-pripomienky--quiet-hours-on.png`; eval result of the `mine?limit=3` read above (22103 `Test`, `createdAt` 22:23:18.79Z); API source cited above.
- **Repro:** 1. Enable quiet hours with a window covering now. 2. `POST /api/notification/test`. 3. Watch the bell.
- **Verify:** **Pass:** the quiet-hours subtitle or active-now line states that the in-app list still updates during the window and only reminders and push/e-mail are held (or the server starts holding in-app too, and the Repro shows no new row until the window ends).
- **Root cause guess:** the copy was written for the reminders scan (N10) before the dispatcher's quiet-hours posture (in-app exempt) was settled; the subtitle never caught up.
- **Suggested fix:** one sentence in both locales: "The notification list still updates; phone and e-mail alerts, and scheduled reminders, wait until it ends."

### U1. Paging (`Load older`) and "filtering does not refetch page 1" could not be exercised [framework]
- **Status:** verified 2026-10-04 — **pass**. Raised 22 `Test` rows through the app's own API client (28 total; first page 20), then opened `/notifikacie?type=DeadlineApproaching` (that type exists only in the seed rows past page 1). Page 1 showed the filtered-empty state with *Clear filter* + *Load older*. One click sent `mine?beforeId=22105&limit=20`, the *Deadline approaching* row appeared and *Load older* disappeared (`hasMore` false). Requests for the whole sequence: `mine?limit=20` once (no cursor) and the `beforeId` request once, so filtering did not refetch page 1. Only one *Load older* click was needed, not two (28 rows, not 45). The 22 rows (22103–22124) were deleted afterwards (204); the account is back to the six seed rows, 3 unread.
- **Severity:** unverified
- **Where:** `/notifikacie` → *Load older* (`NotificationsView.vue:199-206`, `loadMore()` in `useNotifications.ts`)
- **Claim (N3/N6):** the inbox pages older items via `beforeId`, filtering never refetches page 1, and the filtered-empty state keeps offering *Load older* while `hasMore`.
- **Why unverified:** the primary account holds 13–14 rows; the page size is 20, so `hasMore` is false and the button never renders. Filtering was observed to fire no request at all (consistent with the claim, but only on a single page).
- **What would verify it:** a fixture account with ≥ 21 notifications (ideally 45, three pages, with a type present only on page 3). Then: open `/notifikacie?type=<page-3 type>` → filtered-empty with *Load older* → click twice → the row appears; `requests` shows `mine?limit=20&beforeId=…` twice and `mine?limit=20` (no cursor) exactly once.

### U2. The "Originally due …" line for notifications held by quiet hours could not be seen [framework]
- **Status:** verified 2026-10-04 — **pass, with a copy note**. The server was not asked for a row: `GET /notification/mine` was routed (`playwright-cli route`, removed afterwards) to return one row, created 2026-09-28T07:00Z with `originallyDueAt` 2026-09-28T06:30Z. On `/notifikacie` (EN, `Europe/Bratislava`) the row's third line read **"Was due at 9/28/26, 8:30 AM"**: English, in the viewer's zone (06:30Z → 08:30), and the row's own time read 09:00. The finding's expected wording "Originally due …" is stale; the shipped string is "Was due at …". The day header above it read "SEPTEMBER 28, 2026", which also settles B2 on a real dated header (previously only checked through `notificationDayLabel`). Mocked, so this proves the rendering, not that a server ever produces the field.
- **Severity:** unverified
- **Where:** `/notifikacie` → row third line (`NotificationRow.vue:47-58`), formatted in the viewer's zone (`NotificationsView.vue:309-317`)
- **Claim (N10/B1 of the notifications set):** a notification deferred by quiet hours carries `originallyDueAt` and the row says when it was originally due, in the viewer's locale and zone.
- **Why unverified:** no seeded notification has `originallyDueAt` (all 13 rows `null`), and producing one needs a quiet-hours window plus a notification raised inside it — a preference mutation outside an inventory pass.
- **What would verify it:** one seeded row with `originallyDueAt` set (e.g. 2026-09-28T06:30:00Z on a row created at 07:00Z). Pass: the row shows a warning-coloured line "Originally due 9/28/26, 8:30 AM" (EN, `Europe/Bratislava`) — and, given B2, check it is English-formatted.
- **Round 2 — narrowed, still unverified.** The mutation pass could not produce such a row, and the server explains why. A notification raised inside quiet hours is **not** stamped: the in-app row goes out at once and only its push/e-mail copies wait (`NotificationService.cs:122-125`). `POST /notification/test` inside an active 00:00–00:30 window came back with `originallyDueAt: null`. The column is set only when a caller passes a due instant **and** the delivery is > 30 min behind it (`LateDeliveryPolicy.Threshold`). In practice that means a Reminders-module occurrence the scan held for over 30 minutes. A live repro needs a window of ≥ 35 min, a one-shot reminder due just after it opens, and a wait until it closes (~40 min). The seeded row above is still the practical route.

