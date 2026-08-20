# AntiProcrastinationApp Frontend Rules

## Tech Stack

- **Backend**: .Net10 with fastEndpoints
- **Framework**: Vue 3.5+ (Composition API with `<script setup lang="ts">`)
- **UI**: Vuetify 3
- **ICONS** FontAwesome 7
- **State**: Pinia (Composition API / Setup Stores) — persists to `sessionStorage` by default (set `persist: false` to disable)
- **Routing**: Vue Router
- **HTTP**: Axios — dual instances: `API` (main, with interceptors) and `refreshClient` (token refresh only, no interceptors). Never use `refreshClient` directly
  outside auth logic.
- **Realtime**: `@microsoft/signalr`, used only by the framework's notifications module
- **Animations**: `@formkit/auto-animate` — registered globally, use `v-auto-animate` directive for list enter/leave animations instead of custom CSS transitions

## Architecture — read this first

The app is **module-first**, not layer-first. There is no top-level `api/`, `views/`, or `stores/`.

```
src/
  App.vue  HomeView.vue  main.ts  router.ts  i18n.ts  globals.d.ts
  _common/                        ← the vue_framework git submodule. NEVER EDIT.
  app/
    nav/navItems.ts               ← the sidebar tree (data only)
    notifications/notificationTypeMeta.ts
  core/<module>/                  ← one directory per feature
    api/ component/ composable/ dto/ store/ view/
    <module>.routes.ts
    _locales/<module>.{sk,en}.ts
  locales/{SK,EN}.ts              ← aggregators only, plus common.{sk,en}.ts
  components/ composables/ dtos/ utils/   ← ONLY the leftovers listed below
```

Modules: `activity`, `activityHistory`, `activityTracking`, `historyDashboard`, `dayPlanner`, `todoList`, `leisure`, `googleCalendar`, `home`.

`historyDashboard` is not a feature module — it is a **component library** for `activityHistory`. It has no routes, no views and no locale file, and every component
in it is mounted by another module. Its `component/` directory is therefore importable by other `core` modules, and it may import back into
`activityHistory/component/`; the pair is one boundary unit. This is the one standing exception to the cross-module rule below — see `migration-revision.md` §7a for
its exact limits before relying on it.

`user` is now a **framework** module (`@/_common/modules/user/`) — it owns the auth views, the auth store, the user/session APIs and the generic settings sections.
`src/core/user/` is this app's glue around it, shaped like every other module: `authAdapter.ts`, `dto/userAugmentation.ts`, `composable/` (app preference reads),
`_locales/user.{sk,en}.ts` (this app's own settings/about strings, merged into the `user` namespace alongside the framework's — see the comment in
`src/locales/SK.ts`), `component/settings/` (the settings-card shell `SettingsSection.vue` plus the three app-specific cards), and `view/` + `user.routes.ts` for the
settings wrapper. See `### _common/modules/` below.

**Rules:**

- New feature code goes in `src/core/<module>/`, never at `src/` root.
- Cross-module imports are allowed **only** via another module's `api/` or `dto/` (the `historyDashboard` library above is the one exception). Never reach into
  another module's `component/`, `composable/` or `store/`. If two
  modules need to share a component, it belongs in the framework — raise it rather than cross-importing.
- Always import by `@/` alias, never by relative path across directories.
- Every module registers itself through `<module>.routes.ts` (exported, spread in `src/router.ts`) and `_locales/` (spread in `src/locales/{SK,EN}.ts`).

### `src/_common` is a submodule — edit it deliberately, never incidentally

`src/_common` is the `vue_framework` repo (`github.com/sydowwe/vue_framework`) mounted as a git submodule. **Other apps depend on it.** ESLint and Prettier are both
configured to ignore it, so tooling will not warn you either way.

Editing it is allowed and often correct. What is not allowed is editing it _by accident_ — an uncommitted change there is invisible to `git status` at the app root
and is lost on the next pointer bump.

**Does the change belong in the framework?** Ask whether another app in the family would want it, as written:

- **Yes — put it in `_common`.** Generic capability, no app domain in it: a composable, a base component, a utility, a bootstrap option. `useUserClock` is the worked
  example (§13 in `migration-revision.md`): the framework already owned `User.timezone` and `useCurrentTime` and joined neither, so every app reading the clock had
  the same bug.
- **No — keep it in `src/core/<module>/`.** Anything naming this app's entities, routes, locale keys or business rules. A second app would have to delete it to use
  it.
- **Almost, but it needs something app-specific.** Do not import the app from the framework. Register a collaborator instead, the way `auth/authAdapter.ts` and
  `installFramework`'s `userTimeZone` option do: the framework declares an interface and a setter, the app supplies the implementation in `main.ts`. Note that
  `composable/general/` and `utils/` import **nothing** from `modules/` — that boundary is what lets an app opt out of a module, so do not be the first to cross it.

**When you do edit it, the change must be self-contained and generic:**

1. No imports from `@/core/**`, no app locale keys, no assumptions about this app's routes or DTOs.
2. Default to the current behaviour when a new collaborator is not registered, so existing apps keep working without touching their `main.ts`.
3. Update the framework's own docs in the same commit — `src/_common/docs/{composables,components,utils,api}.md`. They live in the submodule so they travel with the
   pointer.
4. **Commit inside `src/_common` first, then commit the pointer bump in the app.** Two repos, two commits, in that order. A pointer bump without the submodule commit
   pushed is a broken checkout for everyone else.
5. Say in the app-side commit message what moved and why, so the next pointer bump is readable.

If you are _not_ going to do the framework change now, fall back to the old rule: keep the file app-side, add an entry to **`migration-revision.md`** describing the
gap and the upstream ask, and repoint importers when it lands. Do not fork a framework file into `src/` and leave it undocumented.

`src/_common/SETUP.md` and `README.md` are the framework's own docs — the mount contract, peer deps, `installFramework` and the registration order. Read those before
touching `main.ts`.

### Reference docs

- `src/_common/docs/{api,baseDtos,components,composables,utils,filterUsage}.md` — detailed reference for the framework surface summarised below. They now live **in
  the submodule** (upstreamed; the app's own `docs/` is gone), so they travel with the pointer bump. If one contradicts `src/_common`, the code wins and the doc
  needs fixing — and the fix is a framework commit, not an app-side copy.
- `src/_common/docs/modules/{scheduler,notifications,user}.md` — module maps for three framework modules (`reminders` has none yet).
- `migration-revision.md` — every framework gap and the local file kept for it.
- `dialog-system-unification.md` — why this app's dialog system stayed local.

### App-local leftovers (deliberate, documented in `migration-revision.md`)

**This list is now empty** (`migration-revision.md` R14 + R15). `src/components/`, `src/utils/`, and `src/dtos/` no longer exist. The last item, `IMyResponse`
(`export type IMyResponse = object`, a marker that constrained nothing), was resolved by deletion rather than upstreaming — see `migration-revision.md` §10.

Do not add to this list without a `migration-revision.md` entry.

## Framework surface — check here before writing anything

Import from `@/_common/...`. This replaced the app's own copies during the alignment migration.

### `_common/api/` — base API composables

- `useEntityQuery<T>(config)` — `fetchById`, `fetchByField`, `fetchAll`, `fetchSelectOptions`
- `useEntityCommand<T, TCreate, TUpdate>(config)` — `create`, `createWithResponse`, `update`, `updateWithResponse`, `patch`, `patchWithResponse`, `batchedToggle`,
  `deleteEntity`, `batchDelete`
- `useFetchFiltered` / `useFetchFilteredSorted` / `useFetchSorted` — POST filter/sort
- `useFetchFilteredTable<T, TFilter>` — paginated, returns `{items, itemsCount}`. **Note the `use` prefix** — it was `fetchFilteredTable` before the migration.
- `useAttachmentUpload(entity)` — `uploadAttachment(entityId, file)`
- `useRequestState` / `createRequestState` — shared loading/error state. Pass `_silent: true` on a request config to suppress the interceptor's error snackbar.

### `_common/utils/`

`DateTimeHelper.ts` (~21 loose functions — `formatToDate`, `formatToTime`, `formatLocalized`, `getISOWeek*`, `combineDateAndTime`, …; there is **no** `useDateTime()`
façade), `formatDuration.ts` (`fromSeconds`, `fromSecondsDetailed`, `fromMinutes`, `fromDecimalHours`), `colorPalette.ts`, `colorUtils.ts`, `domainColor.ts`,
`fontAwesomeIcons.ts`, `helperMethods.ts` (`capitalizeString`, `uncapitalizeString`, `openInNewTab`, `getNestedValue`, `formatFileSize`, `hasObjectChanged`),
`notifications.ts` (**async**, routed through the service worker),
`serviceWorker.ts`,
`fileDownload.ts`, `validators.ts`, `enumHelpers.ts`, `buildTree.ts`, `checklistHelpers.ts`, `keyboardUtils.ts`

### `_common/composable/`

- `general/SnackbarComposable.ts` — `useSnackbar()`: `showSuccessSnackbar`, `showErrorSnackbar`, `showSnackbar(msg, config)`
- `general/LoadingComposable.ts` — `useLoading()`: `showFullScreenLoading()`, `hideFullScreenLoading()`
- `general/ErrorHandlingFunctions.ts` — `useErrorHandling()`, maps HTTP codes to localized snackbars
- `general/EnumComposable.ts` — `getEnumSelectOptions()` (returns `ValueTitleDto[]`); it also re-exports `convertToEnum` / `getEnumKeyByValue`, whose implementations
  live in `_common/utils/enumHelpers.ts`. There is no app-local copy any more.
- `general/useDayOfWeekOptions.ts` — `useDayOfWeekOptions()` → `ComputedRef<{value: DayOfWeek, label: string}[]>`, labels localized via `calendar.*`. Prefer it over
  the `DAY_OF_WEEK_SHORT_LABELS` constant in `dto/enum/DayOfWeek.ts`, which is hardcoded English and is only a non-display fallback.
- `general/rules/RulesComposition.ts`, `general/useColor.ts`, `general/useCurrentTime.ts`, `general/useBreadcrumbs.ts`,
  `general/continuousQuickChangeComposition.ts`,
  `general/PriceFormatComposable.ts`
- `general/useDialog.ts` — `useDialog()`: `openDialog({ component, componentProps, dialogProps })` → `Promise<TResult | null>`, `confirm({ title, text, ... })` →
  `Promise<boolean>`. Inside an opened dialog body use `useDialogApi<T>()` for `close(result)`, `onConfirm(handler)`, `setLoading()`, `setDialogProps()`. Dialogs
  nest. `DialogHost` is mounted once in `App.vue`.
- `table/` — `TableHeaderComposable.ts`, `UseEditableCell.ts`, `useServerTable.ts`, `useTableFormatters.ts`, `useTableUrlState.ts`
- `UseRecaptchaHandler.ts`

### `_common/component/`

`dialog/MyDialog.vue` (base for **all** dialogs), `dialog/{ErrorDialog,LoadingFullscreen,LookupDialog}.vue`,
`dialog/DialogHost.vue` (mount **once** in `App.vue`; renders the `useDialog()` stack) + `dialog/DialogEntryRenderer.vue` (internal),
`feedback/{ChipWithIcon,InfoRow,InfoCard,MyCard,SubtleCard,Snackbar,EmailInfoRow}.vue`,
`inputs/{ColorPicker,DayOfWeekPicker,IconPicker,IconPickerDialog,InputWithButton,MergedInputs,NullFalseTrueCheckbox}.vue`,
`dateTime/{DateRangePicker,DateTimePicker,MonthYearPicker,MyDateInput,TimeDisplay,TimeDisplayWithProgress,TimePicker,TimeRangePicker}.vue`,
`dataTable/{AdminTableCell,TableGrid,inlineEditTable/TableCellEditor}.vue`, `ActionBar.vue`, `FilterPanel.vue`, `ExportMenu.vue`, `HierarchyTree.vue`,
`LookupEditTable.vue`, `TabsLayout.vue`, `MyImg.vue`, `MyPdfViewer.vue`, `form/{AddressFormField,LogTimeForm}.vue`, `calendar/CalendarGrid.vue`

> `FilterPanel`'s `#fields` slot prop exposes `T` — write `draft.someField`. It used to be mistyped as `{ value: T }`; that is fixed (`migration-revision.md` R12),
> so `draft.value.someField` is wrong at both type and runtime level.

> Editable-cell values are the exported `EditableCellValue` union (`dto/dto/table/EditableTableCell.ts`) — use it rather than re-declaring
> `string | number | boolean | …` inline, which is how the four call sites drifted apart before R13.

> `BasicTable` / `DataTable` take `items` and `loading` as **plain props**, not models — write `:items` / `:loading`, never `v-model="items"`. They emit no update
> for either, so nothing is lost. `v-model` sends `modelValue`, which lands in attrs while the required `items` prop goes unpassed: the table renders **no rows**
> and `TItem` widens to its constraint, cascading type errors through every row callback (`migration-revision.md` R10 — it shipped that way across 14 tables).

> When a `ref` needs a cast to silence `UnwrapRef` noise, cast to `as Ref<T>` — never `as { value: T }`. The latter is not a `Ref`, so vue-tsc applies no template
> unwrapping and any slot carrying it types one error per field access while working fine at runtime (R12, R13).

### `_common/nav/`, `_common/auth/`, `_common/store/`

- The whole app shell (`Navbar.vue` = top bar + collapsible sidebar, `UserMenu`, `AppBreadcrumbs`) is the framework's. `App.vue` only supplies the `#actions` slot.
- `auth/authAdapter.ts` — `useAuth()` returns the registered `AuthAdapter`. **Use this for roles, not the Pinia store**: the store has no role getters. This app has
  no role model, so `isHrRole` / `isAdminRole` / `isRootAdmin` are constant `true` (see `src/core/user/authAdapter.ts`) and `requiredRole` route meta is effectively
  a no-op — it exists so framework modules stay unmodified.
- `store/uiStore.ts` — sidebar rail state.

### `_common/modules/`

Opt-in shared features that export route tables and never self-register: `reminders`, `notifications` (incl. `reminderPreference`), `scheduler`, `user`. All are
routed in `src/router.ts` and their locales are spread in `SK.ts`.

**`modules/user/`** — auth + account settings. Import the store as
`import { useUserStore } from '@/_common/modules/user/store/authStore.ts'`; the id is still `'user'` and it still exposes `currentUser`.

- `userRoutes` covers only the five signed-out views (login, registration, forgotten password, both e-mail confirmations). `/user/settings` is **not** in it —
  `UserSettingsView` exposes slots only the app can fill, so `src/core/user/user.routes.ts` routes a local wrapper around it. Both are spread in `src/router.ts`.
- `UserSettingsView` slots: `#integrations` (forwarded into `SecuritySection`, for third-party account links), `#preferences`, `#append`.
- The `User` / `UserPreferencesRequest` DTOs carry only generic fields. This app's `askBeforeDelete` and `firstDayOfWeek` are merged in by
  `src/core/user/dto/userAugmentation.ts` (imported for side effects in `main.ts`) — `User.fromJson` copies unknown keys through, so they survive hydration. Add app
  preference fields there, not to the framework DTO. Both are **optional**, so never read them off `currentUser` directly; go through
  `src/core/user/composable/useUserPreferences.ts`, which owns the defaults (see the preference-ownership rules below).

### Where a preference lives

There are **three** per-user preference systems in this app, not two. Before adding a preference, decide which one owns it — the answer is not "whichever module I
happen to be editing".

| System                  | Endpoint                                                                           | Owns                                                                     |
| ----------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| User preferences        | `PUT /user/preferences` (`_common/modules/user/api/userApi.ts`)                    | Preferences that cut **across** modules, or that describe the **person** |
| Reminder preferences    | `PUT /reminder-preference/*` (`_common/modules/notifications/reminderPreference/`) | Anything about **whether, when and how a notification reaches the user** |
| A module's own settings | e.g. `PUT planner/settings` (`core/dayPlanner/api/plannerSettingsApi.ts`)          | Preferences meaningful **only inside that module**                       |

Applied in that order — the first match wins:

1. **Is it about notification delivery?** Then it belongs to reminder preferences, keyed by `(ownerModule, kind)`, even though it is "about" one module. Quiet hours,
   per-kind muting and channel choice are already modelled there; a module re-implementing any of them is a duplicate, not a module preference.
2. **Does more than one module read it, or would a second module read it if it existed?** Then `/user/preferences`. Theme, locale, timezone, `firstDayOfWeek`,
   `askBeforeDelete` — all of these describe the person, not a screen.
3. **Otherwise** it is the module's own. Grid granularity, panel defaults, keyboard-nav toggles, per-module vocabulary lists, and anything whose value is a **foreign
   key to that module's entities** (a default template id cannot live anywhere else).

Two consequences worth stating outright, because both have already been got wrong once:

- **Moving a field across the boundary is a backend change, not a frontend refactor.** The client cannot see whether the two endpoints are two tables, two columns on
  one row, or one thing behind two routes. Write the ask (`prompts/_done/user/backend/README.md`) instead of shimming it.
- **Every settings page must be reachable from `/user/settings`.** A module settings page links back to it, and `ModuleSettingsSection.vue` links out to each of them
  by **route name only**. A route name is a string, so this crosses no module boundary — never import another module's view or store to build a settings link.

**The sanctioned cross-module imports** are the three composables in `src/core/user/composable/`. They are a deliberate exception to the "only via `api/` or `dto/`"
rule: `core/user` is not a peer feature module but this app's account layer, and the alternative — each module re-deriving the same default — is the exact drift that
shipped a delete path with no confirmation dialog. Do not add a fourth without an entry here.

| Composable                 | Imported by                                                           | Why it cannot live per-module                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `useUserPreferences.ts`    | `todoList`, `dayPlanner`, `historyDashboard`, `activityHistory`, `activityTracking` | Owns the defaults for `askBeforeDelete` and `firstDayOfWeek`. Both fields are optional on `User`, so every consumer needs a fallback and they must all use the _same_ one.                                                                                                                                                                                                            |
| `useDeleteConfirmation.ts` | the five delete sites in `todoList`, `dayPlanner`, `historyDashboard` | Decides whether a delete confirms, from the delete's **consequence** rather than the preference alone. A delete that **cascades** always confirms and must say how many children go with it — that is the one place the user's preference is overruled, and it only holds if all five sites ask the same question. Reading `askBeforeDelete` directly at a delete site is now a bug.  |
| `useUserScopedStorage.ts`  | `dayPlanner`, `todoList`, `activityTracking`, `leisure`               | Namespaces every `localStorage` key by account id, and migrates the pre-namespacing key on first read. Without it, two accounts on one browser share pinned templates, dismissed reviews and dismissed hints. Never write a raw `localStorage` key for per-user state — route it through `readUserScoped` / `writeUserScoped`, or `userScopedKey` for a Pinia `persist.key` function. |

## Coding Standards

- **Strict equality**: Always use `===`/`!==` (both in script and template). `== null` is allowed for null/undefined checks — ESLint is configured with `smart` in
  both `eqeqeq` and `vue/eqeqeq`.
- **Boolean attribute shorthand**: Use `loading` instead of `:loading="true"`.
- **Split larger components into logical smaller ones**
- **Function Syntax**: Use `function name() {}` declarations instead of `const name = () => {}` for component logic to leverage hoisting and improve readability.
- **Component Naming**: Use PascalCase for filenames and template tags (e.g., `<VBtn>`, `<MyCustomComponent>`).
- use ref mostly only use reactive when its really needed or conventional
- **Props**:
    - Define using destructure defaults — never use `withDefaults()`: `const { foo, bar = 42 } = defineProps<{ foo: string, bar?: number }>()`. Vue 3.5 reactive
      destructure keeps props reactive without `withDefaults`. Array/object defaults use the value directly (e.g., `items = []`), not factory functions.
    - Use **camelCase** in BOTH TS and Templates (e.g., `hideDetails` not `hide-details`).
    - use props just as the shorthand :prop instead of :prop="prop" when there is ref with same name
- **Emits**:
    - Define using: `const emit = defineEmits<{ change: [id: number], update: [value: string] }>()`.
- **Two-Way Binding (v-model)**:
    - **Always** use `defineModel()` instead of `defineProps({ modelValue })` + `defineEmits(['update:modelValue'])`.
    - Example: `const model = defineModel<string>()` or `const model = defineModel<string>({ default: 'initial' })`.
    - For multiple models: `const value = defineModel<string>('value')` and `const checked = defineModel<boolean>('checked')`.
- **API Calls**:
    - **Always** import the custom instance: `import { API } from '@/_common/axiosConfig.ts';`.
    - Do not use global `axios` or create new instances.
    - Each entity has its own API composable in its module's `api/` directory. Compose them from the base composables in `@/_common/api/`.
- **Localization**: All user-facing strings must use `vue-i18n`. A module's strings live in `src/core/<module>/_locales/<module>.{sk,en}.ts` and are spread by
  `src/locales/{SK,EN}.ts`. App-wide strings not owned by a module go in `src/locales/common.{sk,en}.ts`. SK is primary, EN is the fallback.
    - The aggregator spread is **shallow**: a colliding top-level namespace is replaced wholesale, not merged. The app's own namespaces are spread after the
      framework's `common` so they win. Read the comment at the top of `SK.ts` before adding a namespace.
    - **Consequence when adopting framework code:** a framework component resolving `t('general.foo')` renders the raw key here, because this app's `general`
      replaces the framework's. Mirror the key into `src/locales/common.{sk,en}.ts` by hand as part of the adoption. This has been missed three times
      (`validation`, `general.undoSuccess`, `calendar` — `migration-revision.md` R5/R6/R11). EN needs the mirror too: `EN.ts` does not spread the framework's
      Slovak-only `common` at all.
- **Pinia Stores**: Use Composition API (Setup Stores) pattern: `defineStore('name', () => { ... })`. Stores live in their module's `store/` directory.
- **URL State**: Store filterable/bookmarkable state (filters, tabs, search queries, pagination) in URL query params so users can share/bookmark/navigate back. Use
  `vue-router` query params for this.
- **DTOs**: A module's DTOs live in `src/core/<module>/dto/{request,response,enum}/`; base classes and interfaces come from `@/_common/dto/`. Response DTOs must have
  `static fromJson(object: any)` using destructuring with defaults + `static listFromObjects(objects: any[])`. Request DTOs have constructors with default params and
  `static fromJson()`.
    - The select-option shape is `ValueTitleDto` (it was `TitleValueObject` before the migration).

## Routing

`src/router.ts` composes every module's route table. Route `meta` is augmented with:

- `public?: boolean` — reachable while signed out; everything else goes through the auth guard
- `requiredRole?: RequiredRole` — carried by framework modules, always passes here (see the auth adapter note above)
- `showRecaptchaBadge?: boolean` — toggles the floating reCAPTCHA v3 badge in `afterEach`

Adding a module: create `<module>.routes.ts`, import and spread it in `src/router.ts`, and add its nav entries to `src/app/nav/navItems.ts` with matching
`navigation.*` keys in **both** `common.sk.ts` and `common.en.ts`. Nav item `title` is an i18n key under `navigation.*`, not a literal.

## Vuetify Custom Aliases & Theme

- **Custom Aliases** (use these instead of base components where applicable):
    - `VIdSelect` → VSelect with `itemValue="id"`, `itemTitle="text"` (matches DTO SelectOption structure)
    - `VIdAutocomplete` → VAutocomplete with `itemValue="id"`, `itemTitle="text"`
    - `VIconBtn` → VBtn (rounded icon button)
    - `VIconSmall` → VIcon (size 16)
- **Custom Theme Colors**: `primary`, `secondary`, `primaryOutline`, `secondaryOutline`, `errorDark`, `successDark`, `warningDark`, `primary-accent`,
  `secondary-accent`, `primary-container`, `secondary-container`, `textMuted`, `neutral-50` through `neutral-900`
    - Colour **names** are the framework's and every framework component references them. `main.ts` overrides only the hexes this app diverges on — never rename.
- **Color usage by variant**:
    - `variant="elevated"` → use `primary`, `secondary`, `errorDark`, `successDark`, `warningDark`
    - `variant="tonal"` or `variant="outlined"` → use `primaryOutline`, `secondaryOutline`, `error`, `success`, `warning`
- **Component Defaults** (already configured, no need to repeat in templates): VBtn `variant="elevated"`, VCard `rounded="lg"`,
  VTextField/VIdSelect/VIdAutocomplete/VTextarea `variant="outlined" clearable density="comfortable"`

## Vuetify Components

- **Styling Priority**:
    1. For Vuetify components: use component props first (`rounded`, `elevation`, `density`, `variant`, `color`, etc.)
    2. For layout/spacing: use Vuetify utility classes (`d-flex`, `pa-2`, `ga-2`, `text-primary`, etc.)
    3. Use custom CSS only when no Vuetify prop or helper class exists
    4. For 1-2 simple property changes on a single element, use inline `style=""` to keep it close to the markup
    - Don't mix Vuetify classes and custom CSS for the same element - pick one approach per element.

- **Number Inputs**: **Always** use `VNumberInput` instead of `VTextField` with `type="number"`.
    - VNumberInput provides built-in increment/decrement buttons and better number handling.
    - No need for `.number` modifier on v-model.
    - Example: `<VNumberInput v-model="quantity" :min="1" :max="100" />`.

## MCP Usage

- **Vuetify MCP**: Before writing Vuetify components, use the `vuetify` MCP to verify the exact API of the component.
- **Rules**: If a Vuetify prop is suggested in kebab-case, convert it to camelCase.

## Commands

- **Dev**: `npm run dev`
- **Typecheck**: `npm run type-check` (= `vue-tsc --build --force`) — the `--force` matters. `--noEmit` checks nothing in this project setup, and a plain `--build`
  is incremental and reports an inflated, unstable count. The baseline is **58 errors, all of them app-side in `src/core`** (measured 2026-08-20 by stashing to a
  clean tree) — `src/_common` is clean as of `migration-revision.md` R13, down from 43. Any new `_common` error is therefore a regression, not baseline noise.
  **This number has been stale every time anyone checked** (76 → 72 → 65 → 64 → 58, drifting down as unrelated work touched files): re-measure on a clean tree
  before quoting it, and don't treat a small delta as a finding.
- **Lint**: `npm run lint` (note: this runs `--fix`) — must stay at **0 errors** (3 known unused-variable warnings remain)
- **Build**: `npx vite build` — bundles clean, and the workbox service-worker step now succeeds too (`dist/sw.js` + `dist/workbox-*.js`). The old
  `assignWith is not defined` failure was the floating-lodash bug described in `migration-revision.md` §R2 and no longer reproduces. A chunk-size warning over 500 kB
  is expected and not an error.

## Submodule workflow

Fresh clones need `git clone --recurse-submodules`, or `git submodule update --init --recursive` after the fact. CI must check out submodules recursively.
