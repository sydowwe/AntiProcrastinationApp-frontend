# App shell

> Captured 2026-09-09 · locale EN (switched from Slovak during this pass — see Findings) · account `999gangshit999@gmail.com` · commit `acd7db0d` · viewport 1920×889 (see Responsive section — narrow-viewport capture is blocked)

## What the shell is
The shell is everything `src/App.vue` renders outside `<RouterView>`: the framework's `Navbar` (top bar + collapsible sidebar, with `UserMenu` and `AppBreadcrumbs` inside it), this app's `NotificationBell` dropped into the Navbar's `#actions` slot, and three global overlays — `Snackbar`, `LoadingFullscreen`, `DialogHost`. The nav tree itself is data-only, supplied by `src/app/nav/navItems.ts` to the framework's sidebar at boot via `installFramework`'s `navTrees` option.

## Top bar
![](screenshots/topbar.png)
| control | kind | selector | does | destination |
| --- | --- | --- | --- | --- |
| Sidebar toggle (hamburger, icon-only) | button | `read_page` ref (no accessible name — see Findings A1) | Collapses/expands the sidebar between full labels and icon-only rail | in place |
| "Adhd time organizer" logo | link | `a[href="/"]` | Navigates home | `/` |
| Breadcrumbs | text/links | `AppBreadcrumbs` (framework) | Shows route hierarchy; ancestor segments are links, current segment is plain text | varies — see Breadcrumbs section |
| Theme toggle (gear icon) | button | accessible via `title="Switch to light mode"` / `"Switch to dark mode"` | Toggles Vuetify theme light/dark, persists via `userStore.setPreferences({theme})` (see `App.vue:108-117`) | in place |
| Notification bell | button | `aria-label="Notifications, N unread"` | Opens the notification dropdown panel | dropdown, see below |
| User menu (email chip) | button | accessible via visible text (the email) | Opens the user menu | dropdown, see below |

## Sidebar
![](screenshots/sidebar-expanded.png)
![](screenshots/sidebar-rail.png)
**Rail behaviour:** The hamburger in the top bar toggles between expanded (icon + label) and rail (icon-only) modes. Confirmed the collapsed state survives an in-app navigation (`/` → `/todo-list`) and a full hard reload of `/todo-list` — it is backed by `_common/store/uiStore.ts`, persisted to `sessionStorage` via the app-wide persistence plugin.

**Active highlight:** The current route's leaf item gets a grey background chip and bold white text; its parent group is expanded and its label is also rendered bold white, but without the background chip. Multiple groups can be expanded simultaneously (not an accordion) — expanding History left Web tracking, To-do list etc. all independently open at the same time.

### Nav tree as rendered
Walked every group by expanding it from `src/app/nav/navItems.ts`. All nine groups plus the two standalone items rendered with the same items, order, and targets declared in the source:

- Home → `/`
- History
  - Summary → `/activity-history`
  - Calendar → `/activity-history/calendar`
- Web tracking
  - All sources → `/activity-tracking/unified`
  - Web tracking → `/activity-tracking`
  - Desktop settings → `/activity-tracking/desktop/settings/distinctEntries`
  - Desktop tracking → `/activity-tracking/desktop`
  - Android tracking → `/activity-tracking/android`
  - Android settings → `/activity-tracking/android/settings/distinctEntries`
- Activity settings → `/activity-settings/activities` (standalone link, no children)
- To-do list
  - To-do list → `/todo-list`
  - Routine → `/routine-todo-list`
- Record activity
  - Manually → `/activity-history/manual`
  - Pomodoro timer → `/activity-history/pomodoro`
  - Stopwatch → `/activity-history/stopwatch`
  - Timer → `/activity-history/timer`
- Task planner
  - Day planner → `/day-planner`
  - Day planner - template → `/day-planner/templates`
  - Planner settings → `/day-planner/settings`
- Leisure
  - What should I do? → `/leisure/pick`
  - Backlog → `/leisure/backlog`
  - Projects → `/leisure/projects`
  - Bucket list → `/leisure/bucket-list`
  - Memory anchors → `/leisure/memory-anchors`
- Reminders
  - Reminder register → `/pripomienky/register`
  - Upcoming → `/pripomienky/nadchadzajuce`
  - Overview → `/pripomienky/prehlad`
  - Dispatch history → `/pripomienky/historia`
- Job scheduler
  - Scheduled jobs → `/planovac/ulohy`
  - Needs attention → `/planovac/pozornost`

### Nav vs routes
`docs/views/_routes.md` does not exist yet (this pass ran before P0.1), so this is a spot check against `navItems.ts` and known route tables, not an exhaustive diff:

- `myReminders` (`/pripomienky/moje`) is **deliberately absent** from the sidebar — reachable only via the user menu's "My reminders" entry (comment in `navItems.ts:74` confirms this is intentional, not an oversight).
- `/user/settings` has no sidebar entry — reached only via the user menu ("User settings"). Expected: it's an account page, not a feature module.
- `/notifikacie` and `/nastavenia/pripomienky` have no sidebar entry either — both reached via the user menu and/or the bell's "See all" link. Consistent with the rest of the account-layer pages.
- The framework's `TermsAndConditionsView.vue` is not routed by this app at all (the app routes its own `TermsView` instead) — a known, documented orphan per the runbook, not rediscovered here as a defect.
- `activity-settings` tabs (`roles`, `categories`) have no separate nav entries — only the `activities` tab is linked from the sidebar; the other two tabs are reachable only via in-page tab controls once on `/activity-settings/activities`. Not verified further (out of shell scope).

## Breadcrumbs
| route tried | breadcrumb shown | segments clickable? |
| --- | --- | --- |
| `/todo-list` | Home › To-do list | "Home" is a link; "To-do list" is plain text (current) |
| `/todo-list/1` (real seeded id) | Home › To-do list | Same as the list route — the breadcrumb does **not** add a third segment for the specific list, so a param route and its parent list route are visually indistinguishable in the breadcrumb (see Findings) |
| `/todo-list/999999` (invalid id) | Home › To-do list | Same breadcrumb; page renders an empty "No tasks" state without visible error, but see Findings for a console-level exception |
| `/day-planner/templates` | Home › Day planner - template | "Home" clickable, current segment plain text |

## Notification bell
Resting state shows a bell icon with a red unread-count badge (started at 12, climbed to 14 over the session as new reminder notifications arrived live). Clicking it opens a dropdown panel ("Notifications" header, "MARK ALL AS READ" action) listing recent items grouped loosely by recency, each with an icon, bold title, one-line body, and relative timestamp. A "SEE ALL →" link at the bottom navigates to `/notifikacie` (the full `NotificationsView`, out of this unit's scope — destination only recorded). Items in the panel did not visibly navigate anywhere when the panel was open (not clicked through, to stay in scope). The panel content itself is entirely in Slovak regardless of the EN locale setting — see Findings F1, tagged **[framework]**.

## User menu
| entry | destination | tested? |
| --- | --- | --- |
| User settings | `/user/settings` | link destination confirmed via `read_page`, not opened in this pass (out of shell scope) |
| My reminders | `/pripomienky/moje` | link destination confirmed, not opened |
| Notifications | `/notifikacie` | link destination confirmed, not opened |
| Notifications & reminders | `/nastavenia/pripomienky` | link destination confirmed, not opened |
| Log out | — | **present, untested** — clicking it would end the session for the rest of this pass |

Escape closes the user-menu dropdown (confirmed).

## Global overlays

### Dialogs (DialogHost)
Triggered the to-do list "ADD" dialog (a `MyDialog` instance, "Add to to-do list") from `/todo-list/1` — a route-agnostic global overlay, not documented as to-do-list content. Findings:
- **Escape does not close it.** Confirmed twice (once with focus on the dialog body, once right after opening). Source inspection (`src/_common/component/dialog/MyDialog.vue:86,136-138`) shows this is the *default* behaviour: `persistent` defaults to `true`, and `onEscKey` only calls close when `!persistent`. So most `MyDialog` instances across the app will not close on Escape unless the call site explicitly sets `persistent={false}`. This is a deliberate framework default, not a one-off bug, but it is a real keyboard dead end for any dialog that keeps the default — see Findings F2, tagged **[framework]**.
- The Cancel button closes it normally, restoring focus to the element that opened it (`MyDialog.vue:144-155` re-focuses `openerElement` on close) — this worked as expected.
- Did not observe dialog nesting or a focus trap violation in this single-dialog test.

### Snackbars
Not independently triggered as a distinct "toast" separate from the notification panel in this pass (the to-do dialog's Cancel/Add path wasn't submitted, to avoid mutating seed data out of scope). A live in-app notification did appear as a blue snackbar-style toast ("Blíži sa termín") near the top of the viewport while on `/todo-list/1`, auto-dismissing within a couple of seconds — consistent with the `Snackbar.vue` component. Did not get to test stacking behavior (only one arrived during the session, transient, not caught in a saved screenshot — see Findings, marked `unverified`).

### Fullscreen loading
Not observed stranded during any of the ~15 navigations performed in this pass (home → todo-list → todo-list/1 → todo-list/999999 → day-planner/templates → home, plus dialog opens/closes). Source (`src/router.ts:68-72`) confirms `router.beforeEach` unconditionally calls `hideFullScreenLoading()` on every navigation specifically so an outgoing view's spinner can never strand the overlay — behaviour matches the comment.

## Keyboard & focus
Tabbed from a fresh `/` load, starting with focus on the sidebar-toggle button:
1. Sidebar toggle (hamburger) — **no accessible name** (see Findings A1)
2. Logo link ("Adhd time organizer", `href="/"`)
3. Theme toggle (named via `title` attribute)
4. Notification bell (`aria-label="Notifications, N unread"`)
5. User menu button (named via its visible email text)
6. Sidebar rail items in order (`aria-label="Home"` confirmed for the first), then into main-content controls (task action buttons)

No skip-link was encountered before reaching interactive sidebar/main content — see Findings A2. Order is sensible (top bar left-to-right, then sidebar top-to-bottom, then main content) and matches visual layout. Did not find a focus trap outside the one dialog tested; the user menu and notification panel both closed cleanly on Escape and returned to a sane state.

## Responsive (narrow viewport)
![](screenshots/narrow.png)
**Unblocked in round 2** — the round-1 block was a tooling limit (the browser MCP's `resize_window` reported success without resizing anything), not an app behaviour. `playwright-cli resize 390 844` actually applies, confirmed by `window.innerWidth`/`innerHeight` reading 390×844.

At 390×844 the sidebar swaps from a persistent drawer to `v-navigation-drawer--temporary v-navigation-drawer--mobile`, closed by default and opened by the same top-bar hamburger; it overlays the content with a scrim (`.v-navigation-drawer__scrim`) rather than pushing it, and Escape closes it. Drawer width stays 288px. No horizontal overflow: `document.documentElement.scrollWidth` is 390, equal to the viewport.

One layout difference worth recording: the top bar renders a **fifth** button at mobile width — a standalone log-out icon button (`title="Log out"`, no `aria-label`) that is not present at desktop width, where log out lives only inside the user menu. The user-menu button still renders the full account e-mail next to it at 390px.

## Console & network at boot
- **errors/warnings:** none at `/` itself on a clean load (only Vite HMR debug messages). App-code errors *were* seen later in the session, but only after navigating to other routes while testing breadcrumbs, not from the shell/boot path itself:
  - `/day-planner/templates`: five `CanceledError: canceled` console errors plus one "Unhandled error during execution of mounted hook at `<TemplateListView>`", from `TemplateListView.vue:126-128` via `useFetchFiltered` — looks like an aborted-request race on navigating away quickly, not a shell defect, but flagged for the `planner-templates` unit's own pass.
  - `/todo-list/999999` (deliberately invalid id): one `AxiosError: Request failed with status code 404` plus "Unhandled error during execution of mounted hook at `<TodoListView>`", from `TodoListView.vue:126` via `useEntityQuery`. The view itself degrades gracefully in the UI (renders an empty "No tasks" state, no visible crash), but the fetch failure surfaces as an unhandled console exception rather than being caught — flagged for the `todo-lists` unit's own pass.
- **non-2xx:** none observed in the boot network sequence itself (see below). The one 404 above is a view-level fetch on an invalid id, not a boot request.
- **duplicate requests:** none found among the boot-time API calls. `hubs/notifications/negotiate` fires as OPTIONS then POST, which is a CORS preflight + the actual SignalR negotiate call, not a duplicate.
- **boot requests (what fires before any view mounts):** confirmed via `read_network_requests` filtered to the backend origin on a fresh `/` load:
  1. `OPTIONS /hubs/notifications/negotiate` → 204, `POST /hubs/notifications/negotiate` → 200 (SignalR handshake, from `startNotificationSession()`)
  2. `GET /api/user/data` → 200
  3. `GET /api/push-subscription/vapid-public-key` → 200
  4. `GET /api/activity-role/all-options`, `/api/activity-category/all-options`, `/api/activity/all-options` → 200 each (from `useActivityOptionsStore()`'s `ensureLoaded()`)
  5. `GET /api/calendar/day-plan/2026-09-09` → 200
  6. `GET /api/routine-todo-list/grouped-by-time-period`, `/api/routine-time-period` → 200
  7. `OPTIONS`/`POST /api/activity-history/dashboard/detail/pie-chart` → 200 (HomeView widget, out of shell scope but fires at boot)
  8. `GET /api/todo-list-item/dashboard-widget` → 200
  9. `GET /api/notification/mine?limit=20`, `/api/notification/unread-count` → 200
  10. `GET /api/activity-backlog-profile` → 200

  This matches the three boot-time store creations documented in `App.vue`'s comments (`useRunningTimerStore()`, `startNotificationSession()`, `useActivityOptionsStore()`), plus HomeView's own widget fetches riding along on the same initial load.

## Findings

**Tally:** blocker 0 · bug 1 · a11y 3 · polish 1 · opportunity 0 · unverified 2 · **Framework-tagged: 3**

## Round history
| round | date | commit | what changed |
| --- | --- | --- | --- |
| 1 | 2026-09-09 | `acd7db0d` | initial shell pass |
| 1a | 2026-09-10 | `acd7db0d` | backfilled `Status:` / `Verify:`; renumbered to the severity-prefix rule (`F1`→`B1`, `F2`→`A1`, old `A1`→`A2`, old `A2`→`A3`). Tally corrected: `F2` was severity `a11y` but counted as a bug. |
| 2 | 2026-09-10 | `a87a3502` + working tree | re-verified the whole unit through `playwright-cli` against the **EN default locale** (`src/i18n.ts` `locale: 'EN'`, the signed-out guard in `App.vue`, and the filled-in `_common/_locales/common.en.ts`), signed in through the login form as the seed account `test@example.com`. Responsive section unblocked. A1/A2/A3/P1 re-confirmed open; B1 not re-testable on this account. |

---

### B1. Notification content ignores the account's English locale preference — renders raw Slovak text
- **Status:** open — **not re-tested in round 2**: the seed account (`test@example.com`) has zero notifications, so the panel only rendered its "No notifications" empty state. Re-testing needs an account with dispatched notifications, or a dispatch triggered on purpose.
- **Severity:** bug — **[framework]**
- **Where:** Notification dropdown panel (`NotificationBell` → its panel) and `/notifikacie`, backed by `src/_common/modules/notifications/`
- **Expected:** With the account's language preference set to English (confirmed via `/user/settings` → Appearance → Language = "Angličtina"/English, and every other piece of chrome — nav labels, breadcrumbs, dialog buttons — rendering in English), notification titles and bodies should also be in English.
- **Actual:** Every notification in the panel is in Slovak: "Blíži sa termín", "Obdobie sa skončilo", "Pripomienky", "Naplánovaná úloha sa nespustila", "Naplánovaná úloha zlyhala", "Testovacia notifikácia" — titles, bodies, and relative-time labels are untranslated Slovak strings, while the surrounding UI chrome (bell aria-label, "MARK ALL AS READ", timestamps like "in a few seconds") is in English.
- **Evidence:** `docs/views/_shell/screenshots/notification-panel-sk-leak.png`; requests confirmed served from `/api/notification/mine` and delivered live via the `hubs/notifications` SignalR hub (module `src/_common/modules/notifications/`).
- **Repro:** 1. Set account language to English at `/user/settings`. 2. Open the notification bell. 3. Read any notification title/body.
- **Verify:** 1. With the account locale set to English, open the notification bell. 2. **Pass condition:** notification titles and bodies read as English (e.g. no "Blíži sa termín", "Obdobie sa skončilo", "Naplánovaná úloha zlyhala"). 3. Trigger a fresh notification and confirm the newly-arrived one is English too — pre-existing rows may have been persisted in Slovak at creation time and could need a reseed rather than a code fix.
- **Root cause guess:** Text appears to be localized server-side at dispatch time rather than resolved client-side through vue-i18n. Likely a backend dispatch-template change, not an `src/` fix — do not batch with the client-side raw-key findings.
- **Suggested fix:** Notification title/body text appears to be rendered server-side (or pre-localized at creation time) rather than resolved client-side via vue-i18n against the user's current locale preference — likely a backend template/localization gap, not a frontend rendering bug. Worth an escalation to whoever owns the reminder/notification dispatch templates.

### A1. `MyDialog` does not close on Escape by default (persistent=true default)
- **Status:** open
- **Severity:** a11y — **[framework]**
- **Where:** `src/_common/component/dialog/MyDialog.vue:86,136-138`; observed via the to-do list "Add to to-do list" dialog opened from `/todo-list/1`
- **Expected:** A modal dialog should be dismissable with Escape — this is both a common accessibility expectation (WAI-ARIA dialog pattern) and the PROMPT-TEMPLATE.md checklist explicitly asks "does Escape close the dialog."
- **Actual:** Pressing Escape (tried twice, once with the dialog title clicked into focus first) left the dialog open. Source shows `onEscKey()` only calls `onCloseBtnClick()` when `persistent` is `false`, and `persistent` defaults to `true`. Since call sites must opt out explicitly, most dialogs across the app likely inherit this behaviour unless individually overridden.
- **Evidence:** Manual repro (2 attempts) plus source read of `MyDialog.vue`.
- **Repro:** 1. Go to `/todo-list/1`. 2. Click "ADD". 3. Press Escape. Dialog stays open.
- **Verify:** 1. Go to `/todo-list/1`, click "ADD", press Escape. 2. **Pass condition:** the dialog closes and focus returns to the "ADD" button. 3. Then confirm the guard still holds where it should: open a dialog that is deliberately `persistent` (a destructive confirm, e.g. list delete) and confirm Escape does **not** dismiss that one. Both halves must hold — a fix that makes every dialog escapable is a regression, not a fix.
- **Root cause guess:** Framework-wide default (`persistent = true` in `MyDialog.vue`), so this is one decision affecting every dialog in every app on the framework — not a per-call-site fix. Handle as its own batch.
- **Suggested fix:** Either flip the semantic default so "Escape closes unless the dialog is guarding an in-progress destructive action," or make individual call sites pass `persistent={false}` where there's nothing to lose (e.g. a create form the user hasn't started filling in) — a framework-level decision, not one this app can make unilaterally.

### A2. Sidebar-toggle button has no accessible name
- **Status:** open
- **Severity:** a11y — **[framework]**
- **Where:** Top bar hamburger/sidebar-toggle button, `src/_common/nav/AppTopBar.vue` (rendered inside `Navbar.vue`)
- **Expected:** Every icon-only interactive control needs an accessible name (text content, `aria-label`, or `title`) so it can be addressed by assistive tech and by name-based automation.
- **Actual:** `document.activeElement` inspection after tabbing to it showed empty `textContent`, `aria-label: null`, and `title: ""`. It has no accessible name at all — contrast with the theme toggle right next to it, which does have `title="Switch to light mode"`.
- **Evidence:** JS console query: `{"cls":"v-btn v-btn--icon ...","text":"","title":""}` with `aria-label` returning `null`.
- **Repro:** 1. Load `/`. 2. Tab to the first focusable element (or inspect the hamburger button in devtools). 3. Check for accessible name.
- **Verify:** 1. Load `/`. 2. Inspect the hamburger button in `AppTopBar`. 3. **Pass condition:** it exposes a localized accessible name, and toggling the sidebar still works. 4. Confirm the name changes with the locale rather than being hardcoded English.
- **Root cause guess:** Same class as the unit-level icon-button findings (`todo-lists` A1/A2), but this one is **[framework]** — it lives in the submodule, so it cannot ship in the same commit as the app-side ones. Separate batch.
- **Suggested fix:** Add `aria-label` (localized) to the `VIconBtn` in the framework's `AppTopBar.vue`.

### A3. No skip-to-content link
- **Status:** open
- **Severity:** a11y
- **Where:** App shell overall — first Tab stop from a fresh page load is the sidebar toggle, not a skip link
- **Expected:** A "skip to main content" link (visually hidden until focused) is a standard pattern letting keyboard users bypass the top bar and sidebar to reach the page's primary content directly.
- **Actual:** None found. Tabbing from load goes: sidebar toggle → logo → theme toggle → bell → user menu → sidebar rail items → main content, with no shortcut.
- **Evidence:** Manual Tab-order walk (this pass, Keyboard & focus section) using `document.activeElement` inspection at each step.
- **Repro:** 1. Load `/`. 2. Tab repeatedly from the start and observe the sequence.
- **Verify:** 1. Load `/`. 2. Press Tab once. 3. **Pass condition:** the first focusable element is a visible "skip to main content" link; activating it moves focus into the main content region, past the sidebar. 4. Confirm the link is not visible when unfocused.
- **Suggested fix:** Add a skip link as the first focusable element in `App.vue` or the framework's top-level layout.

### P1. Breadcrumb does not distinguish a list-detail route from its parent list route
- **Status:** open
- **Severity:** polish
- **Where:** `AppBreadcrumbs` (framework) rendering `/todo-list` and `/todo-list/1` (and presumably `/todo-list/999999`) identically as "Home › To-do list"
- **Expected:** Plain user sense — a breadcrumb's job is to show where you are; a param route ought to add a segment (even just the record's name) so it's visually distinguishable from its list page.
- **Actual:** Both routes render the exact same two-segment breadcrumb; there is no third segment for the specific to-do list.
- **Evidence:** Screenshots taken at `/todo-list` and `/todo-list/1` (zoomed top-bar crops) are pixel-identical in the breadcrumb region.
- **Repro:** 1. Visit `/todo-list`. 2. Note breadcrumb. 3. Visit `/todo-list/1`. 4. Compare — identical.
- **Verify:** 1. Visit `/todo-list`, note the breadcrumb. 2. Visit `/todo-list/1`. 3. **Pass condition:** the second breadcrumb carries an additional segment identifying the specific list, and the "To-do list" segment is now a working link back to `/todo-list`. 4. Confirm no raw id or i18n key leaks into the new segment.
- **Note:** this is a shell-rendered control but the fix likely belongs to whichever unit owns the route meta. Deferred to `todo-lists` at discovery time.
- **Suggested fix:** Route meta could supply a dynamic breadcrumb label (e.g. the list's name) for `:id` routes; a decision for whichever unit owns `todo-lists`, not this shell pass.

### U1. Snackbar stacking behaviour not verified
- **Status:** open
- **Severity:** unverified
- **Where:** `Snackbar.vue` (framework), global overlay
- **What would verify it:** Only one live notification-triggered snackbar appeared during this pass (transient, not caught in a saved screenshot before it auto-dismissed). To confirm whether snackbars stack or replace, a pass would need to trigger two snackbar-worthy actions in quick succession (e.g. two quick toggles that each fire a success toast) and observe whether both are visible at once or the second replaces the first.

### U2. Fullscreen loading strand behaviour only spot-checked
- **Status:** open
- **Severity:** unverified
- **Where:** `LoadingFullscreen.vue` / `router.beforeEach` in `src/router.ts:70-72`
- **What would verify it:** This pass performed ordinary-speed navigations and never saw a stranded overlay, and the source clearly shows `hideFullScreenLoading()` firing unconditionally on every route change. A stronger test — navigating away *during* a slow request that shows the loader, e.g. by throttling the network — was not attempted in this pass and would give firmer confidence.
