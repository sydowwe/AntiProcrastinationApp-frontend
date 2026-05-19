import { computed, onMounted, ref, watch } from 'vue'
import type { Ref } from 'vue'
import type { Time } from '@/dtos/dto/Time.ts'
import type { ActivityFormRequest } from '@/dtos/request/activity/ActivityFormRequest.ts'
import type { ActivityOptionsSource } from '@/dtos/enum/ActivityOptionsSource.ts'
import {
	filterActivityFormSelectOptions,
	getAllActivityFormSelectOptionsCombinations,
} from '@/composables/activity/ActivitySelectsComposition.ts'
import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
import { useActivityHistoryCrud } from '@/api/activityHistory/activityHistoryApi.ts'
import { ActivityFormSelectOptions } from '@/dtos/response/activity/ActivityFormSelectOptions.ts'
import type { ActivitySelectOptionCombination } from '@/dtos/response/activity/ActivitySelectOptionCombination.ts'
import { SelectOption } from '@/dtos/response/general/SelectOption.ts'
import type { ActivityRequest } from '@/dtos/request/activity/ActivityRequest.ts'

export function useActivitySelectionFormState(
	formData: Ref<ActivityFormRequest>,
	selectedActivityId: Ref<number | null>,
	isFilter: boolean,
	selectOptionsSource: ActivityOptionsSource,
) {
	const { showErrorSnackbar, showSuccessSnackbar } = useSnackbar()
	const { create } = useActivityHistoryCrud()

	const allOptionsCombinations = ref<ActivitySelectOptionCombination[]>([])
	const filteredOptions = ref(new ActivityFormSelectOptions())
	const loading = ref(false)

	const activityIdModel = computed({
		get: () => (isFilter ? formData.value.activityId : selectedActivityId.value),
		set: (value: number | null) => {
			if (isFilter) {
				formData.value.activityId = value
			} else {
				selectedActivityId.value = value
			}
		},
	})

	const getSelectedRoleName = computed(
		() => filteredOptions.value.roleOptions.find(item => item.id === formData.value.roleId)?.text ?? '',
	)
	const getSelectedCategoryName = computed(
		() => filteredOptions.value.categoryOptions.find(item => item.id === formData.value.categoryId)?.text ?? '',
	)
	const getSelectedTaskPriorityName = computed(
		() =>
			filteredOptions.value.taskPriorityOptions.find(item => item.id === formData.value.taskPriorityId)?.text ??
			'',
	)
	const getSelectedRoutineTimePeriodName = computed(
		() =>
			filteredOptions.value.routineTimePeriodOptions.find(item => item.id === formData.value.routineTimePeriodId)
				?.text ?? '',
	)
	const getSelectedActivityName = computed(
		() => filteredOptions.value.activityOptions.find(item => item.id === activityIdModel.value)?.text ?? '',
	)
	const getSelectedActivityId = computed(() => formData.value.activityId)

	onMounted(async () => {
		loading.value = true
		allOptionsCombinations.value = await getAllActivityFormSelectOptionsCombinations(selectOptionsSource)
		formData.value.activityId = formData.value.activityId ?? null
		filteredOptions.value = filterActivityFormSelectOptions(allOptionsCombinations.value, formData.value)
		loading.value = false
	})

	watch(
		formData,
		newValue => {
			if (isFilter) {
				filteredOptions.value = filterActivityFormSelectOptions(allOptionsCombinations.value, formData.value)
				activityIdModel.value = newValue.activityId
			}
		},
		{ deep: true, immediate: true },
	)

	watch(
		() => formData.value.isFromToDoList,
		newValue => {
			if (!newValue) formData.value.taskPriorityId = null
		},
	)

	watch(
		() => formData.value.isFromRoutineToDoList,
		newValue => {
			if (!newValue) formData.value.routineTimePeriodId = null
		},
	)

	async function saveActivityToHistory(startTimestamp: Date, activityLength: Time) {
		if (!activityIdModel.value) {
			showErrorSnackbar('Please select an activity')
			return null
		}
		const newId = await create(startTimestamp, activityLength, activityIdModel.value)
		if (newId) {
			showSuccessSnackbar(`Added record of activity ${getSelectedActivityName.value} to history`)
			return newId
		}
		showErrorSnackbar(`Error saving record of activity ${getSelectedActivityName.value} to history`)
		return null
	}

	function onActivityCreated(request: ActivityRequest, createdId: number) {
		filteredOptions.value.activityOptions.push(new SelectOption(createdId, request.name))
		activityIdModel.value = createdId
	}

	return {
		loading,
		filteredOptions,
		activityIdModel,
		getSelectedActivityName,
		getSelectedActivityId,
		getSelectedRoleName,
		getSelectedCategoryName,
		getSelectedTaskPriorityName,
		getSelectedRoutineTimePeriodName,
		saveActivityToHistory,
		onActivityCreated,
	}
}
