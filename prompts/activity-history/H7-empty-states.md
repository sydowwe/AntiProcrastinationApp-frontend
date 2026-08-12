# H7 · Empty states and the first-run path

- **Scope:** activityHistory + historyDashboard
- **Backend:** none
- **Model / effort:** Sonnet 5, low–medium — small surface, but the copy is user-facing and must not scold. Bump to high if the SK copy comes back stilted.
- **Depends on:** H5 (write the strings straight into the locale files; do not add English and translate later)
- **Unblocks:** nothing

---

```
The history module has three different responses to "no data", and one of them is nothing at all.

Current state:
- HistorySummaryCards.vue:48-58 — a chart icon and "No data for this period". Fine.
- HistoryPieChartSection.vue:14-23 — a pie icon and "No data for this period". Fine.
- HistoryTimeline.vue — renders an empty VRow. Nothing. No icon, no text, no explanation.
- StackedBarsChart — check what it does with an empty `windows` array.
- HistoryCalendarView — per-cell "No activity" exists, but a month with zero records is a grid of
  identical grey cells with no explanation.

Two distinct situations are being collapsed into one message, and they need different answers:

  (a) "You have history, just not in this window." → the current message is right. Add the useful
      part: offer the nearest range that does have data, or at minimum say which range is being
      shown. A user who lands on a 3-day window over a weekend should not conclude the app lost
      their data.

  (b) "You have never recorded anything." → a first-run user currently sees three empty boxes and no
      idea what to do. This is the one that matters. Show a single onboarding state instead of three
      separate empty cards, and route them out of it: the module already has a timer
      (name: 'timer'), a stopwatch (name: 'stopwatch'), a pomodoro (name: 'pomodoroTimer') and a
      manual entry form (name: 'activityHistoryManual') — see activityHistory.routes.ts. Link to
      them. Manual entry is the right primary action for someone with existing habits; the timer is
      right for someone starting now.

Distinguishing (a) from (b) without a new endpoint: the summary-cards response over the widest
available range, or a single all-time request, tells you whether any history exists at all. Pick the
cheapest signal that does not add a request to the common path — one extra request fired only when
the current period comes back empty is acceptable; one fired on every load is not.

Also:
- Give HistoryTimeline a real empty state matching the other two (icon + message), and a loading
  skeleton — H1 adds its loading ref.
- The three empty states should look like one thing. If the same icon+text+action block appears
  three times, make it a small local component in historyDashboard/component/ rather than a third copy.
  Check @/_common/component/feedback/ first — InfoCard or SubtleCard may already be the right base.

Tone: this is an anti-procrastination app whose users open it to face their own data. "No data for
this period" is fine. "You haven't tracked anything yet" is fine. Anything that reads as
disappointment in the user is not — no "you've been idle", no streak-shaming, no exclamation marks.
Keep it to one sentence plus an action.

Do NOT: add illustrations or SVG assets, add a dismissible tour or tooltip walkthrough, or change
the populated-state layout.

Verify: with a fresh account (or by pointing the range at a period you know is empty), load the
summary, detail, calendar and timeline. Then confirm the populated views are pixel-identical to
before. Run `npm run type-check` and `npm run lint`.
```
