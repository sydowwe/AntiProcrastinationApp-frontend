import { defineStore } from 'pinia'
import { type InjectionKey, ref, watch } from 'vue'
import { deserializeClipboard, serializeClipboard } from '@/core/dayPlanner/composable/usePlannerClipboardStorage.ts'
import type { TemplatePlannerTask } from '@/core/dayPlanner/dto/response/template/TemplatePlannerTask.ts'
import { usePlannerStoreCore } from '@/core/dayPlanner/composable/usePlannerStoreCore.ts'
import type { TemplatePlannerTaskRequest } from '@/core/dayPlanner/dto/request/template/TemplatePlannerTaskRequest.ts'
import type { IBaseDayPlannerStore } from '@/core/dayPlanner/store/IBaseDayPlannerStore.ts'
import { useTemplatePlannerTaskCrud } from '@/core/dayPlanner/api/templatePlannerTaskApi.ts'
import type { TaskSpan } from '@/core/dayPlanner/dto/response/IBasePlannerTask.ts'

export interface ITemplateDayPlannerStore extends IBaseDayPlannerStore<
	TemplatePlannerTask,
	TemplatePlannerTaskRequest
> {
	currentTemplateId: number | null
	templateName: string
}

/**
 * Narrower sibling of `PLANNER_STORE_KEY` for the handful of components that need the template
 * store's own fields. `TemplateDayPlannerView` provides the same store object under both keys, so
 * a split-view panel still gets its own store either way.
 */
export const TEMPLATE_PLANNER_STORE_KEY = Symbol('templatePlannerStore') as InjectionKey<ITemplateDayPlannerStore>

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
			core.pendingClipboard.value = {
				...core.pendingClipboard.value,
				sourceContext: String(currentTemplateId.value),
			}
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

	function resetStore() {
		core.resetStore()
		currentTemplateId.value = null
		templateName.value = ''
	}

	return {
		...core,
		startCut,
		updateTaskSpan,
		currentTemplateId,
		templateName,
		resetStore,
	}
}

export const useTemplateDayPlannerStore = defineStore(
	'templateDayPlanner',
	() => templatePlannerSetup('template-planner-clipboard'),
	{
		// `storage` is explicit because the framework's Pinia setup leaves the plugin on its
		// localStorage default; this app has always kept planner state per-tab in sessionStorage.
		persist: { omit: ['tasks'], storage: sessionStorage },
	},
) satisfies () => ITemplateDayPlannerStore

export const useSecondaryTemplateDayPlannerStore = defineStore(
	'templateDayPlanner-secondary',
	() => templatePlannerSetup('template-planner-clipboard-secondary'),
	{
		persist: false,
	},
) satisfies () => ITemplateDayPlannerStore
