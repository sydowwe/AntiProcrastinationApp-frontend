<template>
<div class="calendar-grid-view">
	<!-- Controls -->
	<VCard class="mb-4" elevation="2">
		<VCardText class="d-flex justify-space-between">
			<DateRangePicker v-model="dateRange" :mode="dateRangeMode" density="compact"/>
			<div class="d-flex align-center ga-2">
				<slot name="toolbar-append"/>
				<VSelect
					v-model="dayVisibility"
					label="Days to Show"
					:items="dayVisibilityOptions"
					itemTitle="label"
					minWidth="210px"
					maxWidth="210px"
					hideDetails
					density="compact"
				/>
			</div>
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
						:style="{ 'min-height': minRowHeight + 'px' }"
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
											v-if="dayData.label || dayData.holidayName"
											size="small"
											:color="!['Workday', 'Weekend'].includes(dayData.dayType) ? getDayTypeColor(dayData.dayType) : undefined"
											variant="flat"
											class="cell-label-chip"
										>
											<VIcon :icon="getDayTypeIcon(dayData.dayType)" size="x-small" class="mr-1"/>
											<strong>{{ dayData.label ?? dayData.holidayName }}</strong>
										</VChip>
									</div>
								</div>

								<!-- Slot for content below header -->
								<slot name="day-cell-content" :day="dayData"/>
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
import {getDayTypeColor, getDayTypeIcon} from '@/dtos/enum/DayType.ts'
import type {ICalendar} from '@/dtos/response/activityPlanning/ICalendar.ts'

const props = withDefaults(defineProps<{
	dateRangeMode?: 'range' | 'month' | 'duration'
	minRowHeight?: number
	fetchFn?: (filter: CalendarFilter) => Promise<ICalendar[]>
}>(), {
	dateRangeMode: 'month',
	minRowHeight: 220,
})

const emit = defineEmits<{
	dayClick: [day: ICalendar]
}>()

defineSlots<{
	'toolbar-append'(): any
	'day-cell-content'(props: { day: ICalendar }): any
}>()

const {fetchFiltered} = useCalendarQuery()

const calendarData = ref<ICalendar[]>([])
const loading = ref(false)

const dateRange = ref<{ start: Date | null; end: Date | null }>({
	start: new Date(),
	end: new Date()
})

type DayVisibility = 'all' | 'workdays' | 'weekend'
const dayVisibility = ref<DayVisibility>('all')

const dayVisibilityOptions = [
	{label: 'All Week', value: 'all'},
	{label: 'Workdays (Mon-Fri)', value: 'workdays'},
	{label: 'Weekend (Fri-Sun)', value: 'weekend'}
]

const allDays = [
	{index: 1, name: 'Monday', shortName: 'Mon', isWeekend: false},
	{index: 2, name: 'Tuesday', shortName: 'Tue', isWeekend: false},
	{index: 3, name: 'Wednesday', shortName: 'Wed', isWeekend: false},
	{index: 4, name: 'Thursday', shortName: 'Thu', isWeekend: false},
	{index: 5, name: 'Friday', shortName: 'Fri', isWeekend: false},
	{index: 6, name: 'Saturday', shortName: 'Sat', isWeekend: true},
	{index: 7, name: 'Sunday', shortName: 'Sun', isWeekend: true}
]

const visibleDayHeaders = computed(() => {
	if (dayVisibility.value === 'workdays') {
		return allDays.filter(day => !day.isWeekend)
	} else if (dayVisibility.value === 'weekend') {
		return allDays.filter(day => day.index >= 5)
	}
	return allDays
})

const numColumns = computed(() => visibleDayHeaders.value.length)

async function fetchCalendarData() {
	if (!dateRange.value.start || !dateRange.value.end) {
		calendarData.value = []
		return
	}

	loading.value = true
	try {
		const filter = new CalendarFilter(dateRange.value.start, dateRange.value.end)
		calendarData.value = props.fetchFn
			? await props.fetchFn(filter)
			: await fetchFiltered(filter)
	} catch (error) {
		console.error('Error fetching calendar data:', error)
		calendarData.value = []
	} finally {
		loading.value = false
	}
}

watch(dateRange, () => {
	fetchCalendarData()
}, {deep: true})

const calendarWeeks = computed(() => {
	if (!dateRange.value.start || !dateRange.value.end) {
		return []
	}

	const start = new Date(dateRange.value.start)
	const end = new Date(dateRange.value.end)

	const startDay = start.getDay()
	const daysToMonday = startDay === 0 ? 6 : startDay - 1
	const weekStart = new Date(start)
	weekStart.setDate(start.getDate() - daysToMonday)
	weekStart.setHours(0, 0, 0, 0)

	const endDay = end.getDay()
	const daysToSunday = endDay === 0 ? 0 : 7 - endDay
	const weekEnd = new Date(end)
	weekEnd.setDate(end.getDate() + daysToSunday)
	weekEnd.setHours(23, 59, 59, 999)

	const weekMap = new Map<string, Map<number, ICalendar>>()

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

	const weeks: (ICalendar | null)[][] = []
	const currentDate = new Date(weekStart)

	while (currentDate <= weekEnd) {
		const weekKey = currentDate.toISOString().slice(0, 10)
		const weekData = weekMap.get(weekKey) || new Map()

		const week: (ICalendar | null)[] = new Array(visibleDayHeaders.value.length).fill(null)

		weekData.forEach((cal, dayIndex) => {
			const columnIndex = visibleDayHeaders.value.findIndex(day => day.index === dayIndex)
			if (columnIndex !== -1) {
				week[columnIndex] = cal
			}
		})

		if (week.some(day => day !== null)) {
			weeks.push(week)
		}

		currentDate.setDate(currentDate.getDate() + 7)
	}

	return weeks
})

function formatCellDate(dateString: string): string {
	const date = new Date(dateString)
	return date.toLocaleDateString('cs-CZ', {
		day: 'numeric',
		month: 'short'
	})
}

function handleDayClick(dayData: ICalendar | null) {
	if (!dayData) return
	emit('dayClick', dayData)
}

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

function refresh() {
	fetchCalendarData()
}

initializeCurrentWeek()

defineExpose({calendarData, dateRange, loading, refresh})
</script>

<style scoped>
.calendar-grid-view {
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
	background-color: rgb(var(--v-theme-surface));
}

.calendar-header {
	display: grid;
	grid-template-columns: repeat(var(--calendar-columns, 7), 1fr);
	border-bottom: 2px solid rgb(var(--v-theme-neutral-400));
	background-color: rgb(var(--v-theme-surface));
	flex-shrink: 0;
	padding-right: 15px;
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
	overflow-y: auto;
	overflow-x: hidden;
	min-height: 0;
}

.calendar-week {
	display: grid;
	grid-template-columns: repeat(var(--calendar-columns, 7), 1fr);
	flex: 1;
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
	padding: 6px 6px 6px 10px;
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

/* Dynamic column count based on visibility mode */
.calendar-header,
.calendar-week {
	--calendar-columns: 7;
}

/* Responsive adjustments */
@media (max-width: 960px) {
	.cell-header {
		padding: 8px 10px 8px 14px;
	}

	.cell-date-text {
		font-size: 13px;
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
}
</style>
