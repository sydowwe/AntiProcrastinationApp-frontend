# user-settings — use cases

## What this unit is for
The account layer: where a signed-in person manages who they are (email, password, 2FA, sessions),
how the app looks and behaves for them (theme, language, delete-confirmation habit, first day of
week), where they find every other module's settings page, and where they can export or permanently
destroy their account. The two legal pages are the static contract backing all of it.

## Where it sits
Reached only from the user menu ("User settings") — deliberately no sidebar entry, since this is an
account page, not a feature module (confirmed in `docs/views/_shell/inventory.md`). Per
CLAUDE.md, `/user/settings` is meant to be the **one place every settings surface in the app can be
found from** — `ModuleSettingsSection.vue` (rendered here as "Per-module settings") links out to
module-owned settings pages by route *name*, which is the one sanctioned way for `core/user` to know
about another module without importing it. `/legal/terms` and `/legal/privacy` are linked from here
(the About card) and also from the registration form's checkbox — both public routes.

## Views

### UserSettingsView (`/user/settings`)
**Purpose:** the account settings page — framework-provided shell (`_common/modules/user`'s
`UserSettingsView`) filled with this app's own cards via its `#integrations`, `#preferences` and
`#append` slots.
**Who opens it and why:** anyone who wants to change how the app behaves for them, check/export their
data, connect Google Calendar, or delete their account.

**What the user can do**
- Switch theme (Light / Dark / System) and language, via the framework's Appearance card.
- Edit their email or password (each opens a framework dialog; both warn that the change logs out
  every other device).
- Toggle two-factor authentication (not exercised in this pass — see *Depends on*).
- Connect a Google Calendar account (currently broken — see `findings.md` X1).
- Toggle "ask before deleting single items" and pick their first day of week — both are app-added
  fields (`src/core/user/dto/userAugmentation.ts`) merged onto the framework's `User`/preferences
  payload, saved via `PUT /user/preferences`. **Confirmed live in the mutation pass**: both persist
  across a reload and both show a "Preference saved" success snackbar (the snackbar renders ~250ms
  after the click resolves — a single delayed check can miss it before it auto-dismisses, which is
  exactly what happened on the first attempt in this pass; re-checking with a tighter poll settled
  it). Both were reverted to their original values (`askBeforeDelete: true`, `firstDayOfWeek: 1`
  i.e. Monday) before the session ended.
- Switch theme (also confirmed live): the topbar's own toggle and this page's Light/Dark/System
  group stay in sync (confirmed via the topbar button's `title` flipping between "Switch to light
  mode"/"Switch to dark mode" and the `.v-application` root's `v-theme--dark` class), and dark mode
  renders legibly throughout. Reverted to Light before the session ended.
- Jump to the three other settings pages this app currently registers here: Day planner settings,
  Notifications & reminders, Routine time periods & streaks (`ModuleSettingsSection.vue`, driven by
  `src/core/user/moduleSettingsLinks.ts`).
- See and revoke other active sessions (not exercised — revoking a session risked ending a concurrent
  agent's sign-in during this pass; see `inventory.md`).
- Export their full account data as JSON, either from its own card or from inside the danger zone.
- Reveal an exact per-entity count of what account deletion would destroy ("Show exact numbers").
- Read the About card (real app version, links to both legal pages, a prefilled support mailto) and
  the Danger zone's plain-language destruction list, before reaching the framework's actual "Delete
  account" button in the Security card above.

**What the user can see, and the question it answers**
- Appearance card — answers "what theme/language/timezone is my account set to"
- Security card (framework) + Google Calendar row (app, via `#integrations`) — answers "how is my
  account secured, and is a third-party calendar connected"
- Preferences card (app) — answers "how does the app confirm destructive actions for me, and which
  day starts my week"
- Per-module settings card (app) — answers "where are the *other* preference screens in this app"
- Active sessions (framework) — answers "what else is currently signed in as me"
- Export my data (app) — answers "can I get a copy of everything before I do something risky"
- About (app) — answers "what version am I running, and how do I reach the people who built this"
- Danger zone (app) — answers "what exactly would I lose if I deleted my account"

**Depends on:** the account's own preference fields (`askBeforeDelete`, `firstDayOfWeek`, locale,
theme) — this page is both where they're read from and the only place all of them are set. Also
depends on the three per-user preference systems staying correctly separated (CLAUDE.md's "Where a
preference lives" table) — verified in this pass that tracking settings' deliberate *absence* from
the module-settings list is a documented design decision (`moduleSettingsLinks.ts`'s comment: those
two routes manage mapping/catalogue entities, not preferences, and already have their own sidebar
entries), not a gap.

### TermsView (`/legal/terms`) and PrivacyPolicyView (`/legal/privacy`)
**Purpose:** the actual legal contract, replacing the framework's placeholder
`TermsAndConditionsView` (a documented, intentional orphan — see `docs/views/_routes.md`).
**Who opens it and why:** during registration (checkbox links), or from the About card, by anyone who
wants to read what they agreed to.

**What the user can do**
- Read 13 (Terms) / 19 (Privacy) numbered sections of real English prose — no raw i18n keys, no lorem
  ipsum. A few sections (governing law, the operator's legal identity) explicitly say "will be added"
  — that's a business/legal content gap for whoever owns the copy, not an app defect.
- Jump between the two pages and to "Contact support" via a footer link.

**What the user can see, and the question it answers**
- Full legal text — answers "what did I agree to, and how does this app handle my data"

**Depends on:** nothing dynamic — both routes are `public: true` and render static content
regardless of sign-in state (confirmed signed in, not re-tested signed out — no signed-out sweep is
in scope per README).

### GoogleCalendarCallbackView (`/google-calendar/callback`)
**Purpose:** the landing point for Google's OAuth redirect after a user tries to connect their
calendar from the Security card's "Connect" button.
**Who opens it and why:** never directly — only as a redirect target from Google's consent screen,
carrying either `?code=…` (success) or nothing/`?error=…` (declined or failed).

**What the user can do**
- Nothing — it's a pure redirect target with no rendered UI of its own.

**What the user can see, and the question it answers**
- Nothing. On the two failure-path edge cases exercised in this pass (no `code`, and
  `?error=access_denied`) it silently sends the user back to `/user/settings` with **no** feedback —
  see `findings.md` X2.

**Depends on:** a real Google OAuth round trip for the success path, which could not be completed in
this pass — the "Connect" button that would produce a real `?code=` redirect is itself broken (see
`findings.md` X1), so the success path is entirely `unverified`, not just untested.

## Entity lifecycle
Not an entity module in the domain sense — this unit reads and writes the account itself. Delete
lives in the framework's Security card and was deliberately **not** triggered in this pass (both
`Pass: inventory` and the explicit unit instruction forbid it). Its consequence text is documented in
`inventory.md` from what's rendered, not from having pulled the trigger.

## Data this unit captures but does not spend
- `GET /api/user/account-deletion-summary` returns nine count fields (`activityCount`,
  `trackedSessionCount`, `trackedFrom`/`trackedTo`/`trackedTimeSpanDays`,
  `automaticTrackingEntryCount`, `dayPlanCount`, `plannerTaskCount`, `dayTemplateCount`,
  `todoListCount`, `todoItemCount`, `routineCount`, `leisureItemCount`, `memoryAnchorCount`,
  `googleCalendarLinked`) — spent only by the Danger zone's "Show exact numbers" disclosure. Nothing
  else on this page, or elsewhere in the app as far as this pass observed, reads this endpoint.
- The Active sessions list's device/browser/IP/last-used fields are shown but not spent anywhere else
  (no history of past sessions, no "this looks like a new device" flow).
