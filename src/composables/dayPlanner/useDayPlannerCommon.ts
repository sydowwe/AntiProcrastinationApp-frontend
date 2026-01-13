import type {Time} from '@/utils/Time.ts'
import type {Ref} from 'vue'
import {type IBasePlannerTask} from '@/dtos/response/activityPlanning/IBasePlannerTask.ts';
import type {IBasePlannerTaskRequest} from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts';

/**
 * Base event type for grid positioning with Date-based spans
 */

/**
 * Shared logic for day planner
 * Handles grid positioning, time calculations, and conflict detection for Date-based events
 */
export function useDayPlannerCommon<T extends IBasePlannerTask<TTaskRequest>, TTaskRequest extends IBasePlannerTaskRequest>(
	viewStartTime: Ref<Time>,
	totalGridRows: Ref<number>,
	events: Ref<T[]>
) {
	// --- Helpers: Time-based calculations (day-agnostic with midnight wrap support) ---
	const MINUTES_IN_DAY = 1440


	function minutesFromViewStart(t: Time): number {
		// Normalize into [0, 1440)
		const start = viewStartTime.value.getInMinutes
		const m = t.getInMinutes
		const diff = (m - start + MINUTES_IN_DAY) % MINUTES_IN_DAY
		return diff
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
	 * Check if date ranges overlap with background events
	 */
	function checkOverlapsBackground(start: Time, end: Time): boolean {
		return events.value.some(event => {
			if (!event.isBackground) return false

			if (event.startTime && event.endTime) {
				return rangesOverlapTime(start, end, event.startTime, event.endTime)
			}
		})
	}

	/**
	 * Check for event conflicts (non-background events)
	 */
	function checkConflict(newStart: Time, newEnd: Time, currentEventId?: number): boolean {

		return events.value.some(event => {
			if (event.id === currentEventId || event.isBackground) return false

			if (event.startTime && event.endTime) {
				return rangesOverlapTime(newStart, newEnd, event.startTime, event.endTime)
			}
		})
	}

	/**
	 * Update overlapping background flags for all events
	 */
	function updateOverlapsBackgroundFlags(bgStart: Time, bgEnd: Time): void {

		events.value.forEach(event => {
			if (event.isBackground) return

			if (event.startTime && event.endTime) {
				if (rangesOverlapTime(event.startTime, event.endTime, bgStart, bgEnd)) {
					event.isDuringBackgroundEvent = true
				}
				return
			}
		})
	}

	/**
	 * Initialize grid positions for all events
	 */
	function initializeEventGridPositions(): void {
		events.value.forEach(event => {
			setGridPositionFromSpan(event)
			if (event.isBackground)
				return
			event.isDuringBackgroundEvent = checkOverlapsBackground(event.startTime, event.endTime)
		})
	}

	/**
	 * Calculate grid position from date span
	 */
	function setGridPositionFromSpan(event: T): void {
		// Prefer Time-based positioning if available; fallback to Date for compatibility
		if (event.startTime && event.endTime) {
			const startOffset = minutesFromViewStart(event.startTime) // [0, 1440)
			let endOffset = minutesFromViewStart(event.endTime) // [0, 1440)

			// If wraps over midnight, extend end by a full day to keep duration positive
			if (event.endTime.getInMinutes < event.startTime.getInMinutes) {
				endOffset += MINUTES_IN_DAY
			}

			const startRow = Math.floor(startOffset / 10) + 1
			const endRow = Math.floor(endOffset / 10) + 1

			event.gridRowStart = Math.max(1, startRow)
			event.gridRowEnd = Math.min(totalGridRows.value + 1, endRow)
			return
		}
	}

	/**
	 * Handle task span updates
	 */
	function redrawTask(eventId: number, updates: Partial<T>): void {
		const eventIndex = events.value.findIndex(e => e.id === eventId)
		if (eventIndex === -1) return

		if (!events.value[eventIndex]) {
			return
		}
		events.value[eventIndex] = {
			...events.value[eventIndex],
			...updates
		}

		const event = events.value[eventIndex]
		if (updates.startTime || updates.endTime) {
			if (event.startTime && event.endTime) {
				event.isDuringBackgroundEvent = checkOverlapsBackground(event.startTime, event.endTime)
			}
		}
	}

	return {
		checkOverlapsBackground,
		checkConflict,
		updateOverlapsBackgroundFlags,
		initializeEventGridPositions,
		setGridPositionFromSpan,
		redrawTask
	}
}