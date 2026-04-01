<template>
	<VCard class="pa-5">
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

		<template v-else-if="!processes || processes.length === 0">
			<VCard
				variant="outlined"
				class="pa-8 text-center"
			>
				<div class="text-h6 text-medium-emphasis">No activity recorded for this period</div>
			</VCard>
		</template>

		<template v-else>
			<div class="d-flex ga-2">
				<div class="chart-column">
					<ActivityPieChart
						v-model="viewMode"
						:domains="pieSegments"
						:selectedDomain="selectedProductName ?? ''"
						@segmentClick="onSegmentClick"
					/>
				</div>

				<div class="flex-fill">
					<template v-if="detailsLoading">
						<VSkeletonLoader type="card" />
					</template>
					<DesktopProcessDetailsPanel
						v-else-if="processDetails"
						:details="processDetails"
						@close="onClose"
					/>
					<VCard
						v-else
						variant="outlined"
						class="pa-4"
					>
						<div class="details-grid">
							<div class="detail-row">
								<span class="text-medium-emphasis">Total time:</span>
								<span class="font-weight-medium">{{ formatDuration(totals?.totalSeconds ?? 0) }}</span>
							</div>
							<div class="detail-row">
								<span class="text-medium-emphasis">Active:</span>
								<span>{{ formatDuration(totals?.activeSeconds ?? 0) }}</span>
							</div>
							<div class="detail-row">
								<span class="text-medium-emphasis">Background:</span>
								<span>{{ formatDuration(totals?.backgroundSeconds ?? 0) }}</span>
							</div>
							<VDivider class="my-2" />
							<div class="detail-row">
								<span class="text-medium-emphasis">Processes:</span>
								<span>{{ totals?.totalProcesses ?? 0 }}</span>
							</div>
							<div class="detail-row">
								<span class="text-medium-emphasis">Window titles:</span>
								<span>{{ totals?.totalWindowTitles ?? 0 }}</span>
							</div>
							<div class="detail-row">
								<span class="text-medium-emphasis">Entries:</span>
								<span>{{ totals?.totalEntries ?? 0 }}</span>
							</div>
						</div>
					</VCard>
				</div>
			</div>
		</template>
	</VCard>
</template>

<script setup lang="ts">
	import { computed, ref, watch } from 'vue'
	import ActivityPieChart from '@/components/activityTracking/pieChart/ActivityPieChart.vue'
	import DesktopProcessDetailsPanel from './DesktopProcessDetailsPanel.vue'
	import { getDomainColor } from '@/utils/domainColor'
	import type { PieSegment } from '@/components/activityTracking/pieChart/PieSegment.ts'
	import { formatDuration } from '@/utils/formatDuration'
	import { getDesktopProcessDetails } from '@/api/desktopActivityTrackingApi.ts'
	import type { DesktopProcessPieData } from '@/dtos/response/activityTracking/desktop/DesktopProcessPieData.ts'
	import type { DesktopPieTotals } from '@/dtos/response/activityTracking/desktop/DesktopPieTotals.ts'
	import type { DesktopProcessDetailsResponse } from '@/dtos/response/activityTracking/desktop/DesktopProcessDetailsResponse.ts'

	const props = defineProps<{
		processes: DesktopProcessPieData[]
		totals?: DesktopPieTotals
		loading?: boolean
		from: Date
		to: Date
	}>()

	const selectedProductName = defineModel<string | null>('selectedProductName', { default: null })

	const viewMode = ref<'total' | 'active' | 'background'>('total')
	const processDetails = ref<DesktopProcessDetailsResponse | null>(null)
	const detailsLoading = ref(false)

	const pieSegments = computed<PieSegment[]>(() => {
		const metric = viewMode.value

		const data = props.processes
			.map(p => ({
				domain: p.productName,
				seconds:
					metric === 'total' ? p.totalSeconds : metric === 'active' ? p.activeSeconds : p.backgroundSeconds,
				color: getDomainColor(p.processName),
			}))
			.filter(d => d.seconds > 0)

		const total = data.reduce((sum, d) => sum + d.seconds, 0)
		if (total === 0) return []

		return data.map(d => ({ ...d, percent: (d.seconds / total) * 100 })).sort((a, b) => b.seconds - a.seconds)
	})

	watch(selectedProductName, async productName => {
		if (!productName) {
			processDetails.value = null
			return
		}
		const proc = props.processes.find(p => p.productName === productName)
		if (!proc) return

		detailsLoading.value = true
		try {
			processDetails.value = await getDesktopProcessDetails(
				proc.processName,
				props.from.toISOString(),
				props.to.toISOString(),
			)
		} finally {
			detailsLoading.value = false
		}
	})

	function onSegmentClick(productName: string | null) {
		selectedProductName.value = selectedProductName.value === productName ? null : productName
	}

	function onClose() {
		selectedProductName.value = null
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
