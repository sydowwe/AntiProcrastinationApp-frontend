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
	import { useTaskPlannerDayTemplateTaskCrud } from '@/core/dayPlanner/api/taskPlannerDayTemplateApi.ts'
	import type { TaskPlannerDayTemplate } from '@/core/dayPlanner/dto/response/template/TaskPlannerDayTemplate.ts'
	import type { TaskPlannerDayTemplateRequest } from '@/core/dayPlanner/dto/request/template/TaskPlannerDayTemplateRequest.ts'

	const { template = null, defaultValues = null } = defineProps<{
		template?: TaskPlannerDayTemplate | null
		defaultValues?: TaskPlannerDayTemplateRequest | null
	}>()

	const dialogApi = useDialogApi<{ request: TaskPlannerDayTemplateRequest; savedId: number }>()
	const { create, update } = useTaskPlannerDayTemplateTaskCrud()

	const detailsForm = ref<InstanceType<typeof TaskPlannerDayTemplateDetailsForm> | null>(null)

	dialogApi.onConfirm(onConfirm)

	// The save happens here, not in the caller, so a server rejection leaves the dialog open with the
	// user's input in it — closing first and calling after cost them the form on every 400 (F53).
	async function onConfirm() {
		const formData = await detailsForm.value?.validateAndGetData()
		if (!formData) return
		dialogApi.setLoading(true)
		try {
			if (template) {
				await update(template.id, formData)
				dialogApi.close({ request: formData, savedId: template.id })
			} else {
				const createdId = await create(formData)
				dialogApi.close({ request: formData, savedId: createdId as number })
			}
		} finally {
			dialogApi.setLoading(false)
		}
	}
</script>
