export class ActivityBucketListProfileRequest {
	constructor(
		public activityId: number = 0,
		public experienceTypeId: number = 0,
		public comfortZoneStep: number = 1,
		public requiresTravel: boolean = false,
		public financialGoal: number | null = null,
		public inspirationSource: string = '',
	) {}

	static fromJson(object: any) {
		const {
			activityId = 0,
			experienceTypeId = 0,
			comfortZoneStep = 1,
			requiresTravel = false,
			financialGoal = null,
			inspirationSource = '',
		} = object
		return new ActivityBucketListProfileRequest(
			activityId,
			experienceTypeId,
			comfortZoneStep,
			requiresTravel,
			financialGoal,
			inspirationSource,
		)
	}
}
