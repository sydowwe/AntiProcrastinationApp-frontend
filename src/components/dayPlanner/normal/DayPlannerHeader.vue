<template>
	<div
		v-if="calendar"
		class="header-bar"
	>
		<!-- Left: Date + Edit -->
		<div class="left-section">
			<VIconBtn
				class="d-md-none"
				variant="tonal"
				color="secondaryOutline"
				icon="bars"
				@click="panelOpen = !panelOpen"
			/>
			<div class="mb-3 nav-btn-wrap">
				<div
					v-if="prevDayCount !== null"
					class="text-caption text-no-wrap text-primaryOutline"
				>
					{{ prevDayCount }} tasks
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
					{{ nextDayCount }} tasks
				</div>
				<VIconBtn
					variant="tonal"
					density="comfortable"
					icon="chevron-right"
					@click="emit('navigateDate', 1)"
				></VIconBtn>
			</div>

			<DayPlannerProgressBlock :calendar />
		</div>

		<!-- Center: Progress -->
		<div class="center-section">
			<TimeRangePicker
				v-model:start="store.viewStartTime"
				v-model:end="store.viewEndTime"
				startIcon="sun"
				endIcon="moon"
			/>
		</div>

		<!-- Right: Time + Add -->
		<div class="d-flex ga-3 align-center">
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
				Add Task
			</VBtn>

			<VBtnToggle
				v-model="activePanel"
				mandatory
				class="d-flex d-md-none"
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
					Details
				</VBtn>
				<VBtn
					value="routine"
					prependIcon="rotate"
					@click="panelOpen = true"
				>
					Routine
				</VBtn>
			</VBtnToggle>
			<VBtn
				color="secondaryOutline"
				variant="tonal"
				to="/day-planner"
				prependIcon="far fa-calendar"
			>
				Calendar
			</VBtn>
			<GoogleCalendarSyncBtn :calendarId="calendar?.id" />
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import TimeRangePicker from '@/components/general/dateTime/TimeRangePicker.vue'
	import type { Calendar } from '@/dtos/response/activityPlanning/Calendar.ts'
	import { useDayPlannerStore } from '@/stores/dayPlanner/dayPlannerStore.ts'
	import { useUndoStack } from '@/composables/general/useUndoStack.ts'
	import { useDateTime } from '@/utils/DateTimeHelper.ts'
	import DayPlannerProgressBlock from '@/components/dayPlanner/normal/DayPlannerProgressBlock.vue'
	import GoogleCalendarSyncBtn from '@/components/dayPlanner/normal/GoogleCalendarSyncBtn.vue'
	import { useCalendarQuery } from '@/api/calendarApi.ts'
	import { useTaskPlannerCrud } from '@/api/taskPlanner/plannerTaskApi.ts'
	import { PlannerTaskFilter } from '@/dtos/request/activityPlanning/PlannerTaskFilter.ts'

	const { title, calendar } = defineProps<{
		title: string
		calendar?: Calendar
	}>()
	const emit = defineEmits<{
		navigateDate: [delta: number]
		undo: []
	}>()
	const activePanel = defineModel<'details' | 'routine'>('activePanel', { required: true })
	const panelOpen = defineModel<boolean>('panelOpen', { required: true })
	const store = useDayPlannerStore()
	const { canUndo, stackSize, nextUndoDescription, nextUndoDate } = useUndoStack()
	const { formatToDateWithDay, formatToUsString, usStringToUrlString } = useDateTime()
	const { fetchByDate } = useCalendarQuery()
	const { fetchFiltered } = useTaskPlannerCrud()

	const prevDayCount = ref<number | null>(null)
	const nextDayCount = ref<number | null>(null)

	async function fetchCountForDate(date: Date): Promise<number> {
		const cal = await fetchByDate(usStringToUrlString(formatToUsString(date)))
		const tasks = await fetchFiltered(new PlannerTaskFilter(cal.id, store.viewStartTime, store.viewEndTime))
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

	const undoTooltip = computed(() => {
		if (!nextUndoDescription.value) return 'Nothing to undo'
		const isOtherDay =
			nextUndoDate.value &&
			!(
				nextUndoDate.value.getFullYear() === store.viewedDate.getFullYear() &&
				nextUndoDate.value.getMonth() === store.viewedDate.getMonth() &&
				nextUndoDate.value.getDate() === store.viewedDate.getDate()
			)
		return isOtherDay
			? `Undo: ${nextUndoDescription.value} · go to ${formatToDateWithDay(nextUndoDate.value!)}`
			: `Undo: ${nextUndoDescription.value}`
	})
</script>

<style scoped>
	.header-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 14px 16px 0;
		gap: 24px;
	}

	.left-section {
		display: flex;
		align-items: center;
		gap: 12px;
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
