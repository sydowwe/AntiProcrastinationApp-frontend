import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { useFetchFilteredTable } from '@/_common/api/useFetchFilteredTable.ts'
import { ActivityBacklogProfile } from '@/dtos/response/leisure/ActivityBacklogProfile.ts'
import { ActivityBacklogProfileRequest } from '@/dtos/request/leisure/ActivityBacklogProfileRequest.ts'
import type { ActivityBacklogProfileFilter } from '@/dtos/request/leisure/ActivityBacklogProfileFilter.ts'

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
