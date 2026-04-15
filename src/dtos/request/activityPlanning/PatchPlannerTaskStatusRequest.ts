import type { Time } from '@/dtos/dto/Time.ts'
import type { PlannerTaskStatus } from '@/dtos/enum/PlannerTaskStatus.ts'

export class PatchPlannerTaskStatusRequest {
	constructor(
		public status: PlannerTaskStatus,
		public actualStartTime: Time | null = null,
		public actualEndTime: Time | null = null,
		public skipReason: string | null = null,
	) {}
}
