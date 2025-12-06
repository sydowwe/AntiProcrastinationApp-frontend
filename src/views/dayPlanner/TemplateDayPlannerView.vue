<!-- TemplateDayPlannerView.vue -->
<template>
<DayPlanner
	:plannerStore="store"
	:slotIndexToTimeValue="store.timeStringFromSlotIndex"
	:title="store.templateName || 'Day Template'"
	addButtonText="Add New Task"
	conflictMessage="Task conflicts with existing schedule!"
	@updatedTaskSpan="handleUpdateTaskSpan"
	@delete="del"
>
	<!-- Custom event block for template planner -->
	<template #event-block="{ event, onResizeStart }">
		<TemplateEventBlock
			:event="event"
			@resizeStart="onResizeStart"
		/>
	</template>

	<!-- Custom dialog for template planner -->
	<template #dialog>
		<PlannerTaskTemplateDialog
			v-model:dialog="store.dialog"
			:editingTask="store.editingEvent"
			:isEdit="isEdit"
			:editedId="store.editedId"
			@create="create"
			@edit="edit"
		/>
	</template>
</DayPlanner>
</template>

<script setup lang="ts">
import {computed, onMounted, watch} from 'vue'
import DayPlanner from '@/components/dayPlanner/DayPlanner.vue'
import PlannerTaskTemplateDialog from '@/components/dayPlanner/template/PlannerTaskTemplateDialog.vue'
import TemplateEventBlock from '@/components/dayPlanner/template/TemplateEventBlock.vue'
import {useTemplateDayPlannerStore} from '@/stores/dayPlanner/templateDayPlannerStore.ts'
import {useTemplatePlannerTaskCrud} from '@/composables/ConcretesCrudComposable.ts'
import {TemplatePlannerTask} from '@/dtos/response/activityPlanning/template/TemplatePlannerTask'
import {TemplatePlannerTaskRequest} from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskRequest'
import {Time} from '@/utils/TimeUtils'

const {createWithResponse, update, fetchById, deleteEntity} = useTemplatePlannerTaskCrud()
const store = useTemplateDayPlannerStore()

const isEdit = computed(() => store.editedId !== undefined)

// Helper function to convert time string to slot index for grid positioning
function setGridPositionFromTimeSpan(event: TemplatePlannerTask & { gridRowStart?: number; gridRowEnd?: number }): void {
	const startTime = Time.fromString(event.startTime)
	const endTime = Time.fromString(event.endTime)

	const viewStartMinutes = store.viewStartTime.getInMinutes
	let startMinutes = startTime.getInMinutes
	let endMinutes = endTime.getInMinutes

	// Handle overnight spans
	if (startMinutes < viewStartMinutes) {
		startMinutes += 24 * 60
	}
	if (endMinutes < startMinutes) {
		endMinutes += 24 * 60
	}

	const minutesFromViewStart = startMinutes - viewStartMinutes
	const startRow = Math.floor(minutesFromViewStart / 10) + 1

	const minutesFromViewStartToEnd = endMinutes - viewStartMinutes
	const endRow = Math.floor(minutesFromViewStartToEnd / 10)

	event.gridRowStart = Math.max(1, startRow)
	event.gridRowEnd = Math.min(store.totalGridRows, endRow)
}

function handleUpdateTaskSpan(payload: { eventId: number; updates: Partial<TemplatePlannerTask> }): void {
	const {eventId, updates} = payload
	const eventIndex = store.events.findIndex((e: TemplatePlannerTask) => e.id === eventId)
	if (eventIndex === -1) return

	if (!store.events[eventIndex]) {
		return
	}
	store.events[eventIndex] = {
		...store.events[eventIndex],
		...updates
	}

	if (updates.startTime || updates.endTime) {
		const event = store.events[eventIndex]
		event.isDuringBackgroundEvent = checkOverlapsBackground(event.startTime, event.endTime)
	}
}

function checkOverlapsBackground(startTime: string, endTime: string): boolean {
	const start = Time.fromString(startTime)
	const end = Time.fromString(endTime)

	return store.events.some((event: TemplatePlannerTask) => {
		if (!event.isBackground) return false

		const bgStart = Time.fromString(event.startTime)
		const bgEnd = Time.fromString(event.endTime)

		// Simple time overlap check (handles overnight)
		let startMins = start.getInMinutes
		let endMins = end.getInMinutes
		let bgStartMins = bgStart.getInMinutes
		let bgEndMins = bgEnd.getInMinutes

		// Normalize for overnight
		if (endMins < startMins) endMins += 24 * 60
		if (bgEndMins < bgStartMins) bgEndMins += 24 * 60

		return (startMins < bgEndMins && endMins > bgStartMins)
	})
}

function checkConflict(startTime: string, endTime: string, currentEventId?: number): boolean {
	const start = Time.fromString(startTime)
	const end = Time.fromString(endTime)

	return store.events.some((event: TemplatePlannerTask) => {
		if (event.id === currentEventId || event.isBackground)
			return false

		const eventStart = Time.fromString(event.startTime)
		const eventEnd = Time.fromString(event.endTime)

		let startMins = start.getInMinutes
		let endMins = end.getInMinutes
		let eventStartMins = eventStart.getInMinutes
		let eventEndMins = eventEnd.getInMinutes

		// Normalize for overnight
		if (endMins < startMins) endMins += 24 * 60
		if (eventEndMins < eventStartMins) eventEndMins += 24 * 60

		return (startMins < eventEndMins && endMins > eventStartMins)
	})
}

function updateOverlapsBackgroundFlags(bgStartTime: string, bgEndTime: string): void {
	const bgStart = Time.fromString(bgStartTime)
	const bgEnd = Time.fromString(bgEndTime)

	let bgStartMins = bgStart.getInMinutes
	let bgEndMins = bgEnd.getInMinutes
	if (bgEndMins < bgStartMins) bgEndMins += 24 * 60

	store.events.forEach((event: TemplatePlannerTask) => {
		if (event.isBackground) return

		const eventStart = Time.fromString(event.startTime)
		const eventEnd = Time.fromString(event.endTime)

		let eventStartMins = eventStart.getInMinutes
		let eventEndMins = eventEnd.getInMinutes
		if (eventEndMins < eventStartMins) eventEndMins += 24 * 60

		if (eventStartMins < bgEndMins && eventEndMins > bgStartMins) {
			event.isDuringBackgroundEvent = true
		}
	})
}

function initializeEventGridPositions(): void {
	store.events.forEach((event: TemplatePlannerTask) => {
		setGridPositionFromTimeSpan(event)
	})
}

async function create(request: TemplatePlannerTaskRequest): Promise<void> {
	if (!request.isBackground && request.startTime && request.endTime) {
		if (checkConflict(request.startTime, request.endTime)) {
			store.conflictSnackbar = true
			return
		}
	}

	const newTask = await createWithResponse(request)

	if (newTask.isBackground) {
		updateOverlapsBackgroundFlags(newTask.startTime, newTask.endTime)
	} else {
		newTask.isDuringBackgroundEvent = checkOverlapsBackground(
			newTask.startTime,
			newTask.endTime
		)
	}

	setGridPositionFromTimeSpan(newTask)
	store.events.push(newTask)
}

async function edit(id: number, request: TemplatePlannerTaskRequest): Promise<void> {
	if (!request.isBackground && request.startTime && request.endTime) {
		if (checkConflict(request.startTime, request.endTime, id)) {
			store.conflictSnackbar = true
			return
		}
	}

	const index = store.events.findIndex((e: TemplatePlannerTask) => e.id === id)
	let updatedItem = store.events[index]
	if (!updatedItem)
		return

	await update(id, request)

	if (request.isBackground !== updatedItem.isBackground) {
		if (request.startTime && request.endTime) {
			updateOverlapsBackgroundFlags(request.startTime, request.endTime)
		}
	}

	const fetchedItem = await fetchById(id)
	const eventWithGrid = fetchedItem as TemplatePlannerTask & { gridRowStart?: number; gridRowEnd?: number; isDuringBackgroundEvent?: boolean }

	if (!request.isBackground) {
		eventWithGrid.isDuringBackgroundEvent = checkOverlapsBackground(
			eventWithGrid.startTime,
			eventWithGrid.endTime
		)
	}
	setGridPositionFromTimeSpan(eventWithGrid)

	store.events[index] = eventWithGrid
}

async function del(): Promise<void> {
	if (store.toDeleteIndex !== null && store.toDeleteEvent) {
		await deleteEntity(store.toDeleteEvent.id)
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
	// Initialize with sample data or load from API
	// TODO: Load template tasks from API
	initializeEventGridPositions()
})

</script>

<style scoped>
/* View-specific styles if needed */
</style>