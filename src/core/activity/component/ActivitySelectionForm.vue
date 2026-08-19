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
				:lg="lookupColumns"
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
				:lg="lookupColumns"
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
				:cols="isRow ? 6 : 12"
				class="pt-4 pb-0"
			>
				<InputWithButton
					:showBtn="activityRequired"
					icon="plus"
					color="success"
					:density="fieldDensity"
					@create="createNewActivity"
				>
					<VIdAutocomplete
						ref="activityField"
						v-model="activityIdModel"
						:label="activityRequired ? t('activities.activityRequired') : t('activities.activity')"
						:items="filteredOptions.activityOptions"
						:disabled="formDisabled"
						:density="fieldDensity"
						:hideDetails="isRow"
						:required="activityRequired"
						:rules="activityRequired ? [requiredRule] : []"
					></VIdAutocomplete>
				</InputWithButton>
			</VCol>
		</VRow>
	</div>
</template>

<script setup lang="ts">
	import { computed, reactive, ref } from 'vue'
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
		layout = 'stacked',
		mode = 'required',
		formDisabled = false,
		showFromToDoListField = true,
		selectOptionsSource = ActivityOptionsSource.ALL,
	} = defineProps<{
		/**
		 * How the three lookups are arranged. `stacked` is the default two-per-row form, `row` squeezes
		 * them into a single dense toolbar line, `dialog` puts each on its own full-width row.
		 */
		layout?: 'stacked' | 'row' | 'dialog'
		/**
		 * Whether picking an activity is the point of this form (`required`: the field is required and
		 * offers inline activity creation) or merely one way to narrow something down (`optional`: no
		 * rule, no create button). Filter panels and the pomodoro rest activity are `optional`.
		 */
		mode?: 'required' | 'optional'
		formDisabled?: boolean
		showFromToDoListField?: boolean
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
	const isRow = computed(() => layout === 'row')
	const lookupColumns = computed(() => (layout === 'dialog' ? 12 : layout === 'row' ? 3 : 6))
	const fieldDensity = computed(() => (isRow.value ? 'compact' : 'comfortable'))
	const activityRequired = computed(() => mode === 'required')

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
		showFromToDoListField,
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
