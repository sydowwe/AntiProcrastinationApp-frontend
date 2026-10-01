# Phase 4 extract — group `leisure`

Run as **Sonnet 5, high effort, clean context, no browser.** Can run in parallel with any other session.

```
Read prompts/view-docs/phase4/TEMPLATE-extract.md in full and follow it exactly. This message
fills in its group parameters.

- Group: `leisure` → write docs/data-map/leisure.md
- Units: 11 `leisure-backlog-picker`, 12 `leisure-bucket-anchors`, 13 `leisure-projects`
- Modules (DTO source): src/core/leisure/dto/

Group-specific notes:
- The three leisure profiles (ActivityBacklogProfile, ActivityBucketListProfile,
  ActivityProjectProfile) share a base shape and each parses a NESTED `activity` object
  (response/ActivityInfo.ts). Lookups (LookupRequest/LookupFilter) are the fourth grid. B6 and B7 in
  prompts/view-docs/backend/_done/ settled this, and B7 notes that the API also sends a flat
  `activityName` which the client never reads. That is a known "server sends, client drops" row:
  confirm it rather than rediscovering it. Map the shared profile base once and each profile's own
  fields separately.
- The picker (/leisure/pick) reads profile fields to decide what to suggest. Those reads count as
  `spent`, even though nothing is displayed. Name the deciding code.
- todoList's "reward when done" pairing (pairedLeisureActivityId) points into this module. It is
  written by the todo group, but record here whether leisure itself ever reads back which items
  are paired (a cross-module read in the other direction).
- Memory anchors have their own endpoint (memory-anchor/grid, plus B12's eligible-activities
  endpoint). Map them as their own entity.

This is a Windows machine. Use the PowerShell tool for shell commands, never Bash.
Do only this group.
```
