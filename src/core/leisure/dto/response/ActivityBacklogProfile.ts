import type { IIdResponse } from '@/_common/dto/response/interface/IIdResponse.ts'
import { ActivityInfo } from '@/core/leisure/dto/response/ActivityInfo.ts'
import { EnergyLevel } from '@/core/leisure/dto/enum/EnergyLevel.ts'
import type { EffortType } from '@/core/leisure/dto/enum/EffortType.ts'
import { LookupResponse } from '@/_common/dto/response/general/LookupResponse.ts'

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
		// Only meaningful while `isOneTime` — a repeatable activity is never "done". `null` means the
		// API does not carry the field yet (see prompts/leisure/backend/B1-backend.md).
		public isAnchored: boolean | null,
		public memoryAnchorId: number | null,
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
			isAnchored = null,
			memoryAnchorId = null,
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
			isAnchored,
			memoryAnchorId,
		)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => ActivityBacklogProfile.fromJson(item))
	}
}
