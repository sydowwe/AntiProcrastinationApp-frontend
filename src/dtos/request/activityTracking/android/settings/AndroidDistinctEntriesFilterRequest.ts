import { PatternMatchType } from '@/dtos/enum/PatternMatchType.ts'
import type { IFilterRequest } from '@/dtos/request/interface/IFilterRequest.ts'

export class AndroidDistinctEntriesFilterRequest implements IFilterRequest {
	constructor(
		public appLabel?: string,
		public appLabelMatchType: PatternMatchType = PatternMatchType.Contains,
		public packageName?: string,
		public packageNameMatchType: PatternMatchType = PatternMatchType.Contains,
	) {}
}
