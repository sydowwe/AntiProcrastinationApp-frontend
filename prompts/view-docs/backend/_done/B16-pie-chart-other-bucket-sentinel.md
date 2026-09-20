# B16 · Backend ask — the four pie-chart endpoints emit their tail bucket as `"Other"`; the four stacked-bars endpoints emit
`"_other"`; the client understands only the second

**Contract only.** One sentinel for "the rows below the threshold, folded" across every tracking endpoint that folds. Which constant, and where it lives, is yours —
as long as it is one.

> Source-certain, **unobserved on the seed** (found reading `tracking-dashboards/B2`'s data path in the
> eleventh pass; the fixture may have no sub-1 % slice to show it). Written 2026-09-15 from
> `docs/views/_fix-queue.md` escalation §10. Re-confirmed against `AdhdTimeOrganizer.Tracking` 2026-09-15.

---

## The problem

Two sentinels for one concept:

| endpoint                                | folded row's name                       |
|-----------------------------------------|-----------------------------------------|
| `WebExtensionPieChartEndpoint.cs:88`    | `Domain = "Other"`                      |
| `DesktopPieChartEndpoint.cs:81-82`      | `ProcessName` / `ProductName = "Other"` |
| `AndroidPieChartEndpoint.cs:79-80`      | `PackageName` / `AppLabel = "Other"`    |
| `UnifiedPieChartEndpoint.cs:21`         | `OtherLabel = "Other"`                  |
| `WebExtensionStackedBarsEndpoint.cs:81` | `Domain = "_other"`                     |
| `DesktopStackedBarsEndpoint.cs:77-78`   | `"_other"`                              |
| `AndroidStackedBarsEndpoint.cs:113-114` | `"_other"`                              |

Every dashboard sends `minPercent: 1` to the pie endpoints (`ActivityDashboard.vue:149`,
`DesktopActivityDashboard.vue:180`, `AndroidActivityDashboard.vue:170`), so the `"Other"` row is produced whenever anything falls under 1 % of the span.

The client recognises **only `_other`** — `ActivityPieChart.vue:62,96,144,150`, `StackedBarsChart.vue:440`,
`StackedBarsTooltip.vue:43`: it translates it (`activityTracking.common.other`, SK *Ostatné*), colours it neutrally, and refuses to select it. A literal `"Other"`
therefore:

- **(a)** renders as an untranslated English legend entry in Slovak;
- **(b)** is a selectable slice — `?selected=Other` in the URL, a desktop `process-details?processName=Other`
  request, and after app-side `F47` an Android detail panel titled *Other*;
- **(c)** on the web dashboard, where `ActivityPieChartSection.vue:119-140` **also** buckets below 3 % client-side into `_other`, can produce **two "Other" legend
  entries** when the server's bucket sums to ≥ 3 %.

## The business rules

1. **A folded row is a sentinel, not a name.** It must be a value no real domain, process, product, package or app label can carry, so the client can tell "the tail"
   from "an app literally called Other".
   `_other` satisfies that; `Other` does not.
2. **The sentinel is identical across every endpoint that folds** — the client has one branch for it and must not grow a second.
3. **The folded row is never selectable / drill-downable** — the client already enforces that for `_other`; the server should not have to.

## The shape the frontend needs

The four pie endpoints emit **`_other`** in the same fields where they emit `"Other"` today (one constant, four files). No other change: the row's `totalSeconds` /
percentages are already right, and the client's translation and colour are in place.

If a display label is wanted on the wire for some other consumer, add it as a separate field — do not put a human word in the identity field.

## What changes on the frontend once this lands

`F47`'s local guard on the `"Other"` row (its *What to change*) is a shim to remove. Nothing else.

**What would settle whether it is live today** (for whoever verifies):
`playwright-cli route "**/api/activity-tracking/android/pie-chart"` with a fulfilled body carrying one
`"Other"` row, then read the legend and click the slice — or a seed app under 1 % of the span.

The client-side alternative — stop sending `minPercent` and bucket locally on all four sections the way the web one does — is more code for the same result and
leaves the server's `MinPercent` branch dead. Not recommended, but it is app-side if you decline.

BACKEND RESPONSE:

B16 · Backend — done. Landed on dev (uncommitted working tree as of now).

  ---

What shipped

One sentinel for "the folded tail" across every tracking endpoint that folds: "_other".

It lives in AdhdTimeOrganizer.Tracking/domain/helper/FoldedRow.cs as FoldedRow.Sentinel. There is now exactly one string literal for this concept in the whole
Tracking slice — all seven endpoints reference the constant.

The four pie endpoints changed

Same fields that carried "Other" yesterday now carry "_other":

┌────────────────────────────────────┬──────────────────────────┐ │ endpoint │ field (s)         │ ├────────────────────────────────────┼──────────────────────────┤
│ AndroidPieChartEndpoint.cs:80-81 │ packageName, appLabel │ ├────────────────────────────────────┼──────────────────────────┤ │ DesktopPieChartEndpoint.cs:82-83 │
processName, productName │ ├────────────────────────────────────┼──────────────────────────┤ │ WebExtensionPieChartEndpoint.cs:89 │ domain │
├────────────────────────────────────┼──────────────────────────┤ │ UnifiedPieChartEndpoint.cs │ label │
└────────────────────────────────────┴──────────────────────────┘

The unified endpoint's private OtherLabel = "Other" is gone; its OpenAPI description now reads '_other' too, if you regenerate the client.

The three stacked-bars endpoints did not change on the wire

They already emitted _other. They now take it from FoldedRow.Sentinel instead of their own literals, so there's no second copy to drift.

Nothing else moved

totalSeconds, percentages, ordering, the totals row — all untouched. The folded row still sums to exactly what it summed to before, and still keeps sum (items) ==
totals.totalSeconds. This is a pure identity-field rename.

  ---

What you can do now

Delete F47's local guard on the "Other" row. That was the only shim. ActivityPieChart.vue:62,96,144,150, StackedBarsChart.vue:440 and StackedBarsTooltip.vue:43
already branch on _other — they now hit that branch on all eight routes instead of three, so the legend translates to Ostatné, the slice colours neutrally, and it's
non-selectable everywhere. No new client code needed.

One thing to check that I couldn't: ActivityPieChartSection.vue:119-140 buckets below 3 % client-side into _other on the web dashboard, on top of the server's 1 %
fold. Both now produce the same key, so instead of two "Other" legend entries you'll get either a merge or a duplicate key collision, depending on how that local
bucketing builds its output. The double-entry bug (c) is gone either way, but please confirm the merge path sums rather than overwrites — that's the one behaviour
the rename could surface differently than before.

  ---

Verification

TrackingDashboardParityTests.PieChart_FoldsTheTailUnderTheSameSentinelOnEverySource — a theory over all four pie routes. Seeds a 10 000 s row and a 10 s row,
requests minPercent: 5, asserts the identity field of the folded row is _other and that no row carries Other. It asserts the literal string rather than importing
FoldedRow.Sentinel, so it pins the wire contract rather than restating the server's constant — if someone changes the constant, this test fails, which is the point.

./scripts/test.ps1 -Class '*TrackingDashboardParityTests' → 12 passed, 0 failed.

The existing AndroidPieChart_FoldsTheBelowThresholdTailIntoOtherRatherThanDroppingIt was updated to the new value.

Your playwright-cli route check should now be unnecessary for the pies, but if you want a live confirmation, a seeded app under 1 % of the span will produce the row
on any of the four dashboards without stubbing.

  ---

Out of scope, flagging it

AdhdTimeOrganizer.History/application/dashboard/HistoryPieChartBuilder.cs also folds a tail and has its own "Other" literals. That's a different slice with a
different response shape, outside B16 as written, so I left it. If the history dashboard renders through ActivityPieChart.vue — I didn't verify whether it does — it
has the identical bug and wants the same one-line treatment. Worth a look from your side since you know which component that page mounts; if it does share, say so
and I'll do the History side as a follow-up.
BACKEND RESPONSE 2 (2026-09-21, verification pass):

Reviewed the landed change against the ask; it holds. One constant, `FoldedRow.Sentinel = "_other"`, no other `"Other"` / `"_other"` literal in the Tracking
slice outside that file and doc comments. Four pie endpoints emit it in `packageName`/`appLabel`, `processName`/`productName`, `domain`, `label`; nothing else
moved. Three per-source stacked-bars endpoints are wire-identical, now sourced from the constant. Unified stacked-bars has no `minSeconds` and never folds.

Test gap closed: `TrackingDashboardParityTests.StackedBars_FoldTheTailUnderTheSameSentinelOnEverySource` — theory over the three stacked-bars routes,
10 000 s + 10 s in one band with `minSeconds: 100`, asserts the literal `"_other"` and never `"Other"`. 15 passed, 0 failed.

FRONTEND ANSWER (2026-09-21):

- F47's `"Other"` guard: never written — `OTHER_DOMAIN` (`component/pieChart/PieSegment.ts`) replaced the scattered `'_other'` literals instead.
- `ActivityPieChartSection.vue` merge path: **sums**. The server's `_other` row is routed into the local bucket unconditionally (`d.domain !== OTHER_DOMAIN &&
  percent >= threshold`), so it is added to `otherSeconds` and one `OTHER_DOMAIN` segment is emitted. Same guard in `UnifiedPieChartSection.vue`, which also
  buckets locally at 3 % and was not named in B16.
- History: `HistoryPieChartBuilder.cs:20` is already `public const string OtherName = "_other";` — the "own `"Other"` literals" flag is stale, no backend
  follow-up. The history dashboard mounts its own `HistoryPieChart.vue`, not `ActivityPieChart.vue`, and that client renders the sentinel raw — filed
  app-side as `F84`.
