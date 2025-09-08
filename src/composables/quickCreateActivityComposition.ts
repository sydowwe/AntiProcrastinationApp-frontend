import {Activity, ActivityRequest, QuickEditActivityRequest} from '@/classes/Activity';
import {ref} from 'vue';
import {Role} from '@/classes/Role';
import {API} from '@/plugins/axiosConfig.ts';
import {useEntityCommand} from '@/composables/general/CrudComposition.ts';
import {useActivityCrud} from '@/composables/ConcretesCrudComposable.ts';

export function useQuickCreateActivity(viewName: string) {
	const {create} = useActivityCrud()

	const isActivityFormHidden = ref(false);
	const quickActivityName = ref<string>();
	const quickActivityText = ref<string | null>(null);
	const quickActivityCategoryId = ref<number | null>(null);


	async function getQuickCreateActivityRoleIdByView() {
		return await API.get('/activity-role/by-name/' + viewName).then((response) => {
			console.log(response.data)
			return Role.fromJson(response.data).id;
		});
	}

	async function quickCreateActivity() {
		const roleId = await getQuickCreateActivityRoleIdByView();
		const activityRequest = new ActivityRequest(quickActivityName.value, quickActivityText.value, roleId, quickActivityCategoryId.value, false, false, null);
		const id = await create(activityRequest);
		return id;
	}

	//TODO upravit ze ked je ine meno tak sa spyta ci upravit pre vsetky aktivity alebo naklonovat terajsiu len so zmenenym menom pre text vzdy menit vo vsetkyc aktivitach
	async function quickEditActivity(activityId: number) {
		if (quickActivityName.value) {
			return await API.patch(
				'/activity/' + activityId,
				new QuickEditActivityRequest(quickActivityName.value, quickActivityText.value, quickActivityCategoryId.value)
			)
				.then((response) => {
					return response.status === 204;
				});
		} else {
			return false;
		}
	}

	return {
		isActivityFormHidden,
		quickActivityName,
		quickActivityText,
		quickActivityCategoryId,
		quickCreateActivity,
		quickEditActivity
	}
}