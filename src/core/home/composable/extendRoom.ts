import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
import { exceedsLaneLimit, type LaneSpan } from '@/core/dayPlanner/utils/plannerLanes.ts'

/** The latest end a block may have: the server wants start before end, so an extension cannot wrap past midnight. */
const LAST_MINUTE_OF_DAY = 24 * 60 - 1

/** Never a real task id: the added stretch is checked as a block of its own. */
const EXTENSION_ID = -1

export type DayBlock = Pick<PlannerTask, 'id' | 'startTime' | 'endTime' | 'isBackground'>

/**
 * Today's blocks on one axis, minutes of the day, exactly as the server reads them: a block whose end is not
 * after its start overlaps nothing, on either side.
 */
function spanOf(block: DayBlock): LaneSpan {
	return {
		id: block.id,
		start: block.startTime.getInMinutes,
		end: block.endTime.getInMinutes,
		isBackground: block.isBackground,
	}
}

/**
 * How many of `minutes` "give it longer" can add to `task`: up to 23:59, and only as far as the block stays
 * one of at most two of its kind at every minute — the day grid's lane rule (`plannerLanes.ts`). 0 when there
 * is no room, or when the block already wraps past midnight.
 *
 * Only the added stretch is judged, as `useWrapUpBlock.extendableMinutes` does in the day view: a clash that
 * is already inside the block is not this extension's doing.
 */
export function extendableMinutes(task: DayBlock, minutes: number, dayTasks: readonly DayBlock[]): number {
	const start = task.startTime.getInMinutes
	const end = task.endTime.getInMinutes
	if (end <= start) return 0
	const spans = dayTasks.map(spanOf)
	let by = Math.max(0, Math.min(minutes, LAST_MINUTE_OF_DAY - end))
	while (by > 0 && extensionClashes(spans, task, end, by)) by--
	return by
}

function extensionClashes(spans: LaneSpan[], task: DayBlock, end: number, by: number): boolean {
	const extension: LaneSpan = { id: EXTENSION_ID, start: end, end: end + by, isBackground: task.isBackground }
	return exceedsLaneLimit([...spans, extension], new Set([EXTENSION_ID]))
}

/**
 * The extensions the task menu offers for `options`, each capped to the room there is, without repeats and
 * without a "+0". Two options capped to the same room would be two items doing one thing.
 */
export function extendSteps(task: DayBlock, options: readonly number[], dayTasks: readonly DayBlock[]): number[] {
	const steps: number[] = []
	for (const minutes of options) {
		const by = extendableMinutes(task, minutes, dayTasks)
		if (by > 0 && !steps.includes(by)) steps.push(by)
	}
	return steps
}
