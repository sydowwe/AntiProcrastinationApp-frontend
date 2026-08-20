import { ActivityDateRangeRequest } from '@/core/activityHistory/dto/request/ActivityDateRangeRequest.ts'
import type { ActivityDateRangeTypeEnum } from '@/core/activityHistory/dto/request/ActivityDateRangeTypeEnum.ts'

/**
 * The range, and deliberately nothing else — no `groupBy`, no `topN`, no `windowMinutes` and no
 * time-of-day window. Every one of those is what makes `summary/stacked-bars` unusable as a source of
 * time-of-day structure, so the endpoint takes none of them.
 *
 * Adds no fields over its base; it exists so the endpoint's signature names its own request the way the
 * other three `summary/` endpoints do.
 */
export class HistorySummaryTimeOfDayRequest extends ActivityDateRangeRequest {
	constructor(date: string, rangeType: ActivityDateRangeTypeEnum, endDate?: string) {
		super(date, rangeType, endDate)
	}
}
