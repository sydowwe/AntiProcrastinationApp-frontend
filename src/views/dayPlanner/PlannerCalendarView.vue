<template>
	<CalendarGrid
		ref="calendarGridRef"
		class="py-4"
		:selectedIds="selectedDayIds"
		@dayClick="handleDayClick"
	>
		<template #toolbar-end>
			<VBtn
				:color="isBulkSelectMode ? 'secondary' : 'secondaryOutline'"
				:variant="isBulkSelectMode ? 'elevated' : 'outlined'"
				prependIcon="fas fa-calendar-check"
				@click="toggleBulkSelectMode"
			>
				Select Days
			</VBtn>
			<VBtn
				:color="isEditDetailsMode ? 'secondary' : 'secondaryOutline'"
				:variant="isEditDetailsMode ? 'elevated' : 'outlined'"
				prependIcon="fas fa-pen-to-square"
				@click="toggleEditDetailsMode"
			>
				Edit Details
			</VBtn>
			<VBtn
				:color="isApplyTemplateMode ? 'primary' : 'primaryOutline'"
				:variant="isApplyTemplateMode ? 'elevated' : 'outlined'"
				prependIcon="fas fa-wand-magic-sparkles"
				@click="toggleApplyTemplateMode"
			>
				Apply Template
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
		@openApplyTemplate="bulkApplyDialog = true"
		@openCopyDay="copyDayDialog = true"
	/>

	<BulkApplyTemplateDialog
		v-model="bulkApplyDialog"
		:selectedCount="selectedDayIds.length"
		:activeTemplates
		@apply="executeBulkApply"
	/>

	<CopyDayDialog
		v-model="copyDayDialog"
		:selectedCount="selectedDayIds.length"
		@copy="executeCopyDay"
	/>

	<CalendarDetailsDialog
		v-model="detailsDialog"
		:calendar="editingDay ?? undefined"
		@updated="calendarGridRef?.refresh()"
	/>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref, watch } from 'vue'
	import type { ICalendar } from '@/dtos/response/activityPlanning/ICalendar.ts'
	import type { Calendar } from '@/dtos/response/activityPlanning/Calendar.ts'
	import { CalendarRequest } from '@/dtos/request/activityPlanning/CalendarRequest.ts'
	import { DayType } from '@/dtos/enum/DayType.ts'
	import CalendarGrid from '@/components/general/calendar/CalendarGrid.vue'
	import CalendarDayCellContent from '@/components/dayPlanner/calendar/CalendarDayCellContent.vue'
	import CalendarStatsBar from '@/components/dayPlanner/calendar/CalendarStatsBar.vue'
	import BulkApplyTemplateDialog from '@/components/dayPlanner/calendar/BulkApplyTemplateDialog.vue'
	import CopyDayDialog from '@/components/dayPlanner/calendar/CopyDayDialog.vue'
	import CalendarDetailsDialog from '@/components/dayPlanner/normal/CalendarDetailsDialog.vue'
	import ApplyTemplateActionBar from '@/components/dayPlanner/calendar/ApplyTemplateActionBar.vue'
	import BulkSelectActionBar from '@/components/dayPlanner/calendar/BulkSelectActionBar.vue'
	import router from '@/plugins/router.ts'
	import { useDateTime } from '@/utils/DateTimeHelper.ts'
	import { useTaskPlannerCrud } from '@/api/taskPlanner/plannerTaskApi.ts'
	import { useTaskPlannerDayTemplateTaskCrud } from '@/api/taskPlanner/taskPlannerDayTemplateApi.ts'
	import { useTemplatePlannerTaskCrud } from '@/api/taskPlanner/templatePlannerTaskApi.ts'
	import { useCalendarQuery } from '@/api/calendarApi.ts'
	import { PlannerTaskFilter } from '@/dtos/request/activityPlanning/PlannerTaskFilter.ts'
	import { TemplatePlannerTaskFilter } from '@/dtos/request/activityPlanning/template/TemplatePlannerTaskFilter.ts'
	import { ApplyTemplateToTaskPlannerRequest } from '@/dtos/request/activityPlanning/ApplyTemplateToTaskPlannerRequest.ts'
	import { ApplyTemplateConflictResolution } from '@/dtos/enum/ApplyTemplateConflictResolution.ts'
	import { PlannerTask } from '@/dtos/response/activityPlanning/PlannerTask.ts'
	import { PlannerTaskRequest } from '@/dtos/request/activityPlanning/PlannerTaskRequest.ts'
	import type { TaskPlannerDayTemplate } from '@/dtos/response/activityPlanning/template/TaskPlannerDayTemplate.ts'
	import { API } from '@/plugins/axiosConfig.ts'
	import { useSnackbar } from '@/composables/general/SnackbarComposable.ts'
	import { useLoading } from '@/composables/general/LoadingComposable.ts'
	import { useDayPlannerSettingsStore } from '@/stores/dayPlanner/dayPlannerSettingsStore.ts'
	import { useCalendarModes } from '@/composables/dayPlanner/useCalendarModes.ts'

	const { usStringToUrlString, formatToDate } = useDateTime()
	const { showSuccessSnackbar, showErrorSnackbar } = useSnackbar()
	const { showFullScreenLoading } = useLoading()
	const settingsStore = useDayPlannerSettingsStore()
	const { fetchFiltered: fetchPlannerTasks, createWithResponse: createTaskWithResponse } = useTaskPlannerCrud()
	const { fetchAll: fetchAllTemplates } = useTaskPlannerDayTemplateTaskCrud()
	const { fetchFiltered: fetchTemplateTasks } = useTemplatePlannerTaskCrud()
	const { updateWithResponse: updateCalendar, fetchByDate } = useCalendarQuery()

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

	const calendarGridRef = ref<InstanceType<typeof CalendarGrid> | null>(null)
	const dayTasksMap = ref<Map<number, PlannerTask[]>>(new Map())
	const activeTemplates = ref<TaskPlannerDayTemplate[]>([])
	const applyConflictResolution = ref<ApplyTemplateConflictResolution>(ApplyTemplateConflictResolution.Ignore)
	const bulkApplyDialog = ref(false)
	const bulkApplying = ref(false)
	const copyDayDialog = ref(false)
	const detailsDialog = ref(false)
	const editingDay = ref<Calendar | null>(null)

	const calendarDays = computed(() => (calendarGridRef.value?.calendarData ?? []) as Calendar[])

	onMounted(async () => {
		showFullScreenLoading()
		await settingsStore.loadSettings()
		applyTemplateId.value = settingsStore.defaultApplyTemplateId
		applyConflictResolution.value = settingsStore.defaultConflictResolution
		applyPreviewMode.value = settingsStore.defaultApplyPreviewMode
		activeTemplates.value = (await fetchAllTemplates()).filter(t => t.isActive)
	})

	watch(
		() => calendarGridRef.value?.calendarData,
		async days => {
			if (!days) return
			dayTasksMap.value = new Map()
			const daysWithTasks = (days as Calendar[]).filter(d => d.totalTasks > 0)
			await Promise.all(
				daysWithTasks.map(async d => {
					const tasks = await fetchPlannerTasks(new PlannerTaskFilter(d.id, d.wakeUpTime, d.bedTime))
					dayTasksMap.value.set(d.id, tasks)
				}),
			)
		},
		{ deep: true },
	)

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
				showErrorSnackbar('Select a template first')
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
			calendarGridRef.value?.refresh()
			showSuccessSnackbar(`Template applied`)
		} catch {
			showErrorSnackbar('Failed to apply template')
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
			bulkApplyDialog.value = false
			calendarGridRef.value?.refresh()

			if (failed > 0)
				showErrorSnackbar(`Applied to ${days.length - failed}/${days.length} days — ${failed} failed`)
			else showSuccessSnackbar(`Template applied to ${days.length} day(s)`)
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

			await Promise.allSettled(
				targetDays.flatMap(targetDay =>
					sourceTasks.map(task => {
						const req = PlannerTaskRequest.fromEntity(task)
						req.calendarId = targetDay.id
						return createTaskWithResponse(req)
					}),
				),
			)

			selectedDayIds.value = []
			isBulkSelectMode.value = false
			copyDayDialog.value = false
			calendarGridRef.value?.refresh()
			showSuccessSnackbar(`Tasks copied to ${targetDays.length} day(s)`)
		} catch {
			showErrorSnackbar('Failed to copy tasks')
		}
	}

	async function executeBulkDayTypeChange(dayType: DayType) {
		const days = calendarDays.value.filter(d => selectedDayIds.value.includes(d.id))
		await Promise.allSettled(
			days.map(d => {
				const req = CalendarRequest.fromResponse(d)
				req.dayType = dayType
				return updateCalendar(d.id, req)
			}),
		)
		selectedDayIds.value = []
		isBulkSelectMode.value = false
		calendarGridRef.value?.refresh()
		showSuccessSnackbar(`Day type updated for ${days.length} day(s)`)
	}
</script>

<style scoped></style>
