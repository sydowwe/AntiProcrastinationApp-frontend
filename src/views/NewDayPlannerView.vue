<!-- DayPlannerView.vue -->
<template>
<VCard class="mx-auto w-100 w-lg-66 d-flex flex-column">
	<VCardTitle class="d-flex justify-space-between align-center flex-wrap ga-2">
		<span>Daily Schedule - {{ currentDateFormatted }}</span>

		<TimeRangePicker
			v-model:start="viewStartTime"
			v-model:end="viewEndTime"
		/>
		<div class="d-flex ga-2 align-center flex-wrap">
			<VBtn
				color="secondary"
				@pointerdown.prevent="openEditDialog"
				:class="{ 'is-hidden': !focusedEventId }"
			>
				Edit
			</VBtn>
			<VBtn
				color="secondaryOutline"
				variant="outlined"
				@pointerdown.prevent="openDeleteDialog"
				:class="{ 'is-hidden': !focusedEventId }"
			>
				Delete
			</VBtn>
			<VBtn
				color="primary"
				@click="openCreateDialogEmpty"
				prependIcon="plus"
			>
				Add New Event
			</VBtn>
		</div>
	</VCardTitle>

	<VCardText class="flex-fill d-flex flex-column ga-4">
		<div class="calendar-grid flex-fill">

			<!-- Time Column -->
			<TimeColumn
			/>

			<!-- Events Column -->
			<EventsColumn
				ref="eventsColumnRef"
				:events="visibleEvents"
				@createEvent="handleCreateEvent"
				@updateEvent="handleUpdateEvent"
				@conflictDetected="conflictSnackbar = true"
				@editEvent="openEditDialog"
				@focusEvent="handleFocusEvent"
			/>
		</div>

		<!-- Legend (placeholder for future) -->
		<div class="calendar-legend">
			<!-- Add category legend here if needed -->
		</div>
	</VCardText>
</VCard>

<!-- Delete Confirmation Dialog -->
<MyDialog
	title="Delete confirmation"
	:text="`Are you sure you want to delete event ${toDeleteEvent?.title}?`"
	v-model="deleteDialog"
	@confirmed="deleteEvent"
	confirmBtnColor="error"
/>

<!-- Event Dialog -->
<EventDialog
	v-model="dialog"
	:dialogMode="dialogMode"
	:event="editingEvent"
	@save="saveEvent"
/>

<!-- Conflict Snackbar -->
<VSnackbar
	v-model="conflictSnackbar"
	color="error"
	:timeout="3000"
>
	Event conflicts with existing schedule!
	<template v-slot:actions>
		<VBtn
			variant="text"
			@click="conflictSnackbar = false"
		>
			Close
		</VBtn>
	</template>
</VSnackbar>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, onUnmounted, watch} from 'vue'
import {MyEvent} from '@/classes/types/DayPlannerTypes'
import MyDialog from '@/components/dialogs/MyDialog.vue'
import EventDialog from '@/components/dayPlanner/EventDialog.vue'
import TimeColumn from '@/components/dayPlanner/TimeColumn.vue'
import EventsColumn from '@/components/dayPlanner/EventsColumn.vue'
import TimeRangePicker from '@/components/general/dateTime/TimeRangePicker.vue';
import {Time} from '@/classes/TimeUtils.ts';
import {useDayPlanner} from '@/components/dayPlanner/useDayPlanner.ts';
import {useMoment} from '@/scripts/momentHelper.ts';

// Constants
const {formatToDateWithDay, formatToDate, formatLocalized} = useMoment()
const { totalGridRows,viewStartTime, viewEndTime, viewedDate, timeToSlotIndex} = useDayPlanner()
const test_today = formatLocalized(viewedDate.value, 'YYYY-MM-DD')

const spanHours = ref(10)


// const categories: Category[] = [
// 	{label: 'Work', value: 'work', color: 'blue'},
// 	{label: 'Personal', value: 'personal', color: 'green'},
// 	{label: 'Urgent', value: 'urgent', color: 'red'},
// 	{label: 'Meeting', value: 'meeting', color: 'purple'},
// 	{label: 'Break', value: 'break', color: 'orange'}
// ]

// Sample events data
const events = ref([
	new MyEvent(7, 'Work', '#4287f5', new Date(test_today + 'T07:00:00'), new Date(test_today + 'T15:00:00'), true, false, 0, 0),
	new MyEvent(1, 'Team Sync', '#9b4dca', new Date(test_today + 'T09:10:00'), new Date(test_today + 'T09:50:00'), false, true, 0, 0),
	new MyEvent(2, 'Design Review', '#4287f5', new Date(test_today + 'T10:30:00'), new Date(test_today + 'T11:20:00'),  false, true, 0, 0),
	new MyEvent(3, 'Lunch Break', '#ff9f1a', new Date(test_today + 'T12:00:00'), new Date(test_today + 'T13:00:00'), false, true, 0, 0),
	new MyEvent(4, 'Client Call', '#e74c3c', new Date(test_today + 'T14:20:00'), new Date(test_today + 'T15:00:00'), false, true, 0, 0),
	new MyEvent(5, 'Code Review', '#4287f5', new Date(test_today + 'T15:30:00'), new Date(test_today + 'T16:10:00'), false, false, 0, 0),
	new MyEvent(6, 'TEST next day', '#4287f5', new Date(test_today + 'T23:30:00'), new Date('2025-10-06T01:10:00'), false, false, 0, 0)
] as MyEvent[])

// Refs
const eventsColumnRef = ref<InstanceType<typeof EventsColumn> | null>(null)


// Dialog state
const dialog = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const editingEvent = ref<Partial<MyEvent>>({})
const deleteDialog = ref(false)
const toDeleteIndex = ref<number | null>(null)

// Snackbar state
const conflictSnackbar = ref(false)

// Focus state
const focusedEventId = ref<number | null>(null)

// Computed properties
const currentDateFormatted = computed(() => {
	return formatToDateWithDay(viewedDate.value)
})


// Filter events that have at least one slot visible in the frame
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


const initializeEventGridPositions = () => {
	events.value.forEach(event => {
		const startDate = new Date(event.start)
		const endDate = new Date(event.end)

		const viewStartDate = new Date(viewedDate.value)
		viewStartDate.setHours(viewStartTime.value.hours, viewStartTime.value.minutes, 0, 0)

		const minutesFromViewStart = Math.floor((startDate.getTime() - viewStartDate.getTime()) / 60000)
		const startRow = Math.floor(minutesFromViewStart / 10) + 1

		const minutesFromViewStartToEnd = Math.floor((endDate.getTime() - viewStartDate.getTime()) / 60000)
		const endRow = Math.floor(minutesFromViewStartToEnd / 10)

		event.gridRowStart = Math.max(1, startRow)
		event.gridRowEnd = Math.min(totalGridRows.value, endRow)
	})
}

// Check for event conflicts
const checkEventConflict = (eventId: number, newStart: string, newEnd: string): boolean => {
	return events.value.some(event => {
		if (event.id === eventId || event.isBackground) return false

		const existingStart = new Date(event.start)
		const existingEnd = new Date(event.end)
		const checkStart = new Date(newStart)
		const checkEnd = new Date(newEnd)

		return (checkStart < existingEnd && checkEnd > existingStart)
	})
}

// Check if event overlaps with any background event
const checkOverlapsBackground = (start: string, end: string): boolean => {
	return events.value.some(event => {
		if (!event.isBackground) return false

		const bgStart = new Date(event.start)
		const bgEnd = new Date(event.end)
		const checkStart = new Date(start)
		const checkEnd = new Date(end)

		return (checkStart < bgEnd && checkEnd > bgStart)
	})
}

// Update overlapsBackground flag for all normal events based on a background event
const updateOverlapsBackgroundFlags = (bgStart: string, bgEnd: string): void => {
	events.value.forEach(event => {
		if (event.isBackground) return

		const eventStart = new Date(event.start)
		const eventEnd = new Date(event.end)
		const bgStartDate = new Date(bgStart)
		const bgEndDate = new Date(bgEnd)

		if (eventStart < bgEndDate && eventEnd > bgStartDate) {
			event.isDuringBackgroundEvent = true
		}
	})
}

// Event handlers
const handleFocusEvent = (eventId: number | null): void => {
	focusedEventId.value = eventId
}

// Helper to create default event data
const createDefaultEvent = (): Partial<MyEvent> => ({
	title: '',
	color: '#4287f5',
	isBackground: false,
	gridRowStart: undefined,
	gridRowEnd: undefined,
	start: undefined,
	end: undefined
})

// Handle create event - simplified
const handleCreateEvent = (payload: {
	startTime: Date;
	endTime: Date;
	gridRowStart: number;
	gridRowEnd: number
}): void => {
	dialogMode.value = 'create'
	editingEvent.value = {
		...createDefaultEvent(),
		start: payload.startTime,
		end: payload.endTime,
		gridRowStart: payload.gridRowStart,
		gridRowEnd: payload.gridRowEnd
	}
	dialog.value = true
}

// Handle update event - immutable pattern
const handleUpdateEvent = (payload: {
	eventId: number;
	updates: Partial<MyEvent>
}): void => {
	const eventIndex = events.value.findIndex(e => e.id === payload.eventId)
	if (eventIndex === -1) return

	if (!events.value[eventIndex]) {
		return
	}
	// Immutable update
	events.value[eventIndex] = {
		...events.value[eventIndex],
		...payload.updates
	}

	// Update overlapsBackground flag if times changed
	if (payload.updates.start || payload.updates.end) {
		const event = events.value[eventIndex]
		event.isDuringBackgroundEvent = checkOverlapsBackground(event.start, event.end)
	}
}

// Open create dialog (empty)
const openCreateDialogEmpty = (): void => {
	dialogMode.value = 'create'
	editingEvent.value = createDefaultEvent()
	dialog.value = true
}

// Open edit dialog
const openEditDialog = (): void => {
	const event = events.value.find(e => e.id === focusedEventId.value)
	if (!event) return

	dialogMode.value = 'edit'
	const startDate = new Date(event.start)
	const endDate = new Date(event.end)

	// Pass the existing event data as partial
	editingEvent.value = {
		id: event.id,
		title: event.title,
		color: event.color,
		start: startDate.toTimeString().slice(0, 5),
		end: endDate.toTimeString().slice(0, 5),
		category: event.category,
		gridRowStart: event.gridRowStart,
		gridRowEnd: event.gridRowEnd,
		isBackground: event.isBackground
	}
	dialog.value = true
}

// Save event - unified logic
const saveEvent = (savedEvent: Partial<MyEvent>): void => {
	const today = test_today

	if (dialogMode.value === 'create') {
		// Generate new ID
		const newId = events.value.length > 0
			? Math.max(...events.value.map(e => e.id)) + 1
			: 1

		// Create new event with all required fields
		const newEvent = new MyEvent(
			newId,
			savedEvent.title || 'Untitled',
			savedEvent.color || '#4287f5',
			new Date(`${today}T${savedEvent.start}:00`),
			new Date(`${today}T${savedEvent.end}:00`),
			savedEvent.isBackground || false,
			false, // isDuringBackgroundEvent - calculated below
			savedEvent.gridRowStart ?? timeToSlotIndex.value(savedEvent.start || '09:00') + 1,
			savedEvent.gridRowEnd ?? timeToSlotIndex.value(savedEvent.end || '10:00')
		)

		// Handle background events
		if (newEvent.isBackground) {
			updateOverlapsBackgroundFlags(newEvent.start, newEvent.end)
		} else {
			if (checkEventConflict(newId, newEvent.start, newEvent.end)) {
				conflictSnackbar.value = true
				return
			}
			newEvent.isDuringBackgroundEvent = checkOverlapsBackground(
				newEvent.start,
				newEvent.end
			)
		}

		events.value.push(newEvent)
		initializeEventGridPositions()
	} else {
		// Edit existing event
		const eventIndex = events.value.findIndex(e => e.id === savedEvent.id)
		if (eventIndex === -1) return

		const existingEvent = events.value[eventIndex]
		if (!existingEvent) {
			return
		}
		// Immutable update with all changes
		events.value[eventIndex] = new MyEvent(
			existingEvent.id,
			savedEvent.title || existingEvent.title,
			savedEvent.color || existingEvent.color,
			new Date(`${today}T${savedEvent.start}:00`),
			new Date(`${today}T${savedEvent.end}:00`),
			savedEvent.isBackground ?? existingEvent.isBackground,
			existingEvent.isDuringBackgroundEvent, // Will be updated below
			timeToSlotIndex.value(savedEvent.start || '09:00') + 1,
			timeToSlotIndex.value(savedEvent.end || '10:00')
		)

		const updatedEvent = events.value[eventIndex]

		// Update background flags if background event
		if (updatedEvent.isBackground) {
			updateOverlapsBackgroundFlags(updatedEvent.start, updatedEvent.end)
		} else {
			// Check conflicts and overlaps for regular events
			if (checkEventConflict(updatedEvent.id, updatedEvent.start, updatedEvent.end)) {
				conflictSnackbar.value = true
				// Revert changes
				events.value[eventIndex] = existingEvent
				return
			}
			updatedEvent.isDuringBackgroundEvent = checkOverlapsBackground(
				updatedEvent.start,
				updatedEvent.end
			)
		}
	}

	dialog.value = false
}

const openDeleteDialog = (): void => {
	toDeleteIndex.value = events.value.findIndex(e => e.id === focusedEventId.value)
	deleteDialog.value = true
}
const deleteEvent = (): void => {
	if (toDeleteIndex.value !== null) {
		events.value.splice(toDeleteIndex.value, 1)
		focusedEventId.value = null
	}
	deleteDialog.value = false
	toDeleteIndex.value = null
}


// Watch for time range changes
watch([viewStartTime, spanHours], () => {
	initializeEventGridPositions()
}, {deep: true})

// Lifecycle hooks
onMounted(() => {
	initializeEventGridPositions()
})

</script>

<style scoped>
.calendar-grid {
	background: rgb(var(--v-theme-neutral-100));
	display: grid;
	grid-template-columns: 80px 1fr;
	gap: 0;
	height: 600px;
	overflow-y: auto;
	border: 2px solid #444;
	padding: 10px 0;
}

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
}
</style>