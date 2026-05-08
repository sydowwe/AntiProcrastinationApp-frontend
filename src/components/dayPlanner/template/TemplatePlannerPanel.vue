<!-- TemplatePlannerPanel.vue - Reusable template planner panel, used in both single and split-view -->
<template>
	<VCard
		v-if="!detailsHidden"
		class="d-flex flex-column details-form"
		elevation="2"
		style="max-width: 500px"
	>
		<VCardTitle class="pt-5 px-5 pb-0 d-flex justify-space-between align-center">
			<span class="text-grey-lighten-1">Template details</span>
			<VIconBtn
				color="secondaryOutline"
				icon="xmark"
				variant="tonal"
				size="40"
				@click="detailsHidden = !detailsHidden"
			>
				<VIcon size="24"></VIcon>
			</VIconBtn>
		</VCardTitle>
		<VCardText class="flex-fill py-6">
			<TaskPlannerDayTemplateDetailsForm
				ref="detailsForm"
				:template="currentTemplate"
			/>
		</VCardText>
		<VCardActions class="pa-5">
			<VBtn
				block
				color="primary"
				@click="updateDetails"
			>
				Update details
			</VBtn>
		</VCardActions>
	</VCard>
</template>

<script setup lang="ts">
	import TaskPlannerDayTemplateDetailsForm from '@/components/dayPlanner/template/TaskPlannerDayTemplateDetailsForm.vue'
	import { useTaskPlannerDayTemplateTaskCrud } from '@/api/taskPlanner/taskPlannerDayTemplateApi.ts'
	import { inject, onMounted, ref, watch } from 'vue'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import type { ITemplateDayPlannerStore } from '@/stores/dayPlanner/templateDayPlannerStore.ts'
	import type { TaskPlannerDayTemplate } from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts'

	const { templateId } = defineProps<{
		templateId: number | null
	}>()
	const detailsHidden = defineModel<boolean>({ required: true })

	const store = inject<ITemplateDayPlannerStore>('plannerStore')!
	const { showSuccessSnackbar } = useSnackbar()
	const { update, fetchById } = useTaskPlannerDayTemplateTaskCrud()

	onMounted(() => {
		loadTemplateDetails()
	})

	const detailsForm = ref<InstanceType<typeof TaskPlannerDayTemplateDetailsForm>>()
	const currentTemplate = ref<TaskPlannerDayTemplate | null>(null)

	async function loadTemplateDetails() {
		if (!templateId) return
		const template = await fetchById(templateId)
		if (!template) throw Error(`Template with ID ${templateId} not found`)
		currentTemplate.value = template
		store.currentTemplateId = templateId
		store.templateName = template.name
		store.viewStartTime = template.defaultWakeUpTime
		store.viewEndTime = template.defaultBedTime
	}

	async function updateDetails(): Promise<void> {
		const request = await detailsForm.value?.validateAndGetData()
		if (!request || !templateId) return
		await update(templateId, request)
		await loadTemplateDetails()
		showSuccessSnackbar('Template details updated')
	}

	watch(
		() => templateId,
		async () => {
			await loadTemplateDetails()
		},
	)
</script>
