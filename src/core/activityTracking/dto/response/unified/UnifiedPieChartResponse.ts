import { UnifiedActivityItem } from '@/core/activityTracking/dto/response/unified/UnifiedActivityItem.ts'
import { UnifiedPieTotals } from '@/core/activityTracking/dto/response/unified/UnifiedPieTotals.ts'

export class UnifiedPieChartResponse {
	constructor(
		public items: UnifiedActivityItem[],
		public totals: UnifiedPieTotals,
	) {}

	static fromJson(json: any): UnifiedPieChartResponse {
		return new UnifiedPieChartResponse(
			UnifiedActivityItem.listFromObjects(json?.items ?? []),
			// `totals` is read unconditionally by the details panel, so it must survive an empty span.
			UnifiedPieTotals.fromJson(json?.totals),
		)
	}
}
