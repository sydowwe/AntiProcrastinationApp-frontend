# Phase 5 — 16–19 framework units, one session

Run as **Sonnet 5, high effort, clean context.** One Phase 5 session at a time, because they share the seeded
database. Run it once units 16–19 have finished their passes and their fixes are retested. If the session runs
long, stop after two units and start a fresh one with this same file, told which units are already done.

```
Read prompts/view-docs/phase5/TEMPLATE.md in full and follow it exactly, once per unit below,
in this order. This message fills in the unit parameters.

| unit | docs | draft spec | final file |
| --- | --- | --- | --- |
| `notifications`   | docs/views/_submodule/notifications/   | e2e/tests/notifications.draft.spec.ts   | notifications.spec.ts |
| `reminders-user`  | docs/views/_submodule/reminders-user/  | e2e/tests/reminders-user.draft.spec.ts  | reminders-user.spec.ts |
| `scheduler`       | docs/views/_submodule/scheduler/       | e2e/tests/scheduler.draft.spec.ts       | scheduler.spec.ts |
| `reminders-admin` | docs/views/_submodule/reminders-admin/ | e2e/tests/reminders-admin.draft.spec.ts | reminders-admin.spec.ts |

The docs column wins over the template: read every docs/views/<unit>/ path in it as the folder
above, including where §3 appends a finding.

If a unit's draft spec doesn't exist, skip that unit and say so in its report block. Give one
report block per unit, then one extra line: "Framework units: <n>/4 promoted".

Notes for all four:
- These are FRAMEWORK views (src/_common/modules/). Any finding you file (template §3) is tagged
  [framework] in its title. The specs themselves still live in this app's e2e/, because they
  test the framework as mounted here.
- reminders-admin's routes answer 403 for primaryUser, deliberately. Its specs use the
  `adminPage` fixture (adminUser, 10003), not authenticatedPage. Don't "fix" a 403 in a spec by
  switching accounts elsewhere.
- NEVER trigger a reminder dispatch, a replay, a scheduler run, or a bulk action on reminders or
  jobs in a spec. Those send real notifications or change schedules for the whole seeded
  database. Assert that those controls exist and are enabled. Don't click them.
- Marking notifications read is a write. Put it in a freshSeed + serial block, and assert unread
  counts against seed.counts.
- Cron expressions are Quartz (6–7 fields, seconds first, 1 = Sunday, UTC). Don't assert a
  5-field expression as valid.
- Run the four final specs together at the end, twice, as a group check on top of each unit's
  own step 6.

This is a Windows machine. Use the PowerShell tool for shell commands, never Bash.
Do only these four units.
```
