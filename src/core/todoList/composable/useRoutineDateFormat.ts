import { useI18n } from 'vue-i18n'
import { localeTag } from '@/i18n.ts'

type DateInput = Date | string

/**
 * Short date labels for the routine cards, resolved against the **account's** language.
 *
 * `toLocaleDateString(undefined, …)` reads the browser's `Intl` locale, which vue-i18n knows nothing
 * about — so a Slovak account on an English OS got English weekdays on an otherwise Slovak card
 * (`todo-routine/B10`). Every function here reads `locale.value` on each call, so a `computed` that
 * calls one re-evaluates on a locale switch without reloading.
 *
 * Not `formatLocalized` from `_common/utils/DateTimeHelper.ts`: despite its name it hardcodes dayjs's
 * `'sk'` (see `migration-revision.md` §13).
 */
export function useRoutineDateFormat() {
	const { locale } = useI18n()

	function format(date: DateInput, options: Intl.DateTimeFormatOptions): string {
		return new Date(date).toLocaleDateString(localeTag(locale.value), options)
	}

	/** "14 Sep" / "14. 9." */
	function shortDate(date: DateInput): string {
		return format(date, { month: 'short', day: 'numeric' })
	}

	/** "Mon" / "po" */
	function shortWeekday(date: DateInput): string {
		return format(date, { weekday: 'short' })
	}

	/** "Sep" / "sep" */
	function shortMonth(date: DateInput): string {
		return format(date, { month: 'short' })
	}

	/** A completion period's label: the start date alone for daily periods, "start – end" otherwise. */
	function periodLabel(start: DateInput, end: DateInput, lengthInDays: number): string {
		return lengthInDays === 1 ? shortDate(start) : `${shortDate(start)} – ${shortDate(end)}`
	}

	return { shortDate, shortWeekday, shortMonth, periodLabel }
}
