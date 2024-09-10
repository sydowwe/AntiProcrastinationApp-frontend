import {TimeLengthObject} from '@/classes/TimeUtils';
import {HistoryRequest} from '@/classes/History';

export async function addActivityToHistory(startTimestamp: Date, activityLength: TimeLengthObject, activityId: number) {
	return await axios
		.post('/activity-history/create',
			new HistoryRequest(startTimestamp, activityLength, activityId))
		.then(() => {
			return true;
		})
		.catch((error) => {
			console.log(error);
			return false;
		});
}