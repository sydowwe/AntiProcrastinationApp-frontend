import type { Time } from '@/_common/dto/dto/Time.ts'
import { UnifiedActivityRequest } from '@/core/activityTracking/dto/request/unified/UnifiedActivityRequest.ts'
import type { ActivitySource } from '@/core/activityTracking/dto/enum/ActivitySource.ts'
import type { BaselineType } from '@/core/activityTracking/dto/enum/BaselineOption.ts'

/**
 * `FocusMetricsRequest` is deliberately one class for all three per-source dashboards, and this is not
 * a fourth copy of it — it carries `sources`, which that one cannot, because a merged switch count
 * depends on which trackers were merged. Everything else is identical, `focusGapSeconds` included:
 * the interruption tolerance is a display decision the frontend owns wherever the metrics are shown.
 *
 * @see FocusMetricsRequest
 */
export class UnifiedFocusMetricsRequest extends UnifiedActivityRequest {
	constructor(
		dateFrom: string,
		dateTo: string,
		from: Time,
		to: Time,
		sources: ActivitySource[],
		public readonly baseline: BaselineType | null,
		public readonly focusGapSeconds: number,
	) {
		super(dateFrom, dateTo, from, to, sources)
	}
}
