import { PatternMatchType } from '@/_common/dto/enum/PatternMatchType.ts'
import type { IFilterRequest } from '@/_common/dto/request/interface/IFilterRequest.ts'

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
