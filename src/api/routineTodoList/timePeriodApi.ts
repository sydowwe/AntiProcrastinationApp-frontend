import { RoutineTimePeriodEntity } from '@/dtos/response/todoList/routine/RoutineTimePeriodEntity.ts'
import { useEntityQuery } from '@/api/base/useEntityQuery.ts'
import { useEntityCommand } from '@/api/base/useEntityCommand.ts'
import { TimePeriodRequest } from '@/dtos/request/activityRecording/TimePeriodRequest.ts'
import { API } from '@/plugins/axiosConfig.ts'

export function useRoutineTimePeriodCrud() {
	const url = 'routine-time-period'
	const { fetchById, fetchAll, fetchSelectOptions } = useEntityQuery<RoutineTimePeriodEntity>({
		responseClass: RoutineTimePeriodEntity,
		entityName: url,
	})
	const { createWithResponse, create, update, deleteEntity } = useEntityCommand<
		RoutineTimePeriodEntity,
		TimePeriodRequest,
		TimePeriodRequest
	>({
		responseClass: RoutineTimePeriodEntity,
		createRequestClass: TimePeriodRequest,
		updateRequestClass: TimePeriodRequest,
		entityName: url,
	})

	async function changeTimePeriodVisibility(id: number) {
		try {
			await API.patch(url + `/toggle-is-hidden`, { ids: [id] })
		} catch (e: any) {
			console.error(e)
		}
	}

	return {
		fetchById,
		fetchAll,
		fetchSelectOptions,
		createWithResponse,
		create,
		update,
		deleteEntity,
		changeTimePeriodVisibility,
	}
}
