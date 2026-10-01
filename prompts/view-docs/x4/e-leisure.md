# X4 — group `leisure`

Run as **Sonnet 5, high effort, clean context.** Run after `00-shell`.

```
Read prompts/view-docs/x4/TEMPLATE.md in full and follow it exactly. This message fills in its
group parameters.

- Group: `leisure` → playwright-cli session `-s=x4-leisure`
- Account: primaryUser
- Views, in this order:
    leisure-backlog-picker  BacklogView        /leisure/backlog
    leisure-backlog-picker  PickerView         /leisure/pick
    leisure-bucket-anchors  BucketListView     /leisure/bucket-list
    leisure-bucket-anchors  MemoryAnchorsView  /leisure/memory-anchors
    leisure-projects        ProjectsView       /leisure/projects  (board mode AND ?view=table)
- Component ownership:
    BacklogTable → leisure-backlog-picker; BucketListTable, MemoryAnchorTable →
    leisure-bucket-anchors; ProjectTable and the project board → leisure-projects.
    All four tables sit on the framework table. A defect in the table itself is [framework],
    filed once (check whether the planner or tracking group already filed it).

Group-specific traps:
- ProjectsView's board mode is a multi-column kanban. At 390 px record whether the columns stack,
  scroll sideways or squash, and whether a card's content (title, activity name) stays readable.
  Dragging cards between columns is a mutation: don't.
- The picker (/leisure/pick) is the view most likely to be used on a phone ("what do I do now?").
  Its main suggestion and its accept/skip controls must be on screen without scrolling. Judge it
  with that in mind. Don't accept or commit a suggestion: that writes.
- Opening a create dialog to look at it is fine, and every one of these views has one. Selects
  inside dialogs can't be opened by role (CLAUDE.md, "Opening a VIdSelect"). Use the label-text
  or `.v-field__input` locator.

Do only this group.
```
