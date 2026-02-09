<template>
<div class="time-axis">
	<div
		v-for="marker in timeMarkers"
		:key="marker.time.getTime()"
		class="time-marker"
		:class="`marker-${marker.weight}`"
		:style="{ left: marker.position }"
	>
			<span v-if="marker.weight !== 'minor'" class="marker-label">
				{{ marker.label }}
			</span>
		<div class="marker-line"/>
	</div>
</div>
</template>

<script setup lang="ts">
import {computed} from 'vue'
import {TimeMarker} from './dto/TimeMarker'

const props = defineProps<{
	from: Date
	to: Date
	containerWidth: number
}>()

const timeMarkers = computed(() => {
	const markers: TimeMarker[] = []
	const duration = props.to.getTime() - props.from.getTime()
	const durationHours = duration / (1000 * 60 * 60)

	// Tick interval is always 5 minutes
	const tickInterval = 5

	// Always label every 15 minutes, full hours are major
	const labelInterval = 15

	// Round from up to the nearest tick interval
	const startTime = new Date(props.from)
	startTime.setMinutes(
		Math.ceil(startTime.getMinutes() / tickInterval) * tickInterval,
		0,
		0,
	)

	let current = startTime.getTime()
	const end = props.to.getTime()

	while (current <= end) {
		const date = new Date(current)
		const minutes = date.getMinutes()
		const position = ((current - props.from.getTime()) / duration) * 100

		// Determine weight: hour = major, 15-min = regular, 5-min = minor
		let weight: TimeMarker['weight']
		if (minutes === 0) {
			weight = 'major'
		} else if (minutes % labelInterval === 0) {
			weight = 'regular'
		} else {
			weight = 'minor'
		}

		markers.push(new TimeMarker(
			date,
			`${position}%`,
			formatTimeLabel(date),
			weight
		))

		current += tickInterval * 60 * 1000
	}

	return markers
})

function formatTimeLabel(date: Date): string {
	return date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})
}
</script>

<style scoped>
.time-axis {
	position: relative;
	height: 32px;
	border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
	background: rgb(var(--v-theme-surface));
	overflow: visible;
}

.time-marker {
	position: absolute;
	bottom: 0;
	transform: translateX(-50%);
	display: flex;
	flex-direction: column;
	align-items: center;
}

/* Minor: 5-min tick, no label */
.marker-minor .marker-line {
	width: 1px;
	height: 6px;
	background-color: rgba(var(--v-theme-on-surface), 0.25);
}

/* Regular: 15/30-min tick with label */
.marker-regular .marker-line {
	width: 1px;
	height: 10px;
	background-color: rgba(var(--v-theme-on-surface), 0.2);
}

.marker-regular .marker-label {
	font-size: 11px;
	color: rgba(var(--v-theme-on-surface), 0.45);
	margin-bottom: 2px;
}

/* Major: hour tick with bold label */
.marker-major .marker-line {
	width: 1px;
	height: 12px;
	background-color: rgba(var(--v-theme-on-surface), 0.35);
}

.marker-major .marker-label {
	font-size: 12px;
	font-weight: 600;
	color: rgba(var(--v-theme-on-surface), 0.7);
	margin-bottom: 2px;
}
</style>
