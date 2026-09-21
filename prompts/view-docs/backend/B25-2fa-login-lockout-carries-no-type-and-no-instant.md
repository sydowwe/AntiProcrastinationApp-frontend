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
