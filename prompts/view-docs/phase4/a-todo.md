# Phase 4 extract — group `todo`

Run as **Sonnet 5, high effort, clean context, no browser.** Can run in parallel with any other session.

```
Read prompts/view-docs/phase4/TEMPLATE-extract.md in full and follow it exactly. This message
fills in its group parameters.

- Group: `todo` → write docs/data-map/todo.md
- Units: 09 `todo-lists`, 10 `todo-routine`, 01 `home`
- Modules (DTO source): src/core/todoList/dto/
- Reader-only module: src/core/home/ has no DTOs of its own. It is the app's biggest cross-module
  reader. Map what it reads (composable/useTodayPlan.ts, useDashboardRefresh.ts, useTaskTracker.ts,
  linkedTodoItemSync.ts, and the widgets) into the "Cross-module reads" table, against the owning
  module's field names. Fields home reads from dayPlanner or activityHistory belong in that table,
  even though those modules' own entity tables are written by other groups.

Group-specific notes:
- Normal and routine items share one entity family and the undoable-CRUD composable
  (useUndoableListCrud). Map the shared fields once and mark which fields are routine-only
  (period, streak and so on) rather than duplicating the table.
- todo-lists' usecase.md already corrected itself once: `note` IS read inline. Trust the
  correction, and check the other two claims in that section (suggestedTime and
  pairedLeisureActivityId) the same way.
- The calibration aggregate (estimate vs actual) is read through useEstimateCalibration from
  activityHistory's api/ + dto/. That is a cross-module read. Record it.

This is a Windows machine. Use the PowerShell tool for shell commands, never Bash.
Do only this group.
```
