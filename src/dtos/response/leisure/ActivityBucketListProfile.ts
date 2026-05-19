import type { IIdResponse } from '@/dtos/response/interface/IIdResponse.ts'
import { ActivityInfo } from '@/dtos/response/leisure/ActivityInfo.ts'
import { ExperienceType } from '@/dtos/enum/ExperienceType.ts'

export class ActivityBucketListProfile implements IIdResponse {
	constructor(
		public activityId: number,
		public activity: ActivityInfo,
		public experienceType: ExperienceType,
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
			experienceType = ExperienceType.Skill,
			comfortZoneStep = 1,
			requiresTravel = false,
			financialGoal = null,
			inspirationSource = '',
		} = object
		return new ActivityBucketListProfile(
			activityId,
			ActivityInfo.fromJson(activity),
			experienceType,
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
