<template>
<VCard class="d-flex flex-column justify-center">
	<div class="pt-4 pb-3 px-5 d-flex align-center ga-6">
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

	<!-- Chart -->
	<template v-else>
		<StackedBarsGrid
			class="pb-1"
			:windows="processedWindows"
			:windowMinutes="selectedWindowSize"
			:timeFrom="props.timeFrom"
			:timeTo="props.timeTo"
			@activity-click="handleActivityClick"
		/>
	</template>
</VCard>
</template>

<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import StackedBarsGrid from './StackedBarsGrid.vue'
import type {ActivityWindow} from '@/dtos/response/activityTracking/stackedBars/ActivityWindow.ts';
import type {WindowActivity} from '@/dtos/response/activityTracking/stackedBars/WindowActivity.ts';
import type {ColumnData} from '@/components/activityTracking/stackedBars/dto/ColumnData.ts';
import {ProcessedWindow} from '@/components/activityTracking/stackedBars/dto/ProcessedWindow.ts';
import {getDomainColor} from '@/utils/domainColor'
import {Time} from '@/utils/Time'


const props = withDefaults(
	defineProps<{
		windows: ActivityWindow[]
		loading?: boolean
		availableWindowSizes?: number[]
		initialWindowSize?: number
		timeFrom: Time
		timeTo: Time
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

// Build a lookup of API windows by their start time (minutes from midnight)
function dateToMinutesKey(d: Date): number {
	return d.getHours() * 60 + d.getMinutes()
}

// Generate all time slots from timeFrom to timeTo, merge with API data, aggregate consecutive empties
const processedWindows = computed<ProcessedWindow[]>(() => {
	const windowSize = selectedWindowSize.value
	let fromMin = props.timeFrom.getInMinutes
	let toMin = props.timeTo.getInMinutes
	if (toMin <= fromMin) toMin += 24 * 60

	// Index API windows by start minute
	const apiMap = new Map<number, ActivityWindow>()
	for (const w of props.windows) {
		apiMap.set(dateToMinutesKey(w.windowStart), w)
	}

	// Generate all slots
	const allSlots: ProcessedWindow[] = []
	for (let min = fromMin; min < toMin; min += windowSize) {
		const normalizedMin = min % (24 * 60)
		const slotStart = new Date(0)
		slotStart.setHours(Math.floor(normalizedMin / 60), normalizedMin % 60, 0, 0)
		const endMin = (min + windowSize) % (24 * 60)
		const slotEnd = new Date(0)
		slotEnd.setHours(Math.floor(endMin / 60), endMin % 60, 0, 0)

		const apiWindow = apiMap.get(normalizedMin)
		if (apiWindow && apiWindow.activities.length > 0) {
			allSlots.push(new ProcessedWindow(
				apiWindow.windowStart,
				apiWindow.windowEnd,
				processWindowActivities(apiWindow.activities),
			))
		} else {
			allSlots.push(new ProcessedWindow(slotStart, slotEnd, []))
		}
	}

	// Aggregate consecutive empty windows
	const result: ProcessedWindow[] = []
	for (const slot of allSlots) {
		if (slot.columns.length > 0) {
			result.push(slot)
			continue
		}
		const prev = result[result.length - 1]
		if (prev && prev.columns.length === 0) {
			// Merge into previous empty block
			prev.windowEnd = slot.windowEnd
			prev.spanCount += 1
		} else {
			result.push(slot)
		}
	}

	return result
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
