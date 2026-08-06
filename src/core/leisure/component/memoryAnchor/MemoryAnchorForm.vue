<template>
	<NewMemoryAnchorForm
		ref="formRef"
		v-model="request"
		:lockActivity="!!entityToEdit"
	/>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { MemoryAnchorRequest } from '@/core/leisure/dto/request/MemoryAnchorRequest.ts'
	import { useMemoryAnchorCrud } from '@/core/leisure/api/memoryAnchorApi.ts'
	import NewMemoryAnchorForm from '@/core/leisure/component/memoryAnchor/NewMemoryAnchorForm.vue'
	import { useDialogApi } from '@/composables/general/useDialog.ts'
	import type { MemoryAnchor } from '@/core/leisure/dto/response/MemoryAnchor.ts'

	const { entityToEdit = null } = defineProps<{ entityToEdit?: MemoryAnchor | null }>()

	const dialogApi = useDialogApi<{ request: MemoryAnchorRequest; createdId?: number; idToEdit?: number }>()
	const { create, update } = useMemoryAnchorCrud()

	const formRef = ref<InstanceType<typeof NewMemoryAnchorForm>>()
	const request = ref(
		entityToEdit
			? new MemoryAnchorRequest(
					entityToEdit.activityId,
					entityToEdit.anchorMonth,
					entityToEdit.anchorYear,
					entityToEdit.highlightNote,
					entityToEdit.rating,
				)
			: new MemoryAnchorRequest(),
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
		} catch {
			// snackbar surfaced by axios interceptor; keep dialog open for retry
		} finally {
			dialogApi.setLoading(false)
		}
	}
</script>
