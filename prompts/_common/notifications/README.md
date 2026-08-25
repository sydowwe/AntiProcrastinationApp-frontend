# Notifications prompts (`src/_common/modules/notifications/`)

Improvements to the framework's notifications module — the bell, the SignalR hub, Web Push, and the reminder-preferences screen — plus the two files outside the
module that belong to the same surface:
`public/sw-push.js` and `src/app/notifications/notificationTypeMeta.ts`.

One self-contained prompt per file, each written to be pasted into a fresh session in this repo.
`CLAUDE.md` auto-loads there, so the prompts carry only task-specific facts (paths, line numbers, existing composables) rather than restating conventions.

## ⚠️ The submodule rule is suspended for this set

`CLAUDE.md` says `src/_common` is a git submodule and must never be edited. **The repo owner has authorised editing it in place for this work.** Every prompt below
repeats that authorisation inside its own body, because a fresh agent reads `CLAUDE.md` and will otherwise refuse or "fix" things app-side instead.

What this means in practice:

- Edit `src/_common/modules/notifications/` directly. Do not fork files into `src/`.
- Do not substitute a `migration-revision.md` entry for a fix you were asked to make.
- Do not touch anything under `src/_common` outside `modules/notifications/`, `_locales/common.sk.ts`
  and `docs/modules/notifications.md` without saying so in your final report — the framework serves other apps.
- The submodule commit/push is the owner's job. Report which `_common` files you touched.

## Index

| #    | Prompt                                                                | Kind         | Backend  | Model      | Effort  |
|------|-----------------------------------------------------------------------|--------------|----------|------------|---------|
| ✅N1 | [Correctness sweep ⭐](N1-correctness-sweep.md) — **done**            | bug          | —        | Sonnet 5   | medium  |
| ✅N2 | [Session lifecycle ⭐](N2-session-lifecycle.md) — **done**            | bug          | none     | **Opus 5** | high    |
| ✅N3 | [Paging & unread count ⭐](N3-paging-and-unread-count.md) — **done**  | bug / perf   | none     | **Opus 5** | high    |
| ✅N4 | [Bell states & a11y](N4-bell-states-and-a11y.md)                      | UX           | —        | Sonnet 5   | medium  |
| N5   | [Deep-linking & the typeMeta seam](N5-deep-linking.md)                | design       | **yes**  | **Opus 5** | high    |
| N6   | [Full notifications page](N6-notifications-page.md)                   | feature      | **yes**  | **Opus 5** | high    |
| N7   | [Snackbar storm & digest grouping](N7-snackbar-storm-and-grouping.md) | UX / feature | possibly | **Opus 5** | high    |
| N8   | [Push subscription resilience](N8-push-resilience.md)                 | bug          | **yes**  | **Opus 5** | high    |
| N9   | [Reminder-kind label seam](N9-reminder-label-seam.md)                 | debt         | —        | Sonnet 5   | low–med |
| N10  | [Quiet hours correctness & contract](N10-quiet-hours.md)              | bug          | **yes**  | **Opus 5** | high    |
| N11  | [EN locale coverage](N11-en-locale.md)                                | bug / i18n   | —        | Sonnet 5   | low–med |
| N12  | [Per-type notification settings](N12-notification-type-settings.md)   | feature      | **yes**  | **Opus 5** | high    |
| N13  | [Module doc refresh](N13-doc-refresh.md)                              | debt         | —        | Sonnet 5   | low     |

Each prompt is independently runnable. `Depends on` in each header is about avoiding merge pain, not correctness. **N1 and N2 have shipped**, which clears the
ordering constraint that mattered most — N3, N4 and N6 can now be written against the session-owned composable rather than around it, and **each prompt body still
describes the pre-N1/N2 code**, so re-read the file before trusting a line number in one. **N3 has now shipped too**, so N6 has its paging: build the page on
`loadMore()`/`hasMore` from `useNotifications`, and do not re-derive the unread badge. Still standing: **N5 before N6/N7** (they both render notifications and want
the resolved route).

⚠️ **Every prompt in this set asserts defects that the tree may have already fixed.** Two of N2's three did not reproduce — see _Fixed_ below. Reproduce each claim
before implementing it, and say in your final report which held.

## Fixed — and two claims that were wrong

Corrected 2026-08-25, after N2. **Read this before N3/N4/N6**: two of the three defects this list attributed to N2 did not reproduce, and the mental model they gave
you is wrong in a way that will mislead the next prompt.

- ✅ ~~**The hub connects while signed out.**~~ **This never happened.** `_common/nav/AppTopBar.vue:52-55`
  already wraps the `#actions` slot in `v-if="auth.isAuthenticated"`, so `NotificationBell` never mounts on a public route and its `onMounted(connect)` never fired
  there. Verified in the browser:
  a signed-out load of the login page issues **no** request to the backend at all. (The login route is `/login`, not `/prihlasenie` — see
  `_common/modules/user/user.routes.ts`.)
  The real signed-out defect was next door and unnamed: `App.vue` called `initPushSupport()`
  unconditionally at setup, registering the service worker and probing the push subscription for a visitor who may never sign in. Fixed in N2.
- ✅ **Module state survived a user switch — but not for the stated reason.** The bell *does* unmount on sign-out (same slot guard), so `onUnmounted(disconnect)`
  *did* run. That made it a race, not a leak, and a worse one: `disconnect()` nulled `connectPromise` in its `finally`, i.e. **after**
  `await connection.stop()`. A sign-in landing before that resolved hit `connect()`'s
  `if (connectPromise !== null) return connectPromise` on the previous session's already-resolved promise, returned instantly, and was then wiped by the pending
  `finally` — leaving the tab with no hub and nothing able to notice until a reload. `usePushNotifications`' `isSubscribed`/`permission`
  were never reset, exactly as described. Fixed in N2.
- ✅ **`withAutomaticReconnect()` gave up permanently.** Accurate as written. Fixed in N2 with an explicit `IRetryPolicy`
  (`0s, 2s, 5s, 10s, 30s, then 60s + jitter, forever`) plus an
  `onreconnecting` handler, so a consumer can tell *reconnecting* from *connected*.

**What N2 leaves for you.** `useNotifications.ts` now owns its own lifecycle through
`startNotificationSession()` — one `isAuthenticated` watcher in a detached `effectScope`, connecting on sign-in and calling `reset()` + `resetPushState()` on
sign-out — and every async path that writes back into module state is guarded by a session token. `NotificationBell` is a pure view and calls neither `connect` nor
`disconnect`. Build on that; do not reintroduce a component-owned connection. See `_common/docs/modules/notifications.md` § _Session lifecycle_.

The hub's rejection of an unauthenticated handshake was checked while doing this: a clean **HTTP 401 on `POST /hubs/notifications/negotiate`**, no hang and no
accept. Nothing to escalate, which is why
`backend/` gained no file from N2.

## Fixed by N3 — and the set's worst wrong premise

Corrected 2026-08-25, after N3. **Read this before N5/N6/N7.** The set has been assuming the notifications backend is thin. It is not, and the FE has simply never
called most of it.

- ❌ ~~**`GET /notification/mine` is unbounded.**~~ **This was never true.** The endpoint has always been cursor-paged and always capped: it reads `limit` (clamped
  `1..100`, **default 50**) and
  `beforeId` off the query string, sorts `CreatedTimestamp DESC, Id DESC`, and `Take(limit)`s. The client just never passed either parameter. The reason nobody
  noticed is that FastEndpoints reads them via `Query<T>(...)` rather than binding a request DTO, so **neither appears in the generated OpenAPI document** — reading
  swagger alone tells you the route takes no parameters, which is what every previous cold read of this endpoint concluded. There is also a retention job
  (`PurgeExpiredNotificationHistoryJobHandler`): read notifications purge at 90 days, everything at 365, idle push subscriptions at 180. The collection was bounded
  at both ends the whole time.
- ✅ **The unread count was derived from whatever happened to be loaded.** Accurate as written, and worse than described: since the fetch was in fact capped at 50
  server-side, the badge was *already* under-counting for any account with more than 50 notifications — the coupling the prompt predicted would break "the moment you
  cap the fetch" had already broken. Now a plain `ref` fed by
  `GET /notification/unread-count`.
- ❌ ~~**There is no bulk mark-read endpoint.**~~ `POST /notification/read-all` exists and does the whole thing in one `ExecuteUpdateAsync`. The N-request fan-out was
  real and is gone; the claim that nothing server-side could replace it was not.

**No backend ask was written, and none was needed** — every endpoint N3's escalation block anticipated asking for already existed (`/notification/mine` paging,
`/notification/unread-count`,
`/notification/read-all`), plus a `DELETE /notification/{id}` nobody has called yet. That last one is worth knowing for N6: per-row dismiss is already available.

**The transferable lesson for the rest of the set:** *check the backend source, not just swagger.*
The API project is at `C:\Users\jakub\RiderProjects\AdhdTimeOrganizer` (module code under
`framework\Sydowwe.Notifications\`), and it runs on `https://localhost:8080` with swagger at
`/swagger/v1/swagger.json`. Three of this file's "confirmed defects" survived multiple re-checks only because everyone reading them stayed on the frontend side of
the wire.

## The confirmed defects

Still open. Line numbers re-checked 2026-08-25.

- **Nothing renders the state the composable already publishes.** N1 added an `error` ref (`useNotifications.ts:43`) alongside the existing `isLoading` (`:42`), and
  `isConnected` (`:41`)
  now distinguishes reconnecting from connected after N2 — **all three are exported and read by nobody**. A failed load still renders as "Žiadne notifikácie", an
  empty *success*, and there is no spinner and no reconnecting state. The gap is now purely in the view. (N4)
- **Click-through cannot reach the thing the notification is about.** `notificationRoute(type)`
  (`utils/notificationTypeMeta.ts:28`) is keyed on the type alone, so a `DeadlineApproaching` for one specific task routes to the reminders *list*.
  `NotificationResponse` (`dto/NotificationResponse.ts`)
  carries no entity id and no url. Meanwhile `public/sw-push.js:14` already reads `data.url` off the push payload — so the push path can deep-link and the in-app
  path cannot, from the same server-side event. (N5)
- **Every incoming notification pops a snackbar, unconditionally.** `useNotifications.ts:88-89`, with no throttle, no grouping, and no check for whether the bell
  menu is already open or the user is already looking at the target page. A `ReminderDigest` fan-out snackbars once per item. (N7)
- **`public/sw-push.js` has no `pushsubscriptionchange` handler.** Browsers rotate push subscriptions (Chrome does it on its own schedule); when that happens the
  endpoint stored server-side becomes dead and push stops silently. Nothing on the client ever notices or re-registers. (N8)
- **`notificationclick` focus matching is wrong for the common case.** `sw-push.js:47` —
  `client.url.includes(url)` with the default `url = '/'` matches *every* open tab of the app, so the click focuses whichever tab is first in the list rather than
  navigating anywhere. (N8)
- **The reminder-kind labels are another app's domain, hardcoded in the framework.**
  `_common/_locales/common.sk.ts:325-327` ships
  `reminderPreference.ownerModule.{EmployeeModule, AttendanceModule, InventoryModule}`, and `:334`
  ships `kindName.ProbationEnding`. This app has no employees, attendance or inventory.
  `ReminderKindRow.vue:82-87` falls back to the raw identifier when a key is missing, so today this app renders raw enum names in a settings screen users are meant
  to read. Same seam problem
  `notificationTypeMeta` already solved properly. (N9)
- **`src/_common/_locales/` ships SK only** — there is no `common.en.ts`. `EN` is configured as the *fallback* locale (`i18n.ts:41`), so an English user gets Slovak
  for every `notifications.*`,
  `reminderPreference.*`, `authorization.*` and `controls.*` string, and the fallback chain has nowhere further to go. (N11, scoped to this module's keys)
- **Twelve `notifications.*` locale keys are dead.** `settingsTitle`, `enablePush`, `pushEnabled`,
  `pushSubscribed`, `pushUnsubscribed`, `pushBlocked`, `pushUnsupported`, `permissionDenied`,
  `enableError`, `preferences`, `channel.*`, `enableNotificationsInWindows` — grepped, zero call sites. They were written for a notification-settings screen that was
  never built; `SecuritySection`
  uses `user.pushNotifications*` instead. Re-grepped 2026-08-25: still zero. N1 deliberately left them alone, so the disposition is now entirely N12's — build the
  screen or delete the keys.
- **The module doc is stale in six named ways.** `_common/docs/modules/notifications.md` still documents `updateNotificationPreference`,
  `NotificationPreferencePayload`, `NotificationChannel`,
  `listFromJsonList` (the DTO's method is `listFromObjects`), and lists "hardcoded `sk`" and
  "doesn't refresh while open" as open issues — none of which are true of the code any more. All six re-confirmed stale on 2026-08-25. N2 refreshed the
  composable/component rows and added a _Session lifecycle_ section, so N13 inherits a doc that is accurate about lifecycle and wrong about the API and DTO surface.
  (N13)

## ✅ Smaller things, folded into N1 — all shipped

Verified fixed on 2026-08-25; kept for the record, not as work. `connect()`'s guard returned immediately for a second caller while the first was still awaiting
`start()` (now a cached
`connectPromise`, plus N2's session token); `markRead`'s failure path set `isRead = false` rather than restoring the captured prior value (now `previousIsRead`);
`NotificationResponse.fromJson`
positional-passed six raw `json.*` values with no destructuring defaults (now destructured with defaults, per `CLAUDE.md`); `handleIncoming` `unshift`ed on the
unstated assumption that the server returns newest-first (now finds-and-replaces by id, else prepends, with the assumption written down);
`NotificationBell.vue` rendered `VListItemSubtitle` unconditionally, leaving an empty second line for body-less notifications (now `v-if="notification.body"` with
`:lines` matched to it).

## Backend

`backend/` started empty on purpose, and holds only what an implementing agent actually hit:
`B1-quiet-hours-fidelity.md` — **answered and landed on 2026-08-25**; see its `ANSWERED` section for the
settled contract (quiet-hours `timeZone`, `originallyDueAt`, `ChannelHint` removed) and for what changed
in `src/_common` as a result. Prompts do not pre-write backend requests — the agent implementing a frontend prompt is the one that discovers exactly which field was
missing and writes a sharper ask than anyone could from a cold read. N3, N5, N6, N7, N8, N10 and N12 each end with an escalation block telling the agent to finish
and verify the frontend work first, then write the ask if it actually hit the wall. N2 and N3 both had one and both produced nothing, which is the expected outcome
when the server behaves — do not write a file to show willing. N3 in particular expected to need three backend changes and found all three already shipped; see
_Fixed by N3_ for where to look before assuming an endpoint is missing. `backend/README.md` holds the format and the scope rules (contract and business logic only —
no storage, entity or migration decisions).
