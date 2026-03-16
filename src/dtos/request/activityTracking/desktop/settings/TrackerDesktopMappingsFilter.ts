import {DesktopDistinctEntriesFilterRequest} from '@/dtos/request/activityTracking/desktop/settings/DesktopDistinctEntriesFilterRequest.ts';
import {PatternMatchType} from '@/dtos/enum/PatternMatchType.ts';
import {TrackerDesktopMappingTypeEnum} from '@/dtos/enum/TrackerDesktopMappingTypeEnum.ts';

export class TrackerDesktopMappingsFilter extends DesktopDistinctEntriesFilterRequest {
	constructor(
		public processName?: string,
		public processNameMatchType: PatternMatchType = PatternMatchType.Contains,
		public productName?: string,
		public productNameMatchType: PatternMatchType = PatternMatchType.Contains,
		public windowTitle?: string,
		public windowTitleMatchType: PatternMatchType = PatternMatchType.Contains,
		public type: TrackerDesktopMappingTypeEnum = TrackerDesktopMappingTypeEnum.Activity,
		public isActive: boolean | null = null,
		public isIgnored: boolean | null = null,
		public activityId: number | null = null,
		// public roleId: number | null = null,
		// public categoryId: number | null = null,
	) {
		super(processName, processNameMatchType, productName, productNameMatchType, windowTitle, windowTitleMatchType);
	}
}