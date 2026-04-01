<template>
	<MyDialog
		v-model="dialog"
		title="Add new role"
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
	import MyDialog from '@/components/dialogs/MyDialog.vue'
	import ColorPicker from '@/components/general/ColorPicker.vue'
	import { ref } from 'vue'
	import type { Role } from '@/dtos/response/activity/Role.ts'
	import { RoleRequest } from '@/dtos/request/activity/RoleRequest.ts'
	import { useGeneralRules } from '@/composables/general/rules/RulesComposition.ts'
	import { useActivityRoleCrud } from '@/api/activity/activityRoleApi.ts'
	import { VForm } from 'vuetify/components'

	const { useApi = true } = defineProps<{ useApi?: boolean }>()

	const emit = defineEmits<{
		(e: 'created', newItem: RoleRequest, createdId: number): void
		(e: 'create', newItem: RoleRequest): void
		(e: 'updated', updatedId: number, updatedItem: RoleRequest): void
	}>()
	const { create, update } = useActivityRoleCrud()
	const { lettersWithDiacriticsAndSpecialCharsRule, requiredRule } = useGeneralRules()

	const form = ref<InstanceType<typeof VForm>>()
	const dialog = ref(false)
	const request = ref(new RoleRequest())
	const idToEdit = ref<number | null>(null)
	const isEdit = ref(false)

	function openAddDialog() {
		request.value = new RoleRequest()
		isEdit.value = false
		dialog.value = true
	}

	function openEditDialog(oldRole: Role) {
		idToEdit.value = oldRole.id
		request.value = RoleRequest.fromEntity(oldRole)
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
		request.value = new RoleRequest()
		idToEdit.value = null
		isEdit.value = false
	}

	defineExpose({ openAddDialog, openEditDialog })
</script>

<style scoped></style>
