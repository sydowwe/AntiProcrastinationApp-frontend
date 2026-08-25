<template>
	<CalendarGrid
		ref="calendarGridRef"
		class="py-4"
		:days="calendarDays"
		:loading
		:selectedIds="selectedDayIds"
		:firstDayOfWeek
		@dayClick="handleDayClick"
		@dateRangeChange="handleDateRangeChange"
	>
		<template #toolbar-end>
			<VBtn
				:color="isBulkSelectMode ? 'secondary' : 'secondaryOutline'"
				:variant="isBulkSelectMode ? 'elevated' : 'outlined'"
				prependIcon="fas fa-calendar-check"
				@click="toggleBulkSelectMode"
			>
				{{ $t('planner.calendar.selectDays') }}
			</VBtn>
			<VBtn
				:color="isEditDetailsMode ? 'secondary' : 'secondaryOutline'"
				:variant="isEditDetailsMode ? 'elevated' : 'outlined'"
				prependIcon="fas fa-pen-to-square"
				@click="toggleEditDetailsMode"
			>
				{{ $t('planner.calendar.editDetails') }}
			</VBtn>
			<VBtn
				:color="isApplyTemplateMode ? 'primary' : 'primaryOutline'"
				:variant="isApplyTemplateMode ? 'elevated' : 'outlined'"
				prependIcon="fas fa-wand-magic-sparkles"
				@click="toggleApplyTemplateMode"
			>
				{{ $t('planner.calendar.applyTemplate') }}
			</VBtn>
		</template>

		<template #day-cell-content="{ day }">
			<CalendarDayCellContent
				:day="asCalendar(day)"
				:selected="selectedDayIds.includes(asCalendar(day).id)"
				:tasks="dayTasksMap.get(asCalendar(day).id) ?? []"
			/>
		</template>

		<template #footer-center>
			<div class="footer-stack">
				<CalendarStatsBar :days="calendarDays" />
				<PlanVsActualTrendLine :trend="planVsActualTrend" />
			</div>
		</template>
	</CalendarGrid>

	<ApplyTemplateActionBar
		:isShown="isApplyTemplateMode"
		:activeTemplates
		v-model:templateId="applyTemplateId"
		v-model:previewMode="applyPreviewMode"
		v-model:conflictResolution="applyConflictResolution"
		@cancel="toggleApplyTemplateMode"
	/>

	<BulkSelectActionBar
		:isShown="isBulkSelectMode"
		:selectedCount="selectedDayIds.length"
		:bulkApplying
		@cancel="toggleBulkSelectMode"
		@selectAll="selectAllShown"
		@changeDayType="executeBulkDayTypeChange"
		@openApplyTemplate="openBulkApplyDialog"
		@openCopyDay="openCopyDayDialog"
	/>

	<CalendarDetailsDialog
		v-model="detailsDialog"
		:calendar="editingDay ?? undefined"
		@updated="refresh()"
	/>
</template>

<script setup lang="ts">
	import { onMounted, ref, watch } from 'vue'
	import type { ICalendar } from '@/_common/dto/ICalendar.ts'
	import type { Calendar } from '@/core/dayPlanner/dto/response/Calendar.ts'
	import { CalendarFilter } from '@/core/dayPlanner/dto/request/CalendarFilter.ts'
	import { PlanVsActualTrendFilter } from '@/core/dayPlanner/dto/request/PlanVsActualTrendFilter.ts'
	import { PlanVsActualTrend } from '@/core/dayPlanner/dto/response/PlanVsActualTrend.ts'
	import type { DayType } from '@/_common/dto/enum/DayType.ts'
	import CalendarGrid from '@/_common/component/calendar/CalendarGrid.vue'
	import CalendarDayCellContent from '@/core/dayPlanner/component/calendar/CalendarDayCellContent.vue'
	import CalendarStatsBar from '@/core/dayPlanner/component/calendar/CalendarStatsBar.vue'
	import PlanVsActualTrendLine from '@/core/dayPlanner/component/calendar/PlanVsActualTrendLine.vue'
	import BulkApplyTemplateForm from '@/core/dayPlanner/component/calendar/BulkApplyTemplateForm.vue'
	import CopyDayForm from '@/core/dayPlanner/component/calendar/CopyDayForm.vue'
	import CalendarDetailsDialog from '@/core/dayPlanner/component/normal/CalendarDetailsDialog.vue'
	import ApplyTemplateActionBar from '@/core/dayPlanner/component/calendar/ApplyTemplateActionBar.vue'
	import BulkSelectActionBar from '@/core/dayPlanner/component/calendar/BulkSelectActionBar.vue'
	import router from '@/router.ts'
	import { formatDateForApi, formatToDate, usStringToUrlString } from '@/_common/utils/DateTimeHelper.ts'
	import { useTaskPlannerCrud } from '@/core/dayPlanner/api/plannerTaskApi.ts'
	import { useTaskPlannerDayTemplateTaskCrud } from '@/core/dayPlanner/api/taskPlannerDayTemplateApi.ts'
	import { useTemplatePlannerTaskCrud } from '@/core/dayPlanner/api/templatePlannerTaskApi.ts'
	import { useCalendarQuery } from '@/core/activityHistory/api/calendarApi.ts'
	import { useUserPreferences } from '@/core/user/composable/useUserPreferences.ts'
	import { TemplatePlannerTaskFilter } from '@/core/dayPlanner/dto/request/template/TemplatePlannerTaskFilter.ts'
	import { ApplyTemplateToTaskPlannerRequest } from '@/core/dayPlanner/dto/request/ApplyTemplateToTaskPlannerRequest.ts'
	import { ApplyTemplateToTaskPlannerBatchRequest } from '@/core/dayPlanner/dto/request/ApplyTemplateToTaskPlannerBatchRequest.ts'
	import { ApplyTemplateConflictResolution } from '@/core/dayPlanner/dto/enum/ApplyTemplateConflictResolution.ts'
	import { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
	import { PlannerTaskRequest } from '@/core/dayPlanner/dto/request/PlannerTaskRequest.ts'
	import type { CalendarTaskSummary } from '@/core/dayPlanner/dto/response/CalendarTaskSummary.ts'
	import type { TaskPlannerDayTemplate } from '@/core/dayPlanner/dto/response/template/TaskPlannerDayTemplate.ts'
	import { API } from '@/_common/axiosConfig.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useLoading } from '@/_common/composable/general/LoadingComposable.ts'
	import { useDayPlannerSettingsStore } from '@/core/dayPlanner/store/dayPlannerSettingsStore.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { useCalendarModes } from '@/core/dayPlanner/composable/useCalendarModes.ts'
	import { useI18n } from 'vue-i18n'

	const { t } = useI18n()
	const { showSuccessSnackbar, showErrorSnackbar, showSnackbar } = useSnackbar()
	const { showFullScreenLoading, hideFullScreenLoading } = useLoading()
	const settingsStore = useDayPlannerSettingsStore()
	const { firstDayOfWeek } = useUserPreferences()
	const { openDialog } = useDialog()
	const { copyToDays, fetchPlanVsActualTrend } = useTaskPlannerCrud()
	const { fetchAll: fetchAllTemplates } = useTaskPlannerDayTemplateTaskCrud()
	const { fetchFiltered: fetchTemplateTasks } = useTemplatePlannerTaskCrud()
	const {
		fetchByDate,
		fetchFiltered: fetchCalendars,
		fetchTaskSummaries,
		applyTemplateBatch,
		changeDayTypeBatch,
	} = useCalendarQuery()

	const {
		mode: calendarMode,
		isBulkSelectMode,
		isEditDetailsMode,
		isApplyTemplateMode,
		selectedDayIds,
		applyTemplateId,
		applyPreviewMode,
		toggleBulkSelectMode,
		toggleEditDetailsMode,
		toggleApplyTemplateMode,
		toggleDaySelection,
	} = useCalendarModes()

	const calendarGridRef = ref<InstanceType<typeof CalendarGrid> | null>(null)
	// Set while we are writing URL-derived state into the calendar/mode refs, so the write-back
	// watchers below don't turn our own sync into a spurious history entry.
	let isApplyingUrlState = false

	const calendarDays = ref<Calendar[]>([])
	const loading = ref(false)
	const dateRange = ref<{ start: Date | null; end: Date | null }>({ start: null, end: null })
	const dayTasksMap = ref<Map<number, CalendarTaskSummary[]>>(new Map())
	const activeTemplates = ref<TaskPlannerDayTemplate[]>([])
	const applyConflictResolution = ref<ApplyTemplateConflictResolution>(ApplyTemplateConflictResolution.Ignore)
	const bulkApplying = ref(false)
	const detailsDialog = ref(false)
	const editingDay = ref<Calendar | null>(null)
	const planVsActualTrend = ref<PlanVsActualTrend>(PlanVsActualTrend.empty())

	// Guards the calendar/filter + calendar/task-summaries pair: both are in flight together for a
	// date-range change, and a slow response from a month the user has since navigated away from
	// must not land after a newer, faster month already has.
	let refreshRequestId = 0

	function monthKeyFromDate(date: Date): string {
		return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
	}

	function parseMonthKey(key: string): { start: Date; end: Date } | null {
		const match = /^(\d{4})-(\d{2})$/.exec(key)
		if (!match?.[1] || !match[2]) return null
		const year = Number(match[1])
		const month = Number(match[2])
		return { start: new Date(year, month - 1, 1), end: new Date(year, month, 0) }
	}

	function handleDateRangeChange(range: { start: Date | null; end: Date | null }) {
		dateRange.value = range
		refresh()
		syncMonthToUrl(range)
	}

	function syncMonthToUrl(range: { start: Date | null; end: Date | null }) {
		if (isApplyingUrlState || !range.start) return
		const key = monthKeyFromDate(range.start)
		const currentQuery = { ...router.currentRoute.value.query }
		if (key === monthKeyFromDate(new Date())) {
			if (currentQuery.month === undefined) return
			delete currentQuery.month
		} else {
			if (currentQuery.month === key) return
			currentQuery.month = key
		}
		router.push({ query: currentQuery })
	}

	// Mode/template/preview are transient UI state layered on top of whatever month is displayed —
	// they replace the query so the back button walks months rather than undoing mode toggles.
	function syncModeToUrl() {
		if (isApplyingUrlState) return
		const currentQuery = { ...router.currentRoute.value.query }
		delete currentQuery.mode
		delete currentQuery.templateId
		delete currentQuery.preview
		if (calendarMode.value !== 'none') {
			currentQuery.mode = calendarMode.value
			if (calendarMode.value === 'applyTemplate') {
				if (applyTemplateId.value !== null) currentQuery.templateId = String(applyTemplateId.value)
				if (!applyPreviewMode.value) currentQuery.preview = '0'
			}
		}
		router.replace({ query: currentQuery })
	}

	watch([calendarMode, applyTemplateId, applyPreviewMode], syncModeToUrl)

	// Deliberately alongside `refresh`'s Promise.all rather than inside it: this line is secondary to
	// the grid, so a failed aggregate must not cost the month its days or raise the retry snackbar.
	// It shares `refreshRequestId` so a slow month's trend cannot land on a newer one, and falls back
	// to `empty()` — taskCount 0, which renders nothing — rather than leaving the previous month's
	// numbers under a different month's grid.
	async function refreshPlanVsActualTrend(requestId: number, start: Date, end: Date) {
		try {
			const trend = await fetchPlanVsActualTrend(PlanVsActualTrendFilter.fromDates(start, end))
			if (requestId === refreshRequestId) planVsActualTrend.value = trend
		} catch {
			if (requestId === refreshRequestId) planVsActualTrend.value = PlanVsActualTrend.empty()
		}
	}

	async function refresh() {
		if (!dateRange.value.start || !dateRange.value.end) {
			calendarDays.value = []
			dayTasksMap.value = new Map()
			planVsActualTrend.value = PlanVsActualTrend.empty()
			return
		}
		const requestId = ++refreshRequestId
		loading.value = true
		refreshPlanVsActualTrend(requestId, dateRange.value.start, dateRange.value.end)
		try {
			const [days, taskSummaries] = await Promise.all([
				fetchCalendars(new CalendarFilter(dateRange.value.start, dateRange.value.end)),
				fetchTaskSummaries(formatDateForApi(dateRange.value.start), formatDateForApi(dateRange.value.end)),
			])
			if (requestId !== refreshRequestId) return
			calendarDays.value = days
			dayTasksMap.value = taskSummaries
		} catch {
			// Keep whatever days are already on screen — a transient failure should not blank a
			// month the user was already looking at. Offer a retry instead of silently losing it.
			showSnackbar(t('planner.feedback.calendarLoadFailed'), {
				color: 'errorDark',
				actionLabel: t('planner.actions.retry'),
				actionCallback: () => refresh(),
			})
		} finally {
			if (requestId === refreshRequestId) loading.value = false
		}
	}

	onMounted(async () => {
		isApplyingUrlState = true
		const query = router.currentRoute.value.query
		const urlMode = query.mode
		if (urlMode === 'bulkSelect' || urlMode === 'editDetails' || urlMode === 'applyTemplate') {
			calendarMode.value = urlMode
		}
		const urlTemplateId =
			typeof query.templateId === 'string' && query.templateId !== '' ? Number(query.templateId) : null
		const urlPreviewMode = query.preview === '0' ? false : null
		const urlMonth = typeof query.month === 'string' ? query.month : null
		if (urlMonth) {
			const parsed = parseMonthKey(urlMonth)
			if (parsed && calendarGridRef.value) {
				calendarGridRef.value.dateRange = { start: parsed.start, end: parsed.end }
			}
		}
		isApplyingUrlState = false

		showFullScreenLoading()
		try {
			await settingsStore.loadSettings()
			// A URL param must win over the stored default — settings resolve after an await, so the
			// URL-derived values captured above (not a re-read of the query) are what wins here.
			applyTemplateId.value = urlTemplateId ?? settingsStore.defaultApplyTemplateId
			applyConflictResolution.value = settingsStore.defaultConflictResolution
			applyPreviewMode.value = urlPreviewMode ?? settingsStore.defaultApplyPreviewMode
			activeTemplates.value = (await fetchAllTemplates()).filter(template => template.isActive)
		} finally {
			hideFullScreenLoading()
		}
	})

	function asCalendar(day: ICalendar): Calendar {
		return day as Calendar
	}

	async function handleDayClick(day: ICalendar) {
		const cal = day as Calendar
		if (isBulkSelectMode.value) {
			toggleDaySelection(cal.id)
			return
		}
		if (isEditDetailsMode.value) {
			handleEditDetails(cal)
			return
		}
		if (isApplyTemplateMode.value) {
			if (applyTemplateId.value === null) {
				showErrorSnackbar(t('planner.feedback.selectTemplateFirst'))
				return
			}
			const template = activeTemplates.value.find(t => t.id === applyTemplateId.value)!
			if (applyPreviewMode.value) {
				handleQuickApply(cal, template)
			} else {
				await applyTemplateToDaySingle(cal, template)
			}
			return
		}
		router.push({
			name: 'dayPlanner',
			params: { date: usStringToUrlString(cal.date) },
			state: { calendarId: cal.id },
		})
	}

	function selectAllShown() {
		selectedDayIds.value = calendarDays.value.map(d => d.id)
	}

	function handleEditDetails(day: Calendar) {
		editingDay.value = day
		detailsDialog.value = true
	}

	async function applyTemplateToDaySingle(day: Calendar, template: TaskPlannerDayTemplate) {
		try {
			const templateTasks = await fetchTemplateTasks(
				new TemplatePlannerTaskFilter(template.id, template.defaultWakeUpTime, template.defaultBedTime),
			)
			const taskRequests = templateTasks.map(t =>
				PlannerTaskRequest.fromEntity(PlannerTask.fromTemplateTask(day.id, t)),
			)
			await API.post(
				'calendar/apply-planner-template',
				new ApplyTemplateToTaskPlannerRequest(template.id, day.id, applyConflictResolution.value, taskRequests),
			)
			refresh()
			showSuccessSnackbar(t('planner.feedback.templateApplied'))
		} catch {
			showErrorSnackbar(t('planner.feedback.templateApplyFailed'))
		}
	}

	function handleQuickApply(day: Calendar, template: TaskPlannerDayTemplate) {
		router.push({
			name: 'dayPlanner',
			params: { date: usStringToUrlString(day.date) },
			query: { applyTemplateId: template.id.toString() },
			state: { calendarId: day.id },
		})
	}

	async function openBulkApplyDialog() {
		const result = await openDialog<{ templateId: number; conflictResolution: ApplyTemplateConflictResolution }>({
			component: BulkApplyTemplateForm,
			componentProps: { activeTemplates: activeTemplates.value },
			dialogProps: {
				title: t(
					'planner.calendar.applyTemplateToDaysTitle',
					{ count: selectedDayIds.value.length },
					selectedDayIds.value.length,
				),
				confirmBtnLabel: t('planner.actions.apply'),
			},
		})
		if (!result) return
		await executeBulkApply(result.templateId, result.conflictResolution)
	}

	async function openCopyDayDialog() {
		const result = await openDialog<{ sourceDate: Date }>({
			component: CopyDayForm,
			componentProps: { selectedCount: selectedDayIds.value.length },
			dialogProps: {
				title: t(
					'planner.calendar.copyTasksToDaysTitle',
					{ count: selectedDayIds.value.length },
					selectedDayIds.value.length,
				),
				confirmBtnLabel: t('planner.actions.copy'),
			},
		})
		if (!result) return
		await executeCopyDay(result.sourceDate)
	}

	async function executeBulkApply(templateId: number, conflictResolution: ApplyTemplateConflictResolution) {
		bulkApplying.value = true
		try {
			const template = activeTemplates.value.find(t => t.id === templateId)!
			const templateTasks = await fetchTemplateTasks(
				new TemplatePlannerTaskFilter(templateId, template.defaultWakeUpTime, template.defaultBedTime),
			)
			const days = calendarDays.value.filter(d => selectedDayIds.value.includes(d.id))
			// Per-task calendarId is ignored by the batch endpoint — every selected day comes from
			// calendarIds below — so the placeholder here never reaches the server.
			const taskRequests = templateTasks.map(t =>
				PlannerTaskRequest.fromEntity(PlannerTask.fromTemplateTask(0, t)),
			)

			const response = await applyTemplateBatch(
				new ApplyTemplateToTaskPlannerBatchRequest(
					templateId,
					days.map(d => d.id),
					conflictResolution,
					taskRequests,
				),
			)

			selectedDayIds.value = []
			calendarMode.value = 'none'
			refresh()

			if (response.failedCount > 0) {
				showErrorSnackbar(
					t('planner.feedback.bulkTemplateApplyPartial', {
						succeeded: response.succeededCount,
						total: response.results.length,
						failed: response.failedCount,
					}),
				)
			} else {
				showSuccessSnackbar(t('planner.feedback.bulkTemplateApplied', { count: days.length }, days.length))
			}
		} finally {
			bulkApplying.value = false
		}
	}

	async function executeCopyDay(sourceDate: Date) {
		try {
			const formatted = formatToDate(sourceDate)
			const sourceCalendar = await fetchByDate(formatted)
			const targetDays = calendarDays.value.filter(d => selectedDayIds.value.includes(d.id))

			const response = await copyToDays(
				sourceCalendar.id,
				targetDays.map(d => d.id),
			)

			selectedDayIds.value = []
			calendarMode.value = 'none'
			refresh()

			if (response.failedCount > 0) {
				showErrorSnackbar(
					t('planner.feedback.tasksCopyPartial', {
						succeeded: response.succeededCount,
						total: response.results.length,
						failed: response.failedCount,
					}),
				)
			} else {
				showSuccessSnackbar(t('planner.feedback.tasksCopied', { count: targetDays.length }, targetDays.length))
			}
		} catch {
			showErrorSnackbar(t('planner.feedback.tasksCopyFailed'))
		}
	}

	async function executeBulkDayTypeChange(dayType: DayType) {
		const days = calendarDays.value.filter(d => selectedDayIds.value.includes(d.id))
		const response = await changeDayTypeBatch(
			days.map(d => d.id),
			dayType,
		)
		selectedDayIds.value = []
		calendarMode.value = 'none'
		refresh()

		if (response.failedCount > 0) {
			showErrorSnackbar(
				t('planner.feedback.dayTypeUpdatePartial', {
					succeeded: response.succeededCount,
					total: response.results.length,
					failed: response.failedCount,
				}),
			)
		} else {
			showSuccessSnackbar(t('planner.feedback.dayTypeUpdated', { count: days.length }, days.length))
		}
	}
</script>

<style scoped>
	.footer-stack {
		display: flex;
		flex-direction: column;
		gap: 6px;
		align-items: center;
	}
</style>
