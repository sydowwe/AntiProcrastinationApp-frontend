import {ref} from 'vue';
import {Role} from '@/dtos/response/activity/Role.ts';
import {API} from '@/plugins/axiosConfig.ts';
import {useActivityCrud} from '@/api/ConcretesCrudComposable.ts';
import {QuickActivityToolsDto} from '@/dtos/response/activity/QuickActivityToolsDto.ts';
import {ActivityRequest} from '@/dtos/request/activity/ActivityRequest.ts';
import {QuickEditActivityRequest} from '@/dtos/request/activity/QuickEditActivityRequest.ts';

export type QuickCreateActivityRoleName = 'Routine task' | 'To-do list task' | 'Planner task'

export type ActivityFormFieldResultStatus = 'edit' | 'create' | 'noChange' | 'fromExisting';

export function useQuickCreateActivity(viewName: string) {
	const {create} = useActivityCrud()

	const isActivityFormHidden = ref(false);

	const dto = ref(QuickActivityToolsDto.createEmpty)


	async function getQuickCreateActivityRoleIdByView() {
		return await API.get('/activity-role/by-name/' + viewName).then((response) => {
			console.log(response.data)
			return Role.fromJson(response.data).id;
		});
	}

	async function quickCreateActivity() {
		const roleId = await getQuickCreateActivityRoleIdByView();
		const activityRequest = new ActivityRequest(dto.value.name, dto.value.text, roleId, dto.value.categoryId, false);
		return await create(activityRequest);
	}

	//TODO needs refresh to other activities that are using this activity
	async function quickEditActivity(activityId: number, quickEditMode: 'Overwrite' | 'Clone') {
		const response = await API.patch(`/activity/${activityId}/${quickEditMode}`,
			new QuickEditActivityRequest(dto.value.name, dto.value.text, dto.value.categoryId))
		return response.data ? parseInt(response.data) : null;
	}

	return {
		activityFormFieldData: dto,
		isActivityFormHidden,
		quickCreateActivity,
		quickEditActivity
	}
}