/**
 * Timeline calculation utilities
 */

import {TimelineGridConfig} from '@/components/activityTracking/timeline/dto/TimelineGridConfig.ts';
import {SessionPosition} from '@/components/activityTracking/timeline/dto/SessionPosition.ts';
import {StackedSession} from '@/components/activityTracking/timeline/dto/StackedSession.ts';
import type {TimelineSessionDto} from '@/dtos/response/activityTracking/timeline/TimelineSessionDto.ts';
import {Gap} from '@/components/activityTracking/timeline/dto/Gap.ts';
import {GapDisplay} from '@/components/activityTracking/timeline/dto/GapDisplay.ts';
import {TimelineSegment} from '@/components/activityTracking/timeline/dto/TimelineSegment.ts';

/**
 * Calculate timeline configuration based on container and time range
 */
export function calculateTimelineConfig(
	containerWidth: number,
	from: Date,
	to: Date,
): TimelineGridConfig {
	const totalMinutes = (to.getTime() - from.getTime()) / (1000 * 60)
	const timeAxisHeight = 32
	const laneHeight = 40

	const pixelsPerMinute = containerWidth / totalMinutes

	return new TimelineGridConfig(
		totalMinutes,
		pixelsPerMinute,
		laneHeight,
		timeAxisHeight,
		2 // minBlockWidth
	)
}

/**
 * Calculate CSS position for a session block
 */
export function calculateSessionPosition(
	session: TimelineSessionDto,
	rangeFrom: Date,
	rangeTo: Date,
	containerWidth: number,
	config: TimelineGridConfig,
): SessionPosition {
	const rangeStart = rangeFrom.getTime()
	const rangeEnd = rangeTo.getTime()
	const rangeDuration = rangeEnd - rangeStart

	const sessionStart = Math.max(session.startedAt.getTime(), rangeStart)
	const sessionEnd = Math.min(session.endedAt.getTime(), rangeEnd)

	const leftPercent = ((sessionStart - rangeStart) / rangeDuration) * 100
	const widthPercent = ((sessionEnd - sessionStart) / rangeDuration) * 100

	const widthPixels = (widthPercent / 100) * containerWidth

	return new SessionPosition(
		`${leftPercent}%`,
		`${widthPercent}%`,
		widthPixels < config.minBlockWidth ? `${config.minBlockWidth}px` : 'auto'
	)
}

/**
 * Calculate waterfall stacking for overlapping background sessions
 */
export function calculateWaterfallStack(sessions: TimelineSessionDto[]): StackedSession[] {
	const sorted = [...sessions].sort(
		(a, b) => a.startedAt.getTime() - b.startedAt.getTime(),
	)

	const levelEndTimes: number[] = []

	return sorted.map((session) => {
		const startTime = session.startedAt.getTime()

		let level = 0
		while (level < levelEndTimes.length && (levelEndTimes[level] ?? 0) > startTime) {
			level++
		}

		levelEndTimes[level] = session.endedAt.getTime()

		return new StackedSession(
			session.id,
			session.domain,
			session.startedAt,
			session.endedAt,
			session.durationSeconds,
			session.totalSeconds,
			level,
			session.url
		)
	})
}

/**
 * Calculate lane height based on max stack level
 */
export function calculateLaneHeight(
	stackedSessions: StackedSession[],
	baseHeight: number,
): number {
	if (stackedSessions.length === 0) return baseHeight

	const maxLevel = Math.max(0, ...stackedSessions.map((s) => s.stackLevel))
	return baseHeight * (maxLevel + 1)
}

/**
 * Find activity gaps (periods with no activity)
 */
export function findActivityGaps(
	sessions: TimelineSessionDto[],
	from: Date,
	to: Date,
	minGapMinutes = 30,
): Gap[] {
	const gaps: Gap[] = []

	const sorted = [...sessions].sort(
		(a, b) => a.startedAt.getTime() - b.startedAt.getTime(),
	)

	let currentEnd = from.getTime()

	for (const session of sorted) {
		const sessionStart = session.startedAt.getTime()

		if (sessionStart > currentEnd) {
			const gapMinutes = (sessionStart - currentEnd) / (1000 * 60)

			if (gapMinutes >= minGapMinutes) {
				gaps.push(new Gap(
					new Date(currentEnd),
					new Date(sessionStart),
					gapMinutes
				))
			}
		}

		currentEnd = Math.max(currentEnd, session.endedAt.getTime())
	}

	if (to.getTime() > currentEnd) {
		const gapMinutes = (to.getTime() - currentEnd) / (1000 * 60)

		if (gapMinutes >= minGapMinutes) {
			gaps.push(new Gap(
				new Date(currentEnd),
				to,
				gapMinutes
			))
		}
	}

	return gaps
}

/**
 * Calculate gap display properties
 */
export function calculateGapDisplay(gap: Gap, config: TimelineGridConfig): GapDisplay {
	const durationPixels = gap.durationMinutes * config.pixelsPerMinute
	const labelMinWidth = 80

	return new GapDisplay(
		durationPixels >= labelMinWidth,
		Math.max(durationPixels, 20),
		durationPixels > labelMinWidth * 2
	)
}

/**
 * Filter sessions that overlap with a given time range.
 * Generic to preserve StackedSession type when passed in.
 */
export function filterSessionsForRange<T extends TimelineSessionDto>(
	sessions: T[],
	rangeFrom: Date,
	rangeTo: Date,
): T[] {
	return sessions.filter((session) => {
		return session.startedAt < rangeTo && session.endedAt > rangeFrom
	})
}

/**
 * Build timeline segments by splitting the time range into activity and gap periods.
 * Activity periods keep proportional width; gaps compress into narrow columns.
 */
export function buildTimelineSegments(
	sessions: TimelineSessionDto[],
	from: Date,
	to: Date,
	minGapMinutes = 30,
): TimelineSegment[] {
	const gaps = findActivityGaps(sessions, from, to, minGapMinutes)

	if (gaps.length === 0) {
		return [new TimelineSegment('activity', from, to, (to.getTime() - from.getTime()) / (1000 * 60))]
	}

	const segments: TimelineSegment[] = []
	let currentTime = from.getTime()

	for (const gap of gaps) {
		const gapStart = gap.startedAt.getTime()

		if (gapStart > currentTime) {
			const dur = (gapStart - currentTime) / (1000 * 60)
			segments.push(new TimelineSegment('activity', new Date(currentTime), gap.startedAt, dur))
		}

		segments.push(new TimelineSegment('gap', gap.startedAt, gap.endedAt, gap.durationMinutes))

		currentTime = gap.endedAt.getTime()
	}

	if (to.getTime() > currentTime) {
		const dur = (to.getTime() - currentTime) / (1000 * 60)
		segments.push(new TimelineSegment('activity', new Date(currentTime), to, dur))
	}

	return segments
}

/**
 * Calculate pixel widths for each segment.
 * Activity segments share available space proportionally by duration.
 * Gap segments get a fixed narrow width.
 */
export function calculateSegmentWidths(
	segments: TimelineSegment[],
	availableWidth: number,
	gapColumnWidth: number,
): number[] {
	const numGaps = segments.filter(s => s.type === 'gap').length
	const totalGapWidth = numGaps * gapColumnWidth
	const activityWidth = Math.max(0, availableWidth - totalGapWidth)
	const totalActivityMinutes = segments
		.filter(s => s.type === 'activity')
		.reduce((sum, s) => sum + s.durationMinutes, 0)

	return segments.map(segment => {
		if (segment.type === 'gap') return gapColumnWidth
		if (totalActivityMinutes === 0) return 0
		return (segment.durationMinutes / totalActivityMinutes) * activityWidth
	})
}
