import {computed, ref} from 'vue'
import {Time} from '@/utils/Time.ts'
import type {IBasePlannerTaskRequest} from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts'
import type {IBasePlannerTask} from '@/dtos/response/activityPlanning/IBasePlannerTask.ts';

export function usePlannerStoreCore<TTask extends IBasePlannerTask<TTaskRequest>, TTaskRequest extends IBasePlannerTaskRequest>(
	createEmptyRequest: () => TTaskRequest
) {
	// Time/Grid configuration state
	const timeSlotDuration = ref(10)
	const viewStartTime = ref(new Time(7, 30))
	const viewEndTime = ref(new Time(1, 30))

	// Events state
	const events = ref<TTask[]>([])

	// Focus state
	const focusedEventId = ref<number | null>(null)

	// Dialog state
	const dialog = ref(false)
	const editedId = ref<number | undefined>()
	const editingEvent = ref<TTaskRequest>({} as TTaskRequest)
	const deleteDialog = ref(false)
	const toDeleteId = ref<number | null>(null)

	// Snackbar state
	const conflictSnackbar = ref(false)

	// Drag/Resize state
	const draggingEventId = ref<number | null>(null)
	const resizingEventId = ref<number | null>(null)
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
	const isDraggingAny = computed(() => draggingEventId.value !== null)
	const isResizingAny = computed(() => resizingEventId.value !== null)

	const toDeleteEvent = computed(() =>
		events.value.find(e => e.id === toDeleteId.value) ?? null
	)

	// Event handlers
	function handleFocusEvent(eventId: number | null): void {
		focusedEventId.value = eventId
	}

	function openDeleteDialog(): void {
		toDeleteId.value = focusedEventId.value
		deleteDialog.value = true
	}

	function openCreateDialogPrefilled(startTime: Time, endTime: Time): void {
		editedId.value = undefined
		editingEvent.value = createEmptyRequest()
		editingEvent.value.startTime = startTime
		editingEvent.value.endTime = endTime
		dialog.value = true
	}

	function openCreateDialogEmpty(): void {
		editedId.value = undefined
		editingEvent.value = createEmptyRequest()
		dialog.value = true
	}

	function openEditDialog(): void {
		const event = events.value.find(e => e.id === focusedEventId.value)
		if (!event) return

		editedId.value = event.id
		editingEvent.value = {
			activityId: event.activity.id,
			startTime: event.startTime,
			endTime: event.endTime,
			isBackground: event.isBackground,
			isOptional: event.isOptional,
			location: event.location,
			notes: event.notes,
			priorityId: event.priority?.id
		} as TTaskRequest
		dialog.value = true
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
		events,
		focusedEventId,
		dialog,
		editedId,
		editingEvent,
		deleteDialog,
		toDeleteId,
		conflictSnackbar,
		draggingEventId,
		resizingEventId,
		dragConflict,

		// Computed
		toDeleteEvent,
		isDraggingAny,
		isResizingAny,

		// Actions
		handleFocusEvent,
		openDeleteDialog,
		openCreateDialogPrefilled,
		openCreateDialogEmpty,
		openEditDialog
	}
}
