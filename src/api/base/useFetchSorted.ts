import type { IMyResponse } from '@/dtos/response/interface/IMyResponse.ts'
import { ref } from 'vue'
import type { SortRequest } from '@/dtos/request/base/SortRequest.ts'
import { API } from '@/plugins/axiosConfig.ts'

export function useFetchSorted<TResponse extends IMyResponse>(
	tableResponseClass: IMyResponse & { fromJson(json: any): TResponse },
	entityName: string,
) {
	const loading = ref(false)
	const error = ref<string | null>(null)

	async function fetchSorted(request: SortRequest): Promise<TResponse[]> {
		loading.value = true
		error.value = null
		try {
			const response = await API.post(`/${entityName}/sort`, request)
			return response.data.map((r: any) => tableResponseClass.fromJson(r))
		} catch (e: any) {
			error.value = e.message || `Failed to fetch sorted ${entityName}`
			console.error(`Error fetching sorted ${entityName}:`, e)
			throw e
		} finally {
			loading.value = false
		}
	}

	return {
		loading,
		error,
		fetchSorted,
	}
}