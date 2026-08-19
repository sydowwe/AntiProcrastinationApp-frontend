# F2 · The timezone preference is editable and read by nothing — **resolved, see `../../../../migration-revision.md` R17**

**Framework ask.** Landed directly in the `vue_framework` submodule on 2026-08-18 rather than being filed upstream, under the standing approval to edit `src/_common`
in place. Commit inside the submodule first, then the app-side pointer bump.

---

## Correction: this ask's premise was stale when it was read

F2 was pre-written (see this directory's README — nothing in the `U`/`P`/`A` series touches this code, so it was written speculatively rather than by an agent that
hit it). By the time it was picked up, half of it was already false:

- "`User.timezone` is read in exactly one place — the autocomplete that sets it" — **no longer true.**
  R16 (2026-08-13) landed `_common/composable/general/useUserClock.ts` and the
  `installFramework({ userTimeZone })` seam; this app registers it at `main.ts:26`, and commit
  `3770be7` migrated the rest of `../../../../src/core` onto it.
- "the smallest change that works is a single seam: teach `DateTimeHelper` to format in a configured zone" — **rejected.** See below. This part of the ask was wrong,
  not merely stale.

Read the resolution as the correction to F2, not as its implementation.

## Why the proposed fix was rejected

**1. It was not the feature.** `User.timezone` is a **server-side** field. It exists so the backend can localize what it sends — day boundaries, streak windows,
reminder fire times. The browser is already in the zone the user is standing in, so browser-local rendering is correct, and a user has no reason to want the UI drawn
in a zone they are not in. F2 framed a decorative control as a missing display feature; the actual answer to "display preference or input preference?" is
**neither** — it is a day-boundary agreement between client and server, which is exactly what `useUserClock` already is.

**2. It would have shipped a worse bug than the one it fixed.** `DateTimeHelper`'s `format*` family is fed two different kinds of `Date`: instants, and **calendar
days** built as browser-local midnight (`store.viewedDate`, picker values, route params). Zone-converting a calendar day shifts it by a day. Roughly half of the ~30
call sites are calendar days, so "format everything in the configured zone"
would have scattered off-by-one-day bugs across the repo while reading like a correctness fix. The taxonomy that makes this visible is in
`prompts/_done/clock/C1-clock-audit.md`, which had already ruled `DateTimeHelper`'s primitives correct and said not to route them through `useUserClock`.

## The gap that was actually there

Nothing kept `User.timezone` **accurate**.

It is captured from `Intl.DateTimeFormat().resolvedOptions().timeZone` at sign-in only —
`LoginView.vue:145`, `RegistrationView.vue:131`, `GoogleSignIn.vue:66` — and nothing revisits it. A stay-logged-in session refreshes tokens for weeks without passing
back through any of those three, so after travel or a move to another device the server keeps localizing in a stale zone. No error, no clue, and the only repair was
the manual picker — which is the control whose existence prompted this ask in the first place.

## What landed

In the submodule:

| File                                                    | Change                                                                                            |
|---------------------------------------------------------|---------------------------------------------------------------------------------------------------|
| `modules/user/utils/timeZoneSync.ts`                    | **new** — owns the opt-in flag, the browser-zone read, the comparison and the best-effort push    |
| `modules/user/store/authStore.ts`                       | `hydrateFromServer()` runs the sync after `fetchUserData()`                                       |
| `bootstrap/installFramework.ts`                         | new `syncBrowserTimeZone?: boolean` option, **default `false`**                                   |
| `modules/user/component/settings/AppearanceSection.vue` | zone renders read-only **when the flag is on**; apps that have not opted in keep the autocomplete |
| `docs/modules/user.md`                                  | new "What `User.timezone` is for" section — the contract this ask asked for                       |
| `docs/composables.md`                                   | `useUserClock` entry cross-references it and says what it is *not* for                            |

App-side: `main.ts` passes `syncBrowserTimeZone: true`.

Defaulting to `false` is what keeps this cheap — every other app on this framework is bit-for-bit unaffected until it opts in, per this directory's scope rules.

## What gets deleted here

Nothing. This app never had a workaround, which F2 got right.

In any app that opts in, `AppearanceSection`'s `onTimezoneChange` handler and its
`Intl.supportedValuesOf('timeZone')` list become dead code. They are deliberately kept, because apps that have not opted in still use them.

## Verification

`npm run type-check` 65 errors (unchanged baseline; `src/_common` at 0), `npm run lint` 0 errors,
`npx vite build` clean. **Reasoned, not observed** — the sync fires on hydration and needs a backend; none of this was exercised in a browser.
