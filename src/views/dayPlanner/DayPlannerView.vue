<template>
<v-card class="w-100 d-flex flex-column">
	<v-card-title class="d-flex justify-space-between align-center flex-wrap ga-2">
		<span>Daily Schedule - {{ currentDateFormatted }}</span>
		<div class="d-flex gap-2 align-center">
			<v-menu :close-on-content-click="false">
				<template v-slot:activator="{ props }">
					<v-btn
						v-bind="props"
						variant="outlined"
						prepend-icon="clock"
					>
						Start: {{ startTimeString.toString().padStart(2, '0') }}
					</v-btn>
				</template>
				<template v-slot:default>
					<v-time-picker
						v-model="startTimeString"
						format="24hr"
						:allowed-minutes="allowedStep"
						scrollable
					></v-time-picker>
				</template>
			</v-menu>

			<VNumberInput
				v-model.number="spanHours"
				label="Span (hours)"
				control-variant="split"
				:min="1"
				:max="24"
				style="width: 150px"
				hideDetails
			></VNumberInput>
		</div>
		<div class="d-flex gap-2 align-center flex-wrap">
			<v-chip size="small" variant="flat" color="primary">
				{{ currentTimeFormatted }}
			</v-chip>
			<v-btn
				color="primary"
				@click="openCreateDialog()"
				prepend-icon="plus"
			>
				Add New Event
			</v-btn>
		</div>
	</v-card-title>

	<v-card-text class="flex-fill d-flex flex-column gap-4">
		<div class="calendar-grid flex-fill">
			<!-- Time Column -->
			<div class="time-column" :style="{ gridTemplateRows: `repeat(${totalGridRows}, 22px)` }">
				<div v-for="(slot, index) in timeSlots" :key="index"
				     :class="['time-slot', { 'half-hour': isHalfHour(slot), 'full-hour': isFullHour(slot) }]">
				</div>
				<!-- Midnight divider -->
				<div
					v-if="midnightSlotIndex !== null"
					class="midnight-divider"
					:style="{ top: `${midnightSlotIndex * 22}px` }"
				>
					<span class="midnight-label">MIDNIGHT</span>
				</div>
				<!-- Time labels overlay -->
				<div class="time-labels-overlay">
					<div v-for="(slot, index) in timeSlots" :key="index"
					     :class="['time-label-positioned', { 'half-hour-label': isHalfHour(slot) }]"
					     :style="{ top: `${index * 22}px` }">
						{{ formatTime(slot) }}
					</div>
				</div>
			</div>

			<!-- Events Column -->
			<div
				ref="eventsColumnRef"
				class="events-column"
				:style="{ gridTemplateRows: `repeat(${totalGridRows}, 22px)` }"
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

				<!-- Midnight divider -->
				<div
					v-if="midnightSlotIndex !== null"
					class="midnight-divider-events"
					:style="{ top: `${midnightSlotIndex * 22}px` }"
				></div>

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
				<!-- Event Blocks -->
				<div v-for="event in visibleEvents"
				     :key="event.id"
				     :style="{
				       gridRow: `${event.gridRowStart} / span ${(event.gridRowEnd || 1) - (event.gridRowStart || 1) + 1}`
				     }"
				     :class="[
					       'event-block',
					       `category-${event.category || 'default'}`,
					       {
							    'dragging': draggingEventId === event.id,
							    'resizing': event.id === draggingEventId,
							    'past-event': isEventPast(event),
							    'focused': focusedEventId === event.id,
							    'conflict': dragConflict && draggingEventId === event.id,
							    'no-hover': isAnyEventBeingManipulated
						  }
					     ]"
				     :data-event-id="event.id"
				     :tabindex="0"
				     @click="openEditDialog(event)"
				     @keydown.enter="openEditDialog(event)"
				     @focus="focusedEventId = event.id"
				     @blur="focusedEventId = null">

					<div
						class="resize-handle resize-handle-top"
						:data-event-id="event.id"
						@click.stop
					>
<!--						<v-icon size="x-small" color="white" opacity="0.5">arrows-up-down</v-icon>-->
					</div>
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
						class="resize-handle resize-handle-bottom"
						:data-event-id="event.id"
						@click.stop
					>
<!--						<v-icon size="x-small" color="white" opacity="0.5">arrows-up-down</v-icon>-->
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
import {ref, computed, onMounted, onUnmounted, nextTick, watch} from 'vue'
import {
	draggable,
	dropTargetForElements,
	monitorForElements,
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'
import type {CleanupFn} from '@atlaskit/pragmatic-drag-and-drop/types';
import type {Category, CreationPreview, DayEvent, EditingEvent, PrefillTimes, TimeSlot} from '@/classes/types/DayPlannerTypes.ts';


// Constants
const currentDate = new Date()

// Time range state
const startTimeString = ref('7:00')
const startTime = computed(() => {
	const [hours, minutes] = startTimeString.value.split(':').map(Number)
	return {hours: hours ?? 0, minutes: minutes ?? 0}
})
const allowedStep = (m: number) => m % 10 === 0
const spanHours = ref(24)

const calendarEndHour = computed(() => startTime.value.hours + spanHours.value)

// Calculate total number of grid rows (slots)
const totalGridRows = computed(() => spanHours.value * 6) // 6 slots per hour (10 min each)

// Detect which slot index represents midnight (00:00)
const midnightSlotIndex = computed(() => {
	if (startTime.value.hours === 0) return null // Already starts at midnight

	const hoursUntilMidnight = 24 - startTime.value.hours
	if (hoursUntilMidnight >= spanHours.value) return null // Doesn't reach midnight

	// Calculate slot index for midnight
	const minutesUntilMidnight = hoursUntilMidnight * 60 - startTime.value.minutes
	return Math.floor(minutesUntilMidnight / 10)
})

const isAnyEventBeingManipulated = computed(() => {
	return draggingEventId.value !== null || resizingEventId.value !== null
})

// Categories for events
const categories: Category[] = [
	{label: 'Work', value: 'work', color: 'blue'},
	{label: 'Personal', value: 'personal', color: 'green'},
	{label: 'Urgent', value: 'urgent', color: 'red'},
	{label: 'Meeting', value: 'meeting', color: 'purple'},
	{label: 'Break', value: 'break', color: 'orange'}
]

const test_today = currentDate.toLocaleDateString('en-CA');
// Sample events data with categories
// Sample events data with categories
const events = ref([
	{
		id: 1,
		title: 'Team Sync',
		start: test_today + 'T09:10:00',
		end: test_today + 'T09:50:00',
		category: 'meeting',
		gridRowStart: 0,
		gridRowEnd: 0
	},
	{
		id: 2,
		title: 'Design Review',
		start: test_today + 'T10:30:00',
		end: test_today + 'T11:20:00',
		category: 'work',
		gridRowStart: 0,
		gridRowEnd: 0
	},
	{
		id: 3,
		title: 'Lunch Break',
		start: test_today + 'T12:00:00',
		end: test_today + 'T13:00:00',
		category: 'break',
		gridRowStart: 0,
		gridRowEnd: 0
	},
	{
		id: 4,
		title: 'Client Call',
		start: test_today + 'T14:20:00',
		end: test_today + 'T15:00:00',
		category: 'urgent',
		gridRowStart: 0,
		gridRowEnd: 0
	},
	{
		id: 5,
		title: 'Code Review',
		start: test_today + 'T15:30:00',
		end: test_today + 'T16:10:00',
		category: 'work',
		gridRowStart: 0,
		gridRowEnd: 0
	},
	{
		id: 6,
		title: 'TEST next day',
		start: test_today + 'T23:30:00',
		end: '2025-10-03T01:10:00',
		category: 'work',
		gridRowStart: 0,
		gridRowEnd: 0
	}
] as DayEvent[])

// Refs
const eventsColumnRef = ref<HTMLElement | null>(null)

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
const originalEventState = ref<DayEvent | null>(null)
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
	// Calculate the view start and end times
	const viewStartDate = new Date(currentDate)
	viewStartDate.setHours(startTime.value.hours, startTime.value.minutes, 0, 0)

	const viewEndDate = new Date(currentDate)
	const endHour = calendarEndHour.value

	// If end hour is >= 24, it spans to the next day
	if (endHour >= 24) {
		viewEndDate.setDate(viewEndDate.getDate() + Math.floor(endHour / 24))
		viewEndDate.setHours(endHour % 24, startTime.value.minutes, 0, 0)
	} else {
		viewEndDate.setHours(endHour, startTime.value.minutes, 0, 0)
	}

	// Check if current time is within the visible range
	return currentTime.value >= viewStartDate && currentTime.value < viewEndDate
})

const currentTimeIndicatorStyle = computed(() => {
	if (!showCurrentTimeIndicator.value) return {}

	// Calculate the view start time
	const viewStartDate = new Date(currentDate)
	viewStartDate.setHours(startTime.value.hours, startTime.value.minutes, 0, 0)

	// Calculate minutes from view start to current time
	const minutesFromViewStart = Math.round((currentTime.value.getTime() - viewStartDate.getTime()) / 60000)
	const slotIndex = Math.round(minutesFromViewStart / 10)
	const gridRow = slotIndex + 1

	return {
		gridRow: `${gridRow} / ${gridRow}`
	}
})

// Generate time slots for the calendar
const timeSlots = computed<TimeSlot[]>(() => {
	const slots: TimeSlot[] = []
	for (let hour = startTime.value.hours; hour < calendarEndHour.value; hour++) {
		for (let minute = 0; minute < 60; minute += 10) {
			slots.push({hour: hour % 24, minute})
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

// Filter events that fall within the visible time range
const visibleEvents = computed(() => {
	return events.value.filter(event => {
		const eventStart = new Date(event.start)
		const eventEnd = new Date(event.end)

		// Calculate the absolute start and end times of the visible range
		const viewStartDate = new Date(currentDate)
		viewStartDate.setHours(startTime.value.hours, startTime.value.minutes, 0, 0)

		const viewEndDate = new Date(currentDate)
		const endHour = calendarEndHour.value

		// If end hour is >= 24, it spans to the next day
		if (endHour >= 24) {
			viewEndDate.setDate(viewEndDate.getDate() + Math.floor(endHour / 24))
			viewEndDate.setHours(endHour % 24, startTime.value.minutes, 0, 0)
		} else {
			viewEndDate.setHours(endHour, startTime.value.minutes, 0, 0)
		}

		// Check if event overlaps with visible range
		return eventStart < viewEndDate && eventEnd > viewStartDate
	})
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

const formatEventTime = (event: DayEvent): string => {
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

const isEventPast = (event: DayEvent): boolean => {
	const endDate = new Date(event.end)
	return endDate < currentTime.value
}

// const getEventStyle = (event: DayEvent) => {
// 	const startDate = new Date(event.start)
// 	const endDate = new Date(event.end)
//
// 	// Calculate the view start time
// 	const viewStartDate = new Date(currentDate)
// 	viewStartDate.setHours(startTime.value.hours, startTime.value.minutes, 0, 0)
//
// 	// Calculate minutes from view start to event start
// 	const minutesFromViewStart = Math.floor((startDate.getTime() - viewStartDate.getTime()) / 60000)
// 	const startRow = Math.floor(minutesFromViewStart / 10) + 1
//
// 	// Calculate event duration in minutes
// 	const durationMinutes = Math.floor((endDate.getTime() - startDate.getTime()) / 60000)
// 	const span = Math.ceil(durationMinutes / 10)
//
// 	return {
// 		gridRow: `${startRow} / span ${span}`,
// 	}
// }


const initializeEventGridPositions = () => {
	events.value.forEach(event => {
		const startDate = new Date(event.start)
		const endDate = new Date(event.end)

		const viewStartDate = new Date(currentDate)
		viewStartDate.setHours(startTime.value.hours, startTime.value.minutes, 0, 0)

		const minutesFromViewStart = Math.floor((startDate.getTime() - viewStartDate.getTime()) / 60000)
		const startRow = Math.floor(minutesFromViewStart / 10) + 1

		const durationMinutes = Math.floor((endDate.getTime() - startDate.getTime()) / 60000)
		const span = Math.ceil(durationMinutes / 10)
		const endRow = startRow + span - 1

		event.gridRowStart = startRow
		event.gridRowEnd = endRow
	})
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
	const hours = Math.floor(totalMinutes / 60) + startTime.value.hours
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
	const hours = Math.floor(totalMinutes / 60) + startTime.value.hours
	const minutes = totalMinutes % 60


	return `${test_today}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
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

const openEditDialog = (event: DayEvent): void => {
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
		const today = test_today

		const newEvent: DayEvent = {
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

// Resize state
const resizingEventId = ref<number | null>(null)
const resizeStartSlot = ref<number | null>(null)
const resizePreview = ref<CreationPreview | null>(null)
const resizeDirection = ref<'top' | 'bottom' | null>(null)

// Click and drag to create new events
const handleColumnMouseDown = (e: MouseEvent): void => {
	const target = e.target as HTMLElement

	// Check if clicking on a resize handle
	const resizeHandle = target.closest('.resize-handle') as HTMLElement
	if (resizeHandle) {
		const eventId = parseInt(resizeHandle.dataset.eventId || '0')
		const event = events.value.find(ev => ev.id === eventId)
		if (!event) return

		// Start resizing
		resizingEventId.value = eventId

		// Determine resize direction
		resizeDirection.value = resizeHandle.classList.contains('resize-handle-top') ? 'top' : 'bottom'

		// Calculate the current start and end rows for the event
		const startDate = new Date(event.start)
		const viewStartDate = new Date(currentDate)
		viewStartDate.setHours(startTime.value.hours, startTime.value.minutes, 0, 0)

		const minutesFromViewStart = Math.floor((startDate.getTime() - viewStartDate.getTime()) / 60000)
		const startRow = Math.floor(minutesFromViewStart / 10) + 1

		const endDate = new Date(event.end)
		const durationMinutes = Math.floor((endDate.getTime() - startDate.getTime()) / 60000)
		const endRow = startRow + Math.ceil(durationMinutes / 10) - 1

		resizeStartSlot.value = startRow - 1
		resizePreview.value = {
			startRow,
			endRow
		}

		e.preventDefault()
		e.stopPropagation()
		return
	}

	// Only start creating if clicking on empty space (not on an event)
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
	// Handle resizing
	if (resizingEventId.value !== null && resizeStartSlot.value !== null && resizePreview.value && resizeDirection.value) {
		const slotIndex = getSlotIndexFromPosition(e.clientY)
		const event = events.value.find(ev => ev.id === resizingEventId.value)
		if (!event) return

		if (resizeDirection.value === 'bottom') {
			// Resizing from bottom (changing end time)
			const newEndRow = slotIndex + 1
			const startRow = resizePreview.value.startRow

			// Ensure minimum height of 1 slot (endRow must be >= startRow)
			if (newEndRow >= startRow) {
				resizePreview.value = {
					startRow,
					endRow: newEndRow
				}

				// Update the event's grid position
				const eventIndex = events.value.findIndex(ev => ev.id === resizingEventId.value)
				const nextEvent = events.value[eventIndex + 1]
				if (newEndRow >= nextEvent?.gridRowStart) {
					return
				}

				event.gridRowEnd = newEndRow
				// Update the end time
				event.end = calculateTimeFromSlotIndex(newEndRow)
			}
		} else if (resizeDirection.value === 'top') {
			// Resizing from top (changing start time)
			const newStartRow = slotIndex + 1
			const endRow = resizePreview.value.endRow

			// Ensure minimum height of 1 slot (startRow must be <= endRow)
			if (newStartRow <= endRow) {
				resizePreview.value = {
					startRow: newStartRow,
					endRow
				}

				// Check for conflicts with previous event
				const eventIndex = events.value.findIndex(ev => ev.id === resizingEventId.value)
				const prevEvent = events.value[eventIndex - 1]
				if (prevEvent && newStartRow <= prevEvent.gridRowEnd) {
					return
				}

				event.gridRowStart = newStartRow
				// Update the start time
				event.start = calculateTimeFromSlotIndex(newStartRow - 1)
			}
		}

		return
	}

	// Handle creation
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
	// Handle resize end
	if (resizingEventId.value !== null) {
		resizingEventId.value = null
		resizeStartSlot.value = null
		resizePreview.value = null
		resizeDirection.value = null
		return
	}

	// Handle creation end
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
	// Cancel resizing if mouse leaves
	if (resizingEventId.value !== null) {
		resizingEventId.value = null
		resizeStartSlot.value = null
		resizePreview.value = null
		resizeDirection.value = null
	}

	if (isCreating.value) {
		// Cancel creation if mouse leaves the column
		isCreating.value = false
		creationStart.value = null
		creationEnd.value = null
		creationPreview.value = null
	}
}
const updateCurrentTime = () => {
	currentTime.value = new Date()
}

// Lifecycle hooks
onMounted(() => {
	// Initialize grid positions for all events
	initializeEventGridPositions()

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
	padding: 10px 0;
	background-color: #f5f5f5;
	display: grid;
	grid-template-columns: 80px 1fr;
	gap: 0;
	height: 600px;
	overflow-y: auto;
	border: 1px solid #e0e0e0;
}


.events-column {
	display: grid;
	position: relative;
	background: white;
	user-select: none;
	cursor: crosshair;
}

.time-column {
	display: grid;
	background: #f5f5f5;
	position: relative;
}

.time-slot:not(:nth-of-type(3n+1)) {
	margin-right: 2px;
}

.time-labels-overlay {
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	pointer-events: none;
}

.time-label-positioned {
	position: absolute;
	right: 20px;
	transform: translateY(-50%);
	color: #333;
	font-weight: 400;
	background: #f5f5f5;
	padding: 0 1px;
	font-size: 13px;
}

.time-label-positioned.half-hour-label {
	color: #333;
	font-weight: 500;
	font-size: 15px;
}

.midnight-divider {
	position: absolute;
	left: 0;
	right: 0;
	height: 3px;
	background: linear-gradient(90deg, #9C27B0 0%, #E91E63 100%);
	z-index: 20;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 2px 8px rgba(156, 39, 176, 0.4);
}

.midnight-label {
	position: absolute;
	top: -10px;
	background: linear-gradient(90deg, #9C27B0 0%, #E91E63 100%);
	color: white;
	padding: 2px 8px;
	border-radius: 4px;
	font-size: 10px;
	font-weight: 700;
	letter-spacing: 0.5px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.midnight-divider-events {
	position: absolute;
	left: 0;
	right: 0;
	height: 3px;
	background: linear-gradient(90deg, #9C27B0 0%, #E91E63 100%);
	z-index: 20;
	pointer-events: none;
	box-shadow: 0 2px 8px rgba(156, 39, 176, 0.4);
}

.time-slot {
	border-top: 2px dotted rgba(51, 51, 51, 0.5);
}

.time-slot:nth-of-type(3n+1) {
	border-top-style: solid;
}

.event-slot {
	border-top: 2px dotted rgba(51, 51, 51, 0.5);
	transition: background-color 0.2s ease;
}

.event-slot:nth-of-type(3n+1) {
	border-top-style: solid;
}


.event-slot.hoverable:hover {
	background-color: rgba(0, 0, 0, 0.02);
	cursor: cell;
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
	top: 2px;
	left: 2px;
	right: 2px;
	bottom: 1px;
	cursor: move;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	transition: all 0.2s ease;
	display: flex;
	flex-direction: column;
	overflow: hidden;
	z-index: 10;
	user-select: none;
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

.event-block:not(.resizing):not(.dragging):not(.no-hover):hover {
	transform: scaleY(1.06);
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
	top: 2px;
	bottom: 1px;
	left: 2px;
	right: 2px;
	background: rgba(66, 153, 225, 0.2);
	border: 2px dashed #4299e1;
	border-radius: 6px;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 5;
	pointer-events: none;
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