import {Activity, ActivityRequest} from '@/classes/Activity';
import {ref} from 'vue';
import {Role} from '@/classes/Role';

export function useQuickCreateActivity(viewName: string) {
	const isActivityFormHidden = ref(false);
	const quickActivityName = ref("");
	const quickActivityText = ref("");

	async function getQuickCreateActivityRoleIdByView() {
		return await axios.post('/role/get-by-name/' + viewName).then((response) => {
			return Role.fromObject(response.data).id;
		});
	}

	async function quickCreateActivity() {
		const roleId = await getQuickCreateActivityRoleIdByView();
		const activityRequest = new ActivityRequest(quickActivityName.value, quickActivityText.value, false, false, roleId, null);
		return await axios.post('/activity/create', activityRequest).then((response) => {
			console.log(response);
			const activityResponse = Activity.fromObject(response.data);
			return activityResponse.id;
		});
	}

	return {
		isActivityFormHidden,
		quickActivityName,
		quickActivityText,
		quickCreateActivity,
	}
}