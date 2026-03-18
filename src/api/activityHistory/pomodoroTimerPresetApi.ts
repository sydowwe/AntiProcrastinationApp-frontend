import {useEntityQuery} from '@/api/base/useEntityQuery.ts';
import {useEntityCommand} from '@/api/base/useEntityCommand.ts';
import {PomodoroTimerPreset} from '@/dtos/response/activityRecording/PomodoroTimerPreset.ts';
import {PomodoroTimerPresetRequest} from '@/dtos/request/activityRecording/PomodoroTimerPresetRequest.ts';

export function usePomodoroTimerPresetCrud() {
	const url = 'pomodoro-timer-preset';
	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<PomodoroTimerPreset>({responseClass: PomodoroTimerPreset, entityName: url})
	const {
		createWithResponse,
		create,
		update,
		updateWithResponse,
		deleteEntity
	} = useEntityCommand<PomodoroTimerPreset, PomodoroTimerPresetRequest, PomodoroTimerPresetRequest>({
		responseClass: PomodoroTimerPreset,
		createRequestClass: PomodoroTimerPresetRequest,
		updateRequestClass: PomodoroTimerPresetRequest,
		entityName: url
	})

	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, updateWithResponse, deleteEntity}
}
