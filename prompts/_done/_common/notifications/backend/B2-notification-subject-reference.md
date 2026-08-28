# B2 · Backend ask — who owns the mapping from a notification to a place in the UI?

> ## ANSWERED and landed — 2026-08-25
>
> **Option B was chosen.** The server sends an opaque `subject { kind, id }` and will not send URLs; routes stay app-owned. `kind` is a plain string, not an enum —
> SignalR's hub protocol carries no string-enum converter, so an enum would arrive as a name over REST and a number over the hub. The vocabulary is **append-only**:
> an unrecognised kind must fall back to the type-level route, never throw.
>
> Both non-answers in §2 were confirmed as **settled decisions, not gaps**: `DeadlineApproaching` carries no id on purpose (cross-module, no single entity behind
> it) and `ReminderDigest` is N occurrences by construction. Both stay constant routes permanently. `TimerBoundary` keeps its producer-supplied top-level push `url`
> and emits no subject.
>
> Rules 5 and 6 were confirmed as assumed: **the reference may dangle** (no existence check — that would put a per-row read on the bell list) and **is not scrubbed
on
> erasure**. Destination views need a graceful not-found path.
>
> **Frontend state (see the set README's _Landed with B2_ section):** the DTO, both resolvers and the service worker are done, the kind→path map is single-sourced in
> `../../../../../public/notification-subject-routes.js`, and **three of the four kinds this app receives now deep-link** — `scheduledJobRun`, `plannerTask` (via a
> redirect route
> that resolves the task's date) and `routinePeriod`.
>
> **`reminder` is the one that does not, and it needs nothing from the backend.** The id is a Planning-module `Reminder` row, and this frontend has no such entity —
> no API client, no DTO, no view. Its reminders screens belong to the framework module and list `ReminderDefinition`s, a different id space, so linking there would
> reach the wrong row. Closing it means building reminder UI in this app: a product decision, not a contract gap. The payload is correct as sent.

**Contract only.** Nothing below prescribes storage, entities, EF configuration, migrations or where a computation happens — those are yours. The ask is about the
shape on the wire and, more importantly, about which side of the boundary owns the notification→route decision.

**Additive or breaking:** the shape asked for in §3 is **additive** — one new optional field on `NotificationDto`, ignorable by any client that does not read it. The
other app on this framework can ignore it and keep working untouched. See §5 for the one variant that would _not_ be additive.

---

## The problem

Clicking a notification in the bell cannot reach the thing the notification is about. It reaches the *list* that thing's type lives in.

`src/_common/modules/notifications/utils/notificationTypeMeta.ts` maps a notification's `type` to a click-through route, and `type` is all it has to go on.
`NotificationBell.vue`'s `onItemClick` pushes whatever that returns. So:

- "Blíži sa termín: Finish the tax return" opens `/pripomienky/moje`, the full reminders list, and the user goes looking for the row that was just named to them.
- "Obdobie sa čoskoro končí" opens `/routine-todo-list`, the list of all routine periods, not the one that is ending.

That is the whole user-visible consequence: **every notification in this app is a dead end that costs a search.** It is not a crash and nothing renders wrong — it is
a click that lands one level too high, every time.

**This is a projection gap, not missing data.** The server already knows exactly which entity each notification is about:

- `Notification.PayloadJson` (jsonb) holds a typed payload per notification, and the payload records carry the entity ids —
  `PersonalReminderPayload(long ReminderId, string? Title, long? PlannerTaskId)`, `RoutinePeriodEndingSoonPayload(long PeriodId, …)`,
  `RoutinePeriodEndedPayload(long PeriodId, …)`, `RoutineStreakGraceExpiringPayload(long PeriodId, …)`, `ScheduledJobFailedPayload(…, long? RunId)`.
- `PersonalReminderPayload`'s own XML doc says `PlannerTaskId` is there **"so the client can deep-link back to the task"**. The intent is already written down; the
  field just never leaves the server.
- `NotificationDto` projects `Id, Type, Title, Body, CreatedAt, IsRead, OriginallyDueAt?` and nothing else — so both delivery paths that use it
  (`GET /notification/mine`
  and the SignalR `ReceiveNotification`) drop the identity on the floor.

Verified against the running server, not just the source: `/swagger/v1/swagger.json` shows `NotificationDto` with exactly `Id`, `Type`, `Title`, `Body`, `CreatedAt`,
`IsRead`. There is nothing on the wire to resolve against, and the client is explicitly **not** going to parse an id out of the server-rendered `Title`/`Body`.

### Correcting a premise this prompt set has been carrying

Previous notes in `prompts/_common/notifications/` claim the push path "already deep-links" and that the server therefore already holds an opinion about app routes.
**That is much narrower than believed, and it changes the argument.**

`INotificationTextRenderer.RenderPushMeta` defaults to `(null, null)`, and `NotificationTextRenderer.RenderPushMeta` returns anything non-null for exactly **one**
type — `TimerBoundary` — where the url is read straight off `TimerBoundaryPayload.Url`, i.e. **supplied by the producer that raised the notification**, not decided
by the notifications module. For every other type, including all six this app maps, `url` is absent from the push document and `../../../../../public/sw-push.js`
falls back to `'/'`.

So: the server does **not** today hold a general opinion about this app's routes. One producer passes a url through for one kind. That is a much weaker precedent for
"the server should send urls" than the earlier notes assumed, and it is the main reason this ask leans the way §3 does.

---

## The business rules

Every one of these is a question. The client currently guesses, and will follow your answer rather than the other way round.

1. **Who owns the notification→UI mapping?** This is the actual decision; the field name is downstream of it. Two coherent designs, §3 covers both.

2. **Is `DeadlineApproaching` meant to be resolvable at all?** `DeadlineApproachingPayload(string? Title = null)` carries a title and *no id* — alone among the types
   this app renders. Is that deliberate (the type is cross-module, and the producer composes a title precisely because there is no single entity to point at), or is
   it an omission that predates anyone wanting to click it? The client currently routes it to the reminders list. If it is deliberate, say so and it stays a constant
   route forever, which is a fine answer.

3. **`ReminderDigest` should stay a list — confirm.** `ReminderDigestPayload(int Count, IReadOnlyList<ReminderDigestKindCount>? Kinds)` is about N occurrences by
   construction, so the list *is* the specific target. The client treats it that way already and will not send a resolver for it.

4. **If you expose the payload, expose the _persisted_ one, never the enriched one.** `INotificationPayloadEnricher.EnrichAsync` overlays display names
   (`employeeName`) onto the JSON at render time, and `GetMyNotificationsEndpoint` already runs it for the whole page. The persisted document is non-PII **by
   construction** (`INotificationPayload`'s contract: ids and non-person scalars only, guard-tested); the enriched one is not. Any projection to the client must come
   off the raw column, or the payload PII contract quietly stops meaning anything at the network boundary.

5. **What should the client do when the reference outlives its target?** Notifications are retained 90 days read / 365 days total
   (`PurgeExpiredNotificationHistoryJobHandler`), so a reference will routinely outlive the reminder or period it points at. Options: the server omits the reference
   once the target is gone (costs a per-row existence check on a hot list read — probably not worth it), or the client accepts a possibly-dangling link and the
   destination view handles "not found" gracefully. **We assume the latter unless you say otherwise**, because it keeps the list read cheap. Please confirm — it
   decides whether the frontend needs a not-found path on each destination view.

6. **Does the reference survive erasure unchanged?** `NotificationSubjectDataEraser` deletes the recipient's own notification rows and deliberately does *not* scrub
   payloads of notifications *about* an erased subject sitting in someone else's bell, on the stated grounds that ids degrade on their own. A subject reference on
   the DTO inherits that: it may point at an anonymized entity. We read that as intended and consistent with rule 5 — flag it if not.

---

## The shape the frontend needs

One optional field on `NotificationDto`, reaching both delivery paths (`GET /notification/mine` and the SignalR `ReceiveNotification` — they share the DTO, so this
is one change). Nullability: **omitted entirely when there is nothing to point at**, matching how `OriginallyDueAt`, `tag` and `url` are already handled, rather than
written as null.

Two designs. They are mutually exclusive and the choice is yours.

### Option A — the server sends a URL

```
url?: string   // e.g. "/pripomienky/moje/482"
```

The client does `router.push(url)`. Simple, and it makes the in-app path match the push path's existing `data.url` mechanically.

**Why we think it is the wrong side of the boundary.** `NotificationDto` is framework surface, shared with at least one other app whose route table is entirely
different (that is why `_common/_locales/common.sk.ts` still carries `EmployeeModule` / `AttendanceModule` / `InventoryModule` labels). A url in this DTO means the
notifications module has to know *whose* routes it is emitting, for every consuming app, and a route rename in any one of them becomes a server change. This app's
routes are Slovak-slugged and app-owned by design; `SETUP.md` §5 states outright that the type→route map is app-owned "because the types your backend emits and the
routes they lead to are yours". Option A contradicts that. It also gives up named routes and params on the client, which is what the app's own route table is built
on.

### Option B — the server sends an opaque subject reference *(what the client seam prefers)*

```
subject?: { kind: string, id: number }
```

`kind` is a **server-owned vocabulary term**, not a route and not a path — `"reminder"`, `"plannerTask"`, `"routinePeriod"`, `"scheduledJobRun"`. `id` is that
entity's id. Each app maps `kind` → its own route in its own registered `notificationTypeMeta`. Flat `subjectKind` / `subjectId` is equally fine if it serializes
more naturally; the nesting is not the point.

**Why this one.** It puts the stable half (what the notification is *about*) on the server, which is the only side that knows it, and the volatile half (where that
lives in this particular UI) on the client, which is the only side that knows *that*. The other app gets the same field and maps it to its own screens with no
coordination. And it is genuinely additive: a client that ignores `subject` behaves exactly as today.

**The client side of Option B already exists.** The resolver seam shipped with this work: `NotificationTypeMeta.route` now accepts
`(notification) => RouteLocationRaw | undefined` alongside a constant, and `notificationRoute` takes the whole notification. It is wired, tested and live — it is
simply resolving against a DTO that carries nothing. Option B is the only missing half.

### Whichever you pick — please make the two delivery paths agree

The same server-side event is delivered twice (SignalR to an open tab, Web Push to a closed one) and a click on either should land in the same place. Today they
cannot: push has a url mechanism used by one type, in-app has a route map used by six. Whatever you choose should feed both — for Option B, `RenderPushMeta`'s url
and the DTO's `subject` should be derived from one source rather than maintained separately. `../../../../../public/sw-push.js` carries a comment pointing here so
the next person does not implement a third mapping.

### Cost

Low, and not on a hot path in any new way. `GET /notification/mine` is cursor-paged and clamped to ≤100 rows, and the handler already deserializes every row's
payload to render title/body — the reference comes out of a document that is being parsed anyway. The SignalR path renders one notification.

---

## What changes on the frontend once this lands

Small, because the seam was deliberately built ahead of the data:

- `../../../../../src/app/notifications/notificationTypeMeta.ts` — the six constant routes become resolvers, and the `TODO(B2)` block at the top of the file is
  deleted. This is the only file where real behaviour changes.
- `src/_common/modules/notifications/dto/NotificationResponse.ts` — one field added to the constructor and to `fromJson`'s destructure.
- `../../../../../public/sw-push.js` — the "two mappings that do not agree" comment collapses to a statement of the settled rule (N8 owns the restructure).
- `src/_common/SETUP.md` §5 — the resolver example stops needing its "illustrative, the DTO has no such field yet" caveat.

**Nothing else.** `notificationRoute`, `NotificationTypeMeta`, `NotificationBell.vue` and `installFramework` need no further change — they already take the whole
notification and already accept a resolver. That is the point of having built it now: this ask landing is a data change on the frontend, not a design change.

If the answer is "neither, click-through stays type-level", the seam costs nothing and the `TODO(B2)` comment becomes a permanent note explaining why — say so
plainly and it will be recorded that way.
