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
		v-if="store.isOverMidnight"
		class="midnight-divider"
		:style="{ top: `${store.timeToSlotIndex(new Time(0,0)) * SLOT_HEIGHT}px` }"
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
			{{ slot.getString() }}
		</div>
	</div>
</div>
</template>

<script setup lang="ts"
        generic="TTask extends IBasePlannerTask<TTaskRequest>, TTaskRequest extends IBasePlannerTaskRequest, TStore extends IBaseDayPlannerStore<TTask, TTaskRequest>">
import {SLOT_HEIGHT} from '@/types/DayPlannerTypes.ts'
import {useCurrentTimeIndicator} from '@/composables/dayPlanner/useCurrentTimeIndicator.ts';
import {Time} from '@/utils/Time.ts';
import type {IBasePlannerTask} from '@/dtos/response/activityPlanning/IBasePlannerTask.ts';
import type {IBasePlannerTaskRequest} from '@/dtos/request/activityPlanning/IBasePlannerTaskRequest.ts';
import type {IBaseDayPlannerStore} from '@/types/IBaseDayPlannerStore.ts';
import {inject} from 'vue';

const store = inject<TStore>('plannerStore')!

const {isVisible, formattedTime, gridRowStyle} = useCurrentTimeIndicator(store)
</script>

<style scoped>
.time-column {
	display: grid;
	background: rgb(var(--v-theme-neutral-50));
	position: relative;
}

.time-slot:not(:nth-of-type(3n+1)) {
	margin-right: 2px;
}

.time-slot {
	border-top: 2px solid #9993;
}

.time-slot:nth-of-type(3n+1) {
	border-top-color: #999B;
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
	background: rgb(var(--v-theme-neutral-50));
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