<template>
<div ref="containerRef" class="timeline-container">
	<div class="timeline-grid" :class="{ 'split-view': isSplitView }" :style="gridStyle">
		<!-- Single row mode -->
		<template v-if="!isSplitView">
			<!-- Time axis -->
			<TimelineTimeAxis
				:from="from"
				:to="to"
				:containerWidth="containerWidth"
				class="time-axis"
			/>

			<!-- Active lane -->
			<TimelineLane
				:sessions="activeSessions"
				:from="from"
				:to="to"
				:containerWidth="containerWidth"
				:config="config"
				laneType="active"
				class="active-lane"
				@sessionHover="handleSessionHover"
				@sessionLeave="handleSessionLeave"
				@sessionClick="$emit('sessionClick', $event)"
			/>

			<!-- Background lane -->
			<TimelineLane
				:sessions="backgroundSessions"
				:from="from"
				:to="to"
				:containerWidth="containerWidth"
				:config="config"
				laneType="background"
				:laneHeight="backgroundLaneHeight"
				class="background-lane"
				@sessionHover="handleSessionHover"
				@sessionLeave="handleSessionLeave"
				@sessionClick="$emit('sessionClick', $event)"
			/>

			<!-- No activity gaps -->
			<div
				v-for="gap in activityGaps"
				:key="`gap-${gap.startedAt.getTime()}`"
				class="no-activity-gap"
				:style="getGapStyle(gap)"
			>
					<span v-if="getGapDisplay(gap).showLabel" class="gap-label">
						No activity
					</span>
			</div>
		</template>

		<!-- Split view mode -->
		<template v-else>
			<!-- First half -->
			<TimelineTimeAxis
				:from="from"
				:to="splitPoint"
				:containerWidth="containerWidth"
				class="time-axis time-axis-first"
			/>
			<TimelineLane
				:sessions="filterSessionsForRange(activeSessions, from, splitPoint)"
				:from="from"
				:to="splitPoint"
				:containerWidth="containerWidth"
				:config="config"
				laneType="active"
				class="active-lane active-lane-first"
				@sessionHover="handleSessionHover"
				@sessionLeave="handleSessionLeave"
				@sessionClick="$emit('sessionClick', $event)"
			/>
			<TimelineLane
				:sessions="filterSessionsForRange(backgroundSessions, from, splitPoint)"
				:from="from"
				:to="splitPoint"
				:containerWidth="containerWidth"
				:config="config"
				laneType="background"
				:laneHeight="backgroundLaneHeight"
				class="background-lane background-lane-first"
				@sessionHover="handleSessionHover"
				@sessionLeave="handleSessionLeave"
				@sessionClick="$emit('sessionClick', $event)"
			/>

			<!-- Divider -->
			<div class="split-divider"/>

			<!-- Second half -->
			<TimelineTimeAxis
				:from="splitPoint"
				:to="to"
				:containerWidth="containerWidth"
				class="time-axis time-axis-second"
			/>
			<TimelineLane
				:sessions="filterSessionsForRange(activeSessions, splitPoint, to)"
				:from="splitPoint"
				:to="to"
				:containerWidth="containerWidth"
				:config="config"
				laneType="active"
				class="active-lane active-lane-second"
				@sessionHover="handleSessionHover"
				@sessionLeave="handleSessionLeave"
				@sessionClick="$emit('sessionClick', $event)"
			/>
			<TimelineLane
				:sessions="filterSessionsForRange(backgroundSessions, splitPoint, to)"
				:from="splitPoint"
				:to="to"
				:containerWidth="containerWidth"
				:config="config"
				laneType="background"
				:laneHeight="backgroundLaneHeight"
				class="background-lane background-lane-second"
				@sessionHover="handleSessionHover"
				@sessionLeave="handleSessionLeave"
				@sessionClick="$emit('sessionClick', $event)"
			/>

			<!-- Gaps for split view -->
			<div
				v-for="gap in activityGaps"
				:key="`gap-${gap.startedAt.getTime()}`"
				class="no-activity-gap"
				:style="getGapStyleSplit(gap)"
			>
					<span v-if="getGapDisplay(gap).showLabel" class="gap-label">
						No activity
					</span>
			</div>
		</template>
	</div>

	<!-- Tooltip -->
	<TimelineTooltip v-if="tooltipData" :data="tooltipData" :position="tooltipPosition"/>
</div>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue'
import {useResizeObserver} from '@vueuse/core'
import TimelineTimeAxis from './TimelineTimeAxis.vue'
import TimelineLane from './TimelineLane.vue'
import TimelineTooltip from './TimelineTooltip.vue'
import {
	calculateGapDisplay,
	calculateLaneHeight,
	calculateSessionPosition,
	calculateTimelineConfig,
	filterSessionsForRange,
	findActivityGaps,
} from './timelineUtils'
import type {Gap, StackedSession, TimelineSession, ViewMode,} from './types'

const DIVIDER_HEIGHT = 16

const props = defineProps<{
	activeSessions: TimelineSession[]
	backgroundSessions: StackedSession[]
	from: Date
	to: Date
	viewMode: ViewMode
	splitPoint: Date
}>()

defineEmits<{
	sessionClick: [session: TimelineSession]
}>()

const containerRef = ref<HTMLElement | null>(null)
const containerWidth = ref(800)

const tooltipData = ref<TimelineSession | null>(null)
const tooltipPosition = ref({x: 0, y: 0})

const isSplitView = computed(() => props.viewMode === 'split')

// Compute config internally based on measured container width
const config = computed(() => {
	return calculateTimelineConfig(containerWidth.value, props.from, props.to)
})

// Compute background lane height from stacked sessions
const backgroundLaneHeight = computed(() => {
	return calculateLaneHeight(props.backgroundSessions, config.value.laneHeight)
})

// Merge active and background sessions for gap detection
const allSessions = computed(() => [...props.activeSessions, ...props.backgroundSessions])

const activityGaps = computed(() => {
	return findActivityGaps(allSessions.value, props.from, props.to, 30)
})

const gridStyle = computed(() => {
	if (isSplitView.value) {
		return {
			display: 'grid',
			gridTemplateRows: `
				auto
				${config.value.laneHeight}px
				${backgroundLaneHeight.value}px
				${DIVIDER_HEIGHT}px
				auto
				${config.value.laneHeight}px
				${backgroundLaneHeight.value}px
			`,
			gridTemplateColumns: '1fr',
		}
	}

	return {
		display: 'grid',
		gridTemplateRows: `
			auto
			${config.value.laneHeight}px
			${backgroundLaneHeight.value}px
		`,
		gridTemplateColumns: '1fr',
	}
})

// Resize observer
useResizeObserver(containerRef, (entries) => {
	containerWidth.value = entries[0]?.contentRect.width ?? 600
})

function handleSessionHover(event: MouseEvent, session: TimelineSession | StackedSession) {
	tooltipData.value = session
	tooltipPosition.value = {x: event.clientX, y: event.clientY}
}

function handleSessionLeave() {
	tooltipData.value = null
}

function getGapDisplay(gap: Gap) {
	return calculateGapDisplay(gap, config.value)
}

function getGapStyle(gap: Gap) {
	const position = calculateSessionPosition(
		{
			id: -1,
			domain: 'gap',
			startedAt: gap.startedAt,
			endedAt: gap.endedAt,
			durationSeconds: gap.durationMinutes * 60,
			totalSeconds: 0,
		},
		props.from,
		props.to,
		containerWidth.value,
		config.value,
	)

	const gapHeight = config.value.laneHeight + backgroundLaneHeight.value

	return {
		position: 'absolute',
		left: position.left,
		width: position.width,
		top: `${config.value.timeAxisHeight}px`,
		height: `${gapHeight}px`,
		backgroundColor: 'rgba(var(--v-theme-on-surface), 0.04)',
		border: '1px dashed rgba(var(--v-theme-on-surface), 0.15)',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		pointerEvents: 'none',
		zIndex: 1,
	}
}

function getGapStyleSplit(gap: Gap) {
	// Determine which half the gap belongs to based on midpoint
	const gapMid = (gap.startedAt.getTime() + gap.endedAt.getTime()) / 2
	const splitMid = props.splitPoint.getTime()
	const isFirstHalf = gapMid < splitMid

	const rangeFrom = isFirstHalf ? props.from : props.splitPoint
	const rangeTo = isFirstHalf ? props.splitPoint : props.to

	const position = calculateSessionPosition(
		{
			id: -1,
			domain: 'gap',
			startedAt: gap.startedAt,
			endedAt: gap.endedAt,
			durationSeconds: gap.durationMinutes * 60,
			totalSeconds: 0,
		},
		rangeFrom,
		rangeTo,
		containerWidth.value,
		config.value,
	)

	const gapHeight = config.value.laneHeight + backgroundLaneHeight.value

	// Calculate top position based on which half
	const firstHalfTop = config.value.timeAxisHeight
	const secondHalfTop =
		config.value.timeAxisHeight +
		config.value.laneHeight +
		backgroundLaneHeight.value +
		DIVIDER_HEIGHT +
		config.value.timeAxisHeight

	return {
		position: 'absolute',
		left: position.left,
		width: position.width,
		top: `${isFirstHalf ? firstHalfTop : secondHalfTop}px`,
		height: `${gapHeight}px`,
		backgroundColor: 'rgba(var(--v-theme-on-surface), 0.04)',
		border: '1px dashed rgba(var(--v-theme-on-surface), 0.15)',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		pointerEvents: 'none',
		zIndex: 1,
	}
}
</script>

<style scoped>
.timeline-container {
	width: 100%;
	overflow-x: auto;
	overflow-y: visible;
}

.timeline-grid {
	min-width: 600px;
	position: relative;
	padding: 0 16px;
}

.split-divider {
	background: rgba(var(--v-theme-on-surface), 0.06);
	display: flex;
	align-items: center;
	justify-content: center;
	color: rgba(var(--v-theme-on-surface), 0.5);
	font-size: 10px;
	text-transform: uppercase;
	letter-spacing: 0.5px;
}

.split-divider::before {
	content: '···';
	font-size: 16px;
}

.no-activity-gap {
	border-radius: 4px;
}

.gap-label {
	font-size: 11px;
	color: rgba(var(--v-theme-on-surface), 0.35);
	text-transform: uppercase;
	letter-spacing: 0.5px;
	font-weight: 500;
}
</style>
