# X4 — group `todo`

Run as **Sonnet 5, high effort, clean context.** Run after `00-shell`.

```
Read prompts/view-docs/x4/TEMPLATE.md in full and follow it exactly. This message fills in its
group parameters.

- Group: `todo` → playwright-cli session `-s=x4-todo`
- Account: primaryUser
- Views, in this order:
    todo-lists     TodoListsView         /todo-list
    todo-lists     TodoListView          /todo-list/<id>   (id from seed.json; the list holding
                                                          the multi-count and overdue items)
    todo-routine   RoutineToDoListView   /routine-todo-list
    todo-routine   RoutineSettingsView   /routine-settings
    home           HomeView              /
- Component ownership (file shared defects once, in the owner):
    NormalTodoListItem, BaseTodoListItemSteps, the item overflow menu → todo-lists
    RoutineTodoListItem, RoutineGroupCard → todo-routine
    home's widgets (TodoListWidget, RoutineTodoWidget, DayStrip, NowBar, WidgetCard) mount the
    two above. A defect inside the item row is the owner's; a defect in the widget frame is home's.
    HistoryPieChart (on home) is historyDashboard's, and belongs to the history group. Note it
    in home's mobile block but don't file it here.

Group-specific traps:
- The overdue-renegotiation banner on /todo-list/<id> has three actions ("Today", "In a week",
  review one by one). Check all three fit and are tappable. Don't click them: they reschedule.
- The multi-count counter's +/− controls are small by design. Measure them (template §3).
- Home's widgets are a responsive grid. Record the column count at 390 px and whether the most
  important widget (the day plan / focus task) is first without scrolling.
- Home keyboard shortcuts (useHomeShortcuts) don't exist on a phone. If a capability is
  reachable ONLY through a shortcut, that's a finding.

Do only this group.
```
