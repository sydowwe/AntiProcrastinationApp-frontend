<!-- DayPlannerView.vue -->
<template>
	<!-- A row at every width: in a compact planner the side panel floats over the grid, anchored here
	     (`position: relative`), instead of stacking above it and pushing the grid down (F88).
	     `min-width: 0` on the grid lets it shrink instead of overflowing at its max-content width
	     (~1560 px). -->
	<div
		ref="rootRef"
		class="py-4 d-flex ga-4 w-100"
		style="position: relative"
	>
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
			style="min-width: 0"
			:gridHelpExtra="$t('planner.a11y.toggleDoneShortcut')"
			@delete="crud.del"
		>
			<!-- Header with calendar info -->
			<template #header>
				<VAlert
					v-if="missingDate"
					class="mx-4 mt-4"
					type="warning"
					variant="tonal"
					:title="$t('planner.dayNotFound.title')"
					:text="$t('planner.dayNotFound.text', { date: missingDateFormatted })"
				>
					<template #append>
						<VBtn
							variant="text"
							@click="goToToday"
						>
							{{ $t('planner.dayNotFound.toToday') }}
						</VBtn>
					</template>
				</VAlert>
				<DayPlannerHeader
					v-else
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
					@toggleDone="handleToggleDoneShortcut"
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
	import { computed, onBeforeUnmount, onMounted, provide, ref, watch } from 'vue'
	import DayPlanner from '@/core/dayPlanner/component/DayPlanner.vue'
	import DayPlannerHeader from '@/core/dayPlanner/component/normal/DayPlannerHeader.vue'
	import PlannerTaskDialog from '@/core/dayPlanner/component/normal/PlannerTaskDialog.vue'
	import PlannerTaskBlock from '@/core/dayPlanner/component/normal/PlannerTaskBlock.vue'
	import CalendarDetailsDialog from '@/core/dayPlanner/component/normal/CalendarDetailsDialog.vue'
	import PlannerSelectionActions from '@/core/dayPlanner/component/normal/PlannerSelectionActions.vue'
	import {
		formatDateForApi,
		formatToDateWithDay,
		parseDateFromApi,
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
	import { providePlannerLayout } from '@/core/dayPlanner/composable/usePlannerLayout.ts'
	import { useDayPlannerSettingsStore } from '@/core/dayPlanner/store/dayPlannerSettingsStore.ts'
	import { useQueryFocusTarget } from '@/_common/composable/general/useQueryFocusTarget.ts'
	import { useBulkTaskAction } from '@/core/dayPlanner/composable/useBulkTaskAction.ts'
	import { useTemplatePreview } from '@/core/dayPlanner/composable/useTemplatePreview.ts'
	import { useDayNavigation } from '@/core/dayPlanner/composable/useDayNavigation.ts'
	import { useI18n } from 'vue-i18n'
	import { isRequestCanceled } from '@/_common/axiosConfig.ts'

	const { t } = useI18n()
	const { runBulk } = useBulkTaskAction()
	const { showErrorSnackbar } = useSnackbar()
	const { openDialog } = useDialog()
	const settingsStore = useDayPlannerSettingsStore()
	const { createWithResponse, update, fetchById, deleteEntity, patchStatus, batchDelete, fetchFiltered } =
		useTaskPlannerCrud()

	const { fetchById: fetchTemplateById, fetchAll: fetchAllTemplates } = useTaskPlannerDayTemplateTaskCrud()
	const { fetchByDate: fetchCalendarByDate } = useCalendarQuery()
	// Its own instance: `useEntityQuery` aborts the previous call per method, so a count refresh sharing
	// the navigation's instance could cancel a day change — and the reverse.
	const { fetchById: fetchCalendarForCounts } = useCalendarQuery()
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

	const { fetchSuggestionsForCalendar } = useRepeatingPlannerTaskApi()

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

	// Measured on this view's root, not the window (F88).
	const rootRef = ref<HTMLElement>()
	const compact = providePlannerLayout(rootRef)
	const { activePanel, panelOpen, selectedRoutineItem } = useRoutinePlacement(
		store,
		compact,
		() => settingsStore.detailsPanelExpandedByDefault,
	)

	const { templatePreview, applyTemplate } = useTemplatePreview(store, calendar, fetchTemplateTasks)
	const { navigateDate, navigateToDate, handleUndo, missingDate } = useDayNavigation(
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

		// A missing or malformed `:date` (`not-a-date`, or the ISO `2026-09-11`) opens the user's today —
		// the user's, not the browser's — with a clean URL and no request for the bad segment (F43).
		// Same route, so this component is reused rather than remounted: rewrite the URL and carry on
		// with today, instead of returning and waiting for a mount that never comes.
		const routeDate = router.currentRoute.value.params.date as string | undefined
		const dateParam = routeDate && parseDateFromApi(usStringToUrlString(routeDate)) ? routeDate : todayUrlString()
		if (dateParam !== routeDate) {
			router.replace({
				name: 'dayPlanner',
				params: { date: dateParam },
				query: router.currentRoute.value.query,
			})
		}
		// The calendar fetch must not reject this `Promise.all`: a valid date with no calendar row (a
		// 404 — rows are provisioned only by a write) left `calendar` undefined, the header blank and an
		// unhandled rejection at the hook boundary. The interceptor's toast still fires.
		const [calendarData, templates] = await Promise.all([
			fetchCalendarByDate(dateParam).catch(() => null),
			fetchAllTemplates(),
		])
		allTemplates.value = templates
		if (!calendarData) {
			store.resetStore()
			missingDate.value = dateParam
			return
		}
		calendar.value = calendarData
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
	const missingDateFormatted = computed(() =>
		missingDate.value ? formatToDateWithDay(urlStringToUTCDate(missingDate.value)) : '',
	)

	// A missing day never reaches `store.viewedDate` (assigning it would re-fetch the same 404), so
	// the side panel's title reads the URL's day instead of whichever day loaded last.
	const currentDateFormatted = computed(() => {
		return missingDateFormatted.value || formatToDateWithDay(store.viewedDate)
	})

	function todayUrlString() {
		return usStringToUrlString(isoDateInUserZone())
	}

	function goToToday() {
		navigateToDate(urlStringToUTCDate(todayUrlString()))
	}

	// Load tasks for the current date
	async function loadTasks() {
		// The suggestions call is deliberately NOT allowed to reject this `Promise.all`. Suggestions are
		// an optional prompt in the side panel; the tasks are the screen. While the request was
		// malformed (see `fetchSuggestionsForCalendar`) its 400 rejected the pair, `store.tasks` was
		// never assigned, and the planner rendered an empty grid for every day — with the real cause
		// only visible in the console. A suggestion outage should cost the suggestions, nothing else.
		let tasks: PlannerTask[]
		let fetched: SuggestionResponse[]
		try {
			;[tasks, fetched] = await Promise.all([
				fetchFiltered(new PlannerTaskFilter(calendar.value!.id, store.viewStartTime, store.viewEndTime)),
				fetchSuggestionsForCalendar(calendar.value!.id).catch(() => [] as SuggestionResponse[]),
			])
		} catch (error) {
			// Mount and the `viewedDate` watcher both load, through one `useFetchFiltered` instance, so
			// whenever the two overlap the newer aborts the older — first seen once the malformed-date
			// redirect (F43) shifted their timing. The newer call fills the store; only a real failure
			// propagates.
			if (isRequestCanceled(error)) return
			throw error
		}
		store.tasks = tasks
		// The calendar just loaded came with these tasks, so its counts already match them.
		freshlyLoadedTaskKey = taskCountKey.value
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
		} else {
			logTimeController.value?.openManual(taskId)
		}
	}

	/**
	 * `D` on a task block (F89). Completing is never a bare status flip in this planner: every other
	 * path to *Completed* (the status menu, the selection bar) opens log time, because a completed task
	 * carries when it was actually done. No other key opens that dialog, so `D` is the keyboard way in.
	 * When every selected task is already completed, `D` sets them back to *Not started*, which clears
	 * their logged times. Both halves are the selection bar's own paths. A block focused with nothing
	 * selected acts on itself.
	 */
	function handleToggleDoneShortcut(taskId: number) {
		if (store.selectedTaskIds.size === 0) store.toggleTaskSelection(taskId)
		const selected = store.tasks.filter(t => store.selectedTaskIds.has(t.id))
		if (selected.length === 0) return
		const allCompleted = selected.every(t => t.status === PlannerTaskStatus.Completed)
		void handleChangeStatusOnSelected(allCompleted ? PlannerTaskStatus.NotStarted : PlannerTaskStatus.Completed)
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
				const task = store.tasks.find(t => t.id === id)
				if (!task) return
				// The status sub-resource, like every other status change in this view. This used to call
				// the generic `patch()`, which is `PATCH /planner-task/{id}` — the span endpoint, which maps
				// start/end and nothing else — so a skip persisted neither the status nor the reason and
				// only looked cancelled until the next read. The server keeps the reason only on a Cancelled
				// task and clears it on any other status (backend B26).
				await patchStatus(
					id,
					new PatchPlannerTaskStatusRequest(PlannerTaskStatus.Cancelled, null, null, reason),
					{ _silent: true },
				)
				task.isDone = false
				task.status = PlannerTaskStatus.Cancelled
				task.skipReason = reason
				// A re-skip replaces a built-in key from an earlier skip, and a stale key would win over
				// this text when reasons are counted. If the text is exactly a built-in label, the server
				// stores it as the key (B1); until the refetch the reason grouping maps it the same way.
				task.skipReasonKey = null
				task.actualStartTime = null
				task.actualEndTime = null
			},
			{
				partialKey: 'planner.feedback.taskSkipPartial',
				successKey: 'planner.feedback.taskSkipped',
				afterSettled: () => {
					store.clearSelection()
				},
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

	/**
	 * The header's "N/M tasks" is the server's count for the whole day (F87). Two things rule out
	 * deriving it from `store.tasks`: the grid only fetches tasks between wake-up and bedtime, and the
	 * server counts every task on the day. So after any change to the day's tasks, the counts are read
	 * back from the server rather than recounted here. One watcher covers every path that changes them:
	 * create, delete, paste, split, duplicate, the status changes, reschedule, and each one's undo.
	 *
	 * Previews are left out of the key. Template and copy previews use negative ids, and a cut preview
	 * duplicates a real task under its own id and status, which the de-duplication absorbs.
	 */
	const taskCountKey = computed(() =>
		[...new Set(store.tasks.filter(t => t.id > 0).map(t => `${t.id}:${t.status}`))].sort().join(','),
	)
	let freshlyLoadedTaskKey: string | null = null
	let countRefreshTimer: ReturnType<typeof setTimeout> | undefined

	watch(taskCountKey, key => {
		// A load replaces the tasks together with the calendar they came with — nothing to refresh.
		// One-shot, so an undo that returns to the loaded set still refreshes.
		const skip = key === freshlyLoadedTaskKey
		freshlyLoadedTaskKey = null
		if (skip || !calendar.value) return
		// Debounced, so a batch paste or a bulk status change is one request, not one per task.
		clearTimeout(countRefreshTimer)
		countRefreshTimer = setTimeout(refreshTaskCounts, 300)
	})

	async function refreshTaskCounts() {
		const current = calendar.value
		if (!current) return
		try {
			const fresh = await fetchCalendarForCounts(current.id, { _silent: true })
			// The user may have moved to another day while this was in flight.
			if (calendar.value !== current) return
			current.totalTasks = fresh.totalTasks
			current.completedTasks = fresh.completedTasks
		} catch {
			// A newer refresh cancelled this one, or the read failed. Either way the header keeps its last
			// figure; the next change or the next load corrects it.
		}
	}

	onBeforeUnmount(() => clearTimeout(countRefreshTimer))

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
