<template>
<div class="stacked-bars-tooltip" :style="positionStyle">
	<div class="tooltip-domain">{{ displayDomain }}</div>
	<div class="tooltip-timespan">{{ formatMinutes(data.totalMinutes) }}</div>
	<VDivider class="my-1"/>
	<div class="tooltip-row">
		<span>Active</span>
		<span>{{ formatMinutes(data.activeMinutes) }}</span>
	</div>
	<div class="tooltip-row">
		<span>Background</span>
		<span>{{ formatMinutes(data.backgroundMinutes) }}</span>
	</div>
	<template v-if="data.url">
		<VDivider class="my-1"/>
		<div class="tooltip-url" :title="data.url">{{ truncatedUrl }}</div>
	</template>
</div>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import type {TooltipData} from '@/components/activityTracking/stackedBars/dto/TooltipData.ts';
import type {Position} from '@/dtos/dto/Position.ts';

const props = defineProps<{
	data: TooltipData
	position: Position
}>()

const displayDomain = computed(() => {
	return props.data.domain === '_other' ? 'Other' : props.data.domain
})

const truncatedUrl = computed(() => {
	if (!props.data.url) return ''
	return props.data.url.length > 40 ? props.data.url.substring(0, 37) + '...' : props.data.url
})

const positionStyle = computed(() => ({
	left: `${props.position.x}px`,
	top: `${props.position.y}px`,
}))

function formatMinutes(minutes: number): string {
	if (minutes < 60) return `${minutes}m`
	const h = Math.floor(minutes / 60)
	const m = minutes % 60
	return m === 0 ? `${h}h` : `${h}h ${m}m`
}
</script>

<style scoped>
.stacked-bars-tooltip {
	position: fixed;
	background: rgba(18, 18, 24, 0.97);
	color: white;
	padding: 10px 14px;
	border-radius: 6px;
	font-size: 12px;
	pointer-events: none;
	z-index: 99999;
	min-width: 170px;
	box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.08);
}

.tooltip-domain {
	font-weight: 700;
	font-size: 14px;
	margin-bottom: 2px;
	letter-spacing: 0.2px;
}

.tooltip-timespan {
	color: rgba(255, 255, 255, 0.55);
	font-size: 12px;
	font-weight: 500;
	margin-bottom: 6px;
}

.tooltip-row {
	display: flex;
	justify-content: space-between;
	gap: 20px;
	padding: 2px 0;
	color: rgba(255, 255, 255, 0.8);
}

.tooltip-total {
	font-weight: 600;
	color: white;
	border-top: 1px solid rgba(255, 255, 255, 0.15);
	margin-top: 4px;
	padding-top: 4px;
}

.tooltip-url {
	color: rgba(255, 255, 255, 0.4);
	font-size: 10px;
	font-family: monospace;
	margin-top: 4px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
</style>
