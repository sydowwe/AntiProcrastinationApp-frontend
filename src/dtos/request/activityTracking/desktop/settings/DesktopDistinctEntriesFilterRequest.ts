import { PatternMatchType } from '@/dtos/enum/PatternMatchType.ts'
import type { IFilterRequest } from '@/dtos/request/interface/IFilterRequest.ts'

export class DesktopDistinctEntriesFilterRequest implements IFilterRequest {
	constructor(
		public processName?: string,
		public processNameMatchType: PatternMatchType = PatternMatchType.Contains,
		public productName?: string,
		public productNameMatchType: PatternMatchType = PatternMatchType.Contains,
		public windowTitle?: string,
		public windowTitleMatchType: PatternMatchType = PatternMatchType.Contains,
	) {}
}
