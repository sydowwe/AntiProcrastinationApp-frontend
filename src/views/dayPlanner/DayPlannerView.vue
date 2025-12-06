<!-- DayPlannerView.vue -->
<template>
<DayPlanner
	:plannerStore="store"
	:slotIndexToTimeValue="store.dateTimeFromSlotIndex"
	:title="currentDateFormatted"
	addButtonText="Add New Event"
	@updatedTaskSpan="handleUpdateTaskSpan"
	@delete="del"
>
	<!-- Custom event block for normal planner -->
	<template #event-block="{ event, onResizeStart }">
		<EventBlock
			:event="event"
			@resizeStart="onResizeStart"
		/>
	</template>

	<!-- Custom dialog for normal planner -->
	<template #dialog>
		<EventDialog
			@create="create"
			@edit="edit"
		/>
	</template>
</DayPlanner>
</template>

<script setup lang="ts">
import {computed, onMounted, watch} from 'vue'
import DayPlanner from '@/components/dayPlanner/DayPlanner.vue'
import EventDialog from '@/components/dayPlanner/EventDialog.vue'
import EventBlock from '@/components/dayPlanner/EventBlock.vue'
import {useMoment} from '@/scripts/momentHelper.ts';
import {Role} from '@/dtos/response/Role';
import {Category} from '@/dtos/response/Category';
import {useDayPlannerStore} from '@/stores/dayPlanner/dayPlannerStore.ts';
import {useTaskPlannerCrud} from '@/composables/ConcretesCrudComposable.ts';
import {PlannerTask} from '@/dtos/response/activityPlanning/PlannerTask.ts';
import type {PlannerTaskRequest} from '@/dtos/request/activityPlanning/PlannerTaskRequest.ts';

const {createWithResponse, update, fetchById} = useTaskPlannerCrud()
const {formatToDateWithDay, formatLocalized} = useMoment()
const store = useDayPlannerStore()
const test_today = formatLocalized(store.viewedDate, 'YYYY-MM-DD')

const role = new Role(1, "Work", "praca - homeoffice alebo office", "#4c45ec", 'briefcase');
const codingCategory = new Category(1, "Coding", "coding", "#4287f5", 'code');


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

function handleUpdateTaskSpan(payload: { eventId: number; updates: Partial<PlannerTask> }): void {
	const {eventId, updates} = payload
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

async function del(): Promise<void> {
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
/* View-specific styles if needed */
</style>