<!-- DayPlannerView.vue -->
<template>
<VCard class="mx-auto w-100 w-lg-66 d-flex flex-column">
	<VCardTitle class="d-flex justify-space-between align-center flex-wrap ga-2">
		<span>{{ currentDateFormatted }}</span>

		<TimeRangePicker
			v-model:start="store.viewStartTime"
			v-model:end="store.viewEndTime"
		/>
		<div class="d-flex ga-2 align-center flex-wrap">
			<VBtn
				color="secondary"
				@pointerdown.prevent="store.openEditDialog"
				:class="{ 'is-hidden': !store.focusedEventId }"
			>
				Edit
			</VBtn>
			<VBtn
				color="secondaryOutline"
				variant="outlined"
				@pointerdown.prevent="store.openDeleteDialog"
				:class="{ 'is-hidden': !store.focusedEventId }"
			>
				Delete
			</VBtn>
			<VBtn
				color="primary"
				@click="store.openCreateDialogEmpty"
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
			<EventsColumn @updatedTaskSpan="handleUpdateTaskSpan">

			</EventsColumn>
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
	:text="`Are you sure you want to delete event ${store.toDeleteEvent?.activity.name}?`"
	v-model="store.deleteDialog"
	@confirmed="del"
	confirmBtnColor="error"
/>

<!-- Event Dialog -->
<EventDialog
	@create="create"
	@edit="edit"
/>

<!-- Conflict Snackbar -->
<VSnackbar
	v-model="store.conflictSnackbar"
	color="error"
	:timeout="3000"
>
	Event conflicts with existing schedule!
	<template v-slot:actions>
		<VBtn
			variant="text"
			@click="store.conflictSnackbar = false"
		>
			Close
		</VBtn>
	</template>
</VSnackbar>
</template>

<script setup lang="ts">
import {computed, onMounted, watch} from 'vue'
import MyDialog from '@/components/dialogs/MyDialog.vue'
import EventDialog from '@/components/dayPlanner/EventDialog.vue'
import TimeColumn from '@/components/dayPlanner/TimeColumn.vue'
import EventsColumn from '@/components/dayPlanner/EventsColumn.vue'
import TimeRangePicker from '@/components/general/dateTime/TimeRangePicker.vue';
import {useMoment} from '@/scripts/momentHelper.ts';
import {PlannerTask, PlannerTaskRequest} from '@/classes/PlannerTask.ts';
import {Activity} from '@/classes/Activity.ts';
import {Role} from '@/classes/Role.ts';
import {Category} from '@/classes/Category.ts';
import {useDayPlannerStore} from '@/stores/dayPlannerStore.ts';
import {useTaskPlannerCrud} from '@/composables/ConcretesCrudComposable.ts';

const {createWithResponse, update, fetchById} = useTaskPlannerCrud()
const {formatToDateWithDay, formatLocalized} = useMoment()
const store = useDayPlannerStore()
const test_today = formatLocalized(store.viewedDate, 'YYYY-MM-DD')

const role = new Role(1, "Work", "praca - homeoffice alebo office", "#4c45ec", 'briefcase');
const codingCategory = new Category(1, "Coding", "coding", "#4287f5", 'code');

// Sample events data - initialize store
store.events = [
	new PlannerTask(7, new Activity(1, 'Work', null, true, role, null), '#4287f5', new Date(test_today + 'T07:00:00'), new Date(test_today + 'T15:00:00'), false, true, false, 0, 0),
	new PlannerTask(1, new Activity(2, 'Team Sync', null, false, role, null), '#9b4dca', new Date(test_today + 'T09:10:00'), new Date(test_today + 'T09:50:00'), false, false, true, 0, 0),
	new PlannerTask(2, new Activity(3, 'Design Review', null, false, role, codingCategory), '#4287f5', new Date(test_today + 'T10:30:00'), new Date(test_today + 'T11:20:00'), false, false, true, 0, 0),
	new PlannerTask(3, new Activity(4, 'Lunch Break', null, false, role, null), '#ff9f1a', new Date(test_today + 'T12:00:00'), new Date(test_today + 'T13:00:00'), false, false, true, 0, 0),
	new PlannerTask(4, new Activity(5, 'Client Call', null, false, role, null), '#e74c3c', new Date(test_today + 'T14:20:00'), new Date(test_today + 'T15:00:00'), false, false, true, 0, 0),
	new PlannerTask(5, new Activity(6, 'Code Review', null, false, role, codingCategory), '#4287f5', new Date(test_today + 'T15:30:00'), new Date(test_today + 'T16:10:00'), false, false, false, 0, 0),
	new PlannerTask(6, new Activity(7, 'TEST next day', null, false, new Role(), null), '#4287f5', new Date(test_today + 'T23:30:00'), new Date('2025-10-06T01:10:00'), false, false, false, 0, 0)
] as PlannerTask[]

// Computed properties
const currentDateFormatted = computed(() => {
	return formatToDateWithDay(store.viewedDate)
})

function setGridPositionFromSpan(event: PlannerTask) {
	const startDate = event.start
	const endDate = event.end

	const viewStartDate = new Date(store.viewedDate)
	viewStartDate.setHours(store.viewStartTime.hours, store.viewStartTime.minutes, 0, 0)

	const minutesFromViewStart = Math.floor((startDate.getTime() - viewStartDate.getTime()) / 60000)
	const startRow = Math.floor(minutesFromViewStart / 10) + 1

	const minutesFromViewStartToEnd = Math.floor((endDate.getTime() - viewStartDate.getTime()) / 60000)
	const endRow = Math.floor(minutesFromViewStartToEnd / 10)

	event.gridRowStart = Math.max(1, startRow)
	event.gridRowEnd = Math.min(store.totalGridRows, endRow)
}

function handleUpdateTaskSpan(
	eventId: number,
	updates: Partial<PlannerTask>
): void {
	const eventIndex = store.events.findIndex(e => e.id === eventId)
	if (eventIndex === -1) return

	if (!store.events[eventIndex]) {
		return
	}
	store.events[eventIndex] = {
		...store.events[eventIndex],
		...updates
	}

	if (updates.start || updates.end) {
		const event = store.events[eventIndex]
		event.isDuringBackgroundEvent = checkOverlapsBackground(event.start, event.end)
	}
}

function checkOverlapsBackground(start: Date | string, end: Date | string): boolean {
	return store.events.some(event => {
		if (!event.isBackground) return false

		const bgStart = event.start
		const bgEnd = event.end
		const checkStart = start instanceof Date ? start : new Date(start)
		const checkEnd = end instanceof Date ? end : new Date(end)

		return (checkStart < bgEnd && checkEnd > bgStart)
	})
}

function checkConflict(newStart: Date, newEnd: Date, currentEventId?: number): boolean {
	return store.events.some(event => {
		if (event.id === currentEventId || event.isBackground)
			return false

		return (newStart < event.end && newEnd > event.start)
	})
}

function updateOverlapsBackgroundFlags(bgStart: Date | string, bgEnd: Date | string): void {
	store.events.forEach(event => {
		if (event.isBackground) return

		const eventStart = event.start
		const eventEnd = event.end
		const bgStartDate = bgStart instanceof Date ? bgStart : new Date(bgStart)
		const bgEndDate = bgEnd instanceof Date ? bgEnd : new Date(bgEnd)

		if (eventStart < bgEndDate && eventEnd > bgStartDate) {
			event.isDuringBackgroundEvent = true
		}
	})
}

function initializeEventGridPositions() {
	store.events.forEach(event => {
		setGridPositionFromSpan(event)
	})
}

async function create(request: PlannerTaskRequest) {
	if (!request.isBackground) {
		if (checkConflict(request.start, request.end)) {
			store.conflictSnackbar = true
			return
		}
	}
	const response = await createWithResponse(request)

	if (response.isBackground) {
		updateOverlapsBackgroundFlags(response.start, response.end)
	} else {
		response.isDuringBackgroundEvent = checkOverlapsBackground(
			response.start,
			response.end
		)
	}
	setGridPositionFromSpan(response)
	store.events.push(response)
}

async function edit(id: number, request: PlannerTaskRequest) {
	if (!request.isBackground) {
		if (checkConflict(request.start, request.end, id)) {
			store.conflictSnackbar = true
			return
		}
	}
	const index = store.events.findIndex(e => e.id === id)
	let updatedItem = store.events[index]
	if (!updatedItem)
		return

	await update(id, request)

	if (request.isBackground !== updatedItem.isBackground) {
		updateOverlapsBackgroundFlags(request.start, request.end)
	}

	updatedItem = await fetchById(id)

	if (request.isBackground) {
		updatedItem.isDuringBackgroundEvent = checkOverlapsBackground(
			updatedItem.start,
			updatedItem.end
		)
	}
	setGridPositionFromSpan(updatedItem)

	store.events[index] = updatedItem
}

function del(): void {
	if (store.toDeleteIndex !== null) {
		store.events.splice(store.toDeleteIndex, 1)
		store.focusedEventId = null
	}
	store.deleteDialog = false
	store.toDeleteIndex = null
}

// Watch for time range changes
watch([() => store.viewStartTime, () => store.viewEndTime], () => {
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