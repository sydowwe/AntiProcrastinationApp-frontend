<!-- TemplateDayPlannerView.vue -->
<template>
<div class="d-flex flex-column flex-md-row ga-4 w-100 h-100">
	<VCard v-if="!detailsHidden" class="d-flex flex-column details-form" elevation="2">
		<VCardTitle class="pt-5 px-5 pb-0 d-flex justify-space-between align-center">
			<span class="text-grey-lighten-1">Template details</span>
			<VIconBtn
				color="secondaryOutline"
				icon="xmark"
				@click="detailsHidden = !detailsHidden"
				variant="tonal"
				size="40"
			>
				<VIcon size="24"></VIcon>
			</VIconBtn>
		</VCardTitle>
		<VCardText class="flex-fill py-6">
			<TaskPlannerDayTemplateDetailsForm
				ref="detailsForm"
				:isHidden="detailsHidden"
				@onHide="detailsHidden = true"
				:template="currentTemplate"
				@updateDetails="updateDetails"
				:isInDialog="false"
			/>
		</VCardText>
		<VCardActions class="pa-5">
			<VBtn
				block
				color="primary"
				@click="updateDetails"
			>
				Update details
			</VBtn>
		</VCardActions>
	</VCard>


	<DayPlanner
		class="flex-fill"
		:plannerStore="store"
		:title="store.templateName || 'Day Template'"
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

		<!-- Custom task block for template planner -->
		<template #task-block="{ task, onResizeStart }">
			<TemplatePlannerTaskBlock
				:task="task as TemplatePlannerTask"
				@resizeStart="onResizeStart"
			/>
		</template>

		<!-- Custom dialog for template planner -->
		<template #dialog>
			<TemplatePlannerTaskDialog
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
import TemplatePlannerTaskDialog from '@/components/dayPlanner/template/TemplatePlannerTaskDialog.vue'
import TemplatePlannerTaskBlock from '@/components/dayPlanner/template/TemplatePlannerTaskBlock.vue'
import {useTemplateDayPlannerStore} from '@/stores/dayPlanner/templateDayPlannerStore.ts'
import {useTaskPlannerDayTemplateTaskCrud, useTemplatePlannerTaskCrud} from '@/composables/ConcretesCrudComposable.ts'
import {TemplatePlannerTaskRequest} from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskRequest'
import type {TemplatePlannerTask} from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts';
import TaskPlannerDayTemplateDetailsForm from '@/components/dayPlanner/template/TaskPlannerDayTemplateDetailsForm.vue';
import type {TaskPlannerDayTemplate} from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts';
import {TemplatePlannerTaskFilter} from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskFilter.ts';

const {
	createWithResponse: createTaskWithResponse,
	fetchFiltered: fetchFilteredTasks,
	update: updateTask,
	fetchById: fetchByIdTask,
	deleteEntity: deleteTask,
	batchDelete: batchDeleteTask,
} = useTemplatePlannerTaskCrud()

const {update, fetchById} = useTaskPlannerDayTemplateTaskCrud()
const store = useTemplateDayPlannerStore()
provide('plannerStore', store)

const detailsForm = ref<InstanceType<typeof TaskPlannerDayTemplateDetailsForm>>()

const route = useRoute()
const templateId = computed(() => route.params.templateId ? parseInt(route.params.templateId as string) : null)

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
	store.tasks = await fetchFilteredTasks(new TemplatePlannerTaskFilter(templateId.value!, store.viewStartTime, store.viewEndTime));
	store.initializeTaskGridPositions()
}

async function updateDetails(): Promise<void> {
	const request = await detailsForm.value?.validateAndGetData()
	if (request) {
		if (templateId.value) {
			await update(templateId.value, request)
			await loadTemplateDetails()
		}
	}
}

// CRUD operations
async function createTask(request: TemplatePlannerTaskRequest): Promise<void> {
	request.templateId = templateId.value!;
	const newTask = await createTaskWithResponse(request)

	if (newTask.isBackground) {
		store.updateIsDuringBackgroundFlags(newTask)
	} else {
		newTask.isDuringBackgroundTask = store.checkOverlapsBackground(newTask)
	}

	store.setGridPositionFromSpan(newTask)
	store.tasks.push(newTask)
}

async function edit(id: number, request: TemplatePlannerTaskRequest): Promise<void> {
	request.templateId = currentTemplate.value!.id;
	await updateTask(id, request)

	const updatedItem = await fetchByIdTask(id)


	const index = store.tasks.findIndex((e: TemplatePlannerTask) => e.id === id)
	const wasBackground = store.tasks[index]?.isBackground
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
	if (store.selectedTaskIds.size === 1) {
		const idToDelete = store.selectedTaskIds.values().next().value!;
		await deleteTask(idToDelete).then(() => {
			store.tasks.splice(store.tasks.findIndex(e => e.id === idToDelete), 1)
			store.selectedTaskIds.clear();
		})
	} else if (store.selectedTaskIds.size > 1) {
		const ids = Array.from(store.selectedTaskIds)
		await batchDeleteTask(ids).then(() => {
			store.tasks = store.tasks.filter(e => !store.selectedTaskIds.has(e.id))
			store.selectedTaskIds.clear();
		})
	}
	store.deleteDialog = false
}

// Watch for time range changes
watch([() => store.viewStartTime, () => store.viewEndTime], () => {
	loadTasks()
}, {deep: true})
</script>

<style scoped>
/* View-specific styles if needed */
</style>