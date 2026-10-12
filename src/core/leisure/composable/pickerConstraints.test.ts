import { describe, expect, it } from 'vitest'
import { MIN_SLOT_MINUTES, slotMinutesFor } from '@/core/leisure/composable/pickerConstraints.ts'

// The ranking these tests used to sit beside moved server-side in F2-04; its cases now live in the API's
// LeisureDrawRankerTests. Slot sizing stays here because the client decides the slot at commit time.

describe('slotMinutesFor', () => {
	it('never books longer than the user said they had', () => {
		expect(slotMinutesFor({ maxUsefulMinutes: 20 * 60 }, { minutes: 120 })).toBe(120)
	})

	it('books the stated duration when it is shorter than the time available', () => {
		expect(slotMinutesFor({ maxUsefulMinutes: 45 }, { minutes: 120 })).toBe(45)
	})

	it('sizes an entry with no duration to the whole ask', () => {
		expect(slotMinutesFor({ maxUsefulMinutes: null }, { minutes: 240 })).toBe(240)
	})

	it('never books an unplannably short slot', () => {
		expect(slotMinutesFor({ maxUsefulMinutes: 1 }, { minutes: 60 })).toBe(MIN_SLOT_MINUTES)
	})
})
