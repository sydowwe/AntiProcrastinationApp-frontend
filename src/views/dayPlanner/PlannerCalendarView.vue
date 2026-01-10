<template>
<div class="planner-calendar-view">
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
	<VCard elevation="2" class="calendar-card" :loading="loading">
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
								'empty': !dayData,
								'today': dayData?.isToday,
								[`day-type-${dayData?.dayType?.toLowerCase()}`]: dayData?.dayType
							}"
							@click="handleDayClick(dayData)"
						>
							<template v-if="dayData">
								<!-- Header with date and label -->
								<div class="cell-header">
									<div class="header-top">
										<span class="cell-date-text">{{ formatCellDate(dayData.date) }}</span>
										<!-- Label chip with color based on day type -->
										<VChip
											v-if="dayData.label"
											size="small"
											:color="!['Workday', 'Weekend'].includes(dayData.dayType) ? dayData.getDayTypeColor() : undefined"
											variant="flat"
											class="cell-label-chip"
										>
											<VIcon :icon="dayData.getDayTypeIcon()" size="x-small" class="mr-1"/>
											<strong>{{ dayData.label }}</strong>
										</VChip>
									</div>
								</div>

								<div class="cell-content">
									<!-- Wake/Bed Time -->
									<div v-if="dayData.wakeUpTime || dayData.bedTime" class="cell-info">
										<VIcon icon="fas fa-clock" size="small" class="mr-1"/>
										<span class="info-text">{{ dayData.wakeUpTime.getString() }} - {{ dayData.bedTime.getString() }}</span>
									</div>

									<!-- Tasks Progress -->
									<div class="cell-info tasks-info">
										<VIcon icon="fas fa-list-check" size="small" class="mr-1"/>
										<div class="tasks-progress">
											<span class="info-text">{{ dayData.completedTasks }}/{{ dayData.totalTasks }} tasks</span>
											<VProgressLinear
												v-if="dayData.totalTasks > 0"
												:modelValue="dayData.completionRate"
												:color="dayData.completionRate >= 80 ? 'success' : dayData.completionRate >= 50 ? 'warning' : 'error'"
												height="6"
												rounded
												class="mt-1"
											/>
											<VChip
												v-if="dayData.totalTasks > 0"
												size="x-small"
												:color="dayData.completionRate >= 80 ? 'success' : dayData.completionRate >= 50 ? 'warning' : 'error'"
												variant="flat"
												class="mt-1"
											>
												{{ Math.round(dayData.completionRate) }}%
											</VChip>
										</div>
									</div>

									<!-- Applied Template -->
									<div v-if="dayData.appliedTemplateName" class="cell-info secondary-info">
										<VIcon icon="fas fa-file-lines" size="small" class="mr-1"/>
										<span class="info-text">{{ dayData.appliedTemplateName }}</span>
									</div>

									<!-- Weather -->
									<div v-if="dayData.weather" class="cell-info secondary-info">
										<VIcon icon="fas fa-cloud-sun" size="small" class="mr-1"/>
										<span class="info-text">{{ dayData.weather }}</span>
									</div>

									<!-- Notes -->
									<div v-if="dayData.notes" class="cell-info notes secondary-info">
										<VIcon icon="fas fa-note-sticky" size="small" class="mr-1"/>
										<span class="text-truncate info-text">{{ dayData.notes }}</span>
									</div>
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
import {computed, ref, watch} from 'vue'
import DateRangePicker from '@/components/general/dateTime/DateRangePicker.vue'
import {Calendar} from '@/dtos/response/activityPlanning/Calendar.ts'
import {CalendarFilter} from '@/dtos/request/activityPlanning/CalendarFilter.ts'
import {useCalendarQuery} from '@/composables/ConcretesCrudComposable.ts'
import router from '@/plugins/router.ts';
import {useDayPlannerStore} from '@/stores/dayPlanner/dayPlannerStore.ts';
import {useMoment} from '@/scripts/momentHelper.ts';

const {usStringToUrlString} = useMoment()
const {fetchFiltered} = useCalendarQuery()

const store = useDayPlannerStore();
// Calendar data from backend
const calendarData = ref<Calendar[]>([])
const loading = ref(false)

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

// All days of the week (1-7 indexing to match backend)
const allDays = [
	{index: 1, name: 'Monday', shortName: 'Mon', isWeekend: false},
	{index: 2, name: 'Tuesday', shortName: 'Tue', isWeekend: false},
	{index: 3, name: 'Wednesday', shortName: 'Wed', isWeekend: false},
	{index: 4, name: 'Thursday', shortName: 'Thu', isWeekend: false},
	{index: 5, name: 'Friday', shortName: 'Fri', isWeekend: false},
	{index: 6, name: 'Saturday', shortName: 'Sat', isWeekend: true},
	{index: 7, name: 'Sunday', shortName: 'Sun', isWeekend: true}
]

// Compute visible day headers based on visibility mode
const visibleDayHeaders = computed(() => {
	if (dayVisibility.value === 'workdays') {
		return allDays.filter(day => !day.isWeekend)
	} else if (dayVisibility.value === 'weekend') {
		return allDays.filter(day => day.index >= 5) // Fri, Sat, Sun
	}
	return allDays
})

// Number of columns based on visibility
const numColumns = computed(() => visibleDayHeaders.value.length)

// Fetch calendar data from backend
async function fetchCalendarData() {
	if (!dateRange.value.start || !dateRange.value.end) {
		calendarData.value = []
		return
	}

	loading.value = true
	try {
		const filter = new CalendarFilter(dateRange.value.start, dateRange.value.end)
		calendarData.value = await fetchFiltered(filter)
		console.log(calendarData.value)
	} catch (error) {
		console.error('Error fetching calendar data:', error)
		calendarData.value = []
	} finally {
		loading.value = false
	}
}

// Watch date range changes
watch(dateRange, () => {
	fetchCalendarData()
}, {deep: true})

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

	// Group calendar data by week
	const weekMap = new Map<string, Map<number, Calendar>>()

	calendarData.value.forEach(cal => {
		const parts = cal.date.split('-').map(Number)
		const year = parts[0]
		const month = parts[1]
		const day = parts[2]

		if (!year || !month || !day) {
			console.warn(`Invalid date format: ${cal.date}`)
			return
		}

		const date = new Date(year, month - 1, day)

		// Find the Monday of this date's week
		const dayOfWeek = date.getDay()
		const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1
		const monday = new Date(date)
		monday.setDate(date.getDate() - daysToMonday)
		monday.setHours(0, 0, 0, 0)

		const weekKey = monday.toISOString().slice(0, 10)

		if (!weekMap.has(weekKey)) {
			weekMap.set(weekKey, new Map())
		}
		weekMap.get(weekKey)!.set(cal.dayIndex, cal)
	})

	// Build week arrays
	const weeks: (Calendar | null)[][] = []
	const currentDate = new Date(weekStart)

	while (currentDate <= weekEnd) {
		const weekKey = currentDate.toISOString().slice(0, 10)
		const weekData = weekMap.get(weekKey) || new Map()

		// Initialize week array
		const week: (Calendar | null)[] = new Array(visibleDayHeaders.value.length).fill(null)

		// Place each day in the correct column based on visibility
		weekData.forEach((cal, dayIndex) => {
			const columnIndex = visibleDayHeaders.value.findIndex(day => day.index === dayIndex)
			if (columnIndex !== -1) {
				week[columnIndex] = cal
			}
		})

		// Only add weeks that have at least one visible day
		if (week.some(day => day !== null)) {
			weeks.push(week)
		}

		// Move to the next week
		currentDate.setDate(currentDate.getDate() + 7)
	}

	return weeks
})

// Format date for cell display
function formatCellDate(dateString: string): string {
	const date = new Date(dateString)
	return date.toLocaleDateString('cs-CZ', {
		day: 'numeric',
		month: 'short'
	})
}

// Handle day click
function handleDayClick(dayData: Calendar | null) {
	if (!dayData) return
	router.push({name: 'dayPlanner', params: {date: usStringToUrlString(dayData.date)}, state: {calendarId: dayData.id}})
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
fetchCalendarData()
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
	border-bottom: 2px solid rgb(var(--v-theme-neutral-400));
	background-color: rgb(var(--v-theme-surface));
	flex-shrink: 0;
}

.day-header {
	padding: 12px 8px 0 8px;
	text-align: center;
	border-right: 1px solid rgba(var(--v-border-color), 0.3);
	font-weight: 600;
	font-size: 14px;
	color: rgb(var(--v-theme-on-surface));
}

.day-header:last-child {
	border-right: none;
}

.day-header.weekend {
	background: linear-gradient(to bottom, rgba(var(--v-theme-primary), 0.12), rgba(var(--v-theme-primary), 0.08));
	font-weight: 700;
	color: rgb(var(--v-theme-on-surface));
}

.calendar-body {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow-y: hidden;
	overflow-x: hidden;
	min-height: 0;
}

.calendar-week {
	display: grid;
	grid-template-columns: repeat(var(--calendar-columns, 7), 1fr);
	flex: 1;
	min-height: 150px;
}

.day-cell {
	border-right: 1px solid rgba(var(--v-border-color), 0.3);
	border-bottom: 1px solid rgba(var(--v-border-color), 0.3);
	display: flex;
	flex-direction: column;
	cursor: pointer;
	transition: transform 0.2s ease, box-shadow 0.2s ease;
	min-height: 100%;
	position: relative;
	overflow: hidden;
	will-change: transform;
}

.day-cell:last-child {
	border-right: none;
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
	background: linear-gradient(to bottom, rgba(var(--v-theme-primary), 0.08), rgba(var(--v-theme-primary), 0.04));
	border-left: 2px solid rgba(var(--v-theme-primary), 0.3);
}

.day-cell.weekend:hover:not(.empty) {
	background: rgb(var(--v-theme-surface)) !important;
}

.day-cell.today:not(.empty) {
	background: linear-gradient(rgba(var(--v-theme-secondary), 0.08), rgba(var(--v-theme-secondary), 0.08)),
	rgb(var(--v-theme-surface));
}

.day-cell.today:hover:not(.empty) {
	background: linear-gradient(rgba(var(--v-theme-secondary), 0.08), rgba(var(--v-theme-secondary), 0.08)),
	rgb(var(--v-theme-surface)) !important;
}

.day-cell.empty {
	background-color: rgba(var(--v-border-color), 0.05);
	cursor: default;
}

/* Cell header */
.cell-header {
	padding: 10px 12px;
	border-bottom: 2px solid rgba(var(--v-border-color), 0.25);
	flex-shrink: 0;
	background: linear-gradient(to bottom, rgba(var(--v-theme-surface), 0.8), transparent);
	min-height: 48px;
	display: flex;
	align-items: center;
}

.header-top {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 8px;
	width: 100%;
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

.day-cell.today .cell-date-text {
	border: 2px solid rgb(var(--v-theme-secondary));
	border-radius: 6px;
	padding: 4px 10px;
	color: white;
	font-weight: 800;
}

.cell-label-chip {
	font-weight: 600;
	letter-spacing: 0.3px;
	flex-shrink: 1;
	min-width: 0;
	align-self: center;
}

/* Cell content */
.cell-content {
	flex: 1;
	padding: 8px;
	overflow-y: auto;
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.cell-info {
	display: flex;
	align-items: flex-start;
	font-size: 13px;
	color: rgb(var(--v-theme-on-surface));
	line-height: 1.5;
	gap: 4px;
	padding: 4px 0;
}

.cell-info.tasks-info {
	padding: 6px 8px;
	background-color: rgba(var(--v-border-color), 0.12);
	border-radius: 6px;
	border: 1px solid rgba(var(--v-border-color), 0.15);
}

.cell-info.secondary-info {
	padding: 4px 0;
	opacity: 0.9;
}

.cell-info.secondary-info .info-text {
	font-size: 12px;
}

.info-text {
	flex: 1;
}

.tasks-progress {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 4px;
}

.cell-info.notes {
	max-width: 100%;
}

.cell-info .text-truncate {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
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

	.cell-header {
		padding: 8px 10px 8px 14px;
	}

	.cell-date-text {
		font-size: 13px;
	}

	.cell-content {
		padding: 10px;
		gap: 8px;
	}

	.cell-info {
		font-size: 12px;
	}

	.cell-info.tasks-info {
		padding: 5px 6px;
	}
}

@media (max-width: 600px) {
	.day-header {
		font-size: 12px;
		padding: 8px 4px;
	}

	.cell-header {
		padding: 6px 8px 6px 12px;
	}

	.cell-date-text {
		font-size: 12px;
	}

	.header-top {
		flex-direction: column;
		align-items: flex-start;
		gap: 4px;
	}

	.cell-content {
		padding: 8px;
		gap: 6px;
	}

	.cell-info {
		font-size: 11px;
	}
}
</style>