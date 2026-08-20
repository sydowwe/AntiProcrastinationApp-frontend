import { useI18n } from 'vue-i18n'
import { useDialog } from '@/_common/composable/general/useDialog.ts'
import { useRunningTimerStore, type TimerKind } from '@/core/activityHistory/store/runningTimerStore.ts'

/**
 * What to call each timer in the prompt below. The nav labels rather than new strings of our own:
 * they are what the sidebar, the routed page headings and TrackTimeDialog's method toggle all
 * already call these three, so the prompt names the thing the user pressed.
 */
export const TIMER_KIND_LABEL_KEY: Record<TimerKind, string> = {
	stopwatch: 'navigation.stopwatch',
	timer: 'navigation.timer',
	pomodoro: 'navigation.pomodoroTimer',
}

/**
 * There is one running session per browser, and starting a second one has to ask first.
 *
 * The three views each call this from their own `start()`. It only speaks up for a session the
 * caller does not own — a paused session of its own kind is a resume, not a replacement, and never
 * reaches here. Silently replacing was the old behaviour and it threw away real elapsed time; the
 * only thing worse than losing a session to a reload is losing it to a click that gave no warning.
 */
export function useTimerSessionGuard() {
	const { confirm } = useDialog()
	const { t } = useI18n()
	const store = useRunningTimerStore()

	/**
	 * Resolves true when the caller may start — either nothing else was running, or the user agreed
	 * to discard what was. Discarding happens here so the caller does not have to remember to.
	 */
	async function ensureFreeToStart(kind: TimerKind, pinnedActivityId: number | null): Promise<boolean> {
		const other = store.foreignSession(kind, pinnedActivityId)
		if (other === null) return true

		const timer = t(TIMER_KIND_LABEL_KEY[other.kind])
		// A session that has already run out is waiting to be logged, not running. Saying "is
		// running" about it would misdescribe what the user is being asked to throw away.
		const textKey = other.ended ? 'history.session.discardEndedText' : 'history.session.replaceText'
		const accepted = await confirm({
			title: t(other.ended ? 'history.session.discardEndedTitle' : 'history.session.replaceTitle'),
			text: other.activityName
				? t(textKey, { timer, activity: other.activityName })
				: t(`${textKey}NoActivity`, { timer }),
			confirmBtnLabel: t('history.session.replaceConfirm'),
			confirmBtnColor: 'errorDark',
		})
		if (!accepted) return false
		store.clearSession()
		return true
	}

	return { ensureFreeToStart }
}
