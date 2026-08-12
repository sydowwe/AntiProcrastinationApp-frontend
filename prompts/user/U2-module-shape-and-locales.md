# U2 · Give the module the shape every other module has

- **Scope:** `src/core/user/`, `src/locales/{SK,EN}.ts`
- **Backend:** none
- **Framework:** none (but it removes app strings from the submodule's locale file — read the caveat)
- **Model / effort:** Sonnet 5, medium effort
- **Depends on:** U1 (which creates `composable/`). Can run before it if you create the directory yourself.

---

```
`src/core/user/` is seven files and no structure. It is the only module in `src/core/` with no
`_locales/`, no `api/`, and (before U1) no `composable/`. Two consequences, one cosmetic and one
that actually violates the architecture.

1. MOVE THE APP'S STRINGS OUT OF THE SUBMODULE.

Every string the app's own settings sections render lives in the FRAMEWORK's locale file:

    src/_common/modules/user/_locales/user.sk.ts   (and the .en.ts beside it)
        120  firstDayOfWeek     124  askBeforeDelete    123  preferences
        136  exportData         137  exportDataDescription
        141  about              142  appVersion
        143  termsOfService     144  privacyPolicy      145  contactSupport

`src/_common/docs/modules/user.md:36` says "Nothing app-specific belongs in the sections themselves —
that is what these slots are for", and the same logic applies to the strings the slots render. These
keys describe THIS app: its export format, its support address, its delete-confirmation preference.

Create `src/core/user/_locales/user.{sk,en}.ts` under the `user` namespace and move the app-owned
keys into it. SK is primary and must be real Slovak, not a machine gloss — the existing framework
strings are the register to match.

THE SPREAD IS THE HARD PART. `src/locales/SK.ts:38` does `...user`, where `user` is the framework
file, and object spread is shallow: adding a second `...appUser` would REPLACE the whole `user`
namespace and silently delete the ~140 framework keys (login, 2FA, sessions, everything). The comment
block at SK.ts:19-25 exists because this has already bitten. Merge the one namespace explicitly
instead:

    import frameworkUser from '@/_common/modules/user/_locales/user.sk.ts'
    import appUser from '@/core/user/_locales/user.sk.ts'
    ...
    const SK = {
        ...vuetifyLocale,
        ...common,
        ...appCommon,
        ...activity,
        // (the rest unchanged; DROP the bare `...user` spread)
        ...scheduler,
        ...reminders,
        ...remindersDashboard,
        // `user` is the one namespace two files contribute to: the framework owns auth, 2FA and
        // sessions; this app owns its preference and about/legal strings. Shallow spread would drop
        // one side wholesale, so merge the namespace itself and let the app win collisions.
        user: { ...frameworkUser.user, ...appUser.user },
    }

Mirror it exactly in `EN.ts`. Extend the comment at the top of SK.ts to record that `user` is now a
merged namespace, so the next person adding a locale does not undo it.

CAVEAT: leave the keys in the submodule file alone — you must not edit `src/_common`. The app file
simply wins. The duplicate keys are dead weight until the framework prunes them; note that in your
summary and do NOT open a framework ask for it, since it costs nothing and confirming a duplicate
wastes a turn.

Verify by switching language in settings with both SK and EN and reading every string on the page —
including the framework's login and sessions strings, which is what a botched merge would blank.

2. ONE SETTINGS-CARD SHELL.

`AboutSection.vue`, `DataExportSection.vue` and `PreferencesSection.vue` open with the identical
seven lines:

    <VCard elevation="2" color="surface" class="pa-4 d-flex flex-column ga-3">
        <h3>{{ i18n.t('user.<something>') }}</h3>

(`PreferencesSection` uses `ga-2` — that is drift, not intent.) The three framework sections do the
same thing, so the shell is really framework material, but this app only controls its own three.

Add `src/core/user/component/settings/SettingsSection.vue`: a `title` prop, a default slot, a `ga`
prop defaulting to 3 if any section genuinely needs different spacing. Use the destructure-default
props form. Do not reach for `_common/component/feedback/MyCard.vue` or `SubtleCard.vue` unless you
read them first and one is an exact fit — check before writing a new component, and say which you
chose and why.

Repoint the three sections. The result should delete more lines than it adds.

Do NOT open a framework ask proposing the framework adopt this shell. It is three lines of markup;
the ask would cost the backlog more than the duplication costs the app.

3. INDEX THE MODULE.

`src/core/user/` now has `component/`, `composable/`, `dto/`, `_locales/`, `view/`, plus
`authAdapter.ts` and `user.routes.ts`. Update the paragraph in the root `CLAUDE.md` that describes
what is left in `src/core/user/` ("only this app's glue: authAdapter.ts, dto/userAugmentation.ts, the
settings wrapper view + its route, and the three app-specific settings sections") so it matches
reality. That paragraph is load-bearing — it is what tells the next session not to look for the auth
views here.

Run `npm run type-check` and `npm run lint`.
```
