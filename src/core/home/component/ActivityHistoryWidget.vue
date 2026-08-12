<template>
	<WidgetCard
		:title="$t('home.activityHistory')"
		:openRoute="{ name: 'activityHistoryDetail', query: { date: today } }"
		:loading="loading"
		:empty="!pieData || pieData.items.length === 0"
		:emptyText="$t('home.noHistory')"
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
	import { computed, onMounted, ref } from 'vue'
	import { getDetailPieChart } from '@/core/historyDashboard/api/historyDashboardApi.ts'
	import { DetailPieChartRequest } from '@/core/historyDashboard/dto/request/historyDetail/DetailPieChartRequest.ts'
	import { HistoryGroupBy } from '@/core/historyDashboard/component/types/HistoryGroupBy.ts'
	import type { HistoryPieChartResponse } from '@/core/historyDashboard/dto/response/HistoryPieChartResponse.ts'
	import { Time } from '@/_common/dto/dto/Time.ts'
	import { fromSeconds } from '@/_common/utils/formatDuration.ts'
	import HistoryPieChart from '@/core/historyDashboard/component/pieChart/HistoryPieChart.vue'
	import WidgetCard from '@/core/home/component/WidgetCard.vue'
	import { formatDateForApi } from '@/_common/utils/DateTimeHelper.ts'

	const today = formatDateForApi(new Date('2026-04-10'))

	const pieData = ref<HistoryPieChartResponse | null>(null)
	const loading = ref(true)
	const selectedGroup = ref<string | null>(null)

	const totalTrackedFormatted = computed(() => {
		if (!pieData.value) return '0m'
		return fromSeconds(pieData.value.totals.totalSeconds)
	})

	async function load() {
		loading.value = true
		try {
			const request = new DetailPieChartRequest(
				HistoryGroupBy.Activity,
				10,
				today,
				new Time(0, 0),
				new Time(23, 59),
			)
			pieData.value = await getDetailPieChart(request)
		} catch {
			pieData.value = null
		} finally {
			loading.value = false
		}
	}

	onMounted(load)
</script>
