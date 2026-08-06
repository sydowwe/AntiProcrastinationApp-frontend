import { EnergyLevel } from '@/core/leisure/dto/enum/EnergyLevel.ts'
import type { EffortType } from '@/core/leisure/dto/enum/EffortType.ts'

export class ActivityBacklogProfileRequest {
	constructor(
		public activityId: number = 0,
		public locationTypeId: number = 0,
		public weatherDependencyId: number = 0,
		public energyLevel: EnergyLevel = EnergyLevel.Medium,
		public effortType: EffortType | null = null,
		public minParticipants: number = 1,
		public maxParticipants: number | null = null,
		public expectedCostTierId: number = 0,
		public durationMinutes: number = 60,
		public isOneTime: boolean = false,
	) {}

	static fromJson(object: any) {
		const {
			activityId = 0,
			locationTypeId = 0,
			weatherDependencyId = 0,
			energyLevel = EnergyLevel.Medium,
			effortType = null,
			minParticipants = 1,
			maxParticipants = null,
			expectedCostTierId = 0,
			durationMinutes = 60,
			isOneTime = false,
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
			isOneTime,
		)
	}
}
