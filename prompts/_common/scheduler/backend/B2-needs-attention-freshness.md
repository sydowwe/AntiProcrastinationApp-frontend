# B2 · Backend ask — `/scheduled-job/needs-attention` cannot say how old it is, how wide its window is, or whether its lists are complete

**Contract only.** Nothing here prescribes storage, entities, migrations, indexes, or where the
computation happens — those are yours. This is about what the response says and what the numbers in
it mean.
**Framework-shared.** `src/_common/modules/scheduler/` is part of the `vue_framework` submodule and
the scheduler service is shared infrastructure, so every field asked for below is **additive** and
every existing consumer must keep working when it is absent. Nothing here changes an existing field's
type, name or nullability.

Raised while implementing S5 (freshness): the health dashboard now refreshes itself every 60 s
instead of fetching once and sitting there. Auto-refresh only helps if the page can say *how fresh*
what it shows actually is — and that is where the frontend ran out of information.

## The problem

`SchedulerNeedsAttentionView` is the page an operator leaves open on a second monitor. It now polls
`GET /scheduled-job/needs-attention` on a fixed interval (`SchedulerNeedsAttentionView.vue:232`),
pauses while the tab is hidden, and renders an "updated &lt;relative&gt;" line beside the refresh
button. Three things about the response make that line, and the counts under it, less honest than
they look.

**1. There is no "as of" timestamp, so the page can only claim when *it* received the bytes.**
`SchedulerNeedsAttentionResponse` (`dto/response/SchedulerNeedsAttentionResponse.ts:22-31`) carries
three counts, three job lists and a rollup — nothing else. So the freshness line is driven by
`const updatedAt = ref<Date | null>(null)`, set to `new Date()` at the moment the promise resolves
(`SchedulerNeedsAttentionView.vue:245-248`, carrying the `TODO(Bn)` that points here).

The frontend took the honest fallback: the label reads **"Načítané" / "Loaded"**, not "as of", and it
carries a tooltip saying in as many words that the server does not report when it computed the
summary (`scheduler.needsAttention.updatedHint`). But if this summary is computed on a schedule
rather than per request, "Loaded just now" can be true while the data behind it is twenty minutes
old — and that is wrong in precisely the situation this page exists for. The operator cannot tell,
and neither can the client.

**2. The rollup's window is a server-side constant the client only knows from a translated string.**
The card is labelled *"Výsledky behov za posledný deň" / "Run outcomes over the last day"*
(`_locales/scheduler.sk.ts:146`, rendered at `SchedulerNeedsAttentionView.vue:120-148`), and
`RecentOutcomeRollup` (`:4-19`) is four bare integers. "Last day" was written into a locale file by a
frontend author reading a DTO comment. An operator seeing **Failed: 3** needs to know whether that is
a rolling 24 hours, midnight-to-now, or something else — and in whose timezone.

**3. Nobody knows whether the three job lists are capped.**
`AttentionJobList.vue:26` renders `items.length` as the headline count next to each list's title. If
the server truncates at, say, 20, that headline is a lie **exactly on the day it matters** — the day
something breaks a hundred jobs at once and the card calmly says 20.

Not asked for, deliberately: relative times are computed against the client clock, so a device with a
skewed clock renders every "in 4 min" in the module wrong. Exposing server time to correct for that
is not worth the complexity — a skewed clock breaks far more than this page, and the operator has
bigger problems.

## The business rules

Each of these is something the client currently assumes. Please **confirm or correct**; the frontend
follows the server's answer.

1. Is `/scheduled-job/needs-attention` computed **per request**, or read from something refreshed on
   its own schedule? If the latter, what is that cadence? This decides whether question 1 above needs
   a field at all, and it also decides whether a 60 s client poll is sensible or is just noise
   against a summary that only changes every 5 minutes. **If the poll interval should be different,
   say so and the client will change the constant.**
2. What exactly is the rollup's window — rolling 24 h from request time, or a calendar day? If
   calendar, boundaries in which timezone (server, UTC, or the requesting user's)?
3. Are `failedJobs` / `overdueJobs` / `orphanedJobs` capped, and if so at what and by what ordering?
   Is the ordering stable and meaningful (worst-first, oldest-first), or incidental?
4. Do the three counts (`activeCount` / `pausedCount` / `removedCount`) count **all** registered jobs,
   or only those visible to the requesting user? The page presents them as a system-wide total.

## The shape the frontend needs

All additive on the existing `GET /scheduled-job/needs-attention` response. Every one is optional as
far as the client is concerned: `fromJson` already defaults missing fields, so an older or partial
server keeps working and the client simply renders what it renders today.

| Field | Type | Null? | Why, and what renders it |
|---|---|---|---|
| `computedAt` | UTC instant (ISO 8601) | no | The instant the summary reflects. `SchedulerNeedsAttentionView`'s freshness line switches to it, and the label becomes an honest "as of". **Only worth adding if the answer to rule 1 is "not per request"** — if it is computed per request, say so in a comment on the endpoint and the client will keep using receive time, which is then correct. |
| `recentOutcomes.windowHours` | number | no | The rollup's actual window, so the card can label itself from data instead of from a hardcoded Slovak string. A number is enough if the answer to rule 2 is "rolling"; if it is a calendar day, `recentOutcomes.windowStart` (UTC instant) instead, and the client will format it. |
| `failedJobsTotal` / `overdueJobsTotal` / `orphanedJobsTotal` | number | no | The **true** count when the corresponding list is capped, so `AttentionJobList` can render "20 of 137" rather than "20". Only needed if the answer to rule 3 is "yes, capped". |

None of this is hot: one small read per minute per open dashboard, and only while someone is
actually looking at the tab.

## What changes on the frontend once this lands

- `SchedulerNeedsAttentionView.vue:245-248` — the `TODO(Bn)` comment and the client-receive-time
  `updatedAt` ref are replaced by `data.computedAt`; the `updated` / `updatedHint` locale strings in
  `_locales/scheduler.{sk,en}.ts` become a straightforward "as of" with no disclaimer.
- `_locales/scheduler.{sk,en}.ts` — `needsAttention.recentOutcomes` stops hardcoding "za posledný
  deň" / "over the last day" and takes the window as a message parameter.
- `AttentionJobList.vue:26` — the headline count reads the total instead of `items.length`, and the
  card can say it is showing a capped slice.
- `SchedulerNeedsAttentionView.vue:232` — `REFRESH_INTERVAL_MS` is re-picked against the real cadence
  instead of a guess, if rule 1 says it should be.

If the answers are simply "computed per request, rolling 24 hours, uncapped", then **no code change
is needed at all** — write that into the endpoint's doc comment and this ask is closed. Three
sentences of confirmation are worth as much here as three new fields.

---

## Answer (2026-08-30) — closed, no backend change needed

Read off the implementation: `Sydowwe.Scheduler/application/endpoint/dashboard/read/GetSchedulerHealthEndpoint.cs`
and `application/dto/health/SchedulerHealthDto.cs`.

1. **Computed per request.** The handler runs five `AsNoTracking` queries against the registry and the
   run log on the way out and caches nothing. So `computedAt` is not needed: client receive time *is*
   the snapshot time, minus the round trip. `REFRESH_INTERVAL_MS` is a free cost-versus-staleness
   choice; 60 s stays.
2. **Rolling 24 hours from request time**, `StartedAt >= DateTime.UtcNow.AddHours(-24)`. No calendar
   boundary, so no timezone question — and the window was **already on the wire** as
   `recentWindowHours`. The client simply was not reading it.
3. **Uncapped.** All three lists are full `ToListAsync` projections with no `Take` and no ordering, so
   `items.length` is the true count. (No ordering means row order is incidental — worth an ask of its
   own if the lists ever get long, but it is not a correctness problem today.)
4. **System-wide.** No user predicate anywhere in the handler; the counts group over every
   `ScheduledJob` row. The page presenting them as a system total is correct. The endpoint is open to
   any signed-in user.

**But the ask found the wrong problem.** The premises were written from the DTO, and the DTO did not
match the server:

- The route did not exist. The client called `GET /scheduled-job/needs-attention`; the endpoint is
  `GET /scheduler-dashboard/health`. **The page was 404-ing outright** — everything above about
  freshness was moot. (Same class of defect B1 found in three other routes.)
- `recentOutcomes` is not four integers. The server sends `recentRunOutcomes`, a *sparse* list of
  `{ outcome, count }` buckets grouped straight off the run log.
- `RunOutcome` has **six** members server-side — `Misfired` and `Reversed` were missing from the
  client enum, so those runs were dropped from the rollup and would have rendered as raw keys in the
  history grid and both chips.
- `AttentionJobItem.detail` does not exist on `ScheduledJobDto`. It is always null, so the
  per-row reason (`AttentionJobList.vue`) never renders. Left in place — the field is the right idea
  and the row degrades cleanly — but it is a genuine open ask if the reason text is wanted.

### What was changed on the frontend

- `SchedulerApi.ts` — route corrected to `/scheduler-dashboard/health`; doc comment records that it is
  computed per request.
- `SchedulerNeedsAttentionResponse.ts` — `RecentOutcomeRollup.fromJson` now flattens the bucket list
  and covers all six outcomes; `total` sums the buckets as received, so an outcome added server-side
  still counts. New `windowHours`, read from `recentWindowHours`.
- `RunOutcome.ts` / `RunOutcomeChip.vue` / `scheduler.{sk,en}.ts` — `Misfired` and `Reversed` added.
- `SchedulerNeedsAttentionView.vue` — the `TODO(B2)` is gone; the freshness label is now an honest
  "as of" / "Aktuálne k"; the rollup card labels itself from `windowHours` instead of a hardcoded
  "last day"; misfired/reversed chips appear when non-zero.
- `AttentionJobList.vue` — unchanged. `items.length` is the true count.
