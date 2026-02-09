<template>
<VCard class="pa-4">
	<div class="d-flex align-center ga-6 mb-3">
		<h3 class="text-subtitle-1 font-weight-medium">Activity by Window</h3>
		<VSelect
			v-model="selectedWindowSize"
			label="Window"
			:items="formattedOptions"
			density="compact"
			hideDetails
			style="max-width: 100px"
		/>
		<div v-if="legendItems.length > 0" class="legend d-flex flex-wrap ga-2">
			<div
				v-for="item in legendItems"
				:key="item.domain"
				class="legend-item d-flex align-center ga-1"
			>
				<div class="legend-color" :style="{ backgroundColor: item.color }"/>
				<span class="legend-label">{{ item.label }}</span>
			</div>
		</div>
	</div>


	<!-- Loading state -->
	<template v-if="loading">
		<VSkeletonLoader type="image" height="250"/>
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
</VCard>
</template>

<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import StackedBarsGrid from './StackedBarsGrid.vue'
import type {ActivityWindow} from '@/dtos/response/activityTracking/ActivityWindow.ts';
import type {WindowActivity} from '@/dtos/response/activityTracking/WindowActivity.ts';
import type {ColumnData} from '@/components/activityTracking/stackedBars/dto/ColumnData.ts';
import type {ProcessedWindow} from '@/components/activityTracking/stackedBars/dto/ProcessedWindow.ts';
import {getDomainColor} from '@/utils/domainColor'


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


// Selected window size
const selectedWindowSize = ref(props.initialWindowSize)

const formattedOptions = computed(() =>
	props.availableWindowSizes.map((mins) => ({
		value: mins,
		title: mins >= 60 ? `${mins / 60}h` : `${mins}m`,
	}))
)

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

// Legend items
const legendItems = computed(() => {
	const domainMap = new Map<string, { domain: string; label: string; color: string }>()

	props.windows.forEach((window) => {
		window.activities.forEach((activity) => {
			if (!domainMap.has(activity.domain)) {
				domainMap.set(activity.domain, {
					domain: activity.domain,
					label: activity.domain,
					color: getDomainColor(activity.domain),
				})
			}
		})
	})

	// Check if "Other" bucket is used in processed windows
	processedWindows.value.forEach((window) => {
		window.columns.forEach((col) => {
			if (col.domain === '_other' && !domainMap.has('_other')) {
				domainMap.set('_other', {
					domain: '_other',
					label: 'Other',
					color: getDomainColor('_other'),
				})
			}
		})
	})

	return Array.from(domainMap.values()).sort((a, b) => a.label.localeCompare(b.label))
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
	if (!window)
		throw new Error('Window not found')
	emit('activityClick', window, bar.domain)
}

const emit = defineEmits<{
	(e: 'windowSizeChange', size: number): void
	(e: 'activityClick', window: ActivityWindow, domain: string): void
}>()
</script>

<style scoped>
.empty-state {
	min-height: 250px;
	background-color: #fafafa;
	border-radius: 8px;
}

.legend {
	font-size: 12px;
}

.legend-item {
	padding: 2px 6px;
	border-radius: 4px;
	background-color: rgba(255, 255, 255, 0.05);
}

.legend-color {
	width: 12px;
	height: 12px;
	border-radius: 2px;
	flex-shrink: 0;
}

.legend-label {
	font-size: 11px;
	color: #fff;
	white-space: nowrap;
}
</style>
