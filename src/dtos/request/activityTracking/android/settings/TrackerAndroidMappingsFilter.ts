import { AndroidDistinctEntriesFilterRequest } from '@/dtos/request/activityTracking/android/settings/AndroidDistinctEntriesFilterRequest.ts'
import { PatternMatchType } from '@/dtos/enum/PatternMatchType.ts'
import { TrackerAndroidMappingTypeEnum } from '@/dtos/enum/TrackerAndroidMappingTypeEnum.ts'

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
