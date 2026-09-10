# Unit 15 — auth

Module: `_common/user`

Run as **Sonnet 5, high effort, clean context**. One unit per session. Move this file to `_done/` when the
unit's docs have landed and you have read them.

For the mutation pass, paste the same block with `Pass:` changed to `mutation` — use a throwaway account.

---

```
Read prompts/view-docs/PROMPT-TEMPLATE.md in full and follow it exactly. It is the
specification for this task: the procedure, the hard constraints, the deliverables and
their exact section headings, the severity and ID rules, and the closing report format.

Fill its Unit block with:

- Unit name: `auth`
- Module: `_common/user`
- Pass: `inventory`
- Views & routes:
    `LoginView`  `/login`
    `RegistrationView`  `/registration`
    `ForgottenPasswordView`  `/forgotten-password`
    `ConfirmEmailView`  `/confirm-email`
    `ConfirmEmailChangeView`  `/confirm-email-change`
- Intent sources: prompts/_done/user/README.md, A1-logout-leaks.md,
  U1-hydrate-before-read.md, framework/F3-hydrate-on-login.md,
  framework/F4-registration-terms-link.md, framework/F1-2fa-recovery-codes.md

Environment, already verified — do not re-check:
- Dev server https://localhost:3000 (this exact origin — the session cookie is bound to
  it), backend https://localhost:8080, both running and seeded. You are signed in and the
  account locale is English. If the UI renders Slovak, stop and report.

This is a Windows machine — use the PowerShell tool for shell commands, never Bash.

Invoke the claude-in-chrome skill, then load the Chrome MCP tools in ONE ToolSearch call.
Call tabs_context_mcp first, then create your own tab. Never reuse a tab from another
session. Never trigger a browser-native alert/confirm/prompt.

Known for this unit — verify each, do not assume:
- RUN THIS UNIT LAST, or accept that you will lose the signed-in session. These are the
  signed-out views; reaching them properly means logging out. Use a THROWAWAY account for
  anything that creates state, and never register with the real account's e-mail.
- These are FRAMEWORK views (src/_common/modules/user/). Every finding here is a submodule
  issue — tag them [framework]. Fixes are a commit in vue_framework plus a pointer bump.
- All five routes are `public` and carry `showRecaptchaBadge: true`. Check the badge
  actually appears here and disappears on signed-in routes (router.afterEach toggles it).
- F4: the registration terms checkbox links to /legal/terms and /legal/privacy by route
  NAME, handed to the framework via installFramework({ legalRoutes }) in main.ts. Confirm
  both links resolve — a rename breaks them silently while a path change does not.
- ConfirmEmailView and ConfirmEmailChangeView need a token from a real e-mail. If you
  cannot obtain one, visit them without a token, document what they do with that, and
  record the happy path as unverified. Do not invent a token and document the error state
  as if it were the view.
- CHECK THE REDIRECT PRESERVES THE DESTINATION. The guard in src/router.ts:74-77 sends any signed-out
  visitor to `login`, but returns a bare route name with no record of where they were going. So:
  visit a deep link like /todo-list/1 while signed out, sign in, and see whether you land on that
  page or are dumped on `/`. This is the whole of what a signed-out sweep would have found, asked
  once here instead of across 46 routes, since the guard is one default-deny branch.
- A1 ("logout leaks") is about state surviving sign-out. If you do log out, check whether
  the previous account's data is still visible anywhere before signing back in — that is
  the finding this unit exists to catch, and it pairs with the X2 two-account check.

Do only this unit. Do not continue to another one.
```
