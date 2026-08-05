import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { Role } from '@/dtos/response/activity/Role.ts'
import { RoleRequest } from '@/dtos/request/activity/RoleRequest.ts'

export function useActivityRoleCrud() {
	const url = 'activity-role'
	const { fetchById, fetchAll } = useEntityQuery<Role>({ responseClass: Role, entityName: url })
	const { createWithResponse, create, update, deleteEntity } = useEntityCommand<Role, RoleRequest, RoleRequest>({
		responseClass: Role,
		createRequestClass: RoleRequest,
		updateRequestClass: RoleRequest,
		entityName: url,
	})

	return { fetchById, fetchAll, createWithResponse, create, update, deleteEntity }
}
