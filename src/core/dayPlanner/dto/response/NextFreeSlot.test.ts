import { describe, expect, it } from 'vitest'
import { NextFreeSlot } from '@/core/dayPlanner/dto/response/NextFreeSlot.ts'

describe('NextFreeSlot.startMinutesOr', () => {
	it('uses the server slot when one was found', () => {
		const slot = NextFreeSlot.fromJson({
			date: '2026-10-12',
			minutes: 30,
			found: true,
			startTime: { hours: 14, minutes: 15 },
			endTime: { hours: 14, minutes: 45 },
		})
		expect(slot.startMinutesOr(600)).toBe(14 * 60 + 15)
	})

	it('keeps the fallback when the day has no room', () => {
		const slot = NextFreeSlot.fromJson({ date: '2026-10-12', minutes: 30, found: false })
		expect(slot.startMinutesOr(600)).toBe(600)
	})

	it('keeps the fallback when found but the start is missing', () => {
		const slot = NextFreeSlot.fromJson({ date: '2026-10-12', minutes: 30, found: true, startTime: null })
		expect(slot.startMinutesOr(600)).toBe(600)
	})
})
