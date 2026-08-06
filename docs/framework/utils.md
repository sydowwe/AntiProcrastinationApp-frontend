# `src/_common/utils/` — Reference

Location: `src/_common/utils/`. Pure helpers and small grouped utilities. **Check here before
reimplementing.** For Vue/Vuetify runtime helpers (reactive, `useTheme`, etc.) see
`src/_common/composable/general/` instead.

> Convention: files here should be free of Vue reactivity. A `use*` export that needs a component
> `setup` belongs in `src/_common/composable/general/`, not in `utils/`.

## Files

### `buildTree.ts`
- `TreeNode<T>` — minimal shape (`{ id, parentId, children }`) a DTO must satisfy to be tree-arranged.
- `buildTree(items)` — arranges a flat list into a parent/child tree by mutating each item's `children` in place (operates on the real instances, so DTO getters survive); items with a missing/`null` parent become roots, input order preserved per level. Returns the roots. Feeds `HierarchyTree.vue`.
- `collectSubtreeIds(node)` — ids of a node + all descendants; use to block re-parenting a node under itself (cycle guard).

### `checklistHelpers.ts`
- `isChecklistItemOverdue(dueDate, isDone)` — shared overdue rule (has a past due date and is not done).

### `colorPalette.ts`
- `COLOR_PALETTE` — 29 named colors, each with `dark`/`light` × `bg`/`text` AA-contrast hex values.
- `ColorOption` — type for a palette entry.
- `resolveColor(name, theme, usage)` — look up a palette hex by name + `'dark'|'light'` + `'bg'|'text'`.
- _(The theme-aware `useColor()` composable now lives in `composable/general/useColor.ts` — see [composables](composables.md).)_

### `colorUtils.ts`
- `lightenColor(hslColor, amount)` — lighten an `hsl(...)` string by `0..1`.
- `withOpacity(hslColor, opacity)` — convert an `hsl(...)` string to `hsla(...)` with given opacity.

### `domainColor.ts`
- `getDomainColor(domain)` — deterministic, colorblind-aware HSL color per domain string (`_other` → gray).

### `DateTimeHelper.ts` (dayjs-based; replaced the old `momentHelper.ts`)
- `isSameDay(a, b)` — same calendar day (null-safe).
- `formatDateForApi(date)` — `YYYY-MM-DD` for API payloads.
- `getISOWeekStart(date)` / `getISOWeekEnd(date)` / `getISOWeekNumber(date)` — ISO week helpers.
- `formatWeekLabel(weekStart)` — `"01.01.2026 - 07.01.2026 (W1)"`.
- `getTranslatedMonths(locale='sk')` — `[{ value, title }]` month options (1-based `value`).
- `daysBetween(start, end)` — whole-day diff (`end - start`) via dayjs.
- `combineDateAndTime(date, time)` — merges a `Date` with a `Time` DTO into one `Date` (seconds/ms zeroed).
- `roundToNearestInterval(minutes, interval)` — snaps a minute count to the nearest `interval` multiple.
- `durationToDays(quantity, unit)` — converts `quantity` of `'day' | 'week'` to a day count.
- SK-locale formatters/parsers exported as plain functions (no `use*` grouping anymore — import each
  directly): `formatToDate`, `formatToTime`, `formatToTime24H`, `formatToTimeWithSec`,
  `formatLocalized`, `formatToDateWithDay`, `formatToDateWithDayAfter`, `formatToDateWithoutYear`,
  `startOfDayLocal`, `stringToUTCDate`, `urlStringToUTCDate`, `usStringToUrlString`,
  `formatTimeDtoToUtcTimeDto`.

### `enumHelpers.ts`
- `convertToEnum(enumObject, key)` — look up an enum member by key.
- `getEnumKeyByValue(enumObject, value)` — reverse-look up the key for a value.
- _(For the i18n select-option builder see `EnumComposable.getEnumSelectOptions` in [composables](composables.md).)_

### `fileDownload.ts`
- `downloadBlob(blob, fileName)` — trigger a browser download for a binary blob.
- `filenameFromContentDisposition(header, fallback)` — extract a filename from a `Content-Disposition` header (RFC 5987 aware).
- `parseContentDispositionFileName(header)` — extract a filename or `null` (the canonical version; the old `helperMethods.ts` duplicates were removed).

### `fontAwesomeIcons.ts`
- `getSolidIcons()` / `getRegularIcons()` / `getBrandsIcons()` / `getIconsByStyle(style)` — cached icon lists.
- `searchIcons(icons, query)` / `formatIconName(name)` — search & display formatting.
- `toVuetifyIcon(icon)` / `parseVuetifyIcon(str)` / `findIconByVuetifyString(str)` — convert between `IconInfo` and Vuetify `"fas fa-check"` strings.
- Types: `IconStyle`, `IconInfo`, `ParsedIcon`.

### `formatDuration.ts`
Plain duration formatters (no `Time` DTO dependency):
- `fromSeconds(seconds)` — `"5h 32m"` (`"0m"` when zero).
- `fromMinutes(minutes)` — `"5h 32m"` from minutes (`"0m"` when zero).
- `fromDecimalHours(decimalHours)` — `"5h 30m"` from a decimal-hours value (e.g. `5.5`); empty string when zero.
- `fromSecondsDetailed(seconds)` — includes seconds, e.g. `"5h 32m 15s"`.

### `helperMethods.ts`
- `capitalizeString(str)` / `uncapitalizeString(str)` — first-letter case helpers.
- `openInNewTab(url)` — open a URL in a new tab with `noopener`.
- `getNestedValue(obj, key)` — null-safe dotted-path getter (`"a.b.c"`); moved here from the table header composable.
- `formatFileSize(bytes)` — human-readable size (`"1.5 MB"`, `"—"` for null).

### `keyboardUtils.ts`
- `preventE(event)` — keydown guard blocking `e`/`E` in number inputs (moved out of `continuousQuickChangeComposition`).

### `notifications.ts`
- `showNotification(title, message)` — local notification via service worker (requests permission on first use).
- `isNotificationSupported()` / `requestNotificationPermission()`.

### `notificationTypeMeta.ts`
- `notificationIcon(type)` / `notificationIconColor(type)` / `notificationRoute(type)` — map a notification `type` enum to icon/color/click-through route.

### `serviceWorker.ts`
- `isServiceWorkerSupported()` — feature check.
- `registerServiceWorker()` — idempotent `/sw.js` registration (cached promise).
- `getActiveRegistration()` — active registration for push/`showNotification` (settles even when none registered).

### `validators.ts`
Pure string predicates (used by `useGeneralRules` to build Vuetify rules; re-exported from `RulesComposition` for back-compat):
- `isValidEmail(value)`.
- `isOnlyLettersWithDiacritics(value)` / `isLettersWithDiacriticsAndSpecialChars(value)`.
- `isOnlyNumbers(value)` / `isLettersAndNumbers(value)`.
- `isLettersWithDiacriticsAndNumbersAndSpecialChars(value)`.
