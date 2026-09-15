# auth — findings

> Pass: mutation · captured 2026-09-15 (round 3, scoped retest of X1/X2) · commit `50bd6b0d` (+ uncommitted
> working-tree changes in the `src/_common` submodule — the X1/X2 fixes had not been committed at capture time)

**Tally:** blocker 2 · bug 8 · a11y 1 · polish 3 · opportunity 0 · unverified 5

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-14 | `6aac48bb` | initial inventory pass |
| 2 | 2026-09-15 | `50bd6b0d` | mutation pass. Re-verified X1, B1, B2, B3, A1(a11y), P1, P2, P3 live — all unchanged. Corrected B4 (round 1's "persistent explanation" claim on `ConfirmEmailChangeView` was a mid-fade snackbar screenshot, not steady-state; both confirm views are equally bare). Strengthened B5 with the malformed `/undefined` request path. Escalated O1 to **X2** (blocker) after confirming live that the server accepts an empty `recaptchaToken` on `/auth/register` — Registration's own client-side guard is refusing a request the backend would have accepted, so the view is unusable end-to-end in this environment, not merely inconsistent with Login. Added **B6** (a genuinely unconfirmed account's login attempt gets the generic "Invalid email or password" 401, never the dedicated "Email not confirmed" 403 branch) and **B7** (the axios interceptor's `AUTH_ENDPOINTS` allowlist misses this module's own signed-out endpoints, so a 401 from `resend-confirmation-email` triggers a pointless `/auth/refresh` round-trip while fully signed out). U1's evidence strengthened (server response confirmed live to carry `recoveryCodes`), still filed `unverified` per the strict browser-reproduction rule since the discarding itself is still only source-corroborated — the real `RegistrationView` submit path remains unreachable in this environment. U2–U5 unchanged, still blocked on the same missing data. Verified the A1 logout-leak fix holds: `resetAppState()` fires on the `isAuthenticated` watcher and zeroes `dayPlanner`/`templateDayPlanner` sessionStorage content on logout (keys persist, content resets to defaults) — spot-checked only, no real cross-account task data was in play to prove the harder case. Cleaned up via `POST /api/test/seed` at the end (see report). |
| 3 | 2026-09-15 | `50bd6b0d` + uncommitted `src/_common` | **Scoped retest of X1 and X2 only**, both fixed in the working tree (not yet committed): `ForgottenPasswordView.vue` now calls `executeRecaptcha('forgot_password')` and sends `recaptchaToken`; `RegistrationView.vue` sends `recaptchaToken` as-is instead of refusing to submit on an empty token. **X1 → fixed**: `POST /auth/forgotten-password` now returns 204 and the success `MyDialog` opens, for both a real seeded e-mail and a nonexistent one (identical 204 either way — no user enumeration). **X2 → fixed**: `POST /auth/register` now fires and returns 200 on a valid form submit; a real throwaway account was created. This unblocked two previously-`unverified` items: **U5 → resolved**, confirmed working exactly as coded (e-mail prefilled, password field autofocused, "Resend confirmation email" panel shown on `/login` after registration). **U1 → escalated and renumbered to B8** (bug): registered a second throwaway with 2FA checked; the server response carried real `recoveryCodes` (`response-body` inspected directly), but the QR dialog rendered with only the QR image — the codes are provably discarded, now browser-observed rather than source-corroborated. B2 (raw `passwordsDontMatch` key) re-verified live and unchanged. Checked for B7 (spurious `/auth/refresh` after a 4xx) against both retested endpoints: `/auth/forgotten-password` never returned non-2xx this round (204 both times), and a deliberately duplicated `/auth/register` returned 409 (not 401), so the refresh-trigger condition (`status === 401`) was never met by either endpoint in this round — B7 stays open on its original `resend-confirmation-email` evidence, out of this round's scope. Cleaned up via `POST /api/test/seed` at the end (see report). |

---

### X1. The forgotten-password flow cannot ever succeed — `recaptchaToken` is never sent
- **Status:** fixed
- **Severity:** blocker
- **Where:** `src/_common/modules/user/view/ForgottenPasswordView.vue:65` → `getByRole('button', { name: 'Reset password' })`
- **Expected:** Submitting a valid, registered e-mail sends a reset link and shows the "Password reset email
  has been sent" dialog. `LoginView` and `RegistrationView` both attach a `recaptchaToken` to their POST
  bodies (`LoginView.vue:145`, `RegistrationView.vue:141`) — the same is plainly expected here, and is the
  only thing missing.
- **Actual:** `API.post('/auth/forgotten-password', { email: email.value })` never calls `useRecaptcha()` or
  includes a `recaptchaToken` field at all. The server rejects every request with 400:
  `"JSON deserialization ... was missing required properties including: 'recaptchaToken'"` — reproduced
  identically for a real seeded e-mail (`test@example.com`) and a nonexistent one, so this is not a dev-only
  or recaptcha-key-configuration artifact; the field is structurally absent from the payload regardless of
  environment.
- **Evidence:** `docs/views/auth/screenshots/forgotten-password--success-dialog.png` (shows the generic
  error snackbar instead of the success dialog); network: `POST https://localhost:8080/api/auth/forgotten-password → 400`, body
  `{"errors":{"serializerErrors":["JSON deserialization for type '...ForgotPasswordRequest' was missing required properties including: 'recaptchaToken'."]}}`
- **Repro:** 1) Sign out. 2) Go to `/forgotten-password`. 3) Enter any e-mail (real or not). 4) Click "Reset
  password". 5) Observe the generic "One or more errors occurred!" snackbar instead of the success dialog.
- **Verify:** 1) Repeat the repro with a real seeded e-mail. 2) Confirm the "Password reset email has been
  sent" `MyDialog` opens instead of an error snackbar, and `POST /auth/forgotten-password` returns 2xx in the
  network panel.
- **Root cause guess:** `ForgottenPasswordView.vue` was never updated when recaptcha was added to the other
  auth POSTs (Login, Registration, GoogleSignIn all call `executeRecaptcha`) — a straightforward omission,
  not a design choice.
- **Suggested fix:** Import `useRecaptcha()`, call `executeRecaptcha('forgotten-password')` (or whatever
  action name the backend expects), and include the result as `recaptchaToken` in the POST body, mirroring
  `LoginView.vue:145-146`.
- **Re-verified (round 2):** Unchanged. Submitted with the real seeded `test@example.com` and got the
  identical 400; `docs/views/auth/screenshots/forgotten-password--success-dialog.png` still matches.
- **Re-verified (round 3):** Fixed, working-tree only (not yet committed). `ForgottenPasswordView.vue:69`
  now calls `executeRecaptcha('forgot_password')` and sends `{ email, recaptchaToken }`. Submitted with the
  real seeded `test@example.com`: `POST /auth/forgotten-password` → **204**, and the "Password reset email
  has been sent." `MyDialog` opened (`getByRole` match on the dialog title and body text). Also tried
  `definitely-not-a-real-user@example.com`: identical **204** and identical success dialog — the server does
  not distinguish a real address from a nonexistent one at this endpoint (bears on B3's "only a 404 branch is
  handled" premise: a 404 was never observed in this round either, from either address — worth a note for
  whoever next picks up B3, though B3 itself is not re-filed here). No console errors; the only warning was
  the expected `VITE_RECAPTCHA_SITE_KEY is not set`. Screenshot overwritten:
  `docs/views/auth/screenshots/forgotten-password--success-dialog.png` (now shows the actual success dialog,
  replacing round 1/2's error-snackbar capture).

---

### X2. Registration cannot be completed through the UI at all — its own client-side guard refuses a request the server accepts
- **Status:** fixed
- **Severity:** blocker — **escalated from round 1's `O1` (opportunity)** with live evidence that this is not
  a mere inconsistency between two views but a fully broken form
- **Where:** `src/_common/modules/user/view/RegistrationView.vue:132-140` (`validateAndSendForm`) →
  `getByRole('button', { name: 'Register' })`
- **Expected:** Submitting a valid registration form (e-mail, matching passwords, terms accepted) creates the
  account, exactly as `POST /auth/register` says it does when called directly. Plain user sense: a form with
  no client-side validation errors showing should submit.
- **Actual:** `executeRecaptcha('register')` resolves to `''` in this dev environment (no
  `VITE_RECAPTCHA_SITE_KEY`, confirmed in `.env.development`). `validateAndSendForm` then hits
  `if (!recaptchaToken) { showErrorSnackbar(...); return }` **before ever calling `API.post`** — confirmed
  live: filling out a fully valid form and clicking "Register" produced **zero new network requests**
  (`playwright-cli requests` showed only the pre-existing static list, no `/auth/register` call at all).
  Calling the same endpoint directly with an identical payload and `recaptchaToken: ''` returned **200** with
  a real account created (`{"twoFactorEnabled":false,"qrCode":null,"recoveryCodes":null}`) — the server does
  not require the token here, the same "fail open" behaviour `LoginView.vue` already relies on. So the
  client-side guard is refusing traffic the server would accept, and there is no way to complete registration
  through this app's UI in this environment at all.
- **Evidence:** `docs/views/auth/screenshots/registration--mutation-form.png` (form filled just before
  submit) and `docs/views/auth/screenshots/registration--mutation-blocked.png` (after the click — no error
  text visible, page never navigates); `playwright-cli requests` after the click (no `/auth/register` entry);
  direct `fetch('https://localhost:8080/api/auth/register', ...)` from the same page context returning `200`
  with the payload above.
- **Repro:** 1) Go to `/registration`. 2) Fill e-mail, matching passwords, check the terms checkbox. 3) Click
  "Register". 4) Watch the network panel — no `/auth/register` request is ever sent.
- **Verify:** Repeat the repro; the observable pass condition is a `POST /auth/register` request appearing in
  the network panel (any status), proving the guard no longer silently eats the submit.
- **Root cause guess:** Same root cause as the original `O1` — `LoginView.vue` sends the empty token anyway
  and lets the server decide; `RegistrationView.vue` alone refuses to submit. Now confirmed live that the
  server-side behaviour is identical for both endpoints, so there is no server-side reason for the two views
  to disagree.
- **Suggested fix:** Match `LoginView`'s fail-open behaviour: send `recaptchaToken` as-is (even empty) and let
  the server's own enforcement decide, the same way `LoginView.vue:145` does. This is the same fix `O1`
  already suggested; round 2 just confirms it is not optional for local testability — it is the only way
  this view can be exercised at all outside a real recaptcha key.
- **Supersedes:** round 1's `O1` (opportunity), whose content is folded in above rather than duplicated.
- **Re-verified (round 3):** Fixed, working-tree only (not yet committed). `RegistrationView.vue:138` now
  sends `registrationRequest.value.recaptchaToken = await executeRecaptcha('register')` as-is, with no guard
  refusing an empty result — matching `LoginView`'s fail-open behaviour exactly, as the round 2 suggested fix
  asked for. Filled a full valid form (fresh throwaway e-mail, matching passwords, terms checked) and clicked
  "Register": `POST /auth/register` fired and returned **200**, the view navigated to `/login`, and the
  response body was `{"twoFactorEnabled":false,"qrCode":null,"recoveryCodes":null}` — a real account was
  created. Screenshots: `docs/views/auth/screenshots/registration--mutation-form.png` (filled form, pre-
  submit) and `docs/views/auth/screenshots/login--redirected-from-registration.png` (post-submit landing
  state, see U5 below). Cleaned up by the end-of-pass reseed.

---

### B1. A signed-out redirect never returns you to where you were going
- **Status:** open
- **Severity:** bug
- **Where:** `src/router.ts:98` (`return { name: 'login' }`) and `src/_common/modules/user/view/LoginView.vue:156,217`, `src/_common/modules/user/component/LoginVerifyQrCode.vue:64` (all `router.push('/')`)
- **Expected:** Visiting a guarded deep link while signed out, then signing in, lands you back on that page —
  this is the explicit behaviour the unit's own brief asks to verify, and it is plain user sense for any app
  with a login wall. The mechanism partially exists already: the axios interceptor's own forced-logout path
  (`_common/axiosConfig.ts:175`) already writes `{ name: 'login', query: { redirect: fullPath } }` on a 401.
- **Actual:** The router guard's own redirect (the far more common path — any deliberate deep-link visit
  while signed out) drops the destination entirely. And even if it did attach `?redirect=`, nothing reads it
  back: both of `LoginView`'s successful-login handlers and `LoginVerifyQrCode`'s 2FA-success handler
  hardcode `router.push('/')`. The mechanism is half-built on the write side (only for the 401 case) and
  entirely absent on the read side.
- **Evidence:** Reproduced live: with all storage cleared, `playwright-cli goto https://localhost:3000/todo-list/13001` lands on
  `https://localhost:3000/login` (no query string at all). Filling in the seeded credentials and submitting
  lands on `https://localhost:3000/` — not `/todo-list/13001`.
- **Repro:** 1) Clear all cookies/storage (or open a fresh session). 2) Navigate directly to
  `/todo-list/13001`. 3) Observe you land on `/login` with no `redirect` query param. 4) Sign in with
  `test@example.com` / `testpass123`. 5) Observe you land on `/`, not `/todo-list/13001`.
- **Verify:** Repeat the repro; the observable pass condition is landing back on `/todo-list/13001` after
  step 4, with the browser URL bar showing that path.
- **Root cause guess:** Two independent gaps that happen to compound: the guard never writes `redirect`, and
  the two success handlers never read it. Fixing only one side is not enough.
- **Suggested fix:** In `router.ts:98`, return
  `{ name: 'login', query: { redirect: to.fullPath } }`. In `LoginView.vue` and `LoginVerifyQrCode.vue`,
  replace the hardcoded `router.push('/')` with
  `router.push((route.query.redirect as string) || '/')`, guarding against an open-redirect to an
  off-origin `redirect` value (path-only, never a full URL).
- **Re-verified (round 2):** Unchanged. Repeated the exact repro with the real seeded account — landed on
  `/` again, no `redirect` query param written at any point.

---

### B2. Registration's password-mismatch message is a raw, untranslated i18n key
- **Status:** open
- **Severity:** bug
- **Where:** `src/_common/modules/user/component/MyNewPasswordInput.vue:36` (`i18n.t('user.passwordsDontMatch')`) → `getByRole('textbox', { name: 'Confirm new password' })`, rendered on `/registration`
- **Expected:** A validation message in the user's language, per CLAUDE.md's localization rule and every
  other validation message on the same form ("Email is required", "Password is required", etc., all
  correctly localized).
- **Actual:** The literal string `user.passwordsDontMatch` renders in the field's error slot. The key exists
  in no locale file at all — not `_common/modules/user/_locales/user.en.ts`, not the `.sk.ts` counterpart.
- **Evidence:** `docs/views/auth/screenshots/registration--password-mismatch.png`; console:
  `[intlify] Not found 'user.passwordsDontMatch' key in 'EN' locale messages.`
- **Repro:** 1) Go to `/registration`. 2) Type different values into "New password" and "Confirm new
  password". 3) Observe the error text under "Confirm new password" reads literally `user.passwordsDontMatch`.
- **Verify:** Repeat the repro; the observable pass condition is a readable English sentence (e.g.
  "Passwords don't match") in place of the raw key, and no `[intlify] Not found` console warning.
- **Root cause guess:** The key was referenced when the component was written but never added to either
  locale file — this also affects `ChangePasswordForm.vue` (settings, out of this unit — worth a
  cross-reference note for whoever picks up user-settings retest).
- **Suggested fix:** Add `passwordsDontMatch` to both `user.en.ts` and `user.sk.ts` under the `user`
  namespace.
- **Re-verified (round 2):** Not re-driven in the browser this round (source-checked only — `grep` for
  `passwordsDontMatch` still finds it only in the component, neither locale file). No code change since
  round 1's capture.
- **Re-verified (round 3):** Reproduced live again on `/registration` — typed `AAbb123!!` / `AAbb999!!` into
  the two password fields, and on blur the "Confirm new password" field's alert reads the literal
  `user.passwordsDontMatch`, with a matching `[intlify] Not found 'user.passwordsDontMatch' key in 'EN'
  locale messages.` console warning. Unrelated to and unaffected by the X1/X2 fixes.

---

### B3. ForgottenPasswordView's error handling only recognises a 404 — everything else is silently logged
- **Status:** open
- **Severity:** bug
- **Where:** `src/_common/modules/user/view/ForgottenPasswordView.vue:69-74`
- **Expected:** Per CLAUDE.md, an interceptor-driven snackbar or a view-specific message on any failure — no
  request should fail with zero user feedback.
- **Actual:** The `.catch()` only branches on `error.response.status === 404`; every other status (including
  the 400 this endpoint actually returns today, see X1) falls into `console.log('Error', error.message)`
  with no `showErrorSnackbar` call from this view. In today's build a 400 happens to still show *something*
  because the global axios interceptor's own generic `BadRequest` handler fires independently
  (`_common/axiosConfig.ts:227-229`) — but a true network failure (no `error.response` at all, e.g. the
  backend unreachable) has no `status`, so neither this view's catch nor the interceptor's status-keyed
  switch shows anything, and the button would look dead.
- **Evidence:** Source read plus the live 400 in X1's repro, cross-checked against
  `_common/axiosConfig.ts:220-221` (`if (!originalRequest?._silent && status !== undefined)` — a
  `status === undefined` case shows nothing from the interceptor either).
- **Repro:** Not independently reproduced for the true network-failure case (would require killing the
  backend mid-request) — marked as source-corroborated, not fully live-reproduced for that specific path;
  the 400 fallthrough itself **is** live-reproduced via X1's repro.
- **Verify:** With the backend stopped, submit the forgotten-password form and confirm a visible error
  message appears (currently: nothing does, per source reading).
- **Root cause guess:** The 404-only branch was written when "email not found" was believed to be the only
  failure mode; the endpoint's actual current failure mode (missing recaptcha field, X1) was never
  anticipated by this branch.
- **Suggested fix:** Replace the `if (status === 404) {...} else {console.log}` with a general
  `showErrorSnackbar(extractServerMessage(error) ?? i18n.t('httpErrors.unexpected'))` fallback, keeping the
  404-specific copy as the special case.
- **Re-verified (round 2):** Unchanged, source and live 400 both confirmed again in this pass's own X1/X2
  repros.

---

### B4. Neither confirm view shows a persistent explanation on failure — round 1's comparison between them was wrong
- **Status:** open
- **Severity:** bug
- **Where:** `src/_common/modules/user/view/ConfirmEmailView.vue:15-26` and
  `ConfirmEmailChangeView.vue:15-25`
- **Expected:** A user landing on a broken/expired confirmation link should see a persistent, readable
  explanation of what went wrong, not just a recovery button — plain user sense, and CLAUDE.md's
  localization rule requires whatever text there is to be real copy rather than a raw key.
- **Actual:** **Correction to round 1:** the original capture claimed `ConfirmEmailChangeView`'s error state
  "shows a persistent localized explanation" unlike `ConfirmEmailView`, evidenced by a screenshot showing
  body text above the "Go to login page" button. Re-driving the exact same repro live in round 2
  (`docs/views/auth/screenshots/confirm-email-change--mutation-recheck.png`) shows that text was the
  `showErrorSnackbar(i18n.t('authorization.errorConfirmingEmailChange'))` **snackbar**, caught mid-fade by
  the original screenshot's timing — not persistent body text. Once the snackbar dismisses, the steady state
  is identical to `ConfirmEmailView`: only a button, no explanatory text in the page body at all. Both
  views' templates were checked directly — neither has a persistent-text element in its error branch;
  `ConfirmEmailView.vue:19` still has a commented-out `<span>{{ i18n.t('') }}</span>` (empty key even if
  uncommented), and `ConfirmEmailChangeView.vue` never had an equivalent span to begin with. So the real gap
  is shared by both views, not unique to one: a transient snackbar is the *only* explanation either view
  ever gives, and CLAUDE.md's own convention (`MyDialog`/persistent surfaces for anything the user needs
  time to read) is not followed by either.
- **Evidence:** `docs/views/auth/screenshots/confirm-email-change--mutation-recheck.png` (round 2, snackbar
  fully dismissed — only the button remains) vs the original
  `docs/views/auth/screenshots/confirm-email-change--no-token-error.png` (round 1, snackbar still visible —
  same page, same state, different timing); `docs/views/auth/screenshots/confirm-email--no-token-error.png`
  for the `ConfirmEmailView` side, unchanged.
- **Repro:** 1) Visit `/confirm-email-change` with no query params. 2) Wait ~3s for the snackbar to auto-
  dismiss. 3) Observe only the "Go to login page" button remains, no other text. 4) Repeat at
  `/confirm-email` with no params — same shape (button only, snackbar-only explanation).
- **Verify:** Repeat the repro on both views; the observable pass condition is a persistent, non-snackbar
  sentence explaining the failure, visible alongside each view's recovery button, after the snackbar has
  had time to dismiss.
- **Root cause guess:** Dead code left mid-edit on the `ConfirmEmailView` side (the commented span); the
  `ConfirmEmailChangeView` side likely never had one written at all, since there's no equivalent commented
  scaffold there — this looks like the same gap arrived at two different ways, not one view copying the
  other's mistake.
- **Suggested fix:** Uncomment and finish the span in `ConfirmEmailView` (reuse
  `authorization.errorConfirmingEmail`), and add an equivalent persistent-text element to
  `ConfirmEmailChangeView` using `authorization.errorConfirmingEmailChange`. Both should keep the snackbar
  too (useful for a user who's mid-scroll) but neither should depend on it as the only copy of the message.

---

### B5. ConfirmEmailView's resend-failure message is a hardcoded English literal, and the request itself is malformed
- **Status:** open
- **Severity:** bug
- **Where:** `src/_common/modules/user/view/ConfirmEmailView.vue:64,69` (`API.post(\`/auth/resend-confirmation-email/${router.currentRoute.value.query['userId']}\`)` and `showErrorSnackbar('Error')`)
- **Expected:** Localized text, per CLAUDE.md, and consistent with the same view's own initial-confirm catch
  three lines above (`ConfirmEmailView.vue:55`), which correctly uses `i18n.t('authorization.errorConfirmingEmail')`.
  Separately: a request built from a missing param should either not fire, or fire against a sane value —
  not a literal string reading `"undefined"`.
- **Actual:** Clicking "Resend confirmation email" on a failure shows a snackbar reading literally `Error`.
  **New in round 2:** the request that produces the failure is itself broken, not just its error message —
  with no `userId` query param present, `router.currentRoute.value.query['userId']` is `undefined`, and the
  template literal interpolates that as the four-character string `"undefined"`, so the actual request sent
  is `POST /auth/resend-confirmation-email/undefined`. The server correctly can't resolve that "id" and
  returns 401 (not 404/400), which is itself a second-order trigger for **B7** below.
- **Evidence:** `docs/views/auth/screenshots/confirm-email--resend-error-mutation.png`; network trace:
  `POST https://localhost:8080/api/auth/resend-confirmation-email/undefined => 401`, immediately followed by
  `POST https://localhost:8080/api/auth/refresh => 401` (see B7).
- **Repro:** 1) Visit `/confirm-email` with no query params (so `userId` is `undefined`). 2) Click "Resend
  confirmation email". 3) Observe the snackbar reads exactly `Error`, and the network panel shows a request
  to a literal `.../undefined` path.
- **Verify:** Repeat the repro; the observable pass condition is (a) a full, localized sentence in the
  snackbar, not the bare word "Error", and (b) no request fires with a literal `"undefined"` segment — either
  the button is disabled/hidden when `userId` is absent, or the request is guarded to only fire with a real
  id.
- **Root cause guess:** The `userId` param was assumed always present (it only makes sense coming from a
  genuine confirmation e-mail link), but the view is reachable with no params at all by direct navigation,
  and nothing guards the resend button on that case.
- **Suggested fix:** `showErrorSnackbar(i18n.t('authorization.errorResendingConfirmationEmail'))` (new key)
  or reuse an existing generic failure key; additionally, disable/hide the "Resend confirmation email" button
  when `query['userId']` is absent, or guard `resendConfirmationEmail()` to no-op with a clearer message in
  that case.

---

### B6. A genuinely unconfirmed account's login attempt is indistinguishable from a wrong password
- **Status:** open
- **Severity:** bug
- **Where:** `src/_common/modules/user/view/LoginView.vue:185-193` (the `status === 403` /
  `'Email not confirmed'` branch)
- **Expected:** Per the code's own stated intent (a dedicated branch exists for exactly this case), a user
  who registers, then tries to log in before confirming their e-mail, should see
  `authorization.emailConfirmationNeeded` and the resend-confirmation panel — not be told their password is
  wrong.
- **Actual:** Registered a real throwaway account (`auth-mutation-throwaway-1@example.com`, confirmed to
  exist server-side via a `200` from `/auth/register`), then attempted to log in with the *correct* e-mail
  and password before confirming it. The server responded `401 Invalid email or password` —
  `{"statusCode":401,"message":"One or more errors occurred!","errors":{"generalErrors":["Invalid email or password"]}}`
  — the exact same status and message shape as a genuinely wrong password. `LoginView.vue`'s `403` /
  `'Email not confirmed'` branch (lines 185-193) is therefore **unreachable** for this scenario: the server
  no longer signals "email not confirmed" as a distinct condition (at least not as a 403 with that general
  error text), so the client's dedicated UX for it — the specific snackbar and the resend-confirmation panel
  — never fires. A brand-new user who typed their password correctly is told it's wrong, with no visible path
  forward. Repeated identically for a second throwaway account with 2FA enabled
  (`auth-mutation-throwaway-2fa@example.com`) — same `401`, same generic message, 2FA never entered into it
  since the account never got that far.
- **Why this compounds with X1:** the natural next move for a user told "invalid password" is to click
  "Forgot password?" — which is **completely broken** (X1, this same document). An unconfirmed real user
  therefore has no self-service path back into their own account through this app's UI at all; only manually
  finding the original confirmation e-mail works.
- **Evidence:** Live network trace: `POST /auth/register => 200` (account created), then
  `POST /auth/login => 401` with body `{"errors":{"generalErrors":["Invalid email or password"]}}`;
  `docs/views/auth/screenshots/login--email-not-confirmed.png` shows the login form after the attempt with no
  distinguishing snackbar visible (already dismissed) and no resend-confirmation panel rendered.
- **Repro:** 1) `POST https://localhost:8080/api/auth/register` with a fresh e-mail, a password, and
  `recaptchaToken: ''` (the UI can't reach this endpoint itself — see X2 — so this step needs the direct-API
  workaround). 2) Without confirming the e-mail, log in through `/login` with that same e-mail/password.
  3) Observe a generic "wrong email or password" outcome, not the "email not confirmed" UX.
- **Verify:** Repeat the repro; the observable pass condition is the login response distinguishing an
  unconfirmed account from a wrong password (whatever status/body the backend chooses), and
  `LoginView.vue`'s 403 branch actually firing — the resend-confirmation panel becomes visible.
- **Root cause guess:** Backend behaviour change or a branch that was never correct — either way this is
  primarily a backend contract question (does the API still emit a distinguishable "email not confirmed"
  response at all?), which needs an escalation rather than a frontend-only fix. This is exactly the risk the
  unit brief called out in advance: a backend that reworded/removed a distinguishable error silently drops
  users into the generic path with nothing in the console to explain why.
- **Suggested fix:** Frontend can't fix this alone — needs a backend ask confirming whether
  `/auth/login` still returns a distinguishable status/body for an unconfirmed e-mail, and if not, restoring
  one (a 403 with a stable error code, not prose the client has to string-match, would also fix the fragility
  this branch already had).

---

### B7. The axios interceptor's auth-endpoint allowlist misses this module's own signed-out endpoints, so a 401 there triggers a pointless token-refresh attempt
- **Status:** open
- **Severity:** bug
- **Where:** `src/_common/axiosConfig.ts:63` (`AUTH_ENDPOINTS = ['/auth/refresh', '/auth/login/2fa', '/auth/login', '/auth/microsoft-sign-in', '/auth/logout']`)
- **Expected:** Per the code's own comment at `axiosConfig.ts:183` ("Never refresh on the auth endpoints
  themselves — straight to logout, no recursion"), a 401 from any endpoint under this signed-out auth flow
  should skip the refresh attempt entirely, since there is no session to refresh.
- **Actual:** `AUTH_ENDPOINTS` only lists five paths and misses several others this same module owns:
  `/auth/register`, `/auth/forgotten-password`, `/auth/confirm-email`, `/auth/resend-confirmation-email/*`.
  Reproduced live via B5's repro: `POST /auth/resend-confirmation-email/undefined` returns `401`, which is
  **not** matched by `isAuthEndpoint()` (`url.endsWith(path)` never matches a numeric/`"undefined"` suffix
  against any of the five listed paths), so the interceptor falls into its normal refresh-and-retry branch —
  confirmed by the very next request in the trace being `POST /auth/refresh => 401`, fired while completely
  signed out, before finally giving up and rejecting the original request.
- **Evidence:** Network trace from the same repro as B5: `... /resend-confirmation-email/undefined => 401`
  immediately followed by `... /auth/refresh => 401`, both while no session exists — `test@example.com` had
  been signed out and reseeded before this account existed.
- **Repro:** 1) Visit `/confirm-email` with no query params. 2) Click "Resend confirmation email". 3) Check
  the network panel for a `/auth/refresh` request immediately after the `resend-confirmation-email` 401.
- **Verify:** Repeat the repro; the observable pass condition is no `/auth/refresh` request appearing after
  the resend 401 — the interceptor should recognise the endpoint and skip straight to whatever its
  auth-endpoint branch does (currently: attempt `logoutClient()`, itself a no-op while already signed out).
- **Root cause guess:** `AUTH_ENDPOINTS` was written against the *authenticated* app's auth surface
  (login, refresh, logout, 2FA) and never extended when the signed-out registration/confirmation endpoints
  were added to the same module — an incomplete allowlist rather than a logic error.
- **Suggested fix:** Add `/auth/register`, `/auth/forgotten-password`, `/auth/confirm-email`,
  `/auth/resend-confirmation-email` to `AUTH_ENDPOINTS` (or switch the match to a path-prefix check on
  `/auth/` generally, minus the ones like `/auth/login` that legitimately want the refresh path only when
  already authenticated — worth checking whether any listed endpoint is ever called while signed in before
  choosing between the two).
- **Round 3 note:** Checked whether this fires after a 4xx from the two retested endpoints (per this round's
  brief). `/auth/forgotten-password` never returned non-2xx this round — both a real and a nonexistent e-mail
  got 204 (see X1's round 3 note) — and a deliberately duplicated `/auth/register` returned **409**, not
  **401**, so the interceptor's refresh-trigger condition (`status === 401`, `axiosConfig.ts` around line 180)
  was never met by either endpoint here. The finding stays open on its original `resend-confirmation-email`
  evidence (`ConfirmEmailView`, out of this round's scope); the allowlist gap itself (`AUTH_ENDPOINTS` still
  missing `/auth/register` and `/auth/forgotten-password`) is unchanged in source, so it would still fire if
  either endpoint ever does return a 401.

---

### B8. Registration's 2FA recovery codes are received and then discarded — confirmed live, renumbered from `U1`
- **Status:** open
- **Severity:** bug — **escalated from `U1` (unverified)** now that the real `RegistrationView` submit path
  is reachable (X2 fixed) and the discarding itself has been observed rendered on screen, not just
  source-read
- **Where:** `src/_common/modules/user/view/RegistrationView.vue:149-158` (`open2FADialog(response.data.qrCode)`
  only, `recoveryCodes` never passed), `src/_common/modules/user/component/dialogs/QrCodeFor2FABody.vue:15`
  (`defineProps<{ qrCodeImage: string }>()` — no `recoveryCodes` prop at all)
- **Expected:** Same expectation as `prompts/_done/user/framework/F1-2fa-recovery-codes.md` (which covers the
  *regenerate* path in settings): a user enabling 2FA must be shown their recovery codes at least once, with
  a way to save them, or they can be locked out of their own brand-new account the first time they lose their
  authenticator.
- **Actual:** Registered a throwaway account (`auth-retest-2fa-<ts>@example.com`) through the real UI with
  "Do you want to use google 2 factor authentication?" checked. `POST /auth/register` returned 200 with body
  `{"twoFactorEnabled":true,"qrCode":"iVBORw0KG...","recoveryCodes":["5WC6F-N5FC3","Q974N-B56Y7","WHGVK-3WFNC","T545B-3TXBV","2H4W2-CPR57"]}`
  (inspected directly via `response-body`). The "Two-factor authentication" dialog that opened afterward
  shows only the heading, the instruction text and the QR code image — no recovery codes anywhere on screen,
  confirmed both in the accessibility snapshot (only `img "QR code for 2FA"` and a `Done` button under the
  dialog) and in a screenshot read back for the visual sweep. Clicking "Done" closes the dialog and navigates
  to `/login`, so there is no follow-up screen either — the codes are gone for good once this dialog closes.
- **Evidence:** `docs/views/auth/screenshots/registration--2fa-qr-dialog-no-recovery-codes.png`; response body
  above (`playwright-cli response-body` on the `POST /auth/register` request); `QrCodeFor2FABody.vue:15`'s
  `defineProps` read directly, confirming no `recoveryCodes` prop exists to receive them even if passed.
- **Repro:** 1) Go to `/registration`. 2) Fill a fresh e-mail and matching valid passwords. 3) Check "Do you
  want to use google 2 factor authentication?". 4) Check the terms checkbox. 5) Click "Register". 6) Observe
  the "Two-factor authentication" dialog shows only a QR code image and a "Done" button — no recovery codes,
  no copy/download affordance for them anywhere in the dialog or after closing it.
- **Verify:** Repeat the repro; the observable pass condition is the recovery codes (or a clear path to them)
  appearing somewhere in the enrollment flow, with a copy/download affordance, before or after the QR dialog.
- **Root cause guess:** Same shape of gap as F1 — likely the same original oversight, just on the enrollment
  path instead of the regenerate path. Worth fixing together if F1 is ever picked up.
- **Suggested fix:** Extend `QrCodeFor2FABody` (or open a second dialog after it closes) to accept and
  display `recoveryCodes`, mirroring whatever F1 lands on.
- **Supersedes:** `U1` (unverified), whose evidence is folded in above with the missing live-reproduction
  step now filled in, rather than duplicated.

---

### A1. The password show/hide toggle has no descriptive accessible name
- **Status:** open
- **Severity:** a11y
- **Where:** `src/_common/modules/user/component/MyPasswordInput.vue:6-10` (`appendInnerIcon` +
  `@click:appendInner`, no `aria-label`) → every password field in this unit: Login's password field,
  Registration's "New password" and "Confirm new password"
- **Expected:** An icon-only control must have an accessible name that conveys the action, ideally the
  current state too (e.g. "Show password" / "Hide password").
- **Actual:** Vuetify's auto-generated fallback name is used: `getByRole('button', { name: 'Password appended action' })` on Login,
  `'New password appended action'` / `'Confirm new password appended action'` on Registration. None of these
  convey what the control does, and none change when toggled.
- **Evidence:** Accessibility snapshot on both `/login` and `/registration` (`playwright-cli snapshot`),
  confirmed by reading `MyPasswordInput.vue:6-10` — no `aria-label` binding exists on the `appendInnerIcon`.
- **Repro:** 1) Go to `/login`. 2) Run an accessibility snapshot or a screen reader over the password field's
  trailing icon. 3) Observe the name "Password appended action".
- **Verify:** Repeat the repro; the observable pass condition is a name such as "Show password" (toggling to
  "Hide password" when active).
- **Root cause guess:** `VTextField`'s `appendInnerIcon` prop was used without its accompanying
  `append-inner` accessible-name slot/prop — a one-line gap in an otherwise-complete component.
- **Suggested fix:** Add `:aria-label="showPassword ? i18n.t('general.hidePassword') : i18n.t('general.showPassword')"` to the icon (new locale keys, or reuse if
  equivalents already exist elsewhere in the framework).
- **Re-verified (round 2):** Unchanged (source-checked; `MyPasswordInput.vue` has no `aria-label` binding on
  `appendInnerIcon`, not re-driven live this round).

---

### P1. Registration's legal links discard the whole form on back-navigation
- **Status:** open
- **Severity:** polish
- **Where:** `/registration` → `getByRole('link', { name: 'Terms and conditions' })` / `'Privacy Policy'`
- **Expected:** Reading the terms while filling out a form is a normal thing to do; losing all typed input
  (e-mail, both passwords, both checkboxes) for doing so is a rough edge worth smoothing, even though it is
  ordinary SPA route-remount behaviour rather than a defect in the strict sense.
- **Actual:** Both links are plain in-app `RouterLink`s with no `target="_blank"`. Navigating to
  `/legal/terms` and back via the browser's back button remounts `RegistrationView` from scratch — every
  field is empty.
- **Evidence:** Reproduced live: filled the e-mail field, clicked "Terms and conditions", navigated back,
  read `document.querySelector('input').value` → `""`.
- **Repro:** 1) Go to `/registration`. 2) Type an e-mail. 3) Click "Terms and conditions". 4) Click browser
  back. 5) Observe the e-mail field is empty.
- **Verify:** Repeat the repro; the observable pass condition is the form retaining its previously-typed
  values after step 4 (e.g. via `target="_blank"` on the two links, so the registration tab is never
  navigated away from).
- **Suggested fix:** Add `target="_blank"` to both `RouterLink`s (or the underlying anchors), so legal pages
  open in a new tab and the registration tab's state is untouched.
- **Re-verified (round 2):** Unchanged (source-checked; neither `RouterLink` has `target="_blank"`, not
  re-driven live this round — the terms/privacy links themselves were exercised in round 2's registration
  attempt but back-navigation specifically was not repeated).

---

### P2. Logging out can leave a stale in-flight request to log a 401 to the console
- **Status:** open
- **Severity:** polish
- **Where:** `src/core/todoList/store/routineReviewStore.ts:33-44` (`ensureLoaded`), surfaced via
  `src/core/todoList/api/routineSettingsApi.ts:6`
- **Expected:** Signing out cleanly, per the intent of `A1-logout-leaks.md` (`useSessionReset`, confirmed
  present and working for cross-account state — see the note in usecase.md/inventory), with no red console
  errors as a side effect of ordinary use.
- **Actual:** Reproduced twice, deterministically: sign in, let the Home dashboard's routine widget mount
  (which calls `routineReviewStore.ensureLoaded()` → `GET /routine/settings`), then log out via the user
  menu before that request would naturally have resolved. The response arrives after the auth token is
  cleared, the interceptor logs a 401 `AxiosError` to the console. No snackbar (401 is deliberately silent
  per the interceptor), so this is console noise, not a user-visible defect — filed as polish rather than a
  bug.
- **Evidence:** Console: `Failed to load resource: ... 401 () @ https://localhost:8080/api/routine/settings`
  + the accompanying `AxiosError` stack, captured immediately after both of two separate "Log out" clicks in
  this session.
- **Repro:** 1) Sign in. 2) Wait for the Home dashboard to finish loading (routine widget visible). 3) Open
  the user menu and click "Log out" promptly. 4) Check the console for a 401 on `/routine/settings`.
- **Verify:** Repeat the repro; the observable pass condition is no 401/`AxiosError` logged for
  `/routine/settings` after logout.
- **Root cause guess:** `ensureLoaded()`'s de-duplication (`inFlight` promise) has no cancellation — the
  underlying axios call isn't aborted when the user-id watcher's `resetStore()` fires, so a request that was
  already in flight simply completes after the token is gone.
- **Suggested fix:** Pass an `AbortController` signal into `fetchSettings()` and abort it from
  `resetStore()`, mirroring the cancellation pattern `useFetchFiltered` already uses elsewhere in the app.
- **Re-verified (round 2):** Reproduced again, deterministically, on both logouts performed in this round
  (`test@example.com`, once from `/day-planner/templates`, once from `/day-planner`) — same
  `AxiosError: Request failed with status code 401` on `GET /api/routine/settings` each time.

---

### P3. A stray debug `console.log` fires on every login attempt
- **Status:** open
- **Severity:** polish
- **Where:** `src/_common/modules/user/view/LoginView.vue:142` (`console.log(valid)`)
- **Expected:** No debug logging left in shipped framework code.
- **Actual:** Every submit of the login form (valid or not) logs the boolean validation result to the
  console.
- **Evidence:** Observed on every login attempt made this session.
- **Repro:** 1) Go to `/login`. 2) Submit the form (any input). 3) Check console for a bare `true`/`false` log.
- **Verify:** Repeat the repro; the observable pass condition is no such log line.
- **Suggested fix:** Delete the line.
- **Re-verified (round 2):** Reproduced again on every one of this round's login attempts (real account and
  both throwaway accounts alike) — `[LOG] true @ LoginView.vue:142` every time.

---

### ~~O1~~ — superseded by **X2** (round 2)
Round 1 filed this as an `opportunity`: Login and Registration handle a missing recaptcha token differently
(fail-open vs fail-closed). Round 2 confirmed live that the server accepts the empty token on `/auth/register`
exactly as it does on `/auth/login`, which reframes this from "the two views disagree" to "Registration is
completely unusable in this environment while the server would have accepted the request" — see **X2**
(blocker) above, which carries the full evidence and suggested fix. Kept here as a pointer, not duplicated,
so the tally isn't double-counted.

---

### ~~U1~~ — superseded by **B8** (round 3)
Filed `unverified` in rounds 1–2: the codes exist in the server response but `RegistrationView.vue` never
passes them to `QrCodeFor2FABody`, though the real submit path was blocked by X2 so the discarding itself was
only source-corroborated. Round 3 fixed X2 and reached the real dialog live — recovery codes confirmed absent
on screen. See **B8** above, which carries the full evidence and suggested fix. Kept here as a pointer, not
duplicated, so the tally isn't double-counted.

---

### U2. The 2FA login dialog is entirely untested
- **Status:** open
- **Severity:** unverified
- **Where:** `src/_common/modules/user/component/LoginVerifyQrCode.vue`
- **Actual:** No seeded account (`test@example.com`, `test2@example.com`, `admin@example.com` per
  `e2e/.state/seed.json`) has 2FA enabled, so this dialog — its OTP submission, its wrong-code path, its
  focus trap, and whether Escape closes it — could not be exercised.
- **Data needed:** A seeded account with 2FA enabled, or a way to enable it (which itself needs Registration
  or SecuritySection to work — see X2 and the user-settings unit).
- **Round 2 note:** Registered a real 2FA-enabled throwaway account via the direct-API workaround
  (`auth-mutation-throwaway-2fa@example.com`, confirmed `twoFactorEnabled: true` in the response — see U1).
  Still could not reach this dialog: the account also needs its e-mail confirmed before `/auth/login` will
  succeed at all (see B6 — an unconfirmed account gets a generic 401, never the 2FA challenge), and there is
  no way to confirm an e-mail without a real inbox in this environment. So even with a 2FA-enabled account in
  hand, `LoginVerifyQrCode.vue` remains unreachable for a different reason than originally stated. Both
  throwaway accounts were wiped by the end-of-pass reseed.

---

### U3. The reCAPTCHA v3 badge's show/hide behaviour is unverifiable in this environment
- **Status:** open
- **Severity:** unverified
- **Where:** `src/router.ts:107-112` (`afterEach`, toggles `.grecaptcha-badge` visibility based on
  `meta.showRecaptchaBadge`), all five routes in this unit carry `showRecaptchaBadge: true`
- **Actual:** With `VITE_RECAPTCHA_SITE_KEY` unset, the recaptcha script never loads, so no
  `.grecaptcha-badge` element ever exists in the DOM to check visibility on — confirmed via
  `document.querySelector('.grecaptcha-badge')` returning `null` on `/` while signed in.
- **Data needed:** A working `VITE_RECAPTCHA_SITE_KEY` in this dev environment.
- **Round 2 note:** Not independently re-checked this round (the DOM check itself is cheap but adds nothing
  new); `.env.development`'s `VITE_RECAPTCHA_SITE_KEY` was confirmed still empty while investigating X2, so
  the underlying condition is unchanged and this remains unreachable for the same reason.

---

### U4. The "too many failed attempts" and "locked out" login branches are unverified
- **Status:** open
- **Severity:** unverified
- **Where:** `LoginView.vue:173-193`
- **Actual:** Not tested — deliberately, since triggering a real lockout on the shared seeded
  `test@example.com` account risks locking out other units/agents running concurrently against the same
  backend. The exact server-side attempt threshold and lockout duration are unknown from the frontend alone.
- **Data needed:** A disposable account (not one of the three seeded ones) and knowledge of the server's
  throttle configuration, or explicit permission to lock out a seeded account temporarily.
- **Round 2 note:** This round demonstrated a safe way to get a disposable account (the direct-API
  registration workaround used for X2/B6/U1), which resolves the "risks the shared account" objection for a
  future pass — repeatedly failing login against a throwaway e-mail would be safe to lock out. Not attempted
  in this round because the end-of-pass cleanup was a full reseed, and deliberately locking an account right
  before a reseed wastes the attempt; a future pass could register a throwaway, fail its password
  deliberately enough times to trip the threshold, and observe both branches before reseeding.

---

### U5. The "redirected from registration" login prefill could not be exercised end-to-end
- **Status:** resolved — verified working as coded, not a defect
- **Severity:** unverified (kept for record continuity; no longer an open gap — see round 3 note)
- **Where:** `LoginView.vue:134-138` (`isRedirectedFromRegistration`, prefills e-mail, autofocuses password,
  shows the resend-confirmation panel)
- **Actual:** This state is set by a successful registration (`userStore.currentUser.email = ...` in
  `RegistrationView.vue:151`, followed by `goToLogin()`). Registration cannot complete in this environment
  (see X2), so this path was not reachable.
- **Data needed:** A working recaptcha site key, or the X2 fix that would let Registration reach the server
  with an empty token like Login does.
- **Round 2 note:** Still not reachable — the direct-API workaround used elsewhere in this round creates a
  real account, but does not run `RegistrationView.vue`'s own submit handler, so `userStore.currentUser.email`
  is never set and `isRedirectedFromRegistration` never flips true. This specific state can only be produced
  by the real component's code path succeeding, which X2 still blocks.
- **Round 3 note (resolved):** X2 fixed, so the real `RegistrationView.vue` submit handler now runs. Registered
  a throwaway account through the actual UI; on success the view navigated to `/login` and the snapshot showed
  all three claimed behaviours at once: the e-mail textbox pre-filled with `auth-retest-<ts>@example.com`, the
  password textbox marked `[active]` (autofocused — console also logged Chromium's own
  "Autofocus processing was blocked because a document already has a focused element" info line, consistent
  with an autofocus attempt firing), and a "Resend confirmation email" button rendered below the form (the
  resend-confirmation panel). Screenshot:
  `docs/views/auth/screenshots/login--redirected-from-registration.png`. All three claims in `LoginView.vue:134-138`
  confirmed live — this closes the gap; no defect found.

---

### U6. A stuck full-screen loading spinner on both confirm views is plausible but not confirmed live
- **Status:** open
- **Severity:** unverified
- **Where:** `ConfirmEmailView.vue:46-59`, `ConfirmEmailChangeView.vue:44-60` — `showFullScreenLoading()` is
  called on mount, but neither view's `.catch()` calls `hideFullScreenLoading()`, and the global axios
  interceptor only auto-hides it on a **successful** response (`_common/axiosConfig.ts:148-153`), never on
  an error.
- **Actual:** Source reading strongly suggests any error response should leave the full-screen spinner
  stuck. In practice, across three separate live attempts (including one where `playwright-cli route` was
  used to try to stall the request open), **no stuck spinner was observed** — the error state rendered
  normally every time. The route-interception attempt did not actually hold the request open (it resolved
  anyway), so this is not a clean disproof either; the test was inconclusive, not negative.
- **Evidence:** `docs/views/auth/screenshots/confirm-email--loading-midflight.png` shows the error state
  already rendered despite the route interception meant to stall it.
- **Data needed:** A reliable way to hold `POST /auth/confirm-email` open for several seconds (e.g. a real
  network-conditions throttle rather than a no-op route handler) to observe the spinner mid-flight and after
  the eventual error.
- **Suggested fix (if confirmed):** Add `.finally(() => hideFullScreenLoading())` to both views' request
  chains, matching the pattern already used correctly in `LoginView.vue` and `RegistrationView.vue`.
- **Round 2 note:** Repeated the plain (non-throttled) repro twice more on `/confirm-email` — both times
  `document.querySelector('.v-dialog--fullscreen')` returned nothing once the error state (the "Resend
  confirmation email" button) had rendered, i.e. still no stuck spinner observed, now four attempts in. New
  detail: the initial `/auth/confirm-email` request on a no-params visit returns **415** (not a generic
  network failure) — `API.post('/auth' + fullPath)` sends no body/content-type, which the server rejects as
  an unsupported media type — so the source-read theory has now been checked against a real, specific status
  code rather than only a hypothetical. Still no working way in this environment to hold the request open
  long enough to catch the spinner mid-flight (no network-conditions throttle available via
  `playwright-cli`), so this stays `unverified` rather than closed — the code-level gap (no `.finally` on
  either view's error path) is real regardless of whether four fast-localhost attempts happened to catch it.
