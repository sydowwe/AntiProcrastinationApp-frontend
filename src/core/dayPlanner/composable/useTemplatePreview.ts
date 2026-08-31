import type { Ref } from 'vue'
import { Time } from '@/_common/dto/dto/Time.ts'
import type { Calendar } from '@/core/dayPlanner/dto/response/Calendar.ts'
import { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
import { PlannerTaskRequest } from '@/core/dayPlanner/dto/request/PlannerTaskRequest.ts'
import { TemplatePlannerTaskFilter } from '@/core/dayPlanner/dto/request/template/TemplatePlannerTaskFilter.ts'
import { ApplyTemplateToTaskPlannerRequest } from '@/core/dayPlanner/dto/request/ApplyTemplateToTaskPlannerRequest.ts'
import { ApplyTemplatePlannerTaskResponse } from '@/core/dayPlanner/dto/response/ApplyTemplatePlannerTaskResponse.ts'
import type { ApplyTemplateConflictResolution } from '@/core/dayPlanner/dto/enum/ApplyTemplateConflictResolution.ts'
import type { TemplatePlannerTask } from '@/core/dayPlanner/dto/response/template/TemplatePlannerTask.ts'
import type { useDayPlannerStore } from '@/core/dayPlanner/store/dayPlannerStore.ts'
import { useLoading } from '@/_common/composable/general/LoadingComposable.ts'
import { API } from '@/_common/axiosConfig.ts'

/**
 * The template-in-preview lifecycle: overlaying a template's tasks onto the current day, and
 * committing that overlay for real. `templatePreview` re-runs on every view-range or template change;
 * `applyTemplate` is the one-shot commit `UseTemplateActionBar` triggers.
 */
export function useTemplatePreview(
	store: ReturnType<typeof useDayPlannerStore>,
	calendar: Ref<Calendar | undefined>,
	fetchTemplateTasks: (filter: TemplatePlannerTaskFilter) => Promise<TemplatePlannerTask[]>,
) {
	const { showFullScreenLoading, hideFullScreenLoading } = useLoading()

	async function templatePreview() {
		if (!store.templateInPreview) return
		store.selectedTaskIds.clear()
		if (!store.previewBaseStartTime) {
			store.previewBaseStartTime = new Time(store.viewStartTime.hours, store.viewStartTime.minutes)
			store.previewBaseEndTime = new Time(store.viewEndTime.hours, store.viewEndTime.minutes)
		}
		Object.assign(store.viewStartTime, store.templateInPreview.defaultWakeUpTime)
		Object.assign(store.viewEndTime, store.templateInPreview.defaultBedTime)
		store.tasksFromTemplate = (
			await fetchTemplateTasks(
				new TemplatePlannerTaskFilter(store.templateInPreview.id, store.viewStartTime, store.viewEndTime),
			)
		).map(e => PlannerTask.fromTemplateTask(calendar.value!.id, e))
		store.tasks = store.tasks.filter(t => t.id > 0)
		store.tasks.push(...store.tasksFromTemplate)
		store.initializeTaskGridPositions()
	}

	async function applyTemplate(conflictResolution: ApplyTemplateConflictResolution) {
		if (!store.templateInPreview) {
			throw new Error('No template selected')
		}
		showFullScreenLoading()
		try {
			const tasksIncluded = store.tasks
				.filter(task => task.id < 0)
				.map(task => PlannerTaskRequest.fromEntity(task))
			const request = new ApplyTemplateToTaskPlannerRequest(
				store.templateInPreview.id,
				calendar.value!.id,
				conflictResolution,
				tasksIncluded,
			)
			const json = await API.post('calendar/apply-planner-template', request)
			const response = ApplyTemplatePlannerTaskResponse.fromJson(json.data)

			store.resetStore()
			calendar.value = response.calendar
			store.tasks = response.tasks
			store.initializeTaskGridPositions()
		} finally {
			hideFullScreenLoading()
		}
	}

	return { templatePreview, applyTemplate }
}
