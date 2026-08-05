import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { useFetchFilteredTable } from '@/_common/api/useFetchFilteredTable.ts'
import { ActivityProjectProfile } from '@/dtos/response/leisure/ActivityProjectProfile.ts'
import { ActivityProjectProfileRequest } from '@/dtos/request/leisure/ActivityProjectProfileRequest.ts'
import type { ActivityProjectProfileFilter } from '@/dtos/request/leisure/ActivityProjectProfileFilter.ts'

export function useActivityProjectProfileCrud() {
	const url = 'activity-project-profile'
	const { fetchById, fetchAll } = useEntityQuery<ActivityProjectProfile>({
		responseClass: ActivityProjectProfile,
		entityName: url,
	})
	const { create, createWithResponse, update, deleteEntity, batchDelete } = useEntityCommand<
		ActivityProjectProfile,
		ActivityProjectProfileRequest,
		ActivityProjectProfileRequest
	>({
		responseClass: ActivityProjectProfile,
		createRequestClass: ActivityProjectProfileRequest,
		updateRequestClass: ActivityProjectProfileRequest,
		entityName: url,
	})
	const { fetchFilteredTable } = useFetchFilteredTable<ActivityProjectProfile, ActivityProjectProfileFilter>({
		responseClass: ActivityProjectProfile,
		entityName: url,
	})

	return { fetchById, fetchAll, create, createWithResponse, update, deleteEntity, batchDelete, fetchFilteredTable }
}
