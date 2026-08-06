import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { Alarm } from '@/core/activityHistory/dto/response/Alarm.ts'
import { AlarmRequest } from '@/core/activityHistory/dto/request/AlarmRequest.ts'

export function useAlarmCrud() {
	const url = 'alarm'
	const { fetchById, fetchAll, fetchSelectOptions } = useEntityQuery<Alarm>({ responseClass: Alarm, entityName: url })
	const { createWithResponse, create, update, updateWithResponse, deleteEntity } = useEntityCommand<
		Alarm,
		AlarmRequest,
		AlarmRequest
	>({
		responseClass: Alarm,
		createRequestClass: AlarmRequest,
		updateRequestClass: AlarmRequest,
		entityName: url,
	})

	return {
		fetchById,
		fetchAll,
		fetchSelectOptions,
		createWithResponse,
		create,
		update,
		updateWithResponse,
		deleteEntity,
	}
}
