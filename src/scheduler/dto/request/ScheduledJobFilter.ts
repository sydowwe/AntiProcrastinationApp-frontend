import type { IFilterRequest } from '@/_common/dto/request/interface/IFilterRequest.ts'
import type { JobStatus } from '../enum/JobStatus.ts'
import type { ScheduleType } from '../enum/ScheduleType.ts'
import type { RunOutcome } from '../enum/RunOutcome.ts'

export class ScheduledJobFilter implements IFilterRequest {
	constructor(
		public ownerModule: string | null = null,
		public handlerKey: string | null = null,
		public status: JobStatus | null = null,
		public scheduleType: ScheduleType | null = null,
		public lastOutcome: RunOutcome | null = null,
		public nextRunFrom: Date | null = null,
		public nextRunTo: Date | null = null,
		public onlyOverdue: boolean | null = null,
	) {}
}
