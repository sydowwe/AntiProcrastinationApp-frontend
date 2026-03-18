import {useEntityQuery} from '@/api/base/useEntityQuery.ts';
import {useEntityCommand} from '@/api/base/useEntityCommand.ts';
import {Alarm} from '@/dtos/response/activityRecording/Alarm.ts';
import {AlarmRequest} from '@/dtos/request/activityRecording/AlarmRequest.ts';

export function useAlarmCrud() {
	const url = 'alarm';
	const {fetchById, fetchAll, fetchSelectOptions} = useEntityQuery<Alarm>({responseClass: Alarm, entityName: url})
	const {
		createWithResponse,
		create,
		update,
		updateWithResponse,
		deleteEntity
	} = useEntityCommand<Alarm, AlarmRequest, AlarmRequest>({
		responseClass: Alarm,
		createRequestClass: AlarmRequest,
		updateRequestClass: AlarmRequest,
		entityName: url
	})

	return {fetchById, fetchAll, fetchSelectOptions, createWithResponse, create, update, updateWithResponse, deleteEntity}
}
