<template>
	<div class="d-flex ga-3">
		<InputWithButton
			icon="plus"
			color="success"
			density="compact"
			@create="addRoleDialog?.openAddDialog"
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
			@create="addCategoryDialog?.openAddDialog"
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
		<ActivityRoleDialog
			ref="addRoleDialog"
			@created="onRoleCreated"
		></ActivityRoleDialog>
		<ActivityCategoryDialog
			ref="addCategoryDialog"
			@created="onCategoryCreated"
		></ActivityCategoryDialog>
	</div>
</template>

<script setup lang="ts">
	import ActivityCategoryDialog from '@/components/dialogs/activity/ActivityCategoryDialog.vue'
	import InputWithButton from '@/components/general/InputWithButton.vue'
	import ActivityRoleDialog from '@/components/dialogs/activity/ActivityRoleDialog.vue'
	import { ref } from 'vue'
	import { SelectOption } from '@/dtos/response/general/SelectOption.ts'
	import { RoleRequest } from '@/dtos/request/activity/RoleRequest.ts'
	import type { CategoryRequest } from '@/dtos/request/activity/CategoryRequest.ts'

	const model = defineModel<{ roleId: number | null; categoryId: number | null }>({ required: true })
	const addRoleDialog = ref<InstanceType<typeof ActivityRoleDialog>>()
	const addCategoryDialog = ref<InstanceType<typeof ActivityCategoryDialog>>()

	const roleOptions = ref<SelectOption[]>([])
	const categoryOptions = ref<SelectOption[]>([])

	function onRoleCreated(request: RoleRequest, createdId: number) {
		roleOptions.value.push(new SelectOption(createdId, request.name))
		model.value.roleId = createdId
	}

	function onCategoryCreated(request: CategoryRequest, createdId: number) {
		categoryOptions.value.push(new SelectOption(createdId, request.name))
		model.value.categoryId = createdId
	}
</script>

<style scoped></style>
