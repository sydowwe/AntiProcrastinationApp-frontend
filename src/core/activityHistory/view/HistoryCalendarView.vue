<template>
	<div class="px-2 pt-6 w-100 h-100 d-flex flex-column">
		<!-- Header — the siblings' row, minus the controls the calendar does not have. -->
		<div class="w-100 d-flex align-center ga-6 flex-wrap">
			<VIconBtn
				icon="chart-line"
				variant="tonal"
				style="margin-right: -12px"
				@click="router.push({ name: 'activityHistory' })"
			>
				<VIcon icon="chart-line" />
				<VTooltip
					activator="parent"
					location="bottom"
				>
					{{ $t('history.calendar.openSummary') }}
				</VTooltip>
			</VIconBtn>
			<h1 class="text-h4">{{ $t('history.calendar.title') }}</h1>
		</div>

		<!-- Failed range: outside the grid, which is framework and has no error slot (F27). -->
		<HistoryErrorState
			v-if="!loading && error"
			class="mt-4 mb-2"
			@retry="retry"
		/>
		<!-- Empty range: explain rather than show a grid of identical grey cells with no context (H7). -->
		<HistoryFirstRunState
			v-else-if="!loading && allDaysEmpty && hasAnyHistoryEver === false"
			compact
			class="mt-4 mb-2"
		/>
		<HistoryEmptyState
			v-else-if="!loading && allDaysEmpty"
			icon="fas fa-calendar"
			:message="$t('history.calendar.noActivityInRange')"
			class="mt-4 mb-2"
		/>
		<!-- `flex-fill` + `min-height: 0` keep `CalendarGrid`'s `height: 100%` chain resolving below the
		     header, so the grid scrolls inside its card instead of pushing the footer off-screen. -->
		<CalendarGrid
			class="py-4 flex-fill"
			style="min-height: 0"
			:days
			:loading
			:firstDayOfWeek
			@dayClick="handleDayClick"
			@dateRangeChange="fetchCalendarActivity"
		>
			<template #day-cell-content="{ day }">
				<HistoryDayCellContent :day="asDaySummary(day)" />
			</template>
		</CalendarGrid>
	</div>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import CalendarGrid from '@/_common/component/calendar/CalendarGrid.vue'
	import router from '@/router.ts'
	import {
		getCalendarActivitySummary,
		getHasAnyHistoryEver,
	} from '@/core/historyDashboard/api/historyDashboardApi.ts'
	import { CalendarActivityDaySummary } from '@/core/historyDashboard/dto/response/CalendarActivityDaySummary.ts'
	import { CalendarActivityRequest } from '@/core/activityHistory/dto/request/CalendarActivityRequest.ts'
	import { formatDateForApi } from '@/_common/utils/DateTimeHelper.ts'
	import { useUserPreferences } from '@/core/user/composable/useUserPreferences.ts'
	import HistoryFirstRunState from '@/core/historyDashboard/component/HistoryFirstRunState.vue'
	import HistoryEmptyState from '@/core/historyDashboard/component/HistoryEmptyState.vue'
	import HistoryDayCellContent from '@/core/historyDashboard/component/HistoryDayCellContent.vue'
	import HistoryErrorState from '@/core/historyDashboard/component/HistoryErrorState.vue'

	type CalendarRange = { start: Date | null; end: Date | null }

	const days = ref<CalendarActivityDaySummary[]>([])
	const loading = ref(false)
	const { firstDayOfWeek } = useUserPreferences()

	// H7: distinguishes "nothing in this month" from "never recorded anything" — see the composable
	// version of this check in useHistoryDashboard.ts for the reasoning; the calendar view has no
	// composable of its own, so it re-fetches this small existence check directly.
	const hasAnyHistoryEver = ref<boolean | null>(null)
	const allDaysEmpty = computed(() => days.value.length > 0 && days.value.every(d => d.totalSeconds === 0))

	// `CalendarGrid` emits the range only when it changes, so Retry needs the last one held here.
	const lastRange = ref<CalendarRange | null>(null)
	const error = ref(false)

	// A failure clears `days` rather than keeping the previous month's rows: the grid looks weeks up by
	// date, so stale rows rendered a blank card that was neither empty nor an error. Both awaits are
	// caught because `dateRangeChange` does not await this, and a rejection escaped it (F27).
	async function fetchCalendarActivity(range: CalendarRange) {
		lastRange.value = range
		error.value = false
		if (!range.start || !range.end) {
			days.value = []
			return
		}
		loading.value = true
		try {
			const request = new CalendarActivityRequest(formatDateForApi(range.start), formatDateForApi(range.end), 3)
			days.value = fillMissingDays(await getCalendarActivitySummary(request), range.start, range.end)
		} catch {
			days.value = []
			error.value = true
			return
		} finally {
			loading.value = false
		}
		if (allDaysEmpty.value && hasAnyHistoryEver.value === null) {
			// Left unresolved on failure — see the same check in useHistoryDashboard.ts.
			try {
				hasAnyHistoryEver.value = await getHasAnyHistoryEver()
			} catch {
				hasAnyHistoryEver.value = null
			}
		}
	}

	function retry() {
		if (lastRange.value) fetchCalendarActivity(lastRange.value)
	}

	/**
	 * B2: the response carries one entry per *existing calendar row*, not per day of the requested range,
	 * and rows are only seeded for the current and next year. A range in a past year therefore comes back
	 * short or empty — and `CalendarGrid` drops a week whose days are all missing, so the user sees a
	 * blank month with no explanation rather than a month of unrecorded days.
	 *
	 * So build the range here and look each day up by `date`; never assume index alignment or length.
	 */
	function fillMissingDays(
		response: CalendarActivityDaySummary[],
		start: Date,
		end: Date,
	): CalendarActivityDaySummary[] {
		const byDate = new Map(response.map(day => [day.date, day]))
		const filled: CalendarActivityDaySummary[] = []
		const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate())
		const last = new Date(end.getFullYear(), end.getMonth(), end.getDate())
		while (cursor <= last) {
			const date = formatDateForApi(cursor)
			filled.push(byDate.get(date) ?? CalendarActivityDaySummary.placeholder(date))
			cursor.setDate(cursor.getDate() + 1)
		}
		return filled
	}

	function asDaySummary(day: unknown): CalendarActivityDaySummary {
		return day as CalendarActivityDaySummary
	}

	function handleDayClick(day: unknown) {
		const summary = day as CalendarActivityDaySummary
		router.push({ name: 'activityHistoryDetail', query: { date: summary.date } })
	}
</script>
