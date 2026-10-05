import type { PatternMatchType } from '@/_common/dto/enum/PatternMatchType.ts'
import { ActivityFilterFormResponse } from '@/core/activity/dto/response/ActivityFilterFormResponse.ts'
import type { RoleCategoryTarget } from '@/core/activityTracking/dto/RoleCategoryTarget.ts'

export class TrackerAndroidMappingResponse implements RoleCategoryTarget {
	constructor(
		public id: number,
		public appLabel: string | null,
		public appLabelMatchType: PatternMatchType | null,
		public packageName: string | null,
		public packageNameMatchType: PatternMatchType | null,
		public isActive: boolean,
		public isIgnored: boolean | null,
		public activity: ActivityFilterFormResponse | null,
		/** The role/category target. The form never writes one, but a row may hold it, and the *Is active*
		 *  toggle re-sends the row as a full replace — dropped here, the PUT would clear the target (O1). */
		public roleId: number | null,
		public categoryId: number | null,
		/** The target's names, for the Mappings tab's target column (OP22). */
		public roleName: string | null,
		public categoryName: string | null,
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
			json.roleId ?? null,
			json.categoryId ?? null,
			json.roleName ?? null,
			json.categoryName ?? null,
		)
	}
}
