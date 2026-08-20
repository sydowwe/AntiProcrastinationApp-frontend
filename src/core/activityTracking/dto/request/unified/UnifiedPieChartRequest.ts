import type { Time } from '@/_common/dto/dto/Time.ts'
import { UnifiedActivityRequest } from '@/core/activityTracking/dto/request/unified/UnifiedActivityRequest.ts'
import type { ActivitySource } from '@/core/activityTracking/dto/enum/ActivitySource.ts'

export class UnifiedPieChartRequest extends UnifiedActivityRequest {
	constructor(
		dateFrom: string,
		dateTo: string,
		from: Time,
		to: Time,
		sources: ActivitySource[],
		public readonly minPercent?: number,
	) {
		super(dateFrom, dateTo, from, to, sources)
	}
}
