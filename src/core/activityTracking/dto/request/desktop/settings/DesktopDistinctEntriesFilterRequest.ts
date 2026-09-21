import { PatternMatchType } from '@/_common/dto/enum/PatternMatchType.ts'
import type { IFilterRequest } from '@/_common/dto/request/interface/IFilterRequest.ts'
import type { MappingCoverage } from '@/core/activityTracking/dto/enum/MappingCoverage.ts'

export class DesktopDistinctEntriesFilterRequest implements IFilterRequest {
	constructor(
		public processName?: string,
		public processNameMatchType: PatternMatchType = PatternMatchType.Contains,
		public productName?: string,
		public productNameMatchType: PatternMatchType = PatternMatchType.Contains,
		public windowTitle?: string,
		public windowTitleMatchType: PatternMatchType = PatternMatchType.Contains,
		/** `null` is no opinion (`All`) — B24. Only the distinct-entries grid reads it; the mappings grid ignores it. */
		public coverage: MappingCoverage | null = null,
	) {}
}
