import { ActivityRangeRequest } from '@/core/activityTracking/dto/request/ActivityRangeRequest.ts'

/**
 * The web-extension timeline previously posted a bare `DateAndTimeRangeRequest`, which is the one
 * dashboard request that had no class of its own. It needs one now for the same reason as the other
 * three — the shared base carries `dateFrom`/`dateTo`.
 *
 * The timeline is only ever requested for a single day (see `useActivityDashboard`: a session
 * timeline over a multi-day range is not a legible object), so `dateFrom === dateTo` always here.
 */
export class TimelineRequest extends ActivityRangeRequest {}
