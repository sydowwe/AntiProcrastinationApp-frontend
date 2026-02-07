<template>
	<div class="stacked-bars-tooltip" :style="positionStyle">
		<div class="tooltip-header">{{ data.windowLabel }}</div>
		<div class="tooltip-domain">{{ displayDomain }}</div>
		<VDivider class="my-1" />
		<div class="tooltip-row">
			<span>Active:</span>
			<span>{{ data.activeMinutes }}m</span>
		</div>
		<div class="tooltip-row">
			<span>Background:</span>
			<span>{{ data.backgroundMinutes }}m</span>
		</div>
		<div class="tooltip-row tooltip-total">
			<span>Total:</span>
			<span>{{ data.totalMinutes }}m</span>
		</div>
		<template v-if="data.url">
			<VDivider class="my-1" />
			<div class="tooltip-url" :title="data.url">{{ truncatedUrl }}</div>
		</template>
	</div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

export interface TooltipData {
	windowLabel: string
	domain: string
	activeMinutes: number
	backgroundMinutes: number
	totalMinutes: number
	url?: string
}

export interface TooltipPosition {
	x: number
	y: number
}

const props = defineProps<{
	data: TooltipData
	position: TooltipPosition
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
</script>

<style scoped>
.stacked-bars-tooltip {
	position: fixed;
	background: rgba(0, 0, 0, 0.9);
	color: white;
	padding: 8px 12px;
	border-radius: 4px;
	font-size: 12px;
	pointer-events: none;
	z-index: 1000;
	min-width: 160px;
	box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.tooltip-header {
	font-weight: 600;
	margin-bottom: 4px;
	font-size: 13px;
}

.tooltip-domain {
	color: #aaa;
	font-size: 11px;
	margin-bottom: 4px;
}

.tooltip-row {
	display: flex;
	justify-content: space-between;
	gap: 16px;
	padding: 2px 0;
}

.tooltip-total {
	font-weight: 600;
	border-top: 1px solid rgba(255, 255, 255, 0.2);
	margin-top: 4px;
	padding-top: 4px;
}

.tooltip-url {
	color: #aaa;
	font-size: 10px;
	font-family: monospace;
	margin-top: 4px;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}
</style>
