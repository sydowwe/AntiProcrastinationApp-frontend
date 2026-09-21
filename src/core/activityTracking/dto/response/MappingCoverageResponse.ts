import { MappingCoverageTarget } from '@/core/activityTracking/dto/enum/MappingCoverage.ts'
import { convertToEnum } from '@/_common/utils/enumHelpers.ts'

/**
 * The rule the ingest would pick for a distinct-entries tuple today — the server's own matcher (same
 * specificity order, first-match-wins, active rules only), so the chip cannot disagree with attribution.
 * `null` on the row means no active rule matches: undecided.
 */
export class MappingCoverageResponse {
	constructor(
		public mappingId: number,
		public target: MappingCoverageTarget,
		/**
		 * Activity name, or the role and/or category name joined with ` · `. The server writes `null`
		 * for `Ignored` rather than omitting the key — nullable, not optional.
		 */
		public targetName: string | null,
	) {}

	static fromJson(json: any): MappingCoverageResponse {
		const { mappingId, target, targetName = null } = json
		return new MappingCoverageResponse(
			mappingId,
			convertToEnum(MappingCoverageTarget, target) ?? MappingCoverageTarget.Activity,
			targetName,
		)
	}

	static fromJsonOrNull(json: any): MappingCoverageResponse | null {
		return json == null ? null : MappingCoverageResponse.fromJson(json)
	}
}
