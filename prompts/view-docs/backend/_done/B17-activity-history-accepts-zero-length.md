# B17 · Backend ask — `POST /activity-history` accepts a zero-length recording

**Contract only.** A one-comparison validator change plus a test; the rule is what matters, not where it sits.

> Found reading `history-capture/B4`'s request. Written 2026-09-15 from `docs/views/_fix-queue.md`
> escalation §15. Re-read against `ActivityHistoryValidator.cs` 2026-09-15. **Small, not blocking** — the
> client half (`F67`) lands regardless and does not wait on this.

---

## The problem

`ActivityHistoryValidator.cs` is:

```csharp
RuleFor(x => x.Length)
    .Cascade(CascadeMode.Stop)
    .NotNull()
    .Must(x => x.TotalSeconds >= 0)
    .WithMessage("Length must be non-negative.");
```

Unit 4's round 2 posted `{"length":{"hours":0,"minutes":0}}` from the Pomodoro view and received a **201**
(`id 15503`). A history record of nothing is not information on any read path: the dashboards sum it, the
timeline draws a zero-width block, the calibration average divides by it.

Two of the four client capture flows can produce that body today (Pomodoro under 60 s, Stopwatch under 30 s —
`F67`), and the client is fixing them. But a validator that stops at `>= 0` lets the **next** client write it
again — the desktop tracker's attribution sink, a future import, a script.

## The business rules

1. **A recording has positive length.** `TotalSeconds > 0`. Please confirm; the client's manual form has
   refused `!timeLength.isNotZero()` since it was written (`AddActivityManuallyForm.vue:70`), so on the client
   side this rule already exists once and is being extended to the other three views.
2. **Open question — the minimum unit.** The client's `Time` DTO is whole minutes (`{hours, minutes}`), so the
   shortest recording the client can express is 1 minute. If the server's `Length` can carry seconds, say
   whether sub-minute rows are wanted (then `> 0` seconds) or whether a minute floor applies (then
   `>= 60`). `F67` recommends **discarding** sub-minute sessions client-side with a message, so either is
   compatible; `> 0` is the smaller change.

## The shape the frontend needs

No shape change. A rejected `length` answers the existing 400 shape with `errors.length[]` and a message the
interceptor can show (*"Length must be positive."* or similar). One integration test posting `{0,0}` → 400.

## What changes on the frontend once this lands

Nothing — `F67` makes the zero unreachable from the three capture views before the save dialog opens, and the
manual form already guards. This ask is the backstop for clients that are not this one. Reseed after `F67`'s
verification if option (b) there was taken, since it writes rows.

---

## Landed 2026-09-15 — rule 1 taken as written, rule 2 dissolved rather than decided

One comparison in `ActivityHistoryValidator.cs`, two integration tests, **no shape change**. The validator is now
`Length.TotalSeconds > 0` with *"Length must be positive."*, and **`POST` and `PUT api/activity-history` share it**,
so an edit cannot shrink an existing recording to nothing either — a hole the ask did not think to close.

**Rule 2 needed no answer: the server's `IntTime` is `{hours, minutes}` too.** Whole minutes on the wire *and* in the
column; its seconds constructor truncates. So the server cannot carry a sub-minute row any more than
`src/_common/dto/dto/Time.ts` can express one, and `> 0` **is** the one-minute floor — options (a) and (b) in the ask
were the same rule written twice. Verified client-side while recording this: `Time` has `hours`/`minutes` and nothing
finer, and `Time.fromSeconds` floors.

**The 400 body is the existing one**, keyed on `length`, so the interceptor's per-field rendering needs nothing:

```json
{ "statusCode": 400, "message": "One or more errors occurred!", "errors": { "length": ["Length must be positive."] } }
```

Pinned by `ActivityHistoryWriteRuleTests`: `Create_WithZeroLength_IsRejected` (`{0,0}` → 400 on `length`, zero rows
written) and `Create_WithOneMinuteLength_Succeeds` (`{0,1}` → 201, `EndTimestamp == Start + 1 min`) — the second
exists to stop the floor drifting *above* one minute later.

**The old suite pinned the opposite, deliberately, and the rationale was inverted.** A test asserted `>= 0` with the
comment *"a zero-length recording is legitimate — time-of-day credits its start hour"*. That is a **consumer's**
reason (the chart counts entries), not a producer's: nothing in the solution writes a zero row and the attribution
sink already filters `TotalSeconds > 0`. The test was deleted rather than kept.

### What this changes for `F67` — the decision, not just the backstop

`F67`'s open question (**(a)** discard with a message vs. **(b)** `Math.ceil` the seconds to a one-minute floor) is
**settled as (a)**, and the reply is explicit that the 400 must not become the UX: a 30-second stopwatch session would
round to `{0,0}` and now **bounce with a 400** where it used to write a row. So the three capture views still need the
same client-side guard before `openDialog(SaveActivityBody)` — the server is the backstop, not the message. `F67`
lands independently of this and never waited on it.

One consequence for the e2e data: `id 15503` and any other `{0,0}` rows **predate this** and are the seed's. Reseed
after `F67`'s verification as already planned; unreachable now from any client.
