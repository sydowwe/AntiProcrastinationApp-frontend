<!-- TemplateDayPlannerView.vue -->
<template>
<VCard class="mx-auto w-100 w-lg-66 d-flex flex-column">
	<VCardTitle class="d-flex justify-space-between align-center flex-wrap ga-2">
		<span>{{ store.templateName || 'Day Template' }}</span>

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
				Add New Task
			</VBtn>
		</div>
	</VCardTitle>

	<VCardText class="flex-fill d-flex flex-column ga-4">
		<div class="calendar-grid flex-fill">

			<!-- Time Column -->
			<TimeColumn/>

			<!-- Events Column with template event blocks -->
			<EventsColumn
				:plannerStore="store"
				:slotIndexToTimeValue="store.timeStringFromSlotIndex"
				@updatedTaskSpan="handleUpdateTaskSpan"
			>
				<template #event-block="{ event, onResizeStart }">
					<TemplateEventBlock
						:event="event"
						@resizeStart="onResizeStart"
					/>
				</template>
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
	:text="`Are you sure you want to delete task ${store.toDeleteEvent?.activity.name}?`"
	v-model="store.deleteDialog"
	@confirmed="del"
	confirmBtnColor="error"
/>

<!-- Template Event Dialog -->
<PlannerTaskTemplateDialog
	:dialog="store.dialog"
	v-model:dialog="store.dialog"
	:editingTask="store.editingEvent"
	:isEdit="isEdit"
	:editedId="store.editedId"
	@create="create"
	@edit="edit"
/>

<!-- Conflict Snackbar -->
<VSnackbar
	v-model="store.conflictSnackbar"
	color="error"
	:timeout="3000"
>
	Task conflicts with existing schedule!
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
import PlannerTaskTemplateDialog from '@/components/dayPlanner/template/PlannerTaskTemplateDialog.vue'
import TimeColumn from '@/components/dayPlanner/TimeColumn.vue'
import EventsColumn from '@/components/dayPlanner/EventsColumn.vue'
import TemplateEventBlock from '@/components/dayPlanner/template/TemplateEventBlock.vue'
import TimeRangePicker from '@/components/general/dateTime/TimeRangePicker.vue'
import {useTemplateDayPlannerStore} from '@/stores/templateDayPlannerStore.ts'
import {useTemplatePlannerTaskCrud} from '@/composables/ConcretesCrudComposable.ts'
import type {TemplatePlannerTask} from '@/dtos/response/activityPlanning/template/TemplatePlannerTask'
import type {TemplatePlannerTaskRequest} from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskRequest'
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

function handleUpdateTaskSpan(
	eventId: string,
	updates: Partial<TemplatePlannerTask & { gridRowStart?: number; gridRowEnd?: number }>
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

	if (updates.startTime || updates.endTime) {
		const event = store.events[eventIndex]
		event.isDuringBackgroundEvent = checkOverlapsBackground(event.startTime, event.endTime)
	}
}

function checkOverlapsBackground(startTime: string, endTime: string): boolean {
	const start = Time.fromString(startTime)
	const end = Time.fromString(endTime)

	return store.events.some(event => {
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

function checkConflict(startTime: string, endTime: string, currentEventId?: string): boolean {
	const start = Time.fromString(startTime)
	const end = Time.fromString(endTime)

	return store.events.some(event => {
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

	store.events.forEach(event => {
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
	store.events.forEach(event => {
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

	const response = await createWithResponse(request)

	if (response.isBackground) {
		updateOverlapsBackgroundFlags(response.startTime, response.endTime)
	} else {
		response.isDuringBackgroundEvent = checkOverlapsBackground(
			response.startTime,
			response.endTime
		)
	}

	const eventWithGrid = response as TemplatePlannerTask & { gridRowStart?: number; gridRowEnd?: number; isDuringBackgroundEvent?: boolean }
	setGridPositionFromTimeSpan(eventWithGrid)
	store.events.push(eventWithGrid)
}

async function edit(id: string, request: TemplatePlannerTaskRequest): Promise<void> {
	if (!request.isBackground && request.startTime && request.endTime) {
		if (checkConflict(request.startTime, request.endTime, id)) {
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