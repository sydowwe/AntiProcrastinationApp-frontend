import { describe, expect, it } from 'vitest'
import { assignLanes, collisionsOf, exceedsLaneLimit, type LaneSpan } from '@/core/dayPlanner/utils/plannerLanes.ts'

/**
 * The lane rule the day grid draws with and every grid gesture checks against: at most two blocks of a
 * kind at any minute, side by side, and a third kept visible as a clash rather than hidden.
 */

function fg(id: number, start: number, end: number): LaneSpan {
	return { id, start, end, isBackground: false }
}

function bg(id: number, start: number, end: number): LaneSpan {
	return { id, start, end, isBackground: true }
}

describe('assignLanes', () => {
	it('keeps the full width for blocks that overlap nothing', () => {
		const lanes = assignLanes([fg(1, 0, 60), fg(2, 60, 120)])
		expect(lanes.get(1)).toMatchObject({ lane: 0, laneCount: 1, clash: false, overlapsWith: [] })
		expect(lanes.get(2)).toMatchObject({ lane: 0, laneCount: 1, clash: false, overlapsWith: [] })
	})

	it('puts two overlapping blocks side by side, the earlier one on the left', () => {
		const lanes = assignLanes([fg(2, 30, 90), fg(1, 0, 60)])
		expect(lanes.get(1)).toMatchObject({ lane: 0, laneCount: 2, overlapsWith: [2] })
		expect(lanes.get(2)).toMatchObject({ lane: 1, laneCount: 2, overlapsWith: [1] })
	})

	it('gives the longer block lane 0 when two start together', () => {
		const lanes = assignLanes([fg(1, 0, 30), fg(2, 0, 90)])
		expect(lanes.get(2)!.lane).toBe(0)
		expect(lanes.get(1)!.lane).toBe(1)
	})

	it('halves a whole overlap group, and reuses a lane once it frees up', () => {
		// 1 overlaps 2, 2 overlaps 3, 1 and 3 do not: one group, 3 goes back into lane 0.
		const lanes = assignLanes([fg(1, 0, 60), fg(2, 30, 120), fg(3, 90, 150), fg(4, 200, 260)])
		expect([1, 2, 3].map(id => lanes.get(id)!.lane)).toEqual([0, 1, 0])
		expect([1, 2, 3].map(id => lanes.get(id)!.laneCount)).toEqual([2, 2, 2])
		expect(lanes.get(4)).toMatchObject({ lane: 0, laneCount: 1 })
	})

	it('marks a third block as a clash instead of hiding it, and does not let it spread', () => {
		const lanes = assignLanes([fg(1, 0, 120), fg(2, 0, 60), fg(3, 30, 90), fg(4, 60, 120)])
		expect(lanes.get(3)).toMatchObject({ lane: 1, clash: true })
		// 4 starts as 2 ends, so lane 1 is free again; the clash did not claim it.
		expect(lanes.get(4)).toMatchObject({ lane: 1, clash: false })
		expect(lanes.get(1)!.clash).toBe(false)
		expect(lanes.get(2)!.clash).toBe(false)
	})

	it('lanes foreground and background separately', () => {
		const lanes = assignLanes([fg(1, 0, 60), fg(2, 0, 60), bg(3, 0, 60), bg(4, 30, 90)])
		expect(lanes.get(1)).toMatchObject({ lane: 0, laneCount: 2, clash: false })
		expect(lanes.get(2)).toMatchObject({ lane: 1, laneCount: 2, clash: false })
		expect(lanes.get(3)).toMatchObject({ lane: 0, laneCount: 2 })
		expect(lanes.get(4)).toMatchObject({ lane: 1, laneCount: 2 })
	})

	it('tells a foreground block how many background strips to clear', () => {
		const lanes = assignLanes([fg(1, 0, 60), fg(2, 100, 160), fg(3, 300, 360), bg(10, 0, 200), bg(11, 150, 250)])
		// 10 and 11 form one two-lane group, so 1 clears both strips even where only 10 runs beside it.
		expect(lanes.get(1)!.backgroundLanes).toBe(2)
		expect(lanes.get(2)!.backgroundLanes).toBe(2)
		expect(lanes.get(3)!.backgroundLanes).toBe(0)

		const single = assignLanes([fg(1, 0, 60), bg(10, 0, 200)])
		expect(single.get(1)!.backgroundLanes).toBe(1)
	})

	it('orders every block by time, which is the focus order', () => {
		const lanes = assignLanes([fg(3, 120, 180), bg(2, 30, 300), fg(1, 0, 60)])
		expect([1, 2, 3].map(id => lanes.get(id)!.order)).toEqual([0, 1, 2])
	})

	it('treats a zero-length block as overlapping nothing', () => {
		const lanes = assignLanes([fg(1, 0, 60), fg(2, 30, 30)])
		expect(lanes.get(1)).toMatchObject({ laneCount: 1, overlapsWith: [] })
		expect(lanes.get(2)).toMatchObject({ lane: 0, laneCount: 1, clash: false })
	})
})

describe('exceedsLaneLimit', () => {
	it('allows a second overlapping block', () => {
		expect(exceedsLaneLimit([fg(1, 0, 60), fg(2, 30, 90)], new Set([2]))).toBe(false)
	})

	it('refuses a third block at the same minute', () => {
		expect(exceedsLaneLimit([fg(1, 0, 60), fg(2, 0, 60), fg(3, 30, 90)], new Set([3]))).toBe(true)
	})

	it('allows a block that overlaps two others at different minutes', () => {
		// 1 and 2 never meet, so the new block shares each minute with only one of them.
		expect(exceedsLaneLimit([fg(1, 0, 60), fg(2, 60, 120), fg(3, 30, 90)], new Set([3]))).toBe(false)
	})

	it('treats touching ends as no overlap', () => {
		expect(exceedsLaneLimit([fg(1, 0, 60), fg(2, 60, 120), fg(3, 60, 120)], new Set([3]))).toBe(false)
		expect(exceedsLaneLimit([fg(1, 0, 60), fg(2, 0, 60), fg(3, 60, 120)], new Set([3]))).toBe(false)
	})

	it('counts each kind on its own', () => {
		expect(exceedsLaneLimit([fg(1, 0, 60), fg(2, 0, 60), bg(3, 0, 60)], new Set([3]))).toBe(false)
		expect(exceedsLaneLimit([bg(1, 0, 60), bg(2, 0, 60), bg(3, 0, 60)], new Set([3]))).toBe(true)
	})

	it('checks moved blocks against each other too', () => {
		// Two selected blocks moved together onto one that is already there.
		expect(exceedsLaneLimit([fg(1, 0, 60), fg(2, 0, 60), fg(3, 0, 60)], new Set([2, 3]))).toBe(true)
	})

	it('ignores a clash the move does not touch', () => {
		const day = [fg(1, 0, 60), fg(2, 0, 60), fg(3, 0, 60), fg(4, 200, 260)]
		expect(exceedsLaneLimit(day, new Set([4]))).toBe(false)
	})
})

describe('collisionsOf', () => {
	it('names the blocks of the same kind it shares a minute with, in time order', () => {
		const candidate = fg(0, 30, 90)
		const day = [fg(2, 60, 120), fg(1, 0, 45), bg(3, 0, 200), fg(4, 90, 120), candidate]
		expect(collisionsOf(candidate, day).map(s => s.id)).toEqual([1, 2])
	})
})
