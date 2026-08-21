# B3 · Backend ask — `CustomRange` ignores `endDate` on all four `summary/` endpoints

**Contract only.** This describes the behaviour the frontend observes and what it needs instead. Where the fix
goes — `DateRangeDto`, each endpoint, or the query behind them — is the backend's call.

This is **not** an H10 problem. It was surfaced while H10's `summary/time-of-day` endpoint was being built, but
it predates it and affects three endpoints that have been shipped and rendering for months.

## The problem

`DateRangeDto.ToDateRange()` falls through the `CustomRange` case to `(date, date)` and never reads `endDate`;
a `to <= from` guard then widens that to two days.

So for `rangeType: "CustomRange"`, **all four** of

- `POST /activity-history/dashboard/summary/stacked-bars`
- `POST /activity-history/dashboard/summary/pie-chart`
- `POST /activity-history/dashboard/summary/summary-cards`
- `POST /activity-history/dashboard/summary/time-of-day`

answer for a two-day range starting at `date`, whatever `endDate` the client sent.

The client cannot see this. It sends a valid range, gets a well-formed response, and renders it under a header
naming the range the user picked. A user who selects 1 March – 31 March sees March 1–2's numbers labelled as
March. Nothing errors, nothing looks empty, and the smaller the real activity the more plausible the wrong
answer looks.

`CustomRange` is reachable from the range selector on both history dashboards
(`HistoryDateRangeSelector.vue`), and the frontend serialises `endDate` into the URL, so bookmarked and shared
custom ranges are wrong the same way.

## The ask

Make `endDate` the range end for `rangeType: "CustomRange"` on all four endpoints. No change to any request or
response shape — the field is already sent and already documented as the range end.

Two questions the frontend cannot answer for you, and would like stated in the reply rather than inferred:

1. **Is `endDate` inclusive or exclusive?** The frontend sends the last day the user picked, i.e. it assumes
   inclusive. If the backend intends exclusive, say so and the client will send `endDate + 1`.
2. **What should happen when `endDate` is absent or precedes `date` on a `CustomRange` request?** A 400 is
   fine and is what the frontend would prefer to the current silent two-day fallback; it just needs to know
   which, so it can guard before sending rather than surface a raw error.

Please also confirm what the other `rangeType` values do with `endDate` — the frontend sends it only for
`CustomRange` today, and would like that to stay correct rather than accidental.

## What the frontend does today

Nothing special, deliberately. The three shipped panels render whatever comes back, as they always have.

H10's time-of-day insight needs no special case either, and this is worth recording because it is easy to
mistake for luck: the insight ignores `daysInRange` entirely (it is the only field a per-day figure would come
from, and it reads `2` here), and its `daysWithActivity ≥ 4` threshold cannot be met inside a two-day range —
so the insight stays off on `CustomRange` by itself, and begins working the day this is fixed, with no
frontend change. There is a test pinning the `daysInRange` independence
(`useHistoryInsights.test.ts`, "ignores daysInRange, which B3 leaves wrong on a custom range").

Once this lands, the two per-group insights and the period mean become correct on `CustomRange` for the first
time as well — they are derived from `summary/pie-chart`, so they inherit the bug and the fix alike.
