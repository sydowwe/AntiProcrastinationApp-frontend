import { PatternMatchType } from '@/_common/dto/enum/PatternMatchType.ts'
import type { IFilterRequest } from '@/_common/dto/request/interface/IFilterRequest.ts'
import type { MappingCoverage } from '@/core/activityTracking/dto/enum/MappingCoverage.ts'

export class AndroidDistinctEntriesFilterRequest implements IFilterRequest {
	constructor(
		public appLabel?: string,
		public appLabelMatchType: PatternMatchType = PatternMatchType.Contains,
		public packageName?: string,
		public packageNameMatchType: PatternMatchType = PatternMatchType.Contains,
		/** `null` is no opinion (`All`) — B24. Only the distinct-entries grid reads it; the mappings grid ignores it. */
		public coverage: MappingCoverage | null = null,
	) {}
}
