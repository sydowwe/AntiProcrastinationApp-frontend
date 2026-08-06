import { AndroidDistinctEntriesFilterRequest } from '@/core/activityTracking/dto/request/android/settings/AndroidDistinctEntriesFilterRequest.ts'
import { PatternMatchType } from '@/_common/dto/enum/PatternMatchType.ts'
import { TrackerAndroidMappingTypeEnum } from '@/core/activityTracking/dto/enum/TrackerAndroidMappingTypeEnum.ts'

export class TrackerAndroidMappingsFilter extends AndroidDistinctEntriesFilterRequest {
	constructor(
		public appLabel?: string,
		public appLabelMatchType: PatternMatchType = PatternMatchType.Contains,
		public packageName?: string,
		public packageNameMatchType: PatternMatchType = PatternMatchType.Contains,
		public type: TrackerAndroidMappingTypeEnum = TrackerAndroidMappingTypeEnum.Activity,
		public isActive: boolean | null = null,
		public isIgnored: boolean | null = null,
		public activityId: number | null = null,
	) {
		super(appLabel, appLabelMatchType, packageName, packageNameMatchType)
	}
}
