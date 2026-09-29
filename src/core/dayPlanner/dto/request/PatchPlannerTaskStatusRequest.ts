import type { Time } from '@/_common/dto/dto/Time.ts'
import type { PlannerTaskStatus } from '@/core/dayPlanner/dto/enum/PlannerTaskStatus.ts'
import type { BuiltInSkipReason } from '@/core/dayPlanner/dto/enum/BuiltInSkipReason.ts'

export class PatchPlannerTaskStatusRequest {
	constructor(
		public status: PlannerTaskStatus,
		public actualStartTime: Time | null = null,
		public actualEndTime: Time | null = null,
		public skipReason: string | null = null,
		/** Only with `Cancelled`, and never beside a non-blank `skipReason` — either is a 400 (B1). */
		public skipReasonKey: BuiltInSkipReason | null = null,
	) {}
}
