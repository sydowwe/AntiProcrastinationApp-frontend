import { Activity } from '@/core/activity/dto/response/Activity.ts'
import { Time } from '@/_common/dto/dto/Time.ts'
import { convertToEnum } from '@/_common/utils/enumHelpers.ts'
import { TimerSessionPhase } from '@/core/activityHistory/dto/enum/TimerSessionPhase.ts'
import { ActivityHistorySession } from '@/core/activityHistory/dto/response/ActivityHistorySession.ts'

export class ActivityHistory {
	constructor(
		public id: number,
		public startTimestamp: Date,
		public length: Time,
		public activity: Activity,
		/** Null outside a session and on a countdown's single row. */
		public phase: TimerSessionPhase | null = null,
		/** Null for every row written outside a timer session — every row from before sessions existed included. */
		public session: ActivityHistorySession | null = null,
	) {}

	static fromJson(object: any) {
		const { id = 0, phase = null, session = null } = object
		const startTimestamp = new Date(object.startTimestamp)
		const length = Time.fromJson(object.length)
		const activity = Activity.fromJson(object.activity)
		return new ActivityHistory(
			id,
			startTimestamp,
			length,
			activity,
			phase === null ? null : (convertToEnum(TimerSessionPhase, phase) ?? null),
			session === null ? null : ActivityHistorySession.fromJson(session),
		)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => this.fromJson(item))
	}
}
