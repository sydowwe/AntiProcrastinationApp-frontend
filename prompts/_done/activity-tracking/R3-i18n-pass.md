# R3 · Localize the module

- **Scope:** whole module
- **Backend:** none
- **Model / effort:** Sonnet 5, medium effort — mechanical in shape, but it is ~60 strings across 20 files and the SK translations have to be right
- **Depends on:** R2 (do it after, or you localize the same header three times)

---

```
src/core/activityTracking/ is effectively unlocalized. Its two locale files
(_locales/activityTracking.{sk,en}.ts) contain exactly two keys:

    tracker: { stackedBars, timeline }

and `$t(` appears in only one live file in the whole module (view/ActivityDashboard.vue, twice).
Every other user-facing string is a hardcoded English literal, in an app where SK is the primary
locale and EN is the fallback. Fix that.

Strings to move, non-exhaustive but covering the bulk:
- The three dashboard titles: "Activity Dashboard", "Desktop Activity", "Android Activity",
  and the "Date" input label.
- The "Stacked Bars" / "Timeline" toggle labels in DesktopActivityDashboard.vue and
  AndroidActivityDashboard.vue — ActivityDashboard.vue already uses `$t('tracker.stackedBars')`
  and `$t('tracker.timeline')` for the same two buttons. Reuse those keys, do not add new ones.
- component/summaryCards/ActivitySummaryCards.vue: the "Compared to" VSelect label, the
  `title = 'Top Domains'` prop default, and the "No activity recorded for this period" empty
  state. The per-view titles "Top Processes" / "Top Apps" are passed from the views as literals.
- The four baseline titles ("Last 7 days", "Last 30 days", "Same weekday", "All time"). These
  are constructed as `new BaselineOption(BaselineType.X, 'literal')`. Note BaselineType's *values*
  ('last7days', …) are the API contract — localize the title only, never the enum value.
- The pie-chart sections' "No activity recorded for this period", "Total time:", "Apps:",
  "Sessions:" and their desktop/web equivalents in component/pieChart/,
  component/android/AndroidPieChartSection.vue, component/desktop/DesktopPieChartSection.vue,
  component/pieChart/ActivityDetailsPanel.vue, DomainDetailsList.vue.
- Both settings views: "Distinct Process Entries" / "Distinct App Entries", the "Distinct
  entries" / "Mappings" toggle labels, and the multi-sentence `VAlert` hint paragraph — which is
  duplicated verbatim between DesktopSettingsView.vue and AndroidSettingsView.vue and contains
  inline `<strong>` markup. Use one shared key with i18n interpolation or a slot-based rendering;
  do not ship two copies of the same paragraph.
- `showErrorSnackbar('Failed to save mapping')` in both settings views.
- The settings tables, filter bars and actions under component/{desktop,android}/*Settings/ —
  column headers, button labels, placeholders.

Rules:
- Namespace everything under the module's existing top-level `activityTracking` object. Read the
  comment at the top of src/locales/SK.ts first: the aggregator spread is SHALLOW, so a colliding
  top-level namespace is replaced wholesale rather than merged.
- Keep the existing `tracker.*` keys where they are so ActivityDashboard.vue keeps working.
- SK is primary and must be a real translation, not English text in the SK file. EN is the fallback.
- Write the locale files with the Write/Edit tools only. Never round-trip them through the shell —
  see the encoding rule in the global CLAUDE.md; these files contain diacritics and a shell
  round-trip will double-encode every one of them.

Do not restructure any component while you are in it. Run `npm run type-check` and `npm run lint`,
then load each of the five routes under /activity-tracking in both languages and confirm no key
renders as its raw path.
```
