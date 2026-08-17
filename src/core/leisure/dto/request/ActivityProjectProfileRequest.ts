import { DifficultyLevel } from '@/core/leisure/dto/enum/DifficultyLevel.ts'
import { ReadinessStatus } from '@/core/leisure/dto/enum/ReadinessStatus.ts'
import type { ActivityProjectProfile } from '@/core/leisure/dto/response/ActivityProjectProfile.ts'

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

	/** Full-payload copy of an existing profile, only `readinessStatus` swapped — the board's status
	 *  control has to round-trip the whole entity because the backend has no status-only patch route
	 *  yet (see prompts/leisure/backend/P1-backend.md). */
	static fromProfile(profile: ActivityProjectProfile, readinessStatus: ReadinessStatus = profile.readinessStatus) {
		return new ActivityProjectProfileRequest(
			profile.activityId,
			profile.difficultyLevel,
			profile.projectArea,
			profile.estimatedHours,
			profile.isMessy,
			[...profile.materialsNeeded],
			[...profile.requiredTools],
			readinessStatus,
		)
	}

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
