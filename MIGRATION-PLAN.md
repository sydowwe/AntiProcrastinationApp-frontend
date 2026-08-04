# Migration plan — align with the `moja-digitálna-firma` architecture

Status: **decisions taken (§6), awaiting go-ahead to execute.** Nothing has been moved yet.

---

## 0. Where this project actually stands right now

Not a green field. Someone (you, presumably) already did a raw copy pass:

| What | State |
| --- | --- |
| `src/_common/` | Present, **untracked** (`?? src/_common/`), **byte-identical** to the reference's `src/_common` (146 files, all hashes match). Not a submodule. |
| `src/reminders/`, `src/notifications/` | Copied from the reference, staged as added, at `src/` root (not `src/core/`). |
| `src/scheduler/`, `src/user/` | Also copied from the reference, staged as added. |
| Copied modules' imports | **Not rewritten** — they still import `@/core/reminders/...`, `@/core/notifications/...`, `@/core/user/store/authStore.ts`, `@/router.ts`, and (in `user/`) `@/core/employee/...`. None of those paths exist here, so none of these files currently compile. |
| The original app | Untouched: `src/api`, `src/components`, `src/composables`, `src/dtos`, `src/locales`, `src/plugins`, `src/stores`, `src/utils`, `src/views`. |

So the job is: make the ground real, then land the already-copied modules on it.

### Already matching the target — no work needed

- `@` → `src` alias in `vite.config.ts` **and** `config/tsconfig.app.json` (`"paths": {"@/*": ["../src/*"]}`, `include: ["../src/**/*"]`) — covers `src/_common/**`. ✅
- Prettier block in `package.json` is character-for-character the reference's. ✅
- Build config already lives under `config/` (`tsconfig.app.json`, `tsconfig.node.json`, `nginx.conf`, certs). ✅
- Vuetify aliases, `defaults`, `display.thresholds` in `main.ts` already match the reference verbatim. ✅
- `VITE_API_URL` / `VITE_APP_URL` env contract matches; `_common/axiosConfig.ts` needs no env changes. ✅
- Deps: `vue@3.5`, `vue-router`, `pinia` + persistedstate, `vuetify@3.12`, `vue-i18n@11`, `axios`, `dayjs`, `@vueuse/core`, `@formkit/auto-animate`, all four `@fortawesome/*` v7 + `vue-fontawesome`, `vite-plugin-pwa`. ✅

### Deviations from the target

1. Flat `views/ components/ composables/ dtos/ api/ stores/ utils/` — no `src/core/<module>/` at all.
2. `router.ts` is at `src/plugins/router.ts`, one 275-line file, all routes inline, no `RouteMeta` augmentation, no role gate.
3. `src/locales/SK.ts` / `EN.ts` are single ~22 KB literal objects with `$vuetify` inlined — not aggregators.
4. No `src/i18n.ts`; `createI18n` is inline in `main.ts`.
5. `main.ts` misses all four framework registrations (`setAxiosRouter`, `setAuthAdapter`, `setNavTrees`, `setTranslator`) and the `ensureLoaded()` pinia plugin (present but commented out at `main.ts:51-55`).
6. `src/_common` is an untracked copy, not a submodule (resolved — see §1).
7. Two parallel implementations of essentially every piece of infrastructure (see §2).
8. `@microsoft/signalr` is not installed — `notifications/composable/useNotifications.ts` needs it.

---

## 1. ✅ Resolved: the framework repo is `sydowwe/MDF_framework`

The brief's §6 gave no URL, and neither project has a `.gitmodules` — in MDF, `src/_common` is still
146 ordinary tracked files. But the framework repo **does** exist independently:
`https://github.com/sydowwe/MDF_framework.git` (branch `main`, HEAD `b7dc6c6`).

Verified as a clean drop-in:

- Repo root maps **directly** onto `src/_common` — same `api/ auth/ component/ composable/ dto/ i18n/
  nav/ store/ utils/ _locales/ axiosConfig.ts axiosConfig.test.ts` layout.
- 147 files vs the 146 on disk here; the only difference is the repo's `README.md`.
- **Every shared file is byte-identical** to the untracked `src/_common` already sitting in this
  project — nothing to reconcile.

So step 1 is simply:

```bash
rm -rf src/_common                       # untracked copy, identical to the repo — safe to drop
git submodule add https://github.com/sydowwe/MDF_framework.git src/_common
git submodule update --init --recursive
```

Nothing in MDF gets touched. `config/tsconfig.app.json` already includes `../src/**/*` and maps
`@/*` → `../src/*`, so the mount resolves with no config change.

> Note, not a blocker: MDF itself still tracks `src/_common` as plain files rather than consuming this
> submodule, so the two can drift until MDF is switched over too. Worth doing in that repo separately.

---

## 2. Duplicate inventory

### Bucket A — exact duplicate (delete, repoint imports)

| Local | Framework | Importers |
| --- | --- | --- |
| `src/utils/fontAwesomeIcons.ts` | `_common/utils/fontAwesomeIcons.ts` | 2 |

That is the only byte-identical file. Everything else drifted.

### Bucket B — near-duplicate, framework wins, but behaviour differs

Adopting the framework version **silently changes behaviour** in these. Listed per §6's "say so rather than quietly adopting".

| Local | Framework | Drift | Importers |
| --- | --- | --- | --- |
| `plugins/axiosConfig.ts` (109 ln) | `_common/axiosConfig.ts` (191 ln) | Superset. Adds single-flight refresh, an `AUTH_ENDPOINTS` bypass list, **401 → redirect to `login` with `?redirect=`**, `extractServerMessage` / `extractServerFieldError`, and exports `refreshClient` + `setAxiosRouter`. Same `baseURL`, `withCredentials`, `/auth/refresh`. Local's `x-token-expired` proactive-refresh header hook is **dropped** — check your backend still behaves without it. | 48 |
| `api/base/*` (7 files) | `_common/api/*` (9) | `fetchFilteredTable.ts` → `useFetchFilteredTable.ts` (file *and* export renamed); adds `useRequestState`; `useEntityQuery` also exports `ResponseClass`. | 70 |
| `composables/general/EnumComposable.ts` | same path | Framework **drops** `convertToEnum()` and `getEnumKeyByValue()`. `TitleValueObject` → `ValueTitleDto`. | 18 |
| `composables/general/rules/RulesComposition.ts` | same path | Framework **lacks** `isOnlyNumbers`, `isLettersAndNumbers`, `isOnlyLettersWithDiacritics`, `isLettersWithDiacriticsAndSpecialChars`, `isLettersWithDiacriticsAndNumbersAndSpecialChars`. → **upstream request, see §7** | 17 |
| `utils/DateTimeHelper.ts` | same path | **Largest drift.** Local exposes a `useDateTime()` composable façade + `allDaysOfWeek`; framework exports ~21 loose functions (`formatToDate`, `formatLocalized`, `getISOWeekStart`, …). Every one of the 27 call sites is rewritten by hand. | 27 |
| `utils/formatDuration.ts` | same path | Renamed API: `formatDuration` → `fromSeconds`, `formatDurationDetailed` → `fromSecondsDetailed`. Framework drops the `Time` DTO dependency, adds `fromMinutes` / `fromDecimalHours`. Output identical. | 14 |
| `utils/notifications.ts` | same path | **Sync → async**, and routed through the service worker (works in installed PWAs). `checkNotificationPermission()` gone, replaced by `requestNotificationPermission()` + `isNotificationSupported()`. Every caller must `await`. | 3 |
| `utils/helperMethods.ts` | same path | Framework **lacks** `hasObjectChanged()`; adds `getNestedValue`, `formatFileSize`. → **upstream request, see §7** | 5 |
| `utils/colorPalette.ts` | same path | Local exports `useColor`; framework moved it to `_common/composable/general/useColor.ts`. | 11 |
| `utils/domainColor.ts` | same path | `'_other'` grey changes `#9e9e9e` → `hsl(0, 0%, 62%)`. Visually ~identical, cosmetic. | 14 |
| `utils/colorUtils.ts` | same path | Refactor only, same semantics. | 2 |
| `composables/table/TableHeaderComposable.ts` | same path | `getNestedValue` moved out to `_common/utils/helperMethods.ts`. | 2 |
| `composables/general/{ErrorHandlingFunctions,SnackbarComposable,LoadingComposable,useCurrentTime,useAutoScroll,useUndoStack,continuousQuickChangeComposition}` + `table/UseEditableCell` | same paths | Cosmetic (arrow → `function`, import order). `ErrorHandlingFunctions` now exports a `useErrorHandling()` wrapper. | ~90 |
| `composables/UseRecaptchaHandler.ts` (68 ln) | `_common/composable/UseRecaptchaHandler.ts` (42 ln) | Same exports, local is 26 lines longer — I'll diff line-by-line before swapping; flagging in case local carries a fix. | 3 |
| `components/general/**` (32 files) | `_common/component/**` | Framework wins. Folder renames: `dialogs/` → `dialog/`; `ChipWithIcon`, `MyCard`, `SubtleCard`, `Snackbar` → `feedback/`; `ColorPicker`, `InputWithButton`, `MergedInputs` → `inputs/`. | 126 |
| `dtos/dto/**`, `dtos/request/{base,interface}`, `dtos/response/{base,general}`, `dtos/response/interface/IIdResponse`, some `dtos/enum` | `_common/dto/**` | `TitleValueObject` → `ValueTitleDto`; `TableColumn`/`TableAction`/`EditableTableCell`/`EditableColumnMetadata` move under `dto/dto/table/`. | ~220 |

### Bucket C — genuinely app-specific (keep, relocate only)

Everything not listed above: `api/{activity,activityHistory,leisure,routineTodoList,taskPlanner,todoList}/**`, `components/{activity,activityTracking,addActivityToHistory,dayPlanner,history,historyDashboard,home,leisure,toDoList,user}/**`, `composables/{activity,dayPlanner,todoList,todoListDragAndDrop}/**`, `composables/general/useCalendarWeeks.ts`, `stores/dayPlanner/**`, `utils/{classDeserializationHelper,UserAuthUtils}.ts`, `dtos/**` app entities, all of `views/**`. Plus these local-only pieces with no framework counterpart:

- `components/general/calendar/CalendarDayCell.vue`, `inputs/DayOfWeekPicker.vue`
- `composables/general/useDialog.ts` + `components/general/dialogs/{DialogHost,DialogEntryRenderer}.vue` — stays app-local for this migration; unification deferred to `dialog-system-unification.md` (decision #3).

### Bucket D — framework-only, arrives unused (costs nothing, do not trim)

`HierarchyTree`, `ExportMenu`, `LookupDialog`, `LookupEditTable`, `MyPdfViewer`, `MyImg`, `TabsLayout`, `AdminTableCell`, `TableGrid`, `MonthYearPicker`, address form fields, `useServerTable`, `useTableUrlState`, `useTableFormatters`, `PriceFormatComposable`, `useBreadcrumbs`, `buildTree`, `checklistHelpers`, `fileDownload`, `validators`, `keyboardUtils`, `serviceWorker`, `enumHelpers`, `store/uiStore.ts`, the whole `nav/` shell.

### Bucket E — copied-in MDF modules that should not stay

| Path | Why | Proposal |
| --- | --- | --- |
| `src/user/` | MDF's user module: Entra-ID / Microsoft login, `MyAcknowledgmentsSection.vue` + `MyDocumentsSection.vue` **import `@/core/employee/*`** which does not and will not exist here. This app's auth is entirely different — Google login, reCAPTCHA v3, 2FA + scratch codes, registration, e-mail confirmation, session list. | **Delete the copy.** Build `src/core/user/` from *this* project's own user code. Keep exactly one file from the copy — `authAdapter.ts` — as the template for the framework binding. |
| `src/components/nav/{Navbar,NavbarDesktop,NavbarMobile}.vue` | Superseded by the framework's sidebar shell (decision #2). | **Delete.** `useNavItems.ts` survives as the item tree only → `src/app/nav/navItems.ts`. |

`src/scheduler/` is **kept and ported** (decision #4) → `src/core/scheduler/`.

---

## 3. Adaptations where this project genuinely conflicts

**Roles.** This is a single-user productivity app. It has no role concept at all — `useUserStore` has only `isAuthenticated`. The framework's `RequiredRole = 'hr' | 'admin' | 'rootAdmin'` is meaningless here, and I must not edit `_common/nav/navTypes.ts` to change it.

Resolution: implement the `AuthAdapter` role getters as constant `true`.

```ts
// src/core/user/authAdapter.ts
isHrRole: () => true,
isAdminRole: () => true,
isRootAdmin: () => true,
```

`hasRequiredRole()` then passes for every route, the router guard degrades to a pure auth check, and the reminders module's `meta: { requiredRole: 'admin' }` routes stay reachable **unmodified** — which is exactly what the acceptance test needs. The canonical `RequiredRole` type stays shared by nav + router + views, per §3 of your brief. No `RequiredRole` renaming needed.

**`userStore` → `authStore`.** The framework's contract wants `src/core/user/store/authStore.ts` with `isAuthenticated`, `logout`, `loggedInUser`, role getters. This project has `src/stores/userStore.ts` with `isAuthenticated`, `logout`, `login`, `currentUser`, `userName`, `hydrateFromServer`, `setPreferences`, persisted to `localStorage`. I'll rename the store file and add a `loggedInUser` alias for `currentUser`, keeping all existing members and the `localStorage` persistence so nothing in the app breaks. 17 importers repoint.

**reCAPTCHA.** This project *does* use it (`VITE_RECAPTCHA_V3_SITE_KEY`, `showRecaptchaBadge` on 5 routes). Keep the reference's `afterEach` badge toggle as-is.

**Locales.** Both apps are SK-primary with EN fallback — no adaptation needed. `$vuetify` gets extracted from the two 22 KB literals into `_common/_locales/vuetifyLocale.sk.ts` (already present, already correct).

---

## 4. Target module map

```
src/
  App.vue            HomeView.vue        main.ts       router.ts     i18n.ts
  assets/
  app/nav/navItems.ts                    ← the tree only; framework owns the shell
  locales/{SK,EN}.ts                     ← aggregators only
  _common/                               ← framework, never edited from here
  core/
    activity/  activityHistory/  activityTracking/  historyDashboard/
    dayPlanner/  todoList/  leisure/  googleCalendar/
    home/  user/  notifications/  reminders/  scheduler/
```

Directory-level move rules (the per-file table follows mechanically — ~450 `git mv`s, so it is not reproduced here in full; I'll paste the exact list per module in each commit message):

| From | To |
| --- | --- |
| `api/activity/*` · `components/activity/*` · `components/ActivitySelect*.vue` · `composables/activity/*` · `dtos/*/activity/*` | `core/activity/{api,component,composable,dto}/` |
| `api/activityHistory/*` (minus dashboard) · `components/addActivityToHistory/*` · `components/history/*` · `views/addActivityHistory/*` · `views/history/{HistorySummary,HistoryDetail,HistoryCalendar}View.vue` · `api/calendarApi.ts` | `core/activityHistory/{api,component,view,dto}/` |
| `api/activityHistory/historyDashboardApi.ts` · `components/historyDashboard/*` · `dtos/*/historyDashboard/*` | `core/historyDashboard/` |
| `api/{activityTracking,androidActivityTracking,desktopActivityTracking}Api.ts` · `components/activityTracking/*` · `views/tracker/*` · `dtos/*/activityTracking/*` | `core/activityTracking/` |
| `api/taskPlanner/*` · `api/plannerSettingsApi.ts` · `components/dayPlanner/*` · `composables/dayPlanner/*` · `stores/dayPlanner/*` · `views/dayPlanner/*` · `dtos/*/activityPlanning/*` | `core/dayPlanner/{api,component,composable,store,view,dto}/` |
| `api/{todoList,routineTodoList}/*` · `components/toDoList/*` · `composables/{todoList,todoListDragAndDrop}/*` · `views/todoList/*` · `dtos/*/todoList/*` | `core/todoList/` |
| `api/leisure/*` · `components/leisure/*` · `views/leisure/*` · `dtos/*/leisure/*` | `core/leisure/` |
| `api/{userApi,sessionsApi}.ts` · `components/user/*` · `views/user/*` · `dtos/*/user/*` · `stores/userStore.ts` · `utils/UserAuthUtils.ts` · `composables/UseRecaptchaHandler.ts` | `core/user/{api,component,view,dto,store}/` (+ new `authAdapter.ts`) |
| `api/googleCalendarApi.ts` · `views/googleCalendar/*` | `core/googleCalendar/` |
| `components/home/*` | `core/home/component/`; `views/HomeView.vue` → `src/HomeView.vue` |
| `src/notifications/` · `composables/general/UsePushNotifications.ts` | `core/notifications/` |
| `src/reminders/` | `core/reminders/` |
| `src/scheduler/` | `core/scheduler/` |
| `components/nav/useNavItems.ts` | `app/nav/navItems.ts` (tree only, `needsAdmin` dropped) |
| `components/nav/{Navbar,NavbarDesktop,NavbarMobile}.vue` | **deleted** — replaced by `@/_common/nav/Navbar.vue` |
| `components/general/**` · `composables/general/**` · `composables/table/**` · `utils/**` · `dtos/{dto,enum,request/base,request/interface,response/base,response/general}` · `plugins/axiosConfig.ts` · `api/base/**` | **deleted**, imports repointed to `@/_common/...` |

`src/plugins/` disappears entirely (`router.ts` → `src/router.ts`, `axiosConfig.ts` → deleted).

Each module gets `<module>.routes.ts` + `_locales/<module>.sk.ts` / `.en.ts`. Cross-module imports allowed only via `api/` and `dto/`; anything shared that isn't in the framework gets flagged to you rather than cross-imported.

---

## 5. Execution order — one commit per step, on branch `chore/architecture-alignment`

`git mv` throughout. After **every** step: `npm run type-check` and `npm run lint` clean for touched files, and `npm run dev` still boots with every route resolving.

| # | Step | Risk |
| --- | --- | --- |
| 1 | Branch. Drop the untracked `src/_common` copy, `git submodule add https://github.com/sydowwe/MDF_framework.git src/_common`, `--init --recursive`. Install `@microsoft/signalr`. Verify all 33 acceptance-test import paths resolve. | low |
| 2 | Delete the copied `src/user/` (keeping `authAdapter.ts` as the template). `src/scheduler/` stays. | low |
| 3 | **Infra: http.** Delete `plugins/axiosConfig.ts` → `@/_common/axiosConfig.ts`; add `setAxiosRouter(router)`. 48 files. | med — 401 flow changes |
| 4 | **Infra: base API.** Delete `api/base/**` → `@/_common/api/*`; rename `fetchFilteredTable` → `useFetchFilteredTable`. 70 files. | med |
| 5 | **Infra: base DTOs.** Delete duplicated `dtos/**` → `@/_common/dto/**`; `TitleValueObject` → `ValueTitleDto`. ~220 files. | med — largest mechanical diff |
| 6 | **Infra: composables.** snackbar / loading / error handling / enums / rules / table. Re-add the 5 missing rules locally *only if* you decline the upstream fix. `useDialog` is **excluded** — stays app-local. ~90 files. | med |
| 7 | **Infra: components.** `components/general/**` → `@/_common/component/**`. `dialogs/{DialogHost,DialogEntryRenderer}.vue` **excluded**. 126 files. | med |
| 8 | **Infra: utils.** `DateTimeHelper` (`useDateTime()` façade → loose fns, 27 sites), `formatDuration` rename, async `notifications`, `colorPalette`/`useColor`. | **high** — most behaviour drift |
| 9 | **Restructure into `core/`**, module by module, one commit each, in dependency order: activity → activityHistory → historyDashboard → activityTracking → dayPlanner → todoList → leisure → googleCalendar → home → user. | med |
| 10 | **Router.** Split into `<module>.routes.ts`; new `src/router.ts` with `RouteMeta` augmentation, `commonRoutes`, auth + `hasRequiredRole` guard, reCAPTCHA `afterEach`. Delete `src/plugins/`. | med |
| 11 | **i18n.** Split the two 22 KB literals into per-module `_locales/<module>.{sk,en}.ts`; `SK.ts`/`EN.ts` become aggregators spreading `vuetifyLocale` + `common` first; new `src/i18n.ts`. | med — key paths shift |
| 12 | **`main.ts` + `App.vue` + nav shell.** All four registrations (`setAxiosRouter`, `setAuthAdapter`, `setNavTrees`, `setTranslator`), `ensureLoaded()` pinia plugin (uncomment `main.ts:51-55`), `src/app/nav/navItems.ts` extracted, `_common/nav/Navbar.vue` swapped in, old `components/nav/*` deleted, `NotificationBell` into the `#actions` slot. Keep `vue3GoogleLogin` + the local theme/locale `watch` in `App.vue`. | **high** — visible UX change |
| 13 | **`core/notifications` + `core/reminders` + `core/scheduler`** land: rewrite their `@/core/...` self-imports, wire `remindersRoutes` / `schedulerRoutes` + the `reminderPreferences` route, spread their locales. | low — the acceptance test |
| 14 | `CLAUDE.md` rewrite + port `docs/framework/*.md`. ESLint parity (`vue/eqeqeq`, `vue/prefer-true-attribute-shorthand`), config file relocation if cheap. | low |

---

## 6. Decisions — taken

1. **`_common` mounting** → **git submodule from `https://github.com/sydowwe/MDF_framework.git`.**
   Verified byte-identical to the copy on disk; see §1.
2. **Nav shell** → **adopt the framework sidebar.** `_common/nav/Navbar.vue` (= `AppTopBar` +
   collapsible `AppSidebar`, with `UserMenu`, `AppBreadcrumbs` and the rail toggle in
   `_common/store/uiStore.ts`) replaces `components/nav/{Navbar,NavbarDesktop,NavbarMobile}.vue`,
   which are **deleted**. `NotificationBell` mounts through `AppTopBar`'s `#actions` slot, forwarded
   by `Navbar` — exactly as `App.vue` does in the reference. `components/nav/useNavItems.ts` is
   reduced to the item tree at `src/app/nav/navItems.ts` (drop `needsAdmin`; no `requiredRole`
   anywhere, since this app has no roles) and registered via `setNavTrees({ main: navItems })`.
   *This is a deliberate, visible UX change: the app moves from a top navbar to a sidebar shell.*
3. **Dialog system** → **postponed, and written up separately.** See
   **`dialog-system-unification.md`**. The alignment migration leaves
   `src/composables/general/useDialog.ts` + `components/general/dialogs/{DialogHost,DialogEntryRenderer}.vue`
   untouched and app-local (they move with the restructure in step 9, nothing more).
   Reason it can't just follow "framework wins": the framework's `CentralDialogComposable.ts` is
   **dead code** — zero call sites in all of MDF, and no renderer component exists, so its
   `openDialog()` Promise can never resolve. This project's implementation is the only working one of
   the two. The follow-up doc recommends upstreaming it into the framework and deleting the stub.
4. **`src/scheduler/`** → **keep and port.** The backend does expose the scheduled-job endpoints.
   It lands as `src/core/scheduler/` alongside reminders, with its routes and
   `_locales/scheduler.sk.ts` wired in. Treated as a third acceptance-test module: its imports get
   the same `@/core/...` rewrite, and it pulls the same framework surface (`useFetchFilteredTable`,
   `FilterPanel`, `BasicTable`, `ExportMenu`, `DateTimePicker`, …).

---

## 7. Upstream requests for the framework (do **not** fork these locally)

Per §6: capabilities this project needs that `_common` lacks. Add them in MDF and I'll pull them in.

| Where | What's missing | Used by |
| --- | --- | --- |
| `composable/general/rules/RulesComposition.ts` | `isOnlyNumbers`, `isLettersAndNumbers`, `isOnlyLettersWithDiacritics`, `isLettersWithDiacriticsAndSpecialChars`, `isLettersWithDiacriticsAndNumbersAndSpecialChars` | 17 files (activity + todo-list forms) |
| `utils/helperMethods.ts` | `hasObjectChanged<T>(original, modified)` | dirty-form checks |
| `composable/general/EnumComposable.ts` | `convertToEnum()`, `getEnumKeyByValue()` | 18 files |
| `utils/DateTimeHelper.ts` | `allDaysOfWeek` constant | day-of-week pickers |
| `component/calendar/` | `CalendarDayCell.vue` | app calendar grid |
| `component/inputs/` | `DayOfWeekPicker.vue` | routine scheduling |

If you'd rather not upstream them, say so and they stay as app-local files under the owning module (not in `_common`) — I'll note it as a deviation.

Separately, `_common/composable/CentralDialogComposable.ts` is **dead code in the framework** — no call sites in MDF, no renderer component, so its `openDialog()` Promise can never resolve. The recommended fix is to replace it with this project's working `useDialog` + `DialogHost`. Scoped out of this migration; see **`dialog-system-unification.md`**.
