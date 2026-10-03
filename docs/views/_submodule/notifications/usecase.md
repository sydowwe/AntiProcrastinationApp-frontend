# notifications — use cases

> Framework unit: `src/_common/modules/notifications/` (vue_framework submodule). Vocabulary per `docs/views/glossary.md`:
> a **reminder** is the scheduled rule, a **notification** is the delivered message; **reminder preferences** are the
> per-user system that owns *whether, when and how* a notification reaches the user.

## What this unit is for
Everything that happens to a notification after the server raises it: seeing it, catching up on the ones you missed,
following it to what it is about, and clearing it — plus the one settings page that decides whether, when and on which
channels notifications reach you at all. The bell in the top bar (documented in `_shell`) is a peek at the top of the
same list; this unit is the full history and its controls.

## Where it sits
Notifications are raised server-side by other modules — the routine to-do list (period ending / ended, streak grace,
routine suggested today), the day planner and reminders (personal reminders, reminder digests, deadlines), the activity
history timers (`TimerBoundary`: focus finished, short break over, timer finished) and the scheduler (job failed /
overdue) — and pushed live over a SignalR hub. A user usually meets one as a snackbar or a red badge on the bell, opens
the bell, and either clicks through to the subject or follows *See all* to `/notifikacie`. Clicking a notification marks
it read and navigates to its subject (a routine period → `/routine-todo-list?focus=<id>`, a planner task → the day
planner focused on it); several types have no destination. The preferences page is reached from the user menu, from
`/user/settings`, and from the day planner's settings (*Reminders* tab), which hands off here for anything about real
delivery. The browser push master switch is **not** here — it lives in `/user/settings` › Security, because subscribing
must happen in a user gesture with its own error handling (N12's decision).

## Views

### NotificationsView (`/notifikacie`)
**Purpose:** the full notification inbox — history, filters, per-item and bulk actions.
**Who opens it and why:** someone who saw the badge climb, dismissed a toast too fast, or wants to find "that reminder
from yesterday"; or someone clearing out a backlog.

**What the user can do**
- read the whole history, newest first, grouped under Today / Yesterday / dated headers, with runs of the same type
  folded into "X and N more" clusters that expand in place
- narrow to unread only, or to one notification type; the choice lives in the URL, so it survives a reload and can be
  bookmarked
- open a notification, which marks it read and takes them to what it is about
- mark one read or unread again (read is not a one-way door)
- dismiss one or many, permanently, after a confirmation that says it cannot be undone
- mark everything read in one action
- load older pages explicitly, a page of 20 at a time
- watch new ones arrive live without a toast (the inbox suppresses its own snackbars)

**What the user can see, and the question it answers**
- the unread count beside the heading and on the Unread filter — "how much have I not looked at?"
- day headers and times — "when did this happen?"
- the unread dot and tinted background — "which of these are new to me?"
- an "Originally due …" line on a notification that quiet hours held back — "is this late, and by how much?"
- "Reconnecting…" beside the heading — "is this list live?"
- the end-of-list line — "is this everything, or is there more behind the button?"

**Depends on:** the SignalR hub (today it also gates the first load — see findings B1); the account locale (titles and
bodies are rendered server-side in it); the viewer's timezone for day grouping; the app's `notificationTypeMeta`
registration for icon, colour, label and click-through route of each type.

### ReminderPreferencesView (`/nastavenia/pripomienky`)
**Purpose:** decide whether, when, and on which channels notifications reach you.
**Who opens it and why:** someone being woken by alerts at night, someone drowning in one kind of reminder, someone who
wants e-mail for failures only — or someone sent here by the day planner's settings to turn reminders off "for real".

**What the user can do**
- set one daily quiet-hours window (on/off switch, from/to times; overnight windows allowed); inside it, scheduled
  reminders and the push/e-mail copies of other alerts are held and delivered when it ends, never dropped — the in-app
  bell and inbox are never held (round 2, findings P6); the card saves as you go and the switch-off is undoable
- mute an individual reminder kind without silencing the rest (the card's promise — on this deployment there is no way
  to create such a mute, see findings B3)
- for every alert type, choose which channels carry it — in-app, push, e-mail — with channels the server cannot
  deliver on shown but disabled, and a warning when a type would reach them on no channel at all

**What the user can see, and the question it answers**
- the quiet-hours state and window — "when will I not be disturbed?"
- the list of reminder kinds they have changed — "what have I muted?"
- the delivery matrix — "where will a *deadline* / *job failure* / *timer* alert reach me?"
- the "not set up on this server" notice — "why can't I tick push or e-mail?"
- per-card error panels with retry — "did my settings fail to load, or do I really have none?"

**Depends on:** the deployment's channel configuration (`/notification-preference/channels` — push needs VAPID keys,
e-mail needs SMTP; neither is configured here); the device's push subscription (for the device warning); the server's
catalog of notification types.

## Entity lifecycle
- **Notification** — created only server-side (by producer modules, or `POST /notification/test` for admins) and
  delivered over the hub or read via `GET /notification/mine`. Edited only by read state (`PATCH …/read`, `…/unread`,
  `POST /notification/read-all`). **Dismiss is a hard delete** (`DELETE /notification/{id}`, `POST /notification/delete-batch`)
  — permanent, no undo, confirmed every time, settled with backend B3. Retention: read ones purge at 90 days, all at
  365; marking unread moves a row from the 90- to the 365-day bucket (intended). Nothing cascades from a notification.
- **Quiet-hours window** — one per user; created/replaced by `PUT /notification-quiet-hours`, removed by `DELETE`. Stored
  with the user's timezone. Two consumers: the reminders scan defers a whole occurrence while every recipient is inside
  their window; the notification dispatcher defers only the **background channels** (push, e-mail) of every other type —
  the history row and the in-app push go out at once (`NotificationService.cs:77-86` in the API; observed round 2).
  `TimerBoundary` and due snoozes are exempt from both.
- **Reminder-kind preference** — one row per `(ownerModule, kind)` the user has changed; upserted by
  `PUT /reminder-preference/kind`. Absent row = kind enabled. Never deleted from this UI.
- **Notification preference** — one row per `(type, channel)` the user has changed; `PUT /notification-preference`.
  The GET returns the effective full matrix (stored value or the channel default). The server writes **no history row**
  only when every channel *preference* is off — including channels the deployment has not configured. The screen
  counts only deliverable channels, so on this deployment (push and e-mail unconfigured, push default-on) unticking
  In-app says "not even in the notification list" while the row still lands in the inbox (findings B4).

## Data this unit captures but does not spend
- `Notification.subject` for `reminder` kinds — carried on the wire, deliberately unrouted (no reminder-row UI exists in
  this app; documented in the module README, "Landed with B2").
- `TimerBoundary` push payload `url` — the in-app path cannot read it, so timer notifications in the inbox lead nowhere
  even though the push notification for the same event does.
- Quiet-hours window `timeZone` — stored and returned, shown only as a mismatch warning; the inbox never uses it.
- The deferred-notification count implied by a quiet-hours window — not exposed by the server, so the card does not
  show "N notifications are currently held" (noted, not asked, in N10).
