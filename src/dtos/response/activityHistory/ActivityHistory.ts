import {Activity} from '../activity/Activity.ts';
import {Time} from '@/utils/Time.ts';

export class ActivityHistory {
	constructor(
		public id: number,
		public startTimestamp: Date,
		public length: Time,
		public activity: Activity,
	) {
	}

	static fromJson(object: any) {
		const {
			id = 0
		} = object;
		const startTimestamp = new Date(object.startTimestamp);
		const length = Time.fromJson(object.length);
		const activity = Activity.fromJson(object.activity);
		return new ActivityHistory(id, startTimestamp, length, activity);
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item));
	}
}
