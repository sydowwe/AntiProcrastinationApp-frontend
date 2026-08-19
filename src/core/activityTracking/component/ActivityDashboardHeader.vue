<template>
	<div
		class="w-100 mb-3 d-flex align-center ga-6 flex-wrap bg-background"
		style="position: sticky; top: 0; z-index: 1000"
	>
		<h1 class="text-h4">{{ title }}</h1>
		<div class="d-flex align-center ga-5 flex-wrap">
			<MyDateInput
				v-model="date"
				label="Date"
				hideDetails
				:max="today"
				density="compact"
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
					{{ $t('tracker.stackedBars') }}
				</VBtn>
				<VBtn
					value="timeline"
					height="40px"
				>
					{{ $t('tracker.timeline') }}
				</VBtn>
			</VBtnToggle>
		</div>
	</div>
</template>

<script setup lang="ts">
	import MyDateInput from '@/_common/component/dateTime/MyDateInput.vue'
	import TimeRangePicker from '@/_common/component/dateTime/TimeRangePicker.vue'
	import type { Time } from '@/_common/dto/dto/Time.ts'
	import type { ActivityVisualization } from '@/core/activityTracking/composable/useActivityDashboard.ts'

	const { title } = defineProps<{ title: string }>()

	const date = defineModel<Date>('date', { required: true })
	const timeFrom = defineModel<Time>('timeFrom', { required: true })
	const timeTo = defineModel<Time>('timeTo', { required: true })
	const selectedVisualization = defineModel<ActivityVisualization>('selectedVisualization', { required: true })

	const today = new Date()
</script>

<style scoped>
	.visualization-toggle {
		border-color: rgba(var(--v-theme-on-surface), 0.3) !important;
		height: 40px;
	}
</style>
