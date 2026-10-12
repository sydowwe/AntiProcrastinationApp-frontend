# account — data-map extract

> Extracted 2026-10-01 · commit `4d890646` · units: 14 `user-settings`, 15 `auth`, `_shell` (inventory only) ·
> modules: `src/core/user/` (app glue + `dto/userAugmentation.ts`), `src/_common/modules/user/` (framework DTOs: `User`,
> `UserSession`, preferences, sign-in requests), `src/core/googleCalendar/` (no `dto/`; `api/googleCalendarApi.ts` mapped inline)
> DTO files read: 11 · fields mapped: 58 (+ 19 client-side storage keys, listed separately) · skipped by rule: ids, join-only
> FKs, transport wrappers. Kept despite the rule: `User.id`, because it **decides** something: it scopes every per-user storage key
> and resets five stores. Also skipped: confirmation-link `userId`/`token` query params, which are opaque transport.
> Inline request and response bodies (auth endpoints, 2FA, Google Calendar) have no DTO class. They are mapped as their own
> entities and named after the endpoint.

## Summary
- **`weatherLocation` is a whole preference the client cannot see.** The API stores it on `User`, accepts it on
  `PUT /user/preferences` (`UpdateUserPreferencesRequest.WeatherLocation`), returns it on `GET /user/data`
  (`AppUserDataResponse`), and uses it as the **only** input to `GET /leisure-weather-fit`. `/leisure/pick` consumes that
  endpoint's output (`core/leisure/view/PickerView.vue:133`). The client never declares, reads or writes the field.
  `User.fromJson` copies it through as an untyped passthrough, and nothing in `src/` sends it. So the leisure weather signal
  can only ever run on an empty location. This is the strongest unspent item in the group.
- **Two fields the client reads that the server never sends.** `User.lastLoginAt` is rendered by the Appearance card's
  "Last login" row, but `UserDataResponse` has no such member, so the row never appears. `LoginView` passes
  `response.data.email` to `userStore.login()`, but the password `LoginResponse` carries only `requiresTwoFactor`/`requiresTwoFactorSetup`.
  That makes `login(undefined)`, so a plain password sign-in never writes `auth.lastUsedEmail`. Only registration, 2FA and
  Google sign-in write it.
- **The three app preferences are the most cross-module data in the app.** `timezone` is read (via `useUserClock`) by 7
  modules for day boundaries. `firstDayOfWeek` is read by `dayPlanner`, `activityHistory`, `activityTracking` and `todoList`.
  `askBeforeDelete` is read by `todoList`, `dayPlanner`, `historyDashboard` and `activity` through `useDeleteConfirmation`.
  No read of `currentUser.askBeforeDelete` or `firstDayOfWeek` bypasses `useUserPreferences`. Every preference
  passes the "Where a preference lives" rule in the direction it currently lives.
- **The account-deletion summary is the richest read-only payload here, and only the danger zone reads it.** It has 15
  derived counts, including `trackedFrom`/`trackedTo`/`trackedTimeSpanDays` ("N days of history") and
  `automaticTrackingEntryCount`. They are lifetime account stats that nothing else shows (no "your account so far" surface on
  home or settings).
- **Session history is thin.** `UserSession.createdAt` is parsed and never read. Each session's device, browser, IP and
  last-used time are shown only in the Active sessions list. Nothing tells you when a sign-in came from a new device.
- **The server returns 2FA-setup state that the client drops.** `requiresTwoFactorSetup` on the password and Google login
  responses, and `requiresTwoFactor` on the Google one, are never read. The server's forced-setup login step
  (`SetupTwoFactorForLoginEndpoint`) has no client caller.
- **The user store persists to `localStorage`, not `sessionStorage`** (`authStore.ts:96`). So the whole `currentUser`
  (e-mail and every preference) outlives the tab until logout. The auth inventory says otherwise.

## Entities

### User — `src/_common/modules/user/dto/response/User.ts` (+ `src/core/user/dto/userAugmentation.ts`) · request: `UserPreferencesRequest.ts` (`PUT /user/preferences`)
All five preference fields round-trip through `userStore.setPreferences()` (`authStore.ts:51`), which PUTs and then
`Object.assign`s optimistically. The rows below cover both the response and the request field.

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `id` | `number` | server | `core/user/composable/useUserScopedStorage.ts:23` (storage scope for every per-user key); reset watchers in `activity/store/activityOptionsStore.ts:294`, `todoList/store/routineReviewStore.ts:76`, `todoList/store/earnedRewardsStore.ts:126`, `home/composable/useTodayPlan.ts:545`, `activityHistory/store/runningTimerStore.ts:883` | derived · spent | — |
| `email` | `string` | registration form; Security card → Email change dialog (`newEmail`) | shell user-menu chip via `core/user/authAdapter.ts:21` (`displayName`); Security card row (`SecuritySection.vue:16,264`) | spent | — |
| `twoFactorEnabled` | `boolean` | registration checkbox; Security card toggle (`/user/2fa/toggle`) | Security card toggle only (`SecuritySection.vue:48,55,193`). It is overwritten on mount from `GET /user/2fa/status` (`SecuritySection.vue:112-114`), so the `/user/data` value is superseded | echo | — |
| `createdAt` | `string` | server | `/user/settings` → Appearance card "Member since" (`AppearanceSection.vue:121`) | derived · spent | yes |
| `lastLoginAt` | `string \| null` | server (**never sent**, see *Server sends, client drops*) | `/user/settings` → Appearance card "Last login", `v-if`-gated (`AppearanceSection.vue:56,125`). It never renders | derived · spent (dead: always `null`) | yes |
| `theme` | `ThemePreference` | Appearance card toggle; shell top-bar theme button (mirrored to the server by `App.vue:143-151`) | `App.vue:112` applies it to Vuetify and seeds the `theme` localStorage key; Appearance toggle | spent | — |
| `locale` | `AvailableLocales` | Appearance card language select; registration (`currentLocale`) | `App.vue:118` sets `i18n.locale`; server-side, it localizes notification text (`_shell` B1, fixed by backend B15) | spent | — |
| `timezone` | `string` | browser zone at sign-in/registration; re-synced on every hydration (`timeZoneSync.ts`, `syncBrowserTimeZone: true` in `main.ts`); read-only in the Appearance card | `main.ts:28` → `useUserClock` (`isoDateInUserZone` / `timeInUserZone` / `minutesOfDayInUserZone`) in `dayPlanner` (8 files), `todoList` (6), `home/composable/useDashboardRefresh.ts`, `activityHistory/view/HistorySummaryView.vue`, `leisure` (`useLeisureCommitment.ts`, `dto/request/MemoryAnchorRequest.ts`), `core/user/composable/useDataExport.ts` (export file name). Server: reminder windows, streaks, deletion-summary dates | spent | yes |
| `askBeforeDelete` | `boolean?` (app) | `/user/settings` → Preferences card checkbox (`core/user/component/settings/PreferencesSection.vue:49`) | `useUserPreferences` → `useDeleteConfirmation.resolveDelete` in `todoList` (`TodoListsView.vue:190`, `useUndoableListCrud.ts:68`, `useTodoListCategories.ts:15`), `dayPlanner` (`TemplateListView.vue:222`, `DayPlanner.vue:87`), `historyDashboard` (`HistoryTimeline.vue:157`), `activity` (`ActivityCategoryTable.vue:91`) | spent | — |
| `firstDayOfWeek` | `0 \| 1` (app) | Preferences card Mon/Sun toggle | `useUserPreferences` in `dayPlanner/view/PlannerCalendarView.vue:136`, `activityHistory/view/HistoryCalendarView.vue:79`, `activityHistory/view/HistoryDetailView.vue:258`, `activityTracking/composable/useActivityRangePresets.ts:116`, `todoList/composable/useRoutineWeeklyReview.ts:14` | spent | yes |
| `weatherLocation` | (undeclared; passthrough via `User.fromJson:41-43`) | **nowhere in the client**. The server accepts it on `PUT /user/preferences` | nothing in `src/`. Server-side, it is the sole input to `GET /leisure-weather-fit` → `leisure/view/PickerView.vue` `weatherFit` | derived · unread | — |

### User session — `src/_common/modules/user/dto/response/UserSession.ts` · request: none (`GET /user/sessions`, `DELETE /user/sessions/{id|all}`)
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `device` | `string` | server (user agent) | `/user/settings` → Active sessions row (`SessionsSection.vue:22`) | derived · spent | — |
| `browser` | `string` | server | same row (`SessionsSection.vue:22`) | derived · spent | — |
| `ip` | `string` | server | same row (`SessionsSection.vue:35`) | derived · spent | — |
| `lastUsedAt` | `string` | server | same row, relative ("Last used: …", `SessionsSection.vue:35`) | derived · spent | yes |
| `createdAt` | `string` | server | — (grep of `\.createdAt` across `_common/modules/user` finds only `User.createdAt`) | derived · unread | yes |
| `isCurrent` | `boolean` | server | "This device" chip and the disabled Revoke button (`SessionsSection.vue:24,42`); kept after "log out all others" (`:137`) | derived · spent | — |

### Account deletion summary — `src/core/user/dto/response/AccountDeletionSummary.ts` · request: none (`GET /user/account-deletion-summary`)
Every field is read in exactly one place: `/user/settings` → Danger zone → "Show exact numbers"
(`core/user/component/settings/DangerZoneSection.vue:108-141`). Each line renders only when its count is non-zero.

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `activityCount` | `number` | server | Danger zone line (`:140`) | derived · spent | — |
| `trackedSessionCount` | `number` | server | Danger zone line (`:115`) | derived · spent | — |
| `trackedFrom` | `string \| null` | server (user's own clock) | Danger zone span suffix (`:116-118`) | derived · spent | yes |
| `trackedTo` | `string \| null` | server | Danger zone span suffix (`:116-119`) | derived · spent | yes |
| `trackedTimeSpanDays` | `number` (server: `int?`) | server | Danger zone span suffix (`:120`) | derived · spent | yes |
| `automaticTrackingEntryCount` | `number` | server | Danger zone line (`:112-113`) | derived · spent | — |
| `dayPlanCount` | `number` | server | Danger zone line (`:127`) | derived · spent | — |
| `plannerTaskCount` | `number` | server | same line as `dayPlanCount` (`:127`) | derived · spent | — |
| `dayTemplateCount` | `number` | server | Danger zone line (`:130`) | derived · spent | — |
| `todoListCount` | `number` | server | Danger zone line (`:133`) | derived · spent | — |
| `todoItemCount` | `number` | server | same line as `todoListCount` (`:133`) | derived · spent | — |
| `routineCount` | `number` | server | Danger zone line (`:135`) | derived · spent | — |
| `leisureItemCount` | `number` | server | Danger zone line (`:137`) | derived · spent | — |
| `memoryAnchorCount` | `number` | server | Danger zone line (`:139`) | derived · spent | — |
| `googleCalendarLinked` | `boolean` | server | Danger zone line (`:141`) | derived · spent | — |

### Sign-in & registration requests — `src/_common/modules/user/dto/request/{LoginRequest,PasswordSignInRequest,GoogleSignInRequest,RegistrationRequest,EmailRequest}.ts`
`POST /auth/login`, `/auth/login/google` and `/auth/register`. `ForgottenPasswordView` and `ResendConfirmationEmail` send
inline `{ email[, recaptchaToken] }` bodies rather than `EmailRequest`. Those e-mails are the same captured value as below.

| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `LoginRequest.stayLoggedIn` | `boolean` | `/login` → "Stay logged in?" checkbox; also sent on `/auth/login/2fa` (`LoginVerifyQrCode.vue:52`) | — (governs the server's refresh-token lifetime; no response carries it) | write-only | yes |
| `LoginRequest.recaptchaToken` | `string` | reCAPTCHA v3, on login / register / Google / forgotten-password / reset-password | — | write-only | — |
| `LoginRequest.timezone` | `string` | `Intl…timeZone` at sign-in (`LoginView.vue:147`, `GoogleSignIn.vue:66`) | becomes `User.timezone` → see User | spent | yes |
| `PasswordSignInRequest.email` | `string` | `/login` → Email field (prefilled from `auth.lastUsedEmail`, `LoginView.vue:134`) | becomes `User.email` after hydration | spent | — |
| `PasswordSignInRequest.password` | `string` | `/login` → Password field | — | write-only | — |
| `GoogleSignInRequest.code` | `string \| null` | Google OAuth popup | — | write-only | — |
| `RegistrationRequest.email` | `string` | `/registration` → Email | written to `auth.lastUsedEmail` (`RegistrationView.vue:182`) → `/login` and `/forgotten-password` prefill; later `User.email` | spent | — |
| `RegistrationRequest.twoFactorEnabled` | `boolean` | `/registration` → 2FA checkbox | echoed in `TwoFactorAuthResponse.twoFactorEnabled` to branch into the QR dialog; later only the Security card's own toggle | echo | — |
| `RegistrationRequest.currentLocale` | `AvailableLocales` | current UI locale at submit (`RegistrationView.vue:172`) | becomes `User.locale` → `App.vue:118` | spent | — |
| `RegistrationRequest.timezone` | `string` | `Intl…timeZone` at submit (`RegistrationView.vue:174`) | becomes `User.timezone` | spent | yes |

### Auth responses (inline, no DTO class) — `LoginView.vue`, `GoogleSignIn.vue`, `RegistrationView.vue`, `SecuritySection.vue`, `MyTwoFactorAuthInput.vue`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `LoginResponse.requiresTwoFactor` | `boolean` | server | `LoginView.vue:153`: opens the 2FA code dialog | derived · spent | — |
| `LoginResponse.email` | `string` (expected) | **server never sends it** (`BaseLoginEndpoint.cs:74,80`) | `LoginView.vue:156` → `userStore.login(undefined)` → `writeLastUsedEmail` no-ops | derived · spent (dead: always `undefined`) | — |
| `GoogleSignInResponse.email` | `string` | server | `GoogleSignIn.vue:71` → `LoginView.handleGoogleLogin` → `userStore.login(email)` | derived · spent | — |
| `GoogleSignInResponse.currentLocale` | `AvailableLocales` | server | `LoginView.vue:215`: sets `i18n.locale` | derived · spent | — |
| `TwoFactorAuthResponse.twoFactorEnabled` | `boolean` | server (`/auth/register`, `/user/2fa/toggle`, `/user/2fa/reset`) | `RegistrationView.vue:183` branch | derived · spent | — |
| `TwoFactorAuthResponse.qrCode` | `string` | server | `QrCodeFor2FABody` (registration and Security card) | derived · spent | — |
| `TwoFactorAuthResponse.sharedKey` | `string` | server | `QrCodeFor2FABody.vue:12,53` (manual-entry key and copy button) | derived · spent | — |
| `TwoFactorAuthResponse.recoveryCodes` | `string[]` | server (also `/user/2fa/recovery-codes/regenerate`) | `RecoveryCodesBody` via `normalizeRecoveryCodes`; registration path `RegistrationView.vue:185` → `open2FADialogs` | derived · spent | — |
| `GET /user/2fa/status` | `boolean` | server | Security card toggle (`SecuritySection.vue:112`); step-up dialogs decide whether to ask for a code (`MyTwoFactorAuthInput.vue:26-32`) | derived · spent | — |

### Account commands (inline bodies) — `ChangeEmailForm.vue`, `ChangePasswordForm.vue`, `VerifyUserForm.vue`, `ResetPasswordView.vue`, `ConfirmEmailChangeView.vue`
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `newEmail` / `NewEmail` | `string` | Security card → Email change dialog; confirmed via the e-mailed link (`ConfirmEmailChangeView.vue:54`) | becomes `User.email` → shell user menu | spent | — |
| `password` / `currentPassword` / `newPassword` | `string` | Password change dialog, step-up Verify dialog, `/reset-password` | — | write-only | — |
| `twoFactorAuthToken` | `string` | step-up dialogs (`MyTwoFactorAuthInput`) | — | write-only | — |

### Google Calendar link — `src/core/googleCalendar/api/googleCalendarApi.ts` (inline `GoogleCalendarStatus`)
| field | type | captured in | read in | status | time |
| --- | --- | --- | --- | --- | --- |
| `configured` | `boolean` | server (deployment has an OAuth client) | `/user/settings` → `GoogleCalendarCard.vue:21,52,56`; `dayPlanner/component/normal/GoogleCalendarSyncBtn.vue:40` | derived · spent | — |
| `connected` | `boolean` | server (refresh token held) | `GoogleCalendarCard.vue:22,27,53,57,68`; `dayPlanner/component/normal/GoogleCalendarSyncBtn.vue:41,47` | derived · spent | — |
| `syncedCount` | `number` | server (`POST /calendar/{id}/sync-to-google`) | `dayPlanner/component/normal/GoogleCalendarSyncBtn.vue:51-54` → success snackbar | derived · spent | — |
| `connect` body `code` + `state` | `string` | Google OAuth redirect → `/google-calendar/callback` | — | write-only | — |

`getAuthUrl()` → `url` is navigated to (`window.location.href`) and not otherwise read. It is treated as transport.

### Client-side storage
Not DTO fields. They are listed because they are captured data with readers of their own. "Scoped" means routed through
`useUserScopedStorage` (`<name>::u<id>`, `anon` while unhydrated).

| key | storage | scoped | written by | read back by | note |
| --- | --- | --- | --- | --- | --- |
| `user` (Pinia `authStore`: `currentUser`, `isAuthenticated`) | localStorage | no (single slot, reset on logout) | `_common/modules/user/store/authStore.ts:96` | every `currentUser` read above, on reload before `hydrateOnBoot` resolves | outlives the tab until logout |
| `auth.lastUsedEmail` | localStorage | no (deliberately outlives logout) | `authStore.login()` (`:71`), `RegistrationView.vue:182` | `LoginView.vue:134`, `ForgottenPasswordView.vue:76` | not written on a plain password sign-in (see Summary) |
| `theme` | localStorage | no | `App.vue:117`, `_common/nav/AppTopBar.vue:86` | `AppTopBar.vue:77` | device-level by design (`useSessionReset.ts` comment) |
| `ui` (Pinia `uiStore`: `sidebarRail`) | localStorage | no | `_common/store/uiStore.ts` | shell sidebar | `_shell` inventory says sessionStorage, see Contradictions |
| `timeRangePickerMode` | localStorage | no | `_common/component/dateTime/TimeRangePicker.vue:124` | same file `:87` | framework, device-level |
| `templateSectionOrder` | localStorage | yes | `dayPlanner/composable/useTemplateCardDragAndDrop.ts:33` | same file `:16` | |
| `pinnedTemplateIds` (legacy) | localStorage | yes | — (moved server-side, B5) | `dayPlanner/view/TemplateListView.vue:460` migrates it, then removes it (`:466`) | migration-only |
| `runningTimerSession` | localStorage | yes | `activityHistory/store/runningTimerStore.ts:875` | same file `:849`, re-read on `currentUser.id` change | |
| `activityPickerRecency.v1` | localStorage | yes | `activity/composable/useActivityRecency.ts:66` | same file `:51` | |
| `resolvedLeisureRewards` | localStorage | yes | `todoList/store/earnedRewardsStore.ts:63` | same file `:19` | day-keyed via `isoDateInUserZone` |
| ~~`leisure.picker.history`~~ | localStorage | yes | none since F2-04 (2026-10-12) — the history is the server's `LeisureSuggestionRecord` | none | Retired. A value left in a browser is inert. |
| `desktopSettingsHintDismissed` / `androidSettingsHintDismissed` | localStorage | yes | `activityTracking/component/settings/DismissibleMappingHint.vue:40` | same file `:36` | |
| `dayPlanner` (Pinia: `viewedDate`, pending create-dialog state, template preview) | sessionStorage | no | `dayPlanner/store/dayPlannerStore.ts:279` | planner views on reload | per-tab |
| `templateDayPlanner` (Pinia, `omit: ['tasks']`) | sessionStorage | no | `dayPlanner/store/templateDayPlannerStore.ts:80` | template editor on reload | per-tab; the secondary store is `persist: false` |
| `planner-clipboard`, `template-planner-clipboard`, `template-planner-clipboard-secondary` | sessionStorage | no | `dayPlannerStore.ts:233`, `templateDayPlannerStore.ts:54` | same stores on creation (`:224`, `:45`) | cut/paste survives reload |
| `homeUi` (Pinia: `hideDoneTodoList`, `hideDoneRoutine`) | sessionStorage | no | `home/store/homeUiStore.ts:18` | home widgets | per-tab |

Stores that are explicitly `persist: false`: `routineReviewStore`, `earnedRewardsStore`, `activityOptionsStore`,
`dayPlannerSettingsStore`, `runningTimerStore` (which keeps its own scoped key above), and `templateDayPlanner-secondary`.

## Cross-module reads
| field | owned by | read by (module → file) | what for |
| --- | --- | --- | --- |
| `User.timezone` | framework `user` | `dayPlanner` → `DayPlannerView.vue`, `TemplateListView.vue`, `PlannerTasksColumn.vue`, `useTaskReminders.ts`, `useCurrentTimeIndicator.ts`, `OverdueTasksBanner.vue`, `CalendarStatsBar.vue`, `CalendarDayCellContent.vue`; `todoList` → `earnedRewardsStore.ts`, `todayBoundary.ts`, `earnedRewards.ts`, `useRoutineWeeklyReview.ts`, `useDailyRecap.ts`, `RoutineGroupCard.vue`, `ToDoListItemDialog.vue`; `home` → `useDashboardRefresh.ts`; `activityHistory` → `HistorySummaryView.vue`; `leisure` → `useLeisureCommitment.ts`, `MemoryAnchorRequest.ts`; `user` → `useDataExport.ts` | "today" / day boundaries and now-lines in the user's zone, via `useUserClock` |
| `User.firstDayOfWeek` | `core/user` (augmentation) | `dayPlanner` → `PlannerCalendarView.vue:136`; `activityHistory` → `HistoryCalendarView.vue:79`, `HistoryDetailView.vue:258`; `activityTracking` → `useActivityRangePresets.ts:116`; `todoList` → `useRoutineWeeklyReview.ts:14` | week start for calendars, range presets and the weekly routine review |
| `User.askBeforeDelete` | `core/user` (augmentation) | `todoList` → `TodoListsView.vue`, `useUndoableListCrud.ts`, `useTodoListCategories.ts`; `dayPlanner` → `TemplateListView.vue`, `DayPlanner.vue`; `historyDashboard` → `HistoryTimeline.vue`; `activity` → `ActivityCategoryTable.vue` (all via `useDeleteConfirmation`) | whether a non-cascading delete confirms |
| `User.id` | framework `user` | `activity` → `activityOptionsStore.ts:294`; `todoList` → `routineReviewStore.ts:76`, `earnedRewardsStore.ts:126`; `home` → `useTodayPlan.ts:545`; `activityHistory` → `runningTimerStore.ts:883`; plus every `useUserScopedStorage` consumer above | reset/reload on account switch; storage-key scope |
| `User.theme`, `User.locale` | framework `user` | app shell → `App.vue:112,118` | apply theme and UI language |
| `User.email` | framework `user` | app shell → `core/user/authAdapter.ts:21` → framework `UserMenu` | account chip in the top bar |
| `GoogleCalendarStatus.configured` / `.connected` | `googleCalendar` | `dayPlanner` → `component/normal/GoogleCalendarSyncBtn.vue:39-41` (via `googleCalendar/api/`, sanctioned) | show the sync button, or send the user to connect |
| `syncedCount` | `googleCalendar` | `dayPlanner` → `GoogleCalendarSyncBtn.vue:51` | sync success snackbar |
| `User.weatherLocation` (server-side only) | `/user/preferences` (backend) | `leisure` → `view/PickerView.vue` via `GET /leisure-weather-fit` (`WeatherFit.matchingWeatherDependencyIds`) | weather-fit filter on suggestions; the input cannot be set from the client |

### Preference placement check ("Where a preference lives")
| preference | lives in | readers (modules) | verdict |
| --- | --- | --- | --- |
| `theme` | `/user/preferences` | app shell (+ framework `AppTopBar`) | describes the person/device; correct |
| `locale` | `/user/preferences` | app shell; server notification text | correct |
| `timezone` | `/user/preferences` | 7 modules + server | correct |
| `askBeforeDelete` | `/user/preferences` | `todoList`, `dayPlanner`, `historyDashboard`, `activity` | correct (>1 module) |
| `firstDayOfWeek` | `/user/preferences` | `dayPlanner`, `activityHistory`, `activityTracking`, `todoList` | correct (>1 module) |
| `weatherLocation` | `/user/preferences` (server only) | `leisure` only (server-side) | **borderline**: one reader today, so rule 3 would put it in leisure's own settings. But it describes the *person* ("where I am"), and a second module plausibly would read it (the planner calendar already shows a per-day `weather`). Rule 2 can justify where it lives. The real gap is not placement: **no client surface writes it**, and `moduleSettingsLinks.ts` has no leisure entry either |

No preference was found living in a module's own settings while read by more than one module.

## Server sends, client drops
| response DTO | backend type | dropped members | note |
| --- | --- | --- | --- |
| `User` | `AppUserDataResponse : UserDataResponse` (`AdhdTimeOrganizer/application/dto/user/response/AppUserDataResponse.cs`, `framework/…/UserDataResponse.cs`) | `weatherLocation` (copied through untyped by `User.fromJson:41-43`, never read) | The reverse also holds: the client declares `lastLoginAt`, which **no** backend user response has, so it is always `null`. `askBeforeDelete` and `firstDayOfWeek` **are** sent, which settles the `TODO(B3)` in `useUserPreferences.ts:22` |
| `UserSession` | `UserSessionResponse` (`framework/…/UserSessionResponse.cs`) | none | `createdAt` is kept but unread |
| `AccountDeletionSummary` | `AccountDeletionSummaryResponse` | none | server `TrackedTimeSpanDays` is `int?`; client defaults `null` → `0` |
| inline `LoginResponse` | `LoginResponse` (`framework/…/LoginResponse.cs`; `BaseLoginEndpoint.cs:74,80`) | `requiresTwoFactorSetup` | The client also reads `email`, which this type does not have (its own comment says "Inherits EmailResponse"; the record does not). The forced-setup step (`SetupTwoFactorForLoginEndpoint`) has no client caller |
| inline Google sign-in | `GoogleSignInResponse : EmailResponse` | `requiresTwoFactor`, `requiresTwoFactorSetup` | The client always treats a Google sign-in as complete |
| inline `TwoFactorAuthResponse` | `TwoFactorAuthResponse` | none | |
| inline `GoogleCalendarStatus` | `GoogleCalendarStatusResponse(Configured, Connected)` | none | |
| inline sync result | `SyncCalendarToGoogleResponse(SyncedCount)` | none | |

## Opportunities
| id | unit | status | claim | fields involved |
| --- | --- | --- | --- | --- |
| — | — | — | None. Neither `user-settings` nor `auth` has an `O` finding, and `_shell` reports `opportunity 0`. `auth` O1 was superseded by X2 (a blocker, now fixed) and is not an opportunity. | — |

## Contradictions
1. **`auth/inventory.md` (LoginView, "URL & persisted state")** says `userStore.userName` (from a *sessionStorage*-persisted
   store) prefills the e-mail field. In code the prefill is `readLastUsedEmail()`, the localStorage key `auth.lastUsedEmail`
   (`LoginView.vue:134`), and the user store persists to **localStorage** (`authStore.ts:96`).
2. **`auth/usecase.md` "Data this unit captures but does not spend": 2FA recovery codes discarded.** This is now spent:
   `RegistrationView.vue:185` → `open2FADialogs(response.data)` → `RecoveryCodesBody` (B8 fixed). The doc is stale.
3. **`auth/usecase.md` "Data … does not spend": the `redirect` query param is never read.** This is now read by
   `resolvePostLoginTarget` (`_common/modules/user/utils/postLoginRedirect.ts:14`), called from `LoginView.vue:157,217`
   and `LoginVerifyQrCode`. B1 is fixed and the doc is stale.
4. **`user-settings/usecase.md` "Data … does not spend"** says the deletion summary has "nine count fields" and then lists
   15. Code has 15 (`AccountDeletionSummary.ts`). The doc's "spent only by the Danger zone" claim is correct.
5. **`user-settings/usecase.md` "Depends on"** says this page is "where they're read from" for `askBeforeDelete` /
   `firstDayOfWeek`. That understates it. The settings page is only the writer. The reads are in 4 and 4 other modules
   respectively (see Cross-module reads).
6. **`src/core/user/dto/userAugmentation.ts:5-9` (code comment)** says `firstDayOfWeek` is read by
   `useRoutineWeeklyReview.ts` and "does *not* feed the planner calendar", and that `askBeforeDelete` gates "five call sites".
   But `dayPlanner/view/PlannerCalendarView.vue:136` reads `firstDayOfWeek`, as do three more files in `activityHistory` and
   `activityTracking`. `useDeleteConfirmation` has seven call sites, including `activity`'s category delete.
7. **`src/core/user/composable/useUserPreferences.ts:17` (comment) and CLAUDE.md's sanctioned-composables table** name
   `historyDashboard` as an importer of `useUserPreferences`. It imports only `useDeleteConfirmation`
   (`HistoryTimeline.vue:157`). The direct importers are `dayPlanner`, `activityHistory`, `activityTracking`, `todoList` and
   `core/user` itself.
8. **`src/_common/bootstrap/createAppPinia.ts:6` (comment)** says state "persists to sessionStorage unless a store opts out
   with `persist: false`". The plugin is installed with no options, which makes it opt-in with a localStorage default. CLAUDE.md
   and `templateDayPlannerStore.ts:79` both say so.
9. **`_shell/inventory.md` (Sidebar)** says the rail state persists to `sessionStorage` via the app-wide plugin. But
   `uiStore.ts:18` declares `persist: { storage: localStorage }`.
10. **`auth/inventory.md` (ConfirmEmailView)** says Resend posts to `/auth/resend-confirmation-email/:userId`. It now posts
    `{ email }` to `/auth/resend-confirmation-email` (`ResendConfirmationEmail.vue:43`). B5 is fixed and the doc is stale.
11. **`user-settings/inventory.md` "URL & persisted state"** says preference changes persist "not localStorage". The server
    is the authority, but the whole `currentUser`, preferences included, is *also* mirrored to localStorage by the user store.
    `useUserPreferences.ts:22-26` notes that this mirror can mask a server that drops a key.

## Unsettled
None. One point is static-only and worth a live check before anyone acts on it: `LoginResponse.email` is never sent, so
a plain password sign-in should leave `auth.lastUsedEmail` unwritten. That is settled from `BaseLoginEndpoint.cs:74,80`
and `authStore.ts:69-71`, not observed in a browser.
