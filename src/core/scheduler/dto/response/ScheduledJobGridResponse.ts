import { IdResponse } from '@/_common/dto/response/base/IdResponse.ts'
import type { JobStatus } from '../enum/JobStatus.ts'
import type { ScheduleType } from '../enum/ScheduleType.ts'
import type { RunOutcome } from '../enum/RunOutcome.ts'
import type { IntervalUnit } from '../enum/IntervalUnit.ts'

/** One row of the registered-jobs list. Carries everything the landing list needs to render. */
export class ScheduledJobGridResponse extends IdResponse {
	constructor(
		id: number,
		public jobKey: string,
		public description: string | null,
		public ownerModule: string,
		public handlerKey: string,
		public status: JobStatus,
		public scheduleType: ScheduleType,
		public cronExpression: string | null,
		public intervalValue: number | null,
		public intervalUnit: IntervalUnit | null,
		public lastRunAt: Date | null,
		public lastOutcome: RunOutcome | null,
		public nextRunAt: Date | null,
		// True when the handler code is no longer registered (owner module removed/renamed).
		public isOrphaned: boolean,
		// True when an active job is meaningfully past its due time (grace period already applied server-side).
		public isOverdue: boolean,
	) {
		super(id)
	}

	static fromJson(json: any): ScheduledJobGridResponse {
		return new ScheduledJobGridResponse(
			json.id,
			json.jobKey,
			json.description ?? null,
			json.ownerModule,
			json.handlerKey,
			json.status as JobStatus,
			json.scheduleType as ScheduleType,
			json.cronExpression ?? null,
			json.intervalValue ?? null,
			(json.intervalUnit ?? null) as IntervalUnit | null,
			json.lastRunAt ? new Date(json.lastRunAt) : null,
			(json.lastOutcome ?? null) as RunOutcome | null,
			json.nextRunAt ? new Date(json.nextRunAt) : null,
			json.isOrphaned ?? false,
			json.isOverdue ?? false,
		)
	}

	static listFromObjects(objects: any[]): ScheduledJobGridResponse[] {
		return (objects ?? []).map(o => ScheduledJobGridResponse.fromJson(o))
	}
}
