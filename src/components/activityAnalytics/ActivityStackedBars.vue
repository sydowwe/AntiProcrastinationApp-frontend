<template>
	<div class="activity-stacked-bars">
		<div class="header d-flex align-center justify-space-between mb-4">
			<h3 class="text-subtitle-1 font-weight-medium">Activity by Window</h3>
			<WindowSizeSelector v-model="selectedWindowSize" :options="availableWindowSizes" />
		</div>

		<!-- Loading state -->
		<template v-if="loading">
			<VSkeletonLoader type="image" height="250" />
		</template>

		<!-- Empty state -->
		<template v-else-if="windows.length === 0">
			<div class="empty-state d-flex flex-column align-center justify-center pa-8">
				<VIcon size="48" color="grey-lighten-1">mdi-chart-bar</VIcon>
				<p class="text-grey mt-2">No activity recorded for this period</p>
			</div>
		</template>

		<!-- Chart -->
		<template v-else>
			<StackedBarsGrid
				:windows="processedWindows"
				:windowMinutes="selectedWindowSize"
				@activity-click="handleActivityClick"
			/>
		</template>
	</div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import WindowSizeSelector from './WindowSizeSelector.vue'
import StackedBarsGrid, { type ProcessedWindow } from './StackedBarsGrid.vue'
import type { ColumnData } from './StackedBarColumn.vue'
import { getDomainColor } from '@/utils/domainColor'

export interface ActivityWindow {
	windowStart: Date
	windowEnd: Date
	activities: WindowActivity[]
}

export interface WindowActivity {
	domain: string
	activeSeconds: number
	backgroundSeconds: number
	totalSeconds: number
	url?: string
}

const props = withDefaults(
	defineProps<{
		windows: ActivityWindow[]
		loading?: boolean
		availableWindowSizes?: number[]
		initialWindowSize?: number
	}>(),
	{
		loading: false,
		availableWindowSizes: () => [15, 20, 30, 60, 90, 120],
		initialWindowSize: 30,
	}
)

const emit = defineEmits<{
	(e: 'windowSizeChange', size: number): void
	(e: 'activityClick', activity: { window: ActivityWindow; domain: string }): void
}>()

// Selected window size
const selectedWindowSize = ref(props.initialWindowSize)

watch(selectedWindowSize, (newSize) => {
	emit('windowSizeChange', newSize)
})

// Calculate max columns per window based on window size
const maxColumnsPerWindow = computed(() => {
	const windowSize = selectedWindowSize.value
	if (windowSize >= 90) return 8
	if (windowSize >= 60) return 6
	if (windowSize >= 30) return 5
	return 4
})

// Process windows to add "Other" bucket logic
const processedWindows = computed<ProcessedWindow[]>(() => {
	return props.windows.map((window) => ({
		windowStart: window.windowStart,
		windowEnd: window.windowEnd,
		columns: processWindowActivities(window.activities),
	}))
})

function processWindowActivities(activities: WindowActivity[]): ColumnData[] {
	// Filter out zero-duration activities and sort by total time
	const sorted = [...activities]
		.filter((a) => a.totalSeconds > 0)
		.sort((a, b) => b.totalSeconds - a.totalSeconds)

	if (sorted.length <= maxColumnsPerWindow.value) {
		return sorted.map(toColumnData)
	}

	// Take top N-1 and group rest into "Other"
	const top = sorted.slice(0, maxColumnsPerWindow.value - 1)
	const other = sorted.slice(maxColumnsPerWindow.value - 1)

	const otherActiveSeconds = other.reduce((sum, a) => sum + a.activeSeconds, 0)
	const otherBackgroundSeconds = other.reduce((sum, a) => sum + a.backgroundSeconds, 0)

	return [
		...top.map(toColumnData),
		{
			domain: '_other',
			activeSeconds: otherActiveSeconds,
			backgroundSeconds: otherBackgroundSeconds,
			activeMinutes: Math.ceil(otherActiveSeconds / 60),
			backgroundMinutes: Math.ceil(otherBackgroundSeconds / 60),
		},
	]
}

function toColumnData(activity: WindowActivity): ColumnData {
	return {
		domain: activity.domain,
		activeSeconds: activity.activeSeconds,
		backgroundSeconds: activity.backgroundSeconds,
		activeMinutes: Math.ceil(activity.activeSeconds / 60),
		backgroundMinutes: Math.ceil(activity.backgroundSeconds / 60),
		url: activity.url,
	}
}

function handleActivityClick(bar: any) {
	const window = props.windows[bar.windowIndex]
	emit('activityClick', {
		window,
		domain: bar.domain,
	})
}
</script>

<style scoped>
.activity-stacked-bars {
	background: white;
	border-radius: 8px;
	padding: 16px;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.empty-state {
	min-height: 250px;
	background-color: #fafafa;
	border-radius: 8px;
}
</style>
