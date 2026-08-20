<template>
	<div
		class="w-100 mb-3 d-flex align-center ga-6 flex-wrap bg-background"
		style="position: sticky; top: 0; z-index: 1000"
	>
		<h1 class="text-h4">{{ title }}</h1>
		<div class="d-flex align-center ga-5 flex-wrap">
			<ActivityRangePicker
				:dateFrom
				:dateTo
				@change="(from, to) => emit('changeDateSpan', from, to)"
			/>
			<TimeRangePicker
				v-model:start="timeFrom"
				v-model:end="timeTo"
				density="compact"
			/>
			<VBtnToggle
				v-model="selectedVisualization"
				mandatory
				variant="outlined"
				color="secondaryOutline"
				class="visualization-toggle"
			>
				<VBtn
					value="stackedBars"
					height="40px"
				>
					{{ $t('activityTracking.tracker.stackedBars') }}
				</VBtn>
				<!--
					Disabled rather than hidden over a range: the button staying visible-but-off is what
					tells the user the timeline still exists and what to do to get it back. The tooltip
					carries the reason so the state is never just unexplained.
				-->
				<VBtn
					value="timeline"
					height="40px"
					:disabled="!isTimelineAvailable"
				>
					{{ $t('activityTracking.tracker.timeline') }}
					<VTooltip
						v-if="!isTimelineAvailable"
						activator="parent"
						location="bottom"
					>
						{{ $t('activityTracking.range.timelineUnavailable') }}
					</VTooltip>
				</VBtn>
			</VBtnToggle>

			<span
				v-if="!isTimelineAvailable && selectedVisualization === 'timeline'"
				class="text-caption text-medium-emphasis"
			>
				{{ $t('activityTracking.range.timelineFellBack') }}
			</span>
		</div>
	</div>
</template>

<script setup lang="ts">
	import TimeRangePicker from '@/_common/component/dateTime/TimeRangePicker.vue'
	import ActivityRangePicker from '@/core/activityTracking/component/ActivityRangePicker.vue'
	import type { Time } from '@/_common/dto/dto/Time.ts'
	import type { ActivityVisualization } from '@/core/activityTracking/composable/useActivityDashboard.ts'

	const {
		title,
		dateFrom,
		dateTo,
		isTimelineAvailable = true,
	} = defineProps<{
		title: string
		dateFrom: Date
		dateTo: Date
		isTimelineAvailable?: boolean
	}>()

	const emit = defineEmits<{
		changeDateSpan: [dateFrom: Date, dateTo: Date]
	}>()

	const timeFrom = defineModel<Time>('timeFrom', { required: true })
	const timeTo = defineModel<Time>('timeTo', { required: true })

	// The user's own choice, kept even while a range forces the stacked bars — see
	// `effectiveVisualization` in `useActivityDashboard`.
	const selectedVisualization = defineModel<ActivityVisualization>('selectedVisualization', { required: true })
</script>

<style scoped>
	.visualization-toggle {
		border-color: rgba(var(--v-theme-on-surface), 0.3) !important;
		height: 40px;
	}
</style>
