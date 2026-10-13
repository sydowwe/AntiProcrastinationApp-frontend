import type { Time } from '@/_common/dto/dto/Time.ts'
import { computed, type ComputedRef, type Ref } from 'vue'
import { type AnyPlannerTask, type IBasePlannerTask } from '@/core/dayPlanner/dto/response/IBasePlannerTask.ts'
import type { IBasePlannerTaskRequest } from '@/core/dayPlanner/dto/request/IBasePlannerTaskRequest.ts'
import {
	assignLanes,
	collisionsOf,
	exceedsLaneLimit as spansExceedLaneLimit,
	type LaneSpan,
	type TaskLane,
} from '@/core/dayPlanner/utils/plannerLanes.ts'

/**
 * A block at a place it may be moved to: a task being dragged, resized, pasted or edited, or one that
 * does not exist yet (id `NEW_TASK_ID`).
 */
export interface LaneMove {
	id: number
	startTime: Time
	endTime: Time
	isBackground: boolean
}

/** The id a block being drawn or created has before the server gives it one. No task has id 0. */
export const NEW_TASK_ID = 0

export interface LaneCheckOptions {
	/** Tasks to leave out of the day, e.g. the clipboard's own preview copies. */
	excludeIds?: ReadonlySet<number>
	/**
	 * Only tasks whose id has this sign count. A template preview's tasks are negative ids laid over the
	 * real day, and moving a real task is not refused by them, nor the other way round.
	 */
	sign?: number
}

/**
 * Shared logic for day planner
 * Handles grid positioning, time calculations, and the lane rule (`utils/plannerLanes.ts`)
 *
 * The returned functions take `AnyPlannerTask`, not `T`: none of them read anything beyond the
 * shared task surface, and narrowing them to `T` is what made `IBaseDayPlannerStore` invariant in
 * its task type — see the comment on that interface. `T` still types the `tasks` list itself.
 */
export function useDayPlannerCommon<
	T extends IBasePlannerTask<TTaskRequest>,
	TTaskRequest extends IBasePlannerTaskRequest,
>(viewStartTime: Ref<Time>, totalGridRows: ComputedRef<number>, tasks: Ref<T[]>, timeSlotDuration: Ref<number>) {
	// --- Helpers: Time-based calculations (day-agnostic with midnight wrap support) ---
	const MINUTES_IN_DAY = 1440

	function minutesFromViewStart(t: Time): number {
		// Normalize into [0, 1440)
		const start = viewStartTime.value.getInMinutes
		const m = t.getInMinutes
		return (m - start + MINUTES_IN_DAY) % MINUTES_IN_DAY
	}

	function segmentizeRange(startM: number, endM: number): Array<{ s: number; e: number }> {
		// Returns one or two segments within [0, 1440) representing the range.
		// If end < start => wraps over midnight, split into two segments.
		if (endM >= startM) return [{ s: startM, e: endM }]
		return [
			{ s: 0, e: endM },
			{ s: startM, e: MINUTES_IN_DAY },
		]
	}

	/**
	 * A block on the view's own linear axis: minutes from `viewStartTime`, with a block that starts before
	 * the view (wrapped to the far end by the modulo) moved back to a negative start, and the end after
	 * the start even across midnight. This is the axis the grid draws on, so overlap here is overlap on
	 * screen.
	 */
	function laneSpanOf(block: LaneMove): LaneSpan {
		const viewDuration = totalGridRows.value * timeSlotDuration.value
		let start = minutesFromViewStart(block.startTime)
		if (start > viewDuration) start -= MINUTES_IN_DAY
		const duration = (block.endTime.getInMinutes - block.startTime.getInMinutes + MINUTES_IN_DAY) % MINUTES_IN_DAY
		return { id: block.id, start, end: start + duration, isBackground: block.isBackground }
	}

	/** Every task's lane, recomputed whenever a block moves, so a drag re-lanes its neighbours live. */
	const taskLanes = computed<Map<number, TaskLane>>(() => assignLanes(tasks.value.map(laneSpanOf)))

	function daySpans(moves: readonly LaneMove[], options: LaneCheckOptions): LaneSpan[] {
		const movedIds = new Set(moves.map(m => m.id))
		const others = tasks.value.filter(
			task =>
				!movedIds.has(task.id) &&
				!options.excludeIds?.has(task.id) &&
				(options.sign === undefined || Math.sign(task.id) === options.sign),
		)
		return [...others.map(laneSpanOf), ...moves.map(laneSpanOf)]
	}

	/**
	 * Whether putting `moves` where they say would leave three blocks of one kind at some minute. The one
	 * overlap test behind every grid gesture and the task dialog; it replaced four hand-written copies of
	 * "overlaps anything at all" when two side by side became allowed.
	 */
	function exceedsLaneLimit(moves: readonly LaneMove[], options: LaneCheckOptions = {}): boolean {
		return spansExceedLaneLimit(daySpans(moves, options), new Set(moves.map(m => m.id)))
	}

	/** The tasks `move` would share a minute with, in time order, for the dialog to name. */
	function laneCollisions(move: LaneMove, options: LaneCheckOptions = {}): AnyPlannerTask[] {
		const spans = daySpans([move], options)
		const own = spans[spans.length - 1]!
		return collisionsOf(own, spans)
			.map(span => tasks.value.find(task => task.id === span.id))
			.filter(task => task !== undefined)
	}

	/**
	 * Initialize grid positions for all tasks
	 */
	function initializeTaskGridPositions(): void {
		tasks.value.forEach(setGridPositionFromSpan)
	}

	/**
	 * Calculate grid position from time span
	 */
	function setGridPositionFromSpan(task: AnyPlannerTask): void {
		const viewDurationMinutes = totalGridRows.value * timeSlotDuration.value
		const viewStartMin = viewStartTime.value.getInMinutes
		const viewEndMin = (viewStartMin + viewDurationMinutes) % MINUTES_IN_DAY

		// Hide tasks that have no overlap with the visible time window
		const viewSegs = segmentizeRange(viewStartMin, viewEndMin)
		const taskSegs = segmentizeRange(task.startTime.getInMinutes, task.endTime.getInMinutes)
		const hasOverlap = viewSegs.some(v => taskSegs.some(t => v.s < t.e && v.e > t.s))
		if (!hasOverlap) {
			task.gridRowStart = 1
			task.gridRowEnd = 1
			return
		}

		let startOffset = minutesFromViewStart(task.startTime) // [0, 1440)
		let endOffset = minutesFromViewStart(task.endTime) // [0, 1440)

		// If wraps over midnight, extend end by a full day to keep duration positive
		if (task.endTime.getInMinutes < task.startTime.getInMinutes) {
			endOffset += MINUTES_IN_DAY
		}

		// If startOffset exceeds view duration, the task starts before viewStartTime (wrapped via modulo).
		// Clamp to 0 so it renders from the top of the visible grid instead of stretching it.
		if (startOffset > viewDurationMinutes) {
			startOffset = 0
		}

		const startRow = Math.floor(startOffset / timeSlotDuration.value) + 1
		const endRow = Math.floor(endOffset / timeSlotDuration.value) + 1

		task.gridRowStart = startRow >= endRow ? 1 : startRow
		task.gridRowEnd = Math.min(totalGridRows.value + 1, endRow)
	}

	/**
	 * Handle task span updates
	 */
	function redrawTask(taskId: number, updates: Partial<AnyPlannerTask>): void {
		const task = tasks.value.find(e => e.id === taskId)
		if (!task) return
		Object.assign(task, updates)
	}

	return {
		taskLanes,
		exceedsLaneLimit,
		laneCollisions,
		initializeTaskGridPositions,
		setGridPositionFromSpan,
		redrawTask,
	}
}
