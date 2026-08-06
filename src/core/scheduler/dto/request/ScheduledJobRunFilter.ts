import type { IFilterRequest } from '@/_common/dto/request/interface/IFilterRequest.ts'
import type { RunOutcome } from '../enum/RunOutcome.ts'
import type { TriggerSource } from '../enum/TriggerSource.ts'

export class ScheduledJobRunFilter implements IFilterRequest {
	constructor(
		// Scopes the run log to one job. Always set in the job-detail run history; the run log is never
		// browsed globally without a job context.
		public jobId: number | null = null,
		public outcome: RunOutcome | null = null,
		public triggerSource: TriggerSource | null = null,
		public startedFrom: Date | null = null,
		public startedTo: Date | null = null,
	) {}
}
