import { useEntityQuery } from '@/api/base/useEntityQuery.ts'
import { useEntityCommand } from '@/api/base/useEntityCommand.ts'
import { useFetchFilteredTable } from '@/api/base/fetchFilteredTable.ts'
import { MemoryAnchor } from '@/dtos/response/leisure/MemoryAnchor.ts'
import { MemoryAnchorRequest } from '@/dtos/request/leisure/MemoryAnchorRequest.ts'
import type { MemoryAnchorFilter } from '@/dtos/request/leisure/MemoryAnchorFilter.ts'
import { SelectOption } from '@/dtos/response/general/SelectOption.ts'
import { API } from '@/_common/axiosConfig.ts'

export function useMemoryAnchorCrud() {
	const url = 'memory-anchor'
	const { fetchById, fetchAll } = useEntityQuery<MemoryAnchor>({
		responseClass: MemoryAnchor,
		entityName: url,
	})
	const { create, createWithResponse, update, deleteEntity, batchDelete } = useEntityCommand<
		MemoryAnchor,
		MemoryAnchorRequest,
		MemoryAnchorRequest
	>({
		responseClass: MemoryAnchor,
		createRequestClass: MemoryAnchorRequest,
		updateRequestClass: MemoryAnchorRequest,
		entityName: url,
	})
	const { fetchFilteredTable } = useFetchFilteredTable<MemoryAnchor, MemoryAnchorFilter>(MemoryAnchor, url)

	async function fetchAnchorEligibleActivities(): Promise<SelectOption[]> {
		const response = await API.get(`${url}/anchor-eligible-activities`)
		return SelectOption.listFromJsonList(response.data)
	}

	return {
		fetchById,
		fetchAll,
		create,
		createWithResponse,
		update,
		deleteEntity,
		batchDelete,
		fetchFilteredTable,
		fetchAnchorEligibleActivities,
	}
}
