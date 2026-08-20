# U3 · Break the single-day ceiling

- **Scope:** all three dashboards
- **Backend:** yes — emits `backend/U3-backend.md`
- **Model / effort:** Opus 5, high effort — the frontend change is moderate, but deciding what each of the four visualizations *means* over a range is the actual work
- **Depends on:** R2 (hard), U1 (soft — do U1 first so the range lands in the URL for free)

---

```
Every activity-tracking view is locked to one calendar day. The request DTOs make this structural,
not incidental: SummaryCardsRequest, PieChartRequest, StackedBarsRequest and DateAndTimeRangeRequest
all carry a single `date: string` plus a `from`/`to` Time pair, and all three dashboards bind a
single `<MyDateInput>`.

That is a real analytical ceiling. "How much did I spend on this domain this week" — the question
someone tracking their time actually has — cannot be asked. Note the irony: the baseline selector
already offers "Last 7 days" / "Last 30 days" / "All time", so the backend clearly computes over
ranges already; the user just cannot *look* at one.

Add a range mode. The design decisions are yours, but these are the ones that matter:

1. WHAT EACH CHART MEANS OVER A RANGE.
   - Summary cards and pie chart: aggregate cleanly. Mostly a request-shape change.
   - Stacked bars: the window sizes are 15-120 MINUTES. Over a week that is thousands of columns.
     Either the window unit becomes adaptive (minutes → hours → days as the range grows) or the
     chart switches to a per-day column. Pick one and say why. Do not just let the existing options
     produce an unreadable chart.
   - Timeline: a session timeline over 30 days is not a useful object. Decide honestly whether the
     timeline is range-capable at all, or whether selecting a range should disable it and fall back
     to stacked bars with a visible explanation. Disabling it is an acceptable answer; silently
     rendering something illegible is not.

2. THE TIME-OF-DAY WINDOW STILL APPLIES. `from`/`to` (default 07:00-00:00) is a daily window, not a
   range endpoint — over a range it means "07:00-00:00 on each day in the range", including the
   existing past-midnight rollover rule (`if to <= from, it belongs to the next day`). Keep that
   semantic and make sure the contract you write says so unambiguously; it is the easiest thing for
   a backend implementer to get wrong.

3. UI. `@/_common/component/dateTime/DateRangePicker.vue` exists — use it rather than building
   another picker. Single-day must stay the default and must stay one click away; most sessions are
   "what did I do today". Consider preset chips (today / last 7 days / this week / last 30 days)
   over a raw two-date picker as the primary control.
   Note `src/core/historyDashboard/component/controls/HistoryDateRangeSelector.vue` solves a similar
   problem, but do NOT import it — cross-module component imports are forbidden (CLAUDE.md). Read it
   for ideas; if it deserves to be shared, that is a framework promotion and a
   migration-revision.md entry, not a cross-import.

4. URL. If U1 has run, the range belongs in the query string alongside the rest.

BACKEND. This needs `date: string` to become a range on four endpoint families across three sources
(/activity-tracking/{web-extension,desktop,android}/{summary-cards,pie-chart,stacked-bars,timeline}).
The .NET solution is not in this repo — you cannot verify the contract from here, so do not guess at
it in code.

Do all the frontend work that stands on its own first (the picker, the preset chips, the URL state,
the per-chart mode decisions, the range→request plumbing behind a flag or against the existing
single-day contract where a range of one day is expressible). Then write the backend ask to
`prompts/activity-tracking/backend/U3-backend.md`.

That file is CONTRACT ONLY: the endpoints called (method, route, request shape) and the response
fields consumed, with types and nullability, in the JSON naming the frontend `fromJson` reads. State
the daily-window semantic from (2) explicitly. Nothing else — no entities, no EF or migrations, no
opinion on how aggregation is computed or stored, no index advice. The backend agent owns all of
that, and a frontend guess about someone else's schema is worse than no input.

The backend contract is open to redesign, so where the current per-source triplication makes the ask
worse, say what shape you would rather consume and let the backend decide. Cross-reference
backend/U4-backend.md if it already exists — the two overlap and should not contradict each other.

Run `npm run type-check` and `npm run lint`.
```
