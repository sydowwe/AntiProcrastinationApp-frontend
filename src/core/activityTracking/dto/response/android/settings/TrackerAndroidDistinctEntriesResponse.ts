import { MappingCoverageResponse } from '@/core/activityTracking/dto/response/MappingCoverageResponse.ts'

export class TrackerAndroidDistinctEntriesResponse {
	constructor(
		public id: number,
		public appLabel: string,
		public packageName: string,
		/**
		 * The active rule that would match this pair, or `null` when undecided (B24). The sync resolves new
		 * sessions through the same rule set since FO9, so a session synced from now on is attributed as this
		 * says; sessions synced before that were stored without attribution and stay so.
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
