<!-- TemplateDayPlannerView.vue -->
<template>
<DayPlanner
	:plannerStore="store"
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
import {TemplatePlannerTaskRequest} from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskRequest'
import {useDayPlannerCommon} from '@/composables/dayPlanner/useDayPlannerCommon.ts';
import type {TemplatePlannerTask} from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts';
import {storeToRefs} from 'pinia';

const {createWithResponse, update, fetchById, deleteEntity} = useTemplatePlannerTaskCrud()
const store = useTemplateDayPlannerStore()
const {viewStartTime, totalGridRows, visibleEvents} = storeToRefs(store)

// Use shared composable for all common time-based logic
const {
	checkOverlapsBackground,
	checkConflict,
	updateOverlapsBackgroundFlags,
	initializeEventGridPositions,
	setGridPositionFromSpan,
	handleUpdateTaskSpan
} = useDayPlannerCommon(
	viewStartTime,
	totalGridRows,
	visibleEvents
)

// View-specific computed properties
const isEdit = computed(() => store.editedId !== undefined)

// CRUD operations
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

	setGridPositionFromSpan(newTask)
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

	if (!request.isBackground) {
		fetchedItem.isDuringBackgroundEvent = checkOverlapsBackground(
			fetchedItem.startTime,
			fetchedItem.endTime
		)
	}
	setGridPositionFromSpan(fetchedItem)

	store.events[index] = fetchedItem
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