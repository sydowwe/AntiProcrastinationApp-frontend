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
	</div>
</template>

<script setup lang="ts">
	import { reactive, ref, watch } from 'vue'
	import { ActivityFormRequest } from '@/dtos/request/activity/ActivityFormRequest.ts'
	import { ActivityOptionsSource } from '@/dtos/enum/ActivityOptionsSource.ts'
	import NullFalseTrueCheckbox from '@/_common/component/inputs/NullFalseTrueCheckbox.vue'
	import { useGeneralRules } from '@/composables/general/rules/RulesComposition.ts'
	import InputWithButton from '@/_common/component/inputs/InputWithButton.vue'
	import type { VAutocomplete } from 'vuetify/components'
	import ActivityForm from '@/components/activity/ActivityForm.vue'
	import { useActivitySelectionFormState } from '@/composables/activity/useActivitySelectionFormState.ts'
	import { useDialog } from '@/composables/general/useDialog.ts'
	import type { ActivityRequest } from '@/dtos/request/activity/ActivityRequest.ts'

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
	const { openDialog } = useDialog()
	const activityField = ref<InstanceType<typeof VAutocomplete>>()

	const {
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
	} = useActivitySelectionFormState(formData, selectedActivityId, isFilter, selectOptionsSource)

	watch(activityIdModel, newValue => {
		emit('activityIdChanged', newValue)
	})

	async function validate() {
		return await activityField.value?.validate()
	}

	async function createNewActivity() {
		const result = await openDialog<{ request: ActivityRequest; createdId?: number }>({
			component: ActivityForm,
			componentProps: {
				initialRoleId: formData.value.roleId ?? undefined,
				initialCategoryId: formData.value.categoryId ?? undefined,
			},
			dialogProps: { title: 'Create Activity', confirmBtnLabel: 'Create', isSmall: false },
		})
		if (!result?.createdId) return
		onActivityCreated(result.request, result.createdId)
	}

	defineExpose({
		loading,
		validate,
		getSelectedActivityName,
		getSelectedActivityId,
		getSelectedRoleName,
		getSelectedCategoryName,
		getSelectedTaskPriorityName,
		getSelectedRoutineTimePeriodName,
		saveActivityToHistory,
	})
</script>
