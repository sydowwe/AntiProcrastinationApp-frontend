import { IdResponse } from '@/_common/dto/response/base/IdResponse.ts'
import type { RunOutcome } from '../enum/RunOutcome.ts'
import type { TriggerSource } from '../enum/TriggerSource.ts'

/** One row of a job's run history (append-only run log), newest first. */
export class ScheduledJobRunGridResponse extends IdResponse {
	constructor(
		id: number,
		public jobId: number,
		public startedAt: Date,
		public durationSeconds: number,
		public outcome: RunOutcome,
		public triggerSource: TriggerSource,
		public errorSummary: string | null,
	) {
		super(id)
	}

	static fromJson(json: any): ScheduledJobRunGridResponse {
		return new ScheduledJobRunGridResponse(
			json.id,
			json.jobId,
			new Date(json.startedAt),
			json.durationSeconds ?? 0,
			json.outcome as RunOutcome,
			json.triggerSource as TriggerSource,
			json.errorSummary ?? null,
		)
	}

	static listFromObjects(objects: any[]): ScheduledJobRunGridResponse[] {
		return (objects ?? []).map(o => ScheduledJobRunGridResponse.fromJson(o))
	}
}
