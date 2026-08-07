<template>
	<TaskPlannerDayTemplateDetailsForm
		ref="detailsForm"
		class="py-2"
		:template
		:defaultValues
		isDialog
	/>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import TaskPlannerDayTemplateDetailsForm from '@/core/dayPlanner/component/template/TaskPlannerDayTemplateDetailsForm.vue'
	import { useDialogApi } from '@/_common/composable/general/useDialog.ts'
	import type { TaskPlannerDayTemplate } from '@/core/dayPlanner/dto/response/template/TaskPlannerDayTemplate.ts'
	import type { TaskPlannerDayTemplateRequest } from '@/core/dayPlanner/dto/request/template/TaskPlannerDayTemplateRequest.ts'

	const { template = null, defaultValues = null } = defineProps<{
		template?: TaskPlannerDayTemplate | null
		defaultValues?: TaskPlannerDayTemplateRequest | null
	}>()

	const dialogApi = useDialogApi<{ request: TaskPlannerDayTemplateRequest }>()

	const detailsForm = ref<InstanceType<typeof TaskPlannerDayTemplateDetailsForm> | null>(null)

	dialogApi.onConfirm(onConfirm)

	async function onConfirm() {
		const formData = await detailsForm.value?.validateAndGetData()
		if (formData) {
			dialogApi.close({ request: formData })
		}
	}
</script>
