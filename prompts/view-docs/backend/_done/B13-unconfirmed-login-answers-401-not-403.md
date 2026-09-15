# B13 · Backend ask — an unconfirmed account with the right password gets `401 "Invalid email or password"`, never the `403 "Email not confirmed"` the flow was written to send

**Contract only.** Which Identity call does the password check is the backend's; this ask is about the
status/message contract the client was built against and the enumeration property the flow's own comment
protects.

> `auth/B6` (`bug`), observed twice on two throwaway accounts in unit 15's round 2. Written 2026-09-15 from
> `docs/views/_fix-queue.md` escalation §14. Source read in `AdhdTimeOrganizer` 2026-09-15. **This is a
> `Sydowwe.Framework` file, so the fix ships to every API on that framework.**

---

## The problem

`PasswordSignInFlow.RunAsync` (`framework/Sydowwe.Framework/application/service/auth/PasswordSignInFlow.cs`)
is written to answer `EmailNotConfirmed` → **403** *"Email not confirmed"*, and says why it checks confirmation
**after** the password: *"so the answer can't be used to probe which addresses are registered."*

That branch is unreachable in this deployment:

- `IdentityServiceExtensions.cs:121` sets `options.SignIn.RequireConfirmedEmail = true`.
- With that option, ASP.NET Identity's `CheckPasswordSignInAsync` runs `PreSignInCheck` → `CanSignInAsync`
  **before** verifying the password, and returns `SignInResult.NotAllowed` for an unconfirmed user.
- `NotAllowed` is `!result.Succeeded`, so the flow takes the *"Invalid email or password"* branch (401) and
  logs `LoginFailed`. The `!user.EmailConfirmed` check below it is dead code.

Two consequences beyond the wrong status:

1. **The password was never checked**, so the lockout counter does not move for an unconfirmed account —
   `CheckPasswordSignInAsync` short-circuits before `AccessFailedAsync`.
2. **The client's dedicated branch is unreachable.** `LoginView.vue:185-193` handles the 403 with the
   `emailConfirmationNeeded` snackbar and the *resend confirmation* panel. Today an unconfirmed user is told
   their password is wrong, and the natural next click is *Forgot password?* — whose mail currently points at a
   route that does not exist (`FW9`).

## The business rules

Stated as the client understands them; please confirm or correct:

1. **Wrong password, any account** → `401`, generic message, lockout counter fed. (As today.)
2. **Right password, unconfirmed e-mail** → `403 "Email not confirmed"`, so the client can offer *resend*.
3. **Rule 2 must not leak registration.** The 403 is only ever produced **after** the password verified, so
   an attacker with an address and no password learns nothing. That is the property the existing comment at
   `:103-104` states, and it is the reason the cheap fix (map `result.IsNotAllowed` → `EmailNotConfirmed`
   without checking the password) is **not** acceptable: it answers 403 to any address that is registered and
   unconfirmed, whatever password is sent.
4. **Lockout applies to unconfirmed accounts too.** A wrong password against an unconfirmed address should
   count toward lockout like any other.

## The shape the frontend needs

No shape change — the client already reads `status` and `message` off the existing response. The ask is that
the documented outcomes actually occur:

| situation | status | message | client behaviour (already built) |
| --- | --- | --- | --- |
| unknown e-mail, or wrong password | 401 | *Invalid email or password* | generic snackbar |
| locked out | 403 | *Too many failed login attempts…* | lockout snackbar |
| **right password, unconfirmed** | **403** | ***Email not confirmed*** | `emailConfirmationNeeded` + resend panel |
| right password, 2FA on | 200 + 2FA token | — | QR/code step |

And one integration test: register, do not confirm, sign in with the **right** password → 403; with the
**wrong** password → 401 and `AccessFailedCount` incremented.

## What changes on the frontend once this lands

Nothing — `LoginView.vue:185-193` is already correct. It also unblocks `auth/U2` (a 2FA login cannot be driven
until a throwaway account can get past this gate) and makes the resend-confirmation panel verifiable for the
first time.

---

## Landed 2026-09-15 — all four rules confirmed as written, plus one frontend correction

Backend fixed in `Sydowwe.Framework/application/service/auth/PasswordSignInFlow.cs`: the flow now takes
`UserManager.CheckPasswordAsync` instead of `SignInManager.CheckPasswordSignInAsync`, so the order is
lockout → password (wrong → `AccessFailedAsync`, 401) → `EmailConfirmed` (403) → 2FA. Rules 3 and 4 hold.
Response shape unchanged. Verified against the source, not just the reply.

**The paragraph above was wrong: `LoginView.vue` was *not* already correct.** Its 403 arm matched lockout with
`generalErrors.includes('User locked out for')` — array-element **equality** against a string the server never
sends. The real text is interpolated, `"Too many failed login attempts. Try again in {m}m {s}s"`
(`PasswordSignInFlow.cs:152`), and the only substring match for it sat in the **401** arm, which lockout has
never used. So the lockout branch was dead at both statuses. It did not misfire the resend panel only by luck —
the lockout text is not equal to `'Email not confirmed'` either, so it fell through to the generic
`generalErrors[0]` arm and showed the server's own (unlocalized) English.

Fixed in the same file: the `Too many failed login attempts` substring match is hoisted **above** both status
arms, so it wins whatever status carries it, and `'Email not confirmed'` is only reached once lockout is ruled
out. `--build --force` typecheck clean.

> This is a `src/_common` submodule edit and needs the two-commit dance: commit inside `src/_common`, then the
> pointer bump. It is generic — it keys off the framework backend's own messages, no app strings.
