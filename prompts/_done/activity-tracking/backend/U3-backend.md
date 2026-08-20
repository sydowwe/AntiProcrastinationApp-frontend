# U3 — Date range on the activity-tracking dashboards

**Contract only.** This states the endpoints the frontend calls and the response fields it consumes.
It says nothing about entities, EF, migrations, indexes or how aggregation is computed or stored —
this repo cannot see the .NET solution, and a frontend guess about someone else's schema is worse
than no input.

> **Status: implemented and answered.** The backend landed `DateRangeAndTimeRangeDto` and
> `DailyWindowSet`; `date` is gone server-side and unmapped members are ignored. The frontend has
> since removed `VITE_ENABLE_ACTIVITY_DATE_RANGE` and `activityTrackingConfig.ts` entirely — range
> mode is unconditional — dropped the transitional `date` field, and adopted the answers recorded
> against §5 and §6 below. The sections are kept as written; the resolutions are marked **Answered**.

`backend/U4-backend.md` now exists. §6 flags the one place the two overlap — the triplication — and
U4 §8 takes it up; U4 §7 lists every point of contact between the two documents and confirms none of
them contradicts what is written here.

---

## 1. The change, in one line

Every dashboard endpoint takes a single `date`. It needs to take an inclusive `dateFrom`/`dateTo`
pair instead, with `from`/`to` keeping their current meaning as a **time-of-day window applied to each
day in that span**.

## 2. The daily-window semantic — the easiest thing here to get wrong

`from` and `to` are **not** the endpoints of the range. They are a time-of-day window that repeats on
every day in `[dateFrom, dateTo]`, and the existing past-midnight rule is unchanged:

> when `to <= from`, the window ends on the **following** calendar day.

Worked, with the default 07:00–00:00 window and `dateFrom = 2026-08-01`, `dateTo = 2026-08-03`:

| Day        | Window included                       |
| ---------- | ------------------------------------- |
| 2026-08-01 | 2026-08-01 07:00 → 2026-08-02 00:00 |
| 2026-08-02 | 2026-08-02 07:00 → 2026-08-03 00:00 |
| 2026-08-03 | 2026-08-03 07:00 → 2026-08-04 00:00 |

That is **three 17-hour windows totalling 51 hours**, not one continuous 65-hour block. The hours
between 00:00 and 07:00 on the 2nd and 3rd are excluded. A user who has narrowed the window to
09:00–17:00 to see their working day expects "this week, working hours" — a continuous interpretation
would silently fold in every night.

Two consequences worth stating outright:

- `to == from` means the full 24 hours of each day (it is `<=`, not `<`). The client's "show the whole
  day" affordance sends `00:00`/`00:00` and means 24 hours per day, not zero.
- A single day is `dateFrom == dateTo`, which under this rule produces exactly the window the current
  single-`date` endpoints already produce. **Single-day behaviour must be byte-identical to today's.**

## 3. Request shape

Twelve endpoints, all `POST`, all with a JSON body. Three sources × four dashboards:

```
POST /activity-tracking/{web-extension|desktop|android}/{summary-cards|pie-chart|stacked-bars|timeline}
```

Every one of them binds this base:

| Field      | Type                        | Null? | Meaning                                                   |
| ---------- | --------------------------- | ----- | --------------------------------------------------------- |
| `dateFrom` | `string` `yyyy-MM-dd`       | no    | first day, inclusive                                       |
| `dateTo`   | `string` `yyyy-MM-dd`       | no    | last day, inclusive; `>= dateFrom`; equals it for one day |
| `from`     | `{ hours: int, minutes: int }` | no | time-of-day window start, applied per day                  |
| `to`       | `{ hours: int, minutes: int }` | no | time-of-day window end, applied per day (see §2)          |
| ~~`date`~~ | —                           | —     | **removed** — no longer sent or bound; see below            |

`from`/`to` are the existing `Time` shape, unchanged — two integers, not a string.

**On `date`: Answered — dropped.** One code path, `dateFrom`/`dateTo`; `date` no longer exists in
either direction and the row above is historical.

Per-endpoint additions, all unchanged from today:

| Endpoint         | Extra fields                                                |
| ---------------- | ----------------------------------------------------------- |
| `summary-cards`  | `baseline: string` (enum, §5), `topN: int?` (client sends 4) |
| `pie-chart`      | `minPercent: number?` (client sends 1)                       |
| `stacked-bars`   | `windowMinutes: int`, `minSeconds: int?`                     |
| `timeline`       | `minSeconds: int?`                                           |

### `windowMinutes` — the one value whose range widened

Single day, unchanged: one of `15, 20, 30, 60, 90, 120`.

Over a multi-day span the client picks adaptively, from a column budget, and now sends values from a
larger set: `30, 60, 120, 240, 480` (sub-daily) and `1440, 4320, 10080` (whole-day multiples: 1 day,
3 days, 1 week). Nothing between `480` and `1440` is ever sent — see the tiling rule below.

**Tiling rule, which is what makes the response well-defined:**

- `windowMinutes < 1440`: windows tile **each day's time-of-day window**, starting at `from` on that
  day. A day's final window is truncated at `to` rather than spilling into the next day, so a 1020-minute
  window (07:00–00:00) at `windowMinutes = 480` yields windows of 480, 480 and 60 minutes on each day —
  never a 480-minute window straddling two days' windows.
- `windowMinutes >= 1440`: windows tile **the span itself** in whole days, starting at `dateFrom`. Each
  window still contains only time inside the daily time-of-day window; a 1440-minute window over a
  07:00–00:00 setting holds at most 17 hours of activity, not 24. The last window is truncated at `dateTo`.

`windowStart`/`windowEnd` must reflect the truncation — the client renders the axis from them.

The client caps the resulting column count at 48 by choosing `windowMinutes`, so no request should ask
for more than ~50 windows.

**Answered.** Accepted `windowMinutes` is the union of both sets, 15…10080, permissive on a single day
too — so an adaptive pick on a one-day span cannot 400. The tiling rule was implemented as written,
including on a single day: bands tile from `from`, not from midnight. That is a change from the old
single-`date` behaviour (`from = 07:00` at `windowMinutes = 90` now opens at 07:00 rather than 06:00,
with a truncated final band), and it is the alignment the client already generated its own empty slots
on — the two agree for the first time. Midnight alignment was offered and is not wanted.

## 4. Response shapes — unchanged

**No response DTO changes.** The frontend's `fromJson` reads exactly what it reads today; the values
simply aggregate over the span instead of one day. Listed here so the aggregate versions can be checked
against what is actually consumed. Anything not listed is not read by the client.

### `summary-cards` → array

Web extension `SummaryCardsData`; desktop `DesktopProcessSummaryDto`; android `AndroidAppSummaryDto`.

| Field                              | Type          | Null?                       |
| ---------------------------------- | ------------- | --------------------------- |
| `domain` / `productName` / `appLabel` | `string`   | no                          |
| `processName` (desktop), `packageName` (android) | `string` | no             |
| `active`, `background` (web ext, desktop) | `ActivityStat` | **yes** — `null` is rendered as no activity |
| `stat` (android)                   | `ActivityStat` | **yes**                    |
| `totalSeconds` (web ext only)      | `number`      | no                          |
| `isNew`                            | `bool`        | absent → `false`            |

`ActivityStat`: `seconds: number` (non-null), `averageSeconds: number \| null`, `percentChange: number \| null`.

`isNew` and the two nullable baseline fields are the only ones whose *meaning* a range changes — see §5.

### `pie-chart` → object

| Source        | Items key   | Item fields                                                                        | Totals key + fields |
| ------------- | ----------- | ---------------------------------------------------------------------------------- | ------------------- |
| web extension | `domains`   | `domain`, `activeSeconds`, `backgroundSeconds`, `totalSeconds`, `pages: string[]`, `entries` | `totals`: `totalSeconds`, `activeSeconds`, `backgroundSeconds`, `totalDomains`, `totalPages`, `totalVisits?` |
| desktop       | `processes` | `processName`, `productName`, `activeSeconds`, `backgroundSeconds`, `totalSeconds`, `windowTitles: string[]`, `entries` | `totals`: `totalSeconds`, `activeSeconds`, `backgroundSeconds`, `totalProcesses`, `totalWindowTitles`, `totalEntries` |
| android       | `apps`      | `packageName`, `appLabel`, `seconds`, `totalSeconds`                                | `totals`: `totalSeconds`, `totalApps`, `totalSessions` |

All numeric fields non-null. `totals` itself is non-null and must be present even when the item array
is empty — the client reads it unconditionally. `totalVisits` is the one optional field.

The count-style totals (`totalDomains`, `totalPages`, `totalProcesses`, `totalWindowTitles`, `totalApps`)
must be **distinct counts over the whole span**, not a sum of per-day counts. A domain visited on all
seven days counts once. Getting this wrong is invisible on a single day and inflates by ~7× on a week.

### `stacked-bars` → array of windows

| Field                    | Type                | Null? |
| ------------------------ | ------------------- | ----- |
| `windowStart`            | ISO-8601 datetime   | no    |
| `windowEnd`              | ISO-8601 datetime   | no    |
| `activities` / `apps`    | array               | absent → treated as `[]` |

Item fields — web ext: `domain`, `activeSeconds`, `backgroundSeconds`, `totalSeconds`, `url?`;
desktop: `processName`, `productName`, `activeSeconds`, `backgroundSeconds`, `totalSeconds`;
android: `packageName`, `appLabel`, `seconds`.

**Windows with no activity may be omitted** — the client generates and merges empty slots itself. Over a
range it merges consecutive empties within a day and collapses whole empty days, so omitting them is
cheaper and renders identically.

`windowStart` must be unique across the response. On a single day the client can key windows by
minute-of-day; over a range it keys by the full instant, so two windows sharing a start time on
different days would collide.

### `timeline` → object

`primarySessions`, `detailSessions`, `backgroundSessions` (web ext, desktop) / `sessions` (android),
each an array, absent → `[]`. Session fields: `id: int`, `domain`/`productName`/`appLabel: string`,
`startedAt`, `endedAt` (ISO-8601 datetime), `durationSeconds: number`, `totalSeconds: number`, `url?`.

**The timeline is only ever requested with `dateFrom == dateTo`.** The client disables it over a range
and falls back to stacked bars: a session timeline over thirty days is not a legible object (the axis
alone would be ~8,600 ticks, and a continuous axis would draw every untracked night as tracked-and-idle).
If range support is cheap it is still not wanted — please do not build it. Accepting `dateFrom`/`dateTo`
on this endpoint is only for uniformity with the other three.

**Answered.** Not built: the timeline rejects a span with `400 DateTo must equal DateFrom` rather than
returning something illegible. The client never sends one. Separately, **every** dashboard caps the span
at 366 days; the picker already capped there and the client now clamps a URL-seeded span to the same
number, so a hand-edited `?dateTo=` lands on a year of data rather than a 400.

## 5. `baseline` over a range — the one semantic decision left open

`summary-cards` carries `baseline`, one of `last7Days`, `last30Days`, `sameWeekday`, `allTime`. Today it
means "compare this day against the average day over that lookback", and it drives `averageSeconds`,
`percentChange` and `isNew`.

Over a multi-day span "compare against the average day" no longer type-checks against what the card shows,
because the card's own number is now a span total. The client displays whatever comes back and takes no
position; **you decide**, but the two options are not equivalent and one of them needs saying out loud:

1. **Per-day average, comparison scaled to the span.** `averageSeconds` = the baseline's mean day × the
   number of days in the span. `percentChange` then compares like with like. Simple, and `sameWeekday`
   stops being meaningful over a span longer than a week.
2. **Comparable preceding span.** Compare `[dateFrom, dateTo]` against the equally-long span immediately
   before it, ignoring the `baseline` enum entirely over a range. More honest for "is this week worse than
   last week", but it makes the baseline selector dead UI in range mode, which the client would then want
   to disable — tell us and it will.

Whichever you pick, `isNew` needs a definition over a span ("first seen inside this span" vs "first seen
ever"). It currently drives a "NEW" badge.

If neither is cheap, returning `averageSeconds: null` / `percentChange: null` over a range is a valid
answer — the client already renders those as "no comparison" and nothing breaks.

**Answered — option 1.** `averageSeconds` is the baseline's mean day × the span length, so
`percentChange` compares like with like and single-day arithmetic is unchanged (span = 1). `isNew`
keeps its current meaning, "absent from the baseline lookback", which is already well-defined over a
span. The baseline selector therefore stays live in range mode; nothing on the client changed.

## 6. Two smaller items

**Details endpoints.** `GET /activity-tracking/web-extension/domain-details` and
`GET /activity-tracking/desktop/process-details` take instant `from`/`to` query params, and the desktop
pie chart calls the latter with the **outer envelope** of the selected span (`dateFrom` at `from` →
`dateTo` at `to`). Over a multi-day range that envelope includes the nights the daily window excludes, so
the details panel will over-count relative to the pie slice it was opened from. Either accept
`dateFrom`/`dateTo` + `from`/`to` here too and apply the §2 rule, or say the panel should be suppressed
over a range and the client will suppress it. (`domain-details` appears to be unused by the client today.)

**Answered — accepted, additively.** Both endpoints keep the instant `from`/`to` envelope and gained two
optional query params, `windowStartMinutes` / `windowEndMinutes` (minutes past midnight, 0–1439, both or
neither); given those, the daily window is reconstructed from the envelope and the §2 rule applied. The
desktop pie chart now sends them on every details lookup, so the panel counts what the slice counts and
the panel does not need suppressing. `domain-details` is still unused and was left on the old call shape.

**The triplication, as a proposal not a request.** Three structurally identical request families and three
response families differing in one label field (`domain` / `productName` / `appLabel`) is the module's
largest source of drift — the frontend already normalises all three into one view-model, so it is the
component that pays for the divergence. If it is being touched anyway, the shape the client would rather
consume is one route per dashboard with the source as a parameter, and a single item shape carrying
`key` (the stable identifier: domain / processName / packageName) plus `label` (the display name:
domain / productName / appLabel). That is a proposal with a reason, not a requirement — the decision is
yours, and **U4 will have an opinion on the same surface**, so settle the two together rather than in
sequence.
