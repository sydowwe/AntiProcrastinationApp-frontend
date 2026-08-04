import { IdResponse } from '@/_common/dto/response/base/IdResponse.ts'
import type { ReminderStatus } from '../enum/ReminderStatus.ts'
import type { ReminderScheduleType } from '../enum/ReminderScheduleType.ts'

/** One row of the reminder registry list. Carries everything the landing grid needs to render. */
export class ReminderDefinitionGridResponse extends IdResponse {
	constructor(
		id: number,
		public ownerModule: string,
		public subjectType: string,
		public subjectId: number,
		public kind: string,
		public scheduleType: ReminderScheduleType,
		public status: ReminderStatus,
		// When it will next fire — empty when paused/cancelled/completed.
		public nextOccurrenceAt: Date | null,
	) {
		super(id)
	}

	static fromJson(json: any): ReminderDefinitionGridResponse {
		return new ReminderDefinitionGridResponse(
			json.id,
			json.ownerModule,
			json.subjectType,
			json.subjectId,
			json.kind,
			json.scheduleType as ReminderScheduleType,
			json.status as ReminderStatus,
			json.nextOccurrenceAt ? new Date(json.nextOccurrenceAt) : null,
		)
	}

	static listFromObjects(objects: any[]): ReminderDefinitionGridResponse[] {
		return (objects ?? []).map(o => ReminderDefinitionGridResponse.fromJson(o))
	}
}
