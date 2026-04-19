import type { PatternMatchType } from '@/dtos/enum/PatternMatchType.ts'
import { ActivityFilterFormResponse } from '@/dtos/response/activity/ActivityFilterFormResponse.ts'

export class TrackerAndroidMappingResponse {
	constructor(
		public id: number,
		public appLabel: string | null,
		public appLabelMatchType: PatternMatchType | null,
		public packageName: string | null,
		public packageNameMatchType: PatternMatchType | null,
		public isActive: boolean,
		public isIgnored: boolean | null,
		public activity: ActivityFilterFormResponse | null,
	) {}

	static fromJson(json: any): TrackerAndroidMappingResponse {
		return new TrackerAndroidMappingResponse(
			json.id,
			json.appLabel,
			json.appLabelMatchType,
			json.packageName,
			json.packageNameMatchType,
			json.isActive,
			json.isIgnored,
			ActivityFilterFormResponse.fromJson(json.activity),
		)
	}
}
