<!-- DayPlannerView.vue -->
<template>
	<div class="py-4 d-flex ga-4 w-100">
		<!-- Left panel: unified details/routine panel -->
		<DayPlannerSidePanel
			v-model:panelOpen="panelOpen"
			v-model:activePanel="activePanel"
			:title="currentDateFormatted"
			:calendar
			:suggestions
			:addedIds="addedSuggestionIds"
			@openEditDialog="calendarDetailsDialog = true"
			@useTemplate="templatePreview"
			@addRepeatingTask="handleAddSuggestion"
			@update:selectedItem="selectedRoutineItem = $event"
		/>
		<DayPlanner
			class="flex-fill"
			@delete="crud.del"
		>
			<!-- Header with calendar info -->
			<template #header>
				<DayPlannerHeader
					v-model:activePanel="activePanel"
					v-model:panelOpen="panelOpen"
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
					@click="openRescheduleDialog"
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
				<VBtn
					v-if="store.selectedTaskIds.size === 1 && !store.isTemplateInPreview"
					variant="tonal"
					color="secondaryOutline"
					@click="crud.splitTask"
				>
					Split
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
		<DayPlannerLogTimeController ref="logTimeController" />
	</div>
</template>

<script setup lang="ts">
	import { computed, onMounted, onUnmounted, provide, ref, watch } from 'vue'
	import DayPlanner from '@/core/dayPlanner/component/DayPlanner.vue'
	import DayPlannerHeader from '@/core/dayPlanner/component/normal/DayPlannerHeader.vue'
	import PlannerTaskDialog from '@/core/dayPlanner/component/normal/PlannerTaskDialog.vue'
	import PlannerTaskBlock from '@/core/dayPlanner/component/normal/PlannerTaskBlock.vue'
	import CalendarDetailsDialog from '@/core/dayPlanner/component/normal/CalendarDetailsDialog.vue'
	import {
		formatDateForApi,
		formatToDateWithDay,
		isSameDay,
		urlStringToUTCDate,
		usStringToUrlString,
	} from '@/_common/utils/DateTimeHelper.ts'
	import { isoDateInUserZone } from '@/_common/composable/general/useUserClock.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { useDayPlannerStore } from '@/core/dayPlanner/store/dayPlannerStore.ts'
	import { useCalendarQuery } from '@/core/activityHistory/api/calendarApi.ts'
	import { useTaskPlannerCrud } from '@/core/dayPlanner/api/plannerTaskApi.ts'
	import { useTemplatePlannerTaskCrud } from '@/core/dayPlanner/api/templatePlannerTaskApi.ts'
	import { PlannerTaskRequest } from '@/core/dayPlanner/dto/request/PlannerTaskRequest.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useUndoStack } from '@/_common/composable/general/useUndoStack.ts'
	import router from '@/router.ts'
	import { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
	import { PlannerTaskFilter } from '@/core/dayPlanner/dto/request/PlannerTaskFilter.ts'
	import type { Calendar } from '@/core/dayPlanner/dto/response/Calendar.ts'
	import DayPlannerSidePanel from '@/core/dayPlanner/component/normal/DayPlannerSidePanel.vue'
	import { TemplatePlannerTaskFilter } from '@/core/dayPlanner/dto/request/template/TemplatePlannerTaskFilter.ts'
	import UseTemplateActionBar from '@/core/dayPlanner/component/normal/UseTemplateActionBar.vue'
	import { ApplyTemplateToTaskPlannerRequest } from '@/core/dayPlanner/dto/request/ApplyTemplateToTaskPlannerRequest.ts'
	import { API } from '@/_common/axiosConfig.ts'
	import { ApplyTemplatePlannerTaskResponse } from '@/core/dayPlanner/dto/response/ApplyTemplatePlannerTaskResponse.ts'
	import { useTaskPlannerDayTemplateTaskCrud } from '@/core/dayPlanner/api/taskPlannerDayTemplateApi.ts'
	import type { TaskPlannerDayTemplate } from '@/core/dayPlanner/dto/response/template/TaskPlannerDayTemplate.ts'
	import { useLoading } from '@/_common/composable/general/LoadingComposable.ts'
	import RescheduleForm from '@/core/dayPlanner/component/normal/RescheduleForm.vue'
	import SkipReasonForm from '@/core/dayPlanner/component/normal/SkipReasonForm.vue'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import DayPlannerLogTimeController from '@/core/dayPlanner/component/normal/DayPlannerLogTimeController.vue'
	import { getPlannerTaskStatusIcon, PlannerTaskStatus } from '@/core/dayPlanner/dto/enum/PlannerTaskStatus.ts'
	import { getEnumSelectOptions } from '@/_common/composable/general/EnumComposable.ts'
	import type { ApplyTemplateConflictResolution } from '@/core/dayPlanner/dto/enum/ApplyTemplateConflictResolution.ts'
	import { PatchPlannerTaskStatusRequest } from '@/core/dayPlanner/dto/request/PatchPlannerTaskStatusRequest.ts'
	import { useClipboardHandling } from '@/core/dayPlanner/composable/useClipboardHandling.ts'
	import { usePlannerCrud } from '@/core/dayPlanner/composable/usePlannerCrud.ts'
	import { useTaskReminders } from '@/core/dayPlanner/composable/useTaskReminders.ts'
	import { useRepeatingPlannerTaskApi } from '@/core/dayPlanner/api/repeatingPlannerTaskApi.ts'
	import type { SuggestionResponse } from '@/core/dayPlanner/dto/response/SuggestionResponse.ts'
	import type { RoutineTodoListItemEntity } from '@/core/todoList/dto/response/routine/RoutineTodoListItemEntity.ts'
	import { useDayPlannerSettingsStore } from '@/core/dayPlanner/store/dayPlannerSettingsStore.ts'

	const { showFullScreenLoading, hideFullScreenLoading } = useLoading()
	const { showSuccessSnackbar } = useSnackbar()
	const { openDialog } = useDialog()
	const settingsStore = useDayPlannerSettingsStore()
	const undoStack = useUndoStack()
	const { createWithResponse, update, patch, fetchById, deleteEntity, patchStatus, batchDelete, fetchFiltered } =
		useTaskPlannerCrud()

	const statusOptions = getEnumSelectOptions(PlannerTaskStatus, 'planner.status')
	const { fetchById: fetchTemplateById, fetchAll: fetchAllTemplates } = useTaskPlannerDayTemplateTaskCrud()
	const { fetchByDate: fetchCalendarByDate } = useCalendarQuery()
	const { fetchFiltered: fetchTemplateTasks } = useTemplatePlannerTaskCrud()
	const store = useDayPlannerStore()
	useTaskReminders(
		() => store.tasks,
		() => store.viewedDate,
		() => settingsStore.reminderMinutesBefore,
		() => settingsStore.remindersEnabled,
	)

	function applyContext(req: PlannerTaskRequest) {
		req.calendarId = calendar.value?.id
	}
	function buildRequestFromEntity(task: PlannerTask) {
		return PlannerTaskRequest.fromEntity(task)
	}

	useClipboardHandling(store, {
		createWithResponse,
		batchDelete,
		applyContext,
		buildRequestFromEntity,
		getCurrentContext: () => store.viewedDate.toDateString(),
	})
	const crud = usePlannerCrud(store, {
		createWithResponse,
		update,
		fetchById,
		deleteEntity,
		batchDelete,
		applyContext,
		buildRequestFromEntity,
	})

	const { fetchSuggestionsForDate } = useRepeatingPlannerTaskApi()

	const logTimeController = ref<InstanceType<typeof DayPlannerLogTimeController>>()
	// Provide the store for slot content (EventBlock components)
	provide('plannerStore', store)

	const calendar = ref<Calendar>()
	const calendarDetailsDialog = ref(false)

	const suggestions = ref<SuggestionResponse[]>([])
	const addedSuggestionIds = ref<Set<string>>(new Set())
	const activePanel = ref<'details' | 'routine'>('details')
	const panelOpen = ref(true)
	const selectedRoutineItem = ref<RoutineTodoListItemEntity | null>(null)
	const allTemplates = ref<TaskPlannerDayTemplate[]>([])

	provide('selectedRoutineItem', selectedRoutineItem)

	watch(activePanel, panel => {
		if (panel !== 'routine') selectedRoutineItem.value = null
	})

	watch(selectedRoutineItem, item => {
		store.placingItem = item ? { name: item.activity.name, icon: 'rotate' } : null
	})

	watch(
		() => store.placingItem,
		item => {
			if (!item) selectedRoutineItem.value = null
		},
	)

	// Lifecycle hooks
	onMounted(async () => {
		await settingsStore.loadSettings()
		store.timeSlotDuration = settingsStore.slotDurationMinutes

		const dateParam = router.currentRoute.value.params.date as string | undefined
		if (!dateParam) {
			router.replace({
				name: 'dayPlanner',
				// The user's today, not the browser's — this is the date the planner opens on.
				params: { date: usStringToUrlString(isoDateInUserZone()) },
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
		router.replace({ params: { date: usStringToUrlString(formatDateForApi(store.viewedDate)) } })
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
		if (!settingsStore.arrowKeyNavEnabled) return
		const target = e.target as HTMLElement
		if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return
		if (e.key === 'ArrowLeft') navigateDate(-1)
		else if (e.key === 'ArrowRight') navigateDate(1)
	}

	// Load tasks for the current date
	async function loadTasks() {
		const [tasks, fetched] = await Promise.all([
			fetchFiltered(new PlannerTaskFilter(calendar.value!.id, store.viewStartTime, store.viewEndTime)),
			fetchSuggestionsForDate(formatDateForApi(store.viewedDate)),
		])
		store.tasks = tasks
		suggestions.value = fetched
		addedSuggestionIds.value = new Set()
		store.initializeTaskGridPositions()
		await templatePreview()
	}

	async function handleAddSuggestion(task: SuggestionResponse) {
		const req = new PlannerTaskRequest(task.startTime, task.endTime)
		req.activityId = task.activity.id
		req.isBackground = task.isBackground
		req.location = task.location
		req.notes = task.notes
		req.importanceId = task.importance?.id ?? null
		await crud.create(req)
		addedSuggestionIds.value = new Set([...addedSuggestionIds.value, task.key])
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
			openSkipDialog()
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

	async function openSkipDialog() {
		const result = await openDialog<{ reason: string }>({
			component: SkipReasonForm,
			dialogProps: {
				title: 'Skip task',
				confirmBtnLabel: 'Skip',
				confirmBtnColor: 'warning',
			},
		})
		if (result) {
			await handleSkip(result.reason)
		}
	}

	async function openRescheduleDialog() {
		const result = await openDialog<{ date: Date }>({
			component: RescheduleForm,
			dialogProps: {
				title: 'Reschedule tasks',
				confirmBtnLabel: 'Reschedule',
			},
		})
		if (result) {
			await handleReschedule(result.date)
		}
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
		const targetCalendar = await fetchCalendarByDate(usStringToUrlString(formatDateForApi(targetDate)))
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
			const dateStr = usStringToUrlString(formatDateForApi(new Date(store.viewedDate)))
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
