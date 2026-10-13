import { describe, expect, it } from 'vitest'
import { handoffSearchFloor, isStillPrefilledStart } from '@/core/dayPlanner/utils/handoffFreeSlot.ts'

describe('handoffSearchFloor', () => {
	it('rounds now up to the picker grid', () => {
		expect(handoffSearchFloor(20 * 60 + 9)).toBe(20 * 60 + 10)
		expect(handoffSearchFloor(20 * 60 + 11)).toBe(20 * 60 + 20)
	})

	it('keeps a minute already on the grid', () => {
		expect(handoffSearchFloor(20 * 60 + 20)).toBe(20 * 60 + 20)
	})

	it('reaches 1440 just before midnight rather than wrapping', () => {
		expect(handoffSearchFloor(23 * 60 + 55)).toBe(24 * 60)
	})
})

describe('isStillPrefilledStart', () => {
	it('treats the picker rounding the filled-in start as untouched', () => {
		// 20:15 from the server, shown as 20:20 by a 10-minute picker
		expect(isStillPrefilledStart(20 * 60 + 20, 20 * 60 + 15)).toBe(true)
	})

	it('treats a different start as the user choosing one', () => {
		expect(isStillPrefilledStart(9 * 60 + 30, 20 * 60 + 15)).toBe(false)
	})

	it('is false when there is nothing to compare', () => {
		expect(isStillPrefilledStart(null, 600)).toBe(false)
		expect(isStillPrefilledStart(600, null)).toBe(false)
	})
})
