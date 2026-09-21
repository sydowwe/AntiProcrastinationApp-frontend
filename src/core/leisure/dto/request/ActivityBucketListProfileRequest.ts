/** Lookup ids default to `null`, not `0` — see `ActivityBacklogProfileRequest` (F63). */
export class ActivityBucketListProfileRequest {
	constructor(
		public activityId: number | null = null,
		public experienceTypeId: number | null = null,
		public comfortZoneStep: number = 1,
		public requiresTravel: boolean = false,
		public financialGoal: number | null = null,
		public inspirationSource: string = '',
	) {}

	static fromJson(object: any) {
		const {
			activityId = null,
			experienceTypeId = null,
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
