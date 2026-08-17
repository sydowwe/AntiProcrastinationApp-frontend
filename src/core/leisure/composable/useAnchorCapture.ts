import { useI18n } from 'vue-i18n'
import { useDialog } from '@/_common/composable/general/useDialog.ts'
import MemoryAnchorForm from '@/core/leisure/component/memoryAnchor/MemoryAnchorForm.vue'

// The one place that turns "I did this" into a memory anchor. Both the bucket list and the one-time
// half of the backlog reach the same dialog with the activity already chosen, so the user only ever
// supplies the two fields that are actually about the experience: how good it was, and what to
// remember. Anything more between doing a thing and recording it and the record does not get made.
export function useAnchorCapture() {
	const { openDialog } = useDialog()
	const { t } = useI18n()

	/** Resolves true when an anchor was created, so the caller can refetch the row it came from. */
	async function captureAnchor(activityId: number, activityName: string): Promise<boolean> {
		const result = await openDialog({
			component: MemoryAnchorForm,
			componentProps: { presetActivityId: activityId, presetActivityName: activityName },
			dialogProps: {
				title: t('leisure.experienced.captureTitle'),
				confirmBtnLabel: t('leisure.experienced.captureConfirm'),
			},
		})
		return result != null
	}

	return { captureAnchor }
}
