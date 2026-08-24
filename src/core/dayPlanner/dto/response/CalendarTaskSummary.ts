import { Time } from '@/_common/dto/dto/Time.ts'

export class CalendarTaskSummary {
	constructor(
		public id: number,
		public startTime: Time,
		public endTime: Time,
		public isBackground: boolean,
		public color: string,
		public activityName: string,
	) {}

	static fromJson(json: any): CalendarTaskSummary {
		return new CalendarTaskSummary(
			json.id,
			Time.fromJson(json.startTime),
			Time.fromJson(json.endTime),
			json.isBackground,
			json.color,
			json.activityName,
		)
	}

	static listFromObjects(objects: any[]): CalendarTaskSummary[] {
		return objects.map((item: object) => this.fromJson(item))
	}
}
