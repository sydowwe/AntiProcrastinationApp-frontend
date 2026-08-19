# F4 · The registration checkbox links the terms to a path the framework never routes

**Resolved 2026-08-18 — `../../../../migration-revision.md` R19.** Landed as an `installFramework({ legalRoutes })`
collaborator rather than the props proposed below: `RegistrationView` is routed by the framework's own
`userRoutes`, so an app spreading that table has no seam to pass props through. Everything below is kept as the record of the gap.

**Framework ask.** `src/_common` is a submodule; this describes a change to make in the
`vue_framework` repo, not here.

## The gap

`_common/modules/user/view/RegistrationView.vue:41` renders the "I agree to the terms" checkbox label as:

```vue
<RouterLink to="/terms-and-conditions">{{ i18n.t('authorization.termsAndConditions') }}</RouterLink>
```

The path is hardcoded, and **nothing routes it.** `_common/modules/user/user.routes.ts` exports five routes — `/login`, `/registration`, `/forgotten-password`,
`/confirm-email`, `/confirm-email-change` — and `TermsAndConditionsView.vue` is deliberately not among them (`docs/modules/user.md:11`: unrouted
"because the copy is app-specific"). The framework therefore ships a link, in the one place where a user is asked to *agree* to a document, that resolves to no route
at all.

What the user sees in this app (before the workaround below): clicking "terms and conditions" on the registration form navigates to a blank page, with `[Vue Router warn] No match found for location with
path "/terms-and-conditions"` in the console. There is no back link — the user has to use the browser back button to return to a half-filled registration form.

Two smaller things in the same six lines:

- The checkbox links only the terms. There is no link to a privacy policy, which for any app processing personal data is the document that actually has to be
  readable before consent.
- `authorization.termsAndConditions` is the framework's own locale key, so an app that routes its legal pages under different names still gets the framework's
  wording for the link text. That is fine and not part of this ask.

## Why it cannot be fixed app-side

It can be worked around app-side, but not fixed: the path is a literal in the framework template, and
`RegistrationView` exposes no slot around the checkbox label. An app whose legal pages live anywhere other than `/terms-and-conditions` has no seam to tell the
framework so.

## The app-side workaround kept in the meantime

`../../../../src/core/user/user.routes.ts` — the `/legal/terms` route carries `alias: '/terms-and-conditions'`, so the framework's hardcoded link resolves to this
app's terms page. It is deliberate and commented at the route. What it costs: this app now answers on a path it did not choose and would not otherwise publish, and
the alias has to survive every future edit of that route table. No workaround exists for the missing privacy link.

## What the framework should expose

Two optional props on `RegistrationView`, both defaulting to today's behaviour:

```ts
const {
	termsRoute = '/terms-and-conditions',
	privacyRoute = undefined,
} = defineProps<{ termsRoute?: RouteLocationRaw; privacyRoute?: RouteLocationRaw }>()
```

- `termsRoute` defaults to the current literal, so every existing consumer is bit-for-bit unaffected.
- `privacyRoute` renders a second link in the label only when given, so consumers that have no privacy page render exactly what they render today.

Passing them means the route table stays the app's business, which is the same split
`installFramework`'s collaborator options already use.

If a prop pair is judged too much for a checkbox label, the cheaper version is a single
`#termsLabel` slot on the checkbox, defaulting to the current markup. That solves this app's case and every variant of it, at the cost of the app repeating the "I
agree to" sentence.

## What gets deleted here when it lands

`../../../../src/core/user/user.routes.ts` — the `alias: '/terms-and-conditions'` line and the six-line comment above it. `../../../../src/router.ts` and the views
are unaffected either way.
