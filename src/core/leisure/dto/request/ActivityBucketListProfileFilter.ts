import type { IFilterRequest } from '@/_common/dto/request/interface/IFilterRequest.ts'

export class ActivityBucketListProfileFilter implements IFilterRequest {
	constructor(
		public activityName: string | null = null,
		public experienceTypeIds: number[] | null = null,
		public minComfortZoneStep: number | null = null,
		public maxComfortZoneStep: number | null = null,
		public requiresTravel: boolean | null = null,
	) {}

	hasAny(): boolean {
		return (
			!!this.activityName ||
			!!this.experienceTypeIds?.length ||
			this.minComfortZoneStep != null ||
			this.maxComfortZoneStep != null ||
			this.requiresTravel != null
		)
	}
}
