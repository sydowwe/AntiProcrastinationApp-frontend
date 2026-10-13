import { describe, expect, it } from 'vitest'
import { computed, ref } from 'vue'
import { Time } from '@/_common/dto/dto/Time.ts'
import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
import { NEW_TASK_ID, useDayPlannerCommon } from '@/core/dayPlanner/composable/useDayPlannerCommon.ts'

/**
 * The lane rule on the grid's own axis: minutes from the view start, so a view that runs past midnight
 * (the default is 07:30 → 01:30) sees a 23:30–00:30 block and a 00:00–01:00 block as overlapping.
 */

function task(id: number, start: string, end: string, isBackground = false): PlannerTask {
	return { id, startTime: Time.fromString(start), endTime: Time.fromString(end), isBackground } as PlannerTask
}

function setup(tasks: PlannerTask[]) {
	const slotMinutes = ref(10)
	// 07:30 → 01:30 in 10-minute rows.
	const rows = computed(() => (18 * 60) / slotMinutes.value)
	return useDayPlannerCommon(ref(new Time(7, 30)), rows, ref(tasks), slotMinutes)
}

function newBlock(start: string, end: string) {
	return { id: NEW_TASK_ID, startTime: Time.fromString(start), endTime: Time.fromString(end), isBackground: false }
}

describe('useDayPlannerCommon lanes', () => {
	it('lanes two blocks that overlap across midnight', () => {
		const { taskLanes } = setup([task(1, '23:30', '00:30'), task(2, '00:00', '01:00')])
		expect(taskLanes.value.get(1)).toMatchObject({ lane: 0, laneCount: 2 })
		expect(taskLanes.value.get(2)).toMatchObject({ lane: 1, laneCount: 2 })
	})

	it('does not read an early-morning block as the end of the view', () => {
		// 07:00–08:00 starts before the 07:30 view; it must meet the 07:30 block, not the 01:00 one.
		const { taskLanes } = setup([task(1, '07:00', '08:00'), task(2, '07:30', '08:00'), task(3, '01:00', '01:30')])
		expect(taskLanes.value.get(1)!.overlapsWith).toEqual([2])
		expect(taskLanes.value.get(3)!.laneCount).toBe(1)
	})

	it('allows a second block and refuses a third', () => {
		const { exceedsLaneLimit, laneCollisions } = setup([task(1, '09:00', '10:00'), task(2, '09:30', '10:30')])
		expect(exceedsLaneLimit([newBlock('08:00', '09:30')])).toBe(false)
		expect(exceedsLaneLimit([newBlock('09:40', '09:50')])).toBe(true)
		expect(laneCollisions(newBlock('09:40', '09:50')).map(t => t.id)).toEqual([1, 2])
	})

	it('leaves the moved task itself out of the day', () => {
		const { exceedsLaneLimit } = setup([task(1, '09:00', '10:00'), task(2, '09:00', '10:00')])
		const moved = { ...task(2, '09:15', '10:15') }
		expect(exceedsLaneLimit([moved])).toBe(false)
	})

	it('counts only tasks with the requested id sign', () => {
		// A template preview (negative ids) laid over the real day does not block a real move.
		const { exceedsLaneLimit } = setup([
			task(1, '09:00', '10:00'),
			task(-5, '09:00', '10:00'),
			task(-6, '09:00', '10:00'),
		])
		expect(exceedsLaneLimit([newBlock('09:00', '10:00')], { sign: 1 })).toBe(false)
		expect(exceedsLaneLimit([newBlock('09:00', '10:00')])).toBe(true)
	})

	it('excludes the ids it is told to', () => {
		const { exceedsLaneLimit } = setup([task(1, '09:00', '10:00'), task(2, '09:00', '10:00')])
		expect(exceedsLaneLimit([newBlock('09:00', '10:00')], { excludeIds: new Set([2]) })).toBe(false)
	})
})
