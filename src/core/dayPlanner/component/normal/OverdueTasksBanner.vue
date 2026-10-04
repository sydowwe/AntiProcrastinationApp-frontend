<!-- OverdueTasksBanner.vue -->
<template>
	<SubtleCard
		v-if="candidates.length && showBanner"
		color="error"
		:title="$t('planner.calendar.openFromEarlierDays')"
		closable
		class="mb-4"
		@close="showBanner = false"
	>
		<div class="d-flex flex-wrap ga-2 mb-2">
			<VChip
				v-for="c in candidates"
				:key="c.task.id"
				size="small"
				rounded="sm"
				role="button"
				@click="carryOverCandidate(c)"
			>
				{{ chipLabel(c) }}
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
				@click="carryOverAll"
			>
				{{ $t('planner.calendar.carryOverAll') }}
			</VBtn>
		</div>
	</SubtleCard>
</template>

<script setup lang="ts">
	import { ref, watch } from 'vue'
	import type { Calendar } from '@/core/dayPlanner/dto/response/Calendar.ts'
	import type { PlannerTask } from '@/core/dayPlanner/dto/response/PlannerTask.ts'
	import type { CarryOverCandidate } from '@/core/dayPlanner/dto/response/CarryOverCandidate.ts'
	import { ApplyTemplateConflictResolution } from '@/core/dayPlanner/dto/enum/ApplyTemplateConflictResolution.ts'
	import { getEnumSelectOptions } from '@/_common/composable/general/EnumComposable.ts'
	import { useTaskPlannerCrud } from '@/core/dayPlanner/api/plannerTaskApi.ts'
	import { formatDateForApi, formatToDateWithoutYear, parseDateFromApi } from '@/_common/utils/DateTimeHelper.ts'
	import { isoDateInUserZone } from '@/_common/composable/general/useUserClock.ts'
	import { useSnackbar } from '@/_common/composable/general/SnackbarComposable.ts'
	import { useDialog } from '@/_common/composable/general/useDialog.ts'
	import { useDeleteConfirmation } from '@/core/user/composable/useDeleteConfirmation.ts'
	import { useDayPlannerStore } from '@/core/dayPlanner/store/dayPlannerStore.ts'
	import SubtleCard from '@/_common/component/feedback/SubtleCard.vue'
	import { useI18n } from 'vue-i18n'

	const { calendar } = defineProps<{
		calendar?: Calendar
	}>()

	const store = useDayPlannerStore()
	const { carryOver, batchDelete, fetchCarryOverCandidates } = useTaskPlannerCrud()
	const { showSuccessSnackbar } = useSnackbar()
	const { confirm } = useDialog()
	const { shouldConfirm } = useDeleteConfirmation()
	const { t } = useI18n()

	const candidates = ref<CarryOverCandidate[]>([])
	const showBanner = ref(true)
	const conflictResolution = ref(ApplyTemplateConflictResolution.Ignore)
	const conflictResolutionOptions = getEnumSelectOptions(ApplyTemplateConflictResolution, 'planner')

	/**
	 * Open tasks from the user's last seven days, in one read. This used to look at yesterday alone —
	 * the client would have had to fan out a by-date + filter pair per day — so anything left open two
	 * days ago never surfaced again. The server already excludes skipped and background tasks.
	 */
	watch(
		() => calendar?.id,
		async newId => {
			showBanner.value = true
			candidates.value = []
			if (!newId) return
			// A calendar day on the left, "what day is it now" on the right — see `useUserClock`.
			if (formatDateForApi(store.viewedDate) !== isoDateInUserZone()) return
			try {
				const planActivityIds = new Set(store.tasks.map(t => t.activity.id))
				candidates.value = (await fetchCarryOverCandidates()).filter(
					c => !planActivityIds.has(c.task.activity.id),
				)
			} catch {
				candidates.value = []
			}
		},
		{ immediate: true },
	)

	/** Yesterday's tasks read as just their name; older ones say which day they are from. */
	function chipLabel(candidate: CarryOverCandidate): string {
		const yesterday = new Date(store.viewedDate)
		yesterday.setDate(yesterday.getDate() - 1)
		if (candidate.date === formatDateForApi(yesterday)) return candidate.task.activity.name
		const day = parseDateFromApi(candidate.date)
		return day ? `${candidate.task.activity.name} · ${formatToDateWithoutYear(day)}` : candidate.task.activity.name
	}

	function getOverlappingTasks(task: PlannerTask): PlannerTask[] {
		return store.tasks.filter(
			t =>
				t.id > 0 &&
				!t.isBackground &&
				t.startTime.getInMinutes < task.endTime.getInMinutes &&
				t.endTime.getInMinutes > task.startTime.getInMinutes,
		) as PlannerTask[]
	}

	/**
	 * Overwriting deletes tasks on today's plan that the user never named — the "takes rows with it"
	 * case `useDeleteConfirmation` treats as a cascade, so it always asks and always says how many.
	 */
	async function confirmOverwrite(task: PlannerTask, overlapping: PlannerTask[]): Promise<boolean> {
		if (!shouldConfirm({ cascades: true, undoable: false })) return true
		return confirm({
			title: t('planner.calendar.carryOverOverwriteTitle'),
			text: t(
				'planner.calendar.carryOverOverwriteBody',
				{ name: task.activity.name, count: overlapping.length },
				overlapping.length,
			),
			confirmBtnLabel: t('general.delete'),
			confirmBtnColor: 'errorDark',
		})
	}

	/**
	 * Carries the task over to today through the server's carry-over command, which moves it (so its
	 * old day no longer counts it as missed — a copy used to cost that day the streak) and records the
	 * slip: `originalDate` once, `carryOverCount` every time. It arrives NotStarted at the same time of day.
	 */
	async function carryOverCandidate(candidate: CarryOverCandidate): Promise<boolean> {
		const task = candidate.task
		const resolution = conflictResolution.value
		const overlapping = getOverlappingTasks(task)
		if (overlapping.length > 0) {
			if (resolution === ApplyTemplateConflictResolution.MergeIgnore) return false
			if (
				resolution === ApplyTemplateConflictResolution.Overwrite ||
				resolution === ApplyTemplateConflictResolution.MergeOverwrite
			) {
				if (!(await confirmOverwrite(task, overlapping))) return false
				await batchDelete(overlapping.map(t => t.id))
				store.tasks = store.tasks.filter(t => !overlapping.some(o => o.id === t.id))
			}
		}
		const moved = await carryOver(task.id, store.viewedDate)
		if (moved.isBackground) {
			store.updateIsDuringBackgroundFlags(moved)
		} else {
			moved.isDuringBackgroundTask = store.checkOverlapsBackground(moved)
		}
		store.setGridPositionFromSpan(moved)
		store.tasks.push(moved)
		candidates.value = candidates.value.filter(c => c.task.id !== task.id)
		if (candidates.value.length === 0) showBanner.value = false
		return true
	}

	async function carryOverAll() {
		let movedAny = false
		for (const candidate of [...candidates.value]) {
			movedAny = (await carryOverCandidate(candidate)) || movedAny
		}
		if (movedAny) showSuccessSnackbar(t('planner.feedback.tasksCarriedOver'))
	}
</script>
