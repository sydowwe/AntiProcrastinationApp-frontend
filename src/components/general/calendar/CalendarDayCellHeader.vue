<template>
	<div
		class="cell-header"
		:class="{ holiday: day.holidayName }"
		:style="getDayTypeBorderStyle(day.dayType)"
	>
		<span
			class="cell-date-text"
			:class="{ today: day.isToday }"
		>
			{{ formatToDateWithoutYear(day.date) }}
		</span>
		<!-- Day type badge (Vacation / SickDay / Special) -->
		<VSheet
			v-if="day.dayType !== DayType.Workday && day.dayType !== DayType.Weekend"
			:color="getDayTypeColor(day.dayType)"
			rounded="sm"
			class="pa-1"
		>
			<VIcon
				:icon="`fas fa-${getDayTypeIcon(day.dayType)}`"
				size="16"
			/>
		</VSheet>
		<!-- Day label -->
		<span
			v-if="day.label"
			class="day-label-text"
		>
			{{ day.label }}
		</span>
		<!-- Holiday badge -->
		<VSheet
			v-if="day.holidayName"
			color="errorDark"
			rounded="sm"
			class="pa-1 ml-auto"
		>
			<VIcon
				icon="fas fa-gift"
				size="16"
			/>
		</VSheet>
	</div>
</template>

<script setup lang="ts">
	import type { ICalendar } from '@/dtos/response/activityPlanning/ICalendar.ts'
	import { DayType, getDayTypeColor, getDayTypeIcon } from '@/dtos/enum/DayType.ts'
	import { useDateTime } from '@/utils/DateTimeHelper.ts'

	const { day } = defineProps<{ day: ICalendar }>()

	const { formatToDateWithoutYear } = useDateTime()

	function getDayTypeBorderStyle(dayType: DayType) {
		if ([DayType.Workday, DayType.Weekend].includes(dayType)) return {}
		const color = getDayTypeColor(dayType)
		return { borderBottom: `3px solid rgb(var(--v-theme-${color}))` }
	}
</script>

<style scoped>
	.cell-header {
		position: relative;
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px;
		min-height: 48px;
		flex-shrink: 0;
		border-bottom: 2px solid rgba(var(--v-border-color), 0.4);
		background: linear-gradient(to bottom, rgba(var(--v-theme-surface), 0.5), transparent);
	}

	.cell-header.holiday {
		background: linear-gradient(to bottom, rgba(var(--v-theme-error), 0.22), rgba(var(--v-theme-error), 0.08));
	}

	.cell-date-text {
		font-weight: 700;
		font-size: 14px;
		color: rgb(var(--v-theme-on-surface));
		letter-spacing: 0.3px;
		line-height: 1.2;
		display: inline-block;
		flex-shrink: 0;
	}

	.cell-date-text.today {
		border: 3px double #fdd400;
		border-radius: 6px;
		padding: 4px 8px;
		font-weight: 800;
	}

	.day-label-text {
		font-size: 14px;
		color: rgb(var(--v-theme-on-surface));
		display: -webkit-box;
		-webkit-box-orient: vertical;
		-webkit-line-clamp: 2;
		overflow: hidden;
		min-width: 0;
		max-height: 45px;
		line-height: 1;
	}

	@media (max-width: 960px) {
		.cell-header {
			padding: 8px 10px 8px 14px;
		}

		.cell-date-text {
			font-size: 13px;
		}
	}

	@media (max-width: 600px) {
		.cell-header {
			padding: 6px 8px 6px 12px;
			min-height: 40px;
		}

		.cell-date-text {
			font-size: 12px;
		}
	}
</style>
