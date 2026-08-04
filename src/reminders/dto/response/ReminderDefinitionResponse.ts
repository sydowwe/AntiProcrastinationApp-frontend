import { IdResponse } from '@/_common/dto/response/base/IdResponse.ts'
import type { ReminderStatus } from '../enum/ReminderStatus.ts'
import type { ReminderScheduleType } from '../enum/ReminderScheduleType.ts'
import type { IntervalPreset } from '../enum/IntervalPreset.ts'

/** Full detail of a single registered reminder (the inspector). */
export class ReminderDefinitionResponse extends IdResponse {
	constructor(
		id: number,
		// --- key ---
		public ownerModule: string,
		public subjectType: string,
		public subjectId: number,
		public kind: string,
		// --- lifecycle ---
		public status: ReminderStatus,
		public nextOccurrenceAt: Date | null,
		public lastOccurrenceAt: Date | null,
		public completedAt: Date | null,
		// --- schedule (fields are conditional on scheduleType) ---
		public scheduleType: ReminderScheduleType,
		// One-shot:
		public dueAt: Date | null,
		// Lead-time offsets in minutes (negative = before the deadline, 0 = at it).
		public leadOffsetMinutes: number[],
		// Recurring interval:
		public intervalPreset: IntervalPreset | null,
		public anchorDate: Date | null,
		// Recurring cron:
		public cronExpression: string | null,
		// Shared optional end for both recurring types:
		public endDate: Date | null,
		// --- recipients (exactly one of these is meaningful) ---
		public recipientUserIds: number[] | null,
		public resolverKey: string | null,
		// --- content ---
		public templateKey: string | null,
		public notificationType: string | null,
		public payload: unknown,
		// --- optional dispatch-policy hints ---
		public digestKey: string | null,
		public preferredChannel: string | null,
	) {
		super(id)
	}

	static fromJson(json: any): ReminderDefinitionResponse {
		return new ReminderDefinitionResponse(
			json.id,
			json.ownerModule,
			json.subjectType,
			json.subjectId,
			json.kind,
			json.status as ReminderStatus,
			json.nextOccurrenceAt ? new Date(json.nextOccurrenceAt) : null,
			json.lastOccurrenceAt ? new Date(json.lastOccurrenceAt) : null,
			json.completedAt ? new Date(json.completedAt) : null,
			json.scheduleType as ReminderScheduleType,
			json.dueAt ? new Date(json.dueAt) : null,
			json.leadOffsetMinutes ?? [],
			(json.intervalPreset ?? null) as IntervalPreset | null,
			json.anchorDate ? new Date(json.anchorDate) : null,
			json.cronExpression ?? null,
			json.endDate ? new Date(json.endDate) : null,
			json.recipientUserIds ?? null,
			json.resolverKey ?? null,
			json.templateKey ?? null,
			json.notificationType ?? null,
			json.payload ?? null,
			json.digestKey ?? null,
			json.preferredChannel ?? null,
		)
	}
}
