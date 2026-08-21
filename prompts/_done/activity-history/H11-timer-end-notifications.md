# H11 · Ring the timer's alarm when the tab is not there

- **Scope:** activityHistory timers (+ the framework's `reminders` / `notifications` modules)
- **Backend:** yes — emits `backend/H11-backend.md`
- **Model / effort:** Sonnet 5, medium–high. Bump to **Opus 5** if step 0 finds the `reminders` module cannot express this and a bespoke contract has to be designed.
- **Depends on:** H9 (this builds directly on the store it created)
- **Unblocks:** nothing

---

```
H9 made a running timer survive navigation and reload. It did not make its alarm survive a closed
tab, and that is the failure left standing: the alarm is fired from the client, so closing the
laptop lid on a 25-minute pomodoro focus phase means nothing rings and you come back to a finished
session nobody told you about. That happens on ONE device, on every session where the tab is not in
front at the end — far more often than any cross-device scenario.

Fix it by having the server fire a scheduled notification at each boundary. Do not move the timer
to the server.

--- What exists now (read these first) ---

src/core/activityHistory/store/runningTimerStore.ts is the whole timer. One session at a time, held
in absolute epoch timestamps, persisted to localStorage through useUserScopedStorage, created at
boot from App.vue. Its header comment explains the two rules it enforces; honour both.

The alarm lives in two places in that file, and both need a live tab:
  - `announceEnd(session)` — the countdown running out, and the pomodoro's final completion.
  - `advancePomodoro(session, at)` — every intermediate phase boundary.

The seams you will be hooking into: `startCountdown`, `startPomodoro`, `pauseSession`,
`resumeSession`, `endSession`, `clearSession`, and `reconcile()` (which decides what a restored
session means).

Three kinds, and they are not the same problem:
  - `stopwatch` — has no end. Nothing to schedule. Do not invent one.
  - `timer` — exactly one boundary, at `endsAt`.
  - `pomodoro` — many boundaries. Note the property that falls out of H9's design: the focus/short/
    long durations, the focus-periods-per-cycle and the cycle count are ALL fixed at start, so every
    boundary of the whole cycle is computable the moment Start is pressed. You can schedule the set
    up front rather than rescheduling at each transition. Decide which, and say why in a comment.

There is a test file next to the store, runningTimerStore.test.ts, with a controlled clock. Keep it
green and extend it. One trap that already cost time: `vi.clearAllTimers()` rewinds the fake clock
as well as dropping timers, so read `Date.now()` BEFORE calling it (there is a comment saying so).

--- Step 0: the recon that decides the size of this job ---

The framework already has most of this and it was NOT fully checked. Start here.

src/_common/modules/reminders/ has:
  - `dto/enum/ReminderScheduleType.ts` → `OneShot = 'OneShot'`, documented as "fires relative to a
    single due date/time, with one or more lead-time offsets". That is exactly this.
  - `dto/request/ReminderKeyRequest.ts` → the stable 4-part key
    `(ownerModule, subjectType, subjectId, kind)`. Its own doc comment says it is sent to the
    "pause / resume / cancel (and register) endpoints".
  - `api/ReminderDefinitionApi.ts` → has `pauseReminder`, `resumeReminder`, `cancelReminder` and the
    queries. It has NO create/register function.

So a register endpoint is implied by the DTO comment but has no client binding. If it exists and a
client may call it, most of this task is wiring. If reminder definitions are only ever created
server-side from domain events, the client cannot schedule one, the contract ask gets bigger, and
that is the case that justifies bumping the model.

**You cannot settle this from this repo** — the .NET solution is not here, and a missing client
function is evidence, not proof. Do the cheap frontend checks (grep `reminder-definition` for other
callers; check whether any app module registers reminders today and how), then put the question in
the backend file described at the bottom and proceed on your stated assumption. Do not stall on it,
and do not quietly invent the endpoint you wish existed.

Web Push is already set up and working: `_common/modules/notifications/composable/
UsePushNotifications.ts`, `sw.js` + `sw-push.js`, VitePWA in vite.config.ts. You should not need to
touch any of it.

--- What to build ---

1. On start, schedule the boundary (or boundaries) as one-shot server-side notifications carrying
   the same text the client alarm uses today — reuse the existing `history.timer.*` and
   `history.pomodoro.*` locale keys rather than writing new copy, and note that the SERVER will be
   rendering it, so whatever it needs must go over the wire.
2. Cancel or reschedule on pause, resume, stop, discard-and-replace, and clear. A paused timer has
   no end instant, so its schedule must go away and come back on resume.
3. `reconcile()` already decides what a restored session means. Make sure a session it ends on
   rehydrate does not leave a live schedule behind.

--- The four decisions this task actually turns on ---

Do not skip these; they are why it is not a ten-minute job.

- **The subject key needs a `subjectId: number`, and a timer session has no server-side id.** Either
  the server issues one when the schedule is registered, or the key is built from something else.
  This is the main thing the backend contract has to settle.
- **Double alarm.** If the tab IS open at `endsAt`, the store rings AND the push arrives. Decide
  where it is suppressed — client declines to ring when it knows a push is scheduled, or the service
  worker declines to show when a visible client exists. Pick one and write down why.
- **Spurious alarm.** Tab killed after Stop, cancel never sent, push fires for a session that is
  over. Decide the mitigation: carry the session's identity in the payload and check before showing,
  or accept it. Accepting is defensible — say so if you accept it.
- **Quiet hours.** Reminder preferences already model quiet hours, per-kind muting and channel
  choice at `PUT /reminder-preference/*`, keyed `(ownerModule, kind)`. Per CLAUDE.md's preference
  table this is where timer-alarm delivery settings belong — do NOT add a module preference for it.
  But decide deliberately whether an alarm the user explicitly started should be silenced by quiet
  hours the way a nagging reminder is. The answer is not obviously yes.

Also: the client computes `endsAt` from `Date.now()`. Send an absolute UTC instant and let the
server schedule on that — do not send a duration for the server to re-derive against its own clock.

--- Explicitly out of scope ---

Do NOT sync the running session to the server. Do NOT put timer state on the server, add SignalR or
any live channel for timers, poll on an interval, or move the countdown off the client. This was
decided, not overlooked:
  - the on-screen countdown has to be client-side whatever happens, so the store stays either way;
  - two devices means two clocks, and H9's reconstruction is exact precisely because it compares one
    device's clock against itself — making a second device authoritative for `endsAt` invents a
    clock-skew bug class that does not exist today;
  - the user-visible failure being fixed here is single-device.
An interval heartbeat is the wrong shape for the same reason: `endsAt` is known at start, so one
call beats a request every N seconds, and a heartbeat stops exactly when it is needed.

If you find you cannot fix the alarm without session state on the server, stop and say so rather
than quietly building sync.

--- Verify ---

- The existing runningTimerStore.test.ts stays green; extend it for schedule/cancel on every
  lifecycle path (start, pause, resume, stop, clear, reconcile-ends-it).
- Manual, and this one needs a real device: start a 2-minute timer, close the tab, confirm the
  notification arrives at the right minute.
- Confirm no double alarm with the tab open, and that Stop cancels the schedule.
- `npm run type-check` (baseline was 53 errors, all pre-existing and none in activityHistory —
  re-measure on a clean tree, this number goes stale) and `npm run lint` (must stay at 0 errors).

--- Backend ---

The .NET solution is not in this repo, so anything you need from it — a change OR an answer — leaves
through prompts/activity-history/backend/H11-backend.md. Write that file. Write it even if you end
up needing no new endpoint at all and only have questions left, and write it even if the questions
block you: a blocked frontend with a clear written ask is the deliverable in that case, not a guess.

It can carry both kinds of item, and the two files already in that directory are the templates:
  - B1-group-ids.md is the "change this" shape — endpoint, method, route, request shape, response
    fields with types and nullability, in the JSON casing the frontend `fromJson` reads. Contract
    only: no entities, no EF or migrations, no storage decisions, no opinion on how the scheduler
    actually fires.
  - B2-nullability-audit.md is the "answer this" shape — mostly a request for a written answer
    rather than code. Step 0 of this prompt is that shape and you cannot settle it from here:
    whether a register/create endpoint for reminder definitions exists, what it accepts, and whether
    a client is allowed to call it at all, or whether reminder definitions are only ever created
    server-side from domain events. Ask it plainly rather than inferring it from the frontend's
    missing API function — the absence of a client binding is evidence, not an answer.

Anything else you hit that only the backend can settle goes in the same file rather than becoming a
silent assumption in the code. The likely candidates, from the four decisions above: what
`subjectId` a timer session is supposed to key on when it has no server-side id, whether quiet hours
are applied to this reminder kind, and what the push payload can carry for the duplicate/spurious
suppression you land on.
```
