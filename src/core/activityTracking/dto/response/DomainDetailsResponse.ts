/** One URL of the domain, with its time summed over every entry that carried it. */
export class PageVisit {
	constructor(
		public url: string,
		/** Path and query without the domain, cut to 100 characters by the server — for display only. */
		public path: string,
		public totalSeconds: number,
		public activeSeconds: number,
		public backgroundSeconds: number,
	) {}

	static fromJson(json: any): PageVisit {
		const { url = '', path = url, totalSeconds = 0, activeSeconds = 0, backgroundSeconds = 0 } = json
		return new PageVisit(url, path, totalSeconds, activeSeconds, backgroundSeconds)
	}
}

/**
 * `GET /activity-tracking/web-extension/domain-details` — the web sibling of `DesktopProcessDetailsResponse`.
 * `pages` arrives ranked by `totalSeconds`, longest first. It leaves out the entries tracked to the domain
 * only (no URL), so the pages can sum to less than `totalSeconds`.
 */
export class DomainDetailsResponse {
	constructor(
		public domain: string,
		public totalSeconds: number,
		public activeSeconds: number,
		public backgroundSeconds: number,
		public entries: number,
		public pages: PageVisit[],
	) {}

	static fromJson(json: any): DomainDetailsResponse {
		const {
			domain = '',
			totalSeconds = 0,
			activeSeconds = 0,
			backgroundSeconds = 0,
			entries = 0,
			pages = [],
		} = json
		return new DomainDetailsResponse(
			domain,
			totalSeconds,
			activeSeconds,
			backgroundSeconds,
			entries,
			pages.map((p: any) => PageVisit.fromJson(p)),
		)
	}
}
