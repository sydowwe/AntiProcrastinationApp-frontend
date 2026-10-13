import { describe, expect, it } from 'vitest'
import { Time } from '@/_common/dto/dto/Time.ts'
import { isBlockPast } from '@/core/dayPlanner/utils/pastBlock.ts'

/** The day view dims a block once it is over — on the day it is planned for, not on today's date. */

const TODAY = '2026-10-13'

function past(viewed: string, start: string, end: string, now: string): boolean {
	return isBlockPast(viewed, Time.fromString(start), Time.fromString(end), TODAY, Time.fromString(now).getInMinutes)
}

describe('isBlockPast', () => {
	it('dims a block on today once its end has passed, not before', () => {
		expect(past(TODAY, '09:00', '10:00', '10:00')).toBe(true)
		expect(past(TODAY, '09:00', '10:00', '09:59')).toBe(false)
	})

	it('never dims a block on a future day, however early it ends', () => {
		// The defect: this read as past at 20:00 because 10:00 is earlier than 20:00.
		expect(past('2026-10-14', '09:00', '10:00', '20:00')).toBe(false)
	})

	it('dims every block on a past day, however late it ends', () => {
		expect(past('2026-10-12', '22:00', '23:30', '08:00')).toBe(true)
	})

	it('reads an end before the start as the next day', () => {
		// Yesterday 23:00–00:30 ends today at 00:30.
		expect(past('2026-10-12', '23:00', '00:30', '00:15')).toBe(false)
		expect(past('2026-10-12', '23:00', '00:30', '00:30')).toBe(true)
		// Today 23:00–00:30 ends tomorrow, so it is not over at 23:45.
		expect(past(TODAY, '23:00', '00:30', '23:45')).toBe(false)
	})

	it('crosses a month end', () => {
		expect(isBlockPast('2026-10-31', Time.fromString('23:00'), Time.fromString('01:00'), '2026-11-01', 30)).toBe(
			false,
		)
		expect(isBlockPast('2026-10-31', Time.fromString('23:00'), Time.fromString('01:00'), '2026-11-01', 60)).toBe(
			true,
		)
	})
})
