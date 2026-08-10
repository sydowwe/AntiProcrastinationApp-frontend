export class TrackerAndroidDistinctEntriesResponse {
	constructor(
		public id: number,
		public appLabel: string,
		public packageName: string,
	) {}

	static fromJson(json: any): TrackerAndroidDistinctEntriesResponse {
		return new TrackerAndroidDistinctEntriesResponse(json.id, json.appLabel, json.packageName)
	}
}
