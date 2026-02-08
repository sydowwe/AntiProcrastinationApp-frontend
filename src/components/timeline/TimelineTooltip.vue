<template>
	<div class="timeline-tooltip" :style="positionStyle">
		<div class="tooltip-domain">{{ data.domain }}</div>
		<VDivider class="my-1" />
		<div class="tooltip-row">
			<span>Start:</span>
			<span>{{ formatTime(data.startedAt) }}</span>
		</div>
		<div class="tooltip-row">
			<span>End:</span>
			<span>{{ formatTime(data.endedAt) }}</span>
		</div>
		<div class="tooltip-row">
			<span>Duration:</span>
			<span>{{ formatDuration(data.durationSeconds) }}</span>
		</div>
		<div class="tooltip-row">
			<span>Active time:</span>
			<span>{{ formatDuration(data.totalSeconds) }}</span>
		</div>
		<template v-if="data.url">
			<VDivider class="my-1" />
			<div class="tooltip-url" :title="data.url">{{ truncatedUrl }}</div>
		</template>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatDuration } from '@/utils/formatDuration'
import type { TimelineSession } from './types'

const props = defineProps<{
	data: TimelineSession
	position: { x: number; y: number }
}>()

const positionStyle = computed(() => ({
	position: 'fixed',
	left: `${props.position.x + 10}px`,
	top: `${props.position.y + 10}px`,
	zIndex: 1000,
}))

const truncatedUrl = computed(() => {
	if (!props.data.url) return ''
	try {
		const url = new URL(props.data.url)
		const path = url.pathname + url.search
		return path.length > 40 ? path.substring(0, 37) + '...' : path
	} catch {
		return props.data.url.substring(0, 40)
	}
})

function formatTime(date: Date): string {
	return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
</script>

<style scoped>
.timeline-tooltip {
	background: rgb(var(--v-theme-surface));
	border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
	border-radius: 8px;
	padding: 12px;
	box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
	min-width: 180px;
	pointer-events: none;
}

.tooltip-domain {
	font-weight: 600;
	font-size: 14px;
	color: rgb(var(--v-theme-on-surface));
}

.tooltip-row {
	display: flex;
	justify-content: space-between;
	font-size: 12px;
	color: rgba(var(--v-theme-on-surface), 0.6);
	margin: 4px 0;
}

.tooltip-row span:last-child {
	font-weight: 500;
	color: rgb(var(--v-theme-on-surface));
}

.tooltip-url {
	font-size: 11px;
	color: rgba(var(--v-theme-on-surface), 0.4);
	word-break: break-all;
}
</style>
