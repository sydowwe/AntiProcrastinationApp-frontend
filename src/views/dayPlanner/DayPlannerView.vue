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
			@delete="crud.del"
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
			</template>

			<!-- Custom task block for normal planner -->
			<template #task-block="{ task, onResizeStart }">
				<PlannerTaskBlock
					:task="task as PlannerTask"
					@resizeStart="onResizeStart"
					@changeStatus="handleStatusChange"
				/>
			</template>

			<template #action-bar>
				<UseTemplateActionBar @applyTemplate="applyTemplate"></UseTemplateActionBar>
			</template>

			<!-- Change Status button for selection action bar -->
			<template #selection-actions>
				<VMenu
					v-if="!store.isTemplateInPreview"
					closeOnContentClick
				>
					<template #activator="{ props: menuProps }">
						<VBtn
							v-bind="menuProps"
							color="primary"
						>
							Change Status
						</VBtn>
					</template>
					<VCard>
						<VList density="compact">
							<VListItem
								v-for="option in statusOptions"
								:key="option.value"
								:prependIcon="getPlannerTaskStatusIcon(option)"
								:title="option.title"
								color="secondaryOutline"
								@click="handleChangeStatusOnSelected(option.value as PlannerTaskStatus)"
							/>
						</VList>
					</VCard>
				</VMenu>
				<VBtn
					v-if="!store.isTemplateInPreview"
					color="secondary"
					@click="rescheduleDialog = true"
				>
					Reschedule
				</VBtn>
				<VBtn
					v-if="store.selectedTaskIds.size === 1 && !store.isTemplateInPreview"
					color="primary"
					@click="logTimeController?.openFromSelection"
				>
					Log time
				</VBtn>
			</template>

			<!-- Custom dialog for normal planner -->
			<template #dialog>
				<PlannerTaskDialog
					@create="crud.create"
					@edit="crud.edit"
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
		<LogTimeController ref="logTimeController" />
	</div>
</template>

<script setup lang="ts">
	import { computed, onMounted, onUnmounted, provide, ref, watch } from 'vue'
	import DayPlanner from '@/components/dayPlanner/DayPlanner.vue'
	import DayPlannerHeader from '@/components/dayPlanner/normal/DayPlannerHeader.vue'
	import PlannerTaskDialog from '@/components/dayPlanner/normal/PlannerTaskDialog.vue'
	import PlannerTaskBlock from '@/components/dayPlanner/normal/PlannerTaskBlock.vue'
	import CalendarDetailsDialog from '@/components/dayPlanner/normal/CalendarDetailsDialog.vue'
	import { isSameDay, useDateTime } from '@/utils/DateTimeHelper.ts'
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
	import RescheduleDialog from '@/components/dayPlanner/normal/RescheduleDialog.vue'
	import SkipReasonDialog from '@/components/dayPlanner/normal/SkipReasonDialog.vue'
	import LogTimeController from '@/components/dayPlanner/normal/LogTimeController.vue'
	import { getPlannerTaskStatusIcon, PlannerTaskStatus } from '@/dtos/enum/PlannerTaskStatus.ts'
	import { getEnumSelectOptions } from '@/composables/general/EnumComposable.ts'
	import type { ApplyTemplateConflictResolution } from '@/dtos/enum/ApplyTemplateConflictResolution.ts'
	import { PatchPlannerTaskStatusRequest } from '@/dtos/request/activityPlanning/PatchPlannerTaskStatusRequest.ts'
	import { useClipboardHandling } from '@/composables/dayPlanner/useClipboardHandling.ts'
	import { usePlannerCrud } from '@/composables/dayPlanner/usePlannerCrud.ts'
	import { useTaskReminders } from '@/composables/dayPlanner/useTaskReminders.ts'

	const { showFullScreenLoading, hideFullScreenLoading } = useLoading()
	const { showSuccessSnackbar } = useSnackbar()
	const undoStack = useUndoStack()
	const { createWithResponse, update, patch, fetchById, deleteEntity, patchStatus, batchDelete, fetchFiltered } =
		useTaskPlannerCrud()

	const statusOptions = getEnumSelectOptions(PlannerTaskStatus, 'planner.status')
	const { fetchById: fetchTemplateById, fetchAll: fetchAllTemplates } = useTaskPlannerDayTemplateTaskCrud()
	const { fetchByDate: fetchCalendarByDate } = useCalendarQuery()
	const { fetchFiltered: fetchTemplateTasks } = useTemplatePlannerTaskCrud()
	const { formatToDateWithDay, urlStringToUTCDate, formatToUsString, usStringToUrlString } = useDateTime()
	const store = useDayPlannerStore()
	useTaskReminders(() => store.tasks, store.viewedDate)

	function applyContext(req: PlannerTaskRequest) {
		req.calendarId = calendar.value?.id
	}
	function buildRequestFromEntity(task: PlannerTask) {
		return PlannerTaskRequest.fromEntity(task)
	}

	useClipboardHandling(store, { createWithResponse, batchDelete, applyContext, buildRequestFromEntity, getCurrentContext: () => store.viewedDate.toDateString() })
	const crud = usePlannerCrud(store, {
		createWithResponse,
		update,
		fetchById,
		deleteEntity,
		batchDelete,
		applyContext,
		buildRequestFromEntity,
	})

	const logTimeController = ref<InstanceType<typeof LogTimeController>>()
	// Provide the store for slot content (EventBlock components)
	provide('plannerStore', store)

	const calendar = ref<Calendar>()
	const calendarDetailsDialog = ref(false)
	const rescheduleDialog = ref(false)
	const skipDialog = ref(false)
	const allTemplates = ref<TaskPlannerDayTemplate[]>([])

	// Lifecycle hooks
	onMounted(async () => {
		const dateParam = router.currentRoute.value.params.date as string | undefined
		if (!dateParam) {
			router.replace({
				name: 'dayPlanner',
				params: { date: usStringToUrlString(formatToUsString(new Date())) },
			})
			return
		}
		const [calendarData, templates] = await Promise.all([fetchCalendarByDate(dateParam), fetchAllTemplates()])
		calendar.value = calendarData
		allTemplates.value = templates
		store.viewedDate = urlStringToUTCDate(dateParam)
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
		navigateToDate(date)
	}

	function navigateToDate(date: Date | null) {
		store.viewedDate = date ?? new Date()
		router.replace({ params: { date: usStringToUrlString(formatToUsString(store.viewedDate)) } })
	}

	let loadCompleteResolve: (() => void) | null = null

	async function handleUndo() {
		const nextDate = undoStack.nextUndoDate
		if (nextDate && !isSameDay(nextDate.value, store.viewedDate)) {
			const loadDone = new Promise<void>(resolve => {
				loadCompleteResolve = resolve
			})
			navigateToDate(nextDate.value)
			await loadDone
		}
		await undoStack.undo()
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

	async function handleStatusChange(taskId: number, status: PlannerTaskStatus) {
		const task = store.tasks.find(e => e.id === taskId)
		if (!task) return
		const previousStatus = task.status
		if (status !== PlannerTaskStatus.Completed) {
			task.status = status
			const request = new PatchPlannerTaskStatusRequest(status)
			if (status === PlannerTaskStatus.Cancelled || status === PlannerTaskStatus.NotStarted) {
				task.actualStartTime = null
				task.actualEndTime = null
			}
			await patchStatus(taskId, request).catch(_error => {
				task.status = previousStatus
			})
			calendar.value!.completedTasks = store.tasks.filter(t => t.isDone).length
		} else {
			logTimeController.value?.openManual(taskId)
		}
	}

	async function handleChangeStatusOnSelected(status: PlannerTaskStatus) {
		const selectedTaskIds = Array.from(store.selectedTaskIds)
		if (status === PlannerTaskStatus.Completed) {
			const firstId = selectedTaskIds[0]
			if (firstId !== undefined) {
				logTimeController.value?.openManual(firstId)
			}
			return
		}
		if (status === PlannerTaskStatus.Cancelled) {
			skipDialog.value = true
			return
		}
		await Promise.all(
			selectedTaskIds.map(async taskId => {
				const task = store.tasks.find(e => e.id === taskId)
				if (!task) return
				const previousStatus = task.status
				task.status = status
				if (status === PlannerTaskStatus.NotStarted) {
					task.actualStartTime = null
					task.actualEndTime = null
				}
				await patchStatus(taskId, new PatchPlannerTaskStatusRequest(status)).catch(() => {
					task.status = previousStatus
				})
			}),
		)
		calendar.value!.completedTasks = store.tasks.filter(t => t.isDone).length
		store.clearSelection()
	}

	async function handleSkip(reason: string) {
		const ids = Array.from(store.selectedTaskIds)
		await Promise.all(
			ids.map(async id => {
				const task = store.tasks.find(t => t.id === id) as PlannerTask
				if (!task) return
				await patch(id, {
					startTime: task.startTime,
					endTime: task.endTime,
					status: PlannerTaskStatus.Cancelled,
					skipReason: reason,
				})
				const idx = store.tasks.findIndex(t => t.id === id)
				if (idx >= 0) {
					store.tasks[idx]!.isDone = false
					store.tasks[idx]!.status = PlannerTaskStatus.Cancelled
					;(store.tasks[idx] as PlannerTask).skipReason = reason
				}
			}),
		)
		store.clearSelection()
		showSuccessSnackbar(ids.length > 1 ? 'Tasks skipped' : 'Task skipped')
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
			showFullScreenLoading()
			store.resetStore()
			const dateStr = usStringToUrlString(formatToUsString(new Date(store.viewedDate)))
			const newCalendar = await fetchCalendarByDate(dateStr)
			calendar.value = newCalendar
			store.viewStartTime = newCalendar.wakeUpTime
			store.viewEndTime = newCalendar.bedTime
			await loadTasks()
			loadCompleteResolve?.()
			loadCompleteResolve = null
			hideFullScreenLoading()
		},
		{ deep: true },
	)
</script>

<style scoped>
	/* View-specific styles if needed */
</style>
