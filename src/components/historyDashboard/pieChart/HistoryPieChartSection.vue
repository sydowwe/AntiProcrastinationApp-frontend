<template>
<VCard class="pa-5">
	<template v-if="loading">
		<div class="d-flex ga-4">
			<div class="flex-1-1">
				<VSkeletonLoader type="image, list-item@3"/>
			</div>
			<div class="flex-1-1">
				<VSkeletonLoader type="card"/>
			</div>
		</div>
	</template>

	<template v-else-if="!data || data.items.length === 0">
		<div class="d-flex flex-column align-center justify-center pa-8">
			<VIcon icon="fas fa-chart-pie" size="64" class="text-disabled mb-4"/>
			<p class="text-body-1 text-medium-emphasis">No data for this period</p>
		</div>
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
			<VCard variant="outlined" style="min-width: 200px; max-width: 250px">
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
				<VDivider/>
				<VCardText>
					<div class="details-grid">
						<template v-if="selectedGroupItem">
							<div class="detail-row">
								<span class="text-medium-emphasis">Total time:</span>
								<span class="text-high-emphasis font-weight-medium">
									{{ formatDuration(selectedGroupItem.totalSeconds) }}
								</span>
							</div>
							<div class="detail-row">
								<span class="text-medium-emphasis">Entries:</span>
								<span>{{ selectedGroupItem.entries }}</span>
							</div>
						</template>
						<template v-else>
							<div class="detail-row">
								<span class="text-medium-emphasis">Total time:</span>
								<span class="text-high-emphasis font-weight-medium">
									{{ formatDuration(data.totals.totalSeconds) }}
								</span>
							</div>
							<div class="detail-row">
								<span class="text-medium-emphasis">Total entries:</span>
								<span>{{ data.totals.totalEntries }}</span>
							</div>
							<div class="detail-row">
								<span class="text-medium-emphasis">Unique groups:</span>
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
import {computed} from 'vue'
import HistoryPieChart from './HistoryPieChart.vue'
import {formatDuration} from '@/utils/formatDuration.ts'
import type {HistoryPieChartResponse} from '@/dtos/response/historyDashboard/HistoryPieChartResponse.ts'

const props = defineProps<{
	data: HistoryPieChartResponse | null
	loading?: boolean
}>()

const selectedGroup = defineModel<string | null>('selectedGroup', {default: null})

const selectedGroupItem = computed(() => {
	if (!selectedGroup.value || !props.data) return null
	return props.data.items.find(i => i.name === selectedGroup.value) ?? null
})

const detailsHeader = computed(() => selectedGroup.value ?? 'Period Totals')

function handleSegmentClick(name: string | null) {
	selectedGroup.value = name
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
