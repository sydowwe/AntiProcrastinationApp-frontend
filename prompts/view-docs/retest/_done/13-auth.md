# Retest 13 — `auth` (14 findings) — run this one last

Run the **retest round** for this one unit. First read `../../RETEST-PROMPT.md` in full and follow its §2–§4 and *Final report*. This file replaces its §1: the table
below is your scope.

- **Unit:** `auth` → `../../../../docs/views/auth/findings.md`
- **Commit:** run `git rev-parse --short HEAD` and use that
- **Reseed at start:** no
- **Known failing specs:** whatever the operator's message names, otherwise none
- **Account:** **signed out** for most of the unit. Sign in through the **form** as `primaryUser` where a check needs it. Do **not** `state-load`
  `../../../../e2e/.state/auth-10001.json` here: the unit logs out, and you would rotate a token other sessions depend on.
- **Routes:** `/login`, `/registration`, `/forgotten-password`, `/reset-password`, `/confirm-email`, `/confirm-email-change`

## Findings to retest

Most of these landed as framework commits (`FW7`, `FW9`, `FW11`–`FW14`, `FW21`) on 2026-09-23 and say only
"fixed". None records a live check.

Each finding's `Verify:` block in `findings.md` is the check. The last two columns summarise it so you can plan the order. If a summary and the `Verify:` block
disagree, the block wins.

| id | sev                    | finding                                                                                | pass condition, in short                                                                                 | mutates                           |
|----|------------------------|----------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------|-----------------------------------|
| X1 | blocker                | Forgotten password can never succeed (`recaptchaToken` never sent)                     | with a seeded e-mail, the "reset e-mail sent" dialog opens and the POST returns 2xx                      | sends an e-mail                   |
| X2 | blocker                | Registration can't be completed (a client guard eats the submit)                       | a `POST /auth/register` request appears (any status)                                                     | **creates an account**, see notes |
| B1 | bug                    | A signed-out redirect never returns you to where you were going                        | signed out, open `/todo-list/<seed list id>`, sign in, and land back on that path                        | sign-in #1                        |
| B2 | bug                    | Registration's password-mismatch message is a raw i18n key                             | a readable English sentence, and no `[intlify] Not found` message                                        | no                                |
| B3 | bug                    | Forgotten password only handles a 404; everything else is silently logged              | a visible error for a non-404 failure                                                                    | no (route mock)                   |
| B4 | bug                    | Neither confirm view shows a lasting explanation on failure                            | on **both** confirm views, a persistent sentence next to the recovery button after the snackbar has gone | no                                |
| B5 | bug                    | ConfirmEmailView's resend failure is a hardcoded "Error", and the request is malformed | a localized full sentence, and no request with a literal `undefined` path segment                        | no                                |
| B6 | bug                    | An unconfirmed account's login looks the same as a wrong password                      | the response tells them apart, and the resend-confirmation panel appears                                 | sign-in #2                        |
| B7 | bug                    | A 401 on a signed-out endpoint triggers a pointless token refresh                      | no `/auth/refresh` request after the resend 401                                                          | no                                |
| B8 | bug                    | Registration's 2FA recovery codes are received and thrown away                         | recovery codes (or a clear path to them) appear with a copy/download option                              | only inside X2's account          |
| A1 | a11y **[framework]**   | The password show/hide toggle has no descriptive name                                  | "Show password", switching to "Hide password"                                                            | no                                |
| P1 | polish **[framework]** | Registration's legal links wipe the form on back-navigation                            | the typed values survive (the links open in a new tab)                                                   | no                                |
| P2 | polish                 | Logging out can leave a stale request that logs a 401                                  | no 401 or `AxiosError` for `/routine/settings` in the console after logout                               | no                                |
| P3 | polish                 | A stray debug `console.log` fires on every login attempt                               | no such log line                                                                                         | no                                |

## Unit notes

- **Sign-in budget:** `/auth/login` allows **5 hits a minute per IP**, counting failures, and every session on the machine shares it. This unit needs about three: B1
  (and watch P3's console on the same attempt), B6, and one more if P2 needs a fresh session. If you get a 429, wait 60 s. It is not a finding.
- **The reCAPTCHA site key is empty locally.** The client sends an empty token and the server decides. For **X1**, if the server rejects the empty token, record the
  request body. The fix was that `recaptchaToken` is *sent*. If the body carries the field but the server refuses it, mark X1 **blocked** by the environment, not
  reopened. Treat X2's server response the same way.
- **One throwaway account for X2, B8 and B6.** Register `retest-<yyyyMMddHHmm>@example.com` once. It stays unconfirmed, which is exactly what **B6** needs: try to
  sign in with it. Do B8 in the same registration if the form offers 2FA. Record the address in the round-history row, because it lives until the next reseed.
- **B3's `Verify:` block says to stop the backend. Don't.** Use `playwright-cli route "**/auth/forgotten-password"`
  to answer with a 500 (and, separately, abort the request), check the view, then remove the route.
- **B4, B5, B7:** open `/confirm-email` and `/confirm-email-change` with a bogus token or user id. Those failures are what the checks need, and they need no real
  e-mail.
- **P2:** sign in (B1's session will do), open `/routine-todo-list` so that `/routine/settings` is fetched, log out from the user menu, then read `console error` and
  `console info`.
- **Leave the session signed out at the end** and say so in the report. Nothing in `../../../../e2e/.state` was touched.
