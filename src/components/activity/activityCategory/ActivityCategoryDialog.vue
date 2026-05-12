<template>
	<MyDialog
		v-model="dialog"
		title="Add new category"
		:confirmBtnLabel="$t('general.create')"
		@confirmed="onConfirmed"
	>
		<VForm
			ref="form"
			class="d-flex flex-column ga-3"
			@submit.prevent="onConfirmed"
		>
			<VTextField
				v-model="request.name"
				label="Name"
				:rules="[requiredRule, lettersWithDiacriticsAndSpecialCharsRule]"
			></VTextField>
			<VTextarea
				v-model="request.text"
				label="Text"
			></VTextarea>
			<ColorPicker
				v-model="request.color"
				label="Color"
			></ColorPicker>
		</VForm>
	</MyDialog>
</template>

<script setup lang="ts">
	import MyDialog from '@/components/general/dialogs/MyDialog.vue'
	import ColorPicker from '@/components/general/ColorPicker.vue'
	import { ref } from 'vue'
	import type { Category } from '@/dtos/response/activity/Category.ts'
	import { useGeneralRules } from '@/composables/general/rules/RulesComposition.ts'
	import { useActivityCategoryCrud } from '@/api/activity/activityCategoryApi.ts'
	import { CategoryRequest } from '@/dtos/request/activity/CategoryRequest.ts'
	import { VForm } from 'vuetify/components'

	const { useApi = true } = defineProps<{ useApi?: boolean }>()

	const emit = defineEmits<{
		(e: 'created', newItem: CategoryRequest, createdId: number): void
		(e: 'create', newItem: CategoryRequest): void
		(e: 'updated', updatedId: number, updatedItem: CategoryRequest): void
	}>()
	const { create, update } = useActivityCategoryCrud()
	const { lettersWithDiacriticsAndSpecialCharsRule, requiredRule } = useGeneralRules()

	const form = ref<InstanceType<typeof VForm>>()
	const dialog = ref(false)
	const request = ref(new CategoryRequest())
	const idToEdit = ref<number | null>(null)
	const isEdit = ref(false)

	function openAddDialog() {
		request.value = new CategoryRequest()
		isEdit.value = false
		dialog.value = true
	}

	function openEditDialog(oldCategory: Category) {
		request.value = CategoryRequest.fromEntity(oldCategory)
		isEdit.value = true
		dialog.value = true
	}

	async function onConfirmed() {
		const { valid } = await form.value!.validate()
		if (!valid) return
		if (isEdit.value) {
			if (useApi) {
				await update(idToEdit.value!, request.value)
			}
			emit('updated', idToEdit.value!, request.value)
		} else {
			if (useApi) {
				const createdId = await create(request.value)
				emit('created', request.value, createdId)
			}
			emit('create', request.value)
		}
		dialog.value = false
		form.value!.reset()
		request.value = new CategoryRequest()
		idToEdit.value = null
		isEdit.value = false
	}

	defineExpose({ openAddDialog, openEditDialog })
</script>

<style scoped></style>
