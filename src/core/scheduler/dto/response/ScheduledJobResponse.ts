import { IdResponse } from '@/_common/dto/response/base/IdResponse.ts'
import type { JobStatus } from '../enum/JobStatus.ts'
import type { ScheduleType } from '../enum/ScheduleType.ts'
import type { RunOutcome } from '../enum/RunOutcome.ts'
import type { IntervalUnit } from '../enum/IntervalUnit.ts'

/** Full detail of a single registered job. */
export class ScheduledJobResponse extends IdResponse {
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
		public isOrphaned: boolean,
		public isOverdue: boolean,
	) {
		super(id)
	}

	static listFromObjects(objects: any[]): ScheduledJobResponse[] {
		return objects.map(ScheduledJobResponse.fromJson)
	}

	static fromJson(json: any): ScheduledJobResponse {
		return new ScheduledJobResponse(
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
}
