import { describe, expect, it } from 'vitest'
import { SkipHourCount } from '@/core/dayPlanner/dto/response/SkipSummary.ts'
import { lateSkipPattern, topSkipReason } from '@/core/dayPlanner/utils/skipRangeInsights.ts'
import type { SkipReasonSummary } from '@/core/dayPlanner/utils/skipReasonGroups.ts'

/**
 * The floors under the calendar's two skip sentences. Most of these assert *silence*: below a floor
 * the sentence is absent, never hedged.
 */

function summaryOf(counts: number[], withoutReasonCount = 0): SkipReasonSummary {
	const groups = counts.map((count, i) => ({ kind: 'text' as const, text: `r${i}`, count }))
	return { total: counts.reduce((a, b) => a + b, withoutReasonCount), groups, withoutReasonCount }
}

function hours(...rows: [hour: number, planned: number, skipped: number][]): SkipHourCount[] {
	return rows.map(([hour, planned, skipped]) => new SkipHourCount(hour, planned, skipped))
}

describe('topSkipReason', () => {
	it('names the largest reason once it has 3 skips and leads outright', () => {
		expect(topSkipReason(summaryOf([3, 1]))?.count).toBe(3)
	})

	it('is silent below 3', () => {
		expect(topSkipReason(summaryOf([2]))).toBeNull()
	})

	it('is silent on a tie', () => {
		expect(topSkipReason(summaryOf([4, 4]))).toBeNull()
	})

	it('never lets "no reason" compete, however many there are', () => {
		expect(topSkipReason(summaryOf([], 9))).toBeNull()
		expect(topSkipReason(summaryOf([3], 9))?.count).toBe(3)
	})
})

describe('lateSkipPattern', () => {
	it('finds the evening pattern from the B1 verification shape', () => {
		// Six tasks 20:00–22:00 with four skipped; ten before noon with none.
		const pattern = lateSkipPattern(hours([9, 10, 0], [20, 2, 2], [21, 2, 1], [22, 2, 1]))
		expect(pattern).toEqual({ fromHour: 20, latePlanned: 6, lateSkipped: 4, earlyPlanned: 10, earlySkipped: 0 })
	})

	it('names the first hour that has late tasks, not an empty boundary before it', () => {
		// Every split from 17 to 20 covers the same tasks; the sentence must say 20:00.
		expect(lateSkipPattern(hours([9, 10, 0], [20, 6, 4]))?.fromHour).toBe(20)
	})

	it('picks the split with the highest late rate', () => {
		// From 21:00 on: 4 of 5. From 18:00 on: 4 of 9 — true too, but weaker.
		const pattern = lateSkipPattern(hours([9, 10, 0], [18, 4, 0], [21, 4, 4], [22, 1, 0]))
		expect(pattern?.fromHour).toBe(21)
	})

	it('is silent when evening skips only mirror evening planning', () => {
		// Half of everything is skipped, morning and evening alike.
		expect(lateSkipPattern(hours([9, 10, 5], [20, 10, 5]))).toBeNull()
	})

	it('is silent below the floors', () => {
		expect(lateSkipPattern(hours([9, 10, 0], [20, 4, 4]))).toBeNull() // 4 planned late
		expect(lateSkipPattern(hours([9, 10, 0], [20, 6, 2]))).toBeNull() // 2 skipped late
		expect(lateSkipPattern(hours([9, 4, 0], [20, 6, 4]))).toBeNull() // 4 planned early
	})
})
