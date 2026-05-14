<template>
	<div
		class="day-cell"
		:class="{
			weekend: dayData?.isWeekend,
			empty: !dayData,
			today: dayData?.isToday,
			selected,
			[`day-type-${dayData?.dayType?.toLowerCase()}`]: dayData?.dayType,
		}"
		@click="handleClick"
	>
		<template v-if="dayData">
			<CalendarDayCellHeader :day="dayData" />
			<slot :day="dayData" />
		</template>
	</div>
</template>

<script setup lang="ts">
	import CalendarDayCellHeader from '@/components/general/calendar/CalendarDayCellHeader.vue'
	import type { ICalendar } from '@/dtos/response/activityPlanning/ICalendar.ts'

	const { dayData = null, selected = false } = defineProps<{
		dayData?: ICalendar | null
		selected?: boolean
	}>()

	const emit = defineEmits<{
		click: [day: ICalendar]
	}>()

	defineSlots<{
		default(props: { day: ICalendar }): any
	}>()

	function handleClick() {
		if (!dayData) return
		emit('click', dayData)
	}
</script>

<style scoped>
	.day-cell {
		border-right: 1px solid rgba(var(--v-border-color), 0.5);
		border-bottom: 1px solid rgba(var(--v-border-color), 0.5);
		display: flex;
		flex-direction: column;
		cursor: pointer;
		transition:
			transform 0.2s ease,
			box-shadow 0.2s ease;
		min-height: 100%;
		position: relative;
		overflow: hidden;
		will-change: transform;
	}

	.day-cell:last-child {
		border-right: none;
	}

	.day-cell.selected {
		outline: 2px solid white;
		outline-offset: 0;
		z-index: 5;
	}

	.day-cell:hover:not(.empty) {
		transform: scale(1.02);
		box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
		z-index: 10;
		position: relative;
		background-color: rgb(var(--v-theme-surface)) !important;
		background-image: none !important;
	}

	.day-cell.weekend:not(.empty) {
		background-color: rgba(var(--v-theme-primary), 0.08);
	}

	.day-cell.today:not(.empty) {
		background-color: rgba(253, 212, 0, 0.1);
	}

	.day-cell.today:hover:not(.empty) {
		background-color: rgba(253, 212, 0, 0.1) !important;
	}

	.day-cell.empty {
		background-color: rgba(var(--v-border-color), 0.05);
		cursor: default;
	}
</style>
