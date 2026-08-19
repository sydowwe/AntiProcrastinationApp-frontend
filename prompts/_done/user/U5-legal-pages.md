# U5 · Terms and privacy — route them, and write copy that is actually true

- **Scope:** `../../../src/core/user` (2 new views + routes), `AboutSection.vue`, `_locales/`
- **Backend:** none
- **Framework:** none — do not route `_common`'s `TermsAndConditionsView.vue`, read why below
- **Model / effort:** Opus 5, medium–high effort. Needs real Slovak prose and an honest data survey.
- **Depends on:** U2 (the app's own locale files). Run after U4 if both are queued — same file.

---

```
`AboutSection.vue:18-19` links to `/legal/terms` and `/legal/privacy`. Neither route exists. Both are
plain `<a href>` inside an SPA, so clicking either triggers a full page reload into the router's
not-found path. The app currently ships a settings page with two broken links on it.

The framework has `src/_common/modules/user/view/TermsAndConditionsView.vue`, deliberately unrouted —
`_common/docs/modules/user.md:11` says it is unrouted "because the copy is app-specific — so route it
only if you replace the placeholder text". Read it. If it is a usable shell whose copy comes from
locale keys, reuse the shell; if the placeholder text is baked into the template, you cannot replace
it without editing the submodule, so write app-local views instead and say which you found.

WHAT TO BUILD

Two views in `src/core/user/view/` — `TermsView.vue` and `PrivacyPolicyView.vue` — routed from
`src/core/user/user.routes.ts` at `/legal/terms` and `/legal/privacy` with
`meta: { public: true }`. Public matters: someone must be able to read the terms BEFORE registering,
and the registration view should link to them. Check whether
`_common/modules/user/view/RegistrationView.vue` already renders such a link and, if it does and it
points somewhere dead, note it for a framework ask rather than editing it.

Convert the two `AboutSection.vue` links to `RouterLink`.

Copy lives in the locale files U2 created, under `user.legal.*` — SK primary, EN complete. Long-form
prose in a locale file is unpleasant; structure it as an array of `{ heading, body }` sections the
view renders with `v-for`, rather than forty flat keys. Keep the Slovak natural — this is the one
place in the app where machine-translated register will be obvious to a Slovak reader.

WHAT THE COPY MUST SAY — SURVEY BEFORE YOU WRITE

Do not write generic boilerplate. This app collects unusually sensitive data and a privacy policy
that does not name it is worse than none. Establish what is actually collected by reading the code,
and cite what you found in your summary:

  - `src/core/activityTracking/` — desktop and android trackers. Look at the DTOs: they carry process
    names, product names, WINDOW TITLES and android app labels. Window titles routinely contain
    document names, e-mail subjects and URLs. This is the most sensitive thing the app touches and it
    must be named explicitly, along with the ignore-list mechanism the user has for excluding
    processes (`IgnoredProcessesTable.vue` — check whether it is live; a prompt in
    `prompts/activity-tracking/` reports it as unreferenced).
  - `src/core/googleCalendar/` — a linked Google account and calendar contents.
  - `_common/modules/user/component/settings/SessionsSection.vue:35` — sessions store IP address,
    device and browser, and the user can see and revoke them.
  - `_common/modules/user/` — e-mail, 2FA, password. Push notification subscriptions
    (`usePushNotifications`).
  - reCAPTCHA v3 — `showRecaptchaBadge` route meta and `UseRecaptchaHandler.ts` mean Google receives
    a signal on some pages. Named third-party processors belong in the policy.
  - `/user/data-export` and account deletion (`/user/delete-account`) — the two user rights the app
    already implements. Say plainly that they exist and where the buttons are.

For anything you cannot determine from this repo — retention periods, where data is hosted, whether
there is a processor list, what deletion actually erases server-side — do NOT invent a figure. Write
the section with an explicit `<!-- OWNER: confirm -->` marker in the source and list every one of
them in your final summary. A privacy policy with three honest gaps flagged for the owner is a
deliverable; one with three invented retention periods is a liability.

The terms should cover, at minimum: what the service is, that it is provided as-is with no guarantee
of uptime or data durability, account and acceptable-use basics, that the user owns their data and
can export it, termination on either side, and governing law left as an OWNER marker.

Write it in plain language. Short sentences, second person, no capitalized defined terms unless a
term genuinely repeats. Add a "last updated" date driven by a constant in the view, and state at the
top of both pages, in both languages, that this is the version in effect.

STATE THE OBVIOUS IN YOUR SUMMARY

You are not a lawyer and this is not legal advice. Say so in your final message — not in the page
copy — and tell the user which sections need a real review before this is relied on, especially if
the app is offered to anyone in the EU, where the sensitivity of window-title data makes the lawful
basis and retention questions non-optional.

Run `npm run type-check` and `npm run lint`. Verify both routes load while signed OUT, that the
AboutSection links navigate without a page reload, and that switching SK↔EN swaps the whole document
and not just the headings.
```
