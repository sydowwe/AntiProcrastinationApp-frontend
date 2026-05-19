<template>
	<NewBacklogProfileForm
		ref="formRef"
		v-model="request"
		:lockActivity="!!entityToEdit"
	/>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { ActivityBacklogProfileRequest } from '@/dtos/request/leisure/ActivityBacklogProfileRequest.ts'
	import { useActivityBacklogProfileCrud } from '@/api/leisure/activityBacklogProfileApi.ts'
	import NewBacklogProfileForm from '@/components/leisure/backlog/NewBacklogProfileForm.vue'
	import { useDialogApi } from '@/composables/general/useDialog.ts'
	import type { ActivityBacklogProfile } from '@/dtos/response/leisure/ActivityBacklogProfile.ts'

	const { entityToEdit = null } = defineProps<{ entityToEdit?: ActivityBacklogProfile | null }>()

	const dialogApi = useDialogApi<{ request: ActivityBacklogProfileRequest; createdId?: number; idToEdit?: number }>()
	const { create, update } = useActivityBacklogProfileCrud()

	const formRef = ref<InstanceType<typeof NewBacklogProfileForm>>()
	const request = ref(
		entityToEdit
			? new ActivityBacklogProfileRequest(
					entityToEdit.activityId,
					entityToEdit.locationType.id,
					entityToEdit.weatherDependency.id,
					entityToEdit.energyLevel,
					entityToEdit.effortType,
					entityToEdit.minParticipants,
					entityToEdit.maxParticipants,
					entityToEdit.expectedCostTier.id,
					entityToEdit.durationMinutes,
					entityToEdit.isOneTime,
				)
			: new ActivityBacklogProfileRequest(),
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
