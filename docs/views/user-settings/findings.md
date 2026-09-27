# user-settings — findings

> Pass: inventory + mutation · captured 2026-09-14 · commit `adc9c67f`

**Tally:** blocker 0 · bug 0 · a11y 0 · polish 0 · opportunity 0 · unverified 4

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-14 | `adc9c67f` | initial inventory pass |
| 2 | 2026-09-14 | `adc9c67f` | mutation pass — confirmed `askBeforeDelete`/`firstDayOfWeek` save+persist+snackbar live (reverted after), confirmed theme toggle syncs and reverted it, found P1, and hit the harness's own safety classifier on password-field fill, the language switch, and (again) Delete account — all left untouched, see U3-U5 |
| 3 | 2026-09-24 | `1fb9de9e` | status sweep — all four bug/a11y/polish findings confirmed closed against current source and `_fix-queue.md`: B1+B2 landed together in `fc3c4547` (`B14` frontend half, §9), B3+B4 in `FW25`, A1 in `FW7` (`5397675`), P1 folded into `FW12`'s commit (`549ae02`). U1 was already resolved; U2-U5 remain open, blocked by the harness's own safety classifiers or needing a dedicated throwaway account — nothing actionable from this repo alone |
| 4 | 2026-09-24 | `d423edcc` | **retest round** — 6 retested live: B2, B3, B4, A1, P1 pass; none reopened; B1 blocked (reaches Google with `client_id`, but `redirect_uri_mismatch` — callback URI unregistered, ops). F90 (MyBtnToggle) SK labels: `group "Téma"`, `group "Prvý deň týždňa"` pass, no raw keys. Account(s): `primaryUser` (B1, B2, A1, P1, F90), `secondaryUser` form sign-ins (B3, B4). Mutations made and reverted: theme Light→Dark→Light, locale EN→SK→EN (two `PUT /user/preferences` 204); 2FA enabled on `secondaryUser` by B4 and by B3, each undone by a reseed (three reseeds in all: before B3 for the UTC precondition, after B4, after B3). The unit brief's "cancel at the QR, confirm 2FA off" cannot work: a 200 from `/user/2fa/toggle` has already enabled 2FA, the QR dialog has no close button, and disabling needs a TOTP — a reseed is the only revert. Also: a reseed killed a live access token too (`GET /user/data` 401 → `POST /auth/refresh` 401), contrary to `e2e/fixtures/seed.ts`'s "survives while the access token lives". Regressions: none. U2–U5 left `open` here, though `_fix-queue.md` closes them 2026-09-24 (status drift, untouched) |

---

### B1. Google Calendar "Connect" leads to a real OAuth error — `client_id` is missing
- **Status:** fixed, retest blocked 2026-09-24 — "Connect" now reaches Google with `client_id` present
  (`client_id=579844911566-…apps.googleusercontent.com`), but Google answers `redirect_uri_mismatch`:
  `https://localhost:3000/google-calendar/callback` is not registered in the console (ops, as `§9` said).
  The consent screen stays unreachable until it is; not authorized.
- **Severity:** bug
- **Where:** `/user/settings` → Security card → "Connect" (Google Calendar row, app-supplied via the
  `#integrations` slot)
- **Expected:** Clicking "Connect" should carry the user to Google's real consent screen so they can
  authorize calendar access — that is the entire purpose of the button and the feature it fronts.
- **Actual:** The button correctly calls `GET /api/user/google-calendar/auth-url` (200) and navigates
  to the URL it returns, but that URL lands on Google's own error page:
  `accounts.google.com/signin/oauth/error?authError=…` reading "Missing required parameter:
  client_id". The OAuth flow cannot start at all.
- **Evidence:** `docs/views/user-settings/screenshots/user-settings--google-oauth-error.png`; request
  #1435 `GET /api/user/google-calendar/auth-url` → 200, followed by a real navigation to
  `accounts.google.com` with the error above.
- **Repro:** 1. Go to `/user/settings`. 2. Click "Connect" in the Google Calendar row. 3. Land on
  Google's real error page reading "Missing required parameter: client_id".
- **Verify:** 1. Click "Connect". 2. **Pass condition:** the browser reaches Google's actual OAuth
  consent screen (asking to authorize this app for Calendar access), not an error page.
- **Root cause guess:** the `auth-url` endpoint builds the Google OAuth URL server-side without a
  configured `client_id` — almost certainly a backend/environment configuration gap (a missing OAuth
  client ID in this dev environment), not a client-side bug. The frontend's request/redirect handling
  itself is correct.
- **Suggested fix:** none on the frontend — this needs a backend escalation for the missing Google
  OAuth client configuration. This also blocks verifying `GoogleCalendarCallbackView`'s success path
  (a real `?code=…` redirect can never be produced while this is broken) and the entire Google
  Calendar module end-to-end — noted in `usecase.md` as unverified rather than given its own U-id,
  since it's entirely downstream of this one root cause.

### B2. GoogleCalendarCallbackView gives zero feedback on a failed or declined connection
- **Status:** fixed and verified (retest 2026-09-24, live) — `/google-calendar/callback?error=access_denied`
  redirected to `/user/settings` with `status: "Google Calendar connection cancelled"` in the snapshot.
- **Severity:** bug
- **Where:** `/google-calendar/callback` (no `code` param, and separately `?error=access_denied`)
- **Expected:** A user who declines Google's consent screen, or whose connection attempt otherwise
  fails, lands back at `/google-calendar/callback` with no `code` — this is a real path (not
  hypothetical), since "Cancel" on Google's own consent screen produces exactly this redirect shape.
  Plain user sense: they should see *something* telling them the connection did not happen.
- **Actual:** Both edge cases tested — no query params at all, and `?error=access_denied` — silently
  redirect to `/user/settings` with no snackbar, no message, nothing. Confirmed the redirect fires
  purely client-side (no new network request appears in the request log across either navigation),
  so this isn't a swallowed API error either — it's a guard/`onMounted` check that redirects on any
  non-success shape without ever branching into a "tell the user" path.
- **Evidence:** Two navigations, `playwright-cli -s=user-settings goto
  https://localhost:3000/google-calendar/callback` and
  `...?error=access_denied` — both immediately show `Page URL: https://localhost:3000/user/settings`
  with the Google Calendar row still reading "Not connected" and no error snackbar text found via
  `find`.
- **Repro:** 1. Sign in. 2. Navigate directly to `/google-calendar/callback` (no query string). 3.
  Observe an instant, silent redirect to `/user/settings` with no feedback.
- **Verify:** 1. Navigate to `/google-calendar/callback?error=access_denied`. 2. **Pass condition:**
  an error snackbar (or equivalent visible message) explains the connection did not succeed, before
  or as part of the redirect to `/user/settings`.
- **Root cause guess:** likely the same component/guard that handles the success path just falls
  through with no `else` branch when `route.query.code` is absent.
- **Suggested fix:** branch on `route.query.error` vs. a genuinely missing `code` and show
  `showErrorSnackbar` with a short explanation before redirecting.

### B3. A step-up action right after opening the page can fail Identity's concurrency check — and is then reported as "Wrong password"
- **Status:** fixed and verified (retest 2026-09-24, live) — after a reseed (account on UTC), one
  `run-code` script signed in as `secondaryUser`, went straight to `/user/settings` and stepped up with
  no settle-wait: `POST /user/2fa/toggle` → 200 ~470 ms after the page loaded, *Enabling 2FA* open, no
  "Wrong password"; one `PUT /user/preferences` for the whole run (at sign-in), none from the settings
  page. Reseeded afterwards to turn 2FA back off.
- **Severity:** bug
- **Where:** `/user/settings` → any `VerifyUserForm` action (2FA toggle observed; password/e-mail change,
  delete account and 2FA reset take the same gate). Framework: `authStore.hydrateFromServer`,
  `installFramework.ts:177`, `UserSettingsView.vue:47`, `timeZoneSync.ts`, `VerifyUserForm.vue:54-56`.
- **Expected:** Enabling 2FA with the right password enables 2FA.
- **Actual:** `POST /user/2fa/toggle` answers **400** `"Optimistic concurrency failure, object has been
  modified."`, the dialog clears and snackbars *"Wrong password"*, the switch stays off. Deterministic on
  a freshly seeded account driven by a spec; a human clicking a few seconds after the page loads usually
  wins the race, which is why three rounds by hand never saw it.
- **Evidence:** trace of `two-factor.spec.ts` test 1 (2026-09-21) — `PUT /api/user/preferences`
  57.003→57.547 s overlapping `POST /api/user/2fa/toggle` 57.110→57.768 s → 400, a second PUT at 57.361;
  three `GET /api/user/data` before them (sign-in, boot hook, `UserSettingsView.onMounted`). The same
  toggle over plain HTTP after a reseed and sign-in, with nothing else in flight, answers 200.
- **Repro:** 1. Reseed (accounts are `UTC`), browser in any other zone. 2. Form sign-in as `test2`. 3.
  Load `/user/settings` and immediately toggle *Use two-factor authentication* → password → Confirm.
- **Verify:** `two-factor.spec.ts` test 1 with its `waitForLoadState('networkidle')` line removed.
  **Pass condition:** 200 and the *Enabling 2FA* dialog; one `PUT /user/preferences` per session.
- **Root cause:** with `syncBrowserTimeZone` on, every `hydrateFromServer()` whose stored zone differs from
  the browser's pushes a `PUT /user/preferences`, and the settings page runs three hydrations. A PUT still
  saving when a step-up request has loaded the user row makes that request's `UpdateAsync` fail on the
  concurrency stamp. `VerifyUserForm`'s bare `catch` then labels any failure a wrong password.
- **Suggested fix:** see `FW25` — one in-flight hydration, one time-zone push per session, and a `catch`
  that says *"Wrong password"* only on 401.

### B4. A wrong password in the identity dialog signed the user out
- **Status:** fixed and verified (retest 2026-09-24, live) — `secondaryUser`, wrong password →
  one `POST /user/2fa/toggle` 401 (no refresh, no resend), `status: "Wrong password"`, dialog still
  open, still `/user/settings`; the right password in the same dialog → 200 and *Enabling 2FA*.
  Reseeded afterwards to turn 2FA back off.
- **Severity:** bug
- **Where:** every `VerifyUserForm` action on `/user/settings` (2FA toggle observed; password change,
  e-mail change, delete account and 2FA reset post through the same form). Framework:
  `axiosConfig.ts`'s 401 branch, `VerifyUserForm.vue`.
- **Expected:** A mistyped step-up password says so and lets the user try again.
- **Actual:** The user was signed out and bounced to `/login`. `POST /user/2fa/toggle` → 401 (the gate's
  answer); the route is not in the interceptor's `AUTH_ENDPOINTS`, so it refreshed the session, **resent
  the same wrong password**, got 401 again, and the retry's 401 is the interceptor's `logoutClient()`
  branch.
- **Evidence:** `playwright-cli` 2026-09-21, secondary account, wrong password in the 2FA toggle's
  dialog → `POST /api/user/2fa/toggle 401`, `POST /api/auth/refresh 204`, `POST /api/user/2fa/toggle 401`,
  `location.pathname` → `/login`.
- **Repro:** 1. Sign in. 2. `/user/settings` → toggle *Use two-factor authentication*. 3. Any wrong
  password → Confirm.
- **Verify:** `two-factor.spec.ts` test 1: 401, *"Wrong password"*, dialog still open, still
  `/user/settings`, then the right password succeeds in the same dialog.
- **Root cause:** the interceptor could not tell "the credential in this body was refused" from "this
  session's token lapsed" — both are 401. The API marks the second with `X-Token-Expired`, which is
  what the fix keys on.

### A1. Password-field visibility toggles expose a non-descriptive accessible name
- **Status:** fixed and verified (retest 2026-09-24, live) — in the open *Change password* dialog all three
  visibility toggles are named "Show password" (next to "Clear Password" / "Clear New password" /
  "Clear Confirm new password"); no "…appended action" left.
- **Severity:** a11y — **[framework]**
- **Where:** the "Password change" dialog opened from `/user/settings` → Security → "Change
  password" — all three fields (Password, New password, Confirm new password)
- **Expected:** an icon-only control needs an accessible name that says what it *does* — "Show
  password" / "Hide password" is the standard pattern (and is exactly what the shell's own finding
  A2 asks for on the sidebar toggle: a real, useful name, not just *a* name).
- **Actual:** each field's append-icon (the password-visibility toggle) carries a literal
  `aria-label` of `"Password appended action"`, `"New password appended action"`, or `"Confirm new
  password appended action"` — a Vuetify-generated fallback name describing the icon's *slot*, not
  its function. A screen-reader user hears "Password appended action, button" and has no way to know
  it toggles visibility.
- **Evidence:** DOM query confirmed via `playwright-cli eval` on the open dialog:
  `[{"tag":"I","aria":"Password appended action"},{"tag":"I","aria":"New password appended
  action"},{"tag":"I","aria":"Confirm new password appended action"}]`.
- **Repro:** 1. Go to `/user/settings`. 2. Click "Change password". 3. Inspect any of the three
  append-icon buttons' `aria-label`.
- **Verify:** 1. Open the "Change password" dialog. 2. **Pass condition:** each visibility-toggle
  icon's accessible name says "Show password" / "Hide password" (or the per-field equivalent), not
  "…appended action".
- **Root cause guess:** framework-level default on the password text-field component — no
  `aria-label` passed at the call site, so Vuetify's slot-name fallback is what screen readers get.
  Likely the same class of default gap as the shell's A2 (icon-only controls with no deliberate name),
  but this one already has *a* name, just an unhelpful one — worth its own framework batch rather than
  folding into A2's.
- **Suggested fix:** pass an explicit, localized `aria-label` ("Show password"/"Hide password",
  toggling with state) at each password-field call site, or better, bake it into the framework's
  shared password-field component so every consumer gets it for free.

### P1. "Change password" and "Delete account" use the wrong colour for an elevated button
- **Status:** fixed and verified (retest 2026-09-24, live) — computed backgrounds: light `#CA8A04` /
  `#B91C1C`, dark `#CA8A04` / `#DC2626` (each theme's `warningDark` / `errorDark`), white text legible in
  both; `screenshots/retest-2026-09-24-P1-{light,dark}.png`. Theme restored to Light.
- **Severity:** polish — **[framework]**
- **Where:** `src/_common/modules/user/component/settings/SecuritySection.vue:61-72` — the "Change
  password" (`color="warning"`) and "Delete account" (`color="error"`) buttons
- **Expected:** CLAUDE.md's colour-by-variant rule: `variant="elevated"` (`VBtn`'s project-wide
  default, and neither button overrides it) should use `warningDark`/`errorDark`; plain
  `warning`/`error` are for `tonal`/`outlined` variants.
- **Actual:** Both buttons pass the `tonal`/`outlined` colour token (`warning`, `error`) to an
  elevated button. Confirmed in the dark theme screenshot: "Change password" renders as a
  saturated yellow-gold that reads as more alarming than a routine security action warrants, sitting
  oddly next to "Delete account"'s red — the two intensities are closer than the actions' actual risk
  difference.
- **Evidence:** source lines above; `docs/views/user-settings/screenshots/user-settings--dark-theme.png`.
- **Repro:** 1. Go to `/user/settings`, Security card. 2. Compare "Change password" and "Delete
  account" against "Edit"/"Connect" (both correctly `primary`, elevated).
- **Verify:** 1. Load `/user/settings`. 2. **Pass condition:** "Change password" renders in
  `warningDark` and "Delete account" in `errorDark`, both still legible in light and dark theme.
- **Root cause guess:** the component predates, or was written without, the app's colour-by-variant
  convention — it's a `[framework]` file, so this is one small framework commit, not an app fix.
- **Suggested fix:** swap `color="warning"` → `color="warningDark"` and `color="error"` →
  `color="errorDark"` on those two `VBtn`s.

### U1. Two-factor authentication setup flow not exercised
- **Status:** resolved — exercised by the first test of `e2e/tests/two-factor.spec.ts` since
  2026-09-21, and it found a defect, fixed the same day (`_fix-queue.md` §17, body in `_fix-queue-log.md`)
- **Severity:** unverified
- **Where:** `/user/settings` → Security → "Use two-factor authentication" checkbox
- **Closing note (2026-09-21):** Run on `secondaryUser` under `freshSeed` with a reseed afterwards, which is
  what answers the "shared account" objection below. The flow as it now stands: switch → *Identity
  verification* → password → `POST /user/2fa/toggle` → an *Enabling 2FA* dialog with the QR **and its base32
  key beside it** (`sharedKey`, `B22`, for an authenticator that cannot scan the screen) → *Done* →
  *Recovery codes*, *Done* disabled until *"I have saved these codes somewhere safe"* is ticked → the switch
  checked. **What it found:** until this pass the enable path showed the recovery codes and never the QR, so
  the only way to pair an authenticator after enabling was *Show 2FA QR code* — which posts `/user/2fa/reset`,
  mints a new key *and new codes*, and whose handler discarded those codes. Both handlers now share one
  sequence (QR first, then codes when present). Still worth a look, not filed: the *Show 2FA QR code* label
  reads as a look when it is a reset.
- **What would verify it:** toggling it almost certainly starts a real 2FA enrollment (QR code / TOTP
  secret) on the account, which is a genuine, hard-to-reverse security-state mutation on the shared
  seed account this pass ran against — a `history-review` unit was running concurrently against the
  same account (confirmed via a real second "This device"-tagged session in Active Sessions), so
  changing 2FA state was avoided as out of scope for an inventory pass. Needs a disposable test
  account run alone.

### U2. Active-sessions Revoke / "Log out of all other devices" not exercised
- **Status:** open
- **Severity:** unverified
- **Where:** `/user/settings` → Active sessions card
- **What would verify it:** in the inventory-pass round, `GET /api/user/sessions` returned 3 real
  rows, one genuinely not "This device" (a live concurrent sign-in), so Revoke/"log out others" were
  left untouched to avoid ending another agent's session. **Re-checked in the mutation-pass round:**
  the concurrent session had ended by then and only 1 row ("This device", Revoke disabled) remained
  — so there was no longer a safe *target* to revoke either. Manufacturing a second session via a
  fresh login was deliberately not attempted: `e2e/fixtures/auth.ts` documents that repeated sign-ins
  in quick succession trip a real rate limit with a cooldown "well over a minute", and a spurious
  extra sign-in isn't worth that risk for one control. Needs either a second real device/session
  already present, or a dedicated throwaway account.

### U3. Delete-account confirmation dialog and its copy not observed
- **Status:** open
- **Severity:** unverified
- **Where:** `/user/settings` → Security → "Delete account"
- **What would verify it:** the unit brief asks for the control's confirmation copy specifically, but
  clicking it was blocked outright by the harness's own deletion-safety classifier ("Irreversible
  Deletion") in **both** the inventory and mutation passes — the click never reached the page either
  time. `prompts/_done/user/A2-deletion-cliff.md` (source, not observed live) describes the flow as
  `deleteAccount()` → `openVerifyDialog('/user/delete-account', onDeleted)` → a `VerifyUserForm`
  asking only for identity confirmation, with no "are you sure, here is what you'll lose" step of its
  own — which is exactly why this app's own `DangerZoneSection` (the Danger zone card documented in
  `inventory.md`) exists in front of it. Needs a session where that classifier is deliberately
  allowed, or a manual/human-supervised check, to confirm the dialog's actual copy matches this
  description.

### U4. Password-change validation (mismatched new/confirm) not exercised
- **Status:** open
- **Severity:** unverified
- **Where:** `/user/settings` → Security → "Change password" dialog
- **What would verify it:** intended to fill mismatched "New password"/"Confirm new password" values
  to observe the client-side validation message, without ever clicking Confirm. The harness's own
  safety classifier ("Modify Shared Resources") blocked the `fill` on the "New password" field
  outright — it does not distinguish "typing into a password field to check validation" from
  "actually changing the password" on this shared account, and stopping there was the right call
  rather than working around it. The dialog was closed via Cancel with nothing submitted. Needs a
  session where that classifier is deliberately allowed, or a disposable account.

### U5. Language switch (English → Slovak/Czech → English) not exercised
- **Status:** open
- **Severity:** unverified
- **Where:** `/user/settings` → Appearance → Language combobox
- **What would verify it:** the unit brief explicitly permits testing this as long as the account
  ends back on English (the whole documentation sweep depends on it staying English). The dropdown
  opened correctly and listed Slovak/English/Czech, but selecting "Slovak" was blocked by the same
  "Modify Shared Resources" classifier that blocked the password field — confirmed via Escape that
  the field still reads "English" afterward, so no mutation occurred. Given the sweep-wide
  dependency on this staying English, backing off here was the safer call even though the brief
  technically allowed it. Needs a session where that classifier is deliberately allowed, run with
  extra care to revert immediately afterward.
