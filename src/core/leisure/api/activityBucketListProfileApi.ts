import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { useFetchFilteredTable } from '@/_common/api/useFetchFilteredTable.ts'
import { ActivityBucketListProfile } from '@/core/leisure/dto/response/ActivityBucketListProfile.ts'
import { ActivityBucketListProfileRequest } from '@/core/leisure/dto/request/ActivityBucketListProfileRequest.ts'
import type { ActivityBucketListProfileFilter } from '@/core/leisure/dto/request/ActivityBucketListProfileFilter.ts'

export function useActivityBucketListProfileCrud() {
	const url = 'activity-bucket-list-profile'
	const { fetchById, fetchAll } = useEntityQuery<ActivityBucketListProfile>({
		responseClass: ActivityBucketListProfile,
		entityName: url,
	})
	const { create, createWithResponse, update, deleteEntity, batchDelete } = useEntityCommand<
		ActivityBucketListProfile,
		ActivityBucketListProfileRequest,
		ActivityBucketListProfileRequest
	>({
		responseClass: ActivityBucketListProfile,
		createRequestClass: ActivityBucketListProfileRequest,
		updateRequestClass: ActivityBucketListProfileRequest,
		entityName: url,
	})
	const { fetchFilteredTable } = useFetchFilteredTable<ActivityBucketListProfile, ActivityBucketListProfileFilter>({
		responseClass: ActivityBucketListProfile,
		entityName: url,
	})

	return { fetchById, fetchAll, create, createWithResponse, update, deleteEntity, batchDelete, fetchFilteredTable }
}
