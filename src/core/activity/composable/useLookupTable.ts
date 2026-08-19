import { ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { TableColumn } from '@/_common/dto/dto/table/TableColumn.ts'
import type { VSortItem } from '@/_common/dto/dto/VSortItem.ts'
import { FilteredTableRequest } from '@/_common/dto/request/base/FilteredTableRequest.ts'
import type { IFilterRequest } from '@/_common/dto/request/interface/IFilterRequest.ts'
import type { IIdResponse } from '@/_common/dto/response/interface/IIdResponse.ts'
import { useFetchFilteredTable } from '@/_common/api/useFetchFilteredTable.ts'
import type { ResponseClass } from '@/_common/api/useEntityQuery.ts'

export interface UseLookupTableConfig<TItem extends IIdResponse, TFilter extends IFilterRequest> {
	filter: Ref<TFilter>
	responseClass: ResponseClass<TItem>
	entityName: string
	columns: TableColumn[]
	hasFilter: (filter: TFilter) => boolean
	deleteEntity: (id: number) => Promise<void>
}

export function useLookupTable<TItem extends IIdResponse, TFilter extends IFilterRequest>(
	config: UseLookupTableConfig<TItem, TFilter>,
) {
	const { fetchFilteredTable, loading } = useFetchFilteredTable<TItem, TFilter>({
		responseClass: config.responseClass,
		entityName: config.entityName,
	})

	const items = ref<TItem[]>([]) as Ref<TItem[]>
	const itemsLength = ref(0)
	const itemsPerPage = ref(10)
	const page = ref(1)
	const sortBy = ref<VSortItem[]>([])

	watch(
		config.filter,
		() => {
			page.value = 1
			loadItems()
		},
		{ deep: true },
	)

	async function loadItems() {
		const filter = config.filter.value
		const hasFilter = config.hasFilter(filter)
		const request = new FilteredTableRequest<TFilter>(
			itemsPerPage.value,
			page.value,
			sortBy.value,
			hasFilter,
			hasFilter ? filter : null,
		)
		const result = await fetchFilteredTable(request)
		items.value = result.items
		itemsLength.value = result.itemsCount
	}

	async function onDelete(item: TItem) {
		await config.deleteEntity(item.id)
		await loadItems()
	}

	return {
		items,
		itemsLength,
		itemsPerPage,
		page,
		sortBy,
		loading,
		columns: config.columns,
		loadItems,
		onDelete,
	}
}
