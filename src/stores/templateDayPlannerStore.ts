import {defineStore} from 'pinia'
import {computed, ref} from 'vue'
import type {BasePlannerTaskRequest} from '@/dtos/request/request/BasePlannerTaskRequest.ts'
import {Time} from '@/utils/TimeUtils.ts';
import type {TemplatePlannerTask} from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts';

export const useTemplateDayPlannerStore = defineStore('templateDayPlanner', () => {
	// Time/Grid configuration state (templates use reference times, not dates)
	const timeSlotDuration = ref(10) // minutes
	const viewStartTime = ref(new Time(7, 30))
	const viewEndTime = ref(new Time(1, 30)) // Next day

	// Template metadata
	const currentTemplateId = ref<string | null>(null)
	const templateName = ref<string>('')

	// Events state (template tasks)
	const events = ref<(TemplatePlannerTask & { gridRowStart?: number; gridRowEnd?: number; isDuringBackgroundEvent?: boolean })[]>([])

	// Focus state
	const focusedEventId = ref<number | null>(null)

	// Dialog state
	const dialog = ref(false)
	const editedId = ref<number | undefined>()
	const editingEvent = ref<BasePlannerTaskRequest>({} as BasePlannerTaskRequest)
	const deleteDialog = ref(false)
	const toDeleteIndex = ref<number | null>(null)

	// Snackbar state
	const conflictSnackbar = ref(false)

	// Drag/Resize state
	const draggingEventId = ref<string | null>(null)
	const resizingEventId = ref<string | null>(null)
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

	const slotIndexToTime = computed(() => (index: number): string => {
		const totalMinutes = index * timeSlotDuration.value + viewStartTime.value.minutes
		const hours = Math.floor(totalMinutes / 60) + viewStartTime.value.hours
		const minutes = totalMinutes % 60

		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
	})

	const timeStringFromSlotIndex = computed(() => (slotIndex: number): string => {
		const totalMinutes = slotIndex * timeSlotDuration.value + viewStartTime.value.minutes
		let hours = Math.floor(totalMinutes / 60) + viewStartTime.value.hours
		const minutes = totalMinutes % 60

		// Handle overflow to next day
		if (hours >= 24) {
			hours = hours % 24
		}

		return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
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
			return event.gridRowStart && event.gridRowEnd &&
				event.gridRowStart >= 1 &&
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

	function openCreateDialogPrefilled(startTime: string, endTime: string): void {
		editedId.value = undefined
		editingEvent.value = {
			activityId: null,
			startTime,
			endTime,
			isBackground: false,
			isOptional: false
		} as BasePlannerTaskRequest
		dialog.value = true
	}

	function openCreateDialogEmpty(): void {
		editedId.value = undefined
		editingEvent.value = {
			activityId: null,
			startTime: '09:00',
			endTime: '10:00',
			isBackground: false,
			isOptional: false
		} as BasePlannerTaskRequest
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
		} as BasePlannerTaskRequest
		dialog.value = true
	}

	function openDeleteDialog(): void {
		toDeleteIndex.value = events.value.findIndex(e => e.id === focusedEventId.value)
		deleteDialog.value = true
	}

	return {
		// Time/Grid configuration
		timeSlotDuration,
		viewStartTime,
		viewEndTime,

		// Template metadata
		currentTemplateId,
		templateName,

		// Time/Grid computed
		timeSlots,
		totalGridRows,
		slotIndexToTime,
		timeStringFromSlotIndex,
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