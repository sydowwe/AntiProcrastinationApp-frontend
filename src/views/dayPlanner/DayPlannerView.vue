<template>
<v-card class="mx-auto w-100 w-lg-66 d-flex flex-column">
	<v-card-title class="d-flex justify-space-between align-center flex-wrap ga-2">
		<span>Daily Schedule - {{ currentDateFormatted }}</span>
		<div class="d-flex ga-4 align-center">
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
				label="Time frame (hours)"
				control-variant="split"
				density="compact"
				:min="1"
				:max="24"
				style="width: 150px"
				hideDetails
			></VNumberInput>
		</div>
		<div class="d-flex ga-2 align-center flex-wrap">
			<VBtn color="secondary" @pointerdown.prevent="openEditDialog" :class="{ 'is-hidden': !focusedEventId }">Edit</VBtn>
			<VBtn color="secondaryOutline" variant="outlined"
			      @pointerdown.prevent="toDeleteIndex = events.findIndex(e => e.id === focusedEventId);deleteDialog = true"
			      :class="{ 'is-hidden': !focusedEventId }">Delete
			</VBtn>
			<v-btn
				color="primary"
				@click="openCreateDialogEmpty"
				prepend-icon="plus"
			>
				Add New Event
			</v-btn>
		</div>
	</v-card-title>

	<v-card-text class="flex-fill d-flex flex-column ga-4">
		<div class="calendar-grid flex-fill">
			<!-- Time Column -->
			<div class="time-column" :style="{ gridTemplateRows: `repeat(${totalGridRows}, 22px)` }">
				<div v-for="(slot, index) in timeSlots" :key="index" class="time-slot">
				</div>
				<!-- Midnight divider -->
				<div
					v-if="midnightSlotIndex !== null"
					class="midnight-divider"
					:style="{ top: `${midnightSlotIndex * 22}px` }"
				>
					<span class="midnight-label">MIDNIGHT</span>
				</div>

				<div
					v-if="showCurrentTimeIndicator"
					class="current-time-divider"
					:style="{ top: `${(parseInt(currentTimeIndicatorStyle.gridRow?.toString().split(' ')[0] ?? '1') - 1) * 22}px` }"
				>
					<span class="current-time-label">{{ currentTimeFormatted }}</span>
				</div>

				<!-- Time labels overlay -->
				<div class="time-labels-overlay">
					<div v-for="(slot, index) in timeSlots" :key="index"
					     class="time-label-positioned"
					     :style="{ top: `${index * 22}px` }">
						{{ formatTime(slot) }}
					</div>
				</div>
			</div>

			<!-- Events Column -->
			<div
				ref="eventsColumnRef"
				:class="['events-column', {
					'no-touch-scroll': isCreating || draggingEventId !== null || resizingEventId !== null
				}]"
				:style="{ gridTemplateRows: `repeat(${totalGridRows}, 22px)` }"
				@pointerdown="handleColumnPointerDown"
				@pointermove="handleColumnPointerMove"
				@pointerup="handleColumnPointerUp"
			>
				<!-- Time Slots with hover effect -->
				<div v-for="(slot, index) in timeSlots" :key="index"
				     :class="['event-slot', {
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

				<div
					v-if="showCurrentTimeIndicator"
					class="current-time-indicator"
					:style="currentTimeIndicatorStyle"
				></div>

				<!-- Creation Preview -->
				<div
					v-if="isCreating && creationPreview"
					class="creation-preview"
					:style="creationPreviewStyle"
				>
					<span class="preview-time">{{ creationPreviewTime }}</span>
				</div>

				<!-- Event Blocks -->
				<template v-for="event in visibleEvents" :key="event.id">
					<VSheet v-if="event.isBackground" :color="event.color"
					        :style="eventBlockGridRowStyle(event)" :data-event-id="event.id"
					        :class="[
								'background-event-block',
								{'past-event': isEventPast(event)}
							]">
						<VSheet class="background-event-label" :color="event.color">
							{{ event.title }}
						</VSheet>
					</VSheet>
					<VSheet v-else
					        :color="`${event.color}E0`"
					        :style="[
								eventBlockGridRowStyle(event),
						     {	marginRight: `${event.isDuringBackgroundEvent ? 35 : 0}px`}
						    ]"
					        :class="[
						       'event-block',
						        eventBlockClasses(event),
					        ]"
					        :data-event-id="event.id"
					        :tabindex="0"
					        @keydown.enter="openEditDialog"
					        @keydown.esc="(e) => { (e.target as HTMLElement).blur(); focusedEventId = null; }"
					        @focus="focusedEventId = event.id"
					        @blur="focusedEventId = null"
					>

						<div
							class="resize-handle resize-handle-top"
							:data-event-id="event.id"
							@click.stop
						>
							<!--						<v-icon size="x-small" color="white" opacity="0.5">arrows-up-down</v-icon>-->
						</div>

						<div class="event-content">
							<div class="event-title">{{ event.title }}</div>
							<div class="event-time">{{ formatEventTime(event) }}</div>
							<v-chip
								v-if="event.category"
								size="x-small"
								variant="flat"
								:color="event.color"
								class="event-category-chip"
							>
								{{ event.category }}
							</v-chip>
						</div>

						<!-- Resize Handle -->
						<div
							class="resize-handle resize-handle-bottom"
							:data-event-id="event.id"
							@click.stop
						>
						</div>
					</VSheet>
				</template>
			</div>
		</div>

		<!-- Legend -->
		<div class="calendar-legend">
			<!--			<v-chip-->
			<!--				v-for="category in categories"-->
			<!--				:key="category.value"-->
			<!--				size="small"-->
			<!--				:color="category.color"-->
			<!--				variant="flat"-->
			<!--				class="mr-2"-->
			<!--			>-->
			<!--				{{ category.label }}-->
			<!--			</v-chip>-->
		</div>
	</v-card-text>
</v-card>

<MyDialog title="Delete confirmation" :text="`Are you sure you want to delete event ${toDeleteEvent?.title}?`" v-model="deleteDialog" @confirmed="deleteEvent"
          confirmBtnColor="error"></MyDialog>

<!-- Event Dialog -->
<MyDialog :title="dialogMode === 'create' ? 'Add New Event' : 'Edit Event'" v-model="dialog" :confirmBtnDisabled="!isFormValid" @confirmed="saveEvent"
          max-width="500px">
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
				<v-menu :close-on-content-click="false">
					<template v-slot:activator="{ props }">
						<v-text-field
							label="Start Time"
							:model-value="editingEvent.start"
							v-bind="props"
							variant="outlined"
							prepend-icon="clock"
							readonly
						>
						</v-text-field>
					</template>
					<template v-slot:default>
						<v-time-picker
							v-model="editingEvent.start"
							format="24hr"
							:allowed-minutes="allowedStep"
							scrollable
							:rules="[validateEndTime]"
						></v-time-picker>
					</template>
				</v-menu>
			</v-col>

			<v-col cols="12" sm="6">
				<v-menu :close-on-content-click="false">
					<template v-slot:activator="{ props }">
						<v-text-field
							label="End Time"
							:model-value="editingEvent.end"
							v-bind="props"
							variant="outlined"
							prepend-icon="clock"
							readonly
						>
						</v-text-field>
					</template>
					<template v-slot:default>
						<v-time-picker
							v-model="editingEvent.end"
							format="24hr"
							:allowed-minutes="allowedStep"
							scrollable
							:rules="[validateEndTime]"
						></v-time-picker>
					</template>
				</v-menu>
			</v-col>
			<VCol cols="12">
				<v-menu :close-on-content-click="false">
					<template v-slot:activator="{ props }">
						<v-btn
							class="pr-3"
							v-bind="props"
							variant="outlined"
							color="secondaryOutline"
							prepend-icon="palette"
							:readonly="dialogMode === 'edit'"
						>
							Color
							<VSheet :color="editingEvent.color" class="ml-2" rounded="xl" width="20" height="20"></VSheet>
						</v-btn>
					</template>
					<template v-slot:default>
						<v-color-picker
							v-model="editingEvent.color"
						></v-color-picker>
					</template>
				</v-menu>
			</VCol>

			<v-col cols="12" sm="6">
				<VSwitch label="Is background" color="primary" v-model="editingEvent.isBackground"></VSwitch>
			</v-col>
		</v-row>
	</v-container>
</MyDialog>

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
import {ref, computed, onMounted, onUnmounted, watch, type Ref} from 'vue'
import type {CleanupFn} from '@atlaskit/pragmatic-drag-and-drop/types';
import {type Category, type CreationPreview, EditedMyEvent, MyEvent, type PrefillDialog, type TimeSlot} from '@/classes/types/DayPlannerTypes.ts';
import {VColorInput} from 'vuetify/labs/components';
import MyDialog from '@/components/dialogs/MyDialog.vue';

const deleteDialog = ref(false)
// Constants
const currentDate = new Date()

// Time range state
const startTimeString = ref('9:30')
const startTime = computed(() => {
	const [hours, minutes] = startTimeString.value.split(':').map(Number)
	return {hours: hours ?? 0, minutes: minutes ?? 0}
})
const allowedStep = (m: number) => m % 10 === 0
const spanHours = ref(16)

const viewedTimeFrame = computed(() => {
	const totalMinutes = startTime.value.hours * 60 + startTime.value.minutes + spanHours.value * 60
	return {
		hours: Math.floor(totalMinutes / 60),
		minutes: totalMinutes % 60
	}
})

// Calculate total number of grid rows (slots)
// We need to account for the starting minutes and add one more slot to include the end time
const totalGridRows = computed(() => {
	const totalMinutes = spanHours.value * 60
	// Round up to include partial slots at the start, and add 1 for the final slot
	return Math.ceil(totalMinutes / 10)
})

// Detect which slot index represents midnight (00:00)
const midnightSlotIndex = computed(() => {
	if (startTime.value.hours === 0 && startTime.value.minutes === 0) return null // Already starts at midnight

	const hoursUntilMidnight = 24 - startTime.value.hours
	const minutesUntilMidnight = hoursUntilMidnight * 60 - startTime.value.minutes

	// Check if midnight is beyond our viewed timeframe
	const viewEndMinutes = viewedTimeFrame.value.hours * 60 + viewedTimeFrame.value.minutes
	const midnightMinutes = 24 * 60
	if (midnightMinutes >= viewEndMinutes) return null // Doesn't reach midnight

	// Calculate slot index for midnight
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
	new MyEvent(7, 'Work', '#4287f5', test_today + 'T07:00:00', test_today + 'T15:00:00', 'work', 0, 0, true, false),
	new MyEvent(1, 'Team Sync', '#9b4dca', test_today + 'T09:10:00', test_today + 'T09:50:00', 'meeting', 0, 0, false, true),
	new MyEvent(2, 'Design Review', '#4287f5', test_today + 'T10:30:00', test_today + 'T11:20:00', 'work', 0, 0, false, true),
	new MyEvent(3, 'Lunch Break', '#ff9f1a', test_today + 'T12:00:00', test_today + 'T13:00:00', 'break', 0, 0, false, true),
	new MyEvent(4, 'Client Call', '#e74c3c', test_today + 'T14:20:00', test_today + 'T15:00:00', 'urgent', 0, 0, false, true),
	new MyEvent(5, 'Code Review', '#4287f5', test_today + 'T15:30:00', test_today + 'T16:10:00', 'work', 0, 0, false, false),
	new MyEvent(6, 'TEST next day', '#4287f5', test_today + 'T23:30:00', '2025-10-06T01:10:00', 'work', 0, 0, false, false)
] as MyEvent[])

// Refs
const eventsColumnRef = ref<HTMLElement | null>(null)

// Current time state
const currentTime = ref(new Date())
const currentTimeInterval = ref<ReturnType<typeof setInterval> | null>(null)

// Dialog state
const dialog = ref(false)
const dialogMode = ref<'create' | 'edit'>('create')
const editingEvent = ref<EditedMyEvent>(new EditedMyEvent())

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
	const endHour = viewedTimeFrame.value.hours
	const endMinute = viewedTimeFrame.value.minutes

	// If end hour is >= 24, it spans to the next day
	if (endHour >= 24) {
		viewEndDate.setDate(viewEndDate.getDate() + Math.floor(endHour / 24))
		viewEndDate.setHours(endHour % 24, endMinute, 0, 0)
	} else {
		viewEndDate.setHours(endHour, endMinute, 0, 0)
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
	const startMinutes = startTime.value.hours * 60 + startTime.value.minutes
	const endMinutes = viewedTimeFrame.value.hours * 60 + viewedTimeFrame.value.minutes

	// Generate slots from start to end (including the end slot)
	for (let totalMins = startMinutes; totalMins <= endMinutes; totalMins += 10) {
		const hour = Math.floor(totalMins / 60) % 24
		const minute = totalMins % 60
		slots.push({hour, minute})
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

// Filter events that have at least one slot visible in the frame after clamping
const visibleEvents = computed(() => {
	return events.value.filter(event => {
		// Check if the clamped grid positions result in at least one visible slot
		return event.gridRowStart >= 1 &&
			event.gridRowEnd <= totalGridRows.value &&
			event.gridRowStart <= event.gridRowEnd
	})
})

// Form validation
const isFormValid = computed(() => {
	return !!editingEvent.value.title &&
		!!editingEvent.value.start &&
		!!editingEvent.value.end &&
		editingEvent.value.start < editingEvent.value.end
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

const formatEventTime = (event: MyEvent): string => {
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

const eventBlockGridRowStyle = computed(() => (event: MyEvent) => ({
	gridRow: `${event.gridRowStart} / span ${(event.gridRowEnd || 1) - (event.gridRowStart || 1) + 1}`,
}))

const eventBlockClasses = computed(() => (event: MyEvent) => ({
	'dragging': draggingEventId.value === event.id,
	'resizing': event.id === draggingEventId.value,
	'past-event': isEventPast(event),
	'focused': focusedEventId.value === event.id,
	'conflict': dragConflict.value && draggingEventId.value === event.id,
	'no-hover': isAnyEventBeingManipulated.value,
}))

const isEventPast = (event: MyEvent): boolean => {
	const endDate = new Date(event.end)
	return endDate < currentTime.value
}

const initializeEventGridPositions = () => {
	events.value.forEach(event => {
		const startDate = new Date(event.start)
		const endDate = new Date(event.end)

		const viewStartDate = new Date(currentDate)
		viewStartDate.setHours(startTime.value.hours, startTime.value.minutes, 0, 0)

		const viewEndDate = new Date(currentDate)
		const endHour = viewedTimeFrame.value.hours
		const endMinute = viewedTimeFrame.value.minutes

		// If end hour is >= 24, it spans to the next day
		if (endHour >= 24) {
			viewEndDate.setDate(viewEndDate.getDate() + Math.floor(endHour / 24))
			viewEndDate.setHours(endHour % 24, endMinute, 0, 0)
		} else {
			viewEndDate.setHours(endHour, endMinute, 0, 0)
		}

		const minutesFromViewStart = Math.floor((startDate.getTime() - viewStartDate.getTime()) / 60000)
		const startRow = Math.floor(minutesFromViewStart / 10) + 1

		const minutesFromViewStartToEnd = Math.floor((endDate.getTime() - viewStartDate.getTime()) / 60000)
		const endRow = Math.floor(minutesFromViewStartToEnd / 10)

		// Clamp to visible frame: gridRowStart min is 1, gridRowEnd max is totalGridRows
		event.gridRowStart = Math.max(1, startRow)
		event.gridRowEnd = Math.min(totalGridRows.value, endRow)
	})
}

// Check for event conflicts
const checkEventConflict = (eventId: number, newStart: string, newEnd: string): boolean => {
	return events.value.some(event => {
		if (event.id === eventId) return false
		// Background events don't conflict
		if (event.isBackground) return false

		const existingStart = new Date(event.start)
		const existingEnd = new Date(event.end)
		const checkStart = new Date(newStart)
		const checkEnd = new Date(newEnd)

		// Check if there's any overlap
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

		// Check if there's any overlap
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

		// Check if there's any overlap
		if (eventStart < bgEndDate && eventEnd > bgStartDate) {
			event.isDuringBackgroundEvent = true
		}
	})
}

// Convert slot index to time string
const slotIndexToTime = (index: number): string => {
	const totalMinutes = index * 10 + startTime.value.minutes
	const hours = Math.floor(totalMinutes / 60) + startTime.value.hours
	const minutes = totalMinutes % 60

	return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

const timeToSlotIndex = (time: string): number => {
	const [hours, minutes] = time.split(':').map(Number)
	const totalMinutes = (hours - startTime.value.hours) * 60 + (minutes - startTime.value.minutes)
	return Math.floor(totalMinutes / 10)
}

// Calculate new time based on slot index
const calculateDateTimeFromSlotIndex = (slotIndex: number): string => {
	return `${test_today}T${slotIndexToTime(slotIndex)}:00`
}

// Convert position to slot index
const getSlotIndexFromPosition = (y: number): number => {
	if (!eventsColumnRef.value) return 0

	const rect = eventsColumnRef.value.getBoundingClientRect()
	const relativeY = y - rect.top
	const slotHeight = rect.height / timeSlots.value.length

	return Math.max(0, Math.min(timeSlots.value.length - 1, Math.floor(relativeY / slotHeight)))
}


// Validate end time
const validateEndTime = (value: string): string | boolean => {
	if (!value) return 'End time is required'
	if (editingEvent.value.start && value <= editingEvent.value.start) {
		return 'End time must be after start time'
	}
	return true
}

const openCreateDialogEmpty = (): void => {
	dialogMode.value = 'create'
	editingEvent.value = new EditedMyEvent();
	dialog.value = true
}

// Dialog functions
const openCreateDialog = (prefillTimes: PrefillDialog): void => {
	dialogMode.value = 'create'
	editingEvent.value = new EditedMyEvent(
		undefined,
		undefined,
		undefined,
		prefillTimes.startTime,
		prefillTimes.endTime,
		'work',
		prefillTimes.gridRowStart,
		prefillTimes.gridRowEnd,
	)
	dialog.value = true
}

const openEditDialog = (): void => {

	if (draggingEventId.value) return

	const event = events.value.find(e => e.id === focusedEventId.value)
	if (!event) return

	dialogMode.value = 'edit'
	const startDate = new Date(event.start)
	const endDate = new Date(event.end)

	editingEvent.value = new EditedMyEvent(
		event.id,
		event.title,
		event.color,
		startDate.toTimeString().slice(0, 5),
		endDate.toTimeString().slice(0, 5),
		event.category || 'work',
		event.gridRowStart,
		event.gridRowEnd
	)
	dialog.value = true
}

const saveEvent = (): void => {
	if (!isFormValid.value) return


	const today = test_today
	if (dialogMode.value === 'create') {
		// Create new event
		const newId = events.value.length > 0 ? Math.max(...events.value.map(e => e.id)) + 1 : 1

		const newEvent: MyEvent = {
			...editingEvent.value,
			id: newId,
			start: `${today}T${editingEvent.value.start}:00`,
			end: `${today}T${editingEvent.value.end}:00`,
			gridRowStart: editingEvent.value.gridRowStart ?? timeToSlotIndex(editingEvent.value.start) + 1,
			gridRowEnd: editingEvent.value.gridRowEnd ?? timeToSlotIndex(editingEvent.value.end)
		}

		// If creating a background event, update overlapsBackground flags for all normal events
		if (newEvent.isBackground) {
			updateOverlapsBackgroundFlags(newEvent.start, newEvent.end)
		} else {
			if (checkEventConflict(newId, newEvent.start, newEvent.end)) {
				conflictSnackbar.value = true
				return
			}
			// If creating a normal event, check if it overlaps with any background event
			newEvent.isDuringBackgroundEvent = checkOverlapsBackground(newEvent.start, newEvent.end)
		}

		events.value.push(newEvent)
	} else {
		// Edit existing event
		const eventIndex = events.value.findIndex(e => e.id === editingEvent.value.id)
		if (eventIndex !== -1) {
			console.log(editingEvent.value)
			console.log(timeToSlotIndex(editingEvent.value.start ?? ''));
			events.value[eventIndex] = {
				...editingEvent.value,
				start: `${today}T${editingEvent.value.start}:00`,
				end: `${today}T${editingEvent.value.end}:00`,
				gridRowStart: timeToSlotIndex(editingEvent.value.start) + 1,
				gridRowEnd: timeToSlotIndex(editingEvent.value.end)
			}
		}
	}

	dialog.value = false
}

const toDeleteIndex = ref<number | null>(null);
const toDeleteEvent = computed(() => toDeleteIndex.value ? events.value[toDeleteIndex.value] : null);

const deleteEvent = (): void => {
	if (toDeleteIndex.value) {
		events.value.splice(toDeleteIndex.value, 1)
	}
	deleteDialog.value = false
}

// Resize state
const resizingEventId = ref<number | null>(null)
const resizeStartSlot = ref<number | null>(null)
const resizePreview = ref<CreationPreview | null>(null)
const resizeDirection = ref<'top' | 'bottom' | null>(null)

const draggingEventId = ref<number | null>(null)
const dragConflict = ref(false)
const originalEventState = ref<MyEvent | null>(null)
const focusedEventId = ref<number | null>(null)
const dragStartSlot = ref<number | null>(null)
const dragOffset = ref<number>(0)

// Auto-scroll state
const autoScrollInterval = ref<ReturnType<typeof setInterval> | null>(null)
const autoScrollSpeed = ref<number>(0)
const SCROLL_THRESHOLD = 30 // pixels from edge to trigger scroll
const MAX_SCROLL_SPEED = 15 // pixels per frame

// Auto-scroll functionality
const handleAutoScroll = (clientY: number): void => {
	if (!eventsColumnRef.value) return

	const calendarGrid = eventsColumnRef.value.closest('.calendar-grid') as HTMLElement
	if (!calendarGrid) return

	const rect = calendarGrid.getBoundingClientRect()
	const distanceFromTop = clientY - rect.top
	const distanceFromBottom = rect.bottom - clientY

	// Clear existing interval
	if (autoScrollInterval.value) {
		clearInterval(autoScrollInterval.value)
		autoScrollInterval.value = null
	}

	// Check if near top edge
	if (distanceFromTop < SCROLL_THRESHOLD && distanceFromTop > 0) {
		const intensity = 1 - (distanceFromTop / SCROLL_THRESHOLD)
		autoScrollSpeed.value = -intensity * MAX_SCROLL_SPEED

		autoScrollInterval.value = setInterval(() => {
			if (calendarGrid) {
				calendarGrid.scrollTop += autoScrollSpeed.value
			}
		}, 16) // ~60fps
	}
	// Check if near bottom edge
	else if (distanceFromBottom < SCROLL_THRESHOLD && distanceFromBottom > 0) {
		const intensity = 1 - (distanceFromBottom / SCROLL_THRESHOLD)
		autoScrollSpeed.value = intensity * MAX_SCROLL_SPEED

		autoScrollInterval.value = setInterval(() => {
			if (calendarGrid) {
				calendarGrid.scrollTop += autoScrollSpeed.value
			}
		}, 16) // ~60fps
	}
}

const stopAutoScroll = (): void => {
	if (autoScrollInterval.value) {
		clearInterval(autoScrollInterval.value)
		autoScrollInterval.value = null
	}
	autoScrollSpeed.value = 0
}

// Click and drag to create new events
const handleColumnPointerDown = (e: PointerEvent): void => {
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

	// Check if clicking on an event to drag it
	const eventBlock = target.closest('.event-block') as HTMLElement
	if (eventBlock && !eventBlock.classList.contains('background-event-block')) {
		const eventId = parseInt(eventBlock.dataset.eventId || '0')
		const event = events.value.find(ev => ev.id === eventId)
		if (!event || event.isBackground) return

		// Start dragging
		draggingEventId.value = eventId
		originalEventState.value = { ...event }

		// Calculate where within the event block the pointer is
		const slotIndex = getSlotIndexFromPosition(e.clientY)
		dragStartSlot.value = slotIndex
		dragOffset.value = slotIndex - (event.gridRowStart - 1)

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

const handleColumnPointerMove = (e: PointerEvent): void => {
	// Handle dragging
	if (draggingEventId.value !== null && dragStartSlot.value !== null && originalEventState.value) {
		// Trigger auto-scroll if near edges
		handleAutoScroll(e.clientY)

		const currentSlot = getSlotIndexFromPosition(e.clientY)
		const event = events.value.find(ev => ev.id === draggingEventId.value)
		if (!event) return

		// Calculate new position
		const eventDuration = originalEventState.value.gridRowEnd - originalEventState.value.gridRowStart
		const newStartRow = currentSlot - dragOffset.value + 1
		const newEndRow = newStartRow + eventDuration

		// Check if the new position fits within the view
		const fitsInView = newStartRow >= 1 && newEndRow <= totalGridRows.value

		// Check for conflicts with other events
		const hasConflict = events.value.some(ev => {
			if (ev.id === draggingEventId.value || ev.isBackground) return false
			// Check if the new position overlaps with any event
			return !(newEndRow < ev.gridRowStart || newStartRow > ev.gridRowEnd)
		})

		// Update conflict state
		dragConflict.value = hasConflict || !fitsInView

		// Update the event's grid position regardless of conflict
		event.gridRowStart = newStartRow
		event.gridRowEnd = newEndRow

		// Update the event's actual times
		event.start = calculateDateTimeFromSlotIndex(newStartRow - 1)
		event.end = calculateDateTimeFromSlotIndex(newEndRow)

		event.isDuringBackgroundEvent = checkOverlapsBackground(event.start, event.end)
		return
	}

	// Handle resizing
	if (resizingEventId.value !== null && resizeStartSlot.value !== null && resizePreview.value && resizeDirection.value) {
		const slotIndex = getSlotIndexFromPosition(e.clientY)
		const eventIndex = events.value.findIndex(ev => ev.id === resizingEventId.value)
		const event = events.value[eventIndex]
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
				const nextEvent = events.value[eventIndex + 1]
				if (nextEvent && nextEvent.gridRowStart <= newEndRow && newEndRow >= event.gridRowEnd) {
					return
				}
				event.gridRowEnd = newEndRow
				event.end = calculateDateTimeFromSlotIndex(newEndRow)
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
				const prevEvent = events.value[eventIndex - 1]
				console.log(prevEvent.gridRowStart, prevEvent.gridRowEnd)
				console.log(newStartRow)
				if (prevEvent && prevEvent.gridRowStart <= newStartRow && newStartRow <= prevEvent.gridRowEnd) {
					return
				}

				event.gridRowStart = newStartRow
				event.start = calculateDateTimeFromSlotIndex(newStartRow - 1)
			}
		}
		event.isDuringBackgroundEvent = checkOverlapsBackground(event.start, event.end)
		return
	}

	// Handle creation
	if (!isCreating.value || creationStart.value === null) return

	creationEnd.value = getSlotIndexFromPosition(e.clientY)

	const startRow = Math.min(creationStart.value, creationEnd.value) + 1
	const endRow = Math.max(creationStart.value, creationEnd.value) + 1

	const hasConflict = events.value.some(ev => {
		if (ev.isBackground) return false
		// Check if the creation preview overlaps with any event
		return !(endRow + 1 <= ev.gridRowStart || startRow - 1 >= ev.gridRowEnd)
	})

	if (hasConflict) {
		return
	}

	creationPreview.value = {
		startRow,
		endRow
	}
}


const handleColumnPointerUp = (_e: PointerEvent): void => {
	// Stop auto-scrolling
	stopAutoScroll()

	// Handle drag end
	if (draggingEventId.value !== null && originalEventState.value) {
		const event = events.value.find(ev => ev.id === draggingEventId.value)

		if (event && (dragConflict.value || event.gridRowStart < 1 || event.gridRowEnd > totalGridRows.value)) {
			// Revert to original position if there's a conflict or out of bounds
			Object.assign(event, originalEventState.value)
			conflictSnackbar.value = true
		}

		// Reset drag state
		draggingEventId.value = null
		dragStartSlot.value = null
		dragOffset.value = 0
		dragConflict.value = false
		originalEventState.value = null
		return
	}

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

	// Open dialog with pre-filled times
	const startTime = slotIndexToTime(creationPreview.value!.startRow - 1)
	const endTime = slotIndexToTime(creationPreview.value!.endRow)

	openCreateDialog({
		startTime,
		endTime,
		gridRowStart: creationPreview.value!.startRow,
		gridRowEnd: creationPreview.value!.endRow
	})

	// Reset creation state
	isCreating.value = false
	creationStart.value = null
	creationEnd.value = null
	creationPreview.value = null
}

const updateCurrentTime = () => {
	currentTime.value = new Date()
}

// Watch for time range changes
watch([startTime, spanHours], () => {
	initializeEventGridPositions()
}, {deep: true})

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

	// Clear intervals
	if (currentTimeInterval.value) {
		clearInterval(currentTimeInterval.value)
	}

	stopAutoScroll()
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

.events-column {
	display: grid;
	position: relative;
	background: rgb(var(--v-theme-neutral-200));
	user-select: none;
	cursor: crosshair;
}

.events-column.no-touch-scroll {
	touch-action: none;
}

.time-column {
	display: grid;
	background: rgb(var(--v-theme-neutral-100));
	position: relative;
}

.time-slot:not(:nth-of-type(3n+1)) {
	margin-right: 2px;
}

.time-labels-overlay {
	position: absolute;
	left: 0;
	right: 0;
	pointer-events: none;
}

.time-label-positioned {
	position: absolute;
	right: 20px;
	transform: translateY(-50%);
	color: #FFF;
	font-weight: 400;
	background: rgb(var(--v-theme-neutral-100));
	padding: 0 1px;
	font-size: 13px;
}

.time-label-positioned:nth-of-type(3n+1) {
	font-weight: 500;
	font-size: 15px;
}

.midnight-divider {
	position: absolute;
	left: 0;
	right: 0;
	height: 3px;
	background: rgb(15, 39, 124);
	z-index: 20;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 2px 8px rgba(156, 39, 176, 0.4);
}

.midnight-label {
	position: absolute;
	top: -8px;
	background: rgb(15, 39, 124);
	color: white;
	padding: 2px 5px;
	border-radius: 4px;
	font-size: 10px;
	font-weight: 500;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.midnight-divider-events {
	position: absolute;
	left: 0;
	right: 0;
	height: 3px;
	background: rgb(15, 39, 124);
	z-index: 20;
	pointer-events: none;
}

.time-slot {
	border-top: 2px dotted #999;
}

.time-slot:nth-of-type(3n+1) {
	border-top-style: solid;
}

.event-slot {
	border-top: 2px dotted #999;
	transition: background-color 0.2s ease;
}

.event-slot:nth-of-type(3n+1) {
	border-top-style: solid;
}


.event-slot.hoverable:hover {
	background-color: rgba(0, 0, 0, 0.02);
	cursor: cell;
}

.current-time-divider {
	position: absolute;
	left: 0;
	right: 0;
	height: 3px;
	background: rgb(var(--v-theme-secondary));
	z-index: 20;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 2px 8px rgba(var(--v-theme-secondary), 0.4);
}

.current-time-label {
	position: absolute;
	top: -8px;
	background: rgb(var(--v-theme-secondary));
	color: white;
	padding: 2px 8px;
	border-radius: 4px;
	font-size: 10px;
	font-weight: 700;
	letter-spacing: 0.5px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

/* Current Time Indicator */
.current-time-indicator {
	position: absolute;
	left: 0;
	right: 0;
	height: 3px;
	background: linear-gradient(90deg, rgb(var(--v-theme-secondary)) 0%, rgb(var(--v-theme-primary)) 100%);
	z-index: 20;
	pointer-events: none;
	box-shadow: 0 2px 8px rgba(var(--v-theme-secondary), 0.5);
}

/* Event Block Styles */
.event-block {
	position: absolute;
	top: 2px;
	left: 0;
	right: 0;
	bottom: 0;
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
	transform: scalex(1.015);
	right: 0.75%;
	z-index: 11;
	border: 3px solid #ffffff;
	box-shadow: 0 0 0 3px rgba(25, 118, 210, 0.2);
}

.event-block.dragging {
	z-index: 100;
	filter: brightness(0.9);
	cursor: grabbing !important;
}

.event-block.conflict {
	opacity: 0.7 !important;
	background: rgba(244, 67, 54, 0.7) !important;
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

.event-block:not(.background-event):not(.no-hover):hover {
	transform: scalex(1.015);
	right: 0.75%;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
	z-index: 11;
	cursor: grab;
}

.event-block.past-event {
	filter: grayscale(30%) brightness(0.9);
}

.event-block.past-event:hover {
	filter: grayscale(20%) brightness(0.95);
}

.event-content {
	flex: 1;
	padding: 7px 15px;
	cursor: pointer;
	min-height: 0;
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-content: start;
	flex-wrap: wrap;
	row-gap: 3px;
	column-gap: 20px;
}

.event-title {
	font-weight: 500;
	font-size: 13px;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
	line-height: 1.2;
	opacity: 1;
}

.event-time {
	font-size: 11px;
	opacity: 1;
	white-space: nowrap;
	overflow: hidden;
	text-overflow: ellipsis;
}

.event-category-chip {
	margin-top: 2px;
}

.resize-handle {
	position: absolute;
	width: 100%;
	height: 10px;
	background: rgba(0, 0, 0, 0.1);
	cursor: ns-resize;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: background 0.2s ease;
	flex-shrink: 0;
}

.resize-handle-bottom {
	bottom: 0;
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

.background-event-block {
	position: absolute;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
	transition: all 0.2s ease;
	right: 0;
	top: 2px;
	bottom: 0;
	z-index: 5;
}

.background-event-block::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: repeating-linear-gradient(
		135deg,
		transparent 10px,
		transparent 10px,
		rgba(255, 255, 255, 0.5) 20px,
		rgba(255, 255, 255, 0.5) 20px
	);
	pointer-events: none;
	z-index: 1;
	opacity: 0.9;

}

.background-event-label {
	color: white;
	position: sticky;
	z-index: 20;
	opacity: 100%;
	top: 46%;
	padding: 7px 7px;
	writing-mode: sideways-lr;
	font-size: 15px;
	font-weight: 600;
}
</style>