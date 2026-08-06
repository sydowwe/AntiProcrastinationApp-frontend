import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { useFetchFilteredTable } from '@/_common/api/useFetchFilteredTable.ts'
import { MemoryAnchor } from '@/core/leisure/dto/response/MemoryAnchor.ts'
import { MemoryAnchorRequest } from '@/core/leisure/dto/request/MemoryAnchorRequest.ts'
import type { MemoryAnchorFilter } from '@/core/leisure/dto/request/MemoryAnchorFilter.ts'
import { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'
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
	const { fetchFilteredTable } = useFetchFilteredTable<MemoryAnchor, MemoryAnchorFilter>({
		responseClass: MemoryAnchor,
		entityName: url,
	})

	async function fetchAnchorEligibleActivities(): Promise<SelectOption[]> {
		const response = await API.get(`${url}/anchor-eligible-activities`)
		return SelectOption.listFromObjects(response.data)
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
