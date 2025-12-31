<template>
<div class="planner-calendar-view pa-4">
	<!-- Controls -->
	<VCard class="mb-4" elevation="2">
		<VCardText class="d-flex justify-space-between">
			<DateRangePicker v-model="dateRange" mode="month" density="compact"/>
			<VSelect
				v-model="dayVisibility"
				label="Days to Show"
				:items="dayVisibilityOptions"
				itemTitle="label"
				min-width="210px"
				maxWidth="210px"
				hideDetails
				density="compact"
			/>
		</VCardText>
	</VCard>

	<!-- Calendar Grid -->
	<VCard elevation="2" class="calendar-card">
		<VCardText class="pa-0">
			<div class="calendar-container" :style="{ '--calendar-columns': numColumns }">
				<!-- Day Headers -->
				<div class="calendar-header">
					<div
						v-for="day in visibleDayHeaders"
						:key="day.index"
						class="day-header"
						:class="{ 'weekend': day.isWeekend }"
					>
						{{ day.name }}
					</div>
				</div>

				<!-- Calendar Weeks -->
				<div class="calendar-body">
					<div
						v-for="(week, weekIndex) in calendarWeeks"
						:key="weekIndex"
						class="calendar-week"
					>
						<div
							v-for="(dayData, dayIndex) in week"
							:key="dayIndex"
							class="day-cell"
							:class="{
								'weekend': dayData?.isWeekend,
								'empty': !dayData?.date,
								'today': dayData?.isToday
							}"
							@click="handleDayClick(dayData)"
						>
							<template v-if="dayData?.date">
								<div class="cell-date">
									{{ formatCellDate(dayData.date) }}
								</div>
								<div class="cell-content">
									<!-- Content will go here -->
								</div>
							</template>
						</div>
					</div>
				</div>
			</div>
		</VCardText>
	</VCard>
</div>
</template>

<script setup lang="ts">
import {computed, ref} from 'vue'
import DateRangePicker from '@/components/general/dateTime/DateRangePicker.vue'
import type {Calendar} from '@/dtos/response/activityPlanning/Calendar.ts';

// Date range state
const dateRange = ref<{ start: Date | null; end: Date | null }>({
	start: new Date(),
	end: new Date()
})

// Day visibility mode
type DayVisibility = 'all' | 'workdays' | 'weekend'
const dayVisibility = ref<DayVisibility>('all')

const dayVisibilityOptions = [
	{label: 'All Week', value: 'all'},
	{label: 'Workdays (Mon-Fri)', value: 'workdays'},
	{label: 'Weekend (Fri-Sun)', value: 'weekend'}
]

// All days of the week
const allDays = [
	{index: 0, name: 'Monday', shortName: 'Mon', isWeekend: false},
	{index: 1, name: 'Tuesday', shortName: 'Tue', isWeekend: false},
	{index: 2, name: 'Wednesday', shortName: 'Wed', isWeekend: false},
	{index: 3, name: 'Thursday', shortName: 'Thu', isWeekend: false},
	{index: 4, name: 'Friday', shortName: 'Fri', isWeekend: false},
	{index: 5, name: 'Saturday', shortName: 'Sat', isWeekend: true},
	{index: 6, name: 'Sunday', shortName: 'Sun', isWeekend: true}
]

// Compute visible day headers based on visibility mode
const visibleDayHeaders = computed(() => {
	if (dayVisibility.value === 'workdays') {
		return allDays.filter(day => !day.isWeekend)
	} else if (dayVisibility.value === 'weekend') {
		return allDays.filter(day => day.index >= 4) // Fri, Sat, Sun
	}
	return allDays
})

// Number of columns based on visibility
const numColumns = computed(() => visibleDayHeaders.value.length)

// Helper to check if a date is today
function isToday(date: Date): boolean {
	const today = new Date()
	return date.getDate() === today.getDate() &&
		date.getMonth() === today.getMonth() &&
		date.getFullYear() === today.getFullYear()
}

// Generate calendar weeks
const calendarWeeks = computed(() => {
	if (!dateRange.value.start || !dateRange.value.end) {
		return []
	}

	const start = new Date(dateRange.value.start)
	const end = new Date(dateRange.value.end)

	// Find the Monday of the week containing the start date
	const startDay = start.getDay()
	const daysToMonday = startDay === 0 ? 6 : startDay - 1
	const weekStart = new Date(start)
	weekStart.setDate(start.getDate() - daysToMonday)
	weekStart.setHours(0, 0, 0, 0)

	// Find the Sunday of the week containing the end date
	const endDay = end.getDay()
	const daysToSunday = endDay === 0 ? 0 : 7 - endDay
	const weekEnd = new Date(end)
	weekEnd.setDate(end.getDate() + daysToSunday)
	weekEnd.setHours(23, 59, 59, 999)

	const weeks: (Calendar | null)[][] = []
	let currentDate = new Date(weekStart)

	while (currentDate <= weekEnd) {
		const week: (Calendar | null)[] = []

		for (let i = 0; i < 7; i++) {
			const date = new Date(currentDate)
			const dayOfWeek = date.getDay()
			const mondayBasedIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1

			// Check if this day should be visible based on visibility mode
			const shouldShow = visibleDayHeaders.value.some(day => day.index === mondayBasedIndex)

			if (shouldShow) {
				// Only include if within the selected range
				if (date >= start && date <= end) {
					week.push({
						date.toDateString(),
						isWeekend: mondayBasedIndex >= 5,
						isToday: isToday(date),
						dayOfWeek: mondayBasedIndex
					})
				} else {
					week.push(null)
				}
			}

			currentDate.setDate(currentDate.getDate() + 1)
		}

		// Only add weeks that have at least one visible day
		if (week.some(day => day !== null)) {
			weeks.push(week)
		}
	}

	return weeks
})

// Format date for cell display
function formatCellDate(date: Date): string {
	return date.toLocaleDateString('cs-CZ', {
		day: 'numeric',
		month: 'short'
	})
}

// Handle day click
function handleDayClick(dayData: Calendar | null) {
	if (!dayData?.date) return
	console.log('Day clicked:', dayData.date)
	// TODO: Implement day click logic (e.g., navigate to day view, open dialog, etc.)
}

// Initialize with current week
function initializeCurrentWeek() {
	const today = new Date()
	const dayOfWeek = today.getDay()
	const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1

	const monday = new Date(today)
	monday.setDate(today.getDate() - daysToMonday)
	monday.setHours(0, 0, 0, 0)

	const sunday = new Date(monday)
	sunday.setDate(monday.getDate() + 6)
	sunday.setHours(23, 59, 59, 999)

	dateRange.value = {
		start: monday,
		end: sunday
	}
}

// Initialize on mount
initializeCurrentWeek()
</script>

<style scoped>
.planner-calendar-view {
	height: 100%;
	width: 100%;
	display: flex;
	flex-direction: column;
}

.calendar-card {
	flex: 1;
	display: flex;
	flex-direction: column;
	min-height: 0;
}

.calendar-card :deep(.v-card-text) {
	flex: 1;
	display: flex;
	flex-direction: column;
	min-height: 0;
}

.calendar-container {
	display: flex;
	flex-direction: column;
	height: 100%;
	min-height: 0;
}

.calendar-header {
	display: grid;
	grid-template-columns: repeat(var(--calendar-columns, 7), 1fr);
	border-bottom: 2px solid rgb(var(--v-theme-primary));
	background-color: rgb(var(--v-theme-surface));
	flex-shrink: 0;
}

.day-header {
	padding: 12px 8px;
	text-align: center;
	border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
	font-weight: 600;
	font-size: 14px;
	color: rgb(var(--v-theme-on-surface));
}

.day-header:last-child {
	border-right: none;
}

.day-header.weekend {
	background-color: rgba(var(--v-theme-primary), 0.05);
}

.calendar-body {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow-y: auto;
	min-height: 0;
}

.calendar-week {
	display: grid;
	grid-template-columns: repeat(var(--calendar-columns, 7), 1fr);
	flex: 1;
	min-height: 150px;
}

.day-cell {
	border-right: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
	border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
	display: flex;
	flex-direction: column;
	cursor: pointer;
	transition: background-color 0.2s ease;
	min-height: 100%;
}

.day-cell:last-child {
	border-right: none;
}

.day-cell:hover:not(.empty) {
	background-color: rgba(var(--v-theme-primary), 0.08);
}

.day-cell.weekend:not(.empty) {
	background-color: rgba(var(--v-theme-primary), 0.02);
}

.day-cell.weekend:hover:not(.empty) {
	background-color: rgba(var(--v-theme-primary), 0.1);
}

.day-cell.today:not(.empty) {
	background-color: rgba(var(--v-theme-primary), 0.12);
	border: 2px solid rgb(var(--v-theme-primary));
}

.day-cell.empty {
	background-color: rgba(var(--v-border-color), 0.05);
	cursor: default;
}

.cell-date {
	padding: 8px 16px;
	font-weight: 600;
	font-size: 13px;
	color: rgb(var(--v-theme-on-surface));
	border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
	flex-shrink: 0;
}

.day-cell.today .cell-date {
	color: rgb(var(--v-theme-primary));
}

.cell-content {
	flex: 1;
	padding: 8px;
	overflow-y: auto;
}

/* Dynamic column count based on visibility mode */
.calendar-header,
.calendar-week {
	--calendar-columns: 7;
}

/* Responsive adjustments */
@media (max-width: 960px) {
	.calendar-week {
		min-height: 120px;
	}

	.cell-date {
		font-size: 12px;
		padding: 6px;
	}

	.cell-content {
		padding: 6px;
	}
}

@media (max-width: 600px) {
	.day-header {
		font-size: 12px;
		padding: 8px 4px;
	}
}
</style>