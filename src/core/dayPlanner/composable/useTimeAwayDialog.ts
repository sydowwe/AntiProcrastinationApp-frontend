import { useI18n } from 'vue-i18n'
import { useDialog } from '@/_common/composable/general/useDialog.ts'
import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
import TimeAwayForm from '@/core/dayPlanner/component/timeAway/TimeAwayForm.vue'
import type { TimeAway } from '@/core/dayPlanner/dto/response/TimeAway.ts'
import type { TimeAwayStamp } from '@/core/dayPlanner/dto/response/TimeAwayStamp.ts'

export interface TimeAwayFormResult {
	stamp: TimeAwayStamp
	name: string
}

/**
 * The one way into the *Mark time away* dialog (F4-02), from the bulk bar, a day's details and the list.
 * Resolves with what the stamp did, or null when the user backed out; the caller refreshes whatever it shows.
 */
export function useTimeAwayDialog() {
	const { t } = useI18n()
	const { openDialog } = useDialog()
	const { showSuccessSnackbar } = useSnackbar()

	async function openTimeAwayDialog(
		options: { timeAway?: TimeAway; start?: Date | null; end?: Date | null } = {},
	): Promise<TimeAwayStamp | null> {
		const { timeAway, start = null, end = null } = options
		const result = await openDialog<TimeAwayFormResult>({
			component: TimeAwayForm,
			componentProps: { timeAway: timeAway ?? null, start, end },
			dialogProps: {
				title: t(timeAway ? 'planner.timeAway.editTitle' : 'planner.timeAway.markTitle'),
				confirmBtnLabel: t('planner.timeAway.save'),
			},
		})
		if (!result) return null

		// A day that kept a type of the user's own is worth a line, not a warning: it still belongs to the stretch.
		const saved = t(timeAway ? 'planner.timeAway.updated' : 'planner.timeAway.created', { name: result.name })
		const kept = result.stamp.keptOwnDayTypeCount
		showSuccessSnackbar(kept > 0 ? `${saved} ${t('planner.timeAway.keptOwnType', { count: kept }, kept)}` : saved)
		return result.stamp
	}

	return { openTimeAwayDialog }
}
