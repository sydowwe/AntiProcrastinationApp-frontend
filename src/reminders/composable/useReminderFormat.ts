import { useI18n } from 'vue-i18n'
import { formatToDate, formatToTimeWithSec } from '@/_common/utils/DateTimeHelper.ts'

/** Shared formatting helpers for the reminder registry (instants & human-readable lead-time offsets). */
export function useReminderFormat() {
	const i18n = useI18n()

	/** Full date + time (with seconds). Empty-state marker "—" when null. */
	function formatInstant(date: Date | null | undefined): string {
		if (!date) return '—'
		return `${formatToDate(date)} ${formatToTimeWithSec(date)}`
	}

	/**
	 * Turns a lead-time offset in minutes into human terms — negative = before the deadline, 0 = at it.
	 * e.g. -43200 → "30 dní pred termínom", 0 → "presne v termíne".
	 */
	function formatLeadOffset(minutes: number): string {
		if (minutes === 0) return i18n.t('reminders.leadOffset.atDeadline')

		const abs = Math.abs(minutes)
		let n: number
		let unit: string
		if (abs % 1440 === 0) {
			n = abs / 1440
			unit = i18n.t('reminders.leadOffset.unit.day')
		} else if (abs % 60 === 0) {
			n = abs / 60
			unit = i18n.t('reminders.leadOffset.unit.hour')
		} else {
			n = abs
			unit = i18n.t('reminders.leadOffset.unit.minute')
		}

		return minutes < 0
			? i18n.t('reminders.leadOffset.before', { n, unit })
			: i18n.t('reminders.leadOffset.after', { n, unit })
	}

	/** Pretty-prints an opaque payload object as readable, indented JSON. */
	function formatPayload(payload: unknown): string {
		if (payload === null || payload === undefined) return ''
		if (typeof payload === 'string') return payload
		try {
			return JSON.stringify(payload, null, 2)
		} catch {
			return String(payload)
		}
	}

	return { formatInstant, formatLeadOffset, formatPayload }
}
