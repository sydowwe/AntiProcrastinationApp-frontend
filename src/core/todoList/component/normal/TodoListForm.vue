<template>
	<VForm
		ref="form"
		class="py-3 mb-1 d-flex flex-column ga-8"
		validateOn="invalid-input"
		@submit.prevent="onConfirm"
	>
		<VTextField
			v-model="request.name"
			:label="$t('general.name')"
			:rules="[requiredRule]"
			required
			style="margin-bottom: -20px"
		/>
		<IconPicker v-model="request.icon" />
		<VIdSelect
			v-model="request.categoryId"
			:label="$t('toDoList.namedList.category')"
			:items="categoryOptions"
			hideDetails
		/>
		<VTextarea
			v-model="request.text"
			:label="$t('toDoList.namedList.description')"
			:counter="DESCRIPTION_MAX_LENGTH"
			:maxlength="DESCRIPTION_MAX_LENGTH"
			rows="3"
		/>
	</VForm>
</template>

<script setup lang="ts">
	import { onMounted, ref } from 'vue'
	import { VForm } from 'vuetify/components'
	import IconPicker from '@/_common/component/inputs/IconPicker.vue'
	import { TodoListRequest } from '@/core/todoList/dto/request/TodoListRequest.ts'
	import type { TodoListEntity } from '@/core/todoList/dto/response/TodoListEntity.ts'
	import { useGeneralRules } from '@/_common/composable/general/rules/RulesComposition.ts'
	import { useTodoListCategoryCrud } from '@/core/todoList/api/todoListCategoryApi.ts'
	import { useDialogApi } from '@/_common/composable/general/useDialog.ts'
	import type { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'

	const { entityToEdit = null, initialCategoryId = null } = defineProps<{
		entityToEdit?: TodoListEntity | null
		initialCategoryId?: number | null
	}>()

	const dialogApi = useDialogApi<{
		idToEdit: number | null
		request: TodoListRequest
	}>()

	const { requiredRule } = useGeneralRules()

	// The server's limit (`TodoListValidator`, `EntityFieldLengths.Text`). A native `maxlength` rather
	// than a rule: the framework has no length rule, and a cap cannot be failed.
	const DESCRIPTION_MAX_LENGTH = 1000
	const { fetchSelectOptions } = useTodoListCategoryCrud()

	const form = ref<InstanceType<typeof VForm>>()
	const request = ref(
		entityToEdit
			? new TodoListRequest(
					entityToEdit.name,
					entityToEdit.icon,
					entityToEdit.description,
					entityToEdit.category?.id ?? null,
				)
			: new TodoListRequest('', null, null, initialCategoryId),
	)
	const categoryOptions = ref<SelectOption[]>([])

	dialogApi.onConfirm(onConfirm)

	onMounted(async () => {
		categoryOptions.value = await fetchSelectOptions()
	})

	async function onConfirm() {
		const isValid = await form.value?.validate()
		if (!isValid?.valid) return
		dialogApi.close({
			idToEdit: entityToEdit?.id ?? null,
			request: request.value,
		})
	}
</script>
