<template>
	<VForm
		ref="form"
		class="d-flex flex-column ga-3"
		@submit.prevent
	>
		<VTextField
			v-model="request.name"
			:label="$t('leisure.fields.activity')"
			required
			:rules="[requiredRule]"
		/>
		<VIdAutocomplete
			v-model="request.roleId"
			:label="$t('leisure.activityRole')"
			:items="roleOptions"
			required
			:rules="[requiredRule]"
		/>
		<VIdAutocomplete
			v-model="request.categoryId"
			:label="$t('leisure.activityCategory')"
			:items="categoryOptions"
		/>
	</VForm>
</template>

<script setup lang="ts">
	import { onMounted, ref } from 'vue'
	import { VForm } from 'vuetify/components'
	import { useGeneralRules } from '@/_common/composable/general/rules/RulesComposition.ts'
	import { useDialogApi } from '@/_common/composable/general/useDialog.ts'
	import { useActivityCrud } from '@/core/activity/api/activityApi.ts'
	import { useActivityRoleCrud } from '@/core/activity/api/activityRoleApi.ts'
	import { useActivityCategoryCrud } from '@/core/activity/api/activityCategoryApi.ts'
	import { ActivityRequest } from '@/core/activity/dto/request/ActivityRequest.ts'
	import { SelectOption } from '@/_common/dto/response/general/SelectOption.ts'
	import type { Activity } from '@/core/activity/dto/response/Activity.ts'

	const { initialName = '' } = defineProps<{ initialName?: string }>()

	const dialogApi = useDialogApi<Activity>()
	const { requiredRule } = useGeneralRules()
	const { createWithResponse } = useActivityCrud()
	const { fetchAll: fetchRoles } = useActivityRoleCrud()
	const { fetchAll: fetchCategories } = useActivityCategoryCrud()

	const form = ref<InstanceType<typeof VForm>>()
	const roleOptions = ref<SelectOption[]>([])
	const categoryOptions = ref<SelectOption[]>([])
	const request = ref(new ActivityRequest(initialName))

	onMounted(async () => {
		;[roleOptions.value, categoryOptions.value] = await Promise.all([
			fetchRoles().then(roles => roles.map(role => SelectOption.fromIdName(role))),
			fetchCategories().then(categories => categories.map(category => SelectOption.fromIdName(category))),
		])
	})

	dialogApi.onConfirm(onConfirm)

	async function onConfirm() {
		const { valid } = await form.value!.validate()
		if (!valid) return
		dialogApi.setLoading(true)
		try {
			const createdActivity = await createWithResponse(request.value)
			dialogApi.close(createdActivity)
		} finally {
			dialogApi.setLoading(false)
		}
	}
</script>
