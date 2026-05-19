<template>
	<VForm
		ref="form"
		class="py-2 d-flex flex-column ga-3"
		@submit.prevent="onConfirm"
	>
		<VTextField
			v-model="request.name"
			label="Name"
			:rules="[requiredRule, lettersWithDiacriticsAndSpecialCharsRule]"
		/>
		<VTextarea
			v-model="request.text"
			label="Text"
		/>
		<ColorPicker
			v-model="request.color"
			label="Color"
		/>
	</VForm>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { VForm } from 'vuetify/components'
	import ColorPicker from '@/components/general/ColorPicker.vue'
	import type { Role } from '@/dtos/response/activity/Role.ts'
	import { RoleRequest } from '@/dtos/request/activity/RoleRequest.ts'
	import { useGeneralRules } from '@/composables/general/rules/RulesComposition.ts'
	import { useActivityRoleCrud } from '@/api/activity/activityRoleApi.ts'
	import { useDialogApi } from '@/composables/general/useDialog.ts'

	const { entityToEdit = null } = defineProps<{ entityToEdit?: Role | null }>()

	const dialogApi = useDialogApi<{ request: RoleRequest; createdId?: number; idToEdit?: number }>()
	const { create, update } = useActivityRoleCrud()
	const { lettersWithDiacriticsAndSpecialCharsRule, requiredRule } = useGeneralRules()

	const form = ref<InstanceType<typeof VForm>>()
	const request = ref(entityToEdit ? RoleRequest.fromEntity(entityToEdit) : new RoleRequest())

	dialogApi.onConfirm(onConfirm)

	async function onConfirm() {
		const { valid } = await form.value!.validate()
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
