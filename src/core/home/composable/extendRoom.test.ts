import { describe, expect, it } from 'vitest'
import { Time } from '@/_common/dto/dto/Time.ts'
import { type DayBlock, extendableMinutes, extendSteps } from '@/core/home/composable/extendRoom.ts'

/**
 * Home's "give it longer" against the lane rule: at most two blocks of a kind at any minute, so an extension
 * stops where it would make a third — and only the added stretch counts.
 */

function block(id: number, start: string, end: string, isBackground = false): DayBlock {
	return { id, startTime: at(start), endTime: at(end), isBackground }
}

function at(hhmm: string): Time {
	const [hours, minutes] = hhmm.split(':').map(Number)
	return Time.fromMinutes(hours! * 60 + minutes!)
}

describe('extendableMinutes', () => {
	it('gives the whole extension when the time after the block is free', () => {
		const task = block(1, '10:00', '11:00')
		expect(extendableMinutes(task, 30, [task])).toBe(30)
	})

	it('allows running into one other block, which then sits beside it', () => {
		const task = block(1, '10:00', '11:00')
		expect(extendableMinutes(task, 30, [task, block(2, '11:00', '12:00')])).toBe(30)
	})

	it('stops where the extension would be a third block', () => {
		const task = block(1, '10:00', '11:00')
		const day = [task, block(2, '11:00', '12:00'), block(3, '11:20', '12:00')]
		expect(extendableMinutes(task, 30, day)).toBe(20)
	})

	it('has no room when two blocks already start where it ends', () => {
		const task = block(1, '10:00', '11:00')
		const day = [task, block(2, '11:00', '12:00'), block(3, '11:00', '11:30')]
		expect(extendableMinutes(task, 15, day)).toBe(0)
	})

	it('ignores blocks of the other kind', () => {
		const task = block(1, '10:00', '11:00')
		const day = [task, block(2, '11:00', '12:00', true), block(3, '11:00', '12:00', true)]
		expect(extendableMinutes(task, 30, day)).toBe(30)
	})

	it('judges a background block against background blocks', () => {
		const task = block(1, '10:00', '11:00', true)
		const day = [task, block(2, '11:00', '12:00', true), block(3, '11:10', '12:00', true)]
		expect(extendableMinutes(task, 30, day)).toBe(10)
	})

	it('still extends a block that is already in a clash, where the extension itself is free', () => {
		const task = block(1, '10:00', '11:00')
		const day = [task, block(2, '10:00', '11:00'), block(3, '10:00', '11:00')]
		expect(extendableMinutes(task, 15, day)).toBe(15)
	})

	it('stops at 23:59 and never wraps', () => {
		const task = block(1, '23:00', '23:50')
		expect(extendableMinutes(task, 30, [task])).toBe(9)
	})

	it('has no room for a block that already wraps past midnight', () => {
		const task = block(1, '23:00', '01:00')
		expect(extendableMinutes(task, 15, [task])).toBe(0)
	})
})

describe('extendSteps', () => {
	it('offers every option when there is room', () => {
		const task = block(1, '10:00', '11:00')
		expect(extendSteps(task, [15, 30], [task])).toEqual([15, 30])
	})

	it('caps the longer option and drops the repeat when both cap alike', () => {
		const task = block(1, '10:00', '11:00')
		const capped = [task, block(2, '11:00', '12:00'), block(3, '11:20', '12:00')]
		expect(extendSteps(task, [15, 30], capped)).toEqual([15, 20])
		const tight = [task, block(2, '11:00', '12:00'), block(3, '11:10', '12:00')]
		expect(extendSteps(task, [15, 30], tight)).toEqual([10])
	})

	it('offers nothing when there is no room at all', () => {
		const task = block(1, '10:00', '11:00')
		const day = [task, block(2, '11:00', '12:00'), block(3, '11:00', '12:00')]
		expect(extendSteps(task, [15, 30], day)).toEqual([])
	})
})
