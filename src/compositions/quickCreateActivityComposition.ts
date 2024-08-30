import {Activity, ActivityRequest, QuickEditActivityRequest} from '@/classes/Activity';
import {ref} from 'vue';
import {Role} from '@/classes/Role';

export function useQuickCreateActivity(viewName: string) {
	const isActivityFormHidden = ref(false);
	const quickActivityName = ref<string | null>(null);
	const quickActivityText = ref<string | null>(null);

	async function getQuickCreateActivityRoleIdByView() {
		return await axios.post('/role/get-by-name/' + viewName).then((response) => {
			console.log(response.data)
			return Role.fromObject(response.data).id;
		});
	}

	async function quickCreateActivity() {
		if (quickActivityName.value) {
			const roleId = await getQuickCreateActivityRoleIdByView();
			const activityRequest = new ActivityRequest(quickActivityName.value, quickActivityText.value, false, false, roleId, null);
			return await axios.post('/activity/create', activityRequest).then((response) => {
				console.log(response);
				const activityResponse = Activity.fromObject(response.data);
				return activityResponse.id;
			});
		} else {

			return null;
		}
	}

	//TODO upravit ze ked je ine meno tak sa spyta ci upravit pre vsetky aktivity alebo naklonovat terajsiu len so zmenenym menom pre text vzdy menit vo vsetkyc aktivitach
	async function quickEditActivity(activityId:number) {
		if (quickActivityName.value) {
			return await axios.post(
				'/activity/quick-edit/'+activityId,
				new QuickEditActivityRequest(quickActivityName.value, quickActivityText.value)
			)
				.then((response) => {
					if (response.data.status === 'success') {
						return true;
					}
				});
		} else {
			return false;
		}
	}

	return {
		isActivityFormHidden,
		quickActivityName,
		quickActivityText,
		quickCreateActivity,
		quickEditActivity
	}
}