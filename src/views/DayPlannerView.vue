<template>
<v-container fluid class="pa-4">
	<v-card>
		<v-card-title class="d-flex justify-space-between align-center">
			<span>Daily Schedule - September 22, 2025</span>
			<v-btn
				color="primary"
				@click="openCreateDialog"
				prepend-icon="mdi-plus"
			>
				Add New Event
			</v-btn>
		</v-card-title>

		<v-card-text>
			<div class="calendar-grid">
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
					<div v-for="(slot, index) in timeSlots" :key="index"
					     :class="['event-slot', { 'half-hour': isHalfHour(slot), 'full-hour': isFullHour(slot) }]"
					     :data-slot-index="index">
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
					     :ref="el => eventRefs[event.id] = el"
					     :style="getEventStyle(event)"
					     :class="['event-block', { 'dragging': draggingEventId === event.id }]"
					     :data-event-id="event.id"
					     @click="openEditDialog(event)">
						<div class="event-content">
							<div class="event-title">{{ event.title }}</div>
							<div class="event-time">{{ formatEventTime(event) }}</div>
						</div>
						<!-- Resize Handle -->
						<div
							:ref="el => resizeRefs[event.id] = el"
							class="resize-handle"
							:data-event-id="event.id"
							@click.stop
						>
							<v-icon size="x-small" color="white">mdi-dots-horizontal</v-icon>
						</div>
					</div>
				</div>
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
							></v-text-field>
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
							></v-text-field>
						</v-col>
					</v-row>
				</v-container>
			</v-card-text>

			<v-card-actions>
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
				>
					Save
				</v-btn>
			</v-card-actions>
		</v-card>
	</v-dialog>
</v-container>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, onUnmounted, nextTick} from 'vue'
import {
	draggable,
	dropTargetForElements,
	monitorForElements
} from '@atlaskit/pragmatic-drag-and-drop/element/adapter'

const calendarStartHour = 8
const calendarEndHour = 18

// Sample events data
const events = ref([
	{
		id: 1,
		title: 'Team Sync',
		start: '2025-09-22T09:10:00',
		end: '2025-09-22T09:50:00'
	},
	{
		id: 2,
		title: 'Design Review',
		start: '2025-09-22T10:30:00',
		end: '2025-09-22T11:20:00'
	},
	{
		id: 3,
		title: 'Lunch Break',
		start: '2025-09-22T12:00:00',
		end: '2025-09-22T13:00:00'
	},
	{
		id: 4,
		title: 'Client Call',
		start: '2025-09-22T14:20:00',
		end: '2025-09-22T15:00:00'
	},
	{
		id: 5,
		title: 'Code Review',
		start: '2025-09-22T15:30:00',
		end: '2025-09-22T16:10:00'
	}
])

// Refs
const eventsColumnRef = ref(null)
const eventRefs = ref({})
const resizeRefs = ref({})

// Dialog state
const dialog = ref(false)
const dialogMode = ref('create')
const editingEvent = ref({
	id: null,
	title: '',
	startTime: '',
	endTime: ''
})

// Drag state
const draggingEventId = ref(null)
const isResizing = ref(false)

// Creation state
const isCreating = ref(false)
const creationStart = ref(null)
const creationEnd = ref(null)
const creationPreview = ref(null)

// Cleanup functions for drag and drop
const cleanupFunctions = ref([])

// Generate time slots for the calendar
const timeSlots = computed(() => {
	const slots = []
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

// Helper functions
const isHalfHour = (slot) => {
	return slot.minute === 0 || slot.minute === 30
}

const isFullHour = (slot) => {
	return slot.minute === 0
}

const formatTime = (slot) => {
	const hour = slot.hour.toString().padStart(2, '0')
	const minute = slot.minute.toString().padStart(2, '0')
	return `${hour}:${minute}`
}

const formatEventTime = (event) => {
	const startTime = new Date(event.start).toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	})
	const endTime = new Date(event.end).toLocaleTimeString('en-US', {
		hour: '2-digit',
		minute: '2-digit',
		hour12: false
	})
	return `${startTime} - ${endTime}`
}

const getEventStyle = (event) => {
	const startDate = new Date(event.start)
	const endDate = new Date(event.end)

	const startHour = startDate.getHours()
	const startMinute = startDate.getMinutes()
	const endHour = endDate.getHours()
	const endMinute = endDate.getMinutes()

// Calculate start row
	const startRow = ((startHour - calendarStartHour) * 60 + startMinute) / 10 + 1

// Calculate duration in minutes
	const durationMinutes = (endHour * 60 + endMinute) - (startHour * 60 + startMinute)
	const spanValue = durationMinutes / 10

	return {
		gridRow: `${startRow} / span ${spanValue}`
	}
}

// Convert slot index to time string
const slotIndexToTime = (index) => {
	const totalMinutes = index * 10
	const hours = Math.floor(totalMinutes / 60) + calendarStartHour
	const minutes = totalMinutes % 60

	return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

// Convert position to slot index
const getSlotIndexFromPosition = (y) => {
	if (!eventsColumnRef.value) return 0

	const rect = eventsColumnRef.value.getBoundingClientRect()
	const relativeY = y - rect.top
	const slotHeight = rect.height / timeSlots.value.length

	return Math.max(0, Math.min(timeSlots.value.length - 1, Math.floor(relativeY / slotHeight)))
}

// Calculate new time based on slot index
const calculateTimeFromSlotIndex = (slotIndex) => {
	const totalMinutes = slotIndex * 10
	const hours = Math.floor(totalMinutes / 60) + calendarStartHour
	const minutes = totalMinutes % 60
	const today = '2025-09-22'

	return `${today}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`
}

// Dialog functions
const openCreateDialog = (prefillTimes = null) => {
	dialogMode.value = 'create'
	editingEvent.value = {
		id: null,
		title: '',
		startTime: prefillTimes?.startTime || '',
		endTime: prefillTimes?.endTime || ''
	}
	dialog.value = true
}

const openEditDialog = (event) => {
// Don't open dialog if dragging
	if (draggingEventId.value) return

	dialogMode.value = 'edit'
	const startDate = new Date(event.start)
	const endDate = new Date(event.end)

	editingEvent.value = {
		id: event.id,
		title: event.title,
		startTime: startDate.toTimeString().slice(0, 5),
		endTime: endDate.toTimeString().slice(0, 5)
	}
	dialog.value = true
}

const saveEvent = () => {
	if (dialogMode.value === 'create') {
// Create new event
		const newId = events.value.length > 0 ? Math.max(...events.value.map(e => e.id)) + 1 : 1
		const today = '2025-09-22'

		const newEvent = {
			id: newId,
			title: editingEvent.value.title || 'New Event',
			start: `${today}T${editingEvent.value.startTime}:00`,
			end: `${today}T${editingEvent.value.endTime}:00`
		}

		events.value.push(newEvent)
// TODO: API call to save/update event

// Register drag and drop for the new event after DOM update
		nextTick(() => {
			setupDragAndDropForEvent(newId)
		})
	} else {
// Edit existing event (only title in this version)
		const eventIndex = events.value.findIndex(e => e.id === editingEvent.value.id)
		if (eventIndex !== -1) {
			events.value[eventIndex].title = editingEvent.value.title
// TODO: API call to save/update event
		}
	}

	dialog.value = false
}

// Click and drag to create new events
const handleColumnMouseDown = (e) => {
// Only start creating if clicking on empty space (not on an event)
	if (e.target.closest('.event-block')) return

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

const handleColumnMouseMove = (e) => {
	if (!isCreating.value) return

	const slotIndex = getSlotIndexFromPosition(e.clientY)
	creationEnd.value = slotIndex

	const startRow = Math.min(creationStart.value, creationEnd.value) + 1
	const endRow = Math.max(creationStart.value, creationEnd.value) + 1

	creationPreview.value = {
		startRow,
		endRow
	}
}

const handleColumnMouseUp = (e) => {
	if (!isCreating.value) return

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

const handleColumnMouseLeave = () => {
	if (isCreating.value) {
// Cancel creation if mouse leaves the column
		isCreating.value = false
		creationStart.value = null
		creationEnd.value = null
		creationPreview.value = null
	}
}

// Setup drag and drop for a specific event
const setupDragAndDropForEvent = (eventId) => {
	const eventEl = eventRefs.value[eventId]
	const resizeEl = resizeRefs.value[eventId]

	if (!eventEl) return

// Make event block draggable for rescheduling
	const eventCleanup = draggable({
		element: eventEl,
		getInitialData: () => {
			const event = events.value.find(e => e.id === eventId)
			if (!event) return {}

			const duration = (new Date(event.end) - new Date(event.start)) / (1000 * 60) // duration in minutes

			return {
				type: 'event-move',
				eventId: eventId,
				duration: duration
			}
		},
		onDragStart: () => {
			draggingEventId.value = eventId
		},
		onDrop: () => {
			draggingEventId.value = null
		}
	})

// Make resize handle draggable for resizing
	if (resizeEl) {
		const resizeCleanup = draggable({
			element: resizeEl,
			getInitialData: () => {
				const event = events.value.find(e => e.id === eventId)
				if (!event) return {}

				return {
					type: 'event-resize',
					eventId: eventId,
					startTime: event.start
				}
			},
			onDragStart: () => {
				isResizing.value = true
				draggingEventId.value = eventId
			},
			onDrop: () => {
				isResizing.value = false
				draggingEventId.value = null
			}
		})

		cleanupFunctions.value.push(resizeCleanup)
	}

	cleanupFunctions.value.push(eventCleanup)
}

// Setup drag and drop
const setupDragAndDrop = () => {
	if (!eventsColumnRef.value) return

// Register events column as drop target
	const dropCleanup = dropTargetForElements({
		element: eventsColumnRef.value,
		getData: ({input, element}) => {
			const rect = element.getBoundingClientRect()
			const slotIndex = getSlotIndexFromPosition(input.clientY)

			return {
				slotIndex
			}
		},
		canDrop: ({source}) => {
			return source.data.type === 'event-move' || source.data.type === 'event-resize'
		}
	})

// Monitor for drop events
	const monitorCleanup = monitorForElements({
		onDrop: ({source, location}) => {
			const dropTarget = location.current.dropTargets[0]
			if (!dropTarget) return

			const slotIndex = dropTarget.data.slotIndex

			if (source.data.type === 'event-move') {
// Handle event rescheduling
				const eventId = source.data.eventId
				const duration = source.data.duration
				const event = events.value.find(e => e.id === eventId)

				if (event) {
					const newStart = calculateTimeFromSlotIndex(slotIndex)
					const newStartDate = new Date(newStart)
					const newEndDate = new Date(newStartDate.getTime() + duration * 60 * 1000)

					event.start = newStart
					event.end = newEndDate.toISOString().replace('.000Z', '').replace('Z', '')

// TODO: API call to update event
				}
			} else if (source.data.type === 'event-resize') {
// Handle event resizing
				const eventId = source.data.eventId
				const event = events.value.find(e => e.id === eventId)

				if (event) {
					const startDate = new Date(event.start)
					const startSlotIndex = ((startDate.getHours() - calendarStartHour) * 60 + startDate.getMinutes()) / 10

// Calculate new end time based on drop position
					const endSlotIndex = Math.max(startSlotIndex + 1, slotIndex + 1) // Minimum 1 slot duration
					const newEnd = calculateTimeFromSlotIndex(endSlotIndex)

					event.end = newEnd

// TODO: API call to update event
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

// Lifecycle hooks
onMounted(() => {
	nextTick(() => {
		setupDragAndDrop()
	})
})

onUnmounted(() => {
// Cleanup all drag and drop listeners
	cleanupFunctions.value.forEach(cleanup => cleanup())
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
}

.event-slot.half-hour {
	border-top: 1px solid #e0e0e0;
}

.event-slot.full-hour {
	border-top: 1px solid #d0d0d0;
}

.time-label {
	font-weight: 500;
}

.event-block {
	position: absolute;
	left: 4px;
	right: 4px;
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
}

.event-block.dragging {
	opacity: 0.5;
	z-index: 100;
}

.event-block:hover {
	transform: translateY(-1px);
	box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}

.event-content {
	flex: 1;
	padding: 6px 8px;
	cursor: pointer;
}

.event-title {
	font-weight: 500;
	font-size: 13px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.event-time {
	font-size: 11px;
	opacity: 0.9;
	margin-top: 2px;
}

.resize-handle {
	height: 16px;
	background: rgba(0, 0, 0, 0.2);
	cursor: ns-resize;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background 0.2s ease;
}

.resize-handle:hover {
	background: rgba(0, 0, 0, 0.3);
}

.creation-preview {
	position: absolute;
	left: 4px;
	right: 4px;
	background: rgba(66, 153, 225, 0.3);
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

/* Different colors for different events */
.event-block:nth-child(odd) {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.event-block:nth-child(even) {
	background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.event-block:nth-child(3n) {
	background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.event-block:nth-child(4n) {
	background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.event-block:nth-child(5n) {
	background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}
</style>