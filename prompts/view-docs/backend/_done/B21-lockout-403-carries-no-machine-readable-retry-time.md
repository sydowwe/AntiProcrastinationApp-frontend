# B21 · Backend ask — the lockout 403 carries the remaining time only inside an English sentence

**Contract only.** One field on the body the sign-in flow already sends when an account is locked out. How the
lockout is computed, stored or configured stays exactly as it is.

> Written 2026-09-21 from `docs/views/_fix-queue.md` → *Needs verification* → `auth/U4`, which settled the
> numbers from the API source and named the ceiling: *"the countdown is server-only, so that is the ceiling
> without a contract change."* This is that contract change. **Blocking nothing** — a follow-on to `B18`, which
> gave the client the *type* of this 403 but not the one fact the user needs from it. Framework on both sides:
> `Sydowwe.Framework` there (`PasswordSignInFlow.cs`), `vue_framework` here (`LoginView.vue`,
> `ErrorHandlingFunctions.ts`).

---

## The problem

`PasswordSignInFlow.cs:165-172` answers a locked-out sign-in with **403**, `errorType: "UserLockedOut"` (since
`B18`), and one string in `errors.generalErrors`:

```
"Too many failed login attempts. Try again in {minutes}m {seconds}s"
```

The remaining time — the only thing a locked-out user actually wants to know — exists nowhere else on the
response. So the client has two options, and today it ships both:

- `LoginView.vue:180-185` finds the sentence by **substring** (`e.includes('Too many failed login attempts')`)
  and shows it verbatim — so a Slovak UI shows an English sentence with the countdown in it. The comment at
  `:173-179` explains why it cannot do better: the text is interpolated, so it cannot be matched exactly and
  cannot be translated.
- `ErrorHandlingFunctions.ts:81-82` branches on the type `B18` added and shows `httpErrors.forbiddenLockedOut`
  — *"Príliš veľa neúspešných pokusov o prihlásenie. Skúste to znovu neskôr."* Localised, but **the
  countdown is gone**: the sentence has to say *"try again later"* because the client cannot say how much
  later without parsing English prose, which the `B18` contract itself forbids (*"branch on them; never
  word-match `message`"*).

Either the user gets the number in the wrong language, or the right language without the number.

## The business rules

1. **Lockout is 5 failed attempts, 5 minutes** (`IdentityServiceExtensions.cs:128-129`). None of that
   changes; the client does not need the policy, only the deadline for *this* account.
2. **The status stays 403** and `errorType` stays `UserLockedOut` — `B18`'s note that this is deliberately not
   a 423 stands. `auth/B6` (unconfirmed e-mail is also 403) is unaffected.
3. **The message may stay as it is.** Older clients word-match it; nothing here asks to remove or reword it.
   Once the field exists, this client stops reading the sentence.
4. **Enumeration safety is unchanged** — the flow already checks lockout before the password
   (`PasswordSignInFlow.cs:101-104`) and only a locked account reaches this branch, so the field leaks nothing
   an attacker did not already get from the 403 itself.

## The shape the frontend needs

On the lockout 403 body only, one added field:

```json
{
  "statusCode": 403,
  "errorType": "UserLockedOut",
  "lockoutEndUtc": "2026-09-21T09:14:32Z",
  "errors": { "generalErrors": ["Too many failed login attempts. Try again in 4m 32s"] }
}
```

- **`lockoutEndUtc`** — ISO-8601, UTC, the instant the lock lifts. This is `LockoutEnd` as the flow already
  reads it at `:167`; the client subtracts its own clock. An absolute instant is preferred over a
  `retryAfterSeconds` count because the snackbar can keep counting down without a second request — but a
  seconds count is acceptable if that is the convention the backend wants (say which). A `Retry-After`
  header is **not** enough on its own: the interceptor reads bodies, not headers, and `handleHttpCodes`
  receives no headers at all.
- **Absent** — not null — on every other 403, the way `errorType` is absent when the server has nothing
  better than the status. The client falls through to today's sentence when it is missing, so a server
  without this change is indistinguishable from today.
- Endpoint: `POST /auth/login`, and whichever other entry points share `PasswordSignInFlow` (the 2FA and
  Google sign-in paths reuse it per its own header comment — `:73-76`). Not hot.

## What changes on the frontend once this lands

- `LoginView.vue:173-185` — the substring match and its seven-line justification are deleted; the branch
  becomes `errorType === 'UserLockedOut'` and reads `lockoutEndUtc`.
- `ErrorHandlingFunctions.ts:81-82` and `httpErrors.forbiddenLockedOut` (SK + EN) — the sentence gains the
  time (*"Skúste to znovu o {minutes} min"*), formatted by the client in the account's locale, with
  today's wording as the fallback when the field is absent.
- `docs/views/_fix-queue.md` `auth/U4` — the *"ceiling without a contract change"* note is retired, and its
  repro (register a throwaway, fail six times, read the snackbar, reseed) becomes the verification: the
  snackbar reads a Slovak sentence with a number in it.

Nothing else. The change is one field wide on both sides.

BACKEND RESPONSE (2026-09-21):

B21 · Backend response — lockoutEndUtc is on the lockout 403

Landed 2026-09-21 in Sydowwe.Framework (uncommitted in the framework/ submodule at time of writing — will be
pushed with the B21 commit). One field, exactly the shape you asked for. Nothing about the policy, storage,
status or message changed.

The contract

On a locked-out sign-in, the body is:

{
  "statusCode": 403,
  "message": "One or more errors occured!",
  "errors": { "generalErrors": ["Too many failed login attempts. Try again in 4m 32s"] },
  "errorType": "UserLockedOut",
  "lockoutEndUtc": "2026-09-21T09:14:32.1234567Z"
}

- lockoutEndUtc — ISO-8601, UTC, Z suffix, fractional seconds present (7 digits, .NET default). new
  Date(lockoutEndUtc) parses it; don't regex the digit count. It's Identity's LockoutEnd verbatim — the
  instant the lock lifts. Subtract your own clock; a small negative remainder is possible on a client with
  clock drift, so clamp at zero before formatting.
- Absent, not null, on every other response — including the EmailNotConfirmed 403 and the 401. Test
  'lockoutEndUtc' in body, not === null. A backend without B21 is indistinguishable from an absent field, so
  your fallback to today's "try again later" wording is the compatibility path.
- Status stays 403, errorType stays UserLockedOut. Not a 423, deliberately (B18).
- The English sentence stays in generalErrors. It's for clients that predate this field. Stop reading it.
- No Retry-After header. Everything is in the body, as requested.

Which endpoints

The field comes from PasswordSignInFlow, so it's on both transports that share it:

- POST /api/auth/login (cookie flow, LoginView.vue)
- POST /api/auth/extension/login (token flow, browser extension)

Correction to the ask: the 2FA and Google paths do not reuse PasswordSignInFlow. POST /api/auth/login/2fa (and
/2fa/extension) has its own lockout branch that answers 401 with errorType: "UserLockedOut" and "Account is
temporarily locked. Please try again later." — no lockoutEndUtc there. If a user trips lockout by failing TOTP
codes after a correct password, you get the type but not the instant, and your absent-field fallback wording
is the right rendering. If you want the instant on that path too, that's a separate small ask; it isn't in
B21.

Google sign-in never goes through password lockout at all.

Verification

AuthSecurityTests.Login_LockedOut_Returns403_WithLockoutEndUtc seeds a user, trips 5 failures, posts to
auth/login, and asserts on the body: 403, errorType: UserLockedOut, sentence still present, lockoutEndUtc
present, ends in Z, lands in (now, now+5m]. The sibling EmailNotConfirmed test asserts the field is absent.

Your auth/U4 repro (register a throwaway, fail five times, read the snackbar, reseed) is now the end-to-end
check: the snackbar should read a Slovak sentence with a number in it. Note it's the 5th wrong password that
trips the lock and already returns the lockout 403 (same as Identity) — you don't need a 6th attempt.

Suggested client mapping

// ErrorHandlingFunctions.ts
if (body.errorType === 'UserLockedOut') {
  if (typeof body.lockoutEndUtc === 'string') {
    const msLeft = Math.max(0, new Date(body.lockoutEndUtc).getTime() - Date.now());
    const minutes = Math.ceil(msLeft / 60_000);
    return t('httpErrors.forbiddenLockedOutUntil', { minutes });   // "Skúste to znovu o {minutes} min"
  }
  return t('httpErrors.forbiddenLockedOut');                       // today's wording, field absent
}

Math.ceil so the user never reads "0 min" while still locked. LoginView.vue:173-185 (the includes('Too many
failed login attempts') branch and its justification comment) can be deleted outright; the interceptor branch
above covers it.

FRONTEND HALF (2026-09-21):

Landed as described in `docs/views/_fix-queue-log.md` §16. Two deviations from the suggested mapping, both
deliberate:

- The minutes are floored at **1**, not 0 — `Math.max(0, …)` then `Math.ceil` still yields `0` for a clock
  that has drifted past the instant, and the sentence would read *"o 0 min"* while the server still refuses.
- `LoginView.vue`'s branch is not deleted outright but replaced by `errorType === UserLockedOut → handled`.
  The snackbar is a single slot where the last call wins, and the view's `!handled` fallback shows
  `generalErrors[0]` — the English sentence — a tick after the interceptor's localised one. Deleting the
  branch would have brought the English text straight back.

The 2FA path is left as is. Filed as `B25` the same day at the owner's request — with a correction: read from
the source, `BaseValidateTwoFactorAuthForLoginEndpoint.cs:46-51` never stamps `result.ErrorType`, so that 401
carries no type at all, not `UserLockedOut`.
