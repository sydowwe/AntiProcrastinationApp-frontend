import type { IFilterRequest } from '@/_common/dto/request/interface/IFilterRequest.ts'
import type { ReminderStatus } from '../enum/ReminderStatus.ts'
import type { ReminderScheduleType } from '../enum/ReminderScheduleType.ts'

/** Admin "browse upcoming reminders (all areas)" filter. Each row is one reminder at its soonest occurrence. */
export class UpcomingReminderFilter implements IFilterRequest {
	constructor(
		public ownerModule: string | null = null,
		public subjectType: string | null = null,
		public kind: string | null = null,
		// Filters to reminders this user is a recipient of (explicit or strategy-resolved).
		public recipientUserId: number | null = null,
		public status: ReminderStatus | null = null,
		public scheduleType: ReminderScheduleType | null = null,
		public nextOccurrenceFrom: Date | null = null,
		public nextOccurrenceTo: Date | null = null,
	) {}
}
