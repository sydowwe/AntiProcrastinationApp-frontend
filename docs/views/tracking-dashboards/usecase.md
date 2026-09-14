# tracking-dashboards — use cases

## What this unit is for
Shows the user what they were actually doing on their computer and phone, as observed passively by three
trackers (browser extension, desktop agent, Android app), broken down by time-of-day, by domain/process/app,
and by shape (switching, focus blocks, gaps). It answers "what did I do" after the fact — it does not let the
user plan or log anything; see [glossary.md](../glossary.md)'s "Tracking vocabulary" section for how this
differs from `Activity`/`ActivityHistory`.

## Where it sits
Reached from the sidebar's "Web tracking" group (`Web tracking`, `All sources`, `Desktop tracking`,
`Android tracking`, plus the two settings entries covered by unit 6). A user typically arrives here after a
day of work, or when reviewing where time went before planning the next day. `Desktop settings` /
`Android settings` (mapping raw processes/apps to labels) are unit 6, out of this unit's scope. Nothing here
writes to any other module — it is read-only observation.

## Views

### ActivityDashboard (`/activity-tracking`)
**Purpose:** The web-extension (browser) tracker's dashboard — domains visited, time-of-day shape.
**Who opens it and why:** Someone wants to see which sites ate their day, or check a focus block against a
memory of "I was heads-down in docs all morning".

**What the user can do**
- Pick a date range via presets (Today / Last 7 days / This week / Last 30 days / Custom) or type exact dates
- Narrow the time-of-day window with a start time and an h/min duration (default 07:00, 17h = 07:00–00:00)
- Switch between a stacked-bars view and a session timeline (timeline only available for a single day)
- Toggle the timeline between one merged lane and a time-split two-row layout
- Click a domain card or pie slice to drill into that domain's active/background split and page list
- Compare each domain's time against a baseline (Last 7 days / Last 30 days / Same weekday / All time)
- Retry any one panel independently if its fetch failed

**What the user can see, and the question it answers**
- Activity Timeline — answers "when, in what order, did I visit these domains"
- Stacked bars (multi-day) — answers "which domain dominated each block of the week"
- Shape of the day strip — answers "was this a focused day or a scattered one" (switches, longest block,
  typical session, longest break), each against the user's own recent typical figure — see
  [prompts/_done/activity-tracking/U5-fragmentation-metrics.md](../../../prompts/_done/activity-tracking/U5-fragmentation-metrics.md)
  and its follow-up U5b, which moved the computation server-side
- Top Domains cards — answers "where did the time actually go", each with a volume comparison against the
  selected baseline
- Pie chart + detail panel — answers "what share of the day was this domain" and, once a domain is selected,
  "what pages, and how many entries"

**Depends on:** account locale (EN confirmed), nothing from `askBeforeDelete` or similar preferences — this
view has no destructive actions. Seeded activity in this environment is a single, identical day repeated
across dates: `github.com`, `chatgpt.com`, `youtube.com`, `docs.microsoft.com`, `reddit.com`.

### UnifiedActivityDashboard (`/activity-tracking/unified`)
**Purpose:** A fourth dashboard, not a replacement for the three per-source ones — merges all three trackers
into one picture of the day, with an explicit overlap-resolution rule so the same wall-clock minute is never
double-counted. See
[U4-unified-source.md](../../../prompts/_done/activity-tracking/U4-unified-source.md).
**Who opens it and why:** Someone who used several devices in one day and wants one total rather than adding
up three dashboards by hand.

**What the user can do**
- Everything the per-source dashboards offer (range, window, visualization, baseline), plus:
- Toggle any of the three sources out of the merge via the source filter chips — this re-requests the server
  rather than filtering client-side, because turning a source off hands its overlapping minutes back to
  whichever source remains

**What the user can see, and the question it answers**
- Source breakdown panel (`ActivitySourceFilter`) — answers "how much of the merged total did each tracker
  actually contribute, and how much was reassigned by the overlap rule"
- Everything else mirrors the per-source dashboards, merged: one timeline (a lane per source), one pie, one
  set of summary cards, one shape-of-the-day strip

**Depends on:** the same three trackers as the per-source dashboards; a source with nothing recorded simply
contributes nothing to the merge rather than showing its own empty state.

### DesktopActivityDashboard (`/activity-tracking/desktop`)
**Purpose:** The desktop agent's dashboard — processes/products used, keyed on `processName`, labelled with
`productName`.
**Who opens it and why:** Same as the web dashboard, for native-app time rather than browser time.

**What the user can do**
- Everything the web dashboard offers, plus:
- Drill into a process for a server-fetched detail panel (window titles, entries) — a genuine extra round
  trip (`getDesktopProcessDetails`), not a client-side re-slice of data already on the page
- Jump to `Desktop settings` (the mapping table) directly from the Top Domains card header

**What the user can see, and the question it answers**
- Same surfaces as the web dashboard, with "Domains" reframed as "Processes"/"Products" throughout

**Depends on:** the desktop agent having sent data at all — see the empty-state section below.

### AndroidActivityDashboard (`/activity-tracking/android`)
**Purpose:** The Android tracker's dashboard — apps used, keyed on `packageName`, labelled with `appLabel`.
**Who opens it and why:** Same as the other two, for phone time.

**What the user can do**
- Everything the web dashboard offers, except drilling into a selected app: clicking a pie slice or a card
  highlights it but opens no per-app detail panel (see Findings — this is a capability gap against the other
  two dashboards, not a deliberate simplification the source's data shape would force)
- Jump to `Android settings` from the Top Domains card header

**What the user can see, and the question it answers**
- Same surfaces as the other two, with "Apps" in place of "Domains"/"Processes". Android has no background
  lane — `backgroundSeconds` is hardcoded to `0` client-side (`AndroidStackedBarsWindow` mapping), because the
  source DTO carries a single `seconds` figure with no active/background split.

**Depends on:** the Android app having sent data at all.

## Entity lifecycle
There is no entity to create, edit or delete here — every dashboard is a read view over server-aggregated
tracker data. The nearest thing to a lifecycle is a tracked session's *classification*, which lives in unit 6
(`Desktop settings` / `Android settings` — mapping raw processes/apps/domains to a label or ignoring them).

## Data this unit captures but does not spend
- `DayTotals.totalVisits` (`dto/response/pieChart/DayTotals.ts`) is fetched and typed but is `undefined` in
  this environment's seed data, rendering as a bare "-" in the Day Total panel — the frontend already has a
  home for it (`activityTracking.common.entries`-style row), the field itself is just never populated here.
- Per-page detail (`DomainDetailsResponse`, the `pages` list behind a selected web domain) is fetched but only
  ever shown as a flat list — nothing elsewhere in the app reads a page URL back out.
