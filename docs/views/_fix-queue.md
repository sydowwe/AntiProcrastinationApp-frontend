# Fix queue

> Built 2026-09-15 · commit `97f1e414` **plus the working tree** (the unit-4, unit-6 and unit-9 mutation
> rounds and unit 10's round 8 are uncommitted; unit 15's mutation round landed at `04c405e9`) · units
> triaged: `_shell`, `home` (1, inventory + mutation), `todo-lists` (9, inventory + mutation),
> `todo-routine` (10), `leisure-projects` (13), `tracking-settings` (6, inventory + mutation),
> `activity-settings` (2, inventory + mutation), `history-review` (3), `user-settings` (14),
> `history-capture` (4, inventory + mutation), `auth` (15, inventory + mutation), `planner-day` (7),
> `tracking-dashboards` (5), `planner-templates` (8), `leisure-backlog-picker` (11),
> `leisure-bucket-anchors` (12) · findings considered: 177 · batches: 91

> Closed batches, closed verification items, the per-pass narrative and the *Contradictions & re-grades* audit
> trail live in [`_fix-queue-log.md`](_fix-queue-log.md). This file holds only open work.

## Summary

| batch | title | scope | findings closed | effort |
| --- | --- | --- | --- | --- |
| F1 | View-mode toggle loses `view=table` to a URL-write race | app | `leisure-projects/B1` | med |
| F2 | Board mode fires two grid requests through one `AbortController` | app | `leisure-projects/B2` | med |
| F3 | ✅ **FIXED 2026-09-13** — `ActivityInfo` reads `icon`/`color` flat; the API nests them under `activity.category` / `activity.role` | app + framework | `leisure-projects/B3` | low |
| F4 | Table's "Messy" icon column has no text alternative | app | `leisure-projects/A2` | low |
| F5 | Inactive readiness-status buttons are invisible (non-text contrast) | app | `leisure-projects/A3` | low |
| F6 | Dead `class="flex-1-1"` on four `FilterPanel` call sites logs a warning per render | app | `leisure-projects/P1`, **`leisure-backlog-picker/P1`** | low |
| F7 | `RoutineTodoWidget`'s header controls are clipped off-screen | app | `home/B1` | low-med |
| F8 | **Rewritten (round 2):** a sign-in race orphans the day-plan fetch — `useTodayPlan`'s user-id watcher bumps `loadToken` on the `0 → id` hydration, the in-flight response is discarded, nothing re-fetches, and NowBar/DayPlannerWidget stay on "No plan for today" (or spin forever if the fetch failed); the original NowBar loading gap rides along | app | `home/B2` (+ settles `home/U1`) | med |
| F9 | `homeUiStore` never persists, and CLAUDE.md says the opposite of what the plugin does | app + docs | `home/B3` | low |
| F10 | No skip-to-content link | app | `_shell/A3` | low |
| F11 | ✅ **FIXED 2026-09-13** — Breadcrumb does not distinguish `/todo-list/:id` from `/todo-list` | app | `_shell/P1` | low |
| F12 | Mappings table body has zero height — the row exists but is inside a 0 px scroll box (**round 2 re-confirmed**, plus a `focus()` + Enter path that works — consistent with the scroll-box cause, not with a paint bug) | app | `tracking-settings/X1` | low |
| F13 | Mappings tab: no filter control reaches the grid, and the delete button reaches nothing (**grown**: the dead delete is now `X4`, observed on both platforms; the raw-id confirmation `B7` is one `deleteConfirmationColumn` attribute on the same tag) | app | `tracking-settings/B1`, **`X4`**, **`B7`** (+ `U1`, now confirmed) | med |
| F14 | Tabbed routes get the wrong breadcrumb (and sidebar highlight) because the nav `to` is one tab's literal path | app | `tracking-settings/B2`, `activity-settings/B6` | low |
| F15 | Distinct-entries filter, page and sort are not in the URL | app | `tracking-settings/B3` | med |
| F16 | Settings header row clips its labels at 1440 px | app | `tracking-settings/B4` | low |
| F17 | CLAUDE.md's "every settings page" sentence reads wider than `moduleSettingsLinks.ts` means | docs only | `tracking-settings/P1` | trivial |
| F18 | The mount-time combobox rebuild writes back into the activities filter — wiping URL ids and double-firing the grid | app | `activity-settings/B2`, `B3` (+ retests `U4`) | med |
| F19 | Roles/Categories tables: parse `canDelete`/`usageCount`, gate the role delete, cascade-confirm the category delete — and name the trash button before copying it (**grown**: the generic dialog's raw-id copy, `B8`, goes with the generic dialog) | app | `activity-settings/B7`, `A1`, **`B8`** (+ `U2`, now browser-confirmed) | med |
| F20 | No catch-all route — any unknown URL renders a blank main area | app | `activity-settings/B5` | low |
| F21 | Categories table's "Role" column is a comma-joined aggregate presented as a single value | app | `activity-settings/P1` | low |
| F22 | Activities filter bar clips the "Categories" label | app | `activity-settings/P2` | low |
| F23 | Parallel `playwright-cli` sessions must not share one storage-state file — the API rotates refresh tokens (**grown**: nor the unnamed `default` browser session, nor a mid-pass reseed) | docs only | `activity-settings/U3` (+ `todo-routine` round-5 environment note) | trivial |
| F24 | ✅ **FIXED 2026-09-14, verified in SK + no-reload EN switch** (uncommitted) — Routine components format dates through the browser's locale, not the account's — 8 `toLocaleDateString(undefined, …)` calls in 5 files | app | `todo-routine/B10` | low |
| F25 | ✅ **FIXED 2026-09-14, verified** (*Farba* in SK, *Color* in EN; uncommitted) — `/routine-settings` "Color" column header is the capitalized raw key — the title is `''` and the framework fills it in | app | *(unfiled — `todo-routine/B4`'s round-5 verification note)* | trivial |
| F26 | Period-total banner is a `flex: 1 1` (basis `0%`) item — it never has a size to wrap on, so it is squeezed to ~62 px instead of dropping to a new line | app | `history-review/B1` | trivial |
| F27 | History dashboards have no error state: three fetch owners null or **keep** their data on failure and every panel renders "No data for this period" — the pattern is already built in `useActivityDashboard` | app | `history-review/B2` | med |
| F28 | `/activity-history/detail` breadcrumb reads "Home › Summary" — the `F11` mechanism, one more consumer | app | `history-review/B3` | trivial |
| F29 | Stacked-bar columns are bare `div`s: no name, no role, no `tabindex`, no key handler — and on Detail they show a pointer cursor and do nothing | app (`activityTracking/component/stackedBars/`, shared per `migration-revision.md` §7) | `history-review/A1` | low-med |
| F30 | Summary cards are named "View details for X" and toggle a highlight; the history card does not activate from the keyboard (**`activityTracking` half withdrawn** — §80: its cards open a detail panel and already have key handlers) | app | `history-review/P1` | low |
| F31 | Pie legend overlaps the donut — fixed-percentage ECharts layout on a ~300 px canvas; `isNarrow` is a dead prop | app | `history-review/P2` | low-med |
| F32 | `/activity-history/calendar` has no `<h1>`, unlike its two siblings | app | `history-review/P3` | trivial |
| F33 | Google Calendar connect never sends the OAuth `state` the server's validator requires — the client half of `B1`, unobservable only because the server half breaks the flow one step earlier | app | `user-settings/B1` (client half; server half is §9) | low |
| F34 | Google Calendar card's "Disconnect" is `error` on an elevated button — the app-side twin of `P1`, on the very row the unit compared against | app | *(unfiled twin of `user-settings/P1`)* | trivial |
| F35 | `dateTime.secondsShort` renders raw on every running clock — and `general.from`/`general.to` on every `TimeRangePicker` in range mode: the app-side `common` mirror is written per consumer, has leaked four times, and should become the deep-merge `SK.ts` already does for `user` | app (`src/locales/`) + CLAUDE.md | `history-capture/B1` (+ two unfiled twins) | low (decision: merge vs. patch) |
| F36 | Typed durations snap to 5 minutes with no feedback — eight `<TimePicker>` tags in six `activityHistory` files take the framework's time-of-day default; the server's own *Short Sprint* preset (3-minute rest) cannot be re-entered through the client | app | `history-capture/B2` | low |
| F37 | Preset chips define `#close` without `closable`, so Vuetify renders a live, always-present "Close" button that hides the chip client-side — and in edit mode the pencil *is* that button, so clicking it never opens the editor | app | `history-capture/B3` (+ unfiled inventory `A1`) | low |
| F38 | Leftover `console.log` in `TimerPresetsSection.vue` — and two more app-side; `no-console` is configured `off` with an allow-list, which is why lint did not catch any of them | app + `eslint.config.ts` | `history-capture/P1`, **`planner-templates/P2`** | trivial |
| F39 | The auth guard's redirect drops the destination — `router.ts:98` returns `{ name: 'login' }` with no `redirect` query, while the interceptor's own forced-logout path already writes one | app (`src/router.ts`) | `auth/B1` (write half; the read half is `FW11`) | trivial |
| F40 | Logging out fires `GET /routine/settings` and logs a 401 — `resetAppState()` *creates* `routineReviewStore`, the Pinia plugin calls `ensureLoaded()` on creation, and the load has no signed-out guard and no `catch` | app (`src/core/todoList/store/routineReviewStore.ts`) | `auth/P2` | low |
| F41 | `DayPlannerSettingsView`'s tabs stack — `d-flex` on two `VTabsWindowItem`s is `display: flex !important`, which beats the inline `display: none` Vuetify's `v-show` sets on an inactive item | app | `planner-day/B1` | trivial |
| F42 | `/day-planner/settings` active tab is not in the URL — a `?tab=` query, absent for the default, through the module's own `useCalendarUrlState` pattern | app | `planner-day/B6` | trivial |
| F43 | `/day-planner/:date` with a malformed or unprovisioned date: two unguarded calendar fetches (`onMounted`'s `Promise.all`, and `useDayNavigation`'s `viewedDate` watcher) leave a blank header, an unhandled rejection and — on the second — a header for the *previous* day under the new URL | app | `planner-day/B5` (date half; the task half is settled, no defect) | low |
| F44 | Calendar "Days to show" and the Range/Duration configuration do not round-trip in the URL — the app half: extend `useCalendarUrlState` once `FW16` exposes the state | app (**after `FW16`**) | `planner-day/B3` (app half) | med |
| F46 | The pie-chart detail panel's close button was hand-rolled three times and drifted: `mdi-close` in a FontAwesome-only app on the web panel (blank square + console error), no accessible name at all on the desktop panel, and a "Close domain details" label on the unified panel whose items are domains, products *and* apps — one shared key, one identical button | app (`src/core/activityTracking/component/`) | `tracking-dashboards/B1`, `A2` | trivial |
| F47 | Selecting an app on `/activity-tracking/android` opens no detail — the side panel has no branch on `selectedAppLabel`; the card's accessible name promises *"View details for Spotify"*. A local panel from the data on the page (label, package, total time, share of the span, the summary card's baseline stat); a per-app session count is **not on the wire** (§79) | app | `tracking-dashboards/B2` (narrowed) | low |
| F48 | The Android dashboard renders two controls for an Active/Background split its source does not have: the pie's Total/Active/Background radio is a **no-op** (`pieSegments` reads only `totalSeconds`; the DTO has no split), and the timeline's Active/Background legend labels a lane that is always empty | app | *(unfiled — source-certain + `tracking-dashboards.draft.spec.ts:103-105`'s own observation)* | low |
| F49 | Date-preset chips and source-filter chips are focusable `span`s with no role and no state — Vuetify 3.12's `VChip` adds `tabindex`/keydown when clickable and nothing else; the same state-bearing class sits on `todoList`'s two filter groups and `dayPlanner`'s day-of-week and duration chips (15 chip-controls app-wide, 6 of them toggles/selects) | app (`activityTracking`, `todoList`, `dayPlanner`) | `tracking-dashboards/A1` (+ unfiled twins in `TodoListFilters.vue`, `RepeatingTaskDialog.vue`, `BasePlannerTaskDialog.vue`) | low-med |
| F50 | The Compare Templates dialog is empty every time — **two** unkeyed `Promise.all` fan-outs from one api instance (`fetchById` ×2, then `fetchFiltered` ×2), each cancelling its own sibling; the finding's fix closes only the first; folds `B3`'s dead *Confirm* button (`:showConfirmBtn` is not a `MyDialog` prop), same file | app (`TemplateComparisonDialog.vue`) | `planner-templates/X1`, `B3` | low |
| F51 | The template planner's side panel at `<md` is the **open** panel squeezed to 400 × 16 px and pushed off-screen — not a broken "opened" state — and the template planner has **no control that reopens it** once the X is tapped (`panelOpen` is only ever set `false`); the shell is shared with `/day-planner/:date`, whose mobile layout is a different, unchecked shape | app (`PlannerSidePanelShell.vue`, `TemplateDayPlannerView.vue`, `TemplatePlannerHeader.vue`) | `planner-templates/X2` (+ the inventory's misread "collapsed pill") | med |
| F52 | Template card title row: the name never truncates, so the Active/Inactive switch label wraps one letter per line and the day-type chip hard-clips to "Wee" / "Workd" on every card at 1440 px | app (`TemplateCard.vue`) | `planner-templates/B1` | low |
| F53 | The template form mirrors none of the API's contract: `suggestedForDayType` is `required` server-side and `?:` client-side (400 after the dialog has closed, input lost), and `Name` `[Required]`/100, `Description` 500, `Icon` 50 have no rule either — `form.validate()` validates nothing | app (`TaskPlannerDayTemplateRequest.ts`, `TaskPlannerDayTemplateDetailsForm.vue`) | `planner-templates/B2` | low |
| F54 | Template list sort and the split view's two picks are not in the URL — the `F42` shape, two more views in the same module | app (`TemplateListView.vue`, `TemplateSplitView.vue`) | `planner-templates/B4` | low-med |
| F55 | `/day-planner/templates/:templateId` with an unknown id keeps the **previous** template's name in the header — and, because the store persists `templateName` to `sessionStorage`, across a reload too; `loadTemplateDetails` has no `catch` at either of its two call sites (the `F43` shape, template side) | app (`TemplatePlannerPanel.vue`, `templateDayPlannerStore.ts`) | `planner-templates/B5` | low |
| F56 | Seven icon-only controls in `dayPlanner` have no accessible name — card pin, compare checkbox (also pointer-blocked by the card's own icon), the side panel's close X, the split view's back arrow, both planner headers' undo button (named by its badge count when the stack is non-empty), and the day planner's mobile `bars` toggle | app (`src/core/dayPlanner/`) | `planner-templates/A1`, `A2`, `A3` (re-identified), `U3` (settled from source) + three unfiled | low |
| F57 | The Scheduled Days picker is clipped to Mon–Fri in the 400 px template panel — `DayOfWeekPicker` cannot wrap and the panel is the only place it renders without a dialog's width | app (`TaskPlannerDayTemplateDetailsForm.vue`) | `planner-templates/P1` | trivial |
| F58 | The app's EN `$vuetify` block is a 180-line hand copy of Vuetify's own `en` export, byte-identical except for **two missing keys** (`timePicker.notAllowed`, `command.search`) — replace the copy with the import | app (`src/locales/common.en.ts`) | `home/A1` (+ one unfiled key) | trivial |
| F59 | A skipped (`Cancelled`) task renders as done in `DayPlannerWidget` — row class, `aria-pressed` and the checkbox label all key off `isFinished`, which is `Completed ∨ Cancelled` by design; and the checkbox on a cancelled row advances it to `Completed` | app (`DayPlannerWidget.vue`, `useTodayPlan.ts`) | `home/B4` | low |
| F60 | `MemoryAnchorFilter` sends `year`/`month`; the server reads `anchorYear`/`anchorMonth` — the same names the client's own create request already uses; rename the two wire fields, keep the URL keys | app (`MemoryAnchorFilter.ts`, `MemoryAnchorsView.vue`, `leisureFilterUrlState.ts` + its test) | `leisure-bucket-anchors/B1` (the two of five cases the client owns; the other three are §13) | trivial |
| F61 | Ladder and Timeline request 500 rows against a server cap of 200 — every load 400s and a `catch`-free `try/finally` renders the **empty** state; `ProjectsView` fixed the identical constant a month ago with a comment saying why | app (`BucketListView.vue:142`, `MemoryAnchorsView.vue:120`) | `leisure-bucket-anchors/X1`, `X2` | low |
| F62 | `NewMemoryAnchorForm`'s `onMounted` awaits the eligible-activities fetch with no `try/finally`, so any failure leaves the spinner on forever and the "no eligible activities" fallback unreachable — today *every* call fails, because the endpoint does not exist (§12) | app (`NewMemoryAnchorForm.vue:107-112`) | `leisure-bucket-anchors/X3` (frontend half) | trivial |
| F63 | Four leisure request DTOs default their lookup ids to the sentinel `0` — the pickers render a literal "0", `requiredRule` accepts it, and an unset form reaches the server as `activityId: 0` | app (`ActivityBacklogProfileRequest.ts`, `ActivityBucketListProfileRequest.ts`, `MemoryAnchorRequest.ts`, `ActivityProjectProfileRequest.ts` + their forms) | `leisure-backlog-picker/X3` (the `0` half), `leisure-bucket-anchors/B2` (+ one unfiled DTO) | low-med |
| F64 | The picker reads an empty `matchingWeatherDependencyIds` as "nothing fits" and excludes every weather-tagged backlog entry — the server's own contract says empty means "no opinion, exclude nothing"; and the API file's comment still says the endpoint is unimplemented | app (`useLeisurePicker.ts:250`, `leisureWeatherApi.ts`) | `leisure-backlog-picker/X2`, `P2` | low |
| F65 | Leisure's view-mode toggles, the timeline's year controls and the source/experienced chips carry a localized `:title` and no `aria-label` | app (`src/core/leisure/`) | `leisure-bucket-anchors/A1` (app half, re-graded `polish`) | trivial |
| F66 | `boolChip`'s `falseIcon` defaults to `trueIcon`, and four of five call sites pass one icon — a `✗` chip wears a check | app (`useLeisureFilterChips.ts:19` + call sites) | `leisure-bucket-anchors/P1` | trivial |
| F67 | A session that rounds to zero minutes is handled three different ways by the three capture views, and none of them tells the user: Pomodoro offers *"done for ?"* and writes a `{0,0}` row (201), Timer discards silently, Stopwatch does what Pomodoro does under 30 s (unfiled, source-certain) — one policy, applied in one place, before the save dialog | app (`src/core/activityHistory/`) | `history-capture/B4`, `B5` (+ the stopwatch twin) | low-med (decision: discard-with-message vs. save seconds) |
| F68 | The manual-entry form fires one `POST` per click while the first is in flight, and never resets — so a second click is a `409` from the unique index, and so is *every* re-submit of an unchanged form after a success | app (`AddActivityManuallyView.vue`, `AddActivityManuallyForm.vue`) | `history-capture/B6` (was `U1`) | low |
| F69 | Deleting a to-do item never confirms, whatever `askBeforeDelete` says — `useUndoableListCrud.deleteItem` was never one of P3's five sites and bypasses `useDeleteConfirmation`; the routine list shares the composable | app (`src/core/todoList/composable/useUndoableListCrud.ts` + its two views) + CLAUDE.md row | `todo-lists/B7` (+ the unfiled routine twin) | low |
| F70 | *Move to list* has 404'd since the day it was written — the client calls `PATCH /move/{id}/{dest}` against a server route that has been `PATCH /{id}/move` + `{ destinationListId }` since 2026-05-15 | app (`todoListItemApi.ts:104-112`) | `todo-lists/B8` | trivial |
| F71 | The to-do item's done checkbox has no accessible name — nor do the step checkboxes one level down (unfiled); both views, since `BaseTodoListItem` is shared | app (`BaseTodoListItem.vue:19`, `BaseTodoListItemSteps.vue:39`) | `todo-lists/A3` (+ one unfiled) | trivial |
| F72 | `useMappingSettings.saved()` sends three of the form's five facts: *To ignored* never reaches the wire (`isIgnored` stays `null` → 400 on every ignored save), `isActive` is never sent (→ the update DTO's `required` 400 on every edit), nothing validates before the request, and the view's own `catch` overwrites the interceptor's snackbar with a generic string | app (`useMappingSettings.ts`, the two `Tracker*MappingRequest.ts`, the two views' `edit()`, the two action bars) | `tracking-settings/X2`, `X3`, `B6` | med |
| FW1 | `MyDialog` is `persistent` by default, so Escape closes nothing | **framework** | `_shell/A1` | med (decision first) |
| FW2 | **Six** framework icon-only controls have no accessible name (**grown**: `MonthYearPicker`'s prev/next month, `MyDateInput`'s prev/next day) | **framework** | `_shell/A2`, `leisure-projects/A1`, **`planner-day/A1`** (+ two unfiled in `MyDateInput`) | low |
| FW3 | ✅ **CLOSED 2026-09-13** — `Time.fromJson` cannot parse the backend's string shape (the API had already switched to `{hours, minutes}` on 2026-09-11; `fromJson` now accepts both) | **framework** | `todo-lists/B4` | med |
| FW4 | `DataTable`/`BasicTable` need a definite-height flex parent, and nothing says so | **framework** (docs only) | *(none — prevents the next `F12`)* | low |
| FW5 | `DataTable`'s default row actions render the internal slug as their `title`, not the localized label (**grown**: seen again on both `leisure-bucket-anchors` tables — `title="edit"`/`"delete"`, no `aria-label`) | **framework** | `activity-settings/B4`, **`leisure-bucket-anchors/A1`** (framework half) | trivial |
| FW6 | `CalendarGrid`'s day cells are click-only `div`s with no accessible name, role, `tabindex` or key handler — two consumers (history calendar, day-planner calendar) | **framework** | `history-review/A2` | low |
| FW7 | Every password field's visibility toggle is named "{label} appended action" — Vuetify's `InputIcon` fallback, one component (`MyPasswordInput.vue`); and the mismatch message `user.passwordsDontMatch` is a key no locale file defines | **framework** | `user-settings/A1`, **`auth/A1`**, **`auth/B2`** (+ answers the message half of `user-settings/U4`) | low |
| FW8 | Six elevated buttons in the framework's user module use the tonal/outlined colour tokens (`error`/`warning`), and the pairing rule is written only in this app's CLAUDE.md | **framework** | `user-settings/P1` (+ the three on unit 15's signed-out views — pre-empted, and the unit did not re-file them) | trivial |
| FW9 | The forgotten-password flow cannot complete at either step: ~~the request omits the `required` `recaptchaToken` (400 today)~~ **✅ token half landed** (`vue_framework` `6157283`, bump `04c405e9` — `auth/X1` verified fixed in round 3, 204 for a real and a nonexistent address), and the link the server would mail points at `/reset-password`, **a route and view that exist in no repo on this side** — plus a dead 404 branch the server never takes, a hardcoded snackbar and a `TypeError` on network failure | **framework** (new view + route) | ~~`auth/X1`~~ (fixed), `auth/B3` | med |
| FW11 | Post-login redirect, read half: `LoginView`'s two success handlers and `LoginVerifyQrCode` hardcode `router.push('/')`, so the `?redirect=` the interceptor already writes (and `F39` will) is never honoured — with an open-redirect guard; folds `P3`'s `console.log(valid)` and the `'No user!!!'` literal, same file | **framework** | `auth/B1` (read half), `auth/P3` | low |
| FW12 | Both confirm-e-mail views' error states are a lone button with no persistent explanation — the sibling the unit held up as the model has none either (its "body text" is the snackbar — **the unit's round 2 re-drove it and now says the same**); `ConfirmEmailView` also snackbars the literal `Error`, posts to `/resend-confirmation-email/undefined` when the link has no `userId` (**observed in round 2** — it answers 401 and trips `FW21`), and both success buttons are `color="main"`, a token the theme does not define | **framework** | `auth/B4`, `auth/B5` (+ settles `U6`: no defect) | low |
| FW13 | ~~`RegistrationView` fails closed on an empty reCAPTCHA token~~ **✅ guard half landed** (`vue_framework` `6157283`, bump `04c405e9` — `auth/X2` verified fixed in round 3, a real account created through the UI); what is left: its `catch` overwrites the server's `409 "User already exists"` with *"changed by someone else"* (the round-3 duplicate submit **did** answer 409), and `P1`'s legal links (`target="_blank"`), same file | **framework** | ~~`auth/O1`/`X2`~~ (fixed), `auth/P1` | low |
| FW14 | Registration's 2FA recovery codes are received and discarded — `open2FADialog(response.data.qrCode)` passes the QR only and `QrCodeFor2FABody` has no prop to take them; the settings-side enrolment already shows them through `RecoveryCodesBody` | **framework** (`RegistrationView.vue:118-129,149-158`) | `auth/B8` (was `U1`, now browser-observed) | low |
| FW15 | `MyDateInput` binds `v-bind="$attrs"` *before* its own `:label` and bare `hideDetails`, so every caller's `label` (and `hideDetails="false"`) is silently discarded — three call sites pass one, and the History summary's *From*/*To* pair both read "Date" | **framework** | `planner-day/B2` (+ the unfiled *From*/*To* twin `history-review/inventory.md:20` recorded as fact) | trivial |
| FW16 | `CalendarGrid`'s "Days to show" and `DateRangePicker`'s mode + Range/Duration configuration are private `ref`s no consumer can read or set — expose them as optional models (defaulting to today's behaviour) so an app can round-trip them | **framework** (additive API) | `planner-day/B3` (framework half; `F44` is the app half) | med |
| FW17 | `ActionBar` is `position: fixed; left: 50%` — centred on the **viewport** while `.v-main` is inset by the nav drawer, so the bar's left end slides under the drawer and *Delete* is un-clickable at 1280×720; two `dayPlanner.spec.ts` specs have been `fixme`d on it since before the sweep | **framework** | *(unfiled — unit 7's brief item 2, re-confirmed in its inventory `:144`; `e2e/tests/dayPlanner.spec.ts:203-224`)* | low |
| FW18 | `useEntityQuery.fetchById` holds one controller per **method**, so two ids fetched concurrently from one instance cancel each other — the `useFetchFiltered` bug of 2026-09-11 one helper over; give it the same optional `requestKey` (default-preserving), and amend the `prompts/_common/api/A1` trap and the CLAUDE.md `_common/api/` bullet that both say it does not need one | **framework** (additive API + docs) | *(the framework half of `planner-templates/X1`; `F50` is the app half)* | low |
| FW19 | `extractServerMessage` returns the generic top-level `message` ("One or more errors occurred!") before it looks at `errors`, so against this API's validation shape the specific, human-written text is never shown — a colour-format rule and a system-role 409 both read as the generic string | **framework** (`src/_common/axiosConfig.ts:86-101`) | `activity-settings/B9` | low |
| FW20 | `useTableFormatters`' zero-config heuristics match raw substrings — `durationMinutes` contains `ratio` and renders "45.00 %", `inspirationSource` contains `ratio` and renders "—" for every seeded string; the framework's own `JobRunHistory.vue` already slots `durationSeconds` and `errorSummary` around the same trap | **framework** (`src/_common/composable/table/useTableFormatters.ts`) | `leisure-backlog-picker/B1` (+ one unfiled column on `/leisure/bucket-list`) | med (decision: word-boundary match vs. opt-in) |
| FW21 | The interceptor's `AUTH_ENDPOINTS` allowlist names five signed-in auth routes and none of the signed-out ones, so a 401 from `/auth/register`, `/auth/forgotten-password`, `/auth/confirm-email` or `/auth/resend-confirmation-email/*` costs a `/auth/refresh` round trip while no session exists — one wasted request, nothing visible (`logoutClient()` no-ops signed out) | **framework** (`src/_common/axiosConfig.ts:63-65`) | `auth/B7` (re-graded `bug` → `polish`) | trivial |

71 app-side (`F9`, `F17`, `F19`, `F23`, `F35` and `F69` include CLAUDE.md or runbook edits; `F17` and
`F23` are nothing else; `F24`/`F25` are fixed and verified; `F45` is a reserved number, not a batch) · 20
framework (`FW10` is a reserved number, not a batch — see *Needs verification*; `FW14` is now a batch) ·
15 escalations (11 open: §1, §6, §7, §8, §9, §10, §11, §12, §13, §14, §15 — §2 and §3 were settled by
`todo-routine`'s round-4 API read and are struck below). **The fourteenth pass absorbed four mutation
rounds** — units 4, 6 and 9 from the working tree, and unit 15's from `04c405e9`, which the thirteenth pass
had scoped past: fourteen new findings became six app batches (`F67`–`F72`), two framework batches
(`FW14`, `FW21`) and two escalations (§14, §15), and **two framework batches shrank by half without the
queue noticing** — `FW9`'s token and `FW13`'s fail-closed guard both landed in `vue_framework` `6157283`
and were verified in unit 15's round 3. Every one of the seven new `blocker`s was read against source and
the API's: three are the same function (`useMappingSettings.saved()`, `F72`), one is `F13`'s dead delete
seen live (`X4`), one is the fourth observation of §11's colour validator (`todo-lists/X1`), and two are
already fixed. Units 11 and 12 between them added two framework batches and **three escalations** —
the most of any pass since unit 14 — and every one of the three is a client/server contract gap the
browser could only see the edge of: a validator that rejects the palette names the server's own seeder
writes (§11), an endpoint the client was told exists and which no file in the API declares (§12), and
four grid filter contracts of which the server reads eight fields out of twenty-seven (§13). The two
mutation rounds (units 1 and 2) added one app batch each from actually mutating (`F59`, and `B8` folded
into `F19`), rewrote one existing batch from the root (`F8`), and settled three `unverified` rows in a
browser. Unit 4 added no framework batch and no escalation; unit 15 added four framework batches and no
escalation — every one of its defects is in `src/_common/modules/user/` or `src/router.ts`, which is
what a unit made of framework views looks like. Unit 7 added three framework batches and no escalation,
and split one finding across the boundary (`FW16`/`F44`) — a planner view built on `CalendarGrid`,
`DateRangePicker`, `MonthYearPicker`, `MyDateInput` and `ActionBar` is five framework components deep,
and four of its seven findings landed there. Unit 5 added no framework batch — its four dashboards are
built from this module's own components on top of Vuetify and ECharts, and the one Vuetify-default gap
(`F49`) is fixed at the call sites, not in `componentDefaults` (rule 4, see the batch) — and one
escalation that the unit did not file and could not have seen on the seed (§10). Unit 8 added one
framework batch and no escalation: its blocker splits across the boundary the way `FW16`/`F44` did
(`FW18` is the helper, `F50` is the dialog), and its one apparent backend question — whether
*Suggested for day type* should be optional — is settled from the API source as **no**: the column is
non-nullable and indexed, the request field is `required`, and `/suggestions` is built on it (`F53`).

**Order among the fourteenth-pass batches.** `F70` first and alone — one line, and it un-breaks a
feature that has been dead since the day it was written. `F72` before `F13`'s verification: the mappings
table cannot be *edited* into a verifiable state until the update request carries `isActive`, and `F13`'s
delete retest wants a row this pass can create-and-delete rather than a seeded one. **Read `F72` whole
before touching `saved()`** — the finding's "always send `true`" would silently re-activate every inactive
rule on edit, because the server's update is a full PUT replace. `F69` before unit 9's next round and
before the routine list is retested: both views share the composable, so one edit changes two screens.
`F67` needs a **decision** (discard with a message, or save the seconds) before an edit, and the decision
must be made once for three views — do not fix Pomodoro to match Timer and leave Stopwatch; `F68` is
independent of it and one file. `F71` is attributes only and can ride with any `todoList` commit.
`FW14` is six lines that already exist one file over (`SecuritySection.vue:261-281`) and needs a
throwaway registration to verify — reseed after. `FW21` is an allowlist edit; land it with `FW12`, whose
`userId` guard removes the only trigger anyone has observed. `FW9` and `FW13` are **smaller than their
bodies say** — read the ✅ line at the top of each before starting; what remains of `FW13` is the `catch`
and two `target="_blank"`s.

**Order among the unit-11/12 batches.** `F61` first — two constants, and until they change neither
the ladder nor the timeline renders anything, so nothing else on those two views can be verified; it is
also the one batch here that must **not** stop at the constant (see its body — the empty-state-on-failure
half is the part `ProjectsView` did not fix either). `F64` second: it is the picker's default landing
state and closes a `blocker` with one expression. `F63` before either unit's **mutation pass** — that pass
has to submit all four create forms and will otherwise file the literal-"0" defect four more times; it
touches four DTOs and four forms, so run `npm run type-check` and do all four in one commit, not per
finding. `F62` is a one-file edit and is honest about being half a fix: with §12 open, its "failed"
branch is what every user sees on *Add*, so word that branch for a real failure, not for "you have no
eligible activities". `F60` is independent, trivial, and should ship before §13 is written so the ask
does not have to mention two fields the client owns. `F65` and `F66` are independent of everything.
`FW19` and `FW20` are two repos and independent of each other; `FW20` needs a **decision** before an
edit (word-boundary matching keeps zero-config; opt-in changes every app's tables) and its verification
must include the framework's own `JobRunHistory` and every `DataTable` consumer in this app, because
loosening the match can drop a column that was formatting correctly by luck. **Do not add per-table
slots app-side as a workaround for `FW20`** unless the framework declines — the collision class is
"any key containing `ratio`/`rate`/`vat`/`date`/`sum`/`fee`", and `elevated` contains `vat`.

**The three new escalations gate three verifications, and nothing else.** `F63`'s *Verify* step 3
(no request fires on an empty form) holds without them; `F62`'s pass condition needs §12; `F60`'s needs
nothing (the server already reads the renamed fields); and `leisure-backlog-picker/X1`'s *Verify*
block is unrunnable until §13 lands, because the filter it tests has never existed on the wire.

**Order among the unit-1/2 mutation-round batches.** `F8` is rewritten from the root and is now
`med`, not `low-med`: read the whole batch — round 1's fix (a loading branch in `NowBar`) is still in
it but is now the *smaller* half, and applied alone it changes nothing the mutation pass observed,
because the state it hides is permanent, not transient. `F59` is independent of `F8` and touches the
same two files; ship `F8` first so `F59`'s verification is not fighting the race. `F58` is independent
of everything and is the cheapest item in this queue after `F38` — an import replacing a hand copy.
`F19` has grown by one line and no new work: `B8` closes because the generic dialog goes. `FW19` should
land **before** `F19` is verified — its verification reads a 409 snackbar, and today that snackbar is
the generic string on every table in the app.

**Order among the unit-8 batches.** `F50` first and alone — it is the unit's only *observed* blocker
and a one-file change, and **it does not wait on `FW18`**: the second fan-out (`fetchFiltered`) already
has a `requestKey`, and the first (`fetchById`) can be sequenced or given a second instance today
(the workaround `A1`'s Part 2 catalogues); when `FW18` lands, the pointer-bump commit swaps that
workaround for a key, the same shape as `FW11`/`F39`. **Read the whole batch before editing the
dialog** — the finding's suggested fix moves the `CanceledError` from `:120` to `:122` and the dialog
stays empty. `F51` is the other blocker and the only batch here that needs a resize to verify; its fix
lands in the shared shell, so **drive `/day-planner/:date` at 390 px in the same session** — unit 7
never resized, the day view's mobile layout is a different shape (`DayPlannerView.vue:3` has no
`flex-column`), and `X2`'s *Expected* assumes it works. `F56` before `F51`'s verification if both run in
one session: `F51` adds the reopen control that `F56` then has to name — decide the label once. `F52`,
`F53`, `F57` are one-file edits, independent of everything; `F53` before the unit's **mutation pass**,
which will otherwise file the lost-input defect a second time from the create path. `F54` and `F55`
are the `F42` and `F43` shapes on the template side and should ship **after** their siblings, copying
whatever those settle (query codec; not-found treatment) rather than deciding it a second time.
`FW18` is independent, additive, and two repos.

**Order among the unit-5 batches.** `F46` first and alone — it is a two-file, three-attribute change
and it decides the **one locale key** every detail-panel close button will share, which `F47`'s new
Android panel then reuses rather than minting a fourth. `F48` before `F47`, or in the same commit:
both edit `AndroidPieChartSection.vue`, and `F48` changes what the pie section *shows* (no radio) while
`F47` changes what it shows *when something is selected* — landing `F47` first means writing a detail
panel beside a radio that is about to disappear. `F48`'s timeline half is a separate file and a
separate prop and can ship on its own day. `F49` is independent of everything and is the one that
should **not** be scoped to this module: its `todoList` and `dayPlanner` call sites are the same edit,
and a fixing session that names the range-picker chips `radio` and leaves the priority chips and the
repeating-task day toggles as bare `span`s has fixed the symptom the unit saw and not the class. None
of the four needs a seed change; `F46` and
`F48` need the SK locale as well as EN. **Run `U1`'s retest in `F27`'s verification session** — `F27`
copies this module's error pattern, and `U1` is the record that nobody has watched that pattern fail
in a browser yet; `playwright-cli route "**/api/activity-tracking/web-extension/pie-chart" --status=500`
settles both in one reload (*Needs verification*).

**Order among the unit-7 batches.** `F41` and `F42` are one file (`DayPlannerSettingsView.vue`), both
trivial, independent of everything; ship them in one commit if convenient, but `F41` alone is a
one-line hotfix and should not wait on `F42`'s design (query vs. route param). `F43` is independent and
needs no browser beyond three URLs. **`FW16` before `F44`, and `F44` rides in the pointer-bump commit** —
the same shape as `FW11`/`F39`: a codec for state the grid does not expose changes nothing visible.
`FW15` and `FW2` edit the same file (`MyDateInput.vue`) — one `vue_framework` commit may carry both if
its message says so, but they close different findings for different reasons (a label bound in the
wrong order vs. no label at all) and stay two batches. `FW15` **breaks one draft assertion** on purpose
(`history-review.draft.spec.ts:28` pins the defect) — fix the spec in the pointer-bump commit. `FW17` is
independent of everything, CSS only, and is the one that un-`fixme`s two existing specs; run
`dayPlanner.spec.ts` after the pointer bump rather than driving it by hand.

**Order among the unit-15 batches.** `FW9` first and alone — it is the sweep's only open `blocker`, it
adds a route table entry and a view, and until it lands no other auth batch's verification can
include the forgotten-password path. **Read the whole batch before editing `ForgottenPasswordView`**:
the token fix the finding asks for is one line, and applied on its own it moves the failure from a 400
on the first screen to `F20`'s blank page on the second. `FW11` and `F39` are two halves of one
behaviour (`auth/B1`) split by rule 1: `FW11` (framework, the read side) works today with the
interceptor's existing `?redirect=` write and ships first; `F39` (app, one line) rides in the
pointer-bump commit, because a guard that writes `redirect` into a login view that ignores it changes
nothing visible. `FW12` edits the same two lines `FW8` recolours (`ConfirmEmailView.vue:21`,
`ConfirmEmailChangeView.vue:20`) — land `FW8` first or fold it into `FW12`'s commit, never the reverse.
`FW13` **before the unit's mutation pass**: that pass has to submit the registration form, and today it
cannot, locally, for the reason `FW13` removes; it also makes `U1` and `U5` observable, so the retest
that follows `FW13` should run their *What would settle it* rows in the same session. `F40` is
independent of everything and needs no browser beyond a logout with the console open. `FW7`, which now
closes two of this unit's findings too, has not moved — but its verification block gains `/login` and
`/registration` as places to look.

**Order among the unit-4 batches.** `F35` first, and decide its shape before touching a locale file:
if the deep-merge is chosen, the `secondsShort` line is never written and `F4`'s `general.yes`/`general.no`
become real keys for free (§55); if the patch is chosen, `F4` must add its own two lines. `F36` and `F37`
touch different files and are independent; `F37` before the unit's **mutation pass** runs, because that
pass will exercise edit mode and file the pencil-hides-the-chip defect a second time otherwise. `F38` is
independent of everything and is the cheapest item in this queue — but turn the lint rule on *first*,
then fix what it reports, so the count is measured rather than trusted. None of the four needs the
Slovak locale to verify; `F35` needs both.

**`F36` does not change the framework default (rule 4).** The batch sets `allowedMinutesSelected="1"` at
this module's duration fields and stops. Whether `TimePicker`'s default of `'5'` is right for a
component used for both times-of-day and durations, and whether a snap should ever be silent, is a
`vue_framework` decision — raised under *Needs verification* alongside the minute-60 overflow this pass
found in the same function, because that one needs ten seconds in a browser before it is a batch.

**Order among the unit-14 batches.** `F33` is the only one whose *verification* is blocked — the
end-to-end pass needs all three parts of §9 on the server — but its *change* is not: the request body
can be asserted today (see the batch). Do it before §9 lands, or the first real OAuth round trip after
the server fix will fail on the client and get filed as a fourth backend bug. `FW7` and `FW8` touch
the same module and can ship in one `vue_framework` commit if the message says so; `FW7` is the one
that needs a look at every sign-in form in every app, `FW8` is six colour tokens. `F34` is one token,
independent of everything, and must **not** be folded into `FW8` (rule 1 — the same split as `F4`/`FW2`).

**Order among the unit-3 batches.** `F27` first if any of the others is going to be verified in the same
browser session — it is the only one that changes what a *failed* request looks like, and `history-review/U1`
(the empty-state check) is only meaningful once "empty" and "failed" are distinguishable on screen. `F29`
before `F30`: both decide what an interactive chart element is *called*, and the two should agree on a
verb ("Highlight", "Filter to", "Open the day") before either ships. `F26`, `F28`, `F32` are one-line edits,
independent of everything. `F31` is independent but touches the same `HistoryPieChart.vue` a light-theme
fix would (see its *Adjacent*), so do the two together or not at all. `FW6` is a separate repo and needs
an app-side locale mirror in the pointer-bump commit — see the batch.

**`F29` edits unit 5's module.** `StackedBarColumn.vue` lives in `activityTracking/component/stackedBars/`,
which `migration-revision.md` §7 documents as shared presentation owned by a feature module (the two
`activityHistory` views import it across the module boundary, and that is the recorded gap, not a new one).
~~Unit 5 has not run; when it does, its inventory will describe the post-`F29` bars.~~ **Unit 5 has run
(eleventh pass), at `6aac48bb`, before `F29`.** Its inventory lists the stacked bars as a readable
surface (`tracking-dashboards/inventory.md:40`) and its four *Keyboard* sections name the chips, cards,
session bars and close buttons — never the bar columns — so it did not re-file `history-review/A1` from
the tracking side, and `F29`'s `/activity-tracking` verification step stands as the check that the
tracking dashboards' own click semantics survive. The inventory describes the pre-`F29` bars; say so in
the commit so nobody reads that line as a regression.

**`F24` and `F25` are independent of everything, and of each other** — different files, different causes,
both in `src/core/todoList/`. `F24` needs the SK locale to verify; `F25` does not. **Both are now applied
in the working tree** (sixth pass) and sit in *Awaiting retest*; the note about the uncommitted `todoList`
files is moot — they are all uncommitted together now.

**Order among the unit-2 batches.** `F19` before `FW5` is *verified* — once the Roles/Categories tables
have their own `#actions` slot they no longer render `DataTable`'s default buttons, so `FW5` has to be
checked on a table that still does (`/routine-settings`). `F18` first if `U4` is to be retested
meaningfully, since it removes the competing request that is the only candidate explanation. `F20`,
`F21`, `F22`, `F23` are independent of everything.

**Order within the new batches matters.** `F12` first — until the row paints, `F13`'s delete wiring and
`U1` cannot be verified. Then `F13` before `F15` and `F16`: `F13` decides what the top filter bar does on
the Mappings tab (and whether it is even shown there), which changes what `F15` has to sync to the URL and
what `F16` has to lay out. `F14` and `F17` are independent.

**`F4` and `FW2` are the same defect class deliberately split** (batching rule 1): an unnamed icon control in
`src/core/leisure/` and two in `src/_common/`. The framework pair ships as a `vue_framework` commit plus a
pointer bump; the app one does not. Do not let a fixing session merge them.

---

## F1. The view-mode toggle loses `view=table` to a URL-write race

- **Scope:** app-side `src/core/leisure/view/ProjectsView.vue`, `src/core/leisure/composable/leisureFilterUrlState.ts`
- **Closes:** `leisure-projects/B1`
- **Root cause:** Two independent writers of `router.replace({ query })`, each spreading a `route.query`
  snapshot that Vue Router only refreshes once a navigation *resolves*. Confirmed in source this pass:
  `ProjectsView.vue:146` is `watch(viewMode, value => router.replace({ query: { ...route.query, view: value } }))`;
  `useTableUrlState.ts:106-107`'s `syncToUrl()` opens with `const query = { ...route.query }` and is watched on
  `[page, itemsPerPage, sortBy]` (`:138`). Switching to Table mounts `ProjectTable`/`BasicTable` for the first
  time, and `BasicTable.vue:191-202` is an `immediate: true` watcher that **pushes a default sort item into the
  shared `sortBy` ref** when the first column key isn't already there. So one click produces two replaces in the
  same tick, and whichever resolves second overwrites the other's key. `view` is the one that loses, because
  `syncToUrl` writes `page`/`perPage`/`sortBy` and knows nothing about `view`.
- **Why it is intermittent, exactly:** once `sortBy` is already in the URL, `BasicTable`'s watcher finds a match
  and pushes nothing, so there is only one writer and the click works. That is the finding's own evidence
  (case 2), and it is also the fix.
- **Files:** `src/core/leisure/view/ProjectsView.vue:125,146`; `src/core/leisure/composable/leisureFilterUrlState.ts:86-105`
  (`projectFilterUrlState`); reference only — `src/_common/composable/table/useTableUrlState.ts:106-141`,
  `src/_common/component/dataTable/BasicTable.vue:191-202`
- **What to change:** Remove the second writer rather than trying to order the two. `useTableUrlState` already
  accepts `defaultSortBy` (`:15,:81`) and nothing passes it — give `projectFilterUrlState()` a
  `defaultSortBy: [new VSortItem('activity.name', 'asc')]` matching `ProjectTable`'s first column, so
  `BasicTable`'s mount-time watcher finds its key present and pushes nothing. Then make the `view` write
  resilient on its own terms: after the replace resolves, assert `route.query.view === viewMode.value` and
  re-write if not (or read `viewMode` from the route as the single source of truth instead of holding a
  separate `ref`). **Both halves** — the first kills the reproducible case, the second stops any future third
  writer silently reintroducing it.
- **Do not change:** `useTableUrlState.ts` or `BasicTable.vue`. A shared query-merge queue in the framework is
  the "proper" fix and it is a framework batch with its own risk to every table in every app — not a side
  effect of closing one view's finding. Also do not change the other three leisure views in this batch; they
  have the same two-writer shape (`BucketListView`, `MemoryAnchorsView` each hold their own
  `watch(viewMode, …)`) but no finding, and units 11/12 have not run yet.
- **Verification:** `leisure-projects/B1`'s `Verify:` block verbatim — from a **query-string-free** load, one
  click on "Table" must put `view=table` in the URL immediately, and a reload must stay on Table. Re-run it
  twice: once from `/leisure/projects` clean, once from a URL that already carries `sortBy`.
- **Risk:** Low-medium. `defaultSortBy` means every load now carries `sortBy=activity.name:asc` in the query
  once anything syncs — harmless, but it also means the *board* default URL advertises a table sort. More
  importantly, `activity.name` is the exact key that used to 500 this grid (see *Contradictions* §2): if the
  API's sort-key remap were ever rolled back, defaulting to it would break the table on first load rather than
  on first header click. **Measured 2026-09-13: it answers 200**, and the risk has shrunk — the key resolves
  **natively** off the nested `ActivityResponse` now, not through a remap that could be rolled back, so it is
  only as fragile as the row shape itself. Re-confirm before shipping anyway.

## F2. Every board-mode filter change fires two competing grid requests through one `AbortController`

- **Scope:** app-side `src/core/leisure/view/ProjectsView.vue`
- **Closes:** `leisure-projects/B2`
- **Root cause:** `ProjectsView` drives **one** `fetchFilteredTable` instance from **two** places. Confirmed in
  source: `useActivityProjectProfileCrud()` is destructured once (`:103`) and handed to `useServerTable`
  (`:109`) *and* called directly by `loadBoard()` (`:139`). `useServerTable.ts:107-116` watches `filter`
  unconditionally — it cannot know its table is unmounted — so a board-mode filter change fires the table's
  25-row fetch alongside `ProjectsView.vue:147-153`'s own 200-row `loadBoard()`. `useFetchFilteredTable.ts:29-37`
  holds **one** `AbortController` per instance and aborts the previous call on every new one, so the two race.
- **The consequence is worse than a wasted round trip**, and this is the part to fix for, not the count:
  `useFetchFilteredTable.ts:47-55` swallows the cancellation and **resolves the aborted call with `latest`** —
  the *other* call's result. With more than 25 matching projects, a board-mode filter change can therefore
  resolve `boardItems` with the table's 25-row page and silently under-render the board. Not reproducible on
  the current seed (one row), inferred from the code path; the finding says so too.
- **The finding's own suggested fix does not satisfy its own pass condition.** Giving the board a second
  `useActivityProjectProfileCrud()` instance separates the controllers — the correctness bug goes — but leaves
  **two** requests, and `Verify:` step 3 demands exactly one. Pick a shape that gives one fetch:
- **Files:** `src/core/leisure/view/ProjectsView.vue:103-153`; reference only —
  `src/_common/composable/table/useServerTable.ts:107-116`, `src/_common/api/useFetchFilteredTable.ts:29-58`
- **What to change:** Recommended — **collapse the two fetches into one.** Board and table want the same
  filtered rows at different page sizes, so drive the board off `useServerTable`'s own `items` and set
  `itemsPerPage` to `BOARD_PAGE_SIZE` while `viewMode === 'board'` (back to 25 on switching to table). That
  deletes `loadBoard`, `boardItems` and `boardLoading`, leaves one writer of one request, and keeps the page
  size bookmarkable in the URL where it already is. Keep `BOARD_PAGE_SIZE = 200` and the comment at `:113-122`
  explaining why it is 200 and not 500 — that constraint is the server's validator and is still live.
  Acceptable alternative if the single-instance shape turns out to fight the table's paging: a second
  `useFetchFilteredTable` instance for the board **plus** gating `useServerTable`'s load on
  `viewMode === 'table'`, and amend the finding's pass condition to say why two instances were needed.
- **Do not change:** `useServerTable`'s unconditional filter watcher or `useFetchFilteredTable`'s cancellation
  fallback. Both are framework, both are load-bearing for every other table, and the "suppress the fetch when
  the consuming table is unmounted" idea needs a framework-level answer (a `enabled` option), not a patch
  here — see *Escalations* §4 for whether that is worth raising upstream.
- **Verification:** `leisure-projects/B2`'s `Verify:` block — one filter change in board mode, exactly one
  `POST /api/activity-project-profile/grid`, carrying the board's page size. Then switch to Table and confirm
  paging still works and still fires one request per page change. Check `playwright-cli requests` for
  `net::ERR_ABORTED` entries — there should be none.
- **Risk:** Medium. Touching the page-size ref changes what lands in the URL for every user of this view, and
  the board's "fetch everything" assumption only holds under the 200 cap. If a user's project count ever
  exceeds 200 the board silently truncates either way — out of scope here, worth a note in the code.

## F4. The table's "Messy" column renders a bare icon with no text alternative

- **Scope:** app-side `src/core/leisure/component/project/ProjectTable.vue`
- **Closes:** `leisure-projects/A2`
- **Root cause:** `ProjectTable.vue:25-31`'s `#item.isMessy` template renders a bare `VIcon` (`check` /
  `minus`) with a colour and nothing else — confirmed by source read this pass. The cell's whole meaning is
  carried by glyph and colour, so the accessibility tree shows an empty cell and a colour-blind or
  screen-reader user gets nothing.
- **Files:** `src/core/leisure/component/project/ProjectTable.vue:25-31`
- **What to change:** Give the icon a localized `aria-label` reflecting the boolean (`general.yes`/`general.no`,
  or better, the column's own meaning — "Messy" / "Not messy"). Check first whether this app already has a
  convention for boolean icon columns and follow it rather than inventing a second one; if there is none, this
  is the place it gets set, so leave a one-line comment saying so.
- **⚠️ Eighth-pass note: `general.yes` / `general.no` do not exist in this app.** They are two of the 26
  `general.*` keys the framework's `common` defines and the app's wholesale-replacing `general` does not
  (`F35`, *Contradictions* §55). Written as above, this batch would render `general.yes` raw in both
  locales. Either land `F35`'s deep-merge first (then they resolve), or add both keys to
  `src/locales/common.{sk,en}.ts` in this batch — do not assume they are there because the framework has them.
- **Do not change:** the icon/colour choice itself, and do **not** batch this with `FW2` — that is the same
  class of defect in the submodule (rule 1).
- **Verification:** `leisure-projects/A2`'s `Verify:` block — the Messy cell exposes a text alternative in the
  accessibility snapshot. Confirm it is localized (changes with the locale), not hardcoded English.
- **Risk:** None.

## F5. Non-active readiness-status buttons on the board are effectively invisible

- **Scope:** app-side `src/core/leisure/component/project/ProjectReadinessBoard.vue`
- **Closes:** `leisure-projects/A3`
- **Root cause:** `ProjectReadinessBoard.vue:130-146` colours every non-active status button `grey-lighten-2`
  with `variant="tonal"` — and `tonal` at that colour computes to `background-color: rgba(0,0,0,0)`, so there
  is no tint at all and a near-white glyph sits on a white card. Confirmed in source and by the finding's
  computed-style dump. These are the control the board exists to operate (one click moves a project between
  columns), so the two you *aren't* on are the two you can't see.
- **Not a naming gap.** The buttons already carry `:title="$t('enums.readinessStatus.' + s)"` (`:138`), so
  they have accessible names — this is WCAG 1.4.11 non-text contrast only, which is why it is its own batch and
  not part of `F4`.
- **Files:** `src/core/leisure/component/project/ProjectReadinessBoard.vue:133-134` (the `:color`/`:variant`
  pair)
- **What to change:** Pick an inactive treatment with real contrast — a darker neutral from the theme's
  `neutral-*` scale, or `secondaryOutline` with `variant="outlined"` so the glyph gets a border to sit
  against. Whatever is chosen, the active state must still read as clearly the active one; that contrast is
  the control's only state indicator.
- **Do not change:** `STATUS_META`'s active colours (`successDark`/`warningDark`/…) — they are the
  variant-to-colour pairing CLAUDE.md prescribes for `elevated`, and they are correct.
- **Verification:** `leisure-projects/A3`'s `Verify:` block, which is a visual check — take the screenshot,
  don't rely on the accessibility snapshot, which is blind to this by construction. Check in **both** themes:
  `grey-lighten-2` on a dark card is a different failure, and the finding only measured light.
- **Risk:** Low, visual only. The board is the default view mode for this route, so it is the first thing seen.

## F6. A dead `class="flex-1-1"` on four `FilterPanel` call sites logs a Vue warning on every render

- **Scope:** app-side — the four leisure views, **not** `src/_common/component/FilterPanel.vue`
- **Closes:** `leisure-projects/P1`, **`leisure-backlog-picker/P1`** (thirteenth pass — the same
  warning, observed on `/leisure/backlog`; the finding's *"BacklogView is the only leisure view that
  passes a `class`"* is wrong, the grep below still returns four — §93)
- **Root cause:** `FilterPanel.vue`'s template is multi-root (a `<div>` plus a sibling `<Teleport>`,
  `:1-82`), so Vue cannot auto-inherit attributes and logs *"Extraneous non-props attributes (class) were
  passed to component…"* for every call site that passes one. Four do — `ProjectsView.vue:27`,
  `BacklogView.vue:7`, `BucketListView.vue:27`, `MemoryAnchorsView.vue:27` — all passing the same
  `class="flex-1-1"`. It was never doing anything: the panel's own root `<div>` already declares `flex-fill`
  (`FilterPanel.vue:2`). The framework's own `FilterPanel` call sites (the four reminders views) pass no class
  and log nothing.
- **App-side or framework? App-side, deliberately.** The finding's root-cause guess calls this "same shape as
  A1", and that is wrong (see *Contradictions* §5) — a missing label and a broken attr inheritance have nothing
  in common. Making `FilterPanel` single-root would also close it, but that is a submodule commit plus a
  pointer bump to delete four characters of dead markup in this repo, and it changes the DOM shape for every
  app on the framework. Removing the dead class is strictly smaller and strictly safer.
- **Files:** `src/core/leisure/view/ProjectsView.vue:27`, `BacklogView.vue:7`, `BucketListView.vue:27`,
  `MemoryAnchorsView.vue:27`
- **What to change:** Delete the `class="flex-1-1"` attribute from all four. Check the panel still fills its
  row afterwards at desktop and mobile width — `flex-fill` and `flex-1-1` are not identical, and if the layout
  *does* change, that is the signal to fix the framework instead and this batch should stop and say so rather
  than re-adding the class.
- **Do not change:** `src/_common/component/FilterPanel.vue`.
- **Verification:** `leisure-projects/P1`'s `Verify:` block on `/leisure/projects`, then repeat the console
  check on the other three leisure views — the warning is per call site, so a fix verified on one view proves
  nothing about the others.
- **Risk:** Low, but it is a layout attribute on four screens. Look at each one.

## F7. `RoutineTodoWidget`'s header controls are clipped off-screen at a common desktop width

- **Scope:** app-side `src/core/home/component/WidgetCard.vue`
- **Closes:** `home/B1`
- **Re-verified unchanged this pass:** `WidgetCard.vue:150-151` is still `flex-wrap: nowrap` above `md`, and
  `.widget-card` is still `overflow: hidden` (`:130`).
- **Root cause:** `RoutineTodoWidget`'s header holds a title, four period-streak chips
  (Daily/Weekly/Monthly/Yearly), a done/total counter and two action buttons — wider than any other widget's
  header — so at 1440×900 it overflows by ~205px (`scrollWidth: 753` vs `clientWidth: 548`) and the two action
  buttons land 100-140px past the visible edge. They stay in the DOM and the tab order (so `find` and keyboard
  users still reach them) but are invisible and unclickable by mouse.
- **Files:** `src/core/home/component/WidgetCard.vue:142-153`; the chip row itself lives in
  `RoutineTodoWidget`'s template (in scope to reflow, not to move)
- **What to change:** Either let the chip row wrap onto its own line below the title (matching what already
  happens below `md`), or give the chip row its own `overflow-x: auto` scroller that does **not** also capture
  the two action buttons — those must stay anchored and visible regardless of how many time periods an account
  has. Do not fix by widening the card or scaling the chips: the chip count is data-driven and any
  width-tuned fix reproduces at some N.
- **Do not change:** `TodoListWidget`'s header or the shared 64px `min-height` — both are fine at every width
  tested, and the "every `WidgetCard` header lines up" invariant is deliberate (see the comment above the rule).
- **Verification:** `home/B1`'s `Verify:` block — at 1440×900 both the hide/show-done toggle and the
  open-full-view button must have `getBoundingClientRect().right` ≤ the header's own, and both clickable by
  `playwright-cli click` with no forced/JS fallback. Confirm the period chips are not clipped either.
- **Risk:** Low, one component's CSS. Re-check the header still lines up with the other three widgets.

## F8. A sign-in race orphans the day-plan fetch — the home page lands on "No plan for today" (or spins forever) and nothing re-fetches

- **Scope:** app-side `src/core/home/composable/useTodayPlan.ts`, `src/core/home/component/NowBar.vue`
- **Closes:** `home/B2` (round 2). **Settles `home/U1`** — the mutation pass forced a 500 on
  `calendar/day-plan/**` on a plain reload and both widgets rendered `home.loadFailedPlan` with a working
  *Retry*; H6's error UI is correct, and the only way it is unreachable is this race (see the log).
- **Rewritten in the thirteenth pass.** Round 1 saw a transient pair and this batch prescribed a loading
  branch. Round 2 reproduced the pair on **3 of 4 fresh sign-ins**, waited 3 s, and it did not clear —
  it is a permanent state that only a reload fixes, and the reload "fixes" it by winning the same race
  the other way (§95). Round 1's fix is kept below as the smaller half; applied alone it changes nothing
  the mutation pass observed.
- **Root cause (source-verified this pass, `useTodayPlan.ts`):** `fetchPlan()` (`:397-404`) captures
  `token = ++loadToken` and applies its response only `if (token === loadToken)`. `resetTodayPlan()`
  (`:466-478`) does `loadToken++` and sets `loading = true`. `wireLifecycle`'s user-id watcher
  (`:512-521`) calls `resetTodayPlan()` on **every** change of `userStore.currentUser.id` — including the
  `0 → <id>` hydration that happens once `GET /user/data` resolves after a fresh sign-in, which is not a
  user change. On sign-in `user/data` and `day-plan` fire together; when `user/data` wins (140 ms vs
  524 ms in the reproducing run) the watcher bumps the token mid-flight, the day-plan response is
  discarded, and the retry gate `if (hadPlan && id !== 0)` (`:516-519`) is `false` because `hadPlan`
  reads `planDate`, which the discarded response never set. Three visible outcomes: (1) `hasPlan: false`
  on a day with a plan, in both widgets, permanently; (2) NowBar additionally shows `'allDone'` beside
  it, because `focusMode` (`:163-166`) is computed from `tasks` alone and never branches on `loading` —
  round 1's finding; (3) if the discarded fetch *failed*, `load()`'s `finally` has already set
  `loading = false` and the reset flips it back to `true` with nothing left to clear it —
  `DayPlannerWidget` spins forever and never reaches the error branch (round 2's third variant).
- **Files:** `useTodayPlan.ts:512-521` (the watcher), `:466-478` (`resetTodayPlan`), `:163-166`
  (`focusMode`); `NowBar.vue` (destructure list + template `v-if`)
- **What to change:** In the watcher, treat `previousId === 0` as hydration, not a user change: nothing
  belonging to another account can be loaded while the id is `0`, because the reset already ran when it
  *became* `0` — so `if (previousId === 0) return` before the reset (keep `id === previousId` and the
  `→ 0` sign-out path exactly as they are). If a stricter shape is preferred, keep the reset and drop the
  `hadPlan` gate — re-call `ensureLoaded()` unconditionally when `id !== 0` — but then `resetTodayPlan()`
  must stop setting `loading = true` on its own (let `load()` own it, which it already does at `:425`),
  or variant (3) survives. Then round 1's half: add `loading` to `NowBar`'s destructure with a loading
  branch matching `DayPlannerWidget.vue:88-92`, and make `focusMode` consult `hasPlan` before falling
  through to `'allDone'`.
- **Do not change:** `fetchPlan`'s stale-response guard (`:404`) — it is correct and is what makes the
  midnight watcher (`:504-508`) safe; the sign-out path (`id → 0`), which is H2's isolation and was
  re-verified clean this pass against the secondary account; `DayPlannerWidget`'s own loading guard.
- **Verification:** `home/B2`'s **round-2** `Verify:` block — sign out and in up to four times on the
  seeded primary account and read the plan without a reload, then `response-body` on the day-plan
  request to confirm a `hasPlan: true` response was *applied*, not discarded. Then the third variant:
  `playwright-cli route "**/api/calendar/day-plan/**" --status=500` **before** signing in, sign in, and
  confirm the widgets reach the error/Retry state rather than a spinner. Then round 1's block: a
  genuinely plan-less day (the secondary account) reads *"No plan for today"* with no *DONE* beside it,
  and a day with every task done still reads *DONE*.
- **Risk:** Medium. The watcher is the app's only sign-out reset for this module; the `previousId === 0`
  early-return must not swallow the `→ 0` transition (it does not — `previousId` is the old value — but
  write the test as two sign-ins with different accounts in one tab, which is `account-isolation.spec.ts`'s
  shape). `loading` ownership is shared between `load()`, `refresh()` and `resetTodayPlan()`; moving it
  changes three call sites.

## F9. `homeUiStore` never persists, and CLAUDE.md asserts the opposite of what the plugin does

- **Scope:** app-side `src/core/home/store/homeUiStore.ts` + docs-only `CLAUDE.md`
- **Closes:** `home/B3`
- **Re-verified unchanged this pass:** `homeUiStore.ts:9` is still `defineStore('homeUi', () => {` with no
  third argument, and the file contains no `persist` key.
- **Root cause:** `pinia-plugin-persistedstate`'s default export (`createPersistedState()`, called with no
  arguments in `createAppPinia.ts:11`) resolves `persist = auto` through `options.auto ?? false` → **`false`**.
  The plugin is registered **opt-in**: a store persists only if it declares `persist: true` or an options
  object. `homeUiStore` declares neither, so the toggle resets on navigate-away-and-back and
  `sessionstorage-get homeUi` never finds a key. CLAUDE.md's `_common/bootstrap/` section states the opposite
  ("every store persists to sessionStorage unless it declares `persist: false`"), and `homeUiStore` was
  written straight against that wrong claim. Every other store in the app already declares `persist`
  explicitly, several with a comment noting the real behaviour — `homeUiStore` is the one that didn't, not the
  first of a pattern.
- **Files:** `src/core/home/store/homeUiStore.ts:9-14`; `CLAUDE.md`'s "`_common/bootstrap/`" Persistence bullet
- **What to change:** Add `{ persist: { storage: sessionStorage } }` as the third `defineStore` argument,
  matching `dayPlannerStore.ts:281`. In the same batch, correct CLAUDE.md to say the plugin is opt-in.
- **Do not change:** the other six stores — they already declare `persist` correctly.
- **Verification:** `home/B3`'s `Verify:` block — toggle "Hide done", confirm `sessionstorage-get homeUi`
  returns a blob containing `"hideDoneTodoList":false`, and that `/todo-list` and back preserves it.
- **Risk:** None for the store. The CLAUDE.md edit is documentation-only — but it is the second time this
  claim has cost a bug, so make the correction unambiguous rather than hedged.

## F10. No skip-to-content link

- **Scope:** app-side `src/App.vue` — not the framework
- **Closes:** `_shell/A3`
- **Re-verified unchanged this pass:** `src/App.vue` has zero matches for `skip`.
- **Root cause:** No skip link exists; the first Tab stop from a fresh load is the framework's sidebar toggle.
  To be first in the tab order the link must precede `<Navbar>` in DOM order, which is `App.vue` — and
  `<VMain>` (the `<main>` landmark it targets) is already there too, so no submodule change is needed.
- **Files:** `src/App.vue` — insert before `<Navbar>`, target `<VMain>` (give it an `id`)
- **What to change:** A visually-hidden-until-focused anchor as the first child of `<VApp>`. Label from
  `src/locales/common.{sk,en}.ts` — app-wide string, no module owns it.
- **Verification:** `_shell/A3`'s `Verify:` block — first Tab stop is a visible "skip to main content" link,
  activating it moves focus into the main region, and it is invisible when unfocused.
- **Risk:** None.

## F12. The Mappings table body has zero height — the row exists, inside a 0 px scroll box

- **Scope:** app-side `src/core/activityTracking/component/desktop/desktopSettings/DesktopMappingsTable.vue`,
  `src/core/activityTracking/component/android/androidSettings/AndroidMappingsTable.vue`
- **Closes:** `tracking-settings/X1`
- **Root cause — settled from source, and it is not what the finding guessed.** `DataTable.vue:7` renders
  `VDataTableServer` with **`height="0"`** plus `class="flex-fill"`, `fixedHeader` and `fixedFooter`. Vuetify
  turns that `height` into `style="height: 0"` on `.v-table__wrapper` (`VTable.js:53-57`), and the wrapper
  is `flex: 1 1 auto; overflow: auto` inside a `.v-table` that is `display: flex; flex-direction: column`
  (`VTable.css:57-63,108-112`). That is the fill-the-parent-and-scroll trick: the body has **exactly as much
  height as the `.v-table` receives from its own flex parent, and not one pixel of its own.** It works
  everywhere else in the app because every other consumer sits in a definite-height flex chain
  (`RoutineSettingsView.vue:2` is `h-100 d-flex flex-column`; `ActivityTable.vue:42-43` gives `BasicTable`
  `class="flex-1-1" style="min-height: 0"`; `DesktopDistinctEntriesTable.vue:2` — the sibling tab that
  renders fine — has `flex-fill` on its root).
  `DesktopMappingsTable.vue:2` and `AndroidMappingsTable.vue:2` are the two consumers that do not: their root
  is `d-flex flex-column ga-2` with **no `flex-fill`**, so the root's height is its content height,
  `BasicTable.vue:2`'s `h-100` resolves against an auto-height parent (i.e. to `auto`), the `.v-table` gets
  zero slack, and the wrapper stays at `height: 0` — header and row are laid out inside it and clipped.
- **Why the evidence looks the way it does.** The finding read *"not clipped, since the row's own
  `getBoundingClientRect` still returns plausible coordinates"* and concluded paint order. That inference is
  backwards: `getBoundingClientRect` reports layout position and **ignores ancestor clipping**, which is
  precisely why `document.elementFromPoint` at that rect returns the ancestor (`v-card-text`, or the filter's
  `v-col` when the scroll box has been nudged by a focus) — the button is there in layout and absent from
  hit-testing. Playwright's actionability wait failing on *"receives pointer events"* is the same fact.
- **Files:** `DesktopMappingsTable.vue:2,7`; `AndroidMappingsTable.vue:2,7`. Reference only —
  `src/_common/component/dataTable/DataTable.vue:6-7`, `BasicTable.vue:2`, and the working sibling
  `DesktopDistinctEntriesTable.vue:2,9-10`.
- **What to change:** Add `flex-fill` to both roots so they mirror `DesktopDistinctEntriesTable.vue:2`, and
  give the `<BasicTable>` the same `class="flex-1-1" style="min-height: 0"` that `ActivityTable.vue:42-43`
  already uses — the second half is what lets the table shrink below its filter-row sibling instead of
  overflowing the card. Two attributes, two files. **Then check the case the trick exists for:** with 25+
  rows (change the page size or seed more), the body must scroll *inside* the card with a sticky header,
  not push the footer off the card.
- **Do not change:** `DataTable.vue`'s `height="0"` or `BasicTable.vue`'s `h-100`. They are the deliberate
  fill-parent contract that seventeen other tables rely on; making the body self-sizing would silently
  remove sticky headers app-wide. What *is* wrong at the framework level is that the contract is
  **undocumented** — that is `FW4`, and it is a docs commit, not a code change.
- **Round 2 (fourteenth pass) — re-confirmed on a seeded and a freshly created row, and a keyboard path
  works.** The unit found that `el.focus()` on the row's `edit`/`delete` button followed by a real Enter
  activates it (four times, both actions, both platforms) and reads that as *"consistent with a
  stacking/paint bug"*. It is consistent with **this** batch's cause and not with that one: `focus()`
  scrolls the focused element into view *inside its nearest scrollable ancestor* — the 0 px
  `.v-table__wrapper` — and Enter dispatches a click on the focused element without hit-testing, so both
  halves skip exactly the coordinate test that the pointer fails. A paint-order bug would not respond to
  `focus()` at all. Nothing changes in *What to change*; the amendment is recorded so the next reader does
  not reopen the framework hypothesis (§101).
- **Verification:** `tracking-settings/X1`'s `Verify:` block on both routes — the row paints in a screenshot,
  and a **normal, non-forced** click on its `edit` button navigates to the `distinctEntries` tab with the
  form populated. Add: `document.elementFromPoint()` at the button's rect centre resolves to the button.
  Add: `Tab` from the filter row reaches the row's buttons (the unit only tried a programmatic `focus()`).
- **Risk:** None beyond layout. The unit's own remark that the Android `VCardText` lacks the app's `flex-fill`
  class is a red herring — Vuetify's `.v-card-text` is `flex: 1 1 auto` by default (`VCard.css:249-250`), so
  both views' card bodies already fill; the omission is one level lower.

## F13. Mappings tab: no filter control reaches the grid, and the delete button reaches nothing

- **Scope:** app-side `src/core/activityTracking/view/DesktopSettingsView.vue`,
  `src/core/activityTracking/view/AndroidSettingsView.vue`, and the two `*MappingsTable.vue` components
- **Closes:** `tracking-settings/B1`, **`X4`** (fourteenth pass — the dead delete, now **observed** on both
  platforms through `F12`'s keyboard path: Confirm closes the dialog, no request fires, the row stays),
  **`B7`** (the confirmation names the raw id — `"Are you sure you want to delete 21003?"` — because neither
  table passes `deleteConfirmationColumn`; one attribute on the same `<BasicTable>` tag this batch edits,
  the `activity-settings/B8`/`F19` shape). `U1` is confirmed by `X4` and closed (see the log).
- **Root cause — three dead paths, not the two the finding names.** Confirmed in source:
  1. `DesktopSettingsView.vue:32-35` renders `DesktopEntriesFilterBar` unconditionally and its `@filter`
     handler is `distinctEntriesTable?.load()`. On the Mappings tab that ref is `null` (the component is
     `v-if`'d out), so Filter and Enter are silent no-ops. Same at `AndroidSettingsView.vue:32-35`.
  2. `DesktopMappingsTable.vue` holds its own `mappingFilter` (`:59`) and `formData` (`:60`), and nothing
     watches either — `load()` is reached only via `defineExpose` and `BasicTable`'s `@onLoadItems`, which
     fires on page/sort changes. So Is active / Type / Ignored changes never fetch.
  3. **The one the finding missed, and the reason its suggested fix would not pass its own `Verify:`.** Even
     with a watcher, the Activity picker would filter nothing: `formData.activityId` is **never copied** into
     `mappingFilter.activityId` (`load()` at `:62-69` sends `mappingFilter.value` as-is), and the pattern
     fields on `mappingFilter` (inherited from `DesktopDistinctEntriesFilterRequest`) are **never bound** —
     the top bar edits the *view's* `filter` ref, a different object. Repointing `@filter` at
     `mappingsTable.load()` alone would fetch with an empty pattern every time.
     (`roleId`/`categoryId` are commented out of `TrackerDesktopMappingsFilter.ts:17-18`; that is fine —
     `ActivitySelectionForm`'s Role/Category selects cascade the Activity picker's options rather than
     filtering the grid, so they are not dead, just not wire fields.)
- **Files:** `DesktopSettingsView.vue:32-35,48-52`; `AndroidSettingsView.vue:32-35,48-52`;
  `DesktopMappingsTable.vue:1-19,59-79`; `AndroidMappingsTable.vue:1-19,57-77`
- **What to change:** Pick one owner for the pattern filter on the Mappings tab and wire it through.
  Recommended: the view passes its `filter` down to the mappings table as a prop (exactly as it already does
  to `DesktopDistinctEntriesTable` at `:44`), the table builds its request by merging that pattern into
  `mappingFilter` and copying `formData.activityId` into `mappingFilter.activityId`, and `load()` is
  triggered by (a) the view's `@filter` → `distinctEntriesTable?.load() ?? mappingsTable?.load()` and (b)
  a `watch` on the mapping-only fields (`type`, `isActive`, `isIgnored`) and on `formData.activityId`.
  Do **not** deep-watch the whole `mappingFilter` — the pattern text fields would then fire a grid request
  per keystroke, which is exactly why the distinct-entries side uses an explicit Filter button.
  **Same edit, same file, wire the delete:** add `@onDelete` on both `<BasicTable>`s (they declare only
  `edit` today — `DesktopMappingsTable.vue:36`), call `deleteEntity` (already exported by
  `useTrackerDesktopMappingCrud`, `desktopActivityTrackingApi.ts:100,111`) and re-`load()`, the way the
  other eight `@onDelete` consumers do (`RoutineSettingsView.vue:163-179` is the model, including its
  409 handling). Do **not** add a second confirmation through `useDeleteConfirmation` — `BasicTable` has
  already confirmed by the time `onDelete` fires, and Escalation §2 records that this bypass of the app's
  cascade rule is a framework question, not one to paper over per call site. ~~**Expect the dialog to stay
  open after the row is gone**~~ — that framework defect was fixed in `vue_framework` `98b92d0` (log,
  *Closed verification items*), and `X4` confirms it from this side: Confirm closes the dialog on both
  platforms today, with a dead handler behind it. **Same tag, one more attribute:**
  `deleteConfirmationColumn="processName"` on the desktop table and `"appLabel"` on the Android one
  (`BasicTable.vue:208` resolves it through `getNestedValue`, so a dotted path works if a target label is
  wanted instead), so the dialog names the rule and not its id (`B7`). A rule whose only pattern is a
  product name or window title would read blank — pick the column per platform that the seeder and the
  form both always fill, or compose a label in a computed and expose it as a hidden column.
- **Do not change:** `BasicTable`'s `hasDelete = true` default — removing the button instead of wiring it
  would close `U1` by deletion, and the usecase names delete as this view's purpose. Do not fix `B7` in
  `BasicTable` — the raw-id fallback when no column is passed is a per-call-site omission (two tables
  here, two in `F19`), not a framework default worth changing under rule 4.
- **Verification:** `tracking-settings/B1`'s `Verify:` block on both routes — a `POST
  …/tracker-desktop-mapping-by-pattern/grid` (android equivalent) fires with the updated filter and the count
  changes. Add the third path explicitly: pick an Activity in the picker and confirm the request body carries
  its id; type a process name and click Filter on the *Mappings* tab and confirm the body carries the
  pattern. Then `X4`'s `Verify:` block — Confirm fires `DELETE …/tracker-desktop-mapping-by-pattern/{id}`
  → 2xx and the row is gone after the re-fetch — and `B7`'s: the dialog names the pattern. **Create the
  row you delete through the API first** (CLAUDE.md *Mutating specs* rule 1): the seeded mappings are
  what unit 6's inventory describes, and `F72`'s create path is the other thing this session can prove.
- **Risk:** Medium — this is the view's only search and its only delete, and the filter object is shared
  with the create form (`useMappingSettings.ts:33,40`), so a pattern typed to search the Mappings tab is
  also the pattern the next *Save* would write. That is the existing distinct-entries behaviour and is
  arguably the feature; just do not "fix" it in this batch.

## F14. Tabbed routes get the wrong breadcrumb (and sidebar highlight) because the nav `to` is one tab's literal path

- **Scope:** app-side `src/app/nav/navItems.ts`, `src/core/activityTracking/activityTracking.routes.ts` —
  **not** the framework's `useBreadcrumbs.ts` / `navTypes.ts`
- **Closes:** `tracking-settings/B2`, `activity-settings/B6` (borrowed — see the header note)
- **Root cause:** Both units guessed it and both were right: `matchesPath()` (`navTypes.ts:41-44`) is
  `path === to || path.startsWith(to + '/')`, and `findTrail()` (`useBreadcrumbs.ts:16-39`) keeps the
  longest match. The sidebar registers `desktopSettings` as the **literal `distinctEntries` tab path**
  (`navItems.ts:25,28`) and `activitySettings` as `/activity-settings/activities`. So
  `/activity-tracking/desktop/settings/mappings` matches nothing under `settings/` and falls to the longer
  of the two remaining prefixes — `/activity-tracking/desktop`, i.e. *"Desktop tracking"*, a sibling
  screen. `/activity-settings/roles` has no shorter prefix in the tree at all, hence *"Home"* alone. One
  mechanism, two symptoms, two units. **Not filed but source-certain:** `SidebarNavItem.vue:52` uses the
  same `matchesPath`, so on the Mappings tab the sidebar highlights *Desktop tracking* and on `/roles` it
  highlights nothing. Listed under *Needs verification*.
- **Files:** `src/app/nav/navItems.ts:25,28` (and the `activitySettings` entry);
  `src/core/activityTracking/activityTracking.routes.ts:27-31,37-41`
- **What to change:** Point the three nav entries at the **family path** — `/activity-tracking/desktop/settings`,
  `/activity-tracking/android/settings`, `/activity-settings` — and add redirect routes for the two tracking
  parents to `…/distinctEntries` (`/activity-settings` already redirects to `activities`,
  `_routes.md:25`). Prefix matching then resolves every tab value, valid or not, to the right crumb *and* the
  right sidebar item; the sidebar link still lands on the same first tab via the redirect. Optionally append
  the tab as an extra crumb with `useSetBreadcrumbExtra()` (the `F11` mechanism) — not required by either
  finding's `Expected`.
- **Do not change:** the framework matcher. Name-based resolution (the `activity-settings` unit's option 2)
  is a framework batch with its own risk to every app's sidebar and needs a `MenuItem.routeName` design; the
  data fix above closes both findings without it. Also do not register the other tabs as extra nav entries —
  `MenuItem` has no `hidden` flag (`navTypes.ts:10-16`), so they would appear in the sidebar.
- **Verification:** Both `Verify:` blocks — *"Desktop settings"* / *"Android settings"* on the Mappings tabs
  and on a bogus tab value; *"Home › Activity settings"* on `/activity-settings/roles` and `/categories`.
  Add: the sidebar highlights the settings entry, not the dashboard, on every tab.
- **Risk:** Low. The redirect adds two route records to `_routes.md`'s 53 — update the manifest.

## F15. Distinct-entries filter, page and sort are not in the URL

- **Scope:** app-side `src/core/activityTracking/view/DesktopSettingsView.vue`, `AndroidSettingsView.vue`,
  `src/core/activityTracking/composable/useMappingSettings.ts`, the two `*DistinctEntriesTable.vue`
- **Closes:** `tracking-settings/B3`
- **Root cause:** `useMappingSettings.ts:33` holds `filter` as a bare `ref`, and each table holds `page`,
  `itemsPerPage`, `sortBy` as bare refs (`DesktopDistinctEntriesTable.vue:56-59`). CLAUDE.md's *URL State*
  rule names all four. The finding filed only the filter; paging and sort are the same rule and the same
  edit, so they are in scope here rather than a later ticket.
- **Files:** as above; reference — `src/_common/composable/table/useTableUrlState.ts` (the framework's
  page/perPage/sortBy sync; `leisureFilterUrlState.ts` is the app's worked example of a filter on top of it)
- **What to change:** Sync the four through `useTableUrlState` plus a filter serializer, the way
  `core/leisure/composable/leisureFilterUrlState.ts` does. **Two traps, both already paid for once:**
  1. `edit()` (`DesktopSettingsView.vue:89-107`) mutates `filter` *and* calls `router.push(...)` in the same
     tick. A URL-sync watcher will `router.replace` against a stale `route.query` snapshot at the same
     moment — the exact two-writer race that is `F1`. Fold the query into the single `router.push` inside
     `edit()`, or suspend the sync while it runs.
  2. `useTableUrlState` and `BasicTable`'s mount-time `sortBy` push (`BasicTable.vue:192-203`) interact —
     see `F1`'s `defaultSortBy` note. The distinct-entries table uses `DataTable` directly, so it is
     unaffected; the mappings table (`F13`) uses `BasicTable` and is.
  Do the Mappings tab's `mappingFilter` in the same pass **only after `F13`**, when it actually filters.
- **Do not change:** `filter`'s double duty as the create form's pattern (`useMappingSettings.ts:40`). That
  means the in-progress rule pattern lands in the URL; it is bookmarkable state by CLAUDE.md's definition
  and harmless.
- **Verification:** `tracking-settings/B3`'s `Verify:` block, then reload with `page=2`/a sort in the query
  and confirm both survive. Re-run `edit()` from the Mappings tab and confirm the query is intact afterwards.
- **Risk:** Medium — the same class of race as `F1`; test the edit hand-off specifically.

## F16. The settings header row clips its labels at 1440 px

- **Scope:** app-side `DesktopSettingsView.vue:7-36`, `AndroidSettingsView.vue:7-36`
- **Closes:** `tracking-settings/B4`
- **Root cause:** The header `<div class="pa-4 pb-0 w-100 d-flex align-center ga-4">` holds the title, the
  two-button `VBtnToggle` and the whole filter bar with no `flex-wrap`; the bar's own root only stacks below
  `md` (`DesktopEntriesFilterBar.vue:2`, `flex-column flex-md-row`). At 1440 px everything is a row and
  every child shrinks: the screenshot on disk reads *MAPPI*, *P…*, *Co…*, *W…* — confirmed from
  `desktop-settings-mappings--default.png` this pass, no browser needed.
- **Files:** as above
- **What to change:** Let the header wrap (`flex-wrap`) so the filter bar drops to its own line when it does
  not fit, and give the `VBtnToggle` `flex-shrink: 0` so tab labels never truncate. **Run after `F13`** — if
  that batch hides or repoints the bar on the Mappings tab, the row to lay out is different.
- **Do not change:** the filter bar's `flex-md-row` breakpoint — it is right for mobile and is not the
  problem.
- **Verification:** `tracking-settings/B4`'s `Verify:` block at 1440×900 on all four routes; re-check 1920
  still renders single-line, and 390 still stacks.
- **Risk:** None beyond layout.

## F17. CLAUDE.md's "every settings page" sentence reads wider than `moduleSettingsLinks.ts` means

- **Scope:** **docs only** — `CLAUDE.md`, the *Where a preference lives* section's second consequence
- **Closes:** `tracking-settings/P1`
- **Root cause:** The sentence *"Every settings page must be reachable from `/user/settings`"* is read
  literally by every unit agent (unit 10 raised it for `/routine-settings`, unit 6 for these two), while
  `moduleSettingsLinks.ts:10-14` records the actual rule — **preference** pages yes, **entity-management**
  pages no — and lists these exact routes as the excluded example. The two documents agree; only CLAUDE.md
  fails to say so where it is read.
- **What to change:** Qualify the sentence to *"every **preference** settings page"* and cross-reference the
  `moduleSettingsLinks.ts` comment as the owner of the list. One sentence. Nothing in `src/` moves.
- **Do not change:** `moduleSettingsLinks.ts` — adding the tracking routes there is the outcome the file's
  own comment argues against, and no finding asked for it.
- **Verification:** N/A — read-through. The next unit that inherits the "check `/user/settings`" brief
  should stop filing it.
- **Risk:** None.

## F18. The mount-time combobox rebuild writes back into the activities filter

- **Scope:** app-side `src/core/activity/composable/useActivityFilterDrafts.ts` (and the two `VCombobox`
  bindings in `src/core/activity/view/ActivitySettingsView.vue:28-51`)
- **Closes:** `activity-settings/B2`, `activity-settings/B3`. **Retests `U4`** — see *Needs verification*.
- **Root cause — one mechanism, two symptoms, and the unit's guess was right on both.** Confirmed in
  source: `refreshActivityCombos()` (`useActivityFilterDrafts.ts:65-76`) *reassigns* `roleCombobox` and
  `categoryCombobox` from the filter, and the two deep watchers at `:189-209` write the combobox back
  *into* the filter — `roleIds = vals.filter(…).map(v => v.id)`, which is `[]` when the combobox is
  empty. So every programmatic rebuild is also a write, and the rebuild runs in `onMounted` (`:103-107`),
  when `roleOptions` is still `[]` because `activityOptionsStore` is `persist: false` and its fetch has
  not resolved (`activityOptionsStore.ts:320`).
  - **B2:** with `?roleIds=11001`, `hydrateTabFromQuery` sets `[11001]`; the rebuild finds no option to
    match (`buildCombobox` drops unmatched ids, `activitySettingsUrlParams.ts:99-102`), assigns `[]`,
    the watcher writes `roleIds = []`, and the `activitiesFilter` deep watcher (`:167-173`) calls
    `syncUrl()`, which omits an empty list — the param is gone before the first request. When the
    options land, `watch([roleOptions, categoryOptions])` rebuilds from the already-wiped filter.
  - **B3:** on a bare load the constructor default is `roleIds = null` (`ActivityFilter.ts:8`); the
    same write turns it into `[]`. `useLookupTable.ts:41-52` guards its deep filter watch with a JSON
    snapshot **for exactly this case** — its comment names "a combobox watcher re-deriving ids/name from
    the same filter" — but `"roleIds":null` ≠ `"roleIds":[]`, so it fires `loadItems()` a second time,
    aborting the `BasicTable` mount's request. The Roles/Categories tabs have no combobox and fire once,
    which is the finding's own control.
- **Files:** `useActivityFilterDrafts.ts:65-76,103-113,189-209`; `ActivitySettingsView.vue:28-51`;
  reference only — `useLookupTable.ts:34-52`, `activitySettingsUrlParams.ts:93-105`,
  `activityOptionsStore.ts:164-169,320`
- **What to change:** Separate "the user edited the combobox" from "the code rebuilt the combobox" —
  today both go through one deep watcher. Recommended: delete the two combobox watchers and move the
  filter write into `@update:modelValue` handlers on the two `VCombobox`es (a function each,
  `onRoleComboboxInput(vals)` / `onCategoryComboboxInput(vals)`, exported from the composable). A
  component event fires for user input only, so `refreshActivityCombos()` becomes a pure derivation and
  both symptoms go. In the same handlers, **normalise the empty case to `null`** (`ids.length ? ids :
  null`) so clearing every chip returns the filter to its constructor shape and `useLookupTable`'s
  snapshot sees no change. If the watcher shape must stay, a guard flag only works with
  `{ flush: 'sync' }` on both watchers — the default pre-flush runs after a synchronous
  `syncing = false` has already been reset — so say which in the commit.
  **Do not** fix B2 by skipping the rebuild while the options are empty: a user with zero categories
  would then never get their chips built, and it leaves the writer in place for the next caller.
- **Do not change:** `useLookupTable`'s snapshot guard to treat `null` and `[]` as equal — that would
  mask the writer rather than remove it, and the guard's comment would become a second wrong claim about
  what the combobox does. Also leave the `watch(tab)` / `watch(activeTab)` mirrored early-exits alone;
  the composable's header comment explains why they are load-bearing and this batch does not touch
  tab switching.
- **Verification:** `B2`'s `Verify:` block — `?roleIds=11001` survives a fresh `goto` **and** the outgoing
  `POST /api/activity/grid` body carries `"roleIds":[11001]` (the rows will still not filter until
  Escalation §6 lands; check the request, not the table). `B3`'s block — exactly one grid `POST` per
  load, no `ERR_ABORTED`. Add: pick a role from the combobox, remove the chip, and confirm the request
  body reads `"roleIds":null` (not `[]`) and the URL has no `roleIds`. Then re-drive `U4`'s sequence
  (type a name, clear it) three times.
- **Risk:** Low-medium. The watcher graph in this composable has a warning comment for a reason; the
  change is confined to the two combobox edges, but run the tab-switch-with-filters-set case the comment
  describes before and after.

## F19. Roles/Categories tables: parse `canDelete`/`usageCount`, gate the role delete, cascade-confirm the category delete — and name the trash button before copying it

- **Scope:** app-side `src/core/activity/dto/response/Role.ts`, `Category.ts`,
  `src/core/activity/component/activityRole/ActivityRoleTable.vue`,
  `activityCategory/ActivityCategoryTable.vue`, `ActivityTable.vue:121-137`; plus one row in CLAUDE.md's
  *sanctioned cross-module imports* table
- **Closes:** `activity-settings/B7`, `activity-settings/A1`, **`activity-settings/B8`** (thirteenth
  pass — the generic dialog reads *"Are you sure you want to delete 4?"* because neither table passes
  `deleteConfirmationColumn`; this batch replaces that dialog with `useDialog().confirm()`, so the raw
  id goes with it. **If a fixing session keeps `BasicTable`'s built-in dialog for either table**, the
  one-attribute alternative is `deleteConfirmationColumn="name"` — do one or the other, not neither).
  **`U2` is now browser-confirmed** (mutation round 2): Delete → Confirm on the *Planner task* system
  role → `409`, row kept, message hidden behind the generic string — which is `FW19`.
- **Root cause — and two things the finding's suggested fix gets wrong.** `ActivityRoleTable.vue:2-15`
  and `ActivityCategoryTable.vue:2-15` use `BasicTable`'s default actions with `@onDelete`, so every row
  offers an always-enabled delete behind the generic *"Are you sure you want to delete X?"*. The finding
  proposes copying `ActivityTable.vue`'s `:disabled="!item.canDelete"` slot. That would fail twice:
  1. **The DTOs drop the field.** The wire carries `canDelete`/`usageCount` on both grids
     (`GridActivityRoleEndpoint.cs:41-44`, `ActivityCategoryGridResponse.cs:66-67` — and the finding's
     own evidence shows them), but `Role.fromJson` (`Role.ts:20`) and `Category.fromJson`
     (`Category.ts:14`) destructure neither. `item.canDelete` is `undefined`, `!undefined` is `true`, and
     **every** delete button would disable.
  2. **The two tables must not behave the same, because the server does not.** Read at the source:
     - **Roles:** `DeleteActivityRoleEndpoint.cs:42-62` refuses with **409** on both a `systemKey` and
       an in-use role, with a user-readable message — `Activity.RoleId` is `NOT NULL` and the FK is
       `Cascade` (`ActivityConfiguration.cs:34`), so refusing is the only non-destructive answer.
       `canDelete: false` is enforced. Mirror `ActivityTable`'s disabled button + tooltip here.
     - **Categories:** `DeleteActivityCategoryEndpoint.cs` is a bare `BaseDeleteEndpoint`; the FK is
       `SetNull` (`ActivityConfiguration.cs:42`), and `ActivityCategoryResponse.cs:26-31` says so in as
       many words: *"⚠ This one is advisory, not a prediction of a 409 … deleting a used category is not
       destructive — it blanks the classification … the field exists so the settings grid can say
       **what** a delete will reclassify before it happens."* Disabling it would block an operation the
       server deliberately allows. The correct shape is CLAUDE.md's cascade rule: a delete that takes
       other rows' state with it **always confirms and says how many** — `usageCount` activities will
       lose their category. That is `useDeleteConfirmation`'s `cascades: true` branch, which the
       generic `BasicTable` dialog cannot express (Escalation §2 is the same gap seen from
       `/routine-settings`).
- **Why `A1` is in this batch and not its own.** `ActivityTable.vue:122-131`'s trash `VIconBtn` has no
  `title`/`aria-label` (confirmed: Edit at `:99` and Archive at `:110` carry `:title`, the trash does
  not); its `VTooltip` hangs off the wrapping `<span>` because a disabled `VBtn` takes no pointer
  events. This batch tells a fixing session to copy that slot into two more tables — fix the template
  **first**, or the defect ships three times. Use **`:aria-label`**, not `:title`: the wrapper's
  `VTooltip` is already the visual tooltip, and a native `title` on the button would render a second
  one on hover (the finding's suggested `:title` fix would produce that). Same conditional text as the
  tooltip: `item.canDelete ? t('general.delete') : t('activities.archive.deleteBlocked')`.
- **Files:** `Role.ts:4-22`, `Category.ts:3-16` (add `usageCount = 0`, `canDelete = true` to the
  constructor and `fromJson`, defaults chosen so a non-grid read — the nested `role` on an
  `ActivityResponse`, which the API documents as carrying meaningless zeros — stays harmless);
  `ActivityRoleTable.vue` and `ActivityCategoryTable.vue` (custom `#actions` slot, `confirm()` from
  `useDialog` the way `ActivityTable.vue:296-313` does, then `useLookupTable`'s `onDelete`);
  `ActivityTable.vue:122` (the `aria-label`); `CLAUDE.md` — add `activity` to the `useDeleteConfirmation`
  importers row, since the table says "the five delete sites" and this makes a sixth. Locale keys for
  the category cascade copy go in `activity.{sk,en}.ts` (*"N activities will lose this category"*, with
  the count); the role tooltip can reuse `activities.archive.deleteBlocked` or get a role-specific key —
  check the SK reads naturally for a role before reusing.
- **Do not change:** the server. The asymmetry is designed and documented; do not file a "make
  categories 409 too" ask off this batch. Do not route the role delete through
  `useDeleteConfirmation` — `canDelete: true` means nothing references it, which is
  `ActivityTable`'s own reasoning at `:291-295`. Do not keep `@onDelete` on `BasicTable` alongside the
  custom slot; with `showActions` and a slot the default buttons are gone and the emit is dead.
- **Verification:** `B7`'s `Verify:` block on both tabs — the three system roles and every in-use row
  render a disabled Delete with a tooltip. Then the category half, which `B7` does not cover: click
  Delete on *"Errands"* (in use), and the dialog must name the count before Confirm; **cancel it** on the
  seed. To see the 204 + reclassify path end to end, create a throwaway category and activity through
  the API first (the mutating-spec rule). `A1`'s block — `getByRole('button', { name: 'Delete' })`
  resolves on the activities table, and hovering shows **one** tooltip. Then confirm the delete dialog
  on these two tables **closes** after Confirm — they are now on `useDialog().confirm()` and no longer on
  `BasicTable`'s built-in dialog, which is the one suspected of never closing (see *Needs
  verification*).
- **Risk:** Medium. Widening `Role`/`Category` touches every consumer of those DTOs (the option
  store, the forms, the nested `role`/`category` on `Activity`) — the additions are optional-with-default
  so nothing should notice, but run `npm run type-check`. The category cascade copy is a user-facing
  number; get the plural right in SK.

## F20. No catch-all route — any unknown URL renders a blank main area

- **Scope:** app-side `src/router.ts` (the route array's last entry) plus one small view and two locale
  keys in `src/locales/common.{sk,en}.ts` — **not** `activity.routes.ts`
- **Closes:** `activity-settings/B5`
- **Root cause — app-wide, not activity-settings.** `activity.routes.ts:10`'s
  `:tab(activities|roles|categories)` regex is correct and rejects `/activity-settings/nonsense`; what
  is missing is anything to catch the rejection. `src/` contains **no** `pathMatch`, no not-found route
  and no catch-all of any kind (grep across `src/**/*.{ts,vue}` this pass), so `/foo`, `/todo-list/abc`
  and every other unmatched path do exactly what the finding describes — sidebar and top bar render,
  `<RouterView>` renders nothing, and the console warns. Unit 2 is simply the first unit whose route
  has a constrained param, so it is the first to have typed a wrong one.
- **The 23 repeated empty-path warnings** are consistent with the ~two dozen `:to` links in the shell
  (`SidebarNavItem.vue:10,27`, `SidebarNavGroup.vue:35,60`, `UserMenu.vue:26-41`, `AppTopBar.vue:18`)
  each resolving via `useLink` against a current route that has no match; not verified further, and not
  worth it — once the current route *is* matched, the condition that produces them is gone. Confirm by
  console after the fix rather than by root-causing it first.
- **Files:** `src/router.ts` (append `{ path: '/:pathMatch(.*)*', name: 'notFound', component:
  NotFoundView }` **after** every spread — order is what makes it a fallback); the view itself.
  `TodoListView.vue:18-19` and `PlannerTaskLinkView.vue:8-9` are the app's existing not-found
  treatments (a `VEmptyState` with a localized title/text and a way home) — copy that shape.
- **What to change:** One global not-found route rendering a localized empty state with a link to
  `{ name: 'home' }`. Leave it **non-public**: a signed-out visitor on an unknown path should still go to
  `/login`, and the guard's `SIGNED_OUT_ONLY_ROUTES` bounce back to `/` afterwards is fine. Where the
  view lives is a judgement call CLAUDE.md's framework rule answers — a not-found page is generic enough
  that another app would want it as written, so `src/_common/component/` (submodule commit + pointer
  bump) is the "right" home; if the fixing session does not want a two-repo change, `src/core/home/view/
  NotFoundView.vue` with a `migration-revision.md` entry is the sanctioned fallback. The **route
  registration is app-side either way**, which is why this is an app batch.
- **Do not change:** the activity route's regex, or widen it to `:tab(…)?` with a `beforeEnter` — the
  finding's suggested fix. That closes one family and leaves every other unmatched path blank; and a
  *missing* tab already redirects (`activity.routes.ts:5-8`), so the only case it would add is
  "invalid tab → activities", which is arguably wrong (a bad URL should say so, not silently land
  somewhere else). `B5`'s pass condition accepts either; the global page satisfies it.
- **Verification:** `B5`'s `Verify:` block, then `/foo` and `/todo-list/abc` — all three render the
  not-found state, the console logs **no** `[Vue Router warn]`, and the sidebar highlights nothing.
  Signed out, `/foo` still lands on `/login`.
- **Risk:** Low. A catch-all declared *before* a real route would shadow it — it must be last, and
  `_routes.md` gains one record (54, or 56 after `F14`'s two redirects).

## F21. Categories table's "Role" column is a comma-joined aggregate presented as a single value

- **Scope:** app-side `src/core/activity/component/activityCategory/ActivityCategoryTable.vue:59`,
  `src/core/activity/_locales/activity.{sk,en}.ts`
- **Closes:** `activity-settings/P1`
- **Root cause:** By design on the server and merely mislabelled on the client.
  `ActivityCategoryGridResponse.cs:14-36` documents `Role` as *"every distinct role worn by the
  activities in this category, alphabetical and comma-joined"* — a category has no role of its own — and
  the grid sorts the column through a `RoleSortKey` proxy (`:46-47`, mapped from the incoming `role`
  key). The client header is `t('activities.role')`, the same singular label the Activities tab uses
  for a real FK. `Category.ts:10` already types it `role: string | null`; `CategoryRequest.ts` correctly
  has no role field. Severity `polish` stands — nothing is wrong, the header lies.
- **Files:** `ActivityCategoryTable.vue:59`; `activity.sk.ts` / `activity.en.ts` (one new key)
- **What to change:** A header that says what it is — *"Used under"* / *"Roles in use"* — as a new
  locale key; **keep the column key `role`**, because that is the sort key the server remaps. Rendering
  the string as chips (split on `", "`) is optional and cheap; do it only if the row height stays
  single-line at the seed's widest value (*"Health & Fitness, Hobbies & Leisure, Work"*).
- **Do not change:** `Category.ts` or the DTO shape, and do not add a `roleId` to `CategoryRequest` —
  the server has no such column and the unit's inference about the glossary is a doc question, not a
  code one.
- **Verification:** `P1`'s `Verify:` block; sort by the column once in each direction and confirm it
  still orders (the key must not have changed).
- **Risk:** None.

## F22. Activities filter bar clips the "Categories" label

- **Scope:** app-side `src/core/activity/view/ActivitySettingsView.vue:12-67`
- **Closes:** `activity-settings/P2`
- **Root cause:** The filter row `<div class="d-flex ga-2 ml-14 flex-1-1">` holds five controls (two
  text fields, two chip comboboxes, a three-button toggle) with no `flex-wrap` and no `min-width` on any
  of them, so at the captured width every child shrinks evenly and the longest label loses. Same class
  as `F16` (a flex row with shrinkable children in `tracking-settings`) — a different file with a
  different set of children, so a different edit, and kept separate for that reason; if both land in one
  session, use the same treatment.
- **Files:** `ActivitySettingsView.vue:12` (the row) and `:28-51` (the two comboboxes)
- **What to change:** A `min-width` on the two comboboxes (they also grow chips, so they are the ones
  that need room) and `flex-wrap` on the row so the toggle drops to a second line before anything
  truncates. Check 1440 and 1920 — the finding measured 1920 and it clipped there, so 1440 is worse.
- **Do not change:** `VBtnToggle`'s `flex-0-0` — it is already the one child that must not shrink.
- **Verification:** `P2`'s `Verify:` block at 1920 and 1440; a screenshot, since the a11y tree cannot
  see truncation.
- **Risk:** None beyond layout.

## F23. Parallel `playwright-cli` sessions must not share one storage-state file — the API rotates refresh tokens

- **Scope:** **docs only** — `prompts/view-docs/README.md` *Parallelism* paragraph, and CLAUDE.md's
  *Browser verification — Signing in* section
- **Closes:** `activity-settings/U3` (re-graded — see *Contradictions* §19)
- **Root cause:** The runbook says *"If you do parallelise inventory passes, give each agent its own
  session name and have it `state-load` the auth file"*. Under the API that is wrong on its face:
  `JwtService.cs:38` calls `RotateRefreshTokenAsync` on **every** refresh, and
  `RefreshTokenService.cs:35` tolerates a stale concurrent refresh for a **5-second** grace window only.
  Two sessions loaded from one `auth-10001.json` hold one refresh token; the first to hit the ~15-minute
  access-token expiry rotates it, and the second, refreshing minutes later, gets `POST /api/auth/refresh`
  → **401** and a real sign-out — which is precisely the sequence `U3` recorded, on a pass its own
  operator note says ran alongside two other units. The unit's hypothesis (b) is the mechanism; (a),
  plain TTL expiry, cannot produce a 401 on `/refresh` for a token that had just been used successfully.
- **What to change:** Replace the sentence with the rule: **one signed-in state per concurrent
  session.** Either sign each session in separately (each gets its own refresh token) or `state-load`
  the file into **one** session only. Add one line to CLAUDE.md's 401-burst paragraph: *"a 401 on
  `/api/auth/refresh` itself is not the expected burst — it means the refresh token was rotated away,
  usually by a second session sharing the same state file."* Nothing in `src/` changes.
- **Do not change:** the API's rotation or grace window. Rotation is the correct security posture and
  5 s is generous for the SPA's own concurrent-refresh race, which is what it is for.
- **Verification:** Read-through. The next parallel run should not lose a session.
- **Risk:** None.
- **Grown in the fifth pass — two more rules from `todo-routine`'s round-5 environment note, same
  paragraph, same edit.** That round ran alongside at least two other agents (`playwright-cli list` showed
  `trkset` and `activity-settings` sessions) and paid for it three ways, each a different mechanism from
  the refresh-token one above:
  1. **The unnamed `default` browser session is shared by every agent that omits `-s=`.** Round 5 saw
     navigations to `/routine-todo-list` land on `/todo-list/13001`, two dialogs open with no action of its
     own, and two `todo-lists` fixture items (14015, 14013) toggled by clicks that were meant for another
     tab — all genuinely two agents driving one browser. Switching to `-s=todo-routine` stopped it at once.
     The runbook's *"give each agent its own session name"* is conditional on *"if you do parallelise"*, and
     `PROMPT-TEMPLATE.md` never mentions `-s=` at all (grep confirms) — so the unit agent cannot know to.
     **Make it unconditional in the template:** every `playwright-cli` command in a unit pass carries
     `-s=<unit-name>`. CLAUDE.md's *Browser verification* examples should carry it too, since agents copy
     them verbatim.
  2. **`POST /api/test/seed` is a live hazard mid-pass, not a start/end-of-pass operation.** A reseed
     wipes every account; round 5's three `B9` attempts each lost a period it had just created — the third
     time on a plain reload — and its two accidental mutations were reset before it could revert them
     itself. The template's *"reseed at the end"* advice (`PROMPT-TEMPLATE.md:172`) needs the other half:
     **never reseed while another unit may be running**, and a mutation pass that sees a row it created
     vanish should suspect a reseed before suspecting the app.
  3. **The runbook already forbids concurrent mutation passes** (*Parallelism: inventory passes can,
     mutation passes cannot*), and round 5 was a mutating retest running concurrently anyway. That is an
     operator error the runbook cannot prevent, but it can make cheaper to notice: state in the template
     that `state-load`, `-s=`, and "am I the only mutating session" are three separate questions.
  The `-s=` half is the one that changes agent behaviour; the other two are one sentence each.

## F26. The period-total banner is a `flex: 1 1` item — it has no size to wrap on

- **Scope:** app-side `src/core/historyDashboard/component/summaryCards/HistoryPeriodBanner.vue`
- **Closes:** `history-review/B1`
- **Root cause — not the one the finding names, and its suggested fix would not work.** Vuetify's own
  stylesheet sets `.v-alert { display: grid; flex: 1 1; }` (`VAlert.css:1-3`), and the two-value shorthand
  is `flex: 1 1 0%` — a **zero flex-basis**. So inside `HistorySummaryCards.vue:4`'s
  `d-flex ga-4 align-center mb-4 flex-wrap` row the banner's *hypothetical* main size is 0 px: the row's
  wrap test sums title + 170 px + 100 px + three gaps + **0** and finds it fits, so `flex-wrap` never
  fires. The alert then *grows* into whatever is left over, capped by the inline `max-width: fit-content`
  (`HistoryPeriodBanner.vue:10`). In the Summary view's `lg="6"` column (`HistorySummaryView.vue:81-85`,
  ~560 px at 1440 wide) the leftover after *"Top Activities"* and the two selects is about 60 px — which
  is the 62 px the finding measured. Nothing is *shrinking*; the finding's `flex-shrink: 0` would leave
  the basis at 0 and change nothing.
- **Files:** `HistoryPeriodBanner.vue:10` (the inline style) and `:69-73` (the `.myAlert` block)
- **What to change:** Give `.myAlert` `flex: 0 0 auto` (basis `auto` is the whole fix — the item's
  hypothetical size becomes its content width, the row wraps it to its own line when it does not fit, and
  it never grows). Drop the inline `max-width: fit-content`, which was compensating for the grow half of
  the same shorthand. Keep it a flex item; do not `position` it or move it out of the row — the row's
  `flex-wrap` is the behaviour the finding asks for.
- **Do not change:** `HistorySummaryCards.vue:4`'s row. Its `flex-wrap` is correct and the two selects'
  `min-width`/`max-width` are what keep *them* legible. Also not the `VAlert` `density`/`variant` — the
  alert is the right size once it is allowed to be its own size.
- **Verification:** `history-review/B1`'s `Verify:` block at ≥ 1440 px — the banner reads *"Period total:
  19h 7m vs previous: 7h 16m +163.1%"* in full, on one line or on its own line below the selects. Then
  `?range=threeDays` or any range with no baseline (`percentChange === null`), so the *"no baseline"*
  caption branch is exercised at its shorter width; and 1920 wide, where the banner should sit inline.
- **Risk:** None. One element's flex shorthand.

## F27. History dashboards have no error state — three fetch owners null or keep their data on failure, and every panel says "No data for this period"

- **Scope:** app-side — `src/core/activityHistory/composable/useHistoryDashboard.ts`,
  `src/core/historyDashboard/component/HistoryTimeline.vue`,
  `src/core/activityHistory/view/HistoryCalendarView.vue`, and the panel components that render the
  empty state (`HistorySummaryCards.vue`, `HistoryPieChartSection.vue`, `HistoryInsights.vue`) plus the
  two views' `<StackedBarsChart>` bindings
- **Closes:** `history-review/B2`
- **Root cause — confirmed, and wider than filed.** Three different failure behaviours, none of them an
  error state:
  1. **The composable nulls and forgets.** `useHistoryDashboard.ts:135-182` — each of the four fetchers is
     `try { data = await … } catch { data = null } finally { loading = false }`. Its own comment (`:132-134`)
     says the null is deliberate so a stale chart never reads as a true one, and that *"the axios
     interceptor still raises the error snackbar"*. Both true; but `null` is also what an empty response
     *looks like* to every consumer — `HistorySummaryCards.vue:49` (`!data || data.cards.length === 0`),
     `HistoryPieChartSection.vue:14`, and `HistorySummaryView.vue:44-55` / `HistoryDetailView.vue:91-100`
     pass `StackedBarsChart` `:windows`/`:loading` and **no `:error`**, so the chart's own `windows.length
     === 0` branch (`StackedBarsChart.vue:60-69`) renders the no-data copy. A snackbar that disappears
     versus a panel that stays on screen saying *"No data for this period · 09.09.2026"* — the panel wins.
  2. **The timeline keeps the previous day.** `HistoryTimeline.vue:156-164` is `try { historyList = await
     … } finally { loading = false }` — **no `catch`**. A failed `detail/timeline` request leaves the
     *previous* date's records under the new date's `periodLabel` (`:14`), which is precisely the
     stale-reads-as-true case the composable's comment was written to prevent, and the rejection escapes
     the `watch` at `:166-169` as an unhandled one.
  3. **The calendar view renders a blank grid.** `HistoryCalendarView.vue:54-69` is the same
     `try/finally` with no `catch`. On a failed month change `days` keeps the previous month's rows;
     `CalendarGrid.calendarWeeks` (`:209-266`) looks each week up by date, finds nothing in the new range,
     pushes no weeks — and `allDaysEmpty` (`:52`) is `false` because the *old* rows have data, so the
     empty state does not render either. Blank card, no message, unhandled rejection from the
     `dateRangeChange` emit's watcher.
  Cases 2 and 3 are **source-certain and unobserved** — the unit mocked only `detail/pie-chart`. They are
  in this batch because they are the same concern in the same view family with the same fix, not because
  a browser has seen them; the verification step below is what makes them observed.
- **The pattern is already written, one module over — copy it, do not design a new one.**
  `useActivityDashboard.ts:306-316` holds one `ref(false)` error flag per panel; each fetcher resets it,
  sets it in `catch` (skipping `axios.isCancel`, `:109-110`), and requests carry `_silent: true` so the
  interceptor's snackbar is suppressed and the failure surfaces **only** as the panel's retry state
  (`:306-307`); the empty-state test at `:483-496` is guarded on `!…Error` for every panel. The four
  tracking dashboards then bind `:error`/`@retry` on every panel (`ActivityDashboard.vue:21-87`), and
  `StackedBarsChart.vue:41-57` **already renders that state** — icon, `activityTracking.common.loadFailed`,
  a Retry button emitting `retry`. `useHistoryDashboard`'s docstring (`:80-82`) says it was *"shaped after
  `activityTracking`'s `useActivityDashboard`"*; the error half is the part that was not carried over.
- **Files:** `useHistoryDashboard.ts:101-105` (add the four flags beside the loading ones), `:135-182`
  (set/reset), `:207-211` (exclude errored panels from `isEmpty` — a failed round must not trigger the
  first-run check, and must never resolve `hasAnyHistoryEver` to `false`), `:251-277` (export);
  `historyDashboardApi.ts:28-103` (`_silent: true` on the seven dashboard reads — **not** on
  `getHasAnyHistoryEver`, which has its own `catch`); `HistorySummaryCards.vue:47-53` and
  `HistoryPieChartSection.vue:14-20` (an `error?: boolean` prop and a `retry` emit, rendering the same
  shape as `ActivityPieChartSection.vue:24` — `HistoryEmptyState` can take an `error` variant, or a
  sibling `HistoryErrorState`, whichever keeps the H7 `periodLabel` off the error copy); `HistoryTimeline.vue:156-164`
  and `HistoryCalendarView.vue:54-69` (add the `catch`, an `error` ref, and the state); the two views'
  `<StackedBarsChart>` (`:error="stackedBarsError" @retry="fetchStackedBars"`) and `HistoryInsights`
  (which reads `pieChartData`/`timeOfDayData` and should hide, not say "no data", when either errored).
- **What to change:** Exactly the tracking shape, in the history composable and the two view-local
  fetchers. **Two decisions to make once, not per panel:** (a) `_silent` — adopt it, so a failed round
  is one retry state per panel and not four snackbars plus four panels; (b) the Calendar view's error
  state has to render *outside* `CalendarGrid` (the grid has no error slot and is framework) — the
  `HistoryEmptyState` slot above it at `:8-13` is the place, with `days` cleared to `[]` on failure so the
  grid is honestly empty rather than blank-with-stale-rows. Retry for the calendar re-fires
  `fetchCalendarActivity` with the last range — hold the range in a ref; `CalendarGrid` only emits it
  on change.
- **Do not change:** `StackedBarsChart.vue` — it already has the state. `HistoryEmptyState`'s existing
  callers' copy (`activityTracking.common.noDataForPeriod`) — cross-module locale reuse that the H5
  comment records as deliberate; the *error* copy can reuse `activityTracking.common.loadFailed`/`retry`
  the same way or get `historyDashboard.*` keys, but do not fork the no-data string. `checkFirstRunIfEmpty`'s
  own `catch` (`:217-225`) — it is already right.
- **Verification:** `history-review/B2`'s `Verify:` block (`playwright-cli route
  "**/api/activity-history/dashboard/detail/pie-chart" --status=500`, reload `/activity-history/detail`) —
  the pie panel shows a state visibly distinct from *"No data for this period"*, with a working Retry
  (`unroute`, click, the panel populates). Then the two cases the unit did not mock: route
  `**/dashboard/detail/timeline` → 500 and **change the date** — the timeline must not show the previous
  day's records; route `**/dashboard/calendar` → 500 and **change the month** — the calendar must show an
  error state, not a blank grid, and `playwright-cli console error` must carry **no** unhandled
  rejection. Then the summary: route `**/dashboard/summary/*` → 500 on a fresh load and confirm the
  first-run block does **not** appear (the `isEmpty` guard). Finally, with nothing routed, the seed's
  empty day (`date=2026-09-07`) must still read *"No data for this period"* — the fix must not turn empty
  into error.
- **Risk:** Medium — it touches every panel on three views and changes what a failure looks like for all
  of them. `_silent` removes a snackbar users may be used to; that is the tracking dashboards' existing
  behaviour and the consistent choice. The `isEmpty` guard is the subtle part: get it wrong in the other
  direction and a genuinely-new user with one failed panel never sees the onboarding block.

## F28. `/activity-history/detail` breadcrumb reads "Home › Summary" — the `F11` mechanism, one more consumer

- **Scope:** app-side `src/core/activityHistory/view/HistoryDetailView.vue` — not the framework
- **Closes:** `history-review/B3` (re-graded to `polish` — *Contradictions* §29)
- **Root cause:** Confirmed, and the finding's own reading is exact. `navItems.ts:12-17` registers the
  History group with two children, `to: '/activity-history'` (Summary) and `/activity-history/calendar`;
  `findTrail()` (`useBreadcrumbs.ts:16-39`) keeps the longest `matchesPath` hit and
  `'/activity-history/detail'.startsWith('/activity-history' + '/')` is true, so Detail inherits Summary's
  crumb. Same class as `_shell/P1` (`/todo-list/:id` inheriting `/todo-list`), same fix — `F11` —
  which is now the fourth consumer of `useSetBreadcrumbExtra()` in this tree (`TodoListView.vue:224`
  and three framework detail views). Not `F14`'s class: that was a nav `to` naming one *tab* of a family;
  this route is a drill-down with no nav entry at all, by design (`_routes.md`, orphan table, resolved by
  unit 3).
- **Files:** `HistoryDetailView.vue` (script setup — one `useSetBreadcrumbExtra()` call, one `watch`)
- **What to change:** `setBreadcrumbExtra([{ title: t('history.detail.title') }])` on setup — the key
  already exists (`activityHistory.en.ts:28`, *"History Detail"*). Optionally append the viewed date; if
  so, format it through `localeTag(locale.value)` (`src/i18n.ts:35`, the `F24` rule) — **not**
  `formatToDate` from `DateTimeHelper.ts`, which is hardcoded `sk` (*Contradictions* §22) and is already
  what `periodLabel` uses on this view (in scope to leave, out of scope to copy). Watch `date` so the
  segment follows the picker. The `onBeforeUnmount` cleanup is the composable's; nothing to add.
- **Do not change:** `navItems.ts` — registering `/activity-history/detail` would put a landing-page
  entry in the sidebar for a page that is never a landing destination. Not `useBreadcrumbs.ts` (`F11`'s
  *Do not change*, same reason). Not the sidebar highlight: `SidebarNavItem.vue:52` will keep lighting
  *Summary* on Detail through the same `matchesPath`, and for a drill-down that is the right answer.
- **Verification:** `history-review/B3`'s `Verify:` block — `/activity-history/detail?date=2026-09-09`
  reads *"Home › Summary › History Detail"* (or with the date); `/activity-history` itself still reads
  *"Home › Summary"*; navigate Detail → Calendar via the icon button and confirm the extra crumb is gone.
- **Risk:** None. `extraSegmentSlots` is module-level state; the unmount hook clears it — `F11` proved
  that on the same mechanism.

## F29. Stacked-bar columns are bare `div`s — no name, no role, no `tabindex`, no key handler; and on Detail they show a pointer and do nothing

- **Scope:** app-side `src/core/activityTracking/component/stackedBars/StackedBarColumn.vue`,
  `StackedBarsGrid.vue`, `StackedBarsChart.vue` — **unit 5's module**, shared with `activityHistory` per
  `migration-revision.md` §7 (see the note under the summary table)
- **Closes:** `history-review/A1`
- **Root cause:** Confirmed. `StackedBarColumn.vue:2-8` is `<div class="bar-column" … @click>` with two
  coloured child `div`s and nothing else; `.bar-column { cursor: pointer }` (`:77-81`). No `role`, no
  `tabindex`, no `aria-label`, no `title`, no `@keydown`. The hover tooltip (`StackedBarsGrid.vue:89-90`
  → `StackedBarsTooltip`) is the only place the bar's name and duration are ever spelled out, and it is
  mouse-only. So the finding's *"Tab to or inspect"* repro is half impossible — Tab cannot reach a
  `div` — and the gap is wider than naming: the Summary view's primary drill-down is unreachable without a
  mouse.
- **The two consumers disagree about what a bar *is*, and the fix has to know.** `HistorySummaryView.vue:54`
  binds `@activityClick="handleActivityClick"` (drill into Detail); `HistoryDetailView.vue:91-100` binds
  **no** click handler at all, and the four tracking dashboards have their own semantics. A blanket
  `role="button"` would name a control on Detail that does nothing — the same affordance lie `F30` is
  about, from the other side. Today Detail's bars already lie a little (`cursor: pointer`, no action);
  fix that here rather than leave it.
- **Files:** `StackedBarColumn.vue:2-8` (the element), `:30-43` (props/emits), `:76-81` (cursor);
  `StackedBarsGrid.vue:78-93` (the mount — it has `formatWindowLabel(window)` at `:112` and is the only
  layer that knows the window's time range); `StackedBarsChart.vue:99-121` (an `interactive?: boolean`
  prop, or derive it — the component cannot see whether the parent bound `@activityClick`, so a prop it
  is); the two history views and four tracking dashboards (pass it where a handler is bound).
- **What to change:** On `StackedBarColumn`: an `:aria-label` built from the domain name (the `_other`
  bucket via `activityTracking.common.other`), the duration (`fromSeconds(data.activeSeconds)` — the
  tooltip's own wording, `StackedBarsTooltip.vue`), and the window label the grid passes down;
  `role="button"`, `tabindex="0"` and `@keydown.enter.space.prevent` **only when `interactive`**, else
  `role="img"` (a named graphic, not a control) and `cursor: default`. Localize the label pattern —
  one key in `activityTracking.{sk,en}.ts`, since the component is that module's. Keyboard focus needs
  a visible ring (`:focus-visible` outline on `.bar-column`); the grid is a positioned CSS grid, so check
  the ring is not clipped by a neighbouring column's `z-index: 5`.
- **Do not change:** `StackedBarsGrid`'s tooltip or hit-testing — the mouse path works and unit 3 drilled
  through it. Do not move the component into `historyDashboard` or `_common` in this batch;
  `migration-revision.md` §7 already records that decision and its reasons. Do not touch
  `StackedBarsGrid.vue:460`'s `toLocaleString('en', …)` (`F24`'s *Do not change* named it — unit 5's).
- **Verification:** `history-review/A1`'s `Verify:` block on `/activity-history` — a bar exposes a
  localized name in the snapshot (`getByRole('button', { name: /…/ })` resolves), **Tab reaches it**,
  Enter drills into Detail with the same `date`/`groupBy` as a click. Then `/activity-history/detail`:
  the bars are `img`, not `button`, and the cursor is no longer a pointer. Then one tracking dashboard
  (`/activity-tracking`) to confirm its own click semantics are intact and its bars are named. SK as
  well as EN for the label.
- **Risk:** Low-medium. Six dashboards render this component; the change is additive markup plus a
  prop with a `false` default, so an unmodified consumer gets named, non-interactive bars — which is
  the honest state for a chart nobody bound a handler on. The bar count is data-driven (25–42 on the
  seed), so check the snapshot stays readable rather than becoming 42 long labels.

## F30. Summary cards are named "View details for X" and toggle a highlight — and the same cloned label sits on `activityTracking`'s domain card

- **Scope:** app-side `src/core/historyDashboard/_locales/historyDashboard.{sk,en}.ts`; adjacent —
  `historyDashboard/component/summaryCards/HistorySummaryCard.vue`. ~~`activityTracking.{sk,en}.ts`,
  `ActivityDomainCard.vue`~~ — **withdrawn, eleventh pass (§80).**
- **Closes:** `history-review/P1`. ~~**Also closes, unfiled:** the identical mismatch on
  `ActivityDomainCard.vue:7-9` — `activityTracking.statColumn.viewDetails` (*"View details for
  {domain}"*), whose click is `emit('click', domain)` → `domainClick` → `selectedDomain`
  (`ActivitySummaryCards.vue:72-73,135-136`): the same select-toggle.~~ **Wrong, and unit 5 is the
  witness.** On the tracking dashboards `selectedItem` is *also* the pie section's model, and three of
  the four pie sections answer it with a detail panel: web switches `ActivityDetailsPanel` to `domain`
  mode (`ActivityPieChartSection.vue:59-66,161`), unified renders `selectedDetails`
  (`UnifiedPieChartSection.vue:66-116`), desktop fetches `process-details`
  (`DesktopPieChartSection.vue:169-188`) — all three observed by unit 5
  (`tracking-dashboards/inventory.md:29,147,153`). *"View details for X"* is the truth there. The one
  dashboard where it is a lie is Android, and that is `tracking-dashboards/B2` → **`F47`**, which makes
  the label true instead of renaming it. The history card was built from the tracking one
  (`HistorySummaryCards.vue:116`'s own comment: *"Reused from activityTracking"*), and the label came
  with it — but the *behaviour* did not, which is the whole defect: the label is only wrong on the copy.
- **Root cause:** Confirmed. `HistorySummaryCard.vue:8` binds
  `:aria-label="$t('historyDashboard.summaryCards.viewDetails', { name })"` on a card whose only effect
  is `emit('click', historyGroupKey(card))` → `handleGroupSelect` → `selectedGroup` toggles
  (`useHistoryDashboard.ts:242-244`) and the pie chart highlights the slice. The label describes an
  action that does not exist. Severity `polish` stands.
- **Adjacent, source-certain, unobserved — fix while in the file:** ~~both cards are~~ **the history
  card is** `role="button" tabindex="0"` with `@click` and **no key handler**, and `VCard` adds none
  (`VCard.js` has no `keydown`/`onKeydown`; it renders a `div` with `onClick` and `tabindex`). So it is
  focusable, announced as a button, and inert on Enter/Space. Add `@keydown.enter.space.prevent` to the
  same emit. **The tracking card already has both** — `ActivityDomainCard.vue:10-11`
  (`@keydown.enter` / `@keydown.space.prevent`), since `5165e2ed` (2026-08-20), before this batch was
  written; the sixth pass read `VCard.js` and not the card (§80). Copy those two lines rather than
  designing new ones. Not filed by the unit (it clicked); flagged here because `F29` is settling the
  same question for the bars and the two should land as one convention.
- **Files:** `historyDashboard.en.ts:20` / `.sk.ts:20`; `HistorySummaryCard.vue:2-10`.
  ~~`activityTracking.en.ts:101` / `.sk.ts:101`; `ActivityDomainCard.vue:7-9`~~ — do not touch;
  `activityTracking.statColumn.viewDetails` stays *"View details for {domain}"* because that is what
  the click does on every dashboard once `F47` lands
- **What to change:** Rename ~~the two strings~~ **the history string** to what the click does —
  *"Highlight {name} in the chart"* / *"Zvýrazniť {name} v grafe"* (or *"Filter to"*, but pick the
  same verb `F29` uses for its drill-down so the two kinds of chart control read as two kinds). Keep
  the key name; only the value changes. Since the card is a toggle, `aria-pressed="selected"` is the
  honest extra and costs one attribute — and it is the same attribute `F49` adds to the source-filter
  chips, so the two batches should agree on it.
- **Do not change:** the behaviour. The finding's alternative — make the card actually open details — is a
  feature, and the pie-chart cross-highlight is the designed interaction (`HistoryPieChartSection.vue`
  renders the details panel for the selected group; that *is* the detail).
- **Verification:** `history-review/P1`'s `Verify:` block — the accessible name describes the highlight;
  Enter on a focused card highlights the slice (and again un-highlights); `aria-pressed` follows
  `selected`. ~~Repeat on `/activity-tracking`'s domain cards.~~ On `/activity-tracking` confirm the
  label still reads *"View details for …"* and that Enter opens the domain panel — the control it
  should be left alone. Both locales.
- **Risk:** None. One string and one key handler.

## F31. Pie legend overlaps the donut — fixed-percentage ECharts layout on a ~300 px canvas, and `isNarrow` is a dead prop

- **Scope:** app-side `src/core/historyDashboard/component/pieChart/HistoryPieChart.vue`
- **Closes:** `history-review/P2`
- **Root cause — not "in-hole", and the suggested fix does not apply.** The legend is not inside the
  donut; it is an ECharts legend boxed to the **left 58 %** of the canvas (`HistoryPieChart.vue:59-63`:
  `orient: 'vertical', left: 0, right: '42%'`) while the pie is centred at **74 %** with an outer
  radius of 75 % (`:87-88`). On a wide canvas the pie's left edge lands at ~57 % and the two just clear.
  But `HistoryPieChartSection.vue:23-34` puts the chart in a `flex-fill` **beside a 200–250 px details
  card**, inside the Summary view's `lg="6"` column — so at 1440 the canvas is roughly 300 px wide, the
  legend box ends at ~175 px and the pie starts at ~130 px. ECharts does not clip legend text to the box
  (the `formatter` at `:73-82` truncates at 25 *characters*, which is a width the layout never measured),
  so the entry runs into the slices. Same geometry on Detail's `HistoryInsightsColumn direction="row"`.
  `isNarrow?: boolean` (`:30`) is declared, passed by `home`'s `ActivityHistoryWidget.vue:26`, and **read
  nowhere** — it is the hook this fix was supposed to hang on.
- **Files:** `HistoryPieChart.vue:27-31` (props), `:59-88` (legend and series geometry)
- **What to change:** Make the layout answer to the width. Either honour `isNarrow` (and have
  `HistoryPieChartSection` derive it from its own measured width — `useResizeObserver` is already in use
  in `HistorySummaryCards.vue:137`) or measure inside the chart component; below the threshold, put the
  legend `orient: 'horizontal'` at `bottom` and centre the pie at `['50%', '45%']`. Above it, keep the
  side layout but truncate by **pixels** — ECharts 5's `legend.textStyle.width` + `overflow:
  'truncate'` — instead of by character count, and let the pie `center` follow the legend's actual
  width rather than a constant 74 %.
- **Adjacent, source-certain, unobserved:** `textStyle.color: '#fff'` (`:69`) and `borderColor: '#666'`
  (`:64`) are hardcoded — dark-theme values on a chart that renders in both themes
  (`createAppVuetify.ts:74` defaults to dark, which is why the sweep never saw white-on-white). Read
  `useTheme().current.value.colors['on-surface']` instead. Same hardcode in
  `StackedBarsChart.vue:479` (`.legend-label { color: #fff }`) — unit 5's, out of scope, noted so a
  fixing session that opens both does not fix one.
- **Do not change:** the `avoidLabelOverlap: false` / `label.show: false` series settings — slice labels
  are off by design and the tooltip carries them. Not the 25-item cap on the request
  (`HistorySummaryView.vue:231`) — fewer entries would dodge the symptom without fixing the layout.
- **Verification:** `history-review/P2`'s `Verify:` block on `/activity-history/detail?date=2026-09-09`
  (two groups) — a **screenshot**, since the a11y tree cannot see a canvas: legend text fully clear of
  the slices. Then `/activity-history` with `?groupBy=activity` and the week range (more entries, longer
  names), at 1440 and 1920; and the home widget, which passes `isNarrow` and should get the stacked
  layout. Both themes if the colour half is taken.
- **Risk:** Low-medium. A width-driven layout switch is a second render on resize; ECharts `autoresize`
  is already on (`:4`), so the cost is the option recompute. Check the selection highlight
  (`selectedMode: 'single'`) survives a layout switch mid-selection.

## F32. `/activity-history/calendar` has no `<h1>`, unlike its two siblings

- **Scope:** app-side `src/core/activityHistory/view/HistoryCalendarView.vue`,
  `src/core/activityHistory/_locales/activityHistory.{sk,en}.ts`
- **Closes:** `history-review/P3`
- **Root cause:** Confirmed. The view's template (`:1-26`) is a fragment of `HistoryFirstRunState` /
  `HistoryEmptyState` / `CalendarGrid` with no header row; `HistorySummaryView.vue:19` and
  `HistoryDetailView.vue:33` both render `<h1 class="text-h4">` inside a `d-flex align-center ga-6
  flex-wrap` header, each with an icon button linking to the sibling view. `history.calendar.*`
  (`activityHistory.en.ts:32-37`) has no `title` key to render even if the markup were there.
- **Files:** `HistoryCalendarView.vue:1-2`; `activityHistory.en.ts:32` / `.sk.ts` (one key,
  `history.calendar.title`)
- **What to change:** The siblings' header row, minus the controls the calendar does not have: an
  icon button to Summary (`chart-line`, the reverse of the siblings' `calendar-days` button — reuse
  `history.detail.openSummary`'s shape, new key `history.calendar.openSummary`) and
  `<h1 class="text-h4">{{ $t('history.calendar.title') }}</h1>`. Wrap the fragment in a root
  `d-flex flex-column` so the header sits above the grid and `CalendarGrid`'s `height: 100%` chain
  (`CalendarGrid.vue:287-292`) still resolves — check the grid still fills to the footer after the header
  is added; the siblings use `flex-fill` + `min-height: 0` on the body for this.
- **Do not change:** `CalendarGrid`'s own `VCardTitle` toolbar — it is the date-range control, not a page
  heading, and it is framework.
- **Verification:** `history-review/P3`'s `Verify:` block — `document.querySelector('h1')` resolves on
  `/activity-history/calendar` above the Mode/Month/Year row; the grid still scrolls inside the card at
  900 px tall rather than pushing the holiday footer off-screen.
- **Risk:** None beyond layout — but it is the `F12` class of layout (a definite-height flex chain), so
  look at the result rather than trusting the a11y tree.

## F33. Google Calendar connect never sends the OAuth `state` the server requires — the client half of `B1`

- **Scope:** app-side `src/core/googleCalendar/api/googleCalendarApi.ts`,
  `src/core/googleCalendar/view/GoogleCalendarCallbackView.vue`, `src/core/googleCalendar/_locales/googleCalendar.{sk,en}.ts`
- **Closes:** `user-settings/B1` — the **client half**. The server half is *Escalations* §9 and closes
  nothing in `src/`. Also touches the exact lines `B2` lives on: if `B2` confirms (it is re-graded
  `unverified`, *Needs verification*), its fix lands here and nowhere else.
- **Root cause — the finding's *"none on the frontend"* is wrong.** Read at the API source this pass:
  `ConnectGoogleCalendarRequest` is `record (string Code, string State)`, `ConnectGoogleCalendarValidator`
  has `RuleFor(x => x.State).NotEmpty().MaximumLength(128)`, and `ConnectGoogleCalendarEndpoint.HandleAsync`
  compares `req.State` with the `google-oauth-state` cookie and answers a 400 on any mismatch **before
  Google is called**. The client: `googleCalendarApi.ts:14-16` posts `{ code }` — no `state` — and
  `GoogleCalendarCallbackView.vue:19` reads only `route.query.code`, although Google's redirect carries
  `state=` because the auth-url endpoint put it there (`GoogleCalendarService.cs:54`). So on the day §9
  lands and a user reaches the callback with a real code, the connect POST is a **validator 400** and
  the view's `catch` (`:28-30`) shows *"Failed to connect Google Calendar"* — the same toast as a real
  failure. Unobservable today only because `B1` breaks the flow one step earlier, which is how it
  survived: the unit could not get past Google's error page to see it.
- **Files:** `googleCalendarApi.ts:14-16`; `GoogleCalendarCallbackView.vue:18-32`; both locale files if the
  optional branch below is taken. Reference only —
  `AdhdTimeOrganizer/application/endpoint/user/command/googleCalendar/ConnectGoogleCalendarEndpoint.cs`,
  `application/validator/ConnectGoogleCalendarValidator.cs`.
- **What to change:** `connect(code, state)` posting `{ code, state }`; the view reads both off
  `route.query` and treats *either* missing as the existing failure branch. **Optional, same lines, not
  required by any finding:** branch on `route.query.error` first — `access_denied` is Google's own
  "Cancel" — and show a softer, distinct key (`googleCalendar.connectCancelled`, SK + EN) rather than the
  generic failure. That is the residual `B2` wanted; do it only if `B2` confirms, and say so in the
  commit. Do **not** mark the callback route `public` to survive a session that lapsed during the consent
  screen — a signed-out callback *should* bounce; whether the bounce preserves the destination is unit
  15's question, not this batch's.
- **Do not change:** the server's state check, and do not "fix" the 400 by making the client skip the
  state — that check is the CSRF protection on the whole flow. Not `GoogleCalendarCard.vue` (that is
  `F34`).
- **Verification:** Two halves, and only the first is runnable today. **Now:** `playwright-cli goto
  /google-calendar/callback?code=x&state=y`, then `playwright-cli requests` → the `POST
  /api/user/google-calendar/connect` body must be `{"code":"x","state":"y"}`; the server answers 400
  (cookie mismatch — expected) and the failure toast must be on screen (which is also `B2`'s check, so
  read the snapshot the `goto` itself wrote rather than a later `find` — see §38). **After §9 (all three
  parts):** `B1`'s `Verify:` block end to end — Google's real consent screen, back to
  `/google-calendar/callback?code=…&state=…`, `POST …/connect` → 204, *"Google Calendar connected
  successfully"*, the row reads **Connected**, and a reload keeps it (`GET …/status`). Then Disconnect.
- **Risk:** None — the request is already failing, and it cannot fail worse.

## F34. The Google Calendar card's "Disconnect" is `error` on an elevated button — the app-side twin of `P1`

- **Scope:** app-side `src/core/googleCalendar/component/GoogleCalendarCard.vue:20`
- **Closes:** nothing filed — the unfiled app-side twin of `user-settings/P1`. The finding compared the
  two framework buttons against *"Edit"/"Connect" (both correctly `primary`, elevated)*, and it is right
  about the state it saw; the same button reads `:color="connected ? 'error' : 'primary'"`, so once the
  row is **Connected** it is exactly the defect `P1` describes, one card up. Not observable during the
  pass because `B1` keeps every account disconnected.
- **Root cause:** CLAUDE.md's colour-by-variant rule: `VBtn` defaults to `variant="elevated"`
  (`createAppVuetify.ts:25`), and elevated takes `errorDark`; `error` is the tonal/outlined token.
- **Files:** `GoogleCalendarCard.vue:20`
- **What to change:** `'error'` → `'errorDark'`. One token.
- **Do not change:** the chip on `:12` (`error`/`success` on a `VChip` — chips are not under the rule),
  and **do not batch this with `FW8`** — same defect class, different repo (rule 1; the `F4`/`FW2` split).
- **Verification:** Needs a Connected row, so blocked on §9 + `F33` like everything else on that card;
  until then a one-line source read is the whole check. When it is reachable: both themes.
- **Risk:** None.

## F35. `dateTime.secondsShort` renders raw on every running clock — the fourth leak of a mirror written per consumer, not per namespace

- **Scope:** app-side `src/locales/common.sk.ts`, `src/locales/common.en.ts`, `src/locales/SK.ts`,
  `src/locales/EN.ts` + docs-only `CLAUDE.md` (the *Localization* bullet on mirroring)
- **Closes:** `history-capture/B1`, plus two **unfiled, source-certain** twins — `general.from` and
  `general.to`, which `TimeRangePicker.vue:9,59` resolves in *range* mode and no app locale file defines
- **Root cause — confirmed, and wider than the finding.** The finding is exactly right about the
  mechanism: `SK.ts:21-27` spreads the framework's `common` first and `appCommon` after, the spread is
  shallow, so the app's `dateTime` replaces the framework's wholesale, and `TimeDisplay.vue:38` resolves
  a key the app's copy never carried. `secondsShort` has been in the framework's SK file since
  `3976e81` (2026-06-24); the app's mirror block was written on 2026-09-09 (`f6af3c35`) and picked
  `hoursShort`/`minutesShort` without it. **Why it was missed is written in the file:** the SK comment at
  `common.sk.ts:149-154` says *"every key below is one the framework's own `DateRangePicker` /
  `MonthYearPicker` resolve"* — the mirror was built by reading two consumers, not by diffing the
  namespace, and `TimeDisplay` was not one of the two. That is the same way R5, R6 and R11 happened.
  Diffed mechanically this pass (a throwaway script over the four files, deleted): in **both** locales
  the app's `dateTime` lacks exactly one framework key (`secondsShort`), `controls` and `app` lack none,
  and **`general` lacks 26** — `total, print, addNew, formErrors, saveAll, discard, yes, no, active,
  inactive, from, to, of, back, prev, next, image, imageRequired, imageTooLarge, address, city, street,
  houseNumber, postalCode, descriptiveNumber, orientationNumber`. Of those, two are resolved by a
  framework component **this app mounts**: `TimeRangePicker` labels its start field `general.from`
  (when no `label` prop is passed) and its end field `general.to` whenever `mode === 'range'` — a state
  one click on the toggle button reaches and `localStorage['timeRangePickerMode']` then persists across
  reloads. Eight consumers (`HistorySummaryView`, `HistoryDetailView`, `ActivityDashboardHeader`, and
  five in `dayPlanner`). Unit 3 saw the toggle (`history-review/inventory.md:24`, *"Switch to time
  range"*) and did not click it. The other 24 are resolved only by framework components this app does
  not mount (`MyPdfViewer`, `LookupDialog`, `TableGrid`, `TableCellEditor`, the two address fields) —
  today. `general.yes`/`general.no` are the pair `F4` intends to use.
- **Files:** `src/locales/common.en.ts:339-392` (`dateTime`), `:290-338` (`general`);
  `src/locales/common.sk.ts:128-185`, and its `general` block; `src/locales/SK.ts:35-58`;
  `src/locales/EN.ts:26-45`. Reference only — `src/_common/_locales/common.{sk,en}.ts`,
  `src/_common/component/dateTime/TimeDisplay.vue:36-38`, `TimeRangePicker.vue:9,59`.
- **What to change — recommended: stop mirroring and merge.** `SK.ts:57` already does
  `user: { ...frameworkUser.user, ...appUser.user }` for the one namespace two files contribute to, with a
  comment explaining exactly why. `general`, `dateTime` and `controls` are the same situation — two files
  contribute, the app must win collisions, and the framework's keys must survive — and they get a shallow
  spread instead. Do the same merge for those three in both `SK.ts` and `EN.ts` (`general: {
  ...common.general, ...appCommon.general }`, etc.), and then **delete the mirrored blocks and their
  "mirrored from" comments** from both app files (the app's deliberate divergences — the two
  `dateRangeExceedsLimit` wordings, `anchor` — stay because the app is spread second). Exclude
  `navigation`: the framework's copy is another app's HR tree and the merge would only add dead keys.
  Then rewrite CLAUDE.md's *Localization* consequence bullet — it currently tells the reader to *"mirror
  the key … by hand"*, which is the instruction that has now produced R5, R6, R11 and this — to say the
  merged namespaces need nothing and to name the merge site. **Fallback if the merge is declined:** the
  finding's own one-line fix (`secondsShort: \`s\`` next to `minutesShort` in both files) **plus**
  `general.from` / `general.to` in both files (SK: *Od* / *Do*), plus a vitest next to
  `src/locales/slovakPlurals.test.ts` asserting that for each of `general`, `dateTime`, `controls` every
  leaf key in the framework file exists in the app file — so the fifth leak fails `npm test` instead of
  rendering. One of the two; not neither.
- **Do not change:** `src/_common/_locales/*` — the framework's files are complete; the gap is
  entirely app-side. Do not add `secondsShort` to `activityHistory.{sk,en}.ts` or any module locale: it
  is a `common` key resolved by a framework component. Do not "fix" `EN.ts:18-23`'s comment in passing
  without checking it — it says the framework's `common.en.ts` is *partial* (*"only `notifications.*` and
  `reminderPreference.*`"*), which stopped being true at `e04dad2` (2026-09-11, *"complete the English
  mirror"*); the diff above shows the framework's EN `dateTime`/`general` are now as full as SK's. Same
  for CLAUDE.md's *"`EN.ts` does not spread the framework's Slovak-only `common` at all"* — it does, at
  `EN.ts:27`. Both are stale sentences to correct in the same commit, not reasons to hedge the merge.
- **Verification:** `history-capture/B1`'s `Verify:` block verbatim on all three clock views, in **both**
  locales (`s` in each; the finding's screenshot `stopwatch--default.png` is the before). Then the
  twins: on `/activity-history` (Summary) click *Switch to time range* and read the second field's label —
  *To* / *Do*, not `general.to`; reload and confirm it stays (the mode persists). `playwright-cli console`
  must show zero `[intlify] Not found` lines on all four screens. If the merge was chosen, run
  `npm run type-check` — the merged objects change the inferred locale type, and any consumer typed
  against the old shape shows up there.
- **Risk:** Low for the patch. Low-medium for the merge: it changes which strings win for keys **both**
  files define — but the app is spread second, so every string this app renders today is unchanged, and
  the only new strings are ones that currently render as raw keys. The one thing to look at is the
  `vuetifyLocale` spread in `SK.ts:36` — unrelated, but it is the same file and the same shape.

## F36. Typed durations snap to 5 minutes with no feedback — eight `<TimePicker>` tags in six `activityHistory` files take a time-of-day default

- **Scope:** app-side `src/core/activityHistory/` only — **not** `src/_common/component/dateTime/TimePicker.vue`
- **Closes:** `history-capture/B2`
- **Root cause:** Confirmed in source. `TimePicker.vue:69` defaults `allowedMinutesSelected = '5'`, and
  both write paths snap: the mask watcher (`:114-129`) rounds typed minutes through
  `roundToNearestInterval` (`DateTimeHelper.ts:166-168`, `Math.round(m / i) * i`), and the `timeString`
  setter (`:97-101`) rounds again for the menu. The finding's evidence is exact (`0007` → `00:05`, `0001`
  → `00:00`), and the app already states the convention the finding is asking for:
  `SuggestedTimeFormField.vue:15` passes `allowedMinutesSelected="1"` for a typed duration, while
  `TaskPlannerDayTemplateDetailsForm.vue:18,25` passes `"10"` and `QuietHoursCard.vue:43,55` `"5"` for
  times of day. **This module never passes it.** The finding counts three call sites; the module has
  **eight tags in six files**, every one a duration, every one at the default: `TimerView.vue:14`
  (Length), `PomodoroDurationCard.vue:15` (mounted three times by `PomodoroSetupPanel.vue:21-31` — the
  three fields the finding saw), `AddActivityManuallyForm.vue:16` (Length), `EditActivityHistoryForm.vue:8`
  (Length, on the history record edit dialog — unit 3's screen), `TimerPresetDialog.vue:15` (Duration),
  `PomodoroPresetFormDialog.vue:75,84,93` (Focus / Short break / Long break).
- **The preset editors are the reason this is a `bug` and not `polish`.** The API's per-user default
  seeder ships *Short Sprint* with `ShortBreakDuration = 3` (`PomodoroTimerPresetSeeder.cs:46-50`) — a
  value that every account has from day one and that `PomodoroPresetFormDialog` cannot re-enter: the
  field displays `00:03` (reads are not rounded), but the menu's `allowedMinutes` (`TimePicker.vue:91`)
  greys out 3, a typed `0003` becomes `00:05`, and the arrow buttons step 3 → 8 / 3 → 0. Touch that
  field once and the preset can never go back to what the server gave it.
- **Files:** the eight tags above.
- **What to change:** Add `allowedMinutesSelected="1"` to all eight. That is the whole change. Do it as
  one commit so the module has one rule (durations are minute-exact), and say so in the message. Two
  things to leave alone while there, both dead attributes that land on `TimePicker`'s root `div` and do
  nothing: `variant="outlined"` on `TimerPresetDialog.vue:20` and `PomodoroPresetFormDialog.vue:79,88,97`
  (`TimePicker` has no `variant` prop — `VMaskInput` takes the app default), and `minWidth`/`maxWidth` on
  `EditActivityHistoryForm.vue:12-13` (not props either; `width` is). Deleting them is harmless and
  optional; adding them as real props is a different batch.
- **Do not change:** `TimePicker.vue`'s default, `roundToNearestInterval`, or the snap itself — a
  framework-wide default is its own batch (rule 4) and the component has time-of-day consumers for
  which `'5'` is right. Do not touch the duration fields in other modules that have the same gap —
  `LogTimeBody.vue:10` (dayPlanner, unit 7 not run) and the framework's `LogTimeForm.vue:15` — they are
  the same one-attribute edit, but they belong to units that have not filed them, and the second is a
  submodule commit. Do not add a "rounded to" helper text: at `'1'` there is nothing to explain.
- **Verification:** `history-capture/B2`'s `Verify:` block, first pass condition (the field **keeps**
  `00:07`) on `/activity-history/timer`, all three Pomodoro cards and `/activity-history/manual`; then the
  three the finding did not list — open *Short Sprint* in the Pomodoro presets dialog, type `0003` into
  Short break, read `00:03`; open a quick-time preset in edit mode on `/timer` (after `F37`, or via the
  chip label), same check; open a history record's edit dialog on `/activity-history` and type an odd
  length. Then the menu: click the Length field, confirm every minute is selectable. Then Start a
  7-minute countdown and confirm `POST timer-alarm/schedule` carries an `endsAt` 7 minutes out, not 5.
- **Risk:** Low. The only behavioural change is that the arrow buttons now step by one minute instead
  of five on these fields — fine for a duration, and none of the eight passes `showArrows` anyway.

## F37. Preset chips define `#close` without `closable` — a live "Close" button that hides the chip, and in edit mode it *is* the pencil

- **Scope:** app-side `src/core/activityHistory/component/TimerPresetsSection.vue`
- **Closes:** `history-capture/B3`, and the chip-role observation the unit's inventory attributes to a
  finding `A1` that was never filed (`inventory.md:79`, *"no accessible role/name — see finding A1"*;
  *Contradictions* §49)
- **Root cause:** Confirmed against Vuetify 3's source, and the finding's guess is right:
  `VChip.js:179` is `hasClose = !!(slots.close || props.closable)`, so **defining the slot is what
  renders the button** — `<button class="v-chip__close" aria-label="Close">` (`:274-279`), always, with
  `closeProps.onClick` (`:136-141`) doing `preventDefault()`, **`stopPropagation()`**, `isActive = false`,
  `emit('click:close')`. `TimerPresetsSection.vue:44-51,93-100` puts a `v-if="editMode"` pencil *inside*
  that slot, so outside edit mode the button is empty and still focusable (the finding's observation),
  and clicking it flips the chip's private `isActive` — client-side only, no listener on `click:close`,
  back on reload (also the finding's observation). **What the finding did not see, because the pass did
  not click the pencil:** inside edit mode the pencil sits inside the same button, so a click on the one
  affordance that says "edit" is swallowed by `stopPropagation` before the chip's own
  `@click="openEditDialog(preset)"` (`:41,:90`) can run — the chip disappears and no dialog opens. The
  editor is reachable only by clicking the chip's *label*, which is what the `pr-4` padding hack on
  `:38` is compensating for. Source-certain; one outcome.
- **Files:** `TimerPresetsSection.vue:35-52` (quick-time chips), `:85-101` (activity chips)
- **What to change:** Delete both `#close` templates and move the pencil to the chip's **append** side:
  `:appendIcon="editMode ? 'pen-to-square' : undefined"` on each `VChip`. That renders no close button
  in either mode, the pencil becomes part of the chip's own click target, `openEditDialog` handles the
  click as already written, and the `:class="{ 'pr-4': editMode }"` on `:38` can go (the activity chips
  never had it — the two rows will finally match). Deletion stays where it is, behind the edit dialog's
  *Delete* button (`TimerPresetDialog.vue:38,126-133`) — do **not** take the finding's second option
  ("clicking it actually deletes the preset"): a bare × on a chip with no confirmation is the exact
  affordance the app already decided against by putting delete in a dialog. **While in the file:** the
  chips are clickable `span`s with `tabindex="0"` and Enter/Space handling (Vuetify supplies both,
  `VChip.js:169-174,195-197`) but **no `role`**, which is the inventory's unfiled `A1` and why its
  locator is `.locator('span').filter({ hasText })`. Add `role="button"` to both `VChip`s — one attribute,
  same tags, and it makes the draft spec's chip locators `getByRole('button', { name: '15m' })`. That is
  the whole a11y change; the chip text is already the accessible name.
- **Do not change:** `TimerPresetDialog.vue` — its delete path is fine for this batch. (Adjacent, not
  filed, not for this batch: `:129` confirms through `useDialog().confirm()` unconditionally rather than
  `useDeleteConfirmation`, so a user with `askBeforeDelete = false` is still asked — CLAUDE.md's
  preference-ownership table lists five delete sites and this is a sixth. Unit 4's mutation pass did
  **not** exercise it — it skipped `B3`'s surface as unchanged — so it stays source-only; `F69` is the
  same class in `todoList`, observed, and fixes its site the way this one should be fixed when touched.)
  Do not add a `closable` prop with a handler — that keeps the button and
  its "Close" name for a control that does not close anything.
- **Verification:** `history-capture/B3`'s `Verify:` block, first pass condition: outside edit mode,
  `document.querySelectorAll('.v-chip__close').length === 0` on `/activity-history/timer`, and Tab from
  the *Edit* button lands on the first chip, not on a nameless button inside it. Then the half the pass
  never ran: click *Edit*, click the **pencil** on the *15m* chip — the preset dialog opens with *15m*
  loaded and the chip is still in the row. Then `find` the chips as `button "15m"` (role check). Repeat
  the pencil click on an activity-preset chip (create one through the `+` first if the seed has none —
  `inventory.md:93` says it does not).
- **Risk:** Low. `appendIcon` renders a `VIcon` with `end: true` and **no size** (`VChip.js:253-256`),
  where the close slot forced `x-small` (`:283-291`) and the pencil forced `size="16"` — so the icon
  will come out a step larger than today. Check it visually once; if it matters, use the `#append` slot
  with the sized `VIcon` instead of the prop — same fix, no close button either way.

## F38. Leftover `console.log` in `TimerPresetsSection.vue` — and the lint rule that should have caught it is `off`

- **Scope:** app-side `src/core/activityHistory/component/TimerPresetsSection.vue:155`,
  `src/core/dayPlanner/component/template/MiniTimeline.vue:50`,
  `src/core/todoList/composable/dragAndDrop/UseDragAndDropMonitor.ts:24`, `eslint.config.ts:43`
- **Closes:** `history-capture/P1`, **`planner-templates/P2`** (twelfth pass — unit 8 filed
  `MiniTimeline.vue:50` on its own, observed as three `Proxy(Array)` lines per load of
  `/day-planner/templates`; it was already in this batch's file list from the eighth-pass grep, so the
  finding closes here rather than opening a second batch. Its `Verify:` block is the browser check for
  that line: zero `[LOG]` from `MiniTimeline.vue` on the template list.)
- **Root cause:** The line the finding names (`loadPresetsData()`, `console.log(allPresets.value)` right
  after the `fetchAll()`) — confirmed. The reason it survived is `eslint.config.ts:43`:
  `'no-console': ['off', { allow: ['error', 'warn'] }]` — the rule is **off**, with an allow-list that is
  only meaningful when it is on, i.e. someone configured the intent and not the severity. A grep for
  `console.log(` across `src/` finds **three** app-side leftovers (the two others: `MiniTimeline.vue:50`
  logs `tasks` on every render of the template planner's mini timeline; `UseDragAndDropMonitor.ts:24`
  logs `'Global drag start:'` + payload on every drag) and five in the framework's `user` module
  (`LoginView.vue:142` `console.log(valid)`; `ForgottenPasswordView.vue:73`, `ConfirmEmailView.vue:57,71`,
  `ConfirmEmailChangeView.vue:58` — `console.log(error)` in `catch` blocks, which the allow-list would
  want as `console.error`). One correction to the finding: **only `TimerView` mounts
  `TimerPresetsSection`** (`TimerView.vue:42`); the Pomodoro view mounts `PomodoroSetupPanel` and
  `PomodoroPresetsDialog`, neither of which imports it. The finding's own evidence names only `/timer`;
  the *"both mount this component"* sentence is unobserved and wrong (§48).
- **Files:** the four above.
- **What to change:** Flip `eslint.config.ts:43` to `'no-console': ['error', { allow: ['error', 'warn'] }]`,
  run `npm run lint`, and delete what it reports — expected: the three app-side lines, nothing else.
  (`npm run lint` runs `--fix`, but `no-console` has no fixer, so the deletions are by hand.) If the
  count differs from three, the difference is the finding, not the rule.
- **Do not change:** the five framework lines — ESLint ignores `src/_common` by config, so the rule will
  not report them, and they are `vue_framework` commits. **Unit 15 has now run** (ninth pass) and they
  are taken: `LoginView.vue:142` by `FW11` (filed as `auth/P3`), `ForgottenPasswordView.vue:73` by
  `FW9`, `ConfirmEmailView.vue:57,71` and `ConfirmEmailChangeView.vue:58` by `FW12` — the last four
  disappear with the `catch` blocks they sit in rather than becoming `console.error`, because each of
  those views already shows a snackbar in the same branch. Pre-empted here so the fixing session does
  not chase them into the submodule.
- **Verification:** `history-capture/P1`'s `Verify:` block on `/activity-history/timer` — zero `[LOG]`
  lines from `TimerPresetsSection.vue`. Then `npm run lint` exits 0 with the rule on. The two other
  deletions are verified by the lint run, not a browser.
- **Risk:** None to runtime. The lint change is app-wide and the CLAUDE.md *Lint* line says the baseline
  is 0 errors with two known warnings — re-measure after the flip and correct that sentence if the
  warning count moves.

## F39. The auth guard's redirect drops the destination — the write half of `auth/B1`

- **Scope:** app-side `src/router.ts:98`, plus one record in `docs/views/_routes.md`'s guard notes
- **Closes:** `auth/B1` — **write half only.** The read half is `FW11` (framework, rule 1). Neither
  half is visible without the other, which is why the finding's own root-cause guess ("two independent
  gaps that happen to compound … fixing only one side is not enough") is right and is the reason for
  the two batches rather than an argument against them.
- **Root cause:** `router.beforeEach` at `src/router.ts:97-98` is `if (!auth.isAuthenticated) return
  { name: 'login' }` — no `query`. Confirmed by direct read. The framework's interceptor already does
  it the other way: `_common/axiosConfig.ts:175` pushes `{ name: 'login', query: { redirect:
  _router!.currentRoute.value.fullPath } }` on a forced logout, so the **`redirect` query contract
  already exists in the framework** and this guard is the one writer that ignores it. The finding's
  live evidence — `goto /todo-list/13001` while signed out lands on `/login` with **no query string**,
  and signing in lands on `/` — is exactly what this line produces. The runbook's decision log put
  this precise question ("does the login redirect preserve the destination") into unit 15 in place of
  a signed-out sweep, so the expectation is sourced, not taste.
- **Files:** `src/router.ts:98`
- **What to change:** `return { name: 'login', query: to.fullPath === '/' ? undefined : { redirect:
  to.fullPath } }` — skip the param for the home route so a plain bounce keeps a clean `/login` URL.
  `to.fullPath` carries the query and hash, so `/day-planner/11-09-2026?tab=x` survives whole. Nothing
  else: the `SIGNED_OUT_ONLY_ROUTES` branch above it (`:91-93`) is unrelated and must keep sending an
  *authenticated* visitor to `home`, redirect or not. Update `_routes.md:11`'s guard sentence to say
  the redirect carries `?redirect=<fullPath>`.
- **Do not change:** `_common/axiosConfig.ts:175` (already correct, framework). Do not read the query
  back here — `router.ts` has no business knowing how `LoginView` consumes it; that is `FW11`. Do not
  add the param to the `hasRequiredRole` bounce at `:102` (that user *is* signed in; there is nothing
  to return to).
- **Verification:** `B1`'s `Verify:` block, but only after `FW11` is in the pointer: signed out,
  `goto /todo-list/13001` → the URL bar reads `/login?redirect=%2Ftodo-list%2F13001`; sign in; the
  URL bar reads `/todo-list/13001`. Before `FW11` lands the observable is only the first half (the
  query is present), which is worth asserting on its own so the two halves can be retested
  independently. The draft spec's `test.fixme` at `e2e/tests/auth.draft.spec.ts:50` is this
  behaviour — promote it once both halves are in.
- **Risk:** None. One query param on a route the framework already writes the same param to.

## F40. Logging out fires `GET /routine/settings` and logs a 401 — `resetAppState()` creates the store, and the plugin loads it

- **Scope:** app-side `src/core/todoList/store/routineReviewStore.ts:33-44`, and one sentence in
  `src/core/user/composable/useSessionReset.ts`'s doc comment
- **Closes:** `auth/P2`
- **Root cause — not the one filed.** The finding says an in-flight request survives the logout
  because `ensureLoaded`'s `inFlight` promise has no cancellation, and proposes an `AbortController`.
  Traced this pass: on the Home dashboard **nothing creates `routineReviewStore`** — its only
  consumers are `useRoutineWeeklyReview.ts:15` (mounted by `RoutineToDoListView`, not by any `home`
  component; grep of `src/core/home/` finds no import) and `useSessionReset.ts:42`. So the store does
  not exist until *Log out*: `useLogout.ts:11-13` awaits `POST /auth/logout`, calls `auth.logout()`,
  `App.vue:104-109`'s watcher sees `isAuthenticated` fall and calls `resetAppState()`, whose line 42 is
  `useRoutineReviewStore().resetStore()` — and **that `useRoutineReviewStore()` call is the store's
  first creation**, which is exactly the moment `createAppPinia.ts:13-14` calls `ensureLoaded()`.
  `ensureLoaded` (`:33-44`) has no signed-out guard, so `fetchSettings()` fires **after** the server
  has cleared the session, answers 401, the interceptor's refresh attempt fails or is skipped (the
  route is already `login`), and `console.error('ERROR: ', error)` prints. Then `resetStore()` runs on
  a store that has just started loading. That is why the unit saw it "twice, deterministically" on a
  logout it thought was merely "prompt": it is not a race, it happens on every logout from any page
  that never visited `/routine-todo-list`. Two more things in the same eleven lines, both CLAUDE.md's
  own `ensureLoaded` contract: the method **rejects** (no `catch`, and the plugin's call is "neither
  awaited nor caught"), so besides the interceptor's line there is an unhandled rejection; and it has
  no `isAuthenticated` guard, which the same CLAUDE.md paragraph names as the `activityOptionsStore`
  pattern ("the load itself no-ops while signed out, so booting on the login screen fires no request").
  Severity `polish` stands — no snackbar (401 is silent by design) and no user-visible state — but
  the fix is smaller and different from the one proposed.
- **Files:** `routineReviewStore.ts:33-44`; `useSessionReset.ts:10-36` (doc comment)
- **What to change:** In `ensureLoaded`: `if (isLoaded.value || !useUserStore().isAuthenticated)
  return` as the first line, and `.catch(() => {})` (or a caught `try/await`) so the promise the plugin
  fires never rejects — `isLoaded` stays `false` on failure so the next call retries, which is the
  behaviour `RoutineToDoListView.vue:199`'s `onMounted` call already relies on. Add one line to
  `useSessionReset.ts`'s comment: *calling `useXStore()` here creates the store if nothing has yet, and
  a store with `ensureLoaded()` loads on creation — so every store reset here must no-op its load while
  signed out.* That sentence is the real fix; the guard is its first application.
- **Do not change:** `resetAppState()`'s list (the other four stores expose no `ensureLoaded`, checked
  by grep — the sentence above is what keeps that true). Do not add an `AbortController` — there is
  no in-flight request to abort, and `resetStore()` already clears `inFlight`. Do not touch
  `RoutineToDoListView.vue:199`'s `onMounted` call in this batch: it violates CLAUDE.md's "components
  must not call it in `onMounted`" rule, but it is also what reloads the dismissal after a second
  sign-in (the store's watcher resets and does not reload — CLAUDE.md says so), so removing it needs
  the reload half added to the watcher first. Adjacent, out of scope, noted.
- **Verification:** `P2`'s `Verify:` block: sign in, land on `/`, open the user menu, *Log out*, read
  the console — no `401` on `/routine/settings`, no `AxiosError`. Then the positive check the finding
  did not write: `/routine-todo-list` still shows (or hides) the weekly review card correctly after a
  fresh sign-in, i.e. the guard did not swallow the signed-in load.
- **Risk:** None. The guard is the same shape as the store one module over.

## F41. `DayPlannerSettingsView`'s tabs stack — `d-flex` on a `VTabsWindowItem` defeats `v-show`

- **Scope:** app-side `src/core/dayPlanner/view/DayPlannerSettingsView.vue:31-36,52-58`
- **Closes:** `planner-day/B1`
- **Root cause:** Confirmed at source, and the finding's mechanism is exactly right. Vuetify's
  `VWindowItem` hides an inactive item with **`v-show`** (`VWindowItem.js:112-115` —
  `withDirectives(…, [[vShow, groupItem.isSelected.value]])`), which is an inline, non-`!important`
  `display: none`. The two items at `:33` and `:54` carry `d-flex`, and every Vuetify display utility
  is `display: flex !important` (`vuetify.css`, `.d-flex`). A stylesheet `!important` beats an inline
  normal declaration regardless of order, so those two items never hide; the three items with only
  `pt-3` do. The class lists the unit read off the DOM (`flex-fill d-flex flex-column ga-4 pt-3` and
  `pt-3 d-flex flex-column ga-4` on the stuck items, `pt-3` on the hidden ones) are the whole proof.
  **Only instance in the app**: a multiline grep for a display utility on `<VWindowItem`/`<VTabsWindowItem`
  hits these two lines and nothing else — `ActivitySettingsView.vue:90-105` uses `flex-fill` only
  (`flex: 1 1 auto`, not a `display` rule), and the framework's `TabsLayout.vue:19-22` passes no class.
- **Files:** `DayPlannerSettingsView.vue:33`, `:54` (and `:55`'s `style="max-width: 480px"`, which
  moves with the classes)
- **What to change:** The finding's suggested fix, verbatim: keep `pt-3` on the `VTabsWindowItem` and
  move `d-flex flex-column ga-4` (and `flex-fill` / `max-width`) onto an inner `<div>` wrapping
  `<RepeatingTasksTab />` and `<SkipReasonsTab />`. Check `RepeatingTasksTab` still fills the window
  height (it is a table — `F12`/`FW4`'s definite-height chain — so the inner wrapper needs `h-100` or
  `flex-fill` on a parent that is itself a flex column; the `VTabsWindowItem` is not one once `d-flex`
  leaves it, so the wrapper is `class="h-100 d-flex flex-column ga-4"`).
- **Do not change:** the `VTabsWindow`'s own `flex-fill` at `:29` (that is on the window, which is
  never hidden); nothing in the tab components. Not the URL state (`F42`).
- **Verification:** `B1`'s `Verify:` block — click all five tabs, one panel visible at each. Then the
  DOM check the unit used: `document.querySelectorAll('.v-window-item')` → exactly one with non-zero
  `offsetHeight`. Then confirm the Repeating Tasks table still renders rows and scrolls internally
  (the `F12` failure mode — rows present in the tree, body 0 px — is what a wrong wrapper produces).
- **Risk:** None beyond the table-height chain above.

## F42. `/day-planner/settings` active tab is not in the URL

- **Scope:** app-side `src/core/dayPlanner/view/DayPlannerSettingsView.vue:80` (`activeTab`)
- **Closes:** `planner-day/B6`
- **Root cause:** `const activeTab = ref('repeating')` with nothing reading or writing the route.
  CLAUDE.md's *URL State* rule names tabs explicitly. The module's other view already has the pattern
  (`useCalendarUrlState.ts`: absent-when-default, `router.replace`), and the app's other settings
  views use a route param instead (`/activity-settings/:tab(activities|roles|categories)` with a
  redirect from the bare path; `/activity-tracking/*/settings/:tableView`).
- **What to change:** Either shape satisfies the pass condition; **recommended: a `?tab=` query**,
  absent for `repeating`, written with `router.replace` from a `watch(activeTab)` and read once on
  setup (validate against the five values, fall back to `repeating`). It adds no route record, so
  `_routes.md`'s count and `F14`'s nav matching are untouched — the sidebar `to` is `/day-planner/settings`
  (`navItems.ts:56`) and a query does not affect `matchesPath`. The route-param shape is the sibling
  convention and is fine too, but it adds a redirect record and a manifest edit; pick it only if the
  owner wants the three settings pages uniform.
- **Do not change:** the settings load in `onMounted` (`:82-84`) — `loadSettings` is not the
  `ensureLoaded` convention, but that is a store-shape question, not this finding. Not `F41`'s classes.
- **Verification:** `B6`'s `Verify:` block — select *Skip Reasons*, reload, still on it; the URL shows
  `?tab=skipReasons`; the default tab produces a clean `/day-planner/settings`. Plus: a bogus
  `?tab=zzz` lands on *Repeating Tasks* with no console error.
- **Risk:** None.

## F43. `/day-planner/:date` with a malformed or unprovisioned date — two unguarded calendar fetches

- **Scope:** app-side `src/core/dayPlanner/view/DayPlannerView.vue:202-217`,
  `src/core/dayPlanner/composable/useDayNavigation.ts:71-84`; optionally
  `src/core/dayPlanner/dayPlanner.routes.ts:29`
- **Closes:** `planner-day/B5` — **the date half only.** The task half is settled as no defect
  (*Contradictions* §70; *Needs verification* below).
- **Root cause:** Two sites, one shape. (1) `DayPlannerView.vue:211` — `await Promise.all([
  fetchCalendarByDate(dateParam), fetchAllTemplates()])` inside an `async onMounted` with no `catch`,
  so a rejected calendar fetch is an unhandled rejection at the hook boundary (Vue logs it), `calendar`
  stays `undefined`, and `DayPlannerHeader` (`v-if="calendar"`, `:3`) never renders — the blank header
  the unit saw. The finding's *"no visible error message"* is a missed toast, not a missing one: the
  interceptor's 400 branch (`axiosConfig.ts:227-229`) shows the server's own text for ~3 s — the API
  strict-parses the segment (`GetByDateCalendarEndpoint.cs:19-24`, `DateOnly.TryParseExact(value,
  "dd-MM-yyyy")` → `"Date must be in dd-MM-yyyy format."`). What persists is the blank header, and that
  is the defect. (2) **Unobserved, source-certain:** `useDayNavigation.ts:71-84` — the `viewedDate`
  watcher calls `store.resetStore()` *then* `await fetchCalendarByDate(dateStr)` with no `catch`. On a
  404 the tasks are already gone, `calendar.value` keeps the **previous** day's object, and the URL has
  already moved (`navigateToDate`, `:31`) — a header for one day under another day's URL. The 404 is
  reachable without a malformed URL: `CalendarSeeder.cs:29-31` seeds this year and next, and
  `CalendarProvisioner` creates rows only on a **write** (`CreatePlannerTaskEndpoint`,
  `UpdatePlannerTaskEndpoint`, `ApplyTemplate…`), so `GET /calendar/by-date/31-12-2025` is a 404 for
  every seeded account and ArrowLeft from `01-01-2026` hits it. (The full-screen loader does not stick —
  `showSnackbar` hides it, §64 — so the visible symptom is only the wrong header.)
- **Files:** `DayPlannerView.vue:202-217` (mount), `useDayNavigation.ts:71-84` (watcher);
  `dayPlanner.routes.ts:29` if the param is constrained
- **What to change:** Three parts. **(a) Malformed param:** treat it like the missing one — the branch at
  `:203-209` already redirects an absent `:date` to the user's today; extend its condition to a strict
  `dayjs(dateParam, 'DD-MM-YYYY', true).isValid()` failure, so `/day-planner/not-a-date` and
  `/day-planner/2026-09-11` (ISO — the trap `UNIT-ORDER.md` briefed the unit on) both land on today with
  a clean URL and **no request**. Alternatively constrain the route, `':date(\\d{2}-\\d{2}-\\d{4})'`, and
  let `F20`'s catch-all take the rest — but until `F20` lands an unmatched URL is a blank main area, so
  the in-view redirect is the safer first step. **(b) Valid-but-unprovisioned date:** wrap the calendar
  fetch at both sites in `try/catch` (`_silent` is *not* wanted — the interceptor's 404 toast is the
  right first signal) and render a state: an inline `VAlert` in the header slot naming the date with a
  *Back to today* action, the way `PlannerTaskLinkView` does for a missing task. **(c) The watcher:** on
  failure, restore `store.viewedDate` to the calendar still in `calendar.value` (which also puts the URL
  back through `navigateToDate`), so header, grid and URL agree again; and `hideFullScreenLoading()` in a
  `finally` rather than trusting the snackbar to do it.
- **Do not change:** the interceptor (its `console.error` is by design — §70), `PlannerTaskLinkView`
  (already correct), the `by-date` contract (`dd-MM-yyyy` is deliberate; the ISO form is the `day-plan`
  endpoint's, `calendarApi.ts:38`).
- **Verification:** `B5`'s date-case `Verify:` block: `/day-planner/not-a-date` → lands on today, no
  request to `by-date/not-a-date`, console clean. Add: `/day-planner/2026-09-11` (ISO) → today, not a
  400 and not a neighbouring day; `/day-planner/31-12-2025` → the alert, header not blank, console
  shows the interceptor's line and **no** Vue "Unhandled error during execution of mounted hook";
  then from `/day-planner/01-01-2026` press ArrowLeft → alert or a revert to `01-01-2026`, and the URL
  agrees with the header either way.
- **Risk:** Low. The redirect branch already exists for the empty param; the `catch` adds a state the
  view never had.

## F44. Calendar "Days to show" and Range/Duration configuration in the URL — the app half

- **Scope:** app-side `src/core/dayPlanner/composable/useCalendarUrlState.ts`,
  `src/core/dayPlanner/view/PlannerCalendarView.vue:2-11,180-183,231-233`. **Blocked on `FW16`.**
- **Closes:** `planner-day/B3` (app half)
- **Root cause:** The finding's guess is right about the codec and wrong about the fix being local.
  `useCalendarUrlState.ts` models `month`, `mode`, `templateId`, `preview` and nothing else, and
  `syncMonthToUrl` (`:52-63`) reduces whatever range the grid emits to `monthKeyFromDate(range.start)`
  — so in Duration mode anchored on today the URL is bare (the key equals the current month), and on
  reload `hydrateFromUrl` applies a *month* range. But the state that would need encoding is not the
  app's to read: `dayVisibility` is a private `ref` in `CalendarGrid.vue:167`, and the picker's
  `selectedMode` / `durationAnchor` / `durationAnchorDate` / `durationUnit` / `durationQuantity` /
  `rangeStart` / `rangeEnd` are private in `DateRangePicker.vue:130-152`. The only exposed handle is
  `CalendarGrid`'s `dateRange` (`:283`), and pushing an arbitrary range into it while the picker is in
  month mode is coerced back to a month by `DateRangePicker.vue:269-274`. P7 anticipated exactly this
  (*"if it cannot accept an initial range, do the app-side workaround AND record the gap"*) and the
  session that ran it did neither for these two fields — `migration-revision.md` has no entry. The
  expectation is sourced: P7 names *"the displayed month/date range"*, and CLAUDE.md's *URL State* rule
  names filters, which is what *Days to show* is.
- **Files:** `useCalendarUrlState.ts` (codec + watchers), `PlannerCalendarView.vue` (bind the new models)
- **What to change:** Once `FW16` lands, bind `v-model:dayVisibility` and the picker-config model on
  `<CalendarGrid>` and extend the codec with the same *absent-when-default* rule: `days=workdays|weekend`;
  for Duration, `range=duration&anchor=start|end&from=YYYY-MM-DD&unit=day|week&qty=N` (`from` is the
  anchor date whichever end it anchors; `formatDateForApi` / `parseDateFromApi` in `DateTimeHelper.ts`
  are the existing pair, and the latter is strict — a hand-edited `from=2026-02-31` yields `null`, not a
  rolled-over date);
  for Range, `from`/`to`. `month` stays as it is and is written **only** in month mode — the current
  `syncMonthToUrl` on a Duration range is the wrong-month bug above. Keep `router.replace` for these
  (they are view configuration, not navigation) and the `isApplyingUrlState` guard around hydration.
- **Do not change:** `mode`/`templateId`/`preview`, which round-trip today and are pinned by
  `planner-day.draft.spec.ts:20-33`; `selectedDayIds` (excluded by P7, deliberately). Not the History
  calendar (`HistoryCalendarView.vue`) — unit 3 recorded the same gap there and did not file it
  (`history-review/inventory.md:100-104`, *"the intent sources (H6) never asked for it here"*); once
  `FW16` exists that view can adopt the same codec in a later batch if wanted.
- **Verification:** `B3`'s `Verify:` block, both halves — *Workdays* survives a reload; a Duration
  configuration with a non-default anchor/unit/quantity is restored *and* the URL carries it. Add: the
  default state produces a clean `/day-planner`; back/forward still walks months (P7's own check);
  `planner-day.draft.spec.ts:44-45` are the two `fixme`s to fill in.
- **Risk:** Low once `FW16` exists; nothing to do before it.

## F46. The pie-chart detail panel's close button was hand-rolled three times and drifted — wrong icon set on web, no name on desktop, a domain-only label on unified

- **Scope:** app-side `src/core/activityTracking/component/pieChart/ActivityDetailsPanel.vue`,
  `component/desktop/DesktopProcessDetailsPanel.vue`, `component/unified/UnifiedPieChartSection.vue`,
  `_locales/activityTracking.{sk,en}.ts`
- **Closes:** `tracking-dashboards/B1`, `tracking-dashboards/A2`
- **Root cause — confirmed, and the unit's own guess for both is exact.** Three panels, three copies of
  the same six-line `VBtn`, each missing a different thing:
  | panel | icon | name | observed |
  | --- | --- | --- | --- |
  | web — `ActivityDetailsPanel.vue:5-13` | `icon="mdi-close"` (`:7`) — a Material Design name in a FontAwesome-only app (CLAUDE.md *ICONS*) | `:aria-label="$t('activityTracking.pieChart.closeDomainDetails')"` (`:11`) ✓ | blank square, console *"Could not find one or more icon(s) {prefix: fas, iconName: mdi-close}"* (`B1`, DOM + console + source) |
  | desktop — `DesktopProcessDetailsPanel.vue:5-11` | `icon="fas fa-xmark"` ✓ | **none** — no `aria-label`, no `title`, no text | `{"hasBtn":true,"ariaLabel":null}` (`A2`, eval + screenshot) |
  | unified — `UnifiedPieChartSection.vue:69-75` | `icon="fas fa-xmark"` ✓ | `:ariaLabel="$t('activityTracking.pieChart.closeDomainDetails')"` ✓ | not opened by the unit; source-read only — and the label is the wrong noun: this panel's items are domains, desktop products *and* Android apps (`UnifiedActivityItem.label`), so *"Close domain details"* on *"Visual Studio Code"* is a smaller version of the same drift |
  The FontAwesome plugin cannot resolve `mdi-*` and renders an empty `<i class="v-icon">` — the button
  keeps its 28 px hit area and its name, so it is operable blind and by screen reader and invisible to
  everyone else. `grep -r 'mdi-' src/core src/_common` finds **no other consumer**; `B1` is the only
  one in the tree.
- **Files:** `ActivityDetailsPanel.vue:7,11`; `DesktopProcessDetailsPanel.vue:5-11`;
  `UnifiedPieChartSection.vue:70`; `activityTracking.en.ts:89` / `.sk.ts:89`
- **What to change:** One key, one button. Add `activityTracking.pieChart.closeDetails` — *"Close
  details"* / *"Zavrieť detaily"* — and use it on all three (and on `F47`'s fourth). Retire
  `closeDomainDetails` in the same commit, or keep it as the web panel's more specific label and add
  `closeProcessDetails` for desktop (*"Close process details"* / *"Zavrieť detaily procesu"*) — either
  is fine; **what is not fine is a fourth hand-typed variant**. Then `icon="fas fa-xmark"` on
  `ActivityDetailsPanel.vue:7`. While in the three files: the web panel binds `:aria-label`, the
  unified one `:ariaLabel` — pick the camelCase form (CLAUDE.md *Props*) for all three so the next
  grep finds them together. Consider extracting the button as `DetailsPanelCloseBtn.vue` in
  `component/pieChart/` — it is exactly the "diverged for no reason" component the unit's `R2` premise
  describes and three copies is already one too many — but a shared key alone closes both findings.
- **Do not change:** `ActivityPieChart.vue` or any pie-section layout; `DesktopPieChartSection.vue`'s
  `detailsLoading` skeleton (it is the reason the desktop panel's close button appears a beat later
  than the others — by design, it waits for `process-details`). Do not "fix" the web panel by copying
  the desktop one — that trades a missing glyph for a missing name.
- **Verification:** `B1`'s `Verify:` block — `/activity-tracking`, click a *View details for …* card,
  the top-right of the panel shows an X glyph and `playwright-cli console error` carries no *"Could not
  find one or more icon(s)"*. `A2`'s `Verify:` block — `/activity-tracking/desktop`, click a *View
  details for …* card, `getByRole('button', { name: /Close .*details/ })` resolves inside the panel.
  Then `/activity-tracking/unified`, select *Visual Studio Code* and read the close button's name.
  **The draft spec pins the old key**: `tracking-dashboards.draft.spec.ts:119`
  (`getByRole('button', { name: 'Close domain details' })`, inside the `B1` `fixme`) — update the
  locator to whatever this batch chooses when un-`fixme`-ing it. SK as well as EN.
- **Risk:** None. Two attributes, one key; every consumer is in this module.

## F47. Selecting an app on `/activity-tracking/android` opens no detail — a local panel from the data on the page; a per-app session count is not on the wire

- **Scope:** app-side `src/core/activityTracking/component/android/AndroidPieChartSection.vue`,
  `view/AndroidActivityDashboard.vue`, `_locales/activityTracking.{sk,en}.ts`
- **Closes:** `tracking-dashboards/B2` — **narrowed** (*Contradictions* §79). The finding's pass
  condition (*"at minimum its active seconds and session count"*) is amended below; the defect stands.
- **Root cause — confirmed, and the unit's guess is right about the mechanism and wrong about the
  data.** `AndroidPieChartSection.vue:57-78` renders one `VCard` with the span's `totals` and has **no
  branch on `selectedAppLabel`** — the model is written (`:110,129-131`), drives the pie's
  `selectedDomain` (`:52`), and is read by nothing else. Compare `ActivityPieChartSection.vue:145-161`
  (`selectedDomainDetails` computed → `ActivityDetailsPanel` in `domain` mode) and
  `UnifiedPieChartSection.vue:252-254,66-116` (`selectedDetails` → inline panel). Selecting an app
  therefore fires no request (unit: `requests` showed none), changes no panel (unit: two screenshots,
  same three numbers), and leaves `ActivitySummaryCards`' card announcing *"View details for Spotify"*
  (`ActivityDomainCard.vue:8`) for a click that shows none — the one dashboard where that label is a
  lie (§80).
  **What the unit thought was available is not.** `AndroidAppPieData` is `{packageName, appLabel,
  seconds, totalSeconds}` (`AndroidAppPieData.ts`), and the server sets **`Seconds == TotalSeconds` by
  construction** (`AndroidPieChartEndpoint.cs:57-58` — both are `g.Sum(x => x.DurationSeconds)`); there
  is no active/background split and no per-app session count anywhere in the Android responses.
  `AndroidAppSummaryDto.stat` is an `ActivityStat` (`seconds`, `averageSeconds`, `percentChange`) —
  the baseline comparison the card already shows, not a session count. `AndroidPieTotals.totalSessions`
  is span-wide. So the *"session count"* half of the pass condition is a **backend ask** (the Android
  sibling of desktop's `process-details` — sessions per app, first/last use, mean session length, from
  the `AndroidSessionData` rows the endpoint already groups) and is recorded under *Deferred to
  opportunities*, not batched here.
- **Files:** `AndroidPieChartSection.vue:57-78` (the panel), `:95-102` (props), `:110` (model);
  `AndroidActivityDashboard.vue:81-91` (the mount — `summaryCardsData` is in scope at `:61` and can be
  passed down); `activityTracking.{sk,en}.ts` `pieChart` block
- **What to change:** A `selectedDetails` computed over `props.apps` (`find(a => a.appLabel ===
  selectedAppLabel)`) and a `v-if="selectedDetails"` branch in the side card, mirroring the unified
  panel's shape (`UnifiedPieChartSection.vue:66-116`): header = `appLabel` + `F46`'s close button
  (emit → `selectedAppLabel = null`); rows = *Total* (`totalSeconds`), *Share of {span}*
  (`totalSeconds / totals.totalSeconds`, the number the legend already prints), *Package* (`packageName`,
  monospace caption — it is the identity the settings mapping table keys on, and the only place a user
  could otherwise learn it is `/activity-tracking/android/settings`). Optionally, pass the matching
  `SummaryCardsData` in and add *vs. baseline* from `stat.percentChange` — the card shows it, the
  panel may repeat it; do not fetch anything new. Two keys: `pieChart.shareOfSpan` and
  `pieChart.packageName`. **Guard the server's *Other* row:** with `minPercent: 1`
  (`AndroidActivityDashboard.vue:170`) the endpoint folds the tail into a row whose `packageName` and
  `appLabel` are the literal `"Other"` (`AndroidPieChartEndpoint.cs:79-80`), which `ActivityPieChart`
  does **not** treat as its `_other` sentinel (`:150`) — so that slice is selectable today and would
  open a panel titled *Other* with package *Other*. Skip it in `onSegmentClick` (or map it to `_other`
  when building `pieSegments`, which also gets it translated); the full contract problem is §10.
- **Do not change:** the `summary-cards`/`pie-chart` request shapes; `ActivityPieChart.vue` (`F48`
  edits it — coordinate, do not both touch `:9-28`); the desktop pattern — do **not** add an Android
  `details` fetch against an endpoint that does not exist. Not `ActivityDomainCard`'s label (§80).
- **Verification:** `B2`'s `Verify:` block with the pass condition read as: *selecting an app changes
  the side panel to that app's own detail — its total time, share of the span, and package name — and
  the close button clears it and `?selected`*. Then: deselect by clicking the same card and by clicking
  the slice; reload with `?selected=Spotify` and confirm the panel opens from the URL (the model is
  URL-backed via `useActivityDashboard`'s `selectedItem`); select a card whose app is under the pie's
  threshold if the seed has one, and confirm nothing selects *Other*. `tracking-dashboards.draft.spec.ts:126`
  is the `fixme` to fill in. SK as well as EN for the two new keys.
- **Risk:** Low. Additive branch; nothing selected renders exactly today's card. The only judgement
  call is whether a three-row panel is worth opening — it is, because the alternative is a card that
  says *"View details"* and a URL that says `?selected=` for a selection nothing displays.

## F48. The Android dashboard renders two controls for an Active/Background split its source does not have — a no-op metric radio on the pie, and a legend for a lane that is always empty

- **Scope:** app-side `src/core/activityTracking/component/pieChart/ActivityPieChart.vue`,
  `component/android/AndroidPieChartSection.vue`, `component/timeline/ActivityTimeline.vue`,
  `view/AndroidActivityDashboard.vue`
- **Closes:** *(unfiled)*. Two observations the unit made and did not file as findings — the inventory
  lists *Total / Active / Background* as a shared control whose effect is *"changes which metric the pie
  chart slices represent"* (`tracking-dashboards/inventory.md:31`) and does not mark it as differing on
  Android (`:185-188`); the draft spec's own comment records that *"the Activity Timeline's own
  Active/Background legend (shared markup with the other dashboards) renders the word 'Background'
  unconditionally"* on `/activity-tracking/android` (`tracking-dashboards.draft.spec.ts:103-105`), and
  scopes its assertion around it. The legend half is **observed** (that comment is the observation);
  the radio half is **source-certain, unobserved** — nobody clicked *Active* on the Android pie.
  Batched rather than parked under rule 5 on the `F27`/`F43` precedent: same file as `F47`, same
  cause, and the fix is a prop with a default that changes nothing for the other three dashboards.
- **Root cause — confirmed from source.** The Android dashboard is the web dashboard's component tree
  with Android fetchers plugged in, and two of those components carry a two-metric assumption:
  1. **`ActivityPieChart.vue:9-28`** renders the `VRadioGroup` (*Total / Active / Background*)
     unconditionally, bound to a `viewMode` model every section owns. Web and desktop and unified read
     it in `pieSegments` (`ActivityPieChartSection.vue:104-110`, `DesktopPieChartSection.vue:152-158`,
     `UnifiedPieChartSection.vue:214-219`). **Android does not** — `AndroidPieChartSection.vue:114-127`
     maps `seconds: a.totalSeconds` with no reference to `viewMode` — and could not: the DTO has no
     `activeSeconds`/`backgroundSeconds` (`AndroidAppPieData.ts`), and the server's two fields are
     identical (§79). Clicking *Active* or *Background* on that view re-renders the same pie.
  2. **`ActivityTimeline.vue:30-39`** renders the *Active / Background* legend whenever `laneLabels`
     is absent, i.e. on every per-source dashboard. Android passes `detailSessions: []` and
     `backgroundSessions: []` with the comment *"Android reports a single lane — it has no detail or
     background sessions"* (`AndroidActivityDashboard.vue:186-191`), so the legend's second entry
     describes a hatched style that never appears on that view. `toStackedBarsWindow` (`:136-147`)
     hardcodes `backgroundSeconds: 0` for the same reason, and the summary cards already handle it
     correctly (`ActivityDomainCard.vue:33-65` hides a column whose stat is null — the unit noted this
     as the *right* behaviour, `inventory.md:193`).
- **Files:** `ActivityPieChart.vue:9-28` (the radio; wrap in `v-if`), `:44-53` (a prop);
  `AndroidPieChartSection.vue:49-54` (pass it), `:112` (`viewMode` can stay, always `'total'`);
  `ActivityTimeline.vue:30-39` (the legend), `:148-165` (props); `AndroidActivityDashboard.vue:30-41`
  (pass it)
- **What to change:** On `ActivityPieChart`, a `showViewMode?: boolean` prop defaulting to `true` (or
  `metrics?: ('total'|'active'|'background')[]` if a two-option radio is ever wanted — not now), and
  `v-if` on the `VRadioGroup`; Android passes `false`. On `ActivityTimeline`, either derive it — hide
  the *Background* legend entry when `backgroundSessions.length === 0 && detailSessions.length === 0`
  — or take an explicit `singleLane?: boolean`; **derive it**, because a web day with no background
  sessions also does not need a legend entry for a style not on screen, and the derivation has no
  false positives (the entry is decorative when the lane is empty either way). Check the *Single /
  Split* toggle (`ActivityTimeline.vue:43-62`) on Android while there: with one lane, *Split* has
  nothing to split — if it renders an empty second row, hide it under the same condition.
- **Do not change:** `AndroidPieTotals`/`AndroidAppPieData` — do not invent an `activeSeconds` that
  copies `totalSeconds` to make the radio "work"; the honest state is no radio. Not the unified
  timeline's `laneLabels` branch (`:13-29`). Not `viewMode`'s model contract on the other three
  sections.
- **Verification:** `/activity-tracking/android` — no *Total / Active / Background* radio in the
  snapshot, the legend beside *Activity Timeline* shows *Active* only (or nothing), the pie renders
  the same slices as before. `/activity-tracking`, `/desktop`, `/unified` — radio present, three
  options, *Active* still re-slices the pie; legend unchanged. `tracking-dashboards.draft.spec.ts:101-107`
  (*"Top Apps cards with no Background row"*) keeps passing and can drop its scoping workaround once
  the legend word is gone. SK as well as EN is not needed — no new strings.
- **Risk:** None for the other dashboards (defaults preserve today's render). The one thing to get
  right is the `viewMode` model on Android: leave it bound and `'total'` so `ActivityPieChart`'s
  `required: true` model is satisfied.

## F49. Date-preset and source-filter chips are focusable `span`s with no role and no state — and every other chip-as-toggle in the app is the same class

- **Scope:** app-side `src/core/activityTracking/component/ActivityRangePicker.vue`,
  `component/unified/ActivitySourceFilter.vue`, `src/core/todoList/component/TodoListFilters.vue`,
  `src/core/dayPlanner/component/settings/RepeatingTaskDialog.vue`,
  `src/core/dayPlanner/component/BasePlannerTaskDialog.vue`
- **Closes:** `tracking-dashboards/A1` (+ the unfiled twins in `todoList` and `dayPlanner` below)
- **Root cause — confirmed, and it is Vuetify's default, as the unit guessed.** Vuetify **3.12.4**'s
  `VChip.js` renders the chip as `props.tag` (`span`) with `tabindex: isClickable ? 0 : undefined`
  (`:195`) and an `onKeydown` (`:197`) — and **no `role`, no `aria-pressed`, no `aria-checked`**; the
  only ARIA it writes is `aria-label` on its *close* button (`:134`). `VChipGroup` adds none either.
  So a chip in a group is keyboard-reachable and Enter/Space-activatable but announced as plain text:
  no group membership, no selectedness, no affordance. The unit's two eval dumps (`{"tag":"SPAN",
  "role":null,"tabindex":"0","ariaLabel":null}`; `{"role":null,"tabindex":"0","ariaPressed":null}`)
  are exactly what that code produces. A tag-level census of `src/` (every `<VChip` whose own
  attributes carry `@click`, `link` or `to`) finds **15 chips used as controls**, in seven files. They
  fall into two tiers, and only the first is this finding's defect — a control whose *state* is
  invisible:
  | file | shape | what it is |
  | --- | --- | --- |
  | `ActivityRangePicker.vue:7-29` | `VChipGroup mandatory` + 5 `VChip :value` | single-select, exactly one on — a **radiogroup** |
  | `ActivitySourceFilter.vue:31-48` | bare `VChip @click` × 3, on/off via `variant`/`color` | independent toggles — **button + `aria-pressed`** |
  | `TodoListFilters.vue:6-21` | `VChipGroup multiple` + `VChip filter` per priority | multi-select — **checkbox** group (or button + `aria-pressed`) |
  | `TodoListFilters.vue:22-44` | `VChipGroup` (non-mandatory) + 2 `VChip filter` | single-select, may be none — **radio** with a clearable state, or two `aria-pressed` buttons |
  | `RepeatingTaskDialog.vue:112-121,141,200` | bare `VChip @click="toggleDay"` × 7, on/off via `color`/`variant`, `style="cursor: pointer"` | seven independent toggles — **button + `aria-pressed`**; the unit-7 pass did not file it |
  | `BasePlannerTaskDialog.vue:24-33` | bare `VChip @click="setDuration"` × N, on via `color` | single-select — **radio + `aria-checked`**; unit 7 did not file it |
  The second tier is **action chips** — a click that does something, with the chip's own text as its
  name: `TodoListFilters.vue:45-54` (*Clear filters*), `OverdueTasksBanner.vue:12-20`,
  `SkipReasonForm.vue:6-15`, `NowBar.vue:116-127` and the three `leisure` chips
  (`ExperiencedCell.vue:3-14`, `MemoryAnchorTable.vue:35,45`) — the last four already carry `link` and
  a `:title`/`:aria-label`. They lack only `role="button"`; they have no state to expose and are not
  what `A1` is about. `TimerPresetsSection.vue:35,85` is **`F37`'s** and is not touched here.
  `SkipReasonsTab.vue:6` is `closable` only — its close is Vuetify's real `<button aria-label>` and
  needs nothing. Unit 9 (`todo-lists`) did not file its three; its inventory pass predated the a11y
  evidence discipline the later units have. Same defect, same fix, one batch — the `F35`/`F24` shape,
  not a per-module one. Every remaining `VChip` in `src/` is a label (status, count, colour swatch);
  `ChipWithIcon.vue` in `_common` is the same and is not touched.
- **Files:** `ActivityRangePicker.vue:7-29`; `ActivitySourceFilter.vue:31-48`;
  `TodoListFilters.vue:6-54`; `RepeatingTaskDialog.vue:112-121` (and its two siblings at `:141`,
  `:200` if they are the same shape — read them; only `:112` was read this pass);
  `BasePlannerTaskDialog.vue:24-33`. Second tier, optional in the same commit: the six action chips
  above get `role="button"` and nothing else
- **What to change:** At the call sites, through attrs (Vuetify passes unknown attrs to the root
  `span`): `role="radiogroup"` + `:ariaLabel` on the range `VChipGroup`, `role="radio"` +
  `:ariaChecked="activePreset === option.value"` on each preset chip; `role="button"` +
  `:ariaPressed="isSelected(option.value)"` on each source chip (the text already names it — *"Browser
  1h 22m"* — no `aria-label` needed, but `aria-pressed` is what `F30` also adds to the history cards,
  so use the same attribute); on `TodoListFilters`, `role="group"` + label on the priority group,
  `role="checkbox"` + `:ariaChecked` on its chips, `role="radio"`/`aria-checked` on the two due chips,
  `role="button"` on *Clear filters*; on the two planner dialogs, `role="button"` +
  `:ariaPressed="data.scheduledDays.includes(day.value)"` on the day chips and `role="radio"` +
  `:ariaChecked="currentDurationMinutes === d"` on the duration chips (drop the inline
  `style="cursor: pointer"` at `RepeatingTaskDialog.vue:117` — Vuetify's `v-chip--link` class already
  sets it once the chip is clickable). **Rule 4 — do not do this in `componentDefaults`**: a global
  `VChip: { role: 'button' }` would name every status chip in every app a control it is not, and the
  right role differs per group (radio vs checkbox vs button), which no default can express.
- **Do not change:** `VChipGroup`'s `mandatory`/`selectedClass` behaviour; the range picker's
  `isCustomPinned` logic (`:91-92`); the source filter's *last-one-stays* rule (`:195-205`) — a
  pressed chip that refuses to un-press is fine if its tooltip says why, and it does. Not `_common`:
  the framework has no chip *group* (grep: `CalendarGrid.vue:96`, `NotificationsView.vue:15`,
  `SessionsSection.vue:23`, `OverviewGroupCard.vue:40`, `BulkActionOutcomeList.vue:13`,
  `ReminderKindRow.vue:6` are all labels) — if one appears later it is its own `FW` batch.
- **Verification:** `A1`'s `Verify:` block — the *Today* chip exposes `role="radio"` +
  `aria-checked="true"`; the *Browser* chip on `/unified` exposes `role="button"` +
  `aria-pressed="true"`, and after clicking *Desktop* off, that one reads `false`. Then
  `/todo-list/13002`: `getByRole('checkbox', { name: <priority> })` and `getByRole('radio', { name:
  'Today' })` resolve, and `Clear filters` is a `button`. Then `/day-planner/settings` → *Repeating*
  → open a task: the seven day chips are `button`s with `aria-pressed`; and any planner task dialog:
  the duration chips are `radio`s with one `aria-checked`. Tab order unchanged; Enter/Space still
  toggle (that part is Vuetify's and already works). `tracking-dashboards.draft.spec.ts:134` is the
  `fixme`; `todo-lists.draft.spec.ts` and `planner-day.draft.spec.ts` have none for this and could
  each gain one structural assertion.
- **Risk:** None to behaviour — attributes only. One thing to watch: `role="radio"` on a `span` whose
  Vuetify keydown handles Enter/Space but **not arrow keys** is a partial radiogroup (ARIA expects
  arrows to move selection). Acceptable here — Tab reaches each chip — but say so in the commit so
  nobody files it as a regression.

## F50. The Compare Templates dialog is empty every time — two unkeyed fan-outs, and the finding's fix closes one

- **Scope:** app-side `src/core/dayPlanner/component/template/TemplateComparisonDialog.vue`
- **Closes:** `planner-templates/X1`; folds **`planner-templates/B3`** (same file, one attribute — see
  below)
- **Root cause:** Confirmed in source. `TemplateComparisonDialog.vue:107-108` destructures one
  `useTaskPlannerDayTemplateTaskCrud()` and one `useTemplatePlannerTaskCrud()`, and the `watch(dialog)`
  at `:116-132` does two fan-outs from them: `:120` `Promise.all([fetchById(ids[0]), fetchById(ids[1])])`
  and `:121-124` `Promise.all([fetchFiltered(…t1…), fetchFiltered(…t2…)])`. Both helpers abort their
  own previous call — `useEntityQuery.ts:35` unconditionally (`fetchByIdController?.abort()`, one
  controller per *method*, so a second id cancels the first), and `useFetchFiltered.ts:54-56` per
  `requestKey`, defaulting to one shared key when none is passed — so in each pair the first promise
  rejects with `CanceledError`, `Promise.all` rejects, `run()` re-throws cancellations by design
  (`useRequestState.ts:45`), and the `try … finally` at `:119-131` never reaches `sides.value = …`.
  The two-null default renders the `:00 - :00 · 0 tasks` the unit photographed. **The finding sees
  only the first pair.** Its suggested fix — key or split the two `fetchById`s — makes `:120` resolve
  and moves the identical failure to `:122`; the dialog stays empty and the console shows the same
  error one line down. `TemplateListView.vue:315-326`, in this module, already documents and uses the
  `requestKey: t.id` form for exactly this fan-out.
- **`B3`, same file:** `:6` passes `:showConfirmBtn="false"`; `MyDialog`'s prop is `hasConfirmBtn`
  (`MyDialog.vue:94,110`), so the attribute lands in `$attrs` and a live *Confirm* renders that emits
  `confirmed` to nobody. The other seven call sites in `src/` spell it correctly — one typo, not a
  class.
- **Files:** `TemplateComparisonDialog.vue:6` (`B3`), `:107-108`, `:116-132`
- **What to change:** Three edits. **(a)** `:121-124` — pass `{ requestKey: t1.id }` / `{ requestKey:
  t2.id }` as the third argument, the form `TemplateListView.vue:326` uses; the keyed API exists today.
  **(b)** `:120` — until `FW18` lands, either `await` the two `fetchById`s sequentially (one extra
  round trip inside a dialog that already shows a spinner) or take a second
  `useTaskPlannerDayTemplateTaskCrud()` instance for the right-hand side **with a comment naming the
  cause** in the `aborts its previous` wording `prompts/_common/api/A1` greps for, so that batch's
  Part 2 finds and retires it. After `FW18`: `fetchById(id, undefined, { requestKey: id })` and delete
  the workaround in the pointer-bump commit. **(c)** `:6` — `:hasConfirmBtn="false"`. Consider a
  `catch` that shows the interceptor's toast *and* keeps `sides` on the two-null default behind a
  `v-if="side.template"` guard, so a real failure reads as "nothing loaded" rather than as a template
  with no name and no tasks — the current empty-state markup is what made this look like data.
- **Do not change:** `useEntityQuery.ts` (that is `FW18`, a `vue_framework` commit); the
  `TemplatePlannerTaskFilter` window (`t.defaultWakeUpTime … defaultBedTime`) — the list view uses the
  same bounds.
- **Verification:** `X1`'s `Verify:` block — both panels show name, icon, chips and a populated
  timeline; **`playwright-cli requests` shows two `GET /task-planner-day-template/{id}` and two `POST
  /template-planner-task/filter`, none `ERR_ABORTED`** (a clean console proves nothing here —
  cancellations are not logged, `A1`'s *Traps*). Then `B3`'s: only *Cancel* renders. Open → Cancel →
  reopen with the *same* two ids, since the watcher refetches on every open.
- **Risk:** None beyond the dialog. If (b) takes the second-instance route, `A1`'s workaround table
  grows by one row until `FW18` retires it — say so in the commit.

## F51. The template planner's side panel at `<md` is the open panel, squeezed and off-screen — and nothing reopens it

- **Scope:** app-side `src/core/dayPlanner/component/PlannerSidePanelShell.vue`,
  `src/core/dayPlanner/view/TemplateDayPlannerView.vue`,
  `src/core/dayPlanner/component/template/TemplatePlannerHeader.vue`
- **Closes:** `planner-templates/X2` (+ corrects the inventory's `:162` "mobile panel-open toggle (the
  collapsed pill)" row — see *Contradictions* §86)
- **Root cause:** Two halves, and the finding describes the first through a misreading. **(1) Layout.**
  `PlannerSidePanelShell.vue:7` sets `width` as an inline style (`400px` from
  `TemplateDayPlannerView.vue:9`, `380px` by default) with `minWidth: '280px'` and no breakpoint
  override, while `TemplateDayPlannerView.vue:3` switches the container to `flex-column` below `md`
  and keeps `h-100`. So at 390 px the card is 400 px wide in a 390 px column — the page scrolls
  sideways, which is the `left: -166` and the second screenshot — and, as a column item with no
  `flex-shrink: 0` or minimum height beside a `flex-fill` grid, it is squeezed to its 16 px
  `VCardTitle` sliver. `panelOpen` starts `true` (`useRoutinePlacement.ts:28`), so **the "collapsed
  pill" the unit tapped *is* the open panel** — the two mobile screenshots show the same element
  before and after a horizontal scroll, not a closed and an opened state. **(2) No reopen.** The only
  writer of `panelOpen = true` in the template planner is its initial value: the shell's X sets it
  `false` (`:22`), `TemplatePlannerHeader.vue` has no toggle, and `v-show="panelOpen || mdAndUp"`
  (`:4`) then hides the panel until a reload. The day planner has the control the template planner
  lacks — `DayPlannerHeader.vue:7-14`, a `d-md-none` `bars` `VIconBtn` (itself unnamed; `F56`). The
  unit's *Expected* (*"the way it does on `DayPlannerSidePanel`'s default 380px"*) is unobserved: unit
  7 never resized, and `DayPlannerView.vue:3` has **no** `flex-column`, so at 390 px the day view is a
  380 px panel *beside* the grid — a different failure, not a working reference.
- **Files:** `PlannerSidePanelShell.vue:3-8` (width/height at `<md`), `:16-23` (close X);
  `TemplateDayPlannerView.vue:3,9`; `TemplatePlannerHeader.vue:3-8` (where the toggle goes);
  reference — `DayPlannerHeader.vue:7-14`, `DayPlannerView.vue:3`
- **What to change:** **(a)** In the shell, apply the caller's `width` only at `mdAndUp` (the composable
  is already there, `:85`) and go full-width below it — `width: '100%'`, drop the `minWidth` — and
  give the card `flex: 0 0 auto` (or a `min-height: fit-content`) so a column parent cannot squeeze it.
  Whether the mobile panel is an in-flow block above the grid or an overlay (`VNavigationDrawer
  temporary`, or a `VBottomSheet`) is a design choice; in-flow is the smaller change and matches the
  `flex-column` the view already opts into. **(b)** Add the reopen control to
  `TemplatePlannerHeader.vue` — the same `d-md-none` `bars` button `DayPlannerHeader.vue:7-14` renders,
  bound to the view's `panelOpen` (it is not in the header's props today; pass it as a model the way
  `DayPlannerHeader` takes `v-model:panelOpen`). Name it in the same edit — `F56` lists it. **(c)** Look
  at `DayPlannerView.vue:3` while there: it should probably take the same `flex-column flex-md-row`
  the template view has, but that is unit 7's screen and unobserved — verify before changing, and file
  what is seen rather than fixing blind.
- **Do not change:** the `mdAndUp` breakpoint (the shell's own comment says why it is not the caller's);
  `useRoutinePlacement.ts` — `panelOpen` living there is fine, it just needs a second writer.
- **Verification:** `X2`'s `Verify:` block at 390×844 on `/day-planner/templates/20001`: the panel's
  bounding box is ≤ viewport width, fully on-screen, tall enough to show *Template Name*; **plus:** tap
  X → panel gone, tap the new toggle → panel back, no reload; `window.scrollX` stays 0 throughout. Then
  the same three checks on `/day-planner/<today>` — the shell is shared, and that view's `bars` toggle
  already exists, so a fix that works only under `flex-column` shows up there.
- **Risk:** Medium — it is the chrome of both planners at every width below 960 px, and the day view's
  mobile layout has never been looked at. Screenshot both views at 390 and at 1024 (just above `md`)
  before and after.

## F52. Template card title row — the name never truncates, so the switch label and the chip pay for it

- **Scope:** app-side `src/core/dayPlanner/component/template/TemplateCard.vue`
- **Closes:** `planner-templates/B1`
- **Root cause:** Confirmed in source. `VCardTitle` (`:8`) is `d-flex justify-space-between
  align-center`; the left group (`:9-25`, checkbox + icon + `<span>{{ template.name }}</span>`) has no
  `min-width: 0` and no `text-truncate`, so it keeps its intrinsic width, and the right group
  (`:26-51`, `DayTypeChip` + `VSwitch` with an inline `label` + pin `VIconBtn`) absorbs the shortfall:
  the switch's label box collapses to ~20 px with `white-space: normal` (one letter per line) and the
  chip clips with `text-overflow: clip`. Vuetify's `VCardTitle` sets `white-space: nowrap` and
  `overflow: hidden` on itself, which is why the row clips rather than wraps. Three cards, three
  column widths — the unit measured it on all three.
- **Files:** `TemplateCard.vue:8-51`
- **What to change:** Make the *name* the flexible part: `min-width: 0` + `text-truncate` on the name
  span (with `:title="template.name"` so the full name is recoverable), and `flex-shrink-0` on the
  right-hand group so its three controls keep their intrinsic width. Then decide whether the switch
  needs a visible label at all — the row is already the busiest in the card, and `F56` is about to
  give the pin a name; a switch named by `aria-label` with the state shown by its own thumb is the
  usual Vuetify shape. If the label stays, `white-space: nowrap` on it as well. Do **not** solve it by
  fixing the card grid's column width — the chip count and the name length are both data-driven.
- **Do not change:** `DayTypeChip` — it is shared with the comparison dialog and the day view; the clip
  is the row's fault, not the chip's.
- **Verification:** `B1`'s `Verify:` block at 1440×900 — *Active*/*Inactive* on one line, *Weekend* and
  *Workday* whole (or an ellipsis + tooltip). Add a template with a 40-character name through *Add
  Template* (`F53` makes that path safe) and confirm the *name* is what truncates.
- **Risk:** None — one row's CSS.

## F53. The template form mirrors none of the API's contract — a required enum is optional, and nothing else is checked either

- **Scope:** app-side `src/core/dayPlanner/dto/request/template/TaskPlannerDayTemplateRequest.ts`,
  `src/core/dayPlanner/component/template/TaskPlannerDayTemplateDetailsForm.vue`
- **Closes:** `planner-templates/B2`
- **Root cause:** Confirmed on both sides. The client DTO declares `suggestedForDayType?: DayType`
  (`TaskPlannerDayTemplateRequest.ts:14`) with no default, so a blank *Add Template* serialises without
  the key; the server's `TaskPlannerDayTemplateRequest.cs:29` is `public required DayType
  SuggestedForDayType`, and `System.Text.Json` rejects the body before validation runs — the
  `serializerErrors` 400 the unit quoted, surfaced by the interceptor as the server's generic title.
  **Wider than the finding:** the form (`TaskPlannerDayTemplateDetailsForm.vue:6-79`) declares no
  `:rules` on any field, so `validateAndGetData()`'s `form.validate()` (`:143`) is always `true`;
  `Name` is `[Required][StringLength(100)]`, `Description` `[StringLength(500)]`, `Icon`
  `[StringLength(50)]` on the server (`:11-19`), and an empty name or a 101-character one takes the
  same route — dialog closed, input gone, generic snackbar. *Duplicate* and *Edit* hide all of it
  because `fromEntity` copies a valid enum in. **Not a backend ask:** the column is non-nullable and
  indexed (`Initial.Designer.cs:1669,1701`), `/suggestions` matches on it, and every server-side
  fixture sets it — the field is required by design, and the client is the side that disagrees.
- **Files:** `TaskPlannerDayTemplateRequest.ts:14` (and `:8-19` generally),
  `TaskPlannerDayTemplateDetailsForm.vue:6-11` (name), `:30-36` (description), `:38-43` (day type),
  `:67-72` (icon)
- **What to change:** **(a)** `suggestedForDayType: DayType = DayType.Workday` (or whichever the owner
  wants as the blank-form default — the seed's three templates are two `Workday`, one `Weekend`), so
  the type stops lying and a blank form is a valid body. **(b)** Rules that mirror the contract:
  required + `maxLength(100)` on the name, `maxLength(500)` on the description, `maxLength(50)` on the
  icon, required on the day-type select — through `RulesComposition.ts` so the messages are the
  app's, not hand-written. `hideDetails` on every field means the messages need somewhere to render;
  drop it on the fields that gain a rule, or use `hideDetails="auto"`. **(c)** Optional but worth the
  look: the dialog closes on `dialogApi.close({ request })` (`TemplateDetailsForm.vue:32`) and the
  caller then calls the API (`TemplateListView.vue:337-352,371-402`), so *any* server rejection —
  a future 409 on a duplicate name, say — still costs the user their input. Moving `create`/`update`
  inside the dialog's `onConfirm` under `dialogApi.setLoading()` keeps the dialog open on failure.
  Check how the app's other `openDialog` consumers do it before diverging; if they all close-then-call,
  this is a pattern decision, not this batch's.
- **Do not change:** the server DTO; the `Time` defaults (`07:00`/`23:00`) — those already work.
- **Verification:** `B2`'s `Verify:` block — *Add Template*, name only, *Create*: **either** the select
  blocks with a required message and the dialog stays open, **or** the template is created with the
  default and the app lands on `/day-planner/templates/<newId>`; no 400, no *"One or more errors
  occurred!"*. Then an empty name → blocked in the dialog, not a 400. Confirm the list count went
  from 3 to 4 and reseed.
- **Risk:** Low. A default day type means a user who ignores the field gets `Workday` silently — the
  select shows it, and that is the trade the unit's own *Expected* offers.

## F54. Template list sort and the split view's picks are not in the URL — the `F42` shape, two more views

- **Scope:** app-side `src/core/dayPlanner/view/TemplateListView.vue`,
  `src/core/dayPlanner/view/TemplateSplitView.vue`
- **Closes:** `planner-templates/B4`
- **Root cause:** Confirmed. `TemplateListView.vue:228` `const sortBy = ref<SortOption>('mostUsed')`
  and `TemplateSplitView.vue:103-104` `leftTemplateId`/`rightTemplateId` are plain refs; nothing
  reads or writes `route.query`. CLAUDE.md's *URL State* rule names sort and selection outright, and
  the module already holds the codec (`useCalendarUrlState.ts` — absent-when-default,
  `router.replace`), which `F42` is about to reuse for `/day-planner/settings`. The split view's case
  is the sharper one: it is reachable only from a button (`TemplateListView.vue:47`), and a reload
  after picking both sides returns two empty selects — the unit observed it.
- **Files:** `TemplateListView.vue:228-232` (+ the `VSelect` that binds it);
  `TemplateSplitView.vue:103-104,114-…` (`onMounted` loads the options; the two ids should be read
  from the query after that and validated against them)
- **What to change:** Copy `F42`'s shape once it has settled (query vs. route param — `F42` recommends
  a `?` query, absent for the default): `?sort=alphabetical` on the list (absent for `mostUsed`),
  `?left=20001&right=20002` on the split view, written with `router.replace` from a watcher and read
  once on setup. Validate: an unknown sort value falls back to `mostUsed`; an id not in
  `templateOptions` (or equal to the other side) is dropped, not sent to the grid — the split view
  mounts `TemplateDayPlannerView` per side and a bogus id would otherwise reach `F55`'s 404 path
  twice. Prefer one small composable in `dayPlanner/composable/` shared by the three views over three
  inline watchers.
- **Do not change:** the sort *options* or the pinned/active/inactive sectioning — only where the
  choice lives.
- **Verification:** `B4`'s `Verify:` block — the two repros, then reload, then open the URL fresh in a
  new session (`playwright-cli open <url>` after `state-load`). Add: `?sort=zzz` → *Most used*, clean
  console; `?left=999999` → the select stays empty, no `GET …/999999`.
- **Risk:** None. Query-only, so `_routes.md` and `F14`'s nav matching are untouched.

## F55. An unknown template id keeps the previous template's name — the `F43` shape on the template side, plus a persisted store

- **Scope:** app-side `src/core/dayPlanner/component/template/TemplatePlannerPanel.vue`,
  `src/core/dayPlanner/store/templateDayPlannerStore.ts`; `src/core/dayPlanner/view/TemplateDayPlannerView.vue`
  for the not-found state
- **Closes:** `planner-templates/B5`
- **Root cause:** Confirmed. `TemplatePlannerPanel.vue:47-56` `loadTemplateDetails()` is `const
  template = await fetchById(templateId)` followed by the four store writes, with no `catch`, and it is
  called from `onMounted` (`:40-42`) and from the `templateId` watcher (`:66-71`) — the same
  two-call-site shape as `F43`'s `DayPlannerView.vue:211` + `useDayNavigation.ts:71-84`. On a 404 the
  interceptor toasts, the promise rejects at the hook boundary (Vue's *"Unhandled error during
  execution of mounted hook"*), and the store's `currentTemplateId`/`templateName` keep whatever they
  held. **The twist the finding half-saw:** `useTemplateDayPlannerStore` persists both fields to
  `sessionStorage` (`templateDayPlannerStore.ts:80`, `persist: { omit: ['tasks'], storage:
  sessionStorage }`), so the stale name also survives a reload of the bad URL and a fresh tab opened
  from it — the header reads *Home Office* for `999999` until the session ends. The `if (!template)
  throw Error(…)` on `:50` is dead: `fetchById` rejects on a 404, it never resolves `undefined`.
- **Files:** `TemplatePlannerPanel.vue:40-42,47-56,66-71`; `templateDayPlannerStore.ts:58-62`
  (`resetStore` — already clears both fields, unused on this path); `TemplateDayPlannerView.vue:30`
  (the header's fallback is `planner.template.dayTemplateFallback`, which never renders today because
  the stale name wins)
- **What to change:** Wrap the fetch in `try/catch` at `loadTemplateDetails` (not `_silent` — the
  interceptor's toast is the right first signal, as `F43` says); on failure call `store.resetStore()`
  so the name, id and tasks clear together, and render a not-found state in the header slot — an
  inline `VAlert` naming the id with a *Back to templates* action, the same shape `F43`(b) asks for
  on the date view and `PlannerTaskLinkView` already has for a missing task. Agree the treatment with
  `F43` rather than inventing a second one. Delete the dead `throw` on `:50`. In the split view the
  panel gets its id from a select, so the path is unreachable there — but the same component is
  mounted, so nothing in the fix may assume the route.
- **Do not change:** the store's persistence — per-tab planner state is deliberate (its own comment);
  `F54` is what stops a bogus id reaching this path from the split view's URL.
- **Verification:** `B5`'s `Verify:` block, then **reload** `/day-planner/templates/999999` and open it
  in a second tab — header must not read a real template's name either time;
  `playwright-cli sessionstorage-list` shows `templateName: ""`. Console shows the interceptor's line
  and no Vue unhandled-hook error. Then `/day-planner/templates/20001` → *Home Office* again.
- **Risk:** Low — a `catch` and a state the view never had.

## F56. Seven icon-only controls in `dayPlanner` have no accessible name — and the compare checkbox is under the card's icon

- **Scope:** app-side `src/core/dayPlanner/` — five files
- **Closes:** `planner-templates/A1`, `A2`, `A3` (re-identified, §86), `U3` (settled from source);
  three unfiled twins found reading the same files
- **Root cause:** Confirmed per control, from source (the unit `eval`'d two of them, the rest are the
  same markup):

  | # | control | file | observed? |
  | --- | --- | --- | --- |
  | 1 | card pin — `VIconBtn icon="thumbtack"`, no label | `TemplateCard.vue:43-50` | yes (`A1`) |
  | 2 | compare checkbox — `VCheckbox`, no `label`/`aria-label`; **and** its hit-box sits under the template `VIcon` beside it | `TemplateCard.vue:10-23` | yes (`A2`, Playwright's intercept log) |
  | 3 | side panel close — `VIconBtn icon="xmark"`, `d-md-none` | `PlannerSidePanelShell.vue:16-23` | the unit's `nth(4)` is this or #5 — the "open toggle" it named does not exist (§86) |
  | 4 | split view back — `VBtn icon="arrow-left"`, no text | `TemplateSplitView.vue:5-11` | source only (`U3`) — a `VBtn` with only `icon` has no name; nothing to observe |
  | 5 | template planner undo — `VBtn` wrapping a `VIcon` + `VBadge :content="stackSize"` inside a `VTooltip` | `TemplatePlannerHeader.vue:35-60` | unfiled — the tooltip sets `aria-describedby`, not a name; with a non-empty stack the badge's number *is* the name |
  | 6 | day planner undo — identical markup | `DayPlannerHeader.vue:64-85` | unfiled, unit 7's screen |
  | 7 | day planner mobile panel toggle — `VIconBtn icon="bars"`, `d-md-none` | `DayPlannerHeader.vue:7-14` | unfiled — unit 7 never resized; `F51` adds its template-side twin |

  App-side throughout — none of these is a framework component's own markup, so this does not touch
  `FW2` (rule 1). The same class as `F4`, `F19`'s trash button and `F46`: this module's turn.
- **Files:** the seven rows above; `src/core/dayPlanner/_locales/dayPlanner.{sk,en}.ts` for the keys
- **What to change:** A bound, localized `aria-label` on each: pin → *Pin template* / *Unpin template*
  by `isPinned`; checkbox → *Select {name} for comparison* (`:label` would also fix #2's second half by
  giving the control a real box — or keep it label-less and give the `VCheckbox` `me-1` +
  `flex-shrink-0` so the icon stops overlapping its input; either way `A2`'s pass condition is a
  *direct* click landing); close → *Close panel*; back → *Back to templates*; undo → *Undo* with the
  count folded in (*Undo (2)*) so the badge stops being the name; `bars` → *Open panel* / *Close
  panel* by `panelOpen`. Share keys between #5/#6 and #3/#7/`F51`'s new toggle — one string each.
- **Do not change:** the `VTooltip` on the undo buttons (it stays as the description); `FW2`'s files.
- **Verification:** `A1`/`A2`/`A3`'s `Verify:` blocks — each control addressable by
  `getByRole('button', { name })` (checkbox: `getByRole('checkbox', { name })`), and `A2`'s direct
  click succeeds with no intercept in Playwright's log. #7 and #3 need 390 px; #6 needs
  `/day-planner/<today>`. Confirm the names change with the locale.
- **Risk:** None — attributes only. The draft spec's positional locators (`nth(3)`, `nth(4)`) will
  keep working and should be replaced by the names in the same commit.

## F57. The Scheduled Days picker is clipped to Mon–Fri in the 400 px template panel

- **Scope:** app-side `src/core/dayPlanner/component/template/TaskPlannerDayTemplateDetailsForm.vue`
- **Closes:** `planner-templates/P1`
- **Root cause:** Confirmed. `:77` renders the framework's `DayOfWeekPicker` — a `VBtnToggle` of
  seven `size="small"` buttons with `divided`, `display: inline-flex`, no wrap — inside a `div` in a
  `flex-column` group (`:63-66`, the non-dialog branch of `:65`). Seven small buttons plus dividers need more
  than the ~360 px the panel leaves after padding, and `VCard`'s `overflow: hidden` clips the rest.
  In the dialog (`isDialog`, `flex-md-row`) the same picker has the dialog's width and is fine — the
  400 px panel is the only place it renders narrow.
- **Files:** `TaskPlannerDayTemplateDetailsForm.vue:73-78` (the label + picker block); reference —
  `src/_common/component/inputs/DayOfWeekPicker.vue` (single root, so a class on the tag lands on the
  `VBtnToggle`)
- **What to change:** App-side, one class: `class="flex-wrap"` on the `<DayOfWeekPicker>` tag lets the
  toggle break onto a second row at this width (`divided`'s inner borders look odd across a wrap —
  drop `divided` via the picker if it becomes a prop, or accept it). Alternatively `density="compact"`
  / `size="x-small"` if the picker grows those props — but that is a `vue_framework` change for a
  400 px panel this app chose, and `F6`'s reasoning applies: the smaller, app-side edit first. If the
  owner would rather widen the panel, `F51` is the batch that touches the shell's width and this
  should ride with it.
- **Do not change:** `DayOfWeekPicker.vue` (framework) in this batch; the dialog branch.
- **Verification:** `P1`'s `Verify:` block on `/day-planner/templates/20001` — all seven day buttons
  visible and togglable; then *Edit Details* from the list to confirm the dialog's row is unchanged.
- **Risk:** None.

---

## F58. The EN `$vuetify` block is a hand copy of Vuetify's `en` export, minus two keys

- **Scope:** app-side `src/locales/common.en.ts:43-223`
- **Closes:** `home/A1` (+ the unfiled sibling key `command.search`)
- **Root cause:** `common.en.ts` carries a 180-line `$vuetify: { … }` object. Diffed this pass against
  `import { en } from 'vuetify/locale'` (the installed package, flattened): **124 keys upstream, 122 in
  the copy, zero differing values, zero extra keys** — it is byte-identical except for
  `timePicker.notAllowed` and `command.search`, which were added upstream after the copy was taken.
  `createAppVuetify.ts:78` routes Vuetify's own lookups through vue-i18n (`createVueI18nAdapter`), so a
  key the copy lacks is a console `[intlify] Not found '$vuetify.timePicker.notAllowed'` and a
  screen-reader announcement that never happens — exactly what the mutation pass saw typing a letter
  into `TrackTimeDialog`'s masked *Length* field. The SK side (`src/_common/_locales/vuetifyLocale.sk.ts`)
  is complete against `sk`; only EN drifted, because only EN is app-side.
- **Files:** `src/locales/common.en.ts` (the `$vuetify` key); `src/locales/EN.ts` only if the import
  is placed there instead
- **What to change:** Replace the object with `$vuetify: en` (or `{ ...en }` if any app override is ever
  wanted — none exists today). A locale that cannot drift is the fix; adding the two keys by hand is
  the same bug deferred to the next Vuetify bump. Consider the same for SK in the framework
  (`vuetifyLocale.sk.ts` → `import { sk } from 'vuetify/locale'`) — but that is a `vue_framework`
  change and **not this batch**; it is complete today, so nothing is broken there.
- **Do not change:** `httpErrors`, `validation`, `export` in the same file — those mirror the
  *framework's* Slovak `common`, not Vuetify, and are `F35`'s subject.
- **Verification:** `home/A1`'s `Verify:` block — the Track Time dialog, a letter into *Length*, no
  `[intlify]` warning. Then one `DataTable` footer and one `VDatePicker` in EN to confirm nothing else
  changed (nothing should — the values are identical).
- **Risk:** None beyond the import resolving — `vuetify/locale` is already imported by
  `createAppVuetify.ts`'s adapter path, so the package entry exists.

## F59. A skipped task renders as done — `isFinished` is the wrong predicate for the row's visual and ARIA state

- **Scope:** app-side `src/core/home/component/DayPlannerWidget.vue`, `src/core/home/composable/useTodayPlan.ts`
- **Closes:** `home/B4`
- **Root cause (source-verified):** `isFinished(task)` (`useTodayPlan.ts:125-127`) is
  `Completed || Cancelled` — correct for "no countdown, no alert", which is what it was written for.
  `DayPlannerWidget.vue` reuses it for three things it does not mean: the row class
  (`'row--done': isFinished(task)`, `:172`), the checkbox fill (`'check--on'`, `:182`) and
  `aria-pressed` (`:184`) — while the label stays `home.markDone` (`:183`). So a `Cancelled` row is
  indistinguishable from a `Completed` one, its `skipReason` (which the PATCH did send —
  `useTodayPlan.ts:302-308`) renders nowhere, and the checkbox's accessible state claims *done*. Worse,
  `toggleTaskStatus` (`:268-273`) tests `status === Completed` only, so clicking the checkbox on a
  cancelled row sends it to **`Completed`**, not back to `NotStarted` — the finding's *Verify* step 3.
- **Files:** `DayPlannerWidget.vue:172,182-185` (+ its `.row--done`/`.check--on` styles `:377-381`,
  `:458`); `useTodayPlan.ts:268-273` (`toggleTaskStatus`)
- **What to change:** Branch the row on `task.status` rather than `isFinished`: `Completed` keeps the
  check; `Cancelled` gets its own muted/struck treatment plus a small *Skipped* chip carrying
  `skipReason` (the `home.skipReason.*` keys already exist — `useTodayPlan.ts:32`), `aria-pressed="false"`
  and a label that says what the click will do. Decide what that click *does* — restoring `NotStarted`
  is the sensible reading of "un-skip" — and encode it in `toggleTaskStatus` (or hide the checkbox on a
  cancelled row and put the restore in `TaskActionMenu`, which already owns Skip). Whichever, the label
  and the action must agree.
- **Do not change:** `isFinished` itself or its other consumers (`isActive`, the alert scheduler) — it is
  right where it is used for timing.
- **Verification:** `home/B4`'s `Verify:` block — skip via `TaskActionMenu`, read the row's class and
  the checkbox's `aria-pressed`/name, then click it and read the `PATCH …/status` body. NowBar's own
  rendering of a cancelled focus task is worth one look in the same session; `focusMode` derives from
  `isActive`, so it should already be right.
- **Risk:** Low. One widget, one composable function; the SK copy for the chip needs the locale.

## F60. `MemoryAnchorFilter` sends `year`/`month`; the server reads `anchorYear`/`anchorMonth`

- **Scope:** app-side `src/core/leisure/dto/request/MemoryAnchorFilter.ts`,
  `src/core/leisure/view/MemoryAnchorsView.vue:38,46`, `src/core/leisure/composable/leisureFilterUrlState.ts:112-121`
  + `leisureFilterUrlState.test.ts`, `MemoryAnchorsView.vue:131-140` (`loadTimeline` strips the two by name)
- **Closes:** the `year` and `month` cases of `leisure-bucket-anchors/B1`. The `minRating` case and
  everything on `/leisure/bucket-list` are **§13** — the server has no field to read.
- **Root cause:** The server's `MemoryAnchorFilterRequest` declares `AnchorMonth`, `AnchorYear`,
  `ActivityId` and `GridMemoryAnchorEndpoint.ApplyCustomFiltering` (`:87-97`) filters on all three. The
  client's filter class names the first two `year` and `month`; System.Text.Json drops the unknown
  members and the request is answered unfiltered with a 200. The client's **create** request already
  uses `anchorYear`/`anchorMonth` (the `B2` evidence body), the response DTO does, and the `periodKey`
  sort expands to them — the filter is the client's own odd one out, which is why this pair is an app
  batch and not part of the escalation.
- **What to change:** Rename the two constructor fields (and `hasAny()`), the two `draft.*` bindings,
  and the encode/decode lines. **Keep the URL keys `year` and `month`** — `leisureFilterUrlState.ts:112-113`
  maps them explicitly, so bookmarks survive. Update the test's expectations at `:147`. `loadTimeline`'s
  `Object.assign(…, { year: null, month: null })` must follow the rename or it will stop stripping them.
- **Do not change:** `activityName` or `minRating` — neither exists server-side; renaming them
  changes nothing and pre-empts §13's decision.
- **Verification:** `B1`'s `Verify:` block, cases `?year=2025` (zero rows) and `?month=1` (zero rows)
  only; the `minRating` case stays failing until §13. Then the Timeline toggle with a year filter set,
  to confirm it still draws all twelve months.
- **Risk:** None.

## F61. Ladder and Timeline ask for 500 rows against a cap of 200 — and a failure renders as "empty"

- **Scope:** app-side `src/core/leisure/view/BucketListView.vue:142,149-160`,
  `src/core/leisure/view/MemoryAnchorsView.vue:120,131-145`
- **Closes:** `leisure-bucket-anchors/X1`, `X2`
- **Root cause:** `BaseGridEndpoint.MaxItemsPerPage` is **200** and the base answers a 400 naming the
  field above it (`BaseGridEndpoint.cs:31,104-106`). `LADDER_PAGE_SIZE = 500` and
  `TIMELINE_PAGE_SIZE = 500` therefore fail on every load, and both loaders are `try … finally` with no
  `catch`: the rejection propagates to the console, `ladderItems`/`timelineItems` keep their initial
  `[]`, and the view's empty-state copy renders — *"You don't have any here yet"* over a table that
  showed rows a second earlier. `ProjectsView.vue:118-122` fixed the identical constant to 200 with a
  comment that names this exact failure; the grep this pass (`PAGE_SIZE =` under `src/core`) finds no
  third 500 — `useLeisurePicker.ts:48` is already 200.
- **What to change:** Both constants to 200, with `ProjectsView`'s comment. Then the half `ProjectsView`
  did not do: a `catch` that sets an error flag, and an error branch in each view distinct from the
  empty state — the README's *Class 1* note (*"give the table component an error state distinct from its
  empty state"*) is the same ask, and `F27` is the pattern (`useActivityDashboard`'s error/retry). A
  user with more than 200 bucket-list rows or anchors would then see a truncated ladder/timeline rather
  than a 400 — say so in a comment; paging the ladder is not this batch.
- **Do not change:** `ProjectsView.vue`; the server cap (it is documented and deliberate).
- **Verification:** `X1`'s and `X2`'s `Verify:` blocks — no 400, the seeded row on rung 3, July and
  August 2026 shaded. Then `playwright-cli route "**/api/activity-bucket-list-profile/grid" --status=500`
  and toggle to Ladder: the error branch, not the empty copy.
- **Risk:** Low. Two constants and two small template branches.

## F62. `NewMemoryAnchorForm`'s mount fetch has no `try/finally` — any failure is a permanent spinner

- **Scope:** app-side `src/core/leisure/component/memoryAnchor/NewMemoryAnchorForm.vue:105-112`
- **Closes:** the frontend half of `leisure-bucket-anchors/X3`. The endpoint itself is **§12** — it
  does not exist.
- **Root cause:** `onMounted` awaits `fetchAnchorEligibleActivities()` and only then sets
  `loading.value = false` (`:110-111`). A rejection skips the second line: the Activity picker keeps its
  spinner and its literal `0` (`F63`), and the designed fallback (`leisure.errors.noEligibleActivities`,
  gated on `!loading && length === 0`) can never render. Today every call rejects, because the route the
  client calls is not declared anywhere in the API — the 400 body (*"Value [anchor-eligible-activities]
  is not valid for a [Int64] property"*) is the `/{id}` route swallowing the path, not an ordering bug.
- **What to change:** `try { … } catch { failed.value = true } finally { loading.value = false }`.
  Render a **distinct** error alert on `failed` — do not fall through to *"no eligible activities"*,
  which would tell every user today that they have nothing to anchor when the truth is that the
  server could not be asked. Keep the Backlog/Bucket-list links in both alerts.
- **Do not change:** `memoryAnchorApi.ts:31-34` — the path is the contract §12 asks the server to honour.
- **Verification:** `X3`'s `Verify:` block cannot pass until §12 lands; until then the check is the
  negative: open *Add* on `/leisure/memory-anchors`, and within a second the spinner is gone and the
  error alert is on screen. After §12: the picker lists real options.
- **Risk:** None.

## F63. Four leisure request DTOs default their lookup ids to `0` — the pickers show "0", the required rule passes, and the server is asked to create with `activityId: 0`

- **Scope:** app-side `src/core/leisure/dto/request/{ActivityBacklogProfileRequest,ActivityBucketListProfileRequest,MemoryAnchorRequest,ActivityProjectProfileRequest}.ts`
  + the four `New*Form.vue` components that bind them
- **Closes:** `leisure-backlog-picker/X3` (the `0`-default half; the "no snackbar" half is under *Needs
  verification* — §91), `leisure-bucket-anchors/B2` (+ the unfiled fourth DTO,
  `ActivityProjectProfileRequest.ts:7`, found by grep: `public \w+Id: number = 0` hits eight fields in
  four files, all in this module — `MergeActivitiesRequest.survivorId` is the only other and is set
  before use)
- **Root cause:** `ActivityBacklogProfileRequest.ts:6-13` defaults `activityId`, `locationTypeId`,
  `weatherDependencyId`, `expectedCostTierId` to `0`; `ActivityBucketListProfileRequest.ts:3-4`
  `activityId`, `experienceTypeId`; `MemoryAnchorRequest.ts:15` and `ActivityProjectProfileRequest.ts:7`
  `activityId`. Vuetify's select/autocomplete cannot resolve `0` against any option, so it renders the
  raw value as text — both units photographed the literal **"0"**. `requiredRule`
  (`RulesComposition.ts:22-26`) rejects `null`/`undefined`/`''`/`[]` and nothing else, so `0` validates,
  the form submits, and the server answers 400 `"Activity not found."` — for backlog, with the dialog
  still open and nothing visibly changed. The same module already does this right for
  `financialGoal: number | null = null`.
- **What to change:** Type the eight fields `number | null` with default `null`, in constructor and
  `fromJson`. The forms' `v-model`s then carry `null` until a pick is made; `requiredRule` blocks the
  submit with `validation.required`; `hasObjectChanged`-style dirty checks, if any, see a real change.
  Check every place that reads these fields as `number` (`BacklogProfileForm.vue:24-37` passes the edit
  entity's ids — fine; `useAnchorCapture`'s `lockActivity` path sets a real id — fine) and run
  `npm run type-check`.
- **Do not change:** `requiredRule` — `0` is a legitimate value for a count field elsewhere; the rule is
  right, the defaults are wrong.
- **Verification:** `X3`'s `Verify:` step 3 and `B2`'s `Verify:` — a fresh *Add* dialog shows
  placeholders, not "0"; *Create* with nothing selected fires **no request** and shows the required
  message. Do the projects form too.
- **Risk:** Low-medium — eight fields, four forms, one type-check.

## F64. The picker treats an empty weather match set as "nothing fits" — the server's contract says it means "no opinion"

- **Scope:** app-side `src/core/leisure/composable/useLeisurePicker.ts:250`,
  `src/core/leisure/api/leisureWeatherApi.ts:3-9` (comment)
- **Closes:** `leisure-backlog-picker/X2`, `P2`
- **Root cause:** `GET /leisure-weather-fit` answers `200 { matchingWeatherDependencyIds: [] }` for an
  account with no weather location — and its endpoint's own doc comment (`GetLeisureWeatherFitEndpoint.cs`)
  spells out the client's obligation: *"The client reads an empty set and a failed call identically
  ('no weather opinion'): nothing ranks up, no badge renders, nothing is excluded."* `useWeatherFit.ts`
  says the same in its header. `useLeisurePicker.ts:250` then does
  `weatherMatchIds: weatherFit.value?.matchingWeatherDependencyIds ?? null` — `[]` is not nullish, so
  `isEligible`'s backlog branch (`leisureScoring.ts:246-253`) sees a non-null list that contains no id and
  excludes **every** backlog entry with any `weatherDependencyId`, including the seed's one row whose
  dependency is the *"None"* lookup. `/leisure/pick`'s default landing state shows no backlog card at
  any time budget. `leisureWeatherApi.ts:3-9` meanwhile still says the endpoint is *"Not implemented
  server-side yet… Every call fails today"* — `P2`.
- **What to change:** Collapse the empty set to `null` **once**, at the boundary — in `fetchTodayFit`
  (return `null` when the array is empty) or in `WeatherFit.fromJson` — so every consumer, not just the
  picker, gets the contract (`fitsToday` already returns `false` for `null`, so the badge is unchanged).
  Rewrite the `leisureWeatherApi.ts` comment to describe the live endpoint and the empty-means-no-opinion
  rule.
- **Do not change:** `isEligible` — with a non-empty list it is correct, and a real mismatch must still
  exclude (`X2`'s *Verify* step 4).
- **Verification:** `X2`'s `Verify:` block — the seeded *Read a Novel* (45 min, 1 person) appears at
  ≥ 60 min / *Just me*; then `playwright-cli route "**/api/leisure-weather-fit"` fulfilled with an id
  that is *not* the row's dependency, and confirm it is excluded.
- **Risk:** None beyond deciding where the collapse lives; put it at the boundary so `O1`'s later
  `maxParticipants` work does not have to remember it.

## F65. Leisure's icon-only controls carry a localized `:title` and no `aria-label`

- **Scope:** app-side `src/core/leisure/view/{BucketListView,MemoryAnchorsView,ProjectsView}.vue:14,20`
  (view-mode toggles), `component/memoryAnchor/MemoryAnchorTimeline.vue:32,42,67` (previous / choose /
  next year), `MemoryAnchorTable.vue:40,50` and `ExperiencedCell.vue:10` (source/anchor chips),
  `BucketListLadder.vue:128` and `ProjectReadinessBoard.vue:80,96` (delete, messy)
- **Closes:** `leisure-bucket-anchors/A1` (app half) — **re-graded `a11y` → `polish`** (§98): a
  `title` *is* an accessible name, just the weakest one, and the finding's expectation is this app's
  own convention rather than a failure. The `title="edit"` half of the same finding is `FW5`.
- **What to change:** `:aria-label` beside each `:title`, same key. Do not drop `:title` — it is the
  sighted user's tooltip.
- **Verification:** `A1`'s `Verify:` block on the toggles and the timeline buttons — `aria-label`
  non-null and localized.
- **Risk:** None.

## F66. `boolChip` reuses the true icon for the false state on four of five chips

- **Scope:** app-side `src/core/leisure/composable/useLeisureFilterChips.ts:19`;
  `BacklogView.vue:192`, `BucketListView.vue:218-219`, `ProjectsView.vue:163`
- **Closes:** `leisure-bucket-anchors/P1`
- **Root cause:** `boolChip(labelKey, trueIcon, falseIcon = trueIcon)` — the default was presumably a
  convenience, and every call site but `isRepeatable` (`rotate`/`star`) took it. The label already
  flips `✓`/`✗`; the icon does not.
- **What to change:** Either pass a false icon at the four sites (`circle-xmark` for *experienced*,
  a slashed variant for *travel*/*messy*), or drop the default and make the parameter required so the
  next chip cannot forget. The second is the fix; the first is the patch.
- **Verification:** `P1`'s `Verify:` block on `/leisure/bucket-list`, then the same chip on
  `/leisure/backlog` and `/leisure/projects`.
- **Risk:** None.

## F67. A session that rounds to zero minutes is handled three ways by three views — and none of them tells the user

- **Scope:** app-side `src/core/activityHistory/component/PomodoroTimerView.vue:255-281`,
  `src/core/activityHistory/view/TimerView.vue:204-224`, `src/core/activityHistory/view/StopWatchView.vue:172-201`,
  `src/core/activityHistory/_locales/activityHistory.{sk,en}.ts`
- **Closes:** `history-capture/B4`, `history-capture/B5`, and the **unfiled stopwatch twin** (below)
- **Root cause — confirmed in source, and it is one gap seen from three sides.** Every capture view ends
  in a `finishSession()` that turns elapsed time into a `Time` (whole minutes) and hands it to
  `SaveActivityBody`, and each one answers "what if that is zero?" differently:
  | view | how it rounds | under a minute |
  | --- | --- | --- |
  | Timer (`:216-219`) | `initialTime − remaining.toTimeLength` — `TimePrecise.toTimeLength` rounds seconds to the nearest minute, so a 10-minute timer stopped at 0:15 is `10 − 10 = 0`, at 0:45 it is `1` | `if (length.getInMinutes <= 0) { store.clearSession(); return }` — **discarded, nothing shown** (`B5`) |
  | Pomodoro (`:260`) | `Time.fromSeconds(floor(ms/1000))` — **floors**, so anything under 60 s is `0` | **no guard** → `SaveActivityBody` renders `activities.confirmSaveActivity` with `timeSpent.getNice`, which is `"" + ' ' + ""` for `{0,0}` (`Time.ts:40-42`) → *"done for ?"*; Confirm → `POST /api/activity-history` `{"length":{"hours":0,"minutes":0}}` → **201** (`B4`) |
  | Stopwatch (`:177`) | `TimePrecise.fromSeconds(...).toTimeLength` — rounds, so 0–29 s is `0`, 30–59 s is `1` | **no guard** — under 30 s it is `B4` exactly, one view over; source-certain, the unit did not stop a stopwatch that fast |
  The manual form, for contrast, refuses `!timeLength.isNotZero()` before it asks the server
  (`AddActivityManuallyForm.vue:70`). So the account can already hold zero-length rows from two of the
  four capture flows, and the server will take them: `ActivityHistoryValidator` is `Length.TotalSeconds
  >= 0`, not `> 0` (§15). The unit's own root-cause line is right — *"nobody wrote down what should
  happen when a session ends before it produces a whole minute"* — and that is why this is one batch and
  not two: fixing Pomodoro to match Timer ships a silent discard to a second view, and fixing Timer to
  match Pomodoro ships the malformed prompt to a second view.
- **Files:** the three `finishSession()`s above; `SaveActivityBody.vue:3` only if the seconds option is
  taken; `src/_common/dto/dto/Time.ts:40-42` is **not** in scope (below)
- **What to change:** Decide once, then apply the same branch in all three views **before**
  `openDialog(SaveActivityBody)`. Two honest options: **(a) discard with a message** — when the rounded
  length is zero, `store.clearSession()` and `showSnackbar(t('history.sessionTooShortToLog'))` (new key,
  both locales, worded as information rather than an error — the timer's *"please set a duration"* is not
  it); **(b) keep the seconds** — build the length with `Math.ceil` of the seconds instead of a floor or a
  round, so the shortest recordable session is one minute, and let the dialog show it. (a) matches
  `runningTimerStore.ts`'s own rule 2 (*"never fabricate time the user did not spend"*), which (b) mildly
  breaks for a 5-second session; (a) is the recommendation. Either way the three views must agree, and
  the rounding helpers (`toTimeLength` vs `Time.fromSeconds`) should be unified in the same commit so the
  30-second cliff is the same on every view. Keep the manual form's own guard as it is — it is the
  fourth view already doing (a) without the message.
- **Do not change:** `Time.getNice` in `src/_common` — hardening it to say *"0m"* would make the prompt
  *read* sensibly while the view still writes a zero row, i.e. it fixes the symptom the finding
  photographed and not the one it filed. It is a framework line with eleven consumers (grep `.getNice`),
  and a fix here should make it unreachable with a zero rather than teach it to render one. If it is
  hardened anyway, that is a separate `vue_framework` commit, not this batch. Not `TimerView`'s
  `activityId` embedded path (`:220-224`) — an embedder gets the numbers and decides for itself.
- **Verification:** `B4`'s `Verify:` block (Pomodoro: Start → Stop inside a second → **no** *"done for
  ?"* dialog, and no `POST` with `{0,0}`); `B5`'s (Timer: Start → Stop under a minute → the user is told;
  `requests` shows `timer-alarm/cancel` and nothing else); then the stopwatch at ~10 s, which must behave
  like whichever of (a)/(b) was chosen and not like today's Pomodoro; then a **45-second** timer and a
  **45-second** stopwatch, which today save one minute — confirm the chosen rule is consistent (under (a)
  they still save one minute; under (b) too). Both locales for the new key. Reseed after: (b) writes rows.
- **Risk:** Low. Three small branches; the only judgement is (a) vs (b), and the wrong one is still
  better than the current three.

## F68. The manual-entry form fires one `POST` per click and never resets — the second click, and every re-submit after a success, is a `409`

- **Scope:** app-side `src/core/activityHistory/view/AddActivityManuallyView.vue:17-23,36-38`,
  `src/core/activityHistory/component/AddActivityManuallyForm.vue:53-82`
- **Closes:** `history-capture/B6` (round 1's `U1`, now observed — and the queue's §53 split of it, both
  halves, is settled below)
- **Root cause — confirmed, and the reset half is no longer taste.** `handleSave()` is
  `await formRef.value?.saveActivity()` with no re-entry flag; `saveActivity()` sets nothing while
  `await saveActivityToHistory(…)` is pending; the button has no `:loading`/`:disabled`. Two clicks inside
  the round trip are two `create` calls with the **same** `activityId` and `startTimestamp`, and the
  server's unique index `(UserId, ActivityId, StartTimestamp)` (`ActivityHistoryConfiguration.cs`) turns
  the second into a **409** — the mechanism the unit guessed and could not verify; confirmed at the
  source. What the finding did not draw out: `dateTime` is set once at mount (`Form.vue:53`, `new Date()`)
  and nothing resets it after a success, so a user who records a span and clicks *Record* again —
  the same activity, the same "when" — gets the same 409, surfaced as `history.errorSavingToHistory`
  (*"error saving"*) for a save that is not an error but a duplicate. That is why the reset half moves
  from "unsourced" (§53) to required: without it the form's second use is always a failure. Which fields
  reset is still the judgement §53 named — a user logging several spans of one activity plausibly wants
  the activity kept — but *"when"* must advance (to now, or to the end of the span just saved), or the
  index refuses.
- **Files:** `AddActivityManuallyView.vue` (a `saving` ref, `:loading="saving"` on the button, `@saved`
  bound); `AddActivityManuallyForm.vue` (a `reset()` in `defineExpose`, or reset inside `saveActivity()`
  after `emit('saved')`)
- **What to change:** Gate `handleSave` on a `saving` ref set around the `await` (the
  `TimerPresetDialog` confirm shape), bind it to the button's `loading`. Then the reset: on `saved`, set
  `dateTime` to `new Date()` (or to `dateTime + timeLength`, which is the more useful default for
  back-to-back logging — pick one and say why in the code) and clear `timeLength`; keep the activity
  selection. The success snackbar (`history.addedToHistory`) already fires; nothing else is needed to
  "make it obvious the save happened".
- **Do not change:** the server's index — a duplicate `(activity, start)` *is* a duplicate; the 409 is
  right. Not `useSaveActivityToHistory` — its snackbar pair is shared with the three timer views.
- **Verification:** `B6`'s `Verify:` block — `dblclick` on *Record activity to history* produces **one**
  `POST /api/activity-history` (`playwright-cli requests`), no 409, no console `AxiosError`; then a
  single save followed by a second *Record* → a second 201 with a different `startTimestamp`, not a 409.
  Reseed after.
- **Risk:** None.

## F69. Deleting a to-do item never confirms, whatever `askBeforeDelete` says — the item delete was never one of P3's five sites

- **Scope:** app-side `src/core/todoList/composable/useUndoableListCrud.ts:110-125`, its two consumers
  (`TodoListView.vue`, `RoutineToDoListView.vue`), and one row in CLAUDE.md's *sanctioned cross-module
  imports* table
- **Closes:** `todo-lists/B7` (+ the **unfiled routine twin** — `RoutineToDoListView` drives the same
  composable, so its item delete has the same gap; unit 10 ran seven rounds and never filed it because
  its deletes were of periods, not items)
- **Root cause:** Confirmed. `deleteItem()` is `await api.deleteEntity(id)` then `pushDeleteUndo(…)`,
  with no `shouldConfirm` anywhere in the file (grep: `useDeleteConfirmation` has six importers in
  `src/core`, none in `todoList/composable/useUndoableListCrud.ts`). `prompts/_done/user/P3-delete-confirmation-granularity.md`
  listed **five** delete sites, and the item delete was not among them — it was already an undo-only path
  through `useTodoListUndo` before P3 ran, so P3 never touched it. But P3's own rule covers it exactly:
  *"a delete that is a LEAF and is UNDOABLE honors the preference, and when the preference says 'don't
  ask', shows an undo affordance instead of a dialog"* — and `useDeleteConfirmation.resolveDelete()`
  encodes that (`askBeforeDelete` → `'confirm'` before it ever looks at `undoable`). With the preference
  **on** (the seed's default, the unit's screenshot), the item delete is the one site in the app that
  ignores it; with it off, the undo it already shows is the correct answer. So this is not "add a dialog"
  — it is "route the sixth site through the composable that already decides".
- **Files:** `useUndoableListCrud.ts:110` (or the two call sites, if the composable is to stay
  preference-free — it is `todoList`'s own, so importing `core/user`'s composable there is the sanctioned
  exception, same as `TodoListsView.vue:186`); `CLAUDE.md` — the `useDeleteConfirmation` row says "the
  five delete sites in `todoList`, `dayPlanner`, `historyDashboard`"; `F19` adds `activity`, this adds a
  sixth `todoList` site; rewrite the count once, not twice.
- **What to change:** Before `api.deleteEntity(id)`: `if (shouldConfirm({ cascades: false, undoable:
  true })) { const ok = await confirm({ title: …, text: t('toDoList.deleteItemConfirm', { name }) }); if
  (!ok) return }` — `useDialog().confirm()`, the shape `TodoListsView.vue:186-190` already uses for the
  list delete. `cascades: false` is right (items have no children; steps are a JSON column, not rows —
  confirm against `TodoListItemConfiguration.cs` before asserting it in a comment). Keep the undo entry
  either way — P3's *undoable* branch is what makes the "don't ask" case safe.
- **Do not change:** `useDeleteConfirmation` itself; the list and category sites (correct); the undo stack.
  Do not read `askBeforeDelete` directly — CLAUDE.md names that as the bug.
- **Verification:** `B7`'s `Verify:` block with the preference **on**: ⋮ → *Delete* → a dialog; Cancel →
  no `DELETE`, item still there; Confirm → `DELETE …/todo-list-item/{id}` 204 and the undo button. Then
  the preference **off**: no dialog, immediate delete, undo button — unchanged from today. Then
  `/routine-todo-list`, same two checks (create a throwaway routine item through the API first). Both
  locales for the new key.
- **Risk:** Low. One branch in a composable two views share — that is the point, and the risk: test both.

## F70. *Move to list* has 404'd since the day it was written — the client calls a route the server replaced the day before

- **Scope:** app-side `src/core/todoList/api/todoListItemApi.ts:104-112`
- **Closes:** `todo-lists/B8`
- **Root cause:** Confirmed on both sides, with dates. The client sends
  ``API.patch(`${url}/move/${id}/${destinationListId}`)`` with no body (`:106`). The server's only move
  route is `Patch("/todo-list-item/{id:long:required}/move")` taking `MoveToListTodoListItemRequest
  { required long DestinationListId }` in the body (`MoveTodoListItemEndpoint.cs:22`,
  `MoveToListTodoListItemRequest.cs`), with an IDOR guard that answers **404** for a destination the
  caller cannot see — and `/move/14105/13002` matches nothing at all, which is the 404 the unit saw. The
  unit's guess (*"a frontend call that was never updated after a backend routing change"*) has the order
  backwards: the server moved to `/{id}/move` + body on **2026-05-15** (`0517bb3`, which deleted the old
  `MoveToListTodoListItemEndpoint`), and the client's line was written on **2026-05-16** (`1a2e0284`) —
  against the endpoint that had been deleted the day before. Four months, no caller ever succeeded, and
  no spec covers it (`todo-lists.spec.ts` has no move test) — §100.
- **What to change:** ``API.patch(`${url}/${id}/move`, { destinationListId })``. One line. While there:
  the dialog closes before the call (`TodoListView.vue:197-200`), so a real 404 — a list the user cannot
  see — loses the pick; that is the close-then-call shape `F53`(c) flagged and `todo-routine/B11` fixed
  for time periods, not this batch's to redesign, but say in the commit that the pattern is known.
- **Do not change:** the server route or the guard's 404 — a stranger's list id staying unconfirmable is
  the point of it.
- **Verification:** `B8`'s `Verify:` block — pick a destination, Confirm → `PATCH …/todo-list-item/14105/move`
  → 204, the item leaves *Focus* and appears in *Errands* under the same id after a reload. Then
  `secondaryUser`'s list id as the destination (read it off `seed.json`) → 404, item unmoved. Add the
  move to `todo-lists.spec.ts` — a route contract with no test is how this stayed broken. Reseed after.
- **Risk:** None.

## F71. The to-do item's done checkbox has no accessible name — nor do the step checkboxes under it

- **Scope:** app-side `src/core/todoList/component/BaseTodoListItem.vue:19-28`,
  `src/core/todoList/component/BaseTodoListItemSteps.vue:39-47`, `src/core/todoList/_locales/toDoList.{sk,en}.ts`
- **Closes:** `todo-lists/A3` (+ the **unfiled** step checkboxes — same markup one level down, found
  reading the file; `DraggedItemPreview.vue:15`'s copy is `disabled` and decorative, leave it)
- **Root cause:** Confirmed. `VCheckboxBtn` at `:19` carries `v-model`, colours, `:disabled` and
  `@click.prevent.stop`, and no `label`, `aria-label` or `aria-labelledby`; the activity name beside it
  is a sibling `div`, not a label. Same for each step's `VCheckboxBtn` (`Steps.vue:39`). Every other
  per-item control in this component was named in rounds 2–5 (`A1`, `A2`, `B6`); this is the last one,
  and it is the one a keyboard user reaches first. `BaseTodoListItem` is the routine list's base too, so
  the fix lands on both views.
- **What to change:** `:aria-label="t('toDoList.markDone', { name: toDoListItem.activity.name })"` on
  the item checkbox and `t('toDoList.markStepDone', { name: step.text })` on each step's — new keys in
  `toDoList.{sk,en}.ts` (`home.markDone` exists with the same shape, `home.en.ts:15`, but it is another
  module's key; mint the pair here rather than import across the boundary). `aria-checked` is
  Vuetify's; nothing else.
- **Do not change:** the `@click.prevent.stop` handlers (`B3`'s fix); `DayPlannerWidget`'s checkbox
  (`F59`'s, already labelled).
- **Verification:** `A3`'s `Verify:` block — `getByRole('checkbox', { name: /Bug Fixing/ })` resolves on
  `/todo-list/13001`; then expand an item with steps and `getByRole('checkbox', { name: /<step text>/ })`;
  then `/routine-todo-list` once. Both locales.
- **Risk:** None — attributes only.

## F72. `useMappingSettings.saved()` sends three of the form's five facts — *To ignored* never reaches the wire, `isActive` is never sent, nothing validates, and the view's own `catch` overwrites the server's message

- **Scope:** app-side `src/core/activityTracking/composable/useMappingSettings.ts:39-54`,
  `src/core/activityTracking/dto/request/desktop/settings/TrackerDesktopMappingRequest.ts:12-13`,
  `…/android/settings/TrackerAndroidMappingRequest.ts:10-11`, `DesktopSettingsView.vue`'s and
  `AndroidSettingsView.vue`'s `edit()`, the two `*DistinctEntriesActions.vue` bars
- **Closes:** `tracking-settings/X2`, `X3`, `B6`
- **Root cause — three defects in one function, confirmed against both sides' source:**
  1. **`X2` — mode never reaches the request.** `saved()` (`:39-43`) copies `activityId`/`roleId`/
     `categoryId` from `formData` and never reads `mode`; `request.isIgnored` is never written anywhere in
     the file, so it stays the constructor's `null`. The server's `AddMappingTargetRules()` requires
     exactly one target (`IsIgnored = true`, or `ActivityId`, or `RoleId`/`CategoryId`) and answers the
     400 the unit quoted. *To ignored* has never worked from the UI, on either platform. `edit()` on an
     ignored row (`else { mode.value = 'toIgnored' }`) lands in the same dead path.
  2. **`X3` — `isActive` is never sent, and it is `required` on update.** Both request classes declare
     `isActive?: boolean` with no default and no writer; `JSON.stringify` drops the key.
     `CreateTrackerDesktopMappingRequest.cs` defaults `IsActive = true`, so create works;
     `UpdateTrackerDesktopMappingRequest.cs` is `required bool IsActive` (since `ae70138`, 2026-08-12,
     CQ-10) and its `UpdateEntity` is a **full replace** — its own remark says so. Every edit-save on
     either platform is the serializer 400 the unit quoted. **The finding's suggested shortcut is
     wrong:** *"always send the current toggle state (defaulting `true` for a new row)"* would re-activate
     every inactive rule the moment it is edited, because there is no toggle — `O1` is that there is no
     control for `isActive` anywhere. `edit()` must copy the row's `isActive` (the grid response carries
     it, `TrackerDesktopMappingResponse.ts:13`) into the request, and a new row sends `true`.
  3. **`B6` — no validation, and the wrong snackbar.** Nothing gates *Save*: the pattern group has no
     rule and `ActivitySelectionForm`'s `requiredRule` (`:123`) is never run through a `VForm.validate()`
     before `saved()` is called, so an empty form reaches the server. The server answers a **specific**
     400 (`patterns`, `target`) — and the interceptor snackbars it (generic today, `FW19`) — and then the
     `catch` at `:51-53` calls `showErrorSnackbar(t('activityTracking.settings.failedToSaveMapping'))`,
     which `showSnackbar` renders **in place of** the first. So the user sees the generic string for an
     empty form, for `X2`, for `X3` and for a real failure alike, and `FW19` on its own would not help
     this call site: the second snackbar wins (§105).
- **Files:** `useMappingSettings.ts:39-54`; the two request DTOs (`isActive: boolean = true` — a
  default, not optional); the two views' `edit()` (copy `item.isActive` and, for an ignored row, set
  `request.isIgnored = true` or let `saved()` derive it from `mode`); the two action bars (wrap the
  pattern fields + `ActivitySelectionForm` in one `VForm`, or validate before calling `saved`)
- **What to change:** In `saved()`: branch on `mode.value` — `'toIgnored'` → `isIgnored = true`,
  `activityId`/`roleId`/`categoryId` = `null`; `'toActivity'` → `isIgnored = null` and the three ids as
  today. Send `isActive` always: the edited row's value on update, `true` on create. Validate first —
  at least one pattern, and in `toActivity` mode an activity (or a role/category, if the server's
  `RoleId`/`CategoryId` target is meant to be reachable from this form — today the picker cascades but
  the form never submits without an activity; decide and say so) — and return before the request with
  the fields marked. Then the `catch`: drop the generic snackbar and let the interceptor speak (it
  already does for every non-`_silent` 400), **or** pass `_silent: true` on the two calls and show
  `error.response?.data?.errors` field-by-field yourself — one or the other, never both. Keep
  `failedToSaveMapping` for the `status === undefined` network case only, the `LoginView` shape.
- **Do not change:** the server's "exactly one target" rule or the PUT-replace semantics — both are
  documented and deliberate; the `mode` ref and the template that already switches on it (correct);
  `filter`'s double duty as the search pattern (`F15`'s *Do not change*).
- **Verification:** `X2`'s block on both platforms — *To ignored* + *Save* → the body carries
  `"isIgnored":true` and no ids, 201, the rule appears under the Mappings tab's *Ignored* type. `X3`'s —
  edit the seeded `rider64.exe` rule (through `F12`'s keyboard path until `F12` lands), change the
  activity, *Save* → `PUT` body carries `"isActive":true` **and the row's own value** (edit a rule whose
  `isActive` is `false` — create one through the API — and confirm it stays `false`), 2xx, the change
  survives a reload. `B6`'s — *Clear* → *Save*: **no request**, the pattern group and the activity field
  show their messages; then force a server 400 (`route --status=400 --body=…`) and read **one** snackbar
  with the server's text. Reseed after; every created rule is otherwise undeletable until `F13`.
- **Risk:** Medium — this is the view's only write path, on two platforms, and it changes what an
  *edit* sends for every rule. The `isActive` copy is the line to get right; the `X3` shortcut is the
  trap.

## FW1. `MyDialog` is `persistent` by default, so Escape closes nothing

- **Scope:** **[framework]** `src/_common/component/dialog/MyDialog.vue` — submodule commit in `vue_framework`,
  then a pointer bump in this repo, in that order
- **Closes:** `_shell/A1`
- **Re-verified unchanged this pass:** `MyDialog.vue:86` still defaults `persistent = true`; `onEscKey()`
  (`:136`) is still the only Escape handler.
- **Its own batch, and it needs a decision before a patch** (rule 4): flipping the default changes dismissal
  semantics for every dialog in every app on the framework, including destructive confirms. The two options —
  flip the default and have guarding dialogs opt **in**, versus keep the default and have harmless call sites
  opt **out** — are not equivalent in risk.
- **Files:** `src/_common/component/dialog/MyDialog.vue:86,136`; `src/_common/docs/components.md` in the same
  commit
- **What to change:** Whichever the decision is, plus the framework docs, plus a default that keeps existing
  apps working if it goes the opt-in way.
- **Verification:** `_shell/A1`'s `Verify:` block, **both halves** — a fix that makes every dialog escapable is
  a regression, not a fix. A destructive confirm must still resist Escape.
- **Risk:** Highest in this queue. Ships to every app on `vue_framework`, and the failure mode of getting it
  wrong (a half-filled form dismissed by a stray Escape) is data loss.

## FW2. Six framework icon-only controls have no accessible name

- **Scope:** **[framework]** `src/_common/nav/AppTopBar.vue`, `src/_common/component/FilterPanel.vue`,
  `src/_common/component/dateTime/MonthYearPicker.vue`, `src/_common/component/dateTime/MyDateInput.vue`
  — one submodule commit, then a pointer bump
- **Closes:** `_shell/A2`, `leisure-projects/A1`, **`planner-day/A1`** (+ two unfiled twins in `MyDateInput`)
- **Grown twice.** Unit 13 found the second one; unit 7 found the third and fourth, and this pass found
  the fifth and sixth in the file `FW15` had open. All six are a `VIconBtn` shipped with no
  `title`/`aria-label`, all in `src/_common`, all fixed by the same edit in the same commit — one batch.
  Re-verified by direct read: `AppTopBar.vue:11` (`icon="bars"`) has no label of any kind, contrasting
  with the theme toggle at `:44` which does carry `:title`; `FilterPanel.vue:49-55` (`icon="close"`)
  likewise. **`planner-day/A1` names the wrong file** (*Contradictions* §72): the month arrows are not in
  `CalendarGrid.vue` — that file has no `VIconBtn` at all — but in `MonthYearPicker.vue:3-8` and `:29-34`
  (`fa-chevron-left`/`-right`, `shiftMonth(±1)`), three components down (`CalendarGrid` →
  `DateRangePicker` → `MonthYearPicker`). The unit's `{"text":"","aria":null,"title":null}` eval is the
  evidence and stands; the fix just lands one file over. Every `MonthYearPicker` consumer gets it — both
  calendars, `ActivityRangePicker` (unit 5). And `MyDateInput.vue:3-9` / `:18-24` are the same two
  chevrons stepping a **day** (`prevDay`/`nextDay`), unnamed, shown by default (`dateShowArrows = true`)
  on `HistoryDetailView` and the History summary's range selector.
- **Files:** `AppTopBar.vue:9-16`, `FilterPanel.vue:49-55`, `MonthYearPicker.vue:3-8,29-34`,
  `MyDateInput.vue:3-9,18-24`
- **What to change:** A localized `aria-label` (and optionally `title`) on each, using the framework's own
  locale namespaces — `general.close` already exists there for the panel; the four chevrons need four
  new keys (previous/next month, previous/next day) under `dateTime`, next to the picker vocabulary
  `migration-revision.md:89-96` already mirrors. **Check the app-side mirror**: this app's `general` *and*
  `dateTime` namespaces replace the framework's wholesale, so any key the framework resolves must also
  exist in `src/locales/common.{sk,en}.ts` or it renders raw here (CLAUDE.md R5/R6/R11 — six instances so
  far; `F35` is the decision on whether that mirror becomes a deep-merge). Update
  `src/_common/docs/components.md` in the same commit.
- **Do not change:** anything under `src/core/` — in particular not `leisure-projects/A2`'s Messy icon (`F4`),
  which is the same class of defect on the app side and must ship separately. Not `MyDateInput`'s
  binding order — that is `FW15`, a different defect in the same file; one commit may carry both if it
  says so.
- **Verification:** `_shell/A2`'s, `leisure-projects/A1`'s and `planner-day/A1`'s `Verify:` blocks — each
  control exposes a localized accessible name, the sidebar toggle still toggles, the filter panel still
  closes, the month arrows still write `?month=` on `/day-planner` (the unit's own observation,
  `planner-day/inventory.md:20`), and `planner-day.draft.spec.ts:35-40` can drop its positional
  fallback for `getByRole('button', { name: 'Next month' })`. Confirm the names follow the locale rather
  than being hardcoded English, **in SK as well as EN**, since that is where the missing-mirror failure
  shows — and specifically that none reads raw `dateTime.<key>`.
- **Risk:** Low, but still two repos, two commits — submodule commit before the pointer bump, and the
  `dateTime` mirror in the bump.

## FW3. `Time.fromJson` cannot parse the backend's string shape

> ✅ **CLOSED 2026-09-13.** "Re-verified unchanged and still live" was true of the file and false of the
> defect: the API switched `dueTime` to `{hours, minutes}` on 2026-09-11 (backend `6395cee`), and the wire
> now reads `"dueTime":{"hours":17,"minutes":0}`. `Time.fromJson` was still made to delegate to
> `Time.fromString()` for a string argument — generic, default-preserving, documented in `baseDtos.md` —
> so the framework DTO reads either shape. Verified end to end: 6× `PUT` → 200, snackbar, 17:00 preserved
> after reload. Both `todo-motivation.spec.ts` `fixme`s are real tests now. `todo-lists/B4` closed.

- **Scope:** **[framework]** `src/_common/dto/dto/Time.ts` — submodule commit, then pointer bump
- **Closes:** `todo-lists/B4`
- **Re-verified unchanged and still live this pass:** `Time.fromJson` still reads
  `const { hours = 0, minutes = 0 } = object`.
- **Root cause:** The backend serializes a due time as the **string** `"HH:MM:SS"`, so every item with a real
  due time silently parses as `00:00` on read, and any subsequent `update()`/`updateWithResponse()`
  round-trips that zeroed value back out as `{"hours":0,"minutes":0}`, which the backend rejects with a 400
  (*"Cannot get the value of a token type 'StartObject' as a string."*). Not scoped to the overdue-renegotiation
  banner — it breaks **any** update path that serializes a `dueTime` through `ToDoListItemRequest.fromEntity`.
  `Time.fromString()` (same file, `:50-58`) already parses the string shape correctly; `fromJson` just doesn't
  call it.
- **Files:** `src/_common/dto/dto/Time.ts:17-20`
- **What to change:** Have `fromJson` delegate to `fromString` when its argument is a string.
- **Verification:** `todo-lists/B4`'s `Verify:` block — on `/todo-list/13002` ("Errands") click "Today" on the
  overdue banner: all 6 `PUT`s return 2xx, the "Moved 6 tasks…" snackbar appears, and each item's
  **time-of-day is preserved**, not zeroed. The second half matters: a fix that only stops the 400 would still
  be silently losing every due time on read.
- **Risk:** Medium. This DTO is read on every to-do item with a due time across the whole app. Test both
  directions.

## FW4. `DataTable`/`BasicTable` need a definite-height flex parent, and nothing says so

- **Scope:** **[framework]**, **docs only** — `src/_common/docs/components.md`, the *Data tables* section;
  optionally a one-line comment above `DataTable.vue:7`. Submodule commit, then pointer bump.
- **Closes:** nothing filed. It exists so the *next* `F12` does not happen: `tracking-settings/X1` cost a
  blocker grade, three screenshots, an `elementFromPoint` investigation and a wrong framework hypothesis,
  all for a missing `flex-fill`.
- **Root cause:** `DataTable.vue:7` renders `VDataTableServer` with `height="0"` — the fill-parent trick
  described under `F12` — and `BasicTable.vue:2` wraps it in `h-100`. That is a **contract on the
  consumer**: the table must sit in a flex column whose height is definite all the way up, or its body is
  0 px tall and its rows are laid out but invisible and un-clickable. `components.md:204-258` documents
  props, slots, emits and formatters and says nothing about layout. Seventeen consumers got it right by
  copying a sibling; the two that did not are the only ones that broke.
- **What to change:** One paragraph in `components.md` under *Data tables*: the table fills its parent and
  scrolls internally (that is why headers are sticky), the parent chain must therefore be definite-height
  flex columns, `flex-fill` on the wrapper plus `class="flex-1-1" style="min-height: 0"` on the table is
  the shape to copy (`ActivityTable.vue:42-43`), and the symptom of getting it wrong is "the row is in the
  a11y tree but not on screen". **Do not change the default** — a self-sizing body would drop sticky
  headers app-wide, and per batching rule 4 that is a decision, not a docs fix. If the maintainer wants a
  guard, a dev-mode `console.warn` when the wrapper measures 0 px after mount is the shape; file it as a
  separate ask.
- **Verification:** Read-through; the sentence names the symptom a future unit agent will see.
- **Risk:** None — docs only. Two repos, two commits, in order.

## FW5. `DataTable`'s default row actions render the internal slug as their `title`, not the localized label

- **Scope:** **[framework]** `src/_common/component/dataTable/DataTable.vue:83` — submodule commit, then
  pointer bump
- **Closes:** `activity-settings/B4`, **`leisure-bucket-anchors/A1`** (framework half — the unit's
  `eval` read `title="edit"` / `title="delete"`, `aria-label: null` on both leisure tables' row actions;
  that is this slug, seen from two more tables. The "add `aria-label`" widening this batch already
  mentions below is now worth doing in the same line — three units have asked for it.)
- **Root cause:** Confirmed by direct read. `TableAction` is `(name, text, color, variant, icon,
  onClick)` (`TableAction.ts:1-10`); `BasicTable.vue:175,177` constructs the defaults as
  `new TableAction('edit', t('general.edit'), …)` / `('delete', t('general.delete'), …)`; and
  `DataTable.vue:83` binds `:title="action.name"` — the slug. **Its sibling already has it right:**
  `TableGrid.vue:130` binds `:title="action.text"`. Every app on the framework that uses `BasicTable`'s
  default actions ships `title="edit"` / `title="delete"` on every row, in every locale.
- **Not merged into `FW2`, deliberately.** `FW2` is two controls with *no* label; this is a control
  with the *wrong field* bound. Different cause, different fix, though nothing stops one submodule commit
  carrying both — say so in the commit message if it does.
- **Files:** `src/_common/component/dataTable/DataTable.vue:83`; `src/_common/docs/components.md` only
  if it documents the `title` (it need not gain a sentence for a one-character field name)
- **What to change:** `:title="action.text"`. Consider adding `:aria-label="action.text"` in the same
  line — `title` alone is an accessible name of last resort — but that is a small widening, not this
  finding.
- **Do not change:** `TableAction`'s field order or `BasicTable`'s constructors; `name` is the
  discriminator `TableGrid.vue:131` switches on (`action.name === 'edit'`).
- **Verification:** `B4`'s `Verify:` block — **but not on `/activity-settings/roles` once `F19` has
  landed**, because that table will no longer render the default actions. Use `/routine-settings`
  (`RoutineSettingsView.vue`, a `BasicTable` with default actions and `@onDelete`) or `/leisure/bucket-list`
  / `/leisure/memory-anchors` (both on default actions, per `A1`'s evidence). Both locales, per step 3 of
  the block. `A1`'s pass condition adds a non-null `aria-label` — only if the widening is taken.
- **Risk:** None. One field name, and the correct value is already what the sibling renders.

## FW6. `CalendarGrid`'s day cells are click-only `div`s — no accessible name, role, `tabindex` or key handler

- **Scope:** **[framework]** `src/_common/component/calendar/CalendarGrid.vue` — submodule commit in
  `vue_framework`, then a pointer bump in this repo; **the pointer-bump commit must also carry an
  app-side locale mirror** (below)
- **Closes:** `history-review/A2`. **Pre-empted** the same finding from unit 7 (`planner-day`) —
  `PlannerCalendarView.vue:2-53` mounts the same component with the same `@dayClick`, and the unit's
  inventory locates day cells by `getByText('14.09....')` (`planner-day/inventory.md:24-27`) without
  filing the missing role; the pre-emption held, as `FW8`'s did (§66). Verify on `/day-planner` too.
- **Root cause:** Confirmed, and the finding's framework guess was right — the click target is the
  grid's own markup, not the app's slot. `CalendarGrid.vue:64-76` renders each cell as `<div
  class="day-cell" … @click="handleDayClick(dayData)">` and the app's `#day-cell-content` slot (`:81-84`)
  sits *inside* it. No `role`, `tabindex`, `aria-label`, `title` or `@keydown` on the cell; the
  `.empty` cells (`:70`, padding cells for days outside the range) carry the same `@click` and are
  no-op'd in `handleDayClick` (`:268-271`). `CalendarDayCellHeader` renders the visible day number, so
  the snapshot shows digits with no relationship to the clickable wrapper — which is why the unit had to
  click a neighbouring ref and sometimes hit the wrong day.
- **Files:** `CalendarGrid.vue:64-76` (the cell), `:268-271` (the handler); `src/_common/docs/components.md`
  (the `CalendarGrid` entry) in the same commit
- **What to change:** On non-empty cells: `role="button"`, `tabindex="0"`, `@keydown.enter.space.prevent`
  to the same `handleDayClick`, and an `:aria-label` naming the date — the finding's *"View history for
  September 10, 2026"* is app wording; the framework's generic form is the date plus the weekday
  (`allDays` at `:175-188` already has the localized weekday names; the date must be formatted through
  the i18n locale, **not** `formatToDateWithDay` from `DateTimeHelper.ts`, which is hardcoded `sk`
  (*Contradictions* §22) and would announce Slovak dates in EN). The label key goes in the framework's
  `calendar` namespace next to `calendar.daysToShow`. **`.empty` cells get none of it** — no role, no
  tabindex, and `cursor: default` is already there (`:406-409`); make the `@click` conditional too so a
  padding cell is not a focus stop. A `:focus-visible` outline on `.day-cell` — the existing `.selected`
  outline (`:379-383`) is the shape to mirror, not reuse, since selected and focused are different states.
- **⚠️ The locale mirror is not optional.** This app's `src/locales/common.{sk,en}.ts` declares its own
  `calendar` namespace (`common.en.ts:431`, with the comment at `:429` saying it is *"consumed by
  `_common/component/calendar/CalendarGrid.vue`"*), and the aggregator spread is shallow — the app's
  `calendar` **replaces** the framework's wholesale (CLAUDE.md *Localization*; R11 was exactly this
  namespace). Any key `CalendarGrid` resolves that is not mirrored renders raw here. Add the new key to
  both app files in the pointer-bump commit, and say so in its message.
- **Do not change:** the `#day-cell-content` slot contract or the `dayClick` payload — `HistoryCalendarView`
  and `PlannerCalendarView` both cast it. Not `CalendarDayCellHeader` — the visible day number is fine;
  the name belongs on the control. Do not batch with `F29`/`F30` (rule 1 — those are app-side).
- **Verification:** `history-review/A2`'s `Verify:` block on `/activity-history/calendar` — a day cell
  resolves by `getByRole('button', { name: /10/ })` (or whatever the label pattern is), Tab reaches it,
  Enter navigates to `/activity-history/detail?date=2026-09-10` exactly as a click does; padding cells
  are not focus stops. Then `/day-planner` for the second consumer. **Both locales**, and specifically
  check the name is not raw `calendar.<key>` in either — that is the mirror check.
- **Risk:** Low, but two repos and one locale trap. Every app on the framework that renders
  `CalendarGrid` gains focusable cells — a month is 28–42 new tab stops, which is correct for a control
  grid but is a change a keyboard user of another app will notice.

## FW7. Every password field's visibility toggle is named "{label} appended action" — one component, and one locale key nobody defined

- **Scope:** **[framework]** `src/_common/modules/user/component/MyPasswordInput.vue`,
  `src/_common/modules/user/_locales/user.{sk,en}.ts`, `src/_common/docs/modules/user.md` — submodule
  commit in `vue_framework`, then a pointer bump. **No app-side locale mirror is needed** (below).
- **Closes:** `user-settings/A1`, **`auth/A1`** (the same toggle on `/login` and `/registration` —
  "Password appended action", "New password appended action", "Confirm new password appended action",
  observed in the snapshot), and **`auth/B2`** (the raw `user.passwordsDontMatch` the adjacent below
  predicted, now **observed** on `/registration` — screenshot `registration--password-mismatch.png`
  and the `[intlify] Not found 'user.passwordsDontMatch' key in 'EN'` console line). **Also answers the
  message half of `user-settings/U4`** (adjacent, below), which stays listed under *Needs
  verification* for its on-screen half. Ninth pass: both auth findings repeat the seventh pass's
  wrong mechanism ("no `aria-label` binding exists on the `appendInnerIcon`") — the paragraph below
  already corrects it; their suggested `:aria-label` on the icon prop would not take effect.
- **Root cause — one file, not three call sites.** All three fields in the dialog (and every other
  password field in the module — `MyVerifyPasswordInput.vue:2`, both halves of
  `MyNewPasswordInput.vue:2,9`, so sign-in, registration, the verify dialog and the e-mail change too)
  render through `MyPasswordInput.vue`, whose `:appendInnerIcon` + `@click:appendInner` (`:7,:10`) is
  the Vuetify mechanism that generates the name. Vuetify 3.12.4 `components/VInput/InputIcon.js:30`:
  `label = listener && localeKey ? t('$vuetify.input.appendAction', props.label ?? '') : undefined`,
  and `locale/en.js:76` is `appendAction: '{0} appended action'`. That is the whole of it: the field's
  own label, run through a slot-position template. The finding's guess ("no `aria-label` passed at the
  call site") is right in effect and misses that no prop *can* override it — the only knob is the
  global `$vuetify.input.appendAction` string, which would still have to say "appended action" for every
  clearable/appended field in every app. **Naming only, and reachability must survive the fix:**
  `VIcon.js:72-74` gives the generated icon `role="button"`, `tabindex="0"` and `InputIcon`'s own
  Enter/Space handler, so today's toggle is keyboard-operable with a bad name. A bare `<VIcon @click>`
  in the slot keeps role and tabindex but **loses the keydown handler**; a button does not.
- **Files:** `MyPasswordInput.vue:7,10`; `user.{sk,en}.ts` (two new keys, plus the missing one);
  `docs/modules/user.md`
- **What to change:** Replace the two icon props with a `#append-inner` slot holding a `VIconBtn`
  (the framework's own alias, `createAppVuetify.ts:13`) — `:icon="showPassword ? 'eye-slash' : 'eye'"`,
  `variant="plain"`, `size="small"`, `density="compact"`, `@click="showPassword = !showPassword"`, and
  `:aria-label` / `:title` bound to `$t(showPassword ? 'user.hidePassword' : 'user.showPassword')`. A
  toggle whose *label* changes must not also carry `aria-pressed` (that is two state channels for one
  fact; pick the label). Keys go in the **framework's** `user` namespace, and unlike `general`/`calendar`
  this app **merges** `user` per key rather than replacing it (`SK.ts:57`, `EN.ts:44` —
  `{ ...frameworkUser.user, ...appUser.user }`), so nothing needs mirroring into `src/core/user/_locales/`;
  just confirm `appUser.user` does not already declare the same key names, because the app wins a
  collision. Watch the field height: Vuetify's append-inner slot is sized for an icon, and a default
  `VBtn` is taller than the `comfortable` field — `size="small"` + `variant="plain"` fits, check in both
  densities before committing.
- **Adjacent, source-certain, same module, same commit — the mismatch message is a raw key.**
  `MyNewPasswordInput.vue:36` resolves `i18n.t('user.passwordsDontMatch')`; grep across every
  `_locales/*.ts` in `src/` (framework `common.{sk,en}`, framework `user.{sk,en}`, app `user.{sk,en}`,
  `common.{sk,en}`) finds **only the usage**. vue-i18n renders the key path when both the locale and the
  fallback miss, so `U4`'s "mismatched new/confirm" validation line reads `user.passwordsDontMatch` on
  screen, in both languages, on the change-password dialog *and* on registration (unit 15). Add the key
  to both framework `user` files. Not filed by the unit (it could not type into the field); folded here
  rather than given a batch because it is two lines in the file this batch already edits, and `U4`'s
  retest is where it gets seen. **Ninth pass: unit 15 typed into the field and saw it** (`auth/B2`),
  so this is no longer source-only. One footnote from the same read, not batched: `MyNewPasswordInput.vue:4,11`
  resolve `user.password` / `user.confirmPassword` when `isNew` is false; `user.sk.ts:85` defines
  `confirmPassword`, `user.en.ts` does not, and neither file defines `user.password`. Dead today —
  both consumers (`RegistrationView.vue:27`, `ChangePasswordForm.vue:11`) pass `isNew` — so it is a
  drift to close while in the file, not a defect to verify.
- **Do not change:** `$vuetify.input.appendAction` in `vuetifyLocale.sk.ts` / `common.en.ts` — that is
  the fallback for every *other* appended action and "appended action" is the right generic name for a
  slot Vuetify knows nothing about. Not `MyNewPasswordInput`'s rule logic. Do not batch with `FW2`
  (control with *no* name) — the finding itself argued for the split, and it is right: different
  mechanism, and `FW2` is two hand-written buttons while this is a Vuetify-generated one.
- **Verification:** `A1`'s `Verify:` block — open *Change password*, each of the three toggles has the
  accessible name *Show password*, and after activation *Hide password* with the field's `type` flipped
  to `text`; **Tab reaches each toggle and Enter/Space flips it** (the reachability the fix must not
  lose); both locales (`Zobraziť heslo` / `Skryť heslo`, or whatever the SK file says — no raw key). Then
  `U4`'s half: type `a` in *New password* and `b` in *Confirm new password* — the line under the confirm
  field reads a sentence, not `user.passwordsDontMatch`. The harness's classifier blocked the agent's
  `fill` on a password field; a Playwright spec is code, not the agent, so promote the draft spec's `A1`
  and `U4` `fixme`s and let the suite do the typing (nothing is submitted; a mismatch sends no request).
  **Ninth pass — two signed-out places to look too:** `/login`'s toggle and `/registration`'s two
  (`auth/A1`'s snapshot names), and the mismatch line on `/registration` (`auth/B2`, screenshot
  `registration--password-mismatch.png`); `e2e/tests/auth.draft.spec.ts:97` is the `fixme` for the
  latter and needs no sign-in, so it is the cheapest assertion this batch has.
- **Risk:** Low-medium for a one-file change: every sign-in and registration form in every app on the
  framework changes its toggle's markup from a Vuetify-managed `<i>` to a `VBtn`. Look at `/login` and
  `/registration` after the pointer bump, in both densities and both themes.

## FW8. Six elevated buttons in the framework's user module use the tonal/outlined colour tokens — and the pairing rule is written only in this app's CLAUDE.md

- **Scope:** **[framework]** `src/_common/modules/user/component/settings/SecuritySection.vue`,
  `SessionsSection.vue`, `view/ConfirmEmailView.vue`, `view/ConfirmEmailChangeView.vue`,
  `component/ResendConfirmationEmail.vue`, plus one paragraph in `src/_common/SETUP.md` — submodule
  commit, then pointer bump
- **Closes:** `user-settings/P1`. **Pre-empted** the same finding from unit 15 (`auth`) on its three
  signed-out views — and it worked: unit 15 ran on 2026-09-14, its inventory recorded the buttons, and
  its `findings.md` does not file them (ninth pass, *Contradictions* §66). `FW12` edits two of the same
  lines (`ConfirmEmailView.vue:21`, `ConfirmEmailChangeView.vue:20`); land this first or fold it in.
- **Root cause:** Confirmed by direct read, and wider than filed. The finding names two —
  `SecuritySection.vue:62` (`color="warning"`) and `:68` (`color="error"`), both with `VBtn`'s
  framework default `variant="elevated"` (`createAppVuetify.ts:25`). A grep of the module finds four
  more of the same shape: `SessionsSection.vue:40` (per-row *Revoke*, `error`), `ConfirmEmailView.vue:21`,
  `ConfirmEmailChangeView.vue:20`, `ResendConfirmationEmail.vue:5` (all `error`). The author knew the
  rule: `SessionsSection.vue:63-64` pairs `error` with `variant="tonal"` correctly, and the
  delete-account confirm on `SecuritySection.vue:184` passes `confirmBtnColor: 'errorDark'`. Six
  buttons drifted, not a convention that was never adopted.
- **Whose rule is it?** The tokens are the framework's (`bootstrap/theme.ts:23-26` defines `errorDark`
  / `warningDark` / `successDark` next to `error` / `warning`), the elevated default is the framework's,
  and framework components already use the Dark tokens (`reminders`, `notifications`, `MyCard`,
  `SnackbarComposable.ts:30,38`). The *pairing* — elevated takes the Dark token, tonal/outlined the plain
  one — is written in this app's CLAUDE.md and AGENTS.md and nowhere in `src/_common`: `SETUP.md:289-290`
  says keep the colour *names* and stops there. So the batch is six tokens **and one sentence** next
  to that paragraph, so the next framework module has the rule where its buttons are. Not a default
  change — rule 4 does not bite; nothing about `componentDefaults` moves.
- **Files:** `SecuritySection.vue:62,68`; `SessionsSection.vue:40`; `ConfirmEmailView.vue:21`;
  `ConfirmEmailChangeView.vue:20`; `ResendConfirmationEmail.vue:5`; `SETUP.md:289`
- **What to change:** `warning` → `warningDark` (one), `error` → `errorDark` (five). The SETUP.md
  sentence: *elevated → `primary`/`secondary`/`errorDark`/`successDark`/`warningDark`; tonal or outlined
  → `primaryOutline`/`secondaryOutline`/`error`/`success`/`warning`* — CLAUDE.md's own two lines, moved
  to where the components live.
- **Do not change:** `SecuritySection.vue:49` (`color="info"` — Vuetify's stock token; the theme
  declares no `infoDark`, so there is nothing to pair it with; out of scope and worth a separate
  question of whether `info` belongs in the palette at all). Not the `VChip`s or the `MyDialog`
  `confirmBtnColor="error"` on `SessionsSection.vue:74` — that prop's variant is `MyDialog`'s business.
  Not `GoogleCalendarCard.vue` (`F34`, rule 1).
- **Verification:** `P1`'s `Verify:` block on `/user/settings` in both themes — *Change password* in
  `warningDark`, *Delete account* and each *Revoke* in `errorDark`, all legible. The three signed-out
  views are unit 15's to inventory; a one-line source read is enough here, and its agent should not
  file them again.
- **Risk:** Visual only, two repos. `warningDark` (`#CA8A04`) is darker and less saturated than the
  unit's screenshot shows for `warning` — that is the point, but look at it in dark theme where the
  card is `surface`.

## FW9. The forgotten-password flow cannot complete at either step — the request omits `recaptchaToken`, and the reset link points at a view that does not exist

> ✅ **Half landed, 2026-09-15 — the token.** `vue_framework` `6157283` (bump `04c405e9`):
> `ForgottenPasswordView` now calls `executeRecaptcha('forgot_password')` — the action name this batch
> derived from the endpoint — and posts `{ email, recaptchaToken }`. Unit 15's round 3 verified it live:
> **204** for the seeded address and for a nonexistent one, the success `MyDialog` open, no error snackbar.
> `auth/X1` is `fixed`. **What is still open is everything below from item 2 on**: the `/reset-password`
> route and view (the larger half — the mail still points at `F20`'s blank page), `B3`'s `catch` (the dead
> 404 branch, the hardcoded literal, the `TypeError` on no response, the `console.log`), and the optional
> success-dialog exit. The round-3 note that the two addresses answer identically is the enumeration guard
> item 3 describes, observed. Read the body as written; skip the token sentences.

- **Scope:** **[framework]** `src/_common/modules/user/view/ForgottenPasswordView.vue`, a **new**
  `src/_common/modules/user/view/ResetPasswordView.vue`, `src/_common/modules/user/user.routes.ts`,
  `src/_common/modules/user/_locales/user.{sk,en}.ts`, `src/_common/docs/modules/user.md:8` —
  submodule commit, then pointer bump. App side, in the bump commit: `docs/views/_routes.md` gains one
  record (`/reset-password`), and `src/router.ts`'s `SIGNED_OUT_ONLY_ROUTES` deliberately does **not**
  (below). *The number:* `FW9` was reserved by the fifth and sixth passes for the `BasicTable` dialog
  defect; that was fixed straight into `vue_framework` (`98b92d0`, bump `126d2968`) and never became a
  batch, so the number is free. `FW10` stays reserved for the `TimePicker` minute-60 item.
- **Closes:** `auth/X1` (`blocker`, stands), `auth/B3` (re-graded `bug` → `polish`, §59).
- **Root cause — two gaps, and the unit could only see the first.** Read against the API this pass
  (`framework/Sydowwe.Framework/application/endpoint/user/command/auth/BaseForgotPasswordEndpoint.cs`,
  `BaseResetPasswordEndpoint.cs`, the two request records, `AdhdTimeOrganizer/.../ForgotPasswordEndpoint.cs`
  which is a bare subclass, `Properties/launchSettings.json:23`):
  1. **The token.** `ForgottenPasswordView.vue:65` posts `{ email }`; `ForgotPasswordRequest.cs:6` is
     `public required string RecaptchaToken`, so System.Text.Json refuses the body before the endpoint
     runs — the exact serializer 400 the unit captured. The endpoint then verifies the token with action
     **`forgot_password`** (`:53`), not `'forgotten-password'` as the finding guessed, and Google's
     `siteverify` compares the action string exactly (`GoogleRecaptchaService.cs:36`). Locally the
     verifier is `LocalAlwaysPassRecaptchaService` (§63), so an empty token passes here.
  2. **The route.** On success the endpoint mails `BuildResetLink` = `{PAGE_URL}/reset-password?userId={id}&token={escaped}`
     (`:45-49`; `PAGE_URL` is `https://localhost:3000` in dev) and exposes `POST /auth/reset-password`
     taking `{ userId: long, token, newPassword, recaptchaToken }` with action **`reset_password`**
     (`BaseResetPasswordEndpoint.cs:31,39`). **`grep -ri reset-password src/` finds only the two locale
     strings for the button label.** `userRoutes` (`user.routes.ts:14-45`) has five records and none is
     `/reset-password`; `docs/modules/user.md:8` documents exactly five. So a user who receives the mail
     clicks into `F20`'s blank main area, and the flow the view promises ("follow the instructions in
     the email") has never been completable in this app. This is the larger half of the blocker and the
     reason `X1`'s one-line fix must not ship alone.
  3. **The error handling the unit filed as `B3`, seen whole.** `BaseForgotPasswordEndpoint.cs:15-18,54-68`
     answers **204 on every path** — unknown address, unconfirmed address, *and* a failed reCAPTCHA —
     by design, to avoid an enumeration oracle. So the view's `if (error.response.status === 404)`
     (`:70`) is a branch the server never takes, `showErrorSnackbar('Email not found')` (`:71`) is a
     hardcoded English literal on a dead path (a localized `authorization.emailNotFound` exists and is
     also unneeded), and the finding's headline — *"everything else is silently logged"* — is wrong:
     the interceptor (`axiosConfig.ts:220-265`) snackbars every status that has a response, which is
     why the unit saw *"One or more errors occurred!"* for the 400. What is real is narrower: when
     there is **no response** (server down, CORS, abort), `error.response` is `undefined`, `:70` throws
     `TypeError` inside the `catch`, the `.finally` still hides the spinner, and the user gets nothing
     — the interceptor's `status !== undefined` guard (`:221`) skips it too. `LoginView.vue:196-205`
     already solved this case (`handleHttpCodes(status ?? 0)` → `httpErrors.unknown`). Plus
     `console.log('Error', …)` at `:73`, which `F38` pre-empted for this batch.
- **Files:** `ForgottenPasswordView.vue:51-80`; new `ResetPasswordView.vue`; `user.routes.ts:45`;
  `user.{sk,en}.ts` (`authorization` block — this is the file that **wins** the `authorization`
  namespace: `SK.ts:48` / `EN.ts:38` spread `frameworkUser` after the framework `common`, whose own
  `authorization` block at `common.en.ts:475` loses wholesale, so keys added there would never render);
  `docs/modules/user.md:8`
- **What to change:**
  - `ForgottenPasswordView`: import `useRecaptcha`, `recaptchaToken = await executeRecaptcha('forgot_password')`
    (action name from the endpoint, above), post `{ email, recaptchaToken }`. Replace the `catch` body
    with the `LoginView` shape: `const status = error.response?.status; if (status === undefined)
    handleHttpCodes(0)` — and nothing else, because every other status already has an interceptor
    snackbar and a second one would replace it. Delete the 404 branch and the `console.log`. Optional,
    same file: the success `MyDialog` has `hasCloseBtn=false`, `hasConfirmBtn=false` and `MyDialog`'s
    `persistent` default (`FW1`), so it can only be left by navigating — a *Go to login* confirm button
    (`authorization.goToLogin` exists) costs one prop. Consider wording `passwordResetEmailSent` so it
    does not promise a mail the server may have declined to send ("If an account with that address
    exists, …") — the server's enumeration guard makes the current sentence a small lie for unknown
    addresses; a copy decision, flagged not prescribed.
  - `ResetPasswordView.vue` (new): reads `route.query.userId` (→ `Number`) and `route.query.token`
    (vue-router has already URL-decoded it; do not decode again); one `VForm` with `MyNewPasswordInput
    isNew` (which brings the strength rules and, after `FW7`, the mismatch message); on submit
    `executeRecaptcha('reset_password')` then `POST /auth/reset-password` `{ userId, token, newPassword,
    recaptchaToken }`; on 204 show a success state with *Go to login* (`{ name: 'login' }`) — the server
    has revoked every session (`BaseResetPasswordEndpoint.cs:65-67`), so there is nothing to sign in
    with automatically. Failures are 400 with `errors.generalErrors` (`"Recaptcha verification failed."`,
    `"Invalid or expired reset token"`, or Identity's password-rule descriptions) — the interceptor's
    `BadRequest` arm already shows `serverMessage`, which resolves to the first of those, so the view
    only needs the `status === undefined` fallback. If `userId` or `token` is missing from the URL,
    render the same "link is invalid" state without posting. Two new keys, both files: a title
    (`authorization.setNewPassword`) and the success line (`authorization.passwordResetSuccess`);
    `authorization.resetPassword` already exists for the button.
  - `user.routes.ts`: add `{ path: '/reset-password', name: 'resetPassword', component:
    ResetPasswordView, meta: { public: true, showRecaptchaBadge: true } }`. The path is the server's
    (`BuildResetLink` is `virtual` and a host may override it — say so in `docs/modules/user.md`, which
    also changes "five signed-out views" to six).
- **Do not change:** `src/router.ts`'s `SIGNED_OUT_ONLY_ROUTES` — `/reset-password` processes a
  token out of an e-mailed link, exactly the case the comment at `:74-77` gives for keeping the two
  confirm-e-mail routes out of the set, so a signed-in user clicking the mail must still reach the
  form. Not the interceptor's `AUTH_ENDPOINTS` list (`axiosConfig.ts:63`): neither endpoint answers
  401, so neither needs the no-refresh treatment. Not `authorization.emailNotFound` — leave the key,
  just stop using it. Not the server: the 204-on-everything contract is right and is documented as
  deliberate.
- **Verification:** `X1`'s `Verify:` block — seeded `test@example.com`, *Reset password*, `POST
  /api/auth/forgotten-password` → **204** (the finding says "2xx"; it is 204), the *Password reset
  email has been sent* dialog opens, no error snackbar. **Mind the throttle:** the endpoint is
  `Throttle(3, 60)` per client IP (`:36`), so a fourth submit inside a minute is a 429 and the
  interceptor's default arm shows *unknown error* — that is correct behaviour, not a regression. Then
  the second step, which needs no inbox: `goto /reset-password?userId=10001&token=garbage`, fill a
  valid new password twice, submit → `POST /api/auth/reset-password` → 400, snackbar *"Invalid or
  expired reset token"* (Identity's description for a bad token), the form still on screen. Then
  `goto /reset-password` with no query → the invalid-link state, no request. `B3`'s network case:
  `playwright-cli route "**/api/auth/forgotten-password"` aborted → *unknown error* snackbar, no
  `TypeError` in the console. Promote the draft spec's `fixme` at `e2e/tests/auth.draft.spec.ts:121`.
  A full round trip with a real mail is a manual check against a configured sender and is not
  required to close either finding.
- **Risk:** Medium, two repos, and additive: every app on the framework gains a route it did not have,
  on a path its server may or may not mail (the `BuildResetLink` override). An app whose host mails a
  different path gets an unreachable-but-harmless view; an app whose host mails **this** path gets a
  flow that works for the first time. The badge meta and the `public` flag match the other five, so
  the app-side guard needs nothing.

## FW11. Post-login redirect, read half — the three success handlers hardcode `/`

- **Scope:** **[framework]** `src/_common/modules/user/view/LoginView.vue:156,217`,
  `src/_common/modules/user/component/LoginVerifyQrCode.vue:64`, a new
  `src/_common/modules/user/utils/postLoginRedirect.ts`, `src/_common/docs/modules/user.md:43-44` —
  submodule commit, then pointer bump (which carries `F39`)
- **Closes:** `auth/B1` (read half — `F39` is the write half, rule 1), **`auth/P3`** (same file,
  below).
- **Root cause:** Confirmed by direct read. All three sign-in success paths end in a literal
  `router.push('/')`: the password path (`LoginView.vue:155-156`), the Google path
  (`handleGoogleLogin`, `:214-218`) and the 2FA path (`LoginVerifyQrCode.vue:63-64`, a child of
  `LoginView` so `useRoute()` sees the same `/login?redirect=…`). The framework has been *writing*
  `redirect` since the interceptor's forced-logout path existed (`axiosConfig.ts:175`), so a user
  whose session expired mid-task is already sent to `/login?redirect=/where/they/were` today — and
  then to `/`. `F39` adds the guard as a second writer; this batch is the only reader either of them
  will ever have.
- **Files:** the two views above; `utils/postLoginRedirect.ts` (new); `docs/modules/user.md:43-44`
- **What to change:** One helper, used three times: `resolvePostLoginTarget(route): RouteLocationRaw`
  — takes `route.query.redirect`, accepts it only when it is a string that starts with `/` and not
  `//` (a protocol-relative URL is the open-redirect the finding warns about; `\` should fail the same
  test, since some browsers normalise it to `/`), and returns `'/'` otherwise. `router.push(
  resolvePostLoginTarget(route))` at all three sites; `LoginView` needs a `useRoute()` import,
  `LoginVerifyQrCode` too. Note in `docs/modules/user.md` that the `redirect` query is the module's
  contract, who writes it, and that it is path-only by design. **Folded in, same file:** delete
  `LoginView.vue:142`'s `console.log(valid)` (`auth/P3`, `F38`'s pre-empt) and replace the hardcoded
  `showErrorSnackbar('No user!!!')` at `:159` — a 200 with an empty body — with `handleHttpCodes(0)`;
  the `console.error` beside it can stay. Both are two-line deletions in a function this batch is
  already editing.
- **Do not change:** `'/'` as the fallback — `{ name: 'home' }` would assume every host app names its
  root route `home`, which this module does not otherwise require. Not the `SIGNED_OUT_ONLY_ROUTES`
  guard app-side: an authenticated visitor to `/login?redirect=x` is bounced to `home` and loses `x`,
  and that is fine — they are signed in already. Not `RegistrationView.goToLogin()` (`:106-108`): it
  pushes `{ name: 'login' }` with no redirect, correctly, because a new account has nowhere to return
  to. Not `axiosConfig.ts:175`.
- **Verification:** `B1`'s `Verify:` block end to end once `F39` is in the pointer; before that, the
  interceptor's path proves the read half alone — `goto /login?redirect=%2Ftodo-list%2F13001`, sign
  in, land on `/todo-list/13001`. The open-redirect guard: `goto
  /login?redirect=https%3A%2F%2Fexample.com` and `?redirect=%2F%2Fexample.com` both land on `/`.
  `P3`: no bare `true`/`false` line in the console on submit. The 2FA path stays `unverified` (`U2`)
  — its line is a one-token change and reads the same helper, so a source read is enough for it.
- **Risk:** Low, two repos. Every sign-in form in every app changes where it lands *only* when a
  `redirect` query is present, and the interceptor is the only writer in any app today.

## FW12. Both confirm-e-mail views' error states are a lone button — and the sibling the unit held up as the model is no better

- **Scope:** **[framework]** `src/_common/modules/user/view/ConfirmEmailView.vue`,
  `src/_common/modules/user/view/ConfirmEmailChangeView.vue`,
  `src/_common/modules/user/_locales/user.{sk,en}.ts` — submodule commit, then pointer bump. Same
  lines as `FW8` (`ConfirmEmailView.vue:21`, `ConfirmEmailChangeView.vue:20`); land after it or fold.
- **Closes:** `auth/B4`, `auth/B5`. **Settles `auth/U6`** — no defect (below).
- **Root cause, and a correction.** `B4`'s premise is that `ConfirmEmailChangeView`'s error state
  shows *"a persistent localized explanation plus a 'Go to login page' recovery button"* and its
  sibling only the resend button. Read both templates and both screenshots this pass:
  `ConfirmEmailChangeView.vue:15-25`'s error branch is **one `VBtn`** (*Go to login page*) and no text;
  `ConfirmEmailView.vue:15-26`'s is one `VBtn` (*Resend confirmation email*) and a commented-out
  `<span>{{ i18n.t('') }}</span>` with an empty key. The "persistent body text" visible in
  `confirm-email-change--no-token-error.png` is the **error snackbar**, still on screen when that
  screenshot was taken; `confirm-email--no-token-error.png` was taken after its snackbar had gone.
  So the defect is real and **both** views have it: after three seconds each shows a button under a
  blank page with no sentence saying what went wrong. Severity `bug` stands; the fix covers two views,
  not one. Three more things in the same forty lines, all source-certain: `ConfirmEmailView.vue:69`
  snackbars the literal `Error` (`B5`, observed) — and `SnackbarComposable.ts:28`'s
  `customMessage || 'Error'` is the same literal one level down, so an empty string would render it
  too; the resend at `:64` interpolates `router.currentRoute.value.query['userId']` unguarded, so with
  no query it posts to `/auth/resend-confirmation-email/undefined` (which is how `B5`'s repro produced
  its failure); and both success buttons are `color="main"` (`ConfirmEmailView.vue:9`,
  `ConfirmEmailChangeView.vue:9`) — `bootstrap/theme.ts` defines no `main`, so Vuetify emits
  `bg-main`, no such class exists, and the *Go to login* button after a **successful** confirmation
  renders with no fill. Unobserved (success needs a real token), one outcome. Both `console.log(error)`
  lines (`:57,71`, `:58`) are `F38`'s pre-empt.
- **Fourteenth pass — unit 15's round 2 re-drove `B4` and now agrees with this batch:** the
  *"persistent explanation"* on `ConfirmEmailChangeView` was the snackbar mid-fade
  (`confirm-email-change--mutation-recheck.png` shows the steady state: one button), both views are
  bare, and `B5`'s `/resend-confirmation-email/undefined` request was observed on the wire — it answers
  **401** (the API's `FallbackPolicy` on an unmatched `{id:long}` route, not an auth decision) and drags
  a `/auth/refresh` behind it (`FW21`). The `userId` guard below removes that trigger. One more detail from
  the same round, adjacent and folded: a no-params visit posts `API.post('/auth' + fullPath)` with **no
  body**, which the server answers **415**, not 404 — so the initial-confirm `catch` sees a media-type
  error for a missing token. Guard it the same way: no `userId`/`token` in the query → render the error
  state without posting at all (the shape `FW9`'s reset view takes for a bad link).
- **Why `U6` is not a defect:** the unit reasoned that `showFullScreenLoading()` on mount with no
  `hideFullScreenLoading()` in either `catch`, and an interceptor that hides only on success, should
  strand the spinner on any error — and then honestly reported that three live attempts never showed
  one (four, after round 2 — and the unit still lists `U6` as open; it has not read §64). The missing piece is `SnackbarComposable.ts:43-46`: `showSnackbar` calls
  `hideFullScreenLoading()` unless `dontHideFullScreenLoading` is set, and both views'
  `catch` blocks call `showErrorSnackbar` first. The spinner is hidden by the snackbar, on every
  error, by design. Dropped; the unit's "inconclusive, not negative" was the right thing to write.
- **Files:** `ConfirmEmailView.vue:2-28,54-73`; `ConfirmEmailChangeView.vue:2-26,55-59`;
  `user.{sk,en}.ts` (`authorization` block)
- **What to change:** In both error branches, a persistent line above the button(s) reusing the key
  each view already snackbars — `authorization.errorConfirmingEmail` / `authorization.errorConfirmingEmailChange`
  — then a *Go to login page* button on `ConfirmEmailView` too (`authorization.goToLogin`, `{ name:
  'login' }` rather than the literal `'/login'` at `:10,:21` of the sibling). On `ConfirmEmailView`,
  render *Resend confirmation email* only when `route.query.userId` is present — a link with no id has
  nothing to resend to — and replace `showErrorSnackbar('Error')` with a real key
  (`authorization.errorResendingConfirmationEmail`, new, both files). `color="main"` → `color="primary"`
  on both success buttons. Drop the two `console.log`s. Explicit `hideFullScreenLoading()` in each
  `catch` is optional — the snackbar does it — but writing it makes the view stop depending on a side
  effect of another composable, which is worth the one line.
- **Do not change:** `SnackbarComposable.ts:28`'s `|| 'Error'` fallback — a framework-wide default for
  callers that pass nothing, and the right fix there is a localized key in a batch of its own if it
  ever shows; here the caller stops passing a literal, which is the actual bug. Not the button colours
  `FW8` owns (`error` → `errorDark`) — if this batch lands first, leave `color="error"` and let `FW8`
  do it; if `FW8` lands first, do not undo it. Not the route-matching `API.post('/auth' + fullPath)`
  at `ConfirmEmailView.vue:50` — it forwards the mailed query string to the server as-is, which is the
  contract (`UserEmailSenderService.cs:52` builds `/confirm-email?userId=…&token=…`).
- **Verification:** `B4`'s and `B5`'s `Verify:` blocks: `/confirm-email` with no query → after the
  snackbar has gone, a sentence *and* a *Go to login page* button are on screen, **no** *Resend*
  button (no `userId`); `/confirm-email?userId=10001` with a bad token → sentence, *Resend*, *Go to
  login*; click *Resend* → `POST /api/auth/resend-confirmation-email/10001` (a real id, not
  `undefined`), and on failure a full sentence, not `Error`. `/confirm-email-change` with no query →
  sentence plus button. The `color="main"` fix has no local repro (needs a valid token) — a source
  read of the two lines is the check. Both locales.
- **Risk:** Low, two repos, visual. Every app on the framework gains a sentence and a button on two
  views most users see once.

## FW13. `RegistrationView` fails closed on an empty reCAPTCHA token — the one thing making local registration impossible — and its `catch` overwrites the server's message

> ✅ **Half landed, 2026-09-15 — the guard.** `vue_framework` `6157283` (bump `04c405e9`) deleted the
> `if (!recaptchaToken) { … return }` block; `RegistrationView.vue:138` now assigns the token as-is, with
> a comment saying why. Unit 15's round 2 had escalated `O1` to **`X2`** (`blocker`) on the same
> mechanism this batch described — the server accepts the empty token, the client refused to send it —
> and round 3 verified the fix: `POST /auth/register` → 200 through the real form, a throwaway account
> created, `/login` reached with the prefill (`U5` resolved as "working as coded"), and the 2FA dialog
> reached for the first time (`B8` → `FW14`). **What is still open:** the `catch` at `:163-166`
> (`handleHttpCodes(error.response?.status)` — the round-3 duplicate submit **did** answer 409, so the
> *"changed by someone else"* string is now one click away for anyone who registers twice), and `P1`'s
> two `target="_blank"`s (`:41,46` — unchanged in the commit). The `UseRecaptchaHandler.ts` doc sentence
> landed too (`docs/composables.md`). Read the body from *Adjacent, source-certain* on.

- **Scope:** **[framework]** `src/_common/modules/user/view/RegistrationView.vue:41,46,131-170`,
  `src/_common/modules/user/_locales/user.{sk,en}.ts`, `src/_common/composable/UseRecaptchaHandler.ts`
  (doc comment only) — submodule commit, then pointer bump
- **Closes:** `auth/O1` (**re-graded `opportunity` → `bug`**, §63), **`auth/P1`** (same file, below).
  **Unblocks** `auth/U1`, `auth/U5` and the enrollment half of `auth/U2` — see *Needs verification*.
- **Root cause:** The unit filed the Login/Registration disagreement as a policy question with two
  defensible answers. It is not, once the server is read. `AdhdTimeOrganizer/Program.cs:240-248`
  registers `LocalAlwaysPassRecaptchaService` whenever the test-seed gate is open — i.e. on exactly the
  machines this sweep runs on — and that class's own doc comment (`infrastructure/testSupport/LocalAlwaysPassRecaptchaService.cs:11-16`)
  states the assumption: *"A local developer has no v3 key pair, so the client sends an empty token
  and login fails …"*. `UseRecaptchaHandler.ts:63-77` says the same from this side: *"This is not a
  bypass. The token is verified server-side; an empty one fails there exactly as a forged one would."*
  Both sides have decided the server is the authority. `LoginView.vue:145` follows that decision;
  `RegistrationView.vue:136-140` does not — `if (!recaptchaToken) { showErrorSnackbar(…); return }`
  refuses to post, so on a machine where the server would accept the registration, the client
  declines it. That is the whole of why unit 15 could not complete a registration, could not reach
  the 2FA-enrolment branch (`U1`), could not see the login prefill (`U5`), and why unit 14 could not
  enrol 2FA either. Not a preference: a client-side check that contradicts the server's documented
  contract, with a measurable cost (three unverifiable findings across two units). Hence `bug`.

  **Adjacent, source-certain, same function:** the `catch` at `:166-169` is `handleHttpCodes(error.response?.status)`.
  The interceptor has already fired for that status *with the server's message* — `axiosConfig.ts:236-238`
  shows `serverMessage ?? httpErrors.conflict` for a 409 — and `handleHttpCodes` then calls
  `showErrorSnackbar` again with the status-only text, which `showSnackbar` (`SnackbarComposable.ts:47-55`)
  replaces the first with. So a duplicate address, which the server answers `409 "User already exists
  with this email."` (`BaseRegisterUserEndpoint.cs:74-80`), is shown to the user as *"This record was
  changed by someone else. Refresh the page and try again."* (`common.en.ts:15`); and a real reCAPTCHA
  failure, `403 "Recaptcha failed."` (`:66-72`), as *"You don't have permission to perform this
  action."*. Unobserved — no registration has been submitted locally — but there is no other path
  through those lines.
- **Files:** `RegistrationView.vue:41,46` (links), `:131-170` (submit); `user.{sk,en}.ts`;
  `UseRecaptchaHandler.ts:63-77` (add one sentence: callers must not gate on an empty token)
- **What to change:** Delete `:136-140` and assign the token unconditionally, as `LoginView` does.
  Replace the `catch` with `LoginView.vue:163-207`'s shape, or the smaller version it reduces to
  here: `_silent: true` on the request; `const status = error.response?.status; const generalErrors =
  error.response?.data?.errors?.generalErrors ?? []`; `409` → `showErrorSnackbar(t('authorization.emailAlreadyRegistered'))`
  (new key, both files — the server's English is not for the user); otherwise `generalErrors[0] ??
  handleHttpCodes(status ?? 0)`. Keep `hideFullScreenLoading()` where it is. **Folded in, same file:**
  `auth/P1` — add `target="_blank" rel="noopener"` to the two `RouterLink`s at `:41,46`; vue-router's
  click guard skips SPA navigation for a `_blank` target, so the legal page opens in a new tab and the
  half-filled form is untouched (the finding's own fix, confirmed against `RouterLink`'s `guardEvent`).
  The `authorization.recaptchaFailed` key stays — `LoginView` may want it for the server's 400 one day.
- **Do not change:** `UseRecaptchaHandler.ts`'s behaviour (resolve-to-empty is the documented,
  deliberate fix — 2026-09-13). Not the server. Not `open2FADialog` / the `recoveryCodes` handling at
  `:152-161` — that is `U1`, source-certain but rule 5 keeps it out until `FW13` makes it observable
  (the shape is written under *Needs verification*, six lines reusing `SecuritySection.vue:269-281`).
  Not the app-side `googleCalendar` or `user` glue.
- **Verification:** `O1`'s evidence, inverted: on the seeded local API, fill `/registration` with a
  throwaway address, both passwords, tick terms, submit → `POST /api/auth/register` **fires** (today it
  does not) and returns 200 → `/login` with the e-mail prefilled and the resend panel shown — which is
  `U5`'s verify block for free. Then submit again with the **same** address → 409 → snackbar
  *"An account with this e-mail already exists"* (or whatever the key says), **not** *"changed by
  someone else"*. `P1`: type an e-mail, click *Terms and conditions* → a new tab; the registration
  tab's field still holds the value. Reseed afterwards (`POST /api/test/seed`) — a new account is a
  mutation. Promote the draft spec's `fixme` at `e2e/tests/auth.draft.spec.ts:91` (`P1`); the one at
  `:104` (`U1`) becomes runnable here but is `FW14`'s to promote, and `:97` (`B2`) is `FW7`'s.
- **Risk:** Low, two repos, and it is a *loosening* on the client only: on any deployment with the real
  verifier, an empty token is still refused — by the server, with a 403 this batch now words
  correctly. The `_blank` links are a behaviour change for every app's registration page; a host that
  wants same-tab legal pages has no override, which is acceptable for two links whose whole problem
  was being same-tab.

## FW14. Registration's 2FA recovery codes are received and discarded — the settings-side enrolment already shows them, one file over

- **Scope:** **[framework]** `src/_common/modules/user/view/RegistrationView.vue:118-129,149-158`, a new
  `src/_common/modules/user/utils/recoveryCodes.ts` (lifted from `SecuritySection.vue:261-267`),
  `src/_common/docs/modules/user.md` — submodule commit, then pointer bump
- **Closes:** `auth/B8` (round 1's `U1`, **now browser-observed** in round 3 — the number the ninth pass
  reserved for exactly this)
- **Root cause:** Confirmed by direct read, and the unit's evidence is the response body itself.
  `validateAndSendForm`'s success branch (`:149-158`) tests `response.data.recoveryCodes` for truthiness
  and then calls `open2FADialog(response.data.qrCode)` — the codes are the *condition* and never the
  *argument*. `open2FADialog` (`:118-129`) opens `QrCodeFor2FABody` with `{ qrCodeImage }` only, awaits
  *Done*, and `goToLogin()`s. `QrCodeFor2FABody.vue:15` declares one prop. The server sends
  `{ twoFactorEnabled, qrCode, recoveryCodes: [5 codes] }` (`TwoFactorAuthResponse.cs`,
  `BaseRegisterUserEndpoint.cs:86-113`; round 3 read them off `response-body`), and after *Done* they
  exist nowhere the user can reach — a brand-new account whose owner loses the authenticator has no way
  back in. The settings-side enrolment solved this in `prompts/_done/user/framework/F1-2fa-recovery-codes.md`:
  `SecuritySection.vue:196-197` → `normalizeRecoveryCodes(data)` → `openRecoveryCodesDialog(codes)` →
  `RecoveryCodesBody` (`:269-281`, `persistent: true`, `hasCloseBtn: false`, *Done* to dismiss). F1 landed
  for the regenerate path and missed this one.
- **Files:** `RegistrationView.vue:118-129,149-158`; `utils/recoveryCodes.ts` (new — `normalizeRecoveryCodes`
  moved out of `SecuritySection.vue:261-267` so both call sites share it; `SecuritySection` imports it);
  `docs/modules/user.md` (the registration flow's description gains the second dialog)
- **What to change:** After `open2FADialog(qrCode)` resolves and before `goToLogin()`:
  `await openDialog({ component: RecoveryCodesBody, componentProps: { codes: normalizeRecoveryCodes(response.data) }, dialogProps: { title: i18n.t('user.recoveryCodes'), confirmBtnLabel: i18n.t('general.done'), hasCloseBtn: false, persistent: true, isSmall: false } })`
  — the `SecuritySection` call, verbatim, so the two enrolment paths render the same body with the same
  copy/download affordance. Order: QR first (the authenticator must be enrolled before the codes mean
  anything), codes second, then login. Adjacent, same branch: the `noRecoveryCodesReceived` and
  `noQrCodeReceived` arms (`:154,:157`) show a snackbar and **never navigate** — the user is left on a
  submitted registration form with an account already created; end both with `goToLogin()`.
- **Do not change:** `QrCodeFor2FABody` (it is the QR dialog; two responsibilities in one body is how
  the codes got dropped); `SecuritySection`'s own flow beyond the import; the server. Do not batch with
  `FW13` — same file, different finding, different reason (`FW15`/`FW2` precedent); one submodule commit
  may carry both if it says so.
- **Verification:** `B8`'s `Verify:` block — register a throwaway with *use 2FA* ticked → QR dialog →
  *Done* → **a second dialog listing five codes** with the copy/download control `RecoveryCodesBody`
  already has → *Done* → `/login` with the prefill. Then `/user/settings` → enable 2FA on a throwaway →
  confirm the settings path is unchanged. **Reseed after** — two accounts are mutations. Promote
  `e2e/tests/auth.draft.spec.ts:104`.
- **Risk:** Low, two repos. Every app on the framework gains a second dialog on 2FA registration — the
  one the settings page already shows, so no app's user sees a shape they have not seen.

## FW15. `MyDateInput` binds `$attrs` first, so every caller's `label` (and `hideDetails`) is discarded

- **Scope:** **[framework]** `src/_common/component/dateTime/MyDateInput.vue:10-16` — submodule commit,
  then pointer bump; **the pointer-bump commit must also fix one draft assertion** (below)
- **Closes:** `planner-day/B2`, and the unfiled twin unit 3 recorded as fact
  (`history-review/inventory.md:20`, `textbox "Date"` on the summary's *From* field)
- **Root cause:** Confirmed by direct read, and the finding's mechanism is exactly right. The component
  is `inheritAttrs: false` and spreads `v-bind="$attrs"` at `:11`, **then** binds `:label="$t('dateTime.date')"`
  at `:13` and a bare `hideDetails` at `:14`. Vue 3 merges bindings in template order, later wins, so a
  caller's `label` in `$attrs` is overridden by the generic one every time — and a caller's
  `:hideDetails="false"` likewise, which is the gap `HistoryDateRangeSelector.vue:31-32` already works
  around with a comment (*"MyDateInput hardcodes `hideDetails`, so the message cannot live under the
  field itself without a framework change"*). **Three call sites pass a label the user never sees**,
  not one: `CopyDayForm.vue:5` (*"Source date"* → "Date", the finding), and
  `HistoryDateRangeSelector.vue:17,25` (*"From"* / *"To"* → both "Date" — in custom-range mode two
  identically-named date fields side by side). `HistoryDetailView.vue:57` passes `dateTime.date` and
  is unaffected by accident. The same order also makes the component's `style` at `:15` win over
  `PlannerTaskDialog.vue:26`'s 200 px — style objects merge later-wins per key — so that dialog's
  width override is dead too; adjacent, unobserved, same one-line fix.
- **Files:** `MyDateInput.vue:10-16`; `src/_common/docs/components.md` if it documents the props
- **What to change:** Move `v-bind="$attrs"` to be the **last** binding on `<VDateInput>` — the
  finding's first option — so the explicit `:label`, `hideDetails` and `style` become defaults a
  caller can override. That is the whole fix and it is generic. Do **not** take the finding's second
  option (a `label` prop defaulting to `$t(…)`) unless the pass-through of `hideDetails` is also made
  a prop — half a fix leaves the comment at `HistoryDateRangeSelector.vue:31` true.
- **Do not change:** the chevrons (`FW2`); `dateShowArrows` / `density` props; the 150 px width as a
  default.
- **Verification:** `B2`'s `Verify:` block — the Copy Day dialog's field reads *"Source date"*; then
  `/activity-history` with *Range length* = *Custom range*: the two fields read *From* and *To*. Then
  **fix `e2e/tests/history-review.draft.spec.ts:28`** in the pointer-bump commit — it asserts
  `getByRole('textbox', { name: 'Date' })` on the summary header, which is the defect pinned as expected
  behaviour and will fail correctly the moment this lands; it should read `{ name: 'From' }`. Both
  locales.
- **Risk:** Low. Every `MyDateInput` in every app on the framework starts honouring attrs it silently
  dropped — a consumer that passed a `label` and then relied on "Date" rendering is not a real case.

## FW16. `CalendarGrid`'s "Days to show" and `DateRangePicker`'s mode/range configuration are private — expose them as optional models

- **Scope:** **[framework]** `src/_common/component/calendar/CalendarGrid.vue:21-30,166-167`,
  `src/_common/component/dateTime/DateRangePicker.vue:109-152` — submodule commit, then pointer bump
  (the bump carries `F44`)
- **Closes:** `planner-day/B3` (framework half)
- **Root cause:** The finding's expectation is sourced (P7, CLAUDE.md *URL State*) and its suggested
  fix is impossible where it points: `dayVisibility` is `ref<DayVisibility>('all')` at
  `CalendarGrid.vue:167`, bound to the toolbar `VSelect` and read by `visibleDayHeaders` — not a prop,
  not a model, not in `defineExpose` (`:283` exposes `dateRange` only). `DateRangePicker` takes `mode`
  as a one-way **prop** (`:111`, watched into a private `selectedMode` at `:130-137`) and holds the
  Duration fields (`:149-152`) and Range fields (`:140-141`) privately; only the *resolved*
  `{ start, end }` comes out as the model, and pushing a range back in is coerced to the current mode
  (`:261-275`). `CalendarGrid` passes `:mode="dateRangeMode"` (`:18`) and exposes nothing of the picker.
  So no consumer can round-trip what the toolbar shows — and both consumers noticed: unit 7 filed it,
  unit 3 recorded the identical gap on `/activity-history/calendar` and declined to file
  (`history-review/inventory.md:100-104`).
- **Not a default change (rule 4 does not apply)** — this is an additive API; every existing consumer
  keeps today's behaviour when it binds nothing. It is still its own batch because it is a framework
  API decision, and the shape is the fixer's call within these constraints:
- **What to change:** (1) `CalendarGrid`: `dayVisibility` becomes `defineModel<'all' | 'workdays' |
  'weekend'>('dayVisibility', { default: 'all' })`. (2) `DateRangePicker`: `mode` becomes a model
  (`defineModel<'range' | 'month' | 'duration'>('mode', { default: 'month' })` — a plain `:mode` prop
  keeps working, so `ActivityRangePicker.vue:32` and `CalendarGrid.vue:16-20` are untouched) and the
  configuration becomes one optional model, e.g. `v-model:rangeConfig` of
  `{ anchor, anchorDate, unit, quantity, rangeStart, rangeEnd }` (or two, split by mode — either is
  fine; one object is fewer bindings to forward). (3) `CalendarGrid` forwards both through to the picker
  (`v-model:dateRangeMode` replacing the prop, `v-model:rangeConfig`). Keep the internal `ref`s as the
  fallback when nothing is bound. Document all three in `src/_common/docs/components.md` in the same
  commit — the `CalendarGrid` entry is the one `FW6` also edits.
- **Do not change:** the `dateRangeChange` emit or `dateRange` expose — `PlannerCalendarView.vue:233`
  writes the latter during hydration and `F44` keeps doing so for month mode. Not the month/year
  sub-model (`MonthYearPicker` already has `v-model:month`/`v-model:year`; the month is covered by the
  existing `?month=` codec). Not the cell markup (`FW6`) or the arrows (`FW2`) — three batches touch
  this file family; sequence them or fold them into one submodule commit that names all three.
- **Verification:** No user-visible change on its own. In the pointer-bump commit `F44` binds the
  models; its verification is the observable one. Framework-side: `HistoryCalendarView` and
  `ActivityRangePicker` render and behave exactly as before with nothing bound — `Days to show` still
  filters columns, `Mode` still switches, the 31-day cap (`maxDays`) still validates.
- **Risk:** Medium only in surface — three components' props change shape (prop → model is
  backward-compatible in Vue 3.4+ `defineModel`, but a consumer in another app that *mutates* the
  `mode` prop from outside and expects the watcher at `:132-137` to re-seed the private ref should be
  checked). Two repos, two commits.

## FW17. `ActionBar` is centred on the viewport, not the content box — *Delete* is un-clickable under the nav drawer

- **Scope:** **[framework]** `src/_common/component/ActionBar.vue:35-41,52-59` — submodule commit, then
  pointer bump; CSS only
- **Closes:** nothing filed — and that is the point. The defect was **known before the sweep**
  (`e2e/tests/dayPlanner.spec.ts:203-224`, a 22-line comment on two `test.fixme`d specs that click
  *Delete*), was handed to unit 7 as brief item 2 (*"OPEN, NOT FIXED … needs the owner's call"*), was
  **re-confirmed live** by the unit (`planner-day/inventory.md:144`, *"re-confirmed visually at this
  viewport width — not re-filed as a new finding"*), and appears in no queue. A finding that three
  documents agree on and none owns is the thing a triage exists to catch. Evidence is observed, twice;
  it is batched.
- **Root cause:** Confirmed by direct read. `.action-bar` is `position: fixed; bottom: 20px; left: 50%;
  transform: translateX(-50%); z-index: 50` (`ActionBar.vue:36-41`). `left: 50%` on a fixed element is
  50 % of the **viewport**; Vuetify insets `.v-main` by the drawer's width through
  `padding-left: var(--v-layout-left)` (`VMain.css:5`), so the bar sits ~144 px left of the content's
  centre with the drawer expanded, and its leftmost action — the planner's *Delete* — ends under the
  drawer, whose inline `z-index` is `1000 + …` from the layout composable (`composables/layout.js:7,200-209`)
  and outranks `50`. Pointer events go to the drawer.
  Five consumers, all in `dayPlanner` (`SelectionActionBar`, `BulkSelectActionBar`,
  `ApplyTemplateActionBar`, `UseTemplateActionBar`, `DayPlanner.vue`); any other app on the framework
  with a permanent drawer has the same offset. Playwright's `toBeVisible()` passes on the occluded button
  (layout, not occlusion), which is why the presence specs pass and only the two click specs fail — the
  spec comment says so, and it is worth keeping.
- **What to change:** Centre on the content box without JavaScript: Vuetify writes
  `--v-layout-left` / `--v-layout-right` onto `.v-layout` (`composables/layout.js:144-145`), and the bar
  is a descendant, so `left: calc(50% + (var(--v-layout-left, 0px) - var(--v-layout-right, 0px)) / 2)`
  keeps `translateX(-50%)` and the two transition rules (`:52-59`) untouched and follows the rail
  toggle for free. The fallbacks keep the current behaviour in an app with no `.v-layout` ancestor
  (rule: default to today when nothing is registered). Alternatively raise `z-index` above the drawer
  — **rejected**: it would draw the bar over the drawer instead of beside the content, and the drawer's
  own overlay is deliberately higher than page chrome.
- **Do not change:** the mobile `@media (max-width: 600px)` block (the drawer is temporary there and
  `--v-layout-left` is `0px`); not `useActionBarFocusReturn` / `migration-revision.md` §11 — that is
  the bar's *focus* ask, a separate framework item.
- **Verification:** Un-`fixme` the two click specs in `e2e/tests/dayPlanner.spec.ts` and run them at
  the suite's 1280×720; then by eye on `/day-planner/<today>` with the sidebar expanded **and** rail:
  the bar is centred in the white area both times and every action is clickable. `_shell`'s rail
  toggle is the control to flip. `playwright-cli` can prove occlusion the way the spec cannot:
  `document.elementFromPoint(x, y)` at the *Delete* button's centre must be the button, not
  `.v-navigation-drawer`.
- **Risk:** Low — one `left` declaration — but it ships to every app on the framework that mounts an
  `ActionBar`, and an app whose `.v-layout` has a *right* drawer moves the bar the other way, which is
  correct and worth saying in the commit message.

## FW18. `useEntityQuery.fetchById` cancels a sibling id — the 2026-09-11 `useFetchFiltered` bug, one helper over

- **Scope:** **[framework]** `src/_common/api/useEntityQuery.ts`, `src/_common/docs/api.md`
  (submodule commit + pointer bump); app-side in the pointer-bump commit: `prompts/_common/api/A1-request-key-for-sibling-fetch-helpers.md:129-131`
  and CLAUDE.md's `_common/api/` bullet
- **Closes:** the framework half of `planner-templates/X1` (`F50` is the app half; `X1` itself closes
  when the dialog renders, which `F50` achieves without this)
- **Root cause:** `useEntityQuery.ts:29-42` — one `AbortController` per **method**, `fetchById` calls
  `fetchByIdController?.abort()` before every request regardless of the id. That is right for a detail
  view switching ids (latest wins) and wrong for two ids fetched concurrently from one instance: the
  first rejects with `CanceledError`, and `Promise.all` over the pair rejects — exactly the shape
  `useFetchFiltered` had until 2026-09-11 and now documents in its own `requestKey` doc-comment
  (`useFetchFiltered.ts:15-40`, which even uses "a fan-out over ids" as its example). **Two documents
  say this helper does not have the problem, and both are wrong** (*Contradictions* §85):
  `prompts/_common/api/A1:129-131` — *"Do not add `requestKey` to `useEntityQuery`. It already holds
  a separate controller per method … which is the same idea expressed differently"* — conflates
  per-method with per-call, and CLAUDE.md's `_common/api/` bullet lists the three filtered helpers as
  the ones that "still hold a single controller per instance" and omits this one. The unit's finding
  cites *"CLAUDE.md's own documented gotcha"* for `useEntityQuery`; CLAUDE.md documents no such thing,
  which is how a component written after the `useFetchFiltered` fix reintroduced the bug — the author
  was told this helper was safe.
- **Files:** `useEntityQuery.ts:29-42` (`fetchById`; `fetchByField` `:44-59` is the same shape and
  should take the same option — `fetchAll`/`fetchSelectOptions` take no id and are genuinely
  latest-wins), `src/_common/docs/api.md`; `A1:129-131`; CLAUDE.md `_common/api/` bullet
- **What to change:** **Additive, default-preserving — not a semantics change (rule 4 does not bite).**
  Copy `useFetchFiltered.ts:13,47,54-58,71-76` — a module-level `Symbol` default key, a `Map<key,
  AbortController>`, an optional third argument `{ requestKey }` on `fetchById` (and `fetchByField`),
  identity-guarded cleanup in `finally`. Omitting the key must reproduce today's abort-previous
  behaviour exactly, so every existing caller is untouched. **Do not key by `id` by default** — it
  looks like the obvious fix, but a detail view that switches ids fast today gets the stale response
  cancelled for free, and keyed-by-id it would get both responses in arrival order; that is a
  behaviour change every app would inherit, and it is what rule 4 exists for. Then: update
  `src/_common/docs/api.md` in the same submodule commit; in the pointer-bump commit, rewrite
  `A1:129-131` to say `useEntityQuery`'s per-method controllers are *latest-wins per method* and
  `fetchById`/`fetchByField` now take `requestKey` like the others, and add `useEntityQuery` to the
  CLAUDE.md bullet's list of helpers that abort their previous call. `F50`'s workaround comes out in
  the same pointer-bump commit.
- **Do not change:** the abort itself (`A1` constraint 3 — scope it, do not remove it);
  `useRequestState.run`'s cancellation re-throw (`:45`) — it is what lets a keyed caller tell a
  cancel from a failure, and `isRequestCanceled()` depends on it.
- **Verification:** unit-level in the framework: two `fetchById`s with distinct keys from one instance
  both resolve; two with the same key (or no key) — the first rejects with a cancel; the map is empty
  after both settle. App-level: `F50`'s `requests` check after the pointer bump, with the workaround
  removed. Grep `src/` for other `Promise.all([…fetchById` / `fetchByField` — this pass found only the
  dialog, but the check is cheap and it is the class, not the instance, that ships.
- **Risk:** Low — opt-in, and `useFetchFiltered` has carried the identical shape since 2026-09-11 with
  no regression. It does ship to every app on the framework; the `Symbol` default is what makes that
  safe.

---

## FW19. `extractServerMessage` prefers the generic `message` over the specific `errors` — every validation snackbar in the app reads "One or more errors occurred!"

- **Scope:** **[framework]** `src/_common/axiosConfig.ts:86-101` — submodule commit, then pointer bump
- **Closes:** `activity-settings/B9`
- **Root cause (source-verified):** `extractServerMessage` returns on the first non-empty of `data`
  (string) → `detail` → **`message`** → `errors[first list][0]`. FastEndpoints' validation shape is
  `{ statusCode, message: "One or more errors occurred!", errors: { field: ["…"] } }` — `message` is
  always present and always generic, so the `errors` branch is unreachable against this API. The
  mutation pass read two real messages the user never saw: `errors.color` → *"Color must be a valid hex
  color code…"* (§11) and, on the system-role delete, `errors.generalErrors` → *"This is a system role
  the app files quick-created activities under, so it cannot be deleted. You can rename it instead."*
  The same function feeds `useRequestState.run`'s `error.value` (`useRequestState.ts:47-48`), so every
  composable's error string is generic too. `todo-routine/B9`'s per-call-site `_silent` workaround exists
  partly because of this.
- **Files:** `src/_common/axiosConfig.ts:86-101`; `src/_common/docs/api.md` if it documents the
  extraction order
- **What to change:** Try `errors` **before** `message`: if `errors` yields a string, return it;
  otherwise `detail`, then `message`. Keep the 500 branch's `errorId` handling as is — it reads
  `message` deliberately (`:239-249`) and a 500 body has no `errors`. Consider a field-aware variant
  (`"<field>: <text>"`) only if another app wants it; this batch is the order swap.
- **Do not change:** `handleHttpCodes` (`ErrorHandlingFunctions.ts`) — it never reads the body and
  is not this bug; escalation §7's "carry the error *type*" ask is the separate improvement.
- **Verification:** `B9`'s `Verify:` block — trigger the role-colour 400 (until §11 lands it is one
  click away) and the system-role 409; both snackbars show the specific text. Then a 500 with an
  `errorId` still shows the id.
- **Risk:** Low, but framework-wide: every app on a backend whose `errors` map holds technical strings
  will now surface them. On this backend they are authored prose; say so in the commit.

## FW20. `useTableFormatters`' substring heuristics misclassify columns — `durationMinutes` is a percentage, `inspirationSource` is a dash

- **Scope:** **[framework]** `src/_common/composable/table/useTableFormatters.ts:4-33` — submodule
  commit, then pointer bump. **Decision first** (word-boundary/segment matching vs. opt-in auto-format).
- **Closes:** `leisure-backlog-picker/B1` (+ one unfiled: the *Inspiration source* column on
  `/leisure/bucket-list` renders **"—"** for the seeded row whose value is *"A friend's climbing
  photos"* — §96)
- **Root cause (source-verified):** `isPercentKey` is `['percent','rate','vat','ratio','discount'].some(kw => lower.includes(kw))`
  (`:6,30-33`); `isCurrencyKey`, `isDateKey`, `isBooleanKey` are the same shape. `DataTable.vue:33-61`
  applies them to every column without a consumer slot. Tested against all **105** `TableColumn` keys in
  this app this pass: `durationMinutes` → `ratio` → `formatPercent(45)` = *"45.00 %"* (the finding);
  `inspirationSource` → `ratio` → `formatPercent("A friend's…")` = *"—"* (`:41`, non-number → dash), no
  slot in `BucketListTable.vue` (`:19-43` slot five other columns); `expectedCostTier` → `cost`, shielded
  by a slot. The framework's **own** `JobRunHistory.vue:90,99` slots exactly `durationSeconds` (`ratio`)
  and `errorSummary` (`sum`) — the trap was hit inside the framework and worked around rather than
  fixed. Unit 12 listed *Inspiration source* as a rendered column and did not notice its content was a
  dash; the seed says the row has text.
- **What to change:** Match on camelCase segments / word boundaries (`durationMinutes` → `duration`,
  `minutes`; `inspirationSource` → `inspiration`, `source`), or make auto-format opt-in per column
  (`TableColumn` gains a `format` hint, default `raw`). The first keeps zero-config and is a smaller
  diff; the second is honest. Either way, add a unit test that feeds every keyword-containing
  non-match (`duration`, `elevated`, `candidate`, `update`, `assumption`) and asserts `raw`.
- **Do not change:** the app's tables — no per-table slots as a workaround (see the ordering note
  above), and no rename of `durationMinutes` (it is the wire field).
- **Verification:** `B1`'s `Verify:` block (*"45"*, no percent) **and** `/leisure/bucket-list`'s
  *Inspiration source* showing the seeded text; then every `DataTable` consumer in this app that relies
  on auto-format — the tracker mapping tables (`isActive`/`isIgnored` booleans), `RoutineSettingsView`
  (`isHidden`), `ActivityTable` (`isUnavoidable`) — still renders its icons; and the framework's
  `JobRunHistory` unchanged. Both locales.
- **Risk:** Medium, framework-wide: loosening the match can un-format a column that another app named
  `vatRate`; tightening it to segments keeps those. Prefer segments.

## FW21. The interceptor's `AUTH_ENDPOINTS` allowlist names the signed-in auth routes and none of the signed-out ones

- **Scope:** **[framework]** `src/_common/axiosConfig.ts:63-65` — submodule commit, then pointer bump
- **Closes:** `auth/B7` — **re-graded `bug` → `polish`** (§110)
- **Root cause:** Confirmed. `AUTH_ENDPOINTS = ['/auth/refresh', '/auth/login/2fa', '/auth/login',
  '/auth/microsoft-sign-in', '/auth/logout']` and `isAuthEndpoint()` is `url === path ||
  url.endsWith(path)`, so a 401 from `/auth/register`, `/auth/forgotten-password`, `/auth/confirm-email`
  or `/auth/resend-confirmation-email/{id}` takes the refresh-and-retry branch (`:180-199`) while no
  session exists: `POST /auth/refresh` → 401 → `logoutClient()`, which returns at its first line because
  `auth.isAuthenticated` is already `false` (`:171-172`) → the original rejection. The unit observed the
  pair on `B5`'s `/resend-confirmation-email/undefined`. **Why that 401 exists at all:** `undefined` does
  not match `{id:long}`, the route is unmatched, and the API's authorization `FallbackPolicy` answers
  unmatched paths with 401 (README, *Test data*) — it is not the endpoint saying anything. `FW12`'s
  `userId` guard removes the only observed trigger; the allowlist gap remains for any future 401 from a
  signed-out route, and the cost of it is one wasted request and one console line. No user-visible
  effect, hence `polish`. `FW9`'s *Do not change* on this list stands for the two endpoints it names
  (neither answers 401); this batch is the class, not those two.
- **What to change:** Either extend the list with the four signed-out paths (matching
  `/auth/resend-confirmation-email` by prefix, since it carries an id), or replace the `endsWith` test
  with "starts with `/auth/`" and keep the list as documentation of which ones exist. The second is
  smaller and cannot drift again; check that no `/auth/*` route is ever called **signed in** with an
  expectation of refresh — `/auth/logout` is in the list already, so the answer is no.
- **Do not change:** the refresh branch itself, or `logoutClient()`'s signed-out early return — that
  return is what makes this harmless.
- **Verification:** `B7`'s `Verify:` block after `FW12` has landed needs a different trigger (the
  `undefined` path is gone): `playwright-cli route "**/api/auth/forgotten-password" --status=401`, submit
  the form signed out, and confirm `requests` shows **no** `/auth/refresh`. Then sign in and confirm an
  expired-token refresh on a normal route still works — `CLAUDE.md`'s 401-burst paragraph is the check.
- **Risk:** None to behaviour; two repos. An app whose signed-out endpoints live under a different prefix
  gains nothing and loses nothing.

## Escalations (backend / outside this repo)

1. **Notification titles and bodies ignore the account locale** — `_shell/B1`. Still open, and **now
   confirmed on real data (2026-09-13)**. ~~Not re-testable on the current seed (zero notifications).~~ That
   was true of `e2e-v1`; the fixture now seeds six notifications across six kinds, and signed in as
   `primaryUser` — whose `locale` is **`EN`** — `/notifikacie` renders every title and body in **Slovak**:
   *"Blíži sa termín"*, *"Pripomienky"*, *"Obdobie sa čoskoro končí"*, *"Sústredenie skončilo"*. Only the
   fixture's own *"Testovacia notifikácia"* carries an English body, and its title is Slovak too.
   So this escalation rests on observed behaviour for the first time, not inference. Text is localized
   server-side at dispatch, so no `src/` change can fix it. The ask: resolve notification text
   against the recipient's locale preference at dispatch, or send a key + params and let the client resolve it.

2. **✅ RESOLVED 2026-09-13 (unit 10, round 4 — API source read) — it does not cascade; the delete is
   refused.** ~~Does deleting a routine time period cascade, and to what?~~ `RoutineTimePeriodConfiguration.cs:78-81`
   is `DeleteBehavior.Restrict` on `RoutineTodoListColl`; only `RoutinePeriodCompletion` cascades (its own
   history rows, nothing user-authored). The FK violation maps to a **409** (`DatabaseExceptionUtils.cs:26`
   → `EndpointHelper.cs:14`), pinned by `TodoListDeleteBehaviorTests.DeleteRoutineTimePeriod_WithItems_Returns409`.
   So CLAUDE.md's cascade rule does not apply and `BasicTable`'s inability to state a child count is moot
   *here* (the bypass of `useDeleteConfirmation` is still real, still framework, still a `FW` decision
   for a table whose delete *does* cascade — none found yet). What it left behind is the **message**: that
   409 rendered as *"changed by someone else — refresh"*, filed and fixed as `todo-routine/B9`, which is
   the one `todo-routine` item still awaiting a browser (*Needs verification*).

3. **✅ RE-SCOPED 2026-09-13 (same round) — a bounded design question, now a written ask, blocking
   nothing.** ~~A done-toggle advances `streak`/`lastCompletedAt` irreversibly, with no undo path.~~ Read
   against `RoutineResetService.UpdateItemStreak`: the increment is **once per cycle**, guarded by
   `AlreadyCountedThisCycle` and pinned by two tests, so repeated clicking cannot compound; `LastCompletedAt`
   moving is deliberate; the period-level streak is evaluated at reset from live state, so un-ticking
   before rollover costs nothing there. The irreversible part is exactly **+1 on one item, once**. Whether
   un-ticking inside the same cycle should give it back is
   `prompts/view-docs/backend/B9-routine-untick-streak-decision.md` (a decision, not a defect — not to be
   confused with finding `B9`). The client cannot act on it either way: streak fields are server-owned.

4. **✅ RESOLVED 2026-09-13 — the `activity` contract is settled; what remains is a client-side parse bug.**
   `prompts/view-docs/backend/_done/B6-profile-grid-activity-name.md` (now in `_done/`) carries the full
   answer. All three questions this entry raised are closed:
   - `activity.role.icon` / `activity.role.color` **is** the intended home — nested, not flattened. `category`
     is the same shape and is **nullable**. So **`F3`'s fallback is the permanent fix, not a shim**, and its
     direction is the server's own: `category?.icon ?? role.icon`, `category?.color ?? role.color`.
   - **All four grids agree.** Every one derives from `WithActivityResponse` and carries a full
     `ActivityResponse`, on both `…/grid` and `…/{id}`.
   - **`activity` does *not* carry `categoryName`.** Use `activity.category?.name ?? null`. The flat
     `{id, name, categoryName, icon, color}` shape still exists, but only on `/leisure/suggestion/draw`
     (`/leisure/pick`) — two different shapes under the same key, by route.

   **The client half is now fixed too (2026-09-13) — see `F3`.** `ActivityInfo.fromJson` reads the flat
   fields first and falls back to `category ?? role`, so it parses the grid shape and the draw shape with one
   code path. Still true and still worth heeding: `usageCount`, `canDelete` and `isOnTodoList` are
   structurally present on the nested activity but **left at their defaults** — do not read them off these
   rows.

   One behavioural consequence worth not designing against: an **archived** activity removes the row entirely
   from the three `Activity*Profile` grids (count included), while `memory-anchor` deliberately keeps its row
   and name. There is no such thing as a row with a blank or missing `activity`; treat one as a bug.

5. **✅ RESOLVED 2026-09-13 — `B7` answered in full; it leaves three client-side items, all in `src/`.**
   `prompts/view-docs/backend/_done/B7-grid-sort-key-audit.md`. §1 was fixed **by shape rather than by a
   remap** — `activity.name` resolves natively on all four profile grids, so the *Activity* header click on
   `memory-anchor/grid` no longer 500s, and the `activity.name → activityName` remaps were **deleted**
   (safe: bookmarked `?sortBy=activity.name:asc` URLs carry the key that now resolves natively). What lands
   on this side:
   - ✅ **FIXED 2026-09-13 — `BacklogTable.vue:11`.** Now `deleteConfirmationColumn="activity.name"`. This
     needed a **framework** change to work at all: `BasicTable.vue:211` indexed the row flat, so it resolves
     through `getNestedValue` now. Dotless keys are unaffected. See `F3`.
   - ✅ **Already satisfied — error handling distinguishes `400` from `500`.**
     `ErrorHandlingFunctions.ts:11` has had its own `case 400` all along, separate from `case 500`, so an
     unresolvable sort key (`InvalidSortKeyException` → `InvalidSortKeyMiddleware`) surfaces a snackbar rather
     than the old false empty state. **No change was needed**; verified by reading the switch, not in a
     browser.
   - ⏳ **Latent, no action taken: if a lookup column is ever made sortable, send `locationType.text`, not
     `locationType`.** None is currently sortable, so nothing to change today — this is a trap for the next
     person who makes one sortable.

     ⚠️ **And it is a worse trap than the API's reply implies.** Probed against the running API
     2026-09-13 on `activity-backlog-profile/grid`: `zzzNotAColumn` → **400** naming the key;
     **`locationType` → 500** (`errorId be94ee6d327f`); `locationType.text` → **200**. So the
     "unresolvable keys are 400 now" fix covers *unrecognised* keys only, **not keys that resolve to a
     non-scalar member** — which is precisely what a real column definition would emit. That case is still
     an opaque 500 behind a false empty state.

     **Re-probed and confirmed at the B2 close-out (2026-09-13, after the deploy):** `locationType` →
     **500** `errorId 13ae656a28ee`, `activity` → **500** `errorId 28962860a3af`, while `locationType.text`
     and `activity.name` → **200** and `energyDemandId` (a field present in every row but not sortable) →
     **400**. So this is not "B2's class is narrower than reported" — B2 *is* fixed for the class it names.
     This is a **second, distinct unhandled 500**, and B2's close-out reply names it in advance: *"If you see
     `errorId` in a body, that is still an unhandled 500 and is a different bug — report it."* Still not
     filed as a new ask here (the close-out runbook reserves that for the surface owner), but it is now an
     invited one, and this paragraph is the evidence to paste into it.

   Two smaller notes for whoever writes the specs: `activity` is **nullable** on the two tracker mapping
   grids, so an `activity.text` sort puts those rows nulls-last ascending / nulls-first descending — correct,
   not a bug. And the API flagged an **honest test gap**: its integration tests pin `periodKey` only as the
   sole sort key, so the multi-key splice (`[{rating,desc},{periodKey,desc}]` must order by rating first) is
   right by construction but unasserted. B7 §4's two-click combinations are the cheapest place to catch a
   regression, which makes this an **e2e ask on our side**, not a backend one.

6. **The activities grid filter's id fields have never matched between client and server** —
   `activity-settings/B1`. **Not** "the backend ignores `roleIds`/`categoryIds`", which is how the
   finding reads: those fields do not exist on the wire. Read at the source this pass:
   `ActivityFilterRequest.cs:27-28` declares **`RoleId: long?`** and **`CategoryId: long?`** —
   singular scalars — and `GridActivityEndpoint.cs:129-133` filters on them with `==`. The client has
   sent **`roleIds: number[]`** / **`categoryIds: number[]`** since at least the August module
   restructure (`git log -S roleIds` bottoms out at `540f9529`, 2026-08-07, with the list shape already
   in place), and no commit on either side has ever carried the other's name. System.Text.Json drops
   unknown members silently, so every id-filtered request has always returned the unfiltered list with
   a 200 and nothing anywhere said so. `A1-correctness-sweep.md` item 5 fixed the *binding* (the
   combobox now reaches the request body — the finding confirms that) and verified the request, never
   the rows.

   **This is a contract decision, not a one-side fix**, and the client cannot make it alone without a
   UI regression: the filter is a multi-select combobox with chips, and the URL state already carries
   comma-joined lists (`activitySettingsUrlParams.ts:67,69`), so narrowing the client to one id means
   changing the control, the param names and the bookmarks. **The ask:** add `RoleIds: long[]?` and
   `CategoryIds: long[]?` to `ActivityFilterRequest` and filter with `Contains` — two `Where` clauses,
   with the singular fields kept (or dropped, nothing on this side sends them). Then an integration test
   that pins the filter *field names*, since the failure mode here is a silent 200 and no test on either
   side could have caught it. Until it lands, `F18` should still be applied — it fixes what the client
   *sends*; this is about what the server *reads*.

7. **Client side closed 2026-09-14; the ask itself stays open, and is smaller than written.** Two corrections
   from the API source: `Text` is unique per account as well (`RoutineTimePeriodConfiguration.cs:13`), and
   **the bare 409 is a pinned contract** — `RoutineTimePeriodUniqueIndexTests` asserts `Conflict` for both
   indexes, so the first ask below (validate → 400) means changing that contract and those tests, which is a
   backend decision, not a client one. The client no longer needs it: `TimePeriodForm` validates name and
   length against the account's list before submitting (`e39c01c1`) and words the race-only 409 correctly
   (`todo-routine/B11`). What is still worth asking for is only the **second** bullet — the error *type* in
   the 409 body — and it is now a nicety for the framework interceptor, blocking nothing.

   **A time period's `lengthInDays` is unique per account, and the API says so as a bare 409 from the
   database index** — `todo-routine` round 5, found in passing while setting up `B9`'s retest. Confirmed
   at the source this pass: `RoutineTimePeriodConfiguration.cs:79` is
   `HasIndex(t => new { t.UserId, t.LengthInDays }).IsUnique()`, so a second 7-day or 30-day period is
   refused — round 5 hit it twice, body *"Unique constraint violation during Create"*, status 409. The
   client cannot tell that 409 from the concurrency one or from `B9`'s referential one:
   `ErrorHandlingFunctions.ts:23-25` switches on status alone and the body is never read, so the user is
   told *"This record was changed by someone else. Refresh the page and try again."* — and `TimePeriodForm`
   has already closed (`openAddDialog` awaits `openDialog` *then* calls `createWithResponse`,
   `RoutineSettingsView.vue:134-143`), so the typed form is gone with it. Two asks, in order of value:
   - **Validate it, don't let the index throw.** The endpoint already returns a 400 naming the field for
     other rule violations (`{"timePeriodId":["Time period not found."]}` is what round 5 saw on the item
     create), so a `lengthInDays` uniqueness check in the validator would surface as a normal field error
     the form can render inline, with the dialog still open. That is the same shape the create validator
     uses today, and it makes the client fix trivial.
   - **Carry the error *type* in the 409 body**, which is `B9`'s own "worth raising upstream" note: the
     server distinguishes `DbConcurrencyError` from `DbForeignKeyError` from `DbUniqueViolationError`
     (`DatabaseExceptionUtils.cs:16,25,27`) and flattens all three to a status code at the boundary. With the type on the wire, the framework's
     interceptor could word each correctly once, and `B9`'s per-call-site `_silent` pattern would not need
     copying to every endpoint that can answer 409 for a non-concurrency reason. This one is a framework
     change on the client side too (`ErrorHandlingFunctions.ts`), so it is a two-repo ask.
   The client-side half — what to do at this call site until either lands — is under *Needs verification*
   below, because the message on screen has not actually been observed; only the 409 has.

8. **Public-holiday names are a country table's proper nouns, stored as strings at row creation — there is
   no locale to key on, and no country preference to omit them by** — `history-review/B4`, re-graded
   `bug` → `polish` (*Contradictions* §30). Read at the source this pass: `CalendarDayFactory.cs:37` writes
   `HolidayName = HolidayCalendar.ForDate(date, countryCode)` when a `Calendar` row is created (seeder or
   lazy provisioner — both go through it), and `HolidayCalendar.cs:31-56` is a **Slovak** table of native
   names (`"Deň Ústavy Slovenskej republiky"`, `"Sedembolestná Panna Mária"`), with a Czech sibling
   (`:58-81`) and `DefaultCountryCode = "SK"` — *"the only country this app has ever seeded"* (`:11-12`).
   The column is `string?`, max 200 (`CalendarConfiguration.cs:20`); the History endpoint projects it
   as-is (`CalendarActivityEndpoint.cs:95`). So this is **not** the shell's `B1` shape (app text
   resolved in the wrong locale at dispatch) and should not be batched with it: the string is the
   holiday's *name*, in the language of the country whose holiday it is, and there is no English
   variant anywhere to have chosen instead. An EN-locale user in Slovakia arguably *should* see
   "Sedembolestná Panna Mária" — that is what the day is called. The finding's other pass condition
   (*"omitted for accounts outside Slovakia"*) has nothing to read: `User` carries no country, and
   `HolidayCalendar` is only ever called with the default.

   **The ask, if one is wanted, is a design decision with two halves and the client cannot take either
   alone:**
   - **A country preference** (`/user/preferences` — it describes the person, CLAUDE.md's ownership
     table) that `CalendarDayFactory` reads instead of the constant. Without it the "outside Slovakia"
     branch cannot exist. Note the re-materialisation problem: rows are created once, so a country
     change would need a backfill or the holiday column would need to become a *lookup* at read time
     (`HolidayCalendar.ForDate` is cheap and pure, so that is viable).
   - **If localized names are wanted at all**, store a stable key per holiday (`SK_CONSTITUTION_DAY`) and
     let each client resolve it through vue-i18n — the same *"send a key + params"* shape §1 asks for
     notifications. Native-name rendering is a defensible default and costs nothing; it just has to be a
     decision rather than an accident of `DefaultCountryCode`.
   Not blocking any unit. `CalendarGrid.vue:104` renders whatever arrives and needs no change either way.

   **Seen a second time from the other consumer (tenth pass) — `planner-day/B4`, merged here.** Unit 7
   read the same two strings off `POST /api/calendar/filter` on `/day-planner` (*"Deň Ústavy Slovenskej
   republiky"* on 2026-09-01, *"Sedembolestná Panna Mária"* on 2026-09-15) and filed them as `bug` with
   the same guess unit 3 made — *"batch with shell B1 in a backend localization session"*. Same
   re-grade, same reason: `bug` → `polish` (§30), not batched with §1, because the string is a proper
   noun with no locale to key on, not app text resolved in the wrong locale. Nothing new for the ask;
   the second observation just confirms both consumers render the column as-is. The finding's
   suggested fix (*"return a stable holiday key the frontend can map through vue-i18n"*) is the second
   bullet above, already written. `planner-day.draft.spec.ts:48` is a `fixme` on this and should stay
   one until the decision is taken — it is not a regression test for a defect, it is a placeholder for
   a policy.

9. **The Google Calendar OAuth flow cannot complete against this API, for three separate server-side
   reasons — and only the first is the one the unit saw** — `user-settings/B1`. The unit's evidence is
   exact (`GET …/auth-url` → 200, then Google's *"Missing required parameter: client_id"*) and its guess
   (*"a missing OAuth client ID in this dev environment"*) is right, but it is the first of three, and
   fixing it alone moves the failure one step later. Read at the source this pass, in the order a user
   would hit them:

   1. **The client id is empty, and the endpoint knows it and returns 200 anyway.**
      `AdhdTimeOrganizer/appsettings.json:19-23` is `"GoogleCalendar": { "ClientId": "", "ClientSecret": "",
      "RedirectUri": "http://localhost:5173/google-calendar/callback" }`; `appsettings.Development.json`
      carries no `GoogleCalendar` key (searched every `appsettings*.json`), so unless user-secrets fill it
      in — and the observed URL says they do not — `GoogleCalendarService.GetAuthUrl` (`:40-54`) builds
      `?client_id=&redirect_uri=…` from `Uri.EscapeDataString("")` and `GetGoogleCalendarAuthUrlEndpoint`
      sends it as a 200. **Two asks:** configure the id/secret for the dev environment (they have to be
      registered in the Google console against the redirect URI below, so this is not a one-line edit);
      and **refuse to hand out a URL that cannot work** — when `ClientId` is empty, answer a
      `503`/`notConfigured` (or expose `configured: false` on `GET …/status`) so the client can render
      *"not available here"* and hide *Connect*, instead of shipping the user to Google's error page. Note
      the adjacent trap: if the key were *absent* rather than empty, `Uri.EscapeDataString(null!)` throws
      and this is a 500 with an `errorId` — the empty string is what makes it a silent 200.
   2. **The redirect URI points at port 5173 over `http`.** The dev server is `https://localhost:3000`
      (`.env.development` `VITE_APP_URL`; CLAUDE.md's *Browser verification*), so once step 1 is
      configured Google will send the user, code in hand, to a port nothing listens on. It must match
      `VITE_APP_URL` + `/google-calendar/callback` **and** be registered in the console — Google rejects
      an unregistered `redirect_uri` with its own error page, which would read as a fourth bug.
   3. **The state cookie is set on a path the connect route can never match.** `GetGoogleCalendarAuthUrlEndpoint`
      appends `google-oauth-state` with `Path = "/user/google-calendar"` (`Secure`, `HttpOnly`,
      `SameSite=Strict`, 10 min), and `ConnectGoogleCalendarEndpoint` deletes it with the same path — but
      `Program.cs:622` sets `config.Endpoints.RoutePrefix = "api"`, so the browser's request is
      `POST /api/user/google-calendar/connect`, and a cookie scoped to `/user/google-calendar` is **not
      sent** to a path that does not start with it. `hasStateCookie` is therefore always `false` from a
      real browser and every connect is the *"OAuth state is missing or does not match"* 400. The API's
      own suite passes because `GoogleCalendarConnectionTests.cs:88-96` writes the `Cookie` header **by
      hand** — it never exercises path matching. Ask: `Path = "/api/user/google-calendar"` (derived from
      the prefix, not a second literal), and one test that round-trips through a `CookieContainer` so the
      path is actually matched. One more thing to confirm while there: `SameSite=Strict` is fine in dev
      (`localhost:3000` → `localhost:8080` is one site; ports do not count) — in production the app and
      API origins must share a registrable domain or the cookie will not ride the POST at all.

   **Order matters:** 1 makes *Connect* reach Google; 2 makes Google come back; 3 makes the return leg
   pass the state check; and **`F33` on this side must land before 3 can be verified**, because the
   client currently omits `state` from the body entirely. None of this blocks a unit — the
   `GoogleCalendarCallbackView` success path and the whole `googleCalendar` module's sync leg
   (`POST /calendar/{id}/sync-to-google`) stay unverifiable until all four land, which the unit's
   `usecase.md` already records. **Do not write a backend prompt file for this** (the implementer does —
   the convention is in `prompts/_done/user/backend/README.md`, and the finished asks sit in
   `prompts/view-docs/backend/_done/`); this paragraph is the evidence to paste into it.

10. **The four pie-chart endpoints emit their tail bucket as a literal `"Other"` row; the four
    stacked-bars endpoints emit `"_other"` — and the client only understands the second.**
    Source-certain, **unobserved** (found reading `B2`'s data path in the eleventh pass; the unit did
    not file it and the seed may have no sub-1 % slice to show it). `WebExtensionPieChartEndpoint.cs:88`
    (`Domain = "Other"`), `DesktopPieChartEndpoint.cs:81-82` (`ProcessName`/`ProductName = "Other"`),
    `AndroidPieChartEndpoint.cs:79-80` (`PackageName`/`AppLabel = "Other"`),
    `UnifiedPieChartEndpoint.cs:21` (`OtherLabel = "Other"`) — versus `WebExtensionStackedBarsEndpoint.cs:81`,
    `DesktopStackedBarsEndpoint.cs:77-78`, `AndroidStackedBarsEndpoint.cs:113-114`, all `"_other"`.
    Every dashboard sends `minPercent: 1` (`ActivityDashboard.vue:149`, `DesktopActivityDashboard.vue:180`,
    `AndroidActivityDashboard.vue:170`), so the row is produced whenever anything falls under 1 %.
    On the client, `ActivityPieChart.vue:62,96,144,150` recognises **only `_other`** — translates it
    (`activityTracking.common.other`), and refuses to select it. The literal `"Other"` is therefore
    (a) an untranslated English legend entry in SK, (b) a selectable slice — `?selected=Other`, a
    desktop `process-details?processName=Other` request, and after `F47` an Android panel titled
    *Other* — and (c) on the web dashboard, where `ActivityPieChartSection.vue:119-140` *also* buckets
    below 3 % client-side into `_other`, potentially **two "Other" legend entries** when the server's
    bucket sums to ≥ 3 %. The ask: emit `_other` from the pie endpoints as the stacked-bars ones already
    do (one constant, four files), so the sentinel is one contract. The client-side alternative — stop
    sending `minPercent` and bucket locally on all four sections the way the web one does — is more
    code for the same result and leaves the server's `MinPercent` branch dead; not recommended, but
    it is app-side if the backend declines. **What would settle whether it is live today:** `playwright-cli
    route "**/api/activity-tracking/android/pie-chart"` with a fulfilled body carrying one `"Other"` row,
    then read the legend and click the slice — or a seed app under 1 % of the span. Until then, `F47`
    guards the row locally (its *What to change*), which is a shim to remove when this lands.

11. **Creating or editing any Role, Category or To-do-list category is refused: the validator demands
    a hex colour, and the palette — on both sides, including the server's own seeder — is names** —
    `activity-settings/X1` (`blocker`), observed on Create and on a no-change Edit of a seeded role.
    Read at the source this pass, and the side that owns the format is not in doubt:
    - The client's `ColorPicker.vue:31` writes `color.name` — `"rose"`, `"emerald"` — from
      `COLOR_PALETTE`, and every renderer resolves that name to a theme-aware `{bg, text}` pair
      (`color[currentTheme].bg`, `:29`). A hex string would lose the light/dark pairing.
    - The **server's own framework** declares the same names as constants —
      `framework/Sydowwe.Framework/domain/enum/ColorPalette.cs` (`Crimson = "crimson"` … `Slate`) —
      and the e2e seeder writes them (`E2eFixtureSeeder.cs:409-417`: `ColorPalette.Blue`,
      `ColorPalette.Emerald`, `ColorPalette.Violet`…). So every seeded role would fail its own
      validator on a round trip, which is exactly what the unit saw on *Health & Fitness*.
    - The validator, `NameTextColorIconValidator.cs:16-20`, is
      `.Matches("^#(?:[0-9a-fA-F]{3}){1,2}$")` and dates from **2026-05-16** (`a51309e`) — before the
      palette existed on either side (`colorPalette.ts` first appears 2026-06-22). It is the stale side.
    - It is shared: `ActivityRoleValidator`, `ActivityCategoryValidator` **and
      `TodoListCategoryValidator`** derive from it, so `/todo-list`'s category create/edit
      (`TodoListCategoryForm.vue:18`, same `ColorPicker`) is broken by construction — unit 9's inventory
      (`:28`) recorded that path as *not separately tested*. `RoutineTimePeriodValidator` has no colour
      rule and `TaskImportanceValidator` only caps length, which is why routine periods create fine.
    - One more thing the ask must carry: the column is **`character varying(7)`**
      (`EntityFieldLengths.Color = 7`, applied by `NameTextColorEntityConfigurationExtension.cs:33,39`,
      `Initial.Designer.cs:714,782`) and `"burgundy"` is eight characters. Relaxing the regex alone
      leaves one swatch that cannot be saved.

    **The ask:** replace the regex with membership in `ColorPalette` (a `Must(c => ColorPalette.All.Contains(c))`
    with a message naming the accepted set), widen `EntityFieldLengths.Color` past the longest name
    (with the migration), and pin the field's contract with a test that posts a palette *name* —
    `NameTextColorIconValidationTests.cs` currently posts `#abcdef` everywhere (`:46,68,88,93`). No
    client change. The alternative — a hex-emitting `ColorPicker` mode — is a `vue_framework` change
    that would still leave every stored name invalid on re-save, and it is not recommended. `FW19`
    is what makes this failure *legible* meanwhile (the user currently sees the generic string).
    **Do not write a backend prompt file for this** — the implementer does; this paragraph is the
    evidence to paste.

    **Observed from the `/todo-list` side too (fourteenth pass) — `todo-lists/X1`, `blocker`, merged
    here.** Unit 9's mutation round submitted the *New category* dialog three times (`"color":"default"`,
    `"color":"blue"`, and again) and got the same
    `"Color must be a valid hex color code (e.g. #FFFFFF or #FFF)"` 400 each time — the shared-validator
    consequence the paragraph above predicted by construction, now with screenshots
    (`todo-list--mutation-category-create-400-no-feedback.png`). The unit filed it as **`[framework]`**
    with the suggested fix *"change `ColorPicker`'s `model` to the swatch's hex value"* — that is the
    rejected alternative, and the attribution is the wrong side (§99): the server's own `ColorPalette`
    constants and seeder write names, the routine-period form ships `"color":"blue"` and gets 201
    (`todo-routine/B11`'s colour aside, verified), and only the three `NameTextColorIconValidator`
    subclasses refuse them. Two more things the observation adds to the ask: the dialog **closes on
    submit** before the caller's request fails (the close-then-call shape, `F53`(c)/`F70`), so the typed
    name is lost with the 400; and the default swatch is `"default"` — a name the validator will also
    have to accept, or `ColorPicker`'s `required` prop (framework `98b92d0`) should be passed here as it
    is on the time-period form. Both are app-side follow-ups for after the validator lands, not reasons
    to touch the picker.

12. **`GET /memory-anchor/anchor-eligible-activities` does not exist** — `leisure-bucket-anchors/X3`
    (`blocker`). The unit's guess was route ordering (*"shadowed by a generic `/{id}` route"*). Searched
    the whole API this pass: no endpoint file under `endpoint/memoryAnchor/` declares it
    (`GetById`, `GetSelectOptions`, `Grid`, `Create`, `Update`, `Delete`, `BatchDelete` — that is the
    list), and the string `anchor-eligible` appears in **no `.cs` file**. The 400 body
    (*"Value [anchor-eligible-activities] is not valid for a [Int64] property"*) is
    `GetByIdMemoryAnchorEndpoint` catching the path, which is what absence looks like from outside.
    `prompts/_done/leisure/backend/B1-backend.md:5` asserted the route *"already knows which activities
    qualify"*; it never landed. Until it does, the unlocked *Add* on `/leisure/memory-anchors` cannot
    create anything (the locked *"I did this"* path — `U1` — does not call it).

    **The ask:** implement it per `B1-backend.md`'s definition — the caller's activities that have a
    one-time backlog profile (`!IsRepeatable`) or a bucket-list profile and no memory anchor yet,
    projected as `SelectOption` (`{ id, text }`), scoped by user, archived activities excluded — and
    decide the question `B1-backend.md:63` left open (whether an already-anchored activity stays
    listed; the client's *"I did this"* flow suggests **no**). `F62` is the client half and lands
    regardless.

13. **The four leisure profile grids' filter contracts have never matched: the client sends 27 filter
    fields, the server reads 8** — `leisure-backlog-picker/X1` (`blocker`, re-graded — §89),
    `leisure-bucket-anchors/B1` (three of its five cases; the other two are `F60`). This is escalation
    §6's shape (`roleIds` vs `RoleId`) on four more endpoints, and both units misdiagnosed it from the
    browser: unit 11 saw a filter "work on two requests and fail on one" and blamed a sort/filter
    interaction; unit 12 saw five fields "ignored" and one "working". Read against
    `AdhdTimeOrganizer.ActivityProfiles/application/dto/filter/*` and each grid's
    `ApplyCustomFiltering` this pass:

    | grid | client sends (`src/core/leisure/dto/request/*Filter.ts`) | server reads |
    | --- | --- | --- |
    | `activity-backlog-profile` | `activityName`, `locationTypeIds[]`, `weatherDependencyIds[]`, `energyLevels[]`, `effortTypes[]`, `expectedCostTierIds[]`, `maxDurationMinutes`, `minParticipants`, `maxParticipants`, `isRepeatable`, `isAnchored` | `EnergyLevel` (scalar), `EffortType` (scalar), `IsRepeatable`, `IsAnchored` |
    | `activity-bucket-list-profile` | `activityName`, `experienceTypeIds[]`, `minComfortZoneStep`, `maxComfortZoneStep`, `requiresTravel`, `isAnchored` | `RequiresTravel`, `ComfortZoneStep` (exact), `IsAnchored` |
    | `memory-anchor` | `activityName`, `year`, `month`, `minRating` | `AnchorMonth`, `AnchorYear`, `ActivityId` (→ `F60` renames the two the client got wrong) |
    | `activity-project-profile` | `activityName`, `difficultyLevels[]`, `readinessStatuses[]`, `projectArea`, `isMessy` | `DifficultyLevel` (scalar), `ReadinessStatus` (scalar), `IsMessy`, `ProjectArea` |

    `IFilterRequest` is an empty marker and `BaseGridEndpoint` applies nothing generic
    (`BaseGridEndpoint.cs:124-125` → `ApplyCustomFiltering` only), so **`activityName` filters on none of
    the four** — every *Activity* filter chip, every `?activityName=` bookmark, and the memory-anchor
    table's source-chip navigation (`MemoryAnchorTable.vue:125` pushes `{ activityName }` to the source
    view) have always returned the unfiltered grid with a 200. The list-vs-scalar fields (`energyLevels`
    vs `EnergyLevel`) are dropped by name, not coerced. Unit 12's *"activityName confirmed working"* has
    no mechanism and is contradicted by source (§90); unit 11's two "correct" count requests were zero
    for an unrelated reason (§89).

    **The ask:** adopt the client's field names on all four filter records — `ActivityName` as a
    case-insensitive `Contains` on `Activity.Name`; the `*Ids[]`/enum lists as `Contains`; the ranges
    (`Min/MaxComfortZoneStep`, `MaxDurationMinutes`, `Min/MaxParticipants`, `MinRating`) as
    comparisons — keep the existing scalars if anything else sends them, and **pin the field names
    with an integration test per grid**, because the failure mode is a silent 200 and no test on either
    side can catch it otherwise (§6's ask, verbatim). Nothing changes client-side when it lands:
    `hasAny()`, the chips and the URL codecs already carry every field. The client-side alternative —
    hiding the unread inputs — is a product regression for a contract gap and is not recommended.
    `leisure-backlog-picker/X1`'s `Verify:` block is the acceptance test for the `activityName` half.

14. **An unconfirmed account's correct password is answered `401 "Invalid email or password"`, never the
    `403 "Email not confirmed"` the sign-in flow was written to send** — `auth/B6` (`bug`, observed twice
    on two throwaway accounts in unit 15's round 2). The unit's guess (*"the server no longer signals it"*)
    is half right: the server **has** the branch and never reaches it. Read at the source this pass:
    `framework/Sydowwe.Framework/application/service/auth/PasswordSignInFlow.cs:105-106` returns
    `EmailNotConfirmed` (→ 403, `:47`) with the comment *"checked after password verification so the
    answer can't be used to probe which addresses are registered"* — but it sits **after**
    `signInManager.CheckPasswordSignInAsync(user, password, true)` (`:83`), and the host registers
    `options.SignIn.RequireConfirmedEmail = true` (`IdentityServiceExtensions.cs:121`). ASP.NET Identity's
    `CheckPasswordSignInAsync` runs `PreSignInCheck` → `CanSignInAsync` **before** it verifies the
    password, and with that option set an unconfirmed user gets `SignInResult.NotAllowed` back — which is
    `!result.Succeeded`, so `:95-101` answers *"Invalid email or password"* and the flow's own check at
    `:105` is dead code for every deployment that sets the option. Two consequences: `LoginView.vue:185-193`'s
    dedicated branch (the `emailConfirmationNeeded` snackbar and the resend panel) is unreachable, and
    the password was never checked — so the lockout counter does not move either. **The ask:** verify the
    password with `userManager.CheckPasswordAsync` (and feed lockout with `AccessFailedAsync`) before the
    confirmation test, or test `result.IsNotAllowed` and map it to `EmailNotConfirmed` — the second is
    one line but answers 403 *without* having checked the password, which is the enumeration leak the
    comment at `:103-104` was written to prevent. Then a test that registers, does not confirm, and
    signs in with the right password expecting 403. This is a `Sydowwe.Framework` (backend) file, so it
    ships to every API on that framework. Nothing on this side changes; the client branch is already
    right. It also gates `auth/U2` — a 2FA login cannot be driven until an unconfirmed throwaway can be
    confirmed or the flow reaches the 2FA gate — and compounds with `FW9`: the natural next click for a
    user told "wrong password" is *Forgot password?*, whose mail still points at a route that does not
    exist.

15. **`POST /api/activity-history` accepts a zero-length row** — found reading `history-capture/B4`'s
    request. `ActivityHistoryValidator` is `RuleFor(x => x.Length).Must(x => x.TotalSeconds >= 0)`
    (*"Length must be non-negative"*); the round-2 body `{"length":{"hours":0,"minutes":0}}` was a 201
    (`id 15503`). A history record of nothing is not information on any read path (the dashboards sum
    it, the timeline draws a zero-width block, the calibration average divides by it), and `F67` is the
    client half — but a validator that stops at `>= 0` lets the next client (the desktop tracker's
    attribution sink, a future import) write it again. **The ask:** `> 0`, with a message the
    interceptor can show, and one integration test. Small, not blocking; `F67` does not wait on it.

## Needs verification (unverified findings, and what would settle each)

### Awaiting retest — code-fixed this cycle, never seen in a browser

Not a fix batch and not a defect list: these need one browser session running the named `Verify:` blocks.
**Rewritten in the fifth pass against `todo-routine`'s round 5** (2026-09-13, live, fresh `e2e-v3` seed):
five of the eight rows are closed, and what is left is two half-checks and one finding that has never
been seen in either direction.

| finding | what landed | round-5 outcome |
| --- | --- | --- |
| `todo-routine/A1` | counter carries `:title`/`:aria-label` on both branches; native `<button>` (`todo-lists/B6`) | ✅ **verified.** Real `mousemove` → 1 s dwell → `elementFromPoint` → `mousedown`/`mouseup` on both controls: *Increase 0 of 2* hit its `<button class="counter-increment">` and produced 1/2 (`PATCH …/toggle-is-done {forceValue:true}` → 204, no dialog); *Decrease 1 of 2* resolved to the decrease button on two separate items. The "mouse can decrement but never increment" hypothesis is dead against this build |
| `todo-routine/B3` | `RoutineToDoListForm.vue:28` → `routineTodoList.timePeriod` | ✅ **verified** — label *Time period*, console clean across the open |
| `todo-routine/B4` | `/routine-settings` + `TimePeriodForm` localized; `useAnchorDayOptions()`; `Intl.PluralRules` ordinal | ✅ **verified in SK** — *Časové úseky*, *PRIDAŤ*, all headers, *Pondelok* in the anchor column; ordinal `1` → "1." (SK) and `1`/`21` → "1st"/"21st" (EN). **One header stayed English — "Color" — and that is `F25`**, a different cause (empty title, not a literal) |
| `todo-routine/B6` | `routineTodoList.streakTooltip` / `.gracePeriodActive` | ✅ **verified in SK** — *"Séria: 12 · najdlhšia: 30"* read off the teleported tooltip. Undo-tooltip half not re-hovered; its label is the same computed `A3` verified |
| `todo-routine/A3` | `TodoListUndoBtn.vue:12` `:aria-label="label"` | ✅ **verified** — `aria-label: "Nothing to undo"` on the disabled button; enabled-state wording not exercised |
| `todo-routine/P1` | fixed `:width`/`maxWidth` replaced by a `minWidth` floor | ✅ **SK verified (round 7, 2026-09-14)** — *Celkový počet* in full, label `scrollWidth 101 === clientWidth 101` in a 377 px field. Both locales closed |
| `todo-routine/A2` | `BaseTodoListItemSteps.vue:11-13` `:title`/`:aria-label`/`:aria-expanded` | ✅ **verified (round 7)** on a temporary two-step Daily item: `Hide: Steps` / `aria-expanded=true` → click → `Show: Steps` / `false`, step list gone. Item deleted afterwards |
| `todo-routine/B9` | `RoutineSettingsView.vue:163-201` — `_silent` 409 → `deleteBlocked` / `deleteBlockedUnknownCount`, count fetched only in the failure path, row kept | ✅ **verified (round 7, 2026-09-14, exclusive account)** exactly as the runbook here prescribes: 11-day period + one item → Confirm → `DELETE …/17` **409**, snackbar *"Can't delete "RT eleven" — 1 routine is still assigned to it. Move or delete it first."*, row kept, count fetched in the failure path. Item removed → Confirm → **204**, row gone. Throwaway rows cleaned up. **And the dialog check it was merged with came back positive — see the section below** |
| *(unfiled)* | `TodoListStepsFormField.vue`'s four step controls now named, position-qualified | ✅ **swept (round 7)** — Add dialog with two steps: *Move step 1 up/down*, *Delete step 1*, *Move step 2 up/down*, *Delete step 2*, *Add step*; **0 unnamed** buttons in the dialog |
| `todo-lists/B3` | ✅ **fixed for real 2026-09-13** — it was *not* fixed silently: the round-2 edit moved the emit above the multi-count branch, so a row-body click on a counted item still stepped the counter *and* opened the dialog | closed; `Status:` line corrected; spec pins it |
| ~~`todo-routine/B10` (`F24`)~~, ~~*(unfiled — `F25`)*~~ | both verified 2026-09-14 (`todo-routine/B10`'s own entry: SK forms on every card, the heatmap tooltip, the history dialog, the freeze chip, then EN without a reload; `F25` in the log's *Closed batches*) — these two rows had lagged the summary table by two passes | ✅ moved to the log (fourteenth pass) |

**Every row in this table is now closed.** Unit 10's round 8 (2026-09-15) re-confirmed both views against
round 6/7's recorded numbers with no drift; the unit's own tally reads *"every finding this unit ever filed
is now `fixed and verified`"*. The table stays for one more pass as the record, then goes to the log.

### `activity-settings` — two `unverified` remain (`U1` and `U2` closed by the mutation round — see the log)

| finding | what settles it | note |
| --- | --- | --- |
| `U3` — repeated 401 → `/refresh` 401 → sign-out | **re-graded** to a runbook error, mechanism source-verified (token rotation, 5 s grace) — see `F23` and *Contradictions* §19 | Not an app defect and not retestable as one; the fix is the paragraph, and the proof is the next parallel run keeping both sessions |
| `U4` — one *"0 of 0"* on an unfiltered request | retest after **`F18`**: reload, type a name, clear it, three times, and read `itemsCount` off the response body each time | `F18` removes the only competing request this view fires, which is the only candidate mechanism the finding names. Checked `useFetchFilteredTable.ts:47-55` this pass: an aborted call defers to `latest`, so the simple "stale response overwrote the fresh one" story does not hold as written — if it recurs *after* `F18`, capture the response body, because the cause is then somewhere this queue has not looked |

### `tracking-settings` — one item that `F14` will surface, not close (`U1` confirmed by the mutation round as `X4` — see the log)

| finding | what settles it | note |
| --- | --- | --- |
| *(unfiled)* sidebar highlights *Desktop tracking* on the Mappings tab, nothing on `/activity-settings/roles` | one look at the sidebar on each route, before and after `F14` | `SidebarNavItem.vue:52` uses the same `matchesPath` as the breadcrumb, so `F14`'s data fix closes both; it must be *checked*, not assumed, because the `VBtn :to` in the header toggle is a second active-state mechanism on the same screen |
| `tracking-settings/B5` — re-graded `bug` → `opportunity`, under *Deferred* | — | the distinct-entries grid is the raw observation ledger by design; whether it should also say "already covered by a rule" is a product question with a backend half (§103) |

### `history-review` — two `unverified`, both seed-shape gaps with a cheaper route than a seed change

| finding | what settles it | note |
| --- | --- | --- |
| `U1` — Calendar's and Summary's empty / first-run branches never seen on screen | **Empty:** no seed change needed. `HistoryCalendarView.vue:71-78`'s own comment says calendar rows exist only for the current and next year, and `fillMissingDays` pads a past-year range with placeholders — so `/activity-history/calendar` navigated to any 2020 month must render `history.calendar.noActivityInRange` above a grid of *"Not recorded"* cells, and `/activity-history?date=2020-01-01&range=month` must render the three `HistoryEmptyState`s with `periodLabel` *01.01.2020*. **First-run:** needs an account with **zero** history rows anywhere — `getHasAnyHistoryEver()` is a global check. Read `e2e/.state/seed.json` for whether `secondaryUser` (10002) seeds history; if it does not, the `secondaryPage` fixture is the one-minute route, else a throwaway account | Seed-data shape, not a defect. **Run after `F27`** — until then an empty state and a failed request look the same, and a 2020 range is exactly where a backend edge case would show up as "empty" |
| `U2` — the null-`wakeUpTime` path (`CalendarActivityDaySummary.ts:37-38`) never exercised live | **No seed row needed:** `playwright-cli route "**/api/activity-history/dashboard/calendar"` with a fulfilled body copied from a real response and one day's `wakeUpTime`/`bedTime` set to `null` (the CLI's `route` takes a body as well as a status — check `playwright-cli route --help` for the flag name rather than trusting this row). Pass: that cell renders without its sleep line and the rest of the month still paints | Source-only today; the fix it would confirm (`H1`, `Time | null` with independent rendering) is in the DTO and the cell component. If the mocked body is a chore, a one-line ask on the seed — one day with no sleep record — is the alternative, and it is the *only* seed ask this unit produced |

**Source-certain, unobserved, and carried inside batches rather than listed as findings** (each named in
its batch's *Adjacent* / *Root cause*, with a verification step): the timeline and calendar views keeping
the *previous* period's rows on a failed fetch, with an unhandled rejection (`F27`, cases 2 and 3); the
summary/domain cards being `role="button"` with no key handler (`F30`); Detail's bars showing a pointer
with no click consumer (`F29`); `HistoryPieChart`'s hardcoded dark-theme legend colours (`F31`); and
`isNarrow` being a dead prop (`F31`). None of them needs a browser to be *believed* — the code paths
have one outcome — but each batch's verification is where they get *seen*, and a fixing session that
finds one of them does not reproduce should stop and say so rather than fix it anyway.

### `user-settings` — one re-graded `bug` and five `unverified`, of which three are settled from source

The unit's five `U` items share one cause that is not the app's: the harness's own safety classifier
blocked a `fill` on a password field, a `select` on the language combobox and (twice) a click on *Delete
account*. That is a **tooling** limit, not evidence about the app, and it does not carry over to a
Playwright spec — a spec is code, not the agent — so the cheapest settle for four of the six rows below
is to promote the matching `test.fixme` in `e2e/tests/user-settings.draft.spec.ts` rather than to
re-drive the screen by hand.

| finding | what settles it | note |
| --- | --- | --- |
| `B2` — callback view "silent" on a missing `code` / `error=access_denied` — **re-graded `bug` → `unverified`** (§38) | `expect(page.getByText('Failed to connect Google Calendar')).toBeVisible()` immediately after `page.goto('/google-calendar/callback?error=access_denied')` — Playwright polls from the moment `goto` resolves, which is before the app has booted, so a 3-second toast cannot be missed. With `playwright-cli`, read the snapshot file the `goto` itself wrote, not a later `find` | `GoogleCalendarCallbackView.vue:20-23` **has** the branch: `if (!code) { showErrorSnackbar(t('googleCalendar.connectFailed')); router.replace(…) }`. The toast is module-level state (`SnackbarComposable.ts:16-22`), mounted once in `App.vue:19`, `timeout` 3000, and error toasts are **not closable**. Nothing on the settings mount touches it (grep: zero snackbar calls in the user module's setup paths). The unit's negative evidence is a `find` run as a separate CLI process after a `goto` — an unmeasured delay against a 3 s window. If it *still* does not show, the cause is somewhere this pass has not looked and it is a real bug; file the mechanism, not the symptom. Either way the residual — a distinct message for Google's *Cancel* — is the optional branch in `F33` |
| `U1` — 2FA enrollment | **Half is runnable now, non-destructively:** the switch's `@click` is `preventDefault`ed and opens `VerifyUserForm` posting to `/user/2fa/toggle` (`SecuritySection.vue:170-173`, `VerifyUserForm.vue:49-52`); Cancel closes it, the switch stays off, no request fires. The other half — the real enrollment, which also shows recovery codes **once** (`:195-197`) — needs a throwaway account: the seed has none, and `secondaryUser` is shared with `account-isolation.spec.ts` | Stays `unverified` for the enrollment; the dialog half is a one-minute check that says whether the control is wired at all |
| `U2` — Revoke / *Log out of all other devices* | One form sign-in in a **second** CLI session (`playwright-cli -s=revoke-target open …/login`, creds from `seed.json`) creates the target; that is *one* sign-in, not the repeated burst the rate limit in `e2e/fixtures/auth.ts` guards against. Revoke it from the first session; expect the row gone and *"Session revoked"*; the second session's next request is a 401 that does not refresh. No reseed needed | **Adjacent, not filed:** the per-row *Revoke* is a direct call with **no confirmation** (`SessionsSection.vue:118-129`), while *Log out of all other devices* confirms through `MyDialog` (`:70-77`). Reversible (the device signs in again), so at most `polish` — decide when the control is exercised, not here. Its button is also one of `FW8`'s six |
| `U3` — delete-account dialog copy | **Settled from source; one look remains.** `SecuritySection.vue:179-188`: `confirm({ title: 'Delete account', text: deleteAccountWarning ?? user.deleteAccountWarning, confirmBtnLabel: 'Delete account', confirmBtnColor: 'errorDark' })` **then** `openVerifyDialog('/user/delete-account')`. This app passes `deleteAccountWarning` = `user.dangerZone.deleteWarning` (`UserSettingsView.vue:11`, text at `user.en.ts:40` — the itemised sentence). The finding's cited source, `prompts/_done/user/A2-deletion-cliff.md`, describes the flow **before** that step was added (the view's own comment at `:6-9` names it "F6 / R21"). The look: click *Delete account* → the intent dialog with that text → **Cancel**; no request fires until the *second* dialog's Confirm | The classifier blocks the agent's click, not the app; a human does this in ten seconds. **Correct the draft spec's `fixme` text** (*"source suggests it currently only verifies identity"*) when promoting — it encodes the stale description |
| `U4` — mismatched new/confirm password | **Mechanism settled; the message is broken.** `MyNewPasswordInput.vue:34-37` appends `doPasswordsMatch(v) \|\| t('user.passwordsDontMatch')` to the confirm field's rules, so the line appears inline as you type; and `ChangePasswordForm.vue:50-51` runs `form.validate()` on Confirm and returns without a request when invalid. But the key is defined **nowhere** (`FW7`, adjacent), so what the line says today is `user.passwordsDontMatch`. Settle by promoting the `fixme`: fill `a` / `b`, expect a sentence under the confirm field, click Confirm, expect **no** `POST /user/change-password` | The spec's *"does not enable Confirm"* is not how the form works — Confirm stays enabled and the handler bails; assert on the absent request, not a disabled button. Latent and not filed: the confirm rule does not re-run when the *first* field changes afterwards (no watcher), but `form.validate()` on Confirm catches it, so no wrong password can be submitted |
| `U5` — language switch | **Mechanism settled.** `onLocaleChange` → `userStore.setPreferences({ locale })` → `await updatePreferences` + `Object.assign(currentUser, partial)` (`authStore.ts:33-36`) → `App.vue`'s deep watcher on `currentUser` → `i18n.locale.value = currentUser.locale` (`App.vue:94`). That is the **same watcher and the same store method** the unit verified live for the theme toggle (theme applies at `:88-93`, four lines above); only the final assignment is untested. Settle on `secondaryUser`, or on the primary account and reseed afterwards — the seed restores `locale: "EN"` (README *Prerequisites* §3) | The sweep-wide "must stay English" concern is real but cheap to honour: `POST /api/test/seed` is the revert |

### `auth` — three `unverified` remain after the mutation round: one environment, one seed (now gated by §14), one deliberate

Unit 15's round 2/3 (committed in `04c405e9`, absorbed in the fourteenth pass) closed three of the six:
`U1` is **observed** and batched (`FW14`), `U5` is **resolved** (working as coded — the prefill, the
autofocus and the resend panel all seen after a real registration), and `U6` was already settled from
source (§64 — the unit still lists it open; its round-2 detail, the 415 on a bodiless confirm post, is
folded into `FW12`). The three rows below are what is left; `U1`/`U5`/`U6`'s rows are in the log.

| finding | what settles it | note |
| --- | --- | --- |
| `U2` — the 2FA login dialog (`LoginVerifyQrCode`) never exercised | **Seed gap, and the seed alone is not enough — and now §14 gates it too.** Round 2 registered a real 2FA-enabled throwaway through the API and still could not reach the dialog: the account also needs a confirmed e-mail, and an unconfirmed one is answered `401 "Invalid email or password"` before the flow ever reaches the 2FA gate (§14 — the `PreSignInCheck` short-circuit). So the routes are: (a) an `e2e-v5` account (`twoFactorUser`, 10004) seeded **confirmed** and with a known TOTP secret the seed response returns, so a spec can `otplib`-generate the code; (b) by hand, once §14 lands or a confirmation mail can be read: enrol a throwaway through registration (works since `FW13`'s half landed), confirm it, read the secret off the QR's `otpauth://` URI. The dialog's *structure* (title, `VOtpInput`, wrong-code line, Escape under `FW1`'s `persistent` default) is reachable with (b) in a minute | Route (a) is a one-paragraph seed ask if the operator wants a spec; it belongs in `B3`'s family (`prompts/view-docs/backend/_done/B3-seed-fixture-coverage.md`), not a new file. Note the `LoginVerifyQrCode` redirect line is `FW11`'s and reads the same helper — a source read covers that half |
| `U3` — reCAPTCHA badge show/hide never observable | **Environment**, not the app: `VITE_RECAPTCHA_SITE_KEY` is empty in `.env.development` (re-confirmed in round 2), so `recaptcha-v3`'s `load()` is never called and `.grecaptcha-badge` never exists (`UseRecaptchaHandler.ts:79-88` returns `''` before loading). **One latent thing from the read, for when a key exists:** nothing calls `loadRecaptcha()` on mount — the script loads lazily inside the first `executeRecaptcha()` — so on `/login` the badge appears only *after* the first submit, and `router.afterEach` (`router.ts:107-112`) has no badge to show until the next navigation. Google's terms want the badge (or its alternative text) visible wherever v3 runs; check it when a key is configured, not before | Not a defect anyone can see today; not a batch |
| `U4` — "too many attempts" / "locked out" branches | **Settled from the API source; the numbers the unit wanted are:** `IdentityServiceExtensions.cs:128-129` — **5** failed attempts, **5-minute** lockout; the message is `"Too many failed login attempts. Try again in {m}m {s}s"` (`PasswordSignInFlow.cs:85-93`), sent on the lockout path, and `"Invalid email or password"` for every other miss including unknown addresses (`:73-77,95-101`, enumeration-safe). So `LoginView.vue:174-176`'s substring match will show the server's countdown, in English, in both locales — the countdown is server-only, so that is the ceiling without a contract change. **Dead code, harmless:** `:186` is `generalErrors.includes('User locked out for')`, an *exact-element* `Array.includes` against a string the server never sends; it never matches and the `!handled` fallback at `:201-202` shows `generalErrors[0]` anyway — the same text. **Round 2 found the safe way to see it:** register a throwaway (the UI works now), fail its password six times, read the snackbar, reseed — but note §14: an *unconfirmed* throwaway never reaches the password check, so the lockout counter will not move for it. Confirm the account first, or wait for §14 | The unit's caution (do not lock out the shared `test@example.com`) was correct — a lockout would have cost every concurrent unit five minutes. Reseeding clears `LockoutEnd` (the seed recreates the account) if it ever happens by accident |

### ⚠️ Found while triaging unit 4: `TimePicker` snaps `:58` / `:59` to minute **60** at any interval above 1 — framework, source-certain, unobserved

Not filed by any unit; found while reading `B2`'s mechanism. `roundToNearestInterval(58, 5)` is
`Math.round(11.6) * 5 = 60` (`DateTimeHelper.ts:166-168` — no clamp), and both of `TimePicker.vue`'s
write paths feed the result straight into a `Time`: the mask watcher builds `"HH:60"` (`:122-123`) and
the `timeString` setter does `new Time(h, 60)` (`:99-100`). `Time` has no validation (`Time.ts:3-7`),
so the model becomes `{ hours: h, minutes: 60 }`, `getString()` renders **`00:60`**, and the
`time` watcher writes it back into the field (`:132-141`), where the mask watcher's `minutes < 60`
guard (`:121`) then resets `inputValue` to the same `"00:60"` — a stable, visible, invalid state. On the
wire it is `{ hours: 0, minutes: 60 }`, which the API may or may not normalise. Every interval above 1
has the case (`'5'`: 58–59; `'10'`: 55–59; `'30'`: 45–59 all round to 60), so `F36`'s `'1'` makes it unreachable on
unit 4's eight fields and on nothing else — `LogTimeBody`, `ToDoListItemDialog`, `PlanLaterDialog`,
`DateTimePicker`, `QuietHoursCard`, `TaskPlannerDayTemplateDetailsForm`, `LogTimeForm` and both halves
of `TimeRangePicker` keep it.

**What would settle it:** ten seconds on `/activity-history/timer` **before** `F36` lands (or on
`/todo-list` item dialog's due time after it): type `0058` into a `TimePicker` field and read it. If it
reads `00:60`, this is a **framework batch** (`FW10` next run — ~~`FW9` is reserved for the `BasicTable`
dialog check above~~ the `BasicTable` dialog was fixed without a batch and `FW9` went to unit 15's
forgotten-password blocker in the ninth pass; `FW10` is still held for this): clamp in `roundToNearestInterval` (`Math.min(60 - interval, …)` is wrong for
`59` → it should carry into the hour, so probably `Time.fromMinutes(h * 60 + rounded)` at both call
sites instead). Same repro as `B2`'s, one different digit — worth folding into the unit's mutation-pass
brief so it costs nothing extra. **While that batch is open, the two framework questions `F36` declined
to answer belong in it:** whether `'5'` is the right *default* for a component that serves both
times-of-day and durations, and whether a snap should ever be silent (helper text, or a `snapped`
emit). Both are decisions for `vue_framework`, not this app.

### Seed-data gaps — one ask, two findings

**The routine half is done on the API side — `B8` closed 2026-09-14, moved to
`prompts/view-docs/backend/_done/B8-routine-streak-history-seed.md`.** It was already covered by the API's
`e2e-v4` work (uncommitted on `dev` on top of `7f9f9e5` when the ask was written; `B8` measured against
`e2e-v3`, which is why source showed nothing). Every "Done when" item is met, plus the catch-up trap:
`E2eFixtureSeeder.AddRoutinePeriodHistory()` seeds 16 `RoutinePeriodCompletion` rows on Weekly
(pattern `xf.xxxx.xx.xx.xx` newest-first — met / missed / **frozen**, streak 1, best 4) and 16 on Daily (one
4-of-5 miss eleven cycles back; streak 11, best 30); `totalPeriodsElapsed` / `totalPeriodsCompleted` are now
**derived** from those rows by `RoutineTimePeriodResponse.From`, so the client's `mockHistory()` fallback cannot
fire for them, and Monthly / Yearly stay bare on purpose so the empty state is still reachable. Four new daily
items cover the remaining milestone tiers (`milestone30` Drink water 45 — the one daily item left un-ticked;
`milestone90` Journal 120; `milestone180` Make the bed 200; `milestone365` Brush teeth 400). Freeze budgets and
`lastResetAt` are pre-stamped so the first grouped read writes nothing. Typed in `e2e/fixtures/seed.ts`
(`EXPECTED_FIXTURE_VERSION = 'e2e-v4'`, the four `SeedRoutineKey`s, `counts.routinePeriodCompletions` /
`.frozenRoutinePeriodCompletions`), pinned by three tests in `TestSeedEndpointTests.cs`. Two caveats from the
seeder: Weekly has one freeze fewer than budget if the seeded freeze falls in the current calendar month, and a
spec that straddles midnight UTC with a milestone item un-ticked will see the lapse zero its streak.

**And the browser pass is done too** (`todo-routine` round 6, 2026-09-14, against a freshly v4-seeded
database): all seven surfaces render and match the seeded rows — review card with both eligible periods,
heatmaps with met / missed / frozen, 94 % and 69 % consistency with computed trends, personal bests 30/11 and
4/1, freeze chips 2 and 1, and all five milestone icons on one screen. **`U1` and `U2` are closed.** The one
thing the wider board surfaced is a polish finding, `todo-routine/P2` (weekday chips overflow the Daily column
at 1440 px now that it holds five items) — not queued here yet; it is a one-component `flex-wrap` and can ride
along with the next `todoList` batch.

| what to seed | unblocks |
| --- | --- |
| ~~≥1 routine time period with `totalPeriodsElapsed > 0` and non-empty `completionHistory`~~ — **`B8` done, `e2e-v4`** | ~~`todo-routine/U1`, `U2`~~ ✅ both verified live, round 6 |
| ~~≥1 routine item with `streak >= 30` (ideally 90/180/365 too)~~ — **`B8` done, `e2e-v4`** (45 / 120 / 200 / 400) | ~~`todo-routine/U2` (milestone icons)~~ ✅ all five icons verified live, round 6 |
| ~~≥1 **routine** item with steps~~ — **moot**: `todo-routine/A2` was verified in round 7 (2026-09-14) on a temporary two-step Daily item created and deleted in-session, and the `TodoListStepsFormField` sweep ran on the same dialog | ~~`todo-routine/A2`~~ ✅ both closed, round 7 |
| enough desktop mappings to exceed one page (>25, or a smaller page size in the spec) | `F12`'s second verification step — that the Mappings body *scrolls inside the card* rather than merely paints. Two seeded mappings (one `Activity`, one `Ignored`) can prove the row paints; they cannot prove the fill-parent contract still holds. Low priority: `ActivityTable` already exercises the same path with 10 rows |

Also worth naming for unit 13's own sake: the projects seed holds **one** row, which is why `F2`'s
under-rendering consequence could not be observed and why the board's grouping was only seen with one
occupied column. Two or three projects across all three readiness statuses would make that view actually
testable.

### `planner-day` — no `unverified` filed; three items settled or found from source

The unit filed zero `unverified` findings — the first in the sweep to do so — and its six `bug`s all
carry a screenshot, a DOM read or a response body. What this section holds for it is what the source
read added:

- **`B5`'s task half is settled — no defect, dropped from the open count** (*Contradictions* §70).
  `PlannerTaskLinkView.vue:66-88` wraps both reads in `try/catch` and its own comment says the
  interceptor *"has already surfaced the failure"*. The `AxiosError` the unit saw in the console is
  `axiosConfig.ts:212-214` — `console.error('ERROR: ', error)` for every non-cancelled failure, by
  design — not an unhandled rejection. Its pass condition (*"the console shows no uncaught exception"*)
  is unattainable without changing the interceptor, and there is nothing to catch. The date half is
  real and is `F43`; note that the same interceptor line will still print there after the fix — the
  thing to assert absent is Vue's *"Unhandled error during execution of mounted hook"*, not the
  interceptor's.
- **`useDayNavigation.ts:71-84` — the second unguarded calendar fetch, source-certain, unobserved.**
  Folded into `F43` rather than listed as a separate finding (the `F27` precedent: same shape, same
  batch). What would settle it: from `/day-planner/01-01-2026`, ArrowLeft with the console open —
  expected today: `GET /calendar/by-date/31-12-2025` → 404, the tasks vanish, the header still reads
  `01.01.` (through `formatToDateWithDay`, whose weekday is hardcoded `sk` — §22, not this unit's) and
  the URL says `31-12-2025`. Ten seconds, no seed change: the seeder covers this
  year and next only (`CalendarSeeder.cs:29-31`), and `CalendarProvisioner` creates rows on writes, not
  reads.
- **`UNIT-ORDER.md`'s ISO-URL claim no longer describes the code.** The brief (*"An ISO URL 400s the
  calendar fetch and the view silently falls back to a neighbouring day's calendar"*, measured
  2026-09-11) cannot happen on the current tree: `by-date` strict-parses `dd-MM-yyyy` and 400s
  (`GetByDateCalendarEndpoint.cs:19-24`), the 400 rejects the `Promise.all` before `store.viewedDate` is
  assigned (`DayPlannerView.vue:211-214`), so an ISO URL produces `B5`'s blank header, not a neighbouring
  day. The unit was briefed to verify before filing and correctly filed only what it saw
  (`not-a-date`). `F43`'s verification includes the ISO form so the brief's row can be struck.
- **`MyDateInput`'s `style` override** (`FW15`'s adjacent): `PlannerTaskDialog.vue:26` asks for 200 px
  and gets the component's 150 px. Same one-line fix; one look at the Add Task dialog's date field
  width after `FW15` settles it. Not a finding on its own.

### ⚠️ Found while triaging unit 7: the template picker calls `/suggestions?date=` against a `/{calendarId}` route — the withdrawn `B5` bug on the sibling endpoint, hidden by mount order

**Source-certain, unobserved — `F45`-if-confirmed (rule 5).** `taskPlannerDayTemplateApi.ts:38-41` is
``API.get(`${url}/suggestions`, { params: { date } })``; the only route is
`Get("/task-planner-day-template/suggestions/{calendarId:long:required}")`
(`GetSuggestionsTaskPlannerDayTemplateEndpoint.cs:22`), so the request falls through to the framework's
generic `GET /{id}` with `"suggestions"` as the id — the exact mechanism `repeatingPlannerTaskApi.ts:25-32`
now documents for its own fixed twin. The unit's brief presented this endpoint as an *opportunity*
(*"the client never calls it at all"*); the client has called it since the picker was written.

**Why no unit has seen the 400:** `DayTemplatePicker.vue:212-221` fires the call in `onMounted`, reading
`calendar?.date` **once**. The picker sits in `DayDetailsPanel` → `DayPlannerSidePanel`, which is
rendered on the day view's first paint — before `DayPlannerView.vue:211`'s `Promise.all` has resolved the
calendar — so `calendar` is `undefined` at mount, the guard takes the `Promise.resolve([])` branch, and
there is no watcher to try again. Net effect today: **the picker's *Suggested for you* section
(`DayTemplatePicker.vue:13-55`) is fed only by this call and therefore never renders on a normal load** —
which is presumably why the brief believed the endpoint uncalled. (`composable/useTemplateSuggestion.ts`,
the client-side scorer, has no importer anywhere in `src/` — dead code, noted, not batched.)

**When it does fire:** `DayPlannerSidePanel.vue:11` is `v-if="activePanel === 'details'"`, so switching
*Routine* → *Day Details* **remounts** the panel with the calendar now loaded — and the request goes out,
400s, rejects the picker's `Promise.all`, and `templates.value` is never assigned: the picker shows **no
templates at all** on the second visit to the tab. Same for a day view opened with the details panel
collapsed by setting (`detailsPanelExpandedByDefault` off) and expanded later. The unit's draft spec
switches *to* Routine (`planner-day.draft.spec.ts:80`) and never back, which is why its network section
lists only the two 4xx it went looking for.

**What would settle it:** ten seconds — `/day-planner/<today>` with the console open, click *Routine*,
click *Day Details*: expect `GET /api/task-planner-day-template/suggestions?date=…` → **400**, the
interceptor's toast, and an empty template picker. **Fix shape when confirmed** (two lines plus a
guard): ``API.get(`${url}/suggestions/${calendarId}`)`` taking `calendar.id`, and `.catch(() => [])` on
the suggestions leg of the picker's `Promise.all` — the same isolation `DayPlannerView.vue:244-252` added
for the repeating-task twin, so a suggestion outage never costs the template list again. Consider a
`watch(() => calendar?.id)` so the first load fetches too, or the endpoint stays uncalled on the path
every user takes. Not batched with `F43`/`F44` (different cause); would be its own trivial app batch.

### `tracking-dashboards` — one `unverified`, and its premise is wrong in the useful direction

- **`U1` — loading and error states never exercised.** Stands as `unverified`, but not for the reason
  given. The finding says *"no network fault injection available via `playwright-cli`"*; the CLI has
  `route <glob> --status=<n>` / `--body=…` and `unroute` (`~/.claude/skills/playwright-cli/SKILL.md:150-154`),
  the README's decision log names it as the thing that *"makes error states reachable for the first
  time"*, and `history-review/B2` was observed with exactly that command — so nothing about this item
  needs a new tool or a seed change. What would settle it, in one session with `F27`'s verification
  (the two are the same pattern; `F27` copies this module's): `playwright-cli route
  "**/api/activity-tracking/web-extension/pie-chart" --status=500`, reload `/activity-tracking` —
  expected today: the pie section shows the icon + *"Failed to load"* + *Retry* (`ActivityPieChartSection.vue:14-33`)
  while the other three panels populate, and **no snackbar** (`_silent: true` on every dashboard read,
  `activityTrackingApi.ts` and siblings); `unroute`, click *Retry* — expected: **one** `pie-chart` request,
  no other panel refetches. Then the loading half: `route` the same endpoint with a delayed fulfil, or
  `network-state-set` throttling, and snapshot — expected: `VSkeletonLoader type="image, list-item@3"`
  + `type="card"` in the pie card (`:3-12`). Repeat once on `/unified`, whose *Sources* chips are the
  one panel designed to survive a failed round (`ActivitySourceFilter.vue:24-29`) — that comment has
  never been tested either. If any panel shows its *empty* state on a 500 instead of its error state,
  that is `F27`'s class on this side and a new finding.
- **The pie endpoints' `"Other"` row — source-certain, unobserved, backend-shaped (§10).** Settled by
  one fulfilled `route` body or a seed app under 1 % of the span; `F47` guards it locally meanwhile.

### `planner-templates` — three `unverified`: one settled from source, two for the mutation pass

- **`U3` — split view's back button has no accessible name. ✅ Settled from source, closes in `F56`.**
  `TemplateSplitView.vue:5-11` is `<VBtn icon="arrow-left" …>` with no `aria-label`, no `title` and no
  default-slot text; a `VBtn` given only `icon` renders an SVG and nothing an accessibility tree can
  name. There is nothing a browser would add — the unit's own rule (*"eval the button the same way
  A1/A3 were confirmed"*) would return the same `{text: "", aria: null, title: ""}` it already got for
  the pin. Folded as row 4 of `F56` rather than left waiting for a refile as "A4".
- **`U1` — the header stat line excludes background tasks, never exercised.** Stands as `unverified`;
  it is a seed-shape gap (all twelve seeded template tasks are `isBackground: false`) and the
  behaviour is source-certain and deliberate (`TemplateDayPlannerView.vue:178-182` filters
  `nonBgTasks` before counting). What would settle it — **not a seed ask** (CLAUDE.md's *Mutating
  specs* rule 1): the unit's **mutation pass** creates one task with `isBackground: true` on template
  `20001` through `POST /api/template-planner-task`, reads the header, and judges the wording
  (*"5 tasks"* for a template that shows six blocks). The likely outcome is `polish` — a *"(+1
  background)"* suffix or nothing — and it goes straight into the unit's `findings.md` at that
  severity; no batch is reserved for it.
- **`U2` — cross-template drag-and-drop in the split view never exercised.** Stands; it is the
  mutation pass's job by definition (the unit was an inventory pass), and the source path
  (`TemplateSplitView.vue:80-207`: `PATCH` the task's `templateId`, splice from the source store,
  push into the target) reads as complete. What would settle it: one drag from left to right with
  `playwright-cli` — `requests` shows one `PATCH /template-planner-task/{id}`, the block moves at the
  same time-of-day, the success snackbar fires; then a drop *outside* both panels, which must leave
  the task where it was and fire no request. `F54` should land first so the two picks survive the
  reload the drag test will want.

### ⚠️ Found while triaging unit 11: a 400 with no snackbar — three units, three different observations of one interceptor path

`leisure-backlog-picker/X3` polled the DOM for 1.8 s after *Create* (six samples) and saw **no
`.v-snackbar`**; `leisure-bucket-anchors/B2` on the same shape of 400 says *"a snackbar may have fired
and auto-dismissed before capture — not independently confirmed"*; `activity-settings/X1` on a 400 from
the same `useEntityCommand.create` path **saw** the snackbar (the generic string `FW19` is about). Read
this pass: `axiosConfig.ts:221-228` calls `showErrorSnackbar` for every non-`_silent` 400,
`activityBacklogProfileApi.ts` sets no `disableErrorHandling`, `useRequestState.ts:31` therefore passes
no `_silent`, and `SnackbarComposable.ts`'s `showSnackbar` has no dedupe, no suppression and a 3 000 ms
timeout — so a 1.8 s poll starting after the click should have caught it. There is no path in source by
which this request stays silent. Either the observation is wrong (the poll's selector, or the snackbar
rendered behind the dialog's scrim and the agent was reading a `find` that scopes to the dialog) or there
is a real intermittent in the framework, which would be a much bigger finding than `X3`.

**What would settle it:** `/leisure/backlog` → *Add* → *Create* untouched, with
`playwright-cli find "One or more errors"` within 3 s, **and** `playwright-cli eval
"document.querySelectorAll('.v-snackbar').length"`. If it is absent, patch a `console.log` into
`showErrorSnackbar` via `route`-served source or read `snackbar.value` off the composable — the question
is whether the interceptor was called, not whether the DOM shows it. Until then `F63` fixes the input
side and `X3`'s *Verify* step 2(b) stays open.

### `leisure-backlog-picker` — four `unverified`, all environment-shaped; none settles from source

| finding | what settles it | note |
| --- | --- | --- |
| `U1` — `PickerView`'s *nothing filed yet* and *load failed* states | `nothingFiled`: sign in as `secondaryUser` (the `secondaryPage` fixture) and open `/leisure/pick` — check `e2e/.state/seed.json` first for that account's leisure counts rather than assuming; if it seeds rows too, a `test.fixme`. `failed`: `playwright-cli route "**/api/activity-backlog-profile/grid" --status=500` and reload | Seed/tooling gaps, not defects. Note `F64` changes the *default* landing state on the primary account from "no suggestions" to "one card" — run this after it |
| `U2` — the loading skeleton | `playwright-cli route` with a delay on the three pool `grid` calls, then `find "skeleton"` | Cosmetic; one screenshot |
| `U3` — `BacklogView`'s loading and error states | Same route-delay for loading; `--status=400` for the error state — and read whether the *table* shows an error or its empty copy, which is `F61`'s question one view over | If it shows the empty copy, file it against `F61`'s pattern rather than as a new finding |
| `U4` — arrow keys inside `ConstraintBar`'s three `VBtnToggle` groups | Tab into one group, `ArrowRight`/`ArrowLeft`, confirm selection moves and wraps; then with focus in the filter's text field confirm the arrows do nothing to the toggles | The CLAUDE.md keyboard-checklist item. Vuetify's `VBtnToggle` is a `group` with no roving tabindex of its own, so the honest expectation is *"arrows do nothing, Tab moves between buttons"* — decide before asserting |

### `leisure-bucket-anchors` — two `unverified`: one for the mutation pass, one settled from source

| finding | what settles it | note |
| --- | --- | --- |
| `U1` — the locked *"I did this"* capture flow | The unit's mutation pass: create a not-yet-anchored bucket-list row **through the API** (CLAUDE.md *Mutating specs* rule 1), click *I did this*, confirm the dialog opens with the activity locked and the current month/year defaulted | Not a seed ask. This path does not call the missing endpoint (§12) — `lockActivity` short-circuits `onMounted` (`NewMemoryAnchorForm.vue:109`) — so it is testable today |
| `U2` — deleting an anchor vs. the source row's `isAnchored` | ✅ **Settled from source** — see the log's *Closed verification items*. `IsAnchored`/`MemoryAnchorId` are computed **in SQL at read time** from the anchors table (`GridActivityBucketListProfileEndpoint.cs:24-25,50-55`: `anchors.Any(m => m.ActivityId == p.ActivityId)`), not stored on the profile, so a deleted anchor cannot leave a dangling flag. The mutation pass may still click it, but there is no defect to find | — |

### Carried forward, unchanged

- ~~**`todo-lists/U1`**~~ — ✅ re-graded 2026-09-13 to *settled, superseded by B4/FW3*, both of which are
  closed; the whole banner flow is pinned by four tests in `todo-motivation.spec.ts`.
- ~~**`home/U1`**~~ — ✅ **settled by the unit-1 mutation round (2026-09-15)**: a forced 500 on
  `calendar/day-plan/**` rendered the error/Retry state in both widgets and Retry re-fired; the case
  where it is unreachable is the sign-in race, folded into `F8`. Moved to the log.
- **`_shell/U1`** — snackbar stacking. Trigger two snackbar-worthy actions in quick succession.
- **`_shell/U2`** — fullscreen-loading strand. Navigate away *during* a slow request under throttling.

## Deferred to opportunities

**`leisure-projects/O1` — the first genuinely open `opportunity` finding of the sweep.** Every
`activity-project-profile/grid` row carries `activity.isOnTodoList` and nothing in `src/` reads it; combined
with the `materialsNeeded` already rendered on `NeedsShopping` cards, it is the raw material for the
shopping-list-to-todo handoff `P1-readiness-board.md` asked this module's author to either build or decline in
writing. Neither happened. Two separable pieces of work, and only the second is an opportunity:

- **the written decline is a small docs chore, not a feature** — `migration-revision.md` has no entry, which
  is the gap `P1` point 4 was trying to prevent. Someone should write the paragraph regardless of whether the
  feature is ever built.
- **the feature itself** goes to `docs/opportunities.md` at Phase 4, where it can be weighed against the
  cross-module map rather than decided from inside one view. Note the constraint when it is: writing through
  `core/todoList`'s `api/`/`dto/` only, per CLAUDE.md's cross-module rule.

**`tracking-settings/O1` — a mapping's `isActive` is filterable, displayed, and editable nowhere.** Both
mapping request DTOs carry it, both grids show it as a column and offer it as a filter, and neither the
create form nor `edit()` binds a control to it — so a rule can only be disabled by deleting it. Goes to
`docs/opportunities.md` at Phase 4. Two notes for when it is weighed: (1) the cheapest shape is an inline
toggle on the `isActive` column, which is a `BasicTable` `#item.isActive` slot plus a `patch` — the
`useEntityCommand` base already has `batchedToggle` for exactly this; (2) it is worth nothing until `F12`
lands, because the column it would live in is currently invisible. **(3), from the mutation round:** the
update contract makes this less optional than it looked — `UpdateTrackerDesktopMappingRequest.IsActive`
is `required` and the update is a full replace (`F72`), so the edit path must carry the row's `isActive`
either way; once it does, a toggle is the one control that makes the value the user's rather than
whatever the row happened to hold.

**`tracking-settings/B5` — the distinct-entries list never excludes or marks an entry that already has a
rule** — filed `bug` by the mutation round, **re-graded `opportunity`** (§103). The expectation is the
unit's own `usecase.md` (*"not-yet-considered"*), written by the same unit in round 1; no intent source
(`prompts/_done/activity-tracking/R4-settings-views.md`, `B3`'s seed ask) says the list is an inbox. Read
at the source: `FetchTableDistinctDesktopEntry.cs` groups the raw `DesktopActivityEntry` ledger by
`(ProductName, ProcessName, WindowTitle)` with no join to the mappings table, and the heartbeat
(`DesktopActivityHeartbeatEndpoint.cs:89-104`) **keeps recording** an entry that matches a to-activity
rule — it attributes the seconds *and* stores the row; only an ignored match is dropped. So a mapped
process legitimately keeps appearing: the list is what was observed, not what is undecided, and the
`vlc.exe` row the unit re-found after creating its rule is the ledger working. What is real is the
product gap the unit names — nothing tells a user which tuples already have a rule — and it has a
backend half (a flag per tuple, or an exclude toggle; `B3`'s note that the seeder drops *ignored* tuples
"the way the heartbeat would" is the same design stated from the seed side). Goes to
`docs/opportunities.md` at Phase 4; the client cannot join the two grids alone (the unit's own
*Suggested fix* says why — pattern match types have no id to join on).

**`activity-settings/O1` — role and category icons are picked in the forms, sent by the API, rendered in
the activity picker, and shown in neither settings table.** Confirmed from the column lists
(`ActivityRoleTable.vue:58-62`, `ActivityCategoryTable.vue:58-63` — Name/Text/Color, no icon) and the
wire (`GridActivityRoleEndpoint.cs` projects `Icon`). Goes to `docs/opportunities.md` at Phase 4 as a
small one. One note for when it is weighed: the cheapest shape is folding the icon into the existing
`#item.color` swatch cell (a `VIcon` inside the `VSheet`) rather than a fifth column, which keeps the
row width — and it is the same cell `F21` may already be touching on the categories table, so the two
could ship together if `F21` lands first.

`todo-lists/O1` remains `resolved` (round 4). **`history-review` filed no `opportunity` finding** — its
tally line says `opportunity 0` and the body agrees. Two things it *could* have filed as one, recorded here
so Phase 4 does not have to rediscover them: `HistoryPieChart.vue`'s `isNarrow` prop is the unfinished
half of a responsive layout (`F31` takes it), and the Detail view's bars have no click consumer at all
(`F29` names it) — a drill-*through* from a day's window to the timeline filtered to that window would be
the natural use, and the `activityClick` payload already carries the window. Neither is an opportunity
finding by the template's definition; both are noted.

**`user-settings` filed no `opportunity` finding** either (tally `opportunity 0`, body agrees). One thing
worth a line for Phase 4 so it is not rediscovered: `GET /user/google-calendar/status` returns only
`{ connected }`, and the card renders *Connect* unconditionally — once §9's second ask lands (a
`configured` flag or a `503` from `auth-url`), the card can hide or disable the row on deployments with no
Google client, which is every deployment today. Not an opportunity by the template's definition; a
follow-on to §9.

**`history-capture` filed no `opportunity` finding** (tally `opportunity 0`, body agrees). One thing for
Phase 4 so it is not rediscovered: `TimerPresetsSection` is mounted by `TimerView` only
(`TimerView.vue:42`), while the Pomodoro view has its own preset surface (`PomodoroPresetsDialog`) and
the Stopwatch and Manual views have none — so "quick times" exist for exactly one of the four capture
flows, and the *activity* presets (duration + activity) are the raw material for a one-tap "record 30 min
of X" on the Manual view that does not exist. Not an opportunity by the template's definition; noted.

**`auth` filed one `opportunity` finding, `O1`, and it is re-graded `bug` (`FW13`, §63)** — the
"policy question" it poses was answered on the server before the unit ran, so nothing is deferred.
Two things for Phase 4 so they are not rediscovered: the forgotten-password success copy promises a
mail the server may deliberately not have sent (enumeration guard, `FW9` flags the wording as a copy
decision); and the whole signed-out surface is framework-owned, so any "what should sign-in do next"
idea — remembering the last-used e-mail without persisting the whole `User`, a *resend confirmation*
link on the forgotten-password page for unconfirmed accounts (the server answers 204 for those too,
so the user is told a reset mail went out and nothing arrives) — is a `vue_framework` opportunity,
not this app's. Neither is an opportunity by the template's definition; both are noted.

**`planner-day` filed no `opportunity` finding** (tally `opportunity 0`, body agrees). The one its
brief handed it — *"`GET /task-planner-day-template/suggestions/{calendarId}` exists, returns 200, and
the client never calls it at all"* — is **not an opportunity, it is a defect**, and the brief's premise
is wrong in an instructive way: the client *does* call it (`DayTemplatePicker.vue:216` →
`taskPlannerDayTemplateApi.ts:38-41`), with `?date=` against a route that takes `/{calendarId}` — the
withdrawn `B5` bug, byte for byte, on the sibling endpoint — and the call is guarded out at runtime by a
mount-order accident, which is why nobody has seen the 400. Under *Needs verification*, `F45`-if-confirmed.
Nothing for Phase 4 from this unit.

**`tracking-dashboards` filed no `opportunity` finding** (tally `opportunity 0`, body agrees). Two things
for Phase 4 so they are not rediscovered, both fallen out of `B2`'s narrowing (§79): **(1) an Android
per-app detail endpoint** — the sibling of desktop's `GET /activity-tracking/desktop/process-details`
— is the only way *"View details for Spotify"* ever shows more than total time, share and package
name. The rows exist (`AndroidSessionData`: `SessionStartUtc`, `DurationSeconds`, per package), so
session count, first/last use and mean session length are one `GroupBy` away server-side; the client
half is `DesktopPieChartSection.vue:169-188`'s watcher, copied. Not a defect — the web dashboard's
detail is also local-only — but it is the feature the label promises. **(2) The pie sections' *Other*
bucket is computed in two places at two thresholds** (server at `minPercent: 1`, web client at 3 %,
the other three clients not at all) — once §10 settles the sentinel, one threshold in one place is the
tidy-up, and it is where a *"show the tail"* affordance (expand *Other* into its members) would live.
Neither is an opportunity by the template's definition; both are noted.

**`leisure-backlog-picker/O1` — `minParticipants`/`maxParticipants` are filter fields with no input,
and `maxParticipants` is never read by the picker's ranking.** Two halves, and only the second is
really an opportunity. The filter half is **moot until §13 lands** — the server reads neither field, so
an input for them today would be one more chip that filters nothing; note it on §13 rather than here.
The ranking half is real and app-side: `backlogSuggestion()` (`useLeisurePicker.ts:70`) reads
`minParticipants` into `CandidateFacts` and not `maxParticipants`, so a one-person entry is offered to
a four-person draw. The unit is right that `D1-backend.md`'s semantics question is why — *"not clear
whether it filters or…"* — and that question is a product decision (hard cap vs. penalty), which is
what makes it Phase-4 material rather than a batch. When it is weighed: `isEligible`'s backlog branch
is one comparison away, and `F64` will already have decided where the weather signal collapses, so the
same boundary is where a people cap would go.

**`leisure-bucket-anchors/O1` — `financialGoal`, `inspirationSource` and the anchor's source flags are
captured but never spent.** Goes to `docs/opportunities.md` at Phase 4. One correction for when it is
weighed: the finding says both fields render *"as plain columns"* on the table — `inspirationSource`
does not; it renders **"—"** on every row today (`FW20`), so the honest line is that the field is
shown nowhere at all. The savings-goal progress readout the unit sketches (`useExperiencedProgress`'s
pattern over `financialGoal`) is the cheapest of the three ideas and needs no backend.

No other open opportunity findings exist across the fifteen units triaged.

