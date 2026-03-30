<!-- DayPlannerView.vue -->
<template>
	<div class="py-4 d-flex ga-4 w-100">
		<!-- Expandable Details -->
		<VExpandXTransition mode="in-out">
			<div v-if="expandedDetails">
				<DayDetailsPanel
					:title="currentDateFormatted"
					:calendar
					@useTemplate="templatePreview"
					@openDetails="calendarDetailsDialog = true"
				></DayDetailsPanel>
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
					@navigateDate="navigateDate"
				/>
				<div
					v-if="suggestions.length && showSuggestionBanner"
					class="px-4 pb-2 pt-1"
				>
					<VAlert
						v-model="showSuggestionBanner"
						density="compact"
						color="primary"
						variant="tonal"
						closable
					>
						<div class="d-flex align-center flex-wrap ga-2">
							<span class="text-caption font-weight-medium">Suggested for today:</span>
							<VChip
								v-for="t in suggestions"
								:key="t.id"
								size="small"
								color="primary"
								variant="elevated"
								style="cursor: pointer"
								@click="applyTemplateSuggestion(t)"
							>
								<VIcon
									v-if="t.icon"
									:icon="t.icon"
									size="12"
									class="mr-1"
								/>
								{{ t.name }}
							</VChip>
						</div>
					</VAlert>
				</div>
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
			<template #selection-actions="{ store: slotStore }">
				<VBtn
					v-if="slotStore.selectedTaskIds.size > 1 && !slotStore.isTemplateInPreview"
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
	import { computed, onMounted, onUnmounted, provide, ref, watch } from 'vue'
	import DayPlanner from '@/components/dayPlanner/DayPlanner.vue'
	import DayPlannerHeader from '@/components/dayPlanner/normal/DayPlannerHeader.vue'
	import PlannerTaskDialog from '@/components/dayPlanner/normal/PlannerTaskDialog.vue'
	import PlannerTaskBlock from '@/components/dayPlanner/normal/PlannerTaskBlock.vue'
	import CalendarDetailsDialog from '@/components/dayPlanner/normal/CalendarDetailsDialog.vue'
	import { useMoment } from '@/utils/momentHelper.ts'
	import { useDayPlannerStore } from '@/stores/dayPlanner/dayPlannerStore.ts'
	import { useCalendarQuery } from '@/api/calendarApi.ts'
	import { useTaskPlannerCrud } from '@/api/taskPlanner/plannerTaskApi.ts'
	import { useTemplatePlannerTaskCrud } from '@/api/taskPlanner/templatePlannerTaskApi.ts'
	import { PlannerTaskRequest } from '@/dtos/request/activityPlanning/PlannerTaskRequest.ts'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { useUndoStack } from '@/composables/general/useUndoStack.ts'
	import router from '@/plugins/router.ts'
	import { PlannerTask } from '@/dtos/response/activityPlanning/PlannerTask.ts'
	import { PlannerTaskFilter } from '@/dtos/request/activityPlanning/PlannerTaskFilter.ts'
	import { Calendar } from '@/dtos/response/activityPlanning/Calendar.ts'
	import DayDetailsPanel from '@/components/dayPlanner/normal/DayDetailsPanel.vue'
	import { TemplatePlannerTaskFilter } from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskFilter.ts'
	import UseTemplateActionBar from '@/components/dayPlanner/normal/UseTemplateActionBar.vue'
	import { ApplyTemplateToTaskPlannerRequest } from '@/dtos/request/activityPlanning/ApplyTemplateToTaskPlannerRequest.ts'
	import { API } from '@/plugins/axiosConfig.ts'
	import type { ApplyTemplateConflictResolution } from '@/dtos/enum/ApplyTemplateConflictResolution.ts'
	import { ApplyTemplatePlannerTaskResponse } from '@/dtos/response/activityPlanning/ApplyTemplatePlannerTaskResponse.ts'
	import { useTaskPlannerDayTemplateTaskCrud } from '@/api/taskPlanner/taskPlannerDayTemplateApi.ts'
	import { useTemplateSuggestion } from '@/composables/dayPlanner/useTemplateSuggestion.ts'
	import type { TaskPlannerDayTemplate } from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts'
	import { useLoading } from '@/composables/general/LoadingComposable.ts'

	const { showFullScreenLoading } = useLoading()
	const { showErrorSnackbar, showSuccessSnackbar } = useSnackbar()
	const undoStack = useUndoStack()
	const { getSuggestions } = useTemplateSuggestion()
	const { createWithResponse, update, fetchById, deleteEntity, batchedToggleIsDone, batchDelete, fetchFiltered } =
		useTaskPlannerCrud()
	const { fetchById: fetchTemplateById, fetchAll: fetchAllTemplates } = useTaskPlannerDayTemplateTaskCrud()
	const { fetchByDate: fetchCalendarByDate } = useCalendarQuery()
	const { fetchFiltered: fetchTemplateTasks } = useTemplatePlannerTaskCrud()
	const { formatToDateWithDay, urlStringToUTCDate, formatToUsString, usStringToUrlString } = useMoment()
	const store = useDayPlannerStore()

	// Provide the store for slot content (EventBlock components)
	provide('plannerStore', store)

	const calendar = ref<Calendar>()
	const calendarDetailsDialog = ref(false)
	const allTemplates = ref<TaskPlannerDayTemplate[]>([])
	const showSuggestionBanner = ref(true)

	const suggestions = computed(() => {
		if (!calendar.value || !allTemplates.value.length || store.isTemplateInPreview) return []
		return getSuggestions(allTemplates.value, calendar.value)
	})

	// Lifecycle hooks
	onMounted(async () => {
		const [calendarData, templates] = await Promise.all([
			fetchCalendarByDate(router.currentRoute.value.params.date as string),
			fetchAllTemplates(),
		])
		calendar.value = calendarData
		allTemplates.value = templates
		store.viewedDate = urlStringToUTCDate(router.currentRoute.value.params.date as string)
		store.viewStartTime = calendar.value!.wakeUpTime
		store.viewEndTime = calendar.value!.bedTime
		await loadTasks()

		// Auto-apply template from query param (e.g., from "Use Today" on template list)
		const applyTemplateId = router.currentRoute.value.query.applyTemplateId
		if (applyTemplateId) {
			const template = await fetchTemplateById(parseInt(applyTemplateId as string))
			if (template) {
				store.templateInPreview = template
				await templatePreview()
			}
			router.replace({ query: {} })
		}

		document.addEventListener('keydown', handleArrowKey)
	})

	onUnmounted(() => {
		document.removeEventListener('keydown', handleArrowKey)
	})

	const expandedDetails = ref(true)

	// View-specific computed properties
	const currentDateFormatted = computed(() => {
		return formatToDateWithDay(store.viewedDate)
	})

	function navigateDate(delta: number) {
		const date = new Date(store.viewedDate)
		date.setDate(date.getDate() + delta)
		store.viewedDate = date
		router.replace({ params: { date: usStringToUrlString(formatToUsString(date)) } })
	}

	function handleArrowKey(e: KeyboardEvent) {
		const target = e.target as HTMLElement
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
		if (e.key === 'ArrowLeft') navigateDate(-1)
		else if (e.key === 'ArrowRight') navigateDate(1)
	}

	// Load tasks for the current date
	async function loadTasks() {
		store.tasks = await fetchFiltered(
			new PlannerTaskFilter(calendar.value!.id, store.viewStartTime, store.viewEndTime),
		)
		store.initializeTaskGridPositions()
		await templatePreview()
	}

	function applyTemplateSuggestion(template: TaskPlannerDayTemplate) {
		store.templateInPreview = template
		showSuggestionBanner.value = false
		templatePreview()
	}

	async function templatePreview() {
		if (store.templateInPreview) {
			store.selectedTaskIds.clear()
			Object.assign(store.viewStartTime, store.templateInPreview.defaultWakeUpTime)
			Object.assign(store.viewEndTime, store.templateInPreview.defaultBedTime)
			store.tasksFromTemplate = (
				await fetchTemplateTasks(
					new TemplatePlannerTaskFilter(store.templateInPreview.id, store.viewStartTime, store.viewEndTime),
				)
			).map(e => PlannerTask.fromTemplateTask(calendar.value!.id, e))
			store.tasks = store.tasks.filter(t => t.id > 0)
			store.tasks.push(...store.tasksFromTemplate)
			store.initializeTaskGridPositions()
		}
	}

	async function applyTemplate(conflictResolution: ApplyTemplateConflictResolution) {
		if (!store.templateInPreview) {
			throw new Error('No template selected')
		}
		showFullScreenLoading()
		const tasksIncluded = store.tasks.filter(t => t.id < 0).map(t => PlannerTaskRequest.fromEntity(t))
		const request = new ApplyTemplateToTaskPlannerRequest(
			store.templateInPreview.id,
			calendar.value!.id,
			conflictResolution,
			tasksIncluded,
		)
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
		request.calendarId = calendar.value?.id
		const response = await createWithResponse(request)

		if (response.isBackground) {
			store.updateIsDuringBackgroundFlags(response)
		} else {
			response.isDuringBackgroundTask = store.checkOverlapsBackground(response)
		}
		store.setGridPositionFromSpan(response)
		store.tasks.push(response)
		undoStack.push({
			description: 'Task created',
			undo: async () => {
				await deleteEntity(response.id)
				store.tasks = store.tasks.filter(t => t.id !== response.id)
			},
		})
		showSuccessSnackbar('Task created')
	}

	async function edit(id: number, request: PlannerTaskRequest) {
		if (!request.startTime || !request.endTime) {
			showErrorSnackbar('Set start time and end time')
			return
		}
		const index = store.tasks.findIndex(e => e.id === id)
		const originalTask = { ...store.tasks[index]! } as PlannerTask
		const wasBackground = store.tasks[index]?.isBackground

		request.calendarId = calendar.value?.id
		request.isDone = store.tasks[index]?.isDone ?? false
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
		undoStack.push({
			description: 'Task updated',
			undo: async () => {
				const undoRequest = PlannerTaskRequest.fromEntity(originalTask)
				undoRequest.calendarId = calendar.value?.id
				undoRequest.isDone = originalTask.isDone ?? false
				await update(id, undoRequest)
				const restored = await fetchById(id)
				store.setGridPositionFromSpan(restored)
				const idx = store.tasks.findIndex(e => e.id === id)
				if (idx >= 0) store.tasks[idx] = restored
			},
		})
		showSuccessSnackbar('Task updated')
	}

	async function del(): Promise<void> {
		if (store.isTemplateInPreview) {
			store.tasks = store.tasks.filter(e => !store.selectedTaskIds.has(e.id))
			store.deleteDialog = false
			return
		}
		const deletedTasks = store.tasks.filter(e => store.selectedTaskIds.has(e.id)) as PlannerTask[]
		if (store.selectedTaskIds.size === 1) {
			const idToDelete = store.selectedTaskIds.values().next().value!
			await deleteEntity(idToDelete)
			store.tasks.splice(
				store.tasks.findIndex(e => e.id === idToDelete),
				1,
			)
			store.selectedTaskIds.clear()
		} else if (store.selectedTaskIds.size > 1) {
			const ids = Array.from(store.selectedTaskIds)
			await batchDelete(ids)
			store.tasks = store.tasks.filter(e => !store.selectedTaskIds.has(e.id))
			store.selectedTaskIds.clear()
		}
		store.deleteDialog = false
		undoStack.push({
			description: 'Task deleted',
			undo: async () => {
				for (const task of deletedTasks) {
					const request = PlannerTaskRequest.fromEntity(task)
					request.calendarId = calendar.value?.id
					const recreated = await createWithResponse(request)
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

	async function handleToggleIsDone(taskId: number) {
		await batchedToggleIsDone([taskId])
			.then(() => {
				const task = store.tasks.find(e => e.id === taskId)
				if (task) {
					calendar.value!.completedTasks += task.isDone ? 1 : -1
				}
			})
			.catch(_error => {})
	}

	async function handleToggleIsDoneSelected() {
		const selectedTaskIds = Array.from(store.selectedTaskIds)

		await batchedToggleIsDone(selectedTaskIds).then(() => {
			const tasks = store.tasks.filter(e => selectedTaskIds.includes(e.id))
			tasks.forEach(task => {
				task.isDone = !task.isDone
			})
			calendar.value!.completedTasks = store.tasks.filter(t => t.isDone).length
			store.clearSelection()
		})
	}

	async function updatedCalendar(updatedCalendar: Calendar): Promise<void> {
		calendar.value = updatedCalendar
		store.viewStartTime = updatedCalendar.wakeUpTime
		store.viewEndTime = updatedCalendar.bedTime
	}

	// Watch for time range changes
	watch(
		[() => store.viewStartTime, () => store.viewEndTime],
		() => {
			store.initializeTaskGridPositions()
		},
		{ deep: true },
	)

	// Watch for date changes to reload tasks
	watch(
		() => store.viewedDate,
		() => {
			store.resetStore()
			showSuggestionBanner.value = true
			loadTasks()
		},
		{ deep: true },
	)
</script>

<style scoped>
	/* View-specific styles if needed */
</style>
