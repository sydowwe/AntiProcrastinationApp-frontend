<template>
	<v-card class="w-100 d-flex flex-column">
		<v-card-title class="d-flex justify-space-between align-center">
			<span>Daily Schedule - {{ currentDateFormatted }}</span>
			<div class="d-flex gap-2">
				<v-chip size="small" variant="flat" color="primary">
					{{ currentTimeFormatted }}
				</v-chip>
				<v-btn
					color="primary"
					@click="openCreateDialog()"
					prepend-icon="mdi-plus"
				>
					Add New Event
				</v-btn>
			</div>
		</v-card-title>

		<v-card-text class="flex-fill d-flex flex-column gap-4">
			<div class="calendar-grid flex-fill">
				<!-- Time Column -->
				<div class="time-column">
					<div v-for="(slot, index) in timeSlots" :key="index"
					     :class="['time-slot', { 'half-hour': isHalfHour(slot), 'full-hour': isFullHour(slot) }]">
						<span v-if="isHalfHour(slot)" class="time-label">{{ formatTime(slot) }}</span>
					</div>
				</div>

				<!-- Events Column -->
				<div
					ref="eventsColumnRef"
					class="events-column"
					@mousedown="handleColumnMouseDown"
					@mousemove="handleColumnMouseMove"
					@mouseup="handleColumnMouseUp"
					@mouseleave="handleColumnMouseLeave"
				>
					<!-- Time Slots with hover effect -->
					<div v-for="(slot, index) in timeSlots" :key="index"
					     :class="['event-slot', {
					       'half-hour': isHalfHour(slot),
					       'full-hour': isFullHour(slot),
					       'hoverable': !isCreating && !draggingEventId
					     }]"
					     :data-slot-index="index">
					</div>

					<!-- Current Time Indicator -->
					<div
						v-if="showCurrentTimeIndicator"
						class="current-time-indicator"
						:style="currentTimeIndicatorStyle"
					>
						<div class="time-dot"></div>
						<div class="time-line"></div>
						<div class="time-label-current">{{ currentTimeFormatted }}</div>
					</div>

					<!-- Creation Preview -->
					<div
						v-if="isCreating && creationPreview"
						class="creation-preview"
						:style="creationPreviewStyle"
					>
						<span class="preview-time">{{ creationPreviewTime }}</span>
					</div>

					<!-- Event Blocks -->
					<div v-for="event in events"
					     :key="event.id"
					     :ref="(el) => setEventRef(event.id, el)"
					     :style="getEventStyle(event)"
					     :class="[
					       'event-block',
					       `category-${event.category || 'default'}`,
					       {
					         'dragging': draggingEventId === event.id,
					         'past-event': isEventPast(event),
					         'focused': focusedEventId === event.id,
					         'conflict': dragConflict && draggingEventId === event.id
					       }
					     ]"
					     :data-event-id="event.id"
					     :tabindex="0"
					     @click="openEditDialog(event)"
					     @keydown.enter="openEditDialog(event)"
					     @focus="focusedEventId = event.id"
					     @blur="focusedEventId = null">

						<!-- Tooltip for event details -->
						<v-tooltip
							:text="`${event.title}\n${formatEventTime(event)}`"
							location="top"
						>
							<template v-slot:activator="{ props }">
								<div class="event-content" v-bind="props">
									<div class="event-title">{{ event.title }}</div>
									<div class="event-time">{{ formatEventTime(event) }}</div>
									<v-chip
										v-if="event.category"
										size="x-small"
										variant="flat"
										class="event-category-chip"
									>
										{{ event.category }}
									</v-chip>
								</div>
							</template>
						</v-tooltip>

						<!-- Resize Handle -->
						<div
							:ref="(el) => setResizeRef(event.id, el)"
							class="resize-handle"
							:data-event-id="event.id"
							@click.stop
						>
							<v-icon size="x-small" color="white">mdi-dots-horizontal</v-icon>
						</div>
					</div>
				</div>
			</div>

			<!-- Legend -->
			<div class="calendar-legend mt-4">
				<v-chip
					v-for="category in categories"
					:key="category.value"
					size="small"
					:color="category.color"
					variant="flat"
					class="mr-2"
				>
					{{ category.label }}
				</v-chip>
			</div>
		</v-card-text>
	</v-card>

	<!-- Event Dialog -->
	<v-dialog v-model="dialog" max-width="500px">
		<v-card>
			<v-card-title>
				{{ dialogMode === 'create' ? 'Add New Event' : 'Edit Event' }}
			</v-card-title>

			<v-card-text>
				<v-container>
					<v-row>
						<v-col cols="12">
							<v-text-field
								v-model="editingEvent.title"
								label="Event Title"
								variant="outlined"
								density="comfortable"
								:rules="[v => !!v || 'Title is required']"
							></v-text-field>
						</v-col>

						<v-col cols="12">
							<v-select
								v-model="editingEvent.category"
								label="Category"
								:items="categories"
								item-title="label"
								item-value="value"
								variant="outlined"
								density="comfortable"
							></v-select>
						</v-col>

						<v-col cols="12" sm="6">
							<v-text-field
								v-model="editingEvent.startTime"
								label="Start Time"
								type="time"
								variant="outlined"
								density="comfortable"
								:readonly="dialogMode === 'edit'"
							></v-text-field>
						</v-col>

						<v-col cols="12" sm="6">
							<v-text-field
								v-model="editingEvent.endTime"
								label="End Time"
								type="time"
								variant="outlined"
								density="comfortable"
								:readonly="dialogMode === 'edit'"
								:rules="[validateEndTime]"
							></v-text-field>
						</v-col>
					</v-row>
				</v-container>
			</v-card-text>

			<v-card-actions>
				<v-btn
					v-if="dialogMode === 'edit'"
					color="error"
					variant="text"
					@click="deleteEvent"
				>
					Delete
				</v-btn>
				<v-spacer></v-spacer>
				<v-btn
					variant="text"
					@click="dialog = false"
				>
					Cancel
				</v-btn>
				<v-btn
					color="primary"
					variant="flat"
					@click="saveEvent"
					:disabled="!isFormValid"
				>
					Save
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>

	<!-- Conflict Snackbar -->
	<v-snackbar
		v-model="conflictSnackbar"
		color="error"
		:timeout="3000"
	>
		Event conflicts with existing schedule!
		<template v-slot:actions>
			<v-btn
				variant="text"
				@click="conflictSnackbar = false"
			>
				Close
			</v-btn>
		</template>
	</v-snackbar>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, onUnmounted, nextTick} from 'vue'
import {
	draggable,
	dropTargetForElements,
	monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import type {CleanupFn} from '@atlaskit/pragmatic-drag-and-drop/types';

// Type definitions
interface TimeSlot {
	hour: number
	minute: number
}

interface Category {
	label: string
	value: string
	color: string
}

interface Event {
	id: number
	title: string
	start: string
	end: string
	category?: string
}

interface EditingEvent {
	id: number | null
	title: string
	startTime: string
	endTime: string
	category: string
}

interface CreationPreview {
	startRow: number
	endRow: number
}

interface PrefillTimes {
	startTime: string
	endTime: string
}

// Constants
const calendarStartHour = 8
const calendarEndHour = 18
const currentDate = new Date('2025-09-22')

// Categories for events
const categories: Category[] = [
	{label: 'Work', value: 'work', color: 'blue'},
	{label: 'Personal', value: 'personal', color: 'green'},
	{label: 'Urgent', value: 'urgent', color: 'red'},
	{label: 'Meeting', value: 'meeting', color: 'purple'},
	{label: 'Break', value: 'break', color: 'orange'}
]

// Sample events data with categories
const events = ref([
	{
		id: 1,
		title: 'Team Sync',
		start: '2025-09-22T09:10:00',
		end: '2025-09-22T09:50:00',
		category: 'meeting'
	},
	{
		id: 2,
		title: 'Design Review',
		start: '2025-09-22T10:30:00',
		end: '2025-09-22T11:20:00',
		category: 'work'
	},
	{
		id: 3,
		title: 'Lunch Break',
		start: '2025-09-22T12:00:00',
		end: '2025-09-22T13:00:00',
		category: 'break'
	},
	{
		id: 4,
		title: 'Client Call',
		start: '2025-09-22T14:20:00',
		end: '2025-09-22T15:00:00',
		category: 'urgent'
	},
	{
		id: 5,
		title: 'Code Review',
		start: '2025-09-22T15:30:00',
		end: '2025-09-22T16:10:00',
		category: 'work'
	}
])

// Refs
const eventsColumnRef = ref<HTMLElement | null>(null)
const eventRefs = ref<Record<number, HTMLElement | null>>({})
const resizeRefs = ref<Record<number, HTMLElement | null>>({})

// Current time state
const currentTime = ref(new Date())
const currentTimeInterval = ref<ReturnType<typeof setInterval> | null>(null)

// Dialog state
const dialog = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const editingEvent = ref<EditingEvent>({
	id: null,
	title: '',
	startTime: '',
	endTime: '',
	category: 'work'
})

// Drag state
const draggingEventId = ref<number | null>(null)
const isResizing = ref(false)
const dragConflict = ref(false)
const originalEventState = ref<Event | null>(null)
const focusedEventId = ref<number | null>(null)

// Creation state
const isCreating = ref(false)
const creationStart = ref<number | null>(null)
const creationEnd = ref<number | null>(null)
const creationPreview = ref<CreationPreview | null>(null)

// Snackbar state
const conflictSnackbar = ref(false)

// Cleanup functions for drag and drop
const cleanupFunctions = ref<CleanupFn[]>([])

// Template ref setters
const setEventRef = (id: number, el: any) => {
	if (el) {
		eventRefs.value[id] = el as HTMLElement
	}
}

const setResizeRef = (id: number, el: any) => {
	if (el) {
		resizeRefs.value[id] = el as HTMLElement
	}
}

// Computed properties
const currentDateFormatted = computed(() => {
	return currentDate.toLocaleDateString('en-US', {
		weekday: 'long',
		year: 'numeric',
		month: 'long',
		day: 'numeric'
	})
})

const currentTimeFormatted = computed(() => {
	return currentTime.value.toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	})
})

const showCurrentTimeIndicator = computed(() => {
	const hours = currentTime.value.getHours()
	return hours >= calendarStartHour && hours < calendarEndHour
})

const currentTimeIndicatorStyle = computed(() => {
	const hours = currentTime.value.getHours()
	const minutes = currentTime.value.getMinutes()

	if (!showCurrentTimeIndicator.value) return {}

	const totalMinutes = (hours - calendarStartHour) * 60 + minutes
	const slotIndex = totalMinutes / 10
	const gridRow = slotIndex + 1

	return {
		gridRow: `${gridRow} / ${gridRow}`
	}
})

// Generate time slots for the calendar
const timeSlots = computed<TimeSlot[]>(() => {
	const slots: TimeSlot[] = []
	for (let hour = calendarStartHour; hour < calendarEndHour; hour++) {
		for (let minute = 0; minute < 60; minute += 10) {
			slots.push({hour, minute})
		}
	}
	return slots
})

// Creation preview style
const creationPreviewStyle = computed(() => {
	if (!creationPreview.value) return {}

	const startRow = creationPreview.value.startRow
	const endRow = creationPreview.value.endRow
	const span = Math.max(1, endRow - startRow + 1)

	return {
		gridRow: `${startRow} / span ${span}`
	}
})

// Creation preview time
const creationPreviewTime = computed(() => {
	if (!creationPreview.value) return ''

	const startTime = slotIndexToTime(creationPreview.value.startRow - 1)
	const endTime = slotIndexToTime(creationPreview.value.endRow)

	return `${startTime} - ${endTime}`
})

// Form validation
const isFormValid = computed(() => {
	return editingEvent.value.title &&
		editingEvent.value.startTime &&
		editingEvent.value.endTime &&
		editingEvent.value.startTime < editingEvent.value.endTime
})

// Helper functions
const isHalfHour = (slot: TimeSlot): boolean => {
	return slot.minute === 0 || slot.minute === 30
}

const isFullHour = (slot: TimeSlot): boolean => {
	return slot.minute === 0
}

const formatTime = (slot: TimeSlot): string => {
	const hour = slot.hour.toString().padStart(2, '0')
	const minute = slot.minute.toString().padStart(2, '0')
	return `${hour}:${minute}`
}

const formatEventTime = (event: Event): string => {
	const startTime = new Date(event.start).toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: true
	})
	const endTime = new Date(event.end).toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: true
	})
	return `${startTime} - ${endTime}`
}

const isEventPast = (event: Event): boolean => {
	const endDate = new Date(event.end)
	// For demo purposes, using a fixed "current" time
	const demoCurrentTime = new Date('2025-09-22T14:00:00')
	return endDate < demoCurrentTime
}

const getEventStyle = (event: Event) => {
	const startDate = new Date(event.start)
	const endDate = new Date(event.end)

	const startHour = startDate.getHours()
	const startMinute = startDate.getMinutes()
	const endHour = endDate.getHours()
	const endMinute = endDate.getMinutes()

	// Calculate start row (grid line)
	const startTotalMinutes = (startHour - calendarStartHour) * 60 + startMinute
	const startRow = Math.floor(startTotalMinutes / 10) + 1

	// Calculate end row (grid line)
	const endTotalMinutes = (endHour - calendarStartHour) * 60 + endMinute
	const endRow = Math.ceil(endTotalMinutes / 10) + 1

	// Calculate span
	const span = endRow - startRow

	return {
		gridRow: `${startRow} / span ${span}`
	}
}

// Check for event conflicts
const checkEventConflict = (eventId: number, newStart: string, newEnd: string): boolean => {
	return events.value.some(event => {
		if (event.id === eventId) return false

		const existingStart = new Date(event.start)
		const existingEnd = new Date(event.end)
		const checkStart = new Date(newStart)
		const checkEnd = new Date(newEnd)

		// Check if there's any overlap
		return (checkStart < existingEnd && checkEnd > existingStart)
	})
}

// Convert slot index to time string
const slotIndexToTime = (index: number): string => {
	const totalMinutes = index * 10
	const hours = Math.floor(totalMinutes / 60) + calendarStartHour
	const minutes = totalMinutes % 60

	return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

// Convert position to slot index
const getSlotIndexFromPosition = (y: number): number => {
	if (!eventsColumnRef.value) return 0

	const rect = eventsColumnRef.value.getBoundingClientRect()
	const relativeY = y - rect.top
	const slotHeight = rect.height / timeSlots.value.length

	return Math.max(0, Math.min(timeSlots.value.length - 1, Math.floor(relativeY / slotHeight)))
}

// Calculate new time based on slot index
const calculateTimeFromSlotIndex = (slotIndex: number): string => {
	const totalMinutes = slotIndex * 10
	const hours = Math.floor(totalMinutes / 60) + calendarStartHour
	const minutes = totalMinutes % 60
	const today = '2025-09-22'

	return `${today}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
}

// Validate end time
const validateEndTime = (value: string): string | boolean => {
	if (!value) return 'End time is required'
	if (editingEvent.value.startTime && value <= editingEvent.value.startTime) {
		return 'End time must be after start time'
	}
	return true
}

// Dialog functions
const openCreateDialog = (prefillTimes: PrefillTimes | null = null): void => {
	dialogMode.value = 'create'
	editingEvent.value = {
		id: null,
		title: '',
		startTime: prefillTimes?.startTime || '',
		endTime: prefillTimes?.endTime || '',
		category: 'work'
	}
	dialog.value = true
}

const openEditDialog = (event: Event): void => {
	// Don't open dialog if dragging
	if (draggingEventId.value) return

	dialogMode.value = 'edit'
	const startDate = new Date(event.start)
	const endDate = new Date(event.end)

	editingEvent.value = {
		id: event.id,
		title: event.title,
		startTime: startDate.toTimeString().slice(0, 5),
		endTime: endDate.toTimeString().slice(0, 5),
		category: event.category || 'work'
	}
	dialog.value = true
}

const saveEvent = (): void => {
	if (!isFormValid.value) return

	if (dialogMode.value === 'create') {
		// Create new event
		const newId = events.value.length > 0 ? Math.max(...events.value.map(e => e.id)) + 1 : 1
		const today = '2025-09-22'

		const newEvent: Event = {
			id: newId,
			title: editingEvent.value.title || 'New Event',
			start: `${today}T${editingEvent.value.startTime}:00`,
			end: `${today}T${editingEvent.value.endTime}:00`,
			category: editingEvent.value.category
		}

		// Check for conflicts before adding
		if (checkEventConflict(newId, newEvent.start, newEvent.end)) {
			conflictSnackbar.value = true
			return
		}

		events.value.push(newEvent)

		// Register drag and drop for the new event after DOM update
		nextTick(() => {
			setupDragAndDropForEvent(newId)
		})
	} else {
		// Edit existing event
		const eventIndex = events.value.findIndex(e => e.id === editingEvent.value.id)
		if (eventIndex !== -1) {
			events.value[eventIndex].title = editingEvent.value.title
			events.value[eventIndex].category = editingEvent.value.category
		}
	}

	dialog.value = false
}

const deleteEvent = (): void => {
	if (editingEvent.value.id) {
		const index = events.value.findIndex(e => e.id === editingEvent.value.id)
		if (index !== -1) {
			events.value.splice(index, 1)
		}
	}
	dialog.value = false
}

// Click and drag to create new events
const handleColumnMouseDown = (e: MouseEvent): void => {
	// Only start creating if clicking on empty space (not on an event)
	const target = e.target as HTMLElement
	if (target.closest('.event-block')) return
	if (target.closest('.current-time-indicator')) return

	const slotIndex = getSlotIndexFromPosition(e.clientY)
	isCreating.value = true
	creationStart.value = slotIndex
	creationEnd.value = slotIndex

	creationPreview.value = {
		startRow: slotIndex + 1,
		endRow: slotIndex + 1
	}

	e.preventDefault()
}

const handleColumnMouseMove = (e: MouseEvent): void => {
	if (!isCreating.value || creationStart.value === null) return

	const slotIndex = getSlotIndexFromPosition(e.clientY)
	creationEnd.value = slotIndex

	const startRow = Math.min(creationStart.value, creationEnd.value) + 1
	const endRow = Math.max(creationStart.value, creationEnd.value) + 1

	creationPreview.value = {
		startRow,
		endRow
	}
}

const handleColumnMouseUp = (_e: MouseEvent): void => {
	if (!isCreating.value || creationStart.value === null || creationEnd.value === null) return

	const startSlot = Math.min(creationStart.value, creationEnd.value)
	const endSlot = Math.max(creationStart.value, creationEnd.value)

	// Open dialog with pre-filled times
	const startTime = slotIndexToTime(startSlot)
	const endTime = slotIndexToTime(endSlot + 1)

	openCreateDialog({
		startTime,
		endTime
	})

	// Reset creation state
	isCreating.value = false
	creationStart.value = null
	creationEnd.value = null
	creationPreview.value = null
}

const handleColumnMouseLeave = (): void => {
	if (isCreating.value) {
		// Cancel creation if mouse leaves the column
		isCreating.value = false
		creationStart.value = null
		creationEnd.value = null
		creationPreview.value = null
	}
}

// Setup drag and drop for a specific event
const setupDragAndDropForEvent = (eventId: number): void => {
	const eventEl = eventRefs.value[eventId]
	const resizeEl = resizeRefs.value[eventId]

	if (!eventEl) return

	// Make event block draggable for rescheduling
	const eventCleanup = draggable({
		element: eventEl,
		getInitialData: () => {
			const event = events.value.find(e => e.id === eventId)
			if (!event) return {}

			// Store original state for rollback
			originalEventState.value = {...event}

			const duration = (new Date(event.end).getTime() - new Date(event.start).getTime()) / (1000 * 60) // duration in minutes

			return {
				type: 'event-move',
				eventId: eventId,
				duration: duration
			}
		},
		onDragStart: () => {
			draggingEventId.value = eventId
			dragConflict.value = false
		},
		onDrop: () => {
			// If there's a conflict, rollback
			if (dragConflict.value && originalEventState.value) {
				const event = events.value.find(e => e.id === eventId)
				if (event) {
					event.start = originalEventState.value.start
					event.end = originalEventState.value.end
					conflictSnackbar.value = true
				}
			}

			draggingEventId.value = null
			dragConflict.value = false
			originalEventState.value = null
		}
	})

	// Make resize handle draggable for resizing
	if (resizeEl) {
		const resizeCleanup = draggable({
			element: resizeEl,
			getInitialData: () => {
				const event = events.value.find(e => e.id === eventId)
				if (!event) return {}

				// Store original state for rollback
				originalEventState.value = {...event}

				return {
					type: 'event-resize',
					eventId: eventId,
					startTime: event.start
				}
			},
			onDragStart: () => {
				isResizing.value = true
				draggingEventId.value = eventId
				dragConflict.value = false
			},
			onDrop: () => {
				// If there's a conflict, rollback
				if (dragConflict.value && originalEventState.value) {
					const event = events.value.find(e => e.id === eventId)
					if (event) {
						event.end = originalEventState.value.end
						conflictSnackbar.value = true
					}
				}

				isResizing.value = false
				draggingEventId.value = null
				dragConflict.value = false
				originalEventState.value = null
			}
		})

		cleanupFunctions.value.push(resizeCleanup)
	}

	cleanupFunctions.value.push(eventCleanup)
}

// Setup drag and drop
const setupDragAndDrop = (): void => {
	if (!eventsColumnRef.value) return

	// Register events column as drop target
	const dropCleanup = dropTargetForElements({
		element: eventsColumnRef.value,
		getData: ({input, element}) => {
			const slotIndex = getSlotIndexFromPosition(input.clientY)

			return {
				slotIndex
			}
		},
		canDrop: ({source}) => {
			const sourceData = source.data as any
			return sourceData.type === 'event-move' || sourceData.type === 'event-resize'
		},
		onDrag: ({source, location}) => {
			const sourceData = source.data as any
			const dropTarget = location.current.dropTargets[0]
			if (!dropTarget) return

			const dropData = dropTarget.data as any
			const slotIndex = dropData.slotIndex
			const eventId = sourceData.eventId as number
			const event = events.value.find(e => e.id === eventId)

			if (!event) return

			let newStart: string, newEnd: string

			if (sourceData.type === 'event-move') {
				const duration = sourceData.duration as number
				newStart = calculateTimeFromSlotIndex(slotIndex)
				const newStartDate = new Date(newStart)
				const newEndDate = new Date(newStartDate.getTime() + duration * 60 * 1000)
				newEnd = newEndDate.toISOString().replace('.000Z', '').replace('Z', '')
			} else if (sourceData.type === 'event-resize') {
				const startDate = new Date(event.start)
				const startSlotIndex = ((startDate.getHours() - calendarStartHour) * 60 + startDate.getMinutes()) / 10
				const endSlotIndex = Math.max(startSlotIndex + 1, slotIndex + 1)
				newStart = event.start
				newEnd = calculateTimeFromSlotIndex(endSlotIndex)
			} else {
				return
			}

			// Check for conflicts
			dragConflict.value = checkEventConflict(eventId, newStart, newEnd)
		}
	})

	// Monitor for drop events
	const monitorCleanup = monitorForElements({
		onDrop: ({source, location}) => {
			const sourceData = source.data as any
			const dropTarget = location.current.dropTargets[0]
			if (!dropTarget) return

			const dropData = dropTarget.data as any
			const slotIndex = dropData.slotIndex

			if (sourceData.type === 'event-move') {
				// Handle event rescheduling
				const eventId = sourceData.eventId as number
				const duration = sourceData.duration as number
				const event = events.value.find(e => e.id === eventId)

				if (event) {
					const newStart = calculateTimeFromSlotIndex(slotIndex)
					const newStartDate = new Date(newStart)
					const newEndDate = new Date(newStartDate.getTime() + duration * 60 * 1000)
					const newEnd = newEndDate.toISOString().replace('.000Z', '').replace('Z', '')

					// Only update if no conflict
					if (!checkEventConflict(eventId, newStart, newEnd)) {
						event.start = newStart
						event.end = newEnd
					}
				}
			} else if (sourceData.type === 'event-resize') {
				// Handle event resizing
				const eventId = source.data.eventId
				const event = events.value.find(e => e.id === eventId)

				if (event) {
					const startDate = new Date(event.start)
					const startSlotIndex = ((startDate.getHours() - calendarStartHour) * 60 + startDate.getMinutes()) / 10

					// Calculate new end time based on drop position
					const endSlotIndex = Math.max(startSlotIndex + 1, slotIndex + 1)
					const newEnd = calculateTimeFromSlotIndex(endSlotIndex)

					// Only update if no conflict
					if (!checkEventConflict(eventId, event.start, newEnd)) {
						event.end = newEnd
					}
				}
			}
		}
	})

	cleanupFunctions.value.push(dropCleanup, monitorCleanup)

	// Setup drag and drop for all existing events
	events.value.forEach(event => {
		setupDragAndDropForEvent(event.id)
	})
}

// Update current time every minute
const updateCurrentTime = () => {
	currentTime.value = new Date()
}

// Lifecycle hooks
onMounted(() => {
	// Setup drag and drop
	nextTick(() => {
		setupDragAndDrop()
	})

	// Update current time every minute
	updateCurrentTime()
	currentTimeInterval.value = setInterval(updateCurrentTime, 60000)
})

onUnmounted(() => {
	// Cleanup all drag and drop listeners
	cleanupFunctions.value.forEach(cleanup => cleanup())

	// Clear interval
	if (currentTimeInterval.value) {
		clearInterval(currentTimeInterval.value)
	}
})
</script>

<style scoped>
.calendar-grid {
	display: grid;
	grid-template-columns: 80px 1fr;
	gap: 0;
	height: 600px;
	overflow-y: auto;
	border: 1px solid #e0e0e0;
	background: white;
	position: relative;
}

.time-column {
	display: grid;
	grid-template-rows: repeat(60, 20px);
	background: #f5f5f5;
	border-right: 1px solid #e0e0e0;
}

.events-column {
	display: grid;
	grid-template-rows: repeat(60, 20px);
	position: relative;
	background: white;
	user-select: none;
	cursor: crosshair;
}

.time-slot {
	display: flex;
	align-items: center;
	justify-content: flex-end;
	padding-right: 8px;
	font-size: 12px;
	color: #666;
	position: relative;
}

.time-slot.half-hour {
	border-top: 1px solid #e0e0e0;
}

.time-slot.full-hour {
	border-top: 1px solid #d0d0d0;
}

.event-slot {
	border-top: 1px dotted #f0f0f0;
	position: relative;
	transition: background-color 0.2s ease;
}

.event-slot.half-hour {
	border-top: 1px solid #e0e0e0;
}

.event-slot.full-hour {
	border-top: 1px solid #d0d0d0;
}

.event-slot.hoverable:hover {
	background-color: rgba(0, 0, 0, 0.02);
	cursor: cell;
}

.time-label {
	font-weight: 500;
}

/* Current Time Indicator */
.current-time-indicator {
	position: absolute;
	left: 0;
	right: 0;
	display: flex;
	align-items: center;
	pointer-events: none;
	z-index: 15;
}

.time-dot {
	width: 12px;
	height: 12px;
	background-color: #f44336;
	border-radius: 50%;
	position: absolute;
	left: -6px;
	box-shadow: 0 2px 4px rgba(244, 67, 54, 0.3);
}

.time-line {
	height: 2px;
	background-color: #f44336;
	flex: 1;
	margin-left: 6px;
	box-shadow: 0 1px 2px rgba(244, 67, 54, 0.2);
}

.time-label-current {
	position: absolute;
	right: 8px;
	background: #f44336;
	color: white;
	padding: 2px 6px;
	border-radius: 3px;
	font-size: 10px;
	font-weight: 600;
}

/* Event Block Styles */
.event-block {
	position: absolute;
	left: 4px;
	right: 4px;
	color: white;
	border-radius: 6px;
	cursor: move;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	transition: all 0.2s ease;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	z-index: 10;
	user-select: none;
	min-height: 20px;
	border: 2px solid transparent;
}

.event-block:focus {
	outline: none;
}

.event-block.focused {
	border: 2px solid #1976d2;
	box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.2);
}

.event-block.dragging {
	opacity: 0.5;
	z-index: 100;
}

.event-block.conflict {
	background: #f44336 !important;
	animation: pulse 0.5s ease-in-out infinite;
}

@keyframes pulse {
	0%, 100% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.02);
	}
}

.event-block:hover {
	transform: translateY(-1px);
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	z-index: 11;
}

.event-block.past-event {
	opacity: 0.6;
	filter: grayscale(30%);
}

.event-block.past-event:hover {
	opacity: 0.8;
}

.event-content {
	flex: 1;
	padding: 6px 8px;
	cursor: pointer;
	min-height: 0;
	display: flex;
	flex-direction: column;
	gap: 2px;
}

.event-title {
	font-weight: 500;
	font-size: 13px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	line-height: 1.2;
}

.event-time {
	font-size: 11px;
	opacity: 0.9;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.event-category-chip {
	margin-top: 2px;
	background: rgba(255, 255, 255, 0.2) !important;
	color: white !important;
}

.resize-handle {
	height: 16px;
	background: rgba(0, 0, 0, 0.2);
	cursor: ns-resize;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background 0.2s ease;
	flex-shrink: 0;
}

.resize-handle:hover {
	background: rgba(0, 0, 0, 0.3);
}

.creation-preview {
	position: absolute;
	left: 4px;
	right: 4px;
	background: rgba(66, 153, 225, 0.2);
	border: 2px dashed #4299e1;
	border-radius: 6px;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 5;
	pointer-events: none;
	min-height: 20px;
}

.preview-time {
	font-size: 12px;
	font-weight: 500;
	color: #2c5282;
	background: white;
	padding: 2px 8px;
	border-radius: 4px;
}

/* Category-based colors */
.category-default {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.category-work {
	background: linear-gradient(135deg, #2196F3 0%, #1976D2 100%);
}

.category-personal {
	background: linear-gradient(135deg, #4CAF50 0%, #388E3C 100%);
}

.category-urgent {
	background: linear-gradient(135deg, #f44336 0%, #c62828 100%);
}

.category-meeting {
	background: linear-gradient(135deg, #9C27B0 0%, #7B1FA2 100%);
}

.category-break {
	background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%);
}

/* Calendar Legend */
.calendar-legend {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	padding: 8px;
	background: #f5f5f5;
	border-radius: 4px;
}

/* Scrollbar styling */
.calendar-grid::-webkit-scrollbar {
	width: 8px;
	height: 8px;
}

.calendar-grid::-webkit-scrollbar-track {
	background: #f1f1f1;
}

.calendar-grid::-webkit-scrollbar-thumb {
	background: #888;
	border-radius: 4px;
}

.calendar-grid::-webkit-scrollbar-thumb:hover {
	background: #555;
}

/* Responsive adjustments */
@media (max-width: 600px) {
	.calendar-grid {
		height: 500px;
	}

	.time-column {
		grid-template-columns: 60px;
	}

	.event-title {
		font-size: 12px;
	}

	.event-time {
		font-size: 10px;
	}
}

/* Accessibility improvements */
.event-block:focus-visible {
	outline: 3px solid #1976d2;
	outline-offset: 2px;
}

/* Tooltip styling override */
:deep(.v-tooltip > .v-overlay__content) {
	white-space: pre-line;
}

/* Animation for new events */
@keyframes slideIn {
	from {
		opacity: 0;
		transform: translateX(-10px);
	}
	to {
		opacity: 1;
		transform: translateX(0);
	}
}

.event-block {
	animation: slideIn 0.3s ease-out;
}

/* Gap hint for better UX */
.gap-2 {
	gap: 8px;
}
</style>