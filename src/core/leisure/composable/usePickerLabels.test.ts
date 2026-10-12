import { describe, expect, it } from 'vitest'
import { calendarDaysBetween } from '@/core/leisure/composable/usePickerLabels.ts'

// Instants at midday UTC, so the calendar day is the same in any zone within ±11 h of UTC — the test does not
// depend on the machine it runs on.
describe('calendarDaysBetween', () => {
	it('counts calendar days, not 24-hour spans', () => {
		expect(calendarDaysBetween(new Date('2026-10-09T12:00:00Z'), new Date('2026-10-12T12:00:00Z'))).toBe(3)
	})

	it('is zero on the same day', () => {
		expect(calendarDaysBetween(new Date('2026-10-12T11:00:00Z'), new Date('2026-10-12T13:00:00Z'))).toBe(0)
	})

	it('never goes negative for evidence a moment in the future', () => {
		expect(calendarDaysBetween(new Date('2026-10-13T12:00:00Z'), new Date('2026-10-12T12:00:00Z'))).toBe(0)
	})
})
