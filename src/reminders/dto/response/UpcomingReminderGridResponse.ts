import { IdResponse } from '@/_common/dto/response/base/IdResponse.ts'
import type { ReminderStatus } from '../enum/ReminderStatus.ts'
import type { ReminderScheduleType } from '../enum/ReminderScheduleType.ts'
import type { IntervalPreset } from '../enum/IntervalPreset.ts'

/**
 * One row of the upcoming-reminders list (admin or personal). The `id` is the reminder id; the row shows
 * the reminder's single soonest pending occurrence (`nextOccurrence`) — not every future occurrence of a
 * recurring reminder. There is no PII here: areas, kinds, subject refs, instants and ids only.
 */
export class UpcomingReminderGridResponse extends IdResponse {
	constructor(
		id: number,
		public ownerModule: string,
		public subjectType: string | null,
		// Reference to the subject the reminder is about (e.g. an employee id) — rendered as a bare ref, no name.
		public subjectId: number | null,
		public kind: string,
		public status: ReminderStatus,
		public scheduleType: ReminderScheduleType,
		// Recurring interval preset (when scheduleType is RecurringInterval).
		public intervalPreset: IntervalPreset | null,
		// Cron expression (when scheduleType is RecurringCron).
		public cronExpression: string | null,
		// True for a one-shot deadline that also nudges at lead-time offsets (e.g. 30 days / 1 day before).
		public hasLeadOffsets: boolean,
		// The soonest pending occurrence instant — the row keys off this.
		public nextOccurrence: Date | null,
		// How many recipients the reminder currently resolves to (admin view only; 0 on the personal view).
		public recipientCount: number,
	) {
		super(id)
	}

	static fromJson(json: any): UpcomingReminderGridResponse {
		return new UpcomingReminderGridResponse(
			json.id,
			json.ownerModule,
			json.subjectType ?? null,
			json.subjectId ?? null,
			json.kind,
			json.status as ReminderStatus,
			json.scheduleType as ReminderScheduleType,
			(json.intervalPreset ?? null) as IntervalPreset | null,
			json.cronExpression ?? null,
			json.hasLeadOffsets ?? false,
			json.nextOccurrence ? new Date(json.nextOccurrence) : null,
			json.recipientCount ?? 0,
		)
	}

	static listFromObjects(objects: any[]): UpcomingReminderGridResponse[] {
		return (objects ?? []).map(o => UpcomingReminderGridResponse.fromJson(o))
	}
}
