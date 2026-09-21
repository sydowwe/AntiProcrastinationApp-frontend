import { MappingCoverageResponse } from '@/core/activityTracking/dto/response/MappingCoverageResponse.ts'

export class TrackerDesktopDistinctEntriesResponse {
	constructor(
		public id: number,
		public processName: string,
		public productName: string,
		public windowTitle: string | null,
		/** The active rule that would match this tuple at ingest, or `null` when it is still undecided (B24). */
		public coveredBy: MappingCoverageResponse | null,
	) {}

	static fromJson(json: any): TrackerDesktopDistinctEntriesResponse {
		return new TrackerDesktopDistinctEntriesResponse(
			json.id,
			json.processName,
			json.productName,
			json.windowTitle ?? null,
			MappingCoverageResponse.fromJsonOrNull(json.coveredBy),
		)
	}
}
