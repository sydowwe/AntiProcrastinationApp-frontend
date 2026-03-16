import type {IMyResponse} from '@/dtos/response/interface/IMyResponse.ts';
import type {IFilterRequest} from '@/dtos/request/interface/IFilterRequest.ts';
import {ref} from 'vue';
import {API} from '@/plugins/axiosConfig.ts';
import type {FilteredTableRequest} from '@/dtos/request/base/FilteredTableRequest.ts';

export function useFetchFilteredTable<TTableResponse extends IMyResponse, TFilter extends IFilterRequest>(
	tableResponseClass: IMyResponse & { fromJson(json: any): TTableResponse },
	entityName: string,
) {
	const loading = ref(false)
	const error = ref<string | null>(null)

	async function fetchFilteredTable(request: FilteredTableRequest<TFilter>): Promise<{ items: TTableResponse[], itemsCount: number }> {
		loading.value = true
		error.value = null
		try {
			const response = await API.post(`/${entityName}/filtered-table`, request)
			return {items: response.data.items.map((r: any) => tableResponseClass.fromJson(r)), itemsCount: response.data.itemsCount}
		} catch (e: any) {
			error.value = e.message || `Failed to fetch filtered ${entityName} table`
			console.error(`Error fetching filtered ${entityName} table:`, e)
			throw e
		} finally {
			loading.value = false
		}
	}

	return {
		loading,
		error,
		fetchFilteredTable
	}
}
