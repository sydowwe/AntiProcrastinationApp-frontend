import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { TemplatePlannerTask } from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts'
import { usePlannerStoreCore } from '@/composables/dayPlanner/usePlannerStoreCore.ts'
import type { TemplatePlannerTaskRequest } from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskRequest.ts'
import type { IBaseDayPlannerStore } from '@/stores/dayPlanner/IBaseDayPlannerStore.ts'
import { useTemplatePlannerTaskCrud } from '@/api/taskPlanner/templatePlannerTaskApi.ts'
import type { TaskSpan } from '@/dtos/response/activityPlanning/IBasePlannerTask.ts'

export type ITemplateDayPlannerStore = IBaseDayPlannerStore<TemplatePlannerTask, TemplatePlannerTaskRequest>

function templatePlannerSetup() {
	const core = usePlannerStoreCore<TemplatePlannerTask, TemplatePlannerTaskRequest>()
	const { patch } = useTemplatePlannerTaskCrud()
	const currentTemplateId = ref<number | null>(null)
	const templateName = ref<string>('')

	async function updateTaskSpan(eventId: number, span: TaskSpan) {
		await patch(eventId, span)
	}

	return {
		...core,
		updateTaskSpan,
		currentTemplateId,
		templateName,
	}
}

export const useTemplateDayPlannerStore = defineStore('templateDayPlanner', templatePlannerSetup, {
	persist: { omit: ['tasks'] },
}) satisfies () => ITemplateDayPlannerStore

export const useSecondaryTemplateDayPlannerStore = defineStore('templateDayPlanner-secondary', templatePlannerSetup, {
	persist: false,
}) satisfies () => ITemplateDayPlannerStore
