import {Alarm} from '@/dtos/response/Alarm';

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
