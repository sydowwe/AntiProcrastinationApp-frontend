<template>
<div class="stacked-bars-container">
	<div class="stacked-bars-grid" :style="gridStyle">
		<!-- Y-axis backgrounds (sticky full-column) -->
		<div
			class="y-axis-bg y-axis-bg-left"
			:style="{ gridRow: `1 / ${totalRows + (isSubDayMultiDay ? 3 : 2)}`, gridColumn: 1 }"
		/>
		<div
			class="y-axis-bg y-axis-bg-right"
			:style="{ gridRow: `1 / ${totalRows + (isSubDayMultiDay ? 3 : 2)}`, gridColumn: totalColumns + 2 }"
		/>

		<!-- Y-axis labels (left) -->
		<template v-for="line in guideLines" :key="`y-left-${line.minute}`">
			<div class="y-axis-label y-axis-label-left" :style="{ gridRow: line.gridRow, gridColumn: 1 }">
				{{ line.label }}
			</div>
		</template>

		<!-- Y-axis labels (right) -->
		<template v-for="line in guideLines" :key="`y-right-${line.minute}`">
			<div class="y-axis-label y-axis-label-right" :style="{ gridRow: line.gridRow, gridColumn: totalColumns + 2 }">
				{{ line.label }}
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
			:style="{ gridRow: totalRows + 1, gridColumn: `2 / ${totalColumns + 1}` }"
		/>

		<!-- Window separators -->
		<template v-for="(separator, index) in windowSeparators" :key="`separator-${index}`">
			<div
				class="window-separator"
				:class="{ 'day-boundary-separator': separator.isDayBoundary }"
				:style="{
					gridRow: separator.isDayBoundary
						? `1 / ${totalRows + (isSubDayMultiDay ? 3 : 2)}`
						: `1 / ${totalRows + 1}`,
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
				:class="{ 'x-axis-label-empty-range': window.columns.length === 0 && (window.windowEnd.getTime() - window.windowStart.getTime()) >= dayDurationMs.value }"
				:style="{
						gridRow: totalRows + 1,
						gridColumn: `${window.gridColumnStart} / ${window.gridColumnEnd}`,
					}"
			>
				{{ formatWindowLabel(window) }}
			</div>
		</template>

		<!-- Date group labels (one per calendar day, only for sub-day multi-day data) -->
		<template v-if="isSubDayMultiDay" v-for="(group, index) in dateGroups" :key="`date-group-${index}`">
			<div
				class="date-group-label"
				:style="{
					gridRow: totalRows + 2,
					gridColumn: `${group.colStart} / ${group.colEnd}`,
				}"
			>
				{{ group.label }}
			</div>
		</template>

		<!-- Empty window indicators -->
		<template v-for="(window, index) in emptyWindows" :key="`empty-${index}`">
			<div
				class="empty-window"
				:style="{
						gridRow: `1 / ${totalRows + 1}`,
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
import {computed, ref} from 'vue'
import StackedBarColumn from './StackedBarColumn.vue'
import {ProcessedWindow} from '@/components/activityTracking/stackedBars/dto/ProcessedWindow'
import {BarGridSpan} from '@/components/activityTracking/stackedBars/dto/BarGridSpan'
import {GuideLine} from '@/components/activityTracking/stackedBars/dto/GuideLine'
import {GridConfig} from '@/components/activityTracking/stackedBars/dto/GridConfig'
import StackedBarsTooltip from '@/components/activityTracking/stackedBars/StackedBarsTooltip.vue';
import type {TooltipData} from '@/components/activityTracking/stackedBars/dto/TooltipData.ts';
import type {Position} from '@/dtos/dto/Position.ts';
import {Time} from '@/dtos/dto/Time.ts';
import {formatYAxisLabel} from './stackedBarsUtils'

const MIN_COL_WIDTH = 10
const BAR_COLS = 3

const props = defineProps<{
	windows: ProcessedWindow[]
	windowMinutes: number
	rowUnit: number
	timeFrom: Time
	timeTo: Time
}>()

const emit = defineEmits<{
	(e: 'activityClick', bar: BarGridSpan): void
}>()

const tooltipData = ref<TooltipData | null>(null)
const tooltipPosition = ref<Position>({x: 0, y: 0})

const totalRows = computed(() => Math.ceil(props.windowMinutes / props.rowUnit))

const gridConfig = computed<GridConfig>(() => {
	const yAxisWidth = 44
	const xAxisHeight = 30
	const rows = totalRows.value

	let rowHeight: number
	if (rows <= 15) rowHeight = 10
	else if (rows <= 20) rowHeight = 8
	else if (rows <= 30) rowHeight = 6
	else if (rows <= 60) rowHeight = 4
	else if (rows <= 90) rowHeight = 3
	else rowHeight = 2

	return new GridConfig(0, 3, 1, 2, yAxisWidth, xAxisHeight, rowHeight)
})

// Calculate bar positions and grid spans
const barSpans = computed<BarGridSpan[]>(() => {
	const spans: BarGridSpan[] = []
	let currentCol = 4 // Col 1: Y-axis, Col 2: start sep, Col 3: start gap
	const rows = totalRows.value
	const unit = props.rowUnit

	props.windows.forEach((window, windowIndex) => {
		const windowStartCol = currentCol

		if (window.columns.length === 0) {
			currentCol += BAR_COLS * window.spanCount
		} else {
			window.columns.forEach((col, colIndex) => {
				const totalUnits = Math.min(
					Math.ceil(col.activeMinutes / unit) + Math.ceil(col.backgroundMinutes / unit),
					rows
				)

				const gridRowStart = rows - totalUnits + 1
				const gridRowEnd = rows + 1

				spans.push(
					new BarGridSpan(
						windowIndex,
						colIndex,
						col.domain,
						currentCol,
						currentCol + BAR_COLS,
						gridRowStart,
						gridRowEnd,
						col
					)
				)

				currentCol += BAR_COLS

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
	// Trigger barSpans to ensure window.gridColumnStart/End are set
	barSpans.value
	const lastWindow = props.windows[props.windows.length - 1]
	if (!lastWindow?.gridColumnEnd) return 3
	return lastWindow.gridColumnEnd
})

const colUnit = `minmax(${MIN_COL_WIDTH}px, 20px)`

const gridTemplateColumns = computed(() => {
	const columns: string[] = []
	const config = gridConfig.value

	columns.push(`${config.yAxisWidth}px`)
	columns.push('1px')
	columns.push(colUnit) // start gap

	props.windows.forEach((window, windowIndex) => {
		if (window.columns.length > 0) {
			window.columns.forEach((col, colIndex) => {
				for (let i = 0; i < BAR_COLS; i++) {
					columns.push(colUnit)
				}
				if (colIndex < window.columns.length - 1) {
					columns.push(colUnit)
				}
			})
		} else {
			for (let i = 0; i < BAR_COLS * window.spanCount; i++) {
				columns.push(colUnit)
			}
		}

		if (windowIndex < props.windows.length - 1) {
			columns.push(colUnit)
			columns.push('1px')
			columns.push(colUnit)
		}
	})

	columns.push(colUnit) // end gap
	columns.push('1px')
	columns.push(`${config.yAxisWidth}px`)

	return columns.join(' ')
})

// Build grid template rows
const gridTemplateRows = computed(() => {
	const rows: string[] = []
	const config = gridConfig.value

	for (let i = 0; i < totalRows.value; i++) {
		rows.push(`${config.rowHeight}px`)
	}

	// Time label row
	rows.push(`${config.xAxisHeight}px`)

	// Date group label row (only for sub-day multi-day data)
	if (isSubDayMultiDay.value) {
		rows.push('22px')
	}

	return rows.join(' ')
})

// Calculate guide lines
const guideLines = computed<GuideLine[]>(() => {
	const wm = props.windowMinutes
	const unit = props.rowUnit
	const rows = totalRows.value

	// Interval in minutes
	let interval: number
	if (wm <= 15) interval = 5
	else if (wm <= 20) interval = 5
	else if (wm <= 30) interval = 5
	else if (wm <= 60) interval = 10
	else if (wm <= 90) interval = 15
	else if (wm <= 360) interval = 30
	else if (wm <= 1440) interval = 120
	else if (wm <= 10080) interval = 1440
	else interval = 4320

	const lines: GuideLine[] = []

	for (let minute = interval; minute <= wm; minute += interval) {
		const rowFromTop = rows - Math.round(minute / unit) + 1
		const label = formatYAxisLabel(minute)
		lines.push(new GuideLine(minute, rowFromTop, true, label))
	}

	return lines
})

// Empty windows
const emptyWindows = computed(() => {
	return props.windows.filter((w) => w.columns.length === 0)
})

// Window separators
const windowSeparators = computed(() => {
	const separators: { gridColumn: number; isDayBoundary: boolean }[] = []
	let currentCol = 2 // Start after Y-axis (column 2 is the start separator)

	// Add separator at the start
	separators.push({gridColumn: currentCol, isDayBoundary: false})
	currentCol += 2 // Move past start separator + start gap

	props.windows.forEach((window, windowIndex) => {
		// Skip past this window's columns
		if (window.columns.length === 0) {
			currentCol += BAR_COLS * window.spanCount
		} else {
			window.columns.forEach((col, colIndex) => {
				currentCol += BAR_COLS
				if (colIndex < window.columns.length - 1) {
					currentCol += 1 // Gap
				}
			})
		}

		// Add separator between windows
		if (windowIndex < props.windows.length - 1) {
			const nextWindow = props.windows[windowIndex + 1]!
			const isDayBoundary = isSubDayMultiDay.value &&
				Math.floor(window.windowStart.getTime() / 86400000) !==
				Math.floor(nextWindow.windowStart.getTime() / 86400000)

			currentCol += 1 // Gap before separator
			separators.push({gridColumn: currentCol, isDayBoundary})
			currentCol += 2 // Separator + gap after
		}
	})

	// Add separator at the end (after end gap)
	separators.push({gridColumn: currentCol + 1, isDayBoundary: false})

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

// Duration of one configured "day" (timeFrom → timeTo), in milliseconds
const dayDurationMs = computed(() => {
	const from = props.timeFrom.getInMinutes
	const to = props.timeTo.getInMinutes
	const mins = to > from ? to - from : to + 24 * 60 - from
	return mins * 60000
})

const isMultiDay = computed(() => {
	if (props.windows.length < 2) return false
	const first = props.windows[0].windowStart
	const last = props.windows[props.windows.length - 1].windowStart
	return Math.floor(first.getTime() / 86400000) !== Math.floor(last.getTime() / 86400000)
})

// True when data spans multiple days AND windows are sub-daily (e.g. 4h windows over 7 days)
const isSubDayMultiDay = computed(() => {
	return isMultiDay.value && props.windowMinutes < 1440
})

// Groups consecutive windows belonging to the same calendar day
// Full-day empty blocks are excluded (their label is shown in the x-axis row instead)
const dateGroups = computed(() => {
	if (!isSubDayMultiDay.value) return []
	// Ensure barSpans has run so gridColumnStart/End are populated
	barSpans.value

	const groups: Array<{ label: string; colStart: number; colEnd: number }> = []
	for (const w of props.windows) {
		if (w.gridColumnStart == null || w.gridColumnEnd == null) continue
		const durationMs = w.windowEnd.getTime() - w.windowStart.getTime()
		if (w.columns.length === 0 && durationMs >= dayDurationMs.value) continue

		const label = formatDate(w.windowStart)
		const last = groups[groups.length - 1]
		if (last && last.label === label) {
			last.colEnd = w.gridColumnEnd
		} else {
			groups.push({label, colStart: w.gridColumnStart, colEnd: w.gridColumnEnd})
		}
	}
	return groups
})

function formatDate(date: Date): string {
	return `${date.getDate()} ${date.toLocaleString('en', {month: 'short'})}`
}

function formatTime(date: Date): string {
	return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
}

// X-axis time label — just the time when date is shown in the group row below
function formatWindowLabel(window: ProcessedWindow): string {
	const start = window.windowStart
	const end = window.windowEnd
	const actualMinutes = (end.getTime() - start.getTime()) / 60000

	if (actualMinutes >= 1440) {
		const startLabel = formatDate(start)
		const endLabel = formatDate(new Date(end.getTime() - 1))
		return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`
	}
	// Sub-day: if date group row is shown below, display only the time here
	if (isSubDayMultiDay.value) {
		return formatTime(start)
	}
	return `${formatTime(start)} - ${formatTime(end)}`
}

// Full label used in tooltip (always includes date for multi-day sub-day windows)
function formatWindowLabelFull(window: ProcessedWindow): string {
	const start = window.windowStart
	const end = window.windowEnd
	const actualMinutes = (end.getTime() - start.getTime()) / 60000

	if (actualMinutes >= 1440) {
		const startLabel = formatDate(start)
		const endLabel = formatDate(new Date(end.getTime() - 1))
		return startLabel === endLabel ? startLabel : `${startLabel} - ${endLabel}`
	}
	if (isSubDayMultiDay.value) {
		return `${formatDate(start)} ${formatTime(start)} - ${formatTime(end)}`
	}
	return `${formatTime(start)} - ${formatTime(end)}`
}

// Tooltip handlers
function showTooltip(event: MouseEvent, bar: BarGridSpan) {
	const window = props.windows[bar.windowIndex]
	if (!window)
		throw new Error('Window not found for bar')
	tooltipData.value = {
		windowLabel: formatWindowLabelFull(window),
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

</script>

<style scoped>
.stacked-bars-container {
	width: 100%;
	overflow-x: auto;
}

.stacked-bars-grid {
	padding-top: 5px;
}

.y-axis-label {
	display: flex;
	align-items: center;
	font-size: 11px;
	margin-bottom: 6px;
	color: #fff;
	z-index: 21;
}

.y-axis-bg {
	background: rgb(var(--v-theme-surface));
	z-index: 20;
}

.y-axis-bg-left {
	position: sticky;
	left: 0;
}

.y-axis-bg-right {
	position: sticky;
	right: 0;
}

.y-axis-label-left {
	justify-content: flex-end;
	padding-right: 6px;
	position: sticky;
	left: 0;
}

.y-axis-label-right {
	justify-content: flex-start;
	padding-left: 6px;
	position: sticky;
	right: 0;
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

.x-axis-label-edge {
	color: rgba(255, 255, 255, 0.7);
	font-weight: 500;
}

.x-axis-label-empty-range {
	color: rgba(255, 130, 130, 0.75);
	font-weight: 600;
	font-style: italic;
}

.empty-window {
	display: flex;
	align-items: center;
	justify-content: center;
	background: repeating-linear-gradient(
		-45deg,
		rgba(200, 50, 50, 0.35),
		rgba(200, 50, 50, 0.35) 6px,
		rgba(255, 255, 255, 0.12) 6px,
		rgba(255, 255, 255, 0.12) 12px
	);
	border-radius: 4px;
	z-index: 15;
}


.empty-label {
	font-size: 11px;
	font-weight: 600;
	letter-spacing: 1.5px;
	text-transform: uppercase;
	color: rgba(255, 130, 130, 0.9);
	writing-mode: vertical-rl;
	text-orientation: mixed;
}

.window-separator {
	background-color: #999;
	pointer-events: none;
	z-index: 1;
}

.day-boundary-separator {
	background-color: rgba(220, 220, 220, 0.75);
	box-shadow: -1px 0 0 rgba(220, 220, 220, 0.3), 1px 0 0 rgba(220, 220, 220, 0.3);
	z-index: 2;
}

.date-group-label {
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 11px;
	font-weight: 600;
	color: rgba(255, 255, 255, 0.7);
	letter-spacing: 0.5px;
	text-wrap: nowrap;
	border-top: 1px solid rgba(220, 220, 220, 0.2);
}

.bottom-line {
	border-top: 1px solid #999;
	pointer-events: none;
	z-index: 1;
}
</style>
