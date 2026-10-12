# e2e: FO7, every user can connect a tracker, and the settings card shows and signs it out

> Paste into a fresh session in this repo. Opus, medium effort. Run it **alone** (`prompts/fo-close/README.md`).
> Works against the current API. The FO7 column drop (backend `8a2e0e4`, migration
> `20261012161330_DropUserHasExtensionAccess`) changes nothing a client can see.

## Read first

- `CLAUDE.md` § *Writing e2e specs*, § *Mutating specs* and § *Browser verification*, including the login throttle.
- `docs/feature-opportunities.md` § FO7. What was built: no per-account gate on `POST /api/auth/extension/login`;
  `GET /user/sessions` carries `isExtensionClient`; `TrackersCard.vue` under `/user/settings` → `#integrations`
  says what each tracker records and lists tracker sessions, each with *Sign out*; `_common` labels a tracker
  session "App" and keeps the revoke quiet on a 404.

## The login budget

`POST /auth/login` **and** the extension login are each throttled at 5 hits per minute per IP, and the suite already
spends sign-ins in global setup. Sign the tracker in **once** per test file, through a `request` context posting to
`/api/auth/extension/login` with the seed's **secondary** user (so the primary's sessions in other specs are
untouched), and reuse that session for every test in the file.

## What to cover (new file `e2e/tests/trackers-card.spec.ts`)

1. **Any account can sign a tracker in.** The extension login for the secondary user answers 200 with tokens.
2. **The card lists it.** On the secondary user's `/user/settings`, the Trackers card shows the session as a
   tracker (not as a browser session), with the privacy wording that says what a tracker records.
3. ***Sign out* revokes it.** Click it; the session leaves the card; the tracker's refresh token now fails
   (`POST /api/auth/extension/refresh` → 401, or whatever swagger says the route is).
4. **The web session is not in the tracker list**, and signing the tracker out does not sign the browser out.

If a step needs a state the fixture cannot provide without a new seed shape, do not ask the backend for one
(`CLAUDE.md`: *Do not ask the backend for a seed shape*); create it through the API or leave it to the backend test
`ExtensionActivityTrackingTests`.

## Before writing assertions

Drive the settings card with `playwright-cli` (`-s=fo7`), signed in as the secondary user from its own state file,
and paste the locators it emits.

## Done when

Passes twice in a row (a minute apart, for the throttle); `npm run typecheck --prefix e2e` clean. Update the e2e line
in `docs/feature-opportunities-effort.md` and FO7's status. Commit with `git commit -m … -- <paths>`; do not push.
