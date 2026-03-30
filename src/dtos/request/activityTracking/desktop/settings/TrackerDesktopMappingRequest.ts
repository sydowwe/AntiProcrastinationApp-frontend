import type { PatternMatchType } from '@/dtos/enum/PatternMatchType.ts'
import type { DesktopDistinctEntriesFilterRequest } from '@/dtos/request/activityTracking/desktop/settings/DesktopDistinctEntriesFilterRequest.ts'

export class TrackerDesktopMappingRequest {
	constructor(
		public processName: string | null = null,
		public processNameMatchType: PatternMatchType | null = null,
		public productName: string | null = null,
		public productNameMatchType: PatternMatchType | null = null,
		public windowTitle: string | null = null,
		public windowTitleMatchType: PatternMatchType | null = null,
		public isActive?: boolean,
		public isIgnored: boolean | null = null,
		public activityId: number | null = null,
		public roleId: number | null = null,
		public categoryId: number | null = null,
	) {}

	updatePattern(filter: DesktopDistinctEntriesFilterRequest) {
		this.processName = filter.processName ?? null
		this.processNameMatchType = filter.processNameMatchType
		this.productName = filter.productName ?? null
		this.productNameMatchType = filter.productNameMatchType
		this.windowTitle = filter.windowTitle ?? null
		this.windowTitleMatchType = filter.windowTitleMatchType
	}
}
