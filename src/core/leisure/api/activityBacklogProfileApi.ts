import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { useFetchFilteredTable } from '@/_common/api/useFetchFilteredTable.ts'
import { ActivityBacklogProfile } from '@/core/leisure/dto/response/ActivityBacklogProfile.ts'
import { ActivityBacklogProfileRequest } from '@/core/leisure/dto/request/ActivityBacklogProfileRequest.ts'
import type { ActivityBacklogProfileFilter } from '@/core/leisure/dto/request/ActivityBacklogProfileFilter.ts'

export function useActivityBacklogProfileCrud() {
	const url = 'activity-backlog-profile'
	const { fetchById, fetchAll } = useEntityQuery<ActivityBacklogProfile>({
		responseClass: ActivityBacklogProfile,
		entityName: url,
	})
	const { create, createWithResponse, update, deleteEntity, batchDelete } = useEntityCommand<
		ActivityBacklogProfile,
		ActivityBacklogProfileRequest,
		ActivityBacklogProfileRequest
	>({
		responseClass: ActivityBacklogProfile,
		createRequestClass: ActivityBacklogProfileRequest,
		updateRequestClass: ActivityBacklogProfileRequest,
		entityName: url,
	})
	const { fetchFilteredTable } = useFetchFilteredTable<ActivityBacklogProfile, ActivityBacklogProfileFilter>({
		responseClass: ActivityBacklogProfile,
		entityName: url,
	})

	return { fetchById, fetchAll, create, createWithResponse, update, deleteEntity, batchDelete, fetchFilteredTable }
}
