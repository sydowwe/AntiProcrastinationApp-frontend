import { DifficultyLevel } from '@/core/leisure/dto/enum/DifficultyLevel.ts'
import { ReadinessStatus } from '@/core/leisure/dto/enum/ReadinessStatus.ts'

export class ActivityProjectProfileRequest {
	constructor(
		public activityId: number = 0,
		public difficultyLevel: DifficultyLevel = DifficultyLevel.Beginner,
		public projectArea: string = '',
		public estimatedHours: number = 1,
		public isMessy: boolean = false,
		public materialsNeeded: string[] = [],
		public requiredTools: string[] = [],
		public readinessStatus: ReadinessStatus = ReadinessStatus.Planning,
	) {}

	static fromJson(object: any) {
		const {
			activityId = 0,
			difficultyLevel = DifficultyLevel.Beginner,
			projectArea = '',
			estimatedHours = 1,
			isMessy = false,
			materialsNeeded = [],
			requiredTools = [],
			readinessStatus = ReadinessStatus.Planning,
		} = object
		return new ActivityProjectProfileRequest(
			activityId,
			difficultyLevel,
			projectArea,
			estimatedHours,
			isMessy,
			materialsNeeded,
			requiredTools,
			readinessStatus,
		)
	}
}
