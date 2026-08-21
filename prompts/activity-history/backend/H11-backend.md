# H11 · Backend ask — one-shot alarms for timer boundaries

**Answered and shipped.** The original ask is preserved below the line for context; what came back
is recorded here, along with three things that are still open. The frontend is wired against the
delivered contract as of this file's date.

---

## What was asked, and what came back

The ask aimed at the framework's `reminder-definition` routes, on the strength of
`ReminderScheduleType.OneShot` describing exactly this case and `ReminderKeyRequest`'s doc comment
naming a register endpoint. **That was wrong twice over**, and both corrections changed the design
rather than filling it in:

| # | Asked | Answer |
|---|-------|--------|
| 1 | Does a client-callable register endpoint for reminder definitions exist? | **No.** `POST /reminder-definition/register` exists but is Admin/Root ad-hoc ops surface. The guessed alternative in §1 of the original ask was the right one: the client posts a *timer-domain fact* to an `activity-history` route and the backend schedules from it. Precedent: `Planning.ReminderRegistrationService`. |
| 2 | Is `subjectId` int64? | **Moot.** It is a `string` server-side, and the client no longer builds reminder keys at all. |
| 3 | Register/cancel batch endpoints | **Delivered, differently and better.** Keyed by a client-generated session uuid, replace-by-session rather than per-boundary keys. See the contract below. |
| 4 | `payload.{title,body,url,tag}` reaching the SW at the top level | **The envelope was genuinely broken** and has been fixed. `tag` and `url` now arrive top-level. Until then the tag-based dedup was silently doing nothing — worth recording, because that failure does not announce itself. |
| 5 | `TimerBoundary` exempt from quiet hours, still subject to per-kind muting | **Accepted as argued.** No "delivered seven hours late", and nothing for the frontend to explain. |
| 6 | Spurious alarm after a killed tab | **Accepted as proposed.** Nothing built. |

One answer went against the ask: **the notification text is composed server-side** from a structured
payload, not sent as pre-rendered strings. Free-form text has no transport path in the Notification
module, and a passthrough type would have put unscrubbable free text into a persisted payload. The
app's `history.timer.*` / `history.pomodoro.*` bundles are now used only for the **in-page**
notification a live tab shows itself. See the open items — this is where the remaining risk is.

Also worth recording, because it invalidates the original design's premise: **the reminders module
was never the right substrate.** It has no per-reminder trigger by design; everything fires from one
sweep whose default five-minute cadence its own docs call the firing-precision floor. Fine for
"probation ends in 30 days", useless for a pomodoro. These alarms sit on a real one-shot trigger on
the exact instant.

## The delivered contract

Both `POST`, prefix `api/`, cookie/JWT auth, default roles. camelCase JSON, string enums, ISO 8601
UTC timestamps. **Denied to web-extension clients** — main SPA only; an extension that wants to
start a timer is a backend change.

`POST api/activity-history/timer-alarm/schedule` → `200 { "registered": n }`

```jsonc
{
  "sessionId": "0f8b1c2e-...",            // uuid, client-generated and client-persisted
  "activityId": 42,                        // nullable
  "url": "/activity-history/pomodoro",     // nullable; relative, single leading "/"
  "boundaries": [
    { "boundaryAt": "2026-08-21T09:25:00.000Z",
      "phase": "Focus",                    // "Plain" | "Focus" | "ShortBreak" | "LongBreak"
      "phaseIndex": 1, "phaseTotal": 4, "cycleIndex": 1, "cycleTotal": 2 }
  ]
}
```

Idempotent on `sessionId` — a post replaces the session's whole set. Elapsed boundaries are dropped
rather than fired and do not fail the request; `registered` is what survived. `boundaryAt` is
scheduled verbatim, never re-derived from a duration. Caps: 64 boundaries, 24-hour horizon,
positive indices, relative `url`.

`POST api/activity-history/timer-alarm/cancel` → `204`, always, with `{ "sessionId": "..." }`.
Unknown or already-cancelled is a no-op, not a 404.

**Firing precision** is the trigger's, not a sweep's. If the server process is down over a boundary
the alarm fires when it next comes up, provided that is within **10 minutes**; past that it is
dropped rather than delivered late. Laptop-asleep rings on wake; yesterday's session does not
resurrect. *(Accepted without argument — the window only bites during a restart spanning a boundary,
and a half-hour-late "time for a break" is worse than silence.)*

## Where the frontend lives now

| Concern | File |
|---|---|
| The two routes | `src/core/activityHistory/api/timerAlarmApi.ts` |
| Request DTOs | `src/core/activityHistory/dto/request/ScheduleTimerAlarmsRequest.ts`, `dto/enum/TimerBoundaryPhase.ts` |
| Session id, tag derivation, contract caps | `src/core/activityHistory/store/timerAlarmSchedule.ts` |
| Which instants are boundaries | `src/core/activityHistory/store/timerBoundaries.ts` |
| The lifecycle seam (`syncAlarms`) | `src/core/activityHistory/store/runningTimerStore.ts` |
| Push handling | `public/sw-push.js` |

---

## Still open

### A. The last pomodoro boundary is the run finishing, and nothing in the contract says so

The pomodoro state machine ends **after the last focus period of the last cycle** — the final long
break never happens. So the last boundary the frontend posts is:

```jsonc
{ "phase": "Focus", "phaseIndex": 4, "phaseTotal": 4, "cycleIndex": 2, "cycleTotal": 2 }
```

**`phaseIndex === phaseTotal && cycleIndex === cycleTotal` is the only thing marking it as the end
of the whole run.** There is no completion flag in the request shape.

If the server words that boundary the way it words every other `Focus` one — "focus period ended,
time for a break" — then the user is told to take a break from a session that has just finished,
which is both wrong and the single most visible notification the feature sends. In a live tab this
boundary produces the *completion summary* ("🍅 Pomodoro complete · 2 cycles"), so a push saying
anything else also disagrees with what the same user sees on screen.

**Please confirm the server special-cases it.** If it would rather have an explicit marker — a
`isFinal: true`, or a fifth `phase` value like `"Complete"` — say which and the frontend will send
it; it is a one-line change in `pomodoroBoundaries`. Guessing at it from the indices is exactly the
kind of implicit contract that breaks quietly when either side is refactored.

### B. `cycleIndex` on a long-break boundary is the cycle being entered, not the one just finished

The frontend's projection mirrors the live state machine exactly, and that machine increments
`currentCycle` when it *enters* the long break. So the long break between cycles 1 and 2 is reported
as `phase: "LongBreak", cycleIndex: 2, cycleTotal: 2`, not `cycleIndex: 1`.

That is deliberate — the projection has to agree with the in-page notification, or the two texts
disagree for the same boundary — but it is not self-evident from the field name, and "cycle 2's long
break ended" versus "cycle 1 complete" are different sentences. **Confirm which reading the server
wording assumes.** If it wants the cycle just *completed*, the frontend will send `cycleIndex - 1`
for `LongBreak` boundaries only, and that is worth doing explicitly rather than leaving both sides to
assume.

*(Related and app-side, not a backend matter: the store's own `longBreakEndedBody` reads "Cycle
{current} complete. Time for cycle {next}!" off the already-incremented counter, so it says "cycle 2
complete, time for cycle 3" at the end of the first long break. That looks like a pre-existing
off-by-one in `advancePomodoro`. It is out of H11's scope — flagging it for H1's correctness sweep.)*

### C. The background push is hardcoded Slovak; the in-page notification is not

Accepted that free-form text has no transport path and that pre-rendered strings were the worse
default. But the consequence as it stands is that a user whose locale is EN gets an English
notification when the tab is open and a Slovak one when it is closed — for the same boundary,
sometimes minutes apart.

**The ask is not passthrough.** It is that the server render from its own resources **in the user's
stored locale** rather than in Slovak unconditionally. The locale is already a user preference
(`/user/preferences` owns theme, locale and timezone per this app's preference table), so the value
is there to read; this is a resource-lookup change, not a transport change, and it keeps every
property that made structured payloads the right call.

If the notification module has no per-user locale resolution at all, that is a bigger and more
general gap than H11 — every one of the eighteen notification types has it — and worth knowing
about as such rather than as a timer problem.

---

<details>
<summary>The original ask, for context</summary>

The questions above were asked against the reminders module, before it was known that its register
route is Admin/Root-only and that its five-minute sweep is its firing-precision floor. The reasoning
that survives the rewrite is in the table at the top of this file; the parts that did not — the
int64 `subjectId`, the per-boundary reminder keys, the batch cancel — were answered by the contract
being a different shape rather than by being accepted or rejected.

The two arguments that were made in the original and **won** are worth keeping in full, because they
are the ones that would be re-litigated by anyone touching this next:

**On quiet hours.** Quiet hours exist to stop unsolicited notifications arriving at a bad time. A
timer alarm is not unsolicited: the user started it themselves, minutes ago, and asked for exactly
this notification at exactly this instant. Someone who starts a 25-minute focus session at 23:50
with quiet hours from 23:00 has not asked to be left alone — they have asked to be told at 00:15,
and deferring or dropping it breaks the only guarantee the feature has. It is also invisible when it
fails: the alarm just does not come, and the user concludes the feature is broken.

**On the spurious alarm.** If the tab is killed after Stop but before the cancel lands, the alarm
fires for a session that is over. Every ordinary path already cancels, so the residual window is "the
process died in the seconds between a lifecycle action and its request completing". The alternative —
carrying session identity in the payload and having the service worker check it before showing —
needs session state readable from the service worker, i.e. mirrored into IndexedDB and kept in step
with `localStorage`: a second source of truth for the session, added to suppress a rare notification.
The failure is mild and self-explaining. Not worth it.

</details>
