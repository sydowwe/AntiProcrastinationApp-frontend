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
			style="min-width: 100px;max-width: 100px"
		/>
		<div v-if="legendItems.length > 0" class="legend d-flex flex-wrap ga-2">
			<div
				v-for="item in legendItems"
				:key="item.name"
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

	<!-- No data -->
	<template v-else-if="windows.length === 0">
		<div class="d-flex flex-column align-center justify-center pa-8">
			<VIcon icon="fas fa-chart-bar" size="64" class="text-disabled mb-4"/>
			<p class="text-body-1 text-medium-emphasis">No data for this period</p>
		</div>
	</template>

	<!-- Chart -->
	<template v-else>
		<StackedBarsGrid
			class="pb-1"
			:windows="processedWindows"
			:windowMinutes="selectedWindowSize"
			:timeFrom
			:timeTo
			@activity-click="handleActivityClick"
		/>
	</template>
</VCard>
</template>

<script setup lang="ts">
import {computed, ref, watch} from 'vue'
import StackedBarsGrid from './StackedBarsGrid.vue'
import type {StackedBarsInputWindow, StackedBarsInputItem} from './dto/StackedBarsInput'
import type {ColumnData} from './dto/ColumnData'
import {ProcessedWindow} from './dto/ProcessedWindow'
import {getDomainColor} from '@/utils/domainColor'
import {Time} from '@/dtos/dto/Time.ts'

const props = withDefaults(
	defineProps<{
		windows: StackedBarsInputWindow[]
		loading?: boolean
		timeFrom: Time
		timeTo: Time
		windowSizeOptions: number[]
		initialWindowSize: number
	}>(),
	{
		loading: false,
	}
)

const emit = defineEmits<{
	windowSizeChange: [size: number]
	activityClick: [window: StackedBarsInputWindow, name: string]
}>()

// Selected window size
const selectedWindowSize = ref(props.initialWindowSize)

const formattedOptions = computed(() =>
	props.windowSizeOptions.map((mins) => ({
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

function resolveColor(name: string, color?: string): string {
	return color ?? getDomainColor(name)
}

function toColumnData(item: StackedBarsInputItem): ColumnData {
	return {
		domain: item.name,
		activeSeconds: item.activeSeconds,
		backgroundSeconds: item.backgroundSeconds,
		activeMinutes: Math.ceil(item.activeSeconds / 60),
		backgroundMinutes: Math.ceil(item.backgroundSeconds / 60),
		url: item.url,
		color: resolveColor(item.name, item.color),
	}
}

function processItems(items: StackedBarsInputItem[]): ColumnData[] {
	const totalSeconds = (i: StackedBarsInputItem) => i.activeSeconds + i.backgroundSeconds
	const sorted = [...items]
		.filter((i) => totalSeconds(i) > 0)
		.sort((a, b) => totalSeconds(b) - totalSeconds(a))

	if (sorted.length <= maxColumnsPerWindow.value) {
		return sorted.map(toColumnData)
	}

	const top = sorted.slice(0, maxColumnsPerWindow.value - 1)
	const rest = sorted.slice(maxColumnsPerWindow.value - 1)
	const otherActiveSeconds = rest.reduce((sum, i) => sum + i.activeSeconds, 0)
	const otherBackgroundSeconds = rest.reduce((sum, i) => sum + i.backgroundSeconds, 0)

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

// Generate all time slots, merge with API data, aggregate consecutive empties
const processedWindows = computed<ProcessedWindow[]>(() => {
	const windowSize = selectedWindowSize.value
	let fromMin = props.timeFrom.getInMinutes
	let toMin = props.timeTo.getInMinutes
	if (toMin <= fromMin) toMin += 24 * 60

	// Index API windows by start minute
	const apiMap = new Map<number, StackedBarsInputWindow>()
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
		if (apiWindow && apiWindow.items.length > 0) {
			allSlots.push(new ProcessedWindow(
				apiWindow.windowStart,
				apiWindow.windowEnd,
				processItems(apiWindow.items),
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
	const nameMap = new Map<string, { name: string; label: string; color: string }>()

	for (const w of props.windows) {
		for (const item of w.items) {
			if (!nameMap.has(item.name)) {
				nameMap.set(item.name, {
					name: item.name,
					label: item.name,
					color: resolveColor(item.name, item.color),
				})
			}
		}
	}

	// Check for "Other" bucket in processed windows
	for (const w of processedWindows.value) {
		for (const col of w.columns) {
			if (col.domain === '_other' && !nameMap.has('_other')) {
				nameMap.set('_other', {
					name: '_other',
					label: 'Other',
					color: getDomainColor('_other'),
				})
			}
		}
	}

	return Array.from(nameMap.values()).sort((a, b) => a.label.localeCompare(b.label))
})

function handleActivityClick(bar: any) {
	const window = props.windows[bar.windowIndex]
	if (!window)
		throw new Error('Window not found')
	emit('activityClick', window, bar.domain)
}
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
