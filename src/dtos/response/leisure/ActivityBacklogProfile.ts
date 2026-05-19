import type { IIdResponse } from '@/dtos/response/interface/IIdResponse.ts'
import { ActivityInfo } from '@/dtos/response/leisure/ActivityInfo.ts'
import { LocationType } from '@/dtos/enum/LocationType.ts'
import { WeatherDependency } from '@/dtos/enum/WeatherDependency.ts'
import { EnergyLevel } from '@/dtos/enum/EnergyLevel.ts'
import type { EffortType } from '@/dtos/enum/EffortType.ts'
import { ExpectedCostTier } from '@/dtos/enum/ExpectedCostTier.ts'

export class ActivityBacklogProfile implements IIdResponse {
	constructor(
		public activityId: number,
		public activity: ActivityInfo,
		public locationType: LocationType,
		public weatherDependency: WeatherDependency,
		public energyLevel: EnergyLevel,
		public effortType: EffortType | null,
		public minParticipants: number,
		public maxParticipants: number | null,
		public expectedCostTier: ExpectedCostTier,
		public durationMinutes: number,
		public isOneTime: boolean,
	) {}

	get id(): number {
		return this.activityId
	}

	static fromJson(object: any) {
		const {
			activityId = 0,
			activity = {},
			locationType = LocationType.Any,
			weatherDependency = WeatherDependency.None,
			energyLevel = EnergyLevel.Medium,
			effortType = null,
			minParticipants = 1,
			maxParticipants = null,
			expectedCostTier = ExpectedCostTier.Free,
			durationMinutes = 0,
			isOneTime = false,
		} = object
		return new ActivityBacklogProfile(
			activityId,
			ActivityInfo.fromJson(activity),
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

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => ActivityBacklogProfile.fromJson(item))
	}
}
