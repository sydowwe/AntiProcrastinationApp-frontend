# Unit 15 — auth

Module: `_common/user`

Run as **Sonnet 5, high effort, clean context**. One unit per session. Move this file to `_done/` when the unit's docs have landed and you have read them.

For the mutation pass, paste the same block with `Pass:` changed to `mutation` — use a throwaway account.

---

```
Read prompts/view-docs/PROMPT-TEMPLATE.md in full and follow it exactly. It is the
specification for this task: the procedure, the hard constraints, the deliverables and
their exact section headings, the severity and ID rules, and the closing report format.

Fill its Unit block with:

- Unit name: `auth`
- Module: `_common/user`
- Pass: `mutation`
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

Drive the browser with playwright-cli, per CLAUDE.md's "Browser verification" section —
including its sign-in and state-load sequence. Use your own session and run
`playwright-cli close` when you finish. Prefer `find` over `snapshot`. Charts are echarts
on <canvas> and are invisible to the snapshot: read them from the populating response,
an eval, or a screenshot — never report one as empty on snapshot evidence alone.

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
- THREE HARDCODED ENGLISH STRINGS ARE ALREADY KNOWN HERE, found 2026-09-13 by a static
  sweep, not in the browser. Confirm each renders and file them properly ([framework], with
  the SK evidence) rather than re-discovering them:
    `LoginView.vue:158`             showErrorSnackbar('No user!!!')
    `ForgottenPasswordView.vue:71`  showErrorSnackbar('Email not found')
    `ConfirmEmailView.vue:69`       showErrorSnackbar('Error')
  "No user!!!" is a developer placeholder shown to real users — worth saying plainly what it
  looks like, and what it SHOULD say is a product decision, not a translation.
- SEPARATE, AND BIGGER THAN IT LOOKS: `LoginView.vue:165-176` branches on English server
  text — `.includes('Invalid email or password')`, `'Too many failed login attempts'`,
  `'User locked out for'`, `'Email not confirmed'`. That is the client matching prose it
  does not own. Check what the server actually sends now (the real strings, from the
  response body of a failed login), and whether every branch still hits. A backend that
  localized or reworded any of those messages would silently drop the user into the generic
  error path with nothing in the console to say why.
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
