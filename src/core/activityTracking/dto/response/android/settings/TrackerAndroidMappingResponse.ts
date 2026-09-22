import type { PatternMatchType } from '@/_common/dto/enum/PatternMatchType.ts'
import { ActivityFilterFormResponse } from '@/core/activity/dto/response/ActivityFilterFormResponse.ts'

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

	/** What the delete confirmation names (B7) — the form guarantees at least one of the two. */
	get patternLabel(): string {
		return this.appLabel ?? this.packageName ?? String(this.id)
	}

	static fromJson(json: any): TrackerAndroidMappingResponse {
		return new TrackerAndroidMappingResponse(
			json.id,
			json.appLabel,
			json.appLabelMatchType,
			json.packageName,
			json.packageNameMatchType,
			json.isActive,
			json.isIgnored,
			// An ignored rule has no activity; parsing `null` threw and failed the whole page.
			json.activity ? ActivityFilterFormResponse.fromJson(json.activity) : null,
		)
	}
}
