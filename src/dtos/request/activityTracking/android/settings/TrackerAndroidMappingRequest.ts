import type { PatternMatchType } from '@/dtos/enum/PatternMatchType.ts'
import type { AndroidDistinctEntriesFilterRequest } from '@/dtos/request/activityTracking/android/settings/AndroidDistinctEntriesFilterRequest.ts'

export class TrackerAndroidMappingRequest {
	constructor(
		public appLabel: string | null = null,
		public appLabelMatchType: PatternMatchType | null = null,
		public packageName: string | null = null,
		public packageNameMatchType: PatternMatchType | null = null,
		public isActive?: boolean,
		public isIgnored: boolean | null = null,
		public activityId: number | null = null,
		public roleId: number | null = null,
		public categoryId: number | null = null,
	) {}

	updatePattern(filter: AndroidDistinctEntriesFilterRequest) {
		this.appLabel = filter.appLabel ?? null
		this.appLabelMatchType = filter.appLabelMatchType
		this.packageName = filter.packageName ?? null
		this.packageNameMatchType = filter.packageNameMatchType
	}
}
