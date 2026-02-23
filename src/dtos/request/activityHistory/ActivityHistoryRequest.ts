import {Time} from '@/utils/Time.ts';
import {TimePrecise} from '@/utils/TimePrecise.ts';

export class ActivityHistoryRequest {
	constructor(
		public startTimestamp: Date,
		public length: Time,
		public activityId: number,
	) {
	}

	static fromJson(object: any) {
		const {
			startTimestamp = new Date(),
			length = new TimePrecise(),
			activityId = 0
		} = object;
		return new ActivityHistoryRequest(startTimestamp, length, activityId);
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item));
	}
}

