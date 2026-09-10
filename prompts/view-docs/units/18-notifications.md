# Unit 18 — notifications

Module: `_common`

Run as **Sonnet 5, high effort, clean context**. One unit per session. Move this file to `_done/` when the
unit's docs have landed and you have read them.

For the mutation pass, paste the same block with `Pass:` changed to `mutation` — preferences.

---

```
Read prompts/view-docs/PROMPT-TEMPLATE.md in full and follow it exactly. It is the
specification for this task: the procedure, the hard constraints, the deliverables and
their exact section headings, the severity and ID rules, and the closing report format.

Fill its Unit block with:

- Unit name: `notifications`
- Module: `_common`
- Pass: `inventory`
- Views & routes:
    `NotificationsView`   `/notifikacie`
    `ReminderPreferencesView`   `/nastavenia/pripomienky`
- Intent sources: prompts/_done/_common/notifications/README.md,
  N6-notifications-page.md, N11-en-locale.md, N10-quiet-hours.md,
  N12-notification-type-settings.md, N3-paging-and-unread-count.md

Environment, already verified — do not re-check:
- Dev server https://localhost:3000 (this exact origin — the session cookie is bound to
  it), backend https://localhost:8080, both running and seeded. You are signed in and the
  account locale is English. If the UI renders Slovak, stop and report.

This is a Windows machine — use the PowerShell tool for shell commands, never Bash.

Invoke the claude-in-chrome skill, then load the Chrome MCP tools in ONE ToolSearch call.
Call tabs_context_mcp first, then create your own tab. Never reuse a tab from another
session. Never trigger a browser-native alert/confirm/prompt.

Known for this unit — verify each, do not assume:
- FRAMEWORK unit (src/_common/modules/notifications/). Tag every finding [framework].
- ALREADY FILED, DO NOT RE-FILE — but do extend: the shell pass logged B1, "notification
  titles and bodies render raw Slovak regardless of the EN locale preference", while the
  surrounding chrome is English. See docs/views/_shell/inventory.md. Its Verify block asks
  whether a FRESHLY-ARRIVED notification is English too, which distinguishes a code bug
  from rows persisted in Slovak at creation time. Settle that question here — it is the
  main open thread in this module. Note N11 is literally the "EN locale" prompt, so this
  is either a regression or a prompt that never fully landed.
- The bell and its dropdown panel are documented in _shell/inventory.md. The FULL page at
  /notifikacie is yours — the bell is only a peek at the top of it.
- Reminder preferences are keyed by (ownerModule, kind). Per CLAUDE.md's ownership rules,
  anything about whether/when/how a notification reaches the user belongs HERE, not in a
  module's own settings — quiet hours, per-kind muting and channel choice are already
  modelled. If another module re-implements one, that is a duplicate, and a finding.
- Notifications arrive live over SignalR, so counts and lists move under you. Note the
  timestamp when you record an unread count.
- Mutation pass covers preferences only. Do not mass-mark-as-read as an experiment.

Do only this unit. Do not continue to another one.
```
