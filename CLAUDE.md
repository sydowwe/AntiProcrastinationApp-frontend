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
- **Animations**: `@formkit/auto-animate` — registered globally, use `v-auto-animate` directive for list enter/leave animations instead of custom CSS transitions

## Coding Standards

- **Strict equality**: Always use `===`/`!==` (both in script and template). `== null` is allowed for null/undefined checks.
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
    - **Always** import the custom instance: `import { API } from '@/plugins/axiosConfig.ts';`.
    - Do not use global `axios` or create new instances.
    - Each entity has its own API composable in `src/api/` (e.g., `calendarApi.ts`). Compose them from base composables in `src/api/base/`.
    - **Base API composables** (`src/api/base/`):
        - `useEntityQuery<T>(config)` — `fetchById`, `fetchByField`, `fetchAll`, `fetchSelectOptions`
        - `useEntityCommand<T, TCreate, TUpdate>(config)` — `create`, `createWithResponse`, `update`, `updateWithResponse`, `patch`, `patchWithResponse`,
          `batchedToggle`, `deleteEntity`, `batchDelete`
        - `useFetchFiltered<T, TFilter>(class, entity)` — `fetchFiltered` (POST filter)
        - `useFetchFilteredSorted<T, TFilter>(class, entity)` — `fetchFilteredSorted` (POST filter+sort)
        - `fetchFilteredTable<T, TFilter>(class, entity)` — `fetchFilteredTable` (paginated, returns `{items, itemsCount}`)
        - `useAttachmentUpload(entity)` — `uploadAttachment(entityId, file)`
- **Localization**: All user-facing strings must use `vue-i18n`. Locale files are in `src/locales/` (`EN.js`, `SK.js`).
- **Pinia Stores**: Use Composition API (Setup Stores) pattern: `defineStore('name', () => { ... })`. See `src/stores/` for examples.
- **URL State**: Store filterable/bookmarkable state (filters, tabs, search queries, pagination) in URL query params so users can share/bookmark/navigate back. Use
  `vue-router` query params for this.
- **Snackbar**: Use `useSnackbar()` from `@/composables/general/SnackbarComposable.ts` for user feedback — `showSuccessSnackbar(msg)`, `showErrorSnackbar(msg)`,
  `showSnackbar(msg, config)`.
- **Loading**: Use `useLoading()` from `@/composables/general/LoadingComposable.ts` for full-screen loading state — `showFullScreenLoading()`,
  `hideFullScreenLoading()`.
- **Error Handling**: Use `useErrorHandling()` from `@/composables/general/ErrorHandlingFunctions.ts` — maps HTTP error codes to localized snackbar messages.
- **DTOs**: All DTOs live in `src/dtos/request/` and `src/dtos/response/`. Response DTOs must implement `IMyResponse` and have `static fromJson(object: any)` using
  destructuring with defaults + `static listFromObjects(objects: any[])`. Request DTOs have constructors with default params and `static fromJson()`.

## Existing Utilities — check before reimplementing

### `src/utils/`

- `formatDuration.ts` — formats seconds into readable duration strings (e.g., "5h 32m")
- `momentHelper.ts` — Moment.js wrapper with date/time formatting for Slovak locale
- `colorPalette.ts` — 28-color palette with dark/light variants
- `colorUtils.ts` — lighten HSL colors, add opacity
- `domainColor.ts` — generates consistent hashed colors for domain names
- `fontAwesomeIcons.ts` — icon utilities to fetch, search, and parse FontAwesome icons
- `helperMethods.ts` — string manipulation, tab opening, object change detection
- `notifications.ts` — browser notification permission and display
- `UserAuthUtils.ts` — email/user validation rules with i18n

### `src/composables/general/`

- `ErrorHandlingFunctions.ts` — HTTP error code to localized snackbar mapping
- `EnumComposable.ts` — convert enums to values and i18n-translated select options
- `continuousQuickChangeComposition.ts` — continuous value changes on mouse hold
- `useAutoScroll.ts` — auto-scrolling with intensity-based speed near container edges
- `useCurrentTime.ts` — global reactive current time ref, updated every 60s
- `UsePushNotifications.ts` — service worker push notification subscription management
- `rules/RulesComposition.ts` — form validation rules

### `src/components/general/`

- `ActionBar.vue` — floating sticky selection action bar with cancel button
- `ChipWithIcon.vue` — Vuetify chip with optional icon
- `ColorPicker.vue` — color swatch picker from palette
- `InputWithButton.vue` — flex container combining text input with action button
- `MergedInputs.vue` — two-input container with merged borders
- `feedback/MyCard.vue` — card wrapper with optional title and confirm/cancel footer
- `feedback/SubtleCard.vue` — subtle styled card variant
- `calendar/CalendarGrid.vue` — calendar grid component
- `dataTable/BasicTable.vue`, `DataTable.vue`, `MyTableFooter.vue` — table components
- `dateTime/` — `DateRangePicker`, `DateTimePicker`, `MyDateInput`, `TimeDisplay`, `TimeDisplayWithProgress`, `TimePicker`, `TimeRangePicker`
- `inputs/IconPicker.vue`, `IconPickerDialog.vue` — FontAwesome icon picker
- `inputs/NullFalseTrueCheckbox.vue` — tri-state checkbox

### `src/components/general/dialogs/`

- `MyDialog.vue` — base dialog with responsive width, header/footer slots, confirm/close buttons. Use as the base for all dialogs.
- `ErrorDialog.vue` — error dialog with optional retry button, wraps `MyDialog`.

## Vuetify Custom Aliases & Theme

- **Custom Aliases** (use these instead of base components where applicable):
    - `VIdSelect` → VSelect with `itemValue="id"`, `itemTitle="text"` (matches DTO SelectOption structure)
    - `VIdAutocomplete` → VAutocomplete with `itemValue="id"`, `itemTitle="text"`
    - `VIconBtn` → VBtn (rounded icon button)
    - `VIconSmall` → VIcon (size 16)
- **Custom Theme Colors**: `primary`, `secondary`, `primaryOutline`, `secondaryOutline`, `errorDark`, `successDark`, `warningDark`, `primary-accent`,
  `secondary-accent`, `primary-container`, `secondary-container`, `textMuted`, `neutral-50` through `neutral-900`
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
- **Typecheck**: `npx vue-tsc --noEmit`
- **Lint**: `npm run lint`