// useSelectOptions.ts
import {SelectOption} from '@/classes/SelectOption';
import {reactive, Ref, ref, toRefs, UnwrapRef, watch} from 'vue';
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
	return {selectOptions};
}

export async function useActivitySelectOptions(activitySource: ActivityOptionsSource) {
	const allOptions = new ActivityFormSelectOptions([], [], [])
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
	return allOptions;
}

export function useActivitySelectOptionsFiltered(activityOptions: Ref<ActivityFormSelectOptions>,
                                                 formData: Ref<ActivityFormRequest>) {
	const filteredOptions = ref(new ActivityFormSelectOptions([], [], []))

	function updateFilteredOptions(formData: ActivityFormRequest) {
		const {roleId, categoryId} = formData;
		console.log(activityOptions);
		filteredOptions.value.activityOptions = filteredOptions.value.activityOptions.filter(activity =>
			(roleId === null || activity.roleOption.id === roleId) &&
			(categoryId === null || activity.categoryOption.id === categoryId)
		);
		console.log(filteredOptions.value.activityOptions);
		const {roleOptions, categoryOptions} = parseOptionsListFromCombinations(filteredOptions.value.activityOptions);
		filteredOptions.value.roleOptions = roleOptions;
		filteredOptions.value.categoryOptions = categoryOptions;
	}

	watch(() => formData.value, newValue => {
		console.log(newValue);
		updateFilteredOptions(newValue);
	}, {deep: true});
	watch(() => formData.value, newValue => {
		console.log(newValue);
		updateFilteredOptions(newValue);
	}, {deep: true});

	updateFilteredOptions(formData.value);

	return filteredOptions;
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
	return {roleOptions, categoryOptions};
}