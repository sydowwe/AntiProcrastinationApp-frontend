import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { useFetchFilteredTable } from '@/_common/api/useFetchFilteredTable.ts'
import { ActivityProjectProfile } from '@/core/leisure/dto/response/ActivityProjectProfile.ts'
import { ActivityProjectProfileRequest } from '@/core/leisure/dto/request/ActivityProjectProfileRequest.ts'
import type { ActivityProjectProfileFilter } from '@/core/leisure/dto/request/ActivityProjectProfileFilter.ts'

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
