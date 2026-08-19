import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { Role } from '@/core/activity/dto/response/Role.ts'
import { RoleRequest } from '@/core/activity/dto/request/RoleRequest.ts'
import { invalidatingActivityOptions, useActivityOptionsStore } from '@/core/activity/store/activityOptionsStore.ts'

export function useActivityRoleCrud() {
	const url = 'activity-role'
	const { fetchById, fetchAll } = useEntityQuery<Role>({ responseClass: Role, entityName: url })
	const { createWithResponse, create, update, deleteEntity } = useEntityCommand<Role, RoleRequest, RoleRequest>({
		responseClass: Role,
		createRequestClass: RoleRequest,
		updateRequestClass: RoleRequest,
		entityName: url,
	})

	return {
		fetchById,
		fetchAll,
		/** Cached and shared — see `activityOptionsStore`. */
		fetchSelectOptions: () => useActivityOptionsStore().ensureOptions('role'),
		createWithResponse: invalidatingActivityOptions('role', createWithResponse),
		create: invalidatingActivityOptions('role', create),
		update: invalidatingActivityOptions('role', update),
		deleteEntity: invalidatingActivityOptions('role', deleteEntity),
	}
}
