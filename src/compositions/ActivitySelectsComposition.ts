// useSelectOptions.ts
import {SelectOption} from '@/classes/SelectOption';
import {computed, reactive, Ref, watch} from 'vue';
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
	return axios
		.post(url)
		.then((response) => {
			allOptions.activityOptions = ActivitySelectOptionCombination.listFromObjects(response.data);
			Object.assign(allOptions, parseOptionsListFromCombinations(allOptions.activityOptions));
			return allOptions;
		})
		.catch((error) => {
			console.error('Error fetching options:', error);
			return allOptions;
		});
}

export function useActivitySelectOptionsFiltered(allOptions: Ref<ActivityFormSelectOptions>,
                                                 formData: Ref<ActivityFormRequest>) {
	watch(()=> formData.value.roleId, (newVal,oldVal) => {
		console.log((newVal !== oldVal && newVal));
		console.log(newVal);
		console.log(oldVal);
		if (newVal !== oldVal && newVal) {
			formData.value.activityId = null;
		}
	})
	watch(()=> formData.value.categoryId, (newVal,oldVal) => {
		if (newVal !== oldVal && newVal) {
			formData.value.activityId = null;
		}
	})

	return computed(() => {
		const {roleId, categoryId} = formData.value;
		const filteredOptions = new ActivityFormSelectOptions();
		filteredOptions.activityOptions = allOptions.value.activityOptions.filter(activity =>
			(roleId === null || activity.roleOption.id === roleId) &&
			(categoryId === null || activity.categoryOption?.id === categoryId)
		);
		const {roleOptions, categoryOptions} = parseOptionsListFromCombinations(filteredOptions.activityOptions);
		filteredOptions.roleOptions = roleId && !categoryId ? allOptions.value.roleOptions : roleOptions;
		filteredOptions.categoryOptions = categoryId && !roleId ? allOptions.value.categoryOptions : categoryOptions;
		return filteredOptions;
	});
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