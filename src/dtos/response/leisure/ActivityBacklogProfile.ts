import type { IIdResponse } from '@/dtos/response/interface/IIdResponse.ts'
import { ActivityInfo } from '@/dtos/response/leisure/ActivityInfo.ts'
import { EnergyLevel } from '@/dtos/enum/EnergyLevel.ts'
import type { EffortType } from '@/dtos/enum/EffortType.ts'
import { LookupResponse } from '@/dtos/response/general/LookupResponse.ts'

export class ActivityBacklogProfile implements IIdResponse {
	constructor(
		public activityId: number,
		public activity: ActivityInfo,
		public locationType: LookupResponse,
		public weatherDependency: LookupResponse,
		public energyLevel: EnergyLevel,
		public effortType: EffortType | null,
		public minParticipants: number,
		public maxParticipants: number | null,
		public expectedCostTier: LookupResponse,
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
			locationType = {},
			weatherDependency = {},
			energyLevel = EnergyLevel.Medium,
			effortType = null,
			minParticipants = 1,
			maxParticipants = null,
			expectedCostTier = {},
			durationMinutes = 0,
			isOneTime = false,
		} = object
		return new ActivityBacklogProfile(
			activityId,
			ActivityInfo.fromJson(activity),
			LookupResponse.fromJson(locationType),
			LookupResponse.fromJson(weatherDependency),
			energyLevel,
			effortType,
			minParticipants,
			maxParticipants,
			LookupResponse.fromJson(expectedCostTier),
			durationMinutes,
			isOneTime,
		)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => ActivityBacklogProfile.fromJson(item))
	}
}
