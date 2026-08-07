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

`user` is now a **framework** module (`@/_common/modules/user/`) — it owns the auth views, the auth store, the user/session APIs and the generic settings sections.
What is left in `src/core/user/` is only this app's glue: `authAdapter.ts`, `dto/userAugmentation.ts`, the settings wrapper view + its route, and the three
app-specific settings sections. See `### _common/modules/` below.

**Rules:**

- New feature code goes in `src/core/<module>/`, never at `src/` root.
- Cross-module imports are allowed **only** via another module's `api/` or `dto/`. Never reach into another module's `component/`, `composable/` or `store/`. If two
  modules need to share a component, it belongs in the framework — raise it rather than cross-importing.
- Always import by `@/` alias, never by relative path across directories.
- Every module registers itself through `<module>.routes.ts` (exported, spread in `src/router.ts`) and `_locales/` (spread in `src/locales/{SK,EN}.ts`).

### `src/_common` is a submodule — never write to it

`src/_common` is the `vue_framework` repo mounted as a git submodule. Editing it silently dirties the submodule and the change is lost on the next pointer bump.
ESLint and Prettier are both configured to ignore it, so tooling will not warn you.

If the framework is missing something this app needs:

1. **Do not fork the file into `src/`**, and do not edit `_common`.
2. Add an entry to **`migration-revision.md`** describing the gap, the local file kept (if any) and the upstream ask.
3. The fix lands in the framework repo, the submodule pointer is bumped, then the local file is deleted and its importers repointed.

`src/_common/SETUP.md` and `README.md` are the framework's own docs — the mount contract, peer deps, `installFramework` and the registration order. Read those before
touching `main.ts`.

### Reference docs

- `docs/framework/{api,baseDtos,components,composables,utils,filterUsage}.md` — detailed reference for the framework surface summarised below. Ported from the
  reference app; if one contradicts `src/_common`, the code wins and the doc needs fixing.
- `docs/modules/{scheduler,notifications}.md` — module maps for two framework modules.
- `migration-revision.md` — every framework gap and the local file kept for it.
- `dialog-system-unification.md` — why this app's dialog system stayed local.

### App-local leftovers (deliberate, documented in `migration-revision.md`)

These are the **only** things still living outside `core/`. Do not add to this list without a `migration-revision.md` entry:

- `components/general/dataTable/{BasicTable,DataTable,MyTableFooter}.vue` — framework versions differ in shape; swap is its own project
- `components/general/calendar/{CalendarGrid,CalendarDayCell}.vue`, `components/general/inputs/DayOfWeekPicker.vue`
- `composables/general/{EnumComposable,useAutoScroll,useUndoStack,useCalendarWeeks}.ts`, `composables/general/rules/RulesComposition.ts`
- `dtos/{dto,enum,response/interface,type}/*` — app-shared DTOs with no framework counterpart
- `utils/{classDeserializationHelper,daysOfWeek,helperMethods}.ts`

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
`fontAwesomeIcons.ts`, `helperMethods.ts` (`getNestedValue`, `formatFileSize`), `notifications.ts` (**async**, routed through the service worker),
`serviceWorker.ts`,
`fileDownload.ts`, `validators.ts`, `enumHelpers.ts`, `buildTree.ts`, `checklistHelpers.ts`, `keyboardUtils.ts`

### `_common/composable/`

- `general/SnackbarComposable.ts` — `useSnackbar()`: `showSuccessSnackbar`, `showErrorSnackbar`, `showSnackbar(msg, config)`
- `general/LoadingComposable.ts` — `useLoading()`: `showFullScreenLoading()`, `hideFullScreenLoading()`
- `general/ErrorHandlingFunctions.ts` — `useErrorHandling()`, maps HTTP codes to localized snackbars
- `general/EnumComposable.ts` — `getEnumSelectOptions()` (for `convertToEnum` / `getEnumKeyByValue` use the app-local copy)
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
`inputs/{ColorPicker,IconPicker,IconPickerDialog,InputWithButton,MergedInputs,NullFalseTrueCheckbox}.vue`,
`dateTime/{DateRangePicker,DateTimePicker,MonthYearPicker,MyDateInput,TimeDisplay,TimeDisplayWithProgress,TimePicker,TimeRangePicker}.vue`,
`dataTable/{AdminTableCell,TableGrid,inlineEditTable/TableCellEditor}.vue`, `ActionBar.vue`, `FilterPanel.vue`, `ExportMenu.vue`, `HierarchyTree.vue`,
`LookupEditTable.vue`, `TabsLayout.vue`, `MyImg.vue`, `MyPdfViewer.vue`, `form/{AddressFormField,LogTimeForm}.vue`, `calendar/CalendarGrid.vue`

> `FilterPanel`'s `#fields` slot prop is mistyped as `{ value: T }`. Write `draft.someField` anyway — that is correct at runtime; the type error is a known framework
> bug (`migration-revision.md` §7). Do **not** "fix" it to `draft.value.someField`.

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
  `src/core/user/dto/userAugmentation.ts` (imported for side effects in `main.ts`) — `User.fromJson` copies unknown keys through, so they survive hydration and
  `userStore.currentUser.askBeforeDelete` stays a plain typed read. Add app preference fields there, not to the framework DTO.

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
- **Pinia Stores**: Use Composition API (Setup Stores) pattern: `defineStore('name', () => { ... })`. Stores live in their module's `store/` directory.
- **URL State**: Store filterable/bookmarkable state (filters, tabs, search queries, pagination) in URL query params so users can share/bookmark/navigate back. Use
  `vue-router` query params for this.
- **DTOs**: A module's DTOs live in `src/core/<module>/dto/{request,response,enum}/`; base classes and interfaces come from `@/_common/dto/`. Response DTOs must
  implement `IMyResponse` and have `static fromJson(object: any)` using destructuring with defaults + `static listFromObjects(objects: any[])`. Request DTOs have
  constructors with default params and `static fromJson()`.
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
  is incremental and reports an inflated, unstable count. The honest baseline is **163 errors**; 5 of those are the `FilterPanel` framework bug and ~20 more come
  from `_common` itself.
- **Lint**: `npm run lint` (note: this runs `--fix`) — must stay at **0 errors** (3 known unused-variable warnings remain)
- **Build**: `npx vite build` — bundles clean, and the workbox service-worker step now succeeds too (`dist/sw.js` + `dist/workbox-*.js`). The old
  `assignWith is not defined` failure was the floating-lodash bug described in `migration-revision.md` §R2 and no longer reproduces. A chunk-size warning over
  500 kB is expected and not an error.

## Submodule workflow

Fresh clones need `git clone --recurse-submodules`, or `git submodule update --init --recursive` after the fact. CI must check out submodules recursively.
