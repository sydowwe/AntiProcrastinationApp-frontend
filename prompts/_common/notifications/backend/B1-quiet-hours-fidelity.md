# B1 · Backend ask — quiet hours are evaluated in the wrong clock, and hold reminders past the moment they were about

**Contract only.** Nothing below prescribes storage, entities, migrations, scan implementation or where
a computation happens — only the semantics the client renders, and which of them the client is currently
describing wrongly.

This ask exists because of the answer to `prompts/user/backend/B2-preference-ownership.md`, which
confirmed the reminder-preference system is the *only* delivery switch and, in passing, flagged two live
behaviours and one dead control. Read B2's ANSWERED section first — the ownership question is settled and
is not reopened here.

## The problem

Three separate things, all reachable from `/nastavenia/pripomienky`, all live today.

**1. Quiet hours are evaluated in the deployment timezone, not the user's.** The reminder instant is
composed in the user's own zone (`User.Timezone`), but the quiet-hours check reads a single
`Application:Timezone`. They are identical today only because every user happens to sit in that zone.
Client-side, `QuietHoursCard.vue:124-125` turns `startMinute`/`endMinute` straight into bare wall-clock
times (`Time.fromMinutes`) with no zone attached at all, and `QuietHoursWindow.ts:1-3` documents them the
same way. So the moment one user travels or one account is created elsewhere, the app shows a
window that is not the window being enforced, and no error surfaces.

**2. A reminder held by quiet hours is delivered stale, with no upper bound.** Deferral is
never-dropped, which is right for most reminders and wrong for one shaped like a planner task: a
reminder for a 23:30 task inside a 22:00–06:00 window is held all night and delivered around 06:00 —
hours after the thing it was about. The user sees a notification for an event that is over. Nothing in
the contract lets the client distinguish "still useful" from "was about last night".

**3. `ChannelHint` is stored but not enforced.** `INotificationService.NotifyAsync` carries no channel
selector, so the per-kind channel is metadata only. `ReminderKindRow.vue:22-33` renders it as a
`VSelect` labelled `reminderPreference.kind.channelHint` ("Preferovaný kanál") and persists it through
`UpsertReminderKindRequest`. The user makes a choice, it saves, a success snackbar appears, and nothing
about delivery changes. That is a control that lies, and it is in the framework — every app mounting
this module ships it.

## The business rules

Stated as the client currently assumes them. Correct any that are wrong; we follow the server.

1. **Whose midnight is `startMinute` / `endMinute`?** We assume the user's own zone, because that is the
   only reading under which a "22:00–06:00" window means what the user typed. If it is the deployment
   zone, say so and we will label the control with that zone rather than pretending. If it becomes the
   user's zone, we need to know whether the stored values are reinterpreted or migrated — a user whose
   window was authored under the old reading will silently shift.
2. **What happens across a DST transition?** A minutes-from-midnight window has no answer for the hour
   that repeats or the hour that does not exist. Whichever rule you pick, we will document it in the
   card's subtitle; today we say nothing, which reads as "this is exact".
3. **Should a deferred reminder ever be dropped, or delivered marked-late?** Three shapes work
   client-side, in our order of preference:
   a. the reminder carries a staleness bound and the server simply does not send an occurrence that
      missed it (nothing needed client-side — this is the cheapest honest answer);
   b. the delivery carries a flag or an original-due instant, and we render "was due at 23:30" instead
      of a live nudge;
   c. status quo, and we change the quiet-hours copy to say reminders may arrive after the fact.
   We are not asking for a per-reminder policy field unless you want one — a global rule is fine.
4. **Is `ChannelHint` intended to become enforced, or intended to be metadata?** If enforced, we leave
   the control and no contract change is needed. If it is metadata by design, say so and we will hide
   the select in the framework component rather than keep shipping a no-op — but that is a framework UI
   change affecting every app mounting this module, so we would rather have the answer than guess.

## The shape the frontend needs

Only (1) and (3) can imply a contract change; both are **additive** and safe for the other app on this
module (see this directory's README — the notifications module is shared, and its other consumer is a
different service).

- For (1): a timezone identifier alongside the window on `GET /reminder-preference` — IANA string, e.g.
  `"Europe/Bratislava"`, non-null if the window exists — or an explicit statement in the docs that the
  window is interpreted in `User.Timezone`. `QuietHoursCard.vue` renders the two times and needs to know
  which clock these belong to; today it names none.
- For (3a): nothing. For (3b): a nullable original-due instant (UTC ISO-8601) on the delivered
  notification payload, read by the in-app notification list and the push payload alike.
- For (4): nothing if enforced.

Neither is hot: quiet hours are fetched once per settings-page visit.

## What changes on the frontend once this lands

- (1) `QuietHoursWindow.ts` gains the zone and its top-of-file comment stops being a half-truth;
  `QuietHoursCard.vue` formats against it and can show the zone next to the window when it differs from
  the browser's — which is exactly the case the bug hides today.
- (3) either nothing (a), or the notification renderer gains a "was due at …" line and the quiet-hours
  subtitle keeps its current promise honestly (b), or only copy changes (c).
- (4) either nothing, or the channel `VSelect` and its enum options come out of `ReminderKindRow.vue`,
  removing a control that currently produces a success snackbar for a no-op.
