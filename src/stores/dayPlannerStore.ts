import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { PlannerTask, PlannerTaskRequest } from '@/classes/PlannerTask.ts'
import { useTaskPlannerCrud } from '@/composables/ConcretesCrudComposable.ts'
import type { TaskSpanData } from '@/classes/types/DayPlannerTypes.ts'
import { Time } from '@/classes/TimeUtils.ts'
import { useMoment } from '@/scripts/momentHelper.ts'

export const useDayPlannerStore = defineStore('dayPlanner', () => {
	const { formatToTime24H } = useMoment()

	// Time/Grid configuration state
	const timeSlotDuration = ref(10)
	const viewedDate = ref(new Date())
	const viewStartTime = ref(new Time(7, 30))
	const viewEndTime = ref(new Time(1, 30))

	// Events state
	const events = ref<PlannerTask[]>([])

	// Focus state
	const focusedEventId = ref<number | null>(null)

	// Dialog state
	const dialog = ref(false)
	const editedId = ref<number | undefined>()
	const editingEvent = ref<PlannerTaskRequest>(new PlannerTaskRequest())
	const deleteDialog = ref(false)
	const toDeleteIndex = ref<number | null>(null)

	// Snackbar state
	const conflictSnackbar = ref(false)

	// Drag/Resize state (for EventBlock styling)
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

	const viewStartDate = computed(() => {
		const date = new Date(viewedDate.value)
		date.setHours(viewStartTime.value.hours, viewStartTime.value.minutes, 0, 0)
		return date
	})

	const viewEndDate = computed(() => {
		const date = new Date(viewedDate.value)

		const endHour = viewEndTime.value.hours
		const endMinute = viewEndTime.value.minutes

		if (endHour >= 24) {
			date.setDate(date.getDate() + Math.floor(endHour / 24))
			date.setHours(endHour % 24, endMinute, 0, 0)
		} else {
			date.setHours(endHour, endMinute, 0, 0)
		}
		return date
	})

	const slotIndexToTime = computed(() => (index: number): string => {
		const totalMinutes = index * timeSlotDuration.value + viewStartTime.value.minutes
		const hours = Math.floor(totalMinutes / 60) + viewStartTime.value.hours
		const minutes = totalMinutes % 60

		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
	})

	const dateTimeFromSlotIndex = computed(() => (slotIndex: number): Date => {
		const totalMinutes = slotIndex * timeSlotDuration.value + viewStartTime.value.minutes
		const hours = Math.floor(totalMinutes / 60) + viewStartTime.value.hours
		const minutes = totalMinutes % 60

		const date = new Date(viewedDate.value)

		if (hours >= 24) {
			date.setDate(date.getDate() + Math.floor(hours / 24))
			date.setHours(hours % 24, minutes, 0, 0)
		} else {
			date.setHours(hours, minutes, 0, 0)
		}

		return date
	})

	const datetimeToSlotIndex = computed(() => (time?: Date): number => {
		return timeToSlotIndex.value(formatToTime24H(time ?? new Date()))
	})

	const timeToSlotIndex = computed(() => (time: string): number => {
		const obj = Time.fromString(time)
		const totalMinutes = (obj.hours - viewStartTime.value.hours) * 60 + (obj.minutes - viewStartTime.value.minutes)
		return Math.floor(totalMinutes / 10)
	})

	// Computed
	const isDraggingAny = computed(() => draggingEventId.value !== null)
	const isResizingAny = computed(() => resizingEventId.value !== null)
	const visibleEvents = computed(() => {
		return events.value.filter(event => {
			return event.gridRowStart >= 1 &&
				event.gridRowEnd <= totalGridRows.value &&
				event.gridRowStart <= event.gridRowEnd
		})
	})

	const toDeleteEvent = computed(() =>
		toDeleteIndex.value !== null ? events.value[toDeleteIndex.value] : null
	)



	// Event handlers
	function handleFocusEvent(eventId: number | null): void {
		focusedEventId.value = eventId
	}



	function openCreateDialogPrefilled(start: Date, end: Date): void {
		editedId.value = undefined
		editingEvent.value = PlannerTaskRequest.fromSpan(start, end)
		dialog.value = true
	}

	function openCreateDialogEmpty(): void {
		editedId.value = undefined
		editingEvent.value = new PlannerTaskRequest()
		dialog.value = true
	}

	function openEditDialog(): void {
		const event = events.value.find(e => e.id === focusedEventId.value)
		if (!event) return

		editedId.value = event.id
		editingEvent.value = PlannerTaskRequest.fromEntity(event)
		dialog.value = true
	}



	function openDeleteDialog(): void {
		toDeleteIndex.value = events.value.findIndex(e => e.id === focusedEventId.value)
		deleteDialog.value = true
	}


	return {
		// Time/Grid configuration
		timeSlotDuration,
		viewedDate,
		viewStartTime,
		viewEndTime,

		// Time/Grid computed
		timeSlots,
		totalGridRows,
		viewStartDate,
		viewEndDate,
		slotIndexToTime,
		dateTimeFromSlotIndex,
		datetimeToSlotIndex,
		timeToSlotIndex,

		// State
		events,
		focusedEventId,
		dialog,
		editedId,
		editingEvent,
		deleteDialog,
		toDeleteIndex,
		conflictSnackbar,
		draggingEventId,
		resizingEventId,
		dragConflict,

		// Computed
		visibleEvents,
		toDeleteEvent,
		isDraggingAny,
		isResizingAny,

		// Actions
		handleFocusEvent,
		openCreateDialogPrefilled,
		openCreateDialogEmpty,
		openEditDialog,
		openDeleteDialog,
	}
})