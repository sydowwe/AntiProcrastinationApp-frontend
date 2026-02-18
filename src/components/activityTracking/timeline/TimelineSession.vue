<template>
<div
	class="timeline-session"
	:class="[`session-${laneType}`, { 'session-mini': isMini }]"
	:style="sessionStyle"
	:title="session.domain"
	role="button"
	tabindex="0"
	:aria-label="ariaLabel"
	@mouseenter="$emit('mouseenter', $event)"
	@mouseleave="$emit('mouseleave')"
	@click="$emit('click')"
	@keydown.enter="$emit('click')"
	@keydown.space.prevent="$emit('click')"
>
		<span v-if="!isMini" class="session-label">
			{{ truncatedDomain }}
		</span>
</div>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import {getDomainColor, withOpacity} from '@/utils/domainColor'
import {formatDuration} from '@/utils/formatDuration'
import type {StackedSession} from '@/components/activityTracking/timeline/dto/StackedSession.ts';
import type {TimelineSessionDto} from '@/dtos/response/activityTracking/timeline/TimelineSessionDto.ts';
import type {SessionPosition} from '@/components/activityTracking/timeline/dto/SessionPosition.ts';
import type {LaneType} from '@/components/activityTracking/timeline/dto/LaneType.ts';

const props = defineProps<{
	session: TimelineSessionDto | StackedSession
	position: SessionPosition
	stackLevel: number
	laneType: LaneType
	baseHeight: number
}>()

defineEmits<{
	mouseenter: [event: MouseEvent]
	mouseleave: []
	click: []
}>()

const domainColor = computed(() => getDomainColor(props.session.domain))

const sessionStyle = computed(() => {
	const stackOffset = props.stackLevel * props.baseHeight
	const color = domainColor.value
	const isActive = props.laneType === 'active'

	// Background: subtle diagonal stripes with low-contrast alternating opacity
	const bgStripes = `repeating-linear-gradient(
		45deg,
		${withOpacity(color, 0.18)},
		${withOpacity(color, 0.18)} 4px,
		${withOpacity(color, 0.08)} 4px,
		${withOpacity(color, 0.08)} 8px
	)`

	return {
		position: 'absolute' as const,
		left: props.position.left,
		width: props.position.width,
		minWidth: props.position.minWidth,
		top: `${stackOffset}px`,
		height: `${props.baseHeight - 4}px`,
		background: isActive ? color : bgStripes,
		borderLeft: isActive ? 'none' : `3px solid ${color}`,
		borderRadius: '4px',
		cursor: 'pointer',
		overflow: 'hidden',
		display: 'flex',
		alignItems: 'center',
		paddingLeft: '6px',
	}
})

const isMini = computed(() => {
	const widthPercent = parseFloat(props.position.width)
	const estimatedPixels = (widthPercent / 100) * 800
	return estimatedPixels < 50
})

const truncatedDomain = computed(() => {
	const domain = props.session.domain
	if (domain.length > 15) {
		return domain.substring(0, 12) + '...'
	}
	return domain
})

const ariaLabel = computed(() => {
	return `${props.session.domain} session from ${formatTime(props.session.startedAt)} to ${formatTime(props.session.endedAt)}, duration ${formatDuration(props.session.durationSeconds)}`
})

function formatTime(date: Date): string {
	return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
}
</script>

<style scoped>
.timeline-session {
	transition: opacity 0.15s, transform 0.15s;
	box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
}

.timeline-session:hover,
.timeline-session:focus-visible {
	opacity: 0.85;
	transform: scaleY(1.08);
	z-index: 10;
}

.session-active .session-label {
	color: #fff;
	font-size: 11px;
	font-weight: 500;
	white-space: nowrap;
	text-overflow: ellipsis;
	overflow: hidden;
	text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.session-background .session-label {
	color: rgb(var(--v-theme-on-surface));
	font-size: 11px;
	font-weight: 500;
	white-space: nowrap;
	text-overflow: ellipsis;
	overflow: hidden;
}

.session-mini {
	min-width: 2px !important;
}
</style>
