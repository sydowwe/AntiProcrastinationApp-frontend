import { EnergyLevel } from '@/core/leisure/dto/enum/EnergyLevel.ts'
import type { EffortType } from '@/core/leisure/dto/enum/EffortType.ts'

/**
 * The four lookup ids default to `null`, not `0`: a select cannot resolve `0` against any option and
 * renders the literal "0", and `requiredRule` accepts `0` — so the form used to submit an unpicked
 * field and let the server answer 400 "Activity not found." (`_fix-queue.md` F63).
 */
export class ActivityBacklogProfileRequest {
	constructor(
		public activityId: number | null = null,
		public locationTypeId: number | null = null,
		public weatherDependencyId: number | null = null,
		public energyLevel: EnergyLevel = EnergyLevel.Medium,
		public effortType: EffortType | null = null,
		public minParticipants: number = 1,
		public maxParticipants: number | null = null,
		public expectedCostTierId: number | null = null,
		public durationMinutes: number = 60,
		/**
		 * `isRepeatable` is the entity's column and the one name both sides use. It used to be `isOneTime`
		 * here, which `POST`/`PUT activity-backlog-profile` does not bind — so `IsRepeatable` stayed at its
		 * `bool` default and every entry saved as one-time whatever the checkbox said.
		 */
		public isRepeatable: boolean = false,
	) {}

	static fromJson(object: any) {
		const {
			activityId = null,
			locationTypeId = null,
			weatherDependencyId = null,
			energyLevel = EnergyLevel.Medium,
			effortType = null,
			minParticipants = 1,
			maxParticipants = null,
			expectedCostTierId = null,
			durationMinutes = 60,
			isRepeatable = false,
		} = object
		return new ActivityBacklogProfileRequest(
			activityId,
			locationTypeId,
			weatherDependencyId,
			energyLevel,
			effortType,
			minParticipants,
			maxParticipants,
			expectedCostTierId,
			durationMinutes,
			isRepeatable,
		)
	}
}
