# X4 — group `tracking`

Run as **Sonnet 5, high effort, clean context.** Run after `00-shell`.

```
Read prompts/view-docs/x4/TEMPLATE.md in full and follow it exactly. This message fills in its
group parameters.

- Group: `tracking` → playwright-cli session `-s=x4-tracking`
- Account: primaryUser
- Views, in this order:
    tracking-dashboards  ActivityDashboard          /activity-tracking
    tracking-dashboards  UnifiedActivityDashboard   /activity-tracking/unified
    tracking-dashboards  DesktopActivityDashboard   /activity-tracking/desktop
    tracking-dashboards  AndroidActivityDashboard   /activity-tracking/android
    tracking-settings    DesktopSettingsView        /activity-tracking/desktop/settings/<tableView>
    tracking-settings    AndroidSettingsView        /activity-tracking/android/settings/<tableView>
    (for the settings views, check both table views: distinct entries AND mappings)
- Component ownership:
    the dashboards' chart components (timeline, pie, stacked bars, top domains, focus metrics)
    → tracking-dashboards; desktop and android share most of them, so file once
    DesktopMappingsTable / AndroidMappingsTable, *DistinctEntriesTable → tracking-settings;
    the two platforms mirror each other, so file once and list both routes

Group-specific traps:
- Charts are echarts on <canvas>: see the history group's note. Judge them from the read-back
  screenshot, and eval canvas width against the container. The timeline chart is the most likely
  to be unreadable at 390 px, because it is a horizontal time axis. Say whether it scrolls,
  squashes or clips.
- The dashboards' date-range and filter controls live in the URL. Check the filter bar fits, or
  collapses into something reachable.
- Each Mappings tab opens with its Type filter on `Activity` and shows ONE row, although two
  mappings per platform are seeded. The other is under `Ignored`. That's a filter default, not a
  missing row.
- Read-only: don't create, edit or delete a mapping. The mapping dialog may be opened and
  cancelled.

Do only this group.
```
