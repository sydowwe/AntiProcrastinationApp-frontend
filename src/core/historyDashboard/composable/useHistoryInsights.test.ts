import { describe, expect, it } from 'vitest'
import { HistoryPieChartItem } from '@/core/historyDashboard/dto/response/HistoryPieChartItem.ts'
import { HistoryPieChartResponse } from '@/core/historyDashboard/dto/response/HistoryPieChartResponse.ts'
import { HistoryPieTotals } from '@/core/historyDashboard/dto/response/HistoryPieTotals.ts'
import { HistoryTimeOfDayHour } from '@/core/historyDashboard/dto/response/HistoryTimeOfDayHour.ts'
import { HistoryTimeOfDayResponse } from '@/core/historyDashboard/dto/response/HistoryTimeOfDayResponse.ts'
import { HistoryTimeOfDayDay } from '@/core/historyDashboard/dto/response/HistoryTimeOfDayDay.ts'
import { deriveHistoryInsights } from '@/core/historyDashboard/composable/useHistoryInsights.ts'

/**
 * The insight thresholds, against fixtures whose answers are computed by hand in the comments.
 *
 * This is the check the H10 prompt asks for. The numbers a user would see on screen come from a live
 * backend this repo does not contain, so "verify against the raw records" is done here instead: every
 * expectation below is arithmetic anyone can redo from the fixture, and the suppression cases are the
 * point — an insight that fires one entry below its threshold is the failure this file exists to catch.
 *
 * The hour fixtures are per-hour totals stated directly. None of them encodes how the server splits a
 * record across an hour boundary, so none of them can disagree with the server about it — the rule is
 * documented on `HistoryTimeOfDayHour` and applied there, not re-derived here.
 */

function item(name: string, groupId: number | null, totalSeconds: number, entries: number): HistoryPieChartItem {
	return new HistoryPieChartItem(groupId, name, totalSeconds, null, entries)
}

/** Totals default to the item sums, which is what the backend sends for an uncapped response. */
function pie(items: HistoryPieChartItem[], totals?: HistoryPieTotals): HistoryPieChartResponse {
	return new HistoryPieChartResponse(
		items,
		totals ??
			new HistoryPieTotals(
				items.reduce((sum, i) => sum + i.totalSeconds, 0),
				items.reduce((sum, i) => sum + i.entries, 0),
				items.length,
			),
	)
}

/** 24 buckets in order, seconds for the hours named and zero for the rest — the shape the contract guarantees. */
function timeOfDay(
	secondsByHour: Record<number, number>,
	daysWithActivity = 5,
	daysInRange = 7,
	days: HistoryTimeOfDayDay[] | null = null,
): HistoryTimeOfDayResponse {
	const hours = Array.from({ length: 24 }, (_, hour) => new HistoryTimeOfDayHour(hour, secondsByHour[hour] ?? 0, 0))
	return new HistoryTimeOfDayResponse(hours, daysInRange, daysWithActivity, days)
}

/** One day's hour mask from the hours it touched. */
function day(date: string, ...hours: number[]): HistoryTimeOfDayDay {
	return new HistoryTimeOfDayDay(
		date,
		hours.reduce((mask, hour) => mask | (1 << hour), 0),
	)
}

// Mail 3600/60 = 60s · Coding 14400/6 = 2400s · Reading 3600/10 = 360s · Calls 3600/12 = 300s
// candidates 25200s over 88 entries → reference mean 286.36s
// fragmented cutoff 286.36 × 0.6 = 171.8 → Mail (60) qualifies
// stretch cutoff    286.36 × 1.6 = 458.2 → Coding (2400) qualifies
const MIXED_PERIOD = [
	item('Mail', 1, 3600, 60),
	item('Coding', 2, 14400, 6),
	item('Reading', 3, 3600, 10),
	item('Calls', 4, 3600, 12),
]

// 3600 s in each of 09, 10 and 11, then 600 s in each of 14…19. Total 14400 s, half of it 7200 s.
// No single hour reaches 7200, and 09+10 does exactly — so the band is two hours from 09:00.
const CONCENTRATED_MORNING = { 9: 3600, 10: 3600, 11: 3600, 14: 600, 15: 600, 16: 600, 17: 600, 18: 600, 19: 600 }

// 3600 s in each of 22, 23, 00 and 01, then 2000 s in each of 08…13. Total 26400 s, half of it 13200 s.
// Three night hours reach only 10800, so the band is the four hours from 22:00, across midnight.
const NIGHT_OWL = { 22: 3600, 23: 3600, 0: 3600, 1: 3600, 8: 2000, 9: 2000, 10: 2000, 11: 2000, 12: 2000, 13: 2000 }

describe('deriveHistoryInsights', () => {
	it('returns nothing without either response', () => {
		expect(deriveHistoryInsights(null, null)).toEqual([])
	})

	it('orders the period-level statements ahead of the two group ones', () => {
		const insights = deriveHistoryInsights(pie(MIXED_PERIOD), timeOfDay(CONCENTRATED_MORNING))
		expect(insights.map(i => i.kind)).toEqual(['sessionLength', 'timeOfDay', 'mostFragmented', 'longestStretches'])
	})

	describe('the period mean', () => {
		it('is stated from the period totals, not the sum of the capped item list', () => {
			// The `maxItems` cap trims `items`; `totals` still describes the whole period.
			const insights = deriveHistoryInsights(pie(MIXED_PERIOD, new HistoryPieTotals(36000, 100, 40)), null)
			expect(insights[0]).toMatchObject({
				kind: 'sessionLength',
				totalSeconds: 36000,
				entries: 100,
				meanSeconds: 360,
			})
		})

		it('is withheld one entry below the entry threshold', () => {
			// 9 entries, an hour of time: over the seconds threshold, under the entry one.
			const insights = deriveHistoryInsights(pie(MIXED_PERIOD, new HistoryPieTotals(3600, 9, 4)), null)
			expect(insights.map(i => i.kind)).not.toContain('sessionLength')
		})

		it('is withheld one second below the time threshold', () => {
			const insights = deriveHistoryInsights(pie(MIXED_PERIOD, new HistoryPieTotals(3599, 88, 4)), null)
			expect(insights.map(i => i.kind)).not.toContain('sessionLength')
		})
	})

	describe('the time-of-day band', () => {
		it('names the narrowest run of hours holding half the period', () => {
			const insights = deriveHistoryInsights(null, timeOfDay(CONCENTRATED_MORNING))
			expect(insights).toEqual([
				{ kind: 'timeOfDay', startHour: 9, endHour: 11, windowSeconds: 7200, share: 0.5, frequency: null },
			])
		})

		it('runs across midnight rather than reporting two bands', () => {
			// 3600 s in each of 22, 23 and 00, plus 300 s in each of 08…13. Total 12600, half 6300.
			// 22+23 is the first two-hour run to clear it; no single hour does.
			const insights = deriveHistoryInsights(
				null,
				timeOfDay({ 22: 3600, 23: 3600, 0: 3600, 8: 300, 9: 300, 10: 300, 11: 300, 12: 300, 13: 300 }),
			)
			expect(insights[0]).toMatchObject({ kind: 'timeOfDay', startHour: 22, endHour: 0, windowSeconds: 7200 })
		})

		it('says nothing about a day with no shape', () => {
			// 600 s in every hour: half the day's time needs twelve hours, twice the widest band allowed.
			const flat = Object.fromEntries(Array.from({ length: 24 }, (_, hour) => [hour, 600]))
			expect(deriveHistoryInsights(null, timeOfDay(flat))).toEqual([])
		})

		it('is withheld one day below the days-with-activity threshold', () => {
			expect(deriveHistoryInsights(null, timeOfDay(CONCENTRATED_MORNING, 3))).toEqual([])
		})

		it('is withheld one second below the time threshold', () => {
			expect(deriveHistoryInsights(null, timeOfDay({ 9: 3599 }))).toEqual([])
		})

		it('stands down rather than answer from a short hours array', () => {
			const short = new HistoryTimeOfDayResponse(
				Array.from({ length: 23 }, (_, hour) => new HistoryTimeOfDayHour(hour, 3600, 0)),
				7,
				5,
			)
			expect(deriveHistoryInsights(null, short)).toEqual([])
		})

		it('states a share, so the band does not move with daysInRange', () => {
			// The insight is scale-free by construction — band seconds over total seconds — so the number
			// of days those seconds are spread across cannot reach it. Pinned because the response carries
			// `daysInRange` right next to the data, and a per-day reading of it would be a different claim.
			const asWeek = deriveHistoryInsights(null, timeOfDay(CONCENTRATED_MORNING, 5, 7))
			const asCustomRange = deriveHistoryInsights(null, timeOfDay(CONCENTRATED_MORNING, 5, 2))
			expect(asCustomRange).toEqual(asWeek)
		})
	})

	describe('how often the band was used (OP21)', () => {
		it('counts the days that touched any hour of the band, out of the days in the range', () => {
			// Band 09–11 (hours 9 and 10). The 1st and 2nd touch it, the 3rd only at 08 and 11 (outside both
			// ends), the 4th at 10 only. Three of seven.
			const days = [
				day('2026-10-01', 9, 10),
				day('2026-10-02', 10, 14),
				day('2026-10-03', 8, 11),
				day('2026-10-04', 10),
			]
			const [insight] = deriveHistoryInsights(null, timeOfDay(CONCENTRATED_MORNING, 5, 7, days))
			expect(insight).toMatchObject({
				kind: 'timeOfDay',
				startHour: 9,
				frequency: { daysInBand: 3, daysInRange: 7 },
			})
		})

		it('counts a night once when the band wraps midnight', () => {
			const days = [
				// One night running 22:30 on the 1st to 00:30 on the 2nd: one night, not two. The 2nd also has
				// an evening of its own (23).
				day('2026-10-01', 22, 23),
				day('2026-10-02', 0, 23),
				// The 4th has only an after-midnight hour: the night of the 3rd.
				day('2026-10-04', 1),
			]
			const [insight] = deriveHistoryInsights(null, timeOfDay(NIGHT_OWL, 5, 7, days))
			expect(insight).toMatchObject({ startHour: 22, endHour: 2, frequency: { daysInBand: 3, daysInRange: 7 } })
		})

		it('never claims more days than the range has', () => {
			// Every day's 00:30 reads as the night before, so the first one names the day before the range.
			const days = ['01', '02', '03', '04'].map(d => day(`2026-10-${d}`, 0, 22))
			const [insight] = deriveHistoryInsights(null, timeOfDay(NIGHT_OWL, 4, 4, days))
			expect(insight).toMatchObject({ frequency: { daysInBand: 4, daysInRange: 4 } })
		})

		it('steps back across a month boundary', () => {
			// 00:30 on 1 Oct is the night of 30 Sep, the same night as the 30th's 23:00.
			const days = [day('2026-09-30', 23), day('2026-10-01', 0)]
			const [insight] = deriveHistoryInsights(null, timeOfDay(NIGHT_OWL, 4, 7, days))
			expect(insight).toMatchObject({ frequency: { daysInBand: 1 } })
		})

		it('falls back to the share alone when the API does not send days', () => {
			const [insight] = deriveHistoryInsights(null, timeOfDay(CONCENTRATED_MORNING, 5, 7, null))
			expect(insight).toMatchObject({ kind: 'timeOfDay', frequency: null })
		})

		it('reads days from the wire, and an absent field as not sent', () => {
			const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, totalSeconds: 0, entries: 0 }))
			const sent = HistoryTimeOfDayResponse.fromJson({
				hours,
				daysInRange: 7,
				daysWithActivity: 1,
				days: [{ date: '2026-10-01', hourMask: 512 }],
			})
			expect(sent.days).toEqual([new HistoryTimeOfDayDay('2026-10-01', 512)])
			expect(HistoryTimeOfDayResponse.fromJson({ hours, daysInRange: 7, daysWithActivity: 1 }).days).toBeNull()
		})
	})

	describe('the two group insights', () => {
		it('name both ends of the spread', () => {
			const insights = deriveHistoryInsights(pie(MIXED_PERIOD), null)
			expect(insights[1]).toMatchObject({
				kind: 'mostFragmented',
				name: 'Mail',
				totalSeconds: 3600,
				entries: 60,
				meanSeconds: 60,
			})
			expect(insights[2]).toMatchObject({
				kind: 'longestStretches',
				name: 'Coding',
				totalSeconds: 14400,
				entries: 6,
				meanSeconds: 2400,
			})
		})

		it('stand down when the response was capped, since the superlative would cover part of the period', () => {
			const insights = deriveHistoryInsights(pie([...MIXED_PERIOD, item('_other', null, 7200, 40)]), null)
			expect(insights.map(i => i.kind)).toEqual(['sessionLength'])
		})

		it('treat Uncategorized as a real bucket rather than a roll-up', () => {
			// Same shape as Mail above: null groupId, but one bucket the user can actually act on.
			const items = [item('Uncategorized', null, 3600, 60), ...MIXED_PERIOD.slice(1)]
			expect(deriveHistoryInsights(pie(items), null)[1]).toMatchObject({
				kind: 'mostFragmented',
				name: 'Uncategorized',
			})
		})

		it('stand down below three comparable groups', () => {
			// Reading drops out on entries, Calls on seconds — two candidates left, so no superlative.
			const items = [
				item('Mail', 1, 3600, 60),
				item('Coding', 2, 14400, 6),
				item('Reading', 3, 3600, 5),
				item('Calls', 4, 1799, 12),
			]
			expect(deriveHistoryInsights(pie(items), null).map(i => i.kind)).toEqual(['sessionLength'])
		})

		it('stand down when the extremes sit close to the reference mean', () => {
			// 3000/10 = 300 · 3200/10 = 320 · 3400/10 = 340, reference 9600/30 = 320.
			// cutoffs are 192 and 512 — neither end is anywhere near them.
			const items = [item('P', 1, 3000, 10), item('Q', 2, 3200, 10), item('R', 3, 3400, 10)]
			expect(deriveHistoryInsights(pie(items), null).map(i => i.kind)).toEqual(['sessionLength'])
		})

		it('fire independently — one end can be a finding while the other is not', () => {
			// Mail 3600/60 = 60 · Reading 3000/20 = 150 · Calls 3000/20 = 150.
			// reference 9600/100 = 96 · cutoffs 57.6 and 153.6 — neither end clears its own.
			const neither = [item('Mail', 1, 3600, 60), item('Reading', 2, 3000, 20), item('Calls', 3, 3000, 20)]
			expect(deriveHistoryInsights(pie(neither), null).map(i => i.kind)).toEqual(['sessionLength'])

			// Mail 1800/30 = 60 · Reading 6000/20 = 300 · Calls 6000/20 = 300.
			// reference 13800/70 = 197.14 · cutoffs 118.29 and 315.43 — only the bottom end clears.
			const fragmented = [item('Mail', 1, 1800, 30), item('Reading', 2, 6000, 20), item('Calls', 3, 6000, 20)]
			expect(deriveHistoryInsights(pie(fragmented), null).map(i => i.kind)).toEqual([
				'sessionLength',
				'mostFragmented',
			])
		})

		it('break a tie towards the group with more time behind it', () => {
			// X 3600/10 and Y 7200/20 are both 360s/entry; Z is 18000/6 = 3000.
			// reference 28800/36 = 800 · cutoffs 480 and 1280.
			const items = [item('X', 1, 3600, 10), item('Y', 2, 7200, 20), item('Z', 3, 18000, 6)]
			const insights = deriveHistoryInsights(pie(items), null)
			expect(insights[1]).toMatchObject({ kind: 'mostFragmented', name: 'Y' })
			expect(insights[2]).toMatchObject({ kind: 'longestStretches', name: 'Z' })
		})

		it('never name the same group as both ends', () => {
			// Three identical groups: min and max are the same row, and neither end is a finding.
			const items = [item('X', 1, 3600, 10), item('Y', 2, 3600, 10), item('Z', 3, 3600, 10)]
			expect(deriveHistoryInsights(pie(items), null).map(i => i.kind)).toEqual(['sessionLength'])
		})
	})
})
