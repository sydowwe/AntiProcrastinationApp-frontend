<template>
	<VForm
		ref="form"
		class="py-3 d-flex flex-column ga-3"
		validateOn="submit"
		@submit.prevent="onConfirm"
	>
		<VTextField
			v-model="request.name"
			:label="$t('general.name')"
			:rules="[requiredRule]"
			required
		/>
		<IconPicker
			v-model="request.icon"
			class="mb-5"
		/>
		<ColorPicker v-model="request.color" />
	</VForm>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { VForm } from 'vuetify/components'
	import ColorPicker from '@/_common/component/inputs/ColorPicker.vue'
	import IconPicker from '@/_common/component/inputs/IconPicker.vue'
	import { TodoListCategoryRequest } from '@/core/todoList/dto/request/TodoListCategoryRequest.ts'
	import type { TodoListCategoryEntity } from '@/core/todoList/dto/response/TodoListCategoryEntity.ts'
	import { useGeneralRules } from '@/composables/general/rules/RulesComposition.ts'
	import { useDialogApi } from '@/_common/composable/general/useDialog.ts'

	const { entityToEdit = null } = defineProps<{
		entityToEdit?: TodoListCategoryEntity | null
	}>()

	const dialogApi = useDialogApi<{
		idToEdit: number | null
		request: TodoListCategoryRequest
	}>()

	const { requiredRule } = useGeneralRules()

	const form = ref<InstanceType<typeof VForm>>()
	const request = ref(
		entityToEdit
			? new TodoListCategoryRequest(entityToEdit.name, entityToEdit.icon, entityToEdit.color)
			: new TodoListCategoryRequest(''),
	)

	dialogApi.onConfirm(onConfirm)

	async function onConfirm() {
		const isValid = await form.value?.validate()
		if (!isValid?.valid) return
		dialogApi.close({
			idToEdit: entityToEdit?.id ?? null,
			request: request.value,
		})
	}
</script>
