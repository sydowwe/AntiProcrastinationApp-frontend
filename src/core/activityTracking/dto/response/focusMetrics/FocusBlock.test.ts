import { describe, expect, it } from 'vitest'
import { FocusBlock } from '@/core/activityTracking/dto/response/focusMetrics/FocusBlock.ts'

describe('FocusBlock.fromJson', () => {
	it('parses both instants', () => {
		const block = FocusBlock.fromJson({
			label: 'Rider',
			startedAt: '2026-09-28T09:10:00Z',
			endedAt: '2026-09-28T10:50:00Z',
			seconds: 6000,
		})
		expect(block.startedAt.toISOString()).toBe('2026-09-28T09:10:00.000Z')
		expect(block.endedAt.toISOString()).toBe('2026-09-28T10:50:00.000Z')
	})

	// `new Date(null)` is the epoch, a valid date the strip would print as a real 1970 time.
	it.each([
		['null', { startedAt: null, endedAt: null }],
		['omitted', {}],
	])('a %s time is invalid, not the epoch', (_, times) => {
		const block = FocusBlock.fromJson({ label: 'Rider', seconds: 6000, ...times })
		expect(Number.isNaN(block.startedAt.getTime())).toBe(true)
		expect(Number.isNaN(block.endedAt.getTime())).toBe(true)
	})
})
