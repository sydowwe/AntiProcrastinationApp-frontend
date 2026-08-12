import { Time } from '@/_common/dto/dto/Time.ts'

export class ActivityLoggedTimeAggregate {
	constructor(
		public activityId: number,
		public totalSeconds: number,
		public entryCount: number,
	) {}

	get averageTime(): Time {
		return Time.fromSeconds(this.entryCount > 0 ? Math.round(this.totalSeconds / this.entryCount) : 0)
	}

	static fromJson(json: any) {
		return new ActivityLoggedTimeAggregate(json.activityId, json.totalSeconds, json.entryCount)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item))
	}
}
