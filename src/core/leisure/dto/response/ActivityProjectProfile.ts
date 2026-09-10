import type { IIdResponse } from '@/_common/dto/response/interface/IIdResponse.ts'
import { convertToEnum } from '@/_common/utils/enumHelpers.ts'
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
		// The server sends the enum's NAME (`"NeedsShopping"`, `"Intermediate"`), while these enums
		// declare camelCase VALUES (`'needsShopping'`) because the `enums.*` locale keys are camelCase.
		// Passing the raw string through left `readinessStatus` as `"NeedsShopping"`, which matches no
		// key in `ProjectReadinessBoard`'s grouping map — so every column counted 0 and the board
		// rendered "No projects" on a list the API had returned in full. `convertToEnum` does the
		// name -> value lookup; the default catches an unknown name rather than storing it.
		return new ActivityProjectProfile(
			activityId,
			ActivityInfo.fromJson(activity),
			convertToEnum(DifficultyLevel, difficultyLevel) ?? DifficultyLevel.Beginner,
			projectArea,
			estimatedHours,
			isMessy,
			Array.isArray(materialsNeeded) ? materialsNeeded : [],
			Array.isArray(requiredTools) ? requiredTools : [],
			convertToEnum(ReadinessStatus, readinessStatus) ?? ReadinessStatus.Planning,
		)
	}

	static listFromObjects(objects: any[]) {
		return objects.map((item: object) => ActivityProjectProfile.fromJson(item))
	}
}
