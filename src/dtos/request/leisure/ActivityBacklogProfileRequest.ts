import { LocationType } from '@/dtos/enum/LocationType.ts'
import { WeatherDependency } from '@/dtos/enum/WeatherDependency.ts'
import { EnergyLevel } from '@/dtos/enum/EnergyLevel.ts'
import type { EffortType } from '@/dtos/enum/EffortType.ts'
import { ExpectedCostTier } from '@/dtos/enum/ExpectedCostTier.ts'

export class ActivityBacklogProfileRequest {
	constructor(
		public activityId: number = 0,
		public locationType: LocationType = LocationType.Any,
		public weatherDependency: WeatherDependency = WeatherDependency.None,
		public energyLevel: EnergyLevel = EnergyLevel.Medium,
		public effortType: EffortType | null = null,
		public minParticipants: number = 1,
		public maxParticipants: number | null = null,
		public expectedCostTier: ExpectedCostTier = ExpectedCostTier.Free,
		public durationMinutes: number = 60,
		public isOneTime: boolean = false,
	) {}

	static fromJson(object: any) {
		const {
			activityId = 0,
			locationType = LocationType.Any,
			weatherDependency = WeatherDependency.None,
			energyLevel = EnergyLevel.Medium,
			effortType = null,
			minParticipants = 1,
			maxParticipants = null,
			expectedCostTier = ExpectedCostTier.Free,
			durationMinutes = 60,
			isOneTime = false,
		} = object
		return new ActivityBacklogProfileRequest(
			activityId,
			locationType,
			weatherDependency,
			energyLevel,
			effortType,
			minParticipants,
			maxParticipants,
			expectedCostTier,
			durationMinutes,
			isOneTime,
		)
	}
}
