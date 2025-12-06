import type {Time} from '@/utils/TimeUtils.ts'

/**
 * Shared logic for day planner views (both regular and template)
 * Handles grid positioning, time calculations, and common utilities
 */
export function useDayPlannerCommon(
	viewedDate: Date,
	viewStartTime: Time,
	viewEndTime: Time,
	totalGridRows: number
) {
	/**
	 * Calculate grid position from time span
	 */
	function setGridPositionFromSpan<T extends { start: Date | string; end: Date | string; gridRowStart?: number; gridRowEnd?: number }>(
		event: T
	): void {
		const startDate = typeof event.start === 'string' ? new Date(event.start) : event.start
		const endDate = typeof event.end === 'string' ? new Date(event.end) : event.end

		const viewStartDate = new Date(viewedDate)
		viewStartDate.setHours(viewStartTime.hours, viewStartTime.minutes, 0, 0)

		const minutesFromViewStart = Math.floor((startDate.getTime() - viewStartDate.getTime()) / 60000)
		const startRow = Math.floor(minutesFromViewStart / 10) + 1

		const minutesFromViewStartToEnd = Math.floor((endDate.getTime() - viewStartDate.getTime()) / 60000)
		const endRow = Math.floor(minutesFromViewStartToEnd / 10)

		event.gridRowStart = Math.max(1, startRow)
		event.gridRowEnd = Math.min(totalGridRows, endRow)
	}

	/**
	 * Check if time ranges overlap (for background events)
	 */
	function checkOverlapsBackground<T extends { start: Date | string; end: Date | string; isBackground: boolean }>(
		checkStart: Date | string,
		checkEnd: Date | string,
		events: T[]
	): boolean {
		return events.some(event => {
			if (!event.isBackground) return false

			const bgStart = typeof event.start === 'string' ? new Date(event.start) : event.start
			const bgEnd = typeof event.end === 'string' ? new Date(event.end) : event.end
			const start = typeof checkStart === 'string' ? new Date(checkStart) : checkStart
			const end = typeof checkEnd === 'string' ? new Date(checkEnd) : checkEnd

			return (start < bgEnd && end > bgStart)
		})
	}

	/**
	 * Check for event conflicts
	 */
	function checkConflict<T extends { id: number | string; start: Date | string; end: Date | string; isBackground: boolean }>(
		newStart: Date | string,
		newEnd: Date | string,
		events: T[],
		currentEventId?: number | string
	): boolean {
		const start = typeof newStart === 'string' ? new Date(newStart) : newStart
		const end = typeof newEnd === 'string' ? new Date(newEnd) : newEnd

		return events.some(event => {
			if (event.id === currentEventId || event.isBackground)
				return false

			const eventStart = typeof event.start === 'string' ? new Date(event.start) : event.start
			const eventEnd = typeof event.end === 'string' ? new Date(event.end) : event.end

			return (start < eventEnd && end > eventStart)
		})
	}

	/**
	 * Update overlapping background flags for all events
	 */
	function updateOverlapsBackgroundFlags<T extends { start: Date | string; end: Date | string; isBackground: boolean; isDuringBackgroundEvent?: boolean }>(
		bgStart: Date | string,
		bgEnd: Date | string,
		events: T[]
	): void {
		events.forEach(event => {
			if (event.isBackground) return

			const eventStart = typeof event.start === 'string' ? new Date(event.start) : event.start
			const eventEnd = typeof event.end === 'string' ? new Date(event.end) : event.end
			const bgStartDate = typeof bgStart === 'string' ? new Date(bgStart) : bgStart
			const bgEndDate = typeof bgEnd === 'string' ? new Date(bgEnd) : bgEnd

			if (eventStart < bgEndDate && eventEnd > bgStartDate) {
				event.isDuringBackgroundEvent = true
			}
		})
	}

	/**
	 * Initialize grid positions for all events
	 */
	function initializeEventGridPositions<T extends { start: Date | string; end: Date | string; gridRowStart?: number; gridRowEnd?: number }>(
		events: T[]
	): void {
		events.forEach(event => {
			setGridPositionFromSpan(event)
		})
	}

	return {
		setGridPositionFromSpan,
		checkOverlapsBackground,
		checkConflict,
		updateOverlapsBackgroundFlags,
		initializeEventGridPositions
	}
}