<!-- TemplatePlannerPanel.vue - Reusable template planner panel, used in both single and split-view -->
<template>
	<div class="d-flex flex-column flex-fill">
		<div class="flex-fill pa-4">
			<TaskPlannerDayTemplateDetailsForm
				ref="detailsForm"
				:template="currentTemplate"
			/>
		</div>
		<div class="pa-5">
			<VBtn
				block
				color="primary"
				:disabled="!currentTemplate"
				@click="updateDetails"
			>
				{{ $t('planner.template.updateDetailsAction') }}
			</VBtn>
		</div>
	</div>
</template>

<script setup lang="ts">
	import TaskPlannerDayTemplateDetailsForm from '@/core/dayPlanner/component/template/TaskPlannerDayTemplateDetailsForm.vue'
	import { useTaskPlannerDayTemplateTaskCrud } from '@/core/dayPlanner/api/taskPlannerDayTemplateApi.ts'
	import { inject, onMounted, ref, watch } from 'vue'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { TEMPLATE_PLANNER_STORE_KEY } from '@/core/dayPlanner/store/templateDayPlannerStore.ts'
	import type { TaskPlannerDayTemplate } from '@/core/dayPlanner/dto/response/template/TaskPlannerDayTemplate.ts'
	import { useI18n } from 'vue-i18n'

	const { templateId } = defineProps<{
		templateId: number | null
	}>()

	const emit = defineEmits<{
		/** `null` once the template loaded; its id when the fetch failed (F55). */
		notFound: [id: number | null]
	}>()

	const store = inject(TEMPLATE_PLANNER_STORE_KEY)!
	const { showSuccessSnackbar } = useSnackbar()
	const { update, fetchById } = useTaskPlannerDayTemplateTaskCrud()
	const { t } = useI18n()

	onMounted(() => {
		loadTemplateDetails()
	})

	const detailsForm = ref<InstanceType<typeof TaskPlannerDayTemplateDetailsForm>>()
	const currentTemplate = ref<TaskPlannerDayTemplate | null>(null)

	async function loadTemplateDetails() {
		if (!templateId) return
		// The main store persists `templateName` to sessionStorage, so until this resolves the header
		// would read whichever template this tab last opened — drop it unless it is this one.
		if (store.currentTemplateId !== templateId) store.templateName = ''
		let template: TaskPlannerDayTemplate
		try {
			template = await fetchById(templateId)
		} catch {
			// Not `_silent`: the interceptor's toast is the first signal. Clearing the store together
			// is what keeps the previous template's name out of the header — here and, because the
			// store persists, across a reload of the same bad URL. Nothing here may assume the route:
			// the split view mounts this panel with an id from a select.
			currentTemplate.value = null
			store.resetStore()
			emit('notFound', templateId)
			return
		}
		emit('notFound', null)
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
		showSuccessSnackbar(t('planner.template.updateDetailsSuccess'))
	}

	watch(
		() => templateId,
		async () => {
			await loadTemplateDetails()
		},
	)
</script>
