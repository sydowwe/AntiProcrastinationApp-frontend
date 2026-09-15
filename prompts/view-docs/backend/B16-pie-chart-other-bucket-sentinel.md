# B16 · Backend ask — the four pie-chart endpoints emit their tail bucket as `"Other"`; the four stacked-bars endpoints emit `"_other"`; the client understands only the second

**Contract only.** One sentinel for "the rows below the threshold, folded" across every tracking endpoint
that folds. Which constant, and where it lives, is yours — as long as it is one.

> Source-certain, **unobserved on the seed** (found reading `tracking-dashboards/B2`'s data path in the
> eleventh pass; the fixture may have no sub-1 % slice to show it). Written 2026-09-15 from
> `docs/views/_fix-queue.md` escalation §10. Re-confirmed against `AdhdTimeOrganizer.Tracking` 2026-09-15.

---

## The problem

Two sentinels for one concept:

| endpoint | folded row's name |
| --- | --- |
| `WebExtensionPieChartEndpoint.cs:88` | `Domain = "Other"` |
| `DesktopPieChartEndpoint.cs:81-82` | `ProcessName` / `ProductName = "Other"` |
| `AndroidPieChartEndpoint.cs:79-80` | `PackageName` / `AppLabel = "Other"` |
| `UnifiedPieChartEndpoint.cs:21` | `OtherLabel = "Other"` |
| `WebExtensionStackedBarsEndpoint.cs:81` | `Domain = "_other"` |
| `DesktopStackedBarsEndpoint.cs:77-78` | `"_other"` |
| `AndroidStackedBarsEndpoint.cs:113-114` | `"_other"` |

Every dashboard sends `minPercent: 1` to the pie endpoints (`ActivityDashboard.vue:149`,
`DesktopActivityDashboard.vue:180`, `AndroidActivityDashboard.vue:170`), so the `"Other"` row is produced
whenever anything falls under 1 % of the span.

The client recognises **only `_other`** — `ActivityPieChart.vue:62,96,144,150`, `StackedBarsChart.vue:440`,
`StackedBarsTooltip.vue:43`: it translates it (`activityTracking.common.other`, SK *Ostatné*), colours it
neutrally, and refuses to select it. A literal `"Other"` therefore:

- **(a)** renders as an untranslated English legend entry in Slovak;
- **(b)** is a selectable slice — `?selected=Other` in the URL, a desktop `process-details?processName=Other`
  request, and after app-side `F47` an Android detail panel titled *Other*;
- **(c)** on the web dashboard, where `ActivityPieChartSection.vue:119-140` **also** buckets below 3 %
  client-side into `_other`, can produce **two "Other" legend entries** when the server's bucket sums to
  ≥ 3 %.

## The business rules

1. **A folded row is a sentinel, not a name.** It must be a value no real domain, process, product, package
   or app label can carry, so the client can tell "the tail" from "an app literally called Other".
   `_other` satisfies that; `Other` does not.
2. **The sentinel is identical across every endpoint that folds** — the client has one branch for it and
   must not grow a second.
3. **The folded row is never selectable / drill-downable** — the client already enforces that for `_other`;
   the server should not have to.

## The shape the frontend needs

The four pie endpoints emit **`_other`** in the same fields where they emit `"Other"` today (one constant,
four files). No other change: the row's `totalSeconds` / percentages are already right, and the client's
translation and colour are in place.

If a display label is wanted on the wire for some other consumer, add it as a separate field — do not put a
human word in the identity field.

## What changes on the frontend once this lands

`F47`'s local guard on the `"Other"` row (its *What to change*) is a shim to remove. Nothing else.

**What would settle whether it is live today** (for whoever verifies):
`playwright-cli route "**/api/activity-tracking/android/pie-chart"` with a fulfilled body carrying one
`"Other"` row, then read the legend and click the slice — or a seed app under 1 % of the span.

The client-side alternative — stop sending `minPercent` and bucket locally on all four sections the way the
web one does — is more code for the same result and leaves the server's `MinPercent` branch dead. Not
recommended, but it is app-side if you decline.
