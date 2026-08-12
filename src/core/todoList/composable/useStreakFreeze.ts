import { useI18n } from 'vue-i18n'
import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
import { useDialog } from '@/_common/composable/general/useDialog.ts'
import { useRoutineTodoListItemCrud } from '@/core/todoList/api/routineTodoListApi.ts'
import type {
	PeriodCompletion,
	RoutineTimePeriodEntity,
} from '@/core/todoList/dto/response/routine/RoutineTimePeriodEntity.ts'

/**
 * Streak freezes — an "emergency reserve" against all-or-nothing collapse (Scott & Nowlis 2013).
 * A rigid streak dies on the first miss and takes engagement with it; a small budget of skips that
 * preserve the run sustains adherence better.
 *
 * The rule itself is server-side: the budget, the refill and the recomputed streak all come from the
 * API. Everything here only decides what to *offer*, and every offer is gated on
 * `timePeriod.supportsFreeze` — when the server reports no budget, the UI shows nothing at all rather
 * than implying a safety net that does not exist.
 */
export function useStreakFreeze() {
	const { t } = useI18n()
	const { confirm } = useDialog()
	const { showSuccessSnackbar, showErrorSnackbar } = useSnackbar()
	const { spendStreakFreeze } = useRoutineTodoListItemCrud()

	/**
	 * A period counts as missed when it fell short of the group's completion threshold.
	 * Frozen periods are excluded — they are already covered.
	 */
	function isMissedPeriod(period: PeriodCompletion, streakThreshold: number): boolean {
		if (period.isFrozen) return false
		if (period.totalCount === 0) return false
		return (period.completedCount / period.totalCount) * 100 < streakThreshold
	}

	/**
	 * The single miss a freeze can be spent on right now: the most recent elapsed period that fell
	 * short. Offering only the latest one keeps the action a one-tap rescue instead of an audit of
	 * history — and it is the miss that actually threatens the current run.
	 */
	function coverableMiss(timePeriod: RoutineTimePeriodEntity): PeriodCompletion | null {
		if (!timePeriod.supportsFreeze || (timePeriod.freezesRemaining ?? 0) <= 0) return null

		const now = Date.now()
		const elapsed = timePeriod.completionHistory.filter(p => new Date(p.periodEnd).getTime() <= now)
		const last = elapsed[elapsed.length - 1]
		if (!last) return null

		return isMissedPeriod(last, timePeriod.streakThreshold) ? last : null
	}

	/** Confirms, then spends a freeze. Resolves to the refreshed time period, or null if nothing happened. */
	async function requestFreeze(
		timePeriod: RoutineTimePeriodEntity,
		period: PeriodCompletion,
	): Promise<RoutineTimePeriodEntity | null> {
		const left = Math.max((timePeriod.freezesRemaining ?? 0) - 1, 0)
		const confirmed = await confirm({
			title: t('routineTodoList.freeze.confirmTitle'),
			text: t('routineTodoList.freeze.confirmText', {
				date: formatPeriodLabel(period, timePeriod.lengthInDays),
				remaining: t('routineTodoList.freeze.unit', { count: left }, left),
			}),
			confirmBtnLabel: t('routineTodoList.freeze.confirmBtn'),
		})
		if (!confirmed) return null

		try {
			const updated = await spendStreakFreeze(timePeriod.id, period.periodStart)
			showSuccessSnackbar(t('routineTodoList.freeze.spent'))
			return updated
		} catch (e) {
			console.error('Error spending a streak freeze', e)
			showErrorSnackbar(t('routineTodoList.freeze.spendFailed'))
			return null
		}
	}

	function formatPeriodLabel(period: PeriodCompletion, lengthInDays: number): string {
		const start = formatDate(period.periodStart)
		return lengthInDays === 1 ? start : `${start} – ${formatDate(period.periodEnd)}`
	}

	return { isMissedPeriod, coverableMiss, requestFreeze, formatPeriodLabel }
}

function formatDate(iso: string): string {
	return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
}
