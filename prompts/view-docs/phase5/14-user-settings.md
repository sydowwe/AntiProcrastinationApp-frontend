# Phase 5 — 14 user-settings

Run as **Sonnet 5, high effort, clean context.** One Phase 5 session at a time, because they share the seeded
database. Move this file to `_done/` once its report is in and you've skimmed the diff.

```
Read prompts/view-docs/phase5/TEMPLATE.md in full and follow it exactly. This message fills in
its unit parameters.

- Unit: `user-settings` → docs/views/user-settings/
- Draft spec: e2e/tests/user-settings.draft.spec.ts
- Related specs: none
- Final file: e2e/tests/user-settings.spec.ts

Unit notes:
- Changing a preference writes /user/preferences, and other modules read those values
  (askBeforeDelete, firstDayOfWeek, locale). A test that changes one must either restore it or run
  in a freshSeed + serial block with test.afterAll(reseed). Otherwise it changes the behaviour of
  every spec after it. A locale change would break every English locator that follows.
- Leave two-factor.spec.ts alone. It's a separate file on purpose (because of the rate limit), and
  unit 15's session walks it.
- /google-calendar/callback without a code redirects to /user/settings. That's correct, so assert
  the redirect.

This is a Windows machine. Use the PowerShell tool for shell commands, never Bash.
Do only this unit.
```
