# F3 · Signing in does not fetch the user, so every host app reads constructor defaults

> **Landed 2026-08-18 — see `../../../../migration-revision.md` R18.** `login()` now awaits `hydrateFromServer()`
> and never rejects, and `installFramework({ hydrateOnBoot })` (default `false`) covers the reload
> path, so point 2 below was taken too. `useUserHydration.ts` and the router-guard call are deleted;
> `useUserPreferences.ts` is kept. The text below is left as written, as the record of the ask.

**Framework ask.** `src/_common` is a submodule; this describes a change to make in the
`vue_framework` repo, not here.

## The gap

`userStore.login()` (`src/_common/modules/user/store/authStore.ts:30-33`) is the whole of what happens to the user store at sign-in:

```ts
function login(email?: string): void {
	if (email) currentUser.value.email = email
	isAuthenticated.value = true
}
```

It sets a flag and an e-mail. It does not call `hydrateFromServer()`
(`authStore.ts:21-23`), which is the only thing in the framework that ever issues `POST /user/data`.

`hydrateFromServer()` is called from exactly one place in the entire framework:

```
src/_common/modules/user/view/UserSettingsView.vue:40    onMounted(() => userStore.hydrateFromServer())
```

— a view's `onMounted`. So between signing in and *happening to open the settings page*, the store holds a bare `new User()`. That is constructor defaults for the
framework's own fields (theme, locale, timezone) and, critically, **nothing at all** for any field a host app has added through the documented augmentation seam
(`dto/response/User.ts:11-14`), because interface merging declares a type and cannot create a value.

The three call sites of `login()` are `LoginView.vue:154,190` and `LoginVerifyQrCode.vue:63`. None hydrates either.

The user-visible consequence in this app was destructive. Its `askBeforeDelete` preference is an augmented field, so it was `undefined` after sign-in, and five
delete paths were written as
`if (!currentUser.askBeforeDelete) { deleteImmediately() }`. `!undefined` is `true`, so a user who had just signed in on a new device, in a new browser profile, or
after `logout()` — which resets to
`new User()` at `authStore.ts:36` — got **no delete confirmation anywhere in the app**. The store persists to `localStorage`, so the value stuck as soon as anyone
opened settings and the bug went quiet, which is why it survived.

The framework's own fields fail more quietly but they do fail: a signed-in user's theme and locale are the `User` constructor's defaults until they visit settings,
and `timezone` — which
`useUserClock` resolves every date and day boundary against — defaults to `'Europe/Bratislava'` for everyone.

The shape of the bug is a seam nobody owns: the framework assumes the host app hydrates, the host app assumes the framework does, and the only actual call sits
inside a view neither of them routes through.

## Why it cannot be fixed app-side

It can be worked around app-side, and this app has done so — but only badly, and only by an app that happens to own a router guard.

The store, all three `login()` call sites and `UserSettingsView` are all in `src/_common`. A host app cannot reach any of them. What it can do is find some other
place that runs after authentication and call `hydrateFromServer()` there. In this app that place is `../../../../src/router.ts`'s `beforeEach`, which is app-owned
and already knows whether the user is signed in.

What the workaround costs:

- **It is late, not on the login path.** Hydration starts on the first *navigation*, not at sign-in, so it is one navigation's worth of latency behind where it
  belongs.
- **It cannot be awaited.** `main.ts` mounts behind `router.isReady()`, so awaiting in the guard holds the first paint of every page load behind `POST /user/data`,
  and hangs the app outright if that request hangs. So the app fires it and does not wait — which means every consumer of a user field must be written to tolerate
  the value not having arrived yet.
- **Every host app pays for it separately**, and gets it wrong in a different way. This one needed a guard change, an idempotence latch, a sign-out reset, a
  swallow-and-retry error path, and a defaulting composable in front of every read — roughly 90 lines to compensate for one missing call.
- **An app without a router guard has nowhere to put it at all.**

## The app-side workaround kept in the meantime

- `src/core/user/composable/useUserHydration.ts` — `ensureUserHydrated()`: idempotent per authenticated session, shares one in-flight promise across concurrent
  navigations, resets on sign-out so the next user on the device re-fetches, and never rejects into the guard.
- `src/router.ts:70-76` — the `void ensureUserHydrated()` call in `beforeEach`, plus its comment explaining why it is not awaited.
- `../../../../src/core/user/composable/useUserPreferences.ts` — defaults every app preference (`askBeforeDelete`
  → `true`, `firstDayOfWeek` → `1`) so that a not-yet-hydrated read is safe rather than destructive.

All three are deliberate. The first two are pure compensation for this gap. The third is worth keeping regardless — safe defaults are good practice even with
hydration on the login path — but it would stop being load-bearing.

## What the framework should expose

Move the call to where the state change happens: have `login()` hydrate.

The smallest version that works, in `authStore.ts`:

```ts
async function login(email?: string): Promise<void> {
	if (email) currentUser.value.email = email
	isAuthenticated.value = true
	await hydrateFromServer()
}
```

Two things make this cheap to accept:

- **The three existing call sites do not have to change.** All three (`LoginView.vue:154,190`,
  `LoginVerifyQrCode.vue:63`) call `login()` in an already-`async` handler and ignore its return value, so an un-awaited promise there is a no-op for them. Awaiting
  it is an opt-in improvement each app makes when it wants the settings to be live before the post-login redirect resolves.
- **No app that already hydrates elsewhere breaks.** A duplicate `POST /user/data` is idempotent. Apps like this one simply delete their workaround.

Two details worth settling in the same change:

1. **A hydrate failure must not fail the login.** Sign-in has already succeeded server-side by the time this runs; a failed `POST /user/data` should leave the user
   signed in with defaults, not bounced back to the login form. Catch it inside `login()` (the axios interceptor already shows the snackbar) rather than letting it
   reject.
2. **Reload is the other half of the same gap.** The store persists to `localStorage`, so a returning user is `isAuthenticated` on boot without any call having been
   made — their preferences are whatever was last persisted, which may be a session old and, on first-ever load, is `new User()`. If `installFramework` gained a
   `hydrateOnBoot` option (default `false`, so no existing consumer changes behaviour) that hydrates when the restored state says authenticated, the workaround here
   could go entirely rather than shrink.

Whether hydration is also worth exposing as an awaited bootstrap step is the framework's call; the per-app cost of getting that wrong is what this ask is about.

## What gets deleted here when it lands

- `src/core/user/composable/useUserHydration.ts` — the whole file (~50 lines).
- `../../../../src/router.ts` — the import and the `void ensureUserHydrated()` block, back to a synchronous guard.
- `../../../../src/core/user/composable/useUserPreferences.ts` — **kept**, but its comments stop describing hydration timing as the reason the defaults exist.

Point 2 above (`hydrateOnBoot`) is what decides whether the first two go away completely or whether the app still needs something on the reload path.
