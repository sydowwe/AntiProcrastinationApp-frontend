# B4 · Backend ask — make the preference catalog describe *this* deployment, not the framework

> ## ✅ ANSWERED AND LANDED — 2026-08-27
>
> **Both halves came, and the shape did not change.**
>
> - `GET /notification-preference/mine` now returns only the types this deployment can raise — **10 types × 3
>   channels = 30 rows**, down from 19 × 3 = 57. The ten: `DeadlineApproaching`, `ReminderDigest`,
>   `PersonalReminder`, `RoutinePeriodEndingSoon`, `RoutinePeriodEnded`, `RoutineStreakGraceExpiring`,
>   `ScheduledJobFailed`, `ScheduledJobOverdue`, `TimerBoundary`, `Test`. The nine HR/inventory kinds are gone
>   and will never appear here.
> - `PUT /notification-preference` is unchanged for those ten and now **`400`s for a type outside the list**. The
>   client only ever writes types it read back from the same endpoint, so there is no UI path to a rejection —
>   keep it that way.
> - **The optional half came too:** `GET /notification-preference/channels` → `[{ channel, configured }]`, read
>   off the same options the dispatcher's own guards consult, so `configured: false` means a send would be
>   silently dropped. `InApp` is always true; `WebPush` reflects VAPID; `Email` reflects SMTP.
>
> **Client cleanup, done the same day.** The intersection in `buildNotificationPreferenceMatrix` collapsed to a
> pass-through (`knownTypes` and `unknownTypeCount` gone, along with the `catalogNote` locale entry in both
> locales and the footnote that rendered it); row order is the server's; `notificationTypeMeta` is back to
> icon / colour / route / optional label and decides nothing about which rows exist — an unregistered type still
> renders, under its raw enum name. `disabledChannels` generalised from a Push special case to a lookup over
> `/channels`, which is what actually fixed e-mail. `GET /push-subscription/vapid-public-key` is untouched and
> still owns the subscribe flow. See _Landed with B4_ in `../README.md`.
>
> Everything below is the original ask, kept for the reasoning.

**Contract only.** Nothing here prescribes storage, entities, migrations or where a computation happens — how
a host declares its catalog, and whether the answer is computed or configured, are the backend's calls.

> **Read the first section before the rest.** The thing this ask is *not* about is the thing the prompt set
> expected it to be about, and that matters for how you weigh it.

## What this is NOT asking for

`prompts/_common/notifications/backend/README.md` lists "Per-notification-type preferences (from N12)" as a
known candidate and says: *"Ask whether they are meant to be the same registry before proposing a second one."*

**Both halves are already answered, in your source, and neither needs anything from you.**

1. **They are two distinct axes, and you say so explicitly.** `ReminderKindPreference`'s own XML doc states the
   boundary: that module decides *whether a scheduled reminder of a kind may fire for a user*; the notifications
   module *owns the channel transport and its own per-channel filtering*, "which is why this entity carries no
   channel column". The two compose in sequence — `ReminderScanJobHandler` drops opted-out recipients while
   resolving them, i.e. **before** `NotifyAsync` is called, and `NotificationService.NotifyAsync` then filters
   per `(type, channel)` for every producer, reminder or not. Neither is derivable from the other:
   `ReminderDefinition.NotificationType` is nullable and chosen per definition, one kind can carry any type, one
   type covers many kinds, and most types (`ScheduledJobFailed`, `RoutinePeriodEnded`, `TimerBoundary`) never go
   through the reminders scan at all.
2. **The second registry already exists and already works.** `GET /notification-preference/mine` and
   `PUT /notification-preference` have been there the whole time. The frontend had simply never called them.
   The screen N12 was told to build is now built and shipping against them unmodified —
   `NotificationTypeSettingsCard.vue`, the third card on `/nastavenia/pripomienky`, verified against the running
   server. **That is the sixth and seventh endpoint this prompt set has "discovered" that already existed.**

So: no new registry, no new route, no change to either write path. What follows is one narrow contract gap that
the screen actually hit.

## The problem

`GetMyNotificationPreferencesEndpoint` builds its response with:

```csharp
foreach (var type in Enum.GetValues<NotificationType>())
foreach (var channel in Enum.GetValues<NotificationChannel>())
```

Its own doc comment calls the result "the full (type, channel) preference matrix … doubling as **the catalog**",
and as a catalog it is exactly right for one deployment and wrong for every other, because `NotificationType` is
a **framework contract shared across apps**. Its own source marks the split:

```csharp
// Business-app kinds. Appended, never inserted: audit payloads persist enums as ints…
StockLow, UpcomingHrEvents, LeavePending, WorkLogComplianceBreach, LeaveApproved,
LeaveRejected, WorkLogApproved, WorkLogRejected, RegistratoryDisposalDue,
```

Nine of the nineteen members belong to the HR/inventory product. **This deployment (an ADHD time organiser) can
never raise one**, and no locale here names them — so rendering the server's catalog verbatim puts a row reading
`StockLow` and `LeaveApproved`, in raw English enum casing, in a Slovak settings screen of an app that has no
inventory and no leave. That is precisely the defect `reminderPreference.ownerModule.{EmployeeModule,
AttendanceModule, InventoryModule}` already had and that N9 was written to fix.

**The user-visible consequence today** is the workaround, not the raw rows: the client intersects your catalog
with its own registered type map (`src/app/notifications/notificationTypeMeta.ts`), and the footnote under the
table reads *"The server knows 9 more alert types this app cannot name — they stay at their defaults."* That
sentence is honest but it is an apology for a list the client had to guess at.

**And the guess is provably lossy in the other direction.** Building this screen found that this app's registry
was missing `TimerBoundary` — a type its own backend raises on **every pomodoro boundary**, via
`TimerBoundaryAlarmJobHandler`. It had never been registered, so it rendered a grey bell with no click-through
and could not be filtered in the inbox; it would also have had no row in this settings screen. A client-side
list of "types that exist here" drifts silently, because nothing fails when it is wrong. Your enumeration is the
only thing in the system that cannot drift — it is just currently scoped to the wrong thing.

## The business rules

Framed as questions, because the current client behaviour is a guess:

1. **Is a `NotificationType` member meant to be meaningful for every deployment, or only for the app that
   raises it?** The append-only comment and the "business-app kinds" heading suggest the latter, but the
   preference endpoint's enumeration asserts the former. One of the two is wrong; we assume the endpoint is.
2. **Should a user be able to hold a preference for a type this deployment cannot raise?** We assume not — it is
   an unanswerable question to put in front of someone. If you disagree (e.g. because one database serves both
   products and a user can move between them), say so and the client will keep the intersection permanently.
3. **Is "which types can this deployment raise" knowable server-side at all?** It may be that nothing currently
   declares it — the producers call `NotifyAsync(…, NotificationType.X, …)` from scattered handlers and no
   registry collects them. If declaring it is a real cost, say so: the intersection is a working fallback and
   this ask is an improvement, not a blocker.

## The shape the frontend needs

**Additive and non-breaking**, and deliberately the smallest possible change: **`GET /notification-preference/mine`
returns rows only for the types this deployment can actually raise.** Same route, same
`NotificationPreferenceItem` shape (`type`, `channel`, `enabled`), fewer rows.

The other app is unaffected by construction — it would receive its own types, which is what it renders today.
No client anywhere reads a row it did not ask for, so nothing breaks by rows being absent. Not hot: this is one
settings screen, read once per visit.

One optional extra, worth a sentence rather than a section — **is the channel deliverable on this deployment?**
`GET /push-subscription/vapid-public-key` already answers this for Web Push, and N8's work depends on it
distinguishing "not configured" from "could not fetch". Email has no equivalent, so
`EmailNotificationOptions.IsConfigured` is invisible to the client: on a deployment with no SMTP the screen
shows a writable E-mail column that silently delivers nothing, and — because `DeadlineApproaching`,
`ScheduledJobFailed` and `ScheduledJobOverdue` are email-default-ON — shows those three as *checked*. If a
per-channel "configured here" flag is cheap, the client would disable those columns the way it already disables
Push. If it is not, leave it; this is the smaller half of the ask.

## What changes on the frontend once this lands

- `buildNotificationPreferenceMatrix`'s intersection collapses to a pass-through, and its `unknownTypeCount`
  output plus the `notifications.typeSettings.catalogNote` locale entry (SK + EN) are **deleted** along with the
  footnote that renders them. Two of the nine unit tests in `notificationPreferenceMatrix.test.ts` go with it.
- `notificationTypeMeta` stops being load-bearing for *which rows exist* and goes back to being only what it
  claims to be — icon, colour, route, optional label. A type the app has not registered would then still get a
  row (with its raw name, which is the correct degradation for a settings screen and is already how
  `notificationTypeLabel` behaves), so the `TimerBoundary` class of drift stops being able to hide a control.
- If the channel flag comes too, `NotificationTypeSettingsCard`'s `disabledChannels` generalises from a Push
  special case to a lookup, and the Email column stops promising delivery on deployments that have no SMTP.
