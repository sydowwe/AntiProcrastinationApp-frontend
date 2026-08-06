import type { IIdResponse } from '@/_common/dto/response/interface/IIdResponse.ts'
import { ActivityInfo } from '@/core/leisure/dto/response/ActivityInfo.ts'
import { DifficultyLevel } from '@/core/leisure/dto/enum/DifficultyLevel.ts'
import { ReadinessStatus } from '@/core/leisure/dto/enum/ReadinessStatus.ts'

export class ActivityProjectProfile implements IIdResponse {
	constructor(
		public activityId: number,
		public activity: ActivityInfo,
		public difficultyLevel: DifficultyLevel,
		public projectArea: string,
		public estimatedHours: number,
		public isMessy: boolean,
		public materialsNeeded: string[],
		public requiredTools: string[],
		public readinessStatus: ReadinessStatus,
	) {}

	get id(): number {
		return this.activityId
	}

	static fromJson(object: any) {
		const {
			activityId = 0,
			activity = {},
			difficultyLevel = DifficultyLevel.Beginner,
			projectArea = '',
			estimatedHours = 0,
			isMessy = false,
			materialsNeeded = [],
			requiredTools = [],
			readinessStatus = ReadinessStatus.Planning,
		} = object
		return new ActivityProjectProfile(
			activityId,
			ActivityInfo.fromJson(activity),
			difficultyLevel,
			projectArea,
			estimatedHours,
			isMessy,
			Array.isArray(materialsNeeded) ? materialsNeeded : [],
			Array.isArray(requiredTools) ? requiredTools : [],
			readinessStatus,
		)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => ActivityProjectProfile.fromJson(item))
	}
}
