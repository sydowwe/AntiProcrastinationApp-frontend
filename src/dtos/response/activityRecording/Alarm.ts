import {Activity} from "@/dtos/response/activity/Activity.ts";

export class Alarm {
	constructor(
		public id: number,
		public startTimestamp: Date,
		public isActive: boolean,
		public activity: Activity
	) {
	}

	static fromJson(object: any) {
		return new Alarm(
			object.id,
			new Date(object.startTimestamp),
			object.isActive,
			Activity.fromJson(object.activity)
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
