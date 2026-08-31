import { watch, type Ref } from 'vue'
import router from '@/router.ts'
import type { CalendarMode } from '@/core/dayPlanner/composable/useCalendarModes.ts'

export interface CalendarDateRange {
	start: Date
	end: Date
}

export interface CalendarUrlStateRefs {
	mode: Ref<CalendarMode>
	applyTemplateId: Ref<number | null>
	applyPreviewMode: Ref<boolean>
}

/** The values the URL carries but the view has to apply itself, because they resolve after an await. */
export interface HydratedCalendarUrlState {
	/** `null` when the URL names no template, so the stored default wins. */
	templateId: number | null
	/** `null` when the URL says nothing about preview, so the stored default wins. */
	previewMode: boolean | null
}

export function monthKeyFromDate(date: Date): string {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function parseMonthKey(key: string): CalendarDateRange | null {
	const match = /^(\d{4})-(\d{2})$/.exec(key)
	if (!match?.[1] || !match[2]) return null
	const year = Number(match[1])
	const month = Number(match[2])
	return { start: new Date(year, month - 1, 1), end: new Date(year, month, 0) }
}

/**
 * The whole route <-> calendar-state mapping for `PlannerCalendarView` (theme D): the displayed month
 * as a `YYYY-MM` param, and the transient mode/template/preview trio layered on top of it.
 *
 * Registers the mode write-back watcher itself; the view only has to call `hydrateFromUrl` once and
 * `syncMonthToUrl` on a date-range change.
 */
export function useCalendarUrlState({ mode, applyTemplateId, applyPreviewMode }: CalendarUrlStateRefs) {
	// Set while we are writing URL-derived state into the calendar/mode refs, so the write-back
	// watchers below don't turn our own sync into a spurious history entry.
	let isApplyingUrlState = false

	function syncMonthToUrl(range: { start: Date | null; end: Date | null }) {
		if (isApplyingUrlState || !range.start) return
		const key = monthKeyFromDate(range.start)
		const currentQuery = { ...router.currentRoute.value.query }
		if (key === monthKeyFromDate(new Date())) {
			if (currentQuery.month === undefined) return
			delete currentQuery.month
		} else {
			if (currentQuery.month === key) return
			currentQuery.month = key
		}
		router.push({ query: currentQuery })
	}

	// Mode/template/preview are transient UI state layered on top of whatever month is displayed —
	// they replace the query so the back button walks months rather than undoing mode toggles.
	function syncModeToUrl() {
		if (isApplyingUrlState) return
		const currentQuery = { ...router.currentRoute.value.query }
		delete currentQuery.mode
		delete currentQuery.templateId
		delete currentQuery.preview
		if (mode.value !== 'none') {
			currentQuery.mode = mode.value
			if (mode.value === 'applyTemplate') {
				if (applyTemplateId.value !== null) currentQuery.templateId = String(applyTemplateId.value)
				if (!applyPreviewMode.value) currentQuery.preview = '0'
			}
		}
		router.replace({ query: currentQuery })
	}

	watch([mode, applyTemplateId, applyPreviewMode], syncModeToUrl)

	/**
	 * Reads the query once. The mode goes straight into its ref; the month is handed to `applyMonth`
	 * while the guard still holds, so the grid's own range change does not push the month we just read
	 * back onto the history stack.
	 */
	function hydrateFromUrl(applyMonth: (range: CalendarDateRange) => void): HydratedCalendarUrlState {
		isApplyingUrlState = true
		try {
			const query = router.currentRoute.value.query
			const urlMode = query.mode
			if (urlMode === 'bulkSelect' || urlMode === 'editDetails' || urlMode === 'applyTemplate') {
				mode.value = urlMode
			}
			const urlMonth = typeof query.month === 'string' ? parseMonthKey(query.month) : null
			if (urlMonth) applyMonth(urlMonth)
			return {
				templateId:
					typeof query.templateId === 'string' && query.templateId !== '' ? Number(query.templateId) : null,
				previewMode: query.preview === '0' ? false : null,
			}
		} finally {
			isApplyingUrlState = false
		}
	}

	return { hydrateFromUrl, syncMonthToUrl }
}
