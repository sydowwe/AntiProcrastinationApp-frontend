<template>
	<VCard class="d-flex flex-column h-100">
		<div class="pt-4 pb-3 px-5 d-flex align-center ga-5 flex-shrink-0">
			<!--		<h3 class="text-subtitle-1 font-weight-medium">Activity by Window</h3>-->
			<VSelect
				v-model="selectedWindowSize"
				label="Window"
				:items="formattedOptions"
				density="compact"
				hideDetails
				style="min-width: 100px; max-width: 100px"
			/>
			<slot name="header-right" />
			<div
				v-if="legendItems.length > 0"
				class="legend d-flex flex-wrap ga-2"
			>
				<div
					v-for="item in legendItems"
					:key="item.name"
					class="legend-item d-flex align-center ga-1"
				>
					<div
						class="legend-color"
						:style="{ backgroundColor: item.color }"
					/>
					<span class="legend-label">{{ item.label }}</span>
				</div>
			</div>
		</div>

		<!-- Loading state -->
		<template v-if="loading">
			<VSkeletonLoader
				type="image"
				height="250"
			/>
		</template>

		<!-- No data -->
		<template v-else-if="windows.length === 0">
			<div class="d-flex flex-column align-center justify-center pa-8">
				<VIcon
					icon="fas fa-chart-bar"
					size="64"
					class="text-disabled mb-4"
				/>
				<p class="text-body-1 text-medium-emphasis">No data for this period</p>
			</div>
		</template>

		<!-- Chart -->
		<template v-else>
			<StackedBarsGrid
				class="pb-1 flex-grow-1"
				style="min-height: 0"
				:windows="processedWindows"
				:windowMinutes="selectedWindowSize"
				:displayMaxMinutes
				:rowUnit
				:timeFrom
				:timeTo
				@activityClick="handleActivityClick"
			/>
		</template>
	</VCard>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import StackedBarsGrid from './StackedBarsGrid.vue'
	import type { StackedBarsInputItem, StackedBarsInputWindow } from './dto/StackedBarsInput'
	import type { ColumnData } from './dto/ColumnData'
	import { ProcessedWindow } from './dto/ProcessedWindow'
	import { getDomainColor } from '@/utils/domainColor'
	import type { Time } from '@/dtos/dto/Time.ts'
	import { formatWindowMinutes, getRowUnit, getYAxisInterval } from './stackedBarsUtils'

	const {
		loading = false,
		windows,
		timeFrom,
		timeTo,
		windowSizeOptions,
		initialWindowSize,
	} = defineProps<{
		windows: StackedBarsInputWindow[]
		loading?: boolean
		timeFrom: Time
		timeTo: Time
		windowSizeOptions: number[]
		initialWindowSize: number
	}>()

	const emit = defineEmits<{
		windowSizeChange: [size: number]
		activityClick: [window: StackedBarsInputWindow, name: string]
	}>()

	// Selected window size
	const selectedWindowSize = ref(initialWindowSize)

	// Dynamic Y-axis: show only up to the tallest activity rounded to next full hour
	// Uses raw windows (not processedWindows) to avoid a circular computed dependency:
	// displayMaxMinutes → processedWindows → minActivityMinutes → displayMaxMinutes
	const displayMaxMinutes = computed(() => {
		let max = 0
		for (const w of windows) {
			for (const item of w.items) {
				const total = Math.ceil(item.activeSeconds / 60) + Math.ceil(item.backgroundSeconds / 60)
				if (total > max) max = total
			}
		}
		if (max === 0) return selectedWindowSize.value
		return Math.min(Math.ceil(max / 60) * 60, selectedWindowSize.value)
	})

	const rowUnit = computed(() => getRowUnit(displayMaxMinutes.value))

	const formattedOptions = computed(() =>
		windowSizeOptions.map(mins => ({
			value: mins,
			title: formatWindowMinutes(mins),
		})),
	)

	watch(selectedWindowSize, newSize => {
		emit('windowSizeChange', newSize)
	})

	watch(
		() => windowSizeOptions,
		options => {
			selectedWindowSize.value = options[0]!
		},
	)

	// Calculate max columns per window based on window size
	const maxColumnsPerWindow = computed(() => {
		const windowSize = selectedWindowSize.value
		if (windowSize >= 10080) return 20 // 1w+
		if (windowSize >= 4320) return 18 // 3d+
		if (windowSize >= 1440) return 15 // 1d+
		if (windowSize >= 480) return 10 // 8h+
		if (windowSize >= 90) return 8
		if (windowSize >= 60) return 6
		if (windowSize >= 30) return 5
		return 4
	})

	// Minimum activity duration to show individually (below this → merge into Other)
	const minActivityMinutes = computed(() => getYAxisInterval(displayMaxMinutes.value))

	// Build a lookup of API windows by their start time
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
		const minSeconds = minActivityMinutes.value * 60
		const sorted = [...items].filter(i => totalSeconds(i) > 0).sort((a, b) => totalSeconds(b) - totalSeconds(a))

		// Split into visible (above min duration) and too-small (below min duration)
		const visible = sorted.filter(i => totalSeconds(i) >= minSeconds)
		const tooSmall = sorted.filter(i => totalSeconds(i) < minSeconds)

		// Apply max columns cap on visible items
		const maxCols = maxColumnsPerWindow.value
		const top = visible.length <= maxCols ? visible : visible.slice(0, maxCols - 1)
		const rest = visible.length <= maxCols ? tooSmall : [...visible.slice(maxCols - 1), ...tooSmall]

		if (rest.length === 0) {
			return top.map(toColumnData)
		}

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

	function isMultiDayData(): boolean {
		if (windows.length < 2) return false
		const sorted = windows
		const firstDay = Math.floor(sorted[0].windowStart.getTime() / 86400000)
		const lastDay = Math.floor(sorted[sorted.length - 1].windowStart.getTime() / 86400000)
		return lastDay > firstDay
	}

	// Generate all time slots, merge with API data, aggregate consecutive empties
	const processedWindows = computed<ProcessedWindow[]>(() => {
		const windowSize = selectedWindowSize.value

		// Use ISO-key path for multi-day data to avoid minutes-from-midnight collisions
		if (isMultiDayData()) {
			return processLargeWindows(windowSize)
		}

		return processSmallWindows(windowSize)
	})

	function processSmallWindows(windowSize: number): ProcessedWindow[] {
		const fromMin = timeFrom.getInMinutes
		let toMin = timeTo.getInMinutes
		if (toMin <= fromMin) toMin += 24 * 60

		// Index API windows by start minute
		const apiMap = new Map<number, StackedBarsInputWindow>()
		for (const w of windows) {
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
				allSlots.push(
					new ProcessedWindow(apiWindow.windowStart, apiWindow.windowEnd, processItems(apiWindow.items)),
				)
			} else {
				allSlots.push(new ProcessedWindow(slotStart, slotEnd, []))
			}
		}

		return aggregateEmptyWindows(allSlots)
	}

	function processLargeWindows(windowSize: number): ProcessedWindow[] {
		const sorted = [...windows].sort((a, b) => a.windowStart.getTime() - b.windowStart.getTime())

		if (sorted.length === 0) return []

		const allSlots: ProcessedWindow[] = []
		for (const w of sorted) {
			if (w.items.length > 0) {
				allSlots.push(new ProcessedWindow(w.windowStart, w.windowEnd, processItems(w.items)))
			} else {
				allSlots.push(new ProcessedWindow(w.windowStart, w.windowEnd, []))
			}
		}

		// For sub-daily windows, aggregate empties only within the same calendar day
		// to prevent giant cross-day empty blocks
		const firstDuration =
			sorted.length > 0 ? (sorted[0].windowEnd.getTime() - sorted[0].windowStart.getTime()) / 60000 : windowSize

		if (firstDuration < 1440) {
			const perDay = aggregateEmptyWindowsPerDay(allSlots)
			return mergeConsecutiveFullDayEmpties(perDay)
		}

		return aggregateEmptyWindows(allSlots)
	}

	function aggregateEmptyWindows(allSlots: ProcessedWindow[]): ProcessedWindow[] {
		const result: ProcessedWindow[] = []
		for (const slot of allSlots) {
			if (slot.columns.length > 0) {
				result.push(slot)
				continue
			}
			const prev = result[result.length - 1]
			if (prev && prev.columns.length === 0) {
				prev.windowEnd = slot.windowEnd
			} else {
				slot.spanCount = 3
				result.push(slot)
			}
		}
		return result
	}

	// Merges consecutive full-day empty blocks into compact single entries.
	// "Full day" = all slots from timeFrom to timeTo are empty (not necessarily 24h).
	// Also absorbs any adjacent sub-day empty slots into the preceding full-day empty range.
	function mergeConsecutiveFullDayEmpties(slots: ProcessedWindow[]): ProcessedWindow[] {
		const fromMin = timeFrom.getInMinutes
		const toMin = timeTo.getInMinutes
		const dayDuration = toMin > fromMin ? toMin - fromMin : toMin + 24 * 60 - fromMin

		const result: ProcessedWindow[] = []
		for (const slot of slots) {
			const durationMinutes = (slot.windowEnd.getTime() - slot.windowStart.getTime()) / 60000
			const isFullDay = slot.columns.length === 0 && durationMinutes >= dayDuration
			const isEmpty = slot.columns.length === 0

			if (!isEmpty) {
				result.push(slot)
				continue
			}

			const prev = result[result.length - 1]
			const prevIsFullDayEmpty =
				prev != null &&
				prev.columns.length === 0 &&
				(prev.windowEnd.getTime() - prev.windowStart.getTime()) / 60000 >= dayDuration

			if (isFullDay) {
				if (prevIsFullDayEmpty) {
					prev.windowEnd = slot.windowEnd
					continue
				}
				slot.spanCount = 2
				result.push(slot)
			} else {
				// Sub-day empty adjacent to a full-day empty: absorb into it
				if (prevIsFullDayEmpty) {
					prev.windowEnd = slot.windowEnd
					continue
				}
				result.push(slot)
			}
		}
		return result
	}

	// Like aggregateEmptyWindows but never merges across calendar day boundaries
	function aggregateEmptyWindowsPerDay(allSlots: ProcessedWindow[]): ProcessedWindow[] {
		const result: ProcessedWindow[] = []
		for (const slot of allSlots) {
			if (slot.columns.length > 0) {
				result.push(slot)
				continue
			}
			const prev = result[result.length - 1]
			const slotDay = Math.floor(slot.windowStart.getTime() / 86400000)
			const prevDay = prev ? Math.floor(prev.windowStart.getTime() / 86400000) : -1
			if (prev && prev.columns.length === 0 && slotDay === prevDay) {
				prev.windowEnd = slot.windowEnd
			} else {
				result.push(slot)
			}
		}
		return result
	}

	// Legend items
	const legendItems = computed(() => {
		const nameMap = new Map<string, { name: string; label: string; color: string }>()

		for (const w of windows) {
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
		const window = windows[bar.windowIndex]
		if (!window) throw new Error('Window not found')
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
