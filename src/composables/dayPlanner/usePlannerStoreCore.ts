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

	// Selection state (for multi-select)
	const selectedEventIds = ref<Set<number>>(new Set())

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

	const selectedEvents = computed(() =>
		events.value.filter(e => selectedEventIds.value.has(e.id))
	)

	const hasSelectedEvents = computed(() => selectedEventIds.value.size > 0)

	// Event handlers
	function handleFocusEvent(eventId: number | null): void {
		focusedEventId.value = eventId
	}

	function openDeleteDialog(): void {
		toDeleteId.value = focusedEventId.value
		deleteDialog.value = true
	}

	function openDeleteDialogForSelected(): void {
		// For now, use the first selected event ID (we'll handle bulk delete later)
		if (selectedEventIds.value.size > 0) {
			toDeleteId.value = Array.from(selectedEventIds.value)[0] ?? null
			deleteDialog.value = true
		}
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
			isDone: event.isDone,
			location: event.location,
			notes: event.notes,
			priorityId: event.priority?.id
		} as TTaskRequest
		dialog.value = true
	}

	// Selection handlers
	function toggleEventSelection(eventId: number): void {
		if (selectedEventIds.value.has(eventId)) {
			selectedEventIds.value.delete(eventId)
		} else {
			selectedEventIds.value.add(eventId)
		}
		// Trigger reactivity
		selectedEventIds.value = new Set(selectedEventIds.value)
	}

	function clearSelection(): void {
		selectedEventIds.value = new Set()
	}

	function selectEvent(eventId: number): void {
		selectedEventIds.value.add(eventId)
		selectedEventIds.value = new Set(selectedEventIds.value)
	}

	function deselectEvent(eventId: number): void {
		selectedEventIds.value.delete(eventId)
		selectedEventIds.value = new Set(selectedEventIds.value)
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
		selectedEventIds,
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
		selectedEvents,
		hasSelectedEvents,
		isDraggingAny,
		isResizingAny,

		// Actions
		handleFocusEvent,
		openDeleteDialog,
		openDeleteDialogForSelected,
		openCreateDialogPrefilled,
		openCreateDialogEmpty,
		openEditDialog,
		toggleEventSelection,
		clearSelection,
		selectEvent,
		deselectEvent
	}
}
