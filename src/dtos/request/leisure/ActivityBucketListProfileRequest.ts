import { ExperienceType } from '@/dtos/enum/ExperienceType.ts'

export class ActivityBucketListProfileRequest {
	constructor(
		public activityId: number = 0,
		public experienceType: ExperienceType = ExperienceType.Skill,
		public comfortZoneStep: number = 1,
		public requiresTravel: boolean = false,
		public financialGoal: number | null = null,
		public inspirationSource: string = '',
	) {}

	static fromJson(object: any) {
		const {
			activityId = 0,
			experienceType = ExperienceType.Skill,
			comfortZoneStep = 1,
			requiresTravel = false,
			financialGoal = null,
			inspirationSource = '',
		} = object
		return new ActivityBucketListProfileRequest(
			activityId,
			experienceType,
			comfortZoneStep,
			requiresTravel,
			financialGoal,
			inspirationSource,
		)
	}
}
