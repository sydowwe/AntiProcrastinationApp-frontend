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
				@click="expanded = !expanded"
			>
				<VIcon size="24" />
				<VTooltip
					activator="parent"
					location="bottom"
				>
					{{ expanded ? 'Hide details' : 'Show details' }}
				</VTooltip>
			</VIconBtn>
			<VIconBtn
				variant="tonal"
				density="comfortable"
				icon="chevron-left"
				@click="emit('navigateDate', -1)"
			></VIconBtn>
			<h1 class="date-title">{{ title }}</h1>
			<VIconBtn
				variant="tonal"
				density="comfortable"
				icon="chevron-right"
				@click="emit('navigateDate', 1)"
			></VIconBtn>

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

			<VBtn
				color="secondaryOutline"
				variant="tonal"
				to="/day-planner"
				prependIcon="far fa-calendar"
			>
				Calendar
			</VBtn>
		</div>
	</div>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import TimeRangePicker from '@/components/general/dateTime/TimeRangePicker.vue'
	import type { Calendar } from '@/dtos/response/activityPlanning/Calendar.ts'
	import { useDayPlannerStore } from '@/stores/dayPlanner/dayPlannerStore.ts'
	import { useUndoStack } from '@/composables/general/useUndoStack.ts'
	import { useDateTime } from '@/utils/DateTimeHelper.ts'
	import DayPlannerProgressBlock from '@/components/dayPlanner/normal/DayPlannerProgressBlock.vue'

	const { title, calendar } = defineProps<{
		title: string
		calendar?: Calendar
	}>()
	const emit = defineEmits<{
		navigateDate: [delta: number]
		undo: []
	}>()
	const expanded = defineModel<boolean>('expandedDetails', { required: true })
	const store = useDayPlannerStore()
	const { canUndo, stackSize, nextUndoDescription, nextUndoDate } = useUndoStack()
	const { formatToDateWithDay } = useDateTime()

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

	.date-title {
		font-size: 1.5rem;
		font-weight: 700;
		margin: 0;
		text-wrap: nowrap;
	}
</style>
