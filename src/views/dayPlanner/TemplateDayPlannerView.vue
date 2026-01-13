<!-- TemplateDayPlannerView.vue -->
<template>
<div class="d-flex flex-column flex-md-row ga-4 w-100 h-100">
	<TaskPlannerDayTemplateDetailsForm
		v-model="detailsHidden"
		:template="currentTemplate"
		@updateDetails="updateDetails"
	/>

	<DayPlanner
		class="flex-fill"
		:plannerStore="store"
		:title="store.templateName || 'Day Template'"
		conflictMessage="Task conflicts with existing schedule!"
		@delete="del"
	>
		<!-- Edit details button -->
		<template #headerPrepend>
			<VBtn
				v-if="detailsHidden"
				color="secondaryOutline"
				prependIcon="eye"
				variant="outlined"
				@click="detailsHidden = !detailsHidden"
			>
				Edit details
			</VBtn>
		</template>

		<!-- Custom event block for template planner -->
		<template #event-block="{ event, onResizeStart }">
			<TemplateEventBlock
				:event="event as TemplatePlannerTask"
				@resizeStart="onResizeStart"
			/>
		</template>

		<!-- Custom dialog for template planner -->
		<template #dialog>
			<PlannerTaskTemplateDialog
				@create="createTask"
				@edit="edit"
			/>
		</template>
	</DayPlanner>
</div>
</template>

<script setup lang="ts">
import {computed, onMounted, provide, ref, watch} from 'vue'
import {useRoute} from 'vue-router'
import DayPlanner from '@/components/dayPlanner/DayPlanner.vue'
import PlannerTaskTemplateDialog from '@/components/dayPlanner/template/PlannerTaskTemplateDialog.vue'
import TemplateEventBlock from '@/components/dayPlanner/template/TemplateEventBlock.vue'
import {useTemplateDayPlannerStore} from '@/stores/dayPlanner/templateDayPlannerStore.ts'
import {useTaskPlannerDayTemplateTaskCrud, useTemplatePlannerTaskCrud} from '@/composables/ConcretesCrudComposable.ts'
import {TemplatePlannerTaskRequest} from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskRequest'
import type {TemplatePlannerTask} from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts';
import TaskPlannerDayTemplateDetailsForm from '@/components/dayPlanner/template/TaskPlannerDayTemplateDetailsForm.vue';
import {TaskPlannerDayTemplateRequest} from '@/dtos/request/activityPlanning/template/TaskPlannerDayTemplateRequest.ts';
import type {TaskPlannerDayTemplate} from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts';
import {TemplatePlannerTaskFilter} from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskFilter.ts';

const route = useRoute()
const templateId = computed(() => route.params.templateId ? parseInt(route.params.templateId as string) : null)

const {
	createWithResponse: createTaskWithResponse,
	fetchFiltered: fetchFilteredTasks,
	update: updateTask,
	fetchById: fetchByIdTask,
	deleteEntity: deleteTask
} = useTemplatePlannerTaskCrud()

const {update, fetchById} = useTaskPlannerDayTemplateTaskCrud()
const store = useTemplateDayPlannerStore()

// Provide the store for slot content (TemplateEventBlock components)
provide('plannerStore', store)

const currentTemplate = ref<TaskPlannerDayTemplate | null>(null)
const detailsHidden = ref(false)

// Lifecycle hooks
onMounted(async () => {
	await loadTemplateDetails()
	await loadTasks();
})

async function loadTemplateDetails() {
	if (templateId.value) {
		const template = await fetchById(templateId.value)
		if (!template) {
			throw Error(`Template with ID ${templateId.value} not found`)
		}
		currentTemplate.value = template;
		// Update store with template data
		if (currentTemplate.value) {
			store.currentTemplateId = templateId.value
			store.templateName = currentTemplate.value.name
		}
	}
}

async function loadTasks() {
	store.events = await fetchFilteredTasks(new TemplatePlannerTaskFilter(templateId.value!, store.viewStartTime, store.viewEndTime));
	store.initializeEventGridPositions()
}

async function updateDetails(request: TaskPlannerDayTemplateRequest): Promise<void> {
	if (templateId.value) {
		await update(templateId.value, request)
		await loadTemplateDetails()
	}
}

// CRUD operations
async function createTask(request: TemplatePlannerTaskRequest): Promise<void> {
	if (!request.isBackground && request.startTime && request.endTime) {
		if (store.checkConflict(request.startTime, request.endTime)) {
			store.conflictSnackbar = true
			return
		}
	}
	request.templateId = templateId.value!;
	const newTask = await createTaskWithResponse(request)

	if (newTask.isBackground) {
		store.updateOverlapsBackgroundFlags(newTask.startTime, newTask.endTime)
	} else {
		newTask.isDuringBackgroundEvent = store.checkOverlapsBackground(
			newTask.startTime,
			newTask.endTime
		)
	}

	store.setGridPositionFromSpan(newTask)
	store.events.push(newTask)
}

async function edit(id: number, request: TemplatePlannerTaskRequest): Promise<void> {
	if (!request.isBackground && request.startTime && request.endTime) {
		if (store.checkConflict(request.startTime, request.endTime, id)) {
			store.conflictSnackbar = true
			return
		}
	}

	const index = store.events.findIndex((e: TemplatePlannerTask) => e.id === id)
	let updatedItem = store.events[index]
	if (!updatedItem)
		return

	await updateTask(id, request)

	if (request.isBackground !== updatedItem.isBackground) {
		if (request.startTime && request.endTime) {
			store.updateOverlapsBackgroundFlags(request.startTime, request.endTime)
		}
	}

	const fetchedItem = await fetchByIdTask(id)

	store.setGridPositionFromSpan(fetchedItem)

	store.events[index] = fetchedItem
}

async function del(): Promise<void> {
	if (store.toDeleteId !== null) {
		await deleteTask(store.toDeleteId);
		store.events.splice(store.events.findIndex(e => e.id === store.toDeleteId), 1)
	}
	store.deleteDialog = false
	store.toDeleteId = null
}

// Watch for time range changes
watch([() => store.viewStartTime, () => store.viewEndTime], () => {
	loadTasks()
}, {deep: true})
</script>

<style scoped>
/* View-specific styles if needed */
</style>