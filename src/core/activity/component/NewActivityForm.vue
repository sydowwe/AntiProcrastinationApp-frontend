<template>
	<VForm
		ref="form"
		class="d-flex flex-column ga-3"
		@submit.prevent="validate"
	>
		<InputWithButton
			icon="plus"
			color="success"
			@create="openAddRoleDialog"
		>
			<VIdAutocomplete
				v-model="model.roleId"
				:label="$t('activities.role')"
				:items="roleOptions"
				required
				:rules="[requiredRule]"
			/>
		</InputWithButton>
		<InputWithButton
			icon="plus"
			color="success"
			@create="openAddCategoryDialog"
		>
			<VIdAutocomplete
				v-model="model.categoryId"
				:label="$t('activities.category')"
				:items="categoryOptions"
			/>
		</InputWithButton>
		<InputWithButton
			icon="info"
			color="secondaryOutline"
		>
			<VTextField
				v-model="model.name"
				:label="$t('activities.activity')"
				:rules="[requiredRule]"
				required
			/>
		</InputWithButton>
		<VTextarea
			v-model="model.text"
			:label="$t('activities.activityDescription')"
			hideDetails
		/>
		<VRow noGutters>
			<VCheckbox
				v-model="model.isUnavoidable"
				:label="$t('activities.isActivityUnavoidable')"
				hideDetails
			/>
		</VRow>
	</VForm>
</template>

<script setup lang="ts">
	import { onMounted, ref } from 'vue'
	import { VForm } from 'vuetify/components'
	import ActivityRoleForm from '@/core/activity/component/activityRole/ActivityRoleForm.vue'
	import ActivityCategoryForm from '@/core/activity/component/activityCategory/ActivityCategoryForm.vue'
	import InputWithButton from '@/_common/component/inputs/InputWithButton.vue'
	import type { ActivityRequest } from '@/core/activity/dto/request/ActivityRequest.ts'
	import type { RoleRequest } from '@/core/activity/dto/request/RoleRequest.ts'
	import type { CategoryRequest } from '@/core/activity/dto/request/CategoryRequest.ts'
	import { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'
	import { useActivitySelectOptions } from '@/core/activity/composable/UseActivitySelectOptions.ts'
	import { useGeneralRules } from '@/composables/general/rules/RulesComposition.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { useI18n } from 'vue-i18n'

	const model = defineModel<ActivityRequest>({ required: true })

	const { fetchRoleSelectOptions, fetchCategorySelectOptions } = useActivitySelectOptions()
	const { requiredRule } = useGeneralRules()
	const { openDialog } = useDialog()
	const { t } = useI18n()

	const form = ref<InstanceType<typeof VForm>>()
	const roleOptions = ref<SelectOption[]>([])
	const categoryOptions = ref<SelectOption[]>([])

	onMounted(async () => {
		roleOptions.value = await fetchRoleSelectOptions()
		categoryOptions.value = await fetchCategorySelectOptions()
	})

	async function validate() {
		return form.value!.validate()
	}

	function reset() {
		form.value?.reset()
	}

	async function openAddRoleDialog() {
		const result = await openDialog<{ request: RoleRequest; createdId?: number }>({
			component: ActivityRoleForm,
			dialogProps: { title: 'Add new role', confirmBtnLabel: t('general.create') },
		})
		if (!result?.createdId) return
		roleOptions.value.push(new SelectOption(result.createdId, result.request.name))
		model.value.roleId = result.createdId
	}

	async function openAddCategoryDialog() {
		const result = await openDialog<{ request: CategoryRequest; createdId?: number }>({
			component: ActivityCategoryForm,
			dialogProps: { title: 'Add new category', confirmBtnLabel: t('general.create') },
		})
		if (!result?.createdId) return
		categoryOptions.value.push(new SelectOption(result.createdId, result.request.name))
		model.value.categoryId = result.createdId
	}

	defineExpose({ validate, reset })
</script>
