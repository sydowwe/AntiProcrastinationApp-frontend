import type { IFilterRequest } from '@/_common/dto/request/interface/IFilterRequest.ts'

export class MemoryAnchorFilter implements IFilterRequest {
	constructor(
		public activityName: string | null = null,
		/**
		 * `anchorYear`/`anchorMonth` are the server's field names, and the ones this module's create
		 * request and response DTO have always used. The **URL** keys stay `year`/`month` — see
		 * `memoryAnchorFilterUrlState()`, which maps between the two so existing bookmarks survive.
		 */
		public anchorYear: number | null = null,
		public anchorMonth: number | null = null,
		public minRating: number | null = null,
	) {}

	hasAny(): boolean {
		return !!this.activityName || this.anchorYear != null || this.anchorMonth != null || this.minRating != null
	}
}
