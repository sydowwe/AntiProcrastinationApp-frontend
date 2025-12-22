import {defineStore, type StoreGeneric} from 'pinia'
import {ref} from 'vue'
import type {TemplatePlannerTask} from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts';
import {usePlannerStoreCore} from '@/composables/dayPlanner/usePlannerStoreCore.ts';
import {TemplatePlannerTaskRequest} from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskRequest.ts';
import type {IBaseDayPlannerStore} from '@/types/IBaseDayPlannerStore.ts';

export interface ITemplateDayPlannerStore extends IBaseDayPlannerStore<TemplatePlannerTask, TemplatePlannerTaskRequest> {
}

export const useTemplateDayPlannerStore = defineStore('templateDayPlanner', () => {
	const core = usePlannerStoreCore<TemplatePlannerTask, TemplatePlannerTaskRequest>(() => new TemplatePlannerTaskRequest())

	// Template metadata
	const currentTemplateId = ref<string | null>(null)
	const templateName = ref<string>('')


	return {
		...core,
		// Template metadata
		currentTemplateId,
		templateName,
	}
}) satisfies () => ITemplateDayPlannerStore & StoreGeneric