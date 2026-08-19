import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
import { useActivityCrud } from '@/core/activity/api/activityApi.ts'
import { useActivityOptionsStore } from '@/core/activity/store/activityOptionsStore.ts'
import type { QuickEditMode } from '@/core/activity/dto/enum/QuickEditMode.ts'
import type { SystemActivityRole } from '@/core/activity/dto/enum/SystemActivityRole.ts'
import { QuickActivityToolsDto } from '@/core/activity/dto/response/QuickActivityToolsDto.ts'
import { ActivityRequest } from '@/core/activity/dto/request/ActivityRequest.ts'
import { QuickEditActivityRequest } from '@/core/activity/dto/request/QuickEditActivityRequest.ts'

export type ActivityFormFieldResultStatus = 'edit' | 'create' | 'noChange' | 'fromExisting'

/**
 * Quick-create/quick-edit behind the dialogs in `todoList` and `dayPlanner`.
 *
 * `systemRole` is an identity, not a label. Resolving it to an id is the store's job — cached for the
 * session and invalidated by any role mutation — so a quick-create no longer costs a round trip for a
 * value that changes approximately never.
 */
export function useQuickCreateActivity(systemRole: SystemActivityRole) {
	const { create, quickEdit } = useActivityCrud()
	const optionsStore = useActivityOptionsStore()
	const i18n = useI18n()
	const { showErrorSnackbar } = useSnackbar()

	const isActivityFormHidden = ref(false)

	const dto = ref(QuickActivityToolsDto.createEmpty)

	/**
	 * Resolves to the new activity's id, or `null` when the role could not be resolved and nothing was
	 * created. The caller must not report a create it did not get: this used to reject, which the axios
	 * interceptor turned into a generic error snackbar while `execAndReturnStatus` returned undefined —
	 * indistinguishable from the user cancelling, so the activity just silently never appeared.
	 */
	async function quickCreateActivity(): Promise<number | null> {
		const roleId = await optionsStore.ensureSystemRoleId(systemRole)
		if (roleId == null) {
			showErrorSnackbar(
				i18n.t('activities.systemRoleMissing', { role: i18n.t(`activities.systemRole.${systemRole}`) }),
			)
			return null
		}
		const activityRequest = new ActivityRequest(dto.value.name, dto.value.text, roleId, dto.value.categoryId, false)
		return await create(activityRequest)
	}

	// Renaming an activity changes what every other picker shows for it; `quickEdit` invalidates the
	// shared option cache, which is what the old `//TODO needs refresh to other activities that are
	// using this activity` was asking for.
	async function quickEditActivity(activityId: number, quickEditMode: QuickEditMode) {
		return await quickEdit(
			activityId,
			quickEditMode,
			new QuickEditActivityRequest(dto.value.name, dto.value.text, dto.value.categoryId),
		)
	}

	return {
		activityFormFieldData: dto,
		isActivityFormHidden,
		quickCreateActivity,
		quickEditActivity,
	}
}
