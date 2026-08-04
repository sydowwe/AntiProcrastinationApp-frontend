import { isAxiosError } from 'axios'
import { useI18n } from 'vue-i18n'
import { formatToDate, formatToTimeWithSec } from '@/_common/utils/DateTimeHelper.ts'
import { fromSecondsDetailed } from '@/_common/utils/formatDuration.ts'

/** Shared formatting helpers for the scheduler dashboard (run timestamps & durations). */
export function useSchedulerFormat() {
	const i18n = useI18n()
	/** Full date + time (with seconds), e.g. for run timestamps. Empty string when null. */
	function formatDateTime(date: Date | null | undefined): string {
		if (!date) return ''
		return `${formatToDate(date)} ${formatToTimeWithSec(date)}`
	}

	/** Human duration from seconds, e.g. "5h 32m 15s" / "820ms" for sub-second runs. */
	function formatRunDuration(seconds: number): string {
		if (seconds > 0 && seconds < 1) {
			return `${Math.round(seconds * 1000)}ms`
		}
		return fromSecondsDetailed(seconds)
	}

	function replayError(e: unknown): string {
		if (isAxiosError(e)) {
			if (e.response?.status === 404) return i18n.t('scheduler.replay.errors.runNotFound')
			if (e.response?.status === 409 || e.response?.status === 422) {
				return i18n.t('scheduler.replay.errors.noHandler')
			}
		}
		return i18n.t('scheduler.replay.errors.generic')
	}

	return { formatDateTime, formatRunDuration, replayError }
}
