import { TimelineSessionDto } from '@/core/activityTracking/dto/response/timeline/TimelineSessionDto.ts'

/**
 * One session array per source, which is what "a lane per source" needs — the merged timeline's lanes
 * are the three trackers, not the active/detail/background split the per-source timelines use.
 *
 * Sessions come back on the unified contract's `label`, not on `domain` / `productName` / `appLabel`,
 * so `fromJson` maps them here rather than reusing `TimelineSessionDto.fromJson` (which reads
 * `json.domain`). The view-model stays `TimelineSessionDto` so `ActivityTimeline` consumes it
 * unchanged; its `domain` field holds the merged label. See `UnifiedActivityItem` on why there is one
 * identity string.
 *
 * Sessions are already de-overlapped, so a lane holds only the time its source was credited with —
 * the three lanes never claim the same minute twice, and reading them top to bottom is a picture of
 * the day rather than three transparencies laid over each other.
 *
 * DO NOT SUM A LANE AND EXPECT THE SOURCE CHIP'S FIGURE. The server owns a contested minute as a
 * *share* — sixty seconds split by precedence — but lanes need a strict partition, since "no two
 * lanes overlap" cannot survive a shared minute. Sessions therefore take each contested minute whole,
 * to its largest shareholder, while `UnifiedSourceBreakdown.countedSeconds` keeps the share. The two
 * differ by a second or two and are answering different questions. Nothing here prints them side by
 * side, and nothing should start.
 */
export class UnifiedTimelineResponse {
	constructor(
		public webExtensionSessions: TimelineSessionDto[],
		public desktopSessions: TimelineSessionDto[],
		public androidSessions: TimelineSessionDto[],
	) {}

	static fromJson(json: any): UnifiedTimelineResponse {
		return new UnifiedTimelineResponse(
			sessionsFromObjects(json?.webExtensionSessions),
			sessionsFromObjects(json?.desktopSessions),
			sessionsFromObjects(json?.androidSessions),
		)
	}
}

function sessionsFromObjects(objects: any): TimelineSessionDto[] {
	return (objects ?? []).map(
		(session: any) =>
			new TimelineSessionDto(
				session.id,
				session.label,
				new Date(session.startedAt),
				new Date(session.endedAt),
				session.durationSeconds,
				session.totalSeconds,
				session.url,
			),
	)
}
