# Base DTOs — `src/_common/dto/`

Shared base classes/interfaces every feature DTO builds on. Extend/implement these instead of re-declaring `id`, paging, filter, or sort shapes. Path conventions (all under `src/_common/dto/`):
`request/base`, `request/interface`, `request/general`, `response/base`, `response/interface`, `response/general`, `dto/dto` (value objects + table metadata), `dto/enum`. A couple of tiny cross-cutting types sit **directly** in `dto/` (see "Top-level" below).

## Top-level — `dto/`

| Type           | File                     | Shape                                                                                            | Use for                                                         |
|----------------|--------------------------|-------------------------------------------------------------------------------------------------|----------------------------------------------------------------|
| `ExportFormat` | `dto/ExportFormat.ts`    | `type ExportFormat = 'xlsx' \| 'csv'`                                                            | Export-menu format union (pairs with `ExportMenu.vue`).        |
| `ICalendar`    | `dto/ICalendar.ts`       | `{ date, dayType, dayIndex, label, holidayName, isToday, isWeekend }`                            | Day model consumed by `CalendarGrid` / `CalendarDayCellHeader`. |

## Response

| Type                                           | File                                       | Shape                                                               | Use for                                                           |
|------------------------------------------------|--------------------------------------------|---------------------------------------------------------------------|-------------------------------------------------------------------|
| `IIdResponse`                                  | `response/interface/IIdResponse.ts`        | `{ id: number }`                                                    | Minimum contract for any DataTable row.                           |
| `IdResponse`                                   | `response/base/IdResponse.ts`              | `class { id }` + `fromJson`                                         | Concrete `IIdResponse`; extend or use directly for id-only rows.  |
| `BaseTableItemResponse`                        | `response/base/BaseTableItemResponse.ts`   | `abstract class { id }` implements `IIdResponse`                    | Base class for a paginated-table row DTO.                         |
| `BaseTableResponse<TItem extends IIdResponse>` | `response/base/BaseTableResponse.ts`       | `{ items, itemsCount, pageCount }` + `fromJson(json, itemFromJson)` | Wrapper for paginated list endpoints (tolerates PascalCase keys). |
| `SelectOption`                                 | `response/general/SelectOption.ts`         | `{ id, text }` + `fromJson` / `listFromObjects` / `fromIdName`      | Options for `VIdSelect` / `VIdAutocomplete`.                      |
| `LookupResponse`                               | `response/general/LookupResponse.ts`       | `extends SelectOption` + `sortOrder`                                | Lookup/edit-table rows.                                           |
| `SpFileUploadResponse`                         | `response/general/SpFileUploadResponse.ts` | upload result                                                       | Attachment upload responses.                                      |

## Request

| Type                                                          | File                                         | Shape                                                                          | Use for                                                        |
|---------------------------------------------------------------|----------------------------------------------|--------------------------------------------------------------------------------|----------------------------------------------------------------|
| `IFilterRequest`                                              | `request/interface/IFilterRequest.ts`        | `object` (marker)                                                              | Constrains a filter generic `TFilter`.                         |
| `ICreateRequest` / `IUpdateRequest`                           | `request/interface/`                         | `object` (markers)                                                             | Generic constraints for create/update payloads.                |
| `IBaseTableCreateItemRequest` / `IBaseTableUpdateItemRequest` | `request/interface/IBaseTableItemRequest.ts` | `object` (markers)                                                             | Inline-edit-table create/update payloads.                      |
| `SortByRequest`                                               | `request/base/SortByRequest.ts`              | `{ key, isDesc }` + `static map(VSortItem[])`                                  | One sort column; `map` converts Vuetify `sortBy`.              |
| `SortRequest`                                                 | `request/base/SortRequest.ts`                | `{ sortBy: SortByRequest[] }`                                                  | Sort-only POST body.                                           |
| `BaseTableRequest`                                            | `request/base/BaseTableRequest.ts`           | `{ itemsPerPage, page, sortBy }`                                               | Base for paginated requests.                                   |
| `FilterRequest<TFilter>`                                      | `request/base/FilterRequest.ts`              | `{ useFilter, filter }`                                                        | Filter-only POST body.                                         |
| `FilterSortRequest<TFilter>`                                  | `request/base/FilterSortRequest.ts`          | `extends FilterRequest` + `sortBy`                                             | Filter + sort POST body.                                       |
| `FilteredTableRequest<TFilter extends IFilterRequest>`        | `request/base/FilteredTableRequest.ts`       | `extends BaseTableRequest` + `{ useFilter, filter }`, ctor takes `VSortItem[]` | Paginated filtered table (pairs with `useFetchFilteredTable`). |
| `LookupRequest` / `LookupFilterRequest`                       | `request/general/LookupRequest.ts`           | `{ text, sortOrder? }` / `{ text }`                                            | Lookup create / lookup filter.                                 |
| `DateAndTimeRangeRequest`                                     | `request/general/DateAndTimeRangeRequest.ts` | date + time range                                                              | Date/time-range POST bodies.                                   |

These pair with the base API helpers — see [`docs/api.md`](api.md).

## Value objects & table metadata — `dto/dto/`

Plain (non-id) value classes shared across modules. Construct directly; not entity rows.

| Type                                    | File                                   | Notable                                                                 |
|-----------------------------------------|----------------------------------------|------------------------------------------------------------------------|
| `Time`                                  | `dto/dto/Time.ts`                      | Wall-clock `{ hours, minutes }` value object (no date).                 |
| `TimePrecise`                           | `dto/dto/TimePrecise.ts`               | `{ hours, minutes, seconds }`; `TimePreciseKeys` union exported.        |
| `VSortItem`                             | `dto/dto/VSortItem.ts`                 | Vuetify sort item `{ key, order }`; feeds `SortByRequest.map`.          |
| `ValueTitleDto<TValue>`                 | `dto/dto/ValueTitleDto.ts`             | `{ value, title }` option for plain `VSelect` (enum/string keys).       |
| `Address` / `BuildingAddress`           | `dto/dto/Address.ts`, `BuildingAddress.ts` | Address sub-form models (used by the address form fields).         |
| `MenuItem`                              | `dto/dto/MenuAction.ts`                | Menu/action descriptor.                                                 |
| `DialogConfig` / `DialogInstance` / `DialogResult` | `dto/dto/DialogConfig.ts`   | Programmatic-dialog shapes (see `CentralDialogComposable`).             |
| `TableColumn`                           | `dto/dto/table/TableColumn.ts`         | Column metadata for `DataTable` / `BasicTable`.                         |
| `EditableColumnMetadata`                | `dto/dto/table/EditableColumnMetadata.ts` | Column metadata for the inline-edit `TableGrid`.                     |
| `EditableTableCell`                     | `dto/dto/table/EditableTableCell.ts`   | Per-cell state for inline editing.                                      |
| `TableAction`                           | `dto/dto/table/TableAction.ts`         | Row-action descriptor.                                                  |
| `ShowPerPageOptions`                    | `dto/dto/table/TableConstants.ts`      | `const [10, 20, 50, 100, 150, 200]` per-page choices.                   |

## Enums — `dto/enum/`

All **string** enums (value === name) unless noted.

| Enum / const                  | File                                   | Notable                                                          |
|-------------------------------|----------------------------------------|------------------------------------------------------------------|
| `DayType`                     | `dto/enum/DayType.ts`                  | Workday / Weekend / Holiday / Vacation / SickDay / Special.      |
| `DayOfWeek`                   | `dto/enum/DayOfWeek.ts`               | + `DAY_OF_WEEK_SHORT_LABELS` record.                             |
| `TableCellType`               | `dto/enum/TableCellType.ts`          | Inline-edit cell input types.                                    |
| `PatternMatchType`            | `dto/enum/PatternMatchType.ts`       | Filter string-match modes.                                       |
| `EqualityOperatorEnum`        | `dto/enum/EqualityOperatorEnum.ts`   | Equal / NotEqual / GreaterThan / … (string-valued).             |
| `AvailableLocales`            | `dto/enum/AvailableLocales.ts`       | Supported i18n locales.                                          |
| `NullFalseTrueCheckboxStates` | `dto/enum/NullFalseTrueCheckboxStates.ts` | `const [null, false, true]` cycle for the tri-state checkbox. |
