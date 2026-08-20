# U4 · One picture of the day, across all three trackers

- **Scope:** new view + the DTO tree
- **Backend:** yes — emits `backend/U4-backend.md`. This is the largest backend ask in the set.
- **Model / effort:** Opus 5, high effort — this is a data-modelling and contract-design problem, and the frontend part is the smaller half
- **Depends on:** R2, R5

---

```
The app tracks three sources — browser extension, desktop agent, Android — and shows each in its own
dashboard at /activity-tracking, /activity-tracking/desktop and /activity-tracking/android. There is
no view of a day as it was actually lived. A user who read documentation in Chrome, wrote code in an
IDE and then scrolled their phone has to open three pages and add up by eye, and because the sources
overlap in wall-clock time, the sum is not even meaningful without a rule for what counts when two
trackers claim the same minute.

That gap is the whole point of this prompt. The three dashboards stay exactly as they are — this
adds a fourth view, it does not replace them.

THE HARD PART IS OVERLAP, NOT LAYOUT. Solve it before writing UI:
- Desktop and web overlap constantly: time in Chrome is logged by the desktop agent as the Chrome
  process AND by the extension as a domain. Double-counting it inflates every total.
- Android is largely disjoint in practice but not guaranteed to be — a phone can be used while the
  desktop is idle-but-recording.
- Sources have different notions of "active" vs "background": the web and desktop DTOs carry
  `activeSeconds` + `backgroundSeconds`, android carries a single `seconds` (see AndroidWindowApp,
  AndroidAppSummaryDto — the android dashboard already hardcodes `backgroundSeconds: 0`).
Decide and state a precedence rule (a defensible default: the more specific source wins for a given
interval, so the extension's domain supersedes the desktop's browser process). Whatever you choose,
the UI must make the resolution visible — a user seeing a merged total needs to be able to tell that
their Chrome time was attributed to the extension, not silently halved.

FRONTEND, once the rule is settled:
- A new route and view showing the merged day: one timeline with a lane per source, one pie, one set
  of summary cards, with a per-source filter that can toggle any source out.
- Reuse the shared components as they stand — component/timeline/ActivityTimeline.vue,
  component/stackedBars/StackedBarsChart.vue, component/summaryCards/ActivitySummaryCards.vue and
  component/pieChart/ActivityPieChart.vue are already source-agnostic; they consume
  TimelineSessionDto, StackedBarsInputWindow, SummaryCardsData and PieSegment respectively. Do not
  fork them.
- Colour: `getDomainColor()` from @/_common/utils/domainColor.ts is currently fed a different field
  per source (domain / processName / packageName). Merged, the same underlying app can get two
  colours. Resolve it.
- Nav: add the entry to src/app/nav/navItems.ts with a `navigation.*` key in BOTH common.sk.ts and
  common.en.ts, per CLAUDE.md.

BACKEND. This cannot be done client-side by firing three requests and merging in the browser —
overlap resolution needs the raw intervals, and doing it in the client means shipping three full
payloads to compute one. It needs a real endpoint.

The .NET solution is not in this repo. Do all the frontend work that stands on its own — the view,
the merge/precedence design, the source filter, the colour resolution, wired against a shape you
define — then write the backend ask to `prompts/activity-tracking/backend/U4-backend.md`.

CONTRACT ONLY, as with every backend file in this set: endpoint (method, route, request shape) and
the response fields consumed, with types and nullability, in the JSON naming your `fromJson` reads.
State the precedence rule as a *requirement on the response* ("intervals are already
de-overlapped; each returned interval is attributed to exactly one source") rather than as an
instruction about how to compute it. No entities, no migrations, no storage opinions.

One thing you SHOULD say in that file, because only the frontend can speak to it with authority: the
current per-source contract is triplicated for no benefit. Three request families
(PieChartRequest / DesktopPieChartRequest / AndroidPieChartRequest) are structurally identical, and
three response families differ only in one label field (`domain` / `productName` / `appLabel`) plus
android's missing `backgroundSeconds`. The backend is open to redesign here, so propose collapsing
them to one source-parameterized family with a common shape — as a proposal with the frontend's
reasoning, leaving the decision to the backend agent. If that lands, roughly 40 DTO files in
src/core/activityTracking/dto/ collapse. Do not delete any of them pre-emptively in this run.

Cross-reference backend/U3-backend.md if it exists; the range question and the unified question hit
the same endpoints and the two files must not contradict each other.

Run `npm run type-check` and `npm run lint`.
```
