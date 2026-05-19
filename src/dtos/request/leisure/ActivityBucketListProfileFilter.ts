import type { IFilterRequest } from '@/dtos/request/interface/IFilterRequest.ts'
import type { ExperienceType } from '@/dtos/enum/ExperienceType.ts'

export class ActivityBucketListProfileFilter implements IFilterRequest {
	constructor(
		public activityName: string | null = null,
		public experienceTypes: ExperienceType[] | null = null,
		public minComfortZoneStep: number | null = null,
		public maxComfortZoneStep: number | null = null,
		public requiresTravel: boolean | null = null,
	) {}

	hasAny(): boolean {
		return (
			!!this.activityName ||
			!!this.experienceTypes?.length ||
			this.minComfortZoneStep != null ||
			this.maxComfortZoneStep != null ||
			this.requiresTravel != null
		)
	}
}
