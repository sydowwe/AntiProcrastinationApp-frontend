import { describe, expect, it } from 'vitest'
import { DayOfWeek } from '@/_common/dto/enum/DayOfWeek.ts'
import { isDailyRoutine, isRoutineSuggestedOn } from '@/core/todoList/dto/response/routine/routineSuggestedDay.ts'
import type { RoutineSuggestionFields } from '@/core/todoList/dto/response/routine/routineSuggestedDay.ts'

function item(
	lengthInDays: number,
	fields: Partial<Omit<RoutineSuggestionFields, 'timePeriod'>> = {},
): RoutineSuggestionFields {
	return { suggestedDays: [], suggestedDayOfMonth: null, ...fields, timePeriod: { lengthInDays } }
}

// 2026-09-29 is a Tuesday.
const TUESDAY = '2026-09-29'

describe('daily', () => {
	it('is suggested every day, with nothing set', () => {
		expect(isRoutineSuggestedOn(item(1), TUESDAY)).toBe(true)
		expect(isDailyRoutine(item(1))).toBe(true)
	})

	it('ignores stray weekly or monthly fields', () => {
		expect(
			isRoutineSuggestedOn(item(1, { suggestedDays: [DayOfWeek.Friday], suggestedDayOfMonth: 3 }), TUESDAY),
		).toBe(true)
	})
})

describe('weekly', () => {
	const gym = item(7, { suggestedDays: [DayOfWeek.Tuesday, DayOfWeek.Thursday] })

	it('is suggested on a listed weekday', () => {
		expect(isRoutineSuggestedOn(gym, TUESDAY)).toBe(true)
		expect(isRoutineSuggestedOn(gym, '2026-10-01')).toBe(true)
	})

	it('is not suggested on an unlisted weekday', () => {
		expect(isRoutineSuggestedOn(gym, '2026-09-28')).toBe(false)
		expect(isRoutineSuggestedOn(gym, '2026-10-04')).toBe(false)
	})

	it('reads Sunday as Sunday, not as day 0 of a Monday-first week', () => {
		expect(isRoutineSuggestedOn(item(7, { suggestedDays: [DayOfWeek.Sunday] }), '2026-10-04')).toBe(true)
	})

	it('is suggested on no day with no days set', () => {
		expect(isRoutineSuggestedOn(item(7), TUESDAY)).toBe(false)
	})

	it('uses the weekday field up to a 14-day period', () => {
		expect(isRoutineSuggestedOn(item(14, { suggestedDays: [DayOfWeek.Tuesday] }), TUESDAY)).toBe(true)
		expect(isRoutineSuggestedOn(item(14, { suggestedDayOfMonth: 29 }), TUESDAY)).toBe(false)
	})

	it('is not daily', () => {
		expect(isDailyRoutine(gym)).toBe(false)
	})
})

describe('monthly', () => {
	const rent = item(30, { suggestedDayOfMonth: 3 })

	it('is suggested on its day of month and no other', () => {
		expect(isRoutineSuggestedOn(rent, '2026-10-03')).toBe(true)
		expect(isRoutineSuggestedOn(rent, '2026-10-04')).toBe(false)
	})

	it('ignores the weekday field', () => {
		expect(isRoutineSuggestedOn(item(30, { suggestedDays: [DayOfWeek.Tuesday] }), TUESDAY)).toBe(false)
	})

	it('is suggested on no day with no day set', () => {
		expect(isRoutineSuggestedOn(item(30), TUESDAY)).toBe(false)
	})

	describe('a day the month does not have lands on its last day', () => {
		const the31st = item(30, { suggestedDayOfMonth: 31 })

		it('the 31st is September 30th', () => {
			expect(isRoutineSuggestedOn(the31st, '2026-09-30')).toBe(true)
			expect(isRoutineSuggestedOn(the31st, '2026-09-29')).toBe(false)
		})

		it('the 31st is still the 31st in a 31-day month, and only then', () => {
			expect(isRoutineSuggestedOn(the31st, '2026-10-31')).toBe(true)
			expect(isRoutineSuggestedOn(the31st, '2026-10-30')).toBe(false)
		})

		it('the 30th is February 28th, or 29th in a leap year', () => {
			const the30th = item(30, { suggestedDayOfMonth: 30 })
			expect(isRoutineSuggestedOn(the30th, '2027-02-28')).toBe(true)
			expect(isRoutineSuggestedOn(the30th, '2028-02-28')).toBe(false)
			expect(isRoutineSuggestedOn(the30th, '2028-02-29')).toBe(true)
		})

		it('does not move a day the month does have', () => {
			expect(isRoutineSuggestedOn(item(30, { suggestedDayOfMonth: 29 }), '2028-02-28')).toBe(false)
			expect(isRoutineSuggestedOn(item(30, { suggestedDayOfMonth: 28 }), '2028-02-28')).toBe(true)
		})
	})
})
