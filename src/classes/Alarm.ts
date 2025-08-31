import {Activity} from "@/classes/Activity";

export class Alarm {
	constructor(
		public id: number,
		public startTimestamp: Date,
		public isActive: boolean,
		public activity: Activity
	) {
	}
	static fromJson(object: any) {
		const {
			id = 0,
			startTimestamp = "",
			isActive = false,
			activity = new Activity(),
		} = object;
		return new Alarm(
			id,
			new Date(startTimestamp),
			isActive,
			activity
		);
	}
	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => {
			return this.fromJson(item);
		});
	}
	static frontEndSortFunction() {
		return (a: Alarm, b: Alarm) => {
			return a.startTimestamp.valueOf() - b.startTimestamp.valueOf();
		};
	}
}

export class AlarmRequest {
	constructor(
		public startTimestamp: Date = new Date(),
		public isActive: boolean = false,
		public activityId: number | null = null,
	) {	}
	static fromEntity(alarm: Alarm) {
		return new AlarmRequest(
			alarm.startTimestamp,
			alarm.isActive,
			alarm.activity.id
		);
	}
}
