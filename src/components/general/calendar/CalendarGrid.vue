<template>
	<div class="calendar-grid-view">
		<!-- Calendar Grid -->
		<VCard
			elevation="2"
			class="calendar-card"
			rounded
			:loading="loading"
		>
			<!-- Controls header -->
			<VCardTitle
				class="d-flex align-center justify-space-between flex-wrap ga-2 px-4 py-3"
				style="border-bottom: 1px solid rgba(var(--v-border-color), 0.5)"
			>
				<div class="d-flex ga-3">
					<DateRangePicker
						v-model="dateRange"
						:mode="dateRangeMode"
						density="compact"
					/>
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

				<slot name="toolbar-center" />
				<div class="d-flex align-center ga-2 flex-wrap">
					<slot name="toolbar-end" />
				</div>
			</VCardTitle>
			<VDivider />
			<VCardText class="pa-0">
				<div
					class="calendar-container"
					:style="{ '--calendar-columns': numColumns }"
				>
					<!-- Day Headers -->
					<div class="calendar-header">
						<div
							v-for="day in visibleDayHeaders"
							:key="day.index"
							class="day-header"
							:class="{ weekend: day.isWeekend }"
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
							<CalendarDayCell
								v-for="(dayData, dayIndex) in week"
								:key="dayIndex"
								:dayData
								:selected="!!dayData && selectedIds.includes(dayData.id)"
								@click="handleDayClick"
							>
								<template #default="{ day }">
									<slot
										name="day-cell-content"
										:day="day"
									/>
								</template>
							</CalendarDayCell>
						</div>
					</div>
				</div>
			</VCardText>
			<VCardActions
				class="px-4 py-3 d-flex align-center justify-space-between flex-wrap ga-2"
				style="border-top: 1px solid rgba(var(--v-border-color), 0.5)"
			>
				<div class="d-flex align-center ga-2">
					<VChip
						v-for="holiday in holidays"
						:key="holiday.id"
						class="px-2 text-caption"
						rounded="sm"
						tonal
						color="error"
					>
						{{ formatToDateWithDay(holiday.date) }} - {{ holiday.holidayName }}
					</VChip>
				</div>
				<div style="position: absolute; left: 50%; transform: translateX(-50%)">
					<slot name="footer-center" />
				</div>
			</VCardActions>
		</VCard>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import DateRangePicker from '@/components/general/dateTime/DateRangePicker.vue'
	import CalendarDayCell from '@/components/general/calendar/CalendarDayCell.vue'
	import { CalendarFilter } from '@/dtos/request/activityPlanning/CalendarFilter.ts'
	import { useCalendarQuery } from '@/api/calendarApi.ts'
	import type { ICalendar } from '@/dtos/response/activityPlanning/ICalendar.ts'
	import { allDaysOfWeek, useDateTime } from '@/utils/DateTimeHelper.ts'
	import { useCalendarWeeks } from '@/composables/general/useCalendarWeeks.ts'

	const {
		dateRangeMode = 'month',
		minRowHeight = 220,
		fetchFn,
		selectedIds = [],
	} = defineProps<{
		dateRangeMode?: 'range' | 'month' | 'duration'
		minRowHeight?: number
		fetchFn?: (filter: CalendarFilter) => Promise<ICalendar[]>
		selectedIds?: number[]
	}>()

	const emit = defineEmits<{
		dayClick: [day: ICalendar]
	}>()

	defineSlots<{
		'toolbar-center'(): any
		'toolbar-end'(): any
		'day-cell-content'(props: { day: ICalendar }): any
		'footer-center'(): any
	}>()

	const { formatToDateWithDay } = useDateTime()

	const { fetchFiltered } = useCalendarQuery()

	const calendarData = ref<ICalendar[]>([])
	const loading = ref(false)

	const dateRange = ref<{ start: Date | null; end: Date | null }>({
		start: new Date(),
		end: new Date(),
	})

	const holidays = computed(() => calendarData.value.filter(cal => cal.holidayName))

	type DayVisibility = 'all' | 'workdays' | 'weekend'
	const dayVisibility = ref<DayVisibility>('all')

	const dayVisibilityOptions = [
		{ label: 'All Week', value: 'all' },
		{ label: 'Workdays (Mon-Fri)', value: 'workdays' },
		{ label: 'Weekend (Fri-Sun)', value: 'weekend' },
	]

	const visibleDayHeaders = computed(() => {
		if (dayVisibility.value === 'workdays') {
			return allDaysOfWeek.filter(day => !day.isWeekend)
		} else if (dayVisibility.value === 'weekend') {
			return allDaysOfWeek.filter(day => day.index >= 5)
		}
		return allDaysOfWeek
	})

	const numColumns = computed(() => visibleDayHeaders.value.length)

	const { calendarWeeks } = useCalendarWeeks(calendarData, dateRange, visibleDayHeaders)

	async function fetchCalendarData() {
		if (!dateRange.value.start || !dateRange.value.end) {
			calendarData.value = []
			return
		}

		loading.value = true
		try {
			const filter = new CalendarFilter(dateRange.value.start, dateRange.value.end)
			calendarData.value = fetchFn ? await fetchFn(filter) : await fetchFiltered(filter)
		} catch (error) {
			console.error('Error fetching calendar data:', error)
			calendarData.value = []
		} finally {
			loading.value = false
		}
	}

	watch(
		dateRange,
		() => {
			fetchCalendarData()
		},
		{ deep: true },
	)

	function handleDayClick(dayData: ICalendar) {
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
			end: sunday,
		}
	}

	function refresh() {
		fetchCalendarData()
	}

	initializeCurrentWeek()

	defineExpose({ calendarData, dateRange, loading, refresh })
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
		border: 1px solid rgba(var(--v-border-color), 0.5);
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
		padding-right: 16px;
	}

	.day-header {
		padding: 8px;
		text-align: center;
		border-right: 1px solid rgb(var(--v-border-color));
		font-weight: 600;
		font-size: 14px;
		color: rgb(var(--v-theme-on-surface));
	}

	.day-header:last-child {
		border-right: none;
	}

	.day-header.weekend {
		background-color: rgba(var(--v-theme-primary), 0.08);
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

	/* Dynamic column count based on visibility mode */
	.calendar-header,
	.calendar-week {
		--calendar-columns: 7;
	}

	/* Responsive adjustments */
	@media (max-width: 600px) {
		.day-header {
			font-size: 12px;
			padding: 8px 4px;
		}
	}
</style>
