import type { Time } from '@/_common/dto/dto/Time.ts'
import { ActivityRangeRequest } from '@/core/activityTracking/dto/request/ActivityRangeRequest.ts'
import type { BaselineType } from '@/core/activityTracking/dto/enum/BaselineOption.ts'

/**
 * ONE class for all three sources, deliberately — do not split it into web-extension / desktop /
 * android copies to match the neighbouring request families.
 *
 * The request is byte-identical per source: only the route differs, and the route is the API
 * function's business. The existing per-source triplication of `SummaryCardsRequest` &co. is the
 * thing U4 is trying to reduce, so adding a fourth family of it would move backwards.
 *
 * `baseline` is nullable: `null` asks for the metrics with no comparison, and the server answers with
 * `baseline: null`. `focusGapSeconds` carries `FOCUS_BLOCK_TOLERANCE_SECONDS` — the interruption
 * tolerance is a display decision the frontend owns, so it travels with every request rather than
 * living as a server constant.
 */
export class FocusMetricsRequest extends ActivityRangeRequest {
	constructor(
		dateFrom: string,
		dateTo: string,
		from: Time,
		to: Time,
		public readonly baseline: BaselineType | null,
		public readonly focusGapSeconds: number,
	) {
		super(dateFrom, dateTo, from, to)
	}
}
