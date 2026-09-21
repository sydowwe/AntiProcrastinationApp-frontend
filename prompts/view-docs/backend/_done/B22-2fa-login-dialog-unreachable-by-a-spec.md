# B22 · Backend ask — no spec can reach the 2FA login dialog, because the TOTP secret only ever leaves the server as a picture

**Contract only.** Either a seeded account whose secret the seed response returns, or the secret as a string next
to the QR the enrolment already returns — the backend picks. Nothing here prescribes how the key is stored.

> Written 2026-09-21 from `docs/views/_fix-queue.md` → *Needs verification* → `auth/U2` (*"Route (a) is a
> one-paragraph seed ask if the operator wants a spec; it belongs in `B3`'s family"*). `B3` is closed and in
> `_done/`, so this is the family's next file rather than an edit to a landed one. **Blocking nothing** — one
> `test.fixme` in `e2e/tests/auth.draft.spec.ts` and the `LoginVerifyQrCode` dialog's only automated
> coverage. Read the API repo's `docs/e2eTestSeed.md` → *What belongs in the fixture* before deciding; the
> argument below is written against its three questions.

---

## The problem

`LoginVerifyQrCode.vue` — the dialog a 2FA-enabled account sees after a correct password, posting
`POST /auth/login/2fa { email, token, stayLoggedIn }` (`:58-62`) — has never been exercised by a spec, and
unit 15's three rounds could not reach it by hand either. The sweep's honest state for it is *unverified*
(`auth/U2`), and `auth.draft.spec.ts:104` holds a `test.fixme` for the registration-side twin.

A spec needs two things to drive it: **a confirmed account with 2FA enabled**, and **that account's TOTP secret**
so it can generate a valid code (`otplib`'s `authenticator.generate(secret)`). Run through the fixture's
admission rule:

1. **Can the spec read what is already there?** No — no fixture account has `TwoFactorEnabled`
   (`E2eFixtureSeeder.cs` seeds `10001`–`10003` through `CreateAccountAsync` with no authenticator key).
2. **Can the app itself create it?** Only half of it. A spec *can* enrol 2FA on a fixture account through the
   settings path (`POST /user/2fa/...` behind `VerifyUserForm`), and `freshSeed` would contain the damage. But
   the enrolment response is `TwoFactorAuthResponse { TwoFactorEnabled, QrCode, RecoveryCodes }`
   (`TwoFactorAuthService.cs:46,59`), and **`QrCode` is a base64 PNG** — `GenerateQrCode` builds the
   `otpauth://` URI and immediately renders it through QRCoder (`:161-175`); the secret string is never on the
   wire. A spec would have to decode a QR image to get it. That is the wall, and it is a contract wall, not a
   fixture one.
3. **Is it a state the app has no way to produce?** As far as a spec is concerned, yes — by the reasoning
   above. Registration does not help either: a freshly registered throwaway is unconfirmed, and an
   unconfirmed account is refused at the gate before 2FA is ever consulted (`B13`; the `PreSignInCheck`
   short-circuit). Confirming it needs an inbox.

There is also a **user-facing** gap behind the spec's: the enrolment screen says only *"Scan the QR code in
your authentication app"* (`user.en.ts:62`). A user whose authenticator lives on the same device they are
enrolling from — a desktop password manager, or the app open on the one phone they have — cannot scan
their own screen, and there is no *"or enter this key manually"* fallback because the key is not sent.
ASP.NET Identity's own default UI shows both.

## The business rules

1. **The secret is the account's; showing it to the account at enrolment time is not a disclosure.** It is
   what the QR *contains*. Nothing below asks for it to be readable later — `GET /user/2fa/...` re-issuing the
   *existing* key's QR (`SetUpTwoFactorAuth`'s `existingKey` branch, `:41-46`) is the one place it already
   comes back, and it comes back as a picture; the same rule applies to the string.
2. **A seeded 2FA account must be confirmed** — otherwise it hits `B13`'s gate, not the dialog.
3. **It must be its own account.** `primaryUser` signs in everywhere (enabling 2FA on it breaks every
   spec's `authenticatedPage`); `secondaryUser` is `account-isolation.spec.ts`'s; `adminUser` carries
   the only `Admin` role. A fourth account is the `B3` precedent (*"A second account"* is rule 3's own example).
4. **Fixture version bumps** — a new account in the response is a shape a spec can notice
   (`EXPECTED_FIXTURE_VERSION` in `e2e/fixtures/seed.ts` pins `e2e-v4`).

## The shape the frontend needs

**Option (b) — the manual-entry key, preferred.** `TwoFactorAuthResponse` gains one field:

```json
{ "twoFactorEnabled": true, "qrCode": "<base64 png>", "sharedKey": "JBSWY3DPEHPK3PXP", "recoveryCodes": [ "..." ] }
```

- `sharedKey` — the base32 authenticator key exactly as it appears in the `otpauth://` URI's `secret=`. Present
  whenever `qrCode` is; absent otherwise. The client renders it under the QR as the manual-entry fallback
  (`QrCodeFor2FABody.vue`), and a spec enrols on `secondaryUser` under
  `test.use({ freshSeed: true })`, reads it, signs out, and drives the dialog. Fixture unchanged; no version bump.

**Option (a) — a seeded account, if the backend prefers the fixture to carry it.** The seed response gains:

```json
"twoFactorUser": { "id": 10004, "email": "test2fa@example.com", "password": "testpass123", "locale": "EN",
                   "totpSecret": "JBSWY3DPEHPK3PXP" }
```

- Confirmed, `TwoFactorEnabled`, authenticator key provisioned to a **fixed** secret the response echoes, no
  other data, id in the account band, `FixtureVersion` → `e2e-v5`. `counts` unchanged.
- If a fixed key cannot be provisioned through `UserManager` cleanly, the *forced-setup* path the API's own
  `AuthFunctionalTests.cs:90-153` already exercises is the fallback: seed the account `TwoFactorEnabled` with
  **no** key, and let the spec provision it through `POST auth/login/2fa/setup` — but that response also
  carries only `QrCode` today, so this fallback needs (b)'s field anyway. Which is the reason (b) is preferred:
  it is the smaller change and it is the one that makes both routes work.

Either way, say which in the reply; the spec is written against the answer.

## What changes on the frontend once this lands

- `e2e/tests/auth.draft.spec.ts:104` — the `fixme` becomes a test: correct password → the dialog
  (`getByRole('dialog')`, `VOtpInput`), a wrong code → the inline error line, `otplib`-generated code →
  `POST /api/auth/login/2fa` 200 → `/`. Plus the two things `auth/U2` wanted seen with it: Escape under
  `FW1`'s `persistent` default, and the `FW11` redirect line.
- With (b): `QrCodeFor2FABody.vue` — the one dialog body `SecuritySection`, `RegistrationView` and
  `LoginView` all mount for the QR — renders `sharedKey` under the image with a `user.enterKeyManually`
  label (SK + EN); one row, one file. With (a): `e2e/fixtures/seed.ts` types
  `twoFactorUser` and bumps `EXPECTED_FIXTURE_VERSION`; `auth.ts` gains no fixture (the spec signs in
  by form on purpose, that is the thing under test).
- `docs/views/_fix-queue.md` `auth/U2` closes; `user-settings/U1`'s enrolment half gets its first
  automated pass through the same secret.

BACKEND RESPONSE (2026-09-21):

B22 — answered: option (b), landed.

Framework 6ade033 (Sydowwe.Framework, on main) + host 74318d1 (dev). No fixture change, no version bump —
EXPECTED_FIXTURE_VERSION stays e2e-v4.

Contract

TwoFactorAuthResponse gains one field:

{ "twoFactorEnabled": true, "qrCode": "<base64 png>", "sharedKey": "JBSWY3DPEHPK3PXP", "recoveryCodes": ["..."] }

- sharedKey — the base32 authenticator key exactly as Identity stores it and as it appears in the otpauth://
  URI's secret=. Uppercase A–Z / 2–7, no padding. Feed it straight to authenticator.generate(sharedKey) —
  otplib's defaults (SHA-1, 6 digits, 30 s) are what the server verifies against.
- Present whenever qrCode is, absent otherwise. That covers every route that returns the record: POST
  /user/2fa (toggle on — both first-time and the re-render of an existing key), POST /user/2fa/reset, POST
  /auth/login/2fa/setup, and the registration response when 2FA is ticked. recoveryCodes behaviour is
  unchanged (absent on the re-render branch).
- It is the same information the QR already encoded, to the same caller behind the same gates — not a
  test-only field, and not environment-gated. Render it.

Verified server-side — AuthFunctionalTests.SetupTwoFactorForLogin_WithPendingCookie_ProvisionsAuthenticator
now asserts sharedKey equals the stored key, computes a TOTP from the string alone, and completes the login:
auth/login 200 → auth/login/2fa/setup 200 → auth/login/2fa 204. So the path the spec takes is proven
end-to-end on the API side.

What's yours

- QrCodeFor2FABody.vue — render sharedKey under the QR with a user.enterKeyManually label (SK + EN). One row;
  the one body that SecuritySection, RegistrationView and LoginView all mount.
- e2e/tests/auth.draft.spec.ts:104 — fixme → test. Suggested shape: test.use({ freshSeed: true }), sign in as
  secondaryUser, enrol through the settings path, read sharedKey from the POST /api/user/2fa response, sign
  out, form-login → getByRole('dialog') + VOtpInput, wrong code → inline error,
  authenticator.generate(sharedKey) → POST /api/auth/login/2fa 204 (not 200 — it's NoContent) → /. Plus Escape
  under FW1's persistent default and the FW11 redirect line.
- docs/views/_fix-queue.md: close auth/U2; user-settings/U1's enrolment half gets its first automated pass
  through the same secret.

One caution for the spec: the validate step is single-use per password step — a wrong code consumes the
pending token, so the "wrong code → error" assertion and the "right code → 204" assertion each need their own
password login, or do the wrong-code check in a separate test.

FRONTEND HALF (2026-09-21):

Landed as described in `docs/views/_fix-queue-log.md` §17. Four things the reply's "what's yours" did not
know, all recorded there:

- **`LoginView` does not mount `QrCodeFor2FABody`** — it mounts `LoginVerifyQrCode` (the code dialog), and the
  client never calls `/auth/login/2fa/setup` (`requiresTwoFactorSetup` on the login response is ignored). The
  body has two mounts, `SecuritySection` and `RegistrationView`; both now pass `sharedKey`.
- **The settings enable path never opened the body at all.** `onToggleTwoFactorAuth` showed the recovery codes
  and dropped the QR, so the render the reply asked for would have been reachable only through
  *Show 2FA QR code* — a reset. Fixed in the same framework commit (QR first, then codes), and the reset
  handler now shows the codes the reset regenerates instead of discarding them.
- **`auth.draft.spec.ts:104` is the registration twin (`FW14`), and it stays a fixme** — registration still
  discards its recovery codes, so the test the reply sketched lives in a new `two-factor.spec.ts` — its own
  file because `POST /auth/login` is 5 hits/min per IP and, folded into `auth.spec.ts`, its second sign-in
  was the run's sixth (a 429). The wrong-code check is in the same test as the right-code one, each behind
  its own password step, exactly as the caution says.
- `otplib` is v13 — `generate({ secret })`, not `authenticator.generate(secret)`; the defaults are the same.
