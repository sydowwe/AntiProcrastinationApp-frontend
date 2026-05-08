// useSelectOptions.ts
import { SelectOption } from '@/dtos/response/general/SelectOption.ts'
import { API } from '@/plugins/axiosConfig.ts'
import type { ActivityOptionsSource } from '@/dtos/enum/ActivityOptionsSource.ts'
import { ActivitySelectOptionCombination } from '@/dtos/response/activity/ActivitySelectOptionCombination.ts'
import type { ActivityFormRequest } from '@/dtos/request/activity/ActivityFormRequest.ts'
import { ActivityFormSelectOptions } from '@/dtos/response/activity/ActivityFormSelectOptions.ts'

export enum EntityWithSelectOptions {
	Role = 'role',
	Category = 'category',
	TaskPriority = 'task-priority',
	TimePeriod = 'routine-time-period',
}

export function uniqueOptions(options: SelectOption[]) {
	return Array.from(new Map(options.map(option => [option.id, option])).values())
}

export async function getAllActivityFormSelectOptionsCombinations(activitySource: ActivityOptionsSource) {
	const url = `${activitySource}/form-select-options`
	return await API.get(url)
		.then(response => {
			return ActivitySelectOptionCombination.listFromJsonList(response.data)
		})
		.catch(error => {
			console.error('Error fetching options:', error)
			return []
		})
}

export function filterActivityFormSelectOptions(
	allOptionsCombinations: ActivitySelectOptionCombination[],
	formData: ActivityFormRequest,
) {
	// Filter combinations excluding each field to get options for that field
	const combinationsForRole = allOptionsCombinations.filter(
		combination =>
			(!formData.activityId || combination.id === formData.activityId) &&
			(!formData.categoryId || combination.categoryOption?.id === formData.categoryId) &&
			(!formData.taskPriorityId || combination.taskPriorityOption?.id === formData.taskPriorityId) &&
			(!formData.routineTimePeriodId || combination.routineTimePeriodOption?.id === formData.routineTimePeriodId),
	)

	const combinationsForCategory = allOptionsCombinations.filter(
		combination =>
			(!formData.activityId || combination.id === formData.activityId) &&
			(!formData.roleId || combination.roleOption.id === formData.roleId) &&
			(!formData.taskPriorityId || combination.taskPriorityOption?.id === formData.taskPriorityId) &&
			(!formData.routineTimePeriodId || combination.routineTimePeriodOption?.id === formData.routineTimePeriodId),
	)

	const combinationsForActivity = allOptionsCombinations.filter(
		combination =>
			(!formData.roleId || combination.roleOption.id === formData.roleId) &&
			(!formData.categoryId || combination.categoryOption?.id === formData.categoryId) &&
			(!formData.taskPriorityId || combination.taskPriorityOption?.id === formData.taskPriorityId) &&
			(!formData.routineTimePeriodId || combination.routineTimePeriodOption?.id === formData.routineTimePeriodId),
	)

	const filteredOptions = new ActivityFormSelectOptions()
	filteredOptions.activityOptions = uniqueOptions(
		combinationsForActivity.map(combination => new SelectOption(combination.id, combination.text)),
	)
	filteredOptions.roleOptions = uniqueOptions(combinationsForRole.map(combination => combination.roleOption))
	filteredOptions.categoryOptions = uniqueOptions(
		combinationsForCategory
			.map(combination => combination.categoryOption)
			.filter((option): option is SelectOption => option !== null),
	)
	filteredOptions.taskPriorityOptions = uniqueOptions(
		allOptionsCombinations
			.map(combination => combination.taskPriorityOption)
			.filter((option): option is SelectOption => option !== null),
	)
	filteredOptions.routineTimePeriodOptions = uniqueOptions(
		allOptionsCombinations
			.map(combination => combination.routineTimePeriodOption)
			.filter((option): option is SelectOption => option !== null),
	)
	return filteredOptions
}
