# Task: align this project's architecture with the "moja-digitálna-firma" frontend

You are restructuring **this** Vue 3 + Vuetify 3 project so it matches the architecture and conventions of a
reference project of mine. The end goal: I want to be able to **copy the `reminders` and `notifications`
modules over from the reference project and have them work with at most import-path tweaks**.

## Reference project

`C:\Users\jakub\WebstormProjects\moja-digitalna-firma_frontend`

**Read it before you write anything.** It is on the same machine — open the real files rather than guessing
from the description below. The description is a summary, the repo is the source of truth. When a file in the
reference is domain-agnostic infrastructure (everything under `src/_common/`, `src/i18n.ts`, `src/router.ts`,
`src/main.ts`, `config/`), prefer **copying it verbatim** and adapting, over writing your own version.

Also read the reference project's `CLAUDE.md` and `docs/framework/*.md` (`api.md`, `baseDtos.md`,
`components.md`, `composables.md`, `filterUsage.md`, `utils.md`) — those describe the conventions you must
end up matching.

---

## Step 0 — audit first, then plan

Before changing anything:

1. Map this project's current layout: where views, components, DTOs, API calls, stores, locale strings and
   routes live today.
2. List every deviation from the target architecture below.
3. Produce a **duplicate inventory**: for every file in this project, whether the framework submodule (§6)
   already provides an equivalent. Three buckets — *exact duplicate* (delete, repoint imports),
   *near-duplicate with drifted behaviour* (flag it, note the difference, then adopt the framework's),
   *genuinely app-specific* (keep, just relocate).
4. Write a short migration plan (file-move table: `old path → new path`, plus the delete list) and
   **show it to me before executing**. Do not start moving files until I approve the plan.

Suggested order once approved: mount the submodule → delete duplicates and repoint imports → restructure into
modules → router → i18n → main.ts wiring → config/lint parity.

Use `git mv` for moves so history survives. Work on a branch.

---

## Target architecture

### 1. Folder layout

```
src/
  App.vue
  HomeView.vue
  main.ts
  router.ts
  i18n.ts
  assets/
  locales/
    SK.ts            # aggregator only
    EN.ts            # aggregator only
  _common/           # domain-agnostic, reusable across every module
    axiosConfig.ts
    api/
    component/
    composable/
    dto/
    nav/
    store/
    utils/
    _locales/
  core/              # business modules, one folder per module
    <module>/
  <tenant-or-app-specific>/   # optional: app-specific modules outside core (reference has `hbcleaning/`)
```

### 2. Module folder shape

Every module under `src/core/` looks like this (create only the folders it needs):

```
src/core/<module>/
  <module>.routes.ts          # exports `export const <module>Routes: RouteRecordRaw[]`
  _locales/
    <module>.sk.ts            # default-exports ONE namespaced object: { <module>: { ... } }
    <module>.en.ts
  api/
    <Entity>Api.ts            # composables built on src/_common/api/ helpers
  component/                  # module-scoped components
  composable/                 # module-scoped composables
  dto/
    enum/
    request/
    response/
  view/                       # route-level views, one per route
  store/                      # only when the module needs Pinia state
```

Large modules may nest **sub-features** one level deeper, each with the same shape — see
`src/core/employee/` (`acknowledgment/`, `checklist/`, `policy/`, …, each with its own `api/component/dto/view/store`)
and `src/core/notifications/reminderPreference/` in the reference. Do not nest deeper than that.

Rules:
- **No cross-module imports of another module's internals** except through its `api/` and `dto/`. Shared UI
  goes to `src/_common/component/`, shared logic to `src/_common/composable/` or `src/_common/utils/`.
- A module never imports from a sibling module's `view/`.

### 3. `router.ts`

Match `src/router.ts` in the reference exactly in shape:

- Each module owns its routes in `src/core/<module>/<module>.routes.ts`, exporting a
  `RouteRecordRaw[]`; views imported statically at the top of that file.
- Root `router.ts` only: imports the per-module arrays, keeps a small inline `commonRoutes` array for
  app-shell/auth routes (`/`, `/login`, user settings, …), and spreads them all into `createRouter`.
- Augment route meta so role gating is type-checked:

```ts
declare module 'vue-router' {
    interface RouteMeta {
        requiredRole?: RequiredRole
        showRecaptchaBadge?: boolean
    }
}
```

- `beforeEach` guard: show full-screen loading → auth check against the auth store (redirect to `login` with
  `query.redirect`, and bounce authenticated users away from `login`) → role gate via
  `hasRequiredRole(authStore, to.meta.requiredRole)` → hide loading. The router guard **backstops** the
  in-component role gating; it is not the only check.
- `afterEach`: toggles the reCAPTCHA badge visibility from `to.meta.showRecaptchaBadge` (keep only if this
  project uses reCAPTCHA).
- Role model lives in `src/_common/nav/navItems.ts`: `export type RequiredRole = 'hr' | 'admin' | 'rootAdmin'`,
  the `MenuItem` interface, the `navItems` tree, and `hasRequiredRole()`. Nav items and route `meta.requiredRole`
  must agree. Adapt the role names to whatever roles this project actually has — but keep the single
  canonical `RequiredRole` type shared by nav + router + views.

### 4. i18n

- `src/i18n.ts`: `createI18n({ locale: 'SK', fallbackLocale: 'EN', messages: { SK, EN } })` (adapt the
  locales to this project).
- `src/locales/SK.ts` and `EN.ts` are **aggregators only** — they import each module's `_locales/<module>.sk.ts`
  and spread them:

```ts
import vuetifyLocale from '../_common/_locales/vuetifyLocale.sk.ts'
import common from '../_common/_locales/common.sk.ts'
import reminders from '@/core/reminders/_locales/reminders.sk'
// …

const SK = { ...vuetifyLocale, ...common, ...reminders /* … */ }
export default SK
```

- Each module locale file default-exports one object keyed by the module namespace, so keys read
  `reminders.list.title`, `reminders.status.Active`, etc. Sub-namespaces are fine as separate files
  (`remindersDashboard.sk.ts` → `reminderDashboard.*`).
- Vuetify's own strings come from `$vuetify` inside the locale bundle, wired through
  `createVueI18nAdapter` in `main.ts`.
- Enum labels are translated by key equal to the enum's string value (`reminders.status.Active`) — this is
  what `EnumComposable` relies on. Keep that.
- **All user-facing strings go through `vue-i18n`.** No literal strings in templates.

### 5. `main.ts`

Copy the reference `src/main.ts` and adapt. It must set up, in order:

- `createPinia()` + `piniaPluginPersistedstate` + a plugin that calls `store.ensureLoaded()` on every store
  that defines it (so views never call `ensureLoaded()` in `onMounted`).
- router + `setAxiosRouter(router)` (axios needs the router for 401 → login redirects).
- i18n.
- FontAwesome (`fas`/`far`/`fab` into `library`, global `FontAwesomeIcon` component).
- Vuetify: `fa-svg` icon set; the custom **aliases** `VIdSelect`, `VIdAutocomplete`, `VIconBtn`, `VIconSmall`;
  the `defaults` block (VBtn `variant="elevated"`, VCard `rounded="lg"`,
  VTextField/VTextarea/VIdSelect/VIdAutocomplete `variant="outlined" clearable density="comfortable"`, …);
  the `display.thresholds`; and the dark/light **theme colour set** (`primary`, `secondary`, `primaryOutline`,
  `secondaryOutline`, `errorDark`, `successDark`, `warningDark`, `primary-accent`, `secondary-accent`,
  `primary-container`, `secondary-container`, `textMuted`, `neutral-0`…`neutral-900`). Copy this block verbatim
  unless this project already has a deliberate brand palette — in that case keep the **colour names**, change the
  hex values, because components reference the names.
- `autoAnimatePlugin` (`v-auto-animate` for list transitions).
- `router.isReady().then(() => app.mount('#app'))`.

### 6. `src/_common/` — a git submodule, NOT a copy

The framework lives in its own repository and is mounted into **both** projects as a git submodule at exactly
`src/_common`. Do not copy these files, and never edit them from this project — changes to shared code are
made in the framework repo and pulled in as a submodule bump.

```
git submodule add <framework-repo-url> src/_common
git submodule update --init --recursive
```

The contract you must satisfy for the submodule to resolve:

- **Mount path is fixed at `src/_common`** — files inside the framework import each other and themselves as
  `@/_common/...`, so any other location breaks them.
- **`@` must alias to `src`** in the vite config *and* the tsconfigs (`paths: { "@/*": ["./src/*"] }`), and
  `include` must cover `src/_common/**`.
- The framework imports nothing app-specific. It reaches the app only through four registrations, and you
  must wire **all** of them or the failure shows up at runtime, not at compile time:
    - `setAxiosRouter(router)` — from `@/_common/axiosConfig.ts`, so the interceptor can redirect on 401.
    - `setAuthAdapter(createAuthAdapter())` — from `@/_common/auth/authAdapter.ts`. The app implements the
      `AuthAdapter` interface (`isAuthenticated`, `displayName`, `logout()`, `isHrRole()`, `isAdminRole()`,
      `isRootAdmin()`) over its own auth store. Implement `isAuthenticated`/`displayName` as **getters** that
      read the store on access — that is what keeps the nav shell reactive without the framework importing Pinia.
    - `setNavTrees({ main, customer, system })` — from `@/_common/nav/navRegistry.ts`, with this app's
      `MenuItem[]` trees. The framework owns the nav *vocabulary* (`@/_common/nav/navTypes.ts`:
      `RequiredRole`, `MenuItem`, `RoleGetters`, `hasRequiredRole`, `matchesPath`), never the menu itself.
    - `setTranslator(...)` — from `@/_common/i18n/translator.ts`, wrapping `i18n.global.t`, so framework code
      that runs outside a component (http interceptor, error handling, undo stack) can translate.

  The first two must be registered **before** the router resolves its first navigation and before the shell
  mounts. Feature components the shell needs (e.g. the notification bell) go in through the top bar's
  `#actions` slot, forwarded by `Navbar` — the framework never imports a feature module.
- CI and any fresh clone need `submodules: recursive`; a plain `git clone` leaves `src/_common` empty.

Then **delete this project's duplicates** and repoint their imports at `@/_common/...`. Expect this to be the
single biggest chunk of the migration. Rules:

- The framework version **always wins**, even when this project's local version looks nicer. The whole point
  is one implementation. If the local one has a genuinely needed capability the framework lacks, do not fork
  it — list it for me and I'll add it upstream.
- Work by category, not file-by-file: http client → base API composables → base DTOs → composables
  (snackbar/loading/error handling/enums/rules/table) → components (data tables, dialogs, pickers, filter
  panel, chips) → utils. Delete the local file, rewrite every importer, type-check, commit. One commit per
  category so a bad merge is easy to isolate.
- Watch for **near-duplicates with drifted behaviour** — a local `formatDate` with a different default format,
  a local table composable with different paging defaults. These compile fine and change behaviour silently.
  Where the semantics differ, say so in your summary rather than quietly adopting the framework's.
- Anything local that is genuinely app-specific (not a duplicate) stays in this project, under
  `src/<app>/` or the owning module — not in `src/_common`.

What the framework provides, so you can recognise the duplicates in this project:

- **`axiosConfig.ts`** — exports `API` (interceptors: auth header, refresh-on-401, error mapping) and
  `refreshClient` (no interceptors, auth only). Nothing outside auth uses `refreshClient`; nobody uses bare
  `axios`.
- **`api/`** — `useEntityQuery`, `useEntityCommand`, `useFetchFiltered`, `useFetchFilteredSorted`,
  `useFetchSorted`, `useFetchFilteredTable`, `useAttachmentUpload`, `useRequestState`. Per-entity API
  composables in modules are thin wrappers over these (see `src/core/reminders/api/ReminderDefinitionApi.ts`
  for the canonical example: one `const ENTITY = 'reminder-definition'`, a `createRequestState()` shared
  between helpers, plus loose exported functions for non-CRUD actions).
- **`dto/`** — the base request/response classes: `IdResponse`, `BaseTableResponse`, `BaseTableItemResponse`,
  `SelectOption`, `LookupRequest`/`LookupResponse`, `FilteredTableRequest`, `FilterSortRequest`, `SortByRequest`,
  `FilterRequest`, the `I*Request` interfaces, `ExportFormat`, and the small shared dtos (`Time`, `VSortItem`,
  `TableColumn`, `TableAction`, `MenuAction`, `DialogConfig`, `Address`, …) plus `dto/enum/`.
- **`composable/`** — `SnackbarComposable`, `LoadingComposable`, `ErrorHandlingFunctions`, `EnumComposable`,
  `rules/RulesComposition`, `useBreadcrumbs`, `useCurrentTime`, `useUndoStack`, `useAutoScroll`, `useColor`,
  `PriceFormatComposable`, `CentralDialogComposable`, and the `table/` set (`useServerTable`,
  `useTableUrlState`, `useTableFormatters`, `TableHeaderComposable`, `UseEditableCell`).
  (`useNotifications` / `UsePushNotifications` are **not** here — they belong to the notifications module and
  arrive with it.)
- **`component/`** — `dataTable/` (incl. `BasicTable.vue`), `dialog/MyDialog.vue` (base for every dialog),
  `feedback/` (`ChipWithIcon.vue`, `InfoRow.vue`, …), `dateTime/` (`DateTimePicker.vue`, `TimePicker.vue`),
  `inputs/`, `form/`, `calendar/`, `FilterPanel.vue`, `ExportMenu.vue`, `ActionBar.vue`, `TabsLayout.vue`,
  `HierarchyTree.vue`.
- **`utils/`** — `DateTimeHelper`, `fileDownload`, `enumHelpers`, `notificationTypeMeta`, `notifications`,
  `serviceWorker`, `fontAwesomeIcons`, `colorUtils`/`colorPalette`/`domainColor`, `buildTree`,
  `formatDuration`, `helperMethods`, `validators`, `keyboardUtils`.
- **`nav/`** — the shell components (`AppSidebar`, `AppTopBar`, `Navbar`, `SidebarNavGroup`, `SidebarNavItem`,
  `UserMenu`, `AppBreadcrumbs`), the `RequiredRole` type, the `MenuItem` interface, `hasRequiredRole()` and
  `useNavAccess`. **The nav item tree itself is app-specific** and lives in this project (e.g.
  `src/app/navItems.ts`), passed into the sidebar — it must not go into the submodule.
- **`store/uiStore.ts`**.
- **`_locales/`** — the framework's own strings (`vuetifyLocale.sk.ts`, `common.sk.ts`), spread first in
  `src/locales/SK.ts`.

Anything in the framework this project doesn't use simply goes unused — that costs nothing. Do not trim the
submodule.

### 7. Build/config parity

- Path alias `'@' → src` in `config/vite.config.ts` (or wherever this project's vite config lives) **and** in
  the tsconfigs.
- Reference keeps build config under `config/` (`vite.config.ts`, `eslint.config.ts`, `tsconfig.app.json`,
  `tsconfig.node.json`, `env.d.ts`, `globals.d.ts`) with npm scripts pointing at it. Match this only if it's
  cheap; it is the least important item on the list.
- Prettier config (in `package.json`): tabs, width 4, no semicolons, single quotes, printWidth 120,
  `arrowParens: 'avoid'`, `vueIndentScriptAndStyle: true`, `singleAttributePerLine: true`, `endOfLine: 'lf'`.
  Copy it — otherwise every copied file reformats into a diff storm.
- ESLint: same config as the reference, incl. `vue/eqeqeq` and `vue/prefer-true-attribute-shorthand`.
- Dependencies that must exist (check `package.json` against the reference and install what's missing):
  `vue@^3.5`, `vue-router`, `pinia` + `pinia-plugin-persistedstate`, `vuetify@^3.12`, `vue-i18n@^11`,
  `axios`, `dayjs`, `@vueuse/core`, `@formkit/auto-animate`, the four `@fortawesome/*` v7 packages +
  `@fortawesome/vue-fontawesome`, `@microsoft/signalr` (needed by `useNotifications`), and — if you port push
  notifications — `vite-plugin-pwa`.

### 8. `CLAUDE.md`

Create/update this project's `CLAUDE.md` by adapting the reference's. It is what keeps future work consistent.
Must cover: function declarations over arrow consts; PascalCase components + camelCase props in templates;
`defineModel` over manual `modelValue`; props via destructure defaults (**never** `withDefaults`); typed
`defineEmits`; strict `===`; boolean attribute shorthand; `ref` over `reactive`; `try/catch` + `async/await`;
DTO rules (`fromJson`/`listFromObjects`, no defaults masking missing fields, table rows extend `IdResponse`);
API composable rules; i18n rules; store rules (setup stores, no `ensureLoaded` in `onMounted`); URL-state rule
(filters/tabs/search/pagination live in query params); Vuetify styling priority (props → utility classes →
custom CSS) and `VNumberInput` over `type="number"`; the alias/theme-colour list; and the lint command.
Also port `docs/framework/*.md` (adjusted to what you actually copied) so the doc references in `CLAUDE.md` resolve.

---

## The actual acceptance test: reminders + notifications must drop in

The reference's `src/core/reminders/` and `src/core/notifications/` import these things from outside
themselves. All but the last come from the framework submodule, so they exist for free once it is mounted at
`src/_common` and the `@` alias resolves — **verify each one actually resolves** rather than assuming, since a
half-initialised submodule or a missing tsconfig `include` fails exactly here:

```
@/_common/axiosConfig.ts                                   (API)
@/_common/api/useEntityQuery.ts
@/_common/api/useFetchFilteredTable.ts
@/_common/api/useRequestState.ts
@/_common/component/ExportMenu.vue
@/_common/component/FilterPanel.vue
@/_common/component/dataTable/BasicTable.vue
@/_common/component/dateTime/DateTimePicker.vue
@/_common/component/dateTime/TimePicker.vue
@/_common/component/dialog/MyDialog.vue
@/_common/component/feedback/ChipWithIcon.vue
@/_common/component/feedback/InfoRow.vue
@/_common/composable/general/EnumComposable.ts
@/_common/composable/general/ErrorHandlingFunctions.ts
@/_common/composable/general/SnackbarComposable.ts
@/_common/composable/general/useBreadcrumbs.ts
@/_common/composable/general/useCurrentTime.ts
@/_common/dto/ExportFormat.ts
@/_common/dto/dto/Time.ts
@/_common/dto/dto/VSortItem.ts
@/_common/dto/dto/table/TableColumn.ts
@/_common/dto/request/base/FilteredTableRequest.ts
@/_common/dto/request/interface/IFilterRequest.ts
@/_common/dto/response/base/BaseTableResponse.ts
@/_common/dto/response/base/IdResponse.ts
@/_common/dto/response/interface/IIdResponse.ts
@/_common/utils/DateTimeHelper.ts
@/_common/utils/fileDownload.ts
@/core/user/store/authStore.ts                             (isAuthenticated + role getters)
```

Plus, structurally:
- `src/core/user/store/authStore.ts` must exist with `isAuthenticated`, `logout`, `loggedInUser` and the role
  getters that `hasRequiredRole` consumes — and it must be **registered into the framework's auth adapter in
  `main.ts`**, because the submodule never imports it directly.
- `NotificationBell` must be supplied to the framework's `AppTopBar` through its slot/injection point; the
  top bar does not import it.
- `src/core/reminders/reminders.routes.ts` will register routes under `/pripomienky/*` with
  `meta: { requiredRole: 'admin' }` on all but `/pripomienky/moje` — so the `RequiredRole` union must
  include `'admin'` (rename consistently if this project's roles differ).
- The notifications module owns `component/NotificationBell.vue` (mounted in the top bar) and the
  `reminderPreference/` sub-feature whose view is routed from `commonRoutes` at `/nastavenia/pripomienky`.
- Locale namespaces `reminders.*`, `reminderDashboard.*` and the notification strings must be spreadable
  into `src/locales/SK.ts`.

**Do not copy the reminders/notifications modules yourself** — I'll do that afterwards. Your job is to make the
ground they land on identical.

---

## Working rules

- Show me the migration plan before executing it. After that, work module by module, committing per module.
- **Never edit anything under `src/_common`** — it is a submodule shared with another project. If the
  framework needs a change, stop and tell me what and why; I'll make it upstream and bump the pointer. A
  commit that contains modified submodule contents is a mistake, not a shortcut.
- After each module migration: `npx vue-tsc --noEmit` (or this project's type-check script) and the lint
  command must both be clean for the files you touched. Fix `vue/eqeqeq` and
  `vue/prefer-true-attribute-shorthand` by hand — `--fix` does not.
- The app must still run (`npm run dev`) and every existing route must still resolve after each commit. This
  is a restructure, not a rewrite: do not change behaviour, do not "improve" business logic along the way.
- If something in this project genuinely conflicts with the target convention (different auth model, different
  roles, no reCAPTCHA, different locales), adapt rather than force it — but tell me explicitly what you
  deviated on and why, in a short summary at the end.
