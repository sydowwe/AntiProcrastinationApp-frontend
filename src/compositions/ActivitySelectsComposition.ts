// useSelectOptions.ts
import {SelectOption} from '@/classes/SelectOption';
import {reactive, Ref, ref, toRefs, watch} from 'vue';
import {ActivityFormRequest, ActivitySelectOption} from '@/classes/Activity';

export async function useActivitySelectOptions(includeActivity = true) {
	const selectOptions = reactive({
		roleOptions: [] as SelectOption[],
		categoryOptions: [] as SelectOption[],
		activityOptions: [] as ActivitySelectOption[],
	});

	 async function populateSelects(dataKey: keyof typeof selectOptions, url: string) {
		axios
			.post(url)
			.then((response) => {
				if (dataKey === "activityOptions") {
					selectOptions[dataKey] = response.data as ActivitySelectOption[];
				} else {
					selectOptions[dataKey] = response.data as SelectOption[];
				}
			})
			.catch((error) => {
				console.error('Error fetching options:', error);
			});
	}

	await populateSelects('roleOptions', '/role/get-all-options');
	await populateSelects('categoryOptions', '/category/get-all-options');

	if (includeActivity) {
		await populateSelects('activityOptions', '/activity/get-all-options');
	}
	return { ...toRefs(selectOptions) };
}

export interface ActivitySelectOptionFilteringParams {
	activityOptions: Ref<ActivitySelectOption[]>,
	roleOptions: Ref<SelectOption[]>,
	categoryOptions: Ref<SelectOption[]>,
	formData: Ref<ActivityFormRequest>
}

export function useActivitySelectOptionsFiltered(params: ActivitySelectOptionFilteringParams) {
	const filteredActivityOptions = ref([] as ActivitySelectOption[]);
	const filteredRoleOptions = ref([] as SelectOption[]);
	const filteredCategoryOptions = ref([] as SelectOption[]);

	function updateFilteredOptions(formData: ActivityFormRequest) {
		const { roleId, categoryId } = formData;
		console.log(params.activityOptions.value);
		filteredActivityOptions.value = params.activityOptions.value.filter(activity =>
			(roleId === null || activity.roleId === roleId) &&
			(categoryId === null || activity.categoryId === categoryId)
		);
		console.log(filteredActivityOptions.value);
		const roleIdSet = new Set(filteredActivityOptions.value.map(activity => activity.roleId));
		filteredRoleOptions.value = params.roleOptions.value.filter(role => roleIdSet.has(role.id));
		const categoryIdSet = new Set(filteredActivityOptions.value.map(activity => activity.categoryId));
		filteredCategoryOptions.value = params.categoryOptions.value.filter(category => categoryIdSet.has(category.id));
	}

	// Watch for changes in form data and update options
	watch(() => params.formData.value, newValue=>{
		console.log(newValue);
		updateFilteredOptions(newValue);
	}, { deep: true });

	updateFilteredOptions(params.formData.value);

	return {filteredActivityOptions, filteredRoleOptions, filteredCategoryOptions};
}
export async function useAllActivitySelectOptionsFiltered(formData: Ref<ActivityFormRequest>){
	return await useActivitySelectOptions(true).then(e=>{
		console.log(e.roleOptions.value)
		return useActivitySelectOptionsFiltered({roleOptions: e.roleOptions,categoryOptions: e.categoryOptions,activityOptions: e.activityOptions, formData})
	});
}
