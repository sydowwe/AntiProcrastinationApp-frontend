<template>
	<div class="d-flex flex-column">
		<div class="d-flex flex-column flex-md-row ga-3">
			<div
				v-if="showFromToDoListField"
				class="flex-1-1 d-flex flex-column flex-md-row ga-3"
			>
				<NullFalseTrueCheckbox
					v-model="formData.isFromToDoList"
					:label="t('activities.fromToDoList')"
					:disabled="formDisabled"
					hideDetails
					density="compact"
				></NullFalseTrueCheckbox>
				<VIdSelect
					v-if="formData?.isFromToDoList"
					v-model="formData.taskPriorityId"
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
					v-model="formData.isFromRoutineToDoList"
					:label="t('activities.fromRoutineToDoList')"
					:disabled="formDisabled"
					hideDetails
					density="compact"
				></NullFalseTrueCheckbox>
				<VIdSelect
					v-if="formData.isFromRoutineToDoList"
					v-model="formData.routineTimePeriodId"
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
					v-model="formData.roleId"
					:label="t('activities.role')"
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
					v-model="formData.categoryId"
					:label="t('activities.category')"
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
						:label="isFilter ? t('activities.activity') : t('activities.activityRequired')"
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
	import { reactive, ref } from 'vue'
	import type { Ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { ActivityFormRequest } from '@/core/activity/dto/request/ActivityFormRequest.ts'
	import { ActivityOptionsSource } from '@/core/activity/dto/enum/ActivityOptionsSource.ts'
	import NullFalseTrueCheckbox from '@/_common/component/inputs/NullFalseTrueCheckbox.vue'
	import { useGeneralRules } from '@/_common/composable/general/rules/RulesComposition.ts'
	import InputWithButton from '@/_common/component/inputs/InputWithButton.vue'
	import type { VAutocomplete } from 'vuetify/components'
	import ActivityForm from '@/core/activity/component/ActivityForm.vue'
	import { useActivitySelectionFormState } from '@/core/activity/composable/useActivitySelectionFormState.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import type { ActivityRequest } from '@/core/activity/dto/request/ActivityRequest.ts'
	import type { ActivitySelection } from '@/core/activity/dto/dto/ActivitySelection.ts'

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

	const formData = defineModel<ActivityFormRequest>({
		required: false,
		default: () => reactive(new ActivityFormRequest()),
	})

	const selectedActivityId = defineModel<number | null>('activityId', { default: null })

	/**
	 * What is currently selected, names included — null until the option lists have loaded. Bind
	 * `v-model:selection` instead of reaching into this component for a name.
	 */
	const selection = defineModel<ActivitySelection | null>('selection', { default: null })
	const loading = defineModel<boolean>('loading', { default: false })

	const { t } = useI18n()
	const { requiredRule } = useGeneralRules()
	const { openDialog } = useDialog()
	const activityField = ref<InstanceType<typeof VAutocomplete>>()

	const { filteredOptions, activityIdModel, onActivityCreated } = useActivitySelectionFormState(
		formData,
		selectedActivityId,
		selection as Ref<ActivitySelection | null>,
		loading,
		selectOptionsSource,
	)

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
			dialogProps: {
				title: t('activities.createNewActivity'),
				confirmBtnLabel: t('general.create'),
				isSmall: false,
			},
		})
		if (!result?.createdId) return
		onActivityCreated(result.request, result.createdId)
	}

	// `validate()` is the only thing left that a parent has to reach in for: it is a genuine imperative
	// action with no data-flow equivalent. Everything else this component knows now leaves through a
	// model.
	defineExpose({
		validate,
	})
</script>
