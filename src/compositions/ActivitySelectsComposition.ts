// useSelectOptions.ts
import {SelectOption} from '@/classes/SelectOption';
import {reactive, Ref, ref, toRefs, watch} from 'vue';
import {
	ActivityFormRequest,
	ActivityFormSelectOptions,
	ActivityOptionsSource,
	ActivitySelectOptionCombination
} from '@/classes/ActivityFormHelper';

export async function useRoleCategorySelectOptions() {
	const selectOptions = reactive({
		roleOptions: [] as SelectOption[],
		categoryOptions: [] as SelectOption[],
	});

	async function populateSelects(dataKey: keyof typeof selectOptions, url: string) {
		axios
			.post(url)
			.then((response) => {
				selectOptions[dataKey] = response.data as SelectOption[];
			})
			.catch((error) => {
				console.error('Error fetching options:', error);
			});
	}
	await populateSelects('roleOptions', '/role/get-all-options');
	await populateSelects('categoryOptions', '/category/get-all-options');
	return { selectOptions };
}

export async function useActivitySelectOptions(activitySource: ActivityOptionsSource) {
	const allOptions = new ActivityFormSelectOptions([],[],[])
	let url = `${activitySource}/get-all-activity-form-select-options`;
	axios
		.post(url)
		.then((response) => {
			allOptions.activityOptions = ActivitySelectOptionCombination.listFromObjects(response.data);
			Object.assign(allOptions, parseOptionsListFromCombinations(allOptions.activityOptions));
		})
		.catch((error) => {
			console.error('Error fetching options:', error);
		});
	return {allOptions};
}


export interface ActivitySelectOptionFilteringParams {
	activityOptions: Ref<ActivitySelectOptionCombination[]>,
	roleOptions: Ref<SelectOption[]>,
	categoryOptions: Ref<SelectOption[]>,
	formData: Ref<ActivityFormRequest>
}

export function useActivitySelectOptionsFiltered(params: ActivitySelectOptionFilteringParams) {
	const filteredActivityOptions = ref([] as ActivitySelectOptionCombination[]);
	const filteredRoleOptions = ref([] as SelectOption[]);
	const filteredCategoryOptions = ref([] as SelectOption[]);

	function updateFilteredOptions(formData: ActivityFormRequest) {
		const {roleId, categoryId} = formData;
		console.log(params.activityOptions.value);
		filteredActivityOptions.value = params.activityOptions.value.filter(activity =>
			(roleId === null || activity.roleOption.id === roleId) &&
			(categoryId === null || activity.categoryOption.id === categoryId)
		);
		console.log(filteredActivityOptions.value);
		const { roleOptions, categoryOptions } = parseOptionsListFromCombinations(filteredActivityOptions.value);
		filteredRoleOptions.value = roleOptions;
		filteredCategoryOptions.value = categoryOptions;
	}

	watch(() => params.formData.value, newValue => {
		console.log(newValue);
		updateFilteredOptions(newValue);
	}, {deep: true});

	updateFilteredOptions(params.formData.value);

	return {filteredActivityOptions, filteredRoleOptions, filteredCategoryOptions};
}

function parseOptionsListFromCombinations(combinations: ActivitySelectOptionCombination[]) {
	const roleOptions = combinations
		.map(c => c.roleOption)
		.filter((option, index, self) =>
			index === self.findIndex((o) => o.id === option.id)
		);

	const categoryOptions = combinations
		.map(c => c.categoryOption)
		.filter((option, index, self) =>
			option !== null && index === self.findIndex((o) => o.id === option.id)
		);

	return { roleOptions, categoryOptions };
	return {roleOptions, categoryOptions};
}