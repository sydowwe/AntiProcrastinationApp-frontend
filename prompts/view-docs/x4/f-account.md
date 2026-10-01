# X4 — group `account`

Run as **Sonnet 5, high effort, clean context.** Run after `00-shell`.

```
Read prompts/view-docs/x4/TEMPLATE.md in full and follow it exactly. This message fills in its
group parameters.

- Group: `account` → playwright-cli session `-s=x4-account`
- Account: primaryUser for user-settings. The auth views are signed-out: see below.
- Views, in this order:
    user-settings  UserSettingsView             /user/settings  (every section/tab)
    user-settings  TermsView                    /legal/terms
    user-settings  PrivacyPolicyView            /legal/privacy
    auth           LoginView                    /login
    auth           RegistrationView             /registration
    auth           ForgottenPasswordView        /forgotten-password
    auth           ConfirmEmailView             /confirm-email
    auth           ConfirmEmailChangeView       /confirm-email-change
  (GoogleCalendarCallbackView only redirects, so skip it.)
- Component ownership:
    UserSettingsView and its generic sections are FRAMEWORK (src/_common/modules/user/): tag
    [framework], filed in user-settings. The app's own cards (src/core/user/component/settings/,
    GoogleCalendarCard) are app-side.
    All five auth views are framework: tag [framework], filed in auth.

Group-specific traps:
- The auth views need a SIGNED-OUT browser. The signed-in session redirects /login,
  /registration and /forgotten-password to / (SIGNED_OUT_ONLY_ROUTES). Do user-settings and the
  legal pages first, then open a SECOND session, `-s=x4-account-out`, with no state loaded,
  resize it to 390×844 and do the auth views there. Close both at the end.
- Don't submit any auth form. /auth/login is throttled at 5 hits per minute per IP, and a
  submitted registration or reset mail is a real side effect. Filling a field to see the
  validation message is fine, as long as you don't press the submit button.
- Login is the view most likely to be used on a phone. Check the whole form (email, password,
  submit, forgotten-password link, register link) fits without scrolling at 844 px tall, and
  record where the on-screen keyboard would sit (template §4).
- /confirm-email and /confirm-email-change without their token params show an error or
  "invalid link" state. Judge that state's layout. It's the only one reachable.
- UserSettingsView is long. Check that the section navigation (if it has one) stays usable, and
  that the Save or apply action of each preference card is reachable. Don't change a preference:
  that writes to /user/preferences.

Do only this group.
```
