import {PatternMatchType} from '@/dtos/enum/PatternMatchType.ts';

export class BaseTrackerDesktopMappingRequest {
	constructor(
		public processName?: string,
		public processNameMatchType?: PatternMatchType,
		public productName?: string,
		public productNameMatchType?: PatternMatchType,
		public windowTitle?: string,
		public windowTitleMatchType?: PatternMatchType,
	) {
	}
}