import { computed, onMounted, ref, watch } from 'vue'
import type { Ref } from 'vue'
import { useI18n } from 'vue-i18n'
import type { Time } from '@/_common/dto/dto/Time.ts'
import type { ActivityFormRequest } from '@/core/activity/dto/request/ActivityFormRequest.ts'
import type { ActivityOptionsSource } from '@/core/activity/dto/enum/ActivityOptionsSource.ts'
import {
	filterActivityFormSelectOptions,
	useActivityFormSelectOptions,
} from '@/core/activity/composable/ActivitySelectsComposition.ts'
import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
import { useActivityHistoryCrud } from '@/core/activityHistory/api/activityHistoryApi.ts'
import { ActivityFormSelectOptions } from '@/core/activity/dto/response/ActivityFormSelectOptions.ts'
import type { ActivitySelectOptionCombination } from '@/core/activity/dto/response/ActivitySelectOptionCombination.ts'
import { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'
import type { ActivityRequest } from '@/core/activity/dto/request/ActivityRequest.ts'

export function useActivitySelectionFormState(
	formData: Ref<ActivityFormRequest>,
	selectedActivityId: Ref<number | null>,
	isFilter: boolean,
	selectOptionsSource: ActivityOptionsSource,
) {
	const { t } = useI18n()
	const { showErrorSnackbar, showSuccessSnackbar } = useSnackbar()
	const { create } = useActivityHistoryCrud()
	const { getAllActivityFormSelectOptionsCombinations } = useActivityFormSelectOptions()

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
	onMounted(async () => {
		loading.value = true
		try {
			allOptionsCombinations.value = await getAllActivityFormSelectOptionsCombinations(selectOptionsSource)
			formData.value.activityId = formData.value.activityId ?? null
			filteredOptions.value = filterActivityFormSelectOptions(allOptionsCombinations.value, formData.value)
		} catch {
			allOptionsCombinations.value = []
			filteredOptions.value = new ActivityFormSelectOptions()
		} finally {
			loading.value = false
		}
	})

	watch(
		formData,
		newValue => {
			filteredOptions.value = filterActivityFormSelectOptions(allOptionsCombinations.value, formData.value)
			if (isFilter) {
				activityIdModel.value = newValue.activityId
			}
			if (
				activityIdModel.value != null &&
				!filteredOptions.value.activityOptions.some(option => option.id === activityIdModel.value)
			) {
				activityIdModel.value = null
			}
			if (
				formData.value.roleId != null &&
				!filteredOptions.value.roleOptions.some(option => option.id === formData.value.roleId)
			) {
				formData.value.roleId = null
			}
			if (
				formData.value.categoryId != null &&
				!filteredOptions.value.categoryOptions.some(option => option.id === formData.value.categoryId)
			) {
				formData.value.categoryId = null
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
		if (activityIdModel.value == null) {
			showErrorSnackbar(t('activities.pleaseSelectActivity'))
			return null
		}
		const newId = await create(startTimestamp, activityLength, activityIdModel.value)
		if (newId) {
			showSuccessSnackbar(t('activities.addedToHistory', { activity: getSelectedActivityName.value }))
			return newId
		}
		showErrorSnackbar(t('activities.errorSavingToHistory', { activity: getSelectedActivityName.value }))
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
		getSelectedRoleName,
		getSelectedCategoryName,
		getSelectedTaskPriorityName,
		getSelectedRoutineTimePeriodName,
		saveActivityToHistory,
		onActivityCreated,
	}
}
