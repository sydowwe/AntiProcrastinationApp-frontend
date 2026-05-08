import { defineStore } from 'pinia'
import type { PlannerTask } from '@/dtos/response/activityPlanning/PlannerTask.ts'
import type { PlannerTaskRequest } from '@/dtos/request/activityPlanning/PlannerTaskRequest.ts'
import { usePlannerStoreCore } from '@/composables/dayPlanner/usePlannerStoreCore.ts'
import type { IBaseDayPlannerStore } from '@/stores/dayPlanner/IBaseDayPlannerStore.ts'
import { Time } from '@/dtos/dto/Time.ts'
import type { TaskSpan } from '@/dtos/response/activityPlanning/IBasePlannerTask.ts'
import { useTaskPlannerCrud } from '@/api/taskPlanner/plannerTaskApi.ts'
import type { TaskPlannerDayTemplate } from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts'
import { computed, ref, watch } from 'vue'
import { deserializeClipboard, serializeClipboard } from '@/composables/dayPlanner/usePlannerClipboardStorage.ts'
import type { PlannerTaskStatus } from '@/dtos/enum/PlannerTaskStatus.ts'

export interface IDayPlannerStore extends IBaseDayPlannerStore<PlannerTask, PlannerTaskRequest> {
	viewedDate: Date
	viewStartDate: Date
	viewEndDate: Date
	dateTimeFromSlotIndex: (slotIndex: number) => Date
	datetimeToSlotIndex: (time?: Date) => number
	pendingInitialActivityId: number | undefined
	pendingInitialTodoListItemId: number | undefined
	pendingPickerMode: 'all' | 'todo' | 'routine' | undefined
	pendingSuggestedDuration: Time | undefined
	openCreateDialogWithActivity: (
		activityId: number,
		todoListItemId?: number,
		pickerMode?: 'all' | 'todo' | 'routine',
		suggestedDuration?: Time,
	) => void
}

const CLIPBOARD_KEY = 'planner-clipboard'

export const useDayPlannerStore = defineStore('dayPlanner', () => {
	const core = usePlannerStoreCore<PlannerTask, PlannerTaskRequest>()
	const { patch } = useTaskPlannerCrud()

	// Day-specific state
	const viewedDate = ref(new Date())

	// Pending initial data for create dialog (e.g. opened from todo list)
	const pendingInitialActivityId = ref<number | undefined>(undefined)
	const pendingInitialTodoListItemId = ref<number | undefined>(undefined)
	const pendingPickerMode = ref<'all' | 'todo' | 'routine' | undefined>(undefined)
	const pendingSuggestedDuration = ref<Time | undefined>(undefined)

	function openCreateDialogWithActivity(
		activityId: number,
		todoListItemId?: number,
		pickerMode?: 'all' | 'todo' | 'routine',
		suggestedDuration?: Time,
	): void {
		pendingInitialActivityId.value = activityId
		pendingInitialTodoListItemId.value = todoListItemId
		pendingPickerMode.value = pickerMode
		pendingSuggestedDuration.value = suggestedDuration
		core.openCreateDialog()
	}

	const templateInPreview = ref<TaskPlannerDayTemplate | null>(null)
	const tasksFromTemplate = ref<PlannerTask[] | null>(null)
	const previewBaseStartTime = ref<Time | null>(null)
	const previewBaseEndTime = ref<Time | null>(null)

	const isTemplateInPreview = computed(() => templateInPreview.value !== null)

	function offsetTasksFromTemplate(offset: number) {
		if (!tasksFromTemplate.value) return

		const defaultStart = templateInPreview.value!.defaultWakeUpTime
		const defaultEnd = templateInPreview.value!.defaultBedTime

		// Remove existing template preview tasks
		core.tasks.value = core.tasks.value.filter(e => e.id > 0)

		// Find the minimum start time and maximum end time after applying offset
		const minStartMinutes = Math.min(...tasksFromTemplate.value.map(t => t.startTime.getInMinutes + offset * 60))
		const maxEndMinutes = Math.max(...tasksFromTemplate.value.map(t => t.endTime.getInMinutes + offset * 60))

		const currentViewStartMinutes = core.viewStartTime.value.getInMinutes
		const currentViewEndMinutes = core.viewEndTime.value.getInMinutes

		const defaultStartMinutes = defaultStart.getInMinutes
		const defaultEndMinutes = defaultEnd.getInMinutes

		// Normalize end times if they wrap to next day (e.g., 00:00 = 1440 minutes)
		const normalizedCurrentViewEndMinutes =
			currentViewEndMinutes < currentViewStartMinutes ? currentViewEndMinutes + 1440 : currentViewEndMinutes

		const normalizedDefaultEndMinutes =
			defaultEndMinutes < defaultStartMinutes ? defaultEndMinutes + 1440 : defaultEndMinutes

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
		core.tasks.value.push(
			...tasksFromTemplate.value.map(t => {
				const newStartTime = Time.fromMinutes(t.startTime.getInMinutes + offset * 60)
				const newEndTime = Time.fromMinutes(t.endTime.getInMinutes + offset * 60)

				// Create shallow copy with updated times
				const newTask = Object.create(Object.getPrototypeOf(t))
				Object.assign(newTask, t, {
					startTime: newStartTime,
					endTime: newEndTime,
				})
				return newTask
			}),
		)

		core.initializeTaskGridPositions()
	}

	function cancelTemplatePreview() {
		if (previewBaseStartTime.value) {
			core.viewStartTime.value = previewBaseStartTime.value
			core.viewEndTime.value = previewBaseEndTime.value!
			previewBaseStartTime.value = null
			previewBaseEndTime.value = null
		}

		templateInPreview.value = null
		tasksFromTemplate.value = null
		core.tasks.value = core.tasks.value.filter(e => e.id > 0)
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
		const { hours, minutes } = core.slotIndexToTime.value(slotIndex)

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
		if (isTemplateInPreview.value) return
		await patch(eventId, span)
	}

	async function updateTaskStatus(eventId: number, status: PlannerTaskStatus): Promise<void> {
		if (isTemplateInPreview.value) return
		await patch(eventId, { status })
	}

	function openEditDialog() {
		if (isTemplateInPreview.value) return
		core.openEditDialog()
	}

	function toggleTaskSelection(eventId: number) {
		if (isTemplateInPreview.value && eventId >= 0) return
		core.toggleTaskSelection(eventId)
	}

	const showActionBar = computed(() => core.selectedTasks.value.length > 0 && !isTemplateInPreview.value)

	function startCut() {
		core.startCut()
		if (core.pendingClipboard.value)
			core.pendingClipboard.value = {
				...core.pendingClipboard.value,
				sourceContext: viewedDate.value.toDateString(),
			}
	}

	// Persist clipboard across day navigation
	const savedClipboard = sessionStorage.getItem(CLIPBOARD_KEY)
	if (savedClipboard) {
		try {
			core.pendingClipboard.value = deserializeClipboard(savedClipboard)
		} catch {
			sessionStorage.removeItem(CLIPBOARD_KEY)
		}
	}
	watch(core.pendingClipboard, val => {
		if (val) sessionStorage.setItem(CLIPBOARD_KEY, serializeClipboard(val))
		else sessionStorage.removeItem(CLIPBOARD_KEY)
	})

	function resetStore() {
		// Reset core state
		core.resetStore()

		// Reset template state
		templateInPreview.value = null
		tasksFromTemplate.value = null
	}

	return {
		...core,
		openEditDialog,
		toggleTaskSelection,
		showActionBar,
		startCut,
		updateTaskSpan,
		updateTaskStatus,

		pendingInitialActivityId,
		pendingInitialTodoListItemId,
		pendingPickerMode,
		pendingSuggestedDuration,
		openCreateDialogWithActivity,

		templateInPreview,
		isTemplateInPreview,
		tasksFromTemplate,
		previewBaseStartTime,
		previewBaseEndTime,
		offsetTasksFromTemplate,
		cancelTemplatePreview,
		resetStore,
		// Day-specific
		viewedDate,
		viewStartDate,
		viewEndDate,
		dateTimeFromSlotIndex,
		datetimeToSlotIndex,
	}
}) satisfies () => IDayPlannerStore
