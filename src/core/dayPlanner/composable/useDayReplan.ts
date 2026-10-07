import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useDialog } from '@/_common/composable/general/useDialog.ts'
import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
import { useDayReplanApi } from '@/core/dayPlanner/api/dayReplanApi.ts'
import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
import type { ApplyDayReplanResult } from '@/core/dayPlanner/dto/response/ApplyDayReplanResult.ts'
import ReplanDayForm from '@/core/dayPlanner/component/normal/ReplanDayForm.vue'

/**
 * "Re-plan the rest of today" (FO4), one flow for every place that offers it: home's now bar and planner
 * card, and the day view's banner. Each caller re-reads its own copy of the day afterwards.
 *
 * Preview first, then the dialog. A preview with nothing to change never opens one, because a dialog
 * whose only content is "nothing to do" is a tap spent on nothing.
 *
 * Must be called from a setup context.
 */
export function useDayReplan() {
	const { t } = useI18n()
	const { openDialog } = useDialog()
	const { showSnackbar, showSuccessSnackbar } = useSnackbar()
	const { fetchPreview } = useDayReplanApi()
	/** True while the preview is being fetched only: the button's spinner. The open dialog has its own. */
	const previewing = ref(false)
	let inFlight = false

	/**
	 * @param isoDate the user's today, `yyyy-MM-dd`. The server refuses any other day.
	 * @param tasks the day as the caller has it on screen, for the preview's "before" row.
	 * @returns the apply's result, or null when nothing changed (no preview, nothing to move, or cancelled).
	 */
	async function replanRestOfToday(isoDate: string, tasks: PlannerTask[]): Promise<ApplyDayReplanResult | null> {
		// A second tap while the first is still fetching or its dialog is open does nothing.
		if (inFlight) return null
		inFlight = true
		try {
			return await previewThenApply(isoDate, tasks)
		} finally {
			inFlight = false
		}
	}

	async function previewThenApply(isoDate: string, tasks: PlannerTask[]): Promise<ApplyDayReplanResult | null> {
		let preview
		previewing.value = true
		try {
			preview = await fetchPreview(isoDate)
		} catch {
			// The interceptor has already reported it.
			return null
		} finally {
			previewing.value = false
		}
		if (!preview.hasChanges) {
			showSnackbar(t('planner.replan.nothingToReplan'))
			return null
		}
		const result = await openDialog<ApplyDayReplanResult>({
			component: ReplanDayForm,
			componentProps: { initialPreview: preview, tasks },
			dialogProps: {
				title: t('planner.replan.dialogTitle'),
				confirmBtnLabel: t('planner.replan.apply'),
			},
		})
		if (result) showSuccessSnackbar(t('planner.replan.applied'))
		return result
	}

	return { replanRestOfToday, previewing }
}
