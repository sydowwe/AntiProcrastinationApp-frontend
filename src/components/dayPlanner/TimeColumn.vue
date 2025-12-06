<!-- TimeColumn.vue -->
<template>
<div
	class="time-column"
	:style="{ gridTemplateRows: `repeat(${store.totalGridRows}, ${SLOT_HEIGHT}px)` }"
>
	<!-- Empty slots for structure -->
	<div
		v-for="(slot, index) in store.timeSlots"
		:key="index"
		class="time-slot"
	/>

	<!-- Midnight divider -->
	<div
		class="midnight-divider"
		:style="{ top: `${store.timeToSlotIndex('00:00') * SLOT_HEIGHT}px` }"
	>
		<span class="midnight-label">MIDNIGHT</span>
	</div>

	<!-- Current time indicator -->
	<div
		v-if="isVisible"
		class="current-time-divider"
		:style="gridRowStyle"
	>
		<span class="current-time-label">{{ formattedTime }}</span>
	</div>

	<!-- Time labels overlay -->
	<div class="time-labels-overlay">
		<div
			v-for="(slot, index) in store.timeSlots"
			:key="index"
			class="time-label-positioned"
			:style="{ top: `${index * SLOT_HEIGHT}px` }"
		>
			{{ slot.toString }}
		</div>
	</div>
</div>
</template>

<script setup lang="ts">
import {SLOT_HEIGHT} from '@/types/DayPlannerTypes'
import {useDayPlannerStore} from '@/stores/dayPlanner/dayPlannerStore.ts';
import {useCurrentTimeIndicator} from '@/components/dayPlanner/useCurrentTimeIndicator.ts';

const store = useDayPlannerStore()
const {isVisible, formattedTime, gridRowStyle} = useCurrentTimeIndicator()
</script>

<style scoped>
.time-column {
	display: grid;
	background: rgb(var(--v-theme-neutral-100));
	position: relative;
}

.time-slot:not(:nth-of-type(3n+1)) {
	margin-right: 2px;
}

.time-slot {
	border-top: 2px dotted #999;
}

.time-slot:nth-of-type(3n+1) {
	border-top-style: solid;
}

.time-labels-overlay {
	position: absolute;
	left: 0;
	right: 0;
	pointer-events: none;
}

.time-label-positioned {
	position: absolute;
	right: 20px;
	transform: translateY(-50%);
	color: #FFF;
	font-weight: 400;
	background: rgb(var(--v-theme-neutral-100));
	padding: 0 1px;
	font-size: 13px;
}

.time-label-positioned:nth-of-type(3n+1) {
	font-weight: 500;
	font-size: 15px;
}

.midnight-divider {
	position: absolute;
	left: 0;
	right: 0;
	height: 3px;
	background: rgb(15, 39, 124);
	z-index: 20;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 2px 8px rgba(156, 39, 176, 0.4);
}

.midnight-label {
	position: absolute;
	top: -8px;
	background: rgb(15, 39, 124);
	color: white;
	padding: 2px 5px;
	border-radius: 4px;
	font-size: 10px;
	font-weight: 500;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.current-time-divider {
	position: absolute;
	left: 0;
	right: 0;
	height: 3px;
	background: rgb(var(--v-theme-secondary));
	z-index: 20;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 2px 8px rgba(var(--v-theme-secondary), 0.4);
}

.current-time-label {
	position: absolute;
	top: -8px;
	background: rgb(var(--v-theme-secondary));
	color: white;
	padding: 2px 8px;
	border-radius: 4px;
	font-size: 10px;
	font-weight: 700;
	letter-spacing: 0.5px;
	box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}
</style>