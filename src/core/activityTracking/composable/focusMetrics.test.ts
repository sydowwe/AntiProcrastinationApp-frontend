import { describe, expect, it } from 'vitest'
import { FOCUS_BLOCK_TOLERANCE_SECONDS, computeFocusMetrics } from '@/core/activityTracking/composable/focusMetrics.ts'
import { TimelineSessionDto } from '@/core/activityTracking/dto/response/timeline/TimelineSessionDto.ts'

const DAY = '2026-08-19T'

let nextId = 1

/** `09:00` → a session on `label` running to `end`, with `durationSeconds` derived from the two. */
function session(label: string, start: string, end: string): TimelineSessionDto {
	const startedAt = new Date(`${DAY}${start}:00`)
	const endedAt = new Date(`${DAY}${end}:00`)
	const seconds = (endedAt.getTime() - startedAt.getTime()) / 1000
	return new TimelineSessionDto(nextId++, label, startedAt, endedAt, seconds, seconds)
}

describe('computeFocusMetrics', () => {
	it('returns null when there is nothing to describe', () => {
		expect(computeFocusMetrics([])).toBeNull()
	})

	describe('switchCount', () => {
		it('counts every change of foreground item', () => {
			const metrics = computeFocusMetrics([
				session('a.com', '09:00', '09:10'),
				session('b.com', '09:10', '09:20'),
				session('a.com', '09:20', '09:30'),
			])
			expect(metrics?.switchCount).toBe(2)
		})

		it('does not count a run the tracker split into several records', () => {
			const metrics = computeFocusMetrics([
				session('a.com', '09:00', '09:10'),
				session('a.com', '09:10', '09:20'),
				session('a.com', '09:20', '09:30'),
			])
			expect(metrics?.switchCount).toBe(0)
		})

		it('is not gap-tolerant, unlike the block measure', () => {
			// The same three sessions the block measure reads as one unbroken hour: a glance short
			// enough to leave the block intact is still honestly two movements of attention.
			const metrics = computeFocusMetrics([
				session('a.com', '09:00', '09:30'),
				session('b.com', '09:30', '09:31'),
				session('a.com', '09:31', '10:00'),
			])
			expect(metrics?.switchCount).toBe(2)
			expect(metrics?.longestBlock?.seconds).toBe(3600)
		})

		it('sorts before counting, so response order cannot change the answer', () => {
			const metrics = computeFocusMetrics([
				session('a.com', '09:20', '09:30'),
				session('a.com', '09:00', '09:10'),
				session('a.com', '09:10', '09:20'),
			])
			expect(metrics?.switchCount).toBe(0)
		})
	})

	describe('longestBlock', () => {
		it('survives an interruption shorter than the tolerance', () => {
			const metrics = computeFocusMetrics([
				session('a.com', '09:00', '09:30'),
				session('b.com', '09:30', '09:31'),
				session('a.com', '09:31', '10:00'),
			])
			expect(metrics?.longestBlock?.label).toBe('a.com')
			expect(metrics?.longestBlock?.seconds).toBe(3600)
		})

		it('is broken by an interruption longer than the tolerance', () => {
			const metrics = computeFocusMetrics([
				session('a.com', '09:00', '09:30'),
				session('b.com', '09:30', '09:40'),
				session('a.com', '09:40', '10:00'),
			])
			expect(metrics?.longestBlock?.label).toBe('a.com')
			expect(metrics?.longestBlock?.seconds).toBe(1800)
		})

		it('treats an untracked pause the same as a short detour', () => {
			const metrics = computeFocusMetrics([
				session('a.com', '09:00', '09:30'),
				session('a.com', '09:31', '10:00'),
			])
			expect(metrics?.longestBlock?.seconds).toBe(3600)
		})

		it('does not shorten a run with a session contained inside it', () => {
			const metrics = computeFocusMetrics([
				session('a.com', '09:00', '10:00'),
				session('a.com', '09:15', '09:20'),
			])
			expect(metrics?.longestBlock?.seconds).toBe(3600)
		})

		it('reports the longest run across all items, not the first one seen', () => {
			const metrics = computeFocusMetrics([
				session('a.com', '09:00', '09:20'),
				session('b.com', '09:20', '10:30'),
			])
			expect(metrics?.longestBlock?.label).toBe('b.com')
		})

		it('uses exactly the tolerance the constant names', () => {
			const withinTolerance = computeFocusMetrics([
				session('a.com', '09:00', '09:30'),
				session('a.com', '09:32', '10:00'),
			])
			expect(withinTolerance?.longestBlock?.seconds).toBe(3600)
			expect(FOCUS_BLOCK_TOLERANCE_SECONDS).toBe(120)
		})
	})

	describe('medianSessionSeconds', () => {
		it('takes the middle value of an odd count', () => {
			const metrics = computeFocusMetrics([
				session('a.com', '09:00', '09:01'),
				session('b.com', '09:01', '09:11'),
				session('c.com', '09:11', '10:11'),
			])
			expect(metrics?.medianSessionSeconds).toBe(600)
		})

		it('averages the two middle values of an even count', () => {
			const metrics = computeFocusMetrics([
				session('a.com', '09:00', '09:01'),
				session('b.com', '09:01', '09:03'),
				session('c.com', '09:03', '09:07'),
				session('d.com', '09:07', '09:17'),
			])
			expect(metrics?.medianSessionSeconds).toBe(180)
		})

		it('is not dragged up by one very long session, unlike a mean', () => {
			const metrics = computeFocusMetrics([
				session('a.com', '09:00', '09:01'),
				session('b.com', '09:01', '09:02'),
				session('c.com', '09:02', '09:03'),
				session('d.com', '09:03', '17:03'),
			])
			expect(metrics?.medianSessionSeconds).toBe(60)
		})
	})

	describe('longestGapSeconds', () => {
		it('reports the largest interval between two sessions', () => {
			const metrics = computeFocusMetrics([
				session('a.com', '09:00', '09:10'),
				session('b.com', '09:25', '09:30'),
				session('c.com', '10:30', '10:40'),
			])
			expect(metrics?.longestGapSeconds).toBe(3600)
		})

		it('is null when the sessions are continuous', () => {
			const metrics = computeFocusMetrics([
				session('a.com', '09:00', '09:10'),
				session('b.com', '09:10', '09:20'),
			])
			expect(metrics?.longestGapSeconds).toBeNull()
		})

		it('is null for a single session, which has no interior gap', () => {
			const metrics = computeFocusMetrics([session('a.com', '09:00', '09:10')])
			expect(metrics?.longestGapSeconds).toBeNull()
		})

		it('ignores the edges — the unfinished rest of a day is not a break', () => {
			// Nothing before 14:00 and nothing after 14:20; the only gap is the interior one.
			const metrics = computeFocusMetrics([
				session('a.com', '14:00', '14:05'),
				session('b.com', '14:15', '14:20'),
			])
			expect(metrics?.longestGapSeconds).toBe(600)
		})

		it('does not see a gap behind an overlapping session', () => {
			const metrics = computeFocusMetrics([
				session('a.com', '09:00', '10:00'),
				session('b.com', '09:30', '09:40'),
				session('c.com', '09:50', '10:00'),
			])
			expect(metrics?.longestGapSeconds).toBeNull()
		})
	})
})
