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
					@undo="handleUndo"
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
							<span class="text-white text-caption font-weight-medium">Suggested for today:</span>
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
					@changeStatus="handleStatusChange"
					@logTime="handleCheckboxLogTime"
				/>
			</template>

			<template #action-bar>
				<UseTemplateActionBar @applyTemplate="applyTemplate"></UseTemplateActionBar>
			</template>

			<!-- Toggle Done button for selection action bar -->
			<template #selection-actions="{ store: slotStore }">
				<VBtn
					v-if="slotStore.selectedTaskIds.size > 1 && !slotStore.isTemplateInPreview"
					color="primary"
					@click="handleToggleIsDoneSelected"
				>
					Toggle Done
				</VBtn>
				<VBtn
					v-if="slotStore.selectedTaskIds.size === 1 && !slotStore.isTemplateInPreview"
					color="warning"
					variant="tonal"
					@click="skipDialog = true"
				>
					Skip
				</VBtn>
				<VBtn
					v-if="!slotStore.isTemplateInPreview"
					color="secondary"
					@click="rescheduleDialog = true"
				>
					Reschedule
				</VBtn>
				<VBtn
					v-if="slotStore.selectedTaskIds.size === 1 && !slotStore.isTemplateInPreview"
					color="primary"
					@click="handleLogTime"
				>
					Log time
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
		<!-- Reschedule Dialog -->
		<RescheduleDialog
			v-model="rescheduleDialog"
			@reschedule="handleReschedule"
		/>
		<!-- Skip Dialog -->
		<SkipReasonDialog
			v-model="skipDialog"
			@skip="handleSkip"
		/>
		<!-- Log Time Dialog -->
		<LogTimeDialog
			v-if="logTimeTaskId !== null"
			v-model="logTimeDialog"
			:activityId="logTimeActivityId!"
			:plannerTaskId="logTimeTaskId"
			:plannerDate="usStringToUrlString(formatToUsString(store.viewedDate))"
			:manualMode="logTimeManualMode"
			:initialStartTime="logTimeInitialStart"
			:initialLength="logTimeInitialLength"
			@confirm="handleLogTimeManualConfirm"
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
	import { useDateTime } from '@/utils/DateTimeHelper.ts'
	import { Time } from '@/dtos/dto/Time.ts'
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
	import type { Calendar } from '@/dtos/response/activityPlanning/Calendar.ts'
	import DayDetailsPanel from '@/components/dayPlanner/normal/DayDetailsPanel.vue'
	import { TemplatePlannerTaskFilter } from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskFilter.ts'
	import UseTemplateActionBar from '@/components/dayPlanner/normal/UseTemplateActionBar.vue'
	import { ApplyTemplateToTaskPlannerRequest } from '@/dtos/request/activityPlanning/ApplyTemplateToTaskPlannerRequest.ts'
	import { API } from '@/plugins/axiosConfig.ts'
	import { ApplyTemplatePlannerTaskResponse } from '@/dtos/response/activityPlanning/ApplyTemplatePlannerTaskResponse.ts'
	import { useTaskPlannerDayTemplateTaskCrud } from '@/api/taskPlanner/taskPlannerDayTemplateApi.ts'
	import type { TaskPlannerDayTemplate } from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts'
	import { useLoading } from '@/composables/general/LoadingComposable.ts'
	import { CreationPreviewType } from '@/components/dayPlanner/DayPlannerTypes.ts'
	import RescheduleDialog from '@/components/dayPlanner/normal/RescheduleDialog.vue'
	import SkipReasonDialog from '@/components/dayPlanner/normal/SkipReasonDialog.vue'
	import LogTimeDialog from '@/components/dayPlanner/normal/LogTimeDialog.vue'
	import { PlannerTaskStatus } from '@/dtos/enum/PlannerTaskStatus.ts'
	import { useTemplateSuggestion } from '@/composables/dayPlanner/useTemplateSuggestion.ts'

	const { showFullScreenLoading } = useLoading()
	const { showErrorSnackbar, showSuccessSnackbar } = useSnackbar()
	const undoStack = useUndoStack()
	const { getSuggestions } = useTemplateSuggestion()
	const {
		createWithResponse,
		update,
		fetchById,
		deleteEntity,
		batchedToggleIsDone,
		patchStatus,
		batchDelete,
		fetchFiltered,
	} = useTaskPlannerCrud()
	const { fetchById: fetchTemplateById, fetchAll: fetchAllTemplates } = useTaskPlannerDayTemplateTaskCrud()
	const { fetchByDate: fetchCalendarByDate } = useCalendarQuery()
	const { fetchFiltered: fetchTemplateTasks } = useTemplatePlannerTaskCrud()
	const { formatToDateWithDay, urlStringToUTCDate, formatToUsString, usStringToUrlString } = useDateTime()
	const store = useDayPlannerStore()

	// Provide the store for slot content (EventBlock components)
	provide('plannerStore', store)

	const calendar = ref<Calendar>()
	const calendarDetailsDialog = ref(false)
	const rescheduleDialog = ref(false)
	const skipDialog = ref(false)
	const logTimeDialog = ref(false)
	const logTimeManualMode = ref(false)
	const logTimeTaskId = ref<number | null>(null)
	const logTimeActivityId = ref<number | null>(null)
	const logTimeInitialStart = ref(new Time())
	const logTimeInitialLength = ref(new Time())
	const allTemplates = ref<TaskPlannerDayTemplate[]>([])

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

		// Handle return from timer views — mark task done with actual times
		const returnQuery = router.currentRoute.value.query
		if (returnQuery.plannerTaskId && returnQuery.actualStartTime && returnQuery.actualLength) {
			const taskId = parseInt(returnQuery.plannerTaskId as string)
			const actualStartTime = Time.fromString(returnQuery.actualStartTime as string)
			const actualLength = Time.fromString(returnQuery.actualLength as string)
			const actualEndTime = Time.fromMinutes((actualStartTime.getInMinutes + actualLength.getInMinutes) % 1440)
			const returnTask = store.tasks.find(t => t.id === taskId) as PlannerTask
			await patch(taskId, {
				startTime: returnTask.startTime,
				endTime: returnTask.endTime,
				isDone: true,
				actualStartTime,
				actualEndTime,
			})
			const idx = store.tasks.findIndex(t => t.id === taskId)
			if (idx >= 0) {
				store.tasks[idx]!.isDone = true
				;(store.tasks[idx] as PlannerTask).actualStartTime = actualStartTime
				;(store.tasks[idx] as PlannerTask).actualEndTime = actualEndTime
			}
			showSuccessSnackbar('Task marked done')
			router.replace({ query: {} })
		}

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
		navigateToDate(date)
	}

	function navigateToDate(date: Date) {
		store.viewedDate = date
		router.replace({ params: { date: usStringToUrlString(formatToUsString(date)) } })
	}

	let loadCompleteResolve: (() => void) | null = null

	async function handleUndo() {
		const nextDate = undoStack.nextUndoDate
		if (nextDate && !isSameDay(nextDate, store.viewedDate)) {
			const loadDone = new Promise<void>(resolve => {
				loadCompleteResolve = resolve
			})
			navigateToDate(new Date(nextDate))
			await loadDone
		}
		await undoStack.undo()
	}

	function isSameDay(a: Date, b: Date): boolean {
		return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
	}

	function handleArrowKey(e: KeyboardEvent) {
		const target = e.target as HTMLElement
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
		if (e.key === 'ArrowLeft') navigateDate(-1)
		else if (e.key === 'ArrowRight') navigateDate(1)
		else if ((e.key === 'n' || e.key === 'N') && store.canCreate && isSameDay(store.viewedDate, new Date())) {
			const slotIndex = store.timeToSlotIndex(Time.fromDate(new Date()))
			const durationSlots = Math.floor(60 / store.timeSlotDuration)
			store.creationPreview = new CreationPreviewType(slotIndex + 1, slotIndex + 1, slotIndex + durationSlots)
			store.openCreateDialog()
		}
	}

	// Load tasks for the current date
	async function loadTasks() {
		store.tasks = await fetchFiltered(
			new PlannerTaskFilter(calendar.value!.id, store.viewStartTime, store.viewEndTime),
		)
		store.initializeTaskGridPositions()
		await templatePreview()
	}

	async function templatePreview() {
		if (store.templateInPreview) {
			store.selectedTaskIds.clear()
			if (!store.previewBaseStartTime) {
				store.previewBaseStartTime = new Time(store.viewStartTime.hours, store.viewStartTime.minutes)
				store.previewBaseEndTime = new Time(store.viewEndTime.hours, store.viewEndTime.minutes)
			}
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
			date: new Date(store.viewedDate),
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
			date: new Date(store.viewedDate),
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
			date: new Date(store.viewedDate),
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

	async function handleStatusChange(taskId: number, status: PlannerTaskStatus) {
		const task = store.tasks.find(e => e.id === taskId)
		if (!task) return
		const previousStatus = task.status
		const previousIsDone = task.isDone
		task.status = status
		task.isDone = status === PlannerTaskStatus.Completed
		await patchStatus(taskId, status).catch(_error => {
			task.status = previousStatus
			task.isDone = previousIsDone
		})
		calendar.value!.completedTasks = store.tasks.filter(t => t.isDone).length
	}

	async function handleToggleIsDoneSelected() {
		const selectedTaskIds = Array.from(store.selectedTaskIds)
		const allCompleted = selectedTaskIds.every(
			id => store.tasks.find(e => e.id === id)?.status === PlannerTaskStatus.Completed,
		)
		const newStatus = allCompleted ? PlannerTaskStatus.NotStarted : PlannerTaskStatus.Completed

		await batchedToggleIsDone(selectedTaskIds).then(() => {
			const tasks = store.tasks.filter(e => selectedTaskIds.includes(e.id))
			tasks.forEach(task => {
				task.status = newStatus
				task.isDone = newStatus === PlannerTaskStatus.Completed
			})
			calendar.value!.completedTasks = store.tasks.filter(t => t.isDone).length
			store.clearSelection()
		})
	}

	function openLogTime(taskId: number, manual: boolean) {
		const task = store.tasks.find(t => t.id === taskId) as PlannerTask
		logTimeTaskId.value = taskId
		logTimeActivityId.value = task.activity.id
		const durationMins = (task.endTime.getInMinutes - task.startTime.getInMinutes + 1440) % 1440
		logTimeInitialStart.value = new Time(task.startTime.hours, task.startTime.minutes)
		logTimeInitialLength.value = Time.fromMinutes(durationMins)
		logTimeManualMode.value = manual
		logTimeDialog.value = true
	}

	function handleLogTime() {
		openLogTime(store.selectedTaskIds.values().next().value!, false)
	}

	function handleCheckboxLogTime(taskId: number) {
		openLogTime(taskId, true)
	}

	async function handleLogTimeManualConfirm(actualStart: Time, length: Time) {
		const id = logTimeTaskId.value!
		const task = store.tasks.find(t => t.id === id) as PlannerTask
		const actualEndTime = Time.fromMinutes((actualStart.getInMinutes + length.getInMinutes) % 1440)
		await patch(id, {
			startTime: task.startTime,
			endTime: task.endTime,
			isDone: true,
			actualStartTime: actualStart,
			actualEndTime,
		})
		const idx = store.tasks.findIndex(t => t.id === id)
		if (idx >= 0) {
			store.tasks[idx]!.isDone = true
			;(store.tasks[idx] as PlannerTask).actualStartTime = actualStart
			;(store.tasks[idx] as PlannerTask).actualEndTime = actualEndTime
		}
		store.clearSelection()
		logTimeTaskId.value = null
		showSuccessSnackbar('Task marked done')
	}

	async function handleSkip(reason: string) {
		const id = store.selectedTaskIds.values().next().value!
		const task = store.tasks.find(t => t.id === id) as PlannerTask
		await patch(id, {
			startTime: task.startTime,
			endTime: task.endTime,
			status: PlannerTaskStatus.Cancelled,
			skipReason: reason,
		})
		const idx = store.tasks.findIndex(t => t.id === id)
		if (idx >= 0) {
			store.tasks[idx]!.status = PlannerTaskStatus.Cancelled
			;(store.tasks[idx] as PlannerTask).skipReason = reason
		}
		store.clearSelection()
		showSuccessSnackbar('Task skipped')
	}

	async function handleReschedule(targetDate: Date) {
		const targetCalendar = await fetchCalendarByDate(usStringToUrlString(formatToUsString(targetDate)))
		const ids = Array.from(store.selectedTaskIds)
		await Promise.all(
			ids.map(id => {
				const task = store.tasks.find(t => t.id === id)
				if (!task) return
				const request = PlannerTaskRequest.fromEntity(task as PlannerTask)
				request.calendarId = targetCalendar.id
				return update(id, request)
			}),
		)
		store.tasks = store.tasks.filter(t => !store.selectedTaskIds.has(t.id))
		store.clearSelection()
		showSuccessSnackbar('Tasks rescheduled')
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
		async () => {
			store.resetStore()
			const dateStr = usStringToUrlString(formatToUsString(new Date(store.viewedDate)))
			const newCalendar = await fetchCalendarByDate(dateStr)
			calendar.value = newCalendar
			store.viewStartTime = newCalendar.wakeUpTime
			store.viewEndTime = newCalendar.bedTime
			await loadTasks()
			loadCompleteResolve?.()
			loadCompleteResolve = null
		},
		{ deep: true },
	)
</script>

<style scoped>
	/* View-specific styles if needed */
</style>
