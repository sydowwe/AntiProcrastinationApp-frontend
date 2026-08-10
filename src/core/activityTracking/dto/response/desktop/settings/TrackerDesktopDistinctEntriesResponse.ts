export class TrackerDesktopDistinctEntriesResponse {
	constructor(
		public id: number,
		public processName: string,
		public productName: string,
		public windowTitle: string | null,
	) {}

	static fromJson(json: any): TrackerDesktopDistinctEntriesResponse {
		return new TrackerDesktopDistinctEntriesResponse(
			json.id,
			json.processName,
			json.productName,
			json.windowTitle ?? null,
		)
	}
}
