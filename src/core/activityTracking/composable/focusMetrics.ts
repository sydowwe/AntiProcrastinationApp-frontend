import type { TimelineSessionDto } from '@/core/activityTracking/dto/response/timeline/TimelineSessionDto.ts'
import { findActivityGaps } from '@/core/activityTracking/component/timeline/timelineUtils.ts'

/**
 * How long an interruption has to last before it ends a focus block.
 *
 * This is a display decision, not a fact about the data: a twenty-second glance at another window is
 * not the end of an hour on one thing, and a five-minute one is. Two minutes is the line, and it is
 * named here — and surfaced in the strip's own tooltip — rather than living as a bare `120` inside a
 * loop. Changing it changes only what "longest block" means, never the switch count.
 */
export const FOCUS_BLOCK_TOLERANCE_SECONDS = 120

/** A run of attention on one item, possibly containing interruptions shorter than the tolerance. */
export interface FocusBlock {
	label: string
	startedAt: Date
	endedAt: Date
	/** Wall-clock span from the first session's start to the last one's end, tolerated gaps included. */
	seconds: number
}

/**
 * The shape of a span's attention, as opposed to its volume. Every field is descriptive — none of them
 * is a score, and nothing here ranks one day against another. Comparison against the user's own recent
 * history would need data the client never holds; see `prompts/activity-tracking/backend/U5-backend.md`.
 */
export interface FocusMetrics {
	/** How many sessions the numbers were derived from. */
	sessionCount: number
	/** Times the foreground item changed. Zero over a single unbroken run. */
	switchCount: number
	/** The longest run on one item. Never `null` when `sessionCount > 0`. */
	longestBlock: FocusBlock | null
	/** Median wall-clock session length. Median, not mean — the distribution is heavily right-skewed. */
	medianSessionSeconds: number
	/** Longest stretch *between* two sessions with nothing recorded. `null` when there is no such gap. */
	longestGapSeconds: number | null
}

/**
 * Derives the fragmentation measures from timeline sessions. Pure and synchronous — the timeline
 * response already carries per-session start/end times, so none of this needs the backend.
 *
 * Feed it the PRIMARY lane only. The detail lane is a finer cut of the same attention (pages inside a
 * domain, window titles inside a process) and counting it would report in-site navigation as task
 * switching; the background lane is by definition what the user was *not* looking at.
 *
 * Returns `null` when there is nothing to describe, which is also what a multi-day span produces — the
 * timeline is not fetched over a range (see `isTimelineAvailable` in `useActivityDashboard`), so the
 * sessions these numbers need are simply not in the client.
 */
export function computeFocusMetrics(sessions: TimelineSessionDto[]): FocusMetrics | null {
	if (sessions.length === 0) {
		return null
	}

	const sorted = [...sessions].sort((a, b) => a.startedAt.getTime() - b.startedAt.getTime())

	return {
		sessionCount: sorted.length,
		switchCount: countSwitches(sorted),
		longestBlock: findLongestBlock(sorted),
		medianSessionSeconds: findMedianSessionSeconds(sorted),
		longestGapSeconds: findLongestGapSeconds(sorted),
	}
}

/**
 * Every point where the foreground item differs from the one before it.
 *
 * Deliberately *not* gap-tolerant, unlike `findLongestBlock`. The two answer different questions — "how
 * often did attention move" and "how long was it held" — and a short detour is honestly both a switch
 * and something that failed to break a block. Making the count tolerant too would hide exactly the
 * mechanism the pair is there to show.
 *
 * Consecutive sessions on the same item do not count: a tracker that splits one continuous run into
 * three records must not read as two switches.
 */
function countSwitches(sorted: TimelineSessionDto[]): number {
	let switches = 0
	for (let i = 1; i < sorted.length; i++) {
		if (sorted[i].domain !== sorted[i - 1].domain) {
			switches++
		}
	}
	return switches
}

/**
 * Longest run on a single item, tolerating interruptions under `FOCUS_BLOCK_TOLERANCE_SECONDS`.
 *
 * Computed per item rather than by walking the merged sequence: within one item's own sessions, a brief
 * detour to something else and a brief untracked pause both appear as the same thing — a short gap — so
 * one merge rule covers both cases without a second code path for "was the interruption tracked".
 */
function findLongestBlock(sorted: TimelineSessionDto[]): FocusBlock | null {
	const toleranceMs = FOCUS_BLOCK_TOLERANCE_SECONDS * 1000
	const openBlocks = new Map<string, { start: number; end: number }>()
	const closedBlocks: FocusBlock[] = []

	function close(label: string, block: { start: number; end: number }) {
		closedBlocks.push({
			label,
			startedAt: new Date(block.start),
			endedAt: new Date(block.end),
			seconds: (block.end - block.start) / 1000,
		})
	}

	for (const session of sorted) {
		const label = session.domain
		const start = session.startedAt.getTime()
		const end = session.endedAt.getTime()
		const open = openBlocks.get(label)

		if (open !== undefined && start - open.end <= toleranceMs) {
			// `max` rather than assignment: a session fully contained in the run must not shorten it.
			open.end = Math.max(open.end, end)
			continue
		}
		if (open !== undefined) {
			close(label, open)
		}
		openBlocks.set(label, { start, end })
	}

	for (const [label, open] of openBlocks) {
		close(label, open)
	}

	return closedBlocks.reduce<FocusBlock | null>(
		(longest, block) => (longest === null || block.seconds > longest.seconds ? block : longest),
		null,
	)
}

/**
 * `durationSeconds` rather than `endedAt - startedAt`, so this reconciles with the "Duration" row in the
 * timeline's own session tooltip. Blocks and gaps below use the timestamps because they need instants,
 * not lengths; the two are the same quantity read off the same session.
 */
function findMedianSessionSeconds(sorted: TimelineSessionDto[]): number {
	const lengths = sorted.map(session => session.durationSeconds).sort((a, b) => a - b)
	const middle = Math.floor(lengths.length / 2)
	return lengths.length % 2 === 0 ? (lengths[middle - 1] + lengths[middle]) / 2 : lengths[middle]
}

/**
 * Interior gaps only — bounded by a session on both sides.
 *
 * Anchoring the search to the first session's start and the last one's end rather than to the selected
 * time window is what makes this true regardless of when the user looks. A window running to midnight
 * would otherwise report the rest of an unfinished day as the day's longest gap, and a window opening at
 * 07:00 would report "was not at the computer yet" as one too. Neither is a break in anything.
 */
function findLongestGapSeconds(sorted: TimelineSessionDto[]): number | null {
	if (sorted.length < 2) {
		return null
	}

	const lastEnd = sorted.reduce((latest, session) => Math.max(latest, session.endedAt.getTime()), 0)
	const gaps = findActivityGaps(sorted, sorted[0].startedAt, new Date(lastEnd), 0)
	if (gaps.length === 0) {
		return null
	}

	return Math.max(...gaps.map(gap => gap.durationMinutes)) * 60
}
