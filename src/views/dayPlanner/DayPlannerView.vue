<!-- DayPlannerView.vue -->
<template>
<DayPlanner
	:plannerStore="store"
	:title="currentDateFormatted"
	addButtonText="Add New Event"
	@redrawTask="handleUpdateTaskSpan"
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
import EventDialog from '@/components/dayPlanner/normal/EventDialog.vue'
import EventBlock from '@/components/dayPlanner/normal/EventBlock.vue'
import {useMoment} from '@/scripts/momentHelper.ts'
import {useDayPlannerStore} from '@/stores/dayPlanner/dayPlannerStore.ts'
import {useTaskPlannerCrud} from '@/composables/ConcretesCrudComposable.ts'
import type {PlannerTaskRequest} from '@/dtos/request/activityPlanning/PlannerTaskRequest.ts'
import {useDayPlannerCommon} from '@/composables/dayPlanner/useDayPlannerCommon.ts'
import {storeToRefs} from 'pinia';
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';

const {showErrorSnackbar} = useSnackbar()
const {createWithResponse, update, fetchById, deleteEntity} = useTaskPlannerCrud()
const {formatToDateWithDay} = useMoment()
const store = useDayPlannerStore()
const {viewStartTime, totalGridRows, events} = storeToRefs(useDayPlannerStore())
// Use shared composable for all common logic
const {
	setGridPositionFromSpan,
	checkOverlapsBackground,
	checkConflict,
	updateOverlapsBackgroundFlags,
	initializeEventGridPositions,
	handleUpdateTaskSpan
} = useDayPlannerCommon(
	viewStartTime,
	totalGridRows,
	events
)

// View-specific computed properties
const currentDateFormatted = computed(() => {
	return formatToDateWithDay(store.viewedDate)
})

// CRUD operations
async function create(request: PlannerTaskRequest) {
	if (!request.startTime || !request.endTime) {
		return
	}
	if (!request.isBackground) {
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
	setGridPositionFromSpan(response)
	store.events.push(response)
}

async function edit(id: number, request: PlannerTaskRequest) {
	if (!request.startTime || !request.endTime) {
		showErrorSnackbar('Set start time and end time')
		return
	}
	if (!request.isBackground) {
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
		updateOverlapsBackgroundFlags(request.startTime, request.endTime)
	}

	updatedItem = await fetchById(id)

	if (!request.isBackground) {
		updatedItem.isDuringBackgroundEvent = checkOverlapsBackground(
			updatedItem.startTime,
			updatedItem.endTime
		)
	}
	setGridPositionFromSpan(updatedItem)

	store.events[index] = updatedItem
}

async function del(): Promise<void> {
	if (store.toDeleteId !== null) {
		await deleteEntity(store.toDeleteId);
		store.events.splice(store.events.findIndex(e => e.id === store.toDeleteId), 1)
		store.focusedEventId = null
	}
	store.deleteDialog = false
	store.toDeleteId = null
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