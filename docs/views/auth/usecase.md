# auth — use cases

## What this unit is for

The five views a visitor reaches while **signed out**: creating an account, logging into an existing one,
recovering a forgotten password, and landing back from the two e-mailed confirmation links (initial signup,
and changing an e-mail address on an existing account). Everything here is framework code
(`_common/modules/user/`) — this app supplies only the legal-page routes the registration checkbox links to
and the recaptcha site key.

## Where it sits

Every other route in the app requires this module to succeed first: `router.ts`'s guard sends any signed-out
visitor to `/login` for anything not marked `public`. A user arrives here either cold (typing the app's URL,
or an e-mailed confirmation link) or bounced (an expired session, a 401, or a stale bookmark to a page that
needs auth). From here they either reach the rest of the app (`/`) or, for registration, are routed back to
`/login` to complete the loop. Nothing else in the app links *into* forgotten-password or the two confirm
views except the "Forgot password?" link on the login form itself and the e-mailed links.

## Views

### LoginView (`/login`)
**Purpose:** Authenticate an existing user, by password or Google sign-in, with an optional 2FA step.
**Who opens it and why:** Every signed-out visitor to a guarded route; a returning user typing the URL
directly.

**What the user can do**
- Sign in with e-mail + password, optionally checking "Stay logged in"
- Sign in with Google (opens Google's own OAuth flow — not exercised in this pass)
- Toggle password visibility
- Follow "Forgot password?" to `/forgotten-password`
- Follow "Register" to `/registration`
- Complete a 2FA one-time code in a dialog, if the account has it enabled

**What the user can see, and the question it answers**
- The wrong-password / locked-out / email-not-confirmed snackbar — answers "why didn't that work?", except
  the email-not-confirmed case does not actually fire any more: a genuinely unconfirmed account now gets the
  same generic "invalid email or password" as a wrong password (Findings B6, round 2 — live-confirmed with a
  real throwaway account).
- The "Resend confirmation email" prompt, shown after an unconfirmed-e-mail login attempt or right after
  registering — answers "how do I get another copy of that e-mail?" (the post-registration trigger for this
  panel remains unverified end-to-end — see U5 — since Registration itself cannot complete via the UI; see
  X2)

**Depends on:** `VITE_RECAPTCHA_SITE_KEY` (empty in this dev environment — see Findings U3); the server's
exact error-message strings, which the client string-matches to choose a snackbar (Findings U4).

### RegistrationView (`/registration`)
**Purpose:** Create a new account, optionally with 2FA enabled from the start.
**Who opens it and why:** A visitor without an account, from the login screen's "Register" link.

**What the user can do**
- Enter e-mail + password (+ confirmation), with live validation
- Opt into 2FA at signup
- Agree to terms and (if configured) a privacy policy, each a real link
- Submit, and either land on a QR-code dialog (2FA) or be routed to `/login` with the e-mail prefilled

**What the user can see, and the question it answers**
- Inline field validation (required, length, password match) — answers "what's wrong with my input?"
- The 2FA QR-code dialog — answers "how do I finish setting up my authenticator?"

**Depends on:** `installFramework({ legalRoutes })` in `main.ts` for where the terms/privacy links resolve
(this app: `/legal/terms`, `/legal/privacy`); `VITE_RECAPTCHA_SITE_KEY`, which — unlike Login — blocks
submission entirely when absent (Findings X2, round 2 — confirmed live that the server would have accepted
the request; escalated from round 1's O1).

### ForgottenPasswordView (`/forgotten-password`)
**Purpose:** Request a password-reset e-mail.
**Who opens it and why:** A user who can't log in, from Login's "Forgot password?" link.

**What the user can do**
- Enter an e-mail and submit

**What the user can see, and the question it answers**
- A confirmation dialog ("Password reset email has been sent") — answers "did that work?"
- In this pass, instead: a generic error snackbar every time (Findings X1) — the flow cannot currently
  succeed for any input.

**Depends on:** recaptcha, more strictly than any other view here — see X1.

### ConfirmEmailView (`/confirm-email`)
**Purpose:** Complete the e-mail-confirmation step of registration, from an e-mailed link.
**Who opens it and why:** Clicking the confirmation link sent right after registering.

**What the user can do**
- Nothing on a successful confirmation but click through to `/login`
- On failure, click "Resend confirmation email"

**What the user can see, and the question it answers**
- Success message + "Go to login" button
- Failure: only a "Resend confirmation email" button, no explanatory text (Findings B4)

**Depends on:** a real token in the URL, e-mailed by the server. Not obtainable in this pass — the happy
path is documented as unverified (Findings U6 in spirit; recorded inline in inventory.md instead since it's
a per-view state, not a separate defect).

### ConfirmEmailChangeView (`/confirm-email-change`)
**Purpose:** Complete an e-mail-address-change confirmation, from an e-mailed link.
**Who opens it and why:** Clicking the confirmation link sent after requesting an e-mail change in
settings.

**What the user can do**
- Nothing on success but click through to `/login`
- On failure, click "Go to login page" directly (no resend option — an e-mail change has no equivalent)

**What the user can see, and the question it answers**
- Success message + "Go to login" button
- Failure: a proper localized explanation + "Go to login page" button — the more complete of the two
  confirm views (see B4's comparison)

**Depends on:** `userId`, `email` and `token` query params from the e-mailed link.

## Entity lifecycle

**Round 2 (mutation pass):** the account entity's real create/verify lifecycle could not be driven through
this unit's own UI — `RegistrationView`'s own client-side guard refuses to submit in this environment (X2).
To still exercise the rest of the unit, two throwaway accounts were created via a direct
`POST /auth/register` call (bypassing only the guard, not the server) —
`auth-mutation-throwaway-1@example.com` (plain) and `auth-mutation-throwaway-2fa@example.com`
(`twoFactorEnabled: true`). Both confirmed created (`200`, real `qrCode`/`recoveryCodes` for the 2FA one).
Neither could be confirmed (no real inbox in this environment) or logged into (B6: an unconfirmed account's
login attempt is indistinguishable from a wrong password), so the lifecycle stops at "created, unconfirmed"
for both. Both were wiped by the end-of-pass `POST /api/test/seed` reseed — no residue left behind.

In general: an account is created by `POST /auth/register`, authenticated by `POST /auth/login`
(+ `POST /auth/login/2fa`), and this module never deletes one — that lives in the user module's settings
surface (`_common/modules/user/component/settings/SecuritySection.vue`, out of this unit).

## Data this unit captures but does not spend

- **2FA recovery codes issued at registration** (`response.data.recoveryCodes` in `RegistrationView.vue:154`)
  are checked for truthiness to decide which branch to take, then discarded — never passed to
  `QrCodeFor2FABody` or shown anywhere. See Findings U1 — round 2 confirmed live (via the direct-API
  workaround) that the server really does return real recovery codes for a 2FA registration, strengthening
  what was previously a source-only claim, though the actual on-screen discarding still couldn't be driven
  through the real UI path. This is the same shape of bug as the already-filed
  `framework/F1-2fa-recovery-codes.md` (which covers the *regenerate* button in settings), but it is the
  *initial-enrollment* path and is not yet asked for.
- **The `redirect` query param the axios interceptor attaches on a forced 401 logout**
  (`_common/axiosConfig.ts:175`) is written but nothing ever reads it back — see Findings B1, re-confirmed
  round 2.
