import { useI18n } from 'vue-i18n'
import type { Time } from '@/_common/dto/dto/Time.ts'
import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
import { useActivityHistoryCrud } from '@/core/activityHistory/api/activityHistoryApi.ts'

/**
 * Commit one activity to the history, with the snackbar that goes with it.
 *
 * This used to live in the activity module's selection composable, which meant the three timer views
 * saved their record by calling `activitySelectionForm.value?.saveActivityToHistory(...)` — a
 * selection component committing a record on their behalf. Writing history records is this module's
 * job; a view that has a selection and a duration owns its own save.
 */
export function useSaveActivityToHistory() {
	const { t } = useI18n()
	const { showErrorSnackbar, showSuccessSnackbar } = useSnackbar()
	const { create } = useActivityHistoryCrud()

	async function saveActivityToHistory(
		activityId: number | null,
		activityName: string,
		startTimestamp: Date,
		activityLength: Time,
	) {
		if (activityId == null) {
			showErrorSnackbar(t('activities.pleaseSelectActivity'))
			return null
		}
		const newId = await create(startTimestamp, activityLength, activityId)
		if (newId) {
			showSuccessSnackbar(t('history.addedToHistory', { activity: activityName }))
			return newId
		}
		showErrorSnackbar(t('history.errorSavingToHistory', { activity: activityName }))
		return null
	}

	return { saveActivityToHistory }
}
