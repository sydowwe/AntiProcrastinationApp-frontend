import type { IMyResponse } from '@/dtos/response/interface/IMyResponse.ts'

export class TrackerAndroidDistinctEntriesResponse implements IMyResponse {
	constructor(
		public id: number,
		public appLabel: string,
		public packageName: string,
	) {}

	static fromJson(json: any): TrackerAndroidDistinctEntriesResponse {
		return new TrackerAndroidDistinctEntriesResponse(json.id, json.appLabel, json.packageName)
	}
}
