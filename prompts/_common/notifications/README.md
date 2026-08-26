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

| #     | Prompt                                                                           | Kind         | Backend | Model      | Effort  |
|-------|----------------------------------------------------------------------------------|--------------|---------|------------|---------|
| ✅N1  | [Correctness sweep ⭐](N1-correctness-sweep.md) — **done**                       | bug          | —       | Sonnet 5   | medium  |
| ✅N2  | [Session lifecycle ⭐](N2-session-lifecycle.md) — **done**                       | bug          | none    | **Opus 5** | high    |
| ✅N3  | [Paging & unread count ⭐](N3-paging-and-unread-count.md) — **done**             | bug / perf   | none    | **Opus 5** | high    |
| ✅N4  | [Bell states & a11y](N4-bell-states-and-a11y.md)                                 | UX           | —       | Sonnet 5   | medium  |
| ✅N5  | [Deep-linking & the typeMeta seam](N5-deep-linking.md) — **done**                | design       | **yes** | **Opus 5** | high    |
| ✅N6  | [Full notifications page](N6-notifications-page.md) — **done**                   | feature      | **yes** | **Opus 5** | high    |
| ✅N7  | [Snackbar storm & digest grouping](N7-snackbar-storm-and-grouping.md) — **done** | UX / feature | none    | **Opus 5** | high    |
| ✅N8  | [Push subscription resilience](N8-push-resilience.md) — **done**                 | bug          | none    | **Opus 5** | high    |
| ✅N9  | [Reminder-kind label seam](N9-reminder-label-seam.md)                            | debt         | —       | Sonnet 5   | low–med |
| ✅N10 | [Quiet hours correctness & contract](N10-quiet-hours.md) — **done**              | bug          | none    | **Opus 5** | high    |
| N11   | [EN locale coverage](N11-en-locale.md)                                           | bug / i18n   | —       | Sonnet 5   | low–med |
| N12   | [Per-type notification settings](N12-notification-type-settings.md)              | feature      | **yes** | **Opus 5** | high    |
| N13   | [Module doc refresh](N13-doc-refresh.md)                                         | debt         | —       | Sonnet 5   | low     |

Each prompt is independently runnable. `Depends on` in each header is about avoiding merge pain, not correctness. **N1 and N2 have shipped**, which clears the
ordering constraint that mattered most — N3, N4 and N6 can now be written against the session-owned composable rather than around it, and **each prompt body still
describes the pre-N1/N2 code**, so re-read the file before trusting a line number in one. **N3 has now shipped too**, so N6 has its paging: build the page on
`loadMore()`/`hasMore` from `useNotifications`, and do not re-derive the unread badge. **N5 has now shipped too**, so N6 and N7 have the resolved route: call
`notificationRoute(notification)` — it takes the whole notification, not its `type` — and do not re-derive a route from the type yourself. No ordering constraints
remain.

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

## Fixed by N5 — and the "push already deep-links" premise was wrong

Corrected 2026-08-25, after N5. **Read this before N6/N7.**

- ✅ **Click-through could only ever reach a list.** Accurate as written. `notificationRoute` now takes the **whole notification** rather than its `type`, and
  `NotificationTypeMeta.route` accepts `(notification) => RouteLocationRaw | undefined` alongside a constant `RouteLocationRaw`. One field carrying a union, not a
  second `resolveRoute` field — two fields would need a precedence rule nobody reading a meta map can see. Constants are untouched, so another app's map keeps
  working with no edit. Unit-tested in `utils/notificationTypeMeta.test.ts`, including that a resolver returning `undefined` — or throwing — degrades to "no
  navigation" exactly as an unmapped type does.
- ❌ ~~**The push path can already deep-link, the in-app path cannot, from the same server-side event.**~~ **Much narrower than this file claimed, and it inverts the
  design argument.** `INotificationTextRenderer.RenderPushMeta` defaults to `(null, null)`, and the concrete renderer returns a url for exactly **one** type —
  `TimerBoundary` — where the url is read off `TimerBoundaryPayload.Url`, i.e. handed in by the *producer*, not decided by the notifications module. For all six
  types this app maps, `data.url` is absent and `sw-push.js` falls back to `'/'`. So the server does **not** hold a general opinion about app routes, and "the server
  already emits urls, therefore it should emit them for everything" was never the precedent it looked like.
- ✅ ~~**The seam is wired but this app's map is still all constants**, with a `TODO(B2)` on it.~~ **Resolved — B2 was answered and the wiring landed the same day;
  see _Landed with B2_ below.** Kept for the reasoning. Not an oversight: `NotificationDto` is six fields wide (id, type, title, body, createdAt, isRead, plus
  optional originallyDueAt) and none identifies the subject — confirmed against the **running** server's swagger, not just the source. Faking it by parsing an id out
  of the server-rendered title was explicitly ruled out.

**The data exists server-side; only the projection is missing.** `Notification.PayloadJson` holds a typed payload per type, and those records carry the ids —
`PersonalReminderPayload(ReminderId, Title, PlannerTaskId)`, `RoutinePeriodEndingSoonPayload(PeriodId, …)`, and so on. `PersonalReminderPayload`'s own XML doc says
`PlannerTaskId` is there "so the client can deep-link back to the task". `NotificationDto` simply never projects it. Two exceptions that are genuinely unresolvable:
`DeadlineApproachingPayload` carries a title and no id at all, and `ReminderDigestPayload` is a count plus a per-kind breakdown by construction — the list *is* its
target.

**Backend ask written:** `backend/B2-notification-subject-reference.md`. It frames the real question — who owns the notification→UI mapping — rather than asking for
a field name, and recommends an opaque `subject { kind, id }` over a server-sent url, because the route table is app-owned (`SETUP.md` §5 says so outright) and this
DTO is shared with an app whose routes are entirely different.

⚠️ **`_common/docs/modules/notifications.md:158-161` is now one line staler than N13 inherited** — it still describes `notificationRoute` as type-keyed. N13 owns
that file, so N5 deliberately left it alone. Fix it there.

## Landed with B2 — and the gap nobody had checked for

2026-08-25. B2 was answered (Option B: opaque `subject { kind, id }`, routes stay app-owned) and wired the same day. **Read this before N6/N7** — they render
notifications and will want the resolved route.

**What is wired.** `NotificationResponse.subject` is parsed and validated (absent / null / malformed all collapse to `undefined`, so a drifted shape can never build
`/planovac/behy/undefined`). The app's `notificationTypeMeta` resolves `subject` first and falls back to the type's constant route — which is what an append-only
vocabulary requires, since the server will emit kinds this app has never heard of.

**One map, two readers.** `public/notification-subject-routes.js` holds the only `kind → path` mapping, plus the push fallback chain. The bell reads it via the
`<script>` tag in `index.html`; the service worker reads the *same file* via workbox `importScripts` (`vite.config.ts`, listed before `sw-push.js`). Verified in a
real
`vite build`: `dist/sw.js` contains `importScripts("/notification-subject-routes.js","/sw-push.js")` and the file is precached. It is a classic script in `public/`
because the worker is loaded by URL and never bundled — which also forces **paths, not named routes**, as the shared currency. That path duplication is guarded by a
test that reads the route table's own source.

**The destinations.** B2 framed the wiring as "a data change, not a design change" plus one piece of real work (not-found paths). That was not right for this app —
none of the param-taking routes except the scheduler's fit a subject kind, so three destinations had to be built. Three of four kinds now deep-link:

| kind              | destination                                                                                                       |
|-------------------|-------------------------------------------------------------------------------------------------------------------|
| `scheduledJobRun` | ✅ `/planovac/behy/:id` — already existed, and `SchedulerRunDetailView` already rendered a not-found alert        |
| `plannerTask`     | ✅ `/day-planner/task/:id` → resolves task → calendar → date, then `replace`s to `/day-planner/<date>?focus=<id>` |
| `routinePeriod`   | ✅ `/routine-todo-list?focus=<id>` — the card is scrolled to and pulsed                                           |
| `reminder`        | ❌ **not buildable frontend-only** — falls back to the reminders list, as before                                  |

**Why `reminder` is different, and not a to-do.** The id is a Planning-module `Reminder` row (`ReminderRegistrationService`:
`new PersonalReminderPayload(reminder.Id, …)`). This frontend has **no such entity** — no API client, no DTO, no view; reminders are never CRUDed from here. The
reminders screens it does have belong to the framework module and list `ReminderDefinition`s, a *different id space*, so pointing `reminder` at
`/pripomienky/register/:id` would deep-link to the wrong row — worse than landing on a list. Closing it means building reminder UI in this app, which is a product
decision, not wiring. There is deliberately **no map entry**, and a test pins its absence.

**Two design points worth carrying forward.**

- **The planner hop.** The kind→path map must stay a *synchronous string builder*, because the service worker resolves push clicks through it with no app, router or
  API client in scope. A task id needs two async reads to become a dated URL, so the map points at a thin redirect route (`PlannerTaskLinkView`) and the async half
  happens once, in the app. Any future kind needing a lookup should copy that shape rather than making the map async.
- **A deep link never changes persisted state.** A hidden routine group is *not* un-hidden on arrival — hiding is a server-persisted choice and a notification click
  silently undoing it would be a bug. The view says where to find it instead (`routineTodoList.focusHiddenGroup`).

The scroll-and-pulse behaviour is `_common/composable/general/useQueryFocusTarget.ts` — generic, DOM-based (a `data-*` attribute on the row, no `focusedId` prop
threaded through every list), and framework-side because a framework view would want it too.

## Fixed by N6 — and the "there is no delete endpoint" premise was wrong too

2026-08-26. **Read this before N7/N12** — both add to surfaces this built.

- ✅ **The bell was the only notification surface.** Accurate as written. There is now an inbox at `/notifikacie` (`notificationsRoutes`, reachable from a "see all"
  footer in the bell and from `UserMenu`): the full history paged off N3's `loadMore()`, unread/type filters, day grouping with sticky headers, per-row and bulk
  actions, and click-through through N5's `notificationRoute`. Split across `NotificationsView` + `NotificationRow` / `NotificationDayGroup` /
  `NotificationInboxToolbar`, with `groupNotificationsByDay` and `useNotificationInboxFilters` beside them.
- ❌ ~~**Dismiss/delete has no endpoint.**~~ **`DELETE /notification/{id}` exists** — hard delete, owner-scoped, `404` when the row is not the caller's. N3's
  postscript had already flagged it ("a `DELETE /notification/{id}` nobody has called yet") and the prompt body, written earlier, still said to hide the control and
  escalate. Per-row and bulk dismiss both ship **working**, and the "leave it disabled behind an honest reason" fallback was not needed. **That is now four endpoints
  across N3 and N6 that this set asked for and that already existed.** Check the backend source first; the running server's swagger is not enough either, since
  FastEndpoints' `Query<T>(...)` parameters do not appear in it.
- ✅ **Mark-as-unread genuinely had no endpoint** — `PATCH /notification/{id}/read` took no body and had no inverse, so the one thing the prompt listed almost in
  passing was the only real backend gap. **Asked as B3, answered and landed the same day**: `PATCH /notification/{id}/unread` exists, the envelope is a real toggle,
  and the batch delete came with it. See _Landed with B3_ below.

**Two decisions worth carrying forward.**

- **Filtering is client-side, over the loaded pages, and the UI says so.** `GET /notification/mine` takes `beforeId` and `limit` and nothing else — no `isRead`, no
  `type` — so there is no server-side filter to ask for. Rather than hide that, the filtered empty state and the bottom of the list both keep offering "load older",
  which is the honest reading of "nothing matches *yet*". If N12 or a later prompt wants true filtering, that is a backend ask nobody has written.
- **Not `VInfiniteScroll`, and not `useTableUrlState`.** An auto-loading list under a client-side filter fires page after page at the server while the screen stays
  visibly empty, so paging is an explicit button. And `useTableUrlState` writes `page`/`perPage` unconditionally, which are three lies about a cursor-paged list with
  no client-selectable sort; what is left of it after removing those is the two-scalar read/write that `useNotificationInboxFilters` is. Both reasons are in comments
  at the sites, per the prompt.

## Landed with B3 — and read is no longer a one-way door

2026-08-26. B3 was answered and wired the same day. **Read this before N7/N12.**

**What is wired.** `PATCH /notification/{id}/unread` (mirror of the read route) and
`POST /notification/delete-batch` (`{ ids }` → `{ deletedCount, skippedIds }`). The row's envelope button is a real toggle, `useNotifications` gained `markUnread`
beside `markRead`, and `dismissMany` collapsed from an N-request `Promise.allSettled` fan-out to one request.

**Three things worth carrying forward.**

- **The batch's response is authoritative, in both directions.** `skippedIds` decides what comes back into the list — never show a row as deleted unless the server
  said it deleted it — and `deletedCount` is what gets announced, because it is **not** `ids.length - skippedIds.length`: a row deleted between the server's read and
  its delete lands in neither list. One known wrinkle, documented at the site: a row another tab dismissed reappears until the next load, which is the conservative
  half of that trade.
- **Un-reading moves a row's retention from 90 days to 365, and that is intended.** B3 corrected the ask's reasoning here — the purge keys on `IsRead`, not on the
  read stamp, so *no* version of unread avoids the move. Marking something unread is a claim that it is unfinished. Do not "optimise" this later.
- **Dismiss is permanently a hard delete.** No dismissed-but-retained state is coming; the confirm dialog and absent undo are settled, not provisional. If a future
  prompt proposes an undo snackbar, that is a backend change first.

**Icon semantics, since the next component will copy it:** the envelope names the **action**, not the state — a read row shows a closed envelope because clicking it
makes the row unread. An icon showing state next to a label describing an action is the combination people misread.

Verified: type-check **0 errors** (the app-side baseline was cleared by the owner mid-session — see `CLAUDE.md`, and note that any error is now a regression); lint 0
errors; **45** module unit tests pass, including the batch contract's skip/count split and a `markRead`/`markUnread` badge round-trip.

## Fixed by N7 — and the digest question answered from the server's source, not asked

2026-08-26. **Read this before N12** — it adds settings to the surface this touched.

- ✅ **Every incoming notification popped a snackbar, unconditionally.** Accurate as written. There is now a written-down rule (the `--- snackbar policy ---` block in
  `useNotifications.ts`), a 1.2 s burst window with a 3 s cooldown behind it, per-type colour, and an action. **Only the snackbar is throttled** — the list and the
  badge still move the instant a push lands, and a unit test asserts exactly that.
- ✅ **`title — body` on one line.** Accurate, and fixed by dropping the body: two variable-length server-rendered strings in a one-line host means the long one wins.
  The body is one click away on both surfaces.
- ❌ ~~**Client-side grouping may be duplicating what the server's `ReminderDigest` already does.**~~ **It is not, and the source says so plainly** — no backend ask
  was needed.
  `ReminderScanJobHandler.ProcessDigestKeyAsync` sends **one** `ReminderDigest` notification per recipient across every due definition sharing a
  `ReminderDefinition.DigestKey`; the
  "per-occurrence rows" in `ReminderDigestPolicy`'s doc comment are **dispatch audit rows, not notifications** (the comment says outright that the audit trail is
  never collapsed). So a digest is already one notification and clustering can never split one. And digests are opt-in twice over — a definition needs a `DigestKey`,
  and this app sets none and configures no `ReminderDigest`
  windows in `appsettings.json` (the only `DigestKey` in the tree is `attendance.leave-approvals.daily`, in another app's dev seeder). **This app therefore never
  emits a digest at all**, and every burst N7 is about is a genuine N-notification fan-out.
- ❌ ~~**Severity may be too coarse to derive from the typeMeta colour.**~~ Checked against the registered map and it is not: the one `error` type is a failure and
  all four `warning` types are genuinely time-critical (a deadline, a period closing, a streak lapsing, an overdue job). Nothing lands on the wrong side of the line,
  so **no `severity` field was asked for**. That leaves
  `backend/` untouched by N7 — the same outcome as N2 and N3, and for the same reason.

**Three decisions worth carrying forward.**

- **"Always snackbar a high-severity type" was narrowed, deliberately.** Severity decides how a burst is *phrased*, never whether it appears: a high-severity arrival
  is **named** ("Úloha zlyhala · a 3 ďalšie") instead of being folded into "4 nové notifikácie". It does **not** override the two suppression rules — someone already
  reading the bell, or already standing on the page the notification points at, is not helped by being shouted at. The prompt's four bullets contradicted each other
  on this; this is the reading that keeps all four.
- **The route check compares `path`, not `fullPath`.** Every subject-resolved target in this app differs from the current location by a query string precisely when
  the user is already there (`?focus=<id>`), so a `fullPath` comparison would essentially never match — which is the same as not writing the rule.
- **Cluster expansion is keyed by member ids, not by the cluster's key.** Clustering is derived from the list, so a cluster is not a stable object: reading one item
  inside an expanded cluster of five splits it into a read singleton and a shorter cluster with a different key, and anything keyed on that key collapses the
  remainder under the user's cursor mid-click. Select mode expands everything and hides the summaries, because "select all visible" must not reach rows nobody can
  see.

**One thing outside `modules/notifications/`, flagged per this file's rule:** `src/_common/router/appRouter.ts` is new — `setAppRouter` / `tryUseAppRouter`,
registered by `installFramework`
beside `setAxiosRouter` and documented in `SETUP.md`'s seam table. Framework code that must read the current route from **outside** a component's `setup()` had
nowhere to get a router;
`axiosConfig`'s copy is private and is stubbed wholesale by its own test. It returns `null` until registered, so every existing app keeps working untouched.

Verified: type-check **0 errors**, lint 0 errors (the 2 known warnings), **197** unit tests pass — up 38, covering the burst/cooldown/suppression matrix, the
severity and colour mapping, the clustering rules, and (against the app's *real* i18n instance) all three Slovak plural forms of every count-bearing message N7
added. `vite build` clean, service worker included. **Not verified in a browser:** neither the API (`:8080`) nor the dev server was running, and standing the backend
up needs a database and secrets this session does not have. The behavioural list in the prompt body is covered by the unit tests above *except* the two things only a
live page can show — the expand/collapse animation, and route-target suppression against a real router table.

⚠️ `_common/docs/modules/notifications.md` gained nothing from N7, on N5's precedent: **N13 owns that file**. It now also needs the snackbar policy,
`useNotificationSurface`, the clustering seam and `NotificationClusterSummary` — that is four items on top of the six it already inherited.

## Fixed by N8 — and the ask it was told to write did not exist either

2026-08-26. **Read this before N12**, and before anything that touches the push path.

- ✅ **`public/sw-push.js` had no `pushsubscriptionchange` handler.** Accurate as written. There is one now: it rebuilds the subscription from
  `oldSubscription.options.applicationServerKey` (the one thing only that event holds), then `postMessage`s every open client so the app can register it.
- ✅ **`notificationclick` focused the wrong tab.** Accurate. Matching is now on resolved pathnames: exact path+query wins and is only focused, a same-path tab is
  **navigated** so `?focus=<id>` actually moves, any other tab is navigated rather than merely raised, and `openWindow` is last. One case the prompt did not name and
  that matters more than the rest: **'/' is the resolver saying "nowhere in particular", not "go home"** — a notification with no subject must raise whatever tab the
  user had, never navigate it away from what they were doing.
- ✅ **Silent failures in `subscribe()`.** Accurate, and live in this repo rather than theoretical: `.env.development` ships `VITE_VAPID_PUBLIC_KEY=` **empty**, so
  every press produced the generic "could not enable" snackbar. `subscribe()` now returns a discriminated result (`subscribed | unsupported | notConfigured |
  blocked | denied | failed`) and `SecuritySection` renders one message per case, using the `notifications.*` keys N1 flagged as dead — five of the twelve are now
  live.
- ✅ **Unsubscribe ordering.** Accurate, and settled as **browser first, server second**. The two failure modes are not symmetric: revoking server-side first leaves a
  live browser subscription the server has forgotten and nothing corrects it, whereas revoking browser-side first leaves a row whose endpoint is dead — and the
  server prunes on the first `410 Gone`. Reasoning is in a comment at the site.

**The two premises that were wrong, both in the escalation block.** No backend ask was written, and none was needed — this is the fourth prompt in this set (after
N2, N3 and N7) to reach its escalation block and find the server already correct.

- ❌ ~~**`POST /push-subscription` takes a payload with no notion of "this replaces that".**~~ It is an **upsert keyed on the endpoint**, and has been:
  `SubscribePushEndpoint` looks the endpoint up, updates the keys/user-agent, and even handles **re-ownership** (a different user claiming the same device, audited
  as
  `PushSubscriptionReowned`). Registering the rotated endpoint is therefore the whole of the fix; nothing needs to name the endpoint it replaces.
- ❌ ~~**Dead endpoints accumulate server-side forever and the user silently stops receiving push.**~~ `WebPushSender` returns "gone" on `410`/`404` and
  `NotificationService` prunes the row in **both** dispatch paths (live and deferred), and `PurgeExpiredNotificationHistoryJobHandler` drops subscriptions idle past
  180 days. The accumulation was bounded at both ends the whole time.

**The bug nobody had written down, and the reason the whole path rotted.** The backend's retention comment states its assumption outright: *"The SPA re-POSTs its
subscription on every app start and `ApplyUpdateAsync` force-touches the row, so `ModifiedTimestamp` is a genuine last-seen instant."* **The SPA did not.**
`registerPushSubscription` was only ever called from the settings switch, so `checkSubscription()` probed `getSubscription()` and told the server nothing —
`ModifiedTimestamp` froze at row creation and **every subscription aged out 180 days after it was first created**, however active the device. `initPushSupport()` now
re-registers whatever the browser holds on every sign-in, which closes that *and* is what heals a rotation that happened with no tab open (the case the service
worker provably cannot cover). The worker's message only carries the old endpoint, because that is the one fact that exists nowhere else.

**Two decisions worth carrying forward.**

- **The service worker deliberately does not call the API, and the usual reason is the wrong one.** It is not that it cannot authenticate — auth is cookie-based and
  cookies ride a worker's own `fetch` with `credentials: 'include'`. It is that it cannot know *where the API is*: `VITE_API_URL` is a different origin and is
  substituted at bundle time, while `sw-push.js` is copied verbatim from `public/` and pulled in with `importScripts`, so nothing in it is ever substituted. (The
  expired-token/refresh flow living in the axios interceptor is the second reason.) Any future worker-side API call hits the same wall.
- **The VAPID key is resolved from the server, with the env var as an override.** `GET /push-subscription/vapid-public-key` has existed all along —
  `.env.development`'s own comment says the framework composable "reads it from here instead of fetching" it — and it answers `{ publicKey: null }` when the
  deployment has no credentials, precisely so a client can skip push setup. A **definite** null now hides the switch (`isSupported`), while a key that merely could
  not be *fetched*
  leaves it visible and fails at the press with its own message. Those two are different answers and collapsing them is what made a misconfigured deployment look
  like a user saying no.

Verified: type-check **0 errors** (`--build --force`, exit 0), lint 0 errors (the 2 known warnings), **232** unit tests pass — up 35, of which **17 drive the real
`public/sw-push.js`** with a stubbed `self`, the way workbox loads it. That file is invisible to every other check in this repo (eslint ignores `public/**`, vue-tsc
never sees plain JS), so it had no coverage at all before. `vite build` clean: `dist/sw.js` + `dist/workbox-*.js`,
`importScripts("/notification-subject-routes.js","/sw-push.js")`
in that order, both precached.

⚠️ **Not verified in a browser, and for a reason worth recording: Web Push is not configured on either side of this environment.** The frontend's
`VITE_VAPID_PUBLIC_KEY` is empty and the backend has **no `PushNotification` section at all** (no `VapidPublicKey`/`VapidPrivateKey` in any `appsettings*.json`, env
file or user-secrets), so `PushNotificationOptions.IsConfigured` is false and `GET /push-subscription/vapid-public-key` returns a null key. The API itself was up and
the route answered `401` unauthenticated, so it is wired — but with no keypair the browser cannot call `PushManager.subscribe()` and the server cannot send anything,
which makes the prompt's DevTools checklist unrunnable rather than merely unrun. **This is also the likeliest reason all four defects survived: push has never once
run in this environment.** Generating a VAPID keypair and configuring both sides is the prerequisite for that checklist.

⚠️ `_common/docs/modules/notifications.md` gained nothing from N8, on N5's and N7's precedent: **N13 owns that file**. It now also needs the discriminated
`PushSubscribeResult`, the server-resolved VAPID key, the rotation handler and the re-registration-on-sign-in rule — four more on top of the ten it had already
inherited. Its line 188 (`pushBlocked` etc. listed as a "dead surface") is now wrong in the other direction.

## Fixed by N10 — and the defect was one nobody in this set had looked for

2026-08-26. **Read this before N12 and N13** — both touch what this moved.

**The prompt's four numbered items were all about a card's save flow. The actual bug was that the card had been talking to a route that does not exist.** Quiet hours
is no longer part of reminder preferences: the server moved it to its own resource at `GET|PUT|DELETE /notification-quiet-hours` — because the *notification*
dispatcher defers on the window too, so reminders is a consumer rather than its owner — and dropped `quietHours` from `GET /reminder-preference`. The client was
still calling `PUT /reminder-preference/quiet-hours`. **Every save and every clear 404'd, and the card rendered "off" for every user regardless of their stored
window**, because it read a field the response no longer carries. Confirmed three ways: the endpoint source, a grep for the route string across the whole API
solution, and the **running** server's swagger (`/api/notification-quiet-hours` present, `/api/reminder-preference/quiet-hours` absent).

- ✅ **Save-with-the-switch-off was a disguised delete.** Accurate as written, and now structurally impossible: there is no Save button. The card **auto-saves**, like
  its neighbour `ReminderKindRow` — the switch writes immediately (on = upsert, off = delete) and a time edit writes after a 900 ms debounce. Clearing is the switch
  and only the switch.
- ✅ **No dirty state and no refetch.** Accurate. **It needed no backend change**: `GET /notification-quiet-hours` already returns the stored window, so every write
  is followed by a read and the card emits the *server's* window. That is not ceremony — the stored window carries a `timeZone` the client never sends and cannot
  derive, so an echoed local object was guaranteed to be wrong about the one field that matters.
- ✅ **The Save button's disabled logic read the wrong condition.** Accurate, and gone with the button.
- ❌ ~~**The timezone is undefined and nobody has said so.**~~ **Already answered — by B1, the day before this prompt was re-checked.** `QuietHoursWindow.timeZone`
  ships, the DST rule is in the subtitle, and `QuietHoursCard` already warned on a zone mismatch. The escalation block called this "a near-certain ask"; it was
  answered before the prompt was run.

**The two "also fix while you are in the file" items were both already fixed, and by the same B1 commit.** `reminderPreference.channel.*` no longer exists (so there
is no duplication to comment on — only the dead `notifications.channel.*` remains, already documented as N12's), and `ReminderKindRow`'s `VSelect` is gone, so the
"two round-trips with a disabled control in between" cannot happen. **That is six of this prompt's nine items either already fixed or resting on a false premise** —
the highest ratio in the set so far.

**One live defect the prompt did not mention:** the Save button's label was `controls.save`, and `controls.save` **does not exist in either locale file** (`save`
lives under `general`). The button had been rendering the raw key. Gone with the button, but the lesson generalises — see the `undo` note below.

**Three decisions worth carrying forward.**

- **Auto-save needs an unmount flush, or it is strictly worse than a Save button.** Navigating away inside the debounce window is the one way an auto-saving form
  loses data that an explicit one cannot. `onBeforeUnmount` fires the pending write instead of cancelling it.
- **A framework component must not resolve `general.*` without checking.** The undo action uses `reminderPreference.quietHours.undo`, **not** the framework's
  existing `general.undo`, because this app's `general` namespace replaces the framework's wholesale and has no `undo` — the framework key would render raw here.
  `reminderPreference` is framework-only and never replaced, so a key defined in it always resolves. This is `migration-revision.md` R5/R6/R11 for the fourth time.
- **Two resources, two error states.** `ReminderPreferencesView` loads the window and the kinds independently and gives each its own inline error with a retry, so a
  failed load can never read as "you have no quiet hours". Both reads pass `_silent` — a screen that renders its own failure must not also let the interceptor
  snackbar it.

**No backend ask was written, and none was needed** — the fifth prompt in this set (after N2, N3, N7 and N8) to reach its escalation block and find the server
already correct, and the second (after N8) whose escalation block was confidently wrong about both of its premises. One genuine gap was found and deliberately
**not**
asked: nothing exposes a count of currently-deferred notifications, so the prompt's "how many pending reminders that currently implies" could not be answered and the
card does not pretend to. That is a speculative feature, not a wall this work hit.

⚠️ **`docs/modules/notifications.md` was edited here, against N5/N7/N8's precedent of leaving it entirely to N13** — but only the rows that had become *actively
wrong about routes*, plus a changelog entry. A doc that tells the next agent to `PUT /reminder-preference/quiet-hours` is how this bug gets rebuilt. **N13's
inherited backlog is otherwise untouched** and is now sixteen-plus items.

Verified: type-check **0 errors** (`--build --force`, exit 0 — and confirmed non-vacuous by planting a deliberate type error, seeing it reported, and reverting it);
lint 0 errors (the 2 known warnings; note eslint ignores `src/_common`, so it covers none of this); **247** unit tests pass, up 14, all in the new pure
`utils/quietHoursPolicy.ts` — half-open span, both legs of an overnight window, the degenerate `start === end` window, zone-correct minute-of-day reads across a DST
shift, and the browser-zone fallback. `vite build` clean, service worker included. **Not verified in a browser:** the API was up (its swagger is what confirmed the
route move) but the dev server was not, so the behavioural list in the prompt body — the auto-save cadence, the undo snackbar, the animated disclosure — is unrun.
`vitest run` with no path argument also collects `e2e/**` and reports 3 Playwright failures; that is a pre-existing config gap unrelated to this work
(`vitest run src` is clean).

## The confirmed defects

Still open. Line numbers re-checked 2026-08-25.

- **Nothing renders the state the composable already publishes.** N1 added an `error` ref (`useNotifications.ts:43`) alongside the existing `isLoading` (`:42`), and
  `isConnected` (`:41`)
  now distinguishes reconnecting from connected after N2 — **all three are exported and read by nobody**. A failed load still renders as "Žiadne notifikácie", an
  empty *success*, and there is no spinner and no reconnecting state. The gap is now purely in the view. (N4)
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
- **~~Twelve~~ Seven `notifications.*` locale keys are dead.** `settingsTitle`, `enablePush`, `pushEnabled`,
  `pushSubscribed`, `pushUnsubscribed`, `preferences`, `channel.*`, `enableNotificationsInWindows` — grepped, zero call sites. They were written for a
  notification-settings screen that was never built. **N8 took five of the twelve live** — `pushBlocked`, `pushUnsupported`, `permissionDenied`, `enableError` and a
  new sibling `pushNotConfigured` now render one message per `subscribe()` failure in `SecuritySection`, which is exactly what they were written for; the rest of
  that component still uses `user.pushNotifications*`. The disposition of what is left is N12's — build the screen or delete the keys.
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
`B1-quiet-hours-fidelity.md` — **answered and landed on 2026-08-25**; see its `ANSWERED` section for the settled contract (quiet-hours `timeZone`, `originallyDueAt`,
`ChannelHint` removed) and for what changed in `src/_common` as a result. `B2-notification-subject-reference.md` — **answered and landed on 2026-08-25**; see its
`ANSWERED` section for the settled contract (opaque `subject { kind, id }`, no server-sent URLs, append-only kind vocabulary, dangling references permitted) and
_Landed with B2_ above for what shipped and what is still missing.
`B3-notification-item-state.md` — **answered and landed on 2026-08-26**; see its `ANSWERED` section for the settled contract (`PATCH /notification/{id}/unread`,
`POST /notification/delete-batch` with skip-not-404 semantics, dismiss permanently a hard delete) and _Landed with B3_ above for what shipped. Asking the *rules*
rather than just the routes is what paid here: it got the retention consequence corrected (the purge keys on `IsRead`, not on the read stamp, so the ask's stated
mechanism was wrong even though its instinct was right) and got the one case where a dismissed notification **can** reappear enumerated — admin-only
`ScheduledJobOverdue`, re-raised while still overdue. Prompts do not pre-write backend requests — the agent implementing a frontend prompt is the one that discovers
exactly which field was missing and writes a sharper ask than anyone could from a cold read. N3, N5, N6, N7, N8, N10 and N12 each end with an escalation block
telling the agent to finish and verify the frontend work first, then write the ask if it actually hit the wall. N2, N3, N7, N8 and N10 all had one and all five
produced nothing, which is the expected outcome when the server behaves — do not write a file to show willing. **N8's and N10's blocks were the most confident of the
five** ("Step 1 is very likely to produce one"; "a near-certain ask") and each was wrong on both of its stated premises; see _Fixed by N8_ and _Fixed by N10_. N10's
is the sharper warning: its
"near-certain" timezone ask had **already been answered by B1 and shipped**, one section further up this same file. The pattern across all four is the same: the
frontend had never called what was already there. N3 in particular expected to need three backend changes and found all three already shipped; see _Fixed by N3_ for
where to look before assuming an endpoint is missing. `backend/README.md` holds the format and the scope rules (contract and business logic only — no storage, entity
or migration decisions).
