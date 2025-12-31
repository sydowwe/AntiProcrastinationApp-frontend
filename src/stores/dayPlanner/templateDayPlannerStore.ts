import {defineStore, type StoreGeneric} from 'pinia'
import {ref} from 'vue'
import type {TemplatePlannerTask} from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts';
import {usePlannerStoreCore} from '@/composables/dayPlanner/usePlannerStoreCore.ts';
import {TemplatePlannerTaskRequest} from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskRequest.ts';
import type {IBaseDayPlannerStore} from '@/types/IBaseDayPlannerStore.ts';
import {useTemplatePlannerTaskCrud} from '@/composables/ConcretesCrudComposable.ts';
import {TaskSpan} from '@/dtos/response/activityPlanning/IBasePlannerTask.ts';

export interface ITemplateDayPlannerStore extends IBaseDayPlannerStore<TemplatePlannerTask, TemplatePlannerTaskRequest> {
}

export const useTemplateDayPlannerStore = defineStore('templateDayPlanner', () => {
	const core = usePlannerStoreCore<TemplatePlannerTask, TemplatePlannerTaskRequest>(() => new TemplatePlannerTaskRequest())
	const {patch, fetchById} = useTemplatePlannerTaskCrud()
	// Template metadata
	const currentTemplateId = ref<number | null>(null)
	const templateName = ref<string>('')

	async function updateTaskSpan(eventId: number, span: TaskSpan) {
		await patch(eventId, span)
	}

	return {
		...core,
		// Template metadata
		updateTaskSpan,
		currentTemplateId,
		templateName,
	}
}, {
	persist: {omit: ["events"]}
}) satisfies () => ITemplateDayPlannerStore & StoreGeneric