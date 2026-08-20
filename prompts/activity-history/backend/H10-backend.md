# H10 · Backend ask — time-of-day histogram for the history summary

**Contract only.** This states the endpoint and the fields the frontend reads. Entities, EF configuration,
migrations, indexes and how the aggregate is computed are the backend agent's decisions, not requests made
here.

> **Shipped.** The endpoint exists and the frontend consumes it — `HistoryTimeOfDayResponse`,
> `getSummaryTimeOfDay`, and the `timeOfDay` insight in
> `src/core/historyDashboard/composable/useHistoryInsights.ts`. All three semantics under "Response" are
> implemented and covered by backend integration tests that assert on values. Three notes on what came back:
>
> 1. **The worked example in §2 below was arithmetically wrong and has been corrected in place.** The rule was
>    right, the arithmetic was not: 90 minutes from 09:45 ends at 11:15 and therefore covers *three* hours.
>    Anyone writing a fixture from the original figures would have been off by 900 s in one bucket, which
>    looks like a rounding bug rather than a spec slip. The frontend's fixtures state per-hour totals directly
>    and encode no split at all, so they cannot disagree with the server about this.
> 2. **Tails past the range end are not clipped.** Records are selected by `startTimestamp` inside the range
>    and each record's whole length is distributed, so one starting 23:40 on the last day puts 20 minutes into
>    hour 0. That is what makes the pie-chart total equality asked for in §3 hold, and it is deliberate — not
>    an off-by-one.
> 3. **`endDate` is ignored, and not by this endpoint.** See [`B3-custom-range.md`](B3-custom-range.md):
>    `DateRangeDto.ToDateRange()` never reads it, so all four `summary/` endpoints answer a two-day range for
>    `CustomRange`. Pre-existing and shared, raised separately. The insight needs no special case for it —
>    `daysInRange` is unused, and `daysWithActivity ≥ 4` cannot be met inside two days, so the insight stays
>    off there by itself and starts working when B3 lands.

Nothing shipped is blocked on this. H10 shipped the insights it could compute honestly from the pie-chart
response the summary view already holds; this is the one it could not, and it was left out rather than
approximated. See `src/core/historyDashboard/composable/useHistoryInsights.ts`.

## Why the existing endpoints cannot answer it

The insight is time-of-day structure over a multi-day range: *when* in the day this user's long unbroken
blocks actually happen. Three existing responses were considered and each fails for a different reason.

1. **`POST /activity-history/dashboard/summary/stacked-bars`** returns windows that tile the range
   **sequentially** — one row of windows per calendar day, in calendar order — so folding them by hour of
   day is possible client-side, but the result is not a fact about the user:
    - the bucket width is `windowMinutes`, which the user picks from a dropdown (240 minutes by default on
      a week, up to 720 hours on a year). At 4-hour buckets the finest statement available is "between
      08:00 and 12:00", and it becomes "between 08:00 and 20:00" when the user picks 12-hour buckets.
    - `windowStartTime`/`windowEndTime` clip **every** day to a time-of-day window the user also picks
      (08:00–01:00 by default). Time logged outside it is absent from the response entirely, so any
      "when do you focus" answer is silently conditioned on the picker.

   An insight that changes when a chart control moves is a readout of the control, not of the history.

2. **`POST /activity-history/dashboard/summary/pie-chart`** and **`/summary-cards`** carry no time
   dimension at all — only per-group totals, entry counts and a baseline comparison.

3. **`POST /activity-history/filter`** returns the raw records, which would answer it exactly, but takes a
   `DateAndTimeRangeRequest` — a **single** `date` plus a time window. There is no multi-day form, and
   fanning it out to one request per day over a range is not a reasonable client.

## The ask

One endpoint. It folds the range into 24 hour-of-day buckets, which is the aggregation none of the above
exposes.

**`POST /activity-history/dashboard/summary/time-of-day`**

### Request

The same range shape the other three `summary/` endpoints already take
(`ActivityDateRangeRequest`, `src/core/activityHistory/dto/request/ActivityDateRangeRequest.ts`), with no
additional fields:

| Field       | Type                                                                            | Nullable | Notes                                                     |
| ----------- | ------------------------------------------------------------------------------- | -------- | --------------------------------------------------------- |
| `date`      | string, `YYYY-MM-DD`                                                            | no       | Range start, same semantics as the other three endpoints. |
| `rangeType` | string enum: `ThreeDays` `Week` `TwoWeeks` `Month` `ThreeMonths` `Year` `CustomRange` | no   | Same values the other three accept.                       |
| `endDate`   | string, `YYYY-MM-DD`                                                            | yes      | Sent only for `CustomRange`, as today.                    |

Deliberately **no** `groupBy`, no `topN`, no `windowMinutes` and no time-of-day window. The frontend wants
the unconditioned shape of the range; every one of those parameters is what makes the stacked-bars response
unusable for this.

### Response

```json
{
	"hours": [{ "hour": 0, "totalSeconds": 0, "entries": 0 }],
	"daysInRange": 7,
	"daysWithActivity": 5
}
```

| Field                   | Type    | Nullable | Notes                                                                                                                             |
| ----------------------- | ------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `hours`                 | array   | no       | **Always 24 elements, ordered `hour` 0…23**, including hours with no activity. The frontend indexes it and does not sort or pad it. |
| `hours[].hour`          | integer | no       | 0–23. Hour of day **in the user's configured timezone** (`User.timezone`), not UTC — see below.                                    |
| `hours[].totalSeconds`  | integer | no       | Seconds logged in that hour of day, summed over every day in the range. `0` for an empty hour, never null.                         |
| `hours[].entries`       | integer | no       | Number of records contributing to that hour — see the boundary rule below. `0` for an empty hour.                                  |
| `daysInRange`           | integer | no       | Calendar days the range covers, so the client can turn a total into a per-day figure without re-deriving the range's length.       |
| `daysWithActivity`      | integer | no       | Days in the range with at least one record. The frontend uses this as the insight's data threshold.                                |

Three semantics the frontend cannot infer and will read the response as having. If any of them is
impractical, say so and the frontend will adapt — what it cannot do is guess:

1. **Timezone.** The fold must happen in the user's configured timezone. A record at 23:30 local is hour 23,
   whatever the offset. Folding in UTC would shift every user's answer by their offset, which is the one
   error that looks completely plausible on screen.
2. **Records crossing an hour boundary** contribute their overlap to **each** hour they cover, split by
   elapsed time — a 90-minute record starting at 09:45 runs to 11:15 and so covers three hours: 900 s in
   hour 9, 3600 s in hour 10, 900 s in hour 11. (The original ask said "900 s in hour 9 and 4500 s in hour
   10", which is an hour short; the rule was always the one stated here.) The alternative, attributing the
   whole record to its start hour, answers a different question ("when do you start things").
3. **`entries` counts a record once per hour it touches**, so that record above counts in both hour 9 and
   hour 10. Consequently `sum(hours[].entries)` is **not** the period's record count and the frontend will
   not treat it as one, while `sum(hours[].totalSeconds)` **is** the period total and should match what
   `summary/pie-chart` reports as `totals.totalSeconds` for the same range.

No change to any existing endpoint, request or response.

## What the frontend does with it

One sentence on the insights surface in `HistoryInsights.vue`, stating where in the day this user's time
concentrates — over the whole range, at hour resolution, independent of every chart control. It is held to
the same rules as the insights already there:

- **`daysWithActivity ≥ 4`**, below which it does not render at all.
- **The narrowest run of consecutive hours holding at least half the period, and at most six of them.** A
  flat day needs twelve hours to reach half, so six is a 2× margin over flat. The run is *found*, and the
  copy names its actual bounds ("between 09:00 and 11:00") — the hours are never pre-folded into
  morning/afternoon/evening, because a coarse bucket cannot state a fact finer than itself, which is the
  whole objection that got this endpoint built instead of a client-side fold.
- **The scan wraps midnight**, so a band running 22:00–02:00 is reported as one stretch rather than two.

`hours[].entries` is read into the DTO and deliberately used by nothing: it counts a record once per hour it
touches, so it is not a record count and there is no client-side question it answers correctly.
