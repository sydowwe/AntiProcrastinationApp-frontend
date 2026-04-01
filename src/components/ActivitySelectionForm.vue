<template>
	<div class="d-flex flex-column">
		<div class="d-flex flex-column flex-md-row ga-3">
			<div
				v-if="showFromToDoListField"
				class="flex-1-1 d-flex flex-column flex-md-row ga-3"
			>
				<NullFalseTrueCheckbox
					v-model="formData!.isFromToDoList"
					label="From to-do list"
					:disabled="formDisabled"
					hideDetails
					density="compact"
				></NullFalseTrueCheckbox>
				<VIdSelect
					v-if="formData?.isFromToDoList"
					v-model="formData!.taskPriorityId"
					class="flex-1-1"
					:items="filteredOptions.taskPriorityOptions"
					hideDetails
					density="compact"
				></VIdSelect>
			</div>
			<div
				v-if="showFromToDoListField"
				class="flex-1-1 d-flex flex-column flex-md-row ga-3"
			>
				<NullFalseTrueCheckbox
					v-model="formData!.isFromRoutineToDoList"
					label="From routine to-do list"
					:disabled="formDisabled"
					hideDetails
					density="compact"
				></NullFalseTrueCheckbox>
				<VIdSelect
					v-if="formData!.isFromRoutineToDoList"
					v-model="formData!.routineTimePeriodId"
					class="flex-1-1"
					:items="filteredOptions.routineTimePeriodOptions"
					hideDetails
					density="compact"
				></VIdSelect>
			</div>
		</div>
		<VRow class="my-0">
			<VCol
				cols="12"
				:lg="isInDialog ? 12 : isInRow ? 3 : 6"
				class="py-4"
			>
				<VIdAutocomplete
					v-model="formData!.roleId"
					label="Role"
					:items="filteredOptions.roleOptions"
					:disabled="formDisabled"
					hideDetails
					density="compact"
				></VIdAutocomplete>
			</VCol>
			<VCol
				cols="12"
				:lg="isInDialog ? 12 : isInRow ? 3 : 6"
				class="py-4"
			>
				<VIdAutocomplete
					v-model="formData!.categoryId"
					label="Category"
					:items="filteredOptions.categoryOptions"
					:disabled="formDisabled"
					hideDetails
					density="compact"
				></VIdAutocomplete>
			</VCol>
			<VCol
				:cols="isInRow ? 6 : 12"
				class="pt-4 pb-0"
			>
				<InputWithButton
					:showBtn="!isFilter"
					icon="plus"
					color="success"
					:density="isInRow ? 'compact' : 'comfortable'"
					@create="createNewActivity"
				>
					<VIdAutocomplete
						ref="activityField"
						v-model="activityIdModel"
						:label="(isFilter ? '' : '*') + 'Activity'"
						:items="filteredOptions.activityOptions"
						:disabled="formDisabled"
						:density="isInRow ? 'compact' : 'comfortable'"
						:hideDetails="isInRow"
						:required="!isFilter"
						:rules="!isFilter ? [requiredRule] : []"
					></VIdAutocomplete>
				</InputWithButton>
			</VCol>
		</VRow>
		<ActivityDialog
			ref="createActivityDialog"
			@created="onActivityCreated"
		></ActivityDialog>
	</div>
</template>

<script setup lang="ts">
	import { computed, onMounted, reactive, ref, watch } from 'vue'
	import type { Time } from '@/dtos/dto/Time.ts'
	import { ActivityFormRequest } from '@/dtos/request/activity/ActivityFormRequest.ts'
	import { ActivityOptionsSource } from '@/dtos/enum/ActivityOptionsSource.ts'
	import NullFalseTrueCheckbox from '@/components/general/inputs/NullFalseTrueCheckbox.vue'
	import {
		filterActivityFormSelectOptions,
		getAllActivityFormSelectOptionsCombinations,
	} from '@/composables/activity/ActivitySelectsComposition.ts'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { useActivityHistoryCrud } from '@/api/activityHistory/activityHistoryApi.ts'
	import { useGeneralRules } from '@/composables/general/rules/RulesComposition.ts'
	import InputWithButton from '@/components/general/InputWithButton.vue'
	import type { VAutocomplete } from 'vuetify/components'
	import { ActivityFormSelectOptions } from '@/dtos/response/activity/ActivityFormSelectOptions.ts'
	import type { ActivitySelectOptionCombination } from '@/dtos/response/activity/ActivitySelectOptionCombination.ts'
	import { SelectOption } from '@/dtos/response/general/SelectOption.ts'
	import type { ActivityRequest } from '@/dtos/request/activity/ActivityRequest.ts'
	import ActivityDialog from '@/components/dialogs/activity/ActivityDialog.vue'

	const {
		isFilter = false,
		formDisabled = false,
		showFromToDoListField = true,
		isInDialog = false,
		isInRow = false,
		selectOptionsSource = ActivityOptionsSource.ALL,
	} = defineProps<{
		isFilter?: boolean
		formDisabled?: boolean
		showFromToDoListField?: boolean
		isInDialog?: boolean
		isInRow?: boolean
		selectOptionsSource?: ActivityOptionsSource
	}>()

	const emit = defineEmits<{
		(e: 'activityIdChanged', activityId: number | null): void
	}>()

	const formData = defineModel<ActivityFormRequest>({
		required: false,
		default: () => reactive(new ActivityFormRequest()),
	})

	const selectedActivityId = defineModel<number | null>('activityId', { default: null })

	const { requiredRule } = useGeneralRules()

	const { showErrorSnackbar, showSuccessSnackbar } = useSnackbar()
	const { create } = useActivityHistoryCrud()
	const activityField = ref<InstanceType<typeof VAutocomplete>>()
	const createActivityDialog = ref<InstanceType<typeof ActivityDialog>>()

	const allOptionsCombinations = ref<ActivitySelectOptionCombination[]>([])
	const filteredOptions = ref(new ActivityFormSelectOptions())

	const activityIdModel = computed({
		get: () => {
			if (isFilter) {
				return formData.value!.activityId
			} else {
				return selectedActivityId.value
			}
		},
		set: (value: number | null) => {
			if (isFilter) {
				formData.value!.activityId = value
			} else {
				selectedActivityId.value = value
			}
		},
	})

	onMounted(async () => {
		allOptionsCombinations.value = await getAllActivityFormSelectOptionsCombinations(selectOptionsSource)
		formData.value!.activityId = formData.value!.activityId ?? null
		filteredOptions.value = filterActivityFormSelectOptions(allOptionsCombinations.value, formData.value!)
	})

	watch(
		formData,
		newValue => {
			filteredOptions.value = filterActivityFormSelectOptions(allOptionsCombinations.value, formData.value!)
			activityIdModel.value = newValue.activityId
		},
		{ deep: true, immediate: true },
	)

	watch(activityIdModel, newValue => {
		emit('activityIdChanged', newValue)
	})

	watch(
		() => formData.value!.isFromToDoList,
		newValue => {
			if (!newValue) {
				formData.value!.taskPriorityId = null
			}
		},
	)
	watch(
		() => formData.value!.isFromRoutineToDoList,
		newValue => {
			if (!newValue) {
				formData.value!.routineTimePeriodId = null
			}
		},
	)

	async function validate() {
		return await activityField.value?.validate()
	}

	async function saveActivityToHistory(startTimestamp: Date, activityLength: Time) {
		if (!activityIdModel.value) {
			showErrorSnackbar(`Please select an activity`)
		} else {
			const newId = await create(startTimestamp, activityLength, activityIdModel.value)

			if (newId) {
				showSuccessSnackbar(`Added record of activity ${getSelectedActivityName.value} to history`)
				return newId
			} else {
				showErrorSnackbar(`Error saving record of activity ${getSelectedActivityName.value} to history`)
				return null
			}
		}
	}

	function createNewActivity() {
		createActivityDialog.value?.openAddDialog(
			formData.value.roleId ?? undefined,
			formData.value.categoryId ?? undefined,
		)
	}

	function onActivityCreated(request: ActivityRequest, createdId: number) {
		// Add new activity to the options
		filteredOptions.value.activityOptions.push(new SelectOption(createdId, request.name))
		// Auto-select the newly created activity
		activityIdModel.value = createdId
	}

	const getSelectedRoleName = computed((): string => {
		const options = filteredOptions.value.roleOptions || []
		return options.find(item => item.id === formData.value!.roleId)?.text || ''
	})

	const getSelectedCategoryName = computed((): string => {
		const options = filteredOptions.value.categoryOptions || []
		return options.find(item => item.id === formData.value!.categoryId)?.text || ''
	})

	const getSelectedTaskUrgencyName = computed((): string => {
		const options = filteredOptions.value.taskPriorityOptions || []
		return options.find(item => item.id === formData.value!.taskPriorityId)?.text || ''
	})

	const getSelectedRoutineTimePeriodName = computed((): string => {
		const options = filteredOptions.value.routineTimePeriodOptions || []
		return options.find(item => item.id === formData.value!.routineTimePeriodId)?.text || ''
	})

	const getSelectedActivityName = computed((): string => {
		return filteredOptions.value?.activityOptions.find(item => item.id === activityIdModel.value)?.text || ''
	})

	const getSelectedActivityId = computed(() => {
		return formData.value!.activityId
	})

	defineExpose({
		validate,
		getSelectedActivityName,
		getSelectedActivityId,
		getSelectedRoleName,
		getSelectedCategoryName,
		getSelectedTaskUrgencyName,
		getSelectedRoutineTimePeriodName,
		saveActivityToHistory,
	})
</script>
