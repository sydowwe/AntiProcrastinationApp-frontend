# H5 · Localize both modules

- **Scope:** activityHistory + historyDashboard
- **Backend:** none
- **Model / effort:** Sonnet 5, medium–high — mechanical in shape, but the SK translations and the key hierarchy are judgment, and one missed namespace collision silently blanks a whole section of the app.
- **Depends on:** H2 (don't translate strings you're about to delete), H3, H4 (strings should land in their final file)
- **Unblocks:** nothing

---

```
Both modules are almost entirely hardcoded English. src/core/activityHistory/_locales/
activityHistory.{sk,en}.ts has exactly three keys; src/core/historyDashboard/ has no _locales
directory at all. Every user-facing string in both must go through vue-i18n. SK is primary, EN is
the fallback — write real Slovak, not English placeholders.

--- Setup ---

1. Create src/core/historyDashboard/_locales/historyDashboard.{sk,en}.ts and spread both into
   src/locales/SK.ts and src/locales/EN.ts. READ THE COMMENT AT THE TOP OF SK.ts FIRST: the spread is
   shallow, so a top-level namespace that collides with an existing one is replaced wholesale, not
   merged. Pick a namespace that collides with nothing (check `history` — activityHistory already
   owns it — and check the framework's `common`).
2. Extend the existing activityHistory locale files rather than replacing them.

--- Strings to localize ---

activityHistory/view/
  HistorySummaryView.vue    "Activity History", "Day from"
  HistoryDetailView.vue     "History Detail", "Stacked Bars", "Timeline", "Date"
  HistoryCalendarView.vue   "{n} sessions" (needs a plural rule — SK has three forms:
                            1 relácia / 2-4 relácie / 5+ relácií), "No activity"
  PomodoroTimerView.vue     "Pomodoro Timer", "Defaults", and the whole notification block at
                            lines 446-470 and 520-530: "Cycle {n}/{m}", "Focus {n}/{m}",
                            "Focus ended!", "Time for a break", "Focus period ended",
                            "Short break ended", "Time to focus on {activity}!", "Long break ended",
                            "Cycle {n} complete. Time for cycle {m}!", "Pomodoro complete!",
                            "{n} cycle(s) done! Focused on {activity} for {duration}",
                            ", rested with {activity}". Note the existing English pluralisation
                            hack `cycle${n > 1 ? 's' : ''}` — replace it with a proper i18n plural.
  TimerView.vue             "Please set a timer duration", "Timer ended!", "Timer ended",
                            "Your timer for {activity} ended it ran for {duration}" (also fix that
                            sentence — it is missing punctuation in English)

historyDashboard/component/
  HistoryTimeline.vue       "Delete confirmation", "Are you sure you want to delete this activity
                            history record?", "Edit Activity History". Prefer the framework's
                            `confirm()` from @/_common/composable/general/useDialog.ts over the local
                            MyDialog + boolean-ref pattern here — it already handles the localized
                            default buttons. Keep the userStore.currentUser.askBeforeDelete bypass.
  HistorySummaryCards.vue   "Top {group}" plus the groupByLabel switch
                            ("Activities"/"Roles"/"Categories" — key these off the HistoryGroupBy
                            enum values), "Compared to", "Show", "No data for this period",
                            and the four BaselineOption titles ("Last 7 days", "Last 30 days",
                            "Same weekday", "All time")
  HistorySummaryCard.vue    "Total", "NEW", and the `View details for {name}` aria-label
  HistoryPieChartSection.vue "No data for this period", "Total time:", "Entries:", "Total entries:",
                            "Unique groups:", "Period Totals"
  HistoryDateRangeSelector.vue "Range length", "From", "To", and the seven rangeTypeItems titles
                            ("3 days", "7 days", "2 weeks", "Month", "3 months", "Year",
                            "Custom range")
  HistoryGroupBySelector.vue, HistoryPeriodBanner.vue, HistoryPieChart.vue — sweep these too, I have
                            not enumerated them.

--- Two collisions to handle deliberately ---

1. The four baseline titles are ALSO hardcoded in src/core/activityTracking (see
   prompts/activity-tracking/R3-i18n-pass.md, which localizes them there). Check whether R3 has
   already landed. If it has, reuse its keys — do not create a second set. If it has not, put these
   keys somewhere both modules can legally read (src/locales/common.{sk,en}.ts, not inside either
   module's namespace) and add a line to prompts/activity-tracking/R3-i18n-pass.md saying the keys
   already exist.
2. BaselineOption and the rangeTypeItems build their titles at module scope, outside any component.
   `useI18n()` cannot be called there. Convert both to `computed()` inside the component, or to a
   small composable in the owning module — mirror
   @/_common/composable/general/useDayOfWeekOptions.ts, which solves exactly this shape and returns a
   ComputedRef of {value, label}.

--- Rules ---

- Every string goes through `$t` in templates / `t()` in script. No `?? 'English fallback'`.
- Interpolate, never concatenate: `t('x.y', { activity, duration })`.
- Do not change any layout, colour or component structure. This is a text pass.
- If a string is genuinely internal (a console message, a DTO field name), leave it.

Verify: switch the app to SK and walk every route in activityHistory.routes.ts plus the calendar and
detail views; nothing may render a raw key or an English word. Then switch to EN and repeat.
Run `npm run type-check` and `npm run lint`.
```
