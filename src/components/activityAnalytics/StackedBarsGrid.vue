<template>
<div ref="containerRef" class="stacked-bars-container">
	<div class="stacked-bars-grid" :style="gridStyle">
		<!-- Y-axis labels (left) -->
		<template v-for="line in guideLines" :key="`y-left-${line.minute}`">
			<div class="y-axis-label y-axis-label-left" :style="{ gridRow: line.gridRow, gridColumn: 1 }">
				{{ line.minute }}m
			</div>
		</template>

		<!-- Y-axis labels (right) -->
		<template v-for="line in guideLines" :key="`y-right-${line.minute}`">
			<div class="y-axis-label y-axis-label-right" :style="{ gridRow: line.gridRow, gridColumn: totalColumns + 2 }">
				{{ line.minute }}m
			</div>
		</template>

		<!-- Horizontal guide lines -->
		<template v-for="line in guideLines" :key="`line-${line.minute}`">
			<div
				class="guide-line"
				:style="{ gridRow: line.gridRow, gridColumn: `2 / ${totalColumns + 1}` }"
			/>
		</template>

		<!-- Bottom line (0m) -->
		<div
			class="bottom-line"
			:style="{ gridRow: windowMinutes + 1, gridColumn: `2 / ${totalColumns + 1}` }"
		/>

		<!-- Window separators -->
		<template v-for="(separator, index) in windowSeparators" :key="`separator-${index}`">
			<div
				class="window-separator"
				:style="{
					gridRow: `1 / ${windowMinutes + 1}`,
					gridColumn: separator.gridColumn,
				}"
			/>
		</template>

		<!-- Activity bars -->
		<template v-for="bar in barSpans" :key="`${bar.windowIndex}-${bar.activityIndex}`">
			<StackedBarColumn
				:data="bar.data"
				:gridColumnStart="bar.gridColumnStart"
				:gridColumnEnd="bar.gridColumnEnd"
				:gridRowStart="bar.gridRowStart"
				:gridRowEnd="bar.gridRowEnd"
				:windowMinutes
				@mouseenter="showTooltip($event, bar)"
				@mouseleave="hideTooltip"
				@click="emit('activityClick', bar)"
			/>
		</template>

		<!-- X-axis labels (window time ranges) -->
		<template v-for="(window, index) in windows" :key="`x-${index}`">
			<div
				class="x-axis-label"
				:style="{
						gridRow: windowMinutes + 1,
						gridColumn: `${window.gridColumnStart} / ${window.gridColumnEnd}`,
					}"
			>
				{{ formatWindowLabel(window) }}
			</div>
		</template>

		<!-- Empty window indicators -->
		<template v-for="(window, index) in emptyWindows" :key="`empty-${index}`">
			<div
				class="empty-window"
				:style="{
						gridRow: `1 / ${windowMinutes + 1}`,
						gridColumn: `${window.gridColumnStart} / ${window.gridColumnEnd}`,
					}"
			>
				<span class="empty-label">No activity</span>
			</div>
		</template>
	</div>

	<!-- Tooltip -->
	<StackedBarsTooltip
		v-if="tooltipData"
		:data="tooltipData"
		:position="tooltipPosition"
	/>
</div>
</template>

<script setup lang="ts">
import {computed, onMounted, onUnmounted, ref} from 'vue'
import StackedBarColumn from './StackedBarColumn.vue'
import {ProcessedWindow} from '@/components/activityAnalytics/dto/ProcessedWindow'
import {BarGridSpan} from '@/components/activityAnalytics/dto/BarGridSpan'
import {GuideLine} from '@/components/activityAnalytics/dto/GuideLine'
import {GridConfig} from '@/components/activityAnalytics/dto/GridConfig'
import StackedBarsTooltip from '@/components/activityAnalytics/StackedBarsTooltip.vue';
import type {TooltipData} from '@/components/activityAnalytics/dto/TooltipData.ts';
import type {Position} from '@/dtos/dto/Position.ts';


const props = defineProps<{
	windows: ProcessedWindow[]
	windowMinutes: number
}>()

const emit = defineEmits<{
	(e: 'activityClick', bar: BarGridSpan): void
}>()

const containerRef = ref<HTMLElement | null>(null)
const containerWidth = ref(800)
const tooltipData = ref<TooltipData | null>(null)
const tooltipPosition = ref<Position>({x: 0, y: 0})

// Calculate grid configuration based on container width
const gridConfig = computed<GridConfig>(() =>
	calculateGridConfig(containerWidth.value, props.windows, props.windowMinutes)
)

function calculateGridConfig(
	width: number,
	windows: ProcessedWindow[],
	windowMinutes: number
): GridConfig {
	const yAxisWidth = 40
	const availableWidth = width - yAxisWidth

	// Count total units needed
	let totalUnits = 0
	windows.forEach((window, index) => {
		const activityCount = window.columns.length
		if (activityCount > 0) {
			// Each activity = 3 units, gaps between = 1 unit each
			const windowUnits = activityCount * 3 + Math.max(0, activityCount - 1)
			totalUnits += windowUnits
		} else {
			// Empty window gets minimum space (e.g., 3 units)
			totalUnits += 3
		}

		// Add window gap (except after last window)
		if (index < windows.length - 1) {
			totalUnits += 2
		}
	})

	// Calculate base unit to fit available width
	let baseUnit = Math.floor(availableWidth / totalUnits)
	baseUnit = Math.max(6, Math.min(baseUnit, 20)) // Clamp between 6px and 20px

	// Row height based on window size
	let rowHeight: number
	if (windowMinutes <= 15) rowHeight = 10
	else if (windowMinutes <= 20) rowHeight = 8
	else if (windowMinutes <= 30) rowHeight = 6
	else if (windowMinutes <= 60) rowHeight = 4
	else if (windowMinutes <= 90) rowHeight = 3
	else rowHeight = 2

	return new GridConfig(
		baseUnit,
		3, // barWidthUnits
		1, // barGapUnits
		2, // windowGapUnits
		yAxisWidth,
		30, // xAxisHeight
		rowHeight
	)
}

// Calculate bar positions and grid spans
const barSpans = computed<BarGridSpan[]>(() => {
	const spans: BarGridSpan[] = []
	let currentCol = 3 // Column 1 is Y-axis, column 2 is start separator

	props.windows.forEach((window, windowIndex) => {
		const windowStartCol = currentCol

		if (window.columns.length === 0) {
			// Empty window takes 5 columns
			currentCol += 5
		} else {
			window.columns.forEach((col, colIndex) => {
				const totalMinutes = col.activeMinutes + col.backgroundMinutes

				// Calculate grid row positions (rows are numbered from top)
				const gridRowStart = props.windowMinutes - totalMinutes + 1
				const gridRowEnd = props.windowMinutes + 1

				spans.push(
					new BarGridSpan(
						windowIndex,
						colIndex,
						col.domain,
						currentCol,
						currentCol + 5, // gridColumnEnd - Span 5 columns
						gridRowStart,
						gridRowEnd,
						col
					)
				)

				currentCol += 5 // Bar width (5 units)

				// Gap after bar (except last bar in window)
				if (colIndex < window.columns.length - 1) {
					currentCol += 1 // 1 unit gap
				}
			})
		}

		// Store window column span
		window.gridColumnStart = windowStartCol
		window.gridColumnEnd = currentCol

		// Window gap (except after last window) = 1 gap + 1 separator + 1 gap = 3 columns
		if (windowIndex < props.windows.length - 1) {
			currentCol += 3
		}
	})

	return spans
})

// Calculate total columns for guide lines
const totalColumns = computed(() => {
	if (barSpans.value.length === 0) return 2

	const lastBar = barSpans.value[barSpans.value.length - 1]
	if (!lastBar)
		return 0;
	return lastBar.gridColumnEnd - 1
})

// Build grid template columns
const gridTemplateColumns = computed(() => {
	const columns: string[] = []
	const config = gridConfig.value

	// Y-axis column
	columns.push(`${config.yAxisWidth}px`)

	// Start separator
	columns.push(`1px`)

	let currentCol = 2
	props.windows.forEach((window, windowIndex) => {
		if (window.columns.length > 0) {
			window.columns.forEach((col, colIndex) => {
				// Activity bar = 5 columns at half width
				for (let i = 0; i < 5; i++) {
					columns.push(`${config.baseUnit / 2}px`)
				}

				// Gap after bar (except last bar in window) = 1 column at half width (smaller gap)
				if (colIndex < window.columns.length - 1) {
					columns.push(`${config.baseUnit / 2}px`)
				}
			})
		} else {
			// Empty window placeholder = 5 columns at half width
			for (let i = 0; i < 5; i++) {
				columns.push(`${config.baseUnit / 2}px`)
			}
		}

		// Window gap (except after last window) = 1 gap + 1 separator + 1 gap
		if (windowIndex < props.windows.length - 1) {
			columns.push(`${config.baseUnit / 2}px`) // Gap before separator
			columns.push(`1px`) // Separator line
			columns.push(`${config.baseUnit / 2}px`) // Gap after separator
		}
	})

	// End separator
	columns.push(`1px`)

	// Right Y-axis column
	columns.push(`${config.yAxisWidth}px`)

	return columns.join(' ')
})

// Build grid template rows
const gridTemplateRows = computed(() => {
	const rows: string[] = []
	const config = gridConfig.value

	// Minute rows (windowMinutes rows)
	for (let i = 0; i < props.windowMinutes; i++) {
		rows.push(`${config.rowHeight}px`)
	}

	// X-axis label row
	rows.push(`${config.xAxisHeight}px`)

	return rows.join(' ')
})

// Calculate guide lines
const guideLines = computed<GuideLine[]>(() => {
	// Adaptive interval based on window size
	let interval: number
	if (props.windowMinutes <= 15) interval = 5
	else if (props.windowMinutes <= 20) interval = 5
	else if (props.windowMinutes <= 30) interval = 5
	else if (props.windowMinutes <= 60) interval = 10
	else if (props.windowMinutes <= 90) interval = 15
	else interval = 20

	const lines: GuideLine[] = []

	for (let minute = interval; minute <= props.windowMinutes; minute += interval) {
		lines.push(new GuideLine(minute, props.windowMinutes - minute + 1, true))
	}

	return lines
})

// Empty windows
const emptyWindows = computed(() => {
	return props.windows.filter((w) => w.columns.length === 0)
})

// Window separators
const windowSeparators = computed(() => {
	const separators: { gridColumn: number }[] = []
	let currentCol = 2 // Start after Y-axis (column 2 is the start separator)

	// Add separator at the start
	separators.push({gridColumn: currentCol})
	currentCol += 1 // Move past the start separator

	props.windows.forEach((window, windowIndex) => {
		// Skip past this window's columns
		if (window.columns.length === 0) {
			currentCol += 5
		} else {
			window.columns.forEach((col, colIndex) => {
				currentCol += 5 // Bar width
				if (colIndex < window.columns.length - 1) {
					currentCol += 1 // Gap
				}
			})
		}

		// Add separator between windows
		if (windowIndex < props.windows.length - 1) {
			currentCol += 1 // Gap before separator
			separators.push({gridColumn: currentCol})
			currentCol += 2 // Separator + gap after
		}
	})

	// Add separator at the end (no gap before it, it's immediately after the last window)
	separators.push({gridColumn: currentCol})

	return separators
})

// Grid style
const gridStyle = computed(() => ({
	display: 'grid',
	gridTemplateColumns: gridTemplateColumns.value,
	gridTemplateRows: gridTemplateRows.value,
	gap: '0',
	position: 'relative',
}))

// Format window label
function formatWindowLabel(window: ProcessedWindow): string {
	const start = window.windowStart
	const end = window.windowEnd

	const formatTime = (date: Date) => {
		const hours = date.getHours().toString().padStart(2, '0')
		const minutes = date.getMinutes().toString().padStart(2, '0')
		return `${hours}:${minutes}`
	}

	return `${formatTime(start)} - ${formatTime(end)}`
}

// Tooltip handlers
function showTooltip(event: MouseEvent, bar: BarGridSpan) {
	const window = props.windows[bar.windowIndex]
	if (!window)
		throw new Error('Window not found for bar')
	tooltipData.value = {
		windowLabel: formatWindowLabel(window),
		domain: bar.data.domain,
		activeMinutes: bar.data.activeMinutes,
		backgroundMinutes: bar.data.backgroundMinutes,
		totalMinutes: bar.data.activeMinutes + bar.data.backgroundMinutes,
		url: bar.data.url,
	}

	tooltipPosition.value = {
		x: event.clientX + 10,
		y: event.clientY + 10,
	}
}

function hideTooltip() {
	tooltipData.value = null
}

// Resize observer
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
	if (containerRef.value) {
		containerWidth.value = containerRef.value.clientWidth

		resizeObserver = new ResizeObserver((entries) => {
			if (!entries[0])
				return
			containerWidth.value = entries[0].contentRect.width
		})

		resizeObserver.observe(containerRef.value)
	}
})

onUnmounted(() => {
	if (resizeObserver) {
		resizeObserver.disconnect()
	}
})
</script>

<style scoped>
.stacked-bars-container {
	width: 100%;
	overflow-x: auto;
}

.stacked-bars-grid {
	padding-top: 5px;
	min-width: 600px;
}

.y-axis-label {
	display: flex;
	align-items: center;
	font-size: 11px;
	margin-bottom: 6px;
	color: #fff;
}

.y-axis-label-left {
	justify-content: flex-end;
	padding-right: 6px;
}

.y-axis-label-right {
	justify-content: flex-start;
	padding-left: 6px;
}

.guide-line {
	border-top: 1px solid #999;
	pointer-events: none;
	z-index: 1;
}

.x-axis-label {
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 11px;
	color: #fff;
	padding-top: 4px;
	text-wrap: nowrap;
}

.empty-window {
	display: flex;
	align-items: center;
	justify-content: center;
	border: 1px dashed #e0e0e0;
	background-color: #999;
	margin: 0 2px;
	z-index: 5;
}

.empty-label {
	font-size: 11px;
	color: #000;
	writing-mode: vertical-rl;
	text-orientation: mixed;
}

.window-separator {
	background-color: #999;
	pointer-events: none;
	z-index: 1;
}

.bottom-line {
	border-top: 1px solid #999;
	pointer-events: none;
	z-index: 1;
}
</style>
