<!-- DayPlannerView.vue -->
<template>
<div class="d-flex ga-4 w-100">
	<!-- Expandable Details -->
	<VExpandXTransition mode="in-out">
		<div v-if="expandedDetails">
			<DayDetailsPanel :title="currentDateFormatted" :calendar @useTemplate="templatePreview" @openDetails="calendarDetailsDialog = true"></DayDetailsPanel>
		</div>
	</VExpandXTransition>
	<DayPlanner
		class="flex-fill"
		:plannerStore="store"
		@delete="del"
		@keydown.space="handleToggleIsDoneSelected"
	>
		<!-- Header with calendar info -->
		<template #header>
			<DayPlannerHeader
				v-model:expandedDetails="expandedDetails"
				:title="currentDateFormatted"
				:calendar
			/>
		</template>

		<!-- Custom task block for normal planner -->
		<template #task-block="{ task, onResizeStart }">
			<PlannerTaskBlock
				:task="task as PlannerTask"
				@resizeStart="onResizeStart"
				@toggleIsDone="handleToggleIsDone"
			/>
		</template>

		<template #action-bar>
			<UseTemplateActionBar @applyTemplate="applyTemplate"></UseTemplateActionBar>
		</template>

		<!-- Toggle Done button for selection action bar -->
		<template #selection-actions="{ store }">
			<VBtn
				v-if="store.selectedTaskIds.size > 1 && !store.isTemplateInPreview"
				variant="tonal"
				color="primaryOutline"
				@click="handleToggleIsDoneSelected"
			>
				Toggle Done
			</VBtn>
		</template>

		<!-- Custom dialog for normal planner -->
		<template #dialog>
			<PlannerTaskDialog
				@create="create"
				@edit="edit"
			/>
		</template>
	</DayPlanner>
	<!-- Calendar Details Dialog -->
	<CalendarDetailsDialog
		v-model="calendarDetailsDialog"
		:calendar="calendar"
		@updated="updatedCalendar"
	/>
</div>
</template>


<script setup lang="ts">
import {computed, onMounted, provide, ref, watch} from 'vue'
import DayPlanner from '@/components/dayPlanner/DayPlanner.vue'
import DayPlannerHeader from '@/components/dayPlanner/normal/DayPlannerHeader.vue'
import PlannerTaskDialog from '@/components/dayPlanner/normal/PlannerTaskDialog.vue'
import PlannerTaskBlock from '@/components/dayPlanner/normal/PlannerTaskBlock.vue'
import CalendarDetailsDialog from '@/components/dayPlanner/normal/CalendarDetailsDialog.vue'
import {useMoment} from '@/scripts/momentHelper.ts'
import {useDayPlannerStore} from '@/stores/dayPlanner/dayPlannerStore.ts'
import {useCalendarQuery, useTaskPlannerCrud, useTemplatePlannerTaskCrud} from '@/composables/ConcretesCrudComposable.ts'
import {PlannerTaskRequest} from '@/dtos/request/activityPlanning/PlannerTaskRequest.ts'
import {useSnackbar} from '@/composables/general/SnackbarComposable.ts';
import router from '@/plugins/router.ts';
import {PlannerTask} from '@/dtos/response/activityPlanning/PlannerTask.ts';
import {PlannerTaskFilter} from '@/dtos/request/activityPlanning/PlannerTaskFilter.ts';
import {Calendar} from '@/dtos/response/activityPlanning/Calendar.ts';
import DayDetailsPanel from '@/components/dayPlanner/normal/DayDetailsPanel.vue';
import {TemplatePlannerTaskFilter} from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskFilter.ts';
import UseTemplateActionBar from '@/components/dayPlanner/normal/UseTemplateActionBar.vue';
import {ApplyTemplateToTaskPlannerRequest} from '@/dtos/request/activityPlanning/ApplyTemplateToTaskPlannerRequest.ts';
import {API} from '@/plugins/axiosConfig.ts';
import type {ApplyTemplateConflictResolution} from '@/dtos/enum/ApplyTemplateConflictResolution.ts';
import {ApplyTemplatePlannerTaskResponse} from '@/dtos/response/activityPlanning/ApplyTemplatePlannerTaskResponse.ts';

const {showErrorSnackbar} = useSnackbar()
const {createWithResponse, update, fetchById, deleteEntity, batchedToggleIsDone, batchDelete, fetchFiltered} = useTaskPlannerCrud()
const {fetchByDate: fetchCalendarByDate} = useCalendarQuery()
const {fetchFiltered: fetchTemplateTasks} = useTemplatePlannerTaskCrud()
const {formatToDateWithDay, urlStringToUTCDate} = useMoment()
const store = useDayPlannerStore()

// Provide the store for slot content (EventBlock components)
provide('plannerStore', store)
// Use shared composable for all common logic

const calendar = ref<Calendar>()
const calendarDetailsDialog = ref(false)

// Lifecycle hooks
onMounted(async () => {
	calendar.value = await fetchCalendarByDate(router.currentRoute.value.params.date as string)
	store.viewedDate = urlStringToUTCDate(router.currentRoute.value.params.date as string)
	store.viewStartTime = calendar.value!.wakeUpTime;
	store.viewEndTime = calendar.value!.bedTime;
	await loadTasks()
})

const expandedDetails = ref(true)

// View-specific computed properties
const currentDateFormatted = computed(() => {
	return formatToDateWithDay(store.viewedDate)
})

// Load tasks for the current date
async function loadTasks() {
	store.tasks = await fetchFiltered(new PlannerTaskFilter(calendar.value!.id, store.viewStartTime, store.viewEndTime));
	store.initializeTaskGridPositions()
	await templatePreview()
}

async function templatePreview() {
	if (store.templateInPreview) {
		store.selectedTaskIds.clear()
		Object.assign(store.viewStartTime, store.templateInPreview.defaultWakeUpTime)
		Object.assign(store.viewEndTime, store.templateInPreview.defaultBedTime);
		store.tasksFromTemplate = (await fetchTemplateTasks(new TemplatePlannerTaskFilter(store.templateInPreview.id, store.viewStartTime, store.viewEndTime))).map(e => PlannerTask.fromTemplateTask(calendar.value!.id, e))
		store.tasks = store.tasks.filter(t => t.id > 0)
		store.tasks.push(...store.tasksFromTemplate)
		store.initializeTaskGridPositions()
	}
}

async function applyTemplate(conflictResolution: ApplyTemplateConflictResolution, hourOffset: number) {
	if (!store.templateInPreview) {
		throw new Error('No template selected')
	}
	const tasksIncluded = store.tasks.filter(t => t.id < 0).map(t => PlannerTaskRequest.fromEntity(t))
	const request = new ApplyTemplateToTaskPlannerRequest(store.templateInPreview.id, calendar.value!.id, conflictResolution, tasksIncluded)
	const json = await API.post('calendar/apply-planner-template', request)
	const response = ApplyTemplatePlannerTaskResponse.fromJson(json.data)

	store.resetStore()
	calendar.value = response.calendar
	store.tasks = response.tasks
	store.initializeTaskGridPositions()
}

// CRUD operations
async function create(request: PlannerTaskRequest) {
	if (!request.startTime || !request.endTime) {
		return
	}
	request.calendarId = calendar.value?.id;
	const response = await createWithResponse(request)

	if (response.isBackground) {
		store.updateIsDuringBackgroundFlags(response)
	} else {
		response.isDuringBackgroundTask = store.checkOverlapsBackground(response)
	}
	store.setGridPositionFromSpan(response)
	store.tasks.push(response)
}

async function edit(id: number, request: PlannerTaskRequest) {
	if (!request.startTime || !request.endTime) {
		showErrorSnackbar('Set start time and end time')
		return
	}
	const index = store.tasks.findIndex(e => e.id === id)
	const wasBackground = store.tasks[index]?.isBackground

	request.calendarId = calendar.value?.id;
	request.isDone = store.tasks[index]?.isDone ?? false;
	await update(id, request)


	const updatedItem = await fetchById(id)

	if (request.isBackground !== wasBackground) {
		store.updateIsDuringBackgroundFlags(updatedItem)
	}

	store.setGridPositionFromSpan(updatedItem)

	store.tasks[index] = updatedItem

	if (!request.isBackground) {
		updatedItem.isDuringBackgroundTask = store.checkOverlapsBackground(updatedItem)
	}
}

async function del(): Promise<void> {
	if (store.isTemplateInPreview) {
		store.tasks = store.tasks.filter(e => !store.selectedTaskIds.has(e.id))
	} else if (store.selectedTaskIds.size === 1) {
		const idToDelete = store.selectedTaskIds.values().next().value!;
		await deleteEntity(idToDelete).then(() => {
			store.tasks.splice(store.tasks.findIndex(e => e.id === idToDelete), 1)
			store.selectedTaskIds.clear();
		})
	} else if (store.selectedTaskIds.size > 1) {
		const ids = Array.from(store.selectedTaskIds)
		await batchDelete(ids).then(() => {
			store.tasks = store.tasks.filter(e => !store.selectedTaskIds.has(e.id))
			store.selectedTaskIds.clear();
		})
	}
	store.deleteDialog = false
}

async function handleToggleIsDone(taskId: number) {
	await batchedToggleIsDone([taskId])
		.then(() => {
			const task = store.tasks.find(e => e.id === taskId)
			if (task) {
				calendar.value!.completedTasks += (task.isDone ? 1 : -1)
			}
		})
		.catch((error) => {
		})
}

async function handleToggleIsDoneSelected() {
	// Toggle isDone for all selected tasks
	const selectedTaskIds = Array.from(store.selectedTaskIds)

	await batchedToggleIsDone(selectedTaskIds)
		.then(() => {
			const tasks = store.tasks.filter(e => selectedTaskIds.includes(e.id))
			tasks.forEach(task => {
				task.isDone = !task.isDone
			})
			calendar.value!.completedTasks = store.tasks.filter(t => t.isDone).length
			store.clearSelection()
		})
}

async function updatedCalendar(updatedCalendar: Calendar): Promise<void> {
	calendar.value = updatedCalendar;
	store.viewStartTime = updatedCalendar.wakeUpTime
	store.viewEndTime = updatedCalendar.bedTime
}

// Watch for time range changes
watch([() => store.viewStartTime, () => store.viewEndTime], () => {
	store.initializeTaskGridPositions()
}, {deep: true})

// Watch for date changes to reload tasks
watch(() => store.viewedDate, () => {
	store.resetStore()
	loadTasks()
}, {deep: true})
</script>

<style scoped>
/* View-specific styles if needed */
</style>