# U6 · Empty states that say something useful

- **Scope:** all three dashboards
- **Backend:** none
- **Model / effort:** Sonnet 5, low–medium effort — small code, but the copy is the deliverable
- **Depends on:** R3 (soft — if R3 has not run, you are adding the module's first real locale keys)

---

```
Every empty state in src/core/activityTracking/ is the same dead-end sentence: "No activity recorded
for this period". It appears in component/pieChart/ActivityPieChartSection.vue,
component/android/AndroidPieChartSection.vue, component/desktop/DesktopPieChartSection.vue and
component/summaryCards/ActivitySummaryCards.vue. It is also indistinguishable across three very
different situations:

  (a) the tracker for this source has never sent anything — the browser extension is not installed,
      the desktop agent is not running, the Android app is not connected;
  (b) the tracker works, but this particular date has no data (a day off, or before the user
      started using it);
  (c) the tracker works and the date has data, but the selected time window excludes all of it —
      the default window is 07:00-00:00, so anything logged between midnight and 7am is invisible
      and the dashboard looks empty for no visible reason.

(c) is the interesting one: it is a dead end the user cannot diagnose, caused by a default they
never chose.

Distinguish these on the frontend with what is already available — do not ask the backend for a
"tracker connected" flag; U4 may make that question moot, and it is not needed for the main win.

- For (c): when the requested window returns nothing, re-request the same date over the full
  00:00-24:00 range. If *that* has data, say so and offer a one-click "show the whole day" that
  widens the time range. This is the highest-value part of this prompt; do it first. Fire this probe
  only on an empty result, never speculatively.
- For (b): when the full day is also empty, say the day is empty rather than implying something is
  broken, and offer to jump to the most recent day that does have data if you can determine one
  cheaply. If you cannot without a new endpoint, skip that affordance rather than inventing one.
- For (a): if a source has returned nothing at all across the probe, add a quiet secondary line
  pointing at that source's settings page (routes `desktopSettings` / `androidSettings` exist in
  activityTracking.routes.ts; the web-extension source has no settings route — do not fabricate a
  link for it).

Consolidate the four duplicated empty-state blocks into one component under
component/ rather than editing the same markup four times.

Tone: neutral and factual. This app is for people who procrastinate; an empty tracking day should
read as information, never as a reprimand. No streak language, no "you were unproductive", no
guilt. Write the SK copy first (SK is primary) and let EN follow it.

Strings in _locales/activityTracking.{sk,en}.ts — use Write/Edit only, never a shell round-trip
(the SK copy has diacritics; see the encoding rule in the global CLAUDE.md).

Run `npm run type-check` and `npm run lint`, and verify all three branches by picking a date with no
data, a date whose data sits entirely before 07:00, and a normal date.
```
