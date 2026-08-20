import type { Time } from '@/_common/dto/dto/Time.ts'
import { ActivityRangeRequest } from '@/core/activityTracking/dto/request/ActivityRangeRequest.ts'
import type { ActivitySource } from '@/core/activityTracking/dto/enum/ActivitySource.ts'

/**
 * The span, plus the set of sources being merged over it.
 *
 * WHY `sources` IS A REQUEST FIELD AND NOT A CLIENT-SIDE FILTER — this is the whole reason the unified
 * dashboard needs a server: the merge is not a union, it is an overlap resolution, and its result
 * depends on which sources take part. An hour in Chrome is attributed to the web extension while the
 * desktop agent is also selected; turn the extension off and that hour must come *back* to the desktop
 * agent as `chrome.exe`, not vanish from the totals. Filtering a merged payload in the browser can
 * only ever hide a lane — it cannot give the time back.
 *
 * Non-empty by construction: the source filter refuses to turn off the last source, and an empty list
 * would ask for a picture of nothing.
 *
 * @see prompts/activity-tracking/backend/U4-backend.md
 */
export class UnifiedActivityRequest extends ActivityRangeRequest {
	constructor(
		dateFrom: string,
		dateTo: string,
		from: Time,
		to: Time,
		public readonly sources: ActivitySource[],
	) {
		super(dateFrom, dateTo, from, to)
	}
}
