// useSelectOptions.ts
import {SelectOption} from '@/classes/SelectOption';
import {
	ActivityFormRequest,
	ActivityFormSelectOptions,
	ActivityOptionsSource,
	ActivitySelectOptionCombination
} from '@/classes/ActivityFormHelper';
import {API} from '@/plugins/axiosConfig.ts';

export enum EntityWithSelectOptions {
	Role = 'role',
	Category = 'category',
	TaskUrgency = 'task-urgency',
	TimePeriod = 'routine-time-period'
}

export function uniqueOptions(options: SelectOption[]) {
	return Array.from(new Map(options.map(option => [option.id, option])).values())
}


export async function getAllActivityFormSelectOptionsCombinations(activitySource: ActivityOptionsSource) {
	let url = `${activitySource}/get-all-activity-form-selects-options`;
	return await API.post(url)
		.then((response) => {
			return ActivitySelectOptionCombination.listFromJsonList(response.data);
		})
		.catch((error) => {
			console.error('Error fetching options:', error);
			return [];
		});
}

export function filterActivityFormSelectOptions(allOptionsCombinations: ActivitySelectOptionCombination[],
                                                formData: ActivityFormRequest) {
	const filteredCombinations = allOptionsCombinations.filter(combination =>
		(!formData.activityId || combination.id === formData.activityId) &&
		(!formData.roleId || combination.roleOption.id === formData.roleId) &&
		(!formData.categoryId || combination.categoryOption?.id === formData.categoryId) &&
		(!formData.taskUrgencyId || combination.taskUrgencyOption?.id === formData.taskUrgencyId) &&
		(!formData.routineTimePeriodId || combination.routineTimePeriodOption?.id === formData.routineTimePeriodId)
	);
	filteredCombinations.forEach(combination => {

	});

	const filteredOptions = new ActivityFormSelectOptions();
	filteredOptions.activityOptions = uniqueOptions(
		(formData.activityId ? allOptionsCombinations : filteredCombinations)
			.map(combination => new SelectOption(combination.id, combination.text)));
	filteredOptions.roleOptions = uniqueOptions(
		(formData.activityId || formData.roleId ? allOptionsCombinations : filteredCombinations)
			.map(combination => combination.roleOption));
	filteredOptions.categoryOptions = uniqueOptions(
		(formData.activityId || formData.categoryId ? allOptionsCombinations : filteredCombinations)
			.map(combination => combination.categoryOption).filter(option => option !== null));
	filteredOptions.taskUrgencyOptions = uniqueOptions(
		(formData.activityId || formData.taskUrgencyId ? allOptionsCombinations : filteredCombinations)
			.map(combination => combination.taskUrgencyOption).filter(option => option !== null));
	filteredOptions.routineTimePeriodOptions = uniqueOptions(
		(formData.activityId || formData.routineTimePeriodId ? allOptionsCombinations : filteredCombinations)
			.map(combination => combination.routineTimePeriodOption).filter(option => option !== null));
	return filteredOptions;
}

// export async function getAllActivityFormSelectOptions(activitySource: ActivityOptionsSource) {
// 	const allOptions = new ActivityFormSelectOptions();
// 	let url = `${activitySource}/get-all-activity-form-select-options`;
// 	return axios
// 		.post(url)
// 		.then((response) => {
// 			allOptions.activityOptions = ActivitySelectOptionCombination.listFromObjects(response.data);
// 			Object.assign(allOptions, parseOptionsListFromCombinations(allOptions.activityOptions));
// 			return allOptions;
// 		})
// 		.catch((error) => {
// 			console.error('Error fetching options:', error);
// 			return allOptions;
// 		});
// }
//
// export function useActivitySelectOptionsFiltered(allOptions: Ref<ActivityFormSelectOptions>,
//                                                  formData: Ref<ActivityFormRequest>) {
// 	watch(() => formData.value.roleId, (newVal, oldVal) => {
// 		console.log((newVal !== oldVal && newVal));
// 		console.log(newVal);
// 		console.log(oldVal);
// 		if (newVal !== oldVal && newVal) {
// 			formData.value.activityId = null;
// 		}
// 	})
// 	watch(() => formData.value.categoryId, (newVal, oldVal) => {
// 		if (newVal !== oldVal && newVal) {
// 			formData.value.activityId = null;
// 		}
// 	})
//
// 	return computed(() => {
// 		const {roleId, categoryId} = formData.value;
// 		const filteredOptions = new ActivityFormSelectOptions();
// 		filteredOptions.activityOptions = allOptions.value.activityOptions.filter(activity =>
// 			(roleId === null || activity.roleOption.id === roleId) &&
// 			(categoryId === null || activity.categoryOption?.id === categoryId)
// 		);
// 		const {roleOptions, categoryOptions} = parseOptionsListFromCombinations(filteredOptions.activityOptions);
// 		filteredOptions.roleOptions = roleId && !categoryId ? allOptions.value.roleOptions : roleOptions;
// 		filteredOptions.categoryOptions = categoryId && !roleId ? allOptions.value.categoryOptions : categoryOptions;
// 		return filteredOptions;
// 	});
// }
//
//
// function parseOptionsListFromCombinations(combinations: ActivitySelectOptionCombination[]) {
// 	const roleOptions = combinations
// 		.map(c => c.roleOption)
// 		.filter((option, index, self) =>
// 			index === self.findIndex((o) => o.id === option.id)
// 		);
// 	const categoryOptions = combinations
// 		.map(c => c.categoryOption)
// 		.filter((option, index, self) =>
// 			option !== null && index === self.findIndex((o) => o.id === option.id)
// 		);
// 	return {roleOptions, categoryOptions};
// }