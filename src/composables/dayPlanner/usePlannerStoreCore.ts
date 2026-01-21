import {computed, reactive, ref} from 'vue'
import {Time} from '@/utils/Time.ts'
import type {IBasePlannerTaskRequest} from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts'
import type {IBasePlannerTask} from '@/dtos/response/activityPlanning/IBasePlannerTask.ts';
import {useDayPlannerCommon} from '@/composables/dayPlanner/useDayPlannerCommon.ts';
import type {CreationPreviewType} from '@/types/DayPlannerTypes.ts';

export function usePlannerStoreCore<TTask extends IBasePlannerTask<TTaskRequest>, TTaskRequest extends IBasePlannerTaskRequest>() {
	// Time/Grid configuration state
	const timeSlotDuration = ref(10)
	const viewStartTime = ref(new Time(7, 30))
	const viewEndTime = ref(new Time(1, 30))

	// Tasks state
	const tasks = ref<TTask[]>([])

	// Selection state (for multi-select)
	const selectedTaskIds = reactive<Set<number>>(new Set())

	// Dialog state
	const dialog = ref(false)
	const editedId = ref<number | undefined>()
	const creationPreview = ref<CreationPreviewType | undefined>()
	const deleteDialog = ref(false)

	// Drag/Resize state
	const draggingTaskId = ref<number | null>(null)
	const resizingTaskId = ref<number | null>(null)
	const dragConflict = ref(false)

	// Time slots computed
	const timeSlots = computed<Time[]>(() => {
		const slots: Time[] = []
		const startMinutes = viewStartTime.value.getInMinutes

		let endMinutes = viewEndTime.value.getInMinutes
		if (endMinutes < startMinutes) {
			endMinutes += 24 * 60
		}

		for (let totalMins = startMinutes; totalMins <= endMinutes; totalMins += timeSlotDuration.value) {
			const hour = Math.floor(totalMins / 60) % 24
			const minute = totalMins % 60
			slots.push(new Time(hour, minute))
		}

		return slots
	})

	const totalGridRows = computed(() => timeSlots.value.length - 1)

	const slotIndexToTime = computed(() => (index: number): Time => {
		const totalMinutes = index * timeSlotDuration.value + viewStartTime.value.minutes
		let hours = Math.floor(totalMinutes / 60) + viewStartTime.value.hours
		const minutes = totalMinutes % 60

		// Handle overflow to next day
		if (hours >= 24) {
			hours = hours % 24
		}

		return new Time(hours, minutes)
	})

	const timeToSlotIndex = computed(() => (time: Time): number => {
		const start = viewStartTime.value.getInMinutes
		const m = time.getInMinutes
		const MINUTES_IN_DAY = 1440
		const diff = (m - start + MINUTES_IN_DAY) % MINUTES_IN_DAY
		return Math.floor(diff / timeSlotDuration.value)
	})

	// Computed
	const isDraggingAny = computed(() => draggingTaskId.value !== null)
	const isResizingAny = computed(() => resizingTaskId.value !== null)


	const selectedTasks = computed(() =>
		tasks.value.filter(e => selectedTaskIds.has(e.id))
	)

	const showActionBar = computed(() => selectedTaskIds.size > 0)

	const canCreate = computed(() => selectedTaskIds.size === 0)

	const isOverMidnight = computed(() => viewStartTime.value.hours > viewEndTime.value.hours)

	// CRUD handlers
	function openDeleteDialog(): void {
		if (selectedTaskIds.size > 0) {
			deleteDialog.value = true
		}
	}

	function openCreateDialog(): void {
		editedId.value = undefined
		dialog.value = true
	}

	function openEditDialog(): void {
		// Only open edit dialog if exactly one task is selected
		if (selectedTaskIds.size !== 1) return

		const selectedId = Array.from(selectedTaskIds)[0]
		const task = tasks.value.find(e => e.id === selectedId)
		if (!task) return

		editedId.value = task.id
		dialog.value = true
	}

	// Selection handlers
	function toggleTaskSelection(taskId: number): void {
		if (selectedTaskIds.has(taskId)) {
			selectedTaskIds.delete(taskId)
		} else {
			selectedTaskIds.add(taskId)
		}
	}

	function clearSelection(): void {
		selectedTaskIds.clear()
	}


	const {
		setGridPositionFromSpan,
		checkOverlapsBackground,
		checkConflict,
		updateIsDuringBackgroundFlags,
		initializeTaskGridPositions,
		redrawTask
	} = useDayPlannerCommon(viewStartTime, totalGridRows, tasks)

	function resetStore() {
		// Reset selection state
		selectedTaskIds.clear()

		// Reset dialog state
		dialog.value = false
		editedId.value = undefined
		creationPreview.value = undefined
		deleteDialog.value = false

		// Reset drag/resize state
		draggingTaskId.value = null
		resizingTaskId.value = null
		dragConflict.value = false
	}

	return {
		// Time/Grid configuration
		timeSlotDuration,
		viewStartTime,
		viewEndTime,

		// Time/Grid computed
		timeSlots,
		totalGridRows,
		slotIndexToTime,
		timeToSlotIndex,

		// State
		tasks,
		selectedTaskIds,
		dialog,
		editedId,
		creationPreview,
		deleteDialog,
		draggingTaskId,
		resizingTaskId,
		dragConflict,

		// Computed
		selectedTasks,
		showActionBar,
		canCreate,
		isOverMidnight,
		isDraggingAny,
		isResizingAny,

		// Actions
		openDeleteDialog,
		openCreateDialog,
		openEditDialog,
		toggleTaskSelection,
		clearSelection,
		resetStore,

		setGridPositionFromSpan,
		checkOverlapsBackground,
		checkConflict,
		updateIsDuringBackgroundFlags,
		initializeTaskGridPositions,
		redrawTask
	}
}
