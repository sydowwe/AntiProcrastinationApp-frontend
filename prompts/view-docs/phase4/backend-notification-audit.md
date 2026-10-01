# Phase 4 — backend notification audit

Run as **Opus 5, high effort, clean context, no browser.** Run **last** in Phase 4, after both
`docs/data-map.md` (app reconcile) and `docs/data-map/framework.md` (submodule) exist. It needs the app's
time-bearing fields and the framework's app-wiring list as inputs.

**Read-only against the backend repo.** It reads `C:\Users\jakub\RiderProjects\AdhdTimeOrganizer` and changes
nothing there, and it does not need the API running.

```
You are auditing which events in this app produce a reminder, a notification or a scheduled
job, and which plausibly should but don't. The frontend can't answer that, because it only
renders what the backend sends. So the evidence is the backend code, checked against the list
of time-bearing data the frontend already captures.

Inputs:
1. docs/data-map.md, section "Time-bearing fields": every date, deadline, duration, recurrence
   and period field the app captures, and what each time means.
2. docs/data-map/framework.md, sections "App wiring" and "Opportunities (framework)": which
   notification kinds and reminder labels the app registers metadata for.
3. The backend at C:\Users\jakub\RiderProjects\AdhdTimeOrganizer. Read only.
4. src/app/notifications/notificationTypeMeta.ts and reminderLabels.ts, if you need to confirm
   (2) against source.
If (1) or (2) is missing, stop and say which.

Hard constraints:
- Write exactly one file: docs/notification-audit.md. Change nothing in either repo.
- Do NOT write a backend ask file (prompts/view-docs/backend/B*.md). Asks are written by
  whoever implements the change. Your output is the evidence they will start from.
- This is a Windows machine. Use the PowerShell tool for shell commands, never Bash.
- Quartz, not Unix: cron expressions have 6–7 fields, seconds first, 1 = Sunday, evaluated in
  UTC.

## Step 1: find every producer in the backend

Search the backend for every place that creates, schedules or dispatches:
- a notification (the notifications module: whatever publishes or persists one; SignalR and web
  push sends),
- a reminder definition or occurrence (the reminders module, and every other module that
  registers one),
- a scheduled job (the scheduler module's job registrations and their triggers).
Start from the notification, reminder and scheduler services and entities, then find their
callers. For each producer record: the backend file, what triggers it (user action / cron /
another event), the kind it emits (ownerModule, kind), the channel(s) (in-app, push, e-mail),
and which user preference gates it (reminder preferences, quiet hours, per-kind mute).

## Step 2: check coverage in both directions

- Kinds the backend emits that the app has NO metadata for (from input 2). These render
  generically or not at all on the frontend. That's a concrete gap.
- Kinds the app registers metadata for that no backend producer emits. That's dead wiring, or a
  producer you missed. Look again before you call it dead.

## Step 3: time-bearing fields with no producer

For each row of the time-bearing table whose time means deadline, start, recurrence or period
(skip audit timestamps and plain durations), answer:
- Does any producer from step 1 act on this field? Name it.
- If not, would a user plausibly want to hear about it? Reason from the field's meaning and from
  the app's purpose (an anti-procrastination tool, for users with ADHD). A to-do's due date
  passing unseen is a strong candidate. A leisure project's creation date is not.
- If yes, which EXISTING mechanism would carry it: a reminder definition, a scheduler job, a
  direct notification from an existing domain event? Prefer the existing mechanism over a new
  one, and say what it would need.

Be selective. A list of forty "should notify" rows is noise. Rank them and argue for the top
ones. Each candidate needs a one-line "why a user wants this" that isn't just "it has a date".

## Output: docs/notification-audit.md

    # Notification audit

    > Audited <date> · frontend commit `<sha>` · backend commit `<sha from git -C <backend> rev-parse --short HEAD>`

    ## Summary
    <6–10 lines: how many producers, the coverage gaps, the top 3 candidates.>

    ## Producers
    | # | backend file | trigger | ownerModule / kind | channels | gated by |
    | --- | --- | --- | --- | --- | --- |

    ## Coverage gaps
    ### Emitted, no frontend metadata
    ### Registered, never emitted

    ## Candidates: time-bearing data nothing notifies about
    ### N<n>. <what the user would be told, in user language>
    - **Field(s):** <Entity.field, from the time-bearing table>
    - **Why a user wants it:** <one or two lines>
    - **Carried by:** <existing mechanism, and what it would need>
    - **Gating:** <which reminder preference or quiet-hours rule should apply>
    - **Size:** S | M | L
    <Ranked, best first.>

    ### Considered and rejected
    <One line each: field, and why not.>

## When you are done

End with only this:

    Notification audit
    File: docs/notification-audit.md
    Producers: <n> (notification <n> · reminder <n> · scheduler job <n>)
    Emitted without frontend metadata: <n> · registered never emitted: <n>
    Candidates: <n> ranked · <n> rejected
    Top 3: <N ids and one-line names>
```
