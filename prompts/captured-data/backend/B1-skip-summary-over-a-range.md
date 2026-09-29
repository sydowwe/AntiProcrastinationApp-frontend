# B1 · Backend ask — skipped planner tasks over a date range, by reason and by planned hour

**Contract only.** It covers one read endpoint and one optional question about how built-in reasons are stored. Where the aggregate is computed, how it is
queried and whether anything is stored are the backend's decisions.

> Written 2026-09-27 from `prompts/captured-data/C1-skip-reason-insights.md`, after its single-day half shipped client-side. That half needed nothing from the
> server: the day view already holds every task's `status` and `skipReason`. This ask covers the **range** half, the calendar line under the plan-vs-actual
> trend. Until it lands, that line renders nothing (`TODO(B1)` in `PlannerCalendarView.vue`).
>
> ✅ **LANDED 2026-09-28. Both parts were taken**: the range endpoint, and keys for the built-in reasons. The backend's response is at the bottom.
> **The frontend half is done and was verified end to end on 2026-09-28** against the restarted and migrated API. See "Frontend half" and "Verified end to
> end" at the bottom.

---

## The problem

Since B26, every skip carries a reason, and the user gets that reason back only once, on the one task. The calendar shows a month at a time, and nothing
over that month can say "most of what you skipped, you skipped for the same reason", or "the things you plan after 20:00 are the things that don't happen".

No existing endpoint returns skipped tasks over a range:

- **`POST /planner-task/plan-vs-actual-trend`** removes them at the query: `GetPlanVsActualTrendPlannerTaskEndpoint.cs:95`, `t.Status != PlannerTaskStatus.Cancelled`.
  That is deliberate and documented on both ends: a skip is not a failure, so it does not count as "never happened". Nothing about it needs to change.
- **`POST /calendar/task-summaries`** is range-shaped, but it projects id, span, colour and activity name only (`GetTaskSummariesCalendarEndpoint.cs:66-74`), with
  no status and no reason.
- **`POST /planner-task/filter`** takes one calendar id, so a month would need about thirty requests. The client will not fan out, for the same reason the trend
  endpoint's own doc comment gives.

## Preference: a sibling endpoint, not an extension of the trend

I would rather this did **not** go into `PlanVsActualTrendResponse`. The choice is yours, but here is the reasoning:

- The trend's contract is "`taskCount === 0` means say nothing", and its population excludes Cancelled. Adding skip data to it puts a second population, with
  a different eligibility rule, into a response whose doc comment already spends two paragraphs warning against mixing populations.
- The two surfaces render independently. A range where every task was skipped has no trend to show but does have a skip line. A failed skip aggregate should
  also not cost the month its trend. The client already fetches the trend in isolation for this reason (`PlannerCalendarView.vue`, `refreshPlanVsActualTrend`).

It should share the trend's **range rules** exactly, though (rules 1–2 below). The two lines sit together and are both described as covering "this period".

## The business rules

1. **Range.** The request is the same as `PlanVsActualTrendRequest`: `from` and `until`, both inclusive, as `YYYY-MM-DD`. It gets the same 400s: `until` before
   `from`, or more than 366 days.
2. **Only days strictly before the user's today**, in `User.Timezone`, exactly as the trend resolves it (`GetPlanVsActualTrendPlannerTaskEndpoint.cs:62-71`). A
   range entirely in the future, or entirely today, is a 200 with zeroes, not an error.
   - *Question:* a skip made today is already final, unlike an untouched task, so today *could* be included here. I am asking you not to include it. The
     per-hour rate in rule 5 has a denominator, and today's not-yet-reached tasks would inflate it. Both lines also say "this period", and they should mean the
     same days. Correct me if you disagree.
3. **Background tasks are excluded** from everything, as they are in the trend and in the single-day line.
4. **Reasons are grouped by exact stored value.** The server already trims the reason and stores blank as null (B26), so equal strings are one group. **Null is
   its own group.** Please do **no** case folding, locale merging or fuzzy matching. The client applies one more grouping step in
   `src/core/dayPlanner/utils/skipReasonGroups.ts`: case fold, whitespace collapse, and recognising the three built-in labels in every locale. The single-day
   line and this range line must apply the same rule, so that rule lives in one place. It also means **no cap on the number of groups**. If the server truncated
   the list, the client could fold two of the dropped groups into one that would have been the largest.
5. **Per planned start hour, both counts.** For each hour of the day (the task's `StartTime.Hour`, as stored), the number of eligible tasks planned to start
   in that hour and how many of them were skipped. A task that wraps midnight counts in the hour it starts. **The denominator is every non-background task on
   an eligible day, in any status, including Cancelled and Completed-without-times.** The question is "of what you planned at 21:00, how much was skipped",
   and everything planned was planned.
6. **Derived on every read,** like the trend. When a task is un-skipped weeks later, it leaves the aggregate. There is no repair path to write.

## The shape the frontend needs

`POST /api/planner-task/skip-summary`. The route name is yours.

```json
{ "from": "2026-09-01", "until": "2026-09-30" }
```

Response, 200, camelCase:

```json
{
  "skippedCount": 7,
  "reasons": [
    { "reason": "Ran out of time", "count": 3 },
    { "reason": "Nestihol som", "count": 1 },
    { "reason": null, "count": 2 },
    { "reason": "Meeting ran long", "count": 1 }
  ],
  "byStartHour": [
    { "hour": 9, "plannedCount": 12, "skippedCount": 1 },
    { "hour": 21, "plannedCount": 5, "skippedCount": 4 }
  ]
}
```

| Field | Type | Null? | Why |
|---|---|---|---|
| `skippedCount` | int ≥ 0 | never | `0` means render nothing, the same convention as the trend's `taskCount`. It is also the denominator in "N of M skips". |
| `reasons[].reason` | string | **yes**, meaning skipped with no reason | The top-reason sentence. Null is counted so totals add up, but it never competes as a reason. |
| `reasons[].count` | int ≥ 1 | never | The counts sum to `skippedCount`. Order does not matter, because the client re-sorts after folding. |
| `byStartHour[].hour` | int 0–23 | never | The time-of-day sentence. Hours with `plannedCount === 0` may be omitted. |
| `byStartHour[].plannedCount` | int ≥ 1 | never | The base rate. Without it, "most skips were in the evening" only says that most plans are in the evening. |
| `byStartHour[].skippedCount` | int ≥ 0 | never | Summed over all hours, this equals `skippedCount`. |

**Not needed:** activity ids, task ids, dates, weekdays. See "rejected" below. Please don't add them for completeness. Each one is a pattern the client has
decided not to show.

Errors are the same validation 400s as the trend, with the usual `errors` map and no `errorType` (`B18`).

### What the client renders from it: at most two sentences, and both have floors

- **Top reason.** Shown when, after the client's folding, the largest *named* group has at least **3** skips and strictly more than the runner-up. A tie means
  there is no "most common". Wording: *"Most common reason for skipping in this period: No energy for it — 5 of 12 skips."*
- **Time of day.** Shown when some evening split hour H has at least **5** tasks planned at or after H, at least **3** of them skipped, and a skip rate at least
  **twice** the rate before H. Wording: *"Of the tasks planned from 20:00 on, 4 of 6 were skipped; earlier in the day, 2 of 30."* This is the actionable one: it
  says something about the plan, not the person.
- Below either floor, that sentence is **not rendered at all**. It is never shown with a hedge.

### Rejected candidates

These are recorded so the next person doesn't reopen them, and so the ask stays this narrow:

- **The same activity skipped repeatedly** ("Gym: skipped 4 of 5 times"). This was the closest call. It is actionable, but it names one thing the user
  repeatedly didn't do, which is the "list of your failures" the feature must not become. The time-of-day sentence carries the same planning lesson without
  pointing at an activity. Two sentences is the cap, and the top reason is the point of the feature.
- **Weekday pattern.** A month holds four or five of each weekday. That is too thin to support any claim at the floors above, and on a week view it is one
  sample per day.
- **Skip rate or skip count over time** (a trend arrow, "more than last month"). This is scoring. The C1 tone rules forbid it.
- **A skip percentage for the range.** It is a grade by another name, and it invites a comparison with the trend's numbers, which cover a different population.
- **Reason × time-of-day cross-tab.** It is far too sparse for one user's month to clear any floor.

## Second question: store the three built-in reasons as keys?

B26 left this open ("Keys would be a separate ask"). This is that ask. It is **optional, and B1's first part does not depend on it.**

Today the home widget's *Skip* menu sends the translated label (`TaskActionMenu.vue`, labels in `planner.skipReason.*`). The client recognises the six known
strings when it groups reasons:

| key | SK | EN |
|---|---|---|
| `noTime` | Nestihol som | Ran out of time |
| `notRelevant` | Už nie je aktuálne | Not relevant any more |
| `noEnergy` | Nemal som energiu | No energy for it |

That works, but it is string matching against copy. If a label is reworded, old and new rows silently become two reasons. Keys would remove that.

**If you take it**, the contract the client would need:

1. `PATCH …/status` accepts an optional `skipReasonKey` (`"noTime" | "notRelevant" | "noEnergy"`, camelCase like other enums). It is allowed only with
   `status: "cancelled"`. Sending both a key and a non-blank `skipReason` is a 400. An unknown key is a 400.
2. `PlannerTaskResponse` gains `skipReasonKey: string | null`. At most one of `skipReasonKey` and `skipReason` is non-null.
3. B26's clearing rules apply to the key as well. It is cleared on any transition out of Cancelled, and the PUT never writes it.
4. B1's `reasons[]` entries gain `reasonKey: string | null`, grouped by key when present.
5. **Existing rows:** a row whose stored text equals one of the six strings above exactly (it is already trimmed) **reads back as that key**, with `skipReason`
   null. Any other text stays text, and that includes near-misses like "ran out of time again". Whether that is a one-off migration or a read-time mapping is
   your call. The contract is only that the six strings never come back as text afterwards.

The client would then send the key from the home widget and keep sending free text from the day planner. Its folding step would keep recognising the six
strings for any row the backend chooses to leave as text. **Nothing on the client changes what it sends until you have answered.**

If you would rather not, say so, and the client keeps matching the strings. The labels' doc comments already warn against rewording them.

## What changes on the frontend once this lands

- **New:** a `SkipSummary` response DTO, `fetchSkipSummary` in `plannerTaskApi.ts` (`_silent`, like the trend), and one small component under
  `component/calendar/` mounted at the `TODO(B1)` in `PlannerCalendarView.vue`. It is fetched beside the trend, under the same `refreshRequestId` guard, and falls
  back to empty on failure.
- **Reused as is:** `utils/skipReasonGroups.ts` for folding, and `useSkipReasonSummary` for labels. The single-day line already renders through them.
- **If the key question is answered yes:** `TaskActionMenu` sends `skipReasonKey`, `PlannerTask` reads it, and the folding step handles key groups directly.

## How the client will verify

Against the e2e seed, with nothing mocked. Rows are created and cleaned up through the app's own API, as in the C1 single-day check:

1. On two past days in the same month, create tasks through `POST /planner-task`. Skip three of them as "Ran out of time", "Nestihol som" and
   "ran out of time", skip one with no reason, and leave the rest untouched.
   - Expect `skippedCount` 4, with reasons as three exact-value groups plus one null group.
   - The client line should read *Ran out of time — 3 of 4 skips* (EN), after folding.
2. Plan six tasks at 20:00–22:00 across those days and skip four. Plan ten before noon and skip none. Expect the `byStartHour` counts to match, and the
   time-of-day sentence to appear.
3. Skip a task **today**. Expect it to be absent from every count.
4. Skip a **background** task. Expect it to be absent.
5. Send a range in the future: a 200 with zeroes, and the client renders nothing. Send 367 days: a 400.
6. Un-skip one task from step 1 and re-read. Expect the counts to drop by one (rule 6).

---

## Backend response (2026-09-28)

Both parts landed as asked (`GetSkipSummaryPlannerTaskEndpoint.cs`, `SkipSummaryService.cs`, migration `20260928090041_SkipReasonKeys`). Differences from the ask
are marked ⚠.

### `POST /api/planner-task/skip-summary`

- **Request, validator and range rules** are the trend's own: `PlanVsActualTrendRequest`, `PlanVsActualTrendValidator`, and
  `TaskPlannerHelper.LastDayThatIsOver`. The 400s are identical. Today is excluded. A range in the future, or entirely today, returns 200 with `skippedCount: 0`
  and empty arrays.
- **Background tasks** are excluded from both the skips and the per-hour denominator.
- **Derived on every read.**
- ⚠ **Each `reasons[]` entry also carries `reasonKey`.** A key group has `reasonKey` set and `reason: null`. A text group has `reason` set (the exact stored text,
  unfolded) and `reasonKey: null`. Both null means no reason. The list is unordered and uncapped, and its counts sum to `skippedCount`.
- **`byStartHour[]`** is ascending, and hours with nothing planned are omitted. `plannedCount` covers every non-background task in any status. The hours'
  `skippedCount`s sum to the top-level count.

### Built-in reasons stored as keys

- `PATCH …/status` takes an optional `skipReasonKey` (`"noTime" | "notRelevant" | "noEnergy"`, case-sensitive).
  - It is a 400 with any status other than Cancelled, a 400 beside a non-blank `skipReason`, and a 400 if the key is unknown.
  - It follows B26's clearing rules: it is cleared on any change away from Cancelled, and the PUT never writes it.
- `PlannerTaskResponse.skipReasonKey` is new. At most one of it and `skipReason` is non-null.
- **Existing rows:** the migration converted the six exact labels to keys. Near-misses stay as text.
- ⚠ **New writes are converted too.** Text that exactly matches one of the six labels (after trimming) is stored as the key, whichever client sends it. So
  moving `TaskActionMenu` to keys needed no coordinated deploy. A user who types a built-in label exactly into the day planner's box gets the key back.

## Frontend half (2026-09-28)

- **Range line:** `component/calendar/SkipSummaryLine.vue`, mounted where the `TODO(B1)` was.
  - It is fed by `fetchSkipSummary` in `plannerTaskApi.ts` (`_silent`) and the new `dto/response/SkipSummary.ts`.
  - It is fetched beside the trend under the same `refreshRequestId`, and is empty on failure.
  - The sentence rules and floors are in `utils/skipRangeInsights.ts`, which also lists the rejected candidates. They are unit-tested in
    `skipRangeInsights.test.ts`.
  - The time-of-day sentence names the first hour that actually has late tasks, not the split boundary. With nothing planned 17–19, it says 20:00, not 17:00.
- **Keys end to end:**
  - `PlannerTask.skipReasonKey` and `PatchPlannerTaskStatusRequest.skipReasonKey` are new. `parseBuiltInSkipReason` does the parsing, because the wire already
    carries the enum's values, so `convertToEnum` does not apply.
  - The home widget's *Skip* menu sends the key with `skipReason: null`.
  - **The home widget's "Skipped: …" chip now reads the key.** Without this, every built-in skip the migration converted would have lost its reason on that
    chip.
  - The day planner's skip clears a stale key locally, because in grouping a key wins over text.
- **Grouping** (`utils/skipReasonGroups.ts`) now takes counted entries, so the day line (one per task) and the range (one per server group) share it.
  - A key group merges with text that folds onto the same built-in.
  - Case variants of the same text, which the server sends as separate groups, are added together.
## Verified end to end, 2026-09-28

These checks ran against the API after its restart and after the `SkipReasonKeys` migration was applied. The first attempt returned 500 on `skip-summary`
**and on `day-plan`** with `column p.skip_reason_key does not exist`, because the new code was running against the old schema. After the migration, every
read was 200.

Tasks were created through `POST /planner-task` on Sept 21–23 (calendars 994–996) and today (1001), as ids 16012–16033. All were deleted afterwards, and the
September summary is back to its baseline: 0 skips, with 3 planned tasks at 07, 09 and 11.

1. **Step 1, as adjusted by the backend.** Four tasks were skipped at 14:00 as "Ran out of time", "Nestihol som", "ran out of time", and with no reason.
   - The server returned `noTime` ×2 as a key group, "ran out of time" ×1 as text, and 1 with no reason.
   - The calendar read *"Most common reason for skipping in this period: Ran out of time — 3 of 4 skips"*, with no time-of-day sentence.
   - The single-day lines read *"2 tasks skipped: Ran out of time (2)"* on Sept 21 and *"2 tasks skipped: Ran out of time · 1 without a reason"* on Sept 22.
     On the 22nd the text row folded onto the key.
2. **Step 2.** Ten tasks were added before noon with none skipped, and six at 20–22 with four skipped and no reason.
   - The `byStartHour` sums were as expected: 17 early tasks with 4 skipped, and 6 late tasks with 4 skipped.
   - The calendar read *"… Ran out of time — 3 of 8 skips"* and *"Of the tasks planned from 20:00 on, 4 of 6 were skipped; earlier in the day, 4 of 17"*.
3. **Step 3, today.** Task 16032 was skipped through the home widget's real *Skip → Ran out of time* menu.
   - The request body was `{"status":"cancelled",…,"skipReason":null,"skipReasonKey":"noTime"}` → 204, and the row reads back `Cancelled / null / "noTime"`.
   - The chip reads *"Skipped: Ran out of time"*.
   - The range count stayed at 8, with no 15:00 bucket.
4. **Step 4, background.** A skipped background task at 20:00 was left out: the count stayed at 8, and the 20:00 bucket stayed at 2/2.
5. **Step 5, ranges.** A range in the future and a range covering only today both returned 200 with zeroes. A 367-day range returned 400 with *"The range may not
   exceed 366 days."* With 0 skips the calendar renders no skip line.
6. **Step 6, un-skip.** Restoring one `noTime` task dropped the count to 7.
   - "Ran out of time" fell to 2, below the floor, and that sentence disappeared.
   - The evening sentence stayed, as *"… earlier in the day, 3 of 17"*.
   - Re-skipping through `skipReasonKey` returned 204.
7. **SK.** *"Najčastejší dôvod preskočenia v tomto období: Nestihol som — 3/8"* and *"Preskočené úlohy naplánované od 20:00: 4/6 · skôr počas dňa: 4/17"*. The
   account was switched back to EN afterwards.

**Found along the way, and fixed the same day in the framework:** `CalendarGrid.vue`'s footer is now two rows in the normal flow, holiday chips first and
the centred slot below. With the long-reason skip line, there is no overlap at 1440 px or 390 px, and nothing spills past the card. The history calendar, which
has no centre slot, is unchanged. The original finding: `CalendarGrid.vue`'s `#footer-center` slot is `position: absolute; left: 50%` with no
width limit, so it overlays the holiday chips on the left.
- It predates this work. On a 1440 px viewport in September, the trend line alone already overlapped the *"Our Lady of Sorrows"* chip by 15 px.
- The skip line is wider and makes that 46 px.
- The fix belongs in the framework: a centred column that takes part in the layout instead of floating over it. It is not an app-side width cap.

## Closed out, 2026-09-29

A review found C1 complete but not landed. The gaps, and what closed each:

- **Uncommitted, including the framework half.** The `CalendarGrid` footer fix is `vue_framework` `b1b82a1`. The C1 code is app `d6f5f00f`,
  committed apart from the unrelated work in the same tree (C2's rewards, the to-do link spelling fix). The pointer bump is `52f03b2f`. The C1
  commit was type-checked and unit-tested on its own, in a clean worktree.
- **No e2e coverage.** `e2e/tests/planner-skip-insights.spec.ts` has four tests, run green twice (the second time beside `dayPlanner.spec.ts`):
  - the day block adds nothing on a day with no skips;
  - the day line folds a key, the SK label and lower-case text into one reason;
  - a skip through the day planner's own dialog adds to that line, restoring a task through *Change Status* removes it, and a reload agrees;
  - the calendar stays silent below the floors, the top reason appears at the third skip, and both sentences appear above the floors.
- **Single-day restore, never recorded.** It is covered by the spec above. The first run caught a test race: the view sets the status before its
  PATCH resolves, so the spec now waits for the 204 before reloading. It was not a product defect.
- **Single-day line in SK, never recorded.** Checked by hand: *"Preskočené 3 úlohy: Meeting ran long (2) · Nemal som energiu"*. The Slovak
  plural is right, the user's EN text shows as entered with its lower-case variant folded in, and the key reads in SK. Rows were deleted and the
  account switched back to EN.

**Found along the way, not fixed (e2e fixture, not C1):** `freshSeed` cannot hold a signed-in page for more than about a minute. The reseed
truncates `RefreshTokens`, and an access token is only honoured while its session's refresh-token row is live. That verdict is cached for 60 s
(`SessionRevocationService.LiveVerdictTtl`), after which every request returns 401 and the refresh fails too. The note in `e2e/fixtures/seed.ts`
and `auth.ts` that cached auth "survives [a reseed] as long as the access token does (~15 min)" predates session revocation and is wrong. Any
`freshSeed` test that runs past that minute after its reseed will bounce to `/login`. The new spec avoids `freshSeed` for this reason.
