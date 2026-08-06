# `src/_common/composable/` — Reference

Location: `src/_common/composable/`. Vue runtime helpers: anything that uses reactivity
(`ref`/`computed`/`watch`), Vue lifecycle (`onMounted`/`onUnmounted`), or Vue injection (`useI18n`,
`useRoute`, `useTheme`). **Check here before reimplementing.** For pure, framework-free helpers see
[`utils.md`](utils.md) (`src/_common/utils/`).

> Convention: a `use*` export must justify the name with reactivity, a lifecycle hook, or a Vue
> injection. Pure functions (regex validators, value mappers, DOM math) belong in `utils/`, even
> when they happen to live next to a composable today.

## State scope — read this first

Composables here fall into two groups. Getting them confused causes the most bugs:

- **Global singleton** — state is declared at **module top level**, so every caller shares one
  instance. Calling the `use*` function only hands back references to that shared state. Used for
  app-wide concerns (snackbar, loading, current time, notifications, undo, breadcrumbs-extra).
- **Per-component** — state is declared **inside** the `use*` function, so each call gets a fresh,
  isolated instance. Used for component-local behaviour (auto-scroll, editable cell, continuous
  change).

Each entry below is tagged **[global]** or **[per-instance]**.

---

## `src/_common/composable/general/`

### `SnackbarComposable.ts` — **[global]**

`useSnackbar()` → app-wide snackbar bus.

- `showSuccessSnackbar(msg, config?)`, `showErrorSnackbar(msg, config?)`, `showSnackbar(msg?, config?)`,
  `hideSnackbar()`.
- Reactive state (`readonly`): `snackbar`, `color`, `message`, `timeout`, `closable`, `actionLabel`,
  `actionCallback`. The single `<GlobalSnackbar>` host binds these.
- `SnackBarConfig`: `{ timeout?, closable?, dontHideFullScreenLoading?, color?, actionLabel?, actionCallback? }`.
- `closable` defaults: `showSnackbar`/`showSuccessSnackbar` → `true`, `showErrorSnackbar` → `false`;
  any of them honours an explicit `closable` in the config.
- Showing a snackbar calls `hideFullScreenLoading()` first unless `dontHideFullScreenLoading` is set.

### `LoadingComposable.ts` — **[global]**

`useLoading()` → full-screen loading overlay.

- `showFullScreenLoading()`, `hideFullScreenLoading()`.
- State: `fullScreenLoading` (`readonly`), `axiosSuccessLoadingHide` (mutable — the axios success
  interceptor flips it to suppress the auto-hide on a given request).

### `ErrorHandlingFunctions.ts` — **[global]**

`useErrorHandling()` → `{ handleHttpCodes }`. Maps an HTTP status code to a localized error snackbar

+ `console.error`. `handleHttpCodes(statusCode)` is also exported directly. Handles 400/401/403/404/
  409/500/503/504/405/406 with a generic fallback. **Note:** error snackbars are normally owned by the
  axios interceptor (`axiosConfig.ts`). Only call `handleHttpCodes` directly when a request opted out of
  the interceptor via `{ _silent: true }` and the caller wants the standard message for statuses it
  doesn't special-case.

### `useColor.ts` — **[per-instance / composable]**

`useColor()` → theme-aware palette resolver (uses Vuetify `useTheme`).

- `getBgColor(name)` (falls back to `neutral-300`), `getTextColor(name)`. Resolves against the active
  light/dark theme via `resolveColor` from `utils/colorPalette.ts`. (Moved here from `utils/`.)

### `EnumComposable.ts` — **[per-instance / composable]**

- `getEnumSelectOptions(enumObject, prefix)` — uses `useI18n`; returns `ValueTitleDto<string>[]` with titles
  translated as `${prefix}.${value}`. Must run in `setup`.
- _(The pure `convertToEnum` / `getEnumKeyByValue` helpers now live in `utils/enumHelpers.ts`.)_

### `PriceFormatComposable.ts` — **[per-instance / composable]**

`usePriceFormat()` — uses `useI18n` for the active `locale`; returns `formatPrice(value: number | null | undefined): string`, a locale-aware EUR currency formatter (`Intl.NumberFormat`, max 2 fraction digits). Returns `'—'` for `null`/`undefined`. Use this instead of hand-rolling a local `formatPrice`/`priceFormat`.

### `rules/RulesComposition.ts` — **mixed**

- `useGeneralRules()` — i18n Vuetify validation rules: `requiredRule`, `onlyLettersWithDiacriticsRule`,
  `lettersWithDiacriticsAndSpecialCharsRule`, `onlyNumbersRule`, `lettersAndNumbersRule`, `icoRule`,
  `emailRule`. Messages come from the `validation.*` i18n keys.
- The pure predicates (`isValidEmail`, `isOnlyLettersWithDiacritics`,
  `isLettersWithDiacriticsAndSpecialChars`, `isOnlyNumbers`,
  `isLettersWithDiacriticsAndNumbersAndSpecialChars`, `isLettersAndNumbers`) live in
  `utils/validators.ts` and are re-exported here for back-compat.

### `useNotifications.ts` — **[global]**

`useNotifications()` → in-app notification center backed by a SignalR hub.

- State: `notifications`, `unreadCount` (computed), `isConnected`, `isLoading`.
- Actions: `connect()`, `disconnect()`, `loadNotifications()`, `markRead(id)` (optimistic),
  `markAllRead()`. Incoming pushes prepend and raise a snackbar.

### `UsePushNotifications.ts` — **[global]**

`usePushNotifications()` → Web Push (VAPID) device subscription.

- State: `isSupported`, `isSubscribed`, `permission`.
- Actions: `initPushSupport()` (feature-detect + register SW + sync state), `subscribe()` (must run
  from a user gesture), `unsubscribe()`. Delegates SW work to `utils/serviceWorker.ts`.

### `useCurrentTime.ts` — **[global, ref-counted]**

`useCurrentTime()` → `{ currentTime }`. One shared 60 s timer for the whole app; started on the first
mount and torn down when the last consumer unmounts (instance counting).

### `useBreadcrumbs.ts` — **mixed [global state]**

- `useBreadcrumbs()` → `{ breadcrumbs }` computed from the current route via `navItems` (longest-match
  trail), with the last segment disabled.
- `useSetBreadcrumbExtra()` → `{ setBreadcrumbExtra(segments) }` to append page-specific crumbs; auto-
  clears on unmount. Backed by a module-level `extraSegments` ref.
- `BreadcrumbSegment`: `{ title, to?, disabled? }`.

### `useUndoStack.ts` — **[global]**

`useUndoStack()` → bounded (10) LIFO of undoable actions.

- `push({ description, undo })`, `undo()` (runs + success snackbar), `clear()`.
- State: `canUndo`, `stackSize`, `nextUndoDescription`.

### `useAutoScroll.ts` — **[per-instance]**

`useAutoScroll(scrollContainerRef)` → edge-proximity auto-scroll for drag interactions.

- `handleAutoScroll(clientY)` (intensity ramps near top/bottom within 30 px), `stopAutoScroll()`.
  Cleans up its interval on unmount.

### `continuousQuickChangeComposition.ts` — **mixed [per-instance]**

- `useContinuousQuickChangeComposition(quickChangeFn)` → returns `continuousQuickChangeValue(value)`
  that repeats `quickChangeFn(value)` every 150 ms while the mouse is held (stops on `mouseup`).
- `preventE` is re-exported here for back-compat but now lives in `utils/keyboardUtils.ts`.

---

## `src/_common/composable/` (root)

### `CentralDialogComposable.ts` — **[global]**

Promise-based programmatic dialog system (a `<DialogHost>` renders the live `dialogs` map).

- `useDialogManager()` → `openDialog(config)` (resolves with `DialogResult`), `closeDialog(id, result?)`,
  `closeAllDialogs()`, `dialogs` (reactive map).
- `useConfirmDialog()` → `confirm(title, text?, options?)` → `Promise<DialogResult<boolean>>`.
- `useAlertDialog()` → `alert(title, text?, options?)` → `Promise<DialogResult<void>>`.
- `DialogConfig` / `DialogInstance` / `DialogResult` live in `src/_common/dto/dto/DialogConfig.ts`.
  `DialogResult.action` is `'confirmed' | 'closed' | 'custom'`.

### `UseRecaptchaHandler.ts` — **[global instance]**

`useRecaptcha()` → reCAPTCHA v3 loader/executor.

- `loadRecaptcha()`, `executeRecaptcha(action)` → token.
- Backed by a module-level shared load promise + instance, so every caller reuses the same loaded
  reCAPTCHA (loaded once, no per-component duplication and no polling). The returned functions are
  otherwise stateless.

---

## `src/_common/composable/table/`

### `TableHeaderComposable.ts` — **mixed**

- `useTableHeader(columns, hasActions, showExpand)` → computed Vuetify `headers` (optional expand
  column first, optional `Akcie` actions column last; centered, `px-1` cells).
- _(The pure `getNestedValue` dotted-path getter now lives in `utils/helperMethods.ts`.)_

### `useTableFormatters.ts` — **[per-instance / composable]**

`useTableFormatters()` → the key-name → cell-format matchers behind the tables' zero-config auto-formatting (uses `usePriceFormat`, so must run in `setup`). This is the single source of truth for the auto-format rules documented in [`components.md`](components.md) (the "auto-format vs. per-column slots" table).

- Key matchers: `isDateTimeKey` (`datetime`/`timestamp`), `isDateKey` (`date`), `isBooleanKey` (starts with `is`/`has`/`can`/`show`), `isCurrencyKey` (`amount`/`price`/`cost`/`total`/`sum`/`salary`/`fee`/`budget`/`revenue`/`payment`), `isPercentKey` (`percent`/`rate`/`vat`/`ratio`/`discount`).
- Formatters: `formatCurrency`, `formatPercent` (`NN.NN %`), `formatDate`, `formatDateTime`, `formatRaw` (`—` for null/undefined/array), plus `isNullish`.
- Non-number values fed to `formatCurrency`/`formatPercent` render `—`. Keep this list in sync with the keyword arrays in the source when adding a new auto-format category.

### `UseEditableCell.ts` — **[per-instance]**

`useEditableCell(props, emit)` → inline table-cell editing.

- `startCellEdit()` (focuses input, skips read-only), `cellValueUpdated()`, `editCellCanceled()`.
- State: `input` (ref), `newValue`, `cellItem`. Emits `editCell` / `updatedCell` / `editCellCanceled`.
- Works on a local copy of `props.cellItem` (re-synced via a watcher) and emits changes up — it no
  longer mutates the parent's object directly.

### `useTableUrlState.ts` — **[per-instance]**

`useTableUrlState(options?)` → keep table `page` / `itemsPerPage` / `sortBy` (+ an optional filter
object) in the URL query so a view is bookmarkable and survives reload. Reads initial values from the
current `route.query` (falling back to defaults), then `watch`es the refs and writes them back via
`router.replace` (deep watch; navigation-duplication errors are swallowed).

- Returns `{ page, itemsPerPage, sortBy, filter }` — destructure with the **same names** the view
  already used so existing `BasicTable` / `TableGrid` v-models and `loadItems()` keep working.
- **Without a filter** (overload): `useTableUrlState({ defaultPage?, defaultPerPage?, defaultSortBy? })`
  — leave `filter` out of the destructure.
- **With a filter** (generic): `useTableUrlState<TFilter>({ defaultFilter, filterToParams, paramsToFilter, ...defaults })`.
  `filterToParams(filter) → Record<string,string>` (use `?? ''` so empty values drop out of the URL);
  `paramsToFilter(params) → TFilter` rebuilds the DTO from string params.
- Query keys are fixed (`page` / `perPage` / `sortBy` + your filter keys), so **two independent
  tables on one route collide** — don't wire both. Only the top-level view that *owns* the state
  should call it; pass-through child tables (state via `defineModel`/props) must not.
- Rollout tracker: [`handoffs/useTableUrlState-rollout.md`](../handoffs/useTableUrlState-rollout.md).

---

## Stores (Pinia) — `src/_common/store/`

The only app-wide store that lives in `_common` (feature stores live with their feature). Setup-store
pattern per CLAUDE.md.

### `uiStore.ts` — `useUiStore()`

- State: `sidebarRail` (`ref(false)`). Action: `toggleSidebarRail()`.
- Persists to **`localStorage`** (`persist: { storage: localStorage }`) — the rail state is shared
  across sessions/tabs on the machine.

---

_Pure helpers misplaced next to composables should be moved into `src/_common/utils/` — see
[`utils.md`](utils.md)._
