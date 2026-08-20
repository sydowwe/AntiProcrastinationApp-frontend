<template>
	<WidgetCard
		:title="$t('home.activityHistory')"
		:openRoute="{ name: 'activityHistoryDetail', query: { date: todayIsoDate } }"
		:loading="loading"
		:refreshing="refreshing"
		:error="error"
		:errorText="$t('home.loadFailedHistory')"
		:empty="!pieData || pieData.items.length === 0"
		:emptyText="$t('home.noHistory')"
		@retry="load"
	>
		<div class="d-flex align-center ga-2 mb-2">
			<VIcon
				icon="fas fa-clock"
				color="primary"
				size="18"
			/>
			<span class="text-body-1 font-weight-medium">{{ $t('home.totalTracked') }}:</span>
			<span class="text-body-1 text-primary font-weight-bold">{{ totalTrackedFormatted }}</span>
		</div>
		<HistoryPieChart
			:items="pieData?.items ?? []"
			:selectedGroup="selectedGroup"
			@segmentClick="selectedGroup = $event"
			isNarrow
		/>
	</WidgetCard>
</template>

<script setup lang="ts">
	import { computed, ref } from 'vue'
	import { getDetailPieChart } from '@/core/historyDashboard/api/historyDashboardApi.ts'
	import { DetailPieChartRequest } from '@/core/historyDashboard/dto/request/historyDetail/DetailPieChartRequest.ts'
	import { HistoryGroupBy } from '@/core/historyDashboard/component/types/HistoryGroupBy.ts'
	import type { HistoryPieChartResponse } from '@/core/historyDashboard/dto/response/HistoryPieChartResponse.ts'
	import type { HistoryGroupKey } from '@/core/historyDashboard/dto/HistoryGroupKey.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { fromSeconds } from '@/_common/utils/formatDuration.ts'
	import HistoryPieChart from '@/core/historyDashboard/component/pieChart/HistoryPieChart.vue'
	import WidgetCard from '@/core/home/component/WidgetCard.vue'
	import { todayIsoDate, useDashboardRefresh } from '@/core/home/composable/useDashboardRefresh.ts'

	const pieData = ref<HistoryPieChartResponse | null>(null)
	const loading = ref(true)
	const refreshing = ref(false)
	const error = ref(false)
	const selectedGroup = ref<HistoryGroupKey | null>(null)
	// Guards against an older load's response landing after a newer one — harmless before Retry
	// existed (only one load could ever be in flight), not harmless now that a load can overlap
	// the one it is retrying.
	let loadToken = 0

	const totalTrackedFormatted = computed(() => {
		if (!pieData.value) return '0m'
		return fromSeconds(pieData.value.totals.totalSeconds)
	})

	/**
	 * `background` is what a dashboard refresh uses: the pie stays on screen instead of collapsing
	 * to a spinner, and an existing error is left standing until the refetch actually succeeds.
	 */
	async function load({ background = false } = {}) {
		const token = ++loadToken
		if (background) refreshing.value = true
		else loading.value = true
		try {
			const request = new DetailPieChartRequest(
				HistoryGroupBy.Activity,
				10,
				// Read here rather than captured at setup, so a rollover asks for the new day.
				todayIsoDate.value,
				new Time(0, 0),
				new Time(23, 59),
			)
			const result = await getDetailPieChart(request)
			if (token !== loadToken) return
			pieData.value = result
			error.value = false
		} catch {
			if (token !== loadToken) return
			error.value = true
		} finally {
			if (token === loadToken) {
				loading.value = false
				refreshing.value = false
			}
		}
	}

	function refresh() {
		return load({ background: true })
	}

	// This one moves whenever a timer finishes — anywhere, including the tracking dialog in the now
	// bar two widgets away, which is why `onTrackingSession` exists. Everything else that writes
	// history happens in another view or on another phone, so visibility covers it and a poll does
	// not earn its requests.
	useDashboardRefresh('home:activityHistory', {
		load,
		refresh,
		hasError: () => error.value,
		onTrackingSession: true,
	})
</script>
