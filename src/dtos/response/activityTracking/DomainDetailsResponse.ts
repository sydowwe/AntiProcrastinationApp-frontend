export class DomainDetailsResponse {
	constructor(
		public domain: string,
		public totalSeconds: number,
		public activeSeconds: number,
		public backgroundSeconds: number,
		public entries: number,
		public pages: string[]
	) {
	}

	static fromJson(json: any): DomainDetailsResponse {
		return new DomainDetailsResponse(
			json.domain,
			json.totalSeconds,
			json.activeSeconds,
			json.backgroundSeconds,
			json.entries ?? 0,
			json.pages?.map((p: any) => ({url: p.url, seconds: p.seconds})) || []
		)
	}

}
