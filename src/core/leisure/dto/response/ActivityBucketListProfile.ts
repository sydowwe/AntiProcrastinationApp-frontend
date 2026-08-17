import type { IIdResponse } from '@/_common/dto/response/interface/IIdResponse.ts'
import { ActivityInfo } from '@/core/leisure/dto/response/ActivityInfo.ts'
import { LookupResponse } from '@/_common/dto/response/general/LookupResponse.ts'

export class ActivityBucketListProfile implements IIdResponse {
	constructor(
		public activityId: number,
		public activity: ActivityInfo,
		public experienceType: LookupResponse,
		public comfortZoneStep: number,
		public requiresTravel: boolean,
		public financialGoal: number | null,
		public inspirationSource: string,
		// Completion, i.e. "this experience has been had and anchored". `null` means the API does not
		// carry the field yet (see prompts/leisure/backend/B1-backend.md) — every completion affordance
		// treats null as "unknown" and stays out of the way rather than claiming the item is undone.
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
			experienceType = {},
			comfortZoneStep = 1,
			requiresTravel = false,
			financialGoal = null,
			inspirationSource = '',
			isAnchored = null,
			memoryAnchorId = null,
		} = object
		return new ActivityBucketListProfile(
			activityId,
			ActivityInfo.fromJson(activity),
			LookupResponse.fromJson(experienceType),
			comfortZoneStep,
			requiresTravel,
			financialGoal,
			inspirationSource,
			isAnchored,
			memoryAnchorId,
		)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => ActivityBucketListProfile.fromJson(item))
	}
}
