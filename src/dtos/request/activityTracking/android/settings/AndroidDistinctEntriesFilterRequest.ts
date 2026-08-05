import { PatternMatchType } from '@/_common/dto/enum/PatternMatchType.ts'
import type { IFilterRequest } from '@/_common/dto/request/interface/IFilterRequest.ts'

export class AndroidDistinctEntriesFilterRequest implements IFilterRequest {
	constructor(
		public appLabel?: string,
		public appLabelMatchType: PatternMatchType = PatternMatchType.Contains,
		public packageName?: string,
		public packageNameMatchType: PatternMatchType = PatternMatchType.Contains,
	) {}
}
