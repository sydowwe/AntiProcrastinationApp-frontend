import { describe, expect, it } from 'vitest'
import { Time } from '@/_common/dto/dto/Time.ts'
import { PlannerTaskStatus } from '@/core/dayPlanner/dto/enum/PlannerTaskStatus.ts'
import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
import { OVERRUN_GRACE_MINUTES, overrunMinutes } from '@/core/dayPlanner/utils/overrunBlocks.ts'

/**
 * The day view's half of P1-04's overrun rule. It has to agree with the server's sweep, or the banner is missing
 * where the `PlannedBlockOverrun` notification lands — or up before the notification could have been sent.
 */

function block(start: string, end: string, overrides: Partial<PlannerTask> = {}): PlannerTask {
	return {
		id: 7,
		isBackground: false,
		status: PlannerTaskStatus.InProgress,
		startTime: Time.fromString(start),
		endTime: Time.fromString(end),
		...overrides,
	} as PlannerTask
}

function at(clock: string): number {
	return Time.fromString(clock).getInMinutes
}

describe('overrunMinutes', () => {
	it('counts from the planned end once the grace has passed', () => {
		expect(overrunMinutes(block('09:00', '10:00'), at('10:12'))).toBe(12)
	})

	it('starts exactly at the server grace, not before', () => {
		expect(OVERRUN_GRACE_MINUTES).toBe(5)
		expect(overrunMinutes(block('09:00', '10:00'), at('10:04'))).toBeNull()
		expect(overrunMinutes(block('09:00', '10:00'), at('10:05'))).toBe(5)
	})

	it('is silent for a block that was not started, or was already closed', () => {
		for (const status of [PlannerTaskStatus.NotStarted, PlannerTaskStatus.Completed, PlannerTaskStatus.Cancelled]) {
			expect(overrunMinutes(block('09:00', '10:00', { status }), at('11:00'))).toBeNull()
		}
	})

	it('ignores background blocks and template previews, as the sweep does', () => {
		expect(overrunMinutes(block('09:00', '10:00', { isBackground: true }), at('11:00'))).toBeNull()
		expect(overrunMinutes(block('09:00', '10:00', { id: -3 }), at('11:00'))).toBeNull()
	})

	it('reads an end before the start as the next day', () => {
		// 23:00–00:30 has half an hour left at 23:30. A naive compare would call it 23 hours over.
		expect(overrunMinutes(block('23:00', '00:30'), at('23:30'))).toBeNull()
	})
})
