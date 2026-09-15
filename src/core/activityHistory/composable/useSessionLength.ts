import { useI18n } from 'vue-i18n'
import { Time } from '@/_common/dto/dto/Time.ts'
import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'

/**
 * One rounding rule and one too-short rule for every timing session, because the three capture views
 * used to answer both questions differently and none of them told the user.
 *
 * A history record is whole minutes on the wire (`Time` is `{hours, minutes}`, and so is the server's
 * `IntTime`), so every session has to be rounded before it can be saved, and a session short enough to
 * round to nothing cannot be saved at all: since 2026-09-15 the API rejects a zero length with
 * `400 "Length must be positive."` — see `prompts/view-docs/backend/_implemented/B17-…`. Discarding it
 * here, before the save dialog opens, is what keeps that 400 unreachable and tells the user why nothing
 * was recorded.
 */

/** Seconds per minute, in ms — the granularity the wire has and the reason this file exists. */
const MS_PER_MINUTE = 60_000

/**
 * The elapsed time of a session as the whole minutes it will be recorded as: half-up, so the cliff is
 * at 30 seconds on every view. This is `TimePrecise.toTimeLength`'s rule, which the stopwatch already
 * used, routed through `Time.fromMinutes` so that 59m40s normalizes to 1h 0m rather than the 0h 60m
 * `toTimeLength` builds.
 */
export function sessionLengthFromMs(elapsedMs: number): Time {
	return Time.fromMinutes(Math.round(Math.max(0, elapsedMs) / MS_PER_MINUTE))
}

export function useSessionLength() {
	const { t } = useI18n()
	const { showSnackbar } = useSnackbar()

	/**
	 * True when the session produced nothing recordable (under 30 seconds). Says so in a snackbar as a
	 * side effect — this is information, not an error: the user did nothing wrong, the session was just
	 * too short to be a minute. Callers still own `store.clearSession()`, since only they know which
	 * session it was.
	 */
	function discardIfTooShort(length: Time): boolean {
		if (length.isNotZero()) return false
		void showSnackbar(t('history.sessionTooShortToLog'))
		return true
	}

	return { sessionLengthFromMs, discardIfTooShort }
}
