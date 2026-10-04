import { useI18n } from 'vue-i18n'
import { DayOfWeek } from '@/_common/dto/enum/DayOfWeek.ts'
import { DayType } from '@/_common/dto/enum/DayType.ts'
import { useDayOfWeekOptions } from '@/_common/composable/general/useDayOfWeekOptions.ts'
import { formatLocalized, parseDateFromApi } from '@/_common/utils/DateTimeHelper.ts'
import { RecurrenceType } from '@/core/dayPlanner/dto/enum/RecurrenceType.ts'
import type { RepeatingPlannerTask } from '@/core/dayPlanner/dto/response/RepeatingPlannerTask.ts'

/** The rule fields a repeating task and a suggestion share. `SuggestionResponse` satisfies it structurally. */
export type RecurrenceRule = Pick<
	RepeatingPlannerTask,
	'recurrenceType' | 'scheduledDays' | 'scheduledDates' | 'activeFromDate' | 'activeToDate' | 'scheduledForDayTypes'
>

const DAY_ORDER = Object.values(DayOfWeek)
const DAY_TYPE_ORDER = Object.values(DayType)
const WEEKDAYS = [DayOfWeek.Monday, DayOfWeek.Tuesday, DayOfWeek.Wednesday, DayOfWeek.Thursday, DayOfWeek.Friday]
const WEEKEND = [DayOfWeek.Saturday, DayOfWeek.Sunday]

/**
 * One line that says when a repeating task fires: "every Tue, Thu · until 30.11.". It is shown in the
 * settings table and as the reason under a planner suggestion, so both read the rule the same way.
 *
 * The active window is part of the rule for every type, not only DateRange: the suggestions endpoint
 * bounds each type by it (OP10). Dates are calendar dates, so they are parsed as local days and never
 * shifted through a zone. The year is shown only when it is not the current one.
 */
export function useRecurrenceSummary() {
	const { t } = useI18n()
	const dayOptions = useDayOfWeekOptions()

	function formatDay(value: string): string {
		const date = parseDateFromApi(value)
		if (!date) return value
		return formatLocalized(date, date.getFullYear() === new Date().getFullYear() ? 'DD.MM.' : 'DD.MM.YYYY')
	}

	function sameDays(days: DayOfWeek[], set: DayOfWeek[]): boolean {
		return days.length === set.length && set.every(d => days.includes(d))
	}

	function describeDays(days: DayOfWeek[]): string {
		const unique = [...new Set(days)]
		if (unique.length === DAY_ORDER.length) return t('planner.recurrenceSummary.everyDay')
		if (sameDays(unique, WEEKDAYS)) return t('planner.recurrenceSummary.weekdays')
		if (sameDays(unique, WEEKEND)) return t('planner.recurrenceSummary.weekends')
		const labels = DAY_ORDER.filter(d => unique.includes(d)).map(
			d => dayOptions.value.find(o => o.value === d)?.label ?? d,
		)
		return t('planner.recurrenceSummary.everyDays', { days: labels.join(', ') })
	}

	function describeDates(dates: number[]): string {
		const sorted = [...new Set(dates)].sort((a, b) => a - b)
		return t('planner.recurrenceSummary.monthDays', { days: sorted.join(', ') }, sorted.length)
	}

	function describeDayTypes(types: DayType[]): string {
		const labels = DAY_TYPE_ORDER.filter(type => types.includes(type)).map(type => t(`planner.dayType.${type}`))
		return t('planner.recurrenceSummary.dayTypes', { types: labels.join(', ') })
	}

	function describeWindow(from: string | null, to: string | null): string | null {
		if (from && to) return t('planner.recurrenceSummary.between', { from: formatDay(from), to: formatDay(to) })
		if (from) return t('planner.recurrenceSummary.from', { date: formatDay(from) })
		if (to) return t('planner.recurrenceSummary.until', { date: formatDay(to) })
		return null
	}

	function describeRule(rule: RecurrenceRule): string {
		switch (rule.recurrenceType) {
			case RecurrenceType.DateRange:
				return describeWindow(rule.activeFromDate, rule.activeToDate) ?? ''
			case RecurrenceType.DayOfWeek:
				return joinParts(describeDays(rule.scheduledDays), rule)
			case RecurrenceType.DayOfMonth:
				return joinParts(describeDates(rule.scheduledDates), rule)
			case RecurrenceType.DayType:
				return joinParts(describeDayTypes(rule.scheduledForDayTypes), rule)
			default:
				return ''
		}
	}

	function joinParts(when: string, rule: RecurrenceRule): string {
		const window = describeWindow(rule.activeFromDate, rule.activeToDate)
		return window ? `${when} · ${window}` : when
	}

	return { describeRule }
}
