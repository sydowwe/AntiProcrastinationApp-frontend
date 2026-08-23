<template>
	<CalendarGrid
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
			<CalendarStatsBar :days="calendarDays" />
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
	import { CalendarRequest } from '@/core/dayPlanner/dto/request/CalendarRequest.ts'
	import { CalendarFilter } from '@/core/dayPlanner/dto/request/CalendarFilter.ts'
	import type { DayType } from '@/_common/dto/enum/DayType.ts'
	import CalendarGrid from '@/_common/component/calendar/CalendarGrid.vue'
	import CalendarDayCellContent from '@/core/dayPlanner/component/calendar/CalendarDayCellContent.vue'
	import CalendarStatsBar from '@/core/dayPlanner/component/calendar/CalendarStatsBar.vue'
	import BulkApplyTemplateForm from '@/core/dayPlanner/component/calendar/BulkApplyTemplateForm.vue'
	import CopyDayForm from '@/core/dayPlanner/component/calendar/CopyDayForm.vue'
	import CalendarDetailsDialog from '@/core/dayPlanner/component/normal/CalendarDetailsDialog.vue'
	import ApplyTemplateActionBar from '@/core/dayPlanner/component/calendar/ApplyTemplateActionBar.vue'
	import BulkSelectActionBar from '@/core/dayPlanner/component/calendar/BulkSelectActionBar.vue'
	import router from '@/router.ts'
	import { formatToDate, usStringToUrlString } from '@/_common/utils/DateTimeHelper.ts'
	import { useTaskPlannerCrud } from '@/core/dayPlanner/api/plannerTaskApi.ts'
	import { useTaskPlannerDayTemplateTaskCrud } from '@/core/dayPlanner/api/taskPlannerDayTemplateApi.ts'
	import { useTemplatePlannerTaskCrud } from '@/core/dayPlanner/api/templatePlannerTaskApi.ts'
	import { useCalendarQuery } from '@/core/activityHistory/api/calendarApi.ts'
	import { useUserPreferences } from '@/core/user/composable/useUserPreferences.ts'
	import { PlannerTaskFilter } from '@/core/dayPlanner/dto/request/PlannerTaskFilter.ts'
	import { TemplatePlannerTaskFilter } from '@/core/dayPlanner/dto/request/template/TemplatePlannerTaskFilter.ts'
	import { ApplyTemplateToTaskPlannerRequest } from '@/core/dayPlanner/dto/request/ApplyTemplateToTaskPlannerRequest.ts'
	import { ApplyTemplateConflictResolution } from '@/core/dayPlanner/dto/enum/ApplyTemplateConflictResolution.ts'
	import { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
	import { PlannerTaskRequest } from '@/core/dayPlanner/dto/request/PlannerTaskRequest.ts'
	import type { TaskPlannerDayTemplate } from '@/core/dayPlanner/dto/response/template/TaskPlannerDayTemplate.ts'
	import { API } from '@/_common/axiosConfig.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useLoading } from '@/_common/composable/general/LoadingComposable.ts'
	import { useDayPlannerSettingsStore } from '@/core/dayPlanner/store/dayPlannerSettingsStore.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { useCalendarModes } from '@/core/dayPlanner/composable/useCalendarModes.ts'
	import { useI18n } from 'vue-i18n'

	const { t } = useI18n()
	const { showSuccessSnackbar, showErrorSnackbar } = useSnackbar()
	const { showFullScreenLoading, hideFullScreenLoading } = useLoading()
	const settingsStore = useDayPlannerSettingsStore()
	const { firstDayOfWeek } = useUserPreferences()
	const { openDialog } = useDialog()
	const { fetchFiltered: fetchPlannerTasks, createWithResponse: createTaskWithResponse } = useTaskPlannerCrud()
	const { fetchAll: fetchAllTemplates } = useTaskPlannerDayTemplateTaskCrud()
	const { fetchFiltered: fetchTemplateTasks } = useTemplatePlannerTaskCrud()
	const { updateWithResponse: updateCalendar, fetchByDate, fetchFiltered: fetchCalendars } = useCalendarQuery()

	const {
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

	const calendarDays = ref<Calendar[]>([])
	const loading = ref(false)
	const dateRange = ref<{ start: Date | null; end: Date | null }>({ start: null, end: null })
	const dayTasksMap = ref<Map<number, PlannerTask[]>>(new Map())
	const activeTemplates = ref<TaskPlannerDayTemplate[]>([])
	const applyConflictResolution = ref<ApplyTemplateConflictResolution>(ApplyTemplateConflictResolution.Ignore)
	const bulkApplying = ref(false)
	const detailsDialog = ref(false)
	const editingDay = ref<Calendar | null>(null)

	function handleDateRangeChange(range: { start: Date | null; end: Date | null }) {
		dateRange.value = range
		refresh()
	}

	async function refresh() {
		if (!dateRange.value.start || !dateRange.value.end) {
			calendarDays.value = []
			return
		}
		loading.value = true
		try {
			calendarDays.value = await fetchCalendars(new CalendarFilter(dateRange.value.start, dateRange.value.end))
		} catch {
			calendarDays.value = []
		} finally {
			loading.value = false
		}
	}

	onMounted(async () => {
		showFullScreenLoading()
		try {
			await settingsStore.loadSettings()
			applyTemplateId.value = settingsStore.defaultApplyTemplateId
			applyConflictResolution.value = settingsStore.defaultConflictResolution
			applyPreviewMode.value = settingsStore.defaultApplyPreviewMode
			activeTemplates.value = (await fetchAllTemplates()).filter(template => template.isActive)
		} finally {
			hideFullScreenLoading()
		}
	})

	watch(calendarDays, async days => {
		dayTasksMap.value = new Map()
		const daysWithTasks = days.filter(d => d.totalTasks > 0)
		await Promise.all(
			daysWithTasks.map(async d => {
				const tasks = await fetchPlannerTasks(new PlannerTaskFilter(d.id, d.wakeUpTime, d.bedTime))
				dayTasksMap.value.set(d.id, tasks)
			}),
		)
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
				showErrorSnackbar(t('dayPlanner.planner.feedback.selectTemplateFirst'))
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
			showSuccessSnackbar(t('dayPlanner.planner.feedback.templateApplied'))
		} catch {
			showErrorSnackbar(t('dayPlanner.planner.feedback.templateApplyFailed'))
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

			const results = await Promise.allSettled(
				days.map(day => {
					const taskRequests = templateTasks.map(t =>
						PlannerTaskRequest.fromEntity(PlannerTask.fromTemplateTask(day.id, t)),
					)
					return API.post(
						'calendar/apply-planner-template',
						new ApplyTemplateToTaskPlannerRequest(templateId, day.id, conflictResolution, taskRequests),
					)
				}),
			)

			const failed = results.filter(r => r.status === 'rejected').length
			selectedDayIds.value = []
			isBulkSelectMode.value = false
			refresh()

			if (failed > 0) {
				showErrorSnackbar(
					t('dayPlanner.planner.feedback.bulkTemplateApplyPartial', {
						succeeded: days.length - failed,
						total: days.length,
						failed,
					}),
				)
			} else {
				showSuccessSnackbar(
					t('dayPlanner.planner.feedback.bulkTemplateApplied', { count: days.length }, days.length),
				)
			}
		} finally {
			bulkApplying.value = false
		}
	}

	async function executeCopyDay(sourceDate: Date) {
		try {
			const formatted = formatToDate(sourceDate)
			const sourceCalendar = await fetchByDate(formatted)
			const sourceTasks = await fetchPlannerTasks(
				new PlannerTaskFilter(sourceCalendar.id, sourceCalendar.wakeUpTime, sourceCalendar.bedTime),
			)
			const targetDays = calendarDays.value.filter(d => selectedDayIds.value.includes(d.id))

			const results = await Promise.allSettled(
				targetDays.flatMap(targetDay =>
					sourceTasks.map(task => {
						const req = PlannerTaskRequest.fromEntity(task)
						req.calendarId = targetDay.id
						return createTaskWithResponse(req)
					}),
				),
			)

			const failed = results.filter(r => r.status === 'rejected').length
			selectedDayIds.value = []
			isBulkSelectMode.value = false
			refresh()

			if (failed > 0) {
				showErrorSnackbar(
					t('dayPlanner.planner.feedback.tasksCopyPartial', {
						succeeded: results.length - failed,
						total: results.length,
						failed,
					}),
				)
			} else {
				showSuccessSnackbar(
					t('dayPlanner.planner.feedback.tasksCopied', { count: targetDays.length }, targetDays.length),
				)
			}
		} catch {
			showErrorSnackbar(t('dayPlanner.planner.feedback.tasksCopyFailed'))
		}
	}

	async function executeBulkDayTypeChange(dayType: DayType) {
		const days = calendarDays.value.filter(d => selectedDayIds.value.includes(d.id))
		const results = await Promise.allSettled(
			days.map(d => {
				const req = CalendarRequest.fromResponse(d)
				req.dayType = dayType
				return updateCalendar(d.id, req)
			}),
		)
		const failed = results.filter(r => r.status === 'rejected').length
		selectedDayIds.value = []
		isBulkSelectMode.value = false
		refresh()

		if (failed > 0) {
			showErrorSnackbar(
				t('dayPlanner.planner.feedback.dayTypeUpdatePartial', {
					succeeded: days.length - failed,
					total: days.length,
					failed,
				}),
			)
		} else {
			showSuccessSnackbar(t('dayPlanner.planner.feedback.dayTypeUpdated', { count: days.length }, days.length))
		}
	}
</script>

<style scoped></style>
