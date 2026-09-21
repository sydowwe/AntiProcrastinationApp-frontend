import { MappingCoverageResponse } from '@/core/activityTracking/dto/response/MappingCoverageResponse.ts'

export class TrackerAndroidDistinctEntriesResponse {
	constructor(
		public id: number,
		public appLabel: string,
		public packageName: string,
		/**
		 * The active rule that would match this pair, or `null` when undecided (B24). On Android the sync
		 * does not yet apply rules at ingest, so this says "a rule exists that would match", not "this was
		 * attributed" — the server resolves it through the same rule set the sync will use when it does.
		 */
		public coveredBy: MappingCoverageResponse | null,
	) {}

	static fromJson(json: any): TrackerAndroidDistinctEntriesResponse {
		return new TrackerAndroidDistinctEntriesResponse(
			json.id,
			json.appLabel,
			json.packageName,
			MappingCoverageResponse.fromJsonOrNull(json.coveredBy),
		)
	}
}
