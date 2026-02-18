<template>
<div ref="containerRef" class="timeline-container">
	<template v-for="(group, gi) in segmentGroups" :key="gi">
		<div v-if="gi > 0" class="split-divider"/>

		<div class="timeline-segments">
			<template v-for="(segment, si) in group.segments" :key="si">
				<!-- Activity segment -->
				<div
					v-if="segment.type === 'activity'"
					class="activity-segment"
					:style="{ width: group.widths[si] + 'px' }"
				>
					<TimelineTimeAxis
						:from="segment.from"
						:to="segment.to"
						:containerWidth="group.widths[si]"
					/>
					<TimelineLane
						:sessions="filterSessionsForRange(group.primarySessions, segment.from, segment.to)"
						:from="segment.from"
						:to="segment.to"
						:containerWidth="group.widths[si]"
						:config="config"
						laneType="active"
						@sessionHover="handleSessionHover"
						@sessionLeave="handleSessionLeave"
						@sessionClick="$emit('sessionClick', $event)"
					/>
					<TimelineLane
						:sessions="filterSessionsForRange(group.detailSessions, segment.from, segment.to)"
						:from="segment.from"
						:to="segment.to"
						:containerWidth="group.widths[si]"
						:config="config"
						laneType="active"
						@sessionHover="handleSessionHover"
						@sessionLeave="handleSessionLeave"
						@sessionClick="$emit('sessionClick', $event)"
					/>
					<TimelineLane
						:sessions="filterSessionsForRange(group.backgroundSessions, segment.from, segment.to)"
						:from="segment.from"
						:to="segment.to"
						:containerWidth="group.widths[si]"
						:config="config"
						laneType="background"
						:laneHeight="backgroundLaneHeight"
						@sessionHover="handleSessionHover"
						@sessionLeave="handleSessionLeave"
						@sessionClick="$emit('sessionClick', $event)"
					/>
				</div>

				<!-- Gap segment (compressed no-activity column) -->
				<div v-else class="gap-segment">
					<div class="gap-axis">
						<!-- Start marker only when gap is the first segment -->
						<div v-if="si === 0" class="gap-marker" style="left: 0">
							<span class="gap-marker-label">{{ formatTime(segment.from) }}</span>
							<div class="gap-marker-line"/>
						</div>
						<!-- End marker only when gap is the last segment -->
						<div v-if="si === group.segments.length - 1" class="gap-marker" style="left: 100%">
							<span class="gap-marker-label">{{ formatTime(segment.to) }}</span>
							<div class="gap-marker-line"/>
						</div>
					</div>
					<div class="gap-body">
						<span class="gap-label-vertical">No activity</span>
					</div>
				</div>
			</template>
		</div>
	</template>

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
import {buildTimelineSegments, calculateLaneHeight, calculateSegmentWidths, calculateTimelineConfig, filterSessionsForRange,} from './timelineUtils'
import type {TimelineSessionDto} from '@/dtos/response/activityTracking/timeline/TimelineSessionDto.ts'
import type {StackedSession} from '@/components/activityTracking/timeline/dto/StackedSession.ts'
import type {TimelineViewMode} from '@/components/activityTracking/timeline/dto/TimelineViewMode.ts'
import type {TimelineSegment} from '@/components/activityTracking/timeline/dto/TimelineSegment.ts'

const GAP_COLUMN_WIDTH = 48
const GRID_PADDING = 32

interface SegmentGroup {
	segments: TimelineSegment[]
	widths: number[]
	primarySessions: TimelineSessionDto[]
	detailSessions: TimelineSessionDto[]
	backgroundSessions: StackedSession[]
}

const props = defineProps<{
	primarySessions: TimelineSessionDto[]
	detailSessions: TimelineSessionDto[]
	backgroundSessions: StackedSession[]
	from: Date
	to: Date
	viewMode: TimelineViewMode
	splitPoint: Date
}>()

defineEmits<{
	sessionClick: [session: TimelineSessionDto]
}>()

const containerRef = ref<HTMLElement | null>(null)
const containerWidth = ref(800)

const tooltipData = ref<TimelineSessionDto | null>(null)
const tooltipPosition = ref({x: 0, y: 0})

const isSplitView = computed(() => props.viewMode === 'split')

const config = computed(() => {
	return calculateTimelineConfig(containerWidth.value, props.from, props.to)
})

const backgroundLaneHeight = computed(() => {
	return calculateLaneHeight(props.backgroundSessions, config.value.laneHeight)
})

const segmentGroups = computed((): SegmentGroup[] => {
	const available = containerWidth.value - GRID_PADDING

	if (!isSplitView.value) {
		const allSessions = [...props.primarySessions, ...props.detailSessions, ...props.backgroundSessions]
		const segments = buildTimelineSegments(allSessions, props.from, props.to)
		const widths = calculateSegmentWidths(segments, available, GAP_COLUMN_WIDTH)
		return [{
			segments,
			widths,
			primarySessions: props.primarySessions,
			detailSessions: props.detailSessions,
			backgroundSessions: props.backgroundSessions,
		}]
	}

	const firstPrimary = filterSessionsForRange(props.primarySessions, props.from, props.splitPoint)
	const firstDetail = filterSessionsForRange(props.detailSessions, props.from, props.splitPoint)
	const firstBackground = filterSessionsForRange(props.backgroundSessions, props.from, props.splitPoint)
	const firstAll = [...firstPrimary, ...firstDetail, ...firstBackground]
	const firstSegments = buildTimelineSegments(firstAll, props.from, props.splitPoint)
	const firstWidths = calculateSegmentWidths(firstSegments, available, GAP_COLUMN_WIDTH)

	const secondPrimary = filterSessionsForRange(props.primarySessions, props.splitPoint, props.to)
	const secondDetail = filterSessionsForRange(props.detailSessions, props.splitPoint, props.to)
	const secondBackground = filterSessionsForRange(props.backgroundSessions, props.splitPoint, props.to)
	const secondAll = [...secondPrimary, ...secondDetail, ...secondBackground]
	const secondSegments = buildTimelineSegments(secondAll, props.splitPoint, props.to)
	const secondWidths = calculateSegmentWidths(secondSegments, available, GAP_COLUMN_WIDTH)

	return [
		{segments: firstSegments, widths: firstWidths, primarySessions: firstPrimary, detailSessions: firstDetail, backgroundSessions: firstBackground},
		{segments: secondSegments, widths: secondWidths, primarySessions: secondPrimary, detailSessions: secondDetail, backgroundSessions: secondBackground},
	]
})

useResizeObserver(containerRef, (entries) => {
	containerWidth.value = entries[0]?.contentRect.width ?? 600
})

function handleSessionHover(event: MouseEvent, session: TimelineSessionDto | StackedSession) {
	tooltipData.value = session
	tooltipPosition.value = {x: event.clientX, y: event.clientY}
}

function handleSessionLeave() {
	tooltipData.value = null
}

function formatTime(date: Date): string {
	return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
}
</script>

<style scoped>
.timeline-container {
	width: 100%;
	overflow-x: auto;
	overflow-y: visible;
}

.timeline-segments {
	display: flex;
	min-width: 600px;
	padding: 0 16px;
}

.activity-segment {
	display: flex;
	flex-direction: column;
	flex-shrink: 0;
}

.gap-segment {
	flex-shrink: 0;
	width: 48px;
	display: flex;
	flex-direction: column;
	cursor: default;
}

.gap-axis {
	position: relative;
	height: 32px;
	border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
	overflow: visible;
}

.gap-marker {
	position: absolute;
	bottom: 0;
	transform: translateX(-50%);
	display: flex;
	flex-direction: column;
	align-items: center;
}

.gap-marker-label {
	font-size: 12px;
	font-weight: 600;
	color: rgba(var(--v-theme-on-surface), 0.7);
	margin-bottom: 2px;
	white-space: nowrap;
}

.gap-marker-line {
	width: 1px;
	height: 12px;
	background-color: rgba(var(--v-theme-on-surface), 0.35);
}

.gap-body {
	flex: 1;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(var(--v-theme-on-surface), 0.03);
	border-left: 1px dashed rgba(var(--v-theme-on-surface), 0.15);
	border-right: 1px dashed rgba(var(--v-theme-on-surface), 0.15);
}

.gap-label-vertical {
	writing-mode: vertical-rl;
	transform: rotate(180deg);
	font-size: 10px;
	color: rgba(var(--v-theme-on-surface), 0.35);
	text-transform: uppercase;
	letter-spacing: 1px;
	font-weight: 500;
	white-space: nowrap;
	user-select: none;
}

.split-divider {
	background: rgb(240, 240, 240);
	margin: 16px 0;
	height: 1px;
}
</style>
