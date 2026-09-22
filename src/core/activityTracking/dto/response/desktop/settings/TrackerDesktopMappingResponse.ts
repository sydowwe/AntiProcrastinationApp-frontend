import type { PatternMatchType } from '@/_common/dto/enum/PatternMatchType.ts'
import { ActivityFilterFormResponse } from '@/core/activity/dto/response/ActivityFilterFormResponse.ts'

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

	/** What the delete confirmation names (B7) — the form guarantees at least one of the three. */
	get patternLabel(): string {
		return this.processName ?? this.productName ?? this.windowTitle ?? String(this.id)
	}

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
			// An ignored rule has no activity; parsing `null` threw and failed the whole page.
			json.activity ? ActivityFilterFormResponse.fromJson(json.activity) : null,
			// json.roleId,
			// json.categoryId,
		)
	}
}
