<template>
	<VForm
		ref="form"
		class="d-flex flex-column ga-3"
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
		<IconPicker
			v-model="request.icon"
			label="Icon"
		/>
	</VForm>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { VForm } from 'vuetify/components'
	import ColorPicker from '@/_common/component/inputs/ColorPicker.vue'
	import IconPicker from '@/_common/component/inputs/IconPicker.vue'
	import type { Category } from '@/core/activity/dto/response/Category.ts'
	import { useGeneralRules } from '@/_common/composable/general/rules/RulesComposition.ts'
	import { useActivityCategoryCrud } from '@/core/activity/api/activityCategoryApi.ts'
	import { CategoryRequest } from '@/core/activity/dto/request/CategoryRequest.ts'
	import { useDialogApi } from '@/_common/composable/general/useDialog.ts'

	const { entityToEdit = null } = defineProps<{ entityToEdit?: Category | null }>()

	const dialogApi = useDialogApi<{ request: CategoryRequest; createdId?: number; idToEdit?: number }>()
	const { create, update } = useActivityCategoryCrud()
	const { lettersWithDiacriticsAndSpecialCharsRule, requiredRule } = useGeneralRules()

	const form = ref<InstanceType<typeof VForm>>()
	const request = ref(entityToEdit ? CategoryRequest.fromEntity(entityToEdit) : new CategoryRequest())

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
