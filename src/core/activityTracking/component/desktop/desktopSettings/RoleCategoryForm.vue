<template>
	<div class="d-flex ga-3">
		<InputWithButton
			icon="plus"
			color="success"
			density="compact"
			@create="openAddRoleDialog"
		>
			<VIdAutocomplete
				v-model="model.roleId"
				:label="$t('activities.role')"
				:items="roleOptions"
				hideDetails
				minWidth="250"
				density="compact"
			></VIdAutocomplete>
		</InputWithButton>
		<InputWithButton
			icon="plus"
			color="success"
			density="compact"
			@create="openAddCategoryDialog"
		>
			<VIdAutocomplete
				v-model="model.categoryId"
				:label="$t('activities.category')"
				:items="categoryOptions"
				hideDetails
				minWidth="250"
				density="compact"
			></VIdAutocomplete>
		</InputWithButton>
	</div>
</template>

<script setup lang="ts">
	import ActivityCategoryForm from '@/core/activity/component/activityCategory/ActivityCategoryForm.vue'
	import InputWithButton from '@/_common/component/inputs/InputWithButton.vue'
	import ActivityRoleForm from '@/core/activity/component/activityRole/ActivityRoleForm.vue'
	import { ref } from 'vue'
	import { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'
	import type { RoleRequest } from '@/core/activity/dto/request/RoleRequest.ts'
	import type { CategoryRequest } from '@/core/activity/dto/request/CategoryRequest.ts'
	import { useDialog } from '@/composables/general/useDialog.ts'

	const model = defineModel<{ roleId: number | null; categoryId: number | null }>({ required: true })
	const { openDialog } = useDialog()

	const roleOptions = ref<SelectOption[]>([])
	const categoryOptions = ref<SelectOption[]>([])

	async function openAddRoleDialog() {
		const result = await openDialog<{ request: RoleRequest; createdId?: number }>({
			component: ActivityRoleForm,
			dialogProps: { title: 'Add new role', confirmBtnLabel: 'Create' },
		})
		if (!result?.createdId) return
		roleOptions.value.push(new SelectOption(result.createdId, result.request.name))
		model.value.roleId = result.createdId
	}

	async function openAddCategoryDialog() {
		const result = await openDialog<{ request: CategoryRequest; createdId?: number }>({
			component: ActivityCategoryForm,
			dialogProps: { title: 'Add new category', confirmBtnLabel: 'Create' },
		})
		if (!result?.createdId) return
		categoryOptions.value.push(new SelectOption(result.createdId, result.request.name))
		model.value.categoryId = result.createdId
	}
</script>

<style scoped></style>
