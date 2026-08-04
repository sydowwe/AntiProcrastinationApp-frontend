import type { IFilterRequest } from '@/_common/dto/request/interface/IFilterRequest.ts'
import type { ReminderStatus } from '../enum/ReminderStatus.ts'
import type { ReminderScheduleType } from '../enum/ReminderScheduleType.ts'

export class ReminderDefinitionFilter implements IFilterRequest {
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
