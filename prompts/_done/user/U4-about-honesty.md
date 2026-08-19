# U4 · The About card ships three placeholders

- **Scope:** `../../../src/core/user/component/settings/AboutSection.vue`, `../../../vite.config.ts`, `.env*`
- **Backend:** none
- **Framework:** none
- **Model / effort:** Sonnet 5, low effort
- **Independent**, but run it before or with U5 — both edit `AboutSection.vue`.

---

```
`src/core/user/component/settings/AboutSection.vue` is 29 lines and three of them are wrong in
production.

1. THE VERSION SILENTLY LIES.

    const appVersion = import.meta.env.VITE_APP_VERSION ?? '0.0.0'

`vite.config.ts:155` defines `import.meta.env.VITE_APP_VERSION` via `define:`, and `globals.d.ts:13`
types it as a non-optional `string`. Read what vite.config.ts actually resolves it from. Then:
  - if it resolves from package.json or git and can never be empty, the `?? '0.0.0'` is dead code and
    the type says so — delete it;
  - if it CAN be empty (an env var that is unset in some build), `?? '0.0.0'` renders a version that
    looks real and is not. Show something unmistakably absent instead — hide the row, or render the
    same em-dash the framework's `AppearanceSection` uses for a missing `lastLoginAt` (line 100).
    Never display a fabricated version number to a user reporting a bug.

Also decide whether the build SHA belongs next to it. A version alone is not enough to identify a
build from a bug report if the version only changes on release. If vite.config.ts already has git
information available, show it as a tooltip or a second chip; if it does not, do not add a git call
to the build — say so and move on.

2. THE SUPPORT ADDRESS IS HARDCODED IN A COMPONENT.

    <a href="mailto:support@antiprocrastinationapp.dev">

Move it to a single app-level constant or an env var alongside the version, so it is not a component
edit when it changes. One place, not three files. If you choose an env var, add it to `globals.d.ts`
and give it a sensible non-empty default — an empty `mailto:` renders as a link that opens a blank
compose window, which is worse than no link.

Consider making the mailto useful: prefill the subject with the app version and a body stub. A
support mail that arrives without a version is a round-trip. Keep the prefill short and localized.

3. THE LEGAL LINKS ARE DEAD.

    <a href="/legal/terms">   <a href="/legal/privacy">

No such routes exist — `src/router.ts` has nothing at `/legal`, so both produce a full page reload
into the router's not-found handling. They are also plain `<a>` tags in an SPA, which would force a
reload even if the routes existed.

That is U5's job, not yours. Do NOT delete the links and do NOT create the routes here. If U5 has
already run, they are already `RouterLink`s and you should leave them alone. If it has not, leave
them exactly as they are and note the dependency in your summary.

4. WHILE YOU ARE HERE.

The card renders `user.about` as an `<h3>` with no icon and no structure, and the version row uses a
`VChip` with `size="small" density="compact"` — that combination is a Vuetify redundancy, check the
component API and drop whichever prop the other makes moot. Keep the visual result identical.

If U2 has landed, this card should be using `SettingsSection.vue` rather than its own `VCard` shell.
If U2 has not landed, leave the shell alone — U2 will repoint it.

Run `npm run type-check` and `npm run lint`. Verify the About card in a production build
(`npx vite build && npx vite preview`), not just dev — the version define is a build-time
substitution and dev is not a valid test of it.
```
