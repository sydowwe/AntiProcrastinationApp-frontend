<template>
<MyDialog
	:title="template ? `${$t('general.edit')} template` : `${$t('general.new')} template`"
	:confirmBtnLabel="template ? $t('general.update') : $t('general.create')"
	v-model="dialog"
	@confirmed="handleConfirm"
>
	<TaskPlannerDayTemplateDetailsForm
		ref="detailsForm"
		:template="template"
	/>
</MyDialog>
</template>

<script setup lang="ts">
import {ref} from 'vue'
import type {TaskPlannerDayTemplate} from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts'
import type {TaskPlannerDayTemplateRequest} from '@/dtos/request/activityPlanning/template/TaskPlannerDayTemplateRequest.ts'
import TaskPlannerDayTemplateDetailsForm from '@/components/dayPlanner/template/TaskPlannerDayTemplateDetailsForm.vue'
import MyDialog from '@/components/dialogs/MyDialog.vue'

const props = defineProps<{
	template: TaskPlannerDayTemplate | null
}>()

const dialog = defineModel<boolean>({required: true})
const emit = defineEmits<{
	save: [request: TaskPlannerDayTemplateRequest]
}>()

const detailsForm = ref<InstanceType<typeof TaskPlannerDayTemplateDetailsForm> | null>(null)

async function handleConfirm() {
	const formData = await detailsForm.value?.validateAndGetData()
	if (formData) {
		emit('save', formData)
	}
}
</script>
