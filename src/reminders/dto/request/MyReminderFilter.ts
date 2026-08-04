import type { IFilterRequest } from '@/_common/dto/request/interface/IFilterRequest.ts'
import type { ReminderStatus } from '../enum/ReminderStatus.ts'
import type { ReminderScheduleType } from '../enum/ReminderScheduleType.ts'

/**
 * Personal "my upcoming reminders" filter. Same shape as the admin upcoming filter minus the recipient
 * axis — the server always scopes results to the caller, so there is deliberately no cross-user control.
 */
export class MyReminderFilter implements IFilterRequest {
	constructor(
		public ownerModule: string | null = null,
		public subjectType: string | null = null,
		public kind: string | null = null,
		public status: ReminderStatus | null = null,
		public scheduleType: ReminderScheduleType | null = null,
		public nextOccurrenceFrom: Date | null = null,
		public nextOccurrenceTo: Date | null = null,
	) {}
}
