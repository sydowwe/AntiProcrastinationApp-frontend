import { nextTick, watch, type Ref } from 'vue'
import type { LocationQuery, LocationQueryRaw } from 'vue-router'
import router from '@/router.ts'
import type { CalendarMode } from '@/core/dayPlanner/composable/useCalendarModes.ts'
import type { CalendarDayVisibility, DateRangeConfig, DateRangeMode } from '@/_common/dto/DateRangeConfig.ts'
import { formatDateForApi, parseDateFromApi } from '@/_common/utils/DateTimeHelper.ts'

export interface CalendarDateRange {
	start: Date
	end: Date
}

export interface CalendarUrlStateRefs {
	mode: Ref<CalendarMode>
	applyTemplateId: Ref<number | null>
	applyPreviewMode: Ref<boolean>
	/** Cleared when Back/Forward restores a mode other than bulk select, as leaving that mode does. */
	selectedDayIds: Ref<number[]>
	/** The grid toolbar's state (`FW16`'s models) — hydrated at setup, before the grid mounts. */
	dateRangeMode: Ref<DateRangeMode>
	dayVisibility: Ref<CalendarDayVisibility>
	rangeConfig: Ref<DateRangeConfig | undefined>
}

/** The values the URL carries but the view has to apply itself, because they resolve after an await. */
export interface HydratedCalendarUrlState {
	/** `null` when the URL names no template, so the stored default wins. */
	templateId: number | null
	/** `null` when the URL says nothing about preview, so the stored default wins. */
	previewMode: boolean | null
}

// `DateRangePicker`'s `maxDays` default, which the grid does not override.
const MAX_RANGE_DAYS = 31
const MAX_QUANTITY: Record<DateRangeConfig['unit'], number> = {
	day: MAX_RANGE_DAYS,
	week: Math.floor(MAX_RANGE_DAYS / 7),
}

// Every key this composable owns. The sync rebuilds all of them from state, so a stale one cannot linger.
const OWNED_KEYS = ['mode', 'templateId', 'preview', 'month', 'days', 'range', 'from', 'to', 'anchor', 'unit', 'qty']

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

function queryString(query: LocationQuery, key: string): string | undefined {
	const raw = query[key]
	const first = Array.isArray(raw) ? raw[0] : raw
	return typeof first === 'string' && first !== '' ? first : undefined
}

function defaultRangeConfig(): DateRangeConfig {
	return { rangeStart: null, rangeEnd: null, anchor: 'start', anchorDate: new Date(), unit: 'week', quantity: 1 }
}

/**
 * Decodes the toolbar state. Anything unusable falls back rather than half-applying: a Range without
 * two real, ordered dates at most `MAX_RANGE_DAYS` apart is month mode, a Duration quantity is clamped
 * to its unit's cap, and a missing Duration `from` is today — the picker's own default.
 */
function parseRangeState(query: LocationQuery) {
	const days = queryString(query, 'days')
	const dayVisibility: CalendarDayVisibility = days === 'workdays' || days === 'weekend' ? days : 'all'
	const config = defaultRangeConfig()

	const range = queryString(query, 'range')
	if (range === 'range') {
		const from = parseDateFromApi(queryString(query, 'from'))
		const to = parseDateFromApi(queryString(query, 'to'))
		const spanDays = from && to ? Math.round((to.getTime() - from.getTime()) / 86_400_000) : -1
		if (from && to && spanDays >= 0 && spanDays <= MAX_RANGE_DAYS) {
			config.rangeStart = from
			config.rangeEnd = to
			return { dayVisibility, dateRangeMode: 'range' as const, config }
		}
	} else if (range === 'duration') {
		config.anchor = queryString(query, 'anchor') === 'end' ? 'end' : 'start'
		config.anchorDate = parseDateFromApi(queryString(query, 'from')) ?? new Date()
		config.unit = queryString(query, 'unit') === 'day' ? 'day' : 'week'
		const qty = Number(queryString(query, 'qty') ?? 1)
		config.quantity = Number.isInteger(qty) ? Math.min(Math.max(qty, 1), MAX_QUANTITY[config.unit]) : 1
		return { dayVisibility, dateRangeMode: 'duration' as const, config }
	}
	return { dayVisibility, dateRangeMode: 'month' as const, config: undefined }
}

/**
 * The whole route <-> calendar-state mapping for `PlannerCalendarView` (theme D): the displayed month
 * as a `YYYY-MM` param, the transient mode/template/preview trio, and the grid toolbar — *Days to show*
 * and the Range/Duration configuration (`F44`). Every param is absent while it holds its default.
 *
 * One writer for all of them: every change schedules a single rebuild of the owned keys after the
 * current flush, so a mode switch — which moves the toolbar models *and* the emitted range in one tick —
 * lands as one navigation rather than two that each spread a stale query (the `F1` two-writer race).
 * The navigation is a `push` only when the month changed, so the back button walks months and nothing
 * else; the toolbar and the mode trio are view configuration and `replace`.
 *
 * The toolbar refs are hydrated here, at setup, so the grid mounts already configured. The view only has
 * to call `hydrateFromUrl` once and `syncRangeToUrl` on a date-range change.
 */
export function useCalendarUrlState({
	mode,
	applyTemplateId,
	applyPreviewMode,
	selectedDayIds,
	dateRangeMode,
	dayVisibility,
	rangeConfig,
}: CalendarUrlStateRefs) {
	// Set while we are writing URL-derived state into the calendar/mode refs, so a sync scheduled by our
	// own hydration does not write back a half-applied state.
	let isApplyingUrlState = false
	let lastRange: { start: Date | null; end: Date | null } | null = null
	let syncScheduled = false

	const initial = parseRangeState(router.currentRoute.value.query)
	dayVisibility.value = initial.dayVisibility
	dateRangeMode.value = initial.dateRangeMode
	rangeConfig.value = initial.config

	function buildQuery(current: LocationQuery): LocationQueryRaw {
		const query: LocationQueryRaw = { ...current }
		for (const key of OWNED_KEYS) delete query[key]

		if (mode.value !== 'none') {
			query.mode = mode.value
			if (mode.value === 'applyTemplate') {
				if (applyTemplateId.value !== null) query.templateId = String(applyTemplateId.value)
				if (!applyPreviewMode.value) query.preview = '0'
			}
		}

		if (dayVisibility.value !== 'all') query.days = dayVisibility.value

		const config = rangeConfig.value
		if (dateRangeMode.value === 'month') {
			// Only month mode writes `month` — a Duration range reduced to its start month was the B3 bug.
			if (lastRange?.start) {
				const key = monthKeyFromDate(lastRange.start)
				if (key !== monthKeyFromDate(new Date())) query.month = key
			} else if (typeof current.month === 'string') {
				query.month = current.month
			}
		} else if (dateRangeMode.value === 'range') {
			query.range = 'range'
			if (config?.rangeStart) query.from = formatDateForApi(config.rangeStart)
			if (config?.rangeEnd) query.to = formatDateForApi(config.rangeEnd)
		} else {
			query.range = 'duration'
			if (config) {
				if (config.anchor !== 'start') query.anchor = config.anchor
				// `from` is always written: "today" read back tomorrow would be a different range.
				if (config.anchorDate) query.from = formatDateForApi(config.anchorDate)
				if (config.unit !== 'week') query.unit = config.unit
				if (config.quantity !== 1) query.qty = String(config.quantity)
			}
		}
		return query
	}

	function sameOwnedKeys(a: LocationQueryRaw, b: LocationQuery) {
		return OWNED_KEYS.every(key => (a[key] ?? undefined) === (queryString(b, key) ?? undefined))
	}

	function scheduleSync() {
		if (isApplyingUrlState || syncScheduled) return
		syncScheduled = true
		nextTick(() => {
			syncScheduled = false
			const current = router.currentRoute.value
			// The view navigated away in the same tick — its query must not land on the next route.
			if (current.name !== 'plannerCalendar') return
			const query = buildQuery(current.query)
			if (sameOwnedKeys(query, current.query)) return
			const monthChanged = (query.month ?? undefined) !== queryString(current.query, 'month')
			if (monthChanged) router.push({ query })
			else router.replace({ query })
		})
	}

	function syncRangeToUrl(range: { start: Date | null; end: Date | null }) {
		lastRange = range
		scheduleSync()
	}

	watch([mode, applyTemplateId, applyPreviewMode, dayVisibility, dateRangeMode], scheduleSync)
	watch(rangeConfig, scheduleSync, { deep: true })

	let applyMonthToGrid: ((range: CalendarDateRange) => void) | null = null

	/**
	 * Back/Forward (F86). The route reuses this view on a query-only navigation, so without this the URL
	 * walked months while the grid stayed put. Every owned key is re-applied, not only `month`: a `replace`
	 * rewrites the entry it lands on, so the entry Back returns to holds the toolbar and mode as they were
	 * when it was left. A navigation of our own already matches state, so it is a no-op here.
	 */
	function applyExternalQuery(query: LocationQuery) {
		if (sameOwnedKeys(buildQuery(query), query)) return

		const restored = parseRangeState(query)
		dayVisibility.value = restored.dayVisibility
		dateRangeMode.value = restored.dateRangeMode
		if (restored.config) rangeConfig.value = restored.config

		const urlMode = queryString(query, 'mode')
		mode.value =
			urlMode === 'bulkSelect' || urlMode === 'editDetails' || urlMode === 'applyTemplate' ? urlMode : 'none'
		if (mode.value !== 'bulkSelect') selectedDayIds.value = []
		if (mode.value === 'applyTemplate') {
			const templateId = Number(queryString(query, 'templateId'))
			applyTemplateId.value = Number.isInteger(templateId) ? templateId : null
			applyPreviewMode.value = queryString(query, 'preview') !== '0'
		}

		if (restored.dateRangeMode !== 'month') return
		const month = parseMonthKey(queryString(query, 'month') ?? monthKeyFromDate(new Date()))
		if (!month) return
		// Set now, so a sync the ref writes above schedule rebuilds this month rather than the old one.
		lastRange = month
		// After the flush, so the picker has already switched to month mode when the range reaches it —
		// in any other mode it would coerce the range instead of reading its month.
		nextTick(() => applyMonthToGrid?.(month))
	}

	watch(
		() => router.currentRoute.value,
		route => {
			if (route.name === 'plannerCalendar') applyExternalQuery(route.query)
		},
	)

	/**
	 * Reads the mode trio and the month once. The mode goes straight into its ref; the month is handed
	 * to `applyMonth` — only in month mode, where it is what the grid shows. `applyMonth` is kept for
	 * Back/Forward.
	 */
	function hydrateFromUrl(applyMonth: (range: CalendarDateRange) => void): HydratedCalendarUrlState {
		applyMonthToGrid = applyMonth
		isApplyingUrlState = true
		try {
			const query = router.currentRoute.value.query
			const urlMode = query.mode
			if (urlMode === 'bulkSelect' || urlMode === 'editDetails' || urlMode === 'applyTemplate') {
				mode.value = urlMode
			}
			const urlMonth = typeof query.month === 'string' ? parseMonthKey(query.month) : null
			if (urlMonth && dateRangeMode.value === 'month') applyMonth(urlMonth)
			return {
				templateId:
					typeof query.templateId === 'string' && query.templateId !== '' ? Number(query.templateId) : null,
				previewMode: query.preview === '0' ? false : null,
			}
		} finally {
			isApplyingUrlState = false
		}
	}

	return { hydrateFromUrl, syncRangeToUrl }
}
