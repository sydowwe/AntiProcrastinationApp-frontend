<!-- OverdueTasksBanner.vue -->
<template>
	<SubtleCard
		v-if="overdueTasks.length && showBanner"
		color="error"
		title="Not completed yesterday:"
		closable
		class="mb-4"
		@close="showBanner = false"
	>
		<div class="d-flex flex-wrap ga-2 mb-2">
			<VChip
				v-for="t in overdueTasks"
				:key="t.id"
				size="small"
				rounded="sm"
				style="cursor: pointer"
				@click="copyOverdueTask(t)"
			>
				{{ t.activity.name }}
			</VChip>
		</div>
		<div class="d-flex align-center ga-2">
			<VSelect
				v-model="conflictResolution"
				:items="conflictResolutionOptions"
				density="compact"
				hideDetails
				style="min-width: 150px; max-width: 150px"
			/>
			<VBtn
				variant="tonal"
				@click="copyOverdueTasks"
			>
				Copy all
			</VBtn>
		</div>
	</SubtleCard>
</template>

<script setup lang="ts">
	import { ref, watch } from 'vue'
	import type { Calendar } from '@/core/dayPlanner/dto/response/Calendar.ts'
	import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
	import { ApplyTemplateConflictResolution } from '@/core/dayPlanner/dto/enum/ApplyTemplateConflictResolution.ts'
	import { getEnumSelectOptions } from '@/_common/composable/general/EnumComposable.ts'
	import { PlannerTaskRequest } from '@/core/dayPlanner/dto/request/PlannerTaskRequest.ts'
	import { PlannerTaskFilter } from '@/core/dayPlanner/dto/request/PlannerTaskFilter.ts'
	import { useTaskPlannerCrud } from '@/core/dayPlanner/api/plannerTaskApi.ts'
	import { useCalendarQuery } from '@/core/activityHistory/api/calendarApi.ts'
	import { formatDateForApi, usStringToUrlString } from '@/_common/utils/DateTimeHelper.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useDayPlannerStore } from '@/core/dayPlanner/store/dayPlannerStore.ts'
	import SubtleCard from '@/_common/component/feedback/SubtleCard.vue'

	const { calendar } = defineProps<{
		calendar?: Calendar
	}>()

	const store = useDayPlannerStore()
	const { createWithResponse, batchDelete, fetchFiltered } = useTaskPlannerCrud()
	const { fetchByDate: fetchCalendarByDate } = useCalendarQuery()
	const { showSuccessSnackbar } = useSnackbar()

	const overdueTasks = ref<PlannerTask[]>([])
	const showBanner = ref(true)
	const conflictResolution = ref(ApplyTemplateConflictResolution.Ignore)
	const conflictResolutionOptions = getEnumSelectOptions(ApplyTemplateConflictResolution, 'planner')

	watch(
		() => calendar?.id,
		async newId => {
			showBanner.value = true
			overdueTasks.value = []
			if (!newId) return
			const today = new Date()
			const isToday =
				store.viewedDate.getFullYear() === today.getFullYear() &&
				store.viewedDate.getMonth() === today.getMonth() &&
				store.viewedDate.getDate() === today.getDate()
			if (!isToday) return
			try {
				const yesterday = new Date(store.viewedDate)
				yesterday.setDate(yesterday.getDate() - 1)
				const prevCalendar = await fetchCalendarByDate(usStringToUrlString(formatDateForApi(yesterday)))
				const prevTasks = await fetchFiltered(
					new PlannerTaskFilter(prevCalendar.id, prevCalendar.wakeUpTime, prevCalendar.bedTime),
				)
				const planActivityIds = new Set(store.tasks.map(t => t.activity.id))
				overdueTasks.value = prevTasks.filter(
					t => !t.isDone && !t.isBackground && !planActivityIds.has(t.activity.id),
				)
			} catch {
				overdueTasks.value = []
			}
		},
		{ immediate: true },
	)

	function getOverlappingTasks(task: PlannerTask): PlannerTask[] {
		return store.tasks.filter(
			t =>
				t.id > 0 &&
				!t.isBackground &&
				t.startTime.getInMinutes < task.endTime.getInMinutes &&
				t.endTime.getInMinutes > task.startTime.getInMinutes,
		) as PlannerTask[]
	}

	async function copyOverdueTask(task: PlannerTask) {
		const resolution = conflictResolution.value
		const overlapping = getOverlappingTasks(task)
		if (overlapping.length > 0) {
			if (resolution === ApplyTemplateConflictResolution.MergeIgnore) return
			if (
				resolution === ApplyTemplateConflictResolution.Overwrite ||
				resolution === ApplyTemplateConflictResolution.MergeOverwrite
			) {
				await batchDelete(overlapping.map(t => t.id))
				store.tasks = store.tasks.filter(t => !overlapping.some(o => o.id === t.id))
			}
		}
		const request = PlannerTaskRequest.fromEntity(task)
		request.calendarId = calendar?.id
		const created = await createWithResponse(request)
		if (created.isBackground) {
			store.updateIsDuringBackgroundFlags(created)
		} else {
			created.isDuringBackgroundTask = store.checkOverlapsBackground(created)
		}
		store.setGridPositionFromSpan(created)
		store.tasks.push(created)
		overdueTasks.value = overdueTasks.value.filter(t => t.id !== task.id)
		if (overdueTasks.value.length === 0) showBanner.value = false
	}

	async function copyOverdueTasks() {
		for (const task of [...overdueTasks.value]) {
			await copyOverdueTask(task)
		}
		showSuccessSnackbar('Tasks carried over')
	}
</script>
