import { useI18n } from 'vue-i18n'
import type { Time } from '@/_common/dto/dto/Time.ts'
import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
import { createActivityHistorySession, useActivityHistoryCrud } from '@/core/activityHistory/api/activityHistoryApi.ts'
import type { ActivityHistorySessionRequest } from '@/core/activityHistory/dto/request/ActivityHistorySessionRequest.ts'

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

	/**
	 * Commit a whole timer session — every phase row, or none of them — with one snackbar for all of
	 * it. The API writes the session in one transaction, so a failure leaves nothing half-saved.
	 */
	async function saveSessionToHistory(request: ActivityHistorySessionRequest, activityName: string) {
		const created = await createActivityHistorySession(request)
		if (created) {
			showSuccessSnackbar(t('history.addedToHistory', { activity: activityName }))
			return created
		}
		showErrorSnackbar(t('history.errorSavingToHistory', { activity: activityName }))
		return null
	}

	return { saveActivityToHistory, saveSessionToHistory }
}
