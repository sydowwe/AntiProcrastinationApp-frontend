<template>
	<VCard class="h-100 pa-5">
		<template v-if="loading">
			<div class="d-flex ga-4">
				<div class="flex-1-1">
					<VSkeletonLoader type="image, list-item@3" />
				</div>
				<div class="flex-1-1">
					<VSkeletonLoader type="card" />
				</div>
			</div>
		</template>

		<template v-else-if="!data || data.items.length === 0">
			<HistoryEmptyState
				icon="fas fa-chart-pie"
				:message="$t('activityTracking.common.noDataForPeriod')"
				:periodLabel
			/>
		</template>

		<template v-else>
			<div class="d-flex ga-2">
				<div class="flex-fill">
					<HistoryPieChart
						:items="data.items"
						:selectedGroup="selectedGroup"
						@segmentClick="handleSegmentClick"
					/>
				</div>
				<VCard
					variant="outlined"
					style="min-width: 200px; max-width: 250px"
				>
					<VCardTitle class="d-flex align-center justify-space-between">
						<span>{{ detailsHeader }}</span>
						<VBtn
							v-if="selectedGroup"
							class="ml-3"
							icon="fa-xmark"
							variant="text"
							size="small"
							density="compact"
							@click="handleSegmentClick(null)"
						/>
					</VCardTitle>
					<VDivider />
					<VCardText>
						<div class="details-grid">
							<template v-if="selectedGroupItem">
								<div class="detail-row">
									<span class="text-medium-emphasis">
										{{ $t('activityTracking.common.totalTime') }}
									</span>
									<span class="text-high-emphasis font-weight-medium">
										{{ fromSeconds(selectedGroupItem.totalSeconds) }}
									</span>
								</div>
								<div class="detail-row">
									<span class="text-medium-emphasis">
										{{ $t('activityTracking.common.entries') }}
									</span>
									<span>{{ selectedGroupItem.entries }}</span>
								</div>
							</template>
							<template v-else>
								<div class="detail-row">
									<span class="text-medium-emphasis">
										{{ $t('activityTracking.common.totalTime') }}
									</span>
									<span class="text-high-emphasis font-weight-medium">
										{{ fromSeconds(data.totals.totalSeconds) }}
									</span>
								</div>
								<div class="detail-row">
									<span class="text-medium-emphasis">
										{{ $t('historyDashboard.pieChart.totalEntries') }}
									</span>
									<span>{{ data.totals.totalEntries }}</span>
								</div>
								<div class="detail-row">
									<span class="text-medium-emphasis">
										{{ $t('historyDashboard.pieChart.uniqueGroups') }}
									</span>
									<span>{{ data.totals.uniqueGroups }}</span>
								</div>
							</template>
						</div>
					</VCardText>
				</VCard>
			</div>
		</template>
	</VCard>
</template>

<script setup lang="ts">
	import { computed } from 'vue'
	import { useI18n } from 'vue-i18n'
	import HistoryPieChart from './HistoryPieChart.vue'
	import HistoryEmptyState from '@/core/historyDashboard/component/HistoryEmptyState.vue'
	import { fromSeconds } from '@/_common/utils/formatDuration.ts'
	import type { HistoryPieChartResponse } from '@/core/historyDashboard/dto/response/HistoryPieChartResponse.ts'
	import {
		historyGroupKey,
		isSameHistoryGroup,
		type HistoryGroupKey,
	} from '@/core/historyDashboard/dto/HistoryGroupKey.ts'

	const props = defineProps<{
		data: HistoryPieChartResponse | null
		loading?: boolean
		/** Formatted date/range the empty state should name — see H7. */
		periodLabel?: string
	}>()

	const selectedGroup = defineModel<HistoryGroupKey | null>('selectedGroup', { default: null })

	const { t } = useI18n()

	const selectedGroupItem = computed(() => {
		if (!selectedGroup.value || !props.data) return null
		return props.data.items.find(i => isSameHistoryGroup(historyGroupKey(i), selectedGroup.value)) ?? null
	})

	const detailsHeader = computed(() => selectedGroup.value?.name ?? t('historyDashboard.pieChart.periodTotals'))

	function handleSegmentClick(group: HistoryGroupKey | null) {
		selectedGroup.value = group
	}
</script>

<style scoped>
	.details-grid {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
</style>
