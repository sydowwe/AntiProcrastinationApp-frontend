# Notifications prompts (`src/_common/modules/notifications/`)

Improvements to the framework's notifications module — the bell, the SignalR hub, Web Push, and the
reminder-preferences screen — plus the two files outside the module that belong to the same surface:
`public/sw-push.js` and `src/app/notifications/notificationTypeMeta.ts`.

One self-contained prompt per file, each written to be pasted into a fresh session in this repo.
`CLAUDE.md` auto-loads there, so the prompts carry only task-specific facts (paths, line numbers,
existing composables) rather than restating conventions.

## ⚠️ The submodule rule is suspended for this set

`CLAUDE.md` says `src/_common` is a git submodule and must never be edited. **The repo owner has
authorised editing it in place for this work.** Every prompt below repeats that authorisation inside
its own body, because a fresh agent reads `CLAUDE.md` and will otherwise refuse or "fix" things
app-side instead.

What this means in practice:

- Edit `src/_common/modules/notifications/` directly. Do not fork files into `src/`.
- Do not substitute a `migration-revision.md` entry for a fix you were asked to make.
- Do not touch anything under `src/_common` outside `modules/notifications/`, `_locales/common.sk.ts`
  and `docs/modules/notifications.md` without saying so in your final report — the framework serves
  other apps.
- The submodule commit/push is the owner's job. Report which `_common` files you touched.

## Index

| #   | Prompt                                                                | Kind         | Backend  | Model      | Effort   |
|-----|-----------------------------------------------------------------------|--------------|----------|------------|----------|
| N1  | [Correctness sweep ⭐](N1-correctness-sweep.md)                        | bug          | —        | Sonnet 5   | medium   |
| N2  | [Session lifecycle ⭐](N2-session-lifecycle.md)                        | bug          | possibly | **Opus 5** | high     |
| N3  | [Paging & unread count ⭐](N3-paging-and-unread-count.md)              | bug / perf   | **yes**  | **Opus 5** | high     |
| N4  | [Bell states & a11y](N4-bell-states-and-a11y.md)                       | UX           | —        | Sonnet 5   | medium   |
| N5  | [Deep-linking & the typeMeta seam](N5-deep-linking.md)                 | design       | **yes**  | **Opus 5** | high     |
| N6  | [Full notifications page](N6-notifications-page.md)                    | feature      | **yes**  | **Opus 5** | high     |
| N7  | [Snackbar storm & digest grouping](N7-snackbar-storm-and-grouping.md)  | UX / feature | possibly | **Opus 5** | high     |
| N8  | [Push subscription resilience](N8-push-resilience.md)                  | bug          | **yes**  | **Opus 5** | high     |
| N9  | [Reminder-kind label seam](N9-reminder-label-seam.md)                  | debt         | —        | Sonnet 5   | low–med  |
| N10 | [Quiet hours correctness & contract](N10-quiet-hours.md)               | bug          | **yes**  | **Opus 5** | high     |
| N11 | [EN locale coverage](N11-en-locale.md)                                 | bug / i18n   | —        | Sonnet 5   | low–med  |
| N12 | [Per-type notification settings](N12-notification-type-settings.md)    | feature      | **yes**  | **Opus 5** | high     |
| N13 | [Module doc refresh](N13-doc-refresh.md)                               | debt         | —        | Sonnet 5   | low      |

Each prompt is independently runnable. `Depends on` in each header is about avoiding merge pain, not
correctness. The ordering that actually matters: **N2 before N3/N4/N6** (it rewrites how the hub and
the module state are owned, which those three build on), **N3 before N6** (the page needs paging),
and **N5 before N6/N7** (they both render notifications and want the resolved route).

## The confirmed defects

- **The hub connects while signed out.** `NotificationBell` is mounted unconditionally in
  `App.vue:5`, and it calls `connect()` in `onMounted` (`NotificationBell.vue:107`). On the login and
  registration pages the SignalR handshake to `/hubs/notifications` runs with no auth cookie, fails,
  and logs `Notification hub connection failed:` — every single page load, before anyone has signed
  in. (N2)
- **Module state survives a user switch.** `useNotifications.ts:9-11` holds `notifications`,
  `isConnected`, `isLoading` as module-level refs. `authStore.logout()` (`authStore.ts:35-38`) resets
  the user and nothing else. `disconnect()` clears the list, but it only runs on the bell's
  `onUnmounted` — and the bell never unmounts, because it lives in `App.vue`. Sign out, sign in as
  someone else without a hard reload, and the previous user's notifications are still on screen.
  `usePushNotifications`' `isSubscribed`/`permission` (`UsePushNotifications.ts:13-15`) have the same
  shape. (N2)
- **`withAutomaticReconnect()` gives up permanently.** The default policy retries at 0s, 2s, 10s, 30s
  and then stops forever (`useNotifications.ts:70`). After a laptop sleeps through that window the
  bell is silently dead for the rest of the session — `onclose` sets `isConnected = false` and nothing
  reads it. (N2)
- **`GET /notification/mine` is unbounded.** `NotificationApi.ts:6` fetches every notification the
  user has ever received into a `VList` with `maxHeight="60vh"` (`NotificationBell.vue:45`). There is
  no limit, no paging, no archival. It grows without bound for the life of the account. (N3)
- **The unread count is derived from whatever happens to be loaded.** `unreadCount` is
  `notifications.value.filter(n => !n.isRead).length` (`useNotifications.ts:13`). It is correct today
  only *because* the fetch is unbounded — the moment N3 caps it, the badge starts under-counting. The
  two facts are load-bearing on each other and neither is written down. (N3)
- **`markAllRead` fires one PATCH per unread notification, in parallel.** `useNotifications.ts:58-61`
  → `Promise.all(unread.map(n => markRead(n.id)))`. With 200 unread that is 200 requests from one
  click. There is no bulk endpoint. (N3)
- **Errors are swallowed to `console.error`.** All four of `loadNotifications`, `markRead`, `connect`
  and `disconnect` catch and log. A failed load renders as "Žiadne notifikácie" — an empty *success*.
  `isLoading` is exported from the composable and read by nobody, so there is no spinner either. (N1,
  N4)
- **Click-through cannot reach the thing the notification is about.** `notificationRoute(type)`
  (`utils/notificationTypeMeta.ts:28`) is keyed on the type alone, so a `DeadlineApproaching` for one
  specific task routes to the reminders *list*. `NotificationResponse` (`dto/NotificationResponse.ts`)
  carries no entity id and no url. Meanwhile `public/sw-push.js:10` already reads `data.url` off the
  push payload — so the push path can deep-link and the in-app path cannot, from the same server-side
  event. (N5)
- **Every incoming notification pops a snackbar, unconditionally.** `useNotifications.ts:40-41`, with
  no throttle, no grouping, and no check for whether the bell menu is already open or the user is
  already looking at the target page. A `ReminderDigest` fan-out snackbars once per item. (N7)
- **`public/sw-push.js` has no `pushsubscriptionchange` handler.** Browsers rotate push subscriptions
  (Chrome does it on its own schedule); when that happens the endpoint stored server-side becomes
  dead and push stops silently. Nothing on the client ever notices or re-registers. (N8)
- **`notificationclick` focus matching is wrong for the common case.** `sw-push.js:25` —
  `client.url.includes(url)` with the default `url = '/'` matches *every* open tab of the app, so the
  click focuses whichever tab is first in the list rather than navigating anywhere. (N8)
- **The reminder-kind labels are another app's domain, hardcoded in the framework.**
  `_common/_locales/common.sk.ts:321-328` ships
  `ownerModule.{EmployeeModule, AttendanceModule, InventoryModule}` and `kindName.ProbationEnding`.
  This app has no employees, attendance or inventory. `ReminderKindRow.vue:81-88` falls back to the
  raw identifier when a key is missing, so today this app renders raw enum names in a settings screen
  users are meant to read. Same seam problem `notificationTypeMeta` already solved properly. (N9)
- **`src/_common/_locales/` ships SK only** — there is no `common.en.ts`. `EN` is configured as the
  *fallback* locale (`i18n.ts:18`), so an English user gets Slovak for every `notifications.*`,
  `reminderPreference.*`, `authorization.*` and `controls.*` string, and the fallback chain has
  nowhere further to go. (N11, scoped to this module's keys)
- **Twelve `notifications.*` locale keys are dead.** `settingsTitle`, `enablePush`, `pushEnabled`,
  `pushSubscribed`, `pushUnsubscribed`, `pushBlocked`, `pushUnsupported`, `permissionDenied`,
  `enableError`, `preferences`, `channel.*`, `enableNotificationsInWindows` — grepped, zero call
  sites. They were written for a notification-settings screen that was never built; `SecuritySection`
  uses `user.pushNotifications*` instead. (N12 builds the screen or N1 deletes the keys — read N12's
  header before deleting.)
- **The module doc is stale in six named ways.** `_common/docs/modules/notifications.md` still
  documents `updateNotificationPreference`, `NotificationPreferencePayload`, `NotificationChannel`,
  `listFromJsonList`, and lists "hardcoded `sk`" and "doesn't refresh while open" as open
  issues — none of which are true of the code any more. (N13)

## Smaller things, folded into N1

`connect()`'s guard returns immediately for a second caller while the first is still awaiting
`start()`, so the second caller believes it is connected; `markRead`'s failure path sets
`isRead = false` rather than restoring the captured prior value; `NotificationResponse.fromJson`
positional-passes six raw `json.*` values with no destructuring defaults, against the DTO convention
in `CLAUDE.md`; `handleIncoming` `unshift`es on the assumption the server returns newest-first, which
is nowhere stated; `NotificationBell.vue:67` renders `VListItemSubtitle` unconditionally, leaving an
empty second line for body-less notifications while `lines="two"` reserves the height.

## Backend

`backend/` starts empty on purpose. Prompts do not pre-write backend requests — the agent
implementing a frontend prompt is the one that discovers exactly which field was missing and writes a
sharper ask than anyone could from a cold read. N2, N3, N5, N6, N7, N8, N10 and N12 each end with an
escalation block telling the agent to finish and verify the frontend work first, then write the ask
if it actually hit the wall. `backend/README.md` holds the format and the scope rules (contract and
business logic only — no storage, entity or migration decisions).
