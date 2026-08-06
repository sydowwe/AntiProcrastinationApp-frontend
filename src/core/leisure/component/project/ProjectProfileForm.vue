<template>
	<NewProjectProfileForm
		ref="formRef"
		v-model="request"
		:lockActivity="!!entityToEdit"
	/>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { ActivityProjectProfileRequest } from '@/core/leisure/dto/request/ActivityProjectProfileRequest.ts'
	import { useActivityProjectProfileCrud } from '@/core/leisure/api/activityProjectProfileApi.ts'
	import NewProjectProfileForm from '@/core/leisure/component/project/NewProjectProfileForm.vue'
	import { useDialogApi } from '@/composables/general/useDialog.ts'
	import type { ActivityProjectProfile } from '@/core/leisure/dto/response/ActivityProjectProfile.ts'

	const { entityToEdit = null } = defineProps<{ entityToEdit?: ActivityProjectProfile | null }>()

	const dialogApi = useDialogApi<{ request: ActivityProjectProfileRequest; createdId?: number; idToEdit?: number }>()
	const { create, update } = useActivityProjectProfileCrud()

	const formRef = ref<InstanceType<typeof NewProjectProfileForm>>()
	const request = ref(
		entityToEdit
			? new ActivityProjectProfileRequest(
					entityToEdit.activityId,
					entityToEdit.difficultyLevel,
					entityToEdit.projectArea,
					entityToEdit.estimatedHours,
					entityToEdit.isMessy,
					[...entityToEdit.materialsNeeded],
					[...entityToEdit.requiredTools],
					entityToEdit.readinessStatus,
				)
			: new ActivityProjectProfileRequest(),
	)

	dialogApi.onConfirm(onConfirm)

	async function onConfirm() {
		const { valid } = await formRef.value!.validate()
		if (!valid) return
		dialogApi.setLoading(true)
		try {
			if (entityToEdit) {
				await update(entityToEdit.activityId, request.value)
				dialogApi.close({ request: request.value, idToEdit: entityToEdit.activityId })
			} else {
				const createdId = await create(request.value)
				dialogApi.close({ request: request.value, createdId })
			}
		} finally {
			dialogApi.setLoading(false)
		}
	}
</script>
