# R1 · Correctness sweep

- **Scope:** whole module
- **Backend:** none
- **Model / effort:** Sonnet 5, low effort — every item is a verified, located defect; no design judgment needed
- **Run first.** Nothing else in this set depends on it, but it is the cheapest prompt here and it removes noise the later prompts would otherwise carry forward.

---

```
Fix the following verified defects in src/core/activityTracking/. Each one is located; do not
go hunting for more, and do not refactor anything structural — R2 does that.

1. src/core/activityTracking/view/ActivityDashboard.vue:137
   `const date = ref<Date>(new Date('02-08-2026'))` — a hardcoded date left over from
   debugging, so the web-extension dashboard always opens on a fixed day. The other two
   dashboards (DesktopActivityDashboard.vue:140, AndroidActivityDashboard.vue:139) correctly
   use `new Date()`. Make this one match.

2. src/core/activityTracking/api/activityTrackingApi.ts:32 and :34
   Two `console.log('[DEBUG] ...')` calls inside `getTimeline`, one of which runs
   `JSON.stringify(data, null, 2)` over the entire timeline response on every fetch. Delete
   both lines and the now-pointless `parsed` local (return `TimelineResponse.fromJson(data)`
   directly).

3. src/core/activityTracking/view/DesktopActivityDashboard.vue:263-268
   A local `formatDateForApi(d: Date)` shadowing the identical exported one in
   `@/_common/utils/DateTimeHelper.ts`. ActivityDashboard.vue and AndroidActivityDashboard.vue
   both already import the shared one. Delete the local copy and import it.

4. src/core/activityTracking/view/ActivityDashboard.vue
   `pieChartLoading` is declared and set by `fetchPieChart()` but never read — the template
   binds `:loading="topDomainsLoading"` on `<ActivityPieChartSection>` (line 98), so the pie
   chart's skeleton is driven by the summary-cards request instead of its own. Bind
   `pieChartLoading`. (DesktopActivityDashboard.vue:99 already does this correctly; use it as
   the reference.)

5. Dead files — both are unreferenced anywhere in src/:
   - src/core/activityTracking/component/desktop/desktopSettings/IgnoredProcessesTable.vue (313 lines)
   - src/core/activityTracking/component/desktop/desktopSettings/RoleCategoryForm.vue (73 lines)
   Confirm with a repo-wide search for each filename and component tag before deleting. If a
   search turns up a reference I missed, leave that file alone and say so instead of deleting.

6. src/core/activityTracking/view/AndroidSettingsView.vue
   The `import` statements are interleaved into the middle of `<script setup>` — `HINT_KEY`,
   `hintDismissed` and `dismissHint()` sit above a second block of imports. Move all imports
   to the top of the block. Behaviour must not change.

Run `npm run type-check` and `npm run lint` (see CLAUDE.md for the honest baseline — do not
report a delta against a number you did not measure yourself before the change).
```
