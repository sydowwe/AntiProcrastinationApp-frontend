import { useI18n } from 'vue-i18n'

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

	return { durationLabel }
}
