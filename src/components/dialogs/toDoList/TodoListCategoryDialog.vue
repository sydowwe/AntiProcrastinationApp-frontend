<template>
	<MyDialog
		v-model="dialog"
		:title="isEdit ? $t('general.edit') : $t('toDoList.category.add')"
		:confirmBtnLabel="isEdit ? $t('general.edit') : $t('general.add')"
		@confirmed="save"
	>
		<VForm
			ref="form"
			class="py-3 d-flex flex-column ga-3"
			validateOn="submit"
			@submit.prevent="save"
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
	</MyDialog>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { VForm } from 'vuetify/components'
	import MyDialog from '@/components/dialogs/MyDialog.vue'
	import ColorPicker from '@/components/general/ColorPicker.vue'
	import IconPicker from '@/components/general/inputs/IconPicker.vue'
	import { TodoListCategoryRequest } from '@/dtos/request/todoList/TodoListCategoryRequest.ts'
	import type { TodoListCategoryEntity } from '@/dtos/response/todoList/TodoListCategoryEntity.ts'
	import { useGeneralRules } from '@/composables/general/rules/RulesComposition.ts'

	const emit = defineEmits<{
		add: [request: TodoListCategoryRequest]
		edit: [id: number, request: TodoListCategoryRequest]
	}>()

	const { requiredRule } = useGeneralRules()

	const form = ref<InstanceType<typeof VForm>>()
	const dialog = ref(false)
	const isEdit = ref(false)
	const editId = ref<number | null>(null)
	const request = ref(new TodoListCategoryRequest(''))

	async function save() {
		const isValid = await form.value?.validate()
		if (!isValid?.valid) return
		if (isEdit.value && editId.value !== null) {
			emit('edit', editId.value, request.value)
		} else {
			emit('add', request.value)
		}
		close()
	}

	function openCreate() {
		isEdit.value = false
		editId.value = null
		request.value = new TodoListCategoryRequest('')
		dialog.value = true
	}

	function openEdit(entity: TodoListCategoryEntity) {
		isEdit.value = true
		editId.value = entity.id
		request.value = new TodoListCategoryRequest(entity.name, entity.icon, entity.color)
		dialog.value = true
	}

	function close() {
		dialog.value = false
		request.value = new TodoListCategoryRequest('')
		isEdit.value = false
		editId.value = null
	}

	defineExpose({ openCreate, openEdit, close })
</script>
