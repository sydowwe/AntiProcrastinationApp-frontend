# Phase 5 — 15 auth

Run as **Sonnet 5, high effort, clean context.** One Phase 5 session at a time, because they share the seeded
database. Move this file to `_done/` once its report is in and you've skimmed the diff.

```
Read prompts/view-docs/phase5/TEMPLATE.md in full and follow it exactly. This message fills in
its unit parameters.

- Unit: `auth` → docs/views/auth/
- Draft spec: e2e/tests/auth.draft.spec.ts
- Related specs: e2e/tests/auth.spec.ts, e2e/tests/two-factor.spec.ts
- Final files: e2e/tests/auth.spec.ts, e2e/tests/two-factor.spec.ts

Unit notes:
- MERGE the draft into the existing auth.spec.ts, then remove the draft with git.
- Do NOT merge two-factor.spec.ts into auth.spec.ts. It's a separate file on purpose: when it was
  folded in, its two sign-ins were the sixth /auth/login hit inside a minute, which gave a 429
  that looks like a stuck /login. Walk its one fixme (FW11: returning to the deep link after the
  2FA dialog) and leave the file where it is.
- /auth/login is throttled at 5 hits per minute per IP, and it counts hits, not failures. A run
  starts with two cold sign-ins, and auth.spec.ts adds more. WAIT 60 s between runs of
  auth.spec.ts or two-factor.spec.ts. Step 6's "twice in a row" means twice, a minute apart.
- The auth views are signed-out, so those tests use the raw `page` fixture, not
  authenticatedPage. The first navigation of a run can hit the certificate failure, so if the
  first test fails, re-run once before diagnosing it.

This is a Windows machine. Use the PowerShell tool for shell commands, never Bash.
Do only this unit.
```
