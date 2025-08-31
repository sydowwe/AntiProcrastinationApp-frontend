import {TimeObject} from '@/classes/TimeUtils';
import {HistoryRequest} from '@/classes/History';

export async function addActivityToHistory(startTimestamp: Date, activityLength: TimeObject, activityId: number) {
	return await API.post('/activity-history/create',
			new HistoryRequest(startTimestamp, activityLength, activityId))
		.then(() => {
			return true;
		})
		.catch((error) => {
			console.log(error);
			return false;
		});
}