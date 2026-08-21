# H10 · Insights — turn the dashboards into answers

- **Scope:** historyDashboard
- **Backend:** yes — this one emits its own contract ask
- **Model / effort:** Opus 5, high effort — this is a product-design task with an implementation attached. The failure mode is shipping four more charts nobody reads.
- **Depends on:** H3, H5, H6 (build on the settled composable and locale files)
- **Unblocks:** nothing

---

```
The history module renders data faithfully and interprets none of it. A user gets a stacked-bar
chart, a pie chart, top-N cards with a percent change, and a timeline. Every one of those asks the
user to do the analysis. For an anti-procrastination app the useful output is not "here is your
week" — it is "here is the thing about your week that you would not have noticed."

Your job is to add a small number of stated conclusions, and to be ruthless about how few.

--- Constraints on what qualifies ---

A candidate insight must be:
- ACTIONABLE — it implies something the user could do differently. "You logged 14h" is not.
  "Your longest unbroken focus blocks start before 10:00" is.
- HONEST ABOUT SAMPLE SIZE — no conclusions from three data points. Every insight needs a minimum
  data threshold below which it is not shown at all, rather than shown with a hedge.
- NON-JUDGEMENTAL — this app's users open it to face their own data, and many are already using it
  because they feel bad about how they spend time. State facts. No "you wasted", no "only", no
  streak-shaming, no emoji-encoded disappointment. Deci, Koestner & Ryan (1999) is the reason the
  todo module deliberately has no points or badges (prompts/todo-motivation/README.md) — the same
  reasoning applies here. Do not add scoring.
- NOT ALREADY VISIBLE — if the pie chart shows it, do not restate it as a sentence.

Ship AT MOST THREE. Pick them by what the existing data plausibly supports; strong candidates:
- time-of-day pattern: when this user's focused blocks actually happen, vs when they think they do
- fragmentation: total time vs number of sessions — 4h in 6 sessions is a different day from 4h in 40
- drift: which group grew or shrank most against the baseline, stated once in words instead of read
  off four cards

Say in your report which candidates you rejected and why. That list is as much the deliverable as
the code.

--- What the current API can and cannot give you ---

Read src/core/historyDashboard/api/historyDashboardApi.ts and the response DTOs before designing
anything. Available today: per-window group totals (stacked bars), per-group totals + entry counts
(pie chart), per-group totals + averages + percentChange vs a baseline (summary cards), per-day
totals + session counts + top roles (calendar), and raw records via the timeline filter.

Note that group items are keyed by DISPLAY NAME only — there is no id on HistoryPieChartItem,
HistorySummaryCard or HistoryGroupItem. Activity names are not unique, so any insight that tracks a
group across periods is unreliable until that is fixed. See
prompts/activity-history/backend/B1-group-ids.md, which is the ask for it.

Do the work in this order:
1. Design the insights and decide, for each, whether it can be computed from data already on the
   client. Anything computable client-side, BUILD — a per-day or per-hour aggregation over a
   response the view already has is not a backend problem.
2. Anything that genuinely cannot (it needs a longer history window than the view fetches, or a
   server-side aggregation over all records), do NOT fake, do NOT approximate from the visible
   window, and do NOT ship a placeholder. Write the contract ask to
   prompts/activity-history/backend/H10-backend.md instead, following the format of the two files
   already in that directory: endpoint, method, route, request shape, response fields with types and
   nullability, in the JSON casing the frontend `fromJson` will read. Contract only — no entities,
   no EF, no migrations, no opinion on how a value is computed or stored. The .NET solution is not in
   this repo and a guess about someone else's schema is worse than no input.
3. Ship whatever stands on its own from step 1, with the rest listed as blocked in your report.

--- Presentation ---

One compact surface, not a fourth chart section. Sentences with the numbers inlined, in the summary
view, above or beside the existing cards. Reuse @/_common/component/feedback/ (InfoCard, InfoRow,
SubtleCard, ChipWithIcon) rather than inventing a card. Strings go through H5's locale files, SK
primary, with proper interpolation — these sentences have numbers and names in the middle of them and
must not be assembled by concatenation.

Do NOT: add a charting dependency, add an "AI summary" or any LLM call, add a settings screen for
which insights to show, or write an insight that is a restatement of a number already on screen.

Verify: check each insight by hand against the raw records for a period where you can compute the
answer yourself. Confirm each one disappears entirely below its data threshold. Run `npm run
type-check` and `npm run lint`.
```
