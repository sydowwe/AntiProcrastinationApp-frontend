<template>
	<MyDialog
		v-model="dialog"
		:title="template ? `${$t('general.edit')} template` : `${$t('general.new')} template`"
		:confirmBtnLabel="template ? $t('general.update') : $t('general.create')"
		@confirmed="handleConfirm"
	>
		<TaskPlannerDayTemplateDetailsForm
			ref="detailsForm"
			class="py-2"
			:template="template"
			:defaultValues="defaultValues"
			isDialog
		/>
	</MyDialog>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import type { TaskPlannerDayTemplate } from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts'
	import TaskPlannerDayTemplateDetailsForm from '@/components/dayPlanner/template/TaskPlannerDayTemplateDetailsForm.vue'
	import MyDialog from '@/components/general/dialogs/MyDialog.vue'

	import type { TaskPlannerDayTemplateRequest } from '@/dtos/request/activityPlanning/template/TaskPlannerDayTemplateRequest.ts'

	defineProps<{
		template: TaskPlannerDayTemplate | null
		defaultValues?: TaskPlannerDayTemplateRequest | null
	}>()

	const emit = defineEmits<{
		save: [request: TaskPlannerDayTemplateRequest]
	}>()
	const dialog = defineModel<boolean>({ required: true })
	const detailsForm = ref<InstanceType<typeof TaskPlannerDayTemplateDetailsForm> | null>(null)

	async function handleConfirm() {
		const formData = await detailsForm.value?.validateAndGetData()
		console.log(formData)
		if (formData) {
			emit('save', formData)
		}
	}
</script>
