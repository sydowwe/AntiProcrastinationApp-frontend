<template>
	<VForm
		ref="form"
		class="py-2 d-flex flex-column ga-3"
		@submit.prevent="onConfirm"
	>
		<VTextField
			v-model="request.name"
			:label="t('general.name')"
			:rules="[requiredRule, lettersWithDiacriticsAndSpecialCharsRule]"
		/>
		<VTextarea
			v-model="request.text"
			:label="t('general.text')"
		/>
		<ColorPicker
			v-model="request.color"
			:label="t('activities.color')"
		/>
		<IconPicker
			v-model="request.icon"
			:label="t('activities.icon')"
		/>
	</VForm>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import { useI18n } from 'vue-i18n'
	import { VForm } from 'vuetify/components'
	import ColorPicker from '@/_common/component/inputs/ColorPicker.vue'
	import IconPicker from '@/_common/component/inputs/IconPicker.vue'
	import type { Role } from '@/core/activity/dto/response/Role.ts'
	import { RoleRequest } from '@/core/activity/dto/request/RoleRequest.ts'
	import { useGeneralRules } from '@/_common/composable/general/rules/RulesComposition.ts'
	import { useActivityRoleCrud } from '@/core/activity/api/activityRoleApi.ts'
	import { useDialogApi } from '@/_common/composable/general/useDialog.ts'

	const { entityToEdit = null } = defineProps<{ entityToEdit?: Role | null }>()

	const { t } = useI18n()
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
