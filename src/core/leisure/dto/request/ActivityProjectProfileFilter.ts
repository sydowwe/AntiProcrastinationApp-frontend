import type { IFilterRequest } from '@/_common/dto/request/interface/IFilterRequest.ts'
import type { DifficultyLevel } from '@/core/leisure/dto/enum/DifficultyLevel.ts'
import type { ReadinessStatus } from '@/core/leisure/dto/enum/ReadinessStatus.ts'

export class ActivityProjectProfileFilter implements IFilterRequest {
	constructor(
		public activityName: string | null = null,
		public difficultyLevels: DifficultyLevel[] | null = null,
		public readinessStatuses: ReadinessStatus[] | null = null,
		public projectArea: string | null = null,
		public isMessy: boolean | null = null,
	) {}

	hasAny(): boolean {
		return (
			!!this.activityName ||
			!!this.difficultyLevels?.length ||
			!!this.readinessStatuses?.length ||
			!!this.projectArea ||
			this.isMessy != null
		)
	}
}
