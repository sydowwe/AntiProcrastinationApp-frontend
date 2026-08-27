<template>
	<VForm
		ref="form"
		class="d-flex flex-column ga-3"
		@submit.prevent="validate"
	>
		<!--
			`showBtn` has no default, so leaving it off hid both '+' buttons: the dialog a first-run
			account is sent to in order to create its first activity offered no way to create the role
			that activity requires.
		-->
		<InputWithButton
			showBtn
			icon="plus"
			color="success"
			:label="$t('activities.addNewRole')"
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
			showBtn
			icon="plus"
			color="success"
			:label="$t('activities.addNewCategory')"
			@create="openAddCategoryDialog"
		>
			<VIdAutocomplete
				v-model="model.categoryId"
				:label="$t('activities.category')"
				:items="categoryOptions"
			/>
		</InputWithButton>
		<!--
			Plain field: the `InputWithButton` that used to wrap this carried an `info` icon with no
			handler behind it, and no `showBtn`, so it has never rendered anything but the text field.
		-->
		<VTextField
			v-model="model.name"
			:label="$t('activities.activity')"
			:rules="[requiredRule]"
			required
		/>
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
	import { ref } from 'vue'
	import { VForm } from 'vuetify/components'
	import ActivityRoleForm from '@/core/activity/component/activityRole/ActivityRoleForm.vue'
	import ActivityCategoryForm from '@/core/activity/component/activityCategory/ActivityCategoryForm.vue'
	import InputWithButton from '@/_common/component/inputs/InputWithButton.vue'
	import type { ActivityRequest } from '@/core/activity/dto/request/ActivityRequest.ts'
	import type { RoleRequest } from '@/core/activity/dto/request/RoleRequest.ts'
	import type { CategoryRequest } from '@/core/activity/dto/request/CategoryRequest.ts'
	import { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'
	import { useActivitySelectOptions } from '@/core/activity/composable/UseActivitySelectOptions.ts'
	import { useGeneralRules } from '@/_common/composable/general/rules/RulesComposition.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { useI18n } from 'vue-i18n'

	const model = defineModel<ActivityRequest>({ required: true })

	// `roleOptions` / `categoryOptions` are the shared cache's own refs — bound straight into the
	// template so an option created anywhere else shows up here without a refetch.
	// Loads itself on mount — see `useActivitySelectOptions`.
	const { roleOptions, categoryOptions, addRoleOption, addCategoryOption } = useActivitySelectOptions()
	const { requiredRule } = useGeneralRules()
	const { openDialog } = useDialog()
	const { t } = useI18n()

	const form = ref<InstanceType<typeof VForm>>()

	async function validate() {
		return form.value!.validate()
	}

	function reset() {
		form.value?.reset()
	}

	async function openAddRoleDialog() {
		const result = await openDialog<{ request: RoleRequest; createdId?: number }>({
			component: ActivityRoleForm,
			dialogProps: { title: t('activities.addNewRole'), confirmBtnLabel: t('general.create') },
		})
		if (!result?.createdId) return
		addRoleOption(new SelectOption(result.createdId, result.request.name))
		model.value.roleId = result.createdId
	}

	async function openAddCategoryDialog() {
		const result = await openDialog<{ request: CategoryRequest; createdId?: number }>({
			component: ActivityCategoryForm,
			dialogProps: { title: t('activities.addNewCategory'), confirmBtnLabel: t('general.create') },
		})
		if (!result?.createdId) return
		addCategoryOption(new SelectOption(result.createdId, result.request.name))
		model.value.categoryId = result.createdId
	}

	defineExpose({ validate, reset })
</script>
