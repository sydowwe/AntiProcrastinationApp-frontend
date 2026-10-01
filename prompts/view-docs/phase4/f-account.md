# Phase 4 extract — group `account`

Run as **Sonnet 5, high effort, clean context, no browser.** Can run in parallel with any other session.

```
Read prompts/view-docs/phase4/TEMPLATE-extract.md in full and follow it exactly. This message
fills in its group parameters.

- Group: `account` → write docs/data-map/account.md
- Units: 14 `user-settings`, 15 `auth`, and `_shell` (docs/views/_shell/inventory.md only; it
  has no usecase.md, and its findings are inline under "## Findings" in that file)
- Modules (DTO source): src/core/user/dto/ (the app's augmentation), and the framework's
  src/_common/modules/user/ DTOs, which own User, sessions and preferences. src/core/googleCalendar/
  has no dto/ directory: map what its api/googleCalendarApi.ts sends and receives inline.

Group-specific notes:
- This group owns the "Where a preference lives" question from CLAUDE.md. For every user
  preference field (the framework's generic ones, plus this app's askBeforeDelete and
  firstDayOfWeek from dto/userAugmentation.ts), list every module that reads it. The rule is that
  a preference read by more than one module belongs in /user/preferences. Flag any field whose
  readers contradict where it lives, in either direction.
- The app's preference reads go through src/core/user/composable/ (useUserPreferences,
  useDeleteConfirmation, useUserScopedStorage). Follow reads through those composables to the
  modules that call them. A read of `currentUser.askBeforeDelete` that bypasses them is a
  Contradiction worth recording.
- Client-side per-user storage (localStorage via useUserScopedStorage, sessionStorage-persisted
  Pinia stores) is captured data too. List each key and who reads it back, as its own entity
  "Client-side storage".
- Auth and session data (tokens, 2FA, last-used e-mail) are framework-owned. Map them, but keep
  the Summary focused on what the app could do with account data it already has.

This is a Windows machine. Use the PowerShell tool for shell commands, never Bash.
Do only this group.
```
