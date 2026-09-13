import { computed, type ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'
import { localeTag } from '@/i18n.ts'

export interface AnchorDayOption {
	value: number
	label: string
}

/**
 * Localized labels for a routine time period's `resetAnchorDay`, shared by `/routine-settings` and
 * its add/edit dialog so the two cannot drift.
 *
 * **Why not `useDayOfWeekOptions()`**, which CLAUDE.md otherwise tells you to prefer: that composable
 * yields `DayOfWeek`, a *string* enum (`'Monday'`), while `resetAnchorDay` is a number on the wire —
 * `0` for "rolling, no anchor" and `1`–`7` for Monday–Sunday. Its labels are also the short forms
 * (`calendar.mon`), which read badly in a select. So this builds the same localized list off the
 * `calendar.*` full-name keys the framework already owns, and keeps the numeric contract intact.
 */
const WEEK_DAY_LABEL_KEYS = [
	'calendar.monday',
	'calendar.tuesday',
	'calendar.wednesday',
	'calendar.thursday',
	'calendar.friday',
	'calendar.saturday',
	'calendar.sunday',
]

export function useAnchorDayOptions(): {
	weekDayNames: ComputedRef<string[]>
	anchorDayOptions: ComputedRef<AnchorDayOption[]>
	formatAnchorDayOfMonth: (day: number) => string
} {
	const { t, locale } = useI18n()

	const weekDayNames = computed(() => WEEK_DAY_LABEL_KEYS.map(key => t(key)))

	const anchorDayOptions = computed<AnchorDayOption[]>(() => [
		{ value: 0, label: t('routineTodoList.timePeriods.rolling') },
		...weekDayNames.value.map((label, index) => ({ value: index + 1, label })),
	])

	/**
	 * Ordinal day of the month. `Intl.PluralRules` picks the category, the locale file supplies the
	 * form — Slovak writes every day as "5.", English needs 1st/2nd/3rd/4th. The old code appended a
	 * literal `th` and so rendered "1th".
	 */
	function formatAnchorDayOfMonth(day: number): string {
		const category = new Intl.PluralRules(localeTag(locale.value), { type: 'ordinal' }).select(day)
		return t(`routineTodoList.timePeriods.dayOfMonth.${category}`, { day })
	}

	return { weekDayNames, anchorDayOptions, formatAnchorDayOfMonth }
}
