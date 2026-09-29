import type { SkipHourCount } from '@/core/dayPlanner/dto/response/SkipSummary.ts'
import type { SkipReasonGroup, SkipReasonSummary } from '@/core/dayPlanner/utils/skipReasonGroups.ts'

/**
 * The two sentences the calendar may say about a range's skips (C1 / B1), and the floor under each.
 * Below a floor the sentence is not rendered at all — never rendered with a hedge. A pattern too thin
 * to state plainly is not worth stating.
 *
 * Considered and rejected, so nobody reopens them without reading why (the full list is in the B1
 * contract): the same activity skipped repeatedly (actionable, but it names one thing the user kept
 * not doing — a list of failures); a weekday pattern (four or five samples per weekday in a month);
 * skips over time or a skip percentage (scoring); reason × hour (far too sparse).
 */

/** A named reason needs this many skips before it is "the most common". */
export const TOP_REASON_MIN_COUNT = 3

/**
 * The most common named reason, or null. Null — skipped without a reason — never competes: calling it
 * "the most common reason" would turn a legitimate non-answer into a shortfall. A tie is no answer
 * either: two reasons at 4 each have no "most common".
 */
export function topSkipReason(summary: SkipReasonSummary): SkipReasonGroup | null {
	const [first, second] = summary.groups
	if (first === undefined || first.count < TOP_REASON_MIN_COUNT) return null
	if (second !== undefined && second.count >= first.count) return null
	return first
}

/** Candidate "late in the day" boundaries, checked in order. */
export const LATE_SPLIT_HOURS = [17, 18, 19, 20, 21, 22] as const
export const LATE_MIN_PLANNED = 5
export const LATE_MIN_SKIPPED = 3
/** The "earlier in the day" half needs a base of its own, or "2 of 3" is compared against nothing. */
export const EARLY_MIN_PLANNED = 5
/** The late skip rate must be at least this multiple of the earlier one. */
export const LATE_RATE_FACTOR = 2

export interface LateSkipPattern {
	fromHour: number
	latePlanned: number
	lateSkipped: number
	earlyPlanned: number
	earlySkipped: number
}

/**
 * "What you plan late in the day is what gets skipped" — the actionable sentence, because it says
 * something about the plan rather than the person. Needs the base rate: a user who plans mostly in the
 * evening also skips mostly in the evening, and that alone says nothing.
 *
 * Every split in `LATE_SPLIT_HOURS` that clears all floors is a true statement; the one shown is the
 * one with the highest late skip rate, the earliest on a tie (it covers more of the user's tasks).
 * Rates are compared by cross-multiplying, so an earlier half with no skips at all needs no special case.
 */
export function lateSkipPattern(byStartHour: SkipHourCount[]): LateSkipPattern | null {
	let best: LateSkipPattern | null = null
	for (const fromHour of LATE_SPLIT_HOURS) {
		// `fromHour` becomes the first hour that actually has late tasks: with nothing planned 17–19, the
		// 17:00 split describes the same tasks as the 20:00 one, and "from 17:00 on" would name an hour
		// the user never planned anything in.
		const pattern: LateSkipPattern = {
			fromHour: 24,
			latePlanned: 0,
			lateSkipped: 0,
			earlyPlanned: 0,
			earlySkipped: 0,
		}
		for (const { hour, plannedCount, skippedCount } of byStartHour) {
			if (hour >= fromHour) {
				pattern.fromHour = Math.min(pattern.fromHour, hour)
				pattern.latePlanned += plannedCount
				pattern.lateSkipped += skippedCount
			} else {
				pattern.earlyPlanned += plannedCount
				pattern.earlySkipped += skippedCount
			}
		}
		if (!clearsFloors(pattern)) continue
		if (best === null || pattern.lateSkipped * best.latePlanned > best.lateSkipped * pattern.latePlanned)
			best = pattern
	}
	return best
}

function clearsFloors(p: LateSkipPattern): boolean {
	return (
		p.latePlanned >= LATE_MIN_PLANNED &&
		p.lateSkipped >= LATE_MIN_SKIPPED &&
		p.earlyPlanned >= EARLY_MIN_PLANNED &&
		// lateSkipped / latePlanned >= FACTOR * earlySkipped / earlyPlanned, without the division.
		p.lateSkipped * p.earlyPlanned >= LATE_RATE_FACTOR * p.earlySkipped * p.latePlanned
	)
}
