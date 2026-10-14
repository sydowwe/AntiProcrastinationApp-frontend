<template>
	<div
		v-if="calendar"
		class="header-bar"
	>
		<!-- Left: Date + Edit -->
		<div class="left-section">
			<VIconBtn
				variant="tonal"
				color="secondaryOutline"
				icon="bars"
				:aria-label="panelOpen ? $t('planner.a11y.closePanel') : $t('planner.a11y.openPanel')"
				@click="panelOpen = !panelOpen"
			/>
			<div class="mb-3 nav-btn-wrap">
				<div
					v-if="prevDayCount !== null"
					class="text-caption text-no-wrap text-primaryOutline"
				>
					{{ $t('planner.calendar.tasksCount', { count: prevDayCount }, prevDayCount ?? 0) }}
				</div>
				<VIconBtn
					variant="tonal"
					density="comfortable"
					icon="chevron-left"
					@click="emit('navigateDate', -1)"
				></VIconBtn>
			</div>
			<h1 class="date-title">{{ title }}</h1>
			<div class="mb-3 nav-btn-wrap">
				<div
					v-if="nextDayCount"
					class="text-caption text-no-wrap text-primaryOutline"
				>
					{{ $t('planner.calendar.tasksCount', { count: nextDayCount }, nextDayCount ?? 0) }}
				</div>
				<VIconBtn
					variant="tonal"
					density="comfortable"
					icon="chevron-right"
					@click="emit('navigateDate', 1)"
				></VIconBtn>
			</div>

			<div class="progress-stack">
				<DayPlannerProgressBlock :calendar />
				<DayPlannerPlanVsActualBlock />
			</div>
		</div>

		<!-- Center: view range, and — on today only — what is running now -->
		<div class="center-section">
			<TimeRangePicker
				v-model:start="store.viewStartTime"
				v-model:end="store.viewEndTime"
				startIcon="sun"
				endIcon="moon"
			/>
			<NowNextIndicator />
		</div>

		<!-- Right: Time + Add -->
		<div class="d-flex flex-wrap ga-3 align-center">
			<VTooltip
				:text="undoTooltip"
				location="bottom"
			>
				<template #activator="{ props: tooltipProps }">
					<VBtn
						v-bind="tooltipProps"
						variant="tonal"
						color="secondaryOutline"
						:disabled="!canUndo"
						:aria-label="undoLabel"
						@click="emit('undo')"
					>
						<VIcon icon="rotate-left" />
						<VBadge
							v-if="stackSize > 0"
							:content="stackSize"
							color="primary"
							floating
						/>
					</VBtn>
				</template>
			</VTooltip>

			<VBtn
				color="primary"
				:disabled="store.isTemplateInPreview || !store.canCreate"
				@click="store.openCreateDialog"
			>
				<VIcon
					icon="plus"
					size="18"
					class="mr-2"
				/>
				{{ $t('planner.misc.addTaskAction') }}
			</VBtn>

			<MyBtnToggle
				v-if="compact"
				v-model="activePanel"
				:label="$t('planner.a11y.panelSection')"
				mandatory
				class="d-flex"
				density="compact"
				variant="outlined"
				color="secondaryOutline"
				@update:modelValue="panelOpen = true"
			>
				<VBtn
					value="details"
					prependIcon="calendar-day"
					@click="panelOpen = true"
				>
					{{ $t('planner.template.details') }}
				</VBtn>
				<VBtn
					value="routine"
					prependIcon="rotate"
					@click="panelOpen = true"
				>
					{{ $t('planner.template.routine') }}
				</VBtn>
			</MyBtnToggle>
			<VBtn
				color="secondaryOutline"
				variant="tonal"
				to="/day-planner"
				prependIcon="far fa-calendar"
			>
				{{ $t('planner.misc.calendarLink') }}
			</VBtn>
			<GoogleCalendarSyncBtn :calendarId="calendar?.id" />
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import MyBtnToggle from '@/_common/component/inputs/MyBtnToggle.vue'
	import TimeRangePicker from '@/_common/component/dateTime/TimeRangePicker.vue'
	import type { Calendar } from '@/core/dayPlanner/dto/response/Calendar.ts'
	import type { PlannerSidePanelTab } from '@/core/dayPlanner/composable/useRoutinePlacement.ts'
	import { useDayPlannerStore } from '@/core/dayPlanner/store/dayPlannerStore.ts'
	import { useUndoStack } from '@/_common/composable/general/useUndoStack.ts'
	import { formatDateForApi, formatToDateWithDay } from '@/_common/utils/DateTimeHelper.ts'
	import DayPlannerProgressBlock from '@/core/dayPlanner/component/normal/DayPlannerProgressBlock.vue'
	import DayPlannerPlanVsActualBlock from '@/core/dayPlanner/component/normal/DayPlannerPlanVsActualBlock.vue'
	import NowNextIndicator from '@/core/dayPlanner/component/normal/NowNextIndicator.vue'
	import GoogleCalendarSyncBtn from '@/core/dayPlanner/component/normal/GoogleCalendarSyncBtn.vue'
	import { useCalendarQuery } from '@/core/activityHistory/api/calendarApi.ts'
	import { useTaskPlannerCrud } from '@/core/dayPlanner/api/plannerTaskApi.ts'
	import { PlannerTaskFilter } from '@/core/dayPlanner/dto/request/PlannerTaskFilter.ts'
	import { useI18n } from 'vue-i18n'
	import { usePlannerCompact } from '@/core/dayPlanner/composable/usePlannerLayout.ts'

	const { title, calendar } = defineProps<{
		title: string
		calendar?: Calendar
	}>()
	const emit = defineEmits<{
		navigateDate: [delta: number]
		undo: []
	}>()
	const activePanel = defineModel<PlannerSidePanelTab>('activePanel', { required: true })
	const panelOpen = defineModel<boolean>('panelOpen', { required: true })
	const store = useDayPlannerStore()
	// The panel toggles show when the planner itself is narrow, not the window (F88).
	const compact = usePlannerCompact()
	const { canUndo, stackSize, nextUndoDescription, nextUndoDate } = useUndoStack()
	const { fetchDayPlan } = useCalendarQuery()
	const { fetchFiltered } = useTaskPlannerCrud()
	const { t } = useI18n()

	const prevDayCount = ref<number | null>(null)
	const nextDayCount = ref<number | null>(null)

	// The day-plan read, not the by-date one: a neighbour with no calendar row is a 200 with `calendar: null`
	// there, where the by-date read 404s into the console. A day with no row has no tasks to count.
	async function fetchCountForDate(date: Date): Promise<number> {
		const { calendar } = await fetchDayPlan(formatDateForApi(date))
		if (calendar === null) {
			return 0
		}
		// The count follows the visible time window, which the server's filter owns (`InTimeWindow`).
		const tasks = await fetchFiltered(new PlannerTaskFilter(calendar.id, store.viewStartTime, store.viewEndTime))
		return tasks.filter(t => !t.isBackground).length
	}

	watch(
		() => store.viewedDate,
		date => {
			prevDayCount.value = null
			nextDayCount.value = null
			const prev = new Date(date)
			prev.setDate(prev.getDate() - 1)
			const next = new Date(date)
			next.setDate(next.getDate() + 1)
			fetchCountForDate(prev)
				.then(n => (prevDayCount.value = n))
				.catch(() => {})
			fetchCountForDate(next)
				.then(n => (nextDayCount.value = n))
				.catch(() => {})
		},
		{ immediate: true },
	)

	// The tooltip describes the next undo; the name says what the button is, with the badge's count
	// folded in so the badge stops being the accessible name (F56, control #6).
	const undoLabel = computed(() =>
		stackSize.value > 0 ? t('planner.a11y.undoCount', { count: stackSize.value }) : t('planner.a11y.undo'),
	)

	const undoTooltip = computed(() => {
		if (!nextUndoDescription.value) return t('planner.dialog.nothingToUndo')
		const isOtherDay =
			nextUndoDate.value &&
			!(
				nextUndoDate.value.getFullYear() === store.viewedDate.getFullYear() &&
				nextUndoDate.value.getMonth() === store.viewedDate.getMonth() &&
				nextUndoDate.value.getDate() === store.viewedDate.getDate()
			)
		return isOtherDay
			? t('planner.dialog.undoDescriptionWithDate', {
					description: nextUndoDescription.value,
					date: formatToDateWithDay(nextUndoDate.value!),
				})
			: t('planner.dialog.undoDescription', { description: nextUndoDescription.value })
	})
</script>

<style scoped>
	.header-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		/* Both rows wrap: below `md` the header is ~500 px of fixed-width controls, and unwrapped it ran
		   off the card's edge at 390 px. */
		flex-wrap: wrap;
		padding: 14px 16px 0;
		gap: 24px;
	}

	.left-section {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 12px;
	}

	/*
	 * A column, so the now/next line sits under the range picker instead of competing with it for the
	 * row. `min-width: 0` is what lets the line ellipsise rather than push the buttons off the header;
	 * on any day but today it renders nothing and this collapses back to the picker alone.
	 */
	.center-section {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
		min-width: 0;
	}

	.progress-stack {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.nav-btn-wrap {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2px;
	}

	.date-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
		text-wrap: nowrap;
	}
</style>
