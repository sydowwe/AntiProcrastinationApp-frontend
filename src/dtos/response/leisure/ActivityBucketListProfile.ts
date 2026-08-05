import type { IIdResponse } from '@/_common/dto/response/interface/IIdResponse.ts'
import { ActivityInfo } from '@/dtos/response/leisure/ActivityInfo.ts'
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
		} = object
		return new ActivityBucketListProfile(
			activityId,
			ActivityInfo.fromJson(activity),
			LookupResponse.fromJson(experienceType),
			comfortZoneStep,
			requiresTravel,
			financialGoal,
			inspirationSource,
		)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => ActivityBucketListProfile.fromJson(item))
	}
}
