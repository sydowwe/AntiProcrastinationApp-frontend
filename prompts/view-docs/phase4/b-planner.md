# Phase 4 extract — group `planner`

Run as **Sonnet 5, high effort, clean context, no browser.** Can run in parallel with any other session.

```
Read prompts/view-docs/phase4/TEMPLATE-extract.md in full and follow it exactly. This message
fills in its group parameters.

- Group: `planner` → write docs/data-map/planner.md
- Units: 07 `planner-day`, 08 `planner-templates`, 02 `activity-settings`
- Modules (DTO source): src/core/dayPlanner/dto/, src/core/activity/dto/

Group-specific notes:
- `activity` is the most widely read entity in the app. Its "read in" column will be long.
  Summarise cross-module readers by module (todoList, activityHistory, leisure, activityTracking,
  home) with one representative file each, rather than listing every call site.
- Planner tasks come in three flavours that share fields: normal day tasks, template tasks and
  repeating tasks. Map the shared fields once and mark which flavour owns the rest.
- The planner's own settings (PUT planner/settings, api/plannerSettingsApi.ts) are a
  module-scoped preference system. Map its fields too. CLAUDE.md's "Where a preference lives"
  explains why they live there and not in /user/preferences.
- Skip reasons and skip insights (C1, recently shipped) are new. Check whether
  B26-planner-task-skip-reason-never-written.md in prompts/view-docs/backend/_done/ changed
  what is actually written before you classify those fields.
- The client never calls GET /task-planner-day-template/suggestions/{calendarId}, although it
  exists (UNIT-ORDER history, unit 07). If the backend response type is locatable, record it
  under "Server sends, client drops" as a whole endpoint the client does not use.

This is a Windows machine. Use the PowerShell tool for shell commands, never Bash.
Do only this group.
```
