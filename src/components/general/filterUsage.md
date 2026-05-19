# FilterPanel usage guide

Reusable generic filter for any table view. One component handles the toggle button, the active-filter chips bar, and the slide-in drawer. Parent supplies a filter DTO, a default-factory, chip formatters, and the input fields via slot.

**Component:** `src/components/general/FilterPanel.vue`
**Reference implementation:** `src/views/employee/EmployeeTableView.vue`

---

## 1. Public API

### Props

| Prop | Type | Required | Notes |
|---|---|---|---|
| `modelValue` (v-model) | `T` | yes | The **committed** filter object the parent uses for API calls. |
| `defaultFactory` | `() => T` | yes | Returns a fresh "empty" filter. Used for Reset and for resetting single fields when a chip is closed. The DTO must be constructible with no args. |
| `chipFormatters` | `ChipFormatters<T>` | yes | Per-field formatter map. `null` return = field is inactive (no chip). |
| `width` | `number` | no | Drawer width in px. Default `400`. |
| `title` | `string` | no | Drawer header. Defaults to `$t('general.filter')`. |
| `navbarHeight` | `number` | no | Top offset of the overlay. Default `64` (app navbar height). |

### Emits

- `apply` — fired after the user clicks Apply, after Reset, and after closing a chip. Parent should call `loadItems()` in this handler.
- `reset` — fired in addition to `apply` when the Reset button is pressed.

### Slot

- `#fields="{ draft }"` — receives a **draft** copy of the filter (a fresh `cloneFilter(filter.value)` taken on each drawer open). Bind inputs to `draft.*`; the draft is committed to `filter` only when the user clicks Apply.

### Exported types (`import ... from '@/components/general/FilterPanel.vue'`)

```ts
interface ChipInfo<TKey = string> {
  label: string
  icon?: string        // FontAwesome icon name
  color?: string       // palette color (passed through ChipWithIcon)
  vColor?: string      // raw Vuetify color override
  resetKeys?: TKey[]   // optional — close-icon resets these keys instead of just the formatter's own key
}

type ChipFormatters<T> = { [K in keyof T]?: (value: T[K], filter: T) => ChipInfo<keyof T> | null }
```

---

## 2. Step-by-step: add a filter to a new table view

### Step A — Define / extend the filter DTO

File: `src/dtos/<entity>/<Entity>.ts`

Filter DTOs are plain classes. **Every constructor parameter must have a default** so `new EntityFilterDto()` works (required by `defaultFactory`).

```ts
export class WidgetFilterDto {
  constructor(
    public nameContains: string | null = null,
    public createdFrom:  Date | null   = null,
    public createdTo:    Date | null   = null,
    public statusList:   WidgetStatus[] = [],
    public categoryIdList: number[]    = [],
  ) {}
}
```

Conventions in this codebase:

- Nullable text/date fields → `string | null = null`, `Date | null = null`
- Range fields → two siblings: `xxxFrom` + `xxxTo`
- Multi-select → plural `xxxList: ...[] = []`

### Step B — Make sure the backend filter endpoint exists

The table view uses `useEntityQuery()` → `fetchFilteredTable()` (POST `/{entity}/filtered-table`). If your entity's API composable doesn't expose `fetchFilteredTable` yet, add it:

```ts
// src/api/WidgetApi.ts
import { useFetchFilteredTable } from '@/api/base/fetchFilteredTable.ts'
import { WidgetFilterDto, WidgetResponse } from '@/dtos/widget/Widget.ts'

export function useWidgetQuery() {
  const { loading, fetchFilteredTable } =
    useFetchFilteredTable<WidgetResponse, WidgetFilterDto>(WidgetResponse, 'widget')
  // ...other queries
  return { /* ... */, fetchFilteredTable, loading }
}
```

### Step C — Wire `FilterPanel` into the table view

In the view's `<template>`, place `<FilterPanel>` **immediately above** `<BasicTable>` so the chips bar and toggle render in their own row:

```vue
<template>
<div class="d-flex flex-column w-100 ga-2">
  <FilterPanel
    v-model="filter"
    :defaultFactory="() => new WidgetFilterDto()"
    :chipFormatters="chipFormatters"
    @apply="loadItems"
  >
    <template #fields="{ draft }">
      <!-- inputs bound to draft.* — see field recipes below -->
    </template>
  </FilterPanel>

  <BasicTable
    v-model="items"
    v-model:page="page"
    v-model:items-per-page="itemsPerPage"
    v-model:sort-by="sortBy"
    :columns
    :itemsLength
    :loading
    @on-load-items="loadItems"
    @onAdd="..."
  />
</div>
</template>
```

In `<script setup lang="ts">`:

```ts
import FilterPanel, { type ChipFormatters } from '@/components/general/FilterPanel.vue'
import { WidgetFilterDto } from '@/dtos/widget/Widget.ts'
import { FilteredTableRequest } from '@/dtos/request/base/FilteredTableRequest.ts'
import { useI18n } from 'vue-i18n'
import { ref } from 'vue'

const i18n = useI18n()
const filter = ref<WidgetFilterDto>(new WidgetFilterDto())

const chipFormatters: ChipFormatters<WidgetFilterDto> = { /* see step D */ }

async function loadItems() {
  // useFilter MUST be true — the request shape carries the filter only when set
  const requestData = new FilteredTableRequest<WidgetFilterDto>(
    itemsPerPage.value, page.value, sortBy.value, true, filter.value,
  )
  const result = await fetchFilteredTable(requestData)
  items.value = result.items
  itemsLength.value = result.itemsCount
}
```

### Step D — Define `chipFormatters`

One entry per filter field that can produce a chip. Return `null` for inactive (default-valued) fields. **Order in the map = order in the bar.**

```ts
const chipFormatters: ChipFormatters<WidgetFilterDto> = {
  nameContains: v => v
    ? { label: `${i18n.t('widget.name')}: ${v}`, icon: 'magnifying-glass' }
    : null,

  // Range collapse — produce ONE chip on the "From" key, suppress the "To" key,
  // and use resetKeys so closing the chip clears both ends at once.
  createdFrom: (_, f) => (f.createdFrom || f.createdTo)
    ? {
        label: `${i18n.t('widget.created')}: ${f.createdFrom ? formatToDate(f.createdFrom) : '…'} – ${f.createdTo ? formatToDate(f.createdTo) : '…'}`,
        icon: 'calendar',
        resetKeys: ['createdFrom', 'createdTo'],
      }
    : null,
  createdTo: () => null,

  statusList: v => v.length
    ? { label: `${i18n.t('widget.status')} (${v.length})`, icon: 'circle-info' }
    : null,

  categoryIdList: v => v.length
    ? {
        label: `${i18n.t('widget.category')}: ${v.map(id => categoryOptions.value.find(o => o.id === id)?.text ?? id).join(', ')}`,
        icon: 'tag',
      }
    : null,
}
```

Rules:
- Active detection is **value-based**, not "differs from default". For string: `if (v)`; for arrays: `if (v.length)`; for dates: `if (f.xFrom || f.xTo)`.
- The formatter receives the **committed** filter value, not the draft.
- Use `resetKeys` whenever one chip represents several DTO fields (date ranges, paired filters).

### Step E — Field recipes for the slot

All inputs go inside `<template #fields="{ draft }">`. Bind directly to `draft.*` — never to `filter.value.*`.

**Plain text (substring search)**

```vue
<VTextField
  v-model="draft.nameContains"
  :label="i18n.t('widget.name')"
  hideDetails
/>
```

**Single-select (SelectOption-shaped data)**

```vue
<VIdSelect
  v-model="draft.categoryId"
  :label="i18n.t('widget.category')"
  :items="categoryOptions"
  hideDetails
/>
```

**Multi-select**

```vue
<VIdAutocomplete
  v-model="draft.categoryIdList"
  :label="i18n.t('widget.category')"
  :items="categoryOptions"
  multiple
  hideDetails
/>
```

Both `VIdSelect` / `VIdAutocomplete` expect items shaped like `SelectOption` (`{ id, text }`). Fetch via the entity's `useXxxQuery().fetchSelectOptions()`:

```ts
const { fetchSelectOptions: fetchCategoryOptions } = useCategoryQuery()
const categoryOptions = ref<SelectOption[]>([])
onMounted(async () => { categoryOptions.value = await fetchCategoryOptions() })
```

**Enum multi-select** — wrap with `getEnumSelectOptions(EnumObj, 'i18n.prefix')` from `@/composable/general/EnumComposable.ts`. The returned items use `{ value, title }`, so use a plain `VSelect`/`VAutocomplete` with `itemValue="value"` and `itemTitle="title"`.

**Date range** — use the project's `DateRangePicker`:

```vue
<DateRangePicker
  :modelValue="{ start: draft.createdFrom, end: draft.createdTo }"
  @update:modelValue="r => { draft.createdFrom = r.start; draft.createdTo = r.end }"
/>
```

`DateRangePicker` enforces a 31-day max range. For unrestricted ranges, use two `VDateInput`s or build a less-restrictive picker.

**Single date**

```vue
<VDateInput
  v-model="draft.someDate"
  :label="..."
  :displayFormat="formatToDate"
  hideDetails
/>
```

**Tri-state boolean** — use `NullFalseTrueCheckbox` from `src/components/general/inputs/`.

### Step F — i18n

All labels go in `src/locales/SK.ts` only — EN is added manually by the maintainer (see project CLAUDE.md). Place keys under the entity's section:

```ts
widget: {
  tableView: {
    name: 'Názov',
    category: 'Kategória',
    status: 'Stav',
    created: 'Vytvorené',
    // ...
  },
},
```

Reuse existing generic keys where possible: `general.filter`, `general.clear`, `general.confirm` — already used inside `FilterPanel` itself, no need to redeclare.

---

## 3. Behavior cheatsheet

| User action | What happens |
|---|---|
| Click **Filter** button | Drawer slides in. `draft = cloneFilter(filter)`. |
| Edit field, click **Confirm** | `filter = draft`; emit `apply`; drawer closes. |
| Click **Clear** (drawer) | `filter = defaultFactory()`; emit `reset` + `apply`; drawer closes. |
| Click chip close (×) | Reset just that field (or `resetKeys`); emit `apply` immediately — drawer stays as is. |
| Click backdrop | Drawer closes, draft discarded. |

The drawer is `position: fixed; top: 64px; right: 0; bottom: 0` and teleported to `<body>`, so it overlays the table without pushing it and stays below the navbar.

---

## 4. Common pitfalls

- **`useFilter` flag must be `true`** in `FilteredTableRequest` — passing `false` (default) discards `filter.value` server-side.
- **DTO no-arg constructor required.** `defaultFactory: () => new XxxFilterDto()` and `cloneFilter` (`Object.assign(defaultFactory(), src)`) both depend on it. If you need parameters, give them defaults.
- **Bind inputs to `draft`**, never to `filter.value` — binding to `filter` defeats the Apply step and causes a network round-trip on every keystroke.
- **Importing types** — `ChipFormatters` / `ChipInfo` live in a regular `<script lang="ts">` block inside the SFC. Use `import FilterPanel, { type ChipFormatters } from '@/components/general/FilterPanel.vue'`.
- **Range chips** — collapse with `resetKeys`. Returning two separate chips for `xxxFrom` and `xxxTo` wastes bar space and forces two clicks to clear.
- **PascalCase tags / camelCase props** in templates (`<VTextField hideDetails />`, not `hide-details`). Project rule from CLAUDE.md.
- **`function` declarations** in `<script setup>`, not `const fn = () => {}`. Project rule from CLAUDE.md.
- **Initial load** — `BasicTable` emits `@on-load-items` on mount, so `loadItems` runs once with the empty default filter. Don't call it manually from `onMounted` as well.

---

## 5. Minimal worked example

```vue
<!-- src/views/widget/WidgetTableView.vue -->
<template>
<div class="d-flex flex-column w-100 ga-2">
  <FilterPanel
    v-model="filter"
    :defaultFactory="() => new WidgetFilterDto()"
    :chipFormatters="chipFormatters"
    @apply="loadItems"
  >
    <template #fields="{ draft }">
      <VTextField v-model="draft.nameContains" :label="i18n.t('widget.tableView.name')" hideDetails />
      <VIdAutocomplete v-model="draft.categoryIdList" :label="i18n.t('widget.tableView.category')"
                       :items="categoryOptions" multiple hideDetails />
      <DateRangePicker
        :modelValue="{ start: draft.createdFrom, end: draft.createdTo }"
        @update:modelValue="r => { draft.createdFrom = r.start; draft.createdTo = r.end }"
      />
    </template>
  </FilterPanel>

  <BasicTable v-model="items" v-model:page="page" v-model:items-per-page="itemsPerPage"
              v-model:sort-by="sortBy" :columns :itemsLength :loading
              @on-load-items="loadItems" />
</div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import FilterPanel, { type ChipFormatters } from '@/components/general/FilterPanel.vue'
import DateRangePicker from '@/components/general/dateTime/DateRangePicker.vue'
import BasicTable from '@/components/general/dataTable/BasicTable.vue'
import { FilteredTableRequest } from '@/dtos/request/base/FilteredTableRequest.ts'
import { WidgetFilterDto, WidgetResponse } from '@/dtos/widget/Widget.ts'
import { useWidgetQuery, useCategoryQuery } from '@/api/WidgetApi.ts'
import { SelectOption } from '@/dtos/response/general/SelectOption.ts'
import { useDateTime } from '@/utils/DateTimeHelper.ts'
import type { VSortItem } from '@/dtos/dto/VSortItem.ts'
import type { TableColumn } from '@/dtos/dto/TableColumn.ts'

const i18n = useI18n()
const { formatToDate } = useDateTime()
const { fetchFilteredTable, loading } = useWidgetQuery()
const { fetchSelectOptions: fetchCategoryOptions } = useCategoryQuery()

const items = ref<WidgetResponse[]>([])
const page = ref(1)
const itemsPerPage = ref(25)
const sortBy = ref<VSortItem[]>([])
const columns = ref<TableColumn[]>([])
const itemsLength = ref(0)

const filter = ref<WidgetFilterDto>(new WidgetFilterDto())
const categoryOptions = ref<SelectOption[]>([])

onMounted(async () => { categoryOptions.value = await fetchCategoryOptions() })

const chipFormatters: ChipFormatters<WidgetFilterDto> = {
  nameContains: v => v ? { label: `${i18n.t('widget.tableView.name')}: ${v}`, icon: 'magnifying-glass' } : null,
  categoryIdList: v => v.length
    ? { label: `${i18n.t('widget.tableView.category')}: ${v.map(id => categoryOptions.value.find(o => o.id === id)?.text ?? id).join(', ')}`, icon: 'tag' }
    : null,
  createdFrom: (_, f) => (f.createdFrom || f.createdTo)
    ? {
        label: `${i18n.t('widget.tableView.created')}: ${f.createdFrom ? formatToDate(f.createdFrom) : '…'} – ${f.createdTo ? formatToDate(f.createdTo) : '…'}`,
        icon: 'calendar',
        resetKeys: ['createdFrom', 'createdTo'],
      }
    : null,
  createdTo: () => null,
}

async function loadItems() {
  const req = new FilteredTableRequest<WidgetFilterDto>(itemsPerPage.value, page.value, sortBy.value, true, filter.value)
  const result = await fetchFilteredTable(req)
  items.value = result.items
  itemsLength.value = result.itemsCount
}
</script>
```
