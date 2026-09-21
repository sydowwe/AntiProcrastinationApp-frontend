# B14 · Backend ask — the Google Calendar OAuth flow cannot complete, for three separate server-side reasons

**Contract only.** Where the client id lives and how the state is carried are the backend's; this ask lists
the three points at which the flow currently stops, in the order a user meets them, and what the client needs
to tell the user about each.

> `user-settings/B1`. Written 2026-09-15 from `docs/views/_fix-queue.md` escalation §9. The unit observed
> only the first fault (Google's *"Missing required parameter: client_id"*); the other two were read from
> source in `AdhdTimeOrganizer` 2026-09-13 and would each surface the moment the previous one is fixed.
> **Not blocking a unit** — it blocks the whole `googleCalendar` module's verification.

---

## The problem

### 1. The client id is empty, and the endpoint hands out a URL anyway

`AdhdTimeOrganizer/appsettings.json:19-23` is
`"GoogleCalendar": { "ClientId": "", "ClientSecret": "", "RedirectUri": "http://localhost:5173/google-calendar/callback" }`;
no `appsettings.Development.json` carries a `GoogleCalendar` section, and the observed URL shows user-secrets do
not fill it either. `GoogleCalendarService.GetAuthUrl` (`:40-54`) builds `?client_id=&redirect_uri=…` from
`Uri.EscapeDataString("")`, and `GET /user/google-calendar/auth-url` returns it as a **200**.

**What the user sees:** *Connect* → Google's error page. Adjacent trap: if the key were *absent* rather than
empty, `Uri.EscapeDataString(null!)` throws and this becomes a 500 with an `errorId`.

### 2. The redirect URI points at `http://localhost:5173`

The app is `https://localhost:3000` (`.env.development` `VITE_APP_URL`; CLAUDE.md's *Browser verification*),
and the client's callback route is `/google-calendar/callback` (`googleCalendar.routes.ts:6`). Once 1 is
configured, Google sends the user, code in hand, to a port nothing listens on — and if the URI is not also
registered in the Google console, Google shows its own `redirect_uri_mismatch` page, which would be filed as a
fourth bug.

### 3. The state cookie is scoped to a path the connect route never matches

`GetGoogleCalendarAuthUrlEndpoint` sets `google-oauth-state` with `Path = "/user/google-calendar"`
(`Secure`, `HttpOnly`, `SameSite=Strict`, 10 min) and `ConnectGoogleCalendarEndpoint` deletes it with the same
path. But `Program.cs:622` sets `RoutePrefix = "api"`, so the browser's request is
`POST /api/user/google-calendar/connect` — and a cookie scoped to `/user/google-calendar` is **not sent** to a
path that does not start with it. `hasStateCookie` is therefore always `false` from a real browser and every
connect is the *"OAuth state is missing or does not match"* 400.

The API's own suite passes because `GoogleCalendarConnectionTests.cs:88-96` writes the `Cookie` header by
hand and never exercises path matching.

## The business rules

1. **A URL the server knows cannot work must not be a 200.** When `ClientId` is empty, either
   `GET …/auth-url` answers an error the client can distinguish (`503` / a `notConfigured` code) or
   `GET …/status` exposes `configured: false` — the client will hide *Connect* and render *"not available
   here"*. Say which; the client prefers the `status` field because it is read on every settings load
   anyway.
2. **The redirect URI is the app's origin + `/google-calendar/callback`**, and must be registered in the
   Google console for each environment. Please keep it derived from configuration, not a second literal.
3. **The state cookie's path must cover the route that reads it**, derived from the route prefix. One test
   that round-trips through a `CookieContainer` would pin it.
4. **`SameSite=Strict` in production** needs the app and API origins to share a registrable domain, or the
   cookie will not ride the POST at all. Confirm the production origins satisfy that.

## The shape the frontend needs

- `GET /user/google-calendar/status` gains **`configured: boolean`** (or the `auth-url` error of rule 1).
  Rendered by the Google Calendar card in `src/core/user/component/settings/`.
- `POST /user/google-calendar/connect` body becomes `{ code, state }` — **the client currently omits
  `state`** (`googleCalendarApi.ts:15`). That is app-side `F33` and lands **before** this so the first real
  round trip after the server fix does not fail on the client and get filed as a fourth server bug.
- No other shape change.

## What changes on the frontend once this lands

`F33` (send `state`), a `configured` branch on the card, and — for the first time — the
`GoogleCalendarCallbackView` success path and the whole sync leg (`POST /calendar/{id}/sync-to-google`)
become verifiable. The unit's `usecase.md` records them as unverifiable today.

**Order:** 1 makes *Connect* reach Google; 2 makes Google come back; 3 makes the return leg pass the state
check. Fixing 1 alone moves the failure one step later.

BACKEND RESPONSE:

B14 · Backend response — landed 2026-09-21 (AdhdTimeOrganizer 1e0dc3b, framework 23e13fe)

All three stops are fixed server-side. The flow is now completable end to end once the redirect URI is registered in the Google console (that is an ops step,
not a code one — listed at the bottom).

Contract changes

GET /api/user/google-calendar/status — gains configured

{ "configured": true, "connected": false }

- configured: false → this deployment has no Google OAuth client. Hide Connect and render "not available here". connected is always false in that case.
- configured: true → the flow can run; connected says whether this account holds a refresh token, as before.

GET /api/user/google-calendar/auth-url — no longer a 200 when unconfigured

When configured is false this answers 503 with the standard error body:

{ "statusCode": 503, "message": "...", "errors": { ... }, "errorType": "ServiceNotConfigured" }

ServiceNotConfigured is a new errorType value (framework enum, so it can appear on other integrations later). You should never hit it if you branch on
status.configured first, but word it as "not available", not as a failure to retry. No cookie is set on this response.

On the 200 path the URL's redirect_uri is now <PAGE_URL>/google-calendar/callback — https://localhost:3000/google-calendar/callback in dev — so Google returns
the user to your existing googleCalendar.routes.ts route. Nothing to change on your side.

POST /api/user/google-calendar/connect — body is { code, state }, and state is required

F33 must land: the validator rejects an empty state with a validation 400. The state cookie is now scoped so the browser actually sends it on this route, so a
real round trip will pass the check. The three hand-rolled 400s now carry errorType:

| errorType            | Meaning                                                                                 | What to say                                  |
|----------------------|-----------------------------------------------------------------------------------------|----------------------------------------------|
| CookieMissing        | the state cookie did not arrive (expired after 10 min, already consumed, or cross-site) | "Connection attempt expired — start again"   |
| BadRequest           | cookie arrived but its state ≠ body state (a different / stale flow)                    | same wording; restart                        |
| ExternalServiceError | Google refused the code exchange (used/expired code, revoked consent)                   | "Google rejected the connection — try again" |

Success is still 204. The cookie is consumed on the first connect, so a replay of the same code/state is CookieMissing; don't retry a 204 automatically.

Unchanged

DELETE …/disconnect (204) and POST /api/calendar/{id}/sync-to-google — no shape change.

What became verifiable

GoogleCalendarCallbackView's success path and the sync leg can now be exercised against a real Google account. Order of work on your side: F33 → configured
branch on the card → then the callback view and sync.

FRONTEND HALF (2026-09-21): landed in that order — `F33` (`connect(code, state)`, `_silent`, the 400 worded by `errorType`), the `configured` branch on
`GoogleCalendarCard` and `GoogleCalendarSyncBtn`, `F34` on the same card, Google's `access_denied` → a distinct "cancelled" toast, and the four `errorType`
values added to the framework's `ServerErrorType`. Verified against `1e0dc3b`: status `{"configured":true,"connected":false}` → *Not connected* + *Connect*;
fake `?code=x&state=y` → 400 `CookieMissing` → "Connection attempt expired — start again"; *Connect* → auth-url 200 → Google's `redirect_uri_mismatch` for
`https://localhost:3000/google-calendar/callback`. So the only thing between here and a 204 is the console registration; the consent round trip and the sync
leg are still to be exercised after it.
