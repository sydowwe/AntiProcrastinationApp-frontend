# X4 — group `planner`

Run as **Sonnet 5, high effort, clean context.** Run after `00-shell`. The biggest group (8 views + 3 tabs). If
the session gets long, split it in two: finish the planner-day views, then start a fresh session with this same
file, told to begin at planner-templates. Both write to the same files, which is safe.

```
Read prompts/view-docs/x4/TEMPLATE.md in full and follow it exactly. This message fills in its
group parameters.

- Group: `planner` → playwright-cli session `-s=x4-planner`
- Account: primaryUser
- Views, in this order:
    planner-day        PlannerCalendarView       /day-planner
    planner-day        DayPlannerView            /day-planner/<dd-MM-yyyy of seed.seedDateUtc>
    planner-day        PlannerTaskLinkView       /day-planner/task/<id from seed.json>
    planner-day        DayPlannerSettingsView    /day-planner/settings  (every tab)
    planner-templates  TemplateListView          /day-planner/templates
    planner-templates  TemplateSplitView         /day-planner/templates/split
    planner-templates  TemplateDayPlannerView    /day-planner/templates/<seed.dayPlannerTemplates id>
    activity-settings  ActivitySettingsView      /activity-settings/activities, /roles, /categories
- Component ownership:
    DayPlanner.vue, the side panels, SelectionActionBar / BulkSelectActionBar → planner-day
    (TemplateDayPlannerView mounts the same DayPlanner, so a grid defect is planner-day's)
    CalendarGrid (on /day-planner) is FRAMEWORK: tag [framework]
    ActivityTable / ActivityRoleTable / ActivityCategoryTable → activity-settings; the table
    component underneath them is framework

Group-specific traps:
- The :date param is dd-MM-yyyy, NOT ISO. An ISO date 400s and silently shows a neighbouring day.
  Build it from seed.seedDateUtc.
- This group is the one the X4 pass was unblocked for. DayPlannerView's Day Details panel has a
  mobile-only toggle (`v-show="panelOpen || mdAndUp"`), and e2e/tests/dayPlanner.spec.ts has two
  test.fixme stubs waiting for its locator ("toggle button hides/restores the Day Details
  panel"). Document the toggle's exact locator and its open/closed states in the mobile block.
  Opening and closing a panel isn't a mutation.
- The day grid is a time-by-row canvas of tasks. At 390 px check that task blocks remain
  readable (title visible, not a sliver) and that tapping one selects it, rather than the tap
  starting a drag. Selecting is read-only. Don't drag and don't use the selection bar's actions.
- TemplateSplitView compares two templates side by side. Record whether it stacks at 390 px or
  scrolls sideways, and whether that's usable.
- activity-settings has three tabs of data tables. Tables scroll sideways by design; the
  question is whether the row actions (edit, delete, merge) are reachable, and whether the tab
  bar itself fits.

Do only this group.
```
