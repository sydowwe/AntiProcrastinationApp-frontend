import { useI18n } from 'vue-i18n'
import { isoDateInUserZone } from '@/_common/composable/general/useUserClock.ts'

const DAY_MS = 86_400_000

/**
 * Whole calendar days between two instants, counted in the user's zone — so a walk logged at 22:00 reads
 * "yesterday" at 08:00 the next morning, not "today" because fewer than 24 hours passed.
 */
export function calendarDaysBetween(earlier: Date, later: Date): number {
	const from = Date.parse(`${isoDateInUserZone(earlier)}T00:00:00Z`)
	const to = Date.parse(`${isoDateInUserZone(later)}T00:00:00Z`)
	return Math.max(0, Math.round((to - from) / DAY_MS))
}

/**
 * The picker's one shared formatter. Both the constraint chips and the suggestion cards say "45 min"
 * / "2 h", and they have to say it identically — a card claiming "120 min" next to a selected "2 h"
 * chip reads as a different number.
 */
export function usePickerLabels() {
	const i18n = useI18n()

	function durationLabel(minutes: number): string {
		if (minutes < 60) {
			return i18n.t('leisure.picker.minutesShort', { minutes })
		}
		const hours = minutes / 60
		return i18n.t('leisure.picker.hoursShort', {
			// 90 minutes is "1.5 h", 120 is "2 h" — never "2.0 h".
			hours: Number.isInteger(hours) ? hours : hours.toFixed(1),
		})
	}

	/**
	 * F3-06: "3 weeks ago", for the card's "last time" line. Coarse on purpose — it is a memory, not a log,
	 * so days give way to weeks and weeks to months. `Intl.RelativeTimeFormat` does the phrasing in the user's
	 * locale (`numeric: 'auto'` gives "yesterday" and "last month"); the i18n locale is held as `SK`/`EN`, a
	 * region subtag, hence the lowercasing the framework's `RelativeTime` does too.
	 */
	function lastDoneLabel(lastDoneAt: Date, now: Date = new Date()): string {
		const format = new Intl.RelativeTimeFormat(i18n.locale.value.toLowerCase(), { numeric: 'auto' })
		const days = calendarDaysBetween(lastDoneAt, now)
		if (days < 7) return format.format(-days, 'day')
		if (days < 30) return format.format(-Math.round(days / 7), 'week')
		if (days < 365) return format.format(-Math.max(1, Math.round(days / 30)), 'month')
		return format.format(-Math.round(days / 365), 'year')
	}

	return { durationLabel, lastDoneLabel }
}
