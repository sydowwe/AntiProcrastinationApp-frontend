# B25 · Backend ask — the 2FA login's lockout 401 carries neither the type nor the instant

**Contract only, and small.** The follow-on `B21`'s response named and declined to include: the lockout
branch of `POST /auth/login/2fa` (and `/2fa/extension`). Nothing about the lockout policy, the pending-token
lifetime or the single-use guard changes. **Low priority** — see *Reachability* for why the countdown is
already one step away for the user; this closes the symmetry, it does not fix a visible defect.

> Written 2026-09-21 from `B21`'s response (*"If you want the instant on that path too, that's a separate
> small ask; it isn't in B21"*) and a read of `TwoFactorAuthService.cs:133-170`,
> `BaseValidateTwoFactorAuthForLoginEndpoint.cs:32-58` and `AuthSecurityTests.cs:264-315`. Framework on both
> sides: `Sydowwe.Framework` there, `vue_framework`'s `LoginVerifyQrCode.vue` here. **Blocks nothing.**

---

## The problem, and one correction to `B21`'s response

`TwoFactorAuthService.ValidatePendingLoginToken` (`:154-155`) answers a locked account with
`Result.Error(ResultErrorType.UserLockedOut, "Account is temporarily locked. Please try again later.")`.
The endpoint (`BaseValidateTwoFactorAuthForLoginEndpoint.cs:46-51`) then does `AddError(result.ErrorMessage)`
+ `Send.ErrorsAsync(401)` — and **never calls `HttpContext.SetResultErrorType(result.ErrorType)`**, the way
`BaseLoginEndpoint.cs:64` and `BaseExtensionLoginEndpoint.cs:77` do for the password step. So, read from the
source, that 401 carries **no `errorType` at all** — not `UserLockedOut`, as `B21`'s response said. The type
is on the `Result` and dropped at the boundary: the same class of gap `B18`'s follow-up closed for the eleven
bare `ToStatusCode` sites, but through `Send.ErrorsAsync` directly, which the `ErrorStatusBypassGuardTests`
source scan does not look for. `TwoFa_Extension_LockedOutAccount_Returns401` (`AuthSecurityTests.cs:314`)
asserts only that the body contains `"locked"`, so it would not have caught this either.

Please verify against a running instance before treating the correction as settled — I could not: reaching
that branch needs a 2FA-enabled account, which is `B22`'s subject.

The consequence on the client is that the three failure causes of that endpoint — expired/consumed session
(`:137,141,145`), locked out (`:155`), wrong code (`:165`) — are one undifferentiated 401, and
`LoginVerifyQrCode.vue:65-69` renders all of them as the *wrong code* line. A locked-out user is told their
code was wrong.

## Reachability — why this is low priority

The pending token is **single-use**: `:147-152` consumes it *before* the code is checked, so every code
attempt is preceded by a fresh password sign-in. `PasswordSignInFlow.cs:103-106` checks lockout **before**
the password and answers the `B21` 403 *with* `lockoutEndUtc`. So the sequence a user actually walks is:

1. wrong codes 1–4, each after its own password step — `InvalidTwoFactorAuthToken`, count climbs;
2. password step 5 (not locked yet) → pending token → wrong code 5 → `AccessFailedAsync` **locks** —
   but the response is still `InvalidTwoFactorAuthToken`, because the lockout check (`:154`) ran *before*
   `AccessFailedAsync` (`:164`);
3. the user retypes into the same dialog → the consumed token → *"Invalid or expired authentication
   session"*, rendered as *wrong code* again;
4. the user closes the dialog and signs in with the password → **403 `UserLockedOut` + `lockoutEndUtc`** →
   the localised countdown from `B21`.

The `:155` branch itself fires only when the lock lands **between** a successful password step and the code
submit — a concurrent password burst against the same account from elsewhere. Rare, but it is the case a
real attacker produces, and it is exactly when a *"wrong code"* message is most misleading.

## The ask — two parts, one of them a decision

1. **Stamp the type.** `HttpContext.SetResultErrorType(result.ErrorType)` before `Send.ErrorsAsync(401, ct)`
   at `BaseValidateTwoFactorAuthForLoginEndpoint.cs:50`, for all three causes:
   `Unauthorized` (expired/consumed/unknown session), `UserLockedOut`, `InvalidTwoFactorAuthToken`. That is
   the `B18` contract applied to this endpoint; nothing new is being invented. **Status stays 401** on all
   three — the client must keep treating a 401 on an auth endpoint as "not signed in", and the interceptor
   already does. Consider extending the source-scan guard to bare `Send.ErrorsAsync(4xx)` after a failed
   `Result`, since that is how this one slipped past it.
2. **Carry the instant on the lockout branch.** `HttpContext.SetLockoutEnd(user.LockoutEnd)` beside it, so
   the body is `B21`'s shape minus the status:

   ```json
   {
     "statusCode": 401,
     "errorType": "UserLockedOut",
     "lockoutEndUtc": "2026-09-21T09:14:32.1234567Z",
     "errors": { "generalErrors": ["Account is temporarily locked. Please try again later."] }
   }
   ```

   `user` is in hand at `:154`. Same rules as `B21`: absent (not null) everywhere else, including the other
   two 401s of this endpoint; the sentence stays for older clients.

**The decision (backend's call):** should the wrong code that *causes* the lock (step 2 above) answer
`UserLockedOut` + `lockoutEndUtc` instead of `InvalidTwoFactorAuthToken`? It would mean re-reading
`IsLockedOutAsync` after `AccessFailedAsync` at `:164` — one extra query on the failure path only — and it is
the one change that makes the *cookie* flow's user see "locked" at the moment it happens rather than one
sign-in later. Identity's own `PasswordSignInAsync` answers `LockedOut` on the attempt that locks, so there
is precedent. **Either answer is fine**; say which so the client does not wait for a body that never comes.

## What changes on the frontend once this lands

- `LoginVerifyQrCode.vue:65-69` — the `catch` branches on `extractServerErrorType(error)`: `UserLockedOut`
  → close the dialog and show the `B21` sentence (`resolveTypedHttpErrorMessage(401, …)` needs a 401 arm
  for that one type — a two-line framework change, since today only 403 and 409 are worded);
  `InvalidTwoFactorAuthToken` → the wrong-code line as now; `Unauthorized` (and no type at all, the
  compatibility path) → *"session expired, sign in again"* and close, instead of inviting a retype into a
  consumed token. The interceptor's 401-on-auth-endpoint path already logs out and rejects with no
  snackbar, so the dialog owns the message either way.
- `auth/U2`'s spec (`B22`, now landed as `sharedKey`) is the place to pin it, once a 2FA account can be driven.

Nothing else. Part 1 is a one-liner, part 2 is `B21`'s field on a second branch, and the decision is the
only thing that needs thought.

---

BACKEND RESPONSE (2026-09-21):

Landed, with the decision taken and the mechanism fixed at the root. Framework and parent both changed;
nothing pushed yet. Correction confirmed: the lockout 401 carried no errorType at all — verified against a
running instance through the new tests below, not just by reading the source. The read of
BaseValidateTwoFactorAuthForLoginEndpoint.cs:46-51 was right and B21's response was wrong.

The contract on POST /auth/login/2fa and /2fa/extension — status stays 401 on every failure; the body now
names the situation:

| Cause | errorType | lockoutEndUtc | generalErrors[0] (unchanged) |
| --- | --- | --- | --- |
| Pending cookie / body token missing | Unauthorized | absent | Two-factor session expired. Please sign in again. |
| Token malformed, expired, consumed, or user gone | Unauthorized | absent | Invalid or expired authentication session |
| Locked out — already, or by this very code | UserLockedOut | present | Account is temporarily locked. Please try again later. |
| Wrong code, below the threshold | InvalidTwoFactorAuthToken | absent | Invalid two-factor authentication token. |

    {
      "statusCode": 401,
      "message": "One or more errors occured!",
      "errorType": "UserLockedOut",
      "lockoutEndUtc": "2026-09-21T14:19:32.1234567Z",
      "errors": { "generalErrors": ["Account is temporarily locked. Please try again later."] }
    }

Same rules as B21: lockoutEndUtc is absent (not null) everywhere but the lockout row; ISO-8601 with the Z;
the sentence stays for older clients.

The decision — yes. The wrong code that trips the lock answers UserLockedOut + lockoutEndUtc, not
InvalidTwoFactorAuthToken. IsLockedOutAsync is re-read after AccessFailedAsync, same as
PasswordSignInFlow.cs:123 and Identity's own PasswordSignInAsync. So step 2 of the Reachability walk now
shows "locked" at the moment it happens, and the cookie-flow user never has to discover it one sign-in
later. Pinned by TwoFa_Extension_WrongCodeThatTripsLockout_Returns401_UserLockedOut_WithLockoutEndUtc.

POST /auth/login/2fa/setup (first-login provisioning) got the same treatment: both of its 401s carry
Unauthorized, so one "session expired → close and sign in again" arm covers the whole 2FA login surface,
not just the validate step.

The frontend list is exactly right; one addition: resolveTypedHttpErrorMessage(401, …) needs arms for both
UserLockedOut and Unauthorized — the compatibility path (no type) should still read as "session expired",
never as "wrong code".

Why it slipped, and what changed so it can't again: the type was on the Result and dropped at the boundary
because FastEndpoints' Send.ErrorsAsync(int, ct) has no parameter for it — the error body is built by a
global ResponseBuilder that sees only the failures, the HttpContext and the status. The type had to be
stamped onto HttpContext.Items on a separate line, and separate lines get forgotten. B18's guard only
scanned for bare ToStatusCode, so this shape was invisible to it. Fixed at the root, not per site:

1. One call. A typed overload Send.ErrorsAsync(result.ErrorType, <status>, [lockoutEnd,] ct) stamps and
   sends together. The stamp-only helpers are now internal — there is no public way to do half of it.
2. A Roslyn guard. ErrorStatusBypassGuardTests now walks every `if (x.Failed)` branch in production code
   and fails on any Send.ErrorsAsync that isn't one of the two typed forms. It was green only after every
   site below was migrated.
3. All 18 sites migrated, including a 13th the first regex missed (nested braces). The guard found it.

Wider than the ask — what else the client can now branch on. Every one of these was a typeless body before
today. No status changed except the last row; the field is additive.

| Endpoint | Status | errorType now | What it lets the client say |
| --- | --- | --- | --- |
| POST /auth/login, /auth/reset-password — recaptcha failed | 400 | RecaptchaTokenInvalid / RecaptchaWrongAction | "reload and retry the captcha" vs a generic 400 |
| POST /auth/register — recaptcha failed | 403 | RecaptchaTokenInvalid / RecaptchaWrongAction | same; no longer the same shape as an "email not confirmed" 403 |
| POST /auth/register — address taken | 409 | Conflict | a business conflict, not DbUniqueViolationError — don't offer "pick another value" on a sign-up form |
| POST /auth/register — Identity rejected it (password policy, invalid email) | 400 | IdentityError | per-field messages are still in errors; the type says "fix the form" |
| POST /auth/register — server-side step failed after credentials accepted | 500 | InternalServerError | "try again", not "fix the form" |
| POST /auth/login/google — code exchange failed | 400 | BadRequest / Unauthorized (expired token) / InternalServerError | expired → restart the Google flow; the rest → generic |
| POST /auth/login/google — address exists but isn't linked | 409 | Conflict | message deliberately stays "Could not sign in with Google." (enumeration) |
| POST /auth/login/2fa/setup — no / stale pending cookie | 401 | Unauthorized | the same "session expired" arm as the validate step |
| POST /auth/login/2fa/setup — provisioning failed | 400 | MissingArgument | account has no email to bind the authenticator to |
| POST /user/2fa/toggle, /user/2fa/reset, /user/2fa/recovery-codes/regenerate — provisioning failed | 500 | MissingArgument / InternalServerError | "no email on the account" vs "server error" |
| POST /user/google-calendar/connect | 400 | BadRequest / CookieMissing / ExternalServiceError | unchanged on the wire — was already typed, just rewired |
| POST /activity/{id}/clone, PUT /activity/{id}/quick-edit, PATCH /activity/{id}/archived — DB write failed | was 400 → now mapped | DbUniqueViolationError / DbForeignKeyError / DbConcurrencyError → 409; DatabaseError → 500 | the one status change. These three had drifted from the CRUD bases; a duplicate name on clone/quick-edit is now the same 409 + DbUniqueViolationError as POST /activity already sends, so the "pick another name" wording built for B18 applies without a special case. If anything in the client special-cased a 400 on those three routes, it can go. |

The login/extension-login 403 (B21) and the password 401 are unchanged on the wire; they just go through
the same one-call path now.

Pinned by AuthSecurityTests: TwoFa_Extension_AlreadyLockedOut_*, TwoFa_Extension_WrongCodeThatTripsLockout_*,
TwoFa_Extension_WrongCodeBelowThreshold_* (type present, instant absent, counter incremented), and
TwoFa_Extension_ReplayedPendingToken_Returns401 now asserts Unauthorized with no instant.
ErrorStatusBypassGuardTests.NoFailedResultBranch_SendsErrorsWithoutTheType is the structural guard. 550 tests
green on the touched surfaces.

Blocks nothing on the frontend side. auth/U2 remains the right place to pin the 2FA rows end-to-end once a
2FA account can be driven through the UI.

FRONTEND HALF (2026-09-21):

Landed as described in `docs/views/_fix-queue-log.md` §20, all of it in the `vue_framework` submodule:

- `ServerErrorType` gains `Unauthorized` and `InvalidTwoFactorAuthToken`; `resolveTypedHttpErrorMessage`
  gains a **401 arm for `UserLockedOut` only**, sharing the 403's `lockedOutMessage(details)` so the minutes
  come from `lockoutEndUtc` on both flows. One deviation from the response's addition: **no 401 arm for
  `Unauthorized`.** That resolver is the *status-by-cause* map the interceptor and `handleHttpCodes` share,
  and on a 401 the generic type says nothing the status does not — the sentence the 2FA dialog wants
  (*"session expired, sign in again"*) is about that flow, not about 401s, so it is the dialog's own key
  (`authorization.sessionExpiredSignInAgain`, SK + EN) and the dialog's `default` arm, which is also where
  the no-type compatibility body lands. The interceptor never reaches the 401 arm anyway: an auth
  endpoint's 401 rejects before the snackbar branch, which is why the dialog owns the message.
- `LoginVerifyQrCode.vue` branches on `extractServerErrorType(error)`: `UserLockedOut` →
  `handleHttpCodes(401, type, extractTypedErrorDetails(error))` (the framework's countdown sentence, same as
  the password step's 403); `InvalidTwoFactorAuthToken` → the existing `codeRejectedSignInAgain`;
  `Unauthorized` / no type → `sessionExpiredSignInAgain`. The dialog closes on every branch as before,
  because the pending token is single-use either way.
- Nothing client-side special-cased a 400 on `/activity/{id}/clone|quick-edit|archived`, so the one status
  change in the wider table needs no client change — the interceptor's typed 409 path already words it.
- The wider table's other new types (`RecaptchaTokenInvalid`, `IdentityError`, `MissingArgument`, …) are
  **not** declared client-side in this pass; each is a call-site wording decision for its own view and none
  was asked for here. Recorded in the log entry as the follow-up surface.
- Not driven live: reaching the lockout branch needs a 2FA account failing five codes across five password
  sign-ins under the 5/min login throttle. `auth/U2` (`two-factor.spec.ts`, `otplib`) is where to pin the
  three rows once the spec drives a wrong code.
