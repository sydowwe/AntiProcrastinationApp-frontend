import type { PatternMatchType } from '@/dtos/enum/PatternMatchType.ts'
import { ActivityFilterFormResponse } from '@/dtos/response/activity/ActivityFilterFormResponse.ts'

export class TrackerDesktopMappingResponse {
	constructor(
		public id: number,
		public processName: string | null,
		public processNameMatchType: PatternMatchType | null,
		public productName: string | null,
		public productNameMatchType: PatternMatchType | null,
		public windowTitle: string | null,
		public windowTitleMatchType: PatternMatchType | null,
		public isActive: boolean,
		public isIgnored: boolean | null,
		public activity: ActivityFilterFormResponse | null,
		// public roleId: number | null,
		// public categoryId: number | null,
	) {}

	static fromJson(json: any): TrackerDesktopMappingResponse {
		return new TrackerDesktopMappingResponse(
			json.id,
			json.processName,
			json.processNameMatchType,
			json.productName,
			json.productNameMatchType,
			json.windowTitle,
			json.windowTitleMatchType,
			json.isActive,
			json.isIgnored,
			ActivityFilterFormResponse.fromJson(json.activity),
			// json.roleId,
			// json.categoryId,
		)
	}
}
