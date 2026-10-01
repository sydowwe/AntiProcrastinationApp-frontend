# reminders-user — use cases

## What this unit is for
The one screen of the framework's `reminders` module that an ordinary (non-admin) user sees. It lists the upcoming
**reminders** the signed-in user is an explicit recipient of — one row per reminder, showing only its soonest
pending occurrence — and lets them act on a single occurrence for themselves: **snooze** it (have it delivered at a
later instant they choose) or **dismiss** it (not have it delivered to them at all). Neither action touches the
reminder's schedule or any other recipient.

A *reminder* here is the scheduled rule; the thing that eventually lands in the bell is a *notification*
(glossary, *Reminder vs notification*). This screen never shows notifications.

## Where it sits
- **Reached from:** the user menu's *My reminders* entry only. The route is deliberately absent from the sidebar
  (`src/app/nav/navItems.ts:74`); the four sidebar *Reminders* entries are the admin screens of unit 17.
- **Before:** usually a reminder notification in the bell, or the planner's settings tab pointing the user at
  reminder controls.
- **Next:** the *Reminder preferences* button sends the user to `/nastavenia/pripomienky` (the notifications
  module's reminder-preference screen, unit 18) for anything broader than one occurrence — quiet hours, muting a
  kind, channels.
- **Other modules touched:** the reminder rows are created by other modules (`ownerModule` names the producer; the
  seed's rows say `Portal`). Delivery of a snoozed occurrence happens through the notifications module.

## Views

### MyRemindersView (`/pripomienky/moje`)
**Purpose:** the recipient's own upcoming reminders, with per-occurrence snooze and dismiss.
**Who opens it and why:** someone who has been told a reminder is coming (or keeps getting one) and wants to move
or skip the next one without muting the whole kind.

**What the user can do**
- see every reminder they are an explicit recipient of that still has a pending occurrence, soonest first
- sort by kind, owner module or next occurrence
- filter by owner module, kind, schedule type and a next-occurrence date range; the filter lives in the URL
- snooze the next occurrence of one reminder: *In 1 hour*, *Tomorrow morning (9:00)*, *In a week* (09:00 seven
  days out), or a custom date and time — each preset shows the instant it resolves to before confirming
- dismiss the next occurrence of one reminder, after a confirmation that says it cannot be undone from here
- jump to reminder preferences

**What the user can see, and the question it answers**
- the table — answers "what is going to remind me, and when?" (today it cannot answer *which* reminder a row is;
  see findings B1)
- the schedule cell — answers "is this a one-off or does it repeat?"
- the snooze dialog's *Occurrence* line and preset instants — answers "which occurrence am I moving, and to when?"
- a screen-reader-only live region — answers "how many rows did that filter/sort return?"

**Depends on:** the account's timezone/browser clock (all instants are formatted in the browser's zone); the
framework `DateTimeHelper` formatters (currently Slovak-shaped regardless of locale, `_fix-queue` S11). No user
preference (`askBeforeDelete`, `firstDayOfWeek`) is read. Server-side it depends on the user being an
**explicit** recipient: reminders whose recipients are resolved by a strategy at dispatch time never appear here
(`GetMyUpcomingRemindersEndpoint.cs` summary).

## Entity lifecycle
This unit creates no entity. Reminders are created by their owning module (server-side) and managed by admins
(unit 17). The two actions append a per-recipient **occurrence action** record on the server
(`ReminderOccurrenceAction`, append-only):
- **snooze** writes a marker `(occurrence, recipient, snoozeUntil)`; the scanner later delivers it as its own due
  item at `snoozeUntil`, even inside quiet hours (the user chose the instant).
- **dismiss** writes a suppression marker for `(occurrence, recipient)`; that recipient does not get that
  occurrence.
Neither can be reversed from the UI (no un-snooze/un-dismiss endpoint). Nothing cascades: the reminder, its
schedule and other recipients are untouched.

What actually happens, as of round 2 (findings X1, B2, B6):
- **From this screen, neither action is recorded.** The client sends keys the server does not bind, and both
  endpoints answer 404 (X1). The lifecycle above is the server's behaviour, exercised directly.
- A snooze **replaces** the occurrence for that recipient. The scanner delivers at `snoozeUntil` and then skips the
  original send (`SkipReason.Snoozed`). A `snoozeUntil` *before* the occurrence therefore delivers it early, and the
  dialog's default preset is usually before it (B2).
- Neither action changes what `my-upcoming` returns. The row stays, with the same instant, and can be acted on
  again. Duplicate dismisses are accepted (B6).

## Data this unit captures but does not spend
- `templateKey` — sent on every `my-upcoming` row (`portal.personal-reminder`), mapped into the DTO, never rendered.
- Snooze/dismiss markers — written by this screen, but no view (this one included) reads them back; the list does
  not show that an occurrence is snoozed or dismissed (findings B6, O1).
- The reminder's human text ("File the tax return") is rendered server-side into the delivered notification, but
  never onto this list (findings B1).
