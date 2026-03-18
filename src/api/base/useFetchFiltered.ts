import {ref} from 'vue'
import {API} from '@/plugins/axiosConfig.ts';
import type {IMyResponse} from '@/dtos/response/interface/IMyResponse.ts';
import type {IFilterRequest} from '@/dtos/request/interface/IFilterRequest.ts';

export function useFetchFiltered<TResponse extends IMyResponse, TFilter extends IFilterRequest>(
	tableResponseClass: IMyResponse & { fromJson(json: any): TResponse },
	entityName: string,
) {
	const loading = ref(false)
	const error = ref<string | null>(null)

	async function fetchFiltered(filter: TFilter): Promise<TResponse[]> {
		loading.value = true
		error.value = null
		try {
			const response = await API.post(`/${entityName}/filter`, filter)
			return response.data.map((r: any) => tableResponseClass.fromJson(r))
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
		fetchFiltered
	}
}
