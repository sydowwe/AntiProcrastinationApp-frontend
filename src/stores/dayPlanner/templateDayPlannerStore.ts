import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { deserializeClipboard, serializeClipboard } from '@/composables/dayPlanner/usePlannerClipboardStorage.ts'
import type { TemplatePlannerTask } from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts'
import { usePlannerStoreCore } from '@/composables/dayPlanner/usePlannerStoreCore.ts'
import type { TemplatePlannerTaskRequest } from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskRequest.ts'
import type { IBaseDayPlannerStore } from '@/stores/dayPlanner/IBaseDayPlannerStore.ts'
import { useTemplatePlannerTaskCrud } from '@/api/taskPlanner/templatePlannerTaskApi.ts'
import type { TaskSpan } from '@/dtos/response/activityPlanning/IBasePlannerTask.ts'

export type ITemplateDayPlannerStore = IBaseDayPlannerStore<TemplatePlannerTask, TemplatePlannerTaskRequest>

function templatePlannerSetup(storageKey: string) {
	const core = usePlannerStoreCore<TemplatePlannerTask, TemplatePlannerTaskRequest>()
	const { patch } = useTemplatePlannerTaskCrud()
	const currentTemplateId = ref<number | null>(null)
	const templateName = ref<string>('')

	async function updateTaskSpan(eventId: number, span: TaskSpan) {
		await patch(eventId, span)
	}

	function startCut() {
		core.startCut()
		if (core.pendingClipboard.value)
			core.pendingClipboard.value = { ...core.pendingClipboard.value, sourceContext: String(currentTemplateId.value) }
	}

	const savedClipboard = sessionStorage.getItem(storageKey)
	if (savedClipboard) {
		try {
			core.pendingClipboard.value = deserializeClipboard(savedClipboard)
		} catch {
			sessionStorage.removeItem(storageKey)
		}
	}
	watch(core.pendingClipboard, val => {
		if (val) sessionStorage.setItem(storageKey, serializeClipboard(val))
		else sessionStorage.removeItem(storageKey)
	})

	return {
		...core,
		startCut,
		updateTaskSpan,
		currentTemplateId,
		templateName,
	}
}

export const useTemplateDayPlannerStore = defineStore('templateDayPlanner', () => templatePlannerSetup('template-planner-clipboard'), {
	persist: { omit: ['tasks'] },
}) satisfies () => ITemplateDayPlannerStore

export const useSecondaryTemplateDayPlannerStore = defineStore('templateDayPlanner-secondary', () => templatePlannerSetup('template-planner-clipboard-secondary'), {
	persist: false,
}) satisfies () => ITemplateDayPlannerStore
