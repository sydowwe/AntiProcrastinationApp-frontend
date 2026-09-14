# auth — findings

> Pass: inventory · captured 2026-09-14 · commit `6aac48bb`

**Tally:** blocker 1 · bug 5 · a11y 1 · polish 3 · opportunity 1 · unverified 6

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-14 | `6aac48bb` | initial inventory pass |

---

### X1. The forgotten-password flow cannot ever succeed — `recaptchaToken` is never sent
- **Status:** open
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

---

### B4. ConfirmEmailView's error state shows no explanation, unlike its sibling
- **Status:** open
- **Severity:** bug
- **Where:** `src/_common/modules/user/view/ConfirmEmailView.vue:15-26` (compare `ConfirmEmailChangeView.vue:15-25`)
- **Expected:** Consistent sibling views — `ConfirmEmailChangeView`'s error state shows a persistent
  localized explanation plus a "Go to login page" recovery button. A user landing on a broken/expired
  confirmation link deserves the same on `/confirm-email`.
- **Actual:** `ConfirmEmailView`'s error branch renders only the "Resend confirmation email" button. The
  explanatory line is present in the template as a **commented-out** `<span>{{ i18n.t('') }}</span>`
  (line 19, with an empty translation key even if uncommented) and a transient snackbar that has usually
  already dismissed by the time a user reads the page. There is also no "go to login" escape hatch if the
  resend doesn't apply to the visitor's situation (e.g. the account is already confirmed and the link is
  just stale).
- **Evidence:** `docs/views/auth/screenshots/confirm-email--no-token-error.png` vs
  `docs/views/auth/screenshots/confirm-email-change--no-token-error.png` — the second visibly has persistent
  body text, the first does not.
- **Repro:** 1) Visit `/confirm-email` with no query params. 2) Observe only a red "Resend confirmation
  email" button with no other text on the page (after the snackbar dismisses).
- **Verify:** Repeat the repro; the observable pass condition is a persistent, non-snackbar sentence
  explaining the failure, visible alongside the Resend button.
- **Root cause guess:** Dead code left mid-edit — the commented span was clearly meant to hold this text and
  was never finished.
- **Suggested fix:** Uncomment the span and give it a real key (e.g. reuse
  `authorization.errorConfirmingEmail`, already used for the snackbar), and add a "go to login" button
  mirroring `ConfirmEmailChangeView`'s.

---

### B5. ConfirmEmailView's resend-failure message is a hardcoded English literal
- **Status:** open
- **Severity:** bug
- **Where:** `src/_common/modules/user/view/ConfirmEmailView.vue:69` (`showErrorSnackbar('Error')`)
- **Expected:** Localized text, per CLAUDE.md, and consistent with the same view's own initial-confirm catch
  three lines above (`ConfirmEmailView.vue:55`), which correctly uses `i18n.t('authorization.errorConfirmingEmail')`.
- **Actual:** Clicking "Resend confirmation email" on a failure shows a snackbar reading literally `Error`.
- **Evidence:** `docs/views/auth/screenshots/confirm-email--resend-error.png`.
- **Repro:** 1) Visit `/confirm-email` with no query params (so `userId` is `undefined`). 2) Click "Resend
  confirmation email". 3) Observe the snackbar reads exactly `Error`.
- **Verify:** Repeat the repro; the observable pass condition is a full, localized sentence in the snackbar,
  not the bare word "Error".
- **Suggested fix:** `showErrorSnackbar(i18n.t('authorization.errorResendingConfirmationEmail'))` (new key)
  or reuse an existing generic failure key.

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

---

### O1. Login and Registration disagree about what to do when recaptcha can't produce a token
- **Status:** open
- **Severity:** opportunity
- **Where:** `LoginView.vue:145-146` vs `RegistrationView.vue:136-140`
- **Expected/observed:** Under an unset `VITE_RECAPTCHA_SITE_KEY` (this dev environment), `executeRecaptcha`
  resolves to an empty string rather than hanging (a documented, deliberate fix). Login sends that empty
  string anyway and lets the server decide ("fail open" to the network) — CLAUDE.md notes this is why the
  login form "now at least reaches the server" locally. Registration instead checks `if (!recaptchaToken)`
  and refuses to submit at all, showing `authorization.recaptchaFailed` client-side ("fail closed").
- **Why it's worth a look:** Neither behaviour is wrong on its own, but the two views handle the identical
  missing-site-key condition in opposite ways, which is confusing to debug (as this pass demonstrates —
  Login "worked" enough to reach the server while Registration silently refused) and makes local development
  and manual QA of the registration flow impossible without a real site key, unlike login.
- **Evidence:** Live: submitting Login with a wrong password reaches the server (401 with a real body);
  submitting Registration with a fully valid form never issues a network request at all — see
  `docs/views/auth/screenshots/registration--recaptcha-failed.png`.
- **Suggested fix:** Decide one policy and apply it to both — most likely, match Login's fail-open behaviour
  so Registration is at least locally testable end-to-end, since the server is the real enforcement point
  either way.

---

### U1. Registration's 2FA recovery codes are received and then discarded
- **Status:** open
- **Severity:** unverified
- **Where:** `src/_common/modules/user/view/RegistrationView.vue:152-161`, `src/_common/modules/user/component/dialogs/QrCodeFor2FABody.vue`
- **Expected:** Same expectation as the already-filed `prompts/_done/user/framework/F1-2fa-recovery-codes.md`
  (which covers the *regenerate* path in settings): a user enabling 2FA must be shown their recovery codes at
  least once, with a way to save them, or they can be locked out of their own brand-new account the first
  time they lose their authenticator.
- **Actual (source read only, not reproduced in this pass):** `RegistrationView.vue` checks
  `response.data.recoveryCodes` for truthiness to decide whether to open the QR dialog or show an error, but
  only ever passes `response.data.qrCode` into `QrCodeFor2FABody` — the component doesn't even declare a
  `recoveryCodes` prop. The codes are in the response and are never rendered anywhere.
- **Evidence:** Source read only. Could not reproduce in the browser: completing registration requires a
  real recaptcha token, and `VITE_RECAPTCHA_SITE_KEY` is unset in this dev environment, so Registration's
  own client-side guard (see O1) refuses every submission before the server is ever called — the 2FA-enabled
  success branch is unreachable here.
- **Repro (untested):** Would require a working recaptcha site key: register with "use 2FA" checked, and
  observe whether the recovery codes appear anywhere in the resulting dialog.
- **Verify:** Once reachable, confirm the QR dialog (or a follow-up dialog) lists the recovery codes with a
  copy/download affordance, matching whatever F1's eventual fix does for the regenerate path.
- **Root cause guess:** Same shape of gap as F1 — likely the same original oversight, just on the enrollment
  path instead of the regenerate path. Worth fixing together if F1 is ever picked up.
- **Suggested fix:** Extend `QrCodeFor2FABody` (or open a second dialog after it closes) to accept and
  display `recoveryCodes`, mirroring whatever F1 lands on.

---

### U2. The 2FA login dialog is entirely untested
- **Status:** open
- **Severity:** unverified
- **Where:** `src/_common/modules/user/component/LoginVerifyQrCode.vue`
- **Actual:** No seeded account (`test@example.com`, `test2@example.com`, `admin@example.com` per
  `e2e/.state/seed.json`) has 2FA enabled, so this dialog — its OTP submission, its wrong-code path, its
  focus trap, and whether Escape closes it — could not be exercised.
- **Data needed:** A seeded account with 2FA enabled, or a way to enable it (which itself needs Registration
  or SecuritySection to work — see O1 and the user-settings unit).

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

---

### U5. The "redirected from registration" login prefill could not be exercised end-to-end
- **Status:** open
- **Severity:** unverified
- **Where:** `LoginView.vue:134-138` (`isRedirectedFromRegistration`, prefills e-mail, autofocuses password,
  shows the resend-confirmation panel)
- **Actual:** This state is set by a successful registration (`userStore.currentUser.email = ...` in
  `RegistrationView.vue:151`, followed by `goToLogin()`). Registration cannot complete in this environment
  (see O1), so this path was not reachable.
- **Data needed:** A working recaptcha site key, or the O1 behaviour change that would let Registration
  reach the server with an empty token like Login does.

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
