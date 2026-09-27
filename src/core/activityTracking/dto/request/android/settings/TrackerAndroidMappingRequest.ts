import type { PatternMatchType } from '@/_common/dto/enum/PatternMatchType.ts'
import type { AndroidDistinctEntriesFilterRequest } from '@/core/activityTracking/dto/request/android/settings/AndroidDistinctEntriesFilterRequest.ts'
import type { TrackerAndroidMappingResponse } from '@/core/activityTracking/dto/response/android/settings/TrackerAndroidMappingResponse.ts'

export class TrackerAndroidMappingRequest {
	constructor(
		public appLabel: string | null = null,
		public appLabelMatchType: PatternMatchType | null = null,
		public packageName: string | null = null,
		public packageNameMatchType: PatternMatchType | null = null,
		/** Always sent: the update is a full replace and requires it (F72). An edit copies the row's own value. */
		public isActive: boolean = true,
		public isIgnored: boolean | null = null,
		public activityId: number | null = null,
		public roleId: number | null = null,
		public categoryId: number | null = null,
	) {}

	/** The row as a full-replace body, so a single-field change (the *Is active* toggle, O1) keeps the rest. */
	static fromRow(row: TrackerAndroidMappingResponse): TrackerAndroidMappingRequest {
		return new TrackerAndroidMappingRequest(
			row.appLabel,
			row.appLabelMatchType,
			row.packageName,
			row.packageNameMatchType,
			row.isActive,
			row.isIgnored,
			row.activity?.id ?? null,
			row.roleId,
			row.categoryId,
		)
	}

	/** A blank field is no pattern — sent as `""` it would satisfy the server's at-least-one-pattern rule. */
	updatePattern(filter: AndroidDistinctEntriesFilterRequest) {
		this.appLabel = filter.appLabel?.trim() || null
		this.appLabelMatchType = filter.appLabelMatchType
		this.packageName = filter.packageName?.trim() || null
		this.packageNameMatchType = filter.packageNameMatchType
	}

	hasPattern(): boolean {
		return this.appLabel != null || this.packageName != null
	}
}
