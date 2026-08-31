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
			:gridHelpExtra="$t('planner.a11y.toggleDoneShortcut')"
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
				<PlannerSelectionActions
					@changeStatus="handleChangeStatusOnSelected"
					@reschedule="openRescheduleDialog"
					@logTime="logTimeController?.openFromSelection"
					@split="crud.splitTask"
				/>
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
	import { computed, onMounted, provide, ref, watch } from 'vue'
	import DayPlanner from '@/core/dayPlanner/component/DayPlanner.vue'
	import DayPlannerHeader from '@/core/dayPlanner/component/normal/DayPlannerHeader.vue'
	import PlannerTaskDialog from '@/core/dayPlanner/component/normal/PlannerTaskDialog.vue'
	import PlannerTaskBlock from '@/core/dayPlanner/component/normal/PlannerTaskBlock.vue'
	import CalendarDetailsDialog from '@/core/dayPlanner/component/normal/CalendarDetailsDialog.vue'
	import PlannerSelectionActions from '@/core/dayPlanner/component/normal/PlannerSelectionActions.vue'
	import {
		formatDateForApi,
		formatToDateWithDay,
		urlStringToUTCDate,
		usStringToUrlString,
	} from '@/_common/utils/DateTimeHelper.ts'
	import { isoDateInUserZone } from '@/_common/composable/general/useUserClock.ts'
	import { useDayPlannerStore } from '@/core/dayPlanner/store/dayPlannerStore.ts'
	import { PLANNER_STORE_KEY } from '@/core/dayPlanner/store/IBaseDayPlannerStore.ts'
	import { useCalendarQuery } from '@/core/activityHistory/api/calendarApi.ts'
	import { useTaskPlannerCrud } from '@/core/dayPlanner/api/plannerTaskApi.ts'
	import { useTemplatePlannerTaskCrud } from '@/core/dayPlanner/api/templatePlannerTaskApi.ts'
	import { PlannerTaskRequest } from '@/core/dayPlanner/dto/request/PlannerTaskRequest.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import router from '@/router.ts'
	import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
	import { PlannerTaskFilter } from '@/core/dayPlanner/dto/request/PlannerTaskFilter.ts'
	import type { Calendar } from '@/core/dayPlanner/dto/response/Calendar.ts'
	import DayPlannerSidePanel from '@/core/dayPlanner/component/normal/DayPlannerSidePanel.vue'
	import UseTemplateActionBar from '@/core/dayPlanner/component/normal/UseTemplateActionBar.vue'
	import { useTaskPlannerDayTemplateTaskCrud } from '@/core/dayPlanner/api/taskPlannerDayTemplateApi.ts'
	import type { TaskPlannerDayTemplate } from '@/core/dayPlanner/dto/response/template/TaskPlannerDayTemplate.ts'
	import RescheduleForm from '@/core/dayPlanner/component/normal/RescheduleForm.vue'
	import SkipReasonForm from '@/core/dayPlanner/component/normal/SkipReasonForm.vue'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import DayPlannerLogTimeController from '@/core/dayPlanner/component/normal/DayPlannerLogTimeController.vue'
	import { PlannerTaskStatus } from '@/core/dayPlanner/dto/enum/PlannerTaskStatus.ts'
	import { PatchPlannerTaskStatusRequest } from '@/core/dayPlanner/dto/request/PatchPlannerTaskStatusRequest.ts'
	import { useClipboardHandling } from '@/core/dayPlanner/composable/useClipboardHandling.ts'
	import { usePlannerCrud } from '@/core/dayPlanner/composable/usePlannerCrud.ts'
	import { useTaskReminders } from '@/core/dayPlanner/composable/useTaskReminders.ts'
	import { useRepeatingPlannerTaskApi } from '@/core/dayPlanner/api/repeatingPlannerTaskApi.ts'
	import type { SuggestionResponse } from '@/core/dayPlanner/dto/response/SuggestionResponse.ts'
	import { useRoutinePlacement } from '@/core/dayPlanner/composable/useRoutinePlacement.ts'
	import { useDayPlannerSettingsStore } from '@/core/dayPlanner/store/dayPlannerSettingsStore.ts'
	import { useQueryFocusTarget } from '@/_common/composable/general/useQueryFocusTarget.ts'
	import { useBulkTaskAction } from '@/core/dayPlanner/composable/useBulkTaskAction.ts'
	import { useTemplatePreview } from '@/core/dayPlanner/composable/useTemplatePreview.ts'
	import { useDayNavigation } from '@/core/dayPlanner/composable/useDayNavigation.ts'
	import { useI18n } from 'vue-i18n'

	const { t } = useI18n()
	const { runBulk } = useBulkTaskAction()
	const { showErrorSnackbar } = useSnackbar()
	const { openDialog } = useDialog()
	const settingsStore = useDayPlannerSettingsStore()
	const { createWithResponse, update, patch, fetchById, deleteEntity, patchStatus, batchDelete, fetchFiltered } =
		useTaskPlannerCrud()

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
	provide(PLANNER_STORE_KEY, store)

	// `BaseTaskBlock` already renders `data-task-id` for its own keyboard handling, so the deep link
	// needs no new markup here.
	const { reveal: revealFocusedTask } = useQueryFocusTarget({
		selector: id => `[data-task-id="${CSS.escape(id)}"]`,
	})

	const calendar = ref<Calendar>()
	const calendarDetailsDialog = ref(false)

	const suggestions = ref<SuggestionResponse[]>([])
	const addedSuggestionIds = ref<Set<string>>(new Set())
	const allTemplates = ref<TaskPlannerDayTemplate[]>([])

	const { activePanel, panelOpen, selectedRoutineItem } = useRoutinePlacement(store)

	const { templatePreview, applyTemplate } = useTemplatePreview(store, calendar, fetchTemplateTasks)
	const { navigateDate, handleUndo } = useDayNavigation(
		store,
		settingsStore,
		calendar,
		loadTasks,
		fetchCalendarByDate,
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

		// `?focus=<taskId>` — arriving from a notification, or from anything else that knew a task id
		// but not its date (see PlannerTaskLinkView). Deliberately after `loadTasks()`: the block cannot
		// be scrolled to before it exists. Not awaited — the reveal polls for the element on its own and
		// nothing below depends on it.
		void revealFocusedTask()
	})

	// View-specific computed properties
	const currentDateFormatted = computed(() => {
		return formatToDateWithDay(store.viewedDate)
	})

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
			await patchStatus(taskId, request, { _silent: true }).catch(() => {
				task.status = previousStatus
				showErrorSnackbar(t('planner.feedback.taskStatusUpdateFailed'))
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
		await runBulk(
			selectedTaskIds,
			async taskId => {
				const task = store.tasks.find(e => e.id === taskId)
				if (!task) return
				const previousStatus = task.status
				task.status = status
				if (status === PlannerTaskStatus.NotStarted) {
					task.actualStartTime = null
					task.actualEndTime = null
				}
				try {
					await patchStatus(taskId, new PatchPlannerTaskStatusRequest(status), { _silent: true })
				} catch (error) {
					task.status = previousStatus
					throw error
				}
			},
			{
				partialKey: 'planner.feedback.statusUpdatePartial',
				successKey: 'planner.feedback.statusUpdated',
				afterSettled: () => {
					calendar.value!.completedTasks = store.tasks.filter(t => t.isDone).length
					store.clearSelection()
				},
			},
		)
	}

	async function openSkipDialog() {
		const result = await openDialog<{ reason: string }>({
			component: SkipReasonForm,
			dialogProps: {
				title: t('planner.dialog.skipTaskTitle'),
				confirmBtnLabel: t('planner.actions.skip'),
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
				title: t('planner.dialog.rescheduleTasksTitle'),
				confirmBtnLabel: t('planner.actions.reschedule'),
			},
		})
		if (result) {
			await handleReschedule(result.date)
		}
	}

	async function handleSkip(reason: string) {
		await runBulk(
			Array.from(store.selectedTaskIds),
			async id => {
				const task = store.tasks.find(t => t.id === id) as PlannerTask
				if (!task) return
				await patch(
					id,
					{
						startTime: task.startTime,
						endTime: task.endTime,
						status: PlannerTaskStatus.Cancelled,
						skipReason: reason,
					},
					{ _silent: true },
				)
				const idx = store.tasks.findIndex(t => t.id === id)
				if (idx >= 0) {
					store.tasks[idx]!.isDone = false
					store.tasks[idx]!.status = PlannerTaskStatus.Cancelled
					;(store.tasks[idx] as PlannerTask).skipReason = reason
				}
			},
			{
				partialKey: 'planner.feedback.taskSkipPartial',
				successKey: 'planner.feedback.taskSkipped',
				afterSettled: () => store.clearSelection(),
			},
		)
	}

	async function handleReschedule(targetDate: Date) {
		const targetCalendar = await fetchCalendarByDate(usStringToUrlString(formatDateForApi(targetDate)))
		await runBulk(
			Array.from(store.selectedTaskIds),
			async id => {
				const task = store.tasks.find(t => t.id === id)
				if (!task) return
				const request = PlannerTaskRequest.fromEntity(task as PlannerTask)
				request.calendarId = targetCalendar.id
				await update(id, request, { _silent: true })
				return id
			},
			{
				partialKey: 'planner.feedback.taskReschedulePartial',
				successKey: 'planner.feedback.tasksRescheduled',
				afterSettled: results => {
					const succeededIds = new Set(results.filter(r => r.status === 'fulfilled').map(r => r.value))
					store.tasks = store.tasks.filter(t => !succeededIds.has(t.id))
					store.clearSelection()
				},
			},
		)
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
</script>

<style scoped>
	/* View-specific styles if needed */
</style>
