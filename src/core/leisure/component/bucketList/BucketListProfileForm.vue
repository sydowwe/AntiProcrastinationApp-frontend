<template>
	<NewBucketListProfileForm
		ref="formRef"
		v-model="request"
		:lockActivity="!!entityToEdit"
	/>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { ActivityBucketListProfileRequest } from '@/core/leisure/dto/request/ActivityBucketListProfileRequest.ts'
	import { useActivityBucketListProfileCrud } from '@/core/leisure/api/activityBucketListProfileApi.ts'
	import NewBucketListProfileForm from '@/core/leisure/component/bucketList/NewBucketListProfileForm.vue'
	import { useDialogApi } from '@/_common/composable/general/useDialog.ts'
	import type { ActivityBucketListProfile } from '@/core/leisure/dto/response/ActivityBucketListProfile.ts'

	const { entityToEdit = null } = defineProps<{ entityToEdit?: ActivityBucketListProfile | null }>()

	const dialogApi = useDialogApi<{
		request: ActivityBucketListProfileRequest
		createdId?: number
		idToEdit?: number
	}>()
	const { create, update } = useActivityBucketListProfileCrud()

	const formRef = ref<InstanceType<typeof NewBucketListProfileForm>>()
	const request = ref(
		entityToEdit
			? new ActivityBucketListProfileRequest(
					entityToEdit.activityId,
					entityToEdit.experienceType.id,
					entityToEdit.comfortZoneStep,
					entityToEdit.requiresTravel,
					entityToEdit.financialGoal,
					entityToEdit.inspirationSource,
				)
			: new ActivityBucketListProfileRequest(),
	)

	dialogApi.onConfirm(onConfirm)

	async function onConfirm() {
		const { valid } = await formRef.value!.validate()
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
		} catch (e) {
			// The interceptor's snackbar already fired; this puts the server's per-field message under the
			// field it names and keeps the dialog open for a retry.
			formRef.value!.applyServerError(e)
		} finally {
			dialogApi.setLoading(false)
		}
	}
</script>
