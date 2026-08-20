<template>
	<CalendarGrid
		class="py-4"
		:days
		:loading
		:firstDayOfWeek
		@dayClick="handleDayClick"
		@dateRangeChange="fetchCalendarActivity"
	>
		<template #day-cell-content="{ day }">
			<div class="cell-content">
				<!-- Wake/Bed Time — always present on a real row (B2); absent days carry no sleep data -->
				<div
					v-if="asDaySummary(day).hasRecord"
					class="cell-info"
				>
					<VIcon
						icon="fas fa-bed"
						size="small"
						class="mr-1"
					/>
					<span class="info-text">
						{{ asDaySummary(day).wakeUpTime.getString() }} -
						{{ asDaySummary(day).bedTime.getString() }}
					</span>
				</div>

				<!-- Total tracked time + session count -->
				<div
					v-if="asDaySummary(day).totalSeconds > 0"
					class="cell-info total-time"
				>
					<VIcon
						icon="fas fa-clock"
						size="small"
						class="mr-1"
					/>
					<span class="info-text font-weight-bold">{{ fromSeconds(asDaySummary(day).totalSeconds) }}</span>
					<VChip
						size="x-small"
						variant="tonal"
						class="ml-1"
					>
						{{ asDaySummary(day).sessionCount }} sessions
					</VChip>
				</div>

				<!-- Top roles -->
				<div
					v-if="asDaySummary(day).topRoles.length"
					class="roles-list"
				>
					<div
						v-for="role in asDaySummary(day).topRoles"
						:key="role.roleName"
						class="role-item"
					>
						<div
							class="role-color-dot"
							:style="{ backgroundColor: role.color ?? 'rgb(var(--v-theme-primary))' }"
						/>
						<span class="role-name">{{ role.roleName }}</span>
						<span class="role-time">{{ fromSeconds(role.totalSeconds) }}</span>
					</div>
				</div>

				<!-- No calendar row at all — distinct from a row that simply has no activity -->
				<div
					v-if="!asDaySummary(day).hasRecord"
					class="cell-info no-record"
				>
					<VIcon
						icon="fas fa-circle-question"
						size="small"
						class="mr-1"
					/>
					<span class="info-text">Not recorded</span>
				</div>

				<!-- No activity data -->
				<div
					v-else-if="asDaySummary(day).totalSeconds === 0"
					class="cell-info no-data"
				>
					<span class="info-text opacity-50">No activity</span>
				</div>
			</div>
		</template>
	</CalendarGrid>
</template>

<script setup lang="ts">
	import { ref } from 'vue'
	import CalendarGrid from '@/_common/component/calendar/CalendarGrid.vue'
	import router from '@/router.ts'
	import { getCalendarActivitySummary } from '@/core/historyDashboard/api/historyDashboardApi.ts'
	import { CalendarActivityDaySummary } from '@/core/historyDashboard/dto/response/CalendarActivityDaySummary.ts'
	import { CalendarActivityRequest } from '@/core/activityHistory/dto/request/CalendarActivityRequest.ts'
	import { formatDateForApi } from '@/_common/utils/DateTimeHelper.ts'
	import { fromSeconds } from '@/_common/utils/formatDuration.ts'
	import { useUserPreferences } from '@/core/user/composable/useUserPreferences.ts'

	const days = ref<CalendarActivityDaySummary[]>([])
	const loading = ref(false)
	const { firstDayOfWeek } = useUserPreferences()

	async function fetchCalendarActivity(range: { start: Date | null; end: Date | null }) {
		if (!range.start || !range.end) {
			days.value = []
			return
		}
		loading.value = true
		try {
			const request = new CalendarActivityRequest(formatDateForApi(range.start), formatDateForApi(range.end), 3)
			days.value = fillMissingDays(await getCalendarActivitySummary(request), range.start, range.end)
		} finally {
			loading.value = false
		}
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

<style scoped>
	.cell-content {
		flex: 1;
		padding: 8px;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.cell-info {
		display: flex;
		align-items: center;
		font-size: 13px;
		color: rgb(var(--v-theme-on-surface));
		line-height: 1.5;
		gap: 4px;
	}

	.cell-info.no-record {
		font-style: italic;
		opacity: 0.4;
	}

	.cell-info.total-time {
		padding: 4px 8px;
		background-color: rgba(var(--v-border-color), 0.12);
		border-radius: 6px;
		border: 1px solid rgba(var(--v-border-color), 0.15);
	}

	.roles-list {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.role-item {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 12px;
		line-height: 1.4;
		padding: 1px 0;
	}

	.role-color-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.role-name {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.role-time {
		flex-shrink: 0;
		font-weight: 600;
		opacity: 0.8;
	}

	.info-text {
		flex: 1;
	}

	@media (max-width: 960px) {
		.cell-content {
			padding: 6px;
			gap: 4px;
		}

		.cell-info {
			font-size: 12px;
		}

		.role-item {
			font-size: 11px;
		}
	}

	@media (max-width: 600px) {
		.cell-content {
			padding: 4px;
			gap: 3px;
		}

		.cell-info {
			font-size: 11px;
		}

		.role-item {
			font-size: 10px;
		}
	}
</style>
