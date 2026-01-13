import {defineStore} from 'pinia'
import {computed, ref} from 'vue'
import {useMoment} from '@/scripts/momentHelper.ts'
import {PlannerTask} from '@/dtos/response/activityPlanning/PlannerTask.ts'
import {PlannerTaskRequest} from '@/dtos/request/activityPlanning/PlannerTaskRequest.ts'
import {usePlannerStoreCore} from '@/composables/dayPlanner/usePlannerStoreCore.ts';
import type {IBaseDayPlannerStore} from '@/types/IBaseDayPlannerStore.ts';
import {Time} from '@/utils/Time.ts';
import {TaskSpan} from '@/dtos/response/activityPlanning/IBasePlannerTask.ts';
import {useTaskPlannerCrud} from '@/composables/ConcretesCrudComposable.ts';
import type {TaskPlannerDayTemplate} from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts';

export interface IDayPlannerStore extends IBaseDayPlannerStore<PlannerTask, PlannerTaskRequest> {
	viewedDate: Date
	viewStartDate: Date
	viewEndDate: Date
	dateTimeFromSlotIndex: (slotIndex: number) => Date
	datetimeToSlotIndex: (time?: Date) => number
}

export const useDayPlannerStore = defineStore('dayPlanner', () => {
	const {formatToTime24H} = useMoment()
	const core = usePlannerStoreCore<PlannerTask, PlannerTaskRequest>(() => new PlannerTaskRequest())
	const {patch, fetchById} = useTaskPlannerCrud()

	// Day-specific state
	const viewedDate = ref(new Date())

	const templateInPreview = ref<TaskPlannerDayTemplate | null>(null)
	const tasksFromTemplate = ref<PlannerTask[] | null>(null)

	const isTemplateInPreview = computed(() => templateInPreview.value !== null)

	function offsetTasksFromTemplate(offset: number) {
		if (!tasksFromTemplate.value) return


		const defaultStart = templateInPreview.value!.defaultWakeUpTime
		const defaultEnd = templateInPreview.value!.defaultBedTime

		// Remove existing template preview tasks
		core.events.value = core.events.value.filter(e => e.id > 0)

		// Find the minimum start time and maximum end time after applying offset
		const minStartMinutes = Math.min(...tasksFromTemplate.value.map(t => t.startTime.getInMinutes + offset * 60))
		const maxEndMinutes = Math.max(...tasksFromTemplate.value.map(t => t.endTime.getInMinutes + offset * 60))

		const currentViewStartMinutes = core.viewStartTime.value.getInMinutes
		const currentViewEndMinutes = core.viewEndTime.value.getInMinutes

		const defaultStartMinutes = defaultStart.getInMinutes
		const defaultEndMinutes = defaultEnd.getInMinutes

		// Normalize end times if they wrap to next day (e.g., 00:00 = 1440 minutes)
		const normalizedCurrentViewEndMinutes = currentViewEndMinutes < currentViewStartMinutes
			? currentViewEndMinutes + 1440
			: currentViewEndMinutes

		const normalizedDefaultEndMinutes = defaultEndMinutes < defaultStartMinutes
			? defaultEndMinutes + 1440
			: defaultEndMinutes

		// Always reset to defaults at offset 0
		if (offset === 0) {
			core.viewStartTime.value = new Time(defaultStart.hours, defaultStart.minutes)
			core.viewEndTime.value = new Time(defaultEnd.hours, defaultEnd.minutes)
		} else {
			// Extend view start if tasks overflow before current view start
			if (minStartMinutes < currentViewStartMinutes) {
				core.viewStartTime.value = Time.fromMinutes(minStartMinutes)
			} else if (minStartMinutes >= defaultStartMinutes) {
				// Reset to default if tasks fit within default range
				core.viewStartTime.value = new Time(defaultStart.hours, defaultStart.minutes)
			}

			// Extend view end if tasks overflow after current view end
			if (maxEndMinutes > normalizedCurrentViewEndMinutes) {
				core.viewEndTime.value = Time.fromMinutes(maxEndMinutes)
			} else if (maxEndMinutes <= normalizedDefaultEndMinutes) {
				// Reset to default if tasks fit within default range
				core.viewEndTime.value = new Time(defaultEnd.hours, defaultEnd.minutes)
			}
		}

		// Create new tasks with offset times (offset is in hours, convert to minutes)
		core.events.value = tasksFromTemplate.value.map(t => {
			const newStartTime = Time.fromMinutes(t.startTime.getInMinutes + offset * 60)
			const newEndTime = Time.fromMinutes(t.endTime.getInMinutes + offset * 60)

			// Create shallow copy with updated times
			const newTask = Object.create(Object.getPrototypeOf(t))
			Object.assign(newTask, t, {
				startTime: newStartTime,
				endTime: newEndTime
			})
			return newTask
		})

		core.initializeEventGridPositions()
	}

	function cancelTemplatePreview() {
		// Restore default view times from template
		if (templateInPreview.value) {
			core.viewStartTime.value = new Time(
				templateInPreview.value.defaultWakeUpTime.hours,
				templateInPreview.value.defaultWakeUpTime.minutes
			)
			core.viewEndTime.value = new Time(
				templateInPreview.value.defaultBedTime.hours,
				templateInPreview.value.defaultBedTime.minutes
			)
		}

		templateInPreview.value = null
		tasksFromTemplate.value = null
		core.events.value = core.events.value.filter(e => e.id > 0)
	}

	// Day-specific computed
	const viewStartDate = computed(() => {
		const date = new Date(viewedDate.value)
		date.setHours(core.viewStartTime.value.hours, core.viewStartTime.value.minutes, 0, 0)
		return date
	})

	const viewEndDate = computed(() => {
		const date = new Date(viewedDate.value)

		const endHour = core.viewEndTime.value.hours
		const endMinute = core.viewEndTime.value.minutes

		if (endHour >= 24) {
			date.setDate(date.getDate() + Math.floor(endHour / 24))
			date.setHours(endHour % 24, endMinute, 0, 0)
		} else {
			date.setHours(endHour, endMinute, 0, 0)
		}
		return date
	})

	const dateTimeFromSlotIndex = computed(() => (slotIndex: number): Date => {
		const {hours, minutes} = core.slotIndexToTime.value(slotIndex)

		const date = new Date(viewedDate.value)

		if (hours >= 24) {
			date.setDate(date.getDate() + Math.floor(hours / 24))
			date.setHours(hours % 24, minutes, 0, 0)
		} else {
			date.setHours(hours, minutes, 0, 0)
		}

		return date
	})

	const datetimeToSlotIndex = computed(() => (dateTime?: Date): number => {
		const time = new Time(dateTime?.getHours(), dateTime?.getMinutes())
		return core.timeToSlotIndex.value(time)
	})

	async function updateTaskSpan(eventId: number, span: TaskSpan) {
		if (isTemplateInPreview.value)
			return
		await patch(eventId, span)
	}

	async function updateTaskIsDone(eventId: number, isDone: boolean) {
		if (isTemplateInPreview.value)
			return
		await patch(eventId, {isDone})
	}

	function toggleEventSelection(eventId: number) {
		if (isTemplateInPreview.value)
			return
		core.toggleEventSelection(eventId)
	}

	return {
		...core,
		toggleEventSelection,
		updateTaskSpan,
		updateTaskIsDone,

		templateInPreview,
		isTemplateInPreview,
		tasksFromTemplate,
		offsetTasksFromTemplate,
		cancelTemplatePreview,
		// Day-specific
		viewedDate,
		viewStartDate,
		viewEndDate,
		dateTimeFromSlotIndex,
		datetimeToSlotIndex,
	}
}) satisfies () => IDayPlannerStore