import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { TimerPreset } from '@/dtos/response/activityRecording/TimerPreset.ts'
import { TimerPresetRequest } from '@/dtos/request/activityRecording/TimerPresetRequest.ts'

export function useTimerPresetCrud() {
	const url = 'timer-preset'
	const { fetchById, fetchAll, fetchSelectOptions } = useEntityQuery<TimerPreset>({
		responseClass: TimerPreset,
		entityName: url,
	})
	const { createWithResponse, create, update, updateWithResponse, deleteEntity } = useEntityCommand<
		TimerPreset,
		TimerPresetRequest,
		TimerPresetRequest
	>({
		responseClass: TimerPreset,
		createRequestClass: TimerPresetRequest,
		updateRequestClass: TimerPresetRequest,
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
