<template>
	<NewActivityForm
		ref="activityFormRef"
		v-model="request"
	/>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { ActivityRequest } from '@/core/activity/dto/request/ActivityRequest.ts'
	import { useActivityCrud } from '@/core/activity/api/activityApi.ts'
	import NewActivityForm from '@/core/activity/component/NewActivityForm.vue'
	import { useDialogApi } from '@/composables/general/useDialog.ts'
	import type { Activity } from '@/core/activity/dto/response/Activity.ts'

	const {
		entityToEdit = null,
		initialRoleId,
		initialCategoryId,
	} = defineProps<{
		entityToEdit?: Activity | null
		initialRoleId?: number
		initialCategoryId?: number
	}>()

	const dialogApi = useDialogApi<{ request: ActivityRequest; createdId?: number; idToEdit?: number }>()
	const { create, update } = useActivityCrud()

	const activityFormRef = ref<InstanceType<typeof NewActivityForm>>()
	const request = ref(
		entityToEdit
			? new ActivityRequest(
					entityToEdit.name,
					entityToEdit.text,
					entityToEdit.role.id,
					entityToEdit.category?.id ?? null,
					entityToEdit.isUnavoidable,
				)
			: new ActivityRequest(),
	)

	if (!entityToEdit) {
		if (initialRoleId !== undefined) request.value.roleId = initialRoleId
		if (initialCategoryId !== undefined) request.value.categoryId = initialCategoryId
	}

	dialogApi.onConfirm(onConfirm)

	async function onConfirm() {
		const { valid } = await activityFormRef.value!.validate()
		if (!valid) return
		dialogApi.setLoading(true)
		try {
			if (entityToEdit) {
				await update(entityToEdit.id, request.value)
				dialogApi.close({ request: request.value, idToEdit: entityToEdit.id })
			} else {
				const createdId = await create(request.value)
				dialogApi.close({ request: request.value, createdId })
			}
		} finally {
			dialogApi.setLoading(false)
		}
	}
</script>
