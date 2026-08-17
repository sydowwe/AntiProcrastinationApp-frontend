<template>
	<NewMemoryAnchorForm
		ref="formRef"
		v-model="request"
		:lockActivity="!!entityToEdit || presetActivityId != null"
		:lockedActivityName="entityToEdit?.activity.name ?? presetActivityName"
	/>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { MemoryAnchorRequest } from '@/core/leisure/dto/request/MemoryAnchorRequest.ts'
	import { useMemoryAnchorCrud } from '@/core/leisure/api/memoryAnchorApi.ts'
	import NewMemoryAnchorForm from '@/core/leisure/component/memoryAnchor/NewMemoryAnchorForm.vue'
	import { useDialogApi } from '@/_common/composable/general/useDialog.ts'
	import type { MemoryAnchor } from '@/core/leisure/dto/response/MemoryAnchor.ts'

	// `presetActivityId` is the "I did this" entry point: the activity is already known, so the only
	// thing left between doing a thing and having recorded it is the rating and the note. The month and
	// year come from MemoryAnchorRequest's own defaults, which are already "now".
	const {
		entityToEdit = null,
		presetActivityId = null,
		presetActivityName = '',
	} = defineProps<{
		entityToEdit?: MemoryAnchor | null
		presetActivityId?: number | null
		presetActivityName?: string
	}>()

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
			: new MemoryAnchorRequest(presetActivityId ?? 0),
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
