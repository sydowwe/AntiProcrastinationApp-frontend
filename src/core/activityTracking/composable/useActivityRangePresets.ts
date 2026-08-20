import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import { getWeekStart, startOfDayLocal } from '@/_common/utils/DateTimeHelper.ts'
import { useUserPreferences } from '@/core/user/composable/useUserPreferences.ts'

/**
 * The primary date control on the dashboards. `custom` is not a shape — it is "none of the above",
 * and it is what the picker falls back to when the two dates do not match any preset.
 */
export type ActivityRangePreset = 'today' | 'last7Days' | 'thisWeek' | 'last30Days' | 'custom'

/** Presets in the order they are offered. `custom` is rendered separately, so it is not in here. */
const NAMED_PRESETS: Exclude<ActivityRangePreset, 'custom'>[] = ['today', 'last7Days', 'thisWeek', 'last30Days']

export interface ActivityDateSpan {
	dateFrom: Date
	dateTo: Date
}

export interface ActivityRangePresetOption {
	value: ActivityRangePreset
	label: string
}

/**
 * Resolves a preset against a reference day. Every preset ends *today* — these are retrospective
 * windows, not calendar objects, so "this week" is the current week truncated at today rather than a
 * span running into the future. `dateTo` in the future would ask the backend for days that cannot
 * have data and would make the daily-window arithmetic ambiguous.
 */
export function resolveRangePreset(
	preset: Exclude<ActivityRangePreset, 'custom'>,
	firstDayOfWeek: 0 | 1,
	today: Date = new Date(),
): ActivityDateSpan {
	const dateTo = startOfDayLocal(today)

	switch (preset) {
		case 'today':
			return { dateFrom: dateTo, dateTo }
		case 'last7Days':
			return { dateFrom: shiftDays(dateTo, -6), dateTo }
		case 'last30Days':
			return { dateFrom: shiftDays(dateTo, -29), dateTo }
		case 'thisWeek':
			return { dateFrom: startOfDayLocal(getWeekStart(dateTo, firstDayOfWeek)), dateTo }
	}
}

/**
 * The inverse, used to light up a chip from the URL rather than storing the preset itself. Keeping
 * the dates canonical is what makes a shared link stable: a bookmark taken during "last 7 days"
 * reopens on those same seven absolute days a month later, and simply shows as `custom` then.
 *
 * Known cosmetic consequence: when two presets resolve to the *same* span, the first match in
 * `NAMED_PRESETS` wins and the other never highlights. With a Monday week start that is "Today" over
 * "This week" on Mondays, and "Last 7 days" over "This week" on Sundays. The ranges are identical, so
 * only the chip label differs. Fixing it would mean storing the chosen preset, which is exactly the
 * state this function exists to avoid — shareable links are worth more than the label.
 */
export function detectRangePreset(
	dateFrom: Date,
	dateTo: Date,
	firstDayOfWeek: 0 | 1,
	today: Date = new Date(),
): ActivityRangePreset {
	for (const preset of NAMED_PRESETS) {
		const span = resolveRangePreset(preset, firstDayOfWeek, today)
		if (isSameDay(span.dateFrom, dateFrom) && isSameDay(span.dateTo, dateTo)) {
			return preset
		}
	}
	return 'custom'
}

/**
 * The longest span any dashboard will ask for. This is a contract limit rather than a UI preference:
 * every dashboard endpoint rejects a longer span, because an unbounded one walks the whole retention
 * window. A year covers "last 30 days" and any hand-picked range around it with room to spare.
 */
export const MAX_RANGE_DAYS = 366

/**
 * Clamps the end of a span to `MAX_RANGE_DAYS`. Applied to anything that did not come from a preset —
 * a hand-edited or stale URL — so a too-wide span lands on a year of data instead of a 400.
 */
export function clampSpanEnd(dateFrom: Date, dateTo: Date): Date {
	if (daySpanCount(dateFrom, dateTo) <= MAX_RANGE_DAYS) {
		return dateTo
	}
	return shiftDays(startOfDayLocal(dateFrom), MAX_RANGE_DAYS - 1)
}

/** Inclusive day count — a single day spans 1, not 0. */
export function daySpanCount(dateFrom: Date, dateTo: Date): number {
	const from = startOfDayLocal(dateFrom).getTime()
	const to = startOfDayLocal(dateTo).getTime()
	// Day-granular difference off local midnights, so a DST transition inside the span cannot round
	// 6.96 days down to 6.
	return Math.max(1, Math.round((to - from) / 86400000) + 1)
}

export function isSameDay(a: Date, b: Date): boolean {
	return startOfDayLocal(a).getTime() === startOfDayLocal(b).getTime()
}

export function shiftDays(date: Date, days: number): Date {
	const shifted = new Date(date)
	shifted.setDate(shifted.getDate() + days)
	return shifted
}

/** Binds the pure helpers above to the user's week-start preference and localizes the chip labels. */
export function useActivityRangePresets() {
	const { t } = useI18n()
	const { firstDayOfWeek } = useUserPreferences()

	const presetOptions = computed<ActivityRangePresetOption[]>(() =>
		NAMED_PRESETS.map(value => ({ value, label: t(`activityTracking.range.${value}`) })),
	)

	function resolve(preset: Exclude<ActivityRangePreset, 'custom'>): ActivityDateSpan {
		return resolveRangePreset(preset, firstDayOfWeek.value)
	}

	function detect(dateFrom: Date, dateTo: Date): ActivityRangePreset {
		return detectRangePreset(dateFrom, dateTo, firstDayOfWeek.value)
	}

	return { presetOptions, resolve, detect }
}
