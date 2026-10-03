# scheduler — use cases

## What this unit is for
The operator's window onto the server's background jobs. A **scheduler job** is server-side recurring or one-shot
work (glossary: *Scheduler job vs reminder* — Quartz cron, 6–7 fields, seconds first, UTC), registered by the app's
modules: nightly purges, the reminder scan, routine nudges, and one-shot alarms the History timer schedules for each
running phase. The unit answers three questions: *what runs next*, *did it run and what happened*, and *is anything
broken right now* — and lets the operator act: run a job now, pause or resume it, or replay a past run.

It is a **framework** module (`src/_common/modules/scheduler/`), shipped to every app on `vue_framework`. This app
only chooses its Slovak paths (`APP_SCHEDULER_PATHS` in `src/router.ts`) and puts two entries in the sidebar.

## Where it sits
Sidebar › *Job scheduler* › *Scheduled jobs* / *Needs attention*. Nothing else in the app links in. An operator
typically lands on *Needs attention* (the page meant to be left open on a second monitor), follows a failing or
overdue job to its detail, reads its run history, opens a failed run to see the exception, correlation id and
payload, and — once the cause is fixed — replays it or triggers the job. From the jobs list they sort by next run or
filter by module, status, last outcome or "overdue only", and export the filtered set.

It touches no other module's UI. It *describes* other modules' work: `History.TimerBoundaryAlarm` (the timer's
end-of-phase alarm), `reminders.scan`, `Routines.*`, `Notifications.*`, `Tracking.*`, `Portal.*`,
`Scheduler.*` housekeeping.

The client-side `requiredRole: 'admin'` is a no-op in this app, and the server does not gate these endpoints for
this host (`_routes.md`), so any signed-in user can operate the jobs.

## Views

### SchedulerJobsView (`/planovac/ulohy`)
**Purpose:** every registered job, one row each, soonest next run first.
**Who opens it and why:** to see what runs next, to find a job by module or handler, or to act on one without
opening it.

**What the user can do**
- sort by job key, owner module, status, last run or next run; page through
- filter by owner module, handler key, status, schedule type, last outcome and a next-run window, or flip *Overdue
  only*; every filter is a removable chip and lives in the URL, so a filtered view can be bookmarked or shared
- export the filtered set (all pages) as Excel or CSV
- run a job now, pause it or resume it from its row
- open a job's detail, or jump to *Needs attention*

**What the user can see, and the question it answers**
- Schedule column — "when does this repeat?" (cron expression, "every n minutes", or "once at …")
- Status + *Overdue* chip — "is it running as it should?" (overdue is the server's call, with its grace margin)
- Last run (outcome + how long ago) — "did it work last time?"
- Next run (how long until) — "when is it due?"
- *Orphaned* chip — "is the code for this job still deployed?"

**Depends on:** the server's job registry; client clock for relative times; refreshes itself every 2 minutes
while visible.

### SchedulerJobDetailView (`/planovac/ulohy/:id`)
**Purpose:** one job's definition, state and full run log.
**Who opens it and why:** to see why a job failed or is late, and to act on it.

**What the user can do**
- trigger it now (the new run is watched for and appears in the history), pause or resume it
- copy the job key
- filter, sort, page and export the run log; refresh it
- open any run, or replay one behind an acknowledged warning

**What the user can see, and the question it answers**
- Job info — "what is this job and how is it scheduled?" (key, description, module, handler, schedule)
- Last run / Next run / Overdue state — "is it healthy right now?"
- Orphan alert — "can this job run at all?"
- Run history — "what has it done, how long did it take, what failed, and who started each run (schedule, manual,
  replay, automatic retry)?"

**Depends on:** job status and orphanhood (gate Trigger and Replay); run log size (a 10-second job has ~58 000 runs).

### SchedulerRunDetailView (`/planovac/behy/:id`)
**Purpose:** one execution, in enough detail to diagnose it.
**Who opens it and why:** a run failed, or behaved oddly, and the operator needs the exception, the timing, the id
to search logs with, and the exact input.

**What the user can do**
- copy the job key, the correlation id and the raw payload
- expand the payload
- follow the lineage to the run this one re-ran, or to the runs that re-ran it
- replay the run (disabled, with a reason, when the job is removed or orphaned)

**What the user can see, and the question it answers**
- outcome + trigger source — "did it work, and what started it?"
- due at / started at / finished at / duration — "was it on time, and how long did it take?"
- error type + message — "why did it fail?"
- payload snapshot — "what exactly did it run with?"
- lineage — "is this a re-run, and has it been re-run?"

**Depends on:** the job's *current* status and orphanhood (a replay meets today's registry, not the run's snapshot).

### SchedulerNeedsAttentionView (`/planovac/pozornost`)
**Purpose:** a health summary that keeps itself fresh.
**Who opens it and why:** to know at a glance whether anything is broken, usually left open on a second screen.

**What the user can do**
- refresh on demand (it also refreshes itself every minute while visible, and keeps showing the last good data if a
  refresh fails)
- click a status count or a list's *View all* to land on the jobs list with that filter applied
- open any listed job

**What the user can see, and the question it answers**
- As of … — "how fresh is this?"
- Active / Paused / Removed counts — "how big is the registry?"
- Run outcomes over the last 24 h — "how has the last day gone?"
- Failed / Overdue·stuck / Orphaned lists, each row with the server's reason — "what needs me, and why?"
- all-clear card — "nothing needs me"

**Depends on:** `GET /scheduler-dashboard/health`, computed per request.

## Entity lifecycle
Jobs are **registered by server modules**, never created, edited or deleted here. The operator can change only a
job's status (pause ⇄ resume) and cause runs (trigger now, replay a past run). A one-shot job fires once and should
then stop being `Active` — see `B6` for what the registry actually shows. Runs are an **append-only log**, written when
a handler finishes; nothing here deletes them (`Scheduler.PurgeExpiredRunLogs` does, monthly, server-side). A replay
or an automatic retry creates a new run pointing at the one it re-runs (`replaysRunId`). Nothing cascades from this
UI.

## Data this unit captures but does not spend
This unit writes no data (only pause/resume/trigger/replay commands). Fields the server sends that no view reads:
- `misfirePolicy`, `disallowConcurrent`, `maxRetries`, `alertOnFailure`, `timeZoneId` on every job row — present in the
  CSV export only. `misfirePolicy` in particular would explain `B6`'s rows on the job detail.
- `handlerKeySnapshot`, `correlationId`, `scheduledFireTime` on each run-history row (read only on run detail).
- `isActive` on the job row (duplicates `status`).
