# `src/_common/component/` — Reference

Reusable, domain-agnostic components (dialogs, cards/feedback, data tables, date/time, calendar,
forms, inputs). **Check here before building a new one.** Paths below are relative to
`src/_common/component/`.

> Conventions in use: `<script setup lang="ts">`, type-based `defineProps` destructure with
> defaults, `defineModel()` for v-model, camelCase props in template & TS, PascalCase tags. Slots
> are listed where they're the main extension point.

---

## Dialogs — `dialog/`

### `dialog/MyDialog.vue`  — base dialog

Base for **all** dialogs. Responsive `maxWidth` (driven by `useDisplay` + `isSmall`), `surface` card
with header / body / footer.

- **v-model**: `boolean` (required) — open state.
- **props**: `title`, `text`, `persistent=true`, `eager=false`, `hasHeader=true`, `hasFooter=true`,
  `hasCloseBtn=true`, `closeBtnColor='secondaryOutline'`, `closeBtnVariant='outlined'`,
  `closeBtnText`, `hasConfirmBtn=true`, `confirmBtnLabel`, `confirmBtnColor`,
  `confirmBtnDisabled=false`, `isSmall=true` (narrow widths).
- **emits**: `closed`, `confirmed`.
- **slots**: default (body), `header`, `title`, `footer`, `leftButton`, `centerButton`,
  `rightButton`.
- **exposed**: `open()`.
- Enter emits `confirmed` (except when focus is in a `textarea` or `select`); Esc closes.

### `dialog/ErrorDialog.vue`

Thin wrapper over `MyDialog` for error messages with an optional retry button.

- **v-model**: `boolean`. **props**: `title`, `message`, `hasRetryButton=false`.
- **emits**: `closed`, `retried`.

### `dialog/LoadingFullscreen.vue`

Fullscreen indeterminate spinner overlay, driven entirely by `useLoading()` (no props). Mount once
near the app root.

### `dialog/LookupDialog.vue`

Add/edit dialog for simple `{ text }` lookup entities. Generic over `entityName`: wires up
`useEntityCommand` (`createWithResponse` / `updateWithResponse`) and a single required text field.

- **props**: `entityName` (required). **emits**: `created: [newItem]`, `updated: [updatedId, updatedItem]`.
- **exposed**: `openAddDialog()`, `openEditDialog(text, id)`.

---

## Top-level — `src/_common/component/`

### `ActionBar.vue`

Floating, centered sticky action bar (e.g. for batch selection) that slides up. Renders a default
slot for custom buttons plus a built-in Cancel.

- **props**: `isShown`. **emits**: `cancel`. **slot**: default (action buttons).

### `BuildingAddressFormField.vue`

City / street / descriptive + orientation number sub-form, two-way bound to a `BuildingAddress`
(used by the hbcleaning apartment-building & cleaned-company forms).

- **v-model**: `BuildingAddress`.
- ⚠ Labels are hardcoded SK and it overlaps `form/AddressFormField.vue` — prefer that one for plain
  addresses.

### `MyImg.vue`

`VImg` with a built-in blurred base64 `lazySrc` placeholder and a spinner placeholder slot.

- **props**: `src` (required), `width='200'`, `maxWidth='250'`.

### `MyPdfViewer.vue`

PDF renderer via `@tato30/vue-pdf`. Renders one page at a time with a working Prev/Next pager
(`page / pages`, bounds-clamped, i18n labels).

- **v-model**: `string | null` (PDF source).

### `TabsLayout.vue`

`VTabs` + `VTabsWindow` wrapper. One named slot per tab (`#[tab.value]`).

- **v-model**: `string` (active tab value). **props**: `tabs: {value,label}[]`,
  `color='primaryOutline'`, `showDivider=true`.

### `ExportMenu.vue`

Dropdown button offering Excel / CSV export.

- **props**: `loading=false`, `disabled=false`. **emits**: `export: [format: ExportFormat]`.

### `FilterPanel.vue`  (generic `<T extends object>`)

Right-side slide-in filter drawer (teleported to body) with active-filter chips and apply/clear. You
supply a `defaultFactory` (fresh filter) and `chipFormatters` (per-key → chip info). Edits happen on
a `draft` clone and commit on Apply.

- **v-model**: `T` (the filter) (required).
- **props**: `defaultFactory: () => T`, `chipFormatters: ChipFormatters<T>`, `width=400`, `title`,
  `navbarHeight=64`.
- **emits**: `apply`, `reset`. **slot**: `fields` (scoped: `{ draft }`).
- **exported types**: `ChipInfo`, `ChipFormatter`, `ChipFormatters`.
- `draft` is a **deep** clone (`structuredClone` over `defaultFactory()` + current filter), so nested
  fields are isolated until Apply.

### `HierarchyTree.vue`  (generic `<T extends { id: number; children: T[] }>`)

Recursive expand/collapse tree renderer for parent/child data. **Controlled by the shape** — pass a
roots array already arranged by `buildTree()` (`utils/buildTree.ts`); the component only renders and
manages per-branch expansion (each level owns its own expanded set and starts fully expanded). You
render each node via the `node` slot; it does no fetching, selection, or editing itself.

- **props**: `nodes: T[]` (required), `depth=0` (internal recursion offset — omit at the top).
- **slot**: `node` (scoped: `{ node, depth }`) — the row content for one node.

### `LookupEditTable.vue`

Filtered, paginated table for simple lookup entities, paired with `LookupDialog`. Generic over an
`entityName` prop — fetches via `useFetchFilteredTable` and renders a `BasicTable` with a single
`text` column, plus add/edit/delete wired to the dialog.

- **props**: `entityName` (required).

---

## Cards & feedback — `feedback/`

### `feedback/MyCard.vue`  — preferred card wrapper

`VCard` with optional title, default-slot body, and a cancel/save footer.

- **props**: `title`, `hasFooter=true`. **emits**: `cancel`, `confirm`. **slot**: default.

### `feedback/ChipWithIcon.vue`

`VChip` with an optional leading icon. Dual color API: `color` = palette name resolved via
`useColor()` (text color for tonal/outlined, bg color otherwise); `vColor` = raw Vuetify color
(takes precedence). `closable` / `@click:close` work via attribute fall-through to `VChip`.

- **props**: `icon`, `color`, `vColor`, `size='default'`, `variant='tonal'`. **slot**: default
  (label).

### `feedback/SubtleCard.vue`

Tinted panel: translucent background + border derived from a theme `color`, with optional icon
title, "short" (overline) title, centering, and a close button.

- **props**: `color` (required), `borderOpacity='medium'` (`low|medium|high`), `title`,
  `shortTitle=false`, `titleCentered=false`, `text`, `hasIcon=false`, `icon`, `closable=false`.
- **emits**: `close`. **slot**: default (body; falls back to `text`).

### `feedback/InfoCard.vue`

Bordered section card with an uppercase icon+title header; can render a "no data" message when
`hasData` is `false`.

- **props**: `title`, `icon`, `wide=false` (spans grid), `hasData`, `noDataText`. **slot**: default.

### `feedback/InfoRow.vue`

Stacked label-over-value row (label small/muted, value below), with scoped styling.

- **props**: `label` (required), `value?: string|number|null`. **slot**: default (overrides value).

### `feedback/EmailInfoRow.vue`

`InfoRow` specialization rendering a `mailto:` link as the value.

- **props**: `label`, `email`.

### `feedback/Snackbar.vue`

Top snackbar bound to `useSnackbar()` (message/color/timeout/action). Mount once near app root; no
props.

---

## Data tables — `dataTable/`

All wrap `VDataTableServer` (server-side paging/sorting). Shared v-models:
`modelValue: TItem[]`, `itemsPerPage: number`, `page: number`, `sortBy: VSortItem[]`,
`loading: boolean` (all required). `itemsLength` and `columns` are props. `@onLoadItems` fires on
options change — (re)fetch there.

#### Cell rendering: auto-format vs. per-column slots

Cells render with **zero config** by default — the column `key` is matched by name (case-insensitive,
via `useTableFormatters`) and formatted automatically. **Don't add a slot for these** — only override
when you need genuinely custom markup:

| Match on `key`                                                        | Rendered as                                    |
| --------------------------------------------------------------------- | ---------------------------------------------- |
| contains `datetime` / `timestamp`                                     | date+time (`formatToTime`)                     |
| contains `date`                                                       | date (`formatToDate`)                          |
| starts with `is` / `has` / `can` / `show`                             | ✔/✘ colored `VIcon`                            |
| contains `amount`/`price`/`cost`/`total`/`sum`/`salary`/`fee`/`budget`/`revenue`/`payment` | currency (`formatPrice`)  |
| contains `percent`/`rate`/`vat`/`ratio`/`discount`                    | `NN.NN %`                                       |
| anything else                                                         | raw value (`—` when nullish/array)             |

To override a single column, provide a **per-column slot** `#item.<key>` — it always wins over the
auto-format. Scoped with `{ item, value }` (`value` = that cell's value, `item` = the whole row):

```vue
<BasicTable ...>
  <template #item.odometerReading="{ item }">
    <span class="text-medium-emphasis">{{ item.odometerReading !== null ? `${item.odometerReading} km` : '—' }}</span>
  </template>
</BasicTable>
```

Works the same on `DataTable`, `BasicTable`, and `TableGrid`. (There is no longer a single
`formattedColumn` catch-all slot — it was removed in favor of these.)

### `dataTable/DataTable.vue`  (generic `<TItem extends IIdResponse>`)

Low-level server table: builds headers via `useTableHeader`, forwards **all** slots through, handles
select/expand. Use directly when you need full slot control.

- **extra v-model**: `expanded`, `selected`. **props**: `columns`, `itemsLength`, `showActions?`,
  `actions?`, `showExpand?`, `showSelect?`. **emits**: `onAdd`, `onEdit`, `onDelete`, `onLoadItems`.

### `dataTable/BasicTable.vue`  (generic `<TItem extends IIdResponse>`)

Opinionated table on top of `DataTable`: default edit/delete action buttons, create button in the
actions header, built-in (working) delete-confirm dialog, footer.

- **props**: adds `showActionsHeader=true`, `deleteConfirmationColumn`, `hasDelete=true`,
  `hasEdit=true`, `hasCreate=true`. **slots**: `createButton`, `actionsHeader`, per-column
  `item.<key>` (scoped: `{ item, value }`), `actions` (scoped: `{ item }`), `additionalActions`,
  `expandedRow`, `footer.append`. **emits**: `onAdd`, `onEdit`, `onDelete`, `onLoadItems`.

### `dataTable/TableGrid.vue`  (generic `<TItem extends IIdResponse>`)

Inline-editable grid (per-cell or per-row edit, snapshots, undo, save-all/discard-all). Columns are
`EditableColumnMetadata`. Renders cells through `dataTable/AdminTableCell`.

- **extra v-model**: `selectedIds: (string|number)[]`. **props**: `columns: EditableColumnMetadata[]`,
  plus the BasicTable-style flags. **emits**: `onAdd`, `onDelete`, `onLoadItems`,
  `onSaveAll: [changedItems]`. **slots**: `actionsHeader`, per-column `item.<key>`
  (scoped: `{ item, value }`), `actions`, `additionalActions`, `expandedRow`, `footer.append`.
- ⚠️ snapshot/clone uses `JSON.parse(JSON.stringify(...))`, which loses `Date` types (review).

### `dataTable/AdminTableCell.vue`

Single inline-edit cell renderer used by `TableGrid`. Shows a `TableCellEditor` when the cell is in
edit mode and not read-only, otherwise the value (image or text). Backed by `useEditableCell`.

- **props**: `cellItem: EditableTableCell`. **emits**: `editCell`, `updatedCell`, `editCellCanceled`.
  **slots**: `tableCellEditor`, `tableCellValue`.

### `dataTable/inlineEditTable/TableCellEditor.vue`

Per-type inline editor (text / number / select / …) rendered inside an editing cell; chosen by the
cell's `TableCellType`. Used by `AdminTableCell` / `useEditableCell`.

- **props**: `cellType: TableCellType`, `value?`, `options?`. **emits**: `update`, `cancel`.
- ⚠ Uses `type="number"` rather than `VNumberInput` (review).

### `dataTable/MyTableFooter.vue`

Items-per-page select + centered pagination + range text. Fully i18n (`$vuetify.dataFooter.*`) with
scoped styling. Used by the tables above.

- **v-model**: `itemsPerPage`, `page`. **props**: `itemsLength`. **slot**: `append`.

---

## Date & time — `dateTime/`

### `DateTimePicker.vue`

Merged `VDateInput` + `TimePicker` producing a single `Date`.

- **v-model**: `Date | null`. **props**: `label` (required), `density='comfortable'`,
  `dateClearable=true`, `maxDate=null`, `minDate=null`.

### `MyDateInput.vue`

`VDateInput` with prev/next-day arrow buttons; passes through `$attrs`.

- **v-model**: `Date` (required). **props**: `dateShowArrows=true` (+ `density` via attrs).

### `TimePicker.vue`

Masked `##:##` text field bound to the `Time` DTO, with a `VTimePicker` menu and optional
increment/decrement arrows; snaps minutes to `allowedMinutesSelected`.

- **v-model**: `Time` (required). **props**: `color='base'`, `showArrows=false`, `hideDetails=false`,
  `rules=[]`, `label='Time'`, `viewMode='hour'`, `width='100px'`, `icon='far fa-clock'`,
  `allowedMinutesSelected='5'`, `density='comfortable'`, `disabled=false`.

### `TimeRangePicker.vue`

Start time + a toggle between **length** (duration hours/minutes) and **range** (end time) modes;
mode persists to `localStorage` (`timeRangePickerMode`). Labels are i18n.

- **v-model**: `start: Time`, `end: Time` (required). **props**: `label`, `startIcon`, `endIcon`,
  `allowedMinutesSelected='10'`, `density='comfortable'`. **emits**: `spanChanged: [hours]` (emitted
  from a `watch` on the computed span).

### `MonthYearPicker.vue`

Month + year selectors with prev/next-month arrows that roll over year boundaries (clamped to the
year range). Two separate v-models — `month` is **1-based** (1 = January) to match the C# backend.
Labels are i18n (`dateTime.*`).

- **v-model**: `month: number | null`, `year: number | null`. **props**: `hideDetails=false`,
  `density='comfortable'`, `minYear?`, `maxYear?`, `yearSpan=10` (± current year when min/max omitted).

### `DateRangePicker.vue`

Three-mode date range selector: **range** (start/end), **month** (month+year with arrows), and
**duration** (anchor + unit + quantity). All labels are i18n; caps the span at `maxDays` with a
validation alert.

- **v-model**: `{ start: Date|null, end: Date|null }`. **props**: `label=''`,
  `mode='month'` (`range|month|duration`), `hideDetails=false`, `density='comfortable'`, `maxDays=31`.
- **exposed**: `getDateRange()`, `isValid()`.

### `TimeDisplay.vue`

Read-only H/M/S cards from a `TimePrecise`.

- **props**: `timeObject: TimePrecise`, `whatToShow=['hours','minutes','seconds']`.

### `TimeDisplayWithProgress.vue`

Large reversed `VProgressCircular` wrapping a `TimeDisplay` (countdown-style), progress =
remaining/initial.

- **props**: `title`, `timeInitialObject: Time`, `timeRemainingObject: TimePrecise`,
  `color='primary-accent'`, `whatToShow`.

---

## Calendar — `calendar/`

### `CalendarGrid.vue`

Month/range calendar grid with a `DateRangePicker` header, day-visibility filter, holiday chips, and
a per-cell content slot. **Controlled** — the parent supplies the `days` (and `loading`); it no
longer fetches data itself. Formats dates via `utils/DateTimeHelper.ts`; labels are i18n.

- **props**: `dateRangeMode='month'` (`range|month|duration`), `minRowHeight=220`,
  `days: ICalendar[] = []`, `loading=false`, `selectedIds: number[] = []`.
- **emits**: `dayClick: [day: ICalendar]`, `dateRangeChange: [{ start, end }]`.
- **slots**: `toolbar-center`, `toolbar-end`, `day-cell-content` (scoped: `{ day }`), `footer-center`.
- **exposed**: `dateRange`.

### `CalendarDayCellHeader.vue`

Single day-cell header: date, day-type badge, label, holiday badge. Formats via
`formatToDateWithoutYear` from `utils/DateTimeHelper.ts`.

- **props**: `day: ICalendar`.

---

## Forms — `form/`

### `form/AddressFormField.vue`

Address sub-form (city / street / house number / postal code) with i18n labels and validation rules.

- **v-model**: `Address` (required).

### `form/LogTimeForm.vue`

Small form: a `DateTimePicker` + a length `TimePicker` with a non-zero rule.

- **v-model**: `dateTime: Date`, `length: Time` (both required). **emits**: `submit`.
- **exposed**: `validate()`.

---

## Inputs — `inputs/`

### `inputs/ColorPicker.vue`

Swatch grid for picking a named color from `COLOR_PALETTE` (theme-aware), with a "none" option.

- **v-model**: `string | undefined` (palette `name`). **props**: `label`.

### `inputs/InputWithButton.vue`

Flex row that places a default slot (an input) next to an icon button.

- **props**: `showBtn`, `icon`, `color`, `variant='tonal'`, `density='comfortable'`.
- **emits**: `create`. **slot**: default (the input).

### `inputs/MergedInputs.vue`

Two-slot container that strips the inner border-radius between two adjacent `v-field`s so they read
as one merged control.

- **slots**: `first`, `second`.

### `inputs/IconPicker.vue`

Read-only text field that opens `IconPickerDialog`; shows the chosen FontAwesome icon, stores a
Vuetify icon string.

- **v-model**: `string | null` (required). **props**: `label=''` (falls back to `iconPicker.icon`
  i18n), `placeholder=''`, `rules=[]`, `hideDetails=true`, `density='comfortable'`, `clearable=true`.
  **emits**: `select: [IconInfo]`. **exposed**: `openDialog()`.

### `inputs/IconPickerDialog.vue`

Searchable FontAwesome icon browser (solid/regular/brands) with virtual scroll. Built on `MyDialog`;
strings are i18n (`iconPicker.*`).

- **v-model**: `boolean` (required). **props**: `initialValue: string|null`.
  **emits**: `select: [IconInfo]`.

### `inputs/NullFalseTrueCheckbox.vue`

Tri-state checkbox cycling `null → false → true` (false renders as an indeterminate "x").

- **v-model**: `boolean | null` (default `null`, required). **props**: `label=''`,
  `hideDetails=false`.
