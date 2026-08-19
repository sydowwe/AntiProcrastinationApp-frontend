import { computed, onMounted, ref, watch, watchEffect } from 'vue'
import type { Ref } from 'vue'
import type { ActivityFormRequest } from '@/core/activity/dto/request/ActivityFormRequest.ts'
import type { ActivityOptionsSource } from '@/core/activity/dto/enum/ActivityOptionsSource.ts'
import {
	filterActivityFormSelectOptions,
	useActivityFormSelectOptions,
} from '@/core/activity/composable/ActivitySelectsComposition.ts'
import { ActivityFormSelectOptions } from '@/core/activity/dto/response/ActivityFormSelectOptions.ts'
import { ActivitySelectOptionCombination } from '@/core/activity/dto/response/ActivitySelectOptionCombination.ts'
import { ActivitySelection } from '@/core/activity/dto/dto/ActivitySelection.ts'
import { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'
import type { ActivityRequest } from '@/core/activity/dto/request/ActivityRequest.ts'

export function useActivitySelectionFormState(
	formData: Ref<ActivityFormRequest>,
	selectedActivityId: Ref<number | null>,
	selection: Ref<ActivitySelection | null>,
	loading: Ref<boolean>,
	selectOptionsSource: ActivityOptionsSource,
) {
	const { getAllActivityFormSelectOptionsCombinations } = useActivityFormSelectOptions()

	const allOptionsCombinations = ref<ActivitySelectOptionCombination[]>([])
	const filteredOptions = ref(new ActivityFormSelectOptions())
	const optionsLoaded = ref(false)

	// `formData.activityId` is the single source of truth for the selected activity; the `activityId`
	// model mirrors it so a call site can bind whichever of the two it owns. The storage used to be
	// either/or, keyed off `isFilter`, and every call site that bound the other one silently got
	// nothing: the desktop mappings editor, the history panel's activity filter and the pomodoro rest
	// form were all wired to a value that was never written.
	const activityIdModel = computed({
		get: () => formData.value.activityId,
		set: (value: number | null) => {
			formData.value.activityId = value
			selectedActivityId.value = value
		},
	})

	// Reconcile the two at setup: an explicitly bound `activityId` wins, otherwise adopt whatever
	// `formData` came in carrying.
	if (selectedActivityId.value != null) {
		formData.value.activityId = selectedActivityId.value
	} else {
		selectedActivityId.value = formData.value.activityId
	}

	watch(selectedActivityId, value => {
		if (formData.value.activityId !== value) {
			formData.value.activityId = value
		}
	})

	function nameOf(options: SelectOption[], id: number | null) {
		if (id == null) return ''
		return options.find(option => option.id === id)?.text ?? ''
	}

	// Names are display data derived from the loaded options, so there is a window after setup in which
	// they are all ''. Report `null` for that window instead — a consumer reading on mount can tell
	// "not loaded yet" from "nothing selected".
	watchEffect(() => {
		if (!optionsLoaded.value) {
			selection.value = null
			return
		}
		const options = filteredOptions.value
		const data = formData.value
		selection.value = new ActivitySelection(
			data.activityId,
			nameOf(options.activityOptions, data.activityId),
			data.roleId,
			nameOf(options.roleOptions, data.roleId),
			data.categoryId,
			nameOf(options.categoryOptions, data.categoryId),
			data.taskPriorityId,
			nameOf(options.taskPriorityOptions, data.taskPriorityId),
			data.routineTimePeriodId,
			nameOf(options.routineTimePeriodOptions, data.routineTimePeriodId),
		)
	})

	function refreshOptions() {
		filteredOptions.value = filterActivityFormSelectOptions(allOptionsCombinations.value, formData.value)
		// Before the options are in, every list is empty and pruning would clear a preselection the
		// parent passed in (an edited history record, a timer preset) before it ever had a chance to
		// match.
		if (!optionsLoaded.value) return
		pruneSelectionsMissingFromOptions()
	}

	function pruneSelectionsMissingFromOptions() {
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
	}

	onMounted(async () => {
		loading.value = true
		try {
			allOptionsCombinations.value = await getAllActivityFormSelectOptionsCombinations(selectOptionsSource)
			optionsLoaded.value = true
		} catch {
			allOptionsCombinations.value = []
		} finally {
			refreshOptions()
			loading.value = false
		}
	})

	watch(
		formData,
		newValue => {
			if (selectedActivityId.value !== newValue.activityId) {
				selectedActivityId.value = newValue.activityId
			}
			refreshOptions()
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

	function onActivityCreated(request: ActivityRequest, createdId: number) {
		// Push the new activity into the *unfiltered* combinations, not into the filtered list: any later
		// change to the form re-derives the filtered list from these, and an option that only ever
		// existed in the derived copy vanishes again on the next keystroke.
		const roleOption = filteredOptions.value.roleOptions.find(option => option.id === request.roleId)
		const categoryOption = filteredOptions.value.categoryOptions.find(option => option.id === request.categoryId)
		allOptionsCombinations.value.push(
			new ActivitySelectOptionCombination(
				createdId,
				request.name,
				roleOption ?? new SelectOption(request.roleId ?? 0, ''),
				categoryOption ?? null,
			),
		)
		activityIdModel.value = createdId
		refreshOptions()
	}

	return {
		filteredOptions,
		activityIdModel,
		onActivityCreated,
	}
}
