<template>
<div
	class="bar-column"
	:style="barContainerStyle"
	@mouseenter="$emit('mouseenter', $event)"
	@mouseleave="$emit('mouseleave', $event)"
	@click="$emit('click', $event)"
>
	<!-- Background portion (top, striped) -->
	<div
		v-if="data.backgroundSeconds > 0"
		class="bar-segment bar-background"
		:style="backgroundStyle"
	/>
	<!-- Active portion (bottom, solid) -->
	<div
		v-if="data.activeSeconds > 0"
		class="bar-segment bar-active"
		:style="activeStyle"
	/>
</div>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import {getDomainColor, lightenColor} from '@/utils/domainColor'
import type {ColumnData} from '@/components/activityTracking/stackedBars/dto/ColumnData.ts';


const props = defineProps<{
	data: ColumnData
	gridColumnStart: number
	gridColumnEnd: number
	gridRowStart: number
	gridRowEnd: number
	windowMinutes: number
}>()

defineEmits<{
	(e: 'mouseenter', event: MouseEvent): void
	(e: 'mouseleave', event: MouseEvent): void
	(e: 'click', event: MouseEvent): void
}>()

const domainColor = computed(() => props.data.color ?? getDomainColor(props.data.domain))

const barContainerStyle = computed(() => ({
	gridColumn: `${props.gridColumnStart} / ${props.gridColumnEnd}`,
	gridRow: `${props.gridRowStart} / ${props.gridRowEnd}`,
	display: 'flex',
	flexDirection: 'column',
}))

const activeMinutes = computed(() => props.data.activeMinutes)
const backgroundMinutes = computed(() => props.data.backgroundMinutes)

const activeStyle = computed(() => ({
	flex: `${activeMinutes.value} 0 0`,
	backgroundColor: domainColor.value,
	borderRadius: '0', // No bottom border radius
}))

const backgroundStyle = computed(() => ({
	flex: `${backgroundMinutes.value} 0 0`,
	background: `repeating-linear-gradient(
		45deg,
		${domainColor.value},
		${domainColor.value} 2px,
		${lightenColor(domainColor.value, 0.6)} 2px,
		${lightenColor(domainColor.value, 0.6)} 4px
	)`,
	borderRadius: '4px 4px 0 0', // Only top border radius
}))
</script>

<style scoped>
.bar-column {
	cursor: pointer;
	transition: opacity 0.15s;
	z-index: 5;
}

.bar-column:hover {
	opacity: 0.85;
}

.bar-segment {
	min-height: 1px;
}
</style>
