import { useEntityQuery } from '@/api/base/useEntityQuery.ts'
import { useEntityCommand } from '@/api/base/useEntityCommand.ts'
import { useFetchFilteredTable } from '@/api/base/fetchFilteredTable.ts'
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
	const { fetchFilteredTable } = useFetchFilteredTable<ActivityProjectProfile, ActivityProjectProfileFilter>(
		ActivityProjectProfile,
		url,
	)

	return { fetchById, fetchAll, create, createWithResponse, update, deleteEntity, batchDelete, fetchFilteredTable }
}
