import { computed, toValue, type ComputedRef, type MaybeRefOrGetter } from 'vue'
import type { HistoryPieChartResponse } from '@/core/historyDashboard/dto/response/HistoryPieChartResponse.ts'
import type { HistoryPieChartItem } from '@/core/historyDashboard/dto/response/HistoryPieChartItem.ts'
import type { HistoryTimeOfDayResponse } from '@/core/historyDashboard/dto/response/HistoryTimeOfDayResponse.ts'
import type { HistoryTimeOfDayHour } from '@/core/historyDashboard/dto/response/HistoryTimeOfDayHour.ts'
import { isHistoryOtherRollup } from '@/core/historyDashboard/dto/HistoryGroupKey.ts'

/**
 * The dashboard's three panels render the period faithfully and conclude nothing about it. This derives
 * the small set of statements that are *not* readable off them (H10).
 *
 * Three of the four come out of the pie-chart response the summary view already holds. The fourth — where
 * in the day the time lands — comes from `summary/time-of-day`, which exists precisely because the only
 * other client-side source of that shape is the stacked-bars response, whose bucket width and daily
 * clipping are both chart controls the user moves. Nothing here changes when a control moves.
 *
 * Every insight has a data threshold below which it is not emitted **at all** — never emitted with a
 * hedge. A conclusion drawn from four entries is not a weaker conclusion, it is a wrong one.
 *
 * Deliberately non-judgemental: these state what the numbers are and name no target, no streak and no
 * score. Same reasoning the todo module used for having no points or badges — Deci, Koestner & Ryan
 * (1999); see `prompts/todo-motivation/README.md`.
 */

/** Under this many entries in the period, "per entry" is an average of noise. */
export const MIN_PERIOD_ENTRIES = 10
/** …and under an hour of logged time it describes a period the user did not really use the app for. */
export const MIN_PERIOD_SECONDS = 3600

/** Per-group thresholds: enough entries for a mean to mean anything, over enough time to be worth naming. */
export const MIN_GROUP_ENTRIES = 6
export const MIN_GROUP_SECONDS = 1800

/**
 * "The most fragmented of two" is not a finding. Three qualifying groups is the point at which the
 * superlative carries information, and it is checked *after* the volume filters above.
 */
export const MIN_COMPARABLE_GROUPS = 3

/**
 * How far a group's mean entry length has to sit from the reference mean before it is worth a sentence.
 * Without a required gap the extremes of any list qualify, and the surface would state a ranking of
 * near-identical numbers as if it were a pattern.
 */
export const FRAGMENTED_MAX_RATIO = 0.6
export const STRETCH_MIN_RATIO = 1.6

/**
 * Under this many days with something logged, "when in the day you work" is a description of two days,
 * not of a rhythm.
 *
 * It needs no `CustomRange` special case, and never did: the threshold counts days that *have* data,
 * which the backend reports directly. B3 has since made `CustomRange` honour `endDate` on all four
 * `summary/` endpoints, so a custom range now reaches four the same way a named range does and the
 * insight appears there too — with no change here.
 */
export const MIN_DAYS_WITH_ACTIVITY = 4

/** The share of the period a band of hours has to hold before it is called a concentration. */
export const CONCENTRATION_SHARE = 0.5

/**
 * …and how wide that band may be. A flat day needs 12 of the 24 hours to hold half the time, so six is a
 * 2× margin over flat — the "required margin before a concentration is called one".
 *
 * The band is found, not chosen: the hours are never pre-folded into morning/afternoon/evening. A coarse
 * bucket cannot state a fact finer than itself, which is the whole objection that got this endpoint built
 * instead of a client-side fold, and it applies to re-widening on the client just as much.
 */
export const MAX_CONCENTRATION_HOURS = 6

const HOURS_IN_DAY = 24

export type HistoryInsightKind = 'sessionLength' | 'timeOfDay' | 'mostFragmented' | 'longestStretches'

/** How long one entry ran on average across the whole period — the ratio no panel shows. */
export interface HistorySessionLengthInsight {
	kind: 'sessionLength'
	totalSeconds: number
	entries: number
	meanSeconds: number
}

/** One group singled out by how its time arrives: in many short entries, or in few long ones. */
export interface HistoryGroupPaceInsight {
	kind: 'mostFragmented' | 'longestStretches'
	name: string
	totalSeconds: number
	entries: number
	meanSeconds: number
}

/** The narrowest band of hours holding at least `CONCENTRATION_SHARE` of the period. */
export interface HistoryTimeOfDayInsight {
	kind: 'timeOfDay'
	/** 0–23, in the user's zone. The band runs from here up to (but not including) `endHour`, wrapping midnight. */
	startHour: number
	endHour: number
	/** Seconds inside the band, and its share of the period as a 0–1 fraction. */
	windowSeconds: number
	share: number
	/**
	 * How often the band was used: days with anything logged in it, out of the days the range covers
	 * (OP21). `null` from an API that does not send `days`, and the sentence then states the share alone.
	 */
	frequency: { daysInBand: number; daysInRange: number } | null
}

/**
 * One stated conclusion, as numbers. Formatting and wording are the component's — the sentences carry
 * interpolated values and are one locale key each, never assembled from parts.
 */
export type HistoryInsight = HistorySessionLengthInsight | HistoryGroupPaceInsight | HistoryTimeOfDayInsight

function meanSecondsOf(item: HistoryPieChartItem): number {
	return item.totalSeconds / item.entries
}

/**
 * How long one entry ran, on average, across the whole period.
 *
 * The pie panel prints the total time and the total entry count as two separate rows; their ratio —
 * the difference between four hours in six sittings and four hours in forty — is nowhere on screen.
 * `totals` covers the period regardless of the `maxItems` cap applied to `items`.
 */
function derivePeriodSessionLength(data: HistoryPieChartResponse): HistoryInsight | null {
	const { totalSeconds, totalEntries } = data.totals
	if (totalEntries < MIN_PERIOD_ENTRIES || totalSeconds < MIN_PERIOD_SECONDS) return null
	return {
		kind: 'sessionLength',
		totalSeconds,
		entries: totalEntries,
		meanSeconds: totalSeconds / totalEntries,
	}
}

/** Picks the candidate with the lowest/highest mean, breaking a tie towards the group with more time behind it. */
function pickExtreme(candidates: HistoryPieChartItem[], prefer: 'lowest' | 'highest'): HistoryPieChartItem {
	return candidates.reduce((best, item) => {
		const bestMean = meanSecondsOf(best)
		const itemMean = meanSecondsOf(item)
		if (itemMean === bestMean) return item.totalSeconds > best.totalSeconds ? item : best
		return (prefer === 'lowest' ? itemMean < bestMean : itemMean > bestMean) ? item : best
	})
}

/**
 * The two ends of the same measurement: which group arrives in many short entries, and which arrives in
 * few long ones.
 *
 * The reference both are compared against is the mean over the *candidate* groups only, not the period
 * total — so a group is called fragmented relative to like-sized groups rather than relative to a
 * number the roll-up bucket and every sub-threshold sliver helped set.
 */
function deriveGroupPace(data: HistoryPieChartResponse): HistoryInsight[] {
	// The pie chart's roll-up bucket is present only when the response was capped at `maxItems`, and
	// stands for an unknown number of real groups at once. Its own entry count is therefore not one
	// group's, and its presence means the group list is not the whole period — so both per-group insights
	// stand down rather than claim a superlative over a truncated set.
	if (data.items.some(isHistoryOtherRollup)) return []

	const candidates = data.items.filter(
		item => item.entries >= MIN_GROUP_ENTRIES && item.totalSeconds >= MIN_GROUP_SECONDS,
	)
	if (candidates.length < MIN_COMPARABLE_GROUPS) return []

	const candidateSeconds = candidates.reduce((sum, item) => sum + item.totalSeconds, 0)
	const candidateEntries = candidates.reduce((sum, item) => sum + item.entries, 0)
	const referenceMean = candidateSeconds / candidateEntries

	const shortest = pickExtreme(candidates, 'lowest')
	const longest = pickExtreme(candidates, 'highest')
	if (shortest === longest) return []

	const insights: HistoryInsight[] = []
	if (meanSecondsOf(shortest) <= referenceMean * FRAGMENTED_MAX_RATIO) {
		insights.push({
			kind: 'mostFragmented',
			name: shortest.name,
			totalSeconds: shortest.totalSeconds,
			entries: shortest.entries,
			meanSeconds: meanSecondsOf(shortest),
		})
	}
	if (meanSecondsOf(longest) >= referenceMean * STRETCH_MIN_RATIO) {
		insights.push({
			kind: 'longestStretches',
			name: longest.name,
			totalSeconds: longest.totalSeconds,
			entries: longest.entries,
			meanSeconds: meanSecondsOf(longest),
		})
	}
	return insights
}

/**
 * The narrowest run of consecutive hours holding at least half the period, or null if half the period
 * needs more than `MAX_CONCENTRATION_HOURS` to reach — which is what a day with no shape looks like.
 *
 * The scan wraps midnight, because a band that runs 22:00–02:00 is one stretch of the user's evening and
 * not two. Shorter wins; an equal-length tie goes to whichever holds more.
 */
function findConcentrationBand(
	hours: HistoryTimeOfDayHour[],
	totalSeconds: number,
): { startHour: number; hourCount: number; seconds: number } | null {
	const target = totalSeconds * CONCENTRATION_SHARE
	let best: { startHour: number; hourCount: number; seconds: number } | null = null

	for (let start = 0; start < HOURS_IN_DAY; start++) {
		let seconds = 0
		for (let hourCount = 1; hourCount <= MAX_CONCENTRATION_HOURS; hourCount++) {
			seconds += hours[(start + hourCount - 1) % HOURS_IN_DAY]!.totalSeconds
			if (seconds < target) continue
			// Every longer band from this start also clears the target and is by definition worse.
			if (!best || hourCount < best.hourCount || (hourCount === best.hourCount && seconds > best.seconds)) {
				best = { startHour: hours[start]!.hour, hourCount, seconds }
			}
			break
		}
	}
	return best
}

/** The calendar day before a `YYYY-MM-DD` string. Read and printed in UTC, so no zone can shift it. */
function previousDate(date: string): string {
	const day = new Date(`${date}T00:00:00Z`)
	day.setUTCDate(day.getUTCDate() - 1)
	return day.toISOString().slice(0, 10)
}

/**
 * On how many days the band was used (OP21). "Most of your time is 9–11" can come from three long days,
 * and this tells a habit from a few marathons.
 *
 * A band that wraps midnight counts *nights*, not calendar days. Otherwise one 22:00–02:00 session would
 * count twice, once on each side of midnight. A night is named by the day its evening falls on, so an
 * hour after midnight counts towards the day before.
 *
 * That can name the day before the range: a record starting at 00:30 on its first day reads as the
 * previous night. The count is therefore capped at `daysInRange`. It can only exceed it by that one day.
 */
function countBandDays(
	data: HistoryTimeOfDayResponse,
	startHour: number,
	hourCount: number,
): { daysInBand: number; daysInRange: number } | null {
	if (!data.days || data.daysInRange <= 0) return null

	const lateHours = Math.min(hourCount, HOURS_IN_DAY - startHour)
	const lateMask = ((1 << lateHours) - 1) << startHour
	const earlyMask = (1 << (hourCount - lateHours)) - 1

	const nights = new Set<string>()
	for (const day of data.days) {
		if (day.hourMask & lateMask) nights.add(day.date)
		if (day.hourMask & earlyMask) nights.add(previousDate(day.date))
	}
	return { daysInBand: Math.min(nights.size, data.daysInRange), daysInRange: data.daysInRange }
}

/**
 * Where in the day the period's time lands, at hour resolution and independent of every chart control.
 *
 * The band itself is a *share*, which slice of the clock holds half the period's time. A share is
 * scale-free, so `daysInRange` cannot move it. `daysInRange` is read only for the frequency next to it
 * ("on 12 of 30 days"), which is a separate claim with its own source, `days`.
 */
function deriveTimeOfDay(data: HistoryTimeOfDayResponse): HistoryInsight | null {
	// The contract guarantees 24 ordered elements; this reads them by position and neither sorts nor pads.
	// A short array is a broken contract, not something to paper over with a partial answer.
	if (data.hours.length !== HOURS_IN_DAY) return null
	if (data.daysWithActivity < MIN_DAYS_WITH_ACTIVITY) return null

	const totalSeconds = data.hours.reduce((sum, hour) => sum + hour.totalSeconds, 0)
	if (totalSeconds < MIN_PERIOD_SECONDS) return null

	const band = findConcentrationBand(data.hours, totalSeconds)
	if (!band) return null

	return {
		kind: 'timeOfDay',
		startHour: band.startHour,
		endHour: (band.startHour + band.hourCount) % HOURS_IN_DAY,
		windowSeconds: band.seconds,
		share: band.seconds / totalSeconds,
		frequency: countBandDays(data, band.startHour, band.hourCount),
	}
}

/** Pure core, so the thresholds above can be exercised against hand-computed fixtures. */
export function deriveHistoryInsights(
	pieChart: HistoryPieChartResponse | null,
	timeOfDay: HistoryTimeOfDayResponse | null,
): HistoryInsight[] {
	const insights: HistoryInsight[] = []

	if (pieChart) {
		const sessionLength = derivePeriodSessionLength(pieChart)
		if (sessionLength) insights.push(sessionLength)
	}
	if (timeOfDay) {
		const concentration = deriveTimeOfDay(timeOfDay)
		if (concentration) insights.push(concentration)
	}
	if (pieChart) insights.push(...deriveGroupPace(pieChart))

	return insights
}

export function useHistoryInsights(
	pieChart: MaybeRefOrGetter<HistoryPieChartResponse | null>,
	timeOfDay: MaybeRefOrGetter<HistoryTimeOfDayResponse | null>,
): ComputedRef<HistoryInsight[]> {
	return computed(() => deriveHistoryInsights(toValue(pieChart), toValue(timeOfDay)))
}
