<template>
	<VCard style="height: 450px; display: flex; flex-direction: column">
		<VCardTitle class="d-flex align-center justify-space-between px-4 pt-4 pb-2">
			<span class="text-h6">{{ $t('home.activityHistory') }}</span>
			<VIconBtn
				icon="fa-up-right-from-square"
				variant="text"
				size="small"
				@click="router.push({ name: 'activityHistoryDetail', query: { date: today } })"
			/>
		</VCardTitle>
		<VDivider />
		<VCardText style="flex: 1; overflow-y: auto; min-height: 0">
			<div
				v-if="loading"
				class="d-flex justify-center align-center h-100"
			>
				<VProgressCircular indeterminate />
			</div>
			<div
				v-else-if="!pieData || pieData.items.length === 0"
				class="text-center text-medium-emphasis py-4"
			>
				{{ $t('home.noHistory') }}
			</div>
			<template v-else>
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
					:items="pieData.items"
					:selectedGroup="selectedGroup"
					@segmentClick="selectedGroup = $event"
					isNarrow
				/>
			</template>
		</VCardText>
	</VCard>
</template>

<script setup lang="ts">
	import { computed, onMounted, ref } from 'vue'
	import { useRouter } from 'vue-router'
	import { getDetailPieChart } from '@/api/activityHistory/historyDashboardApi.ts'
	import { DetailPieChartRequest } from '@/dtos/request/activityHistory/historyDetail/DetailPieChartRequest.ts'
	import { HistoryGroupBy } from '@/components/historyDashboard/types/HistoryGroupBy.ts'
	import type { HistoryPieChartResponse } from '@/dtos/response/historyDashboard/HistoryPieChartResponse.ts'
	import { Time } from '@/dtos/dto/Time.ts'
	import { formatDuration } from '@/utils/formatDuration.ts'
	import HistoryPieChart from '@/components/historyDashboard/pieChart/HistoryPieChart.vue'
	import { formatDateForApi } from '@/utils/DateTimeHelper.ts'

	const today = formatDateForApi(new Date('2026-04-10'))
	const router = useRouter()

	const pieData = ref<HistoryPieChartResponse | null>(null)
	const loading = ref(true)
	const selectedGroup = ref<string | null>(null)

	const totalTrackedFormatted = computed(() => {
		if (!pieData.value) return '0m'
		return formatDuration(pieData.value.totals.totalSeconds)
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
