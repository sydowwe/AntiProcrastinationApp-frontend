# reminders-admin — use cases

## What this unit is for
The operator's console for the framework's reminder service (`src/_common/modules/reminders/`). A **reminder** is a
scheduled rule that some module registered (in this app, the Portal's personal reminders); a **notification** is what
it delivers (glossary: *Reminder vs notification*). These five screens answer three questions across **every
user's** reminders at once: what is registered and in what state, what will fire next, and what actually happened
when it fired. They let an admin pause, resume or cancel a reminder, singly or in bulk. They never edit a
schedule: configuration belongs to the module that registered the reminder.

## Where it sits
An admin reaches it from the sidebar group *Reminders* (register, upcoming, overview, dispatch history). The views
link to one another: the overview drills into the three lists, pre-filtered; Upcoming links to the overview and
the history; the history and the register link to a reminder's detail. Nothing here links out to another module.
The end user's own view of the same data is `/pripomienky/moje` (unit 16, `reminders-user`), and *how* a delivered
reminder reaches them is the notifications module's reminder preferences (unit 18). Everything is admin-gated by the
server (`requiredRole: 'admin'` in route meta is a client no-op in this host; see `_routes.md`).

## Views

### ReminderDefinitionsView (`/pripomienky/register`)
**Purpose:** the registry — every reminder definition, in any status.
**Who opens it and why:** an admin checking what a module registered, or suspending reminders in bulk (for example
pausing everything one module owns during a migration).

**What the user can do**
- filter by owner module, subject type, kind, status, schedule type and a next-occurrence date range; sort; page
- open a reminder's detail
- pause, resume or cancel one reminder from its row
- tick several rows and pause or cancel them together; the selection is limited to rows on screen

**What the user can see, and the question it answers**
- one row per definition, with status and next occurrence — answers "what is registered, and is it live?"
- the schedule column — answers "how often / when is this one due?"

**Depends on:** nothing per-user; the admin role on the server.

### ReminderDefinitionDetailView (`/pripomienky/register/:id`)
**Purpose:** everything about one reminder definition, and when it will actually fire.
**Who opens it and why:** an admin verifying that a reminder is configured correctly *before* it fires (R12), or
investigating one that failed.

**What the user can do**
- pause / resume / cancel it
- refresh the occurrence preview

**What the user can see, and the question it answers**
- key (owner module, subject, kind) — "what is this reminder attached to?"
- lifecycle (status, next / last occurrence, completed) — "is it live, and when did it last fire?"
- schedule (due date + lead times, interval preset + anchor + end, or cron + a plain-English reading) — "what rule did
  the module register?"
- upcoming occurrences (the next 8 server-computed instants, each labelled as an occurrence or a lead-time nudge;
  for a paused reminder, what would apply on resume) — "so when does this actually fire?"
- recipients (user ids or a resolver key) and content (template key, notification type, raw payload) — "who gets
  it, and what will it say?"

**Depends on:** the server's occurrence projection (`GET …/occurrences`); cron and instants are evaluated in UTC.

### ReminderUpcomingView (`/pripomienky/nadchadzajuce`)
**Purpose:** active reminders in order of their next firing.
**Who opens it and why:** "what is about to go out, and to how many people?"

**What the user can do**
- filter (as the register, plus recipient user id); sort; page
- export the current list to Excel or CSV
- jump to a reminder's dispatch history; go to the overview or the full history

**What the user can see, and the question it answers**
- kind + subject, owner module, schedule (with a lead-time marker), status, recipient count, next occurrence — "what
  fires next, and how widely?"

**Depends on:** nothing per-user.

### ReminderDispatchHistoryView (`/pripomienky/historia`)
**Purpose:** the append-only ledger of every dispatch attempt.
**Who opens it and why:** "did it go out? If not, why not? Was a failure corrected?"

**What the user can do**
- filter by reminder, owner module, recipient, outcome, "uncorrected failures only" and a dispatched-date range; sort
  by time; page; export
- open the reminder a row belongs to

**What the user can see, and the question it answers**
- per dispatch: when, for which occurrence, which reminder, outcome (sent / skipped with reason / failed with cause /
  corrected, pointing at what it corrects), notification type, recipients — "what happened when it fired?"

**Depends on:** nothing per-user.

### ReminderOverviewView (`/pripomienky/prehlad`)
**Purpose:** the health roll-up, meant to be left open on a second monitor (R9).
**Who opens it and why:** "is the reminder system healthy right now, and where should I look?"

**What the user can do**
- refresh manually; it also refreshes on return to the tab and on a slow poll
- click any number to open the list that explains it, already filtered to that number

**What the user can see, and the question it answers**
- due within N days (of all upcoming), paused, cancelled — "how much is queued, how much is suspended?"
- dispatch outcomes over the last N days — "is delivery working?"
- upcoming volume by module and by kind — "who is generating the load?"
- failures needing attention (failed dispatches not corrected, which do not retry) — "what do I have to fix?"
- when it was last updated, and whether the last refresh failed — "can I trust these numbers?"

**Depends on:** the server's windows (`upcomingWindowDays`, `recentWindowDays`), which are returned with the counts.

## Entity lifecycle
A reminder definition is **created by the owning module** through the server's registration API (here the Portal
creates one per personal reminder), never in this unit. Its schedule is immutable from here. This unit moves it
through lifecycle states: Active ⇄ Paused (pause / resume), Active or Paused → Cancelled (terminal; the row stays,
with no actions). Completed is reached by the server when a one-shot's last occurrence fires. Nothing is deleted.
Dispatch rows are append-only. A correction is a new row that *reverses* an earlier one (outcome *Corrected*), and
the failure it corrects stops counting as "needing attention". No delete, and so no cascade, exists in this unit.

## Data this unit captures but does not spend
This unit writes only lifecycle transitions. Among the data it *reads*, several fields arrive and go unused:
- `payloadJson.title` ("Call the dentist") — shown only as raw JSON on the detail; every list names reminders by kind
  and subject id instead (O1).
- `dueAt`, `intervalPreset`, `cron`, `anchorDate`, `endsAt`, `leadOffsets`, `recipients`, `templateKey` on the register's
  grid rows — dropped by `ReminderDefinitionGridResponse` (B1/B2).
- `dueAt`, `anchorDate`, `endsAt`, `payloadJson`, `recipientMode` on Upcoming's rows — unmapped.
- `correlationId` on dispatch rows — only as a hover `title` on a failure cause.
- `templateKey` on Upcoming (kept on the DTO, unrendered, per its own comment).
