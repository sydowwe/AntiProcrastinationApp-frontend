# U5b · Adopt the focus-metrics endpoint

- **Scope:** `src/core/activityTracking/` — 3 API modules, 2 new DTO files, `useActivityDashboard`, `ActivityFocusStrip`, both locale files
- **Backend:** already built and merged. `prompts/activity-tracking/backend/U5-backend.md` is the contract and it is now implemented, not proposed.
- **Model / effort:** Sonnet 5, medium — the contract is written and the pattern to copy is four functions away in the same file. The one place judgment is needed is how the baseline reads, and that decision is made below.
- **Depends on:** U5 (shipped)

---

```
U5 shipped fragmentation metrics computed client-side from timeline sessions. The backend has since
built the endpoint that U5's own handoff asked for, so those numbers now come from the server and the
local computation goes away. Read prompts/activity-tracking/backend/U5-backend.md first — it is the
contract, it is implemented as written, and §5 has the exact response table.

WHAT EXISTS NOW (all from the U5 commit)
- composable/focusMetrics.ts — computeFocusMetrics(), FOCUS_BLOCK_TOLERANCE_SECONDS = 120, the
  FocusMetrics/FocusBlock types.
- composable/focusMetrics.test.ts — 20 tests over that function.
- component/focusMetrics/ActivityFocusStrip.vue — the compact strip above the summary-cards row.
- useActivityDashboard.ts:277 — a `focusMetrics` computed over `primarySessions`, exposed and consumed
  by all three views.
Note activityTrackingConfig.ts no longer exists; range mode is unconditional. Do not look for a flag.

WHAT THE BACKEND BUILT
POST /activity-tracking/{web-extension|desktop|android}/focus-metrics, one per source. Both halves of
the ask: baseline comparison and multi-day ranges. Their decisions that matter here:
- focusGapSeconds is read from the request, never a server constant. Keep sending 120.
- The per-day-window rule is enforced structurally, so a block cannot span a night and the overnight
  interval is never a gap candidate.
- U3 §5 was resolved as "mean day over the lookback × DayCount". So baseline.switchCount SCALES with
  the span, baseline.longestBlockSeconds/longestGapSeconds are per-day means (UNSCALED), and
  baseline.medianSessionSeconds is the pooled lookback median (scale-free). There is no percentChange
  field and there should not be one.
- allTime is capped at 366 days.
- Desktop keys on processName but labels with productName.

DELETE THE CLIENT-SIDE COMPUTATION. This is the point of the task, so do not keep it as a fallback.
Two reasons, both decided already:
1. It disagrees with the server on desktop. focusMetrics.ts keys on the session label, and
   DesktopActivityDashboard's toTimelineSession maps productName into that field — so the local switch
   count merges exactly what the server's processName keying separates. Two definitions of one number
   on one screen is the drift this module already has too much of.
2. The baseline can only come from the server, so single-day fetches the endpoint anyway. The local
   copy buys no latency and no resilience — only a chance to disagree.
Delete focusMetrics.test.ts outright. Reduce focusMetrics.ts to FOCUS_BLOCK_TOLERANCE_SECONDS alone
(keep the file so the two import paths stay put) and rewrite its doc comment: the constant is now what
travels in focusGapSeconds, which is why the frontend still owns the number.

THE WORK

1. dto/request/FocusMetricsRequest.ts — extends ActivityRangeRequest, adds
   `baseline: BaselineType | null` and `focusGapSeconds: number`. Copy the shape of
   dto/request/SummaryCardsRequest.ts.
   ONE class for all three sources, not three. The request is byte-identical per source and the
   module's existing per-source request triplication is the thing U4 is trying to reduce — adding a
   fourth family of it moves backwards. Say so in a comment so the next person does not "fix" it.

2. dto/response/focusMetrics/FocusMetricsResponse.ts — plus FocusBlock and FocusMetricsBaseline.
   Fields and types are §5 of the backend doc; follow it, do not re-derive it. Three nullability traps
   it spells out and that will otherwise bite: longestGapSeconds is null when there is no interior gap,
   longestBlock is null on an empty span, and `baseline` is null AND each baseline.* field is
   independently nullable. static fromJson + destructuring defaults per CLAUDE.md, nested fromJson for
   the two sub-objects.

3. Three API functions — getFocusMetrics, getDesktopFocusMetrics, getAndroidFocusMetrics — in the
   three api/ modules next to the existing getSummaryCards etc. Same POST + `_silent: true` shape as
   every other dashboard call; the silent flag matters, the strip owns its own error state.

4. useActivityDashboard.ts:
   - ActivityDashboardFetchers gains
     `fetchFocusMetrics(range, baseline, signal): Promise<FocusMetricsResponse | null>`, and each of
     the three views implements it alongside its other four fetchers.
   - Replace the computed at :277 with a ref plus its own fetch round. Mirror fetchSummaryCards
     exactly, including both `if (controller === current)` guards — the one around the assignment and
     the one in `finally`. Add focusMetricsLoading / focusMetricsError and expose them, plus
     fetchFocusMetrics for the retry button.
   - Add it to the `rounds` array at :519 UNCONDITIONALLY. Do not gate it on isTimelineAvailable —
     working over a multi-day range is half of why the endpoint exists.
   - Add it to `watch(selectedBaseline, ...)` at :531 next to fetchSummaryCards, or the comparison
     goes stale the moment the user changes the baseline selector.
   - The doc comment at :268-276 currently explains why the metrics are null over a range. That is no
     longer true. Rewrite it, do not leave it.

5. ActivityFocusStrip.vue — consume FocusMetricsResponse, and add:
   - The comparison, as a neutral secondary line: the value, then the user's own recent figure.
     "87 · typically 61". NO percentage, NO arrow, NO up/down colour, no success/error class. This is
     the single constraint most likely to be lost rewriting this component: the numbers are shown
     against the user's own recent self, descriptively. A fragmentation figure rendered as a red +42%
     is a verdict on somebody's day, and this app is for people who procrastinate. Omit the line
     per-stat when that baseline field is null.
   - Remember baseline.switchCount is span-scaled but the two duration baselines are per-day means, so
     over a range they are NOT comparable to the span figure shown next to them. Either compare
     per-day on those two, or omit the comparison there. Do not print a per-day mean beside a span
     total as if they were the same quantity.
   - A per-day figure over multi-day spans, off daysWithActivity: keep the span total as the value and
     put the per-day figure in the detail line. "87 switches" over a week is not a number anyone reads.
   - Its own error + retry state, copying the error block in ActivitySummaryCards.vue (the
     common.loadFailed / common.retry keys already exist).
   - Keep the existing tolerance tooltip.

6. Locales — activityTracking.focus.* already holds title/switches/longestBlock/medianSession/
   longestBreak and their *Hint keys plus sessionCount. Add what the comparison and per-day lines need.
   SK primary, Write/Edit only (diacritics — see the encoding rule in the global CLAUDE.md). Slovak has
   three plural forms and this locale registers no pluralization rule, so keep counted strings in the
   "Relácie: {count}" shape rather than "z {count} relácií", which is wrong at count 1. There is
   already a comment saying this above focus.sessionCount.

7. Add a "Frontend status" line to the top of backend/U5-backend.md saying it is implemented and
   consumed, the way U3-backend.md carries one. Do not rewrite the contract itself.

OUT OF SCOPE, deliberately — do not chase either:
- The android TotalSeconds bug the backend found (AndroidTimelineEndpoint.cs:47 repeats a whole-day
  per-label total on every session, so the timeline tooltip's "Active time" is wrong on android). It is
  theirs, it is filed, and it does not touch these metrics.
- The median stays on durationSeconds. The backend confirmed durationSeconds is wall-clock and
  totalSeconds is tracked activity within it, on all three sources. That question is closed.

Run npm run type-check and npm run lint. The type-check baseline is app-side only and drifts — measure
it on a clean tree before quoting a delta rather than trusting the number in CLAUDE.md. npm run
test:unit reports 3 failing FILES (e2e/tests/*.spec.ts); that is pre-existing, vitest's default glob
picks up the Playwright specs and cannot collect them. Deleting focusMetrics.test.ts should drop the
suite from 64 tests to 44, all passing.
```
