import { ref } from 'vue'
import { Role } from '@/core/activity/dto/response/Role.ts'
import { API } from '@/_common/axiosConfig.ts'
import { useActivityCrud } from '@/core/activity/api/activityApi.ts'
import { QuickActivityToolsDto } from '@/core/activity/dto/response/QuickActivityToolsDto.ts'
import { ActivityRequest } from '@/core/activity/dto/request/ActivityRequest.ts'
import { QuickEditActivityRequest } from '@/core/activity/dto/request/QuickEditActivityRequest.ts'

export type QuickCreateActivityRoleName = 'Routine task' | 'To-do list task' | 'Planner task'

export type ActivityFormFieldResultStatus = 'edit' | 'create' | 'noChange' | 'fromExisting'

export function useQuickCreateActivity(viewName: string) {
	const { create, quickEdit } = useActivityCrud()

	const isActivityFormHidden = ref(false)

	const dto = ref(QuickActivityToolsDto.createEmpty)

	async function getQuickCreateActivityRoleIdByView() {
		return await API.get('/activity-role/by-name/' + viewName).then(response => {
			return Role.fromJson(response.data).id
		})
	}

	async function quickCreateActivity() {
		const roleId = await getQuickCreateActivityRoleIdByView()
		const activityRequest = new ActivityRequest(dto.value.name, dto.value.text, roleId, dto.value.categoryId, false)
		return await create(activityRequest)
	}

	// Renaming an activity changes what every other picker shows for it; `quickEdit` invalidates the
	// shared option cache, which is what the old `//TODO needs refresh to other activities that are
	// using this activity` was asking for.
	async function quickEditActivity(activityId: number, quickEditMode: 'Overwrite' | 'Clone') {
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
