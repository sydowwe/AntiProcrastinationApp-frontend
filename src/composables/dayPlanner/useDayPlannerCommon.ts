import type {Time} from '@/utils/Time.ts'
import type {ComputedRef, Ref} from 'vue'
import {type IBasePlannerTask} from '@/dtos/response/activityPlanning/IBasePlannerTask.ts';
import type {IBasePlannerTaskRequest} from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts';

/**
 * Base task type for grid positioning with Date-based spans
 */

/**
 * Shared logic for day planner
 * Handles grid positioning, time calculations, and conflict detection for Date-based tasks
 */
export function useDayPlannerCommon<T extends IBasePlannerTask<TTaskRequest>, TTaskRequest extends IBasePlannerTaskRequest>(
	viewStartTime: Ref<Time>,
	totalGridRows: ComputedRef<number>,
	tasks: Ref<T[]>
) {
	// --- Helpers: Time-based calculations (day-agnostic with midnight wrap support) ---
	const MINUTES_IN_DAY = 1440

	function minutesFromViewStart(t: Time): number {
		// Normalize into [0, 1440)
		const start = viewStartTime.value.getInMinutes
		const m = t.getInMinutes
		return (m - start + MINUTES_IN_DAY) % MINUTES_IN_DAY
	}

	function segmentizeRange(startM: number, endM: number): Array<{ s: number, e: number }> {
		// Returns one or two segments within [0, 1440) representing the range.
		// If end < start => wraps over midnight, split into two segments.
		if (endM >= startM) return [{s: startM, e: endM}]
		return [
			{s: 0, e: endM},
			{s: startM, e: MINUTES_IN_DAY}
		]
	}

	function rangesOverlapTime(aStart: Time, aEnd: Time, bStart: Time, bEnd: Time): boolean {
		const aSegs = segmentizeRange(aStart.getInMinutes, aEnd.getInMinutes)
		const bSegs = segmentizeRange(bStart.getInMinutes, bEnd.getInMinutes)

		// Check any segment overlap
		return aSegs.some(a => bSegs.some(b => (a.s < b.e && a.e > b.s)))
	}


	/**
	 * Check if date ranges overlap with background tasks
	 */
	function checkOverlapsBackground(task: T): boolean {
		return tasks.value.some(backgroundTask => {
			if (!backgroundTask.isBackground)
				return false

			if (backgroundTask.startTime && backgroundTask.endTime) {
				return rangesOverlapTime(backgroundTask.startTime, backgroundTask.endTime, task.startTime, task.endTime)
			}
		})
	}

	/**
	 * Check for task conflicts (non-background tasks)
	 */
	function checkConflict(taskToCheck: T): boolean {
		return tasks.value.some(task => {
			if (task.id === taskToCheck.id || task.isBackground)
				return false

			if (task.startTime && task.endTime) {
				return rangesOverlapTime(task.startTime, task.endTime, taskToCheck.startTime, taskToCheck.endTime)
			}
		})
	}

	/**
	 * Update overlapping background flags for all tasks that overlap with the given background task
	 */
	function updateIsDuringBackgroundFlags(backgroundTask: T): void {
		tasks.value.forEach(task => {
			if (task.isBackground) return

			if (task.startTime && task.endTime) {
				if (rangesOverlapTime(task.startTime, task.endTime, backgroundTask.startTime, backgroundTask.endTime)) {
					task.isDuringBackgroundTask = true
				}
				return
			}
		})
	}

	/**
	 * Initialize grid positions for all tasks
	 */
	function initializeTaskGridPositions(): void {
		tasks.value.forEach(task => {
			setGridPositionFromSpan(task)
			if (task.isBackground)
				return
			task.isDuringBackgroundTask = checkOverlapsBackground(task)
		})
	}

	/**
	 * Calculate grid position from time span
	 */
	function setGridPositionFromSpan(task: T): void {
		const startOffset = minutesFromViewStart(task.startTime) // [0, 1440)
		let endOffset = minutesFromViewStart(task.endTime) // [0, 1440)

		// If wraps over midnight, extend end by a full day to keep duration positive
		if (task.endTime.getInMinutes < task.startTime.getInMinutes) {
			endOffset += MINUTES_IN_DAY
		}

		const startRow = Math.floor(startOffset / 10) + 1
		const endRow = Math.floor(endOffset / 10) + 1

		task.gridRowStart = startRow >= endRow ? 1 : startRow
		task.gridRowEnd = Math.min(totalGridRows.value + 1, endRow)
	}

	/**
	 * Handle task span updates
	 */
	function redrawTask(taskId: number, updates: Partial<T>): void {
		const taskIndex = tasks.value.findIndex(e => e.id === taskId)
		if (taskIndex === -1) return

		if (!tasks.value[taskIndex]) {
			return
		}
		tasks.value[taskIndex] = {
			...tasks.value[taskIndex],
			...updates
		}

		const task = tasks.value[taskIndex]
		if (updates.startTime || updates.endTime) {
			if (task.startTime && task.endTime) {
				task.isDuringBackgroundTask = checkOverlapsBackground(task)
			}
		}
	}

	return {
		checkOverlapsBackground,
		checkConflict,
		updateIsDuringBackgroundFlags,
		initializeTaskGridPositions,
		setGridPositionFromSpan,
		redrawTask
	}
}