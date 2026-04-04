<!-- TemplatePlannerPanel.vue - Reusable template planner panel, used in both single and split-view -->
<template>
	<div class="py-4 d-flex flex-column flex-md-row ga-4 w-100 h-100">
		<VCard
			v-if="!detailsHidden"
			class="d-flex flex-column details-form"
			elevation="2"
		>
			<VCardTitle class="pt-5 px-5 pb-0 d-flex justify-space-between align-center">
				<span class="text-grey-lighten-1">Template details</span>
				<VIconBtn
					color="secondaryOutline"
					icon="xmark"
					variant="tonal"
					size="40"
					@click="detailsHidden = !detailsHidden"
				>
					<VIcon size="24"></VIcon>
				</VIconBtn>
			</VCardTitle>
			<VCardText class="flex-fill py-6">
				<TaskPlannerDayTemplateDetailsForm
					ref="detailsForm"
					:template="currentTemplate"
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
				<span
					v-if="taskStats.taskCount > 0"
					class="text-caption text-medium-emphasis"
				>
					{{ taskStats.taskCount }} tasks · {{ timeNiceFromMinutes(taskStats.plannedMinutes) }} planned ·
					<span :class="taskStats.freeMinutes > 0 ? 'text-success' : 'text-warning'">
						{{ timeNiceFromMinutes(taskStats.freeMinutes) }} free
					</span>
				</span>
			</template>

			<template #task-block="{ task, onResizeStart }">
				<TemplatePlannerTaskBlock
					:task="task as TemplatePlannerTask"
					@resizeStart="onResizeStart"
				/>
			</template>

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
	import { computed, onMounted, provide, ref, watch } from 'vue'
	import DayPlanner from '@/components/dayPlanner/DayPlanner.vue'
	import TemplatePlannerTaskDialog from '@/components/dayPlanner/template/TemplatePlannerTaskDialog.vue'
	import TemplatePlannerTaskBlock from '@/components/dayPlanner/template/TemplatePlannerTaskBlock.vue'
	import {
		useSecondaryTemplateDayPlannerStore,
		useTemplateDayPlannerStore,
	} from '@/stores/dayPlanner/templateDayPlannerStore.ts'
	import { useTaskPlannerDayTemplateTaskCrud } from '@/api/taskPlanner/taskPlannerDayTemplateApi.ts'
	import { useTemplatePlannerTaskCrud } from '@/api/taskPlanner/templatePlannerTaskApi.ts'
	import { TemplatePlannerTaskRequest } from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskRequest.ts'
	import type { TemplatePlannerTask } from '@/dtos/response/activityPlanning/template/TemplatePlannerTask.ts'
	import TaskPlannerDayTemplateDetailsForm from '@/components/dayPlanner/template/TaskPlannerDayTemplateDetailsForm.vue'
	import type { TaskPlannerDayTemplate } from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts'
	import { TemplatePlannerTaskFilter } from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskFilter.ts'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { useDateTime } from '@/utils/DateTimeHelper.ts'
	import { useUndoStack } from '@/composables/general/useUndoStack.ts'

	const {
		storeId = 'main',
		templateId,
		isSplitView = false,
	} = defineProps<{
		storeId?: 'main' | 'secondary'
		templateId: number | null
		isSplitView?: boolean
	}>()

	const {
		createWithResponse: createTaskWithResponse,
		fetchFiltered: fetchFilteredTasks,
		update: updateTask,
		fetchById: fetchByIdTask,
		deleteEntity: deleteTask,
		batchDelete: batchDeleteTask,
	} = useTemplatePlannerTaskCrud()

	const { update, fetchById } = useTaskPlannerDayTemplateTaskCrud()
	const { showSuccessSnackbar } = useSnackbar()
	const { timeNiceFromMinutes } = useDateTime()
	const undoStack = useUndoStack()

	const store = storeId === 'secondary' ? useSecondaryTemplateDayPlannerStore() : useTemplateDayPlannerStore()

	provide('plannerStore', store)
	provide('isSplitView', isSplitView)
	provide('splitViewStoreId', storeId)

	const detailsForm = ref<InstanceType<typeof TaskPlannerDayTemplateDetailsForm>>()
	const currentTemplate = ref<TaskPlannerDayTemplate | null>(null)
	const detailsHidden = ref(true)

	const taskStats = computed(() => {
		const nonBgTasks = store.tasks.filter(t => !t.isBackground)
		const taskCount = nonBgTasks.length
		const plannedMinutes = nonBgTasks.reduce((sum, t) => {
			const start = t.startTime.getInMinutes
			const end = t.endTime.getInMinutes
			return sum + (end > start ? end - start : end + 1440 - start)
		}, 0)
		const viewStart = store.viewStartTime.getInMinutes
		const viewEnd = store.viewEndTime.getInMinutes
		const totalViewMinutes = viewEnd > viewStart ? viewEnd - viewStart : viewEnd + 1440 - viewStart
		const freeMinutes = Math.max(0, totalViewMinutes - plannedMinutes)
		return { taskCount, plannedMinutes, freeMinutes }
	})

	onMounted(async () => {
		await loadTemplateDetails()
		await loadTasks()
	})

	async function loadTemplateDetails() {
		if (!templateId) return
		const template = await fetchById(templateId)
		if (!template) throw Error(`Template with ID ${templateId} not found`)
		currentTemplate.value = template
		store.currentTemplateId = templateId
		store.templateName = template.name
	}

	async function loadTasks() {
		if (!templateId) return
		store.tasks = await fetchFilteredTasks(
			new TemplatePlannerTaskFilter(templateId, store.viewStartTime, store.viewEndTime),
		)
		store.initializeTaskGridPositions()
	}

	async function updateDetails(): Promise<void> {
		const request = await detailsForm.value?.validateAndGetData()
		if (!request || !templateId) return
		await update(templateId, request)
		await loadTemplateDetails()
		showSuccessSnackbar('Template details updated')
	}

	async function createTask(request: TemplatePlannerTaskRequest): Promise<void> {
		request.templateId = templateId!
		const newTask = await createTaskWithResponse(request)

		if (newTask.isBackground) {
			store.updateIsDuringBackgroundFlags(newTask)
		} else {
			newTask.isDuringBackgroundTask = store.checkOverlapsBackground(newTask)
		}

		store.setGridPositionFromSpan(newTask)
		store.tasks.push(newTask)
		undoStack.push({
			description: 'Task created',
			undo: async () => {
				await deleteTask(newTask.id)
				store.tasks = store.tasks.filter(t => t.id !== newTask.id)
			},
		})
		showSuccessSnackbar('Task created')
	}

	async function edit(id: number, request: TemplatePlannerTaskRequest): Promise<void> {
		const originalTask = { ...store.tasks.find((e: TemplatePlannerTask) => e.id === id)! }
		request.templateId = currentTemplate.value!.id
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
		undoStack.push({
			description: 'Task updated',
			undo: async () => {
				const undoRequest = TemplatePlannerTaskRequest.fromEntity(originalTask as TemplatePlannerTask)
				undoRequest.templateId = templateId!
				await updateTask(id, undoRequest)
				const restored = await fetchByIdTask(id)
				store.setGridPositionFromSpan(restored)
				const idx = store.tasks.findIndex((e: TemplatePlannerTask) => e.id === id)
				if (idx >= 0) store.tasks[idx] = restored
			},
		})
		showSuccessSnackbar('Task updated')
	}

	async function del(): Promise<void> {
		const deletedTasks = store.tasks.filter(e => store.selectedTaskIds.has(e.id))

		if (store.selectedTaskIds.size === 1) {
			const idToDelete = store.selectedTaskIds.values().next().value!
			await deleteTask(idToDelete)
			store.tasks.splice(
				store.tasks.findIndex(e => e.id === idToDelete),
				1,
			)
			store.selectedTaskIds.clear()
		} else if (store.selectedTaskIds.size > 1) {
			const ids = Array.from(store.selectedTaskIds)
			await batchDeleteTask(ids)
			store.tasks = store.tasks.filter(e => !store.selectedTaskIds.has(e.id))
			store.selectedTaskIds.clear()
		}
		store.deleteDialog = false
		undoStack.push({
			description: 'Task deleted',
			undo: async () => {
				for (const task of deletedTasks) {
					const request = TemplatePlannerTaskRequest.fromEntity(task)
					request.templateId = templateId!
					const recreated = await createTaskWithResponse(request)
					if (recreated.isBackground) {
						store.updateIsDuringBackgroundFlags(recreated)
					} else {
						recreated.isDuringBackgroundTask = store.checkOverlapsBackground(recreated)
					}
					store.setGridPositionFromSpan(recreated)
					store.tasks.push(recreated)
				}
			},
		})
		showSuccessSnackbar('Task deleted')
	}

	watch(
		[() => store.viewStartTime, () => store.viewEndTime],
		() => {
			loadTasks()
		},
		{ deep: true },
	)

	watch(
		() => templateId,
		async () => {
			store.resetStore()
			await loadTemplateDetails()
			await loadTasks()
		},
	)

	defineExpose({ store, loadTasks })
</script>
