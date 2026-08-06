import { useEntityQuery } from '@/_common/api/useEntityQuery.ts'
import { useEntityCommand } from '@/_common/api/useEntityCommand.ts'
import { PomodoroTimerPreset } from '@/core/activityHistory/dto/response/PomodoroTimerPreset.ts'
import { PomodoroTimerPresetRequest } from '@/core/activityHistory/dto/request/PomodoroTimerPresetRequest.ts'

export function usePomodoroTimerPresetCrud() {
	const url = 'pomodoro-timer-preset'
	const { fetchById, fetchAll, fetchSelectOptions } = useEntityQuery<PomodoroTimerPreset>({
		responseClass: PomodoroTimerPreset,
		entityName: url,
	})
	const { createWithResponse, create, update, updateWithResponse, deleteEntity } = useEntityCommand<
		PomodoroTimerPreset,
		PomodoroTimerPresetRequest,
		PomodoroTimerPresetRequest
	>({
		responseClass: PomodoroTimerPreset,
		createRequestClass: PomodoroTimerPresetRequest,
		updateRequestClass: PomodoroTimerPresetRequest,
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
