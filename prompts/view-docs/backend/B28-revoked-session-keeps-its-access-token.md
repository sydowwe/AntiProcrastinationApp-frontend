# B28 · Backend ask — a revoked session keeps working until its access token expires

**Security, medium priority. Framework-side** (`Sydowwe.Framework`, `infrastructure/extService/user/auth/`).
Every revoke path kills the **refresh** token and leaves the **access** token valid for up to 15 minutes.
So *Revoke*, *Log out of all other devices*, a password change or reset and account deletion all take
effect at the next refresh, not at once. Nothing on the frontend has to change for the fix to land; the
client already handles the outcome (see *What the client does*).

> Written 2026-09-24 from the frontend's `user-settings/U2` check (log → *Closed verification items* →
> the 2026-09-24 sweep) and a read of `JwtService.cs`, `RefreshTokenService.cs`, `RefreshToken.cs`,
> `IdentityServiceExtensions.cs` and `UserDataExportAndDeletionTests.cs:739-755`. **Blocks nothing.** Read
> the code again before relying on any line number below.

---

## What was observed

Two browser sessions on the same account. Session A revoked session B from `/user/settings`:

- `DELETE /api/user/sessions/{id}` → **204**, the row disappears from the list. Correct.
- Session B's next page load: **every request 200**. It stays fully signed in: reads work, and so
  would writes.
- Session B's `POST /api/auth/refresh` → **401**. Only the renewal dies.

So a user who revokes a lost or stolen device has handed it, at worst, 15 more minutes of full access.

## Why, from the source

- **The access token is stateless and carries nothing that identifies the session.**
  `JwtService.CreateUserClaims` writes `sub`, `email`, a random `jti`, `iat`, `auth_method`, `client_type`
  and the roles. The `jti` is fresh per mint and stored nowhere. `AccessTokenExpiry` is
  `UtcNow + 15 min`.
- **Validation never consults the database.** `IdentityServiceExtensions.AddIdentityServices` configures
  `JwtBearerEvents` with `OnMessageReceived` (header first, then the `auth-token` cookie) and
  `OnAuthenticationFailed` (sets `X-Token-Expired`). There is **no `OnTokenValidated`** and no
  `SecurityStampValidator` anywhere.
- **The session list is the refresh-token table, and a "session" has no stable id.**
  `RotateRefreshTokenAsync` revokes the old row and **inserts a new one**, linked only by
  `ReplacedByTokenHash`. `GetUserSessionsAsync` lists live rows, so the id the UI revokes
  (`RevokeSessionByIdAsync(rt.Id)`) is the id of the **current link in the chain**, and it changes on
  every refresh.
- **This is already known and pinned.** `UserDataExportAndDeletionTests.
  DeleteAccount_ThenReplayingTheOldSession_KillsRefreshButNotTheLiveAccessToken` asserts the live access
  token still authenticates after deletion. Its own comment: *"If a stamp/existence check is ever added,
  this assertion flips to 401 — and that failure is the intended signal, not a regression."* This ask
  is that change. **Flip that test; do not delete it.**

## Every path that should cut access immediately

| Path | Revokes today | Scope |
| --- | --- | --- |
| `BaseRevokeSessionEndpoint` → `RevokeSessionByIdAsync` | one refresh row | **one session** |
| `BaseRevokeAllOtherSessionsEndpoint` → `RevokeAllExceptCurrentAsync` | all rows but the caller's | all sessions but one |
| `BaseLogoutEndpoint` / `BaseExtensionLogoutEndpoint` → `RevokeRefreshTokenAsync` | the caller's row | the caller's session. It clears its own cookies, so this matters only for a copied token |
| `BaseLogoutAllEndpoint` → `RevokeAllUserTokensAsync` | every row | **every session** |
| `BaseChangePasswordEndpoint.RevokeAllSessionsAsync`, `BaseResetPasswordEndpoint`, `BaseConfirmEmailChangeEndpoint` | every row | every session (keep whatever each one does for the caller's own session today) |
| reuse-attack branch in `ValidateRefreshTokenAsync` (`RefreshTokenService.cs` ~:139/:146) | every row | every session |
| account deletion | cascade | the user is gone |

## The ask

Make a revoked session's access token stop authenticating on its **next request**. The design is yours.
This is the shape we'd expect, and why:

1. **A stable session id.** Add one to `RefreshToken` (e.g. `SessionId`, a GUID set on
   `GenerateRefreshTokenAsync` and **copied** on rotation), and put it in the access token as a `sid`
   claim at every mint (login, refresh, extension). The session list and `RevokeSessionByIdAsync` should
   then key on it too, so the id the UI holds survives a refresh. That is a contract change for
   `GET /user/sessions`: see *Contract* below.
2. **An `OnTokenValidated` check against two cheap facts:**
   - **per-session:** is this `sid` revoked? On revoke, write it to a cache with a TTL a little over the
     access-token lifetime (15 min + the 30 s `ClockSkew`). After that the token has expired on its own.
   - **per-user cutoff:** for the revoke-everything paths, a user-level "not valid if issued before T"
     (compare the token's `iat`), instead of enumerating sids. Identity's security stamp is the stock
     version of this, and a `stamp` claim plus a cached lookup is fine if you prefer it.
   - A deleted user fails either check, which also settles the pinned test.
   - On failure call `context.Fail(...)` so the response is a plain **401**. Do **not** set
     `X-Token-Expired`, because the token is not expired. (The client's behaviour is identical either
     way, see below, but the header should stay truthful.)
3. **Cost.** A cache lookup per authenticated request, not a DB query. `IDistributedCache` is already in
   use (`TwoFactorAuthService`, `CacheService<T>`). Its default here is **in-memory, per process** (see
   the comment at `TwoFactorAuthService.cs:~130`), so with more than one API instance a revoke on one
   is invisible to the others. Say which you rely on, and what a multi-instance deployment would need.
   If the cache is cold after a restart, falling back to the DB for the user-level cutoff is acceptable.
   A silent pass is not.

Alternatives we considered and would accept only with a reason: a DB lookup per request (simplest,
costs a query on every call); or a shorter access-token lifetime (narrows the window, does not close it,
and multiplies refresh traffic).

## Scope notes

- **SignalR.** `/hubs/notifications` authenticates with the same cookie at handshake. A new handshake
  gets the check for free. An **already-open** connection is not re-authenticated. Say whether you
  close the revoked session's hub connections on revoke (preferred, since notifications carry user
  data) or accept that they live until they drop.
- **Extension clients** send `Authorization: Bearer` and get the same claims, so the same check applies.
  Their tokens are minted in `GenerateTokensForExtensionAsync`, so give those a `sid` as well.
- **Tokens minted before deploy** carry no `sid`. Accept them until they expire (≤15 min) rather than
  signing everyone out at deploy, or say why not.
- **Do not change** refresh rotation, the 5 s reuse grace window or the reuse-attack response. This is
  about what the *access* token is worth after a revoke, nothing else.

## Contract

- Every authenticated endpoint can now answer **401** to a token that is unexpired and correctly signed.
- If the session id in `GET /user/sessions` changes shape or meaning (stable across refreshes), say so.
  The client keys the list and the Revoke call on it (`SessionsSection.vue`), and it treats the value as
  opaque, so a GUID string instead of a number is fine if you say which.
- No new error body is needed. If you add an `errorType` for "session revoked", name it. The client
  treats an unknown type as status-only.

## What the client does (no frontend change required)

`src/_common/axiosConfig.ts`: a 401 on a non-auth endpoint triggers one single-flight `POST /auth/refresh`.
For a revoked session that refresh is refused (401), so `logoutClient()` runs and the user lands on
`/login?redirect=…`. A burst of parallel 401s produces one refresh and one redirect (unit-tested in
`axiosConfig.test.ts`). That is the desired end state: the revoked device is signed out on its next click.

## Tests to add or flip

- **Flip** `DeleteAccount_ThenReplayingTheOldSession_KillsRefreshButNotTheLiveAccessToken`: the live
  access token now gets **401**. Rename it accordingly.
- Revoke one session → that session's access token 401s on its next request; **the revoker's own session
  is unaffected**, and so is a third session.
- Revoke-all-others → every other session 401s, the caller's does not.
- Logout-all, password change, password reset, e-mail change confirmation, reuse-attack → all sessions
  401, with each endpoint's existing handling of the caller's own session preserved.
- A token with no `sid` (pre-deploy) still authenticates until expiry.
- `sid` survives rotation: refresh twice, revoke by the id the session list shows, the latest access
  token 401s.

## Report back with

1. The design as built: where the `sid` lives, the cache or stamp mechanism, the TTL, and the
   single- vs multi-instance answer.
2. Whether `GET /user/sessions`'s id changed shape or meaning.
3. The SignalR decision.
4. The test names, and the flipped test's new name.

The frontend will verify it end to end the way `user-settings/U2` ran: two `playwright-cli` sessions,
revoke from one, and the other's next request should now be **401**, then a refused refresh, then
`/login`.
