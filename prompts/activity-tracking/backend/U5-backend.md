# U5 — Fragmentation metrics on the activity-tracking dashboards

**Contract only.** This states the endpoint the frontend would call and the response fields it would
consume. It says nothing about entities, EF, migrations, indexes or how any value is computed or
stored — this repo cannot see the .NET solution, and a frontend guess about someone else's schema is
worse than no input.

Read `backend/U3-backend.md` first. This document reuses its request base verbatim and depends on one
decision it left open (§5 there, §4 here).

---

## 0. What already shipped without you

**Most of U5 needed no contract change and is merged.** The timeline response already carries
per-session `startedAt` / `endedAt` / `durationSeconds`, so the client derives all four measures
itself, for all three sources, from data you already serve:

| Measure                  | Derived from                                                          |
| ------------------------ | --------------------------------------------------------------------- |
| Switch count             | label changes between consecutive primary-lane sessions                |
| Longest unbroken block   | per-label merge of sessions separated by ≤ 120 s                       |
| Median session length    | median of `durationSeconds` over primary-lane sessions                 |
| Longest break            | largest interval between two consecutive sessions, interior gaps only |

That is `src/core/activityTracking/composable/focusMetrics.ts` and it costs zero extra requests.
**Nothing below is needed for the single-day dashboard to work**, and nothing below should be built
before someone actually wants the two things in §1.

## 1. The two things the client genuinely cannot do

**A. Compare against the user's own recent self.** The client holds exactly one window at a time.
"Your typical session was 2 minutes; over the last 7 days it was 6" is the comparison that makes these
numbers useful rather than decorative, and there is no way to get it from one response.

**B. Report them over a multi-day range at all.** U3 shipped date ranges, and
`backend/U3-backend.md` §4 asks you explicitly **not** to support the timeline endpoint over a range —
a month of sessions is the largest response this module can ask for and nothing renders it. That
decision stands, and its consequence is that the client has no sessions over a range and the strip
hides itself there. Over a range these numbers have to be computed server-side or not exist.

Either half is worth building alone. If only one is cheap, build A — the range case is a smaller
audience than the comparison is.

## 2. Endpoint

```
POST /activity-tracking/{web-extension|desktop|android}/focus-metrics
```

One per source, matching the existing four dashboards. If U4 collapses the three sources into one
parameterised route, this follows it — do not settle the shape here and again there.

## 3. Request

The **same base as every other dashboard endpoint** — `dateFrom`, `dateTo`, `from`, `to`, with the
per-day time-of-day window semantics spelled out in `U3-backend.md` §2 (including the past-midnight
rule and `to == from` meaning 24 hours). Nothing new about the span.

Two additional fields:

| Field             | Type     | Null? | Meaning                                                              |
| ----------------- | -------- | ----- | -------------------------------------------------------------------- |
| `baseline`        | `string` | yes   | one of `last7Days`, `last30Days`, `sameWeekday`, `allTime`; `null` → no comparison |
| `focusGapSeconds` | `int`    | no    | interruption tolerance for the longest-block measure; client sends `120` |

### Why `focusGapSeconds` is a request field and not your constant

The tolerance is a display decision — a twenty-second glance at another window is not the end of an
hour on one thing, a five-minute one is, and where that line sits is a judgment about what to show a
user, not a fact about the data. It lives in the client as a named constant
(`FOCUS_BLOCK_TOLERANCE_SECONDS`) and is surfaced in the UI so it is never magic.

It has to travel with the request because **the same screen may show a client-computed number and a
server-computed one**: single-day metrics come from the timeline sessions, range metrics from here.
If the two use different tolerances, the same day reads differently depending on how the user got to
it. Take the value we send; do not hardcode 120 on your side.

## 4. Definitions — the part that is contract, not implementation

These are contract because the field names mean nothing without them, and because a plausible
alternative reading exists for every one. How you compute them is entirely yours.

- **Primary lane only.** The same sessions the `timeline` endpoint returns as `primarySessions`
  (android: `sessions`). Not `detailSessions` — that is a finer cut of the same attention (pages
  inside a domain, window titles inside a process) and counting it reports in-site navigation as task
  switching. Not `backgroundSessions` — by definition what the user was not looking at.
- **`switchCount`** — the number of points where the foreground item differs from the one before it,
  in time order. Consecutive sessions on the *same* item do not count: a tracker that splits one
  continuous run into three records must not read as two switches. Deliberately **not**
  gap-tolerant, unlike the block measure — the two answer different questions and a short detour is
  honestly both a switch and something that failed to break a block.
- **`longestBlock`** — the longest run on a single item, where two sessions on that item join into one
  run if they are separated by at most `focusGapSeconds` of *anything* — another item or untracked
  time alike. Its `seconds` is wall-clock from the run's first start to its last end, tolerated
  interruptions included.
- **`medianSessionSeconds`** — median, not mean, of primary-lane session lengths. The distribution is
  heavily right-skewed and a mean is dominated by a handful of long sessions. Even count → mean of
  the two middle values.
- **`longestGapSeconds`** — the longest interval **between two sessions**. Interior only: not the run
  up to the first session and not the run after the last one. Those are the edges of the window
  rather than breaks in anything, and including the trailing one would report the remainder of an
  unfinished day as that day's longest gap.
- **Range spans.** Every measure is computed over the union of the per-day windows, **not** across
  the night between them. A block must not span two days' windows and the gap between one day's `to`
  and the next day's `from` is not a `longestGapSeconds` candidate — the user excluded those hours.
  This is the same trap as `U3-backend.md` §2 and it is the one thing here most likely to go wrong.

## 5. Response

```
{
  "sessionCount": 214,
  "daysWithActivity": 5,
  "switchCount": 87,
  "medianSessionSeconds": 94,
  "longestGapSeconds": 3300,
  "longestBlock": {
    "label": "Visual Studio Code",
    "startedAt": "2026-08-19T09:12:00",
    "endedAt": "2026-08-19T10:29:00",
    "seconds": 4620
  },
  "baseline": {
    "switchCount": 61.4,
    "medianSessionSeconds": 168,
    "longestBlockSeconds": 5100,
    "longestGapSeconds": 4080
  }
}
```

| Field                       | Type                | Null?                                                 |
| --------------------------- | ------------------- | ----------------------------------------------------- |
| `sessionCount`              | `int`               | no; `0` for an empty span                             |
| `daysWithActivity`          | `int`               | no; days in the span with at least one session        |
| `switchCount`               | `int`               | no; `0` for a single unbroken run                     |
| `medianSessionSeconds`      | `number`            | no; may be fractional (even-count median)             |
| `longestGapSeconds`         | `number`            | **yes** — `null` when there is no interior gap        |
| `longestBlock`              | object              | **yes** — `null` when `sessionCount == 0`             |
| `longestBlock.label`        | `string`            | no; the display name — `domain` / `productName` / `appLabel`, matching what `summary-cards` returns for the same item |
| `longestBlock.startedAt`    | ISO-8601 datetime   | no                                                    |
| `longestBlock.endedAt`      | ISO-8601 datetime   | no                                                    |
| `longestBlock.seconds`      | `number`            | no                                                    |
| `baseline`                  | object              | **yes** — `null` when the request sent no `baseline`, or when there is not enough history |
| `baseline.*`                | `number`            | each individually **nullable**                        |

`daysWithActivity` exists so the client can render a range figure per day — "87 switches" over a week
is not a number anyone can read. Days the user was away should not dilute it, which is why it counts
days with activity rather than days in the span.

### `baseline` carries averages, not `percentChange`

The existing `summary-cards` contract returns `averageSeconds` **and** `percentChange`, and the
temptation is to match it here. Please don't. These numbers are shown next to the user's own recent
figure — "87 · typically 61" — deliberately without a percentage, an arrow or a colour, because a
fragmentation number rendered as a red +42% is a verdict on someone's day and this app is for people
who procrastinate. Send the comparable value and the client will present it; a `percentChange` field
would simply go unread.

Each `baseline.*` is the **per-span-equivalent** value over the lookback, so it compares like with
like: for a 5-day span with `last30Days`, `baseline.switchCount` is the mean switches per day over
those 30 days × 5. `baseline.longestBlockSeconds` is the mean of each day's own longest block, not
the longest block in the whole lookback — the latter is a record to beat, which is exactly the
scoreboard framing being avoided.

**This depends on `U3-backend.md` §5.** That document leaves open how `baseline` behaves over a
multi-day span for `summary-cards`, with two candidate readings. Whichever you pick there, pick the
same one here — two endpoints disagreeing about what "compared to last 7 days" means on the same
screen is worse than either answer. And as there: **returning `baseline: null` is a valid answer.**
The client already renders the metrics with no comparison and nothing breaks.

## 6. One question, not an ask

`TimelineSessionDto` carries both `durationSeconds` and `totalSeconds`, and the timeline tooltip
labels them "Duration" and "Active time". The client's median uses `durationSeconds`, on the reading
that it is the session's wall-clock length and `totalSeconds` is active time within it. **If that is
backwards, say so** — it changes what "typical session" means and it is a one-line fix on our side.
Nothing needs to be built either way.
