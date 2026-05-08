<template>
	<div>
		<div class="flex-wrap d-flex ga-2 justify-space-between">
			<VSwitch
				v-model="isActivityFormHidden"
				class="mx-auto flex-wrap"
				color="primaryOutline"
				:label="
					isEdit
						? $t('activities.quickEditActivity')
						: $t('activities.quickCreateActivityWithRole', { role: viewName })
				"
				density="comfortable"
				hideDetails
			></VSwitch>

			<VSelect
				v-if="isActivityFormHidden && isEdit"
				v-model="quickEditMode"
				class="flex-1-0 my-2"
				minWidth="140"
				maxWidth="140"
				density="compact"
				:label="$t('activities.quickEditMode')"
				:items="quickEditModeItems"
				hideDetails
			></VSelect>
		</div>
		<ActivitySelectionForm
			v-if="!isActivityFormHidden"
			ref="activityForm"
			v-model:activityId="selectedActivityId"
			:showFromToDoListField="false"
			:formDisabled="false"
			:isFilter="false"
			isInDialog
			:selectOptionsSource="ActivityOptionsSource.ALL"
		></ActivitySelectionForm>
		<div
			v-else
			class="d-flex flex-column ga-4 pt-3"
		>
			<VTextField
				v-model="activityFormFieldData.name"
				:label="$t('general.name') + '*'"
				required
				:rules="[requiredRule]"
			></VTextField>
			<VTextarea
				v-model="activityFormFieldData.text"
				:label="$t('general.text')"
				rows="2"
			></VTextarea>
			<VIdSelect
				v-model="activityFormFieldData.categoryId"
				class="mb-3"
				density="compact"
				:label="$t('activities.category')"
				:items="categoryOptions"
				hideDetails
			></VIdSelect>
		</div>
	</div>
</template>

<script setup lang="ts">
	import ActivitySelectionForm from '@/components/ActivitySelectionForm.vue'
	import { type QuickCreateActivityRoleName, useQuickCreateActivity } from '@/composables/activity/quickCreateActivityComposition.ts'
	import { ActivityOptionsSource } from '@/dtos/enum/ActivityOptionsSource.ts'
	import { useGeneralRules } from '@/composables/general/rules/RulesComposition.ts'
	import { computed, onMounted, ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import type { SelectOption } from '@/dtos/response/general/SelectOption.ts'
	import { useActivitySelectOptions } from '@/composables/activity/UseActivitySelectOptions.ts'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { hasObjectChanged } from '@/utils/helperMethods.ts'
	import { QuickActivityToolsDto } from '@/dtos/response/activity/QuickActivityToolsDto.ts'
	import { useActivityCrud } from '@/api/activity/activityApi.ts'

	const { viewName } = defineProps<{
		viewName: QuickCreateActivityRoleName
	}>()
	const i18n = useI18n()
	const { showErrorSnackbar } = useSnackbar()
	const { requiredRule } = useGeneralRules()
	const { fetchCategorySelectOptions } = useActivitySelectOptions()
	const { fetchById } = useActivityCrud()

	const activityForm = ref<InstanceType<typeof ActivitySelectionForm>>()

	const { activityFormFieldData, isActivityFormHidden, quickCreateActivity, quickEditActivity } =
		useQuickCreateActivity(viewName)

	const selectedActivityId = ref<number | undefined>(undefined)
	const categoryOptions = ref<SelectOption[]>([])

	const quickEditModeItems = computed(() => [
		{ title: i18n.t('activities.overwrite'), value: 'Overwrite' },
		{ title: i18n.t('activities.clone'), value: 'Clone' },
	])

	const isEdit = ref(false)
	const activityBeforeEdit = ref<QuickActivityToolsDto | null>(null)
	const quickEditMode = ref<'Overwrite' | 'Clone'>('Overwrite')

	onMounted(async () => {
		categoryOptions.value = await fetchCategorySelectOptions()
	})

	async function execAndReturnStatus() {
		if (isActivityFormHidden.value) {
			if (isEdit.value && activityBeforeEdit.value?.id) {
				if (hasObjectChanged(activityBeforeEdit.value, activityFormFieldData.value)) {
const cloneId = await quickEditActivity(activityBeforeEdit.value.id, quickEditMode.value)
					if (cloneId && quickEditMode.value === 'Clone') {
						return { activityId: cloneId, status: 'edit' }
					}
					return { activityId: activityBeforeEdit.value.id, status: 'edit' }
				}
				return { activityId: activityBeforeEdit.value.id, status: 'noChange' }
			} else {
				const newId = await quickCreateActivity()
				return { activityId: newId, status: 'create' }
			}
		}
		if (((await activityForm.value?.validate()) ?? []).length > 0) {
			showErrorSnackbar(i18n.t('activities.pleaseSelectActivity'))
			return
		}
		return { activityId: selectedActivityId.value!, status: 'fromExisting' }
	}

	async function onOpenEdit(activityId: number) {
		const oldActivity = await fetchById(activityId)
		if (!oldActivity) {
			showErrorSnackbar(i18n.t('activities.activityNotFound', { id: activityId }))
			return
		}
		isEdit.value = true
		isActivityFormHidden.value = true

		quickEditMode.value = 'Overwrite'

		activityBeforeEdit.value = new QuickActivityToolsDto(
			oldActivity.id,
			oldActivity.name,
			oldActivity.text,
			oldActivity.category?.id ?? null,
		)

		activityFormFieldData.value = JSON.parse(JSON.stringify(activityBeforeEdit.value))

		selectedActivityId.value = activityId

		console.log(selectedActivityId.value)
	}

	function reset() {
		isActivityFormHidden.value = false
		activityFormFieldData.value = QuickActivityToolsDto.createEmpty

		selectedActivityId.value = undefined
	}

	defineExpose({
		execAndReturnStatus,
		reset,
		onOpenEdit,
	})
</script>
